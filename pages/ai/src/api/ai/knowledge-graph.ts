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
export const uploadDocument = (file: File, libraryId?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (libraryId) formData.append("libraryId", libraryId);
  return http.request<ReturnResult<RagDocument>>("post", "/v2/ai/rag/document/upload", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000,
  });
};

/** 分页查询文档列表 */
export const listDocuments = (page = 1, pageSize = 20, libraryId?: string) => {
  const params: Record<string, number | string> = { page, pageSize };
  if (libraryId) params.libraryId = libraryId;
  return http.request<ReturnResult<PaginatedResult>>("get", "/v2/ai/rag/document/list", { params });
};

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

// ══════════════════════════════════════════════════════════════
// 知识图谱（KG）— 实体 / 关系 / 图谱 / LLM 抽取
// ══════════════════════════════════════════════════════════════

export interface KgEntityItem {
  sysAiKnowledgeGraphEntityId: number;
  sysAiKnowledgeGraphEntityUid: string;
  sysAiKnowledgeGraphEntityName: string;
  sysAiKnowledgeGraphEntityType: string;
  sysAiKnowledgeGraphEntityProperties?: string;
  sysAiKnowledgeGraphEntitySource: string;
  sysAiKnowledgeGraphEntityWeight?: number;
  sysAiKnowledgeGraphEntityLogo?: string;
  sysAiKnowledgeGraphEntityStatus: number;
  sysAiKnowledgeGraphLibraryId?: number;
  createTime?: string;
}

export interface KgRelationItem {
  sysAiKnowledgeGraphRelationId: number;
  sysAiKnowledgeGraphRelationUid: string;
  sysAiKnowledgeGraphRelationSourceEntityUid: string;
  sysAiKnowledgeGraphRelationTargetEntityUid: string;
  sysAiKnowledgeGraphRelationSourceEntityName?: string;
  sysAiKnowledgeGraphRelationTargetEntityName?: string;
  sysAiKnowledgeGraphRelationType: string;
  sysAiKnowledgeGraphRelationProperties?: string;
  sysAiKnowledgeGraphRelationWeight: number;
  sysAiKnowledgeGraphRelationSource: string;
  sysAiKnowledgeGraphRelationStatus: number;
  sysAiKnowledgeGraphRelationLibraryId?: number;
  createTime?: string;
}

export interface KgGraphData {
  nodes: { id: string; label: string; group: string; weight?: number; img?: string; timeline?: { startYear?: number; endYear?: number } }[];
  edges: { from: string; to: string; label: string; weight: number }[];
}

export interface KgStatistics {
  entityCount: number;
  relationCount: number;
  entityTypeDistribution: { type: string; count: number }[];
  relationTypeDistribution?: { type: string; count: number }[];
}

// ── 实体 CRUD ──

export const listEntities = (params?: {
  keyword?: string;
  type?: string;
  libraryId?: number;
  page?: number;
  size?: number;
}) => http.request<ReturnResult<{ records: KgEntityItem[]; total: number }>>(
  "get", "/v2/ai/knowledge-graph/entity/list", { params },
);

export const getEntityDetail = (id: number) =>
  http.request<ReturnResult<KgEntityItem>>("get", `/v2/ai/knowledge-graph/entity/detail/${id}`);

export const createEntity = (data: Partial<KgEntityItem>) =>
  http.request<ReturnResult<boolean>>("post", "/v2/ai/knowledge-graph/entity/create", { data });

export const updateEntity = (data: Partial<KgEntityItem>) =>
  http.request<ReturnResult<boolean>>("put", "/v2/ai/knowledge-graph/entity/update", { data });

export const deleteEntity = (id: number) =>
  http.request<ReturnResult<boolean>>("delete", `/v2/ai/knowledge-graph/entity/delete/${id}`);

export const batchDeleteEntities = (ids: number[]) =>
  http.request<ReturnResult<boolean>>("post", "/v2/ai/knowledge-graph/entity/batch-delete", { data: { ids } });

export const batchDeleteRelations = (ids: number[]) =>
  http.request<ReturnResult<boolean>>("post", "/v2/ai/knowledge-graph/relation/batch-delete", { data: { ids } });

// ── 关系 CRUD ──

export const listRelations = (params?: {
  keyword?: string;
  type?: string;
  libraryId?: number;
  page?: number;
  size?: number;
}) => http.request<ReturnResult<{ records: KgRelationItem[]; total: number }>>(
  "get", "/v2/ai/knowledge-graph/relation/list", { params },
);

export const getRelationDetail = (id: number) =>
  http.request<ReturnResult<KgRelationItem>>("get", `/v2/ai/knowledge-graph/relation/detail/${id}`);

export const createRelation = (data: Partial<KgRelationItem>) =>
  http.request<ReturnResult<boolean>>("post", "/v2/ai/knowledge-graph/relation/create", { data });

export const updateRelation = (data: Partial<KgRelationItem>) =>
  http.request<ReturnResult<boolean>>("put", "/v2/ai/knowledge-graph/relation/update", { data });

export const deleteRelation = (id: number) =>
  http.request<ReturnResult<boolean>>("delete", `/v2/ai/knowledge-graph/relation/delete/${id}`);

// ── 图谱操作 ──

export const getGraphData = (params?: { type?: string; limit?: number; libraryId?: number }) =>
  http.request<ReturnResult<KgGraphData>>("get", "/v2/ai/knowledge-graph/graph-data", { params });

export const getStatistics = (params?: { libraryId?: number }) =>
  http.request<ReturnResult<KgStatistics>>("get", "/v2/ai/knowledge-graph/statistics", { params });

export const getEntityTypes = (params?: { libraryId?: number }) =>
  http.request<ReturnResult<string[]>>("get", "/v2/ai/knowledge-graph/entity-types", { params });

export const getRelationTypes = (params?: { libraryId?: number }) =>
  http.request<ReturnResult<string[]>>("get", "/v2/ai/knowledge-graph/relation-types", { params });

export const getNeighbors = (entityUid: string) =>
  http.request<ReturnResult<any[]>>("get", `/v2/ai/knowledge-graph/neighbors/${entityUid}`);

export const findPaths = (params: { fromUid: string; toUid: string; maxDepth?: number }) =>
  http.request<ReturnResult<any>>("get", "/v2/ai/knowledge-graph/find-paths", { params });

// ── LLM 抽取 ──

export const extractEntities = (data: { text: string; libraryId?: number }) =>
  http.request<ReturnResult<KgEntityItem[]>>("post", "/v2/ai/knowledge-graph/extract/entities", { data, timeout: 180000 });

export const extractRelations = (data: { text: string; entityIds?: number[]; libraryId?: number }) =>
  http.request<ReturnResult<KgRelationItem[]>>("post", "/v2/ai/knowledge-graph/extract/relations", { data, timeout: 180000 });

/** 基于知识库概要提取实体和关系（结合LLM网络知识） */
export const extractFromSummary = (data: { libraryId: number }) =>
  http.request<ReturnResult<any>>("post", "/v2/ai/knowledge-graph/extract/from-summary", { data, timeout: 180000 });

export const queryGraph = (data: { question: string; libraryId?: number }) =>
  http.request<ReturnResult<{ answer: string }>>("post", "/v2/ai/knowledge-graph/query", { data, timeout: 180000 });

// ── 文件抽取 ──

export const extractTextFromFile = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ReturnResult<{ text: string; filename: string }>>("post", "/v2/ai/knowledge-graph/extract/text-from-file", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000,
  });
};

export const extractEntitiesFromFile = (file: File, libraryId?: number) => {
  const formData = new FormData();
  formData.append("file", file);
  if (libraryId) formData.append("libraryId", String(libraryId));
  return http.request<ReturnResult<KgEntityItem[]>>("post", "/v2/ai/knowledge-graph/extract/from-file", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000,
  });
};

export const extractRelationsFromFile = (file: File, entityIds?: string, libraryId?: number) => {
  const formData = new FormData();
  formData.append("file", file);
  if (entityIds) formData.append("entityIds", entityIds);
  if (libraryId) formData.append("libraryId", String(libraryId));
  return http.request<ReturnResult<KgRelationItem[]>>("post", "/v2/ai/knowledge-graph/extract/relations-from-file", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000,
  });
};

// ── 管理 ──

export const clearGraph = (params?: { libraryId?: number }) =>
  http.request<ReturnResult<boolean>>("delete", "/v2/ai/knowledge-graph/clear", { params });

export const deduplicateEntities = (params?: { libraryId?: number }) =>
  http.request<ReturnResult<{ deletedCount: number }>>("delete", "/v2/ai/knowledge-graph/deduplicate-entities", { params });

export const cleanupMisclassifiedConcepts = (params?: { libraryId?: number }) =>
  http.request<ReturnResult<{ deletedCount: number }>>("delete", "/v2/ai/knowledge-graph/cleanup-concepts", { params });

// ── 实体画像 ──

export interface KgEntityProfile {
  entity: KgEntityItem;
  attributes: KgEntityAttribute[];
  relations: {
    relationId: number;
    relationType: string;
    sourceUid: string;
    targetUid: string;
    sourceName?: string;
    targetName?: string;
    properties?: string;
  }[];
}

export const getEntityProfile = (entityUid: string) =>
  http.request<ReturnResult<KgEntityProfile>>("get", `/v2/ai/knowledge-graph/entity/profile/${entityUid}`);

export const enrichPerson = (data: { entityUid: string }) =>
  http.request<ReturnResult<{ message: string }>>("post", "/v2/ai/knowledge-graph/entity/enrich-person", { data, timeout: 180000 });

// ── 实体属性 CRUD ──

export interface KgEntityAttribute {
  attrId?: number;
  entityUid: string;
  libraryId?: number;
  attrName: string;
  attrValue: string;
  attrType?: string;
  attrSort?: number;
  status?: number;
}

export const listEntityAttributes = (entityUid: string) =>
  http.request<ReturnResult<KgEntityAttribute[]>>("get", "/v2/ai/knowledge-graph/entity-attribute/list", { params: { entityUid } });

export const createEntityAttribute = (data: KgEntityAttribute) =>
  http.request<ReturnResult<boolean>>("post", "/v2/ai/knowledge-graph/entity-attribute/create", { data });

export const updateEntityAttribute = (data: KgEntityAttribute) =>
  http.request<ReturnResult<boolean>>("put", "/v2/ai/knowledge-graph/entity-attribute/update", { data });

export const deleteEntityAttribute = (id: number) =>
  http.request<ReturnResult<boolean>>("delete", `/v2/ai/knowledge-graph/entity-attribute/delete/${id}`);

export const batchSaveEntityAttributes = (data: { entityUid: string; libraryId?: number; attributes: KgEntityAttribute[] }) =>
  http.request<ReturnResult<{ savedCount: number }>>("post", "/v2/ai/knowledge-graph/entity-attribute/batch-save", { data });

// ── 向量浏览 ──

export const listVectors = (page = 1, pageSize = 20) =>
  http.request<ReturnResult<{ records: any[]; total: number; page: number; pageSize: number }>>("get", "/v2/ai/rag/vector/list", { params: { page, pageSize } });

export const searchVectors = (query: string, topK = 10) =>
  http.request<ReturnResult<any[]>>("get", "/v2/ai/rag/vector/search", { params: { query, topK } });
