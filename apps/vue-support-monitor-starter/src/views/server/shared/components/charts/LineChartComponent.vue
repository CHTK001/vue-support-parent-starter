<template>
  <div class="line-chart-component">
    <div class="chart-header">
      <div class="chart-title">
        <IconifyIconOnline icon="ri:line-chart-line" class="chart-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle }}</span>
      </div>
      <div class="chart-actions" v-if="editMode">
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
    
    <div class="chart-content" v-loading="loading">
      <div ref="chartRef" class="line-chart"></div>
      <div class="chart-info">
        <div class="current-value">
          <span class="label">当前�?</span>
          <span class="value">{{ displayValue }}</span>
          <span class="unit" v-if="unit">{{ unit }}</span>
        </div>
        <div class="last-update">
          最后更�? {{ lastUpdateTime }}
        </div>
      </div>
    </div>

    <div class="chart-footer" v-if="!editMode">
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
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
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
const data = ref<Array<{ time: string; value: number }>>([]);
const lastUpdateTime = ref("");
const refreshTimer = ref<NodeJS.Timeout>();
const chartRef = ref<HTMLElement>();
const chartInstance = ref<echarts.ECharts>();

// 计算属�?
const displayValue = computed(() => {
  if (data.value.length === 0) {
    return "--";
  }
  const lastValue = data.value[data.value.length - 1]?.value;
  return lastValue !== undefined ? lastValue.toFixed(2) : "--";
});

const chartConfig = computed(() => {
  try {
    const config = JSON.parse(props.componentData.monitorSysGenServerDetailComponentChartConfig || "{}");
    return {
      unit: config.unit || "",
      legend: config.legend !== false,
      color: config.color || "#409EFF",
      smooth: config.smooth !== false,
      ...config
    };
  } catch {
    return {
      unit: "",
      legend: true,
      color: "#409EFF",
      smooth: true
    };
  }
});

const unit = computed(() => chartConfig.value.unit);

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

  const config = chartConfig.value;
  const times = data.value.map(item => item.time);
  const values = data.value.map(item => item.value);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.seriesName}: ${param.value}${config.unit}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: config.legend ? '15%' : '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLabel: {
        fontSize: 10,
        color: '#999'
      },
      axisLine: {
        lineStyle: {
          color: '#E4E7ED'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 10,
        color: '#999',
        formatter: `{value}${config.unit}`
      },
      axisLine: {
        lineStyle: {
          color: '#E4E7ED'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#F2F6FC'
        }
      }
    },
    series: [
      {
        name: props.componentData.monitorSysGenServerDetailComponentTitle,
        type: 'line',
        smooth: config.smooth,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: config.color,
          width: 2
        },
        itemStyle: {
          color: config.color
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: config.color + '40'
              },
              {
                offset: 1,
                color: config.color + '10'
              }
            ]
          }
        },
        data: values
      }
    ]
  };

  if (config.legend) {
    option.legend = {
      data: [props.componentData.monitorSysGenServerDetailComponentTitle],
      top: 0,
      textStyle: {
        fontSize: 12,
        color: '#666'
      }
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
      start: Date.now() - 30 * 60 * 1000, // 最�?0分钟
      end: Date.now(),
    };

    const res = await executeComponentQuery(
      props.componentData.monitorSysGenServerDetailComponentId!,
      timeRange
    );

    if (res.code === "00000") {
      // 处理返回的数据，转换为时间序�?
      let newData: Array<{ time: string; value: number }> = [];
      
      if (Array.isArray(res.data)) {
        newData = res.data.map((item: any, index: number) => ({
          time: new Date(Date.now() - (res.data.length - index - 1) * 60 * 1000).toLocaleTimeString(),
          value: parseFloat(item.value || item) || 0
        }));
      } else {
        // 如果返回单个值，生成模拟时间序列
        const value = parseFloat(res.data?.value || res.data) || 0;
        const now = Date.now();
        for (let i = 29; i >= 0; i--) {
          newData.push({
            time: new Date(now - i * 60 * 1000).toLocaleTimeString(),
            value: value + (Math.random() - 0.5) * value * 0.1 // 添加一些随机变�?
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
    console.error("加载折线图数据失�?", error);
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
</script>

<style lang="scss" scoped>
.line-chart-component {
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

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  .chart-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .chart-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .chart-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .chart-actions {
    opacity: 1;
  }
}

.chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;

  .line-chart {
    flex: 1;
    min-height: 200px;
  }

  .chart-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-extra-light);

    .current-value {
      display: flex;
      align-items: baseline;
      gap: 4px;

      .label {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }

      .value {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .unit {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
    }

    .last-update {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }
}

.chart-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-extra-light);
  display: flex;
  justify-content: center;
}

// 响应式设�?
@media (max-width: 768px) {
  .chart-content {
    padding: 12px;

    .line-chart {
      min-height: 150px;
    }

    .chart-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .current-value {
        .value {
          font-size: 14px;
        }
      }
    }
  }

  .chart-header,
  .chart-footer {
    padding: 12px 16px;
  }
}
</style>
