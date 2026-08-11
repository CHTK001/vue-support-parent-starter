<!--
  ReEmptyState —— 极简空状态 / 占位组件
  设计风格：Vercel / Linear · 低饱和度 · 纯色 · 无渐变
  复用场景：连接占位、加载中、空目录、错误占位
  Props:
    - title / description / icon
    - loading: 旋转图标（loading 状态）
    - size: compact | default | large
  Slots:
    - icon: 自定义图标
    - title / description
    - default: 行动按钮（重试/刷新等）
-->
<template>
  <div
    class="re-empty-state flex flex-col items-center justify-center gap-3 px-10 py-10 text-center"
    :class="[`re-empty-state--${size}`, { 'is-loading': loading }]"
    role="status"
    :aria-live="loading ? 'polite' : 'off'"
  >
    <div v-if="$slots.icon || icon" class="re-empty-state__icon" style="color: var(--el-text-color-placeholder)">
      <slot name="icon">
        <el-icon :size="iconSize"><component :is="icon" /></el-icon>
      </slot>
    </div>

    <h3 v-if="title || $slots.title" class="re-empty-state__title" style="color: var(--el-text-color-primary)">
      <slot name="title">{{ title }}</slot>
    </h3>

    <p
      v-if="description || $slots.description"
      class="re-empty-state__desc"
      style="color: var(--el-text-color-secondary)"
    >
      <slot name="description">{{ description }}</slot>
    </p>

    <div v-if="$slots.default" class="re-empty-state__actions flex flex-wrap justify-center gap-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";

type EmptySize = "compact" | "default" | "large";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    icon?: Component;
    /** 自定义图标尺寸（px），默认 48 */
    iconSize?: number;
    /** 加载中状态：旋转图标 */
    loading?: boolean;
    /** 容器尺寸 */
    size?: EmptySize;
  }>(),
  {
    title: "",
    description: "",
    icon: undefined,
    iconSize: 48,
    loading: false,
    size: "default",
  },
);

defineOptions({ name: "ReEmptyState", inheritAttrs: true });
</script>

<style scoped>
.re-empty-state {
  width: 100%;
  height: 100%;
  min-height: 240px;
}

.re-empty-state--compact {
  padding-top: 32px;
  padding-bottom: 32px;
  min-height: 160px;
}

.re-empty-state--large {
  padding-top: 64px;
  padding-bottom: 64px;
  min-height: 360px;
}

.re-empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.re-empty-state.is-loading :deep(.re-empty-state__icon),
.re-empty-state.is-loading :deep(.el-icon) {
  animation: re-empty-state-spin 1.5s linear infinite;
}

.re-empty-state__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.re-empty-state__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  max-width: 360px;
}

@keyframes re-empty-state-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .re-empty-state.is-loading :deep(.re-empty-state__icon),
  .re-empty-state.is-loading :deep(.el-icon) {
    animation: none;
  }
}
</style>
