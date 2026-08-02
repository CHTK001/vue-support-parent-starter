/**
 * ReRagManager 类型定义
 */
export interface RagDocument {
  id: string;
  name: string;
  size?: number;
  status: "PENDING" | "INDEXING" | "READY" | "FAILED";
  errorMessage?: string;
  libraryId?: string;
  source?: "FILE" | "URL" | "TEXT";
  sourceUrl?: string;
  createdAt?: number;
  updatedAt?: number;
  chunkCount?: number;
}

export interface RagEmbeddingEngine {
  value: string;
  label: string;
}

export interface RagStatus {
  engine: string;
  llmProvider: string;
  uploadDir: string;
  defaultTopK: number;
  defaultSimilarityThreshold: number;
  ragClientReady: boolean;
  documentCount: number;
}

export interface ReRagManagerOptions {
  /** 后端 base URL */
  baseUrl: string;
  /** 知识库 ID */
  libraryId?: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 嵌入引擎列表 */
  embeddingEngines?: RagEmbeddingEngine[];
  /** 当前引擎 */
  engine?: string;
}
