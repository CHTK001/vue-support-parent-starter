<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-loading',
      { [`sc-panel-${size}`]: size !== 'default' },
      className
    ]"
    :style="panelStyle"
  >
    <div class="sc-panel-loading-content">
      <div class="sc-panel-loading-spinner">
        <svg class="circular" viewBox="25 25 50 50">
          <circle class="path" cx="50" cy="50" r="20" fill="none" />
        </svg>
      </div>
      <div class="sc-panel-loading-text">正在加载面板...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PanelSize } from '../types';

const props = defineProps({
  // 面板大小
  size: {
    type: String as () => PanelSize,
    default: 'default'
  },
  // 面板高度
  height: {
    type: [String, Number],
    default: ''
  },
  // 面板宽度
  width: {
    type: [String, Number],
    default: ''
  },
  // 自定义类名
  className: {
    type: String,
    default: ''
  },
  // 自定义样式
  style: {
    type: Object,
    default: () => ({})
  }
});

// 计算面板样式
const panelStyle = computed(() => {
  const style: Record<string, any> = { ...props.style };
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  
  return style;
});
</script>

<style scoped>
.sc-panel-loading {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 100px;
}

.sc-panel-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  height: 100%;
  min-height: 120px;
}

.sc-panel-loading-spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
}

.sc-panel-loading-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.circular {
  height: 40px;
  width: 40px;
  animation: loading-rotate 2s linear infinite;
}

.path {
  animation: loading-dash 1.5s ease-in-out infinite;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-width: 2;
  stroke: var(--el-color-primary);
  stroke-linecap: round;
}

@keyframes loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes loading-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40px;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120px;
  }
}

/* 尺寸样式 */
.sc-panel-small .sc-panel-loading-content {
  padding: 20px 15px;
  min-height: 80px;
}

.sc-panel-small .sc-panel-loading-spinner {
  width: 30px;
  height: 30px;
  margin-bottom: 8px;
}

.sc-panel-small .sc-panel-loading-text {
  font-size: 12px;
}

.sc-panel-large .sc-panel-loading-content {
  padding: 40px 30px;
  min-height: 160px;
}

.sc-panel-large .sc-panel-loading-spinner {
  width: 50px;
  height: 50px;
  margin-bottom: 16px;
}

.sc-panel-large .sc-panel-loading-text {
  font-size: 16px;
}
</style> 