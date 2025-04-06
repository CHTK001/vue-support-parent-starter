<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-error',
      { [`sc-panel-${size}`]: size !== 'default' },
      className
    ]"
    :style="panelStyle"
  >
    <div class="sc-panel-error-content">
      <div class="sc-panel-error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="sc-panel-error-title">加载失败</div>
      <div class="sc-panel-error-message">面板组件加载过程中出现了错误</div>
      <button class="sc-panel-error-retry" @click="retryLoad">重试</button>
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
  },
  // 错误信息
  error: {
    type: Error,
    default: null
  }
});

const emit = defineEmits(['retry']);

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

// 重试加载
const retryLoad = () => {
  emit('retry');
};
</script>

<style scoped>
.sc-panel-error {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 100px;
  border: 1px solid var(--el-color-danger-light-7);
}

.sc-panel-error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  height: 100%;
  min-height: 120px;
}

.sc-panel-error-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  color: var(--el-color-danger);
}

.sc-panel-error-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-color-danger);
}

.sc-panel-error-message {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
  text-align: center;
}

.sc-panel-error-retry {
  background-color: var(--el-color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.sc-panel-error-retry:hover {
  background-color: var(--el-color-primary-dark-2);
}

/* 尺寸样式 */
.sc-panel-small .sc-panel-error-content {
  padding: 20px 15px;
  min-height: 80px;
}

.sc-panel-small .sc-panel-error-icon {
  width: 36px;
  height: 36px;
  margin-bottom: 10px;
}

.sc-panel-small .sc-panel-error-title {
  font-size: 14px;
  margin-bottom: 6px;
}

.sc-panel-small .sc-panel-error-message {
  font-size: 12px;
  margin-bottom: 12px;
}

.sc-panel-small .sc-panel-error-retry {
  padding: 6px 12px;
  font-size: 12px;
}

.sc-panel-large .sc-panel-error-content {
  padding: 40px 30px;
  min-height: 160px;
}

.sc-panel-large .sc-panel-error-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 20px;
}

.sc-panel-large .sc-panel-error-title {
  font-size: 18px;
  margin-bottom: 10px;
}

.sc-panel-large .sc-panel-error-message {
  font-size: 16px;
  margin-bottom: 24px;
}

.sc-panel-large .sc-panel-error-retry {
  padding: 10px 20px;
  font-size: 16px;
}
</style> 