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
}

export interface LeakQuery {
  page?: number;
  size?: number;
  resourceType?: string;
  minAgeMs?: number;
  startTime?: number;
  endTime?: number;
}

export interface LogQuery {
  page?: number;
  size?: number;
  level?: string;
}

// ---- SSE 实时流（增强）----

/** 打开 /api/apm/stream，回调每次 stats 快照。返回 close() 终止。 */
export function watchStats(onSnapshot: (stats: ApmStats & { ts: number }) => void, onError?: (e: Event) => void): { close: () => void } {
  const es = new EventSource("/api/apm/stream?intervalMs=3000");
  es.addEventListener("stats", (ev: MessageEvent) => {
    try {
      const parsed = JSON.parse(ev.data as string);
      onSnapshot(parsed as ApmStats & { ts: number });
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

export default {
  getStats,
  pageTransmissions,
  getDependencies,
  pageLeaks,
  pageLogs,
};
