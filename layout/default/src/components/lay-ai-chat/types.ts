/**
 * lay-ai-chat 类型定义
 */

export type AiChatVendor = "hf" | "chrome" | "other";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatRequest {
  vendor: AiChatVendor;
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  userMessage: string;
  history: ChatMessage[];
}
