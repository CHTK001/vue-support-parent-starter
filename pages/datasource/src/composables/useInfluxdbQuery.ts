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
 * <p>v2 控制台查询语言是 Flux（{@code POST /api/v2/query}），v3 是 SQL
 * （{@code POST /api/v3/query_sql}），执行统一经 {@code executeInfluxdbQuery}
 * 按版本分发。本 composable 把三件事收口，供控制台各功能复用：</p>
 * <ul>
 *   <li>语句生成：查询页签缺省语句、数据浏览语句（按版本生成 SQL/Flux）；</li>
 *   <li>执行：带数据源与当前库执行查询，并把嵌套行转成可直读文本；</li>
 *   <li>结果推导：由返回行的键推导表格列、收集 field 选项，
 *       以及按 information_schema 解析度量的字段列（v3 编辑器补全用）。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.42
 */
export function useInfluxdbQuery(options: {
  datasourceId: Ref<number | undefined>;
  isV3: Ref<boolean>;
  activeBucket: Ref<string>;
  measurements: Ref<InfluxdbMeasurement[]>;
}) {
  const { datasourceId, isV3, activeBucket, measurements } = options;

  /**
   * 执行查询并返回行数据与耗时/截断信息（v2 走 Flux，v3 走 SQL）
   * @param statement 查询语句
   * @returns 行数据与元信息
   */
  async function runQuery(statement: string): Promise<InfluxdbQueryResult> {
    const result = await executeInfluxdbQuery(statement, datasourceId.value, isV3.value ? activeBucket.value : undefined);
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
   * @returns 缺省查询语句；v3 且当前库尚无度量时返回空串
   */
  function buildDefaultStatement(): string {
    if (!activeBucket.value) return "";
    if (isV3.value) {
      const table = measurements.value[0]?.name;
      return table ? `SELECT * FROM "${table.replace(/"/g, '""')}" ORDER BY time DESC LIMIT 50` : "";
    }
    return `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n  |> limit(n: 50)`;
  }

  /**
   * 数据浏览查询语句（v3 生成 SQL，v2 生成 Flux）
   * @param measurement 度量名
   * @param range 时间范围（如 {@code -1h} / {@code -7d}）
   * @param field 字段过滤（可选）
   * @returns 查询语句
   */
  function buildBrowserStatement(measurement: string, range: string, field?: string): string {
    if (isV3.value) {
      const table = measurement.replace(/"/g, '""');
      const m = /^(\d+)([hd])$/.exec(range.replace(/^-/, ""));
      const unit = m?.[2] === "d" ? "DAY" : "HOUR";
      const amount = m?.[1] ?? "1";
      let statement = `SELECT * FROM "${table}" WHERE time >= now() - INTERVAL '${amount}' ${unit}`;
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
   * 由查询结果收集 field 选项：v2 取行里的 {@code _field}；v3 的字段即结果列（排除 time）
   * @param rows 查询返回的行
   * @returns field 选项列表
   */
  function deriveFieldOptions(rows: Record<string, unknown>[]): string[] {
    const fields = new Set<string>();
    if (isV3.value) {
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
