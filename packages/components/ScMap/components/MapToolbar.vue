/**
 * 地图工具栏
 * @author CH
 * @date 2025-04-29
 */
<template>
  <div :class="[toolbarClass, `size-${config.size}`]" :style="toolbarStyle" v-if="visible" @dblclick.stop.prevent>
    <div v-for="tool in visibleTools" :key="tool.id" class="toolbar-item" :class="[{ active: tool.active === true }, tool.className]"
      @click="(e) => handleToolClick(tool, e)" @dblclick.stop.prevent>
      <span v-if="typeof tool.icon === 'string'" class="svg-icon" v-html="tool.icon"></span>
      <component v-else :is="tool.icon" />
      <div class="toolbar-tooltip">
        {{ tool.tooltip || tool.name }}
      </div>
    </div>
    <div class="toolbar-collapse" @click="toggleCollapse" :title="isCollapsed ? '展开' : '收缩'">
      <!-- 水平方向工具栏 -->
      <template v-if="config.direction === 'horizontal'">
        <!-- 左侧工具栏 -->
        <div v-if="config.position.endsWith('left')" class="collapse-icon">
          <svg v-if="isCollapsed" viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M842.67 512L640 309.33V402.67H384V402.67H213.33V621.33H384V621.33H640V714.67L842.67 512Z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M181.33 512L384 714.67V621.33H640V621.33H810.67V402.67H640V402.67H384V309.33L181.33 512Z" fill="currentColor" />
          </svg>
        </div>
        <!-- 右侧工具栏 -->
        <div v-else class="collapse-icon">
          <svg v-if="isCollapsed" viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M181.33 512L384 309.33V402.67H640V402.67H810.67V621.33H640V621.33H384V714.67L181.33 512Z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M842.67 512L640 714.67V621.33H384V621.33H213.33V402.67H384V402.67H640V309.33L842.67 512Z" fill="currentColor" />
          </svg>
        </div>
      </template>
      <!-- 垂直方向工具栏 -->
      <template v-else>
        <!-- 顶部工具栏 -->
        <div v-if="config.position.startsWith('top')" class="collapse-icon">
          <svg v-if="isCollapsed" viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M512 842.67L714.67 640H621.33V384H621.33V213.33H402.67V384H402.67V640H309.33L512 842.67Z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M512 181.33L309.33 384H402.67V640H402.67V810.67H621.33V640H621.33V384H714.67L512 181.33Z" fill="currentColor" />
          </svg>
        </div>
        <!-- 底部工具栏 -->
        <div v-else class="collapse-icon">
          <svg v-if="isCollapsed" viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M512 181.33L309.33 384H402.67V640H402.67V810.67H621.33V640H621.33V384H714.67L512 181.33Z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M512 842.67L714.67 640H621.33V384H621.33V213.33H402.67V384H402.67V640H309.33L512 842.67Z" fill="currentColor" />
          </svg>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MapToolbar'
};
</script>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { ToolItem, ToolbarConfig } from '../types';
import type { AddToolOptions } from '../types';
import {info } from "@repo/utils";
interface Props {
  toolbarConfig: ToolbarConfig;
  activeToolId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  toolbarConfig: () => ({
    position: 'top-left',
    direction: 'horizontal',
    itemsPerLine: 8,
    size: 36,
    items: []
  })
});

// 方便在模板和计算属性中使用
const config = computed(() => ({
  position: 'top-left',
  direction: 'horizontal',
  itemsPerLine: 8,
  size: 36,
  items: [],
  ...props.toolbarConfig
}));

// 将tools深拷贝为本地状态，避免与props直接引用
const tools = ref(JSON.parse(JSON.stringify(props.toolbarConfig.items || [])));
const visible = ref(true); // 控制工具栏整体显示/隐藏

const emit = defineEmits([
  'tool-click', 
  'tool-add', 
  'tool-remove', 
  'tool-hide', 
  'tool-show', 
  'tools-change', 
  'tool-activated', 
  'tool-deactivated',
  'collapse-change'
]);

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
    `position-${config.value.position}`,
    `direction-${config.value.direction}`,
    config.value.position.startsWith('top') ? 'top-positioned' : 'bottom-positioned'
  ];
});

// 按钮尺寸
const buttonSize = computed(() => {
  return config.value.size;
});

// 按钮间距
const buttonMargin = computed(() => {
  // 根据按钮尺寸设置合适的间距
  return Math.max(4, Math.round(config.value.size * 0.1));
});

// 图标字体大小
const iconFontSize = computed(() => {
  return Math.round(config.value.size * 0.6) + 'px';
});

// 添加SVG图标尺寸的计算属性
const svgIconSize = computed(() => {
  return Math.round(config.value.size * 0.8) + 'px';
});

// 添加收缩状态
const isCollapsed = ref(false);

// 切换收缩状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  // 触发收缩状态变化事件
  emit('collapse-change', isCollapsed.value);
};

// 修改toolbarStyle计算属性，使用CSS grid来控制每行/列工具数量
const toolbarStyle = computed(() => {
  const style: Record<string, string> = {
    padding: `${buttonMargin.value}px`,
    backgroundColor: 'transparent',
    '--buttonSize': config.value.size + 'px',
    transition: 'all 0.3s ease'
  };

  // 如果设置了每行/列工具数量，使用grid布局
  if (config.value.itemsPerLine && config.value.itemsPerLine > 0) {
    style.display = 'grid';
    style.gap = `${buttonMargin.value}px`;
    
    // 横向排列
    if (config.value.direction === 'horizontal') {
      // 设置grid模板，每行包含itemsPerLine个工具
      style.gridTemplateColumns = `repeat(${config.value.itemsPerLine}, ${config.value.size}px)`;
      
      // 根据位置设置工具的排列顺序
      if (config.value.position.endsWith('right')) {
        style.direction = 'rtl'; // 从右到左排列
      } else {
        style.direction = 'ltr'; // 从左到右排列
      }
    }
    // 纵向排列
    else {
      // 使用纵向的grid布局，每列包含itemsPerLine个工具
      style.gridTemplateRows = `repeat(${config.value.itemsPerLine}, ${config.value.size}px)`;
      style.gridAutoFlow = 'column'; // 自动流向为列方向
      
      // 根据位置调整工具的排列方向
      if (config.value.position.endsWith('right')) {
        style.direction = 'rtl'; // 从右到左排列
      } else {
        style.direction = 'ltr'; // 从左到右排列
      }
      
      // 纵向时还需要处理顶部/底部的位置
      if (config.value.position.startsWith('bottom')) {
        style.gridAutoFlow = 'column dense'; // 使用dense确保从底部开始填充
      }
    }
  } 
  // 不限制工具数量时使用flex布局
  else {
    style.display = 'flex';
    style.gap = `${buttonMargin.value}px`;
    
    // 横向排列
    if (config.value.direction === 'horizontal') {
      // 根据位置设置flex方向
      if (config.value.position.endsWith('right')) {
        style.flexDirection = 'row-reverse';
      } else {
        style.flexDirection = 'row';
      }
    }
    // 纵向排列
    else {
      // 根据位置设置flex方向
      if (config.value.position.endsWith('right')) {
        style.flexDirection = 'column-reverse';
      } else {
        style.flexDirection = 'column';
      }
    }
  }

  // 添加收缩状态样式
  if (isCollapsed.value) {
    if (config.value.direction === 'horizontal') {
      style.transform = config.value.position.endsWith('left') ? 'translateX(-100%)' : 'translateX(100%)';
    } else {
      style.transform = config.value.position.startsWith('top') ? 'translateY(-100%)' : 'translateY(100%)';
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
const handleToolClick = (tool: ToolItem, event?: MouseEvent) => {
  // 如果有事件对象，阻止事件冒泡和默认行为
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  // 避免直接使用传入的tool对象，找到本地副本
  const toolIndex = tools.value.findIndex(t => t.id === tool.id);
  if (toolIndex === -1) return;

  // 获取当前工具的副本
  const currentTool = { ...tools.value[toolIndex] };

  // 获取当前工具激活状态
  const isCurrentlyActive = currentTool.active === true;

  // 创建新的工具列表
  const newTools = [...tools.value];

  info("当前激活工具", currentTool);
  // 处理切换状态工具的特殊逻辑（如显示/隐藏点位）
  if (currentTool.toggleState !== undefined) {
    // 切换状态
    const newToggleState = !currentTool.toggleState;
    info("当前激活工具状态", newToggleState);
    // 更新工具状态并切换图标
    newTools[toolIndex] = { 
      ...currentTool, 
      toggleState: newToggleState,
      // 根据当前状态切换图标
      icon: newToggleState ? currentTool.alternateIcon : (currentTool.originalIcon || currentTool.icon),
      // 只有在"隐藏"状态时才保持激活样式
      active: newToggleState ? true : undefined
    };
    
    // 如果是首次切换，保存原始图标
    if (!currentTool.originalIcon) {
      newTools[toolIndex].originalIcon = currentTool.icon;
    }
    
    // 更新工具列表
    tools.value = newTools;
    
  }

  // 如果当前工具将被激活
  if (!isCurrentlyActive) {
    // 更新当前工具的激活状态
    newTools[toolIndex] = { ...currentTool, active: true };

    // 如果当前工具不支持多选(multi !== true)，则需要停用其他不支持多选的工具
    if (currentTool.multi !== true) {
      for (let i = 0; i < newTools.length; i++) {
        // 只停用其他已激活的且不支持多选的工具
        if (i !== toolIndex && newTools[i].active === true && newTools[i].multi !== true) {
          newTools[i] = { ...newTools[i], active: undefined };
          // 触发该工具的停用事件
          emit('tool-deactivated', newTools[i].id);
        }
      }
    }

    // 更新工具列表
    tools.value = newTools;

    // 触发工具激活事件
    emit('tool-activated', currentTool.id);
  } 
  // 如果当前工具将被停用
  else {
    // 更新当前工具的激活状态
    newTools[toolIndex] = { ...currentTool, active: undefined };

    // 更新工具列表
    tools.value = newTools;

    // 触发工具停用事件
    emit('tool-deactivated', currentTool.id);
  }

  // 触发工具点击事件
  emit('tool-click', {
    id: currentTool.id,
    active: !isCurrentlyActive
  });

  // 如果工具有自己的处理函数，则调用
  if (currentTool.handler) {
    currentTool.handler();
  }
};

// 添加工具栏配置变化的监听，使用nextTick避免递归更新
watch(() => props.toolbarConfig.items, (newItems) => {
  if (newItems && Array.isArray(newItems)) {
    nextTick(() => {
      // 深拷贝避免引用问题
      tools.value = JSON.parse(JSON.stringify(newItems));
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

  &:hover {
    .toolbar-collapse {
      opacity: 1;
    }
  }

  .toolbar-collapse {
    opacity: 0.8;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  &:hover .toolbar-collapse {
    opacity: 1;
  }
}

/* 直接设置位置样式，替代所有之前的收缩按钮位置代码 */
/* 收缩按钮基础样式 */
.toolbar-collapse {
  position: absolute;
  width: 28px;
  height: 28px;
  background-color: #ffffff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 3000;

  &:hover {
    background-color: #f6f6f6;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .collapse-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #666;
    transition: all 0.3s ease;
  }
  
  &:hover .collapse-icon {
    color: #1890ff;
    transform: scale(1.1);
  }
}

/* 水平方向左侧工具栏 */
.direction-horizontal.position-top-left .toolbar-collapse,
.direction-horizontal.position-bottom-left .toolbar-collapse {
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
}

/* 水平方向右侧工具栏 */
.direction-horizontal.position-top-right .toolbar-collapse,
.direction-horizontal.position-bottom-right .toolbar-collapse {
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
}

/* 垂直方向顶部工具栏 - 关键修复 */
.direction-vertical.position-top-left .toolbar-collapse,
.direction-vertical.position-top-right .toolbar-collapse {
  left: 50%;
  bottom: -30px;
  top: auto;
  transform: translateX(-50%);
}

/* 垂直方向底部工具栏 */
.direction-vertical.position-bottom-left .toolbar-collapse,
.direction-vertical.position-bottom-right .toolbar-collapse {
  left: 50%;
  top: -30px;
  bottom: auto;
  transform: translateX(-50%);
}

/* 收缩状态下的样式 */
.map-toolbar[style*="transform"] .toolbar-collapse {
  opacity: 1;
  background-color: #f6f6f6;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* 收缩状态下的位置 */
.direction-horizontal.position-top-left[style*="transform"] .toolbar-collapse,
.direction-horizontal.position-bottom-left[style*="transform"] .toolbar-collapse {
  right: -28px;
  left: auto;
}

.direction-horizontal.position-top-right[style*="transform"] .toolbar-collapse,
.direction-horizontal.position-bottom-right[style*="transform"] .toolbar-collapse {
  left: -28px;
  right: auto;
}

/* 确保收缩状态下垂直工具栏的按钮位置正确 */
.direction-vertical.position-top-left[style*="transform"] .toolbar-collapse,
.direction-vertical.position-top-right[style*="transform"] .toolbar-collapse {
  bottom: -30px;
  top: auto;
  left: 50%;
  transform: translateX(-50%);
}

.direction-vertical.position-bottom-left[style*="transform"] .toolbar-collapse,
.direction-vertical.position-bottom-right[style*="transform"] .toolbar-collapse {
  top: -30px;
  bottom: auto;
  left: 50%;
  transform: translateX(-50%);
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
  border: 2px solid transparent;

  &:hover {
    background-color: #f6f6f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    transition: all 0.1s;
  }

  &.active {
    background-color: #1890ff;
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
    animation: pulse-border 1.5s infinite;
    position: relative;
    z-index: 10;
  }

  &.active:hover {
    background-color: #40a9ff;
    box-shadow: 0 6px 12px rgba(24, 144, 255, 0.4);
  }

  &.active:active {
    background-color: #096dd9;
    transform: translateY(0);
    transition: all 0.1s;
  }
  
  @keyframes pulse-border {
    0% {
      box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.5);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(24, 144, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
    }
  }
  
  /* 删除按钮样式 */
  &.delete-btn {
    color: #ff4d4f;
    
    &:hover {
      background-color: #fff1f0;
      border-color: #ffccc7;
    }
    
    &.active {
      background-color: #ff4d4f;
      color: #ffffff;
      box-shadow: 0 4px 8px rgba(255, 77, 79, 0.3);
    }
    
    &.active:hover {
      background-color: #ff7875;
      box-shadow: 0 6px 12px rgba(255, 77, 79, 0.4);
    }
    
    &.active:active {
      background-color: #f5222d;
    }
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

/* 根据工具栏位置调整提示框位置 */
.position-top-left .toolbar-item .toolbar-tooltip,/* 工具提示样式 */
.toolbar-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 3001;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s, visibility 0.2s;
  visibility: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-width: none; /* 确保不受最大宽度限制 */
  width: auto;     /* 自动调整宽度 */
}

/* 鼠标悬停时显示提示框 */
.toolbar-item:hover .toolbar-tooltip {
  opacity: 1;
  visibility: visible;
}

/* 修复工具提示位置问题 */
.toolbar-item {
  position: relative;
}

/* 确保工具提示在hover时显示在最前面 */
.map-toolbar {
  position: absolute;
  border-radius: 4px;
  z-index: 2000; /* 工具栏基础层级 */
}
.toolbar-item:hover {
  z-index: 2005; /* 确保悬停的按钮在其他按钮之上 */
}
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
  left: auto; /* 确保不使用左侧定位 */
  text-align: right; /* 右对齐文本 */
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
  text-align: center; /* 居中对齐文本 */
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
  text-align: center; /* 居中对齐文本 */
}

/* 确保右侧工具栏的提示框不会超出屏幕左侧 */
.position-top-right .toolbar-item .toolbar-tooltip,
.position-bottom-right .toolbar-item .toolbar-tooltip {
  min-width: 120px; /* 设置最小宽度 */
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
  transition: all 0.3s ease;
}

.toolbar-item.active .svg-icon {
  transform: scale(1.15);
}

.toolbar-item .svg-icon svg {
  width: 100%;
  height: 100%;
  transition: fill 0.3s ease;
}

.toolbar-item.active .svg-icon svg path {
  fill: #ffffff !important;
  stroke: #ffffff !important;
  transition: fill 0.3s ease, stroke 0.3s ease;
}

/* 确保所有SVG子元素都变成白色 */
.toolbar-item.active .svg-icon svg * {
  fill: #ffffff !important;
  stroke: #ffffff !important;
  transition: all 0.3s ease;
}

/* 激活状态的按钮样式 */
.toolbar-item.active {
  background-color: #1890ff;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
  animation: pulse-border 1.5s infinite;
  position: relative;
  z-index: 10;
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

/* 激活状态工具的提示框样式 */
.toolbar-item.active .toolbar-tooltip {
  background-color: rgba(24, 144, 255, 0.9);
  font-weight: bold;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}
</style>
<style lang="scss">
.total-distance {
  background-color: #91bf8a;
  border-radius: 4px;
  padding: 8px;
}

.active{
  path {
    fill: #FFF;
  }
  circle{
    fill: #FFF;
  }
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
  z-index: 3001;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s, visibility 0.2s;
  visibility: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-width: none;
  /* 确保不受最大宽度限制 */
  width: auto;
  /* 自动调整宽度 */
}

/* 鼠标悬停时显示提示框 */
.toolbar-item:hover .toolbar-tooltip {
  opacity: 1;
  visibility: visible;
}

/* 修复工具提示位置问题 */
.toolbar-item {
  position: relative;
}

/* 确保工具提示在hover时显示在最前面 */
.map-toolbar {
  position: absolute;
  border-radius: 4px;
  z-index: 2000;
  /* 工具栏基础层级 */
}

.toolbar-item:hover {
  z-index: 2005;
  /* 确保悬停的按钮在其他按钮之上 */
}
</style>