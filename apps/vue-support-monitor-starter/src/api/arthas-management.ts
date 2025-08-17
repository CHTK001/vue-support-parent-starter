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

