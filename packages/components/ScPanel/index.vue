<template>
  <el-popover
    :visible="visible"
    :placement="popoverPlacement"
    :width="popoverWidth"
    :trigger="'manual'"
    :show-arrow="false"
    :offset="10"
    :hide-after="0"
    :persistent="false"
    popper-class="sc-panel-popover"
    @update:visible="handleVisibleChange"
  >
    <template #reference>
      <slot name="reference" />
    </template>

    <div class="sc-panel-content" :style="contentStyle">
      <slot />
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  visible?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  width?: string | number;
  maxHeight?: string | number;
  closeOnClickOutside?: boolean;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "close"): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  position: "bottom-right",
  width: "320px",
  maxHeight: "460px",
  closeOnClickOutside: true
});

const emit = defineEmits<Emits>();

// 将position转换为el-popover的placement
const popoverPlacement = computed(() => {
  const positionMap = {
    "top-right": "top-end",
    "top-left": "top-start",
    "bottom-right": "bottom-end",
    "bottom-left": "bottom-start"
  };
  return positionMap[props.position] || "bottom-end";
});

// 计算popover宽度
const popoverWidth = computed(() => {
  return typeof props.width === "number" ? props.width : parseInt(props.width) || 320;
});

// 内容样式
const contentStyle = computed(() => ({
  maxHeight: typeof props.maxHeight === "number" ? `${props.maxHeight}px` : props.maxHeight,
  overflow: "hidden"
}));

const handleVisibleChange = (visible: boolean) => {
  if (!visible && props.closeOnClickOutside) {
    emit("update:visible", false);
    emit("close");
  }
};
</script>

<style scoped>
/* 内容容器样式 */
.sc-panel-content {
  border-radius: 12px;
  background: color-mix(in oklab, var(--el-bg-color-overlay, var(--el-bg-color-overlay)) 88%, black 12%);
  border: 1px solid color-mix(in oklab, var(--el-border-color, var(--el-border-color)) 70%, transparent 30%);
  box-shadow:
    0 18px 48px var(--el-shadow-color, rgba(0, 0, 0, 0.24)),
    0 4px 10px rgba(0, 0, 0, 0.16);
  backdrop-filter: saturate(140%) blur(6px);
  -webkit-backdrop-filter: saturate(140%) blur(6px);
}

/* 暗色主题下的面板样式 */
.dark .sc-panel-content {
  background: color-mix(in oklab, var(--el-bg-color-overlay, var(--el-bg-color-overlay)) 92%, black 8%);
  border-color: color-mix(in oklab, var(--el-border-color, var(--el-border-color)) 80%, transparent 20%);
  box-shadow:
  0 18px 48px var(--el-shadow-color, rgba(0, 0, 0, 0.24)),
  0 4px 10px rgba(0, 0, 0, 0.22);
}
</style>

<style>
/* 全局样式：自定义el-popover外观 */
.sc-panel-popover {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.sc-panel-popover .el-popover__content {
  padding: 0 !important;
  margin: 0 !important;
}
</style>
