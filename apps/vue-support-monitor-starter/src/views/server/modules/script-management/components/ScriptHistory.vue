<template>
  <div class="script-history">
    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-left">
        <el-select
          v-model="filterStatus"
          placeholder="执行状态"
          size="small"
          style="width: 120px"
          clearable
        >
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="运行中" value="running" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          size="small"
          style="width: 300px"
        />
      </div>
      <div class="filter-right">
        <el-button size="small" @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
        <el-button size="small" @click="handleClearHistory">
          <IconifyIconOnline icon="ri:delete-bin-line" />
          清理历史
        </el-button>
      </div>
    </div>

    <!-- 执行历史列表 -->
    <div class="history-list" v-loading="loading">
      <div
        v-for="execution in filteredExecutions"
        :key="execution.id"
        class="execution-item"
        @click="$emit('view-detail', execution)"
      >
        <!-- 执行信息头部 -->
        <div class="execution-header">
          <div class="execution-info">
            <div class="script-name">{{ execution.scriptName }}</div>
            <div class="execution-time">
              {{ formatTime(execution.startTime) }}
            </div>
          </div>
          <div class="execution-status">
            <el-tag :type="getStatusTagType(execution.status)" size="small">
              <IconifyIconOnline :icon="getStatusIcon(execution.status)" />
              {{ getStatusText(execution.status) }}
            </el-tag>
          </div>
        </div>

        <!-- 执行详情 -->
        <div class="execution-details">
          <div class="detail-row">
            <div class="detail-item">
              <IconifyIconOnline icon="ri:time-line" />
              <span>耗时: {{ formatDuration(execution.duration) }}</span>
            </div>
            <div class="detail-item">
              <IconifyIconOnline icon="ri:code-line" />
              <span>退出码: {{ execution.exitCode ?? "无" }}</span>
            </div>
            <div class="detail-item">
              <IconifyIconOnline icon="ri:user-line" />
              <span>执行人: {{ execution.executor || "系统" }}</span>
            </div>
          </div>

          <!-- 输出预览 -->
          <div v-if="execution.output" class="output-preview">
            <div class="output-label">输出预览:</div>
            <div class="output-content">
              {{ execution.output.substring(0, 200) }}
              <span v-if="execution.output.length > 200">...</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="execution-actions" @click.stop>
          <el-button
            size="small"
            type="text"
            @click="$emit('view-detail', execution)"
          >
            <IconifyIconOnline icon="ri:eye-line" />
            查看详情
          </el-button>
          <el-button
            v-if="execution.status === 'running'"
            size="small"
            type="text"
            @click="handleStopExecution(execution)"
          >
            <IconifyIconOnline icon="ri:stop-line" />
            停止
          </el-button>
          <el-button size="small" type="text" @click="handleRerun(execution)">
            <IconifyIconOnline icon="ri:restart-line" />
            重新执行
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="filteredExecutions.length === 0 && !loading"
        class="empty-state"
      >
        <IconifyIconOnline icon="ri:history-line" class="empty-icon" />
        <p class="empty-text">暂无执行历史</p>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        small
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
// import { formatTime } from '@/utils/date'

// 临时格式化时间函数
const formatTime = (date: Date) => {
  return date.toLocaleString();
};

// Props
interface Props {
  server: any;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "view-detail": [execution: any];
}>();

// 响应式数据
const loading = ref(false);
const filterStatus = ref("");
const dateRange = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const executions = ref([
  // 模拟数据
  {
    id: 1,
    scriptName: "系统信息检查",
    status: "success",
    startTime: new Date("2024-01-15 14:30:00"),
    endTime: new Date("2024-01-15 14:30:15"),
    duration: 15000,
    exitCode: 0,
    executor: "admin",
    output:
      "Linux server01 5.4.0-74-generic #83-Ubuntu SMP Sat May 8 02:35:39 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux\n              total        used        free      shared  buff/cache   available\nMem:           7.8G        2.1G        3.2G        180M        2.5G        5.3G\nSwap:          2.0G          0B        2.0G",
  },
  {
    id: 2,
    scriptName: "日志清理",
    status: "running",
    startTime: new Date("2024-01-15 14:25:00"),
    endTime: null,
    duration: null,
    exitCode: null,
    executor: "admin",
    output:
      "正在清理日志文件...\n已清理 /var/log/syslog.1\n已清理 /var/log/auth.log.1",
  },
  {
    id: 3,
    scriptName: "服务状态检查",
    status: "failed",
    startTime: new Date("2024-01-15 14:20:00"),
    endTime: new Date("2024-01-15 14:20:05"),
    duration: 5000,
    exitCode: 1,
    executor: "admin",
    output: "Error: Permission denied\nFailed to check service status",
  },
]);

// 计算属性
const filteredExecutions = computed(() => {
  let result = executions.value;

  // 按状态筛选
  if (filterStatus.value) {
    result = result.filter((exec) => exec.status === filterStatus.value);
  }

  // 按时间范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value;
    result = result.filter((exec) => {
      const execTime = new Date(exec.startTime);
      return execTime >= start && execTime <= end;
    });
  }

  return result;
});

// 初始化
onMounted(() => {
  loadExecutions();
});

// 方法
const loadExecutions = async () => {
  loading.value = true;
  try {
    // TODO: 调用API加载执行历史
    await new Promise((resolve) => setTimeout(resolve, 500));
    total.value = executions.value.length;
  } catch (error) {
    ElMessage.error("加载执行历史失败");
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => {
  loadExecutions();
};

const handleClearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清理所有执行历史吗？此操作不可恢复。",
      "清理确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    // TODO: 调用API清理历史
    executions.value = [];
    ElMessage.success("执行历史清理成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("清理执行历史失败");
    }
  }
};

const handleStopExecution = async (execution: any) => {
  try {
    // TODO: 调用API停止执行
    execution.status = "cancelled";
    ElMessage.success("脚本执行已停止");
  } catch (error) {
    ElMessage.error("停止脚本执行失败");
  }
};

const handleRerun = (execution: any) => {
  ElMessage.info("重新执行功能开发中");
};

const formatDuration = (duration: number | null) => {
  if (!duration) return "未知";

  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m${seconds}s`;
  }
};

const getStatusTagType = (status: string) => {
  const typeMap = {
    success: "success",
    failed: "danger",
    running: "warning",
    cancelled: "info",
  };
  return typeMap[status] || "default";
};

const getStatusIcon = (status: string) => {
  const iconMap = {
    success: "ri:check-line",
    failed: "ri:close-line",
    running: "ri:loader-line",
    cancelled: "ri:stop-line",
  };
  return iconMap[status] || "ri:question-line";
};

const getStatusText = (status: string) => {
  const textMap = {
    success: "成功",
    failed: "失败",
    running: "运行中",
    cancelled: "已取消",
  };
  return textMap[status] || "未知";
};
</script>

<style scoped lang="scss">
.script-history {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;

  .filter-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .filter-right {
    display: flex;
    gap: 8px;
  }
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.execution-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }

  .execution-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .execution-info {
      .script-name {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }

      .execution-time {
        font-size: 13px;
        color: #6b7280;
      }
    }
  }

  .execution-details {
    margin-bottom: 12px;

    .detail-row {
      display: flex;
      gap: 20px;
      margin-bottom: 8px;

      .detail-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #6b7280;

        .iconify {
          font-size: 14px;
        }
      }
    }

    .output-preview {
      margin-top: 8px;
      padding: 8px 12px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;

      .output-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .output-content {
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
        color: #374151;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }

  .execution-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .empty-text {
    font-size: 16px;
  }
}

.pagination {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}
</style>
