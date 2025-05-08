/**
 * 地图组件
 * @author CH
 * @date 2025-04-29
 */
<template>
  <div class="sc-layer" :style="{ height: config.height + 'px' }">
    <div ref="mapContainer" class="map-container"></div>
    <div class="toolbar-container">
      <MapToolbar
        ref="mapToolbarRef"
        v-if="config.showToolbar"
        :toolbar-config="toolbarConfig"
        :active-tool-id="activeToolId"
        @tool-activated="handleToolActivated"
        @tool-deactivated="handleToolDeactivated"
      />
    </div>
    <!-- 添加坐标面板 -->
    <CoordinatePanel
      v-if="showCoordinatePanel"
      :active="true"
      :coordinate-info="coordinateInfo"
      :show-projected="coordinateOptions.showProjected"
    />
    <!-- 添加鹰眼控件强制显示按钮 -->
    <div v-if="showOverviewButton" class="overview-button" @click="emit('toolbar-state-change', {toolId: 'overview', active: true, toolType: 'toggle'})">
      <div class="overview-icon">
        <svg viewBox="0 0 1024 1024" width="24" height="24">
          <path d="M512 128c212.1 0 384 171.9 384 384S724.1 896 512 896 128 724.1 128 512s171.9-384 384-384m0-64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z" fill="currentColor"/>
          <path d="M764 612c-38.1 83.3-123.1 141-221.9 141-132.6 0-240-107.4-240-240s107.4-240 240-240c98.9 0 183.8 57.7 221.9 141h75.3C797.4 289.2 662.7 197 541 197c-173.7 0-314.5 140.8-314.5 314.5S367.3 826 541 826c121.7 0 256.4-92.2 298.3-217.2H764v3.2z" fill="currentColor"/>
          <path d="M512 393c-65.5 0-119 53.5-119 119s53.5 119 119 119 119-53.5 119-119-53.5-119-119-119z" fill="currentColor"/>
        </svg>
      </div>
    </div>
    <!-- 增加引入CustomOverviewMap组件 -->
    <CustomOverviewMap 
      v-if="showCustomOverview" 
      :main-map-obj="mapObj" 
      :visible="showCustomOverview"
      @close="showCustomOverview = false"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'ScLayer'
};
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CoordinatePanel from './components/CoordinatePanel.vue';
import MapToolbar from './components/MapToolbar.vue';
import CustomOverviewMap from './components/CustomOverviewMap.vue';
import { ConfigObject } from './composables/ConfigObject';
import { 
  CoordinateInfo, 
  CoordinateOptions, 
  CoordinatePosition 
} from './composables/CoordinateObject';
import logger, { LogLevel } from './composables/LogObject';
import { MapObject } from './composables/MapObject';
import { ToolbarObject } from './composables/ToolbarObject';
import type { MapConfig, MapEventType } from './types';
import { MapTile } from './types';
import { DEFAULT_MAP_CONFIG, MapType } from './types/map';
import { DEFAULT_TOOLBAR_CONFIG } from './types/toolbar';
import { MarkerObject, MarkerOptions } from './composables/MarkerObject';
import { ShapeObject, ShapeType } from './composables/ShapeObject';
// 引入OpenLayers样式
import 'ol/ol.css';

// 定义组件属性 - 使用types中的配置作为类型定义
const props = withDefaults(defineProps<MapConfig>(), {
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
  })
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
}>();

// 组件状态
const mapContainer = ref<HTMLElement>();
// 使用普通变量而非响应式引用
let configObject: ConfigObject | null = null;
let mapObj: MapObject | null = null;
let toolbarObject: ToolbarObject | null = null;
let markerObject: MarkerObject | null = null;
let shapeObject: ShapeObject | null = null;

// 响应式状态
const activeToolId = ref<string | undefined>(undefined);
const mapInitialized = ref<boolean>(false);
const showCoordinatePanel = ref<boolean>(false);
const showOverviewButton = ref<boolean>(false);
const showCustomOverview = ref<boolean>(false);
const mapToolbarRef = ref(null);

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
const initializeMapComponents = () => {
  // 创建配置对象
  configObject = new ConfigObject(props);
  
  // 创建地图对象
  mapObj = new MapObject(configObject);
  
  // 初始化地图
  mapObj.init(mapContainer.value as HTMLElement, emit);
  
  // 标记地图初始化完成
  logger.info('地图初始化成功');
  mapInitialized.value = true;
  
  // 创建工具栏对象
  toolbarObject = new ToolbarObject(props.toolbarConfig, mapObj);

  // 创建标记点对象
  markerObject = new MarkerObject(mapObj.getMapInstance());
  // 设置工具栏对象
  mapToolbarRef.value?.setToolbarObj(toolbarObject);
  // 设置标记点点击回调
  markerObject.setClickHandler((coordinates: number[], data: MarkerOptions) => {
    emit('marker-click', { coordinates, data });
    logger.debug(`[Marker] 标记点 ${data.id} 被点击，发送事件到父组件`);
  });
  
  // 创建图形绘制对象
  shapeObject = new ShapeObject(mapObj.getMapInstance());
  logger.debug('图形绘制对象已初始化');
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
    
    // 鹰眼工具状态变化
    'overview': () => {
      logger.debug(`[Overview] 鹰眼工具状态变化: ${active ? '激活' : '停用'}`);
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
    
    // 清除所有图形
    'clear-shapes': () => {
      if (active && shapeObject) {
        shapeObject.clear();
        logger.debug('[Shape] 已清除所有图形');
      }
    }
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
const handleToolActivated = (toolId: string) => {
  if (!toolbarObject) return;
  
  logger.debug(`工具 ${toolId} 已被激活`);
  
  // 将工具激活事件传递给父组件
  emit('toolbar-tool-activated', {
    toolId,
    toolbarObj: toolbarObject
  });
};

// 处理工具栏工具停用
const handleToolDeactivated = (toolId: string) => {
  if (!toolbarObject) return;
  
  logger.debug(`工具 ${toolId} 已被停用`);
  
  // 将工具停用事件传递给父组件
  emit('toolbar-tool-deactivated', {
    toolId,
    toolbarObj: toolbarObject
  });
};

// 设置工具栏状态变化监听器
const setupToolbarStateChangeListener = () => {
  if (!toolbarObject) return;
  
  toolbarObject.setToolStateChangeCallback((toolId, active, toolType, data) => {
    // 将工具状态变化通知给父组件
    emit('toolbar-state-change', {
      toolId,
      active,
      toolType,
      data
    });
    
    // 更新activeToolId状态
    updateActiveToolId(toolId, active);
    
    // 使用工具ID分发到不同处理函数
    handleToolStateByType(toolId, active, toolType, data);
    
    logger.debug(`工具状态变化通知: 工具ID=${toolId}, 激活状态=${active}, 类型=${toolType}`);
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
});

// 配置日志级别
const configureLogger = () => {
  const logLevel = process.env.NODE_ENV === 'production'
    ? LogLevel.WARN  // 生产环境只显示警告和错误
    : LogLevel.INFO; // 开发环境显示所有日志
  
  logger.setLevel(logLevel);
};

// 设置地图初始化完成的监听
const setupMapInitializedWatcher = () => {
  watch(() => mapInitialized.value, (initialized) => {
    if (!initialized || !toolbarObject) return;
    
    logger.debug('[Overview] 地图已初始化，设置鹰眼控件检查器');
    setTimeout(checkOverviewMapState, 1000);
  });
};

// 检查鹰眼状态
const checkOverviewMapState = () => {
  if (!toolbarObject) return;
  
  // 查找激活的鹰眼工具
  const tools = toolbarObject.getTools();
  const overviewTool = tools.find(t => t.id === 'overview' && t.active);
  
  // 鹰眼工具已激活但控件未启用时显示辅助按钮
  if (!overviewTool) return;
  
  const overviewObj = toolbarObject.getOverviewMapObject();
  const controlEnabled = overviewObj && overviewObj.isEnabled();
  
  if (!controlEnabled) {
    logger.warn('[Overview] 检测到鹰眼工具已激活但控件未显示，显示辅助按钮');
    showOverviewButton.value = true;
  }
};

// 组件销毁前清理资源
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeMap);
  
  if (markerObject) {
    markerObject.destroy();
  }
  
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

// 暴露方法给父组件
defineExpose({
  getMapObject: () => mapObj,
  getToolbarObject: () => toolbarObject,
  getMarkerObject: () => markerObject,
  getShapeObject: () => shapeObject,
  reinitMap: initMap,
  changeMapLayer: switchMapLayer,
  // 标记点相关方法
  addMarker: (options: MarkerOptions) => markerObject?.addMarker(options),
  updateMarker: (id: string, options: Partial<MarkerOptions>) => markerObject?.updateMarker(id, options),
  getMarker: (id: string) => markerObject?.getMarker(id),
  getAllMarkers: () => markerObject?.getAllMarkers(),
  showMarker: (id: string) => markerObject?.showMarker(id),
  hideMarker: (id: string) => markerObject?.hideMarker(id),
  removeMarker: (id: string) => markerObject?.removeMarker(id),
  clearMarkers: () => markerObject?.clearMarkers(),
  showAllMarkers: () => markerObject?.showAllMarkers(),
  hideAllMarkers: () => markerObject?.hideAllMarkers(),
  showAllLabels: () => markerObject?.showAllLabels(),
  hideAllLabels: () => markerObject?.hideAllLabels(),
  setClusterMode: (enabled: boolean) => markerObject?.setClusterMode(enabled),
  // 图形绘制相关方法
  enableShape: (type: ShapeType) => shapeObject?.enable(type),
  disableShape: () => shapeObject?.disable(),
  clearShapes: () => shapeObject?.clear(),
  removeShape: (id: string) => shapeObject?.removeShape(id),
  getAllShapes: () => shapeObject?.getAllShapes(),
  getShapeCount: () => shapeObject?.getShapeCount(),
  // 暴露日志实例，允许外部控制日志行为
  logger,
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

.overview-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.overview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<style>
@import "./styles/index.scss";
@import "./styles/measure.scss";
</style>