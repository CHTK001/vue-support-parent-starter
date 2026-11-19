/**
 * @repo/app/wechat-miniapp —— 小程序平台适配层类型
 *
 * <p>本文件只放类型，编译期擦除，运行时不产生任何依赖。三个适配器
 * （storage / http / sse）的签名刻意与 {@code @repo/utils} 的
 * {@code StorageWrapper / Http} 保持一致，保证 PC 与小程序是同一套装配语义。</p>
 *
 * <p><b>刻意不做的能力</b>：令牌续期（refresh / 定时刷新）与存储加解密。
 * 小程序端令牌过期直接 401 回登录页；加密需要额外 crypto 依赖，显著增大包体。</p>
 */
import type { AppPlatform } from "../platform/types";
import type { UniRuntime } from "./uni";

export type { AppPlatform };

/** 存储后端（web → localStorage；mp → uni storage） */
export interface MpStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear?(): void;
}

/** 存储装配选项 */
export interface MpStorageOptions {
  /** key 命名空间前缀（小程序存储本身按小程序隔离，缺省不前缀） */
  prefix?: string;
}

/** 令牌配置 */
export interface MpTokenConfig {
  /** accessToken 存储 key，默认 accessToken */
  accessTokenKey?: string;
  /** userInfo 存储 key，默认 userInfo */
  userInfoKey?: string;
}

/** 统一请求配置 */
export interface MpRequestConfig {
  /** 请求超时（毫秒） */
  timeout?: number;
  /** 额外请求头 */
  headers?: Record<string, string>;
}

/** 统一响应信封（与后端 Result 一致） */
export interface MpResult<T = unknown> {
  code?: string | number;
  msg?: string;
  data?: T;
}

/**
 * 小程序应用启动选项（与 PC CreateAppOptions 的公共字段口径一致）。
 *
 * <p>{@code app} / {@code createSSRApp} 由宿主注入，库内不 import vue，
 * 因此 {@code mountApp()} 可以无参调用。</p>
 */
export interface CreateMpAppOptions {
  /** 目标平台标记；本入口恒为 "wechat-miniapp"（仅用于统一入口的类型收窄） */
  platform?: AppPlatform;
  /** 应用名（与 PC 的 appName 口径一致） */
  appName?: string;
  /** 后端地址（如 http://127.0.0.1:8787） */
  baseUrl?: string;
  /** 存储配置 */
  storage?: MpStorageOptions;
  /** 令牌配置 */
  token?: MpTokenConfig;
  /** 请求配置 */
  request?: MpRequestConfig;
  /**
   * 登录页路径（如 {@code "/pages/login/index"}）。
   *
   * <p>传入后，未自定义 {@code onUnauthorized} 时由框架负责 401 处理：
   * 清令牌 + {@code uni.reLaunch} 到该页。</p>
   */
  loginPath?: string;
  /** 401 回调（token 失效时由宿主跳登录页；传入后覆盖 loginPath 的缺省行为） */
  onUnauthorized?: () => void | Promise<void>;
  /** uni 运行时（小程序的全局 {@code uni}）；传入后自动注入，宿主不必再调 setUniRuntime */
  uni?: UniRuntime;
  /** 根组件（与 {@link CreateMpAppOptions.createSSRApp} 一起传入时 mountApp() 可无参调用） */
  app?: unknown;
  /**
   * Vue 的 createSSRApp（由宿主注入：库内不 import vue，避免解析出第二个 Vue 副本）。
   *
   * <p>参数用 {@code any}：宿主注入的是 {@code createAppFunction<Element>}，
   * 写成 {@code unknown} 会因函数参数逆变而类型不兼容。</p>
   */
  createSSRApp?: (root: any) => any;
}

/** 启动完成后的小程序应用上下文（框架无关的公共面） */
export interface MpAppContext {
  /** 应用名 */
  appName: string;
  /** 后端地址（已去掉尾部斜杠） */
  baseUrl: string;
  /** 存储 */
  storage: MpStorage;
  /** 令牌管理 */
  token: MpTokenManager;
  /** 统一请求客户端（非流式） */
  http: MpHttp;
  /** 统一流式客户端（SSE over chunked response） */
  sse: MpSse;
  /** 业务信封解包（{code:"00000", data} → data，其余抛错） */
  unwrap<T>(result: MpResult<T> | T): T;
}

/** 存储接口（方法签名与 @repo/utils StorageWrapper 对齐） */
export interface MpStorage {
  get<T = unknown>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown, expires?: number): void;
  remove(key: string): void;
  clear(): void;
}

/** 令牌管理器（方法签名与 @repo/core TokenManager 的非续期子集对齐） */
export interface MpTokenManager {
  getAccessToken(): string;
  getUserInfo<T = Record<string, unknown>>(): T | null;
  setTokens(accessToken: string): void;
  setUserInfo(userInfo: Record<string, unknown>): void;
  clearTokens(): void;
}

/** HTTP 客户端（语义与 @repo/utils http 一致，传输层换成 uni.request） */
export interface MpHttp {
  /** 底层请求（含统一头注入、query 拼装、401 处理） */
  request<T = unknown>(options: MpRequestOptions): Promise<MpResult<T>>;
}

/** 单次请求参数 */
export interface MpRequestOptions {
  /** 相对 baseUrl 的路径，或绝对地址 */
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "HEAD";
  data?: unknown;
  /** query 参数（自动跳过 undefined / null / 空串） */
  query?: Record<string, string | number | boolean | undefined | null>;
  header?: Record<string, string>;
  timeout?: number;
  /** 是否自动注入 Bearer Token，默认 true */
  auth?: boolean;
  /** 401 时不触发 onUnauthorized（登录等自身处理场景） */
  skipAuthRedirect?: boolean;
}

/** 流式请求参数（SSE） */
export interface MpSseParams {
  /** 相对 baseUrl 的路径，或绝对地址 */
  url: string;
  /** JSON 请求体 */
  data?: unknown;
  /** 附加请求头（Accept / Content-Type / Authorization 由适配器补齐） */
  header?: Record<string, string>;
  timeout?: number;
  /** 是否自动注入 Bearer Token，默认 true */
  auth?: boolean;
}

/** 流式事件回调 */
export interface MpSseHandlers {
  /** 收到一条业务数据（已做 SSE 分帧与 JSON 解析；非 JSON 心跳与 [DONE] 不会进这里） */
  onMessage(payload: unknown): void;
  onError(error: Error): void;
  /** 流结束（收到 [DONE] 或连接正常关闭） */
  onDone(): void;
}

/** SSE 客户端（uni.request 的 enableChunked 分块接收） */
export interface MpSse {
  /** 当前环境是否支持分块响应（微信基础库 2.20.1+） */
  supported(): boolean;
  /** 发起流式请求；返回中断句柄 */
  stream(params: MpSseParams, handlers: MpSseHandlers): { abort: () => void };
}
