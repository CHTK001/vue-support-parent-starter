/**
 * 地图类型
 */
export type MapType = 'amap' | 'bmap' | 'gmap' | 'tmap' | 'offline';

/**
 * 地图视图类型
 */
export type MapViewType = 'normal' | 'satellite' | 'terrain' | 'hybrid';

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
 * 地图标记点
 */
export interface Marker {
  // 位置 [经度, 纬度]
  position: [number, number];
  // 标题
  title?: string;
  // 图标URL
  icon?: string;
  // 标签内容
  label?: string;
  // 自定义数据
  data?: any;
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
  // 地图高度
  height?: string;
  // 地图宽度
  width?: string;
  // 是否显示缩放控件
  zoomControl?: boolean;
  // 是否显示比例尺控件
  scaleControl?: boolean;
  // 是否允许拖动
  draggable?: boolean;
  // 是否允许滚轮缩放
  scrollWheel?: boolean;
  // 地图样式
  mapStyle?: string;
  // 离线地图配置
  offlineConfig?: OfflineMapConfig;
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