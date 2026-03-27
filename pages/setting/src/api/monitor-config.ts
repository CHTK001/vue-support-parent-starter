import { http, type ReturnResult } from "@repo/utils";

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

export interface ConfigStats {
  total: number;
  enabled: number;
  disabled: number;
  envStats: Record<string, number>;
}

export interface ConfigPushRequest {
  configIds: number[];
  serverIds: number[];
}

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

export interface PushHistoryQuery {
  configId?: number;
  serverId?: number;
  keyword?: string;
  pushSuccess?: number;
  pageNum?: number;
  pageSize?: number;
}

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

export const getConfigDetail = (id: number) => {
  return http.request<ReturnResult<MonitorConfig>>("get", `/v1/config/${id}`);
};

export const createConfig = (data: MonitorConfig) => {
  return http.request<ReturnResult<MonitorConfig>>("post", "/v1/config", {
    data,
  });
};

export const updateConfig = (data: MonitorConfig) => {
  return http.request<ReturnResult<MonitorConfig>>("put", "/v1/config", {
    data,
  });
};

export const deleteConfig = (id: number) => {
  return http.request<ReturnResult<void>>("delete", `/v1/config/${id}`);
};

export const batchDeleteConfig = (ids: number[]) => {
  return http.request<ReturnResult<void>>("delete", "/v1/config/batch", {
    data: ids,
  });
};

export const getEnvList = () => {
  return http.request<ReturnResult<string[]>>("get", "/v1/config/envs");
};

export const getAppList = () => {
  return http.request<ReturnResult<string[]>>("get", "/v1/config/apps");
};

export const getConfigStats = () => {
  return http.request<ReturnResult<ConfigStats>>(
    "get",
    "/v1/config/statistics",
  );
};

export const pushConfigToNodes = (data: ConfigPushRequest) => {
  return http.request<ReturnResult<ConfigPushResult>>("post", "/v1/config/push", {
    data,
  });
};

export const getConfigPushHistory = (data: PushHistoryQuery) => {
  return http.request<ReturnResult<any>>("post", "/v1/config/push-history", {
    data,
  });
};

export const repushFromHistory = (historyId: number) => {
  return http.request<ReturnResult<ConfigPushResult>>(
    "post",
    `/v1/config/push-history/${historyId}/repush`,
  );
};

export const batchRepushFromHistory = (historyIds: number[]) => {
  return http.request<ReturnResult<ConfigPushResult>>(
    "post",
    "/v1/config/push-history/batch-repush",
    { data: historyIds },
  );
};

export const deletePushHistory = (historyId: number) => {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `/v1/config/push-history/${historyId}`,
  );
};

export const batchDeletePushHistory = (historyIds: number[]) => {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "/v1/config/push-history/batch",
    { data: historyIds },
  );
};

export const exportConfigs = (configIds: number[]) => {
  return http.request<ReturnResult<MonitorConfig[]>>("post", "/v1/config/export", {
    data: configIds,
  });
};

export const importConfigs = (data: MonitorConfig[]) => {
  return http.request<ReturnResult<number>>("post", "/v1/config/import", {
    data,
  });
};
