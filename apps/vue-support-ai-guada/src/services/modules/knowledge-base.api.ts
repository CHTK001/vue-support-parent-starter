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
    chunkMaxSize?: number;
    chunkOverlapSize?: number;
    chunkMinSize?: number;
    isPublic?: boolean;
    /** 采集网址；填写后知识库按 web 型创建并立即抓取 */
    sourceUrl?: string;
    /** 采集模式，默认 snapshot */
    sourceMode?: string;
    /** 同域最多采集几页（含入口页），默认 1 */
    sourceMaxPages?: number;
  }): Promise<KnowledgeBase>;
  updateKnowledgeBase(kbId: string, data: Partial<KnowledgeBase>): Promise<KnowledgeBase>;
  refreshKnowledgeBaseSource(kbId: string): Promise<{ fetched?: number; failed?: number; errors?: string[] }>;
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
  /** 关系图谱：GET /v2/rag/graph，返回 { nodes, edges, entityCount, relationCount, placeholder } */
  fetchKnowledgeGraph(kbId: string, docPath?: string): Promise<{
    nodes: any[];
    edges: any[];
    entityCount: number;
    relationCount: number;
    /** true = 该范围尚未抽取过关系（占位图），可触发一次生成 */
    placeholder: boolean;
  }>;
  /** 按需生成图谱：POST /api/knowledge/bases/{id}/graph/generate，不传 docPath 则遍历全库 */
  generateKnowledgeBaseGraph(
    kbId: string,
    docPath?: string,
  ): Promise<{ files: number; entityCount: number; relationCount: number; elapsedMs: number }>;
  /** 关系图谱计数：GET /v2/rag/graph/count */
  fetchKnowledgeGraphCount(kbId: string): Promise<{ entityCount: number; relationCount: number }>;
  /** 关系抽取开关是否启用：GET /v2/rag/graph/enabled */
  fetchRelationExtractEnabled(): Promise<boolean>;
  /** 列表页统计（汇总 + 每库计数） */
  fetchKBOverview(): Promise<{
    totals?: { kb_count?: number; file_count?: number; entity_count?: number; relation_count?: number };
    per_base?: Record<string, { file_count?: number; entity_count?: number; relation_count?: number }>;
  }>;
  /** 读取知识点原文 */
  readKBFileContent(kbId: string, relPath: string): Promise<{ rel_path?: string; content?: string; size?: number; modified_at?: number }>;
  /** 库内问答，返回答案与引用 */
  askKnowledgeBase(kbId: string, query: string, topK?: number): Promise<{
    answer?: string;
    citations?: Array<{ index?: number; doc_path?: string; file_name?: string; score?: number; snippet?: string }>;
    elapsed_ms?: number;
  }>;
  // ── 图谱手工维护（后端 /v2/rag/graph 下的写入端点）──
  createGraphEntity(kbId: string, kbName: string, name: string, type: string, description?: string): Promise<{ uid?: string }>;
  updateGraphEntity(kbId: string, uid: string, patch: { name?: string; type?: string; description?: string }): Promise<unknown>;
  deleteGraphEntity(kbId: string, uid: string): Promise<unknown>;
  batchDeleteGraphEntities(kbId: string, uids: string[]): Promise<{ deleted?: number; requested?: number }>;
  createGraphRelation(kbId: string, kbName: string, source: string, target: string, type: string): Promise<{ uid?: string }>;
  deleteGraphRelation(kbId: string, uid: string): Promise<unknown>;
  batchDeleteGraphRelations(kbId: string, uids: string[]): Promise<{ deleted?: number; requested?: number }>;
}

/** /api/knowledge 客户端：不解包，信封与命名差异全部在本文件内翻译 */
const apiHttp = createClient(rootHttp, { unwrap: false });

/** 后端知识库控制器根路径 */
const KB = "/api/knowledge";

/**
 * 判定统一响应信封是否成功。
 *
 * <p>后端两套信封并存，code 的成功值不止一种：</p>
 * <ul>
 *   <li>{@code /api/knowledge/*} → {@code {success, data}}，无 code</li>
 *   <li>{@code /v2/rag/*} → {@code {code:"00000", data:{success, data}}}，双层</li>
 * </ul>
 * <p>把 "00000" 当成错误码会让所有图谱接口直接抛错，因此必须显式枚举成功值。</p>
 */
function isOkEnvelope(env: any): boolean {
  if (env.success === false) {
    return false;
  }
  if (env.error) {
    return false;
  }
  const code = env.code;
  if (code === undefined || code === null || code === "") {
    return true;
  }
  const s = String(code).trim();
  return s === "0" || s === "00000" || s === "200";
}

/**
 * 解包 ApiResult 信封：业务失败抛 Error，成功返回最内层 data。
 *
 * <p>必须循环剥壳而不是只剥一层：图谱接口是双层信封，只剥一层会让调用方拿到
 * {@code {success, data}} 而不是真正的节点列表，表现为「接口 200 但页面显示 0 条」。</p>
 */
function unwrapData<T = any>(env: any, route: string): T {
  let cur: any = env;
  for (let i = 0; i < 5 && cur && typeof cur === "object"; i++) {
    if (!("data" in cur)) {
      break;
    }
    // 只有带信封特征字段的对象才继续剥，避免把业务数据里恰好叫 data 的字段误剥
    if (!("code" in cur || "success" in cur || "msg" in cur || "error" in cur)) {
      break;
    }
    if (!isOkEnvelope(cur)) {
      throw new Error(`[knowledge-base] ${route} 调用失败：${cur.error || cur.msg || cur.code || "未知错误"}`);
    }
    cur = cur.data;
  }
  if (cur && typeof cur === "object" && (cur.success === false || cur.error)) {
    throw new Error(`[knowledge-base] ${route} 调用失败：${cur.error || cur.msg || "未知错误"}`);
  }
  return cur as T;
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

/** 后端 source 配置 → 前端扁平的三个字段（URL / 模式 / 采集页数） */
function readSource(raw: any): { sourceUrl: string; sourceMode: string; sourceMaxPages: number } {
  const src = raw?.source;
  const entries = Array.isArray(src?.entries) ? src.entries : [];
  const first = entries[0] ?? {};
  return {
    sourceUrl: String(first?.url ?? ""),
    sourceMode: String(src?.mode ?? ""),
    sourceMaxPages: toNumber(first?.max_pages) || 1,
  };
}

/** 前端扁平的三个字段 → 后端 source 配置（未填网址时返回空，表示不启用采集） */
function buildSource(data: Record<string, any>): Record<string, any> | undefined {
  const url = String((data as any).sourceUrl ?? "").trim();
  if (!url) {
    return undefined;
  }
  const maxPages = toNumber((data as any).sourceMaxPages) || 1;
  return {
    mode: String((data as any).sourceMode ?? "snapshot") || "snapshot",
    entries: [{ url, title: "", max_pages: maxPages < 1 ? 1 : maxPages }],
  };
}

/** snake_case 知识库元数据 → 前端 KnowledgeBase */
function toKnowledgeBase(raw: any): KnowledgeBase {
  return {
    id: String(raw?.knowledge_base_id ?? raw?.id ?? ""),
    name: String(raw?.name ?? ""),
    description: raw?.description == null ? null : String(raw.description),
    userId: String(raw?.user_id ?? ""),
    // 分片参数以前硬编码成 0，导致编辑弹窗永远回填 0，用户改的值存不进去。
    // 后端补齐了这三个字段，这里如实读取；老数据缺失时回落到与后端一致的默认值。
    chunkMaxSize: toNumber(raw?.chunk_max_size, 1000) || 1000,
    chunkOverlapSize: toNumber(raw?.chunk_overlap_size, 100) || 100,
    chunkMinSize: toNumber(raw?.chunk_min_size, 50) || 50,
    isActive: true,
    isPublic: Boolean(raw?.is_public),
    ...readSource(raw),
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
    // 后端 tree 接口按「向量库里是否已有该文件的分片」返回 completed / uploaded。
    // 之前这里硬编码 'uploaded'，与树组件「只在 completed||failed 才 emit('view')」的
    // 判断互斥，导致任何文件都点不开预览；也不要退回硬编码，缺字段时按未索引算。
    processingStatus: isDir ? "completed" : (raw?.processing_status || "uploaded"),
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
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description ?? "",
      is_public: data.isPublic === true,
    };
    // 填了网址才带 source：后端据此把知识库判定为 web 型（托管目录 + 立即抓取）
    const source = buildSource(data);
    if (source) {
      payload.source = source;
    }
    // 分片参数：后端此前从不读取，这里补上 snake_case 键名与后端对齐
    if (data.chunkMaxSize !== undefined) {
      payload.chunk_max_size = data.chunkMaxSize;
    }
    if (data.chunkOverlapSize !== undefined) {
      payload.chunk_overlap_size = data.chunkOverlapSize;
    }
    if (data.chunkMinSize !== undefined) {
      payload.chunk_min_size = data.chunkMinSize;
    }
    const env = await apiHttp.post(`${KB}/bases`, payload);
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
    // 分片参数：同样要透传，否则编辑弹窗改了没用
    if (data.chunkMaxSize !== undefined) body.chunk_max_size = data.chunkMaxSize;
    if (data.chunkOverlapSize !== undefined) body.chunk_overlap_size = data.chunkOverlapSize;
    if (data.chunkMinSize !== undefined) body.chunk_min_size = data.chunkMinSize;
    // 网址改动必须透传，否则编辑弹窗里填的地址永远保存不进去
    const hasSourceField = (data as Record<string, any>).sourceUrl !== undefined;
    if (hasSourceField) {
      const source = buildSource(data);
      if (source) {
        body.source = source;
      } else {
        // 清空网址：传空 entries 让后端把来源配置置空
        body.source = { mode: "snapshot", entries: [] };
      }
    }
    const env = await apiHttp.put(`${KB}/bases/${encodeURIComponent(kbId)}`, body);
    return toKnowledgeBase(unwrapData(env, route));
  },

  /** POST /api/knowledge/bases/{knowledge_base_id}/refresh-source：重新抓取已配置的网址 */
  async refreshKnowledgeBaseSource(kbId) {
    const route = `POST ${KB}/bases/{id}/refresh-source`;
    const env = await apiHttp.post(`${KB}/bases/${encodeURIComponent(kbId)}/refresh-source`, {});
    return unwrapData<any>(env, route) ?? {};
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

  /**
   * 知识点分片详情：GET /api/knowledge/bases/{id}/chunks?path=
   *
   * 后端此前没有这个接口（getKBFileChunks 注释写着「后端暂未提供」），
   * 界面上只能看到分片数量、看不到内容。
   */
  async getKBFileChunks(kbId, relPath, skip = 0, limit = 200) {
    const route = `GET ${KB}/bases/{id}/chunks`;
    const env = await apiHttp.get(`${KB}/bases/${encodeURIComponent(kbId)}/chunks`, {
      params: { path: normalizeRelPath(relPath), skip, limit },
    });
    const rows = unwrapData<any[]>(env, route) ?? [];
    return Array.isArray(rows) ? rows : [];
  },

  // ── 图谱手工维护：实体 / 关系的增改删 ──

  /** GET /api/knowledge/bases/{id}/file?path= ：读取知识点原文（仅文本类） */
  async readKBFileContent(kbId: string, relPath: string) {
    const route = `GET /api/knowledge/bases/${kbId}/file`;
    const env = await apiHttp.get(`/api/knowledge/bases/${kbId}/file`, { params: { path: relPath } });
    return unwrapData<{ rel_path?: string; content?: string; size?: number; modified_at?: number }>(env, route);
  },

  /** GET /api/knowledge/bases/overview：列表页统计（汇总 + 每库计数） */
  async fetchKBOverview() {
    const route = 'GET /api/knowledge/bases/overview';
    const env = await apiHttp.get('/api/knowledge/bases/overview');
    return unwrapData<{
      totals?: { kb_count?: number; file_count?: number; entity_count?: number; relation_count?: number };
      per_base?: Record<string, { file_count?: number; entity_count?: number; relation_count?: number }>;
    }>(env, route);
  },

  /** POST /api/knowledge/bases/{id}/ask：库内问答（RAG 检索 + 作答 + 引用溯源） */
  async askKnowledgeBase(kbId: string, query: string, topK = 6) {
    const route = `POST /api/knowledge/bases/${kbId}/ask`;
    const env = await apiHttp.post(`/api/knowledge/bases/${kbId}/ask`, { query, top_k: topK });
    return unwrapData<{
      answer?: string;
      citations?: Array<{
        index?: number;
        doc_path?: string;
        file_name?: string;
        score?: number;
        snippet?: string;
      }>;
      elapsed_ms?: number;
    }>(env, route);
  },

  /** POST /v2/rag/graph/entity：手工新增实体（同名同类型会复用，不会产生重复节点） */
  async createGraphEntity(kbId: string, kbName: string, name: string, type: string, description = "") {
    const route = "POST /v2/rag/graph/entity";
    const env = await apiHttp.post("/v2/rag/graph/entity", {}, {
      params: { knowledge_base_id: kbId, knowledge_base_name: kbName, name, type, description },
    });
    return unwrapData<any>(env, route) ?? {};
  },

  /** POST /v2/rag/graph/entity/update：改实体（只传要改的字段） */
  async updateGraphEntity(kbId: string, uid: string, patch: { name?: string; type?: string; description?: string }) {
    const route = "POST /v2/rag/graph/entity/update";
    const env = await apiHttp.post("/v2/rag/graph/entity/update", {}, {
      params: { knowledge_base_id: kbId, uid, ...patch },
    });
    return unwrapData<any>(env, route) ?? {};
  },

  /** POST /v2/rag/graph/entity/delete：删单个实体（级联删关联与相关边） */
  async deleteGraphEntity(kbId: string, uid: string) {
    const route = "POST /v2/rag/graph/entity/delete";
    const env = await apiHttp.post("/v2/rag/graph/entity/delete", {}, {
      params: { knowledge_base_id: kbId, uid },
    });
    return unwrapData<any>(env, route) ?? {};
  },

  /** POST /v2/rag/graph/entity/batch-delete：批量删实体 */
  async batchDeleteGraphEntities(kbId: string, uids: string[]) {
    const route = "POST /v2/rag/graph/entity/batch-delete";
    const env = await apiHttp.post("/v2/rag/graph/entity/batch-delete", {}, {
      params: { knowledge_base_id: kbId, uids: uids.join(",") },
    });
    return unwrapData<any>(env, route) ?? {};
  },

  /** POST /v2/rag/graph/relation：手工新增关系（端点不存在自动建占位实体） */
  async createGraphRelation(kbId: string, kbName: string, source: string, target: string, type: string) {
    const route = "POST /v2/rag/graph/relation";
    const env = await apiHttp.post("/v2/rag/graph/relation", {}, {
      params: { knowledge_base_id: kbId, knowledge_base_name: kbName, source, target, type },
    });
    return unwrapData<any>(env, route) ?? {};
  },

  /** POST /v2/rag/graph/relation/delete：删单条关系 */
  async deleteGraphRelation(kbId: string, uid: string) {
    const route = "POST /v2/rag/graph/relation/delete";
    const env = await apiHttp.post("/v2/rag/graph/relation/delete", {}, {
      params: { knowledge_base_id: kbId, uid },
    });
    return unwrapData<any>(env, route) ?? {};
  },

  /** POST /v2/rag/graph/relation/batch-delete：批量删关系 */
  async batchDeleteGraphRelations(kbId: string, uids: string[]) {
    const route = "POST /v2/rag/graph/relation/batch-delete";
    const env = await apiHttp.post("/v2/rag/graph/relation/batch-delete", {}, {
      params: { knowledge_base_id: kbId, uids: uids.join(",") },
    });
    return unwrapData<any>(env, route) ?? {};
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

  /**
   * 关系图谱：GET /v2/rag/graph?knowledge_base_id=&doc_path=
   * 返回 { nodes, edges, entityCount, relationCount }，结构对齐前端 ReGraphData。
   */
  async fetchKnowledgeGraph(kbId: string, docPath?: string) {
    const route = "GET /v2/rag/graph";
    const env = await apiHttp.get("/v2/rag/graph", {
      params: {
        knowledge_base_id: kbId,
        ...(docPath ? { doc_path: normalizeRelPath(docPath) } : {}),
      },
    });
    const data = unwrapData<any>(env, route) ?? { nodes: [], edges: [] };
    return {
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      edges: Array.isArray(data.edges) ? data.edges : [],
      entityCount: toNumber(data.entityCount),
      relationCount: toNumber(data.relationCount),
      // 后端未返回 placeholder 时按「空图即占位」兜底，老后端也能正确显示「生成」按钮
      placeholder: data.placeholder === undefined
        ? !Array.isArray(data.nodes) || data.nodes.length === 0
        : Boolean(data.placeholder),
    };
  },

  /**
   * 按需生成关系图谱：POST /api/knowledge/bases/{id}/graph/generate[?doc_path=]
   *
   * 用于「知识点是网页采集来的、当初没开关系提取」或「原文改了要重抽」两种场景。
   * 不传 docPath 时后端遍历该知识库下全部文本文件。
   */
  async generateKnowledgeBaseGraph(kbId: string, docPath?: string) {
    const route = `POST ${KB}/bases/{id}/graph/generate`;
    const env = await apiHttp.post(
      `${KB}/bases/${encodeURIComponent(kbId)}/graph/generate`,
      {},
      { params: docPath ? { doc_path: normalizeRelPath(docPath) } : {} },
    );
    const data = unwrapData<any>(env, route) ?? {};
    return {
      files: toNumber(data.files),
      entityCount: toNumber(data.entity_count),
      relationCount: toNumber(data.relation_count),
      elapsedMs: toNumber(data.elapsed_ms),
    };
  },

  /** 关系图谱统计：GET /v2/rag/graph/count?knowledge_base_id= */
  async fetchKnowledgeGraphCount(kbId: string) {
    const route = "GET /v2/rag/graph/count";
    const env = await apiHttp.get("/v2/rag/graph/count", {
      params: { knowledge_base_id: kbId },
    });
    const data = unwrapData<any>(env, route) ?? {};
    return {
      entityCount: toNumber(data.entity_count),
      relationCount: toNumber(data.relation_count),
    };
  },

  /** 关系提取开关状态：GET /v2/rag/graph/enabled */
  async fetchRelationExtractEnabled() {
    const route = "GET /v2/rag/graph/enabled";
    const env = await apiHttp.get("/v2/rag/graph/enabled");
    const data = unwrapData<any>(env, route) ?? {};
    return Boolean(data.enabled);
  },
};
