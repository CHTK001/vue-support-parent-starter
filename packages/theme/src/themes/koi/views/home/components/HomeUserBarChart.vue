<template>
  <div ref="refChart" class="home-user-bar-chart" v-loading="dataLoading"></div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { nextTick, ref, shallowRef, onMounted, onUnmounted, watch } from "vue";
import { getCssVar } from "@repo/theme/koi/utils/index.ts";
import { storeToRefs } from "pinia";
import useGlobalStore from "@repo/theme/koi/stores/modules/global.ts";

const globalStore = useGlobalStore();
const { themeColor, isDark } = storeToRefs(globalStore);

watch([() => themeColor.value, () => isDark.value], () => {
  nextTick(() => {
    if (chartInstance.value) {
      initChartOptions();
      updateChart();
    }
  });
});

const resizeObserver = ref<ResizeObserver | null>(null);
const dataLoading = ref(false);

const refChart = ref<HTMLElement>();
const chartInstance = shallowRef<echarts.ECharts>();
const xChartData = ref<string[]>([]);
const yChartData = ref<number[]>([]);

const safeInitChart = (retry = 0, maxRetries = 6) => {
  dataLoading.value = true;

  if (retry > maxRetries) {
    console.error("图表初始化失败：重试次数超限");
    return;
  }

  if (!refChart.value) {
    setTimeout(() => safeInitChart(retry + 1), 100);
    return;
  }

  const { clientWidth, clientHeight } = refChart.value;
  if (clientWidth <= 0 || clientHeight <= 0) {
    setTimeout(() => safeInitChart(retry + 1), 50);
    return;
  }

  if (chartInstance.value) {
    chartInstance.value.dispose();
    chartInstance.value = undefined;
  }

  chartInstance.value = echarts.init(refChart.value);
  initChartOptions();

  resizeObserver.value = new ResizeObserver(() => {
    chartInstance.value?.resize();
  });
  resizeObserver.value.observe(refChart.value);

  chartAdapter();
  window.addEventListener("resize", chartAdapter);
  handleData();
};

onMounted(() => {
  nextTick(() => safeInitChart());
});

onUnmounted(() => {
  window.removeEventListener("resize", chartAdapter);

  if (resizeObserver.value && refChart.value) {
    resizeObserver.value.unobserve(refChart.value);
    resizeObserver.value.disconnect();
  }

  chartInstance.value?.dispose();
  chartInstance.value = undefined;
});

const getAxisColor = () =>
  isDark.value ? "rgba(207, 211, 220, 0.65)" : "rgba(96, 98, 102, 0.75)";

const getSplitLineColor = () =>
  isDark.value ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

const getTooltipOption = () => ({
  trigger: "axis",
  axisPointer: { type: "shadow" },
  backgroundColor: isDark.value ? "rgba(29, 30, 31, 0.96)" : "rgba(255, 255, 255, 0.96)",
  borderColor: getCssVar("--el-border-color").trim() || (isDark.value ? "#414243" : "#ebeef5"),
  borderWidth: 1,
  textStyle: {
    color: getCssVar("--el-text-color-primary").trim() || (isDark.value ? "#e5eaf3" : "#303133")
  },
  extraCssText: isDark.value
    ? "box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); border-radius: 8px;"
    : "box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); border-radius: 8px;"
});

const getBarGradient = () => {
  const primary = getCssVar("--el-color-primary").trim() || "#409eff";
  const primaryLight = isDark.value
    ? getCssVar("--el-color-primary-light-3").trim() || "#79bbff"
    : getCssVar("--el-color-primary-light-5").trim() || "#a0cfff";

  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: primary },
    { offset: 1, color: primaryLight }
  ]);
};

const initChartOptions = () => {
  if (!chartInstance.value) return;

  chartInstance.value.setOption({
    grid: {
      top: 16,
      left: 8,
      right: 8,
      bottom: 0,
      containLabel: true
    },
    tooltip: getTooltipOption(),
    xAxis: {
      type: "category",
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: getAxisColor(),
        fontSize: 12
      }
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: getAxisColor(),
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: getSplitLineColor()
        }
      }
    },
    series: [
      {
        name: "活跃用户",
        type: "bar",
        barWidth: "42%",
        tooltip: {
          valueFormatter: (value: number) => `${value} 人`
        },
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
          color: getBarGradient()
        },
        emphasis: { disabled: true }
      }
    ]
  });
};

const handleData = () => {
  setTimeout(() => {
    xChartData.value = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月"];
    yChartData.value = [75, 120, 90, 30, 200, 90, 130, 170, 130];
    updateChart();
    dataLoading.value = false;
  }, 600);
};

const updateChart = () => {
  if (!chartInstance.value) return;

  chartInstance.value.setOption({
    xAxis: { data: xChartData.value },
    series: [{ data: yChartData.value }]
  });
};

const chartAdapter = () => {
  if (!refChart.value || !chartInstance.value) return;

  const offsetSize = Math.max(10, Math.round(refChart.value.offsetWidth / 72));
  chartInstance.value.setOption({
    xAxis: { axisLabel: { fontSize: offsetSize } },
    yAxis: { axisLabel: { fontSize: offsetSize } }
  });
  chartInstance.value.resize();
};
</script>

<style scoped>
.home-user-bar-chart {
  width: 100%;
  height: 236px;
}
</style>
