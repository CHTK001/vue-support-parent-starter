/**
 * 地图工具函数
 * @description 提供地图坐标转换等工具函数
 */
import { transform } from 'ol/proj';
import { MapType } from '../types/map';
import { CoordSystem } from './GcoordObject';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

// 注册 GCJ02 坐标系
proj4.defs('GCJ02', '+proj=longlat +datum=GCJ02');
register(proj4);

/**
 * 经纬度转换为地图投影坐标
 * @param lonLat 经纬度坐标 [经度, 纬度]
 * @param projection 目标投影，默认为'EPSG:3857'
 * @returns 投影坐标 [x, y]
 */
export function fromLonLat(lonLat: number[], projection = 'EPSG:3857'): number[] {
  if (!lonLat || lonLat.length < 2) {
    console.warn('无效的经纬度坐标', lonLat);
    return [0, 0];
  }
  
  try {
    // 如果是 GCJ02 坐标系，需要先转换为 WGS84
    if (projection === 'GCJ02') {
      const wgs84Coord = transform(lonLat, 'GCJ02', 'EPSG:4326');
      return transform(wgs84Coord, 'EPSG:4326', 'EPSG:3857');
    }
    // 其他情况直接转换
    return transform(lonLat, 'EPSG:4326', projection);
  } catch (error) {
    console.error('转换经纬度坐标失败:', error);
    return [0, 0];
  }
}

/**
 * 地图投影坐标转换为经纬度
 * @param coord 投影坐标 [x, y]
 * @param projection 源投影，默认为'EPSG:3857'
 * @returns 经纬度坐标 [经度, 纬度]
 */
export function toLonLat(coord: number[], projection = 'EPSG:3857'): number[] {
  if (!coord || coord.length < 2) {
    console.warn('无效的投影坐标', coord);
    return [0, 0];
  }
  
  try {
    // 如果是 GCJ02 坐标系，需要先转换为 WGS84
    if (projection === 'GCJ02') {
      const wgs84Coord = transform(coord, 'EPSG:3857', 'EPSG:4326');
      return transform(wgs84Coord, 'EPSG:4326', 'GCJ02');
    }
    // 其他情况直接转换
    return transform(coord, projection, 'EPSG:4326');
  } catch (error) {
    console.error('转换投影坐标失败:', error);
    return [0, 0];
  }
}

/**
 * 计算两点之间的距离（平面距离，米）
 * @param point1 点1坐标 [x, y]
 * @param point2 点2坐标 [x, y]
 * @returns 距离（米）
 */
export function calculateDistance(point1: number[], point2: number[]): number {
  if (!point1 || !point2 || point1.length < 2 || point2.length < 2) {
    console.warn('无效的点坐标', { point1, point2 });
    return 0;
  }
  
  try {
    // 平面距离计算
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    return Math.sqrt(dx * dx + dy * dy);
  } catch (error) {
    console.error('计算距离失败:', error);
    return 0;
  }
}

/**
 * 计算两个经纬度坐标之间的距离（球面距离，米）
 * @param lonLat1 点1经纬度 [经度, 纬度]
 * @param lonLat2 点2经纬度 [经度, 纬度]
 * @returns 距离（米）
 */
export function calculateGeoDistance(lonLat1: number[], lonLat2: number[]): number {
  if (!lonLat1 || !lonLat2 || lonLat1.length < 2 || lonLat2.length < 2) {
    console.warn('无效的经纬度坐标', { lonLat1, lonLat2 });
    return 0;
  }
  
  try {
    // 使用球面余弦定理计算距离
    const lon1 = (lonLat1[0] * Math.PI) / 180;
    const lat1 = (lonLat1[1] * Math.PI) / 180;
    const lon2 = (lonLat2[0] * Math.PI) / 180;
    const lat2 = (lonLat2[1] * Math.PI) / 180;
    
    // 地球半径，单位米
    const R = 6371000;
    
    // 基于球面余弦定理计算
    const d = Math.acos(
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)
    ) * R;
    
    return d;
  } catch (error) {
    console.error('计算地理距离失败:', error);
    return 0;
  }
}

/**
 * 检查坐标是否在范围内
 * @param coord 坐标 [x, y]
 * @param extent 范围 [minX, minY, maxX, maxY]
 * @returns 是否在范围内
 */
export function coordInExtent(coord: number[], extent: number[]): boolean {
  if (!coord || !extent || coord.length < 2 || extent.length < 4) {
    console.warn('无效的坐标或范围', { coord, extent });
    return false;
  }
  
  try {
    return (
      coord[0] >= extent[0] &&
      coord[0] <= extent[2] &&
      coord[1] >= extent[1] &&
      coord[1] <= extent[3]
    );
  } catch (error) {
    console.error('检查坐标是否在范围内失败:', error);
    return false;
  }
}

/**
 * 获取范围中心点
 * @param extent 范围 [minX, minY, maxX, maxY]
 * @returns 中心点 [x, y]
 */
export function getExtentCenter(extent: number[]): number[] {
  if (!extent || extent.length < 4) {
    console.warn('无效的范围', extent);
    return [0, 0];
  }
  
  try {
    return [
      (extent[0] + extent[2]) / 2,
      (extent[1] + extent[3]) / 2
    ];
  } catch (error) {
    console.error('获取范围中心点失败:', error);
    return [0, 0];
  }
}

/**
 * 缓冲范围
 * @param extent 范围 [minX, minY, maxX, maxY]
 * @param buffer 缓冲距离
 * @returns 缓冲后的范围 [minX, minY, maxX, maxY]
 */
export function bufferExtent(extent: number[], buffer: number): number[] {
  if (!extent || extent.length < 4) {
    console.warn('无效的范围', extent);
    return [0, 0, 0, 0];
  }
  
  try {
    return [
      extent[0] - buffer,
      extent[1] - buffer,
      extent[2] + buffer,
      extent[3] + buffer
    ];
  } catch (error) {
    console.error('缓冲范围失败:', error);
    return extent;
  }
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
    case MapType.BAIDU:
      return CoordSystem.BD09;
    case MapType.TIANDITU:
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
