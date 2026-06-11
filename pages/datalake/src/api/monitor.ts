import type { ReturnResult } from "@repo/utils";
import { datalakeRequest } from "./request";
import type { MonitorStats } from "../types";

/** 总览统计 */
export const fetchMonitorStats = () =>
  datalakeRequest<ReturnResult<MonitorStats>>("get", "/v2/datalake/monitor/stats");

/** 吞吐量趋势 */
export const fetchThroughput = () =>
  datalakeRequest<ReturnResult<Array<{ time: string; value: number }>>>(
    "get",
    "/v2/datalake/monitor/throughput"
  );

/** 错误率趋势 */
export const fetchErrors = () =>
  datalakeRequest<ReturnResult<Array<{ time: string; value: number }>>>(
    "get",
    "/v2/datalake/monitor/errors"
  );
