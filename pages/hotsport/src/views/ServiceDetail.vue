<template>
  <div class="view">
    <!-- 顶部工具栏 -->
    <div class="view-toolbar">
      <div class="toolbar-left">
        <ReButton icon="ArrowLeft" show-text @click="goBack">返回</ReButton>
        <ReTag v-if="service" type="info" round>
          <code class="mono">{{ service }}</code>
        </ReTag>
        <span v-if="detail" class="match-hint">10s 自动刷新 · 聚合窗口由后端决定</span>
      </div>
      <div class="toolbar-right">
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <!-- 缺参空态 -->
    <ReEmpty v-if="!service" description="缺少 service 参数，请从服务列表进入" />

    <!-- 加载中 -->
    <ReSkeleton v-else-if="loading && !detail" :rows="8" animated />

    <!-- 主内容 -->
    <template v-else-if="detail">
      <!-- 关键指标 -->
      <div class="stat-row">
        <ReStatCard
          size="compact"
          title="调用量"
          :value="detail.callCount.toLocaleString()"
          :desc="`${detail.errorCount.toLocaleString()} 次错误`"
          :icon="DataLine"
          icon-color="var(--apm-accent)"
        />
        <ReStatCard
          size="compact"
          title="错误率"
          :value="detail.errorRatePercent.toFixed(2) + ' %'"
          :desc="`avg ${detail.avgMs} ms · max ${detail.maxMs} ms`"
          :icon="Warning"
          :icon-color="errorRateIconColor"
        />
        <ReStatCard
          size="compact"
          title="P95 耗时"
          :value="detail.p95Ms + ' ms'"
          :desc="`P99 ${detail.p99Ms} ms`"
          :icon="Timer"
          :icon-color="latencyIconColor"
        />
        <ReStatCard
          size="compact"
          title="端点数"
          :value="detail.endpointCount"
          :desc="`独立端点（protocol + operation）`"
          :icon="Connection"
          icon-color="var(--apm-accent-alt)"
        />
      </div>

      <!-- 概览 / 端点 / 依赖 / 错误：分页签避免一屏堆叠 -->
      <el-tabs v-model="tab" class="detail-tabs">
        <el-tab-pane label="概览" name="overview">
          <div class="panel-row">
            <div class="panel">
              <div class="panel-head">
                <span>调用趋势</span>
                <span class="panel-sub">近 60 分钟 · 全部端点聚合（分钟桶）</span>
              </div>
              <ReEcharts
                v-if="trendHasData"
                :option="trendOption"
                theme="light"
                height="300px"
                class="trend-chart"
              />
              <div v-else class="panel-empty">近 60 分钟暂无端点趋势数据</div>
            </div>

            <div class="panel">
              <div class="panel-head">
                <span>健康摘要</span>
                <span class="panel-sub">阈值口径：错误率 1% / 5%，耗时 300 / 1000 ms</span>
              </div>
              <dl class="health-grid">
                <div class="health-item">
                  <dt>平均耗时</dt>
                  <dd class="mono" :class="latencyClass(detail.avgMs)">{{ detail.avgMs }} ms</dd>
                </div>
                <div class="health-item">
                  <dt>P95 耗时</dt>
                  <dd class="mono" :class="latencyClass(detail.p95Ms)">{{ detail.p95Ms }} ms</dd>
                </div>
                <div class="health-item">
                  <dt>P99 耗时</dt>
                  <dd class="mono" :class="latencyClass(detail.p99Ms)">{{ detail.p99Ms }} ms</dd>
                </div>
                <div class="health-item">
                  <dt>最大耗时</dt>
                  <dd class="mono" :class="latencyClass(detail.maxMs)">{{ detail.maxMs }} ms</dd>
                </div>
                <div class="health-item">
                  <dt>错误次数</dt>
                  <dd class="mono" :class="detail.errorCount > 0 ? 'err-text' : 'ok-text'">
                    {{ detail.errorCount.toLocaleString() }}
                  </dd>
                </div>
                <div class="health-item">
                  <dt>错误率</dt>
                  <dd class="mono" :class="errorRateClass(detail.errorRatePercent)">
                    {{ detail.errorRatePercent.toFixed(2) }} %
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="endpoints" lazy>
          <template #label>
            端点 <span class="tab-count">{{ endpoints.length }}</span>
          </template>

          <div v-if="endpoints.length" class="table-panel">
            <div class="panel-head tab-head">
              <span>端点明细</span>
              <span class="panel-sub">端点聚合 · Top 50 · 列头可排序</span>
            </div>
            <ReTable
              :data="endpoints as unknown as Record<string, unknown>[]"
              :columns="tableColumns"
              :loading="endpointLoading"
              :layout-table="{ minHeight: 200 }"
              empty-text="该服务暂无端点数据"
              :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
            >
              <template #col-endpoint="{ row }">
                <span class="mono endpoint-text">{{ row.endpoint }}</span>
              </template>
              <template #col-callCount="{ row }">
                <span class="muted mono">{{ numOf(row.callCount).toLocaleString() }}</span>
              </template>
              <template #col-errorCount="{ row }">
                <ReTag v-if="numOf(row.errorCount) > 0" type="danger" round>
                  {{ numOf(row.errorCount) }}
                </ReTag>
                <span v-else class="muted mono">0</span>
              </template>
              <template #col-errorRate="{ row }">
                <span class="mono" :class="errorRateClass(numOf(row.errorRate))">
                  {{ numOf(row.errorRate).toFixed(2) }} %
                </span>
              </template>
              <template #col-avgMs="{ row }">
                <span class="mono">{{ numOf(row.avgMs).toFixed(1) }}</span>
              </template>
              <template #col-p95Ms="{ row }">
                <span class="mono" :class="latencyClass(numOf(row.p95Ms))">
                  {{ numOf(row.p95Ms).toFixed(1) }}
                </span>
              </template>
              <template #col-p99Ms="{ row }">
                <span class="mono muted">{{ numOf(row.p99Ms).toFixed(1) }}</span>
              </template>
              <template #col-maxMs="{ row }">
                <span class="mono" :class="latencyClass(numOf(row.maxMs))">
                  {{ numOf(row.maxMs).toFixed(0) }}
                </span>
              </template>
            </ReTable>
          </div>

          <div v-else class="panel">
            <div class="panel-empty">该服务暂无端点数据</div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="dependencies" lazy>
          <template #label>
            依赖 <span class="tab-count">{{ serviceDepRows.length }}</span>
          </template>
          <div v-if="serviceDepRows.length" class="table-panel">
            <div class="panel-head tab-head">
              <span>依赖边</span>
              <span class="panel-sub">
                最近 100 条全局依赖边中，按 source/target 主机名匹配本服务的出边与入边
              </span>
            </div>
            <ReTable
              :data="serviceDepRows as unknown as Record<string, unknown>[]"
              :columns="depColumns"
              :loading="depsLoading"
              :layout-table="{ minHeight: 160 }"
              empty-text="未匹配到该服务的依赖边"
              :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
            >
              <template #col-direction="{ row }">
                <el-tag
                  size="small"
                  effect="plain"
                  round
                  :type="row.direction === '出' ? 'warning' : 'info'"
                >{{ row.direction }}</el-tag>
              </template>
              <template #col-peer="{ row }">
                <span class="mono endpoint-text">{{ row.peer }}</span>
              </template>
              <template #col-protocol="{ row }">
                <span class="mono muted">{{ row.protocol || "—" }}</span>
              </template>
              <template #col-callCount="{ row }">
                <span class="mono">{{ numOf(row.callCount).toLocaleString() }}</span>
              </template>
              <template #col-errorCount="{ row }">
                <span :class="['mono', numOf(row.errorCount) > 0 ? 'err-text' : 'muted']">
                  {{ numOf(row.errorCount) }}
                </span>
              </template>
              <template #col-errorRate="{ row }">
                <span class="mono" :class="errorRateClass(numOf(row.errorRate))">
                  {{ numOf(row.errorRate).toFixed(2) }} %
                </span>
              </template>
              <template #col-p95Ms="{ row }">
                <span class="mono" :class="latencyClass(numOf(row.p95Ms))">
                  {{ numOf(row.p95Ms).toFixed(1) }}
                </span>
              </template>
            </ReTable>
          </div>

          <div v-else class="panel">
            <div class="panel-empty">
              {{ depsLoading ? "正在加载依赖数据…" : "未匹配到该服务的依赖边（匹配规则：source/target 主机名等于本服务）" }}
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="errors" lazy>
          <template #label>
            错误 <span class="tab-count">{{ errorEndpoints.length }}</span>
          </template>
          <div v-if="errorEndpoints.length" class="table-panel">
            <div class="panel-head tab-head">
              <span>错误端点</span>
              <span class="panel-sub">仅列出 errorCount &gt; 0 的端点 · 按错误次数降序</span>
            </div>
            <ReTable
              :data="errorEndpoints as unknown as Record<string, unknown>[]"
              :columns="errorColumns"
              :loading="endpointLoading"
              :layout-table="{ minHeight: 140 }"
              empty-text="该服务当前无错误记录"
              :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
            >
              <template #col-endpoint="{ row }">
                <span class="mono endpoint-text">{{ row.endpoint }}</span>
              </template>
              <template #col-errorCount="{ row }">
                <ReTag type="danger" round>{{ numOf(row.errorCount) }}</ReTag>
              </template>
              <template #col-errorRate="{ row }">
                <span class="mono" :class="errorRateClass(numOf(row.errorRate))">
                  {{ numOf(row.errorRate).toFixed(2) }} %
                </span>
              </template>
              <template #col-callCount="{ row }">
                <span class="muted mono">{{ numOf(row.callCount).toLocaleString() }}</span>
              </template>
              <template #col-maxMs="{ row }">
                <span class="mono" :class="latencyClass(numOf(row.maxMs))">
                  {{ numOf(row.maxMs).toFixed(0) }}
                </span>
              </template>
            </ReTable>
          </div>

          <div v-else class="panel">
            <div class="panel-empty">该服务当前无错误记录</div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <!-- 加载失败：不留空白页 -->
    <div v-else-if="!loading" class="panel">
      <div class="panel-empty">未获取到服务详情，请刷新或从服务列表重新进入</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ROUTE_PREFIX } from "../config";
import { DataLine, Timer, Warning, Connection } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReEmpty from "@repo/ui/re-empty";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTable from "@repo/ui/re-table";
import ReEcharts from "@repo/ui/re-echarts";
import type { ReTableColumn } from "@repo/ui/re-table";
import {
  getDependenciesAggregated,
  getEndpoints,
  getEndpointStats,
  getServiceDetail,
} from "../api/apmApi";
import type {
  ApmEndpoint,
  DependencyEdge,
  EndpointStatPoint,
  ServiceDetail,
} from "../api/apmApi";
import type { EChartsOption } from "echarts";
import {
  areaGradient,
  axisTextColor,
  baseGrid,
  baseTooltip,
  categoryAxis,
  chartCanvas,
  chartColor,
  valueAxis,
  warningColor,
} from "../styles/chartTheme";

const route = useRoute();
const router = useRouter();

const service = computed(() => String(route.query.service ?? ""));

const detail = ref<ServiceDetail | null>(null);
// 初值 true：首帧不闪「未获取到服务详情」空态
const loading = ref(true);
const endpoints = ref<ApmEndpoint[]>([]);
const endpointLoading = ref(false);
const endpointStats = ref<EndpointStatPoint[]>([]);
const tab = ref("overview");

let timer: number | undefined;

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push(ROUTE_PREFIX + "/services");
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
  // 依赖数据只在「依赖」页签打开过之后才刷新，避免每 10s 多打一次全局聚合
  if (depsLoaded.value) {
    await loadDeps();
  }
}

/** 插槽里的 row 是宽类型（unknown）：数值列统一收窄 */
function numOf(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// ---- 阈值着色：错误率 1% / 5%，耗时 300 / 1000 ms（与 Traces 同口径） ----
function errorRateClass(rate: number): string {
  const v = Number(rate) || 0;
  if (v > 5) return "err-text";
  if (v > 1) return "warn-text";
  return "ok-text";
}

function latencyClass(ms: number): string {
  const v = Number(ms) || 0;
  if (v >= 1000) return "err-text";
  if (v >= 300) return "warn-text";
  return "ok-text";
}

/** 指标卡图标色跟随阈值，扫一眼就能看出服务健康度 */
const errorRateIconColor = computed(() => {
  const v = detail.value?.errorRatePercent ?? 0;
  if (v > 5) return "var(--apm-danger)";
  if (v > 1) return "var(--apm-warning)";
  return "var(--apm-success)";
});

const latencyIconColor = computed(() => {
  const v = detail.value?.p95Ms ?? 0;
  if (v >= 1000) return "var(--apm-danger)";
  if (v >= 300) return "var(--apm-warning)";
  return "var(--apm-success)";
});

// ---- 端点表 ----
const tableColumns: ReTableColumn[] = [
  { prop: "endpoint", label: "端点", minWidth: 180, slot: "endpoint" },
  { prop: "callCount", label: "调用量", width: 100, align: "right", slot: "callCount", sortable: true },
  { prop: "errorCount", label: "错误数", width: 90, align: "center", slot: "errorCount", sortable: true },
  { prop: "errorRate", label: "错误率 %", width: 100, align: "right", slot: "errorRate", sortable: true },
  { prop: "avgMs", label: "avg ms", width: 90, align: "right", slot: "avgMs", sortable: true },
  { prop: "p95Ms", label: "P95 ms", width: 90, align: "right", slot: "p95Ms", sortable: true },
  { prop: "p99Ms", label: "P99 ms", width: 90, align: "right", slot: "p99Ms", sortable: true },
  { prop: "maxMs", label: "Max ms", width: 90, align: "right", slot: "maxMs", sortable: true },
];

/** 错误页签：同一批端点里只取有错误的，按错误次数降序 */
const errorEndpoints = computed(() =>
  endpoints.value
    .filter((e) => Number(e.errorCount) > 0)
    .sort((a, b) => Number(b.errorCount) - Number(a.errorCount)),
);

const errorColumns: ReTableColumn[] = [
  { prop: "endpoint", label: "端点", minWidth: 220, slot: "endpoint" },
  { prop: "errorCount", label: "错误数", width: 100, align: "center", slot: "errorCount", sortable: true },
  { prop: "errorRate", label: "错误率 %", width: 100, align: "right", slot: "errorRate", sortable: true },
  { prop: "callCount", label: "调用量", width: 100, align: "right", slot: "callCount", sortable: true },
  { prop: "maxMs", label: "Max ms", width: 100, align: "right", slot: "maxMs", sortable: true },
];

// ---- 依赖页签 ----
const deps = ref<DependencyEdge[]>([]);
const depsLoading = ref(false);
const depsLoaded = ref(false);

/**
 * 服务名形如 `software@host`，依赖边的 source/target 常见为 `host:port`。
 * 因此匹配「完整服务名」或「主机名边界」，不做裸 includes —— 否则
 * `localhost` 这类短串会把无关边全捞进来。
 */
const serviceTokens = computed(() => {
  const raw = service.value.trim().toLowerCase();
  if (!raw) return [] as string[];
  const tokens = [raw];
  const at = raw.indexOf("@");
  if (at >= 0) {
    const host = raw.slice(at + 1).trim();
    if (host) tokens.push(host);
  }
  return [...new Set(tokens)];
});

function endpointMatches(value: string): boolean {
  const v = String(value || "").toLowerCase();
  if (!v) return false;
  return serviceTokens.value.some(
    (t) => v === t || v.startsWith(`${t}:`) || v.endsWith(`@${t}`) || v.includes(`${t}@`),
  );
}

/** 依赖边 → 表格行（方向 + 对端），只保留与本服务相关的边 */
const serviceDepRows = computed(() => {
  const rows: Array<{
    key: string;
    direction: string;
    peer: string;
    protocol: string;
    callCount: number;
    errorCount: number;
    errorRate: number;
    p95Ms: number;
  }> = [];

  for (const e of deps.value) {
    const sourceHit = endpointMatches(e.source);
    const targetHit = endpointMatches(e.target);
    if (!sourceHit && !targetHit) continue;

    const callCount = Number(e.callCount) || 0;
    const errorCount = Number(e.errorCount) || 0;
    const errorRate =
      typeof e.errorRate === "number" && Number.isFinite(e.errorRate)
        ? e.errorRate
        : callCount > 0
          ? (errorCount / callCount) * 100
          : 0;

    rows.push({
      key: e.edgeId || `${e.source}->${e.target}`,
      direction: sourceHit ? "出" : "入",
      peer: sourceHit ? e.target : e.source,
      protocol: e.protocol || "",
      callCount,
      errorCount,
      errorRate,
      p95Ms: Number(e.p95Ms) || 0,
    });
  }

  return rows;
});

const depColumns: ReTableColumn[] = [
  { prop: "direction", label: "方向", width: 80, align: "center", slot: "direction" },
  { prop: "peer", label: "对端", minWidth: 200, slot: "peer" },
  { prop: "protocol", label: "协议", width: 100, slot: "protocol" },
  { prop: "callCount", label: "调用次数", width: 110, align: "right", slot: "callCount", sortable: true },
  { prop: "errorCount", label: "错误", width: 80, align: "center", slot: "errorCount", sortable: true },
  { prop: "errorRate", label: "错误率", width: 100, align: "right", slot: "errorRate", sortable: true },
  { prop: "p95Ms", label: "P95 ms", width: 100, align: "right", slot: "p95Ms", sortable: true },
];

async function loadDeps() {
  depsLoading.value = true;
  try {
    deps.value = (await getDependenciesAggregated(100)) || [];
  } catch {
    deps.value = [];
  } finally {
    depsLoading.value = false;
    depsLoaded.value = true;
  }
}

// 首次切到「依赖」时才拉取，避免打开详情页就多一次全局聚合请求
watch(tab, (name) => {
  if (name === "dependencies" && !depsLoaded.value) {
    loadDeps();
  }
});

// ---- 调用趋势（全部端点各桶聚合）----
const trendPoints = computed(() => {
  const buckets = new Map<number, { callCount: number; durationWeighted: number; total: number }>();
  for (const p of endpointStats.value) {
    const cell = buckets.get(p.ts) ?? { callCount: 0, durationWeighted: 0, total: 0 };
    cell.callCount += p.callCount;
    cell.durationWeighted += p.avgMs * p.callCount;
    cell.total += p.callCount;
    buckets.set(p.ts, cell);
  }
  return [...buckets.entries()].sort((a, b) => a[0] - b[0]);
});

const trendHasData = computed(() => trendPoints.value.length > 0);

const trendOption = computed<EChartsOption>(() => {
  const sorted = trendPoints.value;
  const hm = (ms: number) => {
    const d = new Date(ms);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const callColor = chartColor(0);
  const latencyColor = warningColor();

  return {
    ...chartCanvas(),
    grid: baseGrid({ left: 52, right: 52, top: 36, bottom: 26 }),
    tooltip: baseTooltip(),
    legend: {
      data: ["调用量", "平均耗时 ms"],
      textStyle: { color: axisTextColor() },
      top: 0,
      itemWidth: 12,
      itemHeight: 8,
    },
    xAxis: {
      ...categoryAxis(sorted.map(([ts]) => hm(ts))),
      boundaryGap: false,
    },
    yAxis: [
      valueAxis({ minInterval: 1 }),
      valueAxis({ name: "ms", nameTextStyle: { color: axisTextColor() } }),
    ],
    series: [
      {
        name: "调用量",
        type: "line",
        smooth: true,
        symbol: "none",
        data: sorted.map(([, c]) => c.callCount),
        lineStyle: { color: callColor, width: 2 },
        itemStyle: { color: callColor },
        areaStyle: { color: areaGradient(callColor) },
      },
      {
        name: "平均耗时 ms",
        type: "line",
        smooth: true,
        symbol: "none",
        yAxisIndex: 1,
        data: sorted.map(([, c]) => (c.total > 0 ? Number((c.durationWeighted / c.total).toFixed(1)) : 0)),
        lineStyle: { color: latencyColor, width: 2 },
        itemStyle: { color: latencyColor },
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
/* 骨架（.view / .view-toolbar / .toolbar-* / .section-label / .match-hint /
   .stat-row / .panel / .panel-head / .panel-sub / .panel-row / .panel-empty /
   .table-panel / .mono / .muted / .ok-text / .warn-text / .err-text）
   统一由 styles/layout.css 提供，此处只留本页独有部分。
   颜色/圆角已迁移为 koi 令牌，未加载 koi 时回退 --apm-*。 */

.endpoint-text {
  color: var(--text-primary, var(--apm-fg));
}

/* ---- 页签 ---- */
.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: var(--apm-space-3);
}

.detail-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--border-subtle, var(--apm-border-soft));
}

.detail-tabs :deep(.el-tabs__item) {
  height: 40px;
  font-size: 13px;
  color: var(--text-tertiary, var(--apm-muted));
}

.detail-tabs :deep(.el-tabs__item:hover) {
  color: var(--text-secondary, var(--apm-fg-regular));
}

.detail-tabs :deep(.el-tabs__item.is-active) {
  color: var(--text-primary, var(--apm-fg));
}

.detail-tabs :deep(.el-tabs__active-bar) {
  background: var(--brand-500, var(--apm-accent));
}

.detail-tabs :deep(.el-tabs__item:focus-visible) {
  outline: 2px solid var(--brand-500, var(--apm-accent));
  outline-offset: -2px;
}

/* 表格卡片内的标题：补出与卡片内距协调的留白 */
.tab-head {
  padding: var(--apm-space-2) var(--apm-space-3) var(--apm-space-3);
}

.tab-count {
  margin-left: 4px;
  font-family: var(--apm-font-mono);
  font-size: 11px;
  color: var(--text-tertiary, var(--apm-muted));
  font-variant-numeric: tabular-nums;
}

/* ---- 健康摘要 ---- */
.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--apm-space-3);
  margin: 0;
}

.health-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--apm-space-2) var(--apm-space-3);
  border-radius: var(--radius-md, var(--apm-radius-md));
  background: color-mix(in srgb, var(--text-primary, var(--apm-fg)) 4%, transparent);
}

.health-item dt {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary, var(--apm-muted));
}

.health-item dd {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.trend-chart {
  width: 100%;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
