/**
 * 列类型知识：类型分组 + 长度 / 小数位 / UNSIGNED 的适用范围。
 *
 * <p>三处要用**同一份**：设计视图的列网格、新增/修改列对话框、新建表（设计表）对话框。
 * 此前它们各存一份，改类型表只改到其中一处，就会出现「下拉里有、提交被后端拒」
 * 或「列表里没有、但库里有该类型」这类对不上的现象。</p>
 *
 * <p>权威口径在后端 {@code DbColumnDef.SUPPORTED_TYPES / SIZE_REQUIRED / SCALE_ALLOWED /
 * UNSIGNED_ALLOWED}，这里是它的前端镜像：**两边要同步改**。镜像的作用是让界面提前
 * 置灰/隐藏，而不是让后端少校验一层 —— 后端构造 {@code DbColumnDef} 时仍然全量校验。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */

/** 列类型分组（按类别分组只为下拉可读，不是分批请求）。 */
export const COLUMN_TYPE_GROUPS: Array<{ label: string; types: string[] }> = [
  { label: "整数", types: ["TINYINT", "SMALLINT", "MEDIUMINT", "INT", "INTEGER", "BIGINT"] },
  { label: "布尔 / 位", types: ["BIT", "BOOL", "BOOLEAN"] },
  { label: "定点 / 浮点", types: ["DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL", "DOUBLE PRECISION"] },
  { label: "字符", types: ["CHAR", "VARCHAR", "TINYTEXT", "TEXT", "MEDIUMTEXT", "LONGTEXT"] },
  { label: "二进制", types: ["BINARY", "VARBINARY", "TINYBLOB", "BLOB", "MEDIUMBLOB", "LONGBLOB"] },
  { label: "日期时间", types: ["DATE", "TIME", "DATETIME", "TIMESTAMP", "YEAR"] },
  { label: "枚举 / 集合", types: ["ENUM", "SET"] },
  { label: "JSON", types: ["JSON"] },
  // ClickHouse 原生类型：与后端 DbColumnDef.SUPPORTED_TYPES 一一对应。
  // 其它内核不认这些类型（由内核报「类型不存在」），这里用分组标题标出来源，
  // 避免用户以为 VARCHAR 和 STRING 在所有库上都通用。
  {
    label: "ClickHouse",
    types: [
      "STRING", "FIXEDSTRING",
      "UINT8", "UINT16", "UINT32", "UINT64",
      "INT8", "INT16", "INT32", "INT64",
      "FLOAT32", "FLOAT64",
      "DATE32", "DATETIME64",
      "UUID", "IPV4", "IPV6",
    ],
  },
];

/**
 * 需要长度输入的类型（镜像后端 SIZE_REQUIRED）。
 *
 * <p>FIXEDSTRING 是 ClickHouse 的定长字符串，长度必填（{@code FixedString(N)}）。</p>
 */
export const SIZE_REQUIRED = new Set([
  "CHAR", "VARCHAR", "BINARY", "VARBINARY", "DECIMAL", "NUMERIC", "FIXEDSTRING",
]);

/** 允许小数位的类型（镜像后端 SCALE_ALLOWED）。 */
export const SCALE_ALLOWED = new Set(["DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL"]);

/** 允许 UNSIGNED 的类型（镜像后端 UNSIGNED_ALLOWED，用于置灰而不是让用户试错）。 */
export const UNSIGNED_ALLOWED = new Set([
  "TINYINT", "SMALLINT", "MEDIUMINT", "INT", "INTEGER", "BIGINT",
  "DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL", "DOUBLE PRECISION", "BIT", "YEAR",
]);

/** ENUM / SET：除了类型本身还要给取值列表，否则后端构造期就拒绝。 */
export const ENUM_LIKE_TYPES = new Set(["ENUM", "SET"]);

/** 日期时间类型（用于默认值建议分组） */
export const DATE_TIME_TYPES = new Set(["DATE", "TIME", "DATETIME", "TIMESTAMP", "YEAR"]);

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
 * 类型下拉的分组项。
 *
 * <p>ReSelect 用 `group` 字段做分组标题（不是 el-option-group）。
 * 做成函数而不是常量：调用方可能往 {@link COLUMN_TYPE_GROUPS} 里补「其他」分组
 * （遇到后端类型表以外的类型时），常量快照看不到补进去的项。</p>
 *
 * @returns 分组下拉项
 */
export const columnTypeSelectOptions = () =>
  COLUMN_TYPE_GROUPS.flatMap(g => g.types.map(t => ({ label: t, value: t, group: g.label })));
