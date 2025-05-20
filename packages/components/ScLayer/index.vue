/**
 * 地图组件
 * @author CH
 * @date 2025-04-29
 */
<template>
  <div class="sc-layer" :style="{ height: config.height + 'px' }">
    <div ref="mapContainer" class="map-container"></div>
    <div class="toolbar-container">
      <MapToolbar ref="mapToolbarRef" v-if="config.showToolbar" :toolbar-config="toolbarConfig"
        :active-tool-id="activeToolId" @tool-activated="handleToolActivated"
        @tool-deactivated="handleToolDeactivated"
        @toggle-3d="toggle3D" />
    </div>
    <!-- 添加坐标面板 -->
    <CoordinatePanel v-if="showCoordinatePanel" :active="true" :coordinate-info="coordinateInfo"
      :show-projected="coordinateOptions.showProjected" />
    <!-- 添加图层面板 -->
    <LayerPanel v-if="showLayerPanel" :active="showLayerPanel" :position="layerPanelPosition"
      :map-type="configObject?.getMapType()" :map-tile="configObject?.getMapTile()"
      :map-config="configObject?.getMapConfig()" @close="handleLayerPanelClose" @layer-change="handleLayerChange" />
    
    <!-- 增加引入OverviewMap组件 -->
    <OverviewMap v-if="showOverviewMap" :main-map-obj="mapObj" :visible="showOverviewMap"
      :position="determineOverviewMapPosition()" :config="overviewMapConfig"
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
      v-if="showFlightLinePanel && mapReady"
      :flight-line-obj="toolbarObject?.getFlightLineObject()"
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
  name: 'ScLayer'
};
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, useAttrs, shallowRef } from 'vue';
import CoordinatePanel from './components/CoordinatePanel.vue';
import MapToolbar from './components/MapToolbar.vue';
import OverviewMap from './components/OverviewMap.vue';
import { OverviewMapConfig } from './components/OverviewMap.vue';
import LayerPanel from './components/LayerPanel.vue';
import TrackPlayerMap from './components/TrackPlayer.vue';
import { ConfigObject } from './composables/ConfigObject';
import { 
  CoordinateInfo, 
  CoordinateOptions, 
  CoordinatePosition 
} from './composables/CoordinateObject';
import logger, { LogLevel } from './composables/LogObject';
import { MapObject } from './composables/MapObject';
import { MapType, DEFAULT_MAP_CONFIG } from './types/map';
import { MapTile, MapConfig } from './types';
import { ToolbarObject } from './composables/ToolbarObject';
import { GridManager, GridType } from './composables/GridManager';
import type { GridConfig } from './composables/GridManager';
import type { MapEventType, Track, TrackPlayer } from './types';
import { TrackPlayerConfigOptions } from './types/track';
import { DEFAULT_TOOLBAR_CONFIG, ToolbarConfig, ToolbarPosition } from './types/toolbar';
import { MarkerObject } from './composables/MarkerObject';
import type { MarkerOptions, MarkerConfig } from './types/marker';
import { ShapeObject, ShapeType } from './composables/ShapeObject';
import { Shape, ShapeOption } from './types/shape';
import { TrackObject } from './composables/TrackObject';
import { DEFAULT_CESIUM_BASE_URL } from './types/default';
// 导入热力图相关类型
import type { HeatmapPoint, HeatmapConfig } from './types';
// 导入聚合相关类型
import type { AggregationOptions } from './types/cluster';
import { Map as OlMap } from 'ol';
// 引入OpenLayers样式
import 'ol/ol.css';
import { DEFAULT_TRACK_PLAYER_CONFIG } from './types/default';
import FlightLinePanel from './components/FlightLinePanel.vue';
// ol-cesium集成
import  OLCesium  from 'olcs';
// ... existing code ...
import * as Cesium from 'cesium';
if (typeof window !== 'undefined' && !window.Cesium) {
  window.Cesium = Cesium;
}
import 'cesium/Build/Cesium/Widgets/widgets.css';

// 定义组件属性 - 使用types中的配置作为类型定义
const props = withDefaults(defineProps<MapConfig & {
  overviewMapConfig?: OverviewMapConfig,
  trackPlayerConfig?: Partial<TrackPlayerConfigOptions>,
  gridConfig?: Partial<GridConfig>,
  flightLinePanelPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  markerConfig?: MarkerConfig,
  // 添加聚合配置选项
  aggregationOptions?: AggregationOptions,
  cesiumBaseUrl?: string
}>(), {
  height: 500,
  center: () => [39.90923, 116.397428], 
  mapType: MapType.GAODE,
  mapTile: MapTile.NORMAL,
  map: () => DEFAULT_MAP_CONFIG,
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
  trackPlayerConfig: () => ({ ...DEFAULT_TRACK_PLAYER_CONFIG }), // 使用默认轨迹播放器配置
  geohashGridConfig: () => ({
    geohash: {
      buffer: 4, // 计算可视范围外2个网格
      precision: 8, // 精度为6
      strokeColor: 'rgba(0, 60, 136, 0.8)', // 边框颜色
      fillColor: 'rgba(0, 60, 136, 0.2)', // 填充颜色
      showLabels: true // 显示标签
    }
  } as GridConfig), // 使用默认配置
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
  }), // 默认聚合配置
  cesiumBaseUrl: DEFAULT_CESIUM_BASE_URL
});

// 定义组件事件
const emit = defineEmits<{
  (e: MapEventType, payload: any): void;
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
}>();

// 组件状态
const mapContainer = ref<HTMLElement>();
// 使用普通变量而非响应式引用
let configObject: ConfigObject | null = null;
let mapObj: MapObject | null = null;
let toolbarObject: ToolbarObject | null = null;
let markerObject: MarkerObject | null = null;
let shapeObject: ShapeObject | null = null;
let trackObj: TrackObject | null = null;
let gridManager: GridManager | null = null;

// 响应式状态
const activeToolId = ref<string | undefined>(undefined);
const mapInitialized = ref<boolean>(false);
const showCoordinatePanel = ref<boolean>(false);
const showOverviewButton = ref<boolean>(false);
const showOverviewMap = ref<boolean>(false);
const showLayerPanel = ref<boolean>(false);
const showTrackPlayer = ref<boolean>(false);
const layerPanelPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
const mapToolbarRef = ref(null);
const trackPlayerRef = ref(null);
const mapReady = ref(false);

// 坐标选项
const coordinateOptions = computed<CoordinateOptions>(() => ({
  decimals: props.coordinateOptions?.decimals ?? 8,
  position: props.coordinateOptions?.position as CoordinatePosition || 'bottom-right',
  showProjected: props.coordinateOptions?.showProjected !== undefined ? props.coordinateOptions.showProjected : true
}));

// 坐标信息状态
const coordinateInfo = ref<CoordinateInfo>({
  longitude: 0,
  latitude: 0,
  projectedX: 0,
  projectedY: 0,
  projection: 'EPSG:3857',
  decimals: coordinateOptions.value.decimals,
  position: coordinateOptions.value.position
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

// 初始化地图
const initMap = () => {
  if (!mapContainer.value) {
    logger.error('地图容器未找到，无法初始化地图');
    return;
  }
  
  try {
    // 记录地图容器信息
    logMapContainerInfo();
    // 初始化地图组件
    initializeMapComponents();
    // 注册事件处理程序
    registerEventHandlers();
    
    // 触发初始化完成事件
    emitMapInitializedEvent();
  } catch (error) {
    logger.error('地图初始化过程中出错:', error);
  }
};

// 记录地图容器信息
const logMapContainerInfo = () => {
  logger.info('开始初始化地图组件，容器尺寸:', {
    width: mapContainer.value!.clientWidth,
    height: mapContainer.value!.clientHeight
  });
};

// 初始化地图组件
const initializeMapComponents = async () => {
  try {
  // 创建配置对象
    configObject = new ConfigObject(config.value);
  
    // 创建地图对象 - 正确传递参数
  mapObj = new MapObject(configObject);
  
  // 初始化地图
    if (mapContainer.value) {
      const initResult = await mapObj.init(mapContainer.value, emit);
      if (!initResult) {
        throw new Error('地图初始化失败');
      }
      
      // 标记地图已准备就绪
      mapReady.value = true;
    } else {
      throw new Error('地图容器未找到');
    }
    
    // 如果有配置的mapKey，添加到配置对象中
    if (config.value.mapKey && Object.keys(config.value.mapKey).length > 0) {
      // 直接更新配置对象的mapKey
      const configMapKey = configObject.getConfig().mapKey;
      for (const mapType in config.value.mapKey) {
        configMapKey[mapType] = config.value.mapKey[mapType];
      }
    }
  
  // 创建工具栏对象
  toolbarObject = new ToolbarObject(props.toolbarConfig, mapObj);

    // 设置工具栏对象到地图对象
    if (mapToolbarRef.value) {
      mapToolbarRef.value.setToolbarObj(toolbarObject);
    }

    // 创建标记点对象 - 从toolbarObject获取
  markerObject = toolbarObject.getMarkerObject();
    
    // 如果存在标记点配置，应用配置
    if (markerObject && props.markerConfig) {
      markerObject.setConfig(props.markerConfig);
    }
    
    // 设置聚合配置
    if (props.aggregationOptions && toolbarObject) {
      logger.debug('设置聚合配置:', props.aggregationOptions);
      toolbarObject.setClusterConfig(props.aggregationOptions);
    }
  
    // 创建图形绘制对象 - 从toolbarObject获取
  shapeObject = toolbarObject.getShapeObject();
    
    // 创建轨迹对象 - 从toolbarObject获取
    trackObj = toolbarObject.getTrackObject();
    
    // 获取地图实例并创建GridManager
    const olMap = mapObj.getMapInstance();
    if (olMap) {
      gridManager = new GridManager(olMap, props.gridConfig);
    }
    
    // 设置工具栏状态变化监听器
    setupToolbarStateChangeListener();
    
    // 设置坐标面板监听
    setupCoordinatePanelWatcher();
    
    // 标记地图初始化完成
    mapInitialized.value = true;
    
    // 添加窗口尺寸变化监听，响应式调整地图尺寸
    window.addEventListener('resize', resizeMap);
    
    // 初始化后立即检查鹰眼状态，确保UI状态与实际工具状态一致
    checkOverviewMapState();
    
    // 初始化后立即检查轨迹播放器状态，确保UI状态与工具状态一致
    checkTrackPlayerState();
    
    logger.info('地图和工具栏初始化完成');
  } catch (error) {
    logger.error('初始化地图组件时发生错误:', error);
    throw error;
  }
};

// 注册各种事件处理程序
const registerEventHandlers = () => {
  // 鼠标移动监听
  setupMouseMoveListener();
  
  // 工具栏状态变化监听
  setupToolbarStateChangeListener();
  
  // 坐标面板状态监听
  setupCoordinatePanelWatcher();
};

// 设置鼠标移动监听
const setupMouseMoveListener = () => {
  if (!mapObj) return;
  
  mapObj.setPointerMoveListener((event, coordinate) => {
    // 更新坐标信息
    coordinateInfo.value = {
      longitude: coordinate.longitude || 0,
      latitude: coordinate.latitude || 0,
      projectedX: coordinate.projectedX || 0,
      projectedY: coordinate.projectedY || 0,
      projection: coordinate.projection || 'EPSG:3857',
      decimals: coordinate.decimals || coordinateOptions.value.decimals,
      position: coordinate.position || coordinateOptions.value.position as CoordinatePosition
    };
  });
};

// 通知地图初始化完成
const emitMapInitializedEvent = () => {
  if (!mapObj || !toolbarObject) return;
  
  emit('map-initialized', {
    map: mapObj,
    toolbar: toolbarObject
  });
};

// 更新激活工具ID
const updateActiveToolId = (toolId: string, active: boolean) => {
  if (active) {
    activeToolId.value = toolId;
  } else if (activeToolId.value === toolId) {
    activeToolId.value = undefined;
  }
};

// 根据工具ID和类型处理不同状态变化
const handleToolStateByType = (toolId: string, active: boolean, toolType: string, data?: any) => {
  // 使用Map对象替代条件判断链
  const handlers: Record<string, () => void> = {
    // 坐标工具处理
    'coordinate': () => {
      showCoordinatePanel.value = active;
      logger.debug(`坐标工具状态变化: ${active ? '激活' : '停用'}, 面板显示: ${showCoordinatePanel.value}`);
    },
    
    // 坐标面板强制显示事件
    'coordinate-panel-visible': () => {
      if (toolType === 'panel' && active) {
        showCoordinatePanel.value = true;
        logger.debug('收到坐标面板强制显示事件');
      }
    },
    
    // 图层面板强制显示事件
    'layer-panel-visible': () => {
      if (toolType === 'panel' && active) {
        showLayerPanel.value = true;
        layerPanelPosition.value = determineLayerPanelPosition();
        logger.debug('收到图层面板强制显示事件');
      }
    },
    
    // 飞线图状态变化 - 修改键名以匹配工具ID
    'flightLine': () => {
      logger.debug(`[FlightLine] 收到飞线图事件: active=${active}, data=${JSON.stringify(data)}`);
      
      if (active) {
        // 激活时强制启用飞线图，并显示面板
        if (!showFlightLinePanel.value) {
          showFlightLinePanel.value = true;
          // 锁定面板，防止意外关闭
          flightLinePanelLocked.value = true;
          logger.info('[FlightLine] 飞线图已激活，显示飞线列表面板');
          
          // 尝试启用飞线图
          const flightLineObj = toolbarObject?.getFlightLineObject();
          if (flightLineObj) {
            // 确保地图已就绪
            if (mapReady.value) {
            flightLineObj.enable().then(() => {
                logger.debug('[FlightLine] 飞线图已启用并设置最佳视角');
                flightLineObj.setOptimalView(5);
            }).catch(err => {
              logger.error('[FlightLine] 启用飞线图失败:', err);
              });
            } else {
              // 地图未就绪，等待地图就绪后再启用
              logger.debug('[FlightLine] 地图未就绪，等待地图就绪后再启用飞线图');
              
              // 监听地图就绪事件
              watch(mapReady, (ready) => {
                if (ready && flightLineObj) {
                  flightLineObj.enable().then(() => {
                    logger.debug('[FlightLine] 地图就绪后启用飞线图成功');
                    flightLineObj.setOptimalView(5);
                  }).catch(err => {
                    logger.error('[FlightLine] 地图就绪后启用飞线图失败:', err);
                  });
                }
              }, { immediate: true, once: true });
            }
          }
        }
        
        // 延迟处理数据
        setTimeout(() => {
          // 如果有数据，则传递到飞线图对象中
          if (data && Array.isArray(data)) {
                const flightLineObj = toolbarObject?.getFlightLineObject();
                if (flightLineObj) {
              try {
                // 添加飞线数据
                flightLineObj.addFlightLines(data, true, 5); // 添加数据并自动设置最佳视角，缩放级别为5
                logger.info(`[FlightLine] 已添加 ${data.length} 条飞线数据`);
              } catch (error) {
                logger.error('[FlightLine] 添加飞线数据失败:', error);
              }
                }
              }
            }, 500);
      } else {
        // 工具栏停用飞线图时，无论面板是否锁定都应该关闭面板并解除锁定
        showFlightLinePanel.value = false;
        flightLinePanelLocked.value = false;
        logger.debug('[FlightLine] 飞线图已从工具栏禁用，解除面板锁定并隐藏面板');
        
        // 尝试禁用飞线图对象
        const flightLineObj = toolbarObject?.getFlightLineObject();
        if (flightLineObj && flightLineObj.isEnabled()) {
          try {
          flightLineObj.disable();
          logger.debug('[FlightLine] 飞线图已禁用');
          } catch (error) {
            logger.error('[FlightLine] 禁用飞线图失败:', error);
          }
        }
      }
    },
    
    // 保留原来的'flight-line'处理器以保持兼容性
    'flight-line': () => {
      logger.debug(`[FlightLine] 收到旧版flight-line事件，转发到flightLine处理器`);
      handlers['flightLine']();
    },
    
    // 热力图状态变化
    'heatmap': () => {
      logger.debug(`[Heatmap] 收到热力图事件: active=${active}`);
      
      // 更新热力图激活状态
      isHeatmapActive.value = active;
      
      if (active) {
        logger.info('[Heatmap] 热力图已激活，显示热力图面板');
        
        // 尝试启用热力图对象
        const heatmapObj = toolbarObject?.getHeatmapObject();
        if (heatmapObj) {
          try {
            heatmapObj.enable();
            logger.debug('[Heatmap] 热力图已启用');
          } catch (error) {
            logger.error('[Heatmap] 启用热力图失败:', error);
          }
        }
      } else {
        logger.debug('[Heatmap] 热力图已停用，隐藏热力图面板');
        
        // 尝试禁用热力图对象
        const heatmapObj = toolbarObject?.getHeatmapObject();
        if (heatmapObj) {
          try {
            heatmapObj.disable();
            logger.debug('[Heatmap] 热力图已禁用');
          } catch (error) {
            logger.error('[Heatmap] 禁用热力图失败:', error);
          }
        }
      }
    },
    
    // 轨迹播放器工具状态变化
    'track-player': () => {
      showTrackPlayer.value = active;
      if (active) {
        logger.debug('[Track] 轨迹播放器工具已激活');
        
        // 获取轨迹对象
        if (data && data.trackObj) {
          trackObj = data.trackObj;
          logger.debug('[Track] 从事件数据中获取轨迹对象');
        } else if (toolbarObject) {
          const toolbarTrackObj = toolbarObject.getTrackObject();
          if (toolbarTrackObj) {
            trackObj = toolbarTrackObj;
            logger.debug('[Track] 从工具栏对象获取轨迹对象');
          } else {
            // 如果工具栏没有轨迹对象，尝试初始化
            if (mapObj && mapReady.value) {
              initTrackObject();
            } else {
              logger.warn('[Track] 无法初始化轨迹对象：地图未就绪');
            }
          }
        }
        
        if (!trackObj && mapObj && mapReady.value) {
          logger.debug('[Track] 未获取到轨迹对象，尝试初始化');
          initTrackObject();
        }
        
        logger.debug('[Track] 显示轨迹播放器面板，trackObj状态: ' + !!trackObj);
      } else {
        logger.debug('[Track] 轨迹播放器工具已停用，隐藏轨迹播放器面板');
      }
    },
    
    // 图层切换按钮状态变化
    'layer-switch': () => {
      // 当图层按钮状态变化时，控制图层面板的显示/隐藏
      showLayerPanel.value = active;
      if (active) {
        // 如果激活按钮，确定面板位置
        layerPanelPosition.value = determineLayerPanelPosition();
        logger.debug('图层切换按钮已激活，显示图层面板');
      } else {
        logger.debug('图层切换按钮已停用，隐藏图层面板');
      }
    },
    
    // 鹰眼工具状态变化
    'overview': () => {
      logger.debug(`[Overview] 鹰眼工具状态变化: ${active ? '激活' : '停用'}`);
      
      // 直接控制鹰眼地图的显示和隐藏
      showOverviewMap.value = active;
      
      if (active) {
        logger.debug('[Overview] 鹰眼工具已激活，显示鹰眼地图');
      } else {
        logger.debug('[Overview] 鹰眼工具已停用，隐藏鹰眼地图');
      }
      
      // 既然没有关闭按钮，就不需要辅助按钮
      showOverviewButton.value = false;
    },
    
    // 鹰眼控件特殊事件
    'overview-map': () => {
      if (active && data?.forced) {
        logger.debug('[Overview] 收到鹰眼控件强制显示事件');
      }
    },
    'overview-map-enabled': () => {
      if (active && data?.forced) {
        logger.debug('[Overview] 收到鹰眼控件启用事件');
      }
    },
    'overview-map-expanded': () => {
      if (active && data?.forced) {
        logger.debug('[Overview] 收到鹰眼控件展开事件');
      }
    },
    
    // 标记点显示/隐藏工具
    'marker-toggle': () => {
      if (markerObject) {
        if (active) {
          markerObject.hideAllMarkers();
          logger.debug('[Marker] 隐藏所有标记点');
        } else {
          markerObject.showAllMarkers();
          logger.debug('[Marker] 显示所有标记点');
        }
      }
    },
    
    // 标签显示/隐藏工具
    'label-toggle': () => {
      if (markerObject) {
        if (active) {
          markerObject.hideAllLabels();
          logger.debug('[Marker] 隐藏所有标记点标签');
        } else {
          markerObject.showAllLabels();
          logger.debug('[Marker] 显示所有标记点标签');
        }
      }
    },
    
    // 聚合工具状态变化
    'cluster': () => {
      if (markerObject) {
        markerObject.setClusterMode(active);
        logger.debug(`[Marker] 标记点聚合模式: ${active ? '启用' : '禁用'}`);
      }
    },
    
    // 绘制矩形工具
    'draw-rectangle': () => {
      if (active && shapeObject) {
        shapeObject.enable('Rectangle');
        logger.debug('[Shape] 矩形绘制工具已激活');
      } else if (!active && shapeObject && shapeObject.isEnabled()) {
        shapeObject.disable();
        logger.debug('[Shape] 矩形绘制工具已停用');
      }
    },
    
    // 绘制圆形工具
    'draw-circle': () => {
      if (active && shapeObject) {
        shapeObject.enable('Circle');
        logger.debug('[Shape] 圆形绘制工具已激活');
      } else if (!active && shapeObject && shapeObject.isEnabled()) {
        shapeObject.disable();
        logger.debug('[Shape] 圆形绘制工具已停用');
      }
    },
    
    // 绘制多边形工具
    'draw-polygon': () => {
      if (active && shapeObject) {
        shapeObject.enable('Polygon');
        logger.debug('[Shape] 多边形绘制工具已激活');
      } else if (!active && shapeObject && shapeObject.isEnabled()) {
        shapeObject.disable();
        logger.debug('[Shape] 多边形绘制工具已停用');
      }
    },
    
    // 绘制线段工具
    'draw-line': () => {
      if (active && shapeObject) {
        shapeObject.enable('LineString');
        logger.debug('[Shape] 线段绘制工具已激活');
      } else if (!active && shapeObject && shapeObject.isEnabled()) {
        shapeObject.disable();
        logger.debug('[Shape] 线段绘制工具已停用');
      }
    },
    
    // 绘制正方形工具
    'draw-square': () => {
      if (active && shapeObject) {
        shapeObject.enable('Square');
        logger.debug('[Shape] 正方形绘制工具已激活');
      } else if (!active && shapeObject && shapeObject.isEnabled()) {
        shapeObject.disable();
        logger.debug('[Shape] 正方形绘制工具已停用');
      }
    },
    
    // 删除模式按钮 - 启用单击删除图形或标记点的功能
    'clear-shapes': () => {
      // 此处不需要做任何操作，因为ToolbarObject中的activateTool方法已经处理了激活删除模式
      // 避免与ToolbarObject中的逻辑重复，以防止删除功能被错误触发两次
      logger.debug('[Shape] 删除模式按钮处理 - 已由ToolbarObject处理');
    },
    
    // 处理图形编辑工具
    'edit-shape': () => {
      // 此处不需要做任何操作，因为ToolbarObject中的handleShapeEditActivate方法已经处理了激活编辑模式
      // 避免与ToolbarObject中的逻辑重复
      logger.debug('[Shape] 编辑模式按钮处理 - 已由ToolbarObject处理');
    },
    
    // 处理图形创建完成事件
    'shape-created': () => {
      if (toolType === 'shape' && active && data) {
        // 图形绘制完成后，发出创建事件
        const { id, options } = data;
        if (id && options) {
          logger.debug(`[Shape] 接收到图形创建事件，ID: ${id}, 类型: ${options.type}`);
          emit('shape-create' as MapEventType, { id, options });
        }
      }
    },
    
    // 处理图形更新事件
    'edit': () => {
      if (toolType === 'edit' && data && data.action === 'update' && data.shapeId) {
        logger.debug(`[Shape] 接收到图形更新事件，ID: ${data.shapeId}, 类型: ${data.shapeType}`);
        emit('shape-update' as MapEventType, { id: data.shapeId, options: {} });
      }
    },
  };
  
  // 执行对应的处理函数
  const handler = handlers[toolId];
  if (handler) {
    handler();
  }
};

// 监听坐标选项变化
watch(() => props.coordinateOptions, (newOptions) => {
  if (!toolbarObject) return;
  
  logger.debug('坐标选项已更新:', newOptions);
}, { deep: true });

// 处理工具栏工具激活
const handleToolActivated = (payload) => {
  if (!toolbarObject) return;
  
  const toolId = payload.toolId;
  logger.debug(`工具 ${toolId} 已被激活`);
  
  // 更新活动工具ID
  activeToolId.value = toolId;
  
  // 飞线工具激活处理
  if (toolId === 'flightLine') {
    // 显示飞线图面板
    showFlightLinePanel.value = true;
    flightLinePanelLocked.value = true;
    
    // 启用飞线图
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj) {
      flightLineObj.enable().catch(err => {
          logger.error('[FlightLine] 启用飞线图失败:', err);
      });
      
      // 确保刷新飞线列表
      nextTick(() => {
        setTimeout(() => {
          if (flightLinePanelRef.value) {
            flightLinePanelRef.value.refreshFlightLineList();
          }
        }, 300);
      });
    }
    
    logger.debug('[FlightLine] 飞线工具激活，显示面板');
  }
  // ... 其他工具处理保持不变
  
  // 将工具激活事件传递给父组件
  emit('toolbar-tool-activated', {
    toolId,
    toolbarObj: toolbarObject
  });
  
  // 触发工具栏状态变化事件
  emit('toolbar-state-change', { toolId, active: true, toolType: 'toggle' });
};

// 处理工具栏工具停用
const handleToolDeactivated = (payload) => {
  if (!toolbarObject) return;
  
  const toolId = payload.toolId;
  logger.debug(`工具 ${toolId} 已被停用`);
  
  // 如果当前激活的工具是被停用的工具，则清除activeToolId
  if (activeToolId.value === toolId) {
    activeToolId.value = undefined;
  }
  
  // 处理特定工具的停用
  if (toolId === 'coordinate') {
    showCoordinatePanel.value = false;
  } else if (toolId === 'overview') {
    // 停用鹰眼工具时，隐藏鹰眼地图
    showOverviewMap.value = false;
    logger.debug('[Overview] 鹰眼工具已停用，隐藏鹰眼地图');
    
    // 不需要显示辅助按钮
    showOverviewButton.value = false;
  } else if (toolId === 'layer-switch') {
    showLayerPanel.value = false;
  } else if (toolId === 'track-player') {
    // 停用轨迹播放器
    showTrackPlayer.value = false;
    logger.debug('轨迹播放器已停用，隐藏面板');
  } else if (toolId === 'flightLine') {
    // 停用飞线图，无论面板是否锁定都应关闭
    showFlightLinePanel.value = false;
    flightLinePanelLocked.value = false; // 解除锁定
    logger.debug('[FlightLine] 飞线图工具被停用，解除面板锁定并隐藏面板');
    
    // 确保飞线图对象被禁用
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj && flightLineObj.isEnabled()) {
      flightLineObj.disable();
      logger.debug('[FlightLine] 飞线图对象已禁用');
    }
  }
  
  // 将工具停用事件传递给父组件
  emit('toolbar-tool-deactivated', {
    toolId,
    toolbarObj: toolbarObject
  });
  
  // 触发工具栏状态变化事件
  emit('toolbar-state-change', { toolId, active: false, toolType: 'toggle' });
};

// 设置工具栏状态变化监听器
const setupToolbarStateChangeListener = () => {
  if (!toolbarObject) return;
  
  toolbarObject.setToolStateChangeCallback((toolId, active, toolType, data) => {
    // 更新激活的工具ID
    updateActiveToolId(toolId, active);
    
    // 处理工具状态变化
    handleToolStateByType(toolId, active, toolType, data);
    
    // 网格状态变化的特殊处理
    if (toolId === 'grid-active' && data?.gridType) {
      if (active) {
        // 网格已启用
        emit('grid-enabled', { gridType: data.gridType });
      } else {
        // 网格已禁用
        emit('grid-disabled', { gridType: data.gridType });
      }
    }
    
    // 触发工具栏状态变化事件
    emit('toolbar-state-change', { toolId, active, toolType, data });
  });
};

// 设置坐标面板状态监听
const setupCoordinatePanelWatcher = () => {
  if (!toolbarObject) return;
  
  watch(() => toolbarObject.isCoordinatePanelVisible(), (visible) => {
    logger.debug(`坐标面板状态变化: ${visible ? '显示' : '隐藏'}`);
    showCoordinatePanel.value = visible;
    
    // 手动强制视图更新
    nextTick(() => {
      if (visible && !showCoordinatePanel.value) {
        logger.warn('强制更新坐标面板状态为显示');
        showCoordinatePanel.value = true;
      }
    });
  }, { immediate: true }); // 添加immediate确保立即执行
};

// 监听配置变化
watch(() => props, (newConfig) => {
  if (configObject) {
    configObject.updateConfig(newConfig);
  }
}, { deep: true });

// 检测地图容器尺寸变化
const resizeMap = () => {
  if (mapObj && mapObj.getMapInstance()) {
    // 使用地图实例的updateSize方法更新尺寸
    mapObj.triggerMapResize();
    logger.debug('窗口大小变化，已更新地图尺寸');
  } else if (!mapInitialized.value) {
    // 如果地图尚未初始化，尝试重新初始化
    logger.info('地图尚未初始化，尝试初始化');
    initMap();
  }
};

// 切换图层
const switchMapLayer = (mapType: MapType, mapTile: MapTile) => {
  if (mapObj) {
    mapObj.switchBaseLayer(mapType, mapTile);
  }
};

// 设置地图初始化完成的监听
const setupMapInitializedWatcher = () => {
  watch(() => mapInitialized.value, (initialized) => {
    if (!initialized || !toolbarObject) return;
    
    logger.debug('[Overview] 地图已初始化，设置鹰眼控件检查器');
    setTimeout(checkOverviewMapState, 1000);
    
    // 也检查轨迹播放器状态
    setTimeout(checkTrackPlayerState, 1000);
    
    // 检查飞线图状态并记录详细信息
    logger.info('[FlightLine] 开始检查飞线图状态，当前工具状态：', {
      mapInitialized: mapInitialized.value,
      mapReady: mapReady.value,
      showFlightLinePanel: showFlightLinePanel.value,
      activeToolId: toolbarObject.getActiveToolId(),
      hasFlightLineObject: !!toolbarObject.getFlightLineObject(),
      hasPanelRef: !!flightLinePanelRef.value
    });
    // 仅在初始化时检查一次飞线图状态，不再设置定时检查
    setTimeout(checkFlightLineState, 1000);
    
    // 移除定时检查逻辑，避免面板在激活后被意外关闭
    
    // 检查热力图状态
    setTimeout(checkHeatmapState, 1000);
  });
};

// 检查鹰眼状态
const checkOverviewMapState = () => {
  if (!toolbarObject) return;
  
  // 查找激活的鹰眼工具
  const tools = toolbarObject.getTools();
  const overviewTool = tools.find(t => t.id === 'overview');
  
  // 获取鹰眼工具的激活状态
  const isOverviewActive = overviewTool?.active || false;
  
  logger.debug('[Overview] 检查鹰眼状态，工具存在:', !!overviewTool, 
               '工具激活状态:', isOverviewActive, 
               '当前显示状态:', showOverviewMap.value);
  
  // 确保UI状态与工具状态一致
  if (isOverviewActive && !showOverviewMap.value) {
    logger.debug('[Overview] 发现鹰眼工具已激活但地图未显示，显示鹰眼地图');
    showOverviewMap.value = true;
    
    // 移除触发主地图刷新的代码
    // nextTick(() => {
    //   if (mapObj) {
    //     mapObj.triggerMapResize();
    //   }
    // });
  } else if (!isOverviewActive && showOverviewMap.value) {
    logger.debug('[Overview] 鹰眼工具未激活但地图显示中，隐藏鹰眼地图');
    showOverviewMap.value = false;
  }
  
  // 不再需要辅助按钮
  showOverviewButton.value = false;
};

// 检查轨迹播放器状态
const checkTrackPlayerState = () => {
  logger.debug(`[Track] 检查轨迹播放器状态: mapReady=${mapReady.value}, mapObj=${!!mapObj}, trackObj=${!!trackObj}`);
  
  // 检查轨迹播放器工具是否激活
  const isTrackPlayerActive = toolbarObject && 
    toolbarObject.getActiveToolId() === 'track-player';
  
  logger.debug(`[Track] 轨迹播放器工具激活状态: ${isTrackPlayerActive}`);
  
  if (mapReady.value && mapObj) {
    if (!trackObj) {
      // 如果轨迹对象未初始化但需要显示
      if (isTrackPlayerActive) {
        logger.debug('[Track] 地图已就绪，但轨迹对象未初始化，开始初始化轨迹对象');
        initTrackObject();
      }
    } else {
      // 轨迹对象已存在，根据工具激活状态决定显示与否
      logger.debug('[Track] 地图和轨迹对象都已初始化');
      showTrackPlayer.value = isTrackPlayerActive;
      
      if (showTrackPlayer.value) {
        logger.debug('[Track] 轨迹播放器已显示');
      } else {
        logger.debug('[Track] 轨迹播放器已隐藏（工具未激活）');
      }
    }
  } else {
    logger.debug('[Track] 地图未就绪或缺少必要对象，无法初始化轨迹播放器');
  }
};

// 初始化轨迹对象
const initTrackObject = () => {
  if (!mapObj) {
    logger.warn('[Track] 无法初始化轨迹对象: 地图对象不存在');
    return;
  }
  
  try {
    // 创建轨迹对象
    trackObj = toolbarObject?.getTrackObject();
    
    // 检查轨迹播放器工具是否激活
    const isTrackPlayerActive = toolbarObject && 
      toolbarObject.getActiveToolId() === 'track-player';
    
    // 只有在工具激活状态下才显示播放器
    showTrackPlayer.value = isTrackPlayerActive;
    
    logger.info(`[Track] 轨迹对象初始化成功，显示状态: ${showTrackPlayer.value}`);
  } catch (error) {
    logger.error('[Track] 轨迹对象初始化失败:', error);
  }
};

// 处理轨迹选择事件
const handleTrackSelected = (trackId) => {
  console.log('轨迹已选择:', trackId);
};

// 处理轨迹删除事件
const handleTrackDeleted = (trackId) => {
  console.log('轨迹已删除:', trackId);
};

// 处理轨迹播放器折叠状态变化
const handleTrackPlayerCollapseChange = (collapsed) => {
  console.log('轨迹播放器折叠状态:', collapsed ? '已折叠' : '已展开');
};

// 刷新轨迹列表
const refreshTrackList = () => {
  // 获取轨迹播放器组件引用
  if (trackPlayerRef.value) {
    trackPlayerRef.value.refreshTrackList();
    console.log('已刷新轨迹列表');
  } else {
    console.warn('未找到轨迹播放器组件引用，无法刷新列表');
  }
};

// 监听地图组件销毁事件
onBeforeUnmount(() => {
  logger.info('地图组件即将销毁，清理资源');
  
  // 移除窗口resize事件监听
  window.removeEventListener('resize', resizeMap);
  
  // 清理图形对象
  if (shapeObject) {
    shapeObject.destroy();
  }
  
  if (toolbarObject) {
    toolbarObject.destroy();
  }
  
  if (mapObj) {
    mapObj.destroy();
  }
});

// 关闭图层面板处理函数
const handleLayerPanelClose = () => {
  showLayerPanel.value = false;
  // 停用图层切换工具
  if (toolbarObject && activeToolId.value === 'layer-switch') {
    logger.debug('图层面板关闭，停用图层切换工具');
    
    // 直接停用工具，不使用nextTick延迟
    toolbarObject.deactivateTool('layer-switch');
    activeToolId.value = undefined;
  }
};

// 处理图层切换
const handleLayerChange = (payload: { mapType: MapType, mapTile: MapTile }) => {
  if (!mapObj) return;
  
  logger.debug(`图层已切换: 类型=${payload.mapType}, 瓦片=${payload.mapTile}`);
  
  // 切换地图图层
  switchMapLayer(payload.mapType, payload.mapTile);
  
  // 触发layer-change事件
  emit('layer-change', payload);
};

/**
 * 更新工具栏配置
 * @param newConfig 工具栏新配置
 * @returns 是否更新成功
 */
const updateToolbarConfig = (newConfig: Partial<ToolbarConfig>) => {
    mapToolbarRef.value.updateConfig(newConfig);
    logger.debug('工具栏配置已更新', newConfig);
    return true;
};

// 确定图层面板位置
const determineLayerPanelPosition = (): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' => {
  // 如果有工具栏配置，根据工具栏位置和方向确定图层面板位置
  if (toolbarObject) {
    const toolbarConfig = toolbarObject.getConfig();
    const toolbarPosition = toolbarConfig.position || DEFAULT_TOOLBAR_CONFIG.position;
    const toolbarDirection = toolbarConfig.direction || DEFAULT_TOOLBAR_CONFIG.direction;
    
    // 根据工具栏方向和位置确定面板位置
    if (toolbarDirection === 'horizontal') {
      // 水平工具栏时，面板在工具栏下方
      if (toolbarPosition.startsWith('top-')) {
        // 如果工具栏在顶部，面板放在其下方相同水平位置
        return toolbarPosition as 'top-left' | 'top-right';
      } else {
        // 如果工具栏在底部，面板放在其上方相同水平位置
        return toolbarPosition === 'bottom-left' ? 'bottom-left' : 'bottom-right';
      }
    } else {
      // 垂直工具栏时，面板在工具栏旁边
      if (toolbarPosition.endsWith('-left')) {
        // 如果工具栏在左侧，面板放在其右侧
        return toolbarPosition === 'top-left' ? 'top-left' : 'bottom-left';
      } else {
        // 如果工具栏在右侧，面板放在其左侧
        return toolbarPosition === 'top-right' ? 'top-right' : 'bottom-right';
      }
    }
  }
  
  return 'top-left'; // 默认位置为左上角
};

// 检查是否需要显示鹰眼按钮
const checkAndUpdateOverviewButton = () => {
  if (!toolbarObject) return;
  
  // 获取鹰眼对象
  const overviewObj = toolbarObject.getOverviewMapObject();
  // 检查鹰眼工具是否已启用
  const isOverviewEnabled = toolbarObject.getActiveToolId() === 'overview';
  
  // 如果鹰眼已启用并且控件不为空，则显示鹰眼按钮
  showOverviewButton.value = isOverviewEnabled && !!overviewObj;
  
  logger.debug('[Overview] 鹰眼按钮显示状态:', showOverviewButton.value);
};

// 确定鹰眼地图位置
const determineOverviewMapPosition = (): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' => {
  // 使用与图层面板相同的逻辑，但位置相反，以避免重叠
  if (toolbarObject) {
    const toolbarConfig = toolbarObject.getConfig();
    const toolbarPosition = toolbarConfig.position || DEFAULT_TOOLBAR_CONFIG.position;
    
    // 与图层面板相反的位置
    switch (toolbarPosition) {
      case 'top-left': return 'bottom-right';
      case 'top-right': return 'bottom-left';
      case 'bottom-left': return 'top-right';
      case 'bottom-right': return 'top-left';
      default: return 'bottom-right';
    }
  }
  
  return 'bottom-right'; // 默认位置为右下角
};

/**
 * 鹰眼地图配置说明
 * 可通过 overviewMapConfig 属性配置鹰眼地图的各种参数：
 * 
 * 尺寸与位置：
 * - width: 鹰眼地图宽度，默认200px
 * - height: 鹰眼地图高度，默认150px
 * - collapsedSize: 折叠后的尺寸，默认30px
 * 
 * 样式：
 * - opacity: 整体透明度，范围0-1
 * - borderColor: 边框颜色
 * - borderWidth: 边框宽度
 * - backgroundColor: 背景颜色
 * 
 * 视图框样式：
 * - boxColor: 视图矩形框填充颜色
 * - boxOpacity: 视图矩形框透明度
 * - boxBorderColor: 视图矩形框边框颜色
 * - boxBorderWidth: 视图矩形框边框宽度
 * 
 * 其他：
 * - zoomOffset: 缩放级别偏移量，默认4
 * - buttonSize: 折叠按钮尺寸
 * - buttonColor: 折叠按钮文字颜色
 * - buttonBgColor: 折叠按钮背景色
 */

// 处理鹰眼地图折叠状态变化
const handleOverviewMapCollapseChange = (collapsed: boolean) => {
  logger.debug(`[Overview] 鹰眼地图折叠状态变化: ${collapsed ? '已折叠' : '已展开'}`);
  
  // 可以在这里添加额外的逻辑，例如更新其他UI元素
};

// 监听地图类型和图层变化
watch([() => props.mapType, () => props.mapTile], ([newMapType, newMapTile]) => {
  if (!mapObj) return;

  logger.debug('地图类型或图层变化:', newMapType, newMapTile);
  
  // 切换底图
  mapObj.switchBaseLayer(newMapType, newMapTile);
  
  // 触发地图大小更新
  mapObj.triggerMapResize();
});

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  if (!mapObj) return;
  
  logger.debug('中心点变化:', newCenter);
  mapObj.setCenter(newCenter[0], newCenter[1]);
});

// 监听缩放级别变化
watch(() => props.zoom, (newZoom) => {
  if (!mapObj) return;
  
  logger.debug('缩放级别变化:', newZoom);
  mapObj.setZoom(newZoom);
});

// 监听比例尺显示状态变化
watch(() => props.showScaleLine, (newValue) => {
  if (!mapObj) return;
  
  logger.debug('比例尺显示状态变化:', newValue);
  mapObj.toggleScaleLine(newValue);
});

// 监听网格配置变化
watch(() => props.gridConfig, (newConfig) => {
  if (!gridManager || !newConfig) return;
  
  logger.debug('网格配置变化，应用新配置:', newConfig);
  gridManager.setConfig(newConfig);
}, { deep: true });

// 新增轨迹（演示）
const addDemoTrack = () => {
  if (!trackObj) {
    console.error('轨迹对象未初始化');
    return;
  }
  
  // 生成随机ID
  const trackId = 'track-' + Date.now();
  
  // 生成模拟轨迹点
  const points = [];
  const startTime = Math.floor(Date.now() / 1000) - 3600; // 一小时前
  const pointCount = 100;
  
  // 生成随机起始位置（北京附近）
  const startLng = 116.4 + (Math.random() - 0.5) * 0.2;
  const startLat = 39.9 + (Math.random() - 0.5) * 0.2;
  
  // 基础速度和方向
  let baseSpeed = 30 + Math.random() * 30; // 30-60 km/h的基础速度
  let direction = Math.random() * 360; // 初始随机方向
  
  for (let i = 0; i < pointCount; i++) {
    // 轻微改变方向（模拟弯曲的路径）
    direction = (direction + (Math.random() - 0.5) * 10) % 360;
    if (direction < 0) direction += 360;
    
    // 速度变化模式（模拟加速减速）
    // 在轨迹的1/3和2/3处有明显速度变化
    let speedFactor = 1;
    if (i < pointCount / 3) {
      // 开始部分速度逐渐增加
      speedFactor = 0.8 + (i / (pointCount / 3)) * 0.4;
    } else if (i < pointCount * 2 / 3) {
      // 中间部分速度较快
      speedFactor = 1.2;
    } else {
      // 结束部分速度逐渐降低
      speedFactor = 1.2 - ((i - pointCount * 2 / 3) / (pointCount / 3)) * 0.5;
    }
    
    // 每隔10个点添加速度波动
    if (i % 10 === 0) {
      speedFactor *= (0.8 + Math.random() * 0.4); // 增加0.8-1.2的随机系数
    }
    
    // 计算当前速度
    const currentSpeed = baseSpeed * speedFactor;
    
    // 根据方向计算位置变化
    // 这里是简化计算，实际上应该使用更精确的地理计算
    const distanceFactor = 0.00001 * currentSpeed / 10; // 根据速度调整距离
    const lng = startLng + (Math.random() - 0.5) * 0.001 * i + Math.sin(direction * Math.PI / 180) * distanceFactor * i;
    const lat = startLat + (Math.random() - 0.5) * 0.001 * i + Math.cos(direction * Math.PI / 180) * distanceFactor * i;
    
    // 是否为关键点（每15个点设置一个标题点）
    const isKeyPoint = i % 15 === 0 || i === pointCount - 1;
    
    points.push({
      lng: lng,
      lat: lat,
      time: startTime + i * 36, // 每个点间隔36秒
      dir: direction,
      speed: currentSpeed,
      title: isKeyPoint ? `点位 ${i + 1}` : undefined
    });
  }
  
  // 创建轨迹
  const track = {
    id: trackId,
    name: '测试轨迹 ' + new Date().toLocaleTimeString(),
    points,
    color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.8)`
  };
  
  // 添加轨迹
  trackObj.addTrack(track);

  // 刷新轨迹列表
  refreshTrackList();
  
  // 自定义事件通知轨迹添加
  const trackPlayerElement = document.querySelector('.track-player');
  if (trackPlayerElement) {
    trackPlayerElement.dispatchEvent(new CustomEvent('track-added'));
  }
  
  console.log('已添加演示轨迹:', trackId);
};


/**
 * 飞线图相关
 */
// 飞线图面板
const showFlightLinePanel = ref(false);
const flightLinePanelRef = ref<InstanceType<typeof FlightLinePanel> | null>(null);

// 在声明区域添加面板锁定状态变量
const flightLinePanelLocked = ref(false);


/**
 * 处理飞线图面板关闭
 */
const handleFlightLinePanelClose = () => {
  // 如果面板锁定，不关闭面板
  if (flightLinePanelLocked.value) {
    logger.debug('[FlightLine] 飞线面板已锁定，忽略关闭请求');
    return;
  }
  
  // 不再自动停用飞线工具，只隐藏面板
  showFlightLinePanel.value = false;
  
  // 同步停用工具栏中的飞线图工具
  if (toolbarObject && toolbarObject.getActiveToolId() === 'flightLine') {
    toolbarObject.deactivateTool('flightLine');
    logger.debug('[FlightLine] 面板关闭，同步停用飞线图工具');
  }
  
  logger.debug('[FlightLine] 飞线面板关闭');
};

/**
 * 处理飞线图选择变更
 */
const handleFlightLineSelectionChange = (selectedIds: string[] | string | null) => {
  try {
    // 确保 selectedIds 是数组，处理 null 或单个字符串的情况
    const ids = Array.isArray(selectedIds) ? selectedIds : 
                (selectedIds ? [selectedIds] : []);
    
    // 触发外部事件
  emit('flight-line-selection-change', {
      selectedIds: ids,
      count: ids.length
    });
  } catch (error) {
    logger.error('[FlightLine] 处理选择变更时发生错误:', error);
    // 确保总是提供有效的数据
    emit('flight-line-selection-change', {
      selectedIds: [],
      count: 0
    });
  }
};

/**
 * 显示飞线图面板
 */
const showFlightLineList = () => {
  // 先激活飞线工具
  if (toolbarObject) {
    toolbarObject.activateTool('flightLine');
    logger.debug('[FlightLine] 手动激活飞线工具');
  }
  
  // 锁定面板
  flightLinePanelLocked.value = true;
  
  // 强制显示面板
  showFlightLinePanel.value = true;
  logger.debug('[FlightLine] 手动显示飞线面板并锁定');
  
  // 确保飞线图已启用
  const flightLineObj = toolbarObject?.getFlightLineObject();
  if (flightLineObj) {
    flightLineObj.enable().then(() => {
      logger.debug('[FlightLine] 飞线图已成功启用');
  
  // 如果面板已经显示，刷新列表
  nextTick(() => {
        // 确保延迟执行，增加稳定性
        setTimeout(() => {
    if (flightLinePanelRef.value) {
      flightLinePanelRef.value.refreshFlightLineList();
      logger.debug('[FlightLine] 刷新飞线列表数据');
    } else {
      logger.warn('[FlightLine] 飞线面板引用不可用，无法刷新列表');
    }
        }, 300);
      });
    }).catch(err => {
      logger.error('[FlightLine] 启用飞线图失败:', err);
    });
  } else {
    logger.warn('[FlightLine] 无法获取飞线图对象');
  }
  
  return true;
};

/**
 * 隐藏飞线图面板
 */
const hideFlightLineList = () => {
  showFlightLinePanel.value = false;
  flightLinePanelLocked.value = false;
  // 停用飞线工具
  if (toolbarObject && activeToolId.value === 'flightLine') {
    toolbarObject.deactivateTool('flightLine');
    logger.debug('[FlightLine] 手动隐藏飞线面板，同时停用飞线工具');
  }
  return true;
};


// 检查飞线图状态
const checkFlightLineState = () => {
  logger.debug(`[FlightLine] 检查飞线图状态: mapReady=${mapReady.value}, mapObj=${!!mapObj}, flightLineObj=${!!toolbarObject?.getFlightLineObject()}`);
  
  // 检查飞线图工具是否激活
  const isFlightLineActive = toolbarObject && 
    toolbarObject.getActiveToolId() === 'flightLine';
  
  // 获取飞线对象
  const flightLineObj = toolbarObject?.getFlightLineObject();
  
  logger.debug(`[FlightLine] 飞线图工具激活状态: ${isFlightLineActive}, 飞线对象存在: ${!!flightLineObj}, 面板显示状态: ${showFlightLinePanel.value}, 面板引用: ${!!flightLinePanelRef.value}`);
  
  if (mapReady.value && mapObj) {
    // 仅在飞线图工具已激活但面板未显示时，开启面板
    if (isFlightLineActive && !showFlightLinePanel.value) {
      logger.info('[FlightLine] 发现飞线图工具已激活但面板未显示，显示飞线列表面板');
      showFlightLinePanel.value = true;
      // 设置面板锁定状态，防止意外关闭
      flightLinePanelLocked.value = true;
      
      // 刷新飞线列表数据
      nextTick(() => {
        // 延迟执行，确保面板已完全挂载
        setTimeout(() => {
          if (flightLinePanelRef.value) {
            flightLinePanelRef.value.refreshFlightLineList();
            logger.debug('[FlightLine] 强制刷新飞线列表数据');
          }
        }, 300);
      });
    }
    // 移除关闭面板的逻辑，由工具激活/停用事件直接处理
  }
};

// 组件挂载时初始化地图
onMounted(() => {
  // 设置日志级别
  configureLogger();
  
  // 初始化地图
  logger.info('ScLayer组件已挂载');
  nextTick(initMap);
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', resizeMap);
  
  // 设置地图初始化完成监听
  setupMapInitializedWatcher();
  
  // 设置地图就绪状态
  mapReady.value = true;
  
  // 延迟检查飞线状态
  setTimeout(() => {
    if (mapReady.value && toolbarObject) {
      checkFlightLineState();
    }
  }, 2000);
  
  // 地图初始化完成后，预创建Cesium对象但不启用
  if (mapObj && mapObj.getMapInstance) {
    olCesium = new OLCesium({ map: mapObj.getMapInstance(), cesiumBaseUrl: props.cesiumBaseUrl });
    olCesium.setEnabled(false);
  }
});

// 配置日志级别
const configureLogger = () => {
  const logLevel = process.env.NODE_ENV === 'production'
    ? LogLevel.WARN  // 生产环境只显示警告和错误
    : LogLevel.INFO; // 开发环境显示所有日志
  
  logger.setLevel(logLevel);
};

/**
 * 热力图相关
 */
const isHeatmapActive = ref(false);

/**
 * 处理热力图激活状态变化
 */
const handleHeatmapActiveChange = (active: boolean) => {
  isHeatmapActive.value = active;
  logger.debug('[Heatmap] 热力图激活状态变化:', active);
};

/**
 * 处理热力图配置更新
 */
const handleHeatmapConfigUpdate = (config: Partial<HeatmapConfig>) => {
  logger.debug('[Heatmap] 热力图配置更新:', config);
};

/**
 * 检查热力图状态
 */
const checkHeatmapState = () => {
  if (!toolbarObject) return;
  
  // 查找热力图工具是否激活
  const tools = toolbarObject.getTools();
  const heatmapTool = tools.find(t => t.id === 'heatmap');
  
  // 获取热力图工具的激活状态
  const isHeatmapToolActive = heatmapTool?.active || false;
  
  // 确保UI状态与工具状态一致
  if (isHeatmapToolActive ) {
    logger.debug('[Heatmap] 发现热力图工具已激活但面板未显示，显示热力图面板');
    isHeatmapActive.value = true;
    
    // 确保热力图对象已启用
    const heatmapObj = toolbarObject.getHeatmapObject();
    if (heatmapObj) {
      heatmapObj.enable();
    }
  } else if (!isHeatmapToolActive) {
    logger.debug('[Heatmap] 热力图工具未激活但面板显示中，隐藏热力图面板');
    isHeatmapActive.value = false;
  }
};

/**
 * 显示热力图面板
 */
const showHeatmap = () => {
  // 先激活热力图工具
  if (toolbarObject) {
    toolbarObject.activateTool('heatmap');
    logger.debug('[Heatmap] 手动激活热力图工具');
  }
  
  // 强制显示面板
  isHeatmapActive.value = true;
  logger.debug('[Heatmap] 热力图面板已显示');
  
  // 确保热力图已启用
  const heatmapObj = toolbarObject?.getHeatmapObject();
  if (heatmapObj) {
    heatmapObj.enable();
  }
  
  return true;
};

/**
 * 隐藏热力图面板
 */
const hideHeatmap = () => {
  // 停用热力图工具
  if (toolbarObject && toolbarObject.getActiveToolId() === 'heatmap') {
    toolbarObject.deactivateTool('heatmap');
    logger.debug('[Heatmap] 手动隐藏热力图面板，同时停用热力图工具');
  }
  
  return true;
};
/**
 * 自适应显示轨迹
 * @param id 轨迹ID
 * @param options 配置选项
 * @returns 是否成功
 */
const fitTrackToView = (id: string, options?: {
  gotoStart?: boolean;
  padding?: number[];
  duration?: number;
  maxZoom?: number;
}): boolean => {
  if (!trackObj) {
    logger.warn('自适应显示轨迹失败: 轨迹对象未初始化');
    return false;
  }

  return trackObj.fitTrackToView(id, options);
};
// 暴露方法给父组件
defineExpose({
  // 基本方法
  getMapObject: () => mapObj,
  getToolbarObject: () => toolbarObject,
  getMarkerObject: () => markerObject,
  getShapeObject: () => shapeObject,
  getGridObject: () => toolbarObject?.getGridObject(),
  getHeatmapObject: () => toolbarObject?.getHeatmapObject(),
  getFlightLineObject: () => toolbarObject?.getFlightLineObject(),
  reinitMap: initMap,
  changeMapLayer: switchMapLayer,
  
  // 添加交互设置方法
  setInteractions: (interactions: { dragging?: boolean; scrollWheelZoom?: boolean }) => {
    if (!mapObj) return false;
    mapObj.setInteractions(interactions);
    return true;
  },

  // 聚合相关方法
  setAggregationOptions: (options: Partial<AggregationOptions>) => {
    if (!toolbarObject) return false;
    toolbarObject.setClusterConfig(options);
    return true;
  },
  getAggregationOptions: () => {
    if (!toolbarObject) return null;
    return toolbarObject.getClusterConfig();
  },
  
  // 网格相关方法
  enableGeohashGrid: () => {
    const gridObj = toolbarObject?.getGridObject();
    if (gridObj) {
      gridObj.enable(GridType.GEOHASH);
      return true;
    }
    return false;
  },
  disableGeohashGrid: () => {
    const gridObj = toolbarObject?.getGridObject();
    if (gridObj) {
      gridObj.disable(GridType.GEOHASH);
      return true;
    }
    return false;
  },

  // 热力图相关方法
  enableHeatmap: () => {
    if (toolbarObject) {
      toolbarObject.activateTool('heatmap');
      return true;
    }
    return false;
  },
  disableHeatmap: () => {
    if (toolbarObject) {
      toolbarObject.deactivateTool('heatmap');
      return true;
    }
    return false;
  },
  addHeatmapPoint: (point: HeatmapPoint) => {
    const heatmapObj = toolbarObject?.getHeatmapObject();
    if (heatmapObj) {
      return heatmapObj.addPoint(point);
    }
    return null;
  },
  addHeatmapPoints: (points: HeatmapPoint[]) => {
    const heatmapObj = toolbarObject?.getHeatmapObject();
    if (heatmapObj) {
      return heatmapObj.addPoints(points);
    }
    return [];
  },
  updateHeatmapPoint: (id: string, point: Partial<HeatmapPoint>) => {
    const heatmapObj = toolbarObject?.getHeatmapObject();
    if (heatmapObj) {
      return heatmapObj.updatePoint(id, point);
    }
    return false;
  },
  removeHeatmapPoint: (id: string) => {
    const heatmapObj = toolbarObject?.getHeatmapObject();
    if (heatmapObj) {
      return heatmapObj.removePoint(id);
    }
    return false;
  },
  clearHeatmap: () => {
    const heatmapObj = toolbarObject?.getHeatmapObject();
    if (heatmapObj) {
      heatmapObj.clear();
      return true;
    }
    return false;
  },
  configureHeatmap: (config: Partial<HeatmapConfig>) => {
    const heatmapObj = toolbarObject?.getHeatmapObject();
    if (heatmapObj) {
      heatmapObj.setConfig(config);
      return true;
    }
    return false;
  },

  // 标记点相关方法
  addMarker: (options: MarkerOptions) => {
    if (!markerObject) return null;
    
    // 处理分组图标：如果没有指定icon但指定了group，尝试从groupIcon获取图标
    if (!options.icon && options.group && props.markerConfig?.groupIcon) {
      const groupIcon = props.markerConfig.groupIcon[options.group];
      if (groupIcon) {
        options.icon = groupIcon;
        logger.debug(`[Marker] 从分组 "${options.group}" 获取图标: ${groupIcon}`);
      }
    }
    
    const id = markerObject.addMarker(options);
    if (id) {
      emit('marker-create' as MapEventType, { id, options });
    }
    return id;
  },
  updateMarker: (id: string, options: Partial<MarkerOptions>) => {
    const success = markerObject?.updateMarker(id, options);
    if (success) {
      emit('marker-update' as MapEventType, { id, options });
    }
    return success;
  },
  getMarker: (id: string) => markerObject?.getMarker(id),
  getAllMarkers: () => markerObject?.getAllMarkers(),
  showMarker: (id: string) => markerObject?.showMarker(id),
  hideMarker: (id: string) => markerObject?.hideMarker(id),
  removeMarker: (id: string) => {
    const success = markerObject?.removeMarker(id);
    if (success) {
      emit('marker-delete' as MapEventType, { id });
    }
    return success;
  },
  clearMarkers: () => {
    const ids = markerObject?.getAllMarkers() || [];
    const result = markerObject?.clearMarkers();
    ids.forEach(id => {
      emit('marker-delete' as MapEventType, { id });
    });
    return result;
  },
  showAllMarkers: () => markerObject?.showAllMarkers(),
  hideAllMarkers: () => markerObject?.hideAllMarkers(),
  showAllLabels: () => markerObject?.showAllLabels(),
  hideAllLabels: () => markerObject?.hideAllLabels(),
  setClusterMode: (enabled: boolean) => markerObject?.setClusterMode(enabled),
  
  // 分组相关方法
  getGroups: () => {
    if (!markerObject) return [];
    return markerObject.getGroups();
  },
  showMarkerGroup: (group: string) => {
    if (!markerObject) return 0;
    return markerObject.showMarkerGroup(group);
  },
  hideMarkerGroup: (group: string) => {
    if (!markerObject) return 0;
    return markerObject.hideMarkerGroup(group);
  },
  isGroupVisible: (group: string) => {
    if (!markerObject) return false;
    return markerObject.isGroupVisible(group);
  },
  setMarkerGroup: (id: string, group: string | null) => {
    if (!markerObject) return false;
    return markerObject.setMarkerGroup(id, group);
  },

  // 标记点缩放参数控制
  setScaleParams: (params: {
    baseZoom?: number;
    zoomFactor?: number;
    minScale?: number;
    maxScale?: number;
    scaleWithZoom?: boolean;
  }) => {
    if (!markerObject) return false;
    markerObject.setScaleParams(params);
    return true;
  },
  getScaleParams: () => {
    if (!markerObject) return {
      baseZoom: 10,
      zoomFactor: 0.03,
      minScale: 0.8,
      maxScale: 1.2,
      scaleWithZoom: true
    };
    return markerObject.getScaleParams();
  },
  
  // 图形绘制相关方法
  removeShape: (id: string) => {
    const success = shapeObject?.removeShape(id);
    if (success) {
      emit('shape-delete' as MapEventType, { id });
    }
    return success;
  },
  getAllShapes: () => shapeObject?.getAllShapes(),
  getAllShapeDatas: () => shapeObject?.getAllShapeDatas(),
  getShapeCount: () => shapeObject?.getShapeCount(),
  updateShape: (id: string, options: Partial<ShapeOption>) => {
    const success = shapeObject?.updateShape(id, options);
    if (success) {
      emit('shape-update' as MapEventType, { id, options });
    }
    return success;
  },
  clearAllShapes: () => {
    const ids = shapeObject?.getAllShapes() || [];
    const result = shapeObject?.clearAllShapes();
    ids.forEach(id => {
      emit('shape-delete' as MapEventType, { id });
    });
    return result;
  },
  addShape: (options: ShapeOption) => {
    const id = shapeObject?.addShape(options);
    if (id) {
      emit('shape-create' as MapEventType, { id, options });
    }
    return id;
  },
  addPoint: (center: number[], options?: Partial<ShapeOption>) => {
    const fullOptions: ShapeOption = {
      type: Shape.POINT,
      coordinates: center,
      ...options
    };
    const id = shapeObject?.addPoint(center, options);
    if (id) {
      emit('shape-create' as MapEventType, { id, options: fullOptions });
    }
    return id;
  },
  addLine: (coordinates: number[][], options?: Partial<ShapeOption>) => {
    const fullOptions: ShapeOption = {
      type: Shape.LINE,
      coordinates: coordinates,
      ...options
    };
    const id = shapeObject?.addLine(coordinates, options);
    if (id) {
      emit('shape-create' as MapEventType, { id, options: fullOptions });
    }
    return id;
  },
  addPolygon: (coordinates: number[][], options?: Partial<ShapeOption>) => {
    const fullOptions: ShapeOption = {
      type: Shape.POLYGON,
      coordinates: coordinates,
      ...options
    };
    const id = shapeObject?.addPolygon(coordinates, options);
    if (id) {
      emit('shape-create' as MapEventType, { id, options: fullOptions });
    }
    return id;
  },
  addCircle: (center: number[], radius: number, options?: Partial<ShapeOption>) => {
    const fullOptions: ShapeOption = {
      type: Shape.CIRCLE,
      center: center,
      radius: radius,
      ...options
    };
    const id = shapeObject?.addCircle(center, radius, options);
    if (id) {
      emit('shape-create' as MapEventType, { id, options: fullOptions });
    }
    return id;
  },
  addRectangle: (minCoord: number[], maxCoord: number[], options?: Partial<ShapeOption>) => {
    const fullOptions: ShapeOption = {
      type: Shape.RECTANGLE,
      coordinates: [minCoord, maxCoord],
      ...options
    };
    const id = shapeObject?.addRectangle(minCoord, maxCoord, options);
    if (id) {
      emit('shape-create' as MapEventType, { id, options: fullOptions });
    }
    return id;
  },
  addSquare: (center: number[], width: number, options?: Partial<ShapeOption>) => {
    const fullOptions: ShapeOption = {
      type: Shape.SQUARE,
      center: center,
      width: width,
      ...options
    };
    const id = shapeObject?.addSquare(center, width, options);
    if (id) {
      emit('shape-create' as MapEventType, { id, options: fullOptions });
    }
    return id;
  },
  
  // 图层面板相关方法
  openLayerPanel: () => {
    // 显示图层面板并确定位置
    showLayerPanel.value = true;
    layerPanelPosition.value = determineLayerPanelPosition();

    // 如果工具栏对象存在，激活图层切换工具
    if (toolbarObject) {
      toolbarObject.activateTool('layer-switch');
      activeToolId.value = 'layer-switch';
    }

    logger.debug('手动打开图层面板');
  },
  
  // 轨迹相关方法
  addTrack: (track: Track) => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法添加轨迹');
      return false;
    }

    // 确保轨迹有名称
    if (!track.name) {
      track.name = `轨迹 ${new Date().toLocaleString()}`;
    }

    const result = trackObj.addTrack(track);

    // 手动强制刷新轨迹播放器
    if (result) {
      logger.debug(`轨迹 "${track.id}" 添加成功`);

      // 激活轨迹播放器工具
      if (toolbarObject) {
        // 确保工具栏上的轨迹播放器按钮被激活
        logger.debug(`[Track] 激活轨迹播放器工具`);
        toolbarObject.activateTool('track-player');
        // UI状态将由工具激活事件处理
      } else {
        // 如果没有工具栏，直接显示轨迹播放器UI
        showTrackPlayer.value = true;
        logger.debug(`[Track] 无工具栏对象，直接显示轨迹播放器UI`);
      }

      // 刷新轨迹列表
      nextTick(() => {
        if (trackPlayerRef.value) {
          // 直接调用组件刷新方法
          logger.debug(`通过组件引用刷新轨迹列表`);
          trackPlayerRef.value.refreshTrackList();
        }
      });
    }

    return result;
  },
  playTrack: (trackId: string, customConfig?: Partial<TrackPlayer>) => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法播放轨迹');
      return false;
    }

    // 激活轨迹播放器工具
    if (toolbarObject) {
      toolbarObject.activateTool('track-player');
    }

    // 显示轨迹播放器
    showTrackPlayer.value = true;

    try {
      // 合并配置：默认配置 + props配置 + 自定义配置
      const mergedConfig: Partial<TrackPlayer> = {
        // 从全局配置中提取基础播放属性
        loop: props.trackPlayerConfig?.loop,
        speed: props.trackPlayerConfig?.speed,
        withCamera: props.trackPlayerConfig?.withCamera,
        speedFactor: props.trackPlayerConfig?.speedFactor,
        // 覆盖自定义配置
        ...customConfig
      };

      logger.debug('播放轨迹，使用配置', { trackId, config: mergedConfig });

      // 应用轨迹显示设置
      if (trackObj) {
        // 设置节点显示（静态点位）
        if (props.trackPlayerConfig?.showNodes !== undefined) {
          trackObj.setTrackNodesVisible(trackId, props.trackPlayerConfig.showNodes);
        }

        // 设置节点锚点显示（当节点显示开启时生效）
        if (props.trackPlayerConfig?.showNodeAnchors !== undefined) {
          trackObj.setTrackNodeAnchorsVisible(trackId, props.trackPlayerConfig.showNodeAnchors);
        }

        // 设置名称显示（点位名称）
        if (props.trackPlayerConfig?.showPointNames !== undefined) {
          trackObj.setMovingPointNameVisible(trackId, props.trackPlayerConfig.showPointNames);
        }
        
        // 设置节点时间显示
        if (props.trackPlayerConfig?.showNodeTime !== undefined) {
          trackObj.setTrackNodeTimeVisible(trackId, props.trackPlayerConfig.showNodeTime);
        }

        // 设置速度显示（移动速度）
        if (props.trackPlayerConfig?.showSpeed !== undefined) {
          trackObj.setTrackSpeedPopoversVisible(trackId, props.trackPlayerConfig.showSpeed);
        }

        // 设置节点速度显示（节点速度）
        if (props.trackPlayerConfig?.showNodeSpeed !== undefined) {
          trackObj.setTrackNodeSpeedsVisible(trackId, props.trackPlayerConfig.showNodeSpeed);
        }
      }

      // 播放轨迹
      return trackObj.play(trackId, mergedConfig);
    } catch (error) {
      logger.error('播放轨迹时出错', error);
      return false;
    }
  },
  stopTrack: (trackId: string) => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法停止轨迹');
      return false;
    }
    return trackObj.stop(trackId);
  },
  pauseTrack: (trackId: string) => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法暂停轨迹');
      return false;
    }
    return trackObj.pause(trackId);
  },
  resumeTrack: (trackId: string) => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法恢复轨迹播放');
      return false;
    }
    return trackObj.play(trackId);
  },
  clearAllTracks: () => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法清除轨迹');
      return false;
    }
    return trackObj.clearAllTracks();
  },
  hideAllTracks: () => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法隐藏轨迹');
      return false;
    }
    return trackObj.hideAllTracks();
  },
  showAllTracks: () => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法显示轨迹');
      return false;
    }
    return trackObj.showAllTracks();
  },
  showTrack: (trackId: string) => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法显示轨迹');
      return false;
    }
    return trackObj.showTrack(trackId);
  },
  hideTrack: (trackId: string) => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法隐藏轨迹');
      return false;
    }
    return trackObj.hideTrack(trackId);
  },
  getTrackObject: () => trackObj,
  getTrackPlayState: (trackId: string) => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法获取轨迹播放状态');
      return null;
    }
    return trackObj.getTrackPlayState(trackId);
  },
  getAllTracks: () => {
    if (!trackObj) {
      logger.warn('轨迹对象未初始化，无法获取轨迹列表');
      return new Map();
    }
    return trackObj.getAllTracks();
  },
  
  // 激活/停用工具的方法
  activateTool: (toolId: string) => {
    if (!toolbarObject) {
      logger.warn(`工具栏未初始化，无法激活工具: ${toolId}`);
      return false;
    }
    return toolbarObject.activateTool(toolId);
  },
  deactivateTool: (toolId: string) => {
    if (!toolbarObject) {
      logger.warn(`工具栏未初始化，无法停用工具: ${toolId}`);
      return false;
    }
    return toolbarObject.deactivateTool(toolId);
  },
  
  // 更新工具栏配置
  updateToolbarConfig,
  
  // 获取工具栏管理器
  getToolbarManager: () => toolbarObject,
  
  // 暴露日志实例，允许外部控制日志行为
  logger,
  addDemoTrack,
  refreshTrackList,
  
  // 飞线图相关方法
  enableFlightLine: () => {
    if (toolbarObject) {
      toolbarObject.activateTool('flightLine');
      return true;
    }
    return false;
  },
  disableFlightLine: () => {
    if (toolbarObject) {
      toolbarObject.deactivateTool('flightLine');
      return true;
    }
    return false;
  },
  addFlightLine: (flightLine) => {
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj) {
      const id = flightLineObj.addFlightLine(flightLine);
      // 刷新飞线列表
      if (showFlightLinePanel.value && flightLinePanelRef.value) {
        nextTick(() => {
          flightLinePanelRef.value.refreshFlightLineList();
        });
      }
      return id;
    }
    return null;
  },
  addFlightLines: (flightLines) => {
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj) {
      const ids = flightLineObj.addFlightLines(flightLines);
      // 刷新飞线列表
      if (showFlightLinePanel.value && flightLinePanelRef.value) {
        nextTick(() => {
          flightLinePanelRef.value.refreshFlightLineList();
        });
      }
      return ids;
    }
    return [];
  },
  updateFlightLine: (id, options) => {
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj) {
      return flightLineObj.updateFlightLine(id, options);
    }
    return false;
  },
  clearFlightLines: () => {
    const flightLineObj = toolbarObject?.getFlightLineObject();
    if (flightLineObj) {
      flightLineObj.getAllFlightLines().clear();
      // 刷新飞线列表
      if (showFlightLinePanel.value && flightLinePanelRef.value) {
        nextTick(() => {
          flightLinePanelRef.value.refreshFlightLineList();
        });
        }
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
  
  // 显示飞线列表面板方法
  showFlightLineList,
  hideFlightLineList,

  // 热力图控制方法
  showHeatmap,
  hideHeatmap,
  
  // 自适应显示轨迹
  fitTrackToView
});

// 监听拖动和滚轮缩放属性的变化
watch(() => props.dragging, (newVal) => {
  if (mapObj) {
    mapObj.setInteractions({ dragging: newVal });
    logger.debug(`[ScLayer] 拖动状态已更新: ${newVal}`);
  }
});

watch(() => props.scrollWheelZoom, (newVal) => {
  if (mapObj) {
    mapObj.setInteractions({ scrollWheelZoom: newVal });
    logger.debug(`[ScLayer] 滚轮缩放状态已更新: ${newVal}`);
  }
});

// 监听标记点配置变化
watch(() => props.markerConfig, (newConfig) => {
  if (markerObject && newConfig) {
    markerObject.setConfig(newConfig);
    logger.debug('[Marker] 标记点配置已更新:', newConfig);
  }
}, { deep: true });

// 添加对aggregationOptions变化的监听
watch(() => props.aggregationOptions, (newOptions) => {
  if (toolbarObject && newOptions) {
    logger.debug('聚合配置已更新:', newOptions);
    toolbarObject.setClusterConfig(newOptions);
  }
}, { deep: true });

const is3D = ref(false);
let olCesium: any = null;

function toggle3D() {
  if (!olCesium && mapObj && mapObj.getMapInstance) {
    // 创建CesiumMap
    olCesium = new OLCesium({ map: mapObj.getMapInstance() });
  }
  if (olCesium) {
    is3D.value = !is3D.value;
    olCesium.setEnabled(is3D.value);
  }
}

// 监听is3D变化，动态同步dimension-switch按钮高亮
watch(is3D, (val) => {
  if (toolbarObject) {
    toolbarObject.setToolActive('dimension-switch', val);
    mapToolbarRef.value?.refreshToolbarState?.();
  }
});

</script>

<style scoped>
.sc-layer {
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
  background-color: #f5f5f5; /* 添加背景色以便于调试 */
  flex: 1;
  position: relative;
  z-index: 1; /* 确保地图层级低于工具栏 */
}

.toolbar-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 容器本身不接收鼠标事件，但子元素可以 */
  z-index: 1000; /* 高于地图层 */
}

/* 确保工具栏位于地图上方 */
:deep(.map-toolbar) {
  z-index: 2000 !important; /* 工具栏必须高于地图 */
  pointer-events: auto !important; /* 确保工具栏可以接收鼠标事件 */
}

/* 确保工具栏内的按钮可点击 */
:deep(.toolbar-item) {
  pointer-events: auto !important;
  cursor: pointer !important;
  z-index: 2100 !important;
}

/* 确保提示框显示在最顶层 */
:deep(.toolbar-tooltip) {
  z-index: 9999 !important;
  pointer-events: none !important;
}
</style>

<style lang="scss">
@use "./styles/index.scss";
@use "./styles/measure.scss";
</style>