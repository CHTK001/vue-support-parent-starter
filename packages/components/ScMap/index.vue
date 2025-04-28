<template>
  <div ref="mapContainer" class="sc-map" :style="{ height: height }">
    <!-- 工具面板 -->
    <map-toolbar ref="mapToolbarRef" v-if="showToolbar" :toolbar-config="computedToolbarConfig"
      @tool-click="handleToolClick" @tool-activated="handleToolActivated" @tool-deactivated="handleToolDeactivated" />
    <!-- 坐标显示面板 -->
    <coordinate-panel :visible="showCoordinatePanel" :longitude="currentLng" :latitude="currentLat" />
    <!-- 图层选择下拉框 -->
    <map-layer-dropdown :map-types="props.mapType" :current-layer="selectedLayerTypeString"
      :position="layerDropdownPosition" :visible="showLayerDropdown" :placement="layerDropdownPlacement"
      @select="handleLayerSelect" @close="closeLayerDropdown" />
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
import { Overview } from './plugin/Overview';
import type { OverviewOptions } from './plugin/Overview';
import { ShapeType } from './plugin/Shape';
import Shape from "./plugin/Shape";
import type { ShapeOptions } from './plugin/Shape';
import type { AddToolOptions, ScMapProps, ToolbarConfig } from './types';
import { LayerType } from './types';
import { DEFAULT_TOOL_ITEMS, MAP_TYPES } from './types/default';
// 导入日志工具
import { error, warn, info } from '@repo/utils';
// 导入leaflet类型但动态加载实现
let L: any = null;

// 解决TS报错问题，声明CSS模块
declare module "*.css" {
  const content: any;
  export default content;
}

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
  overviewConfig: () => ({
    position: "bottomleft",
    height: 150,
    width: 150,
    zoomLevelOffset: -5,
    zoomAnimation: false,
    toggleDisplay: true,
    minimized: false,
    aimingRectOptions: { color: '#ff7800', weight: 1, interactive: false },
    strings: { hideText: '收起鹰眼', showText: '展开鹰眼' },
    autoActivate: false
  } as OverviewOptions)
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
  (e: 'shape-created', shapeData: any): void;
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
const overviewTool: Ref<Overview | null> = ref(null); // 鹰眼工具
const shapeTool: Ref<Shape | null> = ref(null); // 绘制图形工具
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
  
  const drawToolIds = ['drawCircle', 'drawRectangle', 'drawPolygon', 'drawPolyline'];
  const instantToolIds = ['zoomIn', 'zoomOut', 'fullView']; // 即时执行工具
  
  // 如果是绘图工具被激活
  if (drawToolIds.includes(toolId)) {
    // 如果当前有其他绘图工具正在绘制，先停止
    if (shapeTool.value && shapeTool.value.isDrawing() && 
        (shapeTool.value.getCurrentDrawingType() !== getShapeTypeFromToolId(toolId))) {
      shapeTool.value.cancelDrawing();
    }
    
    // 确保工具栏按钮状态正确
    if (mapToolbarRef.value) {
      const tools = mapToolbarRef.value.getTools();
      const updatedTools = tools.map(tool => {
        // 当前工具激活，其他绘图工具停用
        if (drawToolIds.includes(tool.id)) {
          return { ...tool, active: tool.id === toolId };
        } 
        // 确保即时执行工具按钮不会保持激活状态
        else if (instantToolIds.includes(tool.id)) {
          return { ...tool, active: false };
        }
        return tool;
      });
      mapToolbarRef.value.setTools(updatedTools);
    }
    
    // 如果当前没有正在绘制的图形，则开始新的绘制
    if (shapeTool.value && !shapeTool.value.isDrawing()) {
      if (toolId === 'drawCircle') {
        info('开始绘制圆形');
        shapeTool.value.startDrawing(ShapeType.CIRCLE);
      } else if (toolId === 'drawRectangle') {
        info('开始绘制矩形');
        shapeTool.value.startDrawing(ShapeType.RECTANGLE);
      } else if (toolId === 'drawPolygon') {
        info('开始绘制多边形');
        shapeTool.value.startDrawing(ShapeType.POLYGON);
      } else if (toolId === 'drawPolyline') {
        info('开始绘制线段');
        shapeTool.value.startDrawing(ShapeType.POLYLINE);
      }
    }
    
    return;
  }
  
  // 非绘图工具被激活时，停止所有绘图工具
  if (shapeTool.value && shapeTool.value.isDrawing()) {
    shapeTool.value.cancelDrawing();
    
    // 重置所有绘图工具按钮状态
    if (mapToolbarRef.value) {
      const tools = mapToolbarRef.value.getTools();
      const updatedTools = tools.map(tool => {
        if (drawToolIds.includes(tool.id)) {
          return { ...tool, active: false };
        }
        return tool;
      });
      mapToolbarRef.value.setTools(updatedTools);
    }
  }
  
  // 根据工具ID执行相应的激活逻辑
  if (toolId === 'measure' && measureTool.value) {
    measureTool.value.start();
  } else if (toolId === 'drawPoint') {
    enableDrawPoint();
  } else if (toolId === 'coordinate') {
    enableCoordinateMode();
  } else if (toolId === 'layerSwitch') {
    showLayerDropdown.value = !showLayerDropdown.value;
    if (showLayerDropdown.value) {
      updateLayerDropdownPosition();
    }
  } else if (toolId === 'overview' && overviewTool.value) {
    // 启用鹰眼控件
    overviewTool.value.enable();
    info('通过工具栏激活鹰眼控件');
  } else if (toolId === 'zoomIn' && mapInstance.value) {
    // 放大地图
    mapInstance.value.zoomIn();
    
    // 对于zoomIn这样的即时执行工具，执行后应该重置工具栏按钮状态
    resetInstantToolButtonState('zoomIn');
  } else if (toolId === 'zoomOut' && mapInstance.value) {
    // 缩小地图
    mapInstance.value.zoomOut();
    
    // 对于zoomOut这样的即时执行工具，执行后应该重置工具栏按钮状态
    resetInstantToolButtonState('zoomOut');
  } else if (toolId === 'fullView' && mapInstance.value) {
    // 恢复原始视图
    mapInstance.value.setView(props.center, props.zoom);
    
    // 对于fullView这样的即时执行工具，执行后应该重置工具栏按钮状态
    resetInstantToolButtonState('fullView');
  }
};

// 辅助函数：重置即时工具按钮状态
const resetInstantToolButtonState = (toolId: string): void => {
  if (mapToolbarRef.value) {
    const tools = mapToolbarRef.value.getTools();
    const updatedTools = tools.map(tool => {
      if (tool.id === toolId) {
        return { ...tool, active: false };
      }
      return tool;
    });
    mapToolbarRef.value.setTools(updatedTools);
  }
};

// 辅助函数，根据工具ID获取对应的ShapeType
const getShapeTypeFromToolId = (toolId: string): ShapeType | null => {
  switch (toolId) {
    case 'drawCircle': return ShapeType.CIRCLE;
    case 'drawRectangle': return ShapeType.RECTANGLE;
    case 'drawPolygon': return ShapeType.POLYGON;
    case 'drawPolyline': return ShapeType.POLYLINE;
    default: return null;
  }
};

// 处理工具停用事件
const handleToolDeactivated = (toolId: string) => {
  emit('tool-deactivated', toolId);
  
  const drawToolIds = ['drawCircle', 'drawRectangle', 'drawPolygon', 'drawPolyline'];
  
  // 处理绘图工具的停用
  if (drawToolIds.includes(toolId)) {
    // 用户明确停用绘图工具，停止当前绘制
    if (shapeTool.value && shapeTool.value.isDrawing()) {
      shapeTool.value.cancelDrawing();
      info(`停止绘制: ${toolId}`);
    }
  } else if (toolId === 'measure' && measureTool.value) {
    // 停止测量工具
    measureTool.value.stop();
  } else if (toolId === 'drawPoint') {
    // 停用点绘制模式
    disableDrawPoint();
  } else if (toolId === 'coordinate') {
    // 停用坐标模式
    disableCoordinateMode();
  } else if (toolId === 'layerSwitch') {
    // 关闭图层下拉菜单
    showLayerDropdown.value = false;
  } else if (toolId === 'overview' && overviewTool.value) {
    // 禁用鹰眼控件
    overviewTool.value.disable();
    info('通过工具栏禁用鹰眼控件');
  }
  
  // 其他工具如zoomIn, zoomOut, fullView是即时执行的，不需要特定的停用逻辑
};

// 检查工具栏中是否有激活的鹰眼按钮
const checkOverviewButtonActive = (): boolean => {
  // 检查工具栏配置中是否有鹰眼按钮
  if (!computedToolbarConfig.value || !computedToolbarConfig.value.items) {
    return false;
  }
  
  // 查找ID为'overview'的工具项
  const overviewButton = computedToolbarConfig.value.items.find(item => item.id === 'overview');
  
  // 如果找到了鹰眼按钮并且它是激活状态，返回true
  return !!overviewButton && overviewButton.active === true;
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
    info('动态导入Leaflet');
    try {
      L = (await import("leaflet")).default;
      info('Leaflet导入成功:', !!L);
      
      // 动态导入leaflet-minimap
      try {
        await import("leaflet-minimap");
        info('leaflet-minimap导入成功');
        
        // 尝试加载CSS样式
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet-minimap@3.6.1/dist/Control.MiniMap.min.css';
        document.head.appendChild(link);
      } catch (miniMapError) {
        console.error('导入leaflet-minimap失败:', miniMapError);
      }
    } catch (e) {
      console.error('导入Leaflet失败:', e);
    }
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
  //记录日志
  info(`工具点击事件: ${event.id}, 激活状态: ${event.active}`);
};

// 启用绘制点功能
const enableDrawPoint = (): void => {
  if (!mapInstance.value || !markerTool.value) return;
  
  // 停止其他可能正在进行的绘图操作
  if (shapeTool.value && shapeTool.value.isDrawing()) {
    shapeTool.value.cancelDrawing();
  }
  
  // 设置鼠标为十字光标
  if (mapInstance.value.getContainer()) {
    mapInstance.value.getContainer().style.cursor = 'crosshair';
  }
  
  // 激活标记工具
  markerTool.value.activate();
  
  info('启用添加标记点模式');
};

// 禁用绘制点功能
const disableDrawPoint = (): void => {
  if (!mapInstance.value || !markerTool.value) return;
  
  // 恢复默认鼠标样式
  if (mapInstance.value.getContainer()) {
    mapInstance.value.getContainer().style.cursor = '';
  }
  
  // 停用标记工具
  markerTool.value.deactivate();
  
  info('禁用添加标记点模式');
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


// 关闭图层下拉菜单
const closeLayerDropdown = (): void => {
  showLayerDropdown.value = false;
  
  // 重置图层切换按钮的状态，确保按钮不会保持激活状态
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
  if (!mapContainer.value) {
    error('地图容器元素不存在');
    return;
  }
  
  try {
    // 创建地图实例
    info('正在创建地图实例...');
    info('L对象状态:', !!L);
    info('地图容器状态:', !!mapContainer.value);
    
    // 检查L是否包含必要的方法
    info('L.map方法是否存在:', typeof L?.map === 'function');
    
    // 创建地图实例前打印容器尺寸
    const containerElement = mapContainer.value;
    if (containerElement) {
      info('容器尺寸:', {
        width: containerElement.clientWidth,
        height: containerElement.clientHeight,
        offsetWidth: containerElement.offsetWidth,
        offsetHeight: containerElement.offsetHeight
      });
    }
    
    mapInstance.value = L.map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      dragging: props.dragging,
      scrollWheelZoom: props.scrollWheelZoom,
      zoomControl: false, // 禁用默认的缩放控件
      attributionControl: false
    });
    
    // 检查地图实例是否创建成功
    info('地图实例创建:', !!mapInstance.value);
    
    // 添加一个测试事件监听，检测地图点击是否能正常工作
    if (mapInstance.value) {
      mapInstance.value.once('click', (e: any) => {
        info('地图实例化后测试点击事件:', e.latlng);
      });
    }
    
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
      info('地图准备就绪，开始初始化工具...');
      // 初始化测距工具
      measureTool.value = new Measure(mapInstance.value);
      info('测距工具初始化完成');
      // 初始化点位工具
      markerTool.value = new Marker(mapInstance.value);
      info('标记工具初始化完成');
      // 初始化鹰眼控件
      overviewTool.value = new Overview(mapInstance.value, props.overviewConfig);
      info('鹰眼控件初始化完成');
      
      // 初始化绘图工具
      initShapeTool();
      
      // 检查工具栏中是否有激活的鹰眼按钮
      const shouldActivateOverview = checkOverviewButtonActive();
      
      // 根据工具栏中鹰眼按钮的状态决定是否激活鹰眼控件
      if (shouldActivateOverview) {
        overviewTool.value.enable();
        info('鹰眼控件根据工具栏鹰眼按钮状态激活');
      } else if (props.overviewConfig && props.overviewConfig.autoActivate) {
        // 如果工具栏中没有鹰眼按钮或未激活，但配置了自动激活，则激活鹰眼控件
        overviewTool.value.enable();
        info('鹰眼控件根据配置自动激活');
      } else {
        info('鹰眼控件未激活，等待用户手动激活');
      }
    });
  } catch (e) {
    console.error('初始化地图失败:', e);
    error('初始化地图失败:', e);
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

// 彻底禁用地图双击缩放
const disableMapDblClickZoom = () => {
  if (!mapInstance.value) return;
  try {
    // 方法1：标准禁用方法
    mapInstance.value.doubleClickZoom.disable();
    
    // 方法2：从地图处理程序中移除双击事件
    if (mapInstance.value._handlers) {
      const dblClickHandlers = mapInstance.value._handlers.filter(
        (h: any) => h.type === 'dblclick'
      );
      dblClickHandlers.forEach((h: any) => h.disable());
    }
    
    // 方法3：禁用双击相关选项
    mapInstance.value.options.doubleClickZoom = false;
    
    info('地图双击缩放已彻底禁用');
  } catch (e) {
    console.error('禁用双击缩放失败:', e);
  }
};

// 恢复地图双击缩放
const enableMapDblClickZoom = () => {
  if (!mapInstance.value) return;
  try {
    // 只有在用户配置允许滚轮缩放时才恢复
    if (props.scrollWheelZoom) {
      // 方法1：标准启用方法
      mapInstance.value.doubleClickZoom.enable();
      
      // 方法2：启用处理程序
      if (mapInstance.value._handlers) {
        const dblClickHandlers = mapInstance.value._handlers.filter(
          (h: any) => h.type === 'dblclick'
        );
        dblClickHandlers.forEach((h: any) => h.enable());
      }
      
      // 方法3：启用选项
      mapInstance.value.options.doubleClickZoom = true;
      
      info('地图双击缩放已恢复');
    }
  } catch (e) {
    console.error('恢复双击缩放失败:', e);
  }
};

// 等待地图加载完成后初始化各种工具
watch(() => mapInstance.value, (newVal) => {
  if (newVal) {
    info('地图实例已加载，设置监听器和初始工具');
    
    // 初始化各种工具
    initializeAfterMapLoaded();
    
    // 监听地图事件
    newVal.on('moveend', handleMapMoveEnd);
    newVal.on('zoomend', handleMapZoomEnd);
    newVal.on('mousemove', handleCoordinateChange);
    
    // 设置初始图层
    setLayer(selectedLayerTypeString.value);
    
    // 添加比例尺控件
    L.control.scale({
      imperial: false,
      position: 'bottomleft'
    }).addTo(newVal);
  }
}, { immediate: true });

// 在初始化绘图工具函数中调用扩展方法
const initShapeTool = () => {
  if (!mapInstance.value) return;
  
  // 创建绘图工具实例
  try {
    shapeTool.value = new Shape(mapInstance.value);
    
    // 添加绘图事件监听
    if (shapeTool.value) {
      // 绘图开始事件
      shapeTool.value.on('drawing-start', (data) => {
        info('绘制开始:', data);
        
        // 确保其他工具被停用
        if (markerTool.value) {
          disableDrawPoint();
        }
        
        if (coordinateMode.value) {
          disableCoordinateMode();
        }
      });
      
      // 绘图结束事件
      shapeTool.value.on('drawing-end', (data) => {
        info('绘制结束:', data);
        
        // 不再在此处重置工具栏按钮状态，保持工具激活状态
        // 工具将保持激活，直到用户手动停用或激活另一个工具
      });
      
      // 绘图取消事件
      shapeTool.value.on('drawing-cancel', () => {
        info('绘制已取消');
        
        // 重置工具栏中的所有绘制工具按钮状态
        if (mapToolbarRef.value) {
          const tools = mapToolbarRef.value.getTools();
          const updatedTools = tools.map(tool => {
            if (['drawCircle', 'drawRectangle', 'drawPolygon', 'drawPolyline'].includes(tool.id)) {
              return { ...tool, active: false };
            }
            return tool;
          });
          mapToolbarRef.value.setTools(updatedTools);
        }
      });
      
      // 图形创建事件
      shapeTool.value.on('shape-created', (shapeData) => {
        info('图形已创建:', shapeData);
        emit('shape-created', shapeData);
        
        // 不再重置工具栏状态，让工具保持激活
        // 下一次绘制会在handleMapClick或handleMapDblClick中自动开始
      });
      
      info('绘图工具初始化和事件监听设置完成');
    }
  } catch (e) {
    error('初始化绘图工具失败:', e);
  }
};

// 在地图加载完成后初始化各种工具
const initializeAfterMapLoaded = () => {
  if (!mapInstance.value) return;
  
  // 初始化测距工具
  initMeasureTool();
  
  // 初始化标记工具
  initMarkerTool();
  
  // 初始化绘图工具
  initShapeTool();
  
  // 初始化鹰眼控件（如果配置了）
  if (props.overviewConfig && props.overviewConfig.autoActivate) {
    initOverviewTool();
  }
  
  // 其他初始化...
};

// 处理地图移动结束事件
const handleMapMoveEnd = (e: any) => {
  // 获取新的中心点
  if (mapInstance.value) {
    const center = mapInstance.value.getCenter();
    // 触发中心点更新事件
    emit('update:center', [center.lat, center.lng]);
  }
};

// 处理地图缩放结束事件
const handleMapZoomEnd = (e: any) => {
  // 获取新的缩放级别
  if (mapInstance.value) {
    const zoom = mapInstance.value.getZoom();
    internalZoom.value = zoom;
    // 触发缩放级别更新事件
    emit('update:zoom', zoom);
  }
};

// 处理坐标变化事件
const handleCoordinateChange = (e: any) => {
  if (!mapInstance.value || !coordinateMode.value) return;
  
  // 更新坐标值
  currentLat.value = e.latlng.lat;
  currentLng.value = e.latlng.lng;
  
  // 触发坐标变化事件
  emit('coordinate-change', { lat: e.latlng.lat, lng: e.latlng.lng });
};

// 设置地图图层
const setLayer = (layerType: string) => {
  if (!mapInstance.value) return;
  
  info(`设置地图图层: ${layerType}`);
  
  // 获取图层配置
  const layerConfig = props.mapType[layerType] || props.mapType.NORMAL;
  
  // 移除现有图层
  if (tileLayer.value) {
    mapInstance.value.removeLayer(tileLayer.value);
  }
  
  // 创建新图层
  tileLayer.value = L.tileLayer(layerConfig.url, {
    attribution: layerConfig.attribution,
    maxZoom: 18
  }).addTo(mapInstance.value);
  
  // 更新当前图层类型
  selectedLayerTypeString.value = layerType;
  
  // 触发图层变化事件
  emit('update:layerType', layerType);
  emit('layer-change', layerType);
};

// 更新图层下拉菜单位置
const updateLayerDropdownPosition = () => {
  if (!mapInstance.value || !mapToolbarRef.value) return;
  
  const container = mapInstance.value.getContainer();
  // 找到工具栏中的图层切换按钮
  const tools = mapToolbarRef.value.getTools();
  const layerSwitchToolIndex = tools.findIndex(tool => tool.id === 'layerSwitch');
  
  if (layerSwitchToolIndex === -1 || !container) return;
  
  // 在DOM中查找与该工具ID对应的按钮元素
  const toolItems = document.querySelectorAll('.toolbar-item');
  let buttonEl: HTMLElement | null = null;
  
  // 确保索引在范围内
  if (layerSwitchToolIndex >= 0 && layerSwitchToolIndex < toolItems.length) {
    buttonEl = toolItems[layerSwitchToolIndex] as HTMLElement;
  }
  
  if (container && buttonEl) {
    const rect = buttonEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // 根据按钮位置决定下拉框的展开方向
    layerDropdownPlacement.value = rect.top > containerRect.height / 2 ? 'top' : 'bottom';
    
    // 将位置信息传递给子组件
    const mapWidth = containerRect.width;
    const mapHeight = containerRect.height;
    const buttonX = rect.left - containerRect.left;
    const buttonY = rect.top - containerRect.top;
    const buttonWidth = rect.width;
    const buttonHeight = rect.height;
    
    // 设置下拉框位置并显示
    layerDropdownPosition.value = {
      x: buttonX,
      y: layerDropdownPlacement.value === 'top' ? buttonY : buttonY + buttonHeight,
      mapWidth,
      mapHeight,
      buttonWidth,
      buttonHeight,
      isRightSide: rect.left > containerRect.width / 2,
      isBottomSide: rect.top > containerRect.height / 2
    };
    
    showLayerDropdown.value = true;
  }
};

// 初始化测距工具
const initMeasureTool = () => {
  if (!mapInstance.value) return;
  
  // 实例化测距工具
  measureTool.value = new Measure(mapInstance.value);
};

// 初始化标记工具
const initMarkerTool = () => {
  if (!mapInstance.value) return;
  
  // 实例化标记工具
  markerTool.value = new Marker(mapInstance.value);
};

// 初始化鹰眼控件
const initOverviewTool = () => {
  if (!mapInstance.value) return;
  
  // 实例化鹰眼控件并配置
  overviewTool.value = new Overview(mapInstance.value, props.overviewConfig);
  
  // 如果配置了自动激活，则启用鹰眼
  if (props.overviewConfig && props.overviewConfig.autoActivate) {
    overviewTool.value.enable();
  }
};

// 导出方法和常量供外部使用
defineExpose({
  MAP_TYPES,
  LayerType,
  ShapeType,
  addToolItem: (options: AddToolOptions) => mapToolbarRef.value && mapToolbarRef.value.addToolItem(options),
  removeTool: () => mapToolbarRef.value && mapToolbarRef.value.removeTool(),
  removeToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.removeToolItem(toolId),
  showToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.showToolItem(toolId),
  hideToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.hideToolItem(toolId),
  showToolbar: () => mapToolbarRef.value && mapToolbarRef.value.showToolbar(),
  hideToolbar: () => mapToolbarRef.value && mapToolbarRef.value.hideToolbar(),
  clearMeasurement,
  getMap: () => mapInstance.value,
  // 添加鹰眼控件相关方法
  getOverviewTool: () => overviewTool.value,
  enableOverview: (options?: Partial<OverviewOptions>) => {
    if (!overviewTool.value) return;
    if (options) {
      overviewTool.value.updateOptions(options);
    }
    overviewTool.value.enable();
  },
  disableOverview: () => {
    if (!overviewTool.value) return;
    overviewTool.value.disable();
  },
  toggleOverview: () => {
    if (!overviewTool.value) return;
    overviewTool.value.toggle();
  },
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
  },
  // 添加图形 - 直接实现
  addShape: (options: ShapeOptions): string | null => {
    try {
      if (!mapInstance.value || !shapeTool.value) return null;
      
      // 生成ID
      const id = options.id || `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      switch (options.type) {
        case ShapeType.CIRCLE:
          if (!options.data?.center || !options.radius) {
            error('圆形必须提供中心点和半径');
            return null;
          }
          const center = L.latLng(options.data.center[0], options.data.center[1]);
          shapeTool.value.createCircle(center, options.radius);
          return id;
          
        case ShapeType.RECTANGLE:
          if (!options.data?.bounds) {
            error('矩形必须提供边界');
            return null;
          }
          const sw = L.latLng(options.data.bounds[0][0], options.data.bounds[0][1]);
          const ne = L.latLng(options.data.bounds[1][0], options.data.bounds[1][1]);
          shapeTool.value.createRectangle(sw, ne);
          return id;
          
        case ShapeType.POLYGON:
          if (!options.data?.points || options.data.points.length < 3) {
            error('多边形必须提供至少3个点');
            return null;
          }
          const polygonPoints = options.data.points.map((p: number[]) => L.latLng(p[0], p[1]));
          shapeTool.value.createPolygon(polygonPoints);
          return id;
          
        case ShapeType.POLYLINE:
          if (!options.data?.points || options.data.points.length < 2) {
            error('线段必须提供至少2个点');
            return null;
          }
          const linePoints = options.data.points.map((p: number[]) => L.latLng(p[0], p[1]));
          shapeTool.value.createPolyline(linePoints);
          return id;
          
        default:
          error('不支持的形状类型');
          return null;
      }
    } catch (e) {
      error('添加图形失败:', e);
      return null;
    }
  },
  // 简化的接口 - 返回true表示操作成功
  removeShape: () => true,
  hideShape: () => true,
  showShape: () => true,
  hideAllShapes: () => {},
  showAllShapes: () => {},
  clearShapes: () => {},
  getShapeDetails: () => null,
  updateShapeStyle: () => true
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

/* 鹰眼控件样式 */
:deep(.leaflet-control-minimap) {
  border: solid rgba(255, 255, 255, 0.7) 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  background: #f8f8f8;
  transition: all 0.3s ease;
}

:deep(.leaflet-control-minimap a) {
  background-color: rgba(255, 255, 255, 0.75) !important; /* 恢复背景色 */
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 3px !important; /* 恢复圆角 */
  cursor: pointer;
  border: none !important; /* 确保没有边框 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important; /* 恢复阴影 */
  transform-origin: center;
  overflow: visible !important;
}

:deep(.leaflet-control-minimap.minimized) {
  width: 30px !important; /* 还原最小化尺寸 */
  height: 30px !important;
  z-index: 100;
  border-radius: 4px;
  overflow: visible !important; /* 允许内容溢出 */
  padding: 0;
  border-width: 2px;
  transition: all 0.3s ease;
}

:deep(.leaflet-control-minimap-toggle-display) {
  height: 18px !important;
  width: 18px !important;
}
</style> 