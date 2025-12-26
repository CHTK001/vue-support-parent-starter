import { http, type ReturnResult } from "@repo/utils";

/**
 * 爬虫任务相关接口
 */

// ==================== 类型定义 ====================

/**
 * 爬虫任务实体
 */
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
  // 新增字段
  spiderTaskMaxDepth?: number;         // 最大爬取深度
  spiderTaskEnableUrlDiscover?: boolean; // 是否启用URL自动发现
  spiderTaskPagePattern?: string;      // 分页URL模式
  spiderTaskMaxPages?: number;         // 最大分页数
  spiderTaskIncrementalMode?: string;  // 增量爬取模式: NONE/TIME/HASH
  spiderTaskRateLimit?: number;        // 速率限制(请求/分钟)
  spiderTaskPipelineType?: string;
  spiderTaskPipelineConfig?: string;
  spiderTaskLastRunTime?: string;
  spiderTaskNextRunTime?: string;
  spiderTaskRunStatus?: string;  // 运行状态: IDLE/RUNNING/STOPPED/ERROR
  spiderTaskTotalSuccess?: number;  // 成功数量
  spiderTaskTotalFail?: number;     // 失败数量
  spiderTaskJobId?: number;
  createTime?: string;
  updateTime?: string;
}

/**
 * 数据提取规则
 */
export interface ExtractRule {
  name: string;           // 字段名称
  selector: string;       // 选择器表达式
  type: 'XPATH' | 'CSS' | 'REGEX' | 'JSON_PATH';  // 选择器类型
  multi?: boolean;        // 是否多值
  required?: boolean;     // 是否必须
  defaultValue?: string;  // 默认值
}

/**
 * HTML节点
 */
export interface HtmlNode {
  tag: string;
  attributes: Record<string, string>;
  text?: string;
  xpath: string;
  cssPath: string;
  children?: HtmlNode[];
}

/**
 * 选择器测试请求
 */
export interface SelectorTestRequest {
  url: string;
  selector: string;
  type: string;
}

/**
 * XPath生成请求
 */
export interface XPathGenerateRequest {
  url: string;
  elementPath: string;
}

// ==================== API 函数 ====================

/**
 * 获取爬虫任务分页列表
 */
export function getSpiderTaskPageList(params: any) {
  return http.request<ReturnResult<{ records: SpiderTask[]; total: number }>>(
    "get",
    "v1/spider/page",
    { params }
  );
}

/**
 * 获取爬虫任务详情
 */
export function getSpiderTaskById(id: number) {
  return http.request<ReturnResult<SpiderTask>>(
    "get",
    `v1/spider/${id}`
  );
}

/**
 * 创建爬虫任务
 */
export function createSpiderTask(data: SpiderTask) {
  return http.request<ReturnResult<SpiderTask>>(
    "post",
    "v1/spider/save",
    { data }
  );
}

/**
 * 更新爬虫任务
 */
export function updateSpiderTask(data: SpiderTask) {
  return http.request<ReturnResult<boolean>>(
    "put",
    "v1/spider/update",
    { data }
  );
}

/**
 * 删除爬虫任务
 */
export function deleteSpiderTask(id: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `v1/spider/delete`,
    { params: { spiderTaskId: id } }
  );
}

/**
 * 预览网页内容
 */
export function previewUrl(url: string) {
  return http.request<ReturnResult<{ html: string; title: string; baseUrl: string }>>(
    "get",
    "v1/spider/preview",
    { params: { url } }
  );
}

/**
 * 解析HTML结构
 */
export function parseHtml(url: string) {
  return http.request<ReturnResult<{ tree: HtmlNode; rawHtml: string }>>(
    "get",
    "v1/spider/parse-html",
    { params: { url } }
  );
}

/**
 * 测试选择器
 */
export function testSelector(request: SelectorTestRequest) {
  return http.request<ReturnResult<string[]>>(
    "post",
    "v1/spider/test-selector",
    { data: request }
  );
}

/**
 * 生成XPath
 */
export function generateXpath(request: XPathGenerateRequest) {
  return http.request<ReturnResult<string>>(
    "post",
    "v1/spider/generate-xpath",
    { data: request }
  );
}

/**
 * 立即运行爬虫任务
 */
export function runSpiderTask(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/spider/run/${id}`
  );
}

/**
 * 停止爬虫任务
 */
export function stopSpiderTask(id: number) {
  return http.request<ReturnResult<boolean>>(
    "post",
    `v1/spider/stop/${id}`
  );
}

/**
 * 获取爬虫任务运行状态
 */
export function getSpiderTaskStatus(id: number) {
  return http.request<ReturnResult<{
    status: number;
    statusDesc: string;
    progress: number;
    currentUrl?: string;
    pageCount: number;
    successCount: number;
    failCount: number;
  }>>(
    "get",
    `v1/spider/status/${id}`
  );
}

/**
 * 获取爬虫任务日志
 */
export function getSpiderTaskLogs(id: number, page: number = 1, size: number = 20) {
  return http.request<ReturnResult<{ data: any[]; total: number }>>(
    "get",
    `v1/spider/logs/${id}`,
    { params: { page, size } }
  );
}

/**
 * 获取爬取的数据
 */
export function getSpiderTaskData(id: number, page: number = 1, size: number = 20) {
  return http.request<ReturnResult<{ data: any[]; total: number }>>(
    "get",
    `v1/spider/data/${id}`,
    { params: { page, size } }
  );
}

/**
 * 导出爬取的数据
 */
export function exportSpiderTaskData(id: number, format: string = "json") {
  return http.request<ReturnResult<string>>(
    "get",
    `v1/spider/export/${id}`,
    { params: { format } }
  );
}

/**
 * 清空爬取的数据
 */
export function clearSpiderTaskData(id: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `v1/spider/data/${id}`
  );
}

/**
 * 获取爬虫任务统计信息
 */
export function getSpiderTaskStatistics() {
  return http.request<ReturnResult<{
    totalCount: number;
    runningCount: number;
    enabledCount: number;
    todayDataCount: number;
    totalDataCount: number;
  }>>(
    "get",
    "v1/spider/statistics"
  );
}

/**
 * 删除单条爬取数据
 */
export function deleteSpiderData(taskId: number, dataId: number) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `v1/spider/data/${taskId}/${dataId}`
  );
}

/**
 * 切换任务状态
 */
export function toggleTaskStatus(id: number) {
  return http.request<ReturnResult<boolean>>(
    "put",
    `v1/spider/toggle-status/${id}`
  );
}

/**
 * 下载导出数据
 */
export function downloadExportData(id: number, format: string = "json") {
  return `${import.meta.env.VITE_API_BASE_URL || ''}/v1/spider/download/${id}?format=${format}`;
}

/**
 * 批量运行任务
 */
export function batchRunTasks(taskIds: number[]) {
  return http.request<ReturnResult<{ success: number; failed: number; errors: string[] }>>(
    "post",
    "v1/spider/batch/run",
    { data: { taskIds } }
  );
}

/**
 * 批量停止任务
 */
export function batchStopTasks(taskIds: number[]) {
  return http.request<ReturnResult<{ success: number; failed: number }>>(
    "post",
    "v1/spider/batch/stop",
    { data: { taskIds } }
  );
}

/**
 * 批量删除任务
 */
export function batchDeleteTasks(taskIds: number[]) {
  return http.request<ReturnResult<{ success: number; failed: number; errors: string[] }>>(
    "delete",
    "v1/spider/batch/delete",
    { data: { taskIds } }
  );
}

/**
 * 批量切换状态
 */
export function batchToggleStatus(taskIds: number[], status: number) {
  return http.request<ReturnResult<{ success: number; failed: number }>>(
    "put",
    "v1/spider/batch/toggle-status",
    { data: { taskIds, status } }
  );
}

/**
 * 克隆任务
 */
export function cloneTask(id: number) {
  return http.request<ReturnResult<SpiderTask>>(
    "post",
    `v1/spider/clone/${id}`
  );
}

// ==================== 常量定义 ====================

/**
 * 任务状态
 */
export const TASK_STATUS = {
  DISABLED: 0,
  ENABLED: 1,
  RUNNING: 2
} as const;

export const TASK_STATUS_MAP: Record<number, { text: string; color: string }> = {
  [TASK_STATUS.DISABLED]: { text: "停用", color: "info" },
  [TASK_STATUS.ENABLED]: { text: "启用", color: "success" },
  [TASK_STATUS.RUNNING]: { text: "运行中", color: "warning" }
};

/**
 * 选择器类型
 */
export const SELECTOR_TYPES = [
  { value: "XPATH", label: "XPath选择器" },
  { value: "CSS", label: "CSS选择器" },
  { value: "REGEX", label: "正则表达式" },
  { value: "JSON_PATH", label: "JsonPath选择器" }
];

/**
 * 调度类型
 */
export const SCHEDULE_TYPES = [
  { value: "NONE", label: "一次性" },
  { value: "CRON", label: "定时任务" }
];

/**
 * Pipeline类型
 */
export const PIPELINE_TYPES = [
  { value: "CONSOLE", label: "控制台输出" },
  { value: "FILE", label: "文件存储" },
  { value: "JSON", label: "JSON文件" },
  { value: "DATABASE", label: "数据库存储" }
];

/**
 * 增量爬取模式
 */
export const INCREMENTAL_MODES = [
  { value: "NONE", label: "全量爬取" },
  { value: "TIME", label: "按时间增量" },
  { value: "HASH", label: "按哈希去重" }
];
