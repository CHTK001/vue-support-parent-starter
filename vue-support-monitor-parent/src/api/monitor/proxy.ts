import { http, type ReturnResult } from "@/utils/http";

/**
 * 分页查询代理列表
 */
export const fetchProxyPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/page", { params });
};

/**
 * 删除代理
 */
export const fetchProxyDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/proxy/delete", { params });
};
/**
 * 修改代理
 */
export const fetchProxyUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/proxy/update", { data: params });
};
/**
 * 新增代理
 */
export const fetchProxySave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/proxy/save", { data: params });
};
/**
 * 启动代理
 */
export const fetchProxyStart = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/start", { params });
};

/**
 * 停止代理
 */
export const fetchProxyStop = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/stop", { params });
};

/**
 * 查询配置列表
 */
export const fetchProxyConfigList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/config/list", { params });
};
/**
 * 查询插件列表
 */
export const fetchProxyPluginList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/plugin/list", { params });
};
