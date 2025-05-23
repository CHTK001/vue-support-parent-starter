/**
 * 坐标系统相关类型定义
 */

/**
 * 坐标点类型
 * 支持[经度, 纬度]数组和{lng,lat}对象两种格式
 */
export type GeoPoint = [number, number] | { lng: number; lat: number };

/**
 * 坐标系类型枚举
 */
export enum CoordType {
  WGS84 = 'WGS84',        // 世界大地测量系统坐标(GPS坐标，谷歌国际)
  GCJ02 = 'GCJ02',        // 国测局坐标系(高德，腾讯，谷歌中国)
  BD09 = 'BD09',          // 百度坐标系
  EPSG3857 = 'EPSG3857',  // Web墨卡托投影坐标系
  EPSG4490 = 'EPSG4490'   // 2000国家大地坐标系
}

/**
 * 坐标信息类型
 */
export interface CoordinateInfo {
  longitude: number;       // 经度
  latitude: number;        // 纬度
  projectedX: number;      // 投影后X坐标
  projectedY: number;      // 投影后Y坐标
  projection: string;      // 投影类型
  decimals: number;        // 小数位数
  position: string;        // 坐标显示位置
} 