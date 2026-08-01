/**
 * 统一应用配置
 *
 * createApp 会把 apps/{appName}/app.yaml 解析后写入这里。
 * app.yaml 缺失或加载失败时，使用默认配置（defaultAppConfig）。
 */
import { load as parseYaml } from "js-yaml";
import type {
  AppConfig,
  ConfigConfig,
  AppSystemConfig,
  HttpConfig,
  StorageConfig,
  SecurityConfig,
  PermissionConfig,
  TokenConfig,
  I18nConfig,
  LayoutConfig,
  UploadConfig,
  UrlConfig,
  EnvConfig,
  SystemConfig,
  AiConfig,
  CryptoConfig,
  RouteConfig,
  OtherConfig,
} from "./types/config";

/** 默认配置（没有 app.yaml 时全部走默认） */
export const defaultAppConfig: AppConfig = {
  config: {
    remoteSettingUrl: "",
  },

  app: {
    title: "Vue Support",
    version: "0.7.0",
    systemCode: "system",
    openAuth: true,
  },

  permission: {
    superadmin: "superadmin",
    admin: "admin",
  },

  token: {
    autoRefresh: false,
    accessTokenKey: "accessToken",
    refreshTokenKey: "refreshToken",
    refreshUrl: "",
    refreshInterval: 300000,
    advanceRefresh: 60000,
  },

  i18n: {
    defaultLocale: "zh-CN",
    locales: ["zh-CN", "en-US"],
  },

  layout: {
    source: "local",
    remoteUrl: "",
  },

  upload: {
    url: "",
    maxSize: 10485760,
    accept: [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".zip"],
  },

  url: {
    login: "/v2/user/login",
    logout: "/v2/user/logout",
    me: "/v2/user/me",
    refreshToken: "/v2/user/refresh-token",
    captcha: "/v1/captcha",
    setting: "/v2/setting/default",
    menu: "/v2/user/menu",
  },

  env: {
    env: "dev",
  },

  system: {
    showMessage: true,
    showConfig: true,
    showLog: true,
    showMonitor: true,
  },

  http: {
    baseUrl: "",
    apiVersion: "",
    enable: true,
    encrypt: false,
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    showLoading: true,
    sign: false,
    signSecret: "",
  },

  storage: {
    encode: true,
    key: "2XNN4K8LC0ELVWN4",
    prefix: "",
    noPrefixKeys: [],
  },

  security: {
    baiduJs: {
      enable: false,
      jumpUrl: "",
    },
    dynamicFont: {
      enable: false,
    },
    ocrObfuscation: {
      enable: false,
    },
  },

  ai: {
    enable: false,
    url: "",
    model: "",
    apiKey: "",
  },

  crypto: {
    wasmUrl: "/wasm/crypto-wasm.js",
    algorithm: "aes",
  },

  route: {
    mode: "static",
    remoteUrl: "",
    mergeLocalMenu: false,
    modulePaths: [],
    allowPrefixes: [],
    whiteList: ["/login", "/403", "/404", "/500"],
    loginPath: "/login",
    homePath: "/home",
    notFoundPath: "/404",
    forbiddenPath: "/403",
    serverErrorPath: "/500",
  },

  other: {
    themeId: "koi",
  },
};

let currentConfig: AppConfig = { ...defaultAppConfig };

/** 获取统一配置 */
export function getConfig(): AppConfig {
  return currentConfig;
}

/** 合并写入统一配置 */
export function setConfig(partial: Partial<AppConfig>): AppConfig {
  currentConfig = deepMerge(
    currentConfig as unknown as Record<string, unknown>,
    partial as unknown as Record<string, unknown>,
  ) as unknown as AppConfig;
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

/** AppConfig 顶层字段名（用于 yaml 键去 Config 后缀的映射白名单） */
const APP_CONFIG_TOP_KEYS = new Set(
  Object.keys(defaultAppConfig).map((key) => key.toLowerCase())
);

/**
 * 归一化 app.yaml 顶层键：
 *  1. 首字母转小写（AppConfig / appConfig → appConfig）
 *  2. 去掉 Config 后缀（appConfig → app，与 AppConfig 接口字段对齐）
 *  仅对顶层键生效，嵌套对象键保持原样。
 */
function normalizeTopKey(key: string): string {
  const lowered = lowerFirst(key);
  const withoutSuffix = lowered.replace(/Config$/i, "");
  // 去掉后缀后仍能命中接口字段（如 appConfig → app）时采用
  if (APP_CONFIG_TOP_KEYS.has(withoutSuffix.toLowerCase())) {
    return withoutSuffix;
  }
  return lowered;
}

/** 把 yaml 解析出的对象键首字母转小写（只处理一层，嵌套对象键本就小写） */
function normalizeKeys(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    result[normalizeTopKey(key)] = data[key];
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

/** 深合并：嵌套对象逐层合并，避免部分配置覆盖整块默认值 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: T): T {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = result[key];
    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      result[key] = sv;
    }
  }
  return result as T;
}

/** 从默认值 + yaml 解析结果得到最终配置（不修改 currentConfig） */
export function mergeAppConfig(partial: Partial<AppConfig>): AppConfig {
  return deepMerge(
    defaultAppConfig as unknown as Record<string, unknown>,
    partial as unknown as Record<string, unknown>,
  ) as unknown as AppConfig;
}

/** 重新导出所有类型，方便使用方一处 import */
export type {
  ConfigConfig,
  AppSystemConfig,
  HttpConfig,
  StorageConfig,
  SecurityConfig,
  PermissionConfig,
  TokenConfig,
  I18nConfig,
  LayoutConfig,
  UploadConfig,
  UrlConfig,
  EnvConfig,
  SystemConfig,
  AiConfig,
  CryptoConfig,
  RouteConfig,
  OtherConfig,
  AppConfig,
} from "./types/config";
export type { RouteMode } from "./types/config";