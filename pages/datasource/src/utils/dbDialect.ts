/**
 * 数据库方言识别：一处判断，面板与设计表共用。
 *
 * <p>为什么要单独抽出来：服务器指标面板要知道「这个数据源有没有服务器进程」，
 * 设计表的类型下拉要知道「这个内核认哪些类型」。两处若各写一份判断，
 * 迟早出现「面板说是 ClickHouse、设计表却按 MySQL 给类型」这种自相矛盾。</p>
 *
 * <p>判断顺序是「类型键 → URL 前缀 → 驱动类名」：类型键最权威（台账里存的就是它），
 * URL 前缀能区分同为 {@code jdbc} 的不同内核，驱动类名兜住文件库 ——
 * SQLite / H2 / DuckDB 在台账里存的是文件路径，没有 {@code jdbc:} 前缀。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */

/** 方言键；未知统一为 other */
export type DbDialect =
  | "mysql"
  | "postgresql"
  | "clickhouse"
  | "oracle"
  | "sqlserver"
  | "sqlite"
  | "h2"
  | "duckdb"
  | "other";

/** 识别方言所需的三个线索（缺哪个都能降级判断） */
export interface DialectSource {
  /** 数据源类型键：jdbc / clickhouse / duckdb / redis … */
  type?: string | null;
  /** 台账的 database 字段：可能是完整 JDBC URL，也可能是库名或文件路径 */
  url?: string | null;
  /** 驱动类名，如 org.sqlite.JDBC */
  driverClassName?: string | null;
}

/** 有独立服务进程、能取服务器侧指标的方言 */
export const SERVER_DIALECTS: ReadonlySet<DbDialect> = new Set<DbDialect>([
  "mysql", "postgresql", "clickhouse", "oracle", "sqlserver",
]);

/** 文件型 / 嵌入式：没有服务器进程，「服务器指标」这一说本就不成立 */
export const EMBEDDED_DIALECTS: ReadonlySet<DbDialect> = new Set<DbDialect>([
  "sqlite", "h2", "duckdb",
]);

/** 方言显示名（标签、说明文案共用） */
export const DIALECT_LABEL: Record<string, string> = {
  mysql: "MySQL / MariaDB",
  postgresql: "PostgreSQL",
  clickhouse: "ClickHouse",
  oracle: "Oracle",
  sqlserver: "SQL Server",
  sqlite: "SQLite",
  h2: "H2",
  duckdb: "DuckDB",
};

/**
 * 识别方言。
 *
 * @param source 类型键 / URL / 驱动类名
 * @returns 方言键
 */
export function detectDialect(source: DialectSource): DbDialect {
  const type = (source.type || "").toLowerCase();
  if (type === "clickhouse") return "clickhouse";
  if (type === "duckdb") return "duckdb";
  if (type !== "jdbc") return "other";

  const url = (source.url || "").trim().toLowerCase();
  const driver = (source.driverClassName || "").toLowerCase();

  if (url.startsWith("jdbc:postgresql:") || driver.includes("postgres")) return "postgresql";
  if (url.startsWith("jdbc:oracle:") || driver.includes("oracle")) return "oracle";
  if (url.startsWith("jdbc:sqlserver:") || driver.includes("sqlserver") || driver.includes("mssql")) return "sqlserver";
  // 文件型库：台账里存文件路径，只能靠驱动类名认
  if (url.startsWith("jdbc:sqlite:") || driver.includes("sqlite")) return "sqlite";
  if (url.startsWith("jdbc:h2:") || driver.includes("org.h2")) return "h2";
  if (url.startsWith("jdbc:duckdb:") || driver.includes("duckdb")) return "duckdb";
  if (url.startsWith("jdbc:clickhouse:") || driver.includes("clickhouse")) return "clickhouse";
  if (url.startsWith("jdbc:mysql:") || url.startsWith("jdbc:mariadb:")
    || driver.includes("mysql") || driver.includes("mariadb")) return "mysql";
  // 台账只存主机/端口/库名时，后端统一按 jdbc:mysql 拼串
  return "mysql";
}

/**
 * 该方言是否有服务器侧指标。
 *
 * @param dialect 方言
 * @returns true=有
 */
export const isServerDialect = (dialect: DbDialect): boolean => SERVER_DIALECTS.has(dialect);

/**
 * 该方言是否为文件型 / 嵌入式库。
 *
 * @param dialect 方言
 * @returns true=是
 */
export const isEmbeddedDialect = (dialect: DbDialect): boolean => EMBEDDED_DIALECTS.has(dialect);
