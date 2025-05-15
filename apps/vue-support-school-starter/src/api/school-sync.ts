import { http, type ReturnResult } from "@repo/utils";

/**
 * 同步配置查询对象类型
 */
export interface SchoolSyncConfigQuery {
  schoolId?: number;
  schoolSyncConfigName?: string;
  schoolSyncConfigType?: string;
  schoolSyncConfigStatus?: number;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 同步配置对象类型
 */
export interface SchoolSyncConfig {
  schoolSyncConfigId?: number;
  schoolSyncConfigName: string;
  schoolSyncConfigCode?: string;
  schoolSyncConfigType?: string;
  schoolSyncConfigCookie?: string;
  schoolSyncConfigProxyHost?: string;
  schoolSyncConfigProxyPort?: number;
  schoolSyncConfigProxyUsername?: string;
  schoolSyncConfigProxyPassword?: string;
  schoolSyncConfigSyncType?: string;
  schoolSyncConfigUrl?: string;
  schoolSyncConfigEnabled?: boolean;
  schoolSyncConfigParams?: string;
  schoolSyncConfigSchedule?: string;
  schoolSyncConfigLastTime?: string;
  schoolSyncConfigNextTime?: string;
  schoolSyncConfigStatus?: number;
  schoolSyncConfigCreateBy?: string;
  schoolSyncConfigCreateTime?: string;
  schoolSyncConfigUpdateBy?: string;
  schoolSyncConfigUpdateTime?: string;
  schoolSyncConfigRemark?: string;
  schoolSyncConfigDeleted?: number;
}
/**
 * 同步配置执行
 * @param params 查询参数
 * @returns 同步配置列表数据
 */
export const fetchSyncConfigExecute = (params: any) => {
  return http.request<ReturnResult<boolean>>("get", `/v1/school/sync/execute`, { params });
};
/**
 * 获取同步配置列表
 * @param params 查询参数
 * @returns 同步配置列表数据
 */
export const getSchoolSyncConfigList = (params: SchoolSyncConfigQuery) => {
  return http.request<ReturnResult<SchoolSyncConfig[]>>("post", "/v1/school/sync/page", { data: params });
};

/**
 * 获取同步配置详情
 * @param configId 配置ID
 * @returns 同步配置详情数据
 */
export const getSchoolSyncConfig = (configId: number) => {
  return http.request<ReturnResult<SchoolSyncConfig>>("get", `/v1/school/sync/${configId}`);
};

/**
 * 新增同步配置
 * @param data 同步配置数据
 * @returns 新增结果
 */
export const addSchoolSyncConfig = (data: SchoolSyncConfig) => {
  return http.request<ReturnResult<SchoolSyncConfig>>("post", "/v1/school/sync/save", { data });
};

/**
 * 更新同步配置
 * @param data 同步配置数据
 * @returns 更新结果
 */
export const updateSchoolSyncConfig = (data: SchoolSyncConfig) => {
  return http.request<ReturnResult<boolean>>("put", "/v1/school/sync/update", { data });
};

/**
 * 删除同步配置
 * @param configId 配置ID
 * @returns 删除结果
 */
export const deleteSchoolSyncConfig = (configId: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/school/sync/${configId}`);
};

/**
 * 执行同步
 * @param configId 配置ID
 * @returns 同步结果
 */
export const executeSchoolSync = (configId: number) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/school/sync/execute/${configId}`);
};
