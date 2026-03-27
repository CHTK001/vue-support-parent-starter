import { http, type ReturnResult } from "@repo/utils";

export type MonitorSyncTask = {
  monitorSyncTaskId?: number;
  taskName?: string;
  taskStatus?: string;
  taskType?: string;
  taskCron?: string;
  taskClass?: string;
  taskParams?: string;
  taskRemark?: string;
  createTime?: string;
  updateTime?: string;
};

export type MonitorSyncTaskLog = {
  monitorSyncTaskLogId?: number;
  monitorSyncTaskId?: number;
  taskName?: string;
  taskStatus?: string;
  taskMessage?: string;
  taskStartTime?: string;
  taskEndTime?: string;
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
    {
      data,
    },
  );
};

export const fetchUpdateSyncTask = (data: MonitorSyncTask) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/sync/task/update", {
    data,
  });
};

export const fetchDeleteSyncTask = (monitorSyncTaskId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/sync/task/delete", {
    params: { monitorSyncTaskId },
  });
};

export const fetchStartSyncTask = (monitorSyncTaskId: number) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sync/task/start", {
    params: { monitorSyncTaskId },
  });
};

export const fetchStopSyncTask = (monitorSyncTaskId: number) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sync/task/stop", {
    params: { monitorSyncTaskId },
  });
};

export const fetchExecuteSyncTask = (monitorSyncTaskId: number) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/sync/task/execute", {
    params: { monitorSyncTaskId },
  });
};

export const fetchSyncTaskLogs = (params: {
  monitorSyncTaskId: number;
  page?: number;
  size?: number;
}) => {
  return http.request<ReturnResult<any>>("get", "/v2/sync/task/logs", {
    params,
  });
};
