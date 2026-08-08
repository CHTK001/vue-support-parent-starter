/**
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
 */
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/**
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
 */
export interface SpiderDefinition {
  spiderId?: number;
  spiderCode: string;
  spiderName: string;
  spiderEntryUrl: string;
  spiderMaxDepth?: number;
  spiderMaxPages?: number;
  spiderStatus?: number;
  spiderScheduleEnable?: number;
  spiderScheduleCron?: string;
  spiderProxyPoolEnable?: number;
  spiderProxyPoolCode?: string;
  spiderCookies?: string;
  spiderHeaders?: string;
  spiderDescription?: string;
  createTime?: string;
  updateTime?: string;
}

/**
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
