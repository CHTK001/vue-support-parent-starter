import { getApiHttp } from "@repo/core";
import type {
  ApiResult,
  PageResult,
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
export function getStats() {
  return getApiHttp()
    .get(`${BASE}/stats`)
    .then<ApiResult<ApmStats>>((r) => r.data);
}

// ============ 传输记录 ============
export function pageTransmissions(params: TransmissionQuery) {
  return getApiHttp()
    .get(`${BASE}/transmissions`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<TransmissionRecord>>>((r) => r.data);
}

// ============ 依赖图 ============
export function getDependencies() {
  return getApiHttp()
    .get(`${BASE}/dependencies`)
    .then<ApiResult<DependencyEdge[]>>((r) => r.data);
}

// ============ 泄露记录 ============
export function pageLeaks(params: LeakQuery) {
  return getApiHttp()
    .get(`${BASE}/leaks`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<LeakRecord>>>((r) => r.data);
}

// ============ 日志 ============
export function pageLogs(params: { page?: number; size?: number; level?: string }) {
  return getApiHttp()
    .get(`${BASE}/logs`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<LogRecord>>>((r) => r.data);
}

// ============ Agent 实时数据 ============
const AGENT_BASE = "/agent";

export function getAgentStatus() {
  return getApiHttp()
    .get(`${AGENT_BASE}/status`)
    .then<ApiResult<{ started: boolean; traceDepth: number; interceptCount: number }>>((r) => r.data);
}

export function getAgentTraces() {
  return getApiHttp()
    .get(`${AGENT_BASE}/traces`)
    .then<ApiResult<TraceSpan[]>>((r) => r.data);
}

export function getAgentDependencies() {
  return getApiHttp()
    .get(`${AGENT_BASE}/dependencies`)
    .then<ApiResult<DependencyEdge[]>>((r) => r.data);
}