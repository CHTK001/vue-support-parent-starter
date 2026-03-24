<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

defineOptions({
  name: "ReSplitPane",
});

const props = withDefaults(
  defineProps<{
    /** 分割方向 */
    split?: "vertical" | "horizontal";
    /** 最小尺寸(px) */
    minSize?: number;
    /** 最大尺寸(px) */
    maxSize?: number;
    /** 默认尺寸(px或百分比) */
    defaultSize?: number | string;
    /** 是否允许拖拽 */
    allowResize?: boolean;
  }>(),
  {
    split: "vertical",
    minSize: 50,
    maxSize: Infinity,
    defaultSize: "50%",
    allowResize: true,
  }
);

const emit = defineEmits<{
  resize: [size: number];
  resizeStart: [];
  resizeEnd: [];
}>();

const containerRef = ref<HTMLElement>();
const paneSize = ref<number>(0);
const isDragging = ref(false);

const isVertical = computed(() => props.split === "vertical");

const paneStyle = computed(() => {
  const size = `${paneSize.value}px`;
  return isVertical.value ? { width: size } : { height: size };
});

const resizerStyle = computed(() => ({
  cursor: isVertical.value ? "col-resize" : "row-resize",
}));

const containerClass = computed(() => [
  "split-pane-container",
  isVertical.value ? "split-vertical" : "split-horizontal",
]);

function getContainerSize() {
  if (!containerRef.value) return 0;
  return isVertical.value
    ? containerRef.value.offsetWidth
    : containerRef.value.offsetHeight;
}

function parseDefaultSize(): number {
  const containerSize = getContainerSize();
  if (typeof props.defaultSize === "number") {
    return props.defaultSize;
  }
  if (typeof props.defaultSize === "string" && props.defaultSize.endsWith("%")) {
    const percent = parseFloat(props.defaultSize) / 100;
    return containerSize * percent;
  }
  return containerSize / 2;
}

function clampSize(size: number): number {
  const containerSize = getContainerSize();
  const max = Math.min(props.maxSize, containerSize - props.minSize);
  return Math.max(props.minSize, Math.min(max, size));
}

function onMouseDown(e: MouseEvent) {
  if (!props.allowResize) return;
  e.preventDefault();
  isDragging.value = true;
  emit("resizeStart");
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || !containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const newSize = isVertical.value
    ? e.clientX - rect.left
    : e.clientY - rect.top;
  paneSize.value = clampSize(newSize);
  emit("resize", paneSize.value);
}

function onMouseUp() {
  isDragging.value = false;
  emit("resizeEnd");
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

onMounted(() => {
  paneSize.value = clampSize(parseDefaultSize());
});

onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<template>
  <div ref="containerRef" :class="containerClass">
    <div class="split-pane split-pane-first" :style="paneStyle">
      <slot name="first" />
    </div>
    <div
      v-if="allowResize"
      class="split-pane-resizer"
      :style="resizerStyle"
      @mousedown="onMouseDown"
    />
    <div class="split-pane split-pane-second">
      <slot name="second" />
    </div>
  </div>
</template>

<style scoped>
.split-pane-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.split-vertical {
  flex-direction: row;
}

.split-horizontal {
  flex-direction: column;
}

.split-pane {
  overflow: auto;
}

.split-pane-first {
  flex-shrink: 0;
}

.split-pane-second {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.split-pane-resizer {
  flex-shrink: 0;
  background: var(--el-border-color-light, #e4e7ed);
  transition: background 0.2s;
}

.split-vertical .split-pane-resizer {
  width: 4px;
}

.split-horizontal .split-pane-resizer {
  height: 4px;
}

.split-pane-resizer:hover {
  background: var(--el-color-primary, #409eff);
}
</style>
