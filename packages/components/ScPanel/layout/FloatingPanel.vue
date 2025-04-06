<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-floating',
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
.sc-panel-floating {
  background-color: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid var(--el-border-color-light);
  transform: translateY(0);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
}

.sc-panel-floating:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
}

.sc-panel-floating:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, var(--el-color-primary), var(--el-color-primary-light-5));
  opacity: 0;
  transition: opacity 0.3s;
}

.sc-panel-floating:hover:before {
  opacity: 1;
}

.sc-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-light);
  transition: background-color 0.3s;
}

.sc-panel-floating:hover .sc-panel-header {
  background-color: rgba(var(--el-color-primary-rgb), 0.05);
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
  transition: color 0.3s;
}

.sc-panel-floating:hover .sc-panel-title {
  color: var(--el-color-primary);
}

.sc-panel-content {
  transition: all 0.3s ease;
}

.sc-panel-body {
  padding: 18px;
  position: relative;
}

.sc-panel-footer {
  padding: 14px 18px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.3s;
}

.sc-panel-floating:hover .sc-panel-footer {
  background-color: rgba(var(--el-color-primary-rgb), 0.03);
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
  backdrop-filter: blur(2px);
}

.sc-panel-loading-spinner {
  font-size: 24px;
  color: var(--el-color-primary);
}

/* 主题样式 */
.sc-panel-floating[class*="sc-panel-theme-"] {
  --panel-theme-color: var(--el-color-primary);
}

.sc-panel-theme-primary:before {
  background: linear-gradient(to right, var(--el-color-primary), var(--el-color-primary-light-5));
}

.sc-panel-theme-success:before {
  background: linear-gradient(to right, var(--el-color-success), var(--el-color-success-light-5));
}

.sc-panel-theme-warning:before {
  background: linear-gradient(to right, var(--el-color-warning), var(--el-color-warning-light-5));
}

.sc-panel-theme-danger:before {
  background: linear-gradient(to right, var(--el-color-danger), var(--el-color-danger-light-5));
}

.sc-panel-theme-info:before {
  background: linear-gradient(to right, var(--el-color-info), var(--el-color-info-light-5));
}

.sc-panel-theme-primary:hover .sc-panel-title {
  color: var(--el-color-primary);
}

.sc-panel-theme-success:hover .sc-panel-title {
  color: var(--el-color-success);
}

.sc-panel-theme-warning:hover .sc-panel-title {
  color: var(--el-color-warning);
}

.sc-panel-theme-danger:hover .sc-panel-title {
  color: var(--el-color-danger);
}

.sc-panel-theme-info:hover .sc-panel-title {
  color: var(--el-color-info);
}

/* 尺寸样式 */
.sc-panel-small .sc-panel-header {
  padding: 10px 14px;
}

.sc-panel-small .sc-panel-title {
  font-size: 14px;
}

.sc-panel-small .sc-panel-body {
  padding: 14px;
}

.sc-panel-small .sc-panel-footer {
  padding: 10px 14px;
}

.sc-panel-large .sc-panel-header {
  padding: 18px 22px;
}

.sc-panel-large .sc-panel-title {
  font-size: 18px;
}

.sc-panel-large .sc-panel-body {
  padding: 22px;
}

.sc-panel-large .sc-panel-footer {
  padding: 18px 22px;
}

/* 阴影样式 */
.sc-panel-shadow {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.sc-panel-shadow:hover {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

/* 无边框样式 */
.sc-panel-floating:not(.sc-panel-bordered) {
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