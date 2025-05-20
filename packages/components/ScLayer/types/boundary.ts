/**
 * 区划边界相关类型定义
 */

// 区划实现方式
export enum BoundaryImplementation {
  AMAP = 'amap',  // 高德地图
  CUSTOM = 'custom'  // 自定义
}

// 区划级别
export enum BoundaryLevel {
  PROVINCE = 'province',
  CITY = 'city',
  DISTRICT = 'district'
}

// 区划边界单项
export interface BoundaryItem {
  id: string;
  name: string;
  level: BoundaryLevel;
  code: string;
  parentCode?: string;
  center?: [number, number]; // 中心点坐标 [lng, lat]
  children?: BoundaryItem[];
}

// 区划边界坐标点
export interface BoundaryCoordinate {
  lng: number;
  lat: number;
}

// 区划边界数据
export interface BoundaryData {
  code: string;
  name: string;
  level: BoundaryLevel;
  coordinates: BoundaryCoordinate[][];  // 可能有多个闭环，每个闭环是一组坐标点
}

// 区划边界配置选项
export interface BoundaryOptions {
  implementation: BoundaryImplementation;
  url?: string; // 自定义API URL，如果使用自定义实现方式
  fillBoundary?: boolean; // 是否填充区划
  strokeColor?: string; // 边框颜色
  strokeWidth?: number; // 边框宽度
  fillColor?: string; // 填充颜色
  fillOpacity?: number; // 填充透明度
  zIndex?: number; // 层级
  showLabel?: boolean; // 是否显示标签
  labelOptions?: {
    fontSize?: number;
    fontColor?: string;
    offset?: [number, number]; // 标签偏移量 [x, y]
  };
}

// 默认配置
export const DEFAULT_BOUNDARY_OPTIONS: BoundaryOptions = {
  implementation: BoundaryImplementation.AMAP,
  fillBoundary: true,
  strokeColor: '#1677ff',
  strokeWidth: 2,
  fillColor: '#1677ff',
  fillOpacity: 0.2,
  zIndex: 10,
  showLabel: true,
  labelOptions: {
    fontSize: 12,
    fontColor: '#333',
    offset: [0, 0]
  }
}; 