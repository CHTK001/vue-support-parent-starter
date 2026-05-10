import { http, type ReturnResult } from "@repo/utils";

// ── Types ──────────────────────────────────────────────────────────

export interface KnowledgeLibraryItem {
  sysAiKnowledgeLibraryId: number;
  sysAiKnowledgeLibraryName: string;
  sysAiKnowledgeLibraryDescription: string;
  sysAiKnowledgeLibraryLlmProvider: string;
  sysAiKnowledgeLibraryLlmModel: string;
  sysAiKnowledgeLibraryTemperature: number | null;
  sysAiKnowledgeLibraryMaxTokens: number | null;
  sysAiKnowledgeLibraryPromptTemplate: string;
  sysAiKnowledgeLibraryRelationExtractionEnabled: number;
  sysAiKnowledgeLibraryMaxEntitiesPerDoc: number;
  sysAiKnowledgeLibrarySort: number;
  sysAiKnowledgeLibraryStatus: number;
  createTime: string;
}

// ── APIs ───────────────────────────────────────────────────────────

/** 获取知识库列表（分页） */
export const listLibraries = (params: {
  keyword?: string;
  page?: number;
  size?: number;
}) =>
  http.request<ReturnResult<{
    records: KnowledgeLibraryItem[];
    total: number;
  }>>("get", "/v2/ai/knowledge-library/list", { params });

/** 获取所有启用的知识库（下拉选择用） */
export const listAllLibraries = () =>
  http.request<ReturnResult<KnowledgeLibraryItem[]>>("get", "/v2/ai/knowledge-library/list-all");

/** 获取知识库详情 */
export const getLibrary = (id: number) =>
  http.request<ReturnResult<KnowledgeLibraryItem>>("get", `/v2/ai/knowledge-library/detail/${id}`);

/** 创建知识库 */
export const createLibrary = (data: Partial<KnowledgeLibraryItem>) =>
  http.request<ReturnResult<null>>("post", "/v2/ai/knowledge-library/create", { data });

/** 更新知识库 */
export const updateLibrary = (data: Partial<KnowledgeLibraryItem>) =>
  http.request<ReturnResult<null>>("put", "/v2/ai/knowledge-library/update", { data });

/** 删除知识库 */
export const deleteLibrary = (id: number) =>
  http.request<ReturnResult<null>>("delete", `/v2/ai/knowledge-library/delete/${id}`);
