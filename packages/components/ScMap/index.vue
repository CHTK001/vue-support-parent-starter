<template>
  <div class="sc-map-container" :style="{ height: height, width: width }">
    <div v-if="loading" class="sc-map-loading">
      <div class="is-loading">
        <i class="el-icon-loading"></i>
      </div>
      <span>地图加载中...</span>
    </div>
    <component
      v-if="!loading && currentMapComponent"
      :is="currentMapComponent"
      ref="mapRef"
      v-bind="mapProps"
      @map-loaded="onMapLoaded"
      @marker-click="onMarkerClick"
      @map-click="onMapClick"
      @zoom-changed="onZoomChanged"
      @center-changed="onCenterChanged"
      @bounds-changed="onBoundsChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { useScriptLoader } from './hooks/useScriptLoader';
import { MapType, MapViewType, MapOptions, Marker, OfflineMapConfig } from './types';
import AMap from './layout/AMap.vue';
import BMap from './layout/BMap.vue';
import TMap from './layout/TMap.vue';

// 声明window类型
declare global {
  interface Window {
    initBMap: () => void;
  }
}

// 全局地图加载状态
const isGlobalScriptLoaded = {
  amap: false,
  bmap: false,
  gmap: false,
  tmap: false,
  offline: false
};

const props = defineProps({
  // 地图类型：高德(amap)、百度(bmap)、谷歌(gmap)、天地图(tmap)、离线(offline)
  type: {
    type: String as () => MapType,
    default: 'amap'
  },
  // 地图API密钥
  apiKey: {
    type: String,
    default: ''
  },
  // 中心点
  center: {
    type: Array as unknown as () => [number, number],
    default: () => [116.397428, 39.90923] // 默认北京中心
  },
  // 缩放级别
  zoom: {
    type: Number,
    default: 11
  },
  // 标记点
  markers: {
    type: Array as () => Marker[],
    default: () => []
  },
  // 地图高度
  height: {
    type: String,
    default: '500px'
  },
  // 地图宽度
  width: {
    type: String,
    default: '100%'
  },
  // 是否显示缩放控件
  zoomControl: {
    type: Boolean,
    default: true
  },
  // 是否显示比例尺控件
  scaleControl: {
    type: Boolean,
    default: true
  },
  // 是否允许拖动
  draggable: {
    type: Boolean,
    default: true
  },
  // 是否允许滚轮缩放
  scrollWheel: {
    type: Boolean,
    default: true
  },
  // 地图样式
  mapStyle: {
    type: String,
    default: ''
  },
  // 地图视图类型
  viewType: {
    type: String as () => MapViewType,
    default: 'normal'
  },
  // 离线地图配置
  offlineConfig: {
    type: Object as () => OfflineMapConfig,
    default: () => ({
      tileUrlTemplate: '/tiles/{z}/{x}/{y}.png',
      minZoom: 3,
      maxZoom: 18,
      attribution: '© 离线地图'
    })
  }
});

const emit = defineEmits([
  'map-loaded', 
  'marker-click', 
  'map-click', 
  'zoom-changed',
  'center-changed',
  'bounds-changed'
]);

const mapRef = ref<any>(null);
const loading = ref(true);

// 脚本加载钩子
const { loadScript, scriptLoaded, scriptError } = useScriptLoader();

// 获取地图对应的脚本URL
const getMapScriptUrl = computed(() => {
  switch (props.type) {
    case 'amap':
      return `https://webapi.amap.com/maps?v=2.0&key=${props.apiKey}`;
    case 'bmap':
      return `https://api.map.baidu.com/api?v=3.0&ak=${props.apiKey}&callback=initBMap`;
    case 'gmap':
      return `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}`;
    case 'tmap':
      return `https://api.tianditu.gov.cn/api?v=4.0&tk=${props.apiKey}`;
    case 'offline':
      // 离线地图使用Leaflet
      return `https://unpkg.com/leaflet@1.7.1/dist/leaflet.js`;
    default:
      return `https://webapi.amap.com/maps?v=2.0&key=${props.apiKey}`;
  }
});

// 当前地图组件
const currentMapComponent = shallowRef<any>(null);

// 地图组件属性
const mapProps = computed(() => {
  return {
    apiKey: props.apiKey,
    center: props.center,
    zoom: props.zoom,
    markers: props.markers,
    height: props.height,
    width: props.width,
    zoomControl: props.zoomControl,
    scaleControl: props.scaleControl,
    draggable: props.draggable,
    scrollWheel: props.scrollWheel,
    mapStyle: props.mapStyle,
    viewType: props.viewType,
    offlineConfig: props.offlineConfig
  };
});

// 加载地图脚本
const loadMapScript = async () => {
  loading.value = true;
  
  // 检查是否已加载
  if (isGlobalScriptLoaded[props.type]) {
    initMap();
    return;
  }
  
  try {
    // 离线地图需要加载Leaflet样式
    if (props.type === 'offline' && !isGlobalScriptLoaded.offline) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      document.head.appendChild(link);
    }
    
    // 加载地图脚本
    await loadScript(getMapScriptUrl.value);
    isGlobalScriptLoaded[props.type] = true;
    
    // 百度地图需要特殊处理
    if (props.type === 'bmap') {
      window.initBMap = () => {
        isGlobalScriptLoaded.bmap = true;
        initMap();
      };
    } else {
      initMap();
    }
  } catch (error) {
    console.error('地图脚本加载失败:', error);
    loading.value = false;
  }
};

// 初始化地图
const initMap = () => {
  // 根据地图类型选择组件
  switch (props.type) {
    case 'amap':
      currentMapComponent.value = AMap;
      break;
    case 'bmap':
      currentMapComponent.value = BMap;
      break;
    case 'tmap':
      currentMapComponent.value = TMap;
      break;
    case 'gmap':
      // 谷歌地图暂不支持
      console.warn('暂不支持谷歌地图');
      break;
    case 'offline':
      // 离线地图暂不支持
      console.warn('暂不支持离线地图');
      break;
    default:
      currentMapComponent.value = AMap;
  }
  
  loading.value = false;
};

// 事件处理
const onMapLoaded = (map: any) => {
  emit('map-loaded', map);
};

const onMarkerClick = (marker: Marker) => {
  emit('marker-click', marker);
};

const onMapClick = (event: any) => {
  emit('map-click', event);
};

const onZoomChanged = (zoom: number) => {
  emit('zoom-changed', zoom);
};

const onCenterChanged = (center: [number, number]) => {
  emit('center-changed', center);
};

const onBoundsChanged = (bounds: any) => {
  emit('bounds-changed', bounds);
};

// 对外暴露的方法
const setCenter = (center: [number, number]) => {
  if (mapRef.value) {
    mapRef.value.setCenter(center);
  }
};

const setZoom = (zoom: number) => {
  if (mapRef.value) {
    mapRef.value.setZoom(zoom);
  }
};

const addMarkers = (markers: Marker[]) => {
  if (mapRef.value) {
    mapRef.value.addMarkers(markers);
  }
};

const clearMarkers = () => {
  if (mapRef.value) {
    mapRef.value.clearMarkers();
  }
};

// 暴露方法
defineExpose({
  mapInstance: computed(() => mapRef.value?.mapInstance),
  setCenter,
  setZoom,
  addMarkers,
  clearMarkers
});

// 监听地图类型变化
watch(() => props.type, () => {
  loadMapScript();
});

// 组件挂载时加载地图
onMounted(() => {
  loadMapScript();
});

// 组件卸载时清理
onUnmounted(() => {
  if (mapRef.value?.mapInstance) {
    mapRef.value = null;
    currentMapComponent.value = null;
  }
});
</script>

<style scoped>
.sc-map-container {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.sc-map-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.sc-map-loading .is-loading {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--el-color-primary);
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 