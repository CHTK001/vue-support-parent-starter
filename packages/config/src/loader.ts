/**
 * 统一配置加载器 —— 按优先级合并多来源配置
 *
 * 优先级（后加载覆盖先加载）：
 *   ① 默认值 defaultAppConfig
 *   ② app.example.yaml（全局默认模板，项目根目录）
 *   ③ app.yaml（本地，apps/{appName}/app.yaml）
 *   ④ app.{env}.yaml（环境级，apps/{appName}/app.{env}.yaml，如 app.dev.yaml）
 *   ⑤ 远程配置（url.setting 拼接 http.baseUrl，远程为主，失败忽略）
 *   ⑥ 环境变量（import.meta.env 中的 VITE_* 映射，本地运行最高优先级）
 *
 * 环境名取 import.meta.env.MODE（development→dev / production→prod，
 * 其余原样使用，如 test），可通过 VITE_APP_ENV 显式覆盖。
 *
 * 任何来源加载失败都回退到已有配置，保证应用始终可启动。
 */
import { load as parseYaml } from "js-yaml";
import {
  defaultAppConfig,
  getConfig,
  mergeAppConfig,
  normalizeTopKey,
  parseAppYaml,
  resetConfig,
  setConfig,
  type AppConfig,
} from "./config";

/** 环境变量（默认取 import.meta.env，便于测试注入） */
export type EnvLike = Record<string, string | undefined>;

/** 加载配置的输入 */
export interface LoadConfigOptions {
  /** 应用名，对应 apps/{appName}/app.yaml；缺省 "default" */
  appName?: string;
  /** 资源基础路径（部署到子路径时用），缺省 "" */
  baseUrl?: string;
  /** app.yaml 完整 URL（缺省自动拼接 apps/{appName}/app.yaml） */
  configUrl?: string;
  /** 环境变量（缺省 import.meta.env） */
  env?: EnvLike;
  /** 是否禁用远程配置拉取（测试用，默认 false） */
  disableRemote?: boolean;
  /** HTTP 请求超时（毫秒），缺省 5000（loader 阶段要快） */
  timeout?: number;
}

/**
 * 拉取并解析一个 yaml 文件的文本内容。
 *
 * 设计要点：
 *   - 不走 @repo/utils/http()（会反向依赖 @repo/config，造成循环）
 *   - 用原生 fetch 统一处理：超时、404/非 yaml 响应（防 SPA fallback 把 HTML 当 yaml）、
 *     解析失败 → 全部静默返回 undefined，让上层沿用已有配置
 *   - Content-Type 必须含 yaml/yaml-like，否则视为非 yaml 响应（SPA fallback 返回
 *     text/html 时会被识别出来，避免污染解析结果）
 *
 * @returns 解析后的 partial 配置；任意环节失败均返回 undefined
 */
async function safeFetchYaml(
  url: string,
  timeout: number,
): Promise<Partial<AppConfig> | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    // 防止 SPA fallback 把 HTML 当 yaml 返回：必须显式声明 yaml-like Content-Type
    // 或响应内容首字符为 yaml 文档标记（--- / key:）。这里以 Content-Type 为准，
    // 缺失时保守拒绝（SPA fallback 通常是 text/html）。
    const ct = String(res.headers.get("content-type") ?? "").toLowerCase();
    const looksLikeYaml =
      ct.includes("yaml") ||
      ct.includes("yml") ||
      ct.includes("x-yaml") ||
      ct === "text/plain" || // 部分 dev server 用 text/plain 返回 yaml
      ct === "";
    if (!looksLikeYaml) return undefined;
    const text = await res.text();
    const partial = parseAppYaml(text);
    // parseAppYaml 在解析失败时返回 {}，无法与"文件不存在"区分。
    // 通过检查 text 是否真的含 yaml 标记简单兜底：含 "key:" 或 "---" 才视为有效。
    if (!text || (!text.includes(":") && !text.includes("---"))) return undefined;
    return partial;
  } catch {
    return undefined;
  }
}

/**
 * 加载并合并统一配置（内部会重置并写入 getConfig 缓存）
 * @returns 合并后的最终配置（reactive 单例，调用方后续修改可直接走 setConfig）
 */
export async function loadConfig(
  options: LoadConfigOptions = {},
): Promise<AppConfig> {
  const baseUrl = options.baseUrl ?? "";
  const appName = options.appName ?? "default";
  const env = options.env ?? getImportMetaEnv();
  const timeout = options.timeout ?? 5000;

  // ① 重置为默认值
  resetConfig();

  // ② 加载 app.example.yaml 作为全局默认模板（比 defaultAppConfig 优先级高）
  await loadExampleYaml({ baseUrl, timeout });
  if (import.meta.env.DEV) console.log("[config-debug] after example:", getConfig().app?.openAuth);

  // ③ 加载本地 app.yaml（应用级覆盖）
  await loadAppYaml({ appName, baseUrl, configUrl: options.configUrl, timeout });
  if (import.meta.env.DEV) console.log("[config-debug] after app:", getConfig().app?.openAuth);

  // ④ 加载环境级 app.{env}.yaml（如 app.dev.yaml，覆盖 app.yaml）
  const envName = getEnvName(env);
  if (envName) {
    await loadEnvYaml({ appName, baseUrl, envName, timeout });
    if (import.meta.env.DEV) console.log("[config-debug] after env:", getConfig().app?.openAuth);
  }

  // ⑤ 加载远程配置（远程为主，失败忽略；地址 = http.baseUrl + url.setting，
  //    由 config.enable 开关控制，默认开启）
  const current = getConfig();
  if (!options.disableRemote && current.config?.enable !== false) {
    const remoteUrl = buildRemoteConfigUrl(current);
    if (remoteUrl) {
      const remote = await loadRemoteConfig(remoteUrl, timeout);
      if (import.meta.env.DEV) console.log("[config-debug] after remote (hasRemote=" + !!remote + "):", getConfig().app?.openAuth);
      if (remote) {
        setConfig(remote);
      }
    }
  }

  // ⑥ 环境变量覆盖（VITE_* → AppConfig 字段映射）
  const envConfig = envToConfig(env);
  if (Object.keys(envConfig).length > 0) {
    setConfig(envConfig);
  }

  return getConfig();
}

/**
 * 解析环境名：
 * ① VITE_APP_ENV 显式覆盖（如 test / prod）
 * ② import.meta.env.MODE 映射（development→dev / production→prod，其余原样）
 * ③ 两者均无时返回 ""（不加载环境级 yaml）
 */
function getEnvName(env: EnvLike): string {
  const explicit = env.VITE_APP_ENV;
  if (explicit) return explicit;
  const mode = env.MODE;
  if (!mode) return "";
  if (mode === "development") return "dev";
  if (mode === "production") return "prod";
  return mode;
}

/**
 * 拼接远程配置地址：http.baseUrl + url.setting。
 * 两者均为空时返回 ""（此时不拉取远程配置）。
 */
function buildRemoteConfigUrl(cfg: AppConfig): string {
  const setting = cfg?.url?.setting;
  const base = cfg?.http?.baseUrl;
  if (!setting) return "";
  if (!base) return setting;
  return `${base.replace(/\/+$/, "")}/${setting.replace(/^\/+/, "")}`;
}

/**
 * 加载 app.example.yaml 作为全局默认配置。
 * 加载失败（含非 yaml 响应，如 SPA fallback 返回 HTML）时静默跳过（保留 defaultAppConfig）。
 */
async function loadExampleYaml(options: { baseUrl: string; timeout: number }): Promise<void> {
  const partial = await safeFetchYaml(
    `${options.baseUrl}/app.example.yaml`,
    options.timeout,
  );
  if (partial) setConfig(partial);
}

/**
 * 加载本地 app.yaml；失败回退默认值（保留已有配置）。
 * 始终通过 setConfig 写入响应式 getConfig 单例。
 */
async function loadAppYaml(options: {
  appName: string;
  baseUrl: string;
  configUrl?: string;
  timeout: number;
}): Promise<void> {
  const tryMerge = (partial: Partial<AppConfig> | undefined): void => {
    if (partial) setConfig(partial);
  };
  const url =
    options.configUrl ?? `${options.baseUrl}/apps/${options.appName}/app.yaml`;
  const partial = await safeFetchYaml(url, options.timeout);
  if (partial) {
    tryMerge(partial);
    return;
  }
  // 目标不存在时尝试 apps/default/app.yaml 兜底
  const fallback = await safeFetchYaml(
    `${options.baseUrl}/apps/default/app.yaml`,
    options.timeout,
  );
  if (fallback) tryMerge(fallback);
}

/**
 * 加载环境级 app.{env}.yaml（如 app.dev.yaml）。
 * 存在则覆盖 app.yaml 的对应字段；不存在或失败时静默保留现有配置。
 */
async function loadEnvYaml(options: {
  appName: string;
  baseUrl: string;
  envName: string;
  timeout: number;
}): Promise<void> {
  const partial = await safeFetchYaml(
    `${options.baseUrl}/apps/${options.appName}/app.${options.envName}.yaml`,
    options.timeout,
  );
  if (partial) setConfig(partial);
}

/**
 * 拉取远程配置（JSON/YAML 均可），失败或非 yaml/JSON 时返回 undefined。
 */
async function loadRemoteConfig(
  url: string,
  timeout: number,
): Promise<Partial<AppConfig> | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const ct = String(res.headers.get("content-type") ?? "").toLowerCase();
    // 远程配置允许 JSON 或 yaml 两种格式
    const looksLikeConfig =
      ct.includes("json") || ct.includes("yaml") || ct.includes("yml") || ct === "";
    if (!looksLikeConfig) return undefined;
    const text = await res.text();
    const trimmed = text.trim();
    // 尝试 JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return flattenSettingToConfig(parsed);
      }
      return normalizeTopLevelKeys(parsed) as Partial<AppConfig>;
    } catch {
      return parseAppYaml(text);
    }
  } catch {
    return undefined;
  }
}

/**
 * 将后端设置列表转换为嵌套配置对象。
 * 支持点号层级 key（如 login.slider）与布尔/数字值转换。
 */
function flattenSettingToConfig(list: Array<Record<string, unknown>>): Partial<AppConfig> {
  const partial: Record<string, unknown> = {};
  for (const item of list) {
    const name = String(item.sysSettingName ?? item.name ?? "");
    const rawValue = item.sysSettingValue ?? item.value;
    if (!name) continue;
    let value: unknown = rawValue;
    const lower = String(rawValue).toLowerCase();
    if (lower === "true") value = true;
    else if (lower === "false") value = false;
    else if (!Number.isNaN(Number(rawValue)) && String(rawValue).trim() !== "") value = Number(rawValue);
    const keys = name.split(".");
    // 顶层键做与 YAML 一致的归一化（appConfig → app，去掉 Config 后缀）
    keys[0] = normalizeTopKey(keys[0]);
    let cur = partial;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (typeof cur[key] !== "object" || cur[key] === null) cur[key] = {};
      cur = cur[key] as Record<string, unknown>;
    }
    cur[keys[keys.length - 1]] = value;
  }
  return partial as Partial<AppConfig>;
}

/** 对 JSON 对象/数组返回的顶层键做归一化（appConfig → app） */
function normalizeTopLevelKeys(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    result[normalizeTopKey(key)] = data[key];
  }
  return result;
}

/** ⑤ VITE_* 环境变量 → AppConfig 部分字段映射 */
function envToConfig(env: EnvLike): Partial<AppConfig> {
  const partial: Partial<AppConfig> = {};

  const title = env.VITE_WEB_TITLE ?? env.VITE_APP_TITLE;
  if (title) {
    partial.app = { ...defaultAppConfig.app, title };
  }

  const baseUrl = env.VITE_WEB_BASE_API ?? env.VITE_BASE_API;
  if (baseUrl) {
    partial.http = { ...defaultAppConfig.http, baseUrl };
  }

  const themeId = env.VITE_THEME_ID;
  if (themeId) {
    partial.other = { ...defaultAppConfig.other, themeId };
  }

  const apiVersion = env.VITE_API_VERSION;
  if (apiVersion) {
    partial.http = { ...(partial.http ?? defaultAppConfig.http), apiVersion };
  }

  return partial;
}

/** 安全读取 import.meta.env（SSR/Node 下为空对象） */
function getImportMetaEnv(): EnvLike {
  const meta = (import.meta as unknown as { env?: EnvLike }).env;
  return meta ?? {};
}

export { parseYaml };
