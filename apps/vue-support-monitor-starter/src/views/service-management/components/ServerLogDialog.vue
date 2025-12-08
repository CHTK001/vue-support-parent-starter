<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="900px"
    class="server-log-dialog"
    destroy-on-close
    @close="handleClose"
  >
    <!-- 工具栏 -->
    <div class="log-toolbar">
      <div class="toolbar-left">
        <el-select
          v-model="filterLevel"
          placeholder="日志级别"
          clearable
          style="width: 120px"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="" />
          <el-option label="DEBUG" value="DEBUG">
            <el-tag type="info" size="small">DEBUG</el-tag>
          </el-option>
          <el-option label="INFO" value="INFO">
            <el-tag type="success" size="small">INFO</el-tag>
          </el-option>
          <el-option label="WARN" value="WARN">
            <el-tag type="warning" size="small">WARN</el-tag>
          </el-option>
          <el-option label="ERROR" value="ERROR">
            <el-tag type="danger" size="small">ERROR</el-tag>
          </el-option>
        </el-select>

        <el-input
          v-model="searchKeyword"
          placeholder="搜索日志内容"
          clearable
          style="width: 200px"
          @input="handleSearchChange"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>

        <el-switch
          v-model="autoScroll"
          active-text="自动滚动"
          inactive-text=""
          style="margin-left: 12px"
        />
      </div>

      <div class="toolbar-right">
        <el-tag
          :type="connectionStatus === 'connected' ? 'success' : 'danger'"
          size="small"
        >
          <IconifyIconOnline
            :icon="
              connectionStatus === 'connected'
                ? 'ri:wifi-line'
                : 'ri:wifi-off-line'
            "
          />
          {{ connectionStatus === "connected" ? "已连接" : "未连接" }}
        </el-tag>

        <el-button
          type="primary"
          size="small"
          @click="reconnect"
          :loading="isReconnecting"
        >
          <IconifyIconOnline icon="ri:refresh-line" />
          重连
        </el-button>

        <el-button type="warning" size="small" @click="clearLogs">
          <IconifyIconOnline icon="ri:delete-bin-line" />
          清空
        </el-button>

        <el-button type="info" size="small" @click="downloadLogs">
          <IconifyIconOnline icon="ri:download-line" />
          导出
        </el-button>
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div ref="logContainer" class="log-container">
      <div v-if="filteredLogs.length === 0" class="log-empty">
        <IconifyIconOnline icon="ri:file-list-3-line" class="empty-icon" />
        <p>暂无日志数据</p>
        <p class="sub-text">等待服务器推送日志...</p>
      </div>

      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        class="log-item"
        :class="'level-' + log.level.toLowerCase()"
      >
        <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        <el-tag
          :type="getLevelTagType(log.level)"
          size="small"
          class="log-level"
        >
          {{ log.level }}
        </el-tag>
        <span v-if="log.filterName" class="log-filter">
          [{{ log.filterName }}]
        </span>
        <span v-if="log.requestMethod && log.requestPath" class="log-request">
          {{ log.requestMethod }} {{ log.requestPath }}
        </span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="log-stats">
      <span>
        总计: <strong>{{ logs.length }}</strong> 条
      </span>
      <span class="stat-item">
        <el-tag type="info" size="small">DEBUG</el-tag> {{ logStats.debug }}
      </span>
      <span class="stat-item">
        <el-tag type="success" size="small">INFO</el-tag> {{ logStats.info }}
      </span>
      <span class="stat-item">
        <el-tag type="warning" size="small">WARN</el-tag> {{ logStats.warn }}
      </span>
      <span class="stat-item">
        <el-tag type="danger" size="small">ERROR</el-tag> {{ logStats.error }}
      </span>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import {
  getServerLogSseUrl,
  type LogEntry,
  type SystemServer,
} from "@/api/system-server";

/**
 * 服务器日志对话框组件
 * 使用 SSE 实时接收服务器日志
 *
 * @author CH
 * @since 2024/12/08
 */

const props = defineProps<{
  visible: boolean;
  server: SystemServer | null;
  serverId: number | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

// 对话框可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

// 对话框标题
const dialogTitle = computed(() => {
  return props.server
    ? `服务器日志 - ${props.server.systemServerName}`
    : "服务器日志";
});

// 日志数据
const logs = ref<LogEntry[]>([]);
const filterLevel = ref("");
const searchKeyword = ref("");
const autoScroll = ref(true);
const logContainer = ref<HTMLElement | null>(null);

// SSE 连接状态
const connectionStatus = ref<"connected" | "disconnected">("disconnected");
const isReconnecting = ref(false);
let eventSource: EventSource | null = null;

// 日志统计
const logStats = computed(() => {
  const stats = { debug: 0, info: 0, warn: 0, error: 0 };
  logs.value.forEach((log) => {
    const level = log.level.toLowerCase() as keyof typeof stats;
    if (stats[level] !== undefined) {
      stats[level]++;
    }
  });
  return stats;
});

// 过滤后的日志
const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    // 级别过滤
    if (filterLevel.value && log.level !== filterLevel.value) {
      return false;
    }
    // 关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      return (
        log.message.toLowerCase().includes(keyword) ||
        (log.filterName && log.filterName.toLowerCase().includes(keyword)) ||
        (log.requestPath && log.requestPath.toLowerCase().includes(keyword))
      );
    }
    return true;
  });
});

// 连接 SSE
const connectSSE = () => {
  if (!props.serverId) return;

  // 关闭现有连接
  disconnectSSE();

  const sseUrl = getServerLogSseUrl(props.serverId);
  console.log("连接 SSE:", sseUrl);

  eventSource = new EventSource(sseUrl);

  eventSource.onopen = () => {
    console.log("SSE 连接已建立");
    connectionStatus.value = "connected";
    isReconnecting.value = false;
  };

  eventSource.onmessage = (event) => {
    try {
      const logEntry = JSON.parse(event.data) as LogEntry;
      logs.value.push(logEntry);

      // 限制日志数量，防止内存溢出
      if (logs.value.length > 1000) {
        logs.value = logs.value.slice(-500);
      }

      // 自动滚动到底部
      if (autoScroll.value) {
        scrollToBottom();
      }
    } catch (e) {
      console.error("解析日志数据失败:", e);
    }
  };

  eventSource.onerror = (error) => {
    console.error("SSE 连接错误:", error);
    connectionStatus.value = "disconnected";

    // 自动重连
    setTimeout(() => {
      if (props.visible && props.serverId) {
        console.log("尝试重新连接...");
        connectSSE();
      }
    }, 3000);
  };
};

// 断开 SSE
const disconnectSSE = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  connectionStatus.value = "disconnected";
};

// 重新连接
const reconnect = () => {
  isReconnecting.value = true;
  connectSSE();
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
};

// 导出日志
const downloadLogs = () => {
  const content = logs.value
    .map(
      (log) =>
        `[${log.timestamp}] [${log.level}] ${log.filterName ? `[${log.filterName}]` : ""} ${log.message}`
    )
    .join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `server-${props.serverId}-logs-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

// 格式化时间
const formatTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  } catch {
    return timestamp;
  }
};

// 获取日志级别标签类型
const getLevelTagType = (level: string) => {
  switch (level.toUpperCase()) {
    case "DEBUG":
      return "info";
    case "INFO":
      return "success";
    case "WARN":
      return "warning";
    case "ERROR":
      return "danger";
    default:
      return "info";
  }
};

// 处理过滤变化
const handleFilterChange = () => {
  scrollToBottom();
};

// 处理搜索变化
const handleSearchChange = () => {
  scrollToBottom();
};

// 关闭对话框
const handleClose = () => {
  disconnectSSE();
  logs.value = [];
  filterLevel.value = "";
  searchKeyword.value = "";
};

// 监听对话框显示状态
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.serverId) {
      connectSSE();
    } else {
      disconnectSSE();
    }
  }
);

// 组件卸载时断开连接
onUnmounted(() => {
  disconnectSSE();
});
</script>

<style lang="scss" scoped>
.server-log-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px;
  }
}

.log-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.log-container {
  height: 450px;
  overflow-y: auto;
  background: #1e1e1e;
  border-radius: 12px;
  padding: 12px;
  font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
  font-size: 12px;
  line-height: 1.6;

  .log-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6b7280;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      margin: 4px 0;
    }

    .sub-text {
      font-size: 12px;
      color: #9ca3af;
    }
  }

  .log-item {
    padding: 6px 8px;
    border-radius: 4px;
    margin-bottom: 4px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &.level-debug {
      color: #9ca3af;
    }

    &.level-info {
      color: #10b981;
    }

    &.level-warn {
      color: #f59e0b;
    }

    &.level-error {
      color: #ef4444;
    }

    .log-time {
      color: #6b7280;
      flex-shrink: 0;
      font-size: 11px;
    }

    .log-level {
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 600;
    }

    .log-filter {
      color: #8b5cf6;
      flex-shrink: 0;
      font-weight: 500;
    }

    .log-request {
      color: #3b82f6;
      flex-shrink: 0;
    }

    .log-message {
      flex: 1;
      word-break: break-all;
    }
  }
}

.log-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12px;
  color: #64748b;

  strong {
    color: #1e293b;
    font-weight: 600;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
