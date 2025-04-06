<template>
  <div ref="mapContainer" class="amap-container" :style="{ height: height, width: width }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { Marker, MapViewType } from '../types';

// 为window对象添加全局声明
declare global {
  interface Window {
    AMap: any;
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
  if (!mapContainer.value || !window.AMap) return;
  
  // 创建地图实例
  const mapOptions: any = {
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
  if (props.zoomControl &&  window.AMap.ToolBar) {
    mapInstance.value.addControl(new window.AMap.ToolBar());
  }
  
  if (props.scaleControl && window.AMap.Scale) {
    mapInstance.value.addControl(new window.AMap.Scale());
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
    const markerInstance = new window.AMap.Marker({
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
    markersInstances.value.push(markerInstance);
  });
};

// 清除标记点
const clearMarkers = () => {
  if (!mapInstance.value) return;
  
  markersInstances.value.forEach(marker => {
    marker.setMap(null);
  });
  
  markersInstances.value = [];
};

// 绑定地图事件
const bindMapEvents = () => {
  if (!mapInstance.value) return;
  
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
};

// 设置地图中心点
const setCenter = (center: [number, number]) => {
  if (!mapInstance.value) return;
  mapInstance.value.setCenter(center);
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
  // 由父组件确保AMap已加载
  initMap();
});

onUnmounted(() => {
  // 清理地图实例
  if (mapInstance.value) {
    mapInstance.value.destroy();
    mapInstance.value = null;
  }
});
</script>

<style scoped>
.amap-container {
  width: 100%;
  height: 100%;
}
</style> 