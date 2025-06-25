/**
 * 服务器相关类型定义
 */

// 服务器基本信息接口
export interface ServerInfo {
  monitorSysGenServerId: number;
  monitorSysGenServerName: string;
  monitorSysGenServerHost: string;
  monitorSysGenServerPort: number;
  monitorSysGenServerProtocol: string;
  monitorSysGenServerUsername?: string;
  monitorSysGenServerPassword?: string;
  monitorSysGenServerPrivateKey?: string;
  monitorSysGenServerMetricsRetentionDays?: number;
  monitorSysGenServerMonitorInterval?: number;
  monitorSysGenServerTimeout?: number;
  monitorSysGenServerDesc?: string;
  monitorSysGenServerStatus?: number;
  monitorSysGenServerMonitorEnabled?: number;
  monitorSysGenServerTags?: string;
  monitorSysGenServerConnectionStatus?: number;
  monitorSysGenServerLastConnectTime?: string;
  monitorSysGenServerConnectionError?: string;
  genId?: string;
  monitorSysGenServerCreateTime?: string;
  monitorSysGenServerUpdateTime?: string;
  monitorSysGenServerReportEnabled?: number;
  monitorSysGenServerProxyType?: string;
  monitorSysGenServerDataReportMethod?: string;
  monitorSysGenServerPrometheusHost?: string;
  monitorSysGenServerPrometheusPort?: number;
  monitorSysGenServerProxyHost?: string;
  monitorSysGenServerProxyPort?: number;
}

// 服务器显示数据接口（简化字段名）
export interface ServerDisplayData {
  id: number;
  name: string;
  host: string;
  port: number;
  protocol: string;
  username?: string;
  description?: string;
  status?: number;
  connectionStatus?: number;
  lastConnectTime?: string;
  tags?: string;
  metricsSupport?: boolean;
  monitorEnabled?: boolean;
  // 新增字段
  monitorSysGenServerReportEnabled?: number;
  monitorSysGenServerProxyType?: string;
  monitorSysGenServerDataReportMethod?: string;
  monitorSysGenServerPrometheusHost?: string;
  monitorSysGenServerPrometheusPort?: number;
  monitorSysGenServerProxyHost?: string;
  monitorSysGenServerProxyPort?: number;
}

// 服务器指标数据接口
export interface ServerMetrics {
  monitorSysGenServerMetricsId: number;
  monitorSysGenServerId: number;
  monitorSysGenServerMetricsCollectTime: string;
  monitorSysGenServerMetricsCpuUsage: number;
  monitorSysGenServerMetricsCpuCores?: number;
  monitorSysGenServerMetricsCpuLoad1m?: number;
  monitorSysGenServerMetricsCpuLoad5m?: number;
  monitorSysGenServerMetricsCpuLoad15m?: number;
  monitorSysGenServerMetricsMemoryTotal?: number;
  monitorSysGenServerMetricsMemoryUsed?: number;
  monitorSysGenServerMetricsMemoryFree?: number;
  monitorSysGenServerMetricsMemoryUsage: number;
  monitorSysGenServerMetricsDiskTotal?: number;
  monitorSysGenServerMetricsDiskUsed?: number;
  monitorSysGenServerMetricsDiskFree?: number;
  monitorSysGenServerMetricsDiskUsage: number;
  monitorSysGenServerMetricsNetworkIn: number;
  monitorSysGenServerMetricsNetworkOut: number;
  monitorSysGenServerMetricsUptime: number;
  monitorSysGenServerMetricsProcessCount?: number;
  monitorSysGenServerMetricsStatus?: number;
  monitorSysGenServerMetricsResponseTime?: number;
  monitorSysGenServerMetricsOsInfo?: string;
  monitorSysGenServerMetricsExtraInfo?: string;
}

// 服务器连接状态
export interface ServerConnectionStatus {
  serverId: number;
  status: number;
  message?: string;
  lastCheckTime?: string;
}

// 服务器统计信息
export interface ServerStatistics {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  errorServers: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgDiskUsage: number;
}

// 服务器保存参数
export interface ServerSaveParams {
  id?: number;
  monitorSysGenServerName: string;
  monitorSysGenServerHost: string;
  monitorSysGenServerPort: number;
  monitorSysGenServerProtocol: string;
  monitorSysGenServerUsername?: string;
  monitorSysGenServerPassword?: string;
  monitorSysGenServerPrivateKey?: string;
  monitorSysGenServerDesc?: string;
  monitorSysGenServerMonitorEnabled?: number;
  monitorSysGenServerTags?: string;
  monitorSysGenServerReportEnabled?: number;
  monitorSysGenServerProxyType?: string;
  monitorSysGenServerDataReportMethod?: string;
  monitorSysGenServerPrometheusHost?: string;
  monitorSysGenServerPrometheusPort?: number;
  monitorSysGenServerProxyHost?: string;
  monitorSysGenServerProxyPort?: number;
}

// 服务器分页查询参数
export interface ServerPageParams {
  current: number;
  size: number;
  monitorSysGenServerName?: string;
  monitorSysGenServerHost?: string;
  monitorSysGenServerProtocol?: string;
  monitorSysGenServerStatus?: number;
  monitorSysGenServerTags?: string;
}

// 协议类型枚举
export const PROTOCOL_TYPES = {
  SSH: "SSH",
  RDP: "RDP",
  VNC: "VNC",
} as const;

export type ProtocolType = typeof PROTOCOL_TYPES[keyof typeof PROTOCOL_TYPES];

// 服务器状态枚举
export const SERVER_STATUS = {
  DISABLED: 0,    // 已禁用
  ENABLED: 1,     // 已启用
  MAINTENANCE: 2, // 维护中
  ERROR: 3,       // 异常
} as const;

export type ServerStatus = typeof SERVER_STATUS[keyof typeof SERVER_STATUS];

// 连接状态枚举
export const CONNECTION_STATUS = {
  DISCONNECTED: 0, // 未连接
  CONNECTED: 1,    // 已连接
  CONNECTING: 2,   // 连接中
  ERROR: 3,        // 连接失败
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

// 在线状态枚举
export const ONLINE_STATUS = {
  OFFLINE: 0,  // 离线
  ONLINE: 1,   // 在线
  UNKNOWN: 2,  // 未知
} as const;

export type OnlineStatus = typeof ONLINE_STATUS[keyof typeof ONLINE_STATUS];
