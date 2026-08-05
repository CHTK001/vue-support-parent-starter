<template>
  <div class="re-select-square">
    <div
      v-for="opt in displayOptions"
      :key="String(opt.value)"
      :class="[
        're-select-square__item',
        { 're-select-square__item--active': isSelected(opt) },
      ]"
      :title="opt.label"
      @click="select(opt)"
    >
      <ReIcon v-if="opt.icon" :name="opt.icon" :size="size" />
      <span v-else class="re-select-square__fallback">{{ String(opt.label).charAt(0) }}</span>
      <span v-if="!iconOnly" class="re-select-square__label">{{ opt.label }}</span>
      <span v-if="isSelected(opt)" class="re-select-square__check">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2 6 5 9 10 3" />
        </svg>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReSelect Square 布局
 *
 * 横向排列方形按钮，点击切换选中（互斥单选）。
 * 选项图标通过 ReIcon 渲染，自动支持：
 *   - element-plus PascalCase
 *   - ep:xxx / ri:xxx / mdi:xxx
 *   - iconfont class / uni / svg
 *   - HTTP URL
 */
import { computed } from "vue";
import ReIcon from "../../ReIcon/theme/default/ReIcon.vue";
import type { ReOption } from "../types";

const props = withDefaults(
  defineProps<{
    /** 选项列表 */
    options: ReOption[];
    /** 当前模型值（单值或数组） */
    modelValue?: string | number | (string | number)[];
    /** 是否多选 */
    multiple?: boolean;
    /** 图标尺寸 */
    size?: number;
    /** 仅显示图标，隐藏文字 */
    iconOnly?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
  }>(),
  {
    modelValue: "",
    multiple: false,
    size: 22,
    iconOnly: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", val: string | number | (string | number)[]): void;
}>();

const displayOptions = computed(() => props.options);

function isSelected(opt: ReOption): boolean {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(opt.value);
  }
  return props.modelValue === opt.value;
}

function select(opt: ReOption) {
  if (props.disabled) return;
  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const idx = arr.indexOf(opt.value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(opt.value);
    emit("update:modelValue", arr as (string | number)[]);
  } else {
    emit("update:modelValue", opt.value as string | number);
  }
}
</script>

<style lang="scss" scoped>
.re-select-square {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.re-select-square__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  min-width: 80px;
  border: 1.5px solid var(--el-border-color, #dcdfe6);
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;

  &:hover {
    border-color: var(--el-color-primary-light-3, #a0cfff);
    color: var(--el-color-primary, #409eff);
    background: var(--el-color-primary-light-9, #ecf5ff);
  }

  &--active {
    border: 2px solid var(--el-color-primary, #409eff);
    padding: 11px 13px;
    color: var(--el-color-primary, #409eff);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
  }
}

.re-select-square__label {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.re-select-square__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: inherit;
}

.re-select-square__check {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: var(--el-color-primary, #409eff);
  border-radius: 50%;
  color: #fff;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.4);
}

.re-select-square__check svg {
  width: 10px;
  height: 10px;
}
</style>