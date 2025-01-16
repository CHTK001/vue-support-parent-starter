import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取nginx配置列表
 */
export const fetchPageNginxHttpConfig = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/nginx/config/http/page", {
    params,
    headers: {
      "x-remote-animation": "false"
    }
  });
};
/**
 * 更新nginx配置
 */
export const fetchSaveOrUpdateNginxHttpConfig = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/nginx/config/http/saveOrUpdate", { data: params });
};
/**
 * 删除nginx配置
 */
export const fetchDeleteNginxHttpConfig = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/nginx/config/http/delete", { params });
};
