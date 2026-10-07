/** 建表 / 补列请求：只给列名与主键列名，列类型由数据源中心按运行期同一套规则补齐 */
export interface TableDdlRequest {
  /** 数据源引用（ID 或名称） */
  datasource: string;
  /** 目标表名 */
  table: string;
  /** 目标列名 */
  columns: string[];
  /** 主键列名 */
  primaryKey: string[];
}

/** 建表 / 补列结果（与数据源中心 TableDdlResult 对齐，SQL 已摊平成一段文本） */
export interface TableDdlResult {
  /** 将要执行 / 已执行的 SQL 文本 */
  sql: string;
  /** 执行前表是否已存在 */
  exists: boolean;
  /** 本次是否建了新表 */
  created: boolean;
  /** 本次补上的列 */
  appended: string[];
}
