/**
 * GcoordUtils - 坐标系转换工具类
 * 基于gcoord库实现不同坐标系之间的相互转换
 * 支持WGS84、GCJ02、BD09等坐标系
 * 提供统一的坐标转换接口，确保所有点位都使用 EPSG:3857 坐标系
 */
import logger from '../composables/LogObject';
import { CoordSystem, MapType, type GeoPoint } from '../types';
import { fromLonLat, toLonLat } from 'ol/proj';
import type { Coordinate as OlCoordinate } from 'ol/coordinate';

// 只导出 CoordSystem 枚举，不再导出GeoPoint类型
export { CoordSystem };

/**
 * 由于gcoord库的TypeScript类型定义可能有问题，
 * 这里直接使用require导入，避免TS编译器报错
 */
// @ts-ignore
const gcoord = require('gcoord');

/**
 * 坐标系转换工具类
 */
export class GcoordUtils {
  /**
   * 坐标系类型映射到gcoord对应的常量
   * @private
   */
  private static coordSystemMap = {
    [CoordSystem.WGS84]: gcoord.WGS84,
    [CoordSystem.GCJ02]: gcoord.GCJ02,
    [CoordSystem.BD09]: gcoord.BD09,
    [CoordSystem.EPSG3857]: gcoord.EPSG3857,
    [CoordSystem.EPSG4490]: gcoord.EPSG4490
  };

  /**
   * 记录坐标转换日志
   * @private
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  private static logCoordinate(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    logger[level](`[GcoordUtils] ${message}`, data);
  }

  /**
   * 转换坐标点为[lng, lat]数组格式
   * @param point 坐标点
   * @returns [经度, 纬度]数组
   */
  public static toArray(point: GeoPoint): [number, number] {
    if (Array.isArray(point)) {
      return point;
    }
    return [point.lng, point.lat];
  }

  /**
   * 转换坐标点为{lng, lat}对象格式
   * @param point 坐标点
   * @returns {lng, lat}对象
   */
  public static toObject(point: GeoPoint): { lng: number; lat: number } {
    if (Array.isArray(point)) {
      return { lng: point[0], lat: point[1] };
    }
    return point;
  }

  /**
   * 坐标转换
   * @param point 坐标点
   * @param from 源坐标系
   * @param to 目标坐标系
   * @returns 转换后的坐标点，与输入格式保持一致
   */
  public static transform(
    point: GeoPoint,
    from: CoordSystem,
    to: CoordSystem
  ): GeoPoint {
    if (from === to) {
      return point; // 如果源坐标系和目标坐标系相同，直接返回
    }

    try {
      const isArray = Array.isArray(point);
      const pointArray = this.toArray(point);
      
      this.logCoordinate('debug', `转换坐标: ${from} -> ${to}`, {
        from: from,
        to: to,
        point: pointArray
      });
      
      // 执行坐标转换
      const result = gcoord.transform(
        pointArray,
        this.coordSystemMap[from],
        this.coordSystemMap[to]
      );

      this.logCoordinate('debug', `转换结果`, {
        from: from,
        to: to,
        input: pointArray,
        output: result
      });

      // 返回原始格式的坐标
      return isArray ? result : this.toObject(result);
    } catch (error) {
      this.logCoordinate('error', '坐标转换失败:', { error, point, from, to });
      return point; // 转换失败返回原始坐标
    }
  }

  /**
   * WGS84坐标转GCJ02坐标
   * @param point 坐标点
   * @returns 转换后的坐标点
   */
  public static wgs84ToGcj02(point: GeoPoint): GeoPoint {
    return this.transform(point, CoordSystem.WGS84, CoordSystem.GCJ02);
  }

  /**
   * GCJ02坐标转WGS84坐标
   * @param point 坐标点
   * @returns 转换后的坐标点
   */
  public static gcj02ToWgs84(point: GeoPoint): GeoPoint {
    return this.transform(point, CoordSystem.GCJ02, CoordSystem.WGS84);
  }

  /**
   * WGS84坐标转BD09坐标
   * @param point 坐标点
   * @returns 转换后的坐标点
   */
  public static wgs84ToBd09(point: GeoPoint): GeoPoint {
    return this.transform(point, CoordSystem.WGS84, CoordSystem.BD09);
  }

  /**
   * BD09转WGS84坐标
   * @param point 坐标点
   * @returns 转换后的坐标点
   */
  public static bd09ToWgs84(point: GeoPoint): GeoPoint {
    return this.transform(point, CoordSystem.BD09, CoordSystem.WGS84);
  }

  /**
   * GCJ02转BD09坐标
   * @param point 坐标点
   * @returns 转换后的坐标点
   */
  public static gcj02ToBd09(point: GeoPoint): GeoPoint {
    return this.transform(point, CoordSystem.GCJ02, CoordSystem.BD09);
  }

  /**
   * BD09转GCJ02坐标
   * @param point 坐标点
   * @returns 转换后的坐标点
   */
  public static bd09ToGcj02(point: GeoPoint): GeoPoint {
    return this.transform(point, CoordSystem.BD09, CoordSystem.GCJ02);
  }

  /**
   * WGS84转Web墨卡托 (EPSG:3857)
   * @param point 坐标点
   * @returns 转换后的坐标点
   */
  public static wgs84ToEpsg3857(point: GeoPoint): GeoPoint {
    return this.transform(point, CoordSystem.WGS84, CoordSystem.EPSG3857);
  }

  /**
   * Web墨卡托 (EPSG:3857) 转WGS84
   * @param point 坐标点
   * @returns 转换后的坐标点
   */
  public static epsg3857ToWgs84(point: GeoPoint): GeoPoint {
    return this.transform(point, CoordSystem.EPSG3857, CoordSystem.WGS84);
  }

  /**
   * 任意坐标系转Web墨卡托 (EPSG:3857)
   * @param point 坐标点
   * @param fromCoordSystem 源坐标系
   * @returns EPSG:3857坐标点
   */
  public static toEpsg3857(point: GeoPoint, fromCoordSystem: CoordSystem): GeoPoint {
    if (fromCoordSystem === CoordSystem.EPSG3857) {
      return point;
    }
    return this.transform(point, fromCoordSystem, CoordSystem.EPSG3857);
  }

  /**
   * Web墨卡托 (EPSG:3857) 转任意坐标系
   * @param point EPSG:3857坐标点
   * @param toCoordSystem 目标坐标系
   * @returns 转换后的坐标点
   */
  public static fromEpsg3857(point: GeoPoint, toCoordSystem: CoordSystem): GeoPoint {
    if (toCoordSystem === CoordSystem.EPSG3857) {
      return point;
    }
    return this.transform(point, CoordSystem.EPSG3857, toCoordSystem);
  }

  /**
   * 根据地图类型自动选择坐标系转换
   * 将WGS84坐标转换为目标地图所需要的坐标系
   * @param point WGS84坐标点
   * @param mapType 地图类型，如高德、百度等
   * @returns 转换后的坐标点
   */
  public static wgs84ToMapCoord(point: GeoPoint, mapType: string): GeoPoint {
    const mapTypeUpper = mapType.toUpperCase();
    
    // 根据地图类型选择目标坐标系
    if (mapTypeUpper.includes('BAIDU') || mapTypeUpper === 'BD09') {
      return this.wgs84ToBd09(point);
    } else if (
      mapTypeUpper.includes('GAODE') || 
      mapTypeUpper.includes('AMAP') || 
      mapTypeUpper.includes('TENCENT') || 
      mapTypeUpper === 'GCJ02'
    ) {
      return this.wgs84ToGcj02(point);
    } else if (
      mapTypeUpper.includes('OSM') || 
      mapTypeUpper.includes('EPSG3857')
    ) {
      return point; // OSM使用WGS84，不需要转换
    }
    
    // 默认返回原始坐标
    return point;
  }

  /**
   * 将地图坐标转换为WGS84坐标
   * @param point 坐标点
   * @param mapType 地图类型
   * @returns WGS84坐标点
   */
  public static mapCoordToWgs84(point: GeoPoint, mapType: string): GeoPoint {
    const mapTypeUpper = mapType.toUpperCase();
    
    if (mapTypeUpper.includes('BAIDU') || mapTypeUpper === 'BD09') {
      return this.bd09ToWgs84(point);
    } else if (
      mapTypeUpper.includes('GAODE') || 
      mapTypeUpper.includes('AMAP') || 
      mapTypeUpper.includes('TENCENT') || 
      mapTypeUpper === 'GCJ02'
    ) {
      return this.gcj02ToWgs84(point);
    }
    
    // 默认返回原始坐标
    return point;
  }

  /**
   * 将任意地图坐标转换为EPSG:3857坐标
   * @param point 坐标点
   * @param mapType 地图类型
   * @returns EPSG:3857坐标点
   */
  public static mapCoordToEpsg3857(point: GeoPoint, mapType: string): GeoPoint {
    // 先转为WGS84
    const wgs84Point = this.mapCoordToWgs84(point, mapType);
    // 再转为EPSG:3857
    return this.wgs84ToEpsg3857(wgs84Point);
  }

  /**
   * 将EPSG:3857坐标转换为地图坐标
   * @param point EPSG:3857坐标点
   * @param mapType 地图类型
   * @returns 地图坐标点
   */
  public static epsg3857ToMapCoord(point: GeoPoint, mapType: string): GeoPoint {
    // 先转为WGS84
    const wgs84Point = this.epsg3857ToWgs84(point);
    // 再转为地图坐标
    return this.wgs84ToMapCoord(wgs84Point, mapType);
  }

  /**
   * 检查坐标是否有效
   * @param point 坐标点
   * @returns 是否有效
   */
  public static isValidCoordinate(point: GeoPoint): boolean {
    try {
      let lng, lat;
      
      if (Array.isArray(point)) {
        [lng, lat] = point;
      } else {
        lng = point.lng;
        lat = point.lat;
      }
      
      // 检查经纬度是否为数字且在有效范围内
      return (
        typeof lng === 'number' && 
        typeof lat === 'number' &&
        !isNaN(lng) && 
        !isNaN(lat) &&
        lng >= -180 && 
        lng <= 180 &&
        lat >= -90 && 
        lat <= 90
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * 将 WGS84 坐标转换为 EPSG:3857 坐标（使用 OpenLayers）
   * @param lat 纬度
   * @param lon 经度
   * @returns [x, y] EPSG:3857 坐标
   */
  public static wgs84ToEpsg3857Precise(lat: number, lon: number): [number, number] {
    try {
      const result = fromLonLat([lon, lat], 'EPSG:3857') as OlCoordinate;
      return [result[0], result[1]];
    } catch (error) {
      logger.error('坐标转换失败 (WGS84 -> EPSG:3857):', error);
      return [0, 0];
    }
  }

  /**
   * 将 EPSG:3857 坐标转换为 WGS84 坐标（使用 OpenLayers）
   * @param x EPSG:3857 x坐标
   * @param y EPSG:3857 y坐标
   * @returns [lat, lon] WGS84 坐标
   */
  public static epsg3857ToWgs84Precise(x: number, y: number): [number, number] {
    try {
      const lonLat = toLonLat([x, y], 'EPSG:3857') as OlCoordinate;
      return [lonLat[1], lonLat[0]]; // 转换为 [lat, lon] 格式
    } catch (error) {
      logger.error('坐标转换失败 (EPSG:3857 -> WGS84):', error);
      return [0, 0];
    }
  }

  /**
   * 批量转换 WGS84 坐标点数组为 EPSG:3857
   * @param points WGS84 坐标点数组
   * @returns EPSG:3857 坐标点数组
   */
  public static batchWgs84ToEpsg3857(points: GeoPoint[]): GeoPoint[] {
    return points.map(point => this.wgs84ToEpsg3857(point));
  }

  /**
   * 将任意坐标系的坐标统一转换为 EPSG:3857
   * @param point 坐标点
   * @param fromCoordSystem 源坐标系
   * @returns EPSG:3857 坐标点
   */
  public static anyToEpsg3857(point: GeoPoint, fromCoordSystem: CoordSystem): GeoPoint {
    return this.toEpsg3857(point, fromCoordSystem);
  }

  /**
   * 计算两点之间的距离（米）
   * @param point1 起点坐标
   * @param point2 终点坐标
   * @param coordSystem 坐标系类型，默认WGS84
   * @returns 距离，单位米
   */
  public static distance(
    point1: GeoPoint,
    point2: GeoPoint,
    coordSystem: CoordSystem = CoordSystem.WGS84
  ): number {
    // 如果不是WGS84坐标系，先转换为WGS84
    const p1 = coordSystem !== CoordSystem.WGS84 
      ? this.transform(point1, coordSystem, CoordSystem.WGS84) 
      : point1;
    const p2 = coordSystem !== CoordSystem.WGS84 
      ? this.transform(point2, coordSystem, CoordSystem.WGS84) 
      : point2;

    // 转换为数组格式
    const p1Arr = this.toArray(p1);
    const p2Arr = this.toArray(p2);

    // 使用gcoord计算距离
    return gcoord.distance(p1Arr, p2Arr);
  }

  /**
   * 根据地图类型获取对应的坐标系统 
   * @param mapType 地图类型
   * @returns 对应的坐标系统
   */
  public static getCoordSystemByMapType(mapType: MapType): CoordSystem {
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
  public static convertCoordSystemToProjection(coordSystem: CoordSystem): string {
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
   * WGS84坐标转GCJ02坐标
   * @param lng WGS84经度
   * @param lat WGS84纬度
   * @returns GCJ02坐标
   * @deprecated 请使用 wgs84ToGcj02(point) 替代
   */
  public static wgs84ToGcj02ByLngLat(lng: number, lat: number): [number, number] {
    const point = this.wgs84ToGcj02([lng, lat]);
    if (Array.isArray(point)) {
      return point;
    }
    return [point.lng, point.lat];
  }

  /**
   * GCJ02坐标转WGS84坐标
   * @param lng GCJ02经度
   * @param lat GCJ02纬度
   * @returns WGS84坐标
   * @deprecated 请使用 gcj02ToWgs84(point) 替代
   */
  public static gcj02ToWgs84ByLngLat(lng: number, lat: number): [number, number] {
    const point = this.gcj02ToWgs84([lng, lat]);
    if (Array.isArray(point)) {
      return point;
    }
    return [point.lng, point.lat];
  }

  /**
   * WGS84坐标转BD09坐标
   * @param lng WGS84经度
   * @param lat WGS84纬度
   * @returns BD09坐标
   * @deprecated 请使用 wgs84ToBd09(point) 替代
   */
  public static wgs84ToBd09ByLngLat(lng: number, lat: number): [number, number] {
    const point = this.wgs84ToBd09([lng, lat]);
    if (Array.isArray(point)) {
      return point;
    }
    return [point.lng, point.lat];
  }

  /**
   * BD09坐标转WGS84坐标
   * @param lng BD09经度
   * @param lat BD09纬度
   * @returns WGS84坐标
   * @deprecated 请使用 bd09ToWgs84(point) 替代
   */
  public static bd09ToWgs84ByLngLat(lng: number, lat: number): [number, number] {
    const point = this.bd09ToWgs84([lng, lat]);
    if (Array.isArray(point)) {
      return point;
    }
    return [point.lng, point.lat];
  }

  /**
   * GCJ02坐标转BD09坐标
   * @param lng GCJ02经度
   * @param lat GCJ02纬度
   * @returns BD09坐标
   * @deprecated 请使用 gcj02ToBd09(point) 替代
   */
  public static gcj02ToBd09ByLngLat(lng: number, lat: number): [number, number] {
    const point = this.gcj02ToBd09([lng, lat]);
    if (Array.isArray(point)) {
      return point;
    }
    return [point.lng, point.lat];
  }

  /**
   * BD09坐标转GCJ02坐标
   * @param lng BD09经度
   * @param lat BD09纬度
   * @returns GCJ02坐标
   * @deprecated 请使用 bd09ToGcj02(point) 替代
   */
  public static bd09ToGcj02ByLngLat(lng: number, lat: number): [number, number] {
    const point = this.bd09ToGcj02([lng, lat]);
    if (Array.isArray(point)) {
      return point;
    }
    return [point.lng, point.lat];
  }

  /**
   * 将坐标点转换为 EPSG:3857
   * @param point 坐标点
   * @param coordSystem 坐标系统
   * @returns EPSG:3857 坐标点
   */
  public static convertToEpsg3857(point: GeoPoint, coordSystem?: CoordSystem): GeoPoint {
    // 如果没有提供坐标系，默认为WGS84
    if (!coordSystem) {
      coordSystem = CoordSystem.WGS84;
    }

    // 如果已经是EPSG:3857，直接返回
    if (coordSystem === CoordSystem.EPSG3857) {
      return point;
    }

    // 如果是WGS84，使用OpenLayers的fromLonLat函数直接转换
    if (coordSystem === CoordSystem.WGS84) {
      const pointArray = Array.isArray(point) ? point : [point.lng, point.lat];
      this.logCoordinate('debug', `直接转换为EPSG:3857 (使用fromLonLat)`, {
        input: pointArray,
        coordSystem: coordSystem || 'WGS84(默认)'
      });
      const result = fromLonLat(pointArray);
      this.logCoordinate('debug', `转换结果`, {
        input: pointArray,
        output: result,
        coordSystem: coordSystem || 'WGS84(默认)'
      });
      return Array.isArray(point) ? result as GeoPoint : { lng: result[0], lat: result[1] };
    }

    // 将坐标系统转换为 CoordSystem
    let fromCoordSystem: CoordSystem;
    switch (coordSystem) {
      case CoordSystem.GCJ02:
        fromCoordSystem = CoordSystem.GCJ02;
        break;
      case CoordSystem.BD09:
        fromCoordSystem = CoordSystem.BD09;
        break;
      case CoordSystem.EPSG4490:
        fromCoordSystem = CoordSystem.EPSG4490;
        break;
      default:
        fromCoordSystem = CoordSystem.WGS84;
    }
    
    this.logCoordinate('debug', `转换为EPSG:3857`, {
      input: Array.isArray(point) ? point : [point.lng, point.lat],
      coordSystem: coordSystem,
      fromCoordSystem: fromCoordSystem
    });
    
    // 使用 GcoordUtils 转换为 EPSG:3857
    const epsg3857Point = this.anyToEpsg3857(point, fromCoordSystem);
    
    this.logCoordinate('debug', `转换结果`, {
      input: Array.isArray(point) ? point : [point.lng, point.lat],
      output: Array.isArray(epsg3857Point) ? epsg3857Point : [epsg3857Point.lng, epsg3857Point.lat],
      coordSystem: coordSystem,
      fromCoordSystem: fromCoordSystem
    });
    
    return epsg3857Point;
  }

  /**
   * 将多个坐标点批量转换为 EPSG:3857
   * @param points 坐标点数组
   * @param coordSystem 坐标系统
   * @returns EPSG:3857 坐标点数组
   */
  public static convertPointsToEpsg3857(points: GeoPoint[], coordSystem?: CoordSystem): GeoPoint[] {
    this.logCoordinate('debug', `批量转换为EPSG:3857`, {
      pointCount: points.length,
      coordSystem: coordSystem || 'WGS84(默认)'
    });
    
    const result = points.map(point => this.convertToEpsg3857(point, coordSystem));
    
    this.logCoordinate('debug', `批量转换结果`, {
      pointCount: points.length,
      coordSystem: coordSystem || 'WGS84(默认)'
    });
    
    return result;
  }

  /**
   * 将 GeoPoint 转换为 OpenLayers 坐标格式
   * @param point 坐标点
   * @param coordSystem 坐标系统
   * @returns OpenLayers 坐标格式 (number[])
   */
  public static convertToOlCoordinate(point: GeoPoint, coordSystem: CoordSystem = CoordSystem.WGS84): number[] {
    // 先转换为 EPSG:3857
    const epsg3857Point = this.convertToEpsg3857(point, coordSystem);
    
    // 确保返回数组格式
    return Array.isArray(epsg3857Point) ? epsg3857Point : [epsg3857Point.lng, epsg3857Point.lat];
  }
} 

// 为了向后兼容，导出一些旧的函数名称
export const wgs84ToGcj02 = GcoordUtils.wgs84ToGcj02ByLngLat.bind(GcoordUtils);
export const gcj02ToWgs84 = GcoordUtils.gcj02ToWgs84ByLngLat.bind(GcoordUtils);
export const wgs84ToBd09 = GcoordUtils.wgs84ToBd09ByLngLat.bind(GcoordUtils);
export const bd09ToWgs84 = GcoordUtils.bd09ToWgs84ByLngLat.bind(GcoordUtils);
export const gcj02ToBd09 = GcoordUtils.gcj02ToBd09ByLngLat.bind(GcoordUtils);
export const bd09ToGcj02 = GcoordUtils.bd09ToGcj02ByLngLat.bind(GcoordUtils);
export const distance = GcoordUtils.distance.bind(GcoordUtils);
export const isValidCoordinate = GcoordUtils.isValidCoordinate.bind(GcoordUtils);
export const getCoordSystemByMapType = GcoordUtils.getCoordSystemByMapType.bind(GcoordUtils);
export const convertCoordSystemToProjection = GcoordUtils.convertCoordSystemToProjection.bind(GcoordUtils); 