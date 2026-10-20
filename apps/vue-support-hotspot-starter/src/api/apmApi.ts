/**
 * Hotsport APM API 层 — 直连后端 /api/apm/*（前后端分离）
 *
 * 与 pages/hotsport/src/api/hotsportApi.ts 契约一致，但解耦 @repo/utils
 * 拦截器链路，保证独立应用可构建。
 *
 * @since 2.0.0
 */
import axios, { type AxiosInstance } from "axios";

// ---- 类型定义（与后端 ApmQueryService 返回结构对齐）----

/** 后端统一返回结构 { code, data, msg } */
export interface ApiResult<T> {
  code: number;
  msg: string;
  data: T;
}

/** 概览统计 */
export interface ApmStats {
  agentActive: boolean;
  agentEnabled: boolean;
  transmissionCount: number;
  leakCount: number;
  errorCount: number;
  traceCount: number;
  dependencyCount: number;
  /** SkyWalking 饱和度派生指标（stats() 已并入 health() 返回值，SSE 帧携带） */
  health?: "HEALTHY" | "DEGRADED" | "SATURATED";
  qps?: number;
  errorRate?: number;
  activeLeaks?: number;
  recentAlerts?: ApmAlert[];
}

/** 传输记录 */
export interface TransmissionRecord {
  id: number;
  traceId: string;
  spanId: string;
  parentSpanId: string;
  source: string;
  target: string;
  protocol: string;
  software: string;
  operation: string;
  status: string;
  statusCode: number;
  startTime: string;
  endTime: string;
  durationMs: number;
  bytesOut: number;
  bytesIn: number;
  errorType: string;
  errorMessage: string;
}

/** 依赖边 */
export interface DependencyEdge {
  source: string;
  target: string;
  protocol: string;
  software: string;
  callCount: number;
  errorCount: number;
  avgDurationMs: number;
  lastError: string;
  lastCallAt: string;
  edgeId: string;
  /** 聚合后字段（/dependencies/aggregated 返回） */
  errorRate?: number;
  p95Ms?: number;
}

/** 资源泄漏记录 */
export interface LeakRecord {
  id: number;
  handleId: string;
  resourceType: string;
  resourceName: string;
  thread: string;
  active: boolean;
  ageMs: number;
  detectedAt: string;
  stackTrace: string;
}

/** 日志记录 */
export interface LogRecord {
  id: number;
  timestamp: string;
  level: string;
  logger: string;
  className: string;
  methodName: string;
  message: string;
  traceId: string;
}

/** 分页结果 */
export interface Paged<T> {
  total: number;
  offset: number;
  limit: number;
  items: T[];
}

// ---- 查询参数 ----

export interface TransmissionQuery {
  page?: number;
  size?: number;
  source?: string;
  target?: string;
  protocol?: string;
  errorOnly?: boolean;
  startTime?: number;
  endTime?: number;
  /** 按 traceId 精确搜索（后端服务端过滤，2026 增强） */
  traceId?: string;
  /** 耗时下限（毫秒） */
  durationMin?: number;
  /** 耗时上限（毫秒） */
  durationMax?: number;
  /** 操作名模糊搜索（后端内存过滤，2026 增强） */
  operation?: string;
}

export interface LeakQuery {
  page?: number;
  size?: number;
  resourceType?: string;
  minAgeMs?: number;
  startTime?: number;
  endTime?: number;
  /** 资源名模糊搜索 */
  resourceName?: string;
  /** 线程名模糊搜索 */
  thread?: string;
  /** 仅返回活跃泄漏 */
  activeOnly?: boolean;
}

export interface LogQuery {
  page?: number;
  size?: number;
  level?: string;
  /** 消息/Logger 全文搜索（服务端过滤，2026 增强） */
  keyword?: string;
  /** 按 traceId 精确匹配 */
  traceId?: string;
  /** 时间窗口 */
  startTime?: number;
  endTime?: number;
  /** 类名模糊匹配 */
  className?: string;
}

// ---- SSE 实时流（增强）----

/** 打开 /api/apm/stream，回调每次 stats 快照。返回 close() 终止。 */
export function watchStats(onSnapshot: (stats: ApmStats & { ts: number }) => void, onError?: (e: Event) => void): { close: () => void } {
  const es = new EventSource("/api/apm/stream?intervalMs=3000");
  es.addEventListener("stats", (ev: MessageEvent) => {
    try {
      const parsed = JSON.parse(ev.data as string) as { ts?: number; data?: ApmStats } & Partial<ApmStats>;
      // 后端帧结构 { ts, data: stats }；兼容平铺 { ...stats, ts }
      const snapshot = (parsed.data && typeof parsed.data === "object")
        ? ({ ...parsed.data, ts: parsed.ts } as ApmStats & { ts: number })
        : (parsed as unknown as ApmStats & { ts: number });
      onSnapshot(snapshot);
    } catch {
      /* 跳过畸形帧 */
    }
  });
  if (onError) es.addEventListener("error", onError);
  return {
    close: () => es.close(),
  };
}

// ---- 导出工具（增强）----

/** 对象数组 → CSV 字符串（首行表头，字段取 keys 并集） */
export function toCsv<T extends Record<string, unknown>>(rows: T[], header?: string[]): string {
  if (rows.length === 0) return header?.length ? header.join(",") : "";
  const keys = header ?? Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [keys.join(",")];
  for (const r of rows) lines.push(keys.map((k) => esc((r as Record<string, unknown>)[k])).join(","));
  return lines.join("\n");
}

/** 触发浏览器下载（JSON 或 CSV） */
export function download(filename: string, content: string, mime = "application/json"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- 实例 ----

const instance: AxiosInstance = axios.create({
  baseURL: "/api/apm",
  timeout: 10000,
});

/** 解包 ReturnResult<T> → T（axios 泛型声明为裸数据，实际响应体是 ApiResult，运行期取 .data） */
async function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
  const { data } = await p;
  return (data as unknown as ApiResult<T>).data;
}

// ---- 统计 ----

export function getStats(): Promise<ApmStats> {
  return unwrap(instance.get<ApmStats>("/stats"));
}

// ---- 传输记录 ----

export function pageTransmissions(params: TransmissionQuery = {}): Promise<Paged<TransmissionRecord>> {
  return unwrap(instance.get<Paged<TransmissionRecord>>("/transmissions", { params }));
}

// ---- 依赖图 ----

export function getDependencies(size = 100): Promise<{ total: number; items: DependencyEdge[] }> {
  return unwrap(instance.get<{ total: number; items: DependencyEdge[] }>("/dependencies", { params: { size } }));
}

// ---- 资源泄漏 ----

export function pageLeaks(params: LeakQuery = {}): Promise<Paged<LeakRecord>> {
  return unwrap(instance.get<Paged<LeakRecord>>("/leaks", { params }));
}

// ---- 日志 ----

export function pageLogs(params: LogQuery = {}): Promise<Paged<LogRecord>> {
  return unwrap(instance.get<Paged<LogRecord>>("/logs", { params }));
}

// ---- Trace 详情（span 列表）----

export function getTraceDetail(traceId: string): Promise<TransmissionRecord[]> {
  return unwrap(instance.get<TransmissionRecord[]>(`/trace/${encodeURIComponent(traceId)}`));
}

// ---- Agent 实时数据（/agent/*）----

/** Agent 配置快照（契约就绪；后端未实现时前端返回 null 降级） */
export interface AgentConfig {
  samplingRate: number;
  slowThresholdMs: number;
  logLevel: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";
  enabled: boolean;
  injectMode: "DISABLED" | "MONITOR" | "SIMULATE";
  updatedAt?: number;
}

/** Agent 运行状态详情 */
export interface AgentStatusDetail {
  agentActive: boolean;
  agentEnabled: boolean;
  version?: string;
  startedAt?: number;
  lastHeartbeat?: number;
  heartbeatLostMs?: number;
  config?: AgentConfig;
}

/** 查询 Agent 配置 */
export function getAgentConfig(): Promise<AgentConfig | null> {
  return unwrap(instance.get<AgentConfig | null>("/agent/config"));
}

/** 更新 Agent 配置 */
export function updateAgentConfig(params: Partial<AgentConfig>): Promise<AgentConfig> {
  return unwrap(instance.post<AgentConfig>("/agent/config", null, { params }));
}

/** Agent 启停 */
export function setAgentEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
  return unwrap(instance.post<{ enabled: boolean }>("/agent/enabled", null, { params: { enabled } }));
}

/** 链路树（trace → span 两级，ReTree 数据源） */
export function getTracesTree(limit = 50): Promise<TraceTreeItem[]> {
  return unwrap(instance.get<TraceTreeItem[]>("/agent/traces/tree", { params: { limit } }));
}

/** Agent 实时 Trace Span 列表 */
export function getAgentTraces(limit = 200): Promise<TraceTreeItem[]> {
  return unwrap(instance.get<TraceTreeItem[]>("/agent/traces", { params: { limit } }));
}

/** Agent 实时依赖边列表 */
export function getAgentDependencies(limit = 50): Promise<DependencyEdge[]> {
  return unwrap(instance.get<DependencyEdge[]>("/agent/dependencies", { params: { limit } }));
}

// ---- 服务 / 端点聚合（SkyWalking 三层拓扑 + 端点分析）----

export interface ApmService {
  service: string;
  endpointCount: number;
  callCount: number;
  errorCount: number;
  /** 错误率（%），后端从 callCount/errorCount 计算 */
  errorRate?: number;
}

export interface ApmEndpoint {
  endpoint: string;
  callCount: number;
  errorCount: number;
  errorRate: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}

/** 服务聚合（software@host） */
export function getServices(): Promise<ApmService[]> {
  return unwrap(instance.get<ApmService[]>("/services"));
}

/** 端点聚合 + 分位数 */
export function getEndpoints(limit = 50, keyword?: string): Promise<ApmEndpoint[]> {
  return unwrap(instance.get<ApmEndpoint[]>("/endpoints", { params: { limit, keyword } }));
}

// ---- 服务健康详情（按 service 过滤聚合）----

export interface ServiceDetail {
  service: string;
  callCount: number;
  errorCount: number;
  errorRatePercent: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  endpointCount: number;
}

/** 服务健康详情（按 service 过滤聚合） */
export function getServiceDetail(service: string): Promise<ServiceDetail> {
  return unwrap(instance.get<ServiceDetail>(`/service/${encodeURIComponent(service)}/detail`));
}

/** 依赖边聚合（按 edgeId 归并，修复 callCount=1 存储问题） */
export function getDependenciesAggregated(size = 100): Promise<DependencyEdge[]> {
  return unwrap(instance.get<DependencyEdge[]>("/dependencies/aggregated", { params: { size } }));
}

// ---- 健康状态（SkyWalking 饱和度派生指标）----

export interface ApmHealth {
  health: "HEALTHY" | "DEGRADED" | "SATURATED";
  qps: number;
  errorRate: number;
  activeLeaks: number;
  windowSeconds: number;
}

export function getHealth(): Promise<ApmHealth> {
  return unwrap(instance.get<ApmHealth>("/health"));
}

// ---- JVM 指标（/jvm/*）----

export interface JvmSnapshot {
  ts: number;
  memory: {
    heapUsed: number;
    heapMax: number;
    heapCommitted: number;
    heapUsedPercent: number;
    nonHeapUsed: number;
  };
  gc: {
    collectors: string[];
    gcCount: number;
    gcTimeMs: number;
  };
  cpu: {
    cpuCores: number;
    systemLoadAverage: number;
    loadPerCore: number;
    processCpuLoad: number;
  };
  threads: {
    totalThreads: number;
    peakThreads: number;
    daemonThreads: number;
    liveThreads: number;
  };
  network: Record<string, unknown>;
  process: Record<string, unknown>;
}

/** JVM 实时快照 */
export function getJvmSnapshot(): Promise<JvmSnapshot> {
  return unwrap(instance.get<JvmSnapshot>("/jvm/snapshot"));
}

export interface JvmMetricPoint {
  ts: number;
  heapUsed: number;
  heapPercent: number;
  gcCount: number;
  gcTimeMs: number;
  liveThreads: number;
}

/** JVM 指标时序（最近 N 分钟环形缓冲） */
export function getJvmMetrics(minutes = 30): Promise<JvmMetricPoint[]> {
  return unwrap(instance.get<JvmMetricPoint[]>("/jvm/metrics", { params: { minutes } }));
}

// ---- 系统拓扑（/system/topology）----

export interface SystemTopology {
  center: string;
  jvmPid: number;
  modules: { id: string; label: string; kind: string }[];
  ports: { port: number; label: string; protocol: string; software: string }[];
  connections: { iface: string; local: string; mac: string }[];
  nodes: { id: string; label: string; symbolSize: number }[];
  edges: { source: string; target: string }[];
}

/** 系统拓扑（真实运行值） */
export function getSystemTopology(): Promise<SystemTopology> {
  return unwrap(instance.get<SystemTopology>("/system/topology"));
}

// ---- Trace 瀑布（SkyWalking 风格）----

export interface WaterfallSpan {
  spanId: string;
  parentSpanId?: string;
  traceId?: string;
  source?: string;
  target?: string;
  protocol?: string;
  software?: string;
  operation?: string;
  className?: string;
  methodName?: string;
  status?: string;
  statusCode?: number;
  startTime: string;
  endTime?: string;
  durationMs: number;
  offsetMs: number;
  depth: number;
  percentWidth: number;
  spanKind: string;
  attributes?: Record<string, string>;
  bytesOut?: number;
  bytesIn?: number;
  errorType?: string;
  errorMessage?: string;
}

export interface TraceWaterfall {
  traceId: string;
  spans: WaterfallSpan[];
  totalMs: number;
  spanCount: number;
}

/** Trace 瀑布数据（横向时间轴） */
export function getTraceWaterfall(traceId: string): Promise<TraceWaterfall> {
  return unwrap(instance.get<TraceWaterfall>(`/trace/${encodeURIComponent(traceId)}/waterfall`));
}

// ---- 告警事件（/alerts）----

export interface ApmAlert {
  id: number;
  ts: number;
  metric: string;
  current: number;
  threshold: number;
  severity: "WARNING" | "CRITICAL";
  message: string;
  /** 状态机：OPEN / ACKNOWLEDGED / MUTED / IGNORED */
  status?: "OPEN" | "ACKNOWLEDGED" | "MUTED" | "IGNORED";
  statusTs?: number;
}

/** 告警规则 */
export interface AlertRule {
  id: number;
  metric: string;
  threshold: number;
  severity: "WARNING" | "CRITICAL";
  debounceMs: number;
  enabled: boolean;
}

/** 告警事件（新事件在前） */
export function getAlerts(limit = 100): Promise<ApmAlert[]> {
  return unwrap(instance.get<ApmAlert[]>("/alerts", { params: { limit } }));
}

/** 告警规则列表 */
export function getAlertRules(): Promise<AlertRule[]> {
  return unwrap(instance.get<AlertRule[]>("/alerts/rules"));
}

/** 新增告警规则 */
export function addAlertRule(params: {
  metric: string; threshold: number; severity?: string; debounceMs?: number; enabled?: boolean;
}): Promise<AlertRule> {
  return unwrap(instance.post<AlertRule>("/alerts/rules", null, { params }));
}

/** 启停告警规则 */
export function toggleAlertRule(metric: string, enabled: boolean): Promise<unknown> {
  return unwrap(instance.post<unknown>("/alerts/rules/toggle", null, { params: { metric, enabled } }));
}

/** 删除告警规则 */
export function deleteAlertRule(metric: string): Promise<unknown> {
  return unwrap(instance.delete(`/alerts/rules/${encodeURIComponent(metric)}`));
}

/** 确认告警 */
export function acknowledgeAlert(id: number): Promise<boolean> {
  return unwrap(instance.post<boolean>(`/alerts/${id}/acknowledge`));
}

/** 静默告警 */
export function muteAlert(id: number): Promise<boolean> {
  return unwrap(instance.post<boolean>(`/alerts/${id}/mute`));
}

/** 忽略告警 */
export function ignoreAlert(id: number): Promise<boolean> {
  return unwrap(instance.post<boolean>(`/alerts/${id}/ignore`));
}

// ---- 慢调用 / 错误排行 / SLA / 数据清理（2026 增强）----

/** 慢调用 Top N */
export interface SlowCall {
  traceId: string;
  spanId: string;
  source: string;
  target: string;
  protocol: string;
  operation: string;
  status: string;
  durationMs: number;
  startTime: string;
  errorType?: string;
  errorMessage?: string;
}

export function getSlowCalls(limit = 20): Promise<SlowCall[]> {
  return unwrap(instance.get<SlowCall[]>("/slow-calls", { params: { limit } }));
}

/** 慢 SQL 分析项 */
export interface SlowSqlItem extends SlowCall {
  sql?: string;
  db?: string;
}

export function getSlowSql(limit = 20, minDurationMs = 200): Promise<SlowSqlItem[]> {
  return unwrap(instance.get<SlowSqlItem[]>("/slow-sql", { params: { limit, minDurationMs } }));
}

/** 错误排行 */
export interface ErrorRanking {
  errorType: string;
  errorMessage: string;
  callCount: number;
  avgDurationMs: number;
  lastOccurrence: string;
}

export function getErrorRanking(limit = 20): Promise<ErrorRanking[]> {
  return unwrap(instance.get<ErrorRanking[]>("/error-ranking", { params: { limit } }));
}

/** SLA 统计 */
export interface SlaStats {
  totalCount: number;
  errorCount: number;
  successCount: number;
  slaPercent: number;
  uptimeMs: number;
  qps: number;
}

export function getSla(): Promise<SlaStats> {
  return unwrap(instance.get<SlaStats>("/sla"));
}

/** 数据清理（POST） */
export function cleanup(retentionMs = 86400000): Promise<Record<string, unknown>> {
  return unwrap(instance.post<Record<string, unknown>>("/cleanup", null, { params: { retentionMs } }));
}

// ---- 时序统计（2026 增强 R3）----

/** 调用量/错误率时序分桶点 */
export interface TrendPoint {
  bucketStart: number;
  callCount: number;
  errorCount: number;
  errorRatePercent: number;
  avgMs: number;
}
export function getTrend(minutes = 30, bucketSeconds = 60): Promise<TrendPoint[]> {
  return unwrap(instance.get<TrendPoint[]>("/trend", { params: { minutes, bucketSeconds } }));
}

/** 日志级别统计 */
export interface LogLevelStat {
  level: string;
  count: number;
  percent: number;
}
export function getLogStats(): Promise<LogLevelStat[]> {
  return unwrap(instance.get<LogLevelStat[]>("/log-stats"));
}

/** 端点×时间桶 扁平统计 */
export interface EndpointStatPoint {
  ts: number;
  endpoint: string;
  callCount: number;
  errorCount: number;
  avgMs: number;
}
export function getEndpointStats(service = "", minutes = 60, bucketSeconds = 60): Promise<EndpointStatPoint[]> {
  return unwrap(instance.get<EndpointStatPoint[]>("/endpoint-stats", { params: { service, minutes, bucketSeconds } }));
}

/** 协议统计 */
export interface ProtocolStat {
  protocol: string;
  callCount: number;
  errorCount: number;
  errorRatePercent: number;
  avgMs: number;
}
export function getProtocolStats(): Promise<ProtocolStat[]> {
  return unwrap(instance.get<ProtocolStat[]>("/protocol-stats"));
}

/** 线程池（按线程名分组） */
export interface ThreadStateSample { state: string; count: number; }
export interface ThreadPoolStat {
  name: string;
  count: number;
  daemonCount: number;
  knownPool: boolean;
  sampleStates: ThreadStateSample[];
}
export function getThreadPools(): Promise<ThreadPoolStat[]> {
  return unwrap(instance.get<ThreadPoolStat[]>("/thread-pools"));
}

/** 连接池近似（target endpoint 分组 + OS-FD 行） */
export interface ConnectionPoolStat {
  endpoint: string;
  callCount: number;
  avgMs: number;
  lastCallAt: string;
  activeLeakCount: number;
  openFileDescriptors?: number;
}
export function getConnectionPools(): Promise<ConnectionPoolStat[]> {
  return unwrap(instance.get<ConnectionPoolStat[]>("/connection-pools"));
}

// ---- 链路树节点（/agent/traces/tree 返回结构，与 ReTree 兼容）----

export interface TraceTreeItem {
  id: string;
  label: string;
  traceId?: string;
  spanCount?: number;
  totalMs?: number;
  spanId?: string;
  operation?: string;
  durationMs?: number;
  status?: string;
  startTime?: string;
  error?: boolean;
  children?: TraceTreeItem[];
}

// ---- 后端全量 CSV 导出（不受分页限制，直接触发浏览器下载）----

function downloadUrl(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.click();
}

export function exportTransmissionsCsv(params: TransmissionQuery = {}): void {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  downloadUrl(`/api/apm/export/transmissions?${qs.toString()}`);
}

export function exportLeaksCsv(params: LeakQuery = {}): void {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  downloadUrl(`/api/apm/export/leaks?${qs.toString()}`);
}

export function exportLogsCsv(params: LogQuery = {}): void {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  downloadUrl(`/api/apm/export/logs?${qs.toString()}`);
}

// ---- Agent 诊断（句柄清单 / System.out 捕获）----

export interface HandleInventorySnapshot {
  ts: number;
  trackedHandles: Array<{
    handleId: string;
    kind: string;
    name: string;
    ownerThread: string;
    createdAt: number;
    lastUsedAt: number;
    closed: boolean;
    stackTrace?: Array<{
      className: string;
      methodName: string;
      fileName: string | null;
      lineNumber: number;
    }>;
  }>;
  fileDescriptors: Array<{ fd: string; target: string }>;
  threads: Array<{ threadId: number; name: string; state: string; blockedTime: number; waitedTime: number }>;
  summary: Record<string, number>;
}

export interface SystemOutEntry {
  timestamp: string;
  source: "STDOUT" | "STDERR";
  level: string;
  line: string;
}

/** 全量句柄快照（含分配堆栈 / FD / 线程） */
export function getHandleInventory(limit = 200): Promise<HandleInventorySnapshot> {
  return unwrap(instance.get<HandleInventorySnapshot>("/agent/handles", { params: { limit } }));
}

/** System.out / System.err 实时捕获日志 */
export function getSystemOut(limit = 200): Promise<SystemOutEntry[]> {
  return unwrap(instance.get<SystemOutEntry[]>("/agent/system-out", { params: { limit } }));
}

// ---- JVM 内存诊断（对象内存 / 手动 GC / 类加载）----

export interface MemoryPoolInfo {
  name: string;
  type: "HEAP" | "NON_HEAP";
  used: number;
  committed: number;
  max: number;
  usedPercent: number;
  peakUsed?: number;
  objectEstimate: number;
}

export interface MemoryPoolsSnapshot {
  ts: number;
  heap: { name: string; used: number; committed: number; max: number; usedPercent: number };
  nonHeap: { name: string; used: number; committed: number; max: number; usedPercent: number };
  pools: MemoryPoolInfo[];
}

export interface GcResult {
  triggered: boolean;
  beforeBytes: number;
  afterBytes: number;
  freedBytes: number;
  freedMb: number;
  gcCountBefore: number;
  gcCountAfter: number;
  gcDelta: number;
  elapsedMs: number;
}

export interface ClassLoadingInfo {
  loadedClassCount: number;
  totalLoadedClassCount: number;
  unloadedClassCount: number;
  verbose: boolean;
  ts: number;
}

/** JVM 内存池对象明细 */
export function getMemoryPools(): Promise<MemoryPoolsSnapshot> {
  return unwrap(instance.get<MemoryPoolsSnapshot>("/jvm/memory/pools"));
}

/** 手动触发 GC 并返回释放量 */
export function triggerGc(): Promise<GcResult> {
  return unwrap(instance.post<GcResult>("/jvm/gc"));
}

/** 类加载统计 */
export function getClassLoading(): Promise<ClassLoadingInfo> {
  return unwrap(instance.get<ClassLoadingInfo>("/jvm/class-loading"));
}

export interface ThreadDumpInfo {
  threadId: number;
  name: string;
  state: string;
  blockedTime: number;
  blockedCount: number;
  waitedTime: number;
  waitedCount: number;
  lockName?: string | null;
  lockOwnerName?: string | null;
  isDaemon: boolean;
  isInNative: boolean;
  suspended: boolean;
  stackTrace: string[];
}

/** 全量线程 Dump 快照 */
export function getThreadDump(): Promise<ThreadDumpInfo[]> {
  return unwrap(instance.get<ThreadDumpInfo[]>("/jvm/thread-dump"));
}

export interface TraceHotspot {
  className: string;
  methodName: string;
  phase: string;
  count: number;
  totalMs: number;
  maxMs: number;
  errorCount: number;
  selfTimeMs: number;
  avgMs: number;
}

export interface TracePhaseStat {
  phase: string;
  count: number;
  totalMs: number;
  maxMs: number;
  selfTimeMs: number;
  avgMs: number;
}

export interface SkywalkingSpan {
  spanId: string;
  parentSpanId?: string | null;
  operationName: string;
  spanType: string;
  spanLayer: string;
  startTime: number;
  endTime: number;
  isError: boolean;
  logs?: string | null;
  peer?: string | null;
}

export interface SkywalkingSegment {
  traceId: string;
  spanCount: number;
  spans: SkywalkingSpan[];
}

/** 方法热点排行（按 Span 聚合耗时/错误） */
export function getTraceHotspots(limit = 20): Promise<TraceHotspot[]> {
  return unwrap(instance.get<TraceHotspot[]>("/agent/trace-hotspots", { params: { limit } }));
}

/** 链路阶段耗时汇总 */
export function getTracePhases(): Promise<TracePhaseStat[]> {
  return unwrap(instance.get<TracePhaseStat[]>("/agent/trace-phases"));
}

/** SkyWalking 兼容 Segment 导出 */
export function getSkywalkingExport(): Promise<SkywalkingSegment[]> {
  return unwrap(instance.get<SkywalkingSegment[]>("/agent/skywalking/export"));
}

export default {
  getStats,
  pageTransmissions,
  getDependencies,
  pageLeaks,
  pageLogs,
  getServices,
  getServiceDetail,
  getEndpoints,
  getHealth,
  getJvmSnapshot,
  getJvmMetrics,
  getSystemTopology,
  getTraceWaterfall,
  getAlerts,
  getHandleInventory,
  getSystemOut,
  getMemoryPools,
  triggerGc,
  getClassLoading,
  getThreadDump,
  getTraceHotspots,
  getTracePhases,
  getSkywalkingExport,
  getTracesTree,
  getAgentTraces,
  getAgentDependencies,
  getDependenciesAggregated,
  getSlowCalls,
  getSlowSql,
  getErrorRanking,
  getSla,
  cleanup,
  getTrend,
  getLogStats,
  getEndpointStats,
  getProtocolStats,
  getThreadPools,
  getConnectionPools,
  getAlertRules,
  addAlertRule,
  toggleAlertRule,
  acknowledgeAlert,
  muteAlert,
  ignoreAlert,
};

// ---- 数据注入（写操作：页面操作产生真实数据）----

export function injectTransmission(params: {
  source?: string; target?: string; protocol?: string; operation?: string; error?: boolean;
}): Promise<Record<string, unknown>> {
  return unwrap(instance.post<Record<string, unknown>>("/inject/transmission", null, { params }));
}

export function injectBatch(count: number): Promise<Record<string, unknown>> {
  return unwrap(instance.post<Record<string, unknown>>("/inject/batch", null, { params: { count } }));
}

export function injectLeak(resourceType?: string, resourceName?: string): Promise<Record<string, unknown>> {
  return unwrap(instance.post<Record<string, unknown>>("/inject/leak", null, { params: { resourceType, resourceName } }));
}

export function injectLog(level?: string, message?: string): Promise<Record<string, unknown>> {
  return unwrap(instance.post<Record<string, unknown>>("/inject/log", null, { params: { level, message } }));
}

/** 注入慢调用（指定耗时 ms，后端按慢调用阈值判断） */
export function injectSlowCall(
  params: { source?: string; target?: string; protocol?: string; durationMs?: number; error?: boolean },
): Promise<Record<string, unknown>> {
  return unwrap(instance.post<Record<string, unknown>>("/inject/slow", null, { params }));
}

/** 注入自定义 Span 树（一条 trace 多个 span，验证瀑布图） */
export function injectSpanTree(params: {
  traceId?: string;
  spans?: number;
  depth?: number;
  errorSpan?: boolean;
}): Promise<Record<string, unknown>> {
  return unwrap(instance.post<Record<string, unknown>>("/inject/span-tree", null, { params }));
}

/** 注入 JVM 压力（模拟线程 / CPU 压力，制造 JVM 指标变化） */
export function injectJvmPressure(params: { threads?: number; cpuPercent?: number; durationMs?: number }): Promise<Record<string, unknown>> {
  return unwrap(instance.post<Record<string, unknown>>("/inject/jvm-pressure", null, { params }));
}
