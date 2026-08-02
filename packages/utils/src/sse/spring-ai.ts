/**
 * 针对 spring-support-ai-starter 的 SSE 客户端
 *
 * 适配 Spring AI 的 MediaType.APPLICATION_NDJSON_VALUE / TEXT_EVENT_STREAM_VALUE
 * 支持 ChatClient 流式响应。
 *   const client = createSpringAiSseClient('/api/chat', { onChunk: (chunk) => {...} })
 */
import { createSseClient, type SseClient } from "./client";
import type { SseClientOptions } from "./types";

export interface SpringAiChunk {
  /** 消息 ID */
  id?: string;
  /** 角色 */
  role?: string;
  /** 当前内容（增量） */
  content?: string;
  /** 完整内容 */
  fullContent?: string;
  /** 元数据（tool_calls 等） */
  metadata?: Record<string, unknown>;
  /** 是否结束 */
  done?: boolean;
  /** 错误 */
  error?: string;
}

export interface SpringAiSseOptions extends Omit<SseClientOptions<SpringAiChunk>, "onMessage"> {
  /** 收到每个增量块 */
  onChunk?: (chunk: SpringAiChunk, raw: string) => void;
  /** 流开始 */
  onStart?: () => void;
  /** 流结束 */
  onEnd?: (fullContent: string) => void;
  /** 流错误 */
  onError?: (err: unknown) => void;
}

export function createSpringAiSseClient(
  url: string,
  options: SpringAiSseOptions = {},
): SseClient {
  let fullContent = "";
  let started = false;

  return createSseClient<SpringAiChunk>(url, {
    ...options,
    onOpen: () => {
      started = true;
      options.onStart?.();
      options.onOpen?.();
    },
    onMessage: (event) => {
      const chunk = event.data;
      if (chunk?.done) {
        options.onEnd?.(fullContent);
        return;
      }
      if (chunk?.error) {
        options.onError?.(new Error(chunk.error));
        return;
      }
      if (chunk?.content) {
        fullContent += chunk.content;
      }
      if (started) {
        options.onChunk?.(chunk, JSON.stringify(chunk));
      }
    },
  });
}
