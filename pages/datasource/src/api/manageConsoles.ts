/**
 * 数据源控制台 API（@pages/datasource）
 *
 * <p>从监控应用 monitorApi.ts 搬运：数据库 web 管理器段 + 外部服务管理段
 * （InfluxDB / Neo4j / Nacos / ZooKeeper）。请求走 @repo/utils 的 http 管线，
 * 返回已解包的业务数据。</p>
 *
 * <p><strong>导入副作用</strong>：本模块的接口全部落在监控后端的 {@code /ms/monitor/db/*}
 * 前缀下。宿主一旦用到本模块（数据源控制台页面），「浏览表结构」就应走同一套接口，
 * 因此本模块在导入时把表结构提供者切成监控侧实现 —— 宿主不必再在 main.ts 里手写一次
 * 注册调用（与本包 {@code registerMenuViewModules} 的「导入即注册」约定同构）。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { getAccessToken, http, unwrapResult } from "@repo/utils";
import type { DbColumnPayload } from "./dbManageApi";
import { setDatasourceSchemaProvider, hubSchemaProvider, type CollectColumn, type DataSourceInfo } from "./index";
import { fetchDataSource } from "./index";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);
// ==================== 数据库 web 管理器（使用默认主 datasource） ====================

/**
 * 数据库表信息
 * @author CH
 * @since 4.0.0
 */
export interface DbTableInfo {
  name: string;
  type: string;
  remark?: string;
}

/**
 * 表列信息
 * @author CH
 * @since 4.0.0
 */
export interface DbColumnInfo {
  name: string;
  type: string;
  size: number;
  nullable: boolean;
  remark?: string;
  default?: string;
  position?: number;
  isPrimaryKey?: boolean;
  /** 去掉长度与 UNSIGNED/ZEROFILL 后的基础类型，如 `int(10) unsigned` → `INT` */
  baseType?: string;
  /** 是否无符号 */
  unsigned?: boolean;
  /** 是否补零 */
  zerofill?: boolean;
  /** 是否自增（内核 EXTRA 含 auto_increment） */
  autoIncrement?: boolean;
  /** 列字符集 */
  charset?: string;
  /** 列排序规则 */
  collation?: string;
  /** ENUM / SET 的取值列表 */
  enumValues?: string[];
  /** 小数位 */
  scale?: number;
}

/**
 * 新建数据库请求
 * @author CH
 * @since 4.0.0
 */
export type DbDatabasePayload = {
  name: string;
  datasourceId?: number;
  charset?: string;
  collation?: string;
};

/**
 * 表数据结果
 * @author CH
 * @since 4.0.0
 */
export interface DbTableDataResult {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * SQL 执行结果
 * @author CH
 * @since 4.0.0
 */
export interface DbQueryResult {
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowCount?: number;
  truncated?: boolean;
  affectedRows?: number;
  message?: string;
}

/**
 * 获取数据库列表
 * @param datasourceId 数据源 ID（可选）
 * @returns 数据库名列表
 */
export const fetchDbDatabases = (datasourceId?: number) =>
  http()
    .get("/ms/monitor/db/databases")
    .noToast(true)
    .query({ datasourceId })
    .then(r => unwrap<string[]>(r));

/**
 * 获取数据库表列表
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @returns 表信息列表
 */
export const fetchDbTables = (datasourceId?: number, database?: string) =>
  http()
    .get("/ms/monitor/db/tables")
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbTableInfo[]>(r));

/**
 * 获取表结构
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @returns 列信息列表
 */
export const fetchTableColumns = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/columns`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbColumnInfo[]>(r));

/**
 * 获取表数据（分页）
 * @param tableName 表名
 * @param page 页码，默认 1
 * @param pageSize 每页条数，默认 50
 * @param orderBy 排序列（可选）
 * @param orderDir 排序方向（可选）
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @param countTotal 是否统计总数（false 跳过大表 COUNT，total 返回 -1 表示未知）
 * @param where WHERE 过滤条件（Navicat 式自由条件，可选）
 * @param filters 结构化筛选条件（高级筛选，可选；与 where 同时给出时按 AND 组合）
 * @returns 表数据分页结果
 */
export const fetchTableData = (tableName: string, page = 1, pageSize = 50, orderBy?: string, orderDir?: string, datasourceId?: number, database?: string, countTotal = true, where?: string, filters?: DbFilterCondition[]) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/data`)
    .noToast(true)
    .query({
      page,
      pageSize,
      orderBy,
      orderDir: orderBy ? orderDir || "ASC" : undefined,
      datasourceId,
      database,
      count: countTotal,
      where: where?.trim() ? where.trim() : undefined,
      // 空数组不传：传 `[]` 也会让后端走一次 JSON 解析，而语义上与不传完全相同
      filters: filters && filters.length > 0 ? JSON.stringify(filters) : undefined,
    })
    .then(r => unwrap<DbTableDataResult>(r));

/**
 * 结构化筛选条件（Navicat 式高级筛选的一行）
 *
 * <p>与 WHERE 自由文本是**两套独立机制**：列名走标识符白名单、值走
 * PreparedStatement 绑定（所以值里的引号不构成注入）；而 where 文本框
 * 只能靠「拒绝分隔符」的黑名单。两者同时给出时按 AND 组合。</p>
 *
 * @author CH
 * @since 4.0.0.45
 */
export interface DbFilterCondition {
  /** 列名（后端过标识符白名单） */
  column: string;
  /** 运算符：= <> > >= < <= LIKE "NOT LIKE" "IS NULL" "IS NOT NULL" IN "NOT IN" BETWEEN */
  op: string;
  /** 值1；IN 时为逗号分隔的多值；BETWEEN 时为下界 */
  value?: string;
  /** 值2：仅 BETWEEN 用作上界 */
  value2?: string;
}

/** 高级筛选支持的运算符（与后端 DbFilter.operators 同口径） */
export const DB_FILTER_OPS = [
  "=", "<>", ">", ">=", "<", "<=",
  "LIKE", "NOT LIKE", "IS NULL", "IS NOT NULL",
  "IN", "NOT IN", "BETWEEN",
] as const;

/**
 * 该运算符是否需要第二个值（BETWEEN 的上界）
 * @param op 运算符
 * @returns true=需要 value2
 */
export const dbFilterNeedsValue2 = (op: string): boolean => op === "BETWEEN";

/**
 * 该运算符是否不接受任何值（IS NULL / IS NOT NULL）
 * @param op 运算符
 * @returns true=无值
 */
export const dbFilterTakesNoValue = (op: string): boolean =>
  op === "IS NULL" || op === "IS NOT NULL";

/**
 * 该运算符是否接受逗号分隔的多值（IN / NOT IN）
 * @param op 运算符
 * @returns true=多值
 */
export const dbFilterTakesMultipleValues = (op: string): boolean =>
  op === "IN" || op === "NOT IN";

/**
 * 获取表的建表语句（DDL）
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @returns 建表语句
 */
export const fetchTableDdl = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/ddl`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<string>(r));

/** 外键信息 */
export interface DbForeignKeyInfo {
  [key: string]: unknown;
  fkName?: string;
  columnName?: string;
  refTable?: string;
  refColumn?: string;
  updateRule?: number;
  deleteRule?: number;
}

/**
 * 获取表的外键列表
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @returns 外键列表
 */
export const fetchForeignKeys = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/foreign-keys`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbForeignKeyInfo[]>(r));

/**
 * 执行 SQL（支持 SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/DROP）
 * @param sql SQL 语句
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库名（可选，为空用连接默认库）
 * @param txId 显式事务 ID（可选）；传了就在该事务的连接上执行
 * @param timeoutMs 请求超时毫秒（可选；第九批 8.1 执行超时可配）。
 *                  不传用全局默认 10s；传 0 = 不设上限（axios 约定）
 * @returns SQL 执行结果
 */
export const executeDbSql = (sql: string, datasourceId?: number, database?: string, txId?: string, timeoutMs?: number) => {
  const req = http()
    .post("/ms/monitor/db/execute")
    .noToast(true)
    .data({ sql, datasourceId, database, txId });
  return (timeoutMs === undefined ? req : req.timeout(timeoutMs)).then(r => unwrap<DbQueryResult>(r));
};

// ---------- 用户管理（需求：数据源中心 / JDBC 控制台右键，SPI 判断显隐） ----------

/** 数据库用户行（后端 DbUserVO） */
export interface DbUserRow {
  name: string;
  host: string;
  sslType?: string | null;
  maxQuestionsPerHour?: number | null;
  maxUpdatesPerHour?: number | null;
  maxConnectionsPerHour?: number | null;
  maxUserConnections?: number | null;
  isSuper?: boolean;
}

/** 用户列表响应：supported=false 表示该内核不支持用户管理 */
export interface DbUserListResult {
  supported: boolean;
  users: DbUserRow[];
  message?: string;
}

/** 保存用户的请求体（新建 / 修改共用） */
export interface DbUserSavePayload {
  [key: string]: unknown;
  datasourceId?: number;
  username: string;
  host: string;
  password?: string;
  grants?: string[];
  superUser?: boolean;
}

/** 删除/查权限用户的请求体 */
export interface DbUserIdentity {
  [key: string]: unknown;
  datasourceId?: number;
  username: string;
  host: string;
}

/** 查询数据库用户列表（仅 MySQL/MariaDB 支持，其余内核返回 supported=false） */
export const fetchDbUsers = (datasourceId: number) =>
  http()
    .get("/ms/monitor/db/users")
    .noToast(true)
    .query({ datasourceId })
    .then((r: any) => unwrap<DbUserListResult>(r));

/** 新建数据库用户（CREATE USER + GRANT） */
export const createDbUser = (payload: DbUserSavePayload) =>
  http()
    .post("/ms/monitor/db/users")
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/** 修改数据库用户（ALTER USER + 增量权限） */
export const updateDbUser = (payload: DbUserSavePayload) =>
  http()
    .put("/ms/monitor/db/users")
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/** 删除数据库用户（DROP USER） */
export const deleteDbUser = (payload: DbUserIdentity) =>
  http()
    .delete("/ms/monitor/db/users")
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/** 查询数据库用户权限（SHOW GRANTS FOR） */
export const fetchDbUserGrants = (payload: DbUserIdentity) =>
  http()
    .post("/ms/monitor/db/users/grants")
    .noToast(true)
    .data(payload)
    .then(r => unwrap<{ supported: boolean; grants: string[]; message?: string }>(r));

// ---------- AI text2sql（第九批 7.2：后端集成 ai-starter 才有这两个端点） ----------

/**
 * AI text2sql 可用状态（`/db/ai/status` 的 data）
 *
 * @author CH
 * @since 4.0.0.42
 */
export interface DbAiStatus {
  /** 是否可用：存在 AI 实现且探测到可用模型；false 时前端隐藏 text2sql 入口 */
  available: boolean;
  /** 解析后的模型名 */
  model?: string | null;
  /** 不可用原因（现场排查用） */
  reason?: string | null;
}

/**
 * 探测 text2sql 是否可用。
 *
 * <p><b>失败不抛</b>：后端未部署（404）或探测接口异常一律归一为「不可用」，
 * 让入口保持隐藏 —— 「有整个功能才显示 text2sql」；错误也只留 reason 不弹 toast。</p>
 *
 * @returns 可用状态（永不 reject）
 */
export const fetchDbAiStatus = async (): Promise<DbAiStatus> => {
  try {
    return await http()
      .get("/ms/monitor/db/ai/status")
      .noToast(true)
      .then(r => unwrap<DbAiStatus>(r));
  } catch (e) {
    return { available: false, reason: (e as Error)?.message || "AI 状态探测失败（后端未集成或不可达）" };
  }
};

/**
 * text2sql 结果（`/db/ai/text2sql` 的 data）
 *
 * @author CH
 * @since 4.0.0.42
 */
export interface DbText2SqlResult {
  /** 已剥 markdown 围栏的 SQL（可直接落编辑器） */
  sql: string;
  /** 实际使用的模型名 */
  model?: string | null;
}

/**
 * 自然语言 → SQL。
 *
 * <p>生成**不执行**：结果只回给编辑器，是否执行始终由用户显式点击。</p>
 *
 * @param text 查询需求（必填，非空由后端校验）
 * @param context 结构上下文（可选，如已加载的表清单；注入系统提示词提升准确率）
 * @param datasourceId 目标数据源 ID（可选）
 * @returns 生成的 SQL 与模型名
 */
export const requestDbText2Sql = (text: string, context?: string, datasourceId?: number) =>
  http()
    .post("/ms/monitor/db/ai/text2sql")
    .noToast(true)
    .timeout(120_000)
    .data({ text, context, datasourceId })
    .then(r => unwrap<DbText2SqlResult>(r));

/** ER 图里的一个表 */
export interface DbErTable {
  name: string;
  comment?: string;
}

/** ER 图里的一条外键关系 */
export interface DbErRelation {
  name?: string;
  fromTable: string;
  fromColumn?: string;
  toTable: string;
  toColumn?: string;
  /** JDBC 规范：0=RESTRICT 1=CASCADE 2=SET NULL 3=NO ACTION 4=SET DEFAULT */
  updateRule?: number;
  deleteRule?: number;
}

/** ER 图元数据 */
export interface DbErDiagram {
  catalog?: string;
  tables: DbErTable[];
  relations: DbErRelation[];
}

/**
 * 读取库级 ER 图元数据（表清单 + 全部外键）。
 *
 * <p>一次往返拿完整库。前端逐表调外键端点在 40 表规模上是 40 次请求，
 * 每次都要重新连库、切库，ER 图这种「整体视图」会明显卡住。</p>
 *
 * @param tables 表名过滤（LIKE 模式，可为空表示全部）
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库名（可选）
 * @returns ER 图元数据
 */
export const fetchErDiagram = (tables?: string, datasourceId?: number, database?: string) =>
  http()
    .get("/ms/monitor/db/er-diagram")
    .noToast(true)
    .query({ datasourceId, database, tables })
    .then(r => unwrap<DbErDiagram>(r));

/** 结构对比的一条差异 */
export interface DbStructureDiffItem {
  /** MISSING_TABLE / MISSING_COLUMN / COLUMN_MISMATCH / MISSING_INDEX /
   *  INDEX_MISMATCH / MISSING_FOREIGN_KEY / EXTRA_TABLE / EXTRA_COLUMN */
  kind: string;
  table: string;
  object: string;
  detail: string;
  action: string;
  /** 生成给用户看的 DDL；只提示类的（EXTRA_*）为空 */
  ddl: string;
}

/** 结构对比请求 */
export interface DbStructureDiffPayload {
  sourceDatasourceId?: number;
  sourceDatabase?: string;
  targetDatasourceId?: number;
  targetDatabase?: string;
  /** 表名过滤（LIKE，可为空表示全部） */
  tables?: string;
}

/**
 * 比较两个库的结构，返回差异清单（源 → 目标，单向）。
 *
 * <p>只生成脚本、不代执行：清单里含 `DROP INDEX` / `MODIFY COLUMN`
 * 这类不可逆语句，是否执行由用户看过脚本后决定。</p>
 *
 * @param payload 源/目标数据源与库
 * @returns 差异清单
 */
export const compareDbStructure = (payload: DbStructureDiffPayload) =>
  http()
    .post("/ms/monitor/db/structure-diff")
    .noToast(true)
    // .data() 的入参是 RequestBody（索引签名约束），具体类型由调用点保证
    .data({ ...payload })
    .then(r => unwrap<DbStructureDiffItem[]>(r));

/**
 * 新建表请求
 *
 * <p>列定义**优先用结构化形态 `columns`**（设计表网格的一行一列，键与「新增列」一致），
 * 后端按内核拼 DDL；`fields` 是列定义原文（如 `id BIGINT PRIMARY KEY, name VARCHAR(255)`），
 * 保留给「粘一段就建」的用法。两条路都**不在前端拼 `CREATE TABLE`**：反引号与内联
 * `COMMENT` 都只对 MySQL 成立，H2/PostgreSQL 上会直接语法错。</p>
 */
export type DbCreateTablePayload = {
  /** 表名 */
  table: string;
  /** 结构化列（设计表）；非空时忽略 fields */
  columns?: DbColumnPayload[];
  /** 主键列名，须取自 columns；可为空 */
  primaryKey?: string[];
  /** 列定义原文；columns 为空时必填 */
  fields?: string;
  /** 表注释，可为空 */
  comment?: string;
  /** 数据源 ID（可选） */
  datasourceId?: number;
  /** 目标库名（可选，为空用连接默认库） */
  database?: string;
};

/**
 * 新建表（跨方言）
 * @param payload 表名、列定义、可选注释与目标库
 * @returns 是否创建成功
 */
export const createDbTable = (payload: DbCreateTablePayload) =>
  http()
    .post("/ms/monitor/db/table")
    .noToast(true)
    // .data() 的入参是 RequestBody（索引签名约束），具体类型由调用点保证
    .data({ ...payload })
    .then(r => unwrap<boolean>(r));

/**
 * 重命名表（跨方言）
 *
 * <p>不要在前端拼 `ALTER TABLE \`a\` RENAME TO \`b\``：反引号只对 MySQL 成立，
 * H2/PostgreSQL 上会直接语法错。引号与候选写法交后端按内核选。</p>
 *
 * @param tableName 原表名
 * @param newName 新表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库名（可选）
 * @returns 是否成功
 */
export const renameDbTable = (tableName: string, newName: string, datasourceId?: number, database?: string) =>
  http()
    .put(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/name`)
    .noToast(true)
    .query({ newName, datasourceId, database })
    .then(r => unwrap<boolean>(r));

/**
 * 删除表
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库名（可选）
 * @returns 删除结果
 */
export const dropDbTable = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));

/**
 * 删除视图
 *
 * <p>视图不能走 {@link dropDbTable}：后端那条是 `DROP TABLE`，MySQL 会拒绝成
 * `'x' is a view`，界面上表现为「删除表」点在视图节点上必然失败。</p>
 *
 * @param viewName 视图名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库名（可选）
 * @returns 删除结果
 */
export const dropDbView = (viewName: string, datasourceId?: number, database?: string) =>
  http()
    .delete(`/ms/monitor/db/view/${encodeURIComponent(viewName)}`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));

/**
 * 新建数据库（后端按内核选择 DATABASE / SCHEMA 语法）
 * @param payload 库名、数据源与可选字符集
 * @returns 创建结果
 */
export const createDbDatabase = (payload: DbDatabasePayload) =>
  http()
    .post("/ms/monitor/db/database")
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/**
 * 删除数据库
 * @param name 数据库名
 * @param datasourceId 数据源 ID（可选）
 * @returns 删除结果
 */
export const dropDbDatabase = (name: string, datasourceId?: number) =>
  http()
    .delete("/ms/monitor/db/database")
    .noToast(true)
    .query({ name, datasourceId })
    .then(r => unwrap<boolean>(r));

// ==================== 数据库文档导出（后端复用 utils 层 DocumentProvider SPI） ====================

/**
 * 当前实例可用的导出格式
 *
 * @author CH
 * @since 4.0.0.43
 */
export interface DbDocumentFormat {
  format: string;
  extensions: string[];
  /** 依赖服务端外部程序（pdf 走 wkhtmltopdf），不可用时后端会 501 */
  external?: boolean;
}

/**
 * 文档导出能力清单
 *
 * @author CH
 * @since 4.0.0.43
 */
export interface DbDocumentFormats {
  formats: DbDocumentFormat[];
  templates: string[];
}

/**
 * 查询可用的文档导出格式与模板
 *
 * <p>按 classpath 上的 DocumentProvider SPI 实际探测：宿主没引 word/pdf 模块时
 * 那两项不会出现在清单里，前端据此只渲染装了的选项，而不是给一个点了就报错的按钮。</p>
 *
 * @returns 能力清单
 */
export const dbDocumentFormats = () =>
  http().get("/ms/monitor/db/document/formats").noToast(true).then(r => unwrap<DbDocumentFormats>(r));

/** 从 Content-Disposition 里取文件名（优先 RFC 5987 的 filename*，回退 ASCII 的 filename） */
function filenameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      /* 解不出就退回 ASCII 那份 */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1]?.trim() || fallback;
}

/**
 * 导出数据库设计文档并下载
 *
 * <p>刻意不走 `http()` 管线：那条管线按 JSON 解析响应，而这里是二进制流
 * （word 是 zip、pdf 是二进制），走管线会得到一段乱码字符串。</p>
 *
 * @param params 数据源、库名、格式、模板与可选的表名白名单
 * @returns 文档二进制与后端给出的文件名
 * @author CH
 * @since 4.0.0.43
 */
export async function downloadDbDocument(params: {
  datasourceId: number;
  database?: string;
  format: string;
  template?: string;
  tables?: string;
}): Promise<{ blob: Blob; filename: string }> {
  const query = new URLSearchParams();
  query.set("datasourceId", String(params.datasourceId));
  if (params.database) query.set("database", params.database);
  query.set("format", params.format);
  if (params.template) query.set("template", params.template);
  if (params.tables) query.set("tables", params.tables);

  const token = getAccessToken();
  const response = await fetch(`/ms/monitor/db/document/export?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    // 错误体是纯文本（后端刻意不用 JSON：这个端点的正常产物是文件）
    throw new Error((await response.text()) || `导出失败（HTTP ${response.status}）`);
  }
  return {
    blob: await response.blob(),
    filename: filenameFromDisposition(
      response.headers.get("Content-Disposition"),
      `database-doc.${params.format === "markdown" ? "md" : params.format}`,
    ),
  };
}

/**
 * 在线查看数据库设计文档（markdown → HTML，用于弹窗内预览）。
 *
 * <p>与导出走同一套结构采集路径，但端点返回可直接渲染的 HTML。
 * word / pdf 为二进制格式，在线预览端点会返回 501 并给出下载提示。</p>
 *
 * @param params 数据源、库名与可选的模板样式
 * @returns 渲染后的 HTML 文本
 * @author CH
 * @since 4.0.0.43
 */
export async function previewDbDocument(params: {
  datasourceId: number;
  database?: string;
  template?: string;
}): Promise<string> {
  const query = new URLSearchParams();
  query.set("datasourceId", String(params.datasourceId));
  if (params.database) query.set("database", params.database);
  query.set("format", "markdown");
  if (params.template) query.set("template", params.template);

  const token = getAccessToken();
  const response = await fetch(`/ms/monitor/db/document/preview?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error((await response.text()) || `预览失败（HTTP ${response.status}）`);
  }
  return response.text();
}

/**
 * 取数据库设计文档的 HTML 文本（右键「查看数据库文档」用）。
 *
 * <p>与 {@link downloadDbDocument} 同源同端点，只是拿 {@code text/html} 的响应体
 * 文本而不是 blob —— 右键入口要把文档在页面内直接展示，不需要落盘文件名。</p>
 *
 * @param params 数据源、库名与模板；format 固定 html
 * @returns HTML 文档文本
 * @author CH
 * @since 4.0.0.43
 */
export async function fetchDbDocumentHtml(params: {
  datasourceId: number;
  database?: string;
  template?: string;
  tables?: string;
}): Promise<string> {
  const query = new URLSearchParams();
  query.set("datasourceId", String(params.datasourceId));
  if (params.database) query.set("database", params.database);
  query.set("format", "html");
  if (params.template) query.set("template", params.template);
  if (params.tables) query.set("tables", params.tables);

  const token = getAccessToken();
  const response = await fetch(`/ms/monitor/db/document/export?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error((await response.text()) || `获取数据库文档失败（HTTP ${response.status}）`);
  }
  return response.text();
}
// ==================== 外部服务管理（InfluxDB / Neo4j / Nacos / ZooKeeper） ====================

/**
 * 中间件连通性测试载荷，与后端 `MiddlewareTestDTO` 同形
 *
 * <p>带 datasourceId 时按库里登记的配置测；不带时用 host/port/username/password 做即席测试。</p>
 * @author CH
 * @since 4.0.0
 */
export type MiddlewareTestConfig = {
  datasourceId?: number;
  host?: string;
  port?: number;
  contextPath?: string;
  username?: string;
  password?: string;
};

/**
 * 中间件连通性测试结果
 * @author CH
 * @since 4.0.0
 */
export type MiddlewareTestResult = {
  connected: boolean;
  version: string;
  message: string;
};

// ---------- InfluxDB 时序数据库管理 ----------

/**
 * InfluxDB Bucket 信息
 *
 * <p>序列基数不在 {@code /api/v2/buckets} 的回传字段里，逐桶统计又要各跑一次高开销 Flux，
 * 因此这里不提供该字段，页面也不显示空的「序列数」列。</p>
 * @author CH
 * @since 4.0.0
 */
export type InfluxdbBucket = {
  id: string;
  name: string;
  /** 保留时长（小时），0 表示永久保留，服务端未给规则时为 null */
  retentionHours: number | null;
  createdAt: string;
};

/**
 * InfluxDB 度量信息
 * @author CH
 * @since 4.0.0
 */
export type InfluxdbMeasurement = {
  name: string;
  /** 字段数，聚合失败时为 null */
  fieldCount: number | null;
  /** 标签数，聚合失败时为 null */
  tagCount: number | null;
  /** 回看窗口内的最后写入时间，窗口内无数据时为 null */
  lastWriteTime: string | null;
};

/**
 * InfluxDB Flux 查询结果
 * @author CH
 * @since 4.0.0
 */
export type InfluxdbQueryResult = {
  query: string;
  executionTimeMs: number;
  rows: Record<string, unknown>[];
  rowCount: number;
  /** 截断前的总行数 */
  totalRows: number;
  /** 行数超过后端上限时为 true，rows 已被截断 */
  truncated: boolean;
};

/**
 * 测试 InfluxDB 连接
 * @param config 连接配置
 */
export const testInfluxdbConnection = (config: MiddlewareTestConfig) =>
  http().post("/ms/monitor/influxdb/test").data(config).then(r => unwrap<MiddlewareTestResult>(r));

/**
 * 获取 InfluxDB Bucket 列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchInfluxdbBuckets = (datasourceId?: number) =>
  http().get("/ms/monitor/influxdb/buckets").query({ datasourceId }).then(r => unwrap<InfluxdbBucket[]>(r));

/**
 * 获取 InfluxDB 度量列表
 * @param datasourceId 数据源 ID（可选）
 * @param bucket Bucket 名（可选）
 */
export const fetchInfluxdbMeasurements = (datasourceId?: number, bucket?: string) =>
  http().get("/ms/monitor/influxdb/measurements").query({ datasourceId, bucket }).then(r => unwrap<InfluxdbMeasurement[]>(r));

/**
 * 执行 InfluxDB 查询
 * @param flux 查询语句：v2 为 Flux，v3 为 SQL
 * @param datasourceId 数据源 ID（可选）
 * @param database v3 目标数据库（可选，空由服务端取第一个数据库；v2 忽略）
 */
export const executeInfluxdbQuery = (flux: string, datasourceId?: number, database?: string) =>
  http().post("/ms/monitor/influxdb/query").data({ flux, datasourceId, database }).then(r => unwrap<InfluxdbQueryResult>(r));

// ---------- Neo4j 图数据库管理 ----------

/**
 * Neo4j 标签信息
 *
 * <p>图规模超过后端扫描预算时，后端宁可不统计也不打满图库 CPU，计数列会被省略，故为可选。</p>
 * @author CH
 * @since 4.0.0
 */
export interface Neo4jLabel {
  [key: string]: unknown;
  name: string;
  nodeCount?: number;
  propertyCount?: number;
}

/**
 * Neo4j 关系类型信息
 *
 * <p>计数列同 {@link Neo4jLabel}，超预算时省略。</p>
 * @author CH
 * @since 4.0.0
 */
export interface Neo4jRelationship {
  [key: string]: unknown;
  type: string;
  relationshipCount?: number;
  propertyCount?: number;
}

/**
 * Neo4j 连通性测试结果
 * @author CH
 * @since 4.0.0
 */
export interface Neo4jTestResult extends MiddlewareTestResult {
  /** 版本类型（community/enterprise），服务端未给出时为空 */
  edition?: string;
}

/**
 * Neo4j Cypher 执行结果
 * @author CH
 * @since 4.0.0
 */
export type Neo4jQueryResult = {
  query: string;
  executionTimeMs: number;
  rows: Record<string, unknown>[];
  rowCount: number;
  /** 截断前的总行数 */
  totalRows: number;
  /** 行数超过后端上限时为 true，rows 已被截断 */
  truncated: boolean;
};

/**
 * 测试 Neo4j 连接
 * @param config 连接配置
 */
export const testNeo4jConnection = (config: MiddlewareTestConfig) =>
  http().post("/ms/monitor/neo4j/test").data(config).then(r => unwrap<Neo4jTestResult>(r));

/**
 * 获取 Neo4j 标签列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNeo4jLabels = (datasourceId?: number) =>
  http().get("/ms/monitor/neo4j/labels").query({ datasourceId }).then(r => unwrap<Neo4jLabel[]>(r));

/**
 * 获取 Neo4j 关系类型列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNeo4jRelationships = (datasourceId?: number) =>
  http().get("/ms/monitor/neo4j/relationships").query({ datasourceId }).then(r => unwrap<Neo4jRelationship[]>(r));

/**
 * 执行 Neo4j Cypher 查询
 * @param cypher Cypher 查询语句
 * @param datasourceId 数据源 ID（可选）
 */
export const executeNeo4jQuery = (cypher: string, datasourceId?: number) =>
  http().post("/ms/monitor/neo4j/query").data({ cypher, datasourceId }).then(r => unwrap<Neo4jQueryResult>(r));

// ---------- Nacos 配置中心管理 ----------

/**
 * Nacos 命名空间信息
 * @author CH
 * @since 4.0.0
 */
export interface NacosNamespace {
  id: string;
  namespace: string;
  name: string;
  configCount: number;
}

/**
 * Nacos 配置信息
 * @author CH
 * @since 4.0.0
 */
export interface NacosConfig {
  [key: string]: unknown;
  dataId: string;
  group: string;
  format: string;
  updatedAt: string;
}

/**
 * Nacos 配置详情
 * @author CH
 * @since 4.0.0
 */
export interface NacosConfigDetail extends NacosConfig {
  namespace: string;
  content: string;
  createdAt: string;
}

/**
 * Nacos 配置发布请求
 *
 * <p>对应后端 {@code ConfigSaveRequest}：{@code type} 为 Nacos 的配置格式
 * （yaml/json/properties/text/xml），与列表中的 {@code format} 同源。</p>
 *
 * @author CH
 * @since 4.0.0
 */
export interface NacosConfigSaveRequest {
  [key: string]: unknown;
  dataId: string;
  group: string;
  content: string;
  type?: string;
  namespace?: string;
  datasourceId?: number;
}

/**
 * Nacos 服务信息
 * @author CH
 * @since 4.0.0
 */
export interface NacosService {
  [key: string]: unknown;
  name: string;
  clusterCount: number;
  healthyInstanceCount: number;
  unhealthyInstanceCount: number;
  triggerFlag: boolean;
}

/**
 * Nacos 集群节点信息
 * @author CH
 * @since 4.0.0
 */
export interface NacosClusterNode {
  [key: string]: unknown;
  ip: string;
  port: number;
  status: string;
  role: string;
  weight: number;
}

/**
 * 测试 Nacos 连接
 * @param config 连接配置
 */
export const testNacosConnection = (config: MiddlewareTestConfig) =>
  http().post("/ms/monitor/nacos/test").data(config).then(r => unwrap<MiddlewareTestResult>(r));

/**
 * 获取 Nacos 命名空间列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNacosNamespaces = (datasourceId?: number) =>
  http().get("/ms/monitor/nacos/namespaces").query({ datasourceId }).then(r => unwrap<NacosNamespace[]>(r));

/**
 * 分页获取 Nacos 配置列表
 * @param params 查询参数（命名空间/分组/dataId/分页）
 */
export const fetchNacosConfigs = (params: { datasourceId?: number; namespace?: string; group?: string; dataId?: string; page?: number; pageSize?: number }) =>
  http().get("/ms/monitor/nacos/configs").query(params).then(r => unwrap<{ list: NacosConfig[]; total: number; page: number; pageSize: number }>(r));

/**
 * 获取 Nacos 配置详情
 *
 * <p>dataId 走**查询参数**：放在路径里时含 `/` 的 dataId 会被 Tomcat 拒绝编码斜杠（400）。</p>
 *
 * @param dataId 配置 dataId
 * @param params 数据源/命名空间/分组
 */
export const fetchNacosConfigDetail = (dataId: string, params: { datasourceId?: number; namespace?: string; group?: string }) =>
  http().get("/ms/monitor/nacos/config").query({ ...params, dataId }).then(r => unwrap<NacosConfigDetail>(r));

/**
 * 保存 Nacos 配置
 * @param config 配置内容（含目标数据源）
 */
export const saveNacosConfig = (config: Partial<NacosConfigDetail> & { datasourceId?: number }) =>
  http().post("/ms/monitor/nacos/config").data(config).then(r => unwrap<boolean>(r));

/**
 * 删除 Nacos 配置
 *
 * <p>dataId 走**查询参数**（同详情接口，避免含 `/` 的 dataId 被拒）。</p>
 *
 * @param dataId 配置 dataId
 * @param params 数据源/命名空间/分组
 */
export const deleteNacosConfig = (dataId: string, params: { datasourceId?: number; namespace?: string; group?: string }) =>
  http().delete("/ms/monitor/nacos/config").query({ ...params, dataId }).then(r => unwrap<boolean>(r));

/**
 * 获取 Nacos 服务列表
 * @param datasourceId 数据源 ID（可选）
 * @param namespace 命名空间（可选）
 */
export const fetchNacosServices = (datasourceId?: number, namespace?: string) =>
  http().get("/ms/monitor/nacos/services").query({ datasourceId, namespace }).then(r => unwrap<NacosService[]>(r));

/**
 * 获取 Nacos 集群节点列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNacosClusterNodes = (datasourceId?: number) =>
  http().get("/ms/monitor/nacos/cluster/nodes").query({ datasourceId }).then(r => unwrap<NacosClusterNode[]>(r));

// ---------- ZooKeeper 注册中心管理 ----------

/**
 * ZooKeeper 节点信息
 * @author CH
 * @since 4.0.0
 */
export interface ZkNode {
  path: string;
  name: string;
  ephemeral: boolean;
  childrenCount: number;
}

/**
 * ZooKeeper 节点详情
 * @author CH
 * @since 4.0.0
 */
export interface ZkNodeDetail {
  path: string;
  ephemeral: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  numChildren: number;
  dataLength: number;
  data: string;
}

/**
 * ZooKeeper 子节点信息
 * @author CH
 * @since 4.0.0
 */
export interface ZkChildNode {
  [key: string]: unknown;
  name: string;
  path: string;
  ephemeral: boolean;
  data: string;
}

/**
 * ZooKeeper 连通性测试结果
 *
 * <p>会话 ID 用于判断临时节点归属：临时节点只在建立它的那个会话内存活。</p>
 * @author CH
 * @since 4.0.0
 */
export interface ZookeeperTestResult extends MiddlewareTestResult {
  sessionId: string;
}

/**
 * 测试 ZooKeeper 连接
 * @param config 连接配置
 */
export const testZookeeperConnection = (config: MiddlewareTestConfig) =>
  http().post("/ms/monitor/zookeeper/test").data(config).then(r => unwrap<ZookeeperTestResult>(r));

/**
 * 获取 ZooKeeper 节点树
 * @param datasourceId 数据源 ID（可选）
 * @param path 节点路径
 */
export const fetchZkTree = (datasourceId?: number, path = "/") =>
  http().get("/ms/monitor/zookeeper/tree").query({ datasourceId, path }).then(r => unwrap<ZkNode[]>(r));

/**
 * 获取 ZooKeeper 节点详情
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchZkNodeDetail = (path: string, datasourceId?: number) =>
  http().get("/ms/monitor/zookeeper/node").query({ path, datasourceId }).then(r => unwrap<ZkNodeDetail>(r));

/**
 * 获取 ZooKeeper 子节点列表
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchZkChildren = (path: string, datasourceId?: number) =>
  http().get("/ms/monitor/zookeeper/children").query({ path, datasourceId }).then(r => unwrap<ZkChildNode[]>(r));

/**
 * 创建 ZooKeeper 节点
 * @param request 节点请求
 * @param datasourceId 数据源 ID
 */
export const createZkNode = (request: { path: string; data?: string; ephemeral?: boolean; datasourceId?: number }) =>
  http().post("/ms/monitor/zookeeper/node").data(request).then(r => unwrap<boolean>(r));

/**
 * 更新 ZooKeeper 节点数据
 * @param request 节点请求
 * @param datasourceId 数据源 ID
 */
export const updateZkNode = (request: { path: string; data: string; datasourceId?: number }) =>
  http().put("/ms/monitor/zookeeper/node").data(request).then(r => unwrap<boolean>(r));

/**
 * 删除 ZooKeeper 节点
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 */
export const deleteZkNode = (path: string, datasourceId?: number) =>
  http().delete("/ms/monitor/zookeeper/node").query({ path, datasourceId }).then(r => unwrap<boolean>(r));

// ==================== 表结构提供者（监控侧） ====================

/**
 * 每个数据源在浏览时会话内选定的库。
 *
 * <p>列元数据接口需要 database 参数，而「浏览表结构」只携带数据源 ID，
 * 因此先由表清单流程选定并缓存，列查询复用同一库。</p>
 */
const schemaDatabaseCache = new Map<number, string>();

/** 系统库：仅当数据源自身未登记库名时才跳过 */
const SYSTEM_DATABASES = new Set([
  "information_schema",
  "performance_schema",
  "mysql",
  "sys",
  "pg_catalog",
]);

/**
 * 数据源在「浏览/选表」时会话内命中的库名。
 *
 * <p>表清单由候选库逐个试出，命中库已写进 {@link schemaDatabaseCache}。
 * 同步任务保存/预览时目标表要拼成「库.表」，否则后端按连接默认 catalog 查列，
 * 会出现「页面选得到表、后台报 Table '<默认库>.<表>' doesn't exist」。</p>
 *
 * @param datasourceId 数据源 ID
 * @returns 命中的库名；尚未选过表/无库概念时 undefined
 */
export function getDatasourceDatabase(datasourceId: number): string | undefined {
  return schemaDatabaseCache.get(datasourceId);
}

/**
 * 候选库顺序：优先数据源登记的库名，其次首个非系统库，最后其余库。
 *
 * <p>系统库（如 mysql）在部分服务端不可枚举表，故登记库取不到表时按此顺序回退。</p>
 *
 * @param meta      数据源台账，可能为 null
 * @param databases 服务端返回的库列表
 * @return 去重后的候选库（最多 3 个，避免逐库试错拖慢弹窗）
 */
function pickDatabaseCandidates(meta: DataSourceInfo | null, databases: string[]): string[] {
  const ordered: string[] = [];
  const push = (name: string | undefined) => {
    if (name && databases.includes(name) && !ordered.includes(name)) {
      ordered.push(name);
    }
  };
  const configured = typeof meta?.database === "string" ? meta.database.trim() : "";
  push(configured);
  push(databases.find(name => !SYSTEM_DATABASES.has(name.toLowerCase())));
  databases.forEach(name => push(name));
  // 文件库（SQLite）没有「库」概念，服务端返回 []：兜一个空串候选，
  // 走「默认库」链路（fetchDbTables(id, ""))拉表，弹窗才不至于空手而归
  if (!ordered.length) {
    ordered.push("");
  }
  return ordered.slice(0, 3);
}

/**
 * 遍历候选库，找到「有表」的那个库及其表清单。
 *
 * <p>候选库顺序见 {@link pickDatabaseCandidates}：登记库优先，其次首个非系统库，
 * 最后其余库。命中即返回，命中库会写进 {@link schemaDatabaseCache} 供列查询复用。</p>
 *
 * @param id 数据源 ID
 * @returns 命中的库名与表清单；所有候选库都取不到表时返回 null
 */
async function resolveMonitorTables(
  id: number,
): Promise<{ database: string; tables: DbTableInfo[] } | null> {
  const [meta, databases] = await Promise.all([
    fetchDataSource(id).catch(() => null),
    fetchDbDatabases(id).catch(() => [] as string[]),
  ]);
  const candidates = pickDatabaseCandidates(meta, databases ?? []);
  for (const database of candidates) {
    const tables = await fetchDbTables(id, database).catch(() => []);
    if (tables && tables.length > 0) {
      return { database, tables };
    }
  }
  return null;
}

/**
 * 同步任务表清单：遍历数据源下所有库，返回带库前缀的限定表名（{@code 库.表}）。
 *
 * <p>同步任务的预览/保存需要把表名连同真实库一起交给后端，否则后端按连接默认
 * catalog 查列会出现「页面选得到表、后台报 Table '<默认库>.<表>' doesn't exist」。
 * 源/目标下拉直接使用本函数的结果，value 即 {@code jdbc_acc.__e...}、{@code ngxacc.device_channel}；
 * 因此同一数据源下多库的表都能被选中，而不是只列出“命中的第一个库”。</p>
 *
 * <p>列查询复用 {@link schemaDatabaseCache} 时，这里约定最后设置第一个有表的候选库，
 * 仅供“裸表名手输”场景兜底；下拉选中值本身已含库前缀，不依赖该缓存。</p>
 *
 * @param datasourceId 数据源 ID
 * @returns 限定表名列表（无库概念时裸表名）
 */
export async function fetchMonitorTablesQualified(datasourceId: number | string): Promise<string[]> {
  const id = Number(datasourceId);
  if (!Number.isFinite(id) || id <= 0) {
    const infos = (await hubSchemaProvider.fetchTableInfos?.(datasourceId)) ?? [];
    return infos.map(info => info.name);
  }
  const [meta, databases] = await Promise.all([
    fetchDataSource(id).catch(() => null),
    fetchDbDatabases(id).catch(() => [] as string[]),
  ]);
  const candidates = pickDatabaseCandidates(meta, databases ?? []);
  const result: string[] = [];
  let firstHitDatabase = "";
  for (const database of candidates) {
    const tables = await fetchDbTables(id, database).catch(() => [] as DbTableInfo[]);
    if (tables && tables.length > 0) {
      if (!firstHitDatabase) {
        firstHitDatabase = database;
        schemaDatabaseCache.set(id, database);
      }
      if (database) {
        result.push(...tables.map(table => `${database}.${table.name}`));
      } else {
        result.push(...tables.map(table => table.name));
      }
    }
  }
  if (!firstHitDatabase) {
    schemaDatabaseCache.delete(id);
  }
  return result;
}

/**
 * 把「浏览表结构」切到监控侧实现（{@code /ms/monitor/db/*}）。
 *
 * <p>本模块的接口本就落在监控后端前缀下，宿主用到本模块即意味着「浏览表结构」
 * 也该走这里。导入时自动执行一次，宿主无须在 main.ts 里手写注册调用。</p>
 */
export function registerMonitorSchemaProvider(): void {
  async function monitorTables(id: number): Promise<string[]> {
    const hit = await resolveMonitorTables(id);
    if (hit) {
      schemaDatabaseCache.set(id, hit.database);
      return hit.tables.map(table => table.name);
    }
    schemaDatabaseCache.delete(id);
    return [];
  }

  setDatasourceSchemaProvider({
    async fetchTables(datasource) {
      const id = Number(datasource);
      if (!Number.isFinite(id) || id <= 0) {
        // 采集侧默认目标库是 app/空串，不属于数据库控制台的数字数据源 ID，
        // 应回落到数据源中心默认实现，否则目标表下拉永远拿不到应用主库的表。
        return hubSchemaProvider.fetchTables(datasource);
      }
      return monitorTables(id);
    },

    async fetchTableInfos(datasource) {
      const id = Number(datasource);
      if (!Number.isFinite(id) || id <= 0) {
        return (await hubSchemaProvider.fetchTableInfos?.(datasource)) ?? [];
      }
      const names = await monitorTables(id);
      return names.map(name => ({ name, comment: null, type: null }));
    },

    async fetchColumns(datasource, table) {
      const id = Number(datasource);
      if (!Number.isFinite(id) || id <= 0) {
        return hubSchemaProvider.fetchColumns(datasource, table);
      }
      const columns = await fetchTableColumns(table, id, schemaDatabaseCache.get(id));
      return (columns ?? []).map(
        (column): CollectColumn => ({
          name: column.name,
          label: column.remark ?? null,
          position: column.position ?? null,
          typeName: column.type ?? null,
          size: column.size ?? null,
          nullable: column.nullable ?? null,
          primaryKey: column.isPrimaryKey ?? null,
        }),
      );
    },
  });
}

registerMonitorSchemaProvider();
