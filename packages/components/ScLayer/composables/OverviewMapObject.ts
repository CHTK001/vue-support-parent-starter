/**
 * 鹰眼地图对象
 * @description 管理地图鹰眼控件
 */
import { Map } from 'ol';
import OverviewMap from 'ol/control/OverviewMap';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { MapType } from '../types/map';
import { MapTile } from '../types';
import logger from './LogObject';

/**
 * 鹰眼配置选项
 */
export interface OverviewMapOptions {
  collapsed?: boolean;
  className?: string;
  tipLabel?: string;
  collapseLabel?: string;
  label?: string;
  rotateWithView?: boolean;
  layers?: any[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * 鹰眼地图对象类
 */
export class OverviewMapObject {
  // 地图实例
  private mapInstance: Map | null = null;
  // 鹰眼控件
  private overviewMapControl: OverviewMap | null = null;
  // 配置项
  private options: OverviewMapOptions = {
    collapsed: true,
    className: 'ol-overviewmap',
    tipLabel: '鹰眼',
    collapseLabel: '«',
    label: '»',
    rotateWithView: false
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
    mapInstance: Map | null = null, 
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
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: Map): void {
    this.mapInstance = mapInstance;
    logger.debug('鹰眼地图对象已设置地图实例');
  }

  /**
   * 设置配置选项
   * @param options 配置选项
   */
  public setOptions(options: OverviewMapOptions): void {
    this.options = { ...this.options, ...options };
    logger.debug('鹰眼地图对象配置已更新:', this.options);
  }

  /**
   * 创建鹰眼图层
   * @returns 瓦片图层
   */
  private createOverviewLayer(): TileLayer<any> {
    if (!this.mapConfig) {
      logger.debug('没有提供地图配置，使用默认OSM地图');
      return new TileLayer({
        source: new OSM()
      });
    }

    // 获取底图类型和瓦片类型
    const tileType = this.mapTile === MapTile.NORMAL ? 'normal' : 'satellite';
    
    // 检查配置是否存在
    if (!this.mapConfig[this.mapType] || !this.mapConfig[this.mapType][tileType]) {
      // 默认使用OSM
      logger.warn(`找不到地图配置 ${this.mapType}/${tileType}，使用OSM作为鹰眼图层`);
      return new TileLayer({
        source: new OSM(),
        opacity: 0.7
      });
    }
    
    const apiKey = this.mapKey[this.mapType] || '';
    const urlConfig = this.mapConfig[this.mapType][tileType];
    
    // 处理API密钥
    let url = urlConfig.url;
    if (url.includes('{key}') && apiKey) {
      url = url.replace('{key}', apiKey);
    } else if (url.includes('{key}') && !apiKey) {
      logger.warn(`鹰眼图层需要API密钥，但未提供 ${this.mapType} 的密钥`);
    }
    
    logger.debug(`创建鹰眼图层 ${this.mapType}/${tileType}，URL: ${url}`);
    
    // 创建XYZ图层
    return new TileLayer({
      source: new XYZ({
        url: url,
        attributions: [urlConfig.attribution],
      }),
      opacity: 0.7
    });
  }

  /**
   * 启用鹰眼控件
   */
  public enable(): void {
    if (!this.mapInstance) {
      logger.warn('地图实例未设置，无法启用鹰眼控件');
      return;
    }

    if (this.enabled && this.overviewMapControl) {
      logger.warn('鹰眼控件已启用');
      return;
    }

    try {
      // 创建鹰眼图层
      const overviewLayer = this.createOverviewLayer();

      // 创建鹰眼控件
      this.overviewMapControl = new OverviewMap({
        className: this.options.className,
        collapsed: this.options.collapsed,
        collapseLabel: this.options.collapseLabel,
        label: this.options.label,
        rotateWithView: this.options.rotateWithView,
        tipLabel: this.options.tipLabel,
        layers: [overviewLayer]
      });

      // 添加控件到地图
      this.mapInstance.addControl(this.overviewMapControl);
      this.enabled = true;
      
      logger.info('鹰眼控件已启用');
    } catch (error) {
      logger.error('启用鹰眼控件失败:', error);
    }
  }

  /**
   * 禁用鹰眼控件
   */
  public disable(): void {
    if (!this.mapInstance || !this.overviewMapControl) {
      return;
    }

    try {
      // 从地图移除鹰眼控件
      this.mapInstance.removeControl(this.overviewMapControl);
      this.overviewMapControl = null;
      this.enabled = false;
      logger.info('鹰眼控件已禁用');
    } catch (error) {
      logger.error('禁用鹰眼控件失败:', error);
    }
  }

  /**
   * 切换鹰眼控件状态
   */
  public toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * 设置鹰眼控件是否折叠
   * @param collapsed 是否折叠
   */
  public setCollapsed(collapsed: boolean): void {
    if (!this.overviewMapControl) {
      return;
    }

    this.overviewMapControl.setCollapsed(collapsed);
    this.options.collapsed = collapsed;
  }

  /**
   * 设置鹰眼控件是否跟随地图旋转
   * @param rotateWithView 是否跟随旋转
   */
  public setRotateWithView(rotateWithView: boolean): void {
    if (!this.overviewMapControl) {
      return;
    }

    this.overviewMapControl.setRotateWithView(rotateWithView);
    this.options.rotateWithView = rotateWithView;
  }

  /**
   * 是否已启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    this.disable();
    this.mapInstance = null;
  }
}

/**
 * 创建鹰眼地图对象
 * @param mapInstance 地图实例
 * @param options 配置选项
 * @returns 鹰眼地图对象
 */
export function createOverviewMapObject(
  mapInstance?: Map, 
  options?: OverviewMapOptions,
  mapType?: MapType,
  mapTile?: MapTile,
  mapConfig?: any,
  mapKey?: Record<string, string>
): OverviewMapObject {
  return new OverviewMapObject(
    mapInstance || null, 
    options, 
    mapType,
    mapTile,
    mapConfig,
    mapKey
  );
}

export default OverviewMapObject; 