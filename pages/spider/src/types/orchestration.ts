export type SpiderExecutorType = "ONCE" | "N_TIMES" | "CRON";
export type SpiderUrlStorageType = "DATABASE" | "REDIS" | "SPI";
export type SpiderDedupStrategy =
  | "URL_FINGERPRINT"
  | "NORMALIZED_URL"
  | "CONTENT_FINGERPRINT"
  | "CUSTOM";
export type SpiderFlowScope = "PRIVATE";
export type SpiderNodeType =
  | "START"
  | "PAGE_ACCESS"
  | "AI_PAGE_ACCESS"
  | "URL_PARSE"
  | "DATA_PARSE"
  | "DOWNLOADER"
  | "SUB_FLOW"
  | "HUMAN_INTERVENE"
  | "CONDITION"
  | "SAVE_RESULT"
  | "ASYNC_SAVE"
  | "END";

export interface SpiderDefinition {
  spiderId?: number;
  spiderCode: string;
  spiderName: string;
  spiderEntryUrl: string;
  spiderSiteHost: string;
  spiderExecutorType: SpiderExecutorType;
  spiderExecutorRounds?: number;
  spiderCollectDeepUrl: boolean | number;
  spiderNotifyOnFailure: boolean | number;
  spiderDedupStrategy: SpiderDedupStrategy;
  spiderUrlStorageType: SpiderUrlStorageType;
  spiderUrlStorageSpi?: string;
  spiderExecutorConfig?: string;
  spiderAiEnabled?: boolean | number;
  spiderStatus: "ENABLED" | "DISABLED" | 1 | 0;
  spiderLatestExecutionStatus?: string;
}

export interface SpiderNodePort {
  id: string;
  label: string;
  side: "left" | "right" | "top" | "bottom";
}

export interface SpiderNodeConfigSchemaField {
  field: string;
  label: string;
  component: "input" | "textarea" | "switch" | "select" | "number";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

export interface SpiderNodeDefinition {
  type: SpiderNodeType;
  title: string;
  detail: string;
  /**
   * 节点类型在 LogicFlow 画布上的原始颜色（hex）。
   * <p>由于 LogicFlow canvas 在 SVG 上下文中渲染节点，CSS 变量无法解析，
   * 因此节点类型颜色以 hex 形式作为数据存储，不走 Element Plus 变量体系。
   * Vue 模板中使用时通过 {@link nodeColorVar} 工具函数转为 CSS 变量。</p>
   */
  color: string;
  /**
   * 节点类型的语义颜色 token，对应 Element Plus CSS 变量。
   * <p>在 Vue 组件样式中应使用 {@code var(--el-color-${colorToken})} 引用，
   * 而非直接读取 {@code color} 字段。</p>
   */
  colorToken: "primary" | "success" | "warning" | "danger" | "info" | "secondary";
  icon?: string;
  image?: string;
  ports: SpiderNodePort[];
  schema: SpiderNodeConfigSchemaField[];
}

export interface SpiderFlowNode {
  id: string;
  type: SpiderNodeType;
  title: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  icon?: string;
  image?: string;
}

export interface SpiderFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceOutput?: string;
  targetInput?: string;
}

export interface SpiderFlowSchema {
  spiderDefinitionCode: string;
  spiderFlowVersion: number;
  spiderFlowName: string;
  spiderFlowScope: SpiderFlowScope;
  orchestrationType?: "AI" | "MANUAL";
  nodes: SpiderFlowNode[];
  edges: SpiderFlowEdge[];
}

export interface SpiderDashboardSummary {
  spiderTotalCount: number;
  spiderRunningCount: number;
  spiderUrlCount: number;
  spiderParsedUrlCount: number;
  spiderResultCount: number;
  spiderRemainingUrlCount: number;
  spiderSitePortraits?: SpiderSitePortrait[];
  spiderTimeTrends?: SpiderTimeTrend[];
}

export interface SpiderSitePortrait {
  siteHost: string;
  spiderUrlCount: number;
  spiderResultCount: number;
  spiderRunningCount: number;
  spiderWarningCount: number;
}

export interface SpiderTimeTrend {
  spiderDateLabel: string;
  spiderParseCount: number;
  spiderResultCount: number;
}

export interface SpiderExecutionRequest {
  spiderDefinitionCode: string;
  spiderFlowVersion: number;
  spiderTriggerType?: string;
  spiderContextJson?: string;
  orchestrationType?: "AI" | "MANUAL";
  spiderContinueFromLast?: boolean;
}

export interface SpiderExecutionStepView {
  spiderNodeCode: string;
  spiderNodeName: string;
  spiderNodeType: string;
  spiderStepStatus: string;
  spiderNeedManualIntervene: number;
  spiderIsDerivedNode: number;
  spiderSourceNodeCode?: string;
  spiderStartedAt?: string;
  spiderFinishedAt?: string;
  spiderDisplayInfo?: string;
  spiderErrorMessage?: string;
}

export interface SpiderManualTaskView {
  spiderExecutionNo: string;
  spiderNodeCode: string;
  spiderTaskType: string;
  spiderTaskStatus: string;
  spiderTaskPayload?: string;
  spiderOperatorResult?: string;
  spiderDerivedStepCode?: string;
  spiderExpiredAt?: string;
}

export interface SpiderExecutionEventView {
  spiderExecutionNo: string;
  spiderEventType: string;
  spiderNodeCode: string;
  spiderNodeName: string;
  spiderMessage?: string;
  spiderEventTime?: string;
}

export interface SpiderExecutionEdgeTraceView {
  edgeId: string;
  source: string;
  target: string;
  label?: string;
  sourceOutput?: string;
  targetInput?: string;
  spiderRuntimeStatus?: string;
  spiderVisited?: number;
}

export interface SpiderExecutionDetailView {
  spiderExecutionNo: string;
  spiderDefinitionCode: string;
  spiderExecutionStatus: string;
  spiderCurrentNodeCode?: string;
  spiderNeedManualIntervene: number;
  spiderTraceSnapshot?: string;
  spiderSteps: SpiderExecutionStepView[];
  spiderManualTasks: SpiderManualTaskView[];
  spiderTraversedEdges?: SpiderExecutionEdgeTraceView[];
}

export interface SpiderExecutionRecordView {
  spiderExecutionNo: string;
  spiderDefinitionCode: string;
  spiderTriggerType?: string;
  spiderExecutionStatus: string;
  spiderCurrentNodeCode?: string;
  spiderNeedManualIntervene: number;
  spiderStartedAt?: string;
  spiderFinishedAt?: string;
  createTime?: string;
}

export interface SpiderManualTaskSubmitRequest {
  spiderExecutionNo: string;
  spiderNodeCode: string;
  spiderOperatorName?: string;
  spiderOperatorResult?: string;
  spiderContinueExecution?: boolean;
}

export interface SpiderCredentialPoolConfig {
  spiderCredentialPoolCode: string;
  spiderCredentialType: string;
  spiderRotateEnabled?: number;
  spiderAiAssistEnabled?: number;
  spiderSecureRef?: string;
}

export type SpiderPoolType = "ACCOUNT" | "DATA" | "DICTIONARY";

export interface SpiderPool {
  spiderId?: number;
  spiderPoolCode: string;
  spiderPoolName: string;
  spiderPoolType: SpiderPoolType;
  spiderPoolStatus: 1 | 0;
  spiderPoolRemark?: string;
}

export interface SpiderPoolItem {
  spiderId?: number;
  spiderPoolCode: string;
  spiderItemCode: string;
  spiderItemName: string;
  spiderItemType?: string;
  spiderItemPayload: string;
  spiderSortNum?: number;
  spiderItemStatus: 1 | 0;
}

export interface SpiderPageAccessRequest {
  spiderUrl: string;
  spiderAccessMode: "HTTP" | "PLAYWRIGHT";
  spiderCookieJson?: string;
  spiderHeaderJson?: string;
}

export interface SpiderPageAccessView {
  spiderUrl: string;
  spiderAccessMode: string;
  spiderStatusCode: number;
  spiderTitle?: string;
  spiderHtml?: string;
}

export interface SpiderSelectorTestRequest {
  spiderHtml: string;
  spiderBaseUrl?: string;
  spiderSelector: string;
  spiderSelectorType: "CSS" | "XPATH" | "REGEX" | "AI" | "JSON_PATH";
  spiderAttribute?: string;
}

export interface SpiderSelectorTestView {
  spiderSelector: string;
  spiderSelectorType: string;
  spiderValues: string[];
}

export interface SpiderUrlParseTestRequest {
  spiderHtml: string;
  spiderBaseUrl?: string;
  spiderParseMode: "AUTO_LINKS" | "CSS" | "XPATH" | "REGEX";
  spiderSelector?: string;
}

export interface SpiderUrlParseTestView {
  spiderParseMode: string;
  spiderUrls: string[];
}

export interface SpiderDataParseFieldInput {
  spiderFieldName: string;
  spiderSelectorType: "CSS" | "XPATH" | "REGEX" | "AI" | "JSON_PATH";
  spiderSelector: string;
  spiderAttribute?: string;
}

export interface SpiderDataParseTestRequest {
  spiderHtml: string;
  spiderBaseUrl?: string;
  spiderFields: SpiderDataParseFieldInput[];
}

export interface SpiderDataParseTestView {
  spiderValues: Record<string, string | null>;
}

// ── 执行详情页 ──

export interface SpiderScreenshotView {
  spiderExecutionNo: string;
  spiderNodeCode: string;
  spiderScreenshotUrl: string;
  spiderStepIndex: number;
  spiderEventTime: string;
}

export interface SpiderAgentDecisionView {
  step: number;
  action: string;
  description: string;
  result: string;
  thought?: string;
  screenshotUrl?: string;
}

// ── 监控面板快照 ──

export interface SpiderNodeChainItem {
  nodeCode: string;
  nodeName: string;
  nodeType: string;
  stepStatus: string;
  isDerived: number;
  sourceNodeCode: string;
  startedAt: string;
  finishedAt: string;
  errorMessage: string;
}

export interface SpiderPerMinuteRate {
  timeLabel: string;
  count: number;
}

export interface SpiderCollectedItem {
  title: string;
  url: string;
  time: string;
  schemaCode: string;
  status: string;
  depth?: number;
  payload?: string;
}

export interface SpiderMonitorSnapshot {
  collectedTotal: number;
  targetTotal: number;
  progressPercent: number;
  urlTotal: number;
  urlCompleted: number;
  urlRemaining: number;
  resultCount: number;
  nodeChain: SpiderNodeChainItem[];
  perMinuteRates: SpiderPerMinuteRate[];
  collectedItems: SpiderCollectedItem[];
}
