/**
 * 数据源控制台 API（@pages/datasource）
 *
 * <p>从监控应用 monitorApi.ts 搬运：数据库 web 管理器段 + 外部服务管理段
 * （InfluxDB / Neo4j / Nacos / ZooKeeper）。请求走 @repo/utils 的 http 管线，
 * 返回已解包的业务数据。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);
// ==================== 数据库 web 管理器（使用默认主 datasource） ====================

/**
 * 数据库表信息
 * @author CH
 * @since 4.0.0
 */
export interface DbTableInfo {
  name: string;
  type: string;
  remark?: string;
}

/**
 * 表列信息
 * @author CH
 * @since 4.0.0
 */
export interface DbColumnInfo {
  name: string;
  type: string;
  size: number;
  nullable: boolean;
  remark?: string;
  default?: string;
  position?: number;
  isPrimaryKey?: boolean;
  /** 去掉长度与 UNSIGNED/ZEROFILL 后的基础类型，如 `int(10) unsigned` → `INT` */
  baseType?: string;
  /** 是否无符号 */
  unsigned?: boolean;
  /** 是否补零 */
  zerofill?: boolean;
  /** 是否自增（内核 EXTRA 含 auto_increment） */
  autoIncrement?: boolean;
  /** 列字符集 */
  charset?: string;
  /** 列排序规则 */
  collation?: string;
  /** ENUM / SET 的取值列表 */
  enumValues?: string[];
  /** 小数位 */
  scale?: number;
}

/**
 * 新建数据库请求
 * @author CH
 * @since 4.0.0
 */
export type DbDatabasePayload = {
  name: string;
  datasourceId?: number;
  charset?: string;
  collation?: string;
};

/**
 * 表数据结果
 * @author CH
 * @since 4.0.0
 */
export interface DbTableDataResult {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * SQL 执行结果
 * @author CH
 * @since 4.0.0
 */
export interface DbQueryResult {
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowCount?: number;
  truncated?: boolean;
  affectedRows?: number;
  message?: string;
}

/**
 * 获取数据库列表
 * @param datasourceId 数据源 ID（可选）
 * @returns 数据库名列表
 */
export const fetchDbDatabases = (datasourceId?: number) =>
  http()
    .get("/ms/monitor/db/databases")
    .noToast(true)
    .query({ datasourceId })
    .then(r => unwrap<string[]>(r));

/**
 * 获取数据库表列表
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @returns 表信息列表
 */
export const fetchDbTables = (datasourceId?: number, database?: string) =>
  http()
    .get("/ms/monitor/db/tables")
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbTableInfo[]>(r));

/**
 * 获取表结构
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @returns 列信息列表
 */
export const fetchTableColumns = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/columns`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbColumnInfo[]>(r));

/**
 * 获取表数据（分页）
 * @param tableName 表名
 * @param page 页码，默认 1
 * @param pageSize 每页条数，默认 50
 * @param orderBy 排序列（可选）
 * @param orderDir 排序方向（可选）
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @param countTotal 是否统计总数（false 跳过大表 COUNT，total 返回 -1 表示未知）
 * @param where WHERE 过滤条件（Navicat 式自由条件，可选）
 * @param filters 结构化筛选条件（高级筛选，可选；与 where 同时给出时按 AND 组合）
 * @returns 表数据分页结果
 */
export const fetchTableData = (tableName: string, page = 1, pageSize = 50, orderBy?: string, orderDir?: string, datasourceId?: number, database?: string, countTotal = true, where?: string, filters?: DbFilterCondition[]) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/data`)
    .noToast(true)
    .query({
      page,
      pageSize,
      orderBy,
      orderDir: orderBy ? orderDir || "ASC" : undefined,
      datasourceId,
      database,
      count: countTotal,
      where: where?.trim() ? where.trim() : undefined,
      // 空数组不传：传 `[]` 也会让后端走一次 JSON 解析，而语义上与不传完全相同
      filters: filters && filters.length > 0 ? JSON.stringify(filters) : undefined,
    })
    .then(r => unwrap<DbTableDataResult>(r));

/**
 * 结构化筛选条件（Navicat 式高级筛选的一行）
 *
 * <p>与 WHERE 自由文本是**两套独立机制**：列名走标识符白名单、值走
 * PreparedStatement 绑定（所以值里的引号不构成注入）；而 where 文本框
 * 只能靠「拒绝分隔符」的黑名单。两者同时给出时按 AND 组合。</p>
 *
 * @author CH
 * @since 4.0.0.45
 */
export interface DbFilterCondition {
  /** 列名（后端过标识符白名单） */
  column: string;
  /** 运算符：= <> > >= < <= LIKE "NOT LIKE" "IS NULL" "IS NOT NULL" IN "NOT IN" BETWEEN */
  op: string;
  /** 值1；IN 时为逗号分隔的多值；BETWEEN 时为下界 */
  value?: string;
  /** 值2：仅 BETWEEN 用作上界 */
  value2?: string;
}

/** 高级筛选支持的运算符（与后端 DbFilter.operators 同口径） */
export const DB_FILTER_OPS = [
  "=", "<>", ">", ">=", "<", "<=",
  "LIKE", "NOT LIKE", "IS NULL", "IS NOT NULL",
  "IN", "NOT IN", "BETWEEN",
] as const;

/**
 * 该运算符是否需要第二个值（BETWEEN 的上界）
 * @param op 运算符
 * @returns true=需要 value2
 */
export const dbFilterNeedsValue2 = (op: string): boolean => op === "BETWEEN";

/**
 * 该运算符是否不接受任何值（IS NULL / IS NOT NULL）
 * @param op 运算符
 * @returns true=无值
 */
export const dbFilterTakesNoValue = (op: string): boolean =>
  op === "IS NULL" || op === "IS NOT NULL";

/**
 * 该运算符是否接受逗号分隔的多值（IN / NOT IN）
 * @param op 运算符
 * @returns true=多值
 */
export const dbFilterTakesMultipleValues = (op: string): boolean =>
  op === "IN" || op === "NOT IN";

/**
 * 获取表的建表语句（DDL）
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @returns 建表语句
 */
export const fetchTableDdl = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/ddl`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<string>(r));

/** 外键信息 */
export interface DbForeignKeyInfo {
  fkName?: string;
  columnName?: string;
  refTable?: string;
  refColumn?: string;
  updateRule?: number;
  deleteRule?: number;
}

/**
 * 获取表的外键列表
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @returns 外键列表
 */
export const fetchForeignKeys = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/foreign-keys`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<DbForeignKeyInfo[]>(r));

/**
 * 执行 SQL（支持 SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/DROP）
 * @param sql SQL 语句
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库名（可选，为空用连接默认库）
 * @param txId 显式事务 ID（可选）；传了就在该事务的连接上执行
 * @returns SQL 执行结果
 */
export const executeDbSql = (sql: string, datasourceId?: number, database?: string, txId?: string) =>
  http()
    .post("/ms/monitor/db/execute")
    .noToast(true)
    .data({ sql, datasourceId, database, txId })
    .then(r => unwrap<DbQueryResult>(r));

/** ER 图里的一个表 */
export interface DbErTable {
  name: string;
  comment?: string;
}

/** ER 图里的一条外键关系 */
export interface DbErRelation {
  name?: string;
  fromTable: string;
  fromColumn?: string;
  toTable: string;
  toColumn?: string;
  /** JDBC 规范：0=RESTRICT 1=CASCADE 2=SET NULL 3=NO ACTION 4=SET DEFAULT */
  updateRule?: number;
  deleteRule?: number;
}

/** ER 图元数据 */
export interface DbErDiagram {
  catalog?: string;
  tables: DbErTable[];
  relations: DbErRelation[];
}

/**
 * 读取库级 ER 图元数据（表清单 + 全部外键）。
 *
 * <p>一次往返拿完整库。前端逐表调外键端点在 40 表规模上是 40 次请求，
 * 每次都要重新连库、切库，ER 图这种「整体视图」会明显卡住。</p>
 *
 * @param tables 表名过滤（LIKE 模式，可为空表示全部）
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库名（可选）
 * @returns ER 图元数据
 */
export const fetchErDiagram = (tables?: string, datasourceId?: number, database?: string) =>
  http()
    .get("/ms/monitor/db/er-diagram")
    .noToast(true)
    .query({ datasourceId, database, tables })
    .then(r => unwrap<DbErDiagram>(r));

/** 结构对比的一条差异 */
export interface DbStructureDiffItem {
  /** MISSING_TABLE / MISSING_COLUMN / COLUMN_MISMATCH / MISSING_INDEX /
   *  INDEX_MISMATCH / MISSING_FOREIGN_KEY / EXTRA_TABLE / EXTRA_COLUMN */
  kind: string;
  table: string;
  object: string;
  detail: string;
  action: string;
  /** 生成给用户看的 DDL；只提示类的（EXTRA_*）为空 */
  ddl: string;
}

/** 结构对比请求 */
export interface DbStructureDiffPayload {
  sourceDatasourceId?: number;
  sourceDatabase?: string;
  targetDatasourceId?: number;
  targetDatabase?: string;
  /** 表名过滤（LIKE，可为空表示全部） */
  tables?: string;
}

/**
 * 比较两个库的结构，返回差异清单（源 → 目标，单向）。
 *
 * <p>只生成脚本、不代执行：清单里含 `DROP INDEX` / `MODIFY COLUMN`
 * 这类不可逆语句，是否执行由用户看过脚本后决定。</p>
 *
 * @param payload 源/目标数据源与库
 * @returns 差异清单
 */
export const compareDbStructure = (payload: DbStructureDiffPayload) =>
  http()
    .post("/ms/monitor/db/structure-diff")
    .noToast(true)
    // .data() 的入参是 RequestBody（索引签名约束），具体类型由调用点保证
    .data({ ...payload })
    .then(r => unwrap<DbStructureDiffItem[]>(r));

/**
 * 删除表
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @param database 目标库名（可选）
 * @returns 删除结果
 */
export const dropDbTable = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}`)
    .noToast(true)
    .query({ datasourceId, database })
    .then(r => unwrap<boolean>(r));

/**
 * 新建数据库（后端按内核选择 DATABASE / SCHEMA 语法）
 * @param payload 库名、数据源与可选字符集
 * @returns 创建结果
 */
export const createDbDatabase = (payload: DbDatabasePayload) =>
  http()
    .post("/ms/monitor/db/database")
    .noToast(true)
    .data(payload)
    .then(r => unwrap<boolean>(r));

/**
 * 删除数据库
 * @param name 数据库名
 * @param datasourceId 数据源 ID（可选）
 * @returns 删除结果
 */
export const dropDbDatabase = (name: string, datasourceId?: number) =>
  http()
    .delete("/ms/monitor/db/database")
    .noToast(true)
    .query({ name, datasourceId })
    .then(r => unwrap<boolean>(r));
// ==================== 外部服务管理（InfluxDB / Neo4j / Nacos / ZooKeeper） ====================

/**
 * 中间件连通性测试载荷，与后端 `MiddlewareTestDTO` 同形
 *
 * <p>带 datasourceId 时按库里登记的配置测；不带时用 host/port/username/password 做即席测试。</p>
 * @author CH
 * @since 4.0.0
 */
export type MiddlewareTestConfig = {
  datasourceId?: number;
  host?: string;
  port?: number;
  contextPath?: string;
  username?: string;
  password?: string;
};

/**
 * 中间件连通性测试结果
 * @author CH
 * @since 4.0.0
 */
export type MiddlewareTestResult = {
  connected: boolean;
  version: string;
  message: string;
};

// ---------- InfluxDB 时序数据库管理 ----------

/**
 * InfluxDB Bucket 信息
 *
 * <p>序列基数不在 {@code /api/v2/buckets} 的回传字段里，逐桶统计又要各跑一次高开销 Flux，
 * 因此这里不提供该字段，页面也不显示空的「序列数」列。</p>
 * @author CH
 * @since 4.0.0
 */
export type InfluxdbBucket = {
  id: string;
  name: string;
  /** 保留时长（小时），0 表示永久保留，服务端未给规则时为 null */
  retentionHours: number | null;
  createdAt: string;
};

/**
 * InfluxDB 度量信息
 * @author CH
 * @since 4.0.0
 */
export type InfluxdbMeasurement = {
  name: string;
  /** 字段数，聚合失败时为 null */
  fieldCount: number | null;
  /** 标签数，聚合失败时为 null */
  tagCount: number | null;
  /** 回看窗口内的最后写入时间，窗口内无数据时为 null */
  lastWriteTime: string | null;
};

/**
 * InfluxDB Flux 查询结果
 * @author CH
 * @since 4.0.0
 */
export type InfluxdbQueryResult = {
  query: string;
  executionTimeMs: number;
  rows: Record<string, unknown>[];
  rowCount: number;
  /** 截断前的总行数 */
  totalRows: number;
  /** 行数超过后端上限时为 true，rows 已被截断 */
  truncated: boolean;
};

/**
 * 测试 InfluxDB 连接
 * @param config 连接配置
 */
export const testInfluxdbConnection = (config: MiddlewareTestConfig) =>
  http().post("/ms/monitor/influxdb/test").data(config).then(r => unwrap<MiddlewareTestResult>(r));

/**
 * 获取 InfluxDB Bucket 列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchInfluxdbBuckets = (datasourceId?: number) =>
  http().get("/ms/monitor/influxdb/buckets").query({ datasourceId }).then(r => unwrap<InfluxdbBucket[]>(r));

/**
 * 获取 InfluxDB 度量列表
 * @param datasourceId 数据源 ID（可选）
 * @param bucket Bucket 名（可选）
 */
export const fetchInfluxdbMeasurements = (datasourceId?: number, bucket?: string) =>
  http().get("/ms/monitor/influxdb/measurements").query({ datasourceId, bucket }).then(r => unwrap<InfluxdbMeasurement[]>(r));

/**
 * 执行 InfluxDB Flux 查询
 * @param flux Flux 查询语句
 * @param datasourceId 数据源 ID（可选）
 */
export const executeInfluxdbQuery = (flux: string, datasourceId?: number) =>
  http().post("/ms/monitor/influxdb/query").data({ flux, datasourceId }).then(r => unwrap<InfluxdbQueryResult>(r));

// ---------- Neo4j 图数据库管理 ----------

/**
 * Neo4j 标签信息
 *
 * <p>图规模超过后端扫描预算时，后端宁可不统计也不打满图库 CPU，计数列会被省略，故为可选。</p>
 * @author CH
 * @since 4.0.0
 */
export interface Neo4jLabel {
  name: string;
  nodeCount?: number;
  propertyCount?: number;
}

/**
 * Neo4j 关系类型信息
 *
 * <p>计数列同 {@link Neo4jLabel}，超预算时省略。</p>
 * @author CH
 * @since 4.0.0
 */
export interface Neo4jRelationship {
  type: string;
  relationshipCount?: number;
  propertyCount?: number;
}

/**
 * Neo4j 连通性测试结果
 * @author CH
 * @since 4.0.0
 */
export interface Neo4jTestResult extends MiddlewareTestResult {
  /** 版本类型（community/enterprise），服务端未给出时为空 */
  edition?: string;
}

/**
 * Neo4j Cypher 执行结果
 * @author CH
 * @since 4.0.0
 */
export type Neo4jQueryResult = {
  query: string;
  executionTimeMs: number;
  rows: Record<string, unknown>[];
  rowCount: number;
  /** 截断前的总行数 */
  totalRows: number;
  /** 行数超过后端上限时为 true，rows 已被截断 */
  truncated: boolean;
};

/**
 * 测试 Neo4j 连接
 * @param config 连接配置
 */
export const testNeo4jConnection = (config: MiddlewareTestConfig) =>
  http().post("/ms/monitor/neo4j/test").data(config).then(r => unwrap<Neo4jTestResult>(r));

/**
 * 获取 Neo4j 标签列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNeo4jLabels = (datasourceId?: number) =>
  http().get("/ms/monitor/neo4j/labels").query({ datasourceId }).then(r => unwrap<Neo4jLabel[]>(r));

/**
 * 获取 Neo4j 关系类型列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNeo4jRelationships = (datasourceId?: number) =>
  http().get("/ms/monitor/neo4j/relationships").query({ datasourceId }).then(r => unwrap<Neo4jRelationship[]>(r));

/**
 * 执行 Neo4j Cypher 查询
 * @param cypher Cypher 查询语句
 * @param datasourceId 数据源 ID（可选）
 */
export const executeNeo4jQuery = (cypher: string, datasourceId?: number) =>
  http().post("/ms/monitor/neo4j/query").data({ cypher, datasourceId }).then(r => unwrap<Neo4jQueryResult>(r));

// ---------- Nacos 配置中心管理 ----------

/**
 * Nacos 命名空间信息
 * @author CH
 * @since 4.0.0
 */
export interface NacosNamespace {
  id: string;
  namespace: string;
  name: string;
  configCount: number;
}

/**
 * Nacos 配置信息
 * @author CH
 * @since 4.0.0
 */
export interface NacosConfig {
  dataId: string;
  group: string;
  format: string;
  updatedAt: string;
}

/**
 * Nacos 配置详情
 * @author CH
 * @since 4.0.0
 */
export interface NacosConfigDetail extends NacosConfig {
  namespace: string;
  content: string;
  createdAt: string;
}

/**
 * Nacos 配置发布请求
 *
 * <p>对应后端 {@code ConfigSaveRequest}：{@code type} 为 Nacos 的配置格式
 * （yaml/json/properties/text/xml），与列表中的 {@code format} 同源。</p>
 *
 * @author CH
 * @since 4.0.0
 */
export interface NacosConfigSaveRequest {
  [key: string]: unknown;
  dataId: string;
  group: string;
  content: string;
  type?: string;
  namespace?: string;
  datasourceId?: number;
}

/**
 * Nacos 服务信息
 * @author CH
 * @since 4.0.0
 */
export interface NacosService {
  name: string;
  clusterCount: number;
  healthyInstanceCount: number;
  unhealthyInstanceCount: number;
  triggerFlag: boolean;
}

/**
 * Nacos 集群节点信息
 * @author CH
 * @since 4.0.0
 */
export interface NacosClusterNode {
  ip: string;
  port: number;
  status: string;
  role: string;
  weight: number;
}

/**
 * 测试 Nacos 连接
 * @param config 连接配置
 */
export const testNacosConnection = (config: MiddlewareTestConfig) =>
  http().post("/ms/monitor/nacos/test").data(config).then(r => unwrap<MiddlewareTestResult>(r));

/**
 * 获取 Nacos 命名空间列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNacosNamespaces = (datasourceId?: number) =>
  http().get("/ms/monitor/nacos/namespaces").query({ datasourceId }).then(r => unwrap<NacosNamespace[]>(r));

/**
 * 分页获取 Nacos 配置列表
 * @param params 查询参数（命名空间/分组/dataId/分页）
 */
export const fetchNacosConfigs = (params: { datasourceId?: number; namespace?: string; group?: string; dataId?: string; page?: number; pageSize?: number }) =>
  http().get("/ms/monitor/nacos/configs").query(params).then(r => unwrap<{ list: NacosConfig[]; total: number; page: number; pageSize: number }>(r));

/**
 * 获取 Nacos 配置详情
 *
 * <p>dataId 走**查询参数**：放在路径里时含 `/` 的 dataId 会被 Tomcat 拒绝编码斜杠（400）。</p>
 *
 * @param dataId 配置 dataId
 * @param params 数据源/命名空间/分组
 */
export const fetchNacosConfigDetail = (dataId: string, params: { datasourceId?: number; namespace?: string; group?: string }) =>
  http().get("/ms/monitor/nacos/config").query({ ...params, dataId }).then(r => unwrap<NacosConfigDetail>(r));

/**
 * 保存 Nacos 配置
 * @param config 配置内容（含目标数据源）
 */
export const saveNacosConfig = (config: Partial<NacosConfigDetail> & { datasourceId?: number }) =>
  http().post("/ms/monitor/nacos/config").data(config).then(r => unwrap<boolean>(r));

/**
 * 删除 Nacos 配置
 *
 * <p>dataId 走**查询参数**（同详情接口，避免含 `/` 的 dataId 被拒）。</p>
 *
 * @param dataId 配置 dataId
 * @param params 数据源/命名空间/分组
 */
export const deleteNacosConfig = (dataId: string, params: { datasourceId?: number; namespace?: string; group?: string }) =>
  http().delete("/ms/monitor/nacos/config").query({ ...params, dataId }).then(r => unwrap<boolean>(r));

/**
 * 获取 Nacos 服务列表
 * @param datasourceId 数据源 ID（可选）
 * @param namespace 命名空间（可选）
 */
export const fetchNacosServices = (datasourceId?: number, namespace?: string) =>
  http().get("/ms/monitor/nacos/services").query({ datasourceId, namespace }).then(r => unwrap<NacosService[]>(r));

/**
 * 获取 Nacos 集群节点列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNacosClusterNodes = (datasourceId?: number) =>
  http().get("/ms/monitor/nacos/cluster/nodes").query({ datasourceId }).then(r => unwrap<NacosClusterNode[]>(r));

// ---------- ZooKeeper 注册中心管理 ----------

/**
 * ZooKeeper 节点信息
 * @author CH
 * @since 4.0.0
 */
export interface ZkNode {
  path: string;
  name: string;
  ephemeral: boolean;
  childrenCount: number;
}

/**
 * ZooKeeper 节点详情
 * @author CH
 * @since 4.0.0
 */
export interface ZkNodeDetail {
  path: string;
  ephemeral: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  numChildren: number;
  dataLength: number;
  data: string;
}

/**
 * ZooKeeper 子节点信息
 * @author CH
 * @since 4.0.0
 */
export interface ZkChildNode {
  name: string;
  path: string;
  ephemeral: boolean;
  data: string;
}

/**
 * ZooKeeper 连通性测试结果
 *
 * <p>会话 ID 用于判断临时节点归属：临时节点只在建立它的那个会话内存活。</p>
 * @author CH
 * @since 4.0.0
 */
export interface ZookeeperTestResult extends MiddlewareTestResult {
  sessionId: string;
}

/**
 * 测试 ZooKeeper 连接
 * @param config 连接配置
 */
export const testZookeeperConnection = (config: MiddlewareTestConfig) =>
  http().post("/ms/monitor/zookeeper/test").data(config).then(r => unwrap<ZookeeperTestResult>(r));

/**
 * 获取 ZooKeeper 节点树
 * @param datasourceId 数据源 ID（可选）
 * @param path 节点路径
 */
export const fetchZkTree = (datasourceId?: number, path = "/") =>
  http().get("/ms/monitor/zookeeper/tree").query({ datasourceId, path }).then(r => unwrap<ZkNode[]>(r));

/**
 * 获取 ZooKeeper 节点详情
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchZkNodeDetail = (path: string, datasourceId?: number) =>
  http().get("/ms/monitor/zookeeper/node").query({ path, datasourceId }).then(r => unwrap<ZkNodeDetail>(r));

/**
 * 获取 ZooKeeper 子节点列表
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchZkChildren = (path: string, datasourceId?: number) =>
  http().get("/ms/monitor/zookeeper/children").query({ path, datasourceId }).then(r => unwrap<ZkChildNode[]>(r));

/**
 * 创建 ZooKeeper 节点
 * @param request 节点请求
 * @param datasourceId 数据源 ID
 */
export const createZkNode = (request: { path: string; data?: string; ephemeral?: boolean; datasourceId?: number }) =>
  http().post("/ms/monitor/zookeeper/node").data(request).then(r => unwrap<boolean>(r));

/**
 * 更新 ZooKeeper 节点数据
 * @param request 节点请求
 * @param datasourceId 数据源 ID
 */
export const updateZkNode = (request: { path: string; data: string; datasourceId?: number }) =>
  http().put("/ms/monitor/zookeeper/node").data(request).then(r => unwrap<boolean>(r));

/**
 * 删除 ZooKeeper 节点
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 */
export const deleteZkNode = (path: string, datasourceId?: number) =>
  http().delete("/ms/monitor/zookeeper/node").query({ path, datasourceId }).then(r => unwrap<boolean>(r));
