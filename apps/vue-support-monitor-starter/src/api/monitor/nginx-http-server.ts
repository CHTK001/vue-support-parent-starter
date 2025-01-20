import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取nginx配置列表
 */
export const fetchPageNginxHttpServerConfig = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/nginx/config/http/server/page", {
    params,
    headers: {
      "x-remote-animation": "false"
    }
  });
};
/**
 * 更新nginx配置
 */
export const fetchSaveOrUpdateNginxHttpServerConfig = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/nginx/config/http/server/saveOrUpdate", { data: params });
};

/**
 * 删除nginx配置
 */
export const fetchDeleteNginxHttpServerConfig = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/nginx/config/http/server/delete", { params });
};
