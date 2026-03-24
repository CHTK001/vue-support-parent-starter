///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { http, type ReturnResult } from "@repo/utils";

// ==================== 类型定义 ====================

/**
 * 服务器连接状态接口
 */
export interface ServerConnectionStatus {
  monitorSysGenServerConnectionStatusId: number;
  monitorSysGenServerId: number;
  monitorSysGenServerConnectionStatus: number;
  monitorSysGenServerConnectionTestTime: string;
  monitorSysGenServerConnectionResponseTime?: number;
  monitorSysGenServerConnectionError?: string;
  monitorSysGenServerConnectionRetryCount: number;
  monitorSysGenServerConnectionLastSuccessTime?: string;
  monitorSysGenServerConnectionLastFailureTime?: string;
  monitorSysGenServerConnectionCreateTime: string;
  monitorSysGenServerConnectionUpdateTime: string;
}

/**
 * 连接测试结果接口
 */
export interface ConnectionTestResult {
  success: boolean;
  responseTime?: number;
  errorMessage?: string;
  timestamp: string;
}

/**
 * 连接状态统计接口
 */
export interface ConnectionStatusStatistics {
  totalServers: number;
  connectedServers: number;
  disconnectedServers: number;
  connectingServers: number;
  errorServers: number;
  averageResponseTime: number;
  connectionSuccessRate: number;
}

/**
 * 连接健康度报告接口
 */
export interface ConnectionHealthReport {
  serverId: number;
  serverName: string;
  connectionStatus: number;
  lastTestTime: string;
  responseTime?: number;
  uptime: number;
  downtime: number;
  successRate: number;
  recentErrors: string[];
}

/**
 * 服务器连接状态分页查询参数
 */
export interface ServerConnectionStatusPageParams {
  page?: number;
  pageSize?: number;
  monitorSysGenServerId?: number;
  monitorSysGenServerConnectionStatus?: number;
  startTime?: string;
  endTime?: string;
}

// ==================== API 函数 ====================

/**
 * 服务器连接状态管理 API
 */

/**
 * 测试单个服务器连接
 * @param serverId 服务器ID
 * @returns 连接测试结果
 */
export function testServerConnection(serverId: number) {
  return http.request<ReturnResult<ServerConnectionStatus>>(
    "post",
    `v1/server/connection/test/${serverId}`
  );
}

/**
 * 批量测试服务器连接
 * @param serverIds 服务器ID列表
 * @returns 批量连接测试结果
 */
export function batchTestServerConnection(serverIds: number[]) {
  return http.request<ReturnResult<ServerConnectionStatus[]>>(
    "post",
    "v1/server/connection/batch-test",
    { data: serverIds }
  );
}

/**
 * 获取所有服务器连接状态
 * @returns 所有服务器连接状态
 */
export function getAllServerConnectionStatus() {
  return http.request<ReturnResult<ServerConnectionStatus[]>>(
    "get",
    "v1/server/connection/status/all"
  );
}

/**
 * 获取单个服务器连接状态
 * @param serverId 服务器ID
 * @returns 服务器连接状态
 */
export function getServerConnectionStatus(serverId: number) {
  return http.request<ReturnResult<ServerConnectionStatus>>(
    "get",
    `v1/server/connection/status/${serverId}`
  );
}

/**
 * 分页查询服务器连接状态历史
 * @param params 查询参数
 * @returns 连接状态历史分页数据
 */
export function getServerConnectionStatusHistory(params: ServerConnectionStatusPageParams) {
  return http.request<ReturnResult<{ records: ServerConnectionStatus[]; total: number }>>(
    "get",
    "v1/server/connection/history",
    { params }
  );
}

/**
 * 获取连接状态统计
 * @returns 连接状态统计
 */
export function getConnectionStatusStatistics() {
  return http.request<ReturnResult<ConnectionStatusStatistics>>(
    "get",
    "v1/server/connection/statistics"
  );
}

/**
 * 获取长时间未连接的服务器
 * @param minutes 分钟数，默认60分钟
 * @returns 长时间未连接的服务器列表
 */
export function getLongTimeNoConnectServers(minutes: number = 60) {
  return http.request<ReturnResult<ServerConnectionStatus[]>>(
    "get",
    "v1/server/connection/long-time-no-connect",
    { params: { minutes } }
  );
}

/**
 * 检查所有服务器连接状态
 * @returns 检查结果
 */
export function checkAllServerConnections() {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/server/connection/check-all"
  );
}

/**
 * 获取服务器连接健康度报告
 * @returns 健康度报告
 */
export function getServerConnectionHealthReport() {
  return http.request<ReturnResult<ConnectionHealthReport[]>>(
    "get",
    "v1/server/connection/health-report"
  );
}

/**
 * 重置服务器连接状态
 * @param serverId 服务器ID
 * @returns 重置结果
 */
export function resetServerConnectionStatus(serverId: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/server/connection/reset/${serverId}`
  );
}

/**
 * 批量重置服务器连接状态
 * @param serverIds 服务器ID列表
 * @returns 批量重置结果
 */
export function batchResetServerConnectionStatus(serverIds: number[]) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/server/connection/batch-reset",
    { data: serverIds }
  );
}

/**
 * 获取服务器连接趋势数据
 * @param serverId 服务器ID
 * @param hours 小时数，默认24小时
 * @returns 连接趋势数据
 */
export function getServerConnectionTrend(serverId: number, hours: number = 24) {
  return http.request<ReturnResult<any[]>>(
    "get",
    `v1/server/connection/trend/${serverId}`,
    { params: { hours } }
  );
}

/**
 * 获取连接状态实时数据
 * @returns 实时连接状态数据
 */
export function getRealTimeConnectionStatus() {
  return http.request<ReturnResult<any>>(
    "get",
    "v1/server/connection/realtime"
  );
}

/**
 * 设置连接状态监控配置
 * @param serverId 服务器ID
 * @param config 监控配置
 * @returns 设置结果
 */
export function setConnectionMonitorConfig(serverId: number, config: any) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/server/connection/monitor-config/${serverId}`,
    { data: config }
  );
}

/**
 * 获取连接状态监控配置
 * @param serverId 服务器ID
 * @returns 监控配置
 */
export function getConnectionMonitorConfig(serverId: number) {
  return http.request<ReturnResult<any>>(
    "get",
    `v1/server/connection/monitor-config/${serverId}`
  );
}

/**
 * 启用/禁用连接状态监控
 * @param serverId 服务器ID
 * @param enabled 是否启用
 * @returns 操作结果
 */
export function toggleConnectionMonitor(serverId: number, enabled: boolean) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/server/connection/toggle-monitor/${serverId}`,
    { params: { enabled } }
  );
}

/**
 * 获取连接失败原因统计
 * @param days 天数，默认7天
 * @returns 失败原因统计
 */
export function getConnectionFailureReasons(days: number = 7) {
  return http.request<ReturnResult<any[]>>(
    "get",
    "v1/server/connection/failure-reasons",
    { params: { days } }
  );
}

/**
 * 导出连接状态报告
 * @param params 导出参数
 * @returns 文件数据
 */
export function exportConnectionStatusReport(params: any) {
  return http.request<ReturnResult<string>>(
    "post",
    "v1/server/connection/export-report",
    { data: params }
  );
}

// ==================== 常量和枚举 ====================

/**
 * 连接状态枚举
 */
export const CONNECTION_STATUS = {
  DISCONNECTED: 0,  // 离线
  CONNECTED: 1,     // 在线
  CONNECTING: 2,    // 连接中
  ERROR: 3,         // 连接失败
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

/**
 * 连接状态映射
 */
export const connectionStatusMap: Record<ConnectionStatus, { color: string; text: string; icon: string }> = {
  [CONNECTION_STATUS.DISCONNECTED]: { color: "danger", text: "离线", icon: "offline" },
  [CONNECTION_STATUS.CONNECTED]: { color: "success", text: "在线", icon: "online" },
  [CONNECTION_STATUS.CONNECTING]: { color: "warning", text: "连接中", icon: "loading" },
  [CONNECTION_STATUS.ERROR]: { color: "danger", text: "连接失败", icon: "error" },
};

/**
 * 获取连接状态颜色
 * @param status 连接状态
 * @returns 颜色类型
 */
export function getConnectionStatusColor(status: ConnectionStatus): string {
  return connectionStatusMap[status]?.color || 'info';
}

/**
 * 获取连接状态文本
 * @param status 连接状态
 * @returns 状态文本
 */
export function getConnectionStatusText(status: ConnectionStatus): string {
  return connectionStatusMap[status]?.text || '未知';
}

/**
 * 获取连接状态图标
 * @param status 连接状态
 * @returns 图标名称
 */
export function getConnectionStatusIcon(status: ConnectionStatus): string {
  return connectionStatusMap[status]?.icon || 'question';
}

/**
 * 判断连接状态是否正常
 * @param status 连接状态
 * @returns 是否正常
 */
export function isConnectionStatusNormal(status: ConnectionStatus): boolean {
  return status === CONNECTION_STATUS.CONNECTED;
}

/**
 * 判断连接状态是否异常
 * @param status 连接状态
 * @returns 是否异常
 */
export function isConnectionStatusError(status: ConnectionStatus): boolean {
  return status === CONNECTION_STATUS.ERROR || status === CONNECTION_STATUS.DISCONNECTED;
}
