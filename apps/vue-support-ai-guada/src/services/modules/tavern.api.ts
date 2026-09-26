/**
 * tavern.api — 酒馆（多角色群聊）前端 API
 *
 * 后端：/v2/tavern
 *  - groups     我的群列表 / 建群 / 更新群配置 / 删群
 *  - members    群成员 / 拉角色进群 / 移出 / 改模型覆盖
 *  - messages   群消息历史
 *  - chat/stream 群聊 SSE（路由：@ > 默认成员 > 自动路由）
 *
 * 群主 = 当前登录用户本人（真人），群员 = 拉进来的 AI 角色。
 */
import type { ApiContext } from "./api-context";
import { createClient, httpAt } from "@/framework/context";
import { getClientId } from "@/utils/clientId";

export interface TaverGroup {
  id: number;
  name: string;
  avatar?: string | null;
  defaultMemberId?: number | null;
  autoRoute?: number;
  memberCount?: number;
  createTime?: string | null;
}

export interface TaverMember {
  id: number;
  groupId: number;
  roleId: number;
  modelOverride?: string | null;
  randomReplyEnabled?: boolean;
  randomProbability?: number;
  randomContextCount?: number;
  sort?: number;
  roleName?: string;
  roleDescription?: string;
  roleAvatar?: string | null;
  roleModel?: string | null;
  systemPrompt?: string;
  temperature?: number;
}

export interface TaverMessage {
  id?: number;
  groupId: number;
  speakerType: "user" | "ai";
  speakerId?: string;
  speakerName?: string;
  content?: string;
  modelName?: string;
  atRoleId?: number | null;
  createTime?: string;
}

export interface TavernStreamEvent {
  type?: string;
  content?: string;
  speakerType?: string;
  speakerId?: string;
  speakerName?: string;
  modelName?: string;
  finishReason?: string;
  error?: string;
  [k: string]: unknown;
}

export interface TavernApi {
  fetchTavernGroups(): Promise<TaverGroup[]>;
  createTavernGroup(name: string): Promise<TaverGroup>;
  updateTavernGroup(id: number, patch: Partial<TaverGroup>): Promise<TaverGroup>;
  deleteTavernGroup(id: number): Promise<unknown>;
  fetchTavernMembers(groupId: number): Promise<TaverMember[]>;
  addTavernMember(groupId: number, roleId: number, modelOverride?: string | null): Promise<TaverMember>;
  removeTavernMember(memberId: number): Promise<unknown>;
  updateTavernMember(memberId: number, patch: Partial<TaverMember>): Promise<TaverMember>;
  fetchTavernMessages(groupId: number): Promise<TaverMessage[]>;
  /** 发起群聊 SSE，返回 close 句柄 */
  tavernChatStream(
    params: { groupId: number; content: string; atRoleId?: number | null },
    handlers: {
      onEvent: (ev: TavernStreamEvent) => void;
      onError?: (err: unknown) => void;
      onClose?: () => void;
    },
  ): { close: () => void };
}

export const tavernApi: TavernApi = {
  async fetchTavernGroups(this: ApiContext) {
    const raw = await this._request("/tavern/groups");
    return (Array.isArray(raw) ? raw : raw?.items ?? []) as TaverGroup[];
  },

  async createTavernGroup(this: ApiContext, name: string) {
    return await this._request("/tavern/groups", { method: "POST", data: { name } });
  },

  async updateTavernGroup(this: ApiContext, id: number, patch: Partial<TaverGroup>) {
    return await this._request(`/tavern/groups/${id}`, { method: "PUT", data: patch });
  },

  async deleteTavernGroup(this: ApiContext, id: number) {
    return await this._request(`/tavern/groups/${id}`, { method: "DELETE" });
  },

  async fetchTavernMembers(this: ApiContext, groupId: number) {
    const raw = await this._request(`/tavern/groups/${groupId}/members`);
    return (Array.isArray(raw) ? raw : raw?.items ?? []) as TaverMember[];
  },

  async addTavernMember(this: ApiContext, groupId: number, roleId: number, modelOverride?: string | null) {
    return await this._request(`/tavern/groups/${groupId}/members`, {
      method: "POST",
      data: { roleId, modelOverride: modelOverride ?? null },
    });
  },

  async removeTavernMember(this: ApiContext, memberId: number) {
    return await this._request(`/tavern/members/${memberId}`, { method: "DELETE" });
  },

  async updateTavernMember(this: ApiContext, memberId: number, patch: Partial<TaverMember>) {
    return await this._request(`/tavern/members/${memberId}`, {
      method: "PUT",
      data: patch,
    });
  },

  async fetchTavernMessages(this: ApiContext, groupId: number) {
    const raw = await this._request(`/tavern/groups/${groupId}/messages`);
    return (Array.isArray(raw) ? raw : raw?.items ?? []) as TaverMessage[];
  },

  tavernChatStream(
    this: ApiContext,
    params: { groupId: number; content: string; atRoleId?: number | null },
    handlers: {
      onEvent: (ev: TavernStreamEvent) => void;
      onError?: (err: unknown) => void;
      onClose?: () => void;
    },
  ) {
    // 不解包：SSE 帧原样交给 onEvent
    const streamClient = createClient(
      () => httpAt(this.baseURL, { "X-Client-Id": getClientId() }),
      { unwrap: false },
    );
    return streamClient.sse<TavernStreamEvent>("/tavern/chat/stream", {
      method: "POST",
      body: {
        groupId: params.groupId,
        content: params.content,
        atRoleId: params.atRoleId ?? null,
      },
      reconnect: false,
      credentials: "same-origin",
      onMessage: (event) => {
        const data = event.data as unknown;
        if (data === "[DONE]" || data === "") {
          return;
        }
        if (typeof data === "object" && data !== null) {
          handlers.onEvent(data as TavernStreamEvent);
        }
      },
      onError: (err: unknown) => handlers.onError?.(err),
      onClose: () => handlers.onClose?.(),
    });
  },
};
