<template>
  <div class="map-toolbar" :class="[positionClass, { collapsed }, `size-${buttonSize}`]" v-show="show"
       :style="{ '--tools-per-row': localItemsPerRow }">
    <div class="toolbar-container">
      <div class="tool-group">
        <div class="toolbar-header" :class="{ 'right-side': isRightSide }">
          <!-- 右侧位置时的折叠/展开按钮 -->
          <div v-if="isRightSide" class="toggle-btn tool-btn" @click="$emit('toggle-collapse')">
            <div class="tool-icon" v-html="collapsed ? getRightExpandIcon : getRightCollapseIcon"></div>
          </div>

          <!-- 工具按钮 -->
          <div v-for="tool in allToolsToShow" :key="tool.id" class="tool-btn" :class="{
            active: isActiveToolState(tool.id),
            disabled: tool.disabled,
            'confirm-state': tool.id === 'clear' && showClearConfirm
          }" @click="!tool.disabled && handleToolClick(tool.id)"
            :title="tool.id === 'clear' && showClearConfirm ? '确认清除' : getToolLabel(tool.id)" v-show="!collapsed"
            :data-tool="tool.id">
            <div class="tool-icon" v-html="getToolIcon(tool.id)"></div>
            <div v-if="tool.id === 'clear' && showClearConfirm" class="confirm-badge">
              点击确认清除
            </div>
          </div>

          <!-- 左侧位置时的折叠/展开按钮放在同一行 -->
          <div v-if="!isRightSide" class="toggle-btn tool-btn" @click="$emit('toggle-collapse')">
            <div class="tool-icon" v-html="collapsed ? getLeftExpandIcon : getLeftCollapseIcon"></div>
          </div>
        </div>

        <!-- 标记选择面板 -->
        <div class="marker-panel" v-if="showMarkerPanel && !collapsed">
          <div class="marker-slider-container">
            <div class="slider-arrow left" @click="scrollMarkers('left')" v-if="canScrollLeft">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M15,6 L9,12 L15,18" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" />
              </svg>
            </div>

            <div class="marker-slider" ref="markerSlider">
              <div v-for="marker in getAllMarkers()" :key="marker.id || marker.name" class="marker-item"
                @click="selectMarker(marker)" :title="marker.name">
                <div class="marker-icon" v-html="marker.icon"></div>
              </div>
            </div>

            <div class="slider-arrow right" @click="scrollMarkers('right')" v-if="canScrollRight">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M9,6 L15,12 L9,18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 添加视图类型下拉菜单 -->
        <div class="view-type-dropdown" v-if="showViewTypeMenu && !collapsed" :class="positionClass" ref="viewTypeMenuRef">
          <div class="dropdown-header">地图视图类型</div>
          <div class="dropdown-items-container">
            <div v-for="option in viewTypeOptions" :key="option.value"
              class="dropdown-item" 
              @click="handleViewTypeChange(option.value)" 
              :class="{ 'active-view': currentViewType === option.value }">
              <div class="view-preview">
                <img :src="option.image" :alt="`${option.label}地图`" class="view-image">
              </div>
              <span class="item-label">{{ option.label }}</span>
              <span class="active-indicator" v-if="currentViewType === option.value"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps, defineExpose, watch, onMounted, onUnmounted } from 'vue';
import { type ToolType, type ToolsOptions, MapViewType } from '../types';
import { info } from '@repo/utils';

// 自定义工具接口
interface CustomTool {
  id: string;
  callback?: string;
  visible?: boolean;
  icon?: string;
  label?: string;
  disabled?: boolean;
  type?: 'normal' | 'switch' | 'select'; // 添加select类型
  active?: boolean; // 按钮激活状态，主要用于switch类型
  order?: number; // 排序顺序，数字越小越靠前
}

// 视图类型选项接口
interface ViewTypeOption {
  value: string;
  label: string;
  image: string;
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
  currentViewType?: string; // 当前地图视图类型
  // 新增支持的视图类型列表，由地图组件传入
  supportedViewTypes?: ViewTypeOption[];
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
    clear: true,
    position: true,
    debug: true
  }),
  markers: () => [],
  activeTool: '',
  modelValue: '',
  showPosition: false,
  itemsPerRow: 12, // 默认每行显示工具数量
  buttonSize: 'default', // 默认使用小尺寸按钮
  currentViewType: MapViewType.NORMAL, // 默认视图类型为标准地图
  // 默认支持的视图类型
  supportedViewTypes: () => []
});

const emit = defineEmits([
  'tool-click',
  'toggle-collapse',
  'category-toggle',
  'update:modelValue',
  'update:showPosition',
  'debug-toggle',
  'marker-type-selected', // 添加标记类型选择事件
  'view-type-change', // 添加视图类型切换事件
  'request-view-types' // 添加请求视图类型事件
]);

// 自定义工具
const customTools = ref<CustomTool[]>([]);
// 自定义图标
const customIcons = ref<Record<string, string>>({});
// 自定义标签
const customLabels = ref<Record<string, string>>({});
// 禁用的工具
const disabledTools = ref<string[]>([]);
// 本地存储行显示工具数量
const localItemsPerRow = ref<number>(props.itemsPerRow);

const currentViewType = ref(props.currentViewType);
// 添加清除确认相关状态
const showClearConfirm = ref<boolean>(false);
let clearConfirmTimer: number | null = null;

// 添加标记面板相关状态
const showMarkerPanel = ref<boolean>(false);
// 添加视图类型菜单相关状态
const showViewTypeMenu = ref<boolean>(false);
// 视图类型选项，使用ref而不是computed
const viewTypeOptions = ref<ViewTypeOption[]>([]);

// 标记类型定义
interface MarkerType {
  id: string;
  name: string;
  icon: string;
  category?: string;
  color?: string;
  data?: Record<string, any>;
}

// 预定义标记类型
const markerTypes = ref<MarkerType[]>([
  {
    id: 'default',
    name: '默认标记',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#1890FF" stroke="white" stroke-width="1"/><circle cx="12" cy="8" r="3" fill="white"/></svg>',
    category: '基础',
    color: '#1890FF'
  },
  {
    id: 'warning',
    name: '警告标记',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#FAAD14" stroke="white" stroke-width="1"/><path d="M12,5 L12,11" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="14" r="1" fill="white"/></svg>',
    category: '警告',
    color: '#FAAD14'
  },
  {
    id: 'danger',
    name: '危险标记',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#F5222D" stroke="white" stroke-width="1"/><path d="M8,8 L16,8" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
    category: '危险',
    color: '#F5222D'
  },
  {
    id: 'info',
    name: '信息标记',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#13C2C2" stroke="white" stroke-width="1"/><circle cx="12" cy="6" r="1" fill="white"/><path d="M12,9 L12,14" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
    category: '信息',
    color: '#13C2C2'
  },
  {
    id: 'location',
    name: '位置标记',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#722ED1" stroke="white" stroke-width="1"/><path d="M12,5 L12,11 L16,8" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>',
    category: '位置',
    color: '#722ED1'
  },
  {
    id: 'parking',
    name: '停车场',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#2F54EB" stroke="white" stroke-width="1"/><text x="12" y="12" text-anchor="middle" fill="white" font-size="10" font-weight="bold">P</text></svg>',
    category: '设施',
    color: '#2F54EB'
  },
  {
    id: 'restaurant',
    name: '餐厅',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#EB2F96" stroke="white" stroke-width="1"/><path d="M8,7 L16,7 M8,10 L16,10 M12,7 L12,14" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>',
    category: '设施',
    color: '#EB2F96'
  },
  {
    id: 'hotel',
    name: '酒店',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#52C41A" stroke="white" stroke-width="1"/><rect x="8" y="7" width="8" height="6" rx="1" stroke="white" stroke-width="1.5" fill="none"/></svg>',
    category: '设施',
    color: '#52C41A'
  },
  {
    id: 'hospital',
    name: '医院',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#F759AB" stroke="white" stroke-width="1"/><path d="M8,10 L16,10 M12,6 L12,14" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>',
    category: '设施',
    color: '#F759AB'
  },
  {
    id: 'school',
    name: '学校',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#9254DE" stroke="white" stroke-width="1"/><path d="M7,9 L17,9 L12,6 Z M8,9 L8,13 M16,9 L16,13 M7,13 L17,13" stroke="white" stroke-width="1.5" fill="none"/></svg>',
    category: '设施',
    color: '#9254DE'
  },
  {
    id: 'start',
    name: '起点',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#52C41A" stroke="white" stroke-width="1"/><path d="M8,8 L12,12 L16,8" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
    category: '导航',
    color: '#52C41A'
  },
  {
    id: 'end',
    name: '终点',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#FF4D4F" stroke="white" stroke-width="1"/><circle cx="12" cy="8" r="4" fill="none" stroke="white" stroke-width="1.5"/><circle cx="12" cy="8" r="1.5" fill="white"/></svg>',
    category: '导航',
    color: '#FF4D4F'
  }
]);

// 工具属性
const toolValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 监听props的itemsPerRow变化
watch(() => props.itemsPerRow, (newValue) => {
  localItemsPerRow.value = newValue;
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
 * @param type 按钮类型，normal为普通按钮，switch为开关按钮，select为选择按钮，默认normal
 */
const addTool = (id: string, icon: string, label: string, callback?: string, visible: boolean = true, disabled: boolean = false, type: 'normal' | 'switch' | 'select' = 'normal') => {
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
    'debug': '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M20,8 L17,11 L20,14 M4,8 L7,11 L4,14" stroke="currentColor" stroke-width="2" fill="none"/><rect x="8" y="6" width="8" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" stroke-width="2"/><line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" stroke-width="2"/></svg>',
    'showLabels': '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12,21 L12,21 C12,21 18,16 18,10 C18,6.13 15.31,3 12,3 C8.69,3 6,6.13 6,10 C6,16 12,21 12,21 Z" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="10" text-anchor="middle" fill="currentColor" font-size="12" font-weight="bold">T</text><path d="M16,15 L20,19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="19" x2="20" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    'cluster': '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="16" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="16" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="currentColor" stroke-width="1"/></svg>',
    'showMarkers': '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M9,21 L9,21 C9,21 14,17 14,12 C14,9 11.76,6 9,6 C6.24,6 4,9 4,12 C4,17 9,21 9,21 Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="12" r="2" fill="currentColor"/><path d="M20,4 L16,4 M18,2 L18,6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    'showShapes': '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="4" y="4" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="17" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20,4 L16,4 M18,2 L18,6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    'viewType': '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3,9 L21,9" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="14" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13,13 L18,13 M13,16 L18,16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
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
    'debug': '调试',
    'showLabels': '显示标签',
    'cluster': '点聚合',
    'showMarkers': '显示标记点',
    'showShapes': '显示图形',
    'viewType': '地图视图类型'
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
    debug = false,  // 默认不显示调试按钮
    position = false,  // 默认不显示坐标显示按钮
    showLabels = true,  // 默认显示标记点标签
    cluster = false,  // 默认不启用点聚合
    showMarkers = true, // 默认显示标记点
    showShapes = true, // 默认显示绘图形状
    viewType = true // 默认显示地图视图类型
  } = props.options;

  // 先添加视图类型工具
  if (viewType) tools.push({ id: 'viewType', visible: true, type: 'switch', order: 1 });
  
  // 添加绘图工具
  if (circle) tools.push({ id: 'circle', visible: true, type: 'switch', order: 10 });
  if (polygon) tools.push({ id: 'polygon', visible: true, type: 'switch', order: 11 });
  if (rectangle) tools.push({ id: 'rectangle', visible: true, type: 'switch', order: 12 });
  if (polyline) tools.push({ id: 'polyline', visible: true, type: 'switch', order: 13 });
  if (distance) tools.push({ id: 'distance', visible: true, type: 'switch', order: 14 });
  if (marker) tools.push({ id: 'marker', visible: true, type: 'switch', order: 15 });
  
  // 添加显示控制工具
  if (position) tools.push({ id: 'position', visible: true, type: 'switch', order: 20 });
  if (showLabels) tools.push({ id: 'showLabels', visible: true, type: 'switch', order: 21 });
  if (cluster) tools.push({ id: 'cluster', visible: true, type: 'switch', order: 22 });
  if (showMarkers) tools.push({ id: 'showMarkers', visible: true, type: 'switch', order: 23 });
  if (showShapes) tools.push({ id: 'showShapes', visible: true, type: 'switch', order: 24 });
  
  // 添加其他工具
  if (clear) tools.push({ id: 'clear', visible: true, type: 'select', order: 30 });
  if (debug) tools.push({ id: 'debug', visible: true, type: 'switch', order: 40 });

  // 根据order属性排序
  return tools.sort((a, b) => (a.order || 99) - (b.order || 99));
});

// 监听showPosition变化，更新position工具状态
watch(() => props.showPosition, (newValue) => {
  // 如果已经有了position工具，则更新其状态
  setToolState('position', newValue);
});

// 修改处理工具点击的方法
const handleToolClick = (toolId: string) => {
  // 找到工具对象
  const customTool = customTools.value.find(t => t.id === toolId);
  const defaultTool = defaultToolsToShow.value.find(t => t.id === toolId);
  const tool = customTool || defaultTool;

  if (!tool) return;

  // 处理清除工具的特殊确认流程
  if (toolId === 'clear') {
    // 如果是第一次点击清除按钮，显示确认UI
    if (!showClearConfirm.value) {
      showClearConfirm.value = true;

      // 5秒后自动隐藏确认UI
      if (clearConfirmTimer !== null) {
        window.clearTimeout(clearConfirmTimer);
      }

      clearConfirmTimer = window.setTimeout(() => {
        showClearConfirm.value = false;
      }, 5000);

      return; // 不触发点击事件，等待确认
    } else {
      // 如果是确认删除，执行清除操作
      showClearConfirm.value = false;
      if (clearConfirmTimer !== null) {
        window.clearTimeout(clearConfirmTimer);
        clearConfirmTimer = null;
      }
    }
  } else {
    // 其他工具点击时，隐藏清除确认
    showClearConfirm.value = false;
    if (clearConfirmTimer !== null) {
      window.clearTimeout(clearConfirmTimer);
      clearConfirmTimer = null;
    }
  }

  // 先处理特殊工具
  if (toolId === 'marker') {
    // 切换标记面板的显示状态  
    const currentState = switchStates.value[toolId] || false;
    switchStates.value[toolId] = !currentState;
    showMarkerPanel.value = !currentState;
    // 关闭视图类型菜单
    showViewTypeMenu.value = false;
    // 如果打开了标记面板，更新当前选中的工具状态
    if (showMarkerPanel.value) {
      emit('update:modelValue', toolId as ToolType);
    } else {
      // 如果关闭了标记面板，取消选择工具
      emit('update:modelValue', '');
    }

    // 无论是打开还是关闭面板，都触发工具点击事件
    emit('tool-click', toolId as ToolType, tool.callback, !currentState);
    return;
  } else if (toolId === 'viewType') {
    // 切换视图类型菜单的显示状态
    showViewTypeMenu.value = !showViewTypeMenu.value;
    
    // 输出详细调试信息
    info("视图类型菜单点击 - 之前状态: {}, 现在状态: {}, switchState: {}",
         !showViewTypeMenu.value, showViewTypeMenu.value, switchStates.value[toolId]);
    
    // 关闭标记面板
    showMarkerPanel.value = false;
    
    // 重要：确保按钮状态和菜单显示状态同步
    // 无论之前的状态是什么（包括null或undefined），都设置为当前菜单显示状态
    switchStates.value[toolId] = showViewTypeMenu.value;
    
    // 如果打开了视图类型菜单，更新当前选中的工具状态
    if (showViewTypeMenu.value) {
      emit('update:modelValue', toolId as ToolType);
    } else {
      // 如果关闭了视图类型菜单，取消选择工具
      emit('update:modelValue', '');
    }
    
    // 再次输出更新后的状态
    info("视图类型菜单更新后 - 显示状态: {}, switchState: {}", 
         showViewTypeMenu.value, switchStates.value[toolId]);
    
    // 显示地图类型菜单时请求视图类型
    if (showViewTypeMenu.value) {
      // 请求视图类型数据
      emit('request-view-types');
    }
    
    // 触发工具点击事件，带上状态标志位
    emit('tool-click', toolId as ToolType, tool.callback, showViewTypeMenu.value);
    return;
  } else {
    // 点击其他工具时，隐藏标记面板和视图类型菜单
    showMarkerPanel.value = false;
    showViewTypeMenu.value = false;
  }

  // 处理常规工具的点击逻辑
  if (tool.type === 'switch') {
    // 开关类型 - 切换状态
    const currentState = switchStates.value[toolId] || false;
    switchStates.value[toolId] = !currentState;

    // 发出工具点击事件，带上状态
    emit('tool-click', toolId as ToolType, tool.callback, !currentState);
    return;
  } else if (tool.type === 'select') {
    // 选择类型 - 只触发点击事件，不更改状态
    emit('tool-click', toolId as ToolType, tool.callback);
    return;
  }

  // 普通工具 - 切换选择状态
  if (toolValue.value === toolId) {
    // 如果点击的是当前选中的工具，取消选择
      emit('update:modelValue', '');
  } else {
    // 否则选择新工具
    emit('update:modelValue', toolId as ToolType);
  }

  // 触发工具点击事件
  emit('tool-click', toolId as ToolType, tool.callback);
};

/**
 * 处理视图类型切换
 * @param viewType 视图类型
 */
const handleViewTypeChange = (viewType: string) => {
  // 触发视图类型切换事件
  emit('view-type-change', viewType);
  
  // 关闭视图类型菜单
  showViewTypeMenu.value = false;
  currentViewType.value = viewType as MapViewType;
  
  // 重要：确保重置工具状态为初始状态
  // 当选择某个视图类型后，强制重置viewType工具的状态
  // 这是一个关键步骤，它可以破坏可能的状态循环
  switchStates.value['viewType'] = false;
  
  // 设置超短延时来完全清除状态
  setTimeout(() => {
    // 通过少量延时以确保状态完全清除
    switchStates.value['viewType'] = false;
    info("视图类型工具状态已强制重置");
  }, 10);
  
  // 记录当前选中的视图类型
  info("切换地图视图类型为：{}", viewType);
};

/**
 * 是否是激活状态的工具
 * @param toolId 工具ID
 */
const isActiveToolState = (toolId: string) => {
  // 对于视图类型工具，直接使用菜单是否显示来判断
  if (toolId === 'viewType') {
    return showViewTypeMenu.value;
  }
  
  // 获取工具对象
  const customTool = customTools.value.find(t => t.id === toolId);
  const defaultTool = defaultToolsToShow.value.find(t => t.id === toolId);
  const tool = customTool || defaultTool;
  
  // 对于select类型工具，永远返回false，因为它们不需要选中状态
  if (tool?.type === 'select') {
    return false;
  }
  
  // 对于switch类型工具，根据switch状态判断
  if (tool?.type === 'switch') {
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

  const defaultTool = defaultToolsToShow.value.find(t => t.id === id);
  if (defaultTool?.type === 'switch') {
    switchStates.value[id] = active;
    return true;
  }

  return false;
};

// 获取标记类型的所有唯一分类
const markerCategories = computed(() => {
  const categories = markerTypes.value.map(marker => marker.category).filter(Boolean);
  return [...new Set(categories)];
});

// 获取指定分类的标记类型
const getCategoryMarkers = (category: string) => {
  return markerTypes.value.filter(marker => marker.category === category);
};

// 可见的分类
const visibleCategories = computed(() => {
  // 从标记类型和已添加标记点中获取所有分类
  const typesCategories = markerTypes.value.map(marker => marker.category).filter(Boolean);
  const markersCategories = props.markers
    .map(marker => marker.category)
    .filter(Boolean);

  // 合并去重
  return [...new Set([...typesCategories, ...markersCategories])];
});

// 激活的分类过滤器
const activeCategoryFilters = ref<string[]>([]);

// 切换分类过滤
const toggleCategoryFilter = (category: string) => {
  const index = activeCategoryFilters.value.indexOf(category);
  if (index !== -1) {
    activeCategoryFilters.value.splice(index, 1);
  } else {
    activeCategoryFilters.value.push(category);
  }

  emit('category-toggle', category, activeCategoryFilters.value);
};

// 折叠/展开图标 - 保留原始图标定义
const collapseIcon = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M15,6 L9,12 L15,18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const expandIcon = `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M9,6 L15,12 L9,18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

// 根据位置获取对应的图标
const getLeftCollapseIcon = computed(() => collapseIcon);
const getLeftExpandIcon = computed(() => expandIcon);
const getRightCollapseIcon = computed(() => expandIcon); // 右侧使用反向图标
const getRightExpandIcon = computed(() => collapseIcon); // 右侧使用反向图标

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
    // 更新本地值
    localItemsPerRow.value = count;
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
  setItemsPerRow,
  hideMarkerPanel: () => {
    showMarkerPanel.value = false;
  },
  hideViewTypeMenu: () => {
    showViewTypeMenu.value = false;
  },
  setViewTypeOptions: (options: ViewTypeOption[]) => {
    viewTypeOptions.value = options;
  },
  closeViewTypeMenu: () => {
    showViewTypeMenu.value = false;
  }
});

// 选择标记类型
const selectMarker = (marker: MarkerType) => {
  // 触发标记选择事件
  emit('marker-type-selected', marker);

  // 关闭标记面板
  showMarkerPanel.value = false;
};

// 标记面板滑动相关
const markerSlider = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);

// 滚动标记面板
const scrollMarkers = (direction: 'left' | 'right') => {
  if (!markerSlider.value) return;

  const scrollAmount = 120; // 每次滚动的像素数
  const currentScroll = markerSlider.value.scrollLeft;

  if (direction === 'left') {
    markerSlider.value.scrollLeft = Math.max(0, currentScroll - scrollAmount);
  } else {
    markerSlider.value.scrollLeft = currentScroll + scrollAmount;
  }

  // 在下一个刷新周期检查滚动状态
  setTimeout(checkScrollPosition, 100);
};

// 检查滚动位置，更新箭头显示状态
const checkScrollPosition = () => {
  if (!markerSlider.value) return;

  const { scrollLeft, scrollWidth, clientWidth } = markerSlider.value;

  // 是否可以向左滚动
  canScrollLeft.value = scrollLeft > 0;

  // 是否可以向右滚动 (留出一点余量)
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 5;
};

// 监听标记面板的显示状态
watch(() => showMarkerPanel.value, (visible) => {
  if (visible) {
    // 重置滚动位置
    if (markerSlider.value) {
      markerSlider.value.scrollLeft = 0;
    }

    // 延迟执行，确保DOM更新后再检查滚动位置
    setTimeout(checkScrollPosition, 100);
  }
});

// 获取所有标记类型，不区分分类
const getAllMarkers = () => {
  return markerTypes.value;
};

// 监听工具值变化，关闭标记面板和视图类型菜单
watch(() => toolValue.value, (newValue) => {
  // 如果当前工具不是marker，关闭标记面板
  if (newValue !== 'marker') {
    showMarkerPanel.value = false;
  }
  
  // 如果当前工具不是viewType，关闭视图类型菜单
  if (newValue !== 'viewType') {
    showViewTypeMenu.value = false;
  }
});

// 全局工具定义
const globalTools = [
  { id: 'marker', label: '标记点', icon: 'marker', visible: computed(() => !!props.options.marker) },
  { id: 'circle', label: '圆形', icon: 'circle', visible: computed(() => !!props.options.circle) },
  { id: 'polygon', label: '多边形', icon: 'polygon', visible: computed(() => !!props.options.polygon) },
  { id: 'rectangle', label: '矩形', icon: 'rectangle', visible: computed(() => !!props.options.rectangle) },
  { id: 'polyline', label: '折线', icon: 'polyline', visible: computed(() => !!props.options.polyline) },
  { id: 'distance', label: '测距', icon: 'distance', visible: computed(() => !!props.options.distance) },
  { id: 'viewType', label: '视图', icon: 'viewType', type: 'switch', visible: computed(() => true) },
  { id: 'clear', label: '清除', icon: 'clear', type: 'select', visible: computed(() => !!props.options.clear) },
  { id: 'position', label: '位置信息', icon: 'position', type: 'switch', visible: computed(() => !!props.options.position) },
  { id: 'showLabels', label: '显示标签', icon: 'label', type: 'switch', visible: computed(() => !!props.options.showLabels) },
  { id: 'cluster', label: '点聚合', icon: 'cluster', type: 'switch', visible: computed(() => !!props.options.cluster) },
  { id: 'showMarkers', label: '显示标记', icon: 'show-marker', type: 'switch', visible: computed(() => !!props.options.showMarkers), active: true },
  { id: 'showShapes', label: '显示图形', icon: 'show-shape', type: 'switch', visible: computed(() => !!props.options.showShapes), active: true }
];

// 初始化默认视图类型选项
// 注意：这里不再使用computed，而是在组件挂载时或接收到请求时通过setViewTypeOptions方法设置
onMounted(() => {
  // 如果提供了自定义视图类型选项，则使用它
  if (props.supportedViewTypes && props.supportedViewTypes.length > 0) {
    viewTypeOptions.value = props.supportedViewTypes;
  } else {
    // 否则使用默认视图类型选项
    viewTypeOptions.value = [
      {
        value: 'normal',
        label: '标准',
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgODAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiNlOGU4ZTgiLz48cGF0aCBkPSJNMCwwIGgyMCw4MCBoLTIweiIgZmlsbD0iI2RkZGRkZCIvPjxwYXRoIGQ9Ik0wLDgwIGgxMjAsLTgwIGgtMTIweiIgZmlsbD0iI2RkZGRkZCIvPjxwYXRoIGQ9Ik00MCw0MCBoNDAsLTIwIGgtNDB6IiBmaWxsPSIjZmZmZmZmIi8+PHBhdGggZD0iTTU1LDUwIGgxMCwtMTAgaC0xMHoiIGZpbGw9IiM2NmNjZmYiLz48cGF0aCBkPSJNMTAsMjAgaDMwLC0xMCBoLTMweiIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik04MCw2MCBoMzAsLTEwIGgtMzB6IiBmaWxsPSIjZmZmZmZmIi8+PHBhdGggZD0iTTYwLDIwIGg0MCwtMTUgaC00MHoiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4='
      },
      {
        value: 'satellite',
        label: '卫星',
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgODAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiMxYTI4M2EiLz48cGF0aCBkPSJNMCwwIGgyMCw4MCBoLTIweiIgZmlsbD0iIzE1MjIzMCIvPjxwYXRoIGQ9Ik0wLDgwIGgxMjAsLTgwIGgtMTIweiIgZmlsbD0iIzE1MjIzMCIvPjxwYXRoIGQ9Ik00MCw0MCBoNDAsLTIwIGgtNDB6IiBmaWxsPSIjMjczZDVjIi8+PHBhdGggZD0iTTU1LDUwIGgxMCwtMTAgaC0xMHoiIGZpbGw9IiMxNTIyMzAiLz48cGF0aCBkPSJNMTAsMjAgaDMwLC0xMCBoLTMweiIgZmlsbD0iIzI3M2Q1YyIvPjxwYXRoIGQ9Ik04MCw2MCBoMzAsLTEwIGgtMzB6IiBmaWxsPSIjMjczZDVjIi8+PHBhdGggZD0iTTYwLDIwIGg0MCwtMTUgaC00MHoiIGZpbGw9IiMyNzNkNWMiLz48L3N2Zz4='
      },
      {
        value: 'hybrid',
        label: '混合',
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgODAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiMxYTI4M2EiLz48cGF0aCBkPSJNMCwwIGgyMCw4MCBoLTIweiIgZmlsbD0iIzE1MjIzMCIvPjxwYXRoIGQ9Ik0wLDgwIGgxMjAsLTgwIGgtMTIweiIgZmlsbD0iIzE1MjIzMCIvPjxwYXRoIGQ9Ik00MCw0MCBoNDAsLTIwIGgtNDB6IiBmaWxsPSIjMjczZDVjIi8+PHBhdGggZD0iTTU1LDUwIGgxMCwtMTAgaC0xMHoiIGZpbGw9IiMxNTIyMzAiLz48cGF0aCBkPSJNMTAsMjAgaDMwLC0xMCBoLTMweiIgZmlsbD0iIzI3M2Q1YyIvPjxwYXRoIGQ9Ik04MCw2MCBoMzAsLTEwIGgtMzB6IiBmaWxsPSIjMjczZDVjIi8+PHBhdGggZD0iTTYwLDIwIGg0MCwtMTUgaC00MHoiIGZpbGw9IiMyNzNkNWMiLz48cGF0aCBkPSJNMjAsMjAgaDgwLDQwIGgtODB6IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjYiIHN0cm9rZS13aWR0aD0iMC41IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTQwLDEwIHY2MCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utb3BhY2l0eT0iMC42IiBzdHJva2Utd2lkdGg9IjAuNSIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik04MCwxMCB2NjAiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuNiIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMTAsMjAgaDEwMCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utb3BhY2l0eT0iMC42IiBzdHJva2Utd2lkdGg9IjAuNSIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xMCw0MCBoMTAwIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjYiIHN0cm9rZS13aWR0aD0iMC41IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEwLDYwIGgxMDAiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuNiIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiLz48L3N2Zz4='
      },
      {
        value: 'terrain',
        label: '地形',
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgODAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiNlOGU4ZTgiLz48cGF0aCBkPSJNMCwwIGgyMCw4MCBoLTIweiIgZmlsbD0iI2RkZGRkZCIvPjxwYXRoIGQ9Ik0wLDgwIGgxMjAsLTgwIGgtMTIweiIgZmlsbD0iI2RkZGRkZCIvPjxwYXRoIGQ9Ik0zMCw2MCBsMjAsLTMwIDIwLDQwIDMwLC01MCIgc3Ryb2tlPSIjYTZkMTlmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMTAsMjAgaDMwLC0xMCBoLTMweiIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik04MCw2MCBoMzAsLTEwIGgtMzB6IiBmaWxsPSIjZmZmZmZmIi8+PHBhdGggZD0iTTYwLDIwIGg0MCwtMTUgaC00MHoiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNMzUsNTUgaDIwIGExMCwxMCAwIDAsMSAwLDIwIGgtMjAgeiIgZmlsbD0iI2MwZTBiOCIvPjwvc3ZnPg=='
      }
    ];
  }
});

const viewTypeMenuRef = ref<HTMLElement | null>(null);

// 监听地图点击事件以关闭下拉菜单
const closeMenusOnMapClick = () => {
  if (showViewTypeMenu.value) {
    showViewTypeMenu.value = false;
    // 更新按钮状态
    switchStates.value['viewType'] = false;
  }
  if (showMarkerPanel.value) {
    showMarkerPanel.value = false;
  }
};

// 监听文档点击事件，用于关闭打开的菜单
onMounted(() => {
  // 添加统一的文档点击事件处理
  document.addEventListener('click', (event) => {
    // 检查点击是否在下拉菜单或工具栏按钮外
    const target = event.target as HTMLElement;
    const toolbarEl = document.querySelector('.map-toolbar');
    const viewTypeButton = document.querySelector('.tool-btn[data-tool="viewType"]');
    const viewTypeMenuEl = viewTypeMenuRef.value;

    // 检查点击是否发生在视图类型按钮上
    const clickedOnViewTypeButton = viewTypeButton && viewTypeButton.contains(target);
    
    // 检查点击是否发生在视图类型菜单内
    const clickedInViewTypeMenu = viewTypeMenuEl && viewTypeMenuEl.contains(target);
    
    // 如果视图类型菜单打开，且点击既不在视图类型按钮上，也不在菜单内，则关闭菜单
    if (showViewTypeMenu.value && !clickedOnViewTypeButton && !clickedInViewTypeMenu) {
      showViewTypeMenu.value = false;
      // 更新按钮状态
      switchStates.value['viewType'] = false;
      return;
    }
    
    // 如果点击在整个工具栏外部，关闭所有菜单
    if (toolbarEl && !toolbarEl.contains(target)) {
    showViewTypeMenu.value = false;
      showMarkerPanel.value = false;
      // 更新按钮状态
      switchStates.value['viewType'] = false;
    }
  }, { capture: true });
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
  // 由于我们没有保留函数引用，不需要移除特定的事件监听器
});
</script>

<style scoped>
.map-toolbar {
  position: absolute;
  z-index: 400;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top left;
}

.tool-group {
  display: flex;
  flex-direction: column;
}

/* 工具栏头部，包含工具按钮和折叠按钮在同一行 */
.toolbar-header {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  /* 按钮间距 */
  padding: 4px;
  align-items: center;
  max-width: 100vw; /* 防止超出视口 */
}

/* 根据按钮大小调整工具栏宽度 */
.size-small .toolbar-header {
  /* 小尺寸按钮(26px)的工具栏宽度 */
  width: calc(12 * 26px + 11 * 3px + 26px + 10px);
  gap: 3px;
  padding: 3px;
}

.size-default .toolbar-header {
  /* 默认尺寸按钮(32px)的工具栏宽度 */
  width: calc(12 * 32px + 11 * 4px + 32px + 10px);
  gap: 4px;
  padding: 4px;
}

.size-large .toolbar-header {
  /* 大尺寸按钮(38px)的工具栏宽度 */
  width: calc(12 * 38px + 11 * 6px + 38px + 10px);
  gap: 6px;
  padding: 6px;
}

/* 右侧工具栏特殊样式 */
.toolbar-header.right-side {
  justify-content: flex-end; /* 靠右对齐 */
}

/* 右侧位置工具栏的间距调整 */
.size-small .toolbar-header.right-side {
  padding: 3px 2px 3px 3px;
  gap: 2px;
  width: calc(12 * 26px + 11 * 2px + 26px + 10px);
}

.size-default .toolbar-header.right-side {
  padding: 4px 2px 4px 4px;
  gap: 3px;
  width: calc(12 * 32px + 11 * 3px + 32px + 10px);
}

.size-large .toolbar-header.right-side {
  padding: 6px 3px 6px 6px;
  gap: 4px;
  width: calc(12 * 38px + 11 * 4px + 38px + 10px);
}

.tool-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  /* 减小按钮尺寸 */
  height: 30px;
  /* 减小按钮尺寸 */
  border-radius: 4px;
  transition: all 0.2s;
  position: relative;
  color: #666;
  background-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  user-select: none;
}

.tool-btn.confirm-state {
  background-color: #ff4d4f;
  color: white;
  animation: pulse 1.5s infinite;
}

.confirm-badge {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff4d4f;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(255, 77, 79, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
  }
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
  width: 18px;
  /* 减小图标尺寸 */
  height: 18px;
  /* 减小图标尺寸 */
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
  width: 30px;
  /* 与其他按钮保持一致 */
  height: 30px;
  /* 与其他按钮保持一致 */
  margin: 0;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* 分类过滤器样式 */
.category-filter {
  margin-top: 8px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.2s ease-out;
}

.filter-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.category-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 4px;
  gap: 8px;
  transition: all 0.2s ease;
  background-color: rgba(249, 249, 249, 0.8);
}

.category-item:hover {
  background-color: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.06);
}

.category-item.active {
  background-color: rgba(24, 144, 255, 0.1);
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
  right: 0px;
  /* 减少右侧间距 */
}

.map-toolbar.bottom-left {
  bottom: 10px;
  left: 10px;
}

.map-toolbar.bottom-right {
  bottom: 10px;
  right: 0px;
  /* 减少右侧间距 */
}

/* 工具栏布局调整 - 根据位置调整排列方向 */
.map-toolbar.top-right .tool-group {
  flex-direction: column; /* 从上往下 */
  align-items: flex-end; /* 靠右对齐 */
}

.map-toolbar.bottom-left .tool-group {
  flex-direction: column-reverse; /* 从下往上 */
  align-items: flex-start; /* 靠左对齐 */
}

.map-toolbar.bottom-right .tool-group {
  flex-direction: column-reverse; /* 从下往上 */
  align-items: flex-end; /* 靠右对齐 */
}

/* 对应位置的标记面板和分类面板位置 */
.map-toolbar.top-right .marker-panel,
.map-toolbar.top-right .category-filter {
  margin-top: 6px;
  margin-bottom: 0;
}

.map-toolbar.bottom-left .marker-panel,
.map-toolbar.bottom-left .category-filter {
  margin-top: 0;
  margin-bottom: 6px;
}

.map-toolbar.bottom-right .marker-panel,
.map-toolbar.bottom-right .category-filter {
  margin-top: 0;
  margin-bottom: 6px;
}

/* 工具栏容器位置调整 */
.map-toolbar.top-right .toolbar-container {
  align-items: flex-end; /* 靠右对齐 */
}

.map-toolbar.bottom-left .toolbar-container {
  align-items: flex-start; /* 靠左对齐 */
}

.map-toolbar.bottom-right .toolbar-container {
  align-items: flex-end; /* 靠右对齐 */
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

/* 标记选择面板的样式 */
.marker-panel {
  margin-top: 6px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 修改标记项样式，移除底部的名称区域 */
.marker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  margin: 0;
  border-radius: 4px;
  cursor: pointer;
  background-color: rgba(249, 249, 249, 0.8);
  transition: all 0.2s ease;
}

.marker-item:hover {
  background-color: rgba(24, 144, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.marker-icon {
  width: 24px;
  height: 24px;
}

/* 标记图标滑动容器 */
.marker-slider-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
}

.marker-slider {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 3px 0;
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
  gap: 4px;
  min-width: 0;
}

.marker-slider::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari, Opera */
}

/* 媒体查询适配小屏幕 */
@media (max-width: 500px) {
  .marker-item {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }

  .marker-icon {
    width: 22px;
    height: 22px;
  }

  .slider-arrow {
    width: 20px;
    height: 20px;
  }
}

.slider-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  color: #666;
  z-index: 5;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.slider-arrow:hover {
  background-color: #f0f0f0;
  color: #333;
}

.slider-arrow.left {
  margin-right: 4px;
}

.slider-arrow.right {
  margin-left: 4px;
}

/* 添加视图类型下拉菜单 */
.view-type-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
  z-index: 401;
  width: 280px;
}

.dropdown-header {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dropdown-items-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
}

.dropdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  background-color: rgba(249, 249, 249, 0.8);
  width: calc(25% - 5px);
  position: relative;
}

.dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.06);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.item-label {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  margin-top: 3px;
}

/* 视图类型预览图样式 */
.view-preview {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;
}

.view-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 当前激活的视图类型样式 */
.dropdown-item.active-view {
  background-color: rgba(24, 144, 255, 0.1);
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.3);
}

.active-indicator {
  position: absolute;
  right: 3px;
  top: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #1890ff;
  display: block;
}

/* 调试信息区域样式 */
.debug-info {
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  color: #333;
  max-width: 300px;
  z-index: 500;
  position: relative;
}
</style>