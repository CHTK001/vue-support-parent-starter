<!-- 端点分析：操作条 + koi 令牌统计卡 / 表格壳 / 图表面板 / 空态。
     ReTable（列定义 tableColumns、9 个具名插槽、row-click）、ReEcharts 图表容器
     （durationOption / endpointTrendOption）及 script 内全部 computed 原样保留，
     刷新改由整站实时推送驱动，仅重排结构与样式。 -->
<template>
  <div class="view endpoints-page">
    <!-- 操作条：无标题大卡 -->
    <div class="view-bar">
      <span class="match-hint">
        <template v-if="keyword">命中 {{ filteredItems.length }} / {{ items.length }}</template>
        <template v-else>{{ items.length }} 个端点</template>
      </span>
      <div class="view-bar__actions">
        <ReInput
          v-model="keyword"
          placeholder="过滤端点名称…"
          clearable
          class="filter-input"
          prefix-icon="Search"
        />
        <ReButton size="small" icon="Refresh" show-text round :loading="loading" @click="load">
          刷新
        </ReButton>
      </div>
    </div>

    <!-- 统计卡：4 列网格，顶部 3px 色条 -->
    <div class="stat-grid" v-if="!loading && items.length">
      <ReStatCard
        class="stat-card stat-accent--brand"
        size="compact"
        title="总端点数"
        :value="items.length"
        :desc="`${totalCalls.toLocaleString()} 次调用`"
        :icon="DataLine"
        icon-color="var(--brand-500, var(--apm-accent))"
      />
      <ReStatCard
        class="stat-card stat-accent--info"
        size="compact"
        title="平均 P95"
        :value="avgP95 + ' ms'"
        :desc="`P99 ${avgP99} ms · Max ${maxMsAll} ms`"
        :icon="Timer"
        icon-color="var(--metric-net, var(--apm-accent-alt))"
      />
      <ReStatCard
        class="stat-card"
        :class="errorEndpoints.length ? 'stat-accent--error' : 'stat-accent--success'"
        size="compact"
        title="错误端点数"
        :value="errorEndpoints.length"
        :desc="errorEndpoints.length ? errorEndpoints.join(' · ') : '全部健康'"
        :icon="Warning"
        :icon-color="errorEndpoints.length ? 'var(--status-error, var(--apm-danger))' : 'var(--status-success, var(--apm-success))'"
      />
      <ReStatCard
        class="stat-card"
        :class="maxErrorRate > 1 ? 'stat-accent--error' : 'stat-accent--success'"
        size="compact"
        title="错误率峰值"
        :value="maxErrorRate + ' %'"
        :desc="maxErrorRateEndpoint ? `端点 ${maxErrorRateEndpoint}` : '—'"
        :icon="Warning"
        :icon-color="maxErrorRate > 5 ? 'var(--status-error, var(--apm-danger))' : maxErrorRate > 1 ? 'var(--status-warning, var(--apm-warning))' : 'var(--status-success, var(--apm-success))'"
      />
    </div>

    <!-- 加载中 -->
    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />

    <!-- 无数据时不渲染表格：el-table 的空文案撑不起留白 -->
    <div class="table-card table-card--empty" v-if="!loading && items.length && !filteredItems.length">
      <ReEmpty :image-size="72" description="没有匹配的端点">
        <el-button size="small" round @click="keyword = ''">清空过滤</el-button>
      </ReEmpty>
    </div>

    <!-- 端点表格 -->
    <div class="table-card" v-else-if="!loading || items.length">
      <ReTable
        :data="filteredItems as unknown as Record<string, unknown>[]"
        :columns="tableColumns"
        :loading="loading"
        engine="element"
        :layout-table="{ minHeight: 200 }"
        :settings="{ border: false }"
        empty-text="无匹配端点"
        @row-click="onRowClick"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      >
        <template #col-endpoint="{ row }">
          <span class="mono endpoint-text" :class="{ 'is-selected': selected?.endpoint === row.endpoint }">
            <i class="row-dot" aria-hidden="true" />
            {{ row.endpoint }}
          </span>
        </template>
        <template #col-clients="{ row }">
          <el-tooltip
            v-if="(row as unknown as ApmEndpoint).clients?.length"
            placement="top"
            :content="((row as unknown as ApmEndpoint).clients || []).join(' · ')"
          >
            <span class="mono client-cell">
              {{ (row as unknown as ApmEndpoint).clients?.[0] }}
              <i v-if="((row as unknown as ApmEndpoint).clientCount ?? 0) > 1" class="client-more">
                +{{ ((row as unknown as ApmEndpoint).clientCount ?? 0) - 1 }}
              </i>
            </span>
          </el-tooltip>
          <span v-else class="muted">—</span>
        </template>
        <template #col-callCount="{ row }">
          <span class="muted mono">{{ row.callCount.toLocaleString() }}</span>
        </template>
        <template #col-errorCount="{ row }">
          <ReTag v-if="(row as unknown as ApmEndpoint).errorCount > 0" type="danger" round size="small">
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

    <!-- 选中端点耗时分布图：ReEcharts 容器与 option 绑定原样保留 -->
    <div class="panel chart-panel" v-if="selected">
      <div class="panel-head chart-head">
        <div class="panel-head__main">
          <span class="panel-title">
            <i class="panel-dot" aria-hidden="true" />
            {{ selected.endpoint }}
          </span>
          <span class="panel-sub">
            {{ selected.callCount.toLocaleString() }} 次调用 · {{ (selected.errorRate ?? 0).toFixed(2) }} % 错误率
          </span>
        </div>
        <span class="panel-tag">耗时分布</span>
      </div>
      <ReEcharts :option="durationOption" theme="light" height="280px" class="duration-chart" />
      <div class="call-share-row" v-if="callSharePercent !== null">
        <div class="call-share-bar">
          <div class="call-share-fill" :style="{ width: callSharePercent + '%' }"></div>
        </div>
        <span class="call-share-label mono">调用量占比 {{ callSharePercent.toFixed(1) }} %</span>
      </div>
    </div>

    <!-- 端点调用量趋势（近 60 分钟，分钟桶）：ReEcharts 容器与 option 绑定原样保留 -->
    <div class="panel chart-panel">
      <div class="panel-head chart-head">
        <div class="panel-head__main">
          <span class="panel-title">{{ trendEndpointLabel }}</span>
          <span class="panel-sub">端点调用量趋势 · 近 60 分钟（分钟桶，/endpoint-stats）</span>
        </div>
        <span v-if="trendLoading" class="panel-tag is-loading">加载中…</span>
      </div>
      <ReEcharts :option="endpointTrendOption" theme="light" height="220px" class="duration-chart" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";

import { DataLine, Timer, Warning } from "@element-plus/icons-vue";
import ReInput from "@repo/ui/re-input";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReTable from "@repo/ui/re-table";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReEcharts from "@repo/ui/re-echarts";
import ReEmpty from "@repo/ui/re-empty";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { EChartsOption } from "echarts";
import { getEndpoints, getEndpointStats } from "../api/apmApi";
import type { ApmEndpoint, EndpointStatPoint } from "../api/apmApi";
import { useRealtimeEvent, useStatsChanged } from "../composables/useRealtime";
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
  { prop: "clientCount", label: "客户端", width: 110, align: "center", slot: "clients" },
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

function onRowClick(row: Record<string, unknown>) {
  selected.value = row as unknown as ApmEndpoint;
}

// 实时推送驱动（整站共用一条 WS/SSE）：列表与趋势都随 stats 事件刷新，不再 setInterval
onMounted(() => {
  load();
});

useStatsChanged(["transmissionCount"], () => {
  if (!loading.value) {
    load();
    loadEndpointTrend();
  }
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
</script>

<style scoped>
/* ========================================================
   端点分析 · koi 令牌
   颜色 / 圆角 / 阴影 / 过渡一律优先取 koi 令牌，并以本包 --apm-*
   语义令牌兜底 —— hotsport 独立运行时不加载 koi，var(--koi, fallback)
   会落到 tokens.css 里语义相同的一档，视觉不崩。
   骨架类（.view / .stat-grid / .panel / .panel-head / .panel-sub /
   .table-panel / .mono / .muted / .err-text / .warn-text）由 layout.css 提供。
   ======================================================== */
.endpoints-page {
  gap: 16px;
}

/* ---- 操作条 ---- */
.filter-input {
  width: 240px;
}

/* 访问客户端单元格：主来源 + 其余来源计数 */
.client-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-primary, var(--apm-fg));
}

.client-more {
  font-style: normal;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--text-tertiary, var(--apm-muted));
  background: var(--bg-fill, var(--apm-panel-raised));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
}

/* ---- 统计卡：4 列网格 + 顶部 3px 色条 ----
   ReStatCard 外壳来自库级 re-surface 基线，色条用伪元素叠加，
   不新增第二套卡片外壳规格。 */
.stat-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  position: relative;
  overflow: hidden;
  --card-accent: var(--brand-500, var(--apm-accent));
  transition:
    transform var(--transition-base, var(--apm-t-base)),
    box-shadow var(--transition-base, var(--apm-t-base));
}

.stat-accent--brand {
  --card-accent: var(--brand-500, var(--apm-accent));
}
.stat-accent--info {
  --card-accent: var(--metric-net, var(--apm-accent-alt));
}
.stat-accent--success {
  --card-accent: var(--status-success, var(--apm-success));
}
.stat-accent--error {
  --card-accent: var(--status-error, var(--apm-danger));
}

.stat-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--card-accent);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, var(--apm-shadow-card-hover));
}

/* ---- 表格壳 ---- */
.table-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 8px 12px 12px;
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
  overflow: hidden;
  transition: box-shadow var(--transition-base, var(--apm-t-base));
}

.table-card:hover {
  box-shadow: var(--shadow-md, var(--apm-shadow-card-hover));
}

/* 空态卡：不接收鼠标悬停的浮起，只作留白容器 */
.table-card--empty:hover {
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
}

/* 表格变量：koi 优先，apm 兜底 */
.table-card :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--bg-hover, var(--apm-panel-active));
  --el-table-border-color: var(--border-subtle, var(--apm-border-soft));
  --el-table-header-bg-color: transparent;
  --el-table-header-text-color: var(--text-tertiary, var(--apm-muted));
  --el-table-text-color: var(--text-primary, var(--apm-fg));
  --el-table-fixed-bg-color: var(--bg-container, var(--apm-panel));

  /* 端点表整表可点选，光标提示可交互 */
  cursor: pointer;
}

.table-card :deep(.el-table__header th.el-table__cell) {
  background: transparent;
  border-bottom: 1px solid var(--border-default, var(--apm-border));
}

/* 选中行：品牌色淡底，与 hover 底色区分开 */
.table-card :deep(.el-table__row.selected td) {
  background: color-mix(in srgb, var(--brand-500, var(--apm-accent)) 12%, transparent) !important;
}

.table-card :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: var(--bg-hover, var(--apm-panel-active)) !important;
}

.endpoint-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary, var(--apm-fg));
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

/* 行首状态点：选中行点亮为主题色 */
.row-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--border-default, var(--apm-border));
  transition: background var(--transition-base, var(--apm-t-base));
}

.endpoint-text.is-selected .row-dot {
  background: var(--brand-500, var(--apm-accent));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-500, var(--apm-accent)) 22%, transparent);
}

/* ---- 图表面板 ---- */
.chart-panel {
  gap: 12px;
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
  transition: box-shadow var(--transition-base, var(--apm-t-base));
}

.chart-panel:hover {
  box-shadow: var(--shadow-md, var(--apm-shadow-card-hover));
}

.chart-head {
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-head__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.panel-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, var(--apm-fg));
  word-break: break-all;
}

/* 面板标题左侧品牌色竖条：一眼区分「图表卡」与「数据卡」 */
.panel-dot {
  width: 3px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 2px;
  background: var(--brand-500, var(--apm-accent));
}

.panel-sub {
  font-size: 12px;
  color: var(--text-tertiary, var(--apm-muted));
  line-height: 1.5;
}

.panel-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: var(--brand-600, var(--apm-accent-hover));
  background: color-mix(in srgb, var(--brand-500, var(--apm-accent)) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--brand-500, var(--apm-accent)) 18%, transparent);
  border-radius: 999px;
}

.panel-tag.is-loading {
  color: var(--text-tertiary, var(--apm-muted));
  background: var(--bg-fill, var(--apm-panel-raised));
  border-color: var(--border-subtle, var(--apm-border-soft));
}

.duration-chart {
  width: 100%;
}

/* ---- 调用量占比条 ---- */
.call-share-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.call-share-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-fill, var(--apm-border-soft));
  border-radius: 999px;
  overflow: hidden;
}

.call-share-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--brand-gradient, linear-gradient(90deg, var(--apm-accent), var(--apm-accent-hover)));
  transition: width var(--transition-base, var(--apm-t-base));
}

.call-share-label {
  font-size: 12px;
  color: var(--text-tertiary, var(--apm-muted));
  white-space: nowrap;
  min-width: 120px;
  text-align: right;
}

/* ---- 响应式：≤768px 2 列统计 + 单列堆叠 ---- */
@media (max-width: 768px) {
  .filter-input {
    width: 100%;
  }

  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .table-card {
    padding: 6px 8px 10px;
  }

  .chart-panel {
    padding: 12px;
  }

  .chart-head {
    flex-direction: column;
    align-items: stretch;
  }

  .call-share-row {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .call-share-label {
    min-width: 0;
    text-align: left;
  }
}

/* ---- 尊重「减少动态效果」偏好：上浮与指标条过渡全部关掉 ---- */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .stat-card:hover,
  .table-card,
  .table-card:hover,
  .chart-panel,
  .chart-panel:hover,
  .row-dot,
  .call-share-fill {
    transition: none;
    transform: none;
  }

  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
