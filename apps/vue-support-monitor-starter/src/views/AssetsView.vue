<script setup lang="ts">
/**
 * 主机资产 v2 —— 对齐 prototype.html §4.2
 * KPI + FilterBar + 表格 + 完整 CRUD（新增/编辑/删除/启停/批量）+ 行内「连接」直达远控
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onBeforeUnmount, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElProgress, ElDropdown, ElDropdownMenu, ElDropdownItem, ElPopover } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import type { ReFilterItem } from "@repo/ui/components/ReFilter/types";
import { queryHosts, delHost, switchHost, getGroups, getIdentities, listBoundIdentities, bindIdentity, unbindIdentity, scanPorts } from "@pages/server/src/api";
import HostFormDialog from "./HostFormDialog.vue";
import HostConfigDialog from "./HostConfigDialog.vue";
import HostProfileDialog from "./HostProfileDialog.vue";
import { useDialogPrerender } from "../utils/dialogPrerender";
import { osIconSvg } from "../utils/osIcon";
import { useSocketService } from "@repo/core";
import ReMaskDialog from "../components/ReMaskDialog.vue";
import AgentDeployDialog from "../components/AgentDeployDialog.vue";
import ReProgressTask from "@repo/ui/components/ReProgress/ReProgressTask.vue";
import { submitAgentAction } from "../monitorApi";
import type { Component } from "vue";
import { CircleCheck, DocumentChecked, Download, Tickets } from "@element-plus/icons-vue";
import ReStatCard from "@repo/ui/re-stat-card";

export interface Host {
  id: number;
  serverHostName: string;
  serverHostCode?: string | null;
  serverHostAddress: string;
  serverHostPort: number;
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
const selection = ref<Host[]>([]);
/** 实时延迟（hostId → delayMs，socket host-delay 推送更新；-1 表不可达） */
const liveDelay = ref<Record<number, number>>({});
/** 实时在线状态（hostId → 1/0，socket host-online 推送翻转） */
const liveOnline = ref<Record<number, number>>({});
let unsubDelay: (() => void) | undefined;
let unsubOnline: (() => void) | undefined;
let unsubMetrics: (() => void) | undefined;
let unsubDeploy: (() => void) | undefined;
let unsubPortScan: (() => void) | undefined;

/** 视图模式：card（默认，卡片网格）/ table（表格） */
const viewMode = ref<"card" | "table">("card");

/** ReFilter 过滤状态（由 ReFilter 组件统一驱动，替代手写 keyword/status/group 三个 ref） */
const filterState = ref<Record<string, unknown>>({ keyword: "", status: "", group: "", tag: "" });
/**
 * ReFilter 过滤项变更
 * @param prop 过滤属性名
 * @param value 过滤值
 */
/**
 * ReFilter 过滤项变更
 * @param prop 过滤属性名
 * @param value 过滤值
 */
function onFilterChange(prop: string, value: unknown): void {
  filterState.value[prop] = value;
}
/**
 * 重置全部过滤条件
 */
function onFilterReset(): void {
  filterState.value = { keyword: "", status: "", group: "", tag: "" };
}

/** ReFilter 筛选项配置（"标签"项仅在存在标签数据时显示，避免空的筛选项） */
const filterItems = computed<ReFilterItem[]>(() => {
  const items: ReFilterItem[] = [
    { prop: "keyword", label: "名称/IP", type: "input", placeholder: "搜索名称 / IP", clearable: true, always: true },
    { prop: "status", label: "状态", type: "select", placeholder: "状态", clearable: true, options: [
      { label: "在线", value: "online" },
      { label: "离线", value: "offline" },
      { label: "远控启用", value: "remote" },
    ], always: true },
    { prop: "group", label: "分组", type: "select", placeholder: "分组", clearable: true, options: groups.value.map(g => ({ label: g.msServerGroupName, value: g.id })), always: true },
  ];
  if (allTags.value.length > 0) {
    items.push({ prop: "tag", label: "标签", type: "slot", always: false });
  }
  return items;
});

/** 弹窗内 ReSelect 选项（computed 缓存，避免每次渲染重算） */
const identityOptions = computed(() => identities.value.map(i => ({
  label: `${i.msServerIdentityName}（${i.msServerIdentityUsername}）${i.msServerIdentityAuthType === "PUBLIC_KEY" ? "私钥" : "密码"}`,
  value: i.id,
})));
const groupOptions = computed(() => groups.value.map(g => ({ label: g.msServerGroupName, value: g.id })));

/** 标签集合（用于筛选/展示） */
const allTags = computed(() => {
  const s = new Set<string>();
  for (const h of hosts.value) {
    for (const t of splitTags(h.serverHostTags)) s.add(t);
  }
  return [...s];
});

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
interface PortItem { port: string; protocol?: string; service?: string; }

/** 解析端口扫描 JSON */
function parsePorts(raw?: string | null): PortItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/** 端口文案：22/tcp ssh */
function portText(p: PortItem): string {
  const parts = [`${p.port}${p.protocol ? "/" + p.protocol : ""}`];
  if (p.service) parts.push(p.service);
  return parts.join(" ");
}

/** 端口扫描（后台异步，完成后由 host-portscan socket 事件回填，不阻塞/轮询） */
async function scanHostPorts(h: Host): Promise<void> {
  try {
    const r: any = await scanPorts(h.id);
    ElMessage.success(r?.msg || `端口扫描已开始，完成后自动更新 ${h.serverHostAddress}`);
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
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

// ---- 实时指标（默认开启，socket 推送，不轮询） ----
const realtimeEnabled = ref(localStorage.getItem('assets-realtime-enabled') !== 'false');
const rtMetrics = reactive<Record<number, { cpu: number; mem: number; disk: number; tx: string; rx: string }>>({});

function barColor(pct: number): string {
  if (pct >= 90) return 'var(--el-color-danger)';
  if (pct >= 70) return 'var(--el-color-warning)';
  return 'var(--el-color-success)';
}

function onRealtimeToggle(v: boolean): void {
  localStorage.setItem('assets-realtime-enabled', String(v));
  if (!v) {
    // 关闭即清空，重新打开时由下一次列表刷新或推送铺值
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
    rtMetrics[h.id] = {
      cpu: Math.round((Number(h.serverHostCpuUsage) || 0) * 10) / 10,
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
 * 生效远控端口：主机配置优先，SSH 沿用端口字段，其余按协议默认
 * @param h 主机
 */
function remotePortOf(h: Host): number {
  if (h.serverHostRemotePort && h.serverHostRemotePort > 0) return h.serverHostRemotePort;
  const p = protocolOf(h);
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

const onlineCount = computed(() => hosts.value.filter(h => h.serverHostOnline === 1).length);
const remoteCount = computed(() => hosts.value.filter(h => h.serverHostRemoteEnabled === 1).length);
const offlineCount = computed(() => hosts.value.length - onlineCount.value);

/**
 * 统计卡定义。
 *
 * <p>与「账号管理 / 代理管理」同口径：{@code icon} 必须是组件
 * （ReStatCard 内部走 {@code <component :is="icon" />}），所以引用
 * @element-plus/icons-vue 的组件而不是图标名字符串；{@code iconColor}
 * 用 koi 令牌，不写死品牌色。</p>
 */
interface HostKpi {
  key: string;
  title: string;
  value: number | string;
  desc: string;
  icon: Component;
  iconColor: string;
}

const hostKpis = computed<HostKpi[]>(() => [
  {
    key: "total",
    title: "可远控目标",
    value: hosts.value.length,
    desc: "共注册可远控目标",
    icon: DocumentChecked,
    iconColor: "var(--brand-500, var(--el-color-primary))",
  },
  {
    key: "online",
    title: "可连接资产",
    value: `${onlineCount.value} / ${hosts.value.length}`,
    desc: "当前在线可连接",
    icon: CircleCheck,
    iconColor: "var(--el-color-success)",
  },
  {
    key: "offline",
    title: "需关注处理",
    value: offlineCount.value,
    desc: "离线或采集异常",
    icon: Tickets,
    iconColor: "var(--el-text-color-placeholder)",
  },
  {
    key: "remote",
    title: "支持远程连接",
    value: remoteCount.value,
    desc: "已开启远控协议",
    icon: Download,
    iconColor: "var(--metric-cpu, var(--el-color-primary))",
  },
]);

const filtered = computed(() => {
  const fs = filterState.value;
  let list = hosts.value;
  const status = String(fs.status ?? "");
  if (status === "online") list = list.filter(h => h.serverHostOnline === 1);
  else if (status === "offline") list = list.filter(h => h.serverHostOnline !== 1);
  else if (status === "remote") list = list.filter(h => h.serverHostRemoteEnabled === 1);
  // 仅当分组值是有效分组（非 null/空串/0）时才过滤，避免组件回传脏值把整列清空
  if (fs.group != null && fs.group !== "" && fs.group !== 0) {
    const gid = String(fs.group);
    list = list.filter(h => String(h.msServerGroupId ?? "") === gid);
  }
  // 标签仅在为非空字符串时过滤
  if (typeof fs.tag === "string" && fs.tag) {
    // 先取出到常量，避免闭包内丢失 typeof 收窄
    const tag = fs.tag;
    list = list.filter(h => splitTags(h.serverHostTags).includes(tag));
  }
  const kw = typeof fs.keyword === "string" ? fs.keyword.toLowerCase() : "";
  if (kw) {
    list = list.filter(h => (h.serverHostName ?? "").toLowerCase().includes(kw) || (h.serverHostAddress ?? "").toLowerCase().includes(kw));
  }
  return list;
});

/** ReTable 列定义 */
const tableColumns = computed(() => [
  { prop: "serverHostName", label: "名称", minWidth: 150, slot: "name" },
  { prop: "serverHostAddress", label: "地址", width: 150, slot: "addr" },
  { prop: "msServerGroupId", label: "分组", width: 92, slot: "group" },
  { prop: "serverHostTags", label: "标签", minWidth: 120, slot: "tags" },
  { prop: "serverHostOsType", label: "协议", width: 100, slot: "proto" },
  { prop: "serverHostOnline", label: "状态", width: 84, slot: "status" },
  { prop: "serverHostDelayMs", label: "延迟", width: 84, slot: "delay" },
  { prop: "serverHostCollectMode", label: "采集模式", width: 100, formatter: (_: unknown, __: unknown, v: unknown) => collectModeLabel(String(v ?? "")) },
  { prop: "serverHostPorts", label: "端口", minWidth: 140, slot: "ports" },
  { prop: "serverHostAgentEnabled", label: "Agent", width: 90, slot: "agent" },
  { prop: "id", label: "操作", width: 140, fixed: "right", slot: "actions" },
]);

/** 表格合计统计（筛选后数量顶部展示） */
const batchDeleteToolbar = computed(() => ({
  enabled: true,
  confirmMessage: `确认批量删除选中的 ${selection.value.length} 台主机？`,
  handler: async (rows: Record<string, unknown>[]) => {
    for (const r of rows) {
      const id = Number(r.id);
      if (id) { try { await delHost(id); } catch { /* 单条失败继续 */ } }
    }
    selection.value = [];
    await fetchAll();
  },
}));

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

/**
 * 跳转远程控制台并携带连接参数
 * @param h 主机
 */
function connect(h: Host): void {
  router.push({ path: "/terminal", query: { hostId: String(h.id), protocol: protocolOf(h) } });
}
function openDetail(h: Host): void {
  router.push(`/host/${h.id}`);
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

function openConnect(h: Host): void {
  connectTarget.value = h;
  connectIdentityId.value = null;
  connectVisible.value = true;
  listBoundIdentities(h.id).then((list: any) => {
    hostBoundIdentities.value = list ?? [];
  }).catch(() => { hostBoundIdentities.value = []; });
}
function doConnect(): void {
  const h = connectTarget.value;
  if (!h) return;
  const identityId = connectIdentityId.value;
  router.push({
    path: "/terminal",
    query: { hostId: String(h.id), protocol: protocolOf(h), ...(identityId != null ? { identityId: String(identityId) } : {}) },
  });
  connectVisible.value = false;
}

/** 身份管理（新增/删除）已统一迁至左侧「账号管理」页（/account）；
 *  本页仅保留身份选择（连接弹窗）与绑定/解绑 */
/** 在连接弹窗里绑定/解绑身份 */
async function toggleBind(hostId: number, identityId: number, bind: boolean): Promise<void> {
  try {
    if (bind) await bindIdentity(hostId, identityId);
    else await unbindIdentity(hostId, identityId);
    ElMessage.success(bind ? "已绑定该身份" : "已解绑");
    const list = await listBoundIdentities(hostId);
    hostBoundIdentities.value = list ?? [];
  } catch (e) { ElMessage.error(String((e as Error)?.message ?? e)); }
}

// ---- 更多菜单：在离线 / 指标 / 延迟检测（后台 HostOnlineScheduler 三项检测）----
const configVisible = ref(false);
useDialogPrerender(configVisible);
const configHost = ref<Host | null>(null);
const configMode = ref<"online" | "metric" | "delay">("metric");
// 画像抽屉定位：打开时预选的主机与分区
const profileHostId = ref<number | null>(null);
const profileTab = ref("overview");
/** 每次打开自增，保证重复打开同一台主机也会重新定位并刷新 */
const profileSeq = ref(0);

// 协议服务器管理弹窗已移除

// ---- 主机画像（master-detail：左主机列表 + 右 ReTab 详情） ----
const profileVisible = ref(false);
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
useDialogPrerender(profileVisible);

function openSysMgr(type: string, row: Host): void {
  // 画像页现在全量走 Agent：未安装时不再拦在门外，进去后由画像页给出
  // 「Agent 未就绪 + 最近错误 + 安装 Agent」的引导，避免用户完全看不到主机状态
  profileHostId.value = row.id;
  profileTab.value = type;
  profileSeq.value++;
  profileVisible.value = true;
}

function onMoreCommand(cmd: string, row: Host): void {
  if (cmd === "remote-config") {
    // 远控配置已并入编辑弹窗的「远控配置」区块
    openEdit(row);
    return;
  }
  // 所有系统管理项都合并到主机画像弹窗
  const tabMap: Record<string, string> = {
    "online": "process",
    "metric": "process",
    "delay": "process",
    "process": "process",
    "system-service": "service",
    "network-interface": "network-interface",
    "network-connection": "network-connection",
    "disk": "disk",
    "partition": "disk",
    "firewall": "firewall",
    "driver": "driver",
  };
  const tab = tabMap[cmd] || "process";
  openSysMgr(tab, row);
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
    if (ok === false) { ElMessage.warning("删除未生效（可能仍有绑定）"); return; }
    ElMessage.success("已删除");
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
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
 * 表格「更多」下拉命令分发
 * @param cmd 下拉项 command
 * @param h 当前行主机
 */
function runRowCommand(cmd: string, h: Host): void {
  switch (cmd) {
    case "detail": openDetail(h); break;
    case "scan": scanHostPorts(h); break;
    case "profile": openSysMgr("disk", h); break;
    case "edit": openEdit(h); break;
    case "agent-install": openDeploy(h, "install"); break;
    case "agent-reinstall": openDeploy(h, "reinstall"); break;
    case "agent-upgrade": openDeploy(h, "upgrade"); break;
    case "agent-uninstall": openDeploy(h, "uninstall"); break;
    case "delete": removeHost(h); break;
    default: break;
  }
}

/** 右键上下文菜单状态 */
const ctxMenu = reactive<{ visible: boolean; x: number; y: number; host: Host | null }>({
  visible: false,
  x: 0,
  y: 0,
  host: null,
});
/** 菜单估算尺寸，用于边缘翻转避免超出视口 */
const CTX_MENU_W = 208;
const CTX_MENU_H = 380;
/** 打开右键菜单（卡片/表格行右键触发） */
function openCtxMenu(event: MouseEvent, h: Host): void {
  event.preventDefault();
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
/** 右键菜单命令分发（连接/编辑直连本组件方法，其余走行命令） */
function ctxCommand(cmd: string): void {
  const h = ctxMenu.host;
  closeCtxMenu();
  if (!h) return;
  if (cmd === "connect") { openConnect(h); return; }
  if (cmd === "edit") { openEdit(h); return; }
  runRowCommand(cmd, h);
}
/** 表格根上的原生右键：把 <tr> 按行序号映射回主机并打开统一菜单（主表体/固定列同序）
 *
 * <p>选择器必须**同时**认两套引擎的行类名：本页 ReTable 未传 engine，当前走默认的
 * element 引擎（{@code tr.el-table__row}）；一旦该表格改用 {@code engine="vxe"}，
 * 行会变成 {@code tr.vxe-body--row}，只写 element 那支时 closest 返回 null、
 * 这里直接 return，右键菜单**静默失效且不报错**，排查成本很高。</p>
 *
 * <p>固定列（element 的 fixed / vxe 的 fixed-right wrapper）会各自渲染一份同序、
 * 同数量的行，所以在任一 tbody 内取 :scope 直接子行，序号都与 filtered 对齐。</p>
 */
function onTableContextMenu(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  const tr = target?.closest?.("tr.el-table__row, tr.vxe-body--row") as HTMLElement | null;
  if (!tr) return;
  const tbody = tr.parentElement;
  if (!tbody) return;
  const rows = Array.from(
    tbody.querySelectorAll(":scope > tr.el-table__row, :scope > tr.vxe-body--row"),
  );
  const idx = rows.indexOf(tr);
  const h = filtered.value[idx];
  if (h) openCtxMenu(event, h);
}
async function toggleHost(h: Host): Promise<void> {
  try {
    await switchHost(h.id, h.serverHostRemoteEnabled !== 1);
    ElMessage.success("已切换");
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}
async function batchDelete(): Promise<void> {
  if (selection.value.length === 0) return;
  await ElMessageBox.confirm(`批量删除 ${selection.value.length} 台主机？`, "批量删除", { type: "warning" });
  let ok = 0;
  for (const h of selection.value) {
    try { await delHost(h.id); ok++; } catch { /* 单条失败继续 */ }
  }
  ElMessage.success(`删除 ${ok}/${selection.value.length}`);
  selection.value = [];
  await fetchAll();
}

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
        ElMessage.success(`端口扫描完成：发现 ${d.openCount ?? 0} 个开放端口（耗时 ${d.elapsedSeconds ?? 0}s）`);
      } else {
        ElMessage.error(`端口扫描失败：${d.error ?? "未知错误"}`);
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

    <!-- 统计卡：ReStatCard 紧凑档，与「账号管理 / 代理管理」同规格 -->
    <section class="host-kpis">
      <ReStatCard
        v-for="k in hostKpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <!-- 筛选条（对齐 UI 稿：独立白色圆角面板） -->
    <div class="as-panel as-filter">
      <div class="filter">
        <ReFilter
          :items="filterItems"
          :columns="3"
          :collapsible="false"
          :show-actions="false"
          @change="onFilterChange"
          @reset="onFilterReset"
          style="flex:1;min-width:0"
        >
          <template #tag>
            <div v-if="allTags.length" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              <span class="muted">标签:</span>
              <ReTag
                v-for="t in allTags"
                :key="t"
                :class="['chip', { active: filterState.tag === t }]"
                @click="filterState.tag = filterState.tag === t ? '' : t"
              >{{ t }}</ReTag>
            </div>
          </template>
        </ReFilter>
        <span v-if="filtered.length !== hosts.length" class="muted">{{ filtered.length }} / {{ hosts.length }}</span>
        <div class="view-toggle">
          <button class="vt-btn" :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'">
            <ReIcon name="Grid" :size="14" />卡片
          </button>
          <button class="vt-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
            <ReIcon name="Menu" :size="14" />列表
          </button>
        </div>
        <!-- 操作区：统一 ReButton square（图标 + tip），落在视图切换右侧 -->
        <div class="filter-ops">
          <label class="color-switch">
            <span>实时监控</span>
            <el-switch v-model="realtimeEnabled" @change="onRealtimeToggle" />
          </label>
          <ReButton icon="RefreshRight" layout="square" tip="刷新" :loading="loading" @click="fetchAll" />
          <ReButton icon="Plus" layout="square" type="primary" tip="新增资产" @click="openAdd" />
        </div>
      </div>
    </div>

      <!-- 卡片视图（默认）：吃满一行，显示详细指标 -->
      <div v-if="viewMode === 'card'" class="host-card-grid">
        <ReCard
          v-for="h in filtered"
          :key="h.id"
          :body-style="{ paddingTop: '10px', paddingBottom: '10px' }"
          @contextmenu="openCtxMenu($event, h)"
        >
          <template #header>
            <div class="hc-head">
              <span class="hc-os" :class="osTileClass(h)">
                <span v-html="osIconSvg(h.serverHostOsType)"></span>
              </span>
              <div class="hc-name-wrap">
                <div class="hc-title-row">
                  <b class="hc-name">{{ h.serverHostName }}</b>
                  <span v-if="h.serverHostOsType" class="hc-os-tag" :title="h.serverHostOsVersion || h.serverHostOsType">{{ h.serverHostOsType }}</span>
                  <span class="hc-online" :class="liveOnlineState(h) === 1 ? 'is-on' : 'is-off'">
                    <i class="hc-dot" />{{ liveOnlineState(h) === 1 ? '在线' : '离线' }}
                  </span>
                </div>
                <div class="hc-addr mono">{{ h.serverHostAddress }}:{{ h.serverHostPort }}</div>
                <div v-if="h.serverHostPublicIp || h.serverHostPrivateIp" class="hc-ip mono">
                  <span v-if="h.serverHostPublicIp">公网 {{ h.serverHostPublicIp }}</span>
                  <span v-if="h.serverHostPublicIp && h.serverHostPrivateIp" class="hc-ip-sep">·</span>
                  <span v-if="h.serverHostPrivateIp">内网 {{ h.serverHostPrivateIp }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- 关键属性胶囊（延迟 / 采集 / 协议 / Agent） -->
          <div class="hc-chips">
            <span class="hc-chip">
              <i>延迟</i>
              <b class="mono" :class="{ bad: delayBad(liveDelayMs(h)) }">{{ delayText(liveDelayMs(h)) }}</b>
            </span>
            <span class="hc-chip"><i>采集</i><b>{{ collectModeLabel(h.serverHostCollectMode) }}</b></span>
            <span class="hc-chip"><i>协议</i><b>{{ protocolOf(h).toUpperCase() }}</b></span>
            <span class="hc-chip"><i>Agent</i><b>{{ h.serverHostAgentEnabled === 1 ? '已注册' : '未注册' }}</b></span>
          </div>

          <!-- 实时指标条（socket host-metrics 推送）：标签 + 胶囊长条 + 数值，对齐 UI 稿 -->
          <div v-if="realtimeEnabled && rtMetrics[h.id]" class="hc-bars">
            <div class="hc-bar-row">
              <span class="hc-bar-label">CPU</span>
              <ElProgress
                :percentage="Math.round(rtMetrics[h.id].cpu ?? 0)"
                :color="barColor(rtMetrics[h.id].cpu)"
                :stroke-width="16"
                :show-text="false"
                class="hc-bar-progress"
              />
              <span class="hc-bar-val">{{ (rtMetrics[h.id].cpu ?? 0).toFixed(1) }}%</span>
            </div>
            <div class="hc-bar-row">
              <span class="hc-bar-label">内存</span>
              <ElProgress
                :percentage="Math.round(rtMetrics[h.id].mem ?? 0)"
                :color="barColor(rtMetrics[h.id].mem)"
                :stroke-width="16"
                :show-text="false"
                class="hc-bar-progress"
              />
              <span class="hc-bar-val">{{ (rtMetrics[h.id].mem ?? 0).toFixed(1) }}%</span>
            </div>
            <div class="hc-bar-row">
              <span class="hc-bar-label">磁盘</span>
              <ElProgress
                :percentage="Math.round(rtMetrics[h.id].disk ?? 0)"
                :color="barColor(rtMetrics[h.id].disk)"
                :stroke-width="16"
                :show-text="false"
                class="hc-bar-progress"
              />
              <span class="hc-bar-val">{{ (rtMetrics[h.id].disk ?? 0).toFixed(1) }}%</span>
            </div>
          </div>

          <!-- 分组 + 标签（无分组无标签时整块不渲染，不再显示“未分组”） -->
          <div v-if="h.msServerGroupId || splitTags(h.serverHostTags).length" class="hc-tags">
            <ReTag
              v-if="h.msServerGroupId"

              :value="String(h.msServerGroupId)"
              :tag-options="[{ dictValue: String(h.msServerGroupId), dictLabel: groupName(h.msServerGroupId), dictTag: 'primary' }]"
            />
            <ReTag
              v-for="t in splitTags(h.serverHostTags)"
              :key="t"

              :value="t"
              :tag-options="[{ dictValue: t, dictLabel: t, dictTag: 'info' }]"
            />
          </div>

          <!-- 端口：收敛为单个标签，hover 弹层列出全部 -->
          <div v-if="parsePorts(h.serverHostPorts).length" class="hc-ports">
            <ElPopover trigger="hover" placement="top-start" :width="260" popper-class="ports-popover">
              <template #reference>
                <ReTag effect="plain" type="info">端口 {{ parsePorts(h.serverHostPorts).length }}</ReTag>
              </template>
              <div class="ports-pop-list">
                <div v-for="p in parsePorts(h.serverHostPorts)" :key="p.port" class="ports-pop-item mono">{{ portText(p) }}</div>
              </div>
            </ElPopover>
          </div>

          <!-- 卡片操作（对齐 UI 稿：主操作 + 更多） -->
          <template #footer>
            <div class="hc-actions">
              <ReButton icon="Connection" :show-text="true" type="primary" @click="openConnect(h)">远控</ReButton>
              <ReButton icon="TrendCharts" :show-text="true" @click="openDetail(h)">监控</ReButton>
              <ReButton icon="Aim" :show-text="true" @click="scanHostPorts(h)">扫描</ReButton>
              <ElDropdown trigger="click" placement="bottom-end" @command="(cmd) => runRowCommand(cmd as string, h)">
                <ReButton icon="MoreFilled" :show-text="true">更多</ReButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="profile"><ReIcon name="Histogram" />主机画像</ElDropdownItem>
                    <ElDropdownItem command="edit"><ReIcon name="EditPen" />编辑主机</ElDropdownItem>
                    <ElDropdownItem v-if="isAgentMode(h) && !isAgentInstalled(h)" command="agent-install" divided><ReIcon name="Download" />安装 Agent</ElDropdownItem>
                    <template v-else-if="isAgentMode(h)">
                      <ElDropdownItem command="agent-reinstall" divided><ReIcon name="RefreshRight" />重装 Agent</ElDropdownItem>
                      <ElDropdownItem command="agent-upgrade"><ReIcon name="Top" />升级 Agent</ElDropdownItem>
                      <ElDropdownItem command="agent-uninstall"><ReIcon name="DeleteFilled" />卸载 Agent</ElDropdownItem>
                    </template>
                    <ElDropdownItem command="delete" divided style="color:var(--el-color-danger,#f56c6c)"><ReIcon name="Delete" />删除主机</ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>
          </template>
        </ReCard>
        <div v-if="filtered.length === 0" class="hc-empty">暂无主机</div>
      </div>

      <!-- 表格视图 -->
      <ReTable
        v-else
        :data="filtered.map(h => ({ ...h }))"
        :columns="tableColumns"
        :loading="loading"
        :table-id="'asset-host-list'"

        border
        style="width:100%"
        empty-text="暂无主机"
        :toolbar="true"
        :toolbar-config="{ position: 'top', refresh: true, columnSettings: true, tableSettings: true, batchSelect: { enabled: true, tip: '批量选择' }, batchDelete: { enabled: true, confirmMessage: '确认批量删除选中的主机？', handler: batchDelete } }"
        @selection-change="selection = $event"
        @contextmenu="onTableContextMenu"
      >
        <template #col-name="{ row }">
          <span class="h-os">
            <span v-html="osIconSvg(row.serverHostOsType)"></span>
          </span>
          <b style="vertical-align:middle;margin-left:6px">{{ row.serverHostName }}</b>
        </template>
        <template #col-addr="{ row }"><span class="mono">{{ row.serverHostAddress }}:{{ row.serverHostPort }}</span></template>
        <template #col-group="{ row }">
          <ReTag
            v-if="row.msServerGroupId"

            :value="String(row.msServerGroupId)"
            :tag-options="[{ dictValue: String(row.msServerGroupId), dictLabel: groupName(row.msServerGroupId), dictTag: 'primary' }]"
          />
        </template>
        <template #col-tags="{ row }">
          <div v-if="splitTags(row.serverHostTags).length" style="display:flex;gap:4px;flex-wrap:wrap">
            <ReTag v-for="t in splitTags(row.serverHostTags)" :key="t" :value="t" :tag-options="[{ dictValue: t, dictLabel: t, dictTag: 'info' }]" />
          </div>
          <span v-else class="dim">—</span>
        </template>
        <template #col-proto="{ row }">
          <ReTag :value="protocolOf(row)" :tag-options="[
            { dictValue: 'ssh', dictLabel: 'SSH', dictTag: 'primary' },
            { dictValue: 'rdp', dictLabel: 'RDP', dictTag: 'warning' },
            { dictValue: 'vnc', dictLabel: 'VNC', dictTag: 'info' },
          ]" />
        </template>
        <template #col-status="{ row }">
          <span class="st-cell"><ReStatusIndicator :type="liveOnlineState(row) === 1 ? 'success' : 'danger'" />{{ liveOnlineState(row) === 1 ? '在线' : '离线' }}</span>
        </template>
        <template #col-delay="{ row }">
          <span class="delay-live" :class="{ bad: delayBad(liveDelayMs(row)) }">{{ delayText(liveDelayMs(row)) }}</span>
        </template>
        <template #col-agent="{ row }">
          <ReTag :value="row.serverHostAgentEnabled === 1 ? 'on' : 'off'" :tag-options="[
            { dictValue: 'on', dictLabel: '已注册', dictTag: 'success' },
            { dictValue: 'off', dictLabel: '未注册', dictTag: 'info' },
          ]" />
        </template>
        <template #col-ports="{ row }">
          <ElPopover v-if="parsePorts(row.serverHostPorts).length" trigger="hover" placement="top-start" :width="260" popper-class="ports-popover">
            <template #reference>
              <ReTag effect="plain" type="info">端口 {{ parsePorts(row.serverHostPorts).length }}</ReTag>
            </template>
            <div class="ports-pop-list">
              <div v-for="p in parsePorts(row.serverHostPorts)" :key="p.port" class="ports-pop-item mono">{{ portText(p) }}</div>
            </div>
          </ElPopover>
          <span v-else class="dim">未扫描</span>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="Connection" layout="square" type="primary" @click="openConnect(row)">连接</ReButton>
            <ReButton icon="EditPen" layout="square" @click="openEdit(row)">编辑</ReButton>
            <ElDropdown trigger="click" placement="bottom-end" @command="(cmd) => runRowCommand(cmd as string, row)">
              <ReButton icon="MoreFilled" layout="square" aria-label="更多" />
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="detail"><ReIcon name="TrendCharts" />监控</ElDropdownItem>
                  <ElDropdownItem command="scan"><ReIcon name="Search" />端口扫描</ElDropdownItem>
                  <ElDropdownItem command="profile"><ReIcon name="Histogram" />主机画像</ElDropdownItem>
                  <ElDropdownItem v-if="isAgentMode(row) && !isAgentInstalled(row)" command="agent-install" divided><ReIcon name="Download" />安装 Agent</ElDropdownItem>
                  <template v-else-if="isAgentMode(row)">
                    <ElDropdownItem command="agent-reinstall" divided><ReIcon name="RefreshRight" />重装 Agent</ElDropdownItem>
                    <ElDropdownItem command="agent-upgrade"><ReIcon name="Top" />升级 Agent</ElDropdownItem>
                    <ElDropdownItem command="agent-uninstall"><ReIcon name="DeleteFilled" />卸载 Agent</ElDropdownItem>
                  </template>
                  <ElDropdownItem command="delete" divided style="color:var(--el-color-danger,#f56c6c)"><ReIcon name="Delete" />删除</ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>
        </template>
      </ReTable>

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

    <!-- 主机画像弹窗（独立子组件：左主机列表 + 右分区详情，数据全部来自 Agent） -->
    <HostProfileDialog
      v-model="profileVisible"
      :hosts="hosts"
      :groups="groups"
      :live-delay="liveDelay"
      :live-online="liveOnline"
      :initial-host-id="profileHostId"
      :initial-tab="profileTab"
      :open-seq="profileSeq"
      @connect="(h) => openConnect(h)"
      @edit="(h) => openEdit(h)"
      @detail="(h) => openDetail(h)"
      @deploy-agent="(h) => openDeploy(h, 'install')"
      @refreshed="fetchAll"
    />

    <!-- 远控配置已并入主机编辑弹窗（HostFormDialog 的「远控配置」区块） -->
  </div>
    <!-- Agent 自动部署进度弹窗（socket 实时推送，支持最小化和断点续传） -->
    <AgentDeployDialog
      v-model="deployDialogVisible"
      v-model:minimized="deployMinimized"
      :task="deployTask"
      :logs="deployLogs.map(l => ({ time: new Date().toLocaleTimeString(), msg: l }))"
    />

    <!-- 主机右键上下文菜单（卡片/表格统一，动作直连，点击外侧关闭） -->
    <Teleport to="body">
      <div v-if="ctxMenu.visible" class="host-ctx-backdrop" @click="closeCtxMenu" @contextmenu.prevent="closeCtxMenu" />
      <div
        v-if="ctxMenu.visible && ctxMenu.host"
        class="host-ctx-menu"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        @contextmenu.prevent
      >
        <div class="host-ctx-item" @click="ctxCommand('connect')">
          <ReIcon name="Connection" /><span>连接远控</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('detail')">
          <ReIcon name="TrendCharts" /><span>监控详情</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('profile')">
          <ReIcon name="Histogram" /><span>主机画像</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('scan')">
          <ReIcon name="Aim" /><span>端口扫描</span>
        </div>
        <div class="host-ctx-sep" />
        <div class="host-ctx-item" @click="ctxCommand('edit')">
          <ReIcon name="EditPen" /><span>编辑主机</span>
        </div>
        <template v-if="ctxMenu.host && isAgentMode(ctxMenu.host)">
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
        <div class="host-ctx-item is-danger" @click="ctxCommand('delete')">
          <ReIcon name="Delete" /><span>删除主机</span>
        </div>
      </div>
    </Teleport>
</template>

<style scoped lang="scss">
/* 页面容器：直接铺在布局灰底上（白卡片浮于其上，对齐 UI 稿） */
.as {
  padding: 4px 4px 24px;
}

/* ============================================================
   统计卡（ReStatCard 紧凑档横排，卡片外壳规格由组件基线提供）
   —— 顶部 hero（大标题 + 主操作）已删除：页面标题由外壳面包屑承担，
   原 hero 上的「实时监控 / 刷新 / 新增资产」下沉到筛选行右侧。
   ============================================================ */
.host-kpis {
  display: grid;
  /* 紧凑档单卡较窄，auto-fit 让 4 张按可用宽度自动换行，无需断点硬切 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* ============================================================
   筛选面板（对齐 UI 稿：独立白色圆角条）
   ============================================================ */
.as-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.as-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin: 16px 0;
}
.as-filter .filter { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; }
/* 筛选行右侧操作区：统一 ReButton square（图标 + tip），与视图切换同一行 */
.filter-ops {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
/* 视图切换（UI 稿：胶囊分段） */
.view-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  flex: none;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}
.vt-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.vt-btn:hover { color: var(--el-text-color-primary); }
.vt-btn.active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  font-weight: 600;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px 28px;
  padding: 16px 8px 8px;
}
/* 上下布局：label 独占一行在上，控件在下 */
.form-vertical {
  :deep(.el-form-item) {
    display: block;
    width: 100%;
    margin-bottom: 14px;
  }
  :deep(.el-form-item__label) {
    display: block;
    height: auto;
    margin-bottom: 6px;
    line-height: 1.4;
    padding: 0;
    font-size: 13px;
    color: var(--text-secondary);
  }
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
  :deep(.el-form-item__content > .re-input),
  :deep(.el-form-item__content > .el-input-number) {
    width: 100%;
  }
}
/* 分节标题：左侧品牌色竖条 + 留白 */
.form-section {
  position: relative;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 0 0 8px 12px;
  margin-top: 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.form-section::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 10px;
  width: 3px;
  border-radius: 2px;
  background: var(--brand-500, #6d5dfc);
}
.form-section:first-child {
  margin-top: 0;
}
.form-section.full {
  grid-column: 1 / -1;
}
.col-span-2 {
  grid-column: span 2;
}
.as-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--status-error-text);
  background: var(--status-error-bg);
  border: 1px solid var(--status-error-border);
  border-radius: var(--radius-sm);
}
.h-os { display: inline-flex; align-items: center; vertical-align: middle; color: var(--brand-500); font-size: 17px; }
.h-os :deep(svg) { display: block; }
.kpi-ico { position: absolute; top: 12px; right: 12px; opacity: 0.14; pointer-events: none; }
.st-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.delay-live { font-family: var(--font-mono, monospace); font-size: 12px; color: var(--text-secondary, #8b90a0); }
.delay-live.bad { color: var(--danger, #f56c6c); font-weight: 600; }
.color-switch { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary,#8b90a0); }

/* ============================================================
   主机卡片（对齐 UI 稿：OS 图标 + 名称/地址 + 属性胶囊 + 指标条 + 操作）
   ============================================================ */
.host-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 16px;
  padding: 0 0 8px;
}
@media (max-width: 1100px) {
  .host-card-grid { grid-template-columns: 1fr; }
}
.host-card-grid :deep(.koi-card) {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.host-card-grid :deep(.koi-card:hover) {
  transform: translateY(-3px);
  box-shadow: var(--el-box-shadow, var(--shadow-2));
  border-color: var(--el-color-primary-light-7, var(--el-border-color));
}

/* 头部：OS 图标 + 名称/地址 + 状态 */
.hc-head { display: flex; align-items: flex-start; gap: 14px; padding: 18px 20px 12px; }
.hc-os {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  flex: none;
  font-size: 30px;
  line-height: 1;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
}
.hc-os :deep(svg) { display: block; }
.hc-os.is-windows { background: color-mix(in srgb, var(--metric-mem, #8b5cf6) 12%, var(--el-bg-color)); }
.hc-os.is-linux { background: color-mix(in srgb, var(--metric-disk, #f59e0b) 14%, var(--el-bg-color)); }
.hc-os.is-macos { background: color-mix(in srgb, var(--el-text-color-placeholder) 14%, var(--el-bg-color)); }

.hc-name-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.hc-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.hc-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hc-os-tag {
  flex: none;
  padding: 1px 8px;
  font-size: 11px;
  line-height: 18px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: var(--el-radius-full, 9999px);
}
.hc-online {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.hc-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--el-color-success); }
.hc-online.is-off .hc-dot { background: var(--el-color-danger); }
.hc-online.is-on .hc-dot { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent); }
.hc-addr { font-size: 12.5px; color: var(--el-text-color-secondary); }
.hc-ip { font-size: 12px; color: var(--el-text-color-placeholder); }
.hc-ip-sep { margin: 0 4px; }

/* 关键属性胶囊 */
.hc-chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 20px 14px; }
.hc-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-extra-light, var(--el-fill-color-light));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
}
.hc-chip i { font-style: normal; color: var(--el-text-color-placeholder); }
.hc-chip b { font-weight: 600; color: var(--el-text-color-primary); }
.hc-chip b.bad { color: var(--el-color-danger); }

/* 实时指标条：标签 + 胶囊长条 + 数值（对齐 UI 稿的粗条与大号数值） */
.hc-bars { display: flex; flex-direction: column; gap: 12px; padding: 2px 20px 16px; }
.hc-bar-row { display: flex; align-items: center; gap: 12px; }
.hc-bar-label {
  width: 42px;
  flex: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.hc-bar-progress { flex: 1; min-width: 0; }
.hc-bar-progress :deep(.el-progress-bar__outer) {
  background-color: var(--el-fill-color);
  border-radius: var(--el-radius-full, 9999px);
}
.hc-bar-progress :deep(.el-progress-bar__inner) {
  border-radius: var(--el-radius-full, 9999px);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.hc-bar-val {
  width: 56px;
  flex: none;
  text-align: right;
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

/* 标签 / 端口 / 操作 */
.hc-tags { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 20px 12px; }
.hc-ports { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 20px 14px; }
.hc-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.hc-empty { grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--el-text-color-placeholder); font-size: 13px; }
/* 表格操作列：主操作 + 更多下拉，按钮固定窄列内不折行 */
.op-cell { display: flex; align-items: center; gap: 2px; white-space: nowrap; }
</style>

<style lang="scss">
/* 端口弹层（teleport 到 body，需全局样式） */
.ports-popover.el-popover {
  padding: 8px;
}
.ports-pop-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 260px;
  overflow-y: auto;
}
.ports-pop-item {
  font-size: 12px;
  color: var(--el-text-color-regular, #4b5563);
  padding: 3px 8px;
  border-radius: 4px;
}
.ports-pop-item:hover {
  background: var(--el-fill-color-light, #f3f4f6);
}

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
</style>
