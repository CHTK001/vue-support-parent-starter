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

        <!-- 状态信息 -->
        <el-divider direction="vertical" />
        <div class="server-header__metric">
          <IconifyIconOnline icon="ri:time-line" class="server-header__icon" />
          <span class="server-header__value">{{ queryTime }} ms</span>
          <span class="server-header__label">查询时间</span>
        </div>

        <el-divider direction="vertical" />
        <div class="server-header__metric">
          <IconifyIconOnline icon="ri:dashboard-line" class="server-header__icon" />
          <span class="server-header__value">{{ componentCount }}</span>
          <span class="server-header__label">组件数量</span>
        </div>

        <el-divider direction="vertical" />
        <div class="server-header__metric">
          <IconifyIconOnline icon="ri:refresh-line" class="server-header__icon" />
          <span class="server-header__value">{{ lastUpdateTime }}</span>
          <span class="server-header__label">最后更新</span>
        </div>

        <!-- 操作按钮 -->
        <div class="server-header__actions">
          <el-tooltip content="刷新数据" placement="bottom">
            <el-button circle @click="handleRefresh" :loading="refreshing">
              <IconifyIconOnline icon="ri:refresh-line" />
            </el-button>
          </el-tooltip>
          
          <el-tooltip content="全屏显示" placement="bottom">
            <el-button circle @click="handleFullscreen">
              <IconifyIconOnline icon="ri:fullscreen-line" />
            </el-button>
          </el-tooltip>
          
          <el-tooltip content="导出配置" placement="bottom">
            <el-button circle @click="handleExport">
              <IconifyIconOnline icon="ri:download-line" />
            </el-button>
          </el-tooltip>
          
          <el-tooltip :content="editMode ? '预览模式' : '编辑模式'" placement="bottom">
            <el-button circle :type="editMode ? 'success' : 'default'" @click="toggleEditMode">
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
            <ServerComponentLayout 
              ref="serverLayoutRef" 
              :server-id="localData.serverId" 
              :editable="editMode" 
              :time-params="getTimeRangeParams()" 
              class="custom-layout" 
            />
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
  'update:data': [data: any];
}>();

// 响应式状态
const serverLayoutRef = ref();
const editMode = ref(false);
const refreshing = ref(false);
const queryTime = ref(0);
const componentCount = ref(0);
const lastUpdateTime = ref("");
const refreshTimer = ref<NodeJS.Timeout>();

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
  setTimeout(() => {
    queryTime.value = Date.now() - startTime;
    lastUpdateTime.value = new Date().toLocaleTimeString();
  }, Math.random() * 100 + 50);

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
watch(() => [props.data, props.serverId], ([newData, newServerId]) => {
  const serverId = newServerId || newData?.serverId;
  if (serverId) {
    handleDataChange();
  }
}, { deep: true, immediate: true });

// 生命周期
onMounted(() => {
  startAutoRefresh();
});

onBeforeUnmount(() => {
  stopAutoRefresh();
});

/**
 * 获取状态类型
 */
const getStatusType = (status: number) => {
  switch (status) {
    case 1:
      return 'success';
    case 0:
      return 'danger';
    default:
      return 'info';
  }
};

/**
 * 获取状态文本
 */
const getStatusText = (status: number) => {
  switch (status) {
    case 1:
      return '在线';
    case 0:
      return '离线';
    default:
      return '未知';
  }
};

/**
 * 获取时间范围参数
 */
const getTimeRangeParams = () => {
  const now = Date.now();
  return {
    start: now - 30 * 60 * 1000, // 30分钟前
    end: now,
    step: 60 // 1分钟步长
  };
};

/**
 * 切换编辑模式
 */
const toggleEditMode = () => {
  editMode.value = !editMode.value;
  ElMessage.success(`已切换到${editMode.value ? '编辑' : '预览'}模式`);
};

/**
 * 刷新数据
 */
const handleRefresh = async () => {
  if (refreshing.value) return;
  
  try {
    refreshing.value = true;
    
    if (serverLayoutRef.value) {
      await serverLayoutRef.value.loadComponents();
    }
    
    updateMetrics();
    ElMessage.success("数据刷新成功");
  } catch (error) {
    console.error("刷新数据失败:", error);
    ElMessage.error("数据刷新失败");
  } finally {
    refreshing.value = false;
  }
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
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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

/**
 * 开始自动刷新
 */
const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    if (!editMode.value) {
      updateMetrics();
    }
  }, 30000); // 30秒刷新一次
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
  height: 48px;
  padding: 0 16px;
  background-color: #1e1e2e;
  border-bottom: 1px solid var(--el-border-color-light);

  &__info {
    display: flex;
    align-items: center;
    min-width: 100px;
    font-size: 14px;
    color: #fff;
    gap: 8px;
  }

  &__icon {
    font-size: 18px;
    margin-right: 6px;
    color: #fff;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
    font-weight: 500;
  }

  &__metric {
    display: flex;
    align-items: center;
    margin: 0 8px;
    gap: 4px;
  }

  &__value {
    font-weight: 500;
    margin: 0 4px;
    color: #fff;
  }

  &__label {
    color: #fff;
    font-size: 12px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
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
</style>
