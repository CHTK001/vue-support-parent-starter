import { http, type ReturnResult } from "@repo/utils";

// 节点数据接口
export interface OnlineNodeInfo {
  nodeId: string;
  nodeName?: string;
  applicationName: string;
  ipAddress: string;
  port: number;
  status: "ONLINE" | "OFFLINE" | "CONNECTING" | "ERROR" | "MAINTENANCE";
  connectTime?: string;
  lastHeartbeatTime?: string;
  connectionCount?: number;
  version?: string;
  nodeType?: string;
  healthy?: boolean;
  responseTime?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  networkLatency?: number;
  metadata?: Record<string, any>;
}

// 节点统计接口（匹配后端返回的数据结构）
export interface NodeStatistics {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  healthyNodes: number;
  errorNodes: number;
  maintenanceNodes: number;
  totalConnections: number;
  averageResponseTime: number;
  averageCpuUsage: number;
  averageMemoryUsage: number;
  averageDiskUsage: number;
  nodesByStatus: Record<string, number>;
  nodesByApplication: Record<string, number>;
  nodesByType: Record<string, number>;
  recentActiveNodes: OnlineNodeInfo[];
  fastestNodes: OnlineNodeInfo[];
  highestLoadNodes: OnlineNodeInfo[];
}

/**
 * 获取所有在线节点列表
 */
export const fetchAllOnlineNodes = () => {
  return http.request<ReturnResult<OnlineNodeInfo[]>>(
    "get",
    "/v1/monitor/nodes/all"
  );
};

/**
 * 获取节点统计信息
 */
export const fetchNodeStatistics = () => {
  return http.request<ReturnResult<NodeStatistics>>(
    "get",
    "/v1/monitor/nodes/statistics"
  );
};

/**
 * 根据应用名称分组获取在线节点
 */
export const fetchNodesByApplication = () => {
  return http.request<ReturnResult<Record<string, OnlineNodeInfo[]>>>(
    "get",
    "/v1/monitor/nodes/by-application"
  );
};

/**
 * 根据节点ID获取节点详细信息
 */
export const fetchNodeDetails = (nodeId: string) => {
  return http.request<ReturnResult<OnlineNodeInfo>>(
    "get",
    `/v1/monitor/nodes/details/${nodeId}`
  );
};

/**
 * 搜索节点
 */
export const searchNodes = (keyword: string) => {
  return http.request<ReturnResult<OnlineNodeInfo[]>>(
    "get",
    "/v1/monitor/nodes/search",
    {
      params: { keyword },
    }
  );
};

/**
 * 检查节点健康状态
 */
export const apiCheckNodeHealth = (ipAddress: string, port: number) => {
  return http.request<ReturnResult<any>>(
    "post",
    "/v1/monitor/nodes/health-check",
    {
      data: { ipAddress, port },
    }
  );
};

/**
 * 检查节点健康状态
 */
export const checkNodeHealth = (clientIp: string, clientPort: number) => {
  return http.request<ReturnResult<any>>("get", "/v1/monitor/nodes/health", {
    params: {
      clientIp,
      clientPort,
    },
  });
};
