<template>
  <div
    ref="canvasEl"
    class="bigscreen-canvas"
    :class="{ 'bigscreen-canvas--edit': isEdit }"
    @mousedown.self="onCanvasClick"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- 网格背景 -->
    <svg v-if="isEdit" class="bigscreen-canvas__grid" :style="gridStyle">
      <defs>
        <pattern
          id="grid-pattern"
          :width="gridSize"
          :height="gridSize"
          patternUnits="userSpaceOnUse"
        >
          <path
            :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`"
            fill="none"
            stroke="rgba(0, 246, 255, 0.08)"
            stroke-width="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>

    <!-- Widgets -->
    <WidgetItem
      v-for="widget in widgets"
      :key="widget.id"
      :widget="widget"
      :is-edit="isEdit"
      :is-selected="widget.id === selectedId"
      @select="onSelectWidget"
      @remove="onRemoveWidget"
      @duplicate="onDuplicateWidget"
      @update-rect="onUpdateRect(widget.id, $event)"
    />

    <!-- 拖拽放置指示器 -->
    <div v-if="isDragOver" class="bigscreen-canvas__drop-indicator">
      <span>释放以添加组件</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { WidgetConfig, WidgetRect } from "../types/widget";
import { useDragDrop } from "../composables/useDragDrop";
import WidgetItem from "./WidgetItem.vue";

const { getDragType, clearDrag } = useDragDrop();

const props = defineProps<{
  widgets: WidgetConfig[];
  selectedId: string | null;
  isEdit: boolean;
  gridSize: number;
}>();

const emit = defineEmits<{
  select: [id: string];
  remove: [id: string];
  duplicate: [id: string];
  updateRect: [id: string, rect: Partial<WidgetRect>];
  addWidget: [type: string, rect: Partial<WidgetRect>];
  clearSelection: [];
}>();

const canvasEl = ref<HTMLElement | null>(null);
const isDragOver = ref(false);
const dropX = ref(0);
const dropY = ref(0);

const gridStyle = computed(() => ({
  backgroundSize: `${props.gridSize}px ${props.gridSize}px`,
}));

function onCanvasClick() {
  emit("clearSelection");
}

function onSelectWidget(id: string) {
  emit("select", id);
}

function onRemoveWidget(id: string) {
  emit("remove", id);
}

function onDuplicateWidget(id: string) {
  emit("duplicate", id);
}

function onUpdateRect(id: string, rect: Partial<WidgetRect>) {
  emit("updateRect", id, rect);
}

function onDragOver(e: DragEvent) {
  isDragOver.value = true;
  if (canvasEl.value) {
    const rect = canvasEl.value.getBoundingClientRect();
    dropX.value = e.clientX - rect.left;
    dropY.value = e.clientY - rect.top;
  }
}

function onDragLeave(e: DragEvent) {
  // 只在真正离开 canvas 时隐藏指示器（避免子元素触发）
  if (!canvasEl.value || !e.relatedTarget || !canvasEl.value.contains(e.relatedTarget as Node)) {
    isDragOver.value = false;
  }
}

function onDrop(e: DragEvent) {
  isDragOver.value = false;
  if (!canvasEl.value) return;

  // 优先 dataTransfer，fallback 到模块级变量
  const type = e.dataTransfer?.getData("widget-type") || getDragType();
  if (!type) return;

  const rect = canvasEl.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 读取变体信息（如果有）
  const variant = e.dataTransfer?.getData("widget-variant");

  emit("addWidget", type, { x, y, ...(variant ? { _variant: variant } : {}) });
  clearDrag();
}
</script>

<style lang="scss" scoped>
.bigscreen-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &--edit {
    cursor: crosshair;
  }

  &__grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__drop-indicator {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 246, 255, 0.05);
    border: 2px dashed rgba(0, 246, 255, 0.3);
    z-index: 999;

    span {
      font-size: 18px;
      color: rgba(0, 246, 255, 0.6);
      letter-spacing: 4px;
    }
  }
}
</style>
