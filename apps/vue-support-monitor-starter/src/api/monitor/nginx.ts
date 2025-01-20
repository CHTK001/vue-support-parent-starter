import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取nginx配置列表
 */
export const fetchPageNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/nginx/config/page", {
    params,
    headers: {
      "x-remote-animation": "false"
    }
  });
};
/**
 * 更新nginx配置
 */
export const fetchUpdateNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/nginx/config/update", { data: params });
};
/**
 * 新增nginx配置
 */
export const fetchSaveNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/nginx/config/save", { data: params });
};
/**
 * 删除nginx配置
 */
export const fetchDeleteNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/nginx/config/delete", { params });
};
/**
 * 解析nginx配置
 */
export const fetchAnalysisNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/nginx/config/config", { params });
};

/**
 * 解析nginx配置
 */
export const fetchAnalysisIncludeNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/nginx/config/configFormInclude", { params });
};

export const fetchCreateNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/nginx/config/create", { data: params });
};
/**
 * 解析nginx配置到数据库
 */
export const fetchAnalysisConfigNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/nginx/config/configAnalysis", { data: params });
};

/**
 * 启动nginx配置
 */
export const fetchStartNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/nginx/config/start", { data: params });
};

/**
 * 停止nginx配置
 */
export const fetchStopNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/nginx/config/stop", { data: params });
};
/**
 * 重启nginx配置
 */
export const fetchRestartNginxConfig = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/nginx/config/restart", { data: params });
};
