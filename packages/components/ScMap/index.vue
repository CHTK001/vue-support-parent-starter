<template>
  <div ref="mapContainer" class="sc-map" :style="{ height: height }">
    <map-toolbar
      ref="mapToolbarRef"
      v-if="showToolbar"
      :toolbar-config="computedToolbarConfig"
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { LatLng } from 'leaflet';
import "leaflet/dist/leaflet.css";
import type { Ref } from "vue";
import CoordinatePanel from './components/CoordinatePanel.vue';
import MapLayerDropdown from './components/MapLayerDropdown.vue';
import MapToolbar from './components/MapToolbar.vue';
import type { CustomMarkerOptions } from './plugin/Marker';
import { Marker } from './plugin/Marker';
import { Measure } from './plugin/Measure';
import type { AddToolOptions, ScMapProps, ToolbarConfig } from './types';
import { LayerType } from './types';
import { DEFAULT_TOOL_ITEMS, MAP_TYPES } from './types/default';
// 导入日志工具
import { error, warn, info } from '@repo/utils';
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
  height: "600px",
  mapType: () => MAP_TYPES,
  layerType: LayerType.NORMAL,
  url: "",
  center: () => [39.92, 116.40],
  zoom: 12,
  dragging: true,
  scrollWheelZoom: true,
  apiKey: "",
  showToolbar: true,
  toolbarConfig: () => ({
    position: "top-left",
    direction: "horizontal",
    itemsPerLine: 4,
    size: 36
  } as ToolbarConfig),
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
const measureTool: Ref<Measure | null> = ref(null); // 测距工具
const markerTool: Ref<Marker | null> = ref(null); // 标记工具
const mapToolbarRef = ref<InstanceType<typeof MapToolbar> | null>(null); // 工具栏组件引用

// 兼容旧版本，将toolbar、toolbarPosition等属性转换为toolbarConfig
const computedToolbarConfig = computed((): ToolbarConfig => {
  // 从props.toolbarConfig复制基础配置
  const config: ToolbarConfig = props.toolbarConfig ? { ...props.toolbarConfig } : {
    position: 'top-left' as const,
    direction: 'horizontal' as const,
    itemsPerLine: 4,
    size: 36,
    items: []
  };

  // 使用props.toolbar覆盖items，如果存在
  if (props.toolbar) {
    config.items = props.toolbar;
  }

  if (!config.items || config.items.length == 0) {
    config.items = DEFAULT_TOOL_ITEMS;
  }

  // 返回合并后的配置
  return config;
});

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
const handleToolClick = (event: { id: string; active: boolean; toggleState?: boolean }): void => {
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
  } else if (event.id === 'toggleMarkers') {
    // 处理显示/隐藏点位按钮
    if (markerTool.value) {
      if (event.toggleState) {
        // 如果切换到了"隐藏"状态
        markerTool.value.hideAllMarkers();
      } else {
        // 如果切换到了"显示"状态
        markerTool.value.showAllMarkers();
      }
    }
  }
};

// 启用绘制点功能
const enableDrawPoint = (): void => {
  if (!mapInstance.value || !markerTool.value) return;
  
  // 激活标记工具
  markerTool.value.activate();
};

// 禁用绘制点功能
const disableDrawPoint = (): void => {
  if (!mapInstance.value || !markerTool.value) return;
  
  // 停用标记工具
  markerTool.value.deactivate();
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
    if (button.querySelector('.toolbar-tooltip')?.innerHTML?.includes('图层类型')) {
      layerSwitchButton = button;
      break;
    }
  }
  
  if (!layerSwitchButton) return;
  
  // 获取按钮的位置和地图容器的位置
  const rect = layerSwitchButton.getBoundingClientRect();
  const mapContainerRect = mapContainer.value?.getBoundingClientRect() || { left: 0, top: 0, right: 0, width: 0, height: 0 };
  
  // 检测工具栏位置以调整下拉框位置
  const toolbarPos = computedToolbarConfig.value.position || 'top-left';
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
  
  try {
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
    info('地图初始化完成');
    // 注册事件监听
    registerMapEvents();
    info('地图事件监听注册完成');
    // 添加瓦片图层
    addTileLayer();
    info('瓦片图层添加完成');
    // 等待地图加载完成后再初始化工具
    mapInstance.value.whenReady(() => {
      // 初始化测距工具
      measureTool.value = new Measure(mapInstance.value);
      info('测距工具初始化完成');
      // 初始化点位工具
      markerTool.value = new Marker(mapInstance.value);
      info('地图工具初始化完成');
    });
  } catch (e) {
    error('初始化地图失败:{}', e);
  }
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
  addToolItem: (options: AddToolOptions) => mapToolbarRef.value && mapToolbarRef.value.addToolItem(options),
  removeTool: () => mapToolbarRef.value && mapToolbarRef.value.removeTool(),
  removeToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.removeToolItem(toolId),
  showToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.showToolItem(toolId),
  hideToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.hideToolItem(toolId),
  showToolbar: () => mapToolbarRef.value && mapToolbarRef.value.showToolbar(),
  hideToolbar: () => mapToolbarRef.value && mapToolbarRef.value.hideToolbar(),
  clearMeasurement,
  getMap: () => mapInstance.value,
  // 添加标记工具相关方法
  getMarkerTool: () => markerTool.value,
  addMarker: (latlng: LatLng, options?: CustomMarkerOptions) => {
    // 如果地图或标记工具未初始化，返回null
    if (!mapInstance.value || !mapInstance.value._container) {
      warn('地图尚未完全初始化');
      return null;
    }
    
    if (!markerTool.value) {
      warn('地图标记工具未初始化');
      return null;
    }
    
    try {
      return markerTool.value.addMarker(latlng, options);
    } catch (e) {
      error('添加标记失败:', e);
      return null;
    }
  },
  removeMarker: (idOrMarker: string | any) => {
    if (!markerTool.value) return false;
    try {
      return markerTool.value.removeMarker(idOrMarker);
    } catch (e) {
      error('移除标记失败:', e);
      return false;
    }
  },
  showGroup: (groupName: string) => {
    if (!markerTool.value) return;
    try {
      markerTool.value.showGroup(groupName);
    } catch (e) {
      error('显示标记组失败:', e);
    }
  },
  hideGroup: (groupName: string) => {
    if (!markerTool.value) return;
    try {
      markerTool.value.hideGroup(groupName);
    } catch (e) {
      error('隐藏标记组失败:', e);
    }
  },
  getMarkersByGroup: (groupName: string) => {
    if (!markerTool.value) return [];
    try {
      return markerTool.value.getMarkersByGroup(groupName);
    } catch (e) {
      error('获取标记组失败:', e);
      return [];
    }
  },
  clearMarkers: () => {
    if (!markerTool.value) return;
    try {
      markerTool.value.clearMarkers();
    } catch (e) {
      error('清除标记失败:', e);
    }
  },
  getMarkersInBounds: (bounds: [[number, number], [number, number]]) => {
    if (!markerTool.value) return [];
    try {
      return markerTool.value.getMarkersInBounds(bounds);
    } catch (e) {
      error('获取区域内标记失败:', e);
      return [];
    }
  },
  hideAllMarkers: () => {
    if (!markerTool.value) return;
    try {
      markerTool.value.hideAllMarkers();
    } catch (e) {
      error('隐藏所有标记失败:', e);
    }
  },
  showAllMarkers: () => {
    if (!markerTool.value) return;
    try {
      markerTool.value.showAllMarkers();
    } catch (e) {
      error('显示所有标记失败:', e);
    }
  }
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