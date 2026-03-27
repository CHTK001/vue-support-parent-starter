import { http } from "@repo/utils";

export interface RemoteDesktopConnectInfo {
  host: string;
  websocketPort: number;
  websocketUrl: string;
  running: boolean;
  enabled: boolean;
}

export interface RemoteDesktopStatus {
  enabled: boolean;
  running: boolean;
  defaultWebSocketPort: number;
  defaultTcpPort: number;
  defaultHost: string;
}

export interface StartRemoteDesktopParams {
  serverId?: number;
  websocketPort?: number;
  tcpPort?: number;
}

export interface StartRemoteDesktopResponse {
  serverId: number;
  handles: Record<string, number>;
  websocketUrl: string;
  websocketPort: number;
  host: string;
  enabled: boolean;
}

export interface StopRemoteDesktopParams {
  serverId: number;
  protocol?: string;
}

export function getRemoteDesktopConnectInfo(params?: {
  serverId?: number;
  host?: string;
  websocketPort?: number;
}) {
  return http.get<RemoteDesktopConnectInfo>(
    "/api/monitor/remote-desktop/connect",
    { params },
  );
}

export function getRemoteDesktopStatus(params?: {
  serverId?: number;
  protocol?: string;
}) {
  return http.get<RemoteDesktopStatus>("/api/monitor/remote-desktop/status", {
    params,
  });
}

export function startRemoteDesktopService(data: StartRemoteDesktopParams) {
  return http.post<StartRemoteDesktopResponse>(
    "/api/monitor/remote-desktop/start",
    null,
    { params: data },
  );
}

export function stopRemoteDesktopService(data: StopRemoteDesktopParams) {
  return http.post("/api/monitor/remote-desktop/stop", null, {
    params: data,
  });
}
