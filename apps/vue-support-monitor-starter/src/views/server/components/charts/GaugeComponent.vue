<template>
  <div class="gauge-component system-container modern-bg">
    <div class="gauge-header">
      <div class="gauge-title">
        <IconifyIconOnline icon="ri:dashboard-3-line" class="gauge-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle }}</span>
      </div>
      <div v-if="editMode" class="gauge-actions">
        <el-button type="primary" text size="small" @click="handleEdit">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
        <el-button type="danger" text size="small" @click="handleDelete">
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="gauge-content">
      <div ref="chartRef" class="gauge-chart" />
      <div class="gauge-info">
        <div class="current-value">
          <span class="value">{{ displayValue }}</span>
          <span v-if="unit" class="unit">{{ unit }}</span>
        </div>
        <div class="last-update">最后更新: {{ lastUpdateTime }}</div>
      </div>
    </div>

    <div v-if="!editMode" class="gauge-footer">
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
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
const data = ref<number>(0);
const lastUpdateTime = ref("");
const refreshTimer = ref<NodeJS.Timeout>();
const chartRef = ref<HTMLElement>();
const chartInstance = ref<echarts.ECharts>();

// 计算属性
const displayValue = computed(() => {
  if (data.value === null || data.value === undefined) {
    return "--";
  }
  return data.value.toFixed(1);
});

const chartConfig = computed(() => {
  try {
    const config = JSON.parse(
      props.componentData.monitorSysGenServerDetailComponentChartConfig || "{}",
    );
    return {
      min: config.min || 0,
      max: config.max || 100,
      unit: config.unit || "%",
      thresholds: config.thresholds || [
        { value: 70, color: "#E6A23C" },
        { value: 90, color: "#F56C6C" },
      ],
      ...config,
    };
  } catch {
    return {
      min: 0,
      max: 100,
      unit: "%",
      thresholds: [
        { value: 70, color: "#E6A23C" },
        { value: 90, color: "#F56C6C" },
      ],
    };
  }
});

const unit = computed(() => chartConfig.value.unit);

/**
 * 获取颜色
 */
const getColor = (value: number) => {
  const thresholds = chartConfig.value.thresholds;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value >= thresholds[i].value) {
      return thresholds[i].color;
    }
  }
  return "#67C23A"; // 默认绿色
};

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

  const value = data.value || 0;
  const config = chartConfig.value;
  const color = getColor(value);

  const option = {
    series: [
      {
        type: "gauge",
        center: ["50%", "60%"],
        startAngle: 200,
        endAngle: -20,
        min: config.min,
        max: config.max,
        splitNumber: 5,
        itemStyle: {
          color: color,
        },
        progress: {
          show: true,
          width: 8,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 8,
            color: [[1, "#E6EBF8"]],
          },
        },
        axisTick: {
          distance: -45,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: "#999",
          },
        },
        splitLine: {
          distance: -52,
          length: 14,
          lineStyle: {
            width: 3,
            color: "#999",
          },
        },
        axisLabel: {
          distance: -20,
          color: "#999",
          fontSize: 12,
        },
        anchor: {
          show: false,
        },
        title: {
          show: false,
        },
        detail: {
          valueAnimation: true,
          width: "60%",
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, "-15%"],
          fontSize: 24,
          fontWeight: "bolder",
          formatter: `{value}${config.unit}`,
          color: color,
        },
        data: [
          {
            value: value,
          },
        ],
      },
    ],
  };

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
      start: Date.now() - 5 * 60 * 1000, // 最近5分钟
      end: Date.now(),
    };

    const res = await executeComponentQuery(
      props.componentData.monitorSysGenServerDetailComponentId!,
      timeRange,
    );

    if (res.code === "00000") {
      // 处理返回的数据，提取数值
      let value = 0;
      if (Array.isArray(res.data) && res.data.length > 0) {
        value = parseFloat(res.data[0].value || res.data[0]) || 0;
      } else if (typeof res.data === "object" && res.data !== null) {
        value = parseFloat(res.data.value || res.data) || 0;
      } else {
        value = parseFloat(res.data) || 0;
      }

      data.value = value;
      lastUpdateTime.value = new Date().toLocaleTimeString();

      // 更新图表
      nextTick(() => {
        updateChart();
      });
    } else {
      console.error("查询数据失败:", res.msg);
      data.value = 0;
    }
  } catch (error) {
    console.error("加载仪表盘数据失败:", error);
    data.value = 0;
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

// 监听数据变化
watch(
  () => data.value,
  () => {
    updateChart();
  },
);
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

.gauge-component {
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

.gauge-header {
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

  .gauge-title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-md;
    font-weight: $font-weight-semibold;
    color: var(--el-text-color-primary);
    transition: all $duration-fast ease;

    .gauge-icon {
      font-size: $icon-lg;
      color: var(--el-color-primary);
      transition: transform $duration-normal $ease-standard;
    }

    &:hover .gauge-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  .gauge-actions {
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

  &:hover .gauge-actions {
    opacity: 1;
  }
}

.gauge-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: $spacing-lg;
  position: relative;

  .gauge-chart {
    flex: 1;
    min-height: 140px;
    position: relative;
    transition: all $duration-normal $ease-standard;

    &:hover {
      transform: scale(1.02);
    }
  }

  .gauge-info {
    text-align: center;
    margin-top: $spacing-sm;
    padding-top: $spacing-md;
    border-top: 1px solid $border-light;

    .current-value {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: $spacing-xs;
      margin-bottom: $spacing-sm;

      .value {
        font-size: $font-2xl;
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
        font-size: $font-md;
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
      justify-content: center;
      gap: $spacing-xs;

      &::before {
        content: "🕐";
        font-size: $font-xs;
      }
    }
  }
}

.gauge-footer {
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
  .gauge-content {
    padding: $spacing-md;

    .gauge-chart {
      min-height: 120px;
    }

    .gauge-info .current-value .value {
      font-size: $font-xl;
    }
  }
}

@include respond-to(sm) {
  .gauge-content {
    padding: $spacing-md;

    .gauge-chart {
      min-height: 100px;
    }

    .gauge-info {
      .current-value {
        .value {
          font-size: $font-lg;
        }

        .unit {
          font-size: $font-sm;
        }
      }
    }
  }

  .gauge-header,
  .gauge-footer {
    padding: $spacing-md $spacing-lg;
  }
}

@include respond-to(xs) {
  .gauge-content {
    padding: $spacing-sm;

    .gauge-chart {
      min-height: 80px;
    }

    .gauge-info .current-value .value {
      font-size: $font-md;
    }
  }
}
</style>
