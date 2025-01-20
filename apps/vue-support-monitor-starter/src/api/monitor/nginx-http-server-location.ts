import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取nginx配置列表
 */
export const fetchPageImportNginxHttpServerLocationConfig = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/nginx/config/http/server/location/pageImport", {
    params,
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取nginx配置列表
 */
export const fetchPageNginxHttpServerLocationConfig = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/nginx/config/http/server/location/page", {
    params,
    headers: {
      "x-remote-animation": "false"
    }
  });
};
/**
 * 更新nginx配置
 */
export const fetchSaveOrUpdateBatchNginxHttpServerLocaltionConfig = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/nginx/config/http/server/location/saveOrUpdateBatch", { data: params });
};
/**
 * 更新nginx配置
 */
export const fetchSaveOrUpdateNginxHttpServerLocationConfig = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/nginx/config/http/server/location/saveOrUpdate", { data: params });
};
/**
 * 删除nginx配置
 */
export const fetchDeleteNginxHttpServerLocationConfig = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/nginx/config/http/server/location/delete", { params });
};
