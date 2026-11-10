<script setup lang="ts">
/**
 * 主机资产工作台（Deck 布局）
 *
 * <p>左侧是按分组折叠的主机列表，右侧是多标签工作区：远控、文件管理、指标监控
 * 以及画像的七个明细分区，每个功能都开成独立页签，互不干扰。底部常驻条显示
 * 当前选中主机的 CPU / 内存 / 磁盘，鼠标经过时浮出原「画像概要」信息。</p>
 *
 * <p>交互约定：单击主机只选中（底部条跟随），双击打开指标监控，<b>全部功能入口</b>
 * 统一收敛到主机行的右键菜单 —— 左侧不再挂一排按钮，右侧工作区只负责内容。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, nextTick, onMounted, onBeforeUnmount, ref, reactive, watch, defineAsyncComponent } from "vue";
import type { Component } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { queryHosts, delHost, switchHost, getGroups, getIdentities, listBoundIdentities, bindIdentity, unbindIdentity, scanPorts } from "../api";/**
 * 以下几屏只在「工作区页签」里按需出现，经 defineAsyncComponent 懒加载：
 *
 * - TerminalView 拉 @novnc/novnc（dev 4MB+）
 * - HostProfileView / HostDetailView 拉 echarts（dev 10MB）
 * - HostFileManager / ScHostWorkbench 各自带一套终端与文件面板
 *
 * 之前全部同步 import，结果是打开「主机资产」这一个菜单就要把上面所有包
 * 一次性下完（实测 72 个 js / 4.1MB / 1.4s），而多数时候用户只是看一眼主机列表。
 */
const HostProfileView = defineAsyncComponent(() => import("./HostProfileView.vue"));
const HostDetailView = defineAsyncComponent(() => import("./HostDetailView.vue"));
const ScHostWorkbench = defineAsyncComponent(() => import("./ScHostWorkbench.vue"));
const TerminalView = defineAsyncComponent(() => import("./TerminalView.vue"));
// 虚拟桌面：SSH 模拟桌面壳（终端 / 文件 / 监控 / 命令），嵌在工作区页签里
const DesktopView = defineAsyncComponent(() => import("./desktop/DesktopView.vue"));
const HostFileManager = defineAsyncComponent(() => import("../components/HostFileManager.vue"));
// 运维台四页 + 主机账号：右键打开时内嵌为工作区页签（懒加载，避免拖慢首屏）
const OpsSessionTab = defineAsyncComponent(() => import("./ScSessionTab.vue"));
const OpsExecTab = defineAsyncComponent(() => import("./ScExecTab.vue"));
const OpsSnippetTab = defineAsyncComponent(() => import("./ScTerminalSnippetManager.vue"));
const OpsMaintenanceTab = defineAsyncComponent(() => import("./ScMaintenancePlan.vue"));
const ScheduleTab = defineAsyncComponent(() => import("./ScScheduleTab.vue"));
const HostAccountTab = defineAsyncComponent(() => import("./hostaccount/HostAccountView.vue"));
const SoftwareTab = defineAsyncComponent(() => import("../components/lab/ScSoftwareManager.vue"));
// 日志页：系统日志 / 登录日志 —— 读的是「这台服务器」自己的日志
// （Linux：journalctl / /var/log；Windows：wevtutil），不是 @pages/system 里平台软件的
// SysLogManage / UserLogManage。命令经主机通道下发，页签打开即带 hostId。
const HostLogsTab = defineAsyncComponent(() => import("../components/lab/ScHostLogs.vue"));
// 主机告警策略：从主机右键菜单打开，策略按 ms_server_host_id 归属本机
const HostAlarmPolicyTab = defineAsyncComponent(() => import("../components/lab/ScHostAlarmPolicy.vue"));

/**
 * 弹窗 / 浮层 / 底部指标条：同样异步加载。
 *
 * <p>它们要么只在用户操作后才需要（新增/编辑/配置/Agent 部署弹窗、Ctrl+K 命令面板），
 * 要么晚几十毫秒出现也毫无感知（底部指标条）。同步 import 会把它们连带的依赖
 * （re-kit 表单、进度组件等）一起挂进 AssetsView 的首屏关键路径 —— 点菜单后
 * 右侧要等这一整串模块下完才从骨架换成页面。</p>
 *
 * <p>异步化后：主机资产外壳（左栏 + 工作区框架 + 底部条容器）先渲染，上面这些
 * 随后补齐；主机数据依旧是 onMounted 里的异步 fetchAll，不阻塞任何静态 DOM。</p>
 */
const HostFormDialog = defineAsyncComponent(() => import("./HostFormDialog.vue"));
const HostConfigDialog = defineAsyncComponent(() => import("./HostConfigDialog.vue"));
const AgentDeployDialog = defineAsyncComponent(() => import("../components/AgentDeployDialog.vue"));
const HostCommandPalette = defineAsyncComponent(() => import("../components/HostCommandPalette.vue"));
const ScHostMetricsBar = defineAsyncComponent(() => import("../components/ScHostMetricsBar.vue"));
const HostMetricHistoryDialog = defineAsyncComponent(() => import("../components/HostMetricHistoryDialog.vue"));
const ScHostSoftwareInstances = defineAsyncComponent(() => import("../components/ScHostSoftwareInstances.vue"));
const HostImportExportDialog = defineAsyncComponent(() => import("../components/HostImportExportDialog.vue"));
import type { MetricRow } from "../components/ScHostMetricsBar.types";
import type { HostMetricKind } from "../components/HostMetricHistoryDialog.types";
import type { PaletteItem } from "../components/HostCommandPalette.types";
import { useDialogPrerender } from "../utils/dialogPrerender";
import { osIconSvg } from "../utils/osIcon";
import { useSocketService, message } from "@repo/core";
import { privateIpTextOf } from "../utils/hostProfileUi";
import { submitAgentAction } from "../api";
import { hostAssetsSse, type HostSummaryPush } from "../services/realtime";
import ReTabs from "@repo/ui/re-tabs";
import ReLoader from "@repo/ui/re-loader";
import ReRailSplit, { readRailWidth } from "@repo/ui/re-rail-split";
import type { ReTabsContextItem, ReTabsItem } from "@repo/ui/re-tabs";

export interface Host {
  id: number;
  serverHostName: string;
  serverHostCode?: string | null;
  serverHostAddress: string;
  serverHostPort: number;
  /** 是否开启 SSH（1 开启；未开启的主机不能用于安装/命令执行） */
  serverHostSshEnabled?: number | null;
  /** Agent 监听端口（表单可选字段，仅编辑弹窗使用） */
  serverHostAgentPort?: number | null;
  serverHostOsType: string;
  serverHostOsArch?: string | null;
  serverHostOsVersion?: string | null;
  serverHostCpuCores?: number | null;
  serverHostMemoryMb?: number | null;
  serverHostDiskGb?: number | null;
  serverHostPublicIp?: string | null;
  serverHostPrivateIp?: string | null;
  serverHostStatus: number;
  serverHostOnline: number;
  serverHostCollectMode: string;
  serverHostCollectEnabled?: number;
  serverHostCollectInterval?: number;
  serverHostLastCollectTime?: string | null;
  /** CPU 使用率 %（最近一次采集/上报落库值） */
  serverHostCpuUsage?: number | null;
  /** 内存使用率 % */
  serverHostMemUsage?: number | null;
  /** 磁盘使用率 % */
  serverHostDiskUsage?: number | null;
  /** 磁盘读取速率 KB/s（最近一次采集落库值） */
  serverHostDiskReadKbs?: number | null;
  /** 磁盘写入速率 KB/s */
  serverHostDiskWriteKbs?: number | null;
  /** 网络接收速率 KB/s */
  serverHostNetRxKbs?: number | null;
  /** 网络发送速率 KB/s */
  serverHostNetTxKbs?: number | null;
  serverHostOnlineEnabled?: number;
  serverHostOnlineInterval?: number;
  serverHostDelayEnabled?: number;
  serverHostDelayInterval?: number;
  serverHostDelayMs?: number | null;
  serverHostLastDelayTime?: string | null;
  serverHostPorts?: string | null;
  serverHostLastPortScanTime?: string | null;
  serverHostAgentEnabled: number;
  /** Agent 是否已安装（1 已装，由生命周期服务回写） */
  serverHostAgentInstalled?: number | null;
  /** Agent 版本号 */
  serverHostAgentVersion?: string | null;
  /** 最近一次 Agent 操作失败原因 */
  serverHostAgentError?: string | null;
  serverHostRemoteEnabled: number;
  serverHostOnlineTime?: string;
  /** 分组（后端字段 msmsServerGroupId） */
  msServerGroupId?: number | null;
  /** 标签（后端字段 msServerHostTags，逗号分隔） */
  serverHostTags?: string | null;
  /** 描述/备注（后端字段 msServerHostDescription） */
  serverHostDescription?: string | null;
  /** 登录账号（瞬态，新增表单直接提交，不落库） */
  serverHostAccount?: string | null;
  /** 登录密码（瞬态） */
  serverHostPassword?: string | null;
  /** PEM 私钥（瞬态） */
  serverHostPrivateKey?: string | null;
  /** 认证类型标记（瞬态，password/key/none）：免密登录置 none，供后端 autoCreateIdentity 决定身份类型 */
  serverHostAuthType?: string | null;
  /** 远控协议（SSH/RDP/VNC，空表示按平台推断） */
  serverHostRemoteProtocol?: string | null;
  /** 远控端口（空表示按协议默认） */
  serverHostRemotePort?: number | null;
  /** 远控通道：GUACD 中转 / DIRECT 直连 */
  serverHostRemoteMode?: string | null;
  /** VNC 口令（落库 AES 加密，详情接口回显明文） */
  serverHostVncPassword?: string | null;
}

export interface Group { id: number; msServerGroupName: string; msServerGroupColor?: string | null; }
interface Identity { id: number; msServerIdentityName: string; msServerIdentityAuthType: string; msServerIdentityUsername: string; msServerIdentityRemark?: string; }

const router = useRouter();
const route = useRoute();

/**
 * 页面形态。
 *
 * <p>{@code assets}（默认）是完整的主机资产工作台；{@code control} 是「控制管理」页：
 * 左侧主机栏与主机资产完全一致（同一份数据、搜索、分组、排序、状态筛选），
 * 只把功能收窄到「点一下左侧主机，右侧直接远控」，右键菜单也只保留远控相关的少数动作。</p>
 */
const props = withDefaults(defineProps<{ mode?: "assets" | "control" }>(), { mode: "assets" });
/** 是否控制管理模式 */
const isControl = computed(() => props.mode === "control");

const hosts = ref<Host[]>([]);
const groups = ref<Group[]>([]);
const identities = ref<Identity[]>([]);
const loading = ref(false);
const loadError = ref("");
/** fetchAll 序号：并发触发时只采用最新一次结果，丢弃过期响应 */
let fetchSeq = 0;
/** 实时延迟（hostId → delayMs，socket host-delay 推送更新；-1 表不可达） */
const liveDelay = ref<Record<number, number>>({});
/** 实时在线状态（hostId → 1/0，socket host-online 推送翻转） */
const liveOnline = ref<Record<number, number>>({});
let unsubDelay: (() => void) | undefined;
let unsubOnline: (() => void) | undefined;
let unsubMetrics: (() => void) | undefined;
let unsubDeploy: (() => void) | undefined;
let unsubPortScan: (() => void) | undefined;

/** 左侧主机区检索与筛选 */
const keyword = ref("");
/** 状态筛选：all / online / offline / remote */
const statusFilter = ref<"all" | "online" | "offline" | "remote">("all");
/** 已折叠的分组 id 集合（含 0 表示「未分组」） */
const collapsedGroups = ref<Set<number>>(new Set());

/**
 * 列表排序方式。
 *
 * <p>默认「在线优先」：台账顺序是后端返回的插入顺序，重启后主机一多，
 * 离线机器会混在在线机器中间，扫列表时得逐行看状态点。</p>
 */
type SortMode = "online" | "name" | "address" | "cpu" | "mem";
const SORT_LABELS: Record<SortMode, string> = {
  online: "在线优先",
  name: "名称",
  address: "IP 地址",
  cpu: "CPU 使用率",
  mem: "内存使用率",
};
const sortMode = ref<SortMode>("online");

/** 排序方式轮换顺序（工具栏单按钮循环，比下拉少一次点击） */
const SORT_ORDER: SortMode[] = ["online", "name", "address", "cpu", "mem"];

/** 切到下一个排序方式 */
function cycleSort(): void {
  const i = SORT_ORDER.indexOf(sortMode.value);
  sortMode.value = SORT_ORDER[(i + 1) % SORT_ORDER.length] ?? "online";
}

/**
 * 多选模式。
 *
 * <p>批量操作需要一个和「单击选中」并存的选中集合：单击仍然是「选中看底部条」，
 * 只有开了多选模式，单击才改成勾选。否则用户想选中一台看指标，会误勾一堆机器。</p>
 */
const multiSelect = ref(false);
const checkedHostIds = ref<Set<number>>(new Set());

/** 切换多选模式；关闭时清空勾选，避免残留集合在下一次开启时突然生效 */
function toggleMultiSelect(): void {
  multiSelect.value = !multiSelect.value;
  if (!multiSelect.value) checkedHostIds.value = new Set();
}

/**
 * 勾选/取消一台主机
 *
 * @param h 主机
 */
function toggleCheck(h: Host): void {
  const next = new Set(checkedHostIds.value);
  if (next.has(h.id)) next.delete(h.id);
  else next.add(h.id);
  checkedHostIds.value = next;
}

/** 当前勾选的主机对象 */
const checkedHosts = computed(() => hosts.value.filter(h => checkedHostIds.value.has(h.id)));

/** 勾选全部当前筛选结果 / 取消全选 */
function toggleCheckAll(): void {
  const allChecked = filtered.value.length > 0 && filtered.value.every(h => checkedHostIds.value.has(h.id));
  checkedHostIds.value = allChecked ? new Set() : new Set(filtered.value.map(h => h.id));
}

/**
 * 批量启停远控入口。
 *
 * @param enabled 是否启用
 */
async function batchToggleRemote(enabled: boolean): Promise<void> {
  const list = checkedHosts.value;
  if (!list.length) return;
  try {
    await Promise.all(list.map(h => switchHost(h.id, enabled)));
    message.success(`已${enabled ? "启用" : "停用"} ${list.length} 台主机的远控入口`);
    checkedHostIds.value = new Set();
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

/** 批量删除（逐条确认一次，避免 20 台机器弹 20 个确认框） */
async function batchDelete(): Promise<void> {
  const list = checkedHosts.value;
  if (!list.length) return;
  try {
    await ElMessageBox.confirm(
      `删除选中的 ${list.length} 台主机？此操作不可撤销。`,
      "批量删除确认",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch { return; }
  const results = await Promise.allSettled(list.map(h => delHost(h.id)));
  const ok = results.filter(r => r.status === "fulfilled").length;
  const bad = results.length - ok;
  if (bad === 0) message.success(`已删除 ${ok} 台主机`);
  else message.warning(`已删除 ${ok} 台，${bad} 台失败（可能仍有绑定）`);
  checkedHostIds.value = new Set();
  await fetchAll();
}

/**
 * 分组折叠开关
 *
 * @param gid 分组 id（0 = 未分组）
 */
function toggleGroup(gid: number): void {
  const next = new Set(collapsedGroups.value);
  if (next.has(gid)) next.delete(gid);
  else next.add(gid);
  collapsedGroups.value = next;
}

/** 身份认证方式后缀（列表里紧跟在用户名后的短标签） */
function identityAuthSuffix(type: string | null | undefined): string {
  const t = String(type ?? "").toUpperCase();
  if (t === "PUBLIC_KEY") return "私钥";
  if (t === "NONE") return "免密";
  return "密码";
}

/** 弹窗内 ReSelect 选项（computed 缓存，避免每次渲染重算） */
const identityOptions = computed(() => identities.value.map(i => ({
  label: `${i.msServerIdentityName}（${i.msServerIdentityUsername}）${identityAuthSuffix(i.msServerIdentityAuthType)}`,
  value: i.id,
})));
const groupOptions = computed(() => groups.value.map(g => ({ label: g.msServerGroupName, value: g.id })));

/**
 * 逗号分隔标签拆分为数组
 * @param tags 标签字符串
 */
function splitTags(tags?: string | null): string[] {
  if (!tags || !tags.trim()) return [];
  // 同时兼容中英文逗号分隔（后端/手工录入可能用「，」）
  return tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
}

/** 端口扫描结果项 */
interface PortItem { port: string; protocol?: string; service?: string; state?: string; }

/** 解析端口扫描 JSON */
function parsePorts(raw?: string | null): PortItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/** 已扫描端口的 hover 明细（多行标题气泡；未扫描/空时返回空串不弹） */
function portTip(h: Host): string {
  const list = parsePorts(h.serverHostPorts);
  if (!list.length) return "";
  return list.slice(0, 60).map(p =>
    `${p.port}${p.protocol ? "/" + p.protocol : ""}${p.service ? " " + p.service : ""}${p.state ? ` (${p.state})` : ""}`,
  ).join("，") + (list.length > 60 ? ` 等 ${list.length} 个` : "");
}

/** 端口扫描（后台异步，完成后由 host-portscan socket 事件回填，不阻塞/轮询） */
async function scanHostPorts(h: Host): Promise<void> {
  try {
    const r: any = await scanPorts(h.id);
    message.success(r?.msg || `端口扫描已开始，完成后自动更新 ${h.serverHostAddress}`);
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}
/**
 * 分组 ID 查名称
 * @param id 分组 ID
 */
function groupName(id?: number | null): string {
  if (!id) return "未分组";
  return groups.value.find(g => g.id === id)?.msServerGroupName ?? "组#" + id;
}

// ---- 实时指标（socket 推送，不轮询；底部状态条与页签状态点共用这份数据） ----
/** 一台主机的实时指标快照 */
interface RtMetric {
  /** CPU 使用率 % */
  cpu: number;
  /** 内存使用率 % */
  mem: number;
  /** 磁盘使用率 % */
  disk: number;
  /** 磁盘读速率 KB/s */
  diskRead: number;
  /** 磁盘写速率 KB/s */
  diskWrite: number;
  /** 网络接收速率 KB/s */
  netRx: number;
  /** 网络发送速率 KB/s */
  netTx: number;
  /** 是否已经有 IO 数值（没有时底部条显示「—」而不是 0） */
  hasIo: boolean;
}

const realtimeEnabled = ref(localStorage.getItem('assets-realtime-enabled') !== 'false');
const rtMetrics = reactive<Record<number, RtMetric>>({});

/**
 * 实时监控开关。
 *
 * <p>关掉时清空缓存而不是留着最后一份：留着会让底部状态条停在一个不再更新的
 * 数字上，看起来像「还在采」，实际是「已经停了」。</p>
 *
 * @param v 是否开启
 */
function onRealtimeToggle(v: boolean): void {
  realtimeEnabled.value = v;
  localStorage.setItem('assets-realtime-enabled', String(v));
  if (!v) {
    Object.keys(rtMetrics).forEach(k => delete rtMetrics[Number(k)]);
    return;
  }
  syncRtFromHosts();
}

/**
 * 用主机台账里最近一次采集/上报的使用率铺首帧
 * <p>socket 推送只覆盖「推送之后」的时间窗，列表每次刷新都要按落库值重算，
 * 否则刷新页面要等一个采集周期才有指标。</p>
 */
function syncRtFromHosts(): void {
  if (!realtimeEnabled.value) return;
  for (const h of hosts.value) {
    if (h.serverHostCpuUsage == null && h.serverHostMemUsage == null && h.serverHostDiskUsage == null) {
      continue;
    }
    const prev = rtMetrics[h.id];
    const cpu = Math.round((Number(h.serverHostCpuUsage) || 0) * 10) / 10;
    // IO 速率只在推送里出现（台账字段是最近一次采集的落库值，首帧也拿来铺）
    const hasIo = prev?.hasIo
      || h.serverHostDiskReadKbs != null
      || h.serverHostDiskWriteKbs != null;
    rtMetrics[h.id] = {
      cpu,
      mem: Math.round((Number(h.serverHostMemUsage) || 0) * 10) / 10,
      disk: Math.round((Number(h.serverHostDiskUsage) || 0) * 10) / 10,
      diskRead: prev?.hasIo ? prev.diskRead : Number(h.serverHostDiskReadKbs) || 0,
      diskWrite: prev?.hasIo ? prev.diskWrite : Number(h.serverHostDiskWriteKbs) || 0,
      netRx: prev?.hasIo ? prev.netRx : Number(h.serverHostNetRxKbs) || 0,
      netTx: prev?.hasIo ? prev.netTx : Number(h.serverHostNetTxKbs) || 0,
      hasIo,
    };
  }
}
/**
 * 分组标记点的颜色。
 *
 * <p>只给实心底色：6px 的小圆点用半透明底等于看不见，
 * 原先那套「半透明底 + 反色文字」是给表格里的分组标签用的，圆点用不上。</p>
 *
 * @param id 分组 id
 */
function groupDotStyle(id?: number | null): Record<string, string> {
  const c = (id ? groups.value.find(g => g.id === id)?.msServerGroupColor : "") ?? "";
  return /^#[0-9a-fA-F]{6}$/.test(c) ? { background: c } : {};
}

/**
 * 生效远控协议：主机配置优先，未配置时按平台推断
 * @param h 主机
 */
function protocolOf(h: Host): string {
  const p = (h.serverHostRemoteProtocol ?? "").toUpperCase();
  if (p === "SSH" || p === "TELNET" || p === "RDP" || p === "VNC") return p.toLowerCase();
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
}
/**
 * 生效远控端口：协议与台账一致时用台账端口，否则按协议默认（见 TerminalView.remotePortOf 说明）。
 * @param h 主机
 */
function remotePortOf(h: Host): number {
  const p = protocolOf(h);
  const configured = (h.serverHostRemoteProtocol ?? "").toLowerCase();
  if (configured === p && h.serverHostRemotePort && h.serverHostRemotePort > 0) return h.serverHostRemotePort;
  if (p === "ssh") return h.serverHostPort || 22;
  if (p === "telnet") return h.serverHostPort || 23;
  return p === "rdp" ? 3389 : 5900;
}
const onlineCount = computed(() => hosts.value.filter(h => liveOnlineState(h) === 1).length);
const remoteCount = computed(() => hosts.value.filter(h => h.serverHostRemoteEnabled === 1).length);
const offlineCount = computed(() => hosts.value.length - onlineCount.value);

/** 左侧主机区筛选结果（关键字 + 状态 + 排序） */
const filtered = computed(() => {
  let list = hosts.value;
  if (statusFilter.value === "online") list = list.filter(h => liveOnlineState(h) === 1);
  else if (statusFilter.value === "offline") list = list.filter(h => liveOnlineState(h) !== 1);
  else if (statusFilter.value === "remote") list = list.filter(h => h.serverHostRemoteEnabled === 1);
  const kw = keyword.value.trim().toLowerCase();
  if (kw) {
    list = list.filter(h =>
      (h.serverHostName ?? "").toLowerCase().includes(kw)
      || (h.serverHostAddress ?? "").toLowerCase().includes(kw)
      || splitTags(h.serverHostTags).some(t => t.toLowerCase().includes(kw)));
  }
  return sortHosts(list, sortMode.value);
});

/**
 * 按当前排序方式重排主机。
 *
 * <p>每种排序都以「在线优先」作次级键：按 CPU 排序时，离线机器的 CPU 是上一轮采集
 * 的陈旧值，若让它排到最前面，用户会以为这台机器正在满载。</p>
 *
 * @param list 待排序主机
 * @param mode 排序方式
 */
function sortHosts(list: Host[], mode: SortMode): Host[] {
  const arr = [...list];
  const byOnline = (a: Host, b: Host) => (liveOnlineState(b) === 1 ? 1 : 0) - (liveOnlineState(a) === 1 ? 1 : 0);
  const zh = (a: string, b: string) => a.localeCompare(b, "zh-Hans-CN");
  switch (mode) {
    case "name":
      return arr.sort((a, b) => byOnline(a, b) || zh(a.serverHostName ?? "", b.serverHostName ?? ""));
    case "address":
      // IP 按自然序比：纯字典序会把 10.0.1.9 排在 10.0.1.10 后面
      return arr.sort((a, b) => byOnline(a, b) || (a.serverHostAddress ?? "").localeCompare(
        b.serverHostAddress ?? "", undefined, { numeric: true }));
    case "cpu":
      return arr.sort((a, b) => byOnline(a, b) || usageOf(b, "cpu") - usageOf(a, "cpu"));
    case "mem":
      return arr.sort((a, b) => byOnline(a, b) || usageOf(b, "mem") - usageOf(a, "mem"));
    default:
      return arr.sort((a, b) => byOnline(a, b) || zh(a.serverHostName ?? "", b.serverHostName ?? ""));
  }
}

/**
 * 取主机某项使用率（实时值优先，回退台账落库值）
 *
 * @param h 主机
 * @param key 指标
 */
function usageOf(h: Host, key: "cpu" | "mem" | "disk"): number {
  const live = rtMetrics[h.id];
  if (live) return Number(live[key]) || 0;
  if (key === "cpu") return Number(h.serverHostCpuUsage) || 0;
  if (key === "mem") return Number(h.serverHostMemUsage) || 0;
  return Number(h.serverHostDiskUsage) || 0;
}

/**
 * 该主机是否有可展示的指标值
 *
 * @param h 主机
 */
function hasUsage(h: Host): boolean {
  if (rtMetrics[h.id]) return true;
  return h.serverHostCpuUsage != null || h.serverHostMemUsage != null || h.serverHostDiskUsage != null;
}


/** 按分组归拢后的左侧列表（组头带在线统计，可折叠） */
interface HostGroupBucket {
  id: number;
  name: string;
  color?: string | null;
  hosts: Host[];
  online: number;
}

const groupedHosts = computed<HostGroupBucket[]>(() => {
  const map = new Map<number, HostGroupBucket>();
  for (const h of filtered.value) {
    const gid = h.msServerGroupId ?? 0;
    if (!map.has(gid)) {
      const g = groups.value.find(x => x.id === gid);
      map.set(gid, {
        id: gid,
        name: gid === 0 ? "未分组" : (g?.msServerGroupName ?? `组#${gid}`),
        color: g?.msServerGroupColor ?? null,
        hosts: [],
        online: 0,
      });
    }
    const bucket = map.get(gid)!;
    bucket.hosts.push(h);
    if (liveOnlineState(h) === 1) bucket.online++;
  }
  // 有分组名的排前面（按名称），「未分组」垫底
  return [...map.values()].sort((a, b) => {
    if (a.id === 0) return 1;
    if (b.id === 0) return -1;
    return a.name.localeCompare(b.name, "zh-Hans-CN");
  });
});

/**
 * 是否存在主机（与筛选结果无关）。
 *
 * <p>用于区分空态的两种情况：库里一台都没有 vs. 筛选把结果清空了。
 * 这两种情况给同一个「暂无主机」文案，用户会以为系统坏了而不是自己筛得太严。</p>
 */
const hasHosts = computed(() => hosts.value.length > 0);

/**
 * 左侧空态文案。
 *
 * <p>三种情况刻意分开，不能压缩成两种：加载失败时 {@code hosts} 也是空数组，
 * 若只按「有没有主机」判，就会把「没读到」显示成「暂无主机」——
 * 用户照着提示去点「新增主机」，增完刷新还是空的，完全被带偏。</p>
 */
const emptyDescription = computed(() => {
  if (loadError.value) return "数据加载失败，请重试";
  return hasHosts.value ? "当前筛选条件下没有匹配的主机" : "暂无主机";
});

async function fetchAll(): Promise<void> {
  const seq = ++fetchSeq;
  loading.value = true;
  loadError.value = "";
  // 三个接口各自独立发起、各自回填，互不等待：
  //   - 主机列表先回来就先渲染左栏，不必等分组/身份接口；
  //   - 分组、身份较慢或失败时，只影响对应的下拉/筛选，不拖住主机列表，也不把整页判成失败。
  const hostsTask = queryHosts()
    .then((h) => {
      if (seq !== fetchSeq) return; // 已被更新的一次 fetch 取代，丢弃过期结果，避免旧数据覆盖新数据
      hosts.value = Array.isArray(h) ? h.sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0)) : [];
      syncRtFromHosts();
    })
    .catch((e) => {
      if (seq !== fetchSeq) return;
      hosts.value = [];
      loadError.value = String((e as Error)?.message ?? e);
    });
  const groupsTask = getGroups()
    .then((g) => {
      if (seq !== fetchSeq) return;
      // 接口异常时可能返回对象而非数组，直接 .map 会把页面打崩（空态都渲染不出来），这里统一兜底。
      groups.value = Array.isArray(g) ? g : [];
    })
    .catch(() => undefined);
  const identitiesTask = getIdentities()
    .then((i) => {
      if (seq !== fetchSeq) return;
      identities.value = Array.isArray(i) ? i : [];
    })
    .catch(() => undefined);
  try {
    await Promise.allSettled([hostsTask, groupsTask, identitiesTask]);
  } finally {
    if (seq === fetchSeq) loading.value = false;
  }
}

/* ==================== 主机工作区（Deck 布局） ==================== */

/**
 * 页签功能类型。
 *
 * <p>画像是「一堆互不相干的分区」，把它们塞进一个页签再套一层分段切换，
 * 等于在右侧又造了一个小页面。这里每个分区各自是一个独立页签，
 * 与远控 / 文件 / 指标平级 —— 打开哪个看哪个，不用先选主机再选分区。</p>
 */
type TabKind =
  | "ports"
  | "processes"
  | "services"
  | "disks"
  | "mounts"
  | "network"
  | "env"
  | "firewall"
  | "sysconfig"
  | "deleted"
  | "remote"
  | "desktop"
  | "files"
  | "metrics"
  | "workbench"
  | "sys-log"
  | "user-log"
  | "ops-sessions"
  | "ops-exec"
  | "ops-snippets"
  | "ops-maintenance"
  | "host-accounts"
  | "alarm-policy"
  | "software"
  | "software-instance"
  | "schedule";

/** 功能定义：名称 / 图标 / 是否为画像分区 */
interface TabKindMeta {
  label: string;
  icon: string;
  /** 画像分区 key（非画像功能为空） */
  section?: string;
}

const TAB_KINDS: Record<TabKind, TabKindMeta> = {
  ports: { label: "监听端口", icon: "Connection", section: "ports" },
  processes: { label: "进程", icon: "Cpu", section: "processes" },
  services: { label: "服务", icon: "SetUp", section: "services" },
  disks: { label: "磁盘", icon: "Coin", section: "disks" },
  mounts: { label: "挂载盘", icon: "Files", section: "mounts" },
  network: { label: "网络", icon: "Share", section: "network" },
  env: { label: "环境变量", icon: "Document", section: "env" },
  firewall: { label: "防火墙", icon: "Lock", section: "firewall" },
  sysconfig: { label: "主机配置", icon: "Setting", section: "sysconfig" },
  deleted: { label: "已删除文件", icon: "Delete", section: "deleted" },
  remote: { label: "远控", icon: "Position" },
  desktop: { label: "虚拟桌面", icon: "FullScreen" },
  files: { label: "文件管理", icon: "FolderOpened" },
  metrics: { label: "指标监控", icon: "TrendCharts" },
  workbench: { label: "工作台", icon: "Box" },
  "sys-log": { label: "系统日志", icon: "Tickets" },
  "user-log": { label: "登录日志", icon: "Unlock" },
  "ops-sessions": { label: "会话审计", icon: "Document" },
  "ops-exec": { label: "批量作业", icon: "Promotion" },
  "ops-snippets": { label: "片段管理", icon: "DocumentCopy" },
  "ops-maintenance": { label: "维护计划", icon: "Clock" },
  "host-accounts": { label: "主机账号", icon: "User" },
  "alarm-policy": { label: "告警策略", icon: "Bell" },
  software: { label: "软件管理", icon: "Box" },
  "software-instance": { label: "软件实例", icon: "Cpu" },
  schedule: { label: "调度信息", icon: "Clock" },
};

/**
 * 工作台页签内的面板类型。
 *
 * <p>Docker 与分屏 / K8s / 隧道平级：都是「这台主机」的一个工作台页签，
 * 而不是跳去整站级的 /docker 路由（那样会变成顶层路由页签，丢掉主机上下文）。</p>
 */
type WorkbenchPanelKind = "screen" | "docker" | "k8s" | "tunnel" | "tunnel-reverse";

/** 工作区页签（比 ReTabsItem 多带主机上下文，便于渲染内容） */
interface WorkTab extends ReTabsItem {
  hostId: number;
  kind: TabKind;
  /** 文件管理页签的初始路径 */
  path?: string;
  /** 远控页签使用的登录身份（空 = 默认凭据） */
  identityId?: number | null;
  /** 工作台页签初始面板（screen / docker / k8s / tunnel / tunnel-reverse） */
  startPanel?: WorkbenchPanelKind;
}

/** 已打开的页签 */
const openTabs = ref<WorkTab[]>([]);
/** 当前激活页签 name */
const activeTab = ref("");

/**
 * 打开一个功能页签。
 *
 * <p>同一个「主机 + 功能」只开一次：重复点同一个动作是切过去，不是再开一个副本。
 * 否则用户点两下「进程」就会看到两个内容一模一样的页签，关闭时还要关两次。</p>
 *
 * <p>工作台比较特殊：分屏 / Docker / K8s / 隧道是不同面板，各开各的页签；
 * 同名面板（同一主机 + 同一面板）仍只开一次。页签名由
 * {@code `${host.id}:workbench:${panel}`} 承载去重，不同面板互不冲突。</p>
 *
 * <p>Docker 同样进工作区页签：右键菜单与分屏工具条都以当前主机为上下文打开
 * 「工作台 · Docker」页签，页内复用 {@code @pages/docker} 的双栏实现。</p>
 *
 * @param host 目标主机
 * @param kind 功能类型
 * @param opts 附加参数（文件管理初始路径 / 远控登录身份 / 工作台初始面板）
 */
function openTab(host: Host, kind: TabKind, opts?: { path?: string; identityId?: number | null; startPanel?: WorkbenchPanelKind }): void {
  const base = `${host.id}:${kind}`;
  const name = kind === "workbench" && opts?.startPanel ? `${base}:${opts.startPanel}` : base;
  const exist = openTabs.value.find(t => t.name === name);
  if (exist) {
    if (opts?.path) exist.path = opts.path;
    if (opts?.identityId != null) exist.identityId = opts.identityId;
    activeTab.value = name;
    return;
  }
  const meta = TAB_KINDS[kind];
  const tab: WorkTab = {
    name,
    hostId: host.id,
    kind,
    label: host.serverHostName,
    hint: opts?.startPanel && kind === "workbench"
      ? `${meta.label} · ${panelLabelOf(opts.startPanel)}`
      : meta.label,
    icon: meta.icon,
    status: liveOnlineState(host) === 1 ? "online" : "offline",
    closable: true,
    path: opts?.path,
    identityId: opts?.identityId ?? null,
    startPanel: kind === "workbench" ? (opts?.startPanel ?? "screen") : undefined,
  };
  openTabs.value = [...openTabs.value, tab];
  activeTab.value = name;
  pushActivity(`打开 ${host.serverHostName} · ${tab.hint}`, meta.icon, host.id);
}

/**
 * 深链：外部入口直接打开某台主机的功能页签。
 *
 * <p>例：发布管理卡片的「软件仓库」跳 {@code /assets?hostId=4&tab=software}，
 * 落地即打开该主机的「软件管理」页签，而不是停在监控页。主机列表尚未加载时
 * 先等一次 {@code fetchAll}，避免深链在慢网络下被当成「主机不存在」。</p>
 */
async function applyDeepLink(): Promise<void> {
  const rawHost = route.query.hostId;
  const rawTab = route.query.tab;
  if (rawHost == null || rawTab == null) return;
  const hostId = Number(rawHost);
  const kind = String(rawTab) as TabKind;
  if (!Number.isFinite(hostId) || !(kind in TAB_KINDS)) return;
  if (!hosts.value.length) {
    await fetchAll();
  }
  const host = hosts.value.find(h => h.id === hostId);
  if (!host) {
    message.warning("未找到该主机，无法打开对应页签");
    return;
  }
  selectHost(host);
  openTab(host, kind);
}

// 深链参数变化时也要补开页签：/desktop/:hostId 的兼容跳板只改 query，
// 不会重新挂载主机资产页，不补这一次就只剩一个空的工作区。
watch(
  () => [route.query.hostId, route.query.tab],
  () => {
    if (route.path === "/assets") void applyDeepLink();
  },
);

/** 工作台面板的展示名（页签 hint / 右键菜单共用） */
function panelLabelOf(p: "screen" | "docker" | "k8s" | "tunnel" | "tunnel-reverse"): string {
  return p === "screen" ? "分屏终端"
    : p === "docker" ? "Docker"
    : p === "k8s" ? "K8s"
    : p === "tunnel" ? "隧道" : "反向隧道";
}

/**
 * 关闭页签：若关的是当前页签，自动切到相邻的一个（右优先，其次左）。
 *
 * @param name 页签 name
 */
function closeTab(name: string): void {
  const idx = openTabs.value.findIndex(t => t.name === name);
  if (idx < 0) return;
  // 页签关掉就把它的异步态一起丢掉：同名页签重开时必须从干净的加载态开始
  delete tabAsyncBusy[name];
  const rest = openTabs.value.filter(t => t.name !== name);
  openTabs.value = rest;
  if (activeTab.value !== name) return;
  const next = rest[idx] ?? rest[idx - 1] ?? rest[0];
  activeTab.value = next?.name ?? "";
}

/** 关闭其它页签（保留目标页签） */
function closeOtherTabs(name: string): void {
  openTabs.value = openTabs.value.filter(t => t.name === name);
  activeTab.value = name;
}

/** 关闭右侧页签 */
function closeTabsToRight(name: string): void {
  const idx = openTabs.value.findIndex(t => t.name === name);
  if (idx < 0) return;
  openTabs.value = openTabs.value.slice(0, idx + 1);
  if (!openTabs.value.some(t => t.name === activeTab.value)) activeTab.value = name;
}

/** 关闭全部页签 */
function closeAllTabs(): void {
  openTabs.value = [];
  activeTab.value = "";
  for (const key of Object.keys(tabAsyncBusy)) delete tabAsyncBusy[key];
}

/** 当前激活的页签对象 */
const activeTabObj = computed(() => openTabs.value.find(t => t.name === activeTab.value) ?? null);

/** 当前激活页签对应主机 */
const activeTabHost = computed<Host | null>(() => {
  const t = activeTabObj.value;
  if (!t) return null;
  return hosts.value.find(h => h.id === t.hostId) ?? null;
});

/** 左侧选中的主机（用于右键菜单与状态条） */
const selectedHost = ref<Host | null>(null);

/** 底部状态条要展示的主机：有激活页签看激活页签，否则看左侧选中的主机 */
const statusHost = computed<Host | null>(() => activeTabHost.value ?? selectedHost.value);

/** 页签刷新代次（按页签 name 计），作为子组件 key 的一部分，变化即重建内容 */
const tabReloadSeq = reactive<Record<string, number>>({});
/** 页签首次打开 / 切换时的局部加载动画；不重建终端会话 */
const tabLoading = ref(false);
let tabLoadingTimer: ReturnType<typeof setTimeout> | null = null;

function showTabLoading(): void {
  if (tabLoadingTimer) clearTimeout(tabLoadingTimer);
  tabLoading.value = true;
  tabLoadingTimer = setTimeout(() => {
    tabLoading.value = false;
    tabLoadingTimer = null;
  }, 260);
}

watch(activeTab, () => showTabLoading());
onBeforeUnmount(() => {
  if (tabLoadingTimer) clearTimeout(tabLoadingTimer);
});

/**
 * 页签内容是否还在等懒加载分包。
 *
 * <p>tabLoading 只管「切页签」那一下的 260ms 视觉过渡，它不知道分包要下多久：
 * 首次打开画像 / 运维台这类大页面时，Vite 现场编译 + 下载往往超过 260ms，
 * 过渡动画早早收掉，页签面板就只剩一片白。这里把 <b>真实</b>的异步边界
 * 接进来 —— 面板里的 Suspense 挂起时点亮、解析完成时熄灭，两种情况取并集，
 * 加载动画才会一直盖到内容真正渲染为止。</p>
 *
 * <p>只记布尔值而不是计数：Suspense 一次挂起只会发一次 pending、全部解析后
 * 发一次 resolve，重复 pending 不会把状态卡在 true。</p>
 */
const tabAsyncBusy = reactive<Record<string, boolean>>({});

/** 页签内的异步依赖开始挂起 */
function markTabPending(name: string): void {
  if (!name) return;
  tabAsyncBusy[name] = true;
}

/** 页签内的异步依赖全部解析（分包已就绪，可以渲染真实内容） */
function markTabResolved(name: string): void {
  if (!name) return;
  delete tabAsyncBusy[name];
}

/**
 * 某个页签内容的加载态。
 *
 * <p>两个来源取并集：真在等分包（tabAsyncBusy），或正处于切页签的短暂过渡期
 * （只有当前页签参与，避免后台页签跟着闪）。</p>
 *
 * @param name 页签 name
 */
function tabLoadingOf(name: string): boolean {
  return tabAsyncBusy[name] === true || (name === activeTab.value && tabLoading.value);
}

/**
 * 取某个页签当前的刷新代次（未刷新过为 0）。
 *
 * @param name 页签 name
 */
function reloadSeqOf(name: string): number {
  return tabReloadSeq[name] ?? 0;
}

/** 页签右键菜单 */
const tabContextMenu = computed<ReTabsContextItem[]>(() => {
  const idx = openTabs.value.findIndex(t => t.name === activeTab.value);
  const hasRight = idx >= 0 && idx < openTabs.value.length - 1;
  return [
    { key: "refresh", label: "刷新当前页签", icon: "RefreshRight" },
    { key: "reopen", label: "重新打开（清空状态）", icon: "Refresh" },
    { key: "close", label: "关闭当前页签", icon: "Close", divided: true },
    { key: "close-others", label: "关闭其它页签", icon: "CircleClose", disabled: openTabs.value.length <= 1 },
    { key: "close-right", label: "关闭右侧页签", icon: "DArrowRight", disabled: !hasRight },
    { key: "close-all", label: "关闭全部页签", icon: "Delete", danger: true, divided: true },
  ];
});

/**
 * 页签右键命令分发。
 *
 * @param payload.key 命令标识
 * @param payload.tab 触发菜单的页签
 */
function onTabCommand(payload: { key: string; tab: ReTabsItem }): void {
  const name = payload.tab.name;
  switch (payload.key) {
    case "close":
      closeTab(name);
      break;
    case "close-others":
      closeOtherTabs(name);
      break;
    case "close-right":
      closeTabsToRight(name);
      break;
    case "close-all":
      closeAllTabs();
      break;
    case "refresh":
      // 按页签计数：刷 A 页签不该顺手把 B 页签也重建（B 可能正在跑终端会话）
      tabReloadSeq[name] = reloadSeqOf(name) + 1;
      // 重建过程本身有读取耗时，给同一块内容区一次加载动画，避免白屏闪一下
      showTabLoading();
      break;
    case "reopen": {
      // 先关再开：用于终端会话卡死、文件列表脏数据等需要彻底重建的场景
      const t = openTabs.value.find(x => x.name === name);
      if (!t) break;
      const host = hosts.value.find(h => h.id === t.hostId);
      const kind = t.kind;
      const path = t.path;
      closeTab(name);
      if (host) openTab(host, kind, { path, identityId: t.identityId });
      break;
    }
    default:
      break;
  }
}

/* ==================== 左侧主机右键菜单：全部功能入口 ==================== */

/** 右键菜单状态 */
const ctxMenu = reactive<{ visible: boolean; x: number; y: number; host: Host | null }>({
  visible: false,
  x: 0,
  y: 0,
  host: null,
});

/** 菜单估算尺寸（仅在菜单尚未挂载、量不到真实高度时兜底） */
const CTX_MENU_W = 214;
const CTX_MENU_H = 430;

/** 菜单根节点：挂载后按真实尺寸贴边翻转，比估算值可靠 */
const ctxMenuEl = ref<HTMLElement | null>(null);

/**
 * 当前展开的二级菜单。
 *
 * <p>菜单原来一口气摊了三十多条，用户找不到东西；现在按「打开 / 运维 / 配置」分组：
 * 画像七个分区、工作台五个面板、运维台四页、主机管理九项、系统三项、Agent 生命周期、
 * 复制三项各自收进一个二级菜单，顶层只剩十来个高频动作。</p>
 */
const ctxSub = ref<string | null>(null);

/** 二级菜单分组标识：工作台 / 画像 / 运维台 / 主机管理 / 系统 / Agent / 复制 */
type CtxSubKey = "profile" | "workspace" | "workbench" | "manage" | "system" | "agent" | "copy";

/**
 * 二级菜单（hover 弹出浮层）。
 *
 * <p>经典右键交互：鼠标悬停到「工作台 / 主机画像 / 运维台」上，子菜单
 * 在右侧弹出浮层；移开光标时子菜单跟随收起。点击分组项本身只是展开/收起，
 * 不触发任何命令（命令在子项上）。</p>
 *
 * @param key 分组标识
 */
function toggleCtxSub(key: CtxSubKey): void {
  ctxSub.value = ctxSub.value === key ? null : key;
}

/** hover 进入分组项：立即展开该分组（并收起其它分组） */
function hoverCtxSub(key: CtxSubKey): void {
  ctxSub.value = key;
}

/** hover 离开分组项：若没有进入子菜单则收起 */
function leaveCtxSub(key: CtxSubKey): void {
  if (ctxSub.value === key) ctxSub.value = null;
}

/** 浮层与视口边缘的最小间距 */
const CTX_EDGE = 8;

/**
 * 把当前展开的二级菜单按实测坐标贴进视口。
 *
 * <p>子菜单向上还是向下、向左还是向右，不能按「第几个分组」写死：右键菜单本身
 * 已经被主定位逻辑翻转过，同一个分组在不同屏幕 / 不同主机名宽度下会处在完全
 * 不同的位置。这里统一按真实 rect 判断——右侧放不下就翻到左侧，底部放不下就
 * 整体上移，最后用 max-height 兜底，保证任何一项都不会跑到 DOM 视口外面。</p>
 */
function fitCtxSub(): void {
  const menu = ctxMenuEl.value;
  if (!menu) return;
  const item = menu.querySelector<HTMLElement>(".host-ctx-item.has-sub.is-open");
  const sub = item?.querySelector<HTMLElement>(".host-ctx-sub");
  if (!item || !sub) return;

  // 清掉上一轮写入的内联值，回到 CSS 默认位置重新测量
  sub.style.left = "";
  sub.style.right = "";
  sub.style.top = "";
  sub.style.bottom = "";
  sub.style.maxHeight = "";

  const ir = item.getBoundingClientRect();
  const sw = sub.offsetWidth;
  const sh = sub.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 横向：默认贴分组项右侧；右边放不下就翻到左边，两边都紧张时贴右边缘收口
  let left = ir.right + 2;
  if (left + sw > vw - CTX_EDGE) {
    const flipped = ir.left - sw - 2;
    left = flipped >= CTX_EDGE ? flipped : Math.max(CTX_EDGE, vw - sw - CTX_EDGE);
  }

  // 纵向：与分组项顶端对齐（-6px 视觉贴合），越界则整体上移到视口内
  let top = ir.top - 6;
  if (top + sh > vh - CTX_EDGE) top = vh - CTX_EDGE - sh;
  if (top < CTX_EDGE) top = CTX_EDGE;

  sub.style.left = `${left - ir.left}px`;
  sub.style.top = `${top - ir.top}px`;
  sub.style.maxHeight = `${vh - CTX_EDGE * 2}px`;
}

// 展开哪个分组由 hover / 点击决定，渲染完成后再量真实尺寸回填位置
watch(ctxSub, async () => {
  await nextTick();
  fitCtxSub();
});

/**
 * 打开主机右键菜单。
 *
 * <p>菜单位置要等挂载后才能算准：条目数随「是否 Agent 模式 / 是否已装 Agent」
 * 变化，用固定估算值会在小屏上把「删除主机」顶出视口。所以先按鼠标点落下位，
 * 下一帧量真实宽高再翻转。</p>
 *
 * @param event 原生右键事件
 * @param h 目标主机
 */
async function openCtxMenuAt(x: number, y: number, h: Host): Promise<void> {
  // 右键/按钮同时选中：用户接下来要操作的机器，底部状态条也该跟着它
  selectHost(h);
  ctxSub.value = null;
  ctxMenu.host = h;
  ctxMenu.x = Math.max(8, x);
  ctxMenu.y = Math.max(8, y);
  ctxMenu.visible = true;

  await nextTick();
  const el = ctxMenuEl.value;
  if (!el) return;
  const w = el.offsetWidth || CTX_MENU_W;
  const ht = el.offsetHeight || CTX_MENU_H;
  let nx = x;
  let ny = y;
  if (nx + w > window.innerWidth - 8) nx = window.innerWidth - w - 8;
  if (ny + ht > window.innerHeight - 8) ny = window.innerHeight - ht - 8;
  ctxMenu.x = Math.max(8, nx);
  ctxMenu.y = Math.max(8, ny);
}

async function openCtxMenu(event: MouseEvent, h: Host): Promise<void> {
  event.preventDefault();
  event.stopPropagation();
  await openCtxMenuAt(event.clientX, event.clientY, h);
}

/**
 * 行内「更多」按钮打开同一套菜单。
 *
 * <p>锚点取按钮的左下角而不是鼠标位置：按钮只有 18px 见方，按鼠标点落位会让菜单
 * 压住整行，用户看不到自己点的是哪台机器。左下角对齐后菜单正好贴在该行下方。</p>
 *
 * @param event 原生点击事件（currentTarget 为按钮）
 * @param h 目标主机
 */
async function openCtxMenuFromButton(event: MouseEvent, h: Host): Promise<void> {
  event.preventDefault();
  event.stopPropagation();
  const r = (event.currentTarget as HTMLElement).getBoundingClientRect();
  await openCtxMenuAt(r.left, r.bottom + 4, h);
}

/** 关闭右键菜单 */
function closeCtxMenu(): void {
  ctxMenu.visible = false;
  ctxMenu.host = null;
  ctxSub.value = null;
}

/**
 * 从右键菜单打开运维台 / 主机账号：在工作区内嵌为页签（不离开主机资产页）。
 *
 * <p>这些页面是整站级视图（会话审计 / 批量作业 / 片段管理 / 维护计划 / 主机账号），
 * 但用户的起点是「这台主机」，所以收在工作区页签里并带上主机过滤参数，
 * 落地页能直接聚焦到这台机器。</p>
 *
 * @param kind 页签类型
 */
function ctxOpenTab(kind: Extract<TabKind, "ops-sessions" | "ops-exec" | "ops-snippets" | "ops-maintenance" | "host-accounts" | "alarm-policy">): void {
  const h = ctxMenu.host;
  closeCtxMenu();
  if (h) openTab(h, kind);
}

/**
 * 分屏终端里点某屏的 Docker / K8s / 隧道工具条：以该屏主机为上下文开工作台页签。
 *
 * <p>Docker 不再是整站路由页：它就是这台主机的工作台页签（页内复用
 * {@code @pages/docker} 的双栏实现），和 K8s / 隧道一样带主机上下文，
 * 也不会在顶部路由页签栏里多出一个与主机无关的「Docker」。</p>
 *
 * @param panel   面板类型
 * @param hostId  该屏主机 id
 * @param hostName 该屏主机名
 */
function onWorkbenchOpenPanel(
  panel: "docker" | "k8s" | "tunnel" | "tunnel-reverse",
  hostId: number,
  hostName: string,
): void {
  const host = hosts.value.find((h) => h.id === hostId);
  if (host) {
    openTab(host, "workbench", { startPanel: panel });
    return;
  }
  // 找不到台账（例如临时屏）时以页签绑定主机兜底
  const any = openTabs.value.find((t) => t.kind === "workbench") && hosts.value[0];
  if (any) openTab(hosts.value[0], "workbench", { startPanel: panel });
}

/**
 * 右键命令分发。
 *
 * <p>左侧主机行的右键菜单是<b>唯一</b>的功能总入口：远控 / 文件 / 指标 / 画像各分区
 * 全在这里，卡片和列表上不再各摆一排按钮。用户明确要求「入口都放到左侧右键里」，
 * 这样右侧工作区才能干净地只做「内容」。</p>
 *
 * @param cmd 命令标识
 */
function ctxCommand(cmd: string): void {
  const h = ctxMenu.host;
  closeCtxMenu();
  if (!h) return;
  // 工作区页签类命令
  const tabCmds: Record<string, TabKind> = {
    "tab-remote": "remote",
    "tab-files": "files",
    "tab-metrics": "metrics",
    "tab-ports": "ports",
    "tab-processes": "processes",
    "tab-services": "services",
    "tab-disks": "disks",
    "tab-mounts": "mounts",
    "tab-network": "network",
    "tab-env": "env",
    "tab-firewall": "firewall",
    "tab-sysconfig": "sysconfig",
    "tab-deleted": "deleted",
  };
  const kind = tabCmds[cmd];
  if (kind) {
    openTab(h, kind);
    return;
  }
  // Docker 是这台主机的「工作台 · Docker」页签：页内复用独立页面包
  // @pages/docker 的双栏实现（左容器清单 + 右工作区），不跳整站 /docker 路由，
  // 避免变成与主机无关的顶层路由页签。
  if (cmd === "tab-docker") {
    openTab(h, "workbench", { startPanel: "docker" });
    return;
  }
  if (cmd === "open-sys-log" || cmd === "open-user-log") {
    // 日志页收进工作区页签（与软件管理同进 ReTabs），不再推单独的页面；
    // 内容读的是这台服务器自身的日志（journalctl / /var/log / wevtutil），
    // 不是 @pages/system 的平台软件操作日志，所以页签必须带主机上下文。
    openTab(h, cmd === "open-sys-log" ? "sys-log" : "user-log");
    return;
  }
  const panelMap: Record<string, WorkbenchPanelKind> = {
    "tab-workbench": "screen",
    "tab-k8s": "k8s",
    "tab-tunnel": "tunnel",
    "tab-tunnel-reverse": "tunnel-reverse",
  };
  const startPanel = panelMap[cmd];
  if (startPanel) {
    openTab(h, "workbench", { startPanel });
    return;
  }
  switch (cmd) {
    case "toggle-remote":
      toggleHost(h);
      break;
    case "edit":
      openEdit(h);
      break;
    case "scan":
      scanHostPorts(h);
      break;
    case "software":
      openTab(h, "software");
      break;
    case "software-instance":
      openTab(h, "software-instance");
      break;
    case "desktop":
      openDesktop(h.id);
      break;
    case "schedule":
      openTab(h, "schedule");
      break;
    case "agent-install":
      openDeploy(h, "install");
      break;
    case "agent-reinstall":
      openDeploy(h, "reinstall");
      break;
    case "agent-upgrade":
      openDeploy(h, "upgrade");
      break;
    case "agent-uninstall":
      openDeploy(h, "uninstall");
      break;
    case "delete":
      removeHost(h);
      break;
    case "open-all-profile": {
      // 一次把画像分区全开出来：巡检某台机器时的批量动作
      ([
        "ports", "processes", "services", "disks", "mounts", "network", "env", "firewall",
        "sysconfig", "deleted",
      ] as TabKind[])
        .forEach(k => openTab(h, k));
      break;
    }
    case "close-host-tabs":
      openTabs.value = openTabs.value.filter(t => t.hostId !== h.id);
      if (!openTabs.value.some(t => t.name === activeTab.value)) {
        activeTab.value = openTabs.value[openTabs.value.length - 1]?.name ?? "";
      }
      break;
    case "copy-address":
      copyText(`${h.serverHostAddress}:${remotePortOf(h)}`, "地址已复制");
      break;
    case "copy-name":
      copyText(h.serverHostName, "主机名已复制");
      break;
    case "copy-link":
      copyText(`${location.origin}${location.pathname}#/host/${h.id}`, "链接已复制");
      break;
    case "clone":
      cloneHost(h);
      break;
    default:
      break;
  }
}

/**
 * 复制文本到剪贴板。
 *
 * <p>{@code navigator.clipboard} 只在安全上下文可用，控制台若走 http 内网地址
 * （非 localhost）会直接不可用。这里退回 textarea + execCommand，保证复制不会静默失败。</p>
 *
 * @param text 要复制的文本
 * @param okMsg 成功提示
 */
async function copyText(text: string, okMsg: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      message.success(okMsg);
      return;
    }
  } catch { /* 落到下面的兜底 */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) message.success(okMsg);
    else message.error("复制失败，请手动选中复制");
  } catch {
    message.error("复制失败，请手动选中复制");
  }
}

/**
 * 以现有主机为模板新建一台。
 *
 * <p>只复制「怎么连、怎么采」这类配置，不复制 id / 名称 / 地址 / 在线与采集结果 ——
 * 克隆出来若带着原机器的 IP，用户点保存就把两台机器写成了同一个地址。</p>
 *
 * @param h 模板主机
 */
function cloneHost(h: Host): void {
  formIsEdit.value = false;
  editHost.value = {
    ...h,
    id: 0,
    serverHostName: `${h.serverHostName}-copy`,
    serverHostAddress: "",
    serverHostPrivateIp: null,
    serverHostPublicIp: null,
    serverHostOnline: 0,
    serverHostStatus: 0,
    serverHostCpuUsage: null,
    serverHostMemUsage: null,
    serverHostDiskUsage: null,
    serverHostDelayMs: null,
    serverHostLastCollectTime: null,
    serverHostLastDelayTime: null,
    serverHostPorts: null,
    serverHostLastPortScanTime: null,
    serverHostOnlineTime: undefined,
  };
  formVisible.value = true;
}

/** 认证方式/采集方式选项已随弹窗拆入 HostFormDialog 子组件 */

// ---- 新增/编辑表单 ----
// ---- 新增/编辑弹窗（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts） ----
const formVisible = ref(false);
useDialogPrerender(formVisible);
const formIsEdit = ref(false);
/** 编辑时的行数据（传给弹窗子组件，打开后由子组件异步回填详情） */
const editHost = ref<Host | null>(null);

function collectModeLabel(m?: string | null): string {
  const map: Record<string, string> = {
    NONE: "不采集", OPENSSH: "OpenSSH采集", SCHEDULED: "定时采集", WINRM: "WinRM采集", AGENT: "Agent采集", LOCAL: "本机自采集", PROMETHEUS: "Prometheus采集", HTTP: "HTTP采集",
  };
  return map[m ?? ""] ?? m ?? "—";
}

// ---- 连接时选择身份（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts） ----
const connectVisible = ref(false);
useDialogPrerender(connectVisible);
const connectTarget = ref<Host | null>(null);
const connectIdentityId = ref<number | null>(null);
const hostBoundIdentities = ref<number[]>([]);

// ---- 系统设置（画像偏好 / 自动刷新 / 分页 三组开关统一收到弹窗），与 HostProfileView 共用 localStorage 键 ----
const PREF_PAGE_SIZE_KEY = "monitor:host-profile:page-size";
const PREF_AUTO_REFRESH_KEY = "monitor:host-profile:auto-refresh";
const PREF_REFRESH_SEC_KEY = "monitor:host-profile:refresh-seconds";
const systemSettingsVisible = ref(false);
useDialogPrerender(systemSettingsVisible);
const systemSettings = reactive({
  pageSize: Number(localStorage.getItem(PREF_PAGE_SIZE_KEY)) || 50,
  autoRefresh: localStorage.getItem(PREF_AUTO_REFRESH_KEY) === "true",
  refreshSeconds: Number(localStorage.getItem(PREF_REFRESH_SEC_KEY)) || 10,
});

/** 打开「系统设置」弹窗（右键入口，画像偏好 / 自动刷新 / 分页三组统一入到一个弹窗） */
function openSystemSettings(): void {
  closeCtxMenu();
  systemSettings.pageSize = Number(localStorage.getItem(PREF_PAGE_SIZE_KEY)) || 50;
  systemSettings.autoRefresh = localStorage.getItem(PREF_AUTO_REFRESH_KEY) === "true";
  systemSettings.refreshSeconds = Number(localStorage.getItem(PREF_REFRESH_SEC_KEY)) || 10;
  systemSettingsVisible.value = true;
}

/** 保存系统设置：写 localStorage，已打开的画像页签下次打开/刷新时生效 */
function saveSystemSettings(): void {
  localStorage.setItem(PREF_PAGE_SIZE_KEY, String(systemSettings.pageSize || 50));
  localStorage.setItem(PREF_AUTO_REFRESH_KEY, String(!!systemSettings.autoRefresh));
  localStorage.setItem(PREF_REFRESH_SEC_KEY, String(systemSettings.refreshSeconds || 10));
  systemSettingsVisible.value = false;
  message.success("系统设置已保存，重新打开画像页签生效");
}

/**
 * 打开「连接」弹窗：选登录身份。
 *
 * <p>选定身份后不再跳转到 /terminal 独立页，而是直接在本页工作区开一个远控页签 ——
 * 用户是在「主机资产」里点的主机，跳走等于把他从当前上下文里踢出去。</p>
 *
 * @param h 主机
 */
function openConnect(h: Host): void {
  connectTarget.value = h;
  connectIdentityId.value = null;
  connectVisible.value = true;
  listBoundIdentities(h.id).then((list: any) => {
    hostBoundIdentities.value = list ?? [];
  }).catch(() => { hostBoundIdentities.value = []; });
}

/** 以弹窗里选中的身份打开远控页签 */
function doConnect(): void {
  const h = connectTarget.value;
  if (!h) return;
  openTab(h, "remote", { identityId: connectIdentityId.value });
  connectVisible.value = false;
}

/** 身份管理（新增/删除）已统一迁至左侧「账号管理」页（/account）；
 *  本页仅保留身份选择（连接弹窗）与绑定/解绑 */
/** 在连接弹窗里绑定/解绑身份 */
async function toggleBind(hostId: number, identityId: number, bind: boolean): Promise<void> {
  try {
    if (bind) await bindIdentity(hostId, identityId);
    else await unbindIdentity(hostId, identityId);
    message.success(bind ? "已绑定该身份" : "已解绑");
    const list = await listBoundIdentities(hostId);
    hostBoundIdentities.value = list ?? [];
  } catch (e) { message.error(String((e as Error)?.message ?? e)); }
}

// ---- 更多菜单：在离线 / 指标 / 延迟检测（后台 HostOnlineScheduler 三项检测）----
const configVisible = ref(false);
useDialogPrerender(configVisible);
const configHost = ref<Host | null>(null);
const configMode = ref<"online" | "metric" | "delay">("metric");

// 协议服务器管理弹窗已移除

// ---- Agent 部署进度弹窗状态 ----
const deployDialogVisible = ref(false);
const deployProgress = ref(0);
const deployMessage = ref("");
const deployStatus = ref<"info" | "success" | "warn" | "error">("info");
const deployInfo = reactive({ hostId: 0, hostName: "", action: "" as "install" | "reinstall" | "upgrade" | "uninstall" });
const deployMinimized = ref(false);
const deployLogs = ref<string[]>([]);
const deployTask = ref<any>({
  id: "agent-deploy",
  title: "Agent 部署",
  progress: 0,
  status: "running",
  text: "准备中...",
  createdAt: Date.now(),
  startedAt: Date.now(),
  history: [],
});

/**
 * 重置左侧检索与筛选条件。
 *
 * <p>只在「筛得只剩空列表」时才有意义：此时给用户一个一键回到全量的出口，
 * 而不是让他自己去猜是关键字、状态还是分组把结果筛没了。</p>
 */
function resetFilters(): void {
  keyword.value = "";
  statusFilter.value = "all";
  collapsedGroups.value = new Set();
}

function openAdd(): void {
  // 防重复打开：弹窗已经处于打开态时（快速点击 Dock/工具栏/快捷菜单），不重复打开，
  // 避免弹窗壳（overlay）被重复创建和闪动两次
  if (formVisible.value) return;
  formIsEdit.value = false;
  editHost.value = null;
  formVisible.value = true;
}
function openEdit(h: Host): void {
  // 防重复打开（同上）
  if (formVisible.value) return;
  // 弹窗子组件内部负责：行数据立即填充 + 详情异步回填（打开不再阻塞、不再触发本组件大 diff）
  formIsEdit.value = true;
  editHost.value = h;
  formVisible.value = true;
}
// ---- 删除 / 启停 / 批量 ----
/** Agent 动作文案 */
const AGENT_ACTION_LABEL: Record<string, string> = {
  install: "安装", reinstall: "重装", upgrade: "升级", uninstall: "卸载",
};

// 打开 Agent 自动部署弹窗
async function openDeploy(
  h: Host | { id: number; serverHostName: string; action: string },
  action?: 'install' | 'reinstall' | 'upgrade' | 'uninstall',
) {
  // 支持两种调用方式：openDeploy(h, 'upgrade') 或 openDeploy({ id, serverHostName, action })
  let hostId: number, hostName: string, act: 'install' | 'reinstall' | 'upgrade' | 'uninstall';
  if (action) {
    hostId = (h as Host).id;
    hostName = (h as Host).serverHostName || '';
    act = action;
  } else {
    hostId = (h as any).id;
    hostName = (h as any).serverHostName || '';
    act = (((h as any).action || 'install') as typeof act);
  }
  if (act === 'uninstall') {
    try {
      await ElMessageBox.confirm(
        `卸载主机「${hostName}」上的 Agent？卸载后主机画像、实时指标与远程控制将全部停用，需要重新安装才能恢复。`,
        "卸载确认", { type: "warning", confirmButtonText: "卸载", cancelButtonText: "取消" },
      );
    } catch { return; }
  }
  deployInfo.hostId = hostId;
  deployInfo.hostName = hostName;
  deployInfo.action = act;
  deployProgress.value = 0;
  deployMessage.value = '准备中...';
  deployStatus.value = 'info';
  deployDialogVisible.value = true;
  const label = AGENT_ACTION_LABEL[act] ?? act;
  deployLogs.value = [`[${new Date().toLocaleTimeString()}] 开始${label} Agent...`];
  deployTask.value = {
    id: "agent-deploy",
    title: `${label} Agent - ${hostName}`,
    progress: 0.05,
    status: "running",
    text: "准备中...",
    createdAt: Date.now(),
    startedAt: Date.now(),
    history: [{ time: Date.now(), progress: 0.05, status: "running" }],
  };
  try {
    await submitAgentAction(hostId, act);
  } catch (e: any) {
    deployStatus.value = 'error';
    deployMessage.value = '请求失败: ' + (e?.message ?? e);
    deployTask.value = { ...deployTask.value, status: "failed", text: '请求失败' };
  }
}

async function removeHost(h: Host): Promise<void> {
  await ElMessageBox.confirm(`删除主机「${h.serverHostName}」？`, "删除确认", { type: "warning" });
  try {
    const ok = await delHost(h.id);
    if (ok === false) { message.warning("删除未生效（可能仍有绑定）"); return; }
    message.success("已删除");
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

/** 采集模式是否为 Agent（决定 Agent 生命周期入口显隐） */
function isAgentMode(h: Host): boolean {
  return h.serverHostCollectMode === "AGENT";
}

/** Agent 是否已安装 */
function isAgentInstalled(h: Host): boolean {
  return h.serverHostAgentInstalled === 1;
}

/**
 * 切换主机的远控启用状态。
 *
 * <p>右键菜单里的「启用/停用远控」：停用后该主机不再出现在远控入口，
 * 但台账与画像数据保留 —— 这是「暂时不给连」而不是「删掉这台机器」。</p>
 *
 * @param h 主机
 */
async function toggleHost(h: Host): Promise<void> {
  try {
    await switchHost(h.id, h.serverHostRemoteEnabled !== 1);
    message.success("已切换");
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

/* ==================== 底部状态条数据 ==================== */

/**
 * 状态条上的三条占用率。
 *
 * <p>优先用 socket 实时值（{@link rtMetrics}），没有就退回台账里最近一次采集的落库值。
 * 两者都没有时返回 0 并由 {@code hasMetrics} 标成「等待采集」——
 * 显示成 0% 会被读成「这台机器一点负载都没有」，与「没采到」是两件事。</p>
 */
const statusMetrics = computed(() => {
  const h = statusHost.value;
  if (!h) {
    return { cpu: 0, mem: 0, disk: 0, has: false, diskRead: 0, diskWrite: 0, netRx: 0, netTx: 0, hasIo: false, memTotalMb: 0, diskTotalGb: 0 };
  }
  const totals = {
    memTotalMb: Number(h.serverHostMemoryMb) || 0,
    diskTotalGb: Number(h.serverHostDiskGb) || 0,
  };
  const live = rtMetrics[h.id];
  if (live) {
    return {
      cpu: live.cpu ?? 0, mem: live.mem ?? 0, disk: live.disk ?? 0, has: true,
      diskRead: live.diskRead ?? 0, diskWrite: live.diskWrite ?? 0,
      netRx: live.netRx ?? 0, netTx: live.netTx ?? 0, hasIo: !!live.hasIo,
      ...totals,
    };
  }
  const cpu = h.serverHostCpuUsage;
  const mem = h.serverHostMemUsage;
  const disk = h.serverHostDiskUsage;
  const has = cpu != null || mem != null || disk != null;
  return {
    cpu: Number(cpu) || 0,
    mem: Number(mem) || 0,
    disk: Number(disk) || 0,
    has,
    diskRead: Number(h.serverHostDiskReadKbs) || 0,
    diskWrite: Number(h.serverHostDiskWriteKbs) || 0,
    netRx: Number(h.serverHostNetRxKbs) || 0,
    netTx: Number(h.serverHostNetTxKbs) || 0,
    hasIo: h.serverHostDiskReadKbs != null || h.serverHostDiskWriteKbs != null,
    ...totals,
  };
});

/* ---------- 底部状态条：句柄数与 inode 使用率 ---------- */

/**
 * 资源摘要（句柄数 / inode）。
 *
 * <p>这两项来自服务端推送而不是 socket 实时值：句柄要按平台走命令汇总，
 * inode 要读根分区，频率远低于 CPU。页面不再定时 GET，改为在主机资产页的
 * 唯一 SSE 长连接上订阅 {@code host-summary} 事件（服务端 30 秒推一次，
 * 切主机时立即推一次），连接由 {@code hostAssetsSse} 统一管理。</p>
 */
const statusSummary = ref({
  handleCount: -1,
  inodeUsed: -1,
  inodeTotal: -1,
  inodePercent: -1,
  inodeMount: "",
});

/**
 * 收到一条资源摘要推送：只认当前主机，避免切主机的瞬间显示上一台的数据。
 *
 * @param summary 推送负载
 */
function applyStatusSummary(summary: HostSummaryPush): void {
  if (statusHost.value?.id == null || summary.hostId !== statusHost.value.id) {
    return;
  }
  statusSummary.value = {
    handleCount: Number(summary.handleCount ?? -1),
    inodeUsed: Number(summary.inodeUsed ?? -1),
    inodeTotal: Number(summary.inodeTotal ?? -1),
    inodePercent: Number(summary.inodePercent ?? -1),
    inodeMount: String(summary.inodeMount ?? ""),
  };
}

/** 摘要推送订阅（组件卸载时释放） */
const offStatusSummary = hostAssetsSse.onHostSummary(applyStatusSummary);

/**
 * 主机切换：清空上一台的摘要并改订阅目标。
 * 未连上时只记录关注对象，连上后由通道自动补订阅。
 */
watch(
  () => statusHost.value?.id ?? null,
  (id) => {
    statusSummary.value = { handleCount: -1, inodeUsed: -1, inodeTotal: -1, inodePercent: -1, inodeMount: "" };
    hostAssetsSse.setSummaryHost(id);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  offStatusSummary();
  hostAssetsSse.setSummaryHost(null);
});

/** 内存用量文本：已用 / 总量（拿不到总量时给「—」） */
const memUsageText = computed(() => {
  const m = statusMetrics.value;
  if (!m.memTotalMb) return "";
  const used = (m.memTotalMb * Math.max(0, Math.min(100, m.mem))) / 100;
  const fmt = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
  return `${fmt(used)} / ${fmt(m.memTotalMb)}`;
});

/** 磁盘用量文本：已用 / 总量 */
const diskUsageText = computed(() => {
  const m = statusMetrics.value;
  if (!m.diskTotalGb) return "";
  const used = (m.diskTotalGb * Math.max(0, Math.min(100, m.disk))) / 100;
  return `${used.toFixed(1)} GB / ${m.diskTotalGb.toFixed(1)} GB`;
});

/** 概要浮层里的行（原先画像页左侧那套「概要信息」） */
const statusOverviewRows = computed<MetricRow[]>(() => {
  const h = statusHost.value;
  if (!h) return [];
  const dash = (v: unknown) => {
    const s = v == null ? "" : String(v).trim();
    return s ? s : "—";
  };
  const rows: MetricRow[] = [
    { label: "操作系统", value: dash([h.serverHostOsType, h.serverHostOsVersion].filter(Boolean).join(" ")) },
    { label: "架构", value: dash(h.serverHostOsArch) },
    { label: "CPU 核心", value: h.serverHostCpuCores ? `${h.serverHostCpuCores} 核` : "—" },
    {
      label: "内存",
      value: h.serverHostMemoryMb ? `${(h.serverHostMemoryMb / 1024).toFixed(1)} GB` : "—",
      // 数值下方补一条占用率（外壳 + 内条），用量按当前实时百分比折算
      percent: statusMetrics.value.has ? statusMetrics.value.mem : undefined,
      percentText: memUsageText.value,
    },
    {
      label: "磁盘",
      value: h.serverHostDiskGb ? `${h.serverHostDiskGb} GB` : "—",
      percent: statusMetrics.value.has ? statusMetrics.value.disk : undefined,
      percentText: diskUsageText.value,
    },
    { label: "地址", value: dash(`${h.serverHostAddress}:${h.serverHostPort}`), mono: true },
    { label: "内网 IP", value: privateIpTextOf(h.serverHostPrivateIp) || "—", mono: true },
    { label: "公网 IP", value: dash(h.serverHostPublicIp), mono: true },
    { label: "协议", value: protocolOf(h).toUpperCase() },
    { label: "采集方式", value: collectModeLabel(h.serverHostCollectMode) },
    { label: "分组", value: groupName(h.msServerGroupId) },
    { label: "标签", value: dash(splitTags(h.serverHostTags).join(" / ")) },
    { label: "最近采集", value: dash(h.serverHostLastCollectTime) },
    { label: "已扫描端口", value: parsePorts(h.serverHostPorts).length ? `${parsePorts(h.serverHostPorts).length} 个` : "未扫描", tip: portTip(h) },
    { label: "Agent", value: h.serverHostAgentInstalled === 1 ? `v${h.serverHostAgentVersion || "?"}` : "未安装" },
  ];
  // 句柄 / iNode 不是每台主机都取得到（Windows 无 inode、采集通道也可能没回），
  // 取不到时整行不出现：一排「—」只会让人以为采集坏了。
  if (statusSummary.value.handleCount >= 0) {
    rows.push({ label: "句柄数", value: statusSummary.value.handleCount.toLocaleString() });
  }
  if (statusSummary.value.inodePercent >= 0) {
    rows.push({
      label: "iNode 使用率",
      value: `${statusSummary.value.inodePercent.toFixed(1)}%`
        + (statusSummary.value.inodeTotal > 0
          ? `（${statusSummary.value.inodeUsed.toLocaleString()}/${statusSummary.value.inodeTotal.toLocaleString()} · ${statusSummary.value.inodeMount || "/"}）`
          : ""),
    });
  }
  if (h.serverHostDescription) {
    rows.push({ label: "备注", value: h.serverHostDescription });
  }
  return rows;
});

/* ==================== 底部条：指标历史（复用指标监控那套历史） ==================== */

const metricHistVisible = ref(false);
const metricHistKind = ref<HostMetricKind>("cpu");

/**
 * 打开底部条对应指标的历史曲线。
 *
 * @param kind 指标
 */
function openMetricHistory(kind: HostMetricKind): void {
  if (!statusHost.value) return;
  metricHistKind.value = kind;
  metricHistVisible.value = true;
}

/* ==================== 主机导入 / 导出（客户端会话 + 资产归档） ==================== */

const hostIeVisible = ref(false);

/* ==================== 左侧栏与页签查询辅助 ==================== */

/**
 * 左侧状态筛选档位（带计数）。
 *
 * <p>计数跟着实时在线状态走而不是台账状态：{@code serverHostStatus} 是上一次落库的值，
 * 主机刚掉线时它还写着「在线」，筛选出来却是一排灰点，看着像筛选坏了。</p>
 */
const statusFilters = computed(() => [
  { value: "all" as const, label: "全部", count: hosts.value.length },
  { value: "online" as const, label: "在线", count: onlineCount.value },
  { value: "offline" as const, label: "离线", count: offlineCount.value },
  { value: "remote" as const, label: "可远控", count: remoteCount.value },
]);

/**
 * 点击左侧主机行：只做选中，不动工作区。
 *
 * <p>刻意不自动开页签：浏览列表时会一路点过去，每点一台就开一个「指标监控」
 * 等于给工作区灌一堆没人看的页签，还要一个个关。开什么由右键菜单决定。</p>
 *
 * <p>多选模式下点击改为勾选 —— 此时用户的意图是「挑几台一起操作」，
 * 再顺手把底部状态条切走反而干扰。</p>
 *
 * @param h 主机
 */
function selectHost(h: Host): void {
  selectedHost.value = h;
}

/**
 * 行点击入口：多选时勾选，平时选中
 *
 * @param h 主机
 */
function onHostRowClick(h: Host): void {
  if (multiSelect.value) {
    toggleCheck(h);
    return;
  }
  selectHost(h);
  // 控制管理页：点一下主机就直接在右侧开远控，不需要再走右键菜单
  if (isControl.value) {
    openTab(h, "remote");
  }
}

/**
 * 迷你指标条的悬浮说明
 *
 * @param h 主机
 */
function usageTitle(h: Host): string {
  return `CPU ${usageOf(h, "cpu").toFixed(1)}% · 内存 ${usageOf(h, "mem").toFixed(1)}% · 磁盘 ${usageOf(h, "disk").toFixed(1)}%`;
}

/**
 * 按 name 取工作区页签。
 *
 * <p>模板里拿到的是 ReTabs 回传的 {@link ReTabsItem}，它不带主机上下文，
 * 所以内容区分支一律通过 name 回查本数组，而不是往 ReTabsItem 上强转。</p>
 *
 * @param name 页签 name
 */
function tabOf(name: string): WorkTab | undefined {
  return openTabs.value.find(t => t.name === name);
}

/**
 * 页签的功能类型
 *
 * @param name 页签 name
 */
function tabKindOf(name: string): TabKind | undefined {
  return tabOf(name)?.kind;
}

/**
 * 页签绑定的主机 id（找不到时为 0，子组件据此走空态而不是崩）
 *
 * @param name 页签 name
 */
function tabHostIdOf(name: string): number {
  return tabOf(name)?.hostId ?? 0;
}

/**
 * 页签绑定的主机名（工作台等承载多主机上下文的页签用作默认显示名）
 *
 * @param hostId 主机 id
 */
function hostNameOf(hostId: number): string {
  if (!hostId) return "";
  return hosts.value.find(h => h.id === hostId)?.serverHostName ?? "";
}

/**
 * 页签对应的画像分区 key（非画像页签返回空串）
 *
 * @param name 页签 name
 */
function tabSectionOf(name: string): string {
  const kind = tabKindOf(name);
  if (!kind) return "";
  return TAB_KINDS[kind]?.section ?? "";
}

/**
 * 懒加载页签对应的异步组件（运维台四页 + 主机账号 + 软件管理）。
 *
 * <p>这些页面是整站级视图但收在工作区页签里；组件定义在文件头用
 * {@code defineAsyncComponent} 懒加载，这里把页签 kind 映射到组件。
 * 映射不到的页签由前面的 {@code v-if/v-else-if} 分支渲染（画像/远控/文件等），
 * 这里只兜「本文件没有专属模板」的懒加载页。</p>
 *
 * @param name 页签 name
 */
function lazyTabOf(name: string): Component | null {
  const kind = tabKindOf(name);
  if (!kind) return null;
  switch (kind) {
    case "ops-sessions":
      return OpsSessionTab;
    case "ops-exec":
      return OpsExecTab;
    case "ops-snippets":
      return OpsSnippetTab;
    case "ops-maintenance":
      return OpsMaintenanceTab;
    case "host-accounts":
      return HostAccountTab;
    case "alarm-policy":
      return HostAlarmPolicyTab;
    case "schedule":
      return ScheduleTab;
    case "software":
      return SoftwareTab;
    case "software-instance":
      return ScHostSoftwareInstances;
    case "sys-log":
    case "user-log":
      // 日志页有专属分支（要额外传 kind=sys|login），不走通用懒加载映射
      return null;
    default:
      return null;
  }
}

/**
 * 主机平台标识（文件管理用它决定路径分隔符与命令集）
 *
 * @param hostId 主机 id
 */
function platformOf(hostId: number): string {
  const h = hosts.value.find(x => x.id === hostId);
  return (h?.serverHostOsType || "LINUX").toUpperCase();
}

/**
 * 主机列表或实时在线状态变化时，把页签标题与状态点、以及左侧选中项同步到最新数据。
 *
 * <p>{@code hosts} 每次刷新都是新对象数组，若不同步，页签上会一直挂着改名前的
 * 主机名和刷新前的在线点；{@code selectedHost} 也会指向上一次的对象，
 * 底部状态条读到的就是旧指标。</p>
 */
watch([hosts, liveOnline], () => {
  const patch = (h: Host): Partial<ReTabsItem> => ({
    label: h.serverHostName,
    status: liveOnlineState(h) === 1 ? "online" : "offline",
  });
  let changed = false;
  const next = openTabs.value.map(t => {
    const h = hosts.value.find(x => x.id === t.hostId);
    if (!h) return t;
    const p = patch(h);
    if (p.label === t.label && p.status === t.status) return t;
    changed = true;
    return { ...t, ...p };
  });
  if (changed) openTabs.value = next;

  if (selectedHost.value) {
    const fresh = hosts.value.find(x => x.id === selectedHost.value?.id);
    if (fresh && fresh !== selectedHost.value) selectedHost.value = fresh;
  }
});

onMounted(() => {
  /* 主机资产页面唯一 SSE 长连接：底部资源摘要与邮箱推送都走它 */
  hostAssetsSse.open();
  fetchAll().then(() => applyDeepLink());
  document.addEventListener("keydown", onGlobalKeydown, true);
  // 实时延迟 + 在线状态：socket 推送（后台 HostOnlineScheduler 检测后广播）
  const socket = useSocketService();
  unsubDelay = socket?.subscribe("monitor", "host-delay", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; delayMs?: number | null };
      if (d && d.hostId != null) liveDelay.value[d.hostId] = d.delayMs ?? -1;
    } catch { /* 静默 */ }
  });
  unsubOnline = socket?.subscribe("monitor", "host-online", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; online?: number };
      if (d && d.hostId != null) liveOnline.value[d.hostId] = d.online ? 1 : 0;
    } catch { /* 静默 */ }
  });
  // 实时 CPU/内存/磁盘：socket host-metrics 推送
  // Agent 自动部署进度推送
  unsubDeploy = socket?.subscribe("monitor", "agent-deploy", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; progress?: number; message?: string; status?: string };
      if (d && d.hostId === deployInfo.hostId) {
        const pct = (d.progress ?? 0) / 100;
        deployProgress.value = d.progress ?? 0;
        deployMessage.value = d.message ?? '';
        const s = d.status;
        deployStatus.value = s === 'success' || s === 'warn' || s === 'error' ? s : 'info';
        deployLogs.value.push(`[${new Date().toLocaleTimeString()}] ${d.message} (${d.progress}%)`);
        deployTask.value = {
          ...deployTask.value,
          progress: pct,
          status: d.status === 'success' ? 'success' : d.status === 'error' ? 'failed' : 'running',
          text: d.message ?? '',
          history: [...deployTask.value.history, { time: Date.now(), progress: pct, status: d.status === 'success' ? 'success' : d.status === 'error' ? 'failed' : 'running' }],
        };
        // 终态意味着台账里的 installed/版本/端口都已变更，列表必须跟着刷新
        if (d.status === 'success' || d.status === 'error') {
          fetchAll();
        }
      }
    } catch { /* 静默 */ }
  });
  unsubMetrics = socket?.subscribe("monitor", "host-metrics", (msg) => {
    try {
      const d = (msg.data ?? msg) as {
        hostId?: number; cpu?: number; mem?: number; disk?: number;
        diskRead?: number; diskWrite?: number; netRx?: number; netTx?: number;
      };
      if (!realtimeEnabled.value) return;
      if (d && d.hostId != null) {
        const prev = rtMetrics[d.hostId];
        // 老后端只推 cpu/mem/disk，此时不把已有 IO 值清零
        const hasIo = d.diskRead != null || d.diskWrite != null || d.netRx != null || d.netTx != null;
        rtMetrics[d.hostId] = {
          cpu: Math.round((Number(d.cpu) || 0) * 10) / 10,
          mem: Math.round((Number(d.mem) || 0) * 10) / 10,
          disk: Math.round((Number(d.disk) || 0) * 10) / 10,
          diskRead: hasIo ? Number(d.diskRead) || 0 : prev?.diskRead ?? 0,
          diskWrite: hasIo ? Number(d.diskWrite) || 0 : prev?.diskWrite ?? 0,
          netRx: hasIo ? Number(d.netRx) || 0 : prev?.netRx ?? 0,
          netTx: hasIo ? Number(d.netTx) || 0 : prev?.netTx ?? 0,
          hasIo: hasIo || !!prev?.hasIo,
        };
      }
    } catch { /* 静默 */ }
  });
  // 端口扫描完成：后台异步扫描落库后推送，实时回填端口字段与扫描时间
  unsubPortScan = socket?.subscribe("monitor", "host-portscan", (msg) => {
    try {
      const d = (msg.data ?? msg) as {
        hostId?: number; success?: boolean; openCount?: number;
        elapsedSeconds?: number; portsJson?: string | null; scanTime?: string; error?: string;
      };
      if (!d || d.hostId == null) return;
      const target = hosts.value.find(h => h.id === d.hostId);
      if (target) {
        target.serverHostPorts = d.portsJson ?? "[]";
        target.serverHostLastPortScanTime = d.scanTime ?? null;
      }
      if (d.success) {
        message.success(`端口扫描完成：发现 ${d.openCount ?? 0} 个开放端口（耗时 ${d.elapsedSeconds ?? 0}s）`);
      } else {
        message.error(`端口扫描失败：${d.error ?? "未知错误"}`);
      }
    } catch { /* 静默 */ }
  });
});
onBeforeUnmount(() => {
  hostAssetsSse.close();
  document.removeEventListener("keydown", onGlobalKeydown, true);
  unsubDelay?.();
  unsubOnline?.();
  unsubMetrics?.();
  unsubDeploy?.();
  unsubPortScan?.();
});

/** 实时在线状态（socket 优先，回退 host.serverHostOnline；本机恒在线） */
function liveOnlineState(h: Host): number {
  if (h.serverHostCollectMode === "LOCAL") {
    return 1;
  }
  return liveOnline.value[h.id] ?? h.serverHostOnline;
}
/** 实时延迟（socket 优先，回退 host.serverHostDelayMs；本机恒 0ms） */
function liveDelayMs(h: Host): number | null {
  if (h.serverHostCollectMode === "LOCAL") {
    return 0;
  }
  const v = liveDelay.value[h.id];
  if (v != null) return v;
  return h.serverHostDelayMs ?? null;
}
/** 延迟显示文案 */
function delayText(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 0) return "不可达";
  return ms + " ms";
}
/** 延迟是否异常（高延迟红色） */
function delayBad(ms: number | null): boolean {
  return ms != null && (ms < 0 || ms > 200);
}

/**
 * OS 图标底纹类（按系统类型给卡片图标一个品牌语义淡底）
 * @param h 主机
 */
function osTileClass(h: Host): string {
  const os = (h.serverHostOsType ?? "").toLowerCase();
  if (os.includes("win")) return "is-windows";
  if (os.includes("mac") || os.includes("darwin")) return "is-macos";
  if (os.includes("linux") || os.includes("ubuntu") || os.includes("centos")
      || os.includes("red hat") || os.includes("unix")) return "is-linux";
  return "is-other";
}

/* ==================== 命令面板（Ctrl+K） ==================== */

/** 面板是否打开 */
const paletteOpen = ref(false);

/**
 * 面板条目：主机 + 已开页签 + 全局动作，按分组排列。
 *
 * <p>分组标题以 {@code key === ""} 的空条目表示，这样键盘移动时会被
 * {@code HostCommandPalette} 自动跳过，不需要父级再维护一份「可选项」数组。</p>
 */
const paletteItems = computed<PaletteItem[]>(() => {
  const list: PaletteItem[] = [];

  // 主机：直接开指标监控（和双击行的行为一致，避免同一个动作两种结果）
  if (filtered.value.length) {
    list.push({ key: "", label: "", group: `主机 · ${filtered.value.length}` });
    for (const h of filtered.value) {
      list.push({
        key: `host:${h.id}`,
        label: h.serverHostName,
        hint: h.serverHostAddress,
        icon: isControl.value ? "Position" : "Monitor",
        group: "主机",
      });
    }
  }

  // 已开页签：跳过去，不重复开
  if (openTabs.value.length) {
    list.push({ key: "", label: "", group: `已打开 · ${openTabs.value.length}` });
    for (const t of openTabs.value) {
      const h = hosts.value.find(x => x.id === t.hostId);
      const kindLabel = TAB_KINDS[t.kind]?.label ?? t.kind;
      list.push({
        key: `tab:${t.name}`,
        label: `${h?.serverHostName ?? t.label} · ${kindLabel}`,
        hint: "切换",
        icon: TAB_KINDS[t.kind]?.icon,
        group: "已打开",
      });
    }
  }

  // 全局动作
  list.push({ key: "", label: "", group: "功能" });
  const actions: Array<{ key: string; label: string; hint: string; icon: string }> = [
    { key: "cmd:add", label: "新增主机", hint: "动作", icon: "Plus" },
    { key: "cmd:refresh", label: "刷新主机列表", hint: "动作", icon: "RefreshRight" },
    { key: "cmd:realtime", label: realtimeEnabled.value ? "暂停实时指标推送" : "恢复实时指标推送", hint: "开关", icon: "Odometer" },
    { key: "cmd:multi", label: multiSelect.value ? "退出多选模式" : "进入多选模式", hint: "开关", icon: "Select" },
    { key: "cmd:sort", label: `切换排序（当前：${SORT_LABELS[sortMode.value]}）`, hint: "动作", icon: "Sort" },
    { key: "cmd:collapse", label: "折叠全部分组", hint: "动作", icon: "ArrowRight" },
    { key: "cmd:expand", label: "展开全部分组", hint: "动作", icon: "ArrowDown" },
  ];
  // 控制管理页左栏没有新增与多选，命令面板也不该给出这两个入口
  const hidden = isControl.value ? ["cmd:add", "cmd:multi"] : [];
  for (const a of actions) {
    if (hidden.includes(a.key)) continue;
    list.push({ ...a, group: "功能" });
  }

  return list;
});

/**
 * 执行面板选中的条目。
 *
 * <p>三种作用域前缀各走各的分支：{@code host:} 开页签、{@code tab:} 切页签、
 * {@code cmd:} 调动作。无法识别的 key 静默忽略，不弹错误提示 ——
 * 面板是加速器，不该因为一条脏数据打断用户。</p>
 *
 * @param item 选中的条目
 */
function onPaletteSelect(item: PaletteItem): void {
  const [scope, ...rest] = item.key.split(":");
  const value = rest.join(":");
  if (scope === "host") {
    const h = hosts.value.find(x => x.id === Number(value));
    // 控制管理页里「选中主机」的语义就是开远控，与单击左侧主机一致
    if (h) openTab(h, isControl.value ? "remote" : "metrics");
    return;
  }
  if (scope === "tab") {
    activeTab.value = value;
    return;
  }
  switch (value) {
    case "add":
      openAdd();
      break;
    case "refresh":
      fetchAll();
      break;
    case "realtime":
      onRealtimeToggle(!realtimeEnabled.value);
      break;
    case "multi":
      toggleMultiSelect();
      break;
    case "sort": {
      const modes = Object.keys(SORT_LABELS) as SortMode[];
      const i = modes.indexOf(sortMode.value);
      sortMode.value = modes[(i + 1) % modes.length] ?? "online";
      break;
    }
    case "collapse":
      collapsedGroups.value = new Set(groupedHosts.value.map(g => g.id));
      break;
    case "expand":
      collapsedGroups.value = new Set();
      break;
    default:
      break;
  }
}

/** 连按两次 Shift 的判定窗口（毫秒） */
const DOUBLE_SHIFT_MS = 320;
/** 上一次按下 Shift 的时间戳 */
let lastShiftAt = 0;

/* ==================== 右侧 Dock（快捷操作 + 最近活动） ==================== */

/** 最近活动的一条记录 */
interface ActivityItem {
  /** 自增 id，只用于 v-for key */
  id: number;
  /** 展示文案 */
  text: string;
  /** 图标名 */
  icon: string;
  /** 关联主机（点击可重新选中） */
  hostId?: number;
  /** 发生时间戳 */
  at: number;
}

/** Dock 是否展开（宽屏默认展开，用户手动收起后记住） */
const dockOpen = ref(localStorage.getItem("assets-dock-open") !== "0");

/** 最近活动（最新的在前，最多 12 条） */
const activities = ref<ActivityItem[]>([]);
let activitySeq = 0;

/**
 * 记一条最近活动。
 *
 * <p>只留 12 条：这是「刚才干了什么」的短期提示，不是审计日志；
 * 无限追加会让 Dock 变成一个需要自己滚动的历史列表。</p>
 *
 * @param text 展示文案
 * @param icon 图标名
 * @param hostId 关联主机
 */
function pushActivity(text: string, icon = "Clock", hostId?: number): void {
  activities.value = [
    { id: ++activitySeq, text, icon, hostId, at: Date.now() },
    ...activities.value,
  ].slice(0, 12);
}

/**
 * 展开/收起右侧快捷操作面板，并记住选择。
 *
 * <p>收起即销毁：面板显示区是 {@code v-if}，点一下底部箭头，Dock 内全部 DOM
 * （按钮 / 列表 / 折叠钮）一起消失，右侧不残留任何 Dock 控件。</p>
 */
function toggleDock(): void {
  dockOpen.value = !dockOpen.value;
  localStorage.setItem("assets-dock-open", dockOpen.value ? "1" : "0");
}

/**
 * 左侧主机栏是否折叠。
 *
 * <p>折叠后只剩一条 44px 竖条（主机数 + 在线/离线点 + 展开按钮），
 * 中间工作区一次性多出 224px —— 指标 / 进程 / 端口这些页签本来就吃宽度。</p>
 */
const railCollapsed = ref(localStorage.getItem("assets-rail-collapsed") === "1");

/** 左栏宽度偏好（拖拽手柄改的就是它，折叠时仍保留，展开后恢复） */
const RAIL_WIDTH_KEY = "assets.rail.width.v1";
const railWidth = ref(readRailWidth(RAIL_WIDTH_KEY, 268));

/** 展开/收起左侧主机栏，并记住选择 */
function toggleRail(): void {
  railCollapsed.value = !railCollapsed.value;
  localStorage.setItem("assets-rail-collapsed", railCollapsed.value ? "1" : "0");
}

/**
 * 在独立窗口里打开主机资产。
 *
 * <p>走 {@code meta.standalone} 路由：新窗口只渲染主机资产本身，
 * 不带侧边栏与顶栏，方便单独摆到第二块屏幕上盯着机器。</p>
 */
function openStandalone(): void {
  const url = `${location.origin}${location.pathname}#/assets-standalone`;
  const win = window.open(url, "_blank", "width=1480,height=920");
  if (!win) message.warning("浏览器拦截了弹出窗口，请允许后重试");
}

/**
 * 打开某台主机的虚拟桌面：<b>「主机资产」右侧工作区里的一个页签</b>。
 *
 * <p>桌面是按主机开的：页签名用 {@code hostId:desktop} 去重，一台主机一个桌面页签，
 * 与远控 / 文件管理 / 指标监控平级 —— 关掉页签就回到主机资产的其它页签，
 * 不会开浏览器新标签页，也不会把整页从主机资产带走。</p>
 *
 * <p>只有桌面里某个窗口的「在新标签页打开」才走浏览器新标签页
 * （{@code /desktop-window/:hostId?only=<app>}，只渲染那一个窗口）。</p>
 *
 * <p>没有主机时不打开，避免落到一个没有归属的空壳上。</p>
 *
 * @param hostId 主机标识；缺省用左栏当前选中的主机
 */
function openDesktop(hostId?: number | null): void {
  const id = hostId ?? statusHost.value?.id ?? 0;
  if (!id) {
    message.warning("请先选择一台主机");
    return;
  }
  const host = hosts.value.find(h => h.id === id)
    ?? (statusHost.value?.id === id ? statusHost.value : null);
  if (!host) {
    message.warning("未找到该主机，无法打开虚拟桌面");
    return;
  }
  openTab(host, "desktop");
}

/**
 * 左栏顶部「更多」菜单的动作分发。
 *
 * <p>268px 的栏宽减去左右内边距只剩 244px，标题与计数固定占掉约 90px，
 * 一行最多容得下 5 个 24px 图标按钮。导入 / 导出与独立窗口都是低频动作，
 * 收进菜单后刷新、新增这几个高频按钮才不会被挤出边界。</p>
 *
 * @param command 菜单命令
 */
function onRailMore(command: string): void {
  if (command === "import-export") {
    hostIeVisible.value = true;
    return;
  }
  if (command === "standalone") {
    openStandalone();
    return;
  }
  if (command === "desktop") {
    openDesktop();
  }
}

/** 清空最近活动 */
function clearActivities(): void {
  activities.value = [];
}

/**
 * 相对时间文案（刚刚 / 3 分钟前 / 2 小时前）
 *
 * @param at 时间戳
 */
function timeAgo(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return "刚刚";
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  return `${Math.floor(s / 86400)} 天前`;
}

/**
 * 点击最近活动：回到那台主机的上下文
 *
 * @param it 活动记录
 */
function gotoActivity(it: ActivityItem): void {
  if (it.hostId == null) return;
  const h = hosts.value.find(x => x.id === it.hostId);
  if (h) selectHost(h);
}

/** 当前打开页签数（Dock 顶部统计用） */
const tabCount = computed(() => openTabs.value.length);

/**
 * 全局快捷键：Ctrl/⌘+K 打开面板，连按两次 Shift 也打开。
 *
 * <p>Ctrl+K 与主题头部搜索（ReSearchMenu）是同一个组合，两边都会响应，
 * 结果是两个浮层同时打开、焦点被先注册的那个抢走。这里在<b>捕获阶段</b>注册，
 * 命中后立即 {@code stopImmediatePropagation}，让本页的 Ctrl+K 只属于主机命令面板
 * —— 主机资产页里搜主机比搜菜单更常用；主题搜索仍可用顶栏按钮打开。</p>
 *
 * <p>只在焦点不在输入控件时响应双击 Shift：否则在搜索框里连按两个大写字母
 * 就会意外弹面板。</p>
 *
 * @param e 键盘事件
 */
function onGlobalKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    e.stopImmediatePropagation();
    paletteOpen.value = !paletteOpen.value;
    return;
  }
  if (e.key !== "Shift" || e.ctrlKey || e.altKey || e.metaKey) return;
  const t = e.target as HTMLElement | null;
  const tag = t?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;
  const now = Date.now();
  if (now - lastShiftAt < DOUBLE_SHIFT_MS) {
    paletteOpen.value = true;
    lastShiftAt = 0;
    return;
  }
  lastShiftAt = now;
}
</script>

<template>
  <div class="as">
    <ReErrorBar v-if="loadError" :message="loadError" retryText="重试" @retry="fetchAll" />

    <div class="as-body">
      <!-- ==================== 左侧：主机资源栏 ==================== -->
      <aside class="as-rail" :class="{ 'is-collapsed': railCollapsed }" :style="{ '--as-rail-width': railWidth + 'px' }">
        <!-- 折叠态：只留一条竖条，展开按钮压在底部 -->
        <div v-if="railCollapsed" class="rail-strip">
          <button type="button" class="rail-strip__count" title="展开主机列表" @click="toggleRail">
            <b>{{ filtered.length }}</b>
            <span>/{{ hosts.length }}</span>
          </button>
          <span class="rail-strip__dots">
            <i class="is-on" :title="`在线 ${onlineCount}`" />
            <i class="is-off" :title="`离线 ${offlineCount}`" />
          </span>
          <span class="rail-strip__gap" />
          <button type="button" class="rail-strip__toggle" title="展开主机列表" @click="toggleRail">
            <ReIcon name="ArrowRight" :size="13" />
          </button>
        </div>

        <div v-show="!railCollapsed" class="rail-head">
          <div class="rail-head__row">
            <span class="rail-head__title">{{ isControl ? '控制管理' : '主机资产' }}</span>
            <span class="rail-head__count">{{ filtered.length }}<i>/{{ hosts.length }}</i></span>
            <span class="rail-head__gap" />
            <button
              v-if="!isControl"
              type="button"
              class="rail-tool"
              :class="{ 'is-on': multiSelect }"
              :title="multiSelect ? '退出多选' : '多选批量操作'"
              @click="toggleMultiSelect"
            >
              <ReIcon name="Select" :size="12" />
            </button>
            <button
              type="button"
              class="rail-tool"
              :title="`排序：${SORT_LABELS[sortMode]}`"
              @click="cycleSort"
            >
              <ReIcon name="Sort" :size="12" />
            </button>
            <button type="button" class="rail-tool" title="刷新列表" :disabled="loading" @click="fetchAll">
              <ReIcon name="RefreshRight" :size="12" />
            </button>
            <!-- 低频动作收进「更多」：顶部一行放不下第 6 个图标按钮 -->
            <el-dropdown v-if="!isControl" class="rail-tool-dd" trigger="click" placement="bottom-end" @command="onRailMore">
              <button type="button" class="rail-tool" title="更多：导入 / 导出主机、独立窗口、虚拟桌面">
                <ReIcon name="MoreFilled" :size="12" />
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="import-export">
                    <ReIcon name="Upload" :size="14" :style="{ marginRight: '6px' }" />导入 / 导出主机
                  </el-dropdown-item>
                  <el-dropdown-item command="standalone">
                    <ReIcon name="TopRight" :size="14" :style="{ marginRight: '6px' }" />独立窗口打开
                  </el-dropdown-item>
                  <el-dropdown-item command="desktop" divided>
                    <ReIcon name="FullScreen" :size="14" :style="{ marginRight: '6px' }" />虚拟桌面
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <button v-if="!isControl" type="button" class="rail-tool is-primary" title="新增主机" @click="openAdd">
              <ReIcon name="Plus" :size="12" />
            </button>
          </div>
          <ReInput v-model="keyword" placeholder="搜索名称 / IP / 标签" clearable class="rail-head__search" />
          <div class="rail-filters">
            <button
              v-for="f in statusFilters"
              :key="f.value"
              type="button"
              class="rail-chip"
              :class="{ 'is-active': statusFilter === f.value }"
              @click="statusFilter = f.value"
            >
              <span>{{ f.label }}</span>
              <b>{{ f.count }}</b>
            </button>
          </div>
          <!-- 多选工具条：只有开了多选才占位，平时不挤压列表高度 -->
          <div v-if="multiSelect" class="rail-batch">
            <label class="rail-batch__all">
              <input
                type="checkbox"
                :checked="filtered.length > 0 && filtered.every(h => checkedHostIds.has(h.id))"
                @change="toggleCheckAll"
              />
              <span>全选 {{ checkedHostIds.size }}/{{ filtered.length }}</span>
            </label>
            <div class="rail-batch__ops">
              <button type="button" :disabled="!checkedHostIds.size" @click="batchToggleRemote(true)">启用远控</button>
              <button type="button" :disabled="!checkedHostIds.size" @click="batchToggleRemote(false)">停用远控</button>
              <button type="button" class="is-danger" :disabled="!checkedHostIds.size" @click="batchDelete">删除</button>
            </div>
          </div>
        </div>

        <ReScrollbar v-show="!railCollapsed" class="rail-list">
          <div v-for="g in groupedHosts" :key="g.id" class="rail-group">
            <button type="button" class="rail-group__head" @click="toggleGroup(g.id)">
              <ReIcon :name="collapsedGroups.has(g.id) ? 'ArrowRight' : 'ArrowDown'" :size="11" />
              <span class="rail-group__dot" :style="groupDotStyle(g.id)" />
              <span class="rail-group__name">{{ g.name }}</span>
              <span class="rail-group__stat"><b>{{ g.online }}</b>/{{ g.hosts.length }}</span>
            </button>
            <template v-if="!collapsedGroups.has(g.id)">
              <div
                v-for="h in g.hosts"
                :key="h.id"
                class="rail-host"
                :class="{
                  'is-active': statusHost?.id === h.id,
                  'is-off': liveOnlineState(h) !== 1,
                  'is-checked': multiSelect && checkedHostIds.has(h.id),
                }"
                @click="onHostRowClick(h)"
                @dblclick="multiSelect || openTab(h, isControl ? 'remote' : 'metrics')"
                @contextmenu="openCtxMenu($event, h)"
              >
                <input
                  v-if="multiSelect"
                  type="checkbox"
                  class="rail-host__check"
                  :checked="checkedHostIds.has(h.id)"
                  @click.stop="toggleCheck(h)"
                />
                <span class="rail-host__os" :class="osTileClass(h)">
                  <span v-html="osIconSvg(h.serverHostOsType)"></span>
                </span>
                <span class="rail-host__meta">
                  <b class="rail-host__name">{{ h.serverHostName }}</b>
                  <span class="rail-host__addr mono">{{ h.serverHostAddress }}</span>
                </span>
                <!-- 常态：迷你 CPU/内存条 + 延迟 + 在线点；hover 时让位给操作图标 -->
                <span class="rail-host__right">
                  <span v-if="hasUsage(h)" class="rail-host__mini" :title="usageTitle(h)">
                    <i class="rail-mini is-cpu"><b :style="{ width: usageOf(h, 'cpu') + '%' }" /></i>
                    <i class="rail-mini is-mem"><b :style="{ width: usageOf(h, 'mem') + '%' }" /></i>
                  </span>
                  <span class="rail-host__delay mono" :class="{ bad: delayBad(liveDelayMs(h)) }">{{ delayText(liveDelayMs(h)) }}</span>
                  <i class="rail-host__dot" :class="liveOnlineState(h) === 1 ? 'is-on' : 'is-off'" />
                </span>
                <!-- 行内操作：悬停浮出，不占常态宽度；控制管理只留远控一个 -->
                <span v-if="isControl" class="rail-host__ops">
                  <button type="button" title="远程控制" @click.stop="openTab(h, 'remote')">
                    <ReIcon name="Position" :size="13" />
                  </button>
                </span>
                <span v-else class="rail-host__ops">
                  <button type="button" title="远程控制" @click.stop="openTab(h, 'remote')">
                    <ReIcon name="Position" :size="13" />
                  </button>
                  <button type="button" title="文件管理" @click.stop="openTab(h, 'files')">
                    <ReIcon name="FolderOpened" :size="13" />
                  </button>
                  <button type="button" title="指标监控" @click.stop="openTab(h, 'metrics')">
                    <ReIcon name="TrendCharts" :size="13" />
                  </button>
                  <button type="button" title="全部功能" @click.stop="openCtxMenuFromButton($event, h)">
                    <ReIcon name="MoreFilled" :size="13" />
                  </button>
                </span>
              </div>
            </template>
          </div>

          <div v-if="!filtered.length" class="rail-empty">
            <ReIcon name="Files" :size="22" />
            <span>{{ emptyDescription }}</span>
            <ReButton v-if="loadError" icon="RefreshRight" type="primary" :show-text="true" @click="fetchAll">重试</ReButton>
            <ReButton v-else-if="hasHosts" icon="Refresh" :show-text="true" @click="resetFilters">重置筛选</ReButton>
            <ReButton v-else-if="!isControl" type="primary" icon="Plus" :show-text="true" @click="openAdd">新增主机</ReButton>
          </div>
        </ReScrollbar>

        <div v-show="!railCollapsed" class="rail-foot">
          <div class="rail-foot__row">
            <button
              type="button"
              class="rail-foot__rt"
              :class="{ 'is-off': !realtimeEnabled }"
              :title="realtimeEnabled ? '点击暂停实时指标推送' : '点击恢复实时指标推送'"
              @click="onRealtimeToggle(!realtimeEnabled)"
            >
              <ReIcon name="Odometer" :size="11" />
              <span>{{ realtimeEnabled ? "实时" : "已暂停" }}</span>
            </button>
            <span class="rail-foot__sum">
              <i class="is-on" />{{ onlineCount }}
              <i class="is-off" />{{ offlineCount }}
            </span>
          </div>
          <!-- 折叠按钮：贴在左栏右下角，收起来后中间工作区直接多出 224px -->
          <button type="button" class="rail-foot__fold" title="收起主机列表" @click="toggleRail">
            <ReIcon name="ArrowLeft" :size="12" />
          </button>
        </div>
      </aside>

      <!-- 分栏手柄：拖拽改左栏宽度，双击复位，偏好存本地 -->
      <ReRailSplit
        v-model:width="railWidth"
        class="as-split"
        storage-key="assets.rail.width.v1"
        :default-width="268"
        label="拖拽调整主机列表宽度"
      />

      <!-- ==================== 右侧：多标签工作区 ==================== -->
      <section class="as-work">
        <ReTabs
          v-model="activeTab"
          :tabs="openTabs"
          closable
          show-close-all
          :context-menu="tabContextMenu"
          :empty-text="isControl ? '点击左侧主机，直接在右侧开始远控' : '右键左侧主机，选择要打开的功能'"
          @close="closeTab"
          @close-all="closeAllTabs"
          @context-command="onTabCommand"
        >
          <template #default="{ tab }">
            <ReLoader
              :loading="tabLoadingOf(tab.name)"
              class="tab-loader"
              mode="overlay"
              :fullscreen="false"
              :mask="false"
              size="sm"
              text="加载中…"
            >
              <!-- 懒加载页签真正的白屏窗口在分包下载这一段：组件代码没到之前，面板里没有任何节点。
                   Suspense 把「等分包」接进加载态 —— 挂起即点亮上面这层 ReLoader，解析完成才熄灭；
                   已缓存的分包只会挂起一个微任务，肉眼看不到闪烁。
                   fallback 必须自带高度，否则 absolute inset:0 的遮罩没有可覆盖的面。 -->
              <Suspense
                @pending="markTabPending(tab.name)"
                @resolve="markTabResolved(tab.name)"
              >
              <!-- 画像分区：复用 HostProfileView 的单分区嵌入模式 -->
              <HostProfileView
                v-if="tabSectionOf(tab.name)"
                :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
                embedded
                :hosts="hosts"
                :groups="groups"
                :host-id="tabHostIdOf(tab.name)"
                :section="tabSectionOf(tab.name)"
                :live-delay="liveDelay"
                :live-online="liveOnline"
                @connect="openConnect"
                @edit="openEdit"
                @detail="(h) => openTab(h, 'metrics')"
                @deploy-agent="(h) => openDeploy(h, 'install')"
                @refreshed="fetchAll"
              />
              <!-- 远控 -->
              <TerminalView
                v-else-if="tabKindOf(tab.name) === 'remote'"
                :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
                embedded
                :host-id="tabHostIdOf(tab.name)"
                :identity-id="tabOf(tab.name)?.identityId ?? null"
              />
              <!-- 虚拟桌面：这台主机的桌面壳（SSH 终端 / 文件 / 监控 / 命令），
                   占满整个工作区面板；关页签就回主机资产，不开浏览器新标签页 -->
              <DesktopView
                v-else-if="tabKindOf(tab.name) === 'desktop'"
                :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
                embedded
                :host-id="tabHostIdOf(tab.name)"
              />
              <!-- 文件管理 -->
              <HostFileManager
                v-else-if="tabKindOf(tab.name) === 'files'"
                :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
                :host-id="tabHostIdOf(tab.name)"
                :platform="platformOf(tabHostIdOf(tab.name))"
                :initial-path="tabOf(tab.name)?.path ?? ''"
              />
              <!-- 指标监控 -->
              <HostDetailView
                v-else-if="tabKindOf(tab.name) === 'metrics'"
                :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
                embedded
                :host-id="tabHostIdOf(tab.name)"
              />
              <!-- 主机工作台：分屏 / Docker / K8s / 隧道 / 反向隧道 各开独立页签 -->
              <ScHostWorkbench
                v-else-if="tabKindOf(tab.name) === 'workbench'"
                :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
                :start="tabOf(tab.name)?.startPanel ?? 'screen'"
                :host-id="tabHostIdOf(tab.name)"
                :host-name="hostNameOf(tabHostIdOf(tab.name))"
                @open-panel="onWorkbenchOpenPanel"
              />
              <!-- 目标主机日志页签：系统日志 / 登录日志读的是这台服务器自身（journalctl / wevtutil），
                   与「运维台 / 软件管理」的通用懒加载区分开，额外传 kind=sys|login -->
              <HostLogsTab
                v-else-if="tabKindOf(tab.name) === 'sys-log' || tabKindOf(tab.name) === 'user-log'"
                :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
                :host-id="tabHostIdOf(tab.name)"
                :host-name="hostNameOf(tabHostIdOf(tab.name))"
                :platform="platformOf(tabHostIdOf(tab.name))"
                :kind="tabKindOf(tab.name) === 'user-log' ? 'login' : 'sys'"
              />
              <!-- 运维台四页 + 主机账号 + 软件管理：懒加载页面收进工作区页签 -->
              <component
                :is="lazyTabOf(tab.name)"
                v-else-if="tabKindOf(tab.name) && lazyTabOf(tab.name)"
                :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
                :host-id="tabHostIdOf(tab.name)"
                :host-name="hostNameOf(tabHostIdOf(tab.name))"
                :platform="platformOf(tabHostIdOf(tab.name))"
              />
                <template #fallback>
                  <div class="tab-suspense-fallback" aria-hidden="true" />
                </template>
              </Suspense>
            </ReLoader>
          </template>

          <template #empty>
            <div class="work-empty">
              <ReIcon name="Position" :size="30" />
              <b class="work-empty__title">{{ isControl ? '选择左侧主机开始远控' : '还没有打开任何功能' }}</b>
              <p class="work-empty__desc">
                <template v-if="isControl">
                  点一下左侧任意主机，右侧会直接打开它的远程控制；同一台主机会复用已打开的页签。
                </template>
                <template v-else>
                  在左侧主机上点<strong>右键</strong>，选择「远控 / 文件管理 / 指标监控 / 端口 / 进程 …」，
                  每个功能都会在这里打开一个独立页签，可以同时开多个互不干扰。
                </template>
              </p>
              <div v-if="selectedHost" class="work-empty__quick">
                <ReButton icon="Position" :show-text="true" @click="openTab(selectedHost, 'remote')">远控 {{ selectedHost.serverHostName }}</ReButton>
                <ReButton v-if="!isControl" icon="TrendCharts" :show-text="true" @click="openTab(selectedHost, 'metrics')">指标监控</ReButton>
              </div>
            </div>
          </template>
        </ReTabs>

        <!-- 底部常驻条：CPU / 内存 / 磁盘 + 主机概要（hover 浮层）+ Dock 设置 —— 压成一行 -->
        <div class="as-work__bottom">
          <ScHostMetricsBar
            :host-name="statusHost?.serverHostName ?? ''"
            :address="statusHost ? `${statusHost.serverHostAddress}:${statusHost.serverHostPort}` : ''"
            :online="statusHost ? liveOnlineState(statusHost) : 0"
            :delay-ms="statusHost ? liveDelayMs(statusHost) : null"
            :protocol="statusHost ? protocolOf(statusHost) : ''"
            :agent-version="statusHost?.serverHostAgentInstalled === 1 ? (statusHost.serverHostAgentVersion ?? '') : ''"
            :cpu="statusMetrics.cpu"
            :mem="statusMetrics.mem"
            :disk="statusMetrics.disk"
            :mem-total-mb="statusMetrics.memTotalMb"
            :disk-total-gb="statusMetrics.diskTotalGb"
            :disk-read-kbs="statusMetrics.diskRead"
            :disk-write-kbs="statusMetrics.diskWrite"
            :net-rx-kbs="statusMetrics.netRx"
            :net-tx-kbs="statusMetrics.netTx"
            :has-io="statusMetrics.hasIo"
            :has-metrics="statusMetrics.has"
            :handle-count="statusSummary.handleCount"
            :inode-percent="statusSummary.inodePercent"
            :inode-used="statusSummary.inodeUsed"
            :inode-total="statusSummary.inodeTotal"
            :inode-mount="statusSummary.inodeMount"
            :rows="statusOverviewRows"
            @metric-click="openMetricHistory"
          />
          <!-- Dock 开关：箭头直接销毁 / 恢复右侧快捷操作面板（控制管理页不需要这层入口） -->
          <div v-if="!isControl" class="as-work__foot">
            <button
              type="button"
              class="as-work__dock-toggle"
              :class="{ 'is-open': dockOpen }"
              :title="dockOpen ? '收起右侧快捷操作面板' : '展开右侧快捷操作面板'"
              :aria-label="dockOpen ? '收起右侧快捷操作面板' : '展开右侧快捷操作面板'"
              :aria-expanded="dockOpen"
              @click="toggleDock"
            >
              <ReIcon :name="dockOpen ? 'ArrowRight' : 'ArrowLeft'" :size="15" />
            </button>
          </div>
        </div>
      </section>

      <!-- ==================== 右侧：快捷操作 + 最近活动 ==================== -->
      <aside v-if="dockOpen && !isControl" class="as-dock">
        <div class="dock-head">
          <span class="dock-head__title">快捷操作</span>
        </div>

        <div class="dock-quick">
          <button type="button" class="dock-quick__item" @click="openAdd">
            <ReIcon name="Plus" :size="15" />
            <span>新增主机</span>
          </button>
          <button type="button" class="dock-quick__item" @click="paletteOpen = true">
            <ReIcon name="Search" :size="15" />
            <span>命令面板</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button type="button" class="dock-quick__item" @click="fetchAll">
            <ReIcon name="RefreshRight" :size="15" />
            <span>刷新列表</span>
          </button>
          <button type="button" class="dock-quick__item" @click="onRealtimeToggle(!realtimeEnabled)">
            <ReIcon name="Odometer" :size="15" />
            <span>{{ realtimeEnabled ? "暂停实时" : "恢复实时" }}</span>
          </button>
        </div>

        <div class="dock-sec">
          <span class="dock-sec__title">最近活动</span>
          <button
            v-if="activities.length"
            type="button"
            class="dock-sec__more"
            @click="clearActivities"
          >清空</button>
        </div>
        <div class="dock-act">
          <div v-if="!activities.length" class="dock-act__empty">打开功能后，这里会记下最近的操作</div>
          <button
            v-for="it in activities"
            :key="it.id"
            type="button"
            class="dock-act__item"
            :class="{ 'is-link': it.hostId != null }"
            @click="gotoActivity(it)"
          >
            <ReIcon :name="it.icon" :size="12" class="dock-act__icon" />
            <span class="dock-act__text">{{ it.text }}</span>
            <span class="dock-act__time mono">{{ timeAgo(it.at) }}</span>
          </button>
        </div>

        <div class="dock-sec">
          <span class="dock-sec__title">工作区</span>
        </div>
        <div class="dock-stat">
          <span><b>{{ tabCount }}</b> 个页签</span>
          <span><b>{{ onlineCount }}</b> 在线</span>
          <span><b>{{ offlineCount }}</b> 离线</span>
        </div>

        <!-- 收起按钮落在 Dock 底部：和左栏一样，「收起/展开都压在下方 -->
        <div class="dock-foot">
          <button type="button" class="dock-foot__fold" title="收起快捷操作" @click="toggleDock">
            <ReIcon name="ArrowRight" :size="12" />
          </button>
        </div>
      </aside>

      <!-- Dock 收起（v-if 控制）：Dock 结构（含折叠钮）全量销毁，
      不留任何 Dock 控件；恢复入口是工作区底部右侧的箭头按钮（无需菜单） -->
    </div>

    <!-- 新增/编辑弹窗（独立子组件——弹窗渲染只在子组件内进行，不再触发本组件全量 diff） -->
    <HostFormDialog
      v-model="formVisible"
      :is-edit="formIsEdit"
      :host="editHost"
      :identity-options="identityOptions"
      :group-options="groupOptions"
      @saved="fetchAll"
      @deploy-agent="openDeploy"
    />

    <!-- 连接弹窗（选择登录身份） -->
    <ReDialog v-model="connectVisible" :title="`连接 ${connectTarget?.serverHostName ?? ''}`" width="460px">
      <div v-if="!connectTarget" />
      <template v-else>
        <p class="muted" style="margin-top:0">{{ connectTarget.serverHostAddress }}:{{ remotePortOf(connectTarget) }} · {{ protocolOf(connectTarget).toUpperCase() }}</p>
        <div class="muted" style="margin-bottom:8px">登录身份（账号密码 / 私钥）</div>
        <ReSelect v-model="connectIdentityId" placeholder="使用默认凭据" clearable style="width:100%" :options="[
          ...hostBoundIdentities.map(b => ({ label: `${identities.find(i => i.id === b)?.msServerIdentityName ?? ''}（${identities.find(i => i.id === b)?.msServerIdentityUsername ?? ''}）`, value: b, group: '已绑定' })),
          ...identities.filter(x => !hostBoundIdentities.includes(x.id)).map(i => ({ label: `${i.msServerIdentityName}（${i.msServerIdentityUsername}）`, value: i.id, group: '全部身份' })),
        ]" />
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">
          <ReButton icon="Key" :show-text="true" plain title="统一在「主机账号」维护" @click="router.push('/host-accounts')">主机账号</ReButton>
          <template v-for="b in hostBoundIdentities" :key="b">
            <ReButton icon="Unlink" :show-text="true" type="warning" plain :title="`解绑 ${identities.find(i => i.id === b)?.msServerIdentityName ?? ''}`" @click="toggleBind(connectTarget!.id, b, false)">解绑 {{ identities.find(i => i.id === b)?.msServerIdentityName }}</ReButton>
          </template>
        </div>
      </template>
      <template #footer>
        <ReButton @click="connectVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Connection" :show-text="true" @click="doConnect">{{ connectIdentityId ? "以此身份连接" : "默认凭据连接" }}</ReButton>
      </template>
    </ReDialog>

    <!-- 系统设置弹窗：画像偏好 / 自动刷新 / 分页 三组开关统一收口（localStorage，画像页签共读） -->
    <ReDialog v-model="systemSettingsVisible" title="系统设置" width="460px">
      <div class="ss-body">
        <!-- 画像偏好：轮询类配置 -- 自动刷新间隔 -->
        <section class="ss-group">
          <h5 class="ss-group__title">画像偏好</h5>
          <div class="ss-row">
            <span class="ss-row__label">自动刷新间隔（秒）</span>
            <ReInputNumber v-model="systemSettings.refreshSeconds" :min="5" :max="600" style="width:140px" />
          </div>
        </section>

        <!-- 自动刷新：默认开关 -->
        <section class="ss-group">
          <h5 class="ss-group__title">自动刷新</h5>
          <div class="ss-row">
            <span class="ss-row__label">默认自动刷新</span>
            <ReSwitch v-model="systemSettings.autoRefresh" />
            <span class="ss-row__hint">{{ systemSettings.autoRefresh ? '画像页签打开时自动定时刷新' : '默认关闭，手动刷新' }}</span>
          </div>
        </section>

        <!-- 分页：每页条数（画像页签的分页宽度） -->
        <section class="ss-group">
          <h5 class="ss-group__title">分页</h5>
          <div class="ss-row">
            <span class="ss-row__label">每页条数</span>
            <ReSelect v-model="systemSettings.pageSize" style="width:140px" :options="[
              { label: '20 条', value: 20 },
              { label: '50 条（默认）', value: 50 },
              { label: '100 条', value: 100 },
              { label: '200 条', value: 200 },
            ]" />
          </div>
        </section>
      </div>

      <template #footer>
        <ReButton @click="systemSettingsVisible = false">取消</ReButton>
        <ReButton type="primary" @click="saveSystemSettings">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 协议服务器管理弹窗已移除 -->

    <HostConfigDialog v-model="configVisible" :host="configHost" :mode="configMode" @saved="fetchAll" />

    <!-- 底部条点数字打开的历史曲线（与指标监控页同一数据源） -->
    <HostMetricHistoryDialog
      v-model="metricHistVisible"
      :host-id="statusHost?.id ?? 0"
      :host-name="statusHost?.serverHostName ?? ''"
      :kind="metricHistKind"
    />

    <!-- 导入 / 导出：客户端会话文件（ssh/plink/xshell）+ 主机资产归档 JSON -->
    <HostImportExportDialog v-model="hostIeVisible" :hosts="hosts" @imported="fetchAll" />

    <!-- 远控配置已并入主机编辑弹窗（HostFormDialog 的「远控配置」区块） -->

    <!-- Agent 自动部署进度弹窗（socket 实时推送，支持最小化和断点续传） -->
    <AgentDeployDialog
      v-model="deployDialogVisible"
      v-model:minimized="deployMinimized"
      :task="deployTask"
      :logs="deployLogs.map(l => ({ time: new Date().toLocaleTimeString(), msg: l }))"
    />

    <!-- 主机右键菜单：左侧主机列表的唯一功能总入口 -->
    <Teleport to="body">
      <div v-if="ctxMenu.visible" class="host-ctx-backdrop" @mousedown="closeCtxMenu" @contextmenu.prevent="closeCtxMenu" />
      <div
        v-if="ctxMenu.visible && ctxMenu.host"
        ref="ctxMenuEl"
        class="host-ctx-menu"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        role="menu"
        @contextmenu.prevent
      >
        <div class="host-ctx-head">
          <b :title="ctxMenu.host.serverHostName">{{ ctxMenu.host.serverHostName }}</b>
          <span class="mono">{{ ctxMenu.host.serverHostAddress }}</span>
        </div>

        <!-- 控制管理：右键只保留远控相关的少量动作 -->
        <template v-if="isControl">
          <div class="host-ctx-item" @click="ctxCommand('tab-remote')">
            <ReIcon name="Position" /><span>远程控制</span>
          </div>
          <div class="host-ctx-item" @click="ctxCommand('edit')">
            <ReIcon name="EditPen" /><span>编辑主机</span>
          </div>
          <div class="host-ctx-item" @click="ctxCommand('copy-address')">
            <ReIcon name="Link" /><span>复制地址</span>
          </div>
          <div class="host-ctx-sep" />
          <div class="host-ctx-item" @click="ctxCommand('close-host-tabs')">
            <ReIcon name="CircleClose" /><span>关闭该主机全部页签</span>
          </div>
        </template>
        <template v-else>
        <div class="host-ctx-item" @click="ctxCommand('tab-remote')">
          <ReIcon name="Position" /><span>远程控制</span>
        </div>
        <!-- 虚拟桌面：这台主机的桌面壳（SSH 终端 / 文件 / 监控 / 命令），应用内页签打开 -->
        <div class="host-ctx-item" @click="ctxCommand('desktop')">
          <ReIcon name="FullScreen" /><span>虚拟桌面</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('tab-files')">
          <ReIcon name="FolderOpened" /><span>文件管理</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('tab-metrics')">
          <ReIcon name="TrendCharts" /><span>指标监控</span>
        </div>
        <!-- 编辑主机是最高频的改配动作：不再藏进「主机管理」二级菜单 -->
        <div class="host-ctx-item" @click="ctxCommand('edit')">
          <ReIcon name="EditPen" /><span>编辑主机</span>
        </div>
        <!-- 主机配置：随平台变化的系统参数（Linux sysctl/limits、Windows 注册表），独立顶层入口 -->
        <div class="host-ctx-item" @click="ctxCommand('tab-sysconfig')">
          <ReIcon name="Setting" /><span>主机配置</span>
        </div>

        <!-- 主机工作台：分屏 / K8s / 隧道 / 反向隧道（分屏工具条的 Docker 按钮走 /docker 独立页） -->
        <div
          class="host-ctx-item has-sub"
          :class="{ 'is-open': ctxSub === 'workbench' }"
          @click="toggleCtxSub('workbench')"
          @mouseenter="hoverCtxSub('workbench')"
        >
          <ReIcon name="Box" /><span>工作台</span>
          <ReIcon name="ArrowRight" class="host-ctx-arrow" />
          <div v-if="ctxSub === 'workbench'" class="host-ctx-sub" @mouseenter="hoverCtxSub('workbench')" @mouseleave="leaveCtxSub('workbench')">
            <div class="host-ctx-item" @click="ctxCommand('tab-workbench')">
              <ReIcon name="Monitor" /><span>分屏终端</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-docker')">
              <ReIcon name="Box" /><span>Docker</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-k8s')">
              <ReIcon name="Coin" /><span>K8s</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-tunnel')">
              <ReIcon name="Connection" /><span>隧道</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-tunnel-reverse')">
              <ReIcon name="RefreshLeft" /><span>反向隧道</span>
            </div>
          </div>
        </div>

        <!-- 主机画像：七个分区收进二级菜单，顶层只留一个入口 -->
        <div
          class="host-ctx-item has-sub"
          :class="{ 'is-open': ctxSub === 'profile' }"
          @click="toggleCtxSub('profile')"
          @mouseenter="hoverCtxSub('profile')"
        >
          <ReIcon name="Grid" /><span>主机画像</span>
          <ReIcon name="ArrowRight" class="host-ctx-arrow" />
          <div v-if="ctxSub === 'profile'" class="host-ctx-sub" @mouseenter="hoverCtxSub('profile')" @mouseleave="leaveCtxSub('profile')">
            <div class="host-ctx-item" @click="ctxCommand('tab-ports')">
              <ReIcon name="Connection" /><span>监听端口</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-processes')">
              <ReIcon name="Cpu" /><span>进程</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-services')">
              <ReIcon name="SetUp" /><span>服务</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-disks')">
              <ReIcon name="Coin" /><span>磁盘</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-mounts')">
              <ReIcon name="Files" /><span>挂载盘</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-network')">
              <ReIcon name="Share" /><span>网络</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-env')">
              <ReIcon name="Document" /><span>环境变量</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('tab-firewall')">
              <ReIcon name="Lock" /><span>防火墙</span>
            </div>
            <div class="host-ctx-sep" />
            <div class="host-ctx-item" @click="ctxCommand('tab-deleted')">
              <ReIcon name="Delete" /><span>已删除文件</span>
            </div>
            <div class="host-ctx-sep" />
            <div class="host-ctx-item" @click="ctxCommand('open-all-profile')">
              <ReIcon name="Files" /><span>一次全部展开</span>
            </div>
          </div>
        </div>

        <!-- 运维台：会话审计 / 批量作业 / 片段管理 / 维护计划，同样收进二级菜单 -->
        <div
          class="host-ctx-item has-sub"
          :class="{ 'is-open': ctxSub === 'workspace' }"
          @click="toggleCtxSub('workspace')"
          @mouseenter="hoverCtxSub('workspace')"
        >
          <ReIcon name="Operation" /><span>运维台</span>
          <ReIcon name="ArrowRight" class="host-ctx-arrow" />
          <div v-if="ctxSub === 'workspace'" class="host-ctx-sub" @mouseenter="hoverCtxSub('workspace')" @mouseleave="leaveCtxSub('workspace')">
            <div class="host-ctx-item" @click="ctxOpenTab('ops-sessions')">
              <ReIcon name="Document" /><span>会话审计</span>
            </div>
            <div class="host-ctx-item" @click="ctxOpenTab('ops-exec')">
              <ReIcon name="Promotion" /><span>批量作业</span>
            </div>
            <div class="host-ctx-item" @click="ctxOpenTab('ops-snippets')">
              <ReIcon name="DocumentCopy" /><span>片段管理</span>
            </div>
            <div class="host-ctx-item" @click="ctxOpenTab('ops-maintenance')">
              <ReIcon name="Clock" /><span>维护计划</span>
            </div>
          </div>
        </div>

        <!-- 主机管理：账号 / 计划 / 巡检 / 改配 —— 低频配置类动作收一组，
             顶层不再为「改个端口」「看一眼账号」各占一行。 -->
        <div
          class="host-ctx-item has-sub"
          :class="{ 'is-open': ctxSub === 'manage' }"
          @click="toggleCtxSub('manage')"
          @mouseenter="hoverCtxSub('manage')"
        >
          <ReIcon name="Management" /><span>主机管理</span>
          <ReIcon name="ArrowRight" class="host-ctx-arrow" />
          <div v-if="ctxSub === 'manage'" class="host-ctx-sub" @mouseenter="hoverCtxSub('manage')" @mouseleave="leaveCtxSub('manage')">
            <div class="host-ctx-label">凭据与计划</div>
            <div class="host-ctx-item" @click="ctxOpenTab('host-accounts')">
              <ReIcon name="User" /><span>主机账号</span>
            </div>
            <div class="host-ctx-item" @click="ctxOpenTab('alarm-policy')">
              <ReIcon name="Bell" /><span>告警策略</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('schedule')">
              <ReIcon name="Clock" /><span>调度信息</span>
            </div>
            <div class="host-ctx-sep" />
            <div class="host-ctx-label">巡检与软件</div>
            <div class="host-ctx-item" @click="ctxCommand('scan')">
              <ReIcon name="Aim" /><span>端口扫描</span>
            </div>
            <!-- 软件管理：系统包管理器安装 / 卸载 / 升级 / 检索 -->
            <div class="host-ctx-item" @click="ctxCommand('software')">
              <ReIcon name="Box" /><span>软件管理</span>
            </div>
            <!-- 软件实例：运行中的进程级实例，与指标监控页的「软件实例」同一份数据 -->
            <div class="host-ctx-item" @click="ctxCommand('software-instance')">
              <ReIcon name="Cpu" /><span>软件实例</span>
            </div>
            <div class="host-ctx-sep" />
            <div class="host-ctx-label">改配与远控</div>
            <div class="host-ctx-item" @click="ctxCommand('edit')">
              <ReIcon name="EditPen" /><span>编辑主机</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('clone')">
              <ReIcon name="CopyDocument" /><span>克隆主机</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('toggle-remote')">
              <ReIcon name="SwitchButton" />
              <span>{{ ctxMenu.host.serverHostRemoteEnabled === 1 ? '停用远控入口' : '启用远控入口' }}</span>
            </div>
          </div>
        </div>

        <!-- 系统：平台侧日志与设置，跟「这台主机的运维」不是一类事 -->
        <div
          class="host-ctx-item has-sub"
          :class="{ 'is-open': ctxSub === 'system' }"
          @click="toggleCtxSub('system')"
          @mouseenter="hoverCtxSub('system')"
        >
          <ReIcon name="Setting" /><span>系统</span>
          <ReIcon name="ArrowRight" class="host-ctx-arrow" />
          <div v-if="ctxSub === 'system'" class="host-ctx-sub" @mouseenter="hoverCtxSub('system')" @mouseleave="leaveCtxSub('system')">
            <div class="host-ctx-item" @click="ctxCommand('open-sys-log')">
              <ReIcon name="Tickets" /><span>系统日志</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('open-user-log')">
              <ReIcon name="Unlock" /><span>登录日志</span>
            </div>
            <div class="host-ctx-sep" />
            <div class="host-ctx-item" @click="openSystemSettings()">
              <ReIcon name="Setting" /><span>系统设置</span>
            </div>
          </div>
        </div>

        <!-- Agent：非 Agent 采集模式也保留入口——用户要能在这里装 Agent 切换到 Agent 采集；
             装没装决定是「安装」还是「重装/升级/卸载」 -->
        <div
          class="host-ctx-item has-sub"
          :class="{ 'is-open': ctxSub === 'agent' }"
          @click="toggleCtxSub('agent')"
          @mouseenter="hoverCtxSub('agent')"
        >
          <ReIcon name="Cpu" /><span>Agent</span>
          <ReIcon name="ArrowRight" class="host-ctx-arrow" />
          <div v-if="ctxSub === 'agent'" class="host-ctx-sub" @mouseenter="hoverCtxSub('agent')" @mouseleave="leaveCtxSub('agent')">
            <div class="host-ctx-label">采集模式 · {{ isAgentMode(ctxMenu.host) ? 'Agent' : 'SSH' }}</div>
            <div v-if="!isAgentInstalled(ctxMenu.host)" class="host-ctx-item" @click="ctxCommand('agent-install')">
              <ReIcon name="Download" /><span>安装 Agent</span>
            </div>
            <template v-else>
              <div class="host-ctx-item" @click="ctxCommand('agent-reinstall')">
                <ReIcon name="RefreshRight" /><span>重装 Agent</span>
              </div>
              <div class="host-ctx-item" @click="ctxCommand('agent-upgrade')">
                <ReIcon name="Top" /><span>升级 Agent</span>
              </div>
              <div class="host-ctx-item is-danger" @click="ctxCommand('agent-uninstall')">
                <ReIcon name="DeleteFilled" /><span>卸载 Agent</span>
              </div>
            </template>
          </div>
        </div>

        <!-- 复制：三个复制动作单独收口，避免和「删除」这类危险项混在一起 -->
        <div
          class="host-ctx-item has-sub"
          :class="{ 'is-open': ctxSub === 'copy' }"
          @click="toggleCtxSub('copy')"
          @mouseenter="hoverCtxSub('copy')"
        >
          <ReIcon name="DocumentCopy" /><span>复制</span>
          <ReIcon name="ArrowRight" class="host-ctx-arrow" />
          <div v-if="ctxSub === 'copy'" class="host-ctx-sub" @mouseenter="hoverCtxSub('copy')" @mouseleave="leaveCtxSub('copy')">
            <div class="host-ctx-item" @click="ctxCommand('copy-address')">
              <ReIcon name="Link" /><span>复制地址</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('copy-name')">
              <ReIcon name="Document" /><span>复制主机名</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('copy-link')">
              <ReIcon name="Share" /><span>复制详情链接</span>
            </div>
          </div>
        </div>

        <div class="host-ctx-sep" />
        <div class="host-ctx-item" @click="ctxCommand('close-host-tabs')">
          <ReIcon name="CircleClose" /><span>关闭该主机全部页签</span>
        </div>
        <div class="host-ctx-item is-danger" @click="ctxCommand('delete')">
          <ReIcon name="Delete" /><span>删除主机</span>
        </div>
        </template>
      </div>
    </Teleport>

    <!-- 命令面板（Ctrl+K / 连按两次 Shift） -->
    <HostCommandPalette v-model="paletteOpen" :items="paletteItems" @select="onPaletteSelect" />
  </div>
</template>

<style scoped lang="scss">
/* ============================================================
   主机资产工作台（Deck 布局）
   左：分组主机列表；右：多标签工作区 + 底部常驻指标条。
   整体吃满父容器高度，只有左侧列表与页签面板各自滚动。
   ============================================================ */
.as {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

/* 左右两栏：左侧可拖拽定宽，右侧吃掉剩余 */
.as-body {
  display: flex;
  flex: 1 1 auto;
  /* 间距交给分栏手柄本身，避免 gap + 手柄叠出一段空档 */
  gap: 0;
  min-height: 0;
}

/* ============================================================
   左侧：主机资源栏
   ============================================================ */
.as-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  /* 宽度由分栏手柄写入 --as-rail-width（可拖拽，存本地偏好） */
  width: var(--as-rail-width, 268px);
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

/* 折叠态：268px → 44px，中间工作区净增 224px。只留计数、在线/离线点
   和底部展开按钮，不保留任何需要横向空间的内容。 */
.as-rail.is-collapsed {
  width: 44px;
}

.rail-strip {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0 10px;
}

.rail-strip__count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px 0;
  font-size: 10px;
  line-height: 1.1;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  background: transparent;
  border: none;
  cursor: pointer;
}

.rail-strip__count b {
  font-size: 13px;
  color: var(--el-color-primary);
}

.rail-strip__dots {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rail-strip__dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.rail-strip__dots i.is-on {
  background: var(--el-color-success);
}

.rail-strip__dots i.is-off {
  background: var(--el-text-color-placeholder);
}

.rail-strip__gap {
  flex: 1;
}

.rail-strip__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.rail-strip__toggle:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.rail-head {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.rail-head__row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rail-head__title {
  flex: none;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}

.rail-head__count {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--el-color-primary);
}

.rail-head__count i {
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}

.rail-head__gap {
  flex: 1;
}

.rail-head__search {
  width: 100%;
}

/* 状态筛选：胶囊分段，计数跟在文案后面 */
.rail-filters {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}

/* 排序/多选/刷新/新增小工具按钮：和胶囊同高，方形，不占标题行宽度 */
.rail-tool {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  transition: background 0.15s ease, color 0.15s ease;
}

.rail-tool:hover:not(:disabled) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.rail-tool:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.rail-tool.is-on {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.rail-tool.is-primary {
  color: #fff;
  background: var(--el-color-primary);
}

.rail-tool.is-primary:hover {
  color: #fff;
  background: var(--el-color-primary-light-3);
}

/* 「更多」下拉的触发器：不参与收缩，按钮外观仍复用 .rail-tool */
.rail-tool-dd {
  display: inline-flex;
  flex: none;
}

.rail-chip {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  height: 24px;
  padding: 0 3px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  transition: background 0.15s ease, color 0.15s ease;
}

.rail-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.rail-chip b {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-placeholder);
}

.rail-chip:hover {
  color: var(--el-text-color-primary);
}

.rail-chip.is-active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.rail-chip.is-active b {
  color: var(--el-color-primary);
}

/* 多选工具条：勾选全选 + 批量动作，只在多选模式出现 */
.rail-batch {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 7px 8px;
  background: var(--el-color-primary-light-9);
  border-radius: var(--el-radius-md, 8px);
}

.rail-batch__all {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.rail-batch__all input {
  width: 13px;
  height: 13px;
  margin: 0;
  accent-color: var(--el-color-primary);
}

.rail-batch__ops {
  display: flex;
  gap: 4px;
}

.rail-batch__ops button {
  flex: 1;
  height: 24px;
  padding: 0 4px;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 4px);
}

.rail-batch__ops button:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.rail-batch__ops button.is-danger:hover:not(:disabled) {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger-light-5);
}

.rail-batch__ops button:disabled {
  color: var(--el-text-color-placeholder);
  cursor: not-allowed;
  background: var(--el-fill-color-lighter);
}

/* 主机列表：唯一可滚动区 */
.rail-list {
  flex: 1 1 auto;
  min-height: 0;
  padding: 6px;
}

/* 分组头：折叠开关 + 颜色点 + 名称 + 在线/总数 */
.rail-group {
  margin-bottom: 2px;
}

.rail-group__head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 28px;
  padding: 0 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 4px);
}

.rail-group__head:hover {
  background: var(--el-fill-color-light);
}

.rail-group__dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.rail-group__name {
  flex: 1;
  overflow: hidden;
  font-weight: 600;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-group__stat {
  flex: none;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-placeholder);
}

.rail-group__stat b {
  color: var(--el-color-success);
}

/* 主机行：OS 图标 + 名称/地址 + 延迟/在线点 */
.rail-host {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid transparent;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.rail-host:hover {
  background: var(--el-fill-color-light);
}

.rail-host.is-active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.rail-host.is-checked {
  background: var(--el-color-primary-light-9);
}

.rail-host.is-off .rail-host__name {
  color: var(--el-text-color-secondary);
}

/* 多选框：只在多选模式出现，宽度固定不挤压名称 */
.rail-host__check {
  flex: none;
  width: 13px;
  height: 13px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--el-color-primary);
}

.rail-host__os {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 16px;
  line-height: 1;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
}

.rail-host__os :deep(svg) {
  display: block;
}

.rail-host__os.is-windows {
  background: color-mix(in srgb, var(--metric-mem, #8b5cf6) 12%, var(--el-bg-color));
}

.rail-host__os.is-linux {
  background: color-mix(in srgb, var(--metric-disk, #f59e0b) 14%, var(--el-bg-color));
}

.rail-host__os.is-macos {
  background: color-mix(in srgb, var(--el-text-color-placeholder) 14%, var(--el-bg-color));
}

.rail-host__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.rail-host__name {
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-host__addr {
  overflow: hidden;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-host__right {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
}

/* 迷你指标：两条 3px 细条，CPU 在上、内存在下，只给量级不给数字（数字在 title 里） */
.rail-host__mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 30px;
}

.rail-mini {
  display: block;
  height: 3px;
  overflow: hidden;
  background: var(--el-fill-color-dark);
  border-radius: 2px;
}

.rail-mini b {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.rail-mini.is-cpu b {
  background: var(--metric-cpu, #3b82f6);
}

.rail-mini.is-mem b {
  background: var(--metric-mem, #8b5cf6);
}

/* 行内操作：常态不占位，悬停时覆盖在延迟/指标区上 */
.rail-host__ops {
  position: absolute;
  top: 50%;
  right: 6px;
  display: flex;
  gap: 2px;
  padding: 2px;
  opacity: 0;
  pointer-events: none;
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  border-radius: var(--el-radius-sm, 4px);
  transform: translateY(-50%);
  transition: opacity 0.12s ease;
}

.rail-host:hover .rail-host__ops,
.rail-host:focus-within .rail-host__ops {
  opacity: 1;
  pointer-events: auto;
}

.rail-host__ops button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 4px);
}

.rail-host__ops button:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.rail-host__delay {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

.rail-host__delay.bad {
  font-weight: 600;
  color: var(--el-color-danger);
}

.rail-host__dot {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
}

.rail-host__dot.is-on {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent);
}

.rail-host__dot.is-off {
  background: var(--el-text-color-placeholder);
}

/* 左侧空态 */
.rail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 16px;
  font-size: 12.5px;
  text-align: center;
  color: var(--el-text-color-placeholder);
}

/* 左栏底部：实时开关 + 在线/离线小结 + 收起按钮 */
.rail-foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 8px 8px 12px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 收起按钮：贴左栏右下角。收起后这一整列变成 44px 竖条，
   展开按钮落在竖条底部（即「右侧下方」），位置保持一致不会跳。 */
.rail-foot__fold {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: auto;
  color: var(--el-text-color-placeholder);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.rail-foot__fold:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.rail-foot__sum {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.rail-foot__row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

/* 实时推送开关：停止后底部指标条会停在最后一帧，所以必须有个显式的
   「已暂停」状态，否则用户会以为采集坏了。 */
.rail-foot__rt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: transparent;
  color: var(--el-color-success);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.rail-foot__rt:hover {
  border-color: currentColor;
}

.rail-foot__rt.is-off {
  color: var(--el-text-color-placeholder);
}

.rail-foot__sum i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.rail-foot__sum i.is-on {
  background: var(--el-color-success);
}

.rail-foot__sum i.is-off {
  margin-left: 4px;
  background: var(--el-text-color-placeholder);
}

/* ============================================================
   右侧：快捷操作 Dock
   ============================================================ */
.as-dock {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 208px;
  min-height: 0;
  overflow-y: auto;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.dock-head {
  display: flex;
  flex: none;
  align-items: center;
  padding: 10px 10px 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dock-head__title {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

/* Dock 底部：收起按钮的容器 */
.dock-foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 10px 10px 12px;
  margin-top: auto;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 收起按钮：贴 Dock 底部左侧，收到只剩图标，和左侧资源栏的收起按钮样式一致 */
.dock-foot__fold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--el-text-color-placeholder);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.dock-foot__fold:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-fill-color-light);
}

.dock-quick {
  display: grid;
  flex: none;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 10px;
}

.dock-quick__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 8px;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  background: var(--el-fill-color-lighter);
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  transition: background 0.12s ease, border-color 0.12s ease;
}

.dock-quick__item:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.dock-quick__item kbd {
  padding: 0 4px;
  font-family: inherit;
  font-size: 9.5px;
  color: var(--el-text-color-placeholder);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 3px;
}

.dock-sec {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 6px;
}

.dock-sec__title {
  flex: 1;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
}

.dock-sec__more {
  padding: 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  background: transparent;
  border: none;
}

.dock-sec__more:hover {
  color: var(--el-color-primary);
}

.dock-act {
  display: flex;
  flex: none;
  flex-direction: column;
  padding: 0 6px 8px;
}

.dock-act__empty {
  padding: 8px 6px 12px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
}

.dock-act__item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 5px 6px;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: default;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 4px);
}

.dock-act__item.is-link {
  cursor: pointer;
}

.dock-act__item.is-link:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.dock-act__icon {
  flex: none;
  color: var(--el-text-color-placeholder);
}

.dock-act__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dock-act__time {
  flex: none;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.dock-stat {
  display: flex;
  flex: none;
  gap: 10px;
  padding: 0 12px 12px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.dock-stat b {
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

/* ============================================================
   右侧：工作区（页签 + 底部指标条）
   ============================================================ */
/* 工作区页签内容包在 ReLoader 里：让加载容器接管页签面板的整块高度，
   否则 TerminalView / HostFileManager 这类 height:100% 的子组件会失去基准高度。
   遮罩只盖内容区（:fullscreen="false"），切页签时内容不重建、会话不受影响。 */
.tab-loader {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.tab-loader :deep(.re-loader__content) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

/* Suspense 挂起时的占位：分包还没到时模板里只有它，
   需要它自己撑满面板 —— ReLoader 的遮罩是 absolute inset:0，
   容器没有高度时动画就无处可落，看起来仍旧是白屏。 */
.tab-suspense-fallback {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  background: var(--el-bg-color);
}

.tab-loader :deep(.re-loader__mask) {
  /* 只是「正在切换」的视觉提示，不能把页签内容的点击吃掉 */
  pointer-events: none;
}

.as-work {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

/* 底部一行：指标条 + Dock 开关，flex-wrap: nowrap 兜底，不能再撑成两行。
   分隔线画在这一层，不画在指标条上：指标条的宽度跟内容走，线会跟着内容的长度断在半路
   （窄屏被裁掉、宽屏只画到指标条末尾），挪到这里才始终横贯整个工作区。
   container-type 供指标条内部的 @container 查询：按底部条自身的可用宽度决定显示哪几项。 */
.as-work__bottom {
  display: flex;
  flex: none;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
  padding-right: 6px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  container-type: inline-size;
}

/* Dock 开关：守在底部行的右侧，箭头直接切换右侧快捷操作面板（展开 / 销毁） */
.as-work__foot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0;
  flex: none;
}
.as-work__dock-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
/* 面板展开时箭头用主色，和「已打开」状态对齐；收起后回到常规色，提示这里还能再打开 */
.as-work__dock-toggle.is-open {
  color: var(--el-color-primary);
}
.as-work__dock-toggle:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

/* 工作区空态：告诉用户「入口在右键」，而不是干放一句「暂无数据」 */
.work-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 420px;
  padding: 24px;
  color: var(--el-text-color-placeholder);
}

.work-empty__title {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.work-empty__desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  text-align: center;
}

.work-empty__desc strong {
  color: var(--el-color-primary);
}

.work-empty__quick {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.as-error {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--status-error-text);
  background: var(--status-error-bg);
  border: 1px solid var(--status-error-border);
  border-radius: var(--radius-sm);
}

/* 宽度完全交给拖拽偏好（上限已在手柄里按窗口宽算过），不再按断点写死 */

@media (max-width: 860px) {
  /* 窄屏改为上下堆叠：左栏变成一条横向可滚动的主机带 */
  .as-body {
    flex-direction: column;
  }

  .as-rail {
    width: auto;
    max-height: 240px;
  }

  /* 上下堆叠时没有左右分栏，手柄一并收起 */
  .as-split {
    display: none;
  }
}
</style>

<style lang="scss">
/* ---- 系统设置在弹窗：主机右键菜单的弹窗被 Teleport 到 body，只能放全局块 ---- */
.ss-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ss-group {
  background: var(--el-fill-color-lighter, #fafbfc);
  border: 1px solid var(--el-border-color-lighter, #e6e8eb);
  border-radius: var(--el-radius-base, 8px);
  padding: 10px 14px 12px;
}
.ss-group__title {
  max-width: 100%;
  margin: 0 0 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--el-text-color-placeholder, #a8abb2);
  letter-spacing: 0.4px;
}
.ss-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}
.ss-row + .ss-row {
  border-top: 1px dashed var(--el-border-color-extra-light, #f0f2f5);
}
.ss-row__label {
  min-width: 128px;
  font-size: 13px;
  color: var(--el-text-color-regular, #4b5563);
  padding-top: 1px;
}
.ss-row__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.host-ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2990;
  background: transparent;
}
.host-ctx-menu {
  position: fixed;
  z-index: 2991;
  /* 宽度按内容收缩但必须封顶：position: fixed 的元素是 shrink-to-fit，
     长主机名（尤其 ibssh_xxx@ssh.instabox.sh 这类地址）会把整张菜单撑宽。
     显式 width: max-content + max-width 后，头部与菜单项的省略号才能真正生效。 */
  width: max-content;
  min-width: 176px;
  max-width: min(260px, calc(100vw - 24px));
  padding: 5px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter, #e6e8eb);
  border-radius: var(--el-border-radius-base, 8px);
  box-shadow: var(--el-box-shadow-light, 0 8px 24px rgba(15, 23, 42, 0.12));
}
.host-ctx-item {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 32px;
  padding: 0 9px;
  font-size: 13px;
  color: var(--el-text-color-regular, #4b5563);
  border-radius: var(--el-border-radius-small, 6px);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s ease, color 0.12s ease;
}
/* 菜单宽度封顶后，文案超出时按省略号收口；图标不参与收缩 */
.host-ctx-item > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.host-ctx-item .re-icon,
.host-ctx-item svg {
  font-size: 15px;
  flex-shrink: 0;
}
.host-ctx-item:hover {
  background: var(--el-fill-color-light, #f3f4f6);
  color: var(--el-color-primary, #409eff);
}
.host-ctx-item.is-danger {
  color: var(--el-color-danger, #f56c6c);
}
.host-ctx-item.is-danger:hover {
  background: var(--el-color-danger-light-9, #fef0f0);
  color: var(--el-color-danger, #f56c6c);
}
/* 带二级菜单的条目：右侧一个箭头，hover 展开 */
.host-ctx-item.has-sub {
  position: relative;
}
/* 二级菜单对应的一级菜单图标：hover 时保持默认色，不随整行变主题蓝。
   图标是分组入口的「静态记号」，子菜单展开已足够提示可交互，变色反而分神。 */
.host-ctx-item.has-sub:hover .re-icon,
.host-ctx-item.has-sub:hover svg,
.host-ctx-item.has-sub.is-open .re-icon,
.host-ctx-item.has-sub.is-open svg {
  color: var(--el-text-color-regular, #4b5563);
}
.host-ctx-item.has-sub .host-ctx-arrow {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.host-ctx-item.has-sub.is-open {
  color: var(--el-color-primary, #409eff);
  background: var(--el-fill-color-light, #f3f4f6);
}
/* 二级菜单对应的一级菜单箭头：无论 hover / 展开都保持原样。
   箭头只是「有子菜单」的静态记号，旋转与变色都是多余动效。 */
/* hover 弹出浮层：子菜单固定在分组项右侧（经典右键交互），与内嵌缩进不同 */
.host-ctx-sub {
  position: absolute;
  left: calc(100% + 2px);
  top: -6px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  min-width: 178px;
  padding: 5px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter, #e6e8eb);
  border-radius: var(--el-border-radius-base, 8px);
  box-shadow: var(--el-box-shadow-light, 0 8px 24px rgba(15, 23, 42, 0.16));
}
.host-ctx-sub .host-ctx-item {
  height: 31px;
  font-size: 12.5px;
}
.host-ctx-sub .host-ctx-item .re-icon,
.host-ctx-sub .host-ctx-item svg {
  font-size: 13.5px;
}
/* 二级菜单的上下/左右不再按分组硬编码：
   位置由 fitCtxSub() 在展开后按真实 rect 回填（left/top 内联值），
   这里只留兜底上限，超高时菜单内部滚动而不是撑出视口。 */
.host-ctx-sub {
  max-height: calc(100vh - 16px);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.host-ctx-sep {
  height: 1px;
  margin: 5px 7px;
  background: var(--el-border-color-lighter, #eceef1);
}
/* 菜单头：被右键的那台主机是谁。菜单项有十几条，没有头部时用户
   很容易在「编辑」和「删除」之间忘了自己在操作哪台机器。
   主机名可能很长：截断到菜单宽度，title 提示保持完整文本。 */
.host-ctx-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px 8px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--el-border-color-lighter, #eceef1);
}
.host-ctx-head b {
  font-size: 13px;
  color: var(--el-text-color-primary, #1f2430);
  /* 不要撑鼓菜单的宽度：限制可用宽度 + 截断 + title 提示（右键菜单里的 tip） */
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.host-ctx-head span {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
/* 分组标题：把十几条菜单项切成「打开 / 画像分区 / 运维 / 主机」四段 */
.host-ctx-label {
  padding: 6px 9px 3px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-placeholder, #a8abb2);
  text-transform: uppercase;
}
/* 菜单项数量有限（顶层十几条），右键定位已做视口翻转；
   overflow 必须可见，否则 hover 浮层子菜单会被菜单容器裁掉 */
.host-ctx-menu {
  max-height: calc(100vh - 24px);
  /* 菜单整体限宽：主机名太长时不再被撑开（见上方 .host-ctx-head b 的截断） */
  max-width: min(260px, calc(100vw - 24px));
  overflow: visible;
}
</style>
