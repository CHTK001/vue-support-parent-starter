import { http } from "@repo/utils";

type SyncRequestOptions = {
  url: string;
  method: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
};

function request<T = any>(options: SyncRequestOptions) {
  return http.request<T>(options.method as any, options.url, {
    params: options.params,
    data: options.data,
    headers: options.headers,
  });
}

export interface SyncTask {
  syncTaskId?: number;
  syncTaskName: string;
  syncTaskDesc?: string;
  syncTaskStatus?: "STOPPED" | "RUNNING" | "ERROR";
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

export interface TableInfo {
  tableName: string;
  exists: boolean;
  description: string;
}

export interface SyncTableStatus {
  initialized: boolean;
  tables: TableInfo[];
  message: string;
}

export interface ColumnDefinition {
  name: string;
  type:
    | "VARCHAR"
    | "INT"
    | "BIGINT"
    | "TEXT"
    | "DATETIME"
    | "DATE"
    | "DECIMAL"
    | "BOOLEAN"
    | "FLOAT"
    | "DOUBLE"
    | "BLOB"
    | "JSON";
  length?: number;
  scale?: number;
  nullable?: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  comment?: string;
  order?: number;
  sourceField?: string;
}

export function listSyncTasks(params: SyncTaskQuery) {
  return request({
    url: "/v1/sync/task/list",
    method: "get",
    params,
  });
}

export function createSyncTask(data: SyncTask) {
  return request({
    url: "/v1/sync/task/create",
    method: "post",
    data,
  });
}

export function updateSyncTask(data: SyncTask) {
  return request({
    url: "/v1/sync/task/update",
    method: "put",
    data,
  });
}

export function deleteSyncTask(taskId: number) {
  return request({
    url: `/v1/sync/task/delete/${taskId}`,
    method: "delete",
  });
}

export function getSyncTaskDesign(taskId: number) {
  return request({
    url: `/v1/sync/task/design/${taskId}`,
    method: "get",
  });
}

export function saveSyncTaskDesign(taskId: number, data: SyncTaskDesign) {
  return request({
    url: `/v1/sync/task/design/${taskId}`,
    method: "post",
    data,
  });
}

export function startSyncTask(taskId: number) {
  return request({
    url: `/v1/sync/task/start/${taskId}`,
    method: "post",
  });
}

export function stopSyncTask(taskId: number) {
  return request({
    url: `/v1/sync/task/stop/${taskId}`,
    method: "post",
  });
}

export function executeSyncTaskOnce(taskId: number) {
  return request({
    url: `/v1/sync/task/execute/${taskId}`,
    method: "post",
  });
}

export function getSyncTaskLogs(taskId: number, page = 1, size = 10) {
  return request({
    url: `/v1/sync/task/logs/${taskId}`,
    method: "get",
    params: { page, size },
  });
}

export function getSyncLogDetail(logId: number) {
  return request({
    url: `/v1/sync/task/log/${logId}`,
    method: "get",
  });
}

export function validateSyncTaskDesign(data: SyncTaskDesign) {
  return request({
    url: "/v1/sync/task/validate",
    method: "post",
    data,
  });
}

export function copySyncTask(taskId: number, newName: string) {
  return request({
    url: `/v1/sync/task/copy/${taskId}`,
    method: "post",
    params: { newName },
  });
}

export function getSyncTaskNodes(taskId: number) {
  return request({
    url: `/v1/sync/task/nodes/${taskId}`,
    method: "get",
  });
}

export function getSyncTaskConnections(taskId: number) {
  return request({
    url: `/v1/sync/task/connections/${taskId}`,
    method: "get",
  });
}

export function getAllSpiTypes() {
  return request({
    url: "/v1/sync/spi/all",
    method: "get",
  });
}

export function getInputSpiList() {
  return request({
    url: "/v1/sync/spi/input",
    method: "get",
  });
}

export function getOutputSpiList() {
  return request({
    url: "/v1/sync/spi/output",
    method: "get",
  });
}

export function getDataCenterSpiList() {
  return request({
    url: "/v1/sync/spi/datacenter",
    method: "get",
  });
}

export function getFilterSpiList() {
  return request({
    url: "/v1/sync/spi/filter",
    method: "get",
  });
}

export function getSpiParameters(spiType: string, spiName: string) {
  return request({
    url: "/v1/sync/spi/parameters",
    method: "get",
    params: { spiType, spiName },
  });
}

export function validateSpiConfig(
  spiType: string,
  spiName: string,
  config: Record<string, any>,
) {
  return request({
    url: "/v1/sync/spi/validate",
    method: "post",
    params: { spiType, spiName },
    data: config,
  });
}

export function testSpiConnection(
  spiType: string,
  spiName: string,
  config: Record<string, any>,
) {
  return request({
    url: "/v1/sync/spi/test",
    method: "post",
    params: { spiType, spiName },
    data: config,
  });
}

export function getStatistics(params?: {
  startTime?: string;
  endTime?: string;
  granularity?: string;
}) {
  return request({
    url: "/v1/sync/task/statistics",
    method: "get",
    params,
  });
}

export function getTaskStatistics(
  taskId: number,
  params?: { startTime?: string; endTime?: string; granularity?: string },
) {
  return request({
    url: `/v1/sync/task/statistics/${taskId}`,
    method: "get",
    params,
  });
}

export function checkTableStatus() {
  return request({
    url: "/v1/sync/task/table/status",
    method: "get",
  });
}

export function initializeTables(force = false) {
  return request({
    url: "/v1/sync/task/table/initialize",
    method: "post",
    params: { force },
  });
}

export function checkOutputTableExists(nodeConfig: string, tableName: string) {
  return request({
    url: "/v1/sync/task/output/table/exists",
    method: "post",
    data: nodeConfig,
    params: { tableName },
    headers: { "Content-Type": "application/json" },
  });
}

export function createOutputTable(
  nodeConfig: string,
  tableName: string,
  columns: ColumnDefinition[],
) {
  return request({
    url: "/v1/sync/task/output/table/create",
    method: "post",
    data: columns,
    params: { nodeConfig, tableName },
  });
}

export function getOutputTableStructure(nodeConfig: string, tableName: string) {
  return request({
    url: "/v1/sync/task/output/table/structure",
    method: "post",
    data: nodeConfig,
    params: { tableName },
    headers: { "Content-Type": "application/json" },
  });
}

export function previewCreateTableSql(
  tableName: string,
  columns: ColumnDefinition[],
  dbType = "mysql",
) {
  return request({
    url: "/v1/sync/task/output/table/preview-sql",
    method: "post",
    data: columns,
    params: { tableName, dbType },
  });
}

export function syncOutputTableStructure(
  nodeConfig: string,
  tableName: string,
  columns: ColumnDefinition[],
) {
  return request({
    url: "/v1/sync/task/output/table/sync-structure",
    method: "post",
    data: columns,
    params: { nodeConfig, tableName },
  });
}
