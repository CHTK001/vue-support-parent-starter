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

// 鹰眼模块的日志前缀
const LOG_MODULE = 'Overview';

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
  public setMapInstance(mapInstance: Map): void {
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
  }

  /**
   * 创建鹰眼图层
   * @returns 瓦片图层
   */
  private createOverviewLayer(): TileLayer<any> {
    if (!this.mapConfig) {
      this.log('debug', '没有提供地图配置，使用默认OSM地图');
      return new TileLayer({
        source: new OSM()
      });
    }

    // 获取底图类型和瓦片类型
    const tileType = this.mapTile === MapTile.NORMAL ? 'normal' : 'satellite';
    
    // 检查配置是否存在
    if (!this.mapConfig[this.mapType] || !this.mapConfig[this.mapType][tileType]) {
      // 默认使用OSM
      this.log('warn', `找不到地图配置 ${this.mapType}/${tileType}，使用OSM作为鹰眼图层`);
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
      this.log('warn', `鹰眼图层需要API密钥，但未提供 ${this.mapType} 的密钥`);
    }
    
    this.log('debug', `创建图层 ${this.mapType}/${tileType}，URL: ${url}`);
    
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
   * @param forceReinit 是否强制重新初始化
   */
  public enable(forceReinit: boolean = false): void {
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法启用鹰眼控件');
      return;
    }

    // 如果已启用且不强制重新初始化，则直接返回
    if (this.enabled && this.overviewMapControl && !forceReinit) {
      // 确保鹰眼控件展开
      this.setCollapsed(false);
      this.log('info', '鹰眼控件已启用，设置为展开状态');
      return;
    }

    // 如果强制重新初始化或已有控件，先禁用
    if (forceReinit || this.overviewMapControl) {
      this.log('debug', '强制重新初始化鹰眼控件');
      this.disable();
    }

    try {
      // 创建鹰眼图层
      this.log('debug', '正在创建鹰眼图层...');
      const overviewLayer = this.createOverviewLayer();

      // 检查控件默认配置
      if (this.options.collapsed === undefined) {
        this.options.collapsed = false; // 默认展开
      }
      
      // 将控件定位在右下角
      if (!this.options.className) {
        this.options.className = 'ol-overviewmap';
      }

      this.log('debug', '正在创建鹰眼控件，配置:', this.options);
      
      // 创建鹰眼控件
      this.overviewMapControl = new OverviewMap({
        className: this.options.className,
        collapsed: this.options.collapsed,
        collapseLabel: this.options.collapseLabel || '«',
        label: this.options.label || '»',
        rotateWithView: this.options.rotateWithView !== undefined ? this.options.rotateWithView : false,
        tipLabel: this.options.tipLabel || '鹰眼',
        layers: [overviewLayer]
      });

      this.log('debug', '鹰眼控件已创建，正在添加到地图...');
      
      // 添加控件到地图
      this.mapInstance.addControl(this.overviewMapControl);
      this.enabled = true;
      
      // 修正鹰眼控件样式
      this.fixOverviewMapStyle();
      
      // 确保控件可见（立即展开）
      setTimeout(() => {
        if (this.overviewMapControl) {
          this.overviewMapControl.setCollapsed(false);
          // 再次修正样式，确保展开后样式正确
          this.fixOverviewMapStyle();
          this.log('debug', '鹰眼控件已设置为展开状态（延迟处理）');
        }
      }, 100);
      
      this.log('info', '鹰眼控件已成功添加到地图');
      
      // 验证控件是否正确添加
      const controls = this.mapInstance.getControls().getArray();
      const hasOverviewControl = controls.some(control => 
        control instanceof OverviewMap
      );
      
      if (hasOverviewControl) {
        this.log('info', '验证成功：鹰眼控件已在地图控件列表中');
      } else {
        this.log('error', '验证失败：鹰眼控件不在地图控件列表中，尝试再次添加');
        // 如果控件没有成功添加，再次尝试
        this.mapInstance.addControl(this.overviewMapControl);
      }
    } catch (error) {
      this.log('error', '启用鹰眼控件失败:', error);
      // 尝试恢复状态
      this.overviewMapControl = null;
      this.enabled = false;
    }
  }

  /**
   * 禁用鹰眼控件
   */
  public disable(): void {
    if (!this.mapInstance || !this.overviewMapControl) {
      this.log('debug', '鹰眼控件不存在或已禁用，无需操作');
      return;
    }

    try {
      // 从地图中移除控件
      this.mapInstance.removeControl(this.overviewMapControl);
      this.overviewMapControl = null;
      this.enabled = false;
      this.log('info', '鹰眼控件已禁用并移除');
    } catch (error) {
      this.log('error', '禁用鹰眼控件失败:', error);
    }
  }

  /**
   * 切换鹰眼控件状态
   */
  public toggle(): void {
    if (this.enabled && this.overviewMapControl) {
      this.log('debug', '切换鹰眼控件状态：从启用到禁用');
      this.disable();
    } else {
      this.log('debug', '切换鹰眼控件状态：从禁用到启用');
      this.enable();
    }
  }

  /**
   * 设置鹰眼控件的折叠状态
   * @param collapsed 是否折叠
   */
  public setCollapsed(collapsed: boolean): void {
    if (!this.overviewMapControl) {
      this.log('warn', '鹰眼控件不存在，无法设置折叠状态');
      return;
    }

    this.overviewMapControl.setCollapsed(collapsed);
    this.log('debug', `鹰眼控件折叠状态已设置为: ${collapsed ? '折叠' : '展开'}`);
  }

  /**
   * 设置是否跟随主图旋转
   * @param rotateWithView 是否跟随旋转
   */
  public setRotateWithView(rotateWithView: boolean): void {
    this.options.rotateWithView = rotateWithView;
    
    if (this.enabled && this.overviewMapControl) {
      this.log('debug', `更新鹰眼控件旋转设置: ${rotateWithView ? '跟随旋转' : '不跟随旋转'}`);
      // 重新创建控件以应用新设置
      this.enable(true);
    }
  }

  /**
   * 判断鹰眼控件是否启用
   * @returns 是否启用
   */
  public isEnabled(): boolean {
    return this.enabled && this.overviewMapControl !== null;
  }

  /**
   * 销毁鹰眼对象
   */
  public destroy(): void {
    this.disable();
    this.mapInstance = null;
    this.log('debug', '鹰眼对象已销毁');
  }

  /**
   * 修正鹰眼控件样式
   * 处理一些已知的样式问题
   */
  private fixOverviewMapStyle(): void {
    if (!this.overviewMapControl || !this.enabled) return;

    try {
      // 获取鹰眼控件元素
      // @ts-ignore
      const overviewElement = this.overviewMapControl?.element;
      if (!overviewElement) {
        this.log('warn', '找不到鹰眼控件元素，无法修正样式');
        return;
      }

      // 设置基本样式
      overviewElement.style.position = 'absolute';
      overviewElement.style.right = '0';
      overviewElement.style.bottom = '0';
      overviewElement.style.margin = '0';
      
      // 获取地图容器
      const mapElement = this.mapInstance?.getTargetElement();
      if (!mapElement) {
        this.log('warn', '找不到地图容器元素，部分样式修正可能无效');
        return;
      }
      
      // 查找并修正鹰眼控件内部元素样式
      const overviewBox = overviewElement.querySelector('.ol-overviewmap-box');
      if (overviewBox instanceof HTMLElement) {
        overviewBox.style.border = '2px solid #1890ff';
        overviewBox.style.boxShadow = '0 0 6px rgba(24, 144, 255, 0.6)';
      } else {
        this.log('warn', '找不到鹰眼控件内部元素，无法修正高亮框样式');
      }
      
      // 查找并修正鹰眼地图容器样式
      const overviewMapContainer = overviewElement.querySelector('.ol-overviewmap-map');
      if (overviewMapContainer instanceof HTMLElement) {
        overviewMapContainer.style.width = `${this.options.position?.includes('left') ? 'right' : 'left'}`;
      } else {
        this.log('warn', '找不到鹰眼地图容器元素，无法修正容器样式');
      }
      
      this.log('debug', '鹰眼控件样式修正完成');
    } catch (error) {
      this.log('error', '修正鹰眼控件样式失败:', error);
    }
  }
}

/**
 * 创建鹰眼地图对象的工厂函数
 */
export function createOverviewMapObject(
  mapInstance?: Map, 
  options?: OverviewMapOptions,
  mapType?: MapType,
  mapTile?: MapTile,
  mapConfig?: any,
  mapKey?: Record<string, string>
): OverviewMapObject {
  logger.debug('[Overview] 通过工厂函数创建鹰眼地图对象');
  return new OverviewMapObject(mapInstance, options, mapType, mapTile, mapConfig, mapKey);
}

export default OverviewMapObject; 