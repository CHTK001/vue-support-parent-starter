import { http, type ReturnResult } from "@repo/utils";

// ── RAG 文档 ────────────────────────────────────────────

export interface RagDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  status: string; // PROCESSING / READY / FAILED
  errorMessage?: string;
  createTime: number;
}

export interface PaginatedResult {
  items: RagDocument[];
  page: number;
  pageSize: number;
  total: number;
}

export interface RagQuerySource {
  documentId: string;
  content: string;
  score: number;
}

export interface RagQueryResult {
  answer: string;
  sources: RagQuerySource[];
}

export interface RagStatus {
  engine: string;
  llmProvider: string;
  uploadDir: string;
  defaultTopK: number;
  defaultSimilarityThreshold: number;
  knowledgeClientReady: boolean;
}

// ── 文档管理 ────────────────────────────────────────────

/** 上传文档并索引到知识库 */
export const uploadDocument = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ReturnResult<RagDocument>>("post", "/v2/ai/rag/document/upload", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000,
  });
};

/** 分页查询文档列表 */
export const listDocuments = (page = 1, pageSize = 20) =>
  http.request<ReturnResult<PaginatedResult>>("get", "/v2/ai/rag/document/list", {
    params: { page, pageSize },
  });

/** 删除文档 */
export const deleteDocument = (id: string) =>
  http.request<ReturnResult<boolean>>("delete", `/v2/ai/rag/document/${id}`);

// ── 问答 ────────────────────────────────────────────────

/** RAG 问答 */
export const ragQuery = (query: string, topK = 5, threshold = 0.7) =>
  http.request<ReturnResult<RagQueryResult>>("post", "/v2/ai/rag/query", {
    data: { query, topK, threshold },
    timeout: 180000,
  });

// ── 状态与管理 ──────────────────────────────────────────

/** 获取 RAG 服务状态 */
export const getRagStatus = () =>
  http.request<ReturnResult<RagStatus>>("get", "/v2/ai/rag/status");

/** 重置并重新索引全部文档 */
export const resetRag = () =>
  http.request<ReturnResult<number>>("post", "/v2/ai/rag/reset");
