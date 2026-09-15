<template>
  <div class="view">
    <!-- 顶部工具栏 -->
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">端点分析</span>
        <ReInput
          v-model="keyword"
          placeholder="过滤端点名称…"
          clearable
          size="small"
          class="filter-input"
          prefix-icon="Search"
        />
        <span class="match-hint" v-if="keyword">命中 {{ filteredItems.length }} / {{ items.length }}</span>
      </div>
      <div class="toolbar-right">
        <ReButton icon="Refresh" show-text size="small" round :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <!-- 统计卡片行 -->
    <div class="stat-row" v-if="!loading && items.length">
      <ReStatCard
        title="总端点数"
        :value="items.length"
        :desc="`${totalCalls.toLocaleString()} 次调用`"
        :icon="DataLine"
        icon-color="#3b82f6"
      />
      <ReStatCard
        title="平均 P95"
        :value="avgP95 + ' ms'"
        :desc="`P99 ${avgP99} ms · Max ${maxMsAll} ms`"
        :icon="Timer"
        icon-color="#8b5cf6"
      />
      <ReStatCard
        title="错误端点数"
        :value="errorEndpoints.length"
        :desc="errorEndpoints.length ? errorEndpoints.join(' · ') : '全部健康'"
        :icon="Warning"
        :icon-color="errorEndpoints.length ? '#ef4444' : '#22c55e'"
      />
      <ReStatCard
        title="错误率峰值"
        :value="maxErrorRate + ' %'"
        :desc="maxErrorRateEndpoint ? `端点 ${maxErrorRateEndpoint}` : '—'"
        :icon="Warning"
        :icon-color="maxErrorRate > 5 ? '#ef4444' : maxErrorRate > 1 ? '#f59e0b' : '#22c55e'"
      />
    </div>

    <!-- 加载中 -->
    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />

    <!-- 端点表格 -->
    <div class="table-panel" v-if="!loading || items.length">
      <ReTable
        :data="filteredItems as unknown as Record<string, unknown>[]"
        :columns="tableColumns"
        :loading="loading"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 200 }"
        empty-text="无匹配端点"
        @row-click="onRowClick"
      >
        <template #col-endpoint="{ row }">
          <span class="mono endpoint-text">{{ row.endpoint }}</span>
        </template>
        <template #col-callCount="{ row }">
          <span class="muted mono">{{ row.callCount.toLocaleString() }}</span>
        </template>
        <template #col-errorCount="{ row }">
          <ReTag v-if="(row as unknown as ApmEndpoint).errorCount > 0" type="danger" size="small" round>
            {{ (row as unknown as ApmEndpoint).errorCount }}
          </ReTag>
          <span v-else class="muted mono">0</span>
        </template>
        <template #col-errorRate="{ row }">
          <span :class="{ 'err-text': (row as unknown as ApmEndpoint).errorRate > 5, 'warn-text': (row as unknown as ApmEndpoint).errorRate > 1 && (row as unknown as ApmEndpoint).errorRate <= 5 }">
            {{ ((row as unknown as ApmEndpoint).errorRate ?? 0).toFixed(2) }} %
          </span>
        </template>
        <template #col-avgMs="{ row }">
          <span class="mono">{{ ((row as unknown as ApmEndpoint).avgMs ?? 0).toFixed(1) }}</span>
        </template>
        <template #col-p95Ms="{ row }">
          <span class="mono muted">{{ ((row as unknown as ApmEndpoint).p95Ms ?? 0).toFixed(1) }}</span>
        </template>
        <template #col-p99Ms="{ row }">
          <span class="mono muted">{{ ((row as unknown as ApmEndpoint).p99Ms ?? 0).toFixed(1) }}</span>
        </template>
        <template #col-maxMs="{ row }">
          <span class="mono" :class="{ 'err-text': (row as unknown as ApmEndpoint).maxMs > 2000 }">
            {{ ((row as unknown as ApmEndpoint).maxMs ?? 0).toFixed(0) }}
          </span>
        </template>
      </ReTable>
    </div>

    <!-- 选中端点耗时分布图 -->
    <div class="panel" v-if="selected">
      <div class="panel-head">
        <span>{{ selected.endpoint }}</span>
        <span class="panel-sub">
          {{ selected.callCount.toLocaleString() }} 次调用 · {{ (selected.errorRate ?? 0).toFixed(2) }} % 错误率
        </span>
      </div>
      <ReEcharts :option="durationOption" theme="dark" height="280px" class="duration-chart" />
      <div class="call-share-row" v-if="callSharePercent !== null">
        <div class="call-share-bar">
          <div class="call-share-fill" :style="{ width: callSharePercent + '%' }"></div>
        </div>
        <span class="call-share-label mono">调用量占比 {{ callSharePercent.toFixed(1) }} %</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { DataLine, Timer, Warning } from "@element-plus/icons-vue";
import ReInput from "@repo/ui/re-input";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReTable from "@repo/ui/re-table";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReEcharts from "@repo/ui/re-echarts";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { EChartsOption } from "echarts";
import { getEndpoints } from "../api/apmApi";
import type { ApmEndpoint } from "../api/apmApi";

const items = ref<ApmEndpoint[]>([]);
const loading = ref(false);
const keyword = ref("");
const selected = ref<ApmEndpoint | null>(null);

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return items.value;
  return items.value.filter((e) => e.endpoint.toLowerCase().includes(kw));
});

// 聚合统计
const totalCalls = computed(() => items.value.reduce((acc, e) => acc + e.callCount, 0));
const avgP95 = computed(() => {
  if (!items.value.length) return 0;
  return Math.round(items.value.reduce((acc, e) => acc + e.p95Ms, 0) / items.value.length);
});
const avgP99 = computed(() => {
  if (!items.value.length) return 0;
  return Math.round(items.value.reduce((acc, e) => acc + e.p99Ms, 0) / items.value.length);
});
const maxMsAll = computed(() =>
  items.value.length ? Math.max(...items.value.map((e) => e.maxMs)) : 0,
);
const errorEndpoints = computed(() =>
  items.value.filter((e) => e.errorCount > 0).map((e) => e.endpoint),
);
const maxErrorRate = computed(() =>
  items.value.length ? Math.max(...items.value.map((e) => e.errorRate ?? 0)) : 0,
);
const maxErrorRateEndpoint = computed(() => {
  let max = 0;
  let ep = "";
  for (const e of items.value) {
    const r = e.errorRate ?? 0;
    if (r > max) { max = r; ep = e.endpoint; }
  }
  return ep;
});

const callSharePercent = computed(() => {
  if (!selected.value || !totalCalls.value) return null;
  return (selected.value.callCount / totalCalls.value) * 100;
});

const tableColumns: ReTableColumn[] = [
  { prop: "endpoint", label: "端点", minWidth: 220, slot: "endpoint" },
  { prop: "callCount", label: "调用量", width: 100, align: "right", slot: "callCount" },
  { prop: "errorCount", label: "错误数", width: 90, align: "center", slot: "errorCount" },
  { prop: "errorRate", label: "错误率 %", width: 90, align: "center", slot: "errorRate" },
  { prop: "avgMs", label: "平均 ms", width: 90, align: "right", slot: "avgMs" },
  { prop: "p95Ms", label: "P95 ms", width: 90, align: "right", slot: "p95Ms" },
  { prop: "p99Ms", label: "P99 ms", width: 90, align: "right", slot: "p99Ms" },
  { prop: "maxMs", label: "最大 ms", width: 90, align: "right", slot: "maxMs" },
];

async function load() {
  loading.value = true;
  selected.value = null;
  try {
    items.value = await getEndpoints(50);
  } catch {
    ElMessage.error("加载端点失败");
  } finally {
    loading.value = false;
  }
}

function onRowClick(row: Record<string, unknown>) {
  selected.value = row as unknown as ApmEndpoint;
}

// 耗时分布图（4 柱：avg / p95 / p99 / max）
const DURATION_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

const durationOption = computed<EChartsOption>(() => {
  const ep = selected.value;
  if (!ep) return {};

  const labels = ["avg", "p95", "p99", "max"];
  const values = [ep.avgMs, ep.p95Ms, ep.p99Ms, ep.maxMs];

  return {
    backgroundColor: "transparent",
    grid: { left: 60, right: 30, top: 30, bottom: 40 },
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(19,26,43,0.95)",
      borderColor: "rgba(255,255,255,0.1)",
      textStyle: { color: "#e6edf7", fontSize: 12 },
      formatter: (p: { dataIndex: number; value: number }) =>
        `${ep.endpoint}<br/>${labels[p.dataIndex]}：<b>${(p.value ?? 0).toFixed(1)} ms</b>`,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: "rgba(230,237,247,0.55)", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: "ms",
      nameTextStyle: { color: "rgba(230,237,247,0.5)", fontSize: 11 },
      axisLabel: { color: "rgba(230,237,247,0.55)", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      axisLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: labels.map((_, i) => ({
          value: values[i],
          itemStyle: { color: DURATION_COLORS[i], borderRadius: [6, 6, 0, 0] },
        })),
        barWidth: 36,
      },
    ],
  } as EChartsOption;
});

onMounted(load);
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
}

.filter-input {
  width: 260px;
}

.match-hint {
  font-size: 12px;
  color: var(--apm-muted);
  white-space: nowrap;
}

/* 统计卡片行 */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-row :deep(.re-stat-card) {
  background: var(--apm-panel, #131a2b);
  border: 1px solid var(--apm-border, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
}

.stat-row :deep(.re-stat-card .re-stat-card__title) {
  color: var(--apm-muted, rgba(230, 237, 247, 0.55));
}

.stat-row :deep(.re-stat-card .re-stat-card__value) {
  color: var(--apm-fg, #e6edf7);
  font-variant-numeric: tabular-nums;
}

.stat-row :deep(.re-stat-card .re-stat-card__desc) {
  color: var(--apm-muted, rgba(230, 237, 247, 0.55));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 表格面板 */
.table-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 14px;
  padding: 8px;
}

.table-panel :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.03);
  --el-table-text-color: var(--apm-fg);
  --el-table-header-text-color: var(--apm-muted);
}

.table-panel :deep(.el-table__row.selected td) {
  background: rgba(59, 130, 246, 0.08) !important;
}

.endpoint-text {
  color: var(--apm-fg);
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
}

.muted {
  color: var(--apm-muted);
}

.err-text {
  color: var(--apm-danger);
}

.warn-text {
  color: var(--apm-warning);
}

/* 耗时分布面板 */
.panel {
  background: var(--apm-panel, #131a2b);
  border: 1px solid var(--apm-border, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  padding: 16px;
}

.panel-head {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--apm-fg, #e6edf7);
}

.panel-sub {
  font-size: 12px;
  color: var(--apm-muted, rgba(230, 237, 247, 0.55));
  font-weight: 400;
}

.duration-chart {
  width: 100%;
}

/* 调用量占比条 */
.call-share-row {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.call-share-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.call-share-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.call-share-label {
  font-size: 12px;
  color: var(--apm-muted);
  white-space: nowrap;
  min-width: 120px;
  text-align: right;
}

@media (max-width: 1100px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stat-row {
    grid-template-columns: 1fr;
  }
}
</style>
