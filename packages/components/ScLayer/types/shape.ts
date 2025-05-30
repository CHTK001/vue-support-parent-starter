/**
 * 图形类型和选项定义
 */

import type { DataType } from ".";
import { CoordSystem } from "./coordinate";

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

// 图形选项接口
export interface ShapeOption {
  id?: string;
  type: Shape;
  visible?: boolean;
  dataType?: DataType;
  /** 坐标系统，默认为 WGS84 */
  coordSystem?: CoordSystem;
  coordinates?: number[] | number[][] | number[][][]; // 根据图形类型不同使用不同的坐标格式
  center?: number[]; // 圆形的中心点
  radius?: number; // 圆形的半径
  width?: number; // 矩形的宽度
  height?: number; // 矩形的高度
  points?: ShapePoint[]; // 多边形的点
  style?: ShapeStyle;
  data?: any; // 附加数据
  /** 是否使用流线效果，默认为false，如果设置为true则采用ol-ext中的FlowLine */
  flowLine?: boolean;
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

// 添加默认导出
export default {
  Shape,
  DEFAULT_SHAPE_STYLE
}; 