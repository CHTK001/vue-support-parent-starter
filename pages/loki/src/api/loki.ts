import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v2/loki/${id}`;

// ─── 连接管理 ──────────────────────────────────────────────────────────────

export const fetchLokiOpen = (
  host: string,
  port: number,
  username?: string,
  password?: string
) =>
  http.request<ReturnResult<string>>("post", "/v2/loki/open", {
    data: { host, port, username, password },
  });

export const fetchLokiClose = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

export const fetchLokiReady = (connectionId: string) =>
  http.request<ReturnResult<boolean>>("get", `${BASE(connectionId)}/ready`);

// ─── 标签查询 ──────────────────────────────────────────────────────────────

export const fetchLokiLabels = (
  connectionId: string,
  start?: string,
  end?: string
) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/labels`, {
    params: { start, end },
  });

export const fetchLokiLabelValues = (
  connectionId: string,
  label: string,
  start?: string,
  end?: string
) =>
  http.request<ReturnResult<string[]>>(
    "get",
    `${BASE(connectionId)}/labels/${label}/values`,
    { params: { start, end } }
  );

// ─── 日志查询 ──────────────────────────────────────────────────────────────

export interface LokiQueryResult {
  status: string;
  data: {
    resultType: string;
    result: LokiStream[];
  };
}

export interface LokiStream {
  stream: Record<string, string>;
  values: [string, string][]; // [timestamp_ns, log_line]
}

export const fetchLokiQuery = (
  connectionId: string,
  logql: string,
  limit?: number,
  time?: string,
  direction?: string
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/query`,
    { params: { logql, limit, time, direction } }
  );

export const fetchLokiQueryRange = (
  connectionId: string,
  logql: string,
  start: string,
  end: string,
  limit?: number,
  step?: string,
  direction?: string
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/query_range`,
    { params: { logql, start, end, limit, step, direction } }
  );

// ─── 流与统计 ──────────────────────────────────────────────────────────────

export const fetchLokiSeries = (
  connectionId: string,
  match: string,
  start?: string,
  end?: string
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/series`,
    { params: { match, start, end } }
  );

export const fetchLokiStats = (
  connectionId: string,
  query: string,
  start: string,
  end: string
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/stats`,
    { params: { query, start, end } }
  );
