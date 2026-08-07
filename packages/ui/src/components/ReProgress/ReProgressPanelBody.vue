<script setup lang="ts">
/**
 * ReProgressPanelBody —— 面板内部（Tab + 列表 + 设置），被 inline 与 floating 共用
 */
import type { PropType } from "vue";
import ReProgressTask from "./ReProgressTask.vue";
import ReProgressTimeline from "./ReProgressTimeline.vue";
import ReProgressSettings from "./settings/ReProgressSettings.vue";
import { useProgress } from "./composables/useTasks";
import type { ReProgressTask as ReProgressTaskType } from "./types";

defineOptions({ name: "ReProgressPanelBody" });

defineProps({
  mode: { type: String as PropType<"realtime" | "history">, required: true },
  visibleTasks: { type: Array as PropType<ReProgressTaskType[]>, required: true },
  offlineCount: { type: Number, required: true },
  showSettings: { type: Boolean, required: true },
});

defineEmits<{
  (e: "switch-mode", m: "realtime" | "history"): void;
  (e: "toggle-settings"): void;
  (e: "remove", id: string): void;
  (e: "retry", id: string): void;
}>();

const { state } = useProgress();
</script>

<template>
  <div class="re-progress-panel__inner">
    <!-- 顶部 Tab + 设置 -->
    <div class="re-progress-panel__head">
      <div class="re-progress-panel__tabs">
        <button
          type="button"
          :class="['re-progress-panel__tab', { 're-progress-panel__tab--active': mode === 'realtime' }]"
          @click="$emit('switch-mode', 'realtime')"
        >
          <span class="re-progress-panel__tab-dot re-progress-panel__tab-dot--active" />
          实时
          <span v-if="visibleTasks.length > 0 && mode === 'realtime'" class="re-progress-panel__tab-count">{{ visibleTasks.length }}</span>
        </button>
        <button
          type="button"
          :class="['re-progress-panel__tab', { 're-progress-panel__tab--active': mode === 'history' }]"
          @click="$emit('switch-mode', 'history')"
        >
          <span class="re-progress-panel__tab-dot" />
          历史
          <span v-if="offlineCount > 0" class="re-progress-panel__tab-count">{{ offlineCount }}</span>
        </button>
      </div>
      <div class="re-progress-panel__head-actions">
        <button
          type="button"
          :class="['re-progress-panel__icon-btn', { 'is-active': showSettings }]"
          title="系统设置"
          @click="$emit('toggle-settings')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.06a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.06a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.06a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 设置面板 -->
    <ReProgressSettings v-if="showSettings" />

    <!-- 主内容 -->
    <div v-if="visibleTasks.length === 0" class="re-progress-panel__empty">
      <div class="re-progress-panel__empty-icon">{{ mode === "realtime" ? "✓" : "○" }}</div>
      <div class="re-progress-panel__empty-text">{{ mode === "realtime" ? "当前没有正在进行的任务" : "暂无历史任务" }}</div>
    </div>
    <div v-else class="re-progress-panel__list">
      <template v-if="mode === 'realtime'">
        <ReProgressTask
          v-for="task in visibleTasks"
          :key="task.id"
          :task="task"
          :collapsed="state.settings.displayMode === 'compact'"
          @remove="(id) => $emit('remove', id)"
          @retry="(id) => $emit('retry', id)"
        />
      </template>
      <template v-else>
        <ReProgressTimeline
          v-for="task in visibleTasks"
          :key="task.id"
          :task="task"
          @remove="(id) => $emit('remove', id)"
          @retry="(id) => $emit('retry', id)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.re-progress-panel__inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.re-progress-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.re-progress-panel__tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  background: var(--rm-bg-subtle);
  border-radius: var(--rm-radius);
}

.re-progress-panel__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: var(--rm-text-secondary);
  font-size: var(--rm-font-sm);
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  border-radius: var(--rm-radius-sm);
  transition: background var(--rm-transition), color var(--rm-transition);
  font-family: inherit;
}
.re-progress-panel__tab:hover { color: var(--rm-text); }
.re-progress-panel__tab--active {
  background: var(--rm-bg);
  color: var(--rm-primary);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.re-progress-panel__tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--rm-border);
  transition: background var(--rm-transition);
}
.re-progress-panel__tab-dot--active {
  background: var(--rm-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--rm-success) 20%, transparent);
}

.re-progress-panel__tab-count {
  min-width: 18px;
  height: 16px;
  padding: 0 5px;
  background: var(--rm-primary);
  color: var(--rm-text-white);
  border-radius: var(--rm-radius-full);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.re-progress-panel__head-actions {
  display: flex;
  gap: 4px;
}

.re-progress-panel__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: var(--rm-radius-sm);
  color: var(--rm-text-secondary);
  cursor: pointer;
  transition: background var(--rm-transition), color var(--rm-transition);
}
.re-progress-panel__icon-btn:hover {
  background: var(--rm-bg-hover);
  color: var(--rm-primary);
}
.re-progress-panel__icon-btn.is-active {
  background: var(--rm-primary-light-9);
  color: var(--rm-primary);
}
.re-progress-panel__icon-btn svg { width: 14px; height: 14px; }

.re-progress-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 2px;
}

.re-progress-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 16px;
  gap: 8px;
  color: var(--rm-text-secondary);
}
.re-progress-panel__empty-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--rm-bg-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--rm-text-disabled);
}
.re-progress-panel__empty-text {
  font-size: var(--rm-font-sm);
  letter-spacing: 0.01em;
}

@media (prefers-reduced-motion: reduce) {
  .re-progress-panel__tab,
  .re-progress-panel__icon-btn,
  .re-progress-panel__tab-dot {
    transition: none;
  }
}
</style>