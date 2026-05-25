<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-4 mb-4">
      <el-card shadow="hover" v-for="card in statCards" :key="card.label">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl" :style="{ background: card.color }">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ card.value }}</div>
            <div class="text-sm text-gray-500">{{ card.label }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表 -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <el-card shadow="never">
        <template #header><span>吞吐量趋势 (条/小时)</span></template>
        <div ref="throughputRef" style="height: 300px"></div>
      </el-card>
      <el-card shadow="never">
        <template #header><span>错误率趋势</span></template>
        <div ref="errorRef" style="height: 300px"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { DataBoard, Timer, Warning, Connection } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { fetchMonitorStats, fetchThroughput, fetchErrors } from "../../api/monitor";
import type { MonitorStats } from "../../types";

defineOptions({ name: "DatalakeMonitorPage" });

const stats = ref<MonitorStats | null>(null);
const throughputRef = ref<HTMLElement>();
const errorRef = ref<HTMLElement>();

const statCards = computed(() => [
  { label: "活跃 Pipeline", value: stats.value?.activePipelines ?? 0, color: "#409eff", icon: DataBoard },
  { label: "今日处理量", value: (stats.value?.todayProcessed ?? 0).toLocaleString(), color: "#67c23a", icon: Timer },
  { label: "今日错误", value: stats.value?.todayErrors ?? 0, color: "#f56c6c", icon: Warning },
  { label: "吞吐量(条/秒)", value: stats.value?.throughput ?? 0, color: "#e6a23c", icon: Connection },
]);

const initChart = (el: HTMLElement, data: Array<{ time: string; value: number }>, name: string, color: string) => {
  const chart = echarts.init(el);
  chart.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: data.map((d) => new Date(d.time).getHours() + ":00") },
    yAxis: { type: "value" },
    series: [{ name, type: "line", smooth: true, data: data.map((d) => d.value), areaStyle: { opacity: 0.15 }, itemStyle: { color } }],
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
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
    stats.value = statsRes?.data?.data || null;
    await nextTick();
    if (throughputRef.value && tpRes?.data?.data) {
      initChart(throughputRef.value, tpRes.data.data, "吞吐量", "#409eff");
    }
    if (errorRef.value && errRes?.data?.data) {
      initChart(errorRef.value, errRes.data.data, "错误数", "#f56c6c");
    }
  } catch {}
});
</script>
