<script setup lang="ts">
/**
 * 主机资产 v2 —— 对齐 prototype.html §4.2
 * KPI + FilterBar + 表格 + 完整 CRUD（新增/编辑/删除/启停/批量）+ 行内「连接」直达远控
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { queryHosts, saveHost, delHost, switchHost, getHost, getGroups, getIdentities, listBoundIdentities, bindIdentity, unbindIdentity, saveIdentity, delIdentity } from "@pages/server/src/api";

interface Host {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostPort: number;
  serverHostOsType: string;
  serverHostStatus: number;
  serverHostOnline: number;
  serverHostCollectMode: string;
  serverHostAgentEnabled: number;
  serverHostRemoteEnabled: number;
  serverHostOnlineTime?: string;
  /** 分组（后端字段 msServerGroupId） */
  serverGroupId?: number | null;
  /** 标签（后端字段 msServerHostTags，逗号分隔） */
  serverHostTags?: string | null;
  /** 描述/备注（后端字段 msServerHostDescription） */
  serverHostDescription?: string | null;
  /** 编码（后端字段 msServerHostCode） */
  serverHostCode?: string | null;
}

interface Group { id: number; msServerGroupName: string; }
interface Identity { id: number; msServerIdentityName: string; msServerIdentityAuthType: string; msServerIdentityUsername: string; msServerIdentityRemark?: string; }

const router = useRouter();
const hosts = ref<Host[]>([]);
const groups = ref<Group[]>([]);
const identities = ref<Identity[]>([]);
const loading = ref(false);
const loadError = ref("");
const keyword = ref("");
const filterStatus = ref("");
const filterGroup = ref<number | null>(null);
const filterTag = ref("");
const selection = ref<Host[]>([]);

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
function groupName(id?: number | null): string {
  if (!id) return "未分组";
  return groups.value.find(g => g.id === id)?.msServerGroupName ?? "组#" + id;
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
/** 真实 OS 品牌图标（SVG） */
function osSvg(os: string): string {
  const icons: Record<string, string> = {
    linux: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-2 0-2.4 1.4-2.4 2.6 0 .4.1.8.2 1.1C8.9 6.4 8 7 8 8c-1.6.7-2.3 2-2.3 3.6l.4 1.6c-1.4.4-2 1.1-2 2.2 0 .8.5 1.4 1.2 1.8.4 2 1.8 3 3.7 3h6c1.9 0 3.3-1 3.7-3 .7-.4 1.2-1 1.2-1.8 0-1.1-.6-1.8-2-2.2l.4-1.6c0-1.6-.7-2.9-2.3-3.6-.3-1.1-1-1.7-2-1.9.1-.3.2-.6.2-1C14.4 4.4 14 3 12 3z"/></svg>',
    windows: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 5.5 11 4.6v6.1H3zM3 13.3h8V20L3 19.1zM12 4.4l9-1.4V10.8h-9zM12 13.3h9V21l-9-1.4z"/></svg>',
    macos: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.2 12.6c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.9-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.1-1.2 2.9-2.3.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.6-3.8zM13.8 5.5c.7-.8 1.1-1.9 1-3-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.9-1.4z"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  };
  return icons[os] ?? icons.terminal;
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
  let list = hosts.value;
  if (filterStatus.value === "online") list = list.filter(h => h.serverHostOnline === 1);
  else if (filterStatus.value === "offline") list = list.filter(h => h.serverHostOnline !== 1);
  else if (filterStatus.value === "remote") list = list.filter(h => h.serverHostRemoteEnabled === 1);
  if (filterGroup.value != null) list = list.filter(h => h.serverGroupId === filterGroup.value);
  if (filterTag.value) list = list.filter(h => splitTags(h.serverHostTags).includes(filterTag.value));
  if (keyword.value) {
    const k = keyword.value.toLowerCase();
    list = list.filter(h => h.serverHostName.toLowerCase().includes(k) || h.serverHostAddress.toLowerCase().includes(k));
  }
  return list;
});

/** ReTable 列定义 */
const tableColumns = computed(() => [
  { prop: "serverHostName", label: "名称", minWidth: 150, slot: "name" },
  { prop: "serverHostAddress", label: "地址", width: 150, slot: "addr" },
  { prop: "serverGroupId", label: "分组", width: 92, slot: "group" },
  { prop: "serverHostTags", label: "标签", minWidth: 120, slot: "tags" },
  { prop: "serverHostOsType", label: "OS", width: 80, slot: "os" },
  { prop: "serverHostOsType", label: "协议", width: 70, slot: "proto" },
  { prop: "serverHostOnline", label: "状态", width: 84, slot: "status" },
  { prop: "serverHostCollectMode", label: "采集模式", width: 100, formatter: (_: unknown, __: unknown, v: unknown) => collectModeLabel(String(v ?? "")) },
  { prop: "serverHostAgentEnabled", label: "Agent", width: 84, slot: "agent" },
  { prop: "id", label: "操作", width: 210, fixed: "right", slot: "actions" },
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

// ---- 新增/编辑表单 ----
const formVisible = ref(false);
const formSaving = ref(false);
const formIsEdit = ref(false);
/** 标签编辑用文本（逗号分隔），提交时写成 serverHostTags */
const tagsText = ref("");
const form = ref<Partial<Host>>({ serverHostName: "", serverHostAddress: "", serverHostPort: 22, serverHostOsType: "LINUX", serverHostCollectMode: "SCHEDULED" });
function resetForm(): void {
  form.value = { serverHostName: "", serverHostAddress: "", serverHostPort: 22, serverHostOsType: "LINUX", serverHostCollectMode: "SCHEDULED", serverGroupId: null, serverHostTags: "", serverHostDescription: "" };
  tagsText.value = "";
  formIdentityId.value = null;
  formIdentityChanged.value = false;
  hostBoundIdentities.value = [];
}

/** 编辑弹窗里切换登录身份 */
function onFormIdentityChange(v: number | null): void {
  formIdentityChanged.value = true;
  formIdentityId.value = v;
}

function collectModeLabel(m?: string | null): string {
  const map: Record<string, string> = { SCHEDULED: "定时采集", AGENT: "Agent采集", HTTP: "HTTP采集", PROMETHEUS: "Prometheus采集" };
  return map[m ?? ""] ?? m ?? "—";
}

// ---- 连接时选择身份 ----
const connectVisible = ref(false);
const connectTarget = ref<Host | null>(null);
const connectIdentityId = ref<number | null>(null);
const hostBoundIdentities = ref<number[]>([]);
/** 编辑表单里选中的登录身份 */
const formIdentityId = ref<number | null>(null);
/** 编辑表单是否显式绑定/解绑过身份 */
const formIdentityChanged = ref(false);

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

// ---- 身份管理（账号密码 / 私钥登录）----
const identityVisible = ref(false);
const identitySaving = ref(false);
const identityForm = ref<{ msServerIdentityName: string; msServerIdentityAuthType: string; msServerIdentityUsername: string; msServerIdentityPassword: string; msServerIdentityKeyId: number | null; msServerIdentityRemark: string }>({
  msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "", msServerIdentityPassword: "", msServerIdentityKeyId: null, msServerIdentityRemark: "",
});
function openIdentityAdd(): void {
  identityForm.value = { msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "", msServerIdentityPassword: "", msServerIdentityKeyId: null, msServerIdentityRemark: "" };
  identityVisible.value = true;
}
async function submitIdentity(): Promise<void> {
  if (!identityForm.value.msServerIdentityName?.trim()) { ElMessage.warning("请输入身份名称"); return; }
  if (!identityForm.value.msServerIdentityUsername?.trim()) { ElMessage.warning("请输入登录用户名"); return; }
  identitySaving.value = true;
  try {
    await saveIdentity(null, { ...identityForm.value, msServerIdentityPassword: identityForm.value.msServerIdentityPassword || undefined });
    ElMessage.success("身份已创建");
    identityVisible.value = false;
    const list = await getIdentities();
    identities.value = list ?? [];
  } catch (e) { ElMessage.error(String((e as Error)?.message ?? e)); }
  finally { identitySaving.value = false; }
}
async function removeIdentity(id: number): Promise<void> {
  await ElMessageBox.confirm("删除该身份？", "删除确认", { type: "warning" });
  try {
    await delIdentity(id);
    identities.value = identities.value.filter(x => x.id !== id);
  } catch (e) { ElMessage.error(String((e as Error)?.message ?? e)); }
}
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

function openAdd(): void {
  formIsEdit.value = false;
  resetForm();
  formVisible.value = true;
}
async function openEdit(h: Host): Promise<void> {
  try {
    const full = await getHost(h.id);
    form.value = { ...((full as any) ?? h) };
  } catch {
    form.value = { ...h };
  }
  tagsText.value = splitTags(form.value.serverHostTags).join(", ");
  // 加载该主机已绑定身份，预选第一个作为登录身份
  formIdentityChanged.value = false;
  formIdentityId.value = null;
  try {
    const bound = (await listBoundIdentities(h.id)) as any[] | null | undefined;
    hostBoundIdentities.value = bound ?? [];
    const first = hostBoundIdentities.value[0];
    if (first) formIdentityId.value = first;
  } catch {
    hostBoundIdentities.value = [];
  }
  formIsEdit.value = true;
  formVisible.value = true;
}
function validForm(): boolean {
  if (!form.value.serverHostName?.trim()) { ElMessage.warning("请输入主机名"); return false; }
  if (!form.value.serverHostAddress?.trim()) { ElMessage.warning("请输入地址"); return false; }
  if (!form.value.serverHostPort) { ElMessage.warning("请输入端口"); return false; }
  return true;
}
async function submitForm(): Promise<void> {
  if (!validForm()) return;
  // 标签文本 → 逗号分隔字符串
  form.value.serverHostTags = tagsText.value.split(",").map(t => t.trim()).filter(Boolean).join(",");
  formSaving.value = true;
  try {
    const res = await saveHost(formIsEdit.value ? form.value.id ?? null : null, form.value) as any;
    // 新主机：取回后端返回的 id（res 可能是保存后的实体或 id）
    const savedId = formIsEdit.value ? form.value.id : (res?.id ?? null);
    let hostId = formIsEdit.value ? form.value.id! : null;
    if (!hostId && savedId) hostId = Number(savedId);
    // 若表单选了身份，且是显式选择的，则绑定到（新/旧）主机
    if (hostId && formIdentityChanged.value && formIdentityId.value != null) {
      await bindIdentity(hostId, formIdentityId.value);
    }
    ElMessage.success(formIsEdit.value ? "已更新" : "已新增");
    formVisible.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    formSaving.value = false;
  }
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

onMounted(fetchAll);
</script>

<template>
  <div class="as">
    <div class="page-header">
      <div>
        <h1 class="page-title">主机资产</h1>
        <p class="page-desc">统一管理可远控目标 · 共 {{ hosts.length }} 台 · 完整增删改查</p>
      </div>
      <div class="page-actions">
        <ReButton icon="Key" :show-text="true" size="small" @click="openIdentityAdd">账号/密钥</ReButton>
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
        <ReInput v-model="keyword" placeholder="搜索名称 / IP" clearable size="small" class="grow" />
        <ReSelect v-model="filterStatus" placeholder="状态" clearable size="small" style="width:110px">
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="远控启用" value="remote" />
        </ReSelect>
        <ReSelect v-model="filterGroup" placeholder="分组" clearable size="small" style="width:130px">
          <el-option v-for="g in groups" :key="g.id" :label="g.msServerGroupName" :value="g.id" />
        </ReSelect>
        <!-- 标签快筛 -->
        <span v-if="allTags.length" class="muted" style="margin-left:8px">标签:</span>
        <template v-for="t in allTags" :key="t">
          <ReTag :class="['chip', { active: filterTag === t }]" @click="filterTag = filterTag === t ? '' : t">{{ t }}</ReTag>
        </template>
        <span class="muted" style="margin-left:auto">{{ filtered.length }} / {{ hosts.length }}</span>
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
          :toolbar-config="{ refresh: true, columnSettings: true, tableSettings: true, batchSelect: { enabled: true, tip: '批量选择' }, batchDelete: { enabled: true, confirmMessage: '确认批量删除选中的主机？', handler: batchDelete } }"
          @selection-change="selection = $event"
        >
        <template #col-name="{ row }">
          <span class="h-os" v-html="osSvg(osIcon(row.serverHostOsType))"></span>
          <b style="vertical-align:middle;margin-left:6px">{{ row.serverHostName }}</b>
        </template>
        <template #col-addr="{ row }"><span class="mono">{{ row.serverHostAddress }}:{{ row.serverHostPort }}</span></template>
        <template #col-group="{ row }">
          <ReTag v-if="row.serverGroupId" size="small" effect="plain">{{ groupName(row.serverGroupId) }}</ReTag>
          <span v-else class="dim">未分组</span>
        </template>
        <template #col-tags="{ row }">
          <div v-if="splitTags(row.serverHostTags).length" style="display:flex;gap:4px;flex-wrap:wrap">
            <ReTag v-for="t in splitTags(row.serverHostTags)" :key="t" size="small" effect="light">{{ t }}</ReTag>
          </div>
          <span v-else class="dim">—</span>
        </template>
        <template #col-os="{ row }"><ReTag size="small">{{ normalizeOs(row.serverHostOsType) }}</ReTag></template>
        <template #col-proto="{ row }">
          <ReTag :type="protocolOf(row) === 'ssh' ? 'primary' : protocolOf(row) === 'rdp' ? 'warning' : 'info'" size="small" effect="plain">{{ protocolOf(row).toUpperCase() }}</ReTag>
        </template>
        <template #col-status="{ row }">
          <span class="st-cell"><ReStatusIndicator :type="row.serverHostOnline === 1 ? 'success' : 'info'" />{{ onlineText(row) }}</span>
        </template>
        <template #col-agent="{ row }">
          <ReTag :type="row.serverHostAgentEnabled === 1 ? 'success' : 'info'" size="small">{{ row.serverHostAgentEnabled === 1 ? "已注册" : "未注册" }}</ReTag>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="Connection" layout="square" size="small" type="primary" title="连接（选择身份）" @click="openConnect(row)" />
            <ReButton icon="TrendCharts" layout="square" size="small" title="监控" @click="openDetail(row)" />
            <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="openEdit(row)" />
            <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="removeHost(row)" />
          </div>
        </template>
      </ReTable>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="formVisible" :title="formIsEdit ? '编辑主机' : '新增主机'" width="520px">
      <el-form label-width="auto">
        <el-form-item label="名称"><ReInput v-model="form.serverHostName" placeholder="如 web01" /></el-form-item>
        <el-form-item label="地址"><ReInput v-model="form.serverHostAddress" placeholder="IP 或域名" /></el-form-item>
        <el-form-item label="端口"><ReInputNumber v-model="form.serverHostPort" :min="1" :max="65535" /></el-form-item>
        <el-form-item label="系统">
          <ReSelect v-model="form.serverHostOsType" layout="square" size="small" style="width: 100%">
            <el-option label="Linux" value="LINUX"><span style="display:flex;align-items:center;gap:6px"><span v-html="osSvg('linux')" /> Linux</span></el-option>
            <el-option label="Windows" value="WINDOWS"><span style="display:flex;align-items:center;gap:6px"><span v-html="osSvg('windows')" /> Windows</span></el-option>
            <el-option label="macOS" value="MACOS"><span style="display:flex;align-items:center;gap:6px"><span v-html="osSvg('macos')" /> macOS</span></el-option>
          </ReSelect>
        </el-form-item>
        <el-form-item label="分组">
          <ReSelect v-model="form.serverGroupId" size="small" clearable placeholder="未分组" style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.msServerGroupName" :value="g.id" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="标签">
          <ReInput v-model="tagsText" placeholder="逗号分隔，如 prod,db,linux" />
        </el-form-item>
        <el-form-item label="描述">
          <ReInput v-model="form.serverHostDescription" type="textarea" :rows="2" placeholder="主机用途 / 备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="formVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="formSaving" @click="submitForm" icon="Check" :show-text="true">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 连接弹窗（选择登录身份） -->
    <ReDialog v-model="connectVisible" :title="`连接 ${connectTarget?.serverHostName ?? ''}`" width="460px">
      <div v-if="!connectTarget" />
      <template v-else>
        <p class="muted" style="margin-top:0">{{ connectTarget.serverHostAddress }}:{{ connectTarget.serverHostPort }} · {{ protocolOf(connectTarget).toUpperCase() }}</p>
        <div class="muted" style="margin-bottom:8px">登录身份（账号密码 / 私钥）</div>
        <ReSelect v-model="connectIdentityId" placeholder="使用默认凭据" clearable size="small" style="width:100%">
          <el-option-group label="已绑定">
            <el-option v-for="b in hostBoundIdentities" :key="b" :label="`${identities.find(i => i.id === b)?.msServerIdentityName ?? ''}（${identities.find(i => i.id === b)?.msServerIdentityUsername ?? ''}）`" :value="b" />
          </el-option-group>
          <el-option-group label="全部身份">
            <el-option v-for="i in identities.filter(x => !hostBoundIdentities.includes(x.id))" :key="i.id" :label="`${i.msServerIdentityName}（${i.msServerIdentityUsername}）`" :value="i.id" />
          </el-option-group>
        </ReSelect>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <ReButton icon="Plus" :show-text="true" size="small" @click="openIdentityAdd">新增身份</ReButton>
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

    <!-- 身份管理（账号密码 / 私钥）弹窗 -->
    <ReDialog v-model="identityVisible" title="账号 / 密钥（登录身份）" width="500px">
      <div v-if="identities.length">
        <div class="muted" style="margin-bottom:8px">已有身份</div>
        <div v-for="i in identities" :key="i.id" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
          <span class="mono dim" style="flex:none">{{ i.msServerIdentityAuthType === "PASSWORD" ? "🔑 密码" : "🔐 密钥" }}</span>
          <b>{{ i.msServerIdentityName }}</b>
          <span class="muted">{{ i.msServerIdentityUsername }}</span>
          <ReButton icon="Delete" layout="square" size="small" type="danger" style="margin-left:auto" title="删除" @click="removeIdentity(i.id)" />
        </div>
      </div>
      <div style="margin:14px 0 10px"><b>新增身份</b></div>
      <el-form label-width="auto">
        <el-form-item label="名称"><ReInput v-model="identityForm.msServerIdentityName" placeholder="如 root-prod" /></el-form-item>
        <el-form-item label="类型">
          <ReSelect v-model="identityForm.msServerIdentityAuthType" size="small" style="width:100%">
            <el-option label="密码登录 (PASSWORD)" value="PASSWORD" />
            <el-option label="私钥登录 (PUBLIC_KEY)" value="PUBLIC_KEY" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="用户名"><ReInput v-model="identityForm.msServerIdentityUsername" placeholder="如 root / ubuntu" /></el-form-item>
        <el-form-item v-if="identityForm.msServerIdentityAuthType === 'PASSWORD'" label="密码">
          <ReInput v-model="identityForm.msServerIdentityPassword" type="password" show-password placeholder="登录口令" />
        </el-form-item>
        <el-form-item label="备注"><ReInput v-model="identityForm.msServerIdentityRemark" /></el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="identityVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Check" :show-text="true" :loading="identitySaving" @click="submitIdentity">保存身份</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
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
.kpi-ico { position: absolute; top: 12px; right: 12px; opacity: 0.14; pointer-events: none; }
.st-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.op-cell { display: flex; gap: 4px; }
</style>