/**
 * 鹰眼地图对象
 * @description 管理地图鹰眼控件
 */
import L from 'leaflet';
import 'leaflet-minimap';
import { MapType } from '../types/map';
import { MapTile } from '../types';
import logger from './LogObject';

// 鹰眼模块的日志前缀
const LOG_MODULE = 'Overview';

/**
 * 鹰眼配置选项
 */
export interface OverviewMapOptions {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  width?: number;
  height?: number;
  collapsedWidth?: number;
  collapsedHeight?: number;
  zoomLevelOffset?: number;
  zoomLevelFixed?: number | null;
  centerFixed?: L.LatLng | null;
  zoomAnimation?: boolean;
  toggleDisplay?: boolean;
  autoToggleDisplay?: boolean;
  minimized?: boolean;
  aimingRectOptions?: any;
  shadowRectOptions?: any;
  strings?: {
    hideText?: string;
    showText?: string;
  };
}

/**
 * 鹰眼地图对象类
 */
export class OverviewMapObject {
  // 地图实例
  private mapInstance: L.Map | null = null;
  // 鹰眼控件
  private miniMapControl: L.Control.MiniMap | null = null;
  // 配置项
  private options: OverviewMapOptions = {
    position: 'bottomright',
    width: 150,
    height: 150,
    collapsedWidth: 28,
    collapsedHeight: 28,
    zoomLevelOffset: -5,
    zoomAnimation: true,
    toggleDisplay: true,
    minimized: false,
    autoToggleDisplay: false,
    aimingRectOptions: { color: '#ff7800', weight: 1, interactive: false },
    shadowRectOptions: { color: '#000000', weight: 1, opacity: 0.3, fillOpacity: 0.1, interactive: false },
    strings: {
      hideText: '隐藏鹰眼',
      showText: '显示鹰眼'
    }
  };
  // 是否启用
  private enabled: boolean = false;
  // 地图类型
  private mapType: MapType = MapType.OSM;
  // 瓦片类型
  private mapTile: MapTile = MapTile.NORMAL;
  // 地图配置
  private mapConfig: any = null;
  // 地图密钥
  private mapKey: Record<string, string> = {};

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param options 配置选项
   */
  constructor(
    mapInstance: L.Map | null = null, 
    options?: OverviewMapOptions,
    mapType?: MapType,
    mapTile?: MapTile,
    mapConfig?: any,
    mapKey?: Record<string, string>
  ) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }

    if (options) {
      this.setOptions(options);
    }

    if (mapType) {
      this.mapType = mapType;
    }

    if (mapTile) {
      this.mapTile = mapTile;
    }

    if (mapConfig) {
      this.mapConfig = mapConfig;
    }

    if (mapKey) {
      this.mapKey = mapKey;
    }
    
    // 记录初始化信息
    this.log('debug', '鹰眼地图对象已创建');
  }

  /**
   * 记录鹰眼模块日志
   * @param level 日志级别
   * @param message 日志消息
   * @param args 附加参数
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    const prefixedMessage = `[${LOG_MODULE}] ${message}`;
    switch (level) {
      case 'debug':
        logger.debug(prefixedMessage, ...args);
        break;
      case 'info':
        logger.info(prefixedMessage, ...args);
        break;
      case 'warn':
        logger.warn(prefixedMessage, ...args);
        break;
      case 'error':
        logger.error(prefixedMessage, ...args);
        break;
    }
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: L.Map): void {
    this.mapInstance = mapInstance;
    this.log('debug', '已设置地图实例');
  }

  /**
   * 设置配置选项
   * @param options 配置选项
   */
  public setOptions(options: OverviewMapOptions): void {
    this.options = { ...this.options, ...options };
    this.log('debug', '配置已更新', this.options);

    // 如果已初始化，需要重新初始化鹰眼控件
    if (this.enabled && this.mapInstance) {
      this.disable();
      this.enable();
    }
  }

  /**
   * 创建鹰眼图层
   * @returns 瓦片图层
   */
  private createOverviewLayer(): L.TileLayer {
    if (!this.mapConfig) {
      this.log('debug', '没有提供地图配置，使用默认OSM地图');
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
    }

    // 获取底图类型和瓦片类型
    const tileType = this.mapTile === MapTile.NORMAL ? 'normal' : 'satellite';
    
    // 检查配置是否存在
    if (!this.mapConfig[this.mapType] || !this.mapConfig[this.mapType][tileType]) {
      // 默认使用OSM
      this.log('warn', `找不到地图配置 ${this.mapType}/${tileType}，使用OSM作为鹰眼图层`);
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
    }
    
    const apiKey = this.mapKey[this.mapType] || '';
    const urlConfig = this.mapConfig[this.mapType][tileType];
    
    // 处理API密钥
    let url = urlConfig.url;
    if (url.includes('{key}') && apiKey) {
      url = url.replace('{key}', apiKey);
    } else if (url.includes('{key}') && !apiKey) {
      this.log('warn', `鹰眼图层需要API密钥，但未提供 ${this.mapType} 的密钥`);
    }
    
    this.log('debug', `创建图层 ${this.mapType}/${tileType}，URL: ${url}`);
    
    // 创建图层
    return L.tileLayer(url, {
      attribution: urlConfig.attribution,
      maxZoom: urlConfig.maxZoom || 19,
      subdomains: urlConfig.subdomains
    });
  }

  /**
   * 启用鹰眼控件
   * @param forceReinit 是否强制重新初始化
   */
  public enable(forceReinit: boolean = false): void {
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法启用鹰眼控件');
      return;
    }

    // 如果已启用且不强制重新初始化，则直接返回
    if (this.enabled && !forceReinit) {
      this.log('debug', '鹰眼控件已启用，跳过初始化');
      return;
    }

    // 如果已经有控件，则先删除
    if (this.miniMapControl) {
      this.disable();
    }

    try {
      // 创建图层
      const overviewLayer = this.createOverviewLayer();
      
      // 创建鹰眼控件
      this.miniMapControl = L.control.minimap(overviewLayer, {
        position: this.options.position as any,
        width: this.options.width,
        height: this.options.height,
        collapsedWidth: this.options.collapsedWidth,
        collapsedHeight: this.options.collapsedHeight,
        zoomLevelOffset: this.options.zoomLevelOffset,
        zoomLevelFixed: this.options.zoomLevelFixed,
        centerFixed: this.options.centerFixed,
        zoomAnimation: this.options.zoomAnimation,
        toggleDisplay: this.options.toggleDisplay,
        autoToggleDisplay: this.options.autoToggleDisplay,
        minimized: this.options.minimized,
        aimingRectOptions: this.options.aimingRectOptions,
        shadowRectOptions: this.options.shadowRectOptions,
        strings: this.options.strings
      });
      
      // 添加到地图
      this.miniMapControl.addTo(this.mapInstance);
      
      // 设置为已启用
      this.enabled = true;
      
      this.log('info', '鹰眼控件已启用');
    } catch (error) {
      this.log('error', '启用鹰眼控件失败', error);
    }
  }

  /**
   * 禁用鹰眼控件
   */
  public disable(): void {
    if (!this.mapInstance || !this.miniMapControl) {
      this.log('debug', '鹰眼控件未启用或地图实例未设置，无需禁用');
      return;
    }

    try {
      // 从地图移除控件
      this.mapInstance.removeControl(this.miniMapControl);
      
      // 清空引用
      this.miniMapControl = null;
      
      // 设置为未启用
      this.enabled = false;
      
      this.log('info', '鹰眼控件已禁用');
    } catch (error) {
      this.log('error', '禁用鹰眼控件失败', error);
    }
  }

  /**
   * 切换鹰眼控件的显示状态
   */
  public toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * 设置是否折叠
   * @param minimized 是否折叠
   */
  public setMinimized(minimized: boolean): void {
    this.options.minimized = minimized;
    
    if (this.miniMapControl) {
      if (minimized) {
        this.miniMapControl.minimize();
      } else {
        this.miniMapControl.restore();
      }
    }
    
    this.log('debug', `已${minimized ? '折叠' : '展开'}鹰眼控件`);
  }

  /**
   * 设置地图类型
   * @param mapType 地图类型
   * @param mapTile 瓦片类型
   */
  public setMapType(mapType: MapType, mapTile: MapTile = MapTile.NORMAL): void {
    this.mapType = mapType;
    this.mapTile = mapTile;
    
    // 如果已启用，需要重新初始化
    if (this.enabled) {
      this.enable(true);
    }
    
    this.log('debug', `已设置地图类型: ${mapType}/${mapTile}`);
  }

  /**
   * 获取鹰眼控件是否启用
   * @returns 是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    // 禁用鹰眼控件
    this.disable();
    
    // 清空引用
    this.mapInstance = null;
    this.mapConfig = null;
    
    this.log('debug', '鹰眼地图对象已销毁');
  }
}

/**
 * 创建鹰眼地图对象的工厂函数
 * @param mapInstance 地图实例
 * @param options 配置选项
 * @returns 鹰眼地图对象
 */
export function createOverviewMapObject(
  mapInstance?: L.Map, 
  options?: OverviewMapOptions,
  mapType?: MapType,
  mapTile?: MapTile,
  mapConfig?: any,
  mapKey?: Record<string, string>
): OverviewMapObject {
  return new OverviewMapObject(
    mapInstance,
    options,
    mapType,
    mapTile,
    mapConfig,
    mapKey
  );
} 