/**
 * 飞线图类型定义
 */

// 飞线点接口
export interface FlightLinePoint {
  name: string;
  value: number[];
}

// 飞线数据接口
export interface FlightLineData {
  id?: string;
  fromName: string;
  toName: string;
  coords: number[][];
  value?: number;
}

// 飞线图配置接口
export interface FlightLineConfig {
  visible: boolean;           // 是否可见
  color: string | string[];   // 飞线颜色，可以是单个颜色或颜色数组
  width: number;              // 线宽
  opacity: number;            // 不透明度 0-1
  curveness: number;          // 曲线弯曲程度，0-1
  showEffect: boolean;        // 是否显示飞线动画效果
  effectPeriod: number;       // 动画周期，单位为秒
  effectTrailLength: number;  // 飞线尾迹长度，0-1
  effectSymbol: string;       // 飞线符号，支持 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none' 或 SVG 路径
  effectSymbolSize: number;   // 飞线符号大小
  showNodes: boolean;         // 是否显示起止节点
  nodeSymbolSize: number;     // 节点符号大小
  nodeEffect: boolean;        // 节点是否有动画效果
  zIndex: number;             // 层级
}

// 默认飞线图配置
export const DEFAULT_FLIGHTLINE_CONFIG: FlightLineConfig = {
  visible: true,
  color: ['#a6c84c', '#ffa022', '#46bee9'],
  width: 1,
  opacity: 0.6,
  curveness: 0.2,
  showEffect: true,
  effectPeriod: 6,
  effectTrailLength: 0.7,
  effectSymbol: 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z',
  effectSymbolSize: 15,
  showNodes: true,
  nodeSymbolSize: 10,
  nodeEffect: true,
  zIndex: 90
}; 