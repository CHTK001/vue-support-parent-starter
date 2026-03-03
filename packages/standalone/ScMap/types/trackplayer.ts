/**
 * 轨迹播放器类型定义
 * @description 定义轨迹播放器相关的类型和接口
 */

// 轨迹点
export interface TrackPoint {
  id?: string;
  time: number;
  lat: number;
  lng: number;
  alt?: number;
  speed?: number;
  bearing?: number;
  title?: string;
  icon?: string;
  color?: string;
}

// 轨迹
export interface Track {
  id: string;
  name?: string;
  points: TrackPoint[];
  color?: string;
  width?: number;
  opacity?: number;
  showMarker?: boolean;
  showLine?: boolean;
  showPoints?: boolean;
}

// 轨迹播放器配置
export interface TrackPlayerConfig {
  loop?: boolean;
  speed?: number;
  withCamera?: boolean;
  speedFactor?: number;
  showNodes?: boolean;
  showNodeAnchors?: boolean;
  showNodeNames?: boolean;
  showPointNames?: boolean;
  showSpeed?: boolean;
  showNodeSpeed?: boolean;
}

/**
 * 轨迹播放器事件类型定义
 */

/**
 * 轨迹播放器事件处理函数类型
 */
export type TrackPlayerEventHandler = (eventName: string, payload: any) => void;

/**
 * 轨迹播放器事件监听器
 */
export interface TrackPlayerEventListener {
  // 事件名称
  eventName: string;
  // 事件处理函数
  handler: TrackPlayerEventHandler;
}

/**
 * 轨迹播放器回调函数集合
 */
export interface TrackPlayerCallbacks {
  // 播放开始回调
  onPlay?: (time: number) => void;
  // 播放暂停回调
  onPause?: (time: number) => void;
  // 播放停止回调
  onStop?: (time: number) => void;
  // 播放结束回调
  onEnded?: (time: number) => void;
  // 播放进度更新回调
  onTick?: (time: number, tracks: any[]) => void;
  // 点选中回调
  onPointSelect?: (point: any) => void;
  // 轨迹添加回调
  onTrackAdd?: (id: string, pointCount: number) => void;
  // 轨迹清空回调
  onTrackClear?: () => void;
  // 速度改变回调
  onSpeedChange?: (speed: number) => void;
  // 轨迹选中回调
  onTrackSelect?: (trackId: string) => void;
  // 初始化完成回调
  onInit?: (message: string) => void;
} 