/** AppKey 实例 */
export interface AppKey {
  id: string;
  name: string;
  key: string;
  provider: string;
  model?: string;
  enabled: boolean;
  createdAt: string;
}

/** 分组实例 */
export interface Group {
  id: string;
  name: string;
  description?: string;
  models: string[];
  appKeyIds: string[];
  createdAt: string;
}

/** 模型供应商实例 */
export interface Provider {
  id: string;
  name: string;
  type: string;
  baseUrl?: string;
  apiKey?: string;
  models?: string[];
  enabled: boolean;
  createdAt: string;
}

/** 告警规则实例 */
export interface Alert {
  id: string;
  name: string;
  appKeyId: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  createdAt: string;
}

/** 服务运行状态 */
export interface ServiceStatus {
  name: string;
  running: boolean;
  pid?: number;
  uptime?: number;
}

/** 全局设置 */
export interface GlobalSettings {
  chatClientEnabled: boolean;
  usageIntervalSec: number;
}

/** 用量统计 */
export interface Usage {
  model: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requests: number;
  timestamp: string;
}