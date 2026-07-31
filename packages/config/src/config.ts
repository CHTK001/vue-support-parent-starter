/**
 * 统一应用配置
 *
 * createApp 会把 apps/{appName}/app.yaml 解析后写入这里。
 * app.yaml 缺失或加载失败时，使用默认配置（defaultAppConfig）。
 */
import { load as parseYaml } from "js-yaml";

/** 请求配置 */
export interface RequestConfig {
  enable: boolean;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  showLoading: boolean;
}

/** 应用配置（app.yaml schema，键名统一首字母小写，核心配置先行，后续按需扩展） */
export interface AppConfig {
  /** 系统名称 */
  title: string;
  /** 平台版本号 */
  version: string;
  /** 平台标识码（storage 存储前缀，防止多个 app 共用同一 key） */
  systemCode: string;
  /** 远程 API 地址（后端接口基础路径） */
  baseUrl: string;
  /** API 版本号（拼到请求 query，如 ?version=v1） */
  apiVersion: string;
  /** 远程配置地址（远程为主，本地 app.yaml 兜底） */
  remoteSettingUrl: string;

  /** 是否开启鉴权 */
  openAuth: boolean;

  /** 是否开启缓存加密 */
  storageEncode: boolean;
  /** 缓存加密密钥 */
  storageKey: string;

  /** 请求配置 */
  request: RequestConfig;
}

/** 默认配置（没有 app.yaml 时全部走默认） */
export const defaultAppConfig: AppConfig = {
  title: "Vue Support",
  version: "0.7.0",
  systemCode: "system",
  baseUrl: "/",
  apiVersion: "",
  remoteSettingUrl: "",

  openAuth: true,

  storageEncode: true,
  storageKey: "2XNN4K8LC0ELVWN4",

  request: {
    enable: true,
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    showLoading: true,
  },
};

let currentConfig: AppConfig = { ...defaultAppConfig };

/** 获取统一配置 */
export function getConfig(): AppConfig {
  return currentConfig;
}

/** 合并写入统一配置 */
export function setConfig(partial: Partial<AppConfig>): AppConfig {
  currentConfig = { ...currentConfig, ...partial };
  return currentConfig;
}

/** 重置为默认配置 */
export function resetConfig(): AppConfig {
  currentConfig = { ...defaultAppConfig };
  return currentConfig;
}

/** 首字母小写 */
function lowerFirst(key: string): string {
  return key ? key.charAt(0).toLowerCase() + key.slice(1) : key;
}

/** 把 yaml 解析出的对象键首字母转小写（只处理一层，嵌套对象键本就小写） */
function normalizeKeys(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    result[lowerFirst(key)] = data[key];
  }
  return result;
}

/** 解析 app.yaml 文本（失败时返回空对象） */
export function parseAppYaml(yaml: string): Partial<AppConfig> {
  try {
    const data = parseYaml(yaml) as Record<string, unknown> | undefined;
    return (data ? normalizeKeys(data) : {}) as Partial<AppConfig>;
  } catch {
    return {};
  }
}

/** 从默认值 + yaml 解析结果得到最终配置（不修改 currentConfig） */
export function mergeAppConfig(partial: Partial<AppConfig>): AppConfig {
  return { ...defaultAppConfig, ...partial };
}
