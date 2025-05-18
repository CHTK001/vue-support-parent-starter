/**
 * 鸟瞰图组件
 * @description 显示主地图的缩略图
 */
<template>
  <div class="overview-map" :class="[positionClass, { collapsed }]">
    <!-- 鹰眼控件由leaflet-minimap自动渲染，收缩/展开由其自带按钮控制 -->
  </div>
</template>

<script lang="ts">
export default {
  name: 'OverviewMap'
};
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import 'leaflet-minimap';
import { MapTile, MapType } from '../types';
import "leaflet-minimap/dist/Control.MiniMap.min.css";

// 定义配置接口
export interface OverviewMapConfig {
  width?: number;
  height?: number;
  zoomOffset?: number;
  baseLayer?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  visible?: boolean;
  baseType?: MapType;
  baseTile?: MapTile; // 支持自定义key
  autoActivate?: boolean;
}

// 默认配置
const DEFAULT_CONFIG: OverviewMapConfig = {
  width: 200,
  height: 150,
  zoomOffset: -5,
  position: 'bottom-right', // 默认右下角
  visible: true,
  baseType: MapType.GAODE,
  baseTile: MapTile.NORMAL,
  autoActivate: false
};

// 组件属性
const props = withDefaults(defineProps<{
  mainMap: L.Map;
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  config?: Partial<OverviewMapConfig>;
  map?: any; // MapConfig.map
  mapKey?: Record<string, string>;
}>(), {
  visible: true,
  position: 'bottom-right',
  config: () => ({}),
  map: undefined,
  mapKey: undefined
});

// 组件状态
const collapsed = ref(false); // 仅用于初始化minimap的minimized参数
const miniMapControl = ref<any>(null);

// 保证props.config有值
const safeConfig = computed(() => props.config || {});

// 计算最终配置
const finalConfig = computed(() => {
  return {
    ...DEFAULT_CONFIG,
    ...safeConfig.value,
    position: props.position || safeConfig.value.position || DEFAULT_CONFIG.position,
    visible: props.visible !== undefined ? props.visible : safeConfig.value.visible !== undefined ? safeConfig.value.visible : DEFAULT_CONFIG.visible
  };
});

// 计算位置样式类
const positionClass = computed(() => `position-${finalConfig.value.position}`);

// 获取leaflet-minimap的控件位置
const leafletPosition = computed(() => {
  switch (finalConfig.value.position) {
    case 'top-left': return 'topleft';
    case 'top-right': return 'topright';
    case 'bottom-left': return 'bottomleft';
    case 'bottom-right': return 'bottomright';
    default: return 'bottomright';
  }
});

// 构建底图图层，优先overviewMapConfig.baseTile，其次MapConfig.map和mapKey
function createMiniMapLayer() {
  // 1. 优先overviewMapConfig.baseTile
  const baseType = finalConfig.value.baseType || MapType.OSM;
  const baseTile = finalConfig.value.baseTile || MapTile.NORMAL;
  // 2. 支持MapConfig.map和mapKey
  const mapConfig = props.map;
  const mapKey = props.mapKey || {};
  // 3. 支持自定义MapConfig.map
  if (mapConfig && typeof mapConfig === 'object') {
    // baseTile可为mapConfig的key
    let tileConfig = mapConfig[baseType];
    if (!tileConfig && mapConfig['osm']) tileConfig = mapConfig['osm'];
    let url = tileConfig[baseTile].url || '';
    // 替换key
    if (url.includes('{key}')) {
      const key = mapKey[baseType] || '';
      url = url.replace('{key}', key);
    }
    return L.tileLayer(url, tileConfig.options || {});
  }

  // 兜底
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
}

const initMiniMap = () => {
  if (!props.mainMap) return;
  // 移除旧控件
  if (miniMapControl.value) {
    props.mainMap.removeControl(miniMapControl.value);
    miniMapControl.value = null;
  }
  const layer = createMiniMapLayer();
  // @ts-ignore
  miniMapControl.value = new (L.Control as any).MiniMap(layer, {
    width: finalConfig.value.width,
    height: finalConfig.value.height,
    zoomLevelOffset: finalConfig.value.zoomOffset,
    toggleDisplay: true, // 显示收缩按钮
    minimized: collapsed.value, // 初始是否收缩
    position: 'bottomright', // 强制右下角
    aimingRectOptions: { color: '#1890ff', weight: 2, fillOpacity: 0.1 },
    shadowRectOptions: { color: '#000', weight: 1, opacity: 0.3, fillOpacity: 0.1 },
    strings: {
      hideText: '隐藏鹰眼',
      showText: '显示鹰眼'
    },
  });
  props.mainMap.addControl(miniMapControl.value);
};

// 组件挂载
onMounted(() => {
  // 初始化鸟瞰图
  if (finalConfig.value.visible && !collapsed.value) {
    initMiniMap();
  }
});

// 组件销毁
onBeforeUnmount(() => {
  // 移除事件监听
  if (miniMapControl.value && props.mainMap) {
    props.mainMap.removeControl(miniMapControl.value);
    miniMapControl.value = null;
  }
});

// 监听配置变化
watch(() => props.config, () => {
  if (miniMapControl.value && props.mainMap) {
    props.mainMap.removeControl(miniMapControl.value);
    miniMapControl.value = null;
  }
  if (finalConfig.value.visible && !collapsed.value) {
    initMiniMap();
  }
}, { deep: true });
      
// 监听主地图变化
watch(() => props.mainMap, () => {
  if (miniMapControl.value && props.mainMap) {
    props.mainMap.removeControl(miniMapControl.value);
    miniMapControl.value = null;
  }
  if (finalConfig.value.visible && !collapsed.value) {
    initMiniMap();
  }
});

// 监听可见性变化
watch(() => props.visible, (newVisible) => {
  if (newVisible && !miniMapControl.value && !collapsed.value) {
    initMiniMap();
  }
});

// 导出方法
defineExpose({
  getMiniMapControl: () => miniMapControl.value
});
</script>

<style scoped>
.overview-map {
  position: absolute;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s ease;
  }
  
.position-top-left {
  top: 10px;
  left: 10px;
    }
    
.position-top-right {
  top: 10px;
  right: 10px;
}

.position-bottom-left {
  bottom: 10px;
  left: 10px;
}

.position-bottom-right {
  bottom: 10px;
  right: 10px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #1890ff;
  color: #fff;
    cursor: pointer;
  }
  
.overview-title {
  font-size: 14px;
  font-weight: 500;
}

.overview-actions {
    display: flex;
    align-items: center;
}

.collapse-btn {
  background: none;
  border: none;
  color: #fff;
    cursor: pointer;
  padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
  transition: transform 0.3s ease;
      }

.overview-map.collapsed .collapse-btn {
  transform: rotate(180deg);
    }
    
.overview-content {
  width: v-bind('finalConfig.width + "px"');
  height: v-bind('finalConfig.height + "px"');
    }
    
.overview-container {
  width: 100%;
  height: 100%;
}
</style> 