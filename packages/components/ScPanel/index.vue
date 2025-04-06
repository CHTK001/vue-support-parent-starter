<template>
  <div>
    <component
    :is="currentPanelComponent"
    v-if="currentPanelComponent"
    v-bind="$props"
    @collapse="onCollapse"
    @expand="onExpand"
    ref="panelRef"
  >
    <template #default>
      <slot></slot>
    </template>
    
    <template #header v-if="$slots.header">
      <slot name="header"></slot>
    </template>
    
    <template #icon v-if="$slots.icon">
      <slot name="icon"></slot>
    </template>
    
    <template #actions v-if="$slots.actions">
      <slot name="actions"></slot>
    </template>
    
    <template #header-extra v-if="$slots['header-extra']">
      <slot name="header-extra"></slot>
    </template>
    
    <template #footer v-if="$slots.footer">
      <slot name="footer"></slot>
    </template>
    
    <template #footer-extra v-if="$slots['footer-extra']">
      <slot name="footer-extra"></slot>
    </template>
  </component>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import { PanelType, PanelTheme, PanelSize, PanelHeaderPosition } from './types';
import LoadingPanel from './layout/LoadingPanel.vue';
import ErrorPanel from './layout/ErrorPanel.vue';

// 异步导入所有面板组件
const DefaultPanel = defineAsyncComponent({
  loader: () => import('./layout/DefaultPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const CardPanel = defineAsyncComponent({
  loader: () => import('./layout/CardPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const BorderPanel = defineAsyncComponent({
  loader: () => import('./layout/BorderPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const ShadowPanel = defineAsyncComponent({
  loader: () => import('./layout/ShadowPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const TabPanel = defineAsyncComponent({
  loader: () => import('./layout/TabPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const StepsPanel = defineAsyncComponent({
  loader: () => import('./layout/StepsPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const GradientPanel = defineAsyncComponent({
  loader: () => import('./layout/GradientPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const HoverPanel = defineAsyncComponent({
  loader: () => import('./layout/HoverPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const StatusPanel = defineAsyncComponent({
  loader: () => import('./layout/StatusPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const GroupPanel = defineAsyncComponent({
  loader: () => import('./layout/GroupPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const GlassmorphismPanel = defineAsyncComponent({
  loader: () => import('./layout/GlassmorphismPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const FrostedPanel = defineAsyncComponent({
  loader: () => import('./layout/FrostedPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const AnimatedGradientPanel = defineAsyncComponent({
  loader: () => import('./layout/AnimatedGradientPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const StackedPanel = defineAsyncComponent({
  loader: () => import('./layout/StackedPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const FloatingPanel = defineAsyncComponent({
  loader: () => import('./layout/FloatingPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const NeumorphismPanel = defineAsyncComponent({
  loader: () => import('./layout/NeumorphismPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const ThreeDPanel = defineAsyncComponent({
  loader: () => import('./layout/ThreeDPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});
const DashboardPanel = defineAsyncComponent({
  loader: () => import('./layout/DashboardPanel.vue'),
  loadingComponent: LoadingPanel,
  errorComponent: ErrorPanel,
  delay: 200,
  timeout: 5000
});

const props = defineProps({
  // 面板类型
  type: {
    type: String as () => PanelType,
    default: 'default'
  },
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

const emit = defineEmits(['collapse', 'expand', 'collapse-change']);

// 根据面板类型选择对应的组件
const currentPanelComponent = computed(() => {
  switch (props.type) {
    case 'card':
      return CardPanel;
    case 'border':
      return BorderPanel;
    case 'shadow':
      return ShadowPanel;
    case 'gradient':
      return GradientPanel;
    case 'tab':
      return TabPanel;
    case 'steps':
      return StepsPanel;
    case 'glassmorphism':
      return GlassmorphismPanel;
    case 'frosted':
      return FrostedPanel;
    case 'animated-gradient':
      return AnimatedGradientPanel;
    case 'stacked':
      return StackedPanel;
    case 'floating':
      return FloatingPanel;
    case 'neumorphism':
      return NeumorphismPanel;
    case '3d':
      return ThreeDPanel;
    case 'dashboard':
      return DashboardPanel;
    default:
      return DefaultPanel;
  }
});

// 面板引用
const panelRef = ref<any>(null);

// 折叠事件处理
const onCollapse = () => {
  emit('collapse');
  emit('collapse-change', true);
};

// 展开事件处理
const onExpand = () => {
  emit('expand');
  emit('collapse-change', false);
};

// 暴露方法
defineExpose({
  // 折叠面板
  collapse: () => {
    if (panelRef.value) {
      panelRef.value.collapse();
    }
  },
  // 展开面板
  expand: () => {
    if (panelRef.value) {
      panelRef.value.expand();
    }
  },
  // 切换折叠状态
  toggle: () => {
    if (panelRef.value) {
      panelRef.value.toggle();
    }
  }
});
</script>