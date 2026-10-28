<template>
  <div class="view">
    <!-- 操作条：无标题大卡 -->
    <div class="view-bar">
      <span class="match-hint">
        <div v-if="healthType" class="health-chip" :class="healthType">
          <span class="health-chip-dot" />
          <span class="health-chip-label">{{ healthLabel }}</span>
        </div>

        <template v-if="healthType">
          <span v-for="m in healthMetrics" :key="m.label" class="health-metric">
            <span class="health-metric-value mono-lg">{{ m.value }}</span>
            <span class="health-metric-label">{{ m.label }}</span>
          </span>
        </template>

        <span class="live-dot">实时</span>
        <span v-if="lastRefresh" class="last-refresh muted">上次刷新 {{ lastRefresh }}</span>
      </span>

      <div class="view-bar__actions">
        <el-button round :loading="loading" @click="load">
          <el-icon class="refresh-icon"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 核心指标：四张卡，点击下钻 -->
    <div class="stat-grid">
      <button
        v-for="c in cards"
        :key="c.key"
        type="button"
        class="stat-card"
        :style="{ '--card-accent': c.color }"
        @click="onCardClick(c)"
      >
        <span class="stat-icon" aria-hidden="true">
          <el-icon :size="20"><component :is="c.icon" /></el-icon>
        </span>
        <span class="stat-body">
          <span class="stat-value mono-lg">{{ c.value.toLocaleString() }}</span>
          <span class="stat-label">{{ c.label }}</span>
        </span>
        <el-icon class="stat-arrow" :size="14"><ArrowRight /></el-icon>
      </button>
    </div>

    <!-- 趋势：调用量 / 错误数（主图，占满宽） -->
    <div class="panel">
      <div class="panel-head-row">
        <div class="panel-head">
          <span>调用趋势</span>
          <span class="panel-sub">{{ trendRangeLabel }} · 每分钟聚合{{ trendRangeMin === 30 ? "（实时推送）" : "" }}</span>
        </div>
        <div class="trend-actions">
          <el-radio-group v-model="trendRangeMin" size="small" class="trend-range">
            <el-radio-button :value="5">5m</el-radio-button>
            <el-radio-button :value="15">15m</el-radio-button>
            <el-radio-button :value="30">30m</el-radio-button>
            <el-radio-button :value="60">1h</el-radio-button>
            <el-radio-button :value="360">6h</el-radio-button>
            <el-radio-button :value="1440">24h</el-radio-button>
          </el-radio-group>
          <el-button text size="small" class="chart-export-btn" title="导出 PNG" @click="exportChart('trend')">
            <el-icon :size="14"><Download /></el-icon>导出
          </el-button>
        </div>
      </div>
      <ReEcharts
        ref="trendChartRef"
        :option="trendOption"
        theme="light"
        height="260px"
        class="panel-chart chart-trend"
      />
    </div>

    <!-- 双图：错误率&耗时 + 协议分布 -->
    <div class="chart-grid">
      <div class="panel">
        <div class="panel-head-row">
          <div class="panel-head">
            <span>错误率 & 平均耗时</span>
            <span class="panel-sub">双轴 · 每分钟分桶</span>
          </div>
          <el-button text size="small" class="chart-export-btn" title="导出 PNG" @click="exportChart('error')">
            <el-icon :size="14"><Download /></el-icon>导出
          </el-button>
        </div>
        <ReEcharts
          ref="errorTrendChartRef"
          :option="errorTrendOption"
          theme="light"
          height="240px"
          class="panel-chart chart-error"
        />
      </div>

      <div class="panel">
        <div class="panel-head">
          <span>数据构成</span>
          <span class="panel-sub">各类记录占比</span>
        </div>
        <!-- 空数据时不能渲染 pie：ECharts 对空 data 画 lightgray 占位环 -->
        <div v-if="!hasDonutData" class="panel-empty">暂无记录数据</div>
        <ReEcharts
          v-else
          :option="donutOption"
          theme="light"
          height="240px"
          class="panel-chart"
        />
      </div>
    </div>

    <!-- 排行三列 -->
    <div class="rank-grid">
      <div class="panel">
        <div class="panel-head">
          <span>服务 Top 8</span>
          <span class="panel-sub">按调用次数</span>
        </div>
        <ReTable
          :data="(services.slice(0, 8)) as unknown as Record<string, unknown>[]"
          :columns="serviceColumns"
          engine="element"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table rank-table"
          empty-text="暂无服务数据"
          @row-click="() => router.push(ROUTE_PREFIX + '/endpoints')"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-service="{ row }">
            <span class="mono service-cell">{{ row.service }}</span>
          </template>
          <template #col-errorRate="{ row }">
            <span class="mono" :class="rateClass(row)">
              {{ errorRatePct(row) }}%
            </span>
          </template>
        </ReTable>
      </div>

      <div class="panel">
        <div class="panel-head">
          <span>慢调用 Top 5</span>
          <span class="panel-sub">耗时最长</span>
        </div>
        <ReTable
          :data="(slowCalls.slice(0, 5)) as unknown as Record<string, unknown>[]"
          :columns="slowCallColumns"
          engine="element"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table rank-table"
          empty-text="暂无慢调用"
          @row-click="(r: Record<string, unknown>) => openTrace(r as never)"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-operation="{ row }">
            <span class="mono service-cell">{{ String(row.operation ?? "—").slice(0, 22) }}</span>
          </template>
          <template #col-durationMs="{ row }">
            <span class="mono warn-text">{{ row.durationMs }}ms</span>
          </template>
        </ReTable>
      </div>

      <div class="panel">
        <div class="panel-head">
          <span>错误排行 Top 5</span>
          <span class="panel-sub">按错误次数</span>
        </div>
        <ReTable
          :data="(errorRanking.slice(0, 5)) as unknown as Record<string, unknown>[]"
          :columns="errorRankingColumns"
          engine="element"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table rank-table"
          empty-text="暂无错误"
          @row-click="() => router.push(ROUTE_PREFIX + '/errors')"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-errorType="{ row }">
            <span class="mono err-text">{{ String(row.errorType ?? "—").slice(0, 16) }}</span>
          </template>
          <template #col-errorMessage="{ row }">
            <span class="muted truncate">{{ String(row.errorMessage ?? "—").slice(0, 28) }}</span>
          </template>
        </ReTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ROUTE_PREFIX } from "../config";
import { message } from "@repo/core";
import { ArrowRight, DataAnalysis, Document, Refresh, Share, Warning, Download } from "@element-plus/icons-vue";
import { useRealtimeEvent } from "../composables/useRealtime";

import ReEcharts from "@repo/ui/re-echarts";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";

import {
  getStats,
  getServices,
  getSlowCalls,
  getErrorRanking,
  getSla,
  getTrend,
} from "../api/apmApi";
import type {
  ApmStats,
  ApmService,
  SlowCall,
  ErrorRanking,
  SlaStats,
  TrendPoint,
} from "../api/apmApi";
import {
  areaGradient,
  axisLineColor,
  axisTextColor,
  baseGrid,
  baseTooltip,
  categoryAxis,
  chartCanvas,
  chartColor,
  colorWithAlpha,
  dangerColor,
  infoColor,
  okColor,
  panelBgColor,
  splitLineColor,
  tooltipStyle,
  valueAxis,
  warningColor,
} from "../styles/chartTheme";
import type { EChartsOption } from "echarts";

const router = useRouter();

/** 导出图表为 PNG（ECharts 实例从 DOM 注册表获取，不依赖内部 API） */
function exportChart(type: "trend" | "error" | "donut") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const echarts = (window as any).__EC_RESSEL__;
    if (!echarts) {
      // 兜底：遍历所有已挂载的 echarts 实例
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instances = (window as any).echarts?.instances as Map<string, unknown>;
      if (!instances) return;
      for (const [, instance] of instances) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((instance as any).group === type) {
          const dataURL = (instance as unknown as { getDataURL: (opts: { type: string; pixelRatio: number; backgroundColor: string }) => string }).getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fafbfc" });
          triggerDownload(dataURL, `hotsport-${type}-${Date.now()}.png`);
          return;
        }
      }
      return;
    }
    const instance = echarts.getInstanceByDom(document.querySelector(`.chart-${type}`) as HTMLElement);
    if (!instance) return;
    const dataURL = instance.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fafbfc" });
    triggerDownload(dataURL, `hotsport-${type}-${Date.now()}.png`);
  } catch {
    /* 导出失败静默降级 */
  }
}

function triggerDownload(dataURL: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = filename;
  a.click();
}

/* ---------------- 状态 ---------------- */
const stats = ref<ApmStats>({
  agentActive: false,
  agentEnabled: false,
  transmissionCount: 0,
  leakCount: 0,
  errorCount: 0,
  traceCount: 0,
  dependencyCount: 0,
});

const loading = ref(false);
const services = ref<ApmService[]>([]);
const slowCalls = ref<SlowCall[]>([]);
const errorRanking = ref<ErrorRanking[]>([]);
const sla = ref<SlaStats | null>(null);

const lastRefresh = ref("");

function formatLastRefresh() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  lastRefresh.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ---------------- 健康状态 ---------------- */
/** 三态语义，与 CSS 的 .success/.warning/.danger 一一对应 */
const healthType = computed<"" | "success" | "warning" | "danger">(() => {
  switch (stats.value.health) {
    case "HEALTHY":
      return "success";
    case "DEGRADED":
      return "warning";
    case "SATURATED":
      return "danger";
    default:
      return "";
  }
});

const healthLabel = computed(() => {
  switch (stats.value.health) {
    case "HEALTHY":
      return "系统健康";
    case "DEGRADED":
      return "性能降级";
    case "SATURATED":
      return "资源饱和";
    default:
      return "未知";
  }
});

/** 健康条上的指标项：SLA 存在时才追加可用率，避免空值占位 */
const healthMetrics = computed(() => {
  const m: { label: string; value: string }[] = [
    { label: "QPS", value: String(stats.value.qps ?? 0) },
    { label: "错误率", value: `${stats.value.errorRate ?? 0}%` },
    { label: "活跃泄漏", value: String(stats.value.activeLeaks ?? 0) },
  ];
  if (sla.value) {
    m.push({
      label: "可用率",
      value: `${sla.value.slaPercent.toFixed(2)}%`,
    });
  }
  return m;
});

/* ---------------- 统计卡 ---------------- */
const cards = computed(() => [
  {
    key: "transmissions",
    label: "传输记录",
    value: stats.value.transmissionCount,
    icon: DataAnalysis,
    color: "var(--apm-chart-1)",
    route: "/traces",
  },
  {
    key: "deps",
    label: "依赖关系",
    value: stats.value.dependencyCount,
    icon: Share,
    color: "var(--apm-chart-3)",
    route: "/dependencies",
  },
  {
    key: "traces",
    label: "调用链路",
    value: stats.value.traceCount,
    icon: Document,
    color: "var(--apm-chart-5)",
    route: "/traces",
  },
  {
    key: "leaks",
    label: "资源泄漏",
    value: stats.value.leakCount,
    icon: Warning,
    color: stats.value.leakCount > 0 ? "var(--apm-danger)" : "var(--apm-chart-2)",
    route: "/leaks",
  },
]);

function onCardClick(c: { route: string }) {
  router.push(ROUTE_PREFIX + c.route);
}

function openTrace(r: SlowCall) {
  if (r.traceId) {
    router.push({ path: ROUTE_PREFIX + "/traces/detail", query: { traceId: r.traceId } });
  }
}

/* ---------------- 表格列 ---------------- */
const serviceColumns: ReTableColumn[] = [
  { prop: "service", label: "服务", minWidth: 130, slot: "service" },
  { prop: "callCount", label: "调用", width: 68, align: "right", sortable: true },
  { prop: "errorRate", label: "错误率", width: 76, align: "right", slot: "errorRate" },
];

const slowCallColumns: ReTableColumn[] = [
  { prop: "operation", label: "操作", minWidth: 110, slot: "operation" },
  { prop: "durationMs", label: "耗时", width: 70, align: "right", slot: "durationMs" },
];

const errorRankingColumns: ReTableColumn[] = [
  { prop: "errorType", label: "错误类型", width: 100, slot: "errorType" },
  { prop: "callCount", label: "次数", width: 60, align: "right", sortable: true },
  { prop: "errorMessage", label: "消息", minWidth: 120, slot: "errorMessage" },
];

/** ReTable 的 row 是宽类型，先收窄成 number 再参与算术 */
function errorCountOf(row: Record<string, unknown>): number {
  return Number(row.errorCount ?? 0);
}

/** 错误率（% 文本）：与后端口径一致 */
function errorRatePct(row: Record<string, unknown>): string {
  const calls = Number(row.callCount ?? 0);
  const errs = errorCountOf(row);
  return (calls > 0 ? Math.round((10000 * errs) / calls) / 100 : 0).toString();
}

/** 按错误率阈值着色：>5% 红，1~5% 黄 */
function rateClass(row: Record<string, unknown>): string {
  const calls = Number(row.callCount ?? 0);
  const rate = calls > 0 ? (errorCountOf(row) / calls) * 100 : 0;
  if (rate > 5) {
    return "err-text";
  }
  if (rate > 1) {
    return "warn-text";
  }
  return "";
}

/* ---------------- 趋势数据 ---------------- */
const trendBuckets = ref<{ xs: string[]; totals: number[]; errors: number[] }>({
  xs: [],
  totals: [],
  errors: [],
});
const errorTrendPoints = ref<TrendPoint[]>([]);

/**
 * 趋势时间范围（分钟）。30 分钟走 SSE 推送帧，其余范围手动拉 /trend。
 */
const trendRangeMin = ref(30);

/** 时间范围展示文案 */
const trendRangeLabel = computed(() => {
  const m = trendRangeMin.value;
  if (m < 60) return `最近 ${m} 分钟`;
  if (m === 60) return "最近 1 小时";
  if (m === 360) return "最近 6 小时";
  if (m === 1440) return "最近 24 小时";
  return `最近 ${m} 分钟`;
});

/** 手动拉取指定范围趋势（30 分钟以外才需要，SSE 只带 30m） */
async function fetchTrend(minutes: number) {
  try {
    const points = await getTrend(minutes, 60);
    applyTrend(points, minutes);
  } catch {
    /* 趋势失败静默，保留上一份 */
  }
}

/**
 * 用趋势点重绘两张趋势图。
 *
 * <p>30 分钟由后端 {@code /stream} 随帧下发（每 15s）；更长范围由
 * {@link #fetchTrend} 手动拉取。分桶窗口由 {@code windowMinutes} 决定，
 * 保证 X 轴覆盖所选范围。</p>
 *
 * @param points        后端聚合好的趋势点
 * @param windowMinutes 时间窗（分钟），缺省 30
 */
function applyTrend(points: TrendPoint[], windowMinutes = 30) {
  errorTrendPoints.value = points;
  const byMinute = new Map<number, TrendPoint>();
  for (const p of points) {
    byMinute.set(Math.floor(Number(p.bucketStart) / 60_000), p);
  }
  const nowMin = Math.floor(Date.now() / 60_000);
  const xs: string[] = [];
  const totals: number[] = [];
  const errors: number[] = [];
  for (let i = windowMinutes - 1; i >= 0; i--) {
    const key = nowMin - i;
    const b = byMinute.get(key);
    xs.push(hm(key * 60_000));
    totals.push(b?.callCount ?? 0);
    errors.push(b?.errorCount ?? 0);
  }
  trendBuckets.value = { xs, totals, errors };
}

/* ---------------- 图表 option（令牌驱动，无硬编码色） ---------------- */
const trendOption = computed<EChartsOption>(() => {
  const c1 = chartColor(0);
  const c6 = chartColor(5);
  return {
    ...chartCanvas(),
    grid: baseGrid({ top: 36 }),
    tooltip: baseTooltip(),
    legend: {
      data: ["调用量", "错误数"],
      top: 0,
      right: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 3,
      textStyle: { color: axisTextColor(), fontSize: 11 },
    },
    xAxis: { ...categoryAxis(trendBuckets.value.xs), boundaryGap: false },
    yAxis: valueAxis({ minInterval: 1 }),
    series: [
      {
        name: "调用量",
        type: "line",
        smooth: true,
        symbol: "none",
        data: trendBuckets.value.totals,
        lineStyle: { color: c1, width: 2 },
        areaStyle: { color: areaGradient(c1) },
      },
      {
        name: "错误数",
        type: "line",
        smooth: true,
        symbol: "none",
        data: trendBuckets.value.errors,
        lineStyle: { color: c6, width: 2 },
      },
    ],
  };
});

const errorTrendOption = computed<EChartsOption>(() => ({
  ...chartCanvas(),
  grid: baseGrid(),
  tooltip: baseTooltip(),
  legend: {
    data: ["错误率 %", "平均耗时 ms"],
    top: 0,
    right: 0,
    icon: "roundRect",
    itemWidth: 10,
    itemHeight: 3,
    textStyle: { color: axisTextColor(), fontSize: 11 },
  },
  xAxis: {
    ...categoryAxis(errorTrendPoints.value.map((p) => hm(p.bucketStart))),
    boundaryGap: false,
  },
  yAxis: [
    valueAxis({ name: "%", nameTextStyle: { color: axisTextColor() } }),
    valueAxis({ name: "ms", nameTextStyle: { color: axisTextColor() } }),
  ],
  series: [
    {
      name: "错误率 %",
      type: "line",
      smooth: true,
      symbol: "none",
      data: errorTrendPoints.value.map((p) => Number(p.errorRatePercent.toFixed(2))),
      lineStyle: { color: dangerColor(), width: 2 },
      areaStyle: { color: areaGradient(dangerColor(), 0.2) },
    },
    {
      name: "平均耗时 ms",
      type: "line",
      smooth: true,
      symbol: "none",
      yAxisIndex: 1,
      data: errorTrendPoints.value.map((p) => Number(p.avgMs.toFixed(1))),
      lineStyle: { color: warningColor(), width: 2 },
    },
  ],
}));

/** 环形图：四类记录占比。用「传输 / 依赖 / 链路 / 泄漏」的真实分类色 */
const donutSegments = computed(() =>
  [
    { name: "传输记录", value: stats.value.transmissionCount, color: chartColor(0) },
    { name: "依赖关系", value: stats.value.dependencyCount, color: chartColor(2) },
    { name: "调用链路", value: stats.value.traceCount, color: chartColor(4) },
    { name: "资源泄漏", value: stats.value.leakCount, color: chartColor(3) },
  ].filter((s) => s.value > 0),
);

/** 无有效分段时不渲染 pie（模板据此切换到 .panel-empty 空态） */
const hasDonutData = computed(() => donutSegments.value.length > 0);

const donutOption = computed<EChartsOption>(() => {
  const segments = donutSegments.value;

  return {
    ...chartCanvas(),
    tooltip: {
      trigger: "item",
      ...tooltipStyle(),
      formatter: "{b}<br/>{c} ({d}%)",
    },
    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: axisTextColor(), fontSize: 11 },
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "72%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        // 分隔环用面板底色（走 cssVar 取字面量，var() 会被 zrender 当成
        // 无法解析的颜色而渲染成白色/黑色块）
        itemStyle: {
          borderRadius: 5,
          borderColor: panelBgColor(),
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 5,
          itemStyle: { shadowBlur: 12, shadowColor: colorWithAlpha(dangerColor(), 0) },
        },
        data: segments.map((s) => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: s.color },
        })),
      },
    ],
  };
});

/* ---------------- 数据加载 ---------------- */
function hm(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function load() {
  loading.value = true;
  try {
    stats.value = await getStats();
  } catch {
    message.error("加载统计失败");
  } finally {
    loading.value = false;
  }
  formatLastRefresh();
  await loadRanks();
}

async function loadRanks() {
  try {
    const [svc, slow, err, s] = await Promise.all([
      getServices(),
      getSlowCalls(5),
      getErrorRanking(5),
      getSla(),
    ]);
    services.value = svc || [];
    slowCalls.value = slow || [];
    errorRanking.value = err || [];
    sla.value = s || null;
  } catch {
    /* 排行降级为空，不影响主视图 */
  }
}

/* ---------------- 生命周期 ---------------- */
/**
 * 整站唯一实时通道：stats 帧直接落到本地快照。
 *
 * <p>原先这里自建了一条 EventSource（watchStats），与壳层的 WS/SSE 并行，
 * 等于整站跑两条长连接。现在统一订阅共享通道；帧里已含 stats/health，
 * 趋势也会每 15s 随帧带上，因此<b>不再有任何周期性 HTTP 请求</b>。</p>
 */
useRealtimeEvent("stats", (ev) => {
  const frame = ev?.data as (ApmStats & { connected?: boolean }) | undefined;
  if (!frame || typeof frame !== "object" || frame.connected === true) {
    return;
  }
  Object.assign(stats.value, frame);
  formatLastRefresh();
  // 趋势：后端每 15s 随帧下发一次（固定 30 分钟）；没有该字段的帧说明还没到
  // 聚合周期，沿用上一份。非 30m 范围不走这里，见下方 watch(trendRangeMin)。
  if (Array.isArray(frame.trend) && trendRangeMin.value === 30) {
    applyTrend(frame.trend, 30);
  }
});

onMounted(async () => {
  await load();
});

// 趋势时间范围切换：30m 由 SSE 推送帧喂数，其它范围手动拉 /trend
watch(trendRangeMin, (min) => {
  if (min !== 30) {
    fetchTrend(min);
  }
});

// stats 变化时刷新协议分布（计数变了，占比就变了）
watch(
  () => [stats.value.transmissionCount, stats.value.dependencyCount, stats.value.leakCount, stats.value.traceCount],
  () => {
    /* donutOption 是 computed，依赖 stats，这里无需额外动作 */
  },
  { deep: true },
);
</script>

<style scoped>
/* ---- 健康徽章 ---- */
.health-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-md, var(--apm-radius-md));
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

/* 健康胶囊：背景用状态实色 12% 稀释，前景用实色。
   不能两处都写 --status-*：那是实色令牌，同色会让文字完全看不见。 */
.health-chip.success {
  background: color-mix(in srgb, var(--status-success, var(--apm-success)) 12%, transparent);
  color: var(--status-success, var(--apm-success));
}

.health-chip.warning {
  background: color-mix(in srgb, var(--status-warning, var(--apm-warning)) 12%, transparent);
  color: var(--status-warning, var(--apm-warning));
}

.health-chip.danger {
  background: color-mix(in srgb, var(--status-error, var(--apm-danger)) 12%, transparent);
  color: var(--status-error, var(--apm-danger));
}

.health-chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
}

.health-chip.danger .health-chip-dot {
  animation: apm-health-pulse 1.4s var(--ease-out, var(--apm-ease)) infinite;
}

@keyframes apm-health-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

/* ---- 健康指标组 ---- */
.health-metric {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.health-metric-value {
  font-size: 14px;
  font-weight: 650;
  color: var(--text-primary, var(--apm-fg));
}

.health-metric-label {
  font-size: 12px;
  color: var(--text-tertiary, var(--apm-muted));
}

.refresh-icon {
  margin-right: 4px;
}

.interval-select {
  width: 90px;
}

.last-refresh {
  font-size: 11px;
  padding-left: var(--apm-space-3);
  border-left: 1px solid var(--border-subtle, var(--apm-border-soft));
}

/* 图表导出按钮 */
.chart-export-btn {
  font-size: 12px;
  color: var(--text-tertiary, var(--apm-muted));
}

.chart-export-btn:hover {
  color: var(--brand-500, var(--apm-accent));
}

/* 趋势时间范围切换 */
.trend-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trend-range {
  flex-shrink: 0;
}

.trend-range :deep(.el-radio-button__inner) {
  padding: 6px 10px;
  font-size: 12px;
}

/* 图表导出：让 ECharts 实例可被 exportChart 定位 */

/* ---- 统计卡 ---- */
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--apm-space-3);
  padding: var(--apm-space-4) var(--apm-space-5);
  text-align: left;
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-default, var(--apm-panel-border));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition:
    transform var(--transition-base, var(--apm-t-fast)),
    box-shadow var(--transition-base, var(--apm-t-fast)),
    border-color var(--transition-base, var(--apm-t-fast));
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, var(--apm-shadow-card-hover));
  border-color: color-mix(in srgb, var(--card-accent) 42%, transparent);
}

.stat-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-500, var(--apm-accent)) 30%, transparent);
}

.stat-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md, var(--apm-radius-md));
  background: color-mix(in srgb, var(--card-accent) 16%, transparent);
  color: var(--card-accent);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary, var(--apm-fg));
}

.stat-label {
  font-size: 12.5px;
  color: var(--text-tertiary, var(--apm-muted));
  white-space: nowrap;
}

/* 下钻箭头：默认弱化，悬停时显形并位移，暗示可点 */
.stat-arrow {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--card-accent);
  opacity: 0;
  transform: translateX(-4px);
  transition:
    opacity var(--transition-base, var(--apm-t-fast)),
    transform var(--transition-base, var(--apm-t-fast));
}

.stat-card:hover .stat-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ---- 图表 ---- */
.panel-chart {
  width: 100%;
}

/* ---- 排行表 ---- */
.rank-table :deep(.el-table__row) {
  cursor: pointer;
}

.rank-table :deep(.el-table__row:hover td) {
  background: var(--bg-hover, var(--apm-panel-active));
}

.service-cell {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 响应式 ---- */
@media (max-width: 1100px) {
  .health-metric {
    display: none;
  }
}

@media (max-width: 640px) {
  .view-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}

/* 尊重「减少动态效果」偏好：脉冲与上浮全部关掉 */
@media (prefers-reduced-motion: reduce) {
  .health-chip.danger .health-chip-dot {
    animation: none;
  }

  .stat-card,
  .stat-card:hover,
  .stat-arrow {
    transition: none;
    transform: none;
  }
}
</style>
