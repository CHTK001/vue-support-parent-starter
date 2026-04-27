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
  | "URL_PARSE"
  | "DATA_PARSE"
  | "DOWNLOADER"
  | "SUB_FLOW"
  | "HUMAN_INTERVENE"
  | "CONDITION"
  | "SAVE_RESULT"
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
  spiderStatus: "ENABLED" | "DISABLED" | 1 | 0;
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
  color: string;
  ports: SpiderNodePort[];
  schema: SpiderNodeConfigSchemaField[];
}

export interface SpiderFlowNode {
  id: string;
  type: SpiderNodeType;
  title: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
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
}

export interface SpiderManualTaskView {
  spiderExecutionNo: string;
  spiderNodeCode: string;
  spiderTaskType: string;
  spiderTaskStatus: string;
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

export interface SpiderExecutionDetailView {
  spiderExecutionNo: string;
  spiderDefinitionCode: string;
  spiderExecutionStatus: string;
  spiderCurrentNodeCode?: string;
  spiderNeedManualIntervene: number;
  spiderTraceSnapshot?: string;
  spiderSteps: SpiderExecutionStepView[];
  spiderManualTasks: SpiderManualTaskView[];
}

export interface SpiderManualTaskSubmitRequest {
  spiderExecutionNo: string;
  spiderNodeCode: string;
  spiderOperatorName?: string;
  spiderOperatorResult?: string;
}

export interface SpiderCredentialPoolConfig {
  spiderCredentialPoolCode: string;
  spiderCredentialType: string;
  spiderRotateEnabled?: number;
  spiderAiAssistEnabled?: number;
  spiderSecureRef?: string;
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
