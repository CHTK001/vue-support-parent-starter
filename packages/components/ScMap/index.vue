<template>
  <div ref="mapContainer" class="sc-map" :style="{ height: height }">
    <map-toolbar
      ref="mapToolbarRef"
      v-if="showToolbar"
      :tools="props.toolbar"
      :position="toolbarPosition"
      :direction="toolbarDirection"
      :items-per-line="toolbarItemsPerLine"
      :size="props.toolbarSize || 36"
      @tool-click="handleToolClick"
      @tool-activated="handleToolActivated"
      @tool-deactivated="handleToolDeactivated"
    />
    <!-- 坐标显示面板 -->
    <coordinate-panel
      :visible="showCoordinatePanel"
      :longitude="currentLng"
      :latitude="currentLat"
    />
    <!-- 图层选择下拉框 -->
    <map-layer-dropdown
      v-if="showLayerDropdown"
      :map-types="props.mapType"
      :current-layer="selectedLayerTypeString"
      :position="layerDropdownPosition"
      :visible="showLayerDropdown"
      :placement="layerDropdownPlacement"
      @select="handleLayerSelect"
      @close="closeLayerDropdown"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: "ScMap"
};
</script>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from "vue";
import type { Ref } from "vue";
import "leaflet/dist/leaflet.css";
import MAP_TYPES, { LayerType } from './types';
import MapToolbar from './components/MapToolbar.vue';
import MapLayerDropdown from './components/MapLayerDropdown.vue';
import CoordinatePanel from './components/CoordinatePanel.vue';
import { MeasureTool } from './utils/MeasureTool';
import { DEFAULT_TOOL_ITEMS } from './types/default';
import IconMap, { MEASURE_ICON, ZOOM_IN_ICON, ZOOM_OUT_ICON, FULL_VIEW_ICON, MARKER_ICON, POLYLINE_ICON, LOCATION_ICON, LAYER_SWITCH_ICON } from './types/icon';
import type { Map as LeafletMap, TileLayer } from 'leaflet';
import type { AddToolOptions, ScMapProps, ToolItem } from './types';
// 导入leaflet类型但动态加载实现
let L: any = null;

// 添加坐标相关状态
const showCoordinatePanel = ref(false);
const currentLat = ref(0);
const currentLng = ref(0);
const coordinateMode = ref(false);

// 图层下拉框相关状态
const showLayerDropdown = ref(false);
const layerDropdownPosition = ref<{
  x: number;
  y: number;
  mapWidth?: number;
  mapHeight?: number;
  buttonWidth?: number;
  buttonHeight?: number;
  isRightSide?: boolean;
  isBottomSide?: boolean;
}>({ x: 0, y: 0 });
const layerDropdownPlacement = ref<'top' | 'bottom'>('bottom');

const props = withDefaults(defineProps<ScMapProps>(), {
  height: "400px",
  mapType: () => MAP_TYPES,
  layerType: LayerType.NORMAL,
  url: "",
  center: () => [39.92, 116.40],
  zoom: 12,
  dragging: true,
  scrollWheelZoom: true,
  apiKey: "",
  showToolbar: true,
  toolbarPosition: "top-left",
  toolbarDirection: "horizontal",
  toolbarItemsPerLine: 4,
  toolbar: () => DEFAULT_TOOL_ITEMS,
});

const selectedLayerTypeString = ref(props.layerType);
// 发出事件
const emit = defineEmits<{
  (e: 'update:layerType', value: string): void;
  (e: 'update:zoom', value: number): void;
  (e: 'update:center', value: [number, number]): void;
  (e: 'update:dragging', value: boolean): void;
  (e: 'tool-activated', toolId: string): void;
  (e: 'tool-deactivated', toolId: string): void;
  (e: 'coordinate-change', latlng: { lat: number, lng: number }): void;
  (e: 'layer-change', layerType: string): void;
}>();

// 计算当前使用的瓦片URL
const tileUrl = computed((): string => {
  // 如果提供了自定义URL，优先使用
  if (props.url) {
    return props.url;
  }
  
  // 否则根据图层类型从mapType中获取
  const currentLayer = props.mapType[props.layerType] || props.mapType.NORMAL;
  return currentLayer.url;
});

// 获取当前图层的attribution
const attribution = computed((): string => {
  if (props.url) {
    return '&copy; Map data';
  }
  
  const currentLayer = props.mapType[props.layerType] || props.mapType.NORMAL;
  return currentLayer.attribution;
});

const mapContainer: Ref<HTMLElement | null> = ref(null);
const mapInstance: Ref<any> = ref(null);
const tileLayer: Ref<any> = ref(null);
const internalZoom = ref(props.zoom); // 内部跟踪的缩放级别
const internalDragging = ref(props.dragging); // 内部跟踪的拖动状态
const measureTool: Ref<MeasureTool | null> = ref(null); // 测距工具
const mapToolbarRef = ref<InstanceType<typeof MapToolbar> | null>(null); // 工具栏组件引用

// 处理工具激活事件
const handleToolActivated = (toolId: string) => {
  emit('tool-activated', toolId);
  
  // 根据工具ID执行相应的激活逻辑
  if (toolId === 'measure' && measureTool.value) {
    measureTool.value.start();
  } else if (toolId === 'drawPoint') {
    enableDrawPoint();
  } else if (toolId === 'coordinate') {
    enableCoordinateMode();
  } else if (toolId === 'layerSwitch') {
    // 图层切换工具激活事件处理
  }
};

// 处理工具停用事件
const handleToolDeactivated = (toolId: string) => {
  emit('tool-deactivated', toolId);
  
  // 根据工具ID执行相应的停用逻辑
  if (toolId === 'measure' && measureTool.value) {
    measureTool.value.stop();
    measureTool.value.clear();
  } else if (toolId === 'drawPoint') {
    disableDrawPoint();
  } else if (toolId === 'coordinate') {
    disableCoordinateMode();
  } else if (toolId === 'layerSwitch') {
    closeLayerDropdown();
  }
};

// 清除测量结果
const clearMeasurement = (): void => {
  if (measureTool.value) {
    measureTool.value.clear();
  }
};

onMounted(async () => {
  // 动态导入leaflet
  if (!L) {
    L = (await import("leaflet")).default;
  }
  
  await nextTick();
  initMap();
});

onUnmounted(() => {
  // 如果坐标模式处于激活状态，先停止它
  if (coordinateMode.value) {
    disableCoordinateMode();
  }
  
  // 销毁地图实例
  if (mapInstance.value) {
    unregisterMapEvents();
    mapInstance.value.remove();
    mapInstance.value = null;
  }
});

// 注册地图事件监听
const registerMapEvents = (): void => {
  if (!mapInstance.value) return;
  
  // 监听地图缩放事件
  mapInstance.value.on('zoomend', () => {
    if (!mapInstance.value) return;
    const newZoom = mapInstance.value.getZoom();
    internalZoom.value = newZoom;
    emit('update:zoom', newZoom);
  });
  
  // 监听地图移动结束事件
  mapInstance.value.on('moveend', () => {
    if (!mapInstance.value) return;
    const center = mapInstance.value.getCenter();
    emit('update:center', [center.lat, center.lng]);
  });
  
  // 监听拖动开始和结束事件，用于检测拖动状态
  mapInstance.value.on('dragend', () => {
    if (!internalDragging.value) {
      internalDragging.value = true;
      emit('update:dragging', true);
    }
  });
};

// 注销地图事件监听
const unregisterMapEvents = (): void => {
  if (!mapInstance.value) return;
  
  mapInstance.value.off('zoomend');
  mapInstance.value.off('moveend');
  mapInstance.value.off('dragend');
};

// 更新拖动状态
const updateDraggingState = (): void => {
  if (!mapInstance.value) return;
  
  if (props.dragging) {
    mapInstance.value.dragging.enable();
  } else {
    mapInstance.value.dragging.disable();
  }
  
  internalDragging.value = props.dragging;
};

// 处理工具点击事件
const handleToolClick = (event: { id: string; active: boolean }): void => {
  if (event.id === 'zoomIn') {
    if (event.active && mapInstance.value) {
      mapInstance.value.zoomIn();
    }
  } else if (event.id === 'zoomOut') {
    if (event.active && mapInstance.value) {
      mapInstance.value.zoomOut();
    }
  } else if (event.id === 'fullView') {
    if (event.active && mapInstance.value) {
      mapInstance.value.setView(props.center, props.zoom);
    }
  } else if (event.id === 'layerSwitch') {
    if (event.active) {
      showLayerDropdownMenu(event);
    }
  }
};

// 启用绘制点功能
const enableDrawPoint = (): void => {
  if (!mapInstance.value) return;
  
  // 为地图添加点击事件，用于添加标记
  mapInstance.value.on('click', addMarkerAtClick);
};

// 禁用绘制点功能
const disableDrawPoint = (): void => {
  if (!mapInstance.value) return;
  
  // 移除点击事件
  mapInstance.value.off('click', addMarkerAtClick);
};

// 在点击位置添加标记
const addMarkerAtClick = (e: any): void => {
  if (!mapInstance.value || !L) return;
  
  const { lat, lng } = e.latlng;
  L.marker([lat, lng]).addTo(mapInstance.value);
};

// 启用坐标模式
const enableCoordinateMode = (): void => {
  if (!mapInstance.value) return;
  
  coordinateMode.value = true;
  showCoordinatePanel.value = true;
  
  // 监听鼠标移动事件，实时更新坐标
  mapInstance.value.on('mousemove', updateCoordinates);
};

// 禁用坐标模式
const disableCoordinateMode = (): void => {
  if (!mapInstance.value) return;
  
  coordinateMode.value = false;
  showCoordinatePanel.value = false;
  
  // 移除鼠标移动事件监听
  mapInstance.value.off('mousemove', updateCoordinates);
};

// 更新坐标显示
const updateCoordinates = (e: any): void => {
  if (!coordinateMode.value) return;
  
  const { lat, lng } = e.latlng;
  currentLat.value = lat;
  currentLng.value = lng;
  
  // 发出坐标变化事件
  emit('coordinate-change', { lat, lng });
};

// 显示图层下拉菜单
const showLayerDropdownMenu = (event: { id: string; active: boolean }): void => {
  // 获取工具栏中图层切换按钮的位置
  if (!mapToolbarRef.value) return;
  
  const toolbarElement = mapToolbarRef.value.$el;
  if (!toolbarElement) return;
  
  // 查找按钮元素
  const buttonElements = toolbarElement.querySelectorAll('.toolbar-item');
  let layerSwitchButton: Element | null = null;
  
  for (let i = 0; i < buttonElements.length; i++) {
    const button = buttonElements[i];
    if (button.getAttribute('title')?.includes('图层类型')) {
      layerSwitchButton = button;
      break;
    }
  }
  
  if (!layerSwitchButton) return;
  
  // 获取按钮的位置和地图容器的位置
  const rect = layerSwitchButton.getBoundingClientRect();
  const mapContainerRect = mapContainer.value?.getBoundingClientRect() || { left: 0, top: 0, right: 0, width: 0, height: 0 };
  
  // 检测工具栏位置以调整下拉框位置
  const toolbarPos = props.toolbarPosition || 'top-left';
  const isRightSide = toolbarPos.includes('right');
  const isBottomSide = toolbarPos.includes('bottom');
  
  // 根据按钮在容器中的位置决定下拉框显示在上方还是下方
  const windowHeight = window.innerHeight;
  const spaceBelow = windowHeight - rect.bottom;
  const spaceAbove = rect.top;
  const neededHeight = Math.min(400, windowHeight * 0.7); // 估计的下拉框高度，最高不超过窗口高度的70%
  
  // 决定显示在上方还是下方
  let placement: 'top' | 'bottom';
  
  if (isBottomSide && spaceAbove > neededHeight) {
    // 如果工具栏在底部且上方空间足够，则显示在上方
    placement = 'top';
  } else if (!isBottomSide && spaceBelow < neededHeight && spaceAbove > neededHeight) {
    // 如果工具栏在顶部但下方空间不足且上方空间足够，则显示在上方
    placement = 'top';
  } else {
    // 否则默认显示在下方
    placement = 'bottom';
  }
  
  // 将位置信息传递给子组件
  const mapWidth = mapContainerRect.width;
  const mapHeight = mapContainerRect.height;
  const buttonX = rect.left - mapContainerRect.left;
  const buttonY = rect.top - mapContainerRect.top;
  const buttonWidth = rect.width;
  const buttonHeight = rect.height;
  
  // 设置下拉框位置并显示
  layerDropdownPosition.value = {
    x: buttonX,
    y: placement === 'top' ? buttonY : buttonY + buttonHeight,
    mapWidth,
    mapHeight,
    buttonWidth,
    buttonHeight,
    isRightSide,
    isBottomSide
  };
  
  layerDropdownPlacement.value = placement;
  showLayerDropdown.value = true;
};

// 关闭图层下拉菜单
const closeLayerDropdown = (): void => {
  showLayerDropdown.value = false;
  
  // 重置图层切换按钮的状态
  if (mapToolbarRef.value) {
    const tools = mapToolbarRef.value.getTools();
    const newTools = tools.map(tool => {
      if (tool.id === 'layerSwitch') {
        return { ...tool, active: false };
      }
      return tool;
    });
    mapToolbarRef.value.setTools(newTools);
  }
};

// 处理图层选择事件
const handleLayerSelect = (layerType: string): void => {
  // 确保layerType是字符串类型
  const layerTypeString = String(layerType);
  
  // 检查该图层类型是否存在于mapType中
  if (layerTypeString && props.mapType[layerTypeString]) {
    emit('update:layerType', layerTypeString);
    emit('layer-change', layerTypeString);

    selectedLayerTypeString.value = layerTypeString;
    // 当图层类型改变时，更新瓦片图层
    if (mapInstance.value && tileLayer.value) {
      tileLayer.value.setUrl(props.mapType[layerTypeString].url);
    }
  }
};


// 初始化地图
const initMap = (): void => {
  if (!mapContainer.value) return;
  
  // 创建地图实例
  mapInstance.value = L.map(mapContainer.value, {
    center: props.center,
    zoom: props.zoom,
    dragging: props.dragging,
    scrollWheelZoom: props.scrollWheelZoom
  });
  
  // 初始化内部状态
  internalZoom.value = props.zoom;
  internalDragging.value = props.dragging;
  
  // 初始化测距工具
  if (mapInstance.value) {
    measureTool.value = new MeasureTool(mapInstance.value);
  }
  
  // 注册事件监听
  registerMapEvents();

  // 添加瓦片图层
  addTileLayer();
};

// 添加瓦片图层
const addTileLayer = (): void => {
  if (!mapInstance.value) return;
  
  // 先移除已有图层
  if (tileLayer.value) {
    mapInstance.value.removeLayer(tileLayer.value);
  }
  
  // 添加新图层
  let url = tileUrl.value;
  if (props.apiKey) {
    url += url.includes('?') ? `&key=${props.apiKey}` : `?key=${props.apiKey}`;
  }
  
  tileLayer.value = L.tileLayer(url, {
    attribution: attribution.value
  }).addTo(mapInstance.value);
};

// 监听图层类型变化
watch(() => props.layerType, () => {
  addTileLayer();
});

// 监听自定义URL变化
watch(() => props.url, () => {
  addTileLayer();
});

// 监听中心点变化
watch(() => props.center, (newVal) => {
  if (mapInstance.value) {
    mapInstance.value.setView(newVal, mapInstance.value.getZoom());
  }
}, { deep: true });

// 监听缩放级别变化
watch(() => props.zoom, (newVal) => {
  if (mapInstance.value && newVal !== internalZoom.value) {
    internalZoom.value = newVal;
    mapInstance.value.setZoom(newVal);
  }
});

// 监听拖动状态变化
watch(() => props.dragging, (newVal) => {
  if (newVal !== internalDragging.value) {
    updateDraggingState();
  }
});

// 监听滚轮缩放状态变化
watch(() => props.scrollWheelZoom, (newVal) => {
  if (!mapInstance.value) return;
  
  if (newVal) {
    mapInstance.value.scrollWheelZoom.enable();
  } else {
    mapInstance.value.scrollWheelZoom.disable();
  }
});

// 导出方法和常量供外部使用
defineExpose({
  MAP_TYPES,
  LayerType,
  addTool: (options: AddToolOptions) => mapToolbarRef.value && mapToolbarRef.value.addToolItem(options),
  removeTool: () => mapToolbarRef.value && mapToolbarRef.value.removeTool(),
  removeToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.removeToolItem(toolId),
  showToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.showToolItem(toolId),
  hideToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.hideToolItem(toolId),
  setToolVisibility: (toolId: string, visible: boolean) => mapToolbarRef.value && mapToolbarRef.value.setToolVisibility(toolId, visible),
  showToolbar: () => mapToolbarRef.value && mapToolbarRef.value.showToolbar(),
  hideToolbar: () => mapToolbarRef.value && mapToolbarRef.value.hideToolbar(),
  clearMeasurement,
  getMap: () => mapInstance.value
});
</script>

<style scoped>
.sc-map {
  width: 100%;
  min-height: 200px;
  position: relative;
}

:deep(.total-distance) {
  background-color: rgba(255, 71, 87, 0.9);
  color: white;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
  font-size: 14px;
  white-space: nowrap;
  text-align: center;
  border: 1px solid #ff2c47;
}

:deep(.segment-distance) {
  background-color: rgba(47, 54, 64, 0.8);
  color: white;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  text-align: center;
}

:deep(.node-distance) {
  background-color: rgba(46, 134, 222, 0.85);
  color: white;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  text-align: center;
  border: 1px solid #2980b9;
}
</style> 