<template>
  <el-dialog
    v-model="visible"
    title="执行详情"
    width="80%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="executionData" class="execution-detail">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h4>基本信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="执行ID">
            {{ executionData.id }}
          </el-descriptions-item>
          <el-descriptions-item label="脚本名称">
            {{ executionData.scriptName }}
          </el-descriptions-item>
          <el-descriptions-item label="执行状态">
            <StatusTag :status="executionData.status" />
          </el-descriptions-item>
          <el-descriptions-item label="退出码">
            <span :class="getExitCodeClass(executionData.exitCode)">
              {{ executionData.exitCode ?? "无" }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatTime(executionData.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{ formatTime(executionData.endTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行耗时">
            {{ formatDuration(executionData.duration) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行人">
            {{ executionData.executor || "系统" }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 输出信息 -->
      <div class="detail-section">
        <h4>输出信息</h4>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="标准输出" name="stdout">
            <OutputPanel
              title="标准输出"
              :content="executionData.stdout"
              empty-text="暂无标准输出"
              icon="ri:terminal-line"
              :max-height="'240px'"
            />
          </el-tab-pane>

          <el-tab-pane label="错误输出" name="stderr">
            <OutputPanel
              title="错误输出"
              :content="executionData.stderr"
              empty-text="暂无错误输出"
              icon="ri:alarm-warning-line"
              :error="true"
              :max-height="'240px'"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="executionData?.status === 'running'"
          type="danger"
          @click="handleStop"
        >
          停止执行
        </el-button>
        <el-button type="primary" @click="handleRerun"> 重新执行 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
import {
  getScriptExecutionDetail,
  getScriptExecutionOutput,
  stopScriptExecution,
} from "@/api/server/script";
import StatusTag from "./StatusTag.vue";
import OutputPanel from "./OutputPanel.vue";

// Props
interface Props {
  modelValue: boolean;
  executionData?: any;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

// 响应式数据
const visible = ref(false);
const activeTab = ref("stdout");

// 监听器
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  }
);
// 轮询刷新运行中执行详情（简单轮询）
let pollTimer: any = null;
watch(
  () => props.modelValue,
  async (val) => {
    if (val && props.executionData?.status === "running") {
      startPolling();
    } else {
      stopPolling();
    }
  }
);

onUnmounted(() => stopPolling());

function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    try {
      const id = props.executionData?.id;
      if (!id) return;
      // 拉取详情
      const detail = await getScriptExecutionDetail(id);
      // 拉取输出
      const output = await getScriptExecutionOutput(id);
      if (detail.success && detail.data) {
        // 合并进当前数据对象（保持字段名对齐）
        props.executionData.status = (
          detail.data.monitorSysGenScriptExecutionStatus || ""
        )
          .toString()
          .toLowerCase();
        props.executionData.exitCode =
          detail.data.monitorSysGenScriptExecutionExitCode ??
          props.executionData.exitCode;
        props.executionData.endTime =
          detail.data.monitorSysGenScriptExecutionEndTime ||
          props.executionData.endTime;
        props.executionData.duration =
          detail.data.monitorSysGenScriptExecutionDuration ??
          props.executionData.duration;
      }
      if (output.success && output.data) {
        props.executionData.stdout =
          output.data.output ?? props.executionData.stdout;
        props.executionData.stderr =
          output.data.errorOutput ?? props.executionData.stderr;
      }
      // 若已结束则停止轮询
      if (props.executionData.status !== "running") {
        stopPolling();
      }
    } catch (e) {
      // 忽略轮询异常
    }
  }, 3000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

watch(visible, (val) => {
  emit("update:modelValue", val);
});

// 方法
const handleClose = () => {
  visible.value = false;
};

const handleStop = async () => {
  try {
    if (!props.executionData?.id) return;
    const resp = await stopScriptExecution(props.executionData.id);
    if (resp.success) {
      message("停止指令已发送", { type: "success" });
    } else {
      message(resp.msg || "停止执行失败", { type: "error" });
    }
  } catch (e) {
    message("停止执行失败", { type: "error" });
  }
};

const handleRerun = () => {
  message("重新执行功能开发中", { type: "info" });
};

const copyOutput = async (type: "stdout" | "stderr") => {
  const content = props.executionData?.[type];
  if (!content) {
    message("暂无内容可复制", { type: "warning" });
    return;
  }

  try {
    await navigator.clipboard.writeText(content);
    message("内容已复制到剪贴板", { type: "success" });
  } catch (error) {
    message("复制失败", { type: "error" });
  }
};

const downloadOutput = (type: "stdout" | "stderr") => {
  const content = props.executionData?.[type];
  if (!content) {
    message("暂无内容可下载", { type: "warning" });
    return;
  }

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${props.executionData.scriptName}_${type}_${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);

  message("下载成功", { type: "success" });
};

// 工具函数
const formatTime = (date: Date | null) => {
  return date ? date.toLocaleString() : "无";
};

const formatDuration = (duration: number | null) => {
  if (!duration) return "无";

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
    success: "执行成功",
    failed: "执行失败",
    running: "执行中",
    cancelled: "已取消",
  };
  return textMap[status] || "未知状态";
};

const getExitCodeClass = (exitCode: number | null) => {
  if (exitCode === null || exitCode === undefined) return "";
  return exitCode === 0 ? "exit-code-success" : "exit-code-error";
};
</script>

<style scoped lang="scss">
// 样式与之前的设计保持一致
.execution-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 16px 0;
    color: #111827;
    font-size: 16px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 8px;
  }
}

.exit-code-success {
  color: #059669;
  font-weight: 600;
}

.exit-code-error {
  color: #dc2626;
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 其他样式省略
</style>
