import { http, type ReturnResult } from "@repo/utils";
import type { MonitorStats } from "../types";

/** 总览统计 */
export const fetchMonitorStats = () =>
  http.request<ReturnResult<MonitorStats>>("get", "/v2/datalake/monitor/stats");

/** 吞吐量趋势 */
export const fetchThroughput = () =>
  http.request<ReturnResult<Array<{ time: string; value: number }>>>(
    "get",
    "/v2/datalake/monitor/throughput"
  );

/** 错误率趋势 */
export const fetchErrors = () =>
  http.request<ReturnResult<Array<{ time: string; value: number }>>>(
    "get",
    "/v2/datalake/monitor/errors"
  );
