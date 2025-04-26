<template>
  <div class="map-layer-dropdown" :class="{ 'is-visible': isVisible }" v-if="isVisible || isAnimating" :style="dropdownStyle">
    <div class="dropdown-header">
      <span>选择图层</span>
      <span class="close-btn" @click="close">×</span>
    </div>
    <div class="dropdown-body">
      <div 
        v-for="(layer, key) in mapTypes" 
        :key="key" 
        class="layer-item" 
        :class="{ active: currentLayer === key }"
        @click="selectLayer(String(key))"
      >
        <div class="layer-icon">
          <span class="layer-check" v-if="currentLayer === key">✓</span>
        </div>
        <div class="layer-name">{{ layer.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps, watch, onBeforeUnmount } from 'vue';
import type { MapTypes } from '../types';
import { LayerType } from '../types';

interface Props {
  mapTypes: MapTypes;
  position: { x: number; y: number };
  currentLayer: string;
  visible: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  currentLayer: LayerType.NORMAL,
  position: () => ({ x: 0, y: 0 })
});

const emit = defineEmits<{
  (e: 'select', layer: string): void;
  (e: 'close'): void;
}>();

// 用于控制动画和显示状态的变量
const isVisible = ref(props.visible);
const isAnimating = ref(false);
let animationTimeout: number | null = null;

// 监听 visible 属性变化
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 立即显示元素
    isVisible.value = true;
    isAnimating.value = true;
  } else {
    // 延迟隐藏元素，等待动画完成
    isVisible.value = false;
    isAnimating.value = true;
    
    // 清除之前的定时器
    if (animationTimeout !== null) {
      window.clearTimeout(animationTimeout);
    }
    
    // 设置新的定时器，在动画结束后完全隐藏元素
    animationTimeout = window.setTimeout(() => {
      isAnimating.value = false;
    }, 250); // 动画持续时间
  }
}, { immediate: true });

// 在组件销毁前清除定时器
onBeforeUnmount(() => {
  if (animationTimeout !== null) {
    window.clearTimeout(animationTimeout);
  }
});

// 计算下拉框样式
const dropdownStyle = computed(() => {
  return {
    left: `${props.position.x}px`,
    top: `${props.position.y}px`
  };
});

// 选择图层
const selectLayer = (layer: string) => {
  emit('select', layer);
  emit('close');
};

// 关闭下拉框
const close = () => {
  isVisible.value = false;
  isAnimating.value = true;
  
  // 清除之前的定时器
  if (animationTimeout !== null) {
    window.clearTimeout(animationTimeout);
  }
  
  // 设置新的定时器，在动画结束后完全隐藏元素
  animationTimeout = window.setTimeout(() => {
    isAnimating.value = false;
  }, 250);
  
  emit('close');
};
</script>

<style lang="scss" scoped>
.map-layer-dropdown {
  position: absolute;
  z-index: 2500;
  width: 160px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  font-size: 14px;
  user-select: none;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  
  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  // 非可见状态添加过渡效果
  &:not(.is-visible) {
    opacity: 0;
    transform: translateY(-10px);
  }
  
  .dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e8e8e8;
    font-weight: bold;
    
    .close-btn {
      cursor: pointer;
      font-size: 18px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    }
  }
  
  .dropdown-body {
    max-height: 300px;
    overflow-y: auto;
    
    .layer-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      transition: background-color 0.3s;
      
      &:hover {
        background-color: #f5f7fa;
      }
      
      &.active {
        background-color: #e6f7ff;
        color: #1890ff;
      }
      
      .layer-icon {
        width: 20px;
        height: 20px;
        margin-right: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .layer-check {
          color: #1890ff;
          font-weight: bold;
        }
      }
      
      .layer-name {
        flex: 1;
      }
    }
  }
}
</style> 