/**
* 地图工具栏
* 支持功能：
* 1. 支持水平和垂直两种方向布局
* 2. 支持四个角落位置摆放
* 3. 支持收缩和展开
* 4. 支持子菜单和工具提示
* @author CH
* @date 2025-05-12
*/
<template>
  <div :class="[toolbarClass, `size-${config.size}`]" :style="toolbarStyle" v-if="visible" @dblclick.stop.prevent @click.stop :key="forceUpdateKey">
    <div v-for="tool in visibleTools" :key="tool.id" class="toolbar-item" :class="[
      { active: isToolActive(tool.id) },
      { 'has-submenu': (tool.type === 'menu' || tool.type === 'button') && tool.children?.length },
      tool?.className || ''
    ]" :data-tool-id="tool.id" 
      @click.stop="(e) => handleToolClick(tool, e)" 
      @dblclick.stop.prevent
      @mouseenter="(e) => handleToolHover(tool, e, true)"
      @mouseleave="(e) => handleToolHover(tool, e, false)">
      <span v-if="typeof (isToolActive(tool.id) && tool.activeIcon ? tool.activeIcon : tool.icon) === 'string'" class="svg-icon" v-html="isToolActive(tool.id) && tool.activeIcon ? tool.activeIcon : tool.icon"></span>
      <component v-else :is="isToolActive(tool.id) && tool.activeIcon ? tool.activeIcon : tool.icon" />
    </div>
    <div class="toolbar-collapse" @click.stop="toggleCollapse" :title="isCollapsed ? '展开' : '收缩'">
      <!-- 水平方向工具栏 -->
      <template v-if="config.direction === 'horizontal'">
        <!-- 左侧工具栏 -->
        <div v-if="config.position.endsWith('left')" class="collapse-icon">
          <svg v-if="isCollapsed" viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M842.67 512L640 309.33V402.67H384V402.67H213.33V621.33H384V621.33H640V714.67L842.67 512Z"
              fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M181.33 512L384 714.67V621.33H640V621.33H810.67V402.67H640V402.67H384V309.33L181.33 512Z"
              fill="currentColor" />
          </svg>
        </div>
        <!-- 右侧工具栏 -->
        <div v-else class="collapse-icon">
          <svg v-if="isCollapsed" viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M181.33 512L384 309.33V402.67H640V402.67H810.67V621.33H640V621.33H384V714.67L181.33 512Z"
              fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M842.67 512L640 714.67V621.33H384V621.33H213.33V402.67H384V402.67H640V309.33L842.67 512Z"
              fill="currentColor" />
          </svg>
        </div>
      </template>
      <!-- 垂直方向工具栏 -->
      <template v-else>
        <!-- 顶部工具栏 -->
        <div v-if="config.position.startsWith('top')" class="collapse-icon">
          <svg v-if="isCollapsed" viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M512 842.67L714.67 640H621.33V384H621.33V213.33H402.67V384H402.67V640H309.33L512 842.67Z"
              fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M512 181.33L309.33 384H402.67V640H402.67V810.67H621.33V640H621.33V384H714.67L512 181.33Z"
              fill="currentColor" />
          </svg>
        </div>
        <!-- 底部工具栏 -->
        <div v-else class="collapse-icon">
          <svg v-if="isCollapsed" viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M512 181.33L309.33 384H402.67V640H402.67V810.67H621.33V640H621.33V384H714.67L512 181.33Z"
              fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M512 842.67L714.67 640H621.33V384H621.33V213.33H402.67V384H402.67V640H309.33L512 842.67Z"
              fill="currentColor" />
          </svg>
        </div>
      </template>
    </div>
  </div>

  <!-- 使用固定定位的子菜单 -->
  <div v-if="submenuState.visible" 
       class="toolbar-submenu submenu-active submenu-positioned"
       :class="`direction-${config.direction}`"
       :style="{ 
         position: 'fixed', 
         top: `${submenuState.top}px`, 
         left: `${submenuState.left}px`, 
         zIndex: 999999 
       }"
       @click.stop>
    <div v-for="subTool in submenuState.items" :key="subTool.id" 
         class="submenu-item toolbar-item"
         :class="[
           { active: isToolActive(subTool.id) },
           subTool.className
         ]" 
         :data-tool-id="subTool.id"
         @click.stop.prevent="(e) => handleSubmenuItemClick(submenuState.parentTool, subTool, e)"
         @mouseenter="(e) => handleToolHover(subTool, e, true)"
         @mouseleave="(e) => handleToolHover(subTool, e, false)">
      <span v-if="typeof (isToolActive(subTool.id) && subTool.activeIcon ? subTool.activeIcon : subTool.icon) === 'string'" 
            class="svg-icon" 
            v-html="isToolActive(subTool.id) && subTool.activeIcon ? subTool.activeIcon : subTool.icon"></span>
      <component v-else-if="subTool.icon || (isToolActive(subTool.id) && subTool.activeIcon)" 
                :is="isToolActive(subTool.id) && subTool.activeIcon ? subTool.activeIcon : subTool.icon" />
    </div>
  </div>

  <!-- 使用固定定位的工具提示 -->
  <div v-if="tooltipState.visible" 
       class="toolbar-tooltip tooltip-positioned"
       :style="{ 
         position: 'fixed', 
         top: `${tooltipState.top}px`, 
         left: `${tooltipState.left}px`, 
         zIndex: 999999 
       }">
    {{ tooltipState.text }}
  </div>
</template>

<script lang="ts">
export default {
  name: 'MapToolbar'
};
</script>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount, onMounted } from 'vue';
import type { ToolItem, ToolbarConfig } from '../types';
import type { AddToolOptions } from '../types';
import { info } from "@repo/utils";
import type { ToolbarObject } from '../composables/ToolbarObject';
import { GridType } from '../composables/GridManager';

interface Props {
  toolbarConfig: ToolbarConfig;
  activeToolId?: string;
  toolbarObj?: ToolbarObject | null;
}

const props = withDefaults(defineProps<Props>(), {
  toolbarConfig: () => ({
    position: 'top-left',
    direction: 'horizontal',
    itemsPerLine: 8,
    size: 36,
    items: [
      // 示例：其它工具按钮
      // { id: 'ruler', type: 'button', icon: RULER_ICON, title: '测距', show: true },
      // { id: 'polygon', type: 'button', icon: POLYGON_ICON, title: '测面', show: true },
      // 区划按钮
      {
        id: 'boundary',
        type: 'button',
        icon: '<svg viewBox="0 0 1024 1024" width="20" height="20"><path d="M128 128h768v768H128z" fill="#e6f7ff"/><path d="M128 128h768v768H128z" fill="none" stroke="#1890ff" stroke-width="48"/><path d="M128 384h768" stroke="#1890ff" stroke-width="32"/><path d="M128 640h768" stroke="#1890ff" stroke-width="32"/><path d="M384 128v768" stroke="#1890ff" stroke-width="32"/><path d="M640 128v768" stroke="#1890ff" stroke-width="32"/></svg>',
        title: '区划',
        show: true
      }
    ]
  } as ToolbarConfig),
  toolbarObj: null
});

const configConfig = ref<ToolbarConfig>(props.toolbarConfig);
// 方便在模板和计算属性中使用
const config = computed(() => ({
  position: configConfig.value.position || 'top-left',
  direction: configConfig.value.direction || 'horizontal',
  itemsPerLine: configConfig.value.itemsPerLine || 8,
  size: configConfig.value.size || 36,
  items: configConfig.value.items || [],
}));

const toolbarObj = ref<ToolbarObject | null>(null);
// 将tools当作本地状态，不再使用深拷贝，而是直接使用props中的数据
// 这样可以保持与ToolbarObject的一致性
const visibleTools = computed<ToolItem[]>(() => {
  const items = props.toolbarConfig.items || [];
  return Array.isArray(items) ? items.filter(tool => tool.show !== false) : [];
});

// 修改isToolActive方法，增强对子菜单项激活状态的判断
const isToolActive = (toolId: string): boolean => {
  // 优先查找toolbarObj中的tool.active
  if (toolbarObj.value) {
    const findTool = (items: ToolItem[]): ToolItem | undefined => {
      for (const item of items) {
        if (item.id === toolId) return item;
        if (item.children && item.children.length > 0) {
          const found = findTool(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const tool = findTool(toolbarObj.value.getTools());
    if (tool && typeof tool.active === 'boolean') return tool.active;
  }
  // 再查找toolbarConfig中的tool.active
  const findToolInConfig = (items: ToolItem[]): ToolItem | undefined => {
    for (const item of items) {
      if (item.id === toolId) return item;
      if (item.children && item.children.length > 0) {
        const found = findToolInConfig(item.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  const tool = findToolInConfig(props.toolbarConfig.items || []);
  if (tool && typeof tool.active === 'boolean') return tool.active;
  // 兼容旧模式 - 使用传入的activeToolId
  if (props.activeToolId === toolId) return true;
  return false;
};

// 保持原有的状态变量
const visible = ref(true); // 控制工具栏整体显示/隐藏
const openSubMenus = ref<string[]>([]);
const isCollapsed = ref(false);

// 在setup函数结束前添加teleport逻辑，用于将子菜单移动到body下
onMounted(() => {
  // 尝试从localStorage读取收缩状态
  try {
    const savedState = localStorage.getItem('map-toolbar-collapsed');
    if (savedState !== null) {
      isCollapsed.value = JSON.parse(savedState);
    }
  } catch (e) {
    console.error('读取工具栏状态失败:', e);
  }

  // 设置toolbarObj
  if (props.toolbarObj) {
    toolbarObj.value = props.toolbarObj;
  }
  
  // 初始化状态
  updateActiveTools();
});

// 本地激活的工具ID
const activeToolsMap = ref<Record<string, boolean>>({});
// 强制刷新视图的key
const forceUpdateKey = ref(0);

// 更新激活工具状态
const updateActiveTools = () => {
  if (!toolbarObj.value) return;
  
  const tools = toolbarObj.value.getTools();
  const activeToolsObj: Record<string, boolean> = {};
  
  // 递归收集工具和子菜单中激活的工具
  const collectActiveTools = (toolItems: ToolItem[]) => {
    toolItems.forEach(tool => {
      // 检查工具激活状态
      if (tool.active) {
        activeToolsObj[tool.id] = true;
        console.debug(`工具 ${tool.id} 处于激活状态`);
      }
      
      // 递归处理子菜单
      if (tool.children && tool.children.length > 0) {
        collectActiveTools(tool.children);
      }
    });
  };
  
  // 从根工具开始收集
  collectActiveTools(tools);
  
  // 获取当前激活的主工具ID
  const activeToolId = toolbarObj.value?.getActiveToolId();
  if (activeToolId && !activeToolsObj[activeToolId]) {
    console.debug(`添加主激活工具: ${activeToolId}`);
    activeToolsObj[activeToolId] = true;
  }
  
  // 特殊处理子菜单项激活状态
  // 确保网格工具的子菜单项状态被正确捕获
  const gridTool = tools.find(t => t.id === 'grid');
  if (gridTool && gridTool.children) {
    gridTool.children.forEach(subTool => {
      if (subTool.active) {
        console.debug(`子菜单项 ${subTool.id} 处于激活状态，设置父菜单 grid 也为激活状态`);
        activeToolsObj[subTool.id] = true;
        activeToolsObj['grid'] = true; // 如果子菜单项激活，父菜单也应该显示为激活
      }
    });
  }
  
  // 检查网格类型状态
  const gridObj = toolbarObj.value.getGridObject();
  if (gridObj) {
    const activeGridTypes = gridObj.getActiveGridTypes();
    if (activeGridTypes.has(GridType.GEOHASH)) {
      console.debug('GeoHash网格处于激活状态');
      activeToolsObj['grid-geohash'] = true;
      activeToolsObj['grid'] = true; // 如果GeoHash网格激活，网格菜单也应该显示为激活
    }
    if (activeGridTypes.has(GridType.HEXAGON)) {
      console.debug('蜂窝网格处于激活状态');
      activeToolsObj['grid-hexagon'] = true;
      activeToolsObj['grid'] = true; // 如果蜂窝网格激活，网格菜单也应该显示为激活
    }
  }
  
  // 更新激活状态Map
  activeToolsMap.value = activeToolsObj;
  
  // 打印当前激活的工具
  if (Object.keys(activeToolsObj).length > 0) {
    console.debug('当前激活工具: ', Object.keys(activeToolsObj).join(', '));
  }
  
  // 强制刷新视图
  forceUpdateKey.value++;
};

// 添加子菜单位置计算方法
const submenuPositions = ref<Record<string, { top: number, left: number }>>({});

// 处理工具点击 - 修改处理子菜单显示的逻辑
const handleToolClick = (tool: ToolItem, event: MouseEvent) => {
  if (tool.disabled) return;

  // 2D/3D切换按钮
  if (tool.id === 'dimension-switch') {
    emit('toggle-3d');
    return;
  }

  // 向父组件发送点击事件
  emit('tool-click', {
    toolId: tool.id,
    tool,
    event
  });

  // 处理有子菜单的工具
  if ((tool.type === 'menu' || tool.type === 'button') && tool.children?.length) {
    const toolId = tool.id;
    const menuIndex = openSubMenus.value.indexOf(toolId);
    
    if (menuIndex === -1) {
      // 获取按钮元素位置
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      
      // 计算子菜单位置 - 始终在按钮下方显示
      let top = rect.bottom + 8; // 增加一点间距
      let left = rect.left;
      
      // 计算子菜单每行显示的按钮数量和总行数
      const itemsPerRow = 5; // 每行最多显示5个按钮
      const totalRows = Math.ceil(tool.children.length / itemsPerRow);
      
      // 计算子菜单的宽度和高度
      const menuWidth = Math.min(tool.children.length, itemsPerRow) * (config.value.size + 8); // 按钮宽度+间距
      const menuHeight = totalRows * (config.value.size + 8); // 按钮高度+间距
      
      // 检查右侧空间，防止菜单超出窗口
      if (left + menuWidth > window.innerWidth) {
        left = Math.max(0, window.innerWidth - menuWidth);
      }
      
      // 检查底部空间，防止菜单超出窗口
      if (top + menuHeight > window.innerHeight) {
        // 如果下方空间不足，则在按钮上方显示
        top = rect.top - menuHeight - 8;
      }
      
      // 存储子菜单位置
      submenuPositions.value[tool.id] = { top, left };
      
      // 记录打开的子菜单
      openSubMenus.value.push(toolId);
      emit('submenu-open', toolId);
      
      // 更新submenuState以便显示子菜单
      submenuState.value = {
        visible: true,
        top: top,
        left: left,
        items: tool.children,
        parentTool: tool,
        parentId: tool.id
      };
      
      // 添加全局点击事件，点击空白处关闭子菜单
      if (!globalClickListener) {
        globalClickListener = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (!target.closest('.toolbar-submenu') && !target.closest(`[data-tool-id="${toolId}"]`)) {
            closeAllSubMenus();
          }
        };
        
        nextTick(() => {
          document.addEventListener('click', globalClickListener as EventListener);
        });
      }
    } else {
      // 关闭子菜单
      closeSubMenu(toolId);
    }
  }

  // 所有工具类型都通过toolbarObj处理激活状态
  console.debug(`点击工具 ${tool.id} (${tool.type}) 前状态: ${isToolActive(tool.id) ? '激活' : '未激活'}`);
  
  if (toolbarObj.value) {
    try {
      // 使用toolbarObj处理工具点击
      toolbarObj.value.handleToolClick(tool.id);
      
      // 手动更新工具状态并强制刷新视图
      nextTick(() => {
        updateActiveTools();
        
        // 获取最新状态
        const isActive = isToolActive(tool.id);
        console.debug(`点击工具 ${tool.id} 后状态: ${isActive ? '激活' : '未激活'}`);
        
        // 发送相应事件
        if (isActive) {
          emit('tool-activated', tool.id);
        } else {
          emit('tool-deactivated', tool.id);
        }
      });
    } catch (error) {
      console.error(`处理工具 ${tool.id} 点击事件失败:`, error);
    }
  } else {
    // 兼容旧逻辑，直接发送激活事件
    emit('tool-activated', tool.id);
  }
};

// 关闭子菜单时清除位置
const closeSubMenu = (toolId: string) => {
  const index = openSubMenus.value.indexOf(toolId);
  if (index !== -1) {
    openSubMenus.value.splice(index, 1);
    emit('submenu-close', toolId);
    
    // 清除位置记录
    delete submenuPositions.value[toolId];
    
    // 同时检查是否需要隐藏子菜单弹窗
    if (submenuState.value.parentId === toolId) {
      submenuState.value.visible = false;
    }
  }
};

// 关闭所有子菜单
const closeAllSubMenus = () => {
  // 清除所有打开的子菜单记录
  const submenusToClose = [...openSubMenus.value];
    openSubMenus.value = [];
  
  // 对每个子菜单发送关闭事件
  submenusToClose.forEach(toolId => {
    emit('submenu-close', toolId);
  });
  
  // 清除所有位置记录
  submenuPositions.value = {};
  
  // 隐藏所有子菜单
  submenuState.value.visible = false;
  
  // 移除全局点击监听器
  if (globalClickListener) {
    document.removeEventListener('click', globalClickListener as EventListener);
    globalClickListener = null;
  }
};

// 切换收缩状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  
  // 保存状态到localStorage
  try {
    localStorage.setItem('map-toolbar-collapsed', JSON.stringify(isCollapsed.value));
  } catch (e) {
    console.error('保存工具栏状态失败:', e);
  }
  
  // 关闭所有子菜单
  closeAllSubMenus();
  
  // 触发收缩状态变化事件
  emit('collapse-change', isCollapsed.value);
};

// 在组件卸载前清理资源
onBeforeUnmount(() => {
  if (globalClickListener) {
    document.removeEventListener('click', globalClickListener as EventListener);
    globalClickListener = null;
  }
});

// 保持原有的样式计算属性
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

// 修改toolbarStyle计算属性，使用flex布局替代grid布局
const toolbarStyle = computed(() => {
  const style: Record<string, string> = {
    padding: `${buttonMargin.value}px`,
    backgroundColor: 'transparent',
    '--buttonSize': config.value.size + 'px',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    display: 'flex',
    gap: `${buttonMargin.value}px`
  };

  // 根据方向设置flex布局属性
    if (config.value.direction === 'horizontal') {
    // 横向排列
    style.flexDirection = 'row';
    style.flexWrap = 'wrap'; // 允许换行，模拟grid的行为
    
    // 如果设置了每行工具数量，计算最大宽度限制换行
    if (config.value.itemsPerLine && config.value.itemsPerLine > 0) {
      const itemWidth = config.value.size + 2 * buttonMargin.value;
      style.maxWidth = `${config.value.itemsPerLine * itemWidth}px`;
    }
    
    // 根据位置设置排列顺序
      if (config.value.position.endsWith('right')) {
      style.flexDirection = 'row-reverse';
    }
  } else {
    // 纵向排列
    style.flexDirection = 'column';
    
    // 如果设置了每列工具数量，计算最大高度限制换行
    if (config.value.itemsPerLine && config.value.itemsPerLine > 0) {
      const itemHeight = config.value.size + 2 * buttonMargin.value;
      style.maxHeight = `${config.value.itemsPerLine * itemHeight}px`;
      style.flexWrap = 'wrap';
      style.alignContent = 'flex-start';
    }
    
      // 根据位置设置flex方向
      if (config.value.position.endsWith('right')) {
        style.flexDirection = 'column-reverse';
    }
  }

  // 添加收缩状态样式
  if (isCollapsed.value) {
    if (config.value.direction === 'horizontal') {
      style.transform = config.value.position.endsWith('left') ? 'translateX(-100%)' : 'translateX(100%)';
    } else {
      style.transform = config.value.position.startsWith('top') ? 'translateY(-100%)' : 'translateY(100%)';
    }
    style.opacity = '0.4'; // 完全隐藏工具栏
    style.pointerEvents = 'none'; // 收缩状态下禁用工具栏交互
  } else {
    style.transform = 'translate(0, 0)';
    style.opacity = '1';
    style.pointerEvents = 'auto';
  }

  return style;
});

// 确保在layer-switch工具状态变化时强制刷新工具条
watch(() => props.activeToolId, (newVal, oldVal) => {
  // 处理layer-switch特殊情况
  if (oldVal === 'layer-switch' && newVal !== 'layer-switch') {
    console.debug('图层按钮状态已变更，强制刷新工具栏');
    if (toolbarObj.value) {
      // 确保图层工具在Map中标记为非激活状态
      activeToolsMap.value['layer-switch'] = false;
      forceUpdateKey.value++; // 强制刷新视图
    }
  }
}, { immediate: false });

// 添加一个直接刷新状态的方法
const refreshToolbarState = () => {
  if (toolbarObj.value) {
    updateActiveTools();
  }
};

// 强制更新组件方法
const forceUpdate = () => {
  // 增加键值，触发组件重新渲染
  forceUpdateKey.value++;
  console.debug('工具栏组件强制更新', forceUpdateKey.value);
};

// 添加更新配置的方法
const updateConfig = (newConfig: ToolbarConfig) => {
  // 如果有toolbarObj，通过它来设置配置
  if (toolbarObj.value) {
    toolbarObj.value.setConfig(newConfig);
  }
  
  // 强制更新组件
  forceUpdate();
  // 更新配置
  configConfig.value = newConfig;
  // 更新工具栏状态
  nextTick(() => {
    updateActiveTools();
  });
};

// 添加子菜单状态对象
const submenuState = ref({
  visible: false,
  top: 0,
  left: 0,
  items: [] as ToolItem[],
  parentTool: null as ToolItem | null,
  parentId: ''
});

// 添加handleSubmenuItemClick函数的定义
const handleSubmenuItemClick = (parentTool: ToolItem, subTool: ToolItem, event: MouseEvent) => {
  event.stopPropagation();
  
  // 发送点击事件
  emit('submenu-item-click', {
    parentToolId: parentTool.id,
    toolId: subTool.id,
    parentTool,
    tool: subTool,
    event
  });

  // 处理工具点击
  if (toolbarObj.value) {
    try {
      toolbarObj.value.handleSubMenuClick(parentTool.id, subTool.id);
      
      // 更新激活状态
      nextTick(() => {
        // 立即更新
        updateActiveTools();
        
        // 网格工具特殊处理：延迟再次更新，确保状态正确同步
        if (subTool.id === 'grid-geohash' || subTool.id === 'grid-hexagon') {
          setTimeout(() => {
            console.debug(`延迟更新网格工具 ${subTool.id} 状态`);
            updateActiveTools();
          }, 100);
        }
        
        // 获取最新状态
        const isActive = isToolActive(subTool.id);
        
        // 发送相应事件
        if (isActive) {
          emit('tool-activated', subTool.id);
        } else {
          emit('tool-deactivated', subTool.id);
        }
      });
    } catch (error) {
      console.error(`处理子菜单工具 ${subTool.id} 点击事件失败:`, error);
    }
  } else {
    // 兼容旧逻辑
    emit('tool-activated', subTool.id);
  }
  
  // 关闭所有子菜单
  closeAllSubMenus();
};

// 重新声明emit
const emit = defineEmits([
  'tool-click',
  'tool-activated',
  'tool-deactivated',
  'collapse-change',
  'submenu-open',
  'submenu-close',
  'submenu-item-click',
  'toggle-3d'
]);

// 重新声明globalClickListener
let globalClickListener: ((e: MouseEvent) => void) | null = null;

// 监听toolbarObj变化，确保在对象加载后立即更新状态
watch(() => props.toolbarObj, (newValue) => {
  if (newValue) {
    toolbarObj.value = newValue;
    
    // 延迟执行以确保对象已完全加载
    nextTick(() => {
      console.debug('toolbarObj已更新，刷新工具栏状态');
      updateActiveTools();
      
      // 特别检查网格工具状态
      const gridObj = newValue.getGridObject();
      if (gridObj) {
        const activeGridTypes = gridObj.getActiveGridTypes();
        if (activeGridTypes.size > 0) {
          console.debug('检测到已启用的网格类型:', Array.from(activeGridTypes).join(', '));
          // 延迟再次更新状态，确保完全同步
          setTimeout(() => {
            updateActiveTools();
          }, 200);
        }
      }
    });
  }
}, { immediate: true });

// 工具提示状态
const tooltipState = ref({
  visible: false,
  top: 0,
  left: 0,
  text: ''
});

// 处理工具悬停
const handleToolHover = (tool: ToolItem, event: MouseEvent, isEnter: boolean) => {
  if (isEnter) {
    // 如果工具有子菜单并且已经激活，不显示工具提示
    if ((tool.type === 'menu' || tool.type === 'button') && 
        tool.children?.length && 
        isToolActive(tool.id)) {
      tooltipState.value.visible = false;
      return;
    }
    
    // 计算工具提示位置
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    let tooltipTop = 0;
    let tooltipLeft = 0;
    
    // 基于工具栏的方向和位置计算提示框位置
    if (config.value.direction === 'horizontal') {
      // 水平方向工具栏
      if (config.value.position.startsWith('top')) {
        // 顶部工具栏，提示显示在下方
        tooltipTop = rect.bottom + 10;
        tooltipLeft = rect.left + rect.width / 2;
      } else {
        // 底部工具栏，提示显示在上方
        tooltipTop = rect.top - 30;
        tooltipLeft = rect.left + rect.width / 2;
      }
    } else {
      // 垂直方向工具栏
      if (config.value.position.endsWith('left')) {
        // 左侧工具栏，提示显示在右侧
        tooltipTop = rect.top + rect.height / 2;
        tooltipLeft = rect.right + 10;
      } else {
        // 右侧工具栏，提示显示在左侧
        tooltipTop = rect.top + rect.height / 2;
        tooltipLeft = rect.left - 10;
      }
    }
    
    // 检查下排按钮，确保不会被遮挡
    // 获取页面上所有工具栏项
    const allToolbarItems = document.querySelectorAll('.toolbar-item');
    let mustAdjust = false;
    
    // 检查是否有其他按钮可能会遮挡提示框
    allToolbarItems.forEach((item) => {
      if (item !== event.currentTarget) {
        const itemRect = item.getBoundingClientRect();
        // 如果水平工具栏
        if (config.value.direction === 'horizontal') {
          // 检查提示框是否被下方的按钮遮挡
          if (Math.abs(itemRect.left - rect.left) < rect.width && 
              itemRect.top > rect.bottom && 
              itemRect.top < tooltipTop + 30) {
            mustAdjust = true;
          }
        } else {
          // 垂直工具栏时，检查是否有按钮在提示框可能显示的位置
          if (config.value.position.endsWith('left')) {
            // 左侧工具栏，检查右侧区域
            if (itemRect.left > rect.right && 
                itemRect.left < tooltipLeft + 150 && // 150px为估计的提示框宽度
                Math.abs(itemRect.top - rect.top) < rect.height * 2) {
              mustAdjust = true;
            }
          } else {
            // 右侧工具栏，检查左侧区域
            if (itemRect.right < rect.left && 
                itemRect.right > tooltipLeft - 150 && // 150px为估计的提示框宽度
                Math.abs(itemRect.top - rect.top) < rect.height * 2) {
              mustAdjust = true;
            }
          }
        }
      }
    });
    
    // 如果检测到可能遮挡，调整提示框位置
    if (mustAdjust) {
      if (config.value.direction === 'horizontal') {
        // 水平工具栏时的调整逻辑
        if (config.value.position.startsWith('top')) {
          // 顶部工具栏，即使检测到遮挡也保持提示在下方，只调整水平位置
          tooltipLeft += 20; // 水平方向偏移以避免遮挡
        } else {
          // 底部工具栏，提示显示在上方
          tooltipTop = rect.top - 30;
        }
      } else {
        // 垂直工具栏时，调整提示框显示在更远的位置
        if (config.value.position.endsWith('left')) {
          tooltipLeft = rect.right + 30;
        } else {
          tooltipLeft = rect.left - 30;
        }
      }
    }
    
    // 更新工具提示状态
    tooltipState.value = {
      visible: true,
      top: tooltipTop,
      left: tooltipLeft,
      text: tool.tooltip || tool.name || ''
    };
  } else {
    // 鼠标离开，隐藏提示
    tooltipState.value.visible = false;
  }
};

// 暴露方法给父组件
defineExpose({
  updateActiveTools,
  refreshToolbarState,
  forceUpdate,        // 新增：强制更新方法
  updateConfig,       // 新增：更新配置方法
  getToolbarObj: () => toolbarObj.value,
  setToolbarObj: (obj: ToolbarObject) => {
    toolbarObj.value = obj;
  },
});
</script>

<style lang="scss" scoped>
.map-toolbar {
  position: absolute;
  border-radius: 4px;
  z-index: 2000;
  pointer-events: auto !important;

  &:hover {
    .toolbar-collapse {
      opacity: 1;
    }
  }

  .toolbar-collapse {
    opacity: 1;
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: auto !important;
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
  background-color: #ffffff; /* 非隐藏状态恢复为白色背景 */
  border-radius: 4px;
  cursor: pointer !important;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 恢复为灰色阴影 */
  transition: all 0.3s ease;
  z-index: 3000;
  pointer-events: auto !important;
  opacity: 0.8; /* 保留透明度设置 */

  &:hover {
    background-color: #f6f6f6; /* hover时恢复为原来的浅灰色 */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    opacity: 1; /* hover时不透明 */
  }

  .collapse-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    opacity: 1;
    height: 100%;
    color: #666; /* 恢复为灰色图标 */
    transition: all 0.3s ease;
    pointer-events: auto !important;
  }

  &:hover .collapse-icon {
    color: #1890ff; /* hover时仍然显示蓝色 */
    transform: scale(1.1);
  }
}

/* 收缩状态下的样式 - 保持蓝色 */
.map-toolbar[style*="translateX"] .toolbar-collapse,
.map-toolbar[style*="translateY"] .toolbar-collapse {
  background-color: #1890ff !important; /* 使用更醒目的蓝色背景 */
  box-shadow: 0 2px 10px rgba(24, 144, 255, 0.5) !important; /* 增强阴影效果 */
  opacity: 1 !important; /* 完全不透明 */
  border: 2px solid rgba(24, 143, 255, 0.507)a6 !important; /* 添加白色边框 */
  width: 32px !important; /* 略微增大尺寸 */
  height: 32px !important;
  z-index: 3001 !important; /* 确保在最上层 */
  visibility: visible !important; /* 确保可见 */
  display: flex !important; /* 确保显示 */
  pointer-events: auto !important; /* 确保可点击 */
}

/* 收缩状态下的图标颜色 */
.map-toolbar[style*="translateX"] .toolbar-collapse .collapse-icon,
.map-toolbar[style*="translateY"] .toolbar-collapse .collapse-icon {
  color: white !important; /* 图标改为白色，与蓝色背景形成鲜明对比 */
  opacity: 1 !important; /* 图标不透明 */
  transform: scale(1.1) !important; /* 略微放大图标 */
}

/* 收缩状态下hover效果增强 - 水平方向 */
.map-toolbar[style*="translateX"] .toolbar-collapse:hover {
  background-color: #40a9ff !important; /* hover时背景色更亮 */
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.6) !important; /* hover时阴影更突出 */
  transform: scale(1.05) translateY(-50%) !important; /* 保持垂直居中并略微放大 */
}

/* 收缩状态下hover效果增强 - 垂直方向 */
.map-toolbar[style*="translateY"] .toolbar-collapse:hover {
  background-color: #40a9ff !important; /* hover时背景色更亮 */
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.6) !important; /* hover时阴影更突出 */
  transform: scale(1.05) translateX(-50%) !important; /* 保持水平居中并略微放大 */
}

/* 收缩状态下的位置 - 水平方向 */
.map-toolbar[style*="translateX"] .toolbar-collapse {
  transform: translateY(-50%);
}

.direction-horizontal.position-top-left[style*="translateX"] .toolbar-collapse,
.direction-horizontal.position-bottom-left[style*="translateX"] .toolbar-collapse {
  right: -28px;
  left: auto;
}

.direction-horizontal.position-top-right[style*="translateX"] .toolbar-collapse,
.direction-horizontal.position-bottom-right[style*="translateX"] .toolbar-collapse {
  left: -28px;
  right: auto;
}

/* 收缩状态下的位置 - 垂直方向 */
.map-toolbar[style*="translateY"] .toolbar-collapse {
  transform: translateX(-50%);
}

.direction-vertical.position-top-left[style*="translateY"] .toolbar-collapse,
.direction-vertical.position-top-right[style*="translateY"] .toolbar-collapse {
  bottom: -40px;
  top: auto;
  left: 50%;
}

.direction-vertical.position-bottom-left[style*="translateY"] .toolbar-collapse,
.direction-vertical.position-bottom-right[style*="translateY"] .toolbar-collapse {
  top: -40px;
  bottom: auto;
  left: 50%;
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
  cursor: pointer !important;
  transition: all 0.3s;
  user-select: none;
  border: 2px solid transparent;
  z-index: 2005;
  pointer-events: auto !important;

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
    right: 3px;
    bottom: 3px;
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
  z-index: 20000 !important; /* 显著提高激活的子菜单层级 */
}

/* 子菜单项hover状态 */
.toolbar-submenu .submenu-item:hover {
  z-index: 20001 !important; /* 确保子菜单项在悬停时显示在最上层 */
}

/* 横向排列时的子菜单指示器 */
.direction-horizontal .toolbar-item.has-submenu::after {
  right: 3px;
  bottom: 3px;
}

/* 纵向排列时的子菜单指示器 */
.direction-vertical .toolbar-item.has-submenu::after {
  right: 3px;
  top: 50%;
  transform: translateY(-50%);
}

/* 子菜单样式 */
.toolbar-submenu {
  position: absolute; /* 使用绝对定位 */
  background-color: transparent; /* 透明背景 */
  border-radius: 4px;
  z-index: 999999 !important; /* 提高z-index确保不被其他元素遮挡 */
  display: none;
  padding: 4px;
  transform-origin: top left;
  animation: submenu-fade-in 0.2s ease;

  &.submenu-active {
    display: flex;
    flex-direction: row; /* 水平排列子菜单项 */
    flex-wrap: wrap; /* 允许换行 */
    gap: 4px; /* 设置间距 */
    z-index: 999999 !important; /* 使用最高层级 */
  }

  /* 横向和纵向排列的子菜单都使用相同的水平布局 */
  &.direction-horizontal, &.direction-vertical {
    display: flex;
    flex-direction: row; /* 水平排列子菜单项 */
    flex-wrap: wrap; /* 允许换行 */
    gap: 4px; /* 设置间距 */
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

/* 固定定位的子菜单 */
.submenu-positioned {
  position: fixed !important;
  display: flex !important;
  flex-direction: row !important; /* 水平排列 */
  flex-wrap: wrap !important; /* 允许换行 */
  background-color: transparent; /* 透明背景 */
  padding: 4px;
  gap: 4px; /* 设置间距 */
  border-radius: 4px;
  z-index: 999999 !important;
  max-width: 400px; /* 限制最大宽度，防止无限扩展 */
}

/* 子菜单项样式 - 与主菜单项保持一致 */
.submenu-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: v-bind(buttonSize + 'px');
  height: v-bind(buttonSize + 'px');
  margin: 0;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer !important;
  transition: all 0.3s;
  user-select: none;
  border: 2px solid transparent;
  z-index: 2005;
  pointer-events: auto !important;

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

  &.active .svg-icon svg * {
    fill: #ffffff !important;
    stroke: #ffffff !important;
  }
}

/* 父菜单激活时重置子菜单图标样式 */
.toolbar-item.active .toolbar-submenu .submenu-item:not(.active) {
  path {
    fill: #666666 !important;
  }

  circle {
    fill: #666666 !important;
  }
}

/* 工具提示样式 */
.toolbar-tooltip {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 9999; /* 增大z-index值，确保比所有其他元素都高 */
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: tooltip-fade-in 0.2s ease;
  transform: translateX(-50%); /* 水平居中 */
}

/* 水平方向工具栏的提示样式 */
.direction-horizontal .toolbar-tooltip {
  transform: translateX(-50%); /* 水平居中 */
}

/* 垂直方向工具栏的提示样式 */
.direction-vertical .toolbar-tooltip {
  transform: translateY(-50%); /* 垂直居中 */
}

/* 添加左侧工具栏的提示样式 */
.position-top-left .toolbar-tooltip,
.position-bottom-left .toolbar-tooltip {
  left: unset !important; /* 覆盖任何已有的left值 */
  margin-left: 10px; /* 与工具栏保持一定距离 */
}

/* 添加右侧工具栏的提示样式 */
.position-top-right .toolbar-tooltip,
.position-bottom-right .toolbar-tooltip {
  right: unset !important; /* 覆盖任何已有的right值 */
  margin-right: 10px; /* 与工具栏保持一定距离 */
  margin-left: -10px; /* 向左偏移 */
}

/* 更精确控制不同位置的工具提示动画 */
@keyframes tooltip-fade-in-horizontal {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

@keyframes tooltip-fade-in-vertical {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

/* 基础位置样式 - 水平方向左侧工具栏 */
.direction-horizontal.position-top-left .toolbar-collapse,
.direction-horizontal.position-bottom-left .toolbar-collapse {
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
}

/* 基础位置样式 - 水平方向右侧工具栏 */
.direction-horizontal.position-top-right .toolbar-collapse,
.direction-horizontal.position-bottom-right .toolbar-collapse {
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
}

/* 基础位置样式 - 垂直方向顶部工具栏 */
.direction-vertical.position-top-left .toolbar-collapse,
.direction-vertical.position-top-right .toolbar-collapse {
  left: 50%;
  bottom: -30px;
  top: auto;
  transform: translateX(-50%);
}

/* 基础位置样式 - 垂直方向底部工具栏 */
.direction-vertical.position-bottom-left .toolbar-collapse,
.direction-vertical.position-bottom-right .toolbar-collapse {
  left: 50%;
  top: -30px;
  bottom: auto;
  transform: translateX(-50%);
}

/* 添加额外的选择器确保收缩按钮始终可见 */
.toolbar-collapse {
  opacity: 1 !important;
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: auto !important;
  visibility: visible !important;
  display: flex !important;
}
</style>
<style lang="scss">
.total-distance {
  background-color: #91bf8a;
  border-radius: 4px;
  padding: 8px;
}

/* 修改全局active样式，避免影响子菜单项 */
.active:not(.submenu-item):not(.color-override) {
  path {
    fill: #FFF;
  }

  circle {
    fill: #FFF;
  }
}

/* 单独定义子菜单项激活样式 */
.submenu-item.active {
  path {
    fill: #FFF !important;
  }

  circle {
    fill: #FFF !important;
  }
}

/* 父菜单激活时重置子菜单图标样式 */
.toolbar-item.active .toolbar-submenu .submenu-item:not(.active) {
  path {
    fill: #666666 !important;
  }

  circle {
    fill: #666666 !important;
  }
}
</style>