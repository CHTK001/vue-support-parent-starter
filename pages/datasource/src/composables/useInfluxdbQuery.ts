import type { Ref } from "vue";
import { executeInfluxdbQuery, type InfluxdbMeasurement } from "../api/manageConsoles";

/** ReTable 列定义 */
export type Column = { prop: string; label: string; width?: number; minWidth?: number; slot?: string; fixed?: boolean | "left" | "right"; align?: "left" | "center" | "right"; formatter?: (row: any) => string };

/** 查询结果（行数据与耗时/截断信息） */
export interface InfluxdbQueryResult {
  rows: Record<string, unknown>[];
  elapsed: number;
  truncated: boolean;
  totalRows: number;
}

/**
 * InfluxDB 查询 composable：语句生成 + 执行 + 结果列推导。
 *
 * <p>服务端模型（v2 组织/桶、v3 数据库）与查询方言（Flux / SQL+InfluxQL）是
 * <b>两件事</b>：InfluxDB 2.x 的 Flux 是可选组件（{@code flux-enabled=false} 时
 * 只认 InfluxQL），所以「v2 实例 + SQL 方言」必须能用。因此这里同时接收
 * {@code useSql}（方言：决定生成哪种语句、结果怎么取列）；库/桶一律在执行时随请求
 * 带上，语句里不拼限定名（InfluxQL 的两段名是保留策略.度量，见 {@code sqlTable}）。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
export function useInfluxdbQuery(options: {
  datasourceId: Ref<number | undefined>;
  /** 查询方言是否为 SQL / InfluxQL */
  useSql: Ref<boolean>;
  activeBucket: Ref<string>;
  measurements: Ref<InfluxdbMeasurement[]>;
}) {
  const { datasourceId, useSql, activeBucket, measurements } = options;

  /**
   * SQL 模式下的表名。
   *
   * <p>只给度量名，<b>不要</b>拼「库.度量」：InfluxQL 的两段限定名是
   * {@code 保留策略.度量}（三段才是 {@code 库.保留策略.度量}），把库当第一段会报
   * {@code retention policy not found}。库/桶一律由执行时随请求带上
   * （v3 是 database，v2/v1 是 bucket/db 参数），语句里不需要也不该出现。</p>
   *
   * @param measurement 度量名
   * @returns 限定后的表名
   */
  function sqlTable(measurement: string): string {
    return `"${measurement.replace(/"/g, '""')}"`;
  }

  /**
   * 执行查询并返回行数据与耗时/截断信息
   *
   * <p>SQL 方言（无论 v2 还是 v3）都要把目标库/桶带上：v3 是 database，
   * v2 是 InfluxQL 缺省的 bucket——InfluxQL 语句里没有 {@code from(bucket:...)}
   * 可以兜底，不带就会落回服务端默认桶、查到空数据。</p>
   *
   * @param statement 查询语句
   * @returns 行数据与元信息
   */
  async function runQuery(statement: string): Promise<InfluxdbQueryResult> {
    const result = await executeInfluxdbQuery(
      statement,
      datasourceId.value,
      useSql.value ? activeBucket.value : undefined,
    );
    return {
      rows: displayRows(result?.rows || []),
      elapsed: result?.executionTimeMs ?? 0,
      truncated: !!result?.truncated,
      totalRows: result?.totalRows ?? (result?.rows?.length || 0),
    };
  }

  /**
   * 把行内嵌套结构转成 JSON 文本，避免表格里显示成 [object Object]
   * @param rows 查询返回的行
   * @returns 可直读的行
   */
  function displayRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return rows.map(row => {
      const flat: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        flat[key] = value !== null && typeof value === "object" ? JSON.stringify(value) : value;
      }
      return flat;
    });
  }

  /**
   * 查询页签的缺省语句：按当前选中的库生成
   * @returns 缺省查询语句；SQL 方言且当前库尚无度量时返回空串
   */
  function buildDefaultStatement(): string {
    if (!activeBucket.value) return "";
    if (useSql.value) {
      const table = measurements.value[0]?.name;
      return table ? `SELECT * FROM ${sqlTable(table)} ORDER BY time DESC LIMIT 50` : "";
    }
    return `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n  |> limit(n: 50)`;
  }

  /**
   * 数据浏览查询语句（SQL 方言生成 SQL/InfluxQL，Flux 方言生成 Flux）
   * @param measurement 度量名
   * @param range 时间范围（如 {@code -1h} / {@code -7d}）
   * @param field 字段过滤（可选）
   * @returns 查询语句
   */
  function buildBrowserStatement(measurement: string, range: string, field?: string): string {
    if (useSql.value) {
      const table = sqlTable(measurement);
      const m = /^(\d+)([hd])$/.exec(range.replace(/^-/, ""));
      const unit = m?.[2] === "d" ? "DAY" : "HOUR";
      const amount = m?.[1] ?? "1";
      let statement = `SELECT * FROM ${table} WHERE time >= now() - INTERVAL '${amount}' ${unit}`;
      if (field) {
        statement += ` AND "${field.replace(/"/g, '""')}" IS NOT NULL`;
      }
      return `${statement} ORDER BY time DESC LIMIT 500`;
    }
    let statement = `from(bucket: "${activeBucket.value}")\n  |> range(start: ${range})\n`
      + `  |> filter(fn: (r) => r._measurement == "${measurement}")`;
    if (field) {
      statement += `\n  |> filter(fn: (r) => r._field == "${field}")`;
    }
    return `${statement}\n  |> limit(n: 500)`;
  }

  /**
   * 由返回行的键推导表格列，避免写死后端字段
   * @param rows 查询返回的行
   * @returns 表格列定义
   */
  function deriveColumns(rows: Record<string, unknown>[]): Column[] {
    return (rows.length > 0 ? Object.keys(rows[0]) : []).map(key => ({ prop: key, label: key, minWidth: 140 }));
  }

  /**
   * 由查询结果收集 field 选项：Flux 取行里的 {@code _field}；
   * SQL / InfluxQL 的字段即结果列（排除 time 与 tag 列）
   * @param rows 查询返回的行
   * @returns field 选项列表
   */
  function deriveFieldOptions(rows: Record<string, unknown>[]): string[] {
    const fields = new Set<string>();
    if (useSql.value) {
      for (const key of Object.keys(rows[0] || {})) {
        if (key !== "time") fields.add(key);
      }
    } else {
      for (const row of rows) {
        const f = row._field;
        if (f != null) fields.add(String(f));
      }
    }
    return [...fields];
  }

  /**
   * v3 编辑器按需解析度量的字段列（information_schema.columns）
   * @param table 表（度量）名
   * @returns 列名
   */
  async function resolveSqlColumns(table: string): Promise<string[]> {
    try {
      const safe = table.replace(/'/g, "''");
      const { rows } = await runQuery(`SELECT column_name FROM information_schema.columns WHERE table_name = '${safe}'`);
      return rows.map(r => String(r.column_name ?? "")).filter(Boolean);
    } catch {
      return [];
    }
  }

  return {
    runQuery,
    buildDefaultStatement,
    buildBrowserStatement,
    deriveColumns,
    deriveFieldOptions,
    resolveSqlColumns,
  };
}
