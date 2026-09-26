import { http, unwrapResult } from "@repo/utils";

/**
 * 数据库 web 管理器 - 表级编辑增强 API
 *
 * 与 monitorApi 中既有的浏览/查询类端点互补，这里只封装新增的写操作端点：
 * 单元格编辑 / 索引管理 / 清空表 / 表结构（列）编辑。
 *
 * @author CH
 * @since 4.0.0
 */
const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/** 表索引列信息（来自 DatabaseMetaData.getIndexInfo） */
export interface DbIndexInfo {
  indexName: string;
  columnName: string;
  /** true 表示非唯一索引（与 JDBC NON_UNIQUE 语义一致） */
  nonUnique: boolean;
  /** 索引类型（DatabaseMetaData index type 整数） */
  indexType: number;
  /** 列在索引中的序号，从 1 开始 */
  seqInIndex: number;
}

/** 单元格更新请求体 */
export type DbCellUpdatePayload = {
  tableName: string;
  column: string;
  newValue: unknown;
  /** 主键等值条件，用于 WHERE 定位单行 */
  primaryKey: Record<string, unknown>;
  database?: string;
  datasourceId?: number;
};

/**
 * 更新单个单元格
 * @param payload 更新请求
 * @returns 影响行数
 */
export const updateDbCell = (payload: DbCellUpdatePayload) =>
  http()
    .put(`/ms/monitor/db/table/${encodeURIComponent(payload.tableName)}/cell`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<number>(r));

/**
 * 获取表索引列表
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const fetchDbIndexes = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/indexes`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbIndexInfo[]>(r));

/** 新建索引请求体 */
export type DbIndexCreatePayload = {
  indexName: string;
  columns: string[];
  unique?: boolean;
  database?: string;
  datasourceId?: number;
};

/**
 * 新建索引
 * @param tableName 表名
 * @param payload 索引定义
 */
export const createDbIndex = (tableName: string, payload: DbIndexCreatePayload) =>
  http()
    .post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/index`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/**
 * 删除索引
 * @param tableName 表名
 * @param indexName 索引名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const dropDbIndex = (tableName: string, indexName: string, datasourceId?: number, database?: string) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/index/${encodeURIComponent(indexName)}`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));

/**
 * 清空表（TRUNCATE，不支持时后端退化为 DELETE）
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const truncateDbTable = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/truncate`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));

/** 列定义（新增/修改共用） */
export type DbColumnPayload = {
  columnName: string;
  type: string;
  size?: number;
  nullable?: boolean;
  defaultValue?: string;
  comment?: string;
  database?: string;
  datasourceId?: number;
};

/**
 * 新增列
 * @param tableName 表名
 * @param payload 列定义
 */
export const addDbColumn = (tableName: string, payload: DbColumnPayload) =>
  http()
    .post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/column`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/**
 * 修改列（MODIFY COLUMN）
 * @param tableName 表名
 * @param columnName 列名
 * @param payload 列定义
 */
export const modifyDbColumn = (tableName: string, columnName: string, payload: DbColumnPayload) =>
  http()
    .put(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/column/${encodeURIComponent(columnName)}`)
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/**
 * 删除列
 * @param tableName 表名
 * @param columnName 列名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库（可选）
 */
export const dropDbColumn = (tableName: string, columnName: string, datasourceId?: number, database?: string) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/column/${encodeURIComponent(columnName)}`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));
