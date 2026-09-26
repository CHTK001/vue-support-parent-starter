<template>
  <div ref="chartRef" class="re-echarts" :style="{ height, width }" />
</template>

<script setup lang="ts">
/**
 * ReEcharts —— ECharts 通用组件（精简版）
 *
 * 纯透传 option，自动从 CSS 变量注入主题色（primary/success/warning/danger/info），
 * 适配暗黑模式。ResObserver/ResizeEvent 自动 resize。
 *   <ReEcharts :option="chartOption" />
 */
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from "vue";
import { normalizeColor } from "./colorSpace";

interface Props {
  /** ECharts 配置 */
  option: EChartsOption;
  /** 高度 */
  height?: string;
  /** 宽度 */
  width?: string;
  /** 主题名称（light/dark） */
  theme?: "light" | "dark";
  /** 是否自动 resize */
  autoResize?: boolean;
  /** 合并模式（覆盖或合并） */
  notMerge?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: "100%",
  width: "100%",
  theme: "light",
  autoResize: true,
  notMerge: false,
});

const emit = defineEmits<{
  (e: "ready", chart: echarts.ECharts): void;
  (e: "click", params: echarts.ECElementEvent): void;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
const chartInstance = shallowRef<echarts.ECharts | null>(null);
let resizeObserver: ResizeObserver | null = null;
let resizeHandler: (() => void) | null = null;

const readCssVar = (name: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(name).trim();
  return value || fallback;
};

const injectTheme = (option: EChartsOption): EChartsOption => {
  const palette = [
    readCssVar("--el-color-primary", "#409eff"),
    readCssVar("--el-color-success", "#67c23a"),
    readCssVar("--el-color-warning", "#e6a23c"),
    readCssVar("--el-color-danger", "#f56c6c"),
    readCssVar("--el-color-info", "#909399"),
  ].map(normalizeColor);
  const textColor = props.theme === "dark"
    ? readCssVar("--el-text-color-primary", "#e5eaf3")
    : readCssVar("--el-text-color-regular", "#606266");

  return {
    color: palette,
    textStyle: { color: textColor },
    ...option,
  };
};

const init = () => {
  if (!chartRef.value) return;
  chartInstance.value = echarts.init(chartRef.value, props.theme);
  chartInstance.value.setOption(injectTheme(props.option), props.notMerge);
  emit("ready", chartInstance.value);
  chartInstance.value.on("click", (params) => emit("click", params));

  if (props.autoResize) {
    resizeHandler = () => chartInstance.value?.resize();
    window.addEventListener("resize", resizeHandler);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        try {
          chartInstance.value?.resize();
        } catch {
          // ignore
        }
      });
      resizeObserver.observe(chartRef.value);
    }
    setTimeout(() => chartInstance.value?.resize(), 60);
  }
};

const updateOption = () => {
  if (chartInstance.value) {
    chartInstance.value.setOption(injectTheme(props.option), props.notMerge);
  }
};

watch(
  () => props.option,
  () => updateOption(),
  { deep: true },
);

watch(
  () => props.theme,
  () => {
    if (chartInstance.value) {
      chartInstance.value.dispose();
      chartInstance.value = null;
    }
    init();
  },
);

onMounted(() => init());

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (chartInstance.value) {
    chartInstance.value.dispose();
    chartInstance.value = null;
  }
});

defineExpose({
  getInstance: () => chartInstance.value,
  resize: () => chartInstance.value?.resize(),
});
</script>

<style scoped>
.re-echarts {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
