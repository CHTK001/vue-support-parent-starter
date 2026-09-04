<script setup lang="ts">
/**
 * Redis 监控 —— ReSectionHead + ReStatCard + ReCard 实例 + 指标快照表
 */
import { computed, onMounted, ref } from "vue";
import { fetchMonitors } from "../monitorApi";
import { getRedisSnapshot } from "@pages/monitor/src/api";

const instances = ref<{ id: number; monitorName: string; monitorHost: string; monitorPort: number }[]>([]);
const selected = ref<number | null>(null);
const snapshot = ref<Record<string, number>>({});
const loading = ref(false);

const CHANNEL = [
  { key: "connected_clients", label: "连接数", icon: "Link", ic: "var(--metric-cpu)" },
  { key: "used_memory", label: "内存", icon: "Coin", ic: "var(--metric-mem)" },
  { key: "keyspace_hits_ratio", label: "命中率%", icon: "Aim", ic: "var(--metric-jvm)" },
  { key: "instantaneous_ops_rate", label: "QPS", icon: "Lightning", ic: "var(--metric-net)" },
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
  try { snapshot.value = await getRedisSnapshot(selected.value!); }
  finally { loading.value = false; }
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

/** ReTable 列（指标快照） */
const snapshotColumns = computed(() => [
  { prop: "key", label: "指标名", minWidth: 240, slot: "key" },
  { prop: "value", label: "值", slot: "value" },
]);

onMounted(loadInstances);
</script>

<template>
  <div class="rd">
    <ReSectionHead :description="instances.length ? `${instances.length} 个实例 · 选取点指标` : '请先创建 Redis 类型的监控项'">
      <template #title>Redis 监控</template>
      <template #actions>
        <ReSelect v-model="selected" size="small" style="width: 240px" @change="selected != null && loadSnapshot()">
          <el-option v-for="i in instances" :key="i.id" :label="`${i.monitorName} (${i.monitorHost}:${i.monitorPort})`" :value="i.id" />
        </ReSelect>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="selected != null && loadSnapshot()">刷新</ReButton>
      </template>
    </ReSectionHead>

    <ReEmpty v-if="instances.length === 0" description="暂无 Redis 监控实例" style="padding: 48px 0" />

    <template v-else>
      <!-- KPI -->
      <section class="kpi-row cols-4">
        <ReStatCard v-for="c in CHANNEL" :key="c.key" :title="c.label" :icon="c.icon" :icon-color="c.ic" :value="c.key.includes('ratio') ? ratio(c.key) : fmt(c.key)" />
      </section>

      <!-- 指标快照 -->
      <ReCard :radius="12" shadow="never">
        <template #header><span class="card-h">指标快照</span></template>
        <ReTable :data="Object.entries(snapshot).map(([k, v]) => ({ key: k, value: v }))" :columns="snapshotColumns" size="small" empty-text="暂无指标数据" table-id="monitor-redis">
          <template #col-key="{ row }"><span class="mono">{{ row.key }}</span></template>
          <template #col-value="{ row }"><span class="mono strong">{{ fmt(row.key) }}</span></template>
        </ReTable>
      </ReCard>
    </template>
  </div>
</template>

<style scoped lang="scss">
.card-h { font-size: 15px; font-weight: 600; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.mono { font-family: monospace; font-size: 12px; }
.strong { font-weight: 600; font-size: 13px; }
</style>