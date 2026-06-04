<template>
  <div
    ref="el"
    class="widget-item"
    :class="{
      'widget-item--selected': isSelected,
      'widget-item--locked': widget.locked,
      'widget-item--edit': isEdit,
      'widget-item--dragging': isDragging,
      'widget-item--resizing': isResizing,
    }"
    :style="widgetStyle"
    @mousedown.stop="handleSelect"
  >
    <!-- Widget 内容 -->
    <div class="widget-item__body" :style="bodyStyle">
      <WidgetRenderer :widget="widget" :key="widget.variant + '-' + widget.type" />
    </div>

    <!-- 编辑模式覆盖层 -->
    <template v-if="isEdit">
      <!-- 拖拽手柄 -->
      <div class="widget-item__drag-handle" @pointerdown.prevent="onDragStart" />

      <!-- 选中时的 resize 手柄 -->
      <template v-if="isSelected">
        <div
          v-for="handle in RESIZE_HANDLES"
          :key="handle"
          class="widget-item__resize-handle"
          :class="`widget-item__resize-handle--${handle}`"
          :data-handle="handle"
          @pointerdown.prevent.stop="onResizeStart($event, handle)"
        />
      </template>

      <!-- 悬停时显示的操作按钮 -->
      <div v-if="isSelected" class="widget-item__actions">
        <button
          class="widget-item__action-btn"
          title="数据绑定"
          @click.stop="$emit('openDataBinding', widget.id)"
        >
          <IconifyIconOffline icon="ep:setting" />
        </button>
        <button
          class="widget-item__action-btn"
          title="删除"
          @click.stop="$emit('remove', widget.id)"
        >
          <IconifyIconOffline icon="ep:close" />
        </button>
        <button
          class="widget-item__action-btn"
          title="复制"
          @click.stop="$emit('duplicate', widget.id)"
        >
          <IconifyIconOffline icon="ep:copy-document" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { WidgetConfig } from "../types/widget";
import WidgetRenderer from "./WidgetRenderer.vue";

const RESIZE_HANDLES = [
  "top-left", "top-right", "bottom-left", "bottom-right",
  "top", "bottom", "left", "right",
] as const;

type ResizeHandle = (typeof RESIZE_HANDLES)[number];

const props = defineProps<{
  widget: WidgetConfig;
  isEdit: boolean;
  isSelected: boolean;
  zoom?: number;
}>();

const zoom = computed(() => props.zoom || 1);

const emit = defineEmits<{
  select: [id: string];
  remove: [id: string];
  duplicate: [id: string];
  openDataBinding: [id: string];
  updateRect: [payload: { id: string; rect: { x?: number; y?: number; width?: number; height?: number } }];
}>();

const el = ref<HTMLElement | null>(null);

const isDragging = ref(false);
const isResizing = ref(false);

/** 拖拽/缩放期间的临时位置 （直接操作 DOM style，避免响应式开销） */
let dragState: {
  startX: number; startY: number; startW: number; startH: number;
  startLeft: number; startTop: number; handle: ResizeHandle | null;
  canvasEl: HTMLElement;
} | null = null;

const widgetStyle = computed(() => ({
  position: "absolute" as const,
  left: `${props.widget.rect.x}px`,
  top: `${props.widget.rect.y}px`,
  width: `${props.widget.rect.width}px`,
  height: `${props.widget.rect.height}px`,
  zIndex: props.widget.zIndex,
  opacity: props.widget.opacity,
  display: props.widget.visible ? "block" : "none",
}));

const bodyStyle = computed(() => {
  if (props.widget.customCSS?.enabled && props.widget.customCSS.styles) {
    return { cssText: props.widget.customCSS.styles };
  }
  return {};
});

function handleSelect() {
  if (props.isEdit) {
    emit("select", props.widget.id);
  }
}

function getCanvasEl(): HTMLElement | null {
  return el.value?.parentElement ?? null;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(val, max));
}

// ─── Drag ────────────────────────────────────────────────

function onDragStart(e: PointerEvent) {
  if (!props.isEdit || !el.value) return;
  emit("select", props.widget.id);

  const canvas = getCanvasEl();
  if (!canvas) return;

  el.value.setPointerCapture(e.pointerId);
  isDragging.value = true;

  dragState = {
    startX: e.clientX,
    startY: e.clientY,
    startLeft: props.widget.rect.x,
    startTop: props.widget.rect.y,
    startW: 0, startH: 0,
    handle: null,
    canvasEl: canvas,
  };

  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
}

function onDragMove(e: PointerEvent) {
  if (!dragState || !el.value) return;

  const scale = zoom.value;
  const dx = (e.clientX - dragState.startX) / scale;
  const dy = (e.clientY - dragState.startY) / scale;
  const canvasW = dragState.canvasEl.clientWidth;
  const canvasH = dragState.canvasEl.clientHeight;

  const newX = clamp(dragState.startLeft + dx, 0, canvasW - props.widget.rect.width);
  const newY = clamp(dragState.startTop + dy, 0, canvasH - props.widget.rect.height);

  // 直接操作 DOM style，不触发响应式
  el.value.style.left = `${newX}px`;
  el.value.style.top = `${newY}px`;
}

function onDragEnd(_e: PointerEvent) {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  isDragging.value = false;

  if (!dragState || !el.value) return;

  const finalLeft = parseFloat(el.value.style.left);
  const finalTop = parseFloat(el.value.style.top);

  // 只在此刻提交到 store
  emit("updateRect", {
    id: props.widget.id,
    rect: { x: finalLeft, y: finalTop },
  });

  dragState = null;
}

// ─── Resize ──────────────────────────────────────────────

function onResizeStart(e: PointerEvent, handle: ResizeHandle) {
  if (!props.isEdit || !el.value) return;
  emit("select", props.widget.id);

  const canvas = getCanvasEl();
  if (!canvas) return;

  el.value.setPointerCapture(e.pointerId);
  isResizing.value = true;

  dragState = {
    startX: e.clientX,
    startY: e.clientY,
    startLeft: props.widget.rect.x,
    startTop: props.widget.rect.y,
    startW: props.widget.rect.width,
    startH: props.widget.rect.height,
    handle,
    canvasEl: canvas,
  };

  window.addEventListener("pointermove", onResizeMove);
  window.addEventListener("pointerup", onResizeEnd);
}

function onResizeMove(e: PointerEvent) {
  if (!dragState || !dragState.handle || !el.value) return;

  const scale = zoom.value;
  const dx = (e.clientX - dragState.startX) / scale;
  const dy = (e.clientY - dragState.startY) / scale;
  const h = dragState.handle;
  const canvasW = dragState.canvasEl.clientWidth;
  const canvasH = dragState.canvasEl.clientHeight;
  const MIN_W = 40;
  const MIN_H = 30;

  let newX = dragState.startLeft;
  let newY = dragState.startTop;
  let newW = dragState.startW;
  let newH = dragState.startH;

  if (h.includes("right")) {
    newW = clamp(dragState.startW + dx, MIN_W, canvasW - newX);
  }
  if (h.includes("left")) {
    const maxW = dragState.startW + dragState.startLeft;
    newW = clamp(dragState.startW - dx, MIN_W, maxW);
    newX = dragState.startLeft + dragState.startW - newW;
  }
  if (h.includes("bottom")) {
    newH = clamp(dragState.startH + dy, MIN_H, canvasH - newY);
  }
  if (h.includes("top")) {
    const maxH = dragState.startH + dragState.startTop;
    newH = clamp(dragState.startH - dy, MIN_H, maxH);
    newY = dragState.startTop + dragState.startH - newH;
  }
  if (h === "top" || h === "bottom") {
    newH = clamp(dragState.startH + dy, MIN_H, canvasH - newY);
  }
  if (h === "left" || h === "right") {
    newW = clamp(dragState.startW + dx, MIN_W, canvasW - newX);
  }

  // 直接操作 DOM style
  el.value.style.left = `${newX}px`;
  el.value.style.top = `${newY}px`;
  el.value.style.width = `${newW}px`;
  el.value.style.height = `${newH}px`;
}

function onResizeEnd(_e: PointerEvent) {
  window.removeEventListener("pointermove", onResizeMove);
  window.removeEventListener("pointerup", onResizeEnd);
  isResizing.value = false;

  if (!dragState || !el.value) return;

  const finalLeft = parseFloat(el.value.style.left);
  const finalTop = parseFloat(el.value.style.top);
  const finalW = parseFloat(el.value.style.width);
  const finalH = parseFloat(el.value.style.height);

  emit("updateRect", {
    id: props.widget.id,
    rect: { x: finalLeft, y: finalTop, width: finalW, height: finalH },
  });

  dragState = null;
}

// ─── Lifecycle ───────────────────────────────────────────

onMounted(() => {});
onUnmounted(() => {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointermove", onResizeMove);
  window.removeEventListener("pointerup", onResizeEnd);
});
</script>

<style lang="scss" scoped>
.widget-item {
  position: absolute;
  cursor: default;
  box-sizing: border-box;
  will-change: left, top;

  &--edit {
    cursor: move;
  }

  &--dragging,
  &--resizing {
    transition: none !important;
    will-change: left, top, width, height;
  }

  &--selected {
    outline: 2px solid rgba(0, 246, 255, 0.8);
    outline-offset: -1px;
    box-shadow: 0 0 12px rgba(0, 246, 255, 0.3);
  }

  &--locked {
    cursor: not-allowed;
  }

  &__body {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  &__drag-handle {
    position: absolute;
    inset: 0;
    z-index: 10;
    touch-action: none;
  }

  &__resize-handle {
    position: absolute;
    z-index: 20;
    background: rgba(0, 246, 255, 0.6);
    border: 1px solid rgba(0, 246, 255, 0.9);
    touch-action: none;

    &--top-left,
    &--top-right,
    &--bottom-left,
    &--bottom-right {
      width: 8px;
      height: 8px;
    }

    &--top-left {
      top: -4px; left: -4px; cursor: nwse-resize;
    }
    &--top-right {
      top: -4px; right: -4px; cursor: nesw-resize;
    }
    &--bottom-left {
      bottom: -4px; left: -4px; cursor: nesw-resize;
    }
    &--bottom-right {
      bottom: -4px; right: -4px; cursor: nwse-resize;
    }
    &--top,
    &--bottom {
      left: 50%; transform: translateX(-50%); width: 24px; height: 4px;
    }
    &--top {
      top: -2px; cursor: ns-resize;
    }
    &--bottom {
      bottom: -2px; cursor: ns-resize;
    }
    &--left,
    &--right {
      top: 50%; transform: translateY(-50%); width: 4px; height: 24px;
    }
    &--left {
      left: -2px; cursor: ew-resize;
    }
    &--right {
      right: -2px; cursor: ew-resize;
    }
  }

  &__actions {
    position: absolute;
    top: -32px;
    right: 0;
    display: flex;
    gap: 4px;
    z-index: 30;
  }

  &__action-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 20, 40, 0.85);
    border: 1px solid rgba(0, 246, 255, 0.5);
    border-radius: 4px;
    color: rgba(0, 246, 255, 0.9);
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    transition: all 0.15s;

    &:hover {
      background: rgba(255, 50, 50, 0.4);
      border-color: rgba(255, 50, 50, 0.8);
      color: #fff;
    }
  }
}
</style>