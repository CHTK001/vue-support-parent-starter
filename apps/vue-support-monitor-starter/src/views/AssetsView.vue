<script setup lang="ts">
/**
 * 主机资产 v2 —— 对齐 prototype.html §4.2
 * KPI + FilterBar + 表格 + 完整 CRUD（新增/编辑/删除/启停/批量）+ 行内「连接」直达远控
 */
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import type { ReFilterItem } from "@repo/ui/components/ReFilter/types";
import { queryHosts, delHost, switchHost, getGroups, getIdentities, listBoundIdentities, bindIdentity, unbindIdentity, scanPorts } from "@pages/server/src/api";
import HostFormDialog from "./HostFormDialog.vue";
import HostConfigDialog from "./HostConfigDialog.vue";
import { useDialogPrerender } from "../utils/dialogPrerender";
import { useSocketService } from "@repo/core";

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
  /** 分组（后端字段 msServerGroupId） */
  serverGroupId?: number | null;
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
}

interface Group { id: number; msServerGroupName: string; msServerGroupColor?: string | null; }
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
let unsubDelay: (() => void) | undefined;

/** ReFilter 过滤状态（由 ReFilter 组件统一驱动，替代手写 keyword/status/group 三个 ref） */
const filterState = ref<Record<string, unknown>>({ keyword: "", status: "", group: "", tag: "" });
function onFilterChange(prop: string, value: unknown): void {
  filterState.value[prop] = value;
}
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

function splitTags(tags?: string | null): string[] {
  if (!tags || !tags.trim()) return [];
  return tags.split(",").map(t => t.trim()).filter(Boolean);
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
function groupName(id?: number | null): string {
  if (!id) return "未分组";
  return groups.value.find(g => g.id === id)?.msServerGroupName ?? "组#" + id;
}
/** 分组背景色开关：开启时分组标记按分组配置颜色显示底色 */
const groupColorEnabled = ref(true);
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

function normalizeOs(t?: string): string {
  const s = (t ?? "").toUpperCase();
  if (s.includes("WIN")) return "Windows";
  if (s.includes("LINUX")) return "Linux";
  if (s.includes("MAC")) return "macOS";
  return s || "其他";
}
function osIcon(t?: string): string {
  const s = (t ?? "").toUpperCase();
  if (s.includes("WIN")) return "windows";
  if (s.includes("LINUX")) return "linux";
  if (s.includes("MAC") || s.includes("DARWIN")) return "macos";
  return "terminal";
}
/** 真实 OS 品牌图标（SVG）：使用高辨识度的官方风格矢量路径（Windows 微软标 / macOS 苹果 / Linux 企鹅） */
function osSvg(os: string): string {
  const icons: Record<string, string> = {
    linux: '<svg viewBox="0 0 24 24" width="17" height="17" fill="#3D7A45"><path d="M12 0C8.28 0 5.236 1.92 5.236 4.286c0 1.516.86 2.857 2.168 3.73C4.872 8.47 3.5 10.11 3.5 12c0 1.344.56 2.55 1.45 3.46-.168 1.098-.7 2.1-1.49 2.9-.24.243-.39.56-.43.89-.04.33.03.67.2.97.23.43.06.83.3.83.12 0 1.06-.5 2.05-1.13.22.05.45.09.68.12.32.05.65.09.99.11.35.03.7.05 1.06.05.37 0 .73-.02 1.1-.05.34-.03.68-.06 1-.11.24-.03.48-.07.71-.12.99.63 1.93 1.13 2.05 1.13.24 0 .07-.4.3-.83.17-.3.24-.64.2-.97-.04-.33-.19-.65-.43-.89-.79-.8-1.32-1.8-1.49-2.9.89-.91 1.45-2.12 1.45-3.46 0-.45-.07-.9-.2-1.32.42-.73.67-1.63.67-2.57 0-2.37-3.05-4.29-6.79-4.29zm4.5 5.3c.19 0 .36.61.36 1.36s-.16 1.36-.36 1.36c-.19 0-.36-.61-.36-1.36s.16-1.36.36-1.36zm-9 0c.2 0 .36.61.36 1.36s-.16 1.36-.36 1.36c-.2 0-.36-.61-.36-1.36s.16-1.36.36-1.36z"/></svg>',
    windows: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="#0078D4" d="M0 3.45 9.75 2.1V11H0ZM10.88 2.05 24 0v11H10.88ZM0 12.2h9.75v8.9L0 19.7ZM10.88 12.2H24V24l-13.12-1.76Z"/></svg>',
    macos: '<svg viewBox="0 0 24 24" width="17" height="17" fill="#4A4A4A"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  };
  return icons[os] ?? icons.terminal;
}
/** 平台图片资源路径（用户可自行放置高辨识度 logo 到 src/assets/os/，见该目录 README）；无匹配时返回空走 SVG 兜底 */
function osImgSrc(os: string): string {
  const map: Record<string, string> = {
    linux: "os-linux",
    windows: "os-windows",
    macos: "os-macos",
  };
  const name = map[os];
  if (!name) return "";
  return `${import.meta.env.BASE_URL}os/${name}.png`;
}
/** 已确认图片加载失败的主机集合（key: id-os），命中则回退 SVG */
const osImgErrors = ref<Set<string>>(new Set());
function osImgFailed(row: Host): boolean {
  return osImgErrors.value.has(`${row.id}-${osIcon(row.serverHostOsType)}`);
}
function markOsImgFailed(row: Host): void {
  const key = `${row.id}-${osIcon(row.serverHostOsType)}`;
  if (!osImgErrors.value.has(key)) {
    osImgErrors.value = new Set(osImgErrors.value).add(key);
  }
}
function protocolOf(h: Host): string {
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
}
function onlineState(h: Host): "online" | "offline" | "unknown" {
  const v = h.serverHostOnline;
  if (v === 1) return "online";
  if (v === 0) return "offline";
  return "unknown";
}
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
  if (fs.group != null && fs.group !== "") list = list.filter(h => h.serverGroupId === fs.group);
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
  { prop: "serverGroupId", label: "分组", width: 92, slot: "group" },
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
function onMoreCommand(cmd: string, row: Host): void {
  configHost.value = row;
  configMode.value = cmd === "online" ? "online" : cmd === "delay" ? "delay" : "metric";
  configVisible.value = true;
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
  // 实时延迟：socket 推送（后台 delayTick 每轮检测后广播），更新到 liveDelay 覆盖表格列
  const socket = useSocketService();
  unsubDelay = socket?.subscribe("monitor", "host-delay", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; delayMs?: number | null };
      if (d && d.hostId != null) liveDelay.value[d.hostId] = d.delayMs ?? -1;
    } catch { /* 静默 */ }
  });
});
onBeforeUnmount(() => {
  unsubDelay?.();
});
</script>

<template>
  <div class="as">
    <div class="page-header">
      <div>
        <h1 class="page-title">主机资产</h1>
        <p class="page-desc">统一管理可远控目标 · 共 {{ hosts.length }} 台 · 完整增删改查</p>
      </div>
      <div class="page-actions">
        <label class="color-switch">
          <span>分组底色</span>
          <el-switch v-model="groupColorEnabled" size="small" />
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
        <span class="kpi-ico"><ReIcon name="Monitor" :size="36" /></span>
        <div class="kpi-top"><span class="kpi-label">资产总数</span></div>
        <div class="kpi-value">{{ hosts.length }}</div>
        <div class="kpi-sub">共注册资产</div>
      </div>
      <div class="kpi c-green">
        <div class="kpi-top"><span class="kpi-label">在线</span></div>
        <div class="kpi-value">{{ onlineCount }}</div>
        <div class="kpi-sub"><b>{{ onlineCount }}</b> / {{ hosts.length }}</div>
      </div>
      <div class="kpi c-gray">
        <div class="kpi-top"><span class="kpi-label">离线</span></div>
        <div class="kpi-value">{{ offlineCount }}</div>
        <div class="kpi-sub">需关注</div>
      </div>
      <div class="kpi c-blue">
        <div class="kpi-top"><span class="kpi-label">远控启用</span></div>
        <div class="kpi-value">{{ remoteCount }}</div>
        <div class="kpi-sub">可远程连接</div>
      </div>
    </section>

    <!-- 表格 -->
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
      </div>
        <ReTable
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
            <img
              v-if="!osImgFailed(row) && osImgSrc(osIcon(row.serverHostOsType))"
              :src="osImgSrc(osIcon(row.serverHostOsType))"
              class="os-img"
              alt=""
              @error="markOsImgFailed(row)"
            />
            <span v-else v-html="osSvg(osIcon(row.serverHostOsType))"></span>
          </span>
          <b style="vertical-align:middle;margin-left:6px">{{ row.serverHostName }}</b>
        </template>
        <template #col-addr="{ row }"><span class="mono">{{ row.serverHostAddress }}:{{ row.serverHostPort }}</span></template>
        <template #col-group="{ row }">
          <ReTag
            v-if="row.serverGroupId"
            size="small"
            :effect="groupColor(row.serverGroupId) ? 'light' : 'plain'"
            :style="groupColorStyle(row.serverGroupId)"
          >{{ groupName(row.serverGroupId) }}</ReTag>
          <span v-else class="dim">未分组</span>
        </template>
        <template #col-tags="{ row }">
          <div v-if="splitTags(row.serverHostTags).length" style="display:flex;gap:4px;flex-wrap:wrap">
            <ReTag v-for="t in splitTags(row.serverHostTags)" :key="t" size="small" effect="light">{{ t }}</ReTag>
          </div>
          <span v-else class="dim">—</span>
        </template>
        <template #col-proto="{ row }">
          <ReTag :type="protocolOf(row) === 'ssh' ? 'primary' : protocolOf(row) === 'rdp' ? 'warning' : 'info'" size="small" effect="plain">{{ protocolOf(row).toUpperCase() }}</ReTag>
        </template>
        <template #col-status="{ row }">
          <span class="st-cell"><ReStatusIndicator :type="row.serverHostOnline === 1 ? 'success' : 'info'" />{{ onlineText(row) }}</span>
        </template>
        <template #col-delay="{ row }">
          <span v-if="liveDelay[row.id] != null" class="delay-live" :class="{ bad: liveDelay[row.id] < 0 }">{{ liveDelay[row.id] < 0 ? "不可达" : liveDelay[row.id] + " ms" }}</span>
          <span v-else-if="row.serverHostDelayMs != null" class="delay-live" :class="{ bad: row.serverHostDelayMs < 0 }">{{ row.serverHostDelayMs < 0 ? "不可达" : row.serverHostDelayMs + " ms" }}</span>
          <span v-else class="dim">—</span>
        </template>
        <template #col-agent="{ row }">
          <ReTag :type="row.serverHostAgentEnabled === 1 ? 'success' : 'info'" size="small">{{ row.serverHostAgentEnabled === 1 ? "已注册" : "未注册" }}</ReTag>
        </template>
        <template #col-ports="{ row }">
          <div v-if="parsePorts(row.serverHostPorts).length" style="display:flex;gap:4px;flex-wrap:wrap">
            <ReTag v-for="p in parsePorts(row.serverHostPorts)" :key="p.port" size="small" effect="plain" type="info">{{ portText(p) }}</ReTag>
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
            <el-dropdown trigger="click" @command="(cmd: string) => onMoreCommand(cmd, row)" class="more-dd">
              <ReButton icon="MoreFilled" layout="square" size="small" title="更多" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="online">在离线</el-dropdown-item>
                  <el-dropdown-item command="metric">指标</el-dropdown-item>
                  <el-dropdown-item command="delay">延迟检测</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
    <HostConfigDialog v-model="configVisible" :host="configHost" :mode="configMode" @saved="fetchAll" />
  </div>
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
.h-os { display: inline-flex; align-items: center; vertical-align: middle; color: var(--brand-500); }
.h-os :deep(svg) { display: block; }
.os-img { width: 17px; height: 17px; display: block; object-fit: contain; }
.kpi-ico { position: absolute; top: 12px; right: 12px; opacity: 0.14; pointer-events: none; }
.st-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.delay-live { font-family: var(--font-mono, monospace); font-size: 12px; color: var(--text-secondary, #8b90a0); }
.delay-live.bad { color: var(--danger, #f56c6c); font-weight: 600; }
.op-cell { display: flex; gap: 4px; }
.color-switch { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary,#8b90a0); }
</style>