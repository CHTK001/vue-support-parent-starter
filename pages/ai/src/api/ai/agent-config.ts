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