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
    >
      <!-- 绘制工具插槽 -->
      <template v-if="$slots.tools" #tools>
        <slot name="tools"></slot>
      </template>
      
      <!-- 工具按钮自定义插槽 -->
      <template v-if="$slots.drawingTools" #drawingTools>
        <slot name="drawingTools"></slot>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { useScriptLoader } from './hooks/useScriptLoader';
import { MapType, MapViewType, MapOptions, Marker, OfflineMapConfig, ToolsOptions, ClusterOptions, ToolType, ShapeStyle, TrackAnimationOptions } from './types';
import AMap from './layout/AMap.vue';
import BMap from './layout/BMap.vue';
import TMap from './layout/TMap.vue';

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
      clear: true
    })
  },
  // 工具栏位置
  toolsPosition: {
    type: String,
    default: 'right-top', // 'left-top', 'right-top', 'left-bottom', 'right-bottom'
    validator: (value) => ['left-top', 'right-top', 'left-bottom', 'right-bottom'].includes(value)
  },
  // 工具栏是否折叠
  toolsCollapsed: {
    type: Boolean,
    default: false
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
  'track-animation-complete'
]);

const mapRef = ref<any>(null);
const loading = ref(true);

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

// 地图组件属性
const mapProps = computed(() => {
  return {
    apiKey: props.apiKey,
    center: props.center,
    zoom: props.zoom,
    markers: props.markers,
    initialShapes: props.initialShapes,
    height: props.height,
    width: props.width,
    drawingControl: props.drawingControl,
    toolsOptions: props.toolsOptions,
    toolsPosition: props.toolsPosition,
    toolsCollapsed: props.toolsCollapsed,
    draggable: props.draggable,
    scrollWheel: props.scrollWheel,
    mapStyle: props.mapStyle,
    viewType: props.viewType,
    enableCluster: props.enableCluster,
    clusterOptions: props.clusterOptions,
    offlineConfig: props.offlineConfig
  };
});

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
      currentMapComponent.value = BMap;
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

// 事件处理
const onMapLoaded = (map: any) => {
  emit('map-loaded', map);
  
  // 地图加载完成后，自动添加标记点
  // 这样在重新渲染地图后标记点也能自动恢复
  if (props.markers.length > 0 && mapRef.value) {
    // 延迟添加标记点，确保地图初始化完成
    setTimeout(() => {
      mapRef.value.addMarkers(props.markers);
    }, 100);
  }
  
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
  emit('marker-click', marker);
};

const onMapClick = (event: any) => {
  emit('map-click', event);
};

const onZoomChanged = (zoom: number) => {
  emit('zoom-changed', zoom);
};

const onCenterChanged = (center: [number, number]) => {
  emit('center-changed', center);
};

const onBoundsChanged = (bounds: any) => {
  emit('bounds-changed', bounds);
};

// 绘图相关事件
const onShapeCreated = (shape: any) => {
  emit('shape-created', shape);
};

const onShapeClick = (event: any) => {
  emit('shape-click', event);
};

const onShapeMouseover = (event: any) => {
  emit('shape-mouseover', event);
};

const onShapeMouseout = (event: any) => {
  emit('shape-mouseout', event);
};

const onShapeDeleted = (shapeId: string) => {
  emit('shape-deleted', shapeId);
};

const onClusterClick = (event: any) => {
  emit('cluster-click', event);
};

const onDistanceResult = (result: any) => {
  emit('distance-result', result);
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

const addMarkers = (markers: Marker[]) => {
  if (mapRef.value) {
    mapRef.value.addMarkers(markers);
  }
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

const startDrawing = (type: ToolType) => {
  if (mapRef.value) {
    return mapRef.value.startDrawing(type);
  }
};

const stopDrawing = () => {
  if (mapRef.value) {
    return mapRef.value.stopDrawing();
  }
};

// 测距相关方法
const startMeasure = () => {
  if (mapRef.value) {
    return mapRef.value.startMeasure();
  }
};

const stopMeasure = () => {
  if (mapRef.value) {
    return mapRef.value.stopMeasure();
  }
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

// 暴露方法
defineExpose({
  mapInstance: computed(() => mapRef.value?.mapInstance),
  setCenter,
  setZoom,
  addMarkers,
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
  // 绘制相关方法
  startDrawing,
  stopDrawing,
  // 测距相关方法
  startMeasure,
  stopMeasure,
  // 聚合相关方法
  toggleCluster,
  // 轨迹动画相关方法
  startTrackAnimation,
  stopTrackAnimation,
  pauseTrackAnimation,
  resumeTrackAnimation
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
  loadMapScript();
});

// 组件卸载时清理
onUnmounted(() => {
  if (mapRef.value?.mapInstance) {
    mapRef.value = null;
    currentMapComponent.value = null;
  }
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
</style>