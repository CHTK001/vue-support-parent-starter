import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosHeaders,
  AxiosError,
  AxiosInstance,
  AxiosProgressEvent,
  Method,
  ResponseType,
  InternalAxiosRequestConfig,
} from "axios";
import { getConfig } from "@repo/config";
import type {
  ChainableRequest,
  HttpMetaConfig,
  HttpOptions,
  RequestBody,
  SseClient,
  SseClientOptions,
} from "./types";
import { createSseClient, createOpenAiSseClient, createSpringAiSseClient } from "./sse";
import type { OpenAiChunk, OpenAiSseOptions, SpringAiChunk, SpringAiSseOptions } from "./types";

const defaultOptions: HttpOptions = {
  useAppConfig: true,
  timeout: 10000,
};

/**
 * 模块级默认 axios 实例（拦截器所在）。
 *
 * 业务侧统一 `import { http } from "@repo/utils"` 使用本模块的 http()，
 * 但无参 http() 创建新 Http 时默认挂到全局 axios 上，会丢失 createApp
 * 注入的加密/签名/401/loading 拦截器。createApp 构建 HTTP 客户端后会调用
 * {@link setDefaultHttpInstance} 把带拦截器的实例回写到这里，
 * 使业务侧 http() 复用同一请求管线。
 */
let defaultInstance: typeof axios = axios;

/** 注入全局默认 axios 实例（createApp 构建 HTTP 客户端后调用） */
export function setDefaultHttpInstance(instance: AxiosInstance): void {
  defaultInstance = (instance ?? axios) as typeof axios;
}

type MetaRequestConfig = AxiosRequestConfig & { hc?: HttpMetaConfig };

/**
 * 标准化 URL：拼接 baseUrl 与相对路径，并统一处理斜杠。
 *
 * 规则：
 * - url 已为绝对地址（http(s):// 或 //）时原样返回（不拼接 baseUrl）；
 * - baseUrl 为空时原样返回 url（调用方传入的就是完整地址）；
 * - 其余情况拼接 baseUrl + url，自动去除多余的斜杠。
 */
export function normalizeUrl(baseUrl: string, url: string): string {
  const u = (url ?? "").trim();
  if (!u) return u;
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(u)) return u;
  const b = (baseUrl ?? "").trim().replace(/\/+$/, "");
  if (!b) return u;
  return `${b}/${u.replace(/^\/+/, "")}`;
}

class RequestBuilder implements ChainableRequest, PromiseLike<AxiosResponse> {
  private config: MetaRequestConfig;
  private instance: AxiosInstance;

  constructor(
    baseURL: string,
    method: Method,
    url: string,
    defaults: { timeout?: number; headers?: Record<string, string> },
    instance: AxiosInstance,
  ) {
    this.instance = instance;
    this.config = {
      method,
      url: normalizeUrl(baseURL, url),
      timeout: defaults.timeout,
      headers: new AxiosHeaders(defaults.headers),
    };
  }

  query(params: Record<string, unknown>): ChainableRequest {
    this.config.params = { ...this.config.params, ...params };
    return this;
  }

  headers(headers: Record<string, string>): ChainableRequest {
    Object.assign(this.config.headers!, headers);
    return this;
  }

  data(body: RequestBody): ChainableRequest {
    this.config.data = body;
    return this;
  }

  responseType(type: ResponseType): ChainableRequest {
    this.config.responseType = type;
    return this;
  }

  timeout(ms: number): ChainableRequest {
    this.config.timeout = ms;
    return this;
  }

  loading(show: boolean): ChainableRequest {
    this.config.hc = { ...this.config.hc, showLoading: show };
    return this;
  }

  encrypt(on: boolean): ChainableRequest {
    this.config.hc = { ...this.config.hc, encrypt: on };
    return this;
  }

  retry(on: boolean): ChainableRequest {
    this.config.hc = { ...this.config.hc, retry: on };
    return this;
  }

  noToast(on: boolean): ChainableRequest {
    this.config.hc = { ...this.config.hc, noToast: on };
    return this;
  }

  uploadProgress(handler: (event: AxiosProgressEvent) => void): ChainableRequest {
    this.config.onUploadProgress = handler;
    return this;
  }

  /**
   * 把当前链式请求转换为 SSE 客户端。
   *
   * 复用已设置的 method / url / headers / data / params，
   * 额外选项（onMessage、reconnect、auth、parseData 等）通过 sseOptions 覆盖。
   *
   * 注意：调用 sse() 后本构建器不再用于发起普通 HTTP 请求；
   *       若需要同时保留普通链式 + SSE 入口，请使用 `http.createSse()`。
   *
   * 典型用法：
   * ```ts
   * http.post('/api/chat').data({ prompt }).sse({
   *   onMessage: (e) => console.log(e.data),
   * });
   * ```
   *
   * @param sseOptions 额外的 SSE 客户端选项（method/headers/body 字段会被本构建器的值覆盖）
   * @returns SSE 客户端实例，调用 close() 终止连接
   */
  sse<T = unknown>(sseOptions: Omit<SseClientOptions<T>, "method" | "headers" | "body"> = {}): SseClient {
    const finalUrl = (() => {
      const u = this.config.url ?? "";
      if (!this.config.params) return u;
      try {
        const parsed = new URL(u, typeof window !== "undefined" ? window.location.href : undefined);
        for (const [k, v] of Object.entries(this.config.params)) {
          if (v === undefined || v === null) continue;
          parsed.searchParams.set(k, String(v));
        }
        return parsed.toString();
      } catch {
        return u;
      }
    })();

    const headers: Record<string, string> = {};
    const rawHeaders = this.config.headers;
    if (rawHeaders) {
      if (rawHeaders instanceof AxiosHeaders) {
        rawHeaders.forEach((v: unknown, k: string) => {
          if (typeof v === "string") headers[k] = v;
        });
      } else {
        for (const [k, v] of Object.entries(rawHeaders)) {
          if (typeof v === "string") headers[k] = v;
        }
      }
    }

    return createSseClient<T>(finalUrl, {
      ...sseOptions,
      method: (this.config.method as Method) === "GET" ? "GET" : "POST",
      headers,
      body: this.config.data,
    });
  }

  private execute(): Promise<AxiosResponse> {
    return this.instance.request(this.config);
  }

  then<TResult1 = AxiosResponse, TResult2 = never>(
    onfulfilled?: ((value: AxiosResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<AxiosResponse | TResult> {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<AxiosResponse> {
    return this.execute().finally(onfinally);
  }
}

export class Http {
  private baseURL: string;
  private options: HttpOptions;
  private instance: AxiosInstance;

  constructor(options: HttpOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    this.instance = options.instance ?? defaultInstance;
    this.baseURL = this.resolveBaseURL();
  }

  /** 判断 API 响应是否成功（根据 code 或 success 字段） */
  static isSuccessful(
    data: unknown,
    successCode: string = "00000",
  ): data is { data?: unknown; code?: string; msg?: string; success?: boolean; ok?: boolean } {
    if (!data || typeof data !== "object") return false;
    const d = data as Record<string, unknown>;
    if (d.success === false || d.ok === false) return false;
    if (d.code && d.code !== successCode) return false;
    return true;
  }

  /** HTTP 2xx 且 API 响应成功的快捷判断 */
  static is200Successful(
    data: unknown,
    successCode: string = "00000",
  ): boolean {
    return this.isSuccessful(data, successCode);
  }

  /** 解析最终 baseURL：手动 baseUrl > config.http.baseUrl */
  private resolveBaseURL(): string {
    if (this.options.baseUrl !== undefined) {
      return this.options.baseUrl;
    }
    if (this.options.useAppConfig) {
      return getConfig().http.baseUrl;
    }
    return "";
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  /** 暴露底层 axios 实例（拦截器所在），供模块复用同一请求管线（如 device/spider 自定义 baseUrl） */
  getInstance(): AxiosInstance {
    return this.instance;
  }

  private buildDefaults(): {
    timeout?: number;
    headers?: Record<string, string>;
    apiVersion?: string;
  } {
    let timeout = this.options.timeout;
    const headers = { ...this.options.headers };
    let apiVersion: string | undefined;
    if (this.options.useAppConfig) {
      const cfg = getConfig();
      if (timeout === undefined) {
        timeout = cfg.http?.timeout;
      }
      apiVersion = cfg.http?.apiVersion;
    }
    return { timeout, headers, apiVersion };
  }

  private request(method: Method, url: string): ChainableRequest {
    const defaults = this.buildDefaults();
    // 完整 URL 不走 baseURL，直接请求
    const isFullUrl = /^https?:\/\//i.test(url);
    const builder = new RequestBuilder(isFullUrl ? "" : this.baseURL, method, url, defaults, this.instance);
    // apiVersion 拼成 query 参数：?version=v1
    if (defaults.apiVersion) {
      builder.query({ version: defaults.apiVersion });
    }
    return builder;
  }

  get(url: string): ChainableRequest {
    return this.request("GET", url);
  }

  post(url: string): ChainableRequest {
    return this.request("POST", url);
  }

  put(url: string): ChainableRequest {
    return this.request("PUT", url);
  }

  delete(url: string): ChainableRequest {
    return this.request("DELETE", url);
  }

  patch(url: string): ChainableRequest {
    return this.request("PATCH", url);
  }

  head(url: string): ChainableRequest {
    return this.request("HEAD", url);
  }

  /**
   * 创建通用 SSE 客户端（基于 @microsoft/fetch-event-source）。
   *
   * 复用本 Http 实例的 baseURL 解析策略与全局 headers/auth 行为，
   * 内部委托给 `./sse/client.ts` 的 createSseClient。
   *
   * 典型用法：
   * ```ts
   * const client = http.createSse('/api/chat', {
   *   method: 'POST',
   *   body: { prompt: 'hi' },
   *   onMessage: (e) => console.log(e.data),
   * });
   * // 终止
   * client.close();
   * ```
   *
   * @param url 相对路径（走 baseURL）或完整 URL
   * @param options SSE 客户端选项，method/headers/body 在此显式传入
   * @returns SSE 客户端实例
   */
  createSse<T = unknown>(url: string, options: SseClientOptions<T> = {}): SseClient {
    const { method = "POST", headers = {}, body, ...rest } = options;
    return createSseClient<T>(this.resolveRequestUrl(url), {
      ...rest,
      method,
      headers: { ...this.options.headers, ...headers },
      body,
    });
  }

  /**
   * 创建 OpenAI 协议 SSE 客户端（/v1/chat/completions 流式响应）。
   *
   * 自动处理 [DONE] 结束标记、finish_reason='stop'、content 增量累积。
   * 复用本 Http 实例的 baseURL 与全局 headers。
   *
   * 典型用法：
   * ```ts
   * const client = http.createOpenAiSse('/v1/chat/completions', {
   *   body: { model: 'gpt-4', stream: true, messages: [...] },
   *   onChunk: (chunk) => process.stdout.write(chunk.choices[0]?.delta?.content ?? ''),
   *   onEnd: (full) => console.log('\n[done]', full.length, 'chars'),
   * });
   * ```
   */
  createOpenAiSse(url: string, options: Omit<OpenAiSseOptions, "method" | "headers" | "body"> & {
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: unknown;
  } = {}): SseClient {
    const { method = "POST", headers = {}, body, ...rest } = options;
    return createOpenAiSseClient(this.resolveRequestUrl(url), {
      ...rest,
      method,
      headers: { ...this.options.headers, ...headers },
      body,
    } as OpenAiSseOptions);
  }

  /**
   * 创建 Spring AI 协议 SSE 客户端（适配后端 AI 服务的流式响应）。
   *
   * 自动处理 chunk.done / chunk.error 收尾、content 增量累积。
   * 复用本 Http 实例的 baseURL 与全局 headers。
   */
  createSpringAiSse(url: string, options: Omit<SpringAiSseOptions, "method" | "headers" | "body"> & {
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: unknown;
  } = {}): SseClient {
    const { method = "POST", headers = {}, body, ...rest } = options;
    return createSpringAiSseClient(this.resolveRequestUrl(url), {
      ...rest,
      method,
      headers: { ...this.options.headers, ...headers },
      body,
    } as SpringAiSseOptions);
  }

  /**
   * 解析请求 URL：完整地址（http(s)://）原样返回，否则拼接 baseURL。
   * 与 normalizeUrl 行为一致；提取为实例方法供 createSse 等复用。
   */
  private resolveRequestUrl(url: string): string {
    return normalizeUrl(this.baseURL, url);
  }
}

/** 创建请求实例，默认从 @repo/config 读取 baseUrl 与 request 配置 */
export function createHttp(options?: HttpOptions): Http {
  return new Http(options);
}

/**
 * 解包标准后端返回结构 { code, data, msg }，直接取业务数据。
 *
 * 兼容两种 axios 包装层级：
 * - 拦截器已剥离一层：res 即 { code, data, msg }；
 * - 未剥离：res 为 AxiosResponse，业务结构位于 res.data。
 *
 * 成功码判定复用 {@link Http.isSuccessful}（'00000' 或 success/ok 标记），
 * 失败时抛出携带后端 msg 的 Error，供页面统一 ElMessage 提示。
 *
 * @param res 请求返回值（AxiosResponse 或裸响应体）
 * @param successCode 成功码，默认 '00000'
 * @returns 业务数据
 */
export function unwrapResult<T>(res: unknown, successCode: string = "00000"): T {
  // 剥离 AxiosResponse 外壳，得到业务结构
  const body = (res as { data?: unknown })?.data ?? res;
  if (Http.isSuccessful(body, successCode)) {
    return ((body as { data?: unknown }).data ?? (body as T)) as T;
  }
  const msg = (body as { msg?: string })?.msg;
  throw new Error(msg || "请求失败");
}

export { AxiosError };
export type { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig };

/** 快捷别名：http() === createHttp() */
export const http = createHttp;
