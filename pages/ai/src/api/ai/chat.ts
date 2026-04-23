import { getConfig } from "@repo/config";
import { http, type ReturnResult } from "@repo/utils";

export interface AiChatRequest {
  sessionId?: number;
  modelCode: string;
  prompt: string;
  system?: string;
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

export const streamAiChat = (data: AiChatRequest) => {
  return {
    url: `${getConfig().BaseUrl}/v2/ai/chat/stream`,
    body: JSON.stringify(data),
  };
};
