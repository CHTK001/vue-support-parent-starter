import type { ApiContext } from "./api-context";
import type { Session, SessionGroup, SessionListResponse, SearchSessionResponse, SidebarSessionsResponse } from "@/types/session";
import { characterApi } from "./character.api";

/**
 * 单会话详情里后端只回 `characterId`，不内联角色对象，而消息头要用
 * `session.character.title` 显示「是谁在说话」。缺了这一步时前端只能退回
 * 模型名，表现为头部出现「agnes-2.0-flash agnes-2.0-flash」（角色名漏数据）。
 * 这里按 characterId 补挂角色详情，并按 id 缓存（含 in-flight 去重），
 * 避免每次切换会话重复请求；角色改名的缓存失效代价可忽略（刷新即更新）。
 */
const sessionCharacterCache = new Map<string, Promise<any>>();

/**
 * 给单会话补挂角色详情（已有 character 或没有 characterId 时原样返回）。
 *
 * @param ctx     请求上下文（apiService 实例）
 * @param session 后端返回的会话对象
 * @returns 补挂 character 后的同一会话对象
 */
async function attachSessionCharacter(ctx: ApiContext, session: any): Promise<any> {
  const characterId = session?.characterId;
  if (!characterId || session.character) {
    return session;
  }
  const key = String(characterId);
  let pending = sessionCharacterCache.get(key);
  if (!pending) {
    pending = characterApi.fetchCharacter.call(ctx, key).catch(() => null);
    sessionCharacterCache.set(key, pending);
  }
  const character = await pending;
  if (character) {
    session.character = character;
  }
  return session;
}

export interface SessionApi {
  createSession(data: any): Promise<Session>;
  deleteSession(sessionId: string, deleteWorkspace?: boolean): Promise<{ success: boolean }>;
  batchDeleteSessions(sessionIds: string[]): Promise<{ success: boolean; deletedCount: number }>;
  fetchSession(sessionId: string): Promise<Session>;
  fetchSessions(skip?: number, limit?: number, groupId?: string | null, keyword?: string, includeArchived?: boolean): Promise<SessionListResponse>;
  fetchSidebarSessions(limit?: number): Promise<SidebarSessionsResponse>;
  fetchArchivedSessions(skip?: number, limit?: number, keyword?: string, groupId?: string | null): Promise<SessionListResponse>;
  searchSessions(keyword: string, cursor?: string, limit?: number, includeArchived?: boolean): Promise<SearchSessionResponse>;
  archiveSession(sessionId: string, archived: boolean): Promise<{ success: boolean; session?: any }>;
  batchArchiveSessions(sessionIds: string[], archived: boolean): Promise<{ success: boolean; skipped: string[] }>;
  updateSession(sessionId: string, data: any): Promise<Session>;
  /**
   * 从某一轮起回退：删除该轮及其之后的所有消息（后端按轮次归并，不是删单条）。
   * 只回退对话，不会回滚工作目录里已被工具写入的文件。
   */
  rewindSession(sessionId: string, fromMessageId: string): Promise<{
    success: boolean;
    removedTurns: number;
    removedMessages: number;
  }>;
  /** 从某一轮处分叉：复制截至该轮的消息为新会话，原会话保持不变 */
  forkSession(sessionId: string, messageId: string): Promise<{
    sessionId: string;
    title: string;
    copiedMessages: number;
  }>;
  fetchSessionGroups(): Promise<SessionGroup[]>;
  createSessionGroup(data: { name: string }): Promise<SessionGroup>;
  updateSessionGroup(groupId: string, data: { name: string }): Promise<SessionGroup>;
  deleteSessionGroup(groupId: string): Promise<{ success: boolean }>;
  batchDeleteSessionGroups(ids: string[]): Promise<{ success: boolean }>;
  reorderSessionGroups(groupIds: string[]): Promise<{ success: boolean }>;
  generateSessionTitle(sessionId: string): Promise<{ title: string; skipped?: boolean }>;
  























































































































































































































































  compressSession(sessionId: string): Promise<any>;
  fetchSessionSummaries(sessionId: string, limit?: number): Promise<{ items: any[]; total: number }>;
  updateSummary(summaryId: string, data: { summaryContent?: string }): Promise<any>;
  deleteSummary(summaryId: string): Promise<{ success: boolean }>;
  /** 落库会话上下文用量快照（流式结束时调用） */
  saveSessionTokenStats(
    sessionId: string,
    stats: { usedTokens: number; effectiveContextWindow: number },
  ): Promise<{ usedTokens?: number; effectiveContextWindow?: number; updatedAt?: number }>;
  fetchSessionTokenStats(sessionId: string): Promise<{
    usedTokens: number;
    totalTokens: number;
    remainingTokens: number;
    percentage: number;
    modelName: string;
    messageCount: number;
    breakdown: {
      systemPrompt: number;
      summary: number;
      userPrompt: number;
      history: number;
      tools: number;
    };
  }>;
  getWorkspacePath(sessionId: string): Promise<{ workspacePath: string }>;
  getSessionTodo(sessionId: string): Promise<{ items: Array<{ content: string; status: string }> }>;
}

export const sessionApi: SessionApi = {
  async createSession(this: ApiContext, data: any) {
    return await this._request("/sessions", { method: "POST", data });
  },

  async deleteSession(this: ApiContext, sessionId: string, deleteWorkspace: boolean = false) {
    const url = deleteWorkspace
      ? `/sessions/${sessionId}?deleteWorkspace=true`
      : `/sessions/${sessionId}`;
    return await this._request(url, { method: "DELETE" });
  },

  async batchDeleteSessions(this: ApiContext, sessionIds: string[]) {
    return await this._request(`/sessions/batch`, {
      method: "DELETE",
      data: { ids: sessionIds }
    });
  },

  async rewindSession(this: ApiContext, sessionId: string, fromMessageId: string) {
    return await this._request(
      `/sessions/${sessionId}/messages?fromMessageId=${encodeURIComponent(fromMessageId)}`,
      { method: "DELETE" }
    );
  },

  async forkSession(this: ApiContext, sessionId: string, messageId: string) {
    return await this._request(`/sessions/${sessionId}/fork`, {
      method: "POST",
      data: { messageId }
    });
  },

  async fetchSession(this: ApiContext, sessionId: string) {
    const session = await this._request(`/sessions/${sessionId}`);
    return attachSessionCharacter(this, session);
  },

  async fetchSessions(this: ApiContext, skip?: number, limit?: number, groupId?: string | null, keyword?: string, includeArchived?: boolean) {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append("skip", skip.toString());
    if (limit !== undefined) params.append("limit", limit.toString());
    if (groupId !== undefined) params.append("groupId", groupId === null ? "null" : groupId);
    if (keyword) params.append("keyword", keyword);
    if (includeArchived) params.append("includeArchived", "true");

    const queryString = params.toString();
    const url = queryString ? `/sessions?${queryString}` : "/sessions";

    return await this._request(url);
  },

  async fetchSidebarSessions(this: ApiContext, limit?: number) {
    const url = limit ? `/sessions/sidebar?limit=${limit}` : "/sessions/sidebar";
    return await this._request(url);
  },

  async fetchArchivedSessions(this: ApiContext, skip?: number, limit?: number, keyword?: string, groupId?: string | null) {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append("skip", skip.toString());
    if (limit !== undefined) params.append("limit", limit.toString());
    if (keyword) params.append("keyword", keyword);
    if (groupId !== undefined) params.append("groupId", groupId === null ? "null" : groupId);

    const queryString = params.toString();
    const url = queryString ? `/sessions/archived?${queryString}` : "/sessions/archived";

    return await this._request(url);
  },

  async searchSessions(this: ApiContext, keyword: string, cursor?: string, limit?: number, includeArchived?: boolean) {
    const params = new URLSearchParams();
    params.append("keyword", keyword);
    if (cursor) params.append("cursor", cursor);
    if (limit) params.append("limit", limit.toString());
    if (includeArchived) params.append("includeArchived", "true");
    return await this._request(`/sessions/search?${params.toString()}`);
  },

  async archiveSession(this: ApiContext, sessionId: string, archived: boolean) {
    return await this._request(`/sessions/${sessionId}/archive`, {
      method: "PUT",
      data: { archived },
    });
  },

  async batchArchiveSessions(this: ApiContext, sessionIds: string[], archived: boolean) {
    return await this._request(`/sessions/batch-archive`, {
      method: "POST",
      data: { sessionIds, archived },
    });
  },

  async updateSession(this: ApiContext, sessionId: string, data: any) {
    return await this._request(`/sessions/${sessionId}`, {
      method: "PUT",
      data,
    });
  },

  async fetchSessionGroups(this: ApiContext) {
    return await this._request("/session-groups");
  },

  async createSessionGroup(this: ApiContext, data: { name: string }) {
    return await this._request("/session-groups", {
      method: "POST",
      data,
    });
  },

  async updateSessionGroup(this: ApiContext, groupId: string, data: { name: string }) {
    return await this._request(`/session-groups/${groupId}`, {
      method: "PUT",
      data,
    });
  },

  async deleteSessionGroup(this: ApiContext, groupId: string) {
    return await this._request(`/session-groups/${groupId}`, {
      method: "DELETE",
    });
  },

  async batchDeleteSessionGroups(this: ApiContext, ids: string[]) {
    return await this._request(`/session-groups/batch-delete`, {
      method: "POST",
      data: { ids },
    });
  },

  async reorderSessionGroups(this: ApiContext, groupIds: string[]) {
    return await this._request("/session-groups/reorder", {
      method: "POST",
      data: { groupIds },
    });
  },

  async generateSessionTitle(this: ApiContext, sessionId: string) {
    return await this._request(`/sessions/${sessionId}/generate-title`, {
      method: "POST",
    });
  },

  async compressSession(this: ApiContext, sessionId: string) {
    return await this._request(`/sessions/${sessionId}/compress`, {
      method: "POST",
    });
  },

  async fetchSessionSummaries(this: ApiContext, sessionId: string, limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return await this._request(`/sessions/${sessionId}/summaries${params}`, {
      method: "GET",
    });
  },

  async updateSummary(this: ApiContext, summaryId: string, data: { summaryContent?: string }) {
    return await this._request(`/sessions/summaries/${summaryId}`, {
      method: "PUT",
      data,
    });
  },

  async deleteSummary(this: ApiContext, summaryId: string) {
    return await this._request(`/sessions/summaries/${summaryId}`, {
      method: "DELETE",
    });
  },

  async fetchSessionTokenStats(this: ApiContext, sessionId: string) {
    return await this._request(`/sessions/${sessionId}/token-stats`);
  },

  /**
   * 落库会话上下文用量快照（流式结束时调用）
   *
   * 后端把快照存进 sys_ai_session.settings.contextStats，页面刷新后
   * fetchSessionTokenStats 即可恢复占用率，无需重新对话。
   *
   * breakdown 是 token 构成（系统提示词/摘要/用户输入/历史消息/工具定义），
   * 与已用/窗口同源，一并存下去，否则刷新后「上下文已用」卡片只剩一根占用条。
   */
  async saveSessionTokenStats(
    this: ApiContext,
    sessionId: string,
    stats: {
      usedTokens: number;
      effectiveContextWindow: number;
      breakdown?: Record<string, number>;
    },
  ) {
    return await this._request(`/sessions/${sessionId}/token-stats`, {
      method: "PUT",
      data: stats,
    });
  },

  async getWorkspacePath(this: ApiContext, sessionId: string) {
    return await this._request(`/sessions/${sessionId}/workspace-path`);
  },

  async getSessionTodo(this: ApiContext, sessionId: string) {
    return await this._request(`/sessions/${sessionId}/todo`);
  },
};
