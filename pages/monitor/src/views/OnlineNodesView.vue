<script setup lang="ts">
/**
 * 节点管理 —— 在线节点
 *
 * 展示通过 monitor 的 report 客户端（sync/client/register + monitor/app/report）
 * 注册上来的节点；在线状态由 sync 服务端连接会话判定。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { Refresh } from "@element-plus/icons-vue";
import {
  getMonitorNodes,
  getMonitorNodeStats,
  type MonitorNode,
  type MonitorNodeStats,
} from "../api/monitorNodesApi";

defineOptions({ name: "OnlineNodes" });

const loading = ref(false);
const nodes = ref<MonitorNode[]>([]);
const stats = ref<MonitorNodeStats>({ total: 0, online: 0, offline: 0 });
const keyword = ref("");
const statusFilter = ref<"online" | "all" | "offline">("online");

const rows = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return nodes.value.filter((n) => {
    if (statusFilter.value === "online" && !n.online) return false;
    if (statusFilter.value === "offline" && n.online) return false;
    if (!kw) return true;
    return [n.applicationName, n.hostname, n.ipAddress, n.serviceUrl, n.activeProfiles]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(kw));
  });
});

function timeText(ms?: number | null): string {
  if (!ms) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function addressText(n: MonitorNode): string {
  if (!n.ipAddress) return "—";
  return n.port ? `${n.ipAddress}:${n.port}` : n.ipAddress;
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    const [list, stat] = await Promise.all([
      getMonitorNodes(),
      getMonitorNodeStats().catch(() => null),
    ]);
    nodes.value = list ?? [];
    if (stat) stats.value = stat;
    else recomputeStats();
  } catch (e) {
    nodes.value = [];
    recomputeStats();
    message.error(`在线节点加载失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}

function recomputeStats(): void {
  const online = nodes.value.filter(n => n.online).length;
  stats.value = { total: nodes.value.length, online, offline: nodes.value.length - online };
}

onMounted(load);
</script>

<template>
  <div class="nodes-page">
    <div class="card nodes-hero">
      <div class="page-header">
        <div>
          <h1 class="page-title">在线节点</h1>
          <p class="page-desc">monitor report 客户端注册节点 · 服务发现数据源</p>
        </div>
        <div class="page-actions">
          <el-button :loading="loading" @click="load">
            <el-icon><Refresh /></el-icon>
            <span>刷新</span>
          </el-button>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num ok">{{ stats.online }}</div>
        <div class="stat-label">在线节点</div>
      </div>
      <div class="stat-card">
        <div class="stat-num muted">{{ stats.offline }}</div>
        <div class="stat-label">离线节点</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-label">注册总数</div>
      </div>
    </div>

    <div class="card nodes-main">
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="应用名 / 主机 / IP / 服务地址"
          clearable
          style="width: 280px"
          @keyup.enter="load"
          @clear="load"
        />
        <el-select v-model="statusFilter" style="width: 130px">
          <el-option label="在线" value="online" />
          <el-option label="全部" value="all" />
          <el-option label="离线" value="offline" />
        </el-select>
        <span class="filter-count">共 {{ rows.length }} 条</span>
      </div>

      <el-table v-loading="loading" :data="rows" row-key="clientId" border empty-text="暂无注册节点">
        <el-table-column prop="applicationName" label="应用名" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.applicationName || "—" }}</template>
        </el-table-column>
        <el-table-column prop="hostname" label="主机名" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.hostname || "—" }}</template>
        </el-table-column>
        <el-table-column label="地址" min-width="160">
          <template #default="{ row }">{{ addressText(row) }}</template>
        </el-table-column>
        <el-table-column prop="serviceUrl" label="服务地址" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.serviceUrl || "—" }}</template>
        </el-table-column>
        <el-table-column prop="activeProfiles" label="环境" width="110">
          <template #default="{ row }">{{ row.activeProfiles || "—" }}</template>
        </el-table-column>
        <el-table-column prop="javaVersion" label="Java" width="110">
          <template #default="{ row }">{{ row.javaVersion || "—" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'" effect="plain">{{ row.online ? "在线" : "离线" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后心跳" width="180">
          <template #default="{ row }">{{ timeText(row.lastHeartbeat) }}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">{{ timeText(row.registerTime) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.nodes-page {
  padding: 4px 0;
}
.nodes-hero {
  margin-bottom: 16px;
}
.nodes-main {
  margin-bottom: 16px;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.page-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}
.stat-num {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.stat-num.ok { color: var(--el-color-success); }
.stat-num.muted { color: var(--el-text-color-secondary); }
.stat-label {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.filter-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
