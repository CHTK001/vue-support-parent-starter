/**
 * 地图组件 - Leaflet版本
 * @author 根据ScLayer组件移植实现
 */
<template>
  <div class="sc-map" :style="{ height: config.height + 'px' }">
    <div ref="mapContainer" class="map-container"></div>
    <MapToolbar ref="mapToolbarRef" v-if="config.showToolbar" :toolbar-config="toolbarConfig"
      :active-tool-id="activeToolId" @tool-activated="handleToolActivated"
      @tool-deactivated="handleToolDeactivated" class=map-toolbar />
    <!-- 添加坐标面板 -->
    <CoordinatePanel v-if="showCoordinatePanel" :active="true" :coordinate-info="coordinateInfo"
      :show-projected="coordinateOptions.showProjected" />
    <!-- 添加图层面板 -->
    <LayerPanel v-if="showLayerPanel" :active="showLayerPanel" :position="layerPanelPosition"
      :map-type="configObject?.getMapType() || MapType.GAODE" 
      :map-tile="configObject?.getMapTile() || MapTile.NORMAL"
      :map-config="configObject?.getMapConfig() || DEFAULT_MAP_CONFIG" @close="handleLayerPanelClose" @layer-change="handleLayerChange" />
    
    <!-- 增加引入OverviewMap组件 -->
    <OverviewMap v-if="showOverviewMap && mapObj?.getMapInstance()" :main-map="mapObj.getMapInstance()!" :visible="showOverviewMap"
      :position="determineOverviewMapPosition()" :config="overviewMapConfig"
      :map="props.map"
      :map-key="props.mapKey"
      @collapse-change="handleOverviewMapCollapseChange" />
    
    <!-- 添加轨迹播放器 -->
    <TrackPlayerMap 
      v-if="showTrackPlayer && mapReady && trackObj" 
      :trackObj="trackObj"
      :config="props.trackPlayerConfig"
      @track-selected="handleTrackSelected"
      @track-deleted="handleTrackDeleted"
      @collapse-change="handleTrackPlayerCollapseChange"
      ref="trackPlayerRef" 
    />
    
    <!-- 添加飞线图面板 -->
    <FlightLinePanel
      v-if="showFlightLinePanel && mapReady && flightLineAdapter"
      :flight-line-obj="flightLineAdapter"
      :active="showFlightLinePanel"
      :position="props.flightLinePanelPosition"
      @close="handleFlightLinePanelClose"
      @selection-change="handleFlightLineSelectionChange"
      ref="flightLinePanelRef"
    />
    
  </div>
</template>

<script lang="ts">
export default {
  name: 'ScMap'
};
</script>

<script setup lang="ts">
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';

// 组件导入
import CoordinatePanel from './components/CoordinatePanel.vue';
import FlightLinePanel from './components/FlightLinePanel.vue';
import LayerPanel from './components/LayerPanel.vue';
import MapToolbar from './components/MapToolbar.vue';
import OverviewMap, { OverviewMapConfig } from './components/OverviewMap.vue';
import TrackPlayerMap from './components/TrackPlayer.vue';

// 类和工具导入
import { ConfigObject } from './composables/ConfigObject';
import {
  CoordinateInfo,
  CoordinateOptions,
  CoordinatePosition
} from './composables/CoordinateObject';
import type { GridConfig } from './composables/GridManager';
import { GridManager, GridType } from './composables/GridManager';
import logger, { LogLevel } from './composables/LogObject';
import { MapObject } from './composables/MapObject';
import { MarkerObject } from './composables/MarkerObject';
import { ShapeObject } from './composables/ShapeObject';
import { ToolbarObject } from './composables/ToolbarObject';
import type { MapEventType, Track } from './types';
import { MapConfig, MapTile } from './types';
import { DEFAULT_MAP_CONFIG, MapType } from './types/map';
import type { MarkerConfig, MarkerOptions } from './types/marker';
import type { ShapeOption } from './types';
import { DEFAULT_TOOLBAR_CONFIG } from './types/toolbar';
import { TrackPlayerConfigOptions } from './types/track';
// 不再直接导入TrackObject，使用ToolbarObject.getTrackObject()方法获取
// 导入热力图相关类型
// 导入聚合相关类型
import type { AggregationOptions } from './types/cluster';
// 导入Leaflet插件配置
import { setupLeafletPlugins } from './plugin';
// 导入事件常量
import { MAP_EVENTS } from './constants/events';

// 修复Leaflet图标问题
const fixLeafletIcon = () => {
  // 解决Leaflet默认图标路径问题
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  });
};

// 定义组件属性 - 使用types中的配置作为类型定义
const props = withDefaults(defineProps<MapConfig & {
  overviewMapConfig?: OverviewMapConfig,
  trackPlayerConfig?: Partial<TrackPlayerConfigOptions>,
  gridConfig?: Partial<GridConfig>,
  flightLinePanelPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  markerConfig?: MarkerConfig,
  // 添加聚合配置选项
  aggregationOptions?: AggregationOptions
}>(), {
  height: 500,
  center: () => [39.90923, 116.397428], 
  mapType: MapType.GAODE,
  mapTile: MapTile.NORMAL,
  map: () => DEFAULT_MAP_CONFIG as any, // 使用类型断言处理复杂类型
  mapKey: () => ({}),
  zoom: 10,
  dragging: true,
  scrollWheelZoom: true,
  showToolbar: true,
  toolbarConfig: () => ({ ...DEFAULT_TOOLBAR_CONFIG }),
  coordinateOptions: () => ({
    decimals: 8,
    position: 'bottom-right',
    showProjected: false
  }),
  overviewMapConfig: () => ({}),
  showScaleLine: true, // 默认显示比例尺
  trackPlayerConfig: () => ({}), // 使用默认轨迹播放器配置
  flightLinePanelPosition: 'top-right', // 飞线面板默认位置改为右上角
  markerConfig: () => ({
    scaleWithZoom: true, // 默认图标大小受到zoom影响
    groupIcon: {}, // 空的分组图标集合
    baseZoom: 10, // 基准缩放级别
    zoomFactor: 0.03, // 缩放系数降低为0.03，减少缩放影响
    minScale: 0.8, // 最小缩放比例调整为0.8
    maxScale: 1.2 // 最大缩放比例调整为1.2，防止图标过大
  }), // 使用默认标记点配置
  aggregationOptions: () => ({
    maxClusterRadius: 80, // 默认聚合半径为80像素
    radiusUnit: 'pixel', // 默认单位为像素
    color: '#1890ff', // 默认颜色
    borderColor: '#ffffff', // 默认边框颜色
    useWeightAsSize: true, // 根据数量显示大小
    showCount: true, // 显示数量
    enablePulse: true, // 启用脉冲效果
    enableAnimation: true, // 启用持续动画，即使地图静止不动也会运行动画
    zoomToBoundsOnClick: true, // 点击聚合点时缩放到边界
    colorRanges: [
      { value: 10, color: '#5470c6' },  // 聚合点数量≥10时使用蓝色
      { value: 50, color: '#91cc75' },  // 聚合点数量≥50时使用绿色
      { value: 100, color: '#fac858' }, // 聚合点数量≥100时使用黄色
      { value: 200, color: '#ee6666' }  // 聚合点数量≥200时使用红色
    ]
  }) // 默认聚合配置
});

// 定义组件事件
const emit = defineEmits<{
  (e: string, payload: any): void;
  (e: 'update:center', center: [number, number]): void;
  (e: 'update:zoom', zoom: number): void;
  (e: 'toolbar-tool-activated', payload: { toolId: string, toolbarObj: ToolbarObject }): void;
  (e: 'toolbar-tool-deactivated', payload: { toolId: string, toolbarObj: ToolbarObject }): void;
  (e: 'toolbar-state-change', payload: { toolId: string, active: boolean, toolType: string, data?: any }): void;
  (e: 'map-initialized', payload: { map: MapObject, toolbar: ToolbarObject }): void;
  (e: 'marker-click', payload: { coordinates: number[], data: MarkerOptions }): void;
  (e: 'marker-create', payload: { id: string, options: MarkerOptions }): void;
  (e: 'marker-update', payload: { id: string, options: Partial<MarkerOptions> }): void;
  (e: 'marker-delete', payload: { id: string }): void;
  (e: 'shape-create', payload: { id: string, options: ShapeOption }): void;
  (e: 'shape-update', payload: { id: string, options: Partial<ShapeOption> }): void;
  (e: 'shape-delete', payload: { id: string }): void;
  (e: 'layer-change', payload: { mapType: MapType, mapTile: MapTile }): void;
  (e: 'grid-enabled', payload: { gridType: GridType }): void;
  (e: 'grid-disabled', payload: { gridType: GridType }): void;
  (e: 'flight-line-selection-change', payload: { selectedIds: string[], count: number }): void;
  (e: 'map-mouse-move', payload: any): void;
  (e: 'map-mousemove', payload: any): void;
  (e: 'map-click', payload: any): void;

}>();

// 组件状态
const mapContainer = ref<HTMLElement>();
// 初始设置为null，组件构建时创建实例
let configObject: ConfigObject | null = null;
let mapObj: MapObject | null = null;
let toolbarObject: ToolbarObject | null = null;
let markerObject: MarkerObject | null = null;
let shapeObject: ShapeObject | null = null;
// 使用类型别名表示任意满足轨迹播放接口的对象
let trackObj: any = null;
let gridManager: GridManager | null = null;

// 响应式状态
const activeToolId = ref<string | undefined>(undefined);
const mapInitialized = ref<boolean>(false);
const showCoordinatePanel = ref<boolean>(false);
const showOverviewButton = ref<boolean>(false);
const showOverviewMap = ref<boolean>(false);
const showLayerPanel = ref<boolean>(false);
const showTrackPlayer = ref<boolean>(false);
const showFlightLinePanel = ref<boolean>(false);
const layerPanelPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
const mapToolbarRef = ref<ComponentPublicInstance<{ setToolbarObj: (obj: ToolbarObject) => void }>>(null);
const trackPlayerRef = ref(null);
const flightLinePanelRef = ref(null);
const mapReady = ref(false);

// 坐标选项
const coordinateOptions = computed<CoordinateOptions>(() => ({
  decimals: props.coordinateOptions?.decimals ?? 8,
  position: props.coordinateOptions?.position as CoordinatePosition || 'bottom-right',
  showProjected: props.coordinateOptions?.showProjected !== undefined ? props.coordinateOptions.showProjected : true
}));

// 坐标信息状态
const coordinateInfo = ref<CoordinateInfo>({
  lng: 0,
  lat: 0,
  x: 0,
  y: 0,
  projection: 'EPSG:3857',
  decimals: coordinateOptions.value.decimals ?? 8,
  position: coordinateOptions.value.position ?? 'bottom-right'
});

// 计算属性
const config = computed(() => ({
  mapType: props.mapType,
  mapTile: props.mapTile,
  map: props.map,
  mapKey: props.mapKey,
  height: props.height,
      center: props.center,
      zoom: props.zoom,
      dragging: props.dragging,
      scrollWheelZoom: props.scrollWheelZoom,
  showToolbar: props.showToolbar
}));

const toolbarConfig = computed(() => {
  if (!toolbarObject) return {...props.toolbarConfig};
  // 从ToolbarObject获取最新的工具栏配置
  return toolbarObject.getConfig();
});

// 创建飞线适配器，满足FlightLinePanel需要的接口
const flightLineAdapter = computed(() => {
  if (!toolbarObject?.getFlightLineObject()) return null;
  
  const flightLineObj = toolbarObject.getFlightLineObject()!;
  
  return {
    // 原始方法
    getAllFlightLines: () => {
      // 将Map<string, FlightLineData>转换为Panel需要的FlightLine[]格式
      const lines = flightLineObj.getAllFlightLines();
      const result: any[] = [];
      
      lines.forEach((line, id) => {
        result.push({
          id,
          name: `${line.fromName} → ${line.toName}`,
          from: {
            name: line.fromName,
            latlng: line.from || (line.coords as any)[0]
          },
          to: {
            name: line.toName,
            latlng: line.to || (line.coords as any)[1]
          },
          color: line.style?.color,
          width: line.style?.width,
          visible: line.highlight !== false
        });
      });
      
      return result;
    },
    
    // 添加必要的缺失方法
    removeFlightLine: (id: string) => {
      if (flightLineObj.getAllFlightLines().has(id)) {
        flightLineObj.getAllFlightLines().delete(id);
        flightLineObj.drawFlightLines();
    return true;
      }
    return false;
    },
    
    toggleFlightLineVisibility: (id: string) => {
      const lines = flightLineObj.getAllFlightLines();
      const line = lines.get(id);
      if (line) {
        // 切换highlight属性
        line.highlight = line.highlight === false ? true : false;
        lines.set(id, line);
        flightLineObj.drawFlightLines();
      return true;
    }
    return false;
    },
    
    startDrawing: () => {
      // 简单实现，可以在这里添加绘制逻辑
      console.log('开始绘制飞线');
      return true;
    },
    
    getFlightLineById: (id: string) => {
      const line = flightLineObj.getAllFlightLines().get(id);
      if (!line) return null;
      
      return {
        id,
        name: `${line.fromName} → ${line.toName}`,
        from: {
          name: line.fromName,
          latlng: line.from || (line.coords as any)[0]
        },
        to: {
          name: line.toName,
          latlng: line.to || (line.coords as any)[1]
        },
        color: line.style?.color,
        width: line.style?.width,
        visible: line.highlight !== false
      };
    },
    
    updateFlightLineStyle: (options: any) => {
      // 更新所有选中飞线的样式
      const lines = flightLineObj.getAllFlightLines();
      lines.forEach((line, id) => {
        if (line.highlight) {
          line.style = {
            ...line.style,
            color: options.color,
            width: options.width,
            curveness: options.arcHeight
          };
          lines.set(id, line);
        }
      });
      flightLineObj.drawFlightLines();
    },
    
    updateFlightLine: (id: string, options: any) => {
      // 调用原始方法如果存在
      if (typeof flightLineObj.updateFlightLine === 'function') {
        return flightLineObj.updateFlightLine(id, options);
      }
      
      // 否则实现自己的逻辑
      const lines = flightLineObj.getAllFlightLines();
      const line = lines.get(id);
      if (line) {
        if (options.style) {
          line.style = {
            ...(line.style || {}),
            ...options.style
          };
        }
        if (options.highlight !== undefined) {
          line.highlight = options.highlight;
        }
        lines.set(id, line);
        flightLineObj.drawFlightLines();
      return true;
    }
    return false;
    },
    
    addFlightLine: flightLineObj.addFlightLine.bind(flightLineObj)
  };
});

// 初始化地图
const initMap = async () => {
  try {
    // 设置Leaflet插件
    setupLeafletPlugins();
    
    if (!mapContainer.value) {
      logger.error('地图容器未找到，无法初始化地图');
      return;
    }
    
    // 创建配置对象
    configObject = new ConfigObject(config.value);
    
    // 创建地图对象
    mapObj = new MapObject(configObject);

    // 初始化地图
    const initialized = mapObj.init(mapContainer.value, (event, payload) => {
      emit(event as MapEventType, payload);
      if(event === 'map-mousemove') {
        handleMouseMove(payload);
      }
    });
    
    if (!initialized) {
      logger.error('地图初始化失败');
    return;
  }
  
    // 创建工具栏对象
    toolbarObject = new ToolbarObject(props.toolbarConfig, mapObj);
    
    // 设置工具状态变化回调
    toolbarObject.setToolStateChangeCallback((toolId, active, toolType, data) => {
      emit('toolbar-state-change', { toolId, active, toolType, data });
    });
    nextTick(() => {
      if (mapToolbarRef.value) {
        mapToolbarRef.value?.setToolbarObj(toolbarObject);
      }
    });
    // 获取其他对象引用
    markerObject = toolbarObject.getMarkerObject();
    shapeObject = toolbarObject.getShapeObject();
    trackObj = toolbarObject.getTrackObject(); // 获取轨迹对象（实际是LeafletTrackplayerObject实例）
    gridManager = toolbarObject.getGridObject();
    
    // 标记地图已准备好
    mapReady.value = true;
    mapInitialized.value = true;
    
    // 发射地图初始化完成事件
    emit('map-initialized', { map: mapObj, toolbar: toolbarObject });
    
    logger.info('地图初始化完成');

  } catch (error) {
    logger.error('初始化地图失败:', error);
  }
};

// 处理工具激活
const handleToolActivated = (toolId: string) => {
  if (!toolbarObject) return;
  activeToolId.value = toolId;
  emit('toolbar-tool-activated', {
    toolId,
    toolbarObj: toolbarObject
  });

  // 特定工具激活处理
  if (toolId === 'coordinate') {
    showCoordinatePanel.value = true;
  } else if (toolId === 'layer') {
    showLayerPanel.value = true;
  } else if (toolId === 'overview') {
    showOverviewMap.value = true;
  } else if (toolId === 'trackPlayer') {
    showTrackPlayer.value = true;
  } else if (toolId === 'flightLine') {
    showFlightLinePanel.value = true;
  }
};

// 处理工具停用
const handleToolDeactivated = (toolId: string) => {
  if (!toolbarObject) return;
  
  // 清除激活的工具ID
  if (activeToolId.value === toolId) {
    activeToolId.value = undefined;
  }
  
  emit('toolbar-tool-deactivated', {
    toolId,
    toolbarObj: toolbarObject
  });

  // 特定工具停用处理
  if (toolId === 'coordinate') {
    showCoordinatePanel.value = false;
  } else if (toolId === 'layer') {
    showLayerPanel.value = false;
  } else if (toolId === 'overview') {
    showOverviewMap.value = false;
  } else if (toolId === 'trackPlayer') {
    showTrackPlayer.value = false;
  } else if (toolId === 'flightLine') {
    showFlightLinePanel.value = false;
  }
};

// 处理图层面板关闭
const handleLayerPanelClose = () => {
  showLayerPanel.value = false;
  
  // 如果工具栏存在，停用layer工具
  if (toolbarObject) {
    toolbarObject.deactivateTool('layer');
  }
};

// 处理飞线面板关闭
const handleFlightLinePanelClose = () => {
  showFlightLinePanel.value = false;
  
  // 如果工具栏存在，停用flightLine工具
  if (toolbarObject) {
    toolbarObject.deactivateTool('flightLine');
  }
};

// 处理图层切换
const handleLayerChange = ({ mapType, mapTile }: { mapType: MapType, mapTile: MapTile }) => {
  if (!mapObj || !configObject) return;
  
  // 更新配置对象
  configObject.setMapType(mapType);
  configObject.setMapTile(mapTile);
  
  // 切换底图
  const success = mapObj.switchBaseLayer(mapType, mapTile);
  
  if (success) {
    emit('layer-change', { mapType, mapTile });
    logger.info(`图层已切换: ${mapType} - ${mapTile}`);
  } else {
    logger.error(`图层切换失败: ${mapType} - ${mapTile}`);
  }
};

// 确定鹰眼地图位置
const determineOverviewMapPosition = (): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' => {
  // 根据工具栏位置调整鹰眼地图位置
  if (props.toolbarConfig?.position === 'bottom-right') {
    return 'bottom-left';
  } else if (props.toolbarConfig?.position === 'bottom-left') {
    return 'bottom-right';
  } else if (props.toolbarConfig?.position === 'top-left') {
    return 'top-right';
  }
  return 'bottom-right'; // 默认位置
};

// 处理鹰眼地图折叠状态变化
const handleOverviewMapCollapseChange = (collapsed: boolean) => {
  if (toolbarObject) {
    // 通知工具栏鹰眼地图状态已变更
    toolbarObject.triggerToolStateChange('overview', !collapsed, 'OVERVIEW');
  }
};

// 处理轨迹选择
const handleTrackSelected = (trackId: string) => {
  // 处理轨迹选择事件
  logger.info(`轨迹已选中: ${trackId}`);
};

// 处理轨迹删除
const handleTrackDeleted = (trackId: string) => {
  // 处理轨迹删除事件
  logger.info(`轨迹已删除: ${trackId}`);
};

// 处理轨迹播放器折叠状态变化
const handleTrackPlayerCollapseChange = (collapsed: boolean) => {
  if (toolbarObject) {
    // 通知工具栏轨迹播放器状态已变更
    toolbarObject.triggerToolStateChange('trackPlayer', !collapsed, 'TRACK_PLAYER');
  }
};

// 处理飞线选择变化
const handleFlightLineSelectionChange = (selectedIds: string[]) => {
  emit('flight-line-selection-change', {
    selectedIds,
    count: selectedIds.length
  });
};

// 组件挂载时初始化地图
onMounted(() => {
  // 设置日志级别
  logger.setLevel(LogLevel.DEBUG);
  logger.info('ScMap组件已挂载');
  
  // 初始化地图
  initMap();
  
  // 如果配置了自动激活鹰眼地图，则激活它
  if (props.overviewMapConfig?.autoActivate && toolbarObject) {
    toolbarObject.activateTool('overview');
  }
});

// 组件卸载前清理资源
onBeforeUnmount(() => {
  logger.info('ScMap组件即将卸载，清理资源...');
  
  // 清理工具栏
  if (toolbarObject) {
    toolbarObject.destroy();
    toolbarObject = null;
  }
  
  // 清理地图
  if (mapObj) {
    mapObj.destroy();
    mapObj = null;
  }
  
  // 重置状态
  mapInitialized.value = false;
  mapReady.value = false;
  configObject = null;
});

// 监听属性变化
watch(() => props.center, (newCenter) => {
  if (mapObj && mapInitialized.value) {
    mapObj.setCenter(newCenter[0], newCenter[1]);
  }
}, { deep: true });

watch(() => props.zoom, (newZoom) => {
  if (mapObj && mapInitialized.value) {
    mapObj.setZoom(newZoom);
  }
});

watch(() => props.dragging, (newVal) => {
  if (mapObj && mapInitialized.value) {
    mapObj.setInteractions({ dragging: newVal });
  }
});

watch(() => props.scrollWheelZoom, (newVal) => {
  if (mapObj && mapInitialized.value) {
    mapObj.setInteractions({ scrollWheelZoom: newVal });
  }
});

// 监听标记配置变化
watch(() => props.markerConfig, (newConfig) => {
  if (markerObject && newConfig) {
    markerObject.setConfig(newConfig);
  }
}, { deep: true });

// 监听聚合配置变化
watch(() => props.aggregationOptions, (newOptions) => {
  if (toolbarObject && newOptions) {
    toolbarObject.setClusterConfig(newOptions);
  }
}, { deep: true });

// 地图事件处理函数
const handleMapClick = (event: any) => {
  emit(MAP_EVENTS.MAP_CLICK, event);
};

const handleMapMove = (event: any) => {
  emit(MAP_EVENTS.MAP_MOVE, event);
};

const handleMapZoom = (event: any) => {
  emit(MAP_EVENTS.MAP_ZOOM, event);
  // 更新缩放级别
  if (event.zoom !== undefined) {
    emit('update:zoom', event.zoom);
  }
};

const handleMapMoveEnd = (event: any) => {
  emit(MAP_EVENTS.MAP_MOVE_END, event);
  // 更新中心点
  if (event.center) {
    emit('update:center', event.center);
  }
};

const handleMapZoomEnd = (event: any) => {
  emit(MAP_EVENTS.MAP_ZOOM_END, event);
};

const handleMouseMove = (event: any) => {
  // 更新坐标信息
  if (event.coordinates) {
    coordinateInfo.value = {
      ...coordinateInfo.value,
      lat: event.coordinates[0],
      lng: event.coordinates[1],
      x: event.projectedX || 0,
      y: event.projectedY || 0
    };
  }
  emit(MAP_EVENTS.MAP_MOUSE_MOVE, event);
};

// 工具栏事件处理
const handleToolbarEvent = (eventName: string, payload: any) => {
  // 根据事件名发射对应事件
  emit(eventName as MapEventType, payload);
};

// 对外暴露方法
defineExpose({
  // 地图操作
  getMapInstance: () => mapObj?.getMapInstance(),
  getMapObject: () => mapObj,
  getToolbarObject: () => toolbarObject,
  setCenter: (lat: number, lng: number) => mapObj?.setCenter(lat, lng),
  setZoom: (zoom: number) => mapObj?.setZoom(zoom),
  getCenter: () => mapObj?.getCenter(),
  getZoom: () => mapObj?.getZoom(),
  
  // 标记点操作
  addMarker: (options: MarkerOptions) => markerObject?.addMarker(options),
  updateMarker: (id: string, options: Partial<MarkerOptions>) => markerObject?.updateMarker(id, options),
  removeMarker: (id: string) => markerObject?.removeMarker(id),
  getMarker: (id: string) => markerObject?.getMarker(id),
  showAllMarkers: () => markerObject?.showAll(),
  hideAllMarkers: () => markerObject?.hideAll(),
  
  // 图形操作
  addShape: (options: ShapeOption) => shapeObject?.addShape(options),
  updateShape: (id: string, options: Partial<ShapeOption>) => shapeObject?.updateShape(id, options),
  removeShape: (id: string) => shapeObject?.removeShape(id),
  getShape: (id: string) => shapeObject?.getShape(id),
  clearShapes: () => shapeObject?.clearAll(),
  
  // 轨迹操作
  addTrack: (track: Track) => trackObj?.addTrack(track),
  removeTrack: (trackId: string) => trackObj?.removeTrack(trackId),
  getTrack: (trackId: string) => trackObj?.getTrack(trackId),
  clearTracks: () => trackObj?.clearTracks?.(), // 添加可选链，防止clearTracks不存在
  
  // 网格操作
  enableGrid: (gridType: GridType) => gridManager?.enableGrid(gridType),
  disableGrid: (gridType: GridType) => gridManager?.disableGrid(gridType),
  
  // 飞线操作
  addFlightLine: (from: [number, number], to: [number, number], options?: any) => {
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj) {
      // 创建飞线数据对象
      const flightLineData = {
        fromName: options?.fromName || 'Origin',
        toName: options?.toName || 'Destination',
        from: from,
        to: to,
        coords: [from, to], // 添加coords属性满足FlightLineData接口要求
        style: options?.style,
        data: options?.data
      };
      return flightLineObj.addFlightLine(flightLineData);
    }
    return null;
  },
  removeFlightLine: (id: string) => {
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj && flightLineObj.getAllFlightLines().has(id)) {
      flightLineObj.getAllFlightLines().delete(id);
      flightLineObj.drawFlightLines(); // 重绘飞线
        return true;
      }
      return false;
  },
  clearFlightLines: () => {
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj) {
      flightLineObj.getAllFlightLines().clear();
      return true;
    }
      return false;
  },
  getAllFlightLines: () => {
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj) {
      return flightLineObj.getAllFlightLines();
    }
    return new Map();
  },
  
  // 工具面板控制
  showFlightLineList: () => {
    showFlightLinePanel.value = true;
    if (toolbarObject) {
      toolbarObject.activateTool('flightLine');
    }
  },
  hideFlightLineList: () => {
    showFlightLinePanel.value = false;
    if (toolbarObject) {
      toolbarObject.deactivateTool('flightLine');
    }
  }
});
</script>

<style scoped>
.sc-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px; /* 增加最小高度，确保地图可见 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}
.map-toolbar {
  position: absolute;
  z-index: 10;
}

.toolbar-container {
  position: absolute;
  z-index: 10;
}
</style>