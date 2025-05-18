/**
 * 网格管理器
 * @description 管理地图网格，包括六边形网格和GeoHash网格
 */
import L from 'leaflet';
import { HexagonGridObject } from './HexagonGridObject';
import { GeoHashGridObject } from './GeoHashGridObject';
import logger from './LogObject';

// 网格类型枚举
export enum GridType {
  HEXAGON = 'hexagon',   // 六边形网格
  GEOHASH = 'geohash'    // GeoHash网格
}

// 网格配置接口
export interface GridConfig {
  // 六边形网格配置
  hexagon?: {
    size?: number;         // 网格大小（米）
    color?: string;        // 边框颜色
    weight?: number;       // 边框宽度
    opacity?: number;      // 不透明度
    fillColor?: string;    // 填充颜色
    fillOpacity?: number;  // 填充不透明度
  };
  // GeoHash网格配置
  geohash?: {
    precision?: number;    // 精度级别（1-9）
    color?: string;        // 边框颜色
    weight?: number;       // 边框宽度
    opacity?: number;      // 不透明度
    fillColor?: string;    // 填充颜色
    fillOpacity?: number;  // 填充不透明度
    showLabel?: boolean;   // 是否显示标签
  };
}

export class GridManager {
  private mapInstance: L.Map;
  private hexagonGrid: HexagonGridObject | null = null;
  private geohashGrid: GeoHashGridObject | null = null;
  // 添加可见性跟踪
  private hexagonVisible: boolean = false;
  private geohashVisible: boolean = false;
  private config: GridConfig = {
    hexagon: {
      size: 1000,           // 默认1000米
      color: '#3388ff',
      weight: 1,
      opacity: 0.8,
      fillColor: '#3388ff',
      fillOpacity: 0.1
    },
    geohash: {
      precision: 6,         // 默认6级精度
      color: '#ff3388',
      weight: 1,
      opacity: 0.8,
      fillColor: '#ff3388',
      fillOpacity: 0.1,
      showLabel: true
    }
  };

  // 事件回调
  private gridEnabledCallback: ((gridType: GridType) => void) | null = null;
  private gridDisabledCallback: ((gridType: GridType) => void) | null = null;

  /**
   * 构造函数
   * @param mapInstance Leaflet地图实例
   * @param config 网格配置
   */
  constructor(mapInstance: L.Map, config?: GridConfig) {
    this.mapInstance = mapInstance;
    
    // 合并配置
    if (config) {
      this.config = {
        hexagon: {
          ...this.config.hexagon,
          ...config.hexagon
        },
        geohash: {
          ...this.config.geohash,
          ...config.geohash
        }
      };
    }
    
    // 创建网格对象
    this.hexagonGrid = new HexagonGridObject(mapInstance, this.config.hexagon);
    this.geohashGrid = new GeoHashGridObject(mapInstance, this.config.geohash);
    
    logger.debug('GridManager已初始化');
  }

  /**
   * 设置网格配置
   * @param config 网格配置
   */
  public setConfig(config: GridConfig): void {
    // 更新配置
    if (config.hexagon && this.hexagonGrid) {
      this.config.hexagon = {
        ...this.config.hexagon,
        ...config.hexagon
      };
      this.hexagonGrid.setConfig(this.config.hexagon);
    }
    
    if (config.geohash && this.geohashGrid) {
      this.config.geohash = {
        ...this.config.geohash,
        ...config.geohash
      };
      this.geohashGrid.setConfig(this.config.geohash);
    }
    
    logger.debug('网格配置已更新', config);
  }

  /**
   * 启用网格
   * @param gridType 网格类型
   * @returns 是否启用成功
   */
  public enableGrid(gridType: GridType): boolean {
    if (gridType === GridType.HEXAGON && this.hexagonGrid) {
      const result = this.hexagonGrid.show();
      if (result && this.gridEnabledCallback) {
        this.gridEnabledCallback(gridType);
      }
      // 设置可见性状态
      this.hexagonVisible = result;
      return result;
    } else if (gridType === GridType.GEOHASH && this.geohashGrid) {
      const result = this.geohashGrid.show();
      if (result && this.gridEnabledCallback) {
        this.gridEnabledCallback(gridType);
      }
      // 设置可见性状态
      this.geohashVisible = result;
      return result;
    }
    
    return false;
  }

  /**
   * 启用网格 (为了与 ToolbarObject 兼容)
   * @param gridType 网格类型
   */
  public enable(gridType: GridType): void {
    this.enableGrid(gridType);
  }

  /**
   * 禁用网格
   * @param gridType 网格类型
   * @returns 是否禁用成功
   */
  public disableGrid(gridType: GridType): boolean {
    if (gridType === GridType.HEXAGON && this.hexagonGrid) {
      const result = this.hexagonGrid.hide();
      if (result && this.gridDisabledCallback) {
        this.gridDisabledCallback(gridType);
      }
      // 设置可见性状态
      this.hexagonVisible = false;
      return result;
    } else if (gridType === GridType.GEOHASH && this.geohashGrid) {
      const result = this.geohashGrid.hide();
      if (result && this.gridDisabledCallback) {
        this.gridDisabledCallback(gridType);
      }
      // 设置可见性状态
      this.geohashVisible = false;
      return result;
    }
    
    return false;
  }

  /**
   * 禁用网格 (为了与 ToolbarObject 兼容)
   * @param gridType 网格类型
   */
  public disable(gridType: GridType): void {
    this.disableGrid(gridType);
  }

  /**
   * 设置网格启用回调
   * @param callback 回调函数
   */
  public setGridEnabledCallback(callback: (gridType: GridType) => void): void {
    this.gridEnabledCallback = callback;
  }

  /**
   * 设置网格禁用回调
   * @param callback 回调函数
   */
  public setGridDisabledCallback(callback: (gridType: GridType) => void): void {
    this.gridDisabledCallback = callback;
  }

  /**
   * 获取网格配置
   * @returns 网格配置
   */
  public getConfig(): GridConfig {
    return this.config;
  }

  /**
   * 获取当前激活的网格类型集合
   * @returns 激活的网格类型集合
   */
  public getActiveGridTypes(): Set<GridType> {
    const activeTypes = new Set<GridType>();
    
    // 使用内部状态变量来检查可见性
    if (this.hexagonVisible) {
      activeTypes.add(GridType.HEXAGON);
    }
    
    if (this.geohashVisible) {
      activeTypes.add(GridType.GEOHASH);
    }
    
    return activeTypes;
  }

  /**
   * 销毁对象，清理资源
   */
  public destroy(): void {
    if (this.hexagonGrid) {
      this.hexagonGrid.destroy();
      this.hexagonGrid = null;
    }
    
    if (this.geohashGrid) {
      this.geohashGrid.destroy();
      this.geohashGrid = null;
    }
    
    this.gridEnabledCallback = null;
    this.gridDisabledCallback = null;
    
    logger.debug('GridManager已销毁');
  }
} 