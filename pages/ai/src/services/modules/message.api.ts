import type { ApiContext } from "./api-context";
// Message 统一取自 @/utils/messageUtils：UI 组件（TurnItem 等）的 emit 签名
// 以该定义为契约，若此处另引 @/types/message 的另一份定义会与之不兼容
import type { Message } from "@/utils/messageUtils";
import type { PaginatedResponse } from "@/types/common";
import type { SessionTrace } from "@/components/chat/trace/traceTypes";

export interface MessageApi {
  fetchSessionMessages(
    sessionId: string,
    options?: {
      limit?: number;
      beforeMessageId?: string;
      afterMessageId?: string;
    },
  ): Promise<PaginatedResponse<Message>>;
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

    const queryString = params.toString();
    const url = queryString
      ? `/sessions/${sessionId}/messages?${queryString}`
      : `/sessions/${sessionId}/messages`;

    return await this._request(url);
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

  async clearSessionMessages(this: ApiContext, sessionId: string) {
    return await this._request(`/sessions/${sessionId}/messages`, {
      method: "DELETE",
    });
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
