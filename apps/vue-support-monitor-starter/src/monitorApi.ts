import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/**
 * 监控项（/ms/monitor）
 * @author CH
 * @since 4.0.0
 */
export interface MonitorItem {
  id: number;
  monitorName: string;
  monitorHost: string;
  monitorPort: number;
  serviceType: string;
  serverType: string;
  monitorEnabled: number;
}

/**
 * 告警事件（/ms/monitor/alarm/event）
 * @author CH
 * @since 4.0.0
 */
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

/**
 * 获取全部监控项列表
 * @returns 监控项列表
 */
export const fetchMonitors = () =>
  http().get("/ms/monitor").then(r => unwrap<MonitorItem[]>(r));

/**
 * 获取全部告警事件列表
 * @returns 告警事件列表
 */
export const fetchAlarmEvents = () =>
  http().get("/ms/monitor/alarm/event").then(r => unwrap<AlarmEvent[]>(r));

/**
 * 处理告警事件（remark 备注，falseAlarm 标记误报）—— design.md §4.4
 * @param id 告警事件 ID
 * @param remark 处理备注
 * @param falseAlarm 是否标记为误报
 * @returns 处理结果
 */
export const handleAlarmEvent = (id: number, remark: string, falseAlarm: boolean) =>
  http()
    .post(`/ms/monitor/alarm/event/${id}/handle?remark=${encodeURIComponent(remark)}&falseAlarm=${falseAlarm}`)
    .then(r => unwrap<boolean>(r));

/**
 * 告警级别（P0~P4，兜底 P3）
 * @param e 告警事件
 * @returns 归一化后的告警级别字符串
 */
export function alarmLevel(e: AlarmEvent): string {
  const lv = String(e.msMonitorAlarmEventLevel || "").toUpperCase();
  return /^P[0-4]$/.test(lv) ? lv : "P3";
}

/**
 * 判断告警事件是否未处理
 * @param e 告警事件
 * @returns 未处理返回 true
 */
export function isUnhandled(e: AlarmEvent): boolean {
  return String(e.msMonitorAlarmEventStatus || "").toUpperCase() === "NEW";
}

// ==================== 告警策略 / 规则（/ms/monitor/alarm） ====================

/**
 * 告警策略
 * @author CH
 * @since 4.0.0
 */
export interface AlarmPolicy {
  id: number;
  msMonitorAlarmPolicyName: string;
  msMonitorAlarmPolicyEnabled: number;
  msMonitorAlarmPolicyRemark: string;
}

/**
 * 告警规则
 * @author CH
 * @since 4.0.0
 */
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

/**
 * 获取全部告警策略
 * @returns 告警策略列表
 */
export const fetchAlarmPolicies = () =>
  http().get("/ms/monitor/alarm/policy").then(r => unwrap<AlarmPolicy[]>(r));
/**
 * 保存告警策略（id 为 null 时创建，否则更新）
 * @param id 策略 ID，null 表示新建
 * @param d 策略数据
 * @returns 保存后的策略
 */
export const saveAlarmPolicy = (id: number | null, d: Partial<AlarmPolicy>) =>
  id != null
    ? http().put(`/ms/monitor/alarm/policy/${id}`).data(d).then(r => unwrap<AlarmPolicy>(r))
    : http().post("/ms/monitor/alarm/policy").data(d).then(r => unwrap<AlarmPolicy>(r));
/**
 * 删除告警策略
 * @param id 策略 ID
 * @returns 删除结果
 */
export const delAlarmPolicy = (id: number) =>
  http().delete(`/ms/monitor/alarm/policy/${id}`).then(r => unwrap<boolean>(r));

/**
 * 获取告警规则列表
 * @param policyId 策略 ID（可选，不传则查全部）
 * @returns 告警规则列表
 */
export const fetchAlarmRules = (policyId?: number) =>
  http()
    .get(`/ms/monitor/alarm/rule${policyId ? `?policyId=${policyId}` : ""}`)
    .then(r => unwrap<AlarmRule[]>(r));
/**
 * 保存告警规则（id 为 null 时创建，否则更新）
 * @param id 规则 ID，null 表示新建
 * @param d 规则数据
 * @returns 保存后的规则
 */
export const saveAlarmRule = (id: number | null, d: Partial<AlarmRule>) =>
  id != null
    ? http().put(`/ms/monitor/alarm/rule/${id}`).data(d).then(r => unwrap<AlarmRule>(r))
    : http().post("/ms/monitor/alarm/rule").data(d).then(r => unwrap<AlarmRule>(r));
/**
 * 删除告警规则
 * @param id 规则 ID
 * @returns 删除结果
 */
export const delAlarmRule = (id: number) =>
  http().delete(`/ms/monitor/alarm/rule/${id}`).then(r => unwrap<boolean>(r));
/**
 * 测试告警规则
 * @param ruleId 规则 ID
 * @param metricName 测试指标名（可选）
 * @param value 测试值（可选）
 * @returns 测试是否触发告警
 */
export const testAlarmRule = (ruleId: number, metricName?: string, value?: number) =>
  http()
    .get(`/ms/monitor/alarm/rule/${ruleId}/test?metricName=${encodeURIComponent(metricName ?? "")}&value=${value ?? 0}`)
    .then(r => unwrap<boolean>(r));

// ==================== 系统 Redis 信息（当前应用自身连接的 Redis，与监控资产/Agent 无关） ====================

/**
 * 当前系统 Redis 指标（INFO 解析后的 key 数值表）
 * @author CH
 * @since 4.0.0
 */
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

/**
 * 获取当前系统自身连接 Redis 的运行指标
 * @returns Redis 指标信息，无 Redis 时为 null
 */
export const fetchSystemRedisInfo = () =>
  http()
    .get("/ms/monitor/system/redis-info")
    .then(r => unwrap<SystemRedisInfo | null>(r));

// ==================== 监控 Redis 资产时序指标（/ms/monitor/metric/redis） ====================

/**
 * Redis 时序指标行（ms_monitor_redis_metric 表单行）
 * @author CH
 * @since 4.0.0
 */
export interface RedisMetricRow {
  id?: number;
  monitorId: number;
  metricName: string;
  metricValue: number;
  metricTags?: string;
  collectTime: string;
}

/**
 * 获取监控 Redis 资产最新指标（单行）
 * @param monitorId 监控资产 ID
 * @returns 最新一条 Redis 指标
 */
export const getLatestRedisMetric = (monitorId: number) =>
  http()
    .get(`/ms/monitor/metric/redis/${monitorId}`)
    .then(r => unwrap<RedisMetricRow | null>(r));

/**
 * 获取监控 Redis 资产历史指标（按时段查询，返回多行，每行一个指标点）
 * @param monitorId 监控资产 ID
 * @param hours 过去 N 小时，默认 24
 * @returns 历史指标行列表
 */
export const getRedisMetricHistory = (monitorId: number, hours: number = 24) =>
  http()
    .get(`/ms/monitor/metric/redis/history/${monitorId}?hours=${hours}`)
    .then(r => unwrap<RedisMetricRow[]>(r));

// ==================== 系统 Redis KV 操作（直接操作当前应用连接的 Redis） ====================

/**
 * Redis Keys 扫描结果
 * @author CH
 * @since 4.0.0
 */
export interface RedisScanResult {
  keys: string[];
  nextCursor: string;
  total: number;
}

/**
 * Redis Key 详细信息
 * @author CH
 * @since 4.0.0
 */
export interface RedisKeyDetail {
  key: string;
  type: string;
  ttl: number;
  value: string | null;
}

/**
 * 扫描当前系统 Redis Keys
 * @param pattern 键匹配模式，默认 *
 * @param cursor 游标，默认 "0"
 * @param count 每批数量，默认 100
 * @returns 扫描结果
 */
export const scanSystemRedisKeys = (pattern = "*", cursor = "0", count = 100) =>
  http()
    .get("/ms/monitor/system/redis/keys", { params: { pattern, cursor, count } })
    .then(r => unwrap<RedisScanResult>(r));

/**
 * 读取当前系统 Redis Key 值
 * @param key 键名
 * @returns 键值，不存在时为 null
 */
export const getSystemRedisKey = (key: string) =>
  http()
    .get(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}`)
    .then(r => unwrap<string | null>(r));

/**
 * 获取当前系统 Redis Key 详细信息
 * @param key 键名
 * @returns 键详细信息
 */
export const getSystemRedisKeyDetail = (key: string) =>
  http()
    .get(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/detail`)
    .then(r => unwrap<RedisKeyDetail>(r));

/**
 * 写入当前系统 Redis Key
 * @param key 键名
 * @param value 值
 * @param ttl 过期时间（秒），-1 表示永不过期
 * @returns 写入结果
 */
export const setSystemRedisKey = (key: string, value: string, ttl = -1) =>
  http()
    .put(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}`, value, { params: { ttl } })
    .then(r => unwrap<boolean>(r));

/**
 * 删除当前系统 Redis Keys
 * @param keys 键名列表
 * @returns 删除的键数量
 */
export const deleteSystemRedisKeys = (keys: string[]) =>
  http()
    .delete("/ms/monitor/system/redis/keys", { data: keys })
    .then(r => unwrap<number>(r));

/**
 * 设置当前系统 Redis Key 过期时间
 * @param key 键名
 * @param ttl 过期时间（秒）
 * @returns 设置结果
 */
export const expireSystemRedisKey = (key: string, ttl: number) =>
  http()
    .post(`/ms/monitor/system/redis/expire/${encodeURIComponent(key)}`, null, { params: { ttl } })
    .then(r => unwrap<boolean>(r));

// ==================== AI 智能分析 ====================

/**
 * AI 状态
 * @author CH
 * @since 4.0.0
 */
export interface AiStatus {
  enabled: boolean;
  model?: string;
  provider?: string;
}

/**
 * AI 分析结果
 * @author CH
 * @since 4.0.0
 */
export interface AiAnalyzeResult {
  content: string;
  model?: string;
  usage?: unknown;
  hostId?: number;
  hostName?: string;
}

/**
 * 查询 AI 分析是否启用
 * @returns AI 状态
 */
export const fetchAiStatus = () =>
  http()
    .get("/ms/monitor/ai/status")
    .then(r => unwrap<AiStatus>(r));

/**
 * 通用 AI 分析
 * @param prompt 用户提示词
 * @param options 可选配置（systemPrompt / model）
 * @returns AI 分析结果
 */
export const aiAnalyze = (prompt: string, options?: { systemPrompt?: string; model?: string }) =>
  http()
    .post("/ms/monitor/ai/analyze")
    .data({ prompt, systemPrompt: options?.systemPrompt, model: options?.model })
    .then(r => unwrap<AiAnalyzeResult>(r));

/**
 * 主机指标智能分析
 * @param hostId 主机 ID
 * @param options 可选配置（metrics / dimension）
 * @returns AI 分析结果
 */
export const aiAnalyzeHost = (hostId: number, options?: { metrics?: unknown; dimension?: string }) =>
  http()
    .post(`/ms/monitor/ai/host/${hostId}/analyze`)
    .data({ metrics: options?.metrics, dimension: options?.dimension })
    .then(r => unwrap<AiAnalyzeResult>(r));

// ==================== 数据源管理（jdbc/redis/influxdb/neo4j/nacos/zookeeper） ====================

/**
 * 数据源信息
 * @author CH
 * @since 4.0.0
 */
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

/**
 * 获取所有数据源
 * @returns 数据源列表
 */
export const fetchDataSources = () =>
  http()
    .get("/ms/monitor/datasource/list")
    .then(r => unwrap<DataSourceInfo[]>(r));

/**
 * 获取数据源详情
 * @param id 数据源 ID
 * @returns 数据源信息
 */
export const fetchDataSource = (id: number) =>
  http()
    .get(`/ms/monitor/datasource/${id}`)
    .then(r => unwrap<DataSourceInfo>(r));

/**
 * 创建数据源
 * @param data 数据源定义
 * @returns 创建后的数据源
 */
export const createDataSource = (data: Partial<DataSourceInfo>) =>
  http()
    .post("/ms/monitor/datasource")
    .data(data)
    .then(r => unwrap<DataSourceInfo>(r));

/**
 * 更新数据源
 * @param id 数据源 ID
 * @param data 数据源定义
 * @returns 更新后的数据源
 */
export const updateDataSource = (id: number, data: Partial<DataSourceInfo>) =>
  http()
    .put(`/ms/monitor/datasource/${id}`)
    .data(data)
    .then(r => unwrap<DataSourceInfo>(r));

/**
 * 删除数据源
 * @param id 数据源 ID
 * @returns 删除结果
 */
export const deleteDataSource = (id: number) =>
  http()
    .delete(`/ms/monitor/datasource/${id}`)
    .then(r => unwrap<boolean>(r));

/**
 * 测试数据源连接
 * @param id 数据源 ID
 * @returns 连接测试结果
 */
export const testDataSource = (id: number) =>
  http()
    .post(`/ms/monitor/datasource/${id}/test`)
    .then(r => unwrap<{ success: boolean; message: string; type: string }>(r));

/**
 * 获取支持的数据源类型列表
 * @returns 数据源类型列表
 */
export const fetchDataSourceTypes = () =>
  http()
    .get("/ms/monitor/datasource/types")
    .then(r => unwrap<string[]>(r));

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
}

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
    .get("/ms/monitor/db/databases" + (datasourceId ? `?datasourceId=${datasourceId}` : ""))
    .then(r => unwrap<string[]>(r));

/**
 * 获取数据库表列表
 * @param datasourceId 数据源 ID（可选）
 * @param database 数据库名（可选）
 * @returns 表信息列表
 */
export const fetchDbTables = (datasourceId?: number, database?: string) =>
  http()
    .get("/ms/monitor/db/tables" + (datasourceId || database ? `?${datasourceId ? `datasourceId=${datasourceId}` : ""}${database ? `&database=${encodeURIComponent(database)}` : ""}` : ""))
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
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/columns` + (datasourceId || database ? `?${datasourceId ? `datasourceId=${datasourceId}` : ""}${database ? `&database=${encodeURIComponent(database)}` : ""}` : ""))
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
 * @returns 表数据分页结果
 */
export const fetchTableData = (tableName: string, page = 1, pageSize = 50, orderBy?: string, orderDir?: string, datasourceId?: number, database?: string) =>
  http()
    .get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/data?page=${page}&pageSize=${pageSize}` + (orderBy ? `&orderBy=${encodeURIComponent(orderBy)}&orderDir=${orderDir || "ASC"}` : "") + (datasourceId ? `&datasourceId=${datasourceId}` : "") + (database ? `&database=${encodeURIComponent(database)}` : ""))
    .then(r => unwrap<DbTableDataResult>(r));

/**
 * 执行 SQL（支持 SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/DROP）
 * @param sql SQL 语句
 * @param datasourceId 数据源 ID（可选）
 * @returns SQL 执行结果
 */
export const executeDbSql = (sql: string, datasourceId?: number) =>
  http()
    .post("/ms/monitor/db/execute")
    .data({ sql, datasourceId })
    .then(r => unwrap<DbQueryResult>(r));

/**
 * 删除表
 * @param tableName 表名
 * @param datasourceId 数据源 ID（可选）
 * @returns 删除结果
 */
export const dropDbTable = (tableName: string, datasourceId?: number) =>
  http()
    .delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}` + (datasourceId ? `?datasourceId=${datasourceId}` : ""))
    .then(r => unwrap<boolean>(r));

// ==================== 系统管理（进程/服务/网络/磁盘/防火墙/驱动） ====================

/** 进程信息 */
/**
 * 进程信息
 * @author CH
 * @since 4.0.0
 */
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
/**
 * 线程信息
 * @author CH
 * @since 4.0.0
 */
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
/**
 * 服务信息
 * @author CH
 * @since 4.0.0
 */
export interface ServiceInfo {
  name: string;
  displayName?: string;
  status?: string;
  startType?: string;
  description?: string;
  [key: string]: unknown;
}

/** 网络接口信息 */
/**
 * 网络接口信息
 * @author CH
 * @since 4.0.0
 */
export interface NetworkInterfaceInfo {
  name?: string;
  status?: string;
  macAddress?: string;
  linkSpeed?: string;
  [key: string]: unknown;
}

/** 网络连接信息 */
/**
 * 网络连接信息
 * @author CH
 * @since 4.0.0
 */
export interface NetworkConnectionInfo {
  proto?: string;
  state?: string;
  localAddress?: string;
  remoteAddress?: string;
  process?: string;
  [key: string]: unknown;
}

/** 磁盘信息 */
/**
 * 磁盘信息
 * @author CH
 * @since 4.0.0
 */
export interface DiskInfo {
  name?: string;
  size?: number;
  healthStatus?: string;
  [key: string]: unknown;
}

/** 磁盘分区信息 */
/**
 * 磁盘分区信息
 * @author CH
 * @since 4.0.0
 */
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
/**
 * 防火墙规则信息
 * @author CH
 * @since 4.0.0
 */
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
/**
 * 驱动信息
 * @author CH
 * @since 4.0.0
 */
export interface DriverInfo {
  name?: string;
  size?: number;
  usedBy?: number;
  [key: string]: unknown;
}

/** 获取进程列表 */
export const fetchProcesses = (params?: { keyword?: string; sortBy?: string; sortOrder?: string; limit?: number; hostId?: number }) =>
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
export const fetchServices = (keyword?: string, hostId?: number) =>
  http()
    .get("/ms/system/services")
    .query({ ...(keyword ? { keyword } : {}), ...(hostId ? { hostId } : {}) })
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
export const fetchNetworkInterfaces = (hostId?: number) =>
  http()
    .get("/ms/system/network/interfaces")
    .query(hostId ? { hostId } : {})
    .then(r => unwrap<NetworkInterfaceInfo[]>(r));

/** 获取网络连接列表 */
export const fetchNetworkConnections = (state?: string, hostId?: number) =>
  http()
    .get("/ms/system/network/connections")
    .query({ ...(state ? { state } : {}), ...(hostId ? { hostId } : {}) })
    .then(r => unwrap<NetworkConnectionInfo[]>(r));

/** 获取磁盘列表 */
export const fetchDisks = (hostId?: number) =>
  http()
    .get("/ms/system/disks" + (hostId ? `?hostId=${hostId}` : ""))
    .then(r => unwrap<DiskInfo[]>(r));

/** 获取磁盘分区列表 */
export const fetchPartitions = (hostId?: number) =>
  http()
    .get("/ms/system/partitions")
    .query(hostId ? { hostId } : {})
    .then(r => unwrap<PartitionInfo[]>(r));

/** 获取防火墙规则列表 */
export const fetchFirewallRules = (hostId?: number) =>
  http()
    .get("/ms/system/firewall/rules")
    .query(hostId ? { hostId } : {})
    .then(r => unwrap<FirewallRuleInfo[]>(r));

/** 获取驱动列表 */
export const fetchDrivers = (hostId?: number) =>
  http()
    .get("/ms/system/drivers")
    .query(hostId ? { hostId } : {})
    .then(r => unwrap<DriverInfo[]>(r));

// ==================== 协议服务器管理（Server / ServerFilter） ====================

/** ServerFilter 插件配置描述 */
/**
 * ServerFilter 插件配置描述
 * @author CH
 * @since 4.0.0
 */
export interface ServerFilterDescriptor {
  name: string;
  type?: string;
  order?: number;
  enabled?: boolean;
  params?: Record<string, string>;
}

/** 协议服务器节点视图 */
/**
 * 协议服务器节点视图
 * @author CH
 * @since 4.0.0
 */
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
/**
 * 协议服务器创建/更新请求
 * @author CH
 * @since 4.0.0
 */
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
/**
 * 协议类型元数据
 * @author CH
 * @since 4.0.0
 */
export interface ServerProtocolMeta {
  code: string;
  alias?: string;
  desc?: string;
  defaultPort?: number;
  defaultEngine?: string;
  requiresBackend?: boolean;
  spi?: boolean;
  params?: Array<{ name: string; defaultValue?: string; desc?: string; type?: string }>;
  [key: string]: unknown;
}

/** ServerFilter 插件类型元数据 */
/**
 * ServerFilter 插件类型元数据
 * @author CH
 * @since 4.0.0
 */
export interface ServerFilterTypeMeta {
  type: string;
  desc?: string;
  params?:
    | Array<{ name: string; defaultValue?: string; desc?: string; type?: string }>
    | Record<string, string>;
  require?: string;
  spi?: boolean;
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

// ==================== 外部服务管理（InfluxDB / Neo4j / Nacos / ZooKeeper） ====================

// ---------- InfluxDB 时序数据库管理 ----------

/**
 * InfluxDB Bucket 信息
 * @author CH
 * @since 4.0.0
 */
export interface InfluxdbBucket {
  id: string;
  name: string;
  retentionHours: number;
  seriesCount: number;
  createdAt: string;
}

/**
 * InfluxDB 度量信息
 * @author CH
 * @since 4.0.0
 */
export interface InfluxdbMeasurement {
  name: string;
  fieldCount: number;
  tagCount: number;
  lastWriteTime: string;
}

/**
 * 测试 InfluxDB 连接
 * @param config 连接配置
 */
export const testInfluxdbConnection = (config: Record<string, unknown>) =>
  http().post("/ms/monitor/influxdb/test").data(config).then(r => unwrap<{ connected: boolean; version: string; message: string }>(r));

/**
 * 获取 InfluxDB Bucket 列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchInfluxdbBuckets = (datasourceId?: number) =>
  http().get("/ms/monitor/influxdb/buckets", { params: { datasourceId } }).then(r => unwrap<InfluxdbBucket[]>(r));

/**
 * 获取 InfluxDB 度量列表
 * @param datasourceId 数据源 ID（可选）
 * @param bucket Bucket 名（可选）
 */
export const fetchInfluxdbMeasurements = (datasourceId?: number, bucket?: string) =>
  http().get("/ms/monitor/influxdb/measurements", { params: { datasourceId, bucket } }).then(r => unwrap<InfluxdbMeasurement[]>(r));

/**
 * 执行 InfluxDB Flux 查询
 * @param flux Flux 查询语句
 * @param datasourceId 数据源 ID（可选）
 */
export const executeInfluxdbQuery = (flux: string, datasourceId?: number) =>
  http().post("/ms/monitor/influxdb/query").data({ flux, datasourceId }).then(r => unwrap<{ query: string; executionTimeMs: number; rows: Record<string, unknown>[]; rowCount: number }>(r));

// ---------- Neo4j 图数据库管理 ----------

/**
 * Neo4j 标签信息
 * @author CH
 * @since 4.0.0
 */
export interface Neo4jLabel {
  name: string;
  nodeCount: number;
  propertyCount: number;
}

/**
 * Neo4j 关系类型信息
 * @author CH
 * @since 4.0.0
 */
export interface Neo4jRelationship {
  type: string;
  relationshipCount: number;
  propertyCount: number;
}

/**
 * 测试 Neo4j 连接
 * @param config 连接配置
 */
export const testNeo4jConnection = (config: Record<string, unknown>) =>
  http().post("/ms/monitor/neo4j/test").data(config).then(r => unwrap<{ connected: boolean; version: string; edition: string; message: string }>(r));

/**
 * 获取 Neo4j 标签列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNeo4jLabels = (datasourceId?: number) =>
  http().get("/ms/monitor/neo4j/labels", { params: { datasourceId } }).then(r => unwrap<Neo4jLabel[]>(r));

/**
 * 获取 Neo4j 关系类型列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNeo4jRelationships = (datasourceId?: number) =>
  http().get("/ms/monitor/neo4j/relationships", { params: { datasourceId } }).then(r => unwrap<Neo4jRelationship[]>(r));

/**
 * 执行 Neo4j Cypher 查询
 * @param cypher Cypher 查询语句
 * @param datasourceId 数据源 ID（可选）
 */
export const executeNeo4jQuery = (cypher: string, datasourceId?: number) =>
  http().post("/ms/monitor/neo4j/query").data({ cypher, datasourceId }).then(r => unwrap<{ query: string; executionTimeMs: number; rows: Record<string, unknown>[]; rowCount: number }>(r));

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
export const testNacosConnection = (config: Record<string, unknown>) =>
  http().post("/ms/monitor/nacos/test").data(config).then(r => unwrap<{ connected: boolean; version: string; message: string }>(r));

/**
 * 获取 Nacos 命名空间列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNacosNamespaces = (datasourceId?: number) =>
  http().get("/ms/monitor/nacos/namespaces", { params: { datasourceId } }).then(r => unwrap<NacosNamespace[]>(r));

/**
 * 分页获取 Nacos 配置列表
 * @param params 查询参数（命名空间/分组/dataId/分页）
 */
export const fetchNacosConfigs = (params: { datasourceId?: number; namespace?: string; group?: string; dataId?: string; page?: number; pageSize?: number }) =>
  http().get("/ms/monitor/nacos/configs", { params }).then(r => unwrap<{ list: NacosConfig[]; total: number; page: number; pageSize: number }>(r));

/**
 * 获取 Nacos 配置详情
 * @param dataId 配置 dataId
 * @param params 命名空间/分组
 */
export const fetchNacosConfigDetail = (dataId: string, params: { namespace?: string; group?: string }) =>
  http().get(`/ms/monitor/nacos/config/${encodeURIComponent(dataId)}`, { params }).then(r => unwrap<NacosConfigDetail>(r));

/**
 * 保存 Nacos 配置
 * @param config 配置内容
 */
export const saveNacosConfig = (config: Partial<NacosConfigDetail>) =>
  http().post("/ms/monitor/nacos/config").data(config).then(r => unwrap<boolean>(r));

/**
 * 删除 Nacos 配置
 * @param dataId 配置 dataId
 * @param params 命名空间/分组
 */
export const deleteNacosConfig = (dataId: string, params: { namespace?: string; group?: string }) =>
  http().delete(`/ms/monitor/nacos/config/${encodeURIComponent(dataId)}`, { params }).then(r => unwrap<boolean>(r));

/**
 * 获取 Nacos 服务列表
 * @param datasourceId 数据源 ID（可选）
 * @param namespace 命名空间（可选）
 */
export const fetchNacosServices = (datasourceId?: number, namespace?: string) =>
  http().get("/ms/monitor/nacos/services", { params: { datasourceId, namespace } }).then(r => unwrap<NacosService[]>(r));

/**
 * 获取 Nacos 集群节点列表
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchNacosClusterNodes = (datasourceId?: number) =>
  http().get("/ms/monitor/nacos/cluster/nodes", { params: { datasourceId } }).then(r => unwrap<NacosClusterNode[]>(r));

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
 * 测试 ZooKeeper 连接
 * @param config 连接配置
 */
export const testZookeeperConnection = (config: Record<string, unknown>) =>
  http().post("/ms/monitor/zookeeper/test").data(config).then(r => unwrap<{ connected: boolean; version: string; sessionId: string; message: string }>(r));

/**
 * 获取 ZooKeeper 节点树
 * @param datasourceId 数据源 ID（可选）
 * @param path 节点路径
 */
export const fetchZkTree = (datasourceId?: number, path = "/") =>
  http().get("/ms/monitor/zookeeper/tree", { params: { datasourceId, path } }).then(r => unwrap<ZkNode[]>(r));

/**
 * 获取 ZooKeeper 节点详情
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchZkNodeDetail = (path: string, datasourceId?: number) =>
  http().get("/ms/monitor/zookeeper/node", { params: { path, datasourceId } }).then(r => unwrap<ZkNodeDetail>(r));

/**
 * 获取 ZooKeeper 子节点列表
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchZkChildren = (path: string, datasourceId?: number) =>
  http().get("/ms/monitor/zookeeper/children", { params: { path, datasourceId } }).then(r => unwrap<ZkChildNode[]>(r));

/**
 * 创建 ZooKeeper 节点
 * @param request 节点请求
 */
export const createZkNode = (request: { path: string; data?: string; ephemeral?: boolean }) =>
  http().post("/ms/monitor/zookeeper/node").data(request).then(r => unwrap<boolean>(r));

/**
 * 更新 ZooKeeper 节点数据
 * @param request 节点请求
 */
export const updateZkNode = (request: { path: string; data: string }) =>
  http().put("/ms/monitor/zookeeper/node").data(request).then(r => unwrap<boolean>(r));

/**
 * 删除 ZooKeeper 节点
 * @param path 节点路径
 */
export const deleteZkNode = (path: string) =>
  http().delete("/ms/monitor/zookeeper/node", { params: { path } }).then(r => unwrap<boolean>(r));
