/**
 * 目标机运行时 API（进程 / 服务 / 网络 / 磁盘 / 防火墙 / 驱动 / 环境变量）。
 *
 * <p>这些接口操作的是**目标机**（由主机台账中的 Agent 通道采集），不是本机：
 * 路径统一在 {@code /ms/system/**}（系统管理 SPI），带 {@code hostId} 参数时
 * 经该主机的采集通道下发，否则作用于本机。</p>
 *
 * <p>原先写在监控台宿主的 {@code monitorApi.ts} 里，但能力归属「主机资产」——
 * 主机台账、远控、主机画像都在 {@code @pages/server}，把运行时操作留在宿主里
 * 会让服务端与前端能力分裂在两个包，故迁到本包。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);


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
