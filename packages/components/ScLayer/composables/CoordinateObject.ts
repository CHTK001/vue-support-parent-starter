/**
 * 坐标跟踪对象
 * @description 用于跟踪鼠标在地图上的坐标位置
 */
import { Map } from 'ol';
import { toLonLat, transform } from 'ol/proj';
import logger from './LogObject';

/**
 * 坐标位置类型
 */
export type CoordinatePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * 坐标信息接口
 */
export interface CoordinateInfo {
  // 经度 (WGS84坐标)
  longitude: number;
  // 纬度 (WGS84坐标)
  latitude: number;
  // 投影X坐标 (原始投影坐标)
  projectedX: number;
  // 投影Y坐标 (原始投影坐标)
  projectedY: number;
  // 投影坐标系
  projection: string;
  // 小数位数
  decimals?: number;
  // 面板显示位置
  position?: CoordinatePosition;
}

/**
 * 坐标跟踪对象配置接口
 */
export interface CoordinateOptions {
  // 小数位数
  decimals?: number;
  // 面板显示位置
  position?: CoordinatePosition;
  // 是否显示投影坐标
  showProjected?: boolean;
}

/**
 * 坐标跟踪对象类
 */
export class CoordinateObject {
  // 地图实例
  private mapInstance: Map | null = null;
  // 当前坐标信息
  private coordinate: CoordinateInfo = {
    longitude: 0,
    latitude: 0,
    projectedX: 0,
    projectedY: 0,
    projection: 'EPSG:3857',
    decimals: 6,
    position: 'bottom-right'
  };
  // 回调函数
  private callback: ((coordinate: CoordinateInfo) => void) | null = null;
  // 是否启用
  private enabled: boolean = false;
  // 配置项
  private options: CoordinateOptions = {
    decimals: 6,
    position: 'bottom-right',
    showProjected: true
  };

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param options 配置选项
   */
  constructor(mapInstance: Map | null = null, options?: CoordinateOptions) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    if (options) {
      this.setOptions(options);
    }
  }


  /**
   * 设置配置选项
   * @param options 配置选项
   */
  public setOptions(options: CoordinateOptions): void {
    this.options = { ...this.options, ...options };
    this.coordinate.decimals = this.options.decimals;
    this.coordinate.position = this.options.position;
    
    logger.debug('坐标跟踪对象配置已更新:', this.options);
  }

  /**
   * 获取配置选项
   * @returns 配置选项
   */
  public getOptions(): CoordinateOptions {
    return { ...this.options };
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: Map): void {
    this.mapInstance = mapInstance;
    this.coordinate.projection = this.mapInstance.getView().getProjection().getCode();
    logger.debug('坐标跟踪对象已初始化，投影:', this.coordinate.projection);
  }

  /**
   * 启用坐标跟踪
   * @param callback 坐标变化回调函数
   */
  public enable(callback?: (coordinate: CoordinateInfo) => void): void {
    if (!this.mapInstance) {
      logger.warn('地图实例未设置，无法启用坐标跟踪');
      return;
    }
    
    // 设置回调函数
    if (callback) {
      this.callback = callback;
    }
    
    // 如果已启用，先禁用
    if (this.enabled) {
      this.disable();
    }
    // 设置启用状态
    this.enabled = true;
    logger.info('坐标跟踪已启用');
  }

  /**
   * 禁用坐标跟踪
   */
  public disable(): void {
    if (!this.mapInstance || !this.enabled) {
      return;
    }
    this.enabled = false;
    logger.debug('坐标跟踪已禁用');
  }

  /**
   * 获取当前坐标信息
   * @returns 坐标信息
   */
  public getCoordinate(): CoordinateInfo {
    return { ...this.coordinate };
  }

  /**
   * 是否已启用
   * @returns 是否已启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置小数位数
   * @param decimals 小数位数
   */
  public setDecimals(decimals: number): void {
    this.options.decimals = decimals;
    this.coordinate.decimals = decimals;
  }

  /**
   * 设置面板位置
   * @param position 面板位置
   */
  public setPosition(position: CoordinatePosition): void {
    this.options.position = position;
    this.coordinate.position = position;
  }

  /**
   * 设置是否显示投影坐标
   * @param show 是否显示
   */
  public setShowProjected(show: boolean): void {
    this.options.showProjected = show;
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    this.disable();
    this.mapInstance = null;
    this.callback = null;
  }
}

/**
 * 创建坐标跟踪对象
 * @param mapInstance 地图实例
 * @param options 配置选项
 * @returns 坐标跟踪对象
 */
export function createCoordinateObject(mapInstance?: Map, options?: CoordinateOptions): CoordinateObject {
  return new CoordinateObject(mapInstance || null, options);
}

export default CoordinateObject; 