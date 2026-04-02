import { http, type ReturnResult } from "@repo/utils";

export type MonitorSyncTask = {
  syncTaskId?: number;
  syncTaskName?: string;
  syncTaskDesc?: string;
  syncTaskStatus?: string;
  syncTaskBatchSize?: number;
  syncTaskRetryCount?: number;
  syncTaskRetryInterval?: number;
  syncTaskSyncInterval?: number;
  syncTaskCron?: string;
  syncTaskAckEnabled?: number;
  syncTaskTransactionEnabled?: number;
  createTime?: string;
  updateTime?: string;
};

export type MonitorSyncTaskLog = {
  syncLogId?: number;
  syncTaskId?: number;
  syncLogStatus?: string;
  syncLogTriggerType?: string;
  syncLogReadCount?: number;
  syncLogWriteCount?: number;
  syncLogSuccessCount?: number;
  syncLogCost?: number;
  syncLogStartTime?: string;
  syncLogMessage?: string;
  createTime?: string;
};

export type SyncTaskQuery = {
  page?: number;
  size?: number;
  taskName?: string;
  taskStatus?: string;
};

export const fetchSyncTaskList = (params: SyncTaskQuery) => {
  return http.request<ReturnResult<any>>("get", "/v2/sync/task/list", {
    params,
  });
};

export const fetchCreateSyncTask = (data: MonitorSyncTask) => {
  return http.request<ReturnResult<MonitorSyncTask>>(
    "post",
    "/v2/sync/task/save",
    { data },
  );
};

export const fetchUpdateSyncTask = (data: MonitorSyncTask) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/sync/task/update", {
    data,
  });
};

export const fetchDeleteSyncTask = (syncTaskId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/sync/task/delete", {
    params: { syncTaskId },
  });
};

export const fetchStartSyncTask = (syncTaskId: number) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sync/task/start", {
    params: { syncTaskId },
  });
};

export const fetchStopSyncTask = (syncTaskId: number) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sync/task/stop", {
    params: { syncTaskId },
  });
};

export const fetchExecuteSyncTask = (syncTaskId: number) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sync/task/execute", {
    params: { syncTaskId },
  });
};

export const fetchSyncTaskLogs = (
  syncTaskId: number,
  page = 1,
  size = 10,
) => {
  return http.request<ReturnResult<any>>("get", "/v2/sync/task/logs", {
    params: { syncTaskId, page, size },
  });
};
