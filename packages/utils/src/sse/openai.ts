/**
 * OpenAI 协议 SSE 客户端
 *
 * 适配 OpenAI /v1/chat/completions 的流式响应格式。
 * 兼容 spring-support-ai-starter 的 OpenAI 协议实现。
 *   const client = createOpenAiSseClient('/v1/chat/completions', { onChunk: (chunk) => {...} })
 */
import { createSseClient, type SseClient } from "./client";
import type { SseClientOptions } from "./types";

export interface OpenAiChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export interface OpenAiSseOptions extends Omit<SseClientOptions<OpenAiChunk>, "onMessage" | "parseData"> {
  /** 收到每个增量块 */
  onChunk?: (chunk: OpenAiChunk, raw: string) => void;
  /** 流开始 */
  onStart?: () => void;
  /** 流结束（含 finish_reason='stop'） */
  onEnd?: (fullContent: string) => void;
  /** 流错误 */
  onError?: (err: unknown) => void;
}

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
