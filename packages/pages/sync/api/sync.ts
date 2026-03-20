import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1/sync";

export interface ApiPayload<T = any> {
  code?: number | string;
  success?: boolean;
  message?: string;
  msg?: string;
  data?: T;
}

export type SyncTaskStatus = "STOPPED" | "RUNNING" | "ERROR";
export type SyncTaskSyncMode = "FULL" | "INCREMENTAL" | "BIDIRECTIONAL";
export type SyncTaskConflictStrategy = "OVERWRITE" | "SKIP" | "MERGE";

export interface SyncTask {
  syncTaskId?: number;
  syncTaskName: string;
  syncTaskDesc?: string;
  syncTaskStatus?: SyncTaskStatus;
  syncTaskBatchSize?: number;
  syncTaskConsumeTimeout?: number;
  syncTaskRetryCount?: number;
  syncTaskRetryInterval?: number;
  syncTaskSyncInterval?: number;
  syncTaskAckEnabled?: number;
  syncTaskTransactionEnabled?: number;
  syncTaskCron?: string;
  syncTaskLayout?: string;
  syncTaskLastRunTime?: string;
  syncTaskLastRunStatus?: string;
  syncTaskRunCount?: number;
  syncTaskSuccessCount?: number;
  syncTaskFailCount?: number;
  syncTaskCreateTime?: string;
  syncTaskUpdateTime?: string;
  syncTaskTransformConfig?: string;
  syncTaskFilterConfig?: string;
  syncTaskSyncMode?: SyncTaskSyncMode;
  syncTaskIncrementalField?: string;
  syncTaskConflictStrategy?: SyncTaskConflictStrategy;
  syncTaskMaxMemoryMb?: number;
  syncTaskThreadPoolSize?: number;
}

export interface SyncNode {
  syncNodeId?: number;
  syncTaskId?: number;
  syncNodeType: "INPUT" | "OUTPUT" | "FILTER" | "DATA_CENTER";
  syncNodeSpiName: string;
  syncNodeName?: string;
  syncNodeKey?: string;
  syncNodeConfig?: string;
  syncNodePosition?: string;
  syncNodeOrder?: number;
  syncNodeEnabled?: number;
  syncNodeDesc?: string;
  syncNodeCreateTime?: string;
  syncNodeUpdateTime?: string;
}

export interface SyncConnection {
  syncConnectionId?: number;
  syncTaskId?: number;
  sourceNodeId?: number;
  sourceNodeKey?: string;
  sourceHandle?: string;
  targetNodeId?: number;
  targetNodeKey?: string;
  targetHandle?: string;
  connectionType?: string;
  connectionLabel?: string;
  syncConnectionCreateTime?: string;
}

export interface SyncTaskDesign {
  task?: SyncTask;
  nodes?: SyncNode[];
  connections?: SyncConnection[];
  layout?: string;
}

export interface SyncTaskLog {
  syncLogId?: number;
  syncTaskId?: number;
  syncLogStatus?: "RUNNING" | "SUCCESS" | "FAIL" | "TIMEOUT";
  syncLogTriggerType?: "MANUAL" | "SCHEDULE" | "API";
  syncLogReadCount?: number;
  syncLogWriteCount?: number;
  syncLogSuccessCount?: number;
  syncLogFailCount?: number;
  syncLogRetryCount?: number;
  syncLogDeadLetterCount?: number;
  syncLogFilterCount?: number;
  syncLogStartTime?: string;
  syncLogEndTime?: string;
  syncLogCost?: number;
  syncLogAvgProcessTime?: number;
  syncLogThroughput?: number;
  syncLogMessage?: string;
  syncLogStackTrace?: string;
}

export interface SpiParameter {
  name: string;
  label: string;
  description?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "select"
    | "password"
    | "textarea"
    | "json";
  defaultValue?: any;
  required?: boolean;
  sensitive?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: string;
  group?: string;
  order?: number;
  dependsOn?: Record<string, any>;
  min?: number;
  max?: number;
}

export interface SpiInfo {
  name: string;
  displayName: string;
  description?: string;
  type: "INPUT" | "OUTPUT" | "DATA_CENTER" | "FILTER";
  className?: string;
  icon?: string;
  color?: string;
  parameters?: SpiParameter[];
  order?: number;
  available?: boolean;
}

export interface SpiTypeList {
  input: SpiInfo[];
  output: SpiInfo[];
  dataCenter: SpiInfo[];
  filter: SpiInfo[];
}

export interface SyncTaskQuery {
  page?: number;
  size?: number;
  taskName?: string;
  taskStatus?: string;
  orderBy?: string;
  desc?: boolean;
}

export interface StatisticsSummary {
  totalExecutions: number;
  successCount: number;
  failCount: number;
  runningCount: number;
  successRate: number;
  avgCost: number;
  totalReadCount: number;
  totalWriteCount: number;
  avgThroughput: number;
}

export interface TrendData {
  labels: string[];
  executions: number[];
  successCounts: number[];
  failCounts: number[];
  avgCosts: number[];
  dataCounts: number[];
}

export interface StatusDistribution {
  status: string;
  statusName: string;
  count: number;
  percentage: number;
}

export interface TriggerTypeDistribution {
  triggerType: string;
  triggerTypeName: string;
  count: number;
  percentage: number;
}

export interface TaskRanking {
  taskId: number;
  taskName: string;
  executions: number;
  successRate: number;
  avgCost: number;
  totalDataCount: number;
}

export interface SyncTaskStatistics {
  summary: StatisticsSummary;
  trend: TrendData;
  statusDistribution: StatusDistribution[];
  triggerTypeDistribution: TriggerTypeDistribution[];
  taskRanking?: TaskRanking[];
}

export const isApiSuccess = (code: number | string | undefined) => {
  return (
    code === 200 ||
    code === 0 ||
    code === "200" ||
    code === "0" ||
    code === "00000"
  );
};

export const getApiMessage = (
  payload: { message?: string; msg?: string } | undefined,
) => {
  return payload?.message || payload?.msg || "请求失败";
};

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiPayload;
    if (!isApiSuccess(data.code)) {
      return Promise.reject(new Error(getApiMessage(data)));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("authenticated");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export function listSyncTasks(params: SyncTaskQuery) {
  return api.get<any, ApiPayload<{ records: SyncTask[]; total: number }>>(
    "/task/list",
    { params },
  );
}

export function createSyncTask(data: SyncTask) {
  return api.post<any, ApiPayload<SyncTask>>("/task/create", data);
}

export function updateSyncTask(data: SyncTask) {
  return api.put<any, ApiPayload<boolean>>("/task/update", data);
}

export function deleteSyncTask(taskId: number) {
  return api.delete<any, ApiPayload<boolean>>(`/task/delete/${taskId}`);
}

export function getSyncTaskDesign(taskId: number) {
  return api.get<any, ApiPayload<SyncTaskDesign>>(`/task/design/${taskId}`);
}

export function saveSyncTaskDesign(taskId: number, data: SyncTaskDesign) {
  return api.post<any, ApiPayload<boolean>>(`/task/design/${taskId}`, data);
}

export function startSyncTask(taskId: number) {
  return api.post<any, ApiPayload<boolean>>(`/task/start/${taskId}`);
}

export function stopSyncTask(taskId: number) {
  return api.post<any, ApiPayload<boolean>>(`/task/stop/${taskId}`);
}

export function executeSyncTaskOnce(taskId: number) {
  return api.post<any, ApiPayload<number>>(`/task/execute/${taskId}`);
}

export function getSyncTaskLogs(taskId: number, page = 1, size = 10) {
  return api.get<any, ApiPayload<{ records: SyncTaskLog[]; total: number }>>(
    `/task/logs/${taskId}`,
    { params: { page, size } },
  );
}

export function getSyncLogDetail(logId: number) {
  return api.get<any, ApiPayload<SyncTaskLog>>(`/task/log/${logId}`);
}

export function validateSyncTaskDesign(data: SyncTaskDesign) {
  return api.post<any, ApiPayload<boolean>>("/task/validate", data);
}

export function getAllSpiTypes() {
  return api.get<any, ApiPayload<SpiTypeList>>("/spi/all");
}

export function getSpiParameters(spiType: string, spiName: string) {
  return api.get<any, ApiPayload<SpiParameter[]>>("/spi/parameters", {
    params: { spiType, spiName },
  });
}

export function validateSpiConfig(
  spiType: string,
  spiName: string,
  config: Record<string, any>,
) {
  return api.post<any, ApiPayload<boolean>>("/spi/validate", config, {
    params: { spiType, spiName },
  });
}

export function testSpiConnection(
  spiType: string,
  spiName: string,
  config: Record<string, any>,
) {
  return api.post<any, ApiPayload<string>>("/spi/test", config, {
    params: { spiType, spiName },
  });
}

export function getStatistics(params?: {
  startTime?: string;
  endTime?: string;
  granularity?: string;
}) {
  return api.get<any, ApiPayload<SyncTaskStatistics>>("/task/statistics", {
    params,
  });
}

export function getTaskStatistics(
  taskId: number,
  params?: { startTime?: string; endTime?: string; granularity?: string },
) {
  return api.get<any, ApiPayload<SyncTaskStatistics>>(
    `/task/statistics/${taskId}`,
    { params },
  );
}

export default api;
