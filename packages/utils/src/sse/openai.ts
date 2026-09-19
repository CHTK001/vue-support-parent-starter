/**
 * OpenAI 协议 SSE 客户端
 *
 * 适配 OpenAI /v1/chat/completions 的流式响应格式。
 * 兼容后端 AI 服务的 OpenAI 协议实现。
 *   const client = createOpenAiSseClient('/v1/chat/completions', { onChunk: (chunk) => {...} })
 */
import { createSseClient } from "./client";
import type { OpenAiChunk, OpenAiSseOptions, SseClient } from "../types";

/**
 * OpenAI SSE 解析：data: {...} 与结束标记 [DONE]
 */
const openAiParseData = (raw: string): OpenAiChunk | null => {
  if (!raw || raw === "[DONE]") return null;
  try {
    return JSON.parse(raw) as OpenAiChunk;
  } catch {
    return null;
  }
};

export function createOpenAiSseClient(
  url: string,
  options: OpenAiSseOptions = {},
): SseClient {
  let fullContent = "";
  let started = false;

  return createSseClient<OpenAiChunk | null>(url, {
    ...options,
    parseData: openAiParseData,
    onOpen: () => {
      started = true;
      options.onStart?.();
      options.onOpen?.();
    },
    onMessage: (event) => {
      const chunk = event.data;
      if (!chunk) {
        options.onEnd?.(fullContent);
        return;
      }
      const choice = chunk.choices?.[0];
      const content = choice?.delta?.content;
      if (content) {
        fullContent += content;
      }
      if (started) {
        options.onChunk?.(chunk, JSON.stringify(chunk));
      }
      if (choice?.finish_reason === "stop") {
        options.onEnd?.(fullContent);
      }
    },
  });
}
