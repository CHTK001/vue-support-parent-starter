import { http, unwrapResult } from "@repo/utils";
import type { DbColumnDef } from "./dbManageApi";

/**
 * 表结构版本管理（DDL 快照 / 回滚）专用 API。
 *
 * <p>与 {@code dbManageApi.ts} 并列：它负责表级增删改（列/索引/外键），
 * 它负责"这一张表现在长什么样 + 能不能退回到过去的样子"。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/**
 * 表结构版本管理（DDL 快照 / 回滚）专用 API。
 *
 * <p>与 {@code dbManageApi.ts} 并列：它负责表级增删改（列/索引/外键），
 * 它负责"这一张表现在长什么样 + 能不能退回到过去的样子"。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */

/** 拍结构快照的请求体；所有入参可空，name 为空则自动生成 */
export type DbSchemaSnapshotPayload = {
  /** 快照名/备注；不传递时后端生成「保存于 YYYY-MM-DD HH:mm」 */
  name?: string;
  /** 备注/说明 */
  remark?: string;
};

/**
 * 表结构快照列表项（对齐后端 {@code DbSchemaSnapshotVO}）。
 *
 * <p>DDL 正文不超过 160 字符，正文读回走 {@code takeSnapshotDetail}。</p>
 */
export interface DbSchemaSnapshotVO {
  /** 快照 ID */
  id?: number;
  /** 所属数据库 */
  database?: string;
  /** 所属表名 */
  tableName?: string;
  /** 快照名/标签 */
  name?: string;
  /** 创建人 */
  creator?: string;
  /** 创建时间（拍快照时刻） */
  createTime?: string;
  /** DDL 摘要（截断到 160 字符，由后端拼接） */
  ddlPreview?: string;
  /** 快照时的列数 */
  columns?: number;
  /** 快照时的索引数 */
  indexes?: number;
  /** 快照时的外键数 */
  foreignKeys?: number;
}

/** 快照详情：完整 DDL + 列/索引/外键原始 JSON */
export interface DbSnapshotDetailVO {
  /** 快照 ID */
  id?: number;
  /** 数据库 */
  database?: string;
  /** 表名 */
  tableName?: string;
  /** 快照名/标签 */
  name?: string;
  /** 创建人 */
  creator?: string;
  /** 创建时间 */
  createTime?: string;
  /** 完整 DDL 文本 */
  ddl?: string;
  /** 快照时的列原始 JSON */
  columns?: string;
  /** 快照时的索引原始 JSON */
  indexes?: string;
  /** 快照时的外键原始 JSON */
  foreignKeys?: string;
  /** 表选项原始 JSON */
  tableOptions?: string;
}

/** 回滚结果：总语句数/成功数/失败数/耗时/失败原因 */
export interface DbSchemaRollbackResultVO {
  /** 是否全部成功 */
  success?: boolean;
  /** 尝试执行的 DDL 总条数 */
  totalStatements?: number;
  /** 成功条数 */
  successStatements?: number;
  /** 失败条数 */
  failedStatements?: number;
  /** 耗时（ms） */
  elapsed?: number;
  /** 首个失败的语句及原因（失败数 > 0 时） */
  failure?: string;
}

/**
 * 给表拍结构快照。
 *
 * @param tableName 表名
 * @param payload 拍快照参数（name 不传 = 自动生成）
 * @param datasourceId 数据源 ID
 * @param database 目标库（可空 = 当前库）
 * @returns 快照 ID
 */
export const createDbSchemaSnapshot = (
  tableName: string,
  payload: DbSchemaSnapshotPayload = {},
  datasourceId?: number,
  database?: string,
) =>
  http()
    .post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/schema-snapshots`)
    .query({ datasourceId, database })
    .data(payload)
    .then(unwrapResult<number>(0));

/**
 * 列出表的结构快照（分页、按时间倒序，支持按快照名搜索）。
 *
 * @param tableName 表名
 * @param params 查询参数：name / page / size
 * @param datasourceId 数据源 ID
 * @param database 目标库（可空）
 */
export const fetchDbSchemaSnapshots = (
  tableName: string,
  params: Record<string, any> = {},
  datasourceId?: number,
  database?: string,
) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/schema-snapshots`)
    .query({ datasourceId, database, ...params })
    .then(wrapResult);

/**
 * 快照详情（完整 DDL + 列/索引/外键原始 JSON）。
 *
 * @param tableName 表名
 * @param id 快照 ID
 * @returns 快照详情
 */
export const fetchDbSchemaSnapshotDetail = (tableName: string, id: number) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/schema-snapshots/${id}`)
    .then(wrapResult);

/**
 * 删除结构快照。
 *
 * @param tableName 表名
 * @param id 快照 ID
 * @returns 是否成功
 */
export const deleteDbSchemaSnapshot = (tableName: string, id: number) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/schema-snapshots/${id}`)
    .then(wrapResult);

/**
 * 回滚到指定快照：删当前表 → 原样执行 DDL → 重建索引/外键。
 *
 * @param tableName 表名
 * @param id 快照 ID
 * @returns 回滚结果（总语句数/成功数/失败数/耗时/失败原因）
 */
export const rollbackDbSchemaSnapshot = (tableName: string, id: number) =>
  http()
    .post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/schema-snapshots/${id}/rollback`)
    .then(wrapResult);

/**
 * 获取表的建表语句（DDL）。
 *
 * @param tableName 表名
 * @param datasourceId 数据源 ID
 * @param database 目标库（可空）
 * @returns 建表 DDL 全文
 */
export const fetchDbSchemaDdl = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/ddl`)
    .query({ datasourceId, database })
    .then(wrapResult);
