/**
 * 数据源运行时管理 API（/ms/ds-runtime/**）。
 *
 * <p>复用 @pages/datasource 的私有请求客户端（带 token、逐层解信封、401 会话失效），
 * 不再抄一份。路径是相对 API 基址的，客户端已拼 context-path。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { del, get, post } from "@pages/datasource/src/api/request";

/** 运行时管理接口根路径（相对 API 基址） */
const base = "/ms/ds-runtime";

/** 写入/刷新类接口超时：保存/删除会触发后端重建 ShardingSphere/Calcite 运行时，首次初始化可能远超默认 15s */
const REFRESH_TIMEOUT = 120000;

/** 查询与受限 DDL 执行超时：冷启动后首查、跨库 DDL 也可能偏慢 */
const EXEC_TIMEOUT = 60000;

// ==================== 类型（与后端 runtime.model 一一对应） ====================

/** Calcite 联邦成员连接参数（后端 FederationMember） */
export interface FederationMember {
  schemaName: string;
  url: string;
  username?: string | null;
  password?: string | null;
  driverClassName?: string | null;
}

/** Calcite 联邦配置（后端 DsCalciteFederation） */
export interface DsCalciteFederation {
  id?: number;
  schemaName: string;
  defaultSchema?: string | null;
  /** 0 停用 1 启用 */
  enabled?: number;
  /** 成员 JSON（后端回显；提交时后端以 memberList 为准序列化） */
  members?: string | null;
  remark?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  /** 反序列化后的成员列表（页面读写用） */
  memberList?: FederationMember[] | null;
}

/** 分库成员连接参数（后端 ShardingDbMember） */
export interface ShardingDbMember {
  /** 分库逻辑名（数据节点前缀）；url 留空表示引用已注册数据源名 */
  name: string;
  url?: string | null;
  username?: string | null;
  password?: string | null;
  driverClassName?: string | null;
}

/** 分库分表规则（后端 DsShardingRule） */
export interface DsShardingRule {
  id?: number;
  logicTable: string;
  shardingColumn: string;
  /** MOD / INTERVAL */
  algorithm: string;
  /** MOD 分片数 */
  shardCount?: number;
  /** INTERVAL 时间粒度：YEAR/QUARTER/MONTH/WEEK/DAY/HOUR */
  timeUnit?: string | null;
  timeLower?: string | null;
  timeUpper?: string | null;
  /** 分库成员 JSON（后端回显） */
  databases?: string | null;
  enabled?: number;
  remark?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  /** 反序列化后的分库成员（页面读写用） */
  dbMemberList?: ShardingDbMember[] | null;
}

/** 运行时概览（后端 overview 的 LinkedHashMap） */
export interface DsRuntimeOverview {
  federationTotal: number;
  federationEnabled: number;
  shardingTotal: number;
  shardingEnabled: number;
  calciteLastRefreshAt?: string | null;
  calciteLastRefreshResult?: string | null;
  shardingLastRefreshAt?: string | null;
  shardingLastRefreshResult?: string | null;
  activeCalciteMembers: number;
  activeShardingTables: number;
}

/** SQL 试跑结果（后端 query 的 LinkedHashMap） */
export interface DsQueryResult {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  truncated: boolean;
  elapsedMs: number;
}

/** 物理 DDL 单步结果（后端 preview/apply 的 List<Map>，键 db/table/sql/type/success/message/skipped/skipReason） */
export interface DdlStepResult {
  db: string;
  table?: string;
  sql?: string;
  type?: string;
  success?: boolean;
  message?: string;
  skipped?: boolean;
  skipReason?: string | null;
}

/** 手动刷新结果 */
export interface RefreshResult {
  schemas?: string[];
  logicTables?: string[];
  refreshAt?: string | null;
  message?: string | null;
}

// ==================== 概览 ====================

/** 运行时概览 */
export const fetchOverview = () => get<DsRuntimeOverview>(`${base}/overview`);

// ==================== Calcite 联邦 ====================

/** 联邦配置清单（含停用） */
export const listFederations = () => get<DsCalciteFederation[]>(`${base}/calcite`);

/** 保存联邦配置并立即刷新（不重启生效） */
export const saveFederation = (data: DsCalciteFederation) =>
  post<DsCalciteFederation>(`${base}/calcite`, data, undefined, { timeoutMs: REFRESH_TIMEOUT });

/** 删除联邦配置并立即刷新 */
export const deleteFederation = (id: number) =>
  del<void>(`${base}/calcite/${id}`, undefined, { timeoutMs: REFRESH_TIMEOUT });

/** 手动刷新全部联邦 */
export const refreshFederations = () =>
  post<RefreshResult>(`${base}/calcite/refresh`, undefined, undefined, { timeoutMs: REFRESH_TIMEOUT });

/** 联邦 SQL 试跑（仅 SELECT/WITH/SHOW/EXPLAIN，限 200 行） */
export const queryFederation = (sql: string) =>
  post<DsQueryResult>(`${base}/calcite/query`, { sql }, undefined, { timeoutMs: EXEC_TIMEOUT });

// ==================== 分库分表 ====================

/** 分片规则清单（含停用） */
export const listShardingRules = () => get<DsShardingRule[]>(`${base}/sharding`);

/** 保存分片规则并立即刷新（不重启生效） */
export const saveShardingRule = (data: DsShardingRule) =>
  post<DsShardingRule>(`${base}/sharding`, data, undefined, { timeoutMs: REFRESH_TIMEOUT });

/** 删除分片规则并立即刷新 */
export const deleteShardingRule = (id: number) =>
  del<void>(`${base}/sharding/${id}`, undefined, { timeoutMs: REFRESH_TIMEOUT });

/** 手动刷新分片数据源 */
export const refreshSharding = () =>
  post<RefreshResult>(`${base}/sharding/refresh`, undefined, undefined, { timeoutMs: REFRESH_TIMEOUT });

/** 分片 SQL 试跑（SELECT 类，限 200 行） */
export const querySharding = (sql: string) =>
  post<DsQueryResult>(`${base}/sharding/query`, { sql }, undefined, { timeoutMs: EXEC_TIMEOUT });

// ==================== 分片物理表（受限 DDL） ====================

/** 查看某规则在各分库已存在的物理表（键=分库名） */
export const listPhysicalTables = (ruleId: number) => get<Record<string, string[]>>(`${base}/tables/${ruleId}`);

/** 补建分片表 DDL 预览（不执行） */
export const previewCreate = (ruleId: number, sampleDdl: string) =>
  post<DdlStepResult[]>(`${base}/tables/preview-create`, { ruleId, sampleDdl });

/** 执行补建分片表（幂等 CREATE TABLE IF NOT EXISTS） */
export const applyCreate = (ruleId: number, sampleDdl: string) =>
  post<DdlStepResult[]>(`${base}/tables/apply-create`, { ruleId, sampleDdl }, undefined, { timeoutMs: EXEC_TIMEOUT });

/** 追加列 DDL 预览（已存在同名列标记 skipped） */
export const previewAddColumn = (ruleId: number, columnDdl: string) =>
  post<DdlStepResult[]>(`${base}/tables/preview-add-column`, { ruleId, columnDdl });

/** 执行追加列（已存在同名列自动跳过） */
export const applyAddColumn = (ruleId: number, columnDdl: string) =>
  post<DdlStepResult[]>(`${base}/tables/apply-add-column`, { ruleId, columnDdl }, undefined, { timeoutMs: EXEC_TIMEOUT });
