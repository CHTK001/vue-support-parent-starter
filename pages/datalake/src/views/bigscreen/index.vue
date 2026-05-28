<template>
  <div class="bigscreen">
    <!-- 顶部标题栏 -->
    <div class="bigscreen-header">
      <div class="bigscreen-title">
        <svg class="bigscreen-logo" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span>数据中台 · 全景大屏</span>
      </div>
      <div class="bigscreen-time">{{ currentTime }}</div>
    </div>

    <!-- 核心指标 -->
    <div class="bigscreen-metrics">
      <div v-for="m in metrics" :key="m.label" class="metric-card" :style="{ '--accent': m.color }">
        <div class="metric-icon"><el-icon :size="22"><component :is="m.icon" /></el-icon></div>
        <div class="metric-body">
          <div class="metric-value">{{ m.value }}</div>
          <div class="metric-label">{{ m.label }}</div>
        </div>
        <div class="metric-trend" v-if="m.trend">
          <span :class="m.trend > 0 ? 'up' : 'down'">{{ m.trend > 0 ? '+' : '' }}{{ m.trend }}%</span>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="bigscreen-charts">
      <el-card shadow="never" class="chart-card">
        <template #header><span class="chart-title">📈 吞吐量趋势</span></template>
        <div ref="throughputRef" class="chart-box" />
      </el-card>
      <el-card shadow="never" class="chart-card">
        <template #header><span class="chart-title">⚠️ 错误率趋势</span></template>
        <div ref="errorRef" class="chart-box" />
      </el-card>
    </div>

    <!-- 底部状态 -->
    <div class="bigscreen-footer">
      <div class="footer-item">
        <span class="footer-label">系统状态</span>
        <span class="footer-value status-ok">● 运行正常</span>
      </div>
      <div class="footer-item">
        <span class="footer-label">数据节点</span>
        <span class="footer-value">{{ metrics[0].value }} 个</span>
      </div>
      <div class="footer-item">
        <span class="footer-label">今日处理</span>
        <span class="footer-value">{{ metrics[1].value }}</span>
      </div>
      <div class="footer-item">
        <span class="footer-label">更新时间</span>
        <span class="footer-value">{{ currentTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { DataBoard, Timer, Warning, Connection, MessageBox, Bell } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { fetchMonitorStats, fetchThroughput, fetchErrors } from "../../api/monitor";
import { connectWs, disconnectWs, onWsMessage } from "../../api/ws";
import type { MonitorStats } from "../../types";

defineOptions({ name: "DatalakeBigscreenPage" });

// ── 时钟 ──
const currentTime = ref("");
let clockTimer: ReturnType<typeof setInterval> | null = null;

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleString("zh-CN", { hour12: false });
}

// ── 指标 ──
const stats = ref<MonitorStats | null>(null);
const metrics = ref([
  { label: "活跃管线", value: "0", color: "#3b82f6", icon: DataBoard, trend: null as number | null },
  { label: "今日处理", value: "0", color: "#22c55e", icon: Timer, trend: null as number | null },
  { label: "今日错误", value: "0", color: "#ef4444", icon: Warning, trend: null as number | null },
  { label: "吞吐量", value: "0/s", color: "#f59e0b", icon: Connection, trend: null as number | null },
  { label: "订阅数", value: "0", color: "#8b5cf6", icon: Bell, trend: null as number | null },
  { label: "死信数", value: "0", color: "#ec4899", icon: MessageBox, trend: null as number | null },
]);

// ── 图表 ──
const throughputRef = ref<HTMLElement>();
const errorRef = ref<HTMLElement>();
let throughputChart: echarts.ECharts | null = null;
let errorChart: echarts.ECharts | null = null;

function initCharts() {
  if (throughputRef.value) {
    throughputChart = echarts.init(throughputRef.value);
    throughputChart.setOption({
      tooltip: { trigger: "axis", backgroundColor: "rgba(11,15,34,0.9)", borderColor: "#1e2a45", textStyle: { color: "#e2e8f0" } },
      grid: { left: 50, right: 20, top: 25, bottom: 25 },
      xAxis: { type: "category", axisLine: { lineStyle: { color: "#1e2a45" } }, axisLabel: { color: "#5a6478" } },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(30,42,69,0.5)" } }, axisLabel: { color: "#5a6478" } },
      series: [{ type: "line", smooth: true, data: [], areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(59,130,246,0.3)" }, { offset: 1, color: "rgba(59,130,246,0.02)" }]) }, itemStyle: { color: "#3b82f6" } }],
    });
  }
  if (errorRef.value) {
    errorChart = echarts.init(errorRef.value);
    errorChart.setOption({
      tooltip: { trigger: "axis", backgroundColor: "rgba(11,15,34,0.9)", borderColor: "#1e2a45", textStyle: { color: "#e2e8f0" } },
      grid: { left: 50, right: 20, top: 25, bottom: 25 },
      xAxis: { type: "category", axisLine: { lineStyle: { color: "#1e2a45" } }, axisLabel: { color: "#5a6478" } },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(30,42,69,0.5)" } }, axisLabel: { color: "#5a6478" } },
      series: [{ type: "line", smooth: true, data: [], areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(239,68,68,0.3)" }, { offset: 1, color: "rgba(239,68,68,0.02)" }]) }, itemStyle: { color: "#ef4444" } }],
    });
  }
}

function updateChart(chart: echarts.ECharts | null, data: Array<{ time: string; value: number }>) {
  if (!chart) return;
  chart.setOption({
    xAxis: { data: data.map((d) => { const t = new Date(d.time); return t.getHours() + ":00"; }) },
    series: [{ data: data.map((d) => d.value) }],
  });
}

function applyMonitorStats(s: MonitorStats) {
  stats.value = s;
  metrics.value = [
    { label: "活跃管线", value: String(s.activePipelines ?? 0), color: "#3b82f6", icon: DataBoard, trend: null },
    { label: "今日处理", value: (s.todayProcessed ?? 0).toLocaleString(), color: "#22c55e", icon: Timer, trend: null },
    { label: "今日错误", value: String(s.todayErrors ?? 0), color: "#ef4444", icon: Warning, trend: null },
    { label: "吞吐量", value: (s.throughput ?? 0) + "/s", color: "#f59e0b", icon: Connection, trend: null },
    { label: "订阅数", value: String(s.activeSubscriptions ?? 0), color: "#8b5cf6", icon: Bell, trend: null },
    { label: "死信数", value: String(s.dlqSize ?? 0), color: "#ec4899", icon: MessageBox, trend: null },
  ];
}

// ── WebSocket 消息处理 ──
function handleWsMessage(data: any) {
  if (!data || !data.type) return;
  if (data.type === "monitor_update") {
    if (data.stats) applyMonitorStats(data.stats);
    if (data.throughput?.data) updateChart(throughputChart, data.throughput.data);
    if (data.errors?.data) updateChart(errorChart, data.errors.data);
  }
}

// ── 初始加载（REST 回退） ──
async function loadInitialData() {
  try {
    const [statsRes, tpRes, errRes] = await Promise.allSettled([
      fetchMonitorStats(),
      fetchThroughput(),
      fetchErrors(),
    ]);
    if (statsRes.status === "fulfilled" && statsRes.value?.data) {
      const s = statsRes.value.data as any;
      applyMonitorStats(s.data || s);
    }
    if (tpRes.status === "fulfilled" && tpRes.value?.data?.data) {
      updateChart(throughputChart, tpRes.value.data.data);
    }
    if (errRes.status === "fulfilled" && errRes.value?.data?.data) {
      updateChart(errorChart, errRes.value.data.data);
    }
  } catch { /* ignore */ }
}

// ── 生命周期 ──
let unsubWs: (() => void) | null = null;

onMounted(() => {
  updateTime();
  clockTimer = setInterval(updateTime, 1000);
  initCharts();
  loadInitialData();

  // WS 实时数据
  connectWs();
  unsubWs = onWsMessage(handleWsMessage);
});

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
  throughputChart?.dispose();
  errorChart?.dispose();
  unsubWs?.();
});
</script>

<style scoped>
.bigscreen {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  padding: 4px;
  background: transparent;
}

/* ── 标题栏 ── */
.bigscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.06));
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 12px;
}

.bigscreen-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: 0.03em;
}

.bigscreen-logo {
  color: #3b82f6;
  filter: drop-shadow(0 0 8px rgba(59,130,246,0.4));
}

.bigscreen-time {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
  font-family: "Courier New", monospace;
  letter-spacing: 0.05em;
  background: rgba(59,130,246,0.08);
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid rgba(59,130,246,0.1);
}

/* ── 指标卡片 ── */
.bigscreen-metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(11,15,34,0.6);
  border: 1px solid rgba(30,42,69,0.5);
  border-radius: 10px;
  border-left: 3px solid var(--accent);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
}

.metric-card:hover {
  border-color: var(--accent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 12%, transparent);
  transform: translateY(-2px);
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  flex-shrink: 0;
}

.metric-body {
  flex: 1;
  min-width: 0;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.2;
  font-family: "Courier New", monospace;
}

.metric-label {
  font-size: 11px;
  color: #5a6478;
  margin-top: 2px;
  letter-spacing: 0.02em;
}

.metric-trend {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
}

.metric-trend .up { color: #22c55e; }
.metric-trend .down { color: #ef4444; }

/* ── 图表 ── */
.bigscreen-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.chart-card {
  background: rgba(11,15,34,0.6);
  border: 1px solid rgba(30,42,69,0.5);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}

.chart-card :deep(.el-card__body) {
  flex: 1;
  padding: 8px 16px 16px;
  min-height: 0;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #c8d0dc;
}

.chart-box {
  width: 100%;
  height: 100%;
  min-height: 220px;
}

/* ── 底部状态栏 ── */
.bigscreen-footer {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12px 24px;
  background: rgba(11,15,34,0.4);
  border: 1px solid rgba(30,42,69,0.4);
  border-radius: 10px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-label {
  font-size: 12px;
  color: #5a6478;
}

.footer-value {
  font-size: 13px;
  font-weight: 600;
  color: #c8d0dc;
}

.status-ok {
  color: #22c55e;
}

/* ── 响应式 ── */
@media (max-width: 1200px) {
  .bigscreen-metrics { grid-template-columns: repeat(3, 1fr); }
  .bigscreen-charts { grid-template-columns: 1fr; }
}
</style>
