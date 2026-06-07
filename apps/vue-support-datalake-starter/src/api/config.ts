import { http, type RequestMethods } from "@repo/utils";

type RequestConfig = {
  url: string;
  method?: RequestMethods | string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
};

export default function request<T = any>(config: RequestConfig) {
  return http.request<T>((config.method || "get") as RequestMethods, config.url, {
    params: config.params,
    data: config.data,
    headers: config.headers,
  });
}
