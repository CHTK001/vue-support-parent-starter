import type { TrackPlayerConfigOptions } from './track';

// 默认轨迹播放器配置
export const DEFAULT_TRACK_PLAYER_CONFIG: TrackPlayerConfigOptions = {
  loop: false,          // 是否循环播放
  speed: 50,            // 默认播放速度(km/h)
  withCamera: false,     // 是否跟随相机
  speedFactor: 1.0,     // 速度因子
  showNodes: true,     // 是否显示节点（静态点位）
  showNodeAnchors: false,// 是否显示节点锚点（当showNodes设置为true时有效）
  showNodeNames: true, // 是否显示节点名称（静态点位名称）
  showPointNames: true, // 是否显示点位名称（移动点位名称）
  showSpeed: true,      // 是否显示移动速度
  showNodeSpeed: true,   // 是否显示节点速度
};

// 默认的交通工具基于速度的图标分组配置
export const DEFAULT_TRACK_SPEED_GROUPS = [
  // 行人图标 (0-6 km/h)
  {
    speed: 0,
    icon: 'https://img.icons8.com/?size=50&id=sYaA2JXjiIXq&format=png',
    iconType: 'photo'
  },
  // 自行车图标 (6-20 km/h)
  {
    speed: 6,
    icon: 'https://img.icons8.com/color/48/000000/bicycle.png',
    iconType: 'photo'
  },
  // 汽车图标 (20-100 km/h)
  {
    speed: 20,
    icon: 'https://img.icons8.com/color/48/000000/car--v1.png',
    iconType: 'photo'
  },
  // 动车/高铁图标 (100-300 km/h)
  {
    speed: 100,
    icon: 'https://img.icons8.com/color/48/000000/high-speed-train.png',
    iconType: 'photo'
  },
  // 飞机图标 (>300 km/h)
  {
    speed: 300,
    icon: 'https://img.icons8.com/color/48/000000/airplane-mode-on.png',
    iconType: 'photo'
  }
];