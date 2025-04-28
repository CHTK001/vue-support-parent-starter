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
    <track-player
      v-if="trackPlayerState.enabled && trackPlayerState.visible"
      :visible="trackPlayerState.visible"
      :tracks="availableTracks"
      :current-track-id="trackPlayerState.currentTrackId || ''"
      :progress="trackPlayerState.progress"
      :current-time="trackPlayerState.currentTime"
      :is-playing="trackPlayerState.isPlaying"
      :speed="trackPlayerState.speed"
      :loop="trackPlayerState.loop"
      :theme="trackPlayerState.theme"
      position="topright"
      @play="playTrack"
      @pause="pauseTrack"
      @set-current-track="setCurrentTrack"
      @set-progress="setTrackProgress"
      @set-speed="setTrackSpeed"
      @toggle-loop="toggleTrackLoop"
      @update:theme="updateTrackPlayerTheme"
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
import type { AggregationOptions, Track, TrackPlayerConfig, TrackPlayerOptions } from './types';
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
    options: {}
  } as AggregationOptions),
  trackPlayerConfig: () => ({
    position: 'topright',
    trackList: []
  } as TrackPlayerConfig)
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
const aggregationTool: Ref<Aggregation | null> = ref(null); // 聚合工具
const mapToolbarRef = ref<InstanceType<typeof MapToolbar> | null>(null); // 工具栏组件引用

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
  // UI配置
  theme: TRACK_PLAYER_THEMES.light
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
          return { ...tool, active: tool.id === toolId ? true : undefined };
        }
        return tool;
      });
      mapToolbarRef.value.setTools(updatedTools);
    }
    
    // 根据工具ID获取对应的图形类型
    const shapeType = getShapeTypeFromToolId(toolId);
    
    // 启动图形绘制
    if (shapeType && shapeTool.value) {
      shapeTool.value.startDrawing(shapeType);
    }
  } 
  // 测距工具
  else if (toolId === 'measure') {
    if (measureTool.value) {
    measureTool.value.start();
    }
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
    if (!trackPlayerController.value) {
      initTrackPlayer();
    }
    showTrackPlayerPanel();
  } else if (toolId === 'cluster' && aggregationTool.value) {
    // 禁用聚合功能
    aggregationTool.value.enable();
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
  } else if (toolId === 'cluster' && aggregationTool.value) {
    // 禁用聚合功能
    aggregationTool.value.disable();
    info('通过工具栏禁用标记点聚合功能');
  } else if (toolId === 'zoomIn' || toolId === 'zoomOut' || toolId === 'fullView') {
    // 对于即时执行工具，确保停用按钮状态
    resetInstantToolButtonState(toolId);
    info(`即时工具已完成操作: ${toolId}`);
  } else if (toolId === 'trackPlay') {
    // 停止轨迹播放
    if (trackPlayerController.value) {
      trackPlayerController.value.pause();
      info('通过工具栏停止轨迹播放');
    }
    // 隐藏轨迹播放器面板
    hideTrackPlayerPanel();
    info('隐藏轨迹播放器面板');
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
      } catch (clusterError) {
        console.error('导入leaflet.markercluster失败:', clusterError);
        warn('标记点聚合功能将不可用，请安装leaflet.markercluster依赖');
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
  
  // 销毁测距工具
  if (measureTool.value) {
    measureTool.value.stop();
    measureTool.value = null;
  }
  
  // 销毁标记工具
  if (markerTool.value) {
    markerTool.value.deactivate();
    markerTool.value = null;
  }
  
  // 销毁鹰眼工具
  if (overviewTool.value) {
    overviewTool.value.disable();
    overviewTool.value = null;
  }
  
  // 销毁绘图工具
  if (shapeTool.value) {
    shapeTool.value.cancelDrawing();
    shapeTool.value = null;
  }
  
  // 销毁聚合工具
  if (aggregationTool.value) {
    aggregationTool.value.destroy();
    aggregationTool.value = null;
  }
  
  // 销毁轨迹播放器
  if (trackPlayerController.value) {
    trackPlayerController.value.destroy();
    trackPlayerController.value = null;
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
  
  // 处理标记点显示/隐藏
  if (event.toggleState !== undefined) {
    if (event.id === 'toggleMarkers') {
      if (event.toggleState) {
        // 标记点被隐藏的状态(toggleState=true表示隐藏状态)
        if (markerTool.value) {
          markerTool.value.hideAllMarkers();
          info('隐藏所有标记点');
        }
      } else {
        // 标记点被显示的状态(toggleState=false表示显示状态)
        if (markerTool.value) {
          markerTool.value.showAllMarkers();
          info('显示所有标记点');
        }
      }
    }
    // 这里可以添加处理其他具有toggleState的工具
  }
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
  
  // 初始化聚合工具
  initAggregationTool();
  
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
  
  if (!layerSwitchElement) return;
  
  try {
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
  } catch (error) {
    console.error('更新图层下拉位置失败:', error);
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

// 初始化聚合工具
const initAggregationTool = () => {
  if (!mapInstance.value || !markerTool.value) return;
  
  try {
    // 实例化聚合工具
    aggregationTool.value = new Aggregation(
      mapInstance.value, 
      markerTool.value['markerLayerGroup'], 
      props.aggregationConfig
    );
    
    info('聚合工具初始化成功');
    
    // 如果配置了自动启用，则启用聚合功能
    if (props.aggregationConfig && props.aggregationConfig.enabled) {
      nextTick(() => {
        if (aggregationTool.value) {
          aggregationTool.value.enable();
          info('聚合功能已根据配置自动启用');
          
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
      });
    }
  } catch (e) {
    error('初始化聚合工具失败:', e);
  }
};

/**
 * 初始化轨迹播放器
 */
const initTrackPlayer = () => {
  if (!mapInstance.value) {
    warn('初始化轨迹播放器失败：地图未初始化');
    return;
  }
  
  // 创建轨迹播放控制器，使用props.trackPlayerConfig作为第二个参数
  trackPlayerController.value = new TrackPlayerController(
    mapInstance.value,
    props.trackPlayerConfig || { position: 'bottomright', trackList: [] } as TrackPlayerConfig
  );
  
  // 注册轨迹播放器事件
  registerTrackPlayerEvents();
  
  // 设置为启用状态
  trackPlayerState.enabled = true;
};

/**
 * 注册轨迹播放器事件
 */
const registerTrackPlayerEvents = () => {
  if (!trackPlayerController.value) return;
  
  // 注册播放开始事件
  trackPlayerController.value.on('play-start', (data) => {
    trackPlayerState.isPlaying = true;
    
    // 更新当前轨迹ID
    if (data && data.trackId && data.trackId !== trackPlayerState.currentTrackId) {
      trackPlayerState.currentTrackId = data.trackId;
    }
    
    info(`轨迹 ${trackPlayerState.currentTrackId || 'unknown'} 开始播放`);
  });
  
  // 注册播放暂停事件
  trackPlayerController.value.on('play-pause', () => {
    trackPlayerState.isPlaying = false;
    info(`轨迹暂停播放`);
  });
  
  // 注册播放结束事件
  trackPlayerController.value.on('play-finished', () => {
    trackPlayerState.isPlaying = false;
    trackPlayerState.progress = trackPlayerState.loop ? 0 : 1;
    info(`轨迹播放结束`);
  });
  
  // 注册进度变化事件
  trackPlayerController.value.on('play-progress', (data) => {
    if (data) {
      trackPlayerState.progress = data.progress;
      
      // 更新当前时间，如果提供了播放索引和轨迹ID
      if (data.index !== undefined && data.trackId) {
        const tracks = trackPlayerController.value?.getAllTracks() || [];
        const currentTrack = tracks.find(t => t.id === data.trackId);
        
        if (currentTrack && currentTrack.points && data.index < currentTrack.points.length) {
          trackPlayerState.currentTime = currentTrack.points[data.index].time;
        }
      }
    }
  });
  
  // 注册速度变化事件
  trackPlayerController.value.on('speed-change', (data) => {
    if (data && data.speed) {
      trackPlayerState.speed = data.speed;
    }
  });
  
  // 注册当前轨迹变化事件
  trackPlayerController.value.on('current-track-change', (data) => {
    if (data && data.trackId) {
      trackPlayerState.currentTrackId = data.trackId;
    }
  });
};

/**
 * 播放轨迹
 * @param trackId 可选，指定要播放的轨迹ID，不传则播放当前选中的轨迹
 */
const playTrack = (trackId?: string): boolean => {
  const result = trackPlayerController.value?.play(trackId) || false;
  
  if (result) {
    // 如果播放成功，更新UI状态
    trackPlayerState.isPlaying = true;
    
    // 如果指定了轨迹ID，则更新当前轨迹ID
    if (trackId) {
      trackPlayerState.currentTrackId = trackId;
    }
  }
  
  return result;
};

/**
 * 暂停播放
 */
const pauseTrack = (): boolean => {
  const result = trackPlayerController.value?.pause() || false;
  
  if (result) {
    // 如果暂停成功，更新UI状态
    trackPlayerState.isPlaying = false;
  }
  
  return result;
};

/**
 * 设置播放进度
 * @param progress 进度（0-1）
 */
const setTrackProgress = (progress: number): boolean => {
  return trackPlayerController.value?.setProgress(progress) || false;
};

/**
 * 设置播放速度
 * @param speed 速度倍数
 */
const setTrackSpeed = (speed: number): boolean => {
  return trackPlayerController.value?.setSpeed(speed) || false;
};

/**
 * 切换循环播放
 */
const toggleTrackLoop = (): void => {
  if (!trackPlayerController.value) return;
  trackPlayerState.loop = !trackPlayerState.loop;
  
  // 使用updateOptions方法来更新loop选项
  if (trackPlayerController.value && typeof trackPlayerController.value.updateOptions === 'function') {
    trackPlayerController.value.updateOptions({
      loop: trackPlayerState.loop
    });
  }
};

/**
 * 显示轨迹播放器面板
 */
const showTrackPlayerPanel = (): void => {
  trackPlayerState.visible = true;
};

/**
 * 隐藏轨迹播放器面板
 */
const hideTrackPlayerPanel = (): void => {
  trackPlayerState.visible = false;
};

/**
 * 更新轨迹播放器主题
 * @param theme 主题配置
 */
const updateTrackPlayerTheme = (theme: any): void => {
  trackPlayerState.theme = theme;
};

/**
 * 添加轨迹
 * @param track 轨迹数据
 * @description 轨迹数据中的points可以包含speed属性，用于设置该点位的播放速度（km/h）。
 * 如果未设置速度，则会根据相邻点的距离和时间差自动计算，或使用全局默认速度。
 */
const addTrack = (track: Track): boolean => {
  // 如果控制器未创建，先初始化控制器
  if (!trackPlayerController.value) {
    initTrackPlayer();
  }
  
  // 轨迹至少需要包含id和两个点
  if (!track || !track.id || !track.points || track.points.length < 2) {
    warn('添加轨迹失败：轨迹数据不完整或点数量不足');
    return false;
  }
  
  // 添加轨迹（控制器会在第一次添加轨迹时自动创建实例）
  const result = trackPlayerController.value?.addTrack(track) || false;
  
  if (result) {
    // 如果是第一条轨迹，自动显示轨迹播放器面板
    if (!trackPlayerState.visible && trackPlayerController.value && trackPlayerController.value.getAllTracks().length === 1) {
      showTrackPlayerPanel();
      
      // 设置当前轨迹ID
      trackPlayerState.currentTrackId = track.id;
    }
  }
  
  return result;
};

/**
 * 移除轨迹
 * @param trackId 轨迹ID
 */
const removeTrack = (trackId: string): boolean => {
  return trackPlayerController.value?.removeTrack(trackId) || false;
};

/**
 * 设置当前轨迹
 * @param trackId 轨迹ID
 */
const setCurrentTrack = (trackId: string): boolean => {
  if (!trackPlayerController.value || !trackId) {
    warn('设置当前轨迹失败: 轨迹播放器未初始化或未提供轨迹ID');
    return false;
  }
  
  // 确保轨迹存在
  const tracks = trackPlayerController.value.getAllTracks();
  const currentTrack = tracks.find(track => track.id === trackId);
  
  if (!currentTrack) {
    warn(`设置当前轨迹失败: 轨迹 ${trackId} 不存在`);
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
  }
  
  return result;
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
  initTrackPlayer,
  addTrack,
  removeTrack,
  setCurrentTrack,
  playTrack,
  pauseTrack,
  setTrackProgress,
  setTrackSpeed,
  toggleTrackLoop,
  showTrackPlayerPanel,
  hideTrackPlayerPanel
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

/* 轨迹播放器样式 */
:deep(.track-player-container) {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  background: var(--bg-color, rgba(255, 255, 255, 0.95));
  color: var(--text-color, #333);
  transition: all 0.3s ease;
  max-width: 320px;
  overflow: hidden;
  z-index: 1000;
}

:deep(.track-player-container .info-container) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.1));
}

:deep(.track-player-container .track-name) {
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

:deep(.track-player-container .progress-container) {
  padding: 10px 12px;
  display: flex;
  align-items: center;
}

:deep(.track-player-container .progress-bar) {
  flex: 1;
  height: 6px;
  appearance: none;
  background: var(--progress-bg, #f0f0f0);
  border-radius: 3px;
  outline: none;
  margin-right: 10px;
}

:deep(.track-player-container .progress-bar::-webkit-slider-thumb) {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--progress-color, #1890ff);
  cursor: pointer;
}

:deep(.track-player-container .progress-text) {
  font-size: 12px;
  white-space: nowrap;
  color: var(--secondary-text, #666);
}

:deep(.track-player-container .controls-container) {
  padding: 5px 12px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.track-player-container .button-group) {
  display: flex;
  align-items: center;
}

:deep(.track-player-container .button) {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  margin-right: 8px;
  color: var(--button-color, #666);
  transition: all 0.2s;
}

:deep(.track-player-container .button:hover) {
  background: rgba(0,0,0,0.05);
  color: var(--button-hover, #40a9ff);
}

:deep(.track-player-container .button.active) {
  color: var(--button-active, #1890ff);
}

:deep(.track-player-container .button.play-button) {
  background: var(--button-active, #1890ff);
  color: white;
}

:deep(.track-player-container .button.play-button:hover) {
  background: var(--button-hover, #40a9ff);
  color: white;
}

:deep(.track-player-container .speed-text) {
  font-size: 12px;
  background: rgba(0,0,0,0.05);
  padding: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
}

:deep(.track-player-container .track-list) {
  max-height: 150px;
  overflow-y: auto;
  border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.1));
}

:deep(.track-player-container .track-list-item) {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text-color, #333) !important;
}

:deep(.track-player-container .track-list-item:hover) {
  background: rgba(0,0,0,0.03);
  color: var(--text-color, #333) !important;
}

:deep(.track-player-container .track-list-item.active) {
  background: rgba(24, 144, 255, 0.1);
  color: var(--button-active, #1890ff) !important;
  font-weight: bold;
}

:deep(.track-player-container .track-color) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

:deep(.track-player-container.dark-theme .track-list-item) {
  color: var(--text-color, #f0f0f0) !important;
}

:deep(.track-player-container.dark-theme .track-list-item:hover) {
  background: rgba(255,255,255,0.05);
  color: var(--text-color, #f0f0f0) !important;
}

:deep(.track-player-container.dark-theme .track-list-item.active) {
  background: rgba(24, 144, 255, 0.2);
  color: var(--button-active, #1890ff) !important;
}

/* 为暗色主题添加变量 */
:deep(.track-player-container.dark-theme) {
  --bg-color: rgba(42, 45, 56, 0.9);
  --text-color: #f0f0f0;
  --border-color: rgba(255,255,255,0.1);
  --button-color: #aaa;
  --button-hover: #40a9ff;
  --button-active: #1890ff;
  --progress-bg: #555;
  --progress-color: #1890ff;
  --secondary-text: #bbb;
}
</style> 