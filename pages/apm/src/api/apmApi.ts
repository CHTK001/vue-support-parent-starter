/**
 * APM 统一接口客户端 —— 前端唯一的数据入口。
 *
 * <p>后端是 {@code spring-support-apm-starter} 的统一 REST（{@code /api/apm/v1/**}），
 * 它在内部按「当前系统里到底装了哪个 APM」自动选择 SkyWalking / hotspot / OpenTelemetry
 * 三种引擎之一，返回的结构一律是 {@code com.chua.common.support.apm.model.*}。
 * 因此本文件里的类型就是那层模型的前端镜像，页面换后端不用改一行。</p>
 *
 * <p><strong>响应形状</strong>：所有接口都被包成 {@code ReturnResult{code,data,msg}}，
 * 统一用 {@code unwrapResult} 拆包 —— 失败时它抛 {@code Error}（带后端 msg），
 * 页面按需 catch 成空列表与提示，绝不整页报错。</p>
 *
 * <p><strong>没有 APM 是正常状态</strong>：{@link getApmStatus} 在「一个引擎都没装/都连不上」
 * 时依然成功返回 {@code present=false} 与原因说明，前端据此渲染降级视图，
 * 这不是异常路径，不要走进 catch。</p>
 *
 * @since 4.0.0.51
 */
import { http, unwrapResult } from "@repo/utils";
import { apmConfig, apmPrefix } from "../config";

// ─────────────────────────── 通用 ───────────────────────────

/** 键值标签（SkyWalking 的 tag / 实例属性） */
export interface ApmTag {
  key: string;
  value: string;
}

/** 候选引擎探测结果：`/status` 里「装了但连不上」与「压根没装」的区别就在这 */
export interface ApmCandidate {
  name: string;
  available: boolean;
  mode: string;
  version: string;
  endpoint?: string | null;
  message?: string | null;
}

/** APM 状态描述：`GET /api/apm/v1/status` */
export interface ApmStatus {
  /** 是否选中了可用的 APM —— 前端首屏唯一判据 */
  present: boolean;
  /** 模块是否被配置启用（plugin.apm.enabled） */
  enabled: boolean;
  /** 选中引擎名：skywalking / hotspot / opentelemetry */
  name?: string | null;
  version: string;
  /** 运行模式：agent（进程内）/ remote（远端后端）/ none */
  mode: string;
  /** 后端地址，进程内引擎为 local */
  endpoint?: string | null;
  /** 能力清单，见 {@link ApmCapability} */
  capabilities: string[];
  /** 说明 / 失败原因 */
  message?: string | null;
  /** 全部候选引擎（含不可用的） */
  candidates: ApmCandidate[];
  /** 探测时间（毫秒） */
  checkedAt: number;
}

/** 能力标识，与后端 {@code OtnlEngine.CAP_*} 一一对应 */
export type ApmCapability =
  | "services"
  | "instances"
  | "endpoints"
  | "traces"
  | "topology"
  | "metrics"
  | "runtime"
  | "alarms"
  | "alerts"
  | "logs"
  | "profiles";

/** 作用域，与后端 {@code OtnlScope} 一致 */
export type ApmScope =
  | "ALL"
  | "SERVICE"
  | "SERVICE_INSTANCE"
  | "ENDPOINT"
  | "SERVICE_RELATION";

/** 链路状态过滤，与后端 {@code OtnlTraceState} 一致 */
export type ApmTraceState = "ALL" | "SUCCESS" | "ERROR";

/** 时间步长（SkyWalking Duration.step） */
export type ApmStep = "SECOND" | "MINUTE" | "HOUR" | "DAY";

// ─────────────────────────── 业务模型 ───────────────────────────

/** 服务目录项 */
export interface ApmService {
  id: string;
  name: string;
  group?: string | null;
  layers?: string[];
  instances: number;
  endpoints: number;
  calls: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  /** 错误率（百分比数值，如 1.25 表示 1.25%） */
  errorRate: number;
  tags?: ApmTag[];
}

/** 服务实例 */
export interface ApmInstance {
  id: string;
  serviceName: string;
  name: string;
  language?: string | null;
  /** 最后心跳时间（毫秒） */
  heartbeatTime: number;
  attributes?: ApmTag[];
}

/** 端点 */
export interface ApmEndpoint {
  id: string;
  serviceName: string;
  name: string;
  calls: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  errorRate: number;
  tags?: ApmTag[];
}

/** Span 内的日志/事件 */
export interface ApmSpanLog {
  time: number;
  tags: ApmTag[];
}

/** 链路跨度 */
export interface ApmSpan {
  traceId: string;
  segmentId?: string | null;
  spanId: string;
  parentSpanId?: string | null;
  serviceName?: string | null;
  instanceName?: string | null;
  endpointName?: string | null;
  layer?: string | null;
  type?: string | null;
  component?: string | null;
  peer?: string | null;
  startTime: number;
  endTime: number;
  durationMs: number;
  error: boolean;
  tags?: ApmTag[];
  logs?: ApmSpanLog[];
}

/** 链路（列表项不含 spans，详情含） */
export interface ApmTrace {
  traceId: string;
  serviceName?: string | null;
  endpointName?: string | null;
  durationMs: number;
  startTime: number;
  endTime: number;
  error: boolean;
  spanCount: number;
  spans?: ApmSpan[];
}

/** 拓扑节点 */
export interface ApmTopologyNode {
  id: string;
  name: string;
  type?: string | null;
  /** 是否真实服务。后端（OtnlTopologyNode）的字段名是 real —— 9.x 起沿用 */
  real?: boolean;
  /** @deprecated 旧字段名，仅为兼容早期快照数据；新代码用 real */
  isReal?: boolean;
  /** 自身节点（SkyWalking 的 isSelf）；兼容后端可能的 self 字段名 */
  isSelf?: boolean | null;
  self?: boolean | null;
  layer?: string | null;
}

/** 拓扑调用边 */
export interface ApmTopologyCall {
  id?: string | null;
  source: string;
  target: string;
  detectPoint?: string | null;
  calls: number;
  errorRate: number;
  avgMs: number;
}

/** 拓扑 */
export interface ApmTopology {
  nodes: ApmTopologyNode[];
  calls: ApmTopologyCall[];
}

/** 指标定义（渲染指标下拉） */
export interface ApmMetricDefinition {
  name: string;
  scope: ApmScope;
  label: string;
  unit: string;
  description?: string | null;
}

/** 指标数据点 */
export interface ApmMetricPoint {
  time: number;
  value: number;
}

/** 指标时序 */
export interface ApmMetricSeries {
  name: string;
  scope: ApmScope;
  label: string;
  unit: string;
  points: ApmMetricPoint[];
}

/** 告警 */
export interface ApmAlarm {
  id: string;
  /**
   * 触发告警的实体名 —— Service 作用域就是服务名，
   * Instance 是「实例 of 服务」，Endpoint 是「端点 in 服务」。
   * （SkyWalking 的 AlarmMessage.name 由 AlarmEntity#getName() 写入。）
   */
  name: string;
  message?: string | null;
  startTime: number;
  scope?: string | null;
  /** 同 {@link name}：OAP 在告警查询里只给了实体名，没有单独的服务字段 */
  serviceName?: string | null;
  /** 规则名。当前 query-protocol 未暴露该字段，通常为空 */
  ruleName?: string | null;
  /** 关联事件（如 "Alerting" / "Recovery"），已格式化成可读文本 */
  events?: string[];
  tags?: ApmTag[];
}

/** 日志记录 */
export interface ApmLogRecord {
  timestamp: number;
  serviceName?: string | null;
  instanceName?: string | null;
  endpointName?: string | null;
  traceId?: string | null;
  level?: string | null;
  contentType?: string | null;
  content?: string | null;
  tags?: ApmTag[];
}

/** 性能剖析任务（对齐 SkyWalking ProfileTask） */
export interface ApmProfileTask {
  id: string;
  serviceId?: string | null;
  serviceName?: string | null;
  endpointName?: string | null;
  /** 任务开始毫秒戳 */
  startTime: number;
  /** 持续分钟数 */
  durationMinutes: number;
  /** 触发剖析的最小耗时（毫秒） */
  minDurationThreshold: number;
  /** 线程栈转储间隔（毫秒），-1 表示每次调用都转储 */
  dumpPeriod: number;
  /** 最多采样次数 */
  maxSamplingCount: number;
  /** 已响应实例数 */
  instanceCount: number;
  /** 已响应实例名 */
  instanceNames: string[];
}

/** 剖析任务采样到的链路片段 */
export interface ApmProfiledSegment {
  traceId: string;
  segmentId: string;
  instanceId?: string | null;
  instanceName?: string | null;
  endpointNames: string[];
  durationMs: number;
  startTime: number;
  spanCount: number;
}

/** 剖析栈帧节点 */
export interface ApmProfileStack {
  id: string;
  parentId: string;
  codeSignature: string;
  durationMs: number;
  selfDurationMs: number;
  count: number;
  children: ApmProfileStack[];
}

/** 剖析分析结果 */
export interface ApmProfileAnalysis {
  taskId: string;
  tip?: string | null;
  trees: ApmProfileStack[];
}

/** 3D 基础设施图节点 */
export interface ApmInfraNode {
  id: string;
  name: string;
  type?: string | null;
  layer: string;
  real: boolean;
}

/** 3D 基础设施图分层统计 */
export interface ApmInfraLayer {
  name: string;
  count: number;
}

/** 3D 基础设施图数据（`GET /infra-3d`） */
export interface ApmInfra3D {
  nodes: ApmInfraNode[];
  calls: ApmTopologyCall[];
  layers: ApmInfraLayer[];
}

/** 健康度（首页卡片） */
export interface ApmHealth {
  health: string;
  qps: number;
  errorRate: number;
  avgMs: number;
  p99Ms: number;
  services: number;
  endpoints: number;
  alarms: number;
  message?: string | null;
}

/** 概览：描述 + 健康度（`GET /overview`） */
export interface ApmOverview {
  descriptor: ApmStatus;
  health: ApmHealth;
}

/** 能力清单（`GET /capabilities`） */
export interface ApmCapabilities {
  engine: string;
  capabilities: string[];
}

// ─────────────────────────── 查询参数 ───────────────────────────

/** 通用查询条件：时间窗口 + 过滤 + 分页 */
export interface ApmQuery {
  service?: string;
  instance?: string;
  endpoint?: string;
  keyword?: string;
  state?: ApmTraceState;
  step?: ApmStep;
  /** 开始时间（毫秒），缺省由后端按 minutes 回推 */
  startTime?: number;
  endTime?: number;
  /** 时间窗口（分钟），缺省 30 */
  minutes?: number;
  pageNum?: number;
  pageSize?: number;
  /** 链路按耗时倒序 */
  orderByDuration?: boolean;
}

/** 指标查询 */
export interface ApmMetricQuery {
  name: string;
  scope?: ApmScope;
  service?: string;
  instance?: string;
  endpoint?: string;
  startTime?: number;
  endTime?: number;
  minutes?: number;
  step?: ApmStep;
}

// ─────────────────────────── 请求封装 ───────────────────────────

/**
 * 去掉 undefined / null / 空串，避免把 `service=` 这种空参发给后端
 * （后端把空串归一成 null，但留着会在日志里制造噪音）。
 */
function clean(query?: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!query) {
    return out;
  }
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** GET 请求 + 拆包 */
function get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
  return http()
    .get(`${apmPrefix()}${path}`)
    .query(clean(query))
    .then((res) => unwrapResult<T>(res));
}

/** 状态缓存时长：优先读 app.yaml 的 apmConfig.statusTtl */
function statusTtl(): number {
  return apmConfig().statusTtl;
}

let statusCache: ApmStatus | null = null;
let statusCachedAt = 0;
let statusInflight: Promise<ApmStatus> | null = null;

/**
 * APM 状态：前端首屏先调它，`present=false` 时页面渲染降级视图。
 *
 * @param force 忽略缓存强制重探（「重新探测」按钮用）
 */
export function getApmStatus(force = false): Promise<ApmStatus> {
  const now = Date.now();
  if (!force && statusCache && now - statusCachedAt < statusTtl()) {
    return Promise.resolve(statusCache);
  }
  if (!force && statusInflight) {
    return statusInflight;
  }
  const request = get<ApmStatus>("/status")
    .then((status) => {
      statusCache = status;
      statusCachedAt = Date.now();
      return status;
    })
    .finally(() => {
      statusInflight = null;
    });
  statusInflight = request;
  return request;
}

/** 清掉状态缓存（切服务器 / 改配置后调） */
export function resetApmStatusCache(): void {
  statusCache = null;
  statusCachedAt = 0;
  statusInflight = null;
}

/** 当前引擎的能力清单 */
export function getCapabilities(): Promise<ApmCapabilities> {
  return get<ApmCapabilities>("/capabilities");
}

/** 概览：引擎描述 + 健康度 */
export function getOverview(query: ApmQuery = {}): Promise<ApmOverview> {
  return get<ApmOverview>("/overview", { ...query });
}

/** 服务目录 */
export function listServices(query: ApmQuery = {}): Promise<ApmService[]> {
  return get<ApmService[]>("/services", { ...query });
}

/** 服务实例 */
export function listInstances(service: string, query: ApmQuery = {}): Promise<ApmInstance[]> {
  return get<ApmInstance[]>("/instances", { ...query, service });
}

/** 端点（keyword 用于名字过滤） */
export function listEndpoints(service: string, keyword?: string, query: ApmQuery = {}): Promise<ApmEndpoint[]> {
  return get<ApmEndpoint[]>("/endpoints", { ...query, service, keyword });
}

/** 链路列表 */
export function listTraces(query: ApmQuery = {}): Promise<ApmTrace[]> {
  return get<ApmTrace[]>("/traces", { ...query });
}

/** 链路详情（含 Span）；不存在时后端返回失败，调用方按 null 处理 */
export async function getTrace(traceId: string): Promise<ApmTrace | null> {
  try {
    return await get<ApmTrace>(`/trace/${encodeURIComponent(traceId)}`);
  } catch {
    return null;
  }
}

/** 拓扑：不传 service 即全局拓扑 */
export function getTopology(query: ApmQuery = {}): Promise<ApmTopology> {
  return get<ApmTopology>("/topology", { ...query });
}

/** 多服务合并拓扑（对比页）：一次请求拿多个服务的节点与调用边 */
export function getMultiTopology(services: string[], query: ApmQuery = {}): Promise<ApmTopology> {
  if (!services.length) {
    return Promise.resolve({ nodes: [], calls: [] });
  }
  return get<ApmTopology>("/topology/multi", { ...query, services: services.join(",") });
}

/** 指标时序 */
export function getMetrics(query: ApmMetricQuery): Promise<ApmMetricSeries> {
  return get<ApmMetricSeries>("/metrics", { ...query });
}

/** 指标定义（下拉框数据） */
export function listMetricDefinitions(scope: ApmScope = "SERVICE"): Promise<ApmMetricDefinition[]> {
  return get<ApmMetricDefinition[]>("/metric-definitions", { scope });
}

/** 告警 */
export function listAlarms(query: ApmQuery = {}): Promise<ApmAlarm[]> {
  return get<ApmAlarm[]>("/alarms", { ...query });
}

/**
 * 告警（分析视图口径）
 *
 * <p>与 {@link listAlarms} 同源，但走 `/alerts` 分支：后端按 {@code CAP_ALERTS} 判能力，
 * 于是「引擎不支持告警分析」与「引擎不支持告警」能在能力清单里区分开。</p>
 */
export function listAlerts(query: ApmQuery = {}): Promise<ApmAlarm[]> {
  return get<ApmAlarm[]>("/alerts", { ...query });
}

/** 日志 */
export function listLogs(query: ApmQuery = {}): Promise<ApmLogRecord[]> {
  return get<ApmLogRecord[]>("/logs", { ...query });
}

/**
 * 批量指标（多实体对比）
 *
 * <p>后端按「指标名 × 实体」做笛卡尔组合，最多 24 条曲线；返回顺序与组合顺序一致，
 * 因此这里的调用方要按同样的顺序去对齐 label。</p>
 */
export function getMetricsBatch(
  names: string[],
  services: string[],
  query: ApmQuery & { scope?: ApmScope } = {},
): Promise<ApmMetricSeries[]> {
  return get<ApmMetricSeries[]>("/metrics-batch", {
    ...query,
    names: names.join(","),
    services: services.join(","),
  });
}

/** 3D 基础设施图数据（全局拓扑 + 分层统计） */
export function getInfra3D(query: ApmQuery = {}): Promise<ApmInfra3D> {
  return get<ApmInfra3D>("/infra-3d", { ...query });
}

/** 性能剖析任务列表；service 为空时多数引擎返回空列表 */
export function listProfileTasks(query: ApmQuery = {}): Promise<ApmProfileTask[]> {
  return get<ApmProfileTask[]>("/profiles", { ...query });
}

/** 剖析任务采样到的链路片段 */
export function listProfiledSegments(taskId: string): Promise<ApmProfiledSegment[]> {
  return get<ApmProfiledSegment[]>(`/profiles/${encodeURIComponent(taskId)}/segments`);
}

/** 剖析结果（线程栈树） */
export function getProfileAnalysis(taskId: string): Promise<ApmProfileAnalysis> {
  return get<ApmProfileAnalysis>(`/profiles/${encodeURIComponent(taskId)}/analysis`);
}
