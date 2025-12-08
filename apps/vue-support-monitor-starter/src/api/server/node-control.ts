import { http, type ReturnResult } from "@repo/utils";

/**
 * 节点控制请求接口
 */
export interface NodeControlRequest {
  ipAddress: string;
  port: number;
  action?: string;
  loggerName?: string;
  logLevel?: string;
  params?: Record<string, unknown>;
}

/**
 * 节点监控指标接口
 */
export interface NodeMetricsDTO {
  nodeId: string;
  ipAddress: string;
  port: number;
  applicationName: string;
  timestamp: number;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  jvm: JvmMetrics;
  thread: ThreadMetrics;
  gc: GcMetrics;
}

export interface CpuMetrics {
  usage: number;
  systemUsage: number;
  processUsage: number;
  cores: number;
  loadAverage: number;
}

export interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface DiskMetrics {
  total: number;
  used: number;
  free: number;
  usage: number;
  partitions?: DiskPartition[];
}

export interface DiskPartition {
  mountPoint: string;
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface NetworkMetrics {
  bytesReceived: number;
  bytesSent: number;
  receiveRate: number;
  sendRate: number;
  tcpConnections: number;
}

export interface JvmMetrics {
  heapUsed: number;
  heapMax: number;
  heapCommitted: number;
  nonHeapUsed: number;
  nonHeapMax: number;
  uptime: number;
  startTime: number;
  version: string;
  name: string;
  memoryPools?: Record<string, MemoryPoolInfo>;
}

export interface MemoryPoolInfo {
  name: string;
  used: number;
  max: number;
  committed: number;
}

export interface ThreadMetrics {
  live: number;
  daemon: number;
  peak: number;
  totalStarted: number;
  stateCount?: Record<string, number>;
}

export interface GcMetrics {
  count: number;
  time: number;
  collectors?: Record<string, GcCollectorInfo>;
}

export interface GcCollectorInfo {
  name: string;
  count: number;
  time: number;
}

// ==================== 日志管理 ====================

/**
 * 获取节点日志文件列表
 */
export const getLogFilesForNodeControl = (ipAddress: string, port: number) => {
  return http.request<ReturnResult<string[]>>(
    "get",
    "/v1/node/control/log/files",
    {
      params: { ipAddress, port },
    }
  );
};

/**
 * 获取节点日志内容
 */
export const getLogContentForNodeControl = (
  ipAddress: string,
  port: number,
  logFile?: string,
  lines?: number
) => {
  return http.request<ReturnResult<string>>(
    "get",
    "/v1/node/control/log/content",
    {
      params: { ipAddress, port, logFile, lines: lines || 100 },
    }
  );
};

/**
 * 设置节点日志级别
 */
export const setLogLevelForNodeControl = (request: NodeControlRequest) => {
  return http.request<ReturnResult<boolean>>(
    "post",
    "/v1/node/control/log/level",
    {
      data: request,
    }
  );
};

// ==================== 健康检查 ====================

/**
 * 获取节点健康状态
 */
export const getHealthForNodeControl = (ipAddress: string, port: number) => {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    "/v1/node/control/health",
    {
      params: { ipAddress, port },
    }
  );
};

// ==================== 配置管理 ====================

/**
 * 获取节点环境配置
 */
export const getEnvironmentForNodeControl = (
  ipAddress: string,
  port: number
) => {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    "/v1/node/control/config/env",
    {
      params: { ipAddress, port },
    }
  );
};

/**
 * 获取节点配置属性
 */
export const getConfigPropsForNodeControl = (
  ipAddress: string,
  port: number,
  prefix?: string
) => {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    "/v1/node/control/config/props",
    {
      params: { ipAddress, port, prefix },
    }
  );
};

/**
 * 获取节点系统信息
 */
export const getSystemInfoForNodeControl = (
  ipAddress: string,
  port: number
) => {
  return http.request<ReturnResult<Record<string, unknown>>>(
    "get",
    "/v1/node/control/config/system",
    {
      params: { ipAddress, port },
    }
  );
};

// ==================== 监控数据 ====================

/**
 * 获取节点监控指标
 */
export const getNodeMetricsForNodeControl = (
  ipAddress: string,
  port: number
) => {
  return http.request<ReturnResult<NodeMetricsDTO>>(
    "get",
    "/v1/node/control/metrics",
    {
      params: { ipAddress, port },
    }
  );
};

/**
 * 获取节点监控历史数据
 */
export const getNodeMetricsHistoryForNodeControl = (
  ipAddress: string,
  port: number,
  minutes?: number
) => {
  return http.request<ReturnResult<NodeMetricsDTO[]>>(
    "get",
    "/v1/node/control/metrics/history",
    {
      params: { ipAddress, port, minutes: minutes || 30 },
    }
  );
};

// ==================== 重启管理 ====================

/**
 * 重启节点
 */
export const restartNodeForNodeControl = (ipAddress: string, port: number) => {
  return http.request<ReturnResult<boolean>>(
    "post",
    "/v1/node/control/restart",
    {
      params: { ipAddress, port },
    }
  );
};

/**
 * 关闭节点
 */
export const shutdownNodeForNodeControl = (ipAddress: string, port: number) => {
  return http.request<ReturnResult<boolean>>(
    "post",
    "/v1/node/control/shutdown",
    {
      params: { ipAddress, port },
    }
  );
};

// ==================== 通用接口 ====================

/**
 * 发送控制命令
 */
export const sendControlCommandForNodeControl = (
  request: NodeControlRequest
) => {
  return http.request<ReturnResult<unknown>>(
    "post",
    "/v1/node/control/command",
    {
      data: request,
    }
  );
};

/**
 * 检查节点在线状态
 */
export const isNodeOnlineForNodeControl = (ipAddress: string, port: number) => {
  return http.request<ReturnResult<boolean>>("get", "/v1/node/control/online", {
    params: { ipAddress, port },
  });
};
