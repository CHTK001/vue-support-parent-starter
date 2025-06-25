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
 * 代理服务器接口
 */
export interface MonitorProxy {
  proxyId: number;
  proxyName: string;
  proxyDesc?: string;
  proxyHost: string;
  proxyPort: number;
  proxyStatus: number;
  proxyType?: string;
  proxyCreateTime?: string;
  proxyUpdateTime?: string;
}

/**
 * 代理插件配置接口
 */
export interface MonitorProxyPluginConfig {
  proxyConfigId: number;
  proxyConfigName: string;
  proxyConfigValue?: string;
  proxyConfigDesc?: string;
  proxyId: number;
  proxyPluginId: number;
  proxyConfigCreateTime?: string;
  proxyConfigUpdateTime?: string;
}

/**
 * 代理插件接口
 */
export interface MonitorProxyPlugin {
  proxyPluginId: number;
  proxyPluginSpi: string;
  proxyId: number;
  proxyPluginCreateTime?: string;
  proxyPluginUpdateTime?: string;
}

/**
 * 代理日志接口
 */
export interface MonitorProxyLog {
  monitorProxyLogId: number;
  monitorProxyLogType: string;
  monitorProxyLogContent?: string;
  monitorProxyLogLevel?: string;
  monitorProxyLogCreateTime?: string;
  proxyId: number;
}

/**
 * 代理分页查询参数
 */
export interface ProxyPageParams {
  page?: number;
  pageSize?: number;
  proxyName?: string;
  proxyStatus?: number;
  proxyType?: string;
}

/**
 * 代理保存参数
 */
export interface ProxySaveParams {
  proxyId?: number;
  proxyName: string;
  proxyDesc?: string;
  proxyHost: string;
  proxyPort: number;
  proxyType?: string;
}

// ==================== API 函数 ====================

/**
 * 代理管理 API
 */

/**
 * 分页查询代理列表
 * @param params 查询参数
 * @returns 代理分页数据
 */
export function getProxyPageList(params: ProxyPageParams) {
  return http.request<ReturnResult<{ records: MonitorProxy[]; total: number }>>(
    "get",
    "v1/proxy/page",
    { params }
  );
}

/**
 * 获取代理详情
 * @param id 代理ID
 * @returns 代理详细信息
 */
export function getProxyDetail(id: number) {
  return http.request<ReturnResult<MonitorProxy>>(
    "get",
    "v1/proxy/get",
    { params: { id: id.toString() } }
  );
}

/**
 * 保存代理
 * @param data 代理数据
 * @returns 保存结果
 */
export function saveProxy(data: ProxySaveParams) {
  return http.request<ReturnResult<MonitorProxy>>(
    "post",
    "v1/proxy/save",
    { data }
  );
}

/**
 * 更新代理
 * @param data 代理数据
 * @returns 更新结果
 */
export function updateProxy(data: ProxySaveParams) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "v1/proxy/update",
    { data }
  );
}

/**
 * 删除代理
 * @param id 代理ID
 * @returns 删除结果
 */
export function deleteProxy(id: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/proxy/delete",
    { params: { id: id.toString() } }
  );
}

/**
 * 启动代理
 * @param id 代理ID
 * @returns 启动结果
 */
export function startProxy(id: number) {
  return http.request<ReturnResult<boolean>>(
    "get",
    "v1/proxy/start",
    { params: { id: id.toString() } }
  );
}

/**
 * 停止代理
 * @param id 代理ID
 * @returns 停止结果
 */
export function stopProxy(id: number) {
  return http.request<ReturnResult<boolean>>(
    "get",
    "v1/proxy/stop",
    { params: { id: id.toString() } }
  );
}

/**
 * 刷新代理配置
 * @param id 代理ID
 * @returns 刷新结果
 */
export function refreshProxy(id: number) {
  return http.request<ReturnResult<boolean>>(
    "get",
    "v1/proxy/refresh",
    { params: { id: id.toString() } }
  );
}

/**
 * 获取代理插件配置列表
 * @param proxyId 代理ID
 * @returns 插件配置列表
 */
export function getProxyPluginConfigs(proxyId: number) {
  return http.request<ReturnResult<MonitorProxyPluginConfig[]>>(
    "get",
    "v1/proxy/plugin/config/list",
    { params: { proxyId: proxyId.toString() } }
  );
}

/**
 * 保存代理插件配置
 * @param data 插件配置数据
 * @returns 保存结果
 */
export function saveProxyPluginConfig(data: Partial<MonitorProxyPluginConfig>) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/proxy/plugin/config/save",
    { data }
  );
}

/**
 * 获取代理日志
 * @param proxyId 代理ID
 * @param params 查询参数
 * @returns 日志列表
 */
export function getProxyLogs(proxyId: number, params?: { page?: number; pageSize?: number }) {
  return http.request<ReturnResult<{ records: MonitorProxyLog[]; total: number }>>(
    "get",
    "v1/proxy/log/page",
    { params: { proxyId: proxyId.toString(), ...params } }
  );
}

// ==================== 服务器代理相关 API ====================

/**
 * 获取服务器的 Guacamole 代理连接 URL
 * @param serverId 服务器ID
 * @returns 代理连接URL
 */
export function getGuacamoleProxyUrl(serverId: string) {
  return http.request<ReturnResult<string>>(
    "get",
    "v1/gen/server/proxy/guacamole",
    { params: { id: serverId } }
  );
}

/**
 * 测试服务器代理连接
 * @param serverId 服务器ID
 * @returns 测试结果
 */
export function testServerProxyConnection(serverId: string) {
  return http.request<ReturnResult<boolean>>(
    "get",
    "v1/gen/server/proxy/test",
    { params: { id: serverId } }
  );
}

/**
 * 获取服务器支持的数据上报方式
 * @param serverId 服务器ID
 * @returns 支持的上报方式列表
 */
export function getSupportedReportMethods(serverId: string) {
  return http.request<ReturnResult<string[]>>(
    "get",
    "v1/gen/server/report-methods",
    { params: { id: serverId } }
  );
}

/**
 * 根据配置查询服务器数据
 * @param serverId 服务器ID
 * @param queryType 查询类型 (prometheus/sql)
 * @param expression 查询表达式
 * @param timeRange 时间范围参数
 * @returns 查询结果
 */
export function queryServerDataByConfig(
  serverId: string,
  queryType: string,
  expression: string,
  timeRange?: Record<string, any>
) {
  return http.request<ReturnResult<any>>(
    "post",
    "v1/gen/server/query-data",
    {
      data: {
        id: serverId,
        queryType,
        expression,
        timeRange
      }
    }
  );
}

// ==================== 常量和枚举 ====================

/**
 * 代理状态枚举
 */
export const PROXY_STATUS = {
  STOPPED: 0,
  RUNNING: 1,
} as const;

export type ProxyStatus = typeof PROXY_STATUS[keyof typeof PROXY_STATUS];

/**
 * 代理类型枚举
 */
export const PROXY_TYPE = {
  HTTP: "HTTP",
  HTTPS: "HTTPS",
  SOCKS5: "SOCKS5",
  GUACAMOLE: "GUACAMOLE",
} as const;

export type ProxyType = typeof PROXY_TYPE[keyof typeof PROXY_TYPE];

/**
 * 日志级别枚举
 */
export const LOG_LEVEL = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;

export type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL];

/**
 * 日志类型枚举
 */
export const LOG_TYPE = {
  LIMIT: "LIMIT",
  WHITE: "WHITE",
  BLACK: "BLACK",
  ACCESS: "ACCESS",
  ERROR: "ERROR",
} as const;

export type LogType = typeof LOG_TYPE[keyof typeof LOG_TYPE];
