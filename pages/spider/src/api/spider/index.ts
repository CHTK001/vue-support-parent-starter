export * from "../../types/orchestration";

export interface SpiderNodeRequirement {
  type: string;
  title: string;
  detail: string;
}

export const spiderNodeRequirements: SpiderNodeRequirement[] = [
  {
    type: "START",
    title: "开始节点",
    detail: "每条编排必须有且仅有一个开始节点。",
  },
  {
    type: "URL_PARSE",
    title: "URL 解析节点",
    detail: "默认直接抽取 a 标签，同时支持规则补充、AI 参与解析和 AI 辅助筛选。",
  },
  {
    type: "DATA_PARSE",
    title: "数据解析节点",
    detail: "支持 XPath、CSS、AI、可视化四种模式，并要求字段映射。",
  },
  {
    type: "PAGE_ACCESS",
    title: "页面访问节点",
    detail: "支持 HTTP 与 Playwright，并承载登录态、Cookie、代理和重试。",
  },
  {
    type: "DOWNLOADER",
    title: "文档下载器节点",
    detail: "支持普通下载器与 AI 下载/识别链路。",
  },
  {
    type: "HUMAN_INTERVENE",
    title: "人工介入节点",
    detail: "运行时可自动派生步骤和人工任务，并参与完整执行链路。",
  },
  {
    type: "SUB_FLOW",
    title: "子流程节点",
    detail: "用于详情页、登录页、验证码页等跨页面链路，默认每个爬虫内部私有。",
  },
  {
    type: "END",
    title: "结束节点",
    detail: "每条编排必须有结束节点，用于收束状态与结果。",
  },
];

export const spiderDefinitionSamples = [
  {
    spiderCode: "news-portal",
    spiderName: "新闻门户采集",
    spiderEntryUrl: "https://example.com/news",
    spiderSiteHost: "example.com",
    spiderExecutorType: "CRON",
    spiderExecutorRounds: 1,
    spiderCollectDeepUrl: true,
    spiderNotifyOnFailure: true,
    spiderDedupStrategy: "URL_FINGERPRINT",
    spiderUrlStorageType: "DATABASE",
    spiderStatus: "ENABLED",
  },
  {
    spiderCode: "policy-bulletin",
    spiderName: "政策公告采集",
    spiderEntryUrl: "https://example.gov.cn/bulletin",
    spiderSiteHost: "example.gov.cn",
    spiderExecutorType: "ONCE",
    spiderExecutorRounds: 1,
    spiderCollectDeepUrl: false,
    spiderNotifyOnFailure: false,
    spiderDedupStrategy: "NORMALIZED_URL",
    spiderUrlStorageType: "REDIS",
    spiderStatus: "DISABLED",
  },
] as const;

export interface SpiderApiResult<T> {
  code?: number;
  msg?: string;
  message?: string;
  data: T;
}

const SPIDER_API_BASE = "/spider-api";

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SPIDER_API_BASE}${input}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Spider API request failed: ${response.status}`);
  }
  const result = (await response.json()) as SpiderApiResult<T> | T;
  if (typeof result === "object" && result !== null && "data" in result) {
    return (result as SpiderApiResult<T>).data;
  }
  return result as T;
}

export async function loadSpiderDashboardSummary() {
  return requestJson<import("../../types/orchestration").SpiderDashboardSummary>(
    "/spider/dashboard/summary",
  );
}

export async function listSpiderDefinitions() {
  return requestJson<import("../../types/orchestration").SpiderDefinition[]>(
    "/spider/definitions",
  );
}

export async function getSpiderDefinition(spiderCode: string) {
  const query = new URLSearchParams({ spiderCode });
  return requestJson<import("../../types/orchestration").SpiderDefinition>(
    `/spider/definitions/detail?${query.toString()}`,
  );
}

export async function createSpiderDefinition(
  payload: import("../../types/orchestration").SpiderDefinition,
) {
  return requestJson<import("../../types/orchestration").SpiderDefinition>(
    "/spider/definitions/save",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function updateSpiderDefinition(
  spiderCode: string,
  payload: import("../../types/orchestration").SpiderDefinition,
) {
  return requestJson<import("../../types/orchestration").SpiderDefinition>(
    "/spider/definitions/update",
    {
      method: "POST",
      body: JSON.stringify({ ...payload, spiderCode }),
    },
  );
}

export async function deleteSpiderDefinition(spiderCode: string) {
  const query = new URLSearchParams({ spiderCode });
  return requestJson<boolean>(
    `/spider/definitions/delete?${query.toString()}`,
    {
      method: "POST",
    },
  );
}

export async function updateSpiderDefinitionStatus(
  spiderCode: string,
  spiderStatus: number,
) {
  return requestJson<import("../../types/orchestration").SpiderDefinition>(
    "/spider/definitions/status",
    {
      method: "POST",
      body: JSON.stringify({ spiderCode, spiderStatus }),
    },
  );
}

export async function listSpiderFlows(spiderDefinitionCode: string) {
  const query = new URLSearchParams({ spiderDefinitionCode });
  return requestJson(`/spider/orchestration/flows?${query.toString()}`);
}

export async function listSpiderNodes(
  spiderDefinitionCode: string,
  spiderFlowVersion: number,
) {
  const query = new URLSearchParams({
    spiderDefinitionCode,
    spiderFlowVersion: String(spiderFlowVersion),
  });
  return requestJson(`/spider/orchestration/nodes?${query.toString()}`);
}

export async function getSpiderOrchestrationSchema(
  spiderDefinitionCode: string,
  spiderFlowVersion: number,
  orchestrationType?: string,
) {
  const query = new URLSearchParams({
    spiderDefinitionCode,
    spiderFlowVersion: String(spiderFlowVersion),
  });
  if (orchestrationType) {
    query.set("orchestrationType", orchestrationType);
  }
  return requestJson<import("../../types/orchestration").SpiderFlowSchema>(
    `/spider/orchestration/schema?${query.toString()}`,
  );
}

export async function saveSpiderOrchestrationSchema(
  payload: import("../../types/orchestration").SpiderFlowSchema,
) {
  return requestJson<import("../../types/orchestration").SpiderFlowSchema>(
    "/spider/orchestration/schema/save",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function aiGenerateFlow(
  payload: { spiderDefinitionCode: string; entryUrl: string; userGoal: string; spiderFlowName?: string },
) {
  return requestJson<import("../../types/orchestration").SpiderFlowSchema>(
    "/spider/orchestration/ai-generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function previewSpiderExecution(
  payload: import("../../types/orchestration").SpiderExecutionRequest,
) {
  return requestJson<import("../../types/orchestration").SpiderExecutionDetailView>(
    "/spider/executions/preview",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function runSpiderExecution(
  payload: import("../../types/orchestration").SpiderExecutionRequest,
) {
  return requestJson<import("../../types/orchestration").SpiderExecutionDetailView>(
    "/spider/executions/run",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function stopSpiderExecution(spiderExecutionNo: string) {
  const query = new URLSearchParams({ spiderExecutionNo });
  return requestJson<import("../../types/orchestration").SpiderExecutionDetailView>(
    `/spider/executions/stop?${query.toString()}`,
    {
      method: "POST",
    },
  );
}

export async function getSpiderExecutionDetail(spiderExecutionNo: string) {
  const query = new URLSearchParams({ spiderExecutionNo });
  return requestJson<import("../../types/orchestration").SpiderExecutionDetailView>(
    `/spider/executions/detail?${query.toString()}`,
  );
}

export async function listSpiderExecutionRecords(
  spiderDefinitionCode: string,
  limit = 10,
) {
  const query = new URLSearchParams({
    spiderDefinitionCode,
    limit: String(limit),
  });
  return requestJson<import("../../types/orchestration").SpiderExecutionRecordView[]>(
    `/spider/executions/list?${query.toString()}`,
  );
}

export async function getSpiderExecutionEvents(spiderExecutionNo: string) {
  const query = new URLSearchParams({ spiderExecutionNo });
  return requestJson<import("../../types/orchestration").SpiderExecutionEventView[]>(
    `/spider/executions/events?${query.toString()}`,
  );
}

export async function submitSpiderManualTask(
  payload: import("../../types/orchestration").SpiderManualTaskSubmitRequest,
) {
  return requestJson<import("../../types/orchestration").SpiderExecutionDetailView>(
    "/spider/executions/manual-task/submit",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function listSpiderExamples() {
  return requestJson<string[]>("/spider/examples");
}

export async function listSpiderPools(spiderPoolType?: import("../../types/orchestration").SpiderPoolType) {
  const query = spiderPoolType ? `?${new URLSearchParams({ spiderPoolType }).toString()}` : "";
  return requestJson<import("../../types/orchestration").SpiderPool[]>(`/spider/pools${query}`);
}

export async function saveSpiderPool(payload: import("../../types/orchestration").SpiderPool) {
  const query = new URLSearchParams({
    spiderPoolCode: payload.spiderPoolCode,
    spiderPoolName: payload.spiderPoolName,
    spiderPoolType: payload.spiderPoolType,
    spiderPoolStatus: String(payload.spiderPoolStatus ?? 1),
    spiderPoolRemark: payload.spiderPoolRemark || "",
  });
  return requestJson<import("../../types/orchestration").SpiderPool>(`/spider/pools/save/simple?${query.toString()}`);
}

export async function deleteSpiderPool(spiderPoolCode: string) {
  const query = new URLSearchParams({ spiderPoolCode });
  return requestJson<boolean>(`/spider/pools/delete?${query.toString()}`, { method: "POST" });
}

export async function listSpiderPoolItems(spiderPoolCode: string) {
  const query = new URLSearchParams({ spiderPoolCode });
  return requestJson<import("../../types/orchestration").SpiderPoolItem[]>(`/spider/pools/items?${query.toString()}`);
}

export async function saveSpiderPoolItem(payload: import("../../types/orchestration").SpiderPoolItem) {
  const query = new URLSearchParams({
    spiderPoolCode: payload.spiderPoolCode,
    spiderItemCode: payload.spiderItemCode,
    spiderItemName: payload.spiderItemName,
    spiderItemType: payload.spiderItemType || "",
    spiderItemPayload: payload.spiderItemPayload,
    spiderSortNum: String(payload.spiderSortNum ?? 0),
    spiderItemStatus: String(payload.spiderItemStatus ?? 1),
  });
  return requestJson<import("../../types/orchestration").SpiderPoolItem>(`/spider/pools/items/save/simple?${query.toString()}`);
}

export async function deleteSpiderPoolItem(spiderPoolCode: string, spiderItemCode: string) {
  const query = new URLSearchParams({ spiderPoolCode, spiderItemCode });
  return requestJson<boolean>(`/spider/pools/items/delete?${query.toString()}`, { method: "POST" });
}

export async function previewSpiderExample(spiderDefinitionCode: string) {
  return requestJson<import("../../types/orchestration").SpiderExecutionDetailView>(
    `/spider/examples/${spiderDefinitionCode}/preview`,
    {
      method: "POST",
    },
  );
}

export async function runSpiderExample(spiderDefinitionCode: string) {
  return requestJson<import("../../types/orchestration").SpiderExecutionDetailView>(
    `/spider/examples/${spiderDefinitionCode}/run`,
    {
      method: "POST",
    },
  );
}

export async function getSpiderExampleLatest(spiderDefinitionCode: string) {
  return requestJson<import("../../types/orchestration").SpiderExecutionDetailView | null>(
    `/spider/examples/${spiderDefinitionCode}/latest`,
  );
}

export interface SpiderParseResultView {
  spiderId: number;
  spiderDefinitionCode: string;
  spiderExecutionNo: string;
  spiderTargetUrl: string;
  spiderResultSchemaCode: string;
  spiderResultPayload: string;
  spiderResultStatus: string;
  createTime: string;
  resultTitle?: string;
  resultStatusCode?: number;
  resultFields?: Record<string, any>;
  resultContext?: Record<string, any>;
}

export async function listSpiderParseResults(
  spiderDefinitionCode: string,
  spiderExecutionNo?: string,
  limit = 50,
) {
  const params = new URLSearchParams({ spiderDefinitionCode, limit: String(limit) });
  if (spiderExecutionNo) params.set("spiderExecutionNo", spiderExecutionNo);
  return requestJson<SpiderParseResultView[]>(
    `/spider/parse-results/list?${params.toString()}`,
  );
}

export async function testSpiderPageAccess(
  payload: import("../../types/orchestration").SpiderPageAccessRequest,
) {
  return requestJson<import("../../types/orchestration").SpiderPageAccessView>(
    "/spider/runtime-test/page-access",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function testSpiderSelector(
  payload: import("../../types/orchestration").SpiderSelectorTestRequest,
) {
  return requestJson<import("../../types/orchestration").SpiderSelectorTestView>(
    "/spider/runtime-test/selector",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function testSpiderUrlParse(
  payload: import("../../types/orchestration").SpiderUrlParseTestRequest,
) {
  return requestJson<import("../../types/orchestration").SpiderUrlParseTestView>(
    "/spider/runtime-test/url-parse",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function testSpiderDataParse(
  payload: import("../../types/orchestration").SpiderDataParseTestRequest,
) {
  return requestJson<import("../../types/orchestration").SpiderDataParseTestView>(
    "/spider/runtime-test/data-parse",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

// ── 执行详情 ──

export async function getSpiderExecutionScreenshots(spiderExecutionNo: string) {
  return requestJson<import("../../types/orchestration").SpiderScreenshotView[]>(
    `/spider/executions/${encodeURIComponent(spiderExecutionNo)}/screenshots`,
  );
}

export async function getSpiderAgentDecisions(spiderExecutionNo: string) {
  return requestJson<import("../../types/orchestration").SpiderAgentDecisionView[]>(
    `/spider/executions/${encodeURIComponent(spiderExecutionNo)}/decisions`,
  );
}

// ── 数据表管理（中继表选择/创建） ──

export interface TableInfo {
  tableName: string;
  tableComment?: string;
  createTime?: string;
  tableRows?: number;
}

export interface ColumnInfo {
  columnName: string;
  columnType: string;
  nullable?: string;
  defaultValue?: string;
  columnComment?: string;
  extra?: string;
}

export async function listDatabaseTables() {
  return requestJson<TableInfo[]>("/spider/data-tables/tables-list");
}

export async function listTableColumns(tableName: string) {
  return requestJson<ColumnInfo[]>(`/spider/data-tables/${encodeURIComponent(tableName)}/columns`);
}

export async function createDatabaseTable(payload: {
  tableName: string;
  columns: Array<{ name: string; type: string; comment?: string }>;
  comment?: string;
}) {
  return requestJson<{ tableName: string; ddl: string }>("/spider/data-tables/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── 监控面板 ──

export interface SpiderMonitorDashboardView {
  definitions: SpiderDefinition[];
  executions: import("../../types/orchestration").SpiderExecutionRecordView[];
}

export interface SpiderDataRecordView {
  spiderId: number;
  spiderDefinitionCode: string;
  spiderExecutionNo: string;
  spiderTargetUrl: string;
  spiderDataCode: string;
  spiderDataName: string;
  spiderDataPayload: string;
  spiderDataStatus: string;
  createTime?: string;
}

export async function loadSpiderMonitorDashboard() {
  return requestJson<SpiderMonitorDashboardView>("/spider/monitor/dashboard");
}

export async function listSpiderMonitorProgress(
  spiderDefinitionCode: string,
  limit = 50,
) {
  const params = new URLSearchParams({ spiderDefinitionCode, limit: String(limit) });
  return requestJson<SpiderDataRecordView[]>(
    `/spider/monitor/progress?${params.toString()}`,
  );
}
