<script setup lang="ts">
/**
 * ReDialogCloseFab —— headless 模式下右上角圆形悬浮关闭按钮
 *
 * 圆心固定在右上角（top: 12px, right: 12px），z-index 高于 header。
 * 支持自定义背景色 / 颜色 / 尺寸。
 */
import { computed, defineAsyncComponent } from "vue";

/**
 * ReIcon 的模块 default 是**已经包装好的异步组件**（`defineAsyncComponent` 的返回值），
 * 不是「按主题解析组件的 loader」，因此不能再当函数调用 —— `m.default()` 会抛
 * "m.default is not a function"，导致 headless 对话框的关闭按钮整块渲染失败。
 * 这里只做一次动态 import 拆包，交给 defineAsyncComponent 保持懒加载。
 */
const ReIcon = defineAsyncComponent(() => import("@repo/ui/re-icon").then((m) => m.default));

defineOptions({ name: "ReDialogCloseFab" });

const props = withDefaults(
  defineProps<{
    /** 主题色覆盖 */
    color?: string;
    /** 圆形直径 */
    size?: number;
    /** 标题（用于无障碍） */
    title?: string;
  }>(),
  {
    color: "rgba(0, 0, 0, 0.55)",
    size: 32,
    title: "关闭",
  },
);

const emit = defineEmits<{
  (e: "click", ev: MouseEvent): void;
}>();

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  color: props.color,
}));

function onClick(e: MouseEvent) {
  emit("click", e);
}
</script>

<template>
  <button
    type="button"
    class="re-dialog__close-fab"
    :style="style"
    :title="title"
    aria-label="关闭弹窗"
    @click="onClick"
  >
    <ReIcon name="Close" :size="Math.floor(size * 0.55)" />
  </button>
</template>

<style scoped>
.re-dialog__close-fab {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--el-bg-color, #ffffff);
  box-shadow:
    0 0 0 1px var(--el-border-color-lighter, rgba(0, 0, 0, 0.06));
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  outline: none;
  padding: 0;
}
.re-dialog__close-fab:hover {
  background: var(--el-color-danger, #f56c6c);
  color: #fff;
  transform: rotate(90deg) scale(1.08);
  box-shadow: none;
}
.re-dialog__close-fab:focus-visible {
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.4);
}
.re-dialog__close-fab:active {
  transform: rotate(90deg) scale(0.95);
}
@media (prefers-reduced-motion: reduce) {
  .re-dialog__close-fab:hover {
    transform: scale(1.08);
  }
}
</style>
