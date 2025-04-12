<template>
  <div class="bmap-container" :style="{ height: height, width: width }">
    <div ref="mapContainer" class="map-container"></div>
    
    <!-- 使用统一的工具面板组件 -->
    <MapToolbar
      v-model="currentTool"
      :show="drawingControl"
      :position="toolsPosition"
      :collapsed="isToolsCollapsed"
      :options="toolsOptions"
      v-model:showPosition="showMousePosition"
      @tool-click="handleToolClick"
      @toggle-collapse="toggleToolbar"
    >
      <template #tools>
        <slot name="tools"></slot>
      </template>
    </MapToolbar>
    
    <!-- 测距结果显示 -->
    <div v-if="distanceResult && currentTool === 'distance'" class="distance-result">
      <div class="distance-label">距离: {{ formatDistance(distanceResult.distance) }}</div>
      <div class="distance-close" @click="clearDistance">×</div>
    </div>
    
    <!-- 使用统一的鼠标位置组件 -->
    <MousePosition
      :show="showMousePosition"
      :position="mousePosition"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { Marker, MapViewType, Shape, ShapeStyle, ShapeType, ToolType, ToolsOptions, DistanceResultEvent } from '../types';
import MapToolbar from '../components/MapToolbar.vue';
import MousePosition from '../components/MousePosition.vue';

// 为window对象添加全局声明
declare global {
  interface Window {
    BMap: any;
    BMAP_SATELLITE_MAP: any;
    BMAP_NORMAL_MAP: any;
    BMAP_HYBRID_MAP: any;
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
  },
  // 是否显示工具栏
  drawingControl: {
    type: Boolean,
    default: true
  },
  // 工具栏位置
  toolsPosition: {
    type: String,
    default: 'top-right'
  },
  // 工具栏选项
  toolsOptions: {
    type: Object as () => ToolsOptions,
    default: () => ({})
  },
  // 是否折叠工具栏
  toolsCollapsed: {
    type: Boolean,
    default: false
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
const currentTool = ref<ToolType | ''>('');
const isToolsCollapsed = ref(false);
const distanceResult = ref<DistanceResultEvent | null>(null);
const showMousePosition = ref(true);
const mousePosition = ref<[number, number]>([0, 0]);

// 初始化地图
const initMap = () => {
  if (!mapContainer.value || !window.BMap) return;
  
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
  
  // 根据视图类型设置地图类型
  if (props.viewType === 'satellite') {
    mapInstance.value.setMapType(window.BMAP_SATELLITE_MAP);
  } else if (props.viewType === 'hybrid') {
    mapInstance.value.setMapType(window.BMAP_HYBRID_MAP);
  } else {
    mapInstance.value.setMapType(window.BMAP_NORMAL_MAP);
  }
  
  // 应用自定义样式
  if (props.mapStyle) {
    try {
      const style = JSON.parse(props.mapStyle);
      mapInstance.value.setMapStyle({ styleJson: style });
    } catch (e) {
      console.error('地图样式解析错误:', e);
    }
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
    const point = new window.BMap.Point(marker.position[0], marker.position[1]);
    const markerInstance = new window.BMap.Marker(point, {
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
    markersInstances.value.push(markerInstance);
  });
};

// 清除标记点
const clearMarkers = () => {
  if (!mapInstance.value) return;
  
  markersInstances.value.forEach(marker => {
    mapInstance.value.removeOverlay(marker);
  });
  
  markersInstances.value = [];
};

// 绑定地图事件
const bindMapEvents = () => {
  if (!mapInstance.value) return;
  
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
  
  // 添加鼠标移动事件监听，用于显示坐标
  mapInstance.value.addEventListener('mousemove', (e: any) => {
    if (showMousePosition.value) {
      mousePosition.value = [e.point.lng, e.point.lat];
    }
  });
};

// 设置地图中心点
const setCenter = (center: [number, number]) => {
  if (!mapInstance.value) return;
  const point = new window.BMap.Point(center[0], center[1]);
  mapInstance.value.setCenter(point);
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

// 切换工具栏折叠状态
const toggleToolbar = () => {
  isToolsCollapsed.value = !isToolsCollapsed.value;
};

// 处理工具点击
const handleToolClick = (tool: ToolType | '') => {
  if (currentTool.value === tool) {
    // 再次点击同一工具，则停止当前工具
    stopCurrentTool();
    return;
  }
  
  // 停止当前工具
  stopCurrentTool();
  
  // 设置当前工具
  currentTool.value = tool;
  
  // 启动新工具
  if (tool === 'distance') {
    startMeasure();
  } else if (tool) {
    startDrawing(tool);
  }
};

// 停止当前工具
const stopCurrentTool = () => {
  if (currentTool.value === 'distance') {
    stopMeasure();
  } else if (currentTool.value) {
    stopDrawing();
  }
  currentTool.value = '';
};

// 格式化距离显示
const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${meters.toFixed(0)} 米`;
  } else {
    return `${(meters / 1000).toFixed(2)} 公里`;
  }
};

// 清除测距结果
const clearDistance = () => {
  distanceResult.value = null;
  currentTool.value = '';
  // 这里可以添加清除测距线路的代码
};

// 开始测距
const startMeasure = () => {
  // 测距功能实现代码
  console.log('百度地图开始测距 - 待实现');
};

// 停止测距
const stopMeasure = () => {
  // 停止测距功能实现代码
  console.log('百度地图停止测距 - 待实现');
};

// 开始绘制
const startDrawing = (type: ToolType) => {
  // 绘制功能实现代码
  console.log(`百度地图开始绘制 ${type} - 待实现`);
};

// 停止绘制
const stopDrawing = () => {
  // 停止绘制功能实现代码
  console.log('百度地图停止绘制 - 待实现');
};

// 初始化工具栏折叠状态
onMounted(() => {
  isToolsCollapsed.value = props.toolsCollapsed;
  initMap();
});

onUnmounted(() => {
  // 清理地图实例
  if (mapInstance.value) {
    // 百度地图没有明确的销毁方法，清除事件和覆盖物
    markersInstances.value.forEach(marker => {
      mapInstance.value.removeOverlay(marker);
    });
    mapInstance.value = null;
  }
});

// 暴露方法
defineExpose({
  mapInstance,
  currentTool,
  distanceResult,
  setCenter,
  setZoom,
  addMarkers,
  clearMarkers,
  startDrawing,
  stopDrawing,
  startMeasure,
  stopMeasure
});
</script>

<style scoped>
.bmap-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

.distance-result {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
}

.distance-label {
  font-size: 14px;
  color: #333;
}

.distance-close {
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f5f5f5;
  font-size: 16px;
}

.distance-close:hover {
  background-color: #e0e0e0;
}
</style> 