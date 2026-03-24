/**
 * 飞线图类型定义
 */
import { CoordSystem, GeoPoint } from './coordinate';

// 飞线点接口
export interface FlightLinePoint {
  name: string;
  value: GeoPoint;
}

// 飞线样式接口
export interface FlightLineStyle {
  color?: string;     // 颜色
  width?: number;     // 线宽
  opacity?: number;   // 透明度
  curveness?: number; // 曲率，控制线的弯曲程度
}

/**
 * 飞线坐标接口
 * 用于定义一条飞线的起点和终点
 */
export interface FlightCoord {
  from: GeoPoint;    // 起点坐标 [经度, 纬度] 或 {lng, lat}
  to: GeoPoint;      // 终点坐标 [经度, 纬度] 或 {lng, lat}
  fromName?: string; // 起点名称，可选
  toName?: string;   // 终点名称，可选
  style?: FlightLineStyle; // 该组坐标的专属样式，可选
  value?: number;    // 该组坐标的数值，可选
  coordSystem?: CoordSystem; // 坐标系统，默认为WGS84
}

// 飞线数据接口
export interface FlightLineData {
  id?: string;           // 飞线唯一ID，如不提供则自动生成
  fromName: string;      // 起点名称
  toName: string;        // 终点名称
  /**
   * 坐标数据，支持两种格式：
   * 1. 简单格式：[[起点经度,起点纬度],[终点经度,终点纬度]] 或 [{lng,lat},{lng,lat}]
   * 2. 复杂格式：FlightCoord数组，支持多组起点终点坐标
   */
  coords: GeoPoint[] | FlightCoord[];
  value?: number;        // 飞线值，可用于表示权重
  from?: GeoPoint;       // 起点坐标，可选，优先使用coords
  to?: GeoPoint;         // 终点坐标，可选，优先使用coords
  highlight?: boolean;   // 是否高亮显示，默认为false
  isActive?: boolean;    // 是否为当前激活的飞线
  style?: FlightLineStyle; // 线条样式
  /**
   * 飞线动画符号类型，例如：'plane', 'arrow', 'triangle', 'circle', 'pin'
   * 优先级高于全局FlightLineConfig中的设置
   */
  effectSymbol?: string;
  /**
   * 自定义飞线动画符号SVG路径，以'path://'开头
   * 仅当effectSymbol不为内置类型时使用
   * 优先级高于全局FlightLineConfig中的设置
   */
  effectSymbolPath?: string;
  /**
   * 飞线动画符号大小，数值
   * 优先级高于全局FlightLineConfig中的设置
   */
  effectSymbolSize?: number;
  /**
   * 创建时间戳，用于排序
   */
  _createTime?: number;
  /**
   * 是否渲染为多组飞线，当coords为FlightCoord[]类型且长度大于1时有效
   * 为true时将渲染多条飞线路径
   */
  isMultiCoords?: boolean;
  /**
   * 坐标系统，默认为WGS84
   */
  coordSystem?: CoordSystem;
}

// 飞线图配置接口
export interface FlightLineConfig {
  visible?: boolean;          // 是否可见
  color?: string;             // 线条颜色
  width?: number;             // 线条宽度
  opacity?: number;           // 线条透明度
  curveness?: number;         // 线条曲率
  showEffect?: boolean;       // 是否显示动画效果
  effectPeriod?: number;      // 动画周期，单位秒
  effectTrailLength?: number; // 轨迹长度，0-1
  effectSpeed?: number;       // 动画速度，值越大速度越快
  /**
   * 动画符号类型，可选：
   * - 'plane': 飞机图标
   * - 'arrow': 箭头图标
   * - 'triangle': 三角形图标
   * - 'circle': 圆形图标
   * - 'pin': 定位图标
   * 也可以是自定义类型，配合effectSymbolPath使用
   * 注意：每条飞线可以单独设置图标，此为全局默认设置
   */
  effectSymbol?: string;
  /**
   * 动画符号大小
   * 注意：每条飞线可以单独设置图标大小，此为全局默认设置
   */
  effectSymbolSize?: number;
  /**
   * 自定义动画符号SVG路径，以'path://'开头
   * 仅当effectSymbol不为内置类型时使用
   * 注意：每条飞线可以单独设置图标路径，此为全局默认设置
   */
  effectSymbolPath?: string;
  
  /**
   * 拖尾相关配置
   */
  trailColor?: string;        // 拖尾颜色
  trailOpacity?: number;      // 拖尾透明度
  trailWidth?: number;        // 拖尾宽度
  
  showNodes?: boolean;        // 是否显示节点
  nodeSymbolSize?: number;    // 节点大小
  nodeColor?: string;         // 节点颜色
  nodeEffect?: boolean;       // 节点是否有特效
  
  /**
   * 节点涟漪效果配置
   */
  rippleEffect?: {
    period?: number;     // 动画周期，单位秒
    scale?: number;      // 涟漪缩放比例
    brushType?: string;  // 波纹图形类型，可选 'stroke' 或 'fill'
  };
  
  shadowBlur?: number;        // 节点阴影模糊度
  shadowColor?: string;       // 节点阴影颜色
  
  // 平滑度相关配置
  smooth?: boolean;           // 是否使用平滑曲线
  smoothConstraint?: boolean; // 是否约束平滑曲线
  smoothMonotone?: string;    // 平滑单调性，可选 'x'，'y' 或 null
  
  zIndex?: number;            // z-index
  forcedPrecomposeRerender?: boolean; // 是否强制重渲染
  
  // 性能相关配置
  hideOnMoving?: boolean;    // 移动时隐藏图层提高性能
  hideOnZooming?: boolean;   // 缩放时隐藏图层提高性能
  enablePerformanceMode?: boolean; // 是否启用性能模式
  useGLMode?: boolean;       // 是否使用GL渲染模式
  throttle?: number;         // 事件节流延迟时间（毫秒）
  simplifyWhileInteracting?: boolean; // 交互时是否简化显示
}

// 默认飞线图配置
export const DEFAULT_FLIGHTLINE_CONFIG: FlightLineConfig = {
  visible: true,
  color: '#1677ff',
  width: 1,
  opacity: 0.8,
  curveness: 0.4, // 增加曲率，使飞线更加弯曲平滑
  smooth: true,   // 启用平滑曲线
  smoothConstraint: true, // 启用约束
  smoothMonotone: null,  // 不设置单调性，使曲线更平滑
  
  forcedPrecomposeRerender: true,
  showEffect: true,
  effectPeriod: 3, // 减小周期，提高动画速度
  effectTrailLength: 0.0, // 增加轨迹长度，强化拖尾效果
  effectSpeed: 40, // 增加动画速度，值越大速度越快
  effectSymbol: 'plane',
  effectSymbolSize: 18, // 略微减小图标大小，使动画更加精致
  effectSymbolPath: 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z',
  
  // 优化拖尾相关默认配置
  trailColor: '#1677ff',
  trailOpacity: 0.7, // 增加透明度，使拖尾更明显
  trailWidth: 3, // 增加宽度，增强视觉效果
  
  showNodes: true,
  nodeSymbolSize: 12,
  nodeColor: '#1677ff',
  nodeEffect: true,
  
  // 添加涟漪效果默认配置
  rippleEffect: {
    period: 2.5,
    scale: 4,
    brushType: 'stroke'
  },
  
  shadowBlur: 20,
  shadowColor: '#1677ff',
  
  zIndex: 90,
  
  // 性能相关默认配置
  hideOnMoving: true,
  hideOnZooming: true,
  enablePerformanceMode: true,
  useGLMode: false,
  throttle: 100,
  simplifyWhileInteracting: true
};

// 添加默认导出
export default {
  DEFAULT_FLIGHTLINE_CONFIG
}; 