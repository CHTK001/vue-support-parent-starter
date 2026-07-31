/**
 * HttpConfig —— fetch 封装（重试 + 防抖 + 拦截器）
 *
 * 默认行为：
 *   - GET 请求防抖（按 url+method+params 维度）防止重复请求
 *   - 失败自动重试（指数退避）
 *   - 请求/响应拦截器
 *   - 超时控制
 *
 * 用法：
 *   import { http } from '@repo/ui/http';
 *   await http.get('/api/users');
 *   await http.post('/api/users', body, { retry: 3 });
 */

import { debounce as debounceFn } from "../utils";

/** 请求方法 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

/** 请求配置 */
export interface HttpRequestConfig {
  /** 请求方法，默认 GET */
  method?: HttpMethod;
  /** url，相对地址会拼接 baseURL */
  url: string;
  /** query 参数（GET 自动转 query string，其它方法转 body 字段） */
  params?: Record<string, unknown>;
  /** 请求体（JSON） */
  data?: unknown;
  /** 自定义 headers */
  headers?: Record<string, string>;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数（不含首次），默认 0 */
  retry?: number;
  /** 重试间隔基数（毫秒），按指数退避：base * 2^(attempt-1) */
  retryDelay?: number;
  /** 是否参与 GET 防抖，默认 true */
  debounce?: boolean;
  /** 防抖时间（毫秒），默认 300 */
  debounceWait?: number;
  /** 跳过拦截器 */
  skipInterceptor?: boolean;
  /** AbortSignal */
  signal?: AbortSignal;
  /** 响应类型 */
  responseType?: "json" | "text" | "blob";
}

/** HTTP 响应 */
export interface HttpResponse<T = unknown> {
  /** 业务数据（已剥离常见的 code/message 包装） */
  data: T;
  /** 原始响应体 */
  raw: unknown;
  /** HTTP 状态码 */
  status: number;
  /** 响应 headers */
  headers: Headers;
  /** 是否成功（HTTP 层） */
  ok: boolean;
}

/** 请求拦截器：可修改 config 或返回新 config；返回 null 表示取消 */
export type RequestInterceptor = (
  config: HttpRequestConfig,
) => HttpRequestConfig | null | Promise<HttpRequestConfig | null>;

/** 响应拦截器：可包装或修改响应 */
export type ResponseInterceptor = <T>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;

/** 错误拦截器：可处理错误；返回响应表示"已恢复"，抛出表示继续 */
export type ErrorInterceptor = (error: HttpError) => HttpResponse | Promise<HttpResponse> | never | Promise<never>;

export class HttpError extends Error {
  /** HTTP 状态码（如果是 fetch 抛出的错） */
  status?: number;
  /** 原始响应体 */
  raw?: unknown;
  /** 原始 config */
  config: HttpRequestConfig;
  constructor(message: string, config: HttpRequestConfig, status?: number, raw?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.raw = raw;
    this.config = config;
  }
}

/** 全局默认配置 */
export interface HttpGlobalConfig {
  baseURL?: string;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
  debounceWait?: number;
  headers?: Record<string, string>;
}

/** GET 防抖缓存：按 key 缓存最近一次 promise */
const debounceCache = new Map<string, Promise<unknown>>();

function genKey(method: string, url: string, params?: Record<string, unknown>): string {
  return `${method.toUpperCase()}::${url}::${JSON.stringify(params ?? {})}`;
}

/** 序列化 params 为 query string（跳过 undefined/null/空） */
function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export class HttpClient {
  private globalConfig: HttpGlobalConfig = {};
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  /** 设置全局配置（合并） */
  config(cfg: HttpGlobalConfig): this {
    this.globalConfig = { ...this.globalConfig, ...cfg };
    return this;
  }

  /** 获取当前全局配置 */
  getConfig(): HttpGlobalConfig {
    return { ...this.globalConfig };
  }

  /** 注册请求拦截器 */
  useRequest(fn: RequestInterceptor): this {
    this.requestInterceptors.push(fn);
    return this;
  }

  /** 注册响应拦截器 */
  useResponse(fn: ResponseInterceptor): this {
    this.responseInterceptors.push(fn);
    return this;
  }

  /** 注册错误拦截器 */
  useError(fn: ErrorInterceptor): this {
    this.errorInterceptors.push(fn);
    return this;
  }

  /** 执行请求 */
  async request<T = unknown>(cfg: HttpRequestConfig): Promise<HttpResponse<T>> {
    // 合并全局配置
    let merged: HttpRequestConfig = {
      method: "GET",
      timeout: this.globalConfig.timeout ?? 15000,
      retry: this.globalConfig.retry ?? 0,
      retryDelay: this.globalConfig.retryDelay ?? 500,
      debounceWait: this.globalConfig.debounceWait ?? 300,
      debounce: cfg.method === undefined || cfg.method === "GET",
      ...cfg,
      headers: { ...(this.globalConfig.headers ?? {}), ...(cfg.headers ?? {}) },
    };

    // GET 防抖：同 key 短时间内只发一次
    const isGet = (merged.method ?? "GET").toUpperCase() === "GET";
    if (isGet && merged.debounce !== false) {
      const key = genKey(merged.method ?? "GET", merged.url, merged.params);
      const cached = debounceCache.get(key);
      if (cached) return cached as Promise<HttpResponse<T>>;
      const p = this._execute<T>(merged).finally(() => {
        // 防抖窗口结束后再清理缓存
        setTimeout(() => debounceCache.delete(key), merged.debounceWait ?? 300);
      });
      debounceCache.set(key, p);
      return p;
    }

    return this._execute<T>(merged);
  }

  private async _execute<T>(cfg: HttpRequestConfig): Promise<HttpResponse<T>> {
    // 请求拦截器链
    if (!cfg.skipInterceptor) {
      for (const interceptor of this.requestInterceptors) {
        const result = await interceptor(cfg);
        if (result === null) {
          throw new HttpError("请求已被拦截器取消", cfg);
        }
        cfg = result;
      }
    }

    const { url, method = "GET", params, data, headers, timeout, retry = 0, retryDelay = 500 } = cfg;
    const fullUrl = `${this.globalConfig.baseURL ?? ""}${url}${
      method === "GET" ? buildQuery(params) : ""
    }`;

    // 超时控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error("请求超时")), timeout);
    const externalSignal = cfg.signal;
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort(externalSignal.reason);
      else externalSignal.addEventListener("abort", () => controller.abort(externalSignal.reason), { once: true });
    }

    const init: RequestInit = {
      method,
      headers: { Accept: "application/json", ...headers },
      signal: controller.signal,
    };
    if (method !== "GET" && method !== "HEAD" && data !== undefined) {
      (init.headers as Record<string, string>)["Content-Type"] =
        (init.headers as Record<string, string>)["Content-Type"] ?? "application/json";
      init.body = typeof data === "string" ? data : JSON.stringify(data);
    }

    // 重试循环（指数退避）
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const res = await fetch(fullUrl, init);
        clearTimeout(timeoutId);
        if (!res.ok) {
          // 4xx 不重试，5xx 重试
          if (res.status < 500 && res.status >= 400) {
            const raw = await this.parseBody(res, cfg.responseType);
            throw new HttpError(`HTTP ${res.status}`, cfg, res.status, raw);
          }
          if (attempt < retry) {
            await this.delay(retryDelay * Math.pow(2, attempt));
            continue;
          }
          const raw = await this.parseBody(res, cfg.responseType);
          throw new HttpError(`HTTP ${res.status}`, cfg, res.status, raw);
        }
        const raw = await this.parseBody(res, cfg.responseType);
        const httpResp: HttpResponse<T> = {
          data: raw as T,
          raw,
          status: res.status,
          headers: res.headers,
          ok: res.ok,
        };

        // 响应拦截器链
        if (!cfg.skipInterceptor) {
          let resp: HttpResponse<T> = httpResp;
          for (const interceptor of this.responseInterceptors) {
            resp = (await interceptor(resp)) as HttpResponse<T>;
          }
          return resp;
        }
        return httpResp;
      } catch (e) {
        clearTimeout(timeoutId);
        lastError = e instanceof Error ? e : new Error(String(e));
        // AbortError 不重试
        if (lastError.name === "AbortError") break;
        if (attempt >= retry) break;
        await this.delay(retryDelay * Math.pow(2, attempt));
      }
    }

    // 错误拦截器链
    const httpErr =
      lastError instanceof HttpError
        ? lastError
        : new HttpError(lastError?.message ?? "请求失败", cfg);
    if (!cfg.skipInterceptor) {
      for (const interceptor of this.errorInterceptors) {
        try {
          const resp = await interceptor(httpErr);
          return resp as HttpResponse<T>;
        } catch (re) {
          if (re !== httpErr) throw re;
        }
      }
    }
    throw httpErr;
  }

  private async parseBody(res: Response, type?: "json" | "text" | "blob"): Promise<unknown> {
    const t = type ?? "json";
    if (t === "text") return res.text();
    if (t === "blob") return res.blob();
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** GET */
  get<T = unknown>(url: string, params?: Record<string, unknown>, cfg?: Omit<HttpRequestConfig, "url" | "method" | "params">): Promise<HttpResponse<T>> {
    return this.request<T>({ ...cfg, url, method: "GET", params });
  }
  /** POST */
  post<T = unknown>(url: string, data?: unknown, cfg?: Omit<HttpRequestConfig, "url" | "method" | "data">): Promise<HttpResponse<T>> {
    return this.request<T>({ ...cfg, url, method: "POST", data });
  }
  put<T = unknown>(url: string, data?: unknown, cfg?: Omit<HttpRequestConfig, "url" | "method" | "data">): Promise<HttpResponse<T>> {
    return this.request<T>({ ...cfg, url, method: "PUT", data });
  }
  delete<T = unknown>(url: string, params?: Record<string, unknown>, cfg?: Omit<HttpRequestConfig, "url" | "method" | "params">): Promise<HttpResponse<T>> {
    return this.request<T>({ ...cfg, url, method: "DELETE", params });
  }
}

/** 默认实例 */
export const http = new HttpClient();

// 重新导出 debounce 供业务使用
export { debounceFn as debounce };