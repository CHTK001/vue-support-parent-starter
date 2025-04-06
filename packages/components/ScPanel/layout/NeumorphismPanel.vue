<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-neumorphism',
      { 'is-collapsible': collapsible },
      { 'is-collapsed': isCollapsed },
      { [`sc-panel-${theme}`]: theme !== 'default' },
      { [`sc-panel-${size}`]: size !== 'default' },
      { 'is-dark': isDark },
      className
    ]"
    :style="panelStyle"
  >
    <div class="sc-panel-neumorphism-header" v-if="showHeader">
      <div class="sc-panel-title" @click="onToggleCollapse" v-if="title">
        <el-icon v-if="collapsible && isCollapsed" class="sc-panel-collapse-icon"><arrow-right /></el-icon>
        <el-icon v-if="collapsible && !isCollapsed" class="sc-panel-collapse-icon"><arrow-down /></el-icon>
        <span>{{ title }}</span>
      </div>
      <div class="sc-panel-header-extra">
        <slot name="header-extra"></slot>
      </div>
    </div>
    
    <div class="sc-panel-neumorphism-body" v-show="!isCollapsed">
      <div v-if="loading" class="sc-panel-loading">
        <el-icon class="is-loading"><loading /></el-icon>
        <span>加载中...</span>
      </div>
      <slot v-else></slot>
    </div>
    
    <div class="sc-panel-neumorphism-footer" v-if="showFooter && !isCollapsed">
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
  // 是否为凹陷效果
  inset: {
    type: Boolean,
    default: false
  },
  // 是否为暗色主题
  isDark: {
    type: Boolean,
    default: false
  },
  // 阴影强度
  intensity: {
    type: Number,
    default: 0.1
  }
});

const emit = defineEmits(['collapse', 'expand', 'collapse-change']);

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
  
  const intensity = Math.max(0.05, Math.min(0.2, props.intensity));
  
  if (props.isDark) {
    const darkBg = '#333';
    const shadowDark = `rgba(0, 0, 0, ${intensity * 1.5})`;
    const shadowLight = `rgba(255, 255, 255, ${intensity})`;
    
    style.backgroundColor = darkBg;
    style.color = '#eee';
    
    if (props.inset) {
      style.boxShadow = `inset 5px 5px 10px ${shadowDark}, inset -5px -5px 10px ${shadowLight}`;
    } else {
      style.boxShadow = `5px 5px 10px ${shadowDark}, -5px -5px 10px ${shadowLight}`;
    }
  } else {
    const lightBg = '#e0e5ec';
    const shadowDark = `rgba(0, 0, 0, ${intensity})`;
    const shadowLight = `rgba(255, 255, 255, ${intensity + 0.5})`;
    
    style.backgroundColor = lightBg;
    style.color = '#333';
    
    if (props.inset) {
      style.boxShadow = `inset 5px 5px 10px ${shadowDark}, inset -5px -5px 10px ${shadowLight}`;
    } else {
      style.boxShadow = `5px 5px 10px ${shadowDark}, -5px -5px 10px ${shadowLight}`;
    }
  }
  
  style.borderRadius = '20px';
  style.transition = 'all 0.3s ease';
  
  if (props.bordered) {
    style.border = props.isDark 
      ? '1px solid rgba(255, 255, 255, 0.05)' 
      : '1px solid rgba(0, 0, 0, 0.05)';
  }
  
  return style;
});

// 切换折叠状态
const onToggleCollapse = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value;
    if (isCollapsed.value) {
      emit('collapse');
      emit('collapse-change', true);
    } else {
      emit('expand');
      emit('collapse-change', false);
    }
  }
};

// 暴露方法
defineExpose({
  // 折叠面板
  collapse: () => {
    isCollapsed.value = true;
    emit('collapse');
    emit('collapse-change', true);
  },
  // 展开面板
  expand: () => {
    isCollapsed.value = false;
    emit('expand');
    emit('collapse-change', false);
  },
  // 切换折叠状态
  toggle: onToggleCollapse
});
</script>

<style scoped>
.sc-panel-neumorphism {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sc-panel-neumorphism-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.sc-panel-neumorphism.is-dark .sc-panel-neumorphism-header {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.sc-panel-neumorphism-body {
  padding: 20px;
  flex: 1;
}

.sc-panel-neumorphism-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.sc-panel-neumorphism.is-dark .sc-panel-neumorphism-footer {
  border-top-color: rgba(255, 255, 255, 0.05);
}

.sc-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.sc-panel-collapse-icon {
  margin-right: 8px;
  transition: transform 0.3s;
  font-size: 14px;
}

.sc-panel-collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

/* 尺寸样式 */
.sc-panel-small .sc-panel-neumorphism-header,
.sc-panel-small .sc-panel-neumorphism-footer {
  padding: 8px 12px;
}

.sc-panel-small .sc-panel-neumorphism-body {
  padding: 12px;
}

.sc-panel-large .sc-panel-neumorphism-header,
.sc-panel-large .sc-panel-neumorphism-footer {
  padding: 20px 24px;
}

.sc-panel-large .sc-panel-neumorphism-body {
  padding: 24px;
}

/* 主题样式 - 基于浅色背景 */
.sc-panel-neumorphism:not(.is-dark).sc-panel-primary .sc-panel-title {
  color: var(--el-color-primary);
}

.sc-panel-neumorphism:not(.is-dark).sc-panel-success .sc-panel-title {
  color: var(--el-color-success);
}

.sc-panel-neumorphism:not(.is-dark).sc-panel-warning .sc-panel-title {
  color: var(--el-color-warning);
}

.sc-panel-neumorphism:not(.is-dark).sc-panel-danger .sc-panel-title {
  color: var(--el-color-danger);
}

.sc-panel-neumorphism:not(.is-dark).sc-panel-info .sc-panel-title {
  color: var(--el-color-info);
}

/* 主题样式 - 基于深色背景 */
.sc-panel-neumorphism.is-dark.sc-panel-primary .sc-panel-title {
  color: var(--el-color-primary-light-7);
}

.sc-panel-neumorphism.is-dark.sc-panel-success .sc-panel-title {
  color: var(--el-color-success-light-7);
}

.sc-panel-neumorphism.is-dark.sc-panel-warning .sc-panel-title {
  color: var(--el-color-warning-light-7);
}

.sc-panel-neumorphism.is-dark.sc-panel-danger .sc-panel-title {
  color: var(--el-color-danger-light-7);
}

.sc-panel-neumorphism.is-dark.sc-panel-info .sc-panel-title {
  color: var(--el-color-info-light-7);
}
</style> 