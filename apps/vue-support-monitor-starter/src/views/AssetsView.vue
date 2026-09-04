<script setup lang="ts">
/**
 * 主机资产 v2 —— design.md §4.2
 * KPI 条 + FilterBar + 表格（名称/地址/OS/协议徽章/状态点/操作）+ 行内「连接」直达远控
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { RefreshRight } from "@element-plus/icons-vue";
import { queryHosts } from "@pages/server/src/api";

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
/** design.md §4.8：Linux→SSH、Windows→RDP、macOS→VNC */
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
    list = list.filter(
      h =>
        h.serverHostName.toLowerCase().includes(k) ||
        h.serverHostAddress.toLowerCase().includes(k),
    );
  }
  return list;
});

async function fetchAll(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    hosts.value = ((await queryHosts()) ?? []).sort(
      (a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0),
    );
  } catch (e) {
    loadError.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

/** 行内「连接」：直达远控工作区并选中该资产（design.md §4.2 一键连接） */
function connect(h: Host): void {
  router.push({ path: "/terminal", query: { hostId: String(h.id), protocol: protocolOf(h) } });
}

onMounted(fetchAll);
</script>

<template>
  <div class="as">
    <header class="as-head">
      <div>
        <h1 class="as-title">主机资产</h1>
        <div class="as-sub">统一管理可远控目标 · 行内一键连接</div>
      </div>
      <el-button size="small" :loading="loading" @click="fetchAll">
        <el-icon v-if="!loading"><RefreshRight /></el-icon>
        刷新
      </el-button>
    </header>

    <div v-if="loadError" class="as-error">
      <span>数据加载失败：{{ loadError }}</span>
      <el-button size="small" type="primary" @click="fetchAll">重试</el-button>
    </div>

    <!-- KPI -->
    <section class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">资产总数</div>
        <div class="kpi-value">{{ hosts.length }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">在线</div>
        <div class="kpi-value ok">{{ onlineCount }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">离线</div>
        <div class="kpi-value">{{ offlineCount }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">远控启用</div>
        <div class="kpi-value">{{ remoteCount }}</div>
      </div>
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
      </div>

      <el-table :data="filtered" v-loading="loading" size="small" class="as-table" empty-text="暂无主机">
        <el-table-column label="名称" min-width="160">
          <template #default="{ row }">
            <div class="h-name">
              <span class="h-os">{{ osIcon(row.serverHostOsType) }}</span>
              <span class="h-name-text">{{ row.serverHostName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="地址" width="160">
          <template #default="{ row }">
            <span class="mono">{{ row.serverHostAddress }}:{{ row.serverHostPort }}</span>
          </template>
        </el-table-column>
        <el-table-column label="OS" width="100">
          <template #default="{ row }">
            <span class="os-tag">{{ normalizeOs(row.serverHostOsType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="协议" width="80">
          <template #default="{ row }">
            <span :class="['proto-tag', `proto-${protocolOf(row)}`]">{{ protocolOf(row).toUpperCase() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span class="st-cell">
              <span :class="['pdot', `pdot-${onlineState(row)}`]" />
              {{ row.serverHostOnline === 1 ? "在线" : row.serverHostOnline === 0 ? "离线" : "未知" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="采集模式" width="110">
          <template #default="{ row }">
            <span class="mono dim">{{ row.serverHostCollectMode || "—" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Agent" width="90">
          <template #default="{ row }">
            <span :class="row.serverHostAgentEnabled === 1 ? 'agent-ok' : 'dim'">
              {{ row.serverHostAgentEnabled === 1 ? "● 已注册" : "○ 未注册" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <div class="op-cell">
              <el-button size="small" type="primary" plain @click="connect(row)">连接</el-button>
              <el-button v-if="row.serverHostRemoteEnabled" link type="primary" size="small" @click="router.push('/assets')">监控</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.as {
  max-width: 1440px;
  padding: 24px;
}
.as-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
}
.as-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}
.as-sub {
  margin-top: 2px;
  font-size: 13px;
  color: var(--text-tertiary);
}
.as-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #9b1c2e;
  background: #fdecef;
  border: 1px solid #fbc0c9;
  border-radius: 8px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.kpi-card {
  padding: 14px 18px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}
.kpi-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.kpi-value {
  margin-top: 2px;
  font-size: 26px;
  font-weight: 700;
  line-height: 32px;
  &.ok { color: var(--pulse-online); }
}

.card {
  padding: 14px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.f-kw { width: 220px; }
.f-sel { width: 130px; }
.f-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary);
}

.h-name {
  display: flex;
  align-items: center;
  gap: 8px;
}
.h-os { font-size: 14px; }
.h-name-text { font-weight: 600; }
.mono {
  font-family: monospace;
  font-size: 12px;
}
.dim { color: var(--text-tertiary); }
.os-tag {
  padding: 1px 7px;
  font-size: 12px;
  background: var(--brand-50);
  color: var(--brand-600);
  border-radius: 4px;
}
.proto-tag {
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  font-family: monospace;
  border-radius: 3px;
  &.proto-ssh { color: #409eff; background: rgba(64, 158, 255, 0.12); }
  &.proto-rdp { color: #e6a23c; background: rgba(230, 162, 60, 0.14); }
  &.proto-vnc { color: #9254de; background: rgba(146, 84, 222, 0.12); }
}
.st-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.agent-ok { color: var(--pulse-online); font-size: 12px; }
.op-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>