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
        :key="execution.monitorSysGenScriptExecutionId"
        class="execution-item"
        @click="handleViewDetail(execution)"
      >
        <!-- 执行信息头部 -->
        <div class="execution-header">
          <div class="execution-info">
            <div class="script-name">
              {{
                execution.monitorSysGenScriptExecutionName ||
                `执行记录 #${execution.monitorSysGenScriptExecutionId}`
              }}
            </div>
            <div class="execution-time">
              {{
                formatTime(
                  execution.monitorSysGenScriptExecutionStartTime ||
                    execution.monitorSysGenScriptExecutionCreateTime
                )
              }}
            </div>
          </div>
          <div class="execution-status">
            <el-tag
              :type="
                getStatusTagType(execution.monitorSysGenScriptExecutionStatus)
              "
              size="small"
            >
              <IconifyIconOnline
                :icon="
                  getStatusIcon(execution.monitorSysGenScriptExecutionStatus)
                "
              />
              {{ getStatusText(execution.monitorSysGenScriptExecutionStatus) }}
            </el-tag>
          </div>
        </div>

        <!-- 执行详情 -->
        <div class="execution-details">
          <div class="detail-row">
            <div class="detail-item">
              <IconifyIconOnline icon="ri:time-line" />
              <span
                >耗时:
                {{
                  formatDuration(
                    execution.monitorSysGenScriptExecutionDurationMs
                  )
                }}</span
              >
            </div>
            <div class="detail-item">
              <IconifyIconOnline icon="ri:code-line" />
              <span
                >退出码:
                {{
                  execution.monitorSysGenScriptExecutionExitCode ?? "无"
                }}</span
              >
            </div>
            <div class="detail-item">
              <IconifyIconOnline icon="ri:user-line" />
              <span
                >执行人:
                {{
                  execution.monitorSysGenScriptExecutionTriggerUser || "系统"
                }}</span
              >
            </div>
          </div>

          <!-- 输出预览 -->
          <div
            v-if="execution.monitorSysGenScriptExecutionOutput"
            class="output-preview"
          >
            <div class="output-label">输出预览:</div>
            <div class="output-content">
              {{
                execution.monitorSysGenScriptExecutionOutput.substring(0, 200)
              }}
              <span
                v-if="execution.monitorSysGenScriptExecutionOutput.length > 200"
                >...</span
              >
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
            v-if="execution.monitorSysGenScriptExecutionStatus === 'RUNNING'"
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
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <!-- 执行详情对话框 -->
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
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getScriptExecutionPageList,
  cleanExpiredExecutions,
  batchDeleteExecutions,
  type ScriptExecution,
  type ScriptExecutionPageParams,
} from "@/api/server/script";
import ScriptExecutionDetail from "./ExecutionDetailDialog.vue";

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

const executions = ref<ScriptExecution[]>([]);
const selectedExecutions = ref<number[]>([]);

// 执行详情对话框
const showDetailDialog = ref(false);
const selectedExecution = ref<ScriptExecution | null>(null);

// 计算属性
const filteredExecutions = computed(() => {
  let result = executions.value;

  // 按状态筛选
  if (filterStatus.value) {
    result = result.filter(
      (exec) => exec.monitorSysGenScriptExecutionStatus === filterStatus.value
    );
  }

  // 按时间范围筛选
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

// 监听筛选条件变化
watch([filterStatus, dateRange], () => {
  currentPage.value = 1; // 重置到第一页
  loadExecutions();
});

// 初始化
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

    // 添加状态筛选
    if (filterStatus.value) {
      params.monitorSysGenScriptExecutionStatus = filterStatus.value;
    }

    // 添加时间范围筛选
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0].toISOString();
      params.endTime = dateRange.value[1].toISOString();
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
      "确定要清理过期的执行历史吗？将清理30天前的记录。",
      "清理确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const response = await cleanExpiredExecutions(30);
    if (response.success) {
      ElMessage.success(`清理了 ${response.data} 条过期记录`);
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
    ElMessage.success("脚本执行已停止");
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
    running: "运行中",
    cancelled: "已取消",
  };
  return textMap[status] || "未知";
};

// 格式化时间函数
const formatTime = (dateStr: string | Date) => {
  if (!dateStr) return "未知";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleString();
};
</script>

<style scoped lang="scss">
// 样式与之前的设计保持一致
.script-history {
  height: 100%;
  display: flex;
  flex-direction: column;
}

// 其他样式省略
</style>
