<script setup lang="ts">
/**
 * 主机资产 v2 —— 对齐 prototype.html §4.2
 * KPI + FilterBar + 表格 + 完整 CRUD（新增/编辑/删除/启停/批量）+ 行内「连接」直达远控
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onBeforeUnmount, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElProgress } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import type { ReFilterItem } from "@repo/ui/components/ReFilter/types";
import { queryHosts, delHost, switchHost, getGroups, getIdentities, listBoundIdentities, bindIdentity, unbindIdentity, scanPorts } from "@pages/server/src/api";
import HostFormDialog from "./HostFormDialog.vue";
import HostConfigDialog from "./HostConfigDialog.vue";
import HostProfileView from "./HostProfileView.vue";
import SystemManageDialog from "./SystemManageDialog.vue";
import ServerManageDialog from "./ServerManageDialog.vue";
import { useDialogPrerender } from "../utils/dialogPrerender";
import { osIconSvg } from "../utils/osIcon";
import { useSocketService } from "@repo/core";
import ReMaskDialog from "../components/ReMaskDialog.vue";
import AgentDeployDialog from "../components/AgentDeployDialog.vue";
import ReProgressTask from "@repo/ui/components/ReProgress/ReProgressTask.vue";

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
  serverHostOnlineEnabled?: number;
  serverHostOnlineInterval?: number;
  serverHostDelayEnabled?: number;
  serverHostDelayInterval?: number;
  serverHostDelayMs?: number | null;
  serverHostLastDelayTime?: string | null;
  serverHostPorts?: string | null;
  serverHostLastPortScanTime?: string | null;
  serverHostAgentEnabled: number;
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
const selection = ref<Host[]>([]);
/** 实时延迟（hostId → delayMs，socket host-delay 推送更新；-1 表不可达） */
const liveDelay = ref<Record<number, number>>({});
/** 实时在线状态（hostId → 1/0，socket host-online 推送翻转） */
const liveOnline = ref<Record<number, number>>({});
let unsubDelay: (() => void) | undefined;
let unsubOnline: (() => void) | undefined;
let unsubMetrics: (() => void) | undefined;
let unsubDeploy: (() => void) | undefined;

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

/** 端口扫描 */
async function scanHostPorts(h: Host): Promise<void> {
  ElMessage.info(`正在扫描 ${h.serverHostAddress} 端口，全量扫描可能需要几分钟 …`);
  try {
    const r: any = await scanPorts(h.id);
    ElMessage.success(r?.msg || "端口扫描完成");
    await fetchAll();
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
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#10b981';
}

function onRealtimeToggle(v: boolean): void {
  localStorage.setItem('assets-realtime-enabled', String(v));
  // 实时指标只靠 socket 推送，不轮询
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
 * 推断主机默认协议
 * @param h 主机
 */
function protocolOf(h: Host): string {
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
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

const filtered = computed(() => {
  const fs = filterState.value;
  let list = hosts.value;
  const status = String(fs.status ?? "");
  if (status === "online") list = list.filter(h => h.serverHostOnline === 1);
  else if (status === "offline") list = list.filter(h => h.serverHostOnline !== 1);
  else if (status === "remote") list = list.filter(h => h.serverHostRemoteEnabled === 1);
  if (fs.group != null && fs.group !== "") list = list.filter(h => h.msServerGroupId === fs.group);
  if (fs.tag) list = list.filter(h => splitTags(h.serverHostTags).includes(String(fs.tag)));
  const kw = String(fs.keyword ?? "").toLowerCase();
  if (kw) {
    list = list.filter(h => h.serverHostName.toLowerCase().includes(kw) || h.serverHostAddress.toLowerCase().includes(kw));
  }
  return list;
});

/** ReTable 列定义 */
const tableColumns = computed(() => [
  { prop: "serverHostName", label: "名称", minWidth: 150, slot: "name" },
  { prop: "serverHostAddress", label: "地址", width: 150, slot: "addr" },
  { prop: "msServerGroupId", label: "分组", width: 92, slot: "group" },
  { prop: "serverHostTags", label: "标签", minWidth: 120, slot: "tags" },
  { prop: "serverHostOsType", label: "协议", width: 70, slot: "proto" },
  { prop: "serverHostOnline", label: "状态", width: 84, slot: "status" },
  { prop: "serverHostDelayMs", label: "延迟", width: 84, slot: "delay" },
  { prop: "serverHostCollectMode", label: "采集模式", width: 100, formatter: (_: unknown, __: unknown, v: unknown) => collectModeLabel(String(v ?? "")) },
  { prop: "serverHostPorts", label: "端口", minWidth: 140, slot: "ports" },
  { prop: "serverHostAgentEnabled", label: "Agent", width: 84, slot: "agent" },
  { prop: "id", label: "操作", width: 250, fixed: "right", slot: "actions" },
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
  loading.value = true;
  loadError.value = "";
  try {
    const [h, g, i] = await Promise.all([queryHosts(), getGroups(), getIdentities()]);
    hosts.value = (h ?? []).sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0));
    groups.value = g ?? [];
    identities.value = i ?? [];
  } catch (e) {
    loadError.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
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
  const map: Record<string, string> = { SCHEDULED: "定时采集", AGENT: "Agent采集", HTTP: "HTTP采集", PROMETHEUS: "Prometheus采集" };
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
// 系统管理弹窗
const sysMgrVisible = ref(false);
const sysMgrType = ref("process");
const sysMgrHost = ref<Host | null>(null);

// 协议服务器管理弹窗（Server 实现的 web 操作 + ServerFilter 配置）
const serverMgrVisible = ref(false);
const serverMgrHost = ref<Host | null>(null);

// 远控配置弹窗
const remoteCfgVisible = ref(false);
const remoteCfgHost = ref<Host | null>(null);
const remoteCfgForm = ref({
  protocol: 'ssh',
  sipEnabled: false,
  sipProviderId: '',
  sipService: 'rdp',
  sipLocalPort: 13389,
  vncPort: 5900,
});

// ---- 主机画像（master-detail：左主机列表 + 右 ReTab 详情） ----
const profileVisible = ref(false);
const deployDialogVisible = ref(false);
const deployProgress = ref(0);
const deployMessage = ref("");
const deployStatus = ref<"info" | "success" | "error">("info");
const deployInfo = reactive({ hostId: 0, hostName: "", action: "" as "install" | "reinstall" | "upgrade" });
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
function openProfile(): void {
  profileVisible.value = true;
}
/** 画像抽屉宽度：约 90% 窗口宽（koi ReDrawer size 传像素值，组件内部自适应百分比） */
const profileSize = computed(() => Math.round(window.innerWidth * 0.9));

function openSysMgr(type: string, row: Host): void {
  // 主机画像依赖 Agent，未安装时提示
  if (row.serverHostCollectMode !== 'AGENT' || !row.serverHostAgentInstalled) {
    ElMessage.warning(row.serverHostCollectMode !== 'AGENT' ? '当前采集方式不是 Agent，无法使用主机画像' : '主机画像需要先安装 Agent，请点击「安装 Agent」按钮');
    return;
  }
  sysMgrType.value = type;
  sysMgrHost.value = row;
  sysMgrVisible.value = true;
}

function onMoreCommand(cmd: string, row: Host): void {
  if (cmd === "remote-config") {
    remoteCfgHost.value = row;
    remoteCfgForm.value.protocol = row.serverHostOsType === 'WINDOWS' ? 'rdp' : 'ssh';
    remoteCfgVisible.value = true;
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
// 打开 Agent 自动部署弹窗
async function openDeploy(h: Host, action: 'install' | 'reinstall' | 'upgrade') {
  deployInfo.hostId = h.id;
  deployInfo.hostName = h.serverHostName;
  deployInfo.action = action;
  deployProgress.value = 0;
  deployMessage.value = '准备中...';
  deployStatus.value = 'info';
  deployDialogVisible.value = true;
  deployLogs.value = [`[${new Date().toLocaleTimeString()}] 开始${action === 'install' ? '安装' : action === 'reinstall' ? '重装' : '升级'} Agent...`];
  deployTask.value = {
    id: "agent-deploy",
    title: `${action === 'install' ? '安装' : action === 'reinstall' ? '重装' : '升级'} Agent - ${h.serverHostName}`,
    progress: 0.05,
    status: "running",
    text: "准备中...",
    createdAt: Date.now(),
    startedAt: Date.now(),
    history: [{ time: Date.now(), progress: 0.05, status: "running" }],
  };
  try {
    const r = await fetch(`/ms/server/host/agent/${h.id}/${action === 'install' ? 'deploy' : action}`, { method: 'POST' });
    const j = await r.json();
    if (!j.success) {
      deployStatus.value = 'error';
      deployMessage.value = j.msg || '启动部署失败';
    }
  } catch (e: any) {
    deployStatus.value = 'error';
    deployMessage.value = '请求失败: ' + e.message;
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
        deployStatus.value = d.status ?? 'info';
        deployLogs.value.push(`[${new Date().toLocaleTimeString()}] ${d.message} (${d.progress}%)`);
        deployTask.value = {
          ...deployTask.value,
          progress: pct,
          status: d.status === 'success' ? 'success' : d.status === 'error' ? 'failed' : 'running',
          text: d.message ?? '',
          history: [...deployTask.value.history, { time: Date.now(), progress: pct, status: d.status === 'success' ? 'success' : d.status === 'error' ? 'failed' : 'running' }],
        };
      }
    } catch { /* 静默 */ }
  });
  unsubMetrics = socket?.subscribe("monitor", "host-metrics", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; cpu?: number; mem?: number; disk?: number };
      if (d && d.hostId != null) {
        rtMetrics[d.hostId] = {
          cpu: Math.round(Number(d.cpu) || 0),
          mem: Math.round(Number(d.mem) || 0),
          disk: Math.round(Number(d.disk) || 0),
          tx: '—', rx: '—'
        };
      }
    } catch { /* 静默 */ }
  });
});
onBeforeUnmount(() => {
  unsubDelay?.();
  unsubOnline?.();
  unsubMetrics?.();
  unsubDeploy?.();
});

/** 实时在线状态（socket 优先，回退 host.serverHostOnline） */
function liveOnlineState(h: Host): number {
  return liveOnline.value[h.id] ?? h.serverHostOnline;
}
/** 实时延迟（socket 优先，回退 host.serverHostDelayMs） */
function liveDelayMs(h: Host): number | null {
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
</script>

<template>
  <div class="as tel-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">主机资产</h1>
        <p class="page-desc">统一管理可远控目标 · 共 {{ hosts.length }} 台 · 完整增删改查</p>
      </div>
      <div class="page-actions">

        <label class="color-switch">
          <span>实时指标</span>
          <el-switch v-model="realtimeEnabled" size="small" @change="onRealtimeToggle" />
        </label>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="fetchAll">刷新</ReButton>
        <ReButton icon="Plus" :show-text="true" type="primary" size="small" @click="openAdd">新增资产</ReButton>
      </div>
    </div>

    <div v-if="loadError" class="as-error">
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary" size="small" :show-text="true" @click="fetchAll">重试</ReButton>
    </div>

    <!-- KPI -->
    <section class="kpi-row cols-4">
      <div class="kpi c-brand">
        <div class="kpi-head">
          <ReButton icon="Monitor" layout="square" size="small" />
          <span class="kpi-label">资产总数</span>
        </div>
        <div class="kpi-value">{{ hosts.length }}<span class="kpi-unit">台</span></div>
        <div class="kpi-sub">共注册可远控目标</div>
      </div>
      <div class="kpi c-green">
        <div class="kpi-head">
          <ReButton icon="CircleCheck" layout="square" size="small" />
          <span class="kpi-label">在线</span>
        </div>
        <div class="kpi-value">{{ onlineCount }}<span class="kpi-unit">/ {{ hosts.length }}</span></div>
        <div class="kpi-sub">当前可连接资产</div>
      </div>
      <div class="kpi c-gray">
        <div class="kpi-head">
          <ReButton icon="CircleClose" layout="square" size="small" />
          <span class="kpi-label">离线</span>
        </div>
        <div class="kpi-value">{{ offlineCount }}<span class="kpi-unit">台</span></div>
        <div class="kpi-sub">需关注处理</div>
      </div>
      <div class="kpi c-blue">
        <div class="kpi-head">
          <ReButton icon="Connection" layout="square" size="small" />
          <span class="kpi-label">远控启用</span>
        </div>
        <div class="kpi-value">{{ remoteCount }}<span class="kpi-unit">台</span></div>
        <div class="kpi-sub">支持远程连接</div>
      </div>
    </section>

    <!-- 表格 / 卡片 视图 -->
    <div class="card">
      <div class="filter">
        <ReFilter
          :items="filterItems"
          :columns="3"
          :collapsible="false"
          :show-actions="false"
          @change="onFilterChange"
          @reset="onFilterReset"
          style="width:100%"
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
        <span v-if="filtered.length !== hosts.length" class="muted" style="margin-left:auto">{{ filtered.length }} / {{ hosts.length }}</span>
        <div style="display:flex;gap:4px;align-items:center">
          <ReButton :type="viewMode === 'card' ? 'primary' : 'default'" :show-text="false" size="small" title="卡片视图" @click="viewMode = 'card'" icon="Grid" />
          <ReButton :type="viewMode === 'table' ? 'primary' : 'default'" :show-text="false" size="small" title="表格视图" @click="viewMode = 'table'" icon="Menu" />
        </div>
      </div>

      <!-- 卡片视图（默认）：吃满一行，显示详细指标 -->
      <div v-if="viewMode === 'card'" class="host-card-grid">
        <ReCard
          v-for="h in filtered"
          :key="h.id"
          :body-style="{ paddingTop: '10px', paddingBottom: '10px' }"
        >
          <template #header>
            <div class="hc-head">
              <span class="hc-os">
                <span v-html="osIconSvg(h.serverHostOsType)"></span>
              </span>
              <div class="hc-name-wrap">
                <b class="hc-name">{{ h.serverHostName }}</b>
                <span class="hc-addr mono">{{ h.serverHostAddress }}:{{ h.serverHostPort }}</span>
              </div>
              <span class="hc-status">
                <ReStatusIndicator :type="liveOnlineState(h) === 1 ? 'success' : 'danger'" />
                <span :class="liveOnlineState(h) === 1 ? 'on' : 'off'">{{ liveOnlineState(h) === 1 ? '在线' : '离线' }}</span>
              </span>
            </div>
          </template>

          <!-- 实时指标行 -->
          <div class="hc-metrics">
            <div class="hc-metric">
              <span class="hc-m-label">延迟</span>
              <span class="hc-m-val mono" :class="{ bad: delayBad(liveDelayMs(h)) }">{{ delayText(liveDelayMs(h)) }}</span>
            </div>
            <div class="hc-metric">
              <span class="hc-m-label">采集</span>
              <span class="hc-m-val">{{ collectModeLabel(h.serverHostCollectMode) }}</span>
            </div>
            <div class="hc-metric">
              <span class="hc-m-label">协议</span>
              <span class="hc-m-val">{{ protocolOf(h).toUpperCase() }}</span>
            </div>
            <div class="hc-metric">
              <span class="hc-m-label">Agent</span>
              <span class="hc-m-val">{{ h.serverHostAgentEnabled === 1 ? '已注册' : '未注册' }}</span>
            </div>
          </div>

          <!-- 实时指标条（socket host-metrics 推送） -->
          <div v-if="rtMetrics[h.id]" class="hc-bars">
            <div class="hc-bar-row">
              <span class="hc-bar-label">CPU</span>
              <ElProgress :percentage="rtMetrics[h.id].cpu" :color="barColor(rtMetrics[h.id].cpu)" :stroke-width="10" class="hc-bar-progress" />
            </div>
            <div class="hc-bar-row">
              <span class="hc-bar-label">内存</span>
              <ElProgress :percentage="rtMetrics[h.id].mem" :color="barColor(rtMetrics[h.id].mem)" :stroke-width="10" class="hc-bar-progress" />
            </div>
            <div class="hc-bar-row">
              <span class="hc-bar-label">磁盘</span>
              <ElProgress :percentage="rtMetrics[h.id].disk" :color="barColor(rtMetrics[h.id].disk)" :stroke-width="10" class="hc-bar-progress" />
            </div>
          </div>

          <!-- 标签 + 分组 -->
          <div class="hc-tags">
            <ReTag
              v-if="h.msServerGroupId"
              size="small"
              :value="String(h.msServerGroupId)"
              :tag-options="[{ dictValue: String(h.msServerGroupId), dictLabel: groupName(h.msServerGroupId), dictTag: 'primary' }]"
            />
            <ReTag
              v-for="t in splitTags(h.serverHostTags)"
              :key="t"
              size="small"
              :value="t"
              :tag-options="[{ dictValue: t, dictLabel: t, dictTag: 'info' }]"
            />
            <span v-if="!h.msServerGroupId && splitTags(h.serverHostTags).length === 0" class="dim">未分组</span>
          </div>

          <!-- 端口 -->
          <div v-if="parsePorts(h.serverHostPorts).length" class="hc-ports">
            <ReTag v-for="p in parsePorts(h.serverHostPorts)" :key="p.port" size="small" effect="plain" type="info">{{ portText(p) }}</ReTag>
          </div>

          <!-- 卡片操作 -->
          <template #footer>
            <div class="hc-actions">
              <ReButton icon="Connection" layout="square" size="small" type="primary" title="连接" @click="openConnect(h)" />
              <ReButton icon="TrendCharts" layout="square" size="small" title="监控" @click="openDetail(h)" />
              <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="openEdit(h)" />
              <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="removeHost(h)" />
              <ReButton icon="Histogram" layout="square" size="small" title="主机画像" @click="openSysMgr('process', h)" />
              <ReButton v-if="h.serverHostCollectMode === 'AGENT' && !h.serverHostAgentInstalled" icon="Download" layout="square" size="small" type="success" title="安装 Agent" @click="openDeploy(h, 'install')" />
              <template v-else>
                <ReButton v-if="h.serverHostCollectMode === 'AGENT' && h.serverHostAgentInstalled" icon="RefreshRight" layout="square" size="small" type="warning" title="重装 Agent" @click="openDeploy(h, 'reinstall')" />
                <ReButton v-if="h.serverHostCollectMode === 'AGENT' && h.serverHostAgentInstalled" icon="Top" layout="square" size="small" type="primary" title="升级 Agent" @click="openDeploy(h, 'upgrade')" />
              </template>
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
        size="small"
        border
        style="width:100%"
        empty-text="暂无主机"
        :toolbar="true"
        :toolbar-config="{ position: 'top', refresh: true, columnSettings: true, tableSettings: true, batchSelect: { enabled: true, tip: '批量选择' }, batchDelete: { enabled: true, confirmMessage: '确认批量删除选中的主机？', handler: batchDelete } }"
        @selection-change="selection = $event"
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
            size="small"
            :value="String(row.msServerGroupId)"
            :tag-options="[{ dictValue: String(row.msServerGroupId), dictLabel: groupName(row.msServerGroupId), dictTag: 'primary' }]"
          />
          <span v-else class="dim">未分组</span>
        </template>
        <template #col-tags="{ row }">
          <div v-if="splitTags(row.serverHostTags).length" style="display:flex;gap:4px;flex-wrap:wrap">
            <ReTag v-for="t in splitTags(row.serverHostTags)" :key="t" size="small" :value="t" :tag-options="[{ dictValue: t, dictLabel: t, dictTag: 'info' }]" />
          </div>
          <span v-else class="dim">—</span>
        </template>
        <template #col-proto="{ row }">
          <ReTag size="small" :value="protocolOf(row)" :tag-options="[
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
          <ReTag size="small" :value="row.serverHostAgentEnabled === 1 ? 'on' : 'off'" :tag-options="[
            { dictValue: 'on', dictLabel: '已注册', dictTag: 'success' },
            { dictValue: 'off', dictLabel: '未注册', dictTag: 'info' },
          ]" />
        </template>
        <template #col-ports="{ row }">
          <div v-if="parsePorts(row.serverHostPorts).length" style="display:flex;gap:4px;flex-wrap:wrap">
            <ReTag v-for="p in parsePorts(row.serverHostPorts)" :key="p.port" size="small" :value="p.port" :tag-options="[{ dictValue: p.port, dictLabel: portText(p), dictTag: 'info' }]" />
          </div>
          <span v-else class="dim">未扫描</span>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="Connection" layout="square" size="small" type="primary" title="连接（选择身份）" @click="openConnect(row)" />
            <ReButton icon="TrendCharts" layout="square" size="small" title="监控" @click="openDetail(row)" />
            <ReButton icon="Search" layout="square" size="small" type="warning" title="端口扫描（nmap）" @click="scanHostPorts(row)" />
            <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="openEdit(row)" />
            <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="removeHost(row)" />
            <ReButton icon="Histogram" layout="square" size="small" title="主机画像" @click="openSysMgr('process', row)" />
          </div>
        </template>
      </ReTable>
    </div>

    <!-- 新增/编辑弹窗（独立子组件——弹窗渲染只在子组件内进行，不再触发本组件全量 diff） -->
    <HostFormDialog
      v-model="formVisible"
      :is-edit="formIsEdit"
      :host="editHost"
      :identity-options="identityOptions"
      :group-options="groupOptions"
      @saved="fetchAll"
    />

    <!-- 连接弹窗（选择登录身份） -->
    <ReDialog v-model="connectVisible" :title="`连接 ${connectTarget?.serverHostName ?? ''}`" width="460px">
      <div v-if="!connectTarget" />
      <template v-else>
        <p class="muted" style="margin-top:0">{{ connectTarget.serverHostAddress }}:{{ connectTarget.serverHostPort }} · {{ protocolOf(connectTarget).toUpperCase() }}</p>
        <div class="muted" style="margin-bottom:8px">登录身份（账号密码 / 私钥）</div>
        <ReSelect v-model="connectIdentityId" placeholder="使用默认凭据" clearable size="small" style="width:100%" :options="[
          ...hostBoundIdentities.map(b => ({ label: `${identities.find(i => i.id === b)?.msServerIdentityName ?? ''}（${identities.find(i => i.id === b)?.msServerIdentityUsername ?? ''}）`, value: b, group: '已绑定' })),
          ...identities.filter(x => !hostBoundIdentities.includes(x.id)).map(i => ({ label: `${i.msServerIdentityName}（${i.msServerIdentityUsername}）`, value: i.id, group: '全部身份' })),
        ]" />
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">
          <ReButton icon="Key" :show-text="true" size="small" plain title="统一在左侧「账号管理」维护" @click="router.push('/account')">账号管理</ReButton>
          <template v-for="b in hostBoundIdentities" :key="b">
            <ReButton icon="Unlink" :show-text="true" size="small" type="warning" plain :title="`解绑 ${identities.find(i => i.id === b)?.msServerIdentityName ?? ''}`" @click="toggleBind(connectTarget!.id, b, false)">解绑 {{ identities.find(i => i.id === b)?.msServerIdentityName }}</ReButton>
          </template>
        </div>
      </template>
      <template #footer>
        <ReButton @click="connectVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Connection" :show-text="true" @click="doConnect">{{ connectIdentityId ? "以此身份连接" : "默认凭据连接" }}</ReButton>
      </template>
    </ReDialog>

    <!-- 采集配置（行操作「更多」入口） -->
    <!-- 系统管理弹窗（主机画像） -->
    <SystemManageDialog
      v-model="sysMgrVisible"
      :type="sysMgrType"
      :host-id="sysMgrHost?.id"
      :host-name="sysMgrHost?.serverHostName"
      :host-address="sysMgrHost ? `${sysMgrHost.serverHostAddress}:${sysMgrHost.serverHostPort}` : ''"
      :host-os-type="sysMgrHost?.serverHostOsType"
      :host-protocol="sysMgrHost?.serverHostOsType === 'WINDOWS' ? 'RDP' : 'SSH'"
      :host-delay="sysMgrHost?.serverHostDelayMs"
      :host-online="sysMgrHost?.serverHostOnline === 1"
      :host-group="sysMgrHost?.msServerGroupId ? groupName(sysMgrHost.msServerGroupId) : '未分组'"
    />

    <!-- 协议服务器管理弹窗（Server 实现的 web 操作 + ServerFilter 实时配置） -->
    <ServerManageDialog v-model="serverMgrVisible" />

    <HostConfigDialog v-model="configVisible" :host="configHost" :mode="configMode" @saved="fetchAll" />

    <!-- 主机画像（全屏 Drawer：左主机列表 + 右 ReTab 详情） -->
    <ReDrawer v-model="profileVisible" title="主机画像" :size="profileSize" direction="rtl" :footer-hidden="true" :close-only="true">
      <HostProfileView
        :hosts="hosts"
        :groups="groups"
        :live-delay="liveDelay"
        :live-online="liveOnline"
        @connect="(h) => openConnect(h)"
        @edit="(h) => openEdit(h)"
        @detail="(h) => openDetail(h)"
        @scan-ports="(h) => scanHostPorts(h)"
      />
    </ReDrawer>

    <!-- 远控配置弹窗 -->
    <ReDialog v-model="remoteCfgVisible" :title="`远控配置 - ${remoteCfgHost?.serverHostName ?? ''}`" width="520px" class="no-anim-dialog">
      <div class="form-grid">
        <div class="form-vertical">
          <label class="form-label">远控协议</label>
          <el-select v-model="remoteCfgForm.protocol" placeholder="选择协议">
            <el-option label="SSH (Linux)" value="ssh" />
            <el-option label="RDP (Windows)" value="rdp" />
            <el-option label="VNC" value="vnc" />
          </el-select>
        </div>
        <div class="form-vertical">
          <label class="form-label">VNC 端口</label>
          <el-input-number v-model="remoteCfgForm.vncPort" :min="5900" :max="6999" />
        </div>
      </div>
      <el-divider content-position="left">SIP 内网穿透</el-divider>
      <div class="form-grid">
        <div class="form-vertical">
          <label class="form-label">启用 SIP 隧道</label>
          <el-switch v-model="remoteCfgForm.sipEnabled" />
        </div>
        <div class="form-vertical">
          <label class="form-label">Provider ID</label>
          <el-input v-model="remoteCfgForm.sipProviderId" placeholder="如 win-test-01" />
        </div>
        <div class="form-vertical">
          <label class="form-label">暴露服务</label>
          <el-select v-model="remoteCfgForm.sipService" placeholder="选择服务">
            <el-option label="RDP (3389)" value="rdp" />
            <el-option label="SSH (22)" value="ssh" />
            <el-option label="VNC (5900)" value="vnc" />
          </el-select>
        </div>
        <div class="form-vertical">
          <label class="form-label">Visit 本地端口</label>
          <el-input-number v-model="remoteCfgForm.sipLocalPort" :min="1024" :max="65535" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="remoteCfgVisible = false">取消</ReButton>
        <ReButton type="primary" @click="remoteCfgVisible = false">保存</ReButton>
      </template>
    </ReDialog>
  </div>
    <!-- Agent 自动部署进度弹窗（socket 实时推送，支持最小化和断点续传） -->
    <AgentDeployDialog
      v-model="deployDialogVisible"
      v-model:minimized="deployMinimized"
      :task="deployTask"
      :logs="deployLogs.map(l => ({ time: new Date().toLocaleTimeString(), msg: l }))"
    />
</template>

<style scoped lang="scss">
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
.op-cell { display: flex; gap: 4px; }
.color-switch { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary,#8b90a0); }

/* ---- 卡片视图（ReCard）---- */
.host-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
  padding: 8px 0;
}
/* ReCard koi 主题 margin 覆盖：按网格排布时去掉多余边距 */
.host-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
  padding: 8px 0;
}
.host-card-grid :deep(.koi-card) {
  margin: 0;
  padding: 0;
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 1px solid var(--border-subtle, #e5e7eb);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}
.host-card-grid :deep(.koi-card:hover) {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  border-color: rgba(109, 93, 252, 0.25);
}
.hc-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px 12px; }
.hc-os {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--bg-fill, #f5f6fa); flex-shrink: 0; color: var(--brand-500);
  font-size: 24px;
}
.hc-os :deep(svg) { display: block; }
.hc-name-wrap { flex: 1; min-width: 0; }
.hc-name {
  display: block; font-size: 15px; font-weight: 600; color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hc-addr { font-size: 12px; color: var(--text-tertiary, #a0a4b0); margin-top: 2px; }
.hc-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}
.hc-status.online {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
}
.hc-status.offline {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
}
.hc-status .on { color: var(--status-success-text, #34c759); font-weight: 500; }
.hc-status .off { color: var(--status-error-text, #f56c6c); font-weight: 500; }
.hc-metrics {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  padding: 12px 20px; border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}
.hc-metric { display: flex; flex-direction: column; gap: 3px; }
.hc-metric + .hc-metric { padding-left: 12px; border-left: 1px solid var(--border-subtle); }
.hc-m-label { font-size: 11px; color: var(--text-tertiary, #a0a4b0); }
.hc-m-val { font-size: 13px; color: var(--text-primary); font-weight: 500; }
.hc-m-val.mono { font-family: var(--font-mono, monospace); }
.hc-m-val.bad { color: var(--danger, #f56c6c); font-weight: 600; }
.hc-rt { padding: 8px 20px; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid #f1f5f9; }
.hc-bars {
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--border-subtle, #f1f5f9);
  background: linear-gradient(180deg, rgba(109, 93, 252, 0.02) 0%, transparent 100%);
}
.hc-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.hc-bar-label {
  width: 32px;
  color: #64748b;
  font-weight: 500;
}
.hc-bar-progress {
  flex: 1;
  border-radius: 4px;
  overflow: hidden;
}
.hc-bar-progress :deep(.el-progress-bar__outer) {
  background-color: #f1f5f9;
  border-radius: 4px;
}
.hc-bar-progress :deep(.el-progress-bar__inner) {
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.hc-bar-track { flex: 1; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.hc-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
.hc-bar-val { width: 40px; text-align: right; font-weight: 600; color: #0f172a; }
.hc-bar-net { flex: 1; text-align: right; color: #64748b; }
.hc-tags { display: flex; flex-wrap: wrap; gap: 4px; padding: 10px 20px; }
.hc-ports { display: flex; flex-wrap: wrap; gap: 4px; padding: 0 20px 10px; }
.hc-actions { display: flex; gap: 6px; padding: 12px 20px; border-top: 1px solid var(--border-subtle); }
.hc-empty { grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-tertiary); font-size: 13px; }
</style>

.deploy-progress { padding: 10px 0; }
.deploy-msg { margin-top: 12px; font-size: 13px; color: #475569; }
.deploy-msg.success { color: #10b981; }
.deploy-msg.error { color: #ef4444; }
.deploy-container { display: flex; flex-direction: column; gap: 16px; }
.deploy-log { max-height: 200px; overflow-y: auto; background: #1e293b; border-radius: 8px; padding: 12px; font-family: 'Consolas', monospace; font-size: 12px; }
.deploy-log-line { color: #94a3b8; line-height: 1.6; }