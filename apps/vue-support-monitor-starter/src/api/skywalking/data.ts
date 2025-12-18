import { http, type ReturnResult } from "@repo/utils";

// ==================== 类型定义 ====================

/**
 * 服务信息
 */
export interface SkywalkingService {
  id: string;
  name: string;
  group?: string;
  shortName?: string;
  layer?: string;
  normal?: boolean;
}

/**
 * 服务实例
 */
export interface SkywalkingInstance {
  id: string;
  name: string;
  language?: string;
  attributes?: Array<{ name: string; value: string }>;
}

/**
 * 端点信息
 */
export interface SkywalkingEndpoint {
  id: string;
  name: string;
}

/**
 * 基础 Trace 信息
 */
export interface BasicTrace {
  segmentId: string;
  endpointNames: string[];
  duration: number;
  start: string;
  isError: boolean;
  traceIds: string[];
}

/**
 * Trace 列表响应
 */
export interface TraceBrief {
  traces: BasicTrace[];
  total: number;
}

/**
 * Span 信息
 */
export interface Span {
  traceId: string;
  segmentId: string;
  spanId: number;
  parentSpanId: number;
  refs?: Array<{
    traceId: string;
    parentSegmentId: string;
    parentSpanId: number;
    type: string;
  }>;
  serviceCode: string;
  serviceInstanceName: string;
  startTime: number;
  endTime: number;
  endpointName: string;
  type: string;
  peer?: string;
  component?: string;
  isError: boolean;
  layer?: string;
  tags?: Array<{ key: string; value: string }>;
  logs?: Array<{
    time: number;
    data: Array<{ key: string; value: string }>;
  }>;
}

/**
 * Trace 详情
 */
export interface TraceDetail {
  traceId: string;
  spans: Span[];
}

/**
 * 拓扑节点
 */
export interface TopologyNode {
  id: string;
  name: string;
  type?: string;
  isReal?: boolean;
  layer?: string;
}

/**
 * 拓扑调用关系
 */
export interface TopologyCall {
  id: string;
  source: string;
  sourceName?: string;
  target: string;
  targetName?: string;
  detectPoints?: string[];
}

/**
 * 拓扑信息
 */
export interface Topology {
  nodes: TopologyNode[];
  calls: TopologyCall[];
}

/**
 * 告警消息
 */
export interface AlarmMessage {
  id: string;
  message: string;
  startTime: number;
  scope?: string;
  scopeId?: string;
  tags?: Array<{ key: string; value: string }>;
}

/**
 * 告警列表
 */
export interface AlarmList {
  msgs: AlarmMessage[];
  total: number;
}

/**
 * 查询条件
 */
export interface QueryCondition {
  configId: number;
  startTime: string;
  endTime: string;
  step?: string;
  layer?: string;
  keyword?: string;
  serviceId?: string;
  serviceInstanceId?: string;
  endpointId?: string;
  endpointName?: string;
  traceId?: string;
  traceState?: string;
  queryOrder?: string;
  minTraceDuration?: number;
  maxTraceDuration?: number;
  pageNum?: number;
  pageSize?: number;
}

// ==================== API 函数 ====================

/**
 * 获取所有层
 */
export function getSkywalkingLayers(configId: number) {
  return http.request<ReturnResult<string[]>>("get", "v1/skywalking/data/layers", {
    params: { configId },
  });
}

/**
 * 获取服务列表
 */
export function getSkywalkingServices(params: {
  configId: number;
  startTime: string;
  endTime: string;
  step?: string;
  layer?: string;
}) {
  return http.request<ReturnResult<SkywalkingService[]>>("get", "v1/skywalking/data/services", {
    params,
  });
}

/**
 * 搜索服务
 */
export function searchSkywalkingServices(params: {
  configId: number;
  startTime: string;
  endTime: string;
  step?: string;
  keyword?: string;
}) {
  return http.request<ReturnResult<SkywalkingService[]>>("get", "v1/skywalking/data/services/search", {
    params,
  });
}

/**
 * 获取服务实例列表
 */
export function getSkywalkingInstances(
  serviceId: string,
  params: {
    configId: number;
    startTime: string;
    endTime: string;
    step?: string;
  }
) {
  return http.request<ReturnResult<SkywalkingInstance[]>>(
    "get",
    `v1/skywalking/data/services/${serviceId}/instances`,
    { params }
  );
}

/**
 * 获取端点列表
 */
export function getSkywalkingEndpoints(
  serviceId: string,
  params: {
    configId: number;
    keyword?: string;
    limit?: number;
  }
) {
  return http.request<ReturnResult<SkywalkingEndpoint[]>>(
    "get",
    `v1/skywalking/data/services/${serviceId}/endpoints`,
    { params }
  );
}

/**
 * 查询链路追踪列表
 */
export function querySkywalkingTraces(params: {
  configId: number;
  startTime: string;
  endTime: string;
  step?: string;
  serviceId?: string;
  serviceInstanceId?: string;
  endpointId?: string;
  endpointName?: string;
  traceId?: string;
  traceState?: string;
  queryOrder?: string;
  minTraceDuration?: number;
  maxTraceDuration?: number;
  pageNum?: number;
  pageSize?: number;
}) {
  return http.request<ReturnResult<TraceBrief>>("get", "v1/skywalking/data/traces", { params });
}

/**
 * 查询链路详情
 */
export function getSkywalkingTraceDetail(traceId: string, configId: number) {
  return http.request<ReturnResult<TraceDetail>>("get", `v1/skywalking/data/traces/${traceId}`, {
    params: { configId },
  });
}

/**
 * 获取全局拓扑
 */
export function getSkywalkingGlobalTopology(params: {
  configId: number;
  startTime: string;
  endTime: string;
  step?: string;
  layer?: string;
}) {
  return http.request<ReturnResult<Topology>>("get", "v1/skywalking/data/topology/global", {
    params,
  });
}

/**
 * 获取服务拓扑
 */
export function getSkywalkingServiceTopology(
  serviceId: string,
  params: {
    configId: number;
    startTime: string;
    endTime: string;
    step?: string;
  }
) {
  return http.request<ReturnResult<Topology>>(
    "get",
    `v1/skywalking/data/topology/service/${serviceId}`,
    { params }
  );
}

/**
 * 获取告警列表
 */
export function getSkywalkingAlarms(params: {
  configId: number;
  startTime: string;
  endTime: string;
  step?: string;
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  return http.request<ReturnResult<AlarmList>>("get", "v1/skywalking/data/alarms", { params });
}

// ==================== 指标相关类型 ====================

/**
 * 指标数据点
 */
export interface MetricValue {
  id?: string;
  value: number;
}

/**
 * 时序指标数据
 */
export interface MetricsValues {
  label?: string;
  values: { values: MetricValue[] };
}

/**
 * 指标查询条件
 */
export interface MetricCondition {
  name: string;
  entity: {
    scope: string;
    serviceName?: string;
    serviceInstanceName?: string;
    endpointName?: string;
    normal?: boolean;
  };
}

/**
 * 服务指标概览
 */
export interface ServiceMetricsOverview {
  cpm: number;               // 每分钟调用次数
  sla: number;               // SLA百分比 (x100)
  respTime: number;          // 平均响应时间 ms
  apdex: number;             // Apdex 分数 (x10000)
  percentile?: number[];     // p50, p75, p90, p95, p99
}

/**
 * 服务指标趋势
 */
export interface ServiceMetricsTrend {
  timestamps: string[];
  cpm: number[];
  respTime: number[];
  sla: number[];
  apdex: number[];
}

// ==================== 指标 API ====================

/**
 * 获取服务指标概览
 */
export function getServiceMetricsOverview(params: {
  configId: number;
  serviceId: string;
  startTime: string;
  endTime: string;
  step?: string;
}) {
  return http.request<ReturnResult<ServiceMetricsOverview>>(
    "get",
    `v1/skywalking/data/metrics/service/${params.serviceId}/overview`,
    { params }
  );
}

/**
 * 获取服务指标趋势
 */
export function getServiceMetricsTrend(params: {
  configId: number;
  serviceId: string;
  startTime: string;
  endTime: string;
  step?: string;
}) {
  return http.request<ReturnResult<ServiceMetricsTrend>>(
    "get",
    `v1/skywalking/data/metrics/service/${params.serviceId}/trend`,
    { params }
  );
}

/**
 * 获取实例指标概览
 */
export function getInstanceMetricsOverview(params: {
  configId: number;
  instanceId: string;
  startTime: string;
  endTime: string;
  step?: string;
}) {
  return http.request<ReturnResult<ServiceMetricsOverview>>(
    "get",
    `v1/skywalking/data/metrics/instance/${params.instanceId}/overview`,
    { params }
  );
}

/**
 * 获取端点指标趋势
 */
export function getEndpointMetricsTrend(params: {
  configId: number;
  endpointId: string;
  startTime: string;
  endTime: string;
  step?: string;
}) {
  return http.request<ReturnResult<ServiceMetricsTrend>>(
    "get",
    `v1/skywalking/data/metrics/endpoint/${params.endpointId}/trend`,
    { params }
  );
}

/**
 * 获取全局指标概览（仪表盘）
 */
export function getGlobalMetricsOverview(params: {
  configId: number;
  startTime: string;
  endTime: string;
  step?: string;
}) {
  return http.request<ReturnResult<{
    totalServices: number;
    totalEndpoints: number;
    totalCpm: number;
    avgRespTime: number;
    avgSla: number;
  }>>("get", "v1/skywalking/data/metrics/global/overview", { params });
}

/**
 * 获取全局指标趋势
 */
export function getGlobalMetricsTrend(params: {
  configId: number;
  startTime: string;
  endTime: string;
  step?: string;
}) {
  return http.request<ReturnResult<ServiceMetricsTrend>>(
    "get",
    "v1/skywalking/data/metrics/global/trend",
    { params }
  );
}

/**
 * 获取慢端点排行
 */
export function getSlowEndpoints(params: {
  configId: number;
  serviceId?: string;
  startTime: string;
  endTime: string;
  step?: string;
  limit?: number;
}) {
  return http.request<ReturnResult<Array<{
    id: string;
    name: string;
    value: number;
  }>>>("get", "v1/skywalking/data/metrics/slow-endpoints", { params });
}

/**
 * 获取错误率高的服务排行
 */
export function getErrorRateServices(params: {
  configId: number;
  startTime: string;
  endTime: string;
  step?: string;
  limit?: number;
}) {
  return http.request<ReturnResult<Array<{
    id: string;
    name: string;
    value: number;
  }>>>("get", "v1/skywalking/data/metrics/error-rate-services", { params });
}

// ==================== 工具函数 ====================

/**
 * 获取时间范围（默认最近15分钟）
 */
export function getDefaultTimeRange(minutes: number = 15) {
  const now = new Date();
  const start = new Date(now.getTime() - minutes * 60 * 1000);
  
  const formatTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}${mins}`;
  };

  return {
    startTime: formatTime(start),
    endTime: formatTime(now),
  };
}

/**
 * 格式化持续时间
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}min`;
  }
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}
