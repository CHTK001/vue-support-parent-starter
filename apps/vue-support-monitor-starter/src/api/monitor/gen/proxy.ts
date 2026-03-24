import { http, type ReturnResult } from "@repo/utils";
import type { ServerInfo } from "../../server/index";

/**
 * 服务器代理类型（别名）
 */
export type MonitorSysGenServer = ServerInfo;

/**
 * 获取Guacamole代理连接URL
 * @param id 服务器ID
 * @returns 代理连接URL
 */
export function getGuacamoleProxyUrl(id: string) {
  return http.request<ReturnResult<string>>("get", "v1/gen/server/proxy/guacamole", { params: { id } });
}

/**
 * 测试服务器代理连接
 * @param id 服务器ID
 * @returns 测试结果
 */
export function testServerProxyConnection(id: string) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server/proxy/test", { params: { id } });
}

