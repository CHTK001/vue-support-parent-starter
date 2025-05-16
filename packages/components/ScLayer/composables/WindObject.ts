/**
 * 风场对象类
 * 用于管理风场图层和数据
 */
import { Map as OlMap } from 'ol';
import { WindData, WindConfig, DEFAULT_WIND_CONFIG } from '../types/wind';
import logger from './LogObject';
import { WindLayer } from 'ol-wind';

// 定义一个全局声明来扩展Window接口
declare global {
  interface Window {
    OlWind?: any; // ol-wind库提供的全局对象
    addScript?: (url: string, callback: () => void) => void; // 添加脚本的辅助函数
  }
}

// 添加辅助函数，用于动态加载js脚本
if (typeof window !== 'undefined' && !window.addScript) {
  window.addScript = (url: string, callback: () => void) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
  };
}

export class WindObject {
  private mapInstance: OlMap | null = null;
  private windLayer: WindLayer | null = null;
  private config: WindConfig;
  private windData: WindData | null = null;
  private active: boolean = false;

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 风场图配置
   */
  constructor(mapInstance: OlMap, config?: WindConfig) {
    this.mapInstance = mapInstance;
    this.config = { ...DEFAULT_WIND_CONFIG, ...(config || {}) };
    logger.debug('[WindObject] 风场对象已初始化');
  }

  /**
   * 启用风场图
   * @returns 是否成功启用
   */
  async enable(): Promise<boolean> {
    if (this.active) {
      logger.debug('[WindObject] 风场图已经启用');
      return true;
    }

    if (!this.mapInstance) {
      logger.warn('[WindObject] 地图实例未初始化，无法启用风场图');
      return false;
    }

    try {
      // 如果没有数据，返回失败
      if (!this.windData) {
        logger.warn('[WindObject] 风场数据未设置，请先设置数据');
        return false;
      }

      // 创建风场图层
      this.windLayer = new WindLayer(this.windData, {
        windOptions: {
          velocityScale: this.config.velocityScale,
          paths: this.config.paths,
          colorScale: this.config.colorScale,
          lineWidth: this.config.lineWidth,
          generateParticleOption: this.config.generateParticleOption,
          particleMultiplier: this.config.particleMultiplier,
          particleAge: this.config.particleAge,
          particleFadeoutTime: this.config.particleFadeoutTime
        },
        fieldOptions: this.config.fieldOptions || { wrapX: false }
      });

      // 添加到地图
      this.windLayer.appendTo(this.mapInstance);
      this.active = true;
      logger.info('[WindObject] 风场图已启用');
      return true;
    } catch (error) {
      logger.error('[WindObject] 启用风场图时发生错误:', error);
      return false;
    }
  }

  /**
   * 禁用风场图
   * @returns 是否成功禁用
   */
  disable(): boolean {
    if (!this.active || !this.windLayer) {
      logger.debug('[WindObject] 风场图未启用，无需禁用');
      return true;
    }

    try {
      // 从地图中移除风场图层
      if (this.mapInstance) {
        this.mapInstance.removeLayer(this.windLayer);
        this.active = false;
        logger.info('[WindObject] 风场图已禁用');
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('[WindObject] 禁用风场图时发生错误:', error);
      return false;
    }
  }

  /**
   * 设置风场数据
   * @param data 风场数据
   * @returns 是否成功设置
   */
  setData(data: WindData): boolean {
    if (!data) {
      logger.warn('[WindObject] 风场数据为空');
      return false;
    }

    this.windData = data;
    
    // 如果风场图已启用，更新数据
    if (this.active && this.windLayer) {
      this.windLayer.setData(data);
      logger.debug('[WindObject] 风场数据已更新');
    }
    
    return true;
  }

  /**
   * 设置风场图配置项
   * @param config 风场图配置
   */
  setWindOptions(config: Partial<WindConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 如果风场图已启用，更新配置
    if (this.active && this.windLayer) {
      const windOptions = {
        velocityScale: this.config.velocityScale,
        paths: this.config.paths,
        colorScale: this.config.colorScale,
        lineWidth: this.config.lineWidth,
        generateParticleOption: this.config.generateParticleOption,
        particleMultiplier: this.config.particleMultiplier,
        particleAge: this.config.particleAge,
        particleFadeoutTime: this.config.particleFadeoutTime
      };
      
      this.windLayer.setWindOptions(windOptions);
      logger.debug('[WindObject] 风场配置已更新');
    }
  }

  /**
   * 判断风场图是否启用
   * @returns 是否启用
   */
  isEnabled(): boolean {
    return this.active;
  }

  /**
   * 获取风场数据
   * @returns 风场数据
   */
  getData(): WindData | null {
    return this.windData;
  }

  /**
   * 获取风场图配置
   * @returns 风场图配置
   */
  getConfig(): WindConfig {
    return { ...this.config };
  }

  /**
   * 销毁对象
   */
  destroy(): void {
    this.disable();
    this.mapInstance = null;
    this.windLayer = null;
    this.windData = null;
    this.active = false;
    logger.debug('[WindObject] 风场对象已销毁');
  }
} 