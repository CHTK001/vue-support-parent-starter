<script setup lang="ts">
/**
 * ReForm Modern 布局 —— 现代化扁平表单
 *
 * 设计要点：
 *   - 卡片式分组容器（subtle 背景 + 大圆角 + 轻阴影）
 *   - label 升级：字号 + 字重 + 颜色 + 字距 + 必填星号主色化
 *   - 表单项扁平 0 margin，gap 统一控制间距
 *   - focus 态：内容区边框主色化 + 轻光晕
 *   - error 态：红色边框 + 红色浅底 + 圆角错误提示
 *   - disabled 态：灰度 + 禁止光标
 *   - actions 区：subtle 背景分隔 + 圆角按钮容器
 *   - 全量使用 --rm-* 设计令牌，视觉与其他 Modern 组件统一
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
    <div v-if="$slots.actions" class="rm-form__actions">
      <slot name="actions" />
    </div>
    <slot v-else name="actions" />
  </div>
</template>

<style scoped>
/* ===================== 容器 ===================== */
.rm-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px;
  background: var(--rm-bg);
  border: 1px solid var(--rm-border-light);
  border-radius: var(--rm-radius-lg);
  box-shadow: var(--rm-shadow-xs);
  font-size: var(--rm-font-md);
  color: var(--rm-text-regular);
  transition: border-color var(--rm-transition), box-shadow var(--rm-transition);
}

.rm-form:hover {
  border-color: var(--rm-border);
  box-shadow: var(--rm-shadow-sm);
}

/* 行内模式 */
.rm-form--inline {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 18px;
  padding: 16px 20px;
}

/* 禁用态 */
.rm-form--disabled {
  background: var(--rm-bg-disabled);
  opacity: 0.6;
  pointer-events: none;
}

/* ===================== 表单项深度覆盖 ===================== */
.rm-form :deep(.el-form-item) {
  margin-bottom: 0;
  transition: background var(--rm-transition);
}

.rm-form :deep(.el-form-item:hover) {
  background: var(--rm-bg-subtle);
  border-radius: var(--rm-radius-sm);
}

/* 标签 */
.rm-form :deep(.el-form-item__label) {
  font-size: var(--rm-font-sm);
  font-weight: 600;
  color: var(--rm-text);
  line-height: 1.5;
  padding-bottom: 8px;
  letter-spacing: 0.02em;
  transition: color var(--rm-transition);
}

.rm-form :deep(.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label::before) {
  color: var(--rm-danger);
  font-size: var(--rm-font-md);
  margin-right: 4px;
}

/* 内容区 */
.rm-form :deep(.el-form-item__content) {
  line-height: normal;
  transition: border-color var(--rm-transition);
}

/* focus 态：给内容区添加主色光晕 */
.rm-form :deep(.el-form-item.is-focused .el-form-item__content),
.rm-form :deep(.el-form-item:focus-within .el-form-item__content) {
  border-radius: var(--rm-radius-sm);
}

/* error 态 */
.rm-form :deep(.el-form-item.is-error .el-form-item__content) {
  border-color: var(--rm-danger);
  border-radius: var(--rm-radius-sm);
}

.rm-form :deep(.el-form-item__error) {
  font-size: var(--rm-font-xs);
  font-weight: 500;
  color: var(--rm-danger);
  background: var(--rm-danger-light);
  padding: 4px 8px;
  margin-top: 4px;
  border-radius: var(--rm-radius-xs);
  letter-spacing: 0.01em;
  line-height: 1.4;
}

/* success 态 */
.rm-form :deep(.el-form-item.is-success .el-form-item__content) {
  border-color: var(--rm-success);
}

/* ===================== 输入控件深度覆盖 ===================== */
.rm-form :deep(.el-input__wrapper),
.rm-form :deep(.el-textarea__inner),
.rm-form :deep(.el-select__wrapper) {
  border-radius: var(--rm-radius);
  background: var(--rm-bg-subtle);
  border: 1px solid var(--rm-border-light);
  box-shadow: none;
  transition: border-color var(--rm-transition), background var(--rm-transition), box-shadow var(--rm-transition);
}

.rm-form :deep(.el-input__wrapper:hover),
.rm-form :deep(.el-textarea__inner:hover),
.rm-form :deep(.el-select__wrapper:hover) {
  border-color: var(--rm-border-hover);
  background: var(--rm-bg);
}

.rm-form :deep(.el-input__wrapper.is-focus),
.rm-form :deep(.el-textarea__inner:focus),
.rm-form :deep(.el-select__wrapper.is-focused) {
  border-color: var(--rm-primary);
  background: var(--rm-bg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--rm-primary) 12%, transparent);
}

.rm-form :deep(.el-input.is-disabled .el-input__wrapper),
.rm-form :deep(.el-textarea.is-disabled .el-textarea__inner) {
  background: var(--rm-bg-disabled);
  border-color: var(--rm-border-light);
}

/* ===================== Actions 区 ===================== */
.rm-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 0 0;
  margin-top: 4px;
  border-top: 1px solid var(--rm-border-light);
  border-radius: var(--rm-radius-sm);
}

/* 行内模式下 actions 内联 */
.rm-form--inline .rm-form__actions {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}

/* ===================== 分组标题（slot 内 .rm-form-group） ===================== */
.rm-form :deep(.rm-form-group) {
  padding: 16px;
  background: var(--rm-bg-subtle);
  border: 1px solid var(--rm-border-light);
  border-radius: var(--rm-radius);
  margin-bottom: 4px;
  transition: border-color var(--rm-transition);
}

.rm-form :deep(.rm-form-group:hover) {
  border-color: var(--rm-border);
}

.rm-form :deep(.rm-form-group__title) {
  font-size: var(--rm-font-sm);
  font-weight: 600;
  color: var(--rm-text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--rm-border-light);
}

/* ===================== Reduced Motion ===================== */
@media (prefers-reduced-motion: reduce) {
  .rm-form,
  .rm-form :deep(.el-form-item),
  .rm-form :deep(.el-form-item__label),
  .rm-form :deep(.el-input__wrapper),
  .rm-form :deep(.el-textarea__inner),
  .rm-form :deep(.el-select__wrapper),
  .rm-form :deep(.rm-form-group) {
    transition: none;
  }
}
</style>
