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
