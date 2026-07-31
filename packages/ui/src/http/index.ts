/**
 * @repo/ui/http —— fetch 封装（重试 + 防抖 + 拦截器）
 */
export {
  HttpClient,
  HttpError,
  http,
  debounce,
} from "./httpClient";

export type {
  HttpMethod,
  HttpRequestConfig,
  HttpResponse,
  HttpGlobalConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from "./httpClient";