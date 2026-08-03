/**
 * 爬虫中心领域类型定义。
 */

/** 分页响应 */
export interface PageResult<T> {
  pageNo: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: T[];
  records?: T[];
}

/** 爬虫定义 */
export interface SpiderDefinition {
  spiderId?: number;
  spiderCode: string;
  spiderName: string;
  spiderEntryUrl: string;
  spiderSiteHost?: string;
  spiderExecutorType?: string;
  spiderExecutorRounds?: number;
  spiderCollectDeepUrl?: number;
  spiderMaxDepth?: number;
  spiderMaxPages?: number;
  spiderDedupStrategy?: string;
  spiderUrlStorageType?: string;
  spiderStatus?: number;
  spiderRemark?: string;
  createTime?: string;
  updateTime?: string;
}

/** 保存请求 */
export interface SpiderDefinitionSaveRequest extends SpiderDefinition {}

/** 采集数据 */
export interface DataRecord {
  spiderId?: number;
  spiderDefinitionCode: string;
  spiderExecutionNo: string;
  spiderTargetUrl: string;
  spiderDataCode?: string;
  spiderDataName?: string;
  spiderDataPayload?: string;
  spiderDataStatus?: string;
  spiderDepth?: number;
  createTime?: string;
}

/** 执行记录 */
export interface ExecutionRecord {
  spiderId?: number;
  spiderExecutionNo: string;
  spiderDefinitionCode: string;
  spiderTriggerType?: string;
  spiderExecutionStatus?: string;
  spiderMaxDepthReached?: number;
  spiderCollectedCount?: number;
  spiderUrlTotal?: number;
  spiderUrlCompleted?: number;
  spiderStartedAt?: string;
  spiderFinishedAt?: string;
  spiderErrorMessage?: string;
  createTime?: string;
}

/** 执行进度（来自 /executions/status） */
export interface ExecutionStatus {
  executionNo: string;
  spiderCode: string;
  status: string;
  completedCount: number;
  totalCount: number;
  collectedCount: number;
  maxDepthReached: number;
}

/* ========== 可视化编排（RelationGraph） ========== */

/**
 * 节点类型枚举（对应后端 SpiderNodeType）。
 */
export type SpiderNodeType =
  | 'start'
  | 'request'
  | 'extract'
  | 'loop'
  | 'output'
  | 'script'
  | 'db'
  | 'sql'
  | 'function'
  | 'stop';

/**
 * RelationGraph 节点描述（前端画布节点）。
 */
export interface FlowNode {
  id: string;
  type: SpiderNodeType;
  name: string;
  x: number;
  y: number;
  data: Record<string, unknown>;
}

/**
 * RelationGraph 连线（前端画布边）。
 */
export interface FlowEdge {
  id?: string;
  from: string;
  to: string;
  text?: string;
  priority?: number;
  condField?: string;
  condOp?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'empty' | 'notEmpty';
  condValue?: string;
}

/**
 * 流程定义（含完整 graph）。
 */
export interface SpiderFlow {
  flowId?: number;
  flowCode: string;
  flowName: string;
  flowVersion?: number;
  flowGraphJson?: string;
  flowNodeCount?: number;
  flowStatus?: number;
  flowRemark?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 流程节点持久化结构（对应 spider_flow_node）。
 */
export interface FlowNodeEntity {
  flowNodeId?: number;
  flowId?: number;
  flowNodeKey: string;
  flowNodeType: SpiderNodeType;
  flowNodeName: string;
  flowNodeX?: number;
  flowNodeY?: number;
  flowNodeConfig?: string;
  flowNodeStatus?: number;
}

/**
 * 流程边持久化结构（对应 spider_flow_edge）。
 */
export interface FlowEdgeEntity {
  flowEdgeId?: number;
  flowId?: number;
  flowEdgeFrom: string;
  flowEdgeTo: string;
  flowEdgeText?: string;
  flowEdgePriority?: number;
  flowEdgeCondField?: string;
  flowEdgeCondOp?: string;
  flowEdgeCondValue?: string;
}

/**
 * 流程聚合视图（保存 / 加载时使用）。
 */
export interface FlowAggregate {
  flow: SpiderFlow;
  nodes: FlowNodeEntity[];
  edges: FlowEdgeEntity[];
}

/**
 * 节点执行日志（用于调试面板回放）。
 */
export interface FlowNodeLog {
  flowNodeLogId?: number;
  flowExecutionNo: string;
  flowId?: number;
  flowNodeKey?: string;
  flowNodeType?: string;
  flowNodeStatus?: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  flowNodeMessage?: string;
  flowNodeCostMs?: number;
  createTime?: string;
}

/**
 * 流程历史快照。
 */
export interface FlowHistory {
  flowHistoryId?: number;
  flowId?: number;
  flowVersion?: number;
  flowGraphJson?: string;
  flowChangeNote?: string;
  flowChangeUser?: string;
  createTime?: string;
}