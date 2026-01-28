<template>
  <div class="card-component system-container modern-bg">
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
@import "@/styles/variables.scss";

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

.card-component {
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

.card-header {
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

  .card-title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-md;
    font-weight: $font-weight-semibold;
    color: var(--el-text-color-primary);
    transition: all $duration-fast ease;

    .card-icon {
      font-size: $icon-lg;
      color: var(--el-color-primary);
      transition: transform $duration-normal $ease-standard;
    }

    &:hover .card-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  .card-actions {
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

  &:hover .card-actions {
    opacity: 1;
  }
}

.card-content {
  flex: 1;
  padding: $spacing-2xl;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;

  .metric-value {
    display: flex;
    align-items: baseline;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    position: relative;

    .value {
      font-size: 36px;
      font-weight: $font-weight-bold;
      background: $gradient-primary;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      letter-spacing: $letter-spacing-tight;
      transition: all $duration-normal $ease-standard;

      &:hover {
        transform: scale(1.05);
      }
    }

    .unit {
      font-size: $font-lg;
      color: var(--el-text-color-regular);
      font-weight: $font-weight-medium;
      opacity: 0.8;
    }
  }

  .metric-progress {
    width: 100%;
    margin: $spacing-md 0;
    padding: 0 $spacing-lg;

    :deep(.el-progress-bar__outer) {
      border-radius: $radius-full;
      background-color: var(--el-fill-color-light);
      height: 8px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    :deep(.el-progress-bar__inner) {
      border-radius: $radius-full;
      transition: width 0.8s $ease-standard;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  .metric-description {
    font-size: $font-sm;
    color: var(--el-text-color-regular);
    margin-bottom: $spacing-sm;
    line-height: 1.5;
    opacity: 0.8;
    max-width: 90%;
  }

  .last-update {
    font-size: $font-xs;
    color: var(--el-text-color-placeholder);
    opacity: 0.7;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-top: $spacing-sm;

    &::before {
      content: "🕐";
      font-size: $font-xs;
    }
  }
}

.card-footer {
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
  .card-content {
    padding: $spacing-xl;

    .metric-value .value {
      font-size: 32px;
    }
  }
}

@include respond-to(sm) {
  .card-content {
    padding: $spacing-lg;

    .metric-value {
      .value {
        font-size: 28px;
      }

      .unit {
        font-size: $font-md;
      }
    }
  }

  .card-header,
  .card-footer {
    padding: $spacing-md $spacing-lg;
  }
}

@include respond-to(xs) {
  .card-content {
    padding: $spacing-md;

    .metric-value .value {
      font-size: 24px;
    }
  }
}
</style>
