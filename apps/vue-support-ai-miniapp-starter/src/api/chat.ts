import { getMpAppContext } from "@repo/app";
import { API_PREFIX, STORAGE_KEY_CLIENT_ID, STREAM_TIMEOUT } from "../config";
import { http } from "./http";

/**
 * 对话接口（与 PC 端同一套 /v2 契约）。
 *
 * <p>流式部分只声明事件语义；URL 拼接、Bearer、分块接收、SSE 分帧、
 * 增量 UTF-8 解码、401 处理全部在 {@code @repo/app} 的 {@code ctx.sse} 里，
 * 本文件不再直接调用 {@code uni.request}。</p>
 */

/** 流式事件（与 PC 端 StreamEvent 对齐的常用子集，其余字段原样透传） */
export interface StreamEvent {
  type: string;
  [key: string]: any;
}

export interface StreamHandlers {
  /** 收到一条业务事件（create/think/text/tool_call/finish/turn_end…） */
  onEvent: (event: StreamEvent) => void;
  onError: (error: Error) => void;
  /** 流结束（收到 [DONE] 或连接关闭） */
  onDone: () => void;
}

export interface ChatStreamParams {
  sessionId: string;
  /** 用户消息正文 */
  content: string;
  think?: boolean;
  search?: boolean;
}

/** 对话客户端标识（随请求头发给后端），首次生成后落本地存储 */
function clientId(): string {
  const { storage } = getMpAppContext();
  let id = storage.get<string>(STORAGE_KEY_CLIENT_ID) ?? "";
  if (!id) {
    id = `mp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    storage.set(STORAGE_KEY_CLIENT_ID, id);
  }
  return id;
}

/** 当前环境是否支持分块响应（SSE 的载体；微信基础库 2.20.1+ 才有） */
export function chunkedSupported(): boolean {
  return getMpAppContext().sse.supported();
}

/**
 * 发起流式对话：POST /v2/chat/stream（SSE over chunked response）。
 *
 * <p>请求体与 PC 端 ChatStreamService 同构；返回 abort 句柄用于中断本地流。
 * 环境不支持分块时同步抛错（框架已 abort，避免后端白跑一次 Agent），
 * 由调用方降级为 {@link sendFireAndForget}。</p>
 */
export function streamChat(
  params: ChatStreamParams,
  handlers: StreamHandlers,
): { abort: () => void } {
  return getMpAppContext().sse.stream(
    {
      url: `${API_PREFIX}/chat/stream`,
      data: {
        sessionId: params.sessionId,
        assistantMessageId: null,
        regenerationMode: null,
        stream: true,
        chatRequestId: `${params.sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userMessage: { content: params.content },
        think: params.think ?? false,
        search: params.search ?? false,
      },
      header: { "X-Client-Id": clientId() },
      timeout: STREAM_TIMEOUT,
    },
    {
      onMessage: (payload) => {
        const event = payload as StreamEvent;
        if (event && typeof event === "object" && typeof event.type === "string") {
          handlers.onEvent(event);
        }
      },
      onError: handlers.onError,
      onDone: handlers.onDone,
    },
  );
}

/**
 * 非流式发送（POST /v2/chat/send，fire-and-forget）：
 * 只投递用户消息并启动 Agent 循环，回复结果由调用方轮询历史消息获取。
 * 作为不支持分块响应环境的降级路径。
 */
export function sendFireAndForget(params: {
  sessionId: string;
  content: string;
}): Promise<{ success?: boolean }> {
  return http.post<{ success?: boolean }>("/chat/send", params);
}
