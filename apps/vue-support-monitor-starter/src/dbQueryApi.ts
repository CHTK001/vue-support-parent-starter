import { http, unwrapResult } from "@repo/utils";

/** 与 dbManageApi 同款解包：把 ReturnResult 的 data 取出来 */
const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/**
 * 查询控制台专用 API（B4）。
 *
 * <p>与 {@code monitorApi.ts} 里那个 {@code executeDbSql} 分开放，原因是**响应形状不同**：
 * 单条执行的 {@code DbQueryResult} 形状被 6 个 UI 验收套件按
 * {@code data.columns} / {@code data.rows} 读着，不能改；
 * 而批量执行天然是多结果集（{@code results[]}），两者混在一个模块里
 * 会让人以为可以互相替换 —— 实测里它们确实不能。</p>
 *
 * <p>另外单条/批量两条路径必须共用同一份「查询类 vs 更新类」判定，
 * 否则同一条 {@code WITH ...} 在批量里会被当成更新语句、影响行数为 0。</p>
 */

/**
 * 单条语句的执行结果（与 {@code /db/execute} 的 data 同形）
 *
 * @author CH
 * @since 4.0.0.45
 */
export interface DbStatementResult {
  /** 结果集列名；更新语句为 null */
  columns?: string[];
  /** 结果集行数据 */
  rows?: Record<string, unknown>[];
  /** 结果集行数 */
  rowCount?: number;
  /** 是否因超过行数上限被截断 */
  truncated?: boolean;
  /** 更新语句受影响行数 */
  affectedRows?: number;
  /** 执行说明 / 失败原因 */
  message?: string;
}

/**
 * 批量执行结果
 *
 * @author CH
 * @since 4.0.0.45
 */
export interface DbBatchResult {
  /** 每条语句一条结果，顺序与脚本一致 */
  results?: DbStatementResult[];
  /** 实际执行的语句条数 */
  statementCount?: number;
  /** 首个失败语句的下标（从 0 开始）；全部成功为 -1 */
  failedIndex?: number;
  /** 首个失败语句原文 */
  failedSql?: string;
  /** 整体说明（含「第 N/M 条」这类可定位信息） */
  message?: string;
}

/**
 * 批量执行 SQL 脚本（逐条返回结果）
 *
 * <p>遇错默认停止；把 {@code stopOnError} 设为 false 则继续跑完，
 * 失败的那条也占一个条目并带上原因。</p>
 *
 * @param sql 脚本原文
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 * @param params {@code ${name}} 占位符取值（可选）
 * @param stopOnError 遇错是否停止（默认 true）
 * @returns 批量执行结果
 */
export const executeDbSqlBatch = (
  sql: string,
  datasourceId?: number,
  database?: string,
  params?: Record<string, string>,
  stopOnError?: boolean,
) =>
  http()
    .post("/ms/monitor/db/execute-batch")
    .noToast(true)
    .data({ sql, datasourceId, database, params, stopOnError })
    .then(r => unwrap<DbBatchResult>(r));

/**
 * 扫描 SQL 里的 {@code ${name}} 占位符。
 *
 * <p>不连库、也不执行，纯文本扫描 —— 编辑器每次改动都问一次后端，
 * 成本会体现在每次按键的延迟上，所以这个端点必须是纯扫描。</p>
 *
 * @param sql 待扫描 SQL
 * @returns 按出现顺序去重的变量名
 */
export const scanSqlParams = (sql: string) =>
  http()
    .post("/ms/monitor/db/scan-params")
    .noToast(true)
    .data({ sql })
    .then(r => unwrap<string[]>(r));