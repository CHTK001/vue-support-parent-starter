/**
 * 坐标对象
 * @description 管理地图上的坐标显示
 */
import { Map as OlMap } from 'ol';
import { toLonLat } from 'ol/proj';
import { toStringXY } from 'ol/coordinate';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import logger from './LogObject';

/**
 * 坐标面板位置
 */
export type CoordinatePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * 坐标信息接口
 */
export interface CoordinateInfo {
  // 经度
  longitude: number;
  // 纬度
  latitude: number;
  // 投影坐标X
  projectedX: number;
  // 投影坐标Y
  projectedY: number;
  // 投影系统
  projection: string;
  // 小数位数
  decimals?: number;
  // 坐标面板位置
  position?: CoordinatePosition;
}

/**
 * 坐标选项接口
 */
export interface CoordinateOptions {
  // 小数位数
  decimals?: number;
  // 坐标面板位置
  position?: CoordinatePosition;
  // 是否显示投影坐标
  showProjected?: boolean;
}

/**
 * 坐标回调函数类型
 */
export type CoordinateCallback = (info: CoordinateInfo) => void;

/**
 * 坐标对象类
 */
export class CoordinateObject {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 坐标选项
  private options: CoordinateOptions = {
    decimals: 6,
    position: 'bottom-right',
    showProjected: true
  };
  // 指针移动监听器
  private pointerMoveListener: EventsKey | null = null;
  // 坐标回调函数
  private callback: CoordinateCallback | null = null;
  // 是否已启用
  private enabled: boolean = false;

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param options 坐标选项
   */
  constructor(mapInstance: OlMap, options?: CoordinateOptions) {
    this.mapInstance = mapInstance;
    
    if (options) {
      this.setOptions(options);
    }
    
    logger.debug('坐标对象已创建');
  }

  /**
   * 设置坐标选项
   * @param options 坐标选项
   */
  setOptions(options: CoordinateOptions): void {
    this.options = { ...this.options, ...options };
    logger.debug('坐标选项已更新', this.options);
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  setMapInstance(mapInstance: OlMap): void {
    // 如果已经绑定了事件监听器，先解绑
    if (this.pointerMoveListener && this.mapInstance) {
      unByKey(this.pointerMoveListener);
      this.pointerMoveListener = null;
    }
    
    this.mapInstance = mapInstance;
    
    // 如果已启用，需要重新绑定事件
    if (this.enabled && this.callback) {
      this.enable(this.callback);
    }
    
    logger.debug('坐标对象地图实例已更新');
  }

  /**
   * 启用坐标跟踪
   * @param callback 坐标回调函数
   */
  enable(callback: CoordinateCallback): void {
    if (!this.mapInstance) {
      logger.warn('地图实例未设置，无法启用坐标跟踪');
      return;
    }
    
    // 保存回调函数
    this.callback = callback;
    
    // 如果已经绑定了事件监听器，先解绑
    if (this.pointerMoveListener) {
      unByKey(this.pointerMoveListener);
      this.pointerMoveListener = null;
    }
    
    // 绑定指针移动事件
    this.pointerMoveListener = this.mapInstance.on('pointermove', (event) => {
      const pixel = this.mapInstance!.getEventPixel(event.originalEvent);
      const coordinate = this.mapInstance!.getCoordinateFromPixel(pixel);
      
      if (coordinate && this.callback) {
        // 获取当前投影
        const projection = this.mapInstance!.getView().getProjection();
        const projectionCode = projection.getCode();
        
        // 转换为经纬度
        const lonLat = toLonLat(coordinate, projection);
        
        // 创建坐标信息对象
        const info: CoordinateInfo = {
          longitude: lonLat[0],
          latitude: lonLat[1],
          projectedX: coordinate[0],
          projectedY: coordinate[1],
          projection: projectionCode,
          decimals: this.options.decimals,
          position: this.options.position
        };
        
        // 调用回调函数
        this.callback(info);
      }
    });
    
    this.enabled = true;
    logger.debug('坐标跟踪已启用');
  }

  /**
   * 禁用坐标跟踪
   */
  disable(): void {
    if (this.pointerMoveListener) {
      unByKey(this.pointerMoveListener);
      this.pointerMoveListener = null;
    }
    
    this.enabled = false;
    logger.debug('坐标跟踪已禁用');
  }

  /**
   * 获取当前是否启用
   * @returns 是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 获取当前坐标选项
   * @returns 坐标选项
   */
  getOptions(): CoordinateOptions {
    return { ...this.options };
  }

  /**
   * 销毁对象
   */
  destroy(): void {
    this.disable();
    this.mapInstance = null;
    this.callback = null;
    logger.debug('坐标对象已销毁');
  }

  /**
   * 通用：任意坐标系转为当前地图投影坐标
   * @param lonLat 输入经纬度 [lng, lat]
   * @param from 输入坐标系（如 'WGS84'、'GCJ02'、'EPSG:4326'、'EPSG:3857'）
   * @returns 当前地图投影坐标 [x, y]
   */
  public toMapCoord(lonLat: [number, number], from: string = 'EPSG:4326'): [number, number] {
    if (!this.mapInstance) return [0, 0];
    const projection = this.mapInstance.getView().getProjection();
    const to = projection.getCode();
    // 统一用ol/proj.transform
    // 兼容常用别名
    let fromCode = from;
    if (from === 'WGS84') fromCode = 'EPSG:4326';
    if (from === 'GCJ02') fromCode = 'GCJ02';
    if (from === 'BD09') fromCode = 'BD09';
    return (window as any).ol.proj.transform(lonLat, fromCode, to);
  }

  /**
   * 通用：当前地图投影坐标转为目标坐标系经纬度
   * @param coord 当前地图投影坐标 [x, y]
   * @param to 目标坐标系（如 'WGS84'、'GCJ02'、'EPSG:4326'、'EPSG:3857'）
   * @returns 目标坐标系经纬度 [lng, lat]
   */
  public fromMapCoord(coord: [number, number], to: string = 'EPSG:4326'): [number, number] {
    if (!this.mapInstance) return [0, 0];
    const projection = this.mapInstance.getView().getProjection();
    const from = projection.getCode();
    // 兼容常用别名
    let toCode = to;
    if (to === 'WGS84') toCode = 'EPSG:4326';
    if (to === 'GCJ02') toCode = 'GCJ02';
    if (to === 'BD09') toCode = 'BD09';
    return (window as any).ol.proj.transform(coord, from, toCode);
  }
}

/**
 * 创建坐标对象
 * @param mapInstance 地图实例
 * @param options 坐标选项
 * @returns 坐标对象
 */
export function createCoordinateObject(mapInstance: OlMap, options?: CoordinateOptions): CoordinateObject {
  return new CoordinateObject(mapInstance, options);
}

// 添加默认导出
export default {
  CoordinateInfo,
  CoordinatePosition,
  CoordinateOptions,
  CoordinateCallback,
  CoordinateObject,
  createCoordinateObject
}; 