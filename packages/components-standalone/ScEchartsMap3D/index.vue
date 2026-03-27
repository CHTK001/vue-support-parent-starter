<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";

let echartsGlInstallPromise: Promise<void> | null = null;

async function ensureEchartsGl(): Promise<void> {
  if (!echartsGlInstallPromise) {
    echartsGlInstallPromise = import("echarts-gl")
      .then(() => undefined)
      .catch(error => {
        echartsGlInstallPromise = null;
        throw error;
      });
  }

  await echartsGlInstallPromise;
}

interface Props {
  /** ECharts 配置，要求 series 至少包含一个 3D 系列（如 map3D、bar3D 等） */
  option: echarts.EChartsOption;
  /** 宽度，默认 100% */
  width?: string | number;
  /** 高度，默认 400px */
  height?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
  width: "100%",
  height: "400px",
});

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

async function renderChart() {
  if (!chartRef.value) return;
  await ensureEchartsGl();
  if (!chartRef.value) return;
  if (!chart) {
    chart = echarts.init(chartRef.value);
  }
  chart.setOption(props.option, true);
}

function scheduleRender() {
  void renderChart().catch(error => {
    console.error("[ScEchartsMap3D] 图表渲染失败", error);
  });
}

onMounted(() => {
  scheduleRender();
});

onBeforeUnmount(() => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
});

watch(
  () => props.option,
  () => {
    scheduleRender();
  },
  { deep: true },
);
</script>

<template>
  <div
    ref="chartRef"
    class="sc-echarts-map3d"
    :style="{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    }"
  />
</template>

<style scoped>
.sc-echarts-map3d {
  display: block;
}
</style>
