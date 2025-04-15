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
    _amap_track_animation?: {
      polyline?: any;
      marker?: any;
      timer?: any;
      passedPath?: any[];
      currentIndex?: number;
      paused?: boolean;
      options?: any;
      passedPolyline?: any;
    };
  }
}

const props = withDefaults(defineProps<{
  apiKey: string;
  center: [number, number];
  zoom: number;
  markers: Marker[];
  height: string;
  width: string;
  draggable: boolean;
  scrollWheel: boolean;
  zoomControl: boolean;
  scaleControl: boolean;
  mapStyle: string;
  viewType: MapViewType;
  initialShapes: Shape[];
  enableCluster: boolean;
  clusterOptions: ClusterOptions;
  showMarkerLabels?: boolean;
}>(), {
  center: () => [116.397428, 39.90923],
  zoom: 12,
  markers: () => [],
  height: '500px',
  width: '100%',
  draggable: true,
  scrollWheel: true,
  zoomControl: true,
  scaleControl: true,
  mapStyle: '',
  viewType: 'normal',
  initialShapes: () => [],
  enableCluster: false,
  clusterOptions: () => ({ enable: false }),
  showMarkerLabels: true
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
  'marker-created',
  'marker-mouseenter',
  'marker-mouseleave'
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
const addMarkerEnabled = ref<boolean>(false);

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
    buildingAnimation: true,
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

  // 初始化插件
  initPlugin();
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


const initPlugin = () => {
  window.AMap.plugin(['AMap.MarkerClusterer'], function () {
    console.log('MarkerClusterer插件加载成功');
  });

  window.AMap.plugin(['AMap.PlaceSearch'], function () {
    console.log('PlaceSearch插件加载成功');
  });

  window.AMap.plugin(['AMap.MouseTool'], function () {
    console.log('MouseTool插件加载成功');
  });


  window.AMap.plugin(['AMap.Scale'], function () {
    console.log('Scale插件加载成功');
  });


  window.AMap.plugin(['AMap.RangingTool'], function () {
    console.log('RangingTool插件加载成功');
  });

  window.AMap.plugin(['AMap.ToolBar'], function () {
    console.log('ToolBar插件加载成功');
  });
}

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
    mapInstance.value.setStatus({ dragEnable: true });
  } else {
    mapInstance.value.setStatus({ dragEnable: false });
  }

  // 更新滚轮缩放能力
  if (props.scrollWheel) {
    mapInstance.value.setStatus({ zoomEnable: true });
  } else {
    mapInstance.value.setStatus({ zoomEnable: false });
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

    // 添加调试日志，确保shape对象包含完整的path
    console.log('绘制完成，生成shape对象:', {
      id: shape.id,
      type: shape.type,
      pathLength: shape.path ? shape.path.length : 0,
      hasPath: !!shape.path,
      radius: shape.radius
    });

    // 确保矩形有正确的path值
    if (shape.type === 'rectangle' && (!shape.path || shape.path.length === 0)) {
      console.error('矩形绘制错误：path值缺失');
    }

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

  console.log('开始转换绘制对象为Shape格式，对象类型:', obj.CLASS_NAME || typeof obj);

  if (obj instanceof window.AMap.Circle) {
    type = 'circle';
    const center = obj.getCenter();
    path = [[center.getLng(), center.getLat()]];
    radius = obj.getRadius();
  } else if (obj instanceof window.AMap.Polygon) {
    // 先获取原始路径点数组
    const rawPath = obj.getPath().map((point: any) => [point.getLng(), point.getLat()]);
    console.log('原始路径点数组:', JSON.stringify(rawPath), '长度:', rawPath.length);

    // 检查是否是矩形
    if (rawPath.length === 4 || rawPath.length === 5) { // 5个点时最后一个点是闭合点
      type = 'rectangle';

      // 计算矩形的四个角（确保顺序为：西南、东南、东北、西北）
      // 首先获取所有点的最大最小经纬度，构建包围盒
      const lngs = rawPath.map(p => p[0]);
      const lats = rawPath.map(p => p[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      console.log('矩形坐标计算:', { minLng, maxLng, minLat, maxLat });

      // 构建标准顺序的矩形角点，并明确类型断言
      const rectanglePath: [number, number][] = [
        [minLng, minLat], // 西南角
        [maxLng, minLat], // 东南角
        [maxLng, maxLat], // 东北角
        [minLng, maxLat], // 西北角
        [minLng, minLat]  // 闭合回西南角
      ];

      // 确保path被正确赋值
      path = rectanglePath;

      // 添加详细调试日志
      console.log('矩形绘制完成，生成的path:', JSON.stringify(path), '长度:', path.length);
    } else {
      type = 'polygon';
      path = rawPath as [number, number][];
    }
  } else if (obj instanceof window.AMap.Polyline) {
    type = 'polyline';
    path = obj.getPath().map((point: any) => [point.getLng(), point.getLat()]) as [number, number][];
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

  // 确保path是正确的类型
  const typedPath = path as [number, number][];

  // 添加详细调试日志
  console.log(`创建${type}图形，ID: ${id}，path长度: ${typedPath.length}`);
  if (type === 'rectangle') {
    console.log('矩形path详情:', JSON.stringify(typedPath));
    // 验证path数据是否完整
    if (!typedPath || typedPath.length < 4) {
      console.error('警告：矩形path数据不完整，长度应为4或5，实际为:', typedPath.length);
    }
  }

  // 确保path数据正确
  const finalPath = typedPath.length > 0 ? typedPath : path;

  const shape: Shape = {
    id,
    type,
    path: finalPath,
    radius,
    style
  };

  // 最终验证shape对象
  console.log(`最终shape对象 - 类型: ${shape.type}, ID: ${shape.id}, path长度: ${shape.path.length}`);
  if (shape.type === 'rectangle' && (!shape.path || shape.path.length < 4)) {
    console.error('错误：最终矩形shape对象的path数据不完整');
  }

  // 保存形状实例
  shapesInstances.value.set(id, obj);

  return shape;
};

// 初始化测距工具
const initDistanceTool = () => {
  if (!mapInstance.value) return;

  console.log('初始化高德地图测距工具开始');

  // 确保插件已加载
  if (window.AMap && window.AMap.RangingTool) {
    setupDistanceTool();
  } else {
    // 加载插件
    try {
      console.log('加载RangingTool插件');
      window.AMap.plugin(['AMap.RangingTool'], function () {
        console.log('RangingTool插件加载成功');
        setupDistanceTool();
      });
    } catch (err) {
      console.error('加载RangingTool插件失败:', err);
    }
  }
};

// 设置测距工具
const setupDistanceTool = () => {
  if (!mapInstance.value) return;

  console.log('设置测距工具');

  // 创建测距工具实例
  try {
    // 确保RangingTool存在
    if (!window.AMap.RangingTool) {
      console.error('RangingTool插件不存在');
      return;
    }

    distanceTool.value = new window.AMap.RangingTool(mapInstance.value);
    console.log('创建测距工具实例成功');

    // 监听测距完成事件
    distanceTool.value.on('end', (result: any) => {
      console.log('测距结果:', result);
      // 处理测距结果
      if (result && result.points) {
        const distance = result.distance;
        const path = result.points.map((point: any) =>
          [point.lng || point.getLng(), point.lat || point.getLat()]
        ) as [number, number][];

        console.log('测距距离:', distance, '路径点数:', path.length);

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

    console.log('测距工具设置完成');
  } catch (err) {
    console.error('初始化测距工具失败:', err);
  }
};

// 开始测距
const startMeasure = () => {
  if (!mapInstance.value) return;

  console.log('高德地图开始测距');

  // 先停止之前的测距并清除数据
  stopMeasure();

  // 先停止其他工具
  stopDrawing();
  disableAddMarker();

  // 记录当前工具
  currentTool.value = 'distance';

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

  // 开启测距工具
  try {
    distanceTool.value.turnOn();
    console.log('启动测距工具成功');
  } catch (err) {
    console.error('启动测距工具失败:', err);
  }
};

// 停止测距
const stopMeasure = () => {
  if (!mapInstance.value) return;

  console.log('高德地图停止测距');

  // 记录当前工具
  currentTool.value = '';

  // 关闭测距工具
  if (distanceTool.value) {
    try {
      distanceTool.value.turnOff();

      // 尝试使用高德地图的方法获取并清除测距标记
      // 有些版本的 RangingTool 可能有额外的清除方法
      if (typeof distanceTool.value.clear === 'function') {
        distanceTool.value.clear();
      }

      // 部分版本可能有 _lineMarkers 属性存储测距相关标记
      if (distanceTool.value._lineMarkers && Array.isArray(distanceTool.value._lineMarkers)) {
        distanceTool.value._lineMarkers.forEach((marker: any) => {
          if (marker && typeof marker.setMap === 'function') {
            marker.setMap(null);
          }
        });
      }

      // 部分版本可能有 _circles 属性存储测距点圆形标记
      if (distanceTool.value._circles && Array.isArray(distanceTool.value._circles)) {
        distanceTool.value._circles.forEach((circle: any) => {
          if (circle && typeof circle.setMap === 'function') {
            circle.setMap(null);
          }
        });
      }

      // 部分版本可能将测距线存储在 _polyline 属性中
      if (distanceTool.value._polyline && typeof distanceTool.value._polyline.setMap === 'function') {
        distanceTool.value._polyline.setMap(null);
      }

    } catch (err) {
      console.error('停止测距工具失败:', err);
    }
  }

  // 清除我们自己存储的测距线
  if (distanceLine.value) {
    distanceLine.value.setMap(null);
    distanceLine.value = null;
  }

  // 尝试查找并清除地图上所有可能的测距相关覆盖物
  try {
    if (mapInstance.value && mapInstance.value.getAllOverlays) {
      // 获取所有覆盖物
      const allOverlays = mapInstance.value.getAllOverlays();

      // 查找并移除所有与测距相关的覆盖物（通常具有特定的属性或类名）
      if (Array.isArray(allOverlays)) {
        // 过滤出可能是测距工具创建的覆盖物
        const distanceOverlays = allOverlays.filter(overlay => {
          // 测距工具的覆盖物通常有特定的样式或属性
          // 测距线通常是红色或者蓝色的聚合线
          const isDistanceLine =
            (overlay instanceof window.AMap.Polyline &&
              (overlay.getOptions().strokeColor === '#f44336' ||
                overlay.getOptions().strokeColor === '#409EFF' ||
                overlay.getOptions().isRangingTool));

          // 测距点标记通常带有特定的类名或标签
          const isDistanceMarker =
            (overlay instanceof window.AMap.Marker &&
              (overlay.getOptions().isRangingTool ||
                (overlay.getOptions().label &&
                  typeof overlay.getOptions().label.content === 'string' &&
                  overlay.getOptions().label.content.includes('米'))));

          // 测距工具有时也会创建圆形标记
          const isDistanceCircle =
            (overlay instanceof window.AMap.Circle &&
              overlay.getOptions().isRangingTool);

          return isDistanceLine || isDistanceMarker || isDistanceCircle;
        });

        // 移除所有识别出的测距覆盖物
        distanceOverlays.forEach(overlay => {
          if (overlay && typeof overlay.setMap === 'function') {
            overlay.setMap(null);
          }
        });

        console.log(`已清除 ${distanceOverlays.length} 个可能的测距覆盖物`);
      }
    }
  } catch (err) {
    console.error('尝试清除所有测距覆盖物时出错:', err);
  }

  // 清除测距结果
  distanceResult.value = null;
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

  props.initialShapes.forEach(shape => {
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
      const rawPath = polygonPath.map((point: any) => [point.getLng(), point.getLat()]);

      // 检查是否为矩形
      if (rawPath.length === 4 || rawPath.length === 5) {
        type = 'rectangle';

        // 计算矩形的四个角（确保顺序为：西南、东南、东北、西北）
        const lngs = rawPath.map(p => p[0]);
        const lats = rawPath.map(p => p[1]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        // 构建标准顺序的矩形角点
        path = [
          [minLng, minLat], // 西南角
          [maxLng, minLat], // 东南角
          [maxLng, maxLat], // 东北角
          [minLng, maxLat], // 西北角
          [minLng, minLat]  // 闭合回西南角
        ];
      } else {
        type = 'polygon';
        path = rawPath;
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

// 启用标记点聚合 - 根据高德地图API实现带权重的聚合功能
const enableCluster = (options: ClusterOptions) => {
  if (!mapInstance.value) return;

  // 先禁用聚合
  disableCluster();

  // 检查是否加载了高德地图的MarkerClusterer
  if (!window.AMap.MarkerClusterer) {
    console.error('高德地图MarkerClusterer类未加载，聚合功能不可用');
    return;
  }

  // 过滤出允许聚合的标记点 - 通过clusterable属性控制
  // clusterable: true - 参与聚合 (默认)
  // clusterable: false - 不参与聚合，保持独立显示
  const clusterableMarkers = markersInstances.value.filter((markerInstance, index) => {
    const markerData = (markerInstance as any).__markerData;
    return markerData?.clusterable !== false;
  });

  // 找出不参与聚合的标记点，这些标记点应该保持显示
  const nonClusterableMarkers = markersInstances.value.filter((markerInstance, index) => {
    const markerData = (markerInstance as any).__markerData;
    return markerData?.clusterable === false;
  });

  // 如果没有可聚合的标记点，或者没有启用聚合，则直接返回
  if (clusterableMarkers.length === 0 || !options.enable) {
    console.log('聚合条件不满足，跳过聚合', clusterableMarkers.length, options.enable);
    return;
  }

  console.log('启用高德地图带权重聚合功能', options, '可聚合点数量:', clusterableMarkers.length, '不可聚合点数量:', nonClusterableMarkers.length);

  try {
    // 在启用聚合前，仅隐藏参与聚合的原始标记点，不参与聚合的点保持显示
    clusterableMarkers.forEach(marker => {
      marker.setMap(null);
    });

    // 确保不参与聚合的标记点保持显示
    nonClusterableMarkers.forEach(marker => {
      // 确保非聚合点在地图上显示
      if (marker && typeof marker.setMap === 'function' && !marker.getMap()) {
        marker.setMap(mapInstance.value);
      }
    });

    // 将Marker转换为适合聚合的点数据格式
    // 高德地图的MarkerClusterer支持两种方式:
    // 1. 直接传入Marker实例数组
    // 2. 传入格式为 {lnglat: [lng, lat], weight: number, ...其他属性} 的对象数组

    let pointsData;

    if (options.useWeight != false) {
      // 使用带权重的数据格式
      pointsData = clusterableMarkers.map(marker => {
        const markerData = (marker as any).__markerData;
        const position = marker.getPosition();
        return {
          lnglat: [position.getLng(), position.getLat()],
          weight: markerData?.weight || 1,
          name: markerData?.title || '',
          extData: markerData, // 保存原始数据用于事件处理
          clusterable: true    // 显式标记为可聚合，用于区分
        };
      });
    } else {
      // 使用原始Marker实例，但不直接在地图上显示这些实例
      // 而是让聚合管理器管理它们的显示
      pointsData = clusterableMarkers;
    }

    // 准备聚合配置
    const clusterConfig: any = {
      gridSize: options.gridSize || 60,
      maxZoom: options.maxZoom || 18,
      minClusterSize: options.minClusterSize || 2,
      renderMarker: function (context: any) {
        // 注意：这里处理单个聚合点的样式
        // 对于单个聚合点，我们应该使用原始标记点的样式
        if (context && context.marker && context.data && context.data.length == 1) {
          // 获取标记数据
          const markerData = context.data[0].extData;
          if (markerData) {
            try {
              // 使用原始标记点样式
              if (markerData.icon) {
                // 如果原始标记有自定义图标
                if (typeof markerData.icon === 'string') {
                  if (markerData.icon.trim().startsWith('<svg')) {
                    // SVG图标
                    const svgContent = document.createElement('div');
                    svgContent.innerHTML = markerData.icon;
                    svgContent.style.width = (markerData.size?.[0] || 25) + 'px';
                    svgContent.style.height = (markerData.size?.[1] || 25) + 'px';
                    context.marker.setContent(svgContent);
                  } else {
                    // 图片URL图标
                    const icon = new window.AMap.Icon({
                      size: new window.AMap.Size(markerData.size?.[0] || 25, markerData.size?.[1] || 25),
                      image: markerData.icon,
                      imageSize: new window.AMap.Size(markerData.size?.[0] || 25, markerData.size?.[1] || 25)
                    });
                    context.marker.setIcon(icon);
                  }
                }
                // 清除可能的默认内容设置
                if (!markerData.icon.trim().startsWith('<svg')) {
                  context.marker.setContent(null);
                }
                return; // 设置完图标后直接返回，不应用默认样式
              }
            } catch (error) {
              console.error('设置单个聚合点样式时出错:', error);
            }
          }

          // 如果无法应用原始样式或没有自定义图标，使用默认样式
          var content = '<div style="background-color: rgba(255,255,178,.9); height: 18px; width: 18px; border: 1px solid rgba(255,255,178,1); border-radius: 12px; box-shadow: rgba(0, 0, 0, 1) 0px 0px 3px;"></div>';
          var offset = new window.AMap.Pixel(-9, -9);
          context.marker.setContent(content);
          context.marker.setOffset(offset);
        }
      },
      // 定义聚合点样式
      renderClusterMarker: function (context: any) {
        const count = context.count; // 聚合内点的总数
        let weight = 0; // 权重总和
        let maxWeight = 0; // 最大权重

        // 计算权重
        if (options.useWeight != false) {
          // 获取聚合内所有点数据
          const markers = context.markers;
          // 计算总权重和最大权重
          markers?.forEach((marker: any) => {
            // 对于点数据格式，直接获取weight属性
            const markerWeight = marker.weight || 1;
            weight += markerWeight;
            maxWeight = Math.max(maxWeight, markerWeight);
          });
        } else {
          // 不使用权重，使用标记点数量
          weight = count;
          maxWeight = count;
        }

        // 确定使用哪个值作为权重
        const finalWeight = options.weightAlgorithm === 'max' ? maxWeight : weight;

        // 根据权重选择聚合样式
        let style = {
          size: 36,
          backgroundColor: '#1890FF',
          textColor: '#FFFFFF',
          borderWidth: 0,
          borderColor: '#FFFFFF'
        };

        // 如果用户提供了样式，根据权重或数量选择合适的样式
        if (options.styles && options.styles.length > 0) {
          let styleIndex = 0;

          if (options.useWeight != false) {
            // 根据权重选择样式
            for (let i = 0; i < options.styles.length; i++) {
              const currentStyle = options.styles[i];
              const minWeight = currentStyle.minWeight ?? 0;
              const maxWeight = currentStyle.maxWeight ?? Infinity;

              if (finalWeight >= minWeight && finalWeight < maxWeight) {
                styleIndex = i;
                break;
              }
            }
          } else {
            // 根据数量选择样式（传统方式）
            if (count < 10) styleIndex = 0;
            else if (count < 100) styleIndex = Math.min(1, options.styles.length - 1);
            else if (count < 1000) styleIndex = Math.min(2, options.styles.length - 1);
            else styleIndex = Math.min(3, options.styles.length - 1);
          }

          const selectedStyle = options.styles[styleIndex];

          if (selectedStyle) {
            style = {
              size: selectedStyle.size || style.size,
              backgroundColor: selectedStyle.backgroundColor || style.backgroundColor,
              textColor: selectedStyle.textColor || style.textColor,
              borderWidth: selectedStyle.borderWidth || style.borderWidth,
              borderColor: selectedStyle.borderColor || style.borderColor
            };
          }
        }

        // 创建自定义聚合点样式
        const div = document.createElement('div');
        div.style.width = style.size + 'px';
        div.style.height = style.size + 'px';
        div.style.lineHeight = style.size + 'px';
        div.style.backgroundColor = style.backgroundColor;
        div.style.color = style.textColor;
        div.style.borderRadius = '50%';
        div.style.textAlign = 'center';
        div.style.fontSize = '14px';
        div.style.fontWeight = 'bold';
        div.style.border = style.borderWidth + 'px solid ' + style.borderColor;
        div.style.display = 'flex';
        div.style.justifyContent = 'center';
        div.style.alignItems = 'center';
        div.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';

        // 显示聚合数字（根据配置决定显示权重总和还是点数量）
        if (options.useWeight != false && options.showWeightSum) {
          div.innerHTML = Math.round(weight).toString(); // 显示总权重
        } else {
          div.innerHTML = count.toString(); // 显示点数量
        }

        context.marker.setContent(div);
      }
    };

    // 创建聚合管理器
    clusterManager.value = new window.AMap.MarkerClusterer(
      mapInstance.value,
      options.useWeight != false ? pointsData : clusterableMarkers,
      clusterConfig
    );

    // 绑定聚合点击事件
    clusterManager.value.on('click', (event: any) => {
      try {
        const cluster = event.cluster;
        const markers = event.clusterData;
        const position = event.lnglat;
        const count = markers.length;

        // 计算聚合点中标记点的总权重
        let totalWeight = 0;
        markers.forEach((marker: any) => {
          // 根据marker数据格式获取权重
          if (marker.weight) {
            totalWeight += marker.weight;
          } else if (marker.extData && marker.extData.weight) {
            totalWeight += marker.extData.weight;
          } else {
            totalWeight += 1; // 默认权重为1
          }
        });

        // 触发聚合点击事件
        emit('cluster-click', {
          position: [position.lng, position.lat],
          count,
          markers: markers.map((marker: any) => {
            return {
              position: [marker.lnglat.lng, marker.lnglat.lat],
              title: marker.name,
              weight: marker.weight,
              data: marker.extData
            }
          }),
          originalEvent: event,
          totalWeight: options.useWeight ? totalWeight : undefined
        });
      } catch (error) {
        console.error('处理聚合点击事件时出错', error);
      }
    });

    // 绑定聚合鼠标悬停事件
    clusterManager.value.on('mouseover', (event: any) => {
      try {
        const cluster = event.cluster;
        const markers = event.clusterData;
        const position = event.lnglat;
        const count = markers.length;

        // 创建聚合点数据对象
        const clusterData = {
          isCluster: true,
          count: count,
          position: [position.lng, position.lat],
          title: `包含 ${count} 个标记`,
          markers: markers.map((marker: any) => {
            return {
              position: [marker.lnglat ? [marker.lnglat.lng, marker.lnglat.lat] : marker.getPosition ? [marker.getPosition().lng, marker.getPosition().lat] : [0, 0]],
              title: marker.name || (marker.getTitle ? marker.getTitle() : ''),
              weight: marker.weight || 1,
              data: marker.extData || (marker.__markerData ? marker.__markerData : {})
            }
          })
        };

        // 触发鼠标进入事件
        emit('marker-mouseenter', clusterData);
      } catch (error) {
        console.error('处理聚合鼠标悬停事件时出错', error);
      }
    });

    // 绑定聚合鼠标离开事件
    clusterManager.value.on('mouseout', (event: any) => {
      try {
        const cluster = event.cluster;
        const markers = event.clusterData;
        const position = event.lnglat;
        const count = markers.length;

        // 创建聚合点数据对象
        const clusterData = {
          isCluster: true,
          count: count,
          position: [position.lng, position.lat],
          title: `包含 ${count} 个标记`
        };

        // 触发鼠标离开事件
        emit('marker-mouseleave', clusterData);
      } catch (error) {
        console.error('处理聚合鼠标离开事件时出错', error);
      }
    });

    console.log('高德地图聚合功能已启用', options.useWeight ? pointsData.length : clusterableMarkers.length, '个标记点');
  } catch (error) {
    console.error('启用高德地图聚合功能失败', error);
    // 出错时确保所有原始标记点可见
    markersInstances.value.forEach(marker => {
      try {
        if (marker && typeof marker.setMap === 'function' && !marker.getMap()) {
          marker.setMap(mapInstance.value);
        }
      } catch (e) {
        console.error('恢复标记点失败', e);
      }
    });
  }
};

// 重新实现禁用标记点聚合方法，不再依赖特定API
const disableCluster = () => {
  if (clusterManager.value) {
    try {
      console.log('禁用高德地图标记点聚合 - 使用直接处理方式');

      // 收集所有需要重新添加到地图的标记点
      const markersToRestore: any[] = [];

      // 尝试从聚合管理器中获取原始标记点
      try {
        // 1. 尝试通过_originMarkers属性获取
        if (clusterManager.value._originMarkers && Array.isArray(clusterManager.value._originMarkers)) {
          markersToRestore.push(...clusterManager.value._originMarkers);
        }
        // 2. 尝试通过getMarkers方法获取
        else if (typeof clusterManager.value.getMarkers === 'function') {
          const markers = clusterManager.value.getMarkers();
          if (Array.isArray(markers)) {
            markersToRestore.push(...markers);
          }
        }
        // 3. 如果以上都失败，使用我们自己保存的标记点实例
        else {
          markersToRestore.push(...markersInstances.value);
        }
      } catch (err) {
        console.warn('无法获取聚合标记点，使用默认标记点数组', err);
        markersToRestore.push(...markersInstances.value);
      }

      // 尝试移除聚合管理器
      try {
        // 1. 尝试调用clear方法
        if (typeof clusterManager.value.clear === 'function') {
          clusterManager.value.clear();
        }

        // 2. 通过setMap(null)来移除
        if (typeof clusterManager.value.setMap === 'function') {
          clusterManager.value.setMap(null);
        }

        // 3. 清除所有聚合点 - 遍历_clusters或_clusterMarkers属性
        const clusters = clusterManager.value._clusters ||
          clusterManager.value._clusterMarkers ||
          [];

        if (Array.isArray(clusters)) {
          clusters.forEach((cluster: any) => {
            // 聚合点可能是直接的Marker对象或者包含marker属性的对象
            const marker = cluster.marker || cluster;
            if (marker && typeof marker.setMap === 'function') {
              marker.setMap(null);
            }
          });
        }
      } catch (err) {
        console.warn('移除聚合管理器失败，尝试备选方法', err);
      }

      // 将所有原始标记点重新添加到地图上
      // 避免重复添加已经在地图上的点
      const existingMarkers = new Set();

      markersToRestore.forEach(marker => {
        try {
          // 如果是标准Marker实例
          if (marker && typeof marker.setMap === 'function') {
            const markerId = marker.markerId || (marker.__markerData && marker.__markerData.markerId);
            if (!existingMarkers.has(markerId)) {
              marker.setMap(mapInstance.value);
              if (markerId) existingMarkers.add(markerId);
            }
          }
          // 如果是点数据格式，需要查找对应的原始标记点
          else if (marker && marker.extData) {
            const markerId = marker.extData.markerId;
            const originalMarker = markersInstances.value.find(m => {
              const mData = (m as any).__markerData;
              return mData && mData.markerId === markerId;
            });

            if (originalMarker && !existingMarkers.has(markerId)) {
              originalMarker.setMap(mapInstance.value);
              if (markerId) existingMarkers.add(markerId);
            }
          }
        } catch (err) {
          console.warn('恢复标记点失败', err);
        }
      });

      // 清除引用
      clusterManager.value = null;
      console.log('聚合功能已禁用，已恢复', existingMarkers.size, '个标记点');
    } catch (error) {
      console.error('禁用聚合失败:', error);

      // 确保clusterManager被清空
      clusterManager.value = null;

      // 出错时确保所有标记点可见
      markersInstances.value.forEach(marker => {
        try {
          if (marker && typeof marker.setMap === 'function' && !marker.getMap()) {
            marker.setMap(mapInstance.value);
          }
        } catch (e) {
          console.error('恢复标记点失败', e);
        }
      });
    }
  }
};

/**
 * 添加标记点
 * @param markers 标记点数组
 */
const addMarkers = (markers?: Marker[]) => {
  if (!mapInstance.value) return;

  // 如果提供了标记点数组，则使用提供的数组，否则使用props
  const markersToAdd = markers || props.markers;

  // 如果是从props中初始化，则先清除现有标记点
  if (!markers) {
    clearMarkers();
  }

  markersToAdd.forEach(marker => {
    let markerOptions: any = {
      position: new window.AMap.LngLat(marker.position[0], marker.position[1]),
      title: marker.title || '',
      clickable: true,
      size: marker.size || [25, 25],
      markerId: marker.markerId,
      draggable: !!marker.draggable
    };

    // 显式禁用标签，由后续的toggleMarkerLabels控制
    markerOptions.label = null;

    // 处理图标
    if (marker.icon) {
      // 检查icon是否为SVG内容（以<svg开头的字符串）
      if (typeof marker.icon === 'string' && marker.icon.trim().startsWith('<svg')) {
        // 创建自定义内容
        const svgContent = document.createElement('div');
        svgContent.innerHTML = marker.icon;
        svgContent.style.width = (marker?.size?.[0] || 25) + 'px';
        svgContent.style.height = (marker?.size?.[0] || 25) + 'px';

        // 使用自定义内容创建标记
        markerOptions.content = svgContent;
      } else {
        // 使用普通图片URL
        markerOptions.icon = new window.AMap.Icon({
          size: new window.AMap.Size(marker?.size?.[0] || 25, marker?.size?.[1] || 25),
          image: marker.icon,
          markerId: marker.markerId,
          imageSize: new window.AMap.Size(marker?.size?.[0] || 25, marker?.size?.[1] || 25)
        });
      }
    }

    // 创建标记点
    const markerInstance = new window.AMap.Marker(markerOptions);

    // 为标记点DOM元素添加data-marker-id属性
    setTimeout(() => {
      try {
        const markerId = marker.markerId || marker.data?.id || '';
        const element = markerInstance.getElement ? markerInstance.getElement() :
          markerInstance.getContent ? markerInstance.getContent() : null;
        if (element && markerId) {
          element.setAttribute('data-marker-id', String(markerId));
          // 添加更多属性以便于识别和定位
          element.setAttribute('data-map-type', 'amap');
          if (marker.title) {
            element.setAttribute('data-marker-title', marker.title);
          }
          // 添加类名以便于CSS选择器识别
          element.classList.add('sc-map-marker');
        }
      } catch (error) {
        console.warn('为标记点DOM元素添加data-marker-id属性失败:', error);
      }
    }, 100); // 延迟添加，确保DOM元素已创建

    // 绑定点击事件
    markerInstance.on('click', (e: any) => {
      // 添加标记点的简单动画效果
      try {
        // 获取标记DOM元素
        const markerElement = markerInstance.getElement ?
          markerInstance.getElement() :
          markerInstance.getContent ? markerInstance.getContent() : null;

        if (markerElement && markerElement instanceof HTMLElement) {
          // 添加点击波纹效果
          addClickRippleEffect(markerElement);
        }
      } catch (error) {
        console.warn('添加标记点动画效果失败:', error);
      }

      // 确保传递完整的事件对象，包含原始鼠标事件，这对于正确计算弹窗位置非常重要
      emit('marker-click', marker, {
        clientX: e.originalEvent?.clientX,
        clientY: e.originalEvent?.clientY,
        target: e.target,
        originalEvent: e.originalEvent,
        // 传递标记DOM元素，便于父组件直接使用
        markerElement: markerInstance.getElement ? markerInstance.getElement() : markerInstance.getContent ? markerInstance.getContent() : null
      });
    });

    // 添加鼠标悬停事件
    markerInstance.on('mouseover', (e: any) => {
      emit('marker-mouseenter', marker, e.originalEvent);
    });

    // 添加鼠标离开事件
    markerInstance.on('mouseout', (e: any) => {
      emit('marker-mouseleave', marker, e.originalEvent);
    });

    // 保存marker数据到实例上，方便后续查找
    // clusterable属性用于控制标记点是否参与聚合，默认为true
    (markerInstance as any).__markerData = {
      ...marker,
      // 如果marker没有显式设置clusterable，则默认为true
      clusterable: marker.clusterable !== false
    };

    // 添加到地图
    markerInstance.setMap(mapInstance.value);
    markersInstances.value.push(markerInstance);
  });

  // 所有标记添加完成后，根据showMarkerLabels统一控制标签显示
  if (props.showMarkerLabels) {
    // 延迟调用确保所有标记已完全加载到地图上
    setTimeout(() => {
      toggleMarkerLabels(true);
    }, 50);
  }

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
    const markerId = marker.markerId || marker.data?.id;

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
      (markerData.markerId === markerId || markerData.id === markerId ||
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

watch(() => props.initialShapes, () => {
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
const addPolygon = (points: [number, number][], style?: ShapeStyle, id?: string) => {
  if (!mapInstance.value) return;

  // 使用传入的id或生成新id
  const shapeId = id || `polygon_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const shape: Shape = {
    id: shapeId,
    type: 'polygon',
    path: points,
    style
  };

  addShape(shape);
  return shapeId;
};

// 添加圆形
const addCircle = (center: [number, number], radius: number, style?: ShapeStyle, id?: string) => {
  if (!mapInstance.value) return;

  // 使用传入的id或生成新id
  const shapeId = id || `circle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const shape: Shape = {
    id: shapeId,
    type: 'circle',
    path: [center],
    radius,
    style
  };

  addShape(shape);
  return shapeId;
};

// 添加矩形
const addRectangle = (bounds: [[number, number], [number, number]], style?: ShapeStyle, id?: string) => {
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

  // 使用传入的id或生成新id
  const shapeId = id || `rectangle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const shape: Shape = {
    id: shapeId,
    type: 'rectangle',
    path,
    style
  };

  addShape(shape);
  return shapeId;
};

// 添加折线
const addPolyline = (points: [number, number][], style?: ShapeStyle, id?: string) => {
  if (!mapInstance.value) return;

  // 使用传入的id或生成新id
  const shapeId = id || `polyline_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const shape: Shape = {
    id: shapeId,
    type: 'polyline',
    path: points,
    style
  };

  addShape(shape);
  return shapeId;
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
      if (animation.currentIndex !== undefined && animation.currentIndex >= path.length - 1) {
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

      // 确保currentIndex已初始化
      if (animation.currentIndex === undefined) {
        animation.currentIndex = 0;
      } else {
        animation.currentIndex++;
      }

      const currentPos = path[animation.currentIndex];
      animation.marker.setPosition(currentPos);

      // 更新已走过的路径
      if (!animation.passedPath) {
        animation.passedPath = [];
      }
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
    if (animation.currentIndex !== undefined && animation.currentIndex >= path.length - 1) {
      return;
    }

    // 移动到下一个点
    if (animation.currentIndex === undefined) {
      animation.currentIndex = 0;
    } else {
      animation.currentIndex++;
    }

    const currentPos = path[animation.currentIndex];
    animation.marker.setPosition(currentPos);

    // 更新已走过的路径
    if (!animation.passedPath) {
      animation.passedPath = [];
    }
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
const mouseMoveListenerRef = ref<((e: any) => void) | null>(null);

const removeMouseMoveListener = () => {
  if (!mapInstance.value || !mouseMoveListenerRef.value) return;

  // 移除鼠标移动事件监听
  mapInstance.value.off('mousemove', mouseMoveListenerRef.value);
  mouseMoveListenerRef.value = null;
};

// 设置鼠标样式
const setCursorStyle = (style: string) => {
  if (!mapInstance.value) return;

  try {
    if (mapInstance.value.getContainer) {
      const container = mapInstance.value.getContainer();
      if (container) {
        container.style.cursor = style;
      }
    }
  } catch (err) {
    console.error('设置鼠标样式失败:', err);
  }
};

// 启用添加标记模式
const enableAddMarker = () => {
  if (!mapInstance.value) return;

  // 禁用其他工具
  stopDrawing();
  stopMeasure();

  // 记录当前工具
  currentTool.value = 'marker';

  // 设置为启用添加标记模式
  addMarkerEnabled.value = true;

  // 设置鼠标样式为十字形
  setCursorStyle('crosshair');

  // 添加点击事件监听
  mapInstance.value.on('click', handleMapClickForMarker);
};

// 禁用添加标记模式
const disableAddMarker = () => {
  if (!mapInstance.value) return;

  // 恢复鼠标光标
  setCursorStyle('default');

  // 移除地图点击事件
  mapInstance.value.off('click', handleMapClickForMarker);

  // 重置当前工具
  if (currentTool.value === 'marker') {
    currentTool.value = '';
  }

  // 设置为禁用添加标记模式
  addMarkerEnabled.value = false;
};

// 处理地图点击添加标记点
const handleMapClickForMarker = (e: any) => {
  // 确保当前工具为marker且已启用添加标记模式

};

// 完全重写toggleMarkerLabels方法，使用多种方式来确保标签能够正确显示和隐藏
const toggleMarkerLabels = (show: boolean) => {
  if (!mapInstance.value) return;

  console.log(`尝试${show ? '显示' : '隐藏'}标记点标签，共 ${markersInstances.value.length} 个标记点`);

  if (show) {
    // 显示标签 - 遍历所有标记点添加标签
    markersInstances.value.forEach((markerInstance, idx) => {
      try {
        const markerData = (markerInstance as any).__markerData;
        if (!markerData || !markerData.label) return;

        console.log(`显示标记点 ${idx + 1} 标签:`, markerData.markerId || '无ID');

        // 重新设置标签
        markerInstance.setLabel({
          content: markerData.label,
          direction: 'top'
        });
      } catch (error) {
        console.error('显示标记点标签失败:', error);
      }
    });
  } else {
    // 隐藏标签 - 以下尝试多种方法确保标签被隐藏

    // 方法1: 通过API调用尝试隐藏
    markersInstances.value.forEach((markerInstance, idx) => {
      try {
        const markerData = (markerInstance as any).__markerData;
        if (!markerData) return;

        console.log(`隐藏标记点 ${idx + 1} 标签:`, markerData.markerId || '无ID');

        // 尝试将label设置为null
        markerInstance.setLabel(null);

        // 如果上面的方法不起作用，尝试设置空内容
        setTimeout(() => {
          try {
            markerInstance.setLabel({
              content: '',
              direction: 'top'
            });
          } catch (e) { }
        }, 0);
      } catch (error) {
        console.error('隐藏标记点标签失败(方法1):', error);
      }
    });

    // 方法2: 通过DOM操作尝试隐藏
    setTimeout(() => {
      try {
        if (mapInstance.value && mapInstance.value.getContainer) {
          const mapContainer = mapInstance.value.getContainer();
          if (mapContainer) {
            // 查找并隐藏所有标签
            const labelElements = mapContainer.querySelectorAll('.amap-marker-label');
            console.log(`找到 ${labelElements.length} 个标签元素进行隐藏`);

            labelElements.forEach((el: HTMLElement, i: number) => {
              console.log(`隐藏标签元素 ${i + 1}`);
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.opacity = '0';

              // 如果可能，移除元素
              if (el.parentNode) {
                try {
                  el.parentNode.removeChild(el);
                } catch (e) {
                  console.error('  无法移除标签元素:', e);
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('隐藏标记点标签失败(方法2):', error);
      }
    }, 10);

    // 方法3: 重新创建没有标签的标记点
    // 这是一个激进的方法，如果其他方法都不起作用，可以考虑使用
    /*
    setTimeout(() => {
      try {
        // 保存当前标记点数据
        const currentMarkers = markersInstances.value.map(instance => (instance as any).__markerData).filter(Boolean);
        
        // 清除所有标记点
        clearMarkers();
        
        // 临时关闭showMarkerLabels
        const originalShowLabels = props.showMarkerLabels;
        (props as any).showMarkerLabels = false;
        
        // 重新添加标记点但不带标签
        addMarkers(currentMarkers);
        
        // 恢复原始showMarkerLabels设置
        (props as any).showMarkerLabels = originalShowLabels;
      } catch (error) {
        console.error('隐藏标记点标签失败(方法3):', error);
      }
    }, 20);
    */
  }

  console.log(`${show ? '显示' : '隐藏'}标记点标签操作完成`);
};


// 获取地图当前可视区域的四个角坐标
const getVisibleBounds = () => {
  if (!mapInstance.value) {
    return null;
  }

  try {
    const bounds = mapInstance.value.getBounds();
    if (!bounds) return null;

    // 获取东北角和西南角
    const northEast = bounds.getNorthEast(); // 东北角
    const southWest = bounds.getSouthWest(); // 西南角

    // 组合经纬度获取西北角和东南角
    const northWest: [number, number] = [southWest.getLng(), northEast.getLat()];
    const southEast: [number, number] = [northEast.getLng(), southWest.getLat()];

    return [
      northWest,                                    // 西北
      [northEast.getLng(), northEast.getLat()],     // 东北
      southEast,                                    // 东南
      [southWest.getLng(), southWest.getLat()]      // 西南
    ];
  } catch (error) {
    console.error('获取地图可视区域边界失败', error);
    return null;
  }
};

// 处理标记鼠标进入事件
const onMarkerMouseenter = (marker: Marker) => {
  // 为标记添加视觉反馈
  if (!marker.markerId) return;

  // 查找标记实例
  const markerInstance = markersInstances.value.find((m: any) => {
    const markerData = m.__markerData;
    return markerData && (markerData.markerId === marker.markerId ||
      (markerData.data && markerData.data.id === marker.markerId));
  });

  if (markerInstance) {
    try {
      // 高德地图保存原始尺寸，放大标记
      if (!markerInstance._originalSize) {
        const size = markerInstance.getSize();
        if (size) {
          markerInstance._originalSize = [size.getWidth(), size.getHeight()];
          const newWidth = size.getWidth() * 1.2;
          const newHeight = size.getHeight() * 1.2;
          markerInstance.setSize(new window.AMap.Size(newWidth, newHeight));
        }
      }
    } catch (error) {
      console.warn('为标记添加悬停效果失败', error);
    }
  }
};

// 处理标记鼠标离开事件
const onMarkerMouseleave = (marker: Marker) => {
  // 恢复标记的原始样式
  if (!marker.markerId) return;

  // 查找标记实例
  const markerInstance = markersInstances.value.find((m: any) => {
    const markerData = m.__markerData;
    return markerData && (markerData.markerId === marker.markerId ||
      (markerData.data && markerData.data.id === marker.markerId));
  });

  if (markerInstance) {
    try {
      // 高德地图恢复原始尺寸
      if (markerInstance._originalSize) {
        markerInstance.setSize(new window.AMap.Size(
          markerInstance._originalSize[0],
          markerInstance._originalSize[1]
        ));
        delete markerInstance._originalSize;
      }
    } catch (error) {
      console.warn('恢复标记原始样式失败', error);
    }
  }
};

// 暴露组件方法
defineExpose({
  addMouseMoveListener,
  removeMouseMoveListener,
  markersInstances,
  addMarkers,
  setMarkers,
  clearMarkers,
  removeMarker,
  getCenter: () => {
    if (!mapInstance.value) return null;
    const center = mapInstance.value.getCenter();
    return [center.lng, center.lat] as [number, number];
  },
  setCenter,
  getZoom: () => {
    if (!mapInstance.value) return null;
    return mapInstance.value.getZoom();
  },
  setZoom,
  startMeasure,
  stopMeasure,
  clearDistance,
  addShape,
  removeShape,
  clearShapes,
  getShapes,
  addPolygon,
  addCircle,
  addRectangle,
  addPolyline,
  startDrawing,
  stopDrawing,
  enableCluster,
  disableCluster,
  enableAddMarker,
  disableAddMarker,
  setCursorStyle,
  toggleMarkerLabels,
  getVisibleBounds,
  getVisibleMarkers: () => {
    if (!mapInstance.value) {
      return [];
    }

    try {
      // 获取地图当前可视边界
      const bounds = getVisibleBounds();
      if (!bounds || bounds.length !== 4) {
        return [];
      }

      // 提取边界坐标
      const [northWest, northEast, southEast, southWest] = bounds;

      // 获取边界经纬度范围
      const minLng = Math.min(northWest[0], southWest[0]);
      const maxLng = Math.max(northEast[0], southEast[0]);
      const minLat = Math.min(southWest[1], southEast[1]);
      const maxLat = Math.max(northWest[1], northEast[1]);

      // 获取所有标记的数据
      const allMarkers = markersInstances.value.map(marker => {
        return marker.__markerData;
      }).filter(Boolean);

      // 过滤出在可视范围内的标记点
      return allMarkers.filter(marker => {
        const [lng, lat] = marker.position;
        return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
      });
    } catch (error) {
      console.error('获取可视范围内标记点失败:', error);
      return [];
    }
  },
  onMarkerMouseenter,
  onMarkerMouseleave,
  // 新增方法：获取坐标点对应的像素位置
  getPixelFromCoordinate: (coord: [number, number]) => {
    if (!mapInstance.value) {
      return null;
    }

    try {
      // 使用高德地图API将经纬度转换为像素坐标
      const lnglat = new window.AMap.LngLat(coord[0], coord[1]);

      // 标记点位置需要转换成容器像素坐标
      let pixel: { x: number; y: number } | null = null;
      if (typeof mapInstance.value.lngLatToContainer === 'function') {
        pixel = mapInstance.value.lngLatToContainer(lnglat);
      } else if (typeof mapInstance.value.lnglatToPixel === 'function') {
        // 备用方法
        pixel = mapInstance.value.lnglatToPixel(lnglat);
      }

      // 获取地图容器偏移
      const container = document.querySelector('.amap-container');
      const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };

      if (pixel && typeof pixel === 'object' && 'x' in pixel && 'y' in pixel) {
        console.log('AMap原始像素坐标:', pixel, '容器位置:', containerRect);

        // 返回相对于容器的坐标，不需要加上容器偏移，因为lngLatToContainer已经是相对于容器的坐标
        return [
          pixel.x,
          pixel.y
        ] as [number, number];
      }
    } catch (error) {
      console.error('转换坐标到像素失败:', error);
    }

    return null;
  },
  // 根据标记ID获取DOM元素
  getMarkerElement: (markerId: string) => {
    if (!mapInstance.value) return null;
    try {
      // 从标记实例列表中查找对应的标记
      const marker = markersInstances.value.find(m => {
        const markerData = (m as any).__markerData;
        return markerData &&
          (markerData.markerId === markerId ||
            (markerData.data && markerData.data.id === markerId));
      });

      if (marker) {
        // 先尝试使用getElement方法
        let element = marker.getElement ? marker.getElement() :
          (marker.getContent ? marker.getContent() : null);

        // 如果没有获取到元素，尝试使用DOM选择器
        if (!element) {
          element = document.querySelector(`[data-marker-id="${markerId}"][data-map-type="amap"]`);

          // 尝试其他方法查找标记元素
          if (!element) {
            // 如果所有方法都失败，尝试使用高德地图特有的DOM结构
            element = document.querySelector(`.amap-marker[title="${(marker as any).__markerData?.title}"]`);
          }
        }

        return element;
      }

      // 如果通过实例找不到，尝试直接通过DOM选择器查找
      return document.querySelector(`[data-marker-id="${markerId}"]`) ||
        document.querySelector(`.amap-marker[data-marker-id="${markerId}"]`);
    } catch (error) {
      console.error('获取标记DOM元素失败', error);
      return null;
    }
  },

  // 根据标记数据获取DOM元素
  getMarkerElementByData: (marker: Marker) => {
    if (!mapInstance.value) return null;
    try {
      const markerId = marker.markerId || (marker.data && marker.data.id);
      if (!markerId) {
        // 如果没有ID，尝试使用标题查找
        if (marker.title) {
          return document.querySelector(`.amap-marker[title="${marker.title}"]`);
        }
        return null;
      }

      // 主方法：使用data-marker-id属性查找DOM元素
      let element = document.querySelector(`[data-marker-id="${markerId}"][data-map-type="amap"]`);

      // 如果找不到，尝试不带map-type的选择器
      if (!element) {
        element = document.querySelector(`[data-marker-id="${markerId}"]`);
      }

      // 如果依然找不到，尝试通过类名和标题属性查找
      if (!element && marker.title) {
        element = document.querySelector(`.amap-marker[title="${marker.title}"]`);
      }

      // 如果依然找不到，尝试获取对应实例中的DOM元素
      if (!element) {
        const markerInstance = markersInstances.value.find(m => {
          const markerData = (m as any).__markerData;
          return markerData &&
            (markerData.markerId === markerId ||
              (markerData.data && markerData.data.id === markerId));
        });

        if (markerInstance) {
          element = markerInstance.getElement ? markerInstance.getElement() :
            (markerInstance.getContent ? markerInstance.getContent() : null);
        }
      }

      return element;
    } catch (error) {
      console.error('获取标记DOM元素失败', error);
      return null;
    }
  }
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

// 添加点击波纹效果
const addClickRippleEffect = (element: HTMLElement) => {
  // 创建波纹容器，不影响标记点原始位置
  const rippleContainer = document.createElement('div');
  rippleContainer.className = 'marker-ripple-container';
  rippleContainer.style.position = 'absolute';
  rippleContainer.style.left = '0';
  rippleContainer.style.top = '0';
  rippleContainer.style.width = '100%';
  rippleContainer.style.height = '100%';
  rippleContainer.style.pointerEvents = 'none';
  rippleContainer.style.zIndex = '999';
  rippleContainer.style.overflow = 'visible';

  // 创建波纹元素
  const ripple = document.createElement('div');
  ripple.className = 'marker-click-ripple';
  ripple.style.position = 'absolute';
  ripple.style.left = '50%';
  ripple.style.top = '50%';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.width = '0';
  ripple.style.height = '0';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'rgba(24, 144, 255, 0.2)';
  ripple.style.border = '2px solid rgba(24, 144, 255, 0.8)';
  ripple.style.pointerEvents = 'none';
  ripple.style.opacity = '1';

  // 添加到波纹容器
  rippleContainer.appendChild(ripple);

  // 先保存元素原来的position属性
  const originalPosition = element.style.position;
  if (!originalPosition || originalPosition === 'static') {
    element.style.position = 'relative';
  }

  // 添加波纹容器到标记元素
  element.appendChild(rippleContainer);

  // 应用动画
  ripple.animate(
    [
      { width: '0px', height: '0px', opacity: 1 },
      { width: '40px', height: '40px', opacity: 0 }
    ],
    {
      duration: 600,
      easing: 'ease-out'
    }
  );

  // 添加标记缩放动画，但不改变原始定位
  const originalTransform = element.style.transform || '';

  // 确保缩放时标记点中心不变
  element.style.transformOrigin = 'center center';

  // 创建标记缩放动画
  const scaleAnimation = element.animate(
    [
      { transform: `${originalTransform} scale(1)` },
      { transform: `${originalTransform} scale(1.2)` },
      { transform: `${originalTransform} scale(1)` }
    ],
    {
      duration: 300,
      easing: 'ease-in-out'
    }
  );

  // 动画结束后移除波纹容器
  setTimeout(() => {
    if (element.contains(rippleContainer)) {
      element.removeChild(rippleContainer);
    }

    // 如果元素原来不是相对定位，恢复原始定位方式
    if (!originalPosition || originalPosition === 'static') {
      // 给动画一点时间完成
      setTimeout(() => {
        element.style.position = originalPosition;
      }, 100);
    }
  }, 600);
};

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