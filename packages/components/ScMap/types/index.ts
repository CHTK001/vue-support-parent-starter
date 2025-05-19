/**
 * 地图相关配置
 */
import type { MapUrlConfig } from "./map";
import { MapType, RenderMode } from "./map";
import type { ToolbarConfig, ToolItem } from "./toolbar";
import type { CoordinateOptions } from "../composables/CoordinateObject";
import { OverviewMapConfig } from "../components/OverviewMap.vue";
import { AggregationOptions } from './cluster';
import { MarkerConfig } from './marker';

/**
 * 类型定义索引文件
 */

// 地图类型相关定义
export * from './map';

// 工具栏相关定义
export * from './toolbar';

// 标记点相关定义
export * from './marker';

// 聚合相关定义
export * from './cluster';

// 图形相关定义
export * from './shape';

// 轨迹相关定义
export * from './track';

// 热力图相关定义
export * from './heatmap';

// 轨迹播放器相关定义
export * from './trackplayer';

// 飞行线相关定义
export * from './flightline';

/**
 * 图层类型枚举
 */
export enum MapTile {
  /**
   * 普通地图
   */
  NORMAL = 'normal',
  /**
   * 卫星图
   */
  SATELLITE = 'satellite',
  /**
   * 混合图（卫星+标注）
   */
  HYBRID = 'hybrid',
  TERRAIN = 'terrain',
  DARK = 'dark',
  LIGHT = 'light'
}

/**
 * 数据类型枚举
 */
export enum DataType {
  /** 标记点 */
  MARKER = 'marker',
  /** 图形 */
  SHAPE = 'shape',
  /** 轨迹 */
  TRACK = 'track',
  /** 轨迹点 */
  TRACK_POINT = 'track_point',
  /** 弹窗 */
  POPOVER = 'popover',
  /** 网格 */
  GRID = 'grid'
}

// 地图类型配置
export interface MapConfig {
  mapType: MapType;
  mapTile: MapTile;
  map: {
    [key in MapType]: {
      [key: string]: MapUrlConfig
    }
  };
  mapKey: {
    [key in MapType]?: string
  };
  height: number;
  center: [number, number];
  zoom: number;
  dragging: boolean;
  scrollWheelZoom: boolean;
  // 渲染模式
  renderMode?: RenderMode;
  // 是否显示工具栏
  showToolbar?: boolean;
  // 工具栏配置
  toolbarConfig?: ToolbarConfig;
  // 向下兼容 - 自定义工具列表
  toolbar?: ToolItem[];
  // 坐标面板配置
  coordinateOptions?: CoordinateOptions;
  // 鹰眼地图配置
  overviewMapConfig?: OverviewMapConfig;
  // 是否显示比例尺
  showScaleLine?: boolean;
}

/**
 * 热力图点数据
 */
export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight?: number;
  radius?: number;
  data?: any;
}

/**
 * 热力图配置
 */
export interface HeatmapConfig {
  radius?: number;
  blur?: number;
  gradient?: {
    [key: string]: string;
  };
  opacity?: number;
  maxZoom?: number;
  minOpacity?: number;
  max?: number;
  useLocalExtrema?: boolean;
  useCustomGradient?: boolean;
}

/**
 * 轨迹点
 */
export interface TrackPoint {
  /**
   * 纬度
   */
  lat: number;
  /**
   * 经度
   */
  lng: number;
  /**
   * 时间戳
   */
  timestamp: number;
  /**
   * 附加数据
   */
  data?: any;
}

/**
 * 轨迹
 */
export interface Track {
  /**
   * 轨迹ID
   */
  id: string;
  /**
   * 轨迹名称
   */
  name: string;
  /**
   * 轨迹点数组
   */
  points: TrackPoint[];
  /**
   * 颜色
   */
  color?: string;
  /**
   * 宽度
   */
  weight?: number;
  /**
   * 是否可播放
   */
  playable?: boolean;
  /**
   * 附加数据
   */
  data?: any;
}

/**
 * 轨迹播放器
 */
export interface TrackPlayer {
  /**
   * 开始播放
   */
  play: () => void;
  /**
   * 暂停播放
   */
  pause: () => void;
  /**
   * 停止播放
   */
  stop: () => void;
  /**
   * 设置播放速度
   */
  setSpeed: (speed: number) => void;
  /**
   * 设置当前时间
   */
  setCurrentTime: (time: number) => void;
}

// 事件类型
export type MapEventType = 
  | 'map-click'
  | 'map-right-click'
  | 'marker-click'
  | 'marker-create'
  | 'marker-update'
  | 'marker-delete'
  | 'shape-click'
  | 'shape-create'
  | 'shape-update'
  | 'shape-delete'
  | 'update:center'
  | 'update:zoom'
  | 'map-initialized'
  | 'toolbar-tool-activated'
  | 'toolbar-tool-deactivated'
  | 'toolbar-state-change'
  | 'layer-change'
  | 'grid-enabled'
  | 'grid-disabled'
  | 'flight-line-selection-change';

export {
  MapType,
  CoordinateOptions,
  ToolbarConfig,
  ToolItem
};
