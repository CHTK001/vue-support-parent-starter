<script setup lang="ts">
/**
 * ReButton Square 布局 —— 正方形纯图标按钮
 *
 * <p><b>loading 与图标互斥</b>：spinner 出现时图标必须让位。此前两者是各自独立的
 * {@code v-if}，loading 态下会同时渲染 —— 按钮里并排两个 14px 图形，图标根本没被替换掉，
 * spinner 转圈时图标还杵在旁边（2026-09-28 在 ReTable 刷新按钮上实测：loading 态
 * {@code children.length === 2}、图标仍在）。现在 spinner 用 {@code v-if}、
 * 图标整块用 {@code v-else}，二者互斥，实测 loading 态 {@code children.length === 1}。</p>
 */
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
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70" stroke-linecap="round" />
      </svg>
    </span>
    <template v-else>
      <ReIcon v-if="icon && !iconIsComponent" :name="iconName" class="rs-btn__icon" />
      <ElIcon v-else-if="iconIsComponent" class="rs-btn__icon">
        <component :is="icon" />
      </ElIcon>
    </template>
  </button>
</template>

<style scoped>
.rs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  /* 圆角统一用 Element 控件档（= 新增学生等 el-button 的 --el-border-radius-base，
     koi 里映射到 --el-radius-sm = 6px）。原先硬编码 10px，与 el-button 不一致。 */
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  user-select: none;
  outline: none;
  /* 只过渡会变的视觉属性。原先是 `transition: all`，把 width/height/margin/padding
     这些会触发布局的属性也带进来，hover / 按下每次都多一轮 reflow；这里按需列举。 */
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.08s ease-out;
  font-family: inherit;
  flex-shrink: 0;
}
.rs-btn:hover:not(.is-disabled):not(:disabled) {
  border-color: var(--el-color-primary-light-3, #a0cfff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
/* 按压反馈：缩放要跟手。transform 单独给 0.08s（见 .rs-btn 的 transition），
   若跟颜色一样 0.2s，30px 的按钮会先「塌」下去再弹回，看着发黏。 */
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
/* 尺寸写死并禁止收缩：spinner 是按钮里唯一的图形，尺寸必须与它替换掉的图标一致（14px），
   否则 loading 切换时按钮内容会跳一下 */
.rs-btn__spinner svg {
  width: 14px;
  height: 14px;
  flex: none;
  display: block;
}
.rs-btn--size-small .rs-btn__spinner svg { width: 12px; height: 12px; }
.rs-btn--size-large .rs-btn__spinner svg { width: 17px; height: 17px; }
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
  /* 旋转动画本身要停：spinner 靠 animation 而非 transition 驱动，
     只写 transition: none 是停不下来的（此前漏了这条，reduced-motion 下仍在转）。 */
  .rs-btn__spinner { animation: none; }
}
</style>