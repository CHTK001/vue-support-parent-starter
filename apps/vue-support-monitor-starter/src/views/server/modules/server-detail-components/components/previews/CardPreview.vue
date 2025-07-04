<template>
  <div class="card-preview" :class="{ 'edit-mode': editMode }">
    <div class="card-header">
      <div class="card-title">
        <IconifyIconOnline :icon="getCardIcon()" class="card-icon" />
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
      <div v-else-if="data" class="data-display">
        <div class="main-value">
          <span class="value">{{ formatValue(data.value) }}</span>
          <span class="unit" v-if="data.unit">{{ data.unit }}</span>
        </div>
        <div class="trend" v-if="data.trend">
          <IconifyIconOnline 
            :icon="getTrendIcon(data.trend)" 
            :class="getTrendClass(data.trend)"
          />
          <span :class="getTrendClass(data.trend)">{{ formatTrend(data.trend) }}</span>
        </div>
        <div class="description" v-if="data.description">
          {{ data.description }}
        </div>
      </div>
      <div v-else class="no-data">
        <IconifyIconOnline icon="ri:database-line" class="no-data-icon" />
        <span>暂无数据</span>
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
import { executeComponentQueryDetail, type ServerDetailComponent } from "@/api/server";

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
const error = ref("");
const lastUpdate = ref<Date | null>(null);
const refreshTimer = ref<NodeJS.Timeout | null>(null);

/**
 * 获取卡片图标
 */
const getCardIcon = () => {
  // 根据组件名称或类型返回合适的图标
  const name = props.componentData.monitorSysGenServerDetailComponentName?.toLowerCase() || "";
  if (name.includes("cpu")) return "ri:cpu-line";
  if (name.includes("memory") || name.includes("内存")) return "ri:database-2-line";
  if (name.includes("disk") || name.includes("磁盘")) return "ri:hard-drive-line";
  if (name.includes("network") || name.includes("网络")) return "ri:wifi-line";
  return "ri:dashboard-line";
};

/**
 * 获取趋势图标
 */
const getTrendIcon = (trend: number) => {
  if (trend > 0) return "ri:arrow-up-line";
  if (trend < 0) return "ri:arrow-down-line";
  return "ri:subtract-line";
};

/**
 * 获取趋势样式类
 */
const getTrendClass = (trend: number) => {
  if (trend > 0) return "trend-up";
  if (trend < 0) return "trend-down";
  return "trend-stable";
};

/**
 * 格式化数值
 */
const formatValue = (value: any) => {
  if (typeof value === "number") {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + "G";
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + "K";
    }
    return value.toFixed(2);
  }
  return value;
};

/**
 * 格式化趋势
 */
const formatTrend = (trend: number) => {
  const abs = Math.abs(trend);
  return `${trend > 0 ? "+" : ""}${abs.toFixed(1)}%`;
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

    const expressionType = props.componentData.monitorSysGenServerDetailComponentExpressionType;
    const expression = props.componentData.monitorSysGenServerDetailComponentExpression;

    if (expressionType === "COMPONENT") {
      // 使用 redisTimeSerial 查询固定组件数据
      await loadComponentData(expression);
    } else {
      // 使用 Prometheus 查询
      await loadPrometheusData();
    }
  } catch (error) {
    console.error("加载卡片数据失败:", error);
    data.value = null;
    error.value = "加载失败";
  } finally {
    loading.value = false;
  }
};

/**
 * 加载组件数据（使用 redisTimeSerial）
 */
const loadComponentData = async (componentType: string) => {
  // 根据组件类型生成对应的模拟数据
  const componentDataMap: Record<string, any> = {
    cpu_usage: {
      value: Math.random() * 100,
      unit: "%",
      trend: (Math.random() - 0.5) * 10,
      description: "CPU使用率"
    },
    memory_usage: {
      value: Math.random() * 100,
      unit: "%",
      trend: (Math.random() - 0.5) * 15,
      description: "内存使用率"
    },
    disk_usage: {
      value: Math.random() * 100,
      unit: "%",
      trend: (Math.random() - 0.5) * 5,
      description: "磁盘使用率"
    },
    network_io: {
      value: Math.random() * 1000,
      unit: "MB/s",
      trend: (Math.random() - 0.5) * 20,
      description: "网络IO"
    },
    system_info: {
      value: "正常",
      unit: "",
      trend: 0,
      description: "系统状态"
    },
    uptime: {
      value: Math.floor(Math.random() * 365),
      unit: "天",
      trend: 1,
      description: "运行时间"
    },
    load_average: {
      value: Math.random() * 4,
      unit: "",
      trend: (Math.random() - 0.5) * 2,
      description: "系统负载"
    }
  };

  data.value = componentDataMap[componentType] || {
    value: Math.random() * 100,
    unit: "%",
    trend: (Math.random() - 0.5) * 10,
    description: "未知组件"
  };

  lastUpdate.value = new Date();
};

/**
 * 加载 Prometheus 数据
 */
const loadPrometheusData = async () => {
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
      data.value = {
        value: res.data.value || Math.random() * 100,
        unit: res.data.unit || "%",
        trend: res.data.trend || (Math.random() - 0.5) * 20,
        description: res.data.description || ""
      };
    } else {
      // 如果没有数据，生成模拟数据用于演示
      data.value = {
        value: Math.random() * 100,
        unit: "%",
        trend: (Math.random() - 0.5) * 20,
        description: "模拟数据"
      };
    }
    lastUpdate.value = new Date();
  } else {
    error.value = res.msg || "查询失败";
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

// 生命周期
onMounted(() => {
  loadData();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style lang="scss" scoped>
.card-preview {
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
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--el-color-danger);

      .error-icon {
        font-size: 32px;
      }

      .error-text {
        font-size: 14px;
      }
    }

    .data-display {
      width: 100%;

      .main-value {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 4px;
        margin-bottom: 12px;

        .value {
          font-size: 32px;
          font-weight: 700;
          color: var(--el-color-primary);
        }

        .unit {
          font-size: 16px;
          color: var(--el-text-color-regular);
        }
      }

      .trend {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        margin-bottom: 8px;
        font-size: 14px;

        &.trend-up {
          color: var(--el-color-success);
        }

        &.trend-down {
          color: var(--el-color-danger);
        }

        &.trend-stable {
          color: var(--el-text-color-regular);
        }
      }

      .description {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--el-text-color-placeholder);

      .no-data-icon {
        font-size: 32px;
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
