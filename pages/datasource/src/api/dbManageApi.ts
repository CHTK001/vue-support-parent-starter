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
  [key: string]: unknown;
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
  /** MySQL 调整列顺序：空串=FIRST，非空=AFTER 该列；缺省=保持原位 */
  afterColumn?: string;
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
  /**
   * 上传令牌。
   *
   * <p>只有 {@code import/upload} 返回它；第 3～7 步靠它复用同一份上传文件，
   * 不再重传。走 {@code import/preview}（旧端点）时没有这个字段。</p>
   */
  token?: string;
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
  /** 实际解析出的格式（csv / excel / sql / json） */
  format?: string;
  /** Excel 的全部工作表名（CSV 为空数组） */
  sheets?: string[];
  /** Excel 当前工作表 */
  activeSheet?: string;
  /** 解析过程中的非致命告警 */
  warnings?: string[];
  /** 后端是否装配了 Excel 能力（缺 POI 时为 false） */
  excelAvailable?: boolean;
  /** 原始文件名 */
  fileName?: string;
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

/* ==================== 导入向导（Navicat 七步流程） ==================== */

/**
 * 导入向导的源选项。
 *
 * <p>字段名必须与后端 {@code DbImportDTO} 一一对应：后端用 Jackson 按名反序列化，
 * 拼错一个键不会报错，只会静默退化成默认值 —— 表现为「界面上选了分隔符，
 * 解析结果却仍是逗号」。</p>
 */
export type DbImportSourceOptions = {
  /** 上传令牌：第 2 步上传后返回，第 3～7 步复用同一个文件，不再重传 */
  token?: string;
  fileName?: string;
  /** csv / excel / sql / json */
  format?: string;
  /** 字符集名；不传等于交给后端按内容探测 */
  encoding?: string;
  /** Excel 工作表名（format=excel 时有效） */
  sheetName?: string;
  delimiter?: string;
  /** 记录分隔符：CRLF / LF / CR */
  recordDelimiter?: string;
  /** 文本识别符（引号），空串表示不识别 */
  textQualifier?: string;
  /** 字段名称所在行号（1 起，0 = 没有表头） */
  fieldNamesLine?: number;
  /** 第一个数据行号（1 起） */
  firstDataLine?: number;
  /** 最后一个数据行号（1 起，0 = 读到末尾） */
  lastDataLine?: number;
  decimalSymbol?: string;
  /** 日期顺序：YMD / DMY / MDY（仅 Excel 分支） */
  dateOrder?: string;
  dateTimeOrder?: string;
  dateSeparator?: string;
  yearSeparator?: string;
  timeSeparator?: string;
};

/**
 * 导入模式。
 *
 * <p>取值必须与后端 {@code ImportMode} 的 code 完全一致：后端按 code 匹配，
 * 匹配不上会退化成 {@code APPEND}，表现为「选了更新却全变成了追加」。</p>
 */
export type DbImportMode = "append" | "update" | "upsert" | "insert-ignore" | "delete" | "copy";

/** 导入模式候选（顺序与 Navicat 一致） */
export const DB_IMPORT_MODES: { value: DbImportMode; label: string; hint: string }[] = [
  { value: "append", label: "追加", hint: "无条件插入全部记录" },
  { value: "update", label: "更新", hint: "只更新已存在的行，不存在则跳过" },
  { value: "upsert", label: "追加或更新", hint: "存在则更新，不存在则插入" },
  { value: "insert-ignore", label: "不更新追加", hint: "存在则跳过，不存在则插入" },
  { value: "delete", label: "删除", hint: "只删除目标表里与源匹配的行" },
  { value: "copy", label: "复制", hint: "先清空目标表，再全量插入" },
];

/** 导入高级选项 */
export type DbImportAdvanced = {
  /** 是否使用扩展插入（一条 INSERT 带多行） */
  extendedInsert: boolean;
  /** 最大语句大小（KB），0 = 不限制 */
  maxStatementKb: number;
  /** 空串是否写成 NULL */
  nullForEmpty: boolean;
  /** 是否忽略外键约束 */
  ignoreForeignKey: boolean;
  /** 遇到错误是否继续 */
  continueOnError: boolean;
};

/** 高级选项出厂默认（与后端 {@code ImportAdvanced} 的缺省保持一致） */
export const DB_IMPORT_ADVANCED_DEFAULTS: DbImportAdvanced = {
  extendedInsert: true,
  maxStatementKb: 0,
  nullForEmpty: false,
  ignoreForeignKey: false,
  continueOnError: true,
};

/**
 * 上传文件并解析（向导第 2 步）。
 *
 * <p>只上传一次即拿到 {@code token}，后续第 3～7 步都用它，不再重传文件。</p>
 *
 * @param file   上传的文件
 * @param option 源选项（可只带 format / encoding）
 * @returns 令牌 + 解析结果
 */
export const uploadDbImportFile = (file: File, option: DbImportSourceOptions = {}) => {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("option", JSON.stringify({ ...option, fileName: file.name }));
  return http()
    .post("/ms/monitor/db/import/upload")
    .noToast(true)
    .data(form)
    .then(r => unwrap<DbImportPreview>(r));
};

/**
 * 带新选项重新解析已上传的文件（向导第 3 步）。
 *
 * <p>用户每改一次分隔符 / 编码就重解析一次，比让他重传文件快得多。</p>
 *
 * @param option 源选项（必须带 token）
 * @returns 解析结果
 */
export const parseDbImport = (option: DbImportSourceOptions) =>
  http()
    .post("/ms/monitor/db/import/parse")
    .noToast(true)
    .data({ option })
    .then(r => unwrap<DbImportPreview>(r));

/** 新建表建议（向导第 4 步） */
export interface DbImportTablePlan {
  /** 建议的表名（已清洗成合法标识符） */
  tableName: string;
  /** 建议的列清单 */
  columns: { name: string; source: string }[];
}

/**
 * 按源列生成建表建议（向导第 4 步）。
 *
 * <p>表名由后端按文件名去后缀并清洗成合法标识符，前端不再自己拼 ——
 * 早期在前端拼表名时，中文文件名会直接变成一堆下划线。</p>
 *
 * @param sourceColumns 源列名
 * @param fileName      原始文件名（用来推导表名）
 * @returns 建表建议
 */
export const planDbImportTable = (sourceColumns: string[], fileName: string) =>
  http()
    .post("/ms/monitor/db/import/table-plan")
    .noToast(true)
    .data({ sourceColumns, fileName })
    .then(r => unwrap<DbImportTablePlan>(r));

/** 导入执行请求（向导第 7 步） */
export type DbImportRunOptions = DbImportSourceOptions & {
  database?: string;
  tableName: string;
  /** 源列名 → 目标列名；未列出的源列忽略 */
  columnMapping?: Record<string, string>;
  mode?: DbImportMode;
  /** 用于匹配的键列（空 = 按目标表主键） */
  keyColumns?: string[];
  /** 目标表不存在时按源列自动建表 */
  createTable?: boolean;
  /** 导入前清空目标表（copy 模式由后端自动置位） */
  truncateFirst?: boolean;
  batchSize?: number;
  datasourceId?: number;
  extendedInsert?: boolean;
  maxStatementKb?: number;
  nullForEmpty?: boolean;
  ignoreForeignKey?: boolean;
  continueOnError?: boolean;
};

/** 导入执行事件（SSE） */
export type DbImportEvent =
  | { type: "phase"; message: string }
  | { type: "progress"; done: number; total: number }
  | { type: "log"; no: number; ok: boolean; affected: number; error: string }
  | { type: "error"; message: string }
  | {
      type: "done";
      table?: string;
      total: number;
      inserted: number;
      updated: number;
      skipped: number;
      deleted: number;
      errors: number;
      errorDetails?: string[];
      elapsedMs: number;
      failed?: boolean;
    };

/**
 * 执行导入（向导第 7 步，SSE 流式）。
 *
 * <p>走 {@code http().sse()} 而不是裸 {@code fetch}：统一 API 前缀、鉴权头、
 * {@code x-oauth-token} query 与错误处理都在 http 客户端里，自己拼一份必然漏。
 * 与结构同步（{@code structure-sync-run}）走同一条 SSE 通道，行为一致。</p>
 *
 * @param options  完整请求
 * @param handlers 事件回调
 * @returns 关闭函数（用户点「关闭」时中断）
 */
export const runDbImport = (
  options: DbImportRunOptions,
  handlers: {
    onEvent: (event: DbImportEvent) => void;
    onError?: (message: string) => void;
  },
) =>
  http()
    .post("/ms/monitor/db/import/run")
    .noToast(true)
    .data({ option: options })
    .sse<Record<string, unknown>>({
      // 导入是一次性的写操作：断了不能重连，否则同一批数据会被写两遍
      reconnect: false,
      onMessage: (e) => {
        const data = (e.data ?? {}) as Record<string, unknown>;
        switch (e.event) {
          case "phase":
            handlers.onEvent({ type: "phase", message: String(data.message ?? "") });
            break;
          case "progress":
            handlers.onEvent({
              type: "progress",
              done: Number(data.done ?? 0),
              total: Number(data.total ?? 0),
            });
            break;
          case "log":
            handlers.onEvent({
              type: "log",
              no: Number(data.no ?? 0),
              ok: data.ok === true,
              affected: Number(data.affected ?? 0),
              error: String(data.error ?? ""),
            });
            break;
          case "error":
            handlers.onEvent({ type: "error", message: String(data.message ?? "导入失败") });
            break;
          case "done":
            handlers.onEvent({
              type: "done",
              table: data.table === undefined ? undefined : String(data.table),
              total: Number(data.total ?? 0),
              inserted: Number(data.inserted ?? 0),
              updated: Number(data.updated ?? 0),
              skipped: Number(data.skipped ?? 0),
              deleted: Number(data.deleted ?? 0),
              errors: Number(data.errors ?? 0),
              errorDetails: Array.isArray(data.errorDetails)
                ? data.errorDetails.map(v => String(v))
                : undefined,
              elapsedMs: Number(data.elapsedMs ?? 0),
              failed: data.failed === true,
            });
            break;
          default:
            break;
        }
      },
      onError: (err) => {
        handlers.onError?.(String((err as Error)?.message ?? err));
      },
    });

/* ==================== 跨库复制表 ==================== */

/**
 * 跨库复制表请求体。
 *
 * <p>源与目标是两组独立的「数据源 + 库 + 表」：同库换名、同数据源跨库、
 * 跨数据源复制都走同一个结构，不另开接口。{@code copyData} 缺省 true，
 * {@code overwrite} 缺省 false（同名表直接失败，避免一次手滑把已有表覆盖掉）。</p>
 */
export type DbTableCopyPayload = {
  /** 源数据源 ID，0 / 省略表示应用默认主数据源 */
  sourceDatasourceId?: number;
  /** 源库名，可为空（沿连接默认库） */
  sourceDatabase?: string;
  sourceTable: string;
  /** 目标数据源 ID，0 / 省略表示应用默认主数据源 */
  targetDatasourceId?: number;
  /** 目标库名，可为空（沿连接默认库） */
  targetDatabase?: string;
  targetTable: string;
  /** 是否连同数据一起复制，缺省 true */
  copyData?: boolean;
  /** 目标同名表是否覆盖（写临时表后原子换名，换完才删旧表），缺省 false */
  overwrite?: boolean;
};

/** 复制任务里的单步骤（后端直接产出，字段与 ProgressStep 对齐） */
export interface DbCopyTaskStep {
  /** 步骤键：structure / create / data */
  key: string;
  title: string;
  /** WAIT / RUNNING / SUCCESS / SKIPPED / ERROR / CANCELLED */
  status?: string;
  /** 结果补充（错误原因、跳过原因） */
  detail?: string | null;
}

/**
 * 复制任务快照（后端 {@code DbCopyTaskRegistry} 直接产出，字段与 ProgressSnapshot 对齐）。
 *
 * <p>后端刻意按前端的 {@code ProgressSnapshot} 组织字段，前端拿到后原样喂给
 * {@code ReProgressDialog} 即可，不再做一层翻译 —— 多一层翻译就多一处会漂移的口径。</p>
 */
export interface DbCopyTaskSnapshot {
  /** 任务标识（订阅方按它过滤，全局流里混着别人的任务） */
  taskId: string;
  /** 弹窗标题（后端固定的「复制表」） */
  title?: string;
  /** 副标题：源 库.表 → 目标 库.表 */
  subtitle?: string;
  /** RUNNING / SUCCESS / FAILED / CANCELLED */
  status?: string;
  /** 0-100 */
  percentage?: number;
  currentTitle?: string;
  currentDescription?: string;
  /** 最终结论 */
  message?: string | null;
  finished?: boolean;
  cancellable?: boolean;
  startedAt?: number;
  finishedAt?: number;
  steps?: DbCopyTaskStep[];
  details?: string[];
}

/**
 * 提交一次跨库复制表任务。
 *
 * <p>后端只做校验并立刻返回 {@code taskId}，数据搬运在后台线程执行；
 * 进度必须走 {@link subscribeDbCopyTasks} 那条全局流，否则刷新页面就丢了。</p>
 *
 * @param payload 源/目标 + 是否复制数据 + 是否覆盖同名表
 * @returns 任务 id
 */
export const copyDbTable = (payload: DbTableCopyPayload) =>
  http()
    .post("/ms/monitor/db/table/copy")
    .noToast(true)
    .data(payload)
    .then(r => unwrap<{ taskId: string }>(r));

/**
 * 请求取消某个复制任务。
 *
 * <p>后端只置标志位，复制循环在批次边界停下（强行打断已执行的语句会把连接留在未知状态），
 * 因此取消到生效之间可能还差最后一批数据。</p>
 *
 * @param taskId 任务 id
 * @returns 后端是否受理
 */
export const cancelDbCopy = (taskId: string) =>
  http()
    .post(`/ms/monitor/db/copy/${encodeURIComponent(taskId)}/cancel`)
    .noToast(true)
    .then(r => unwrap<{ taskId: string; cancelled: boolean }>(r));

/**
 * 当前保留的复制任务快照（刷新页面后补齐状态用）。
 *
 * @returns 任务快照列表
 */
export const fetchDbCopyTasks = () =>
  http()
    .get("/ms/monitor/db/copy/tasks")
    .noToast(true)
    .then(r => unwrap<DbCopyTaskSnapshot[]>(r));

/**
 * 订阅复制任务的全局进度流。
 *
 * <p>只有一条流：事件按 {@code taskId} 分发，订阅方自己过滤掉别人的任务。
 * 建连先给一帧 {@code ready}（当前全部任务），之后每次状态变化推一帧完整快照
 * {@code task}（不是增量），因此页面上任何时刻收到一帧都能直接渲染。</p>
 *
 * <p>走 {@code http().sse()} 而不是裸 {@code EventSource}：统一 API 前缀、鉴权头
 * 与 401 处理都在 http 客户端里，裸 EventSource 建连会拿不到数据。</p>
 *
 * @param handlers 事件回调
 * @returns 关闭函数（离开页面时调用）
 */
export const subscribeDbCopyTasks = (handlers: {
  /** 建连时的现存任务 */
  onReady?: (tasks: DbCopyTaskSnapshot[]) => void;
  /** 某任务的最新完整快照 */
  onTask?: (task: DbCopyTaskSnapshot) => void;
  /** 链路异常（自动重连由客户端负责） */
  onError?: (message: string) => void;
}) =>
  http()
    .get("/ms/monitor/db/copy/stream")
    .noToast(true)
    .sse<Record<string, unknown>>({
      // 只读流：断开重连不会重复写入任何数据，允许自动重连
      reconnect: true,
      maxReconnectAttempts: 10,
      reconnectInterval: 3000,
      onMessage: (e) => {
        const data = (e.data ?? {}) as Record<string, unknown>;
        if (e.event === "ready") {
          const tasks = Array.isArray(data.tasks) ? (data.tasks as DbCopyTaskSnapshot[]) : [];
          handlers.onReady?.(tasks);
          return;
        }
        if (e.event === "task") {
          handlers.onTask?.(data as unknown as DbCopyTaskSnapshot);
        }
      },
      onError: (err) => {
        handlers.onError?.(String((err as Error)?.message ?? err));
      },
    });
