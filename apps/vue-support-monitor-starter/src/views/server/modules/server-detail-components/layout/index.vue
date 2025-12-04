<template>
  <div class="server-detail-layout h-full">
    <!-- 空状态展示 -->
    <el-empty v-if="!localData.serverId" class="h-full" description="请选择服务器" />

    <!-- 主内容区域 -->
    <div v-else class="server-content h-full">
      <!-- 顶部信息栏 -->
      <div class="server-header">
        <!-- 服务器信息 -->
        <div class="server-header__info">
          <IconifyIconOnline icon="ri:server-line" class="server-header__icon" />
          <span class="server-header__name" :title="localData.serverName">{{ localData.serverName }}</span>
          <el-tag :type="getStatusType(localData.status)" size="small">
            {{ getStatusText(localData.status) }}
          </el-tag>
        </div>

        <!-- 查询控制区域 -->
        <div class="server-header__controls">
          <!-- 时间范围选择器 -->
          <div class="control-item">
            <label class="control-label">时间范围:</label>
            <el-date-picker
              v-model="queryTimeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              :shortcuts="timeRangeShortcuts"
              size="small"
              style="width: 260px"
              @change="handleTimeRangeChange"
            />
          </div>

          <!-- 自动刷新设置 -->
          <div class="control-item">
            <label class="control-label">自动刷新:</label>
            <el-select v-model="autoRefreshInterval" placeholder="选择刷新间隔" size="small" style="width: 80px" @change="handleRefreshIntervalChange">
              <el-option label="不刷新" :value="0" />
              <el-option label="30秒" :value="30" />
              <el-option label="1分钟" :value="60" />
              <el-option label="5分钟" :value="300" />
              <el-option label="10分钟" :value="600" />
            </el-select>
          </div>

          <!-- 刷新倒计时 -->
          <div v-if="autoRefreshInterval > 0" class="control-item refresh-countdown">
            <span class="countdown-text">{{ refreshCountdown }}s</span>
          </div>
        </div>

        <!-- 状态信息区域 -->
        <div class="server-header__status">
          <div class="status-item">
            <span class="status-label">组件:</span>
            <span class="status-value">{{ componentCount }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">查询:</span>
            <span class="status-value">{{ queryTime }}ms</span>
          </div>
          <div class="status-item">
            <span class="status-label">更新:</span>
            <span class="status-value">{{ lastUpdateTime || "未更新" }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="server-header__actions">
          <el-tooltip content="手动查询" placement="bottom">
            <el-button size="small" type="primary" @click="handleManualQuery" :loading="refreshing">
              <IconifyIconOnline icon="ri:search-line" class="mr-1" />
              查询
            </el-button>
          </el-tooltip>

          <el-tooltip content="全屏显示" placement="bottom">
            <el-button circle size="small" @click="handleFullscreen">
              <IconifyIconOnline icon="ri:fullscreen-line" />
            </el-button>
          </el-tooltip>

          <el-tooltip content="导出配置" placement="bottom">
            <el-button circle size="small" @click="handleExport">
              <IconifyIconOnline icon="ri:download-line" />
            </el-button>
          </el-tooltip>

          <el-tooltip :content="editMode ? '预览模式' : '编辑模式'" placement="bottom">
            <el-button circle size="small" :type="editMode ? 'success' : 'default'" @click="toggleEditMode">
              <IconifyIconOnline :icon="editMode ? 'ri:eye-line' : 'ri:settings-line'" />
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 数据内容区域 -->
      <div class="server-body">
        <el-scrollbar class="server-scrollbar">
          <div class="server-content-wrapper">
            <!-- 服务器组件布局视图 -->
            <ServerComponentLayout ref="serverLayoutRef" :server-id="localData.serverId" :editable="editMode" :time-params="getTimeRangeParams()" class="custom-layout" />
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { ElMessage } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ServerComponentLayout from "./ServerComponentLayout.vue";

// 组件属性和事件
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  serverId: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits<{
  "update:data": [data: any];
}>();

// 响应式状态
const serverLayoutRef = ref();
const editMode = ref(false);
const refreshing = ref(false);
const lastUpdateTime = ref("");
const queryTime = ref(0);
const componentCount = ref(0);

// 查询控制相关
const queryTimeRange = ref([]);
const autoRefreshInterval = ref(0); // 默认不自动刷新
const refreshCountdown = ref(0);
const globalRefreshTimer = ref(null);

// 时间范围快捷选项
const timeRangeShortcuts = [
  {
    text: "最近1小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000);
      return [start, end];
    }
  },
  {
    text: "最近6小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 6);
      return [start, end];
    }
  },
  {
    text: "最近12小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 12);
      return [start, end];
    }
  },
  {
    text: "最近24小时",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24);
      return [start, end];
    }
  },
  {
    text: "最近7天",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    }
  }
];

// 本地数据
const localData = computed(() => {
  // 支持两种传参方式：data 对象或直接传 serverId
  const serverId = props.serverId || props.data?.serverId || props.data?.monitorSysGenServerId;
  const serverName = props.data?.serverName || props.data?.monitorSysGenServerName || `服务器 ${serverId}`;
  const status = props.data?.status || props.data?.monitorSysGenServerStatus || 1; // 默认在线

  return {
    serverId,
    serverName,
    status,
    ...props.data
  };
});

/**
 * 更新指标
 */
const updateMetrics = () => {
  const startTime = Date.now();

  // 模拟查询时间
  setTimeout(
    () => {
      queryTime.value = Date.now() - startTime;
      lastUpdateTime.value = new Date().toLocaleTimeString();
    },
    Math.random() * 100 + 50
  );

  // 更新组件数量（这里应该从实际数据获取）
  componentCount.value = 0; // TODO: 从布局组件获取实际数量
};

/**
 * 数据变化处理
 */
const handleDataChange = () => {
  if (serverLayoutRef.value) {
    serverLayoutRef.value.loadComponents();
  }
  updateMetrics();
};

// 监听数据变化
watch(
  () => [props.data, props.serverId],
  ([newData, newServerId]) => {
    const serverId = (typeof newServerId === "number" ? newServerId : 0) || (typeof newData === "object" && newData ? newData.serverId : 0);
    if (serverId) {
      handleDataChange();
    }
  },
  { deep: true, immediate: true }
);

// 生命周期
onMounted(() => {
  // 初始化默认时间范围（最近1小时）
  const end = new Date();
  const start = new Date();
  start.setTime(start.getTime() - 3600 * 1000);
  queryTimeRange.value = [start, end];
});

onBeforeUnmount(() => {
  // 清理定时器
  if (globalRefreshTimer.value) {
    clearInterval(globalRefreshTimer.value);
  }
});

/**
 * 获取状态类型
 */
const getStatusType = (status: number) => {
  switch (status) {
    case 1:
      return "success";
    case 0:
      return "danger";
    default:
      return "info";
  }
};

/**
 * 获取状态文本
 */
const getStatusText = (status: number) => {
  switch (status) {
    case 1:
      return "在线";
    case 0:
      return "离线";
    default:
      return "未知";
  }
};

/**
 * 获取时间范围参数
 */
const getTimeRangeParams = () => {
  if (queryTimeRange.value && queryTimeRange.value.length === 2) {
    return {
      start: new Date(queryTimeRange.value[0]).getTime(),
      end: new Date(queryTimeRange.value[1]).getTime(),
      step: 60 // 1分钟步长
    };
  }

  // 默认返回最近1小时
  const now = Date.now();
  return {
    start: now - 60 * 60 * 1000, // 1小时前
    end: now,
    step: 60 // 1分钟步长
  };
};

/**
 * 切换编辑模式
 */
const toggleEditMode = () => {
  editMode.value = !editMode.value;
  ElMessage.success(`已切换到${editMode.value ? "编辑" : "预览"}模式`);
};

/**
 * 时间范围变化处理
 */
const handleTimeRangeChange = (value: any) => {
  console.log("时间范围变化:", value);
  // 时间范围变化时可以自动触发数据查询
  if (value && value.length === 2) {
    handleManualQuery();
  }
};

/**
 * 自动刷新间隔变化处理
 */
const handleRefreshIntervalChange = (interval: number) => {
  // 清除现有定时器
  if (globalRefreshTimer.value) {
    clearInterval(globalRefreshTimer.value);
    globalRefreshTimer.value = null;
  }

  // 设置新的全局定时器
  if (interval > 0) {
    refreshCountdown.value = interval;
    globalRefreshTimer.value = setInterval(() => {
      refreshCountdown.value--;
      if (refreshCountdown.value <= 0) {
        refreshCountdown.value = interval;
        handleAutoRefresh();
      }
    }, 1000);
  } else {
    refreshCountdown.value = 0;
  }
};

/**
 * 手动查询数据
 */
const handleManualQuery = async () => {
  if (refreshing.value) return;

  try {
    refreshing.value = true;
    console.log("手动查询数据，时间范围:", queryTimeRange.value);

    if (serverLayoutRef.value && serverLayoutRef.value.handleManualQuery) {
      await serverLayoutRef.value.handleManualQuery();
    } else if (serverLayoutRef.value) {
      await serverLayoutRef.value.loadComponents();
    }

    updateMetrics();
    lastUpdateTime.value = new Date().toLocaleString();
    ElMessage.success("数据查询完成");
  } catch (error) {
    console.error("查询数据失败:", error);
    ElMessage.error("数据查询失败");
  } finally {
    refreshing.value = false;
  }
};

/**
 * 自动刷新数据（静默执行）
 */
const handleAutoRefresh = async () => {
  try {
    console.log("自动刷新数据，时间范围:", queryTimeRange.value);

    if (serverLayoutRef.value && serverLayoutRef.value.handleManualQuery) {
      await serverLayoutRef.value.handleManualQuery();
    } else if (serverLayoutRef.value) {
      await serverLayoutRef.value.loadComponents();
    }

    updateMetrics();
    lastUpdateTime.value = new Date().toLocaleString();
  } catch (error) {
    console.error("自动刷新数据失败:", error);
  }
};

/**
 * 刷新数据（兼容旧接口）
 */
const handleRefresh = async () => {
  await handleManualQuery();
};

/**
 * 全屏显示
 */
const handleFullscreen = () => {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  }
};

/**
 * 导出配置
 */
const handleExport = () => {
  try {
    const config = {
      serverId: localData.value.serverId,
      serverName: localData.value.serverName,
      exportTime: new Date().toISOString(),
      // TODO: 从布局组件获取实际配置
      layout: [],
      components: []
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `server-${localData.value.serverId}-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    ElMessage.success("配置导出成功");
  } catch (error) {
    console.error("导出配置失败:", error);
    ElMessage.error("导出配置失败");
  }
};

// 自动刷新功能已移除，统一由顶部信息栏管理

// 暴露方法
defineExpose({
  refresh: handleRefresh,
  toggleEditMode,
  exportConfig: handleExport
});
</script>

<style lang="scss" scoped>
.server-detail-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e2e;
}

.server-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.server-header {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 16px;
  background-color: #1e1e2e;
  border-bottom: 1px solid var(--el-border-color-light);
  gap: 12px;

  &__info {
    display: flex;
    align-items: center;
    min-width: 180px;
    font-size: 14px;
    color: #fff;
    gap: 8px;
    flex-shrink: 0;
  }

  &__icon {
    font-size: 18px;
    color: #fff;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 150px;
    font-weight: 500;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    justify-content: center;

    .control-item {
      display: flex;
      align-items: center;
      gap: 6px;

      .control-label {
        font-size: 13px;
        color: #fff;
        white-space: nowrap;
        font-weight: 500;
      }
    }

    .refresh-countdown {
      .countdown-text {
        font-size: 12px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--el-color-primary-light-7);
        font-weight: 500;
        min-width: 30px;
        text-align: center;
      }
    }
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;

    .status-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;

      .status-label {
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
      }

      .status-value {
        color: #fff;
        font-weight: 600;
        min-width: 40px;
      }
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
}

.server-body {
  flex: 1;
  overflow: hidden;
}

.server-scrollbar {
  height: 100%;
}

.server-content-wrapper {
  padding: 16px;
  height: 100%;
}

.custom-layout {
  height: calc(100% - 16px);
}

:deep(.el-divider--vertical) {
  height: 20px;
  border-color: rgba(255, 255, 255, 0.2);
}

.mr-1 {
  margin-right: 4px;
}
</style>
