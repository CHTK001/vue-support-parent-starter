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

export type TransformRuleType = "MAPPING" | "FILTER" | "MASKING" | "SCRIPT";

export interface TransformRule {
  ruleId?: number;
  ruleName: string;
  ruleType: TransformRuleType;
  ruleConfig: string;
  ruleDesc?: string;
  createTime?: string;
  updateTime?: string;
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
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("authenticated");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

const unwrap = <T>(promise: Promise<any>): Promise<ApiPayload<T>> =>
  promise.then((res) => res.data as ApiPayload<T>);

export function listSyncTasks(params: SyncTaskQuery) {
  return unwrap<{ records: SyncTask[]; total: number }>(api.get("/task/list", { params }));
}

export function createSyncTask(data: SyncTask) {
  return unwrap<SyncTask>(api.post("/task/create", data));
}

export function updateSyncTask(data: SyncTask) {
  return unwrap<boolean>(api.put("/task/update", data));
}

export function deleteSyncTask(taskId: number) {
  return unwrap<boolean>(api.delete(`/task/delete/${taskId}`));
}

export function getSyncTaskDesign(taskId: number) {
  return unwrap<SyncTaskDesign>(api.get(`/task/design/${taskId}`));
}

export function saveSyncTaskDesign(taskId: number, data: SyncTaskDesign) {
  return unwrap<boolean>(api.post(`/task/design/${taskId}`, data));
}

export function startSyncTask(taskId: number) {
  return unwrap<boolean>(api.post(`/task/start/${taskId}`));
}

export function stopSyncTask(taskId: number) {
  return unwrap<boolean>(api.post(`/task/stop/${taskId}`));
}

export function executeSyncTaskOnce(taskId: number) {
  return unwrap<number>(api.post(`/task/execute/${taskId}`));
}

export function copySyncTask(taskId: number, newName: string) {
  return unwrap<SyncTask>(api.post(`/task/copy/${taskId}`, null, {
    params: { newName },
  }));
}

export function exportSyncTask(taskId: number) {
  return unwrap<string>(api.get(`/task/export/${taskId}`));
}

export function importSyncTask(taskJson: string) {
  return unwrap<SyncTask>(api.post("/task/import", taskJson, {
    headers: { "Content-Type": "application/json" },
  }));
}

export function batchSyncTaskOperation(taskIds: number[], operation: string) {
  return unwrap<boolean>(api.post("/task/batch", null, {
    params: { taskIds, operation },
    paramsSerializer: {
      serialize: (params) => {
        const search = new URLSearchParams();
        (params.taskIds || []).forEach((id: number) => search.append("taskIds", String(id)));
        search.append("operation", params.operation);
        return search.toString();
      },
    },
  }));
}

export function getSyncTaskLogs(taskId: number, page = 1, size = 10) {
  return unwrap<{ records: SyncTaskLog[]; total: number }>(
    api.get(`/task/logs/${taskId}`, { params: { page, size } }),
  );
}

export function getSyncLogDetail(logId: number) {
  return unwrap<SyncTaskLog>(api.get(`/task/log/${logId}`));
}

export function validateSyncTaskDesign(data: SyncTaskDesign) {
  return unwrap<boolean>(api.post("/task/validate", data));
}

export function getAllSpiTypes() {
  return unwrap<SpiTypeList>(api.get("/spi/all"));
}

export function getSpiParameters(spiType: string, spiName: string) {
  return unwrap<SpiParameter[]>(api.get("/spi/parameters", {
    params: { spiType, spiName },
  }));
}

export function validateSpiConfig(
  spiType: string,
  spiName: string,
  config: Record<string, any>,
) {
  return unwrap<boolean>(api.post("/spi/validate", config, {
    params: { spiType, spiName },
  }));
}

export function testSpiConnection(
  spiType: string,
  spiName: string,
  config: Record<string, any>,
) {
  return unwrap<string>(api.post("/spi/test", config, {
    params: { spiType, spiName },
  }));
}

export function getStatistics(params?: {
  startTime?: string;
  endTime?: string;
  granularity?: string;
}) {
  return unwrap<SyncTaskStatistics>(api.get("/task/statistics", {
    params,
  }));
}

export function getTaskStatistics(
  taskId: number,
  params?: { startTime?: string; endTime?: string; granularity?: string },
) {
  return unwrap<SyncTaskStatistics>(api.get(
    `/task/statistics/${taskId}`,
    { params },
  ));
}

export function listTransformRules() {
  return unwrap<TransformRule[]>(api.get("/transform/rules"));
}

export function createTransformRule(data: TransformRule) {
  return unwrap<number>(api.post("/transform/rules", data));
}

export function updateTransformRule(ruleId: number, data: TransformRule) {
  return unwrap<boolean>(api.put(`/transform/rules/${ruleId}`, data));
}

export function deleteTransformRule(ruleId: number) {
  return unwrap<boolean>(api.delete(`/transform/rules/${ruleId}`));
}

export function testTransformRule(ruleId: number, testData: Record<string, any>) {
  return unwrap<Record<string, any>>(api.post("/transform/rules/test", testData, {
    params: { ruleId },
  }));
}

export default api;
