<template>
  <div class="re-select-pill" :class="{ 're-select-pill--disabled': disabled }">
    <!-- 操作栏（多选模式） -->
    <div v-if="multiple" class="re-select-pill__actions">
      <button type="button" class="re-select-pill__action-btn" @click="selectAll">全选</button>
      <button type="button" class="re-select-pill__action-btn" @click="invertSelect">反选</button>
      <button type="button" class="re-select-pill__action-btn" @click="clearAll">清空</button>
    </div>
    <!-- 药丸列表 -->
    <div class="re-select-pill__list">
      <button
        v-for="opt in options"
        :key="String(opt.value)"
        type="button"
        :class="[
          're-select-pill__item',
          { 're-select-pill__item--active': isSelected(opt), 're-select-pill__item--disabled': opt.disabled },
        ]"
        :disabled="disabled || opt.disabled"
        @click="toggle(opt)"
      >
        <span v-if="opt.icon" class="re-select-pill__icon">{{ opt.icon }}</span>
        <span class="re-select-pill__label">{{ opt.label }}</span>
        <svg v-if="isSelected(opt)" class="re-select-pill__check" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PillLayout —— 药丸/标签式选择器布局
 *
 * 直接展示所有选项为药丸/标签，无需下拉。
 * 多选模式支持全选、反选、清空操作。
 */
import { computed } from "vue";

defineOptions({ name: "PillReSelect", inheritAttrs: true });

interface PillOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  icon?: string;
  [key: string]: unknown;
}

const props = withDefaults(
  defineProps<{
    options?: PillOption[];
    multiple?: boolean;
    disabled?: boolean;
  }>(),
  {
    options: () => [],
    multiple: false,
    disabled: false,
  },
);

const modelValue = defineModel<string | number | (string | number)[] | null>({ default: "" });

const selectedSet = computed<Set<string | number>>(() => {
  if (Array.isArray(modelValue.value)) return new Set(modelValue.value);
  if (modelValue.value !== "" && modelValue.value != null) return new Set([modelValue.value]);
  return new Set();
});

function isSelected(opt: PillOption): boolean {
  return selectedSet.value.has(opt.value);
}

function toggle(opt: PillOption) {
  if (props.disabled || opt.disabled) return;
  if (!props.multiple) {
    modelValue.value = opt.value;
    return;
  }
  const cur = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
  const idx = cur.indexOf(opt.value);
  if (idx >= 0) {
    cur.splice(idx, 1);
  } else {
    cur.push(opt.value);
  }
  modelValue.value = cur;
}

function selectAll() {
  if (props.disabled) return;
  const all = props.options.filter((o) => !o.disabled).map((o) => o.value);
  modelValue.value = [...all];
}

function invertSelect() {
  if (props.disabled) return;
  const cur = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
  const curSet = new Set(cur);
  const result: (string | number)[] = [];
  for (const opt of props.options) {
    if (opt.disabled) {
      // 保留被禁用的已选项
      if (curSet.has(opt.value)) result.push(opt.value);
    } else {
      // 反选非禁用项
      if (!curSet.has(opt.value)) result.push(opt.value);
    }
  }
  modelValue.value = result;
}

function clearAll() {
  if (props.disabled) return;
  modelValue.value = props.multiple ? [] : "";
}
</script>

<style scoped>
.re-select-pill {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.re-select-pill--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.re-select-pill__actions {
  display: flex;
  gap: 12px;
}
.re-select-pill__action-btn {
  border: none;
  background: none;
  color: var(--el-color-primary, #409eff);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
  transition: opacity 0.15s;
}
.re-select-pill__action-btn:hover {
  opacity: 0.7;
}

.re-select-pill__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.re-select-pill__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  user-select: none;
}
.re-select-pill__item:hover:not(.re-select-pill__item--disabled) {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
.re-select-pill__item--active {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
  font-weight: 500;
}
.re-select-pill__item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.re-select-pill__check {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.re-select-pill__icon {
  font-size: 14px;
}
.re-select-pill__label {
  white-space: nowrap;
}
</style>
