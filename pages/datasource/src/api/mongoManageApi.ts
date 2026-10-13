import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

// ==================== MongoDB 控制台 API（/ms/monitor/mongodb） ====================

/**
 * MongoDB 连通性测试结果
 * @author CH
 * @since 4.0.0.43
 */
export interface MongoTestResult {
  /** 是否连通且凭据可用 */
  connected: boolean;
  /** 服务端版本（buildInfo），取不到时为 null */
  version?: string | null;
  /** 结果说明，失败时为可读原因 */
  message: string;
}

/**
 * MongoDB 逻辑库
 * @author CH
 * @since 4.0.0.43
 */
export interface MongoDatabase {
  /** 逻辑库名 */
  name: string;
  /** 磁盘占用（字节），取不到时为 null */
  sizeOnDisk?: number | null;
  /** 是否空库 */
  empty?: boolean | null;
}

/**
 * MongoDB 集合
 * @author CH
 * @since 4.0.0.43
 */
export interface MongoCollection {
  /** 集合名 */
  name: string;
  /** 集合类型（collection/view），取不到时为 null */
  type?: string | null;
  /** 估算文档数，拿不到时为 null */
  estimatedCount?: number | null;
}

/**
 * MongoDB 查询结果
 *
 * <p>文档是动态结构（同一集合内键可不同），单行用 {@link MongoRow} 的键值映射承载，
 * 列由前端按行键并集推导；{@link truncated} 为真时 {@link rowCount} 等于行数上限，
 * {@link totalRows} 是截断前口径的总行数。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
export interface MongoQueryResult {
  /** 实际执行的 shell 表达式 */
  query: string;
  /** 服务端往返耗时（毫秒） */
  executionTimeMs: number;
  /** 行数据，键为文档字段 */
  rows: MongoRow[];
  /** 本次下发的行数，被截断时等于上限 */
  rowCount: number;
  /** 截断前口径的总行数 */
  totalRows: number;
  /** 是否因行数上限被截断 */
  truncated: boolean;
}

/**
 * MongoDB 单行文档（键为字段名）
 * @author CH
 * @since 4.0.0.43
 */
export type MongoRow = Record<string, unknown>;

/**
 * MongoDB 只读查询入参
 * @author CH
 * @since 4.0.0.43
 */
export interface MongoQueryPayload {
  [key: string]: unknown;
  /** shell 表达式，如 {@code db.orders.find({status: "PAID"})} */
  expression: string;
  /** 当前逻辑库名，为空用数据源默认库 */
  database?: string;
  /** 数据源 ID，非空时按库中配置执行 */
  datasourceId?: number;
}

/**
 * MongoDB 单文档查看入参
 * @author CH
 * @since 4.0.0.43
 */
export interface MongoDocumentPayload {
  [key: string]: unknown;
  datasourceId?: number;
  /** 逻辑库名，为空用数据源默认库 */
  database?: string;
  /** 集合名 */
  collection: string;
  /** 文档 ID（ObjectId 十六进制串，或字符串主键） */
  id: string;
}

/**
 * 测试 MongoDB 连通性
 *
 * <p>传 {@code datasourceId} 走库中配置；未登记时可临时给 host/port/username/password
 * 做即席探测（此时 {@code contextPath} 借道承载默认逻辑库名）。</p>
 *
 * @param payload 测试参数，见 {@link MongoTestPayload}
 * @returns 测试结果
 * @author CH
 * @since 4.0.0.43
 */
export const testMongoConnection = (payload: MongoTestPayload = {}) =>
  http().post("/ms/monitor/mongodb/test").data(payload).then(r => unwrap<MongoTestResult>(r));

/**
 * MongoDB 连通性测试入参
 * @author CH
 * @since 4.0.0.43
 */
export interface MongoTestPayload {
  [key: string]: unknown;
  datasourceId?: number;
  host?: string;
  port?: number;
  /** 即席测试时借道承载默认逻辑库名 */
  contextPath?: string;
  username?: string;
  password?: string;
}

/**
 * 查询逻辑库列表
 *
 * @param datasourceId 数据源 ID（可选，缺省时服务端取第一个 mongodb 数据源）
 * @returns 逻辑库列表
 * @author CH
 * @since 4.0.0.43
 */
export const fetchMongoDatabases = (datasourceId?: number) =>
  http().get("/ms/monitor/mongodb/databases").query({ datasourceId }).then(r => unwrap<MongoDatabase[]>(r));

/**
 * 查询集合列表
 *
 * @param datasourceId 数据源 ID（可选）
 * @param database 逻辑库名，为空时服务端报「逻辑库名不能为空」
 * @returns 集合列表
 * @author CH
 * @since 4.0.0.43
 */
export const fetchMongoCollections = (datasourceId: number | undefined, database: string) =>
  http().get("/ms/monitor/mongodb/collections").query({ datasourceId, database }).then(r => unwrap<MongoCollection[]>(r));

/**
 * 执行只读 shell 查询
 *
 * <p>仅支持 find/findOne/count/countDocuments/aggregate（可链 .limit/.skip/.sort），
 * 写方法与 $out/$merge 阶段由服务端拒绝。</p>
 *
 * @param payload 查询入参，见 {@link MongoQueryPayload}
 * @returns 查询结果
 * @author CH
 * @since 4.0.0.43
 */
export const executeMongoQuery = (payload: MongoQueryPayload) =>
  http().post("/ms/monitor/mongodb/query").data(payload).then(r => unwrap<MongoQueryResult>(r));

/**
 * 按 ID 查看单个文档
 *
 * @param payload 查看入参，见 {@link MongoDocumentPayload}
 * @returns 文档内容（字段映射）
 * @author CH
 * @since 4.0.0.43
 */
export const fetchMongoDocument = (payload: MongoDocumentPayload) =>
  http().post("/ms/monitor/mongodb/document").data(payload).then(r => unwrap<MongoRow>(r));
