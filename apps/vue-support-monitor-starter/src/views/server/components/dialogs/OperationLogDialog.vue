<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="1000px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="operation-log">
      <!-- 过滤�?-->
      <div class="log-filters">
        <el-row :gutter="16">
          <el-col :span="5">
            <el-date-picker
              v-model="filters.dateRange"
              type="datetimerange"
              range-separator="�?
              start-placeholder="开始时�?
              end-placeholder="结束时间"
              size="small"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.level"
              placeholder="日志级别"
              size="small"
              clearable
            >
              <el-option label="调试" value="DEBUG" />
              <el-option label="信息" value="INFO" />
              <el-option label="警告" value="WARN" />
              <el-option label="错误" value="ERROR" />
              <el-option label="致命" value="FATAL" />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.source"
              placeholder="日志来源"
              size="small"
              clearable
            >
              <el-option label="系统日志" value="SYSTEM" />
              <el-option label="应用日志" value="APPLICATION" />
              <el-option label="安全日志" value="SECURITY" />
              <el-option label="访问日志" value="ACCESS" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索关键�?
              size="small"
              clearable
            />
          </el-col>
          <el-col :span="9">
            <el-button size="small" type="primary" @click="searchLogs">
              <IconifyIconOnline icon="ri:search-line" class="mr-1" />
              查询
            </el-button>
            <el-button size="small" @click="resetFilters">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              重置
            </el-button>
            <el-button size="small" @click="exportLogs">
              <IconifyIconOnline icon="ri:download-line" class="mr-1" />
              导出
            </el-button>
            <el-button size="small" @click="clearLogs" type="danger" plain>
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              清理
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 日志列表 -->
      <div class="log-list" v-loading="loading">
        <el-table
          :data="logs"
          stripe
          size="small"
          height="450"
          @row-click="showLogDetail"
        >
          <el-table-column
            prop="monitorSysGenServerLogCreateTime"
            label="时间"
            width="160"
          >
            <template #default="{ row }">
              {{ formatTime(row.monitorSysGenServerLogCreateTime) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="monitorSysGenServerLogLevel"
            label="级别"
            width="80"
          >
            <template #default="{ row }">
              <el-tag
                :type="getLogLevelType(row.monitorSysGenServerLogLevel)"
                size="small"
              >
                {{ getLogLevelText(row.monitorSysGenServerLogLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="monitorSysGenServerLogSource"
            label="来源"
            width="100"
          >
            <template #default="{ row }">
              <el-tag
                :type="getLogSourceType(row.monitorSysGenServerLogSource)"
                size="small"
                effect="plain"
              >
                {{ getLogSourceText(row.monitorSysGenServerLogSource) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="monitorSysGenServerLogCategory"
            label="分类"
            width="100"
            show-overflow-tooltip
          />
          <el-table-column
            prop="monitorSysGenServerLogContent"
            label="日志内容"
            min-width="300"
            show-overflow-tooltip
          />
          <el-table-column
            prop="monitorSysGenServerLogIp"
            label="IP地址"
            width="120"
          />
          <el-table-column
            prop="monitorSysGenServerLogHostname"
            label="主机�?
            width="120"
            show-overflow-tooltip
          />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text @click.stop="showLogDetail(row)">
                <IconifyIconOnline icon="ri:eye-line" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="log-pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="log-statistics">
        <el-row :gutter="16">
          <el-col :span="4">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">总日志数</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item info">
              <div class="stat-value">{{ statistics.info }}</div>
              <div class="stat-label">信息日志</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item warning">
              <div class="stat-value">{{ statistics.warn }}</div>
              <div class="stat-label">警告日志</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item error">
              <div class="stat-value">{{ statistics.error }}</div>
              <div class="stat-label">错误日志</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.today }}</div>
              <div class="stat-label">今日日志</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.lastHour }}</div>
              <div class="stat-label">最�?小时</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 日志详情对话�?-->
    <el-dialog
      v-model="detailDialogVisible"
      title="日志详情"
      width="700px"
      append-to-body
    >
      <div class="log-detail" v-if="selectedLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录时间">
            {{ formatTime(selectedLog.monitorSysGenServerLogCreateTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="服务器时�?>
            {{ formatTime(selectedLog.monitorSysGenServerLogServerTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="日志级别">
            <el-tag
              :type="getLogLevelType(selectedLog.monitorSysGenServerLogLevel)"
              size="small"
            >
              {{ getLogLevelText(selectedLog.monitorSysGenServerLogLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="日志来源">
            <el-tag
              :type="getLogSourceType(selectedLog.monitorSysGenServerLogSource)"
              size="small"
              effect="plain"
            >
              {{ getLogSourceText(selectedLog.monitorSysGenServerLogSource) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="日志分类">
            {{ selectedLog.monitorSysGenServerLogCategory || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="线程名称">
            {{ selectedLog.monitorSysGenServerLogThread || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="服务器IP">
            {{ selectedLog.monitorSysGenServerLogIp || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="主机�?>
            {{ selectedLog.monitorSysGenServerLogHostname || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="进程ID">
            {{ selectedLog.monitorSysGenServerLogProcessId || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="记录器名�?>
            {{ selectedLog.monitorSysGenServerLogLogger || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="文件路径" :span="2">
            {{ selectedLog.monitorSysGenServerLogFilePath || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="行号">
            {{ selectedLog.monitorSysGenServerLogLineNumber || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="日志标签">
            {{ selectedLog.monitorSysGenServerLogTags || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="日志内容" :span="2">
            <div class="log-content">
              {{ selectedLog.monitorSysGenServerLogContent }}
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 异常堆栈信息 -->
        <div
          class="detail-content"
          v-if="selectedLog.monitorSysGenServerLogExceptionStack"
        >
          <el-divider content-position="left">异常堆栈信息</el-divider>
          <div class="detail-section">
            <pre class="detail-code error">{{
              selectedLog.monitorSysGenServerLogExceptionStack
            }}</pre>
          </div>
        </div>

        <!-- 额外数据 -->
        <div
          class="detail-content"
          v-if="selectedLog.monitorSysGenServerLogExtraData"
        >
          <el-divider content-position="left">额外数据</el-divider>
          <div class="detail-section">
            <pre class="detail-code">{{
              formatExtraData(selectedLog.monitorSysGenServerLogExtraData)
            }}</pre>
          </div>
        </div>
      </div>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  getServerLogPage,
  getServerLogStatistics,
  exportServerLogs,
  cleanupServerLogs,
  type ServerLog,
} from "@/api/server/log";

// Props
const props = defineProps<{
  server?: any;
}>();

// 状�?
const visible = ref(false);
const loading = ref(false);
const detailDialogVisible = ref(false);
const selectedLog = ref<ServerLog | null>(null);
const currentServerId = ref<number | null>(null);

// 过滤�?
const filters = reactive({
  dateRange: [] as Date[],
  level: "",
  source: "",
  keyword: "",
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 日志数据
const logs = ref<ServerLog[]>([]);

// 统计信息
const statistics = reactive({
  total: 0,
  info: 0,
  warn: 0,
  error: 0,
  today: 0,
  lastHour: 0,
});

// 计算属�?
const dialogTitle = computed(() => {
  if (props.server) {
    return `服务器日�?- ${props.server.name}`;
  }
  return "服务器日�?;
});

// 方法
const open = (server?: any) => {
  visible.value = true;
  if (server) {
    currentServerId.value = server.id || server.monitorSysGenServerId;
    resetFilters();
    loadLogs();
    loadStatistics();
  } else {
    currentServerId.value = null;
    loadLogs();
    loadStatistics();
  }
};

const handleClose = () => {
  visible.value = false;
  resetFilters();
  currentServerId.value = null;
};

const loadLogs = async () => {
  try {
    loading.value = true;

    // 构建查询参数
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      serverId: currentServerId.value,
      level: filters.level || undefined,
      source: filters.source || undefined,
      keyword: filters.keyword || undefined,
      startTime: filters.dateRange[0]
        ? filters.dateRange[0].toISOString()
        : undefined,
      endTime: filters.dateRange[1]
        ? filters.dateRange[1].toISOString()
        : undefined,
    };

    const result = await getServerLogPage(params);

    if (result.success && result.data) {
      logs.value = result.data.records || [];
      pagination.total = result.data.total || 0;
    } else {
      logs.value = [];
      pagination.total = 0;
      message.error(result.message || "加载日志失败");
    }
  } catch (error) {
    message.error("加载日志失败");
    console.error("加载日志失败:", error);
    logs.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const loadStatistics = async () => {
  try {
    if (!currentServerId.value) return;

    const result = await getServerLogStatistics(currentServerId.value);

    if (result.success && result.data) {
      const data = result.data;
      statistics.total = data.total || 0;
      statistics.info = data.infoCount || 0;
      statistics.warn = data.warnCount || 0;
      statistics.error = data.errorCount || 0;
      statistics.today = data.todayCount || 0;
      statistics.lastHour = data.lastHourCount || 0;
    }
  } catch (error) {
    console.error("加载统计信息失败:", error);
  }
};

const searchLogs = () => {
  pagination.page = 1;
  loadLogs();
};

const resetFilters = () => {
  filters.dateRange = [];
  filters.level = "";
  filters.source = "";
  filters.keyword = "";
  pagination.page = 1;
  if (visible.value) {
    loadLogs();
  }
};

const clearLogs = async () => {
  try {
    if (!currentServerId.value) {
      message.warning("请先选择服务�?);
      return;
    }

    await ElMessageBox.confirm(
      "确定要清理该服务器的日志吗？此操作不可恢复！",
      "清理确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const result = await cleanupServerLogs(currentServerId.value);

    if (result.success) {
      message.success("日志清理成功");
      loadLogs();
      loadStatistics();
    } else {
      message.error(result.message || "日志清理失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("日志清理失败");
      console.error("日志清理失败:", error);
    }
  }
};

const exportLogs = async () => {
  try {
    if (!currentServerId.value) {
      message.warning("请先选择服务�?);
      return;
    }

    const params = {
      serverId: currentServerId.value,
      level: filters.level || undefined,
      source: filters.source || undefined,
      startTime: filters.dateRange[0]
        ? filters.dateRange[0].toISOString()
        : undefined,
      endTime: filters.dateRange[1]
        ? filters.dateRange[1].toISOString()
        : undefined,
      format: "csv",
    };

    const result = await exportServerLogs(params);

    if (result.success && result.data) {
      // 创建下载链接
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `server_logs_${currentServerId.value}_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success("日志导出成功");
    } else {
      message.error(result.message || "日志导出失败");
    }
  } catch (error) {
    message.error("日志导出失败");
    console.error("日志导出失败:", error);
  }
};

const formatExtraData = (extraData: string) => {
  try {
    const parsed = JSON.parse(extraData);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return extraData;
  }
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  loadLogs();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadLogs();
};

const showLogDetail = (log: ServerLog) => {
  selectedLog.value = log;
  detailDialogVisible.value = true;
};

const getLogLevelType = (level: string) => {
  const typeMap = {
    DEBUG: "info",
    INFO: "primary",
    WARN: "warning",
    ERROR: "danger",
    FATAL: "danger",
  };
  return typeMap[level as keyof typeof typeMap] || "info";
};

const getLogLevelText = (level: string) => {
  const textMap = {
    DEBUG: "调试",
    INFO: "信息",
    WARN: "警告",
    ERROR: "错误",
    FATAL: "致命",
  };
  return textMap[level as keyof typeof textMap] || level;
};

const getLogSourceType = (source: string) => {
  const typeMap = {
    SYSTEM: "primary",
    APPLICATION: "success",
    SECURITY: "warning",
    ACCESS: "info",
  };
  return typeMap[source as keyof typeof typeMap] || "info";
};

const getLogSourceText = (source: string) => {
  const textMap = {
    SYSTEM: "系统",
    APPLICATION: "应用",
    SECURITY: "安全",
    ACCESS: "访问",
  };
  return textMap[source as keyof typeof textMap] || source;
};

const formatTime = (time: string | Date) => {
  if (!time) return "-";
  const date = typeof time === "string" ? new Date(time) : time;
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 生命周期
onMounted(() => {
  // 组件挂载时不自动加载，等待open调用
});

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.operation-log {
  .log-filters {
    margin-bottom: 16px;
    padding: 16px;
    background-color: var(--el-fill-color-extra-light);
    border-radius: 6px;
  }

  .log-list {
    margin-bottom: 16px;

    .log-pagination {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
  }

  .log-statistics {
    padding: 16px;
    background-color: var(--el-fill-color-extra-light);
    border-radius: 6px;

    .stat-item {
      text-align: center;
      padding: 12px;
      border-radius: 6px;
      background-color: var(--el-bg-color);

      &.info {
        border-left: 4px solid var(--el-color-primary);
      }

      &.warning {
        border-left: 4px solid var(--el-color-warning);
      }

      &.error {
        border-left: 4px solid var(--el-color-danger);
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.log-detail {
  .log-content {
    max-height: 200px;
    overflow-y: auto;
    padding: 8px;
    background-color: var(--el-fill-color-extra-light);
    border-radius: 4px;
    font-family: "Consolas", "Monaco", "Courier New", monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .detail-content {
    margin-top: 20px;

    .detail-section {
      margin-bottom: 16px;

      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .detail-code {
        background: var(--el-bg-color-overlay);
        border: 1px solid var(--el-border-color-light);
        border-radius: 4px;
        padding: 12px;
        font-family: "Consolas", "Monaco", "Courier New", monospace;
        font-size: 12px;
        line-height: 1.4;
        overflow-x: auto;
        margin: 0;
        max-height: 300px;
        overflow-y: auto;

        &.error {
          background-color: #fef0f0;
          border-color: var(--el-color-danger-light-7);
          color: var(--el-color-danger);
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-table) {
  .el-table__row {
    cursor: pointer;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
}
</style>
