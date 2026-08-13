import { getApiHttp } from "@repo/core";
import type {
  ApmStats,
  TransmissionRecord,
  DependencyEdge,
  LeakRecord,
  LogRecord,
  TraceSpan,
  TransmissionQuery,
  LeakQuery,
} from "./types";

const BASE = "/api/apm";

// ============ 统计 ============
/** 后端返回裸数据：ApmStats 直接挂在 r.data 上 */
export function getStats() {
  return getApiHttp()
    .get(`${BASE}/stats`)
    .then<ApmStats>((r) => r.data as ApmStats);
}

// ============ 传输记录 ============
export function pageTransmissions(params: TransmissionQuery) {
  return getApiHttp()
    .get(`${BASE}/transmissions`)
    .query(params as Record<string, unknown>)
    .then<{ total: number; offset: number; limit: number; items: TransmissionRecord[] }>((r) => r.data as any);
}

// ============ 依赖图 ============
export function getDependencies() {
  return getApiHttp()
    .get(`${BASE}/dependencies`)
    .then<{ total: number; items: DependencyEdge[] }>((r) => r.data as any);
}

// ============ 泄露记录 ============
export function pageLeaks(params: LeakQuery) {
  return getApiHttp()
    .get(`${BASE}/leaks`)
    .query(params as Record<string, unknown>)
    .then<{ total: number; items: LeakRecord[] }>((r) => r.data as any);
}

// ============ 日志 ============
export function pageLogs(params: { page?: number; size?: number; level?: string }) {
  return getApiHttp()
    .get(`${BASE}/logs`)
    .query(params as Record<string, unknown>)
    .then<{ total: number; items: LogRecord[] }>((r) => r.data as any);
}

// ============ Agent 实时数据 ============
const AGENT_BASE = "/agent";

export function getAgentStatus() {
  return getApiHttp()
    .get(`${AGENT_BASE}/status`)
    .then<{ started: boolean; traceDepth: number; interceptCount: number; currentSpanId?: string; currentTraceId?: string }>((r) => r.data as any);
}

export function getAgentTraces() {
  return getApiHttp()
    .get(`${AGENT_BASE}/traces`)
    .then<TraceSpan[]>((r) => (r.data as any) ?? []);
}

export function getAgentDependencies() {
  return getApiHttp()
    .get(`${AGENT_BASE}/dependencies`)
    .then<DependencyEdge[]>((r) => (r.data as any) ?? []);
}
