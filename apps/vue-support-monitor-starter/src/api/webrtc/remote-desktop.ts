import { http } from "@repo/utils";

/**
 * WebRTC连接信息
 */
export interface WebRTCConnectInfo {
  host: string;
  port: number;
  clientUrl: string;
  webSocketUrl: string;
  enabled: boolean;
}

/**
 * WebRTC服务状态
 */
export interface WebRTCStatus {
  enabled: boolean;
  running: boolean;
  defaultPort: number;
  defaultHost: string;
}

/**
 * 获取WebRTC连接信息
 */
export function getWebRTCConnectInfo(params?: {
  serverId?: number;
  host?: string;
  port?: number;
}) {
  return http.get<WebRTCConnectInfo>("/api/monitor/webrtc/connect", { params });
}

/**
 * 获取WebRTC服务状态
 */
export function getWebRTCStatus(params?: {
  serverId?: number;
}) {
  return http.get<WebRTCStatus>("/api/monitor/webrtc/status", { params });
}

