import type { ApiContext } from "./api-context";

/**
 * 会话能力域 API（后端 AiSessionCapabilityController，/v2/sessions/{id}/...）。
 *
 * 全部为会话归属人只读/受控操作：
 * - server-info：OSHI 服务器信息采样（只读）；
 * - permission-test：「5.1 测试权限」，对动作+资源做只读风险分级，不执行任何工具；
 * - sub-agents：角色子代理列表；
 * - sub-agents/invoke：手动调用单个子代理（子代理自己的模型与系统提示词执行一次）。
 */

/** 服务器信息（OSHI 采样，只读） */
export interface SessionServerInfo {
  osName?: string;
  osArch?: string;
  computerIp?: string;
  cpu?: { cores?: number; usedPercent?: number; freePercent?: number };
  memory?: { totalMb?: number; usedMb?: number; freeMb?: number; usagePercent?: number };
  javaVersion?: string;
  serverTime?: number;
}

/** 权限自测结果（只读分级，不执行工具） */
export interface PermissionTestResult {
  action: string;
  resources: string;
  riskLevel: string;
  confirmationRequired: boolean;
  strongConfirm: boolean;
  shellBlockedForNonAdmin: boolean;
  allowed: boolean;
  admin: boolean;
  reason: string;
}

/** 角色子代理条目 */
export interface SubAgentItem {
  agentId: string;
  name: string;
  description?: string;
  role?: string;
  model?: string;
  enabled?: boolean;
  masterId?: string;
  masterName?: string;
}

/** 子代理调用结果 */
export interface SubAgentInvokeResult {
  agentId: string;
  name?: string;
  masterId?: string;
  input: string;
  output?: string;
  error?: string;
}

export interface SessionCapabilityApi {
  getServerInfo(sessionId: string): Promise<SessionServerInfo>;
  testPermission(
    sessionId: string,
    action: string,
    resources?: string | string[],
  ): Promise<PermissionTestResult>;
  listSubAgents(sessionId: string): Promise<{ items: SubAgentItem[]; total: number }>;
  invokeSubAgent(sessionId: string, agentId: string, input: string): Promise<SubAgentInvokeResult>;
}

export const sessionCapabilityApi: SessionCapabilityApi = {
  async getServerInfo(this: ApiContext, sessionId: string): Promise<SessionServerInfo> {
    return await this._request<SessionServerInfo>(`/sessions/${sessionId}/server-info`);
  },

  async testPermission(
    this: ApiContext,
    sessionId: string,
    action: string,
    resources?: string | string[],
  ): Promise<PermissionTestResult> {
    return await this._request<PermissionTestResult>(`/sessions/${sessionId}/permission-test`, {
      method: "POST",
      data: { action, resources: resources ?? "" },
    });
  },

  async listSubAgents(
    this: ApiContext,
    sessionId: string,
  ): Promise<{ items: SubAgentItem[]; total: number }> {
    return await this._request<{ items: SubAgentItem[]; total: number }>(
      `/sessions/${sessionId}/sub-agents`,
    );
  },

  async invokeSubAgent(
    this: ApiContext,
    sessionId: string,
    agentId: string,
    input: string,
  ): Promise<SubAgentInvokeResult> {
    return await this._request<SubAgentInvokeResult>(`/sessions/${sessionId}/sub-agents/invoke`, {
      method: "POST",
      data: { agentId, input },
    });
  },
};
