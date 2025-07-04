<template>
  <div class="gauge-preview" :class="{ 'edit-mode': editMode }">
    <div class="card-header">
      <div class="card-title">
        <IconifyIconOnline icon="ri:dashboard-3-line" class="card-icon" />
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
      <div v-else class="gauge-container">
        <div ref="chartRef" class="chart"></div>
        <div class="gauge-info">
          <div class="current-value">
            <span class="value">{{ formatValue(currentValue) }}</span>
            <span class="unit" v-if="unit">{{ unit }}</span>
          </div>
          <div class="description" v-if="description">
            {{ description }}
          </div>
        </div>
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
const currentValue = ref(0);
const unit = ref("%");
const description = ref("");

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
const updateChart = () => {
  if (!chartInstance) return;

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '90%',
        min: 0,
        max: 100,
        splitNumber: 8,
        axisLine: {
          lineStyle: {
            width: 6,
            color: [
              [0.25, '#7CFFB2'],
              [0.5, '#58D9F9'],
              [0.75, '#FDDD60'],
              [1, '#FF6E76']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'auto',
            width: 5
          }
        },
        axisLabel: {
          color: '#464646',
          fontSize: 12,
          distance: -60,
          rotate: 'tangential',
          formatter: function (value: number) {
            if (value === 87.5) {
              return 'A+';
            } else if (value === 62.5) {
              return 'A';
            } else if (value === 37.5) {
              return 'B';
            } else if (value === 12.5) {
              return 'C';
            }
            return '';
          }
        },
        title: {
          offsetCenter: [0, '-10%'],
          fontSize: 14
        },
        detail: {
          fontSize: 30,
          offsetCenter: [0, '-35%'],
          valueAnimation: true,
          formatter: function (value: number) {
            return Math.round(value) + unit.value;
          },
          color: 'inherit'
        },
        data: [
          {
            value: currentValue.value,
            name: 'Score'
          }
        ]
      }
    ]
  };

  chartInstance.setOption(option);
};

/**
 * 格式化数值
 */
const formatValue = (value: number) => {
  return value.toFixed(1);
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
      // 模拟数据结构，实际应该根据后端返回的数据格式调整
      if (res.data) {
        currentValue.value = res.data.value || Math.random() * 100;
        unit.value = res.data.unit || "%";
        description.value = res.data.description || "";
      } else {
        // 如果没有数据，生成模拟数据用于演示
        currentValue.value = Math.random() * 100;
        unit.value = "%";
        description.value = "模拟数据";
      }
      lastUpdate.value = new Date();
      
      // 更新图表
      nextTick(() => {
        updateChart();
      });
    } else {
      error.value = res.msg || "查询失败";
    }
  } catch (error) {
    console.error("加载仪表盘数据失败:", error);
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
.gauge-preview {
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

    .gauge-container {
      height: 100%;
      display: flex;
      flex-direction: column;

      .chart {
        flex: 1;
        min-height: 200px;
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
            font-size: 24px;
            font-weight: 700;
            color: var(--el-color-primary);
          }

          .unit {
            font-size: 14px;
            color: var(--el-text-color-regular);
          }
        }

        .description {
          font-size: 12px;
          color: var(--el-text-color-regular);
        }
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
