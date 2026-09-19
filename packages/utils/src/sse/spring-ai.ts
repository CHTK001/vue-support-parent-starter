/**
 * 针对后端 Spring AI 服务的 SSE 客户端
 *
 * 适配 Spring AI 的 MediaType.APPLICATION_NDJSON_VALUE / TEXT_EVENT_STREAM_VALUE
 * 支持 ChatClient 流式响应。
 *   const client = createSpringAiSseClient('/api/chat', { onChunk: (chunk) => {...} })
 */
import { createSseClient } from "./client";
import type { SseClient, SpringAiChunk, SpringAiSseOptions } from "../types";

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
