<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-animated-gradient',
      { 'is-collapsible': collapsible },
      { 'is-collapsed': isCollapsed },
      { [`sc-panel-${theme}`]: theme !== 'default' },
      { [`sc-panel-${size}`]: size !== 'default' },
      className
    ]"
    :style="panelStyle"
  >
    <div class="sc-panel-gradient-background" :style="gradientStyle"></div>
    <div class="sc-panel-content">
      <div class="sc-panel-animated-gradient-header" v-if="showHeader">
        <div class="sc-panel-title" @click="onToggleCollapse" v-if="title">
          <el-icon v-if="collapsible && isCollapsed" class="sc-panel-collapse-icon"><arrow-right /></el-icon>
          <el-icon v-if="collapsible && !isCollapsed" class="sc-panel-collapse-icon"><arrow-down /></el-icon>
          <span>{{ title }}</span>
        </div>
        <div class="sc-panel-header-extra">
          <slot name="header-extra"></slot>
        </div>
      </div>
      
      <div class="sc-panel-animated-gradient-body" v-show="!isCollapsed">
        <div v-if="loading" class="sc-panel-loading">
          <el-icon class="is-loading"><loading /></el-icon>
          <span>加载中...</span>
        </div>
        <slot v-else></slot>
      </div>
      
      <div class="sc-panel-animated-gradient-footer" v-if="showFooter && !isCollapsed">
        <slot name="footer"></slot>
        <div class="sc-panel-footer-extra">
          <slot name="footer-extra"></slot>
        </div>
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
  // 动画速度
  animationSpeed: {
    type: Number,
    default: 10
  },
  // 渐变颜色集合
  gradientColors: {
    type: Array,
    default: () => ['#12c2e9', '#c471ed', '#f64f59', '#7303c0', '#03a9f4']
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
  
  style.borderRadius = '16px';
  style.overflow = 'hidden';
  style.position = 'relative';
  
  if (props.bordered) {
    style.border = '1px solid rgba(255, 255, 255, 0.1)';
  }
  
  style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
  
  return style;
});

// 计算渐变背景样式
const gradientStyle = computed(() => {
  const colors = props.gradientColors.join(', ');
  return {
    backgroundSize: '400% 400%',
    background: `linear-gradient(43deg, ${colors})`,
    animationDuration: `${props.animationSpeed}s`
  };
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
.sc-panel-animated-gradient {
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  color: white;
}

.sc-panel-gradient-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  animation: gradientAnimation 10s ease infinite;
}

.sc-panel-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  backdrop-filter: blur(1px);
  background-color: rgba(255, 255, 255, 0.1);
}

@keyframes gradientAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.sc-panel-animated-gradient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
}

.sc-panel-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.sc-panel-collapse-icon {
  margin-right: 8px;
  transition: transform 0.3s;
}

.sc-panel-collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

.sc-panel-animated-gradient-body {
  flex: 1;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.05);
  overflow: auto;
}

.sc-panel-animated-gradient-footer {
  padding: 16px 20px;
  background-color: rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sc-panel-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .sc-panel-animated-gradient-header,
  .sc-panel-animated-gradient-body,
  .sc-panel-animated-gradient-footer {
    padding: 12px;
  }
}
</style> 