<!--
  服务列表 —— 对齐 SkyWalking 的 Service 列表。

  列的口径与 SkyWalking UI 一致：Apdex 以外用 SLA / CPM / 平均耗时 / P95 / P99 / 错误率。
  后端把这些值直接从 OAP 的 readMetricsValues 合并进 OtnlService，前端不再二次计算，
  只有「错误率」在后端缺失时按 calls 兜底。
-->
<template>
  <ApmGate v-slot="{ status }">
    <ReSectionHead description="服务目录与关键指标，点行下钻实例与端点">
      <template #title>服务列表</template>
      <template #actions>
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </template>
    </ReSectionHead>

    <div class="apm-bar">
      <ReInput v-model="keyword" placeholder="按服务名过滤" clearable style="width: 240px" @keyup.enter="applyFilter" />
      <ReSelect v-model="layer" :options="layerOptions" placeholder="全部层" clearable style="width: 160px" @change="applyFilter" />
      <ReButton icon="Search" type="primary" @click="applyFilter">查询</ReButton>
      <el-checkbox v-model="errorOnly" label="仅看有错误的服务" />
      <span class="apm-bar__spacer" />
      <span class="apm-count">共 {{ items.length }} 个服务 · 匹配 {{ filtered.length }} 个</span>
    </div>

    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />
    <ReTable
      v-else
      :data="filtered"
      :columns="columns"
      engine="element"
      :loading="loading"
      :settings="{ border: false }"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      empty-text="没有符合条件的服务"
      table-id="apm-services"
      class="apm-row-click"
      @row-click="onRowClick"
    >
      <template #col-name="{ row }">
        <span class="apm-mono svc-name">{{ row.name }}</span>
      </template>
      <template #col-layers="{ row }">
        <ReTag v-for="l in row.layers || []" :key="l" size="small" round style="margin-right: 4px">{{ l }}</ReTag>
        <span v-if="!(row.layers || []).length" class="apm-muted">—</span>
      </template>
      <template #col-instances="{ row }">
        <span class="apm-mono">{{ row.instances }}</span>
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

    <div v-if="!status.capabilities.includes('services')" class="apm-absent">
      <h3 class="apm-absent__title">当前引擎不支持服务目录</h3>
      <p class="apm-absent__msg">引擎 {{ status.name }} 的能力清单里没有 services。</p>
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReSectionHead from "@repo/ui/re-section-head";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import { listServices } from "../api/apmApi";
import type { ApmService } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { ROUTE_PREFIX } from "../config";
import { errorRateClass, fmtMs, fmtNum, fmtPercent, latencyClass } from "../utils/format";

const router = useRouter();
const { present, ensure } = useApmStatus();

const items = ref<ApmService[]>([]);
const loading = ref(false);
const keyword = ref("");
const layer = ref("");
const errorOnly = ref(false);

/** 层下拉：从已有数据里归纳，避免硬编码 SkyWalking 的 layer 枚举 */
const layerOptions = computed(() => {
  const set = new Set<string>();
  for (const item of items.value) {
    for (const l of item.layers ?? []) {
      set.add(l);
    }
  }
  return [{ label: "全部层", value: "" }, ...[...set].sort().map((l) => ({ label: l, value: l }))];
});

/** 前端过滤：keyword 命中服务名或分组，layer 命中层清单 */
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return items.value
    .filter((s) => {
      if (kw && !`${s.name} ${s.group ?? ""}`.toLowerCase().includes(kw)) {
        return false;
      }
      if (layer.value && !(s.layers ?? []).includes(layer.value)) {
        return false;
      }
      if (errorOnly.value && !(s.errorRate > 0)) {
        return false;
      }
      return true;
    })
    .map((s) => s as unknown as Record<string, unknown>);
});

const columns: ReTableColumn[] = [
  { prop: "name", label: "服务名", minWidth: 220, slot: "name", sortable: true },
  { prop: "layers", label: "层", width: 180, slot: "layers" },
  { prop: "instances", label: "实例数", width: 90, align: "center", slot: "instances", sortable: true },
  { prop: "calls", label: "调用量", width: 110, align: "right", slot: "calls", sortable: true },
  { prop: "avgMs", label: "平均耗时", width: 110, align: "right", slot: "avgMs", sortable: true },
  { prop: "p95Ms", label: "P95", width: 100, align: "right", slot: "p95Ms", sortable: true },
  { prop: "p99Ms", label: "P99", width: 100, align: "right", slot: "p99Ms", sortable: true },
  { prop: "errorRate", label: "错误率", width: 100, align: "right", slot: "errorRate", sortable: true },
];

/** 查询：过滤是前端的，这里只把数据取回来（SkyWalking 也没有服务端 name 过滤） */
async function applyFilter() {
  // 前端过滤即时生效，无需请求
}

/** 行点击 → 服务详情 */
function onRowClick(row: Record<string, unknown>) {
  router.push({ path: `${ROUTE_PREFIX}/services/detail`, query: { service: String(row.name ?? "") } });
}

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    items.value = (await listServices({})) || [];
  } catch (e) {
    message.error(`加载服务列表失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.svc-name {
  color: var(--text-primary, var(--el-text-color-primary));
  font-weight: 500;
}
</style>
