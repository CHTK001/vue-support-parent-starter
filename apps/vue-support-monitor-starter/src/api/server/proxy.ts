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

// 代理配置接口
export interface ServerProxy {
  monitorSysGenServerProxyId?: number;
  monitorSysGenServerProxyName: string;
  monitorSysGenServerProxyType: string;
  monitorSysGenServerProxyHost: string;
  monitorSysGenServerProxyPort: number;
  monitorSysGenServerProxyUsername?: string;
  monitorSysGenServerProxyPassword?: string;
  monitorSysGenServerProxyStatus: number;
  monitorSysGenServerProxyDescription?: string;
  monitorSysGenServerProxyTimeout?: number;
  monitorSysGenServerProxyAuthRequired?: number;
  monitorSysGenServerProxyTags?: string;
  monitorSysGenServerProxyLastTestTime?: number;
  monitorSysGenServerProxyTestResult?: number;
  monitorSysGenServerProxyTestLatency?: number;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
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
 * 分页查询代理列表
 * @param params 分页参数
 * @returns 分页结果
 */
export function getProxyPageList(params: ProxyPageRequest) {
  return http.request<ReturnResult<PageResult<ServerProxy>>>(
    "post",
    "v1/gen/server/proxy/page",
    { data: params }
  );
}

/**
 * 获取启用的代理列表
 * @returns 代理列表
 */
export function getEnabledProxyList() {
  return http.request<ReturnResult<ServerProxy[]>>(
    "get",
    "v1/gen/server/proxy/enabled"
  );
}

/**
 * 根据代理类型获取代理列表
 * @param proxyType 代理类型
 * @returns 代理列表
 */
export function getProxyListByType(proxyType: string) {
  return http.request<ReturnResult<ServerProxy[]>>(
    "get",
    `v1/gen/server/proxy/type/${proxyType}`
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
 * 删除代理配置
 * @param proxyId 代理ID
 * @returns 删除结果
 */
export function deleteProxy(proxyId: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `v1/gen/server/proxy/${proxyId}`
  );
}

/**
 * 批量删除代理配置
 * @param proxyIds 代理ID列表
 * @returns 删除结果
 */
export function batchDeleteProxy(proxyIds: number[]) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server/proxy/batch",
    { data: proxyIds }
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
