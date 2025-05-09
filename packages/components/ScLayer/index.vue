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
    <!-- 添加图层面板 -->
    <LayerPanel
      v-if="showLayerPanel"
      :active="showLayerPanel"
      :position="layerPanelPosition"
      :map-type="configObject?.getMapType()"
      :map-tile="configObject?.getMapTile()"
      :map-config="configObject?.getMapConfig()"
      @close="handleLayerPanelClose"
      @layer-change="handleLayerChange"
    />
    
    <!-- 增加引入OverviewMap组件 -->
    <OverviewMap 
      v-if="showOverviewMap" 
      :main-map-obj="mapObj" 
      :visible="showOverviewMap"
      :position="determineOverviewMapPosition()"
      :config="overviewMapConfig"
      @collapse-change="handleOverviewMapCollapseChange"
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
import OverviewMap from './components/OverviewMap.vue';
import { OverviewMapConfig } from './components/OverviewMap.vue';
import LayerPanel from './components/LayerPanel.vue';
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
import { MarkerObject } from './composables/MarkerObject';
import { MarkerOptions } from '.';
import { ShapeObject, ShapeType } from './composables/ShapeObject';
import { Shape, ShapeOption } from './types/shape';
// 引入OpenLayers样式
import 'ol/ol.css';

// 定义组件属性 - 使用types中的配置作为类型定义
const props = withDefaults(defineProps<MapConfig & {
  overviewMapConfig?: OverviewMapConfig
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
  showScaleLine: true // 默认显示比例尺
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
const showOverviewMap = ref<boolean>(false);
const showLayerPanel = ref<boolean>(false);
const layerPanelPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
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
  
    // 创建图形绘制对象 - 从toolbarObject获取
    shapeObject = toolbarObject.getShapeObject();
    
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
        // 确保在下一个tick渲染完成后，鹰眼地图容器已存在
        nextTick(() => {
          // 强制刷新鹰眼地图大小
          if (mapObj) {
            mapObj.triggerMapResize();
          }
        });
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
  
  // 处理特定工具的激活
  if (toolId === 'coordinate') {
    showCoordinatePanel.value = true;
  } else if (toolId === 'overview') {
    // 激活鹰眼工具
    showOverviewMap.value = true;
    // 隐藏overview按钮，因为已经激活了鹰眼工具
    showOverviewButton.value = false;
    
    // 确保在下一个tick中鹰眼地图可以正确初始化
    nextTick(() => {
      logger.debug('[Overview] 确保鹰眼地图在工具激活后显示');
      if (mapObj) {
        // 强制刷新地图尺寸以确保鹰眼组件正确显示
        mapObj.triggerMapResize();
      }
    });
  } else if (toolId === 'layer-switch') {
    showLayerPanel.value = true;
    layerPanelPosition.value = determineLayerPanelPosition();
  }
  
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
  
  // 在选择图层后关闭面板
  showLayerPanel.value = false;
  
  // 停用图层切换工具
  if (toolbarObject) {
    // 检查当前活动的工具ID
    const currentActiveToolId = toolbarObject.getActiveToolId();
    logger.debug(`当前活动工具ID: ${currentActiveToolId}, 组件内活动工具ID: ${activeToolId.value}`);
    
    // 无论是否为当前活动工具，都尝试停用图层切换工具
    logger.debug('图层已选择，停用图层切换工具');
    
    // 强制停用工具栏中的图层按钮
    toolbarObject.deactivateTool('layer-switch');
    
    // 确保组件内状态也更新
    activeToolId.value = undefined;
    
    // 刷新工具栏UI状态
    nextTick(() => {
      if (mapToolbarRef.value) {
        // 调用工具栏组件的刷新方法
        mapToolbarRef.value.refreshToolbarState();
        logger.debug('已刷新工具栏UI状态');
      }
    });
    
    logger.debug('图层切换工具已停用');
  } else {
    logger.warn('工具栏对象不存在，无法停用图层切换工具');
  }
  
  // 发出图层变更事件供父组件处理
  emit('layer-change', payload);
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

// 暴露方法给父组件
defineExpose({
  getMapObject: () => mapObj,
  getToolbarObject: () => toolbarObject,
  getMarkerObject: () => markerObject,
  getShapeObject: () => shapeObject,
  reinitMap: initMap,
  changeMapLayer: switchMapLayer,
  // 标记点相关方法
  addMarker: (options: MarkerOptions) => {
    const id = markerObject?.addMarker(options);
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
  // 图形绘制相关方法
  enableShape: (type: ShapeType) => shapeObject?.enable(type),
  disableShape: () => shapeObject?.disable(),
  clearShapes: () => {
    const ids = shapeObject?.getAllShapes() || [];
    const result = shapeObject?.clear();
    ids.forEach(id => {
      emit('shape-delete' as MapEventType, { id });
    });
    return result;
  },
  removeShape: (id: string) => {
    const success = shapeObject?.removeShape(id);
    if (success) {
      emit('shape-delete' as MapEventType, { id });
    }
    return success;
  },
  getAllShapes: () => shapeObject?.getAllShapes(),
  getShapeCount: () => shapeObject?.getShapeCount(),
  // 新增图形添加、更新和清除方法
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
</style>

<style>
@import "./styles/index.scss";
@import "./styles/measure.scss";
</style>