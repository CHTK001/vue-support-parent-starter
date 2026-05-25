/** Pipeline 节点 */
export interface ScGraphNode {
  type: string;
  spi: string;
  config?: Record<string, any>;
  conditions?: RouteCondition[];
}

/** 路由条件 */
export interface RouteCondition {
  when: string;
  target: string;
}

/** Pipeline 定义 */
export interface ScGraph {
  id: string;
  name: string;
  version: string;
  description?: string;
  nodes: ScGraphNode[];
  sinks?: Record<string, Record<string, any>>;
}

/** Pipeline 生命周期 */
export type PipelineLifecycle = "STOPPED" | "RUNNING" | "PAUSED" | "RELOADING" | "ERROR";

/** 数据信封 */
export interface DataEnvelope {
  traceId: string;
  deviceId: number;
  timestamp: number;
  sequence: number;
  agentId?: string;
  sourceIp?: string;
  pipelineId?: string;
  transportType?: string;
  formatType?: string;
  parsed?: Record<string, any>;
  state: string;
  traceLog: string[];
  retryCount: number;
}

/** 查询请求 */
export interface QueryRequest {
  pipelineId: string;
  conditions?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  asc?: boolean;
}

/** 查询结果 */
export interface QueryResult {
  data: DataEnvelope[];
  total: number;
  hasMore: boolean;
}

/** 聚合请求 */
export interface AggregationRequest {
  pipelineId: string;
  function: string;
  field?: string;
  conditions?: Record<string, any>;
  groupBy?: string[];
}

/** 聚合结果 */
export interface AggregationResult {
  value: any;
  groups: Record<string, any>[];
}

/** 订阅 */
export interface Subscription {
  subscriptionId: string;
  clientId: string;
  pipelineId: string;
  filter?: Record<string, any>;
  createdAt: number;
}

/** 订阅配置 */
export interface SubscriptionConfig {
  pipelineId: string;
  filter?: Record<string, any>;
}

/** 监控统计 */
export interface MonitorStats {
  activePipelines: number;
  todayProcessed: number;
  todayErrors: number;
  totalProcessed: number;
  dlqSize: number;
  activeSubscriptions: number;
  throughput: number;
  avgLatency: number;
}

/** 死信条目 */
export interface DlqEntry {
  id: number;
  traceId: string;
  pipelineId: string;
  errorMessage: string;
  failCount: number;
  createdAt: number;
}

/** API 响应 */
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
  success: boolean;
}
