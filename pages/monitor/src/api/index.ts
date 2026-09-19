import { http, unwrapResult } from '@repo/utils';

/**
 * 后端统一返回结构 { code, data, msg } 解包
 *
 * 委托 @repo/utils 共享实现，避免各页面模块各自维护判定逻辑。
 */
const unwrap = <T>(res: any): T => unwrapResult<T>(res);

const B = '/ms/monitor';

// ===== 资产 MsMonitor =====
export const getMonitors = () => http().get(B).then(r => unwrap<any[]>(r));
export const getMonitor = (id: number) => http().get(`${B}/${id}`).then(r => unwrap<any>(r));
export const saveMonitor = (id: number, d: any) => id != null
  ? http().put(`${B}/${id}`).data(d).then(r => unwrap<any>(r))
  : http().post(B).data(d).then(r => unwrap<any>(r));
export const delMonitor = (id: number) => http().delete(`${B}/${id}`).then(r => unwrap<any>(r));

// ===== 关联服务器主机 =====
export const getServerHosts = () => http().get(`${B}/server-hosts`).then(r => unwrap<any[]>(r));
export const getServerHost = (id: number) => http().get(`${B}/server-host/${id}`).then(r => unwrap<any>(r));

// ===== Agent 在线状态（心跳上下文快照）=====
export const getAgentStatus = () =>
  http().get(`${B}/agent/status`).then(r => unwrap<{ monitorId: number; lastHeartbeat: string; online: boolean }[]>(r));

// ===== 采集任务 MsMonitorTask =====
export const getTasks = (monitorId?: number) =>
  http().get(`${B}/task${monitorId ? `?monitorId=${monitorId}` : ''}`).then(r => unwrap<any[]>(r));
export const getTask = (id: number) => http().get(`${B}/task/${id}`).then(r => unwrap<any>(r));
export const saveTask = (id: number, d: any) => id != null
  ? http().put(`${B}/task/${id}`).data(d).then(r => unwrap<any>(r))
  : http().post(`${B}/task`).data(d).then(r => unwrap<any>(r));
export const delTask = (id: number) => http().delete(`${B}/task/${id}`).then(r => unwrap<any>(r));

// ===== 解析规则 MsMonitorMetricConfig =====
export const getMetricConfigs = (taskId: number) =>
  http().get(`${B}/metric-config?taskId=${taskId}`).then(r => unwrap<any[]>(r));
export const saveMetricConfig = (id: number, d: any) => id != null
  ? http().put(`${B}/metric-config/${id}`).data(d).then(r => unwrap<any>(r))
  : http().post(`${B}/metric-config`).data(d).then(r => unwrap<any>(r));
export const delMetricConfig = (id: number) => http().delete(`${B}/metric-config/${id}`).then(r => unwrap<any>(r));

// ===== 网关 MsMonitorGateway =====
export const getGateways = (monitorId: number) =>
  http().get(`${B}/gateway?monitorId=${monitorId}`).then(r => unwrap<any[]>(r));
export const saveGateway = (d: any) =>
  http().post(`${B}/gateway`).data(d).then(r => unwrap<any>(r));
export const delGateway = (id: number) => http().delete(`${B}/gateway/${id}`).then(r => unwrap<any>(r));

// ===== 全局配置 MsMonitorConfig =====
export const getAllConfig = () =>
  http().get(`${B}/config`).then(r => unwrap<Record<string, string>>(r));
export const saveConfig = (d: any) =>
  http().post(`${B}/config/batch`).data(d).then(r => unwrap<any>(r));

// ===== Redis 操作 (基于 taskId) =====
export const scanRedisKeys = (taskId: number, pattern: string) =>
  http().get(`${B}/operation/redis/${taskId}/keys?pattern=${pattern}`).then(r => unwrap<{ keys: string[], nextCursor?: string }>(r));
export const getRedisValue = (taskId: number, key: string) =>
  http().get(`${B}/operation/redis/${taskId}/kv/${key}`).then(r => unwrap<{ key: string; value: string; type: string; ttl: number }>(r));
export const setRedisValue = (taskId: number, key: string, value: string, ttl?: number) => {
  const url = `${B}/operation/redis/${taskId}/kv/${key}${ttl ? `?ttl=${ttl}` : ''}`;
  return http().put(url).data(value).then(r => unwrap<boolean>(r));
};
export const delRedisKeys = (taskId: number, keys: string[]) =>
  http().delete(`${B}/operation/redis/${taskId}/keys`).data(keys).then(r => unwrap<number>(r));
export const expireRedisKey = (taskId: number, key: string, ttl: number) =>
  http().post(`${B}/operation/redis/${taskId}/expire/${key}?ttlSeconds=${ttl}`).then(r => unwrap<boolean>(r));

// 缓存前缀汇总（按冒号前缀分组统计 key 数量）
export const getCacheSummary = (taskId: number, prefix = '*') =>
  http().get(`${B}/operation/redis/${taskId}/cache-summary?prefix=${encodeURIComponent(prefix)}`)
    .then(r => unwrap<{ prefix: string; count: number }[]>(r));

// Redis key 详细信息（类型、TTL、大小、值）
export const getRedisKeyDetail = (taskId: number, key: string) =>
  http().get(`${B}/operation/redis/${taskId}/kv/${encodeURIComponent(key)}/detail`)
    .then(r => unwrap<{ key: string; value: string; ttl: number; type: string; size: number }>(r));

// ===== 指标查询 =====
// CPU
export const getLatestCpu = (monitorId: number) =>
  http().get(`${B}/metric/cpu/${monitorId}`).then(r => unwrap<any>(r));
export const getCpuHistory = (monitorId: number, hours: number = 1) =>
  http().get(`${B}/metric/cpu/history/${monitorId}?hours=${hours}`).then(r => unwrap<any[]>(r));
// Memory
export const getLatestMemory = (monitorId: number) =>
  http().get(`${B}/metric/memory/${monitorId}`).then(r => unwrap<any>(r));
export const getMemoryHistory = (monitorId: number, hours: number = 1) =>
  http().get(`${B}/metric/memory/history/${monitorId}?hours=${hours}`).then(r => unwrap<any[]>(r));
// Disk
export const getLatestDisk = (monitorId: number) =>
  http().get(`${B}/metric/disk/${monitorId}`).then(r => unwrap<any[]>(r));
// Network
export const getLatestNetwork = (monitorId: number) =>
  http().get(`${B}/metric/network/${monitorId}`).then(r => unwrap<any>(r));
export const getNetworkHistory = (monitorId: number, hours: number = 1) =>
  http().get(`${B}/metric/network/history/${monitorId}?hours=${hours}`).then(r => unwrap<any[]>(r));
// JVM
export const getLatestJvm = (monitorId: number) =>
  http().get(`${B}/metric/jvm/${monitorId}`).then(r => unwrap<any>(r));
export const getJvmHistory = (monitorId: number, hours: number = 1) =>
  http().get(`${B}/metric/jvm/history/${monitorId}?hours=${hours}`).then(r => unwrap<any[]>(r));
// Redis
export const getLatestRedisMetric = (monitorId: number) =>
  http().get(`${B}/metric/redis/${monitorId}`).then(r => unwrap<any>(r));
export const getRedisMetricHistory = (monitorId: number, hours: number = 1) =>
  http().get(`${B}/metric/redis/history/${monitorId}?hours=${hours}`).then(r => unwrap<any[]>(r));

/**
 * 从 Redis 指标历史中提取每个指标名的最新值快照
 *
 * 后端 getLatestRedisMetric 仅返回单行；此工具按历史分组取每组最新一条，
 * 得到全量指标快照（14 个 redis_* 指标），供仪表盘展示。
 */
export const getRedisSnapshot = async (monitorId: number): Promise<Record<string, number>> => {
  const rows = await getRedisMetricHistory(monitorId, 1);
  const snapshot: Record<string, number> = {};
  for (const row of rows ?? []) {
    const key = (row as any).msMonitorRedisMetricMetricName || (row as any).redisMetricName
      || (row as any).metricName;
    const value = (row as any).msMonitorRedisMetricMetricValue ?? (row as any).metricValue;
    if (!key || value == null) continue;
    snapshot[key] = Number(value);
  }
  return snapshot;
};

// ===== 任务启停（后端 PUT /task/{id}/enabled）=====
export const setTaskEnabled = (id: number, enabled: boolean) =>
  http().put(`${B}/task/${id}/enabled?enabled=${enabled}`).then(r => unwrap<boolean>(r));

/**
 * 导出指标历史数据 CSV
 * @param monitorId 监控 ID（可选，为空则导出所有）
 * @param metricName 指标名（可选，为空导出所有）
 * @param hours 过去 N 小时
 */
export const exportMetricHistory = (monitorId?: number, metricName?: string, hours = 24) => {
  const id = monitorId != null ? `/${monitorId}` : '';
  return http().get(`${B}/metric/export${id}?metricName=${metricName ?? ''}&hours=${hours}`).responseType('blob').then(r => r.data);
};

/**
 * 导出指标历史数据 CSV (无 monitorId 版本，查询所有)
 */
export const exportAllMetricHistory = (metricName?: string, hours = 24) =>
  http().get(`${B}/metric/export?metricName=${metricName ?? ''}&hours=${hours}`).responseType('blob').then(r => r.data);

// ===== 指标时序曲线（InfluxDB，未启用时接口不存在需降级）=====
export type SeriesPoint = [number, number];
export const getMetricSeries = (
  target: string,
  monitorId: number,
  hours = 1,
  window = '1m',
): Promise<SeriesPoint[]> =>
  http()
    .get(`${B}/metric/series?target=${target}&monitorId=${monitorId}&hours=${hours}&window=${window}`)
    .timeout(30000)
    .then(r => unwrapResultSeries(r))
    .catch(() => []);

/** series 接口解包：404/错误时静默返回空数组（前端降级到历史接口） */
const unwrapResultSeries = (res: any): SeriesPoint[] => {
  try {
    const data = res?.data;
    if (data && (data.code === '00000' || data.code === '200')) {
      return (data.data ?? []) as SeriesPoint[];
    }
  } catch { /* 忽略解析失败 */ }
  return [];
};

// ===== 告警策略 / 规则 / 事件 =====
export const getAlarmPolicies = () => http().get(`${B}/alarm/policy`).then(r => unwrap<any[]>(r));
export const saveAlarmPolicy = (id: number | null, d: any) => id != null
  ? http().put(`${B}/alarm/policy/${id}`).data(d).then(r => unwrap<any>(r))
  : http().post(`${B}/alarm/policy`).data(d).then(r => unwrap<any>(r));
export const delAlarmPolicy = (id: number) => http().delete(`${B}/alarm/policy/${id}`).then(r => unwrap<boolean>(r));
export const getAlarmRules = (policyId?: number) =>
  http().get(`${B}/alarm/rule${policyId ? `?policyId=${policyId}` : ''}`).then(r => unwrap<any[]>(r));
export const saveAlarmRule = (id: number | null, d: any) => id != null
  ? http().put(`${B}/alarm/rule/${id}`).data(d).then(r => unwrap<any>(r))
  : http().post(`${B}/alarm/rule`).data(d).then(r => unwrap<any>(r));
export const delAlarmRule = (id: number) => http().delete(`${B}/alarm/rule/${id}`).then(r => unwrap<boolean>(r));
export const getAlarmEvents = (status?: string) =>
  http().get(`${B}/alarm/event${status ? `?status=${status}` : ''}`).then(r => unwrap<any[]>(r));
export const handleAlarmEvent = (id: number, remark: string, falseAlarm: boolean) =>
  http().post(`${B}/alarm/event/${id}/handle?remark=${encodeURIComponent(remark)}&falseAlarm=${falseAlarm}`)
    .then(r => unwrap<boolean>(r));

// ===== 全局概览 =====
export const getOverview = () =>
  http().get(`${B}/dashboard/overview`).then(r => unwrap<{ total: number; enabled: number; disabled: number; serverCount: number; redisCount: number; dbCount: number }>(r));

// ===== 手动触发采集 =====
export const triggerCollect = (taskId: number) =>
  http().post(`${B}/task/${taskId}/trigger`).then(r => unwrap<boolean>(r));

// ===== 告警统计 =====
export const getAlarmSummary = () =>
  http().get(`${B}/alarm/stats/summary`).then(r => unwrap<{ todayTotal: number; unprocessed: number; processed: number; falseAlarm: number; levelDistribution: Record<string, number> }>(r));
export const getAlarmTrend = (hours = 24, interval = '1h') =>
  http().get(`${B}/alarm/stats/trend?hours=${hours}&interval=${interval}`).then(r => unwrap<{ time: string; count: number }[]>(r));

// ===== Agent 管理 =====
export const getAgentList = () =>
  http().get(`${B}/agent/list`).then(r => unwrap<{ monitorId: number; monitorName: string; monitorHost: string; monitorAgentKey: string; online: boolean; lastHeartbeat: string }[]>(r));
export const getAgentConfig = (monitorId: number) =>
  http().get(`${B}/agent/config/${monitorId}`).then(r => unwrap<{ intervals: Record<string, number>; tasks: any[] }>(r));

// ===== TShark 网络抓包 =====
export const checkTshark = () => http().get(`${B}/tshark/check`).then(r => unwrap<boolean>(r));
export const getTsharkInterfaces = () => http().get(`${B}/tshark/interfaces`).then(r => unwrap<string[]>(r));
export const startTsharkCapture = (d: any) =>
  http().post(`${B}/tshark/capture`).data(d).then(r => unwrap<any>(r));
export const stopTsharkCapture = (id: number) =>
  http().post(`${B}/tshark/capture/${id}/stop`).then(r => unwrap<any>(r));
export const delTsharkSession = (id: number) =>
  http().delete(`${B}/tshark/sessions/${id}`).then(r => unwrap<any>(r));
export const getTsharkSessions = (page = 1, size = 10) =>
  http().get(`${B}/tshark/sessions?page=${page}&size=${size}`).then(r => unwrap<any>(r));
export const getTsharkPackets = (sessionId: number, page = 1, size = 20) =>
  http().get(`${B}/tshark/sessions/${sessionId}/packets?page=${page}&size=${size}`).then(r => unwrap<any>(r));
export const getTsharkPacketDetail = (id: number) =>
  http().get(`${B}/tshark/packets/${id}`).then(r => unwrap<any>(r));
export const getTsharkProtocolStats = (sessionId: number) =>
  http().get(`${B}/tshark/sessions/${sessionId}/stats/protocol`).then(r => unwrap<any[]>(r));
export const getTsharkTopFlows = (sessionId: number, limit = 10) =>
  http().get(`${B}/tshark/sessions/${sessionId}/stats/top?limit=${limit}`).then(r => unwrap<any[]>(r));
