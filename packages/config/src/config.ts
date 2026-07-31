/**
 * 统一应用配置
 *
 * createApp 第二步会把 apps/{appName}/app.yaml 解析后写入这里。
 * app.yaml 缺失或加载失败时，使用默认配置（defaultAppConfig）。
 */
import { load as parseYaml } from "js-yaml";

/** 应用配置（app.yaml schema，简单版） */
export interface AppConfig {
  /** 是否开启鉴权 */
  openAuth: boolean;
  /** 存储加密 key（需配合 @repo/utils storage 使用） */
  storageKey: string;
  /** API 基础地址 */
  baseUrl: string;
  /** 系统名称 */
  title: string;
  /** 主题 id（default | koi，见 @repo/theme） */
  themeId: string;
  /** 扩展字段，app.yaml 里未声明的 key 原样保留 */
  [key: string]: unknown;
}

/** 默认配置（没有 app.yaml 时全部走默认） */
export const defaultAppConfig: AppConfig = {
  openAuth: false,
  storageKey: "",
  baseUrl: "/api",
  title: "Vue Support",
  themeId: "default",
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

/** 解析 app.yaml 文本（失败时返回空对象） */
export function parseAppYaml(yaml: string): Partial<AppConfig> {
  try {
    const data = parseYaml(yaml) as Record<string, unknown> | undefined;
    return (data ?? {}) as Partial<AppConfig>;
  } catch {
    return {};
  }
}

/** 从默认值 + yaml 解析结果得到最终配置（不修改 currentConfig） */
export function mergeAppConfig(partial: Partial<AppConfig>): AppConfig {
  return { ...defaultAppConfig, ...partial };
}
