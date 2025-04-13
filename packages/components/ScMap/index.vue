<template>
  <div class="sc-map-container" :style="{ height: height, width: width }">
    <div v-if="loading" class="sc-map-loading">
      <div class="is-loading">
        <i class="el-icon-loading"></i>
      </div>
      <span>地图加载中...</span>
    </div>
    <component v-if="!loading && currentMapComponent" :is="currentMapComponent" ref="mapRef" v-bind="mapProps"
      @map-loaded="onMapLoaded" @marker-click="onMarkerClick" @map-click="onMapClick" @zoom-changed="onZoomChanged"
      @center-changed="onCenterChanged" @bounds-changed="onBoundsChanged" @shape-created="onShapeCreated"
      @shape-click="onShapeClick" @shape-mouseover="onShapeMouseover" @shape-mouseout="onShapeMouseout"
      @shape-deleted="onShapeDeleted" @cluster-click="onClusterClick" @distance-result="onDistanceResult"
      @marker-created="onMarkerCreated" @marker-mouseenter="onMarkerMouseenter" @marker-mouseleave="onMarkerMouseleave"
      @hover-popover-show="onHoverPopoverShow" @hover-popover-hide="onHoverPopoverHide"
      @click-popover-show="onClickPopoverShow" @click-popover-hide="onClickPopoverHide">
    </component>

    <!-- 添加统一的工具面板组件 -->
    <MapToolbar ref="toolbarRef" v-model="currentTool" :show="drawingControl" :position="toolsPosition"
      :collapsed="isToolsCollapsed" :options="enhancedToolsOptions" :items-per-row="toolsPerRow"
      :button-size="toolsButtonSize" :markers="props.markers" @tool-click="handleToolClick"
      @toggle-collapse="toggleToolbar" @marker-type-selected="handleMarkerTypeSelected"
      @category-toggle="handleCategoryToggle">
    </MapToolbar>

    <!-- 测距结果显示 -->
    <div v-if="distanceResult && currentTool === 'distance'" class="distance-result">
      <div class="distance-label">距离: {{ formatDistance(distanceResult.distance) }}</div>
      <div class="distance-close" @click="clearDistance">×</div>
    </div>

    <!-- 添加统一的鼠标位置组件 -->
    <MousePosition :show="showMousePosition" :position="mousePosition" :format="mousePositionFormat" :precision="6" />

    <!-- 调试面板 -->
    <DebugPanel ref="debugPanelRef" :show="showDebugPanel" :map-position="toolsPosition" :map-type="props.type"
      @close="closeDebugDialog()" />

    <!-- 标记点弹窗 -->
    <MapPopover ref="hoverPopoverRef" type="hover" :marker="hoveredMarker" :visible="showHoverPopover"
      :position="popoverPosition" :template="hoveredMarkerTemplate" :map-container="mapContainer"
      @close="handleHoverPopoverClose" />

    <MapPopover ref="clickPopoverRef" type="click" :marker="clickedMarker" :visible="showClickPopover"
      :position="popoverPosition" :template="clickedMarkerTemplate" :map-container="mapContainer"
      @close="handleClickPopoverClose" />
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
import MapPopover from './components/MapPopover.vue';

// 声明window类型
declare global {
  interface Window {
    initBMap: () => void;
  }
}

// 地图工具接口定义
interface MapTool {
  name: string;
  icon?: string;
  label?: string;
  disabled?: boolean;
  type?: 'normal' | 'switch';
  active?: boolean;
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
      position: true,
      showLabels: true,
      cluster: true
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
  // 标记点聚合配置
  clusterOptions: {
    type: Object as () => ClusterOptions,
    default: () => ({
      enable: false,
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
  },
  // 是否启用自定义标签
  customMapEvents: {
    type: Boolean,
    default: false
  },
  // 是否启用调试面板
  showDebugPanel: {
    type: Boolean,
    default: false
  },
  // 是否在地图加载后立即使用聚合
  autoEnableCluster: {
    type: Boolean,
    default: false
  },
  // 是否允许多个形状
  allowMultipleShapes: {
    type: Boolean,
    default: true
  },
  // 是否显示地图加载进度
  showLoadingProgress: {
    type: Boolean,
    default: true
  },
  // 工具状态配置，用于设置各工具是否默认激活
  toolsStatus: {
    type: Object,
    default: () => ({
      marker: false,
      circle: false,
      polygon: false,
      rectangle: false,
      polyline: false,
      position: false,
      cluster: false,
      showLabels: true,
      distance: false,
      debug: false
    })
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
  'marker-created',
  'marker-mouseenter',
  'marker-mouseleave',
  'hover-popover-show',
  'hover-popover-hide',
  'click-popover-show',
  'click-popover-hide'
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
const showMarkerLabels = ref(props.toolsOptions.showLabels !== false);
// 保存聚合状态的变量
const isClusterEnabled = ref(false);
// 工具栏可见性状态
const toolbarVisible = ref(true);
// 工具栏存储的工具
const toolsRef = ref<MapTool[]>([]);
// 自定义每行工具数量
const toolsPerRow = ref(props.toolsPerRow);

// 鼠标悬停和弹窗相关状态变量
const currentHoveredMarker = ref<any>(null);
const currentPopover = ref<any>(null);

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
    clusterOptions: {
      ...props.clusterOptions,
      // 通过 toolsOptions.cluster 和 isClusterEnabled 共同决定是否启用聚合
      enable: isClusterEnabled.value
    },
    showMarkerLabels: showMarkerLabels.value
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

// // 初始化插件
// const initPlugin = () => {
//   currentMapComponent.value.initPlugin();
// }
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

  // 添加初始形状
  if (props.initialShapes.length > 0 && mapRef.value) {
    setTimeout(() => {
      props.initialShapes.forEach(shape => {
        mapRef.value.addShape(shape);
      });
    }, 300);
  }
};

// 自定义获取像素坐标的方法，使用DOM元素位置替代坐标转换
const getMarkerPixelPosition = (marker: Marker) => {
  try {
    // 先尝试通过地图组件获取像素坐标
    if (mapRef.value && typeof mapRef.value.getPixelFromCoordinate === 'function') {
      const pixel = mapRef.value.getPixelFromCoordinate(marker.position);
      if (pixel) {
        return [pixel[0], pixel[1] - 35]; // 向上偏移以便弹窗显示在标记点上方
      }
    }

    // 备用方案：寻找对应标记点的DOM元素
    if (marker.markerId || (marker.data && marker.data.id)) {
      const markerId = marker.markerId || marker.data.id;
      const markerElement = document.querySelector(`[data-marker-id="${markerId}"]`);

      if (markerElement) {
        const rect = markerElement.getBoundingClientRect();
        const containerRect = mapContainer.value?.getBoundingClientRect() || {
          left: 0,
          top: 0
        };

        // 返回相对于容器的坐标，并向上偏移
        return [
          rect.left - containerRect.left + rect.width / 2,
          rect.top - containerRect.top // 标记点的顶部位置
        ];
      }
    }

    return null;
  } catch (error) {
    console.error('计算标记点像素位置失败:', error);
    return null;
  }
};

// 修改标记鼠标悬停事件处理函数
const onMarkerMouseenter = (marker: Marker) => {
  logEvent('event', 'marker-mouseenter', marker);
  emit('marker-mouseenter', marker);

  // 保存当前悬停的标记
  currentHoveredMarker.value = marker;

  // 检查是否需要显示悬停弹窗
  if (marker.hoverPopover !== false) {
    // 保存标记点数据
    hoveredMarker.value = marker;

    // 设置模板（如果有）
    hoveredMarkerTemplate.value = marker.hoverPopoverTemplate || '';

    // 获取标记点在屏幕上的位置
    const pixelPosition = getMarkerPixelPosition(marker);

    if (pixelPosition) {
      popoverPosition.value = pixelPosition;

      // 显示弹窗
      showHoverPopover.value = true;

      // 触发事件
      emit('hover-popover-show', {
        marker: marker,
        position: marker.position,
        element: hoverPopoverRef.value?.$el
      });

      return;
    }
  }
};

// 修改标记鼠标离开事件处理函数
const onMarkerMouseleave = (marker: Marker) => {
  logEvent('event', 'marker-mouseleave', marker);
  emit('marker-mouseleave', marker);

  // 清除当前悬停标记
  if (currentHoveredMarker.value &&
    (currentHoveredMarker.value.markerId === marker.markerId ||
      (currentHoveredMarker.value.data && currentHoveredMarker.value.data.id === marker.markerId))) {

    currentHoveredMarker.value = null;

    // 隐藏悬停弹窗
    if (showHoverPopover.value) {
      handleHoverPopoverClose();
    }

    // 如果地图组件有自己的实现，也调用它
    if (mapRef.value && typeof mapRef.value.hideHoverPopover === 'function') {
      try {
        mapRef.value.hideHoverPopover(marker);
      } catch (error) {
        console.warn('调用地图组件的hideHoverPopover方法失败', error);
      }
    }
  }
};

// 修改标记点击事件处理函数
const onMarkerClick = (marker: Marker) => {
  logEvent('event', 'marker-click', marker);
  emit('marker-click', marker);

  // 检查是否需要显示点击弹窗
  if (marker.clickPopover !== false) {
    // 保存标记点数据
    clickedMarker.value = marker;

    // 设置模板（如果有）
    clickedMarkerTemplate.value = marker.clickPopoverTemplate || '';

    // 获取标记点在地图上的像素坐标
    if (mapRef.value && typeof mapRef.value.getPixelFromCoordinate === 'function') {
      try {
        const pixelCoord = mapRef.value.getPixelFromCoordinate(marker.position);
        if (pixelCoord) {
          // 计算弹窗位置，适当向上偏移
          popoverPosition.value = [
            pixelCoord[0],
            pixelCoord[1] - 25 // 向上偏移，使弹窗出现在标记点上方而不是标记点位置
          ];

          // 隐藏悬停弹窗（如果有）
          showHoverPopover.value = false;

          // 显示点击弹窗
          showClickPopover.value = true;

          // 触发事件
          emit('click-popover-show', {
            marker: marker,
            position: marker.position,
            element: clickPopoverRef.value?.$el
          });

          return;
        }
      } catch (error) {
        console.warn('获取标记点像素坐标失败', error);
      }
    }

    // 如果获取不到坐标，尝试使用地图组件内置的方法
    if (mapRef.value && typeof mapRef.value.showClickPopover === 'function') {
      try {
        mapRef.value.showClickPopover(marker);
      } catch (error) {
        console.warn('调用地图组件的showClickPopover方法失败', error);
      }
    }
  }
};

// 存储当前选择的标记类型
const currentMarkerType = ref<any>(null);

// 存储激活的分类过滤器
const activeCategories = ref<string[]>([]);

// 处理分类过滤
const handleCategoryToggle = (category: string, categories: string[]) => {
  activeCategories.value = categories;

  // 根据过滤器更新地图标记点的可见性
  updateMarkersVisibility();

  // 记录日志
  logEvent('info', `标记点分类过滤: ${categories.join(', ')}`, { categories });
};

// 更新标记点可见性
const updateMarkersVisibility = () => {
  if (!mapRef.value) return;

  // 如果没有激活的分类过滤器，显示所有标记点
  if (activeCategories.value.length === 0) {
    // 重新加载所有标记点以确保全部可见
    mapRef.value.setMarkers(props.markers);
    return;
  }

  // 过滤需要显示的标记点（属于激活的分类）
  const visibleMarkers = props.markers.filter(marker =>
    marker.category && activeCategories.value.includes(marker.category)
  );

  // 更新地图标记点
  mapRef.value.setMarkers(visibleMarkers);
};

// 处理标记面板选择事件
const handleMarkerTypeSelected = (markerType: any) => {
  // 记录当前选择的标记类型
  currentMarkerType.value = markerType;

  // 记录日志
  logEvent('info', `选择标记类型: ${markerType.name}`, markerType);

  // 自动进入添加标记模式
  if (mapRef.value) {
    // 启用添加标记模式
    mapRef.value.enableAddMarker();

    // 确保标记工具激活状态
    if (toolbarRef.value) {
      // 设置当前工具为marker
      currentTool.value = 'marker';

      // 确保工具栏显示当前工具为激活状态
      toolbarRef.value.setToolState('marker', true);
    }
  }
};

// 修改处理地图点击事件，以支持选择不同类型的标记
const onMapClick = (e: any) => {
  if (showMousePosition.value) {
    updateMousePosition(e.lat, e.lng);
  }

  // 如果当前工具是marker且有选择的标记类型，自动添加标记
  if (currentTool.value === 'marker' && currentMarkerType.value && mapRef.value) {
    // 创建新的标记点数据
    const markerId = `marker_${Date.now()}`;
    const newMarker: Marker = {
      markerId,
      position: [e.lng, e.lat] as [number, number],
      title: currentMarkerType.value.name || '标记点',
      icon: currentMarkerType.value.icon || '', // 使用选择的标记图标
      label: currentMarkerType.value.name || '标记点',
      draggable: false,
      visible: true,
      clusterable: true,
      category: currentMarkerType.value.category || '默认',
      color: currentMarkerType.value.color || '#1890FF',
      data: {
        id: markerId,
        type: currentMarkerType.value.id || 'default',
        ...currentMarkerType.value.data
      }
    };

    // 添加新标记到地图
    addMarkers([newMarker]);

    // 触发标记创建事件
    emit('marker-created', newMarker);

    // 记录日志
    logEvent('event', 'marker-created', newMarker);

    return; // 不继续冒泡事件
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

  // 绘制完成后记录日志，但不重置工具状态，允许用户继续绘制
  if (currentTool.value && ['circle', 'rectangle', 'polygon', 'polyline'].includes(currentTool.value as string)) {
    logEvent('info', `绘制完成: ${shape.type || currentTool.value}，工具保持激活状态`);

    // 如果是基于地图组件实现的绘图工具，重新激活绘图模式以便继续绘制
    if (mapRef.value) {
      // 短暂延时，确保上一次绘制完全结束
      setTimeout(() => {
        startDrawing(currentTool.value as ToolType);
      }, 100);
    }
  }
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
  // 如果有当前选择的标记类型，使用它的信息增强marker
  if (currentMarkerType.value) {
    // 使用当前标记类型的信息来丰富标记
    marker.icon = currentMarkerType.value.icon || marker.icon;
    marker.category = currentMarkerType.value.category || marker.category;
    marker.color = currentMarkerType.value.color || marker.color;

    if (!marker.data) marker.data = {};
    marker.data.type = currentMarkerType.value.id || 'default';
  }
  logEvent('event', 'marker-created', marker);
  emit('marker-created', marker);
};

// 暴露方法
defineExpose({
  mapInstance: computed(() => mapRef.value?.mapInstance),
  setCenter: (center: [number, number]) => {
    if (mapRef.value) {
      mapRef.value.setCenter(center);
    }
  },
  setZoom: (zoom: number) => {
    if (mapRef.value) {
      mapRef.value.setZoom(zoom);
    }
  },
  addMarkers: (markers: Marker[]) => {
    if (mapRef.value) {
      // 获取当前所有标记点
      const existingMarkers = mapRef.value?.markersInstances?.map(marker => {
        return (marker as any).__markerData;
      }).filter(Boolean) || [];

      // 过滤掉id重复的标记点
      const uniqueMarkers = markers.filter(newMarker => {
        // 获取标记点ID (优先使用markerId，其次从marker.data.id获取)
        const newMarkerId = newMarker.markerId || newMarker.data?.id;

        // 如果标记点没有ID，则不进行去重，直接添加
        if (!newMarkerId) return true;

        // 检查是否存在相同ID的标记点
        return !existingMarkers.some(existingMarker => {
          const existingId = existingMarker?.markerId || existingMarker?.data?.id;
          return existingId === newMarkerId;
        });
      });

      // 只添加不重复的标记点
      if (uniqueMarkers.length > 0) {
        mapRef.value.addMarkers(uniqueMarkers);
      }
    }
  },
  setMarkers: (markers: Marker[]) => {
    if (mapRef.value) {
      // 先清空现有标记点
      mapRef.value.clearMarkers();

      // 去重处理（在空地图上添加，主要是为了防止传入数组自身有重复ID的标记点）
      const uniqueIds = new Set();
      const uniqueMarkers = markers.filter(marker => {
        const markerId = marker.markerId || marker.data?.id;

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
  },
  removeMarker: (markerId: string) => {
    if (mapRef.value) {
      return mapRef.value.removeMarker(markerId);
    }
    return false;
  },
  clearMarkers: () => {
    if (mapRef.value) {
      mapRef.value.clearMarkers();
    }
  },
  // 形状相关方法
  addShape: (shape: any) => {
    if (mapRef.value) {
      mapRef.value.addShape(shape);
    }
  },
  addPolygon: (points: [number, number][], style?: ShapeStyle, id?: string) => {
    if (mapRef.value) {
      return mapRef.value.addPolygon(points, style, id);
    }
  },
  addCircle: (center: [number, number], radius: number, style?: ShapeStyle, id?: string) => {
    if (mapRef.value) {
      return mapRef.value.addCircle(center, radius, style, id);
    }
  },
  addRectangle: (bounds: [[number, number], [number, number]], style?: ShapeStyle, id?: string) => {
    if (mapRef.value) {
      return mapRef.value.addRectangle(bounds, style, id);
    }
  },
  addPolyline: (points: [number, number][], style?: ShapeStyle, id?: string) => {
    if (mapRef.value) {
      return mapRef.value.addPolyline(points, style, id);
    }
  },
  removeShape: (shapeId: string) => {
    if (mapRef.value) {
      mapRef.value.removeShape(shapeId);
    }
  },
  clearShapes: () => {
    if (mapRef.value) {
      mapRef.value.clearShapes();
    }
  },
  getShapes: () => {
    if (mapRef.value) {
      return mapRef.value.getShapes();
    }
    return [];
  },
  // 可视区域坐标
  getVisibleBounds: () => {
    if (mapRef.value) {
      return mapRef.value.getVisibleBounds();
    }
    return null;
  },
  // 新增获取可视范围内标记点方法
  getVisibleMarkers: () => {
    if (!mapRef.value) {
      return [];
    }

    try {
      // 直接调用地图组件的实现
      return mapRef.value.getVisibleMarkers();
    } catch (error) {
      logEvent('error', '获取可视范围内标记点失败', error);
      console.error('获取可视范围内标记点失败:', error);
      return [];
    }
  },
  // 聚合相关方法
  toggleCluster: (enabled: boolean) => {
    if (mapRef.value) {
      if (enabled) {
        const clusterOptions: ClusterOptions = {
          ...props.clusterOptions
        };
        // 调用地图组件的聚合功能
        if (typeof mapRef.value.enableCluster === 'function') {
          mapRef.value.enableCluster(clusterOptions);
        }
      } else {
        // 关闭聚合
        logEvent('info', '关闭标记点聚合');
        if (typeof mapRef.value.disableCluster === 'function') {
          mapRef.value.disableCluster();
        }
      }
    }
  },
  // 轨迹动画相关方法
  startTrackAnimation: (options: TrackAnimationOptions) => {
    if (mapRef.value && typeof mapRef.value.startTrackAnimation === 'function') {
      mapRef.value.startTrackAnimation(options);
    }
  },
  stopTrackAnimation: () => {
    if (mapRef.value && typeof mapRef.value.stopTrackAnimation === 'function') {
      mapRef.value.stopTrackAnimation();
    }
  },
  pauseTrackAnimation: () => {
    if (mapRef.value && typeof mapRef.value.pauseTrackAnimation === 'function') {
      mapRef.value.pauseTrackAnimation();
    }
  },
  resumeTrackAnimation: () => {
    if (mapRef.value && typeof mapRef.value.resumeTrackAnimation === 'function') {
      mapRef.value.resumeTrackAnimation();
    }
  },
  toggleToolbar: (visible?: boolean) => {
    // 切换工具栏可见性
    if (visible !== undefined) {
      isToolsCollapsed.value = !visible;
    } else {
      isToolsCollapsed.value = !isToolsCollapsed.value;
    }
  },
  startMeasure: () => {
    if (mapRef.value && typeof mapRef.value.startMeasureDistance === 'function') {
      mapRef.value.startMeasureDistance();
    }
  },
  stopMeasure: () => {
    if (mapRef.value && typeof mapRef.value.stopMeasureDistance === 'function') {
      mapRef.value.stopMeasureDistance();
    }
  },
  startDrawing: (drawingType: 'polygon' | 'rectangle' | 'circle') => {
    if (mapRef.value && typeof mapRef.value.startDrawing === 'function') {
      mapRef.value.startDrawing(drawingType);
    }
  },
  stopDrawing: () => {
    if (mapRef.value && typeof mapRef.value.stopDrawing === 'function') {
      mapRef.value.stopDrawing();
    }
  },
  clearAll: () => {
    if (mapRef.value) {
      // 清空标记点
      mapRef.value.clearMarkers();
      // 清空形状
      mapRef.value.clearShapes();
      // 清空测距
      if (typeof mapRef.value.clearDistance === 'function') {
        mapRef.value.clearDistance();
      }
    }
  },
  clearDistance: () => {
    if (mapRef.value && typeof mapRef.value.clearDistance === 'function') {
      mapRef.value.clearDistance();
    }
  },
  // 工具栏相关方法
  addMapTool: (tool: MapTool) => {
    // 添加工具
    const existingTool = toolsRef.value.find(t => t.name === tool.name);
    if (!existingTool) {
      toolsRef.value.push(tool);
    }
  },
  removeMapTool: (toolName: string) => {
    // 移除工具
    const index = toolsRef.value.findIndex(t => t.name === toolName);
    if (index !== -1) {
      toolsRef.value.splice(index, 1);
    }
  },
  disableMapTool: (toolName: string) => {
    // 禁用工具
    const tool = toolsRef.value.find(t => t.name === toolName);
    if (tool) {
      tool.disabled = true;
    }
  },
  setMapToolIcon: (toolName: string, icon: string) => {
    // 设置工具图标
    const tool = toolsRef.value.find(t => t.name === toolName);
    if (tool) {
      tool.icon = icon;
    }
  },
  setMapToolLabel: (toolName: string, label: string) => {
    // 设置工具标签
    const tool = toolsRef.value.find(t => t.name === toolName);
    if (tool) {
      tool.label = label;
    }
  },
  setMapToolsPerRow: (count: number) => {
    // 设置每行工具数量
    toolsPerRow.value = count;
  },
  // 鼠标样式相关
  setCursorStyle: (style: string) => {
    if (mapRef.value && mapRef.value.setCursorStyle) {
      mapRef.value.setCursorStyle(style);
    }
  },
  // 标记点标签相关
  toggleMarkerLabels: (visible?: boolean) => {
    if (mapRef.value && typeof mapRef.value.toggleMarkerLabels === 'function') {
      mapRef.value.toggleMarkerLabels(visible);
    }
  },
  // 标记鼠标事件相关
  getCurrentHoveredMarker: computed(() => currentHoveredMarker.value),
  getCurrentPopover: computed(() => currentPopover.value),
  // 弹窗相关方法
  showHoverPopover: (marker: Marker) => {
    if (mapRef.value && typeof mapRef.value.showPopover === 'function') {
      mapRef.value.showPopover(marker, false);
    }
  },
  showClickPopover: (marker: Marker) => {
    if (mapRef.value && typeof mapRef.value.showPopover === 'function') {
      mapRef.value.showPopover(marker, true);
    }
  },
  hidePopover: (isClick: boolean = false) => {
    if (mapRef.value && typeof mapRef.value.hidePopover === 'function') {
      mapRef.value.hidePopover(isClick);
    }
  },
  // 新增调试相关功能
  logInfo: (message: string, data?: any) => logEvent('info', message, data),
  logWarning: (message: string, data?: any) => logEvent('warning', message, data),
  logError: (message: string, data?: any) => logEvent('error', message, data),
  clearLogs: () => debugPanelRef.value?.clearLogs(),
  // 获取所有图形
  getAllShapes: () => {
    if (mapRef.value) {
      return mapRef.value.getShapes();
    }
    return [];
  },
  // 获取所有标记点
  getAllMarkers: () => props.markers
});

// 监听地图类型变化
watch(() => props.type, () => {
  loadMapScript();
});

// 组件挂载时加载地图
onMounted(() => {
  logEvent('info', '地图组件初始化', {
    type: props.type,
    center: props.center,
    zoom: props.zoom
  });

  // 获取地图容器引用
  nextTick(() => {
    const container = document.querySelector('.sc-map-container');
    if (container) {
      mapContainer.value = container as HTMLElement;
    }
  });

  loadMapScript();
  isToolsCollapsed.value = props.toolsCollapsed;

  // 初始化聚合开关状态 - 使用toolsStatus.cluster或回退到autoEnableCluster
  isClusterEnabled.value = props.toolsStatus?.cluster === true || props.autoEnableCluster === true;

  // 根据toolsStatus初始化其他工具状态
  showMousePosition.value = props.toolsStatus?.position === true || props.toolsOptions.position;
  showMarkerLabels.value = props.toolsStatus?.showLabels !== false; // 默认为true
  showDebugPanel.value = props.toolsStatus?.debug === true;

  // 设置工具栏中的自定义工具
  setTimeout(() => {
    setupMapTools();

    // 只有在聚合功能启用时才调用enableCluster
    if (isClusterEnabled.value && mapRef.value && typeof mapRef.value.enableCluster === 'function') {
      const clusterOptions = {
        ...props.clusterOptions,
        enable: true
      };
      mapRef.value.enableCluster(clusterOptions);
    }
  }, 500); // 延时确保工具栏和地图都已加载
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

  // 更新标记点标签显示状态
  if (newOptions.showLabels !== undefined && showMarkerLabels.value !== newOptions.showLabels) {
    showMarkerLabels.value = newOptions.showLabels;
    toggleMarkerLabels(newOptions.showLabels);
  }
}, { deep: true });

// 监听showMousePosition变化

onMounted(() => {
});

onUnmounted(() => {
  nextTick(() => {
    mapRef.value?.removeMouseMoveListener();
  });
});

// 监听markers属性变化，更新标记点可见性
watch(() => props.markers, () => {
  // 如果有激活的分类过滤器，更新标记点可见性
  if (activeCategories.value.length > 0) {
    updateMarkersVisibility();
  }
}, { deep: true });

// 增加对 toolsOptions.cluster 的监听
watch(() => props.toolsOptions.cluster, (enabled) => {
  // 如果工具栏初始化了，设置聚合按钮状态
  if (toolbarRef.value && toolbarRef.value.setToolState) {
    toolbarRef.value.setToolState('cluster', enabled);

    // 如果 isClusterEnabled 已经被设置且与 toolsOptions.cluster 不一致，更新聚合状态
    if (isClusterEnabled.value !== enabled) {
      isClusterEnabled.value = !!enabled; // 确保是布尔值
      if (mapRef.value) {
        if (enabled) {
          const clusterOptions: ClusterOptions = {
            ...props.clusterOptions,
          };
          // 调用地图组件的聚合功能
          if (typeof mapRef.value.enableCluster === 'function') {
            mapRef.value.enableCluster(clusterOptions);
          }
        } else {
          // 关闭聚合
          logEvent('info', '关闭标记点聚合');
          if (typeof mapRef.value.disableCluster === 'function') {
            mapRef.value.disableCluster();
          }
        }
      }
    }
  }
});

// 鼠标悬停相关事件处理
const onMarkerMouseEnter = (marker: any) => {
  try {
    // 在调试面板记录事件
    logEvent('event', 'marker-mouseenter', marker);

    // 如果设置了自定义事件处理
    if (props.customMapEvents) {
      // 可以在这里添加自定义的鼠标悬停行为
      // 例如：更新当前悬停的标记状态
      currentHoveredMarker.value = marker;
    }

    // 触发外部监听的事件
    emit('marker-mouseenter', marker);
  } catch (error) {
    console.error('处理marker-mouseenter事件时出错:', error);
  }
};

const onMarkerMouseLeave = (marker: any) => {
  try {
    // 在调试面板记录事件
    logEvent('event', 'marker-mouseleave', marker);

    // 如果设置了自定义事件处理
    if (props.customMapEvents) {
      // 可以在这里添加自定义的鼠标离开行为
      // 例如：清除当前悬停的标记状态
      if (currentHoveredMarker.value === marker) {
        currentHoveredMarker.value = null;
      }
    }

    // 触发外部监听的事件
    emit('marker-mouseleave', marker);
  } catch (error) {
    console.error('处理marker-mouseleave事件时出错:', error);
  }
};

const onHoverPopoverShow = (data: any) => {
  logEvent('event', 'hover-popover-show', data);
  emit('hover-popover-show', data);

  // 记录当前显示的弹窗
  currentPopover.value = {
    type: 'hover',
    marker: data.marker,
    position: data.position,
    element: data.element
  };

  // 向弹窗元素添加自定义样式和交互
  if (data.element) {
    // 添加自定义CSS类以便更好地控制样式
    data.element.classList.add('sc-map-hover-popover');

    // 添加平滑的显示动画
    data.element.style.opacity = '0';
    data.element.style.transform = 'translateY(5px)';
    data.element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

    // 触发重排以应用过渡效果
    setTimeout(() => {
      data.element.style.opacity = '1';
      data.element.style.transform = 'translateY(0)';
    }, 10);
  }
};

const onHoverPopoverHide = (data: any) => {
  logEvent('event', 'hover-popover-hide', data);
  emit('hover-popover-hide', data);

  // 清除当前弹窗记录（如果是悬停弹窗）
  if (currentPopover.value && currentPopover.value.type === 'hover') {
    currentPopover.value = null;
  }
};

const onClickPopoverShow = (data: any) => {
  logEvent('event', 'click-popover-show', data);
  emit('click-popover-show', data);

  // 记录当前显示的弹窗
  currentPopover.value = {
    type: 'click',
    marker: data.marker,
    position: data.position,
    element: data.element
  };

  // 向点击弹窗元素添加自定义样式和交互
  if (data.element) {
    // 添加自定义CSS类以便更好地控制样式
    data.element.classList.add('sc-map-click-popover');

    // 添加平滑的显示动画
    data.element.style.opacity = '0';
    data.element.style.transform = 'scale(0.95)';
    data.element.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

    // 触发重排以应用过渡效果
    setTimeout(() => {
      data.element.style.opacity = '1';
      data.element.style.transform = 'scale(1)';
    }, 10);

    // 添加关闭按钮(如果还没有)
    if (!data.element.querySelector('.sc-map-popover-close')) {
      const closeButton = document.createElement('div');
      closeButton.className = 'sc-map-popover-close';
      closeButton.textContent = '×';
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        // 调用隐藏弹窗方法
        if (mapRef.value && typeof mapRef.value.hidePopover === 'function') {
          mapRef.value.hidePopover(true);
        }
      });
      data.element.appendChild(closeButton);
    }
  }
};

const onClickPopoverHide = (data: any) => {
  logEvent('event', 'click-popover-hide', data);
  emit('click-popover-hide', data);

  // 清除当前弹窗记录（如果是点击弹窗）
  if (currentPopover.value && currentPopover.value.type === 'click') {
    currentPopover.value = null;
  }
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
      // 获取标记点ID (优先使用markerId，其次从marker.data.id获取)
      const newMarkerId = newMarker.markerId || newMarker.data?.id;

      // 如果标记点没有ID，则不进行去重，直接添加
      if (!newMarkerId) return true;

      // 检查是否存在相同ID的标记点
      return !existingMarkers.some(existingMarker => {
        const existingId = existingMarker?.markerId || existingMarker?.data?.id;
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
      const markerId = marker.markerId || marker.data?.id;

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

const addPolygon = (points: [number, number][], style?: ShapeStyle, id?: string) => {
  if (mapRef.value) {
    return mapRef.value.addPolygon(points, style, id);
  }
};

const addCircle = (center: [number, number], radius: number, style?: ShapeStyle, id?: string) => {
  if (mapRef.value) {
    return mapRef.value.addCircle(center, radius, style, id);
  }
};

const addRectangle = (bounds: [[number, number], [number, number]], style?: ShapeStyle, id?: string) => {
  if (mapRef.value) {
    return mapRef.value.addRectangle(bounds, style, id);
  }
};

const addPolyline = (points: [number, number][], style?: ShapeStyle, id?: string) => {
  if (mapRef.value) {
    return mapRef.value.addPolyline(points, style, id);
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

// 更新鼠标位置
const updateMousePosition = (lat: number, lng: number) => {
  mousePosition.value = [lat, lng];
};

// 格式化距离
const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${distance.toFixed(2)}米`;
  } else {
    return `${(distance / 1000).toFixed(2)}公里`;
  }
};

// 开始绘制
const startDrawing = (type: ToolType) => {
  if (mapRef.value) {
    try {
      // 先更新当前工具状态
      currentTool.value = type;

      // 更新工具栏按钮状态为激活
      if (toolbarRef.value) {
        toolbarRef.value.setToolState(type, true);
      }

      // 记录日志
      logEvent('info', `启动绘图工具: ${type} (可连续多次绘制，手动取消才会停止)`);

      // 最后启动绘图操作
      mapRef.value.startDrawing(type);
    } catch (error) {
      logEvent('error', `启动绘图工具失败: ${type}`, error);
      console.error(`启动绘图工具失败: ${type}`, error);
    }
  }
};

// 停止绘制
const stopDrawing = () => {
  if (mapRef.value) {
    try {
      // 获取当前工具类型
      const currentDrawingTool = currentTool.value;

      // 停止绘制
      mapRef.value.stopDrawing();

      // 如果当前工具是绘图工具，清除当前工具状态
      if (currentDrawingTool && ['circle', 'rectangle', 'polygon', 'polyline'].includes(currentDrawingTool)) {
        // 清除工具栏状态
        if (toolbarRef.value) {
          toolbarRef.value.setToolState(currentDrawingTool as ToolType, false);
        }

        // 重置当前工具
        if (currentTool.value === currentDrawingTool) {
          currentTool.value = '';
        }
      }

      logEvent('info', '停止绘制');
    } catch (error) {
      logEvent('error', '停止绘图工具失败', error);
      console.error('停止绘图工具失败:', error);
    }
  }
};

// 切换工具栏折叠状态
const toggleToolbar = () => {
  isToolsCollapsed.value = !isToolsCollapsed.value;
};

// 设置地图工具
const setupMapTools = () => {
  if (!toolbarRef.value) return;

  // 设置工具初始状态
  if (showMousePosition.value) {
    toolbarRef.value.setToolState('position', true);
  }

  // 设置标记点标签显示状态
  toolbarRef.value.setToolState('showLabels', showMarkerLabels.value);

  // 设置聚合状态 - 默认不激活
  toolbarRef.value.setToolState('cluster', isClusterEnabled.value);

  // 如果当前工具是distance，设置其状态为激活
  if (currentTool.value === 'distance') {
    toolbarRef.value.setToolState('distance', true);
  }

  // 如果当前工具是绘图工具，设置其状态为激活
  if (currentTool.value && ['circle', 'rectangle', 'polygon', 'polyline'].includes(currentTool.value)) {
    toolbarRef.value.setToolState(currentTool.value, true);
  }
};

// 清除距离测量
const clearDistance = () => {
  distanceResult.value = null;
  if (mapRef.value) {
    mapRef.value.stopMeasure();
  }
  setDistanceToolState(false);
  logEvent('info', '清除测距结果');
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

// 获取地图当前可视区域的四个角坐标
const getVisibleBounds = () => {
  if (!mapRef.value) {
    return null;
  }

  try {
    // 直接调用地图组件的实现
    return mapRef.value.getVisibleBounds();
  } catch (error) {
    logEvent('error', '获取地图可视区域边界失败', error);
    console.error('获取地图可视区域边界失败:', error);
    return null;
  }
};

// 获取地图可视范围内的所有标记点
const getVisibleMarkers = () => {
  if (!mapRef.value) {
    return [];
  }

  try {
    // 直接调用地图组件的实现
    return mapRef.value.getVisibleMarkers();
  } catch (error) {
    logEvent('error', '获取可视范围内标记点失败', error);
    console.error('获取可视范围内标记点失败:', error);
    return [];
  }
};

// 开始测量
const startMeasure = () => {
  if (mapRef.value) {
    logEvent('info', '开始测距', { mapType: props.type });
    console.log('ScMap调用地图组件startMeasure方法');
    try {
      mapRef.value.startMeasure();
    } catch (error) {
      console.error('调用测距方法失败:', error);
    }
  } else {
    console.error('地图引用不存在，无法启动测距');
  }
};

// 停止测量
const stopMeasure = () => {
  if (mapRef.value) {
    logEvent('info', '停止测距');
    console.log('ScMap调用地图组件stopMeasure方法');
    mapRef.value.stopMeasure();
    // 清除测距结果
    distanceResult.value = null;
    // 重置工具状态
    if (toolbarRef.value) {
      toolbarRef.value.setToolState('distance', false);
    }
  }
};

// 添加一个新方法来设置距离测量工具的状态
const setDistanceToolState = (active: boolean) => {
  if (toolbarRef.value) {
    toolbarRef.value.setToolState('distance', active);
    if (!active) {
      distanceResult.value = null;
    }
    currentTool.value = active ? 'distance' : '';
  }
};

// 工具栏相关方法
const addMapTool = (id: string, icon: string, label: string, callback?: string) => {
  if (toolbarRef.value) {
    return toolbarRef.value.addTool(id, icon, label, callback);
  }
  return false;
};

const removeMapTool = (id: string) => {
  if (toolbarRef.value) {
    return toolbarRef.value.removeTool(id);
  }
  return false;
};

const disableMapTool = (id: string, disabled: boolean = true) => {
  if (toolbarRef.value) {
    return toolbarRef.value.disableTool(id, disabled);
  }
  return false;
};

const setMapToolIcon = (id: string, icon: string) => {
  if (toolbarRef.value) {
    return toolbarRef.value.setToolIcon(id, icon);
  }
  return false;
};

const setMapToolLabel = (id: string, label: string) => {
  if (toolbarRef.value) {
    return toolbarRef.value.setToolLabel(id, label);
  }
  return false;
};

const setMapToolsPerRow = (count: number) => {
  if (toolbarRef.value) {
    return toolbarRef.value.setItemsPerRow(count);
  }
  return false;
};

// 清除所有
const clearAll = () => {
  if (mapRef.value) {
    mapRef.value.clearMarkers();
    mapRef.value.clearShapes();

    // 如果当前工具是测距工具，确保先停止测距
    if (currentTool.value === 'distance') {
      stopMeasure();
    } else {
      // 如果不是测距工具，只清除测距结果
      distanceResult.value = null;
    }
  }

  // 重置当前工具状态
  currentTool.value = '';

  // 重置所有工具栏按钮状态
  if (toolbarRef.value) {
    const allTools = ['distance', 'circle', 'rectangle', 'polygon', 'polyline', 'marker'];
    allTools.forEach(tool => {
      toolbarRef.value.setToolState(tool, false);
    });
  }

  logEvent('info', '清除所有图形和标记点');
};

// 设置鼠标样式
const setCursorStyle = (style: string) => {
  if (mapRef.value && mapRef.value.setCursorStyle) {
    mapRef.value.setCursorStyle(style);
  }
};

// 切换标记点标签显示
const toggleMarkerLabels = (show: boolean) => {
  if (mapRef.value) {
    showMarkerLabels.value = show;
    mapRef.value.toggleMarkerLabels(show);

    // 确保与工具栏状态同步
    if (toolbarRef.value) {
      toolbarRef.value.setToolState('showLabels', show);
    }

    // 记录日志
    logEvent('info', `${show ? '显示' : '隐藏'}标记点标签`);
  }
};

// 关闭调试面板
const closeDebugDialog = () => {
  showDebugPanel.value = false;
  toolbarRef.value.setToolState('debug', false);
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

// 处理工具点击事件
const handleToolClick = (toolType: ToolType | '' | 'debug' | 'showLabels' | 'cluster' | 'distance', callback?: string, state?: boolean) => {
  // 处理开关类型的工具
  if (state !== undefined) {
    // 有state参数表示是开关类型工具
    // 根据state参数进行对应操作
    if (toolType === 'marker') {
      if (state) {
        mapRef.value?.enableAddMarker();
        currentTool.value = 'marker'; // 确保工具状态正确
      } else {
        mapRef.value?.disableAddMarker();
        currentTool.value = ''; // 重置工具状态
        currentMarkerType.value = null; // 清除当前选择的标记类型
        // 确保标记面板关闭
        if (toolbarRef.value) {
          toolbarRef.value.hideMarkerPanel();
        }
      }
    }

    if (toolType === 'position') {
      showMousePosition.value = state
    }

    if (toolType === 'debug') {
      showDebugPanel.value = state;
    }

    if (toolType === 'showLabels') {
      showMarkerLabels.value = state;
      if (mapRef.value && mapRef.value.toggleMarkerLabels) {
        mapRef.value.toggleMarkerLabels(state);
        logEvent('info', `${state ? '显示' : '隐藏'}标记点标签`);
      }
    }

    if (toolType === 'cluster') {
      if (mapRef.value) {
        // 保存聚合状态
        isClusterEnabled.value = state;

        if (state) {
          // 开启聚合
          logEvent('info', '开启标记点聚合');
          // 创建新的聚合配置对象，确保 enable 设置为 true
          const clusterOptions: ClusterOptions = {
            ...props.clusterOptions,
          };
          // 调用地图组件的聚合功能
          if (typeof mapRef.value.enableCluster === 'function') {
            mapRef.value.enableCluster(clusterOptions);
          }
        } else {
          // 关闭聚合
          logEvent('info', '关闭标记点聚合');
          if (typeof mapRef.value.disableCluster === 'function') {
            mapRef.value.disableCluster();
          }
        }
      }
    }

    if (toolType === 'distance') {
      if (state) {
        // 启动距离测量
        console.log('开始距离测量工具（开关模式）');
        currentTool.value = 'distance';
        distanceResult.value = null; // 清除之前的测距结果
        startMeasure();
      } else {
        // 停止距离测量
        console.log('停止距离测量工具（开关模式）');
        stopMeasure(); // stopMeasure方法中已包含清除测距结果和重置状态
      }
    }

    // 处理绘图工具 - circle, rectangle, polygon, polyline
    if (['circle', 'rectangle', 'polygon', 'polyline'].includes(toolType)) {
      // 如果激活绘图工具，先重置其他绘图工具的状态
      if (state) {
        // 停止除当前工具以外的所有绘图工具
        const drawingTools = ['circle', 'rectangle', 'polygon', 'polyline'];
        drawingTools.forEach(tool => {
          if (tool !== toolType && toolbarRef.value) {
            // 重置其他绘图工具的UI状态
            toolbarRef.value.setToolState(tool as ToolType, false);
          }
        });

        // 启动绘图
        logEvent('info', `启动绘图工具: ${toolType} (可连续多次绘制，手动取消才会停止)`);
        currentTool.value = toolType;
        startDrawing(toolType as ToolType);
      } else {
        // 停止绘图
        logEvent('info', `停止绘图工具: ${toolType}`);
        stopDrawing();
        currentTool.value = '';
      }
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

  logEvent('event', `tool-click`, { tool: toolType });

  if (currentTool.value === toolType) {
    // 如果是当前激活的工具，则取消选择
    currentTool.value = '';
    stopCurrentTool();
  } else {
    // 否则切换到新工具
    stopCurrentTool(); // 确保先停止当前工具
    currentTool.value = toolType;
    startCurrentTool(toolType);
  }

  // 如果有回调方法名，尝试执行
  if (callback && typeof callback === 'string' && mapRef.value && typeof mapRef.value[callback] === 'function') {
    try {
      mapRef.value[callback]();
    } catch (error) {
      console.error(`执行回调方法 ${callback} 失败:`, error);
    }
  }
};

// 启动当前选择的工具
const startCurrentTool = (toolType: ToolType) => {
  logEvent('info', `启动工具: ${toolType}`);

  try {
    if (toolType === 'distance') {
      console.log('开始距离测量工具');
      currentTool.value = 'distance'; // 确保状态正确
      startMeasure();
    } else if (['circle', 'polygon', 'rectangle', 'polyline'].includes(toolType)) {
      // 停止其他绘图工具
      const drawingTools = ['circle', 'rectangle', 'polygon', 'polyline'] as ToolType[];
      drawingTools.forEach(tool => {
        if (tool !== toolType && toolbarRef.value) {
          // 重置其他绘图工具的UI状态
          toolbarRef.value.setToolState(tool, false);
        }
      });

      // 设置绘图工具状态
      setDrawingToolState(toolType, true);
      // 开始绘制
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
  } catch (error) {
    console.error(`启动工具 ${toolType} 失败:`, error);
    // 出错时重置工具状态
    currentTool.value = '';
  }
};

// 停止当前工具
const stopCurrentTool = () => {
  const prevTool = currentTool.value;
  if (prevTool) {
    logEvent('info', `停止工具: ${prevTool}`);

    try {
      if (prevTool === 'distance') {
        stopMeasure(); // 现在stopMeasure包含完整的清理逻辑
      } else if (['circle', 'polygon', 'rectangle', 'polyline'].includes(prevTool as string)) {
        stopDrawing();
      } else if (prevTool === 'marker') {
        // 禁用添加标记模式
        if (mapRef.value) {
          mapRef.value.disableAddMarker();
          // 确保标记面板关闭
          if (toolbarRef.value) {
            toolbarRef.value.hideMarkerPanel();
          }
          // 清除当前选择的标记类型
          currentMarkerType.value = null;
        }
      }
    } catch (error) {
      console.error(`停止工具 ${prevTool} 失败:`, error);
    }
  }
};

// 添加用于设置绘图工具状态的方法
const setDrawingToolState = (type: ToolType | '', active: boolean) => {
  if (!toolbarRef.value || !type || !['circle', 'rectangle', 'polygon', 'polyline'].includes(type)) {
    return;
  }

  // 更新工具栏按钮状态
  toolbarRef.value.setToolState(type, active);

  // 更新当前工具状态
  if (active) {
    currentTool.value = type;
  } else if (currentTool.value === type) {
    currentTool.value = '';
  }

  logEvent('info', `设置绘图工具 ${type} 状态为 ${active ? '激活' : '停用'}`);
};

// 在refs部分添加
const mapContainer = ref<HTMLElement | null>(null);
const hoverPopoverRef = ref<any>(null);
const clickPopoverRef = ref<any>(null);
const hoveredMarker = ref<any>(null);
const clickedMarker = ref<any>(null);
const showHoverPopover = ref(false);
const showClickPopover = ref(false);
const popoverPosition = ref<[number, number]>([0, 0]);
const hoveredMarkerTemplate = ref('');
const clickedMarkerTemplate = ref('');

// 处理悬停弹窗关闭
const handleHoverPopoverClose = () => {
  if (showHoverPopover.value) {
    showHoverPopover.value = false;

    // 触发事件
    emit('hover-popover-hide', {
      marker: hoveredMarker.value
    });

    hoveredMarker.value = null;
  }
};

// 处理点击弹窗关闭
const handleClickPopoverClose = () => {
  if (showClickPopover.value) {
    showClickPopover.value = false;

    // 触发事件
    emit('click-popover-hide', {
      marker: clickedMarker.value
    });

    clickedMarker.value = null;
  }
};
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

/* 标记弹窗样式 */
:deep(.sc-map-hover-popover),
:deep(.sc-map-click-popover) {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  max-width: 300px;
  min-width: 120px;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
  pointer-events: auto;
  border: 1px solid #ebeef5;
}

:deep(.sc-map-hover-popover) {
  padding: 8px 12px;
  z-index: 1000;
}

:deep(.sc-map-click-popover) {
  padding: 12px 16px;
  z-index: 1001;
}

:deep(.sc-map-hover-popover h3),
:deep(.sc-map-click-popover h3) {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

:deep(.sc-map-hover-popover p),
:deep(.sc-map-click-popover p) {
  margin: 5px 0;
  color: #606266;
}

:deep(.sc-map-popover-close) {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  font-size: 18px;
  font-weight: bold;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

:deep(.sc-map-popover-close:hover) {
  background-color: #f2f6fc;
  color: #606266;
}

/* 聚合点弹窗特殊样式 */
:deep(.cluster-popover) {
  text-align: center;
}

:deep(.cluster-popover h3) {
  color: #409eff;
}

:deep(.cluster-popover p:last-child) {
  font-style: italic;
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}
</style>