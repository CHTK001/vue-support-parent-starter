<!--
  端点分析 —— 对齐 SkyWalking 的 Endpoint 列表。

  与「服务详情里的端点表」的区别：这里是跨服务的端点汇总，
  用于回答「整个系统里哪几个端点最慢 / 最常错」，所以按服务+关键词检索，
  并按调用量、耗时、错误率排序（前端排序）。
-->
<template>
  <ApmGate v-slot="{ status }">
    <ReSectionHead description="跨服务端点汇总，按耗时与错误率定位热点">
      <template #title>端点分析</template>
      <template #actions>
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </template>
    </ReSectionHead>

    <div class="apm-bar">
      <ReSelect
        v-model="service"
        :options="serviceOptions"
        placeholder="全部服务"
        clearable
        filterable
        style="width: 240px"
        @change="load"
      />
      <ReInput
        v-model="keyword"
        placeholder="按端点名过滤"
        clearable
        style="width: 260px"
        @keyup.enter="load"
      />
      <ReButton icon="Search" type="primary" :loading="loading" @click="load">查询</ReButton>
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ endpoints.length }} 个端点</span>
    </div>

    <div class="apm-grid">
      <ReStatCard
        size="compact"
        title="端点数"
        :value="endpoints.length"
        desc="当前条件下"
        :icon="Aim"
        icon-color="var(--el-color-primary)"
      />
      <ReStatCard
        size="compact"
        title="总调用量"
        :value="fmtNum(totalCalls)"
        desc="端点调用量合计"
        :icon="Histogram"
        icon-color="var(--el-color-primary)"
      />
      <ReStatCard
        size="compact"
        title="最慢 P99"
        :value="slowest ? fmtMs(slowest.p99Ms) : '—'"
        :desc="slowest?.name || '暂无数据'"
        :icon="Timer"
        icon-color="var(--el-color-warning)"
      />
      <ReStatCard
        size="compact"
        title="错误率最高"
        :value="worst ? fmtPercent(worst.errorRate) : '—'"
        :desc="worst?.name || '暂无数据'"
        :icon="Warning"
        icon-color="var(--el-color-danger)"
      />
    </div>

    <ReSkeleton v-if="loading && !endpoints.length" :rows="8" animated />
    <ReTable
      v-else
      :data="rows"
      :columns="columns"
      engine="element"
      :loading="loading"
      :settings="{ border: false }"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      empty-text="没有符合条件的端点"
      table-id="apm-endpoints"
    >
      <template #col-serviceName="{ row }">
        <span class="apm-muted apm-mono">{{ row.serviceName }}</span>
      </template>
      <template #col-name="{ row }">
        <span class="apm-mono">{{ row.name }}</span>
      </template>
      <template #col-calls="{ row }">
        <span class="apm-mono">{{ fmtNum(row.calls) }}</span>
      </template>
      <template #col-avgMs="{ row }">
        <span class="apm-mono" :class="latencyClass(row.avgMs)">{{ fmtMs(row.avgMs) }}</span>
      </template>
      <template #col-p95Ms="{ row }">
        <span class="apm-mono" :class="latencyClass(row.p95Ms)">{{ fmtMs(row.p95Ms) }}</span>
      </template>
      <template #col-p99Ms="{ row }">
        <span class="apm-mono" :class="latencyClass(row.p99Ms)">{{ fmtMs(row.p99Ms) }}</span>
      </template>
      <template #col-errorRate="{ row }">
        <span class="apm-mono" :class="errorRateClass(row.errorRate)">{{ fmtPercent(row.errorRate) }}</span>
      </template>
    </ReTable>

    <div v-if="!status.capabilities.includes('endpoints')" class="apm-muted">
      引擎 {{ status.name }} 不支持端点查询。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { Aim, Histogram, Search, Timer, Warning } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReSectionHead from "@repo/ui/re-section-head";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import { listEndpoints, listServices } from "../api/apmApi";
import type { ApmEndpoint } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { errorRateClass, fmtMs, fmtNum, fmtPercent, latencyClass } from "../utils/format";

const { present, ensure } = useApmStatus();

const endpoints = ref<ApmEndpoint[]>([]);
const services = ref<string[]>([]);
const service = ref("");
const keyword = ref("");
const loading = ref(false);

const rows = computed(() => endpoints.value as unknown as Record<string, unknown>[]);
const serviceOptions = computed(() => services.value.map((s) => ({ label: s, value: s })));
const totalCalls = computed(() => endpoints.value.reduce((sum, e) => sum + (e.calls || 0), 0));
const slowest = computed<ApmEndpoint | null>(() =>
  endpoints.value.length ? [...endpoints.value].sort((a, b) => (b.p99Ms || 0) - (a.p99Ms || 0))[0] : null,
);
const worst = computed<ApmEndpoint | null>(() =>
  endpoints.value.length ? [...endpoints.value].sort((a, b) => (b.errorRate || 0) - (a.errorRate || 0))[0] : null,
);

const columns: ReTableColumn[] = [
  { prop: "serviceName", label: "服务", width: 180, slot: "serviceName" },
  { prop: "name", label: "端点", minWidth: 320, slot: "name" },
  { prop: "calls", label: "调用量", width: 110, align: "right", slot: "calls", sortable: true },
  { prop: "avgMs", label: "平均耗时", width: 110, align: "right", slot: "avgMs", sortable: true },
  { prop: "p95Ms", label: "P95", width: 100, align: "right", slot: "p95Ms", sortable: true },
  { prop: "p99Ms", label: "P99", width: 100, align: "right", slot: "p99Ms", sortable: true },
  { prop: "errorRate", label: "错误率", width: 100, align: "right", slot: "errorRate", sortable: true },
];

/**
 * 加载端点。
 *
 * 有服务时查该服务的端点（OAP 的端点查询必须带服务名）；
 * 没选服务时按服务逐个查，用并发上限 6 收住 —— 服务数上百时一把并发会把 OAP 打满，
 * 而串行又慢到不可用。
 */
async function loadEndpoints() {
  if (service.value) {
    return (await listEndpoints(service.value, keyword.value || undefined, {})) || [];
  }
  const names = services.value.length ? services.value : [];
  const out: ApmEndpoint[] = [];
  const concurrency = 6;
  for (let i = 0; i < names.length; i += concurrency) {
    const batch = names.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((name) =>
        listEndpoints(name, keyword.value || undefined, {}).catch(() => [] as ApmEndpoint[]),
      ),
    );
    for (const list of results) {
      out.push(...list);
    }
  }
  return out;
}

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    endpoints.value = await loadEndpoints();
  } catch (e) {
    endpoints.value = [];
    message.error(`加载端点失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

async function loadServices() {
  try {
    services.value = ((await listServices({})) || []).map((s) => s.name);
  } catch {
    services.value = [];
  }
}

onMounted(async () => {
  await loadServices();
  load();
});
</script>
