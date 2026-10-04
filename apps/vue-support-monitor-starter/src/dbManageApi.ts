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
  /** 索引列，**数组顺序即复合索引的列序**，前端不要排序 */
  columns: string[];
  unique?: boolean;
  /** 索引类型：BTREE / HASH / RTREE，留空由内核决定 */
  indexType?: string;
  /** 各列的前缀长度，与 columns 等长；元素为 0/undefined 表示整列 */
  prefixes?: number[];
  /** 是否建为主键索引（此时走 ADD PRIMARY KEY，索引名被忽略） */
  primary?: boolean;
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
  scale?: number;
  unsigned?: boolean;
  zerofill?: boolean;
  charset?: string;
  collation?: string;
  nullable?: boolean;
  defaultValue?: string;
  /** ON UPDATE 表达式，只支持 CURRENT_TIMESTAMP / NOW()（可带 0~6 位小数秒） */
  onUpdate?: string;
  autoIncrement?: boolean;
  /** ENUM / SET 的取值列表 */
  enumValues?: string[];
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

/* ==================== 表属性 / 主键（Navicat 表属性页） ==================== */

/**
 * 表属性。
 *
 * <p>全部由内核 `information_schema` 读出，**不在前端硬编码**可选取值 ——
 * 不同内核、不同版本的引擎与排序规则集合不同，前端写死会让用户选到内核不认的值。
 */
export interface DbTableOptions {
  /** 存储引擎，如 InnoDB */
  engine?: string;
  /** 字符集（由排序规则前缀推导） */
  charset?: string;
  /** 排序规则，如 utf8mb4_general_ci */
  collation?: string;
  /** 表注释 */
  comment?: string;
  /** 建表时的额外选项 */
  createOptions?: string;
  /** 行格式 */
  rowFormat?: string;
  /** 下一个自增值 */
  autoIncrement?: number | null;
  /** 估算行数 */
  rows?: number;
}

/** 表属性修改请求（未传的字段表示不改；comment 传空串表示清空） */
export type DbTableOptionsPayload = {
  engine?: string;
  charset?: string;
  collation?: string;
  comment?: string;
  autoIncrement?: number;
  database?: string;
  datasourceId?: number;
};

/**
 * 读取表属性。
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const fetchDbTableOptions = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/options`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbTableOptions>(r));

/**
 * 修改表属性。
 * @param tableName 表名
 * @param payload 属性（未传字段不改）
 */
export const updateDbTableOptions = (tableName: string, payload: DbTableOptionsPayload) =>
  http()
    .put(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/options`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/** 排序规则候选项 */
export interface DbCollationItem {
  charset: string;
  collation: string;
}

/** 可选的存储引擎与排序规则（由内核下发） */
export interface DbTableOptionValues {
  engines: string[];
  collations: DbCollationItem[];
}

/**
 * 列出内核支持的存储引擎与排序规则。
 *
 * <p>传 charset 则只返回该字符集下的排序规则（用于「字符集变了就刷新排序规则下拉」）。
 *
 * @param charset 限定字符集（可选）
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const fetchDbTableOptionValues = (
  charset?: string,
  datasourceId?: number,
  database?: string
) =>
  http()
    .get("/ms/monitor/db/table-options/available")
    .noToast(true)
    .query({ charset, datasourceId, database })
    .then(r => unwrap<DbTableOptionValues>(r));

/**
 * 设置主键（可改可加可清空）。
 *
 * <p>传空数组表示清除主键。后端会先 DROP 旧主键再 ADD 新的，
 * 因此列序即复合主键的列序。
 *
 * @param tableName 表名
 * @param columns 主键列（顺序即列序），空数组表示清除
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const setDbTablePrimaryKey = (
  tableName: string,
  columns: string[],
  datasourceId?: number,
  database?: string
) =>
  http()
    .put(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/primary-key`)
    .noToast(true)
    .data({ columns, datasourceId, database })
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

/* ==================== 数据库对象（存储过程 / 函数 / 触发器 / 事件） ==================== */

/** 对象类别 */
export type DbObjectCategory = "procedure" | "function" | "trigger" | "event";

/** 各类别在树上的展示名与图标 */
export const DB_OBJECT_CATEGORIES: { value: DbObjectCategory; label: string; icon: string }[] = [
  { value: "procedure", label: "存储过程", icon: "Document" },
  { value: "function", label: "函数", icon: "SetUp" },
  { value: "trigger", label: "触发器", icon: "Lightning" },
  { value: "event", label: "事件", icon: "AlarmClock" },
];

/** 对象清单条目（字段随类别略有差异，故用可选属性） */
export interface DbObjectInfo {
  name: string;
  category: string;
  /** 函数才有：返回类型 */
  returns?: string | null;
  /** 函数才有：是否 DETERMINISTIC */
  deterministic?: boolean;
  dataAccess?: string | null;
  /** 例程的 DEFINER */
  definer?: string | null;
  /** 触发器才有：作用的表 */
  table?: string | null;
  /** 触发器才有：BEFORE / AFTER */
  timing?: string | null;
  /** 触发器才有：INSERT / UPDATE / DELETE */
  event?: string | null;
  /** 事件才有：ENABLED / DISABLED / SLAVESIDE_DISABLED */
  status?: string | null;
  starts?: string | null;
  ends?: string | null;
  onCompletion?: string | null;
  created?: string | null;
  modified?: string | null;
  comment?: string | null;
}

/** 分类计数 */
export interface DbObjectSummary {
  counts: Record<DbObjectCategory, number>;
  /** 某一类读不到时的原因（权限不足 / 内核无此概念） */
  errors: Record<string, string>;
}

/**
 * 取各类对象的数量（树节点角标）。
 *
 * @param datasourceId 数据源 ID
 * @param database 库名
 */
export const fetchDbObjectSummary = (datasourceId?: number, database?: string) =>
  http()
    .get("/ms/monitor/db/objects/summary")
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbObjectSummary>(r));

/**
 * 列出某类对象。
 *
 * @param category 类别
 * @param datasourceId 数据源 ID
 * @param database 库名
 */
export const fetchDbObjects = (category: DbObjectCategory, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/objects/${category}`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbObjectInfo[]>(r));

/**
 * 读对象定义。
 *
 * @param category 类别
 * @param name 对象名
 * @param datasourceId 数据源 ID
 * @param database 库名
 */
export const fetchDbObjectDefinition = (
  category: DbObjectCategory,
  name: string,
  datasourceId?: number,
  database?: string
) =>
  http()
    .get(`/ms/monitor/db/objects/${category}/${encodeURIComponent(name)}/definition`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<string>(r));

/**
 * 新建或整体替换对象。
 *
 * <p>{@code existOk=true} 时后端走「先删后建」实现改定义。</p>
 *
 * @param category 类别
 * @param definition 完整 DDL
 * @param options 数据源与目标库
 * @param existOk 是否允许覆盖已存在的同名对象
 */
export const saveDbObject = (
  category: DbObjectCategory,
  definition: string,
  options: { datasourceId?: number; database?: string },
  existOk = false
) =>
  http()
    .post(`/ms/monitor/db/objects/${category}`)
    .noToast(true)
    .data({ definition, existOk, ...options })
    .then(r => unwrap<boolean>(r));

/**
 * 删除对象。
 *
 * @param category 类别
 * @param name 对象名
 * @param options 数据源与目标库
 * @param ifExists 对象不存在时是否静默成功
 */
export const dropDbObject = (
  category: DbObjectCategory,
  name: string,
  options: { datasourceId?: number; database?: string },
  ifExists = true
) =>
  http()
    .delete(`/ms/monitor/db/objects/${category}/${encodeURIComponent(name)}`)
    .noToast(true)
    .query({ ...options, ifExists })
    .then(r => unwrap<boolean>(r));

/* ==================== 外键 ==================== */

/** 外键详情（来自 JDBC getImportedKeys） */
export interface DbForeignKeyInfo {
  fkName: string;
  columnName: string;
  refTable: string;
  refColumn: string;
  updateRule?: number | string;
  deleteRule?: number | string;
}

/** 新增外键的请求体 */
export type DbForeignKeyPayload = {
  name: string;
  columns: string[];
  refTable: string;
  refColumns: string[];
  onUpdate?: string;
  onDelete?: string;
  database?: string;
  datasourceId?: number;
};

/**
 * 新增外键。
 *
 * @param tableName 本表
 * @param payload 外键定义
 */
export const addDbForeignKey = (tableName: string, payload: DbForeignKeyPayload) =>
  http()
    .post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/foreign-key`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/**
 * 删除外键。
 *
 * @param tableName 本表
 * @param fkName 约束名
 * @param datasourceId 数据源 ID
 * @param database 库名
 */
export const dropDbForeignKey = (tableName: string, fkName: string, datasourceId?: number, database?: string) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/foreign-key/${encodeURIComponent(fkName)}`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));
