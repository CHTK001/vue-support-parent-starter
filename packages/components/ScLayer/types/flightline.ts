/**
 * 飞线图类型定义
 */

// 飞线点接口
export interface FlightLinePoint {
  name: string;
  value: number[];
}

// 飞线样式接口
export interface FlightLineStyle {
  color?: string;     // 颜色
  width?: number;     // 线宽
  opacity?: number;   // 透明度
  curveness?: number; // 曲率，控制线的弯曲程度
}

// 飞线数据接口
export interface FlightLineData {
  id?: string;           // 飞线唯一ID，如不提供则自动生成
  fromName: string;      // 起点名称
  toName: string;        // 终点名称
  coords: number[][];    // 坐标数组[[起点经度,起点纬度],[终点经度,终点纬度]]
  value?: number;        // 飞线值，可用于表示权重
  from?: number[];       // 起点坐标，可选，优先使用coords
  to?: number[];         // 终点坐标，可选，优先使用coords
  visible?: boolean;     // 是否可见，默认为true
  highlight?: boolean;   // 是否高亮显示，默认为false
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
  showNodes?: boolean;        // 是否显示节点
  nodeSymbolSize?: number;    // 节点大小
  nodeColor?: string;         // 节点颜色
  nodeEffect?: boolean;       // 节点是否有特效
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
  width: 2,
  opacity: 0.8,
  curveness: 0.3,
  forcedPrecomposeRerender: true,
  showEffect: true,
  effectPeriod: 4,
  effectTrailLength: 0.7,
  effectSymbol: 'circle',
  effectSymbolSize: 8,
  effectSymbolPath: 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z', // 默认飞机图标
  showNodes: true,
  nodeSymbolSize: 4,
  nodeColor: '#ddb926',
  nodeEffect: true,
  zIndex: 90,
  
  // 性能相关默认配置
  hideOnMoving: true,
  hideOnZooming: true,
  enablePerformanceMode: true,
  useGLMode: false,
  throttle: 100,
  simplifyWhileInteracting: true
}; 