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

// 轨迹播放器事件处理器
export type TrackPlayerEventHandler = (eventName: string, payload: any) => void; 