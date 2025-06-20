///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import axios from "../../config";

/**
 * 服务器管理 API
 */

// 分页查询服务器列表
export function getServerPageList(params: any) {
  return axios({
    url: "/monitor/api/v1/gen/server/page",
    method: "get",
    params,
  });
}

// 获取服务器详情
export function getServerDetail(id: string) {
  return axios({
    url: `/monitor/api/v1/gen/server/detail`,
    method: "get",
    params: { id },
  });
}

// 保存服务器配置
export function saveServer(data: any) {
  return axios({
    url: "/monitor/api/v1/gen/server/save",
    method: "post",
    data,
  });
}

// 删除服务器
export function deleteServer(id: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/delete",
    method: "delete",
    params: { id },
  });
}

// 测试服务器连接
export function testServerConnection(id: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/test",
    method: "get",
    params: { id },
  });
}

// 连接服务器
export function connectServer(id: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/connect",
    method: "post",
    data: { id },
  });
}

// 断开服务器连接
export function disconnectServer(id: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/disconnect",
    method: "post",
    data: { id },
  });
}

// 获取服务器连接状态
export function getServerStatus(id: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/status",
    method: "get",
    params: { id },
  });
}

// 执行服务器命令
export function executeServerCommand(id: string, command: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/execute",
    method: "post",
    data: command,
    params: { id },
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

// 获取服务器信息
export function getServerInfo(id: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/info",
    method: "get",
    params: { id },
  });
}

// 发送数据到服务器
export function sendServerData(id: string, data: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/send",
    method: "post",
    data,
    params: { id },
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

// 调整终端大小
export function resizeServerTerminal(id: string, width: number, height: number) {
  return axios({
    url: "/monitor/api/v1/gen/server/resize",
    method: "post",
    params: { id, width, height },
  });
}

// 获取文件列表
export function getServerFiles(id: string, path: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/files",
    method: "get",
    params: { id, path },
  });
}

// 上传文件
export function uploadServerFile(id: string, path: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return axios({
    url: "/monitor/api/v1/gen/server/upload",
    method: "post",
    data: formData,
    params: { id, path },
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// 下载文件
export function downloadServerFile(id: string, path: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/download",
    method: "get",
    params: { id, path },
    responseType: "blob",
  });
}

// 删除文件
export function deleteServerFile(id: string, path: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/delete-file",
    method: "delete",
    params: { id, path },
  });
}

// 创建目录
export function createServerDirectory(id: string, path: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/mkdir",
    method: "post",
    params: { id, path },
  });
}

// 手动收集服务器指标
export function collectServerMetrics(id: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/collect-metrics",
    method: "post",
    params: { id },
  });
}

// 获取服务器列表（按标签分组）
export function getServersByTags() {
  return axios({
    url: "/monitor/api/v1/gen/server/by-tags",
    method: "get",
  });
}

// 批量操作服务器
export function batchOperateServers(ids: string[], action: string) {
  return axios({
    url: "/monitor/api/v1/gen/server/batch",
    method: "post",
    data: { ids, action },
  });
}

// 获取服务器统计信息
export function getServerStatistics() {
  return axios({
    url: "/monitor/api/v1/gen/server/statistics",
    method: "get",
  });
}

// 导出服务器配置
export function exportServerConfig(ids: string[]) {
  return axios({
    url: "/monitor/api/v1/gen/server/export",
    method: "post",
    data: { ids },
    responseType: "blob",
  });
}

// 导入服务器配置
export function importServerConfig(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return axios({
    url: "/monitor/api/v1/gen/server/import",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// 协议类型枚举
export const PROTOCOL_TYPES = {
  SSH: "SSH",
  RDP: "RDP",
  VNC: "VNC",
} as const;

// 服务器状态枚举
export const SERVER_STATUS = {
  DISABLED: 0,
  ENABLED: 1,
  MAINTENANCE: 2,
  ERROR: 3,
} as const;

// 连接状态枚举
export const CONNECTION_STATUS = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  ERROR: 3,
} as const;

// 在线状态枚举
export const ONLINE_STATUS = {
  OFFLINE: 0,
  ONLINE: 1,
  UNKNOWN: 2,
} as const;

// 状态映射
export const statusMap = {
  [SERVER_STATUS.DISABLED]: { color: "info", text: "已禁用" },
  [SERVER_STATUS.ENABLED]: { color: "success", text: "已启用" },
  [SERVER_STATUS.MAINTENANCE]: { color: "warning", text: "维护中" },
  [SERVER_STATUS.ERROR]: { color: "danger", text: "异常" },
};

export const connectionStatusMap = {
  [CONNECTION_STATUS.DISCONNECTED]: { color: "info", text: "未连接" },
  [CONNECTION_STATUS.CONNECTED]: { color: "success", text: "已连接" },
  [CONNECTION_STATUS.CONNECTING]: { color: "warning", text: "连接中" },
  [CONNECTION_STATUS.ERROR]: { color: "danger", text: "连接失败" },
};

export const onlineStatusMap = {
  [ONLINE_STATUS.OFFLINE]: { color: "danger", text: "离线" },
  [ONLINE_STATUS.ONLINE]: { color: "success", text: "在线" },
  [ONLINE_STATUS.UNKNOWN]: { color: "warning", text: "未知" },
};

// 协议图标映射
export const protocolIconMap = {
  SSH: "ri:terminal-line",
  RDP: "ri:computer-line",
  VNC: "ri:remote-control-line",
};

// WebSocket消息类型
export const WS_MESSAGE_TYPE = {
  SERVER_STATUS: "server_status",
  SERVER_METRICS: "server_metrics",
  SERVER_ONLINE: "server_online",
  SERVER_OFFLINE: "server_offline",
  SERVER_UPDATE: "server_update",
  SERVER_DELETE: "server_delete",
  SERVER_ADD: "server_add",
} as const;

// 服务器实时数据接口
export interface ServerRealtimeData {
  id: string;
  monitorSysGenServerName: string;
  monitorSysGenServerHost: string;
  monitorSysGenServerPort: number;
  monitorSysGenServerProtocol: string;
  monitorSysGenServerStatus: number;
  monitorSysGenServerOnlineStatus: number;
  monitorSysGenServerMetricsSupport: boolean;
  monitorSysGenServerLastOnlineTime?: string;
  monitorSysGenServerLastOfflineTime?: string;
  monitorSysGenServerUpdateTime: string;
  metrics?: ServerMetrics;
}

// 服务器指标数据接口
export interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  loadAverage: string;
  uptime: number;
  collectTime: string;
}

// WebSocket消息接口
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}
