<template>
  <div
    :class="[
      'sc-panel',
      'sc-panel-gradient',
      { 'is-collapsible': collapsible },
      { 'is-collapsed': isCollapsed },
      { [`sc-panel-${theme}`]: theme !== 'default' },
      { [`sc-panel-${size}`]: size !== 'default' },
      { 'sc-panel-bordered': bordered },
      className
    ]"
    :style="[panelStyle, gradientStyle]"
  >
    <div class="sc-panel-gradient-header" v-if="showHeader">
      <div class="sc-panel-title" @click="onToggleCollapse" v-if="title">
        <i v-if="collapsible" class="sc-panel-collapse-icon el-icon-arrow-down" :class="{ 'is-collapsed': isCollapsed }"></i>
        <span>{{ title }}</span>
      </div>
      <div class="sc-panel-header-extra">
        <slot name="header-extra"></slot>
      </div>
    </div>
    
    <div class="sc-panel-gradient-body" v-show="!isCollapsed">
      <el-skeleton v-if="loading" :rows="3" animated />
      <slot v-else></slot>
    </div>
    
    <div class="sc-panel-gradient-footer" v-if="showFooter && !isCollapsed">
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
  // 渐变方向
  gradientDirection: {
    type: String,
    default: 'to right'
  },
  // 渐变起始颜色
  gradientStartColor: {
    type: String,
    default: '#4facfe'
  },
  // 渐变结束颜色
  gradientEndColor: {
    type: String,
    default: '#00f2fe'
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
  
  return style;
});

// 计算渐变样式
const gradientStyle = computed(() => {
  return {
    background: `linear-gradient(${props.gradientDirection}, ${props.gradientStartColor}, ${props.gradientEndColor})`,
    color: '#fff'
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

// 折叠面板
const collapse = () => {
  if (!isCollapsed.value) {
    isCollapsed.value = true;
    emit('collapse');
  }
};

// 展开面板
const expand = () => {
  if (isCollapsed.value) {
    isCollapsed.value = false;
    emit('expand');
  }
};

// 切换折叠状态
const toggle = () => {
  isCollapsed.value = !isCollapsed.value;
  if (isCollapsed.value) {
    emit('collapse');
  } else {
    emit('expand');
  }
};

// 暴露方法
defineExpose({
  collapse,
  expand,
  toggle
});
</script>

<style scoped>
.sc-panel-gradient {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.sc-panel-gradient .sc-panel-title {
  color: #fff;
  font-weight: bold;
}

.sc-panel-gradient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sc-panel-gradient-body {
  padding: 16px;
}

.sc-panel-gradient-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.sc-panel-collapse-icon {
  margin-right: 8px;
  transition: transform 0.3s;
}

.sc-panel-collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

.sc-panel-bordered {
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>