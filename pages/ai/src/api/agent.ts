/** Agent 配置接口（注册 Agent 为模型 / 编排 / 查询） */
import { get, post, del } from './request';

/** 注册 Agent 为模型请求 */
export interface RegisterAgentRequest {
  agentName: string;
  displayName?: string;
  description?: string;
  config?: Record<string, unknown>;
}

/** Agent 注册响应 */
export interface RegisterAgentResult {
  agentName: string;
  modelCode: string;
  status: string;
  [key: string]: unknown;
}

/** Agent 编排请求 */
export interface OrchestrationRequest {
  agentName: string;
  config: Record<string, unknown>;
}

/** Agent 编排响应 */
export interface OrchestrationResult {
  agentName: string;
  config: Record<string, unknown>;
  updatedAt: number;
  [key: string]: unknown;
}

/** Agent 模型列表项 */
export interface AgentModelItem {
  name: string;
  displayName?: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export const agentApi = {
  /** 获取所有 Agent 模型列表 */
  listAgentModels: () => get<AgentModelItem[]>('/v2/agent-models'),
  /** 注册 Agent 为可调用模型 */
  registerAsModel: (request: RegisterAgentRequest) =>
    post<RegisterAgentResult>('/v2/register-as-model', request),
  /** 注销 Agent 模型 */
  unregisterAgentModel: (modelName: string) =>
    del<boolean>(`/v2/unregister-model/${encodeURIComponent(modelName)}`),
  /** 获取 Agent 编排配置 */
  getOrchestration: (agentName: string) =>
    get<OrchestrationResult>(`/v2/orchestration/${encodeURIComponent(agentName)}`),
  /** 保存 Agent 编排配置 */
  saveOrchestration: (request: OrchestrationRequest) =>
    post<OrchestrationResult>('/v2/orchestration/save', request),
};
