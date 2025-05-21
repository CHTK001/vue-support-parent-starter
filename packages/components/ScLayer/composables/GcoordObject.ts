/**
 * 坐标系统转换对象
 * @description 统一处理不同地图坐标系的转换，避免坐标偏移问题
 */
import { MapType } from '../types/map';
import { CoordSystem, wgs84ToGcj02, gcj02ToWgs84 } from '../utils/coordUtils';
import logger from './LogObject';

// 坐标点接口
export interface GeoPoint {
  lng: number;
  lat: number;
}

export class GcoordObject {
  // 地图类型
  private mapType: MapType;
  
  // 当前坐标系统
  private coordSystem: CoordSystem;
  
  /**
   * 构造函数
   * @param mapType 地图类型
   */
  constructor(mapType: MapType = MapType.GAODE) {
    this.mapType = mapType;
    this.coordSystem = this.getCoordSystemByMapType(mapType);
    logger.debug(`坐标系统对象初始化完成，当前地图类型: ${mapType}，坐标系统: ${this.coordSystem}`);
  }
  
  /**
   * 设置地图类型并更新坐标系统
   * @param mapType 地图类型
   */
  public setMapType(mapType: MapType): void {
    this.mapType = mapType;
    this.coordSystem = this.getCoordSystemByMapType(mapType);
    logger.debug(`坐标系统已更新，当前地图类型: ${mapType}，坐标系统: ${this.coordSystem}`);
  }
  
  /**
   * 获取当前地图类型
   * @returns 当前地图类型
   */
  public getMapType(): MapType {
    return this.mapType;
  }
  
  /**
   * 获取当前坐标系统
   * @returns 当前坐标系统
   */
  public getCoordSystem(): CoordSystem {
    return this.coordSystem;
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
      default:
        return CoordSystem.WGS84;
    }
  }
  
  /**
   * 将WGS84坐标转换为当前地图使用的坐标系统
   * @param point WGS84坐标点
   * @returns 转换后的坐标点
   */
  public fromWGS84(point: GeoPoint): GeoPoint {
    const { lng, lat } = point;
    
    switch (this.coordSystem) {
      case CoordSystem.GCJ02:
        const [gcj02Lng, gcj02Lat] = wgs84ToGcj02(lng, lat);
        return { lng: gcj02Lng, lat: gcj02Lat };
      case CoordSystem.BD09:
        // 先转GCJ02，再转BD09
        const [tempLng, tempLat] = wgs84ToGcj02(lng, lat);
        return this.gcj02ToBd09(tempLng, tempLat);
      case CoordSystem.WGS84:
      case CoordSystem.EPSG4326:
      default:
        return { lng, lat };
    }
  }
  
  /**
   * 将当前地图坐标系统的坐标转换为WGS84坐标
   * @param point 当前地图坐标点
   * @returns WGS84坐标点
   */
  public toWGS84(point: GeoPoint): GeoPoint {
    const { lng, lat } = point;
    
    switch (this.coordSystem) {
      case CoordSystem.GCJ02:
        const [wgs84Lng, wgs84Lat] = gcj02ToWgs84(lng, lat);
        return { lng: wgs84Lng, lat: wgs84Lat };
      case CoordSystem.BD09:
        // 先转GCJ02，再转WGS84
        const [tempLng, tempLat] = this.bd09ToGcj02(lng, lat);
        return { lng: gcj02ToWgs84(tempLng, tempLat)[0], lat: gcj02ToWgs84(tempLng, tempLat)[1] };
      case CoordSystem.WGS84:
      case CoordSystem.EPSG4326:
      default:
        return { lng, lat };
    }
  }
  
  /**
   * 将指定坐标系统的坐标转换为当前地图坐标系统
   * @param point 坐标点
   * @param fromSystem 源坐标系统
   * @returns 转换后的坐标点
   */
  public convertToMapCoord(point: GeoPoint, fromSystem: CoordSystem): GeoPoint {
    if (fromSystem === this.coordSystem) {
      return point; // 相同坐标系统无需转换
    }
    
    // 先统一转为WGS84
    let wgs84Point: GeoPoint;
    switch (fromSystem) {
      case CoordSystem.GCJ02:
        const [wgs84Lng, wgs84Lat] = gcj02ToWgs84(point.lng, point.lat);
        wgs84Point = { lng: wgs84Lng, lat: wgs84Lat };
        break;
      case CoordSystem.BD09:
        const [gcjLng, gcjLat] = this.bd09ToGcj02(point.lng, point.lat);
        const [wLng, wLat] = gcj02ToWgs84(gcjLng, gcjLat);
        wgs84Point = { lng: wLng, lat: wLat };
        break;
      case CoordSystem.WGS84:
      case CoordSystem.EPSG4326:
      default:
        wgs84Point = point;
        break;
    }
    
    // 再从WGS84转为目标坐标系
    return this.fromWGS84(wgs84Point);
  }
  
  /**
   * 将当前地图坐标系统的坐标转换为指定坐标系统
   * @param point 当前地图坐标点
   * @param toSystem 目标坐标系统
   * @returns 转换后的坐标点
   */
  public convertFromMapCoord(point: GeoPoint, toSystem: CoordSystem): GeoPoint {
    if (toSystem === this.coordSystem) {
      return point; // 相同坐标系统无需转换
    }
    
    // 先转为WGS84
    const wgs84Point = this.toWGS84(point);
    
    // 再从WGS84转为目标坐标系
    switch (toSystem) {
      case CoordSystem.GCJ02:
        const [gcjLng, gcjLat] = wgs84ToGcj02(wgs84Point.lng, wgs84Point.lat);
        return { lng: gcjLng, lat: gcjLat };
      case CoordSystem.BD09:
        const [tempLng, tempLat] = wgs84ToGcj02(wgs84Point.lng, wgs84Point.lat);
        return this.gcj02ToBd09(tempLng, tempLat);
      case CoordSystem.WGS84:
      case CoordSystem.EPSG4326:
      default:
        return wgs84Point;
    }
  }
  
  /**
   * GCJ02坐标转BD09坐标
   * @param lng GCJ02经度
   * @param lat GCJ02纬度
   * @returns BD09坐标点
   */
  private gcj02ToBd09(lng: number, lat: number): GeoPoint {
    const PI = 3.14159265358979324;
    const x_pi = PI * 3000.0 / 180.0;
    
    const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_pi);
    const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_pi);
    const bdLng = z * Math.cos(theta) + 0.0065;
    const bdLat = z * Math.sin(theta) + 0.006;
    
    return { lng: bdLng, lat: bdLat };
  }
  
  /**
   * BD09坐标转GCJ02坐标
   * @param lng BD09经度
   * @param lat BD09纬度
   * @returns GCJ02坐标点
   */
  private bd09ToGcj02(lng: number, lat: number): [number, number] {
    const PI = 3.14159265358979324;
    const x_pi = PI * 3000.0 / 180.0;
    
    const x = lng - 0.0065;
    const y = lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
    const gcjLng = z * Math.cos(theta);
    const gcjLat = z * Math.sin(theta);
    
    return [gcjLng, gcjLat];
  }
  
  /**
   * 批量转换坐标点
   * @param points 坐标点数组
   * @param fromSystem 源坐标系统
   * @returns 转换后的坐标点数组
   */
  public convertPoints(points: GeoPoint[], fromSystem: CoordSystem): GeoPoint[] {
    return points.map(point => this.convertToMapCoord(point, fromSystem));
  }

  /**
   * 检查给定的坐标是否为有效坐标
   * @param point 要检查的坐标点
   * @returns 是否为有效坐标
   */
  public isValidCoordinate(point: GeoPoint): boolean {
    const { lng, lat } = point;
    
    // 经度范围：-180 到 180
    // 纬度范围：-90 到 90
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
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    logger.debug('坐标系统对象已销毁');
  }
} 