<template>
  <div class="line-chart-component system-container modern-bg">
    <div class="chart-header">
      <div class="chart-title">
        <IconifyIconOnline icon="ri:line-chart-line" class="chart-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle }}</span>
      </div>
      <div v-if="editMode" class="chart-actions">
        <el-button type="primary" text size="small" @click="handleEdit">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
        <el-button type="danger" text size="small" @click="handleDelete">
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="chart-content">
      <div ref="chartRef" class="line-chart" />
      <div class="chart-info">
        <div class="current-value">
          <span class="label">当前值:</span>
          <span class="value">{{ displayValue }}</span>
          <span v-if="unit" class="unit">{{ unit }}</span>
        </div>
        <div class="last-update">最后更新: {{ lastUpdateTime }}</div>
      </div>
    </div>

    <div v-if="!editMode" class="chart-footer">
      <el-button
        type="primary"
        text
        size="small"
        :loading="refreshing"
        @click="handleRefresh"
      >
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        刷新
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { message } from "@repo/utils";
import * as echarts from "echarts";
import {
  executeComponentQuery,
  type ServerDetailComponent,
} from "@/api/server";

// 定义属性
const props = defineProps<{
  componentData: ServerDetailComponent;
  serverId: number;
  editMode: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  delete: [componentId: number];
  edit: [component: ServerDetailComponent];
  refresh: [componentId: number];
}>();

// 响应式状态
const loading = ref(false);
const refreshing = ref(false);
const data = ref<Array<{ time: string; value: number }>>([]);
const lastUpdateTime = ref("");
const refreshTimer = ref<NodeJS.Timeout>();
const chartRef = ref<HTMLElement>();
const chartInstance = ref<echarts.ECharts>();

// 计算属性
const displayValue = computed(() => {
  if (data.value.length === 0) {
    return "--";
  }
  const lastValue = data.value[data.value.length - 1]?.value;
  return lastValue !== undefined ? lastValue.toFixed(2) : "--";
});

const chartConfig = computed(() => {
  try {
    const config = JSON.parse(
      props.componentData.monitorSysGenServerDetailComponentChartConfig || "{}",
    );
    return {
      unit: config.unit || "",
      legend: config.legend !== false,
      color: config.color || "#409EFF",
      smooth: config.smooth !== false,
      ...config,
    };
  } catch {
    return {
      unit: "",
      legend: true,
      color: "#409EFF",
      smooth: true,
    };
  }
});

const unit = computed(() => chartConfig.value.unit);

/**
 * 初始化图表
 */
const initChart = () => {
  if (!chartRef.value) return;

  chartInstance.value = echarts.init(chartRef.value);
  updateChart();
};

/**
 * 更新图表
 */
const updateChart = () => {
  if (!chartInstance.value) return;

  const config = chartConfig.value;
  const times = data.value.map((item) => item.time);
  const values = data.value.map((item) => item.value);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.seriesName}: ${param.value}${config.unit}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: config.legend ? "15%" : "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: times,
      axisLabel: {
        fontSize: 10,
        color: "#999",
      },
      axisLine: {
        lineStyle: {
          color: "#E4E7ED",
        },
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 10,
        color: "#999",
        formatter: `{value}${config.unit}`,
      },
      axisLine: {
        lineStyle: {
          color: "#E4E7ED",
        },
      },
      splitLine: {
        lineStyle: {
          color: "#F2F6FC",
        },
      },
    },
    series: [
      {
        name: props.componentData.monitorSysGenServerDetailComponentTitle,
        type: "line",
        smooth: config.smooth,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: {
          color: config.color,
          width: 2,
        },
        itemStyle: {
          color: config.color,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: config.color + "40",
              },
              {
                offset: 1,
                color: config.color + "10",
              },
            ],
          },
        },
        data: values,
      },
    ],
  };

  if (config.legend) {
    option.legend = {
      data: [props.componentData.monitorSysGenServerDetailComponentTitle],
      top: 0,
      textStyle: {
        fontSize: 12,
        color: "#666",
      },
    };
  }

  chartInstance.value.setOption(option);
};

/**
 * 调整图表大小
 */
const resizeChart = () => {
  if (chartInstance.value) {
    chartInstance.value.resize();
  }
};

/**
 * 加载数据
 */
const loadData = async () => {
  try {
    loading.value = true;

    const timeRange = {
      start: Date.now() - 30 * 60 * 1000, // 最近30分钟
      end: Date.now(),
    };

    const res = await executeComponentQuery(
      props.componentData.monitorSysGenServerDetailComponentId!,
      timeRange,
    );

    if (res.code === "00000") {
      // 处理返回的数据，转换为时间序列
      let newData: Array<{ time: string; value: number }> = [];

      if (Array.isArray(res.data)) {
        newData = res.data.map((item: any, index: number) => ({
          time: new Date(
            Date.now() - (res.data.length - index - 1) * 60 * 1000,
          ).toLocaleTimeString(),
          value: parseFloat(item.value || item) || 0,
        }));
      } else {
        // 如果返回单个值，生成模拟时间序列
        const value = parseFloat(res.data?.value || res.data) || 0;
        const now = Date.now();
        for (let i = 29; i >= 0; i--) {
          newData.push({
            time: new Date(now - i * 60 * 1000).toLocaleTimeString(),
            value: value + (Math.random() - 0.5) * value * 0.1, // 添加一些随机变化
          });
        }
      }

      data.value = newData;
      lastUpdateTime.value = new Date().toLocaleTimeString();

      // 更新图表
      nextTick(() => {
        updateChart();
      });
    } else {
      console.error("查询数据失败:", res.msg);
      data.value = [];
    }
  } catch (error) {
    console.error("加载折线图数据失败:", error);
    data.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 刷新数据
 */
const handleRefresh = async () => {
  refreshing.value = true;
  await loadData();
  refreshing.value = false;
  emit("refresh", props.componentData.monitorSysGenServerDetailComponentId!);
};

/**
 * 编辑组件
 */
const handleEdit = () => {
  emit("edit", props.componentData);
};

/**
 * 删除组件
 */
const handleDelete = () => {
  emit("delete", props.componentData.monitorSysGenServerDetailComponentId!);
};

/**
 * 启动自动刷新
 */
const startAutoRefresh = () => {
  const interval =
    (props.componentData.monitorSysGenServerDetailComponentRefreshInterval ||
      30) * 1000;

  refreshTimer.value = setInterval(() => {
    if (!props.editMode) {
      loadData();
    }
  }, interval);
};

/**
 * 停止自动刷新
 */
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = undefined;
  }
};

// 监听窗口大小变化
const handleResize = () => {
  resizeChart();
};

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart();
    loadData();
    if (!props.editMode) {
      startAutoRefresh();
    }
  });

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  stopAutoRefresh();
  window.removeEventListener("resize", handleResize);

  if (chartInstance.value) {
    chartInstance.value.dispose();
  }
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    @include gradient-bg;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.line-chart-component {
  height: 100%;
  @include glass-effect(0.9, 16px);
  border-radius: $radius-lg;
  border: 1px solid $border-light;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all $duration-normal $ease-standard;
  position: relative;
  box-shadow: $shadow-md;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $gradient-line-top;
    opacity: 0;
    transition: opacity $duration-normal ease;
  }

  &:hover {
    border-color: $border-primary;
    box-shadow: $shadow-hover-md;
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-xl $spacing-md;
  border-bottom: 1px solid $border-light;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: $spacing-xl;
    right: $spacing-xl;
    height: 1px;
    background: $gradient-line;
    opacity: 0.5;
  }

  .chart-title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-md;
    font-weight: $font-weight-semibold;
    color: var(--el-text-color-primary);
    transition: all $duration-fast ease;

    .chart-icon {
      font-size: $icon-lg;
      color: var(--el-color-primary);
      transition: transform $duration-normal $ease-standard;
    }

    &:hover .chart-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  .chart-actions {
    display: flex;
    gap: $spacing-xs;
    opacity: 0;
    transition: opacity $duration-normal $ease-standard;

    .el-button {
      border-radius: $radius-sm;
      transition: all $duration-fast ease;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  &:hover .chart-actions {
    opacity: 1;
  }
}

.chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: $spacing-lg;
  position: relative;

  .line-chart {
    flex: 1;
    min-height: 240px;
    position: relative;
    transition: all $duration-normal $ease-standard;
    border-radius: $radius-md;
    overflow: hidden;

    &:hover {
      transform: scale(1.01);
    }
  }

  .chart-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid $border-light;

    .current-value {
      display: flex;
      align-items: baseline;
      gap: $spacing-xs;

      .label {
        font-size: $font-sm;
        color: var(--el-text-color-regular);
        font-weight: $font-weight-medium;
      }

      .value {
        font-size: $font-lg;
        font-weight: $font-weight-bold;
        background: $gradient-primary;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: $letter-spacing-tight;
        transition: all $duration-normal $ease-standard;

        &:hover {
          transform: scale(1.05);
        }
      }

      .unit {
        font-size: $font-sm;
        color: var(--el-text-color-regular);
        font-weight: $font-weight-medium;
        opacity: 0.8;
      }
    }

    .last-update {
      font-size: $font-xs;
      color: var(--el-text-color-placeholder);
      opacity: 0.7;
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      &::before {
        content: "🕐";
        font-size: $font-xs;
      }
    }
  }
}

.chart-footer {
  padding: $spacing-md $spacing-xl;
  border-top: 1px solid $border-light;
  display: flex;
  justify-content: center;
  position: relative;
  background: rgba(0, 0, 0, 0.02);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: $spacing-xl;
    right: $spacing-xl;
    height: 1px;
    background: $gradient-line;
    opacity: 0.5;
  }

  .el-button {
    border-radius: $radius-md;
    transition: all $duration-fast ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: $shadow-hover-sm;
    }
  }
}

// 响应式设计
@include respond-to(lg) {
  .chart-content {
    padding: $spacing-md;

    .line-chart {
      min-height: 200px;
    }
  }
}

@include respond-to(sm) {
  .chart-content {
    padding: $spacing-md;

    .line-chart {
      min-height: 180px;
    }

    .chart-info {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-sm;

      .current-value {
        .value {
          font-size: $font-md;
        }
      }
    }
  }

  .chart-header,
  .chart-footer {
    padding: $spacing-md $spacing-lg;
  }
}

@include respond-to(xs) {
  .chart-content {
    padding: $spacing-sm;

    .line-chart {
      min-height: 150px;
    }

    .chart-info .current-value .value {
      font-size: $font-sm;
    }
  }
}
</style>
