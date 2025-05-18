/**
 * 轨迹类型定义
 * @description 定义轨迹相关的类型和接口
 */

/**
 * 轨迹点
 */
export interface TrackPoint {
  // 经度
  longitude: number;
  // 纬度
  latitude: number;
  // 时间戳
  timestamp: number;
  // 高度（可选）
  altitude?: number;
  // 速度（可选）
  speed?: number;
  // 方向（可选）
  heading?: number;
  // 自定义属性（可选）
  properties?: Record<string, any>;
}

/**
 * 轨迹选项
 */
export interface TrackOptions {
  // 轨迹ID
  id?: string;
  // 轨迹名称
  name?: string;
  // 轨迹线颜色
  color?: string;
  // 轨迹线宽度
  width?: number;
  // 轨迹线透明度
  opacity?: number;
  // 轨迹线样式 (solid, dashed, dotted)
  style?: 'solid' | 'dashed' | 'dotted';
  // 是否显示轨迹点
  showPoints?: boolean;
  // 轨迹点样式
  pointStyle?: {
    radius?: number;
    color?: string;
    fillColor?: string;
    opacity?: number;
    fillOpacity?: number;
  };
  // 自定义属性
  properties?: Record<string, any>;
}

/**
 * 轨迹对象
 */
export interface Track {
  // 轨迹ID
  id: string;
  // 轨迹选项
  options: TrackOptions;
  // 轨迹点列表
  points: TrackPoint[];
  // 轨迹线图层
  layer?: any;
  // 轨迹点图层
  pointsLayer?: any;
}

/**
 * 轨迹播放器选项
 */
export interface TrackPlayerOptions {
  // 播放速度
  playbackSpeed?: number;
  // 播放间隔（毫秒）
  tickLen?: number;
  // 最大插值时间（毫秒）
  maxInterpolationTime?: number;
  // 位置
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  // 轨迹点样式
  trackPointOptions?: {
    radius?: number;
    color?: string;
    fillColor?: string;
    weight?: number;
    opacity?: number;
    fillOpacity?: number;
  };
  // 轨迹线样式
  trackLineOptions?: {
    color?: string;
    weight?: number;
    opacity?: number;
  };
  // 自定义控制回调
  customControlCallbacks?: {
    onSpeedChange?: (speed: number) => void;
    onTrackSelect?: (trackId: string) => void;
  };
}

/**
 * 轨迹播放器事件类型
 */
export type TrackPlayerEventType = 
  | 'play'
  | 'pause'
  | 'stop'
  | 'ended'
  | 'tick'
  | 'point-select'
  | 'track-add'
  | 'track-clear'
  | 'speed-change'
  | 'track-select'
  | 'trackplayer-init';

// 轨迹配置选项
export interface TrackPlayerConfigOptions {
  loop?: boolean;          // 是否循环播放
  speed?: number;          // 默认播放速度(km/h)
  withCamera?: boolean;    // 是否跟随相机
  speedFactor?: number;    // 速度因子
  showNodes?: boolean;     // 是否显示节点（静态点位）
  showNodeAnchors?: boolean; // 是否显示节点锚点（当showNodes设置为true时有效）
  showNodeNames?: boolean; // 是否显示节点名称（静态点位名称）
  showPointNames?: boolean; // 是否显示点位名称（移动点位名称）
  showSpeed?: boolean;     // 是否显示移动速度
  showNodeSpeed?: boolean; // 是否显示节点速度
  moveIcon?: string;       // 移动点图标
  moveIconSize?: number[]; // 移动点图标大小
  moveIconColor?: string;  // 移动点图标颜色
  trackStyle?: {
    color?: string;        // 轨迹线颜色
    weight?: number;       // 轨迹线宽度
    opacity?: number;      // 轨迹线不透明度
    nodeColor?: string;    // 节点颜色
    nodeSize?: number;     // 节点大小
    nodeStyle?: 'circle' | 'marker' | 'none'; // 节点样式
  };
}

// 默认轨迹播放器配置
export const DEFAULT_TRACK_PLAYER_CONFIG: TrackPlayerConfigOptions = {
  loop: false,
  speed: 50,
  withCamera: false,
  speedFactor: 1.0,
  showNodes: false,
  showNodeAnchors: false,
  showNodeNames: false,
  showPointNames: true,
  showSpeed: true,
  showNodeSpeed: true,
  moveIcon: 'car',
  moveIconSize: [24, 24],
  moveIconColor: '#1890ff',
  trackStyle: {
    color: '#1890ff',
    weight: 3,
    opacity: 0.8,
    nodeColor: '#1890ff',
    nodeSize: 6,
    nodeStyle: 'circle'
  }
};
