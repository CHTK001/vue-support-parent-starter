<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-stacked',
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
    <!-- 堆叠效果 -->
    <div class="sc-panel-stack-bg1"></div>
    <div class="sc-panel-stack-bg2"></div>
    
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
      </div>
    </div>

    <!-- 面板内容 -->
    <div class="sc-panel-content" v-show="!isCollapsed">
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

const emit = defineEmits(['collapse', 'expand']);

// 内部折叠状态
const isCollapsed = ref(props.collapsed);

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
  }
});
</script>

<style scoped>
.sc-panel-stacked {
  position: relative;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  margin-top: 20px;
  margin-right: 10px;
  transition: all 0.3s ease;
}

/* 堆叠背景元素 */
.sc-panel-stack-bg1, .sc-panel-stack-bg2 {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  transition: all 0.3s ease;
}

.sc-panel-stack-bg1 {
  bottom: -5px;
  right: -5px;
  width: 100%;
  height: 100%;
  transform: rotate(1deg);
}

.sc-panel-stack-bg2 {
  bottom: -10px;
  right: -10px;
  width: 100%;
  height: 100%;
  transform: rotate(2deg);
}

.sc-panel-stacked:hover .sc-panel-stack-bg1 {
  transform: rotate(1.5deg) translateY(-2px);
}

.sc-panel-stacked:hover .sc-panel-stack-bg2 {
  transform: rotate(3deg) translateY(-4px);
}

.sc-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  position: relative;
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

.sc-panel-content {
  transition: all 0.3s ease;
}

.sc-panel-body {
  padding: 16px;
  position: relative;
}

.sc-panel-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sc-panel-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.5);
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
.sc-panel-stacked[class*="sc-panel-theme-"] {
  --panel-theme-color: var(--el-color-primary);
}

.sc-panel-theme-primary {
  --panel-theme-color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
}

.sc-panel-theme-primary .sc-panel-stack-bg1,
.sc-panel-theme-primary .sc-panel-stack-bg2 {
  border-color: var(--el-color-primary-light-7);
}

.sc-panel-theme-primary .sc-panel-header,
.sc-panel-theme-primary .sc-panel-footer {
  background-color: var(--el-color-primary-light-9);
}

.sc-panel-theme-success {
  --panel-theme-color: var(--el-color-success);
  border-color: var(--el-color-success-light-7);
}

.sc-panel-theme-success .sc-panel-stack-bg1,
.sc-panel-theme-success .sc-panel-stack-bg2 {
  border-color: var(--el-color-success-light-7);
}

.sc-panel-theme-success .sc-panel-header,
.sc-panel-theme-success .sc-panel-footer {
  background-color: var(--el-color-success-light-9);
}

.sc-panel-theme-warning {
  --panel-theme-color: var(--el-color-warning);
  border-color: var(--el-color-warning-light-7);
}

.sc-panel-theme-warning .sc-panel-stack-bg1,
.sc-panel-theme-warning .sc-panel-stack-bg2 {
  border-color: var(--el-color-warning-light-7);
}

.sc-panel-theme-warning .sc-panel-header,
.sc-panel-theme-warning .sc-panel-footer {
  background-color: var(--el-color-warning-light-9);
}

.sc-panel-theme-danger {
  --panel-theme-color: var(--el-color-danger);
  border-color: var(--el-color-danger-light-7);
}

.sc-panel-theme-danger .sc-panel-stack-bg1,
.sc-panel-theme-danger .sc-panel-stack-bg2 {
  border-color: var(--el-color-danger-light-7);
}

.sc-panel-theme-danger .sc-panel-header,
.sc-panel-theme-danger .sc-panel-footer {
  background-color: var(--el-color-danger-light-9);
}

.sc-panel-theme-info {
  --panel-theme-color: var(--el-color-info);
  border-color: var(--el-color-info-light-7);
}

.sc-panel-theme-info .sc-panel-stack-bg1,
.sc-panel-theme-info .sc-panel-stack-bg2 {
  border-color: var(--el-color-info-light-7);
}

.sc-panel-theme-info .sc-panel-header,
.sc-panel-theme-info .sc-panel-footer {
  background-color: var(--el-color-info-light-9);
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

/* 阴影样式 */
.sc-panel-shadow {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sc-panel-shadow .sc-panel-stack-bg1,
.sc-panel-shadow .sc-panel-stack-bg2 {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 无边框样式 */
.sc-panel-stacked:not(.sc-panel-bordered) {
  border: none;
}

.sc-panel-stacked:not(.sc-panel-bordered) .sc-panel-stack-bg1,
.sc-panel-stacked:not(.sc-panel-bordered) .sc-panel-stack-bg2 {
  border: none;
  background-color: rgba(0, 0, 0, 0.03);
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