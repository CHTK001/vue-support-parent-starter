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
        v-if="config.showToolbar"
        :toolbar-config="toolbarConfig"
        :active-tool-id="activeToolId"
        @tool-click="handleToolClick"
        @tool-activated="handleToolActivated"
        @tool-deactivated="handleToolDeactivated"
      />
    </div>
    <!-- 添加坐标面板 -->
    <CoordinatePanel
      v-if="config.showToolbar"
      :active="showCoordinatePanel"
      :coordinate-info="coordinateInfo"
      :show-projected="coordinateOptions.showProjected"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'ScLayer'
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue';
import type { MapConfig, MapEventType } from './types';
import { MapTile } from './types';
import { MapType, DEFAULT_MAP_CONFIG } from './types/map';
import { ConfigObject } from './composables/ConfigObject';
import { MapEmitter, MapObject } from './composables/MapObject';
import { ToolbarObject } from './composables/ToolbarObject';
import MapToolbar from './components/MapToolbar.vue';
import CoordinatePanel from './components/CoordinatePanel.vue';
import { ToolbarConfig, DEFAULT_TOOLBAR_CONFIG } from './types/toolbar';
import logger, { LogLevel } from './composables/LogObject';
import { CoordinateObject, CoordinateInfo, CoordinateOptions, CoordinatePosition } from './composables/CoordinateObject';
// 引入OpenLayers样式
import 'ol/ol.css';

// 定义组件属性
const props = withDefaults(defineProps<MapConfig>(), {
  height: 500,
  center: () => [39.90923, 116.397428], 
  mapType: MapType.GAODE,
  mapTile: MapTile.NORMAL,
  map: () => DEFAULT_MAP_CONFIG,
  mapKey: () => ({}),
  zoom: 10, // 增大默认缩放级别，让地图更清晰
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
}>();

// 组件状态
const mapContainer = ref<HTMLElement>();
// 使用普通变量而非响应式引用
let configObject: ConfigObject | null = null;
let mapObj: MapObject | null = null;
let toolbarObject: ToolbarObject | null = null;
let coordinateObj: CoordinateObject | null = null; // 添加坐标对象
const activeToolId = ref<string | undefined>(undefined);
const mapInitialized = ref<boolean>(false);
const showCoordinatePanel = ref<boolean>(false); // 控制坐标面板显示状态

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
    logger.error('地图容器不存在，无法初始化地图');
    return;
  }
  
  if (mapInitialized.value) {
    logger.info('地图已经初始化，无需重复初始化');
    return;
  }

  // 检查容器尺寸
  const containerWidth = mapContainer.value.clientWidth;
  const containerHeight = mapContainer.value.clientHeight;
  
  if (containerWidth === 0 || containerHeight === 0) {
    logger.warn('地图容器尺寸为0，等待容器完成渲染...', {
      width: containerWidth,
      height: containerHeight
    });
    // 延长等待时间，确保DOM完全渲染
    setTimeout(initMap, 300);
    return;
  }

  // 确保DOM已加载完成后再创建地图
  nextTick(async () => {
    try {
      logger.info('开始初始化地图组件，容器尺寸:', {
        width: mapContainer.value!.clientWidth,
        height: mapContainer.value!.clientHeight
      });
      
      // 创建配置对象
      configObject = new ConfigObject(props);
      
      // 创建地图对象
      mapObj = new MapObject(configObject as ConfigObject);
      
      // 初始化地图
      const success = mapObj.init(mapContainer.value as HTMLElement, emit);
      
      if (!success) {
        logger.error('地图初始化失败');
        // 稍后重试
        setTimeout(initMap, 500);
        return;
      }
      
      logger.info('地图初始化成功');
      mapInitialized.value = true;
      
      // 创建工具栏对象
      toolbarObject = new ToolbarObject(props.toolbarConfig, mapObj as MapObject);
      
      // 初始化坐标对象
      initCoordinateObject();
      
      // 触发初始化完成事件
      emit('map-initialized', {
        map: mapObj,
        toolbar: toolbarObject
      });
    } catch (error) {
      logger.error('地图初始化过程中出错:', error);
    }
  });
};

// 初始化坐标对象
const initCoordinateObject = () => {
  if (!mapObj || !mapObj.getMapInstance()) {
    logger.warn('地图实例不存在，无法初始化坐标对象');
    return;
  }
  
  // 创建坐标对象，传入配置选项
  coordinateObj = new CoordinateObject(mapObj.getMapInstance(), {
    decimals: coordinateOptions.value.decimals,
    position: coordinateOptions.value.position,
    showProjected: coordinateOptions.value.showProjected
  });
  
  // 启用坐标跟踪，并设置回调函数
  coordinateObj.enable((coordinate) => {
    // 更新坐标信息
    coordinateInfo.value = coordinate;
  });
  
  logger.info('坐标对象初始化成功');
};

// 监听坐标选项变化
watch(() => props.coordinateOptions, (newOptions) => {
  if (!coordinateObj) return;
  
  // 更新坐标对象选项
  coordinateObj.setOptions({
    decimals: newOptions?.decimals,
    position: newOptions?.position as CoordinatePosition,
    showProjected: newOptions?.showProjected
  });
  
  // 如果面板已显示，更新坐标信息
  if (showCoordinatePanel.value) {
    coordinateInfo.value = coordinateObj.getCoordinate();
  }
  
  logger.debug('坐标选项已更新:', newOptions);
}, { deep: true });

// 切换坐标面板显示状态
const toggleCoordinatePanel = (show?: boolean) => {
  if (show !== undefined) {
    showCoordinatePanel.value = show;
  } else {
    showCoordinatePanel.value = !showCoordinatePanel.value;
  }
  
  // 如果显示坐标面板，确保坐标对象已启用
  if (showCoordinatePanel.value && coordinateObj && !coordinateObj.isEnabled()) {
    coordinateObj.enable();
  }
  
  logger.debug(`坐标面板 ${showCoordinatePanel.value ? '显示' : '隐藏'}`);
};

// 设置坐标面板位置
const setCoordinatePosition = (position: CoordinatePosition) => {
  if (!coordinateObj) return;
  
  coordinateObj.setPosition(position);
  logger.debug('坐标面板位置已设置:', position);
};

// 设置坐标精度
const setCoordinateDecimals = (decimals: number) => {
  if (!coordinateObj) return;
  
  coordinateObj.setDecimals(decimals);
  logger.debug('坐标精度已设置:', decimals);
};

// 设置是否显示投影坐标
const setShowProjected = (show: boolean) => {
  if (!coordinateObj) return;
  
  coordinateObj.setShowProjected(show);
  logger.debug('投影坐标显示设置:', show);
};

// 处理工具栏工具点击
const handleToolClick = (event: { toolId: string; tool: any; event: MouseEvent }) => {
  if (!toolbarObject) return;
  
  // 处理坐标工具点击
  if (event.toolId === 'coordinate') {
    toggleCoordinatePanel();
    return;
  }
  
  // 调用ToolbarObject的方法处理点击事件
  toolbarObject.handleToolClick(event.toolId);
  
  // 向父组件传递事件
  emit('toolbar-tool-click', {
    ...event,
    toolbarObj: toolbarObject
  });
};

// 处理工具栏工具激活
const handleToolActivated = (toolId: string) => {
  activeToolId.value = toolId;
  
  if (toolbarObject) {
    // 确保ToolbarObject内部状态与UI状态同步
    toolbarObject.activateTool(toolId);
  }
  
  // 向父组件传递事件
  emit('toolbar-tool-activated', {
    toolId,
    toolbarObj: toolbarObject
  });
};

// 处理工具栏工具停用
const handleToolDeactivated = (toolId: string) => {
  if (activeToolId.value === toolId) {
    activeToolId.value = undefined;
  }
  
  if (toolbarObject) {
    // 确保ToolbarObject内部状态与UI状态同步
    toolbarObject.deactivateTool(toolId);
  }
  
  // 向父组件传递事件
  emit('toolbar-tool-deactivated', {
    toolId,
    toolbarObj: toolbarObject
  });
};

// 监听配置变化
watch(() => props, (newConfig) => {
  if (configObject) {
    configObject.updateConfig(newConfig);
  }
}, { deep: true });

// 检测地图容器尺寸变化
let resizeTimer: number | null = null;
const resizeMap = () => {
  // 防抖处理
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  
  resizeTimer = window.setTimeout(() => {
    if (mapObj && mapObj.getMapInstance()) {
      // 使用地图实例的updateSize方法更新尺寸
      mapObj.triggerMapResize();
      logger.debug('窗口大小变化，已更新地图尺寸');
    } else if (!mapInitialized.value) {
      // 如果地图尚未初始化，尝试重新初始化
      logger.info('地图尚未初始化，尝试初始化');
      initMap();
    }
  }, 200);
};

// 切换图层方法
const switchMapLayer = (mapType: MapType, mapTile: MapTile) => {
  if (mapObj) {
    mapObj.switchBaseLayer(mapType, mapTile);
  }
};

// 组件挂载时初始化地图
onMounted(() => {
  // 配置日志级别
  if (process.env.NODE_ENV === 'production') {
    // 生产环境只显示警告和错误
    logger.setLevel(LogLevel.WARN);
  } else {
    // 开发环境显示所有日志
    logger.setLevel(LogLevel.DEBUG);
  }

  logger.info('ScLayer组件已挂载');
  
  // 使用nextTick确保DOM完全渲染后再初始化
  nextTick(() => {
    // 添加多个延迟尝试，确保在各种渲染情况下都能初始化成功
    setTimeout(initMap, 100);
    setTimeout(initMap, 300);
    // 再添加一个较长延迟，确保在复杂布局中也能正确初始化
    setTimeout(initMap, 800);
  });
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', resizeMap);
});

// 组件销毁前清理资源
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeMap);
  
  if (coordinateObj) {
    coordinateObj.destroy();
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
  mapObj,
  toolbarObj: toolbarObject,
  coordinateObj,
  switchMapLayer,
  reinitMap: initMap,
  toggleCoordinatePanel,
  setCoordinatePosition,
  setCoordinateDecimals,
  setShowProjected,
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
  z-index: 1000 !important; /* 工具栏必须高于地图 */
  pointer-events: auto !important; /* 确保工具栏可以接收鼠标事件 */
}

/* 确保工具栏内的按钮可点击 */
:deep(.toolbar-item) {
  pointer-events: auto !important;
  cursor: pointer !important;
  z-index: 1001 !important;
}
</style>

<style>
@import "./styles/migration.scss";
</style>