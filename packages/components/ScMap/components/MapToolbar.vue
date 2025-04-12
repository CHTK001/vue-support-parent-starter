<template>
  <div
    class="map-toolbar"
    :class="[positionClass, { collapsed }, `size-${buttonSize}`]"
    v-show="show"
  >
    <div class="toolbar-container">
      <div class="tool-group">
        <div class="toolbar-header" :class="{ 'right-side': isRightSide }" :style="{ gridTemplateColumns: isRightSide ? `auto repeat(${itemsPerRow - 1}, 1fr)` : `repeat(${itemsPerRow}, 1fr) auto` }">
          <!-- 右侧位置时的折叠/展开按钮 -->
          <div v-if="isRightSide" class="toggle-btn tool-btn" @click="$emit('toggle-collapse')">
            <div class="tool-icon" v-html="collapsed ? expandIcon : collapseIcon"></div>
          </div>
          
          <!-- 工具按钮 -->
          <div
            v-for="tool in allToolsToShow"
            :key="tool.id"
            class="tool-btn"
            :class="{ active: isActiveToolState(tool.id), disabled: tool.disabled }"
            @click="!tool.disabled && handleToolClick(tool)"
            :title="getToolLabel(tool.id)"
            v-show="!collapsed"
          >
            <div class="tool-icon" v-html="getToolIcon(tool.id)"></div>
          </div>
          
          <!-- 左侧位置时的折叠/展开按钮放在同一行 -->
          <div v-if="!isRightSide" class="toggle-btn tool-btn" @click="$emit('toggle-collapse')">
            <div class="tool-icon" v-html="collapsed ? expandIcon : collapseIcon"></div>
          </div>
        </div>
        
        <!-- 分类过滤器 -->
        <div class="category-filter" v-if="markerCategories.length > 0 && !collapsed">
          <div class="filter-title">标记点分类</div>
          <div
            v-for="category in markerCategories"
            :key="category"
            class="category-item"
            :class="{ active: visibleCategories.includes(category) }"
            @click="toggleCategory(category)"
          >
            <div class="category-icon">
              <i class="icon-marker"></i>
            </div>
            <div class="category-label">{{ category }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps, defineExpose, watch } from 'vue';
import { type ToolType, type ToolsOptions } from '../types';

// 自定义工具接口
interface CustomTool {
  id: string;
  callback?: string;
  visible?: boolean;
  icon?: string;
  label?: string;
  disabled?: boolean;
  type?: 'normal' | 'switch'; // 添加按钮类型属性
  active?: boolean; // 按钮激活状态，主要用于switch类型
}

interface ToolbarProps {
  show?: boolean;
  position?: string;
  collapsed?: boolean;
  options?: ToolsOptions;
  markers?: any[];
  activeTool?: string;
  modelValue?: string; // v-model支持
  showPosition?: boolean; // v-model:showPosition支持
  itemsPerRow?: number; // 每行显示的工具数量
  buttonSize?: 'small' | 'default' | 'large'; // 按钮大小
}

const props = withDefaults(defineProps<ToolbarProps>(), {
  show: true,
  position: 'left-top',
  collapsed: false,
  options: () => ({
    circle: true,
    polygon: true,
    rectangle: true,
    polyline: true,
    distance: true,
    marker: true,
    clear: true
  }),
  markers: () => [],
  activeTool: '',
  modelValue: '',
  showPosition: false,
  itemsPerRow: 12, // 默认每行显示4个工具
  buttonSize: 'default' // 默认使用小尺寸按钮
});

const emit = defineEmits([
  'tool-click',
  'toggle-collapse',
  'category-toggle',
  'update:modelValue',
  'update:showPosition',
  'debug-toggle'
]);

// 自定义工具
const customTools = ref<CustomTool[]>([]);
// 自定义图标
const customIcons = ref<Record<string, string>>({});
// 自定义标签
const customLabels = ref<Record<string, string>>({});
// 禁用的工具
const disabledTools = ref<string[]>([]);

// 工具属性
const toolValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 监听activeTool变化
watch(() => props.activeTool, (newValue) => {
  if (newValue !== toolValue.value) {
    toolValue.value = newValue;
  }
});

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== toolValue.value) {
    toolValue.value = newValue;
  }
});

// 单独存储开关状态的工具
const switchStates = ref<Record<string, boolean>>({});

/**
 * 添加自定义工具
 * @param id 工具ID
 * @param icon 工具图标，支持SVG或图片URL
 * @param label 工具标签
 * @param callback 点击回调名称，可选
 * @param visible 是否可见，默认true
 * @param disabled 是否禁用，默认false
 * @param type 按钮类型，normal为普通按钮，switch为开关按钮，默认normal
 */
const addTool = (id: string, icon: string, label: string, callback?: string, visible: boolean = true, disabled: boolean = false, type: 'normal' | 'switch' = 'normal') => {
  // 避免重复添加
  if (customTools.value.find(tool => tool.id === id)) {
    return false;
  }
  
  // 添加工具
  customTools.value.push({ 
    id, 
    callback, 
    visible, 
    disabled,
    type,
    active: false
  });
  
  // 设置图标和标签
  customIcons.value[id] = icon;
  customLabels.value[id] = label;
  
  return true;
};

/**
 * 删除工具
 * @param id 工具ID
 */
const removeTool = (id: string) => {
  const index = customTools.value.findIndex(tool => tool.id === id);
  if (index !== -1) {
    customTools.value.splice(index, 1);
    delete customIcons.value[id];
    delete customLabels.value[id];
    return true;
  }
  return false;
};

/**
 * 禁用工具
 * @param id 工具ID
 * @param disabled 是否禁用
 */
const disableTool = (id: string, disabled: boolean = true) => {
  // 处理自定义工具
  const customTool = customTools.value.find(tool => tool.id === id);
  if (customTool) {
    customTool.disabled = disabled;
    return true;
  }
  
  // 处理默认工具
  if (disabled) {
    if (!disabledTools.value.includes(id)) {
      disabledTools.value.push(id);
    }
  } else {
    const index = disabledTools.value.indexOf(id);
    if (index !== -1) {
      disabledTools.value.splice(index, 1);
    }
  }
  
  return true;
};

/**
 * 修改工具图标
 * @param id 工具ID
 * @param icon 新图标，支持SVG或图片URL
 */
const setToolIcon = (id: string, icon: string) => {
  if (icon) {
    customIcons.value[id] = icon;
    return true;
  }
  return false;
};

/**
 * 修改工具标签
 * @param id 工具ID
 * @param label 新标签
 */
const setToolLabel = (id: string, label: string) => {
  if (label) {
    customLabels.value[id] = label;
    return true;
  }
  return false;
};

/**
 * 获取工具图标
 * @param toolId 工具ID
 */
const getToolIcon = (toolId: string) => {
  // 优先使用自定义图标
  if (customIcons.value[toolId]) {
    // 检查是否为URL
    if (customIcons.value[toolId].startsWith('http') || customIcons.value[toolId].startsWith('/')) {
      return `<img src="${customIcons.value[toolId]}" width="20" height="20" alt="${toolId}" />`;
    }
    return customIcons.value[toolId];
  }

  // 默认图标
  const defaultIcons: Record<string, string> = {
    'circle': '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'polygon': '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M5,19 L19,19 L12,5 L5,19z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'rectangle': '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="5" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'polyline': '<svg viewBox="0 0 24 24" width="20" height="20"><polyline points="5,19 9,9 14,17 19,5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'distance': '<svg viewBox="0 0 24 24" width="20" height="20"><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>',
    'clear': '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6,6 L18,18 M6,18 L18,6" stroke="currentColor" stroke-width="2"/></svg>',
    'marker': '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12,21 L12,21 C12,21 18,16 18,10 C18,6.13 15.31,3 12,3 C8.69,3 6,6.13 6,10 C6,16 12,21 12,21 Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'position': '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12,2 L12,6 M12,18 L12,22 M2,12 L6,12 M18,12 L22,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'debug': '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M20,8 L17,11 L20,14 M4,8 L7,11 L4,14" stroke="currentColor" stroke-width="2" fill="none"/><rect x="8" y="6" width="8" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" stroke-width="2"/><line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" stroke-width="2"/></svg>'
  };
  
  return defaultIcons[toolId] || `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>`;
};

/**
 * 获取工具标签
 * @param toolId 工具ID
 */
const getToolLabel = (toolId: string) => {
  // 优先使用自定义标签
  if (customLabels.value[toolId]) {
    return customLabels.value[toolId];
  }
  
  // 默认标签
  const defaultLabels: Record<string, string> = {
    'circle': '绘制圆形',
    'polygon': '绘制多边形',
    'rectangle': '绘制矩形',
    'polyline': '绘制线',
    'distance': '测量距离',
    'clear': '清除',
    'marker': '添加标记',
    'position': '显示坐标',
    'debug': '调试'
  };
  
  return defaultLabels[toolId] || toolId;
};

// 映射position属性到CSS类
const positionClass = computed(() => {
  // 兼容新旧API
  // 旧API: left-top, left-bottom, right-top, right-bottom
  // 新API: top-left, top-right, bottom-left, bottom-right
  const posMap: Record<string, string> = {
    'left-top': 'top-left',
    'left-bottom': 'bottom-left',
    'right-top': 'top-right',
    'right-bottom': 'bottom-right',
  };
  
  return posMap[props.position] || props.position;
});

// 根据options属性确定默认工具集
const defaultToolsToShow = computed(() => {
  const tools: CustomTool[] = [];
  
  // 获取默认工具配置
  const {
    circle = true,
    polygon = true,
    rectangle = true,
    polyline = true,
    distance = true,
    marker = true,
    clear = false, // 默认不显示清除按钮
    debug = false  // 默认不显示调试按钮
  } = props.options;
  
  // 添加工具
  if (circle) tools.push({ id: 'circle', visible: true });
  if (polygon) tools.push({ id: 'polygon', visible: true });
  if (rectangle) tools.push({ id: 'rectangle', visible: true });
  if (polyline) tools.push({ id: 'polyline', visible: true });
  if (distance) tools.push({ id: 'distance', visible: true });
  if (marker) tools.push({ id: 'marker', visible: true });
  if (clear) tools.push({ id: 'clear', visible: true });
  if (debug) tools.push({ id: 'debug', visible: true });
  
  // 不再在默认工具集中添加position工具，而是通过setupMapTools方法添加为switch类型
  
  return tools;
});

// 监听showPosition变化，更新position工具状态
watch(() => props.showPosition, (newValue) => {
  // 如果已经有了position工具，则更新其状态
  setToolState('position', newValue);
});

// 处理工具点击
const handleToolClick = (tool: CustomTool) => {
  // 特殊处理坐标显示工具 - 如果是通过默认工具集添加的
  if (tool.id === 'position' && tool.type !== 'switch') {
    // 只有在position是普通按钮时才会有这样的处理
    const newPositionVisible = !props.showPosition;
    emit('update:showPosition', newPositionVisible);
    // 不改变当前工具状态
    return;
  }
  
  // 特殊处理调试按钮 - 直接触发调试事件
  if (tool.id === 'debug') {
    emit('debug-toggle');
    // 不改变当前工具状态
    return;
  }
  
  // 处理switch类型按钮
  if (tool.type === 'switch') {
    // 切换开关状态
    switchStates.value[tool.id] = !switchStates.value[tool.id];
    
    // 对于position工具特殊处理
    if (tool.id === 'position') {
      emit('update:showPosition', switchStates.value[tool.id]);
    }
    
    // 发送工具点击事件，包含状态信息
    emit('tool-click', tool.id, tool.callback, switchStates.value[tool.id]);
    
    // 不修改当前工具状态
    return;
  }
  
  // 点击同一工具时取消选择
  if (toolValue.value === tool.id) {
    toolValue.value = '';
    emit('tool-click', '', ''); // 发送空字符串表示取消选择
  } else {
    // 否则选择新工具
    toolValue.value = tool.id as ToolType;
    emit('tool-click', tool.id, tool.callback);
  }
};

/**
 * 是否是激活状态的工具
 * @param toolId 工具ID
 */
const isActiveToolState = (toolId: string) => {
  // 对于switch类型工具，根据switch状态判断
  const customTool = customTools.value.find(t => t.id === toolId);
  if (customTool?.type === 'switch') {
    return !!switchStates.value[toolId];
  }
  
  // 对于普通工具，根据currentTool判断
  return toolValue.value === toolId;
};

/**
 * 设置工具开关状态
 * @param id 工具ID
 * @param active 是否激活
 */
const setToolState = (id: string, active: boolean) => {
  const customTool = customTools.value.find(t => t.id === id);
  if (customTool?.type === 'switch') {
    switchStates.value[id] = active;
    return true;
  }
  return false;
};

// 提取标记点的所有唯一分类
const markerCategories = computed(() => {
  if (!props.markers || props.markers.length === 0) return [];
  
  const categories = props.markers
    .map(marker => marker.category)
    .filter(Boolean);
  
  return [...new Set(categories)];
});

// 可见的分类
const visibleCategories = ref<string[]>([]);

// 切换分类可见性
const toggleCategory = (category: string) => {
  const index = visibleCategories.value.indexOf(category);
  if (index !== -1) {
    visibleCategories.value.splice(index, 1);
  } else {
    visibleCategories.value.push(category);
  }
  
  emit('category-toggle', category, visibleCategories.value);
};

// 折叠/展开图标
const collapseIcon = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6,9 L12,15 L18,9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const expandIcon = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6,15 L12,9 L18,15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

// 所有显示的工具（默认+自定义）
const allToolsToShow = computed(() => {
  // 合并默认工具和自定义工具
  const allTools = [...defaultToolsToShow.value, ...customTools.value];
  
  // 添加禁用状态
  const processedTools = allTools.map(tool => {
    // 检查是否被禁用
    if (disabledTools.value.includes(tool.id)) {
      return { ...tool, disabled: true };
    }
    return tool;
  });
  
  // 过滤掉不可见的工具
  return processedTools.filter(tool => tool.visible !== false);
});

// 获取所有工具
const getAllTools = () => {
  return allToolsToShow.value;
};

// 获取当前激活的工具
const getActiveTool = () => {
  return toolValue.value;
};

// 设置工具可见性
const setToolVisible = (toolId: string, visible: boolean) => {
  const tool = customTools.value.find(t => t.id === toolId);
  if (tool) {
    tool.visible = visible;
    return true;
  }
  return false;
};

/**
 * 设置每行显示工具数量
 * @param count 每行工具数量
 */
const setItemsPerRow = (count: number) => {
  if (count > 0) {
    // 这里我们不直接修改props，因为props是只读的
    // 实际应用中应该通过组件实例的直接调用或事件通知父组件更新
    console.log(`设置每行工具数量为: ${count}`);
    return true;
  }
  return false;
};

// 判断工具栏是否在右侧
const isRightSide = computed(() => {
  return props.position.includes('right');
});

// 暴露方法供外部调用
defineExpose({
  addTool,
  removeTool,
  disableTool,
  setToolIcon,
  setToolLabel,
  setToolState,
  setItemsPerRow
});
</script>

<style scoped>
.map-toolbar {
  position: absolute;
  z-index: 100;
  pointer-events: none;
  transition: all 0.3s ease;
}

.toolbar-container {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  background: transparent;
  overflow: hidden;
  max-width: calc(100% - 20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top left;
}

.tool-group {
  display: flex;
  flex-direction: column;
}

/* 工具栏头部，包含工具按钮和折叠按钮在同一行 */
.toolbar-header {
  display: grid;
  gap: 4px; /* 按钮间距 */
  padding: 4px;
  align-items: center;
}

/* 右侧工具栏特殊样式 */
.toolbar-header.right-side {
  gap: 3px; /* 右侧工具栏间距减小 */
  padding: 4px 2px 4px 4px; /* 右侧内边距减小 */
  justify-content: start; /* 靠左对齐 */
}

.tool-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px; /* 减小按钮尺寸 */
  height: 30px; /* 减小按钮尺寸 */
  border-radius: 4px;
  transition: all 0.2s;
  position: relative;
  color: #666;
  background-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.tool-btn:hover {
  background-color: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  color: #333;
}

.tool-btn.active {
  background-color: rgba(19, 121, 222, 0.15);
  color: #1379de;
  box-shadow: 0 0 0 2px rgba(19, 121, 222, 0.3);
  transform: translateY(-1px);
}

.tool-btn.active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 2px;
  background-color: #1379de;
  border-radius: 1px;
}

.tool-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  background-color: rgba(255, 255, 255, 0.5);
}

.tool-icon {
  width: 18px; /* 减小图标尺寸 */
  height: 18px; /* 减小图标尺寸 */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.tool-btn:hover .tool-icon {
  transform: scale(1.1);
}

.tool-btn.active .tool-icon {
  transform: scale(1.05);
}

/* 折叠按钮样式 */
.toggle-btn {
  margin-left: 2px;
  background-color: rgba(255, 255, 255, 0.7);
}

.toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

/* 在折叠状态下保持toggle-btn可见 */
.map-toolbar.collapsed .toolbar-container {
  width: auto;
}

.map-toolbar.collapsed .toggle-btn {
  width: 30px; /* 与其他按钮保持一致 */
  height: 30px; /* 与其他按钮保持一致 */
  margin: 0;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* 分类过滤器样式 */
.category-filter {
  margin-top: 4px;
  padding: 6px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.filter-title {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #555;
  padding: 0 4px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 2px;
  gap: 6px;
  transition: all 0.2s;
}

.category-item:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

.category-item.active {
  background-color: rgba(255, 255, 255, 0.95);
  color: #1890ff;
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.3);
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.category-label {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

/* 右侧位置的工具栏样式调整 */
.map-toolbar.top-right .toolbar-container,
.map-toolbar.bottom-right .toolbar-container {
  transform-origin: top right;
}

.map-toolbar.collapsed .toggle-btn {
  margin-left: 0;
}

/* 位置控制，统一间距 */
.map-toolbar.top-left {
  top: 10px;
  left: 10px;
}

.map-toolbar.top-right {
  top: 10px;
  right: 0px; /* 减少右侧间距 */
}

.map-toolbar.bottom-left {
  bottom: 10px;
  left: 10px;
}

.map-toolbar.bottom-right {
  bottom: 10px;
  right: 0px; /* 减少右侧间距 */
}

/* 移除旧的右侧工具栏内部padding调整 */

@media (max-width: 768px) {
  .toolbar-header {
    gap: 3px;
    padding: 3px;
  }
  
  .tool-btn {
    width: 26px;
    height: 26px;
  }
  
  .tool-icon {
    width: 16px;
    height: 16px;
  }
  
  .map-toolbar.top-left,
  .map-toolbar.top-right,
  .map-toolbar.bottom-left,
  .map-toolbar.bottom-right {
    top: 8px;
    left: 8px;
    right: auto;
    bottom: auto;
  }
}

/* 按钮尺寸控制 */
.size-small .tool-btn {
  width: 26px;
  height: 26px;
}

.size-small .tool-icon {
  width: 16px;
  height: 16px;
}

.size-default .tool-btn {
  width: 32px;
  height: 32px;
}

.size-default .tool-icon {
  width: 20px;
  height: 20px;
}

.size-large .tool-btn {
  width: 38px;
  height: 38px;
}

.size-large .tool-icon {
  width: 22px;
  height: 22px;
}

.size-small .toolbar-header {
  gap: 3px;
  padding: 3px;
}

.size-default .toolbar-header {
  gap: 4px;
  padding: 4px;
}

.size-large .toolbar-header {
  gap: 6px;
  padding: 6px;
}

.size-small.map-toolbar.collapsed .toggle-btn {
  width: 26px;
  height: 26px;
}

.size-default.map-toolbar.collapsed .toggle-btn {
  width: 32px;
  height: 32px;
}

.size-large.map-toolbar.collapsed .toggle-btn {
  width: 38px;
  height: 38px;
}
</style> 