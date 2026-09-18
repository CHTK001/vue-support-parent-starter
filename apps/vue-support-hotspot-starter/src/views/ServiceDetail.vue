<template>
  <div class="view">
    <!-- 顶部工具栏 -->
    <div class="view-toolbar">
      <div class="toolbar-left">
        <ReButton size="small" icon="ArrowLeft" show-text @click="goBack">返回</ReButton>
        <ReTag v-if="service" type="info" size="small" round>
          <code class="mono">{{ service }}</code>
        </ReTag>
      </div>
      <div class="toolbar-right">
        <ReButton size="small" icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <!-- 缺参空态 -->
    <ReEmpty v-if="!service" description="缺少 service 参数，请从服务列表进入" />

    <!-- 加载中 -->
    <ReSkeleton v-else-if="loading && !detail" :rows="8" animated />

    <!-- 主内容 -->
    <template v-else-if="detail">
      <!-- 统计卡片行 -->
      <div class="stat-row">
        <ReStatCard
          title="总调用量"
          :value="detail.callCount.toLocaleString()"
          :desc="`${detail.errorCount.toLocaleString()} 次错误`"
          :icon="DataLine"
          icon-color="#3b82f6"
        />
        <ReStatCard
          title="错误率"
          :value="detail.errorRatePercent.toFixed(2) + ' %'"
          :desc="`avg ${detail.avgMs} ms · max ${detail.maxMs} ms`"
          :icon="Warning"
          :icon-color="detail.errorRatePercent > 5 ? '#ef4444' : detail.errorRatePercent > 1 ? '#f59e0b' : '#22c55e'"
        />
        <ReStatCard
          title="P95 耗时"
          :value="detail.p95Ms + ' ms'"
          :desc="`P99 ${detail.p99Ms} ms`"
          :icon="Timer"
          icon-color="#8b5cf6"
        />
        <ReStatCard
          title="端点数"
          :value="detail.endpointCount"
          :desc="`独立端点（protocol + operation）`"
          :icon="Connection"
          icon-color="#22c55e"
        />
      </div>

      <!-- 端点明细 + 调用趋势 并排 -->
      <div class="two-col">
        <div class="panel table-panel">
          <div class="panel-head">
            <span>端点明细</span>
            <span class="panel-sub">端点聚合 · Top 50</span>
          </div>
          <ReTable
            :data="endpoints as unknown as Record<string, unknown>[]"
            :columns="tableColumns"
            :loading="endpointLoading"
            :pagination="false"
            :toolbar="false"
            :layout-table="{ minHeight: 200 }"
            empty-text="该服务暂无端点数据"
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

        <div class="panel">
          <div class="panel-head">
            <span>调用趋势</span>
            <span class="panel-sub">近 60 分钟 · 全部端点聚合（分钟桶）</span>
          </div>
          <ReEcharts :option="trendOption" theme="dark" height="320px" class="trend-chart" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { DataLine, Timer, Warning, Connection } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReEmpty from "@repo/ui/re-empty";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTable from "@repo/ui/re-table";
import ReEcharts from "@repo/ui/re-echarts";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getEndpoints, getEndpointStats, getServiceDetail } from "../api/apmApi";
import type { ApmEndpoint, EndpointStatPoint, ServiceDetail } from "../api/apmApi";
import type { EChartsOption } from "echarts";

const route = useRoute();
const router = useRouter();

const service = computed(() => String(route.query.service ?? ""));

const detail = ref<ServiceDetail | null>(null);
const loading = ref(false);
const endpoints = ref<ApmEndpoint[]>([]);
const endpointLoading = ref(false);
const endpointStats = ref<EndpointStatPoint[]>([]);

let timer: number | undefined;

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/services");
}

async function load() {
  if (!service.value) return;
  loading.value = true;
  endpointLoading.value = true;
  try {
    detail.value = await getServiceDetail(service.value);
    endpoints.value = await getEndpoints(50, service.value);
    endpointStats.value = (await getEndpointStats(service.value, 60, 60)) || [];
  } catch {
    // 单项失败不整体阻断
  } finally {
    loading.value = false;
    endpointLoading.value = false;
  }
}

const tableColumns: ReTableColumn[] = [
  { prop: "endpoint", label: "端点", minWidth: 180, slot: "endpoint" },
  { prop: "callCount", label: "调用量", width: 90, align: "right", slot: "callCount" },
  { prop: "errorCount", label: "错误数", width: 80, align: "center", slot: "errorCount" },
  { prop: "errorRate", label: "错误率 %", width: 90, align: "center", slot: "errorRate" },
  { prop: "avgMs", label: "avg ms", width: 80, align: "right", slot: "avgMs" },
  { prop: "p95Ms", label: "P95 ms", width: 80, align: "right", slot: "p95Ms" },
  { prop: "p99Ms", label: "P99 ms", width: 80, align: "right", slot: "p99Ms" },
  { prop: "maxMs", label: "Max ms", width: 80, align: "right", slot: "maxMs" },
];

// ---- 调用趋势（全部端点各桶聚合）----
const trendOption = computed<EChartsOption>(() => {
  const buckets = new Map<number, { callCount: number; durationWeighted: number; total: number }>();
  for (const p of endpointStats.value) {
    const cell = buckets.get(p.ts) ?? { callCount: 0, durationWeighted: 0, total: 0 };
    cell.callCount += p.callCount;
    cell.durationWeighted += p.avgMs * p.callCount;
    cell.total += p.callCount;
    buckets.set(p.ts, cell);
  }
  const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
  if (!sorted.length) {
    return {
      backgroundColor: "transparent",
      title: { text: "暂无趋势数据", left: "center", top: "center", textStyle: { color: "rgba(230,237,247,0.4)", fontSize: 12 } },
    };
  }
  const hm = (ms: number) => {
    const d = new Date(ms);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  return {
    backgroundColor: "transparent",
    grid: { left: 44, right: 44, top: 30, bottom: 24 },
    tooltip: { trigger: "axis" },
    legend: { data: ["调用量", "平均耗时 ms"], textStyle: { color: "#e6edf7" }, top: 0 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: sorted.map(([ts]) => hm(ts)),
      axisLabel: { color: "#e6edf7" },
    },
    yAxis: [
      { type: "value", minInterval: 1, axisLabel: { color: "#e6edf7" } },
      { type: "value", name: "ms", axisLabel: { color: "#e6edf7" } },
    ],
    series: [
      {
        name: "调用量",
        type: "line",
        smooth: true,
        symbol: "none",
        data: sorted.map(([, c]) => c.callCount),
        lineStyle: { color: "#3b82f6", width: 2 },
        areaStyle: { color: "rgba(59,130,246,0.2)" },
      },
      {
        name: "平均耗时 ms",
        type: "line",
        smooth: true,
        symbol: "none",
        yAxisIndex: 1,
        data: sorted.map(([, c]) => (c.total > 0 ? Number((c.durationWeighted / c.total).toFixed(1)) : 0)),
        lineStyle: { color: "#f59e0b", width: 2 },
      },
    ],
  } as EChartsOption;
});

onMounted(() => {
  load();
  timer = window.setInterval(load, 10000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
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

/* 并排双面板 */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* 表格面板 */
.table-panel {
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

/* 面板 */
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

.trend-chart {
  width: 100%;
}

@media (max-width: 1100px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .two-col {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stat-row {
    grid-template-columns: 1fr;
  }
}
</style>
