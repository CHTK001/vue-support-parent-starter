<template>
  <div :class="[toolbarClass, `size-${props.size}`]" :style="toolbarStyle" v-if="visible">
    <div v-for="tool in visibleTools" :key="tool.id" class="toolbar-item" :class="{ active: tool.active === true }"
      :title="tool.tooltip || tool.name" @click="handleToolClick(tool)">
      <span v-if="typeof tool.icon === 'string'" class="svg-icon" v-html="tool.icon"></span>
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
import { ref, computed, PropType, watch, nextTick } from 'vue';
import type { ToolItem } from '../types';
import type { AddToolOptions } from '../types';

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

// 将tools深拷贝为本地状态，避免与props直接引用
const tools = ref(JSON.parse(JSON.stringify(props.tools || [])));
const visible = ref(true); // 控制工具栏整体显示/隐藏

const emit = defineEmits(['tool-click', 'tool-add', 'tool-remove', 'tool-hide', 'tool-show', 'tools-change', 'tool-activated', 'tool-deactivated']);

// 计算可见的工具（show不为false的工具）
const visibleTools = computed(() => {
  return tools.value.filter(tool => tool.show !== false);
});

// 显示整个工具栏
const showToolbar = (): void => {
  visible.value = true;
};

// 隐藏整个工具栏
const hideToolbar = (): void => {
  visible.value = false;
};

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

// 图标字体大小
const iconFontSize = computed(() => {
  return Math.round(props.size * 0.6) + 'px';
});

// 添加SVG图标尺寸的计算属性
const svgIconSize = computed(() => {
  return Math.round(props.size * 0.9) + 'px';
});

// 根据方向和位置计算工具项的排列顺序
const toolbarStyle = computed(() => {
  const style: Record<string, string> = {
    display: 'flex',
    flexWrap: 'wrap',
    padding: `${buttonMargin.value}px`,
    gap: `${buttonMargin.value}px`,
    backgroundColor: 'transparent',
    '--buttonSize': props.size + 'px'
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

// 向工具栏添加自定义工具
const addToolItem = (options: AddToolOptions): void => {
  const { index, ...toolItem } = options;

  if (index !== undefined && index >= 0 && index <= tools.value.length) {
    tools.value.splice(index, 0, toolItem);
  } else {
    tools.value.push(toolItem);
  }

  // 通知父组件工具已添加
  emit('tool-add', toolItem);
  emit('tools-change', tools.value);
};

// 移除指定工具
const removeToolItem = (toolId: string): void => {
  const index = tools.value.findIndex(tool => tool.id === toolId);
  if (index !== -1) {
    const removedTool = tools.value[index];

    // 使用扩展运算符创建新数组，确保工具栏响应式更新
    const newTools = [...tools.value];
    newTools.splice(index, 1);
    tools.value = newTools;

    // 通知父组件工具已移除
    emit('tool-remove', toolId);
    emit('tools-change', tools.value);
  }
};

// 移除所有工具
const removeTool = (): void => {
  tools.value = [];
  emit('tools-change', tools.value);
};

// 设置工具可见性
const setToolVisibility = (toolId: string, visible: boolean): void => {
  const tool = tools.value.find(tool => tool.id === toolId);
  if (tool) {
    // 创建新数组，确保响应式更新
    const newTools = tools.value.map(t => {
      if (t.id === toolId) {
        return { ...t, show: visible };
      }
      return t;
    });
    tools.value = newTools;

    // 通知父组件工具可见性已更改
    emit('tools-change', tools.value);
  }
};

// 显示工具（设置show为true）
const showToolItem = (toolId: string): void => {
  setToolVisibility(toolId, true);
};

// 隐藏工具（设置show为false）
const hideToolItem = (toolId: string): void => {
  setToolVisibility(toolId, false);
};

// 设置所有工具
const setTools = (newTools: ToolItem[]): void => {
  tools.value = [...newTools];
  emit('tools-change', tools.value);
};

// 点击工具按钮的处理函数
const handleToolClick = (tool: ToolItem) => {
  // 避免直接使用传入的tool对象，找到本地副本
  const toolIndex = tools.value.findIndex(t => t.id === tool.id);
  if (toolIndex === -1) return;

  // 获取当前工具的副本
  const currentTool = { ...tools.value[toolIndex] };

  // 获取当前工具激活状态
  const isCurrentlyActive = currentTool.active === true;

  // 创建新的工具列表
  const newTools = [...tools.value];

  // 如果是测距工具，直接触发事件让父组件处理
  if (currentTool.id === 'measure') {
    if (!isCurrentlyActive) {
      // 激活测距工具
      newTools[toolIndex] = { ...currentTool, active: true };

      // 如果当前工具将被激活且不支持多选，则需要停用其他工具
      for (let i = 0; i < newTools.length; i++) {
        if (i !== toolIndex && newTools[i].active === true && !newTools[i].multi) {
          newTools[i] = { ...newTools[i], active: undefined };
        }
      }

      // 更新工具列表
      tools.value = newTools;

      // 触发工具激活事件
      emit('tool-activated', currentTool.id);
    } else {
      // 停用测距工具
      newTools[toolIndex] = { ...currentTool, active: undefined };

      // 更新工具列表
      tools.value = newTools;

      // 触发工具停用事件
      emit('tool-deactivated', currentTool.id);
    }

    // 无需调用处理程序
    if (currentTool.handler) {
      currentTool.handler();
    }

    return;
  }

  // 对于其他工具，执行标准处理
  // 如果工具有自己的处理函数，则调用
  if (currentTool.handler) {
    currentTool.handler();
  }

  // 更新当前工具的激活状态
  newTools[toolIndex] = {
    ...currentTool,
    active: !isCurrentlyActive
  };

  // 如果当前工具将被激活且不支持多选，则需要停用其他工具
  if (!isCurrentlyActive) {
    for (let i = 0; i < newTools.length; i++) {
      if (i !== toolIndex && newTools[i].active === true && !newTools[i].multi) {
        newTools[i] = { ...newTools[i], active: undefined };
      }
    }
  }

  // 更新工具列表
  tools.value = newTools;

  // 触发工具点击事件
  emit('tool-click', {
    id: currentTool.id,
    active: !isCurrentlyActive
  });

  // 根据新状态发送激活或停用事件
  if (isCurrentlyActive) {
    emit('tool-deactivated', currentTool.id);
  } else {
    emit('tool-activated', currentTool.id);
  }
};

// 添加props.tools变化的监听，使用nextTick避免递归更新
watch(() => props.tools, (newTools) => {
  if (newTools && Array.isArray(newTools)) {
    nextTick(() => {
      // 深拷贝避免引用问题
      tools.value = JSON.parse(JSON.stringify(newTools));
    });
  }
}, { immediate: true });

// 获取当前工具列表
const getTools = (): ToolItem[] => {
  return [...tools.value];
};

// 向父组件公开方法
defineExpose({
  addToolItem,
  removeToolItem,
  removeTool,
  setToolVisibility,
  showToolItem,
  hideToolItem,
  setTools,
  showToolbar,
  hideToolbar,
  getTools
});
</script>

<style lang="scss" scoped>
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
    font-size: v-bind(iconFontSize);
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
  width: v-bind(svgIconSize);
  height: v-bind(svgIconSize);
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
</style>
<style>
.total-distance {
  background-color: #91bf8a;
  border-radius: 4px;
  padding: 8px;
}
</style>