import { http, type ReturnResult } from "@repo/utils";

export type AiAgentConfigStatus = 0 | 1;

export interface AiAgentConfig {
  sysAiAgentConfigId?: number;
  sysAiAgentConfigName: string;
  sysAiAgentConfigCode: string;
  sysAiAgentConfigType?: string;
  sysAiAgentConfigLeaderPrompt?: string;
  sysAiAgentConfigSubAgents?: string;
  sysAiAgentConfigSkillIds?: string;
  sysAiAgentConfigMcpDisabled?: number;
  sysAiAgentConfigLocalCmdDisabled?: number;
  sysAiAgentConfigMaxRework?: number;
  sysAiAgentConfigStatus?: AiAgentConfigStatus;
  sysAiAgentConfigSort?: number;
  sysAiAgentConfigRemark?: string;
}

export interface AgentOrchestrationNode {
  id: string;
  type?: string;
  kind?: string;
  label: string;
  icon?: string;
  position: { x: number; y: number };
  [key: string]: any;
}

export interface AgentOrchestrationEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  [key: string]: any;
}

export interface AgentOrchestration {
  agentName: string;
  leaderPrompt?: string;
  nodes: AgentOrchestrationNode[];
  edges: AgentOrchestrationEdge[];
}

export interface AgentModelItem {
  modelName: string;
  agentName: string;
  [key: string]: any;
}

export const listAiAgentConfigs = async (
  sysAiAgentConfigName?: string,
  sysAiAgentConfigStatus?: AiAgentConfigStatus,
) => {
  return http.request<ReturnResult<AiAgentConfig[]>>("get", "/v2/ai/agent-config/list", {
    params: { sysAiAgentConfigName, sysAiAgentConfigStatus },
  });
};

export const listEnabledAiAgentConfigs = async () => {
  return http.request<ReturnResult<AiAgentConfig[]>>("get", "/v2/ai/agent-config/list-enabled");
};

export const saveAiAgentConfig = async (data: AiAgentConfig) => {
  return http.request<ReturnResult<AiAgentConfig>>("post", "/v2/ai/agent-config/save", {
    data,
  });
};

export const updateAiAgentConfig = async (data: AiAgentConfig) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/ai/agent-config/update", {
    data,
  });
};

export const deleteAiAgentConfig = async (sysAiAgentConfigId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/ai/agent-config/delete", {
    params: { sysAiAgentConfigId },
  });
};

/** 获取 Agent 编排结构（RelationGraph nodes + edges） */
export const getAgentOrchestration = async (agentName: string) => {
  return http.request<ReturnResult<AgentOrchestration>>(
    "get",
    `/v2/ai/agent-config/orchestration/${encodeURIComponent(agentName)}`,
  );
};

/** 保存 Agent 编排配置 */
export const saveAgentOrchestration = async (data: {
  agentName: string;
  nodes: any[];
  edges: any[];
}) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/ai/agent-config/orchestration/save", {
    data,
  });
};

/** 将 Agent 注册为模型 */
export const registerAgentAsModel = async (data: { agentName: string; modelName?: string }) => {
  return http.request<ReturnResult<{ modelName: string }>>(
    "post",
    "/v2/ai/agent-config/register-as-model",
    { data },
  );
};

/** 注销 Agent 模型 */
export const unregisterAgentModel = async (modelName: string) => {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `/v2/ai/agent-config/unregister-model/${encodeURIComponent(modelName)}`,
  );
};

/** Agent 模型列表 */
export const listAgentModels = async () => {
  return http.request<ReturnResult<AgentModelItem[]>>("get", "/v2/ai/agent-config/agent-models");
};