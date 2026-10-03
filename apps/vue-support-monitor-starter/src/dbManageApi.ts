import { http, unwrapResult } from "@repo/utils";

/**
 * 数据库 web 管理器 - 表级编辑增强 API
 *
 * 与 monitorApi 中既有的浏览/查询类端点互补，这里只封装新增的写操作端点：
 * 单元格编辑 / 索引管理 / 清空表 / 表结构（列）编辑。
 *
 * @author CH
 * @since 4.0.0
 */
const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/** 表索引列信息（来自 DatabaseMetaData.getIndexInfo） */
export interface DbIndexInfo {
  indexName: string;
  columnName: string;
  /** true 表示非唯一索引（与 JDBC NON_UNIQUE 语义一致） */
  nonUnique: boolean;
  /** 索引类型（DatabaseMetaData index type 整数） */
  indexType: number;
  /** 列在索引中的序号，从 1 开始 */
  seqInIndex: number;
}

/** 单元格更新请求体 */
export type DbCellUpdatePayload = {
  tableName: string;
  column: string;
  newValue: unknown;
  /** 主键等值条件，用于 WHERE 定位单行 */
  primaryKey: Record<string, unknown>;
  database?: string;
  datasourceId?: number;
};

/**
 * 更新单个单元格
 * @param payload 更新请求
 * @returns 影响行数
 */
export const updateDbCell = (payload: DbCellUpdatePayload) =>
  http()
    .put(`/ms/monitor/db/table/${encodeURIComponent(payload.tableName)}/cell`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<number>(r));

/**
 * 获取表索引列表
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const fetchDbIndexes = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/indexes`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbIndexInfo[]>(r));

/** 新建索引请求体 */
export type DbIndexCreatePayload = {
  indexName: string;
  columns: string[];
  unique?: boolean;
  database?: string;
  datasourceId?: number;
};

/**
 * 新建索引
 * @param tableName 表名
 * @param payload 索引定义
 */
export const createDbIndex = (tableName: string, payload: DbIndexCreatePayload) =>
  http()
    .post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/index`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/**
 * 删除索引
 * @param tableName 表名
 * @param indexName 索引名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const dropDbIndex = (tableName: string, indexName: string, datasourceId?: number, database?: string) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/index/${encodeURIComponent(indexName)}`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));

/**
 * 清空表（TRUNCATE，不支持时后端退化为 DELETE）
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const truncateDbTable = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/truncate`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));

/** 列定义（新增/修改共用） */
export type DbColumnPayload = {
  columnName: string;
  type: string;
  size?: number;
  nullable?: boolean;
  defaultValue?: string;
  comment?: string;
  database?: string;
  datasourceId?: number;
};

/**
 * 新增列
 * @param tableName 表名
 * @param payload 列定义
 */
export const addDbColumn = (tableName: string, payload: DbColumnPayload) =>
  http()
    .post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/column`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/**
 * 修改列（MODIFY COLUMN）
 * @param tableName 表名
 * @param columnName 列名
 * @param payload 列定义
 */
export const modifyDbColumn = (tableName: string, columnName: string, payload: DbColumnPayload) =>
  http()
    .put(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/column/${encodeURIComponent(columnName)}`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/**
 * 删除列
 * @param tableName 表名
 * @param columnName 列名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const dropDbColumn = (tableName: string, columnName: string, datasourceId?: number, database?: string) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/column/${encodeURIComponent(columnName)}`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));

/* ==================== 导入 / 导出（Navicat 向导） ==================== */

/** 导入预览结果（解析文件但不写库） */
export interface DbImportPreview {
  /** 解析出的列名（文件里的表头顺序） */
  columns: string[];
  /** 预览行 */
  rows: Record<string, unknown>[];
  /** 文件内数据总行数（不含表头） */
  rowCount: number;
  /** 预览行数上限 */
  previewSize: number;
  /** 实际使用的分隔符 */
  delimiter: string;
  /** 实际使用的字符集 */
  encoding: string;
}

/**
 * 导入预览：解析文件回显列名与前若干行，**不写库**。
 *
 * 用于向导第一步确认「分隔符 / 编码 / 表头识别是否正确」，避免用户配好映射后才发现解析错了。
 *
 * @param file      上传的文件
 * @param format    格式：auto / csv / tsv / json
 * @param hasHeader 首行是否为表头
 * @param encoding  字符集名，为空按 UTF-8
 * @returns 预览结果
 */
export const previewDbImport = (file: File, format: string, hasHeader: boolean, encoding?: string) => {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("format", format);
  form.append("hasHeader", String(hasHeader));
  if (encoding) {
    form.append("encoding", encoding);
  }
  return http()
    .post("/ms/monitor/db/import/preview")
    .noToast(true)
    .data(form)
    .then(r => unwrap<DbImportPreview>(r));
};

/** 导入选项（随 multipart 一起提交的 JSON） */
export type DbImportOptions = {
  fileName?: string;
  format?: string;
  hasHeader?: boolean;
  encoding?: string;
  database?: string;
  tableName: string;
  /** 源列名 → 目标列名；未列出的源列忽略 */
  columnMapping?: Record<string, string>;
  /** 导入前是否清空目标表（破坏性） */
  truncateFirst?: boolean;
  /** 冲突策略：skip / replace */
  onConflict?: "skip" | "replace";
  batchSize?: number;
  datasourceId?: number;
};

/** 导入统计 */
export interface DbImportResult {
  totalRows: number;
  inserted: number;
  replaced: number;
  skipped: number;
  /** 逐行错误明细（最多 50 条） */
  errors: string[];
}

/**
 * 执行导入：按字段映射把文件写入目标表。
 *
 * @param file    上传的文件
 * @param options 导入选项
 * @returns 导入统计
 */
export const importDbFile = (file: File, options: DbImportOptions) => {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("option", JSON.stringify(options));
  return http()
    .post("/ms/monitor/db/import")
    .noToast(true)
    .data(form)
    .then(r => unwrap<DbImportResult>(r));
};

/** 导出请求 */
export type DbExportRequest = {
  tableName: string;
  format: "csv" | "tsv" | "json" | "xml" | "sql";
  /** 范围：structure 仅结构 / data 仅数据 / all 结构+数据 */
  scope: "structure" | "data" | "all";
  database?: string;
  datasourceId?: number;
  /** 数据行上限，<=0 用后端默认（20 万） */
  limit?: number;
  where?: string;
  orderBy?: string;
  orderDir?: "ASC" | "DESC";
};

/** 导出结果（内容由前端侧落盘为文件） */
export interface DbExportResult {
  content: string;
  rowCount: number;
  truncated: boolean;
  format: string;
  /** 后端建议的文件名 */
  fileName: string;
}

/**
 * 导出表数据 / 结构。
 *
 * @param request 导出请求
 * @returns 导出内容
 */
export const exportDbTable = (request: DbExportRequest) =>
  http()
    .post("/ms/monitor/db/export")
    .noToast(true)
    .data(request)
    .then(r => unwrap<DbExportResult>(r));

/** 导出格式与范围的可选值 */
export interface DbExportOptions {
  formats: { value: string; label: string }[];
  scopes: { value: string; label: string }[];
}

/**
 * 取导出格式与范围枚举。
 *
 * 由后端下发，避免前后端各写一份枚举后漂移。
 */
export const fetchDbExportOptions = () =>
  http()
    .get("/ms/monitor/db/export/options")
    .noToast(true)
    .then(r => unwrap<DbExportOptions>(r));
