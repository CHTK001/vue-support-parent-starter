/**
 * SkyWalking 控制台 接口封装
 *
 * <p>对接 {@code spring-support-datasource-hub-starter} 的 {@code SkywalkingManageController}。
 * 所有查询走 OAP 的 GraphQL，由后端按每请求的数据源地址建连；远端失败统一翻成
 * {@code ReturnResult} 的错误信封，页面只读状态和原因，不落到 500。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { http, unwrapResult } from "@repo/utils";
import { fetchDataSources, type DataSourceInfo } from "@pages/datasource";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/** 接口根路径 */
const B = "/ms/monitor/skywalking";

export type { DataSourceInfo };
export { fetchDataSources };

/** 列出 type 为 skywalking 的数据源 */
export const fetchSkywalkingSources = async (): Promise<DataSourceInfo[]> => {
  const all = await fetchDataSources();
  return (all || []).filter(d => d.type === "skywalking");
};

// ==================== 数据模型 ====================

/** 标签键值对（服务/实例/端点的标签） */
export interface SkyTag {
  key: string;
  value: string;
}

/** SkyWalking 总览 */
export interface SkyOverview {
  datasourceId: number;
  datasourceName: string;
  /** OAP 地址 */
  url: string;
  /** OAP 版本，未知为 unknown */
  version: string;
  available: boolean;
  /** 数据源是否已启用 */
  enabled: boolean;
  /** 不可用时的原因 */
  message: string;
  capabilities: string[];
  checkedAt: number;
  serviceCount: number;
  alarmCount: number;
  /** 最近 15 分钟告警数（0 表示未查询或暂不支持） */
  recentAlarmCount: number;
}

/** 引擎状态 */
export interface SkyStatus {
  name: string;
  version: string;
  available: boolean;
  enabled: boolean;
  endpoint: string;
  /** 运行模式（streaming / query） */
  mode: string;
  capabilities: string[];
  message: string;
  checkedAt: number;
}

/** 服务 */
export interface SkyService {
  id: string;
  name: string;
  group: string;
  layers: string[];
  instances: number;
  endpoints: number;
  calls: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  errorRate: number;
  tags: SkyTag[];
}

/** 实例 */
export interface SkyInstance {
  id: string;
  serviceName: string;
  name: string;
  language: string;
  heartbeatTime: string;
  tags: SkyTag[];
}

/** 端点 */
export interface SkyEndpoint {
  id: string;
  serviceName: string;
  name: string;
  calls: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  errorRate: number;
  tags: SkyTag[];
}

/** 链路摘要 */
export interface SkyTraceSummary {
  traceId: string;
  serviceName: string;
  endpointName: string;
  durationMs: number;
  startTime: string;
  endTime: string;
  error: boolean;
  spanCount: number;
}

/** 链路列表响应（后端返回 page 结构） */
export interface SkyTracePage {
  list: SkyTraceSummary[];
  total: number;
  page: number;
  size: number;
}

/** 链路详情 */
export interface SkyTraceDetail {
  traceId: string;
  serviceName: string;
  endpointName: string;
  durationMs: number;
  startTime: string;
  endTime: string;
  error: boolean;
  spanCount: number;
  spans: SkySpan[];
}

/** Span **/
export interface SkySpan {
  traceId: string;
  segmentId: string;
  spanId: string;
  parentSpanId: string | null;
  serviceName: string;
  instanceName: string;
  endpointName: string;
  layer: string;
  type: string;
  component: string;
  peer: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  error: boolean;
  tags: SkyTag[];
  logs: SkySpanLog[];
}

/** Span 日志 */
export interface SkySpanLog {
  time: string;
  tags: SkyTag[];
}

/** 拓扑 */
export interface SkyTopology {
  nodes: SkyTopologyNode[];
  calls: SkyTopologyCall[];
}

/** 拓扑节点 */
export interface SkyTopologyNode {
  id: string;
  name: string;
  /** 节点类型：SERVICE / INSTANCE / ENDPOINT / MIDDLEWARE / ... */
  type: string;
  real: boolean;
  self: boolean;
  layer: string;
}

/** 拓扑调用 */
export interface SkyTopologyCall {
  id: string;
  source: string;
  target: string;
  detectPoint: string;
  calls: number;
  errorRate: number;
  avgMs: number;
}

/** 指标时序 */
export interface SkyMetric {
  name: string;
  scope: string;
  label: string;
  unit: string;
  points: SkyMetricPoint[];
}

/** 指标采样点 */
export interface SkyMetricPoint {
  time: string;
  value: number;
}

/** 告警 */
export interface SkyAlarm {
  id: string;
  /** 触发告警的实体名（服务 / 「实例 of 服务」/「端点 in 服务」） */
  name: string;
  message: string;
  /** 触发毫秒戳 */
  startTime: number;
  scope: string;
  /** 从事件来源反查的服务名，可能为空 */
  serviceName: string;
  /** 规则名：query-protocol 未暴露，通常为空 */
  ruleName: string;
  /** 事件明细，已格式化成可读文本 */
  events: string[];
  tags: SkyTag[];
}

/** 日志 */
export interface SkyLogRecord {
  timestamp: string;
  serviceName: string;
  instanceName: string;
  endpointName: string;
  traceId: string;
  level: string;
  contentType: string;
  content: string;
  tags: SkyTag[];
}

// ==================== 查询 ====================

/**
 * 读取总览。
 *
 * @param datasourceId 数据源 ID，可空
 */
export const fetchSkywalkingOverview = (datasourceId?: number | null) =>
  http().get(`${B}/overview`).query({ datasourceId }).noToast(true).then(r => unwrap<SkyOverview>(r));

/**
 * 读取状态。
 *
 * @param datasourceId 数据源 ID，可空
 */
export const fetchSkywalkingStatus = (datasourceId?: number | null) =>
  http().get(`${B}/status`).query({ datasourceId }).noToast(true).then(r => unwrap<SkyStatus>(r));

/** 服务目录 */
export const fetchSkywalkingServices = (
  params: {
    serviceName?: string | null;
    keyword?: string | null;
    startTime?: number | null;
    endTime?: number | null;
    page?: number | null;
    size?: number | null;
    datasourceId?: number | null;
  } = {},
) =>
  http().get(`${B}/services`).query(params).noToast(true).then(r => unwrap<SkyService[]>(r));

/** 服务实例 */
export const fetchSkywalkingInstances = (
  serviceName: string,
  params: {
    keyword?: string | null;
    startTime?: number | null;
    endTime?: number | null;
    page?: number | null;
    size?: number | null;
    datasourceId?: number | null;
  } = {},
) =>
  http().get(`${B}/instances/${signed(serviceName)}`).query(params).noToast(true).then(r => unwrap<SkyInstance[]>(r));

/** 服务端点 */
export const fetchSkywalkingEndpoints = (
  serviceName: string,
  params: {
    keyword?: string | null;
    startTime?: number | null;
    endTime?: number | null;
    page?: number | null;
    size?: number | null;
    datasourceId?: number | null;
  } = {},
) =>
  http().get(`${B}/endpoints/${signed(serviceName)}`).query(params).noToast(true).then(r => unwrap<SkyEndpoint[]>(r));

/** 链路列表 */
export const fetchSkywalkingTraces = (
  params: {
    serviceName?: string | null;
    keyword?: string | null;
    state?: "ALL" | "SUCCESS" | "ERROR" | null;
    page?: number | null;
    size?: number | null;
    startTime?: number | null;
    endTime?: number | null;
    datasourceId?: number | null;
  } = {},
) =>
  http().get(`${B}/traces`).query(params).noToast(true).then(r => unwrap<SkyTracePage>(r));

/** 链路详情 */
export const fetchSkywalkingTrace = (traceId: string, datasourceId?: number | null) =>
  http().get(`${B}/trace/${signed(traceId)}`).query({ datasourceId }).noToast(true).then(r => unwrap<SkyTraceDetail>(r));

/** 服务拓扑 */
export const fetchSkywalkingTopology = (
  params: {
    serviceName?: string | null;
    page?: number | null;
    size?: number | null;
    startTime?: number | null;
    endTime?: number | null;
    datasourceId?: number | null;
  } = {},
) =>
  http().get(`${B}/topology`).query(params).noToast(true).then(r => unwrap<SkyTopology>(r));

/** 指标时序 */
export const fetchSkywalkingMetrics = (
  params: {
    name?: string | null;
    scope?: "SERVICE" | "ENDPOINT" | "SERVICE_INSTANCE" | null;
    serviceName?: string | null;
    instanceName?: string | null;
    endpointName?: string | null;
    startTime?: number | null;
    endTime?: number | null;
    step?: "SECOND" | "MINUTE" | "HOUR" | "DAY" | null;
    datasourceId?: number | null;
  } = {},
) =>
  http()
    .get(`${B}/metrics`)
    .query(params)
    .noToast(true)
    .then(r => unwrap<SkyMetric>(r));

/** 告警列表 */
export const fetchSkywalkingAlarms = (
  params: {
    keyword?: string | null;
    page?: number | null;
    size?: number | null;
    startTime?: number | null;
    endTime?: number | null;
    datasourceId?: number | null;
  } = {},
) =>
  http().get(`${B}/alarms`).query(params).noToast(true).then(r => unwrap<SkyAlarm[]>(r));

/** 日志列表 */
export const fetchSkywalkingLogs = (
  params: {
    serviceName?: string | null;
    instanceName?: string | null;
    endpointName?: string | null;
    keyword?: string | null;
    page?: number | null;
    size?: number | null;
    startTime?: number | null;
    endTime?: number | null;
    datasourceId?: number | null;
  } = {},
) =>
  http().get(`${B}/logs`).query(params).noToast(true).then(r => unwrap<SkyLogRecord[]>(r));

/** 给属于路径一部分的文本做 URL 编码（服务名/端点名/链路 ID 里可能含 -、.、%） */
const signed = (value: string): string => encodeURIComponent(value);
