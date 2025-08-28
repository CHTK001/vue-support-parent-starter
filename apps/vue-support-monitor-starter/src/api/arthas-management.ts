import { http, type ReturnResult } from "@repo/utils";

export interface OnlineNodeInfo {
  nodeId: string;
  applicationName?: string;
  ipAddress?: string;
  port?: number;
  metadata?: Record<string, any>;
}

export function fetchArthasNodes() {
  return http.request<ReturnResult<OnlineNodeInfo[]>>("get", "/v1/arthas/nodes");
}

export function connectArthasNode(nodeId: string) {
  return http.request<ReturnResult<{ consoleUrl?: string } | string>>("post", "/v1/arthas/connect", {
    params: { nodeId }
  });
}

export function disconnectArthasNode(nodeId: string) {
  return http.request<ReturnResult<boolean>>("post", "/v1/arthas/disconnect", {
    params: { nodeId }
  });
}

// 服务器 Tunnel 配置
export interface ArthasTunnelConfigDto {
  address?: string;
  http?: string;
  username?: string;
  password?: string;
}

export function getTunnelConfig(serverId: any) {
  return http.request<ReturnResult<ArthasTunnelConfigDto>>("get", "/v1/arthas/tunnel-config", {
    params: { serverId }
  });
}

export function setTunnelConfig(serverId: any, data: ArthasTunnelConfigDto) {
  return http.request<ReturnResult<boolean>>("post", "/v1/arthas/tunnel-config/set", {
    params: { serverId, ...data }
  });
}
