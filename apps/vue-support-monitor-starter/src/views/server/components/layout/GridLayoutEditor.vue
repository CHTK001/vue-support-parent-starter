<template>
  <div class="grid-layout-editor">
    <div 
      class="grid-container"
      :class="{ 'edit-mode': editMode }"
      ref="gridContainer"
    >
      <div
        v-for="item in layout"
        :key="item.i"
        class="grid-item"
        :style="getItemStyle(item)"
        @mousedown="handleMouseDown($event, item)"
      >
        <slot name="component" :item="item" />
        
        <!-- 编辑模式下的调整手柄 -->
        <div v-if="editMode" class="resize-handles">
          <div 
            class="resize-handle resize-handle-se"
            @mousedown.stop="handleResizeStart($event, item, 'se')"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

// 定义属�?
const props = defineProps<{
  layout: any[];
  editMode: boolean;
  cols?: number;
  rowHeight?: number;
  margin?: [number, number];
}>();

// 定义事件
const emit = defineEmits<{
  'layout-updated': [layout: any[]];
  'component-edit': [component: any];
  'component-delete': [componentId: number];
}>();

// 响应式状�?
const gridContainer = ref<HTMLElement>();
const isDragging = ref(false);
const isResizing = ref(false);
const dragItem = ref<any>(null);
const resizeItem = ref<any>(null);
const resizeDirection = ref("");
const startPos = ref({ x: 0, y: 0 });
const startSize = ref({ w: 0, h: 0 });
const startPosition = ref({ x: 0, y: 0 });

// 计算属�?
const cols = computed(() => props.cols || 12);
const rowHeight = computed(() => props.rowHeight || 60);
const margin = computed(() => props.margin || [10, 10]);

/**
 * 获取网格项样�?
 */
const getItemStyle = (item: any) => {
  const containerWidth = gridContainer.value?.clientWidth || 1200;
  const colWidth = (containerWidth - margin.value[0] * (cols.value + 1)) / cols.value;
  
  const left = margin.value[0] + item.x * (colWidth + margin.value[0]);
  const top = margin.value[1] + item.y * (rowHeight.value + margin.value[1]);
  const width = item.w * colWidth + (item.w - 1) * margin.value[0];
  const height = item.h * rowHeight.value + (item.h - 1) * margin.value[1];

  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    transition: isDragging.value || isResizing.value ? 'none' : 'all 0.2s ease',
    zIndex: (isDragging.value && dragItem.value?.i === item.i) || 
            (isResizing.value && resizeItem.value?.i === item.i) ? 1000 : 1
  };
};

/**
 * 鼠标按下处理（拖拽开始）
 */
const handleMouseDown = (event: MouseEvent, item: any) => {
  if (!props.editMode) return;
  
  event.preventDefault();
  isDragging.value = true;
  dragItem.value = item;
  startPos.value = { x: event.clientX, y: event.clientY };
  startPosition.value = { x: item.x, y: item.y };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

/**
 * 调整大小开�?
 */
const handleResizeStart = (event: MouseEvent, item: any, direction: string) => {
  event.preventDefault();
  event.stopPropagation();
  
  isResizing.value = true;
  resizeItem.value = item;
  resizeDirection.value = direction;
  startPos.value = { x: event.clientX, y: event.clientY };
  startSize.value = { w: item.w, h: item.h };
  
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
};

/**
 * 鼠标移动处理
 */
const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !dragItem.value) return;
  
  const deltaX = event.clientX - startPos.value.x;
  const deltaY = event.clientY - startPos.value.y;
  
  const containerWidth = gridContainer.value?.clientWidth || 1200;
  const colWidth = (containerWidth - margin.value[0] * (cols.value + 1)) / cols.value;
  
  const deltaGridX = Math.round(deltaX / (colWidth + margin.value[0]));
  const deltaGridY = Math.round(deltaY / (rowHeight.value + margin.value[1]));
  
  const newX = Math.max(0, Math.min(cols.value - dragItem.value.w, startPosition.value.x + deltaGridX));
  const newY = Math.max(0, startPosition.value.y + deltaGridY);
  
  // 更新布局
  const newLayout = props.layout.map(item => {
    if (item.i === dragItem.value.i) {
      return { ...item, x: newX, y: newY };
    }
    return item;
  });
  
  emit('layout-updated', newLayout);
};

/**
 * 调整大小移动
 */
const handleResizeMove = (event: MouseEvent) => {
  if (!isResizing.value || !resizeItem.value) return;
  
  const deltaX = event.clientX - startPos.value.x;
  const deltaY = event.clientY - startPos.value.y;
  
  const containerWidth = gridContainer.value?.clientWidth || 1200;
  const colWidth = (containerWidth - margin.value[0] * (cols.value + 1)) / cols.value;
  
  const deltaGridX = Math.round(deltaX / (colWidth + margin.value[0]));
  const deltaGridY = Math.round(deltaY / (rowHeight.value + margin.value[1]));
  
  let newW = startSize.value.w;
  let newH = startSize.value.h;
  
  if (resizeDirection.value.includes('e')) {
    newW = Math.max(1, Math.min(cols.value - resizeItem.value.x, startSize.value.w + deltaGridX));
  }
  if (resizeDirection.value.includes('s')) {
    newH = Math.max(1, startSize.value.h + deltaGridY);
  }
  
  // 更新布局
  const newLayout = props.layout.map(item => {
    if (item.i === resizeItem.value.i) {
      return { ...item, w: newW, h: newH };
    }
    return item;
  });
  
  emit('layout-updated', newLayout);
};

/**
 * 鼠标释放处理
 */
const handleMouseUp = () => {
  isDragging.value = false;
  dragItem.value = null;
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
};

/**
 * 调整大小结束
 */
const handleResizeEnd = () => {
  isResizing.value = false;
  resizeItem.value = null;
  resizeDirection.value = "";
  
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
};

/**
 * 窗口大小变化处理
 */
const handleResize = () => {
  // 重新计算布局
  emit('layout-updated', [...props.layout]);
};

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
});
</script>

<style lang="scss" scoped>
.grid-layout-editor {
  width: 100%;
  height: 100%;
  position: relative;

  .grid-container {
    position: relative;
    width: 100%;
    min-height: 400px;

    &.edit-mode {
      .grid-item {
        cursor: move;
        
        &:hover {
          box-shadow: 0 0 0 2px var(--el-color-primary);
        }
      }
    }

    .grid-item {
      border-radius: 8px;
      overflow: hidden;
      user-select: none;

      .resize-handles {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;

        .resize-handle {
          position: absolute;
          pointer-events: all;
          background: var(--el-color-primary);
          border: 2px solid var(--el-bg-color);
          border-radius: 50%;

          &.resize-handle-se {
            bottom: -6px;
            right: -6px;
            width: 12px;
            height: 12px;
            cursor: se-resize;
          }

          &:hover {
            background: var(--el-color-primary-light-3);
          }
        }
      }
    }
  }
}
</style>
