/**
 * 图形类型定义
 * @description 定义地图上绘制的图形的类型和接口
 */
import type L from 'leaflet';

// 数据类型枚举
export enum DataType {
  MARKER = 'marker',
  SHAPE = 'shape',
  TRACK = 'track',
  HEATMAP = 'heatmap',
  GRID = 'grid',
  FLIGHTLINE = 'flightLine'
}

// 图形类型枚举 - 使用ShapeType代替原来的Shape避免命名冲突
export enum ShapeType {
  POINT = 'Point',
  LINE = 'LineString',
  POLYLINE = 'Polyline',
  POLYGON = 'Polygon',
  RECTANGLE = 'Rectangle',
  SQUARE = 'Square',
  CIRCLE = 'Circle'
}

// 图形状态
export enum ShapeStatus {
  NORMAL = 'normal',      // 正常
  SELECTED = 'selected',  // 选中
  EDITING = 'editing',    // 编辑中
  CREATING = 'creating',  // 创建中
  DISABLED = 'disabled'   // 禁用
}

// 坐标点
export type LatLng = [number, number]; // [纬度, 经度]

// 图形样式接口
export interface ShapeStyle {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  lineDash?: number[];
  pointRadius?: number;
  zIndex?: number;
}

// 绘制选项
export interface DrawOptions {
  shapeType: ShapeType;     // 绘制图形类型
  style?: ShapeStyle;    // 样式选项
  finishOnDoubleClick?: boolean; // 双击完成绘制
  snapToMarkers?: boolean;  // 吸附到标记点
  showTooltip?: boolean;    // 显示提示
  showMeasurements?: boolean; // 显示测量信息
  maxPoints?: number;       // 最大点数
  editable?: boolean;       // 是否可编辑
}

// 编辑选项
export interface EditOptions {
  allowMove?: boolean;      // 允许移动
  allowResize?: boolean;    // 允许调整大小
  allowRotate?: boolean;    // 允许旋转
  markers?: {               // 编辑点样式
    vertex?: ShapeStyle; // 顶点样式
    middle?: ShapeStyle; // 中间点样式
  };
  showTooltip?: boolean;    // 显示提示
}

// 坐标点接口
export interface ShapePoint {
  x: number;
  y: number;
}


// 定义用于Leaflet的ShapeOption接口
export interface ShapeOption {
  id: string;
  type: ShapeType;
  coordinates?: number[][];
  radius?: number;
  style?: {
    color?: string;
    weight?: number;
    opacity?: number;
    fillColor?: string;
    fillOpacity?: number;
    dashArray?: string;
    className?: string;
  };
  data?: any;
}

// 定义内部使用的Shape类型
export interface ShapeItem {
  id: string;
  type: ShapeType;
  options: ShapeOption;
  layer: L.Layer | null;
}

// 向后兼容性的类型别名
export type Shape = ShapeItem;

// 扩展的样式类型，用于内部表示
export interface ExtendedShapeStyle extends ShapeStyle {
  stroke?: {
    color?: string;
    width?: number;
    lineDash?: number[];
  };
  fill?: {
    color?: string;
  };
  point?: {
    radius?: number;
    stroke?: {
      color?: string;
      width?: number;
    };
    fill?: {
      color?: string;
    };
  };
  text?: {
    font?: string;
    fill?: {
      color?: string;
    };
    stroke?: {
      color?: string;
      width?: number;
    };
    offsetY?: number;
    padding?: number[];
  };
}

// 默认样式
export const DEFAULT_SHAPE_STYLE: ExtendedShapeStyle = {
  stroke: {
    color: 'rgba(24, 144, 255, 1)',
    width: 2,
    lineDash: []
  },
  fill: {
    color: 'rgba(24, 144, 255, 0.2)'
  },
  point: {
    radius: 5,
    stroke: {
      color: 'rgba(24, 144, 255, 0.8)',
      width: 2
    },
    fill: {
      color: 'rgba(255, 255, 255, 0.8)'
    }
  },
  text: {
    font: '14px Calibri,sans-serif',
    fill: {
      color: '#333'
    },
    stroke: {
      color: '#fff',
      width: 3
    },
    offsetY: -12,
    padding: [5, 5, 5, 5]
  }
}; 
