/**
 * 同步任务管理 API
 * @author CH
 * @since 2024/12/19
 */

import request from "../config";

// ==================== 类型定义 ====================

/** 同步任务 */
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

/** 同步节点 */
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

/** 同步连线 */
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

/** 同步任务设计数据 */
export interface SyncTaskDesign {
  task?: SyncTask;
  nodes?: SyncNode[];
  connections?: SyncConnection[];
  layout?: string;
}

/** 同步任务执行日志 */
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

/** SPI 参数定义 */
export interface SpiParameter {
  name: string;
  label: string;
  description?: string;
  type: "string" | "number" | "boolean" | "select" | "password" | "textarea" | "json";
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

/** SPI 信息 */
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

/** 查询参数 */
export interface SyncTaskQuery {
  page?: number;
  size?: number;
  taskName?: string;
  taskStatus?: string;
  orderBy?: string;
  desc?: boolean;
}

/** 执行统计汇总 */
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

/** 趋势数据 */
export interface TrendData {
  labels: string[];
  executions: number[];
  successCounts: number[];
  failCounts: number[];
  avgCosts: number[];
  dataCounts: number[];
}

/** 状态分布 */
export interface StatusDistribution {
  status: string;
  statusName: string;
  count: number;
  percentage: number;
}

/** 触发类型分布 */
export interface TriggerTypeDistribution {
  triggerType: string;
  triggerTypeName: string;
  count: number;
  percentage: number;
}

/** 任务排行 */
export interface TaskRanking {
  taskId: number;
  taskName: string;
  executions: number;
  successRate: number;
  avgCost: number;
  totalDataCount: number;
}

/** 执行统计数据 */
export interface SyncTaskStatistics {
  summary: StatisticsSummary;
  trend: TrendData;
  statusDistribution: StatusDistribution[];
  triggerTypeDistribution: TriggerTypeDistribution[];
  taskRanking?: TaskRanking[];
}

// ==================== 任务管理 API ====================

/**
 * 分页查询任务列表
 */
export function listSyncTasks(params: SyncTaskQuery) {
  return request({
    url: "/v1/sync/task/list",
    method: "get",
    params,
  });
}

/**
 * 创建任务
 */
export function createSyncTask(data: SyncTask) {
  return request({
    url: "/v1/sync/task/create",
    method: "post",
    data,
  });
}

/**
 * 更新任务
 */
export function updateSyncTask(data: SyncTask) {
  return request({
    url: "/v1/sync/task/update",
    method: "put",
    data,
  });
}

/**
 * 删除任务
 */
export function deleteSyncTask(taskId: number) {
  return request({
    url: `/v1/sync/task/delete/${taskId}`,
    method: "delete",
  });
}

/**
 * 获取任务设计数据
 */
export function getSyncTaskDesign(taskId: number) {
  return request({
    url: `/v1/sync/task/design/${taskId}`,
    method: "get",
  });
}

/**
 * 保存任务设计
 */
export function saveSyncTaskDesign(taskId: number, data: SyncTaskDesign) {
  return request({
    url: `/v1/sync/task/design/${taskId}`,
    method: "post",
    data,
  });
}

/**
 * 启动任务
 */
export function startSyncTask(taskId: number) {
  return request({
    url: `/v1/sync/task/start/${taskId}`,
    method: "post",
  });
}

/**
 * 停止任务
 */
export function stopSyncTask(taskId: number) {
  return request({
    url: `/v1/sync/task/stop/${taskId}`,
    method: "post",
  });
}

/**
 * 手动执行一次
 */
export function executeSyncTaskOnce(taskId: number) {
  return request({
    url: `/v1/sync/task/execute/${taskId}`,
    method: "post",
  });
}

/**
 * 获取任务执行日志
 */
export function getSyncTaskLogs(taskId: number, page = 1, size = 10) {
  return request({
    url: `/v1/sync/task/logs/${taskId}`,
    method: "get",
    params: { page, size },
  });
}

/**
 * 获取日志详情
 */
export function getSyncLogDetail(logId: number) {
  return request({
    url: `/v1/sync/task/log/${logId}`,
    method: "get",
  });
}

/**
 * 验证任务设计
 */
export function validateSyncTaskDesign(data: SyncTaskDesign) {
  return request({
    url: "/v1/sync/task/validate",
    method: "post",
    data,
  });
}

/**
 * 复制任务
 */
export function copySyncTask(taskId: number, newName: string) {
  return request({
    url: `/v1/sync/task/copy/${taskId}`,
    method: "post",
    params: { newName },
  });
}

/**
 * 获取任务节点列表
 */
export function getSyncTaskNodes(taskId: number) {
  return request({
    url: `/v1/sync/task/nodes/${taskId}`,
    method: "get",
  });
}

/**
 * 获取任务连线列表
 */
export function getSyncTaskConnections(taskId: number) {
  return request({
    url: `/v1/sync/task/connections/${taskId}`,
    method: "get",
  });
}

// ==================== SPI 管理 API ====================

/**
 * 获取所有 SPI 类型列表
 */
export function getAllSpiTypes() {
  return request({
    url: "/v1/sync/spi/all",
    method: "get",
  });
}

/**
 * 获取 Input SPI 列表
 */
export function getInputSpiList() {
  return request({
    url: "/v1/sync/spi/input",
    method: "get",
  });
}

/**
 * 获取 Output SPI 列表
 */
export function getOutputSpiList() {
  return request({
    url: "/v1/sync/spi/output",
    method: "get",
  });
}

/**
 * 获取 DataCenter SPI 列表
 */
export function getDataCenterSpiList() {
  return request({
    url: "/v1/sync/spi/datacenter",
    method: "get",
  });
}

/**
 * 获取 Filter SPI 列表
 */
export function getFilterSpiList() {
  return request({
    url: "/v1/sync/spi/filter",
    method: "get",
  });
}

/**
 * 获取 SPI 参数定义
 */
export function getSpiParameters(spiType: string, spiName: string) {
  return request({
    url: "/v1/sync/spi/parameters",
    method: "get",
    params: { spiType, spiName },
  });
}

/**
 * 验证 SPI 配置
 */
export function validateSpiConfig(spiType: string, spiName: string, config: Record<string, any>) {
  return request({
    url: "/v1/sync/spi/validate",
    method: "post",
    params: { spiType, spiName },
    data: config,
  });
}

/**
 * 测试 SPI 连接
 */
export function testSpiConnection(spiType: string, spiName: string, config: Record<string, any>) {
  return request({
    url: "/v1/sync/spi/test",
    method: "post",
    params: { spiType, spiName },
    data: config,
  });
}

// ==================== 统计 API ====================

/**
 * 获取全局执行统计
 */
export function getStatistics(params?: { startTime?: string; endTime?: string; granularity?: string }) {
  return request({
    url: "/v1/sync/task/statistics",
    method: "get",
    params,
  });
}

/**
 * 获取指定任务的执行统计
 */
export function getTaskStatistics(taskId: number, params?: { startTime?: string; endTime?: string; granularity?: string }) {
  return request({
    url: `/v1/sync/task/statistics/${taskId}`,
    method: "get",
    params,
  });
}
