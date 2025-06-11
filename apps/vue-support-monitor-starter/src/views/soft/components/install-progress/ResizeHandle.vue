<template>
  <div 
    class="resize-handle" 
    @mousedown="handleResizeStart"
    :class="{ 'resizing': resizing }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  minHeight: {
    type: Number,
    default: 150
  },
  maxHeight: {
    type: Number,
    default: window.innerHeight - 350
  },
  initialHeight: {
    type: Number,
    default: window.innerHeight - 450
  }
})

const emit = defineEmits(['resize'])

const resizing = ref(false)
const startY = ref(0)
const currentHeight = ref(props.initialHeight)

// 处理拖动开始
const handleResizeStart = (e: MouseEvent) => {
  resizing.value = true
  startY.value = e.clientY
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
  // 阻止默认行为和冒泡
  e.preventDefault()
  e.stopPropagation()
}

// 处理拖动移动
const handleResizeMove = (e: MouseEvent) => {
  if (!resizing.value) return
  
  const deltaY = startY.value - e.clientY
  let newHeight = currentHeight.value + deltaY
  
  // 限制高度范围
  newHeight = Math.max(props.minHeight, Math.min(props.maxHeight, newHeight))
  
  // 更新高度
  currentHeight.value = newHeight
  
  // 发送调整事件
  emit('resize', newHeight)
  
  // 更新起始位置
  startY.value = e.clientY
}

// 处理拖动结束
const handleResizeEnd = () => {
  resizing.value = false
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
}

// 组件销毁前移除事件监听器
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
})
</script>

<style lang="scss" scoped>
.resize-handle {
  height: 6px;
  cursor: ns-resize;
  background-color: var(--el-border-color-lighter);
  position: relative;
  
  &:hover, &.resizing {
    background-color: var(--el-color-primary-light-7);
  }
  
  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 2px;
    background-color: var(--el-border-color);
    border-radius: 1px;
  }
}
</style> 