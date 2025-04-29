/**
 * 地图图层下拉框
 * @author CH
 * @date 2025-04-29
 */
<template>
  <div class="map-layer-dropdown" :class="{ 'is-visible': isVisible, 'placement-top': placement === 'top', 'placement-bottom': placement === 'bottom' }" v-if="isVisible || isAnimating" :style="dropdownStyle">
    <div class="dropdown-body">
      <div class="dropdown-header">
        <span></span>
        <span class="close-btn" @click="close">×</span>
      </div>
      <div class="layer-container">
        <div 
          v-for="(layer, key) in mapTypes" 
          :key="key" 
          class="layer-item" 
          :class="{ active: String(currentLayer) === String(key) }"
          @click="selectLayer(String(key))"
        >
          <div class="layer-image" :class="{ active: String(currentLayer) === String(key) }">
            <img :src="layer.image || getDefaultImage(key)" :alt="layer.name" />
            <div class="layer-name">{{ layer.name }}</div>
            <div class="layer-check" v-if="String(currentLayer) === String(key)">
              <span>✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps, watch, onBeforeUnmount, nextTick } from 'vue';
import type { MapTypes } from '../types';
import { LayerType } from '../types';

interface Props {
  mapTypes: MapTypes;
  position: {
    x: number;
    y: number;
    mapWidth?: number;
    mapHeight?: number;
    buttonWidth?: number;
    buttonHeight?: number;
    isRightSide?: boolean;
    isBottomSide?: boolean;
  };
  currentLayer: string;
  visible: boolean;
  placement?: 'top' | 'bottom'; // 添加一个位置参数，用于控制下拉框在按钮上方还是下方
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  currentLayer: LayerType.NORMAL,
  position: () => ({ x: 0, y: 0 }),
  placement: 'bottom'
});

const emit = defineEmits<{
  (e: 'select', layer: string): void;
  (e: 'close'): void;
}>();

const position = ref(props.position);
const placement = ref(props.placement);
// 用于控制动画和显示状态的变量
const isVisible = ref(props.visible);
const isAnimating = ref(false);
let animationTimeout: number | null = null;
let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;


watch(() => props.placement, (newValue) => {
  placement.value = newValue;
}, { deep: true, immediate: true });

watch(() => props.position, (newValue) => {
  position.value = newValue;
}, { deep: true, immediate: true });

// 监听 visible 属性变化
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 立即显示元素
    isVisible.value = true;
    isAnimating.value = true;
    
    // 添加点击外部关闭事件监听
    nextTick(() => {
      document.addEventListener('mousedown', handleClickOutside);
      clickOutsideHandler = handleClickOutside;
    });
  } else {
    // 延迟隐藏元素，等待动画完成
    isVisible.value = false;
    isAnimating.value = true;
    
    // 移除点击外部关闭事件监听
    if (clickOutsideHandler) {
      document.removeEventListener('mousedown', clickOutsideHandler);
      clickOutsideHandler = null;
    }
    
    // 清除之前的定时器
    if (animationTimeout !== null) {
      window.clearTimeout(animationTimeout);
    }
    
    // 设置新的定时器，在动画结束后完全隐藏元素
    animationTimeout = window.setTimeout(() => {
      isAnimating.value = false;
    }, 250); // 动画持续时间
  }
}, { immediate: true, deep: true });

// 在组件销毁前清除定时器和事件监听
onBeforeUnmount(() => {
  if (animationTimeout !== null) {
    window.clearTimeout(animationTimeout);
  }
  
  if (clickOutsideHandler) {
    document.removeEventListener('mousedown', clickOutsideHandler);
  }
});

// 处理点击外部事件
const handleClickOutside = (e: MouseEvent) => {
  const dropdownEl = document.querySelector('.map-layer-dropdown');
  if (dropdownEl && !dropdownEl.contains(e.target as Node)) {
    close();
  }
};

// 计算下拉框样式
const dropdownStyle = computed(() => {
  const style: Record<string, string> = {};
  const {
    x, y, mapWidth = window.innerWidth, mapHeight = window.innerHeight,
    buttonWidth = 40, buttonHeight = 40,
    isRightSide = false, isBottomSide = false
  } = position.value;
  
  // 下拉框的尺寸
  const dropdownWidth = 460;
  const dropdownHeight = Math.min(350, mapHeight * 0.7); // 限制最大高度
  
  // 设置宽度
  style.width = `${dropdownWidth}px`;
  
  // 计算水平位置 - 直接使用传递过来的x坐标，无需再次计算
  if (isRightSide) {
    // 使用左侧定位，确保下拉框显示在正确位置
    style.left = `${x}px`;
    style.right = 'auto';
  } else {
    // 使用左侧定位
    style.left = `${x}px`;
    style.right = 'auto';
  }
  
  // 计算垂直位置
  if (placement.value === 'top') {
    // 显示在按钮上方
    style.bottom = `${mapHeight - y + 5}px`; // 增加5px间距
    style.top = 'auto';
    style.transformOrigin = 'bottom center';
  } else {
    // 显示在按钮下方
    style.top = `${y}px`; 
    style.bottom = 'auto';
    style.transformOrigin = 'top center';
  }
  
  return style;
});

// 获取默认图片
const getDefaultImage = (layerType: string | number) => {
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiNjY2MiLz48L3N2Zz4=';
};

// 选择图层
const selectLayer = (layer: string) => {
  // 确保向父组件传递正确的图层类型字符串
  const layerTypeString = String(layer);
  emit('select', layerTypeString);
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
  max-width: 90vw;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  font-size: 14px;
  user-select: none;
  opacity: 0;
  transform: scale(0.95);
  transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
  max-height: 80vh;
  transform-origin: center top;
  
  @media screen and (max-width: 480px) {
    width: calc(100% - 20px);
    max-width: calc(100% - 20px);
  }
  
  &.is-visible {
    opacity: 1;
    transform: scale(1);
  }
  
  // 非可见状态添加过渡效果
  &:not(.is-visible) {
    opacity: 0;
    transform: scale(0.95);
  }
  
  // 根据位置调整变换原点和边距
  &.placement-top {
    margin-bottom: 12px;
    transform-origin: center bottom;
  }
  
  &.placement-bottom {
    margin-top: 12px;
    transform-origin: center top;
  }
  
  .dropdown-body {
    max-height: 65vh;
    overflow-y: auto;
    padding:  0px 8px;
    position: relative;
    
    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: #ccc;
    }
    
    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      color: #444;
      
      .close-btn {
        cursor: pointer;
        font-size: 20px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
        color: #666;
        
        &:hover {
          background-color: rgba(0, 0, 0, 0.1);
          color: #333;
        }
      }
    }
    
    .layer-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      
      .layer-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 6px;
        margin: 5px;
        
        @media screen and (max-width: 480px) {
          width: 70px;
          margin: 4px;
        }
        
        &:hover {
          transform: translateY(-2px);
          background-color: rgba(0, 0, 0, 0.02);
          
          .layer-image {
            position: relative;
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
            
            .layer-name {
              background-color: rgba(0, 0, 0, 0.7);
              padding: 4px 6px;
            }
            
            img {
              transform: scale(1.05);
            }
          }
        }
        
        &.active {
          transform: translateY(-2px);
          background-color: rgba(24, 144, 255, 0.05);
          
          .layer-image .layer-name {
            background-color: rgba(24, 144, 255, 0.8);
            font-weight: 500;
          }
        }
        
        .layer-image {
          position: relative;
          width: 90px;
          height: 68px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid transparent;
          transition: all 0.3s ease;
          
          @media screen and (max-width: 480px) {
            width: 64px;
            height: 64px;
          }
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }
          
          &:hover {
            border-color: #d9d9d9;
          }
          
          &.active {
            border-color: #1890ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
          }
          
          .layer-name {
            position: absolute;
            bottom: 0;
            right: 0;
            max-width: 100%;
            padding: 3px 5px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            font-size: 10px;
            text-align: right;
            border-radius: 4px 0 0 0;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            transition: all 0.3s ease;
            backdrop-filter: blur(2px);
          }
          
          .layer-check {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(24, 144, 255, 0.2);
            color: white;
            animation: fadeIn 0.3s ease-in-out;
            
            span {
              background-color: #1890ff;
              border-radius: 50%;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: bold;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              animation: scaleIn 0.3s ease-in-out;
              border: 2px solid rgba(255, 255, 255, 0.8);
            }
          }
        }
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}
</style> 