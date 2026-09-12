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
}

export interface LeakQuery {
  page?: number;
  size?: number;
  resourceType?: string;
  minAgeMs?: number;
}

export interface LogQuery {
  page?: number;
  size?: number;
  level?: string;
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
