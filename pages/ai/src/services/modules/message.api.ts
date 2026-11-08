import type { ApiContext } from "./api-context";
// Message 统一取自 @/utils/messageUtils：UI 组件（TurnItem 等）的 emit 签名
// 以该定义为契约，若此处另引 @/types/message 的另一份定义会与之不兼容
import type { Message } from "@/utils/messageUtils";
import type { PaginatedResponse } from "@/types/common";
import type { SessionTrace } from "@/components/chat/trace/traceTypes";

/**
 * 会话配置分组：与后端 SessionGlobalSettingProvider.GROUP 一致。
 */
const SESSION_GROUP = "session";

/**
 * 「初始化加载最新的记录数量」字段名：与后端 SessionGlobalSettingProvider 的
 * initial_load_turns 逐字一致。
 */
const FIELD_INITIAL_LOAD_TURNS = "initial_load_turns";

/** 会话配置读不到时的兜底轮次：与后端 SPI 声明的默认值 10 对齐 */
const DEFAULT_INITIAL_LOAD_TURNS = 10;

/**
 * 轮次数上限：与后端 MAX_INITIAL_TURNS 对齐。
 * 这个值决定首屏铺多少轮历史，配成天文数字等于回到「一次拉全量」。
 */
const MAX_INITIAL_LOAD_TURNS = 50;

/**
 * 生效轮次的进程内缓存（含 in-flight 去重）。
 *
 * <p>首屏消息请求在会话切换时会连续发多次，而配置在一次页面生命周期内不会变；
 * 不缓存就会为每次开会话多打一次 /settings/session/merged。配置页保存后调用
 * {@link invalidateInitialLoadTurnsCache} 失效，不需要刷新页面。</p>
 */
let initialLoadTurnsPromise: Promise<number> | null = null;

/**
 * 让缓存的「初始化加载轮次」失效，下次取会话消息时重新读配置。
 *
 * 会话配置页保存后调用：否则用户改完设置再开会话，读到的还是旧值。
 */
export function invalidateInitialLoadTurnsCache(): void {
  initialLoadTurnsPromise = null;
}

/**
 * 取本人生效的「初始化加载最新的记录数量」（单位：用户轮次）。
 *
 * <p>来源是 session 分组的合并视图（全局默认 + 本人覆盖），与设置中心显示的是同一份值；
 * 读不到就回落 {@link DEFAULT_INITIAL_LOAD_TURNS}，不让首屏因为一次配置请求失败而多铺历史。</p>
 *
 * @param ctx 请求上下文（apiService 实例）
 * @returns 生效的轮次数；0 表示未配置出可用值
 */
async function resolveInitialLoadTurns(ctx: ApiContext): Promise<number> {
  if (!initialLoadTurnsPromise) {
    initialLoadTurnsPromise = (async () => {
      const response: any = await ctx._request(`/settings/${SESSION_GROUP}/merged`);
      // merged 接口是双层信封（见 SessionConfigSettings.pickField 的注释），两种形态都兜住
      const first = response?.data ?? response;
      const items = Array.isArray(first) ? first : Array.isArray(first?.data) ? first.data : [];
      const item = items.find((it: any) => it?.field === FIELD_INITIAL_LOAD_TURNS);
      const raw = Number(item?.value ?? item?.defaultValue);
      if (!Number.isFinite(raw) || raw <= 0) {
        return DEFAULT_INITIAL_LOAD_TURNS;
      }
      return Math.min(Math.trunc(raw), MAX_INITIAL_LOAD_TURNS);
    })().catch((error) => {
      // 失败不缓存：下一次开会话还有机会读到真实配置
      initialLoadTurnsPromise = null;
      console.warn("[messages] 读取会话配置 initial_load_turns 失败，按默认轮次加载:", error);
      return DEFAULT_INITIAL_LOAD_TURNS;
    });
  }
  return initialLoadTurnsPromise;
}

/**
 * 会话消息列表响应。
 *
 * <p>后端除 items / total 外还回带两个字段：{@code hasMore}（本次最早一条之前还有没有消息）
 * 与 {@code initialTurnsApplied}（本次是否按用户轮次开窗）。</p>
 *
 * <p>{@code hasMore} 是必须的：首屏改成「按轮次」后，返回条数不再等于请求条数，
 * 调用方若继续用「条数 >= 请求条数」猜有没有更多历史，会得出「没有更多消息」的错结论。</p>
 */
export type SessionMessagesResponse = PaginatedResponse<Message> & {
  hasMore?: boolean;
  initialTurnsApplied?: boolean;
};

export interface MessageApi {
  fetchSessionMessages(
    sessionId: string,
    options?: {
      limit?: number;
      beforeMessageId?: string;
      afterMessageId?: string;
    },
  ): Promise<SessionMessagesResponse>;
  importMessages(sessionId: string, messages: any[]): Promise<any>;
  createMessage(
    sessionId: string,
    content: string,
    files?: any[],
    replaceMessageId?: string | null,
    knowledgeBaseIds?: string[],
  ): Promise<Message>;
  clearSessionMessages(sessionId: string): Promise<boolean>;
  deleteMessage(messageId: string): Promise<{ success: boolean }>;
  updateMessage(messageId: string, data: any): Promise<Message>;
  fetchMessageContentToolDetails(contentId: string): Promise<{
    toolCalls: any[];
    toolCallsResponse: any[];
  }>;
  copyMessageFile(messageId: string, fileId: string): Promise<any>;
  webSearch(messageId: string): Promise<any>;
  /**
   * 拉取会话的执行轨迹（点事件 + 可配对区间），供会话顶部「轨迹」页签画甘特图。
   *
   * 后端映射：GET /v2/sessions/{sessionId}/traces
   */
  fetchSessionTraces(sessionId: string): Promise<{ items: SessionTrace[]; total: number }>;
}

export const messageApi: MessageApi = {
  async fetchSessionMessages(
    this: ApiContext,
    sessionId: string,
    options?: {
      limit?: number;
      beforeMessageId?: string;
      afterMessageId?: string;
    },
  ) {
    const params = new URLSearchParams();
    if (options?.limit !== undefined) params.append("limit", options.limit.toString());
    if (options?.beforeMessageId) params.append("beforeMessageId", options.beforeMessageId);
    if (options?.afterMessageId) params.append("afterMessageId", options.afterMessageId);

    /*
     * 首屏（没有翻页游标的那一次）额外带上「按用户轮次」的初始窗口。
     *
     * 为什么在这里兜这一手：limit 是原始消息条数，一轮问答里的助手回复也各占一条，
     * 同一份配置在不同形状的会话（重新回答/继续会多出 assistant 行）里落到的轮数并不一样，
     * 而用户看到的「条」是轮次。会话配置里的「初始化加载最新的记录数量」按轮次定义，
     * 这里把它转发给后端（见 AiSessionController#messages 的 initialTurns）。
     *
     * limit 一并保留：尚未升级的后端不认识 initialTurns 时仍按 limit 截断，
     * 不会因为多了个参数就退化成「把整段历史一次拉回来」。
     */
    const isInitialWindow = !options?.beforeMessageId && !options?.afterMessageId;
    if (isInitialWindow) {
      const turns = await resolveInitialLoadTurns(this);
      if (turns > 0) {
        params.append("initialTurns", turns.toString());
      }
    }

    const queryString = params.toString();
    const url = queryString
      ? `/sessions/${sessionId}/messages?${queryString}`
      : `/sessions/${sessionId}/messages`;

    return (await this._request(url)) as SessionMessagesResponse;
  },

  async fetchSessionTraces(this: ApiContext, sessionId: string) {
    return (await this._request(`/sessions/${sessionId}/traces`)) as {
      items: SessionTrace[];
      total: number;
    };
  },

  async importMessages(this: ApiContext, sessionId: string, messages: any[]) {
    return await this._request(`/sessions/${sessionId}/messages/import`, {
      method: "POST",
      data: messages,
    });
  },

  async createMessage(
    this: ApiContext,
    sessionId: string,
    content: string,
    files: any[] = [],
    replaceMessageId: string | null = null,
    knowledgeBaseIds?: string[],
  ) {
    return await this._request(`/sessions/${sessionId}/messages`, {
      method: "POST",
      data: {
        content,
        files,
        replaceMessageId: replaceMessageId,
        knowledgeBaseIds: knowledgeBaseIds,
      },
    });
  },

  /**
   * 清空会话的全部消息。
   *
   * <p>后端没有「整会话清空」端点：`DELETE /sessions/{id}/messages` 会命中同一路径的
   * GET 映射，返回 405「不支持DELETE请求，请使用GET方法」，顶栏「更多操作 → 清空记录」
   * 因此必然提示「操作失败」。这里改走既有可用的 `DELETE /sessions/messages/{messageId}`：
   * 先按批量 limit 取回历史（不传 initialTurns，避免只拿到首屏窗口），再逐条删除。
   * 删用户消息时后端会级联删除对应助手消息，重复删除返回成功，因此可以安全循环到取空。</p>
   *
   * <p>等后端补上真正的批量清理端点，把这里换回单个请求即可。</p>
   */
  async clearSessionMessages(this: ApiContext, sessionId: string) {
    // 单次取回上限：与后端 limit 参数一致，按条数截断；循环直到取空
    const PAGE_SIZE = 200;
    // 上限保护：即使后端持续返回不可删除的数据也不会无限循环
    const MAX_PASSES = 50;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      const response: any = await this._request(
        `/sessions/${sessionId}/messages?limit=${PAGE_SIZE}`,
      );
      const items: any[] = Array.isArray(response?.items) ? response.items : [];
      if (items.length === 0) break;
      let deletedThisPass = 0;
      for (const item of items) {
        const id = item?.id;
        if (id === undefined || id === null || id === "") continue;
        await this._request(`/sessions/messages/${id}`, { method: "DELETE" });
        deletedThisPass += 1;
      }
      if (deletedThisPass === 0) break;
    }
    return true;
  },

  async deleteMessage(this: ApiContext, messageId: string) {
    return await this._request(`/sessions/messages/${messageId}`, { method: "DELETE" });
  },

  async updateMessage(this: ApiContext, messageId: string, data: any) {
    // 后端映射：PUT /v2/sessions/messages/{messageId}（AiSessionController 基路径 /v2/sessions）。
    // 之前这里拼的是 /messages/{id}，根本没有这个端点 → 编辑消息（改内容/重命名）全部失败。
    return await this._request(`/sessions/messages/${messageId}`, {
      method: "PUT",
      data,
    });
  },

  async fetchMessageContentToolDetails(this: ApiContext, contentId: string) {
    return await this._request(`/message-content/${contentId}/tool-details`);
  },

  async copyMessageFile(this: ApiContext, messageId: string, fileId: string) {
    return await this._request(`/files/${fileId}`, {
      method: "PUT",
      data: { type: "copy", messageId: messageId },
    });
  },

  async webSearch(this: ApiContext, messageId: string) {
    return await this._request(`/messages/${messageId}/web_search`, {
      method: "GET",
    });
  },
};
