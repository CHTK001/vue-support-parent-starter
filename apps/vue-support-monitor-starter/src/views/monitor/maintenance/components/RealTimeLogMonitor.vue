<template>
  <div class="real-time-log-container">
    <div class="log-header">
      <div class="title-area">
        <IconifyIconOnline icon="ri:terminal-box-line" class="title-icon" />
        <h3 class="title">实时日志监控</h3>
      </div>
      <div class="controls">
        <el-switch v-model="autoScroll" active-text="自动滚动" />
        <el-button type="primary" size="small" @click="clearLogs">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空
        </el-button>
      </div>
    </div>
    <div class="log-toolbar">
      <el-input v-model="filterText" placeholder="搜索日志内容" prefix-icon="Search" clearable size="small" class="search-input" />
      <div class="filter-controls">
        <el-radio-group v-model="logLevel" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="info">信息</el-radio-button>
          <el-radio-button label="success">成功</el-radio-button>
          <el-radio-button label="error">错误</el-radio-button>
        </el-radio-group>
      </div>
    </div>
    <div ref="logContentRef" class="log-content">
      <template v-if="filteredLogs.length > 0">
        <div v-for="(log, index) in filteredLogs" :key="index" class="log-item" :class="getLogLevelClass(log.level)">
          <span class="log-time">{{ formatTime(log.time) }}</span>
          <span class="log-level">{{ getLogLevelText(log.level) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </template>
      <template v-else>
        <div class="empty-logs">
          <el-empty description="暂无日志信息" :image-size="100" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { message } from "@repo/utils";

const props = defineProps({
  channel: {
    type: String,
    default: "global"
  }
});

// SocketIO 实例
const socket = ref(null);
const logs = ref([]);
const filterText = ref("");
const logLevel = ref("all");
const autoScroll = ref(true);
const logContentRef = ref(null);

// 过滤后的日志
const filteredLogs = computed(() => {
  let filtered = [...logs.value];

  // 按级别过滤
  if (logLevel.value !== "all") {
    filtered = filtered.filter(log => log.level === logLevel.value);
  }

  // 按内容过滤
  if (filterText.value) {
    const keyword = filterText.value.toLowerCase();
    filtered = filtered.filter(log => log.message.toLowerCase().includes(keyword));
  }

  return filtered;
});

// 初始化Socket连接
const initSocket = () => {
  socket.value = inject("socket");

  if (!socket.value) {
    console.error("Socket实例不存在");
    return;
  }
  // 监听全局日志频道
  socket.value.on(`${props.channel}`, handleLogMessage);
};

// 处理日志消息
const handleLogMessage = data => {
  try {
    const logData = typeof data === "string" ? JSON.parse(data) : data;
    // 添加时间戳
    if (!logData.time) {
      logData.time = new Date().toISOString();
    }

    logs.value.push({
      time: logData.time,
      level: logData.level || "info",
      message: logData.message || logData.content || logData.data || ""
    });

    // 限制日志数量，防止内存占用过多
    if (logs.value.length > 1000) {
      logs.value = logs.value.slice(-1000);
    }

    // 自动滚动到底部
    if (autoScroll.value) {
      scrollToBottom();
    }
  } catch (error) {
    console.error("处理日志消息错误:", error);
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (logContentRef.value) {
      logContentRef.value.scrollTop = logContentRef.value.scrollHeight;
    }
  });
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
  message("日志已清空", { type: "success" });
};

// 格式化时间
const formatTime = timeStr => {
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString() + "." + date.getMilliseconds().toString().padStart(3, "0");
  } catch (e) {
    return timeStr;
  }
};

// 获取日志级别类名
const getLogLevelClass = level => {
  switch (level) {
    case "success":
      return "log-success";
    case "error":
      return "log-error";
    case "warning":
      return "log-warning";
    case "info":
      return "log-info";
    default:
      return "log-info";
  }
};

// 获取日志级别文本
const getLogLevelText = level => {
  switch (level) {
    case "success":
      return "成功";
    case "error":
      return "错误";
    case "warning":
      return "警告";
    case "info":
      return "信息";
    default:
      return "信息";
  }
};

// 监听日志内容变化，自动滚动
watch(
  () => logs.value.length,
  () => {
    if (autoScroll.value) {
      scrollToBottom();
    }
  }
);

// 组件挂载
onMounted(() => {
  initSocket();
});

// 组件卸载
onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.off(`logs:${props.channel}`, handleLogMessage);
  }
});
</script>

<style lang="scss" scoped>
.real-time-log-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-light));
    border-bottom: 1px solid var(--el-border-color-light);

    .title-area {
      display: flex;
      align-items: center;
      gap: 8px;

      .title-icon {
        font-size: 20px;
        color: var(--el-color-primary);
      }

      .title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-color-primary-darken-10);
      }
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  }

  .log-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background-color: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-light);

    .search-input {
      width: 250px;
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    background-color: var(--el-fill-color-blank);
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 13px;
    line-height: 1.5;

    .log-item {
      padding: 4px 8px;
      margin-bottom: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--el-fill-color-light);
      }

      .log-time {
        color: var(--el-text-color-secondary);
        margin-right: 10px;
        font-size: 12px;
      }

      .log-level {
        display: inline-block;
        min-width: 40px;
        text-align: center;
        padding: 0 6px;
        border-radius: 3px;
        font-size: 12px;
        margin-right: 10px;
        font-weight: 500;
      }

      .log-message {
        word-break: break-word;
      }

      &.log-info .log-level {
        background-color: var(--el-color-info-light-9);
        color: var(--el-color-info);
      }

      &.log-success .log-level {
        background-color: var(--el-color-success-light-9);
        color: var(--el-color-success);
      }

      &.log-warning .log-level {
        background-color: var(--el-color-warning-light-9);
        color: var(--el-color-warning);
      }

      &.log-error .log-level {
        background-color: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
      }
    }

    .empty-logs {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      min-height: 200px;
    }
  }
}

.mr-1 {
  margin-right: 4px;
}

@media (max-width: 768px) {
  .log-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;

    .search-input {
      width: 100%;
      margin-bottom: 8px;
    }
  }
}
</style>
