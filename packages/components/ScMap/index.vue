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
    <!-- 添加标记点信息面板 -->
    <MarkerPanel 
      v-if="showMarkerPanel"
      :visible="showMarkerPanel"
      :position="markerPanelPosition"
      :title="activeMarker?.title"
      :content="activeMarker?.content"
      :click-content-template="activeMarker?.clickContentTemplate"
      :coords="activeMarker?.position"
      @close="closeMarkerPanel"
    />
    
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
//@ts-ignore
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import '../ScMap/styles/measure.scss'; // 导入测距样式
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';

// 组件导入
import CoordinatePanel from './components/CoordinatePanel.vue';
import FlightLinePanel from './components/FlightLinePanel.vue';
import LayerPanel from './components/LayerPanel.vue';
import MapToolbar from './components/MapToolbar.vue';
import MarkerPanel from './components/MarkerPanel.vue';
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
import { MeasureObject } from './composables/MeasureObject';
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
let measureObject: MeasureObject | null = null;
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
const showMarkerPanel = ref<boolean>(false);
const layerPanelPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
const mapToolbarRef = ref<ComponentPublicInstance<{ setToolbarObj: (obj: ToolbarObject) => void }>>();
const trackPlayerRef = ref(null);
const flightLinePanelRef = ref(null);
const mapReady = ref(false);

// 标记点面板状态
const activeMarker = ref<any>(null);
const markerPanelPosition = ref({ x: 0, y: 0 });

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
      handleToolStateByType(toolId, active, toolType, data);
    });
    nextTick(() => {
      if (mapToolbarRef.value && toolbarObject) {
        mapToolbarRef.value.setToolbarObj(toolbarObject as ToolbarObject);
      }
    });
    // 获取其他对象引用
    markerObject = toolbarObject.getMarkerObject();
    shapeObject = toolbarObject.getShapeObject();
    trackObj = toolbarObject.getTrackObject(); // 获取轨迹对象（实际是LeafletTrackplayerObject实例）
    gridManager = toolbarObject.getGridObject();
    
    // 设置marker点击监听器，处理MarkerPanel显示逻辑
    if (markerObject) {
      markerObject.setClickListener((event: any) => {
        // 如果是自定义事件，包含marker数据
        if (event.markerData) {
          const { markerData, pixelPosition } = event;
          
          // 如果需要显示面板，显示MarkerPanel
          if (markerData.clickContentTemplate || markerData.content || markerData.title) {
            activeMarker.value = markerData;
            markerPanelPosition.value = pixelPosition;
            showMarkerPanel.value = true;
          }
          
          // 触发marker-click事件
          emit('marker-click', { 
            coordinates: markerData.position,
            data: markerData
          });
        } else {
          // 兼容旧版事件处理
          const marker = event.target;
          const latlng = marker.getLatLng();
          emit('marker-click', { 
            coordinates: [latlng.lat, latlng.lng],
            data: marker.options
          });
        }
      });
    }
    
    // 创建测量对象
    measureObject = new MeasureObject(mapObj.getMapInstance());
    
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

    // 保留原来的'flight-line'处理器以保持兼容性
    'flight-line': () => {
      logger.debug(`[FlightLine] 收到旧版flight-line事件，转发到flightLine处理器`);
      handlers['flightLine']();
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

// 确定图层面板位置
const determineLayerPanelPosition = (): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' => {
  // 如果有工具栏配置，根据工具栏位置和方向确定图层面板位置
  if (toolbarObject) {
    const toolbarConfig = toolbarObject.getConfig();
    const toolbarPosition = toolbarConfig.position || DEFAULT_TOOLBAR_CONFIG.position as string;
    const toolbarDirection = toolbarConfig.direction || DEFAULT_TOOLBAR_CONFIG.direction as string;

    // 根据工具栏方向和位置确定面板位置
    if (toolbarDirection === 'horizontal') {
      // 水平工具栏时，面板在工具栏下方
      if (toolbarPosition.startsWith('top-')) {
        // 如果工具栏在顶部，面板放在其下方相同水平位置
        return toolbarPosition as 'top-left' | 'top-right';
        } else {
        // 如果工具栏在底部，面板放在其上方相同水平位置
        return toolbarPosition === 'bottom-left' ? 'top-left' : 'top-right';
      }
      } else {
      // 垂直工具栏时，面板在工具栏旁边
      // 如果工具栏在左侧，面板放在其右侧
      // 如果工具栏在右侧，面板放在其左侧
      return toolbarPosition === 'top-right' ? 'top-right' : 'bottom-right';
    }
  }

  // 如果没有工具栏配置，使用默认位置
  return 'top-left'; // 默认位置为左上角
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

  // 处理测距工具的激活
  if (toolId === 'measure') {
    measureObject?.enable();
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
  } else if (toolId === 'label-toggle' && markerObject) {
    // 处理标签工具停用，确保显示所有标签
    markerObject.showAllLabels();
    logger.debug('[Marker] 标签工具停用，显示所有标签');
  }

  // 处理测距工具的停用
  if (toolId === 'measure') {
    measureObject?.disable();
    measureObject?.clear();
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
  
  // 初始化Leaflet插件
  setupLeafletPlugins();
  
  // 修复Leaflet图标路径问题
  fixLeafletIcon();
  
  // 初始化地图
  nextTick(() => {
    initMap();
    
    // 如果配置了自动激活鹰眼地图，则激活它
    if (props.overviewMapConfig?.autoActivate && toolbarObject) {
      toolbarObject.activateTool('overview');
    }
    
    // 监听map-click事件，用于关闭MarkerPanel
    if (mapObj) {
      mapObj.getMapInstance()?.on('click', () => {
        if (showMarkerPanel.value && !activeToolId.value) {
          closeMarkerPanel();
        }
      });
    }
  });
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
  
  // 销毁测量对象
  measureObject?.destroy();
  measureObject = null;
  
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

// 标记点面板方法
const closeMarkerPanel = () => {
  showMarkerPanel.value = false;
  activeMarker.value = null;
};

// 显示标记点面板
const showMarkerPanelForMarker = (marker: any, position: { x: number, y: number }) => {
  activeMarker.value = marker;
  markerPanelPosition.value = position;
  showMarkerPanel.value = true;
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
  addMarker: (options: MarkerOptions) => {
    if (!markerObject) {
      logger.error('添加标记点失败: markerObject未初始化');
      return '';
    }
    
    // 验证和记录位置信息
    if (!options.position || options.position.length < 2) {
      logger.error('添加标记点失败: 无效的位置信息', options.position);
      return '';
    }
    
    logger.debug('ScMap.addMarker: 添加标记点', options.position);
    try {
      const id = markerObject.addMarker(options);
      if (!id) {
        logger.error('添加标记点失败: 返回ID为空');
      }
      return id;
    } catch (error) {
      logger.error('添加标记点时发生错误:', error);
      return '';
    }
  },
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