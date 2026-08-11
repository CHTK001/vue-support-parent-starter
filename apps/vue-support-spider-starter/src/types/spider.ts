/**
 * 后端接口统一返回结构。
 */
export interface ReturnResult<T = unknown> {
  code: string;
  msg: string;
  data: T;
  success: boolean;
  ok: boolean;
}

/**
 * MyBatis-Plus 分页结果。
 */
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/**
 * 爬虫定义。
 */
export interface SpiderDefinition {
  spiderId?: number;
  spiderCode: string;
  spiderName: string;
  spiderEntryUrl: string;
  spiderExecutorType?: string;
  spiderExecutorRounds?: number;
  spiderCollectDeepUrl?: number;
  spiderMaxDepth?: number;
  spiderMaxPages?: number;
  spiderDedupStrategy?: string;
  spiderUrlStorageType?: string;
  spiderStatus?: number;
  spiderDescription?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 爬虫定义保存请求体。
 */
export interface SpiderDefinitionSaveRequest extends SpiderDefinition {}

/**
 * 采集数据记录。
 */
export interface SpiderDataRecord {
  id?: number;
  spiderDefinitionCode: string;
  spiderExecutionNo?: string;
  spiderDepth?: number;
  spiderUrl?: string;
  spiderTitle?: string;
  spiderContent?: string;
  createTime?: string;
}

/**
 * 执行记录。
 */
export interface SpiderExecutionRecord {
  id?: number;
  spiderDefinitionCode: string;
  spiderExecutionNo?: string;
  spiderStatus?: string;
  spiderTotalPages?: number;
  spiderSuccessPages?: number;
  spiderFailedPages?: number;
  spiderStartTime?: string;
  spiderEndTime?: string;
  createTime?: string;
}