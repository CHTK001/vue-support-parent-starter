/**
 * 飞线图类型定义
 * @description 定义飞线图相关的类型和接口
 */

// 飞线点
export interface FlightLinePoint {
  lat: number;           // 纬度
  lng: number;           // 经度
  name?: string;         // 名称
  label?: string;        // 标签
  icon?: string;         // 图标URL
  iconSize?: [number, number]; // 图标大小
  iconAnchor?: [number, number]; // 图标锚点
  color?: string;        // 点颜色
  size?: number;         // 点大小
  radius?: number;       // 点半径
  tooltip?: string;      // 提示文本
  data?: any;            // 自定义数据
}

// 飞线配置
export interface FlightLineOptions {
  id?: string;                  // 飞线ID，不指定时自动生成
  from: [number, number];       // 起点坐标 [纬度, 经度]
  to: [number, number];         // 终点坐标 [纬度, 经度]
  color?: string;               // 线条颜色
  weight?: number;              // 线条宽度
  opacity?: number;             // 不透明度
  curvature?: number;           // 曲线弯曲度，0为直线，正负值决定弯曲方向
  dashArray?: string;           // 虚线样式
  style?: 'solid' | 'dashed' | 'dotted' | 'arc' | 'pulse'; // 线条样式
  animate?: boolean;            // 是否启用动画
  animateSpeed?: number;        // 动画速度
  animateDirectional?: boolean; // 是否单向动画
  animateTrailLength?: number;  // 动画尾迹长度
  sourcePoint?: FlightLinePoint; // 起点配置
  targetPoint?: FlightLinePoint; // 终点配置
  showSourcePoint?: boolean;    // 是否显示起点
  showTargetPoint?: boolean;    // 是否显示终点
  label?: string;               // 线标签
  labelPlacement?: 'middle' | 'start' | 'end'; // 标签位置
  selected?: boolean;           // 是否选中
  data?: any;                   // 自定义数据
  weight?: number;              // 权重，可用于线条宽度或颜色渐变
  value?: number;               // 值，用于数据展示
}

// 飞线对象
export interface FlightLine extends FlightLineOptions {
  id: string;                   // 飞线ID
}

// 飞线分组
export interface FlightLineGroup {
  id: string;                   // 分组ID
  name: string;                 // 分组名称
  lines: FlightLine[];          // 飞线数组
  visible?: boolean;            // 是否可见
  style?: any;                  // 样式统一配置
}

// 飞线图配置
export interface FlightLineConfig {
  defaultCurvature?: number;    // 默认曲线弯曲度
  defaultColor?: string;        // 默认颜色
  defaultWeight?: number;       // 默认线宽
  defaultOpacity?: number;      // 默认不透明度
  defaultStyle?: 'solid' | 'dashed' | 'dotted' | 'arc' | 'pulse'; // 默认样式
  defaultAnimate?: boolean;     // 默认是否动画
  defaultAnimateSpeed?: number; // 默认动画速度
  colorScheme?: string[];       // 颜色方案
  useGradient?: boolean;        // 是否使用渐变
  gradientColors?: string[];    // 渐变颜色数组
  showLabel?: boolean;          // 是否显示标签
  labelSize?: number;           // 标签字体大小
  labelColor?: string;          // 标签颜色
  showTooltip?: boolean;        // 是否显示提示
  showSourcePoint?: boolean;    // 是否显示起点
  showTargetPoint?: boolean;    // 是否显示终点
  pointSize?: number;           // 点大小
  pointColor?: string;          // 点颜色
  sourcePointIcon?: string;     // 起点图标
  targetPointIcon?: string;     // 终点图标
  weightField?: string;         // 权重字段
  valueField?: string;          // 值字段
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
  from: number[];    // 起点坐标 [经度, 纬度]
  to: number[];      // 终点坐标 [经度, 纬度]
  fromName?: string; // 起点名称，可选
  toName?: string;   // 终点名称，可选
  style?: FlightLineStyle; // 该组坐标的专属样式，可选
  value?: number;    // 该组坐标的数值，可选
}

// 飞线数据接口
export interface FlightLineData {
  id?: string;           // 飞线唯一ID，如不提供则自动生成
  fromName: string;      // 起点名称
  toName: string;        // 终点名称
  /**
   * 坐标数据，支持两种格式：
   * 1. 简单格式：[[起点经度,起点纬度],[终点经度,终点纬度]]
   * 2. 复杂格式：FlightCoord数组，支持多组起点终点坐标
   */
  coords: number[][] | FlightCoord[];
  value?: number;        // 飞线值，可用于表示权重
  from?: number[];       // 起点坐标，可选，优先使用coords
  to?: number[];         // 终点坐标，可选，优先使用coords
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