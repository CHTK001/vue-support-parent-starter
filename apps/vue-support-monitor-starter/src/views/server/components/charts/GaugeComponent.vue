<template>
  <div class="gauge-component">
    <div class="gauge-header">
      <div class="gauge-title">
        <IconifyIconOnline icon="ri:dashboard-3-line" class="gauge-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle }}</span>
      </div>
      <div class="gauge-actions" v-if="editMode">
        <el-button
          type="primary"
          text
          size="small"
          @click="handleEdit"
        >
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
        <el-button
          type="danger"
          text
          size="small"
          @click="handleDelete"
        >
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </el-button>
      </div>
    </div>
    
    <div class="gauge-content" v-loading="loading">
      <div ref="chartRef" class="gauge-chart"></div>
      <div class="gauge-info">
        <div class="current-value">
          <span class="value">{{ displayValue }}</span>
          <span class="unit" v-if="unit">{{ unit }}</span>
        </div>
        <div class="last-update">
          最后更�? {{ lastUpdateTime }}
        </div>
      </div>
    </div>

    <div class="gauge-footer" v-if="!editMode">
      <el-button
        type="primary"
        text
        size="small"
        @click="handleRefresh"
        :loading="refreshing"
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
import { executeComponentQuery, type ServerDetailComponent } from "@/api/server";

// 定义属�?
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

// 响应式状�?
const loading = ref(false);
const refreshing = ref(false);
const data = ref<number>(0);
const lastUpdateTime = ref("");
const refreshTimer = ref<NodeJS.Timeout>();
const chartRef = ref<HTMLElement>();
const chartInstance = ref<echarts.ECharts>();

// 计算属�?
const displayValue = computed(() => {
  if (data.value === null || data.value === undefined) {
    return "--";
  }
  return data.value.toFixed(1);
});

const chartConfig = computed(() => {
  try {
    const config = JSON.parse(props.componentData.monitorSysGenServerDetailComponentChartConfig || "{}");
    return {
      min: config.min || 0,
      max: config.max || 100,
      unit: config.unit || "%",
      thresholds: config.thresholds || [
        { value: 70, color: "#E6A23C" },
        { value: 90, color: "#F56C6C" }
      ],
      ...config
    };
  } catch {
    return {
      min: 0,
      max: 100,
      unit: "%",
      thresholds: [
        { value: 70, color: "#E6A23C" },
        { value: 90, color: "#F56C6C" }
      ]
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
 * 初始化图�?
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
        type: 'gauge',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -20,
        min: config.min,
        max: config.max,
        splitNumber: 5,
        itemStyle: {
          color: color
        },
        progress: {
          show: true,
          width: 8
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 8,
            color: [[1, '#E6EBF8']]
          }
        },
        axisTick: {
          distance: -45,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        splitLine: {
          distance: -52,
          length: 14,
          lineStyle: {
            width: 3,
            color: '#999'
          }
        },
        axisLabel: {
          distance: -20,
          color: '#999',
          fontSize: 12
        },
        anchor: {
          show: false
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '-15%'],
          fontSize: 24,
          fontWeight: 'bolder',
          formatter: `{value}${config.unit}`,
          color: color
        },
        data: [
          {
            value: value
          }
        ]
      }
    ]
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
      start: Date.now() - 5 * 60 * 1000, // 最�?分钟
      end: Date.now(),
    };

    const res = await executeComponentQuery(
      props.componentData.monitorSysGenServerDetailComponentId!,
      timeRange
    );

    if (res.code === "00000") {
      // 处理返回的数据，提取数�?
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
    console.error("加载仪表盘数据失�?", error);
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
  const interval = (props.componentData.monitorSysGenServerDetailComponentRefreshInterval || 30) * 1000;
  
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
  
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  stopAutoRefresh();
  window.removeEventListener('resize', handleResize);
  
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }
});

// 监听数据变化
watch(() => data.value, () => {
  updateChart();
});
</script>

<style lang="scss" scoped>
.gauge-component {
  height: 100%;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.gauge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  .gauge-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .gauge-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .gauge-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .gauge-actions {
    opacity: 1;
  }
}

.gauge-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;

  .gauge-chart {
    flex: 1;
    min-height: 120px;
  }

  .gauge-info {
    text-align: center;
    margin-top: 8px;

    .current-value {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 4px;
      margin-bottom: 8px;

      .value {
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .unit {
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }

    .last-update {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }
}

.gauge-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-extra-light);
  display: flex;
  justify-content: center;
}

// 响应式设�?
@media (max-width: 768px) {
  .gauge-content {
    padding: 12px;

    .gauge-chart {
      min-height: 100px;
    }

    .gauge-info {
      .current-value {
        .value {
          font-size: 16px;
        }

        .unit {
          font-size: 12px;
        }
      }
    }
  }

  .gauge-header,
  .gauge-footer {
    padding: 12px 16px;
  }
}
</style>
