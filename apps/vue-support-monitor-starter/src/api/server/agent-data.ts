import { http, type ReturnResult } from "@repo/utils";

/**
 * Agent 链路追踪 DTO
 */
export interface AgentTraceDTO {
  linkId: string;
  spanId: string;
  parentSpanId: string;
  threadName: string;
  typeName: string;
  method: string;
  category: string;
  protocol: string;
  address: string;
  database: string;
  statusCode: string;
  description: string;
  error: string;
  enterTime: number;
  exitTime: number;
  costTime: number;
  sourceIp: string;
  sourcePort: number;
  applicationName: string;
  headers: string[];
  params: string[];
  children: AgentTraceDTO[];
  instances: AgentServiceInstanceDTO[];
}

/**
 * Agent 服务实例 DTO
 */
export interface AgentServiceInstanceDTO {
  name: string;
  sourceName: string;
  sourceHost: string;
  sourcePort: number;
  targetHost: string;
  targetPort: number;
  callCount: number;
  lastCallTime: number;
  avgCostTime: number;
  errorCount: number;
}

/**
 * Agent 文件句柄 DTO
 */
export interface AgentFileHandleDTO {
  filePath: string;
  fd: number;
  handleType: string;
  mode: string;
  pid: number;
  applicationName: string;
  ipAddress: string;
  port: number;
  openTime: number;
  lastAccessTime: number;
  readBytes: number;
  writeBytes: number;
}

/**
 * 服务拓扑数据
 */
export interface ServiceTopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface TopologyNode {
  id: string;
  label: string;
  host: string;
  port: number;
}

export interface TopologyEdge {
  source: string;
  target: string;
  callCount: number;
  lastCallTime: number;
}

/**
 * 文件句柄统计
 */
export interface FileHandleStats {
  totalNodes: number;
  totalHandles: number;
  nodes: { node: string; handleCount: number }[];
}

// ==================== 链路追踪查询 ====================

/**
 * 搜索历史链路追踪
 */
export const searchTracesForAgent = (
  keyword?: string,
  startTime?: number,
  endTime?: number,
  page = 1,
  pageSize = 20
) => {
  return http.request<ReturnResult<AgentTraceDTO[]>>(
    "get",
    "/v1/agent/data/trace/search",
    {
      params: { keyword, startTime, endTime, page, pageSize },
    }
  );
};

/**
 * 获取完整链路详情
 */
export const getTraceByLinkIdForAgent = (linkId: string) => {
  return http.request<ReturnResult<AgentTraceDTO>>(
    "get",
    `/v1/agent/data/trace/${linkId}`
  );
};

// ==================== 服务拓扑查询 ====================

/**
 * 获取服务拓扑图数据
 */
export const getServiceTopologyForAgent = () => {
  return http.request<ReturnResult<ServiceTopologyData>>(
    "get",
    "/v1/agent/data/topology"
  );
};

/**
 * 获取指定服务的调用关系
 */
export const getServiceRelationsForAgent = (serviceName: string) => {
  return http.request<ReturnResult<AgentServiceInstanceDTO[]>>(
    "get",
    "/v1/agent/data/topology/service",
    {
      params: { serviceName },
    }
  );
};

// ==================== 文件句柄查询 ====================

/**
 * 获取指定节点的文件句柄列表
 */
export const getFileHandlesForAgent = (ipAddress: string, port: number) => {
  return http.request<ReturnResult<AgentFileHandleDTO[]>>(
    "get",
    "/v1/agent/data/fd/list",
    {
      params: { ipAddress, port },
    }
  );
};

/**
 * 获取所有节点的文件句柄统计
 */
export const getFileHandleStatsForAgent = () => {
  return http.request<ReturnResult<FileHandleStats>>(
    "get",
    "/v1/agent/data/fd/stats"
  );
};
