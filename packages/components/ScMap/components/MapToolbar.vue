<template>
  <div :class="[toolbarClass, `size-${props.size}`]" :style="toolbarStyle">
    <div
      v-for="tool in tools"
      :key="tool.id"
      class="toolbar-item"
      :class="{ active: activeToolId === tool.id || tool.active }"
      :title="tool.tooltip || tool.name"
      @click="handleToolClick(tool)"
    >
      <i v-if="typeof tool.icon === 'string' && tool.icon.startsWith('el-icon-')" :class="tool.icon"></i>
      <span v-else-if="typeof tool.icon === 'string'" class="svg-icon" v-html="tool.icon"></span>
      <component v-else :is="tool.icon" />
      <div class="toolbar-tooltip" v-if="tool.tooltip || tool.name">
        {{ tool.tooltip || tool.name }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MapToolbar'
};
</script>

<script setup lang="ts">
import { ref, computed, PropType } from 'vue';
import type { ToolItem } from '../types';
interface Props {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  direction: 'horizontal' | 'vertical';
  itemsPerLine?: number;
  size: number;
  tools: ToolItem[];
  activeToolId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top-left',
  direction: 'horizontal',
  itemsPerLine: 0,
  size: 36
});

const emit = defineEmits(['tool-click']);

// 激活的工具ID
const activeToolId = ref<string | null>(null);

// 根据位置和方向计算CSS类
const toolbarClass = computed(() => {
  return [
    'map-toolbar',
    `position-${props.position}`,
    `direction-${props.direction}`
  ];
});

// 按钮尺寸
const buttonSize = computed(() => {
  return props.size;
});

// 按钮间距
const buttonMargin = computed(() => {
  // 根据按钮尺寸设置合适的间距
  return Math.max(4, Math.round(props.size * 0.1));
});

// 根据方向和位置计算工具项的排列顺序
const toolbarStyle = computed(() => {
  const style: Record<string, string> = {
    display: 'flex',
    flexWrap: 'wrap',
    padding: `${buttonMargin.value}px`,
    gap: `${buttonMargin.value}px`,
    backgroundColor: 'transparent'
  };
  
  // 横向排列
  if (props.direction === 'horizontal') {
    style.flexDirection = 'row';
    
    // 底部位置时，工具反向排序
    if (props.position.startsWith('bottom')) {
      style.flexDirection = 'row-reverse';
    }
  } 
  // 纵向排列
  else {
    style.flexDirection = 'column';
    
    // 右侧位置时，工具反向排序
    if (props.position.endsWith('right')) {
      style.flexDirection = 'column-reverse';
    }
  }
  
  return style;
});

// 点击工具按钮的处理函数
const handleToolClick = (tool: ToolItem) => {
  // 如果工具有自己的处理函数，则调用
  if (tool.handler) {
    tool.handler();
  }
  
  // 设置当前激活的工具
  if (activeToolId.value === tool.id) {
    activeToolId.value = null;
  } else {
    activeToolId.value = tool.id;
  }
  
  // 触发工具点击事件
  emit('tool-click', {
    id: tool.id,
    active: activeToolId.value === tool.id
  });
};
</script>

<style>
.map-toolbar {
  position: absolute;
  border-radius: 4px;
  z-index: 2000;
}

/* 位置样式 */
.position-top-left {
  top: 10px;
  left: 10px;
}

.position-top-right {
  top: 10px;
  right: 10px;
}

.position-bottom-left {
  bottom: 10px;
  left: 10px;
}

.position-bottom-right {
  bottom: 10px;
  right: 10px;
}

/* 工具项样式 */
.toolbar-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: v-bind(buttonSize + 'px');
  height: v-bind(buttonSize + 'px');
  margin: v-bind(buttonMargin + 'px');
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
  
  &:hover {
    background-color: #f6f6f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &.active {
    background-color: #e6f7ff;
    color: #1890ff;
  }

  .iconfont {
    font-size: v-bind(Math.round(buttonSize * 0.6) + 'px');
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.size-small .toolbar-item {
  width: 28px;
  height: 28px;
}

.size-medium .toolbar-item {
  width: 36px;
  height: 36px;
}

.size-large .toolbar-item {
  width: 44px;
  height: 44px;
}

/* 工具提示样式 */
.toolbar-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 1001;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  visibility: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 根据工具栏位置调整提示框位置 */
.position-top-left .toolbar-item .toolbar-tooltip,
.position-bottom-left .toolbar-item .toolbar-tooltip {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 10px;
}

.position-top-right .toolbar-item .toolbar-tooltip,
.position-bottom-right .toolbar-item .toolbar-tooltip {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 10px;
}

/* 水平方向工具栏的提示框位置调整 */
.direction-horizontal.position-top-left .toolbar-item .toolbar-tooltip,
.direction-horizontal.position-top-right .toolbar-item .toolbar-tooltip {
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  margin-left: 0;
  margin-right: 0;
  margin-top: 10px;
}

.direction-horizontal.position-bottom-left .toolbar-item .toolbar-tooltip,
.direction-horizontal.position-bottom-right .toolbar-item .toolbar-tooltip {
  left: 50%;
  bottom: 100%;
  top: auto;
  transform: translateX(-50%);
  margin-left: 0;
  margin-right: 0;
  margin-bottom: 10px;
}

/* 鼠标悬停时显示提示框 */
.toolbar-item:hover .toolbar-tooltip {
  opacity: 1;
  visibility: visible;
}

/* 测距标签样式 */
.measure-segment-label .segment-distance {
  background-color: rgba(255, 71, 87, 0.8);
  color: white;
  font-size: 12px;
  padding: 2px 5px;
  border-radius: 10px;
  white-space: nowrap;
  text-align: center;
}

.measure-total-label .total-distance {
  background-color: rgba(46, 204, 113, 0.8);
  color: white;
  font-size: 13px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
  text-align: center;
}

/* 图标样式 */
.toolbar-item i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.size-small .toolbar-item i {
  font-size: 16px;
}

.size-medium .toolbar-item i {
  font-size: 18px;
}

.size-large .toolbar-item i {
  font-size: 22px;
}

/* SVG图标样式 */
.toolbar-item .svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.size-small .toolbar-item .svg-icon {
  width: 16px;
  height: 16px;
}

.size-medium .toolbar-item .svg-icon {
  width: 20px;
  height: 20px;
}

.size-large .toolbar-item .svg-icon {
  width: 24px;
  height: 24px;
}

.toolbar-item .svg-icon svg {
  width: 100%;
  height: 100%;
}

.toolbar-item.active .svg-icon svg path {
  fill: white;
}

/* 特定图标样式 */
.el-icon-ruler:before {
  content: "\e912";
}

.el-icon-zoom-in:before {
  content: "\e908";
}

.el-icon-zoom-out:before {
  content: "\e909";
}

.el-icon-full-screen:before {
  content: "\e92c";
}

.el-icon-location-point:before {
  content: "\e830";
}

/* 确保图标在激活状态下可见 */
.toolbar-item.active i {
  color: white;
}

/* tooltip样式 */
.tooltip {
  position: absolute;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  transition: opacity 0.3s;
  opacity: 0;
  z-index: 1000;
  pointer-events: none;
  white-space: nowrap;
}

/* 工具栏位置样式 */
.top-left {
  top: 10px;
  left: 10px;
  
  .tooltip {
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.top-right {
  top: 10px;
  right: 10px;
  
  .tooltip {
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.bottom-left {
  bottom: 10px;
  left: 10px;
  
  .tooltip {
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.bottom-right {
  bottom: 10px;
  right: 10px;
  
  .tooltip {
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 显示工具提示 */
.toolbar-item:hover .tooltip {
  opacity: 1;
}
</style> 