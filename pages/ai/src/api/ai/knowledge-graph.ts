import { http, type ReturnResult } from "@repo/utils";

export interface KgEntityItem {
  sysAiKnowledgeGraphEntityId: number;
  sysAiKnowledgeGraphEntityUid: string;
  sysAiKnowledgeGraphEntityName: string;
  sysAiKnowledgeGraphEntityType: string;
  sysAiKnowledgeGraphEntityProperties?: string;
  sysAiKnowledgeGraphEntitySource: string;
  sysAiKnowledgeGraphEntityStatus: number;
  sysAiKnowledgeGraphLibraryId?: number;
  createTime?: string;
}

export interface KgRelationItem {
  sysAiKnowledgeGraphRelationId: number;
  sysAiKnowledgeGraphRelationUid: string;
  sysAiKnowledgeGraphRelationSourceEntityUid: string;
  sysAiKnowledgeGraphRelationTargetEntityUid: string;
  sysAiKnowledgeGraphRelationType: string;
  sysAiKnowledgeGraphRelationProperties?: string;
  sysAiKnowledgeGraphRelationWeight: number;
  sysAiKnowledgeGraphRelationSource: string;
  sysAiKnowledgeGraphRelationStatus: number;
  sysAiKnowledgeGraphRelationLibraryId?: number;
  createTime?: string;
}

export interface KgGraphData {
  nodes: { id: string; label: string; group: string }[];
  edges: { from: string; to: string; label: string; weight: number }[];
}

export interface KgStatistics {
  entityCount: number;
  relationCount: number;
  entityTypeDistribution: { type: string; count: number }[];
  relationTypeDistribution?: { type: string; count: number }[];
}

// ── 实体 CRUD ──────────────────────────────────────────────────

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

// ── 关系 CRUD ──────────────────────────────────────────────────

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

// ── 图谱操作 ─────────────────────────────────────────────────────

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

// ── LLM 抽取 ─────────────────────────────────────────────────────

export const extractEntities = (data: { text: string; libraryId?: number }) =>
  http.request<ReturnResult<KgEntityItem[]>>("post", "/v2/ai/knowledge-graph/extract/entities", { data });

export const extractRelations = (data: { text: string; entityIds?: number[]; libraryId?: number }) =>
  http.request<ReturnResult<KgRelationItem[]>>("post", "/v2/ai/knowledge-graph/extract/relations", { data });

export const queryGraph = (data: { question: string; libraryId?: number }) =>
  http.request<ReturnResult<{ answer: string }>>("post", "/v2/ai/knowledge-graph/query", { data });

// ── 文件抽取 ─────────────────────────────────────────────────────

/** 上传文件并提取纯文本内容（不调用LLM） */
export const extractTextFromFile = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ReturnResult<{ text: string; filename: string }>>("post", "/v2/ai/knowledge-graph/extract/text-from-file", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/** 上传文件并抽取实体 */
export const extractEntitiesFromFile = (file: File, libraryId?: number) => {
  const formData = new FormData();
  formData.append("file", file);
  if (libraryId) formData.append("libraryId", String(libraryId));
  return http.request<ReturnResult<KgEntityItem[]>>("post", "/v2/ai/knowledge-graph/extract/from-file", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/** 上传文件并抽取关系 */
export const extractRelationsFromFile = (file: File, entityIds?: string, libraryId?: number) => {
  const formData = new FormData();
  formData.append("file", file);
  if (entityIds) formData.append("entityIds", entityIds);
  if (libraryId) formData.append("libraryId", String(libraryId));
  return http.request<ReturnResult<KgRelationItem[]>>("post", "/v2/ai/knowledge-graph/extract/relations-from-file", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ── 管理 ─────────────────────────────────────────────────────────

export const clearGraph = (params?: { libraryId?: number }) =>
  http.request<ReturnResult<boolean>>("delete", "/v2/ai/knowledge-graph/clear", { params });
