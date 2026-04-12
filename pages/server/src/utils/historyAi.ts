export const buildMetricHistoryAiFilterKey = (
  serverId?: number | string | null,
  payload?: {
    metricKey?: string | null;
    minutes?: number | null;
    startTime?: number | null;
    endTime?: number | null;
    stateFilter?: string | null;
  },
) => {
  const normalizedMetric = String(payload?.metricKey || "")
    .trim()
    .toUpperCase();
  return [
    "metric",
    Number(serverId || 0),
    normalizedMetric || "UNKNOWN",
    Math.max(Number(payload?.minutes || 0), 0),
    Math.max(Number(payload?.startTime || 0), 0),
    Math.max(Number(payload?.endTime || 0), 0),
    String(payload?.stateFilter || "all").trim().toLowerCase() || "all",
  ].join(":");
};

export const buildAlertHistoryAiFilterKey = (
  serverId?: number | string | null,
  payload?: {
    metricType?: string | null;
    severity?: string | null;
    startTime?: number | null;
    endTime?: number | null;
    limit?: number | null;
  },
) =>
  [
    "alert",
    Number(serverId || 0),
    String(payload?.metricType || "ALL")
      .trim()
      .toUpperCase() || "ALL",
    String(payload?.severity || "ALL")
      .trim()
      .toUpperCase() || "ALL",
    Math.max(Number(payload?.startTime || 0), 0),
    Math.max(Number(payload?.endTime || 0), 0),
    Math.max(Number(payload?.limit || 0), 0),
  ].join(":");
