/**
 * 地图组件
 * @author CH
 * @date 2025-04-29
 */
<template>
  <div class="sc-layer" :style="{ height: config.height + 'px' }">
    <div ref="mapContainer" class="map-container" :style="{ height: '100%' }"></div>
    <MapToolbar
      v-if="config.showToolbar"
      :toolbar-config="toolbarConfig"
      :active-tool-id="activeToolId"
      @tool-click="handleToolClick"
      @tool-activated="handleToolActivated"
      @tool-deactivated="handleToolDeactivated"
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
import { ToolbarConfig, DEFAULT_TOOLBAR_CONFIG } from './types/toolbar';
import logger, { LogLevel } from './composables/LogObject';
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
  toolbarConfig: () => ({ ...DEFAULT_TOOLBAR_CONFIG })
});

// 定义组件事件
const emit = defineEmits<{
  (e: MapEventType, payload: any): void;
  (e: 'update:center', center: [number, number]): void;
  (e: 'update:zoom', zoom: number): void;
}>();

// 组件状态
const mapContainer = ref<HTMLElement>();
const configObject = ref<ConfigObject | null>(null);
const mapObj = ref<MapObject | null>(null);
const toolbarObj = ref<ToolbarObject | null>(null);
const activeToolId = ref<string | undefined>(undefined);
const mapInitialized = ref<boolean>(false);

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
  if (!toolbarObj.value) return { items: [] };
  return toolbarObj.value.getConfig();
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
  if (mapContainer.value.clientWidth === 0 || mapContainer.value.clientHeight === 0) {
    logger.warn('地图容器尺寸为0，等待容器完成渲染...', {
      width: mapContainer.value.clientWidth,
      height: mapContainer.value.clientHeight
    });
    // 等待一段时间再尝试初始化
    setTimeout(initMap, 100);
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
      configObject.value = new ConfigObject(props);
      
      // 创建地图对象
      mapObj.value = new MapObject(configObject.value as ConfigObject);
      
      // 初始化地图
      mapObj.value.init(mapContainer.value as HTMLElement, emit);
      
      logger.info('地图初始化成功');
      mapInitialized.value = true;
      
      // 创建工具栏对象
      toolbarObj.value = new ToolbarObject(props.toolbarConfig, mapObj.value as MapObject);
      
      // 触发初始化完成事件
      emit('map-initialized', {
        map: mapObj.value,
        toolbar: toolbarObj.value
      });
    } catch (error) {
      logger.error('地图初始化过程中出错:', error);
    }
  });
};

// 处理工具栏工具点击
const handleToolClick = (event: { toolId: string; tool: any; event: MouseEvent }) => {
  if (!toolbarObj.value) return;
  
  toolbarObj.value.handleToolClick(event.toolId);
  emit('toolbar-tool-click', event);
};

// 处理工具栏工具激活
const handleToolActivated = (toolId: string) => {
  activeToolId.value = toolId;
  emit('toolbar-tool-activated', toolId);
};

// 处理工具栏工具停用
const handleToolDeactivated = (toolId: string) => {
  if (activeToolId.value === toolId) {
    activeToolId.value = undefined;
  }
  emit('toolbar-tool-deactivated', toolId);
};

// 监听配置变化
watch(() => props, (newConfig) => {
  if (configObject.value) {
    configObject.value.updateConfig(newConfig);
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
    if (mapObj.value && mapObj.value.getMapInstance()) {
      // 使用地图实例的updateSize方法更新尺寸
      mapObj.value.triggerMapResize();
      logger.debug('窗口大小变化，已更新地图尺寸');
    }
  }, 200);
};

// 切换图层方法
const switchMapLayer = (mapType: MapType, mapTile: MapTile) => {
  if (mapObj.value) {
    mapObj.value.switchBaseLayer(mapType, mapTile);
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
    // 短暂延迟，确保容器尺寸已正确计算
    setTimeout(initMap, 100);
  });
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', resizeMap);
});

// 组件销毁前清理资源
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeMap);
  
  if (toolbarObj.value) {
    toolbarObj.value.destroy();
  }
  if (mapObj.value) {
    mapObj.value.destroy();
  }
});

// 暴露方法给父组件
defineExpose({
  mapObj,
  toolbarObj,
  switchMapLayer,
  reinitMap: initMap,
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
}
</style>
<style>
@import "./styles/migration.scss";

/* OpenLayers必要样式 */
.ol-viewport {
  width: 100% !important;
  height: 100% !important;
}

.ol-layers {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
}
</style>