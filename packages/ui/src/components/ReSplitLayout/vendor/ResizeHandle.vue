<script setup lang="ts">
/**
 * 分隔条（内联自 reactive-layout，MIT）。
 *
 * <p>鼠标按下后监听 document 的 mousemove/mouseup，持续把位移量抛给父级；
 * 拖动期间锁光标与文本选择，避免拖到面板文字上出现选中。</p>
 */
import { ref, onUnmounted } from 'vue';

const props = defineProps<{
  direction: 'horizontal' | 'vertical';
}>();

const emit = defineEmits<{
  resize: [delta: number];
  resizeEnd: [];
}>();

const active = ref(false);
let startPos = 0;

function onMouseDown(e: MouseEvent) {
  e.preventDefault();
  active.value = true;
  startPos = props.direction === 'horizontal' ? e.clientX : e.clientY;
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
}

function onMouseMove(e: MouseEvent) {
  const currentPos = props.direction === 'horizontal' ? e.clientX : e.clientY;
  const delta = currentPos - startPos;
  startPos = currentPos;
  emit('resize', delta);
}

function onMouseUp() {
  active.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  emit('resizeEnd');
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});
</script>

<template>
  <div class="resize-handle" :class="[direction, { active }]" @mousedown="onMouseDown" />
</template>

<style scoped>
.resize-handle {
  flex-shrink: 0;
  background: var(--border-subtle, #333);
  transition: background 0.15s;
  z-index: 10;
}
.resize-handle:hover,
.resize-handle.active {
  background: var(--brand-500, #007acc);
}
.resize-handle.horizontal {
  width: 5px;
  cursor: col-resize;
}
.resize-handle.vertical {
  height: 5px;
  cursor: row-resize;
}
</style>
