<template>
  <div ref="refChart" class="home-visit-line-chart" v-loading="dataLoading"></div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { randomInt } from "@repo/utils";
import { nextTick, ref, shallowRef, onMounted, onUnmounted, watch } from "vue";
import { getCssVar } from "@repo/utils";
import { storeToRefs } from "pinia";
import useGlobalStore from "@repo/pinia/modules/global";

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
const koiTimer = ref<ReturnType<typeof setInterval>>();

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
  handleDataTimer();
};

onMounted(() => {
  nextTick(() => safeInitChart());
});

onUnmounted(() => {
  clearInterval(koiTimer.value);
  koiTimer.value = undefined;

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
  backgroundColor: isDark.value ? "rgba(29, 30, 31, 0.96)" : "rgba(255, 255, 255, 0.96)",
  borderColor: getCssVar("--el-border-color").trim() || (isDark.value ? "#414243" : "#ebeef5"),
  borderWidth: 1,
  textStyle: {
    color: getCssVar("--el-text-color-primary").trim() || (isDark.value ? "#e5eaf3" : "#303133")
  },
  extraCssText: isDark.value
    ? "box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); border-radius: 8px;"
    : "box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); border-radius: 8px;",
  valueFormatter: (value: number) => `${value} 次`
});

const getAreaGradient = () => {
  const primaryLight8 = getCssVar("--el-color-primary-light-8").trim() || "#d9ecff";
  const primaryLight9 = getCssVar("--el-color-primary-light-9").trim() || "#ecf5ff";

  if (isDark.value) {
    const primaryLight5 = getCssVar("--el-color-primary-light-5").trim() || "#337ecc";
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: `${primaryLight5}28` },
      { offset: 1, color: "rgba(0, 0, 0, 0)" }
    ]);
  }

  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: primaryLight8 },
    { offset: 1, color: primaryLight9 }
  ]);
};

const initChartOptions = () => {
  if (!chartInstance.value) return;

  const primary = getCssVar("--el-color-primary").trim() || "#409eff";

  chartInstance.value.setOption({
    grid: {
      top: 20,
      left: 8,
      right: 12,
      bottom: 0,
      containLabel: true
    },
    tooltip: getTooltipOption(),
    xAxis: {
      type: "category",
      boundaryGap: false,
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
        name: "访问量",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2.5,
          color: primary
        },
        itemStyle: {
          color: primary
        },
        areaStyle: {
          color: getAreaGradient()
        },
        emphasis: { disabled: true }
      }
    ]
  });
};

const handleData = () => {
  setTimeout(() => {
    xChartData.value = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月"
    ];
    yChartData.value = [
      randomInt(28, 38),
      randomInt(32, 42),
      randomInt(30, 40),
      randomInt(34, 44),
      randomInt(38, 48),
      randomInt(42, 52),
      randomInt(46, 56),
      randomInt(50, 60),
      randomInt(48, 58),
      randomInt(52, 62),
      randomInt(55, 65),
      randomInt(58, 68)
    ];
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

  const offsetSize = Math.max(10, Math.round(refChart.value.offsetWidth / 80));
  chartInstance.value.setOption({
    xAxis: { axisLabel: { fontSize: offsetSize } },
    yAxis: { axisLabel: { fontSize: offsetSize } }
  });
  chartInstance.value.resize();
};

const handleDataTimer = () => {
  koiTimer.value = setInterval(() => {
    handleData();
  }, 8000);
};
</script>

<style scoped>
.home-visit-line-chart {
  width: 100%;
  height: 330px;
}
</style>
