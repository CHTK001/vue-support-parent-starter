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
//************************************配置*********************************************** */

/**
 * 查询配置列表
 */
export const fetchProxyConfigList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/plugin/config/list", { params });
};
/**
 * 更新配置
 */
export const fetchProxyConfigUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/proxy/plugin/config/update", { data: params });
};
/**
 * 更新配置
 */
export const fetchProxyConfigSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/proxy/plugin/config/save", { data: params });
};
//************************************插件*********************************************** */

/**
 * 查询插件列表
 */
export const fetchProxyPluginList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/plugin/list", { params });
};
/**
 * 新增插件
 */

export const fetchProxyPluginSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/proxy/plugin/save", { data: params });
};
/**
 * 更新插件
 */

export const fetchProxyPluginUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/proxy/plugin/save", { data: params });
};

/**
 * 删除插件
 */
export const fetchProxyPluginDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/proxy/plugin/delete", { params });
};
//************************************静态代理*********************************************** */

/**
 * 分页查询代理统计列表
 */
export const fetchProxyStatisticPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/statistic/page", { params });
};

/**
 * 新增代理统计
 */
export const fetchProxyStatisticSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/proxy/statistic/save", { data: params });
};

/**
 * 修改代理统计
 */
export const fetchProxyStatisticUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/proxy/statistic/update", { data: params });
};

/**
 * 删除代理统计
 */
export const fetchProxyStatisticDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/proxy/statistic/delete", { params });
};
//************************************限流*********************************************** */

/**
 * 分页查询代理统计列表
 */
export const fetchProxyLimitPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/plugin/limit/page", { params });
};

/**
 * 新增代理统计
 */
export const fetchProxyLimitSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/proxy/plugin/limit/save", { data: params });
};

/**
 * 修改代理统计
 */
export const fetchProxyLimitUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/proxy/plugin/limit/update", { data: params });
};

/**
 * 删除代理统计
 */
export const fetchProxyLimitDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/proxy/plugin/limit/delete", { params });
};
//************************************名单*********************************************** */

/**
 * 分页查询代理统计列表
 */
export const fetchProxyListPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/plugin/list/page", { params });
};

/**
 * 新增代理统计
 */
export const fetchProxyListSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/proxy/plugin/list/save", { data: params });
};

/**
 * 修改代理统计
 */
export const fetchProxyListUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/proxy/plugin/list/update", { data: params });
};

/**
 * 删除代理统计
 */
export const fetchProxyListDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/proxy/plugin/list/delete", { params });
};
//************************************名单*********************************************** */

/**
 * 分页查询代理统计列表
 */
export const fetchProxyLogPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/log/page", { params });
};

/**
 * 代理统计
 */
export const fetchProxyLogStatistic = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/proxy/log/statistic", { params });
};
/**
 * 删除代理统计
 */
export const fetchProxyLogDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/proxy/log/delete", { params });
};
