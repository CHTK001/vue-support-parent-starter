/**
 * 坐标类型定义
 * @description 定义地图坐标相关的类型和接口
 */

// 坐标位置类型
export type CoordinatePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 坐标选项
export interface CoordinateOptions {
  position?: CoordinatePosition;
  decimals?: number;
  showProjected?: boolean;
}

// 坐标信息
export interface CoordinateInfo {
  lat: number;
  lng: number;
  x?: number;
  y?: number;
  alt?: number;
  zoom?: number;
  formatted?: {
    lat: string;
    lng: string;
    x?: string;
    y?: string;
    alt?: string;
  };
}

// 默认坐标选项
export const DEFAULT_COORDINATE_OPTIONS: CoordinateOptions = {
  position: 'bottom-right',
  decimals: 6,
  showProjected: true
}; 