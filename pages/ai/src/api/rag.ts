/** RAG 知识库接口 */
import { get, post, del } from './request';
import { uploadFile } from './upload';

/** RAG 文档元数据 */
export interface RagDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  status: 'PROCESSING' | 'READY' | 'FAILED' | string;
  errorMessage?: string;
  createTime: number;
  metadata?: Record<string, unknown>;
}

/** RAG 引用来源 */
export interface RagSource {
  documentId: string;
  content: string;
  score: number;
}

/** RAG 问答响应 */
export interface RagQueryResult {
  answer: string;
  sources: RagSource[];
}

/** 向量记录（浏览用） */
export interface RagVectorItem {
  documentId: string;
  score: number;
  content: string;
}

/** RAG 服务状态 */
export interface RagStatus {
  engine: string;
  llmProvider: string;
  uploadDir: string;
  defaultTopK: number;
  defaultSimilarityThreshold: number;
  ragClientReady: boolean;
  documentCount: number;
}

/** 文档列表分页结果 */
export interface RagDocumentListResult {
  records: RagDocument[];
  total: number;
  page: number;
  pageSize: number;
}

export const ragDocumentsApi = {
  /** 上传文档 */
  upload: (file: File, libraryId?: string) =>
    uploadFile<RagDocument>('/v2/rag/document/upload', file, {
      ...(libraryId ? { libraryId } : {}),
    }),
  /** 文档列表（分页） */
  list: (params?: { page?: number; pageSize?: number; libraryId?: string }) =>
    get<RagDocumentListResult>('/v2/rag/document/list', params || {}),
  /** 删除文档 */
  delete: (id: string) => del<boolean>(`/v2/rag/document/${id}`),
  /** 文档原始内容（仅文本文件） */
  content: (id: string) => get<string>(`/v2/rag/document/${id}/content`),
  /** 从 URL 抓取文档 */
  addByUrl: (url: string) =>
    post<RagDocument>('/v2/rag/document/url', { url }),
};

export const ragApi = {
  /** RAG 问答 */
  query: (query: string, options?: { topK?: number; threshold?: number }) =>
    post<RagQueryResult>('/v2/rag/query', {
      query,
      topK: options?.topK,
      threshold: options?.threshold,
    }),
  /** RAG 服务状态 */
  status: () => get<RagStatus>('/v2/rag/status'),
  /** 重置索引（清空向量 + 重新索引） */
  reset: () => post<number>('/v2/rag/reset'),
  /** 可用 Embedding 引擎 */
  embeddingEngines: () =>
    get<Array<{ value: string; label: string }>>('/v2/rag/embedding-engines'),
  /** 向量列表（分页浏览） */
  listVectors: (params?: { page?: number; pageSize?: number }) =>
    get<{ records: unknown[]; total: number; page: number; pageSize: number }>(
      '/v2/rag/vector/list',
      params || {},
    ),
  /** 向量搜索（仅搜索，不走 LLM） */
  searchVectors: (query: string, topK?: number) =>
    get<RagVectorItem[]>('/v2/rag/vector/search', { query, topK: topK || 10 }),
};
