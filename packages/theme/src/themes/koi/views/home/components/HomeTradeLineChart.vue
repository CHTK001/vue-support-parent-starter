<template>
  <div ref="refChart" class="home-trade-line-chart" v-loading="dataLoading"></div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
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

const refChart = ref<HTMLElement>();
const chartInstance = shallowRef<echarts.ECharts>();
const xChartData = ref<string[]>([]);
const yChartData1 = ref<number[]>([]);
const yChartData2 = ref<number[]>([]);

const formatDateLabel = (date: string) => {
  if (date.length === 8) {
    return `${date.slice(4, 6)}/${date.slice(6, 8)}`;
  }
  return date;
};

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

const getLegendColor = () =>
  getCssVar("--el-text-color-regular").trim() || (isDark.value ? "#cfd3dc" : "#606266");

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
    : "box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); border-radius: 8px;"
});

const getAreaGradient = (colorVar: string, light8Var: string, light9Var: string) => {
  const lineColor = getCssVar(colorVar).trim() || "#409eff";
  const light8 = getCssVar(light8Var).trim() || "#d9ecff";
  const light9 = getCssVar(light9Var).trim() || "#ecf5ff";

  if (isDark.value) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: `${lineColor}28` },
      { offset: 1, color: "rgba(0, 0, 0, 0)" }
    ]);
  }

  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: light8 },
    { offset: 1, color: light9 }
  ]);
};

const buildLineSeries = (
  name: string,
  colorVar: string,
  light8Var: string,
  light9Var: string
) => {
  const color = getCssVar(colorVar).trim() || "#409eff";

  return {
    name,
    type: "line",
    smooth: true,
    showSymbol: false,
    tooltip: {
      valueFormatter: (value: number) => `${value} 笔`
    },
    lineStyle: {
      width: 2,
      color
    },
    itemStyle: {
      color
    },
    areaStyle: {
      color: getAreaGradient(colorVar, light8Var, light9Var)
    },
    emphasis: { disabled: true }
  };
};

const initChartOptions = () => {
  if (!chartInstance.value) return;

  chartInstance.value.setOption({
    grid: {
      top: 36,
      left: 8,
      right: 12,
      bottom: 0,
      containLabel: true
    },
    tooltip: getTooltipOption(),
    legend: {
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        color: getLegendColor(),
        fontSize: 12
      }
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: getAxisColor(),
        fontSize: 11,
        interval: 1,
        rotate: 45
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
      buildLineSeries(
        "上月同期交易笔数",
        "--el-color-primary",
        "--el-color-primary-light-8",
        "--el-color-primary-light-9"
      ),
      buildLineSeries(
        "昨日交易笔数",
        "--el-color-success",
        "--el-color-success-light-8",
        "--el-color-success-light-9"
      )
    ]
  });
};

const handleData = () => {
  setTimeout(() => {
    const rawDates = [
      "20240901",
      "20240902",
      "20240903",
      "20240904",
      "20240905",
      "20240906",
      "20240907",
      "20240908",
      "20240909",
      "20240910",
      "20240911",
      "20240912",
      "20240913",
      "20240914",
      "20240915"
    ];
    xChartData.value = rawDates.map(formatDateLabel);
    yChartData1.value = [320, 266, 245, 199, 278, 298, 312, 365, 378, 299, 287, 256, 276, 288, 281];
    yChartData2.value = [188, 166, 100, 234, 256, 278, 300, 166, 156, 246, 220, 188, 210, 234, 290];
    updateChart();
    dataLoading.value = false;
  }, 600);
};

const updateChart = () => {
  if (!chartInstance.value) return;

  chartInstance.value.setOption({
    xAxis: { data: xChartData.value },
    series: [{ data: yChartData1.value }, { data: yChartData2.value }]
  });
};

const chartAdapter = () => {
  if (!refChart.value || !chartInstance.value) return;

  const offsetSize = Math.max(10, Math.round(refChart.value.offsetWidth / 90));
  chartInstance.value.setOption({
    legend: { textStyle: { fontSize: offsetSize } },
    xAxis: { axisLabel: { fontSize: offsetSize } },
    yAxis: { axisLabel: { fontSize: offsetSize } }
  });
  chartInstance.value.resize();
};
</script>

<style scoped>
.home-trade-line-chart {
  width: 100%;
  height: 330px;
}
</style>
