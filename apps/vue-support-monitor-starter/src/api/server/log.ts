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
 * 服务器日志接口
 */
export interface ServerLog {
  monitorSysGenServerLogId?: number;
  monitorSysGenServerId?: number;
  monitorSysGenServerLogLevel?: string;
  monitorSysGenServerLogSource?: string;
  monitorSysGenServerLogCategory?: string;
  monitorSysGenServerLogContent?: string;
  monitorSysGenServerLogCreateTime?: string;
  monitorSysGenServerLogServerTime?: string;
  monitorSysGenServerLogThread?: string;
  monitorSysGenServerLogLogger?: string;
  monitorSysGenServerLogFilePath?: string;
  monitorSysGenServerLogLineNumber?: number;
  monitorSysGenServerLogIp?: string;
  monitorSysGenServerLogHostname?: string;
  monitorSysGenServerLogProcessId?: string;
  monitorSysGenServerLogExceptionStack?: string;
  monitorSysGenServerLogExtraData?: string;
  monitorSysGenServerLogTags?: string;
  monitorSysGenServerLogStatus?: number;
}

/**
 * 服务器日志配置接口
 */
export interface ServerLogConfig {
  monitorSysGenServerLogConfigId: number;
  monitorSysGenServerId: number;
  monitorSysGenServerLogEnabled: number;
  monitorSysGenServerLogLevel: string;
  monitorSysGenServerLogRetentionDays: number;
  monitorSysGenServerLogRealTimeEnabled: number;
  monitorSysGenServerLogCollectionInterval: number;
  monitorSysGenServerLogCreateTime: string;
  monitorSysGenServerLogUpdateTime: string;
}

/**
 * 服务器日志分页查询参数
 */
export interface ServerLogPageParams {
  page?: number;
  pageSize?: number;
  serverId?: number;
  level?: string;
  source?: string;
  keyword?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * 服务器日志配置保存参数
 */
export interface ServerLogConfigSaveParams {
  monitorSysGenServerLogConfigId?: number;
  monitorSysGenServerId: number;
  monitorSysGenServerLogEnabled?: number;
  monitorSysGenServerLogLevel?: string;
  monitorSysGenServerLogRetentionDays?: number;
  monitorSysGenServerLogRealTimeEnabled?: number;
  monitorSysGenServerLogCollectionInterval?: number;
}

// ==================== API 函数 ====================

/**
 * 服务器日志管理 API
 */

/**
 * 分页查询服务器日志列表
 * @param params 查询参数
 * @returns 日志分页数据
 */
export function getServerLogPage(params: ServerLogPageParams) {
  return http.request<ReturnResult<{ records: ServerLog[]; total: number }>>("get", "v1/gen/server-log/page", { params });
}

/**
 * 获取服务器日志详情
 * @param id 日志ID
 * @returns 日志详细信息
 */
export function getServerLogDetail(id: number) {
  return http.request<ReturnResult<ServerLog>>("get", "v1/gen/server-log/page", { params: { monitorSysGenServerLogId: id } });
}

/**
 * 删除服务器日志
 * @param id 日志ID
 * @returns 删除结果
 */
export function deleteServerLog(id: number) {
  return http.request<ReturnResult<boolean>>("delete", "v1/gen/server-log/delete", { params: { id: id.toString() } });
}

/**
 * 批量删除服务器日志
 * @param ids 日志ID列表
 * @returns 删除结果
 */
export function batchDeleteServerLogs(ids: number[]) {
  return http.request<ReturnResult<boolean>>("delete", "v1/gen/server-log/delete", { params: { id: ids.join(",") } });
}

/**
 * 根据服务器ID获取日志
 * @param serverId 服务器ID
 * @param params 查询参数
 * @returns 日志列表
 */
export function getServerLogsByServerId(serverId: number, params?: Omit<ServerLogPageParams, "monitorSysGenServerId">) {
  return http.request<ReturnResult<{ records: ServerLog[]; total: number }>>("get", "v1/gen/server-log/page", { params: { ...params, monitorSysGenServerId: serverId } });
}

/**
 * 根据日志级别获取日志
 * @param level 日志级别
 * @param params 查询参数
 * @returns 日志列表
 */
export function getServerLogsByLevel(level: string, params?: Omit<ServerLogPageParams, "monitorSysGenServerLogLevel">) {
  return http.request<ReturnResult<{ records: ServerLog[]; total: number }>>("get", "v1/gen/server-log/page", { params: { ...params, monitorSysGenServerLogLevel: level } });
}

/**
 * 搜索服务器日志
 * @param keyword 关键词
 * @param params 查询参数
 * @returns 日志列表
 */
export function searchServerLogs(keyword: string, params?: ServerLogPageParams) {
  return http.request<ReturnResult<{ records: ServerLog[]; total: number }>>("get", "v1/gen/server-log/search", { params: { ...params, keyword } });
}

/**
 * 获取服务器日志统计信息
 * @param serverId 服务器ID（可选）
 * @returns 统计数据
 */
export function getServerLogStatistics(serverId?: number) {
  return http.request<ReturnResult<any>>("get", "v1/gen/server-log/statistics", { params: serverId ? { serverId } : undefined });
}

/**
 * 导出服务器日志
 * @param params 导出参数
 * @returns 文件数据
 */
export function exportServerLogs(params: ServerLogPageParams) {
  return http.request<Blob>("get", "v1/gen/server-log/export", {
    params,
    responseType: "blob"
  });
}

/**
 * 清理服务器日志
 * @param serverId 服务器ID
 * @param beforeDate 清理此日期之前的日志
 * @returns 清理结果
 */
export function cleanupServerLogs(serverId: number, beforeDate?: string) {
  return http.request<ReturnResult<number>>("delete", "v1/gen/server-log/cleanup", { params: { serverId, beforeDate } });
}

// ==================== 日志配置 API ====================

/**
 * 获取服务器日志配置
 * @param serverId 服务器ID
 * @returns 日志配置
 */
export function getServerLogConfig(serverId: number) {
  return http.request<ReturnResult<ServerLogConfig>>("get", "v1/gen/server-log-config/page", { params: { monitorSysGenServerId: serverId } });
}

/**
 * 保存服务器日志配置
 * @param data 配置数据
 * @returns 保存结果
 */
export function saveServerLogConfig(data: ServerLogConfigSaveParams) {
  return http.request<ReturnResult<ServerLogConfig>>("post", "v1/gen/server-log-config/save", { data });
}

/**
 * 更新服务器日志配置
 * @param data 配置数据
 * @returns 更新结果
 */
export function updateServerLogConfig(data: ServerLogConfigSaveParams) {
  return http.request<ReturnResult<boolean>>("put", "v1/gen/server-log-config/update", { data });
}

/**
 * 删除服务器日志配置
 * @param id 配置ID
 * @returns 删除结果
 */
export function deleteServerLogConfig(id: number) {
  return http.request<ReturnResult<boolean>>("delete", "v1/gen/server-log-config/delete", { params: { id: id.toString() } });
}

/**
 * 启用/禁用日志收集
 * @param serverId 服务器ID
 * @param enabled 是否启用
 * @returns 操作结果
 */
export function toggleLogCollection(serverId: number, enabled: boolean) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server-log-config/toggle", { params: { serverId, enabled: enabled ? 1 : 0 } });
}

/**
 * 启用/禁用实时日志
 * @param serverId 服务器ID
 * @param enabled 是否启用
 * @returns 操作结果
 */
export function toggleRealTimeLog(serverId: number, enabled: boolean) {
  return http.request<ReturnResult<boolean>>("post", "v1/gen/server-log-config/toggle-realtime", { params: { serverId, enabled: enabled ? 1 : 0 } });
}

// ==================== 常量和枚举 ====================

/**
 * 日志级别枚举
 */
export const LOG_LEVEL = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  FATAL: "FATAL"
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

/**
 * 日志级别映射
 */
export const logLevelMap: Record<LogLevel, { color: string; text: string }> = {
  [LOG_LEVEL.DEBUG]: { color: "info", text: "调试" },
  [LOG_LEVEL.INFO]: { color: "primary", text: "信息" },
  [LOG_LEVEL.WARN]: { color: "warning", text: "警告" },
  [LOG_LEVEL.ERROR]: { color: "danger", text: "错误" },
  [LOG_LEVEL.FATAL]: { color: "danger", text: "致命" }
};

/**
 * 获取日志级别颜色
 * @param level 日志级别
 * @returns 颜色类型
 */
export function getLogLevelColor(level: LogLevel): string {
  return logLevelMap[level]?.color || "info";
}

/**
 * 获取日志级别文本
 * @param level 日志级别
 * @returns 级别文本
 */
export function getLogLevelText(level: LogLevel): string {
  return logLevelMap[level]?.text || level;
}

/**
 * 日志来源枚举
 */
export const LOG_SOURCE = {
  SYSTEM: "SYSTEM",
  APPLICATION: "APPLICATION",
  SECURITY: "SECURITY",
  ACCESS: "ACCESS"
} as const;

export type LogSource = (typeof LOG_SOURCE)[keyof typeof LOG_SOURCE];

/**
 * 日志来源映射
 */
export const logSourceMap: Record<LogSource, { color: string; text: string }> = {
  [LOG_SOURCE.SYSTEM]: { color: "primary", text: "系统" },
  [LOG_SOURCE.APPLICATION]: { color: "success", text: "应用" },
  [LOG_SOURCE.SECURITY]: { color: "warning", text: "安全" },
  [LOG_SOURCE.ACCESS]: { color: "info", text: "访问" }
};

/**
 * 获取日志来源颜色
 * @param source 日志来源
 * @returns 颜色类型
 */
export function getLogSourceColor(source: LogSource): string {
  return logSourceMap[source]?.color || "info";
}

/**
 * 获取日志来源文本
 * @param source 日志来源
 * @returns 来源文本
 */
export function getLogSourceText(source: LogSource): string {
  return logSourceMap[source]?.text || source;
}
