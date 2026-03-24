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

// ==================== 常量定义 ====================

/**
 * 连接状态枚举
 */
export const CONNECTION_STATUS = {
  OFFLINE: 0,     // 离线
  ONLINE: 1,      // 在线
  CONNECTING: 2,  // 连接中
  FAILED: 3       // 连接失败
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

/**
 * WebSocket消息类型枚举
 */
export const WS_MESSAGE_TYPE = {
  CONNECTION_STATUS_CHANGE: 'connection_status_change',
  CONNECTION_TEST_RESULT: 'connection_test_result',
  SERVER_ONLINE: 'server_online',
  SERVER_OFFLINE: 'server_offline'
} as const;

export type WSMessageType = typeof WS_MESSAGE_TYPE[keyof typeof WS_MESSAGE_TYPE];

// ==================== 类型定义 ====================

/**
 * 服务器连接状态信息
 */
export interface ServerConnectionStatus {
  monitorSysGenServerConnectionStatusId: number;
  monitorSysGenServerId: number;
  monitorSysGenServerConnectionStatus: string;
  monitorSysGenServerConnectionLastCheckTime: string;
  monitorSysGenServerConnectionResponseTime: number;
  monitorSysGenServerConnectionErrorMessage?: string;
  monitorSysGenServerConnectionCreateTime: string;
  monitorSysGenServerConnectionUpdateTime: string;
}

/**
 * WebSocket连接状态消息
 */
export interface ServerConnectionMessage {
  messageType: WSMessageType;
  serverId: number;
  serverName?: string;
  connectionStatus: ConnectionStatus;
  statusDesc?: string;
  errorMessage?: string;
  connectTime?: string;
  timestamp: number;
}

/**
 * 连接状态详细信息
 */
export interface ConnectionStatusInfo {
  serverId: number;
  serverName: string;
  host: string;
  port: number;
  protocol: string;
  connectionStatus: ConnectionStatus;
  statusDesc: string;
  lastConnectTime?: string;
  connectionError?: string;
  monitorEnabled: number;
  tags?: string;
}

/**
 * 连接测试结果
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  serverId: number;
  serverName: string;
  host: string;
  port: number;
  protocol: string;
}

/**
 * 批量测试结果
 */
export interface BatchTestResult {
  total: number;
  success: number;
  failed: number;
  successList: ConnectionTestResult[];
  failedList: ConnectionTestResult[];
}

/**
 * 连接状态分页查询参数
 */
export interface ConnectionStatusPageParams {
  page?: number;
  pageSize?: number;
  serverId?: number;
  status?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * 连接状态统计信息
 */
export interface ConnectionStatistics {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  connectingServers: number;
  failedServers: number;
  avgResponseTime: number;
  lastUpdateTime: string;
}

// ==================== API 函数 ====================

/**
 * 服务器连接状态管理 API
 */

/**
 * 分页查询服务器连接状态列表
 * @param params 查询参数
 * @returns 连接状态分页数据
 */
export function getConnectionStatusPageList(params: ConnectionStatusPageParams) {
  return http.request<ReturnResult<{ records: ServerConnectionStatus[]; total: number }>>(
    "get",
    "v1/server/connection-status/page",
    { params }
  );
}

/**
 * 获取服务器连接状态详情
 * @param serverId 服务器ID
 * @returns 连接状态详细信息
 */
export function getServerConnectionStatus(serverId: string) {
  return http.request<ReturnResult<ServerConnectionStatus>>(
    "get",
    "v1/server/connection-status/detail",
    { params: { serverId } }
  );
}

/**
 * 获取所有在线服务器
 * @returns 在线服务器列表
 */
export function getOnlineServers() {
  return http.request<ReturnResult<ServerConnectionStatus[]>>(
    "get",
    "v1/server/connection-status/online"
  );
}

/**
 * 获取所有离线服务器
 * @returns 离线服务器列表
 */
export function getOfflineServers() {
  return http.request<ReturnResult<ServerConnectionStatus[]>>(
    "get",
    "v1/server/connection-status/offline"
  );
}

/**
 * 测试服务器连接
 * @param serverId 服务器ID
 * @returns 连接测试结果
 */
export function testServerConnection(serverId: string) {
  return http.request<ReturnResult<ConnectionTestResult>>(
    "post",
    "v1/server/connection-status/test",
    { data: { serverId } }
  );
}

/**
 * 批量测试服务器连接
 * @param serverIds 服务器ID列表
 * @returns 批量测试结果
 */
export function batchTestServerConnection(serverIds: string[]) {
  return http.request<ReturnResult<BatchTestResult>>(
    "post",
    "v1/server/connection-status/batch-test",
    { data: { serverIds } }
  );
}

/**
 * 手动检查连接状态
 * @param serverId 服务器ID
 * @returns 检查结果
 */
export function checkConnectionStatus(serverId: string) {
  return http.request<ReturnResult<ServerConnectionStatus>>(
    "post",
    "v1/server/connection-status/check",
    { data: { serverId } }
  );
}

/**
 * 批量检查连接状态
 * @param serverIds 服务器ID列表
 * @returns 批量检查结果
 */
export function batchCheckConnectionStatus(serverIds: string[]) {
  return http.request<ReturnResult<BatchTestResult>>(
    "post",
    "v1/server/connection-status/batch-check",
    { data: { serverIds } }
  );
}

/**
 * 获取连接状态统计信息
 * @param params 查询参数
 * @returns 统计数据
 */
export function getConnectionStatistics(params?: {
  startTime?: string;
  endTime?: string;
}) {
  return http.request<ReturnResult<ConnectionStatistics>>(
    "get",
    "v1/server/connection-status/statistics",
    { params }
  );
}

/**
 * 获取连接状态历史记录
 * @param serverId 服务器ID
 * @param params 查询参数
 * @returns 历史记录列表
 */
export function getConnectionHistory(serverId: string, params?: {
  startTime?: string;
  endTime?: string;
  limit?: number;
}) {
  return http.request<ReturnResult<ServerConnectionStatus[]>>(
    "get",
    "v1/server/connection-status/history",
    { params: { serverId, ...params } }
  );
}

/**
 * 获取连接状态趋势数据
 * @param params 查询参数
 * @returns 趋势数据
 */
export function getConnectionTrend(params?: {
  serverId?: string;
  startTime?: string;
  endTime?: string;
  interval?: string;
}) {
  return http.request<ReturnResult<any[]>>(
    "get",
    "v1/server/connection-status/trend",
    { params }
  );
}

/**
 * 获取响应时间统计
 * @param serverId 服务器ID
 * @param params 查询参数
 * @returns 响应时间统计数据
 */
export function getResponseTimeStats(serverId: string, params?: {
  startTime?: string;
  endTime?: string;
}) {
  return http.request<ReturnResult<any>>(
    "get",
    "v1/server/connection-status/response-time",
    { params: { serverId, ...params } }
  );
}

// ==================== 工具函数 ====================

/**
 * 状态映射配置
 */
export interface StatusMapItem {
  color: "success" | "warning" | "danger" | "info";
  text: string;
}

/**
 * 连接状态映射
 */
export const connectionStatusMap: Record<ConnectionStatus, StatusMapItem> = {
  [CONNECTION_STATUS.OFFLINE]: { color: "info", text: "离线" },
  [CONNECTION_STATUS.ONLINE]: { color: "success", text: "在线" },
  [CONNECTION_STATUS.CONNECTING]: { color: "warning", text: "连接中" },
  [CONNECTION_STATUS.FAILED]: { color: "danger", text: "连接失败" },
};

/**
 * 获取连接状态描述
 * @param status 连接状态
 * @returns 状态描述文本
 */
export function getConnectionStatusText(status: ConnectionStatus): string {
  return connectionStatusMap[status]?.text || '未知';
}

/**
 * 获取连接状态颜色类型（用于Element Plus标签）
 * @param status 连接状态
 * @returns 颜色类型
 */
export function getConnectionStatusColor(status: ConnectionStatus): "success" | "warning" | "danger" | "info" {
  return connectionStatusMap[status]?.color || 'info';
}

/**
 * 判断是否在线
 * @param status 连接状态
 * @returns 是否在线
 */
export function isOnline(status: ConnectionStatus): boolean {
  return status === CONNECTION_STATUS.ONLINE;
}

/**
 * 判断是否离线
 * @param status 连接状态
 * @returns 是否离线
 */
export function isOffline(status: ConnectionStatus): boolean {
  return status === CONNECTION_STATUS.OFFLINE;
}

/**
 * 判断是否连接中
 * @param status 连接状态
 * @returns 是否连接中
 */
export function isConnecting(status: ConnectionStatus): boolean {
  return status === CONNECTION_STATUS.CONNECTING;
}

/**
 * 判断是否连接失败
 * @param status 连接状态
 * @returns 是否连接失败
 */
export function isFailed(status: ConnectionStatus): boolean {
  return status === CONNECTION_STATUS.FAILED;
}

/**
 * 格式化响应时间
 * @param responseTime 响应时间（毫秒）
 * @returns 格式化后的响应时间字符串
 */
export function formatResponseTime(responseTime: number): string {
  if (!responseTime || responseTime < 0) return '-';

  if (responseTime < 1000) {
    return `${responseTime}ms`;
  } else {
    return `${(responseTime / 1000).toFixed(2)}s`;
  }
}

/**
 * 获取连接状态图标
 * @param status 连接状态
 * @returns 图标名称
 */
export function getConnectionStatusIcon(status: ConnectionStatus): string {
  const iconMap: Record<ConnectionStatus, string> = {
    [CONNECTION_STATUS.OFFLINE]: "ri:wifi-off-line",
    [CONNECTION_STATUS.ONLINE]: "ri:wifi-line",
    [CONNECTION_STATUS.CONNECTING]: "ri:loader-line",
    [CONNECTION_STATUS.FAILED]: "ri:error-warning-line",
  };

  return iconMap[status] || "ri:question-line";
}

// ==================== WebSocket 连接管理 ====================

/**
 * WebSocket连接配置
 */
export interface WebSocketConfig {
  url: string;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  enableHeartbeat?: boolean;
}

/**
 * WebSocket事件处理器类型
 */
export type WebSocketEventHandler<T = any> = (data: T) => void;

/**
 * 服务器连接状态WebSocket管理类
 */
export class ServerConnectionWebSocket {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectInterval: number;
  private readonly heartbeatInterval: number;
  private readonly enableHeartbeat: boolean;
  private messageHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private isManualClose = false;

  constructor(private config: WebSocketConfig) {
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.reconnectInterval = config.reconnectInterval || 3000;
    this.heartbeatInterval = config.heartbeatInterval || 30000;
    this.enableHeartbeat = config.enableHeartbeat !== false;

    this.connect();
  }

  /**
   * 连接WebSocket
   */
  private connect(): void {
    try {
      this.socket = new WebSocket(this.config.url);

      this.socket.onopen = () => {
        console.log('服务器连接状态WebSocket已连接');
        this.reconnectAttempts = 0;
        this.isManualClose = false;

        if (this.enableHeartbeat) {
          this.startHeartbeat();
        }

        this.emit('connected', null);
      };

      this.socket.onmessage = (event) => {
        try {
          const message: ServerConnectionMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
          this.emit('error', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('服务器连接状态WebSocket已断开', event.code, event.reason);
        this.stopHeartbeat();
        this.emit('disconnected', { code: event.code, reason: event.reason });

        if (!this.isManualClose) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('服务器连接状态WebSocket错误:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      this.emit('error', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: ServerConnectionMessage): void {
    // 处理特定类型的消息处理器
    const handlers = this.messageHandlers.get(message.messageType) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
      }
    });

    // 触发通用消息处理器
    const allHandlers = this.messageHandlers.get('*') || [];
    allHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
      }
    });
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isManualClose) {
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`尝试重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连次数已达上限');
      this.emit('maxReconnectAttemptsReached', null);
    }
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      this.stopHeartbeat();
    }

    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 添加消息处理器
   * @param messageType 消息类型
   * @param handler 处理器函数
   */
  public on(messageType: string, handler: WebSocketEventHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * 移除消息处理器
   * @param messageType 消息类型
   * @param handler 处理器函数（可选）
   */
  public off(messageType: string, handler?: WebSocketEventHandler): void {
    if (!handler) {
      this.messageHandlers.delete(messageType);
    } else {
      const handlers = this.messageHandlers.get(messageType) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any) {
    const handlers = this.messageHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('触发事件处理器失败:', error);
      }
    });
  }

  /**
   * 发送消息
   * @param message 要发送的消息
   */
  public send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  /**
   * 手动关闭连接
   */
  public close(): void {
    this.isManualClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * 断开连接（别名方法）
   */
  public disconnect(): void {
    this.close();
  }

  /**
   * 手动重连
   */
  public reconnect(): void {
    this.close();
    this.isManualClose = false;
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * 获取WebSocket连接状态
   * @returns WebSocket连接状态
   */
  public getReadyState(): number {
    return this.socket?.readyState || WebSocket.CLOSED;
  }

  /**
   * 是否已连接
   * @returns 是否已连接
   */
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取重连次数
   * @returns 当前重连次数
   */
  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * 重置重连次数
   */
  public resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }
}
