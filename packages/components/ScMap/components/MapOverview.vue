/**
 * 地图鹰眼组件
 * @author CH
 * @version 1.0.0
 * @since 2025-05-10
 */
<template>
  <div class="sc-map-overview" 
       v-show="show" 
       :class="[positionClass, { expanded }]"
       :style="overviewStyle">
    <div class="overview-header" @click="toggleExpanded" v-if="props.options.title">
      <div class="overview-title">{{ props.options.title || '鹰眼' }}</div>
      <div class="overview-actions">
        <button v-if="props.options.showCloseButton" class="overview-btn" @click.stop="$emit('close')">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6,6 L18,18 M6,18 L18,6" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    </div>
    <div class="overview-container sc-overview-map-container" ref="overviewContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, defineProps, defineEmits } from 'vue';

/**
 * 鹰眼组件配置项接口
 */
export interface OverviewOptions {
  // 鹰眼宽度
  width?: number | string;
  // 鹰眼高度
  height?: number | string;
  // 鹰眼缩放比例
  zoom?: number;
  // 鹰眼位置
  position?: 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom';
  // 鹰眼标题
  title?: string;
  // 是否可折叠
  collapsible?: boolean;
  // 初始是否展开
  expanded?: boolean;
  // 是否显示边框
  showBorder?: boolean;
  // 边框颜色
  borderColor?: string;
  // 视野矩形填充颜色
  rectFillColor?: string;
  // 视野矩形边框颜色
  rectStrokeColor?: string;
  // 视野矩形填充透明度
  rectFillOpacity?: number;
  // 视野矩形边框透明度
  rectStrokeOpacity?: number;
  // 是否显示关闭按钮
  showCloseButton?: boolean;
}

// 组件属性
const props = withDefaults(defineProps<{
  // 是否显示鹰眼
  show: boolean;
  // 鹰眼配置项
  options?: OverviewOptions;
  // 地图类型
  mapType?: string;
}>(), {
  show: false,
  options: () => ({
    width: 200,
    height: 150,
    zoom: 6,
    position: 'right-bottom',
    title: '鹰眼',
    collapsible: true,
    expanded: true,
    showBorder: true,
    borderColor: '#ccc',
    rectFillColor: '#1890ff',
    rectStrokeColor: '#0066cc',
    rectFillOpacity: 0.2,
    rectStrokeOpacity: 0.8,
    showCloseButton: true
  }),
  mapType: 'amap'
});

// 事件
const emit = defineEmits([
  'close',
  'toggle-expand',
  'init-complete',
  'ready'
]);

// 状态变量
const overviewContainer = ref<HTMLElement | null>(null);
const expanded = ref(props.options.expanded);

// 计算鹰眼样式
const overviewStyle = computed(() => {
  return {
    width: typeof props.options.width === 'number' ? `${props.options.width}px` : props.options.width,
    height: typeof props.options.height === 'number' ? `${props.options.height}px` : props.options.height,
    borderColor: props.options.showBorder ? props.options.borderColor : 'transparent'
  };
});

// 计算位置类
const positionClass = computed(() => {
  return `overview-${props.options.position}`;
});

// 切换折叠状态
const toggleExpanded = () => {
  if (props.options.collapsible) {
    expanded.value = !expanded.value;
    emit('toggle-expand', expanded.value);
  }
};

// 获取容器DOM元素
const getContainer = (): HTMLElement | null => {
  return overviewContainer.value;
};

// 监听显示状态变化
watch(() => props.show, (newVal) => {
  if (newVal) {
    // 当显示时，发出准备信号
    emit('ready', overviewContainer.value);
  }
});

// 监听配置变化
watch(() => props.options, (newVal) => {
  expanded.value = newVal.expanded;
}, { deep: true });

onMounted(() => {
  if (props.show) {
    emit('ready', overviewContainer.value);
  }
});

// 暴露方法供父组件调用
defineExpose({
  getContainer,
  toggleExpanded
});
</script>

<style scoped>
.sc-map-overview {
  position: absolute;
  z-index: 1000;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  transition: all 0.3s ease;
}

.overview-header {
  padding: 4px 8px;
  background-color: #f8f8f8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  height: 24px;
  user-select: none;
}

.overview-title {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  min-width: 40px; /* 确保最小宽度 */
}

.overview-actions {
  display: flex;
  gap: 4px;
}

.overview-btn {
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
}

.overview-btn:hover {
  color: #1890ff;
}

.overview-container {
  flex: 1;
  position: relative;
  min-height: 100px; /* 确保鹰眼容器有最小高度 */
}

.sc-overview-map-container {
  width: 100%;
  height: 100%;
}

/* 位置类 */
.overview-left-top {
  top: 10px;
  left: 10px;
}

.overview-right-top {
  top: 10px;
  right: 10px;
}

.overview-left-bottom {
  bottom: 10px;
  left: 10px;
}

.overview-right-bottom {
  bottom: 10px;
  right: 10px;
}

/* 折叠状态 - 修改为使用更友好的转换效果 */
.sc-map-overview:not(.expanded) {
  height: 24px !important;
  width: auto !important;
  min-width: 80px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sc-map-overview:not(.expanded) .overview-container {
  height: 0 !important;
  overflow: hidden;
}

/* 鼠标悬停效果 */
.sc-map-overview:hover {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.overview-header:hover {
  background-color: #f0f0f0;
}
</style> 