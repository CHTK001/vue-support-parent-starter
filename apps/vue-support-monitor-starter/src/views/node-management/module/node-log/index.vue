<template>
  <div class="node-log">
    <!-- 节点选择和订阅控制 -->
    <ScCard class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">实时日志查看</span>
          <div class="flex items-center gap-2">
            <el-tag v-if="subscribed" type="success" size="small">
              <IconifyIconOnline icon="ep:video-play" class="mr-1" />
              已订阅
            </el-tag>
            <el-tag v-else type="info" size="small">
              <IconifyIconOnline icon="ep:video-pause" class="mr-1" />
              未订阅
            </el-tag>
          </div>
        </div>
      </template>
      <div class="flex items-center gap-4 flex-wrap">
        <el-input
          v-model="nodeInfo.ipAddress"
          placeholder="节点IP地址"
          style="width: 180px"
          :disabled="subscribed"
        />
        <el-input-number
          v-model="nodeInfo.port"
          :min="1"
          :max="65535"
          placeholder="端口"
          style="width: 120px"
          :disabled="subscribed"
        />
        <el-select v-model="logLevel" style="width: 120px" :disabled="subscribed">
          <el-option label="TRACE" value="TRACE" />
          <el-option label="DEBUG" value="DEBUG" />
          <el-option label="INFO" value="INFO" />
          <el-option label="WARN" value="WARN" />
          <el-option label="ERROR" value="ERROR" />
        </el-select>
        <el-button
          v-if="!subscribed"
          type="primary"
          :icon="VideoPlay"
          @click="subscribe"
        >
          订阅日志
        </el-button>
        <el-button
          v-else
          type="danger"
          :icon="VideoPause"
          @click="unsubscribe"
        >
          取消订阅
        </el-button>
        <el-tooltip content="清空日志" placement="top">
          <el-button :icon="Delete" @click="clearLogs" />
        </el-tooltip>
        <el-checkbox v-model="autoScroll">自动滚动</el-checkbox>
      </div>
    </ScCard>

    <!-- 日志过滤 -->
    <ScCard class="mb-4">
      <div class="flex items-center gap-4 flex-wrap">
        <el-input
          v-model="filterText"
          placeholder="搜索日志内容..."
          clearable
          style="width: 300px"
          :prefix-icon="Search"
        />
        <el-checkbox-group v-model="filterLevels" size="small">
          <el-checkbox-button label="TRACE">TRACE</el-checkbox-button>
          <el-checkbox-button label="DEBUG">DEBUG</el-checkbox-button>
          <el-checkbox-button label="INFO">INFO</el-checkbox-button>
          <el-checkbox-button label="WARN">WARN</el-checkbox-button>
          <el-checkbox-button label="ERROR">ERROR</el-checkbox-button>
        </el-checkbox-group>
        <span class="text-gray-500 text-sm">
          共 {{ logs.length }} 条，显示 {{ filteredLogs.length }} 条
        </span>
      </div>
    </ScCard>

    <!-- 日志列表 -->
    <ScCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">日志内容</span>
          <span class="text-gray-400 text-sm">最大保留 {{ maxLogs }} 条</span>
        </div>
      </template>
      <div ref="logContainerRef" class="log-container">
        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          class="log-item"
          :class="'log-' + log.level.toLowerCase()"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level" :class="'level-' + log.level.toLowerCase()">
            {{ log.level }}
          </span>
          <span class="log-thread">[{{ log.threadName }}]</span>
          <span class="log-logger">{{ shortenLoggerName(log.loggerName) }}</span>
          <span class="log-message">{{ log.message }}</span>
          <div v-if="log.exception" class="log-exception">
            <span class="exception-class">{{ log.exceptionClass }}:</span>
            {{ log.exception }}
          </div>
        </div>
        <div v-if="filteredLogs.length === 0" class="text-center text-gray-400 py-10">
          <IconifyIconOnline icon="ep:document" class="text-4xl mb-2" />
          <div>暂无日志</div>
        </div>
      </div>
    </ScCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { VideoPlay, VideoPause, Delete, Search } from "@element-plus/icons-vue";
import { message } from "@repo/utils";
import {
  subscribeLogForNode,
  unsubscribeLogForNode,
  type LogEntry,
} from "@/api/server/node-log";

defineOptions({ name: "NodeLog" });

const nodeInfo = ref({ ipAddress: "", port: 8080 });
const logLevel = ref("INFO");
const subscribed = ref(false);
const autoScroll = ref(true);
const filterText = ref("");
const filterLevels = ref(["TRACE", "DEBUG", "INFO", "WARN", "ERROR"]);
const logs = ref<LogEntry[]>([]);
const maxLogs = 1000;
const logContainerRef = ref<HTMLElement | null>(null);

let ws: WebSocket | null = null;

/**
 * 过滤后的日志
 */
const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    // 级别过滤
    if (!filterLevels.value.includes(log.level)) {
      return false;
    }
    // 文本过滤
    if (filterText.value) {
      const searchText = filterText.value.toLowerCase();
      return (
        log.message.toLowerCase().includes(searchText) ||
        log.loggerName.toLowerCase().includes(searchText) ||
        log.threadName.toLowerCase().includes(searchText)
      );
    }
    return true;
  });
});

/**
 * 订阅日志
 */
const subscribe = async () => {
  if (!nodeInfo.value.ipAddress || !nodeInfo.value.port) {
    message("请输入节点IP和端口", { type: "warning" });
    return;
  }

  try {
    await subscribeLogForNode(
      nodeInfo.value.ipAddress,
      nodeInfo.value.port,
      logLevel.value
    );
    subscribed.value = true;
    connectWebSocket();
    message("订阅成功", { type: "success" });
  } catch {
    message("订阅失败", { type: "error" });
  }
};

/**
 * 取消订阅
 */
const unsubscribe = async () => {
  try {
    await unsubscribeLogForNode(nodeInfo.value.ipAddress, nodeInfo.value.port);
    subscribed.value = false;
    disconnectWebSocket();
    message("已取消订阅", { type: "info" });
  } catch {
    message("取消订阅失败", { type: "error" });
  }
};

/**
 * 连接 WebSocket
 */
const connectWebSocket = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/monitor/node/log`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("[NodeLog] WebSocket 已连接");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "NODE_LOG") {
        addLog(data as LogEntry);
      }
    } catch (e) {
      console.error("[NodeLog] 解析消息失败", e);
    }
  };

  ws.onerror = (error) => {
    console.error("[NodeLog] WebSocket 错误", error);
  };

  ws.onclose = () => {
    console.log("[NodeLog] WebSocket 已断开");
  };
};

/**
 * 断开 WebSocket
 */
const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};

/**
 * 添加日志
 */
const addLog = (log: LogEntry) => {
  // 过滤当前节点的日志
  if (
    log.port !== nodeInfo.value.port
  ) {
    return;
  }

  logs.value.push(log);

  // 限制最大日志数量
  if (logs.value.length > maxLogs) {
    logs.value = logs.value.slice(-maxLogs);
  }

  // 自动滚动
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
};

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  if (logContainerRef.value) {
    logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
  }
};

/**
 * 清空日志
 */
const clearLogs = () => {
  logs.value = [];
};

/**
 * 缩短 Logger 名称
 */
const shortenLoggerName = (name: string) => {
  if (!name) return "";
  const parts = name.split(".");
  if (parts.length <= 2) return name;
  return parts.slice(-2).join(".");
};

// 监听自动滚动
watch(autoScroll, (val) => {
  if (val) {
    scrollToBottom();
  }
});

onMounted(() => {
  // 如果有路由参数，可以自动填充
});

onUnmounted(() => {
  if (subscribed.value) {
    unsubscribe();
  }
  disconnectWebSocket();
});
</script>

<style scoped lang="scss">
.node-log {
  padding: 20px;
}

.log-container {
  height: 500px;
  overflow-y: auto;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  background-color: var(--el-bg-color);
  border-radius: 4px;
  padding: 10px;
}

.log-item {
  padding: 4px 8px;
  border-radius: 2px;
  margin-bottom: 2px;
  line-height: 1.5;

  &.log-error {
    background-color: rgba(245, 108, 108, 0.1);
  }

  &.log-warn {
    background-color: rgba(230, 162, 60, 0.1);
  }

  &.log-info {
    background-color: transparent;
  }

  &.log-debug {
    background-color: rgba(144, 147, 153, 0.1);
  }

  &.log-trace {
    background-color: rgba(144, 147, 153, 0.05);
    color: var(--el-text-color-secondary);
  }
}

.log-time {
  color: var(--el-text-color-secondary);
  margin-right: 8px;
}

.log-level {
  display: inline-block;
  width: 50px;
  font-weight: 600;
  margin-right: 8px;

  &.level-error {
    color: var(--el-color-danger);
  }

  &.level-warn {
    color: var(--el-color-warning);
  }

  &.level-info {
    color: var(--el-color-primary);
  }

  &.level-debug {
    color: var(--el-text-color-secondary);
  }

  &.level-trace {
    color: var(--el-text-color-placeholder);
  }
}

.log-thread {
  color: var(--el-color-success);
  margin-right: 8px;
}

.log-logger {
  color: var(--el-color-info);
  margin-right: 8px;
}

.log-message {
  color: var(--el-text-color-primary);
}

.log-exception {
  margin-top: 4px;
  padding-left: 20px;
  color: var(--el-color-danger);
  font-size: 12px;

  .exception-class {
    font-weight: 600;
  }
}
</style>
