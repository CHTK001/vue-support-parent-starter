<template>
  <el-dialog
    v-model="visible"
    title="执行详情"
    width="80%"
    :before-close="handleClose"
    class="execution-detail-dialog"
  >
    <div v-if="execution" class="execution-detail">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:information-line" />
          基本信息
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <label>执行ID:</label>
            <span>{{ execution.monitorSysGenScriptExecutionId }}</span>
          </div>
          <div class="info-item">
            <label>脚本ID:</label>
            <span>{{ execution.monitorSysGenScriptId }}</span>
          </div>
          <div class="info-item">
            <label>服务器ID:</label>
            <span>{{ execution.monitorSysGenServerId }}</span>
          </div>
          <div class="info-item">
            <label>执行名称:</label>
            <span>{{
              execution.monitorSysGenScriptExecutionName || "无"
            }}</span>
          </div>
          <div class="info-item">
            <label>执行状态:</label>
            <el-tag
              :type="
                getStatusType(execution.monitorSysGenScriptExecutionStatus)
              "
            >
              {{ getStatusText(execution.monitorSysGenScriptExecutionStatus) }}
            </el-tag>
          </div>
          <div class="info-item">
            <label>触发类型:</label>
            <span>{{ execution.monitorSysGenScriptExecutionTriggerType }}</span>
          </div>
          <div class="info-item">
            <label>触发用户:</label>
            <span>{{
              execution.monitorSysGenScriptExecutionTriggerUser || "系统"
            }}</span>
          </div>
          <div class="info-item">
            <label>执行模式:</label>
            <span>{{ execution.monitorSysGenScriptExecutionMode }}</span>
          </div>
        </div>
      </div>

      <!-- 时间信息 -->
      <div class="detail-section">
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:time-line" />
          时间信息
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <label>开始时间:</label>
            <span>{{
              formatTime(execution.monitorSysGenScriptExecutionStartTime)
            }}</span>
          </div>
          <div class="info-item">
            <label>结束时间:</label>
            <span>{{
              formatTime(execution.monitorSysGenScriptExecutionEndTime)
            }}</span>
          </div>
          <div class="info-item">
            <label>执行耗时:</label>
            <span>{{
              formatDuration(execution.monitorSysGenScriptExecutionDurationMs)
            }}</span>
          </div>
          <div class="info-item">
            <label>计划时间:</label>
            <span>{{
              formatTime(execution.monitorSysGenScriptExecutionScheduledTime)
            }}</span>
          </div>
          <div class="info-item">
            <label>创建时间:</label>
            <span>{{
              formatTime(execution.monitorSysGenScriptExecutionCreateTime)
            }}</span>
          </div>
          <div class="info-item">
            <label>更新时间:</label>
            <span>{{
              formatTime(execution.monitorSysGenScriptExecutionUpdateTime)
            }}</span>
          </div>
        </div>
      </div>

      <!-- 执行结果 -->
      <div class="detail-section">
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:code-line" />
          执行结果
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <label>退出码:</label>
            <span>{{
              execution.monitorSysGenScriptExecutionExitCode ?? "无"
            }}</span>
          </div>
          <div class="info-item">
            <label>进程ID:</label>
            <span>{{
              execution.monitorSysGenScriptExecutionProcessId || "无"
            }}</span>
          </div>
          <div class="info-item">
            <label>重试次数:</label>
            <span
              >{{ execution.monitorSysGenScriptExecutionRetryCount }} /
              {{ execution.monitorSysGenScriptExecutionMaxRetry }}</span
            >
          </div>
          <div class="info-item">
            <label>超时时间:</label>
            <span
              >{{
                execution.monitorSysGenScriptExecutionTimeoutSeconds
              }}秒</span
            >
          </div>
        </div>
      </div>

      <!-- 执行参数 -->
      <div
        v-if="execution.monitorSysGenScriptExecutionParameters"
        class="detail-section"
      >
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:settings-line" />
          执行参数
        </h3>
        <div class="code-block">
          <pre>{{ execution.monitorSysGenScriptExecutionParameters }}</pre>
        </div>
      </div>

      <!-- 环境变量 -->
      <div
        v-if="execution.monitorSysGenScriptExecutionEnvironmentVars"
        class="detail-section"
      >
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:global-line" />
          环境变量
        </h3>
        <div class="code-block">
          <pre>{{ execution.monitorSysGenScriptExecutionEnvironmentVars }}</pre>
        </div>
      </div>

      <!-- 工作目录 -->
      <div
        v-if="execution.monitorSysGenScriptExecutionWorkingDirectory"
        class="detail-section"
      >
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:folder-line" />
          工作目录
        </h3>
        <div class="code-block">
          <pre>{{
            execution.monitorSysGenScriptExecutionWorkingDirectory
          }}</pre>
        </div>
      </div>

      <!-- 标准输出 -->
      <div
        v-if="execution.monitorSysGenScriptExecutionOutput"
        class="detail-section"
      >
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:terminal-line" />
          标准输出
        </h3>
        <div class="output-container">
          <div class="output-toolbar">
            <el-button size="small" @click="copyOutput">
              <IconifyIconOnline icon="ri:file-copy-line" />
              复制
            </el-button>
            <el-button size="small" @click="downloadOutput">
              <IconifyIconOnline icon="ri:download-line" />
              下载
            </el-button>
          </div>
          <div class="code-block output-block">
            <pre>{{ execution.monitorSysGenScriptExecutionOutput }}</pre>
          </div>
        </div>
      </div>

      <!-- 错误输出 -->
      <div
        v-if="execution.monitorSysGenScriptExecutionErrorOutput"
        class="detail-section"
      >
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:error-warning-line" />
          错误输出
        </h3>
        <div class="output-container">
          <div class="output-toolbar">
            <el-button size="small" @click="copyErrorOutput">
              <IconifyIconOnline icon="ri:file-copy-line" />
              复制
            </el-button>
          </div>
          <div class="code-block error-block">
            <pre>{{ execution.monitorSysGenScriptExecutionErrorOutput }}</pre>
          </div>
        </div>
      </div>

      <!-- 元数据 -->
      <div
        v-if="execution.monitorSysGenScriptExecutionMetadata"
        class="detail-section"
      >
        <h3 class="section-title">
          <IconifyIconOnline icon="ri:database-line" />
          元数据
        </h3>
        <div class="code-block">
          <pre>{{
            formatMetadata(execution.monitorSysGenScriptExecutionMetadata)
          }}</pre>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="execution?.monitorSysGenScriptExecutionStatus === 'RUNNING'"
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
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import type { ScriptExecution } from "@/api/server/script";

// Props
interface Props {
  modelValue: boolean;
  execution: ScriptExecution | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  execution: null,
});

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  stop: [execution: ScriptExecution];
  rerun: [execution: ScriptExecution];
}>();

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// 方法
const handleClose = () => {
  visible.value = false;
};

const handleStop = () => {
  if (props.execution) {
    emit("stop", props.execution);
  }
};

const handleRerun = () => {
  if (props.execution) {
    emit("rerun", props.execution);
  }
};

const copyOutput = async () => {
  if (props.execution?.monitorSysGenScriptExecutionOutput) {
    try {
      await navigator.clipboard.writeText(
        props.execution.monitorSysGenScriptExecutionOutput
      );
      ElMessage.success("输出已复制到剪贴板");
    } catch (error) {
      ElMessage.error("复制失败");
    }
  }
};

const copyErrorOutput = async () => {
  if (props.execution?.monitorSysGenScriptExecutionErrorOutput) {
    try {
      await navigator.clipboard.writeText(
        props.execution.monitorSysGenScriptExecutionErrorOutput
      );
      ElMessage.success("错误输出已复制到剪贴板");
    } catch (error) {
      ElMessage.error("复制失败");
    }
  }
};

const downloadOutput = () => {
  if (props.execution?.monitorSysGenScriptExecutionOutput) {
    const blob = new Blob(
      [props.execution.monitorSysGenScriptExecutionOutput],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `execution_${props.execution.monitorSysGenScriptExecutionId}_output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

const formatTime = (dateStr: string | undefined) => {
  if (!dateStr) return "无";
  return new Date(dateStr).toLocaleString();
};

const formatDuration = (duration: number | undefined) => {
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

const formatMetadata = (metadata: string) => {
  try {
    return JSON.stringify(JSON.parse(metadata), null, 2);
  } catch {
    return metadata;
  }
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    SUCCESS: "success",
    FAILED: "danger",
    RUNNING: "warning",
    CANCELLED: "info",
  };
  return typeMap[status] || "default";
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    SUCCESS: "成功",
    FAILED: "失败",
    RUNNING: "运行中",
    CANCELLED: "已取消",
  };
  return textMap[status] || "未知";
};
</script>

<style scoped lang="scss">
.execution-detail-dialog {
  .execution-detail {
    max-height: 70vh;
    overflow-y: auto;
  }

  .detail-section {
    margin-bottom: 24px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a202c;

      .iconify {
        color: #667eea;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 12px;

        label {
          min-width: 80px;
          font-weight: 500;
          color: #4a5568;
        }

        span {
          color: #2d3748;
          word-break: break-all;
        }
      }
    }

    .code-block {
      background: #1a202c;
      color: #e2e8f0;
      padding: 16px;
      border-radius: 8px;
      font-family: "Consolas", "Monaco", "Courier New", monospace;
      font-size: 13px;
      line-height: 1.5;
      overflow-x: auto;

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }

    .output-container {
      .output-toolbar {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        justify-content: flex-end;
      }

      .output-block {
        max-height: 300px;
        overflow-y: auto;
      }

      .error-block {
        background: #2d1b1b;
        color: #fed7d7;
        border: 1px solid #e53e3e;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .execution-detail-dialog {
    .detail-section {
      padding: 16px;

      .info-grid {
        grid-template-columns: 1fr;
        gap: 12px;

        .info-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;

          label {
            min-width: auto;
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>
