/**
 * ReRagChat 类型定义
 */
export interface RagChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
  timestamp: number;
}

export interface RagSource {
  documentId: string;
  content: string;
  score: number;
}

export interface RagQueryRequest {
  query: string;
  topK?: number;
  threshold?: number;
  libraryId?: string;
}

export interface RagQueryResponse {
  answer: string;
  sources: RagSource[];
}

export interface ReRagChatOptions {
  baseUrl: string;
  libraryId?: string;
  defaultTopK?: number;
  defaultThreshold?: number;
  headers?: Record<string, string>;
}
