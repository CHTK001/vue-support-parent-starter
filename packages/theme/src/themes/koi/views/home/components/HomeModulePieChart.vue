<template>
  <div ref="refChart" class="home-module-pie-chart" v-loading="dataLoading"></div>
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
const tooltipTimer = ref<ReturnType<typeof setInterval>>();

const refChart = ref<HTMLElement>();
const chartInstance = shallowRef<echarts.ECharts>();
const dataApi = ref<{ name: string; value: number }[]>([]);

const pieColors = [
  "#5b8ff9",
  "#5ad8a6",
  "#9270ca",
  "#f6bd16",
  "#6dc8ec"
];

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
  handleTooltipTimer();
};

onMounted(() => {
  nextTick(() => safeInitChart());
});

onUnmounted(() => {
  clearInterval(tooltipTimer.value);
  tooltipTimer.value = undefined;

  window.removeEventListener("resize", chartAdapter);

  if (resizeObserver.value && refChart.value) {
    resizeObserver.value.unobserve(refChart.value);
    resizeObserver.value.disconnect();
  }

  chartInstance.value?.dispose();
  chartInstance.value = undefined;
});

const getTooltipOption = () => ({
  confine: true,
  trigger: "item",
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

const getPieBorderColor = () =>
  getCssVar("--el-bg-color").trim() || (isDark.value ? "#1d1e1f" : "#ffffff");

const initChartOptions = () => {
  if (!chartInstance.value) return;

  chartInstance.value.setOption({
    color: pieColors,
    tooltip: getTooltipOption(),
    legend: {
      orient: "vertical",
      left: 0,
      top: "middle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: getCssVar("--el-text-color-regular").trim() || (isDark.value ? "#cfd3dc" : "#606266"),
        fontSize: 12
      }
    },
    series: [
      {
        name: "访问来源",
        type: "pie",
        radius: ["46%", "72%"],
        center: ["62%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: getPieBorderColor(),
          borderWidth: 2
        },
        label: {
          show: false,
          position: "center",
          formatter: "{d}%"
        },
        emphasis: {
          scale: false,
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
            color: getCssVar("--el-text-color-primary").trim()
          }
        },
        labelLine: {
          show: false
        }
      }
    ]
  });

  chartInstance.value.off("mouseover");
  chartInstance.value.off("mouseout");

  chartInstance.value.on("mouseover", () => {
    clearInterval(tooltipTimer.value);
    tooltipTimer.value = undefined;
  });

  chartInstance.value.on("mouseout", () => {
    handleTooltipTimer();
  });
};

const handleData = () => {
  setTimeout(() => {
    dataApi.value = [
      { value: 1048, name: "直接访问" },
      { value: 735, name: "搜索引擎" },
      { value: 580, name: "社交媒体" },
      { value: 484, name: "邮件营销" },
      { value: 300, name: "外部链接" }
    ];
    updateChart();
    dataLoading.value = false;
  }, 600);
};

const updateChart = () => {
  if (!chartInstance.value) return;

  chartInstance.value.setOption({
    series: [{ data: dataApi.value }]
  });
};

const chartAdapter = () => {
  if (!refChart.value || !chartInstance.value) return;

  const offsetSize = Math.max(11, Math.round(refChart.value.offsetWidth / 80));
  chartInstance.value.setOption({
    legend: {
      textStyle: { fontSize: offsetSize }
    }
  });
  chartInstance.value.resize();
};

const handleTooltipTimer = () => {
  if (!chartInstance.value || !dataApi.value.length) return;

  clearInterval(tooltipTimer.value);
  tooltipTimer.value = undefined;

  let index = 0;
  tooltipTimer.value = setInterval(() => {
    chartInstance.value?.dispatchAction({
      type: "showTip",
      seriesIndex: 0,
      dataIndex: index
    });
    index = (index + 1) % dataApi.value.length;
  }, 2500);
};
</script>

<style scoped>
.home-module-pie-chart {
  width: 100%;
  height: 300px;
}
</style>
