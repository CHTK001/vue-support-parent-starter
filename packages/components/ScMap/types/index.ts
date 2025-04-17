/**
 * 地图类型
 */
export type MapType = 'amap' | 'bmap' | 'gmap' | 'tmap' | 'offline';

/**
 * 地图视图类型
 */
export type MapViewType = 'normal' | 'satellite' | 'terrain' | 'hybrid';

/**
 * 图形类型
 */
export type ShapeType = 'circle' | 'polygon' | 'rectangle' | 'polyline';

/**
 * 工具类型
 */
export type ToolType = ShapeType | 'ruler' | 'distance' | 'marker' | 'clear' | 'position' | 'debug' | 'showLabels' | 'cluster' | 'showMarkers' | 'showShapes';

/**
 * 离线地图配置
 */
export interface OfflineMapConfig {
  // 瓦片图层URL模板，例如 '/tiles/{z}/{x}/{y}.png'
  tileUrlTemplate: string;
  // 瓦片图层子域名
  subdomains?: string[];
  // 最小缩放级别
  minZoom?: number;
  // 最大缩放级别
  maxZoom?: number;
  // 瓦片大小
  tileSize?: number;
  // 瓦片图层归属信息
  attribution?: string;
}

/**
 * 聚合配置
 */
export interface ClusterOptions {
  // 是否启用聚合
  enable?: boolean;
  // 聚合半径，单位像素
  radius?: number;
  // 最小聚合数量
  minClusterSize?: number;
  // 网格大小
  gridSize?: number;
  // 最大缩放级别，超过该级别不再聚合
  maxZoom?: number;
  // 是否根据标记点权重进行聚合样式计算
  useWeight?: boolean;
  // 聚合点中显示的数字是否加权
  showWeightSum?: boolean;
  // 权重计算算法，可选'sum'（求和）或'max'（取最大值）
  weightAlgorithm?: 'sum' | 'max';
  // 聚合样式
  styles?: Array<{
    // 聚合点大小
    size?: number;
    // 背景色
    backgroundColor?: string;
    // 文字颜色
    textColor?: string;
    // 边框宽度
    borderWidth?: number;
    // 边框颜色
    borderColor?: string;
    // 应用此样式的最小权重值 - 仅在useWeight为true时有效
    minWeight?: number;
    // 应用此样式的最大权重值 - 仅在useWeight为true时有效
    maxWeight?: number;
  }>;
}

/**
 * 标记点组到图标的映射类型
 */
export interface MarkerGroupIconMap {
  [group: string]: string;
}

/**
 * 地图标记点
 */
export interface Marker {
  // 标记点ID，用于唯一标识标记点
  markerId?: string;
  // 位置 [经度, 纬度]
  position: [number, number];
  // 标题
  title?: string;
  // 图标URL，支持PNG、JPG、SVG等格式，优先级高于group
  // 高德地图建议尺寸：25x25或36x36像素
  // 百度地图会自动调整为固定大小
  // 天地图建议使用有透明背景的图标
  icon?: string;
  // 标记点组，当没有icon时使用group对应的图标
  group?: string;
  // 图标尺寸 [宽度, 高度]，单位像素
  size?: [number, number];
  // 标签内容
  label?: string;
  // 自定义数据
  data?: any;
  // 是否允许聚合（仅在聚合启用时有效）
  clusterable?: boolean;
  // 标记点分类，用于分组显示或隐藏
  category?: string;
  // 是否显示
  visible?: boolean;
  // 是否可拖动
  draggable?: boolean;
  // 标记点颜色
  color?: string;
  // 标记点权重，用于聚合时计算样式和排序，默认为1
  weight?: number;
  // 是否启用点击弹窗
  clickPopover?: boolean;
  // 点击弹窗内容模板，支持插值表达式，例如：${marker.title}
  clickPopoverTemplate?: string;
  // 是否允许删除，默认为true
  canDelete?: boolean;
  // 是否允许右键菜单，默认为true
  canMenu?: boolean;
}

/**
 * 图形数据
 */
export interface Shape {
  // 图形ID
  id: string;
  // 图形类型
  type: ShapeType;
  // 图形路径点集合
  path: [number, number][] | [number, number][][];
  // 圆形半径，仅当type为circle时有效，单位米
  radius?: number;
  // 图形样式
  style?: ShapeStyle;
  // 自定义数据
  data?: any;
  // 是否填充图形，默认为true
  isFill?: boolean;
  // 填充颜色，将覆盖style中的fillColor
  fillColor?: string;
  // 是否允许删除，默认为true
  canDelete?: boolean;
  // 是否允许右键菜单，默认为true
  canMenu?: boolean;
}

/**
 * 图形样式
 */
export interface ShapeStyle {
  // 填充颜色
  fillColor?: string;
  // 填充透明度
  fillOpacity?: number;
  // 边框颜色
  strokeColor?: string;
  // 边框宽度
  strokeWeight?: number;
  // 边框透明度
  strokeOpacity?: number;
  // 边框样式：solid实线，dashed虚线
  strokeStyle?: 'solid' | 'dashed';
}

/**
 * 工具控制选项
 */
export interface ToolsOptions {
  // 是否启用绘制圆形工具
  circle?: boolean;
  // 是否启用绘制多边形工具
  polygon?: boolean;
  // 是否启用绘制矩形工具
  rectangle?: boolean;
  // 是否启用绘制线段工具
  polyline?: boolean;
  // 是否启用测距工具
  distance?: boolean;
  // 是否启用标记点工具
  marker?: boolean;
  // 是否启用清除工具
  clear?: boolean;
  // 调试选项
  debug?: boolean;
  // 是否显示坐标
  position?: boolean;
  // 是否显示标记点标签
  showLabels?: boolean;
  // 是否启用点聚合
  cluster?: boolean;
  // 是否显示标记点
  showMarkers?: boolean;
  // 是否显示图形
  showShapes?: boolean;
}

/**
 * 地图配置选项
 */
export interface MapOptions {
  // 地图类型
  type: MapType;
  // API密钥
  apiKey: string;
  // 中心点 [经度, 纬度]
  center: [number, number];
  // 缩放级别
  zoom: number;
  // 地图视图类型
  viewType?: MapViewType;
  // 标记点
  markers?: Marker[];
  // 图形
  initialShapes?: Shape[];
  // 地图高度
  height?: string;
  // 地图宽度
  width?: string;
  // 是否显示绘图工具控件
  drawingControl?: boolean;
  // 工具控制选项
  toolsOptions?: ToolsOptions;
  // 是否允许拖动
  draggable?: boolean;
  // 是否允许滚轮缩放
  scrollWheel?: boolean;
  // 地图样式
  mapStyle?: string;
  // 离线地图配置
  offlineConfig?: OfflineMapConfig;
  // 是否开启聚合
  enableCluster?: boolean;
  // 标记点聚合配置
  clusterOptions?: ClusterOptions;
  // 悬停弹窗内容模板，支持插值表达式，例如：${marker.title}
  popoverTemplate?: string;
}

/**
 * 点击事件返回数据
 */
export interface MapClickEvent {
  // 位置 [经度, 纬度]
  position: [number, number];
  // 原始事件对象
  originalEvent: any;
}

/**
 * 图形点击事件返回数据
 */
export interface ShapeClickEvent {
  // 图形数据
  shape: Shape;
  // 点击位置 [经度, 纬度]
  position: [number, number];
  // 原始事件对象
  originalEvent: any;
}

/**
 * 聚合点击事件返回数据
 */
export interface ClusterClickEvent {
  // 聚合点中心位置 [经度, 纬度]
  position: [number, number];
  // 聚合点包含的标记点数量
  count: number;
  // 聚合点包含的标记点
  markers: Marker[];
  // 原始事件对象
  originalEvent: any;
  // 聚合点中标记点的总权重，仅在使用权重聚合时有效
  totalWeight?: number;
}

/**
 * 测距结果事件数据
 */
export interface DistanceResultEvent {
  // 距离，单位米
  distance: number;
  // 路径点集合
  path: [number, number][];
  // 原始事件对象
  originalEvent: any;
}

/**
 * 轨迹动画配置选项
 */
export interface TrackAnimationOptions {
  // 轨迹图标URL
  icon?: string;
  // 轨迹图标尺寸 [宽度, 高度]，单位像素
  iconSize?: [number, number];
  // 播放时长，单位毫秒
  duration?: number;
  // 循环次数，0为无限循环
  loopCount?: number;
  // 轨迹线颜色
  lineColor?: string;
  // 轨迹线宽度
  lineWidth?: number;
  // 轨迹线透明度
  lineOpacity?: number;
  // 是否自动播放
  autoPlay?: boolean;
  // 是否自动缩放地图以适应轨迹路径
  autoFit?: boolean;
  // 是否显示轨迹线
  showTrack?: boolean;
  // 是否显示方向箭头
  showDirection?: boolean;
}

/**
 * 更新MapToolBar组件的emit类型，添加第三个参数表示开关状态
 */
export interface MapToolbarEmits {
  (e: 'tool-click', toolId: string, callback?: string, state?: boolean): void;
  (e: 'toggle-collapse'): void;
  (e: 'category-toggle', category: string, visible: boolean): void;
  (e: 'update:modelValue', value: string): void;
  (e: 'update:showPosition', show: boolean): void;
  (e: 'debug-toggle'): void;
}

// 全局声明轨迹动画类型
declare global {
  interface Window {
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

// 添加弹窗显示事件数据类型定义
export interface PopoverShowEvent {
  // 相关标记数据
  marker: Marker | ClusterClickEvent;
  // 弹窗DOM元素
  element: HTMLElement;
  // 弹窗位置 [经度, 纬度]
  position: [number, number];
}

// 添加弹窗隐藏事件数据类型定义
export interface PopoverHideEvent {
  // 相关标记数据
  marker: Marker | ClusterClickEvent;
}

/**
 * 地图脚本URL配置
 */
export interface MapScriptConfig {
  // 高德地图脚本URL
  amap?: string;
  // 百度地图脚本URL
  bmap?: string;
  // 谷歌地图脚本URL
  gmap?: string;
  // 天地图脚本URL
  tmap?: string;
  // 高德地图UI库URL
  amapUI?: string;
  // 高德地图绘制库URL
  amapDrawing?: string;
  // 百度地图绘制库URL
  bmapDrawing?: string;
} 