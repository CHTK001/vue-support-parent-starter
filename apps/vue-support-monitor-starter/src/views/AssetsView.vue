<script setup lang="ts">
/**
 * 主机资产 v2 —— 对齐 prototype.html §4.2
 * KPI + FilterBar + 表格 + 完整 CRUD（新增/编辑/删除/启停/批量）+ 行内「连接」直达远控
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { RefreshRight } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { queryHosts, saveHost, delHost, switchHost, getHost } from "@pages/server/src/api";

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
}

const router = useRouter();
const hosts = ref<Host[]>([]);
const loading = ref(false);
const loadError = ref("");
const keyword = ref("");
const filterStatus = ref("");
const selection = ref<Host[]>([]);

function normalizeOs(t?: string): string {
  const s = (t ?? "").toUpperCase();
  if (s.includes("WIN")) return "Windows";
  if (s.includes("LINUX")) return "Linux";
  if (s.includes("MAC")) return "macOS";
  return s || "其他";
}
function osIcon(t?: string): string {
  const s = (t ?? "").toUpperCase();
  if (s.includes("WIN")) return "🪟";
  if (s.includes("LINUX")) return "🐧";
  if (s.includes("MAC")) return "🍎";
  return "🖥️";
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
  if (keyword.value) {
    const k = keyword.value.toLowerCase();
    list = list.filter(h => h.serverHostName.toLowerCase().includes(k) || h.serverHostAddress.toLowerCase().includes(k));
  }
  return list;
});

async function fetchAll(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    hosts.value = ((await queryHosts()) ?? []).sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0));
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
const form = ref<Partial<Host>>({ serverHostName: "", serverHostAddress: "", serverHostPort: 22, serverHostOsType: "LINUX", serverHostCollectMode: "SCHEDULED" });
function openAdd(): void {
  formIsEdit.value = false;
  form.value = { serverHostName: "", serverHostAddress: "", serverHostPort: 22, serverHostOsType: "LINUX", serverHostCollectMode: "SCHEDULED" };
  formVisible.value = true;
}
async function openEdit(h: Host): Promise<void> {
  try {
    const full = await getHost(h.id);
    if (full) form.value = { ...full };
    else form.value = { ...h };
  } catch {
    form.value = { ...h };
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
  formSaving.value = true;
  try {
    await saveHost(formIsEdit.value ? form.value.id ?? null : null, form.value);
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
  <div class="as scrollable">
    <header class="as-head">
      <div>
        <h1 class="as-title">主机资产</h1>
        <div class="as-sub">统一管理可远控目标 · 完整增删改查</div>
      </div>
      <div class="as-actions">
        <el-button size="small" :loading="loading" @click="fetchAll"><el-icon v-if="!loading"><RefreshRight /></el-icon>刷新</el-button>
        <el-button type="primary" size="small" @click="openAdd">+ 新增资产</el-button>
      </div>
    </header>

    <div v-if="loadError" class="as-error">
      <span>数据加载失败：{{ loadError }}</span>
      <el-button size="small" type="primary" @click="fetchAll">重试</el-button>
    </div>

    <!-- KPI -->
    <section class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">资产总数</div><div class="kpi-value">{{ hosts.length }}</div></div>
      <div class="kpi-card"><div class="kpi-label">在线</div><div class="kpi-value ok">{{ onlineCount }}</div></div>
      <div class="kpi-card"><div class="kpi-label">离线</div><div class="kpi-value">{{ offlineCount }}</div></div>
      <div class="kpi-card"><div class="kpi-label">远控启用</div><div class="kpi-value">{{ remoteCount }}</div></div>
    </section>

    <!-- 表格 -->
    <div class="card">
      <div class="filter-bar">
        <el-input v-model="keyword" placeholder="搜索名称 / IP" clearable size="small" class="f-kw" />
        <el-select v-model="filterStatus" placeholder="状态" clearable size="small" class="f-sel">
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="远控启用" value="remote" />
        </el-select>
        <span class="f-count">{{ filtered.length }} / {{ hosts.length }}</span>
        <div class="f-ops">
          <ReButton v-if="selection.length" icon="Delete" type="danger" plain size="small" :show-text="true" @click="batchDelete">批量删除({{ selection.length }})</ReButton>
        </div>
      </div>

      <el-table :data="filtered" v-loading="loading" size="small" class="as-table" empty-text="暂无主机" @selection-change="selection = $event">
        <el-table-column type="selection" width="40" />
        <el-table-column label="名称" min-width="150">
          <template #default="{ row }">
            <div class="h-name">
              <span class="h-os">{{ osIcon(row.serverHostOsType) }}</span>
              <span class="h-name-text">{{ row.serverHostName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="地址" width="150">
          <template #default="{ row }"><span class="mono">{{ row.serverHostAddress }}:{{ row.serverHostPort }}</span></template>
        </el-table-column>
        <el-table-column label="OS" width="90">
          <template #default="{ row }"><span class="os-tag">{{ normalizeOs(row.serverHostOsType) }}</span></template>
        </el-table-column>
        <el-table-column label="协议" width="70">
          <template #default="{ row }"><span :class="['proto-tag', `proto-${protocolOf(row)}`]">{{ protocolOf(row).toUpperCase() }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <span class="st-cell"><span :class="['pdot', `pdot-${onlineState(row)}`]" />{{ onlineText(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="采集模式" width="105">
          <template #default="{ row }"><span class="mono dim">{{ row.serverHostCollectMode || "—" }}</span></template>
        </el-table-column>
        <el-table-column label="Agent" width="85">
          <template #default="{ row }"><span :class="row.serverHostAgentEnabled === 1 ? 'agent-ok' : 'dim'">{{ row.serverHostAgentEnabled === 1 ? "● 已注册" : "○ 未注册" }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="op-cell">
              <ReButton icon="Connection" :show-text="true" size="small" @click="connect(row)">连接</ReButton>
              <ReButton icon="TrendCharts" :show-text="true" size="small" @click="openDetail(row)">监控</ReButton>
              <ReButton icon="Edit" :show-text="true" size="small" @click="openEdit(row)">编辑</ReButton>
              <ReButton icon="Delete" :show-text="true" size="small" type="danger" plain @click="removeHost(row)">删除</ReButton>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="formVisible" :title="formIsEdit ? '编辑主机' : '新增主机'" width="520px">
      <el-form label-width="90px">
        <el-form-item label="名称"><el-input v-model="form.serverHostName" placeholder="如 web01" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.serverHostAddress" placeholder="IP 或域名" /></el-form-item>
        <el-form-item label="端口"><el-input-number v-model="form.serverHostPort" :min="1" :max="65535" /></el-form-item>
        <el-form-item label="系统">
          <el-select v-model="form.serverHostOsType" size="small" style="width: 100%">
            <el-option label="Linux" value="LINUX" />
            <el-option label="Windows" value="WINDOWS" />
            <el-option label="macOS" value="MACOS" />
          </el-select>
        </el-form-item>
        <el-form-item label="采集模式">
          <el-select v-model="form.serverHostCollectMode" size="small" style="width: 100%">
            <el-option label="SCHEDULED" value="SCHEDULED" />
            <el-option label="AGENT" value="AGENT" />
            <el-option label="HTTP" value="HTTP" />
            <el-option label="PROMETHEUS" value="PROMETHEUS" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="formSaving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.as { max-width: 1440px; padding: 24px; }
.as-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 20px; }
.as-title { margin: 0; font-size: 20px; font-weight: 600; line-height: 28px; }
.as-sub { margin-top: 2px; font-size: 13px; color: var(--text-tertiary); }
.as-actions { display: flex; gap: 8px; }
.as-error { display: flex; align-items: center; gap: 12px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #9b1c2e; background: #fdecef; border: 1px solid #fbc0c9; border-radius: 8px; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.kpi-card { padding: 14px 18px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: 12px; box-shadow: var(--shadow-sm); }
.kpi-label { font-size: 13px; color: var(--text-secondary); }
.kpi-value { margin-top: 2px; font-size: 26px; font-weight: 700; line-height: 32px; &.ok { color: var(--pulse-online); } }
.card { padding: 14px 16px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: 12px; box-shadow: var(--shadow-sm); }
.filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.f-kw { width: 200px; }
.f-sel { width: 120px; }
.f-count { font-size: 12px; color: var(--text-tertiary); }
.f-ops { margin-left: auto; }
.h-name { display: flex; align-items: center; gap: 8px; }
.h-os { font-size: 14px; }
.h-name-text { font-weight: 600; }
.mono { font-family: monospace; font-size: 12px; }
.dim { color: var(--text-tertiary); }
.os-tag { padding: 1px 7px; font-size: 12px; background: var(--brand-50); color: var(--brand-600); border-radius: 4px; }
.proto-tag { padding: 1px 6px; font-size: 10px; font-weight: 700; font-family: monospace; border-radius: 3px; &.proto-ssh { color: #409eff; background: rgba(64,158,255,.12); } &.proto-rdp { color: #e6a23c; background: rgba(230,162,60,.14); } &.proto-vnc { color: #9254de; background: rgba(146,84,222,.12); } }
.st-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.agent-ok { color: var(--pulse-online); font-size: 12px; }
.op-cell { display: flex; gap: 4px; }
</style>