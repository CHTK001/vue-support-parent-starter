import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取prometheus是否在线
 */
export const fetchPrometheusOnline = (params: any) => {
  return http.request<ReturnResult<boolean>>("get", "/v2/prometheus/isOnline", { params });
};

/**
 * 重新加载prometheus
 */
export const fetchPrometheusReload = (params: any) => {
  return http.request<ReturnResult<boolean>>("get", "/v2/prometheus/reload", { params });
};
