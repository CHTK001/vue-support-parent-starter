/**
 * 统一配置加载器 —— 按优先级合并多来源配置
 *
 * 优先级（后加载覆盖先加载）：
 *   ① 默认值 defaultAppConfig
 *   ② app.example.yaml（全局默认模板，项目根目录）
 *   ③ app.yaml（本地，apps/{appName}/app.yaml）
 *   ④ 远程配置（url.setting 拼接 http.baseUrl，远程为主，失败忽略）
 *   ⑤ 环境变量（import.meta.env 中的 VITE_* 映射，本地运行最高优先级）
 *
 * 任何来源加载失败都回退到已有配置，保证应用始终可启动。
 */
import { load as parseYaml } from "js-yaml";
import {
  defaultAppConfig,
  getConfig,
  mergeAppConfig,
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

  // ① 重置为默认值
  resetConfig();

  // ② 加载 app.example.yaml 作为全局默认模板（比 defaultAppConfig 优先级高）
  await loadExampleYaml({ baseUrl });

  // ③ 加载本地 app.yaml（应用级覆盖）
  await loadAppYaml({ appName, baseUrl, configUrl: options.configUrl });

  // ④ 加载远程配置（远程为主，失败忽略；地址 = http.baseUrl + url.setting，
  //    由 config.enable 开关控制，默认开启）
  const current = getConfig();
  if (!options.disableRemote && current.config?.enable !== false) {
    const remoteUrl = buildRemoteConfigUrl(current);
    if (remoteUrl) {
      const remote = await loadRemoteConfig(remoteUrl);
      if (remote) {
        setConfig(remote);
      }
    }
  }

  // ⑤ 环境变量覆盖（VITE_* → AppConfig 字段映射）
  const envConfig = envToConfig(env);
  if (Object.keys(envConfig).length > 0) {
    setConfig(envConfig);
  }

  return getConfig();
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
 * 加载失败时静默跳过（保留 defaultAppConfig）。
 */
async function loadExampleYaml(options: { baseUrl: string }): Promise<void> {
  try {
    const url = `${options.baseUrl}/app.example.yaml`;
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      const partial = parseAppYaml(text);
      setConfig(partial);
    }
  } catch {
    // 加载失败：保留 defaultAppConfig
  }
}

/**
 * 加载本地 app.yaml；失败回退默认值（保留已有配置）。
 * 始终通过 setConfig 写入响应式 getConfig 单例。
 */
async function loadAppYaml(options: {
  appName: string;
  baseUrl: string;
  configUrl?: string;
}): Promise<void> {
  const tryMerge = (text: string): void => {
    const partial = parseAppYaml(text);
    setConfig(partial);
  };
  try {
    const url =
      options.configUrl ?? `${options.baseUrl}/apps/${options.appName}/app.yaml`;
    const res = await fetch(url);
    if (res.ok) {
      tryMerge(await res.text());
      return;
    }
    // 目标不存在时尝试 apps/default/app.yaml 兜底
    const defaultRes = await fetch(`${options.baseUrl}/apps/default/app.yaml`);
    if (defaultRes.ok) {
      tryMerge(await defaultRes.text());
    }
  } catch {
    // 网络/解析失败：保留默认值
  }
}

/** 拉取远程配置（JSON/YAML 均可），失败返回 undefined */
async function loadRemoteConfig(url: string): Promise<Partial<AppConfig> | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const text = await res.text();
    const trimmed = text.trim();
    // 尝试 JSON
    try {
      const parsed = JSON.parse(trimmed);
      // 兼容后端设置列表：数组元素 {sysSettingName: "login.slider", sysSettingValue: "true"} → 嵌套对象
      if (Array.isArray(parsed)) {
        return flattenSettingToConfig(parsed);
      }
      return parsed as Partial<AppConfig>;
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
