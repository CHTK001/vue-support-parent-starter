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

const SPIDER_API_BASE = "";

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

export async function getSpiderExecutionDetail(spiderExecutionNo: string) {
  const query = new URLSearchParams({ spiderExecutionNo });
  return requestJson<import("../../types/orchestration").SpiderExecutionDetailView>(
    `/spider/executions/detail?${query.toString()}`,
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
