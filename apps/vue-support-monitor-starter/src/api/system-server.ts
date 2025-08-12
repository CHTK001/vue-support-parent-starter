import request from "./config";

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
  return request({
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
 * 获取运行中的服务器实例信息
 */
export function getRunningServerInstances() {
  return request({
    url: "/system/server/running-instances",
    method: "get",
  });
}

/**
 * 克隆服务器配置（更新版本，使用新的参数格式）
 */
export function cloneSystemServerV2(
  id: number,
  newName: string,
  newPort: number
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
  operation: string
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
