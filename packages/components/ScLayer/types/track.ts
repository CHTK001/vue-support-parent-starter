// 轨迹点类型定义
export interface TrackPoint {
  // 纬度
  lat: number;
  // 经度
  lng: number;
  // 时间戳（Unix时间戳，单位：秒）- 必填字段
  time: number;
  // 方向（可选，0-360度，顺时针方向）
  dir?: number;
  // 速度（可选，单位：km/h, 覆盖轨迹播放器默认速度）
  speed?: number;
  // 标题（可选，显示在标记上的信息）
  title?: string;
  // 静态点位标题（可选，用于记录移动点位经过的静态点位名称）
  staticTitle?: string;
  // 附加信息（可选，用于标记弹窗或其他展示）
  info?: Array<{key: string, value: string}>;
  // 自定义图标URL（可选，用于设置点位的自定义图标）
  iconUrl?: string;
  // 自定义图标尺寸（可选，用于设置点位图标的尺寸）
  iconSize?: [number, number];
}

// 图标速度分组
export interface IconSpeedGroup {
  // 最小速度（包含）
  minSpeed: number;
  // 最大速度（不包含）
  maxSpeed: number;
  // 图标URL
  iconUrl: string;
}

//播放参数
export interface TrackPlayer {
  // 是否循环播放
  loop: boolean;
  // 播放速度(km/h默认速度)
  speed: number;
  // 是否跟随相机
  withCamera: boolean;
  // 分段加速系数（可选，默认为1.0）
  speedFactor?: number;
}
// 定义轨迹播放器配置接口
export interface TrackPlayerConfigOptions {
  loop?: boolean;         // 是否循环播放
  speed?: number;         // 默认播放速度(km/h)
  withCamera?: boolean;   // 是否跟随相机
  speedFactor?: number;   // 速度因子
  showNodes?: boolean;    // 是否显示节点（静态点位）
  showNodeAnchors?: boolean; // 是否显示节点锚点（当showNodes开启时生效）
  showNodeNames?: boolean;// 是否显示节点名称（静态点位名称）
  showNodeTime?: boolean; // 是否显示节点时间
  showPointNames?: boolean;// 是否显示点位名称（移动点位名称）
  showSpeed?: boolean;    // 是否显示移动速度
  showNodeSpeed?: boolean;// 是否显示节点速度
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
  // 移动点位自定义标题（可选，用于覆盖默认名称）
  movingPointTitle?: string;
}

export interface TrackConfig {
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
}
