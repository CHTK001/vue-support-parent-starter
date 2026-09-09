<script setup lang="ts">
/**
 * Redis 监控 —— 读取当前系统自身连接的 Redis（INFO 指标），与监控资产/Agent 无关。
 * 数据来源：GET /ms/monitor/system/redis-info
 */
import { computed, onMounted, ref } from "vue";
import { fetchSystemRedisInfo, type SystemRedisInfo } from "../monitorApi";

const info = ref<SystemRedisInfo | null>(null);
const loading = ref(false);
const failed = ref(false);

/** 连接状态（无 Redis 或后端未部署实时数据时为兜底态） */
const available = computed(() => !!(info.value && Object.keys(info.value).length > 0));

const CHANNEL = [
  { key: "connected_clients", label: "连接数", icon: "Link", ic: "var(--metric-cpu)" },
  { key: "used_memory", label: "内存", icon: "Coin", ic: "var(--metric-mem)" },
  { key: "hit_rate", label: "命中率%", icon: "Aim", ic: "var(--metric-jvm)" },
  { key: "instantaneous_ops_per_sec", label: "QPS", icon: "Lightning", ic: "var(--metric-net)" },
];

async function load(): Promise<void> {
  loading.value = true;
  failed.value = false;
  try {
    info.value = await fetchSystemRedisInfo();
    if (!info.value) failed.value = true;
  } catch {
    failed.value = true;
    info.value = null;
  } finally {
    loading.value = false;
  }
}

const memValue = (v?: number): string => {
  if (v == null) return "—";
  if (v >= 1073741824) return `${(v / 1073741824).toFixed(1)}G`;
  if (v >= 1048576) return `${(v / 1048576).toFixed(1)}M`;
  return `${v}B`;
};

const hitRate = (): string => {
  const hits = Number(info.value?.keyspace_hits ?? 0);
  const misses = Number(info.value?.keyspace_misses ?? 0);
  if (hits + misses <= 0) return "—";
  return `${((hits * 100) / (hits + misses)).toFixed(1)}%`;
};

const num = (k: string, v?: number): string => {
  if (v == null) return "—";
  if (k === "used_memory" || k.includes("memory")) return memValue(v);
  return v.toLocaleString();
};

const snapshotEntries = computed(() => {
  const src = info.value ?? {};
  return Object.entries(src)
    .filter(([k]) => !["os", "redis_version", "role", "config_file"].includes(k))
    .map(([k, v]) => ({ key: k, value: String(v ?? "") }));
});

const snapshotColumns = computed(() => [
  { prop: "key", label: "指标名", minWidth: 240, slot: "key" },
  { prop: "value", label: "值", slot: "value" },
]);

onMounted(load);
</script>

<template>
  <div class="rd">
    <ReSectionHead :description="available ? '当前应用连接中的 Redis · INFO 实时指标' : '当前系统未配置 Redis'" :loading="loading">
      <template #title>Redis 监控</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">刷新</ReButton>
      </template>
    </ReSectionHead>

    <ReEmpty v-if="failed || !available" description="当前系统未连接 Redis（或后端未就绪），无指标可展示" style="padding: 48px 0">
      <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">刷新</ReButton>
    </ReEmpty>

    <template v-else>
      <!-- KPI -->
      <section class="kpi-row cols-4">
        <ReStatCard
          v-for="c in CHANNEL"
          :key="c.key"
          :title="c.label"
          :icon="c.icon"
          :icon-color="c.ic"
          :value="c.key === 'hit_rate' ? hitRate() : num(c.key, Number((info as any)?.[c.key] ?? 0))"
        />
      </section>

      <!-- 指标快照 -->
      <ReCard :radius="12" shadow="never">
        <template #header><span class="card-h">指标快照</span></template>
        <ReTable :data="snapshotEntries" :columns="snapshotColumns" size="small" empty-text="暂无指标数据" table-id="monitor-redis">
          <template #col-key="{ row }"><span class="mono">{{ row.key }}</span></template>
          <template #col-value="{ row }"><span class="mono strong">{{ row.value }}</span></template>
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