<script setup lang="ts">
/**
 * ReProgressPanel —— 任务进度面板
 *
 * 两种模式：
 *   - 实时：显示当前 running / pending 任务（默认）
 *   - 历史：点击历史图标切换，显示已完成 / 失败 / 取消的任务
 *
 * 实时模式鼠标悬停历史 popover 显示详细信息时间轴
 * 系统设置：显示模式、颜色、提示、存在时间
 * 现代化扁平化：玻璃质感 + 渐变 + 阴影
 */
import { computed, ref, onMounted, onUnmounted } from "vue";
import "../shared/modern-vars.css";
import ReProgressPanelBody from "./ReProgressPanelBody.vue";
import { useProgress } from "./composables/useTasks";
import type { ReProgressTask as ReProgressTaskType } from "./types";

defineOptions({ name: "ReProgressPanel", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 是否固定显示面板（停在屏幕一角） */
    floating?: boolean;
    /** 浮动位置 */
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  }>(),
  {
    floating: true,
    position: undefined,
  },
);

const { api, state, runningTasks, historyTasks } = useProgress();

const mode = ref<"realtime" | "history">("realtime");
const showSettings = ref(false);

const finalPosition = computed(() => props.position ?? state.settings.panelPosition);

const visibleTasks = computed(() => {
  if (mode.value === "realtime") return runningTasks.value;
  return historyTasks.value;
});

const offlineCount = computed(() => historyTasks.value.length);

function onRemove(id: string): void {
  api.remove(id);
}

function onRetry(id: string): void {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  api.reset(id);
  api.start(id, "已重试");
}

const floatingStyle = computed(() => {
  if (!props.floating) return undefined;
  const pos = finalPosition.value;
  const map: Record<string, Record<string, string>> = {
    "top-right": { top: "16px", right: "16px" },
    "top-left": { top: "16px", left: "16px" },
    "bottom-right": { bottom: "16px", right: "16px" },
    "bottom-left": { bottom: "16px", left: "16px" },
  };
  return {
    position: "fixed" as const,
    zIndex: 1000,
    ...(map[pos] ?? map["bottom-right"]),
  };
});

/** 监听完成 / 失败 toast 通知 */
function onNotify(e: Event): void {
  const evt = e as CustomEvent<{ task: ReProgressTaskType; type: "success" | "failed" }>;
  const { task, type } = evt.detail;
  if (type === "success" && !state.settings.showSuccessMessage) return;
  if (type === "failed" && !state.settings.showFailedMessage) return;
  console.log(`[ReProgress] ${type === "success" ? "✓" : "✕"} ${task.title}: ${task.text ?? ""}`);
}

onMounted(() => {
  window.addEventListener("re-progress:notify", onNotify);
});
onUnmounted(() => {
  window.removeEventListener("re-progress:notify", onNotify);
});
</script>

<template>
  <div
    v-if="floating"
    :class="['re-progress-panel', 're-progress-panel--floating', `re-progress-panel--${finalPosition}`]"
    :style="floatingStyle"
    v-bind="$attrs"
  >
    <div class="re-progress-panel__shell">
      <ReProgressPanelBody
        :mode="mode"
        :visible-tasks="visibleTasks"
        :offline-count="offlineCount"
        :show-settings="showSettings"
        @switch-mode="mode = $event"
        @toggle-settings="showSettings = !showSettings"
        @remove="onRemove"
        @retry="onRetry"
      />
    </div>
  </div>
  <div v-else class="re-progress-panel re-progress-panel--inline" v-bind="$attrs">
    <ReProgressPanelBody
      :mode="mode"
      :visible-tasks="visibleTasks"
      :offline-count="offlineCount"
      :show-settings="showSettings"
      @switch-mode="mode = $event"
      @toggle-settings="showSettings = !showSettings"
      @remove="onRemove"
      @retry="onRetry"
    />
  </div>
</template>

<style scoped>
.re-progress-panel {
  font-family: inherit;
}
.re-progress-panel--floating {
  pointer-events: auto;
  max-width: 380px;
  width: 100%;
}
.re-progress-panel--inline {
  width: 100%;
}

.re-progress-panel__shell {
  position: relative;
  border-radius: var(--rm-radius-xl);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--rm-bg) 96%, transparent) 0%,
    color-mix(in srgb, var(--rm-primary-light-9) 30%, var(--rm-bg)) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--rm-border);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 12px 32px rgba(15, 23, 42, 0.1),
    0 2px 8px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}
</style>