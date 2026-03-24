<template>
  <div class="log-container">
    <el-card>
      <template #header>
        <div class="header-actions">
          <div class="title-group">
            <h3>任务日志</h3>
            <el-tag v-if="taskId" type="info">任务 #{{ taskId }}</el-tag>
          </div>
          <div class="toolbar-actions">
            <el-input
              v-model="searchText"
              placeholder="搜索日志内容"
              clearable
              style="width: 220px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="selectedStatus"
              placeholder="执行状态"
              clearable
              style="width: 140px"
            >
              <el-option label="运行中" value="RUNNING" />
              <el-option label="成功" value="SUCCESS" />
              <el-option label="失败" value="FAIL" />
              <el-option label="超时" value="TIMEOUT" />
            </el-select>
            <el-button :loading="loading" @click="handleRefresh">刷新</el-button>
            <el-button :disabled="filteredLogs.length === 0" @click="handleExport">
              导出
            </el-button>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="!taskId" description="缺少任务ID，无法加载日志" />

      <template v-else>
        <div v-loading="loading" class="log-content">
          <div ref="logListRef" class="log-list">
            <div
              v-for="log in filteredLogs"
              :key="log.syncLogId"
              :class="['log-item', `log-${getStatusClass(log.syncLogStatus)}`, { active: selectedLog?.syncLogId === log.syncLogId }]"
              @click="handleSelectLog(log)"
            >
              <div class="log-item-header">
                <span class="log-time">
                  {{ formatDateTime(log.syncLogStartTime || log.syncLogEndTime) }}
                </span>
                <el-tag :type="getStatusTagType(log.syncLogStatus)" size="small">
                  {{ getStatusText(log.syncLogStatus) }}
                </el-tag>
                <el-tag size="small" effect="plain" type="info">
                  {{ getTriggerText(log.syncLogTriggerType) }}
                </el-tag>
                <span class="log-message">{{ buildLogSummary(log) }}</span>
              </div>
              <div class="log-item-meta">
                <span>读取 {{ log.syncLogReadCount || 0 }}</span>
                <span>写入 {{ log.syncLogWriteCount || 0 }}</span>
                <span>成功 {{ log.syncLogSuccessCount || 0 }}</span>
                <span>失败 {{ log.syncLogFailCount || 0 }}</span>
                <span>耗时 {{ formatCost(log.syncLogCost) }}</span>
                <span>吞吐 {{ formatThroughput(log.syncLogThroughput) }}</span>
              </div>

              <div v-if="selectedLog?.syncLogId === log.syncLogId" class="log-detail">
                <div v-if="selectedLog.syncLogMessage" class="detail-block">
                  <div class="detail-label">执行消息</div>
                  <pre>{{ selectedLog.syncLogMessage }}</pre>
                </div>
                <div v-if="selectedLog.syncLogStackTrace" class="detail-block">
                  <div class="detail-label">异常堆栈</div>
                  <pre>{{ selectedLog.syncLogStackTrace }}</pre>
                </div>
              </div>
            </div>

            <el-empty
              v-if="!loading && filteredLogs.length === 0"
              description="当前条件下暂无日志"
            />
          </div>
        </div>

        <div class="log-footer">
          <div class="footer-left">
            <el-checkbox v-model="autoRefresh">自动刷新</el-checkbox>
            <span>当前页 {{ filteredLogs.length }} 条 / 总计 {{ total }} 条</span>
          </div>
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="size"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { getSyncLogDetail, getSyncTaskLogs, type SyncTaskLog } from "../../api/sync";

const route = useRoute();
const router = useRouter();

const taskId = computed(() => {
  const value = Number(route.params.taskId);
  return Number.isFinite(value) && value > 0 ? value : undefined;
});

const logListRef = ref<HTMLElement>();
const loading = ref(false);
const searchText = ref("");
const selectedStatus = ref("");
const autoRefresh = ref(true);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const logs = ref<SyncTaskLog[]>([]);
const selectedLog = ref<SyncTaskLog | null>(null);

const filteredLogs = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();

  return logs.value.filter((log) => {
    if (selectedStatus.value && log.syncLogStatus !== selectedStatus.value) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const content = [
      log.syncLogMessage,
      log.syncLogStackTrace,
      log.syncLogStatus,
      log.syncLogTriggerType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return content.includes(keyword);
  });
});

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const formatCost = (value?: number) => {
  if (value === undefined || value === null) {
    return "-";
  }
  if (value < 1000) {
    return `${value}ms`;
  }
  return `${(value / 1000).toFixed(2)}s`;
};

const formatThroughput = (value?: number) => {
  if (value === undefined || value === null) {
    return "-";
  }
  return `${Number(value).toFixed(2)} 条/秒`;
};

const getStatusText = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "运行中",
    SUCCESS: "成功",
    FAIL: "失败",
    TIMEOUT: "超时",
  };
  return status ? map[status] || status : "未知";
};

const getStatusClass = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "running",
    SUCCESS: "success",
    FAIL: "fail",
    TIMEOUT: "timeout",
  };
  return status ? map[status] || "default" : "default";
};

const getStatusTagType = (status?: string) => {
  const map: Record<string, string> = {
    RUNNING: "warning",
    SUCCESS: "success",
    FAIL: "danger",
    TIMEOUT: "danger",
  };
  return status ? map[status] || "info" : "info";
};

const getTriggerText = (triggerType?: string) => {
  const map: Record<string, string> = {
    MANUAL: "手动",
    SCHEDULE: "调度",
    API: "API",
  };
  return triggerType ? map[triggerType] || triggerType : "未知";
};

const buildLogSummary = (log: SyncTaskLog) => {
  if (log.syncLogMessage) {
    return log.syncLogMessage;
  }

  return `执行${getStatusText(log.syncLogStatus)}，读取 ${log.syncLogReadCount || 0} 条，写入 ${log.syncLogWriteCount || 0} 条。`;
};

const scrollToBottom = () => {
  if (!logListRef.value) {
    return;
  }
  logListRef.value.scrollTop = logListRef.value.scrollHeight;
};

const loadLogs = async (showSuccessMessage = false) => {
  if (!taskId.value) {
    logs.value = [];
    total.value = 0;
    selectedLog.value = null;
    return;
  }

  loading.value = true;
  try {
    const payload = await getSyncTaskLogs(taskId.value, page.value, size.value);
    logs.value = payload.data?.records ?? [];
    total.value = payload.data?.total ?? 0;

    if (selectedLog.value?.syncLogId) {
      selectedLog.value =
        logs.value.find((item) => item.syncLogId === selectedLog.value?.syncLogId) ||
        null;
    }

    if (autoRefresh.value) {
      await nextTick();
      scrollToBottom();
    }

    if (showSuccessMessage) {
      ElMessage.success("刷新成功");
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "加载日志失败");
  } finally {
    loading.value = false;
  }
};

const handleSelectLog = async (log: SyncTaskLog) => {
  if (!log.syncLogId) {
    selectedLog.value = log;
    return;
  }

  if (selectedLog.value?.syncLogId === log.syncLogId) {
    selectedLog.value = null;
    return;
  }

  selectedLog.value = log;

  if (log.syncLogStackTrace || !log.syncLogId) {
    return;
  }

  try {
    const payload = await getSyncLogDetail(log.syncLogId);
    const detail = payload.data;
    if (!detail) {
      return;
    }

    selectedLog.value = detail;
    logs.value = logs.value.map((item) =>
      item.syncLogId === detail.syncLogId ? { ...item, ...detail } : item,
    );
  } catch (error: any) {
    ElMessage.error(error?.message || "加载日志详情失败");
  }
};

const handleRefresh = async () => {
  await loadLogs(true);
};

const handleExport = () => {
  const content = filteredLogs.value
    .map(
      (log) =>
        `[${formatDateTime(log.syncLogStartTime || log.syncLogEndTime)}] [${getStatusText(log.syncLogStatus)}] [${getTriggerText(log.syncLogTriggerType)}] ${buildLogSummary(log)}`,
    )
    .join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `task-${taskId.value || "unknown"}-logs-${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success("导出成功");
};

const handleBack = () => {
  router.push("/sync/tasks");
};

const handlePageChange = async () => {
  await loadLogs();
};

const handlePageSizeChange = async () => {
  page.value = 1;
  await loadLogs();
};

let refreshTimer: number | null = null;

onMounted(() => {
  loadLogs();
  refreshTimer = window.setInterval(() => {
    if (autoRefresh.value) {
      loadLogs();
    }
  }, 10000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>

<style scoped lang="scss">
.log-container {
  padding: 20px;
  min-height: calc(100vh - 40px);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 12px;

  h3 {
    margin: 0;
  }
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.log-content {
  min-height: 500px;
}

.log-list {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  font-family: "Consolas", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
}

.log-item {
  padding: 10px 12px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover,
  &.active {
    background: rgba(255, 255, 255, 0.04);
  }
}

.log-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 6px;
  margin-left: 6px;
  color: #8c8c8c;
  font-size: 12px;
}

.log-time {
  color: #858585;
  flex-shrink: 0;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-detail {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
}

.detail-block + .detail-block {
  margin-top: 10px;
}

.detail-label {
  margin-bottom: 6px;
  color: #c0c4cc;
  font-size: 12px;
}

.detail-block pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #d4d4d4;
}

.log-success .log-message {
  color: #67c23a;
}

.log-running .log-message {
  color: #e6a23c;
}

.log-fail .log-message,
.log-timeout .log-message {
  color: #f56c6c;
}

.log-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
}
</style>
