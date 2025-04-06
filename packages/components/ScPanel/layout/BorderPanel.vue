<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-border',
      { 'is-collapsible': collapsible },
      { 'is-collapsed': isCollapsed },
      { [`sc-panel-${theme}`]: theme !== 'default' },
      { [`sc-panel-${size}`]: size !== 'default' },
      { 'sc-panel-shadow': shadow },
      className
    ]"
    :style="panelStyle"
  >
    <div class="sc-panel-border-header" v-if="showHeader">
      <div class="sc-panel-title" @click="onToggleCollapse" v-if="title">
        <i v-if="collapsible" class="sc-panel-collapse-icon el-icon-arrow-down" :class="{ 'is-collapsed': isCollapsed }"></i>
        <span>{{ title }}</span>
      </div>
      <div class="sc-panel-header-extra">
        <slot name="header-extra"></slot>
      </div>
    </div>
    
    <div class="sc-panel-border-body" v-show="!isCollapsed">
      <el-skeleton v-if="loading" :rows="3" animated />
      <slot v-else></slot>
    </div>
    
    <div class="sc-panel-border-footer" v-if="showFooter && !isCollapsed">
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
  // 是否有阴影
  shadow: {
    type: Boolean,
    default: false
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
  }
});

const emit = defineEmits(['collapse', 'expand']);

// 面板折叠状态
const isCollapsed = ref(props.collapsed);

// 监听折叠状态
watch(() => props.collapsed, (val) => {
  isCollapsed.value = val;
});

// 切换折叠状态
const onToggleCollapse = () => {
  if (!props.collapsible) return;
  
  isCollapsed.value = !isCollapsed.value;
  
  if (isCollapsed.value) {
    emit('collapse');
  } else {
    emit('expand');
  }
};

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

// 暴露方法
defineExpose({
  collapse: () => {
    isCollapsed.value = true;
    emit('collapse');
  },
  expand: () => {
    isCollapsed.value = false;
    emit('expand');
  },
  toggle: onToggleCollapse
});
</script>

<style scoped>
.sc-panel-border {
  width: 100%;
  background-color: #fff;
  transition: all 0.3s;
  position: relative;
  border-left: 4px solid #dcdfe6; /* 默认左边框 */
}

.sc-panel-shadow {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.sc-panel-border-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.sc-panel-title {
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.sc-panel-collapse-icon {
  margin-right: 8px;
  transition: transform 0.3s;
  cursor: pointer;
}

.sc-panel-collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

.sc-panel-header-extra {
  display: flex;
  align-items: center;
}

.sc-panel-border-body {
  padding: 16px;
  transition: all 0.3s;
}

.sc-panel-border-footer {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 大小变体 */
.sc-panel-small .sc-panel-border-header {
  padding: 8px 12px;
}

.sc-panel-small .sc-panel-border-body {
  padding: 12px;
}

.sc-panel-small .sc-panel-border-footer {
  padding: 8px 12px;
}

.sc-panel-large .sc-panel-border-header {
  padding: 16px 20px;
}

.sc-panel-large .sc-panel-border-body {
  padding: 20px;
}

.sc-panel-large .sc-panel-border-footer {
  padding: 16px 20px;
}

/* 主题变体 - 左边框颜色 */
.sc-panel-primary {
  border-left-color: var(--el-color-primary);
}

.sc-panel-success {
  border-left-color: var(--el-color-success);
}

.sc-panel-warning {
  border-left-color: var(--el-color-warning);
}

.sc-panel-danger {
  border-left-color: var(--el-color-danger);
}

.sc-panel-info {
  border-left-color: var(--el-color-info);
}

/* 主题变体 - 头部颜色 */
.sc-panel-primary .sc-panel-border-header {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}

.sc-panel-success .sc-panel-border-header {
  background-color: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-7);
  color: var(--el-color-success);
}

.sc-panel-warning .sc-panel-border-header {
  background-color: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-7);
  color: var(--el-color-warning);
}

.sc-panel-danger .sc-panel-border-header {
  background-color: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-7);
  color: var(--el-color-danger);
}

.sc-panel-info .sc-panel-border-header {
  background-color: var(--el-color-info-light-9);
  border-color: var(--el-color-info-light-7);
  color: var(--el-color-info);
}

/* 头部位置变体 */
.sc-panel-border[headerPosition="left"] {
  border-left: none;
  border-top: 4px solid #dcdfe6;
}

.sc-panel-border[headerPosition="right"] {
  border-left: none;
  border-right: 4px solid #dcdfe6;
}

.sc-panel-border[headerPosition="bottom"] {
  border-left: none;
  border-bottom: 4px solid #dcdfe6;
}

/* 主题变体 - 不同位置的边框颜色 */
.sc-panel-primary[headerPosition="top"] {
  border-top-color: var(--el-color-primary);
}

.sc-panel-primary[headerPosition="right"] {
  border-right-color: var(--el-color-primary);
}

.sc-panel-primary[headerPosition="bottom"] {
  border-bottom-color: var(--el-color-primary);
}
</style> 