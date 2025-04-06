<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-dashboard',
      { [`sc-panel-${size}`]: size !== 'default' },
      { 'sc-panel-bordered': bordered },
      { 'sc-panel-shadow': shadow },
      { 'sc-panel-loading': loading },
      { 'sc-panel-collapsed': isCollapsed },
      { [`sc-panel-theme-${theme}`]: theme !== 'default' },
      className
    ]"
    :style="panelStyle"
  >
    <!-- 面板头部 -->
    <div 
      v-if="showHeader" 
      :class="[
        'sc-panel-header',
        { [`sc-panel-header-${headerPosition}`]: headerPosition !== 'top' }
      ]"
    >
      <div class="sc-panel-header-left">
        <!-- 折叠图标 -->
        <div 
          v-if="collapsible" 
          class="sc-panel-collapse-icon"
          @click="handleCollapse"
        >
          <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed }">
            <component :is="isCollapsed ? 'ArrowRight' : 'ArrowDown'" />
          </el-icon>
        </div>
        <!-- 标题 -->
        <div class="sc-panel-title" v-if="title">{{ title }}</div>
      </div>
      <!-- 头部额外内容 -->
      <div class="sc-panel-header-extra">
        <slot name="header-extra"></slot>
        <!-- 仪表盘控制按钮 -->
        <div class="sc-panel-dashboard-controls">
          <div class="sc-panel-dashboard-btn sc-panel-dashboard-refresh" @click="refreshContent">
            <el-icon><Refresh /></el-icon>
          </div>
          <div class="sc-panel-dashboard-btn sc-panel-dashboard-fullscreen" @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 面板内容 -->
    <div class="sc-panel-content" v-show="!isCollapsed" :class="{ 'is-fullscreen': isFullscreen }">
      <div class="sc-panel-body" :class="{ 'sc-panel-loading': loading }">
        <slot></slot>
        <!-- 加载状态 -->
        <div class="sc-panel-loading-mask" v-if="loading">
          <div class="sc-panel-loading-spinner">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 面板底部 -->
    <div class="sc-panel-footer" v-if="showFooter && !isCollapsed">
      <div class="sc-panel-footer-content">
        <slot name="footer"></slot>
      </div>
      <div class="sc-panel-footer-extra">
        <slot name="footer-extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { PanelSize, PanelTheme, PanelHeaderPosition } from '../types';

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

const emit = defineEmits(['collapse', 'expand', 'refresh', 'fullscreen-change']);

// 内部折叠状态
const isCollapsed = ref(props.collapsed);
// 全屏状态
const isFullscreen = ref(false);

// 监听折叠状态变化
watch(() => props.collapsed, (newVal) => {
  isCollapsed.value = newVal;
});

// 初始化时设置折叠状态
onMounted(() => {
  isCollapsed.value = props.collapsed;
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

// 折叠处理
const handleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  if (isCollapsed.value) {
    emit('collapse');
  } else {
    emit('expand');
  }
};

// 刷新内容
const refreshContent = () => {
  emit('refresh');
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  emit('fullscreen-change', isFullscreen.value);
};

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
  toggle: () => {
    handleCollapse();
  },
  refresh: refreshContent,
  toggleFullscreen
});
</script>

<style scoped>
.sc-panel-dashboard {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-light);
}

.sc-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: rgba(var(--el-color-primary-rgb), 0.02);
}

.sc-panel-header-left {
  display: flex;
  align-items: center;
}

.sc-panel-collapse-icon {
  margin-right: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: transform 0.3s;
}

.sc-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sc-panel-header-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sc-panel-dashboard-controls {
  display: flex;
  gap: 8px;
}

.sc-panel-dashboard-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.sc-panel-dashboard-btn:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.sc-panel-content {
  transition: all 0.3s ease;
}

.sc-panel-content.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  height: 100vh;
  width: 100vw;
  background-color: var(--el-bg-color);
  padding: 20px;
  overflow-y: auto;
}

.sc-panel-body {
  padding: 16px;
  position: relative;
}

.sc-panel-content.is-fullscreen .sc-panel-body {
  height: calc(100% - 40px);
  overflow-y: auto;
}

.sc-panel-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(var(--el-color-primary-rgb), 0.01);
}

.sc-panel-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.sc-panel-loading-spinner {
  font-size: 24px;
  color: var(--el-color-primary);
}

/* 主题样式 */
.sc-panel-dashboard[class*="sc-panel-theme-"] {
  --panel-theme-color: var(--el-color-primary);
}

.sc-panel-theme-primary .sc-panel-header {
  background-color: var(--el-color-primary-light-9);
  border-bottom-color: var(--el-color-primary-light-7);
}

.sc-panel-theme-primary .sc-panel-footer {
  background-color: var(--el-color-primary-light-9);
  border-top-color: var(--el-color-primary-light-7);
}

.sc-panel-theme-success .sc-panel-header {
  background-color: var(--el-color-success-light-9);
  border-bottom-color: var(--el-color-success-light-7);
}

.sc-panel-theme-success .sc-panel-footer {
  background-color: var(--el-color-success-light-9);
  border-top-color: var(--el-color-success-light-7);
}

.sc-panel-theme-warning .sc-panel-header {
  background-color: var(--el-color-warning-light-9);
  border-bottom-color: var(--el-color-warning-light-7);
}

.sc-panel-theme-warning .sc-panel-footer {
  background-color: var(--el-color-warning-light-9);
  border-top-color: var(--el-color-warning-light-7);
}

.sc-panel-theme-danger .sc-panel-header {
  background-color: var(--el-color-danger-light-9);
  border-bottom-color: var(--el-color-danger-light-7);
}

.sc-panel-theme-danger .sc-panel-footer {
  background-color: var(--el-color-danger-light-9);
  border-top-color: var(--el-color-danger-light-7);
}

.sc-panel-theme-info .sc-panel-header {
  background-color: var(--el-color-info-light-9);
  border-bottom-color: var(--el-color-info-light-7);
}

.sc-panel-theme-info .sc-panel-footer {
  background-color: var(--el-color-info-light-9);
  border-top-color: var(--el-color-info-light-7);
}

/* 尺寸样式 */
.sc-panel-small .sc-panel-header {
  padding: 8px 12px;
}

.sc-panel-small .sc-panel-title {
  font-size: 14px;
}

.sc-panel-small .sc-panel-body {
  padding: 12px;
}

.sc-panel-small .sc-panel-footer {
  padding: 8px 12px;
}

.sc-panel-small .sc-panel-dashboard-btn {
  width: 20px;
  height: 20px;
  font-size: 12px;
}

.sc-panel-large .sc-panel-header {
  padding: 16px 20px;
}

.sc-panel-large .sc-panel-title {
  font-size: 18px;
}

.sc-panel-large .sc-panel-body {
  padding: 20px;
}

.sc-panel-large .sc-panel-footer {
  padding: 16px 20px;
}

.sc-panel-large .sc-panel-dashboard-btn {
  width: 28px;
  height: 28px;
  font-size: 16px;
}

/* 阴影样式 */
.sc-panel-shadow {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 无边框样式 */
.sc-panel-dashboard:not(.sc-panel-bordered) {
  border: none;
}

/* 折叠图标样式 */
.collapse-icon {
  transition: transform 0.3s;
}

.collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

/* 头部位置样式 */
.sc-panel-header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.sc-panel-header-right {
  display: flex;
  justify-content: flex-end;
}

.sc-panel-header-bottom {
  border-top: 1px solid var(--el-border-color-light);
  border-bottom: none;
  order: 1;
}
</style> 