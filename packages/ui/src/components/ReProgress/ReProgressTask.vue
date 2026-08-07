<script setup lang="ts">
/**
 * ReProgressTask —— 单任务卡片（展开模式）
 *
 * 包含进度条 + 状态标题 + 概要信息（速率、剩余时间、已加载等）
 * 支持折叠 / 展开切换
 */
import { computed, ref } from "vue";
import "../../shared/modern-vars.css";
import ReProgress from "./ReProgress.vue";
import type { ReProgressTask, ReProgressStatus } from "./types";

defineOptions({ name: "ReProgressTask", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    task: ReProgressTask;
    /** 默认折叠 */
    collapsed?: boolean;
  }>(),
  {
    collapsed: false,
  },
);

const emit = defineEmits<{
  (e: "remove", id: string): void;
  (e: "retry", id: string): void;
}>();

const folded = ref<boolean>(props.collapsed);

const statusText = computed(() => {
  switch (props.task.status) {
    case "pending":
      return "等待中";
    case "running":
      return props.task.text ?? "进行中";
    case "success":
      return "已完成";
    case "failed":
      return props.task.error ?? "失败";
    case "cancelled":
      return "已取消";
    default:
      return "";
  }
});

const statusIcon = computed(() => {
  switch (props.task.status) {
    case "pending":
      return "○";
    case "running":
      return "◐";
    case "success":
      return "✓";
    case "failed":
      return "✕";
    case "cancelled":
      return "–";
    default:
      return "•";
  }
});

const statusColor = computed(() => {
  switch (props.task.status) {
    case "success":
      return "success";
    case "failed":
      return "danger";
    case "cancelled":
      return "info";
    case "pending":
      return "info";
    case "running":
      return props.task.color ?? "primary";
    default:
      return "primary";
  }
});

/** 已用时间 */
const elapsed = computed(() => {
  const start = props.task.startedAt ?? props.task.createdAt;
  const end = props.task.finishedAt ?? Date.now();
  const s = Math.floor((end - start) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs}s`;
});

/** 预计剩余时间 */
const remaining = computed(() => {
  if (props.task.status !== "running") return "";
  if (props.task.progress <= 0) return "";
  const elapsed = Date.now() - (props.task.startedAt ?? props.task.createdAt);
  const total = elapsed / props.task.progress;
  const left = total - elapsed;
  if (left <= 0) return "";
  const s = Math.floor(left / 1000);
  if (s < 60) return `还剩 ${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `还剩 ${m}m ${rs}s`;
});

/** 加载速度（模拟：MB/s） */
const speed = computed(() => {
  if (props.task.status !== "running") return "";
  return "1.2 MB/s";
});

const isFinished = computed<boolean>(
  () => props.task.status === "success" || props.task.status === "failed" || props.task.status === "cancelled",
);

function onToggle(): void {
  folded.value = !folded.value;
}

function onRemove(): void {
  emit("remove", props.task.id);
}

function onRetry(): void {
  emit("retry", props.task.id);
}
</script>

<template>
  <div
    :class="[
      're-progress-task',
      `re-progress-task--status-${task.status}`,
      { 're-progress-task--folded': folded },
    ]"
    v-bind="$attrs"
  >
    <div class="re-progress-task__head" @click="onToggle">
      <span :class="['re-progress-task__icon', `re-progress-task__icon--${statusColor}`]">
        {{ statusIcon }}
      </span>
      <div class="re-progress-task__main">
        <div class="re-progress-task__title-row">
          <span class="re-progress-task__title">{{ task.title }}</span>
          <span class="re-progress-task__percent">{{ Math.round(task.progress * 100) }}%</span>
        </div>
        <ReProgress
          :progress="task.progress"
          :color="statusColor as any"
          :status="task.status as ReProgressStatus"
          :stripe="task.status === 'running'"
          :height="4"
        />
        <div v-if="!folded" class="re-progress-task__summary">
          <span class="re-progress-task__status">{{ statusText }}</span>
          <span v-if="task.history.length > 1" class="re-progress-task__elapsed">· {{ elapsed }}</span>
          <span v-if="remaining" class="re-progress-task__remaining">{{ remaining }}</span>
          <span v-if="speed && task.status === 'running'" class="re-progress-task__speed">{{ speed }}</span>
        </div>
      </div>
      <div class="re-progress-task__actions" @click.stop>
        <button
          v-if="task.status === 'failed' && task.closable !== false"
          class="re-progress-task__btn"
          type="button"
          title="重试"
          @click="onRetry"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <button
          v-if="task.closable !== false && isFinished"
          class="re-progress-task__btn re-progress-task__btn--close"
          type="button"
          title="关闭"
          @click="onRemove"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-progress-task {
  position: relative;
  padding: 10px 12px;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius-lg);
  background: color-mix(in srgb, var(--rm-bg) 92%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    border-color var(--rm-transition),
    box-shadow var(--rm-transition),
    background var(--rm-transition);
}
.re-progress-task:hover {
  border-color: color-mix(in srgb, var(--rm-primary) 25%, var(--rm-border));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 4px 12px color-mix(in srgb, var(--rm-primary) 8%, transparent);
}

.re-progress-task--status-success { border-color: color-mix(in srgb, var(--rm-success) 35%, var(--rm-border)); }
.re-progress-task--status-failed { border-color: color-mix(in srgb, var(--rm-danger) 35%, var(--rm-border)); }
.re-progress-task--status-cancelled { opacity: 0.7; }

.re-progress-task__head {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.re-progress-task__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: var(--rm-text-white);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}
.re-progress-task__icon--primary { background: linear-gradient(135deg, var(--rm-primary) 0%, var(--rm-primary-hover) 100%); }
.re-progress-task__icon--success { background: linear-gradient(135deg, var(--rm-success) 0%, color-mix(in srgb, var(--rm-success) 75%, #ffffff) 100%); }
.re-progress-task__icon--warning { background: linear-gradient(135deg, var(--rm-warning) 0%, color-mix(in srgb, var(--rm-warning) 75%, #ffffff) 100%); }
.re-progress-task__icon--danger { background: linear-gradient(135deg, var(--rm-danger) 0%, color-mix(in srgb, var(--rm-danger) 75%, #ffffff) 100%); }
.re-progress-task__icon--info { background: linear-gradient(135deg, var(--rm-info) 0%, color-mix(in srgb, var(--rm-info) 75%, #ffffff) 100%); }

.re-progress-task__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.re-progress-task__title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.re-progress-task__title {
  font-size: var(--rm-font-md);
  font-weight: 600;
  color: var(--rm-text);
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-progress-task__percent {
  font-size: var(--rm-font-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rm-text-secondary);
  flex-shrink: 0;
}

.re-progress-task__summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--rm-font-xs);
  color: var(--rm-text-secondary);
  flex-wrap: wrap;
  padding-top: 2px;
  letter-spacing: 0.01em;
}

.re-progress-task__status { font-weight: 500; }
.re-progress-task__elapsed,
.re-progress-task__remaining,
.re-progress-task__speed {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  background: var(--rm-bg-subtle);
  border-radius: var(--rm-radius-xs);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.re-progress-task__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.re-progress-task__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: var(--rm-radius-sm);
  color: var(--rm-text-secondary);
  cursor: pointer;
  transition: background var(--rm-transition), color var(--rm-transition);
}
.re-progress-task__btn:hover {
  background: var(--rm-bg-hover);
  color: var(--rm-primary);
}
.re-progress-task__btn--close:hover { color: var(--rm-danger); }
.re-progress-task__btn svg { width: 13px; height: 13px; }

@media (prefers-reduced-motion: reduce) {
  .re-progress-task,
  .re-progress-task__btn {
    transition: none;
  }
}
</style>