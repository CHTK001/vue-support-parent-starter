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
import axios from "../../config";

// ==================== 类型定义 ====================

/**
 * 服务器基本信息接口
 */
export interface ServerInfo {
  monitorSysGenServerId: number;
  monitorSysGenServerName: string;
  monitorSysGenServerHost: string;
  monitorSysGenServerPort: number;
  monitorSysGenServerProtocol: string;
  monitorSysGenServerUsername?: string;
  monitorSysGenServerPassword?: string;
  monitorSysGenServerPrivateKey?: string;
  monitorSysGenServerGroup?: string;
  monitorSysGenServerDescription?: string;
  monitorSysGenServerStatus: number;
  monitorSysGenServerOnlineStatus: number;
  monitorSysGenServerConnectionStatus: number;
  monitorSysGenServerMetricsSupport: boolean;
  monitorSysGenServerLastOnlineTime?: string;
  monitorSysGenServerLastOfflineTime?: string;
  monitorSysGenServerCreateTime: string;
  monitorSysGenServerUpdateTime: string;
  monitorSysGenServerTags?: string;
}

/**
 * 服务器分页查询参数
 */
export interface ServerPageParams {
  page?: number;
  pageSize?: number;
  monitorSysGenServerName?: string;
  monitorSysGenServerHost?: string;
  monitorSysGenServerProtocol?: string;
  monitorSysGenServerGroup?: string;
  monitorSysGenServerStatus?: number;
  monitorSysGenServerOnlineStatus?: number;
  monitorSysGenServerTags?: string;
}

/**
 * 服务器保存参数
 */
export interface ServerSaveParams {
  id?: string;
  monitorSysGenServerName: string;
  monitorSysGenServerHost: string;
  monitorSysGenServerPort: number;
  monitorSysGenServerProtocol: string;
  monitorSysGenServerUsername?: string;
  monitorSysGenServerPassword?: string;
  monitorSysGenServerPrivateKey?: string;
  monitorSysGenServerGroup?: string;
  monitorSysGenServerDescription?: string;
  monitorSysGenServerMetricsSupport?: boolean;
  monitorSysGenServerTags?: string;
}

/**
 * 服务器连接测试结果
 */
export interface ServerConnectionTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

/**
 * 服务器统计信息
 */
export interface ServerStatistics {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  errorServers: number;
  protocolStats: Record<string, number>;
  groupStats: Record<string, number>;
}

/**
 * 批量操作参数
 */
export interface BatchOperationParams {
  ids: string[];
  action: 'start' | 'stop' | 'restart' | 'delete' | 'enable' | 'disable';
}

// ==================== API 函数 ====================

/**
 * 服务器管理 API
 */

/**
 * 分页查询服务器列表
 * @param params 查询参数
 * @returns 服务器分页数据
 */
export function getServerPageList(params: ServerPageParams) {
  return http.request<ReturnResult<{ records: ServerInfo[]; total: number }>>(
    "get",
    "v1/gen/server/page",
    { params }
  );
}

/**
 * 获取服务器详情
 * @param id 服务器ID
 * @returns 服务器详细信息
 */
export function getServerDetail(id: string) {
  return http.request<ReturnResult<ServerInfo>>(
    "get",
    "v1/gen/server/detail",
    { params: { id } }
  );
}

/**
 * 保存服务器配置
 * @param data 服务器配置数据
 * @returns 保存结果
 */
export function saveServer(data: ServerSaveParams) {
  return http.request<ReturnResult<ServerInfo>>(
    "post",
    "v1/gen/server/save",
    { data }
  );
}

export const updateServer = (data: ServerSaveParams) => {
  return http.request<ReturnResult<ServerInfo>>(
    "put",
    "v1/gen/server/update",
    { data }
  );
}

/**
 * 删除服务器
 * @param id 服务器ID
 * @returns 删除结果
 */
export function deleteServer(id: string) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server/delete",
    { params: { id } }
  );
}

/**
 * 测试服务器连接
 * @param id 服务器ID
 * @returns 连接测试结果
 */
export function testServerConnection(id: string) {
  return http.request<ReturnResult<ServerConnectionTestResult>>(
    "get",
    "v1/gen/server/test",
    { params: { id } }
  );
}

/**
 * 连接服务器
 * @param id 服务器ID
 * @returns 连接结果
 */
export function connectServer(id: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/connect",
    { data: { id } }
  );
}

/**
 * 断开服务器连接
 * @param id 服务器ID
 * @returns 断开连接结果
 */
export function disconnectServer(id: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/disconnect",
    { data: { id } }
  );
}

/**
 * 获取服务器连接状态
 * @param id 服务器ID
 * @returns 服务器状态信息
 */
export function getServerStatus(id: string) {
  return http.request<ReturnResult<{ status: number; message: string }>>(
    "get",
    "v1/gen/server/status",
    { params: { id } }
  );
}

/**
 * 执行服务器命令
 * @param id 服务器ID
 * @param command 要执行的命令
 * @returns 命令执行结果
 */
export function executeServerCommand(id: string, command: string) {
  return axios({
    url: "v1/gen/server/execute",
    method: "post",
    data: command,
    params: { id },
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

/**
 * 获取服务器信息
 * @param id 服务器ID
 * @returns 服务器信息
 */
export function getServerInfo(id: string) {
  return http.request<ReturnResult<ServerInfo>>(
    "get",
    "v1/gen/server/info",
    { params: { id } }
  );
}

/**
 * 发送数据到服务器
 * @param id 服务器ID
 * @param data 要发送的数据
 * @returns 发送结果
 */
export function sendServerData(id: string, data: string) {
  return axios({
    url: "v1/gen/server/send",
    method: "post",
    data,
    params: { id },
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

/**
 * 调整终端大小
 * @param id 服务器ID
 * @param width 终端宽度
 * @param height 终端高度
 * @returns 调整结果
 */
export function resizeServerTerminal(id: string, width: number, height: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/resize",
    { params: { id, width, height } }
  );
}

/**
 * 获取文件列表
 * @param id 服务器ID
 * @param path 文件路径
 * @returns 文件列表
 */
export function getServerFiles(id: string, path: string) {
  return http.request<ReturnResult<any[]>>(
    "get",
    "v1/gen/server/files",
    { params: { id, path } }
  );
}

/**
 * 上传文件
 * @param id 服务器ID
 * @param path 上传路径
 * @param file 文件对象
 * @returns 上传结果
 */
export function uploadServerFile(id: string, path: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return axios({
    url: "v1/gen/server/upload",
    method: "post",
    data: formData,
    params: { id, path },
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/**
 * 下载文件
 * @param id 服务器ID
 * @param path 文件路径
 * @returns 文件数据
 */
export function downloadServerFile(id: string, path: string) {
  return axios({
    url: "v1/gen/server/download",
    method: "get",
    params: { id, path },
    responseType: "blob",
  });
}

/**
 * 删除文件
 * @param id 服务器ID
 * @param path 文件路径
 * @returns 删除结果
 */
export function deleteServerFile(id: string, path: string) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/gen/server/delete-file",
    { params: { id, path } }
  );
}

/**
 * 创建目录
 * @param id 服务器ID
 * @param path 目录路径
 * @returns 创建结果
 */
export function createServerDirectory(id: string, path: string) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/mkdir",
    { params: { id, path } }
  );
}

/**
 * 手动收集服务器指标
 * @param id 服务器ID
 * @returns 收集结果
 */
export function collectServerMetrics(id: string) {
  return http.request<ReturnResult<ServerMetrics>>(
    "post",
    "v1/gen/server/collect-metrics",
    { params: { id } }
  );
}

/**
 * 获取服务器列表（按标签分组）
 * @returns 按标签分组的服务器列表
 */
export function getServersByTags() {
  return http.request<ReturnResult<Record<string, ServerInfo[]>>>(
    "get",
    "v1/gen/server/by-tags"
  );
}

/**
 * 批量操作服务器
 * @param params 批量操作参数
 * @returns 操作结果
 */
export function batchOperateServers(params: BatchOperationParams) {
  return http.request<ReturnResult<{ success: number; failed: number }>>(
    "post",
    "v1/gen/server/batch",
    { data: params }
  );
}

/**
 * 获取服务器统计信息
 * @returns 服务器统计数据
 */
export function getServerStatistics() {
  return http.request<ReturnResult<ServerStatistics>>(
    "get",
    "v1/gen/server/statistics"
  );
}

/**
 * 导出服务器配置
 * @param ids 服务器ID列表
 * @returns 配置文件
 */
export function exportServerConfig(ids: string[]) {
  return axios({
    url: "v1/gen/server/export",
    method: "post",
    data: { ids },
    responseType: "blob",
  });
}

/**
 * 导入服务器配置
 * @param file 配置文件
 * @returns 导入结果
 */
export function importServerConfig(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return axios({
    url: "v1/gen/server/import",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// ==================== 常量和枚举 ====================

/**
 * 协议类型枚举
 */
export const PROTOCOL_TYPES = {
  SSH: "SSH",
  RDP: "RDP",
  VNC: "VNC",
} as const;

export type ProtocolType = typeof PROTOCOL_TYPES[keyof typeof PROTOCOL_TYPES];

/**
 * 服务器状态枚举
 */
export const SERVER_STATUS = {
  DISABLED: 0,    // 已禁用
  ENABLED: 1,     // 已启用
  MAINTENANCE: 2, // 维护中
  ERROR: 3,       // 异常
} as const;

export type ServerStatus = typeof SERVER_STATUS[keyof typeof SERVER_STATUS];

/**
 * 连接状态枚举
 */
export const CONNECTION_STATUS = {
  DISCONNECTED: 0, // 未连接
  CONNECTED: 1,    // 已连接
  CONNECTING: 2,   // 连接中
  ERROR: 3,        // 连接失败
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

/**
 * 在线状态枚举
 */
export const ONLINE_STATUS = {
  OFFLINE: 0,  // 离线
  ONLINE: 1,   // 在线
  UNKNOWN: 2,  // 未知
} as const;

export type OnlineStatus = typeof ONLINE_STATUS[keyof typeof ONLINE_STATUS];

/**
 * 状态映射配置
 */
export interface StatusMapItem {
  color: "success" | "warning" | "danger" | "info";
  text: string;
}

/**
 * 服务器状态映射
 */
export const statusMap: Record<ServerStatus, StatusMapItem> = {
  [SERVER_STATUS.DISABLED]: { color: "info", text: "已禁用" },
  [SERVER_STATUS.ENABLED]: { color: "success", text: "已启用" },
  [SERVER_STATUS.MAINTENANCE]: { color: "warning", text: "维护中" },
  [SERVER_STATUS.ERROR]: { color: "danger", text: "异常" },
};

/**
 * 连接状态映射
 */
export const connectionStatusMap: Record<ConnectionStatus, StatusMapItem> = {
  [CONNECTION_STATUS.DISCONNECTED]: { color: "info", text: "未连接" },
  [CONNECTION_STATUS.CONNECTED]: { color: "success", text: "已连接" },
  [CONNECTION_STATUS.CONNECTING]: { color: "warning", text: "连接中" },
  [CONNECTION_STATUS.ERROR]: { color: "danger", text: "连接失败" },
};

/**
 * 在线状态映射
 */
export const onlineStatusMap: Record<OnlineStatus, StatusMapItem> = {
  [ONLINE_STATUS.OFFLINE]: { color: "danger", text: "离线" },
  [ONLINE_STATUS.ONLINE]: { color: "success", text: "在线" },
  [ONLINE_STATUS.UNKNOWN]: { color: "warning", text: "未知" },
};

/**
 * 协议图标映射
 */
export const protocolIconMap: Record<ProtocolType, string> = {
  SSH: "ri:terminal-line",
  RDP: "ri:computer-line",
  VNC: "ri:remote-control-line",
};

// ==================== WebSocket 相关 ====================

/**
 * WebSocket消息类型枚举
 */
export const WS_MESSAGE_TYPE = {
  SERVER_STATUS: "server_status",
  SERVER_METRICS: "server_metrics",
  SERVER_ONLINE: "server_online",
  SERVER_OFFLINE: "server_offline",
  SERVER_UPDATE: "server_update",
  SERVER_DELETE: "server_delete",
  SERVER_ADD: "server_add",
} as const;

export type WSMessageType = typeof WS_MESSAGE_TYPE[keyof typeof WS_MESSAGE_TYPE];

/**
 * 前端显示用的服务器数据接口（简化字段名）
 */
export interface ServerDisplayData {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: ProtocolType;
  status: ServerStatus;
  onlineStatus: OnlineStatus;
  connectionStatus: ConnectionStatus;
  metricsSupport: boolean;
  username?: string;
  group?: string;
  description?: string;
  tags?: string;
  lastOnlineTime?: string;
  lastOfflineTime?: string;
  createTime: string;
  updateTime: string;
  metrics?: ServerMetrics;
}

/**
 * 服务器实时数据接口
 */
export interface ServerRealtimeData {
  id: string;
  monitorSysGenServerName: string;
  monitorSysGenServerHost: string;
  monitorSysGenServerPort: number;
  monitorSysGenServerProtocol: ProtocolType;
  monitorSysGenServerStatus: ServerStatus;
  monitorSysGenServerOnlineStatus: OnlineStatus;
  monitorSysGenServerMetricsSupport: boolean;
  monitorSysGenServerLastOnlineTime?: string;
  monitorSysGenServerLastOfflineTime?: string;
  monitorSysGenServerUpdateTime: string;
  metrics?: ServerMetrics;
}

/**
 * 服务器指标数据接口
 */
export interface ServerMetrics {
  /** CPU使用率 (%) */
  cpuUsage: number;
  /** 内存使用率 (%) */
  memoryUsage: number;
  /** 磁盘使用率 (%) */
  diskUsage: number;
  /** 网络入流量 (bytes/s) */
  networkIn: number;
  /** 网络出流量 (bytes/s) */
  networkOut: number;
  /** 系统负载平均值 */
  loadAverage: string;
  /** 系统运行时间 (秒) */
  uptime: number;
  /** 数据收集时间 */
  collectTime: string;
  /** CPU温度 (摄氏度) */
  temperature?: number;
  /** 进程数量 */
  processCount?: number;
  /** 线程数量 */
  threadCount?: number;
}

/**
 * WebSocket消息接口
 */
export interface WebSocketMessage<T = any> {
  type: WSMessageType;
  data: T;
  timestamp: number;
  serverId?: string;
}

// ==================== 字段映射转换函数 ====================

/**
 * 将后台返回的ServerInfo转换为前端显示用的ServerDisplayData
 * @param serverInfo 后台返回的服务器信息
 * @returns 前端显示用的服务器数据
 */
export function mapServerInfoToDisplayData(serverInfo: ServerInfo): ServerDisplayData {
  return {
    id: String(serverInfo.monitorSysGenServerId),
    name: serverInfo.monitorSysGenServerName,
    host: serverInfo.monitorSysGenServerHost,
    port: serverInfo.monitorSysGenServerPort,
    protocol: serverInfo.monitorSysGenServerProtocol as ProtocolType,
    status: serverInfo.monitorSysGenServerStatus as ServerStatus,
    onlineStatus: serverInfo.monitorSysGenServerOnlineStatus as OnlineStatus,
    connectionStatus: serverInfo.monitorSysGenServerConnectionStatus as ConnectionStatus,
    metricsSupport: serverInfo.monitorSysGenServerMetricsSupport,
    username: serverInfo.monitorSysGenServerUsername,
    group: serverInfo.monitorSysGenServerGroup,
    description: serverInfo.monitorSysGenServerDescription,
    tags: serverInfo.monitorSysGenServerTags,
    lastOnlineTime: serverInfo.monitorSysGenServerLastOnlineTime,
    lastOfflineTime: serverInfo.monitorSysGenServerLastOfflineTime,
    createTime: serverInfo.monitorSysGenServerCreateTime,
    updateTime: serverInfo.monitorSysGenServerUpdateTime,
  };
}

/**
 * 将ServerRealtimeData转换为前端显示用的ServerDisplayData
 * @param realtimeData 实时数据
 * @returns 前端显示用的服务器数据
 */
export function mapRealtimeDataToDisplayData(realtimeData: ServerRealtimeData): ServerDisplayData {
  return {
    id: realtimeData.id,
    name: realtimeData.monitorSysGenServerName,
    host: realtimeData.monitorSysGenServerHost,
    port: realtimeData.monitorSysGenServerPort,
    protocol: realtimeData.monitorSysGenServerProtocol,
    status: realtimeData.monitorSysGenServerStatus,
    onlineStatus: realtimeData.monitorSysGenServerOnlineStatus,
    connectionStatus: 0, // 实时数据中没有连接状态，默认为0
    metricsSupport: realtimeData.monitorSysGenServerMetricsSupport,
    lastOnlineTime: realtimeData.monitorSysGenServerLastOnlineTime,
    lastOfflineTime: realtimeData.monitorSysGenServerLastOfflineTime,
    createTime: '',
    updateTime: realtimeData.monitorSysGenServerUpdateTime,
    metrics: realtimeData.metrics,
  };
}

/**
 * 批量转换服务器列表
 * @param serverList 后台返回的服务器列表
 * @returns 前端显示用的服务器列表
 */
export function mapServerListToDisplayData(serverList: ServerInfo[]): ServerDisplayData[] {
  return serverList.map(mapServerInfoToDisplayData);
}

/**
 * 将前端显示数据转换为保存参数
 * @param displayData 前端显示数据
 * @returns 保存参数
 */
export function mapDisplayDataToSaveParams(displayData: Partial<ServerDisplayData>): ServerSaveParams {
  return {
    id: displayData.id,
    monitorSysGenServerName: displayData.name || '',
    monitorSysGenServerHost: displayData.host || '',
    monitorSysGenServerPort: displayData.port || 22,
    monitorSysGenServerProtocol: displayData.protocol || 'SSH',
    monitorSysGenServerUsername: displayData.username,
    monitorSysGenServerGroup: displayData.group,
    monitorSysGenServerDescription: displayData.description,
    monitorSysGenServerMetricsSupport: displayData.metricsSupport,
    monitorSysGenServerTags: displayData.tags,
  };
}
