/**
 * 知识库 API（前端 ↔ 后端 ApiKnowledgeController）
 *
 * 后端真实命名空间是 `/api/knowledge`（不是 /v2/knowledge-bases），所有响应均为
 * ApiResult 信封。请求出口统一使用 @/framework/context 的请求模块：
 * `createClient(rootHttp, { unwrap: false })`，即本文件收到的是原始信封
 * `{success,data,code,error,msg}`；信封在 unwrapData 中集中解包（success=false 或
 * 带 code/error 一律抛 Error），对外只返回已解包并翻译过的业务对象——页面与 store
 * 不感知信封，也不需要任何改动。
 *
 * 键名/标识翻译约定：
 * - KnowledgeBase.id ← knowledge_base_id；createdAt / updatedAt ← created_at / updated_at（epoch ms → ISO）。
 * - 后端无 embedding / 分块字段，create/update 持久化 name、description、tags 及公开性 is_public
 *   （公开库对所有登录用户只读可见，写操作仍仅 owner/管理员）；
 *   后端独有的 root_path / managed / kind / tags / file_count / total_size / root_exists 收敛进 metadataConfig。
 * - 后端以「相对路径 rel_path」定位文件与目录，没有文件 ID：故 KBFile.id、parentFolderId、
 *   以及入参 fileId / parentFolderId 一律按 rel_path 处理（根目录为 null / ""）。
 * - 后端文件列表无 skip / limit 分页，分页参数在本地对全量结果切片。
 *
 * @author CH
 */
import { createClient, rootHttp } from "@/framework/context";
import type { PaginatedResponse } from "@/types/common";
import type { KnowledgeBase, KBFile } from "@/stores/knowledgeBase";

export interface KnowledgeBaseApi {
  fetchKnowledgeBases(): Promise<PaginatedResponse<KnowledgeBase>>;
  createKnowledgeBase(data: {
    name: string;
    description?: string;
    embeddingModelId: string;
    chunkMaxSize?: number;
    chunkOverlapSize?: number;
    chunkMinSize?: number;
    isPublic?: boolean;
  }): Promise<KnowledgeBase>;
  updateKnowledgeBase(kbId: string, data: Partial<KnowledgeBase>): Promise<KnowledgeBase>;
  deleteKnowledgeBase(kbId: string): Promise<{ success: boolean }>;
  getKnowledgeBase(kbId: string): Promise<KnowledgeBase>;
  fetchKBFiles(kbId: string, skip?: number, limit?: number): Promise<PaginatedResponse<KBFile>>;
  fetchKBFilesByParent(kbId: string, parentFolderId: string | null, skip?: number, limit?: number): Promise<PaginatedResponse<KBFile>>;
  fetchKBFilesByPath(kbId: string, relativePath: string | null, skip?: number, limit?: number): Promise<PaginatedResponse<KBFile>>;
  uploadKBFile(kbId: string, file: File, targetPath?: string | null): Promise<KBFile>;
  getKBFile(kbId: string, fileId: string): Promise<KBFile>;
  deleteKBFile(kbId: string, fileId: string): Promise<{ success: boolean }>;
  renameKBFile(kbId: string, fileId: string, newName: string): Promise<{ success: boolean; message: string; data: any }>;
  moveKBFile(kbId: string, fileId: string, targetParentFolderId: string | null): Promise<{ success: boolean; message: string; data: any }>;
  createKBFolder(kbId: string, folderName: string, parentFolderId?: string | null): Promise<any>;
  getFileProcessingStatus(kbId: string, fileId: string): Promise<KBFile>;
  batchGetFileProcessingStatus(kbId: string, fileIds: string[]): Promise<KBFile[]>;
  retryKBFile(kbId: string, fileId: string): Promise<{ success: boolean; message: string }>;
  getKBFileChunks(kbId: string, fileId: string, skip?: number, limit?: number): Promise<any[]>;
  searchKnowledgeBase(kbId: string, query: string, topK?: number, filterFileId?: string): Promise<any>;
}

/** /api/knowledge 客户端：不解包，信封与命名差异全部在本文件内翻译 */
const apiHttp = createClient(rootHttp, { unwrap: false });

/** 后端知识库控制器根路径 */
const KB = "/api/knowledge";

/** 解包 ApiResult 信封：业务失败抛 Error，成功返回 data */
function unwrapData<T = any>(env: any, route: string): T {
  if (env && typeof env === "object" && ("success" in env || "code" in env || "error" in env)) {
    if (env.success === false || env.code || env.error) {
      throw new Error(`[knowledge-base] ${route} 调用失败：${env.error || env.msg || env.code || "未知错误"}`);
    }
    return env.data as T;
  }
  return env as T;
}

/** 取失败原因文本（信封或拒绝对象） */
function messageOf(source: any): string {
  const body = source?.response?.data ?? source;
  return (
    source?.message ||
    body?.error ||
    body?.msg ||
    body?.code ||
    String(source ?? "未知错误")
  );
}

/** 后端无对应路由时的显式失败 */
function missingOutlet(method: string, detail: string): never {
  throw new Error(`[knowledge-base] ${method}：后端出口缺失，${detail} 请先在 /api/knowledge 补齐路由，本方法不调用任何不存在地址。`);
}

/** 数值兜底 */
function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** epoch ms → ISO 字符串 */
function toIso(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? new Date(n).toISOString() : String(value);
}

/** 取相对路径的文件名 */
function baseName(relPath: string): string {
  const i = relPath.lastIndexOf("/");
  return i >= 0 ? relPath.slice(i + 1) : relPath;
}

/** 取相对路径的父目录 rel_path（顶层为 null） */
function parentOf(relPath: string): string | null {
  const i = relPath.lastIndexOf("/");
  return i > 0 ? relPath.slice(0, i) : null;
}

/** 取扩展名（不含点） */
function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** 归一化为后端 rel_path 形态（统一分隔符、去首斜杠） */
function normalizeRelPath(relPath: string | null | undefined): string {
  return String(relPath ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
}

/** snake_case 知识库元数据 → 前端 KnowledgeBase */
function toKnowledgeBase(raw: any): KnowledgeBase {
  return {
    id: String(raw?.knowledge_base_id ?? raw?.id ?? ""),
    name: String(raw?.name ?? ""),
    description: raw?.description == null ? null : String(raw.description),
    userId: String(raw?.user_id ?? ""),
    embeddingModelId: "",
    chunkMaxSize: 0,
    chunkOverlapSize: 0,
    chunkMinSize: 0,
    isActive: true,
    isPublic: Boolean(raw?.is_public),
    metadataConfig: {
      rootPath: raw?.root_path ?? null,
      managed: Boolean(raw?.managed),
      kind: raw?.kind ?? "",
      tags: Array.isArray(raw?.tags) ? raw.tags : [],
      fileCount: toNumber(raw?.file_count),
      totalSize: toNumber(raw?.total_size),
      rootExists: Boolean(raw?.root_exists),
    },
    createdAt: toIso(raw?.created_at),
    updatedAt: toIso(raw?.updated_at),
  };
}

/** snake_case tree/file 条目 → 前端 KBFile（id 使用 rel_path） */
function toKBFile(raw: any, kbId: string): KBFile {
  const relPath = normalizeRelPath(raw?.rel_path);
  const isDir = Boolean(raw?.is_dir);
  const name = String(raw?.name ?? baseName(relPath));
  const ext = isDir ? "" : extOf(name);
  return {
    id: relPath,
    knowledgeBaseId: kbId,
    fileName: name,
    displayName: name,
    fileSize: isDir ? 0 : toNumber(raw?.size),
    fileType: ext,
    fileExtension: ext,
    contentHash: "",
    relativePath: relPath,
    parentFolderId: parentOf(relPath),
    isDirectory: isDir,
    processingStatus: isDir ? "completed" : "uploaded",
    progressPercentage: 0,
    currentStep: null,
    errorMessage: null,
    totalChunks: 0,
    totalTokens: 0,
    uploadedAt: toIso(raw?.modified_at),
    processedAt: null,
  };
}

/** 目录树深度展开（children 内联） */
function flattenTree(rows: any[], out: any[] = []): any[] {
  for (const row of rows ?? []) {
    out.push(row);
    if (Array.isArray(row?.children)) flattenTree(row.children, out);
  }
  return out;
}

/** 后端返回全量列表，分页在前端切片 */
function paginate<T>(rows: T[], skip?: number, limit?: number): PaginatedResponse<T> {
  const from = toNumber(skip, 0);
  const size = limit === undefined || limit === null ? rows.length : toNumber(limit, rows.length);
  const items = size > 0 ? rows.slice(from, from + size) : rows.slice(from);
  return {
    items,
    total: rows.length,
    page: size > 0 ? Math.floor(from / size) + 1 : 1,
    pageSize: size,
    hasNext: from + items.length < rows.length,
    hasPrev: from > 0,
  };
}

/** 按目录 rel_path 列出直接子节点 */
async function listChildren(
  kbId: string,
  relPath: string | null,
  skip?: number,
  limit?: number,
): Promise<PaginatedResponse<KBFile>> {
  const route = `GET ${KB}/bases/{id}/tree`;
  const path = normalizeRelPath(relPath);
  const env = await apiHttp.get(
    `${KB}/bases/${encodeURIComponent(kbId)}/tree`,
    path ? { params: { path } } : undefined,
  );
  const rows = unwrapData<any[]>(env, route) ?? [];
  return paginate(rows.map((row) => toKBFile(row, kbId)), skip, limit);
}

export const knowledgeBaseApi: KnowledgeBaseApi = {
  /** GET /api/knowledge/bases */
  async fetchKnowledgeBases() {
    const env = await apiHttp.get(`${KB}/bases`);
    const rows = unwrapData<any[]>(env, `GET ${KB}/bases`) ?? [];
    return paginate(rows.map(toKnowledgeBase));
  },

  /** POST /api/knowledge/bases */
  async createKnowledgeBase(data) {
    const env = await apiHttp.post(`${KB}/bases`, {
      name: data.name,
      description: data.description ?? "",
      is_public: data.isPublic === true,
    });
    return toKnowledgeBase(unwrapData(env, `POST ${KB}/bases`));
  },

  /** PUT /api/knowledge/bases/{knowledge_base_id} */
  async updateKnowledgeBase(kbId, data) {
    const route = `PUT ${KB}/bases/{id}`;
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.description !== undefined) body.description = data.description ?? "";
    const tags = (data as Record<string, any>).tags;
    if (Array.isArray(tags)) body.tags = tags;
    if (data.isPublic !== undefined) body.is_public = data.isPublic === true;
    const env = await apiHttp.put(`${KB}/bases/${encodeURIComponent(kbId)}`, body);
    return toKnowledgeBase(unwrapData(env, route));
  },

  /** DELETE /api/knowledge/bases/{knowledge_base_id}（不带 purge，保留磁盘目录） */
  async deleteKnowledgeBase(kbId) {
    const env = await apiHttp.delete(`${KB}/bases/${encodeURIComponent(kbId)}`);
    unwrapData(env, `DELETE ${KB}/bases/{id}`);
    return { success: true };
  },

  /** GET /api/knowledge/bases/{knowledge_base_id} */
  async getKnowledgeBase(kbId) {
    const env = await apiHttp.get(`${KB}/bases/${encodeURIComponent(kbId)}`);
    return toKnowledgeBase(unwrapData(env, `GET ${KB}/bases/{id}`));
  },

  /** GET /api/knowledge/bases/{knowledge_base_id}/tree（根目录递归展开） */
  async fetchKBFiles(kbId, skip, limit) {
    const route = `GET ${KB}/bases/{id}/tree`;
    const env = await apiHttp.get(`${KB}/bases/${encodeURIComponent(kbId)}/tree`);
    const rows = flattenTree(unwrapData<any[]>(env, route) ?? []);
    return paginate(rows.map((row) => toKBFile(row, kbId)), skip, limit);
  },

  /** GET /api/knowledge/bases/{knowledge_base_id}/tree?path={parentFolderId} */
  async fetchKBFilesByParent(kbId, parentFolderId, skip, limit) {
    return await listChildren(kbId, parentFolderId, skip, limit);
  },

  /** GET /api/knowledge/bases/{knowledge_base_id}/tree?path={relativePath} */
  async fetchKBFilesByPath(kbId, relativePath, skip, limit) {
    return await listChildren(kbId, relativePath, skip, limit);
  },

  /** PUT /api/knowledge/bases/{knowledge_base_id}/file（后端无 multipart 出口，按文本写入；targetPath 为目标目录 rel_path） */
  async uploadKBFile(kbId, file, targetPath) {
    const route = `PUT ${KB}/bases/{id}/file`;
    const dir = normalizeRelPath(targetPath);
    const name = normalizeRelPath(file.name);
    const relPath = dir ? `${dir}/${name}` : name;
    const env = await apiHttp.put(`${KB}/bases/${encodeURIComponent(kbId)}/file`, {
      path: relPath,
      content: await file.text(),
    });
    unwrapData(env, route);
    const node = toKBFile({ rel_path: relPath, size: file.size }, kbId);
    node.fileType = file.type || node.fileType;
    return node;
  },

  /** GET /api/knowledge/bases/{knowledge_base_id}/file?path={fileId} */
  async getKBFile(kbId, fileId) {
    const route = `GET ${KB}/bases/{id}/file`;
    const env = await apiHttp.get(`${KB}/bases/${encodeURIComponent(kbId)}/file`, {
      params: { path: normalizeRelPath(fileId) },
    });
    const raw = unwrapData<any>(env, route);
    const node = toKBFile(
      { rel_path: raw?.rel_path ?? fileId, size: raw?.size, modified_at: raw?.modified_at },
      kbId,
    );
    return Object.assign(node, { content: raw?.content ?? "" });
  },

  /** DELETE /api/knowledge/bases/{knowledge_base_id}/file?path={fileId}，非文件时回退 DELETE /api/knowledge/bases/{knowledge_base_id}/folder?path={fileId} */
  async deleteKBFile(kbId, fileId) {
    const base = `${KB}/bases/${encodeURIComponent(kbId)}`;
    const path = normalizeRelPath(fileId);
    let fileError: any;
    try {
      const env = await apiHttp.delete(`${base}/file`, { params: { path } });
      unwrapData(env, `DELETE ${KB}/bases/{id}/file`);
      return { success: true };
    } catch (error) {
      fileError = error;
    }
    try {
      const env = await apiHttp.delete(`${base}/folder`, { params: { path } });
      unwrapData(env, `DELETE ${KB}/bases/{id}/folder`);
      return { success: true };
    } catch (error) {
      throw new Error(
        `[knowledge-base] 删除 ${path || "根目录"} 失败：${messageOf(fileError)}；按目录回退亦失败：${messageOf(error)}`,
      );
    }
  },

  /** POST /api/knowledge/bases/{knowledge_base_id}/tree/rename */
  async renameKBFile(kbId, fileId, newName) {
    const route = `POST ${KB}/bases/{id}/tree/rename`;
    const env = await apiHttp.post(`${KB}/bases/${encodeURIComponent(kbId)}/tree/rename`, {
      path: normalizeRelPath(fileId),
      new_name: newName,
    });
    const raw = unwrapData<any>(env, route);
    return { success: true, message: "重命名成功", data: toKBFile(raw, kbId) };
  },

  /** 无后端出口：/api/knowledge 未提供移动路由 */
  async moveKBFile(kbId, fileId, targetParentFolderId) {
    return missingOutlet(
      "moveKBFile",
      "后端 /api/knowledge 没有文件/目录移动接口，且 tree/rename 明确拒绝含路径分隔符的 new_name",
    );
  },

  /** POST /api/knowledge/bases/{knowledge_base_id}/folder */
  async createKBFolder(kbId, folderName, parentFolderId = null) {
    const route = `POST ${KB}/bases/{id}/folder`;
    const parent = normalizeRelPath(parentFolderId).replace(/\/+$/, "");
    const relPath = parent ? `${parent}/${folderName}` : folderName;
    const env = await apiHttp.post(`${KB}/bases/${encodeURIComponent(kbId)}/folder`, {
      path: relPath,
    });
    return toKBFile(unwrapData(env, route), kbId);
  },

  /** 无后端出口：/api/knowledge 未提供文件处理状态路由 */
  async getFileProcessingStatus(kbId, fileId) {
    return missingOutlet(
      "getFileProcessingStatus",
      "后端 /api/knowledge 没有单文件处理状态/进度接口",
    );
  },

  /** 无后端出口：/api/knowledge 未提供批量状态路由 */
  async batchGetFileProcessingStatus(kbId, fileIds) {
    return missingOutlet(
      "batchGetFileProcessingStatus",
      "后端 /api/knowledge 没有批量文件处理状态接口",
    );
  },

  /** 无后端出口：/api/knowledge 未提供重新处理路由 */
  async retryKBFile(kbId, fileId) {
    return missingOutlet(
      "retryKBFile",
      "后端 /api/knowledge 没有文件重新解析/重试接口",
    );
  },

  /** 无后端出口：全仓未提供分块（chunk）查询路由 */
  async getKBFileChunks(kbId, fileId, skip, limit) {
    return missingOutlet(
      "getKBFileChunks",
      "后端 /api/knowledge（及 /v2/rag）没有分块列表接口",
    );
  },

  /** POST /api/knowledge/search */
  async searchKnowledgeBase(kbId, query, topK = 5, filterFileId) {
    const route = `POST ${KB}/search`;
    const env = await apiHttp.post(`${KB}/search`, {
      query,
      limit: topK,
      kbIds: [kbId],
    });
    const rows = unwrapData<any[]>(env, route) ?? [];
    const scoped = filterFileId
      ? rows.filter((hit) => normalizeRelPath(hit?.rel_path) === normalizeRelPath(filterFileId))
      : rows;
    const results = scoped.map((hit) => {
      const relPath = normalizeRelPath(hit?.rel_path);
      return {
        id: `${hit?.kb_id ?? kbId}:${relPath}`,
        kbId: hit?.kb_id ?? kbId,
        kbName: hit?.kb_name ?? "",
        fileId: relPath,
        fileName: baseName(relPath),
        heading: hit?.heading ?? "",
        content: hit?.snippet ?? "",
        finalScore: toNumber(hit?.score),
        metadata: { fileId: relPath, kbId: hit?.kb_id ?? kbId, relPath },
      };
    });
    return { results, total: results.length };
  },
};
