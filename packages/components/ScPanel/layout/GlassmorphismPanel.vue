<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-glassmorphism',
      { 'is-collapsible': collapsible },
      { 'is-collapsed': isCollapsed },
      { [`sc-panel-${theme}`]: theme !== 'default' },
      { [`sc-panel-${size}`]: size !== 'default' },
      className
    ]"
    :style="panelStyle"
  >
    <div class="sc-panel-glassmorphism-header" v-if="showHeader">
      <div class="sc-panel-title" @click="onToggleCollapse" v-if="title">
        <el-icon v-if="collapsible && isCollapsed" class="sc-panel-collapse-icon"><arrow-right /></el-icon>
        <el-icon v-if="collapsible && !isCollapsed" class="sc-panel-collapse-icon"><arrow-down /></el-icon>
        <span>{{ title }}</span>
      </div>
      <div class="sc-panel-header-extra">
        <slot name="header-extra"></slot>
      </div>
    </div>
    
    <div class="sc-panel-glassmorphism-body" v-show="!isCollapsed">
      <div v-if="loading" class="sc-panel-loading">
        <el-icon class="is-loading"><loading /></el-icon>
        <span>加载中...</span>
      </div>
      <slot v-else></slot>
    </div>
    
    <div class="sc-panel-glassmorphism-footer" v-if="showFooter && !isCollapsed">
      <slot name="footer"></slot>
      <div class="sc-panel-footer-extra">
        <slot name="footer-extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { PanelTheme, PanelSize, PanelHeaderPosition } from '../types';

const props = defineProps({
  // 面板标题
  title: {
    type: String,
    default: ''
  },
  // 面板大小
  size: {
    type: String as () => PanelSize,
    default: 'default'
  },
  // 面板主题
  theme: {
    type: String as () => PanelTheme,
    default: 'default'
  },
  // 是否可折叠
  collapsible: {
    type: Boolean,
    default: false
  },
  // 是否默认折叠
  collapsed: {
    type: Boolean,
    default: false
  },
  // 是否有边框
  bordered: {
    type: Boolean,
    default: true
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
  // 头部位置
  headerPosition: {
    type: String as () => PanelHeaderPosition,
    default: 'top'
  },
  // 是否显示头部
  showHeader: {
    type: Boolean,
    default: true
  },
  // 是否显示底部
  showFooter: {
    type: Boolean,
    default: false
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
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 玻璃效果模糊程度
  blurAmount: {
    type: Number,
    default: 10
  },
  // 背景透明度
  transparency: {
    type: Number,
    default: 0.3
  }
});

const emit = defineEmits(['collapse', 'expand']);

// 是否折叠状态
const isCollapsed = ref(props.collapsed);

// 监听折叠属性变化
watch(() => props.collapsed, (newVal) => {
  isCollapsed.value = newVal;
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
  
  // 添加磨砂玻璃效果
  style.backdropFilter = `blur(${props.blurAmount}px)`;
  style.WebkitBackdropFilter = `blur(${props.blurAmount}px)`;
  style.background = `rgba(255, 255, 255, ${props.transparency})`;
  style.borderRadius = '16px';
  style.border = props.bordered ? '1px solid rgba(255, 255, 255, 0.18)' : 'none';
  style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.15)';
  
  return style;
});

// 切换折叠状态
const onToggleCollapse = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value;
    if (isCollapsed.value) {
      emit('collapse');
    } else {
      emit('expand');
    }
  }
};

// 暴露方法
defineExpose({
  // 折叠面板
  collapse: () => {
    isCollapsed.value = true;
    emit('collapse');
  },
  // 展开面板
  expand: () => {
    isCollapsed.value = false;
    emit('expand');
  },
  // 切换折叠状态
  toggle: onToggleCollapse
});
</script>

<style scoped>
.sc-panel-glassmorphism {
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.sc-panel-glassmorphism::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  z-index: -1;
}

.sc-panel-glassmorphism-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sc-panel-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  cursor: pointer;
}

.sc-panel-collapse-icon {
  margin-right: 8px;
  transition: transform 0.3s;
}

.sc-panel-collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

.sc-panel-glassmorphism-body {
  flex: 1;
  padding: 20px;
  position: relative;
}

.sc-panel-glassmorphism-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.sc-panel-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  gap: 8px;
}

/* Theme styles */
.sc-panel-primary {
  background: rgba(var(--el-color-primary-rgb), 0.1);
}

.sc-panel-success {
  background: rgba(var(--el-color-success-rgb), 0.1);
}

.sc-panel-warning {
  background: rgba(var(--el-color-warning-rgb), 0.1);
}

.sc-panel-danger {
  background: rgba(var(--el-color-danger-rgb), 0.1);
}

.sc-panel-info {
  background: rgba(var(--el-color-info-rgb), 0.1);
}

/* Size variants */
.sc-panel-small .sc-panel-glassmorphism-header,
.sc-panel-small .sc-panel-glassmorphism-footer {
  padding: 10px 16px;
}

.sc-panel-small .sc-panel-glassmorphism-body {
  padding: 16px;
}

.sc-panel-large .sc-panel-glassmorphism-header,
.sc-panel-large .sc-panel-glassmorphism-footer {
  padding: 20px 24px;
}

.sc-panel-large .sc-panel-glassmorphism-body {
  padding: 24px;
}

@media (max-width: 768px) {
  .sc-panel-glassmorphism-header,
  .sc-panel-glassmorphism-body,
  .sc-panel-glassmorphism-footer {
    padding: 12px;
  }
}
</style> 