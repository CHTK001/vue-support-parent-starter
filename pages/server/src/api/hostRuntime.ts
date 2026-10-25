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
  /** 线程数（后端 ProcessRowVO 字段名为 threads） */
  threads?: number;
  /** 线程数别名，部分采集通道以此命名 */
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

/** 端口占用行（后端 NetProcessRowVO，各采集通道字段已归一） */
export interface NetProcessInfo {
  /** 协议小写：tcp / tcp4 / udp */
  protocol?: string;
  /** 协议别名，与 protocol 同值 */
  type?: string;
  /** 本地地址展示串 addr:port */
  local?: string;
  localAddr?: string;
  localPort?: number;
  /** 远端地址展示串 addr:port */
  remote?: string;
  remoteAddr?: string;
  remotePort?: number;
  /** 端口别名，与 localPort 同值 */
  port?: number;
  /** 连接状态：LISTEN / ESTABLISHED / UNCONN */
  state?: string;
  /** 占用进程号，未知为 0 */
  pid?: number;
  /** 占用进程名，未知为空 */
  process?: string;
  [key: string]: unknown;
}

/** 获取本机（或指定主机）的端口占用详情，含占用 PID / 进程名 */
export const fetchNetProcesses = (hostId?: number) =>
  http()
    .get("/ms/system/netproc")
    .query(hostId ? { hostId } : {})
    .timeout(60_000)
    .then(r => unwrap<NetProcessInfo[]>(r));

/**
 * 从端口占用明细里挑出监听行对应的 PID。
 *
 * <p>只认 LISTEN（TCP）与 UNCONN（UDP）行：客户端连出去的 ESTABLISHED 连接
 * 端口相同但 PID 是对端发起者，误取会把「谁在连」当成「谁在服务」。
 * 抽成纯函数便于单测，网络请求留在 {@link resolvePortPid}。</p>
 *
 * @param rows 端口占用明细
 * @param port 目标监听端口
 * @returns 占用该端口的进程号；找不到或未取到返回 0
 */
export const pickListenPid = (rows: NetProcessInfo[], port: number): number => {
  if (!port || !rows?.length) return 0;
  const hit = rows.find(r => Number(r.port ?? r.localPort) === port
    && (r.state === "LISTEN" || r.state === "UNCONN"));
  return Number(hit?.pid) || 0;
};

/**
 * 按监听端口反查占用它的进程 PID。
 *
 * <p>服务节点只存了 host/port，没有 PID；要展示节点进程的 CPU / 内存就必须先由
 * 端口反查 PID。判定规则见 {@link pickListenPid}。</p>
 *
 * @param port   节点监听端口
 * @param hostId 目标主机，undefined 表示本机
 * @returns 占用该端口的进程号；找不到返回 0
 */
export const resolvePortPid = async (port: number, hostId?: number): Promise<number> => {
  if (!port) return 0;
  const rows = await fetchNetProcesses(hostId);
  return pickListenPid(rows, port);
};

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
