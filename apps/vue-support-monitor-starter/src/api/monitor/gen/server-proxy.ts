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
 * 服务器代理接口（对应后端 MonitorSysGenServerProxy 实体）
 */
export interface ServerProxy {
  monitorSysGenServerProxyId?: number;                    // 代理ID
  monitorSysGenServerProxyType?: string;                  // 代理类型 (HTTP, SOCKS4, SOCKS5, GUACAMOLE)
  monitorSysGenServerProxyHost?: string;                  // 代理主机地址
  monitorSysGenServerProxyPort?: number;                  // 代理端口
  monitorSysGenServerProxyEnabled?: number;               // 是否启用 (0-否, 1-是)
  monitorSysGenServerProxyStatus?: number;                // 代理状态 (0-离线, 1-在线, 2-连接中, 3-连接失败)
  monitorSysGenServerProxyLastConnectTime?: string;       // 最后连接时间
  monitorSysGenServerProxyConnectionError?: string;       // 连接失败原因
  monitorSysGenServerProxyRemark?: string;                // 备注
  // 继承自SysBase的字段
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
}

/**
 * 服务器代理分页查询参数
 */
export interface ServerProxyPageParams {
  page?: number;
  pageSize?: number;
  monitorSysGenServerProxyName?: string;                  // 代理名称
  monitorSysGenServerProxyType?: string;                  // 代理类型
  monitorSysGenServerProxyStatus?: number;                // 代理状态
  monitorSysGenServerProxyTags?: string;                  // 代理标签
}

/**
 * 服务器代理保存参数
 */
export interface ServerProxySaveParams {
  monitorSysGenServerProxyId?: number;                    // 代理ID
  monitorSysGenServerProxyName: string;                   // 代理名称（必填）
  monitorSysGenServerProxyType: string;                   // 代理类型（必填）
  monitorSysGenServerProxyHost: string;                   // 代理主机地址（必填）
  monitorSysGenServerProxyPort: number;                   // 代理端口（必填）
  monitorSysGenServerProxyUsername?: string;              // 代理用户名
  monitorSysGenServerProxyPassword?: string;              // 代理密码
  monitorSysGenServerProxyStatus?: number;                // 代理状态
  monitorSysGenServerProxyDescription?: string;           // 代理描述
  monitorSysGenServerProxyTimeout?: number;               // 连接超时时间
  monitorSysGenServerProxyAuthRequired?: number;          // 是否需要认证
  monitorSysGenServerProxyTags?: string;                  // 代理标签
}

/**
 * 代理连接测试结果
 */
export interface ProxyTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  errorDetails?: string;
}

/**
 * 批量更新状态请求
 */
export interface BatchUpdateStatusRequest {
  ids: number[];
  status: number;
}

/**
 * 克隆配置请求
 */
export interface CloneConfigRequest {
  sourceServerId: number;
  targetServerId: number;
}

// ==================== API 函数 ====================

/**
 * 服务器代理管理 API
 */

/**
 * 分页查询服务器代理列表
 * @param params 查询参数
 * @returns 服务器代理分页数据
 */
export function getServerProxyPageList(params: ServerProxyPageParams) {
  return http.request<ReturnResult<{ records: ServerProxy[]; total: number }>>(
    "get",
    "v1/gen/server/proxy/page",
    { params }
  );
}

/**
 * 根据服务器ID查询代理关联列表
 * @param serverId 服务器ID
 * @returns 代理关联列表
 */
export function getServerProxyByServerId(serverId: number) {
  return http.request<ReturnResult<ServerProxy[]>>(
    "get",
    `v1/gen/server/proxy/server/${serverId}`
  );
}

/**
 * 根据代理ID查询服务器关联列表
 * @param proxyId 代理ID
 * @returns 服务器关联列表
 */
export function getServerProxyByProxyId(proxyId: number) {
  return http.request<ReturnResult<ServerProxy[]>>(
    "get",
    `v1/gen/server/proxy/proxy/${proxyId}`
  );
}

/**
 * 根据服务器ID和代理类型查询代理关联
 * @param serverId 服务器ID
 * @param proxyType 代理类型
 * @returns 代理关联
 */
export function getServerProxyByServerIdAndType(serverId: number, proxyType: string) {
  return http.request<ReturnResult<ServerProxy>>(
    "get",
    `v1/gen/server/proxy/server/${serverId}/type/${proxyType}`
  );
}

/**
 * 保存服务器代理
 * @param data 代理数据
 * @returns 保存结果
 */
export function saveProxy(data: ServerProxySaveParams) {
  return http.request<ReturnResult<ServerProxy>>(
    "post",
    "v1/gen/server/proxy/save",
    { data }
  );
}

/**
 * 更新服务器代理
 * @param data 代理数据
 * @returns 更新结果
 */
export function updateProxy(data: ServerProxySaveParams) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "v1/gen/server/proxy/update",
    { data }
  );
}

/**
 * 删除服务器代理
 * @param id 代理ID
 * @returns 删除结果
 */
export function deleteServerProxy(id: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `v1/gen/server/proxy/delete/${id}`
  );
}

/**
 * 测试代理连接
 * @param id 代理ID
 * @returns 测试结果
 */
export function testProxyConnection(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/gen/server/proxy/test/${id}`
  );
}

/**
 * 启用代理
 * @param id 代理ID
 * @returns 操作结果
 */
export function enableServerProxy(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/gen/server/proxy/enable/${id}`
  );
}

/**
 * 禁用代理
 * @param id 代理ID
 * @returns 操作结果
 */
export function disableServerProxy(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/gen/server/proxy/disable/${id}`
  );
}

/**
 * 批量删除服务器代理
 * @param ids 代理ID数组
 * @returns 删除结果
 */
export function batchDeleteServerProxy(ids: number[]) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server/proxy/batch-delete",
    { data: ids }
  );
}

/**
 * 获取代理连接URL
 * @param id 代理ID
 * @returns 代理URL
 */
export function getServerProxyUrl(id: number) {
  return http.request<ReturnResult<string>>(
    "get",
    `v1/gen/server/proxy/url/${id}`
  );
}

/**
 * 批量更新代理状态
 * @param ids 代理ID数组
 * @param status 状态
 * @returns 更新结果
 */
export function batchUpdateServerProxyStatus(ids: number[], status: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/proxy/batch-update-status",
    { data: { ids, status } }
  );
}

/**
 * 获取代理统计信息
 * @returns 统计信息
 */
export function getServerProxyStatistics() {
  return http.request<ReturnResult<Record<string, any>>>(
    "get",
    "v1/gen/server/proxy/statistics"
  );
}

/**
 * 获取服务器的所有代理类型
 * @param serverId 服务器ID
 * @returns 代理类型列表
 */
export function getServerProxyTypes(serverId: number) {
  return http.request<ReturnResult<string[]>>(
    "get",
    `v1/gen/server/proxy/server/${serverId}/types`
  );
}

/**
 * 克隆服务器代理配置
 * @param sourceServerId 源服务器ID
 * @param targetServerId 目标服务器ID
 * @returns 克隆结果
 */
export function cloneServerProxyConfig(sourceServerId: number, targetServerId: number) {
  return http.request<ReturnResult<ServerProxy[]>>(
    "post",
    "v1/gen/server/proxy/clone",
    { data: { sourceServerId, targetServerId } }
  );
}

// ==================== 常量和枚举 ====================

/**
 * 服务器代理状态枚举
 */
export const SERVER_PROXY_STATUS = {
  DISABLED: 0,  // 禁用
  ENABLED: 1,   // 启用
} as const;

export type ServerProxyStatus = typeof SERVER_PROXY_STATUS[keyof typeof SERVER_PROXY_STATUS];

/**
 * 服务器代理类型枚举
 */
export const SERVER_PROXY_TYPE = {
  HTTP: "HTTP",
  SOCKS4: "SOCKS4",
  SOCKS5: "SOCKS5",
} as const;

export type ServerProxyType = typeof SERVER_PROXY_TYPE[keyof typeof SERVER_PROXY_TYPE];

/**
 * 认证要求枚举
 */
export const AUTH_REQUIRED = {
  NO: 0,
  YES: 1,
} as const;

export type AuthRequired = typeof AUTH_REQUIRED[keyof typeof AUTH_REQUIRED];

/**
 * 测试结果枚举
 */
export const TEST_RESULT = {
  FAILED: 0,
  SUCCESS: 1,
} as const;

export type TestResult = typeof TEST_RESULT[keyof typeof TEST_RESULT];

/**
 * 代理状态标签映射
 */
export const PROXY_STATUS_LABELS = {
  [SERVER_PROXY_STATUS.DISABLED]: "禁用",
  [SERVER_PROXY_STATUS.ENABLED]: "启用",
} as const;

/**
 * 默认超时时间（毫秒）
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * 默认端口配置
 */
export const DEFAULT_PORTS = {
  HTTP: 8080,
  SOCKS4: 1080,
  SOCKS5: 1080,
} as const;
