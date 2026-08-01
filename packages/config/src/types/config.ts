/**
 * 应用配置类型（app.yaml schema）
 *
 * 所有 AppConfig 子项接口定义，运行时默认值与解析逻辑见 ../config.ts
 */

/** ConfigConfig 配置中心 */
export interface ConfigConfig {
  /** 远程配置地址（远程为主，本地 app.yaml 兜底） */
  remoteSettingUrl: string;
}

/** AppConfig 系统信息 */
export interface AppSystemConfig {
  /** 系统名称 */
  title: string;
  /** 平台版本号 */
  version: string;
  /** 平台标识码（storage 存储前缀，防止多个 app 共用同一 key） */
  systemCode: string;
  /** 是否开启鉴权 */
  openAuth: boolean;
}

/** HttpConfig 请求配置 */
export interface HttpConfig {
  /** 远程 API 地址（后端接口基础路径） */
  baseUrl: string;
  /** API 版本号（拼到请求 query，如 ?version=v1） */
  apiVersion: string;
  /** 是否启用请求配置 */
  enable: boolean;
  /** 请求是否加密 */
  encrypt: boolean;
  /** 请求超时时间（毫秒） */
  timeout: number;
  /** 重试次数 */
  retryCount: number;
  /** 重试间隔（毫秒） */
  retryDelay: number;
  /** 请求时显示 loading 状态 */
  showLoading: boolean;
  /** 是否启用 x-sign 防重放签名（默认 false，未配置签名头时后端跳过） */
  sign: boolean;
  /** 签名密钥（与后端 NonceSignProperties secretKey 一致） */
  signSecret: string;
}

/** StorageConfig 缓存与存储配置 */
export interface StorageConfig {
  /** 是否开启缓存加密 */
  encode: boolean;
  /** 缓存加密密钥 */
  key: string;
  /** 存储命名空间前缀（默认取 appConfig.systemCode） */
  prefix: string;
  /** 指定不添加前缀的 key（跨应用共享） */
  noPrefixKeys: string[];
}

/** 安全配置 */
export interface SecurityConfig {
  /** 百度 js 反调试（开启调试模式直接跳走） */
  baiduJs: BaiduJsConfig;
  /** 动态字体加密（防止 OCR 识别） */
  dynamicFont: {
    /** 是否启用 */
    enable: boolean;
  };
  /** OCR 混淆（页面文本混淆，防止抓取） */
  ocrObfuscation: {
    /** 是否启用 */
    enable: boolean;
  };
}

/** 百度 js 反调试配置 */
export interface BaiduJsConfig {
  /** 是否启用 */
  enable: boolean;
  /** 调试模式跳转地址（为空则跳转首页） */
  jumpUrl: string;
}

/** 权限配置 */
export interface PermissionConfig {
  /** 超级管理员角色标识（前端据此判断用户是否 superadmin） */
  superadmin: string;
  /** 管理员角色标识（前端据此判断用户是否 admin） */
  admin: string;
}

/** 令牌配置 */
export interface TokenConfig {
  /** 是否开启 token 定时刷新（根据 refreshToken 自动刷新） */
  autoRefresh: boolean;
  /** accessToken 存储 key */
  accessTokenKey: string;
  /** refreshToken 存储 key */
  refreshTokenKey: string;
  /** 刷新接口地址（为空时不刷新） */
  refreshUrl: string;
  /** 刷新间隔（毫秒） */
  refreshInterval: number;
  /** 提前刷新时间（毫秒，在过期前多久刷新） */
  advanceRefresh: number;
}

/** 国际化配置 */
export interface I18nConfig {
  /** 默认语言 */
  defaultLocale: string;
  /** 支持的语言列表 */
  locales: string[];
}

/** 用户布局配置 */
export interface LayoutConfig {
  /** 配置来源（local: 本地 / remote: 远程） */
  source: "local" | "remote";
  /** 远程布局配置地址（source 为 remote 时生效） */
  remoteUrl: string;
}

/** 上传配置 */
export interface UploadConfig {
  /** 上传接口地址 */
  url: string;
  /** 单个文件大小上限（字节） */
  maxSize: number;
  /** 允许的文件扩展名 */
  accept: string[];
}

/** UrlConfig 接口地址（集中管理，改接口只改这里，调用方无需感知实现） */
export interface UrlConfig {
  /** 登录接口 */
  login: string;
  /** 登出接口 */
  logout: string;
  /** 当前用户信息接口 */
  me: string;
  /** 刷新 token 接口 */
  refreshToken: string;
  /** 验证码接口 */
  captcha: string;
  /** 默认配置接口（登录页/首页拉取后端配置合并到 getConfig） */
  setting: string;
  /** 远程菜单接口 */
  menu: string;
}

/** 环境配置 */
export interface EnvConfig {
  /** 当前环境（dev / test / prod） */
  env: "dev" | "test" | "prod";
}

/** 系统配置 */
export interface SystemConfig {
  /** 是否显示消息组件 */
  showMessage: boolean;
  /** 是否显示配置组件 */
  showConfig: boolean;
  /** 是否显示日志组件 */
  showLog: boolean;
  /** 是否显示监控组件 */
  showMonitor: boolean;
}

/** AiConfig AI 配置 */
export interface AiConfig {
  /** 是否启用 AI 能力 */
  enable: boolean;
  /** AI 服务地址 */
  url: string;
  /** AI 模型名称 */
  model: string;
  /** API Key */
  apiKey: string;
}

/** 加密配置 */
export interface CryptoConfig {
  /** wasm 加密模块地址 */
  wasmUrl: string;
  /** 默认加密算法（aes / sm2 / sm3 / sm4） */
  algorithm: string;
}

/** 路由模式：static=静态路由写死 / module=按 page 模块装配 / remote=后端菜单接口返回 */
export type RouteMode = "static" | "module" | "remote";

/** 路由配置 */
export interface RouteConfig {
  /** 路由模式（static / module / remote） */
  mode: RouteMode;
  /** 远程菜单接口地址（mode=remote 时生效） */
  remoteUrl: string;
  /** 远程基础上是否合并本地静态路由（mode=remote 时生效） */
  mergeLocalMenu: boolean;
  /** 本地业务路由模块路径（mode=module 时生效，对应 monorepo pages 模块） */
  modulePaths: string[];
  /** 远程菜单允许的路径前缀白名单（为空不过滤；命中保留，未命中过滤） */
  allowPrefixes: string[];
  /** 无需登录即可访问的路由白名单 */
  whiteList: string[];
  /** 登录页路径 */
  loginPath: string;
  /** 首页路径（layout 重定向目标） */
  homePath: string;
  /** 404 路径 */
  notFoundPath: string;
  /** 403 路径 */
  forbiddenPath: string;
  /** 500 路径 */
  serverErrorPath: string;
}

/** 其它配置 */
export interface OtherConfig {
  /** 主题（default / koi） */
  themeId: string;
}

/** 应用配置（app.yaml schema） */
export interface AppConfig {
  /** 配置中心 */
  config: ConfigConfig;
  /** 系统信息 */
  app: AppSystemConfig;
  /** 权限配置 */
  permission: PermissionConfig;
  /** 令牌配置 */
  token: TokenConfig;
  /** 国际化配置 */
  i18n: I18nConfig;
  /** 用户布局配置 */
  layout: LayoutConfig;
  /** 上传配置 */
  upload: UploadConfig;
  /** 接口地址 */
  url: UrlConfig;
  /** 环境配置 */
  env: EnvConfig;
  /** 系统配置 */
  system: SystemConfig;
  /** 请求配置 */
  http: HttpConfig;
  /** 缓存与存储配置 */
  storage: StorageConfig;
  /** 安全配置 */
  security: SecurityConfig;
  /** AI 配置 */
  ai: AiConfig;
  /** 加密配置 */
  crypto: CryptoConfig;
  /** 路由配置 */
  route: RouteConfig;
  /** 其它配置 */
  other: OtherConfig;
}