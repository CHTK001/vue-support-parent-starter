/**
* 地图工具栏
* @author CH
* @date 2025-04-29
*/
<template>
  <div :class="[toolbarClass, `size-${config.size}`]" :style="toolbarStyle" v-if="visible" @dblclick.stop.prevent @click.stop :key="forceUpdateKey">
    <div v-for="tool in visibleTools" :key="tool.id" class="toolbar-item" :class="[
      { active: isToolActive(tool.id) },
      { 'has-submenu': (tool.type === 'menu' || tool.type === 'button') && tool.children?.length },
      tool?.className || ''
    ]" :data-tool-id="tool.id" @click.stop="(e) => handleToolClick(tool, e)" @dblclick.stop.prevent>
      <span v-if="typeof tool.icon === 'string'" class="svg-icon" v-html="tool.icon"></span>
      <component v-else :is="tool.icon" />
      <div class="toolbar-tooltip" v-if="!(openSubMenus.includes(tool.id))">
        {{ tool.tooltip || tool.name }}
      </div>

      <!-- 子菜单 - 同时支持menu和button类型 -->
      <div v-if="(tool.type === 'menu' || tool.type === 'button') && tool.children?.length" class="toolbar-submenu" :class="[
        { 'submenu-active': openSubMenus.includes(tool.id) },
        `direction-${config.direction}`
      ]" @click.stop>
        <div class="submenu-arrow"></div>
        <div v-for="subTool in tool.children" :key="subTool.id" class="submenu-item toolbar-item color-override"
          :class="[
            { active: isToolActive(subTool.id) },
            { 'has-submenu': subTool.children?.length },
            subTool.className
          ]" :data-tool-id="subTool.id"
          @click.stop.prevent="(e) => handleSubMenuClick(tool, subTool, e)">
          <span v-if="typeof subTool.icon === 'string'" class="svg-icon submenu-icon" v-html="subTool.icon"></span>
          <component v-else-if="subTool.icon" :is="subTool.icon" class="submenu-icon" />
          <div class="toolbar-tooltip">
            {{ subTool.tooltip || subTool.name }}
          </div>
          
          <!-- 支持嵌套子菜单 -->
          <div v-if="subTool.children?.length" class="toolbar-submenu nested-submenu" :class="[
            { 'submenu-active': openSubMenus.includes(subTool.id) },
            `direction-${config.direction}`
          ]" @click.stop>
            <div class="submenu-arrow"></div>
            <div v-for="nestedTool in subTool.children" :key="nestedTool.id" class="submenu-item toolbar-item color-override"
              :class="[{ active: isToolActive(nestedTool.id) }, nestedTool.className]" :data-tool-id="nestedTool.id"
              @click.stop.prevent="(e) => handleSubMenuClick(subTool, nestedTool, e)">
              <span v-if="typeof nestedTool.icon === 'string'" class="svg-icon submenu-icon" v-html="nestedTool.icon"></span>
              <component v-else-if="nestedTool.icon" :is="nestedTool.icon" class="submenu-icon" />
              <div class="toolbar-tooltip">
                {{ nestedTool.tooltip || nestedTool.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
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
  } as ToolbarConfig),
  toolbarObj: null
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

const toolbarObj = ref<ToolbarObject | null>(null);
// 将tools当作本地状态，不再使用深拷贝，而是直接使用props中的数据
// 这样可以保持与ToolbarObject的一致性
const visibleTools = computed(() => {
  return (props.toolbarConfig.items || []).filter(tool => tool.show !== false);
}) as unknown as ToolItem[];

// 判断工具是否激活
const isToolActive = (toolId: string): boolean => {
  // 优先使用activeToolsMap中的记录，保证视图与数据一致
  if (toolId in activeToolsMap.value) {
    return activeToolsMap.value[toolId];
  }
  
  // 兼容旧模式
  if (props.activeToolId === toolId) return true;
  
  // 优先使用toolbarObj判断工具状态
  if (toolbarObj.value) {
    const tools = toolbarObj.value.getTools();
    const tool = tools.find(t => t.id === toolId);
    const isActive = !!tool?.active;
    
    // 更新本地状态缓存
    if (tool) {
      activeToolsMap.value[toolId] = isActive;
    }
    
    return isActive;
  }
  
  // 在工具配置中查找
  const tool = (props.toolbarConfig.items || []).find(t => t.id === toolId);
  return !!tool?.active;
};

// 保持原有的状态变量
const visible = ref(true); // 控制工具栏整体显示/隐藏
const openSubMenus = ref<string[]>([]);
const isCollapsed = ref(false);

// 组件挂载时初始化收缩状态
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
});

// 关闭窗口点击事件监听器函数引用
let globalClickListener: ((e: MouseEvent) => void) | null = null;

// 向父组件发送事件
const emit = defineEmits([
  'tool-click',
  'tool-activated',
  'tool-deactivated',
  'collapse-change',
  'submenu-open',
  'submenu-close',
  'submenu-item-click'
]);


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
  
  // 更新激活状态Map
  activeToolsMap.value = activeToolsObj;
  
  // 打印当前激活的工具
  if (Object.keys(activeToolsObj).length > 0) {
    console.debug('当前激活工具: ', Object.keys(activeToolsObj).join(', '));
  }
  
  // 强制刷新视图
  forceUpdateKey.value++;
};

// 处理工具点击
const handleToolClick = (tool: ToolItem, event: MouseEvent) => {
  if (tool.disabled) return;

  // 向父组件发送点击事件
  emit('tool-click', {
    toolId: tool.id,
    tool,
    event
  });

  // 处理菜单工具或有子菜单的按钮工具
  if (tool.type === 'menu' || (tool.type === 'button' && tool.children?.length)) {
    const menuIndex = openSubMenus.value.indexOf(tool.id);
    if (menuIndex === -1) {
      // 打开子菜单
      openSubMenus.value.push(tool.id);
      emit('submenu-open', tool.id);
      
      // 添加点击外部关闭子菜单的处理
      if (!globalClickListener) {
        globalClickListener = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          // 检查点击是否在子菜单外部
          if (!target.closest('.toolbar-submenu') && !target.closest(`[data-tool-id="${tool.id}"]`)) {
            closeAllSubMenus();
          }
        };
        // 延迟添加监听器，避免与当前点击冲突
        nextTick(() => {
          document.addEventListener('click', globalClickListener as EventListener);
        });
      }
    } else {
      // 关闭子菜单
      openSubMenus.value.splice(menuIndex, 1);
      emit('submenu-close', tool.id);
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

// 处理子菜单项点击
const handleSubMenuClick = (parentTool: ToolItem, subTool: ToolItem, event: MouseEvent) => {
  if (subTool.disabled) return;

  // 向父组件发送事件
  emit('submenu-item-click', {
    parentToolId: parentTool.id,
    toolId: subTool.id,
    parentTool,
    tool: subTool,
    event
  });
  
  // 处理子菜单工具或有子菜单的按钮工具
  if (subTool.type === 'menu' || (subTool.type === 'button' && subTool.children?.length)) {
    // 对于有子菜单的工具，不关闭父菜单
    
    const menuIndex = openSubMenus.value.indexOf(subTool.id);
    if (menuIndex === -1) {
      // 打开子菜单
      openSubMenus.value.push(subTool.id);
      emit('submenu-open', subTool.id);
    } else {
      // 关闭子菜单
      openSubMenus.value.splice(menuIndex, 1);
      emit('submenu-close', subTool.id);
    }
  } else {
    // 对于没有子菜单的工具，点击后关闭父菜单
    const menuIndex = openSubMenus.value.indexOf(parentTool.id);
    if (menuIndex !== -1) {
      openSubMenus.value.splice(menuIndex, 1);
      emit('submenu-close', parentTool.id);
    }
  }

  // 使用toolbarObj处理子菜单项点击
  if (toolbarObj.value) {
    try {
      console.debug(`点击子菜单项 ${subTool.id} 前状态: ${isToolActive(subTool.id) ? '激活' : '未激活'}`);
      
      // 调用工具栏对象的处理方法
      toolbarObj.value.handleSubMenuClick(parentTool.id, subTool.id);
      
      // 手动更新工具状态并强制刷新视图
      nextTick(() => {
        updateActiveTools();
        
        // 获取最新状态
        const isActive = isToolActive(subTool.id);
        console.debug(`点击子菜单项 ${subTool.id} 后状态: ${isActive ? '激活' : '未激活'}`);
        
        // 发送相应事件
        if (isActive) {
          emit('tool-activated', subTool.id);
        } else {
          emit('tool-deactivated', subTool.id);
        }
      });
    } catch (error) {
      console.error(`处理子菜单项 ${subTool.id} 点击事件失败:`, error);
    }
  } else {
    // 兼容旧逻辑
    // 处理切换类型工具
    if (subTool.type === 'toggle') {
      const active = !isToolActive(subTool.id);
      if (active) {
        emit('tool-activated', subTool.id);
      } else {
        emit('tool-deactivated', subTool.id);
      }
    } else {
      // 其他类型工具直接触发激活事件
      emit('tool-activated', subTool.id);
    }
  }
};

// 关闭所有子菜单
const closeAllSubMenus = () => {
  if (openSubMenus.value.length > 0) {
    openSubMenus.value.forEach(menuId => {
      emit('submenu-close', menuId);
    });
    openSubMenus.value = [];
  }

  // 移除全局点击事件监听器
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

// 修改toolbarStyle计算属性，使用CSS grid来控制每行/列工具数量
const toolbarStyle = computed(() => {
  const style: Record<string, string> = {
    padding: `${buttonMargin.value}px`,
    backgroundColor: 'transparent',
    '--buttonSize': config.value.size + 'px',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
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
  // 不限制工具数量时使用flex布局
    style.display = 'flex';
    style.gap = `${buttonMargin.value}px`;

    // 横向排列
    if (config.value.direction === 'horizontal') {
      style.flexDirection = 'row';
      // 根据位置设置flex方向
      if (config.value.position.endsWith('right')) {
        style.flexDirection = 'row-reverse';
      }
    }
    // 纵向排列
    else {
      style.flexDirection = 'column';
      // 根据位置设置flex方向
      if (config.value.position.endsWith('right')) {
        style.flexDirection = 'column-reverse';
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
    style.opacity = '0.2';
    style.pointerEvents = 'none'; // 收缩状态下禁用工具栏交互
  } else {
    style.transform = 'translate(0, 0)';
    style.opacity = '1';
    style.pointerEvents = 'auto';
  }

  return style;
});

defineExpose({
  getToolbarObj: () => toolbarObj.value,
  setToolbarObj: (obj: ToolbarObject) => {
    toolbarObj.value = obj;
  }
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
    opacity: 0.8;
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
  background-color: #ffffff;
  border-radius: 4px;
  cursor: pointer !important;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 3000;
  pointer-events: auto !important;

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
    pointer-events: auto !important;
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
.map-toolbar .toolbar-collapse {
  opacity: 1;
  background-color: #f6f6f6;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
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
.position-top-left .toolbar-item .toolbar-tooltip,
/* 工具提示样式 */
.toolbar-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 9999; /* 增大z-index值，确保比所有其他元素都高 */
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

/* 鼠标悬停时显示提示框，但子菜单打开时父菜单不显示tooltip */
.toolbar-item:hover .toolbar-tooltip {
  opacity: 1;
  visibility: visible;
}

/* 当子菜单激活时，禁用父菜单的tooltip */
.toolbar-item.has-submenu.active:hover .toolbar-tooltip,
.toolbar-submenu.submenu-active~.toolbar-tooltip,
.toolbar-item.has-submenu.active .toolbar-tooltip {
  opacity: 0;
  visibility: hidden;
  display: none;
  /* 确保完全隐藏 */
}

/* 子菜单打开时，子菜单项的tooltip正常显示 */
.toolbar-submenu.submenu-active .submenu-item:hover .toolbar-tooltip {
  opacity: 1;
  visibility: visible;
  z-index: 9999; /* 确保tooltip显示在最上层 */
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
  left: auto;
  /* 确保不使用左侧定位 */
  text-align: right;
  /* 右对齐文本 */
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
  text-align: center;
  /* 居中对齐文本 */
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
  text-align: center;
  /* 居中对齐文本 */
}

/* 确保右侧工具栏的提示框不会超出屏幕左侧 */
.position-top-right .toolbar-item .toolbar-tooltip,
.position-bottom-right .toolbar-item .toolbar-tooltip {
  min-width: 120px;
  /* 设置最小宽度 */
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
  z-index: 3010; /* 激活的子菜单位于更高层级 */
}

/* 子菜单项hover状态 */
.toolbar-submenu .submenu-item:hover {
  z-index: 3020; /* 子菜单项在子菜单之上 */
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

.toolbar-submenu {
  position: absolute;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  z-index: 3000; /* 高于工具栏的层级 */
  display: none;
  padding: 4px;
  transform-origin: top left;
  animation: submenu-fade-in 0.2s ease;

  &.submenu-active {
    display: flex;
    z-index: 3010; /* 激活的子菜单位于更高层级 */
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
        right: calc(50% - 20px);
        /* 相对于子菜单项居中 */
        transform: none;
      }
    }

    /* 在左侧边缘时右对齐 */
    .position-top-left &,
    .position-bottom-left & {
      left: 0;
      transform: none;

      .submenu-arrow {
        left: calc(50% - 20px);
        /* 相对于子菜单项居中 */
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
      top: 18px;
      /* 约为按钮高度的一半 */
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
        top: 18px;
        /* 与左侧保持一致 */
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
  z-index: 2010;
  /* 确保激活的父菜单显示在较高层级 */
}

.toolbar-submenu.submenu-active .submenu-item {
  position: relative;
  z-index: 2020;
  /* 确保子菜单项显示在最高层级 */
}

/* 收缩状态下的收缩按钮样式 */
.map-toolbar[style*="translateX"] .toolbar-collapse,
.map-toolbar[style*="translateY"] .toolbar-collapse {
  background-color: #1890ff !important;
  box-shadow: 0 2px 10px rgba(24, 144, 255, 0.4) !important;
  
  .collapse-icon {
    color: white !important;
  }
}

/* 水平左侧工具栏收缩时 */
.direction-horizontal.position-top-left[style*="translateX"] .toolbar-collapse,
.direction-horizontal.position-bottom-left[style*="translateX"] .toolbar-collapse {
  right: -34px !important; // 增加偏移
  transform: translateY(-50%) !important;
}

/* 水平右侧工具栏收缩时 */
.direction-horizontal.position-top-right[style*="translateX"] .toolbar-collapse,
.direction-horizontal.position-bottom-right[style*="translateX"] .toolbar-collapse {
  left: -34px !important; // 增加偏移
  transform: translateY(-50%) !important;
}

/* 垂直顶部工具栏收缩时 */
.direction-vertical.position-top-left[style*="translateY"] .toolbar-collapse,
.direction-vertical.position-top-right[style*="translateY"] .toolbar-collapse {
  bottom: -34px !important; // 增加偏移
  transform: translateX(-50%) !important;
}

/* 垂直底部工具栏收缩时 */
.direction-vertical.position-bottom-left[style*="translateY"] .toolbar-collapse,
.direction-vertical.position-bottom-right[style*="translateY"] .toolbar-collapse {
  top: -34px !important; // 增加偏移
  transform: translateX(-50%) !important;
}

/* 嵌套子菜单样式 */
.nested-submenu {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 2px;
  
  &.direction-horizontal {
    left: 0;
    top: 100%;
    margin-left: 0;
    margin-top: 2px;
  }
  
  &.direction-vertical {
    &.position-top-right, &.position-bottom-right {
      left: auto;
      right: 100%;
      margin-left: 0;
      margin-right: 2px;
    }
  }
}

/* 显示嵌套子菜单的条件 */
.submenu-item.has-submenu .nested-submenu {
  display: none;
}

.submenu-item.has-submenu .nested-submenu.submenu-active {
  display: flex;
}

/* 扩展原有样式以支持button类型工具的子菜单 */
.toolbar-item.active:not(.submenu-item) .toolbar-submenu.submenu-active,
.toolbar-item.has-submenu .toolbar-submenu.submenu-active {
  display: flex;
}

/* 确保任何类型工具的子菜单只在打开状态下显示 */
.toolbar-submenu:not(.submenu-active) {
  display: none !important;
}

/* 将button类型工具与menu类型统一样式 */
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

/* 确保button和menu类型工具的子菜单样式统一 */
.toolbar-item[data-tool-id].has-submenu:not(.active) .toolbar-submenu {
  display: none !important;
}

.toolbar-item[data-tool-id].has-submenu.active .toolbar-submenu,
.toolbar-item[data-tool-id].has-submenu .toolbar-submenu.submenu-active {
  display: flex !important;
}

/* 菜单类工具激活样式 */
.toolbar-item[data-tool-id].has-submenu.active {
  background-color: #1890ff;
  color: white;
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
}

.toolbar-item[data-tool-id].has-submenu.active * {
  color: white;
}

.toolbar-item[data-tool-id].has-submenu.active svg * {
  fill: white !important;
  stroke: white !important;
}

/* 设置button类型工具的子菜单显示逻辑 */
.toolbar-item[data-tool-id][class*="button"].has-submenu:not(.active) .toolbar-submenu:not(.submenu-active) {
  display: none !important;
}

.toolbar-item[data-tool-id][class*="button"].has-submenu.active .toolbar-submenu,
.toolbar-submenu.submenu-active {
  display: flex !important;
}

/* 增强子菜单箭头样式 */
.submenu-arrow {
  position: absolute;
  border-width: 8px;
  z-index: 2011;
}

/* 直接对应menu和button类型的工具 */
.toolbar-item.has-submenu[data-tool-id] .toolbar-submenu {
  display: none;
}

.toolbar-item.has-submenu[data-tool-id] .toolbar-submenu.submenu-active {
  display: flex;
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

/* 工具提示样式 */
.toolbar-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 9999; /* 增大z-index值，确保比所有其他元素都高 */
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