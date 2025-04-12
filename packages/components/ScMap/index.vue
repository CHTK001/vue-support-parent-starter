<template>
  <div class="sc-map-container" :style="{ height: height, width: width }">
    <div v-if="loading" class="sc-map-loading">
      <div class="is-loading">
        <i class="el-icon-loading"></i>
      </div>
      <span>地图加载中...</span>
    </div>
    <component
      v-if="!loading && currentMapComponent"
      :is="currentMapComponent"
      ref="mapRef"
      v-bind="mapProps"
      @map-loaded="onMapLoaded"
      @marker-click="onMarkerClick"
      @map-click="onMapClick"
      @zoom-changed="onZoomChanged"
      @center-changed="onCenterChanged"
      @bounds-changed="onBoundsChanged"
      @shape-created="onShapeCreated"
      @shape-click="onShapeClick"
      @shape-mouseover="onShapeMouseover"
      @shape-mouseout="onShapeMouseout"
      @shape-deleted="onShapeDeleted"
      @cluster-click="onClusterClick"
      @distance-result="onDistanceResult"
      @marker-created="onMarkerCreated"
    >
    </component>
    
    <!-- 添加统一的工具面板组件 -->
    <MapToolbar
      ref="toolbarRef"
      v-model="currentTool"
      :show="drawingControl"
      :position="toolsPosition"
      :collapsed="isToolsCollapsed"
      :options="enhancedToolsOptions"
      :items-per-row="toolsPerRow"
      :button-size="toolsButtonSize"
      @tool-click="handleToolClick"
      @toggle-collapse="toggleToolbar"
      @debug-toggle="toggleDebugPanel"
    >
    </MapToolbar>
    
    <!-- 测距结果显示 -->
    <div v-if="distanceResult && currentTool === 'distance'" class="distance-result">
      <div class="distance-label">距离: {{ formatDistance(distanceResult.distance) }}</div>
      <div class="distance-close" @click="clearDistance">×</div>
    </div>
    
    <!-- 添加统一的鼠标位置组件 -->
    <MousePosition
      :show="showMousePosition"
      :position="mousePosition"
      :format="mousePositionFormat"
      :precision="6"
    />
    
    <!-- 调试面板 -->
    <DebugPanel
      ref="debugPanelRef"
      :show="showDebugPanel"
      :map-position="toolsPosition"
      :map-type="props.type"
      @close="showDebugPanel = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, shallowRef, nextTick } from 'vue';
import { useScriptLoader } from './hooks/useScriptLoader';
import { MapType, MapViewType, MapOptions, Marker, OfflineMapConfig, ToolsOptions, ClusterOptions, ToolType, ShapeStyle, TrackAnimationOptions, DistanceResultEvent } from './types';
import AMap from './layout/AMap.vue';
import TMap from './layout/TMap.vue';
import MapToolbar from './components/MapToolbar.vue';
import MousePosition from './components/MousePosition.vue';
import DebugPanel from './components/DebugPanel.vue';

// 声明window类型
declare global {
  interface Window {
    initBMap: () => void;
  }
}

// 全局地图加载状态
const isGlobalScriptLoaded = {
  amap: false,
  bmap: false,
  gmap: false,
  tmap: false,
  offline: false
};

const props = defineProps({
  // 地图类型：高德(amap)、百度(bmap)、谷歌(gmap)、天地图(tmap)、离线(offline)
  type: {
    type: String as () => MapType,
    default: 'amap'
  },
  // 地图API密钥
  apiKey: {
    type: String,
    default: ''
  },
  // 中心点
  center: {
    type: Array as unknown as () => [number, number],
    default: () => [116.397428, 39.90923] // 默认北京中心
  },
  // 缩放级别
  zoom: {
    type: Number,
    default: 11
  },
  // 标记点
  markers: {
    type: Array as () => Marker[],
    default: () => []
  },
  // 地图高度
  height: {
    type: String,
    default: '500px'
  },
  // 地图宽度
  width: {
    type: String,
    default: '100%'
  },
  // 是否显示绘图工具控件
  drawingControl: {
    type: Boolean,
    default: false
  },
  // 工具控制选项
  toolsOptions: {
    type: Object as () => ToolsOptions,
    default: () => ({
      circle: true,
      polygon: true,
      rectangle: true,
      polyline: true,
      distance: true,
      marker: true,
      clear: true,
      position: true
    })
  },
  // 工具栏位置
  toolsPosition: {
    type: String,
    default: 'left-top', // 'left-top', 'right-top', 'left-bottom', 'right-bottom'
    validator: (value: string) => ['left-top', 'right-top', 'left-bottom', 'right-bottom'].includes(value)
  },
  // 工具栏是否折叠
  toolsCollapsed: {
    type: Boolean,
    default: false
  },
  // 每行显示工具数量
  toolsPerRow: {
    type: Number,
    default: 12
  },
  // 是否允许拖动
  draggable: {
    type: Boolean,
    default: true
  },
  // 是否允许滚轮缩放
  scrollWheel: {
    type: Boolean,
    default: true
  },
  // 地图样式
  mapStyle: {
    type: String,
    default: ''
  },
  // 地图视图类型
  viewType: {
    type: String as () => MapViewType,
    default: 'normal'
  },
  // 是否开启聚合
  enableCluster: {
    type: Boolean,
    default: false
  },
  // 标记点聚合配置
  clusterOptions: {
    type: Object as () => ClusterOptions,
    default: () => ({
      radius: 80,
      minClusterSize: 2,
      gridSize: 60,
      maxZoom: 18
    })
  },
  // 离线地图配置
  offlineConfig: {
    type: Object as () => OfflineMapConfig,
    default: () => ({
      tileUrlTemplate: '/tiles/{z}/{x}/{y}.png',
      minZoom: 3,
      maxZoom: 18,
      attribution: '© 离线地图'
    })
  },
  // 初始多边形形状
  initialShapes: {
    type: Array,
    default: () => []
  },
  // 工具按钮大小
  toolsButtonSize: {
    type: String as () => 'small' | 'default' | 'large',
    default: 'default'
  }
});

const emit = defineEmits([
  'map-loaded', 
  'marker-click', 
  'map-click', 
  'zoom-changed',
  'center-changed',
  'bounds-changed',
  'shape-created',
  'shape-click',
  'shape-mouseover',
  'shape-mouseout',
  'shape-deleted',
  'cluster-click', 
  'distance-result',
  'track-animation-step',
  'track-animation-complete',
  'marker-created'
]);

const mapRef = ref<any>(null);
const loading = ref(true);
const toolbarRef = ref<any>(null);

// 脚本加载钩子
const { loadScript, scriptLoaded, scriptError } = useScriptLoader();

// 获取地图对应的脚本URL
const getMapScriptUrl = computed(() => {
  switch (props.type) {
    case 'amap':
      return `https://webapi.amap.com/maps?v=2.0&key=${props.apiKey}&plugin=AMap.MarkerClusterer,AMap.MouseTool,AMap.PolyEditor,AMap.CircleEditor,AMap.RectangleEditor,AMap.ElasticMarker`;
    case 'bmap':
      return `https://api.map.baidu.com/api?v=3.0&ak=${props.apiKey}&callback=initBMap&s=1`;
    case 'gmap':
      return `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&libraries=drawing,geometry`;
    case 'tmap':
      return `https://api.tianditu.gov.cn/api?v=4.0&tk=${props.apiKey}&plugins=tools,edit`;
    case 'offline':
      // 离线地图使用Leaflet
      return `https://unpkg.com/leaflet@1.7.1/dist/leaflet.js`;
    default:
      return `https://webapi.amap.com/maps?v=2.0&key=${props.apiKey}&plugin=AMap.MarkerClusterer,AMap.MouseTool,AMap.PolyEditor,AMap.CircleEditor,AMap.RectangleEditor,AMap.ElasticMarker`;
  }
});

// 当前地图组件
const currentMapComponent = shallowRef<any>(null);

const currentTool = ref<ToolType | ''>('');
const distanceResult = ref<DistanceResultEvent | null>(null);
const isToolsCollapsed = ref(false);
const showMousePosition = ref(props.toolsOptions.position);
const mousePosition = ref<[number, number]>([0, 0]);
const mousePositionFormat = ref<'decimal' | 'dms' | 'utm'>('decimal');

// 地图组件属性
const mapProps = computed(() => {
  const baseProps = {
    apiKey: props.apiKey,
    center: props.center,
    zoom: props.zoom,
    markers: props.markers,
    height: props.height,
    width: props.width,
    draggable: props.draggable,
    scrollWheel: props.scrollWheel,
    mapStyle: props.mapStyle,
    viewType: props.viewType,
    initialShapes: props.initialShapes,
    enableCluster: props.enableCluster,
    clusterOptions: {
      ...props.clusterOptions,
      enable: props.enableCluster
    },
  };

  return baseProps;
});

// 工具配置增加debug选项
const enhancedToolsOptions = computed(() => ({
  ...props.toolsOptions,
  debug: true // 启用调试按钮
}));

// 加载地图脚本
const loadMapScript = async () => {
  loading.value = true;
  
  // 检查是否已加载
  if (isGlobalScriptLoaded[props.type]) {
    initMap();
    return;
  }
  
  try {
    // 离线地图需要加载Leaflet样式
    if (props.type === 'offline' && !isGlobalScriptLoaded.offline) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      document.head.appendChild(link);
    }
      
    // 加载地图脚本
    await loadScript(getMapScriptUrl.value);
    isGlobalScriptLoaded[props.type] = true;
    
    // 百度地图需要特殊处理
    if (props.type === 'bmap') {
      window.initBMap = () => {
        isGlobalScriptLoaded.bmap = true;
        initMap();
      };
    } else {
      initMap();
    }
  } catch (error) {
    console.error('地图脚本加载失败:', error);
    loading.value = false;
  }
};

// 初始化地图
const initMap = () => {
  // 根据地图类型选择组件
  switch (props.type) {
    case 'amap':
      currentMapComponent.value = AMap;
      break;
    case 'bmap':
       console.warn('暂不支持百度地图');
      break;
    case 'tmap':
      currentMapComponent.value = TMap;
      break;
    case 'gmap':
      // 谷歌地图暂不支持
      console.warn('暂不支持谷歌地图');
      break;
    case 'offline':
      // 离线地图暂不支持
      console.warn('暂不支持离线地图');
      break;
    default:
      currentMapComponent.value = AMap;
  }
  
  loading.value = false;
};

// 新增调试面板相关状态
const debugPanelRef = ref<any>(null);
const showDebugPanel = ref(false);

// 切换调试面板
const toggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value;
};

// 记录调试日志
const logEvent = (type: 'info' | 'event' | 'error' | 'warning', event: string, data?: any) => {
  if (debugPanelRef.value) {
    debugPanelRef.value.addLog(type, event, data);
  }
};

// 修改事件处理函数，增加日志记录
const onMapLoaded = (map: any) => {
  logEvent('event', 'map-loaded', { mapType: props.type });
  emit('map-loaded', map);
  
  // 地图加载完成后，自动添加标记点
  // 这样在重新渲染地图后标记点也能自动恢复
  if (props.markers.length > 0 && mapRef.value) {
    // 延迟添加标记点，确保地图初始化完成
    setTimeout(() => {
      mapRef.value.setMarkers(props.markers);
    }, 100);
  }

   mapRef.value?.addMouseMoveListener(onMouseMove);
  
  // 初始化聚合
  if (props.enableCluster && mapRef.value) {
    setTimeout(() => {
      mapRef.value.enableCluster(props.clusterOptions);
    }, 200);
  }
  
  // 添加初始形状
  if (props.initialShapes.length > 0 && mapRef.value) {
    setTimeout(() => {
      props.initialShapes.forEach(shape => {
        mapRef.value.addShape(shape);
      });
    }, 300);
  }
};

const onMarkerClick = (marker: Marker) => {
  logEvent('event', 'marker-click', marker);
  emit('marker-click', marker);
};

const onMapClick = (e: any) => {
  if (showMousePosition.value) {
    updateMousePosition(e.lat, e.lng);
  }
  
  logEvent('event', 'map-click', { lat: e.lat, lng: e.lng });
  emit('map-click', e);
};

const onZoomChanged = (zoom: number) => {
  logEvent('event', 'zoom-changed', { zoom });
  emit('zoom-changed', zoom);
};

const onCenterChanged = (center: [number, number]) => {
  logEvent('event', 'center-changed', { center });
  emit('center-changed', center);
};

const onBoundsChanged = (bounds: any) => {
  logEvent('event', 'bounds-changed', bounds);
  emit('bounds-changed', bounds);
};

// 绘图相关事件
const onShapeCreated = (shape: any) => {
  logEvent('event', 'shape-created', shape);
  emit('shape-created', shape);
};

const onShapeClick = (event: any) => {
  logEvent('event', 'shape-click', event);
  emit('shape-click', event);
};

const onShapeMouseover = (event: any) => {
  logEvent('event', 'shape-mouseover', event);
  emit('shape-mouseover', event);
};

const onShapeMouseout = (event: any) => {
  logEvent('event', 'shape-mouseout', event);
  emit('shape-mouseout', event);
};

const onShapeDeleted = (shapeId: string) => {
  logEvent('event', 'shape-deleted', { shapeId });
  emit('shape-deleted', shapeId);
};

const onClusterClick = (event: any) => {
  logEvent('event', 'cluster-click', event);
  emit('cluster-click', event);
};

const onDistanceResult = (result: DistanceResultEvent) => {
  logEvent('event', 'distance-result', result);
  distanceResult.value = result;
  emit('distance-result', result);
};

const onMarkerCreated = (marker: Marker) => {
  logEvent('event', 'marker-created', marker);
  emit('marker-created', marker);
};

// 对外暴露的方法
const setCenter = (center: [number, number]) => {
  if (mapRef.value) {
    mapRef.value.setCenter(center);
  }
};

const setZoom = (zoom: number) => {
  if (mapRef.value) {
    mapRef.value.setZoom(zoom);
  }
};

/**
 * 添加标记点，根据id去重
 * @param markers 要添加的标记点数组
 */
const addMarkers = (markers: Marker[]) => {
  if (mapRef.value) {
    // 获取当前所有标记点
    const existingMarkers = mapRef.value?.markersInstances?.map(marker => {
      return (marker as any).__markerData;
    }).filter(Boolean) || [];
    
    // 过滤掉id重复的标记点
    const uniqueMarkers = markers.filter(newMarker => {
      // 获取标记点ID (主要从marker.data.id获取)
      const newMarkerId = newMarker.data?.id;
      
      // 如果标记点没有ID，则不进行去重，直接添加
      if (!newMarkerId) return true;
      
      // 检查是否存在相同ID的标记点
      return !existingMarkers.some(existingMarker => {
        const existingId = existingMarker?.data?.id;
        return existingId === newMarkerId;
      });
    });
    
    // 只添加不重复的标记点
    if (uniqueMarkers.length > 0) {
      mapRef.value.addMarkers(uniqueMarkers);
    }
  }
};

/**
 * 设置标记点（先清空再添加）
 * @param markers 标记点数组 
 */
const setMarkers = (markers: Marker[]) => {
  if (mapRef.value) {
    // 先清空现有标记点
    clearMarkers();
    
    // 去重处理（在空地图上添加，主要是为了防止传入数组自身有重复ID的标记点）
    const uniqueIds = new Set();
    const uniqueMarkers = markers.filter(marker => {
      const markerId = marker.data?.id;
      
      // 如果没有ID，或者ID没有重复，则保留
      if (!markerId) return true;
      
      if (uniqueIds.has(markerId)) {
        return false; // 丢弃重复ID的标记点
      } else {
        uniqueIds.add(markerId);
        return true;
      }
    });
    
    // 添加去重后的标记点
    if (uniqueMarkers.length > 0) {
      mapRef.value.addMarkers(uniqueMarkers);
    }
  }
};

/**
 * 根据id删除指定标记点
 * @param markerId 标记点ID
 * @returns 删除是否成功
 */
const removeMarker = (markerId: string) => {
  if (mapRef.value) {
    return mapRef.value.removeMarker(markerId);
  }
  return false;
};

const clearMarkers = () => {
  if (mapRef.value) {
    mapRef.value.clearMarkers();
  }
};

// 图形相关方法
const addShape = (shape: any) => {
  if (mapRef.value) {
    mapRef.value.addShape(shape);
  }
};

const addPolygon = (points: [number, number][], style?: ShapeStyle) => {
  if (mapRef.value) {
    mapRef.value.addPolygon(points, style);
  }
};

const addCircle = (center: [number, number], radius: number, style?: ShapeStyle) => {
  if (mapRef.value) {
    mapRef.value.addCircle(center, radius, style);
  }
};

const addRectangle = (bounds: [[number, number], [number, number]], style?: ShapeStyle) => {
  if (mapRef.value) {
    mapRef.value.addRectangle(bounds, style);
  }
};

const addPolyline = (points: [number, number][], style?: ShapeStyle) => {
  if (mapRef.value) {
    mapRef.value.addPolyline(points, style);
  }
};

const removeShape = (shapeId: string) => {
  if (mapRef.value) {
    mapRef.value.removeShape(shapeId);
  }
};

const clearShapes = () => {
  if (mapRef.value) {
    mapRef.value.clearShapes();
  }
};

const getShapes = () => {
  if (mapRef.value) {
    return mapRef.value.getShapes();
  }
  return [];
};

// 聚合相关方法
const toggleCluster = (enable: boolean, options?: ClusterOptions) => {
  if (mapRef.value) {
    if (enable) {
      return mapRef.value.enableCluster(options || props.clusterOptions);
    } else {
      return mapRef.value.disableCluster();
    }
  }
};

// 轨迹动画方法
const startTrackAnimation = (points: [number, number][], options?: TrackAnimationOptions) => {
  if (mapRef.value) {
    return mapRef.value.startTrackAnimation(points, options, (step: any) => {
      emit('track-animation-step', step);
    }, () => {
      emit('track-animation-complete');
    });
  }
};

const stopTrackAnimation = () => {
  if (mapRef.value) {
    return mapRef.value.stopTrackAnimation();
  }
};

const pauseTrackAnimation = () => {
  if (mapRef.value) {
    return mapRef.value.pauseTrackAnimation();
  }
};

const resumeTrackAnimation = () => {
  if (mapRef.value) {
    return mapRef.value.resumeTrackAnimation();
  }
};

// 切换工具栏折叠状态
const toggleToolbar = () => {
  isToolsCollapsed.value = !isToolsCollapsed.value;
};

// 处理工具点击
const handleToolClick = (toolType: ToolType | '', callback?: string, state?: boolean) => {
  // 处理开关类型的工具
  if (state !== undefined) {
    // 有state参数表示是开关类型工具
    // 根据state参数进行对应操作
    if (toolType === 'marker') {
      if (state) {
        mapRef.value?.enableAddMarker();
      } else {
        mapRef.value?.disableAddMarker();
      }
    }

     if (toolType === 'position') {
      showMousePosition.value = state
    }
    
    // 记录开关状态
    logEvent('event', `switch-tool-${state ? 'on' : 'off'}`, { tool: toolType, state });
    return;
  }

  if (!toolType) {
    // 工具被取消选择
    currentTool.value = '';
    stopCurrentTool();
    return;
  }

  if (currentTool.value === toolType) {
    // 如果是当前激活的工具，则取消选择
    currentTool.value = '';
    stopCurrentTool();
  } else {
    // 否则切换到新工具
    currentTool.value = toolType;
    startCurrentTool(toolType);
  }

  // 如果有回调方法名，尝试执行
  if (callback && typeof callback === 'string' && mapRef.value && callback in mapRef.value) {
    mapRef.value[callback]();
  }
};

// 启动当前选择的工具
const startCurrentTool = (toolType: ToolType) => {
  stopCurrentTool(); // 先停止当前工具
  
  logEvent('info', `启动工具: ${toolType}`);
  
  if (toolType === 'distance') {
    startMeasure();
  } else if (['circle', 'polygon', 'rectangle', 'polyline'].includes(toolType)) {
    startDrawing(toolType);
  } else if (toolType === 'clear') {
    clearAll();
    currentTool.value = ''; // 清除后重置工具状态
  } else if (toolType === 'marker') {
    // 进入添加标记模式
    if (mapRef.value) {
      mapRef.value.enableAddMarker();
    }
  }
};

// 停止当前工具
const stopCurrentTool = () => {
  const prevTool = currentTool.value;
  if (prevTool) {
    logEvent('info', `停止工具: ${prevTool}`);
  }
  
  if (prevTool === 'distance') {
    stopMeasure();
  } else if (['circle', 'polygon', 'rectangle', 'polyline'].includes(prevTool as string)) {
    stopDrawing();
  } else if (prevTool === 'marker') {
    // 禁用添加标记模式
    if (mapRef.value) {
      mapRef.value.disableAddMarker();
    }
  }
};

// 格式化距离
const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${distance.toFixed(2)}米`;
  } else {
    return `${(distance / 1000).toFixed(2)}公里`;
  }
};

// 清除距离测量
const clearDistance = () => {
  distanceResult.value = null;
  if (mapRef.value) {
    mapRef.value.stopMeasure();
  }
  currentTool.value = '';
  logEvent('info', '清除测距结果');
};

// 开始测量
const startMeasure = () => {
  if (mapRef.value) {
    logEvent('info', '开始测距', { mapType: props.type });
    currentTool.value = 'distance';
    mapRef.value.startMeasure();
  }
};

// 停止测量
const stopMeasure = () => {
  if (mapRef.value) {
    logEvent('info', '停止测距');
    mapRef.value.stopMeasure();
  }
};

// 开始绘制
const startDrawing = (type: ToolType) => {
  if (mapRef.value) {
    mapRef.value.startDrawing(type);
  }
};

// 停止绘制
const stopDrawing = () => {
  if (mapRef.value) {
    mapRef.value.stopDrawing();
  }
};

// 清除所有
const clearAll = () => {
  if (mapRef.value) {
    mapRef.value.clearMarkers();
    mapRef.value.clearShapes();
  }
  currentTool.value = '';
  distanceResult.value = null;
};

// 更新鼠标位置
const updateMousePosition = (lat: number, lng: number) => {
  mousePosition.value = [lat, lng];
};

// 设置地图工具
const setupMapTools = () => {
  if (!toolbarRef.value) return;
  
  // 设置工具初始状态
  if (showMousePosition.value) {
    toolbarRef.value.setToolState('position', true);
  }
};

/**
 * 添加自定义工具到工具栏
 * @param id 工具ID
 * @param icon 工具图标，支持SVG或图片URL
 * @param label 工具标签
 * @param callback 点击回调名称，可选
 */
const addMapTool = (id: string, icon: string, label: string, callback?: string) => {
  if (toolbarRef.value) {
    return toolbarRef.value.addTool(id, icon, label, callback);
  }
  return false;
};

/**
 * 删除工具栏中的工具
 * @param id 工具ID
 */
const removeMapTool = (id: string) => {
  if (toolbarRef.value) {
    return toolbarRef.value.removeTool(id);
  }
  return false;
};

/**
 * 禁用或启用工具栏中的工具
 * @param id 工具ID
 * @param disabled 是否禁用
 */
const disableMapTool = (id: string, disabled: boolean = true) => {
  if (toolbarRef.value) {
    return toolbarRef.value.disableTool(id, disabled);
  }
  return false;
};

/**
 * 设置工具栏工具的图标
 * @param id 工具ID
 * @param icon 新图标，支持SVG或图片URL
 */
const setMapToolIcon = (id: string, icon: string) => {
  if (toolbarRef.value) {
    return toolbarRef.value.setToolIcon(id, icon);
  }
  return false;
};

/**
 * 设置工具栏工具的标签
 * @param id 工具ID
 * @param label 新标签
 */
const setMapToolLabel = (id: string, label: string) => {
  if (toolbarRef.value) {
    return toolbarRef.value.setToolLabel(id, label);
  }
  return false;
};

/**
 * 设置工具栏每行显示的工具数量
 * @param count 每行数量
 */
const setMapToolsPerRow = (count: number) => {
  if (toolbarRef.value) {
    return toolbarRef.value.setItemsPerRow(count);
  }
  return false;
};

/**
 * 获取地图当前可视区域的四个角坐标
 * @returns 返回地图可视区域的四个角坐标（西北、东北、东南、西南），格式为[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]
 */
const getVisibleBounds = () => {
  if (!mapRef.value || !mapRef.value.mapInstance) {
    return null;
  }
  
  // 高德地图和天地图都有getBounds方法获取地图边界
  try {
    const bounds = mapRef.value.mapInstance.getBounds();
    if (!bounds) return null;
    
    let northEast, southWest;
    
    // 高德地图
    if (props.type === 'amap') {
      northEast = bounds.getNorthEast(); // 东北角
      southWest = bounds.getSouthWest(); // 西南角
      
      // 西北角和东南角需要组合经纬度
      const northWest: [number, number] = [southWest.lng, northEast.lat];
      const southEast: [number, number] = [northEast.lng, southWest.lat];
      
      return [
        northWest,                                    // 西北
        [northEast.lng, northEast.lat],               // 东北
        southEast,                                    // 东南
        [southWest.lng, southWest.lat]                // 西南
      ];
    }
    // 天地图
    else if (props.type === 'tmap') {
      // 天地图的getBounds返回的是LatLngBounds对象
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      // 组合经纬度获取西北角和东南角
      const nw: [number, number] = [sw.lng, ne.lat];
      const se: [number, number] = [ne.lng, sw.lat];
      
      return [
        nw,                        // 西北
        [ne.lng, ne.lat],          // 东北
        se,                        // 东南
        [sw.lng, sw.lat]           // 西南
      ];
    }
  } catch (error) {
    console.error('获取地图可视区域边界失败', error);
  }
  
  return null;
};

// 暴露方法
defineExpose({
  mapInstance: computed(() => mapRef.value?.mapInstance),
  setCenter,
  setZoom,
  addMarkers,
  setMarkers,
  removeMarker,
  clearMarkers,
  // 形状相关方法
  addShape,
  addPolygon,
  addCircle,
  addRectangle,
  addPolyline,
  removeShape,
  clearShapes,
  getShapes,
  // 可视区域坐标
  getVisibleBounds,
  // 聚合相关方法
  toggleCluster,
  // 轨迹动画相关方法
  startTrackAnimation,
  stopTrackAnimation,
  pauseTrackAnimation,
  resumeTrackAnimation,
  toggleToolbar,
  startMeasure,
  stopMeasure,
  startDrawing,
  stopDrawing,
  clearAll,
  clearDistance,
  // 工具栏相关方法
  addMapTool,
  removeMapTool,
  disableMapTool,
  setMapToolIcon,
  setMapToolLabel,
  setMapToolsPerRow,
  // 新增调试相关功能
  toggleDebugPanel,
  logInfo: (message: string, data?: any) => logEvent('info', message, data),
  logWarning: (message: string, data?: any) => logEvent('warning', message, data),
  logError: (message: string, data?: any) => logEvent('error', message, data),
  clearLogs: () => debugPanelRef.value?.clearLogs(),
  // 获取所有图形
  getAllShapes: () => getShapes(),
  // 获取所有标记点
  getAllMarkers: () => {
    if (mapRef.value) {
      // 从底层地图实现中获取实际的标记点实例
      const existingMarkers = mapRef.value?.markersInstances?.map(marker => {
        return (marker as any).__markerData;
      }).filter(Boolean) || [];
      
      if (existingMarkers && existingMarkers.length > 0) {
        return existingMarkers;
      }
    }
    // 如果没有地图实例或者实例中没有标记点，则返回props
    return props.markers;
  }
});

// 监听地图类型变化
watch(() => props.type, () => {
  loadMapScript();
});

// 监听聚合配置变化
watch(() => props.enableCluster, (newValue) => {
  if (mapRef.value) {
    toggleCluster(newValue, props.clusterOptions);
  }
});

watch(() => props.clusterOptions, (newOptions) => {
  if (mapRef.value && props.enableCluster) {
    toggleCluster(true, newOptions);
  }
}, { deep: true });

// 组件挂载时加载地图
onMounted(() => {
  logEvent('info', '地图组件初始化', { 
    type: props.type, 
    center: props.center,
    zoom: props.zoom
  });
  
  loadMapScript();
  isToolsCollapsed.value = props.toolsCollapsed;
  
  // 设置工具栏中的自定义工具
  setupMapTools();
});

// 组件卸载时清理
onUnmounted(() => {
  if (mapRef.value?.mapInstance) {
    mapRef.value = null;
    currentMapComponent.value = null;
  }
});

// 在script部分添加鼠标移动事件处理
const onMouseMove = (e: any) => {
  if (showMousePosition.value) {
    updateMousePosition(e.lat, e.lng);
  }
};


watch(() => props.toolsOptions, (newOptions: ToolsOptions) => {
  showMousePosition.value = newOptions.position;
}, { deep: true });

// 监听showMousePosition变化

onMounted(() => {
});

onUnmounted(() => {
  nextTick(() => {
    mapRef.value?.removeMouseMoveListener();
  });
});
</script>

<style scoped>
.sc-map-container {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.sc-map-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.sc-map-loading .is-loading {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--el-color-primary);
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 距离结果显示样式 */
.distance-result {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
}

.distance-label {
  font-size: 14px;
  color: #333;
}

.distance-close {
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f5f5f5;
  font-size: 16px;
}

.distance-close:hover {
  background-color: #e0e0e0;
}
</style>