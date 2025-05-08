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
      <span v-if="typeof (tool.active && tool.activeIcon ? tool.activeIcon : tool.icon) === 'string'" 
        class="svg-icon" 
        v-html="tool.active && tool.activeIcon ? tool.activeIcon : tool.icon"></span>
      <component v-else :is="tool.active && tool.activeIcon ? tool.activeIcon : tool.icon" />
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
          <span v-if="typeof (subTool.active && subTool.activeIcon ? subTool.activeIcon : subTool.icon) === 'string'" 
                class="svg-icon submenu-icon" 
                v-html="subTool.active && subTool.activeIcon ? subTool.activeIcon : subTool.icon"></span>
          <component v-else-if="subTool.active && subTool.activeIcon ? subTool.activeIcon : subTool.icon" 
                     :is="subTool.active && subTool.activeIcon ? subTool.activeIcon : subTool.icon" 
                     class="submenu-icon" />
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
  
  // 如果工具类型是菜单，则切换子菜单显示状态
  if (currentTool.type === 'menu' && currentTool.children?.length) {
    // 如果菜单已激活，则关闭子菜单和取消激活状态
    if (isCurrentlyActive) {
      newTools[toolIndex] = { ...currentTool, active: undefined };
      tools.value = newTools;
      openSubMenus.value = openSubMenus.value.filter(id => id !== currentTool.id);
      
      // 移除全局点击监听器
      if (globalClickListener) {
        document.removeEventListener('click', globalClickListener as EventListener);
        globalClickListener = null;
      }
      
      emit('submenu-close', currentTool.id);
    } else {
      // 关闭其他所有菜单
      for (let i = 0; i < newTools.length; i++) {
        if (newTools[i].type === 'menu' && newTools[i].active === true) {
          newTools[i] = { ...newTools[i], active: undefined };
          openSubMenus.value = openSubMenus.value.filter(id => id !== newTools[i].id);
          emit('submenu-close', newTools[i].id);
        }
      }
      
      // 激活当前菜单并显示子菜单
      newTools[toolIndex] = { ...currentTool, active: true };
      tools.value = newTools;
      openSubMenus.value = [currentTool.id];
      emit('submenu-open', currentTool.id);
      
      // 添加全局点击监听器
      if (!globalClickListener) {
        globalClickListener = (e: MouseEvent) => {
          // 检查点击是否在子菜单区域外
          const menuButton = document.querySelector(`.toolbar-item.has-submenu[data-tool-id="${currentTool.id}"]`);
          const submenus = document.querySelectorAll('.toolbar-submenu.submenu-active');
          let clickedOutside = true;
          
          // 检查是否点击在菜单按钮上
          if (menuButton && menuButton.contains(e.target as Node)) {
            clickedOutside = false;
          }
          
          // 检查是否点击在子菜单或其子元素上
          submenus.forEach((menu) => {
            if (menu.contains(e.target as Node)) {
              clickedOutside = false;
            }
          });
          
          // 检查是否点击在子菜单项上
          const submenuItems = document.querySelectorAll('.submenu-item');
          submenuItems.forEach((item) => {
            if (item.contains(e.target as Node)) {
              clickedOutside = false;
            }
          });
          
          // 如果点击在所有子菜单外部
          if (clickedOutside) {
            // 关闭菜单并清除激活状态
            const toolIdx = tools.value.findIndex(t => t.id === currentTool.id);
            if (toolIdx !== -1) {
              const updatedTools = [...tools.value];
              updatedTools[toolIdx] = { ...updatedTools[toolIdx], active: undefined };
              tools.value = updatedTools;
              
              // 同步更新openSubMenus数组
              openSubMenus.value = openSubMenus.value.filter(id => id !== currentTool.id);
            }
            
            document.removeEventListener('click', globalClickListener as EventListener);
            globalClickListener = null;
            emit('submenu-close', currentTool.id);
          }
        };
        
        // 使用setTimeout确保当前点击不会立即触发
        setTimeout(() => {
          document.addEventListener('click', globalClickListener as EventListener);
        }, 0);
      }
    }
    return;
  }

  // 处理切换状态工具的特殊逻辑（如显示/隐藏点位）
  if (currentTool.toggleState !== undefined) {
    // 切换状态
    const newToggleState = !currentTool.toggleState;
    info("当前激活工具状态", newToggleState);
    // 更新工具状态并切换图标
    newTools[toolIndex] = { 
      ...currentTool, 
      toggleState: newToggleState,
      // 根据当前状态切换图标，保留activeIcon属性
      icon: newToggleState ? currentTool.alternateIcon : (currentTool.originalIcon || currentTool.icon),
      activeIcon: currentTool.activeIcon, // 保留activeIcon
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

  // 如果当前工具将被激活，需要确保所有菜单类型工具都被关闭
  if (!isCurrentlyActive) {
    // 关闭所有打开的菜单
    for (let i = 0; i < newTools.length; i++) {
      if (newTools[i].type === 'menu' && newTools[i].active === true) {
        newTools[i] = { ...newTools[i], active: undefined };
      }
    }
    openSubMenus.value = [];
    
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

// 切换子菜单的显示状态
const toggleSubMenu = (toolId: string): void => {
  const index = openSubMenus.value.indexOf(toolId);
  
  // 找到对应的工具
  const toolIndex = tools.value.findIndex(t => t.id === toolId);
  if (toolIndex === -1) return;
  
  // 创建新的工具列表
  const newTools = [...tools.value];
  
  // 取消所有菜单类型工具的激活状态并关闭子菜单
  for (let i = 0; i < newTools.length; i++) {
    if (newTools[i].type === 'menu' && newTools[i].id !== toolId) {
      newTools[i] = { ...newTools[i], active: undefined };
    }
  }
  openSubMenus.value = [];
  
  // 如果该子菜单未打开，则打开它
  if (index === -1) {
    openSubMenus.value.push(toolId);
    emit('submenu-open', toolId);
    
    // 设置当前菜单为激活状态
    newTools[toolIndex] = { ...newTools[toolIndex], active: true };
    tools.value = newTools;
    
    // 添加全局点击监听器以便在点击菜单外部时关闭菜单
    if (!globalClickListener) {
      globalClickListener = (e: MouseEvent) => {
        // 检查点击是否在子菜单区域外
        const menuButton = document.querySelector(`.toolbar-item.has-submenu[data-tool-id="${toolId}"]`);
        const submenus = document.querySelectorAll('.toolbar-submenu.submenu-active');
        let clickedOutside = true;
        
        // 检查是否点击在菜单按钮上
        if (menuButton && menuButton.contains(e.target as Node)) {
          clickedOutside = false;
        }
        
        // 检查是否点击在子菜单上
        submenus.forEach((menu) => {
          if (menu.contains(e.target as Node)) {
            clickedOutside = false;
          }
        });
        
        // 如果点击在所有子菜单外部
        if (clickedOutside) {
          // 关闭菜单并清除激活状态
          const toolIdx = tools.value.findIndex(t => t.id === toolId);
          if (toolIdx !== -1) {
            const updatedTools = [...tools.value];
            updatedTools[toolIdx] = { ...updatedTools[toolIdx], active: undefined };
            tools.value = updatedTools;
          }
          
          openSubMenus.value = openSubMenus.value.filter(id => id !== toolId);
          document.removeEventListener('click', globalClickListener as EventListener);
          globalClickListener = null;
          emit('submenu-close', toolId);
        }
      };
      
      // 使用setTimeout确保当前点击不会立即触发
      setTimeout(() => {
        document.addEventListener('click', globalClickListener as EventListener);
      }, 0);
    }
  } else {
    // 如果已打开，则关闭
    newTools[toolIndex] = { ...newTools[toolIndex], active: undefined };
    tools.value = newTools;
    emit('submenu-close', toolId);
    
    // 移除全局点击监听器
    if (globalClickListener) {
      document.removeEventListener('click', globalClickListener as EventListener);
      globalClickListener = null;
    }
  }
};

// 处理子菜单项点击
const handleSubMenuClick = (parentTool: ToolItem, subTool: ToolItem, event: MouseEvent): void => {
  // 已经在模板中使用了.stop.prevent，这里不再需要
  // event.stopPropagation();
  // event.preventDefault();
  
  // 避免直接使用传入的对象，找到本地副本
  const toolIndex = tools.value.findIndex(t => t.id === parentTool.id);
  const parentToolCopy = { ...tools.value[toolIndex] };
  
  // 确保children数组存在
  if (!parentToolCopy.children || !Array.isArray(parentToolCopy.children)) {
    return;
  }
  
  // 找到子工具的索引
  const subToolIndex = parentToolCopy.children.findIndex(t => t.id === subTool.id);
  if (subToolIndex === -1) return;
  
  // 获取当前子工具的副本
  const currentSubTool = { ...parentToolCopy.children[subToolIndex] };
  
  // 获取当前子工具激活状态
  const isCurrentlyActive = currentSubTool.active === true;
  
  // 创建新的工具列表
  const newTools = [...tools.value];
  const newParentTool = { ...newTools[toolIndex] };
  const newChildren = [...(newParentTool.children || [])];
  
  // 如果当前子工具将被激活
  if (!isCurrentlyActive) {
    // 更新当前子工具的激活状态
    newChildren[subToolIndex] = { ...currentSubTool, active: true };
    
    // 如果子工具不支持多选，则停用其他不支持多选的子工具
    if (currentSubTool.multi !== true) {
      for (let i = 0; i < newChildren.length; i++) {
        if (i !== subToolIndex && newChildren[i].active === true && newChildren[i].multi !== true) {
          newChildren[i] = { ...newChildren[i], active: undefined };
          // 触发该子工具的停用事件
          emit('tool-deactivated', newChildren[i].id);
        }
      }
    }
    
    // 更新父工具的children
    newParentTool.children = newChildren;
    
    // 保持父菜单处于激活状态
    newParentTool.active = true;
    
    // 更新工具列表
    newTools[toolIndex] = newParentTool;
    tools.value = newTools;
    
    // 触发工具激活事件
    emit('tool-activated', currentSubTool.id);
  } else {
    // 如果当前子工具将被停用
    newChildren[subToolIndex] = { ...currentSubTool, active: undefined };
    
    // 更新工具列表，保持父菜单激活状态
    newParentTool.children = newChildren;
    newParentTool.active = true;
    newTools[toolIndex] = newParentTool;
    tools.value = newTools;
    
    // 触发工具停用事件
    emit('tool-deactivated', currentSubTool.id);
  }
  
  // 触发子菜单项点击事件
  emit('submenu-item-click', {
    parentId: parentTool.id,
    id: currentSubTool.id,
    active: !isCurrentlyActive
  });
  
  // 如果子工具有自己的处理函数，则调用
  if (currentSubTool.handler) {
    currentSubTool.handler();
  }
  
  // 不会在此处关闭子菜单或取消父菜单的激活状态
  // 这样确保点击子菜单后父菜单保持打开状态
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

// 监听激活状态变化，同步子菜单状态
watch(openSubMenus, (newVal) => {
  // 如果没有打开的子菜单，清理所有菜单的激活状态
  if (newVal.length === 0) {
    const newTools = [...tools.value];
    let hasChanges = false;
    
    for (let i = 0; i < newTools.length; i++) {
      if (newTools[i].type === 'menu' && newTools[i].active === true) {
        newTools[i] = { ...newTools[i], active: undefined };
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      tools.value = newTools;
    }
  }
}, { immediate: true });

// 监听工具的激活状态变化，同步子菜单状态
watch(() => tools.value, () => {
  // 查找所有菜单类型工具
  const menuTools = tools.value.filter(tool => tool.type === 'menu');
  
  // 检查每个菜单工具的激活状态
  for (const tool of menuTools) {
    // 如果菜单不是激活状态但在openSubMenus中，则移除
    if (tool.active !== true && openSubMenus.value.includes(tool.id)) {
      openSubMenus.value = openSubMenus.value.filter(id => id !== tool.id);
    }
  }
}, { deep: true });

// 组件卸载时清理全局事件监听器
onBeforeUnmount(() => {
  if (globalClickListener) {
    document.removeEventListener('click', globalClickListener as EventListener);
    globalClickListener = null;
  }
});

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

  /* 红色按钮样式 */
  &.red-btn {
    
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

    /* 确保红色按钮的激活态图标为白色 */
    &.active .svg-icon svg * {
      fill: #ffffff !important;
      stroke: #ffffff !important;
    }
  }

  /* 灰色按钮样式 */
  &.gray-btn {
    color: #666666;
    
    &:hover {
      background-color: #f5f5f5;
      border-color: #d9d9d9;
    }
    
    &.active {
      background-color: #8c8c8c;
      color: #ffffff;
      box-shadow: 0 4px 8px rgba(140, 140, 140, 0.3);
    }
    
    &.active:hover {
      background-color: #a6a6a6;
      box-shadow: 0 6px 12px rgba(140, 140, 140, 0.4);
    }
    
    &.active:active {
      background-color: #595959;
    }

    /* 确保灰色按钮的激活态图标为白色 */
    &.active .svg-icon svg * {
      fill: #ffffff !important;
      stroke: #ffffff !important;
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