<script setup lang="ts">
/**
 * Redis 监控 —— design.md §4.5
 * 实例下拉 + KPI 卡 + 指标快照表。数据来自 /ms/monitor/metric/redis。
 */
import { onMounted, ref } from "vue";
import { fetchMonitors } from "../monitorApi";
import { getRedisSnapshot } from "@pages/monitor/src/api";

const instances = ref<{ id: number; monitorName: string; monitorHost: string; monitorPort: number }[]>([]);
const selected = ref<number | null>(null);
const snapshot = ref<Record<string, number>>({});
const loading = ref(false);

const CHANNEL = [
  { key: "connected_clients", label: "连接数", color: "var(--metric-cpu)" },
  { key: "used_memory_human", label: "内存", color: "var(--metric-mem)" },
  { key: "keyspace_hits_ratio", label: "命中率%", color: "var(--metric-jvm)" },
  { key: "instantaneous_ops_rate", label: "QPS", color: "var(--metric-net)" },
];

async function loadInstances(): Promise<void> {
  try {
    const m = (await fetchMonitors()) ?? [];
    instances.value = m.filter(x => String(x.serviceType).toUpperCase() === "REDIS");
    if (instances.value.length) selected.value = instances.value[0].id;
    if (selected.value) await loadSnapshot();
  } catch { /* 忽略 */ }
}
async function loadSnapshot(): Promise<void> {
  loading.value = true;
  try {
    snapshot.value = await getRedisSnapshot(selected.value!);
  } finally {
    loading.value = false;
  }
}
const fmt = (k: string): string => {
  const v = snapshot.value[k];
  if (v == null) return "—";
  if (k.includes("memory") || k.includes("used_memory")) {
    if (v >= 1073741824) return `${(v / 1073741824).toFixed(1)}G`;
    if (v >= 1048576) return `${(v / 1048576).toFixed(1)}M`;
    return `${v}B`;
  }
  return v.toLocaleString();
};
const ratio = (k: string): string => {
  const v = snapshot.value[k];
  return v == null ? "—" : `${v.toFixed(0)}%`;
};

onMounted(loadInstances);
</script>

<template>
  <div class="rd scrollable">
    <header class="rd-head">
      <div class="rd-title-wrap">
        <h1 class="rd-title">Redis 监控</h1>
        <div class="rd-sub">实例实时指标 · 1s 轮询</div>
      </div>
      <div class="rd-tool">
        <el-select v-model="selected" size="small" style="width: 260px" @change="selected != null && loadSnapshot()">
          <el-option v-for="i in instances" :key="i.id" :label="`${i.monitorName} (${i.monitorHost}:${i.monitorPort})`" :value="i.id" />
        </el-select>
        <el-button size="small" :loading="loading" @click="selected != null && loadSnapshot()">刷新</el-button>
      </div>
    </header>

    <div v-if="instances.length === 0" class="empty-card">暂无 Redis 监控实例 —— 需先创建 Redis 类型的监控项</div>

    <template v-else>
      <!-- KPI -->
      <section class="kpi-row">
        <div v-for="c in CHANNEL" :key="c.key" class="kpi-card">
          <div class="kpi-label" :style="{ color: c.color }">{{ c.label }}</div>
          <div class="kpi-value">{{ c.key.includes("ratio") ? ratio(c.key) : fmt(c.key) }}</div>
        </div>
      </section>

      <!-- 全量指标快照 -->
      <div class="card">
        <div class="card-title">指标快照</div>
        <el-table :data="Object.entries(snapshot).map(([key, value]) => ({ key, value }))" size="small" empty-text="暂无指标数据">
          <el-table-column prop="key" label="指标名" min-width="240">
            <template #default="{ row }"><span class="mono">{{ row.key }}</span></template>
          </el-table-column>
          <el-table-column label="值">
            <template #default="{ row }"><span class="mono strong">{{ fmt(row.key) }}</span></template>
          </el-table-column>
        </el-table>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.rd { max-width: 1440px; padding: 24px; }
.rd-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 20px; }
.rd-title { margin: 0; font-size: 20px; font-weight: 600; }
.rd-sub { margin-top: 2px; font-size: 13px; color: var(--text-tertiary); }
.rd-tool { display: flex; gap: 8px; }
.empty-card { padding: 48px; text-align: center; color: var(--text-tertiary); background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: 12px; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.kpi-card { padding: 14px 18px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: 12px; box-shadow: var(--shadow-sm); }
.kpi-label { font-size: 13px; }
.kpi-value { margin-top: 4px; font-size: 26px; font-weight: 700; }
.card { padding: 14px 16px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: 12px; box-shadow: var(--shadow-sm); }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.mono { font-family: monospace; font-size: 12px; }
.strong { font-weight: 600; font-size: 13px; }
</style>