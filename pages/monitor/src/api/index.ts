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
/**
 * 保存资产：id 为 null 时新增（POST 集合），否则更新（PUT /{id}）。
 *
 * 注意 id 必须传 null 而不是 0：实现以 `id != null` 判定新增/更新，
 * 传 0 会被判定为"更新 0 号"从而走错分支。
 */
export const saveMonitor = (id: number | null, d: any) => id != null
  ? http().put(`${B}/${id}`).data(d).then(r => unwrap<any>(r))
  : http().post(B).data(d).then(r => unwrap<any>(r));
export const delMonitor = (id: number) => http().delete(`${B}/${id}`).then(r => unwrap<any>(r));

// ===== 关联服务器主机 =====
export const getServerHosts = () => http().get(`${B}/server-hosts`).then(r => unwrap<any[]>(r));
export const getServerHost = (id: number) => http().get(`${B}/server-host/${id}`).then(r => unwrap<any>(r));

/**
 * 资产聚合详情里挂在该主机上的监控项摘要
 *
 * monitorId 才是指标/告警查询的 ID 域，主机页拿到的 route id 是 hostId，两者不可混用。
 */
export interface AssetMonitorRef {
  /** 监控项标识（指标接口的 monitorId） */
  monitorId: number;
  /** 监控项名称 */
  name?: string;
  /** 监控主机地址 */
  host?: string;
  /** 服务类型 */
  serviceType?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 未处理告警数 */
  activeAlarmCount?: number;
  /** 最高告警级别 */
  maxLevel?: string;
}

/**
 * 主机台账聚合视图：基础信息 + 通道开关 + 关联监控项 + 告警量
 */
export interface AssetDetail {
  /** 主机台账标识（AI 分析接口的 hostId） */
  hostId: number;
  /** 资产名称 */
  name?: string;
  /** 资产 IP/域名 */
  address?: string;
  /** SSH/默认端口 */
  port?: number;
  /** 操作系统类型 */
  osType?: string;
  /** 在线状态：1=在线 0=离线 */
  online?: number;
  /** 是否开启采集 */
  collectEnabled?: boolean;
  /** 是否开启 Agent */
  agentEnabled?: boolean;
  /** 是否开启远控 */
  remoteEnabled?: boolean;
  /** 关联监控项数量 */
  monitorCount?: number;
  /** 未处理告警数 */
  activeAlarmCount?: number;
  /** 关联监控项列表 */
  monitors?: AssetMonitorRef[];
}

/**
 * 资产聚合详情：主机台账 + 其名下监控项，用于把 hostId 解析成 monitorId
 * @param hostId 主机台账标识
 * @returns 资产聚合视图
 */
export const getAssetDetail = (hostId: number) =>
  http().get(`${B}/asset/${hostId}`).timeout(15_000).then(r => unwrap<AssetDetail>(r));

// ===== 资产检索（主机与设备并列）=====

/** 资产大类 */
export type AssetType = 'HOST' | 'DEVICE';

/**
 * 资产简表行 —— 主机与设备统一的列表模型
 *
 * 字段取两类资产的公共语义，差异信息放在 category/categoryLabel（主机为系统类型、
 * 设备为设备大类）与 vendor（仅设备有值）。
 */
export interface AssetBrief {
  /** 资产大类 */
  assetType: AssetType;
  /** 资产标识：主机为自增主键十进制形式，设备为 UUID */
  assetId: string;
  /** 资产名称 */
  name?: string;
  /** 资产地址 */
  address?: string;
  /** 端口 */
  port?: number;
  /** 类型标签原值 */
  category?: string;
  /** 类型标签中文名 */
  categoryLabel?: string;
  /** 厂商（仅设备） */
  vendor?: string;
  /** 分组标识（仅主机） */
  groupId?: number;
  /** 在线状态 */
  online?: boolean;
  /** 启用状态：设备表无启用字段，恒为 true */
  enabled?: boolean;
  /** 资产详情页路由（前端跳转用） */
  detailRoute?: string;
  /** 详情路由携带的查询参数 */
  detailQuery?: string;
}

/**
 * 资产关联的监控项摘要
 *
 * 沿用 {@link AssetMonitorRef}，主机与设备详情里的监控项结构一致。
 */
export type AssetMonitorItem = AssetMonitorRef;

/** 主机资产聚合详情中的服务节点 */
export interface AssetNodeChannel {
  nodeId?: number;
  name?: string;
  protocol?: string;
  port?: number;
  status?: string;
  url?: string;
  extra?: Record<string, unknown>;
}

/** 主机资产聚合详情：基础信息 + 通道状态 + 服务节点 + 监控项 */
export interface HostAssetDetail {
  assetType: AssetType;
  /** 主机台账标识 */
  hostId: number;
  name?: string;
  address?: string;
  port?: number;
  osType?: string;
  online?: boolean;
  onlineTime?: string;
  collectEnabled?: boolean;
  agentEnabled?: boolean;
  remoteEnabled?: boolean;
  nodeCount?: number;
  runningCount?: number;
  /** 服务节点清单 */
  channels?: AssetNodeChannel[];
  monitorCount?: number;
  activeAlarmCount?: number;
  monitors?: AssetMonitorItem[];
}

/** 设备地理位置 */
export interface DeviceGeoLocation {
  latitude?: number | string;
  longitude?: number | string;
  address?: string;
  /** 是否已配置坐标 */
  located?: boolean;
}

/** 设备通道摘要 */
export interface DeviceChannelBrief {
  channelId?: string;
  deviceId?: string;
  channelNo?: number;
  channelName?: string;
  channelType?: string;
  /** 通道状态（设备模块原文透传） */
  channelStatus?: string;
  sort?: number;
}

/** 设备资产聚合详情：基础信息 + 会话状态 + 位置 + 通道 + 监控项 */
export interface DeviceAssetDetail {
  assetType: AssetType;
  /** 设备标识（UUID） */
  assetId: string;
  name?: string;
  address?: string;
  port?: number;
  category?: string;
  categoryLabel?: string;
  subCategory?: string;
  vendor?: string;
  model?: string;
  serial?: string;
  firmware?: string;
  orgId?: string;
  orgName?: string;
  /** 探测在线状态（落库快照） */
  online?: boolean;
  /** 会话在线状态（内存会话实时值，与 online 有意区分） */
  sessionOnline?: boolean;
  offlineThreshold?: number;
  createdAt?: string;
  geo?: DeviceGeoLocation;
  channelCount?: number;
  enabledChannelCount?: number;
  channels?: DeviceChannelBrief[];
  monitorCount?: number;
  activeAlarmCount?: number;
  monitors?: AssetMonitorItem[];
}

/**
 * 按大类与关键字检索资产
 *
 * @param keyword 关键字（主机: 名称/IP；设备: 名称/IP/序列号），空表示全部
 * @param assetType 资产大类过滤，不传则两类都返回
 */
export const searchAssets = (keyword?: string, assetType?: AssetType) =>
  http()
    .get(`${B}/asset/search`)
    .query({ keyword, assetType })
    .timeout(15_000)
    .then(r => unwrap<AssetBrief[]>(r));

/** 主机资产聚合详情 */
export const getHostAssetDetail = (hostId: number | string) =>
  http()
    .get(`${B}/asset/host/${hostId}`)
    .timeout(15_000)
    .then(r => unwrap<HostAssetDetail>(r));

/** 设备资产聚合详情（设备不存在返回空数据） */
export const getDeviceAssetDetail = (deviceId: string) =>
  http()
    .get(`${B}/asset/device/${deviceId}`)
    .timeout(15_000)
    .then(r => unwrap<DeviceAssetDetail>(r));

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

// ===== 主机内置指标历史（不依赖监控项，供监控详情近1h基础数据/图表历史）=====
/** [时间戳ms, CPU%, 内存%, 磁盘%, 磁盘读KB/s, 磁盘写KB/s]，缺失值为 null */
export type HostMetricPoint = [
  number,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
];
/** 软件实例（进程识别结果，同软件支持多实例） */
export interface SoftwareInstance {
  type: string;
  displayName: string;
  pid: number;
  cpu: number;
  memMb: number;
  uptimeSec: number;
  cmd: string;
  port?: number;
}
export const getHostMetricHistory = (hostId: number, hours = 1): Promise<HostMetricPoint[]> =>
  http()
    .get(`${B}/host/${hostId}/metric-history?hours=${hours}`)
    .timeout(30000)
    .then(r => {
      const d = r?.data;
      if (d && (d.code === '00000' || d.code === '200')) {
        return (d.data ?? []) as HostMetricPoint[];
      }
      return [];
    })
    .catch(() => []);

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
  http().get(`${B}/agent/config/${monitorId}`).then(r => unwrap<{ collectIntervalMs: number; tasks: { taskName: string; taskType: string; taskCron: string }[] }>(r));

// ===== TShark 网络抓包 =====
export const checkTshark = () => http().get(`${B}/tshark/check`).then(r => unwrap<boolean>(r));
export const getTsharkInterfaces = () => http().get(`${B}/tshark/interfaces`).then(r => unwrap<string[]>(r));
export const startTsharkCapture = (d: any) =>
  http().post(`${B}/tshark/capture`).data(d).then(r => unwrap<any>(r));
export const stopTsharkCapture = (id: number) =>
  http().post(`${B}/tshark/capture/${id}/stop`).then(r => unwrap<any>(r));
export const delTsharkSession = (id: number) =>
  http().delete(`${B}/tshark/sessions/${id}`).then(r => unwrap<any>(r));
/**
 * 抓包会话分页列表。
 *
 * @param source 来源过滤（live=实时抓包 / import=导入 pcap）；不传则不过滤
 */
export const getTsharkSessions = (page = 1, size = 10, source = '') =>
  http().get(`${B}/tshark/sessions?page=${page}&size=${size}${source ? `&source=${encodeURIComponent(source)}` : ''}`).then(r => unwrap<any>(r));

/**
 * 导入 pcap 文件（PCAP 分析）。
 *
 * <p>走 multipart 而不是 JSON：pcap 动辄几十上百 MB，base64 进 JSON 要平白胖三分之一，
 * 后端还得再解码一次。交给 FormData + axios 自动带 boundary —— 手写 Content-Type
 * 反而会漏掉 boundary，后端直接解析不出文件。</p>
 *
 * <p>返回的是「刚落库的会话」：解析在后台跑，包数会陆续增长，前端靠会话推送看进度。</p>
 */
export const importTsharkPcap = (file: File, name = '') => {
  const form = new FormData();
  form.append('file', file, file.name);
  if (name) form.append('name', name);
  return http().post(`${B}/tshark/pcap/import`).data(form).then(r => unwrap<any>(r));
};
export const getTsharkPackets = (sessionId: number, page = 1, size = 20, keyword = '') =>
  http().get(`${B}/tshark/sessions/${sessionId}/packets?page=${page}&size=${size}` +
    (keyword ? `&keyword=${encodeURIComponent(keyword)}` : '')).then(r => unwrap<any>(r));
/** 原始 pcap 下载地址：页面上的摘要只是 tshark 的解析结果，要深挖得拿原件去 Wireshark 打开 */
export const tsharkPcapUrl = (sessionId: number) => `${B}/tshark/sessions/${sessionId}/pcap`;
export const getTsharkPacketDetail = (id: number) =>
  http().get(`${B}/tshark/packets/${id}`).then(r => unwrap<any>(r));

/**
 * 某报文所属 TCP 流的握手 / 关闭生命周期。
 *
 * <p>该接口直接返回 VO（不是 ReturnResult 信封），所以取 r.data；404 表示协议
 * 不跑在 TCP 上（UDP / ICMP / ARP），调用方按「不支持」提示。</p>
 */
export const getTsharkHandshake = (packetId: number) =>
  http().get(`${B}/tshark/packets/${packetId}/handshake`).then(r => r.data as any);

/**
 * 抓包会话的报文实时流（SSE）。
 *
 * <p>按会话分组推送：`packet` 新报文 / `session` 会话状态 / `ready` 建连确认。
 * 走 SSE 而不是 socket.io 是全量广播 —— 抓包可能同时开几个会话，服务端只推
 * 当前在看的那个，前端不必自己按 dataId 过滤。</p>
 */
export const openTsharkPacketStream = (sessionId: number, options: Record<string, any> = {}) =>
  http().get(`${B}/tshark/sessions/${sessionId}/packets/stream`).sse<any>({ reconnect: true, ...options });
export const getTsharkProtocolStats = (sessionId: number) =>
  http().get(`${B}/tshark/sessions/${sessionId}/stats/protocol`).then(r => unwrap<any[]>(r));
export const getTsharkTopFlows = (sessionId: number, limit = 10) =>
  http().get(`${B}/tshark/sessions/${sessionId}/stats/top?limit=${limit}`).then(r => unwrap<any[]>(r));
