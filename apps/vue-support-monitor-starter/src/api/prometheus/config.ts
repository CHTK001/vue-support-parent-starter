import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取prometheus配置
 */
export const fetchPrometheusListConfig = (params: any) => {
  return http.request<ReturnResult<boolean>>("get", "/v2/prometheus/config/list", { params });
};
/**
 * 共享prometheus配置
 */
export const fetchPrometheusShareConfig = (params: any) => {
  return http.request<ReturnResult<boolean>>("get", "/v2/prometheus/config/share", { params });
};

/**
 * 保存prometheus配置
 */
export const fetchPrometheusSaveConfig = (params: any) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/prometheus/config/save", { data: params });
};

/**
 * 更新prometheus配置
 */
export const fetchPrometheusUpdateConfig = (params: any) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/prometheus/config/update", { data: params });
};

/**
 * 删除prometheus配置
 */
export const fetchPrometheusDeleteConfig = (params: any) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/prometheus/config/delete", { params });
};
