<template>
  <div class="script-history">
    <!-- 筛选工具栏 -->
    <Toolbar>
      <template #left>
        <el-select
          v-model="filterStatus"
          placeholder="执行状�?
          size="small"
          style="width: 120px"
          clearable
        >
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="运行�? value="running" />
          <el-option label="已取�? value="cancelled" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="�?
          start-placeholder="开始时�?
          end-placeholder="结束时间"
          size="small"
          style="width: 300px"
        />
      </template>
      <template #right>
        <el-button size="small" @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
        <el-button size="small" @click="handleClearHistory">
          <IconifyIconOnline icon="ri:delete-bin-line" />
          清理历史
        </el-button>
      </template>
    </Toolbar>

    <!-- 执行历史列表 -->
    <div class="history-list" v-loading="loading">
      <ExecutionCard
        v-for="execution in filteredExecutions"
        :key="execution.monitorSysGenScriptExecutionId"
        @click="handleViewDetail(execution)"
      >
        <template #name>
          {{
            execution.monitorSysGenScriptExecutionName ||
            `执行记录 #${execution.monitorSysGenScriptExecutionId}`
          }}
        </template>
        <template #time>
          {{
            formatTime(
              execution.monitorSysGenScriptExecutionStartTime ||
                execution.monitorSysGenScriptExecutionCreateTime
            )
          }}
        </template>
        <template #status>
          <StatusTag
            :status="
              (execution.monitorSysGenScriptExecutionStatus || '')
                .toString()
                .toLowerCase()
            "
          />
        </template>
        <template #duration>
          耗时:
          {{ formatDuration(execution.monitorSysGenScriptExecutionDuration) }}
        </template>
        <template #exitCode>
          退出码: {{ execution.monitorSysGenScriptExecutionExitCode ?? "�? }}
        </template>
        <template #user>
          执行�?
          {{ execution.monitorSysGenScriptExecutionTriggerUser || "系统" }}
        </template>
        <template v-if="execution.monitorSysGenScriptExecutionOutput" #preview>
          {{ execution.monitorSysGenScriptExecutionOutput.substring(0, 200) }}
          <span v-if="execution.monitorSysGenScriptExecutionOutput.length > 200"
            >...</span
          >
        </template>

        <template #actions>
          <el-button
            size="small"
            type="text"
            @click="$emit('view-detail', execution)"
          >
            <IconifyIconOnline icon="ri:eye-line" /> 查看详情
          </el-button>
          <el-button
            v-if="execution.monitorSysGenScriptExecutionStatus === 'RUNNING'"
            size="small"
            type="text"
            @click="handleStopExecution(execution)"
          >
            <IconifyIconOnline icon="ri:stop-line" /> 停止
          </el-button>
          <el-button size="small" type="text" @click="handleRerun(execution)">
            <IconifyIconOnline icon="ri:restart-line" /> 重新执行
          </el-button>
        </template>
      </ExecutionCard>

      <!-- 空状�?-->
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
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <!-- 执行详情对话�?-->
    <ScriptExecutionDetail
      v-model="showDetailDialog"
      :executionData="selectedExecution"
      @stop="handleStopExecution"
      @rerun="handleRerun"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import Toolbar from "./Toolbar.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import {
  getScriptExecutionPageList,
  cleanExpiredExecutions,
  batchDeleteExecutions,
  type ScriptExecution,
  type ScriptExecutionPageParams,
} from "@/api/server/script";
import ScriptExecutionDetail from "./ExecutionDetailDialog.vue";
import StatusTag from "./StatusTag.vue";
import ExecutionCard from "./ExecutionCard.vue";

/**
 * 组件：执行历�?
 * 职责：提供执行历史的筛选（状�?时间）、分页展示、查看详情、清理过期记录等能力�?
 * 注意�?
 *  - 与后端时间格式对齐（YYYY-MM-DDTHH:mm:ss�?
 *  - 执行状态统一转为小写进行比较与展�?
 */

/**
 * Emits
 * @event view-detail 查看执行详情
 */
// Emits
const emit = defineEmits<{
  "view-detail": [execution: any];
}>();

// 响应式数�?
const loading = ref(false);
const filterStatus = ref("");
const dateRange = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const executions = ref<ScriptExecution[]>([]);
const selectedExecutions = ref<number[]>([]);

// 执行详情对话�?
const showDetailDialog = ref(false);
const selectedExecution = ref<ScriptExecution | null>(null);

// 计算属�?
const filteredExecutions = computed(() => {
  let result = executions.value;

  // 按状态筛�?
  if (filterStatus.value) {
    result = result.filter(
      (exec) =>
        (exec.monitorSysGenScriptExecutionStatus || "")
          .toString()
          .toLowerCase() === filterStatus.value
    );
  }

  // 按时间范围筛�?
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value;
    result = result.filter((exec) => {
      const execTime = new Date(
        exec.monitorSysGenScriptExecutionStartTime ||
          exec.monitorSysGenScriptExecutionCreateTime
      );
      return execTime >= start && execTime <= end;
    });
  }

  return result;
});

// 监听筛选条件变�?
watch([filterStatus, dateRange], () => {
  currentPage.value = 1; // 重置到第一�?
  loadExecutions();
});

// 初始�?
onMounted(() => {
  loadExecutions();
});

// 方法
const loadExecutions = async () => {
  try {
    loading.value = true;

    const params: ScriptExecutionPageParams = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };

    // 添加状态筛�?
    if (filterStatus.value) {
      params.monitorSysGenScriptExecutionStatus = filterStatus.value;
    }

    // 添加时间范围筛�?
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dayjs(dateRange.value[0]).format(
        "YYYY-MM-DDTHH:mm:ss"
      );
      params.endTime = dayjs(dateRange.value[1]).format("YYYY-MM-DDTHH:mm:ss");
    }

    const response = await getScriptExecutionPageList(params);

    if (response.success && response.data) {
      executions.value = response.data.records;
      total.value = response.data.total;
    } else {
      ElMessage.error("获取执行历史失败");
    }
  } catch (error) {
    console.error("加载执行历史失败:", error);
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
      "确定要清理过期的执行历史吗？将清�?0天前的记录�?,
      "清理确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const response = await cleanExpiredExecutions(30);
    if (response.success) {
      ElMessage.success(`清理�?${response.data} 条过期记录`);
      loadExecutions(); // 重新加载数据
    } else {
      ElMessage.error("清理执行历史失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("清理执行历史失败");
    }
  }
};

const handleStopExecution = async (execution: any) => {
  try {
    execution.status = "cancelled";
    ElMessage.success("脚本执行已停�?);
  } catch (error) {
    ElMessage.error("停止脚本执行失败");
  }
};

const handleRerun = (execution: ScriptExecution) => {
  ElMessage.info("重新执行功能开发中");
};

// 查看详情
const handleViewDetail = (execution: ScriptExecution) => {
  selectedExecution.value = execution;
  showDetailDialog.value = true;
};

// 分页处理
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadExecutions();
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadExecutions();
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
    running: "运行�?,
    cancelled: "已取�?,
  };
  return textMap[status] || "未知";
};

// 格式化时间函�?
const formatTime = (dateStr: string | Date) => {
  if (!dateStr) return "未知";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleString();
};
</script>

<style scoped lang="scss">
.script-history {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  background: transparent;
}

/* 顶部筛选工具条 */
.filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.7);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.85),
    rgba(255, 255, 255, 0.75)
  );
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);

  .filter-left,
  .filter-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  :deep(.el-button) {
    border-radius: 10px;
    font-weight: 500;
  }
}

/* 列表区域 */
.history-list {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

/* 单条执行记录卡片 */
.execution-item {
  position: relative;
  border-radius: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  cursor: pointer;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.25),
      rgba(118, 75, 162, 0.25)
    );
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);

    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
  }
}

/* 头部信息 */
.execution-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;

  .script-name {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
  }

  .execution-time {
    font-size: 12px;
    color: #64748b;
    background: rgba(100, 116, 139, 0.08);
    padding: 2px 8px;
    border-radius: 999px;
    white-space: nowrap;
  }

  :deep(.el-tag) {
    border-radius: 10px;
    border: none;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

/* 详情区域 */
.execution-details {
  margin-top: 12px;

  .detail-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px 12px;
  }

  .detail-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #334155;
    background: rgba(99, 102, 241, 0.06);
    padding: 8px 10px;
    border-radius: 10px;

    .icon {
      color: #6366f1;
    }
  }

  .output-preview {
    margin-top: 12px;

    .output-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 6px;
    }

    .output-content {
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", monospace;
      white-space: pre-wrap;
      background: #0b1220;
      color: #cbd5e1;
      border-radius: 12px;
      padding: 10px 12px;
      max-height: 120px;
      overflow: auto;
      box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.15);
    }
  }
}

/* 操作区域 */
.execution-actions {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  :deep(.el-button.is-text) {
    color: #475569;
    &:hover {
      color: #6366f1;
    }
  }
}

/* 分页 */
.pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;

  :deep(.el-pagination) {
    padding: 6px 10px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  }
}

/* 空状�?*/
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 32px 16px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9),
    rgba(255, 255, 255, 0.75)
  );
  border: 1px dashed rgba(99, 102, 241, 0.25);
  border-radius: 16px;
  color: #64748b;

  .empty-icon {
    font-size: 28px;
    color: #6366f1;
    margin-bottom: 6px;
  }

  .empty-text {
    margin: 4px 0 0;
    font-weight: 600;
  }
}
</style>
