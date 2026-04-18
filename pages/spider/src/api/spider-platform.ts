import { http } from "@repo/utils";

export interface ReturnResult<T = any> {
  code: string | number;
  data: T;
  msg?: string;
  message?: string;
  timestamp?: number;
}

type SpiderRequestOptions = {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
};

const toErrorMessage = (error: unknown) => {
  if (error && typeof error === "object") {
    const row = error as Record<string, any>;
    return row.msg || row.message || "请求失败";
  }
  return "请求失败";
};

export async function spiderRequest<T = any>(
  options: SpiderRequestOptions,
): Promise<T> {
  try {
    const response = await http.request<ReturnResult<T>>(
      options.method.toLowerCase() as any,
      options.url,
      {
        params: options.params,
        data: options.data,
        headers: options.headers,
      },
    );
    const code = String(response?.code ?? "");
    if (code !== "200") {
      throw new Error(response?.msg || response?.message || `请求失败: ${code}`);
    }
    return response?.data as T;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export interface SpiderTask {
  id?: number;
  taskCode?: string;
  taskName: string;
  entryUrl: string;
  description?: string;
  tags?: string;
  authType?: string;
  executionType: "ONCE" | "REPEAT_N" | "SCHEDULED";
  executionPolicy?: string;
  aiProfile?: string;
  credentialRef?: string;
  status?: string;
  version?: number;
}

export interface SpiderFlowNode {
  nodeId: string;
  nodeType: string;
  label?: string;
  config?: Record<string, any>;
  aiAssistantConfig?: Record<string, any>;
  positionX?: number;
  positionY?: number;
}

export interface SpiderFlowEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface SpiderFlowGroup {
  groupId: string;
  title?: string;
  nodeIds?: string[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface SpiderFlowDefinition {
  id?: number;
  taskId?: number;
  nodes: SpiderFlowNode[];
  edges: SpiderFlowEdge[];
  groups?: SpiderFlowGroup[];
  version?: number;
}

export interface DashboardSummary {
  timerCount: number;
  taskTotal: number;
  latestTask: any;
  totalCrawled: number;
  totalUrlsCollected: number;
}

export interface RunningCard {
  taskId: number;
  taskName: string;
  status: string;
  executionType: string;
  lastExecuteTime: string;
  jobBound: boolean;
  aiEnabled: boolean;
  successCount: number;
  failureCount: number;
}

export interface WorkbenchTab {
  id?: number;
  tabType: "HOME" | "TASK";
  taskId?: number;
  title: string;
  closeable: boolean;
  sortOrder?: number;
}

export interface CreateTaskResult {
  taskId: number;
  flow: SpiderFlowDefinition;
}

export const getDashboardSummary = () =>
  spiderRequest<DashboardSummary>({
    url: "/v1/spider/dashboard/summary",
    method: "GET",
  });

export const getRunningCards = () =>
  spiderRequest<RunningCard[]>({
    url: "/v1/spider/dashboard/running-cards",
    method: "GET",
  });

export const createTask = () =>
  spiderRequest<CreateTaskResult>({ url: "/v1/spider/tasks", method: "POST" });

export const getTask = (taskId: number) =>
  spiderRequest<SpiderTask>({ url: `/v1/spider/tasks/${taskId}`, method: "GET" });

export const updateTask = (
  taskId: number,
  task: SpiderTask,
  flow?: SpiderFlowDefinition,
) =>
  spiderRequest<any>({
    url: `/v1/spider/tasks/${taskId}`,
    method: "PUT",
    data: { task, flow },
  });

export const deleteTask = (taskId: number) =>
  spiderRequest<any>({ url: `/v1/spider/tasks/${taskId}`, method: "DELETE" });

export const getFlow = (taskId: number) =>
  spiderRequest<SpiderFlowDefinition>({
    url: `/v1/spider/tasks/${taskId}/flow`,
    method: "GET",
  });

export const saveFlow = (taskId: number, flow: SpiderFlowDefinition) =>
  spiderRequest<any>({
    url: `/v1/spider/tasks/${taskId}/flow`,
    method: "PUT",
    data: flow,
  });

export const validateFlow = (taskId: number, flow: SpiderFlowDefinition) =>
  spiderRequest<{ valid: boolean; errors: any[] }>({
    url: `/v1/spider/tasks/${taskId}/flow/validate`,
    method: "POST",
    data: flow,
  });

export const runTask = (taskId: number) =>
  spiderRequest<any>({ url: `/v1/spider/tasks/${taskId}/run`, method: "POST" });

export const pauseTask = (taskId: number) =>
  spiderRequest<any>({
    url: `/v1/spider/tasks/${taskId}/pause`,
    method: "POST",
  });

export const resumeTask = (taskId: number) =>
  spiderRequest<any>({
    url: `/v1/spider/tasks/${taskId}/resume`,
    method: "POST",
  });

export const getRuntime = (taskId: number) =>
  spiderRequest<any>({ url: `/v1/spider/tasks/${taskId}/runtime`, method: "GET" });

export const getRecords = (taskId: number) =>
  spiderRequest<any[]>({
    url: `/v1/spider/tasks/${taskId}/records`,
    method: "GET",
  });

export const getNodeLogs = (taskId: number, recordId: number) =>
  spiderRequest<any[]>({
    url: `/v1/spider/tasks/${taskId}/records/${recordId}/nodes`,
    method: "GET",
  });

export const getNodeLog = (taskId: number, recordId: number, nodeId: string) =>
  spiderRequest<any>({
    url: `/v1/spider/tasks/${taskId}/records/${recordId}/nodes/${nodeId}`,
    method: "GET",
  });

export const submitHumanInput = (taskId: number, nodeId: string, value: string) =>
  spiderRequest<any>({
    url: `/v1/spider/tasks/${taskId}/nodes/${nodeId}/input`,
    method: "POST",
    data: { value },
  });

export const getCrawledUrls = (taskId: number) =>
  spiderRequest<any[]>({
    url: `/v1/spider/tasks/${taskId}/crawled-urls`,
    method: "GET",
  });

export const getRuntimeStream = (taskId: number): EventSource =>
  new EventSource(`/v1/spider/tasks/${taskId}/runtime/stream`);

export const getAiStatus = () =>
  spiderRequest<{ available: boolean }>({ url: "/v1/spider/ai/status", method: "GET" });

export const reviewTask = (
  taskId: number,
  recentLogs?: string[],
  failSamples?: string[],
) =>
  spiderRequest<any>({
    url: `/v1/spider/tasks/${taskId}/ai/review`,
    method: "POST",
    data: { recentLogs, failSamples },
  });

export const suggestNode = (taskId: number, nodeId: string, nodeType?: string) =>
  spiderRequest<any>({
    url: `/v1/spider/tasks/${taskId}/nodes/${nodeId}/ai/suggest`,
    method: "POST",
    params: { nodeType },
  });

export const applyNodeSuggestion = (
  taskId: number,
  nodeId: string,
  suggestion: any,
) =>
  spiderRequest<any>({
    url: `/v1/spider/tasks/${taskId}/nodes/${nodeId}/ai/apply`,
    method: "POST",
    data: suggestion,
  });

export const getBrainConfig = () =>
  spiderRequest<any>({ url: "/v1/spider/ai/brain-config", method: "GET" });

export const testAi = (provider: string, model: string, apiKey?: string) =>
  spiderRequest<any>({
    url: "/v1/spider/ai/test",
    method: "POST",
    data: { provider, model, apiKey },
  });

export const getTabs = () =>
  spiderRequest<WorkbenchTab[]>({ url: "/v1/spider/workbench/tabs", method: "GET" });

export const createTab = (tab: WorkbenchTab) =>
  spiderRequest<WorkbenchTab>({
    url: "/v1/spider/workbench/tabs",
    method: "POST",
    data: tab,
  });

export const updateTab = (tabId: number, tab: WorkbenchTab) =>
  spiderRequest<WorkbenchTab>({
    url: `/v1/spider/workbench/tabs/${tabId}`,
    method: "PUT",
    data: tab,
  });

export const deleteTab = (tabId: number) =>
  spiderRequest<any>({
    url: `/v1/spider/workbench/tabs/${tabId}`,
    method: "DELETE",
  });

export const previewPage = (url: string, downloaderType?: string) =>
  spiderRequest<any>({
    url: "/v1/spider/preview",
    method: "POST",
    data: { url, downloaderType },
  });

export const testSelector = (
  url: string,
  selector: string,
  selectorType?: string,
) =>
  spiderRequest<string[]>({
    url: "/v1/spider/test-selector",
    method: "POST",
    data: { url, selector, selectorType },
  });

export const getCapabilities = () =>
  spiderRequest<any>({ url: "/v1/spider/capabilities", method: "GET" });
