import { http } from "@repo/utils";

/**
 * 服务器代理配置接口
 */

// 代理类型枚举
export const PROXY_TYPES = {
  HTTP: "HTTP",
  SOCKS4: "SOCKS4", 
  SOCKS5: "SOCKS5"
} as const;

// 代理状态枚举
export const PROXY_STATUS = {
  DISABLED: 0,
  ENABLED: 1
} as const;

// 服务器代理关联接口 (对应后端 MonitorSysGenServerProxy 实体)
export interface ServerProxy {
  monitorSysGenServerProxyId?: number;           // 服务器代理关联ID
  monitorSysGenServerProxyType?: string;         // 代理类型 (HTTP, SOCKS4, SOCKS5, GUACAMOLE)
  monitorSysGenServerProxyHost?: string;         // 代理主机地址
  monitorSysGenServerProxyPort?: number;         // 代理端口号
  monitorSysGenServerProxyEnabled?: number;      // 是否启用 0:否 1:是
  monitorSysGenServerProxyStatus?: number;       // 代理状态 0:离线 1:在线 2:连接中 3:连接失败
  monitorSysGenServerProxyLastConnectTime?: string; // 最后连接时间
  monitorSysGenServerProxyConnectionError?: string; // 连接失败原因
  monitorSysGenServerProxyRemark?: string;       // 备注
  createTime?: string;                           // 继承自SysBase
  updateTime?: string;                           // 继承自SysBase
  createBy?: string;                             // 继承自SysBase
  updateBy?: string;                             // 继承自SysBase
}

// 代理测试结果接口
export interface ProxyTestResult {
  proxyId?: number;
  success: number;
  responseCode?: number;
  latency: number;
  message: string;
  error?: string;
}

// 代理统计信息接口
export interface ProxyStatistics {
  totalCount: number;
  enabledCount: number;
  disabledCount: number;
  successCount: number;
  failedCount: number;
  typeCount: number;
}

// 分页请求参数
export interface ProxyPageRequest {
  page: number;
  pageSize: number;
  keyword?: string;
  params?: {
    status?: number;
    type?: string;
  };
}

// 返回结果类型
export interface ReturnResult<T> {
  code: string;
  msg: string;
  data: T;
  success: boolean;
}

// 分页结果类型
export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 分页查询服务器代理关联列表
 * @param params 分页参数
 * @returns 分页结果
 */
export function getServerProxyPageList(params: ProxyPageRequest) {
  return http.request<ReturnResult<PageResult<ServerProxy>>>(
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
export function getServerProxyList(serverId: number) {
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
export function getServerListByProxy(proxyId: number) {
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
export function getServerProxyByType(serverId: number, proxyType: string) {
  return http.request<ReturnResult<ServerProxy>>(
    "get",
    `v1/gen/server/proxy/server/${serverId}/type/${proxyType}`
  );
}

/**
 * 获取代理详情
 * @param proxyId 代理ID
 * @returns 代理详情
 */
export function getProxyDetail(proxyId: number) {
  return http.request<ReturnResult<ServerProxy>>(
    "get",
    `v1/gen/server/proxy/${proxyId}`
  );
}

/**
 * 保存代理配置
 * @param proxy 代理配置
 * @returns 保存结果
 */
export function saveProxy(proxy: ServerProxy) {
  return http.request<ReturnResult<ServerProxy>>(
    "post",
    "v1/gen/server/proxy/save",
    { data: proxy }
  );
}

/**
 * 更新代理配置
 * @param proxy 代理配置
 * @returns 更新结果
 */
export function updateProxy(proxy: ServerProxy) {
  return http.request<ReturnResult<ServerProxy>>(
    "put",
    "v1/gen/server/proxy/update",
    { data: proxy }
  );
}

/**
 * 删除服务器代理关联
 * @param id 关联ID
 * @returns 删除结果
 */
export function deleteServerProxy(id: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `v1/gen/server/proxy/delete/${id}`
  );
}

/**
 * 批量删除服务器代理关联
 * @param ids 关联ID列表
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
 * 测试代理连接
 * @param proxyId 代理ID
 * @param testUrl 测试URL
 * @returns 测试结果
 */
export function testProxyConnection(proxyId: number, testUrl?: string) {
  return http.request<ReturnResult<ProxyTestResult>>(
    "post",
    `v1/gen/server/proxy/test/${proxyId}`,
    { params: { testUrl } }
  );
}

/**
 * 批量测试代理连接
 * @param proxyIds 代理ID列表
 * @param testUrl 测试URL
 * @returns 测试结果
 */
export function batchTestProxyConnection(proxyIds: number[], testUrl?: string) {
  return http.request<ReturnResult<ProxyTestResult[]>>(
    "post",
    "v1/gen/server/proxy/test/batch",
    { data: proxyIds, params: { testUrl } }
  );
}

/**
 * 更新代理状态
 * @param proxyId 代理ID
 * @param status 状态
 * @returns 更新结果
 */
export function updateProxyStatus(proxyId: number, status: number) {
  return http.request<ReturnResult<boolean>>(
    "put",
    `v1/gen/server/proxy/status/${proxyId}`,
    { params: { status } }
  );
}

/**
 * 批量更新代理状态
 * @param proxyIds 代理ID列表
 * @param status 状态
 * @returns 更新结果
 */
export function batchUpdateProxyStatus(proxyIds: number[], status: number) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "v1/gen/server/proxy/status/batch",
    { data: proxyIds, params: { status } }
  );
}

/**
 * 获取代理统计信息
 * @returns 统计信息
 */
export function getProxyStatistics() {
  return http.request<ReturnResult<ProxyStatistics>>(
    "get",
    "v1/gen/server/proxy/statistics"
  );
}

/**
 * 根据标签获取代理列表
 * @param tags 标签
 * @returns 代理列表
 */
export function getProxyListByTags(tags: string) {
  return http.request<ReturnResult<ServerProxy[]>>(
    "get",
    `v1/gen/server/proxy/tags/${tags}`
  );
}

/**
 * 复制代理配置
 * @param proxyId 代理ID
 * @param newName 新名称
 * @returns 复制结果
 */
export function copyProxy(proxyId: number, newName: string) {
  return http.request<ReturnResult<ServerProxy>>(
    "post",
    `v1/gen/server/proxy/copy/${proxyId}`,
    { params: { newName } }
  );
}

/**
 * 导入代理配置
 * @param proxyList 代理列表
 * @returns 导入结果
 */
export function importProxyList(proxyList: ServerProxy[]) {
  return http.request<ReturnResult<ServerProxy[]>>(
    "post",
    "v1/gen/server/proxy/import",
    { data: proxyList }
  );
}

/**
 * 导出代理配置
 * @param proxyIds 代理ID列表
 * @returns 导出结果
 */
export function exportProxyList(proxyIds?: number[]) {
  return http.request<ReturnResult<ServerProxy[]>>(
    "post",
    "v1/gen/server/proxy/export",
    { data: proxyIds }
  );
}

// ==================== 新增后端对应的API函数 ====================

/**
 * 启用代理
 * @param id 关联ID
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
 * @param id 关联ID
 * @returns 操作结果
 */
export function disableServerProxy(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/gen/server/proxy/disable/${id}`
  );
}

/**
 * 获取代理连接URL
 * @param id 关联ID
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
 * @param ids 关联ID列表
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
