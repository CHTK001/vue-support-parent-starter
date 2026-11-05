/**
 * 主机画像 / 主机网卡 API（数据全部来自目标机 Agent）。
 *
 * <p>与 {@link ./hostRuntime} 同属「主机资产」能力：画像分区（进程/服务/磁盘/网络/环境）
 * 与网卡配置都由目标机 Agent 采集或下发，故与主机台账、远控一起住在 @pages/server。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

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
    // 慢链路分区采集放宽到 60s
    .timeout(60_000)
    .then(r => unwrap<any>(r));

/** 从 fetchHostProfileSection 响应中提取行数组（兼容 SectionPage 和裸数组） */
export function sectionRows(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.rows)) return res.rows;
  return [];
}

/* ==================== 底部状态条：资源摘要 ==================== */

/** 主机资源摘要（句柄 / inode） */
export interface HostResourceSummary {
  handleCount: number;
  threadCount: number;
  processCount: number;
  inodeUsed: number;
  inodeTotal: number;
  inodePercent: number;
  inodeMount: string;
  collectedAt: string;
}

/**
 * 拉取主机资源摘要（句柄数 / inode 使用率）
 * @param hostId 主机 id
 */
export const fetchHostResourceSummary = (hostId: number) =>
  http().get(`/ms/server/host/profile/${hostId}/summary`)
    .timeout(30_000)
    .then(r => unwrap<HostResourceSummary>(r));

/* ==================== 系统配置（热更新） ==================== */

/** 系统配置项 */
export interface SystemConfigItem {
  key: string;
  label: string;
  value: string;
  unit: string;
  scope: string;
  source: string;
  editable: boolean;
  hot: boolean;
  requiresConfirm: boolean;
  tip: string;
}

/** 读取系统配置项 */
export const fetchSystemConfigs = (hostId: number) =>
  http().get(`/ms/server/host/profile/${hostId}/system-configs`)
    .timeout(60_000)
    .then(r => unwrap<SystemConfigItem[]>(r));

/** 修改系统配置（后端写后回读确认） */
export const applySystemConfig = (hostId: number, key: string, value: string) =>
  http().post(`/ms/server/host/profile/${hostId}/system-configs`).data({ key, value })
    .timeout(90_000)
    .then(r => unwrap<string>(r));

/* ==================== 已删除但被占用的文件 ==================== */

/** 已删除但仍被进程占用的文件 */
export interface DeletedFileRow {
  pid: number;
  ppid: number;
  process: string;
  user: string;
  fd: number;
  path: string;
  sizeBytes: number;
  sizeText: string;
}

/** 已删除文件采集结果（supported=false 时带原因） */
export interface DeletedFilesResult {
  supported: boolean;
  reason: string;
  rows: DeletedFileRow[];
}

/** 采集已删除但仍被占用的文件 */
export const fetchDeletedFiles = (hostId: number) =>
  http().get(`/ms/server/host/profile/${hostId}/deleted-files`)
    .timeout(120_000)
    .then(r => unwrap<DeletedFilesResult>(r));

/** 释放已删除文件（仅对 deleted 的 fd 截断为 0） */
export const releaseDeletedFile = (hostId: number, pid: number, fd: number) =>
  http().post(`/ms/server/host/profile/${hostId}/deleted-files/release`).data({ pid, fd })
    .timeout(60_000)
    .then(r => unwrap<string>(r));

/* ==================== 挂载盘 ==================== */

/** 挂载行 */
export interface MountRow {
  source: string;
  target: string;
  fsType: string;
  options: string;
  totalBytes: number;
  usedBytes: number;
  availBytes: number;
  usage: number;
  volumeId: string;
}

/** 读取挂载列表 */
export const fetchMounts = (hostId: number) =>
  http().get(`/ms/server/host/profile/${hostId}/mounts`)
    .timeout(90_000)
    .then(r => unwrap<MountRow[]>(r));

/** 挂载设备 / 卷 */
export const mountDevice = (hostId: number, source: string, target: string, fsType: string) =>
  http().post(`/ms/server/host/profile/${hostId}/mounts/mount`).data({ source, target, fsType })
    .timeout(90_000)
    .then(r => unwrap<string>(r));

/** 卸载挂载点 / 盘符 */
export const unmountDevice = (hostId: number, target: string) =>
  http().post(`/ms/server/host/profile/${hostId}/mounts/unmount`).data({ target })
    .timeout(90_000)
    .then(r => unwrap<string>(r));

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

