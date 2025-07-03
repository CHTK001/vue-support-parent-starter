<template>
  <div class="card-component">
    <div class="card-header">
      <div class="card-title">
        <IconifyIconOnline :icon="getIcon()" class="card-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle }}</span>
      </div>
      <div class="card-actions" v-if="editMode">
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
    
    <div class="card-content" v-loading="loading">
      <div class="metric-value">
        <span class="value">{{ displayValue }}</span>
        <span class="unit" v-if="unit">{{ unit }}</span>
      </div>

      <!-- 进度条显示（仅对百分比类型的指标显示） -->
      <div v-if="showProgressBar" class="metric-progress">
        <el-progress
          :percentage="progressPercentage"
          :color="getProgressColor(progressPercentage, metricType)"
          :show-text="false"
          :stroke-width="6"
        />
      </div>

      <div class="metric-description" v-if="componentData.monitorSysGenServerDetailComponentDesc">
        {{ componentData.monitorSysGenServerDetailComponentDesc }}
      </div>
      <div class="last-update">
        最后更新: {{ lastUpdateTime }}
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
import { executeComponentQuery, type ServerDetailComponent } from "@/api/server";

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
const data = ref<any>(null);
const lastUpdateTime = ref("");
const refreshTimer = ref<NodeJS.Timeout>();

// 计算属性
const displayValue = computed(() => {
  if (data.value === null || data.value === undefined) {
    return "--";
  }
  
  if (typeof data.value === "number") {
    return data.value.toLocaleString();
  }
  
  return String(data.value);
});

const unit = computed(() => {
  try {
    const config = JSON.parse(props.componentData.monitorSysGenServerDetailComponentChartConfig || "{}");
    return config.unit || "";
  } catch {
    return "";
  }
});

// 判断是否显示进度条
const showProgressBar = computed(() => {
  try {
    const config = JSON.parse(props.componentData.monitorSysGenServerDetailComponentChartConfig || "{}");
    return config.showProgress === true || isPercentageMetric.value;
  } catch {
    return isPercentageMetric.value;
  }
});

// 判断是否为百分比类型的指标
const isPercentageMetric = computed(() => {
  const title = props.componentData.monitorSysGenServerDetailComponentTitle?.toLowerCase() || "";
  return title.includes("使用率") || title.includes("cpu") || title.includes("memory") || title.includes("内存") || title.includes("磁盘");
});

// 获取指标类型
const metricType = computed(() => {
  const title = props.componentData.monitorSysGenServerDetailComponentTitle?.toLowerCase() || "";
  if (title.includes("cpu")) return "cpu";
  if (title.includes("memory") || title.includes("内存")) return "memory";
  if (title.includes("磁盘") || title.includes("disk")) return "disk";
  if (title.includes("网络") || title.includes("network")) return "network";
  return "cpu"; // 默认
});

// 进度条百分比
const progressPercentage = computed(() => {
  if (data.value === null || data.value === undefined) return 0;

  const numValue = typeof data.value === "number" ? data.value : parseFloat(String(data.value));
  if (isNaN(numValue)) return 0;

  // 如果值大于100，可能是原始值需要转换为百分比
  if (numValue > 100) {
    return Math.min(numValue / 100, 100);
  }

  return Math.min(Math.max(numValue, 0), 100);
});

/**
 * 获取图标
 */
const getIcon = () => {
  try {
    const config = JSON.parse(props.componentData.monitorSysGenServerDetailComponentChartConfig || "{}");
    return config.icon || "ri:dashboard-line";
  } catch {
    return "ri:dashboard-line";
  }
};

/**
 * 获取进度条颜色（支持渐变和不同指标类型）
 */
const getProgressColor = (percentage: number, metricType: string = 'cpu') => {
  // 定义不同指标的阈值
  const thresholds = {
    cpu: { normal: 50, warning: 80, critical: 90 },
    memory: { normal: 60, warning: 80, critical: 90 },
    disk: { normal: 70, warning: 85, critical: 95 },
    network: { normal: 60, warning: 80, critical: 90 }
  };

  const threshold = thresholds[metricType as keyof typeof thresholds] || thresholds.cpu;

  // 返回渐变色配置
  return [
    { color: '#67c23a', percentage: threshold.normal },
    { color: '#e6a23c', percentage: threshold.warning },
    { color: '#f56c6c', percentage: 100 }
  ];
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
      timeRange
    );

    if (res.code === "00000") {
      // 处理返回的数据，提取单个值
      if (Array.isArray(res.data) && res.data.length > 0) {
        data.value = res.data[0].value || res.data[0];
      } else if (typeof res.data === "object" && res.data !== null) {
        data.value = res.data.value || res.data;
      } else {
        data.value = res.data;
      }
      
      lastUpdateTime.value = new Date().toLocaleTimeString();
    } else {
      console.error("查询数据失败:", res.msg);
      data.value = null;
    }
  } catch (error) {
    console.error("加载卡片数据失败:", error);
    data.value = null;
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

// 生命周期
onMounted(() => {
  loadData();
  if (!props.editMode) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style lang="scss" scoped>
.card-component {
  height: 100%;
  background: var(--el-bg-color);
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .card-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .card-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .card-actions {
    opacity: 1;
  }
}

.card-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  .metric-value {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;

    .value {
      font-size: 32px;
      font-weight: 700;
      color: var(--el-color-primary);
      line-height: 1;
    }

    .unit {
      font-size: 16px;
      color: var(--el-text-color-regular);
      font-weight: 500;
    }
  }

  .metric-progress {
    width: 100%;
    margin: 12px 0;

    :deep(.el-progress-bar__outer) {
      border-radius: 8px;
      background-color: var(--el-fill-color-light);
      height: 8px;
    }

    :deep(.el-progress-bar__inner) {
      border-radius: 8px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .metric-description {
    font-size: 12px;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .last-update {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}

.card-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-extra-light);
  display: flex;
  justify-content: center;
}

// 响应式设计
@media (max-width: 768px) {
  .card-content {
    padding: 16px;

    .metric-value {
      .value {
        font-size: 24px;
      }

      .unit {
        font-size: 14px;
      }
    }
  }

  .card-header,
  .card-footer {
    padding: 12px 16px;
  }
}
</style>
