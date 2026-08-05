import { http } from '@repo/core';

/** 后端统一返回结构 { code, data, msg } 解包 */
const unwrap = <T>(res: any): T => {
  if (res?.data?.code === '00000' || res?.data?.code === '200' || res?.data?.success === true || res?.data?.ok === true) {
    return res.data.data as T;
  }
  if (res?.data && typeof res.data === 'object' && 'code' in res.data) {
    throw new Error(res.data.msg || '请求失败');
  }
  return res as T;
};

const B = '/ms/monitor';

// ===== 资产 MsMonitor =====
export const getMonitors = () => http().get(B).then(r => unwrap<any[]>(r));
export const getMonitor = (id: number) => http().get(`${B}/${id}`).then(r => unwrap<any>(r));
export const saveMonitor = (id: number, d: any) => id
  ? http().put(`${B}/${id}`).data(d).then(r => unwrap<any>(r))
  : http().post(B).data(d).then(r => unwrap<any>(r));
export const delMonitor = (id: number) => http().delete(`${B}/${id}`).then(r => unwrap<any>(r));

// ===== 采集任务 MsMonitorTask =====
export const getTasks = (monitorId?: number) =>
  http().get(`${B}/task${monitorId ? `?monitorId=${monitorId}` : ''}`).then(r => unwrap<any[]>(r));
export const getTask = (id: number) => http().get(`${B}/task/${id}`).then(r => unwrap<any>(r));
export const saveTask = (id: number, d: any) => id
  ? http().put(`${B}/task/${id}`).data(d).then(r => unwrap<any>(r))
  : http().post(`${B}/task`).data(d).then(r => unwrap<any>(r));
export const delTask = (id: number) => http().delete(`${B}/task/${id}`).then(r => unwrap<any>(r));

// ===== 解析规则 MsMonitorMetricConfig =====
export const getMetricConfigs = (taskId: number) =>
  http().get(`${B}/metric-config?taskId=${taskId}`).then(r => unwrap<any[]>(r));
export const saveMetricConfig = (id: number, d: any) => id
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
  http().post(`${B}/config`).data(d).then(r => unwrap<any>(r));

// ===== Redis 操作 (基于 taskId) =====
export const scanRedisKeys = (taskId: number, pattern: string) =>
  http().get(`${B}/operation/redis/${taskId}/keys?pattern=${pattern}`).then(r => unwrap<{ keys: string[], nextCursor?: string }>(r));
export const getRedisValue = (taskId: number, key: string) =>
  http().get(`${B}/operation/redis/${taskId}/kv/${key}`).then(r => unwrap<string>(r));
export const setRedisValue = (taskId: number, key: string, value: string, ttl?: number) => {
  const url = `${B}/operation/redis/${taskId}/kv/${key}${ttl ? `?ttl=${ttl}` : ''}`;
  return http().put(url).data(value).then(r => unwrap<boolean>(r));
};
export const delRedisKeys = (taskId: number, keys: string[]) =>
  http().delete(`${B}/operation/redis/${taskId}/keys`).data(keys).then(r => unwrap<number>(r));
export const expireRedisKey = (taskId: number, key: string, ttl: number) =>
  http().post(`${B}/operation/redis/${taskId}/expire/${key}?ttlSeconds=${ttl}`).then(r => unwrap<boolean>(r));

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
