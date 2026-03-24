/**
 * 坐标系统转换对象
 * @description 统一处理不同地图坐标系的转换，避免坐标偏移问题
 * 所有点位将统一转换为EPSG:3857坐标系
 */
import { MapType } from '../types/map';
import { CoordSystem, GeoPoint } from '../types/coordinate';
import { GcoordUtils } from '../utils/GcoordUtils';
import logger from './LogObject';

export class GcoordObject {
  // 地图类型
  private mapType: MapType;
  
  // 当前地图使用的坐标系统
  private mapCoordSystem: CoordSystem;
  
  // 内部统一使用的坐标系 - 固定为EPSG:3857
  private readonly internalCoordSystem: CoordSystem = CoordSystem.EPSG3857;
  
  /**
   * 构造函数
   * @param mapType 地图类型
   */
  constructor(mapType: MapType = MapType.GAODE) {
    this.mapType = mapType;
    this.mapCoordSystem = this.getCoordSystemByMapType(mapType);
    logger.debug(`坐标系统对象初始化完成，当前地图类型: ${mapType}，地图坐标系统: ${this.mapCoordSystem}，内部坐标系统: ${this.internalCoordSystem}`);
  }
  
  /**
   * 设置地图类型并更新坐标系统
   * @param mapType 地图类型
   */
  public setMapType(mapType: MapType): void {
    this.mapType = mapType;
    this.mapCoordSystem = this.getCoordSystemByMapType(mapType);
    logger.debug(`坐标系统已更新，当前地图类型: ${mapType}，地图坐标系统: ${this.mapCoordSystem}，内部坐标系统: ${this.internalCoordSystem}`);
  }
  
  /**
   * 获取当前地图类型
   * @returns 当前地图类型
   */
  public getMapType(): MapType {
    return this.mapType;
  }
  
  /**
   * 获取当前地图坐标系统
   * @returns 当前地图坐标系统
   */
  public getMapCoordSystem(): CoordSystem {
    return this.mapCoordSystem;
  }
  
  /**
   * 获取内部使用的坐标系统（EPSG:3857）
   * @returns 内部坐标系统
   */
  public getInternalCoordSystem(): CoordSystem {
    return this.internalCoordSystem;
  }
  
  /**
   * 根据地图类型获取对应的坐标系统
   * @param mapType 地图类型
   * @returns 对应的坐标系统
   */
  private getCoordSystemByMapType(mapType: MapType): CoordSystem {
    switch (mapType) {
      case MapType.GAODE:
        return CoordSystem.GCJ02;
      case MapType.BAIDU:
        return CoordSystem.BD09;
      case MapType.TIANDITU:
        return CoordSystem.EPSG4490;
      case MapType.OSM:
      case MapType.GOOGLE:
      case MapType.BING:
      default:
        return CoordSystem.WGS84;
    }
  }
  
  /**
   * 将WGS84坐标转换为内部坐标系统（EPSG:3857）
   * @param point WGS84坐标点
   * @returns EPSG:3857坐标点
   */
  public fromWGS84(point: GeoPoint): GeoPoint {
    return GcoordUtils.wgs84ToEpsg3857(point);
  }
  
  /**
   * 将内部坐标系统（EPSG:3857）的坐标转换为WGS84坐标
   * @param point EPSG:3857坐标点
   * @returns WGS84坐标点
   */
  public toWGS84(point: GeoPoint): GeoPoint {
    return GcoordUtils.epsg3857ToWgs84(point);
  }
  
  /**
   * 将地图坐标转换为内部坐标系统（EPSG:3857）
   * @param point 地图坐标点
   * @returns EPSG:3857坐标点
   */
  public fromMapCoord(point: GeoPoint): GeoPoint {
    // 先转为WGS84
    const wgs84Point = GcoordUtils.transform(point, this.mapCoordSystem, CoordSystem.WGS84);
    // 再转为EPSG:3857
    return this.fromWGS84(wgs84Point);
  }
  
  /**
   * 将内部坐标系统（EPSG:3857）的坐标转换为地图坐标
   * @param point EPSG:3857坐标点
   * @returns 地图坐标点
   */
  public toMapCoord(point: GeoPoint): GeoPoint {
    // 先转为WGS84
    const wgs84Point = this.toWGS84(point);
    // 再转为地图坐标
    return GcoordUtils.transform(wgs84Point, CoordSystem.WGS84, this.mapCoordSystem);
  }
  
  /**
   * 将指定坐标系统的坐标转换为内部坐标系统（EPSG:3857）
   * @param point 坐标点
   * @param fromCoordSystem 源坐标系统
   * @returns EPSG:3857坐标点
   */
  public convertToInternalCoord(point: GeoPoint, fromCoordSystem: CoordSystem): GeoPoint {
    if (fromCoordSystem === this.internalCoordSystem) {
      return point; // 相同坐标系统无需转换
    }
    
    return GcoordUtils.toEpsg3857(point, fromCoordSystem);
  }
  
  /**
   * 将内部坐标系统（EPSG:3857）的坐标转换为指定坐标系统
   * @param point EPSG:3857坐标点
   * @param toCoordSystem 目标坐标系统
   * @returns 转换后的坐标点
   */
  public convertFromInternalCoord(point: GeoPoint, toCoordSystem: CoordSystem): GeoPoint {
    if (toCoordSystem === this.internalCoordSystem) {
      return point; // 相同坐标系统无需转换
    }
    
    return GcoordUtils.fromEpsg3857(point, toCoordSystem);
  }
  
  /**
   * 批量转换坐标点为内部坐标系统（EPSG:3857）
   * @param points 坐标点数组
   * @param fromCoordSystem 源坐标系统
   * @returns EPSG:3857坐标点数组
   */
  public convertPointsToInternal(points: GeoPoint[], fromCoordSystem: CoordSystem): GeoPoint[] {
    return points.map(point => this.convertToInternalCoord(point, fromCoordSystem));
  }
  
  /**
   * 批量将内部坐标系统（EPSG:3857）的点转换为指定坐标系统
   * @param points EPSG:3857坐标点数组
   * @param toCoordSystem 目标坐标系统
   * @returns 转换后的坐标点数组
   */
  public convertPointsFromInternal(points: GeoPoint[], toCoordSystem: CoordSystem): GeoPoint[] {
    return points.map(point => this.convertFromInternalCoord(point, toCoordSystem));
  }

  /**
   * 检查给定的坐标是否为有效坐标
   * @param point 要检查的坐标点
   * @returns 是否为有效坐标
   */
  public isValidCoordinate(point: GeoPoint): boolean {
    return GcoordUtils.isValidCoordinate(point);
  }
  
  /**
   * 计算两点之间的距离（米），基于内部坐标系统（EPSG:3857）
   * @param point1 第一个点（EPSG:3857坐标系）
   * @param point2 第二个点（EPSG:3857坐标系）
   * @returns 距离，单位米
   */
  public distance(point1: GeoPoint, point2: GeoPoint): number {
    // 将EPSG:3857坐标先转为WGS84，因为距离计算在WGS84上更准确
    const wgs84Point1 = this.toWGS84(point1);
    const wgs84Point2 = this.toWGS84(point2);
    return GcoordUtils.distance(wgs84Point1, wgs84Point2, CoordSystem.WGS84);
  }
  
  /**
   * 销毁对象
   */
  public destroy(): void {
    logger.debug('坐标系统对象已销毁');
  }
} 