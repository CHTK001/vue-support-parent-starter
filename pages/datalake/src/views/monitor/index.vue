<template>
  <div class="monitor-page">
    <!-- 统计卡片 -->
    <div class="page-metrics">
      <div v-for="card in statCards" :key="card.label" class="metric-card" :style="{ '--accent': card.color }">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" :stroke="card.color" stroke-width="1.5">
            <path :d="card.icon" />
          </svg>
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ card.value }}</div>
          <div class="metric-label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <!-- 图表 -->
    <div class="chart-grid">
      <DatalakePanel
        title="吞吐量趋势 (条/小时)"
        icon-path="M22 12 18 12 15 21 9 3 6 12 2 12"
        icon-color="#38bdf8"
        tech-theme="DV1"
      >
        <div ref="throughputRef" class="chart-box" />
      </DatalakePanel>
      <DatalakePanel
        title="错误率趋势"
        icon-path="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01"
        icon-color="#ef4444"
        tech-theme="DV2"
      >
        <div ref="errorRef" class="chart-box" />
      </DatalakePanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import * as echarts from "echarts";
import DatalakePanel from "../../components/DatalakePanel.vue";
import { fetchMonitorStats, fetchThroughput, fetchErrors } from "../../api/monitor";
import type { MonitorStats } from "../../types";

defineOptions({ name: "DatalakeMonitorPage" });

const stats = ref<MonitorStats | null>(null);
const throughputRef = ref<HTMLElement>();
const errorRef = ref<HTMLElement>();

const chartTheme = {
  tooltip: {
    trigger: "axis" as const,
    backgroundColor: "rgba(11,15,34,0.9)",
    borderColor: "#1e2a45",
    textStyle: { color: "#e2e8f0" },
  },
  grid: { left: 50, right: 20, top: 25, bottom: 25 },
};

const iconPaths: Record<string, string> = {
  DataBoard: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",
  Timer: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  Warning: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  Connection: "M5 12h14M12 5l7 7-7 7",
};

const statCards = computed(() => [
  { label: "活跃 Pipeline", value: stats.value?.activePipelines ?? 0, color: "#3b82f6", icon: iconPaths.DataBoard },
  { label: "今日处理量", value: (stats.value?.todayProcessed ?? 0).toLocaleString(), color: "#22c55e", icon: iconPaths.Timer },
  { label: "今日错误", value: stats.value?.todayErrors ?? 0, color: "#ef4444", icon: iconPaths.Warning },
  { label: "吞吐量(条/秒)", value: stats.value?.throughput ?? 0, color: "#f59e0b", icon: iconPaths.Connection },
]);

const initChart = (el: HTMLElement, data: Array<{ time: string; value: number }>, name: string, color: string) => {
  const chart = echarts.init(el);
  chart.setOption({
    ...chartTheme,
    xAxis: { type: "category", data: data.map((d) => new Date(d.time).getHours() + ":00"), axisLine: { lineStyle: { color: "#1e2a45" } }, axisLabel: { color: "#5a6478" } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(30,42,69,0.5)" } }, axisLabel: { color: "#5a6478" } },
    series: [{
      name, type: "line", smooth: true, data: data.map((d) => d.value),
      lineStyle: { color, width: 1.5 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: color + "40" },
        { offset: 1, color: color + "05" },
      ])},
      itemStyle: { color },
    }],
  });
  window.addEventListener("resize", () => chart.resize());
};

onMounted(async () => {
  try {
    const [statsRes, tpRes, errRes] = await Promise.all([
      fetchMonitorStats(),
      fetchThroughput(),
      fetchErrors(),
    ]);
    stats.value = statsRes?.data || null;
    await nextTick();
    if (throughputRef.value && tpRes?.data) {
      initChart(throughputRef.value, tpRes.data, "吞吐量", "#3b82f6");
    }
    if (errorRef.value && errRes?.data) {
      initChart(errorRef.value, errRes.data, "错误数", "#ef4444");
    }
  } catch {}
});
</script>

<style scoped>
.monitor-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.35s ease;
  font-family: "Space Mono", "Courier New", monospace;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ===== 指标卡片 ===== */
.page-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.metric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  backdrop-filter: blur(4px);
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;
  border-left: 3px solid var(--accent, #3b82f6);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
}
.metric-card:hover {
  border-color: var(--accent, #3b82f6);
  box-shadow: 0 0 24px color-mix(in srgb, var(--accent, #3b82f6) 15%, transparent);
  transform: translateY(-1px);
}
.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent, #3b82f6) 12%, transparent);
  flex-shrink: 0;
}
.metric-body { flex: 1; min-width: 0; }
.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.2;
  font-family: "Space Mono", "Courier New", monospace;
}
.metric-label {
  font-size: 10px;
  color: rgba(148, 163, 184, 0.7);
  margin-top: 2px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ===== 面板 ===== */
.page-panel {
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  backdrop-filter: blur(4px);
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.03em;
}

/* ===== 图表网格 ===== */
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.chart-box {
  flex: 1;
  min-height: 280px;
  width: 100%;
}

@media (max-width: 900px) {
  .page-metrics { grid-template-columns: repeat(2, 1fr); }
  .chart-grid { grid-template-columns: 1fr; }
}
</style>
