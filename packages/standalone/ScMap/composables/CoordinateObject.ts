/**
 * 坐标对象
 * @description 处理地图坐标相关功能
 */
import L from 'leaflet';
import logger from './LogObject';
import { CoordSystem, GcoordObject } from './GcoordObject';

// 坐标位置枚举
export type CoordinatePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 坐标选项接口
export interface CoordinateOptions {
  decimals?: number;          // 小数位数
  position?: CoordinatePosition; // 面板位置
  showProjected?: boolean;    // 是否显示投影坐标
}

// 坐标信息接口
export interface CoordinateInfo {
  lng?: number;                // 经度
  lat?: number;                // 纬度
  x?: number;                 // 投影X坐标
  y?: number;                 // 投影Y坐标
  projection?: string;        // 投影类型
  decimals?: number;          // 小数位数
  position?: CoordinatePosition; // 面板位置
  coordinate?: number[];      // 经纬度坐标数组形式
  projected?: number[];       // 投影坐标数组形式
  formatted?: {
    lat: string;
    lng: string;
    x?: string;
    y?: string;
  };
}

export class CoordinateObject {
  private mapInstance: L.Map;
  private options: CoordinateOptions;
  private currentInfo: CoordinateInfo;
  private enabled: boolean = false;
  private mouseMoveHandler: ((event: L.LeafletMouseEvent) => void) | null = null;
  private callback: ((info: CoordinateInfo) => void) | null = null;
  private gcoord: GcoordObject | null = null;

  /**
   * 构造函数
   * @param mapInstance Leaflet地图实例 
   * @param options 坐标选项
   */
  constructor(mapInstance: L.Map, options: CoordinateOptions = {}) {
    this.mapInstance = mapInstance;
    this.options = {
      decimals: options.decimals || 6,
      position: options.position || 'bottom-right',
      showProjected: options.showProjected !== undefined ? options.showProjected : true
    };

    // 初始化坐标转换对象
    // 检测当前地图使用的坐标系统
    let targetSystem: CoordSystem;
    if (this.mapInstance.options.crs === L.CRS.EPSG3857) {
      targetSystem = CoordSystem.EPSG3857;
    } else if (this.mapInstance.options.crs === L.CRS.EPSG4326) {
      targetSystem = CoordSystem.EPSG4326;
    } else {
      // 根据地图容器data属性检测地图类型
      const mapContainer = this.mapInstance.getContainer();
      const mapTypeAttr = mapContainer.getAttribute('data-map-type');
      
      if (mapTypeAttr === 'gaode') {
        targetSystem = CoordSystem.GCJ02;
      } else if (mapTypeAttr === 'baidu') {
        targetSystem = CoordSystem.BD09;
      } else {
        targetSystem = CoordSystem.WGS84;
      }
    }
    
    this.gcoord = new GcoordObject({
      sourceSystem: CoordSystem.WGS84,
      targetSystem: targetSystem
    });

    // 初始化坐标信息
    this.currentInfo = {
      lng: 0,
      lat: 0,
      x: 0,
      y: 0,
      projection: this.mapInstance.options.crs === L.CRS.EPSG3857 ? 'EPSG:3857' : 'GCJ02', // 根据地图CRS判断投影类型
      decimals: this.options.decimals,
      position: this.options.position,
      coordinate: [0, 0],
      projected: [0, 0],
      formatted: {
        lng: '0',
        lat: '0'
      }
    };

    // 创建鼠标移动处理函数
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    
    logger.debug('CoordinateObject已初始化');
  }

  /**
   * 处理鼠标移动事件
   * @param event 鼠标事件
   */
  private handleMouseMove(event: L.LeafletMouseEvent): void {
    const latlng = event.latlng;
    const point = this.mapInstance.project(latlng, this.mapInstance.getMaxZoom());
    const decimals = this.options.decimals || 6;
    
    // 更新坐标信息
    this.currentInfo = {
      ...this.currentInfo,
      lng: latlng.lng,
      lat: latlng.lat,
      x: point.x,
      y: point.y,
      coordinate: [latlng.lng, latlng.lat],
      projected: [point.x, point.y],
      formatted: {
        lng: latlng.lng.toFixed(decimals),
        lat: latlng.lat.toFixed(decimals),
        x: point.x.toFixed(0),
        y: point.y.toFixed(0)
      }
    };
    
    // 如果有回调函数，调用回调函数
    if (this.callback) {
      this.callback(this.currentInfo);
    }
  }

  /**
   * 设置经纬度坐标
   * @param coordinate 经纬度坐标 [经度, 纬度]
   */
  public setCoordinate(coordinate: number[]): void {
    if (!coordinate || coordinate.length < 2) {
      logger.warn('无效的坐标', coordinate);
      return;
    }
    
    const lng = coordinate[0];
    const lat = coordinate[1];
    const decimals = this.options.decimals || 6;
    
    // 使用GcoordObject转换坐标到地图使用的坐标系
    let transformedLngLat: [number, number] = [lng, lat];
    if (this.gcoord) {
      transformedLngLat = this.gcoord.transform([lng, lat], CoordSystem.WGS84) as [number, number];
    }
    
    // 更新坐标信息
    const point = this.mapInstance.latLngToContainerPoint(L.latLng(transformedLngLat[1], transformedLngLat[0]));

    this.currentInfo = {
      lng: transformedLngLat[0],
      lat: transformedLngLat[1],
      x: point.x,
      y: point.y,
      projection: this.currentInfo.projection,
      decimals: this.options.decimals,
      position: this.options.position,
      coordinate: transformedLngLat,
      projected: [point.x, point.y],
      formatted: this.formatCoordinate(transformedLngLat[0], transformedLngLat[1])
    };
    
    // 如果有回调函数，调用回调函数
    if (this.callback) {
      this.callback(this.currentInfo);
    }
    
    logger.debug(`已设置坐标: ${lng}, ${lat}`);
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: L.Map): void {
    // 如果当前处于启用状态，先停用
    const wasEnabled = this.enabled;
    if (wasEnabled) {
      this.disable();
    }
    
    // 更新地图实例
    this.mapInstance = mapInstance;
    
    // 如果之前处于启用状态，重新启用
    if (wasEnabled) {
      this.enable(this.callback);
    }
    
    logger.debug('CoordinateObject地图实例已更新');
  }
  
  /**
   * 启用坐标跟踪
   * @param callback 坐标信息回调函数
   */
  public enable(callback?: (coordinate: CoordinateInfo) => void): void {
    if (this.enabled) {
      logger.debug('CoordinateObject已经启用，无需再次启用');
      return;
    }
    
    // 保存回调函数
    this.callback = callback || null;
    
    // 绑定鼠标移动事件
    if (this.mouseMoveHandler) {
      this.mapInstance.on('mousemove', this.mouseMoveHandler);
    }
    
    this.enabled = true;
    logger.debug('CoordinateObject已启用');
  }
  
  /**
   * 停用坐标跟踪
   */
  public disable(): void {
    if (!this.enabled) {
      logger.debug('CoordinateObject已经停用，无需再次停用');
      return;
    }
    
    // 解绑鼠标移动事件
    if (this.mouseMoveHandler) {
      this.mapInstance.off('mousemove', this.mouseMoveHandler);
    }
    
    this.enabled = false;
    logger.debug('CoordinateObject已停用');
  }
  
  /**
   * 检查是否启用
   * @returns 是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 获取当前坐标信息
   * @returns 坐标信息对象
   */
  public getCoordinateInfo(): CoordinateInfo {
    return { ...this.currentInfo };
  }

  /**
   * 设置坐标选项
   * @param options 坐标选项
   */
  public setOptions(options: Partial<CoordinateOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    // 更新当前信息中的相关字段
    this.currentInfo.decimals = this.options.decimals;
    this.currentInfo.position = this.options.position;
    
    logger.debug('CoordinateObject选项已更新', this.options);
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    // 停用坐标跟踪
    this.disable();
    
    // 解除回调引用
    this.callback = null;
    
    logger.debug('CoordinateObject已销毁');
  }

  /**
   * 从经纬度获取像素坐标
   * @param lnglat 经纬度数组 [lng, lat]
   * @returns 像素坐标点 [x, y]
   */
  public lnglatToPoint(lnglat: [number, number]): [number, number] {
    // 使用GcoordObject转换坐标到地图使用的坐标系
    let transformedLngLat: [number, number] = lnglat;
    if (this.gcoord) {
      transformedLngLat = this.gcoord.transform(lnglat, CoordSystem.WGS84) as [number, number];
    }
    
    const point = this.mapInstance.latLngToContainerPoint(L.latLng(transformedLngLat[1], transformedLngLat[0]));
    return [point.x, point.y];
  }

  /**
   * 从像素坐标获取经纬度
   * @param point 像素坐标点 [x, y]
   * @returns 经纬度数组 [lng, lat]
   */
  public pointToLnglat(point: [number, number]): [number, number] {
    const latlng = this.mapInstance.containerPointToLatLng(L.point(point[0], point[1]));
    
    // 使用GcoordObject反向转换坐标从地图坐标系到WGS84
    let result: [number, number] = [latlng.lng, latlng.lat];
    if (this.gcoord) {
      result = this.gcoord.transform([latlng.lng, latlng.lat], this.gcoord.getTargetSystem(), CoordSystem.WGS84) as [number, number];
    }
    
    return result;
  }

  private formatCoordinate(lng: number, lat: number): { lng: string; lat: string; x?: string; y?: string } {
    const decimals = this.options.decimals || 6;
    return {
      lng: lng.toFixed(decimals),
      lat: lat.toFixed(decimals),
      x: this.currentInfo.x?.toFixed(0),
      y: this.currentInfo.y?.toFixed(0)
    };
  }
} 