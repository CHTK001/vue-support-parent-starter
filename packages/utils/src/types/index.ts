/**
 * @repo/utils —— 统一类型定义
 *
 * 所有公共类型集中存放于此，各模块通过相对路径（包内）或 `@repo/utils/types`（包外）引用。
 * 实现细节类型（如 MetaRequestConfig、CacheItem、RequestCache）保留在各模块内部。
 */
import type {
  AxiosInstance,
  AxiosProgressEvent,
  AxiosResponse,
  InternalAxiosRequestConfig,
  ResponseType,
} from "axios";

/* ==================== http.ts（axios 链式封装） ==================== */

/** 请求体 */
export type RequestBody = Record<string, unknown> | unknown[] | FormData | string | Blob | ArrayBuffer | null;

/** 单请求加密/loading 标记（供加密拦截器读取） */
export interface HttpMetaConfig {
  /** 是否加密该请求体（覆盖全局 encrypt，x-ec/x-ck 协议） */
  encrypt?: boolean;
  /** 是否按后端 codec 协议加密该请求体（access-control-origin-key，覆盖 requestCodec 配置） */
  codec?: boolean;
  /** 是否显示 loading（覆盖全局 showLoading） */
  showLoading?: boolean;
  /** 是否允许失败重试（覆盖方法白名单；POST/PATCH 等非幂等方法按需显式开启） */
  retry?: boolean;
  /** 静默失败提示（禁用统一 toast，仍 reject） */
  noToast?: boolean;
}

/** 链式请求构造器 */
export interface ChainableRequest {
  query(params: Record<string, unknown>): ChainableRequest;
  headers(headers: Record<string, string>): ChainableRequest;
  data(body: RequestBody): ChainableRequest;
  responseType(type: ResponseType): ChainableRequest;
  timeout(ms: number): ChainableRequest;
  /** 单请求 loading 开关（默认走全局 showLoading） */
  loading(show: boolean): ChainableRequest;
  /** 单请求加密开关（默认走全局 encrypt，x-ec/x-ck 协议） */
  encrypt(on: boolean): ChainableRequest;
  /** 单请求 codec 加密开关（后端 access-control-origin-key 协议；需 requestCodec 配置 key） */
  codec(on: boolean): ChainableRequest;
  /** 单请求重试开关（默认走方法白名单：仅幂等方法自动重试；POST/PATCH 按需显式开启） */
  retry(on: boolean): ChainableRequest;
  /** 静默失败提示（禁用统一 toast，仍 reject；默认 false） */
  noToast(on: boolean): ChainableRequest;
  /** 上传进度回调（大文件上传场景，替代业务侧自建 axios 实例） */
  uploadProgress(handler: (event: AxiosProgressEvent) => void): ChainableRequest;
  /**
   * 把当前链式请求转换为 SSE 客户端。
   *
   * 复用了已设置的 method / url / headers / data / params；
   * 额外选项（如 onMessage、reconnect、auth、parseData）通过 sseOptions 覆盖。
   *
   * 典型用法：
   * ```ts
   * http.post('/api/chat').data({ prompt }).sse({
   *   onMessage: (e) => console.log(e.data),
   * });
   * ```
   */
  sse<T = unknown>(sseOptions?: Omit<SseClientOptions<T>, "method" | "headers" | "body">): SseClient;
  then<TResult1 = AxiosResponse, TResult2 = never>(
    onfulfilled?: ((value: AxiosResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<AxiosResponse | TResult>;
  finally(onfinally?: (() => void) | null): Promise<AxiosResponse>;
}

/** Http 构造选项 */
export interface HttpOptions {
  /** 是否自动从 @repo/config 读取 baseUrl / request 配置（默认 true） */
  useAppConfig?: boolean;
  /** 手动指定基础路径，优先级高于 config.http.baseUrl */
  baseUrl?: string;
  /** 请求超时（毫秒） */
  timeout?: number;
  /** 请求头 */
  headers?: Record<string, string>;
  /** axios 实例（加密拦截器等可注入，默认使用全局 axios） */
  instance?: AxiosInstance;
}

/* ==================== storage.ts ==================== */

/** 存储选项 */
export interface StorageOptions {
  /** 命名空间前缀，默认 ""（不带前缀） */
  prefix?: string;
  /** 过期时间（毫秒），默认不过期 */
  expires?: number;
  /** 指定不添加前缀的 key（跨应用共享时使用） */
  noPrefixKeys?: string[];
  /** 按用户隔离的 key（命中后自动注入 userId，未登录时为 anonymous） */
  userScopeKeys?: string[];
  /** userId 解析函数（运行时调用，避免循环依赖） */
  resolveUserId?: () => string;
  /** 是否开启值加密 */
  encode?: boolean;
  /** 加密函数（encode 为 true 时对 JSON 字符串加密） */
  encodeFn?: (plain: string) => string;
  /** 解密函数 */
  decodeFn?: (encrypted: string) => string;
}

/** 写入存储的值类型 */
export type StorageValue = string | number | boolean | null | object;

/** 浏览器 Storage 的最小接口（便于测试 mock） */
export interface StorageLike {
  readonly length: number;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
}

/* ==================== sse ==================== */

/** SSE 事件类型 */
export interface SseEvent<T = unknown> {
  /** 事件类型 */
  event: string;
  /** 数据 */
  data: T;
  /** 事件 ID */
  id?: string;
  /** 重试间隔（ms） */
  retry?: number;
}

/** SSE 客户端选项 */
export interface SseClientOptions<T = unknown> {
  /** 请求方法 */
  method?: "GET" | "POST";
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体（POST） */
  body?: unknown;
  /** 凭证 */
  credentials?: "include" | "same-origin" | "omit";
  /**
   * 鉴权 token：
   * - 传入 token 字符串时，直接使用该值（优先于 storage / provider）
   * - 传入 true / undefined 时，默认从 storage 读取（key 由 tokenConfig.accessTokenKey + storage 前缀决定）
   * - 传入 false 时，不注入任何鉴权信息
   */
  auth?: boolean | string;
  /** 是否开启自动重连 */
  reconnect?: boolean;
  /** 重连最大次数（默认 5） */
  maxReconnectAttempts?: number;
  /** 重连间隔（ms，默认 2000） */
  reconnectInterval?: number;
  /** 解析 data 字段（默认 JSON.parse） */
  parseData?: (raw: string) => T;
  /** 收到消息 */
  onMessage?: (event: SseEvent<T>) => void;
  /** 打开连接 */
  onOpen?: () => void;
  /** 错误 */
  onError?: (err: unknown) => void;
  /** 关闭 */
  onClose?: () => void;
}

/** SSE 客户端实例 */
export interface SseClient {
  /** 关闭连接 */
  close: () => void;
}

/** OpenAI 协议 SSE 数据块 */
export interface OpenAiChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/** OpenAI SSE 客户端选项 */
export interface OpenAiSseOptions extends Omit<SseClientOptions<OpenAiChunk>, "onMessage" | "parseData"> {
  /** 收到每个增量块 */
  onChunk?: (chunk: OpenAiChunk, raw: string) => void;
  /** 流开始 */
  onStart?: () => void;
  /** 流结束（含 finish_reason='stop'） */
  onEnd?: (fullContent: string) => void;
  /** 流错误 */
  onError?: (err: unknown) => void;
}

/** Spring AI 协议 SSE 数据块 */
export interface SpringAiChunk {
  /** 消息 ID */
  id?: string;
  /** 角色 */
  role?: string;
  /** 当前内容（增量） */
  content?: string;
  /** 完整内容 */
  fullContent?: string;
  /** 元数据（tool_calls 等） */
  metadata?: Record<string, unknown>;
  /** 是否结束 */
  done?: boolean;
  /** 错误 */
  error?: string;
}

/** Spring AI SSE 客户端选项 */
export interface SpringAiSseOptions extends Omit<SseClientOptions<SpringAiChunk>, "onMessage"> {
  /** 收到每个增量块 */
  onChunk?: (chunk: SpringAiChunk, raw: string) => void;
  /** 流开始 */
  onStart?: () => void;
  /** 流结束 */
  onEnd?: (fullContent: string) => void;
  /** 流错误 */
  onError?: (err: unknown) => void;
}

/* ==================== modules/themeColor.ts ==================== */

/** 消息状态色类型：type 对应 el-message 的 success / warning / danger / info */
export type MessageStateType = "success" | "warning" | "danger" | "info";

/* ==================== modules/axiosThrottle.ts ==================== */

/** 扩展 InternalAxiosRequestConfig 以支持 throttle 配置 */
export interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  throttle?: boolean;
}

/** 节流适配器配置选项 */
export interface ThrottleAdapterOptions {
  /** 节流阈值（毫秒），默认 1000ms */
  threshold?: number;
  /** 需要节流的 HTTP 方法列表，默认 ['get', 'post', 'put', 'patch'] */
  methods?: string[];
  /** 需要排除节流的 URL 模式 */
  excludeUrls?: Array<string | RegExp | ((url: string) => boolean)>;
  /** 需要排除节流的请求方法列表 */
  excludeMethods?: string[];
  /** 缓存清理间隔（毫秒），默认 30000ms */
  cleanupInterval?: number;
  /** 是否在请求失败后立即清理缓存，默认 true */
  clearOnError?: boolean;
  /** 是否显示"点击过于频繁"提示，默认 true */
  showThrottleTip?: boolean;
  /** 需要显示提示的 HTTP 方法列表，默认与 methods 相同，可单独配置 */
  tipMethods?: string[];
  /** 提示消息内容，默认 "操作过于频繁，请稍后再试" */
  throttleTipMessage?: string;
  /** 提示回调函数，如果提供则使用自定义提示方式，否则使用默认提示 */
  onThrottle?: (message: string, config: ExtendedAxiosRequestConfig) => void;
  /** 提示防抖间隔（毫秒），同一请求的提示间隔，默认 2000ms */
  tipThrottleInterval?: number;
}
