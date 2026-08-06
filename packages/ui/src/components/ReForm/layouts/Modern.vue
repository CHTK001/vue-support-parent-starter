<script setup lang="ts">
/**
 * ReForm Modern 布局 —— 现代化扁平表单
 *
 * 设计要点：
 *   - 极简容器
 *   - label 升级：字号 + 字重 + 颜色 + 字距
 *   - 表单项扁平 0 margin
 *   - disabled 灰度
 */
import "../../shared/modern-vars.css";

defineOptions({ name: "ReFormModern", inheritAttrs: true });

withDefaults(
  defineProps<{
    labelWidth?: string | number;
    inline?: boolean;
    disabled?: boolean;
  }>(),
  {
    labelWidth: "100px",
    inline: false,
    disabled: false,
  },
);
</script>

<template>
  <div
    :class="['rm-form', { 'rm-form--inline': inline, 'rm-form--disabled': disabled }]"
    v-bind="$attrs"
  >
    <slot />
    <slot name="actions" />
  </div>
</template>

<style scoped>
.rm-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-size: var(--rm-font-md);
}
.rm-form--inline {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 18px;
}
.rm-form--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 深度样式覆盖 el-form-item（极致扁平化） */
.rm-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.rm-form :deep(.el-form-item__label) {
  font-size: var(--rm-font-sm);
  font-weight: 600;
  color: var(--rm-text);
  line-height: 1.4;
  padding-bottom: 6px;
  letter-spacing: 0.01em;
}
.rm-form :deep(.el-form-item__content) {
  line-height: normal;
}
.rm-form :deep(.el-form-item__error) {
  font-size: var(--rm-font-xs);
  font-weight: 500;
  padding-top: 4px;
  letter-spacing: 0.01em;
}
</style>