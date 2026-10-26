/**
 * 「走 JDBC 协议」的数据源类型判定。
 *
 * <p><strong>为什么单独成模块</strong>：数据库管理台（{@code /db-manager}）原先写的是
 * {@code list.filter(d => d.type === "jdbc")}。加上 ClickHouse / DuckDB 之后，
 * 这两个类型的建连、打开表、设计表、查询走的完全是同一套 JDBC 管线，
 * 却因为这一句过滤被挡在管理台之外 —— 表现是「数据源中心点打开管理，
 * 管理台里翻不到这个源，还静默回落到默认 MySQL 主数据源」。
 * 这正是加类型时最容易漏的一处，所以把判定收口到这里，
 * 与后端 {@code DatasourceHubConstants.isJdbcFamily} 保持同一口径。</p>
 *
 * <p>注意：{@code kafka} / {@code mongodb} 等类型虽然也可能有 JDBC 驱动，
 * 但它们各有独立管理页，不走这套元数据管线，不在此列。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */

/**
 * 走 JDBC 协议的类型集合（与后端 DS_JDBC_TYPES 一致）。
 */
export const JDBC_FAMILY_TYPES: readonly string[] = ["jdbc", "clickhouse", "duckdb"];

/**
 * 该类型是否走 JDBC 协议。
 *
 * @param type 类型标识，可为空
 * @returns 走 JDBC 返回 true
 */
export function isJdbcFamilyType(type?: string | null): boolean {
  if (!type) {
    return false;
  }
  return JDBC_FAMILY_TYPES.includes(type.trim().toLowerCase());
}

/**
 * 单文件库类型（连接串里带磁盘路径，没有主机与端口）。
 *
 * @param type 类型标识，可为空
 * @returns 文件库返回 true
 */
export function isFileJdbcType(type?: string | null): boolean {
  return !!type && type.trim().toLowerCase() === "duckdb";
}
