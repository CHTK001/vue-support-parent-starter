/**
 * 配置管理 API
 * @author CH
 * @since 2025-12-16
 */

import { http, type ReturnResult } from "@repo/utils";

/**
 * 配置实体接口
 */
export interface MonitorConfig {
  monitorSysGenConfigId?: number;
  monitorSysGenConfigKey: string;
  monitorSysGenConfigValue?: string;
  monitorSysGenConfigDescription?: string;
  monitorSysGenConfigEnv?: string;
  monitorSysGenConfigStatus?: number;
  monitorSysGenConfigApp?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 配置统计接口
 */
export interface ConfigStats {
  total: number;
  enabled: number;
  disabled: number;
  envStats: Record<string, number>;
}

/**
 * 配置下发请求
 */
export interface ConfigPushRequest {
  configIds: number[];
  serverIds: number[];
}

/**
 * 配置下发结果
 */
export interface ConfigPushResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{
    serverId: number;
    serverName: string;
    success: boolean;
    errorMessage?: string;
  }>;
}

/**
 * 推送历史查询参数
 */
export interface PushHistoryQuery {
  configId?: number;
  serverId?: number;
  keyword?: string;
  pushSuccess?: number;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 推送历史记录
 */
export interface ConfigPushHistory {
  id: number;
  configId: number;
  configKey: string;
  configValue: string;
  serverId: number;
  serverName: string;
  success: boolean;
  errorMessage?: string;
  pushTime: string;
  operator: string;
}

/**
 * 分页查询配置列表
 */
export const getConfigPageList = (data: {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  env?: string;
  status?: number;
  app?: string;
}) => {
  return http.request<ReturnResult<any>>("post", "/v1/config/page", { data });
};

/**
 * 获取配置详情
 */
export const getConfigDetail = (id: number) => {
  return http.request<ReturnResult<MonitorConfig>>("get", `/v1/config/${id}`);
};

/**
 * 新增配置
 */
export const createConfig = (data: MonitorConfig) => {
  return http.request<ReturnResult<MonitorConfig>>("post", "/v1/config", { data });
};

/**
 * 更新配置
 */
export const updateConfig = (data: MonitorConfig) => {
  return http.request<ReturnResult<MonitorConfig>>("put", "/v1/config", { data });
};

/**
 * 删除配置
 */
export const deleteConfig = (id: number) => {
  return http.request<ReturnResult<void>>("delete", `/v1/config/${id}`);
};

/**
 * 批量删除配置
 */
export const batchDeleteConfig = (ids: number[]) => {
  return http.request<ReturnResult<void>>("delete", "/v1/config/batch", { data: ids });
};

/**
 * 获取环境列表
 */
export const getEnvList = () => {
  return http.request<ReturnResult<string[]>>("get", "/v1/config/envs");
};

/**
 * 获取应用列表
 */
export const getAppList = () => {
  return http.request<ReturnResult<string[]>>("get", "/v1/config/apps");
};

/**
 * 获取配置统计信息
 */
export const getConfigStats = () => {
  return http.request<ReturnResult<ConfigStats>>("get", "/v1/config/statistics");
};

/**
 * 下发配置到节点
 */
export const pushConfigToNodes = (data: ConfigPushRequest) => {
  return http.request<ReturnResult<ConfigPushResult>>("post", "/v1/config/push", { data });
};

/**
 * 获取配置下发历史
 */
export const getConfigPushHistory = (data: PushHistoryQuery) => {
  return http.request<ReturnResult<any>>("post", "/v1/config/push-history", { data });
};

/**
 * 从历史还原推送
 */
export const repushFromHistory = (historyId: number) => {
  return http.request<ReturnResult<ConfigPushResult>>("post", `/v1/config/push-history/${historyId}/repush`);
};

/**
 * 批量从历史还原推送
 */
export const batchRepushFromHistory = (historyIds: number[]) => {
  return http.request<ReturnResult<ConfigPushResult>>("post", "/v1/config/push-history/batch-repush", { data: historyIds });
};

/**
 * 删除推送历史
 */
export const deletePushHistory = (historyId: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/config/push-history/${historyId}`);
};

/**
 * 批量删除推送历史
 */
export const batchDeletePushHistory = (historyIds: number[]) => {
  return http.request<ReturnResult<boolean>>("delete", "/v1/config/push-history/batch", { data: historyIds });
};

/**
 * 导出配置
 */
export const exportConfigs = (configIds: number[]) => {
  return http.request<ReturnResult<MonitorConfig[]>>("post", "/v1/config/export", { data: configIds });
};

/**
 * 导入配置
 */
export const importConfigs = (data: MonitorConfig[]) => {
  return http.request<ReturnResult<number>>("post", "/v1/config/import", { data });
};
