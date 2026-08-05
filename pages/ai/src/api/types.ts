/** 模型供应商实例（与后端 AiProviderDTO 对齐） */
export interface Provider {
  id: number;
  name: string;
  type: string;
  logo?: string;
  baseUrl?: string;
  apiKey?: string;
  models?: string[];
  enabled: boolean;
  createdAt: string;
}

/** AppKey 实例（与后端 AiAppKeyDTO 对齐） */
export interface AppKey {
  id: number;
  name: string;
  key: string;
  provider: number;
  providerName?: string;
  model?: string;
  groupId?: number;
  groupName?: string;
  useCount?: number;
  maxUse?: number;
  expireTime?: string;
  enabled: boolean;
  createdAt: string;
}

/** 分组实例（与后端 AiGroupDTO 对齐） */
export interface Group {
  id: number;
  name: string;
  description?: string;
  models: string[];
  appKeyIds: number[];
  createdAt: string;
}

/** 告警规则实例（与后端 AiAlertDTO 对齐） */
export interface Alert {
  id: number;
  name: string;
  appKeyId: number;
  condition: string;
  threshold: number;
  channels?: string;
  enabled: boolean;
  createdAt: string;
}

/** 服务运行状态（与后端 AiServiceStatusDTO 对齐） */
export interface ServiceStatus {
  name: string;
  running: boolean;
  pid?: number;
  uptime?: number;
}

/** 全局设置（与后端 AiGlobalSettingDTO 对齐） */
export interface GlobalSettings {
  chatClientEnabled: boolean;
  enableUsageAnalysis: boolean;
  usageReportInterval: number;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  enableCache: boolean;
  stream: boolean;
}

/** 用量统计（与后端 AiUsageDTO 对齐） */
export interface Usage {
  model: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: string;
}

/** 模型定义实例（与后端 AiModelDTO 对齐） */
export interface AiModel {
  id: number;
  name: string;
  code: string;
  providerId: number;
  providerName?: string;
  capabilities: string[];
  description?: string;
  enabled: boolean;
  sort: number;
  createdAt: string;
}