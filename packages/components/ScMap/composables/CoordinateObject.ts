/**
 * 坐标对象
 * @description 处理地图坐标相关功能
 */
import L from 'leaflet';
import logger from './LogObject';

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
  longitude: number;          // 经度
  latitude: number;           // 纬度
  projectedX: number;         // 投影X坐标
  projectedY: number;         // 投影Y坐标
  projection: string;         // 投影类型
  decimals: number;           // 小数位数
  position: CoordinatePosition; // 面板位置
}

export class CoordinateObject {
  private mapInstance: L.Map;
  private options: CoordinateOptions;
  private currentInfo: CoordinateInfo;

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

    // 初始化坐标信息
    this.currentInfo = {
      longitude: 0,
      latitude: 0,
      projectedX: 0,
      projectedY: 0,
      projection: 'EPSG:3857', // Leaflet默认使用的投影
      decimals: this.options.decimals,
      position: this.options.position
    };

    // 绑定地图鼠标移动事件
    this.mapInstance.on('mousemove', this.handleMouseMove.bind(this));
    
    logger.debug('CoordinateObject已初始化');
  }

  /**
   * 处理鼠标移动事件
   * @param event 鼠标事件
   */
  private handleMouseMove(event: L.LeafletMouseEvent): void {
    const latlng = event.latlng;
    const point = this.mapInstance.project(latlng, this.mapInstance.getMaxZoom());
    
    // 更新坐标信息
    this.currentInfo = {
      ...this.currentInfo,
      longitude: latlng.lng,
      latitude: latlng.lat,
      projectedX: point.x,
      projectedY: point.y
    };
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
    this.currentInfo.decimals = this.options.decimals || this.currentInfo.decimals;
    this.currentInfo.position = this.options.position || this.currentInfo.position;
    
    logger.debug('CoordinateObject选项已更新', this.options);
  }

  /**
   * 销毁对象，清理资源
   */
  public destroy(): void {
    // 解绑事件
    this.mapInstance.off('mousemove', this.handleMouseMove);
    
    logger.debug('CoordinateObject已销毁');
  }
} 