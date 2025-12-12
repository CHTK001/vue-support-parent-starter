<template>
  <div class="connection-status-container">
    <!-- 连接状态指示器 -->
    <div class="status-indicator">
      <el-tag :type="getStatusType(connectionStatus)" :effect="isConnecting ? 'plain' : 'light'" size="small" class="status-tag">
        <IconifyIconOnline v-if="isConnecting" icon="ep:loading" class="is-loading" />
        <IconifyIconOnline v-else :icon="getStatusIcon(connectionStatus)" />
        {{ getStatusText(connectionStatus) }}
      </el-tag>

      <!-- 最后连接时间 -->
      <span v-if="lastConnectTime" class="last-connect-time">最后连接: {{ formatTime(lastConnectTime) }}</span>
    </div>

    <!-- 连接操作按钮 -->
    <div class="connection-actions">
      <el-button size="small" type="primary" :loading="isConnecting" @click="testConnection" :disabled="!serverId">
        <IconifyIconOnline icon="ep:connection" />
        {{ isConnecting ? "测试中..." : "测试连接" }}
      </el-button>

      <el-button v-if="connectionStatus === CONNECTION_STATUS.FAILED" size="small" type="warning" @click="showErrorDetails">
        <IconifyIconOnline icon="ep:warning" />
        查看错误
      </el-button>
    </div>

    <!-- 错误详情对话框 -->
    <el-dialog v-model="showErrorDialog" title="连接错误详情" width="500px" :close-on-click-modal="false">
      <div class="error-details">
        <el-alert :title="errorMessage || '连接失败'" type="error" :closable="false" show-icon />

        <div class="error-info" v-if="errorMessage">
          <h4>错误信息:</h4>
          <pre class="error-message">{{ errorMessage }}</pre>
        </div>

        <div class="troubleshooting">
          <h4>故障排除建议:</h4>
          <ul>
            <li>检查服务器地址和端口是否正确</li>
            <li>确认网络连接是否正常</li>
            <li>验证用户名和密码是否正确</li>
            <li>检查防火墙设置</li>
            <li>确认服务器服务是否正在运行</li>
          </ul>
        </div>
      </div>

      <template #footer>
        <el-button @click="showErrorDialog = false">关闭</el-button>
        <el-button type="primary" @click="testConnection">重新测试</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
import { testServerConnection } from "@/api/server";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

// 连接状态常量
const CONNECTION_STATUS = {
  OFFLINE: 0,
  ONLINE: 1,
  CONNECTING: 2,
  FAILED: 3
};

// Props
interface Props {
  serverId?: string | number;
  serverName?: string;
  connectionStatus?: number;
  lastConnectTime?: string | Date;
  errorMessage?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  connectionStatus: 0,
  autoRefresh: false,
  refreshInterval: 30000
});

// Emits
const emit = defineEmits<{
  statusChange: [status: number, error?: string];
  testComplete: [success: boolean, error?: string];
}>();

// 响应式状态
const isConnecting = ref(false);
const showErrorDialog = ref(false);
const autoRefreshTimer = ref<NodeJS.Timeout | null>(null);

// 计算属性
const currentStatus = computed(() => props.connectionStatus);

// 监听状态变化
watch(
  () => props.connectionStatus,
  (newStatus, oldStatus) => {
    if (newStatus !== oldStatus) {
      console.log(`服务器 ${props.serverName} 连接状态变化: ${oldStatus} -> ${newStatus}`);
    }
  }
);

// 获取状态类型
const getStatusType = (status: number) => {
  switch (status) {
    case CONNECTION_STATUS.ONLINE:
      return "success";
    case CONNECTION_STATUS.CONNECTING:
      return "warning";
    case CONNECTION_STATUS.FAILED:
      return "danger";
    default:
      return "info";
  }
};

// 获取状态图标
const getStatusIcon = (status: number) => {
  switch (status) {
    case CONNECTION_STATUS.ONLINE:
      return "ep:circle-check";
    case CONNECTION_STATUS.CONNECTING:
      return "ep:clock";
    case CONNECTION_STATUS.FAILED:
      return "ep:circle-close";
    default:
      return "ep:circle-close";
  }
};

// 获取状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case CONNECTION_STATUS.ONLINE:
      return "在线";
    case CONNECTION_STATUS.CONNECTING:
      return "连接中";
    case CONNECTION_STATUS.FAILED:
      return "连接失败";
    default:
      return "离线";
  }
};

// 格式化时间
const formatTime = (time: string | Date) => {
  if (!time) return "";
  const date = typeof time === "string" ? new Date(time) : time;
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: zhCN
  });
};

// 测试连接
const testConnection = async () => {
  if (!props.serverId) {
    message("服务器ID不能为空", { type: "warning" });
    return;
  }

  try {
    isConnecting.value = true;
    emit("statusChange", CONNECTION_STATUS.CONNECTING);

    const result = await testServerConnection(props.serverId.toString());

    if (result.data) {
      message("连接测试成功", { type: "success" });
      emit("statusChange", CONNECTION_STATUS.ONLINE);
      emit("testComplete", true);
    } else {
      const errorMsg = result.msg || "连接测试失败";
      message(errorMsg, { type: "error" });
      emit("statusChange", CONNECTION_STATUS.FAILED, errorMsg);
      emit("testComplete", false, errorMsg);
    }
  } catch (error: any) {
    const errorMsg = error.message || "连接测试异常";
    message(errorMsg, { type: "error" });
    emit("statusChange", CONNECTION_STATUS.FAILED, errorMsg);
    emit("testComplete", false, errorMsg);
  } finally {
    isConnecting.value = false;
  }
};

// 显示错误详情
const showErrorDetails = () => {
  showErrorDialog.value = true;
};

// 开始自动刷新
const startAutoRefresh = () => {
  if (props.autoRefresh && props.serverId) {
    autoRefreshTimer.value = setInterval(() => {
      testConnection();
    }, props.refreshInterval);
  }
};

// 停止自动刷新
const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value);
    autoRefreshTimer.value = null;
  }
};

// 生命周期
onMounted(() => {
  if (props.autoRefresh) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});

// 暴露方法
defineExpose({
  testConnection,
  startAutoRefresh,
  stopAutoRefresh
});
</script>

<style scoped>
.connection-status-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background-color: var(--el-bg-color-page);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.last-connect-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.connection-actions {
  display: flex;
  gap: 8px;
}

.error-details {
  padding: 16px 0;
}

.error-info {
  margin: 16px 0;
}

.error-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.error-message {
  background-color: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.troubleshooting {
  margin-top: 16px;
}

.troubleshooting h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.troubleshooting ul {
  margin: 0;
  padding-left: 20px;
}

.troubleshooting li {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.4;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
