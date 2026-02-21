import { http, type ReturnResult } from "@repo/utils";

/**
 * 同步任务查询参数
 */
export interface SyncTaskQuery {
  page?: number;
  size?: number;
  taskName?: string;
  taskStatus?: string;
}

/**
 * 同步任务实体
 */
export interface MonitorSyncTask {
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
}

/**
 * 同步任务日志
 */
export interface MonitorSyncTaskLog {
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
}

/**
 * 分页查询任务列表
 */
export const fetchSyncTaskList = (params: SyncTaskQuery) => {
  return http.request<ReturnResult<any>>("get", "/v1/sync/task/list", {
    params,
  });
};

/**
 * 创建任务
 */
export const fetchCreateSyncTask = (params: MonitorSyncTask) => {
  return http.request<ReturnResult<MonitorSyncTask>>("post", "/v1/sync/task/create", {
    data: params,
  });
};

/**
 * 更新任务
 */
export const fetchUpdateSyncTask = (params: MonitorSyncTask) => {
  return http.request<ReturnResult<boolean>>("put", "/v1/sync/task/update", {
    data: params,
  });
};

/**
 * 删除任务
 */
export const fetchDeleteSyncTask = (taskId: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/sync/task/delete/${taskId}`);
};

/**
 * 启动任务
 */
export const fetchStartSyncTask = (taskId: number) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/sync/task/start/${taskId}`);
};

/**
 * 停止任务
 */
export const fetchStopSyncTask = (taskId: number) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/sync/task/stop/${taskId}`);
};

/**
 * 手动执行一次
 */
export const fetchExecuteSyncTask = (taskId: number) => {
  return http.request<ReturnResult<number>>("post", `/v1/sync/task/execute/${taskId}`);
};

/**
 * 获取任务执行日志
 */
export const fetchSyncTaskLogs = (taskId: number, page: number = 1, size: number = 10) => {
  return http.request<ReturnResult<any>>("get", `/v1/sync/task/logs/${taskId}`, {
    params: { page, size },
  });
};

/**
 * 获取日志详情
 */
export const fetchSyncTaskLogDetail = (logId: number) => {
  return http.request<ReturnResult<MonitorSyncTaskLog>>("get", `/v1/sync/task/log/${logId}`);
};

/**
 * 复制任务
 */
export const fetchCopySyncTask = (taskId: number, newName: string) => {
  return http.request<ReturnResult<MonitorSyncTask>>("post", `/v1/sync/task/copy/${taskId}`, {
    params: { newName },
  });
};

/**
 * 获取全局执行统计
 */
export const fetchSyncTaskStatistics = (params?: {
  startTime?: string;
  endTime?: string;
  granularity?: string;
}) => {
  return http.request<ReturnResult<any>>("get", "/v1/sync/task/statistics", {
    params,
  });
};

/**
 * 获取指定任务的执行统计
 */
export const fetchSyncTaskStatisticsById = (
  taskId: number,
  params?: {
    startTime?: string;
    endTime?: string;
    granularity?: string;
  }
) => {
  return http.request<ReturnResult<any>>("get", `/v1/sync/task/statistics/${taskId}`, {
    params,
  });
};

