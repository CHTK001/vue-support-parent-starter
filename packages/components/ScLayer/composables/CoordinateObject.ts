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
  // 指针移动事件绑定
  private pointerMoveListener: any = null;
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
    
    // 如果之前是启用状态，需要先解绑再重新绑定
    if (this.enabled) {
      this.disable();
      this.enable();
    }
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
    
    if (callback) {
      this.callback = callback;
    }
    
    if (this.enabled) {
      logger.debug('坐标跟踪已经启用，无需重复启用');
      return;
    }
    
    // 绑定鼠标移动事件
    this.pointerMoveListener = this.handlePointerMove.bind(this);
    this.mapInstance.on('pointermove', this.pointerMoveListener);
    
    this.enabled = true;
    logger.debug('坐标跟踪已启用');
  }

  /**
   * 禁用坐标跟踪
   */
  public disable(): void {
    if (!this.mapInstance || !this.enabled) {
      return;
    }
    
    // 解绑鼠标移动事件
    if (this.pointerMoveListener) {
      this.mapInstance.un('pointermove', this.pointerMoveListener);
      this.pointerMoveListener = null;
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
   * 处理鼠标移动事件
   * @param event 鼠标移动事件
   */
  private handlePointerMove(event: any): void {
    if (!this.mapInstance || !this.enabled) return;
    
    // 获取鼠标位置的地图坐标
    const pixel = event.pixel;
    const coord = this.mapInstance.getCoordinateFromPixel(pixel);
    
    if (!coord || coord.length < 2) return;
    
    // 获取当前地图投影
    const mapProjection = this.mapInstance.getView().getProjection().getCode();
    
    // 保存原始投影坐标
    this.coordinate.projectedX = coord[0];
    this.coordinate.projectedY = coord[1];
    this.coordinate.projection = mapProjection;
    
    // 转换为WGS84坐标 (经纬度)
    const wgs84Coord = toLonLat(coord, mapProjection);
    this.coordinate.longitude = wgs84Coord[0];
    this.coordinate.latitude = wgs84Coord[1];
    
    // 触发回调
    if (this.callback) {
      this.callback(this.getCoordinate());
    }
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