import request from "@/api/config";

// 系统服务器相关接口

/**
 * 系统服务器配置接口
 */
export interface SystemServer {
  systemServerId?: number;
  systemServerName: string;
  systemServerHost: string;
  systemServerPort: number;
  systemServerType: string;
  systemServerContextPath: string;
  systemServerStatus?:
    | "STOPPED"
    | "RUNNING"
    | "STARTING"
    | "STOPPING"
    | "ERROR";
  systemServerDescription?: string;
  systemServerConfig?: string;
  systemServerAutoStart?: boolean;
  systemServerMaxConnections?: number;
  systemServerTimeout?: number;
  // 过滤器数量
  filterCount?: number;
  createTime?: string;
  updateTime?: string;
}

/**
 * 分页查询参数
 */
export interface SystemServerPageParams {
  current?: number;
  size?: number;
  serverName?: string;
  serverType?: string;
  status?: string;
}

/**
 * 服务器统计信息接口
 */
export interface SystemServerStatistics {
  total: number;
  running: number;
  stopped: number;
  error: number;
}

export interface ServerProcessDescriptor {
  port?: number;
  pid?: number;
  parentPid?: number;
  name?: string;
  command?: string;
  commandLine?: string;
  user?: string;
  state?: string;
  startTime?: string;
  alive?: boolean;
  currentProcess?: boolean;
  provider?: string;
}

export interface ServerProcessTerminateResult {
  port?: number;
  success?: boolean;
  force?: boolean;
  provider?: string;
  message?: string;
  terminatedCount?: number;
  skippedCount?: number;
  fallbackApplied?: boolean;
  processes?: ServerProcessDescriptor[];
}

export interface ServerBoardInfo {
  manufacturer?: string;
  model?: string;
  product?: string;
  version?: string;
  serialNumber?: string;
}

export interface ServerCpuInfo {
  manufacturer?: string;
  model?: string;
  architecture?: string;
  physicalCores?: number;
  logicalCores?: number;
  sockets?: number;
  maxClockMhz?: number;
}

export interface ServerMemoryInfo {
  totalBytes?: number;
  availableBytes?: number;
  usedBytes?: number;
  slotCount?: number;
}

export interface ServerSystemInfo {
  provider?: string;
  hostName?: string;
  osName?: string;
  osVersion?: string;
  kernelVersion?: string;
  architecture?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  biosVersion?: string;
  publicIp?: string;
  board?: ServerBoardInfo;
  cpu?: ServerCpuInfo;
  memory?: ServerMemoryInfo;
}

export interface ServerServiceDescriptor {
  provider?: string;
  name?: string;
  displayName?: string;
  status?: string;
  startMode?: string;
  pid?: number;
  description?: string;
}

export interface ServerPackageInstallRequest {
  packageManager?: string;
  packageName?: string;
  packageId?: string;
  version?: string;
  packageFile?: string;
  force?: boolean;
  nonInteractive?: boolean;
  extraArgs?: string[];
}

export interface ServerPackageInstallResult {
  provider?: string;
  packageManager?: string;
  packageName?: string;
  success?: boolean;
  exitCode?: number;
  message?: string;
  output?: string;
}

/**
 * 克隆服务器参数
 */
export interface CloneServerParams {
  sourceServerId: number;
  newServerName: string;
  newPort: number;
}

/**
 * 分页查询系统服务器配置
 */
export function getSystemServerPage(params: SystemServerPageParams) {
  return request<{ records: SystemServer[]; total: number }>({
    url: "/system/server/page",
    method: "get",
    params,
  });
}

/**
 * 根据ID查询服务器详情
 */
export function getSystemServerById(id: number) {
  return request({
    url: `/system/server/${id}`,
    method: "get",
  });
}

/**
 * 新增服务器
 */
export function addSystemServer(data: SystemServer) {
  return request({
    url: "/system/server",
    method: "post",
    data,
  });
}

/**
 * 更新服务器
 */
export function updateSystemServer(data: SystemServer) {
  return request({
    url: "/system/server",
    method: "put",
    data,
  });
}

/**
 * 删除服务器
 */
export function deleteSystemServer(id: number) {
  return request({
    url: `/system/server/${id}`,
    method: "delete",
  });
}

/**
 * 启动服务器
 */
export function startSystemServer(id: number) {
  return request({
    url: `/system/server/${id}/start`,
    method: "post",
  });
}

/**
 * 停止服务器
 */
export function stopSystemServer(id: number) {
  return request({
    url: `/system/server/${id}/stop`,
    method: "post",
  });
}

/**
 * 重启服务器
 */
export function restartSystemServer(id: number) {
  return request({
    url: `/system/server/${id}/restart`,
    method: "post",
  });
}

/**
 * 结束服务端口对应进程
 */
export function terminateSystemServer(id: number, force = true) {
  return request<ServerProcessTerminateResult>({
    url: `/system/server/${id}/terminate`,
    method: "post",
    params: { force },
  });
}

export function getLocalSystemInfo() {
  return request<ServerSystemInfo>({
    url: "/system/server/system-info",
    method: "get",
  });
}

export function getLocalServices(params?: { keyword?: string; limit?: number }) {
  return request<ServerServiceDescriptor[]>({
    url: "/system/server/services",
    method: "get",
    params,
  });
}

export function getLocalProcesses(params?: {
  keyword?: string;
  limit?: number;
  sortKey?: "pid" | "name" | "startTime";
  sortOrder?: "asc" | "desc";
}) {
  return request<ServerProcessDescriptor[]>({
    url: "/system/server/processes",
    method: "get",
    params,
  });
}

export function findLocalProcessByPort(port: number) {
  return request<{
    port?: number;
    success?: boolean;
    provider?: string;
    message?: string;
    processes?: ServerProcessDescriptor[];
  }>({
    url: "/system/server/processes/by-port",
    method: "get",
    params: { port },
  });
}

export function terminateLocalProcessByPid(pid: number, force = true) {
  return request<ServerProcessTerminateResult>({
    url: `/system/server/processes/${pid}/terminate`,
    method: "post",
    params: { force },
  });
}

export function installLocalPackage(data: ServerPackageInstallRequest) {
  return request<ServerPackageInstallResult>({
    url: "/system/server/software/install",
    method: "post",
    data,
  });
}

/**
 * 获取服务器状态
 */
export function getSystemServerStatus(id: number) {
  return request({
    url: `/system/server/${id}/status`,
    method: "get",
  });
}

/**
 * 获取可用的服务器类型
 */
export function getAvailableServerTypes() {
  return request({
    url: "/system/server/types",
    method: "get",
  });
}

/**
 * 获取服务器统计信息
 */
export function getSystemServerStatistics() {
  return request({
    url: "/system/server/statistics",
    method: "get",
  });
}

/**
 * 检查端口可用性
 */
export function checkPortAvailable(port: number, serverId?: number) {
  return request({
    url: "/system/server/check-port",
    method: "get",
    params: { port, serverId },
  });
}

/**
 * 克隆服务器
 */
export function cloneSystemServer(params: CloneServerParams) {
  return request({
    url: `/system/server/${params.sourceServerId}/clone`,
    method: "post",
    params: {
      newServerName: params.newServerName,
      newPort: params.newPort,
    },
  });
}

/**
 * 应用配置更改
 */
export function applySystemServerConfigChanges(id: number) {
  return request({
    url: `/system/server/${id}/apply-config`,
    method: "post",
  });
}

/**
 * 克隆服务器配置（更新版本，使用新的参数格式）
 */
export function cloneSystemServerV2(
  id: number,
  newName: string,
  newPort: number,
) {
  return request({
    url: `/system/server/${id}/clone`,
    method: "post",
    params: {
      newName,
      newPort,
    },
  });
}

/**
 * 批量操作服务器
 */
export function batchOperationSystemServer(
  serverIds: number[],
  operation: string,
) {
  return request({
    url: "/system/server/batch",
    method: "post",
    params: {
      serverIds: serverIds.join(","),
      operation,
    },
  });
}

/**
 * 自动启动所有配置为自动启动的服务器
 */
export function autoStartSystemServers() {
  return request({
    url: "/system/server/auto-start",
    method: "post",
  });
}

/**
 * 停止所有运行中的服务器
 */
export function stopAllSystemServers() {
  return request({
    url: "/system/server/stop-all",
    method: "post",
  });
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  logger: string;
  message: string;
  filterName?: string;
  requestPath?: string;
  requestMethod?: string;
}

export interface SystemServerFilterLogRecord {
  id?: number;
  systemServerLogId?: number;
  serverId?: number;
  filterType?: string;
  ruleCategory?: string;
  actionStatus?: "PASS" | "DENY" | string;
  processStatus?: string;
  method?: string;
  path?: string;
  host?: string;
  referer?: string;
  requestId?: string;
  clientIp?: string;
  clientGeo?: string;
  userAgent?: string;
  decisionReason?: string;
  statusCode?: number;
  accessTime?: string;
  durationMs?: number;
  storeTime?: string;
}

export interface FirewallEventRecord {
  serverKey?: string;
  serverId?: number;
  requestId?: string;
  clientIp?: string;
  clientGeo?: string;
  method?: string;
  path?: string;
  host?: string;
  referer?: string;
  userAgent?: string;
  action?: string;
  reason?: string;
  statusCode?: number;
  durationMs?: number;
  eventTime?: string;
}

export interface FirewallMetricsRecord {
  serverKey?: string;
  serverId?: number;
  total: number;
  allowed: number;
  denied: number;
  rateLimited: number;
  redirected: number;
  proxied: number;
  whitelistHit: number;
  blacklistHit: number;
  windowStart?: string;
  windowEnd?: string;
  geoStats?: Record<string, number>;
  osStats?: Record<string, number>;
  browserStats?: Record<string, number>;
  statusStats?: Record<string, number>;
  refererDomainStats?: Record<string, number>;
  refererPageStats?: Record<string, number>;
  hostStats?: Record<string, number>;
  pathStats?: Record<string, number>;
  timeline?: Array<{
    label: string;
    total: number;
    blocked: number;
    qps: number;
  }>;
}

/**
 * 获取服务器日志 SSE URL
 *
 * @param serverId 服务器ID
 * @returns SSE URL
 */
export function getServerLogSseUrl(serverId: number): string {
  const baseUrl = import.meta.env.VITE_BASE_URL || "";
  return `${baseUrl}/system/server/${serverId}/logs/stream`;
}

/**
 * 获取服务器历史日志
 *
 * @param serverId 服务器ID
 * @param params 查询参数
 */
export function getServerLogs(
  serverId: number,
  params?: { level?: string; limit?: number; filterName?: string },
) {
  return request({
    url: `/system/server/${serverId}/logs`,
    method: "get",
    params,
  });
}

/**
 * 清空服务器日志
 *
 * @param serverId 服务器ID
 */
export function clearServerLogs(serverId: number) {
  return request({
    url: `/system/server/${serverId}/logs`,
    method: "delete",
  });
}

/**
 * 查询服务历史日志（过滤器/生命周期统一日志）
 */
export function getSystemServerFilterLogs(params: {
  serverId: number;
  current?: number;
  size?: number;
  filterType?: string;
  processStatus?: string;
  clientIp?: string;
  /** 与后端 @DateTimeFormat pattern 一致: yyyy-MM-dd HH:mm:ss */
  startTime?: string;
  endTime?: string;
}) {
  return request<{ records: SystemServerFilterLogRecord[]; total: number }>({
    url: "/service/systemserver-log/page",
    method: "get",
    params,
  });
}

export function getFirewallEvents(params: {
  serverId: number;
  clientIp?: string;
  action?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}) {
  return request<FirewallEventRecord[]>({
    url: "/service/systemserver-log/firewall/events",
    method: "get",
    params,
  });
}

export function getFirewallMetrics(params: {
  serverId: number;
  startTime?: string;
  endTime?: string;
}) {
  return request<FirewallMetricsRecord>({
    url: "/service/systemserver-log/firewall/metrics",
    method: "get",
    params,
  });
}
