<script setup lang="ts">
/**
 * ReProgressSettings —— 系统设置面板
 *
 * - 显示模式：折叠 / 展开
 * - 默认颜色
 * - 完成后提示 / 失败后提示
 * - 存在时间（自动过期）
 * - 是否多任务并存
 * - 是否历史 popover
 * - 面板位置
 */
import { computed } from "vue";
import "../../shared/modern-vars.css";
import { useProgress } from "../composables/useTasks";
import type { ReProgressColor } from "../types";
import ReSelect from "../../ReSelect/ReSelect.vue";

defineOptions({ name: "ReProgressSettings" });

const { state, api } = useProgress();

const LIFETIME_OPTIONS = [
  { label: "永不过期", value: 0 },
  { label: "1 小时", value: 60 * 60 * 1000 },
  { label: "24 小时", value: 24 * 60 * 60 * 1000 },
  { label: "7 天", value: 7 * 24 * 60 * 60 * 1000 },
];

const COLOR_OPTIONS: Array<{ label: string; value: ReProgressColor }> = [
  { label: "主色", value: "primary" },
  { label: "成功", value: "success" },
  { label: "警告", value: "warning" },
  { label: "危险", value: "danger" },
  { label: "信息", value: "info" },
];

const POSITION_OPTIONS = [
  { label: "右上", value: "top-right" },
  { label: "左上", value: "top-left" },
  { label: "右下", value: "bottom-right" },
  { label: "左下", value: "bottom-left" },
];

const MODE_OPTIONS = [
  { label: "折叠（仅进度条）", value: "compact" },
  { label: "展开（含概要信息）", value: "expanded" },
];

const lifetimeValue = computed<number>({
  get: () => state.settings.lifetime,
  set: (v) => api.updateSettings({ lifetime: v }),
});

const displayMode = computed<string>({
  get: () => state.settings.displayMode,
  set: (v) => api.updateSettings({ displayMode: v as "compact" | "expanded" }),
});

const defaultColor = computed<string>({
  get: () => state.settings.defaultColor,
  set: (v) => api.updateSettings({ defaultColor: v as ReProgressColor }),
});

const panelPosition = computed<string>({
  get: () => state.settings.panelPosition,
  set: (v) => api.updateSettings({ panelPosition: v as "top-right" | "top-left" | "bottom-right" | "bottom-left" }),
});

function onClearHistory(): void {
  api.clearHistory();
}
</script>

<template>
  <div class="re-progress-settings">
    <div class="re-progress-settings__head">
      <span class="re-progress-settings__title">系统设置</span>
      <button class="re-progress-settings__clear" type="button" @click="onClearHistory">清空历史</button>
    </div>

    <div class="re-progress-settings__grid">
      <!-- 显示模式 -->
      <div class="re-progress-settings__row">
        <span class="re-progress-settings__label">显示模式</span>
        <ReSelect
          layout="default"
          :options="MODE_OPTIONS as any"
          :model-value="displayMode as any"
          @update:model-value="displayMode = $event as any"
          class="re-progress-settings__control"
        />
      </div>

      <!-- 默认颜色 -->
      <div class="re-progress-settings__row">
        <span class="re-progress-settings__label">默认颜色</span>
        <ReSelect
          layout="default"
          :options="COLOR_OPTIONS as any"
          :model-value="defaultColor as any"
          @update:model-value="defaultColor = $event as any"
          class="re-progress-settings__control"
        />
      </div>

      <!-- 面板位置 -->
      <div class="re-progress-settings__row">
        <span class="re-progress-settings__label">面板位置</span>
        <ReSelect
          layout="default"
          :options="POSITION_OPTIONS as any"
          :model-value="panelPosition as any"
          @update:model-value="panelPosition = $event as any"
          class="re-progress-settings__control"
        />
      </div>

      <!-- 存在时间 -->
      <div class="re-progress-settings__row">
        <span class="re-progress-settings__label">存在时间</span>
        <ReSelect
          layout="default"
          :options="LIFETIME_OPTIONS as any"
          :model-value="lifetimeValue as any"
          @update:model-value="lifetimeValue = $event as any"
          class="re-progress-settings__control"
        />
      </div>

      <!-- 提示开关 -->
      <div class="re-progress-settings__row">
        <span class="re-progress-settings__label">完成后提示</span>
        <label class="re-progress-settings__switch">
          <input
            type="checkbox"
            :checked="state.settings.showSuccessMessage"
            @change="api.updateSettings({ showSuccessMessage: ($event.target as HTMLInputElement).checked })"
          />
          <span class="re-progress-settings__switch-track">
            <span class="re-progress-settings__switch-thumb" />
          </span>
        </label>
      </div>

      <div class="re-progress-settings__row">
        <span class="re-progress-settings__label">失败后提示</span>
        <label class="re-progress-settings__switch">
          <input
            type="checkbox"
            :checked="state.settings.showFailedMessage"
            @change="api.updateSettings({ showFailedMessage: ($event.target as HTMLInputElement).checked })"
          />
          <span class="re-progress-settings__switch-track">
            <span class="re-progress-settings__switch-thumb" />
          </span>
        </label>
      </div>

      <div class="re-progress-settings__row">
        <span class="re-progress-settings__label">多任务并存</span>
        <label class="re-progress-settings__switch">
          <input
            type="checkbox"
            :checked="state.settings.multiTask"
            @change="api.updateSettings({ multiTask: ($event.target as HTMLInputElement).checked })"
          />
          <span class="re-progress-settings__switch-track">
            <span class="re-progress-settings__switch-thumb" />
          </span>
        </label>
      </div>

      <div class="re-progress-settings__row">
        <span class="re-progress-settings__label">历史 Popover</span>
        <label class="re-progress-settings__switch">
          <input
            type="checkbox"
            :checked="state.settings.showHistoryPopover"
            @change="api.updateSettings({ showHistoryPopover: ($event.target as HTMLInputElement).checked })"
          />
          <span class="re-progress-settings__switch-track">
            <span class="re-progress-settings__switch-thumb" />
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.re-progress-settings {
  padding: 12px;
  border-radius: var(--rm-radius-lg);
  background: color-mix(in srgb, var(--rm-bg-subtle) 70%, transparent);
  border: 1px solid var(--rm-border-light);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.re-progress-settings__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.re-progress-settings__title {
  font-size: var(--rm-font-md);
  font-weight: 600;
  color: var(--rm-text);
  letter-spacing: 0.01em;
}

.re-progress-settings__clear {
  border: none;
  background: transparent;
  color: var(--rm-text-secondary);
  font-size: var(--rm-font-xs);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--rm-radius-sm);
  font-weight: 500;
  transition: background var(--rm-transition), color var(--rm-transition);
  font-family: inherit;
}
.re-progress-settings__clear:hover {
  background: var(--rm-danger-light);
  color: var(--rm-danger);
}

.re-progress-settings__grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.re-progress-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.re-progress-settings__label {
  font-size: var(--rm-font-sm);
  color: var(--rm-text-regular);
  font-weight: 500;
}

.re-progress-settings__control {
  width: 140px;
}

/* Custom switch */
.re-progress-settings__switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  cursor: pointer;
}
.re-progress-settings__switch input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.re-progress-settings__switch-track {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: var(--rm-radius-full);
  background: var(--rm-border);
  transition: background var(--rm-transition-slow);
}
.re-progress-settings__switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.2);
  transition: transform var(--rm-transition-slow);
}
.re-progress-settings__switch input:checked + .re-progress-settings__switch-track {
  background: var(--rm-primary);
}
.re-progress-settings__switch input:checked + .re-progress-settings__switch-track .re-progress-settings__switch-thumb {
  transform: translateX(14px);
}

@media (prefers-reduced-motion: reduce) {
  .re-progress-settings__switch-track,
  .re-progress-settings__switch-thumb,
  .re-progress-settings__clear {
    transition: none;
  }
}
</style>