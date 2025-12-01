<template>
  <template v-if="!minimized">
    <!-- 四条边 -->
    <div class="resize-handle resize-top" @mousedown.stop="handleMouseDown($event, 'top')" />
    <div class="resize-handle resize-right" @mousedown.stop="handleMouseDown($event, 'right')" />
    <div class="resize-handle resize-bottom" @mousedown.stop="handleMouseDown($event, 'bottom')" />
    <div class="resize-handle resize-left" @mousedown.stop="handleMouseDown($event, 'left')" />

    <!-- 四个角 -->
    <div class="resize-handle resize-top-left" @mousedown.stop="handleMouseDown($event, 'top-left')" />
    <div class="resize-handle resize-top-right" @mousedown.stop="handleMouseDown($event, 'top-right')" />
    <div class="resize-handle resize-bottom-left" @mousedown.stop="handleMouseDown($event, 'bottom-left')" />
    <div class="resize-handle resize-bottom-right" @mousedown.stop="handleMouseDown($event, 'bottom-right')" />
  </template>
</template>

<script setup lang="ts">
interface Props {
  minimized?: boolean;
}

withDefaults(defineProps<Props>(), {
  minimized: false
});

const emit = defineEmits<{
  resizeStart: [event: MouseEvent, direction: string];
}>();

const handleMouseDown = (event: MouseEvent, direction: string) => {
  emit("resizeStart", event, direction);
};
</script>

<style scoped>
/* 调整大小手柄 */
.resize-handle {
  position: absolute;
  z-index: 10;
}

.resize-top,
.resize-bottom {
  width: 100%;
  height: 5px;
  cursor: ns-resize;
}

.resize-left,
.resize-right {
  width: 5px;
  height: 100%;
  cursor: ew-resize;
}

.resize-top {
  top: 0;
  left: 0;
}

.resize-right {
  top: 0;
  right: 0;
}

.resize-bottom {
  bottom: 0;
  left: 0;
}

.resize-left {
  top: 0;
  left: 0;
}

.resize-top-left,
.resize-top-right,
.resize-bottom-left,
.resize-bottom-right {
  width: 10px;
  height: 10px;
}

.resize-top-left {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.resize-top-right {
  top: 0;
  right: 0;
  cursor: nesw-resize;
}

.resize-bottom-left {
  bottom: 0;
  left: 0;
  cursor: nesw-resize;
}

.resize-bottom-right {
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
}
</style>
