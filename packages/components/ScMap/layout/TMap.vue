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
const distanceComponents = ref<any | null>(null);

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
const addMarkers = (markers?: Marker[]) => {
  if (!mapInstance.value) return;
  
  // 如果提供了标记点数组，则使用提供的数组，否则使用props
  const markersToAdd = markers || props.markers;
  
  // 如果是从props中初始化，则先清除现有标记点
  if (!markers) {
    clearMarkers();
  }
  
  markersToAdd.forEach(marker => {
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
    
    // 保存marker数据到实例上，方便后续查找
    (markerInstance as any).__markerData = marker;
    
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

/**
 * 设置标记点（先清空再添加）
 * @param markers 标记点数组
 */
const setMarkers = (markers: Marker[]) => {
  if (!mapInstance.value) return;
  
  // 先清空现有标记点
  clearMarkers();
  
  // 处理标记点ID去重逻辑
  const uniqueIds = new Set();
  const uniqueMarkers = markers.filter(marker => {
    const markerId = marker.data?.id;
    
    // 如果没有ID，或者ID没有重复，则保留
    if (!markerId) return true;
    
    if (uniqueIds.has(markerId)) {
      return false; // 丢弃重复ID的标记点
    } else {
      uniqueIds.add(markerId);
      return true;
    }
  });
  
  // 添加去重后的标记点
  if (uniqueMarkers.length > 0) {
    addMarkers(uniqueMarkers);
  }
};

/**
 * 根据id删除指定的标记点
 * @param markerId 要删除的标记点ID
 * @returns 删除是否成功
 */
const removeMarker = (markerId: string) => {
  if (!mapInstance.value) return false;
  
  // 查找要删除的标记点索引
  const markerIndex = markersInstances.value.findIndex(marker => {
    const markerData = (marker as any).__markerData;
    return markerData && 
           (markerData.id === markerId || 
           (markerData.data && markerData.data.id === markerId));
  });
  
  // 如果找到了对应的标记点
  if (markerIndex !== -1) {
    // 移除地图上的标记点
    mapInstance.value.removeOverLay(markersInstances.value[markerIndex]);
    // 从标记点实例数组中移除
    markersInstances.value.splice(markerIndex, 1);
    return true;
  }
  
  return false;
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

/**
 * 存储测距相关组件
 */
interface DistanceComponents {
  markers: any[];
  line: any;
  label: any;
  handleClick: (e: any) => void;
  handleRightClick: (e: any) => void;
}

// 开始测量距离
const startMeasure = () => {
  if (!mapInstance.value) return;
  
  // 禁用其他工具
  stopDrawing();
  disableAddMarker();
  
  // 记录当前工具状态
  currentTool.value = 'distance';
  
  // 设置鼠标样式为十字形
  if (mapInstance.value.getContainer()) {
    mapInstance.value.getContainer().style.cursor = 'crosshair';
  }
  
  console.log('天地图开始测距');
  
  // 创建测距相关变量
  const pointsArray: Array<[number, number]> = [];
  let measureLineObj: any = null;
  let markersArray: any[] = [];
  let totalDistance = 0;
  let distanceLabel: any = null;
  
  // 处理地图点击事件
  const handleMeasureClick = (e: any) => {
    if (!e.lnglat) return;
    
    try {
      // 安全地获取经纬度
      const lngValue = typeof e.lnglat.lng === 'function' ? e.lnglat.lng() : Number(e.lnglat.lng);
      const latValue = typeof e.lnglat.lat === 'function' ? e.lnglat.lat() : Number(e.lnglat.lat);
      
      console.log('测距点击点:', lngValue, latValue);
      
      // 添加点到数组
      pointsArray.push([lngValue, latValue]);
      
      // 添加标记点
      try {
        const markerPoint = new window.T.LngLat(lngValue, latValue);
        const marker = new window.T.Marker(markerPoint, {
          icon: new window.T.Icon({
            iconUrl: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
            iconSize: new window.T.Point(20, 20),
            iconAnchor: new window.T.Point(10, 10)
          })
        });
        mapInstance.value.addOverLay(marker);
        markersArray.push(marker);
      } catch (err) {
        console.error('创建标记点失败:', err);
      }
      
      // 更新线段
      if (pointsArray.length >= 2) {
        // 如果已有测距线，则移除
        if (measureLineObj) {
          mapInstance.value.removeOverLay(measureLineObj);
        }
        
        try {
          // 创建新的测距线
          const tPoints = pointsArray.map(p => {
            return new window.T.LngLat(p[0], p[1]);
          });
          
          measureLineObj = new window.T.Polyline(tPoints, {
            color: '#FF0000',
            weight: 3,
            opacity: 0.8
          });
          mapInstance.value.addOverLay(measureLineObj);
          
          // 计算总距离
          totalDistance = 0;
          for (let i = 1; i < pointsArray.length; i++) {
            const p1 = new window.T.LngLat(pointsArray[i-1][0], pointsArray[i-1][1]);
            const p2 = new window.T.LngLat(pointsArray[i][0], pointsArray[i][1]);
            totalDistance += p1.distanceTo(p2);
          }
          
          // 更新距离标签
          if (distanceLabel) {
            mapInstance.value.removeOverLay(distanceLabel);
          }
          
          // 添加距离标签
          const lastPoint = pointsArray[pointsArray.length - 1];
          distanceLabel = new window.T.Label({
            position: new window.T.LngLat(lastPoint[0], lastPoint[1]),
            text: `总距离: ${(totalDistance / 1000).toFixed(3)} 公里`,
            offset: new window.T.Point(5, 5)
          });
          mapInstance.value.addOverLay(distanceLabel);
          
          console.log('测距线更新:', totalDistance);
        } catch (err) {
          console.error('更新测距线失败:', err);
        }
      }
    } catch (err) {
      console.error('测距处理点击事件失败:', err);
    }
  };
  
  // 处理右键点击完成测距
  const handleMeasureRightClick = () => {
    try {
      // 移除事件监听
      if (mapInstance.value) {
        mapInstance.value.removeEventListener('click', handleMeasureClick);
        mapInstance.value.removeEventListener('rightclick', handleMeasureRightClick);
        
        // 恢复鼠标样式
        if (mapInstance.value.getContainer()) {
          mapInstance.value.getContainer().style.cursor = '';
        }
      }
      
      // 触发测距结果事件
      if (pointsArray.length >= 2) {
        const result: DistanceResultEvent = {
          distance: totalDistance,
          path: pointsArray,
          originalEvent: null
        };
        
        distanceResult.value = result;
        emit('distance-result', result);
        console.log('测距完成, 总距离:', totalDistance);
      }
      
      // 重置当前工具
      currentTool.value = '';
    } catch (err) {
      console.error('测距处理右键事件失败:', err);
    }
  };
  
  // 添加事件监听
  mapInstance.value.addEventListener('click', handleMeasureClick);
  mapInstance.value.addEventListener('rightclick', handleMeasureRightClick);
  
  // 存储测距组件供后续清除使用
  distanceComponents.value = {
    markers: markersArray,
    line: measureLineObj,
    label: distanceLabel,
    handleClick: handleMeasureClick,
    handleRightClick: handleMeasureRightClick
  };
};

// 停止测量距离
const stopMeasure = () => {
  if (!mapInstance.value) return;
  
  // 清除当前工具状态
  currentTool.value = '';
  
  // 恢复鼠标样式
  if (mapInstance.value.getContainer()) {
    mapInstance.value.getContainer().style.cursor = '';
  }
  
  // 移除事件监听和清理组件
  if (distanceComponents.value) {
    // 移除事件监听
    mapInstance.value.removeEventListener('click', distanceComponents.value.handleClick);
    mapInstance.value.removeEventListener('rightclick', distanceComponents.value.handleRightClick);
    
    // 清除标记点
    if (distanceComponents.value.markers) {
      distanceComponents.value.markers.forEach(marker => {
        if (marker && mapInstance.value) {
          mapInstance.value.removeOverLay(marker);
        }
      });
    }
    
    // 清除测距线
    if (distanceComponents.value.line && mapInstance.value) {
      mapInstance.value.removeOverLay(distanceComponents.value.line);
    }
    
    // 清除距离标签
    if (distanceComponents.value.label && mapInstance.value) {
      mapInstance.value.removeOverLay(distanceComponents.value.label);
    }
    
    // 重置距离组件
    distanceComponents.value = null;
  }
  
  // 重置测距结果
  distanceResult.value = null;
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
      const lat = e.lnglat.lat;
      const lng = e.lnglat.lng;
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
  removeMarker,
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
  handleMapClickForMarker,
  setMarkers
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