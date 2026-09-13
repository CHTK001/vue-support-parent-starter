<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">Agent 状态</span>
        <el-tag v-if="stats.agentActive" type="success" effect="dark" round size="small">已注入</el-tag>
        <el-tag v-else type="info" effect="plain" round size="small">未注入</el-tag>
        <span class="live-dot" title="SSE 实时推送中">
          <i class="live-pulse"></i>实时
        </span>
      </div>
      <el-button size="small" round @click="load" :loading="loading">
        <el-icon class="mr-1"><Refresh /></el-icon>刷新
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div
        v-for="c in cards"
        :key="c.key"
        class="stat-card"
        :style="{ '--accent': c.color } as any"
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
import { getStats, watchStats, pageTransmissions } from "../api/apmApi";
import type { ApmStats } from "../api/apmApi";

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
let sseWatch: { close: () => void } | null = null;
let trendTimer: number | undefined;
let trendChart: echarts.ECharts | null = null;

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

onMounted(async () => {
  await load();
  await loadTrend();
  // 趋势图每 15s 刷新一次（SSE 快照只更新计数，趋势聚合较重不需每 3s 做）
  trendTimer = window.setInterval(loadTrend, 15000);
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
  color: var(--apm-success, #22c55e);
}

.live-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--apm-success, #22c55e);
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
  animation: live-pulse 1.6s ease-out infinite;
}

@keyframes live-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
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

.stat-card {
  position: relative;
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
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
  border-radius: 14px;
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

@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
