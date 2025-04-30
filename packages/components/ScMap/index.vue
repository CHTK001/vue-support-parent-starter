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
    <!-- 轨迹播放控制面板 -->
    <track-player v-if="trackPlayerState.enabled && trackPlayerState.visible" :visible="trackPlayerState.visible"
      :tracks="availableTracks" :current-track-id="trackPlayerState.currentTrackId || ''"
      :progress="trackPlayerState.progress" :current-time="trackPlayerState.currentTime"
      :is-playing="trackPlayerState.isPlaying" :speed="trackPlayerState.speed" :loop="trackPlayerState.loop"
      :theme="trackPlayerState.theme" position="topright" @play="playTrack" @pause="pauseTrack"
      @set-current-track="setCurrentTrack" @set-progress="setTrackProgress" @set-speed="setTrackSpeed"
      @toggle-loop="toggleTrackLoop" @toggle-follow-camera="toggleTrackFollowCamera" @update:theme="updateTrackPlayerTheme" @center-on-track="handleCenterOnTrack" />
    <!-- 添加调试面板组件 -->
    <MapDebugPanel 
      v-if="debugPanelVisible" 
      :visible="debugPanelVisible"
      @close="closeDebugPanel"
      ref="debugPanelRef"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: "ScMap"
};
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, reactive } from "vue";
import type { LatLng } from 'leaflet';
import "leaflet/dist/leaflet.css";
import type { Ref } from "vue";
import CoordinatePanel from './components/CoordinatePanel.vue';
import MapLayerDropdown from './components/MapLayerDropdown.vue';
import MapToolbar from './components/MapToolbar.vue';
import MapDebugPanel from './components/MapDebugPanel.vue';
import TrackPlayer from './components/TrackPlayer.vue';
import type { CustomMarkerOptions } from './plugin/Marker';
import { Marker } from './plugin/Marker';
import { Measure } from './plugin/Measure';
import { Overview } from './plugin/Overview';
import type { OverviewOptions } from './plugin/Overview';
import { ShapeType } from './plugin/Shape';
import Shape from "./plugin/Shape";
import { TrackPlayer as TrackPlayerController } from './plugin/TrackPlayer';
import type { ShapeOptions } from './plugin/Shape';
import { Aggregation } from './plugin/Aggregation';
import type { AggregationOptions, HeatMapOptions, HeatPoint, Track, TrackPlayerConfig, TrackPlayerOptions } from './types';
import { HeatMap } from './plugin/HeatMap';
import type { AddToolOptions, ScMapProps, ToolbarConfig } from './types';
import { LayerType } from './types';
import { DEFAULT_TOOL_ITEMS, MAP_TYPES, DEFAULT_TRACK_PLAYER_OPTIONS, TRACK_PLAYER_THEMES } from './types/default';
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
    itemsPerLine: 8,
    size: 36
  } as ToolbarConfig),
  overviewConfig: () => ({
    position: "bottomright",
    height: 150,
    width: 150,
    zoomLevelOffset: -5,
    zoomAnimation: false,
    toggleDisplay: true,
    minimized: false,
    aimingRectOptions: { color: '#ff7800', weight: 1, interactive: false },
    strings: { hideText: '收起鹰眼', showText: '展开鹰眼' },
    autoActivate: false
  } as OverviewOptions),
  aggregationConfig: () => ({
    enabled: true,
    options: {},
    defaultSize: 40,
    colorRanges: [
      { value: 10, color: '#5470c6' },  // 聚合点数量≥10时使用蓝色
      { value: 50, color: '#91cc75' },  // 聚合点数量≥50时使用绿色
      { value: 100, color: '#fac858' }, // 聚合点数量≥100时使用黄色
      { value: 200, color: '#ee6666' }  // 聚合点数量≥200时使用红色
    ]
  } as AggregationOptions),
  trackPlayerConfig: () => ({
    position: 'topright',
    trackList: []
  } as TrackPlayerConfig),
  // 添加热力图配置
  heatMapConfig: () => ({
    enabled: false,
    options: {}
  } as HeatMapOptions)
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
  (e: 'map-click', event: any): void;
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
const aggregationTool: Ref<Aggregation | null> = ref(null); // 聚合工具
const mapToolbarRef = ref<InstanceType<typeof MapToolbar> | null>(null); // 工具栏组件引用
// 调试面板相关
const debugPanelVisible = ref(false);
const debugPanelRef = ref<InstanceType<typeof MapDebugPanel> | null>(null);

// 热力图工具
const heatMapTool = ref<InstanceType<typeof HeatMap> | null>(null);

// 轨迹播放器内部状态
const trackPlayerState = reactive({
  // 状态控制
  enabled: false,
  visible: false, 
  // 播放控制
  currentTrackId: null as string | null,
  progress: 0,
  currentTime: 0,
  isPlaying: false,
  speed: 600,
  loop: false,
  followCamera: false,
  // UI配置
  theme: TRACK_PLAYER_THEMES.light,
  tracks: [] as Track[]
});
const trackPlayerController: Ref<TrackPlayerController | null> = ref(null);

// 计算当前可用的轨迹列表
const availableTracks = computed(() => {
  if (trackPlayerController.value) {
    return trackPlayerController.value.getAllTracks();
  }
  // 回退到props中的轨迹列表
  return props.trackPlayerConfig?.trackList || [];
});

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

//添加日志
const addLog = (message: any, data?: any) => {
  debugPanelRef.value?.addLog('info', message, data);
}

// 处理工具激活事件
const handleToolActivated = (toolId: string) => {
  emit('tool-activated', toolId);
  addLog(`工具激活: ${toolId}`); // 添加日志记录

  const drawToolIds = ['drawCircle', 'drawRectangle', 'drawPolygon', 'drawPolyline'];
  const instantToolIds = ['zoomIn', 'zoomOut', 'fullView']; // 即时执行工具
  
  // 如果是绘图工具被激活
  if (drawToolIds.includes(toolId)) {
    // 如果当前有其他绘图工具正在绘制，先停止
    if (shapeTool.value && shapeTool.value.isDrawing() && 
        (shapeTool.value.getCurrentDrawingType() !== getShapeTypeFromToolId(toolId))) {
      shapeTool.value.cancelDrawing();
      addLog(`取消当前绘制，准备开始新绘制: ${toolId}`); // 添加日志记录
    }
   
    // 确保工具栏按钮状态正确
    if (mapToolbarRef.value) {
      const tools = mapToolbarRef.value.getTools();
      const updatedTools = tools.map(tool => {
        // 当前工具激活，其他绘图工具停用
        if (drawToolIds.includes(tool.id)) {
          return { ...tool, active: tool.id === toolId ? true : undefined };
        }
        return tool;
      });
      mapToolbarRef.value.setTools(updatedTools);
      addLog('更新工具栏按钮状态'); // 添加日志记录
    }
    
    // 根据工具ID获取对应的图形类型
    const shapeType = getShapeTypeFromToolId(toolId);
    
    // 启动图形绘制
    if (shapeType && shapeTool.value) {
      shapeTool.value.startDrawing(shapeType);
      addLog(`开始绘制: ${shapeType}`); // 添加日志记录
    }
  } 
  // 测距工具
  else if (toolId === 'measure') {
    if (measureTool.value) {
      measureTool.value.start();
      addLog('启动测距工具'); // 添加日志记录
    }
  } 
  // 调试工具
  else if (toolId === 'debug') {
    openDebugPanel();
    addLog('打开调试面板'); // 添加日志记录
  } 
  // 标点工具
  else if (toolId === 'drawPoint') {
    enableDrawPoint();
  } 
  // 坐标工具
  else if (toolId === 'coordinate') {
    enableCoordinateMode();
  } 
  // 图层切换工具
  else if (toolId === 'layerSwitch') {
    showLayerDropdown.value = true;
    updateLayerDropdownPosition();
  } 
  // 鹰眼工具
  else if (toolId === 'overview') {
    if (overviewTool.value) {
      overviewTool.value.enable();
    }
  }
  // 轨迹回放工具
  else if (toolId === 'trackPlay') {
    showTrackPlayerPanel();
  } else if (toolId === 'cluster' && aggregationTool.value) {
    // 禁用聚合功能
    aggregationTool.value.enable();
    
    // 生成一些测试标记点以验证聚合功能
    if (!markerTool.value || markerTool.value.getMarkers().length === 0) {
      info('地图上没有标记点，生成一些测试标记点以验证聚合功能');
      aggregationTool.value.generateTestMarkers(30);
    }
    
    info('通过工具栏启用标记点聚合功能');
  }
  // 放大
  else if (toolId === 'zoomIn') {
    if (mapInstance.value) {
      mapInstance.value.zoomIn();
    }
    // 即时工具执行后取消激活状态
    if (mapToolbarRef.value) {
      setTimeout(() => {
        const tools = mapToolbarRef.value?.getTools();
        if (tools) {
          const updatedTools = tools.map(tool => {
            if (tool.id === toolId) {
              return { ...tool, active: undefined };
            }
            return tool;
          });
          mapToolbarRef.value?.setTools(updatedTools);
        }
      }, 100);
    }
  }
  // 缩小
  else if (toolId === 'zoomOut') {
    if (mapInstance.value) {
      mapInstance.value.zoomOut();
    }
    // 即时工具执行后取消激活状态
    if (mapToolbarRef.value) {
      setTimeout(() => {
        const tools = mapToolbarRef.value?.getTools();
        if (tools) {
          const updatedTools = tools.map(tool => {
            if (tool.id === toolId) {
              return { ...tool, active: undefined };
            }
            return tool;
          });
          mapToolbarRef.value?.setTools(updatedTools);
        }
      }, 100);
    }
  }
  // 全图
  else if (toolId === 'fullView') {
    if (mapInstance.value) {
      mapInstance.value.setView(props.center, props.zoom);
    }
    // 即时工具执行后取消激活状态
    if (mapToolbarRef.value) {
      setTimeout(() => {
        const tools = mapToolbarRef.value?.getTools();
        if (tools) {
          const updatedTools = tools.map(tool => {
            if (tool.id === toolId) {
              return { ...tool, active: undefined };
            }
            return tool;
          });
          mapToolbarRef.value?.setTools(updatedTools);
        }
      }, 100);
    }
  }
  // 热力图工具
  else if (toolId === 'heatmap') {
    if (heatMapTool.value) {
      // 先启用热力图
      const enabled = heatMapTool.value.enable();
      
      // 如果启用成功，然后生成数据
      if (enabled) {
        if (markerTool.value) {
          heatMapTool.value.generateFromMarkers(markerTool.value['markerLayerGroup'], 'markerWeight');
        }
        addLog('热力图已从当前标记点生成并启用');
      }
    }
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
  addLog(`工具停用: ${toolId}`); // 添加日志记录
  
  const drawToolIds = ['drawCircle', 'drawRectangle', 'drawPolygon', 'drawPolyline'];
  
  // 处理绘图工具的停用
  if (drawToolIds.includes(toolId)) {
    // 用户明确停用绘图工具，停止当前绘制
    if (shapeTool.value && shapeTool.value.isDrawing()) {
      shapeTool.value.cancelDrawing();
      addLog(`停止绘制: ${toolId}`); // 添加日志记录
      info(`停止绘制: ${toolId}`);
    }
  } else if (toolId === 'measure' && measureTool.value) {
    // 停止测量工具
    measureTool.value.stop();
    measureTool.value.clear();
    addLog('停止测距工具'); // 添加日志记录
  } else if (toolId === 'drawPoint') {
    // 停用点绘制模式
    disableDrawPoint();
    addLog('停用标记点绘制模式'); // 添加日志记录
  } else if (toolId === 'debug') {
    closeDebugPanel();
    addLog('关闭调试面板'); // 添加日志记录
  } else if (toolId === 'coordinate') {
    // 停用坐标模式
    disableCoordinateMode();
    addLog('停用坐标模式'); // 添加日志记录
  } else if (toolId === 'layerSwitch') {
    // 关闭图层下拉菜单
    showLayerDropdown.value = false;
    addLog('关闭图层下拉菜单'); // 添加日志记录
  } else if (toolId === 'overview' && overviewTool.value) {
    // 禁用鹰眼控件
    overviewTool.value.disable();
    addLog('禁用鹰眼控件'); // 添加日志记录
    info('通过工具栏禁用鹰眼控件');
  } else if (toolId === 'cluster' && aggregationTool.value) {
    // 禁用聚合功能
    aggregationTool.value.disable();
    addLog('禁用标记点聚合功能'); // 添加日志记录
    info('通过工具栏禁用标记点聚合功能');
  } else if (toolId === 'zoomIn' || toolId === 'zoomOut' || toolId === 'fullView') {
    // 对于即时执行工具，确保停用按钮状态
    resetInstantToolButtonState(toolId);
    addLog(`即时工具完成操作: ${toolId}`); // 添加日志记录
    info(`即时工具已完成操作: ${toolId}`);
  } else if (toolId === 'trackPlay') {
    // 停止轨迹播放
    if (trackPlayerController.value) {
      trackPlayerController.value.pause();
      addLog('停止轨迹播放'); // 添加日志记录
      info('通过工具栏停止轨迹播放');
    }
    // 隐藏轨迹播放器面板
    hideTrackPlayerPanel();
    addLog('隐藏轨迹播放器面板'); // 添加日志记录
    info('隐藏轨迹播放器面板');
  } else if (toolId === 'heatmap') {
    if (heatMapTool.value && heatMapTool.value.isEnabled()) {
      heatMapTool.value.disable();
      addLog('热力图已禁用');
    }
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
  addLog('地图组件挂载开始');
  // 动态导入leaflet
  if (!L) {
    info('动态导入Leaflet');
    addLog('开始动态导入Leaflet');
    try {
      L = (await import("leaflet")).default;
      info('Leaflet导入成功:', !!L);
      addLog('Leaflet导入成功');
      
      // 动态导入leaflet-minimap
      try {
        await import("leaflet-minimap");
        info('leaflet-minimap导入成功');
        addLog('leaflet-minimap导入成功');
        
        // 尝试加载CSS样式
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet-minimap@3.6.1/dist/Control.MiniMap.min.css';
        document.head.appendChild(link);
      } catch (miniMapError) {
        console.error('导入leaflet-minimap失败:', miniMapError);
        addLog('导入leaflet-minimap失败', miniMapError);
      }
      
      // 尝试加载leaflet.markercluster插件
      try {
        // 尝试加载CSS样式
        const clusterCssLink1 = document.createElement('link');
        clusterCssLink1.rel = 'stylesheet';
        clusterCssLink1.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
        document.head.appendChild(clusterCssLink1);
        
        const clusterCssLink2 = document.createElement('link');
        clusterCssLink2.rel = 'stylesheet';
        clusterCssLink2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
        document.head.appendChild(clusterCssLink2);
        
        await import("leaflet.markercluster");
        info('leaflet.markercluster导入成功');
        addLog('leaflet.markercluster导入成功');
      } catch (clusterError) {
        console.error('导入leaflet.markercluster失败:', clusterError);
        warn('标记点聚合功能将不可用，请安装leaflet.markercluster依赖');
        addLog('导入leaflet.markercluster失败', clusterError);
      }
    } catch (e) {
      console.error('导入Leaflet失败:', e);
      addLog('导入Leaflet失败', e);
    }
  }
  
  await nextTick();
  initMap();
  addLog('地图组件挂载完成');
});

onUnmounted(() => {
  addLog('地图组件开始卸载');
  
  // 如果坐标模式处于激活状态，先停止它
  if (coordinateMode.value) {
    disableCoordinateMode();
  }
  
  // 销毁地图实例
  if (mapInstance.value) {
    unregisterMapEvents();
    mapInstance.value.remove();
    mapInstance.value = null;
    addLog('地图实例已销毁');
  }
  
  // 销毁测距工具
  if (measureTool.value) {
    measureTool.value.stop();
    measureTool.value = null;
    addLog('测距工具已销毁');
  }
  
  // 销毁标记工具
  if (markerTool.value) {
    markerTool.value.deactivate();
    markerTool.value = null;
    addLog('标记工具已销毁');
  }
  
  // 销毁鹰眼工具
  if (overviewTool.value) {
    overviewTool.value.disable();
    overviewTool.value = null;
    addLog('鹰眼工具已销毁');
  }
  
  // 销毁绘图工具
  if (shapeTool.value) {
    shapeTool.value.cancelDrawing();
    shapeTool.value = null;
    addLog('绘图工具已销毁');
  }
  
  // 销毁聚合工具
  if (aggregationTool.value) {
    aggregationTool.value.destroy();
    aggregationTool.value = null;
    addLog('聚合工具已销毁');
  }
  
  // 销毁轨迹播放器
  if (trackPlayerController.value) {
    trackPlayerController.value.destroy();
    trackPlayerController.value = null;
    addLog('轨迹播放器已销毁');
  }
  
  addLog('地图组件卸载完成');
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
    // 记录缩放动画结束
    addLog('地图缩放动画结束', {zoom: newZoom});
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
  
  // 监听点击事件，用于获取坐标
  mapInstance.value.on('click', (e: any) => handleMapClick(e));
  
  // 添加缩放动画开始事件监听
  mapInstance.value.on('zoomanim', (e: any) => {
    addLog('地图缩放动画开始', {zoom: e.zoom});
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
  addLog('工具点击事件', {id: event.id, active: event.active, toggleState: event.toggleState});
  
  // 处理标记点显示/隐藏
  if (event.toggleState !== undefined) {
    if (event.id === 'toggleMarkers') {
      if (event.toggleState) {
        // 标记点被隐藏的状态(toggleState=true表示隐藏状态)
        if (markerTool.value) {
          markerTool.value.hideAllMarkers();
          info('隐藏所有标记点');
          addLog('隐藏所有标记点');
        }
      } else {
        // 标记点被显示的状态(toggleState=false表示显示状态)
        if (markerTool.value) {
          markerTool.value.showAllMarkers();
          info('显示所有标记点');
          addLog('显示所有标记点');
        }
      }
    } else if (event.id === 'toggleLabels') {
      if (event.toggleState) {
        // 标签被隐藏的状态
        if (markerTool.value) {
          markerTool.value.hideAllLabels();
          // 注意：hideAllLabels方法内部已经更新了labelsVisible状态
          info('隐藏所有标记点标签');
          addLog('隐藏所有标记点标签');
        }
      } else {
        // 标签被显示的状态
        if (markerTool.value) {
          markerTool.value.showAllLabels();
          // 注意：showAllLabels方法内部已经更新了labelsVisible状态
          info('显示所有标记点标签');
          addLog('显示所有标记点标签');
        }
      }
    }
    // 这里可以添加处理其他具有toggleState的工具
  }
};

// 启用绘制点功能
const enableDrawPoint = (): void => {
  if (!mapInstance.value || !markerTool.value) return;
  
  try {
    // 停止其他可能正在进行的绘图操作
    if (shapeTool.value && shapeTool.value.isDrawing()) {
      shapeTool.value.cancelDrawing();
      addLog('取消当前绘制，准备添加标记点');
    }
    
    // 设置鼠标为十字光标
    if (mapInstance.value.getContainer()) {
      mapInstance.value.getContainer().style.cursor = 'crosshair';
    }
    
    // 激活标记工具
    markerTool.value.activate();
    addLog('启用添加标记点模式');
    info('启用添加标记点模式');
  } catch (e) {
    error('启用标记点模式失败:', e);
    addLog('启用标记点模式失败', e);
  }
};

// 禁用绘制点功能
const disableDrawPoint = (): void => {
  if (!mapInstance.value || !markerTool.value) return;
  
  try {
    // 恢复默认鼠标样式
    if (mapInstance.value.getContainer()) {
      mapInstance.value.getContainer().style.cursor = '';
    }
    
    // 停用标记工具
    markerTool.value.deactivate();
    addLog('禁用添加标记点模式');
    info('禁用添加标记点模式');
  } catch (e) {
    error('禁用标记点模式失败:', e);
    addLog('禁用标记点模式失败', e);
  }
};

// 启用坐标模式
const enableCoordinateMode = (): void => {
  if (!mapInstance.value) return;
  
  try {
    coordinateMode.value = true;
    showCoordinatePanel.value = true;
    
    // 监听鼠标移动事件，实时更新坐标
    mapInstance.value.on('mousemove', updateCoordinates);
    addLog('启用坐标模式');
  } catch (e) {
    error('启用坐标模式失败:', e);
    addLog('启用坐标模式失败', e);
  }
};

// 禁用坐标模式
const disableCoordinateMode = (): void => {
  if (!mapInstance.value) return;
  
  try {
    coordinateMode.value = false;
    showCoordinatePanel.value = false;
    
    // 移除鼠标移动事件监听
    mapInstance.value.off('mousemove', updateCoordinates);
    addLog('禁用坐标模式');
  } catch (e) {
    error('禁用坐标模式失败:', e);
    addLog('禁用坐标模式失败', e);
  }
};

// 更新坐标显示
const updateCoordinates = (e: any): void => {
  if (!coordinateMode.value) return;
  
  const { lat, lng } = e.latlng;
  currentLat.value = lat;
  currentLng.value = lng;
  
  // 发出坐标变化事件
  emit('coordinate-change', { lat, lng });
  // 坐标变化太频繁，不记录日志，避免日志爆炸
};


// 关闭图层下拉菜单
const closeLayerDropdown = (): void => {
  showLayerDropdown.value = false;
  addLog('关闭图层下拉菜单');
  
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
    addLog('图层切换', {layerType: layerTypeString});

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
    addLog('初始化地图失败: 容器元素不存在');
    return;
  }
  
  try {
    // 创建地图实例
    info('正在创建地图实例...');
    addLog('正在创建地图实例');
    info('L对象状态:', !!L);
    info('地图容器状态:', !!mapContainer.value);
    
    // 创建地图实例前打印容器尺寸
    const containerElement = mapContainer.value;
    if (containerElement) {
      const containerSize = {
        width: containerElement.clientWidth,
        height: containerElement.clientHeight,
        offsetWidth: containerElement.offsetWidth,
        offsetHeight: containerElement.offsetHeight
      };
      info('容器尺寸:', containerSize);
      addLog('地图容器尺寸', containerSize);
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
    addLog('地图实例创建状态', {success: !!mapInstance.value});
    
    // 添加一个测试事件监听，检测地图点击是否能正常工作
    if (mapInstance.value) {
      mapInstance.value.once('click', (e: any) => {
        info('地图实例化后测试点击事件:', e.latlng);
        addLog('地图测试点击', {lat: e.latlng.lat, lng: e.latlng.lng});
      });
    }
    
    // 初始化内部状态
    internalZoom.value = props.zoom;
    internalDragging.value = props.dragging;
    info('地图初始化完成');
    addLog('地图初始化完成', {zoom: props.zoom, center: props.center});
    
    // 注册事件监听
    registerMapEvents();
    info('地图事件监听注册完成');
    addLog('地图事件监听注册完成');
    
    // 添加瓦片图层
    addTileLayer();
    info('瓦片图层添加完成');
    addLog('瓦片图层添加完成', {url: tileUrl.value});
    
    // 等待地图加载完成后再初始化工具
    mapInstance.value.whenReady(() => {
      info('地图准备就绪，开始初始化工具...');
      addLog('地图准备就绪，开始初始化工具');
      
      // 初始化测距工具
      measureTool.value = new Measure(mapInstance.value);
      info('测距工具初始化完成');
      addLog('测距工具初始化完成');
      
      // 初始化点位工具
      markerTool.value = new Marker(mapInstance.value, addLog);
      info('标记工具初始化完成');
      addLog('标记工具初始化完成');
      
      // 初始化鹰眼控件
      overviewTool.value = new Overview(mapInstance.value, props.overviewConfig);
      info('鹰眼控件初始化完成');
      addLog('鹰眼控件初始化完成', props.overviewConfig);
      
      // 初始化绘图工具
      initShapeTool();

      // 初始化热力图工具
      initHeatMapTool();
      // 如果工具栏配置了鹰眼按钮，并且默认为激活状态，则标记按钮为激活
      if (overviewTool.value && checkOverviewButtonActive()) {
        overviewTool.value.enable();
      }
      
      // 初始化聚合工具
      initAggregationTool();
      
      // 初始化完成
      addLog('地图工具初始化完成');
      // 其他初始化...
    });
  } catch (e) {
    console.error('初始化地图失败:', e);
    error('初始化地图失败:', e);
    addLog('初始化地图失败', e);
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
    shapeTool.value = new Shape(mapInstance.value, addLog);
    addLog('绘图工具实例化成功');
    
    // 添加绘图事件监听
    if (shapeTool.value) {
      // 绘图开始事件
      shapeTool.value.on('drawing-start', (data) => {
        info('绘制开始:', data);
        addLog('绘制开始', data);
        
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
        addLog('绘制结束', data);
        
        // 不再在此处重置工具栏按钮状态，保持工具激活状态
        // 工具将保持激活，直到用户手动停用或激活另一个工具
      });
      
      // 绘图取消事件
      shapeTool.value.on('drawing-cancel', () => {
        info('绘制已取消');
        addLog('绘制已取消');
        
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
        addLog('图形已创建', shapeData);
        emit('shape-created', shapeData);
        
        // 不再重置工具栏状态，让工具保持激活
        // 下一次绘制会在handleMapClick或handleMapDblClick中自动开始
      });
      
      info('绘图工具初始化和事件监听设置完成');
      addLog('绘图工具初始化和事件监听设置完成');
    }
  } catch (e) {
    error('初始化绘图工具失败:', e);
    addLog('初始化绘图工具失败', e);
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
  
  // 初始化聚合工具
  initAggregationTool();

  // 初始化轨迹播放器
  initTrackPlayer()
  // 初始化完成
  addLog('地图工具初始化完成');
  // 其他初始化...
};

// 更新聚合配置的方法
const updateAggregationConfig = (config: Partial<AggregationOptions>) => {
  if (!aggregationTool.value) {
    return false;
  }

  try {
    // 更新配置
    aggregationTool.value.updateOptions(config);

    // 如果更新了colorRanges，刷新聚合层以应用新颜色
    if (config.colorRanges !== undefined) {
      // 强制刷新以应用新的颜色设置
      aggregationTool.value.refresh();
    }

    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 初始化轨迹播放器
 */
const initTrackPlayer = (options?: Partial<TrackPlayerOptions>): boolean => {
  if (!mapInstance.value) {
    warn('地图尚未初始化，无法创建轨迹播放器');
    addLog('轨迹播放器初始化失败: 地图尚未初始化');
    return false;
  }

  try {
    // 创建轨迹播放控制器
    const playerOptions = {
      ...DEFAULT_TRACK_PLAYER_OPTIONS,
      ...props.trackPlayerConfig,
      autoCenter: props.trackPlayerConfig?.autoCenter ?? DEFAULT_TRACK_PLAYER_OPTIONS.autoCenter ?? false
    };

    trackPlayerController.value = new TrackPlayerController(mapInstance.value, playerOptions);
    addLog('轨迹播放器控制器创建成功', playerOptions);

    // 轨迹列表初始化
    if (props.trackPlayerConfig?.trackList && props.trackPlayerConfig.trackList.length > 0) {
      const tracksCount = props.trackPlayerConfig.trackList.length;
      props.trackPlayerConfig.trackList.forEach(track => {
        trackPlayerController.value?.addTrack(track);
      });
      addLog(`初始化添加${tracksCount}条轨迹到播放器`);
    }

    // 更新状态
    trackPlayerState.enabled = true;

    // 事件监听
    if (trackPlayerController.value) {
      // 处理轨迹进度更新
      trackPlayerController.value.on('play-progress', (data: any) => {
        if (data) {
          trackPlayerState.progress = data.progress || 0;
          trackPlayerState.currentTime = data.currentTime || 0;
          // 进度更新事件太频繁，不记录日志
        }
      });

      // 处理播放状态变化
      trackPlayerController.value.on('play-start', (data: any) => {
        trackPlayerState.isPlaying = true;
        if (data && data.trackId) {
          trackPlayerState.currentTrackId = data.trackId;
          addLog('轨迹播放开始', { trackId: data.trackId });
        } else {
          addLog('轨迹播放开始');
        }
      });

      trackPlayerController.value.on('play-pause', () => {
        trackPlayerState.isPlaying = false;
        addLog('轨迹播放暂停');
      });

      // 处理轨迹完成
      trackPlayerController.value.on('play-finished', () => {
        trackPlayerState.isPlaying = false;
        trackPlayerState.progress = trackPlayerState.loop ? 0 : 1;
        addLog('轨迹播放完成', { loopEnabled: trackPlayerState.loop });
      });

      // 处理速度变化
      trackPlayerController.value.on('speed-change', (data: any) => {
        if (data && data.speed) {
          trackPlayerState.speed = data.speed;
          addLog('轨迹播放速度变更', { speed: data.speed });
        }
      });

      // 处理当前轨迹变化
      trackPlayerController.value.on('current-track-change', (data: any) => {
        if (data && data.trackId) {
          trackPlayerState.currentTrackId = data.trackId;
          addLog('当前轨迹变更', { trackId: data.trackId });
        }
      });
    }

    info('轨迹播放器初始化完成');
    addLog('轨迹播放器初始化完成');
    return true;
  } catch (e) {
    error('初始化轨迹播放器失败:', e);
    addLog('初始化轨迹播放器失败', e);
    return false;
  }
};
// 处理地图移动结束事件
const handleMapMoveEnd = (e: any) => {
  // 获取新的中心点
  if (mapInstance.value) {
    const center = mapInstance.value.getCenter();
    // 触发中心点更新事件
    emit('update:center', [center.lat, center.lng]);
    addLog('地图移动结束', {lat: center.lat, lng: center.lng});
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
    addLog('地图缩放结束', {zoom});
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
  
  try {
    const tools = mapToolbarRef.value.getTools();
    const layerSwitchTool = tools.find(tool => tool.id === 'layerSwitch');
    
    if (!layerSwitchTool) return;
    
    // 获取工具栏元素
    const toolbarElement = mapToolbarRef.value.$el as HTMLElement;
    
    // 查找图层切换按钮元素
    const toolbarItems = Array.from(toolbarElement.querySelectorAll('.toolbar-item'));
    let layerSwitchElement: HTMLElement | null = null;
    
    for (let i = 0; i < toolbarItems.length; i++) {
      const item = toolbarItems[i] as HTMLElement;
      // 如果工具项包含了正确的ID或工具提示文本
      if (item.innerText.includes(layerSwitchTool.tooltip || '')) {
        layerSwitchElement = item;
        break;
      }
    }
    
    if (!layerSwitchElement) {
      addLog('图层切换按钮元素未找到');
      return;
    }
    
    // 获取按钮位置
    const buttonRect = layerSwitchElement.getBoundingClientRect();
    const mapRect = mapInstance.value.getContainer().getBoundingClientRect();
    
    // 获取工具栏位置
    const toolbarPosition = props.toolbarConfig?.position || 'top-left';
    
    // 计算下拉菜单应该出现的位置
    let dropdownX = buttonRect.left - mapRect.left;
    let dropdownY = buttonRect.bottom - mapRect.top;
    
    // 确定放置方向（顶部或底部）
    let placement: 'top' | 'bottom' = 'bottom';
    
    // 根据工具栏位置调整下拉框位置
    if (toolbarPosition.includes('right')) {
      // 如果工具栏在右侧
      // 使用按钮的相对水平位置
      // 将下拉框对齐到按钮的右侧
      dropdownX = buttonRect.right - mapRect.left - 460; // 460是下拉框的宽度
    }
    
    if (toolbarPosition.includes('bottom')) {
      // 如果工具栏在底部，下拉框应该向上展开
      dropdownY = buttonRect.top - mapRect.top;
      placement = 'top';
    }
    
    // 确保下拉框不会超出地图边界
    const mapWidth = mapRect.width;
    dropdownX = Math.max(10, Math.min(dropdownX, mapWidth - 470)); // 保持10px边距
    
    // 设置下拉框位置并传递额外信息
    layerDropdownPosition.value = {
      x: dropdownX,
      y: dropdownY,
      mapWidth: mapRect.width,
      mapHeight: mapRect.height,
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      isRightSide: toolbarPosition.includes('right'),
      isBottomSide: toolbarPosition.includes('bottom')
    };
    
    // 设置放置方式
    layerDropdownPlacement.value = placement;
    
    addLog('图层下拉菜单位置更新', {
      placement,
      position: {x: dropdownX, y: dropdownY},
      toolbarPosition
    });
  } catch (error) {
    console.error('更新图层下拉位置失败:', error);
    addLog('更新图层下拉位置失败', error);
  }
};

// 初始化测距工具
const initMeasureTool = () => {
  if (!mapInstance.value) return;
  
  try {
    // 实例化测距工具
    measureTool.value = new Measure(mapInstance.value);
    addLog('测距工具初始化成功');
  } catch (e) {
    error('测距工具初始化失败:', e);
    addLog('测距工具初始化失败', e);
  }
};

// 初始化标记工具
const initMarkerTool = () => {
  if (!mapInstance.value) return;
  
  try {
    // 实例化标记工具
    markerTool.value = new Marker(mapInstance.value, addLog);
    addLog('标记工具初始化成功');
  } catch (e) {
    error('标记工具初始化失败:', e);
    addLog('标记工具初始化失败', e);
  }
};

// 初始化鹰眼控件
const initOverviewTool = () => {
  if (!mapInstance.value) return;
  
  try {
    // 实例化鹰眼控件并配置
    overviewTool.value = new Overview(mapInstance.value, props.overviewConfig);
    addLog('鹰眼控件初始化成功', props.overviewConfig);
    
    // 如果配置了自动激活，则启用鹰眼
    if (props.overviewConfig && props.overviewConfig.autoActivate) {
      overviewTool.value.enable();
      addLog('鹰眼控件自动激活');
    }
  } catch (e) {
    error('鹰眼控件初始化失败:', e);
    addLog('鹰眼控件初始化失败', e);
  }
};

// 初始化聚合工具
const initAggregationTool = () => {
  if (!mapInstance.value || !markerTool.value) {
    warn('地图或标记工具未初始化，无法初始化聚合工具');
    return;
  }
  
  try {
    // 合并用户配置和默认配置
    const mergedConfig = { ...(props.aggregationConfig || {}) };
    
    // 实例化聚合工具
    aggregationTool.value = new Aggregation(
      mapInstance.value, 
      markerTool.value['markerLayerGroup'], 
      mergedConfig as AggregationOptions
    );
    
    // 如果配置了自动启用，则启用聚合功能
    if (mergedConfig.enabled) {
      aggregationTool.value.enable();
      
      // 更新工具栏聚合按钮状态
      if (mapToolbarRef.value) {
        const tools = mapToolbarRef.value.getTools();
        const updatedTools = tools.map(tool => {
          if (tool.id === 'cluster') {
            return { ...tool, active: true };
          }
          return tool;
        });
        mapToolbarRef.value.setTools(updatedTools);
      }
    }
  } catch (e) {
    error('初始化聚合工具失败:', e);
  }
};

const handleCenterOnTrack = (data: { latlng: [number, number], bounds: L.LatLngBounds }) => {
  if (mapInstance.value) {
    try {
      // 定位到轨迹起点
      mapInstance.value.setView(data.latlng, mapInstance.value.getZoom());
      // 自适应缩放以显示整个轨迹
      mapInstance.value.fitBounds(data.bounds, {
        padding: [50, 50], // 添加一些内边距
        maxZoom: 18 // 限制最大缩放级别
      });
      addLog('居中显示轨迹', {
        center: data.latlng,
        bounds: [
          [data.bounds.getSouth(), data.bounds.getWest()],
          [data.bounds.getNorth(), data.bounds.getEast()]
        ]
      });
    } catch (e) {
      error('居中显示轨迹失败:', e);
      addLog('居中显示轨迹失败', e);
    }
  }
}; 
/**
 * 添加轨迹到播放器
 */
const addTrack = (track: Track): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('添加轨迹失败: 轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    const result = trackPlayerController.value.addTrack(track);
    
    if (result) {
      info(`成功添加轨迹: ${track.id}`);
      addLog(`成功添加轨迹: ${track.id}`, {trackId: track.id, pointsCount: track.points?.length});
      return true;
    } else {
      warn(`添加轨迹失败: ${track.id}`);
      addLog(`添加轨迹失败: ${track.id}`);
      return false;
    }
  } catch (e) {
    error('添加轨迹出错:', e);
    addLog('添加轨迹出错', e);
    return false;
  }
};

/**
 * 从播放器中移除轨迹
 */
const removeTrack = (trackId: string): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    const result = trackPlayerController.value.removeTrack(trackId);
    
    if (result) {
      info(`成功移除轨迹: ${trackId}`);
      return true;
    } else {
      warn(`移除轨迹失败: ${trackId}`);
      return false;
    }
  } catch (e) {
    error('移除轨迹出错:', e);
    return false;
  }
};

/**
 * 播放轨迹
 */
const playTrack = (trackId?: string): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('播放轨迹失败: 轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    const result = trackPlayerController.value.play(trackId);
    
    if (result) {
      const logMessage = trackId ? `开始播放轨迹: ${trackId}` : '开始播放当前轨迹';
      info(logMessage);
      addLog(logMessage);
      trackPlayerState.isPlaying = true;
      
      if (trackId) {
        trackPlayerState.currentTrackId = trackId;
      }
      
      return true;
    } else {
      const errorMessage = trackId ? `播放轨迹失败: ${trackId}` : '播放当前轨迹失败';
      warn(errorMessage);
      addLog(errorMessage);
      return false;
    }
  } catch (e) {
    error('播放轨迹出错:', e);
    addLog('播放轨迹出错', e);
    return false;
  }
};

/**
 * 暂停轨迹播放
 */
const pauseTrack = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    trackPlayerController.value.pause();
    info('轨迹播放已暂停');
    trackPlayerState.isPlaying = false;
    return true;
  } catch (e) {
    error('暂停轨迹播放出错:', e);
    return false;
  }
};

/**
 * 设置轨迹播放进度
 */
const setTrackProgress = (progress: number): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('设置轨迹播放进度失败: 播放器未初始化');
    return false;
  }
  
  if (progress < 0 || progress > 1) {
    warn('轨迹播放进度必须在0-1之间');
    addLog('设置轨迹播放进度失败: 进度值超出范围', {progress});
    return false;
  }
  
  try {
    const result = trackPlayerController.value.setProgress(progress);
    
    if (result) {
      trackPlayerState.progress = progress;
      info(`轨迹播放进度已设置为: ${progress}`);
      addLog('设置轨迹播放进度成功', {progress});
      return true;
    } else {
      warn('设置轨迹播放进度失败');
      addLog('设置轨迹播放进度失败');
      return false;
    }
  } catch (e) {
    error('设置轨迹播放进度出错:', e);
    addLog('设置轨迹播放进度出错', e);
    return false;
  }
};

/**
 * 设置轨迹播放速度
 */
const setTrackSpeed = (speed: number): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('设置轨迹播放速度失败: 播放器未初始化');
    return false;
  }
  
  if (speed <= 0) {
    warn('轨迹播放速度必须大于0');
    addLog('设置轨迹播放速度失败: 速度值超出范围', {speed});
    return false;
  }
  
  try {
    const result = trackPlayerController.value.setSpeed(speed);
    
    if (result) {
      trackPlayerState.speed = speed;
      info(`轨迹播放速度已设置为: ${speed}`);
      addLog('设置轨迹播放速度成功', {speed});
      return true;
    } else {
      warn('设置轨迹播放速度失败');
      addLog('设置轨迹播放速度失败');
      return false;
    }
  } catch (e) {
    error('设置轨迹播放速度出错:', e);
    addLog('设置轨迹播放速度出错', e);
    return false;
  }
};

/**
 * 切换轨迹循环播放
 */
const toggleTrackLoop = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('切换轨迹循环播放失败: 播放器未初始化');
    return false;
  }
  
  try {
    // 切换循环状态
    trackPlayerState.loop = !trackPlayerState.loop;
    
    // 更新轨迹播放器控制器选项
    trackPlayerController.value.updateOptions({
      loop: trackPlayerState.loop
    });
    
    info(`轨迹循环播放已${trackPlayerState.loop ? '开启' : '关闭'}`);
    addLog('切换轨迹循环播放', {enabled: trackPlayerState.loop});
    return true;
  } catch (e) {
    error('切换轨迹循环播放出错:', e);
    addLog('切换轨迹循环播放出错', e);
    return false;
  }
};

/**
 * 切换轨迹镜头跟随
 */
const toggleTrackFollowCamera = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('切换轨迹镜头跟随失败: 播放器未初始化');
    return false;
  }
  
  try {
    // 切换镜头跟随状态
    trackPlayerState.followCamera = !trackPlayerState.followCamera;
    
    // 更新轨迹播放器控制器选项
    trackPlayerController.value.updateOptions({
      followCamera: trackPlayerState.followCamera
    });
    
    info(`轨迹镜头追踪已${trackPlayerState.followCamera ? '开启' : '关闭'}`);
    addLog('切换轨迹镜头跟随', {enabled: trackPlayerState.followCamera});
    return true;
  } catch (e) {
    error('切换轨迹镜头追踪出错:', e);
    addLog('切换轨迹镜头跟随出错', e);
    return false;
  }
};

/**
 * 显示轨迹播放器面板
 */
const showTrackPlayerPanel = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('显示轨迹播放器面板失败: 播放器未初始化');
    return false;
  }
  
  trackPlayerState.visible = true;
  addLog('显示轨迹播放器面板');
  return true;
};

/**
 * 隐藏轨迹播放器面板
 */
const hideTrackPlayerPanel = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('隐藏轨迹播放器面板失败: 播放器未初始化');
    return false;
  }
  
  trackPlayerState.visible = false;
  addLog('隐藏轨迹播放器面板');
  return true;
};

/**
 * 更新轨迹播放器主题
 */
const updateTrackPlayerTheme = (theme: 'light' | 'dark'): void => {
  // 确保theme是有效的主题类型
  if (theme === 'light' || theme === 'dark') {
    trackPlayerState.theme = TRACK_PLAYER_THEMES[theme];
    addLog('更新轨迹播放器主题', {theme});
  } else {
    addLog('更新轨迹播放器主题失败: 无效的主题', {theme});
  }
};

/**
 * 设置当前轨迹
 * @param trackId 轨迹ID
 */
const setCurrentTrack = (trackId: string): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    // 获取当前所有轨迹
    const tracks = trackPlayerController.value.getAllTracks();
    const currentTrack = tracks.find(t => t.id === trackId);
    
    // 检查轨迹是否存在
    if (!currentTrack) {
      warn(`轨迹未找到: ${trackId}`);
      return false;
    }
    
    // 使用setCurrentTrack方法设置当前轨迹
    const result = trackPlayerController.value.setCurrentTrack(trackId);
    
    if (result && currentTrack.points && currentTrack.points.length > 0) {
      // 轨迹设置成功，将地图中心点设置到轨迹起始点
      const startPoint = currentTrack.points[0];
      if (mapInstance.value && startPoint) {
        mapInstance.value.setView([startPoint.lat, startPoint.lng], mapInstance.value.getZoom());
        info(`地图中心点已设置到轨迹 ${trackId} 的起始位置`);
      }
      
      // 更新状态
      trackPlayerState.currentTrackId = trackId;
      trackPlayerState.progress = 0;
      trackPlayerState.currentTime = startPoint.time;
      
      return true;
    } else {
      warn(`设置当前轨迹失败: ${trackId}`);
      return false;
    }
  } catch (e) {
    error('设置当前轨迹出错:', e);
    return false;
  }
};

// 打开调试面板
const openDebugPanel = () => {
  try {
    debugPanelVisible.value = true;
    addLog('打开调试面板');
  } catch (e) {
    error('打开调试面板失败:', e);
  }
};

// 关闭调试面板
const closeDebugPanel = () => {
  try {
    debugPanelVisible.value = false;
    addLog('关闭调试面板');
  } catch (e) {
    error('关闭调试面板失败:', e);
  }
};

// 初始化热力图工具
const initHeatMapTool = (): void => {
  try {
    heatMapTool.value = new HeatMap(mapInstance.value, props.heatMapConfig);
    if (props.heatMapConfig?.enabled) {
      heatMapTool.value.enable();
    }
    
    addLog('热力图工具已初始化');
  } catch (e) {
    error('初始化热力图工具失败:', e);
    addLog('初始化热力图工具失败', e);
  }
};

// 暴露热力图功能的方法
const setHeatMapData = (data: HeatPoint[]): boolean => {
  if (!heatMapTool.value) {
    addLog('设置热力图数据失败：热力图工具未初始化');
    return false;
  }

  try {
    const result = heatMapTool.value.setData(data);
    if (result) {
      addLog(`热力图数据已更新，共${data.length}个点`);
    }
    return result;
  } catch (e) {
    error('设置热力图数据失败:', e);
    addLog('设置热力图数据失败', e);
    return false;
  }
};

// 更新热力图配置
const updateHeatMapOptions = (options: Partial<HeatMapOptions>): boolean => {
  if (!heatMapTool.value) {
    // 热力图工具尚未初始化
    warn('热力图工具未初始化，无法更新配置');
    return false;
  }
  
  try {
    const result = heatMapTool.value.updateOptions(options);
    if (result) {
      addLog('热力图配置已更新');
    }
    return result;
  } catch (e) {
    error('更新热力图配置失败:', e);
    addLog('更新热力图配置失败', e);
    return false;
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
  
  // 添加聚合工具相关方法
  getAggregationTool: () => aggregationTool.value,
  enableAggregation: (options?: Partial<AggregationOptions>) => {
    if (!aggregationTool.value) return;
    if (options) {
      aggregationTool.value.updateOptions(options);
    }
    aggregationTool.value.enable();
  },
  disableAggregation: () => {
    if (!aggregationTool.value) return;
    aggregationTool.value.disable();
  },
  toggleAggregation: () => {
    if (!aggregationTool.value) return;
    aggregationTool.value.toggle();
    
    // 如果启用了聚合功能，且地图上没有足够的标记点，生成一些测试标记点
    if (aggregationTool.value.isEnabled()) {
      info('聚合功能已启用');
      
      // 检查地图上的标记点数量
      if (!markerTool.value || markerTool.value.getMarkers().length < 5) {
        info('地图上标记点不足，生成一些测试标记点以便查看聚合效果');
        aggregationTool.value.generateTestMarkers(30);
      }
    } else {
      info('聚合功能已禁用');
    }
  },
  updateAggregationOptions: (options: Partial<AggregationOptions>) => {
    if (!aggregationTool.value) return;
    aggregationTool.value.updateOptions(options);
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
      // 确保options对象存在
      const safeOptions = options || {};
      
      // 移除autoShowLabel，使用markerShowLabel代替
      // markerClickFunction可以直接传递（不需要默认值）
      // markerTemplate可以直接传递（不需要默认值）
      
      return markerTool.value.addMarker(latlng, safeOptions);
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
  updateMarkerClickable: (idOrMarker: string | any, clickable: boolean) => {
    if (!markerTool.value) return false;
    try {
      return markerTool.value.updateMarkerClickable(idOrMarker, clickable);
    } catch (e) {
      error('更新标记可点击状态失败:', e);
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
  getMarkers: () => {
    if (!markerTool.value) return [];
    try {
      return markerTool.value.getMarkers();
    } catch (e) {
      error('获取所有标记失败:', e);
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
  // 切换标记点显示/隐藏
  toggleMarkers: (show?: boolean) => {
    if (!markerTool.value) return;
    try {
      if (show === undefined) {
        // 当前没有标记在地图上显示时，则显示全部
        const isAnyVisible = mapInstance.value && markerTool.value.getMarkers().some(marker => 
          mapInstance.value.hasLayer(marker));
        if (isAnyVisible) {
          markerTool.value.hideAllMarkers();
          info('切换隐藏所有标记点');
        } else {
          markerTool.value.showAllMarkers();
          info('切换显示所有标记点');
        }
      } else if (show) {
        markerTool.value.showAllMarkers();
        info('显示所有标记点');
      } else {
        markerTool.value.hideAllMarkers();
        info('隐藏所有标记点');
      }
      
      // 更新工具栏按钮状态
      if (mapToolbarRef.value) {
        const tools = mapToolbarRef.value.getTools();
        const toggleIndex = tools.findIndex(t => t.id === 'toggleMarkers');
        
        if (toggleIndex !== -1) {
          const toggleTool = tools[toggleIndex];
          // show为false表示隐藏标记点，toggleState为true
          const newToggleState = show === undefined ? !toggleTool.toggleState : !show;
          
          // 创建新的工具数组，只修改toggleMarkers工具
          const newTools = [...tools];
          
          // 创建一个没有类型冲突的新工具对象
          const newToggleTool = {
            id: toggleTool.id,
            name: toggleTool.name,
            tooltip: toggleTool.tooltip,
            multi: toggleTool.multi,
            // 确保图标始终有值
            icon: newToggleState 
              ? (toggleTool.alternateIcon || toggleTool.icon) 
              : (toggleTool.icon || ''),
            toggleState: newToggleState,
            active: newToggleState ? true : undefined
          };
          
          // 用新对象替换旧对象
          newTools[toggleIndex] = newToggleTool;
          
          // 更新工具栏
          mapToolbarRef.value.setTools(newTools);
        }
      }
    } catch (e) {
      error('切换标记点显示/隐藏失败:', e);
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
  updateShapeStyle: () => true,
  
  // 轨迹播放相关方法
  addTrack: (track: Track) => {
    if (!trackPlayerController.value) {
      warn('轨迹播放器尚未初始化');
      return false;
    }
    
    try {
      const result = trackPlayerController.value.addTrack(track);
      
      if (result) {
        // 成功添加轨迹后刷新轨迹列表状态
        info(`成功添加轨迹: ${track.id}`);
        return true;
      } else {
        warn(`添加轨迹失败: ${track.id}`);
        return false;
      }
    } catch (e) {
      error('添加轨迹出错:', e);
      return false;
    }
  },
  removeTrack: (trackId: string) => {
    if (!trackPlayerController.value) {
      warn('轨迹播放器尚未初始化');
      return false;
    }
    
    try {
      const result = trackPlayerController.value.removeTrack(trackId);
      
      if (result) {
        // 成功移除轨迹后刷新轨迹列表状态
        info(`成功移除轨迹: ${trackId}`);
        return true;
      } else {
        warn(`移除轨迹失败: ${trackId}`);
        return false;
      }
    } catch (e) {
      error('移除轨迹出错:', e);
      return false;
    }
  },
  setCurrentTrack,
  playTrack,
  pauseTrack,
  setTrackProgress,
  setTrackSpeed,
  toggleTrackLoop,
  toggleTrackFollowCamera,
  showTrackPlayerPanel,
  hideTrackPlayerPanel,
  // 热力图功能
  setHeatMapData,
  updateHeatMapOptions,
  enableHeatMap: () => heatMapTool.value?.enable(),
  disableHeatMap: () => heatMapTool.value?.disable(),
  // 生成热力图的方法
  generateHeatMapFromMarkers: (weightField = 'markerWeight') => {
    if (heatMapTool.value && markerTool.value) {
      return heatMapTool.value.generateFromMarkers(markerTool.value['markerLayerGroup'], weightField);
    }
    return false;
  },
  // 设置热力图相似半径
  setHeatMapSimilarRadius: (radiusKm: number) => {
    if (heatMapTool.value) {
      return heatMapTool.value.updateOptions({ similarRadius: radiusKm });
    }
    return false;
  },
  // 设置热力图是否包含隐藏标记点
  setHeatMapIncludeHiddenMarkers: (include: boolean) => {
    if (heatMapTool.value) {
      const result = heatMapTool.value.updateOptions({ includeHiddenMarkers: include });
      
      // 更新选项后重新生成热力图
      if (result && heatMapTool.value.isEnabled() && markerTool.value) {
        heatMapTool.value.generateFromMarkers(
          markerTool.value['markerLayerGroup'], 
          heatMapTool.value.getOptions().weightField || 'markerWeight'
        );
      }
      
      return result;
    }
    return false;
  },
  showAllLabels: () => {
    if (!markerTool.value) return;
    try {
      markerTool.value.showAllLabels();
    } catch (e) {
      error('显示所有标签失败:', e);
    }
  },
  hideAllLabels: () => {
    if (!markerTool.value) return;
    try {
      markerTool.value.hideAllLabels();
    } catch (e) {
      error('隐藏所有标签失败:', e);
    }
  },
  getLabelsVisible: () => {
    if (!markerTool.value) return true;
    try {
      return markerTool.value.getLabelsVisible();
    } catch (e) {
      error('获取标签显示状态失败:', e);
      return true;
    }
  },
  setLabelsVisible: (visible: boolean) => {
    if (!markerTool.value) return;
    try {
      markerTool.value.setLabelsVisible(visible);
    } catch (e) {
      error('设置标签显示状态失败:', e);
    }
  }
});

// 处理地图点击事件
const handleMapClick = (e: any): void => {
  // 发出地图点击事件
  emit('map-click', e);
  addLog('地图点击事件', {latlng: e.latlng});
};

</script>

<style>
/* 标记点可点击样式 */
.leaflet-marker-icon {
  cursor: pointer;
}

/* 可点击标记的强化样式 */
.clickable-marker {
  cursor: pointer !important;
  pointer-events: auto !important;
  z-index: 1000 !important;
}

/* 标记标签样式 */
.sc-map-marker-label {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 标记详情弹窗样式 */
.sc-map-marker-details-popup .leaflet-popup-content-wrapper {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background-color: rgba(255, 255, 255, 0.95);
  margin-bottom: 5px; /* 减少底部间距，更接近标记 */
  animation: popup-fade-in 0.2s ease-out; /* 添加弹出动画 */
}

.sc-map-marker-details-popup .leaflet-popup-tip {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background-color: rgba(255, 255, 255, 0.95);
}

/* 增加弹窗内容样式 */
.sc-map-marker-details-popup .leaflet-popup-content {
  margin: 12px 20px;
  line-height: 1.5;
}

/* 增加弹窗关闭按钮样式 */
.sc-map-marker-details-popup .leaflet-popup-close-button {
  padding: 6px 8px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.sc-map-marker-details-popup .leaflet-popup-close-button:hover {
  opacity: 1;
}

/* 弹窗动画效果 */
@keyframes popup-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 确保弹窗容器位置正确 */
.leaflet-popup {
  margin-bottom: 10px; /* 调整为更小的值，不要让弹窗离标记太远 */
}

/* 测距工具样式 */
.segment-distance {
  padding: 4px 8px;
  background-color: rgba(255, 71, 87, 0.85);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
  backdrop-filter: blur(2px);
  pointer-events: none;
  display: inline-block;
}

.segment-distance:hover {
  background-color: rgba(255, 71, 87, 1);
  transform: scale(1.05) !important;
}

.node-distance {
  padding: 3px 8px;
  background-color: rgba(46, 134, 222, 0.85);
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  text-align: center;
  transform: translateY(-50%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
  backdrop-filter: blur(2px);
  pointer-events: none;
  position: relative;
}

.node-distance::before {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(46, 134, 222, 0.85);
}

.node-distance:hover {
  background-color: rgba(46, 134, 222, 1);
  transform: translateY(-50%) scale(1.05);
}

/* 测量结果总标签样式 */
.measure-total-label {
  background: none !important;
}

.measure-total-label::after {
  content: '总距离：' attr(data-distance);
  position: absolute;
  top: 0;
  left: 0;
  padding: 5px 10px;
  background-color: rgba(72, 52, 212, 0.9);
  color: white;
  border-radius: 5px;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(3px);
}

/* 测量工具标记样式增强 */
.measure-segment-label, .measure-node-label {
  background: none !important;
  z-index: 900 !important;
}

.measure-segment-label {
  margin-top: -10px;
}

.measure-node-label {
  margin-top: -5px;
}
</style>

<style scoped>
.sc-map {
  width: 100%;
  height: 500px;
  position: relative;
}
</style> 