/**
<<<<<<< HEAD
 * 通用后端响应：{ code, data, msg, success }
 */
export interface ApiResult<T = unknown> {
  code: string;
  data: T;
  msg: string;
  success: boolean;
}

/**
 * 分页响应。
=======
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
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
 */
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/**
<<<<<<< HEAD
 * 单个代理节点。
 */
export interface SpiderProxy {
  proxyHost: string;
  proxyPort: number;
  proxyProtocol?: string;
  proxyUsername?: string;
  proxyPassword?: string;
}

/**
 * 代理池。
 */
export interface SpiderProxyPool {
  poolId?: number;
  poolCode: string;
  poolName: string;
  poolStrategy?: string;
  poolStatus?: number;
  proxies: SpiderProxy[];
}

/**
 * 爬虫定义。
=======
 * 爬虫定义实体（用于前端展示）。
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
 */
export interface SpiderDefinition {
  spiderId?: number;
  spiderCode: string;
  spiderName: string;
  spiderEntryUrl: string;
<<<<<<< HEAD
  spiderMaxDepth?: number;
  spiderMaxPages?: number;
  spiderStatus?: number;
  spiderScheduleEnable?: number;
  spiderScheduleCron?: string;
  spiderProxyPoolEnable?: number;
  spiderProxyPoolCode?: string;
  spiderCookies?: string;
  spiderHeaders?: string;
=======
  spiderExecutorType?: string;
  spiderExecutorRounds?: number;
  spiderCollectDeepUrl?: number;
  spiderMaxDepth?: number;
  spiderMaxPages?: number;
  spiderDedupStrategy?: string;
  spiderUrlStorageType?: string;
  spiderStatus?: number;
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
  spiderDescription?: string;
  createTime?: string;
  updateTime?: string;
}

/**
<<<<<<< HEAD
 * 执行记录。
 */
export interface ExecutionRecord {
  executionNo?: string;
  spiderCode?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  errorMessage?: string | null;
  resultCount?: number | null;
  resultsJson?: string | null;
}

/**
 * 单条抓取结果（与后端 SpiderResult 简化字段对应）。
 */
export interface SpiderResultItem {
  title?: string;
  url?: string;
  depth?: number;
  text?: string;
  structured?: Record<string, unknown>;
  links?: string[];
  aiSummary?: string;
}
=======
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
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
