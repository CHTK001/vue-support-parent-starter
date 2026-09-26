<script setup lang="ts">
/**
 * ReEChart —— 轻量 ECharts 封装
 * 自动 init / 跟随容器 resize / option 变化重绘 / 卸载销毁。
 */
import * as echarts from "echarts";
import { onMounted, onBeforeUnmount, ref, shallowRef, watch, nextTick } from "vue";

const props = withDefaults(
  defineProps<{
    option: echarts.EChartsOption;
    height?: string;
    loading?: boolean;
  }>(),
  { height: "280px", loading: false }
);

const el = ref<HTMLElement>();
const chart = shallowRef<echarts.ECharts>();
let ro: ResizeObserver | null = null;

let inited = false;

function render() {
  if (!chart.value) return;
  chart.value.setOption(props.option, !inited);
  inited = true;
}

onMounted(async () => {
  await nextTick();
  if (!el.value) return;
  chart.value = echarts.init(el.value);
  render();
  ro = new ResizeObserver(() => chart.value?.resize());
  ro.observe(el.value);
});

watch(() => props.option, render, { deep: true });

watch(() => props.loading, (v) => {
  if (!chart.value) return;
  if (v) {
    const primary =
      getComputedStyle(document.documentElement).getPropertyValue("--el-color-primary").trim() || "#409eff";
    chart.value.showLoading("default", { text: "", maskColor: "rgba(255,255,255,0.35)", color: primary });
  } else {
    chart.value.hideLoading();
  }
});

onBeforeUnmount(() => {
  ro?.disconnect();
  chart.value?.dispose();
  chart.value = undefined;
});
</script>

<template>
  <div ref="el" class="re-echart" :style="{ height }"></div>
</template>
