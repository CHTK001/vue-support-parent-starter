/**
 * Spider Platform API — 对接所有后端接口
 * 旧 api/index.ts 保留，此文件为新版统一 API 层
 */

import { request } from '@/utils/request'

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface ReturnResult<T = any> {
  code: string
  data: T
  msg: string
  timestamp: number
}

export interface SpiderTask {
  id?: number
  taskCode?: string
  taskName: string
  entryUrl: string
  description?: string
  tags?: string
  authType?: string
  executionType: 'ONCE' | 'REPEAT_N' | 'SCHEDULED'
  executionPolicy?: string
  aiProfile?: string
  credentialRef?: string
  status?: string
  version?: number
}

export interface SpiderFlowNode {
  nodeId: string
  nodeType: string
  label?: string
  config?: Record<string, any>
  aiAssistantConfig?: Record<string, any>
  positionX?: number
  positionY?: number
}

export interface SpiderFlowEdge {
  edgeId: string
  sourceNodeId: string
  targetNodeId: string
}

export interface SpiderFlowDefinition {
  id?: number
  taskId?: number
  nodes: SpiderFlowNode[]
  edges: SpiderFlowEdge[]
  groups?: any[]
  version?: number
}

export interface DashboardSummary {
  timerCount: number
  taskTotal: number
  latestTask: any
  totalCrawled: number
  totalUrlsCollected: number
}

export interface RunningCard {
  taskId: number
  taskName: string
  status: string
  executionType: string
  lastExecuteTime: string
  jobBound: boolean
  aiEnabled: boolean
  successCount: number
  failureCount: number
}

export interface WorkbenchTab {
  id?: number
  tabType: 'HOME' | 'TASK'
  taskId?: number
  title: string
  closeable: boolean
  sortOrder?: number
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboardSummary = () =>
  request<ReturnResult<DashboardSummary>>({ url: '/v1/spider/dashboard/summary', method: 'GET' })

export const getRunningCards = () =>
  request<ReturnResult<RunningCard[]>>({ url: '/v1/spider/dashboard/running-cards', method: 'GET' })

// ── Task ──────────────────────────────────────────────────────────────────────

export const createTask = () =>
  request<ReturnResult<any>>({ url: '/v1/spider/tasks', method: 'POST' })

export const getTask = (taskId: number) =>
  request<ReturnResult<SpiderTask>>({ url: `/v1/spider/tasks/${taskId}`, method: 'GET' })

export const updateTask = (taskId: number, task: SpiderTask, flow?: SpiderFlowDefinition) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}`, method: 'PUT', data: { task, flow } })

export const deleteTask = (taskId: number) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}`, method: 'DELETE' })

// ── Flow ──────────────────────────────────────────────────────────────────────

export const getFlow = (taskId: number) =>
  request<ReturnResult<SpiderFlowDefinition>>({ url: `/v1/spider/tasks/${taskId}/flow`, method: 'GET' })

export const saveFlow = (taskId: number, flow: SpiderFlowDefinition) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}/flow`, method: 'PUT', data: flow })

export const validateFlow = (taskId: number, flow: SpiderFlowDefinition) =>
  request<ReturnResult<{ valid: boolean; errors: any[] }>>({
    url: `/v1/spider/tasks/${taskId}/flow/validate`, method: 'POST', data: flow
  })

// ── Runtime ───────────────────────────────────────────────────────────────────

export const runTask = (taskId: number) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}/run`, method: 'POST' })

export const pauseTask = (taskId: number) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}/pause`, method: 'POST' })

export const resumeTask = (taskId: number) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}/resume`, method: 'POST' })

export const getRuntime = (taskId: number) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}/runtime`, method: 'GET' })

export const getRecords = (taskId: number) =>
  request<ReturnResult<any[]>>({ url: `/v1/spider/tasks/${taskId}/records`, method: 'GET' })

export const getNodeLogs = (taskId: number, recordId: number) =>
  request<ReturnResult<any[]>>({ url: `/v1/spider/tasks/${taskId}/records/${recordId}/nodes`, method: 'GET' })

export const getNodeLog = (taskId: number, recordId: number, nodeId: string) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}/records/${recordId}/nodes/${nodeId}`, method: 'GET' })

export const submitHumanInput = (taskId: number, nodeId: string, value: string) =>
  request<ReturnResult<any>>({
    url: `/v1/spider/tasks/${taskId}/nodes/${nodeId}/input`, method: 'POST', data: { value }
  })

export const getCrawledUrls = (taskId: number) =>
  request<ReturnResult<any[]>>({ url: `/v1/spider/tasks/${taskId}/crawled-urls`, method: 'GET' })

export const getRuntimeStream = (taskId: number): EventSource =>
  new EventSource(`/v1/spider/tasks/${taskId}/runtime/stream`)

// ── AI ────────────────────────────────────────────────────────────────────────

export const getAiStatus = () =>
  request<ReturnResult<{ available: boolean }>>({ url: '/v1/spider/ai/status', method: 'GET' })

export const reviewTask = (taskId: number, recentLogs?: string[], failSamples?: string[]) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}/ai/review`, method: 'POST', data: { recentLogs, failSamples } })

export const suggestNode = (taskId: number, nodeId: string, nodeType?: string) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}/nodes/${nodeId}/ai/suggest`, method: 'POST', params: { nodeType } })

export const applyNodeSuggestion = (taskId: number, nodeId: string, suggestion: any) =>
  request<ReturnResult<any>>({ url: `/v1/spider/tasks/${taskId}/nodes/${nodeId}/ai/apply`, method: 'POST', data: suggestion })

export const getBrainConfig = () =>
  request<ReturnResult<any>>({ url: '/v1/spider/ai/brain-config', method: 'GET' })

export const testAi = (provider: string, model: string, apiKey?: string) =>
  request<ReturnResult<any>>({ url: '/v1/spider/ai/test', method: 'POST', data: { provider, model, apiKey } })

// ── Workbench Tabs ────────────────────────────────────────────────────────────

export const getTabs = () =>
  request<ReturnResult<WorkbenchTab[]>>({ url: '/v1/spider/workbench/tabs', method: 'GET' })

export const createTab = (tab: WorkbenchTab) =>
  request<ReturnResult<WorkbenchTab>>({ url: '/v1/spider/workbench/tabs', method: 'POST', data: tab })

export const updateTab = (tabId: number, tab: WorkbenchTab) =>
  request<ReturnResult<WorkbenchTab>>({ url: `/v1/spider/workbench/tabs/${tabId}`, method: 'PUT', data: tab })

export const deleteTab = (tabId: number) =>
  request<ReturnResult<any>>({ url: `/v1/spider/workbench/tabs/${tabId}`, method: 'DELETE' })

// ── Tools ─────────────────────────────────────────────────────────────────────

export const previewPage = (url: string, downloaderType?: string) =>
  request<ReturnResult<any>>({ url: '/v1/spider/preview', method: 'POST', data: { url, downloaderType } })

export const testSelector = (url: string, selector: string, selectorType?: string) =>
  request<ReturnResult<string[]>>({ url: '/v1/spider/test-selector', method: 'POST', data: { url, selector, selectorType } })

export const getCapabilities = () =>
  request<ReturnResult<any>>({ url: '/v1/spider/capabilities', method: 'GET' })
