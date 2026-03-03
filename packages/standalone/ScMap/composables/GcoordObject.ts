/**
 * 坐标系转换对象
 * @description 提供不同坐标系统间的转换功能
 */
import { MapType } from '../types/map';
import logger from './LogObject';
import { getCoordSystemByMapType } from './MapUtils';

/**
 * 支持的坐标系统枚举
 */
export enum CoordSystem {
  WGS84 = 'WGS84',     // 国际标准坐标系统(GPS)
  GCJ02 = 'GCJ02',     // 国测局坐标系统(高德、腾讯)
  BD09 = 'BD09',       // 百度坐标系统
  EPSG3857 = 'EPSG:3857', // Web墨卡托投影
  EPSG4326 = 'EPSG:4326'  // WGS84的别名
}

/**
 * 坐标点接口
 */
export interface Coordinate {
  lng: number;
  lat: number;
}

/**
 * 坐标配置接口
 */
export interface GcoordConfig {
  sourceSystem?: CoordSystem; // 源坐标系统
  targetSystem?: CoordSystem; // 目标坐标系统
  mapType?: MapType;          // 地图类型
}

/**
 * 坐标转换对象
 */
export class GcoordObject {
  private sourceSystem: CoordSystem;
  private targetSystem: CoordSystem;
  private mapType: MapType;

  /**
   * 构造函数
   * @param config 坐标配置
   */
  constructor(config: GcoordConfig = {}) {
    // 默认源坐标系为WGS84(GPS)
    this.sourceSystem = config.sourceSystem || CoordSystem.WGS84;
    
    // 根据地图类型设置默认目标坐标系
    this.mapType = config.mapType || MapType.GAODE;
    this.targetSystem = config.targetSystem || getCoordSystemByMapType(this.mapType);
    
    logger.debug(`GcoordObject已初始化，源坐标系: ${this.sourceSystem}，目标坐标系: ${this.targetSystem}`);
  }

  /**
   * 根据地图类型设置目标坐标系统
   * @param mapType 地图类型
   */
  public setMapType(mapType: MapType): void {
    this.mapType = mapType;
    this.targetSystem = getCoordSystemByMapType(mapType);
    logger.debug(`已根据地图类型(${mapType})更新目标坐标系: ${this.targetSystem}`);
  }

  /**
   * 获取当前使用的源坐标系统
   * @returns 源坐标系统
   */
  public getSourceSystem(): CoordSystem {
    return this.sourceSystem;
  }

  /**
   * 获取当前使用的目标坐标系统
   * @returns 目标坐标系统
   */
  public getTargetSystem(): CoordSystem {
    return this.targetSystem;
  }

  /**
   * WGS84坐标系转GCJ02坐标系
   * @param lng WGS84经度
   * @param lat WGS84纬度
   * @returns GCJ02坐标
   */
  public wgs84ToGcj02(lng: number, lat: number): Coordinate {
    if (this.outOfChina(lng, lat)) {
      return { lng, lat };
    }

    const PI = 3.14159265358979324;
    const a = 6378245.0;
    const ee = 0.00669342162296594323;

    let dLat = this.transformLat(lng - 105.0, lat - 35.0);
    let dLng = this.transformLng(lng - 105.0, lat - 35.0);

    const radLat = (lat / 180.0) * PI;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;

    const sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);

    const mgLat = lat + dLat;
    const mgLng = lng + dLng;

    return { lng: mgLng, lat: mgLat };
  }

  /**
   * GCJ02坐标系转WGS84坐标系
   * @param lng GCJ02经度
   * @param lat GCJ02纬度
   * @returns WGS84坐标
   */
  public gcj02ToWgs84(lng: number, lat: number): Coordinate {
    if (this.outOfChina(lng, lat)) {
      return { lng, lat };
    }

    let coord = this.wgs84ToGcj02(lng, lat);
    const lngDelta = coord.lng - lng;
    const latDelta = coord.lat - lat;

    return {
      lng: lng - lngDelta,
      lat: lat - latDelta
    };
  }

  /**
   * GCJ02坐标系转BD09坐标系
   * @param lng GCJ02经度
   * @param lat GCJ02纬度
   * @returns BD09坐标
   */
  public gcj02ToBd09(lng: number, lat: number): Coordinate {
    const x = lng;
    const y = lat;
    const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * Math.PI);
    const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * Math.PI);
    const bdLng = z * Math.cos(theta) + 0.0065;
    const bdLat = z * Math.sin(theta) + 0.006;
    return { lng: bdLng, lat: bdLat };
  }

  /**
   * BD09坐标系转GCJ02坐标系
   * @param lng BD09经度
   * @param lat BD09纬度
   * @returns GCJ02坐标
   */
  public bd09ToGcj02(lng: number, lat: number): Coordinate {
    const x = lng - 0.0065;
    const y = lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * Math.PI);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * Math.PI);
    const gcjLng = z * Math.cos(theta);
    const gcjLat = z * Math.sin(theta);
    return { lng: gcjLng, lat: gcjLat };
  }

  /**
   * WGS84坐标系转BD09坐标系
   * @param lng WGS84经度
   * @param lat WGS84纬度
   * @returns BD09坐标
   */
  public wgs84ToBd09(lng: number, lat: number): Coordinate {
    const gcj = this.wgs84ToGcj02(lng, lat);
    return this.gcj02ToBd09(gcj.lng, gcj.lat);
  }

  /**
   * BD09坐标系转WGS84坐标系
   * @param lng BD09经度
   * @param lat BD09纬度
   * @returns WGS84坐标
   */
  public bd09ToWgs84(lng: number, lat: number): Coordinate {
    const gcj = this.bd09ToGcj02(lng, lat);
    return this.gcj02ToWgs84(gcj.lng, gcj.lat);
  }

  /**
   * 检查坐标是否在中国范围内
   * @param lng 经度
   * @param lat 纬度
   * @returns 是否在中国范围内
   */
  private outOfChina(lng: number, lat: number): boolean {
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
  private transformLng(x: number, y: number): number {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
  }

  /**
   * 纬度转换辅助函数
   */
  private transformLat(x: number, y: number): number {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }

  /**
   * 坐标转换
   * @param coordinate 源坐标 [经度, 纬度]
   * @param from 源坐标系统（可选，默认使用当前源坐标系）
   * @param to 目标坐标系统（可选，默认使用当前目标坐标系）
   * @returns 转换后的坐标 [经度, 纬度]
   */
  public transform(coordinate: number[] | Coordinate, from?: CoordSystem, to?: CoordSystem): number[] {
    // 处理不同的输入格式
    let lng: number, lat: number;
    if (Array.isArray(coordinate)) {
      [lng, lat] = coordinate;
    } else {
      lng = coordinate.lng;
      lat = coordinate.lat;
    }
    
    // 使用指定的坐标系或默认值
    const sourceSystem = from || this.sourceSystem;
    const targetSystem = to || this.targetSystem;
    
    // 如果源坐标系和目标坐标系相同，直接返回
    if (sourceSystem === targetSystem || 
       (sourceSystem === CoordSystem.WGS84 && targetSystem === CoordSystem.EPSG4326) ||
       (sourceSystem === CoordSystem.EPSG4326 && targetSystem === CoordSystem.WGS84)) {
      return [lng, lat];
    }
    
    // 先统一转为WGS84
    let wgs84Coord: Coordinate = { lng, lat };
    
    if (sourceSystem === CoordSystem.GCJ02) {
      wgs84Coord = this.gcj02ToWgs84(lng, lat);
    } else if (sourceSystem === CoordSystem.BD09) {
      wgs84Coord = this.bd09ToWgs84(lng, lat);
    } else if (sourceSystem !== CoordSystem.WGS84 && sourceSystem !== CoordSystem.EPSG4326) {
      logger.warn(`不支持的源坐标系: ${sourceSystem}，将按WGS84处理`);
    }
    
    // 再从WGS84转为目标坐标系
    let result: Coordinate = wgs84Coord;
    
    if (targetSystem === CoordSystem.GCJ02) {
      result = this.wgs84ToGcj02(wgs84Coord.lng, wgs84Coord.lat);
    } else if (targetSystem === CoordSystem.BD09) {
      result = this.wgs84ToBd09(wgs84Coord.lng, wgs84Coord.lat);
    } else if (targetSystem !== CoordSystem.WGS84 && targetSystem !== CoordSystem.EPSG4326) {
      logger.warn(`不支持的目标坐标系: ${targetSystem}，将按WGS84处理`);
    }
    
    logger.debug(`坐标转换: [${lng}, ${lat}] 从 ${sourceSystem} 到 ${targetSystem} => [${result.lng}, ${result.lat}]`);
    return [result.lng, result.lat];
  }

  /**
   * 设置坐标系统
   * @param source 源坐标系统
   * @param target 目标坐标系统
   */
  public setCoordSystems(source: CoordSystem, target: CoordSystem): void {
    this.sourceSystem = source;
    this.targetSystem = target;
    logger.debug(`已更新坐标系统，源: ${source}，目标: ${target}`);
  }
} 