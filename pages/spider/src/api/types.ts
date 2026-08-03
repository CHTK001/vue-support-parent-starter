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