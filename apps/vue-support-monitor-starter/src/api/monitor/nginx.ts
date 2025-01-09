import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取nginx配置列表
 */
export const fetchPageNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/nginx/config/page", { params });
};
/**
 * 更新nginx配置
 */
export const fetchUpdateNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/nginx/config/page", { params });
};
