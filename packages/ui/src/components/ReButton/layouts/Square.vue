<script setup lang="ts">
import "../../shared/modern-vars.css";
import ReIcon from "../../ReIcon/theme/default/ReIcon.vue";
import { ElIcon } from "element-plus";
import { computed, type Component } from "vue";

defineOptions({ name: "ReButtonSquare", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    type?: "primary" | "success" | "warning" | "info" | "danger" | "text" | "";
    size?: "large" | "default" | "small";
    plain?: boolean;
    loading?: boolean;
    disabled?: boolean;
    icon?: string | Component;
    nativeType?: "button" | "submit" | "reset";
  }>(),
  {
    type: "",
    size: "default",
    plain: false,
    loading: false,
    disabled: false,
    icon: "",
    nativeType: "button",
  },
);

const emit = defineEmits<{
  (e: "click", evt: MouseEvent): void;
}>();

function onClick(e: MouseEvent): void {
  if (props.disabled || props.loading) return;
  emit("click", e);
}

const iconIsComponent = computed<boolean>(() => typeof props.icon !== "string" && props.icon != null);
const iconName = computed<string>(() => (typeof props.icon === "string" ? props.icon : ""));
</script>

<template>
  <button
    :type="nativeType as any"
    :disabled="disabled || loading"
    :class="[
      'rs-btn',
      `rs-btn--${type || 'default'}`,
      `rs-btn--size-${size || 'default'}`,
      {
        'rs-btn--plain': plain,
        'is-loading': loading,
        'is-disabled': disabled,
      },
    ]"
    v-bind="$attrs"
    @click="onClick"
  >
    <span v-if="loading" class="rs-btn__spinner">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70" stroke-linecap="round" />
      </svg>
    </span>
    <ReIcon v-if="icon && !iconIsComponent" :name="iconName" class="rs-btn__icon" />
    <ElIcon v-else-if="iconIsComponent" class="rs-btn__icon">
      <component :is="icon" />
    </ElIcon>
  </button>
</template>

<style scoped>
.rs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
  flex-shrink: 0;
}
.rs-btn:hover:not(.is-disabled):not(:disabled) {
  border-color: var(--el-color-primary-light-3, #a0cfff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.rs-btn:active:not(.is-disabled):not(:disabled) {
  transform: scale(0.92);
}
.rs-btn--small {
  width: 28px;
  height: 28px;
  font-size: 12px;
}
.rs-btn--size-small {
  width: 28px;
  height: 28px;
  font-size: 12px;
}
.rs-btn--size-default {
  width: 30px;
  height: 30px;
  font-size: 14px;
}
.rs-btn--size-large {
  width: 36px;
  height: 36px;
  font-size: 16px;
}
.rs-btn--default {
  border-color: var(--el-border-color, #dcdfe6);
  color: var(--el-text-color-secondary, #909399);
}
.rs-btn--default:hover:not(.is-disabled):not(:disabled) {
  border-color: var(--el-color-primary-light-3, #a0cfff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.rs-btn--primary {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}
.rs-btn--primary:hover:not(.is-disabled):not(:disabled) {
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.rs-btn--danger {
  border-color: var(--el-color-danger, #f56c6c);
  color: var(--el-color-danger, #f56c6c);
}
.rs-btn--danger:hover:not(.is-disabled):not(:disabled) {
  background: var(--el-color-danger, #f56c6c);
  color: #fff;
}
.rs-btn--plain.rs-btn--primary {
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.rs-btn--plain.rs-btn--primary:hover:not(.is-disabled):not(:disabled) {
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.rs-btn.is-disabled,
.rs-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
.rs-btn.is-loading {
  cursor: wait;
  opacity: 0.85;
}
.rs-btn__spinner {
  display: inline-flex;
  animation: rs-spin 0.8s linear infinite;
}
.rs-btn__spinner svg {
  width: 14px;
  height: 14px;
}
@keyframes rs-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.rs-btn__icon {
  display: inline-flex;
  flex-shrink: 0;
}
@media (prefers-reduced-motion: reduce) {
  .rs-btn { transition: none; }
  .rs-btn:active:not(.is-disabled):not(:disabled) { transform: none; }
}
</style>