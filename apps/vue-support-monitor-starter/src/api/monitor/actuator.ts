import { http, type ReturnResult } from "@repo/utils";

/**
 * 日志等级设置请求参数
 */
export interface LogLevelRequest {
  /** 客户端ID（可选，优先使用） */
  clientId?: string;
  /** 节点IP地址（与clientId二选一） */
  ipAddress?: string;
  /** 节点端口 */
  port?: number;
  /** 日志器名称，如 com.chua.xxx 或 ROOT */
  loggerName: string;
  /** 日志级别: TRACE, DEBUG, INFO, WARN, ERROR, OFF */
  logLevel: string;
}

/**
 * 调用actuator接口
 *
 * @param params 请求参数
 * @returns 响应结果
 */
export const fetchActuatorCall = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/actuator/call", { data: params });
};

/**
 * 设置节点日志等级（通过 SyncServer 下发）
 *
 * @param params 日志等级设置请求参数
 * @returns 设置结果
 */
export const setNodeLogLevel = (params: LogLevelRequest) => {
  return http.request<ReturnResult<boolean>>("post", "/v1/actuator/log-level", { data: params });
};
