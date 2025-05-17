/**
 * 图形类型定义
 * @description 定义地图图形相关的类型和接口
 */

import type { DataType } from ".";
import { ShapeType } from '../composables/ShapeObject';
import L from 'leaflet';

// 图形类型
export enum ShapeType {
  MARKER = 'marker',        // 标记点
  CIRCLE = 'circle',        // 圆形
  RECTANGLE = 'rectangle',  // 矩形
  POLYGON = 'polygon',      // 多边形
  POLYLINE = 'polyline',    // 折线
  ELLIPSE = 'ellipse',      // 椭圆
  LABEL = 'label'           // 文本标签
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

// 图形样式选项
export interface ShapeStyleOptions {
  color?: string;           // 边框颜色
  weight?: number;          // 边框宽度
  opacity?: number;         // 不透明度
  fillColor?: string;       // 填充颜色
  fillOpacity?: number;     // 填充不透明度
  dashArray?: string;       // 虚线样式
  lineCap?: string;         // 线条端点样式
  lineJoin?: string;        // 线条连接样式
  fillRule?: 'evenodd' | 'nonzero'; // 填充规则
  className?: string;       // 自定义类名
  interactive?: boolean;    // 是否可交互
}

// 图形基础选项
export interface ShapeOption {
  id?: string;              // 图形ID，不指定时自动生成
  type: ShapeType;          // 图形类型
  coordinates: LatLng | LatLng[] | LatLng[][]; // 坐标数据
  style?: ShapeStyleOptions; // 样式选项
  status?: ShapeStatus;     // 状态
  visible?: boolean;        // 是否可见
  editable?: boolean;       // 是否可编辑
  data?: any;               // 自定义数据
  radius?: number;          // 半径（圆形）
  radiusX?: number;         // X轴半径（椭圆）
  radiusY?: number;         // Y轴半径（椭圆）
  text?: string;            // 文本内容（标签）
  textOptions?: {           // 文本选项
    offset?: [number, number]; // 偏移 [x, y]
    direction?: 'top' | 'bottom' | 'left' | 'right'; // 方向
    fontSize?: number;      // 字体大小
    fontFamily?: string;    // 字体
    fontWeight?: string;    // 字体粗细
    color?: string;         // 文本颜色
    backgroundColor?: string; // 背景颜色
    borderColor?: string;   // 边框颜色
    padding?: number | [number, number]; // 内边距
    opacity?: number;       // 不透明度
  };
  tooltip?: string;         // 提示文本
  popup?: string;           // 弹窗内容
}

// 图形对象
export interface Shape extends ShapeOption {
  id: string;               // 图形ID
}

// 绘制选项
export interface DrawOptions {
  shapeType: ShapeType;     // 绘制图形类型
  style?: ShapeStyleOptions; // 样式选项
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
    vertex?: ShapeStyleOptions; // 顶点样式
    middle?: ShapeStyleOptions; // 中间点样式
  };
  showTooltip?: boolean;    // 显示提示
}

// 图形类型枚举
export enum Shape {
  POINT = 'Point',
  LINE = 'LineString',
  POLYGON = 'Polygon',
  CIRCLE = 'Circle',
  RECTANGLE = 'Rectangle',
  SQUARE = 'Square'
}

// 图形样式接口
export interface ShapeStyle {
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

// 坐标点接口
export interface ShapePoint {
  x: number;
  y: number;
}

// 形状对象
export interface Shape {
  /**
   * 形状ID
   */
  id: string;
  
  /**
   * 形状类型
   */
  type: ShapeType;
  
  /**
   * 形状选项
   */
  options: ShapeOption;
  
  /**
   * Leaflet图层对象
   */
  layer: L.Path | null;
}

// 默认样式
export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
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