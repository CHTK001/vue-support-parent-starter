<template>
  <div class="bar-preview" :class="{ 'edit-mode': editMode }">
    <div class="card-header">
      <div class="card-title">
        <IconifyIconOnline icon="ri:bar-chart-line" class="card-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle }}</span>
      </div>
      <div class="card-actions" v-if="editMode">
        <el-button type="primary" size="small" @click="handleEdit">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
        <el-button type="danger" size="small" @click="handleDelete">
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </el-button>
      </div>
    </div>

    <div class="card-content" v-loading="loading">
      <div v-if="error" class="error-state">
        <IconifyIconOnline icon="ri:error-warning-line" class="error-icon" />
        <span class="error-text">{{ error }}</span>
      </div>
      <div v-else class="chart-container">
        <div ref="chartRef" class="chart"></div>
      </div>
    </div>

    <div class="card-footer" v-if="!editMode">
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
      <span class="last-update" v-if="lastUpdate">
        {{ formatTime(lastUpdate) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { message } from "@repo/utils";
import { executeComponentQueryDetail, type ServerDetailComponent } from "@/api/server";
import * as echarts from "echarts";

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
const error = ref("");
const lastUpdate = ref<Date | null>(null);
const refreshTimer = ref<NodeJS.Timeout | null>(null);

// 引用
const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

/**
 * 初始化图表
 */
const initChart = () => {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);
  updateChart();
};

/**
 * 更新图表
 */
const updateChart = (data?: any) => {
  if (!chartInstance) return;

  // 生成模拟数据
  const mockData = data || {
    categories: ['CPU', '内存', '磁盘', '网络', '进程'],
    values: [65, 78, 45, 89, 32]
  };
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: mockData.categories,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '使用率',
        type: 'bar',
        barWidth: '60%',
        data: mockData.values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        }
      }
    ]
  };

  chartInstance.setOption(option);
};

/**
 * 格式化时间
 */
const formatTime = (time: Date) => {
  return time.toLocaleTimeString();
};

/**
 * 加载数据
 */
const loadData = async () => {
  try {
    loading.value = true;
    error.value = "";

    // 构建时间范围参数
    const timeRange = {
      start: Date.now() - 5 * 60 * 1000, // 最近5分钟
      end: Date.now(),
    };

    const res = await executeComponentQueryDetail(
      props.componentData.monitorSysGenServerDetailComponentId!,
      timeRange
    );

    if (res.code === "00000") {
      // 实际应该根据后端返回的数据格式调整
      let chartData;
      if (res.data) {
        chartData = res.data;
      } else {
        // 如果没有数据，生成模拟数据用于演示
        chartData = {
          categories: ['CPU', '内存', '磁盘', '网络', '进程'],
          values: Array.from({ length: 5 }, () => Math.random() * 100)
        };
      }
      
      lastUpdate.value = new Date();
      
      // 更新图表
      nextTick(() => {
        updateChart(chartData);
      });
    } else {
      error.value = res.msg || "查询失败";
    }
  } catch (error) {
    console.error("加载柱状图数据失败:", error);
    error.value = "加载失败";
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
    refreshTimer.value = null;
  }
};

/**
 * 调整图表大小
 */
const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart();
    loadData();
    startAutoRefresh();
  });
  
  window.addEventListener('resize', resizeChart);
});

onUnmounted(() => {
  stopAutoRefresh();
  if (chartInstance) {
    chartInstance.dispose();
  }
  window.removeEventListener('resize', resizeChart);
});
</script>

<style lang="scss" scoped>
.bar-preview {
  height: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.edit-mode {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }

    .card-actions {
      display: flex;
      gap: 4px;
    }
  }

  .card-content {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--el-color-danger);
      height: 100%;

      .error-icon {
        font-size: 32px;
      }

      .error-text {
        font-size: 14px;
      }
    }

    .chart-container {
      height: 100%;
      display: flex;
      flex-direction: column;

      .chart {
        flex: 1;
        min-height: 200px;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-page);

    .last-update {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
}
</style>
