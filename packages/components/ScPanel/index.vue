<template>
  <div>
    <component
    :is="currentPanelComponent"
    v-if="currentPanelComponent"
    v-bind="$props"
    @collapse="onCollapse"
    @expand="onExpand"
  >
    <template #default>
      <slot></slot>
    </template>
    
    <template #header-extra>
      <slot name="header-extra"></slot>
    </template>
    
    <template #footer>
      <slot name="footer"></slot>
    </template>
    
    <template #footer-extra>
      <slot name="footer-extra"></slot>
    </template>
  </component>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { PanelType, PanelTheme, PanelSize, PanelHeaderPosition } from './types';
import DefaultPanel from './layout/DefaultPanel.vue';
import CardPanel from './layout/CardPanel.vue';
import BorderPanel from './layout/BorderPanel.vue';
import ShadowPanel from './layout/ShadowPanel.vue';
import TabPanel from './layout/TabPanel.vue';
import StepsPanel from './layout/StepsPanel.vue';
import GradientPanel from './layout/GradientPanel.vue';
import HoverPanel from './layout/HoverPanel.vue';
import StatusPanel from './layout/StatusPanel.vue';
import GroupPanel from './layout/GroupPanel.vue';

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

const emit = defineEmits(['collapse', 'expand']);

// 根据面板类型选择对应的组件
const currentPanelComponent = computed(() => {
  const type = props.type as PanelType;
  switch (type) {
    case 'card':
      return CardPanel;
    case 'border':
      return BorderPanel;
    case 'shadow':
      return ShadowPanel;
    case 'tab':
      return TabPanel;
    case 'steps':
      return StepsPanel;
    case 'gradient':
      return GradientPanel;
    case 'hover':
      return HoverPanel;
    case 'status':
      return StatusPanel;
    case 'group':
      return GroupPanel;
    case 'custom':
      // 自定义面板暂不支持，使用默认面板
      console.warn('自定义面板类型暂不支持，已使用默认面板');
      return DefaultPanel;
    case 'default':
    default:
      return DefaultPanel;
  }
});

// 面板引用
const panelRef = ref<any>(null);

// 折叠事件处理
const onCollapse = () => {
  emit('collapse');
};

// 展开事件处理
const onExpand = () => {
  emit('expand');
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