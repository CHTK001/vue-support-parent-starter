import type { Method, AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";

export type resultType = {
  accessToken?: string;
};

export type RequestMethods = Extract<Method, "get" | "post" | "put" | "delete" | "patch" | "option" | "head">;

export interface PureHttpError extends AxiosError {
  isCancelRequest?: boolean;
}

export interface PureHttpResponse extends AxiosResponse {
  config: PureHttpRequestConfig;
}

export interface PureHttpRequestConfig extends AxiosRequestConfig {
  beforeRequestCallback?: (request: PureHttpRequestConfig) => void;
  beforeResponseCallback?: (response: PureHttpResponse) => void;
}

export interface SSEOptions {
  onmessage?: (event: MessageEvent) => void;
  onopen?: (response: Response) => void;
  onerror?: (error: any) => void;
  onclose?: () => void;
  headers?: Record<string, string>;
  method?: string;
  body?: string | FormData;
  signal?: AbortSignal;
}

export default class PureHttp {
  request<T>(method: RequestMethods, url: string, param?: AxiosRequestConfig, axiosConfig?: PureHttpRequestConfig): Promise<T> & { requestId: string };
  post<T, P>(url: string, params?: P, config?: PureHttpRequestConfig): Promise<T>;
  get<T, P>(url: string, params?: P, config?: PureHttpRequestConfig): Promise<T>;
  abort(requestId?: string, reason?: string): void;
  getActiveRequestsCount(): number;
  getActiveRequestIds(): string[];
  sse(url: string, options?: SSEOptions): AbortController;
}
