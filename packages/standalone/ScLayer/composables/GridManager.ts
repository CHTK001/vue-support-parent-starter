/**
 * 网格管理器
 * @description 管理GeoHash和蜂窝网格对象
 */
import { Map as OlMap } from 'ol';
import logger from './LogObject';
import { GeoHashGridObject, GeoHashGridConfig } from './GeoHashGridObject';
import { HexagonGridObject, HexagonGridConfig } from './HexagonGridObject';

// 网格类型枚举
export enum GridType {
  GEOHASH = 'geohash',
  HEXAGON = 'hexagon'
}

// 网格配置接口
export interface GridConfig {
  geohash: GeoHashGridConfig;
  hexagon: HexagonGridConfig;
}

// 默认网格配置
const DEFAULT_GRID_CONFIG: GridConfig = {
  geohash: {
    precision: 6,
    strokeColor: 'rgba(0, 60, 136, 0.8)',
    strokeWidth: 1,
    fillColor: 'rgba(0, 60, 136, 0.2)',
    showLabels: true,
    labelColor: '#003c88',
    buffer: 4,
    cacheSize: 1000,
    targetSize: 100,
    zIndex: 100,
    opacity: 1
  },
  hexagon: {
    radius: 1000,  // 1公里半径
    strokeColor: 'rgba(255, 99, 71, 0.8)',
    strokeWidth: 1,
    fillColor: 'rgba(255, 99, 71, 0.2)',
    showLabels: true,
    labelColor: '#ff6347',
    zIndex: 101,
    opacity: 1
  }
};

// 网格模块的日志前缀
const LOG_MODULE = 'GridManager';

/**
 * 网格管理器类
 */
export class GridManager {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 网格配置
  private config: GridConfig = DEFAULT_GRID_CONFIG;
  // GeoHash网格对象
  private geoHashGrid: GeoHashGridObject | null = null;
  // 蜂窝网格对象
  private hexagonGrid: HexagonGridObject | null = null;
  // 当前活动的网格类型
  private activeGridTypes: Set<GridType> = new Set();
  
  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 网格配置（可选）
   */
  constructor(mapInstance: OlMap | null = null, config?: Partial<GridConfig>) {
    if (mapInstance) {
      this.log('info', '构造函数中设置地图实例...');
      this.setMapInstance(mapInstance);
    } else {
      this.log('warn', '构造函数中未提供地图实例！');
    }
    
    if (config) {
      this.setConfig(config);
    }
    
    this.log('debug', '网格管理器已创建');
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    this.log('info', '设置地图实例...');
    
    // 检查地图实例是否有效
    if (!mapInstance) {
      this.log('error', '提供的地图实例无效！');
      return;
    }
    
    this.mapInstance = mapInstance;
    
    // 初始化网格对象
    this.initGridObjects();
    
    this.log('debug', '地图实例已设置');
  }

  /**
   * 设置网格配置
   * @param config 网格配置
   */
  public setConfig(config: Partial<GridConfig>): void {
    this.config = {
      geohash: {
        ...DEFAULT_GRID_CONFIG.geohash,
        ...(config.geohash || {})
      },
      hexagon: {
        ...DEFAULT_GRID_CONFIG.hexagon,
        ...(config.hexagon || {})
      }
    };
    
    // 更新网格对象配置
    if (this.geoHashGrid) {
      this.geoHashGrid.setConfig(this.config.geohash);
    }
    
    if (this.hexagonGrid) {
      this.hexagonGrid.setConfig(this.config.hexagon);
    }
    
    this.log('debug', '网格配置已更新');
  }

  /**
   * 初始化网格对象
   * @private
   */
  private initGridObjects(): void {
    if (!this.mapInstance) {
      this.log('error', '无法初始化网格对象：地图实例不可用');
      return;
    }
    
    // 创建GeoHash网格对象
    this.geoHashGrid = new GeoHashGridObject(this.mapInstance, this.config.geohash);
    
    // 创建蜂窝网格对象
    this.hexagonGrid = new HexagonGridObject(this.mapInstance, this.config.hexagon);
    
    this.log('info', '网格对象已初始化');
  }

  /**
   * 启用指定类型的网格
   * @param gridType 网格类型
   */
  public enable(gridType: GridType): void {
    if (this.activeGridTypes.has(gridType)) {
      this.log('debug', `${gridType}网格已经启用`);
      return;
    }
    
    switch (gridType) {
      case GridType.GEOHASH:
        if (this.geoHashGrid) {
          this.geoHashGrid.enable();
        }
        break;
      case GridType.HEXAGON:
        if (this.hexagonGrid) {
          this.hexagonGrid.enable();
        }
        break;
    }
    
    // 添加到活动集合
    this.activeGridTypes.add(gridType);
    
    this.log('info', `已启用${gridType}网格`);
  }

  /**
   * 禁用指定类型的网格
   * @param gridType 网格类型
   */
  public disable(gridType: GridType): void {
    if (!this.activeGridTypes.has(gridType)) {
      this.log('debug', `${gridType}网格已经禁用`);
      return;
    }
    
    switch (gridType) {
      case GridType.GEOHASH:
        if (this.geoHashGrid) {
          this.geoHashGrid.disable();
        }
        break;
      case GridType.HEXAGON:
        if (this.hexagonGrid) {
          this.hexagonGrid.disable();
        }
        break;
    }
    
    // 从活动集合中移除
    this.activeGridTypes.delete(gridType);
    
    this.log('info', `已禁用${gridType}网格`);
  }

  /**
   * 刷新所有活动的网格
   */
  public refresh(): void {
    this.log('info', '开始刷新网格...');
    
    if (this.activeGridTypes.has(GridType.GEOHASH) && this.geoHashGrid) {
      this.geoHashGrid.refresh();
    }
    
    if (this.activeGridTypes.has(GridType.HEXAGON) && this.hexagonGrid) {
      this.hexagonGrid.refresh();
    }
    
    this.log('info', '网格刷新完成');
  }

  /**
   * 检查指定类型的网格是否启用
   * @param gridType 网格类型
   * @returns 是否启用
   */
  public isEnabled(gridType: GridType): boolean {
    return this.activeGridTypes.has(gridType);
  }

  /**
   * 启用网格（别名方法，与 ScMap 版本兼容）
   * @param gridType 网格类型
   * @returns 是否启用成功
   */
  public enableGrid(gridType: GridType): boolean {
    this.enable(gridType);
    return this.isEnabled(gridType);
  }

  /**
   * 禁用网格（别名方法，与 ScMap 版本兼容）
   * @param gridType 网格类型
   * @returns 是否禁用成功
   */
  public disableGrid(gridType: GridType): boolean {
    this.disable(gridType);
    return !this.isEnabled(gridType);
  }

  /**
   * 检查指定类型的网格是否可见（别名方法，与 ScMap 版本兼容）
   * @param gridType 网格类型
   * @returns 是否可见
   */
  public isVisible(gridType: GridType): boolean {
    return this.isEnabled(gridType);
  }

  /**
   * 获取当前活动的网格类型集合
   * @returns 活动的网格类型集合
   */
  public getActiveGridTypes(): Set<GridType> {
    return new Set(this.activeGridTypes);
  }

  /**
   * 获取网格配置
   * @returns 网格配置
   */
  public getConfig(): GridConfig {
    return this.config;
  }

  /**
   * 设置GeoHash网格精度
   * @param precision 精度值
   */
  public setGeoHashPrecision(precision: number): void {
    if (this.geoHashGrid) {
      this.geoHashGrid.setPrecision(precision);
      this.config.geohash.precision = precision;
    }
  }

  /**
   * 设置蜂窝网格半径
   * @param radius 半径值（米）
   */
  public setHexagonRadius(radius: number): void {
    if (this.hexagonGrid) {
      this.hexagonGrid.setRadius(radius);
      this.config.hexagon.radius = radius;
    }
  }

  /**
   * 设置网格透明度
   * @param gridType 网格类型
   * @param opacity 透明度值
   */
  public setOpacity(gridType: GridType, opacity: number): void {
    switch (gridType) {
      case GridType.GEOHASH:
        if (this.geoHashGrid) {
          this.geoHashGrid.setOpacity(opacity);
          this.config.geohash.opacity = opacity;
        }
        break;
      case GridType.HEXAGON:
        if (this.hexagonGrid) {
          this.hexagonGrid.setOpacity(opacity);
          this.config.hexagon.opacity = opacity;
        }
        break;
    }
  }

  /**
   * 设置GeoHash网格范围
   * @param extent 范围 [minX, minY, maxX, maxY]
   */
  public setGeoHashExtent(extent: [number, number, number, number] | null): void {
    if (this.geoHashGrid) {
      this.geoHashGrid.setExtent(extent);
      if (extent) {
        this.config.geohash.extent = extent;
      } else {
        delete this.config.geohash.extent;
      }
    }
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    this.log('info', '销毁网格管理器...');
    
    // 销毁网格对象
    if (this.geoHashGrid) {
      this.geoHashGrid.destroy();
      this.geoHashGrid = null;
    }
    
    if (this.hexagonGrid) {
      this.hexagonGrid.destroy();
      this.hexagonGrid = null;
    }
    
    // 清除引用
    this.mapInstance = null;
    this.activeGridTypes.clear();
    
    this.log('info', '网格管理器已销毁');
  }

  /**
   * 日志记录
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (data) {
      logger[level](`[${LOG_MODULE}] ${message}`, data);
    } else {
      logger[level](`[${LOG_MODULE}] ${message}`);
    }
  }
} 