import { http, type ReturnResult } from "@repo/utils";

export interface AiChatRequest {
  sessionId?: number;
  modelCode: string;
  prompt: string;
  system?: string;
  think?: boolean;
  files?: Array<{
    name?: string;
    type?: string;
    url?: string;
  }>;
}

export const listChatModels = async () => {
  return http.request<ReturnResult<string[]>>("get", "/v2/ai/chat/models");
};

export const callAiChat = async (data: AiChatRequest) => {
  return http.request<ReturnResult<{ text: string; model: string; sessionId?: number }>>(
    "post",
    "/v2/ai/chat/call",
    { data },
  );
};

export const optimizeAiChatInput = async (data: AiChatRequest) => {
  return http.request<ReturnResult<{ text: string; model: string }>>(
    "post",
    "/v2/ai/chat/optimize",
    { data },
  );
};

export const streamAiChat = (
  data: AiChatRequest,
  handlers: {
    onmessage?: (event: MessageEvent) => void;
    onopen?: (response: Response) => void;
    onerror?: (error: any) => void;
    onclose?: () => void;
  } = {},
) => {
  return http.sse("/v2/ai/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    ...handlers,
  });
};
