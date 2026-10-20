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
 * 新增/更新监控资产请求体（/ms/monitor）
 * @author CH
 * @since 4.0.0
 */
export type MonitorPayload = {
  monitorName: string;
  monitorHost: string;
  monitorPort: number;
  serviceType: string;
  serverType?: string;
  monitorGroup?: string;
  monitorDescription?: string;
  monitorEnabled?: number;
};

/**
 * 监控采集任务（/ms/monitor/task）
 * @author CH
 * @since 4.0.0
 */
export interface MonitorTaskItem {
  id: number;
  monitorId: number;
  monitorTaskName: string;
  serviceType: string;
  /** 采集方式: LOCAL / TERMINAL / HTTP / PROMETHEUS */
  provider: string;
  /** 采集参数 JSON 串 */
  collectConfig: string;
  monitorTaskCron: string;
  monitorTaskTimeout?: number;
  monitorTaskEnabled: number;
  lastRunTime?: string;
}

/**
 * 新增/更新采集任务请求体
 * @author CH
 * @since 4.0.0
 */
export type MonitorTaskPayload = {
  monitorId: number;
  monitorTaskName: string;
  serviceType: string;
  provider: string;
  collectConfig: string;
  monitorTaskCron: string;
  monitorTaskTimeout?: number;
  monitorTaskEnabled: number;
  monitorTaskRemark?: string;
};

/**
 * 保存监控资产（id 为 null 时创建，否则更新）
 * @param id 资产 ID，null 表示新建
 * @param d 资产数据
 * @returns 保存后的资产
 */
export const saveMonitor = (id: number | null, d: MonitorPayload) =>
  id != null
    ? http().put(`/ms/monitor/${id}`).data(d).then(r => unwrap<MonitorItem>(r))
    : http().post("/ms/monitor").data(d).then(r => unwrap<MonitorItem>(r));

/**
 * 删除监控资产
 * @param id 资产 ID
 * @returns 删除结果
 */
export const delMonitor = (id: number) =>
  http().delete(`/ms/monitor/${id}`).then(r => unwrap<boolean>(r));

/**
 * 查询采集任务列表
 * @param monitorId 资产 ID（可选，不传则返回全部启用任务）
 * @returns 任务列表
 */
export const fetchMonitorTasks = (monitorId?: number) =>
  http()
    .get(`/ms/monitor/task${monitorId != null ? `?monitorId=${monitorId}` : ""}`)
    .then(r => unwrap<MonitorTaskItem[]>(r));

/**
 * 保存采集任务（id 为 null 时创建，否则更新）
 * @param id 任务 ID，null 表示新建
 * @param d 任务数据
 * @returns 保存后的任务
 */
export const saveMonitorTask = (id: number | null, d: MonitorTaskPayload) =>
  id != null
    ? http().put(`/ms/monitor/task/${id}`).data(d).then(r => unwrap<MonitorTaskItem>(r))
    : http().post("/ms/monitor/task").data(d).then(r => unwrap<MonitorTaskItem>(r));

/**
 * 手动触发一次采集（后端异步执行，返回仅表示已受理）
 * @param taskId 任务 ID
 * @returns 是否受理
 */
export const triggerCollect = (taskId: number) =>
  http().post(`/ms/monitor/task/${taskId}/trigger`).then(r => unwrap<boolean>(r));

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

/**
 * 告警维护窗口（静默时段）
 *
 * 后端在产生告警事件前会按「启用 + 级别 + 星期 + 每日时段」匹配窗口，命中则跳过告警。
 * startTime/endTime 为 HH:mm，weekdays 为逗号分隔的星期数字（周日=0，留空表示每天）。
 * @author CH
 * @since 4.0.0
 */
export interface AlarmMaintenanceWindow {
  id: number;
  policyId: number | null;
  windowName: string;
  msMonitorAlarmMaintenanceWindowLevel: string | null;
  startTime: string;
  endTime: string;
  weekdays: string | null;
  msMonitorAlarmMaintenanceWindowEnabled: number;
  remark: string | null;
}

/**
 * 获取维护窗口列表
 * @param policyId 策略 ID（可选，不传则查全部）
 * @returns 维护窗口列表
 */
export const fetchAlarmWindows = (policyId?: number) =>
  http().get("/ms/monitor/alarm/maintenance-window").query({ policyId }).then(r => unwrap<AlarmMaintenanceWindow[]>(r));
/**
 * 保存维护窗口（id 为 null 时创建，否则更新）
 * @param id 窗口 ID，null 表示新建
 * @param d 窗口数据
 * @returns 保存后的窗口
 */
export const saveAlarmWindow = (id: number | null, d: Partial<AlarmMaintenanceWindow>) =>
  id != null
    ? http().put(`/ms/monitor/alarm/maintenance-window/${id}`).data(d).then(r => unwrap<AlarmMaintenanceWindow>(r))
    : http().post("/ms/monitor/alarm/maintenance-window").data(d).then(r => unwrap<AlarmMaintenanceWindow>(r));
/**
 * 删除维护窗口
 * @param id 窗口 ID
 * @returns 删除结果
 */
export const delAlarmWindow = (id: number) =>
  http().delete(`/ms/monitor/alarm/maintenance-window/${id}`).then(r => unwrap<boolean>(r));

// ==================== 系统 Redis 信息（当前应用自身连接的 Redis，与监控资产/Agent 无关） ====================

// 说明：原「系统自身 Redis 运行指标」接口（SystemRedisInfo + fetchSystemRedisInfo，
// /ms/monitor/system/redis-info）随「Redis 监控」页一并下线。下方「Redis 资产时序指标」
// 是另一套功能（主机侧 Redis exporter 的 /ms/monitor/metric/redis），不受影响。
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
 * Redis 哈希字段 / 流消息字段
 * @author CH
 * @since 4.0.0
 */
export type RedisHashField = {
  field: string;
  value: string;
};

/**
 * Redis 有序集合成员
 * @author CH
 * @since 4.0.0
 */
export type RedisMemberScore = {
  member: string;
  score: number;
};

/**
 * Redis 流消息
 * @author CH
 * @since 4.0.0
 */
export interface RedisStreamEntry {
  id: string;
  fields: RedisHashField[];
}

/**
 * Redis Key 详细信息
 *
 * <p>value 随 type 变化：STRING 为字符串，LIST/SET 为数组，HASH 为字段值对象，
 * ZSET 为成员分值数组，STREAM 为流消息数组。</p>
 *
 * @author CH
 * @since 4.0.0
 */
export interface RedisKeyDetail {
  key: string;
  type: string;
  ttl: number;
  value: string | string[] | RedisHashField[] | RedisMemberScore[] | RedisStreamEntry[] | Record<string, string> | null;
  size: number | null;
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
    .get("/ms/monitor/system/redis/keys").query({ pattern, cursor, count })
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
    .put(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}`).data({ value }).query({ ttl })
    .then(r => unwrap<boolean>(r));

/**
 * 删除当前系统 Redis Keys
 * @param keys 键名列表
 * @returns 删除的键数量
 */
export const deleteSystemRedisKeys = (keys: string[]) =>
  http()
    .delete("/ms/monitor/system/redis/keys").data(keys)
    .then(r => unwrap<number>(r));

/**
 * 设置当前系统 Redis Key 过期时间
 * @param key 键名
 * @param ttl 过期时间（秒）
 * @returns 设置结果
 */
export const expireSystemRedisKey = (key: string, ttl: number) =>
  http()
    .post(`/ms/monitor/system/redis/expire/${encodeURIComponent(key)}`).query({ ttl })
    .then(r => unwrap<boolean>(r));

// ==================== 集合类型元素级操作（HASH/LIST/SET/ZSET/STREAM） ====================

/**
 * 写入哈希字段（字段已存在则覆盖）
 * @param key 键名
 * @param field 字段
 * @returns 是否新增字段
 */
export const putRedisHashField = (key: string, field: RedisHashField) =>
  http()
    .post(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/hash`).data(field)
    .then(r => unwrap<boolean>(r));

/**
 * 删除哈希字段
 * @param key 键名
 * @param field 字段名
 * @returns 删除数量
 */
export const removeRedisHashField = (key: string, field: string) =>
  http()
    .delete(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/hash`).query({ field })
    .then(r => unwrap<number>(r));

/**
 * 追加列表元素
 * @param key 键名
 * @param value 元素值
 * @returns 追加后的列表长度
 */
export const pushRedisListItem = (key: string, value: string) =>
  http()
    .post(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/list`).data({ value })
    .then(r => unwrap<number>(r));

/**
 * 按下标覆盖列表元素
 * @param key 键名
 * @param index 下标
 * @param value 元素值
 * @returns 是否成功
 */
export const setRedisListItem = (key: string, index: number, value: string) =>
  http()
    .put(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/list`).data({ index, value })
    .then(r => unwrap<boolean>(r));

/**
 * 按下标删除列表元素
 * @param key 键名
 * @param index 下标
 * @returns 删除数量
 */
export const removeRedisListItem = (key: string, index: number) =>
  http()
    .delete(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/list`).query({ index })
    .then(r => unwrap<number>(r));

/**
 * 添加集合成员
 * @param key 键名
 * @param value 成员值
 * @returns 是否新增成员
 */
export const addRedisSetMember = (key: string, value: string) =>
  http()
    .post(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/set`).data({ value })
    .then(r => unwrap<boolean>(r));

/**
 * 删除集合成员
 * @param key 键名
 * @param value 成员值
 * @returns 删除数量
 */
export const removeRedisSetMember = (key: string, value: string) =>
  http()
    .delete(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/set`).query({ value })
    .then(r => unwrap<number>(r));

/**
 * 写入有序集合成员
 * @param key 键名
 * @param member 成员与分值
 * @returns 是否新增成员
 */
export const addRedisZsetMember = (key: string, member: RedisMemberScore) =>
  http()
    .post(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/zset`).data(member)
    .then(r => unwrap<boolean>(r));

/**
 * 删除有序集合成员
 * @param key 键名
 * @param member 成员值
 * @returns 删除数量
 */
export const removeRedisZsetMember = (key: string, member: string) =>
  http()
    .delete(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/zset`).query({ member })
    .then(r => unwrap<number>(r));

/**
 * 追加流消息（消息 ID 由 Redis 生成）
 * @param key 键名
 * @param fields 字段列表
 * @returns 新消息 ID
 */
export const appendRedisStreamEntry = (key: string, fields: RedisHashField[]) =>
  http()
    .post(`/ms/monitor/system/redis/kv/${encodeURIComponent(key)}/stream`).data({ fields })
    .then(r => unwrap<string>(r));

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
 * @param hostId 主机 ID（ms_server_host.id）
 * @param options 可选配置（dimension 分析重点 / systemPrompt / model）
 * @returns AI 分析结果
 */
export const aiAnalyzeHost = (
  hostId: number,
  options?: { dimension?: string; systemPrompt?: string; model?: string }
) =>
  http()
    .post(`/ms/monitor/ai/host/${hostId}/analyze`)
    .data({
      dimension: options?.dimension,
      systemPrompt: options?.systemPrompt,
      model: options?.model,
    })
    // 大模型同步回包可能超过默认 10s，超时后前端会误报"分析失败"
    .timeout(120_000)
    .then(r => unwrap<AiAnalyzeResult>(r));

// ==================== 数据源管理（jdbc/redis/influxdb/neo4j/nacos/zookeeper） ====================
// 数据源能力已抽为共享包 @pages/datasource（页面 + API + 类型），
// 后端为独立模块 spring-support-datasource-hub-starter。
// 此处不再重复实现 /ms/datasource/* 端点，请从 "@pages/datasource/src/api" 引入。


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
  priority?: string;
  waitReason?: string;
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
export const fetchProcesses = (params?: { keyword?: string; sortBy?: string; sortOrder?: string; limit?: number; page?: number; pageSize?: number; hostId?: number }) =>
  http()
    .get("/ms/system/processes")
    .query(params ?? {})
    .then(r => unwrap<{ list: ProcessInfo[]; total: number }>(r));

/** 关闭进程 */
export const killProcess = (pid: number, hostId?: number) =>
  http()
    .post(`/ms/system/process/${pid}/kill${hostId ? `?hostId=${hostId}` : ""}`)
    .then(r => unwrap<string>(r));

/** 获取进程子进程 */
export const fetchProcessChildren = (pid: number, hostId?: number) =>
  http()
    .get(`/ms/system/process/${pid}/children`)
    .query(hostId ? { hostId } : {})
    .then(r => unwrap<ProcessInfo[]>(r));

/** 获取进程线程列表 */
export const fetchProcessThreads = (pid: number, hostId?: number) =>
  http()
    .get(`/ms/system/process/${pid}/threads`)
    .query(hostId ? { hostId } : {})
    .then(r => unwrap<ThreadInfo[]>(r));

/** 获取服务列表 */
export const fetchServices = (keyword?: string, hostId?: number) =>
  http()
    .get("/ms/system/services")
    .query({ ...(keyword ? { keyword } : {}), ...(hostId ? { hostId } : {}) })
    .then(r => unwrap<{ list: ServiceInfo[]; total: number }>(r));

/** 启动服务 */
export const startService = (name: string, hostId?: number) =>
  http()
    .post(`/ms/system/service/${encodeURIComponent(name)}/start${hostId ? `?hostId=${hostId}` : ""}`)
    .then(r => unwrap<string>(r));

/** 停止服务 */
export const stopService = (name: string, hostId?: number) =>
  http()
    .post(`/ms/system/service/${encodeURIComponent(name)}/stop${hostId ? `?hostId=${hostId}` : ""}`)
    .then(r => unwrap<string>(r));

/** 重启服务 */
export const restartService = (name: string, hostId?: number) =>
  http()
    .post(`/ms/system/service/${encodeURIComponent(name)}/restart${hostId ? `?hostId=${hostId}` : ""}`)
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
  http().get("/ms/system/drivers").query(hostId ? { hostId } : {})
    .then(r => unwrap<DriverInfo[]>(r));

/** 重启进程（后端按原命令行与工作目录重新拉起） */
export const restartHostProcess = (pid: number, hostId?: number) =>
  http().post("/ms/system/process/restart").query({ pid, ...(hostId ? { hostId } : {}) })
    .timeout(60_000)
    .then(r => unwrap<string>(r));

/** 关闭占用端口的进程 */
export const closeNetProcess = (pid: number, port?: number, hostId?: number) =>
  http().post("/ms/system/netproc/close").query({ pid, ...(port ? { port } : {}), ...(hostId ? { hostId } : {}) })
    .timeout(60_000)
    .then(r => unwrap<string>(r));

/* ---------- 环境变量 增/删（系统级，按平台经 SPI 下发） ---------- */

/** 环境变量写入载荷 */
export type EnvVarInput = { name: string; value: string };

/** 新增/更新系统级环境变量（Windows 写 Machine，Linux 写 /etc/environment） */
export const setHostEnvVar = (hostId: number, name: string, value: string) =>
  http().post("/ms/system/env/set").query({ hostId }).data({ name, value })
    .timeout(60_000)
    .then(r => unwrap<string>(r));

/** 删除系统级环境变量 */
export const deleteHostEnvVar = (hostId: number, name: string) =>
  http().post("/ms/system/env/delete").query({ hostId, name })
    .timeout(60_000)
    .then(r => unwrap<string>(r));

/* ---------- 防火墙规则 增/删（按平台经 SPI 下发） ---------- */

/** 防火墙规则新增载荷：name 规则名；direction in/out；action allow/block；protocol tcp/udp；localPort 端口；program 程序路径（可选） */
export type FirewallRuleInput = {
  name: string;
  direction?: string;
  action?: string;
  protocol?: string;
  localPort?: string;
  program?: string;
};

/** 新增防火墙规则（Windows netsh advfirewall，Linux iptables） */
export const addHostFirewallRule = (hostId: number, rule: FirewallRuleInput) =>
  http().post("/ms/system/firewall/add").query({ hostId }).data(rule)
    .timeout(60_000)
    .then(r => unwrap<string>(r));

/**
 * 删除防火墙规则：Windows 按规则名 name；Linux 按 chain + num（行号）。
 */
export const deleteHostFirewallRule = (
  hostId: number, name: string, chain?: string, num?: number
) =>
  http().post("/ms/system/firewall/delete")
    .query({ hostId, name, ...(chain ? { chain } : {}), ...(num ? { num } : {}) })
    .timeout(60_000)
    .then(r => unwrap<string>(r));

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
export type ServerNodeRequest = {
  name: string;
  protocol: string;
  engine?: string;
  host?: string;
  port?: number;
  enabled?: number;
  remark?: string;
  config?: Record<string, unknown>;
  filters?: ServerFilterDescriptor[];
};

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
  /** 分组标识：storage / discovery / routing / proxy / other / custom（custom 为 FQCN 说明项，不可选） */
  group?: string;
  /** 深度查看页路由（仅 detailKind=route 时有值） */
  detailPage?: string;
  /** 深度查看目标：node=插件自身 HTTP 服务，route=宿主应用托管页面 */
  detailKind?: "node" | "route";
  /** 深度查看按钮文案 */
  detailLabel?: string;
  [key: string]: unknown;
}

/** 查询全部协议服务器节点 */
export const fetchServerNodes = () =>
  http()
    .get("/ms/monitor/server")
    .noToast(true)
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
    .noToast(true)
    .data(data)
    .then(r => unwrap<ServerNodeView>(r));

/** 更新协议服务器节点（实时配置变更，运行中先停后启） */
export const updateServerNode = (id: number, data: ServerNodeRequest) =>
  http()
    .put(`/ms/monitor/server/${id}`)
    .noToast(true)
    .data(data)
    .then(r => unwrap<ServerNodeView>(r));

/** 删除协议服务器节点 */
export const deleteServerNode = (id: number) =>
  http()
    .delete(`/ms/monitor/server/${id}`)
    .noToast(true)
    .then(r => unwrap<void>(r));

/** 查询代理类协议服务器节点（反向代理 / TCP 代理） */
export const fetchProxyServers = () =>
  http()
    .get("/ms/monitor/server/proxies")
    .noToast(true)
    .then(r => unwrap<ServerNodeView[]>(r));

/** 启动协议服务器节点 */
export const startServerNode = (id: number) =>
  http()
    .post(`/ms/monitor/server/${id}/start`)
    .noToast(true)
    .then(r => unwrap<ServerNodeView>(r));

/** 停止协议服务器节点 */
export const stopServerNode = (id: number) =>
  http()
    .post(`/ms/monitor/server/${id}/stop`)
    .noToast(true)
    .then(r => unwrap<ServerNodeView>(r));

/** 查询支持的协议类型 */
export const fetchServerProtocols = () =>
  http()
    .get("/ms/monitor/server/protocols")
    .noToast(true)
    .then(r => unwrap<ServerProtocolMeta[]>(r));

/** 查询支持的 ServerFilter 插件类型 */
export const fetchServerFilterTypes = () =>
  http()
    .get("/ms/monitor/server/filters")
    .then(r => unwrap<ServerFilterTypeMeta[]>(r));


/* ==================== 主机画像（数据全部来自目标机 Agent） ==================== */

/** 画像概览负载 */
export interface HostProfile {
  info: Record<string, any>;
  metrics: Record<string, any>;
  host: Record<string, any>;
  port: number;
  osMismatch?: string | null;
  collectedAt?: string;
}

/**
 * 拉取主机画像概览
 * @param hostId 主机 id
 * @param opts.live    是否实时采集：默认 false 只读台账快照（进入画像不触发采集）；true 经通道实时拉取
 * @param opts.persist 实时采集时是否回写主机台账，默认 true（仅 live=true 生效）
 */
export const fetchHostProfile = (
  hostId: number,
  opts: { live?: boolean; persist?: boolean } = {}
) =>
  http().get(`/ms/server/host/profile/${hostId}`)
    .query({ live: opts.live ?? false, persist: opts.persist ?? true })
    // 高延迟/不稳定链路（如 Tailscale 远程）整段画像较慢，放宽到 90s 避免误报失败
    .timeout(90_000)
    .then(r => unwrap<HostProfile>(r));

/**
 * 拉取主机画像某个分区
 * @param hostId 主机 id
 * @param section ports/processes/services/disks/network/env
 * @param page 页码（进程/服务）
 * @param size 每页条数（进程/服务）
 * @param keyword 关键字（进程/服务，匹配 PID/名称/用户/命令行，跨页命中）
 */
export const fetchHostProfileSection = (hostId: number, section: string, page?: number, size?: number, keyword?: string) =>
  http().get(`/ms/server/host/profile/${hostId}/${section}`).query({ page, size, keyword })
    .timeout(60_000)
    .then(r => unwrap<any>(r));

/** 从 fetchHostProfileSection 响应中提取行数组（兼容 SectionPage 和裸数组） */
export function sectionRows(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.rows)) return res.rows;
  return [];
}

/* ==================== 主机网卡（/ms/server/host/network） ==================== */

/** 网卡详情（状态/属性） */
export type NetworkAdapterDetail = {
  name: string;
  ifIndex: number;
  description: string;
  status: string;
  macAddress: string;
  linkSpeed: string;
  mtu: number;
  dhcpEnabled: boolean;
  ipv4Addresses: string[];
  ipv6Addresses: string[];
  gateways: string[];
  dnsServers: string[];
};

/** IPv4 配置 */
export type IPv4Config = {
  adapterName?: string;
  ifIndex?: number;
  dhcp?: boolean;
  address?: string;
  prefixLength?: number;
  gateway?: string;
  dnsDhcp?: boolean;
  dnsPreferred?: string;
  dnsAlternate?: string;
};

/** 读取网卡详情 */
export const fetchAdapterDetail = (hostId: number, name: string) =>
  http().get(`/ms/server/host/network/${hostId}/adapter`).query({ name })
    .timeout(30_000)
    .then(r => unwrap<NetworkAdapterDetail>(r));

/** 列出主机全部可见网卡（Windows，名称与系统一致） */
export const fetchAdapters = (hostId: number) =>
  http().get(`/ms/server/host/network/${hostId}/adapters`)
    .timeout(30_000)
    .then(r => unwrap<NetworkAdapterDetail[]>(r));

/** 读取 IPv4 配置 */
export const fetchIPv4Config = (hostId: number, name: string) =>
  http().get(`/ms/server/host/network/${hostId}/ipv4`).query({ name })
    .timeout(30_000)
    .then(r => unwrap<IPv4Config>(r));

/** 下发 IPv4 配置（DHCP / 静态地址、网关、DNS） */
export const saveIPv4Config = (hostId: number, config: IPv4Config) =>
  http().put(`/ms/server/host/network/${hostId}/ipv4`).data(config)
    .timeout(30_000)
    .then(r => unwrap<void>(r));

/* ==================== 文件资产（/ms/monitor/file-assets） ==================== */

/**
 * 文件资产条目
 * @author CH
 * @since 4.0.0.42
 */
export type FileAssetItem = {
  name: string;
  path: string;
  directory: boolean;
  size: number;
  lastModified: number;
};

/**
 * 列出可用存储桶
 * @returns 存储桶名称列表
 */
export const fetchFileAssetBuckets = () =>
  http().get("/ms/monitor/file-assets/buckets").then(r => unwrap<string[]>(r));

/**
 * 列出目录内容
 * @param path 目录路径，空串表示根目录
 * @param bucket 存储桶，留空取默认存储
 * @returns 条目列表
 */
export const fetchFileAssets = (path: string, bucket?: string) =>
  http().get("/ms/monitor/file-assets/list").query({ path, bucket }).then(r => unwrap<FileAssetItem[]>(r));

/**
 * 上传文件
 * @param path 目标目录
 * @param file 文件
 * @param bucket 存储桶，留空取默认存储
 * @returns 写入后的条目
 */
export const uploadFileAsset = (path: string, file: File, bucket?: string) => {
  const form = new FormData();
  form.append("file", file);
  return http().post("/ms/monitor/file-assets/upload")
    .query({ path, bucket })
    .data(form)
    .then(r => unwrap<FileAssetItem>(r));
};

/**
 * 删除文件或目录
 * @param path 对象路径
 * @param bucket 存储桶，留空取默认存储
 * @returns 是否删除成功
 */
export const deleteFileAsset = (path: string, bucket?: string) =>
  http().delete("/ms/monitor/file-assets").query({ path, bucket }).then(r => unwrap<boolean>(r));

/**
 * 下载文件（走统一请求管线以携带鉴权头）
 * @param path 对象路径
 * @param bucket 存储桶，留空取默认存储
 * @param inline 是否内联预览
 * @returns 文件内容 Blob
 */
export const downloadFileAsset = (path: string, bucket?: string, inline = false) =>
  http().get("/ms/monitor/file-assets/download").query({ path, bucket, inline })
    .responseType("blob")
    .then(r => r.data as Blob);

// ==================== Agent 生命周期（/ms/server/host/agent） ====================

/**
 * Agent 生命周期动作
 */
export type AgentLifecycleAction = "install" | "reinstall" | "upgrade" | "uninstall";

/**
 * 提交 Agent 生命周期动作（安装/重装/升级/卸载）。
 * <p>
 * 安装对应后端 deploy 端点，其余动作同名；进度通过 socket 的 monitor/agent-deploy 事件推送。
 * @param hostId 主机 ID
 * @param action 生命周期动作
 * @returns 后端受理的动作标识
 */
export const submitAgentAction = (hostId: number, action: AgentLifecycleAction) => {
  const endpoint = action === "install" ? "deploy" : action;
  return http()
    .post(`/ms/server/host/agent/${hostId}/${endpoint}`)
    .then(r => unwrap<string>(r));
};

// ==================== 主机文件管理（/ms/server/host/file，按采集通道路由） ====================

/**
 * 主机文件条目
 */
export interface HostFileItem {
  name: string;
  /** 是否目录（后端 @JsonProperty("isDir")） */
  isDir: boolean;
  size: number;
  modified?: string;
  owner?: string;
  perms?: string;
}

/**
 * 主机文件接口前缀
 * @param hostId 主机 ID
 * @returns 前缀路径
 */
const hostFileBase = (hostId: number) => `/ms/server/host/file/${hostId}`;

/**
 * 列出主机目录
 * @param hostId 主机 ID
 * @param path 目录路径
 */
export const fetchHostFiles = (hostId: number, path?: string) =>
  http().get(hostFileBase(hostId)).query({ path }).then(r => unwrap<HostFileItem[]>(r));

/**
 * 读取主机文本文件
 * @param hostId 主机 ID
 * @param path 文件路径
 */
export const readHostFileContent = (hostId: number, path: string) =>
  http().get(`${hostFileBase(hostId)}/content`).query({ path }).then(r => unwrap<string>(r));

/**
 * 写入主机文本文件
 * @param hostId 主机 ID
 * @param path 文件路径
 * @param content 内容
 */
export const writeHostFileContent = (hostId: number, path: string, content: string) =>
  http().put(`${hostFileBase(hostId)}/content`).query({ path }).headers({ "Content-Type": "text/plain;charset=utf-8" }).data(content).then(r => unwrap<boolean>(r));

/**
 * 创建主机目录
 * @param hostId 主机 ID
 * @param path 目录路径
 */
export const mkdirHostFile = (hostId: number, path: string) =>
  http().post(`${hostFileBase(hostId)}/mkdir`).query({ path }).then(r => unwrap<boolean>(r));

/**
 * 删除主机文件 / 目录
 * @param hostId 主机 ID
 * @param path 目标路径
 */
export const deleteHostFile = (hostId: number, path: string) =>
  http().delete(hostFileBase(hostId)).query({ path }).then(r => unwrap<boolean>(r));

/**
 * 重命名 / 移动主机文件
 * @param hostId 主机 ID
 * @param from 源路径
 * @param to 目标路径
 */
export const renameHostFile = (hostId: number, from: string, to: string) =>
  http().put(`${hostFileBase(hostId)}/rename`).query({ from, to }).then(r => unwrap<boolean>(r));

/**
 * 上传文件到主机目录
 * @param hostId 主机 ID
 * @param dir 目标目录
 * @param file 文件
 */
export const uploadHostFile = (hostId: number, dir: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return http().post(`${hostFileBase(hostId)}/upload`).query({ path: dir }).data(form)
    .then(r => unwrap<string>(r));
};

/**
 * 下载主机文件，返回 Blob（由组件触发浏览器保存）
 * @param hostId 主机 ID
 * @param path 文件路径
 */
export const downloadHostFile = (hostId: number, path: string) =>
  http().get(`${hostFileBase(hostId)}/download`).query({ path }).responseType("blob")
    .then(r => r.data as Blob);

/**
 * 主机文件/目录权限信息（类 Unix）
 */
export interface HostFilePerms {
  /** 八进制权限，如 755 */
  mode: string;
  owner: string;
  group: string;
}

/**
 * 读取主机文件/目录权限（类 Unix）
 * @param hostId 主机 ID
 * @param path 目标路径
 */
export const fetchHostPerms = (hostId: number, path: string) =>
  http().get(`${hostFileBase(hostId)}/chmod`).query({ path }).then(r => unwrap<HostFilePerms>(r));

/**
 * 下发主机文件/目录权限（类 Unix）
 * @param hostId 主机 ID
 * @param path 目标路径
 * @param mode 八进制权限（3~4 位）
 */
export const saveHostPerms = (hostId: number, path: string, mode: string) =>
  http().put(`${hostFileBase(hostId)}/chmod`).query({ path, mode }).then(r => unwrap<boolean>(r));

/* ==================== 磁盘占用分析（WizTree 风格） ==================== */

/** 磁盘占用树节点 */
export interface DiskUsageNode {
  name: string;
  path: string;
  /** 字节（目录为累计值） */
  size: number;
  directory: boolean;
  children?: DiskUsageNode[];
  /** 节点下（含子孙）文件总数 */
  fileCount?: number;
  /** 节点下（含子孙）目录总数 */
  dirCount?: number;
  /** 修改时间展示文本（文件为自身 mtime，目录取最近修改子项） */
  modified?: string | null;
  /** 所在卷总容量（字节，仅根节点） */
  totalSpace?: number;
  /** 所在卷可用容量（字节，仅根节点） */
  freeSpace?: number;
}

/**
 * 磁盘占用分析：递归统计目录/文件大小
 * @param hostId 主机 ID
 * @param path   起始路径
 * @param depth  递归深度
 */
export const fetchDiskUsage = (hostId: number, path?: string, depth = 4) =>
  http().get(`${hostFileBase(hostId)}/usage`).query({ path, depth })
    // 整盘递归可能较慢，放宽到 120s
    .timeout(120_000)
    .then(r => unwrap<DiskUsageNode>(r));
