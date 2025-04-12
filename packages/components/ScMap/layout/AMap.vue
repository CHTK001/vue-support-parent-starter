<template>
  <div class="amap-container" :style="{ height: height, width: width }">
    <div ref="mapContainer" class="map-container"></div>
    
    <!-- 工具栏 -->
    <div v-if="drawingControl" 
         class="sc-map-toolbar" 
         :class="[`position-${toolsPosition}`, { 'collapsed': isToolsCollapsed }]">
      <!-- 折叠/展开按钮 -->
      <div class="toolbar-toggle" @click="toggleToolbar">
        <i class="toolbar-toggle-icon" :class="{ 'expanded': !isToolsCollapsed }"></i>
      </div>
      <!-- 绘图工具 -->
      <div class="tool-group">
        <div v-if="toolsOptions.circle" 
             class="tool-button" 
             :class="{ active: currentTool === 'circle' }" 
             @click="handleToolClick('circle')" 
             title="绘制圆形">
          <i class="tool-icon circle-icon"></i>
        </div>
        <div v-if="toolsOptions.polygon" 
             class="tool-button" 
             :class="{ active: currentTool === 'polygon' }" 
             @click="handleToolClick('polygon')" 
             title="绘制多边形">
          <i class="tool-icon polygon-icon"></i>
        </div>
        <div v-if="toolsOptions.rectangle" 
             class="tool-button" 
             :class="{ active: currentTool === 'rectangle' }" 
             @click="handleToolClick('rectangle')" 
             title="绘制矩形">
          <i class="tool-icon rectangle-icon"></i>
        </div>
        <div v-if="toolsOptions.polyline" 
             class="tool-button" 
             :class="{ active: currentTool === 'polyline' }" 
             @click="handleToolClick('polyline')" 
             title="绘制线段">
          <i class="tool-icon polyline-icon"></i>
        </div>
        <div v-if="toolsOptions.distance" 
             class="tool-button" 
             :class="{ active: currentTool === 'distance' }" 
             @click="handleToolClick('distance')" 
             title="测量距离">
          <i class="tool-icon distance-icon"></i>
        </div>
        <div class="tool-button" 
             @click="handleToolClick('')" 
             title="停止绘制"
             v-if="currentTool">
          <i class="tool-icon stop-icon"></i>
        </div>
      </div>
      
      <!-- 自定义工具插槽 -->
      <slot name="tools"></slot>
    </div>
    
    <!-- 测距结果显示 -->
    <div v-if="distanceResult && currentTool === 'distance'" class="distance-result">
      <div class="distance-label">距离: {{ formatDistance(distanceResult.distance) }}</div>
      <div class="distance-close" @click="clearDistance">×</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { Marker, MapViewType, Shape, ShapeStyle, ShapeType, ToolType, ClusterOptions, ToolsOptions, DistanceResultEvent } from '../types';

// 为window对象添加全局声明
declare global {
  interface Window {
    AMap: any;
  }
}

const props = defineProps({  
  // 工具栏位置
  toolsPosition: {
    type: String,
    default: 'right-top', // 'left-top', 'right-top', 'left-bottom', 'right-bottom'
    validator: (value) => ['left-top', 'right-top', 'left-bottom', 'right-bottom'].includes(value)
  },
  // 工具栏是否折叠
  toolsCollapsed: {
    type: Boolean,
    default: false
  },
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
  // 是否显示绘图工具控件
  drawingControl: {
    type: Boolean,
    default: false
  },
  // 工具控制选项
  toolsOptions: {
    type: Object as () => ToolsOptions,
    default: () => ({
      circle: true,
      polygon: true,
      rectangle: true,
      polyline: true,
      distance: true
    })
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
  // 聚合配置
  clusterOptions: {
    type: Object as () => ClusterOptions,
    default: () => ({
      enable: false,
      radius: 80,
      minClusterSize: 2,
      gridSize: 60,
      maxZoom: 18
    })
  }
});

const emit = defineEmits([
  'map-loaded', 
  'marker-click', 
  'map-click', 
  'zoom-changed',
  'center-changed',
  'bounds-changed',
  'shape-created',
  'shape-click',
  'shape-changed',
  'cluster-click',
  'distance-result'
]);

const mapContainer = ref<HTMLElement | null>(null);
const mapInstance = ref<any>(null);
const markersInstances = ref<any[]>([]);
const shapesInstances = ref<Map<string, any>>(new Map());
const drawingManager = ref<any>(null);
const clusterManager = ref<any>(null);
const distanceTool = ref<any>(null);
const currentTool = ref<ToolType | ''>('');
const distanceResult = ref<DistanceResultEvent | null>(null);
const distanceLine = ref<any>(null);
const isToolsCollapsed = ref(false);

// 初始化工具栏折叠状态
onMounted(() => {
  isToolsCollapsed.value = props.toolsCollapsed;
});

// 切换工具栏折叠状态
const toggleToolbar = () => {
  isToolsCollapsed.value = !isToolsCollapsed.value;
};

// 控件实例引用
const zoomControlInstance = ref<any>(null);
const scaleControlInstance = ref<any>(null);

// 格式化距离显示
const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${meters.toFixed(0)} 米`;
  } else {
    return `${(meters / 1000).toFixed(2)} 公里`;
  }
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

// 清除测距结果
const clearDistance = () => {
  if (distanceLine.value) {
    distanceLine.value.setMap(null);
    distanceLine.value = null;
  }
  distanceResult.value = null;
  currentTool.value = '';
};

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

  // 延迟添加控件，确保地图已正确初始化
  setTimeout(() => {
    updateControls();
  }, 100);

  // 初始化绘图工具
  if (props.drawingControl) {
    initDrawingTools();
  }
  
  // 初始化测距工具
  initDistanceTool();

  // 添加标记点
  addMarkers();

  // 添加图形
  addShapes();

  // 绑定事件
  bindMapEvents();
  
  // 初始化聚合管理器
  if (props.clusterOptions?.enable) {
    enableCluster(props.clusterOptions);
  }

  // 触发地图加载完成事件
  emit('map-loaded', mapInstance.value);
};

// 更新地图控件
const updateControls = () => {
  if (!mapInstance.value) return;
  
  // 清除现有控件
  removeControls();
  
  // 添加缩放控件
  if (props.zoomControl && window.AMap.ToolBar) {
    zoomControlInstance.value = new window.AMap.ToolBar();
    mapInstance.value.addControl(zoomControlInstance.value);
  }
  
  // 添加比例尺控件
  if (props.scaleControl && window.AMap.Scale) {
    scaleControlInstance.value = new window.AMap.Scale();
    mapInstance.value.addControl(scaleControlInstance.value);
  }
};

// 移除地图控件
const removeControls = () => {
  if (!mapInstance.value) return;
  
  // 移除缩放控件
  if (zoomControlInstance.value) {
    mapInstance.value.removeControl(zoomControlInstance.value);
    zoomControlInstance.value = null;
  }
  
  // 移除比例尺控件
  if (scaleControlInstance.value) {
    mapInstance.value.removeControl(scaleControlInstance.value);
    scaleControlInstance.value = null;
  }
};

// 监听控件相关属性变化
watch([() => props.zoomControl, () => props.scaleControl, () => props.drawingControl], () => {
  updateControls();
});

// 监听拖动和滚轮缩放属性变化
watch([() => props.draggable, () => props.scrollWheel], () => {
  if (!mapInstance.value) return;
  
  // 更新拖动能力
  if (props.draggable) {
    mapInstance.value.setStatus({dragEnable: true});
  } else {
    mapInstance.value.setStatus({dragEnable: false});
  }
  
  // 更新滚轮缩放能力
  if (props.scrollWheel) {
    mapInstance.value.setStatus({zoomEnable: true});
  } else {
    mapInstance.value.setStatus({zoomEnable: false});
  }
});

// 初始化绘图工具
const initDrawingTools = () => {
  if (!mapInstance.value || !window.AMap.MouseTool) {
    // 确保高德地图绘图插件已加载
    loadDrawingPlugins().then(() => {
      setupDrawingManager();
    });
  } else {
    setupDrawingManager();
  }
};

// 加载绘图插件
const loadDrawingPlugins = async () => {
  return new Promise<void>((resolve) => {
    window.AMap.plugin(['AMap.MouseTool'], () => {
      resolve();
    });
  });
};

// 设置绘图管理器
const setupDrawingManager = () => {
  if (!mapInstance.value || !window.AMap.MouseTool) return;
  
  drawingManager.value = new window.AMap.MouseTool(mapInstance.value);
  
  // 监听绘制完成事件
  drawingManager.value.on('draw', (event: any) => {
    const shape = convertDrawedObjectToShape(event.obj);
    emit('shape-created', shape);
    // 停止绘图
    currentTool.value = '';
  });
};

// 销毁绘图工具
const destroyDrawingTools = () => {
  if (drawingManager.value) {
    drawingManager.value.close(true);
    drawingManager.value = null;
  }
};

// 将绘制的对象转换为标准Shape格式
const convertDrawedObjectToShape = (obj: any) => {
  let type: ShapeType = 'polygon';
  let path: [number, number][] = [];
  let radius: number | undefined = undefined;
  
  if (obj instanceof window.AMap.Circle) {
    type = 'circle';
    const center = obj.getCenter();
    path = [[center.getLng(), center.getLat()]];
    radius = obj.getRadius();
  } else if (obj instanceof window.AMap.Polygon) {
    type = 'rectangle';
    path = obj.getPath().map((point: any) => [point.getLng(), point.getLat()]);
    // 检查是否是矩形
    if (path.length === 4) {
      type = 'rectangle';
    } else {
      type = 'polygon';
    }
  } else if (obj instanceof window.AMap.Polyline) {
    type = 'polyline';
    path = obj.getPath().map((point: any) => [point.getLng(), point.getLat()]);
  }
  
  // 生成随机ID
  const id = `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // 提取样式信息
  const options = obj.getOptions ? obj.getOptions() : {};
  const style: ShapeStyle = {
    fillColor: options.fillColor || '#006600',
    fillOpacity: options.fillOpacity || 0.5,
    strokeColor: options.strokeColor || '#006600',
    strokeWeight: options.strokeWeight || 2,
    strokeOpacity: options.strokeOpacity || 0.9,
    strokeStyle: options.strokeStyle || 'solid'
  };
  
  const shape: Shape = {
    id,
    type,
    path,
    radius,
    style
  };
  
  // 保存形状实例
  shapesInstances.value.set(id, obj);
  
  return shape;
};

// 初始化测距工具
const initDistanceTool = () => {
  if (!mapInstance.value) return;
  
  // 创建测距工具
  window.AMap.plugin(['AMap.RangingTool'], () => {
    distanceTool.value = new window.AMap.RangingTool(mapInstance.value);
    
    // 监听测距完成事件
    window.AMap.Event.addListener(distanceTool.value, 'end', (result: any) => {
      const distance = result.distance;
      const path = result.points.map((point: any) => [point.lng, point.lat]) as [number, number][];
      
      // 保存线路
      distanceLine.value = new window.AMap.Polyline({
        path: result.points,
        strokeColor: '#409EFF',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        strokeStyle: 'solid'
      });
      distanceLine.value.setMap(mapInstance.value);
      
      // 保存测距结果
      distanceResult.value = {
        distance,
        path,
        originalEvent: result
      };
      
      // 触发测距结果事件
      emit('distance-result', distanceResult.value);
    });
  });
};

// 开始测距
const startMeasure = () => {
  if (!distanceTool.value) {
    initDistanceTool();
    setTimeout(() => {
      if (distanceTool.value) {
        distanceTool.value.turnOn();
      }
    }, 100);
    return;
  }
  
  // 清除上一次测距结果
  clearDistance();
  
  // 开启测距工具
  distanceTool.value.turnOn();
};

// 停止测距
const stopMeasure = () => {
  if (distanceTool.value) {
    distanceTool.value.turnOff();
  }
};

// 开始绘制
const startDrawing = (type: ToolType) => {
  if (!drawingManager.value) {
    initDrawingTools();
    // 延迟执行，确保绘图工具初始化完成
    setTimeout(() => startDrawingAction(type), 100);
    return;
  }
  
  startDrawingAction(type);
};

// 执行绘制操作
const startDrawingAction = (type: ToolType) => {
  if (!drawingManager.value) return;
  
  // 停止当前绘制
  drawingManager.value.close();
  
  // 根据类型开始绘制
  switch (type) {
    case 'circle':
      drawingManager.value.circle();
      break;
    case 'polygon':
      drawingManager.value.polygon();
      break;
    case 'rectangle':
      drawingManager.value.rectangle();
      break;
    case 'polyline':
      drawingManager.value.polyline();
      break;
    default:
      break;
  }
};

// 停止绘制
const stopDrawing = () => {
  if (drawingManager.value) {
    drawingManager.value.close();
  }
};

// 添加图形
const addShapes = () => {
  if (!mapInstance.value) return;
  
  // 清除现有图形
  clearShapes();
  
  props.shapes.forEach(shape => {
    addShape(shape);
  });
};

// 添加单个图形
const addShape = (shape: Shape) => {
  if (!mapInstance.value) return;
  
  let shapeInstance: any;
  const styleOptions = {
    fillColor: shape.style?.fillColor || '#006600',
    fillOpacity: shape.style?.fillOpacity || 0.5,
    strokeColor: shape.style?.strokeColor || '#006600',
    strokeWeight: shape.style?.strokeWeight || 2,
    strokeOpacity: shape.style?.strokeOpacity || 0.9,
    strokeStyle: shape.style?.strokeStyle || 'solid'
  };
  
  switch (shape.type) {
    case 'circle': {
      if (!Array.isArray(shape.path) || shape.path.length < 1) break;
      const center = new window.AMap.LngLat(shape.path[0][0], shape.path[0][1]);
      const radius = shape.radius || 1000;
      shapeInstance = new window.AMap.Circle({
        center,
        radius,
        ...styleOptions
      });
      break;
    }
    case 'polygon': {
      if (!Array.isArray(shape.path)) break;
      const path = shape.path.map(point => new window.AMap.LngLat(point[0], point[1]));
      shapeInstance = new window.AMap.Polygon({
        path,
        ...styleOptions
      });
      break;
    }
    case 'rectangle': {
      if (!Array.isArray(shape.path)) break;
      const path = shape.path.map(point => new window.AMap.LngLat(point[0], point[1]));
      shapeInstance = new window.AMap.Polygon({
        path,
        ...styleOptions
      });
      break;
    }
    case 'polyline': {
      if (!Array.isArray(shape.path)) break;
      const path = shape.path.map(point => new window.AMap.LngLat(point[0], point[1]));
      shapeInstance = new window.AMap.Polyline({
        path,
        ...styleOptions
      });
      break;
    }
  }
  
  if (shapeInstance) {
    // 添加点击事件
    shapeInstance.on('click', (e: any) => {
      const clickPosition = [e.lnglat.getLng(), e.lnglat.getLat()];
      emit('shape-click', {
        shape,
        position: clickPosition,
        originalEvent: e
      });
    });
    
    shapeInstance.setMap(mapInstance.value);
    shapesInstances.value.set(shape.id, shapeInstance);
  }
};

// 移除图形
const removeShape = (shapeId: string) => {
  const shapeInstance = shapesInstances.value.get(shapeId);
  if (shapeInstance) {
    shapeInstance.setMap(null);
    shapesInstances.value.delete(shapeId);
  }
};

// 清除图形
const clearShapes = () => {
  shapesInstances.value.forEach(shape => {
    shape.setMap(null);
  });
  shapesInstances.value.clear();
};

// 获取所有图形
const getShapes = () => {
  const shapes: Shape[] = [];
  shapesInstances.value.forEach((instance, id) => {
    let type: ShapeType = 'polygon';
    let path: [number, number][] = [];
    let radius: number | undefined;
    
    if (instance instanceof window.AMap.Circle) {
      type = 'circle';
      const center = instance.getCenter();
      path = [[center.getLng(), center.getLat()]];
      radius = instance.getRadius();
    } else if (instance instanceof window.AMap.Polygon) {
      const polygonPath = instance.getPath();
      path = polygonPath.map((point: any) => [point.getLng(), point.getLat()]);
      // 检查是否为矩形
      if (path.length === 4) {
        type = 'rectangle';
      } else {
        type = 'polygon';
      }
    } else if (instance instanceof window.AMap.Polyline) {
      type = 'polyline';
      path = instance.getPath().map((point: any) => [point.getLng(), point.getLat()]);
    }
    
    // 获取样式信息
    const options = instance.getOptions ? instance.getOptions() : {};
    const style: ShapeStyle = {
      fillColor: options.fillColor,
      fillOpacity: options.fillOpacity,
      strokeColor: options.strokeColor,
      strokeWeight: options.strokeWeight,
      strokeOpacity: options.strokeOpacity,
      strokeStyle: options.strokeStyle
    };
    
    shapes.push({
      id,
      type,
      path,
      radius,
      style
    });
  });
  
  return shapes;
};

// 启用标记点聚合
const enableCluster = (options: ClusterOptions) => {
  if (!mapInstance.value || !window.AMap.MarkerClusterer) return;
  
  // 先禁用聚合
  disableCluster();
  
  // 过滤出允许聚合的标记点
  const clusterableMarkers = markersInstances.value.filter((markerInstance, index) => {
    return props.markers[index]?.clusterable !== false;
  });
  
  // 如果没有可聚合的标记点，或者没有启用聚合，则直接返回
  if (clusterableMarkers.length === 0 || !options.enable) return;
  
  // 创建聚合管理器
  clusterManager.value = new window.AMap.MarkerClusterer(
    mapInstance.value, 
    clusterableMarkers, 
    {
      gridSize: options.gridSize || 60,
      maxZoom: options.maxZoom || 18,
      minClusterSize: options.minClusterSize || 2,
      styles: options.styles ? options.styles.map(style => ({
        size: new window.AMap.Size(style.size || 36, style.size || 36),
        backgroundColor: style.backgroundColor || '#409EFF',
        textColor: style.textColor || '#fff',
        borderWidth: style.borderWidth || 0,
        borderColor: style.borderColor || '#fff'
      })) : undefined
    }
  );
  
  // 绑定聚合点击事件
  clusterManager.value.on('click', (event: any) => {
    const cluster = event.cluster;
    const markers = cluster.getMarkers();
    const position = cluster.getCenter();
    const count = markers.length;
    
    // 获取原始标记点数据
    const markerData = markers.map((marker: any) => {
      const index = markersInstances.value.findIndex(instance => instance === marker);
      return index >= 0 ? props.markers[index] : null;
    }).filter(Boolean);
    
    // 触发聚合点击事件
    emit('cluster-click', {
      position: [position.getLng(), position.getLat()],
      count,
      markers: markerData,
      originalEvent: event
    });
  });
};

// 禁用标记点聚合
const disableCluster = () => {
  if (clusterManager.value) {
    clusterManager.value.clearMarkers();
    clusterManager.value = null;
  }
};

// 添加标记点
const addMarkers = () => {
  if (!mapInstance.value) return;
  
  // 清除现有标记点
  clearMarkers();
  
  // 添加新标记点
  props.markers.forEach(marker => {
    const markerOptions = {
      position: marker.position,
      title: marker.title,
      icon: marker.icon ? new window.AMap.Icon({
        // 图标尺寸
        size: marker.size ? new window.AMap.Size(marker.size[0], marker.size[1]) : new window.AMap.Size(25, 25),
        // 图标的取图地址
        image: marker.icon,
        // 图标所用图片大小
        imageSize: marker.size ? new window.AMap.Size(marker.size[0], marker.size[1]) : new window.AMap.Size(25, 25)
      }) : undefined,
      label: marker.label ? {
        content: marker.label,
        direction: 'top'
      } : null
    };
    
    const markerInstance = new window.AMap.Marker(markerOptions);
    
    markerInstance.on('click', () => {
      emit('marker-click', marker);
    });
    
    markerInstance.setMap(mapInstance.value);
    markersInstances.value.push(markerInstance);
  });
  
  // 如果启用了聚合，重新应用聚合
  if (props.clusterOptions?.enable) {
    enableCluster(props.clusterOptions);
  }
};

// 清除标记点
const clearMarkers = () => {
  if (!mapInstance.value) return;
  
  // 先禁用聚合
  disableCluster();
  
  // 清除标记点
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

watch(() => props.shapes, () => {
  if (mapInstance.value) {
    addShapes();
  }
}, { deep: true });

watch(() => props.clusterOptions, (newOptions) => {
  if (mapInstance.value) {
    if (newOptions.enable) {
      enableCluster(newOptions);
    } else {
      disableCluster();
    }
  }
}, { deep: true });

// 暴露方法
defineExpose({
  mapInstance,
  setCenter,
  setZoom,
  addMarkers,
  clearMarkers,
  addShape,
  removeShape,
  clearShapes,
  getShapes,
  startDrawing,
  stopDrawing,
  startMeasure,
  stopMeasure,
  enableCluster,
  disableCluster
});

onMounted(() => {
  // 由父组件确保AMap已加载
  initMap();
});

onUnmounted(() => {
  // 清理地图实例
  if (mapInstance.value) {
    // 清理测距工具
    if (distanceTool.value) {
      distanceTool.value.turnOff();
      distanceTool.value = null;
    }
    
    // 清理聚合管理器
    disableCluster();
    
    // 清理绘图工具
    if (drawingManager.value) {
      drawingManager.value.close();
      drawingManager.value = null;
    }
    
    // 销毁地图实例
    mapInstance.value.destroy();
    mapInstance.value = null;
  }
});
</script>

<style scoped>
.amap-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

.sc-map-toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-group {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tool-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  background-color: #f5f5f5;
  transition: all 0.2s;
}

.tool-button:hover {
  background-color: #e0e0e0;
}

.tool-button.active {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.tool-icon {
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.circle-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'/%3E%3C/svg%3E");
}

.polygon-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M16.67 7.92L12 3.27 7.33 7.92 4 6.16v8.13l5.33 2.67 6.34-2.67 4.33-2.67V6.16z'/%3E%3C/svg%3E");
}

.rectangle-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z'/%3E%3C/svg%3E");
}

.polyline-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z'/%3E%3C/svg%3E");
}

.distance-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M20 20h-4v-4h4v4zM4 20V4h16v4H8v12H4z'/%3E%3C/svg%3E");
}

.stop-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E");
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

/* 工具栏位置样式 */
.sc-map-toolbar.position-left-top {
  top: 10px;
  left: 10px;
}

.sc-map-toolbar.position-right-top {
  top: 10px;
  right: 10px;
}

.sc-map-toolbar.position-left-bottom {
  bottom: 10px;
  left: 10px;
}

.sc-map-toolbar.position-right-bottom {
  bottom: 10px;
  right: 10px;
}

/* 折叠状态样式 */
.sc-map-toolbar.collapsed .tool-group {
  display: none;
}

.sc-map-toolbar.collapsed ::v-slotted([name="tools"]) {
  display: none;
}

/* 折叠/展开按钮样式 */
.toolbar-toggle {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.position-left-top .toolbar-toggle,
.position-left-bottom .toolbar-toggle {
  right: -24px;
  left: auto;
}

.position-right-top .toolbar-toggle,
.position-right-bottom .toolbar-toggle {
  left: -24px;
  right: auto;
}

.toolbar-toggle-icon {
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  transition: transform 0.3s;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'/%3E%3C/svg%3E");
}

.toolbar-toggle-icon.expanded {
  transform: rotate(180deg);
}
</style>