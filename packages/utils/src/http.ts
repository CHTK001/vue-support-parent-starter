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
      baseURL,
      method,
      url,
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
    const builder = new RequestBuilder(this.baseURL, method, url, defaults, this.instance);
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
