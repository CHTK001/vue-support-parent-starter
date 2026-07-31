import axios, { AxiosRequestConfig, AxiosResponse, AxiosHeaders, AxiosError, Method, ResponseType } from "axios";

export type RequestBody = Record<string, unknown> | unknown[] | FormData | string | null;

export interface ChainableRequest {
  query(params: Record<string, unknown>): ChainableRequest;
  headers(headers: Record<string, string>): ChainableRequest;
  data(body: RequestBody): ChainableRequest;
  responseType(type: ResponseType): ChainableRequest;
  timeout(ms: number): ChainableRequest;
  then<TResult1 = AxiosResponse, TResult2 = never>(
    onfulfilled?: ((value: AxiosResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<AxiosResponse | TResult>;
  finally(onfinally?: (() => void) | null): Promise<AxiosResponse>;
}

class RequestBuilder implements ChainableRequest, PromiseLike<AxiosResponse> {
  private config: AxiosRequestConfig = {};

  constructor(
    private baseURL: string,
    private method: Method,
    url: string,
  ) {
    this.config.baseURL = baseURL;
    this.config.method = method;
    this.config.url = url;
    this.config.headers = new AxiosHeaders();
  }

  query(params: Record<string, unknown>): ChainableRequest {
    this.config.params = { ...this.config.params, ...params };
    return this;
  }

  headers(headers: Record<string, string>): ChainableRequest {
    Object.assign(this.config.headers, headers);
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

  private execute(): Promise<AxiosResponse> {
    return axios.request(this.config);
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
  private defaultConfig: Partial<AxiosRequestConfig> = {};

  constructor(baseURL = "", config?: Partial<AxiosRequestConfig>) {
    this.baseURL = baseURL;
    if (config) {
      this.defaultConfig = config;
    }
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  private request(method: Method, url: string): ChainableRequest {
    const builder = new RequestBuilder(this.baseURL, method, url);
    if (this.defaultConfig.timeout) {
      builder.timeout(this.defaultConfig.timeout);
    }
    if (this.defaultConfig.headers) {
      builder.headers(this.defaultConfig.headers as Record<string, string>);
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

export function createHttp(baseURL?: string, config?: Partial<AxiosRequestConfig>): Http {
  return new Http(baseURL, config);
}

export { AxiosError };