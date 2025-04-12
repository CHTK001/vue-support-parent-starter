<template>
  <div class="amap-container" :style="{ height: height, width: width }">
    <div class="map-container" ref="mapContainer"></div>
    
    <!-- 测距结果显示（将被删除，由父组件统一管理） -->
    
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
  // 工具栏位置（不再使用，由父组件统一管理）
  // toolsPosition: {
  //   type: String,
  //   default: 'right-top', // 'left-top', 'right-top', 'left-bottom', 'right-bottom'
  //   validator: (value) => ['left-top', 'right-top', 'left-bottom', 'right-bottom'].includes(value)
  // },
  // // 工具栏是否折叠（不再使用，由父组件统一管理）
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
  // 是否显示绘图工具控件（不再使用，由父组件统一管理）
  // drawingControl: {
  //   type: Boolean,
  //   default: false
  // },
  // 工具控制选项（不再使用，由父组件统一管理）
  // toolsOptions: {
  //   type: Object as () => ToolsOptions,
  //   default: () => ({
  //     circle: true,
  //     polygon: true,
  //     rectangle: true,
  //     polyline: true,
  //     distance: true
  //   })
  // },
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
  },
  // 是否显示鼠标位置（不再使用，由父组件统一管理）
  // showMousePosition: {
  //   type: Boolean,
  //   default: false
  // },
  // 鼠标位置（不再使用，由父组件统一管理）
  // mousePosition: {
  //   type: Array as () => [number, number],
  //   default: () => [0, 0]
  // }
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
  'distance-result',
  'marker-created'
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
// 这些变量不再需要，由父组件统一管理
// const isToolsCollapsed = ref(false);
// const showMousePosition = ref(true);
// const mousePosition = ref<[number, number]>([0, 0]);

// 初始化工具栏折叠状态 - 不再需要
// onMounted(() => {
//   isToolsCollapsed.value = props.toolsCollapsed;
// });

// 切换工具栏折叠状态 - 不再需要
// const toggleToolbar = () => {
//   isToolsCollapsed.value = !isToolsCollapsed.value;
// };

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
  initDrawingTools();
  
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
watch([() => props.zoomControl, () => props.scaleControl], () => {
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
  
  // 确保AMap.RangingTool插件已加载
  if (!window.AMap.RangingTool) {
    window.AMap.plugin(['AMap.RangingTool'], function() {
      setupDistanceTool();
    });
  } else {
    setupDistanceTool();
  }
};

// 设置测距工具
const setupDistanceTool = () => {
  if (!mapInstance.value) return;
  
  // 创建测距工具实例
  try {
    distanceTool.value = new window.AMap.RangingTool(mapInstance.value);
    
    // 监听测距完成事件
    distanceTool.value.on('end', (result: any) => {
      // 处理测距结果
      if (result && result.points) {
        const distance = result.distance;
        const path = result.points.map((point: any) => 
          [point.lng || point.getLng(), point.lat || point.getLat()]
        ) as [number, number][];
        
        // 保存测距结果
        distanceResult.value = {
          distance,
          path,
          originalEvent: result
        };
        
        // 如果之前有测距线，先移除
        if (distanceLine.value) {
          distanceLine.value.setMap(null);
          distanceLine.value = null;
        }
        
        // 保存线路 (可选，因为高德地图已经在地图上显示了测距线)
        distanceLine.value = new window.AMap.Polyline({
          path: result.points,
          strokeColor: '#409EFF',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          strokeStyle: 'solid',
          zIndex: 100
        });
        distanceLine.value.setMap(mapInstance.value);
        
        // 触发测距结果事件
        emit('distance-result', distanceResult.value);
      }
    });
  } catch (err) {
    console.error('初始化测距工具失败:', err);
  }
};

// 开始测距
const startMeasure = () => {
  if (!mapInstance.value) return;
  
  console.log('高德地图开始测距');
  
  // 先停止其他工具
  stopDrawing();
  disableAddMarker();
  
  // 如果测距工具不存在，先初始化
  if (!distanceTool.value) {
    console.log('初始化测距工具');
    initDistanceTool();
    // 延迟执行，确保测距工具初始化完成
    setTimeout(() => {
      if (distanceTool.value) {
        currentTool.value = 'distance';
        try {
          distanceTool.value.turnOn();
          console.log('延迟启动测距工具成功');
        } catch (err) {
          console.error('延迟启动测距工具失败:', err);
        }
      } else {
        console.error('测距工具初始化失败，无法启动');
      }
    }, 100);
    return;
  }
  
  // 记录当前工具
  currentTool.value = 'distance';
  
  // 开启测距工具
  try {
    distanceTool.value.turnOn();
    console.log('启动测距工具成功');
  } catch (err) {
    console.error('启动测距工具失败:', err);
    // 如果启动失败，尝试重新初始化
    distanceTool.value = null;
    console.log('重新初始化测距工具');
    initDistanceTool();
    setTimeout(() => {
      if (distanceTool.value) {
        try {
          distanceTool.value.turnOn();
          console.log('重新初始化后启动测距工具成功');
        } catch (e) {
          console.error('重新初始化后仍无法启动测距工具:', e);
        }
      } else {
        console.error('重新初始化测距工具失败');
      }
    }, 100);
  }
};

// 停止测距
const stopMeasure = () => {
  if (!distanceTool.value) {
    console.log('测距工具不存在，无需停止');
    return;
  }
  
  try {
    // 关闭测距工具
    distanceTool.value.turnOff();
    console.log('停止测距工具成功');
    
    // 重置当前工具
    if (currentTool.value === 'distance') {
      currentTool.value = '';
    }
    
    // 可选: 清除测距线
    if (distanceLine.value) {
      distanceLine.value.setMap(null);
      distanceLine.value = null;
    }
  } catch (err) {
    console.error('停止测距工具失败:', err);
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
const addMarkers = (markers?: Marker[]) => {
  if (!mapInstance.value) return;
  
  // 如果提供了标记点数组，则使用提供的数组，否则使用props
  const markersToAdd = markers || props.markers;
  
  // 如果是从props中初始化，则先清除现有标记点
  if (!markers) {
    clearMarkers();
  }
  
  // 添加新标记点
  markersToAdd.forEach(marker => {
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
    
    // 保存marker数据到实例上，方便后续查找
    (markerInstance as any).__markerData = marker;
    
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

/**
 * 设置标记点（先清空再添加）
 * @param markers 标记点数组
 */
const setMarkers = (markers: Marker[]) => {
  if (!mapInstance.value) return;
  
  // 先清空现有标记点
  clearMarkers();
  
  // 去重处理（在空地图上添加，主要是为了防止传入数组自身有重复ID的标记点）
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
    markersInstances.value[markerIndex].setMap(null);
    // 从标记点实例数组中移除
    markersInstances.value.splice(markerIndex, 1);
    
    // 如果启用了聚合，重新应用聚合
    if (props.clusterOptions?.enable) {
      enableCluster(props.clusterOptions);
    }
    
    return true;
  }
  
  return false;
};

// 绑定地图事件
const bindMapEvents = () => {
  if (!mapInstance.value) return;
  
  mapInstance.value.on('click', (e: any) => {
    emit('map-click', {
      position: [e.lnglat.lng, e.lnglat.lat],
      lat: e.lnglat.lat, // 为了兼容父组件的事件处理
      lng: e.lnglat.lng,
      originalEvent: e
    });
  });
  
  mapInstance.value.on('zoomend', () => {
    emit('zoom-changed', mapInstance.value.getZoom());
  });
  
  mapInstance.value.on('moveend', () => {
    const center = mapInstance.value.getCenter();
    emit('center-changed', [center.lng, center.lat]);
  });
  
  // 不再需要在这里处理鼠标位置，由父组件统一管理
  // mapInstance.value.on('mousemove', (e: any) => {
  //   if (showMousePosition.value) {
  //     mousePosition.value = [e.lnglat.lng, e.lnglat.lat];
  //   }
  // });
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

// 添加多边形
const addPolygon = (points: [number, number][], style?: ShapeStyle) => {
  if (!mapInstance.value) return;
  
  const id = `polygon_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const shape: Shape = {
    id,
    type: 'polygon',
    path: points,
    style
  };
  
  addShape(shape);
  return id;
};

// 添加圆形
const addCircle = (center: [number, number], radius: number, style?: ShapeStyle) => {
  if (!mapInstance.value) return;
  
  const id = `circle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const shape: Shape = {
    id,
    type: 'circle',
    path: [center],
    radius,
    style
  };
  
  addShape(shape);
  return id;
};

// 添加矩形
const addRectangle = (bounds: [[number, number], [number, number]], style?: ShapeStyle) => {
  if (!mapInstance.value) return;
  
  // 将西南-东北坐标转换为四个顶点坐标
  const [sw, ne] = bounds;
  const path: [number, number][] = [
    [sw[0], sw[1]], // 西南
    [ne[0], sw[1]], // 东南
    [ne[0], ne[1]], // 东北
    [sw[0], ne[1]], // 西北
    [sw[0], sw[1]]  // 闭合多边形
  ];
  
  const id = `rectangle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const shape: Shape = {
    id,
    type: 'rectangle',
    path,
    style
  };
  
  addShape(shape);
  return id;
};

// 添加折线
const addPolyline = (points: [number, number][], style?: ShapeStyle) => {
  if (!mapInstance.value) return;
  
  const id = `polyline_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const shape: Shape = {
    id,
    type: 'polyline',
    path: points,
    style
  };
  
  addShape(shape);
  return id;
};

// 轨迹动画相关方法
const startTrackAnimation = (points: [number, number][], options?: any, stepCallback?: (step: any) => void, completeCallback?: () => void) => {
  if (!mapInstance.value) return;
  
  console.log('开始轨迹动画播放', points.length);
  
  // 基本实现，实际项目中应该根据高德地图API实现更复杂的轨迹动画
  try {
    // 清除已有动画
    stopTrackAnimation();
    
    // 创建折线
    const path = points.map(point => new window.AMap.LngLat(point[0], point[1]));
    const polyline = new window.AMap.Polyline({
      path,
      strokeColor: options?.lineColor || '#AF5', 
      strokeWeight: options?.lineWidth || 6,
      strokeOpacity: options?.lineOpacity || 0.8
    });
    
    // 添加到地图
    polyline.setMap(mapInstance.value);
    
    // 创建marker作为动画对象
    const marker = new window.AMap.Marker({
      position: path[0],
      icon: options?.icon || '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
      offset: new window.AMap.Pixel(-13, -30)
    });
    
    marker.setMap(mapInstance.value);
    
    // 保存轨迹动画相关对象
    if (!window._amap_track_animation) {
      window._amap_track_animation = {
        polyline: null,
        marker: null,
        timer: null,
        passedPath: [],
        currentIndex: 0,
        paused: false,
        options
      };
    } else {
      window._amap_track_animation.polyline = polyline;
      window._amap_track_animation.marker = marker;
      window._amap_track_animation.passedPath = [path[0]];
      window._amap_track_animation.currentIndex = 0;
      window._amap_track_animation.paused = false;
      window._amap_track_animation.options = options;
    }
    
    // 开始动画循环
    const duration = options?.duration || 5000; // 默认5秒
    const steps = path.length;
    const interval = duration / steps;
    
    const animate = () => {
      const animation = window._amap_track_animation;
      if (!animation || animation.paused) return;
      
      // 如果动画结束，调用回调
      if (animation.currentIndex >= path.length - 1) {
        if (completeCallback) {
          completeCallback();
        }
        
        // 如果设置了循环，则重新开始
        if (options?.loopCount !== 1) {
          animation.currentIndex = 0;
          animation.passedPath = [path[0]];
          animation.marker.setPosition(path[0]);
        } else {
          return; // 停止动画
        }
      }
      
      // 移动到下一个点
      animation.currentIndex++;
      const currentPos = path[animation.currentIndex];
      animation.marker.setPosition(currentPos);
      
      // 更新已走过的路径
      animation.passedPath.push(currentPos);
      
      // 创建新的、当前走过的轨迹线
      if (animation.passedPolyline) {
        animation.passedPolyline.setMap(null);
      }
      
      animation.passedPolyline = new window.AMap.Polyline({
        path: animation.passedPath,
        strokeColor: '#FF8000',
        strokeWeight: options?.lineWidth || 6,
        strokeOpacity: options?.lineOpacity || 0.8
      });
      
      animation.passedPolyline.setMap(mapInstance.value);
      
      // 调用步骤回调
      if (stepCallback) {
        stepCallback({
          position: [currentPos.getLng(), currentPos.getLat()],
          index: animation.currentIndex,
          total: path.length
        });
      }
      
      // 继续下一步
      animation.timer = setTimeout(animate, interval);
    };
    
    // 开始动画
    window._amap_track_animation.timer = setTimeout(animate, interval);
    
    return { polyline, marker };
    
  } catch (error) {
    console.error('开始轨迹动画失败', error);
    return null;
  }
};

const stopTrackAnimation = () => {
  if (!window._amap_track_animation) return;
  
  console.log('停止轨迹动画');
  
  const animation = window._amap_track_animation;
  
  // 清除定时器
  if (animation.timer) {
    clearTimeout(animation.timer);
    animation.timer = null;
  }
  
  // 移除地图上的对象
  if (animation.polyline) {
    animation.polyline.setMap(null);
    animation.polyline = null;
  }
  
  if (animation.passedPolyline) {
    animation.passedPolyline.setMap(null);
    animation.passedPolyline = null;
  }
  
  if (animation.marker) {
    animation.marker.setMap(null);
    animation.marker = null;
  }
  
  // 重置状态
  animation.passedPath = [];
  animation.currentIndex = 0;
  animation.paused = false;
};

const pauseTrackAnimation = () => {
  if (!window._amap_track_animation) return;
  
  console.log('暂停轨迹动画');
  window._amap_track_animation.paused = true;
  
  if (window._amap_track_animation.timer) {
    clearTimeout(window._amap_track_animation.timer);
  }
};

const resumeTrackAnimation = () => {
  if (!window._amap_track_animation || !window._amap_track_animation.paused) return;
  
  console.log('恢复轨迹动画');
  window._amap_track_animation.paused = false;
  
  // 重新开始动画
  const animation = window._amap_track_animation;
  const options = animation.options;
  const path = animation.polyline.getPath();
  const duration = options?.duration || 5000;
  const steps = path.length;
  const interval = duration / steps;
  
  const animate = () => {
    if (!animation || animation.paused) return;
    
    // 如果动画结束，停止
    if (animation.currentIndex >= path.length - 1) {
      return;
    }
    
    // 移动到下一个点
    animation.currentIndex++;
    const currentPos = path[animation.currentIndex];
    animation.marker.setPosition(currentPos);
    
    // 更新已走过的路径
    animation.passedPath.push(currentPos);
    
    // 创建新的、当前走过的轨迹线
    if (animation.passedPolyline) {
      animation.passedPolyline.setMap(null);
    }
    
    animation.passedPolyline = new window.AMap.Polyline({
      path: animation.passedPath,
      strokeColor: '#FF8000',
      strokeWeight: options?.lineWidth || 6,
      strokeOpacity: options?.lineOpacity || 0.8
    });
    
    animation.passedPolyline.setMap(mapInstance.value);
    
    // 继续下一步
    animation.timer = setTimeout(animate, interval);
  };
  
  // 恢复动画
  animation.timer = setTimeout(animate, interval);
};

// 在现有方法之后添加鼠标移动支持
const addMouseMoveListener = (callback) => {
  if (!mapInstance.value) return;
  
  // 添加鼠标移动事件监听
  const mouseMoveHandler = (e) => {
    if (callback) {
      // 高德地图获取经纬度需要转换
      const lnglat = e.lnglat;
      callback({
        lat: lnglat.getLat(),
        lng: lnglat.getLng(),
        lnglat: [lnglat.getLat(), lnglat.getLng()]
      });
    }
  };
  
  // 存储事件句柄用于后续移除
  mouseMoveListenerRef.value = mouseMoveHandler;
  mapInstance.value.on('mousemove', mouseMoveHandler);
};

// 存储鼠标移动事件句柄的引用
const mouseMoveListenerRef = ref(null);

const removeMouseMoveListener = () => {
  if (!mapInstance.value || !mouseMoveListenerRef.value) return;
  
  // 移除鼠标移动事件监听
  mapInstance.value.off('mousemove', mouseMoveListenerRef.value);
  mouseMoveListenerRef.value = null;
};

// 启用添加标记模式
const enableAddMarker = () => {
  if (!mapInstance.value) return;
  
  // 禁用其他工具
  stopDrawing();
  stopMeasure();
  
  // 设置鼠标样式为十字形
  mapInstance.value.setDefaultCursor('crosshair');
  
  // 绑定地图点击事件
  mapInstance.value.on('click', handleMapClickForMarker);
};

// 禁用添加标记模式
const disableAddMarker = () => {
  if (!mapInstance.value) return;
  
  // 恢复鼠标样式
  mapInstance.value.setDefaultCursor('');
  
  // 解绑地图点击事件
  mapInstance.value.off('click', handleMapClickForMarker);
};

// 处理地图点击添加标记
const handleMapClickForMarker = (e: any) => {
  // 获取点击位置
  const lnglat = e.lnglat;
  const lat = lnglat.getLat();
  const lng = lnglat.getLng();
  
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
  drawingManager,
  distanceTool,
  distanceResult,
  distanceLine,
  shapesInstances,
  markersInstances,
  clusterManager,
  setCenter,
  setZoom,
  addMarkers,
  enableCluster,
  disableCluster,
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

/* 移除工具栏相关样式，由父组件统一管理 */
</style>