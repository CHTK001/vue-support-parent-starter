<template>
  <el-dialog
    :model-value="visible"
    width="720px"
    destroy-on-close
    :title="title"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="task">
      <div class="task-dialog__header">
        <div>
          <strong>{{ task.taskId }}</strong>
          <p>{{ task.message || "任务已创建，等待继续执行" }}</p>
        </div>
        <div class="task-dialog__actions">
          <el-tag effect="light" :type="task.status === 'FAILED' ? 'danger' : 'info'">
            {{ task.status }}
          </el-tag>
          <el-button
            v-if="task.retryable"
            size="small"
            type="warning"
            plain
            @click="emit('retry')"
          >
            {{ task.retryLabel || "重试" }}
          </el-button>
          <el-button size="small" :loading="loading" @click="emit('refresh')">刷新</el-button>
        </div>
      </div>

      <el-alert
        v-if="task.errorSummary"
        class="task-dialog__error"
        type="error"
        :closable="false"
        :title="task.errorSummary"
      />

      <div class="task-dialog__summary">
        <span>镜像：{{ task.imageName || "-" }}:{{ task.imageTag || "latest" }}</span>
        <span>服务器：{{ task.serverIds?.join(", ") || "-" }}</span>
        <span>创建时间：{{ formatTime(task.createdAt) }}</span>
        <span>更新时间：{{ formatTime(task.updatedAt) }}</span>
      </div>

      <div v-if="task.summaryItems?.length" class="task-dialog__detail-grid">
        <article
          v-for="item in task.summaryItems"
          :key="`${task.taskId}-${item.label}`"
          class="task-dialog__detail-card"
        >
          <small>{{ item.label }}</small>
          <strong>{{ item.value || "-" }}</strong>
        </article>
      </div>

      <el-steps direction="vertical" :active="activeTaskStep" finish-status="success">
        <el-step
          v-for="step in task.steps"
          :key="step.stepKey"
          :title="step.title"
          :description="`${step.message} · ${formatTime(step.updatedAt)}`"
          :status="resolveStepStatus(step.status)"
        />
      </el-steps>

      <section v-if="displayLogs.length" class="task-dialog__logs">
        <header>
          <strong>任务日志</strong>
          <el-button size="small" text @click="copyLogs">复制日志</el-button>
        </header>
        <pre>{{ displayLogs.join("\n") }}</pre>
      </section>
    </template>
    <el-empty v-else description="暂无任务详情" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { message } from "@repo/utils";
import type { TaskDialogModel } from "./types";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    loading?: boolean;
    task: TaskDialogModel | null;
  }>(),
  {
    title: "任务详情",
    loading: false,
  },
);

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "refresh"): void;
  (e: "retry"): void;
}>();

const activeTaskStep = computed(() => {
  if (!props.task?.steps?.length) {
    return 0;
  }
  const current = props.task.steps.findIndex((item) => item.status === "RUNNING");
  if (current >= 0) {
    return current;
  }
  return props.task.steps.filter((item) => item.status === "SUCCESS").length;
});

const resolveStepStatus = (status: string) => {
  if (status === "SUCCESS") {
    return "success";
  }
  if (status === "FAILED") {
    return "error";
  }
  if (status === "RUNNING") {
    return "process";
  }
  return "wait";
};

const formatTime = (value?: number) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
};

const displayLogs = computed(() => {
  const logs = props.task?.logs || [];
  if (!logs.length) {
    return [];
  }
  const normalized = logs
    .map(item => String(item || "").trim())
    .filter(Boolean);
  if (normalized.length <= 300) {
    return normalized;
  }
  return normalized.slice(-300);
});

const copyLogs = async () => {
  if (!displayLogs.value.length) {
    message("暂无可复制日志", { type: "warning" });
    return;
  }
  const text = displayLogs.value.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    message("日志已复制", { type: "success" });
  } catch {
    message("复制失败，请手动复制", { type: "error" });
  }
};
</script>

<style scoped lang="scss">
.task-dialog__header,
.task-dialog__actions,
.task-dialog__summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.task-dialog__header {
  margin-bottom: 14px;
}

.task-dialog__error {
  margin-bottom: 12px;
}

.task-dialog__header p,
.task-dialog__summary span {
  margin: 0;
  color: #64748b;
}

.task-dialog__header strong {
  color: #0f172a;
}

.task-dialog__summary {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.task-dialog__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.task-dialog__detail-card {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.task-dialog__detail-card small {
  display: block;
  color: #64748b;
}

.task-dialog__detail-card strong {
  color: #0f172a;
  word-break: break-word;
}

.task-dialog__logs {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed rgba(148, 163, 184, 0.25);
}

.task-dialog__logs header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.task-dialog__logs strong {
  color: #0f172a;
}

.task-dialog__logs pre {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, #020617, #111827);
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 720px) {
  .task-dialog__detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
