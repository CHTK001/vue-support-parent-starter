<template>
  <div ref="mapContainer" class="tmap-container" :style="{ height: height, width: width }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { Marker, MapViewType } from '../types';

// 为window对象添加全局声明
declare global {
  interface Window {
    T: any;
  }
}

const props = defineProps({
  // API密钥
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
const markersInstances = ref<any[]>([]);

// 初始化地图
const initMap = () => {
  if (!mapContainer.value || !window.T) return;
  
  // 创建地图实例
  mapInstance.value = new window.T.Map(mapContainer.value);
  
  // 设置中心点和缩放级别
  const point = new window.T.LngLat(props.center[0], props.center[1]);
  mapInstance.value.centerAndZoom(point, props.zoom);
  
  // 根据视图类型设置地图类型
  if (props.viewType === 'satellite') {
    mapInstance.value.setMapType(window.T.SATELLITE_MAP);
  } else if (props.viewType === 'hybrid') {
    mapInstance.value.setMapType(window.T.HYBRID_MAP);
  } else if (props.viewType === 'terrain') {
    mapInstance.value.setMapType(window.T.TERRAIN_MAP);
  }
  
  // 设置是否允许拖动和滚轮缩放
  if (props.draggable) {
    mapInstance.value.enableDrag();
  } else {
    mapInstance.value.disableDrag();
  }
  
  if (props.scrollWheel) {
    mapInstance.value.enableScrollWheelZoom();
  } else {
    mapInstance.value.disableScrollWheelZoom();
  }
  
  // 添加控件
  if (props.zoomControl) {
    mapInstance.value.addControl(new window.T.Control.Zoom());
  }
  
  if (props.scaleControl) {
    mapInstance.value.addControl(new window.T.Control.Scale());
  }
  
  // 添加标记点
  addMarkers();
  
  // 绑定事件
  bindMapEvents();
  
  // 触发地图加载完成事件
  emit('map-loaded', mapInstance.value);
};

// 添加标记点
const addMarkers = () => {
  if (!mapInstance.value) return;
  
  // 清除现有标记点
  clearMarkers();
  
  props.markers.forEach(marker => {
    const tPoint = new window.T.LngLat(marker.position[0], marker.position[1]);
    const markerInstance = new window.T.Marker(tPoint);
    
    if (marker.icon) {
      const icon = new window.T.Icon({
        iconUrl: marker.icon,
        iconSize: new window.T.Point(25, 25)
      });
      markerInstance.setIcon(icon);
    }
    
    if (marker.label) {
      const label = new window.T.Label({
        text: marker.label,
        position: tPoint,
        offset: new window.T.Point(20, -10)
      });
      mapInstance.value.addOverLay(label);
    }
    
    markerInstance.addEventListener('click', () => {
      emit('marker-click', marker);
    });
    
    mapInstance.value.addOverLay(markerInstance);
    markersInstances.value.push(markerInstance);
  });
};

// 清除标记点
const clearMarkers = () => {
  if (!mapInstance.value) return;
  
  markersInstances.value.forEach(marker => {
    mapInstance.value.removeOverLay(marker);
  });
  
  markersInstances.value = [];
};

// 绑定地图事件
const bindMapEvents = () => {
  if (!mapInstance.value) return;
  
  mapInstance.value.addEventListener('click', (e: any) => {
    emit('map-click', {
      position: [e.lnglat.lng, e.lnglat.lat],
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
};

// 设置地图中心点
const setCenter = (center: [number, number]) => {
  if (!mapInstance.value) return;
  const tPoint = new window.T.LngLat(center[0], center[1]);
  mapInstance.value.panTo(tPoint);
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
  // 由父组件确保TMap已加载
  initMap();
});

onUnmounted(() => {
  // 清理地图实例
  if (mapInstance.value) {
    if (mapInstance.value.destroy) {
      mapInstance.value.destroy();
    }
    mapInstance.value = null;
  }
});
</script>

<style scoped>
.tmap-container {
  width: 100%;
  height: 100%;
}
</style> 