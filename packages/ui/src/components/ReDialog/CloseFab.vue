<script setup lang="ts">
/**
 * ReDialogCloseFab —— headless 模式下右上角圆形悬浮关闭按钮
 *
 * 圆心固定在右上角（top: 12px, right: 12px），z-index 高于 header。
 * 支持自定义背景色 / 颜色 / 尺寸。
 */
import { computed } from "vue";
import { ReIcon } from "@repo/ui/re-icon";

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
    <ReIcon icon="close" :size="Math.floor(size * 0.55)" />
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
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.04) inset;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  outline: none;
  padding: 0;
}
.re-dialog__close-fab:hover {
  background: var(--el-color-danger, #f56c6c);
  color: #fff;
  transform: rotate(90deg) scale(1.08);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.35);
}
.re-dialog__close-fab:focus-visible {
  box-shadow:
    0 0 0 3px rgba(64, 158, 255, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.08);
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
