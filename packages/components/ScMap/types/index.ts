import type { Component } from 'vue';
import type { OverviewOptions } from '../plugin/Overview';
import type { LatLng, Icon } from 'leaflet';
import type { LatLngExpression, PointExpression, LeafletEventHandlerFnMap } from 'leaflet'

// 定义Theme和PositionType类型
export type Theme = 'light' | 'dark';
export type PositionType = 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

// 单个地图类型接口
export interface MapTypeItem {
  name: string;       // 地图类型名称
  url: string;        // 瓦片图URL
  attribution: string; // 版权信息
  image?: string;     // 图层预览图片
}

// 地图类型集合接口
export interface MapTypes {
  [key: string]: MapTypeItem;
}

// 聚合功能配置接口
export interface AggregationOptions {
  // 是否启用聚合
  enabled?: boolean;
  // 聚合距离半径
  maxClusterRadius?: number;
  // 聚合半径单位: 'pixel' | 'kilometer'
  radiusUnit?: 'pixel' | 'kilometer';
  // 聚合点基本颜色
  color?: string;
  // 聚合点边框颜色
  borderColor?: string;
  // 是否根据数量作为权重
  useWeightAsSize?: boolean;
  // 是否在聚合点中显示数量
  showCount?: boolean;
  // 最小聚合数量
  minClusterSize?: number;
  // 最大聚合点尺寸
  maxClusterSize?: number;
  // 默认聚合点大小
  defaultSize?: number;
  // 是否启用扩散效果
  enablePulse?: boolean;
  // 扩散动画持续时间(ms)
  pulseDuration?: number;
  // 扩散大小缩放比例
  pulseScale?: number;
  // 扩散动画颜色，默认使用color
  pulseColor?: string;
  // 扩散动画透明度
  pulseOpacity?: number;
  // 每秒扩散次数
  pulseFrequency?: number;
  // 聚合点图片URL
  clusterImageUrl?: string;
  // 聚合点图片大小，默认使用计算的尺寸
  clusterImageSize?: number;
  // 是否为图片添加扩散效果
  enableImagePulse?: boolean;
  // 聚合点样式
  clusterIconStyle?: any;
  // 是否缩放到聚合范围当点击聚合点时
  zoomToBoundsOnClick?: boolean;
  // 是否在添加/删除点位时自动重新聚合
  autoRecluster?: boolean;
  // 自动重聚合延迟时间(ms)，用于避免频繁更新
  reclusterDelay?: number;
  // 自定义聚合点图标函数
  iconCreateFunction?: (cluster: any) => any;
  // 颜色范围配置，基于聚合点数量设置不同颜色
  colorRanges?: Array<{
    // 数量阈值，当聚合点数量超过此值时使用这个颜色
    value: number;
    // 对应的颜色
    color: string;
  }>;
}

// 组件属性
export interface ScMapProps {
  // 地图高度
  height?: string;
  // 地图类型对象
  mapType?: Record<string, any>;
  // 当前图层类型
  layerType?: string;
  // 自定义URL（优先级高于mapType）
  url?: string;
  // 中心点
  center?: [number, number];
  // 缩放级别
  zoom?: number;
  // 是否可拖动
  dragging?: boolean;
  // 是否允许滚轮缩放
  scrollWheelZoom?: boolean;
  // API密钥（如果瓦片服务需要）
  apiKey?: string;
  // 是否显示工具栏
  showToolbar?: boolean;
  // 工具栏配置
  toolbarConfig?: ToolbarConfig;
  // 向下兼容 - 自定义工具列表
  toolbar?: ToolItem[];
  // 鹰眼控件配置
  overviewConfig?: OverviewOptions;
  // 聚合功能配置
  aggregationConfig?: AggregationOptions;
  // 轨迹播放器配置
  trackPlayerConfig?: TrackPlayerConfig;
}
// 工具栏配置接口
export interface ToolbarConfig {
  // 工具栏位置
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  // 工具栏方向
  direction?: 'horizontal' | 'vertical';
  // 每行/列显示的工具数量
  itemsPerLine?: number;
  // 工具栏按钮大小
  size?: number;
  // 自定义工具列表
  items?: ToolItem[];
  // 按钮开关配置
  buttons?: {
    measure?: boolean,
    drawPoint?: boolean,
    coordinate?: boolean,
    zoomIn?: boolean,
    zoomOut?: boolean,
    fullView?: boolean,
    layerSwitch?: boolean,
    toggleMarkers?: boolean
  };
}
// 工具按钮接口
export interface ToolItem {
  id: string;
  name: string;
  icon: string | Component;
  /**
   * 工具的激活状态
   * - `true`: 工具被激活
   * - `false`: 工具被隐藏，不会在工具栏中显示
   * - `undefined`: 工具可见但未激活
   */
  active?: boolean;
  tooltip?: string;
  handler?: () => void;
  /**
   * 是否支持与其他工具同时激活
   * - `true`: 该工具可以与其他工具同时处于激活状态
   * - `false`或`undefined`: 激活该工具时会停用其他工具
   */
  multi?: boolean;
  /**
   * 是否显示该工具
   * - `true`或`undefined`: 显示该工具
   * - `false`: 隐藏该工具，但仍保留在工具列表中
   */
  show?: boolean;
  /**
   * 切换状态（用于可切换工具如标记显示/隐藏）
   * - `true`: 表示处于"开"状态（如标记已隐藏）
   * - `false`或`undefined`: 表示处于"关"状态（如标记已显示）
   */
  toggleState?: boolean;
  /**
   * 切换状态时的替代图标，用于可切换工具
   */
  alternateIcon?: string | Component;
  /**
   * 保存工具原始图标，在切换状态时使用
   */
  originalIcon?: string | Component;
}

// 面板位置类型
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 面板方向类型
export type ToolbarDirection = 'horizontal' | 'vertical';

// 添加自定义工具
export interface AddToolOptions extends ToolItem {
  index?: number;
}
// 图层类型枚举
export enum LayerType {
  NORMAL = 'NORMAL',
  SATELLITE = 'SATELLITE',
  HYBRID = 'HYBRID',
  TRAFFIC = 'TRAFFIC',
  ROAD = 'ROAD'
}

// 轨迹点类型定义
export interface TrackPoint {
  // 纬度
  lat: number;
  // 经度
  lng: number;
  // 时间戳（Unix时间戳，单位：秒）
  time: number;
  // 方向（可选，0-360度，顺时针方向）
  dir?: number;
  // 速度（可选，单位：km/h, 覆盖轨迹播放器默认速度）
  speed?: number;
  // 标题（可选，显示在标记上的信息）
  title?: string;
  // 附加信息（可选，用于标记弹窗或其他展示）
  info?: Array<{key: string, value: string}>;
}

// 图标与速度分组接口
export interface IconSpeedGroup {
  // 最小速度范围（km/h），大于等于此速度
  minSpeed: number;
  // 最大速度范围（km/h），小于等于此速度
  maxSpeed: number;
  // 该速度下显示的图标URL
  iconUrl: string;
  // 图标宽度（可选）
  width?: number;
  // 图标高度（可选）
  height?: number;
}

// 轨迹数据接口
export interface Track {
  // 轨迹ID
  id: string;
  // 轨迹名称
  name: string;
  // 轨迹点数组
  points: TrackPoint[];
  // 轨迹颜色（可选）
  color?: string;
  // 图标URL（可选）
  iconUrl?: string;
  // 基于速度的图标分组（可选），优先级高于iconUrl
  iconGroup?: IconSpeedGroup[];
  // 是否可见
  visible?: boolean;
}

// 轨迹播放控制器选项
export interface TrackPlayerOptions {
  // 播放速度 (km/h)
  speed?: number;
  // 最大播放速度
  maxSpeed?: number;
  // 速度倍率
  speedMultiplier?: number;
  // 是否循环播放
  loop?: boolean;
  // 是否自动播放
  autoPlay?: boolean;
  // 是否跟随播放标记移动地图
  followMarker?: boolean;
  // 是否自动跟随轨迹镜头移动（追踪视角）
  followCamera?: boolean;
  // 是否自动将地图中心设置到轨迹起点
  autoCenter?: boolean;
  // 播放器位置
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  // 轨迹线样式
  trackLineOptions?: {
    color?: string;
    weight?: number;
    opacity?: number;
    isDraw?: boolean;
    showArrow?: boolean;
  };
  // 已走过轨迹样式
  passedLineOptions?: {
    color?: string;
    weight?: number;
    opacity?: number;
  };
  // 未走过轨迹样式
  notPassedLineOptions?: {
    color?: string;
    weight?: number
    opacity?: number;
  };
  // 轨迹点样式
  trackPointOptions?: {
    radius?: number;
    color?: string;
    fillColor?: string;
    opacity?: number;
    showPoints?: boolean;
    isDraw?: boolean;
  };
  // 标记样式
  markerOptions?: {
    icon?: Icon;
    useImg?: boolean;
    imgUrl?: string;
    width?: number;
    height?: number;
    rotate?: boolean;
    rotationOffset?: number;
    color?: string;
    fillColor?: string;
  };
}

// 轨迹播放组件属性
export interface TrackPlayerComponentProps {
  // 是否显示轨迹播放组件
  visible?: boolean;
  // 位置
  position?: 'top-right' | 'bottom-right';
  // 大小
  size?: 'small' | 'medium' | 'large';
  // 主题
  theme?: 'light' | 'dark';
}

// 轨迹播放器配置接口
export interface TrackPlayerConfig {
  // 轨迹列表
  trackList?: Track[];
  // 播放器位置
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  // 是否自动将地图中心设置到轨迹起点
  autoCenter?: boolean;
  // 是否自动跟随轨迹镜头移动（追踪视角）
  followCamera?: boolean;
  // 速度倍率
  speedMultiplier?: number;
}
