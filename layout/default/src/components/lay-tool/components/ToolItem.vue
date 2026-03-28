<script setup lang="ts">
// 工具栏统一 tooltip + icon 封装组件
import { useAttrs } from "vue";

defineOptions({
  inheritAttrs: false,
});

defineProps<{
  tooltip?: string;       // tooltip 文字
  tooltipPlacement?: string; // tooltip 位置，默认 bottom
  active?: boolean;       // 激活状态
  disabled?: boolean;     // 禁用状态
  ariaLabel?: string;     // 无障碍标签
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();

const attrs = useAttrs();
</script>

<template>
  <el-tooltip
    v-if="tooltip"
    :content="tooltip"
    :placement="(tooltipPlacement as any) || 'bottom'"
    :show-after="300"
    :hide-after="0"
  >
    <span
      v-bind="attrs"
      :class="['tool-item', { 'tool-item--active': active, 'tool-item--disabled': disabled }]"
      :aria-label="ariaLabel || tooltip"
      :aria-disabled="disabled"
      role="button"
      tabindex="0"
      @click="!disabled && $emit('click', $event)"
      @keydown.enter="!disabled && $emit('click', $event as any)"
      @keydown.space.prevent="!disabled && $emit('click', $event as any)"
    >
      <slot />
    </span>
  </el-tooltip>
  <span
    v-else
    v-bind="attrs"
    :class="['tool-item', { 'tool-item--active': active, 'tool-item--disabled': disabled }]"
    :aria-label="ariaLabel"
    :aria-disabled="disabled"
    role="button"
    tabindex="0"
    @click="!disabled && $emit('click', $event)"
    @keydown.enter="!disabled && $emit('click', $event as any)"
    @keydown.space.prevent="!disabled && $emit('click', $event as any)"
  >
    <slot />
  </span>
</template>

<style lang="scss" scoped>
.tool-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 10px;
  border-radius: 14px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid transparent;
  transition: all 0.2s ease;
  font-size: 16px;
  flex-shrink: 0;
  outline: none;
  backdrop-filter: blur(14px);

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.12),
      rgba(var(--el-color-primary-rgb), 0.05)
    );
    border-color: rgba(var(--el-color-primary-rgb), 0.18);
    color: var(--el-color-primary);
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(var(--el-color-primary-rgb), 0.14);
  }

  &:active {
    transform: translateY(0);
    background: rgba(var(--el-color-primary-rgb), 0.12);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  // 激活态
  &--active {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.16),
      rgba(var(--el-color-primary-rgb), 0.08)
    );
    color: var(--el-color-primary);
    border-color: rgba(var(--el-color-primary-rgb), 0.2);
  }

  // 禁用态
  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
}
</style>
