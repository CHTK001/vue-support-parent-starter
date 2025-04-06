<template>
  <el-card
    :class="[
      'sc-panel',
      'sc-panel-default',
      { 'is-collapsible': collapsible },
      { 'is-collapsed': isCollapsed },
      { [`sc-panel-${theme}`]: theme !== 'default' },
      { [`sc-panel-${size}`]: size !== 'default' },
      className
    ]"
    :style="panelStyle"
    :shadow="shadowType"
    :body-style="bodyStyle"
  >
    <template #header v-if="showHeader">
      <div class="sc-panel-header">
        <div class="sc-panel-title" @click="onToggleCollapse" v-if="title">
          <i v-if="collapsible" class="sc-panel-collapse-icon el-icon-arrow-down" :class="{ 'is-collapsed': isCollapsed }"></i>
          <span>{{ title }}</span>
        </div>
        <div class="sc-panel-header-extra">
          <slot name="header-extra"></slot>
        </div>
      </div>
    </template>
    
    <div class="sc-panel-body" v-show="!isCollapsed">
      <el-skeleton v-if="loading" :rows="3" animated />
      <slot v-else></slot>
    </div>
    
    <div class="sc-panel-footer" v-if="showFooter && !isCollapsed">
      <slot name="footer"></slot>
      <div class="sc-panel-footer-extra">
        <slot name="footer-extra"></slot>
      </div>
    </div>
  </el-card>
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

// 计算阴影类型
const shadowType = computed(() => {
  if (!props.shadow) return 'never';
  return 'always';
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
  
  if (!props.bordered) {
    style.border = 'none';
  }
  
  return style;
});

// 计算内容区样式
const bodyStyle = computed(() => {
  const style: Record<string, any> = {};
  
  if (props.headerPosition === 'left') {
    style.display = 'flex';
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
.sc-panel {
  width: 100%;
  transition: all 0.3s;
}

.sc-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
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

.sc-panel-body {
  transition: all 0.3s;
}

.sc-panel-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 大小变体 */
.sc-panel-small :deep(.el-card__header) {
  padding: 9px 12px;
}

.sc-panel-small :deep(.el-card__body) {
  padding: 12px;
}

.sc-panel-large :deep(.el-card__header) {
  padding: 16px 20px;
}

.sc-panel-large :deep(.el-card__body) {
  padding: 20px;
}

/* 主题变体 */
.sc-panel-primary {
  border-color: var(--el-color-primary);
}

.sc-panel-primary :deep(.el-card__header) {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.sc-panel-success {
  border-color: var(--el-color-success);
}

.sc-panel-success :deep(.el-card__header) {
  background-color: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-7);
}

.sc-panel-warning {
  border-color: var(--el-color-warning);
}

.sc-panel-warning :deep(.el-card__header) {
  background-color: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-7);
}

.sc-panel-danger {
  border-color: var(--el-color-danger);
}

.sc-panel-danger :deep(.el-card__header) {
  background-color: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-7);
}

.sc-panel-info {
  border-color: var(--el-color-info);
}

.sc-panel-info :deep(.el-card__header) {
  background-color: var(--el-color-info-light-9);
  border-color: var(--el-color-info-light-7);
}
</style> 