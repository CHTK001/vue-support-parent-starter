import { http, unwrapList } from "./http";

export interface SessionItem {
  id: string;
  title: string;
  characterId?: string;
  modelId?: string;
  updatedAt?: string;
  lastActiveAt?: string;
}

export interface MessageContentBlock {
  content?: string | null;
  reasoningContent?: string | null;
}

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  contents?: MessageContentBlock[];
  state?: { isStreaming?: boolean; isThinking?: boolean };
  createdAt?: string;
}

/** 会话列表（GET /v2/sessions），与 PC 端同一数据源 */
export async function fetchSessions(limit = 20): Promise<SessionItem[]> {
  return unwrapList<SessionItem>(await http.get("/sessions", { limit }));
}

/** 新建会话（POST /v2/sessions），characterId 必填（与 PC 端 CreateSessionRequest 一致） */
export function createSession(payload: {
  characterId: string;
  title?: string;
  settings?: Record<string, any>;
}): Promise<SessionItem> {
  return http.post<SessionItem>("/sessions", payload);
}

/** 历史消息（GET /v2/sessions/:id/messages），返回 { items, total, hasMore? } */
export async function fetchSessionMessages(sessionId: string, limit = 50): Promise<MessageItem[]> {
  return unwrapList<MessageItem>(await http.get(`/sessions/${sessionId}/messages`, { limit }));
}

/** 停止当前会话的流式生成（POST /v2/chat/stream/:sessionId/stop） */
export function stopStream(sessionId: string): Promise<unknown> {
  return http.post(`/chat/stream/${sessionId}/stop`);
}

/** 从消息对象提取可展示文本（contents 为内容块数组） */
export function messageText(message: MessageItem): string {
  return (message.contents || [])
    .map((block) => block.content || "")
    .join("")
    .trim();
}

/** 从消息对象提取思考内容 */
export function messageReasoning(message: MessageItem): string {
  return (message.contents || [])
    .map((block) => block.reasoningContent || "")
    .join("")
    .trim();
}
