import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取Nacos配置列表
 * @param params 查询参数
 */
export const fetchNacosConfigList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/nacos/config/list", { params });
};

/**
 * 获取Nacos配置详情
 * @param params 查询参数
 */
export const fetchNacosConfigDetail = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/nacos/config/detail", { params });
};

/**
 * 保存Nacos配置
 * @param data 配置数据
 */
export const fetchNacosConfigSave = (data: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/nacos/config/save", { data });
};

/**
 * 更新Nacos配置
 * @param data 配置数据
 */
export const fetchNacosConfigUpdate = (data: any) => {
  return http.request<ReturnResult<any>>("put", "v1/gen/nacos/config/update", { data });
};

/**
 * 删除Nacos配置
 * @param params 配置ID
 */
export const fetchNacosConfigDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/gen/nacos/config/delete", { params });
};

/**
 * 获取Nacos命名空间列表
 * @param params 查询参数
 */
export const fetchNacosNamespaceList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/nacos/namespace/list", { params });
};

/**
 * 创建Nacos命名空间
 * @param data 命名空间数据
 */
export const fetchNacosNamespaceSave = (data: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/nacos/namespace/save", { data });
};

/**
 * 删除Nacos命名空间
 * @param params 命名空间ID
 */
export const fetchNacosNamespaceDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/gen/nacos/namespace/delete", { params });
};

/**
 * 获取Nacos服务列表
 * @param params 查询参数
 */
export const fetchNacosServiceList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/nacos/service/list", { params });
};

/**
 * 获取Nacos服务详情
 * @param params 查询参数
 */
export const fetchNacosServiceDetail = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/nacos/service/detail", { params });
};

/**
 * 获取Nacos实例列表
 * @param params 查询参数
 */
export const fetchNacosInstanceList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/nacos/instance/list", { params });
};

/**
 * 执行Nacos命令
 * @param data 命令数据
 */
export const fetchNacosExecute = (data: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/nacos/execute", { data });
};
