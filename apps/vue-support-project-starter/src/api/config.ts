import { http, type RequestMethods } from "@repo/utils";

type RequestConfig = {
  url: string;
  method?: RequestMethods | string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
};

export default function request<T = any>(config: RequestConfig) {
  const method = (config.method || "get").toLowerCase() as RequestMethods;
  return http.request<T>(method, config.url, {
    params: config.params,
    data: config.data,
    headers: config.headers,
  });
}

export function loadRouterBase(url: string, params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const suffix = query.toString();
  return suffix ? `${url}?${suffix}` : url;
}

export function getWebSocketUrl(url: string, parameter: string) {
  const protocol = location.protocol === "https:" ? "wss://" : "ws://";
  return `${protocol}${location.host}${url}?${parameter}`;
}
