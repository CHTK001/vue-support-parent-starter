import { http } from "@repo/utils";

type SpiderRequestOptions = {
  url: string;
  method: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
};

function request<T = any>(options: SpiderRequestOptions) {
  return http.request<T>(options.method as any, options.url, {
    params: options.params,
    data: options.data,
    headers: options.headers,
  });
}

export interface SpiderTask {
  spiderTaskId?: number;
  spiderTaskName: string;
  spiderTaskDesc?: string;
  spiderTaskUrl: string;
  spiderTaskUrlPattern?: string;
  spiderTaskExtractRules?: string;
  spiderTaskSelectorType?: string;
  spiderTaskStatus?: number;
  spiderTaskScheduleType?: string;
  spiderTaskCron?: string;
  spiderTaskThreadNum?: number;
  spiderTaskSleepTime?: number;
  spiderTaskRetryTimes?: number;
  spiderTaskTimeout?: number;
  spiderTaskHeaders?: string;
  spiderTaskCookies?: string;
  spiderTaskUserAgent?: string;
  spiderTaskProxy?: string;
  spiderTaskMaxDepth?: number;
  spiderTaskEnableUrlDiscover?: boolean;
  spiderTaskPagePattern?: string;
  spiderTaskMaxPages?: number;
  spiderTaskIncrementalMode?: string;
  spiderTaskRateLimit?: number;
  spiderTaskPipelineType?: string;
  spiderTaskPipelineConfig?: string;
  spiderTaskLastRunTime?: string;
  spiderTaskNextRunTime?: string;
  spiderTaskRunStatus?: string;
  spiderTaskTotalSuccess?: number;
  spiderTaskTotalFail?: number;
  spiderTaskJobId?: number;
  createTime?: string;
  updateTime?: string;
}

export interface SpiderNode {
  nodeId?: number;
  spiderTaskId?: number;
  nodeKey?: string;
  nodeName: string;
  nodeType: string;
  spiName: string;
  nodeConfig?: string;
  nodeDescription?: string;
  positionX?: number;
  positionY?: number;
  nodeOrder?: number;
  nodeEnabled?: boolean;
  requiresConfig?: boolean;
  createTime?: string;
  updateTime?: string;
}

export interface SpiderConnection {
  connectionId?: number;
  spiderTaskId?: number;
  sourceNodeId: number;
  targetNodeId: number;
  sourcePort?: string;
  targetPort?: string;
  connectionType?: string;
  connectionLabel?: string;
  createTime?: string;
}

export interface SpiderTaskDesign {
  taskId?: number;
  nodes: SpiderNode[];
  connections: SpiderConnection[];
}

export interface SpiderSpiParameter {
  name: string;
  label: string;
  description?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "select"
    | "password"
    | "textarea"
    | "json"
    | "urls";
  defaultValue?: any;
  required?: boolean;
  sensitive?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: string;
  group?: string;
  order?: number;
}

export interface SpiderSpiInfo {
  name: string;
  displayName: string;
  description?: string;
  type: string;
  icon?: string;
  color?: string;
  order?: number;
  available?: boolean;
  parameters?: SpiderSpiParameter[];
}

export interface SpiderSpiTypeList {
  urlSource: SpiderSpiInfo[];
  downloader: SpiderSpiInfo[];
  processor: SpiderSpiInfo[];
  middleware: SpiderSpiInfo[];
  dataFilter: SpiderSpiInfo[];
  pipeline: SpiderSpiInfo[];
  scheduler: SpiderSpiInfo[];
  siteConfig: SpiderSpiInfo[];
  proxyPool: SpiderSpiInfo[];
  uaPool: SpiderSpiInfo[];
}

export interface HtmlTreeNode {
  tag: string;
  displayName?: string;
  id?: string;
  class?: string;
  xpath: string;
  cssSelector?: string;
  text?: string;
  ownText?: string;
  attributes?: Record<string, string>;
  htmlSnippet?: string;
  hasChildren?: boolean;
  depth?: number;
  childCount?: number;
  childrenTruncated?: boolean;
  truncatedCount?: number;
  children?: HtmlTreeNode[];
}

export interface SelectorTestRequest {
  url?: string;
  html?: string;
  selector: string;
  type: string;
}

export interface XPathGenerateRequest {
  url?: string;
  elementPath: string;
}

export interface SpiderStatistics {
  totalCount: number;
  runningCount: number;
  enabledCount: number;
  todayDataCount: number;
  totalDataCount: number;
}

export interface SpiderTableStatus {
  ready: boolean;
  tables: Record<string, boolean>;
  missingTables?: string[];
  missingColumns?: Record<string, string[]>;
}

export interface SpiderDataSourceOption {
  builtin?: boolean;
  settingId?: number | null;
  name: string;
  type?: string;
  url?: string;
  database?: string;
  enabled?: boolean;
}

export interface SpiderOutputColumnDefinition {
  name: string;
  type: string;
  length?: number | null;
  scale?: number | null;
  nullable?: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  comment?: string;
  sourceField?: string;
  xpath?: string;
}

export interface SpiderOutputTableRequest {
  dataSourceSettingId?: number | null;
  tableComment?: string;
  columns: SpiderOutputColumnDefinition[];
}

export interface TableStructureColumnInfo {
  name: string;
  dataType?: string;
  fullType?: string;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  nullable?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  defaultValue?: string;
  comment?: string;
  ordinalPosition?: number | null;
}

export interface TableStructureIndexInfo {
  name: string;
  type?: string;
  unique?: boolean;
  columns?: string[];
  comment?: string;
}

export interface TableStructureInfo {
  tableName?: string;
  tableComment?: string;
  tableType?: string;
  engine?: string;
  charset?: string;
  collation?: string;
  rowCount?: number | null;
  dataSize?: number | null;
  indexSize?: number | null;
  createTime?: string;
  updateTime?: string;
  columns?: TableStructureColumnInfo[];
  indexes?: TableStructureIndexInfo[];
  primaryKeys?: string[];
  createTableDdl?: string;
}

export interface SpiderPageResult<T> {
  records?: T[];
  total?: number;
}

export interface SpiderResponse<T> {
  code?: string | number;
  msg?: string;
  message?: string;
  success?: boolean;
  data?: T;
}

export const TASK_STATUS_OPTIONS = [
  { value: 0, label: "停用" },
  { value: 1, label: "启用" },
  { value: 2, label: "运行中" },
];

export const SCHEDULE_TYPES = [
  { value: "NONE", label: "一次性执行" },
  { value: "CRON", label: "定时任务" },
];

export const INCREMENTAL_MODES = [
  { value: "NONE", label: "全量爬取" },
  { value: "TIME", label: "按时间增量" },
  { value: "HASH", label: "按哈希去重" },
];

export const SELECTOR_TYPES = [
  { value: "XPATH", label: "XPath" },
  { value: "CSS", label: "CSS" },
  { value: "REGEX", label: "Regex" },
  { value: "JSON_PATH", label: "JSONPath" },
];

export const PIPELINE_TYPES = [
  { value: "CONSOLE", label: "控制台" },
  { value: "FILE", label: "文件" },
  { value: "JSON", label: "JSON" },
  { value: "DATABASE", label: "数据库" },
];

export const COLUMN_TYPE_OPTIONS = [
  "VARCHAR",
  "CHAR",
  "TEXT",
  "INT",
  "BIGINT",
  "DECIMAL",
  "FLOAT",
  "DOUBLE",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "JSON",
  "BLOB",
];

export const SPIDER_NODE_CATEGORIES = [
  { type: "URL_SOURCE", label: "URL源", color: "#1d9a6c", catalogKey: "urlSource" },
  { type: "DOWNLOADER", label: "下载器", color: "#1764d5", catalogKey: "downloader" },
  { type: "PROCESSOR", label: "处理器", color: "#c7650e", catalogKey: "processor" },
  { type: "MIDDLEWARE", label: "中间件", color: "#8e44ad", catalogKey: "middleware" },
  { type: "DATA_FILTER", label: "数据过滤器", color: "#0089b3", catalogKey: "dataFilter" },
  { type: "PIPELINE", label: "数据输出", color: "#d63d73", catalogKey: "pipeline" },
  { type: "SCHEDULER", label: "调度器", color: "#576574", catalogKey: "scheduler" },
  { type: "SITE_CONFIG", label: "站点配置", color: "#8d5d35", catalogKey: "siteConfig" },
  { type: "PROXY_POOL", label: "代理池", color: "#0b8a7b", catalogKey: "proxyPool" },
  { type: "UA_POOL", label: "UA池", color: "#5d3fd3", catalogKey: "uaPool" },
] as const;

export function listSpiderTasks(params?: Record<string, any>) {
  return request<SpiderPageResult<SpiderTask>>({
    url: "/v1/spider/page",
    method: "get",
    params,
  });
}

export function getSpiderTask(id: number) {
  return request<SpiderTask>({
    url: `/v1/spider/${id}`,
    method: "get",
  });
}

export function createSpiderTask(data: SpiderTask) {
  return request<SpiderTask>({
    url: "/v1/spider/save",
    method: "post",
    data,
  });
}

export function updateSpiderTask(data: SpiderTask) {
  return request<boolean>({
    url: "/v1/spider/update",
    method: "put",
    data,
  });
}

export function deleteSpiderTask(spiderTaskId: number) {
  return request<boolean>({
    url: "/v1/spider/delete",
    method: "delete",
    params: { spiderTaskId },
  });
}

export function runSpiderTask(id: number) {
  return request<boolean>({
    url: `/v1/spider/run/${id}`,
    method: "post",
  });
}

export function stopSpiderTask(id: number) {
  return request<boolean>({
    url: `/v1/spider/stop/${id}`,
    method: "post",
  });
}

export function getSpiderStatistics() {
  return request<SpiderStatistics>({
    url: "/v1/spider/statistics",
    method: "get",
  });
}

export function getSpiderTaskLogs(taskId: number, page = 1, size = 20) {
  return request<{ data?: any[]; total?: number }>({
    url: `/v1/spider/logs/${taskId}`,
    method: "get",
    params: { page, size },
  });
}

export function getSpiderTableStatus() {
  return request<SpiderTableStatus>({
    url: "/v1/spider/table/status",
    method: "get",
  });
}

export function initializeSpiderTables(force = false) {
  return request<boolean>({
    url: "/v1/spider/table/initialize",
    method: "post",
    params: { force },
  });
}

export function getSpiderDataSourceOptions() {
  return request<SpiderDataSourceOption[]>({
    url: "/v1/spider/data-source/options",
    method: "get",
  });
}

export function previewSpiderUrl(url: string) {
  return request<{
    html?: string;
    bodyHtml?: string;
    title?: string;
    baseUrl?: string;
    url?: string;
  }>({
    url: "/v1/spider/preview",
    method: "get",
    params: { url },
  });
}

export function parseSpiderHtml(
  url: string,
  params?: { maxDepth?: number; maxChildren?: number },
) {
  return request<{
    tree?: HtmlTreeNode;
    rawHtml?: string;
    title?: string;
    baseUrl?: string;
    nodeCount?: number;
    maxDepth?: number;
    maxChildren?: number;
  }>({
    url: "/v1/spider/parse-html",
    method: "get",
    params: {
      url,
      ...params,
    },
  });
}

export function testSpiderSelector(data: SelectorTestRequest) {
  return request<string[]>({
    url: "/v1/spider/test-selector",
    method: "post",
    data,
  });
}

export function inspectSpiderSelector(data: SelectorTestRequest) {
  return request<
    Array<{
      tag?: string;
      displayName?: string;
      id?: string;
      class?: string;
      xpath?: string;
      cssSelector?: string;
      text?: string;
      ownText?: string;
      attributes?: Record<string, string>;
      htmlSnippet?: string;
      hasChildren?: boolean;
    }>
  >({
    url: "/v1/spider/inspect-selector",
    method: "post",
    data,
  });
}

export function generateSpiderXpath(data: XPathGenerateRequest) {
  return request<string>({
    url: "/v1/spider/generate-xpath",
    method: "post",
    data,
  });
}

export function getSpiderSpiTypes() {
  return request<SpiderSpiTypeList>({
    url: "/v1/spider/spi/types",
    method: "get",
  });
}

export function getSpiderSpiParameters(spiType: string, spiName: string) {
  return request<SpiderSpiParameter[]>({
    url: "/v1/spider/spi/parameters",
    method: "get",
    params: { spiType, spiName },
  });
}

export function getSpiderDesign(taskId: number) {
  return request<SpiderTaskDesign>({
    url: `/v1/spider/design/${taskId}`,
    method: "get",
  });
}

export function saveSpiderDesign(taskId: number, data: SpiderTaskDesign) {
  return request<boolean>({
    url: `/v1/spider/design/${taskId}`,
    method: "post",
    data,
  });
}

export function validateSpiderDesign(taskId: number) {
  return request<string[]>({
    url: `/v1/spider/design/${taskId}/validate`,
    method: "get",
  });
}

export function clearSpiderDesign(taskId: number) {
  return request<boolean>({
    url: `/v1/spider/design/${taskId}`,
    method: "delete",
  });
}

export function addSpiderNode(taskId: number, data: SpiderNode) {
  return request<number>({
    url: `/v1/spider/design/${taskId}/nodes`,
    method: "post",
    data,
  });
}

export function updateSpiderNode(nodeId: number, data: SpiderNode) {
  return request<boolean>({
    url: `/v1/spider/design/nodes/${nodeId}`,
    method: "put",
    data,
  });
}

export function deleteSpiderNode(nodeId: number) {
  return request<boolean>({
    url: `/v1/spider/design/nodes/${nodeId}`,
    method: "delete",
  });
}

export function updateSpiderNodePositions(
  taskId: number,
  data: Array<{ nodeId: number; x: number; y: number }>,
) {
  return request<boolean>({
    url: `/v1/spider/design/${taskId}/nodes/positions`,
    method: "put",
    data,
  });
}

export function addSpiderConnection(taskId: number, data: SpiderConnection) {
  return request<number>({
    url: `/v1/spider/design/${taskId}/connections`,
    method: "post",
    data,
  });
}

export function deleteSpiderConnection(connectionId: number) {
  return request<boolean>({
    url: `/v1/spider/design/connections/${connectionId}`,
    method: "delete",
  });
}

export function checkSpiderOutputTableExists(
  tableName: string,
  data?: Partial<SpiderOutputTableRequest>,
) {
  return request<boolean>({
    url: "/v1/spider/output/table/exists",
    method: "post",
    params: { tableName },
    data,
  });
}

export function previewSpiderOutputTableSql(
  tableName: string,
  data: SpiderOutputTableRequest,
  dbType = "mysql",
) {
  return request<string>({
    url: "/v1/spider/output/table/preview-sql",
    method: "post",
    params: { tableName, dbType },
    data,
  });
}

export function createSpiderOutputTable(
  tableName: string,
  data: SpiderOutputTableRequest,
  dbType = "mysql",
) {
  return request<boolean>({
    url: "/v1/spider/output/table/create",
    method: "post",
    params: { tableName, dbType },
    data,
  });
}

export function getSpiderOutputTableStructure(
  tableName: string,
  data?: Partial<SpiderOutputTableRequest>,
) {
  return request<TableStructureInfo>({
    url: "/v1/spider/output/table/structure",
    method: "post",
    params: { tableName },
    data,
  });
}

export function syncSpiderOutputTableStructure(
  tableName: string,
  data: SpiderOutputTableRequest,
  dbType = "mysql",
) {
  return request<boolean>({
    url: "/v1/spider/output/table/sync-structure",
    method: "post",
    params: { tableName, dbType },
    data,
  });
}
