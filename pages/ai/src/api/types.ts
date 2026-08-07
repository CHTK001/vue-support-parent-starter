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
  systemPrompt?: string;
  ragEmbeddingModel?: string;
  ragLlmModel?: string;
  ragOcrModel?: string;
  ragUploadDir?: string;
  ragVectorStorage?: string;
  ragSystemPrompt?: string;
  ragChunkSize?: number;
  ragChunkOverlap?: number;
  ragSplitter?: string;
}

/** RAG 配置选项（与后端 AiRagSettingController.options 对齐） */
export interface RagOptions {
  embeddingModels: string[];
  ocrModels: string[];
  llmModels: string[];
  vectorStorages: string[];
  splitters: string[];
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

/** 厂商实例（与后端 SysAiManufacturer 对齐） */
export interface Manufacturer {
  sysAiManufacturerId?: number;
  /** 厂商编码（如 openai / zhipu / baidu） */
  sysAiManufacturerCode: string;
  /** 厂商名称 */
  sysAiManufacturerName: string;
  /** 厂商工厂类型（如 openai / zhipu / anthropic） */
  sysAiManufacturerFactory?: string;
  /** 厂商 API 基础地址 */
  sysAiManufacturerBaseUrl?: string;
  /** 厂商应用 Key */
  sysAiManufacturerAppKey?: string;
  /** 厂商应用 Secret */
  sysAiManufacturerApiSecret?: string;
  /** 是否兼容 OpenAI 协议：1 是，0 否 */
  sysAiManufacturerOpenaiCompatible?: number;
  /** 厂商 Logo 地址 */
  sysAiManufacturerLogoUrl?: string;
  /** 厂商备注描述 */
  sysAiManufacturerDescription?: string;
  /** 状态：1 启用，0 停用 */
  sysAiManufacturerStatus?: number;
  /** 排序值 */
  sysAiManufacturerSort?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/** 厂商 API Key 实例（与后端 SysAiManufacturerKey 对齐） */
export interface ManufacturerKey {
  /** 厂商 Key 主键 ID */
  sysAiManufacturerKeyId?: number;
  /** 厂商编码（关联厂商表） */
  sysAiManufacturerCode: string;
  /** 厂商名称 */
  sysAiManufacturerName?: string;
  /** API Key */
  sysAiManufacturerKeyValue?: string;
  /** API Secret */
  sysAiManufacturerKeySecret?: string;
  /** 状态：1 启用，0 停用，-1 禁用 */
  sysAiManufacturerKeyStatus?: number;
  /** 权重（用于多 Key 轮询） */
  sysAiManufacturerKeyWeight?: number;
  /** 限流标记时间戳（毫秒） */
  sysAiManufacturerKeyRateLimitedAt?: number;
  /** 备注 */
  sysAiManufacturerKeyRemark?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}