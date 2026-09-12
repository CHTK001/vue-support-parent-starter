import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/** 监控项（/ms/monitor） */
export interface MonitorItem {
  id: number;
  monitorName: string;
  monitorHost: string;
  monitorPort: number;
  serviceType: string;
  serverType: string;
  monitorEnabled: number;
}

/** 告警事件（/ms/monitor/alarm/event） */
export interface AlarmEvent {
  id: number;
  msMonitorAlarmEventMonitorId: number;
  msMonitorAlarmEventMonitorName: string;
  msMonitorAlarmEventMetricName: string;
  msMonitorAlarmEventAlarmValue: number;
  msMonitorAlarmEventThreshold: number;
  msMonitorAlarmEventLevel: string;
  msMonitorAlarmEventStatus: string;
  msMonitorAlarmEventTriggerTime: string;
}

export const fetchMonitors = () =>
  http().get("/ms/monitor").then(r => unwrap<MonitorItem[]>(r));

export const fetchAlarmEvents = () =>
  http().get("/ms/monitor/alarm/event").then(r => unwrap<AlarmEvent[]>(r));

/** 处理告警事件（remark 备注，falseAlarm 标记误报）—— design.md §4.4 */
export const handleAlarmEvent = (id: number, remark: string, falseAlarm: boolean) =>
  http()
    .post(`/ms/monitor/alarm/event/${id}/handle?remark=${encodeURIComponent(remark)}&falseAlarm=${falseAlarm}`)
    .then(r => unwrap<boolean>(r));

/** 告警级别（P0~P4，兜底 P3） */
export function alarmLevel(e: AlarmEvent): string {
  const lv = String(e.msMonitorAlarmEventLevel || "").toUpperCase();
  return /^P[0-4]$/.test(lv) ? lv : "P3";
}

/** 是否未处理 */
export function isUnhandled(e: AlarmEvent): boolean {
  return String(e.msMonitorAlarmEventStatus || "").toUpperCase() === "NEW";
}

// ==================== 告警策略 / 规则（/ms/monitor/alarm） ====================

/** 告警策略 */
export interface AlarmPolicy {
  id: number;
  msMonitorAlarmPolicyName: string;
  msMonitorAlarmPolicyEnabled: number;
  msMonitorAlarmPolicyRemark: string;
}

/** 告警规则 */
export interface AlarmRule {
  id: number;
  msMonitorAlarmRulePolicyId: number;
  msMonitorAlarmRuleMonitorId: number | null;
  msMonitorAlarmRuleMetricName: string;
  msMonitorAlarmRuleCondition: string; // GT/GE/EQ/LE/LT
  msMonitorAlarmRuleThreshold: number;
  msMonitorAlarmRuleConsecutiveCount: number;
  msMonitorAlarmRuleSilenceMinutes: number;
  msMonitorAlarmRuleLevel: string; // P0~P4
  msMonitorAlarmRuleEnabled: number;
}

export const fetchAlarmPolicies = () =>
  http().get("/ms/monitor/alarm/policy").then(r => unwrap<AlarmPolicy[]>(r));
export const saveAlarmPolicy = (id: number | null, d: Partial<AlarmPolicy>) =>
  id != null
    ? http().put(`/ms/monitor/alarm/policy/${id}`).data(d).then(r => unwrap<AlarmPolicy>(r))
    : http().post("/ms/monitor/alarm/policy").data(d).then(r => unwrap<AlarmPolicy>(r));
export const delAlarmPolicy = (id: number) =>
  http().delete(`/ms/monitor/alarm/policy/${id}`).then(r => unwrap<boolean>(r));

export const fetchAlarmRules = (policyId?: number) =>
  http()
    .get(`/ms/monitor/alarm/rule${policyId ? `?policyId=${policyId}` : ""}`)
    .then(r => unwrap<AlarmRule[]>(r));
export const saveAlarmRule = (id: number | null, d: Partial<AlarmRule>) =>
  id != null
    ? http().put(`/ms/monitor/alarm/rule/${id}`).data(d).then(r => unwrap<AlarmRule>(r))
    : http().post("/ms/monitor/alarm/rule").data(d).then(r => unwrap<AlarmRule>(r));
export const delAlarmRule = (id: number) =>
  http().delete(`/ms/monitor/alarm/rule/${id}`).then(r => unwrap<boolean>(r));
export const testAlarmRule = (ruleId: number, metricName?: string, value?: number) =>
  http()
    .get(`/ms/monitor/alarm/rule/${ruleId}/test?metricName=${encodeURIComponent(metricName ?? "")}&value=${value ?? 0}`)
    .then(r => unwrap<boolean>(r));

// ==================== 系统 Redis 信息（当前应用自身连接的 Redis，与监控资产/Agent 无关） ====================

/** 当前系统 Redis 指标（INFO 解析后的 key 数值表） */
export interface SystemRedisInfo {
  connected_clients?: number;
  used_memory?: number;
  used_memory_human?: string;
  os?: string;
  redis_version?: string;
  uptime_in_seconds?: number;
  instantaneous_ops_per_sec?: number;
  keyspace_hits?: number;
  keyspace_misses?: number;
  total_connections_received?: number;
  total_commands_processed?: number;
  role?: string;
  [key: string]: number | string | undefined;
}

export const fetchSystemRedisInfo = () =>
  http()
    .get("/ms/monitor/system/redis-info")
    .then(r => unwrap<SystemRedisInfo | null>(r));

// ==================== 系统 Redis KV 操作（直接操作当前应用连接的 Redis） ====================

/** Redis Keys 扫描结果 */
export interface RedisScanResult {
  keys: string[];
  nextCursor: string;
  total: number;
}

/** Redis Key 详细信息 */
export interface RedisKeyDetail {
  key: string;
  type: string;
  ttl: number;
  value: string | null;
}

/** 扫描当前系统 Redis Keys */
export const scanSystemRedisKeys = (pattern = "*", cursor = "0", count = 100) =>
  http()
    .get("/ms/monitor/system/redis/keys", { params: { pattern, cursor, count } })
    .then(r => unwrap<RedisScanResult>(r));

/** 读取当前系统 Redis Key */
export const getSystemRedisKey = (key: string) =>
  http()
    .get(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}`)
    .then(r => unwrap<string | null>(r));

/** 获取当前系统 Redis Key 详细信息 */
export const getSystemRedisKeyDetail = (key: string) =>
  http()
    .get(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/detail`)
    .then(r => unwrap<RedisKeyDetail>(r));

/** 写入当前系统 Redis Key */
export const setSystemRedisKey = (key: string, value: string, ttl = -1) =>
  http()
    .put(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}`, value, { params: { ttl } })
    .then(r => unwrap<boolean>(r));

/** 删除当前系统 Redis Keys */
export const deleteSystemRedisKeys = (keys: string[]) =>
  http()
    .delete("/ms/monitor/system/redis/keys", { data: keys })
    .then(r => unwrap<number>(r));

/** 设置当前系统 Redis Key 过期时间 */
export const expireSystemRedisKey = (key: string, ttl: number) =>
  http()
    .post(`/ms/monitor/system/redis/expire/${encodeURIComponent(key)}`, null, { params: { ttl } })
    .then(r => unwrap<boolean>(r));

// ==================== AI 智能分析 ====================

/** AI 状态 */
export interface AiStatus {
  enabled: boolean;
  model?: string;
  provider?: string;
}

/** AI 分析结果 */
export interface AiAnalyzeResult {
  content: string;
  model?: string;
  usage?: unknown;
  hostId?: number;
  hostName?: string;
}

/** 查询 AI 分析是否启用 */
export const fetchAiStatus = () =>
  http()
    .get("/ms/monitor/ai/status")
    .then(r => unwrap<AiStatus>(r));

/** 通用 AI 分析 */
export const aiAnalyze = (prompt: string, options?: { systemPrompt?: string; model?: string }) =>
  http()
    .post("/ms/monitor/ai/analyze")
    .data({ prompt, systemPrompt: options?.systemPrompt, model: options?.model })
    .then(r => unwrap<AiAnalyzeResult>(r));

/** 主机指标智能分析 */
export const aiAnalyzeHost = (hostId: number, options?: { metrics?: unknown; dimension?: string }) =>
  http()
    .post(`/ms/monitor/ai/host/${hostId}/analyze`)
    .data({ metrics: options?.metrics, dimension: options?.dimension })
    .then(r => unwrap<AiAnalyzeResult>(r));

// ==================== 数据源管理（jdbc/redis/influxdb/neo4j/nacos/zookeeper） ====================

/** 数据源信息 */
export interface DataSourceInfo {
  id: number;
  name: string;
  type: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  url?: string;
  remark?: string;
  config?: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

/** 获取所有数据源 */
export const fetchDataSources = () =>
  http()
    .get("/ms/monitor/datasource/list")
    .then(r => unwrap<DataSourceInfo[]>(r));

/** 获取数据源详情 */
export const fetchDataSource = (id: number) =>
  http()
    .get(`/ms/monitor/datasource/${id}`)
    .then(r => unwrap<DataSourceInfo>(r));

/** 创建数据源 */
export const createDataSource = (data: Partial<DataSourceInfo>) =>
  http()
    .post("/ms/monitor/datasource")
    .data(data)
    .then(r => unwrap<DataSourceInfo>(r));

/** 更新数据源 */
export const updateDataSource = (id: number, data: Partial<DataSourceInfo>) =>
  http()
    .put(`/ms/monitor/datasource/${id}`)
    .data(data)
    .then(r => unwrap<DataSourceInfo>(r));

/** 删除数据源 */
export const deleteDataSource = (id: number) =>
  http()
    .delete(`/ms/monitor/datasource/${id}`)
    .then(r => unwrap<boolean>(r));

/** 测试数据源连接 */
export const testDataSource = (id: number) =>
  http()
    .post(`/ms/monitor/datasource/${id}/test`)
    .then(r => unwrap<{ success: boolean; message: string; type: string }>(r));

/** 获取支持的数据源类型 */
export const fetchDataSourceTypes = () =>
  http()
    .get("/ms/monitor/datasource/types")
    .then(r => unwrap<string[]>(r));

// ==================== 数据库 web 管理器（使用默认主 datasource） ====================

/** 数据库表信息 */
export interface DbTableInfo {
  name: string;
  type: string;
  remark?: string;
}

/** 表列信息 */
export interface DbColumnInfo {
  name: string;
  type: string;
  size: number;
  nullable: boolean;
  remark?: string;
  default?: string;
  position?: number;
  isPrimaryKey?: boolean;
}

/** 表数据结果 */
export interface DbTableDataResult {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
}

/** SQL 执行结果 */
export interface DbQueryResult {
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowCount?: number;
  truncated?: boolean;
  affectedRows?: number;
  message?: string;
}

/** 获取数据库列表 */
export const fetchDbDatabases = (datasourceId?: number) =>
  http()
    .get("/ms/monitor/db/databases" + (datasourceId ? `?datasourceId=${datasourceId}` : ""))
    .then(r => unwrap<string[]>(r));

/** 获取数据库表列表 */
export const fetchDbTables = (datasourceId?: number, database?: string) =>
  http()
    .get("/ms/monitor/db/tables" + (datasourceId || database ? `?${datasourceId ? `datasourceId=${datasourceId}` : ""}${database ? `&database=${encodeURIComponent(database)}` : ""}` : ""))
    .then(r => unwrap<DbTableInfo[]>(r));

/** 获取表结构 */
export const fetchTableColumns = (tableName: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/columns` + (datasourceId || database ? `?${datasourceId ? `datasourceId=${datasourceId}` : ""}${database ? `&database=${encodeURIComponent(database)}` : ""}` : ""))
    .then(r => unwrap<DbColumnInfo[]>(r));

/** 获取表数据（分页） */
export const fetchTableData = (tableName: string, page = 1, pageSize = 50, orderBy?: string, orderDir?: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/data?page=${page}&pageSize=${pageSize}` + (orderBy ? `&orderBy=${encodeURIComponent(orderBy)}&orderDir=${orderDir || "ASC"}` : "") + (datasourceId ? `&datasourceId=${datasourceId}` : "") + (database ? `&database=${encodeURIComponent(database)}` : ""))
    .then(r => unwrap<DbTableDataResult>(r));

/** 执行 SQL（支持 SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/DROP） */
export const executeDbSql = (sql: string, datasourceId?: number) =>
  http()
    .post("/ms/monitor/db/execute")
    .data({ sql, datasourceId })
    .then(r => unwrap<DbQueryResult>(r));

/** 删除表 */
export const dropDbTable = (tableName: string, datasourceId?: number) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}` + (datasourceId ? `?datasourceId=${datasourceId}` : ""))
    .then(r => unwrap<boolean>(r));

// ==================== 系统管理（进程/服务/网络/磁盘/防火墙/驱动） ====================

/** 进程信息 */
export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  memoryBytes?: number;
  command?: string;
  parentPid?: number;
  threadCount?: number;
  description?: string;
  elapsedTime?: string;
  [key: string]: unknown;
}

/** 线程信息 */
export interface ThreadInfo {
  tid: number;
  cpu?: number;
  memory?: number;
  state?: string;
  name?: string;
  cpuTime?: string;
  [key: string]: unknown;
}

/** 服务信息 */
export interface ServiceInfo {
  name: string;
  displayName?: string;
  status?: string;
  startType?: string;
  description?: string;
  [key: string]: unknown;
}

/** 网络接口信息 */
export interface NetworkInterfaceInfo {
  name?: string;
  status?: string;
  macAddress?: string;
  linkSpeed?: string;
  [key: string]: unknown;
}

/** 网络连接信息 */
export interface NetworkConnectionInfo {
  proto?: string;
  state?: string;
  localAddress?: string;
  remoteAddress?: string;
  process?: string;
  [key: string]: unknown;
}

/** 磁盘信息 */
export interface DiskInfo {
  name?: string;
  size?: number;
  healthStatus?: string;
  [key: string]: unknown;
}

/** 磁盘分区信息 */
export interface PartitionInfo {
  filesystem?: string;
  type?: string;
  size?: string;
  used?: string;
  available?: string;
  usePercent?: string;
  mountPoint?: string;
  [key: string]: unknown;
}

/** 防火墙规则信息 */
export interface FirewallRuleInfo {
  chain?: string;
  num?: number;
  target?: string;
  protocol?: string;
  source?: string;
  destination?: string;
  [key: string]: unknown;
}

/** 驱动信息 */
export interface DriverInfo {
  name?: string;
  size?: number;
  usedBy?: number;
  [key: string]: unknown;
}

/** 获取进程列表 */
export const fetchProcesses = (params?: { keyword?: string; sortBy?: string; sortOrder?: string; limit?: number }) =>
  http()
    .get("/ms/system/processes")
    .query(params ?? {})
    .then(r => unwrap<ProcessInfo[]>(r));

/** 关闭进程 */
export const killProcess = (pid: number) =>
  http()
    .post(`/ms/system/process/${pid}/kill`)
    .then(r => unwrap<string>(r));

/** 获取进程子进程 */
export const fetchProcessChildren = (pid: number) =>
  http()
    .get(`/ms/system/process/${pid}/children`)
    .then(r => unwrap<ProcessInfo[]>(r));

/** 获取进程线程列表 */
export const fetchProcessThreads = (pid: number) =>
  http()
    .get(`/ms/system/process/${pid}/threads`)
    .then(r => unwrap<ThreadInfo[]>(r));

/** 获取服务列表 */
export const fetchServices = (keyword?: string) =>
  http()
    .get("/ms/system/services")
    .query(keyword ? { keyword } : {})
    .then(r => unwrap<ServiceInfo[]>(r));

/** 启动服务 */
export const startService = (name: string) =>
  http()
    .post(`/ms/system/service/${name}/start`)
    .then(r => unwrap<string>(r));

/** 停止服务 */
export const stopService = (name: string) =>
  http()
    .post(`/ms/system/service/${name}/stop`)
    .then(r => unwrap<string>(r));

/** 重启服务 */
export const restartService = (name: string) =>
  http()
    .post(`/ms/system/service/${name}/restart`)
    .then(r => unwrap<string>(r));

/** 获取网络接口列表 */
export const fetchNetworkInterfaces = () =>
  http()
    .get("/ms/system/network/interfaces")
    .then(r => unwrap<NetworkInterfaceInfo[]>(r));

/** 获取网络连接列表 */
export const fetchNetworkConnections = (state?: string) =>
  http()
    .get("/ms/system/network/connections")
    .query(state ? { state } : {})
    .then(r => unwrap<NetworkConnectionInfo[]>(r));

/** 获取磁盘列表 */
export const fetchDisks = () =>
  http()
    .get("/ms/system/disks")
    .then(r => unwrap<DiskInfo[]>(r));

/** 获取磁盘分区列表 */
export const fetchPartitions = () =>
  http()
    .get("/ms/system/partitions")
    .then(r => unwrap<PartitionInfo[]>(r));

/** 获取防火墙规则列表 */
export const fetchFirewallRules = () =>
  http()
    .get("/ms/system/firewall/rules")
    .then(r => unwrap<FirewallRuleInfo[]>(r));

/** 获取驱动列表 */
export const fetchDrivers = () =>
  http()
    .get("/ms/system/drivers")
    .then(r => unwrap<DriverInfo[]>(r));

// ==================== 协议服务器管理（Server / ServerFilter） ====================

/** ServerFilter 插件配置描述 */
export interface ServerFilterDescriptor {
  name: string;
  type?: string;
  order?: number;
  enabled?: boolean;
  params?: Record<string, string>;
}

/** 协议服务器节点视图 */
export interface ServerNodeView {
  id: number;
  name: string;
  protocol: string;
  protocolDesc?: string;
  engine?: string;
  host?: string;
  port?: number;
  enabled?: number;
  remark?: string;
  config?: Record<string, unknown>;
  filters?: ServerFilterDescriptor[];
  status?: string;
  error?: string;
  serverUrl?: string;
}

/** 协议服务器创建/更新请求 */
export interface ServerNodeRequest {
  name: string;
  protocol: string;
  engine?: string;
  host?: string;
  port?: number;
  enabled?: number;
  remark?: string;
  config?: Record<string, unknown>;
  filters?: ServerFilterDescriptor[];
}

/** 协议类型元数据 */
export interface ServerProtocolMeta {
  code: string;
  name: string;
  desc?: string;
  defaultPort?: number;
  [key: string]: unknown;
}

/** ServerFilter 插件类型元数据 */
export interface ServerFilterTypeMeta {
  type: string;
  name: string;
  desc?: string;
  params?: Array<{ key: string; label: string; type: string; default?: string; hint?: string }>;
  [key: string]: unknown;
}

/** 查询全部协议服务器节点 */
export const fetchServerNodes = () =>
  http()
    .get("/ms/monitor/server")
    .then(r => unwrap<ServerNodeView[]>(r));

/** 查询单个协议服务器节点 */
export const fetchServerNode = (id: number) =>
  http()
    .get(`/ms/monitor/server/${id}`)
    .then(r => unwrap<ServerNodeView>(r));

/** 创建协议服务器节点 */
export const createServerNode = (data: ServerNodeRequest) =>
  http()
    .post("/ms/monitor/server")
    .data(data)
    .then(r => unwrap<ServerNodeView>(r));

/** 更新协议服务器节点（实时配置变更，运行中先停后启） */
export const updateServerNode = (id: number, data: ServerNodeRequest) =>
  http()
    .put(`/ms/monitor/server/${id}`)
    .data(data)
    .then(r => unwrap<ServerNodeView>(r));

/** 删除协议服务器节点 */
export const deleteServerNode = (id: number) =>
  http()
    .delete(`/ms/monitor/server/${id}`)
    .then(r => unwrap<void>(r));

/** 启动协议服务器节点 */
export const startServerNode = (id: number) =>
  http()
    .post(`/ms/monitor/server/${id}/start`)
    .then(r => unwrap<ServerNodeView>(r));

/** 停止协议服务器节点 */
export const stopServerNode = (id: number) =>
  http()
    .post(`/ms/monitor/server/${id}/stop`)
    .then(r => unwrap<ServerNodeView>(r));

/** 查询支持的协议类型 */
export const fetchServerProtocols = () =>
  http()
    .get("/ms/monitor/server/protocols")
    .then(r => unwrap<ServerProtocolMeta[]>(r));

/** 查询支持的 ServerFilter 插件类型 */
export const fetchServerFilterTypes = () =>
  http()
    .get("/ms/monitor/server/filters")
    .then(r => unwrap<ServerFilterTypeMeta[]>(r));
