/**
 * 列类型知识：方言 → 类型分组，以及长度 / 小数位 / UNSIGNED 的适用范围。
 *
 * <p>三处要用**同一份**：设计视图的列网格、新增/修改列对话框、新建表（设计表）对话框。
 * 此前它们各存一份，改类型表只改到其中一处，就会出现「下拉里有、提交被后端拒」
 * 或「列表里没有、但库里有该类型」这类对不上的现象。</p>
 *
 * <p>权威口径在后端 {@code DbColumnDef.SUPPORTED_TYPES / SIZE_REQUIRED / SCALE_ALLOWED /
 * UNSIGNED_ALLOWED}，这里是它的前端镜像：**两边要同步改**。镜像的作用是让界面提前
 * 置灰/隐藏，而不是让后端少校验一层 —— 后端构造 {@code DbColumnDef} 时仍然全量校验。</p>
 *
 * <p><b>为什么按方言分组</b>：同一列下拉里同时出现 {@code VARCHAR2}（Oracle）和
 * {@code NVARCHAR}（SQL Server）时，用户无法判断哪个是自己的库认的，只能靠「选一个试试」。
 * 按当前数据源的方言过滤后，下拉里出现的每一项都是该内核真正接受的类型。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */

import type { DbDialect } from "./dbDialect";

/** 列类型分组（按类别分组只为下拉可读，不是分批请求）。 */
export type ColumnTypeGroup = { label: string; types: string[] };

/**
 * MySQL / MariaDB 的类型分组。
 *
 * <p>这也是「不知道方言」时的兜底：本仓最早只支持 MySQL，历史数据源多半是它。</p>
 */
const MYSQL_GROUPS: ColumnTypeGroup[] = [
  { label: "整数", types: ["TINYINT", "SMALLINT", "MEDIUMINT", "INT", "INTEGER", "BIGINT"] },
  { label: "布尔 / 位", types: ["BIT", "BOOL", "BOOLEAN"] },
  { label: "定点 / 浮点", types: ["DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL", "DOUBLE PRECISION"] },
  { label: "字符", types: ["CHAR", "VARCHAR", "TINYTEXT", "TEXT", "MEDIUMTEXT", "LONGTEXT"] },
  { label: "二进制", types: ["BINARY", "VARBINARY", "TINYBLOB", "BLOB", "MEDIUMBLOB", "LONGBLOB"] },
  { label: "日期时间", types: ["DATE", "TIME", "DATETIME", "TIMESTAMP", "YEAR"] },
  { label: "枚举 / 集合", types: ["ENUM", "SET"] },
  { label: "JSON", types: ["JSON"] },
  // MySQL 9 起提供原生向量列，维度必填（VECTOR(1536)）
  { label: "向量", types: ["VECTOR"] },
];

/** PostgreSQL（含 pgvector 扩展） */
const POSTGRESQL_GROUPS: ColumnTypeGroup[] = [
  { label: "整数", types: ["SMALLINT", "INTEGER", "BIGINT"] },
  { label: "布尔", types: ["BOOLEAN"] },
  { label: "定点 / 浮点", types: ["NUMERIC", "DECIMAL", "REAL", "DOUBLE PRECISION"] },
  { label: "字符", types: ["CHAR", "VARCHAR", "TEXT"] },
  { label: "二进制", types: ["BYTEA"] },
  { label: "日期时间", types: ["DATE", "TIME", "TIMESTAMP", "TIMESTAMPTZ", "INTERVAL"] },
  { label: "JSON", types: ["JSON", "JSONB"] },
  { label: "标识 / 其它", types: ["UUID"] },
  // pgvector：vector(n) 的维度必填
  { label: "向量（pgvector）", types: ["VECTOR"] },
];

/** Oracle */
const ORACLE_GROUPS: ColumnTypeGroup[] = [
  { label: "数值", types: ["NUMBER", "INTEGER", "FLOAT", "BINARY_FLOAT", "BINARY_DOUBLE"] },
  { label: "字符", types: ["CHAR", "NCHAR", "VARCHAR2", "NVARCHAR2", "CLOB", "NCLOB"] },
  { label: "二进制", types: ["RAW", "BLOB"] },
  { label: "日期时间", types: ["DATE", "TIMESTAMP"] },
];

/** SQL Server */
const SQLSERVER_GROUPS: ColumnTypeGroup[] = [
  { label: "整数", types: ["TINYINT", "SMALLINT", "INT", "BIGINT"] },
  { label: "布尔 / 位", types: ["BIT"] },
  { label: "定点 / 浮点", types: ["DECIMAL", "NUMERIC", "FLOAT", "REAL", "MONEY", "SMALLMONEY"] },
  { label: "字符", types: ["CHAR", "VARCHAR", "NCHAR", "NVARCHAR", "TEXT", "NTEXT"] },
  { label: "二进制", types: ["BINARY", "VARBINARY", "IMAGE"] },
  {
    label: "日期时间",
    types: ["DATE", "TIME", "DATETIME", "DATETIME2", "SMALLDATETIME", "DATETIMEOFFSET"],
  },
  { label: "其它", types: ["UNIQUEIDENTIFIER", "XML"] },
];

/** SQLite：动态类型，只有 5 个存储类，长度/小数位不生效 */
const SQLITE_GROUPS: ColumnTypeGroup[] = [
  { label: "存储类", types: ["INTEGER", "REAL", "TEXT", "BLOB", "NUMERIC"] },
];

/** DuckDB */
const DUCKDB_GROUPS: ColumnTypeGroup[] = [
  {
    label: "整数",
    types: ["TINYINT", "SMALLINT", "INTEGER", "BIGINT", "HUGEINT",
      "UTINYINT", "USMALLINT", "UINTEGER", "UBIGINT"],
  },
  { label: "布尔", types: ["BOOLEAN"] },
  { label: "定点 / 浮点", types: ["DECIMAL", "REAL", "DOUBLE"] },
  { label: "字符", types: ["VARCHAR", "TEXT"] },
  { label: "二进制", types: ["BLOB"] },
  { label: "日期时间", types: ["DATE", "TIME", "TIMESTAMP", "TIMESTAMPTZ", "INTERVAL"] },
  { label: "JSON / 标识", types: ["JSON", "UUID"] },
];

/** H2 */
const H2_GROUPS: ColumnTypeGroup[] = [
  { label: "整数", types: ["TINYINT", "SMALLINT", "INT", "BIGINT"] },
  { label: "布尔 / 位", types: ["BOOLEAN", "BIT"] },
  { label: "定点 / 浮点", types: ["DECIMAL", "NUMERIC", "REAL", "DOUBLE"] },
  { label: "字符", types: ["CHAR", "VARCHAR", "CLOB", "TEXT"] },
  { label: "二进制", types: ["BINARY", "VARBINARY", "BLOB"] },
  { label: "日期时间", types: ["DATE", "TIME", "TIMESTAMP"] },
  { label: "JSON / 标识", types: ["JSON", "UUID"] },
];

/**
 * ClickHouse 原生类型：与后端 DbColumnDef.SUPPORTED_TYPES 一一对应。
 *
 * <p>其它内核不认这些类型（由内核报「类型不存在」），这里用分组标题标出来源，
 * 避免用户以为 VARCHAR 和 STRING 在所有库上都通用。</p>
 */
const CLICKHOUSE_GROUPS: ColumnTypeGroup[] = [
  { label: "整数", types: ["INT8", "INT16", "INT32", "INT64", "UINT8", "UINT16", "UINT32", "UINT64"] },
  { label: "浮点", types: ["FLOAT32", "FLOAT64"] },
  { label: "字符", types: ["STRING", "FIXEDSTRING"] },
  { label: "日期时间", types: ["DATE", "DATE32", "DATETIME", "DATETIME64"] },
  { label: "标识 / 网络", types: ["UUID", "IPV4", "IPV6"] },
];

/** 方言 → 类型分组表 */
const GROUPS_BY_DIALECT: Record<string, ColumnTypeGroup[]> = {
  mysql: MYSQL_GROUPS,
  postgresql: POSTGRESQL_GROUPS,
  oracle: ORACLE_GROUPS,
  sqlserver: SQLSERVER_GROUPS,
  sqlite: SQLITE_GROUPS,
  duckdb: DUCKDB_GROUPS,
  h2: H2_GROUPS,
  clickhouse: CLICKHOUSE_GROUPS,
};

/**
 * 按方言取类型分组。
 *
 * <p>未知方言回落到 MySQL：本仓历史上只支持 MySQL，旧数据源多半是它；
 * 而且 MySQL 的类型集是各内核重合度最高的一份，选错时内核会明确报「类型不存在」。</p>
 *
 * @param dialect 方言键（来自 {@link import("./dbDialect").detectDialect}）
 * @returns 分组表
 */
export const columnTypeGroupsFor = (dialect?: DbDialect | string | null): ColumnTypeGroup[] =>
  GROUPS_BY_DIALECT[(dialect ?? "").toLowerCase()] ?? MYSQL_GROUPS;

/** MySQL 分组（默认口径，供不关心方言的旧调用方使用）。 */
export const COLUMN_TYPE_GROUPS: ColumnTypeGroup[] = MYSQL_GROUPS;

/**
 * 所有方言的类型并集。
 *
 * <p>用途：设计网格把内核返回的类型名归一化时，若当前方言的表里没有、但别的方言有，
 * 说明这是真实存在的类型（例如切库前遗留、或驱动上报了别名），应当原样保留，
 * 而不是兜底成 VARCHAR 把列类型改错。</p>
 */
export const ALL_COLUMN_TYPES: ReadonlySet<string> = new Set(
  Object.values(GROUPS_BY_DIALECT).flatMap(groups => groups.flatMap(g => g.types)),
);

/**
 * 需要长度输入的类型（镜像后端 SIZE_REQUIRED）。
 *
 * <p>FIXEDSTRING 是 ClickHouse 的定长字符串；VECTOR 的「长度」是向量维度；
 * VARCHAR2 / NVARCHAR2 / NCHAR / RAW 是 Oracle 与 SQL Server 的写法。</p>
 */
export const SIZE_REQUIRED = new Set([
  "CHAR", "VARCHAR", "BINARY", "VARBINARY", "DECIMAL", "NUMERIC", "FIXEDSTRING",
  "VARCHAR2", "NVARCHAR2", "NCHAR", "NVARCHAR", "RAW", "VECTOR",
]);

/** 允许小数位的类型（镜像后端 SCALE_ALLOWED）。 */
export const SCALE_ALLOWED = new Set(["DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL", "NUMBER"]);

/** 允许 UNSIGNED 的类型（镜像后端 UNSIGNED_ALLOWED，用于置灰而不是让用户试错）。 */
export const UNSIGNED_ALLOWED = new Set([
  "TINYINT", "SMALLINT", "MEDIUMINT", "INT", "INTEGER", "BIGINT",
  "DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL", "DOUBLE PRECISION", "BIT", "YEAR",
]);

/** ENUM / SET：除了类型本身还要给取值列表，否则后端构造期就拒绝。 */
export const ENUM_LIKE_TYPES = new Set(["ENUM", "SET"]);

/** 日期时间类型（用于默认值建议分组） */
export const DATE_TIME_TYPES = new Set(["DATE", "TIME", "DATETIME", "TIMESTAMP", "YEAR"]);

/** 向量类型：长度是维度，界面上要把「长度」提示成「维度」 */
export const VECTOR_TYPES = new Set(["VECTOR"]);

/**
 * 默认值建议项（按类型分组）。
 *
 * <p>「默认值」列从自由输入升级为自动补全：给常用 SQL 默认值做成分组建议，
 * 日期时间类型额外给 CURRENT_TIMESTAMP 全家 —— 表设计时最常写错的正是日期默认值
 * （忘记加括号、写死时间戳），这里直接点选。</p>
 *
 * @param type 列类型（决定是否给日期分组）
 * @return 分组建议项（ReSelect 的 group 字段做分组标题）
 */
export const columnDefaultOptions = (type: string): Array<{ label: string; value: string; group: string }> => {
  const isDate = DATE_TIME_TYPES.has(type);
  const groups: Array<{ label: string; items: string[] }> = [];
  if (isDate) {
    groups.push(
      { label: "日期时间", items: ["CURRENT_TIMESTAMP", "CURRENT_DATE", "CURRENT_TIME", "NOW()", "LOCALTIME", "LOCALTIMESTAMP", "SYSDATE()", "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"] },
    );
  }
  groups.push(
    { label: "常用", items: isDate ? ["NULL", "CURRENT_USER()"] : ["NULL", "0", "1", "CURRENT_USER()", "UUID()"] },
  );
  return groups.flatMap(g => g.items.map(v => ({ label: v, value: v, group: g.label })));
};

/**
 * 该类型是否需要长度输入。
 *
 * @param type 类型名
 * @return true=需要
 */
export const typeNeedsSize = (type: string): boolean => SIZE_REQUIRED.has(type);

/**
 * 该类型是否允许小数位。
 *
 * @param type 类型名
 * @return true=允许
 */
export const typeAllowsScale = (type: string): boolean => SCALE_ALLOWED.has(type);

/**
 * 该类型是否允许 UNSIGNED。
 *
 * @param type 类型名
 * @return true=允许
 */
export const typeAllowsUnsigned = (type: string): boolean => UNSIGNED_ALLOWED.has(type);

/**
 * 显示类型时**只带一个长度**的类型。
 *
 * <p>括号里的数就是 DDL 里的声明长度：{@code VARCHAR(255)}、{@code BINARY(16)}、
 * ClickHouse 的 {@code FixedString(8)}、MySQL 9 的向量维度 {@code VECTOR(1536)}。</p>
 */
const DISPLAY_SIZE_ONLY = new Set([
  "CHAR", "VARCHAR", "BINARY", "VARBINARY", "FIXEDSTRING",
  "VARCHAR2", "NVARCHAR2", "NCHAR", "NVARCHAR", "RAW", "VECTOR",
]);

/** 显示类型时带**长度与小数位**的类型（定点数）。 */
const DISPLAY_SIZE_SCALE = new Set(["DECIMAL", "NUMERIC", "NUMBER"]);

/**
 * 表头 / 悬浮提示里显示的类型文本（带长度、精度）。
 *
 * <p><b>不能一律把 size 拼上去</b>：元数据里的 {@code size} 有两种口径 ——
 * 字符 / 二进制类型是声明长度（{@code VARCHAR(255)} 的 255），而整数与日期时间拿到的是
 * JDBC 的**显示宽度**（实测 INT=10、BIGINT=19、TIMESTAMP=19、DOUBLE=22）。
 * 拼成 {@code INT(10)}、{@code TIMESTAMP(19)} 是假信息：它既不是 DDL 里的写法，
 * 也不代表精度。所以只对「声明里真有括号」的类型拼接，其余保持裸类型名。</p>
 *
 * @param type  元数据里的类型名（大小写不限）
 * @param size  声明长度 / 显示宽度
 * @param scale 小数位
 * @returns 展示文本；类型为空时返回空串
 */
export const formatColumnTypeLabel = (
  type?: string | null,
  size?: number | null,
  scale?: number | null,
): string => {
  const base = String(type ?? "").toUpperCase().trim();
  if (!base) return "";
  const len = typeof size === "number" && Number.isFinite(size) ? Math.trunc(size) : 0;
  if (len <= 0) return base;
  if (DISPLAY_SIZE_ONLY.has(base)) return `${base}(${len})`;
  if (DISPLAY_SIZE_SCALE.has(base)) {
    const digits = typeof scale === "number" && Number.isFinite(scale) && scale > 0 ? Math.trunc(scale) : 0;
    return digits > 0 ? `${base}(${len},${digits})` : `${base}(${len})`;
  }
  return base;
};

/**
 * 类型下拉的分组项。
 *
 * <p>ReSelect 用 `group` 字段做分组标题（不是 el-option-group）。
 * 做成函数而不是常量：调用方可能往分组里补「其他」分组
 * （遇到后端类型表以外的类型时），常量快照看不到补进去的项。</p>
 *
 * @param dialect 方言键；不传按 MySQL 处理
 * @returns 分组下拉项
 */
export const columnTypeSelectOptions = (dialect?: DbDialect | string | null) =>
  columnTypeGroupsFor(dialect).flatMap(g => g.types.map(t => ({ label: t, value: t, group: g.label })));
