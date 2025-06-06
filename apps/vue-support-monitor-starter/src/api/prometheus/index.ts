import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取prometheus系统信息
 */
export const fetchPrometheusQueryRange = (data: PrometheusQueryRequest) => {
  return http.request<ReturnResult<any>>("post", "/v2/prometheus/queryRange", { data: data });
};

/**
 * 获取prometheus系统信息
 */
export const fetchPrometheusQueryRangeGen = (data: PrometheusGenQueryRequest) => {
  return http.request<ReturnResult<any>>("post", "/v2/prometheus/queryRangeGen", { data: data });
};

/**
 * prometheus查询请求
 */
export interface PrometheusQueryRequest {
  prometheusAddress: string;
  promQL: string;
  start: number;
  end: number;
  step: number;
}

/**
 * prometheus查询请求
 */
export interface PrometheusGenQueryRequest {
  monitorSysGenId: number;
  promQL: string;
  start: number;
  end: number;
  step: number;
}
