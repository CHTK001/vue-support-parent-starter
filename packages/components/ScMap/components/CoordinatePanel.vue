/**
 * 坐标面板
 * @author CH
 * @date 2025-04-29
 */
<template>
  <div class="coordinate-panel" :class="{ 'is-visible': isVisible }" v-if="isVisible || isAnimating">
    <div class="coordinate-content">
      <div class="coordinate-item">
        <span class="label">经度：</span>
        <span class="value">{{ longitude.toFixed(decimals) }}</span>
      </div>
      <div class="coordinate-item">
        <span class="label">纬度：</span>
        <span class="value">{{ latitude.toFixed(decimals) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';

interface Props {
  longitude: number;
  latitude: number;
  visible: boolean;
  decimals?: number;
}

const props = withDefaults(defineProps<Props>(), {
  longitude: 0,
  latitude: 0,
  visible: false,
  decimals: 12
});

// 用于控制动画和显示状态的变量
const isVisible = ref(props.visible);
const isAnimating = ref(false);
let animationTimeout: number | null = null;

// 监听 visible 属性变化
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 立即显示元素
    isVisible.value = true;
    isAnimating.value = false;
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
    }, 300); // 动画持续时间
  }
}, { immediate: true });

// 在组件销毁前清除定时器
onBeforeUnmount(() => {
  if (animationTimeout !== null) {
    window.clearTimeout(animationTimeout);
  }
});
</script>

<style lang="scss" scoped>
.coordinate-panel {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  font-size: 12px;
  min-width: 180px;
  border: 1px solid #e0e0e0;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  
  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  // 非可见状态添加过渡效果
  &:not(.is-visible) {
    opacity: 0;
    transform: translateY(10px);
  }
}

.coordinate-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coordinate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coordinate-item .label {
  font-weight: 500;
  color: #333;
}

.coordinate-item .value {
  color: #1976D2;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}
</style> 