/**
 * 轨迹类型定义
 * @description 定义轨迹相关的类型和接口
 */
import L from 'leaflet';

// 轨迹点
export interface TrackPoint {
  /**
   * 位置 - 纬度
   */
  lat: number;
  /**
   * 位置 - 经度
   */
  lng: number;
  /**
   * 时间戳 - 毫秒级
   */
  time: number;
  /**
   * 速度(km/h)
   */
  speed?: number;
  /**
   * 方向(0-360度)
   */
  direction?: number;
  /**
   * 海拔(米)
   */
  altitude?: number;
  /**
   * 点类型
   */
  type?: string;
  /**
   * 点名称
   */
  name?: string;
  /**
   * 附加数据
   */
  data?: any;
}

// 轨迹
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
   * 轨迹线条颜色
   */
  color?: string;
  /**
   * 轨迹线条宽度
   */
  weight?: number;
  /**
   * 轨迹线条样式
   */
  style?: 'solid' | 'dashed' | 'dotted';
  /**
   * 是否可播放
   */
  playable?: boolean;
  /**
   * 关键节点
   */
  nodes?: TrackPoint[];
  /**
   * 是否显示
   */
  visible?: boolean;
  /**
   * 是否选中
   */
  selected?: boolean;
  /**
   * 附加数据
   */
  data?: any;
  /**
   * 缓存的 Leaflet 路径对象
   */
  _path?: L.Polyline;
  /**
   * 缓存的标记点对象
   */
  _markers?: L.Marker[];
}

// 轨迹样式
export interface TrackStyle {
  /**
   * 线条颜色
   */
  color: string;
  /**
   * 线条宽度
   */
  weight: number;
  /**
   * 线条透明度
   */
  opacity: number;
  /**
   * 虚线样式
   */
  dashArray?: string;
  /**
   * 是否显示箭头
   */
  arrows?: boolean;
  /**
   * 节点显示风格
   */
  nodeStyle?: 'circle' | 'marker' | 'none';
  /**
   * 节点颜色
   */
  nodeColor?: string;
  /**
   * 节点大小
   */
  nodeSize?: number;
}

// 轨迹播放器配置选项
export interface TrackPlayerConfigOptions {
  /**
   * 是否循环播放
   */
  loop: boolean;
  /**
   * 默认播放速度(km/h)
   */
    speed: number;
  /**
   * 是否跟随相机
   */
  withCamera: boolean;
  /**
   * 速度因子(倍速)
   */
  speedFactor: number;
  /**
   * 是否显示节点(静态点位)
   */
  showNodes: boolean;
  /**
   * 是否显示节点锚点
   */
  showNodeAnchors: boolean;
  /**
   * 是否显示节点名称
   */
  showNodeNames: boolean;
  /**
   * 是否显示点位名称
   */
  showPointNames: boolean;
  /**
   * 是否显示移动速度
   */
  showSpeed: boolean;
  /**
   * 是否显示节点速度
   */
  showNodeSpeed: boolean;
  /**
   * 移动图标(URL或内置类型)
   */
  moveIcon?: string;
  /**
   * 移动图标大小 [宽, 高]
   */
  moveIconSize?: [number, number];
  /**
   * 移动图标颜色
   */
  moveIconColor?: string;
  /**
   * 轨迹线条样式
   */
  trackStyle?: TrackStyle;
  /**
   * 是否显示用于选择的轨迹列表
   */
  showTrackList?: boolean;
  /**
   * 面板位置
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// 导出默认配置
export const DEFAULT_TRACK_PLAYER_CONFIG: TrackPlayerConfigOptions = {
  loop: false,          // 是否循环播放
  speed: 50,            // 默认播放速度(km/h)
  withCamera: false,    // 是否跟随相机
  speedFactor: 1.0,     // 速度因子
  showNodes: false,     // 是否显示节点（静态点位）
  showNodeAnchors: false, // 是否显示节点锚点
  showNodeNames: false, // 是否显示节点名称
  showPointNames: true, // 是否显示点位名称
  showSpeed: true,      // 是否显示移动速度
  showNodeSpeed: true,  // 是否显示节点速度
  moveIcon: 'car',      // 默认使用汽车图标
  moveIconSize: [24, 24], // 默认图标大小
  moveIconColor: '#1890ff', // 默认图标颜色
  showTrackList: true,  // 默认显示轨迹列表
  position: 'bottom-right', // 默认面板位置
  trackStyle: {
    color: '#1890ff',
    weight: 3,
    opacity: 0.8,
    arrows: true,
    nodeStyle: 'circle',
    nodeColor: '#1890ff',
    nodeSize: 6
  }
};
