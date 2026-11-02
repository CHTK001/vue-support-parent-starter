<script setup lang="ts">
/**
 * ReProgressTimeline —— 历史任务行（带 popover 时间轴）
 *
 * - 鼠标悬停整行 → popover 显示详细信息时间轴
 * - 点击整行 → 同样切换 popover
 */
import { ref } from "vue";
import "../shared/modern-vars.css";
import ReProgress from "./ReProgress.vue";
import type { ReProgressTask, ReProgressSnapshot } from "./types";

defineOptions({ name: "ReProgressTimeline", inheritAttrs: true });

const props = defineProps<{
  task: ReProgressTask;
}>();

const emit = defineEmits<{
  (e: "remove", id: string): void;
  (e: "retry", id: string): void;
}>();

const popoverVisible = ref(false);

function onHoverShow(): void {
  popoverVisible.value = true;
}
function onHoverHide(): void {
  popoverVisible.value = false;
}
function onClickRow(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  if (target.closest(".re-progress-timeline__btn")) return;
  popoverVisible.value = !popoverVisible.value;
}

function onRemove(): void {
  emit("remove", props.task.id);
}
function onRetry(): void {
  emit("retry", props.task.id);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function snapLabel(snap: ReProgressSnapshot): string {
  const t = new Date(snap.time).toLocaleTimeString();
  const p = Math.round(snap.progress * 100);
  return `${t} · ${p}%`;
}

const statusText = (s: ReProgressSnapshot["status"]): string => {
  switch (s) {
    case "pending":
      return "等待";
    case "running":
      return "进行";
    case "success":
      return "完成";
    case "failed":
      return "失败";
    case "cancelled":
      return "取消";
    default:
      return s;
  }
};
</script>

<template>
  <div
    :class="['re-progress-timeline', `re-progress-timeline--status-${task.status}`]"
    v-bind="$attrs"
    @mouseenter="onHoverShow"
    @mouseleave="onHoverHide"
  >
    <div class="re-progress-timeline__head" @click="onClickRow">
      <span class="re-progress-timeline__icon">
        <span v-if="task.status === 'success'">✓</span>
        <span v-else-if="task.status === 'failed'">✕</span>
        <span v-else-if="task.status === 'cancelled'">–</span>
        <span v-else>•</span>
      </span>
      <div class="re-progress-timeline__main">
        <div class="re-progress-timeline__title-row">
          <span class="re-progress-timeline__title">{{ task.title }}</span>
          <span class="re-progress-timeline__time">{{ formatTime(task.finishedAt ?? task.createdAt) }}</span>
        </div>
        <ReProgress
          :progress="task.progress"
          :color="task.status === 'success' ? 'success' : task.status === 'failed' ? 'danger' : 'info'"
          :status="task.status"
          :stripe="false"
          :height="4"
        />
        <div class="re-progress-timeline__meta">
          <span>{{ task.text || task.error || "—" }}</span>
        </div>
      </div>
      <div class="re-progress-timeline__actions" @click.stop>
        <button v-if="task.status === 'failed'" class="re-progress-timeline__btn" type="button" title="重试" @click="onRetry">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <button class="re-progress-timeline__btn" type="button" title="关闭" @click="onRemove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- ElPopover 受控显示（开关由 `popoverVisible` 与 hover 区域上的事件驱动）
         element-plus 2.14 移除了 trigger="manual"，用 :trigger="[]" 关闭内置触发 -->
    <el-popover
      v-if="task.history.length > 1"
      :visible="popoverVisible"
      placement="left-end"
      :width="320"
      :trigger="[]"
      :show-arrow="true"
      @update:visible="(v: boolean) => (popoverVisible = v)"
    >
      <template #reference>
        <span class="re-progress-timeline__hover-area" />
      </template>

      <div class="re-progress-timeline__popover">
        <div class="re-progress-timeline__popover-head">
          <span class="re-progress-timeline__popover-title">{{ task.title }}</span>
          <span class="re-progress-timeline__popover-count">{{ task.history.length }} 条</span>
        </div>
        <div class="re-progress-timeline__popover-list">
          <div
            v-for="(snap, idx) in task.history.slice().reverse()"
            :key="idx"
            class="re-progress-timeline__snap"
          >
            <div class="re-progress-timeline__snap-dot" :class="`re-progress-timeline__snap-dot--${snap.status}`" />
            <div class="re-progress-timeline__snap-body">
              <div class="re-progress-timeline__snap-row">
                <span class="re-progress-timeline__snap-time">{{ snapLabel(snap) }}</span>
                <span class="re-progress-timeline__snap-status">{{ statusText(snap.status) }}</span>
              </div>
              <div v-if="snap.text" class="re-progress-timeline__snap-text">{{ snap.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<style scoped>
.re-progress-timeline {
  position: relative;
  padding: 10px 12px;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius-lg);
  background: color-mix(in srgb, var(--rm-bg) 92%, transparent);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color var(--rm-transition), box-shadow var(--rm-transition);
  cursor: pointer;
}
.re-progress-timeline:hover {
  border-color: color-mix(in srgb, var(--rm-primary) 25%, var(--rm-border));
  box-shadow: 0 4px 12px color-mix(in srgb, var(--rm-primary) 8%, transparent);
}
.re-progress-timeline--status-success { border-color: color-mix(in srgb, var(--rm-success) 30%, var(--rm-border)); }
.re-progress-timeline--status-failed { border-color: color-mix(in srgb, var(--rm-danger) 30%, var(--rm-border)); }

.re-progress-timeline__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.re-progress-timeline__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--rm-bg-subtle);
  color: var(--rm-text-secondary);
  font-weight: 700;
  font-size: 12px;
}
.re-progress-timeline--status-success .re-progress-timeline__icon {
  background: var(--rm-success);
  color: var(--rm-text-white);
}
.re-progress-timeline--status-failed .re-progress-timeline__icon {
  background: var(--rm-danger);
  color: var(--rm-text-white);
}
.re-progress-timeline--status-cancelled .re-progress-timeline__icon {
  background: var(--rm-info);
  color: var(--rm-text-white);
}

.re-progress-timeline__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.re-progress-timeline__title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.re-progress-timeline__title {
  font-size: var(--rm-font-md);
  font-weight: 600;
  color: var(--rm-text);
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-progress-timeline__time {
  font-size: var(--rm-font-xs);
  color: var(--rm-text-secondary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.re-progress-timeline__meta {
  font-size: var(--rm-font-xs);
  color: var(--rm-text-secondary);
  letter-spacing: 0.01em;
}

.re-progress-timeline__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.re-progress-timeline__btn {
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
.re-progress-timeline__btn:hover {
  background: var(--rm-bg-hover);
  color: var(--rm-primary);
}
.re-progress-timeline__btn svg { width: 13px; height: 13px; }

/* 用于 popover reference 的占位 span（绝对定位 0 尺寸不阻塞） */
.re-progress-timeline__hover-area {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Popover 内容 */
.re-progress-timeline__popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.re-progress-timeline__popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--rm-border);
}

.re-progress-timeline__popover-title {
  font-size: var(--rm-font-md);
  font-weight: 600;
  color: var(--rm-text);
  letter-spacing: 0.01em;
}

.re-progress-timeline__popover-count {
  font-size: var(--rm-font-xs);
  color: var(--rm-text-secondary);
  padding: 1px 6px;
  background: var(--rm-bg-subtle);
  border-radius: var(--rm-radius-xs);
  font-weight: 500;
}

.re-progress-timeline__popover-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 2px;
}

.re-progress-timeline__snap {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  position: relative;
}

.re-progress-timeline__snap-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  background: var(--rm-border);
  box-shadow: 0 0 0 3px var(--rm-bg);
  position: relative;
  z-index: 1;
}
.re-progress-timeline__snap-dot--success { background: var(--rm-success); }
.re-progress-timeline__snap-dot--failed { background: var(--rm-danger); }
.re-progress-timeline__snap-dot--running { background: var(--rm-primary); }
.re-progress-timeline__snap-dot--cancelled { background: var(--rm-info); }
.re-progress-timeline__snap-dot--pending { background: var(--rm-info); }

.re-progress-timeline__snap:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 3.5px;
  top: 16px;
  bottom: -8px;
  width: 1px;
  background: var(--rm-border-light);
}

.re-progress-timeline__snap-body {
  flex: 1;
  min-width: 0;
}

.re-progress-timeline__snap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.re-progress-timeline__snap-time {
  font-size: var(--rm-font-xs);
  font-weight: 600;
  color: var(--rm-text);
  font-variant-numeric: tabular-nums;
}

.re-progress-timeline__snap-status {
  font-size: 10px;
  font-weight: 600;
  color: var(--rm-text-secondary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.re-progress-timeline__snap-text {
  font-size: var(--rm-font-xs);
  color: var(--rm-text-secondary);
  line-height: 1.4;
  padding-top: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .re-progress-timeline,
  .re-progress-timeline__btn {
    transition: none;
  }
}
</style>