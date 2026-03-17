/**
 * lay-ai-chat 类型定义
 */

export type AiChatVendor = "hf" | "chrome" | "other" | "openai" | "deepseek" | "qwen" | "siliconflow" | "zhipu" | "moonshot" | "custom";

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
  /** 动态 system prompt，由调用方注入（如当前路由信息） */
  systemPrompt?: string;
}
