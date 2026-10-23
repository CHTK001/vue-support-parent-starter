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

          class="filter-input"
          prefix-icon="Search"
        />
        <span class="match-hint" v-if="keyword">命中 {{ filteredItems.length }} / {{ items.length }}</span>
      </div>
      <div class="toolbar-right">
        <ReButton icon="Refresh" show-text round :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <!-- 统计卡片行 -->
    <div class="stat-row" v-if="!loading && items.length">
      <ReStatCard
        size="compact"
        title="总端点数"
        :value="items.length"
        :desc="`${totalCalls.toLocaleString()} 次调用`"
        :icon="DataLine"
        icon-color="var(--apm-accent)"
      />
      <ReStatCard
        size="compact"
        title="平均 P95"
        :value="avgP95 + ' ms'"
        :desc="`P99 ${avgP99} ms · Max ${maxMsAll} ms`"
        :icon="Timer"
        icon-color="var(--apm-accent-alt)"
      />
      <ReStatCard
        size="compact"
        title="错误端点数"
        :value="errorEndpoints.length"
        :desc="errorEndpoints.length ? errorEndpoints.join(' · ') : '全部健康'"
        :icon="Warning"
        :icon-color="errorEndpoints.length ? 'var(--apm-danger)' : 'var(--apm-success)'"
      />
      <ReStatCard
        size="compact"
        title="错误率峰值"
        :value="maxErrorRate + ' %'"
        :desc="maxErrorRateEndpoint ? `端点 ${maxErrorRateEndpoint}` : '—'"
        :icon="Warning"
        :icon-color="maxErrorRate > 5 ? 'var(--apm-danger)' : maxErrorRate > 1 ? 'var(--apm-warning)' : 'var(--apm-success)'"
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
        :layout-table="{ minHeight: 200 }"
        empty-text="无匹配端点"
        @row-click="onRowClick"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      >
        <template #col-endpoint="{ row }">
          <span class="mono endpoint-text">{{ row.endpoint }}</span>
        </template>
        <template #col-callCount="{ row }">
          <span class="muted mono">{{ row.callCount.toLocaleString() }}</span>
        </template>
        <template #col-errorCount="{ row }">
          <ReTag v-if="(row as unknown as ApmEndpoint).errorCount > 0" type="danger" round>
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

    <!-- 端点调用量趋势（近 60 分钟，分钟桶） -->
    <div class="panel">
      <div class="panel-head">
        <span>{{ trendEndpointLabel }}</span>
        <span class="panel-sub">端点调用量趋势 · 近 60 分钟（分钟桶，/endpoint-stats）</span>
      </div>
      <ReEcharts :option="endpointTrendOption" theme="dark" height="220px" class="duration-chart" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

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
import { getEndpoints, getEndpointStats } from "../api/apmApi";
import type { ApmEndpoint, EndpointStatPoint } from "../api/apmApi";
import {
  areaGradient,
  axisTextColor,
  baseGrid,
  baseTooltip,
  categoryAxis,
  chartCanvas,
  chartColor,
  dangerColor,
  splitLineColor,
  tooltipStyle,
  valueAxis,
  warningColor,
} from "../styles/chartTheme";

const items = ref<ApmEndpoint[]>([]);
const loading = ref(false);
const trendLoading = ref(false); // 趋势图独立加载状态
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
    if (r > max) {
      max = r;
      ep = e.endpoint;
    }
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
    loadEndpointTrend();
  } catch {
    message.error("加载端点失败");
  } finally {
    loading.value = false;
  }
}

// ---- 端点调用量趋势（/endpoint-stats 分钟桶）----
const endpointStats = ref<EndpointStatPoint[]>([]);

/** 时间戳 → HH:MM（趋势图 X 轴） */
function hm(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 趋势图目标端点：选中优先，否则 Top1（调用量最大） */
function targetEndpoint(): string {
  if (selected.value?.endpoint) return selected.value.endpoint;
  if (!items.value.length) return "";
  return [...items.value].sort((a, b) => b.callCount - a.callCount)[0].endpoint;
}

const trendEndpointLabel = computed(() => {
  const ep = targetEndpoint();
  if (!ep) return "端点调用量趋势";
  return selected.value?.endpoint ? `端点趋势 · ${selected.value.endpoint}` : `端点趋势 · Top1（${ep}）`;
});

async function loadEndpointTrend() {
  trendLoading.value = true;
  try {
    endpointStats.value = (await getEndpointStats("", 60, 60)) || [];
  } catch {
    endpointStats.value = [];
  } finally {
    trendLoading.value = false;
  }
}

const endpointTrendOption = computed<EChartsOption>(() => {
  const ep = targetEndpoint();
  if (!ep) return {};
  const rows = endpointStats.value
    .filter((p) => p.endpoint === ep)
    .sort((a, b) => a.ts - b.ts);
  if (!rows.length) {
    return {
      ...chartCanvas(),
      title: {
        text: "暂无趋势数据",
        left: "center",
        top: "center",
        textStyle: { color: axisTextColor(), fontSize: 12, fontWeight: 400 },
      },
    };
  }
  return {
    ...chartCanvas(),
    grid: baseGrid({ left: 44, right: 44, top: 34 }),
    tooltip: baseTooltip(),
    legend: {
      top: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 4,
      textStyle: { color: axisTextColor(), fontSize: 11 },
    },
    xAxis: categoryAxis(rows.map((p) => hm(p.ts))),
    yAxis: [valueAxis({ minInterval: 1 }), valueAxis({ name: "ms" })],
    series: [
      {
        name: "调用量",
        type: "line",
        smooth: true,
        symbol: "none",
        data: rows.map((p) => p.callCount),
        lineStyle: { color: chartColor(0), width: 2 },
        areaStyle: { color: areaGradient(chartColor(0)) },
      },
      {
        name: "平均耗时 ms",
        type: "line",
        smooth: true,
        symbol: "none",
        yAxisIndex: 1,
        data: rows.map((p) => Number(p.avgMs.toFixed(1))),
        lineStyle: { color: warningColor(), width: 2 },
      },
    ],
  };
});

let trendTimer: number | undefined;

function onRowClick(row: Record<string, unknown>) {
  selected.value = row as unknown as ApmEndpoint;
}

onMounted(() => {
  load();
  // 复用现有 15s 轮询节奏，趋势数据随 load 追加刷新
  trendTimer = window.setInterval(loadEndpointTrend, 15000);
});

onBeforeUnmount(() => {
  if (trendTimer) window.clearInterval(trendTimer);
});

/** 耗时分布图（4 柱：avg / p95 / p99 / max）—— 颜色走 chartTheme，不硬编码 hex */
const durationOption = computed<EChartsOption>(() => {
  const ep = selected.value;
  if (!ep) return {};

  const labels = ["avg", "p95", "p99", "max"];
  const values = [ep.avgMs, ep.p95Ms, ep.p99Ms, ep.maxMs];

  return {
    ...chartCanvas(),
    grid: { left: 60, right: 30, top: 30, bottom: 40 },
    tooltip: {
      trigger: "item",
      ...tooltipStyle(),
      formatter: (p: { dataIndex: number; value: number }) =>
        `${ep.endpoint}<br/>${labels[p.dataIndex]}：<b>${(p.value ?? 0).toFixed(1)} ms</b>`,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: axisTextColor(), fontSize: 11 },
      axisLine: { lineStyle: { color: splitLineColor() } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: "ms",
      nameTextStyle: { color: axisTextColor(), fontSize: 11 },
      axisLabel: { color: axisTextColor(), fontSize: 11 },
      splitLine: { lineStyle: { color: splitLineColor(), type: "dashed" as const } },
      axisLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: labels.map((_, i) => ({
          value: values[i],
          itemStyle: {
            color: chartColor(i),
            borderRadius: [6, 6, 0, 0],
          },
        })),
        barWidth: 36,
      },
    ],
  } as EChartsOption;
});

onMounted(() => {
  load();
  // 复用现有 15s 轮询节奏，趋势数据随 load 追加刷新
  trendTimer = window.setInterval(loadEndpointTrend, 15000);
});

onBeforeUnmount(() => {
  if (trendTimer) window.clearInterval(trendTimer);
});
</script>

<style scoped>
/* 骨架、.stat-row、.panel、.panel-head、.panel-sub 由 styles/layout.css 提供 */

.filter-input {
  width: 260px;
}

.table-panel {
  overflow: hidden;
}

/* 选中行：主色淡底，与 hover 底色区分开 */
.table-panel :deep(.el-table__row.selected td) {
  background: var(--apm-accent-subtle) !important;
}

/* 端点表整表可点选，光标提示可交互 */
.table-panel :deep(.el-table__row) {
  cursor: pointer;
}

.endpoint-text {
  color: var(--apm-fg);
  font-weight: 500;
}

.duration-chart {
  width: 100%;
}

/* 调用量占比条 */
.call-share-row {
  margin-top: var(--apm-space-3);
  display: flex;
  align-items: center;
  gap: var(--apm-space-3);
}

.call-share-bar {
  flex: 1;
  height: 6px;
  background: var(--apm-border-soft);
  border-radius: 999px;
  overflow: hidden;
}

.call-share-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--apm-accent), var(--apm-accent-hover));
  transition: width var(--apm-t-base);
}

.call-share-label {
  font-size: 12px;
  color: var(--apm-muted);
  white-space: nowrap;
  min-width: 120px;
  text-align: right;
}

@media (prefers-reduced-motion: reduce) {
  .call-share-fill {
    transition: none;
  }
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
