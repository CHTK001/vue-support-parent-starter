/**
 * Elasticsearch 控制台 API（@pages/datasource）
 *
 * <p>两条通道并存，各司其职：</p>
 * <ul>
 *   <li><b>通用中间件 SPI</b> {@code /ms/monitor/middleware/**}：能力声明、连接测试、只读检索。
 *       能力包未安装时后端按契约返回「功能未开放」，前端原样展示而不是猜一个 500 页面。</li>
 *   <li><b>ES 专属管理面</b> {@code /ms/monitor/elasticsearch/**}：索引（设计表/改表/删表）、
 *       集群配置、关系图。这些是 ES 独有能力，没有通用 SPI 对应物。</li>
 * </ul>
 *
 * <p>类型统一用 {@code type} 而非 {@code interface}：接口没有隐式索引签名，赋给
 * {@code Record<string, unknown>}（ReTable 的 data、http().data 的 RequestBody）会报
 * {@code TS2345}；对象类型别名可以。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

const MIDDLEWARE_BASE = "/ms/monitor/middleware";
const ES_BASE = "/ms/monitor/elasticsearch";

// ==================== 通用中间件 SPI ====================

/** 中间件能力声明，与后端 MiddlewareCapability 契约一致 */
export type EsCapability = {
  topNodeSupported: boolean;
  childNodeSupported: boolean;
  querySupported: boolean;
  documentSupported: boolean;
  topNodeLabel: string;
  childNodeLabel: string;
  queryHint: string;
  queryDescription: string;
};

/** 中间件只读检索结果（列 + 行，JDBC 形态） */
export type EsQueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  totalRows: number;
  executionTimeMs: number;
  message: string;
};

/** 中间件连接测试结果 */
export type EsTestResult = {
  connected: boolean;
  version: string;
  detail: string;
  message: string;
};

/** 查询 Elasticsearch 中间件能力声明（不需要真实集群连接） */
export const fetchEsCapability = () =>
  http()
    .get(`${MIDDLEWARE_BASE}/capability`)
    .query({ type: "elasticsearch" })
    .noToast(true)
    .then(r => unwrap<EsCapability>(r));

/** 测试 Elasticsearch 连接 */
export const testEsConnection = (datasourceId?: number) =>
  http()
    .post(`${MIDDLEWARE_BASE}/test`)
    .query({ type: "elasticsearch" })
    .data({ datasourceId })
    .noToast(true)
    .then(r => unwrap<EsTestResult>(r));

/** 执行 Elasticsearch 检索（nodes / indices / count <index> / mapping <index> / search <index> [查询] / get <index> <id>） */
export const queryEs = (expression: string, datasourceId?: number, limit = 100) =>
  http()
    .post(`${MIDDLEWARE_BASE}/query`)
    .query({ type: "elasticsearch", expression, limit })
    .noToast(true)
    .then(r => unwrap<EsQueryResult>(r));

// ==================== ES 专属管理面 ====================

/** 字段定义（建索引 / 加字段入参；{@code name} 支持 {@code a.b} 对象子字段） */
export type EsField = {
  name: string;
  /** text/keyword/long/integer/double/date/boolean/object/nested/... 缺省 keyword */
  type?: string;
  /** 分词器，仅 text 有意义 */
  analyzer?: string;
  /** 日期格式，仅 date 有意义 */
  format?: string;
  /** 是否建索引，缺省 true（false 表示只存储不检索） */
  index?: boolean;
};

/** 索引列表行（_cat/indices 口径） */
export type EsIndexRow = {
  name: string;
  health: string | null;
  status: string | null;
  uuid: string | null;
  docs: string | null;
  storeSize: string | null;
};

/** 索引详情（相当于关系库的「表结构」） */
export type EsIndexDetail = {
  name: string;
  health: string | null;
  status: string | null;
  shards: number | null;
  replicas: number | null;
  docs: number | null;
  storeSize: string | null;
  fields: EsField[];
  settings: Record<string, unknown>;
};

/** 新建索引（设计表）请求 */
export type EsIndexForm = {
  name: string;
  shards?: number | null;
  replicas?: number | null;
  fields?: EsField[];
  datasourceId?: number;
};

/** 追加字段（改表）请求 */
export type EsMappingForm = {
  index: string;
  fields: EsField[];
  datasourceId?: number;
};

/** 集群节点 */
export type EsClusterNode = {
  name: string;
  ip: string;
  roles: string;
  master: string;
  heapPercent: string;
  cpu: string;
  load: string;
  version: string;
};

/** 集群信息（相当于关系库的「实例信息」） */
export type EsCluster = {
  clusterName: string;
  status: string;
  numberOfNodes: number;
  numberOfDataNodes: number;
  activeShards: number;
  unassignedShards: number;
  initializingShards: number;
  relocatingShards: number;
  version: string;
  nodes: EsClusterNode[];
  settings: Record<string, unknown>;
};

/** 集群设置更新请求 */
export type EsClusterSettingsForm = {
  datasourceId?: number;
  persistent?: Record<string, unknown>;
  transient?: Record<string, unknown>;
};

/** 分片分配行 */
export type EsShard = {
  index: string;
  shard: string;
  prirep: string;
  state: string;
  docs: string;
  store: string;
  node: string;
};

/** 关系图节点：type = cluster | index | field | alias */
export type EsGraphNode = {
  id: string;
  label: string;
  type: string;
  parent?: string | null;
};

/** 关系图边：别名 → 索引 */
export type EsGraphEdge = {
  source: string;
  target: string;
  label?: string;
};

/** 关系图 */
export type EsGraph = {
  nodes: EsGraphNode[];
  edges: EsGraphEdge[];
};

/** 索引列表 */
export const fetchEsIndices = (datasourceId?: number) =>
  http()
    .get(`${ES_BASE}/indices`)
    .query({ datasourceId })
    .noToast(true)
    .then(r => unwrap<EsIndexRow[]>(r));

/** 索引详情（字段映射 + 设置） */
export const fetchEsIndexDetail = (index: string, datasourceId?: number) =>
  http()
    .get(`${ES_BASE}/index`)
    .query({ index, datasourceId })
    .noToast(true)
    .then(r => unwrap<EsIndexDetail>(r));

/** 新建索引（设计表） */
export const createEsIndex = (form: EsIndexForm) =>
  http()
    .post(`${ES_BASE}/index`)
    .data(form)
    .noToast(true)
    .then(r => unwrap<EsIndexDetail>(r));

/** 追加字段（改表） */
export const addEsMapping = (form: EsMappingForm) =>
  http()
    .post(`${ES_BASE}/mapping`)
    .data(form)
    .noToast(true)
    .then(r => unwrap<EsIndexDetail>(r));

/**
 * 重建索引：删字段 / 改字段类型的唯一途径
 *
 * <p>后端会「建临时索引(新 mapping) → 搬运原数据 → 删原索引 → 用新 mapping 建回同名索引 →
 * 搬运回来 → 删临时索引」。重建期间原索引短暂不可用，且耗时与数据量成正比。</p>
 */
export const rebuildEsIndex = (form: EsIndexForm) =>
  http()
    .post(`${ES_BASE}/index/rebuild`)
    .data(form)
    .noToast(true)
    .then(r => unwrap<EsIndexDetail>(r));

/** 删除索引 */
export const deleteEsIndex = (index: string, datasourceId?: number) =>
  http()
    .delete(`${ES_BASE}/index`)
    .query({ index, datasourceId })
    .noToast(true)
    .then(r => unwrap<boolean>(r));

/** 集群信息（含有效设置） */
export const fetchEsCluster = (datasourceId?: number) =>
  http()
    .get(`${ES_BASE}/cluster`)
    .query({ datasourceId })
    .noToast(true)
    .then(r => unwrap<EsCluster>(r));

/** 分片分配 */
export const fetchEsShards = (datasourceId?: number) =>
  http()
    .get(`${ES_BASE}/shards`)
    .query({ datasourceId })
    .noToast(true)
    .then(r => unwrap<EsShard[]>(r));

/** 更新集群设置 */
export const updateEsClusterSettings = (form: EsClusterSettingsForm) =>
  http()
    .put(`${ES_BASE}/cluster/settings`)
    .data(form)
    .noToast(true)
    .then(r => unwrap<EsCluster>(r));

/** 关系图 */
export const fetchEsGraph = (datasourceId?: number) =>
  http()
    .get(`${ES_BASE}/graph`)
    .query({ datasourceId })
    .noToast(true)
    .then(r => unwrap<EsGraph>(r));

// ==================== 别名管理 ====================

/** 别名行 */
export type EsAliasRow = {
  alias: string;
  index: string;
  filter: string | null;
  routingIndex: string | null;
  searchRouting: string | null;
  indexRouting: string | null;
};

/** 添加 / 更新别名请求 */
export type EsAliasForm = {
  alias: string;
  index: string;
  filter?: string;
  searchRouting?: string;
  indexRouting?: string;
  datasourceId?: number;
};

/** 查所有别名（GET /_alias） */
export const fetchEsAliases = (datasourceId?: number) =>
  http()
    .get(`${ES_BASE}/aliases`)
    .query({ datasourceId })
    .noToast(true)
    .then(r => unwrap<EsAliasRow[]>(r));

/** 添加别名 */
export const addEsAlias = (form: EsAliasForm) =>
  http()
    .post(`${ES_BASE}/alias`)
    .data(form)
    .noToast(true)
    .then(r => unwrap<boolean>(r));

/** 删除别名 */
export const deleteEsAlias = (alias: string, datasourceId?: number) =>
  http()
    .delete(`${ES_BASE}/alias`)
    .query({ alias, datasourceId })
    .noToast(true)
    .then(r => unwrap<boolean>(r));

/** 更新索引副本设置 */
export const updateEsIndexSettings = (index: string, replicas: number, datasourceId?: number) =>
  http()
    .put(`${ES_BASE}/index/settings`)
    .data({ index, replicas, datasourceId })
    .noToast(true)
    .then(r => unwrap<boolean>(r));
