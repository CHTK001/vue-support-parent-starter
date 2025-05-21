/**
 * 坐标工具函数
 * @description 提供坐标系统工具函数
 */
import { MapType } from '../types/map';

/**
 * 坐标系统枚举
 */
export enum CoordSystem {
  WGS84 = 'WGS84',     // 国际标准坐标系统(GPS)
  GCJ02 = 'GCJ02',     // 国测局坐标系统(高德、腾讯)
  BD09 = 'BD09',       // 百度坐标系统
  EPSG3857 = 'EPSG:3857', // Web墨卡托投影
  EPSG4326 = 'EPSG:4326', // WGS84的别名
  EPSG4490 = 'EPSG:4490' // 天地图坐标系统
}

/**
 * 根据地图类型获取对应的坐标系统 
 * @param mapType 地图类型
 * @returns 对应的坐标系统
 */
export function getCoordSystemByMapType(mapType: MapType): CoordSystem {
  switch (mapType) {
    case MapType.GAODE:
      return CoordSystem.GCJ02;
    case MapType.TIANDITU:
      return CoordSystem.EPSG4490;
    case MapType.OSM:
    default:
      return CoordSystem.WGS84;
  }
}

/**
 * 将CoordSystem枚举转换为投影字符串
 * @param coordSystem 坐标系统枚举
 * @returns 投影字符串
 */
export function convertCoordSystemToProjection(coordSystem: CoordSystem): string {
  switch (coordSystem) {
    case CoordSystem.EPSG3857:
      return 'EPSG:3857';
    case CoordSystem.EPSG4326:
    case CoordSystem.WGS84:
      return 'EPSG:4326';
    case CoordSystem.GCJ02:
      return 'GCJ02';
    case CoordSystem.BD09:
      return 'BD09';
    default:
      return 'EPSG:4326';
  }
}

/**
 * 坐标点接口
 */
export interface Coordinate {
  lng: number;
  lat: number;
}

/**
 * WGS84坐标系转GCJ02坐标系（火星坐标系）
 * @param lng WGS84经度
 * @param lat WGS84纬度
 * @returns GCJ02坐标 [经度, 纬度]
 */
export function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  }

  const PI = 3.14159265358979324;
  const a = 6378245.0;
  const ee = 0.00669342162296594323;

  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  
  const mgLat = lat + dLat;
  const mgLng = lng + dLng;
  
  return [mgLng, mgLat];
}

/**
 * GCJ02坐标系转WGS84坐标系
 * @param lng GCJ02经度
 * @param lat GCJ02纬度
 * @returns WGS84坐标 [经度, 纬度]
 */
export function gcj02ToWgs84(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  }

  const [mgLng, mgLat] = wgs84ToGcj02(lng, lat);
  const lngDelta = mgLng - lng;
  const latDelta = mgLat - lat;

  return [lng - lngDelta, lat - latDelta];
}

/**
 * 检查坐标是否在中国范围内
 * @param lng 经度
 * @param lat 纬度
 * @returns 是否在中国范围内
 */
function outOfChina(lng: number, lat: number): boolean {
  if (lng < 72.004 || lng > 137.8347) {
    return true;
  }
  if (lat < 0.8293 || lat > 55.8271) {
    return true;
  }
  return false;
}

/**
 * 经度转换辅助函数
 */
function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
  return ret;
}

/**
 * 纬度转换辅助函数
 */
function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
  return ret;
} 