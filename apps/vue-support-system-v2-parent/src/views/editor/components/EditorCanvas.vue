<template>
  <div
    ref="canvasEl"
    class="editor-canvas"
    :class="{ 'editor-canvas--edit': isEdit }"
    @mousedown.self="onCanvasClick"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- 网格背景 -->
    <svg v-if="isEdit" class="editor-canvas__grid">
      <defs>
        <pattern
          id="editor-grid-pattern"
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
      <rect width="100%" height="100%" fill="url(#editor-grid-pattern)" />
    </svg>

    <!-- Widgets -->
    <WidgetItem
      v-for="widget in widgets"
      :key="widget.id"
      :widget="widget"
      :is-edit="isEdit"
      :is-selected="widget.id === selectedId"
      :zoom="zoom"
      @select="(id: string) => $emit('select', id)"
      @remove="(id: string) => $emit('remove', id)"
      @duplicate="(id: string) => $emit('duplicate', id)"
      @open-data-binding="(id: string) => $emit('openDataBinding', id)"
      @update-rect="(payload: any) => $emit('updateWidgetRect', payload)"
    />

    <!-- 拖拽放置指示器 -->
    <div v-if="isDragOver && isEdit" class="editor-canvas__drop-indicator">
      <span>释放以添加组件</span>
    </div>

    <!-- 空白状态 -->
    <div v-if="widgets.length === 0 && !isDragOver" class="editor-canvas__empty">
      <div class="editor-canvas__empty-icon">
        <IconifyIconOffline icon="ep:plus" />
      </div>
      <p>从左侧组件库拖拽组件到此处</p>
      <p class="editor-canvas__empty-hint">支持自由拖拽、缩放、布局</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { WidgetConfig, WidgetRect } from "@layout/bigscreen";
import { WidgetItem } from "@layout/bigscreen";

const props = defineProps<{
  widgets: WidgetConfig[];
  selectedId: string | null;
  isEdit: boolean;
  gridSize: number;
  zoom: number;
}>();

const emit = defineEmits<{
  select: [id: string];
  remove: [id: string];
  duplicate: [id: string];
  openDataBinding: [id: string];
  updateWidgetRect: [payload: { id: string; rect: Partial<WidgetRect> }];
  addWidget: [payload: { type: string; x: number; y: number; variant?: string }];
  clearSelection: [];
}>();

const canvasEl = ref<HTMLElement | null>(null);
const isDragOver = ref(false);

function onCanvasClick() {
  emit("clearSelection");
}

function onDragOver(e: DragEvent) {
  if (!props.isEdit) return;
  isDragOver.value = true;
}

function onDragLeave(e: DragEvent) {
  if (!canvasEl.value || !e.relatedTarget || !canvasEl.value.contains(e.relatedTarget as Node)) {
    isDragOver.value = false;
  }
}

function onDrop(e: DragEvent) {
  isDragOver.value = false;
  if (!canvasEl.value || !props.isEdit) return;

  const type = e.dataTransfer?.getData("widget-type");
  if (!type) return;

  const rect = canvasEl.value.getBoundingClientRect();
  const scale = props.zoom || 1;
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;
  const variant = e.dataTransfer?.getData("widget-variant") || undefined;

  emit("addWidget", { type, x, y, variant });
}
</script>

<style lang="scss" scoped>
.editor-canvas {
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
    pointer-events: none;

    span {
      font-size: 18px;
      color: rgba(0, 246, 255, 0.6);
      letter-spacing: 4px;
    }
  }

  &__empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    color: rgba(255, 255, 255, 0.25);
    font-size: 14px;

    p {
      margin: 4px 0;
    }
  }

  &__empty-icon {
    font-size: 48px;
    color: rgba(0, 246, 255, 0.15);
    margin-bottom: 12px;
  }

  &__empty-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.15);
  }
}
</style>
