<template>
  <div class="tmap-container" :style="{ height: height, width: width }">
    <div class="map-container" ref="mapContainer"></div>
    
    <!-- 工具面板已移到父组件中统一管理，这里不再需要 -->
    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Marker, MapViewType, Shape, ShapeStyle, ShapeType, ToolType, DistanceResultEvent } from '../types';

// 声明全局类型
declare global {
  interface Window {
    T: any;
  }
}

const props = defineProps({
  // 工具栏位置不再需要，由父组件统一管理
  // toolsPosition: {
  //   type: String,
  //   default: 'right-top', // 'left-top', 'right-top', 'left-bottom', 'right-bottom'
  //   validator: (value) => ['left-top', 'right-top', 'left-bottom', 'right-bottom'].includes(value)
  // },
  // // 工具栏是否折叠不再需要，由父组件统一管理
  // toolsCollapsed: {
  //   type: Boolean,
  //   default: false
  // },
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
  // 图形
  shapes: {
    type: Array as () => Shape[],
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
    default: false
  },
  // 是否显示比例尺控件
  scaleControl: {
    type: Boolean,
    default: false
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
  'distance-result',
  'marker-created'
]);

const mapContainer = ref<HTMLElement | null>(null);
const mapInstance = ref<any>(null);
const markersInstances = ref<any[]>([]);
const currentTool = ref<ToolType | ''>('');
const distanceResult = ref<DistanceResultEvent | null>(null);

// 初始化地图
const initMap = () => {
  if (!window.T) {
    console.error('T地图脚本未加载');
    return;
  }
  
  if (!mapContainer.value) {
    console.error('地图容器不存在');
    return;
  }
  
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
      lat: e.lnglat.lat, // 为了兼容父组件的事件处理
      lng: e.lnglat.lng,
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

// 开始测量距离
const startMeasure = () => {
  if (!mapInstance.value) return;
  
  // 天地图的测量工具
  // 此处是简化实现，实际项目中应该根据天地图API实现更复杂的测距功能
  console.log('开始测量距离');
  currentTool.value = 'distance';
  
  // 在实际应用中，这里应该调用天地图的测距工具
};

// 停止测量距离
const stopMeasure = () => {
  if (!mapInstance.value) return;
  
  console.log('停止测量距离');
  currentTool.value = '';
  
  // 在实际应用中，这里应该停止天地图的测距工具
};

// 开始绘制图形
const startDrawing = (type: ToolType) => {
  if (!mapInstance.value) return;
  
  console.log(`开始绘制 ${type}`);
  currentTool.value = type;
  
  // 在实际应用中，这里应该调用天地图的绘图工具
};

// 停止绘制图形
const stopDrawing = () => {
  if (!mapInstance.value) return;
  
  console.log('停止绘制');
  currentTool.value = '';
  
  // 在实际应用中，这里应该停止天地图的绘图工具
};

// 添加形状
const addShape = (shape: Shape) => {
  if (!mapInstance.value) return;
  
  let shapeInstance: any;
  
  switch (shape.type) {
    case 'circle':
      return addCircle(
        shape.path[0] as [number, number], 
        shape.radius || 1000, 
        shape.style
      );
    case 'polygon':
      return addPolygon(
        shape.path as [number, number][], 
        shape.style
      );
    case 'rectangle':
      // 矩形通常是两个点表示的边界，但在TMap中也作为多边形处理
      if (Array.isArray(shape.path) && shape.path.length >= 2) {
        // 将边界转换为四个顶点
        const sw = shape.path[0];
        const ne = shape.path[1];
        const path: [number, number][] = [
          [sw[0], sw[1]],
          [ne[0], sw[1]],
          [ne[0], ne[1]],
          [sw[0], ne[1]],
          [sw[0], sw[1]] // 闭合
        ];
        return addPolygon(path, shape.style);
      }
      return;
    case 'polyline':
      return addPolyline(
        shape.path as [number, number][], 
        shape.style
      );
  }
};

// 添加多边形
const addPolygon = (points: [number, number][], style?: ShapeStyle) => {
  if (!mapInstance.value || !points || points.length < 3) return;
  
  const id = `polygon_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // 转换点坐标为T-Map格式
  const tPoints = points.map(point => new window.T.LngLat(point[0], point[1]));
  
  // 样式配置
  const styleOptions = {
    color: style?.strokeColor || '#1890FF',
    weight: style?.strokeWeight || 2,
    opacity: style?.strokeOpacity || 0.9,
    fillColor: style?.fillColor || '#1890FF',
    fillOpacity: style?.fillOpacity || 0.5
  };
  
  // 创建多边形实例
  const polygon = new window.T.Polygon(tPoints, styleOptions);
  
  // 添加到地图
  mapInstance.value.addOverLay(polygon);
  
  // 存储实例，用于后续操作
  if (!window._tmap_overlays) {
    window._tmap_overlays = new Map();
  }
  window._tmap_overlays.set(id, polygon);
  
  return id;
};

// 添加圆形
const addCircle = (center: [number, number], radius: number, style?: ShapeStyle) => {
  if (!mapInstance.value) return;
  
  const id = `circle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // 转换中心点为T-Map格式
  const tCenter = new window.T.LngLat(center[0], center[1]);
  
  // 样式配置
  const styleOptions = {
    color: style?.strokeColor || '#1890FF',
    weight: style?.strokeWeight || 2,
    opacity: style?.strokeOpacity || 0.9,
    fillColor: style?.fillColor || '#1890FF',
    fillOpacity: style?.fillOpacity || 0.5
  };
  
  // 创建圆形实例
  const circle = new window.T.Circle(tCenter, radius, styleOptions);
  
  // 添加到地图
  mapInstance.value.addOverLay(circle);
  
  // 存储实例，用于后续操作
  if (!window._tmap_overlays) {
    window._tmap_overlays = new Map();
  }
  window._tmap_overlays.set(id, circle);
  
  return id;
};

// 添加矩形
const addRectangle = (bounds: [[number, number], [number, number]], style?: ShapeStyle) => {
  if (!mapInstance.value) return;
  
  const [sw, ne] = bounds;
  
  // 将西南-东北坐标转换为四个顶点坐标
  const path: [number, number][] = [
    [sw[0], sw[1]], // 西南
    [ne[0], sw[1]], // 东南
    [ne[0], ne[1]], // 东北
    [sw[0], ne[1]], // 西北
    [sw[0], sw[1]]  // 闭合多边形
  ];
  
  // 使用多边形方法创建矩形
  return addPolygon(path, style);
};

// 添加折线
const addPolyline = (points: [number, number][], style?: ShapeStyle) => {
  if (!mapInstance.value || !points || points.length < 2) return;
  
  const id = `polyline_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // 转换点坐标为T-Map格式
  const tPoints = points.map(point => new window.T.LngLat(point[0], point[1]));
  
  // 样式配置
  const styleOptions = {
    color: style?.strokeColor || '#1890FF',
    weight: style?.strokeWeight || 2,
    opacity: style?.strokeOpacity || 0.9
  };
  
  // 创建折线实例
  const polyline = new window.T.Polyline(tPoints, styleOptions);
  
  // 添加到地图
  mapInstance.value.addOverLay(polyline);
  
  // 存储实例，用于后续操作
  if (!window._tmap_overlays) {
    window._tmap_overlays = new Map();
  }
  window._tmap_overlays.set(id, polyline);
  
  return id;
};

// 移除图形
const removeShape = (shapeId: string) => {
  if (!mapInstance.value || !window._tmap_overlays) return;
  
  const overlay = window._tmap_overlays.get(shapeId);
  if (overlay) {
    mapInstance.value.removeOverLay(overlay);
    window._tmap_overlays.delete(shapeId);
  }
};

// 清除所有图形
const clearShapes = () => {
  if (!mapInstance.value || !window._tmap_overlays) return;
  
  window._tmap_overlays.forEach(overlay => {
    mapInstance.value.removeOverLay(overlay);
  });
  
  window._tmap_overlays.clear();
};

// 获取所有图形
const getShapes = () => {
  if (!window._tmap_overlays) return [];
  
  const shapes: Shape[] = [];
  
  window._tmap_overlays.forEach((overlay, id) => {
    // 由于T地图API限制，这里只能获取简化信息
    // 在实际应用中，可能需要更复杂的逻辑来获取完整的图形信息
    let type: ShapeType = 'polygon';
    let path: [number, number][] = [];
    
    if (overlay instanceof window.T.Circle) {
      type = 'circle';
      const center = overlay.getCenter();
      path = [[center.lng, center.lat]];
    } else if (overlay instanceof window.T.Polygon) {
      type = 'polygon';
    } else if (overlay instanceof window.T.Polyline) {
      type = 'polyline';
    }
    
    shapes.push({
      id,
      type,
      path
    });
  });
  
  return shapes;
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

// 在现有方法之后添加鼠标移动支持
const addMouseMoveListener = (callback) => {
  if (!mapInstance.value) return;
  
  // 添加鼠标移动事件监听
  mapInstance.value.on('mousemove', (e) => {
    if (callback) {
      // 获取鼠标点击位置的经纬度
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      callback({
        lat,
        lng,
        latlng: [lat, lng]
      });
    }
  });
};

const removeMouseMoveListener = () => {
  if (!mapInstance.value) return;
  
  // 移除鼠标移动事件监听
  mapInstance.value.off('mousemove');
};

// 启用添加标记模式
const enableAddMarker = () => {
  if (!mapInstance.value) return;
  
  // 禁用其他工具
  stopDrawing();
  stopMeasure();
  
  // 设置鼠标样式为十字形
  mapInstance.value.getContainer().style.cursor = 'crosshair';
  
  // 绑定地图点击事件
  mapInstance.value.on('click', handleMapClickForMarker);
};

// 禁用添加标记模式
const disableAddMarker = () => {
  if (!mapInstance.value) return;
  
  // 恢复鼠标样式
  mapInstance.value.getContainer().style.cursor = '';
  
  // 解绑地图点击事件
  mapInstance.value.off('click', handleMapClickForMarker);
};

// 处理地图点击添加标记
const handleMapClickForMarker = (e: any) => {
  // 获取点击位置
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  
  // 创建新标记
  const newMarker = {
    position: [lng, lat],
    title: `标记点 (${lng.toFixed(6)}, ${lat.toFixed(6)})`,
    icon: '', // 使用默认图标
    data: { id: `MARKER_${Date.now()}` }
  };
  
  // 添加标记
  addMarkers([newMarker]);
  
  // 触发标记创建事件
  emit('marker-created', newMarker);
};

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
  stopMeasure,
  addShape,
  addPolygon,
  addCircle,
  addRectangle,
  addPolyline,
  removeShape,
  clearShapes,
  getShapes,
  addMouseMoveListener,
  removeMouseMoveListener,
  enableAddMarker,
  disableAddMarker,
  handleMapClickForMarker
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
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* 工具栏相关样式已移除，统一由父组件管理 */
</style> 