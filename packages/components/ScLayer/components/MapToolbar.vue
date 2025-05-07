/**
 * 地图工具栏
 * @author CH
 * @date 2025-04-29
 */
<template>
  <div :class="[toolbarClass, `size-${config.size}`]" :style="toolbarStyle" v-if="visible" @dblclick.stop.prevent>
    <div v-for="tool in visibleTools" :key="tool.id" 
      class="toolbar-item" 
      :class="[
        { active: tool.active === true }, 
        { 'has-submenu': tool.type === 'menu' && tool.children?.length},
        tool.className
      ]"
      :data-tool-id="tool.id"
      @click="(e) => handleToolClick(tool, e)" 
      @dblclick.stop.prevent>
      <span v-if="typeof tool.icon === 'string'" class="svg-icon" v-html="tool.icon"></span>
      <component v-else :is="tool.icon" />
      <div class="toolbar-tooltip" v-if="!(tool.type === 'menu' && openSubMenus.includes(tool.id))">
        {{ tool.tooltip || tool.name }}
      </div>
      
      <!-- 子菜单 -->
      <div v-if="tool.type === 'menu' && tool.children?.length" 
           class="toolbar-submenu" 
           :class="[
             { 'submenu-active': openSubMenus.includes(tool.id) && tool.active === true },
             `direction-${config.direction}`
           ]">
        <div class="submenu-arrow"></div>
        <div v-for="subTool in tool.children" :key="subTool.id"
             class="submenu-item toolbar-item color-override"
             :class="[{ active: subTool.active === true }, subTool.className]"
             :data-tool-id="subTool.id"
             @click.stop.prevent="(e) => handleSubMenuClick(tool, subTool, e)">
          <span v-if="typeof subTool.icon === 'string'" class="svg-icon submenu-icon" v-html="subTool.icon"></span>
          <component v-else-if="subTool.icon" :is="subTool.icon" class="submenu-icon" />
          <div class="toolbar-tooltip">
            {{ subTool.tooltip || subTool.name }}
          </div>
        </div>
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
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import type { ToolItem, ToolbarConfig, AddToolOptions } from '../types';
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

// 追踪打开的子菜单
const openSubMenus = ref<string[]>([]);

// 关闭窗口点击事件监听器函数引用
let globalClickListener: ((e: MouseEvent) => void) | null = null;

const emit = defineEmits([
  'tool-click', 
  'tool-add', 
  'tool-remove', 
  'tool-hide', 
  'tool-show', 
  'tools-change', 
  'tool-activated', 
  'tool-deactivated',
  'collapse-change',
  'submenu-open',
  'submenu-close',
  'submenu-item-click'
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
  } else {
    // 如果没有设置每行/列工具数量，使用flex布局
    style.display = 'flex';
    style.flexDirection = config.value.direction === 'horizontal' ? 'row' : 'column';
    style.flexWrap = 'wrap';
    style.gap = `${buttonMargin.value}px`;
    
    // 根据位置设置对齐方式
    if (config.value.position.endsWith('right')) {
      style.justifyContent = 'flex-end';
    } else if (config.value.position.endsWith('center')) {
      style.justifyContent = 'center';
    } else {
      style.justifyContent = 'flex-start';
    }
    
    // 垂直方向的对齐
    if (config.value.position.startsWith('bottom')) {
      style.alignItems = 'flex-end';
    } else if (config.value.position.startsWith('middle')) {
      style.alignItems = 'center';
    } else {
      style.alignItems = 'flex-start';
    }
  }
  
  return style;
});

// 处理工具点击事件
const handleToolClick = (tool: ToolItem, event: MouseEvent) => {
  // 如果工具被禁用，不执行任何操作
  if (tool.disabled) {
    return;
  }
  
  // 如果是菜单类型，切换子菜单的显示状态
  if (tool.type === 'menu' && tool.children?.length) {
    toggleSubMenu(tool.id);
    return;
  }
  
  // 如果是切换类型，切换激活状态
  if (tool.type === 'toggle') {
    tool.active = !tool.active;
    
    // 触发激活/停用事件
    if (tool.active) {
      emit('tool-activated', tool.id);
    } else {
      emit('tool-deactivated', tool.id);
    }
  }
  
  // 触发工具点击事件
  emit('tool-click', {
    toolId: tool.id,
    tool: tool,
    event: event
  });
};

// 处理子菜单项点击事件
const handleSubMenuClick = (parentTool: ToolItem, subTool: ToolItem, event: MouseEvent) => {
  // 如果子菜单项被禁用，不执行任何操作
  if (subTool.disabled) {
    return;
  }
  
  // 如果是切换类型，切换激活状态
  if (subTool.type === 'toggle') {
    subTool.active = !subTool.active;
    
    // 触发激活/停用事件
    if (subTool.active) {
      emit('tool-activated', subTool.id);
    } else {
      emit('tool-deactivated', subTool.id);
    }
  }
  
  // 触发子菜单项点击事件
  emit('submenu-item-click', {
    parentToolId: parentTool.id,
    toolId: subTool.id,
    tool: subTool,
    event: event
  });
  
  // 关闭子菜单
  closeSubMenu(parentTool.id);
};

// 切换子菜单的显示状态
const toggleSubMenu = (toolId: string) => {
  const index = openSubMenus.value.indexOf(toolId);
  
  if (index === -1) {
    // 打开子菜单
    openSubMenus.value.push(toolId);
    emit('submenu-open', toolId);
    
    // 添加全局点击事件监听器，用于关闭子菜单
    if (!globalClickListener) {
      globalClickListener = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const toolbarItem = target.closest('.toolbar-item');
        
        if (!toolbarItem || !toolbarItem.hasAttribute('data-tool-id')) {
          // 点击在工具栏外部，关闭所有子菜单
          closeAllSubMenus();
        }
      };
      
      document.addEventListener('click', globalClickListener);
    }
  } else {
    // 关闭子菜单
    openSubMenus.value.splice(index, 1);
    emit('submenu-close', toolId);
  }
};

// 关闭指定子菜单
const closeSubMenu = (toolId: string) => {
  const index = openSubMenus.value.indexOf(toolId);
  
  if (index !== -1) {
    openSubMenus.value.splice(index, 1);
    emit('submenu-close', toolId);
  }
};

// 关闭所有子菜单
const closeAllSubMenus = () => {
  if (openSubMenus.value.length > 0) {
    const closedMenus = [...openSubMenus.value];
    openSubMenus.value = [];
    
    // 触发所有关闭的子菜单事件
    closedMenus.forEach(toolId => {
      emit('submenu-close', toolId);
    });
  }
};

// 添加工具
const addTool = (tool: ToolItem, options?: AddToolOptions) => {
  const { position = 'end' } = options || {};
  
  // 检查工具ID是否已存在
  const existingIndex = tools.value.findIndex(t => t.id === tool.id);
  
  if (existingIndex !== -1) {
    // 如果工具已存在，更新工具
    tools.value[existingIndex] = { ...tool };
  } else {
    // 如果工具不存在，添加新工具
    if (position === 'start') {
      tools.value.unshift(tool);
    } else {
      tools.value.push(tool);
    }
  }
  
  // 触发工具添加事件
  emit('tool-add', tool);
  
  // 触发工具变化事件
  emit('tools-change', tools.value);
};

// 移除工具
const removeTool = (toolId: string) => {
  const index = tools.value.findIndex(tool => tool.id === toolId);
  
  if (index !== -1) {
    const removedTool = tools.value.splice(index, 1)[0];
    
    // 触发工具移除事件
    emit('tool-remove', removedTool);
    
    // 触发工具变化事件
    emit('tools-change', tools.value);
  }
};

// 隐藏工具
const hideTool = (toolId: string) => {
  const tool = tools.value.find(tool => tool.id === toolId);
  
  if (tool) {
    tool.show = false;
    
    // 触发工具隐藏事件
    emit('tool-hide', tool);
    
    // 触发工具变化事件
    emit('tools-change', tools.value);
  }
};

// 显示工具
const showTool = (toolId: string) => {
  const tool = tools.value.find(tool => tool.id === toolId);
  
  if (tool) {
    tool.show = true;
    
    // 触发工具显示事件
    emit('tool-show', tool);
    
    // 触发工具变化事件
    emit('tools-change', tools.value);
  }
};

// 激活工具
const activateTool = (toolId: string) => {
  const tool = tools.value.find(tool => tool.id === toolId);
  
  if (tool && tool.type === 'toggle') {
    tool.active = true;
    
    // 触发工具激活事件
    emit('tool-activated', toolId);
  }
};

// 停用工具
const deactivateTool = (toolId: string) => {
  const tool = tools.value.find(tool => tool.id === toolId);
  
  if (tool && tool.type === 'toggle') {
    tool.active = false;
    
    // 触发工具停用事件
    emit('tool-deactivated', toolId);
  }
};

// 监听activeToolId变化
watch(() => props.activeToolId, (newToolId, oldToolId) => {
  if (oldToolId) {
    deactivateTool(oldToolId);
  }
  
  if (newToolId) {
    activateTool(newToolId);
  }
}, { immediate: true });

// 监听toolbarConfig变化
watch(() => props.toolbarConfig, (newConfig) => {
  // 更新本地工具列表
  tools.value = JSON.parse(JSON.stringify(newConfig.items || []));
  
  // 触发工具变化事件
  emit('tools-change', tools.value);
}, { deep: true });

// 组件销毁前清理
onBeforeUnmount(() => {
  // 移除全局点击事件监听器
  if (globalClickListener) {
    document.removeEventListener('click', globalClickListener);
    globalClickListener = null;
  }
});

// 暴露方法给父组件
defineExpose({
  showToolbar,
  hideToolbar,
  addTool,
  removeTool,
  hideTool,
  showTool,
  activateTool,
  deactivateTool,
  closeAllSubMenus
});
</script>

<style scoped>
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

/* 鼠标悬停时显示提示框，但子菜单打开时父菜单不显示tooltip */
.toolbar-item:hover .toolbar-tooltip {
  opacity: 1;
  visibility: visible;
}

/* 当子菜单激活时，禁用父菜单的tooltip */
.toolbar-item.has-submenu.active:hover .toolbar-tooltip,
.toolbar-submenu.submenu-active ~ .toolbar-tooltip,
.toolbar-item.has-submenu.active .toolbar-tooltip {
  opacity: 0;
  visibility: hidden;
  display: none; /* 确保完全隐藏 */
}

/* 子菜单打开时，子菜单项的tooltip正常显示 */
.toolbar-submenu.submenu-active .submenu-item:hover .toolbar-tooltip {
  opacity: 1;
  visibility: visible;
  z-index: 3005; /* 确保tooltip显示在最上层 */
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
.toolbar-item.active:not(.submenu-item) .svg-icon svg * {
  fill: #ffffff !important;
  stroke: #ffffff !important;
  transition: all 0.3s ease;
}

/* 修复：子菜单项SVG图标颜色控制 */
.toolbar-item.active .toolbar-submenu .submenu-item:not(.active) .svg-icon svg * {
  fill: #666666 !important;
  stroke: #666666 !important;
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

/* 子菜单相关样式 */
.toolbar-item.has-submenu {
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #666;
    transition: all 0.3s ease;
  }
  
  &.active::after {
    background-color: #fff;
  }
  
  &:hover::after {
    background-color: #1890ff;
  }
}

/* 确保子菜单只在父菜单激活状态下显示 */
.toolbar-item.has-submenu:not(.active) .toolbar-submenu {
  display: none !important;
}

/* 确保子菜单在点击时不会被意外关闭 */
.toolbar-submenu.submenu-active {
  pointer-events: auto;
  z-index: 2015;
}

/* 子菜单项hover状态 */
.toolbar-submenu .submenu-item:hover {
  z-index: 2020;
}

/* 横向排列时的子菜单指示器（小点位置） */
.direction-horizontal .toolbar-item.has-submenu::after {
  right: 3px;
  bottom: 3px;
}

/* 纵向排列时的子菜单指示器（小点位置） */
.direction-vertical .toolbar-item.has-submenu::after {
  right: 3px;
  top: 50%;
  transform: translateY(-50%);
}

.toolbar-submenu {
  position: absolute;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  z-index: 2010;
  display: none;
  padding: 4px;
  transform-origin: top left;
  animation: submenu-fade-in 0.2s ease;
  
  &.submenu-active {
    display: flex;
    z-index: 2015; /* 确保子菜单比父菜单层级更高 */
  }
  
  /* 横向排列的子菜单 */
  &.direction-horizontal {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
    display: flex;
    flex-direction: row;
    
    /* 箭头样式 */
    .submenu-arrow {
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 8px solid #ffffff;
      z-index: 2011;
    }
    
    /* 在右侧边缘时左对齐 */
    .position-top-right &,
    .position-bottom-right & {
      left: auto;
      right: 0;
      transform: none;
      
      .submenu-arrow {
        left: auto;
        right: calc(50% - 20px); /* 相对于子菜单项居中 */
        transform: none;
      }
    }
    
    /* 在左侧边缘时右对齐 */
    .position-top-left &,
    .position-bottom-left & {
      left: 0;
      transform: none;
      
      .submenu-arrow {
        left: calc(50% - 20px); /* 相对于子菜单项居中 */
        transform: none;
      }
    }
    
    /* 当工具栏在底部时，子菜单显示在上方 */
    .position-bottom-left &,
    .position-bottom-right & {
      top: auto;
      bottom: 100%;
      margin-top: 0;
      margin-bottom: 8px;
      
      .submenu-arrow {
        top: auto;
        bottom: -8px;
        border-bottom: none;
        border-top: 8px solid #ffffff;
      }
    }
  }
  
  /* 纵向排列的子菜单 */
  &.direction-vertical {
    top: 0;
    left: 100%;
    margin-left: 8px;
    display: flex;
    flex-direction: column;
    
    /* 箭头样式 */
    .submenu-arrow {
      position: absolute;
      top: 18px; /* 约为按钮高度的一半 */
      left: -8px;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-right: 8px solid #ffffff;
      z-index: 2011;
    }
    
    /* 位于右侧时的子菜单 */
    .position-top-right &,
    .position-bottom-right & {
      left: auto;
      right: 100%;
      margin-right: 8px;
      margin-left: 0;
      
      .submenu-arrow {
        left: auto;
        right: -8px;
        top: 18px; /* 与左侧保持一致 */
        border-right: none;
        border-left: 8px solid #ffffff;
      }
    }
    
    /* 位于底部时的子菜单 */
    .position-bottom-left &,
    .position-bottom-right & {
      top: auto;
      bottom: 0;
    }
  }
  
  @keyframes submenu-fade-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.submenu-item {
  margin: 4px;
  
  /* 横向排列时子菜单项的特殊样式 */
  .toolbar-submenu.direction-horizontal & {
    margin: 0 4px;
  }
  
  /* 纵向排列时子菜单项的特殊样式 */
  .toolbar-submenu.direction-vertical & {
    margin: 4px 0;
  }
  
  /* 修复激活的父菜单影响子菜单项样式的问题 */
  .svg-icon {
    color: initial;
  }
  
  &:hover {
    background-color: #f6f6f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &.active {
    background-color: #1890ff;
    color: #ffffff;
  }
  
  &.active .svg-icon svg * {
    fill: #ffffff !important;
    stroke: #ffffff !important;
  }
}

/* 特殊处理子菜单项的图标样式，确保不受父菜单影响 */
.color-override {
  /* 重置继承的颜色 */
  color: #666666 !important;
  
  /* 强制子菜单图标颜色 */
  .submenu-icon {
    color: #666666 !important;
  }
  
  .submenu-icon svg * {
    fill: #666666 !important;
    stroke: #666666 !important;
  }
  
  .submenu-icon path {
    fill: #666666 !important;
    stroke: #666666 !important;
  }
  
  /* 激活状态单独处理 */
  &.active {
    color: #ffffff !important;
    
    .submenu-icon {
      color: #ffffff !important;
    }
    
    .submenu-icon svg * {
      fill: #ffffff !important;
      stroke: #ffffff !important;
    }
    
    .submenu-icon path {
      fill: #ffffff !important;
      stroke: #ffffff !important;
    }
  }
}

/* 确保子菜单项不继承父菜单的active样式 */
.toolbar-item.active .toolbar-submenu .submenu-item:not(.active) {
  background-color: #ffffff;
  color: initial;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: none;
  
  .svg-icon svg * {
    fill: #666666 !important;
    stroke: #666666 !important;
  }
  
  .svg-icon {
    color: initial !important;
  }
  
  .svg-icon svg path {
    fill: #666666 !important;
    stroke: #666666 !important;
  }
  
  &:hover {
    background-color: #f6f6f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}

/* 最高优先级样式，确保子菜单项图标颜色不受任何影响 */
.toolbar-submenu .submenu-item .submenu-icon svg *,
.toolbar-submenu .submenu-item .submenu-icon path,
.toolbar-submenu .submenu-item .submenu-icon circle {
  fill: #666666 !important;
  stroke: #666666 !important;
  color: #666666 !important;
}

/* 子菜单项激活状态特殊处理 */
.toolbar-submenu .submenu-item.active .submenu-icon svg *,
.toolbar-submenu .submenu-item.active .submenu-icon path,
.toolbar-submenu .submenu-item.active .submenu-icon circle {
  fill: #ffffff !important;
  stroke: #ffffff !important;
  color: #ffffff !important;
}

/* 增加子菜单点击的稳定性 */
.toolbar-item.has-submenu.active {
  z-index: 2010; /* 确保激活的父菜单显示在较高层级 */
}

.toolbar-submenu.submenu-active .submenu-item {
  position: relative;
  z-index: 2020; /* 确保子菜单项显示在最高层级 */
}
</style>
<style lang="scss">
.total-distance {
  background-color: #91bf8a;
  border-radius: 4px;
  padding: 8px;
}

/* 修改全局active样式，避免影响子菜单项 */
.active:not(.submenu-item):not(.color-override){
  path {
    fill: #FFF;
  }
  circle{
    fill: #FFF;
  }
}

/* 单独定义子菜单项激活样式 */
.submenu-item.active {
  path {
    fill: #FFF !important;
  }
  circle{
    fill: #FFF !important;
  }
}

/* 父菜单激活时重置子菜单图标样式 */
.toolbar-item.active .toolbar-submenu .submenu-item:not(.active) {
  path {
    fill: #666666 !important;
  }
  circle{
    fill: #666666 !important;
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