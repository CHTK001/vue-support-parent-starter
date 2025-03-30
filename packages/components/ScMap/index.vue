<template>
  <div class="sc-map-container" :style="{ height: height, width: width }">
    <div v-if="loading" class="sc-map-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>地图加载中...</span>
    </div>
    <div ref="mapContainer" class="sc-map-content"></div>
  </div>
</template>

<!-- 在 props 部分添加新的属性 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { useScriptLoader } from './hooks/useScriptLoader';
import { MapType, MapOptions, Marker } from './types';

const props = defineProps({
  // 地图类型：高德(amap)、百度(bmap)、谷歌(gmap)
  type: {
    type: String as () => MapType,
    default: 'amap'
  },
  // 地图API密钥
  apiKey: {
    type: String,
    default: ''
  },
  // 地图中心点
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

const mapContainer = ref<HTMLElement | null>(null);
const mapInstance = ref<any>(null);
const loading = ref(true);
const markersInstances = ref<any[]>([]);

// 加载地图脚本
const { loadScript, scriptLoaded, scriptError } = useScriptLoader();

// 根据地图类型获取脚本URL
const getMapScriptUrl = computed(() => {
  switch (props.type) {
    case 'amap':
      return `https://webapi.amap.com/maps?v=2.0&key=${props.apiKey}`;
    case 'bmap':
      return `https://api.map.baidu.com/api?v=3.0&ak=${props.apiKey}&callback=initBMap`;
    case 'gmap':
      return `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&callback=initGMap`;
    case 'tmap':
      return `https://api.tianditu.gov.cn/api?v=4.0&tk=${props.apiKey}`;
    case 'offline':
      // 离线地图不需要加载外部脚本，使用本地的Leaflet库
      return `https://unpkg.com/leaflet@1.7.1/dist/leaflet.js`;
    default:
      return `https://webapi.amap.com/maps?v=2.0&key=${props.apiKey}`;
  }
});

// 初始化地图
const initMap = async () => {
  if (!mapContainer.value) return;
  
  loading.value = true;
  
  try {
    if (!scriptLoaded.value) {
      if (props.type === 'offline') {
        // 离线地图需要加载Leaflet样式
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(link);
      }
      
      await loadScript(getMapScriptUrl.value);
    }
    
    switch (props.type) {
      case 'amap':
        initAMap();
        break;
      case 'bmap':
        window.initBMap = initBMap;
        break;
      case 'gmap':
        window.initGMap = initGMap;
        break;
      case 'tmap':
        initTMap();
        break;
      case 'offline':
        initOfflineMap();
        break;
      default:
        initAMap();
    }
  } catch (error) {
    console.error('地图加载失败:', error);
    loading.value = false;
  }
};

// 初始化高德地图
const initAMap = () => {
  if (window.AMap) {
    // 创建地图实例
    const mapOptions = {
      center: props.center,
      zoom: props.zoom,
      resizeEnable: true,
      dragEnable: props.draggable,
      zoomEnable: props.scrollWheel,
      mapStyle: props.mapStyle || 'amap://styles/normal'
    };
    
    // 根据视图类型设置地图类型
    if (props.viewType === 'satellite') {
      mapOptions.layers = [new window.AMap.TileLayer.Satellite()];
    } else if (props.viewType === 'hybrid') {
      mapOptions.layers = [
        new window.AMap.TileLayer.Satellite(),
        new window.AMap.TileLayer.RoadNet()
      ];
    }
    
    mapInstance.value = new window.AMap.Map(mapContainer.value, mapOptions);

    // 添加控件
    if (props.zoomControl) {
      mapInstance.value.addControl(new window.AMap.ToolBar());
    }
    
    if (props.scaleControl) {
      mapInstance.value.addControl(new window.AMap.Scale());
    }

    // 添加标记点
    addMarkers();

    // 绑定事件
    bindMapEvents();

    loading.value = false;
    emit('map-loaded', mapInstance.value);
  }
};

// 初始化百度地图
const initBMap = () => {
  if (window.BMap) {
    // 创建地图实例
    mapInstance.value = new window.BMap.Map(mapContainer.value);
    
    // 设置中心点和缩放级别
    const point = new window.BMap.Point(props.center[0], props.center[1]);
    mapInstance.value.centerAndZoom(point, props.zoom);
    
    // 添加控件
    if (props.zoomControl) {
      mapInstance.value.addControl(new window.BMap.NavigationControl());
    }
    
    if (props.scaleControl) {
      mapInstance.value.addControl(new window.BMap.ScaleControl());
    }
    
    // 设置是否允许拖动和滚轮缩放
    if (props.draggable) {
      mapInstance.value.enableDragging();
    } else {
      mapInstance.value.disableDragging();
    }
    
    if (props.scrollWheel) {
      mapInstance.value.enableScrollWheelZoom();
    } else {
      mapInstance.value.disableScrollWheelZoom();
    }
    
    // 添加标记点
    addMarkers();
    
    // 绑定事件
    bindMapEvents();
    
    loading.value = false;
    emit('map-loaded', mapInstance.value);
  }
};

// 初始化谷歌地图
const initGMap = () => {
  if (window.google && window.google.maps) {
    // 创建地图实例
    mapInstance.value = new window.google.maps.Map(mapContainer.value, {
      center: { lat: props.center[1], lng: props.center[0] },
      zoom: props.zoom,
      zoomControl: props.zoomControl,
      scaleControl: props.scaleControl,
      draggable: props.draggable,
      scrollwheel: props.scrollWheel,
      styles: props.mapStyle ? JSON.parse(props.mapStyle) : []
    });
    
    // 添加标记点
    addMarkers();
    
    // 绑定事件
    bindMapEvents();
    
    loading.value = false;
    emit('map-loaded', mapInstance.value);
  }
};

// 添加标记点
const addMarkers = () => {
  if (!mapInstance.value) return;
  
  // 清除现有标记点
  clearMarkers();
  
  props.markers.forEach(marker => {
    let markerInstance;
    
    switch (props.type) {
      case 'amap':
        markerInstance = new window.AMap.Marker({
          position: marker.position,
          title: marker.title,
          icon: marker.icon,
          label: marker.label ? {
            content: marker.label,
            direction: 'top'
          } : null
        });
        
        markerInstance.on('click', () => {
          emit('marker-click', marker);
        });
        
        markerInstance.setMap(mapInstance.value);
        break;
        
      case 'bmap':
        const point = new window.BMap.Point(marker.position[0], marker.position[1]);
        markerInstance = new window.BMap.Marker(point, {
          title: marker.title,
          icon: marker.icon ? new window.BMap.Icon(marker.icon, new window.BMap.Size(25, 25)) : null
        });
        
        if (marker.label) {
          markerInstance.setLabel(new window.BMap.Label(marker.label, {
            offset: new window.BMap.Size(20, -10)
          }));
        }
        
        markerInstance.addEventListener('click', () => {
          emit('marker-click', marker);
        });
        
        mapInstance.value.addOverlay(markerInstance);
        break;
        
      case 'gmap':
        markerInstance = new window.google.maps.Marker({
          position: { lat: marker.position[1], lng: marker.position[0] },
          map: mapInstance.value,
          title: marker.title,
          icon: marker.icon
        });
        
        if (marker.label) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: marker.label
          });
          
          markerInstance.addListener('click', () => {
            infoWindow.open(mapInstance.value, markerInstance);
            emit('marker-click', marker);
          });
        } else {
          markerInstance.addListener('click', () => {
            emit('marker-click', marker);
          });
        }
        break;
    }
    
    if (markerInstance) {
      markersInstances.value.push(markerInstance);
    }
  });
};

// 清除标记点
const clearMarkers = () => {
  if (!mapInstance.value) return;
  
  switch (props.type) {
    case 'amap':
      markersInstances.value.forEach(marker => {
        marker.setMap(null);
      });
      break;
      
    case 'bmap':
      markersInstances.value.forEach(marker => {
        mapInstance.value.removeOverlay(marker);
      });
      break;
      
    case 'gmap':
      markersInstances.value.forEach(marker => {
        marker.setMap(null);
      });
      break;
  }
  
  markersInstances.value = [];
};

// 绑定地图事件
const bindMapEvents = () => {
  if (!mapInstance.value) return;
  
  switch (props.type) {
    case 'amap':
      mapInstance.value.on('click', (e: any) => {
        emit('map-click', {
          position: [e.lnglat.getLng(), e.lnglat.getLat()],
          originalEvent: e
        });
      });
      
      mapInstance.value.on('zoomchange', () => {
        emit('zoom-changed', mapInstance.value.getZoom());
      });
      
      mapInstance.value.on('moveend', () => {
        const center = mapInstance.value.getCenter();
        emit('center-changed', [center.getLng(), center.getLat()]);
      });
      
      mapInstance.value.on('mapmove', () => {
        const bounds = mapInstance.value.getBounds();
        emit('bounds-changed', bounds);
      });
      break;
      
    case 'bmap':
      mapInstance.value.addEventListener('click', (e: any) => {
        emit('map-click', {
          position: [e.point.lng, e.point.lat],
          originalEvent: e
        });
      });
      
      mapInstance.value.addEventListener('zoomend', () => {
        emit('zoom-changed', mapInstance.value.getZoom());
      });
      
      mapInstance.value.addEventListener('moveend', () => {
        const center = mapInstance.value.getCenter();
        emit('center-changed', [center.lng, center.lat]);
      });
      
      mapInstance.value.addEventListener('dragend', () => {
        const bounds = mapInstance.value.getBounds();
        emit('bounds-changed', bounds);
      });
      break;
      
    case 'gmap':
      mapInstance.value.addListener('click', (e: any) => {
        emit('map-click', {
          position: [e.latLng.lng(), e.latLng.lat()],
          originalEvent: e
        });
      });
      
      mapInstance.value.addListener('zoom_changed', () => {
        emit('zoom-changed', mapInstance.value.getZoom());
      });
      
      mapInstance.value.addListener('center_changed', () => {
        const center = mapInstance.value.getCenter();
        emit('center-changed', [center.lng(), center.lat()]);
      });
      
      mapInstance.value.addListener('bounds_changed', () => {
        const bounds = mapInstance.value.getBounds();
        emit('bounds-changed', bounds);
      });
      break;
  }
};

// 设置地图中心点
const setCenter = (center: [number, number]) => {
  if (!mapInstance.value) return;
  
  switch (props.type) {
    case 'amap':
      mapInstance.value.setCenter(center);
      break;
      
    case 'bmap':
      const point = new window.BMap.Point(center[0], center[1]);
      mapInstance.value.setCenter(point);
      break;
      
    case 'gmap':
      mapInstance.value.setCenter({ lat: center[1], lng: center[0] });
      break;
  }
};

// 设置缩放级别
const setZoom = (zoom: number) => {
  if (!mapInstance.value) return;
  mapInstance.value.setZoom(zoom);
};

// 监听属性变化
watch(() => props.center, (newCenter) => {
  if (mapInstance.value) {
    setCenter(newCenter);
  }
}, { deep: true });

watch(() => props.zoom, (newZoom) => {
  if (mapInstance.value) {
    setZoom(newZoom);
  }
});

watch(() => props.markers, () => {
  if (mapInstance.value) {
    addMarkers();
  }
}, { deep: true });

// 暴露方法
defineExpose({
  mapInstance,
  setCenter,
  setZoom,
  addMarkers,
  clearMarkers
});

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  // 清理地图实例
  if (mapInstance.value) {
    switch (props.type) {
      case 'amap':
        mapInstance.value.destroy();
        break;
      case 'bmap':
        // 百度地图没有明确的销毁方法，清除事件监听
        break;
      case 'gmap':
        // 谷歌地图没有明确的销毁方法，清除事件监听
        break;
    }
    mapInstance.value = null;
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

.sc-map-content {
  width: 100%;
  height: 100%;
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

.sc-map-loading .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--el-color-primary);
}
</style>