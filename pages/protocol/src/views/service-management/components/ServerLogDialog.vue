<template>
  <sc-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="960px"
    class="server-log-dialog"
    destroy-on-close
    @close="handleClose"
  >
    <!-- 工具栏 -->
    <div class="log-toolbar">
      <div class="toolbar-left">
        <ScSelect
          v-model="filterLevel"
          placeholder="日志级别"
          clearable
          class="level-select"
          @change="handleFilterChange"
        >
          <ScOption label="全部" value="" />
          <ScOption label="DEBUG" value="DEBUG">
            <div class="level-option">
              <span class="level-dot level-debug"></span>
              <span>DEBUG</span>
            </div>
          </ScOption>
          <ScOption label="INFO" value="INFO">
            <div class="level-option">
              <span class="level-dot level-info"></span>
              <span>INFO</span>
            </div>
          </ScOption>
          <ScOption label="WARN" value="WARN">
            <div class="level-option">
              <span class="level-dot level-warn"></span>
              <span>WARN</span>
            </div>
          </ScOption>
          <ScOption label="ERROR" value="ERROR">
            <div class="level-option">
              <span class="level-dot level-error"></span>
              <span>ERROR</span>
            </div>
          </ScOption>
        </ScSelect>

        <ScInput
          v-model="searchKeyword"
          placeholder="搜索日志内容..."
          clearable
          class="search-input"
          @input="handleSearchChange"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </ScInput>

        <div class="auto-scroll-toggle">
          <ScSwitch
            v-model="autoScroll"
            inline-prompt
            active-text="自动滚动"
            inactive-text="手动"
          />
        </div>
        <div class="auto-scroll-toggle">
          <ScSwitch
            v-model="autoRefresh"
            inline-prompt
            active-text="定时刷新"
            inactive-text="关闭"
          />
        </div>
      </div>

      <div class="toolbar-right">
        <ScButton class="action-btn" circle @click="loadHistoryLogs">
          <el-icon><Refresh /></el-icon>
        </ScButton>
        <ScButton class="action-btn" circle @click="clearLogs">
          <el-icon><Delete /></el-icon>
        </ScButton>

        <ScButton type="primary" circle class="action-btn" @click="downloadLogs">
          <el-icon><Download /></el-icon>
        </ScButton>
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div ref="logContainer" class="log-container">
      <div v-if="filteredLogs.length === 0" class="log-empty">
        <div class="empty-icon-wrapper">
          <el-icon class="empty-icon"><Document /></el-icon>
        </div>
        <p class="empty-title">暂无日志数据</p>
        <p class="empty-subtitle">等待服务器推送日志...</p>
      </div>

      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        class="log-item"
        :class="'level-' + log.level.toLowerCase()"
      >
        <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        <span
          class="log-level-badge"
          :class="'badge-' + log.level.toLowerCase()"
        >
          {{ log.level }}
        </span>
        <span v-if="log.filterName" class="log-filter">
          {{ log.filterName }}
        </span>
        <span v-if="log.requestMethod && log.requestPath" class="log-request">
          <span class="request-method">{{ log.requestMethod }}</span>
          <span class="request-path">{{ log.requestPath }}</span>
        </span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="log-stats">
      <div class="stats-total">
        <el-icon><Tickets /></el-icon>
        <span>总计</span>
        <strong>{{ logs.length }}</strong>
        <span>条</span>
      </div>

      <div class="stats-divider"></div>

      <div class="stats-group">
        <div class="stat-item stat-debug">
          <span class="stat-dot"></span>
          <span class="stat-label">DEBUG</span>
          <span class="stat-value">{{ logStats.debug }}</span>
        </div>
        <div class="stat-item stat-info">
          <span class="stat-dot"></span>
          <span class="stat-label">INFO</span>
          <span class="stat-value">{{ logStats.info }}</span>
        </div>
        <div class="stat-item stat-warn">
          <span class="stat-dot"></span>
          <span class="stat-label">WARN</span>
          <span class="stat-value">{{ logStats.warn }}</span>
        </div>
        <div class="stat-item stat-error">
          <span class="stat-dot"></span>
          <span class="stat-label">ERROR</span>
          <span class="stat-value">{{ logStats.error }}</span>
        </div>
      </div>
    </div>
  </sc-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import {
  Search,
  Refresh,
  Delete,
  Download,
  Document,
  Tickets,
} from "@element-plus/icons-vue";
import {
  getSystemServerFilterLogs,
  getServerLogSseUrl,
  type LogEntry,
  type SystemServerFilterLogRecord,
  type SystemServer,
} from "@/api/system-server";
import { ScOption } from "@repo/components/ScOption";

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
const autoRefresh = ref(true);
const logContainer = ref<HTMLElement | null>(null);

// SSE 连接
let eventSource: EventSource | null = null;
let refreshTimer: number | null = null;

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

// 清空日志
const clearLogs = () => {
  logs.value = [];
};

const toLevel = (status?: string): LogEntry["level"] => {
  const value = (status || "").toUpperCase();
  if (value.includes("ERROR") || value.includes("FAIL")) return "ERROR";
  if (value.includes("WARN")) return "WARN";
  if (value.includes("DEBUG")) return "DEBUG";
  return "INFO";
};

const mapHistoryToLogEntry = (
  record: SystemServerFilterLogRecord,
): LogEntry => {
  const process = record.processStatus || "UNKNOWN";
  const extra = [record.clientIp, record.clientGeo].filter(Boolean).join(" ");
  return {
    timestamp:
      record.storeTime || record.accessTime || new Date().toISOString(),
    level: toLevel(process),
    logger: record.filterType || "SYSTEM",
    message: extra ? `${process} ${extra}` : process,
    filterName: record.filterType || undefined,
  };
};

const loadHistoryLogs = async () => {
  if (!props.serverId) return;
  try {
    const response = await getSystemServerFilterLogs({
      serverId: props.serverId,
      current: 1,
      size: 200,
    });
    const records = response?.data?.records || [];
    logs.value = records.map(mapHistoryToLogEntry).reverse();
    if (autoScroll.value) {
      scrollToBottom();
    }
  } catch (error) {
    console.error("加载历史日志失败:", error);
  }
};

const stopRefreshTimer = () => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

const startRefreshTimer = () => {
  stopRefreshTimer();
  if (!autoRefresh.value || !dialogVisible.value) {
    return;
  }
  refreshTimer = window.setInterval(() => {
    loadHistoryLogs();
  }, 5000);
};

// 导出日志
const downloadLogs = () => {
  const content = logs.value
    .map(
      (log) =>
        `[${log.timestamp}] [${log.level}] ${log.filterName ? `[${log.filterName}]` : ""} ${log.message}`,
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
  stopRefreshTimer();
  logs.value = [];
  filterLevel.value = "";
  searchKeyword.value = "";
};

watch(
  () => dialogVisible.value,
  async (value) => {
    if (!value) {
      stopRefreshTimer();
      return;
    }
    await loadHistoryLogs();
    startRefreshTimer();
  },
  { immediate: true },
);

watch(autoRefresh, () => {
  startRefreshTimer();
});

onUnmounted(() => {
  stopRefreshTimer();
});
</script>

<style lang="scss" scoped>
.server-log-dialog {
  :deep(.el-dialog) {
    border-radius: 20px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f0f0f0;
    margin-right: 0;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
    }
  }

  :deep(.el-dialog__body) {
    padding: 20px 24px;
  }
}

.log-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .level-select {
    width: 130px;

    :deep(.el-input__wrapper) {
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }
  }

  .search-input {
    width: 220px;

    :deep(.el-input__wrapper) {
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }
  }

  .auto-scroll-toggle {
    :deep(.el-switch) {
      --el-switch-on-color: #10b981;
    }
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

.level-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.level-debug {
    background: #94a3b8;
  }

  &.level-info {
    background: #10b981;
  }

  &.level-warn {
    background: #f59e0b;
  }

  &.level-error {
    background: #ef4444;
  }
}

.log-container {
  height: 480px;
  overflow-y: auto;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  border-radius: 16px;
  padding: 16px;
  font-family: "JetBrains Mono", "Fira Code", "SF Mono", "Consolas", monospace;
  font-size: 12px;
  line-height: 1.7;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.15);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  .log-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;

    .empty-icon-wrapper {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      margin-bottom: 20px;
    }

    .empty-icon {
      font-size: 36px;
      color: rgba(255, 255, 255, 0.3);
    }

    .empty-title {
      margin: 0 0 8px;
      font-size: 15px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
    }

    .empty-subtitle {
      margin: 0;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.35);
    }
  }

  .log-item {
    padding: 8px 12px;
    border-radius: 8px;
    margin-bottom: 6px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    transition: all 0.15s ease;
    border-left: 3px solid transparent;

    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    &.level-debug {
      border-left-color: #94a3b8;

      .log-message {
        color: #cbd5e1;
      }
    }

    &.level-info {
      border-left-color: #10b981;

      .log-message {
        color: #6ee7b7;
      }
    }

    &.level-warn {
      border-left-color: #f59e0b;
      background: rgba(245, 158, 11, 0.06);

      .log-message {
        color: #fcd34d;
      }
    }

    &.level-error {
      border-left-color: #ef4444;
      background: rgba(239, 68, 68, 0.08);

      .log-message {
        color: #fca5a5;
      }
    }

    .log-time {
      color: #64748b;
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 500;
      padding: 2px 0;
    }

    .log-level-badge {
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.badge-debug {
        background: rgba(148, 163, 184, 0.2);
        color: #94a3b8;
      }

      &.badge-info {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      &.badge-warn {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }

      &.badge-error {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
    }

    .log-filter {
      color: #a78bfa;
      flex-shrink: 0;
      font-weight: 600;
      font-size: 11px;
      padding: 2px 8px;
      background: rgba(167, 139, 250, 0.15);
      border-radius: 6px;
    }

    .log-request {
      display: flex;
      gap: 6px;
      flex-shrink: 0;

      .request-method {
        color: #60a5fa;
        font-weight: 700;
        font-size: 11px;
      }

      .request-path {
        color: #93c5fd;
        font-size: 11px;
      }
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
  gap: 20px;
  margin-top: 16px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);

  .stats-total {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;

    .el-icon {
      font-size: 16px;
      color: #3b82f6;
    }

    strong {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 2px;
    }
  }

  .stats-divider {
    width: 1px;
    height: 24px;
    background: #e2e8f0;
  }

  .stats-group {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 10px;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
    }

    .stat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .stat-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 14px;
      font-weight: 700;
      min-width: 24px;
      text-align: center;
    }

    &.stat-debug {
      .stat-dot {
        background: #94a3b8;
      }
      .stat-label {
        color: #64748b;
      }
      .stat-value {
        color: #475569;
      }
    }

    &.stat-info {
      .stat-dot {
        background: #10b981;
      }
      .stat-label {
        color: #059669;
      }
      .stat-value {
        color: #047857;
      }
    }

    &.stat-warn {
      .stat-dot {
        background: #f59e0b;
      }
      .stat-label {
        color: #d97706;
      }
      .stat-value {
        color: #b45309;
      }
    }

    &.stat-error {
      .stat-dot {
        background: #ef4444;
      }
      .stat-label {
        color: #dc2626;
      }
      .stat-value {
        color: #b91c1c;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .server-log-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 16px auto;
    }
  }

  .log-toolbar {
    flex-direction: column;
    gap: 16px;
    padding: 14px 16px;

    .toolbar-left {
      width: 100%;
      flex-wrap: wrap;
      gap: 12px;

      .level-select,
      .search-input {
        flex: 1;
        min-width: 120px;
      }
    }

    .toolbar-right {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .log-container {
    height: 360px;
    padding: 12px;

    .log-item {
      flex-wrap: wrap;
      padding: 8px 10px;
      gap: 6px;

      .log-time {
        order: 1;
      }

      .log-level-badge {
        order: 2;
      }

      .log-message {
        order: 5;
        width: 100%;
        margin-top: 4px;
      }
    }
  }

  .log-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;

    .stats-divider {
      display: none;
    }

    .stats-group {
      width: 100%;
      flex-wrap: wrap;
      gap: 10px;
    }

    .stat-item {
      flex: 1;
      min-width: calc(50% - 5px);
      justify-content: center;
    }
  }
}
</style>
