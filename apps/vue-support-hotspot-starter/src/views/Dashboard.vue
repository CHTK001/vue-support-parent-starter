<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">Agent 状态</span>
        <el-tag v-if="stats.agentActive" type="success" effect="dark" round >已注入</el-tag>
        <el-tag v-else type="info" effect="plain" round >未注入</el-tag>
        <span class="live-dot" title="SSE 实时推送中">
          <i class="live-pulse"></i>实时
        </span>
      </div>
      <el-button round @click="load" :loading="loading">
        <el-icon class="mr-1"><Refresh /></el-icon>刷新
      </el-button>
    </div>

    <!-- 系统健康（SkyWalking 饱和度派生指标，仅当 stats.health 存在时显示） -->
    <div v-if="healthType" class="health-bar">
      <ReStatusIndicator :type="healthType" :pulse="stats.health === 'SATURATED'" />
      <span class="health-label">{{ healthLabel }}</span>
      <span class="health-metric">QPS {{ stats.qps ?? 0 }}</span>
      <span class="health-metric">错误率 {{ stats.errorRate ?? 0 }}%</span>
      <span class="health-metric">活跃泄漏 {{ stats.activeLeaks ?? 0 }}</span>
      <span class="health-metric sla-metric" v-if="sla">
        可用率
        <b :class="slaPercentClass">{{ sla.slaPercent.toFixed(2) }}%</b>
        <span class="sla-detail">成功 {{ sla.successCount }} / {{ sla.totalCount }}</span>
      </span>
      <el-button text type="primary" @click="router.push('/alerts')">
        告警中心 →
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div
        v-for="c in cards"
        :key="c.key"
        class="stat-card clickable"
        :style="{ '--accent': c.color } as any"
        @click="onCardClick(c)"
      >
        <div class="stat-icon">
          <el-icon :size="22"><component :is="c.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ c.value }}</div>
          <div class="stat-label">{{ c.label }}</div>
        </div>
        <div class="stat-glow" />
      </div>
    </div>

    <!-- 图表区 -->
    <div class="chart-grid">
      <div class="panel">
        <div class="panel-head">
          <span>传输协议分布</span>
          <span class="panel-sub">Top 协议调用占比</span>
        </div>
        <div ref="pieRef" class="panel-chart" />
      </div>
      <div class="panel">
        <div class="panel-head">
          <span>状态构成</span>
          <span class="panel-sub">成功 / 失败</span>
        </div>
        <div ref="barRef" class="panel-chart" />
      </div>
    </div>

    <!-- 趋势区 -->
    <div class="panel">
      <div class="panel-head">
        <span>传输趋势</span>
        <span class="panel-sub">最近 30 分钟调用量 / 错误数（每分钟聚合）</span>
      </div>
      <div ref="trendRef" class="panel-chart" />
    </div>

    <!-- 错误率 & 平均耗时趋势（后端 /trend 分桶） -->
    <div class="panel">
      <div class="panel-head">
        <span>错误率 & 平均耗时趋势</span>
        <span class="panel-sub">最近 30 分钟（每分钟分桶，双轴）</span>
      </div>
      <div ref="errorTrendRef" class="panel-chart" />
    </div>

    <!-- 排行区（服务 Top / 慢调用 / 错误排行） -->
    <div class="rank-grid">
      <div class="panel">
        <div class="panel-head">
          <span>服务 Top N</span>
          <span class="panel-sub">按调用次数 / 错误率</span>
        </div>
        <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" —— 本页 .apm-table 变量覆盖与
             .apm-table :deep(.el-table__row){cursor:pointer} 依赖 el-table 的 DOM，vxe 引擎会让它们全部落空；
             pagination=false / toolbar=false —— 原表既无分页也无工具栏按钮；
             原 el-table 没写 border → settings.border=false 抑制默认边框；
             layout-table.minHeight=0 关掉组件默认的 440px 撑高与 fill 自适应。
             三张排行表各自独立 columns，插槽名互不重名，作用域无歧义。 -->
        <ReTable
          :data="(services.slice(0, 8)) as unknown as Record<string, unknown>[]"
          :columns="serviceColumns"
          engine="element"
          :pagination="false"
          :toolbar="false"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table"
          empty-text="暂无服务数据"
          @row-click="(r: Record<string, unknown>) => router.push('/endpoints')"
        >
          <template #col-service="{ row }">
            <span class="mono">{{ row.service }}</span>
          </template>
          <template #col-errorRate="{ row }">
            <span :class="['mono', errorCountOf(row) > 0 ? 'err' : 'muted']">
              {{ errorRatePct(row) }}%
            </span>
          </template>
        </ReTable>
      </div>

      <div class="panel">
        <div class="panel-head">
          <span>慢调用 Top 5</span>
          <span class="panel-sub">耗时最长的调用</span>
        </div>
        <ReTable
          :data="(slowCalls.slice(0, 5)) as unknown as Record<string, unknown>[]"
          :columns="slowCallColumns"
          engine="element"
          :pagination="false"
          :toolbar="false"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table"
          empty-text="暂无慢调用"
          @row-click="(r: Record<string, unknown>) => openTrace(r as never)"
        >
          <template #col-operation="{ row }">
            <span class="mono">{{ String(row.operation ?? '—').slice(0, 24) }}</span>
          </template>
          <template #col-durationMs="{ row }">
            <span class="mono warn">{{ row.durationMs }}ms</span>
          </template>
          <template #col-status="{ row }">
            <span :class="['mono', row.status === 'OK' ? 'ok' : 'err']">{{ row.status || "OK" }}</span>
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
          :pagination="false"
          :toolbar="false"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table"
          empty-text="暂无错误"
          @row-click="(r: Record<string, unknown>) => router.push('/errors')"
        >
          <template #col-errorType="{ row }">
            <span class="mono err">{{ String(row.errorType ?? '—').slice(0, 18) }}</span>
          </template>
          <template #col-errorMessage="{ row }">
            <span class="muted">{{ String(row.errorMessage ?? '—').slice(0, 30) }}</span>
          </template>
        </ReTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";
import {
  DataAnalysis,
  Document,
  Refresh,
  Share,
  Warning,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import ReStatusIndicator from "@repo/ui/re-status-indicator";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getStats, watchStats, pageTransmissions, getServices, getSlowCalls, getErrorRanking, getSla, getTrend } from "../api/apmApi";
import type { ApmStats, ApmService, SlowCall, ErrorRanking, SlaStats, TrendPoint } from "../api/apmApi";

const router = useRouter();

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
const pieRef = ref<HTMLElement | null>(null);
const barRef = ref<HTMLElement | null>(null);
const trendRef = ref<HTMLElement | null>(null);
const errorTrendRef = ref<HTMLElement | null>(null);
let sseWatch: { close: () => void } | null = null;
let trendTimer: number | undefined;
let trendChart: echarts.ECharts | null = null;
let errorTrendChart: echarts.ECharts | null = null;

/** 排行数据 */
const services = ref<ApmService[]>([]);
const slowCalls = ref<SlowCall[]>([]);
const errorRanking = ref<ErrorRanking[]>([]);
/** SLA 统计 */
const sla = ref<SlaStats | null>(null);

const slaPercentClass = computed(() => {
  const p = sla.value?.slaPercent ?? 100;
  if (p >= 99) return "sla-ok";
  if (p >= 95) return "sla-warn";
  return "sla-bad";
});

function openTrace(r: SlowCall) {
  if (r.traceId) router.push({ path: "/traces/detail", query: { traceId: r.traceId } });
}

/**
 * 三张排行表的列配置（每张表一个独立数组，原 9 个 el-table-column 收敛到这里）。
 *
 * <p>标题都是写死文案（没有 t()），用普通常量即可。原没有 prop 的自定义列补了
 * 稳定合成 prop（错误率 / 操作 / 状态 / 错误类型 / 消息），模板里一一对应
 * #col-&lt;prop&gt; 插槽；三张表插槽名互不重名。</p>
 */
const serviceColumns: ReTableColumn[] = [
  { prop: "service", label: "服务", minWidth: 140, slot: "service" },
  { prop: "callCount", label: "调用", width: 70, align: "right", sortable: true },
  { prop: "errorRate", label: "错误率", width: 80, align: "right", slot: "errorRate" },
];

const slowCallColumns: ReTableColumn[] = [
  { prop: "operation", label: "操作", minWidth: 120, slot: "operation" },
  { prop: "durationMs", label: "耗时", width: 70, align: "right", slot: "durationMs" },
  { prop: "status", label: "状态", width: 60, align: "center", slot: "status" },
];

const errorRankingColumns: ReTableColumn[] = [
  { prop: "errorType", label: "错误类型", width: 100, slot: "errorType" },
  { prop: "callCount", label: "次数", width: 60, align: "right", sortable: true },
  { prop: "errorMessage", label: "消息", minWidth: 120, slot: "errorMessage" },
];

/** 排行表的 row 是宽类型（unknown）：错误次数是算术/比较入参，先收窄成 number */
function errorCountOf(row: Record<string, unknown>): number {
  return Number(row.errorCount ?? 0);
}

/** 错误率（% 文本）：与原模板 Math.round(10000 * errorCount / callCount) / 100 口径一致 */
function errorRatePct(row: Record<string, unknown>): string {
  const calls = Number(row.callCount ?? 0);
  const errs = errorCountOf(row);
  return (calls > 0 ? Math.round((10000 * errs) / calls) / 100 : 0).toString();
}

const cards = computed(() => [
  {
    key: "transmissions",
    label: "传输记录",
    value: stats.value.transmissionCount,
    icon: DataAnalysis,
    color: "#3b82f6",
  },
  {
    key: "deps",
    label: "依赖关系",
    value: stats.value.dependencyCount,
    icon: Share,
    color: "#8b5cf6",
  },
  {
    key: "leaks",
    label: "资源泄漏",
    value: stats.value.leakCount,
    icon: Warning,
    color: "#f59e0b",
  },
  {
    key: "traces",
    label: "调用链路",
    value: stats.value.traceCount,
    icon: Document,
    color: "#22c55e",
  },
]);

/** 卡片点击下钻路由 */
const cardRoutes: Record<string, string> = {
  transmissions: "/traces",
  deps: "/dependencies",
  leaks: "/leaks",
  traces: "/traces",
};
function onCardClick(c: { key: string }) {
  const to = cardRoutes[c.key];
  if (to) router.push(to);
}

/** 健康状态映射（仅后端并入 health 后非空） */
const healthType = computed((): "success" | "warning" | "danger" | null => {
  const h = stats.value.health;
  if (h === "HEALTHY") return "success";
  if (h === "DEGRADED") return "warning";
  if (h === "SATURATED") return "danger";
  return null;
});
const healthLabel = computed(() => {
  const h = stats.value.health;
  if (h === "HEALTHY") return "系统健康";
  if (h === "DEGRADED") return "性能降级";
  if (h === "SATURATED") return "资源饱和";
  return "未知";
});

async function load() {
  loading.value = true;
  try {
    const s = await getStats();
    stats.value = s;
    renderCharts();
  } catch {
    ElMessage.error("加载统计失败");
  } finally {
    loading.value = false;
  }
  await loadRanks();
}

/** 加载排行 + SLA 数据 */
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

function renderCharts() {
  if (pieRef.value) {
    const c = echarts.init(pieRef.value, "dark");
    c.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: "#0b0f1a", borderWidth: 2 },
          label: { color: "#e6edf7" },
          data: [
            { name: "传输", value: stats.value.transmissionCount, itemStyle: { color: "#3b82f6" } },
            { name: "依赖", value: stats.value.dependencyCount, itemStyle: { color: "#8b5cf6" } },
            { name: "泄漏", value: stats.value.leakCount, itemStyle: { color: "#f59e0b" } },
            { name: "链路", value: stats.value.traceCount, itemStyle: { color: "#22c55e" } },
          ],
        },
      ],
    });
  }
  if (barRef.value) {
    const c = echarts.init(barRef.value, "dark");
    c.setOption({
      backgroundColor: "transparent",
      grid: { left: 40, right: 20, top: 20, bottom: 24 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: ["成功", "失败"], axisLabel: { color: "#e6edf7" } },
      yAxis: { type: "value", axisLabel: { color: "#e6edf7" } },
      series: [
        {
          type: "bar",
          barWidth: 36,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: (p: { dataIndex: number }) =>
              p.dataIndex === 0 ? "#22c55e" : "#ef4444",
          },
          data: [stats.value.transmissionCount - stats.value.errorCount, stats.value.errorCount],
        },
      ],
    });
  }
}

/** 拉取最近传输记录并按分钟聚合渲染趋势图（拉取失败静默，不影响主视图）。 */
async function loadTrend() {
  try {
    const res = await pageTransmissions({ page: 1, size: 500 });
    renderTrend(res.items);
  } catch {
    /* 趋势图降级为空 */
  }
}

/** 按 startTime 分钟分桶聚合（最近 30 分钟），渲染调用量面积 + 错误数折线。 */
function renderTrend(items: { startTime: string; status: string }[]) {
  if (!trendRef.value) {
    return;
  }
  const now = Date.now();
  const buckets = new Map<number, { total: number; errors: number }>();
  for (let i = 29; i >= 0; i--) {
    buckets.set(Math.floor((now - i * 60_000) / 60_000), { total: 0, errors: 0 });
  }
  for (const it of items) {
    const t = Date.parse(it.startTime);
    if (Number.isNaN(t)) {
      continue;
    }
    const key = Math.floor(t / 60_000);
    const b = buckets.get(key);
    if (b) {
      b.total++;
      if ((it.status || "").toUpperCase() !== "OK") {
        b.errors++;
      }
    }
  }
  const xs: string[] = [];
  const totals: number[] = [];
  const errors: number[] = [];
  const hm = (ms: number) => {
    const d = new Date(ms);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  for (const [key, b] of [...buckets.entries()].sort((a, b2) => a[0] - b2[0])) {
    xs.push(hm(key * 60_000));
    totals.push(b.total);
    errors.push(b.errors);
  }
  if (!trendChart) {
    trendChart = echarts.init(trendRef.value, "dark");
  }
  trendChart.setOption({
    backgroundColor: "transparent",
    grid: { left: 40, right: 20, top: 30, bottom: 24 },
    tooltip: { trigger: "axis" },
    legend: { data: ["调用量", "错误数"], textStyle: { color: "#e6edf7" }, top: 0 },
    xAxis: { type: "category", data: xs, axisLabel: { color: "#e6edf7" }, boundaryGap: false },
    yAxis: { type: "value", minInterval: 1, axisLabel: { color: "#e6edf7" } },
    series: [
      {
        name: "调用量",
        type: "line",
        smooth: true,
        symbol: "none",
        data: totals,
        lineStyle: { color: "#3b82f6", width: 2 },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59,130,246,0.35)" },
              { offset: 1, color: "rgba(59,130,246,0)" },
            ],
          },
        },
      },
      {
        name: "错误数",
        type: "line",
        smooth: true,
        symbol: "none",
        data: errors,
        lineStyle: { color: "#ef4444", width: 2 },
      },
    ],
  });
}

/** 拉取后端 /trend 分桶数据，渲染错误率（左轴 %）+ 平均耗时（右轴 ms）双轴折线。 */
async function loadErrorTrend() {
  try {
    renderErrorTrend(await getTrend(30, 60));
  } catch {
    /* 降级为空 */
  }
}

function renderErrorTrend(points: TrendPoint[]) {
  if (!errorTrendRef.value) {
    return;
  }
  if (!errorTrendChart) {
    errorTrendChart = echarts.init(errorTrendRef.value, "dark");
  }
  const hm = (ms: number) => {
    const d = new Date(ms);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  errorTrendChart.setOption({
    backgroundColor: "transparent",
    grid: { left: 44, right: 44, top: 30, bottom: 24 },
    tooltip: { trigger: "axis" },
    legend: { data: ["错误率 %", "平均耗时 ms"], textStyle: { color: "#e6edf7" }, top: 0 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: points.map((p) => hm(p.bucketStart)),
      axisLabel: { color: "#e6edf7" },
    },
    yAxis: [
      { type: "value", name: "%", axisLabel: { color: "#e6edf7" } },
      { type: "value", name: "ms", axisLabel: { color: "#e6edf7" } },
    ],
    series: [
      {
        name: "错误率 %",
        type: "line",
        smooth: true,
        symbol: "none",
        data: points.map((p) => Number(p.errorRatePercent.toFixed(2))),
        lineStyle: { color: "#ef4444", width: 2 },
        areaStyle: { color: "rgba(239,68,68,0.2)" },
      },
      {
        name: "平均耗时 ms",
        type: "line",
        smooth: true,
        symbol: "none",
        yAxisIndex: 1,
        data: points.map((p) => Number(p.avgMs.toFixed(1))),
        lineStyle: { color: "#f59e0b", width: 2 },
      },
    ],
  });
}

onMounted(async () => {
  await load();
  await loadTrend();
  await loadErrorTrend();
  // 趋势图每 15s 刷新一次（SSE 快照只更新计数，趋势聚合较重不需每 3s 做）
  trendTimer = window.setInterval(() => {
    loadTrend();
    loadErrorTrend();
  }, 15000);
  // SSE 实时刷新：每 3s 后端推一次 stats 快照，替代 HTTP 轮询
  sseWatch = watchStats((snapshot) => {
    Object.assign(stats.value, snapshot);
    renderCharts();
  });
});

onBeforeUnmount(() => {
  sseWatch?.close();
  if (trendTimer) window.clearInterval(trendTimer);
  trendChart?.dispose();
  trendChart = null;
  errorTrendChart?.dispose();
  errorTrendChart = null;
});

watch(stats, () => renderCharts(), { deep: true });
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 13px;
  color: var(--apm-muted);
}

.live-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--apm-success);
}

/* 实时脉冲点：用 border + transform 做外扩脉冲，不用 box-shadow。
   理由：koi 规约只允许「焦点环」「悬浮反馈」两类投影；且 border 在关闭动画后
   仍留下一圈实色描边，关动效不会丢掉「SSE 实时推送中」这个唯一信号。 */
.live-pulse {
  box-sizing: border-box;
  width: 9px;
  height: 9px;
  border: 2px solid var(--apm-success);
  border-radius: var(--el-radius-full, 9999px);
  background: transparent;
  animation: live-pulse 1.6s ease-out infinite;
}

@keyframes live-pulse {
  0% {
    transform: scale(0.55);
    border-color: color-mix(in srgb, var(--el-color-success) 70%, transparent);
  }
  70% {
    transform: scale(1);
    border-color: color-mix(in srgb, var(--el-color-success) 0%, transparent);
  }
  100% {
    transform: scale(1);
    border-color: color-mix(in srgb, var(--el-color-success) 0%, transparent);
  }
}

.mr-1 {
  margin-right: 4px;
  vertical-align: -2px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

/* ---- 统计卡片 ---- */
.stat-card {
  position: relative;
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px，取最近档 lg */
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}

.stat-card.clickable {
  cursor: pointer;
  outline: none;
}

.stat-card.clickable:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.stat-card.clickable::after {
  content: "→";
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--apm-muted);
  opacity: 0;
  transition:
    opacity var(--el-transition-duration-fast, 0.2s) ease,
    right var(--el-transition-duration-fast, 0.2s) ease;
}

.stat-card.clickable:hover::after {
  opacity: 1;
  right: 14px;
  color: var(--accent);
}

/* ---- 健康条 ---- */
.health-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px);
  padding: 12px 16px;
}

.health-label {
  font-size: 14px;
  font-weight: 600;
}

.health-metric {
  font-size: 12px;
  color: var(--apm-muted);
  font-variant-numeric: tabular-nums;
}

.health-bar .el-button {
  margin-left: auto;
}

/* ---- SLA ---- */
.sla-metric b {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.sla-detail {
  margin-left: 6px;
  color: var(--apm-muted);
  font-size: 11px;
}

.sla-ok {
  color: var(--apm-success);
}

.sla-warn {
  color: var(--apm-warning);
}

.sla-bad {
  color: var(--apm-danger);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--el-radius-lg, 12px);
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 13px;
  color: var(--apm-muted);
}

.stat-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%);
  pointer-events: none;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px */
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-head span:first-child {
  font-size: 15px;
  font-weight: 600;
}

.panel-sub {
  font-size: 12px;
  color: var(--apm-muted);
}

.panel-chart {
  height: 260px;
  width: 100%;
}

/* ---- 排行网格 ---- */
.rank-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

/* ---- 表格样式 ---- */
.apm-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: var(--el-fill-color-lighter);
  --el-table-text-color: var(--apm-fg);
  --el-table-header-text-color: var(--apm-muted);
}

.apm-table :deep(.el-table__row) {
  cursor: pointer;
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
}

.muted {
  color: var(--apm-muted);
}

.err {
  color: var(--apm-danger);
}

.warn {
  color: var(--apm-warning);
}

.ok {
  color: var(--apm-success);
}

@media (max-width: 1200px) {
  .rank-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-grid {
    grid-template-columns: 1fr;
  }
}

/* 尊重系统「减少动态效果」偏好：
   .live-pulse 关掉脉冲后仍保留一圈实色描边（border 不随 animation 变化），
   「SSE 实时推送中」这个唯一信号不会因为关动效而丢失 */
@media (prefers-reduced-motion: reduce) {
  .live-pulse {
    animation: none;
  }
  .stat-card,
  .stat-card.clickable::after {
    transition: none;
  }
}
</style>
