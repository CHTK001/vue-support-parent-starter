import type { TrackPlayerConfigOptions } from './track';

// 默认轨迹播放器配置
export const DEFAULT_TRACK_PLAYER_CONFIG: TrackPlayerConfigOptions = {
  loop: false,          // 是否循环播放
  speed: 50,            // 默认播放速度(km/h)
  withCamera: false,     // 是否跟随相机
  speedFactor: 1.0,     // 速度因子
  showNodes: false,     // 是否显示节点（静态点位）
  showNodeAnchors: false,// 是否显示节点锚点（当showNodes设置为true时有效）
  showNodeNames: false, // 是否显示节点名称（静态点位名称）
  showPointNames: true, // 是否显示点位名称（移动点位名称）
  showSpeed: true,      // 是否显示移动速度
  showNodeSpeed: true   // 是否显示节点速度
};