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
import "leaflet-minimap/dist/Control.MiniMap.min.css";
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

// 添加绘制相关状态
let isDrawing = ref(false);
let drawingType = ref<ShapeType | null>(null);
let drawingPoints = ref<LatLng[]>([]);
let drawingLayer = ref<any>(null);
let tempShape = ref<any>(null);

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
  
  // 如果是绘图工具被激活，先停止当前可能正在进行的其他绘图操作
  if (drawToolIds.includes(toolId)) {
    // 停止当前绘制
    stopDrawing();
    
    // 基于工具ID开始新的绘制
    isDrawing.value = true;
    
    if (toolId === 'drawCircle') {
      info('开始绘制圆形');
      drawingType.value = ShapeType.CIRCLE;
      startDrawing(ShapeType.CIRCLE);
    } else if (toolId === 'drawRectangle') {
      info('开始绘制矩形');
      drawingType.value = ShapeType.RECTANGLE;
      startDrawing(ShapeType.RECTANGLE);
    } else if (toolId === 'drawPolygon') {
      info('开始绘制多边形');
      drawingType.value = ShapeType.POLYGON;
      startDrawing(ShapeType.POLYGON);
    } else if (toolId === 'drawPolyline') {
      info('开始绘制线段');
      drawingType.value = ShapeType.POLYLINE;
      startDrawing(ShapeType.POLYLINE);
    }
    
    return;
  }
  
  // 非绘图工具被激活时，停止所有绘图工具
  if (isDrawing.value) {
    stopDrawing();
  }
  
  // 根据工具ID执行相应的激活逻辑
  if (toolId === 'measure' && measureTool.value) {
    measureTool.value.start();
  } else if (toolId === 'drawPoint') {
    enableDrawPoint();
  } else if (toolId === 'coordinate') {
    enableCoordinateMode();
  } else if (toolId === 'layerSwitch') {
    // 图层切换工具激活事件处理
  } else if (toolId === 'overview' && overviewTool.value) {
    // 启用鹰眼控件
    overviewTool.value.enable();
    info('通过工具栏激活鹰眼控件');
  }
};

// 开始绘制
const startDrawing = (type: ShapeType) => {
  if (!mapInstance.value) return;
  
  console.log(`开始绘制: ${type}`);
  
  // 初始化绘制状态
  isDrawing.value = true;
  drawingType.value = type;
  drawingPoints.value = [];
  
  // 创建临时图层（如果不存在）
  if (!drawingLayer.value) {
    drawingLayer.value = L.layerGroup().addTo(mapInstance.value);
  } else {
    drawingLayer.value.clearLayers();
  }
  
  // 设置鼠标为十字光标
  mapInstance.value.getContainer().style.cursor = 'crosshair';
  
  // 禁用双击缩放 - 多重保障方式
  disableMapDblClickZoom();

  if (!mapInstance.value || !isDrawing.value) return; // 再次检查地图实例和状态
  // 添加小延迟，确保地图状态稳定后再绑定事件
  setTimeout(() => {
    console.log('延迟绑定事件');
    
    // 添加地图点击事件
    mapInstance.value.on('click', handleMapClick);
    
    // 添加鼠标移动事件（用于实时预览）
    mapInstance.value.on('mousemove', handleMouseMove);
    
    // 多边形和线段需要双击结束
    if (type === ShapeType.POLYGON || type === ShapeType.POLYLINE) {
      console.log('添加双击事件监听器');
      // 关键：确保双击缩放被禁用
      disableMapDblClickZoom();
      mapInstance.value.on('dblclick', handleMapDblClick);
    }
  }, 100); // 添加100毫秒延迟
};

// 停止绘制
const stopDrawing = () => {
  if (!mapInstance.value) return;
  
  console.log('停止绘制');
  
  // 移除事件监听 - 先移除事件
  mapInstance.value.off('click', handleMapClick);
  mapInstance.value.off('mousemove', handleMouseMove);
  mapInstance.value.off('dblclick', handleMapDblClick);
  
  // 重置绘制状态
  isDrawing.value = false;
  drawingType.value = null;
  drawingPoints.value = [];
  
  // 恢复默认鼠标样式
  mapInstance.value.getContainer().style.cursor = '';
  
  // 延迟恢复双击缩放，确保不会意外触发缩放
  setTimeout(() => {
    enableMapDblClickZoom();
  }, 300);
  
  // 清除临时图层
  if (drawingLayer.value) {
    drawingLayer.value.clearLayers();
  }
  tempShape.value = null;
};

// 处理地图点击事件
const handleMapClick = (e: any) => {
  console.log('地图点击事件', e.latlng);
  
  if (!isDrawing.value || !drawingType.value || !mapInstance.value) return;
  
  // 忽略双击触发的点击
  if (e._stopped) {
    console.log('忽略已停止的点击事件');
    return;
  }
  
  const clickedPoint = e.latlng;
  
  // 使用延迟来防止双击触发单击
  if (drawingType.value === ShapeType.POLYGON || drawingType.value === ShapeType.POLYLINE) {
    // 为多边形和折线添加点击延迟，避免与双击冲突
      // 如果在延迟期间已停止绘制，则不添加点
    if (!isDrawing.value || !drawingType.value) {
      console.log('绘制已停止，不添加点');
      return;
    }
    
    // 检查这个点是否与最后一个点太近（可能是双击的一部分）
    if (drawingPoints.value.length > 0) {
      const lastPoint = drawingPoints.value[drawingPoints.value.length - 1];
      const distance = lastPoint.distanceTo(clickedPoint);
      if (distance < 5) {  // 5像素内的点被视为重复
        console.log('点击位置与上一点太近，可能是双击操作的一部分，忽略');
        return;
      }
    }
    
    drawingPoints.value.push(clickedPoint);
    console.log(`添加${drawingType.value}点`, drawingPoints.value.length);
    updatePreview();
    return;
  }
  
  switch (drawingType.value) {
    case ShapeType.CIRCLE:
      // 圆形需要两次点击
      if (drawingPoints.value.length === 0) {
        // 第一次点击设置圆心
        drawingPoints.value.push(clickedPoint);
        console.log('设置圆心', clickedPoint);
      } else if (drawingPoints.value.length === 1) {
        // 第二次点击完成圆形
        const center = drawingPoints.value[0];
        const radius = center.distanceTo(clickedPoint);
        console.log('完成圆形', radius);
        
        // 创建圆形
        createCircle(center, radius);
        
        // 清空点集合，准备下一次绘制
        drawingPoints.value = [];
        if (drawingLayer.value) {
          drawingLayer.value.clearLayers();
        }
      }
      break;
      
    case ShapeType.RECTANGLE:
      // 矩形需要两次点击
      if (drawingPoints.value.length === 0) {
        // 第一次点击设置第一个角点
        drawingPoints.value.push(clickedPoint);
        console.log('设置矩形第一个角点', clickedPoint);
      } else if (drawingPoints.value.length === 1) {
        // 第二次点击完成矩形
        const bounds = L.latLngBounds(drawingPoints.value[0], clickedPoint);
        console.log('完成矩形', bounds);
        
        // 创建矩形
        createRectangle(bounds);
        
        // 清空点集合，准备下一次绘制
        drawingPoints.value = [];
        if (drawingLayer.value) {
          drawingLayer.value.clearLayers();
        }
      }
      break;
  }
};

// 处理鼠标移动事件
const handleMouseMove = (e: any) => {
  if (!isDrawing.value || !drawingType.value || !mapInstance.value) return;
  
  const currentPoint = e.latlng;
  
  // 根据不同的绘制类型更新临时图形
  switch (drawingType.value) {
    case ShapeType.CIRCLE:
      if (drawingPoints.value.length === 1) {
        // 更新圆形预览
        const center = drawingPoints.value[0];
        const radius = center.distanceTo(currentPoint);
        updateCirclePreview(center, radius);
      }
      break;
      
    case ShapeType.RECTANGLE:
      if (drawingPoints.value.length === 1) {
        // 更新矩形预览
        const bounds = L.latLngBounds(drawingPoints.value[0], currentPoint);
        updateRectanglePreview(bounds);
      }
      break;
      
    case ShapeType.POLYGON:
    case ShapeType.POLYLINE:
      if (drawingPoints.value.length > 0) {
        // 更新多边形或线段预览
        updatePreview(currentPoint);
      }
      break;
  }
};

// 处理地图双击事件
const handleMapDblClick = (e: any) => {
  console.log('地图双击事件触发', e.latlng);
  
  if (!isDrawing.value || !drawingType.value || !mapInstance.value) {
    console.log('不满足绘制条件，忽略双击');
    return;
  }
  
  // 彻底阻止地图默认的双击缩放行为
  // 1. 阻止原始事件
  if (e.originalEvent) {
    e.originalEvent.preventDefault();
    e.originalEvent.stopPropagation();
    e.originalEvent.stopImmediatePropagation();
  }
  
  // 2. 阻止Leaflet事件
  L.DomEvent.stopPropagation(e);
  L.DomEvent.preventDefault(e);
  L.DomEvent.stop(e);
  
  // 3. 标记事件为已停止
  e._stopped = true;
  
  // 确保地图缩放仍然被禁用
  mapInstance.value.doubleClickZoom.disable();
  
  // 只处理多边形和线段的双击
  if (drawingPoints.value.length < 2) {
    console.log('点不足，忽略双击');
    return;
  }
  
  console.log('双击事件处理中，当前点数:', drawingPoints.value.length, '双击位置:', e.latlng);
  
  // 首先确保双击的点被添加到路径中（这是用户想要的最后一个点）
  const doubleClickPoint = e.latlng;
  
  // 复制当前的点集合，以便维持双击之前的路径
  // 我们不再移除最后一个点，而是使用双击位置作为最后一个点
  const finalPoints = [...drawingPoints.value];
  
  // 如果最后一个点与双击点距离很近，替换它；否则添加双击点
  if (finalPoints.length > 0) {
    const lastPoint = finalPoints[finalPoints.length - 1];
    const distance = lastPoint.distanceTo(doubleClickPoint);
    
    if (distance < 10) { // 如果双击点与最后一个点太近，直接使用最后一个点
      console.log('双击点与最后一个点距离太近，使用现有点');
    } else {
      // 双击点与最后一个点距离足够远，添加为新的点
      finalPoints.push(doubleClickPoint);
      console.log('将双击点添加为路径的最后一个点');
    }
  }
  
  // 检查是否有足够的点来创建图形
  if (finalPoints.length < 2) {
    console.log('最终点数不足，无法创建图形');
    return;
  }
  
  console.log('最终使用的点数:', finalPoints.length);
  
  if (drawingType.value === ShapeType.POLYGON) {
    console.log('完成多边形', finalPoints.length, '个点');
    createPolygon(finalPoints);
  } else if (drawingType.value === ShapeType.POLYLINE) {
    console.log('完成线段', finalPoints.length, '个点');
    createPolyline(finalPoints);
  }
  
  // 重置工具栏中的绘制工具按钮状态
  if (mapToolbarRef.value) {
    const tools = mapToolbarRef.value.getTools();
    const updatedTools = tools.map(tool => {
      if ((tool.id === 'drawPolygon' && drawingType.value === ShapeType.POLYGON) || 
          (tool.id === 'drawPolyline' && drawingType.value === ShapeType.POLYLINE)) {
        return { ...tool, active: false };
      }
      return tool;
    });
    mapToolbarRef.value.setTools(updatedTools);
  }
  
  // 防止后续事件冒泡
  setTimeout(() => {
    // 停止绘制 - 通过延迟执行确保事件处理完成后再停止
    stopDrawing();
  }, 50);
  
  // 立即返回false以阻止进一步的事件传播
  return false;
};

// 更新预览
const updatePreview = (currentPoint?: LatLng) => {
  if (!drawingLayer.value || drawingPoints.value.length === 0) return;
  
  // 清除之前的临时图形
  drawingLayer.value.clearLayers();
  
  // 准备点集合
  let points = [...drawingPoints.value];
  if (currentPoint) {
    points.push(currentPoint);
  }
  
  // 根据绘制类型创建临时图形
  if (drawingType.value === ShapeType.POLYLINE) {
    tempShape.value = L.polyline(points, {
      color: '#3388ff',
      weight: 3,
      opacity: 0.8
    }).addTo(drawingLayer.value);
  } else if (drawingType.value === ShapeType.POLYGON) {
    tempShape.value = L.polygon(points, {
      color: '#3388ff',
      weight: 3,
      opacity: 0.8,
      fillColor: '#3388ff',
      fillOpacity: 0.2
    }).addTo(drawingLayer.value);
  }
};

// 更新圆形预览
const updateCirclePreview = (center: LatLng, radius: number) => {
  if (!drawingLayer.value) return;
  
  // 清除之前的临时图形
  drawingLayer.value.clearLayers();
  
  // 创建临时圆形
  tempShape.value = L.circle(center, {
    radius,
    color: '#3388ff',
    weight: 3,
    opacity: 0.8,
    fillColor: '#3388ff',
    fillOpacity: 0.2
  }).addTo(drawingLayer.value);
};

// 更新矩形预览
const updateRectanglePreview = (bounds: any) => {
  if (!drawingLayer.value) return;
  
  // 清除之前的临时图形
  drawingLayer.value.clearLayers();
  
  // 创建临时矩形
  tempShape.value = L.rectangle(bounds, {
    color: '#3388ff',
    weight: 3,
    opacity: 0.8,
    fillColor: '#3388ff',
    fillOpacity: 0.2
  }).addTo(drawingLayer.value);
};

// 创建圆形
const createCircle = (center: LatLng, radius: number) => {
  if (!mapInstance.value) return;
  
  console.log('创建实际圆形', center, radius);
  
  try {
    // 创建圆形
    const circle = L.circle(center, {
      radius,
      color: '#ff4757',
      weight: 3,
      opacity: 0.8,
      fillColor: '#ff4757',
      fillOpacity: 0.2
    }).addTo(mapInstance.value);
    
    console.log('圆形已添加到地图');
  } catch (e) {
    console.error('创建圆形失败:', e);
  }
};

// 创建矩形
const createRectangle = (bounds: any) => {
  if (!mapInstance.value) return;
  
  console.log('创建实际矩形', bounds);
  
  try {
    // 创建矩形
    const rectangle = L.rectangle(bounds, {
      color: '#ff4757',
      weight: 3,
      opacity: 0.8,
      fillColor: '#ff4757',
      fillOpacity: 0.2
    }).addTo(mapInstance.value);
    
    console.log('矩形已添加到地图');
  } catch (e) {
    console.error('创建矩形失败:', e);
  }
};

// 创建多边形
const createPolygon = (points: LatLng[]) => {
  if (!mapInstance.value) return;
  
  console.log('创建实际多边形', points);
  
  try {
    // 创建多边形
    const polygon = L.polygon(points, {
      color: '#ff4757',
      weight: 3,
      opacity: 0.8,
      fillColor: '#ff4757',
      fillOpacity: 0.2
    }).addTo(mapInstance.value);
    
    console.log('多边形已添加到地图');
  } catch (e) {
    console.error('创建多边形失败:', e);
  }
};

// 创建线段
const createPolyline = (points: LatLng[]) => {
  if (!mapInstance.value) return;
  
  console.log('创建实际线段', points);
  
  try {
    // 创建线段
    const polyline = L.polyline(points, {
      color: '#ff4757',
      weight: 3,
      opacity: 0.8
    }).addTo(mapInstance.value);
    
    console.log('线段已添加到地图');
  } catch (e) {
    console.error('创建线段失败:', e);
  }
};

// 处理工具停用事件
const handleToolDeactivated = (toolId: string) => {
  emit('tool-deactivated', toolId);
  
  const drawToolIds = ['drawCircle', 'drawRectangle', 'drawPolygon', 'drawPolyline'];
  
  // 如果是绘图工具被停用
  if (drawToolIds.includes(toolId)) {
    // 停止绘制
    stopDrawing();
    return;
  }
  
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
  } else if (toolId === 'overview' && overviewTool.value) {
    // 禁用鹰眼控件
    overviewTool.value.disable();
    info('通过工具栏停用鹰眼控件');
  }
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
    console.log('动态导入Leaflet');
    try {
      L = (await import("leaflet")).default;
      console.log('Leaflet导入成功:', !!L);
      // 动态导入leaflet-minimap
      await import("leaflet-minimap");
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
  const drawToolIds = ['drawCircle', 'drawRectangle', 'drawPolygon', 'drawPolyline'];
  
  // 如果点击的是绘图工具，且处于非活动状态，需要停用其他绘图工具
  if (drawToolIds.includes(event.id) && event.active && mapToolbarRef.value) {
    // 获取当前工具列表
    const currentTools = mapToolbarRef.value.getTools();
    
    // 更新工具状态，确保其他绘图工具被停用
    const updatedTools = currentTools.map(tool => {
      if (drawToolIds.includes(tool.id) && tool.id !== event.id) {
        return { ...tool, active: false };
      }
      return tool;
    });
    
    // 应用更新后的工具状态
    mapToolbarRef.value.setTools(updatedTools);
    
    // 确保先停止所有绘图工具
    if (shapeTool.value) {
      shapeTool.value.stopDrawing();
    }
  }
  
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
  } else if (event.id === 'overview') {
    // 处理鹰眼开关
    if (overviewTool.value) {
      if (event.active) {
        overviewTool.value.enable();
      } else {
        overviewTool.value.disable();
      }
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
  if (!mapContainer.value) {
    error('地图容器元素不存在');
    return;
  }
  
  try {
    // 创建地图实例
    info('正在创建地图实例...');
    console.log('L对象状态:', !!L);
    console.log('地图容器状态:', !!mapContainer.value);
    
    // 检查L是否包含必要的方法
    console.log('L.map方法是否存在:', typeof L?.map === 'function');
    
    // 创建地图实例前打印容器尺寸
    const containerElement = mapContainer.value;
    if (containerElement) {
      console.log('容器尺寸:', {
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
    console.log('地图实例创建:', !!mapInstance.value);
    
    // 添加一个测试事件监听，检测地图点击是否能正常工作
    if (mapInstance.value) {
      mapInstance.value.once('click', (e: any) => {
        console.log('地图实例化后测试点击事件:', e.latlng);
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
      // 初始化图形绘制工具
      try {
        info('开始初始化图形绘制工具...');
        shapeTool.value = new Shape(mapInstance.value);
        info('图形绘制工具初始化完成');
      } catch (e) {
        error('图形绘制工具初始化失败:', e);
      }
      
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
    
    console.log('地图双击缩放已彻底禁用');
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
      
      console.log('地图双击缩放已恢复');
    }
  } catch (e) {
    console.error('恢复双击缩放失败:', e);
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
      if (!mapInstance.value) return null;
      
      // 生成ID
      const id = options.id || `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      switch (options.type) {
        case ShapeType.CIRCLE:
          if (!options.data?.center || !options.radius) {
            console.error('圆形必须提供中心点和半径');
            return null;
          }
          const center = L.latLng(options.data.center[0], options.data.center[1]);
          createCircle(center, options.radius);
          return id;
          
        case ShapeType.RECTANGLE:
          if (!options.data?.bounds) {
            console.error('矩形必须提供边界');
            return null;
          }
          const bounds = L.latLngBounds(
            L.latLng(options.data.bounds[0][0], options.data.bounds[0][1]),
            L.latLng(options.data.bounds[1][0], options.data.bounds[1][1])
          );
          createRectangle(bounds);
          return id;
          
        case ShapeType.POLYGON:
          if (!options.data?.points || options.data.points.length < 3) {
            console.error('多边形必须提供至少3个点');
            return null;
          }
          const polygonPoints = options.data.points.map((p: number[]) => L.latLng(p[0], p[1]));
          createPolygon(polygonPoints);
          return id;
          
        case ShapeType.POLYLINE:
          if (!options.data?.points || options.data.points.length < 2) {
            console.error('线段必须提供至少2个点');
            return null;
          }
          const linePoints = options.data.points.map((p: number[]) => L.latLng(p[0], p[1]));
          createPolyline(linePoints);
          return id;
          
        default:
          console.error('不支持的形状类型');
          return null;
      }
    } catch (e) {
      console.error('添加图形失败:', e);
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