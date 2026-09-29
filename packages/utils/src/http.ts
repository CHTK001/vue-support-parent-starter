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
 * 第一方客户端标识 —— 字段一：承载请求头名
 *
 * <p>服务端「消息头拦截」默认会拦掉爬虫与自动化客户端的 User-Agent，特征清单里
 * 也含 curl / axios / okhttp 这类通用 HTTP 客户端 —— 用 UA 根本分不出「脚本」与
 * 「爬虫」。自家前端如果不做标识，会被自己刚上线的规则挡在门外。</p>
 *
 * <p>选 X-Trace-Id 是因为它本来就该出现在每个请求里（本系统的 MDC 链路追踪
 * 就在读它），标记藏在取值末尾不显眼。</p>
 */
export const FIRST_PARTY_HEADER_A = "X-Trace-Id";

/**
 * 第一方客户端标识 —— 字段二：承载请求头名
 *
 * <p>X-Requested-With 是 AJAX 的事实标准头（jQuery / axios 都发这个），
 * 一个不带它的请求本身就可疑，所以标记放在这里同样不显眼。</p>
 *
 * <p>服务端要求<b>两个字段同时</b>满足才豁免，只满足一个不算。</p>
 */
export const FIRST_PARTY_HEADER_B = "X-Requested-With";

/**
 * 第一方标记（两个字段的取值都要以它结尾）
 *
 * <p>刻意是个短小、无语义、看起来像随机后缀的串，而不是 "chua-console"
 * 这种一眼看出用途的明文。</p>
 */
export const FIRST_PARTY_MARKER = "-7f3a";

/**
 * 造一个「看起来正常」的 X-Requested-With 取值
 *
 * @returns 形如 `XMLHttpRequest-7f3a` 的取值
 */
function firstPartyRequestedWith(): string {
  return `XMLHttpRequest${FIRST_PARTY_MARKER}`;
}

/**
 * 造一个「看起来正常」的 X-Trace-Id 取值
 *
 * <p>32 位十六进制 + 标记，形态与真实链路追踪 id 一致，不引人注意。</p>
 *
 * @returns 形如 `3f2a9c1b8e7d4056a2c1b9f3e8d70561-7f3a` 的取值
 */
function firstPartyTraceId(): string {
  let hex = "";
  for (let i = 0; i < 32; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return `${hex}${FIRST_PARTY_MARKER}`;
}

/**
 * 第一方标识请求头
 *
 * <p><b>不是安全凭证</b>：两个头的取值都能伪造，凑齐即可整体绕过。
 * 双字段只是把「要绕过就得同时注意到两处」的成本抬高一点。
 * 不接受任何后门的部署，服务端把 first-party-enabled 关掉即可。</p>
 *
 * <p><b>刻意不写进 User-Agent</b>：浏览器不允许 JS 设置 User-Agent
 * （Fetch 规范把它列为 forbidden header name，axios/XHR 写入会被静默丢弃），
 * 写了也发不出去。</p>
 *
 * @returns 带两个标识字段的请求头
 */
function firstPartyHeaders(): Record<string, string> {
  return {
    [FIRST_PARTY_HEADER_A]: firstPartyTraceId(),
    [FIRST_PARTY_HEADER_B]: firstPartyRequestedWith(),
  };
}

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
      // 不能用 instanceof AxiosHeaders 判断，也不该用 Object.entries 兜底：
      // AxiosHeaders 的键值存在内部自有属性上，Object.entries 拿到的是一批
      // undefined，forEach 在某些打包/多副本场景下又不是函数，
      // 实测直接把 sse() 打成 `TypeError: r.forEach is not a function`，
      // 建连在发请求之前就崩，表现为「实时推送一直连不上」且毫无堆栈提示。
      // toJSON() 是 AxiosHeaders 自己的规范化出口，跨副本也稳定。
      if (typeof (rawHeaders as AxiosHeaders).toJSON === "function") {
        for (const [k, v] of Object.entries((rawHeaders as AxiosHeaders).toJSON())) {
          if (typeof v === "string") headers[k] = v;
        }
      } else {
        for (const [k, v] of Object.entries(rawHeaders as Record<string, string>)) {
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
    // 第一方标识放在这里注入，而不是让各业务模块自己带：
    // 这是所有 http() 请求的唯一收口，漏一处就会让那个调用被服务端的
    // 爬虫/自动化拦截规则挡下（表现为接口莫名 403，且很难联想到 UA 规则）。
    // 放在调用方之后再覆盖，允许个别请求改写，但默认一定有。
    const headers: Record<string, string> = {
      ...firstPartyHeaders(),
      ...this.options.headers,
    };
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
      headers: this.buildSseHeaders(headers),
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
      headers: this.buildSseHeaders(headers),
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
      headers: this.buildSseHeaders(headers),
      body,
    } as SpringAiSseOptions);
  }

  /**
   * SSE 请求头：同样带上第一方标识。
   *
   * <p>SSE 不走 {@link buildDefaults}（它自己拼 headers），所以第一方标识必须
   * 在这里补一次，否则只有 REST 请求带标识、流式请求不带 —— 那种「列表页正常、
   * 实时推送 403」的分裂现象极难排查。</p>
   *
   * @param extra 调用方本次显式传入的请求头（优先级高于默认值）
   * @returns 合并后的请求头
   */
  private buildSseHeaders(extra: Record<string, string>): Record<string, string> {
    return {
      ...firstPartyHeaders(),
      ...this.options.headers,
      ...extra,
    };
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
  // 把 HTTP 状态码与业务码一并挂到 Error 上：页面要能区分「任务不存在(404)」
  // 与「服务端抖动(5xx)」——前者是终态、该停止重试，后者才值得重试。
  // 只抛裸 Error 的话两者在页面侧完全无法区分。
  const httpStatus = (res as { status?: number })?.status;
  const bizCode = (body as { code?: string | number })?.code;
  const err = new Error(msg || "请求失败") as Error & {
    status?: number;
    code?: string | number;
  };
  if (httpStatus !== undefined) {
    err.status = httpStatus;
  }
  if (bizCode !== undefined) {
    err.code = bizCode;
  }
  throw err;
}

export { AxiosError };
export type { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig };

/** 快捷别名：http() === createHttp() */
export const http = createHttp;
