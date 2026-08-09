import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosHeaders,
  AxiosError,
  AxiosInstance,
  Method,
  ResponseType,
  InternalAxiosRequestConfig,
} from "axios";
import { getConfig } from "@repo/config";
import type { ChainableRequest, HttpMetaConfig, HttpOptions, RequestBody } from "./types";

const defaultOptions: HttpOptions = {
  useAppConfig: true,
  timeout: 10000,
};

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
    this.instance = options.instance ?? axios;
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
}

/** 创建请求实例，默认从 @repo/config 读取 baseUrl 与 request 配置 */
export function createHttp(options?: HttpOptions): Http {
  return new Http(options);
}

export { AxiosError };
export type { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig };

/** 快捷别名：http() === createHttp() */
export const http = createHttp;
