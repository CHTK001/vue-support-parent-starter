/**
 * world-sim.api — 模拟（世界沙盒）前端 API
 *
 * 后端：/v2/world-sim
 *  - worlds        世界列表 / 建世界 / 详情视图 / 更新 / 删除
 *  - scenes        场景 CRUD
 *  - npcs          世界 NPC CRUD
 *  - relationships 关系网 / 更新关系
 *  - events        事件时间线
 *  - messages      场景对话历史
 *  - chat/stream   场景对话 SSE（世界状态 + 场景 + 关系网注入提示词）
 *  - advance       推进时间，生成「世界动态」事件
 *
 * 世界 = 沙盒顶层（世界观/时代/天气/时间），场景 = 地点，NPC = 复用角色库，
 * 关系 = NPC 间好感度，事件 = 推进与互动的时间线。
 */
import type { ApiContext } from "./api-context";
import { createClient, httpAt } from "@/framework/context";
import { getClientId } from "@/utils/clientId";

export interface WorldItem {
  id: number;
  name: string;
  description?: string | null;
  era?: string | null;
  weather?: string | null;
  timeLabel?: string | null;
  tickCount?: number;
  status?: number;
  sceneCount?: number;
  npcCount?: number;
  lastEventTitle?: string | null;
  createTime?: string | null;
}

export interface WorldScene {
  id: number;
  worldId: number;
  name: string;
  description?: string | null;
  sort?: number;
}

export interface WorldNpc {
  id: number;
  worldId: number;
  roleId?: number;
  sceneId?: number | null;
  nickname?: string | null;
  avatar?: string | null;
  modelOverride?: string | null;
  temperature?: number | null;
  persona?: string | null;
  isActive?: boolean;
  roleName?: string;
  sysPrompt?: string;
  roleModel?: string | null;
  displayName?: string;
  displayAvatar?: string | null;
}

export interface WorldRelationship {
  id: number;
  fromNpcId: number;
  toNpcId: number;
  affinity?: number;
  relationTag?: string | null;
  memo?: string | null;
  fromName?: string;
  toName?: string;
  fromAvatar?: string | null;
  toAvatar?: string | null;
}

export interface WorldEvent {
  id?: number;
  worldId: number;
  sceneId?: number | null;
  eventType?: string;
  roleIds?: string | null;
  title?: string;
  content?: string;
  createTime?: string;
}

export interface WorldMessage {
  id?: number;
  worldId: number;
  sceneId?: number | null;
  speakerType: "user" | "ai";
  speakerId?: string;
  speakerName?: string;
  content?: string;
  modelName?: string;
  atRoleId?: number | null;
  createTime?: string;
}

export interface WorldView {
  world: WorldItem;
  scenes: WorldScene[];
  npcs: WorldNpc[];
  relationships: WorldRelationship[];
  events: WorldEvent[];
}

export interface WorldStreamEvent {
  type?: string;
  content?: string;
  speakerType?: string;
  speakerId?: string;
  speakerName?: string;
  modelName?: string;
  finishReason?: string;
  error?: string;
  /** 本轮实际应答的供应商 */
  route?: {
    model?: string;
    providerId?: string | null;
    providerName?: string;
    platform?: string;
    baseUrl?: string;
    providerResolved?: boolean;
  };
  [k: string]: unknown;
}

export interface WorldSimApi {
  fetchWorlds(): Promise<WorldItem[]>;
  fetchWorldView(worldId: number): Promise<WorldView>;
  createWorld(name: string, description?: string, era?: string): Promise<WorldItem>;
  updateWorld(worldId: number, patch: Partial<WorldItem>): Promise<WorldItem>;
  deleteWorld(worldId: number): Promise<unknown>;

  fetchWorldScenes(worldId: number): Promise<WorldScene[]>;
  createWorldScene(worldId: number, data: { name: string; description?: string }): Promise<WorldScene>;
  updateWorldScene(sceneId: number, patch: Partial<WorldScene>): Promise<WorldScene>;
  deleteWorldScene(sceneId: number): Promise<unknown>;

  fetchWorldNpcs(worldId: number): Promise<WorldNpc[]>;
  addWorldNpc(worldId: number, data: Partial<WorldNpc>): Promise<WorldNpc>;
  updateWorldNpc(npcId: number, patch: Partial<WorldNpc>): Promise<WorldNpc>;
  removeWorldNpc(npcId: number): Promise<unknown>;

  fetchWorldRelationships(worldId: number): Promise<WorldRelationship[]>;
  updateWorldRelationship(relId: number, patch: Partial<WorldRelationship>): Promise<WorldRelationship>;

  fetchWorldEvents(worldId: number, sceneId?: number | null, limit?: number): Promise<WorldEvent[]>;
  fetchWorldMessages(worldId: number, sceneId: number): Promise<WorldMessage[]>;

  worldChatStream(
    params: { worldId: number; sceneId?: number | null; content: string; atNpcId?: number | null },
    handlers: {
      onEvent: (ev: WorldStreamEvent) => void;
      onError?: (err: unknown) => void;
      onClose?: () => void;
    },
  ): { close: () => void };

  advanceWorld(worldId: number): Promise<{ world: WorldItem; event: WorldEvent; participants: string[] }>;
}

export const worldSimApi: WorldSimApi = {
  async fetchWorlds(this: ApiContext) {
    const raw = await this._request("/world-sim/worlds");
    return (Array.isArray(raw) ? raw : raw?.items ?? []) as WorldItem[];
  },

  async fetchWorldView(this: ApiContext, worldId: number) {
    return await this._request(`/world-sim/worlds/${worldId}/view`);
  },

  async createWorld(this: ApiContext, name: string, description?: string, era?: string) {
    return await this._request("/world-sim/worlds", {
      method: "POST",
      data: { name, description: description || "", era: era || "现代" },
    });
  },

  async updateWorld(this: ApiContext, worldId: number, patch: Partial<WorldItem>) {
    return await this._request(`/world-sim/worlds/${worldId}`, { method: "PUT", data: patch });
  },

  async deleteWorld(this: ApiContext, worldId: number) {
    return await this._request(`/world-sim/worlds/${worldId}`, { method: "DELETE" });
  },

  async fetchWorldScenes(this: ApiContext, worldId: number) {
    const raw = await this._request(`/world-sim/worlds/${worldId}/scenes`);
    return (Array.isArray(raw) ? raw : raw?.items ?? []) as WorldScene[];
  },

  async createWorldScene(this: ApiContext, worldId: number, data: { name: string; description?: string }) {
    return await this._request(`/world-sim/worlds/${worldId}/scenes`, { method: "POST", data });
  },

  async updateWorldScene(this: ApiContext, sceneId: number, patch: Partial<WorldScene>) {
    return await this._request(`/world-sim/scenes/${sceneId}`, { method: "PUT", data: patch });
  },

  async deleteWorldScene(this: ApiContext, sceneId: number) {
    return await this._request(`/world-sim/scenes/${sceneId}`, { method: "DELETE" });
  },

  async fetchWorldNpcs(this: ApiContext, worldId: number) {
    const raw = await this._request(`/world-sim/worlds/${worldId}/npcs`);
    return (Array.isArray(raw) ? raw : raw?.items ?? []) as WorldNpc[];
  },

  async addWorldNpc(this: ApiContext, worldId: number, data: Partial<WorldNpc>) {
    return await this._request(`/world-sim/worlds/${worldId}/npcs`, { method: "POST", data });
  },

  async updateWorldNpc(this: ApiContext, npcId: number, patch: Partial<WorldNpc>) {
    return await this._request(`/world-sim/npcs/${npcId}`, { method: "PUT", data: patch });
  },

  async removeWorldNpc(this: ApiContext, npcId: number) {
    return await this._request(`/world-sim/npcs/${npcId}`, { method: "DELETE" });
  },

  async fetchWorldRelationships(this: ApiContext, worldId: number) {
    const raw = await this._request(`/world-sim/worlds/${worldId}/relationships`);
    return (Array.isArray(raw) ? raw : raw?.items ?? []) as WorldRelationship[];
  },

  async updateWorldRelationship(this: ApiContext, relId: number, patch: Partial<WorldRelationship>) {
    return await this._request(`/world-sim/relationships/${relId}`, { method: "PUT", data: patch });
  },

  async fetchWorldEvents(this: ApiContext, worldId: number, sceneId?: number | null, limit?: number) {
    const params = new URLSearchParams();
    if (sceneId != null) params.set("sceneId", String(sceneId));
    if (limit != null) params.set("limit", String(limit));
    const qs = params.toString();
    const raw = await this._request(`/world-sim/worlds/${worldId}/events${qs ? "?" + qs : ""}`);
    return (Array.isArray(raw) ? raw : raw?.items ?? []) as WorldEvent[];
  },

  async fetchWorldMessages(this: ApiContext, worldId: number, sceneId: number) {
    const raw = await this._request(`/world-sim/worlds/${worldId}/scenes/${sceneId}/messages`);
    return (Array.isArray(raw) ? raw : raw?.items ?? []) as WorldMessage[];
  },

  worldChatStream(
    this: ApiContext,
    params: { worldId: number; sceneId?: number | null; content: string; atNpcId?: number | null },
    handlers: {
      onEvent: (ev: WorldStreamEvent) => void;
      onError?: (err: unknown) => void;
      onClose?: () => void;
    },
  ) {
    // 不解包：SSE 帧原样交给 onEvent（与酒馆同口径）
    const streamClient = createClient(
      () => httpAt(this.baseURL, { "X-Client-Id": getClientId() }),
      { unwrap: false },
    );
    return streamClient.sse<WorldStreamEvent>("/world-sim/chat/stream", {
      method: "POST",
      body: {
        worldId: params.worldId,
        sceneId: params.sceneId ?? null,
        content: params.content,
        atRoleId: params.atNpcId ?? null,
      },
      reconnect: false,
      credentials: "same-origin",
      onMessage: (event) => {
        const data = event.data as unknown;
        if (data === "[DONE]" || data === "") {
          return;
        }
        if (typeof data === "object" && data !== null) {
          handlers.onEvent(data as WorldStreamEvent);
        }
      },
      onError: (err: unknown) => handlers.onError?.(err),
      onClose: () => handlers.onClose?.(),
    });
  },

  async advanceWorld(this: ApiContext, worldId: number) {
    return await this._request("/world-sim/advance", { method: "POST", data: { worldId } });
  },
};