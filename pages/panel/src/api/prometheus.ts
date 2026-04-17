import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v1/panel/prometheus/${id}`;

export interface PrometheusQueryResult {
  status: string;
  data: {
    resultType: string;
    result: PrometheusVector[] | PrometheusMatrix[];
  };
}

export interface PrometheusVector {
  metric: Record<string, string>;
  value: [number, string];
}

export interface PrometheusMatrix {
  metric: Record<string, string>;
  values: [number, string][];
}

export interface PrometheusTarget {
  discoveredLabels: Record<string, string>;
  labels: Record<string, string>;
  scrapePool: string;
  scrapeUrl: string;
  globalUrl: string;
  lastError: string;
  lastScrape: string;
  lastScrapeDuration: number;
  health: "up" | "down" | "unknown";
}

export interface PrometheusAlert {
  labels: Record<string, string>;
  annotations: Record<string, string>;
  state: string;
  activeAt: string;
  value: string;
}

export interface PrometheusRule {
  name: string;
  query: string;
  duration?: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  alerts?: PrometheusAlert[];
  health: string;
  type: "alerting" | "recording";
}

export interface PrometheusRuleGroup {
  name: string;
  file: string;
  rules: PrometheusRule[];
  interval: number;
}

export const openPrometheusConnection = (
  host: string,
  port: number,
  username?: string,
  password?: string
) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/prometheus/open", {
    data: { host, port, username, password },
  });

export const closePrometheusConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

export const queryPrometheus = (
  connectionId: string,
  promql: string,
  time?: string
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/query`,
    { params: { promql, time } }
  );

export const queryRangePrometheus = (
  connectionId: string,
  promql: string,
  start: string,
  end: string,
  step = "60"
) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/query_range`,
    { params: { promql, start, end, step } }
  );

export const listPrometheusMetrics = (connectionId: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/metrics`);

export const listPrometheusLabels = (connectionId: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/labels`);

export const listPrometheusTargets = (connectionId: string) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/targets`
  );

export const fetchPrometheusAlerts = (connectionId: string) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/alerts`
  );

export const fetchPrometheusRules = (connectionId: string) =>
  http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    `${BASE(connectionId)}/rules`
  );
