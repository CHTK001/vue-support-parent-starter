import { http } from "@repo/utils";

/**
 * 远程桌面连接信息
 */
export interface RemoteDesktopConnectInfo {
  host: string;
  websocketPort: number;
  websocketUrl: string;
  running: boolean;
  enabled: boolean;
}

/**
 * 远程桌面服务状态
 */
export interface RemoteDesktopStatus {
  enabled: boolean;
  running: boolean;
  defaultWebSocketPort: number;
  defaultTcpPort: number;
  defaultHost: string;
}

/**
 * 启动远程桌面服务参数
 */
export interface StartRemoteDesktopParams {
  serverId?: number;
  websocketPort?: number;
  tcpPort?: number;
}

/**
 * 启动远程桌面服务响应
 */
export interface StartRemoteDesktopResponse {
  serverId: number;
  handles: Record<string, number>;
  websocketUrl: string;
  websocketPort: number;
  host: string;
  enabled: boolean;
}

/**
 * 停止远程桌面服务参数
 */
export interface StopRemoteDesktopParams {
  serverId: number;
  protocol?: string;
}

/**
 * 获取远程桌面连接信息
 */
export function getRemoteDesktopConnectInfo(params?: {
  serverId?: number;
  host?: string;
  websocketPort?: number;
}) {
  return http.get<RemoteDesktopConnectInfo>("/api/monitor/remote-desktop/connect", { params });
}

/**
 * 获取远程桌面服务状态
 */
export function getRemoteDesktopStatus(params?: {
  serverId?: number;
  protocol?: string;
}) {
  return http.get<RemoteDesktopStatus>("/api/monitor/remote-desktop/status", { params });
}

/**
 * 启动远程桌面服务
 */
export function startRemoteDesktopService(data: StartRemoteDesktopParams) {
  return http.post<StartRemoteDesktopResponse>("/api/monitor/remote-desktop/start", null, { params: data });
}

/**
 * 停止远程桌面服务
 */
export function stopRemoteDesktopService(data: StopRemoteDesktopParams) {
  return http.post("/api/monitor/remote-desktop/stop", null, { params: data });
}

