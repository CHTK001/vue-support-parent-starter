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
import { chartPalette } from "./colorSpace";

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
  /**
   * 扇区/图形悬停进入。
   *
   * <p>共享组件此前只透传 click，页面想做「悬停扇区 → 同步刷新中心数值」只能
   * 自己拿实例再绑一次；这里补上 mouseover / mouseout 两个事件，调用方直接
   * {@code @mouseover="onSliceHover"} 即可。</p>
   */
  (e: "mouseover", params: echarts.ECElementEvent): void;
  /** 扇区/图形悬停离开 */
  (e: "mouseout", params: echarts.ECElementEvent): void;
  /** 移出整个图表（含从扇区直接移出画布的情况，ECharts 会派发 globalout） */
  (e: "globalout"): void;
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
  /* 语义色各向主题色靠 30%：主题切卡其，曲线的绿/橙/红都带上暖调，
     整张图与界面同源；色相差仍保留，CPU/内存/磁盘依旧一眼可分。
     不直接改成同一色相的五档 —— 多序列监控图靠色相区分，单色阶会读不出来。
     调色板与 D3 引擎共用 chartPalette()，两处不会走偏。 */
  const palette = chartPalette();
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
  // 悬停事件：供页面做「hover 扇区 → 中心数值联动」。ECharts 的 mouseover 在进入
  // 图形时派发一次，mouseout 在离开时派发；globalout 覆盖「直接从扇区移出画布」。
  chartInstance.value.on("mouseover", (params) => emit("mouseover", params));
  chartInstance.value.on("mouseout", (params) => emit("mouseout", params));
  chartInstance.value.on("globalout", () => emit("globalout"));

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

/**
 * 换主题色后重绘。
 *
 * <p>主题色写在 {@code <html>} 行内样式上（applyPrimaryColorVars），props 不变，
 * 上面两个 watch 都不会触发 —— 不补这个就会「界面已换肤、图表停在旧配色」。
 * 监听 html 的 style 属性即可；这是唯一的主题色写入点，不会误触发。</p>
 */
let themeStyleObserver: MutationObserver | null = null;

onMounted(() => {
  init();
  if (typeof MutationObserver !== "undefined" && typeof document !== "undefined") {
    themeStyleObserver = new MutationObserver(() => updateOption());
    themeStyleObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }
});

onBeforeUnmount(() => {
  themeStyleObserver?.disconnect();
  themeStyleObserver = null;
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
