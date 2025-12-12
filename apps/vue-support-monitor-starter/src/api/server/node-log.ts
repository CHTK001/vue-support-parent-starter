import { http, type ReturnResult } from "@repo/utils";

/**
 * 日志条目
 */
export interface LogEntry {
  applicationName: string;
  port: number;
  timestamp: number;
  time: string;
  level: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";
  loggerName: string;
  threadName: string;
  message: string;
  exception?: string;
  exceptionClass?: string;
}

/**
 * 订阅节点日志
 */
export function subscribeLogForNode(
  ipAddress: string,
  port: number,
  level: string = "INFO"
) {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "post",
    "/v1/node/log/subscribe",
    { params: { ipAddress, port, level } }
  );
}

/**
 * 取消订阅节点日志
 */
export function unsubscribeLogForNode(ipAddress: string, port: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "/v1/node/log/unsubscribe",
    { params: { ipAddress, port } }
  );
}
