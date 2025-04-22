<template>
  <div class="amap-container" :style="{ height: height, width: width }">
    <div class="map-container" ref="mapContainer"></div>

    <!-- 测距结果显示（将被删除，由父组件统一管理） -->

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, shallowRef, onUnmounted } from 'vue';
import { Marker, Shape, ShapeStyle, ShapeType, ClusterOptions, TrackAnimation, TrackAnimationOptions, MapViewType, ToolType, DistanceResultEvent } from '../types';
import { useMapScriptLoader } from '../hooks/useMapScriptLoader';
import { DEFAULT_MARKER_SIZE } from '../types/default';
import { debug, info } from '@repo/utils';

// 声明类型
declare global {
  interface Window {
    AMap: any;
    _amap_overlays?: Map<string, any>;
    _amap_track_animation?: TrackAnimation;
  }
}

const props = withDefaults(defineProps<{
  /** 地图类型 */
  type: string;
  /** API密钥 */
  apiKey: string;
  /** 地图中心点坐标 */
  center: [number, number];
  /** 缩放级别 */
  zoom: number;
  /** 标记点 */
  markers: Marker[];
  /** 地图高度 */
  height: string;
  /** 地图宽度 */
  width: string;
  /** 是否可拖动 */
  draggable: boolean;
  /** 是否启用滚轮缩放 */
  scrollWheel: boolean;
  /** 是否显示缩放控件 */
  zoomControl: boolean;
  /** 是否显示比例尺控件 */
  scaleControl: boolean;
  /** 地图样式 */
  mapStyle: string;
  /** 视图类型 */
  viewType: string;
  /** 初始图形 */
  initialShapes: Shape[];
  /** 是否启用聚合 */
  enableCluster: boolean;
  /** 聚合配置 */
  clusterOptions: ClusterOptions;
  /** 是否显示标记点标签 */
  showMarkerLabels: boolean;
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
  'marker-mouseleave',
  'shape-contextmenu',  // 添加图形右键菜单事件
  'marker-contextmenu',  // 添加标记点右键菜单事件
  'shape-deleted'  // 添加图形删除事件
]);

const mapContainer = ref<HTMLElement | null>(null);
const mapInstance = ref<any>(null);
const markersInstances = ref<any[]>([]);
const shapesInstances = ref<Map<string, any>>(new Map());
const drawingManager = ref<any>(null);
const clusterManager = ref<any>(null);
const distanceTool = ref<any>(null);
const currentTool = ref<string>('');
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
const handleToolClick = (tool: string) => {
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

  // 验证center坐标是否为[0,0]
  let mapCenter = props.center;
  if (props.center[0] === 0 && props.center[1] === 0) {
    console.warn('AMap: 检测到center坐标为[0,0]，使用默认北京中心坐标');
    mapCenter = [116.397428, 39.90923]; // 默认北京中心
  }

  // 创建地图实例
  const mapOptions: any = {
    center: mapCenter,
    zoom: props.zoom,
    resizeEnable: true,
    dragEnable: props.draggable,
    zoomEnable: props.scrollWheel,
    buildingAnimation: true,
    mapStyle: props.mapStyle || 'amap://styles/normal'
  };

  // 根据视图类型设置地图类型
  if (props.viewType === MapViewType.SATELLITE) {
    mapOptions.layers = [new window.AMap.TileLayer.Satellite()];
  } else if (props.viewType === MapViewType.HYBRID) {
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
    info('MarkerClusterer插件加载成功');
  });

  window.AMap.plugin(['AMap.PlaceSearch'], function () {
    info('PlaceSearch插件加载成功');
  });

  window.AMap.plugin(['AMap.MouseTool'], function () {
    info('MouseTool插件加载成功');
  });


  window.AMap.plugin(['AMap.Scale'], function () {
    info('Scale插件加载成功');
  });


  window.AMap.plugin(['AMap.RangingTool'], function () {
    info('RangingTool插件加载成功');
  });

  window.AMap.plugin(['AMap.ToolBar'], function () {
    info('ToolBar插件加载成功');
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

// 监听视图类型变化
watch(() => props.viewType, (newViewType) => {
  if (!mapInstance.value) return;
  info('AMap: 视图类型变更为 {}', newViewType);
  setMapViewType(newViewType);
});

// 设置地图视图类型
const setMapViewType = (viewType: string) => {
  if (!mapInstance.value) return;

  info('AMap: 设置地图视图类型 {}', viewType);

  // 获取当前地图上的图层
  const layers = mapInstance.value.getLayers();

  // 移除所有当前图层
  if (layers && layers.length > 0) {
    layers.forEach((layer: any) => {
      mapInstance.value.remove(layer);
    });
  }

  // 根据视图类型设置新的图层
  switch (viewType) {
    case 'satellite':
      // 卫星图层
      mapInstance.value.add(new window.AMap.TileLayer.Satellite());
      break;
    case 'hybrid':
      // 混合图层 (卫星 + 路网)
      mapInstance.value.add([
        new window.AMap.TileLayer.Satellite(),
        new window.AMap.TileLayer.RoadNet()
      ]);
      break;
    case 'normal':
    default:
      // 普通图层
      mapInstance.value.add(new window.AMap.TileLayer());
      // 如果有设置地图样式，应用它
      if (props.mapStyle) {
        mapInstance.value.setMapStyle(props.mapStyle);
      }
      break;
  }
};

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
    // 添加详细日志以便调试
    info('绘制完成事件触发，事件对象: {}', event);
    info('绘制对象类型: {}', event.obj.CLASS_NAME);

    // 特殊处理矩形绘制情况
    if (event.obj.CLASS_NAME && event.obj.CLASS_NAME.includes('Rectangle')) {
      info('检测到矩形绘制');
      // 对于矩形，确保我们可以获取到边界
      const bounds = event.obj.getBounds();
      if (bounds) {
        info('矩形边界: {}', bounds);
        // 获取西南角和东北角坐标
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        if (sw && ne) {
          // 创建一个新的多边形对象，显式设置矩形的四个角点
          const path = [
            [sw.lng, sw.lat], // 西南角
            [ne.lng, sw.lat], // 东南角
            [ne.lng, ne.lat], // 东北角
            [sw.lng, ne.lat], // 西北角
            [sw.lng, sw.lat]  // 闭合回西南角
          ];

          // 创建新的多边形对象
          const polygon = new window.AMap.Polygon({
            path: path.map(p => new window.AMap.LngLat(p[0], p[1])),
            strokeColor: event.obj.getOptions().strokeColor || '#006600',
            strokeWeight: event.obj.getOptions().strokeWeight || 2,
            strokeOpacity: event.obj.getOptions().strokeOpacity || 0.9,
            fillColor: event.obj.getOptions().fillColor || '#006600',
            fillOpacity: event.obj.getOptions().fillOpacity || 0.5,
            zIndex: 50
          });

          // 使用转换后的多边形替代原始矩形
          event.obj = polygon;
          info('已将矩形转换为多边形，确保path数据可用');
        }
      }
    }

    event.obj.extData = {};
    event.obj.extData.id = `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const shape = convertDrawedObjectToShape(event.obj);

    // 添加调试日志，确保shape对象包含完整的path
    info('绘制完成，生成shape对象: {}', {
      id: shape.id,
      type: shape.type,
      pathLength: shape.path ? shape.path.length : 0,
      hasPath: !!shape.path,
      radius: shape.radius
    });

    // 确保矩形有正确的path值
    if (shape.type === 'rectangle' && (!shape.path || shape.path.length === 0)) {
      console.error('矩形绘制错误：path值缺失');

      // 尝试从事件对象获取边界信息
      if (event.obj && typeof event.obj.getBounds === 'function') {
        const bounds = event.obj.getBounds();
        if (bounds) {
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          if (sw && ne) {
            shape.path = [
              [sw.getLng(), sw.getLat()], // 西南角
              [ne.getLng(), sw.getLat()], // 东南角
              [ne.getLng(), ne.getLat()], // 东北角
              [sw.getLng(), ne.getLat()], // 西北角
              [sw.getLng(), sw.getLat()]  // 闭合回西南角
            ];
            info('使用边界信息修复矩形path: {}', shape.path);
          }
        }
      }
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
  let data: any = {};
  
  // 尝试从对象获取或生成ID
  let id = '';
  
  // 1. 尝试从extData中获取ID
  if (obj.getExtData && typeof obj.getExtData === 'function') {
    const extData = obj.getExtData();
    if (extData) {
      if (extData.id) {
        id = extData.id;
      }
      // 提取额外数据
      if (typeof extData === 'object') {
        // 排除掉extData中已经提取的id属性
        const { id: _, ...otherData } = extData;
        data = otherData;
      }
    }
  }
  if (obj.extData) {
    const extData = obj.extData;
    if (extData) {
      if (extData.id) {
        id = extData.id;
      }
      // 提取额外数据
      if (typeof extData === 'object') {
        // 排除掉extData中已经提取的id属性
        const { id: _, ...otherData } = extData;
        data = otherData;
      }
    }
  }
  
  // 2. 尝试从对象自身属性中获取ID
  if (!id && obj.id) {
    id = obj.id;
  }
  
  // 3. 如果还是没有ID，生成一个随机ID
  if (!id) {
    id = `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  info('开始转换绘制对象为Shape格式，对象类型: {}', obj.CLASS_NAME || typeof obj);

  if (obj instanceof window.AMap.Circle) {
    type = 'circle';
    const center = obj.getCenter();
    path = [[center.getLng(), center.getLat()]];
    radius = obj.getRadius();
  } else if (obj.CLASS_NAME && obj.CLASS_NAME.includes('Rectangle')) {
    // 直接处理矩形对象
    type = 'rectangle';

    // 尝试从矩形对象获取边界
    if (typeof obj.getBounds === 'function') {
      const bounds = obj.getBounds();
      if (bounds) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        if (sw && ne) {
          // 只保存西南和东北两个点，简化矩形表示
          path = [
            [sw.getLng(), sw.getLat()], // 西南角
            [ne.getLng(), ne.getLat()]  // 东北角
          ];
          info('从矩形边界提取path(简化为两点): {}', JSON.stringify(path));
        }
      }
    }

    // 如果无法从边界获取，尝试从路径获取
    if (path.length === 0 && typeof obj.getPath === 'function') {
      try {
        const rawPath = obj.getPath().map((point: any) => [point.getLng(), point.getLat()]);
        if (rawPath && rawPath.length > 0) {
          // 计算边界框，只保留西南和东北两个点
          const lngs = rawPath.map(p => p[0]);
          const lats = rawPath.map(p => p[1]);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          
          path = [
            [minLng, minLat], // 西南角
            [maxLng, maxLat]  // 东北角
          ];
          info('从矩形路径计算边界并简化为两点: {}', JSON.stringify(path));
        }
      } catch (e) {
        console.error('获取矩形路径失败:', e);
      }
    }
  } else if (obj instanceof window.AMap.Polygon) {
    // 先获取原始路径点数组
    const rawPath = obj.getPath().map((point: any) => [point.getLng(), point.getLat()]);
    info('原始路径点数组:', JSON.stringify(rawPath), '长度: {}', rawPath.length);

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

      info('矩形坐标计算: {}', { minLng, maxLng, minLat, maxLat });

      // 只保存两个对角点，而不是完整的五点表示
      path = [
        [minLng, minLat], // 西南角
        [maxLng, maxLat]  // 东北角
      ];

      // 添加详细调试日志
      info('矩形绘制完成，简化为两点表示:', JSON.stringify(path));
    } else {
      type = 'polygon';
      path = rawPath as [number, number][];
    }
  } else if (obj instanceof window.AMap.Polyline) {
    type = 'polyline';
    path = obj.getPath().map((point: any) => [point.getLng(), point.getLat()]) as [number, number][];
  }

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
  info('创建{}图形，ID: {}，path长度: {}', type, id, typedPath.length);
  if (type === 'rectangle') {
    info('矩形path详情: {}', JSON.stringify(typedPath));
  }

  // 确保path数据正确
  const finalPath = typedPath.length > 0 ? typedPath : path;

  const shape: Shape = {
    id,
    type,
    path: finalPath,
    radius,
    style,
    data
  };

  // 最终验证shape对象
  info('最终shape对象 - 类型: {}, ID: {}, path长度: {}', shape.type, shape.id, shape.path.length);

  // 保存形状实例
  shapesInstances.value.set(id, obj);

  return shape;
};

// 初始化测距工具
const initDistanceTool = () => {
  if (!mapInstance.value) return;

  info('初始化高德地图测距工具开始');

  // 确保插件已加载
  if (window.AMap && window.AMap.RangingTool) {
    setupDistanceTool();
  } else {
    // 加载插件
    try {
      info('加载RangingTool插件');
      window.AMap.plugin(['AMap.RangingTool'], function () {
        info('RangingTool插件加载成功');
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

  info('设置测距工具');

  // 创建测距工具实例
  try {
    // 确保RangingTool存在
    if (!window.AMap.RangingTool) {
      console.error('RangingTool插件不存在');
      return;
    }

    distanceTool.value = new window.AMap.RangingTool(mapInstance.value);
    info('创建测距工具实例成功');

    // 监听测距完成事件
    distanceTool.value.on('end', (result: any) => {
      info('测距结果: {}', result);
      // 处理测距结果
      if (result && result.points) {
        const distance = result.distance;
        const path = result.points.map((point: any) =>
          [point.lng || point.getLng(), point.lat || point.getLat()]
        ) as [number, number][];

        info('测距距离: {}', distance, '路径点数:', path.length);

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

    info('测距工具设置完成');
  } catch (err) {
    console.error('初始化测距工具失败:', err);
  }
};

// 开始测距
const startMeasure = () => {
  if (!mapInstance.value) return;

  info('高德地图开始测距');

  // 先停止之前的测距并清除数据
  stopMeasure();

  // 先停止其他工具
  stopDrawing();
  disableAddMarker();

  // 记录当前工具
  currentTool.value = 'distance';

  // 如果测距工具不存在，先初始化
  if (!distanceTool.value) {
    info('初始化测距工具');
    initDistanceTool();
    // 延迟执行，确保测距工具初始化完成
    setTimeout(() => {
      if (distanceTool.value) {
        currentTool.value = 'distance';
        try {
          distanceTool.value.turnOn();
          info('延迟启动测距工具成功');
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
    info('启动测距工具成功');
  } catch (err) {
    console.error('启动测距工具失败:', err);
  }
};

// 停止测距
const stopMeasure = () => {
  if (!mapInstance.value) return;

  info('高德地图停止测距');

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

      // 查找并移除所有与测距相关的覆盖物（通常具有特定的样式或属性）
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

        info('已清除 {} 个可能的测距覆盖物', distanceOverlays.length);
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

  // 常用样式选项
  const commonStyleOptions = {
    strokeColor: '#006600',
    strokeWeight: 2,
    strokeOpacity: 0.9,
    fillColor: '#006600',
    fillOpacity: 0.5,
    strokeStyle: 'solid'
  };

  info('开始绘制: {}', type);

  // 监听绘制完成事件，添加右键菜单
  if (drawingManager.value && !(drawingManager.value as any)._hasAddedRightClickListener) {
    drawingManager.value.on('draw', (e: any) => {
      if (e.obj) {
        // 为绘制完成的图形添加右键菜单事件
        e.obj.on('rightclick', (event: any) => {
          const shape = convertDrawedObjectToShape(e.obj);
          info('绘制的图形右键菜单事件: {} ({})', shape.id, shape.type);
          emit('shape-contextmenu', {
            shape,
            position: [event.lnglat.getLng(), event.lnglat.getLat()],
            originalEvent: event
          }, e.obj);
        });
      }
    });
    
    // 标记已添加监听器，避免重复添加
    (drawingManager.value as any)._hasAddedRightClickListener = true;
  }

  // 根据类型开始绘制
  switch (type) {
    case 'circle':
      drawingManager.value.circle({
        ...commonStyleOptions
      });
      break;
    case 'polygon':
      drawingManager.value.polygon({
        ...commonStyleOptions
      });
      break;
    case 'rectangle':
      info('开始绘制矩形，设置详细配置项');
      // 为矩形绘制设置详细选项
      const rectangleOptions = {
        ...commonStyleOptions,
        // 确保绘制时就建立完整的信息
        createOptions: {
          // 添加额外信息，确保生成包含完整path的对象
          extData: {
            type: 'rectangle',
            needProcessPath: true
          }
        }
      };

      // 启动矩形绘制
      drawingManager.value.rectangle(rectangleOptions);

      // 记录当前工具类型
      currentTool.value = 'rectangle';
      break;
    case 'polyline':
      drawingManager.value.polyline({
        strokeColor: '#006600',
        strokeWeight: 2,
        strokeOpacity: 0.9
      });
      break;
    default:
      break;
  }
};

// 辅助方法：从图形对象提取Shape数据
const getShapeDataFromObj = (obj: any, type: string): Shape => {
  let shapeType: ShapeType = 'polygon';
  let path: [number, number][] = [];
  let radius: number | undefined = undefined;
  
  // 尝试从图形对象中获取ID
  let id = '';
  
  // 1. 尝试从extData中获取ID
  if (obj.getExtData && typeof obj.getExtData === 'function') {
    const extData = obj.getExtData();
    if (extData && extData.id) {
      id = extData.id;
    }
  }
  
  // 2. 尝试从对象自身属性中获取ID
  if (!id && obj.id) {
    id = obj.id;
  }
  
  // 3. 如果还是没有ID，再生成一个随机ID
  if (!id) {
    id = `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  
  if (type === 'circle' || obj instanceof window.AMap.Circle) {
    shapeType = 'circle';
    const center = obj.getCenter();
    path = [[center.getLng(), center.getLat()]];
    radius = obj.getRadius();
  } else if (type === 'rectangle' || (obj instanceof window.AMap.Polygon && obj.getPath().length === 4)) {
    shapeType = 'rectangle';
    const polygonPath = obj.getPath();
    const rawPath = polygonPath.map((point: any) => [point.getLng(), point.getLat()]);
    
    // 计算矩形的西南和东北点
    const lngs = rawPath.map((p: any) => p[0]);
    const lats = rawPath.map((p: any) => p[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    
    // 只需保存西南和东北两个点
    path = [
      [minLng, minLat], // 西南角
      [maxLng, maxLat]  // 东北角
    ];
  } else if (type === 'polygon' || obj instanceof window.AMap.Polygon) {
    shapeType = 'polygon';
    path = obj.getPath().map((point: any) => [point.getLng(), point.getLat()]);
  } else if (type === 'polyline' || obj instanceof window.AMap.Polyline) {
    shapeType = 'polyline';
    path = obj.getPath().map((point: any) => [point.getLng(), point.getLat()]);
  }
  
  // 获取样式信息
  const options = obj.getOptions ? obj.getOptions() : {};
  const style: ShapeStyle = {
    fillColor: options.fillColor,
    fillOpacity: options.fillOpacity,
    strokeColor: options.strokeColor,
    strokeWeight: options.strokeWeight,
    strokeOpacity: options.strokeOpacity,
    strokeStyle: options.strokeStyle
  };
  
  // 获取额外数据
  let data: any = {};
  if (obj.getExtData && typeof obj.getExtData === 'function') {
    const extData = obj.getExtData();
    if (extData && typeof extData === 'object') {
      // 排除掉extData中已经提取的id属性
      const { id: _, ...otherData } = extData;
      data = otherData;
    }
  }
  
  return {
    id,
    type: shapeType,
    path,
    radius,
    style,
    data
  };
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

  // 检查shape数据是否完整
  if (shape.type === 'circle' && (!shape.path || !shape.radius)) {
    console.error('圆形数据不完整');
    return;
  }

  if ((shape.type === 'polygon' || shape.type === 'polyline' || shape.type === 'rectangle') && (!shape.path || shape.path.length === 0)) {
    console.error(`${shape.type}数据不完整`);
    return;
  }

  try {
    const styleOptions: any = {
    strokeColor: shape.style?.strokeColor || '#006600',
    strokeWeight: shape.style?.strokeWeight || 2,
    strokeOpacity: shape.style?.strokeOpacity || 0.9,
      strokeStyle: shape.style?.strokeStyle || 'solid',
      fillColor: shape.style?.fillColor,
      fillOpacity: shape.style?.fillOpacity,
      zIndex: 50,
      // 添加自定义数据
      extData: {
        id: shape.id,
        type: shape.type,
        data: shape.data || {},
        canDelete: shape.canDelete,
        canMenu: shape.canMenu
      }
    };

    let shapeInstance: any;

  switch (shape.type) {
    case 'circle': {
        const center = shape.path[0];
      shapeInstance = new window.AMap.Circle({
          center: new window.AMap.LngLat(center[0], center[1]),
          radius: shape.radius,
        ...styleOptions
      });
      break;
    }
      case 'rectangle': {
      if (!Array.isArray(shape.path)) break;
        
        // 检查path是否只有2个点（西南角和东北角）
        if (shape.path.length === 2) {
          info('使用两点表示法创建矩形: 西南角({},{})和东北角({},{})',
               shape.path[0][0], shape.path[0][1], shape.path[1][0], shape.path[1][1]);
               
          // 从两点构建四点路径
          const sw = shape.path[0];
          const ne = shape.path[1];
          const fullPath = [
            new window.AMap.LngLat(sw[0], sw[1]), // 西南角
            new window.AMap.LngLat(ne[0], sw[1]), // 东南角
            new window.AMap.LngLat(ne[0], ne[1]), // 东北角
            new window.AMap.LngLat(sw[0], ne[1])  // 西北角
          ];
          
          shapeInstance = new window.AMap.Polygon({
            path: fullPath,
            ...styleOptions
          });
        } else {
          // 兼容处理，如果提供了完整的多边形路径
      const path = shape.path.map(point => new window.AMap.LngLat(point[0], point[1]));
      shapeInstance = new window.AMap.Polygon({
        path,
        ...styleOptions
      });
        }
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
    case 'polyline': {
      if (!Array.isArray(shape.path)) break;
      const path = shape.path.map(point => new window.AMap.LngLat(point[0], point[1]));
      shapeInstance = new window.AMap.Polyline({
        path,
        ...styleOptions
      });
      break;
    }
      default:
        return;
  }

    if (!shapeInstance) return;
    emit('shape-created', shapeInstance);
    // 添加点击事件
    shapeInstance.on('click', (e: any) => {
      const clickPosition = [e.lnglat.getLng(), e.lnglat.getLat()];
      emit('shape-click', {
        shape,
        position: clickPosition,
        originalEvent: e
      });
    });
    
    // 添加右键菜单事件
    shapeInstance.on('rightclick', (e: any) => {
      info('图形右键菜单事件: {} ({})', shape.id, shape.type);
      emit('shape-contextmenu', {
        shape,
        position: [e.lnglat.getLng(), e.lnglat.getLat()],
        event: {
          clientX: e.originEvent.clientX || 0,
          clientY: e.originEvent.clientY || 0,
          target: shapeInstance,
        },
        originalEvent: e
      }, shapeInstance);
    });

    shapeInstance.setMap(mapInstance.value);
    shapesInstances.value.set(shape.id, shapeInstance);
  } catch (error) {
    console.error('添加图形失败:', error, shape);
  }
};

// 移除图形
const removeShape = (shapeId: string): boolean => {
  const shapeInstance = shapesInstances.value.get(shapeId);
  if (shapeInstance) {
    try {
    shapeInstance.setMap(null);
    shapesInstances.value.delete(shapeId);
      emit('shape-deleted', shapeId);
      return true;
    } catch (error) {
      console.error('移除图形失败:', error, shapeId);
      return false;
  }
  }
  return false;
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

        // 计算矩形的西南和东北点
        const lngs = rawPath.map(p => p[0]);
        const lats = rawPath.map(p => p[1]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        // 只需保存西南和东北两个点
        path = [
          [minLng, minLat], // 西南角
          [maxLng, maxLat]  // 东北角
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
    info('聚合条件不满足，跳过聚合 {}', clusterableMarkers.length, options.enable);
    return;
  }

  info('启用高德地图带权重聚合功能 {}', options, '可聚合点数量:', clusterableMarkers.length, '不可聚合点数量:', nonClusterableMarkers.length);

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
                    svgContent.style.width = (markerData.size?.[0] || DEFAULT_MARKER_SIZE[0]) + 'px';
                    svgContent.style.height = (markerData.size?.[1] || DEFAULT_MARKER_SIZE[1]) + 'px';
                    context.marker.setContent(svgContent);
                  } else {
                    // 图片URL图标
                    const icon = new window.AMap.Icon({
                      size: new window.AMap.Size(markerData.size?.[0] || DEFAULT_MARKER_SIZE[0], markerData.size?.[1] || DEFAULT_MARKER_SIZE[1]),
                      image: markerData.icon,
                      imageSize: new window.AMap.Size(markerData.size?.[0] || DEFAULT_MARKER_SIZE[0], markerData.size?.[1] || DEFAULT_MARKER_SIZE[1])
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

    info('高德地图聚合功能已启用 {}', options.useWeight ? pointsData.length : clusterableMarkers.length, '个标记点');
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
      info('禁用高德地图标记点聚合 - 使用直接处理方式');

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
      info('聚合功能已禁用，已恢复 {}', existingMarkers.size, '个标记点');
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
      size: marker.size || DEFAULT_MARKER_SIZE,
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
        svgContent.style.width = (marker?.size?.[0] || DEFAULT_MARKER_SIZE[0]) + 'px';
        svgContent.style.height = (marker?.size?.[1] || DEFAULT_MARKER_SIZE[1]) + 'px';

        // 使用自定义内容创建标记
        markerOptions.content = svgContent;
      } else {
        // 使用普通图片URL
        markerOptions.icon = new window.AMap.Icon({
          size: new window.AMap.Size(marker?.size?.[0] || DEFAULT_MARKER_SIZE[0], marker?.size?.[1] || DEFAULT_MARKER_SIZE[1]),
          image: marker.icon,
          markerId: marker.markerId,
          imageSize: new window.AMap.Size(marker?.size?.[0] || DEFAULT_MARKER_SIZE[0], marker?.size?.[1] || DEFAULT_MARKER_SIZE[1])
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

    // 添加点击事件
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
      }, markerInstance.dom);
    });

    // 添加右键菜单事件
    markerInstance.on('rightclick', (e: any) => {
      info('标记点右键菜单事件: {} ({}, {})', marker.title || marker.markerId || marker.data?.id, 
        e.lnglat.getLng(), e.lnglat.getLat());
      
      emit('marker-contextmenu', markerInstance, {
        marker: {
          ...marker,
          position: [e.lnglat.getLng(), e.lnglat.getLat()]
        },
        originalEvent: e
      }, markerInstance.dom);
      
      // 防止事件冒泡
      e.originalEvent && e.originalEvent.preventDefault();
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
  
  // 验证center坐标是否为[0,0]
  if (center[0] === 0 && center[1] === 0) {
    console.warn('AMap: 尝试设置center为[0,0]，这可能是错误值，忽略此次设置');
    return;
  }
  
  mapInstance.value.setCenter(center);
};

// 设置缩放级别
const setZoom = (zoom: number) => {
  if (!mapInstance.value) return;
  mapInstance.value.setZoom(zoom);
};

// 监听属性变化
watch(() => props.center, (newCenter) => {
  // 验证newCenter坐标是否为[0,0]
  if (newCenter[0] === 0 && newCenter[1] === 0) {
    console.warn('AMap: 检测到尝试将center设置为[0,0]，这可能是错误值，忽略此次更新');
    return;
  }
  
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

  // 使用西南-东北坐标来定义矩形
  const [sw, ne] = bounds;

  // 使用传入的id或生成新id
  const shapeId = id || `rectangle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // 创建矩形形状对象
  const shape: Shape = {
    id: shapeId,
    type: 'rectangle',
    // 只保存西南和东北两个点作为path
    path: [sw, ne],
    style
  };

  // 调用统一的addShape方法
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

// 轨迹动画相关方法
const startTrackAnimation = (points: any[], options: TrackAnimationOptions = {}) => {
  try {
    // 引入系统性改进：预处理轨迹点，确保质量
    const preprocessedPoints = options.preprocessPoints ? options.preprocessPoints(points) : points;
    
    if (!mapInstance.value || !preprocessedPoints || !Array.isArray(preprocessedPoints) || preprocessedPoints.length < 2) {
      console.warn('轨迹点无效，无法启动动画', preprocessedPoints);
      return null;
    }

    // 清理现有轨迹动画
    stopTrackAnimation();

    // 转换为可靠的经纬度数组，过滤掉无效点
    const originalPath: [number, number][] = [];
    
    preprocessedPoints.forEach(point => {
      // 无效点检查
      if (!point) return;
      
      // 标准化点格式
      if (Array.isArray(point) && point.length >= 2 && !isNaN(point[0]) && !isNaN(point[1])) {
        originalPath.push([point[0], point[1]]);
      } else if (typeof point === 'object') {
        if (typeof point.getLng === 'function' && typeof point.getLat === 'function') {
          // AMap.LngLat 对象
          originalPath.push([point.getLng(), point.getLat()]);
        } else if (point.lng !== undefined && point.lat !== undefined && !isNaN(point.lng) && !isNaN(point.lat)) {
          // {lng, lat} 对象
          originalPath.push([point.lng, point.lat]);
        }
      }
    });

    if (originalPath.length < 2) {
      console.warn('有效轨迹点不足，至少需要2个点', originalPath.length);
      return null;
    }

    // 增强路径点 - 使动画更平滑
    let enhancedPath: [number, number][] = [];
    if (options.exactPath) {
      // 如果要求精确路径，则直接使用原始路径
      enhancedPath = [...originalPath];
    } else {
      // 根据点之间的距离动态插值 - 关键改进点
      const INTERPOLATION_DISTANCE = options.interpolationDistance || 50; // 降低到50米,增加密度
      const MAX_POINTS = 500; // 保持性能的上限
      
      if (originalPath.length <= MAX_POINTS / 2) {
        enhancedPath.push(originalPath[0]);
        
        for (let i = 0; i < originalPath.length - 1; i++) {
          const start = originalPath[i];
          const end = originalPath[i + 1];
          
          // 计算两点之间的大致距离
          const distance = calculateDistance(
            start[1], start[0], 
            end[1], end[0]
          );
          
          if (distance > INTERPOLATION_DISTANCE) {
            // 需要插值以使动画更平滑
            const segments = Math.min(
              Math.ceil(distance / INTERPOLATION_DISTANCE), 
              Math.floor(MAX_POINTS / originalPath.length)
            );
            
            for (let j = 1; j < segments; j++) {
              const ratio = j / segments;
              enhancedPath.push([
                start[0] + (end[0] - start[0]) * ratio,
                start[1] + (end[1] - start[1]) * ratio
              ]);
            }
          }
          
          enhancedPath.push(end);
        }
      } else {
        // 如果原始点太多，直接使用
        enhancedPath = [...originalPath];
      }
    }

    // 使用增强后的路径创建轨迹线和标记点
    const lineOptions = options.lineOptions || {};
    const markerOptions = options.markerOptions || {};

    // 创建经过路径线的样式 - 使用更高的zIndex和更亮的颜色，确保可见性
    const passedLineOptions = {
      ...lineOptions,
      strokeColor: options.passedLineColor || '#FF0000', // 改用鲜红色，确保更明显
      strokeWeight: (lineOptions.strokeWeight || 3) + 3, // 比原线更粗
      strokeOpacity: 1.0, // 完全不透明
      zIndex: (lineOptions.zIndex || 100) + 50, // 更高的层级，确保显示在上方
      ...options.passedLineOptions
    };
    
    // 创建路径线
    const polyline = new window.AMap.Polyline({
      path: enhancedPath,
      strokeColor: lineOptions.strokeColor || '#3366FF',
      strokeOpacity: lineOptions.strokeOpacity !== undefined ? lineOptions.strokeOpacity : 0.9,
      strokeWeight: lineOptions.strokeWeight || 3,
      strokeStyle: lineOptions.strokeStyle || 'solid',
      strokeDasharray: lineOptions.strokeDasharray,
      lineJoin: lineOptions.lineJoin || 'round',
      lineCap: lineOptions.lineCap || 'round',
      zIndex: lineOptions.zIndex || 100,
      map: mapInstance.value
    });
    
    // 创建已走过路径线 - 初始只有第一个点
    const passedPolyline = new window.AMap.Polyline({
      path: [enhancedPath[0]],
      strokeColor: passedLineOptions.strokeColor,
      strokeOpacity: passedLineOptions.strokeOpacity,
      strokeWeight: passedLineOptions.strokeWeight,
      strokeStyle: passedLineOptions.strokeStyle || 'solid',
      strokeDasharray: passedLineOptions.strokeDasharray,
      lineJoin: passedLineOptions.lineJoin || 'round',
      lineCap: passedLineOptions.lineCap || 'round',
      zIndex: 999,
      map: mapInstance.value
    });

    // 计算并存储路径段信息
    const segments: {start: [number, number], end: [number, number], distance: number}[] = [];
    let totalDistance = 0;
    
    for (let i = 0; i < enhancedPath.length - 1; i++) {
      const start = enhancedPath[i];
      const end = enhancedPath[i + 1];
      
      // 计算每段的近似距离
      const distance = calculateDistance(
        start[1], start[0], 
        end[1], end[0]
      );
      
      segments.push({
        start,
        end,
        distance
      });
      
      totalDistance += distance;
    }
    
    // 创建动画状态
    const animationState = {
      startTime: 0,
      lastFrameTime: 0,
      pauseStartTime: 0,
      pausedTime: 0,
      elapsedDistance: 0,
      segments,
      totalDistance,
      requestId: 0,
      loopCount: 0,
      finished: false
    };

    // 创建轨迹点标记
    let marker = null;
    try {
      // 准备标记选项
      const markerPosition = new window.AMap.LngLat(enhancedPath[0][0], enhancedPath[0][1]);
      // 修复：使用正确的marker选项格式
      const markerOptions: Record<string, any> = {
        position: markerPosition,
        anchor: options.markerAnchor || 'center', // 修改为中心锚点，确保完全贴合轨迹
        offset: options.markerOffset || new window.AMap.Pixel(0, 0), // 取消偏移，确保完全贴合轨迹
        angle: options.initialAngle || 0,
        zIndex: 9999, // 使用最高的zIndex确保标记在所有线之上
        map: mapInstance.value,
        autoRotation: options.autoRotation || false,
        // 确保使用正确的像素尺寸 
        size: options.size ? new window.AMap.Size(options.size[0], options.size[1]) : undefined
      };
      
      // 如果提供了图标URL，则使用自定义图标
      if (options?.icon) {
        const iconSize = options.iconSize || [25, 34];
        // 修复：直接在创建Marker时设置icon
        marker = new window.AMap.Marker({
          ...markerOptions,
          icon: new window.AMap.Icon({
            size: new window.AMap.Size(iconSize[0], iconSize[1]),
            image: options.icon,
            imageSize: new window.AMap.Size(iconSize[0], iconSize[1])
          })
        });
      } else {
        marker = new window.AMap.Marker(markerOptions);
      }
    } catch (markerError) {
      console.error('创建轨迹动画标记点失败:', markerError);
      info('无法创建标记点，但轨迹线已显示');
    }

    // 如果需要自动调整视图以适应路径
    if (options?.autoFit) {
      try {
        // 保存当前中心点，以便检测和恢复
        let originalCenter: [number, number] | null = null;
        try {
          const center = mapInstance.value.getCenter();
          if (center && typeof center === 'object' && center.lng !== undefined && center.lat !== undefined &&
              !(center.lng === 0 && center.lat === 0)) {
            originalCenter = [center.lng, center.lat];
            info('保存自动调整视图前的中心点:', originalCenter);
          }
        } catch (e) {
          console.warn('获取地图中心点失败:', e);
        }
        
        // 创建边界对象并扩展至包含所有点
        const bounds = new window.AMap.Bounds();
        let validPoints = 0;
        
        // 只添加有效的点来计算边界
        originalPath.forEach((point: any) => {
          if (point && typeof point === 'object') {
            // 可能是AMap.LngLat对象
            if (typeof point.getLng === 'function' && typeof point.getLat === 'function') {
              bounds.extend(point);
              validPoints++;
            } 
            // 可能是带有lng和lat属性的对象
            else if ('lng' in point && 'lat' in point && 
                !isNaN(point.lng) && !isNaN(point.lat) && 
                !(point.lng === 0 && point.lat === 0)) {
              // 修复：确保转换为LngLat对象后再进行后续操作
              const lngLat = new window.AMap.LngLat(Number(point.lng), Number(point.lat));
              bounds.extend(lngLat);
              validPoints++;
            }
            // 数组格式的坐标点
            else if (Array.isArray(point) && point.length >= 2 && 
                !isNaN(point[0]) && !isNaN(point[1]) && 
                !(point[0] === 0 && point[1] === 0)) {
              // 修复：确保转换为LngLat对象后再进行后续操作
              const lngLat = new window.AMap.LngLat(Number(point[0]), Number(point[1]));
              bounds.extend(lngLat);
              validPoints++;
            }
          }
        });
        
        // 只有当有效点数不少于2个时才调整视图
        if (validPoints >= 2) {
          // 设置地图视图以适应所有点，并添加较大的内边距确保完全显示
          try {
            // 使用合适的内边距，让轨迹点能够充分展示
            const padding = [80, 80, 80, 80]; // 上右下左的内边距
            info('设置地图视图以适应路径点，添加内边距: {}', padding);
            
            // 应用边界并设置内边距 - 使用安全的setBounds函数
            safeSetBounds(bounds, false, padding);
            
            // 额外检查：如果当前缩放级别太高（放大太多），稍微减小以确保看到完整轨迹
            setTimeout(() => {
              if (mapInstance.value) {
                const currentZoom = mapInstance.value.getZoom();
                if (currentZoom && currentZoom > 15) { // 如果缩放级别太高
                  info('当前缩放级别太高({}), 调整为更合适的缩放级别', currentZoom);
                  mapInstance.value.setZoom(Math.max(12, currentZoom - 2)); // 稍微缩小
                }
              }
            }, 100);
          } catch (err) {
            console.error('设置地图边界失败:', err);
            // 备用方法：直接调整缩放级别
            if (mapInstance.value) {
              mapInstance.value.setZoom(12); // 使用更通用的缩放级别
            }
          }
        } else {
          info('轨迹点数量不足或无效，不执行自动调整视图');
        }
      } catch (error) {
        console.error('自动调整视图失败:', error);
      }
    }

    // 创建已走过路径的缓存数组，提高性能
    const passedPathCache = [enhancedPath[0]];

    // 创建全局动画对象
      window._amap_track_animation = {
      polyline,
      passedPolyline,
      marker,
      passedPath: passedPathCache,
        currentIndex: 0,
        paused: false,
      options,
      state: animationState as any
    };

    // 最后确认检查：确保轨迹完全可见
    if ((options.autoFit !== false) && (options.ensureVisible !== false)) {
      // 延迟执行，等待地图其他操作完成
      setTimeout(() => {
        try {
          if (mapInstance.value) {
            // 检查是否所有点都在可视范围内
            const bounds = mapInstance.value.getBounds();
            if (bounds) {
              // 检查随机抽样的轨迹点是否在可视范围内
              let somePointsOutside = false;
              
              // 检查起点、终点和部分中间点
              const checkPoints = [
                points[0], // 起点
                points[points.length - 1], // 终点
                // 随机选择一些中间点进行检查
                ...(points.length > 4 ? [
                  points[Math.floor(points.length * 0.25)], 
                  points[Math.floor(points.length * 0.5)],
                  points[Math.floor(points.length * 0.75)]
                ] : [])
              ];
              
              for (const point of checkPoints) {
                const lngLat = new window.AMap.LngLat(point[0], point[1]);
                if (!bounds.contains(lngLat)) {
                  somePointsOutside = true;
                  info('轨迹点 [{},{}] 不在视图范围内，需要调整', point[0], point[1]);
                  break;
                }
              }
              
              if (somePointsOutside) {
                info('部分轨迹点不在视图范围内，重新调整视图');
                // 创建新的边界对象
                const newBounds = new window.AMap.Bounds();
                // 添加所有轨迹点
                points.forEach(point => {
                  const lngLat = new window.AMap.LngLat(point[0], point[1]);
                  newBounds.extend(lngLat);
                });
                
                // 使用更大的内边距
                safeSetBounds(newBounds, false, [100, 100, 100, 100]);
                
                // 稍微缩小缩放级别，确保完全显示
                setTimeout(() => {
                  const zoom = mapInstance.value.getZoom();
                  if (zoom && zoom > 12) {
                    mapInstance.value.setZoom(zoom - 1);
                  }
                }, 50);
              }
            }
            
            // 再次检查中心点是否为[0,0]
            const currentCenter = mapInstance.value.getCenter();
            if (currentCenter && typeof currentCenter === 'object' && 
                currentCenter.lng !== undefined && currentCenter.lat !== undefined &&
                currentCenter.lng === 0 && currentCenter.lat === 0) {
              // 修复中心点
              const fixCenter = originalCenter || (points[0] ? new window.AMap.LngLat(points[0][0], points[0][1]) : new window.AMap.LngLat(116.397428, 39.90923));
              info('发现中心点为[0,0]，修复为', fixCenter);
              mapInstance.value.setCenter(fixCenter);
            }
          }
        } catch (e) {
          console.warn('确保轨迹可见性检查失败:', e);
        }
      }, 300);
    }

    // 动画配置
    const duration = options?.duration || 5000; // 默认5秒
    const maxLoopCount = options?.loopCount === Infinity || options?.loopCount === 0 ? Infinity : (options?.loopCount || 1);

    // 开始动画循环 - 使用requestAnimationFrame实现高性能动画
    const animate = (timestamp: number) => {
      const animation = window._amap_track_animation as any;
      if (!animation || animation.paused) {
        return;
      }

      const state = animation.state;

      // 初始化开始时间
      if (!state.startTime) {
        state.startTime = timestamp;
        state.lastFrameTime = timestamp;
        state.requestId = requestAnimationFrame(animate);

        // 调用开始回调
        if (options.onStart) {
          options.onStart();
        }
        return;
      }

      // 计算动画进度 - 使用高精度时间
      const elapsedTime = timestamp - (state.startTime || 0) - state.pausedTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // 应用缓动函数使动画更平滑
      // 使用缓入缓出效果让起始和结束更自然，但保持中间过程线性平滑
      const easedProgress = progress < 0.1
        ? progress * 10 * progress / 2
        : progress > 0.9
          ? 0.9 + (progress - 0.9) * (1 - (1 - (progress - 0.9) * 10) / 2)
          : progress;

      // 计算当前应该走过的距离
      const targetDistance = state.totalDistance * easedProgress;

      // 如果动画完成一次循环
      if (progress >= 1) {
        state.loopCount++;

        // 检查是否达到循环次数上限
        if (maxLoopCount !== Infinity && state.loopCount >= maxLoopCount) {
          // 确保marker在终点
          if (animation.marker) {
            // 使用原始路径的最后一个点确保精确定位
            const endPoint = originalPath[originalPath.length - 1];
            const endLngLat = new window.AMap.LngLat(endPoint[0], endPoint[1]);
            animation.marker.setPosition(endLngLat);
          }

          // 绘制完整的已走过路径 - 使用原始路径确保精确性
          // 优先使用enhancedPath以展示更平滑的路径
          animation.passedPath = [];
          enhancedPath.forEach(point => {
            if (Array.isArray(point)) {
              const lngLat = new window.AMap.LngLat(point[0], point[1]);
              animation.passedPath.push(lngLat);
        } else {
              animation.passedPath.push(point);
            }
          });
          animation.passedPolyline.setPath(animation.passedPath);

          // 标记为完成
          state.finished = true;

          // 调用完成回调
          if (options.onComplete) {
            options.onComplete();
          }

          info('轨迹动画播放完成，总循环次数: {}', state.loopCount);
          return;
        }

        // 重置动画状态进行下一次循环
        state.startTime = timestamp;
        state.elapsedDistance = 0;

        // 重置已走过的路径 - 优化内存管理
        animation.passedPath.length = 0;
        animation.passedPath.push(enhancedPath[0]);
        animation.passedPolyline.setPath(animation.passedPath);

        // 将标记移回起点
        if (animation.marker) {
          animation.marker.setPosition(enhancedPath[0]);
        }

        // 调用循环回调
        if (options.onLoop) {
          options.onLoop(state.loopCount);
        }

        info('轨迹动画循环 {}/{}', state.loopCount, maxLoopCount === Infinity ? '无限' : maxLoopCount);

        // 继续下一帧
        state.requestId = requestAnimationFrame(animate);
        return;
      }

      // 计算当前位置
      let accumulatedDistance = 0;
      let currentSegmentIndex = 0;
      let segmentProgress = 0;

      // 找到当前所在路径段
      for (let i = 0; i < state.segments.length; i++) {
        const segment = state.segments[i];

        if (accumulatedDistance + segment.distance >= targetDistance) {
          // 找到当前段
          currentSegmentIndex = i;

          // 计算在当前段内的进度
          segmentProgress = (targetDistance - accumulatedDistance) / segment.distance;
          break;
        }

        accumulatedDistance += segment.distance;
      }

      // 计算当前精确位置（线性插值）
      const currentSegment = state.segments[currentSegmentIndex];
      const currentPosition = [
        currentSegment.start[0] + (currentSegment.end[0] - currentSegment.start[0]) * segmentProgress,
        currentSegment.start[1] + (currentSegment.end[1] - currentSegment.start[1]) * segmentProgress
      ];

      // 创建精确的经纬度对象
      const currentLngLat = new window.AMap.LngLat(currentPosition[0], currentPosition[1]);

      // 更新marker位置 - 强制确保marker在路径上
      if (animation.marker) {
        // 先尝试获取精确的轨迹点
        let actualPosition = null;
        
        try {
          // 获取当前段的真实轨迹路径点作为参考
          const enhancedStart = enhancedPath[Math.max(0, currentSegmentIndex)];
          const enhancedEnd = enhancedPath[Math.min(enhancedPath.length - 1, currentSegmentIndex + 1)];
          
          if (enhancedStart && enhancedEnd) {
            // 获取原始路径线
            const linePath = polyline.getPath();
            
            if (linePath && linePath.length > 0) {
              // 确保我们在计算与投影点最接近的线段
              let bestProjection = null;
              let minDistance = Infinity;
              
              // 扩大搜索范围，确保找到最佳匹配的线段
              const searchRange = 5; // 增加搜索范围
              const startIdx = Math.max(0, currentSegmentIndex - searchRange);
              const endIdx = Math.min(linePath.length - 1, currentSegmentIndex + searchRange);
              
              // 遍历所有可能的线段
              for (let i = startIdx; i < endIdx; i++) {
                if (i >= linePath.length - 1) continue;
                
                const start = linePath[i];
                const end = linePath[i + 1];
                
                if (!start || !end) continue;
                
                // 计算当前位置到该线段的投影点
                const projection = projectPointToLine(currentLngLat, start, end);
                const distance = getDistance(currentLngLat, projection);
                
                if (distance < minDistance) {
                  minDistance = distance;
                  bestProjection = projection;
                }
              }
              
              // 如果找到了投影点，则使用它
              if (bestProjection) {
                actualPosition = bestProjection;
                
                // 更新动画位置，使其沿着原始路径移动
                animation.marker.setPosition(actualPosition);
                
                // 更新路径显示，确保完全贴合轨迹
                if (animation.passedPath && animation.passedPolyline) {
                  updatePassedPath(animation, currentSegmentIndex, actualPosition, enhancedPath);
                }
                
                // 如果启用了实时跟踪，更新地图中心
                if (options.followMarker && mapInstance.value) {
                  mapInstance.value.setCenter(actualPosition);
                }

      // 调用步骤回调
                if (options.onStep) {
                  options.onStep({
                    position: [actualPosition.getLng(), actualPosition.getLat()],
                    progress,
                    segmentIndex: currentSegmentIndex,
                    totalSegments: state.segments.length
                  });
                }
                
                // 记录时间并继续动画
                state.lastFrameTime = timestamp;
                state.requestId = requestAnimationFrame(animate);
                return; // 提前退出，跳过默认处理
              }
            }
          }
        } catch (e) {
          console.warn('精确定位到轨迹线失败，使用默认位置:', e);
        }
        
        // 如果精确定位失败，则使用计算位置
        animation.marker.setPosition(currentLngLat);
      }
    };

    // 开始动画
    if (options.autoPlay !== false) {
      info('自动开始轨迹动画播放，autoPlay = {}', options.autoPlay === true ? 'true' : (options.autoPlay === undefined ? 'undefined' : options.autoPlay));
      animationState.requestId = requestAnimationFrame(animate);
    } else {
      info('轨迹动画等待手动播放，autoPlay = {}', options.autoPlay);
    }

    return { polyline, passedPolyline, marker, state: animationState };
  } catch (error) {
    console.error('开始轨迹动画失败', error);
    return null;
  }
};

// 停止轨迹动画 - 改进释放资源
const stopTrackAnimation = () => {
  if (!window._amap_track_animation) return;

  info('停止高德地图轨迹动画');

  const animation = window._amap_track_animation;

  // 记录当前地图中心点，以便必要时检查是否需要修复
  let centerFixed = false;
  let originalCenter: [number, number] | null = null;
  
  if (mapInstance.value) {
    try {
      const center = mapInstance.value.getCenter();
      if (center && typeof center === 'object' && center.lng !== undefined && center.lat !== undefined) {
        // 记录当前有效的中心点
        if (!(center.lng === 0 && center.lat === 0)) {
          originalCenter = [center.lng, center.lat];
          info('记录停止动画前地图中心点:', originalCenter);
        }
      }
    } catch (e) {
      console.warn('获取地图中心点失败:', e);
    }
  }

  // 取消动画帧请求
  try {
    if (animation.state && typeof animation.state === 'object' && animation.state.requestId) {
      cancelAnimationFrame(animation.state.requestId);
    }
  } catch (e) {
    console.warn('取消动画帧请求失败:', e);
  }

  // 移除地图上的对象 - 按照特定顺序释放资源
  try {
    // 先移除标记点
    if (animation.marker) {
      animation.marker.setMap(null);
      animation.marker = null;
    }

    // 然后移除已走过的路径线
  if (animation.passedPolyline) {
    animation.passedPolyline.setMap(null);
    animation.passedPolyline = null;
  }

    // 最后移除原始路径线
    if (animation.polyline) {
      animation.polyline.setMap(null);
      animation.polyline = null;
    }
  } catch (e) {
    console.error('清理轨迹动画资源失败:', e);
  }

  // 重置轨迹动画对象
  window._amap_track_animation = undefined;
  
  // 防止地图中心点变为[0,0]的最直接方法：检查当前中心点
  if (mapInstance.value && originalCenter) {
    // 重要：首先即时检查一次
    try {
      const currentCenter = mapInstance.value.getCenter();
      if (currentCenter && typeof currentCenter === 'object' && 
          currentCenter.lng !== undefined && currentCenter.lat !== undefined &&
          currentCenter.lng === 0 && currentCenter.lat === 0) {
        // 立即修复[0,0]的中心点
        mapInstance.value.setCenter(originalCenter);
        info('立即修复地图中心点为[0,0]的问题');
        centerFixed = true;
      }
    } catch (e) {
      console.warn('检查地图中心点失败:', e);
    }
    
    // 再延时检查一次，以防止异步操作导致的问题
    if (!centerFixed) {
      setTimeout(() => {
        try {
          if (mapInstance.value) {
            const delayedCenter = mapInstance.value.getCenter();
            if (delayedCenter && typeof delayedCenter === 'object' && 
                delayedCenter.lng !== undefined && delayedCenter.lat !== undefined &&
                delayedCenter.lng === 0 && delayedCenter.lat === 0) {
              mapInstance.value.setCenter(originalCenter);
              info('延时修复地图中心点为[0,0]的问题');
            }
          }
        } catch (e) {
          console.warn('延时检查地图中心点失败:', e);
        }
      }, 50);
    }
  }
};

// 暂停轨迹动画 - 改进性能
const pauseTrackAnimation = () => {
  if (!window._amap_track_animation) return;

  info('暂停高德地图轨迹动画');

  const animation = window._amap_track_animation;

  // 如果已经是暂停状态，不做任何处理
  if (animation.paused) return;

  animation.paused = true;

  // 记录暂停开始时间
  if (animation.state) {
    animation.state.pauseStartTime = performance.now();

    // 取消动画帧请求
    if (animation.state.requestId) {
      cancelAnimationFrame(animation.state.requestId);
      animation.state.requestId = 0;
    }
  }
};

// 继续轨迹动画 - 改进平滑度
const resumeTrackAnimation = () => {
  if (!window._amap_track_animation || !window._amap_track_animation.paused) return;

  info('恢复高德地图轨迹动画');

  const animation = window._amap_track_animation;

  // 计算暂停的时间
  if (animation.state) {
    const now = performance.now();
    animation.state.pausedTime += (now - animation.state.pauseStartTime);
    animation.state.pauseStartTime = 0;
  }

  animation.paused = false;

  // 继续动画 - 使用高性能动画技术
  const continuedAnimate = (timestamp: number) => {
    if (!animation || animation.paused) return;

    const state = animation.state;

    // 初始化时间 - 特殊处理恢复后的第一帧
    if (!state.lastFrameTime) {
      state.lastFrameTime = timestamp;
    }

    // 计算动画进度
    const duration = animation.options.duration || 5000;
    const elapsedTime = (state.startTime !== null) 
      ? timestamp - state.startTime - state.pausedTime
      : 0;
    const progress = Math.min(elapsedTime / duration, 1);

    // 计算当前应该走过的距离
    const targetDistance = state.totalDistance * progress;

    // 如果已经结束，重新从开始执行，否则会从暂停位置继续
    if (progress >= 1) {
      // 重置动画并开始新循环
      state.startTime = timestamp;
      state.pausedTime = 0;
    }

    // 设置下一帧
    state.requestId = requestAnimationFrame(continuedAnimate);
  };

  // 启动动画循环
  animation.state.requestId = requestAnimationFrame(continuedAnimate);
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
  if (currentTool.value !== 'marker' || !addMarkerEnabled.value) return;

  info('AMap点击添加标记 {}', e);

  try {
    // 获取点击位置
    const lngLat = e.lnglat || e.lnglat || {};
    const lngValue = typeof lngLat.getLng === 'function' ? lngLat.getLng() : Number(lngLat.lng);
    const latValue = typeof lngLat.getLat === 'function' ? lngLat.getLat() : Number(lngLat.lat);

    // 创建一个基础标记
    const newMarker: Marker = {
      markerId: `marker_${Date.now()}`,
      position: [lngValue, latValue],
      title: '新标记点',
      label: '新标记点',
      clusterable: true,
      data: {
        id: `marker_${Date.now()}`,
        createTime: new Date().toISOString()
      }
    };

    // 触发标记创建事件
    emit('marker-created', newMarker);

    info('AMap标记创建成功 {}', newMarker);
  } catch (error) {
    console.error('AMap创建标记失败:', error);
  }
};

// 完全重写toggleMarkerLabels方法，使用多种方式来确保标签能够正确显示和隐藏
const toggleMarkerLabels = (show: boolean) => {
  if (!mapInstance.value) return;

  info('尝试{}标记点标签，共 {} 个标记点', show ? '显示' : '隐藏', markersInstances.value.length);

  if (show) {
    // 显示标签 - 遍历所有标记点添加标签
    markersInstances.value.forEach((markerInstance, idx) => {
      try {
        const markerData = (markerInstance as any).__markerData;
        if (!markerData || !markerData.label) return;

        info('显示标记点 {} 标签: {}', idx + 1, markerData.markerId || '无ID');

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

        info('隐藏标记点 {} 标签: {}', idx + 1, markerData.markerId || '无ID');

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
            info('找到 {} 个标签元素进行隐藏', labelElements.length);

            labelElements.forEach((el: HTMLElement, i: number) => {
              info('隐藏标签元素 {}', i + 1);
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
  }

  info('{}标记点标签操作完成', show ? '显示' : '隐藏');
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

// 显示或隐藏所有标记点
const showHideMarkers = (show: boolean) => {
  if (!mapInstance.value) return;
  
  info('尝试{}所有标记点，共 {} 个', show ? '显示' : '隐藏', markersInstances.value.length);
  
  markersInstances.value.forEach(marker => {
    try {
      if (show) {
        marker.show();
      } else {
        marker.hide();
      }
    } catch (e) {
      console.warn('无法控制标记点可见性:', e);
    }
  });
};

// 显示或隐藏所有图形
const showHideShapes = (show: boolean) => {
  if (!mapInstance.value) return;
  
  info('尝试{}所有图形，共 {} 个', show ? '显示' : '隐藏', shapesInstances.value.size);
  
  shapesInstances.value.forEach(shape => {
    try {
      if (show) {
        shape.show();
      } else {
        shape.hide();
      }
    } catch (e) {
      console.warn('无法控制图形可见性:', e);
    }
  });
  
  // 备用方法：使用高德地图API获取所有覆盖物
  try {
    const shapeTypes = ['polygon', 'polyline', 'circle', 'rectangle'];
    shapeTypes.forEach(type => {
      if (mapInstance.value.getAllOverlays) {
        const shapes = mapInstance.value.getAllOverlays(type);
        shapes.forEach((shape: any) => {
          if (shape && typeof shape.show === 'function' && typeof shape.hide === 'function') {
            show ? shape.show() : shape.hide();
          }
        });
      }
    });
  } catch (error) {
    console.warn('使用API控制图形可见性失败:', error);
  }
};

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
    if (!mapInstance.value) return props.center;
    try {
    const center = mapInstance.value.getCenter();
      if (center && typeof center === 'object' && center.lng !== undefined && center.lat !== undefined) {
        // 验证获取的坐标是否为[0,0]，如果是且props.center不是[0,0]，则返回props.center
        if ((center.lng === 0 && center.lat === 0) && 
            (props.center[0] !== 0 || props.center[1] !== 0)) {
          console.warn('地图中心坐标获取到了[0,0]，可能是错误值，使用props.center替代');
          return props.center;
        }
    return [center.lng, center.lat] as [number, number];
      }
    } catch (error) {
      console.error('获取地图中心坐标失败:', error);
    }
    // 确保返回有效的中心点坐标，避免返回[0,0]
    if (props.center[0] === 0 && props.center[1] === 0) {
      // 如果props.center也是[0,0]，返回一个有效的默认值
      return [116.397428, 39.90923]; // 默认北京中心
    }
    return props.center;
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
        info('AMap原始像素坐标: {}', pixel, '容器位置:', containerRect);

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
  },
  startTrackAnimation,
  pauseTrackAnimation,
  resumeTrackAnimation,
  stopTrackAnimation,
  showHideMarkers,
  showHideShapes,
  getAllMarkersInstances: () => markersInstances.value,
  
  // 从标记点获取原始数据
  getMarkerOriginalData: (marker: any): any => {
    // 如果marker为空，返回null
    if (!marker) return null;

    if (marker._originOpts) {
      return marker._originOpts;
    }
    // 1. 首先尝试从__markerData中获取数据，这是创建标记时附加的原始数据
    if (marker.__markerData) {
      // 如果__markerData有data属性，优先返回data
      if (marker.__markerData.data) {
        return marker.__markerData.data;
      }
      // 否则返回__markerData本身
      return marker.__markerData;
    }
    
    // 2. 尝试从高德地图特有的extData获取
    if (marker.getExtData && typeof marker.getExtData === 'function') {
      try {
        const extData = marker.getExtData();
        if (extData) return extData;
      } catch (error) {
        console.warn('获取高德地图标记点extData失败:', error);
      }
    } else if (marker.extData) {
      return marker.extData;
    }
    
    // 3. 尝试从marker上直接获取数据属性
    if (marker.data) {
      return marker.data;
    }
    
    // 4. 尝试通过DOM元素的data-*属性获取数据
    try {
      // 获取标记的DOM元素
      const element = marker.getElement ? marker.getElement() : 
                     (marker.getContent ? marker.getContent() : null);
      
      if (element && element instanceof HTMLElement) {
        const id = element.getAttribute('data-marker-id');
        const title = element.getAttribute('data-marker-title');
        const type = element.getAttribute('data-marker-type');
        
        if (id || title) {
          return {
            id: id,
            title: title,
            type: type,
            // 其他可能的数据属性
          };
        }
      }
    } catch (error) {
      console.warn('通过DOM获取标记点数据失败:', error);
    }
    
    // 5. 如果是通过createMarker创建的，尝试找到对应的原始数据
    const markerId = marker.id || 
                    (marker.getTitle ? marker.getTitle() : null);
    
    if (markerId) {
      // 在标记实例列表中查找对应的标记数据
      const matchedMarker = markersInstances.value.find(m => {
        const mData = (m as any).__markerData;
        return mData && 
              (mData.markerId === markerId || 
               (mData.data && mData.data.id === markerId) ||
               mData.title === markerId);
      });
      
      if (matchedMarker && (matchedMarker as any).__markerData) {
        if ((matchedMarker as any).__markerData.data) {
          return (matchedMarker as any).__markerData.data;
        }
        return (matchedMarker as any).__markerData;
      }
    }
    
    // 6. 如果所有方法都失败，返回marker自身
    return marker;
  }
});

// 添加一个安全的setBounds方法，防止中心点被错误设置为[0,0]
const safeSetBounds = (bounds, immediate = false, padding = [60, 60, 60, 60]) => {
  if (!mapInstance.value || !bounds) return;
  
  // 保存当前地图中心点，以便恢复
  let originalCenter = null;
  try {
    const center = mapInstance.value.getCenter();
    if (center && typeof center === 'object' && center.lng !== undefined && center.lat !== undefined) {
      // 只保存有效的中心点（不是[0,0]）
      if (!(center.lng === 0 && center.lat === 0)) {
        originalCenter = [center.lng, center.lat];
        info('保存当前地图中心点:', originalCenter);
      }
    }
  } catch (e) {
    console.warn('获取原始中心点失败:', e);
  }
  
  // 创建备份中心点 - 从bounds的中心计算
  let backupCenter = null;
  try {
    if (bounds.getCenter) {
      const boundsCenter = bounds.getCenter();
      if (boundsCenter && !isNaN(boundsCenter.lng) && !isNaN(boundsCenter.lat) &&
          !(boundsCenter.lng === 0 && boundsCenter.lat === 0)) {
        backupCenter = [boundsCenter.lng, boundsCenter.lat];
        info('计算边界中心点:', backupCenter);
      }
    }
  } catch (e) {
    console.warn('计算边界中心点失败:', e);
  }
  
  // 如果边界中心点不可用，而我们有原始中心点，确保边界包含该中心点
  if (!backupCenter && originalCenter) {
    try {
      // 扩展边界以包含原始中心点
      bounds.extend(new window.AMap.LngLat(originalCenter[0], originalCenter[1]));
      info('扩展边界以包含原始中心点');
    } catch (e) {
      console.warn('扩展边界失败:', e);
    }
  }
  
  try {
    // 在应用边界前，首先直接设置中心点以防止回到[0,0]
    if (backupCenter) {
      mapInstance.value.setCenter(backupCenter);
      info('预先设置地图中心点:', backupCenter);
    } else if (originalCenter) {
      mapInstance.value.setCenter(originalCenter);
      info('预先设置地图中心点(原始):', originalCenter);
    }
    
    // 然后应用边界 - 不直接设置setBounds，而是使用setFitView
    info('安全设置地图边界并添加内边距:', padding);
    
    // 注意：这里不使用setBounds，而是根据bounds创建一个临时点集以使用setFitView
    const tempPointsLayer = new window.AMap.OverlayGroup();
    
    // 获取bounds的四个角点和中心点，构建临时点集
    const northeast = bounds.getNorthEast();
    const southwest = bounds.getSouthWest();
    const northwest = new window.AMap.LngLat(southwest.getLng(), northeast.getLat());
    const southeast = new window.AMap.LngLat(northeast.getLng(), southwest.getLat());
    const center = bounds.getCenter();
    
    // 创建临时点标记
    [northeast, southwest, northwest, southeast, center].forEach(point => {
      if (point && !isNaN(point.getLng()) && !isNaN(point.getLat())) {
        const tempMarker = new window.AMap.Marker({
          position: point,
          visible: false // 不可见的标记
        });
        tempPointsLayer.addOverlay(tempMarker);
      }
    });
    
    // 将临时点添加到地图
    tempPointsLayer.setMap(mapInstance.value);
    
    // 使用setFitView进行视图调整，这比setBounds更安全
    mapInstance.value.setFitView(tempPointsLayer, false, padding);
    
    // 清理临时点层
    setTimeout(() => {
      tempPointsLayer.clearOverlays();
      tempPointsLayer.setMap(null);
    }, 100);
    
    // 检查设置后的中心点是否有效
    setTimeout(() => {
      try {
        if (!mapInstance.value) return;
        
        const newCenter = mapInstance.value.getCenter();
        if (newCenter && typeof newCenter === 'object' && 
            newCenter.lng !== undefined && newCenter.lat !== undefined &&
            (newCenter.lng === 0 && newCenter.lat === 0)) {
          
          // 如果中心点变为[0,0]，先尝试使用边界中心点
          if (backupCenter) {
            info('检测到中心点为[0,0]，使用边界中心点修复:', backupCenter);
            mapInstance.value.setCenter(backupCenter);
          } 
          // 如果没有边界中心点，使用原中心点
          else if (originalCenter) {
            info('检测到中心点为[0,0]，使用原始中心点修复:', originalCenter);
            mapInstance.value.setCenter(originalCenter);
          }
          // 如果都没有，使用默认中心点
          else {
            const defaultCenter = [116.397428, 39.90923]; // 默认北京中心
            info('检测到中心点为[0,0]，使用默认中心点修复:', defaultCenter);
            mapInstance.value.setCenter(defaultCenter);
          }
          
          // 强制重绘地图确保更新
          mapInstance.value.setZoom(mapInstance.value.getZoom());
        }
      } catch (e) {
        console.warn('检查中心点有效性失败:', e);
      }
    }, 100); // 增加检查延迟
  } catch (error) {
    console.error('设置地图边界失败:', error);
    
    // 如果设置边界失败，尝试直接设置中心点
    try {
      if (backupCenter && mapInstance.value) {
        info('设置边界失败，直接设置中心点:', backupCenter);
        mapInstance.value.setCenter(backupCenter);
        mapInstance.value.setZoom(12); // 使用合理的缩放级别
      } else if (originalCenter && mapInstance.value) {
        info('设置边界失败，使用原始中心点:', originalCenter);
        mapInstance.value.setCenter(originalCenter);
        mapInstance.value.setZoom(12);
      }
    } catch (e) {
      console.error('恢复中心点失败:', e);
    }
  }
};

// 计算点到线段的投影点 - 改进算法确保点位在轨迹线上
const projectPointToLine = (point, lineStart, lineEnd) => {
  try {
    // 获取点和线段端点的经纬度
    const px = typeof point.getLng === 'function' ? point.getLng() : point[0];
    const py = typeof point.getLat === 'function' ? point.getLat() : point[1];
    const ax = typeof lineStart.getLng === 'function' ? lineStart.getLng() : lineStart[0];
    const ay = typeof lineStart.getLat === 'function' ? lineStart.getLat() : lineStart[1];
    const bx = typeof lineEnd.getLng === 'function' ? lineEnd.getLng() : lineEnd[0];
    const by = typeof lineEnd.getLat === 'function' ? lineEnd.getLat() : lineEnd[1];

    // 线段向量
    const abx = bx - ax;
    const aby = by - ay;
    // 点到线段起点的向量
    const apx = px - ax;
    const apy = py - ay;

    // 计算向量点积
    const dotProduct = apx * abx + apy * aby;
    // 计算线段长度的平方
    const abLengthSq = abx * abx + aby * aby;

    // 计算投影点参数t (0-1之间表示在线段上，小于0在起点外，大于1在终点外)
    let t = dotProduct / abLengthSq;
    // 限制t在0-1之间，确保投影点在线段上
    t = Math.max(0, Math.min(1, t));

    // 计算投影点坐标 - 确保精确到小数点后8位，避免浮点误差
    const projectedX = parseFloat((ax + t * abx).toFixed(8));
    const projectedY = parseFloat((ay + t * aby).toFixed(8));

    // 返回投影点坐标作为AMap.LngLat对象
    return new window.AMap.LngLat(projectedX, projectedY);
  } catch (e) {
    console.warn('计算投影点失败', e);
    // 默认返回原点
    return point;
  }
};

// 获取两点间距离（米）
const getDistance = (point1, point2) => {
  try {
    // 使用高德地图的距离计算方法
    const lng1 = typeof point1.getLng === 'function' ? point1.getLng() : point1[0];
    const lat1 = typeof point1.getLat === 'function' ? point1.getLat() : point1[1];
    const lng2 = typeof point2.getLng === 'function' ? point2.getLng() : point2[0];
    const lat2 = typeof point2.getLat === 'function' ? point2.getLat() : point2[1];
    
    // 创建经纬度对象
    const lngLat1 = new window.AMap.LngLat(lng1, lat1);
    const lngLat2 = new window.AMap.LngLat(lng2, lat2);
    
    // 计算距离（米）
    return lngLat1.distance(lngLat2);
  } catch (e) {
    console.warn('计算距离失败', e);
    // 使用简单的欧几里得距离作为备用方法
    return Math.sqrt(
      Math.pow((point1.lng || point1[0] || 0) - (point2.lng || point2[0] || 0), 2) +
      Math.pow((point1.lat || point1[1] || 0) - (point2.lat || point2[1] || 0), 2)
    ) * 111000; // 大致换算为米
  }
};

// 计算两点之间的球面距离（米）
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  try {
    // 优先使用高德地图的工具函数
    if (window.AMap && window.AMap.GeometryUtil && window.AMap.GeometryUtil.distance) {
      return window.AMap.GeometryUtil.distance(
        new window.AMap.LngLat(lng1, lat1),
        new window.AMap.LngLat(lng2, lat2)
      );
    }

    // 备用方案：使用简化的球面距离计算（哈弗辛公式）
    const R = 6371000; // 地球半径，单位米
    const rad = Math.PI / 180;
    const lat1Rad = lat1 * rad;
    const lat2Rad = lat2 * rad;
    const latDiff = (lat2 - lat1) * rad;
    const lngDiff = (lng2 - lng1) * rad;

    const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(lngDiff / 2) * Math.sin(lngDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  } catch (e) {
    console.warn('计算距离出错:', e);
    // 返回一个估算距离，避免动画中断
    return 100; // 默认100米
  }
};

// 更新轨迹路径中的某个位置
const updatePathWithPosition = (position, segmentIndex, animation) => {
  if (!animation || !animation.passedPath || !position) return;
  
  try {
    // 获取位置对象
    const lng = typeof position.getLng === 'function' ? position.getLng() : (position.lng || 0);
    const lat = typeof position.getLat === 'function' ? position.getLat() : (position.lat || 0);
    const posObj = new window.AMap.LngLat(lng, lat);
    
    // 更新路径中对应位置的点
    if (animation.passedPath.length <= segmentIndex + 1) {
      animation.passedPath.push(posObj);
    } else {
      animation.passedPath[segmentIndex + 1] = posObj;
      // 截断数组，仅保留到当前段的部分
      animation.passedPath.length = segmentIndex + 2;
    }
    
    // 更新经过线的路径
    if (animation.passedPolyline) {
      // 确保路径完全贴合原始轨迹
      try {
        // 使用原始轨迹点(enhancedPath)重建已走过的部分，确保精确贴合轨迹
        const newPath = [];
        
        // 先加入已走过的所有完整段，使用原始轨迹点确保精确贴合
        if (animation.segments && animation.segments.length > 0) {
          // 先添加所有已完全通过的段起点
          for (let i = 0; i < segmentIndex; i++) {
            if (animation.segments[i] && animation.segments[i].start) {
              newPath.push(animation.segments[i].start);
            }
          }
          
          // 添加当前段的起点
          if (animation.segments[segmentIndex] && animation.segments[segmentIndex].start) {
            newPath.push(animation.segments[segmentIndex].start);
          }
        } else {
          // 备用方法：直接使用已走过路径
          for (let i = 0; i < segmentIndex; i++) {
            if (i < animation.passedPath.length) {
              newPath.push(animation.passedPath[i]);
            }
          }
        }
        
        // 最后添加当前精确位置点
        newPath.push(posObj);
        
        // 设置新路径
        animation.passedPolyline.setPath(newPath);
      } catch (e) {
        // 如果优化失败，使用原始方式
        animation.passedPolyline.setPath(animation.passedPath);
        console.warn('优化路径更新失败，使用原始更新方式:', e);
      }
    }
  } catch (e) {
    console.warn('更新路径点失败:', e);
  }
};

// 更新已走过的路径 - 使用增强版算法确保轨迹准确呈现
const updatePassedPath = (animation, currentSegmentIndex, currentPosition, enhancedPath) => {
  if (!animation || !animation.passedPath || !animation.passedPolyline) return;

  try {
    // 收集已走过的完整路径段
    const passedPath = [];
    
    // 添加所有已走过的段的起点 - 使用原始轨迹确保准确性
    for (let i = 0; i <= currentSegmentIndex; i++) {
      if (i < enhancedPath.length) {
        passedPath.push(enhancedPath[i]);
      }
    }
    
    // 添加当前位置作为路径的最后一个点
    if (currentPosition) {
      // 如果当前位置与上一个点相同，不重复添加
      const lastPoint = passedPath[passedPath.length - 1];
      const currentLng = typeof currentPosition.getLng === 'function' ? currentPosition.getLng() : currentPosition[0];
      const currentLat = typeof currentPosition.getLat === 'function' ? currentPosition.getLat() : currentPosition[1];
      
      // 检查最后添加的点是否就是当前位置
      let shouldAdd = true;
      if (lastPoint) {
        const lastLng = typeof lastPoint.getLng === 'function' ? lastPoint.getLng() : lastPoint[0];
        const lastLat = typeof lastPoint.getLat === 'function' ? lastPoint.getLat() : lastPoint[1];
        
        // 如果与最后一个点距离太近，不添加
        if (Math.abs(lastLng - currentLng) < 0.0000001 && Math.abs(lastLat - currentLat) < 0.0000001) {
          shouldAdd = false;
        }
      }
      
      if (shouldAdd) {
        passedPath.push(currentPosition);
      }
    }
    
    // 更新已走过路径
    animation.passedPath = passedPath;
    animation.passedPolyline.setPath(passedPath);
  } catch (e) {
    console.warn('更新已走过路径失败', e);
  }
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