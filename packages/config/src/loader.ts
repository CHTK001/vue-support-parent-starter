/**
 * 统一配置加载器 —— 按优先级合并多来源配置
 *
 * 优先级（后加载覆盖先加载）：
 *   ① 默认值 defaultAppConfig
 *   ② app.yaml（本地，apps/{appName}/app.yaml）
 *   ③ 远程配置（config.remoteSettingUrl，远程为主）
 *   ④ 环境变量（import.meta.env 中的 VITE_* 映射，本地运行最高优先级）
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

  // ② 加载本地 app.yaml
  await loadAppYaml({ appName, baseUrl, configUrl: options.configUrl });

  // ③ 加载远程配置（远程为主，失败忽略）
  const current = getConfig();
  if (!options.disableRemote && current.config.remoteSettingUrl) {
    const remote = await loadRemoteConfig(current.config.remoteSettingUrl);
    if (remote) {
      setConfig(remote);
    }
  }

  // ④ 环境变量覆盖（VITE_* → AppConfig 字段映射）
  const envConfig = envToConfig(env);
  if (Object.keys(envConfig).length > 0) {
    setConfig(envConfig);
  }

  return getConfig();
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

/** ③ 拉取远程配置（JSON/YAML 均可），失败返回 undefined */
async function loadRemoteConfig(url: string): Promise<Partial<AppConfig> | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const text = await res.text();
    const trimmed = text.trim();
    // 尝试 JSON，失败则按 YAML 解析
    try {
      return JSON.parse(trimmed) as Partial<AppConfig>;
    } catch {
      return parseAppYaml(text);
    }
  } catch {
    return undefined;
  }
}

/** ④ VITE_* 环境变量 → AppConfig 部分字段映射 */
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
