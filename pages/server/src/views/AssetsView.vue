<script setup lang="ts">
/**
 * 主机资产 v2 —— 对齐 prototype.html §4.2
 * KPI + FilterBar + 表格 + 完整 CRUD（新增/编辑/删除/启停/批量）+ 行内「连接」直达远控
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onBeforeUnmount, ref, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { queryHosts, delHost, switchHost, getGroups, getIdentities, listBoundIdentities, bindIdentity, unbindIdentity, scanPorts, installNginxHost } from "../api";
import HostFormDialog from "./HostFormDialog.vue";
import HostConfigDialog from "./HostConfigDialog.vue";
import HostProfileView from "./HostProfileView.vue";
import HostDetailView from "./HostDetailView.vue";
import TerminalView from "./TerminalView.vue";
import HostFileManager from "../components/HostFileManager.vue";
import ScHostMetricsBar from "../components/ScHostMetricsBar.vue";
import type { MetricRow } from "../components/ScHostMetricsBar.types";
import ScInstallDialog from "../components/ScInstallDialog.vue";
import { useDialogPrerender } from "../utils/dialogPrerender";
import { osIconSvg } from "../utils/osIcon";
import {useSocketService, message} from "@repo/core";
import AgentDeployDialog from "../components/AgentDeployDialog.vue";
import { submitAgentAction } from "../api";
import ReTabs from "@repo/ui/re-tabs";
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
/** 分组筛选：null 表示全部 */
const groupFilter = ref<number | null>(null);
/** 已折叠的分组 id 集合（含 0 表示「未分组」） */
const collapsedGroups = ref<Set<number>>(new Set());

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

/** 弹窗内 ReSelect 选项（computed 缓存，避免每次渲染重算） */
const identityOptions = computed(() => identities.value.map(i => ({
  label: `${i.msServerIdentityName}（${i.msServerIdentityUsername}）${i.msServerIdentityAuthType === "PUBLIC_KEY" ? "私钥" : "密码"}`,
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
/** 分组背景色开关：开启时分组标记按分组配置颜色显示底色 */
const groupColorEnabled = ref(true);

// ---- 实时指标（socket 推送，不轮询；底部状态条与页签状态点共用这份数据） ----
const realtimeEnabled = ref(localStorage.getItem('assets-realtime-enabled') !== 'false');
const rtMetrics = reactive<Record<number, { cpu: number; mem: number; disk: number; tx: string; rx: string }>>({});

/**
 * 实时监控开关。
 *
 * <p>关掉时清空缓存而不是留着最后一份：留着会让底部状态条停在一个不再更新的
 * 数字上，看起来像「还在采」，实际是「已经停了」。</p>
 *
 * @param v 是否开启
 */
function onRealtimeToggle(v: boolean): void {
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
    rtMetrics[h.id] = {
      cpu,
      mem: Math.round((Number(h.serverHostMemUsage) || 0) * 10) / 10,
      disk: Math.round((Number(h.serverHostDiskUsage) || 0) * 10) / 10,
      tx: prev?.tx ?? '—',
      rx: prev?.rx ?? '—',
    };
  }
}
/** 取分组颜色（未配置或关闭开关时返回空，不使用背景色） */
function groupColor(id?: number | null): string {
  if (!groupColorEnabled.value || !id) return "";
  return groups.value.find(g => g.id === id)?.msServerGroupColor ?? "";
}
/** 分组标签背景样式：按颜色值生成带透明度的底色与匹配文字色 */
function groupColorStyle(id?: number | null): Record<string, string> {
  const c = groupColor(id);
  if (!c) return {};
  // 解析 #RRGGBB
  const hex = c.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return {};
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // 亮度感知文字色（深底浅字 / 浅底深字）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const text = luminance > 0.6 ? "#3a3f4b" : "#ffffff";
  return {
    backgroundColor: `${c}26`, // 15% 透明底
    color: text,
    borderColor: `${c}55`,
  };
}

/**
 * 生效远控协议：主机配置优先，未配置时按平台推断
 * @param h 主机
 */
function protocolOf(h: Host): string {
  const p = (h.serverHostRemoteProtocol ?? "").toUpperCase();
  if (p === "SSH" || p === "RDP" || p === "VNC") return p.toLowerCase();
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
  return p === "rdp" ? 3389 : 5900;
}
/**
 * 在线状态：online/offline/unknown
 * @param h 主机
 */
function onlineState(h: Host): "online" | "offline" | "unknown" {
  const v = h.serverHostOnline;
  if (v === 1) return "online";
  if (v === 0) return "offline";
  return "unknown";
}
/**
 * 在线状态文案
 * @param h 主机
 */
function onlineText(h: Host): string {
  const v = h.serverHostOnline;
  return v === 1 ? "在线" : v === 0 ? "离线" : "未知";
}

const onlineCount = computed(() => hosts.value.filter(h => liveOnlineState(h) === 1).length);
const remoteCount = computed(() => hosts.value.filter(h => h.serverHostRemoteEnabled === 1).length);
const offlineCount = computed(() => hosts.value.length - onlineCount.value);

/** 左侧主机区筛选结果（关键字 + 状态 + 分组） */
const filtered = computed(() => {
  let list = hosts.value;
  if (statusFilter.value === "online") list = list.filter(h => liveOnlineState(h) === 1);
  else if (statusFilter.value === "offline") list = list.filter(h => liveOnlineState(h) !== 1);
  else if (statusFilter.value === "remote") list = list.filter(h => h.serverHostRemoteEnabled === 1);
  if (groupFilter.value != null) {
    const gid = String(groupFilter.value);
    list = list.filter(h => String(h.msServerGroupId ?? "0") === gid);
  }
  const kw = keyword.value.trim().toLowerCase();
  if (kw) {
    list = list.filter(h =>
      (h.serverHostName ?? "").toLowerCase().includes(kw)
      || (h.serverHostAddress ?? "").toLowerCase().includes(kw)
      || splitTags(h.serverHostTags).some(t => t.toLowerCase().includes(kw)));
  }
  return list;
});

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
  try {
    const [h, g, i] = await Promise.all([queryHosts(), getGroups(), getIdentities()]);
    if (seq !== fetchSeq) return; // 已被更新的一次 fetch 取代，丢弃过期结果，避免旧数据覆盖新数据
    hosts.value = Array.isArray(h) ? h.sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0)) : [];
    groups.value = g ?? [];
    identities.value = i ?? [];
    syncRtFromHosts();
  } catch (e) {
    if (seq === fetchSeq) loadError.value = String((e as Error)?.message ?? e);
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
  | "network"
  | "env"
  | "firewall"
  | "remote"
  | "files"
  | "metrics";

/** 功能定义：名称 / 图标 / 是否为画像分区 */
interface TabKindMeta {
  label: string;
  icon: string;
  /** 画像分区 key（非画像功能为空） */
  section?: string;
  /** 需要 Agent / 采集通道 */
  needChannel?: boolean;
}

const TAB_KINDS: Record<TabKind, TabKindMeta> = {
  ports: { label: "监听端口", icon: "Connection", section: "ports", needChannel: true },
  processes: { label: "进程", icon: "Cpu", section: "processes", needChannel: true },
  services: { label: "服务", icon: "SetUp", section: "services", needChannel: true },
  disks: { label: "磁盘", icon: "Coin", section: "disks", needChannel: true },
  network: { label: "网络", icon: "Share", section: "network", needChannel: true },
  env: { label: "环境变量", icon: "Document", section: "env", needChannel: true },
  firewall: { label: "防火墙", icon: "Lock", section: "firewall", needChannel: true },
  remote: { label: "远控", icon: "Position" },
  files: { label: "文件管理", icon: "FolderOpened" },
  metrics: { label: "指标监控", icon: "TrendCharts" },
};

/** 工作区页签（比 ReTabsItem 多带主机上下文，便于渲染内容） */
interface WorkTab extends ReTabsItem {
  hostId: number;
  kind: TabKind;
  /** 文件管理页签的初始路径 */
  path?: string;
  /** 远控页签使用的登录身份（空 = 默认凭据） */
  identityId?: number | null;
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
 * @param host 目标主机
 * @param kind 功能类型
 * @param opts 附加参数（文件管理初始路径 / 远控登录身份）
 */
function openTab(host: Host, kind: TabKind, opts?: { path?: string; identityId?: number | null }): void {
  const name = `${host.id}:${kind}`;
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
    hint: meta.label,
    icon: meta.icon,
    status: liveOnlineState(host) === 1 ? "online" : "offline",
    closable: true,
    path: opts?.path,
    identityId: opts?.identityId ?? null,
  };
  openTabs.value = [...openTabs.value, tab];
  activeTab.value = name;
}

/**
 * 关闭页签：若关的是当前页签，自动切到相邻的一个（右优先，其次左）。
 *
 * @param name 页签 name
 */
function closeTab(name: string): void {
  const idx = openTabs.value.findIndex(t => t.name === name);
  if (idx < 0) return;
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

/** 页签右键命令分发 */function onTabCommand(payload: { key: string; tab: ReTabsItem }): void {
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

/** 菜单估算尺寸，用于贴边翻转 */
const CTX_MENU_W = 214;
const CTX_MENU_H = 470;

/**
 * 打开主机右键菜单。
 *
 * @param event 原生右键事件
 * @param h 目标主机
 */
function openCtxMenu(event: MouseEvent, h: Host): void {
  event.preventDefault();
  event.stopPropagation();
  let x = event.clientX;
  let y = event.clientY;
  if (x + CTX_MENU_W > window.innerWidth - 8) x = window.innerWidth - CTX_MENU_W - 8;
  if (y + CTX_MENU_H > window.innerHeight - 8) y = window.innerHeight - CTX_MENU_H - 8;
  ctxMenu.host = h;
  ctxMenu.x = Math.max(8, x);
  ctxMenu.y = Math.max(8, y);
  ctxMenu.visible = true;
}

/** 关闭右键菜单 */
function closeCtxMenu(): void {
  ctxMenu.visible = false;
  ctxMenu.host = null;
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
    "tab-network": "network",
    "tab-env": "env",
    "tab-firewall": "firewall",
  };
  const kind = tabCmds[cmd];
  if (kind) {
    openTab(h, kind);
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
    case "install-nginx":
      onOpenInstall(h);
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
      // 一次把画像七个分区全开出来：巡检某台机器时的批量动作
      (["ports", "processes", "services", "disks", "network", "env", "firewall"] as TabKind[])
        .forEach(k => openTab(h, k));
      break;
    }
    case "close-host-tabs":
      openTabs.value = openTabs.value.filter(t => t.hostId !== h.id);
      if (!openTabs.value.some(t => t.name === activeTab.value)) {
        activeTab.value = openTabs.value[openTabs.value.length - 1]?.name ?? "";
      }
      break;
    default:
      break;
  }
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

/** 软件安装（nginx）对话框状态 */
const installVisible = ref(false);
const installHost = ref<Host | null>(null);

/** 打开软件安装对话框 */
function onOpenInstall(h: Host): void {
  installHost.value = h;
  installVisible.value = true;
}

/** 安装完成回调：刷新主机列表 */
function onInstalled(): void {
  fetchAll();
}

/**
 * 重置左侧检索与筛选条件。
 *
 * <p>只在「筛得只剩空列表」时才有意义：此时给用户一个一键回到全量的出口，
 * 而不是让他自己去猜是关键字、状态还是分组把结果筛没了。</p>
 */
function resetFilters(): void {
  keyword.value = "";
  statusFilter.value = "all";
  groupFilter.value = null;
  collapsedGroups.value = new Set();
}

function openAdd(): void {
  formIsEdit.value = false;
  editHost.value = null;
  formVisible.value = true;
}
function openEdit(h: Host): void {
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
  if (!h) return { cpu: 0, mem: 0, disk: 0, has: false };
  const live = rtMetrics[h.id];
  if (live) {
    return { cpu: live.cpu ?? 0, mem: live.mem ?? 0, disk: live.disk ?? 0, has: true };
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
  };
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
    { label: "内存", value: h.serverHostMemoryMb ? `${(h.serverHostMemoryMb / 1024).toFixed(1)} GB` : "—" },
    { label: "磁盘", value: h.serverHostDiskGb ? `${h.serverHostDiskGb} GB` : "—" },
    { label: "地址", value: dash(`${h.serverHostAddress}:${h.serverHostPort}`), mono: true },
    { label: "内网 IP", value: dash(h.serverHostPrivateIp), mono: true },
    { label: "公网 IP", value: dash(h.serverHostPublicIp), mono: true },
    { label: "协议", value: protocolOf(h).toUpperCase() },
    { label: "采集方式", value: collectModeLabel(h.serverHostCollectMode) },
    { label: "分组", value: groupName(h.msServerGroupId) },
    { label: "标签", value: dash(splitTags(h.serverHostTags).join(" / ")) },
    { label: "最近采集", value: dash(h.serverHostLastCollectTime) },
    { label: "已扫描端口", value: parsePorts(h.serverHostPorts).length ? `${parsePorts(h.serverHostPorts).length} 个` : "未扫描" },
    { label: "Agent", value: h.serverHostAgentInstalled === 1 ? `v${h.serverHostAgentVersion || "?"}` : "未安装" },
  ];
  if (h.serverHostDescription) {
    rows.push({ label: "备注", value: h.serverHostDescription });
  }
  return rows;
});

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
 * @param h 主机
 */
function selectHost(h: Host): void {
  selectedHost.value = h;
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
  fetchAll();
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
      const d = (msg.data ?? msg) as { hostId?: number; cpu?: number; mem?: number; disk?: number };
      if (!realtimeEnabled.value) return;
      if (d && d.hostId != null) {
        rtMetrics[d.hostId] = {
          cpu: Math.round((Number(d.cpu) || 0) * 10) / 10,
          mem: Math.round((Number(d.mem) || 0) * 10) / 10,
          disk: Math.round((Number(d.disk) || 0) * 10) / 10,
          tx: '—', rx: '—'
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
</script>

<template>
  <div class="as">
    <div v-if="loadError" class="as-error">
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary" :show-text="true" @click="fetchAll">重试</ReButton>
    </div>

    <div class="as-body">
    <!-- ==================== 左侧：主机资源栏 ==================== -->    <aside class="as-rail">
      <div class="rail-head">
        <div class="rail-head__row">
          <span class="rail-head__title">主机资产</span>
          <span class="rail-head__count">{{ filtered.length }}<i>/{{ hosts.length }}</i></span>
          <span class="rail-head__gap" />
          <ReButton icon="RefreshRight" layout="square" tip="刷新列表" :loading="loading" @click="fetchAll" />
          <ReButton icon="Plus" layout="square" type="primary" tip="新增主机" @click="openAdd" />
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
      </div>

      <ReScrollbar class="rail-list">
        <div v-for="g in groupedHosts" :key="g.id" class="rail-group">
          <button type="button" class="rail-group__head" @click="toggleGroup(g.id)">
            <ReIcon :name="collapsedGroups.has(g.id) ? 'ArrowRight' : 'ArrowDown'" :size="11" />
            <span class="rail-group__dot" :style="groupColorStyle(g.id)" />
            <span class="rail-group__name">{{ g.name }}</span>
            <span class="rail-group__stat"><b>{{ g.online }}</b>/{{ g.hosts.length }}</span>
          </button>
          <template v-if="!collapsedGroups.has(g.id)">
            <div
              v-for="h in g.hosts"
              :key="h.id"
              class="rail-host"
              :class="{ 'is-active': statusHost?.id === h.id, 'is-off': liveOnlineState(h) !== 1 }"
              @click="selectHost(h)"
              @dblclick="openTab(h, 'metrics')"
              @contextmenu="openCtxMenu($event, h)"
            >
              <span class="rail-host__os" :class="osTileClass(h)">
                <span v-html="osIconSvg(h.serverHostOsType)"></span>
              </span>
              <span class="rail-host__meta">
                <b class="rail-host__name">{{ h.serverHostName }}</b>
                <span class="rail-host__addr mono">{{ h.serverHostAddress }}</span>
              </span>
              <span class="rail-host__right">
                <span class="rail-host__delay mono" :class="{ bad: delayBad(liveDelayMs(h)) }">{{ delayText(liveDelayMs(h)) }}</span>
                <i class="rail-host__dot" :class="liveOnlineState(h) === 1 ? 'is-on' : 'is-off'" />
              </span>
            </div>
          </template>
        </div>

        <div v-if="!filtered.length" class="rail-empty">
          <ReIcon name="Files" :size="22" />
          <span>{{ emptyDescription }}</span>
          <ReButton v-if="loadError" icon="RefreshRight" type="primary" :show-text="true" @click="fetchAll">重试</ReButton>
          <ReButton v-else-if="hasHosts" icon="Refresh" :show-text="true" @click="resetFilters">重置筛选</ReButton>
          <ReButton v-else type="primary" icon="Plus" :show-text="true" @click="openAdd">新增主机</ReButton>
        </div>
      </ReScrollbar>

      <div class="rail-foot">
        <span class="rail-foot__hint"><ReIcon name="Mouse" :size="11" />右键主机打开功能</span>
        <span class="rail-foot__sum">
          <i class="is-on" />{{ onlineCount }}
          <i class="is-off" />{{ offlineCount }}
        </span>
      </div>
    </aside>

    <!-- ==================== 右侧：多标签工作区 ==================== -->
    <section class="as-work">
      <ReTabs
        v-model="activeTab"
        :tabs="openTabs"
        closable
        show-close-all
        :context-menu="tabContextMenu"
        empty-text="右键左侧主机，选择要打开的功能"
        @close="closeTab"
        @close-all="closeAllTabs"
        @context-command="onTabCommand"
      >
        <template #default="{ tab }">
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
        </template>

        <template #empty>
          <div class="work-empty">
            <ReIcon name="Monitor" :size="30" />
            <b class="work-empty__title">还没有打开任何功能</b>
            <p class="work-empty__desc">
              在左侧主机上点<strong>右键</strong>，选择「远控 / 文件管理 / 指标监控 / 端口 / 进程 …」，
              每个功能都会在这里打开一个独立页签，可以同时开多个互不干扰。
            </p>
            <div v-if="selectedHost" class="work-empty__quick">
              <ReButton icon="Position" :show-text="true" @click="openTab(selectedHost, 'remote')">远控 {{ selectedHost.serverHostName }}</ReButton>
              <ReButton icon="TrendCharts" :show-text="true" @click="openTab(selectedHost, 'metrics')">指标监控</ReButton>
            </div>
          </div>
        </template>
      </ReTabs>

      <!-- 底部常驻条：CPU / 内存 / 磁盘 + 主机概要（hover 浮层） -->
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
        :has-metrics="statusMetrics.has"
        :rows="statusOverviewRows"
      />
    </section>
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
          <ReButton icon="Key" :show-text="true" plain title="统一在左侧「账号管理」维护" @click="router.push('/account')">账号管理</ReButton>
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

    <!-- 协议服务器管理弹窗已移除 -->

    <HostConfigDialog v-model="configVisible" :host="configHost" :mode="configMode" @saved="fetchAll" />

    <!-- 远控配置已并入主机编辑弹窗（HostFormDialog 的「远控配置」区块） -->
  </div>
    <!-- Agent 自动部署进度弹窗（socket 实时推送，支持最小化和断点续传） -->
    <AgentDeployDialog
      v-model="deployDialogVisible"
      v-model:minimized="deployMinimized"
      :task="deployTask"
      :logs="deployLogs.map(l => ({ time: new Date().toLocaleTimeString(), msg: l }))"
    />

    <!-- 软件安装（nginx）对话框 -->
    <ScInstallDialog v-model="installVisible" :host="installHost" :hosts="hosts" @installed="onInstalled" />

    <!-- 主机右键菜单：左侧主机列表的唯一功能总入口 -->
    <Teleport to="body">
      <div v-if="ctxMenu.visible" class="host-ctx-backdrop" @mousedown="closeCtxMenu" @contextmenu.prevent="closeCtxMenu" />
      <div
        v-if="ctxMenu.visible && ctxMenu.host"
        class="host-ctx-menu"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        role="menu"
        @contextmenu.prevent
      >
        <div class="host-ctx-head">
          <b>{{ ctxMenu.host.serverHostName }}</b>
          <span class="mono">{{ ctxMenu.host.serverHostAddress }}</span>
        </div>

        <div class="host-ctx-item" @click="ctxCommand('tab-remote')">
          <ReIcon name="Position" /><span>远程控制</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('tab-files')">
          <ReIcon name="FolderOpened" /><span>文件管理</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('tab-metrics')">
          <ReIcon name="TrendCharts" /><span>指标监控</span>
        </div>

        <div class="host-ctx-sep" />
        <div class="host-ctx-label">主机画像</div>
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
        <div class="host-ctx-item" @click="ctxCommand('tab-network')">
          <ReIcon name="Share" /><span>网络</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('tab-env')">
          <ReIcon name="Document" /><span>环境变量</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('tab-firewall')">
          <ReIcon name="Lock" /><span>防火墙</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('open-all-profile')">
          <ReIcon name="Grid" /><span>展开全部画像分区</span>
        </div>

        <div class="host-ctx-sep" />
        <div class="host-ctx-item" @click="ctxCommand('scan')">
          <ReIcon name="Aim" /><span>端口扫描</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('install-nginx')">
          <ReIcon name="Box" /><span>安装 Nginx</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('toggle-remote')">
          <ReIcon name="SwitchButton" />
          <span>{{ ctxMenu.host.serverHostRemoteEnabled === 1 ? '停用远控入口' : '启用远控入口' }}</span>
        </div>

        <template v-if="isAgentMode(ctxMenu.host)">
          <div class="host-ctx-sep" />
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
        </template>

        <div class="host-ctx-sep" />
        <div class="host-ctx-item" @click="ctxCommand('edit')">
          <ReIcon name="EditPen" /><span>编辑主机</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('close-host-tabs')">
          <ReIcon name="CircleClose" /><span>关闭该主机全部页签</span>
        </div>
        <div class="host-ctx-item is-danger" @click="ctxCommand('delete')">
          <ReIcon name="Delete" /><span>删除主机</span>
        </div>
      </div>
    </Teleport>
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

/* 左右两栏：左侧定宽，右侧吃掉剩余 */
.as-body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
}

/* ============================================================
   左侧：主机资源栏
   ============================================================ */
.as-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 268px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
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
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.rail-head__count {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
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
  gap: 4px;
  padding: 3px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}

.rail-chip {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 26px;
  padding: 0 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  transition: background 0.15s ease, color 0.15s ease;
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

.rail-host.is-off .rail-host__name {
  color: var(--el-text-color-secondary);
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

/* 左栏底部：提示 + 在线/离线小结 */
.rail-foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  border-top: 1px solid var(--el-border-color-lighter);
}

.rail-foot__hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rail-foot__sum {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
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
   右侧：工作区（页签 + 底部指标条）
   ============================================================ */
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

@media (max-width: 1100px) {
  .as-rail {
    width: 232px;
  }
}

@media (max-width: 860px) {
  /* 窄屏改为上下堆叠：左栏变成一条横向可滚动的主机带 */
  .as-body {
    flex-direction: column;
  }

  .as-rail {
    width: auto;
    max-height: 240px;
  }
}
</style>

<style lang="scss">
/* 主机右键菜单：Teleport 到 body，scoped 样式作用不到，只能放全局块 */
.ps-dot {
  width: 8px; height: 8px; border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.4);
}
.ps-open { color: var(--el-color-success, #67c23a); }
.ps-open .ps-dot { background: var(--el-color-success, #67c23a); box-shadow: 0 0 0 1.5px rgba(103, 194, 58, 0.45); }
.ps-closed { color: var(--el-color-danger, #f56c6c); }
.ps-closed .ps-dot { background: var(--el-color-danger, #f56c6c); box-shadow: 0 0 0 1.5px rgba(245, 108, 108, 0.45); }

/* 主机右键上下文菜单（teleport 到 body） */
.host-ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2990;
  background: transparent;
}
.host-ctx-menu {
  position: fixed;
  z-index: 2991;
  min-width: 176px;
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
.host-ctx-sep {
  height: 1px;
  margin: 5px 7px;
  background: var(--el-border-color-lighter, #eceef1);
}
/* 菜单头：被右键的那台主机是谁。菜单项有十几条，没有头部时用户
   很容易在「编辑」和「删除」之间忘了自己在操作哪台机器。 */
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
}
.host-ctx-head span {
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
/* 菜单可能比视口还高（小屏笔记本），超出时可滚 */
.host-ctx-menu {
  max-height: calc(100vh - 24px);
  overflow-y: auto;
}
</style>
