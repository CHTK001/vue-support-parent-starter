/**
 * GeoHash网格对象
 * @description 基于瓦片系统实现的GeoHash网格，瓦片边界即网格边界
 */
import { Map as OlMap } from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileGrid from 'ol/tilegrid/TileGrid';
import XYZ from 'ol/source/XYZ';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { toLonLat } from 'ol/proj';
import logger from './LogObject';

// 网格模块的日志前缀
const LOG_MODULE = 'GeoHashGrid';

// GeoHash网格配置接口
export interface GeoHashGridConfig {
  precision: number;       // GeoHash精度(1-12)
  strokeColor: string;     // 边框颜色
  strokeWidth: number;     // 边框宽度
  fillColor: string;       // 填充颜色
  showLabels: boolean;     // 是否显示标签
  labelColor: string;      // 标签颜色
  targetSize?: number;     // 单元格像素大小，默认100
  buffer?: number;         // 额外计算可视范围外的网格数量，默认4
  cacheSize?: number;      // 缓存的网格数量，默认1000
  extent?: [number, number, number, number]; // 渲染范围，默认是渲染全部
  zIndex?: number;         // 图层渲染的Z索引，默认按加载顺序叠加
  opacity?: number;        // 透明度，默认为1
  colorMode?: 'default' | 'random' | 'gradient' | 'hash'; // 颜色模式，默认为default
  gradientColors?: string[];  // 渐变色数组，用于gradient模式
  hashColors?: {[key: string]: string}; // 基于hash前缀的颜色映射，用于hash模式
  
  // 新增背景颜色相关配置
  backgroundColor?: string; // 背景颜色，默认透明
  backgroundPattern?: 'none' | 'grid' | 'dots' | 'diagonal' | 'checkerboard'; // 背景图案
  backgroundOpacity?: number; // 背景透明度，默认0.1
  alternateColors?: boolean; // 是否交替背景色，默认false
  backgroundColorAlt?: string; // 交替背景颜色，用于棋盘格等模式
}

// 默认GeoHash网格配置
const DEFAULT_GEOHASH_CONFIG: GeoHashGridConfig = {
  precision: 8,
  strokeColor: 'rgba(0, 60, 136, 0.8)',
  strokeWidth: 1,
  fillColor: 'rgba(0, 60, 136, 0.2)',
  showLabels: true,
  labelColor: '#000',
  targetSize: 100,
  buffer: 4,
  cacheSize: 1000,
  opacity: 1,
  colorMode: 'default',
  gradientColors: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'], // 默认渐变色
  
  // 背景颜色默认配置
  backgroundColor: 'rgba(240, 240, 250, 0.8)', // 设置为浅蓝灰色背景
  backgroundPattern: 'grid',
  backgroundOpacity: 0.2, // 增加透明度使背景更明显
  alternateColors: false,
  backgroundColorAlt: 'rgba(220, 220, 230, 0.6)'
};

/**
 * GeoHash网格对象类
 */
export class GeoHashGridObject {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 瓦片网格图层
  private gridLayer: TileLayer<XYZ> | null = null;
  // 配置
  private config: GeoHashGridConfig = DEFAULT_GEOHASH_CONFIG;
  // 是否可见
  private visible: boolean = false;
  // 地图移动结束监听器
  private moveEndListener: EventsKey | null = null;
  // 上次视图缩放级别
  private lastZoom: number | null = null;

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 网格配置（可选）
   */
  constructor(mapInstance: OlMap | null = null, config?: Partial<GeoHashGridConfig>) {
    if (mapInstance) {
      this.log('info', '构造函数中设置地图实例...');
      this.setMapInstance(mapInstance);
    } else {
      this.log('warn', '构造函数中未提供地图实例！');
    }
    
    if (config) {
      this.setConfig(config);
    }
    
    this.log('debug', 'GeoHash网格对象已创建');
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
    
    // 获取地图大小，确保地图已经正确初始化
    const mapSize = mapInstance.getSize();
    if (!mapSize || mapSize[0] === 0 || mapSize[1] === 0) {
      this.log('warn', '地图尚未完全渲染，大小:', mapSize);
    } else {
      this.log('debug', '地图尺寸正常:', mapSize);
    }
    
    // 尝试获取地图视图
    const view = mapInstance.getView();
    if (!view) {
      this.log('error', '地图视图不可用！');
      return;
    }
    
    this.log('info', '地图中心点:', view.getCenter());
    this.log('info', '地图缩放级别:', view.getZoom());
    
    // 初始化网格图层
    this.initLayer();
    
    this.log('debug', '地图实例已设置');
  }

  /**
   * 设置网格配置
   * @param config 网格配置
   */
  public setConfig(config: Partial<GeoHashGridConfig>): void {
    this.config = {
      ...DEFAULT_GEOHASH_CONFIG,
      ...config
    };
    
    // 如果图层已经初始化，应用新配置
    if (this.gridLayer) {
      this.applyConfig();
    }
    
    // 如果是可见状态，重新绘制
    if (this.visible) {
      this.refresh();
    }
    
    this.log('debug', '网格配置已更新');
  }

  /**
   * 应用配置到图层
   * @private
   */
  private applyConfig(): void {
    if (!this.gridLayer) return;
    
    // 应用基本属性
    this.gridLayer.setOpacity(this.config.opacity || 1);
    if (this.config.zIndex !== undefined) {
      this.gridLayer.setZIndex(this.config.zIndex);
    }
    if (this.config.extent) {
      this.gridLayer.setExtent(this.config.extent);
    }
    
    this.log('debug', '配置已应用到图层');
  }

  /**
   * 初始化网格图层
   * @private
   */
  private initLayer(): void {
    if (!this.mapInstance) {
      this.log('error', '无法初始化图层：地图实例不可用');
      return;
    }
    
    try {
      // 创建瓦片网格图层
      const tileSize = 256;
      const tileGrid = new TileGrid({
        tileSize: tileSize,
        // 使用标准的Web墨卡托投影分辨率
        resolutions: Array.from({ length: 20 }).map((_, i) => 156543.03392804097 / Math.pow(2, i)),
        extent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244],
      });
      
      // 创建自定义瓦片渲染函数的XYZ源
      const self = this;
      const source = new XYZ({
        tileGrid: tileGrid,
        tileUrlFunction: function(tileCoord) {
          // 返回空URL，防止请求外部资源
          return '';
        },
        tileLoadFunction: function(imageTile, src) {
          const tileCoord = imageTile.getTileCoord();
          const z = tileCoord[0];
          const x = tileCoord[1];
          const y = tileCoord[2];
          
          // 创建Canvas来绘制瓦片
          const canvas = document.createElement('canvas');
          canvas.width = tileSize;
          canvas.height = tileSize;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // ===== 第1步：绘制整个瓦片的统一背景 =====
          // 绘制浅蓝色棋盘格背景 - 匹配图中的样式
          self.drawBackgroundCheckerboard(ctx, tileSize, 
            'rgba(225, 235, 245, 0.3)', // 浅蓝色
          );
          
          // ===== 第2步：计算当前瓦片对应的GeoHash =====
          // 计算瓦片的地理范围
          const extent = tileGrid.getTileCoordExtent(tileCoord);
          
          // 转换为经纬度坐标
          const bottomLeft = toLonLat([extent[0], extent[1]]);
          const topRight = toLonLat([extent[2], extent[3]]);
          
          // 计算瓦片中心点
          const centerLng = (bottomLeft[0] + topRight[0]) / 2;
          const centerLat = (bottomLeft[1] + topRight[1]) / 2;
          
          // 根据缩放级别动态计算GeoHash精度
          const zoom = self.mapInstance?.getView().getZoom() || 0;
          const precision = self.calculatePrecisionForZoom(zoom);
          
          // 为当前位置生成GeoHash编码
          const geohash = self.encodeGeoHash(centerLat, centerLng, precision);
          
          // ===== 第3步：在瓦片中心绘制GeoHash标签 =====
          // 标签位置（瓦片中心）
          const labelX = tileSize / 2;
          const labelY = tileSize / 2;
          
          // 带背景的标签
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          
          // 测量文本宽度
          ctx.font = '12px Arial';
          const textWidth = ctx.measureText(geohash).width;
          const padding = 4;
          const rectWidth = textWidth + padding * 2;
          const rectHeight = 16;
          
          // 绘制标签背景
          ctx.fillRect(
            labelX - rectWidth / 2,
            labelY - rectHeight / 2,
            rectWidth,
            rectHeight
          );
          
          // 绘制标签边框
          ctx.strokeStyle = 'rgba(150, 150, 150, 0.6)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(
            labelX - rectWidth / 2,
            labelY - rectHeight / 2,
            rectWidth,
            rectHeight
          );
          
          // 绘制文本
          ctx.fillStyle = 'rgba(50, 50, 120, 1.0)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(geohash, labelX, labelY);
          
          // ===== 第4步：绘制边框（可选）=====
          // 绘制瓦片边框
          if (self.config.strokeWidth > 0) {
            ctx.strokeStyle = self.config.strokeColor || 'rgba(180, 180, 180, 0.4)';
            ctx.lineWidth = self.config.strokeWidth;
            ctx.strokeRect(0, 0, tileSize, tileSize);
          }
          
          // 设置瓦片图像
          (imageTile as any).getImage().src = canvas.toDataURL();
        }
      });
      
      // 创建瓦片图层
      this.gridLayer = new TileLayer({
        source: source,
        opacity: this.config.opacity,
        zIndex: this.config.zIndex,
        visible: false // 默认不可见，等待启用
      });
      
      // 将图层添加到地图
      this.mapInstance.addLayer(this.gridLayer);
      
      // 设置移动结束监听器
      this.setupMoveEndListener();
      
      this.log('debug', '瓦片网格图层已初始化');
    } catch (error) {
      this.log('error', '初始化网格图层时出错:', error);
    }
  }

  /**
   * 设置地图移动结束监听器
   * @private
   */
  private setupMoveEndListener(): void {
    if (!this.mapInstance) return;
    
    // 移除已有的监听器
    this.removeMoveEndListener();
    
    // 添加新的监听器
    this.moveEndListener = this.mapInstance.on('moveend', () => {
      if (this.visible) {
        // 获取当前缩放级别
        const zoom = this.mapInstance?.getView().getZoom() || 0;
        
        // 如果缩放级别变化，或者是首次渲染，强制刷新瓦片
        if (this.lastZoom === null || Math.abs(this.lastZoom - zoom) > 0.1) {
          this.lastZoom = zoom;
          this.refresh();
        }
      }
    });
    
    this.log('debug', '已设置地图移动结束监听器');
  }

  /**
   * 移除地图移动结束监听器
   * @private
   */
  private removeMoveEndListener(): void {
    if (this.moveEndListener) {
      unByKey(this.moveEndListener);
      this.moveEndListener = null;
      this.log('debug', '已移除地图移动结束监听器');
    }
  }

  /**
   * 根据缩放级别计算合适的GeoHash精度
   * @param zoom 缩放级别
   * @returns GeoHash精度
   */
  private calculatePrecisionForZoom(zoom: number): number {
    // 如果有配置中指定的精度，优先使用配置
    // if (this.config.precision) {
      // return this.config.precision;
    // }
    
    // 根据缩放级别动态调整精度，但确保精度值更合理
    // 在较低缩放级别使用较短的GeoHash (更大区域)
    if (zoom <= 2) return 2;      // 大洲级别
    if (zoom <= 4) return 3;      // 国家级别
    if (zoom <= 6) return 4;      // 省市级别
    if (zoom <= 9) return 5;      // 城市级别
    if (zoom <= 11) return 6;     // 区县级别
    if (zoom <= 13) return 7;     // 街道级别
    if (zoom <= 15) return 8;     // 街区级别
    return 9;                     // 建筑级别
  }

  /**
   * 编码GeoHash
   * @param lat 纬度
   * @param lng 经度
   * @param precision 精度
   * @returns GeoHash字符串
   */
  private encodeGeoHash(lat: number, lng: number, precision: number): string {
    // GeoHash编码字符集
    const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    
    // 规范化坐标 (纬度 -90~90, 经度 -180~180)
    lat = Math.max(-90, Math.min(90, lat));
    lng = Math.max(-180, Math.min(180, lng));
    
    let geohash = '';
    let bit = 0;
    let ch = 0;
    let evenBit = true;
    
    // 纬度和经度的搜索区间
    let latMin = -90, latMax = 90;
    let lngMin = -180, lngMax = 180;
    
    while (geohash.length < precision) {
      if (evenBit) {
        // 处理经度
        const lngMid = (lngMin + lngMax) / 2;
        if (lng >= lngMid) {
          ch |= (1 << (4 - bit));
          lngMin = lngMid;
        } else {
          lngMax = lngMid;
        }
      } else {
        // 处理纬度
        const latMid = (latMin + latMax) / 2;
        if (lat >= latMid) {
          ch |= (1 << (4 - bit));
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }
      
      evenBit = !evenBit;
      
      // 每5位编码为一个字符
      if (++bit === 5) {
        geohash += BASE32.charAt(ch);
        bit = 0;
        ch = 0;
      }
    }
    
    return geohash;
  }

  /**
   * 解码GeoHash边界
   * @param geohash GeoHash字符串
   * @returns 边界坐标
   */
  private decodeGeoHashBounds(geohash: string): {minLat: number, maxLat: number, minLng: number, maxLng: number} {
    // GeoHash解码字符集映射
    const BASE32_CODES: {[key: string]: number} = {
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      'b': 10, 'c': 11, 'd': 12, 'e': 13, 'f': 14, 'g': 15, 'h': 16, 'j': 17, 'k': 18,
      'm': 19, 'n': 20, 'p': 21, 'q': 22, 'r': 23, 's': 24, 't': 25, 'u': 26, 'v': 27,
      'w': 28, 'x': 29, 'y': 30, 'z': 31
    };
    
    let evenBit = true;
    let latMin = -90, latMax = 90;
    let lngMin = -180, lngMax = 180;
    
    for (let i = 0; i < geohash.length; i++) {
      const char = geohash[i].toLowerCase();
      const code = BASE32_CODES[char] || 0;
      
      for (let j = 0; j < 5; j++) {
        const bit = (code >> (4 - j)) & 1;
        
        if (evenBit) {
          // 处理经度
          const lngMid = (lngMin + lngMax) / 2;
          if (bit === 1) {
            lngMin = lngMid;
          } else {
            lngMax = lngMid;
          }
        } else {
          // 处理纬度
          const latMid = (latMin + latMax) / 2;
          if (bit === 1) {
            latMin = latMid;
          } else {
            latMax = latMid;
          }
        }
        
        evenBit = !evenBit;
      }
    }
    
    return {
      minLat: latMin,
      maxLat: latMax,
      minLng: lngMin,
      maxLng: lngMax
    };
  }

  /**
   * 启用GeoHash网格
   */
  public enable(): void {
    if (!this.mapInstance || !this.gridLayer) {
      this.log('error', '无法启用网格：地图或图层未初始化');
      return;
    }
    
    // 设置图层可见
    this.gridLayer.setVisible(true);
    
    // 标记为可见状态
    this.visible = true;
    
    // 刷新网格
    this.refresh();
    
    this.log('info', 'GeoHash网格已启用');
  }

  /**
   * 禁用GeoHash网格
   */
  public disable(): void {
    if (!this.gridLayer) {
      return;
    }
    
    // 设置图层不可见
    this.gridLayer.setVisible(false);
    
    // 标记为不可见状态
    this.visible = false;
    
    this.log('info', 'GeoHash网格已禁用');
  }

  /**
   * 刷新GeoHash网格
   */
  public refresh(): void {
    if (!this.mapInstance || !this.gridLayer || !this.visible) {
      return;
    }
    
    // 刷新图层
    const source = this.gridLayer.getSource();
    if (source) {
      source.refresh();
    }
    
    this.log('debug', 'GeoHash网格已刷新');
  }

  /**
   * 检查GeoHash网格是否已启用
   * @returns 是否启用
   */
  public isEnabled(): boolean {
    return this.visible;
  }

  /**
   * 获取当前网格配置
   * @returns 网格配置
   */
  public getConfig(): GeoHashGridConfig {
    return {...this.config};
  }

  /**
   * 设置GeoHash精度
   * @param precision GeoHash精度
   */
  public setPrecision(precision: number): void {
    // 验证精度在有效范围内
    if (precision < 1 || precision > 12) {
      this.log('warn', `精度值 ${precision} 无效，应该在1-12之间`);
      return;
    }
    
    // 更新精度配置
    this.config.precision = precision;
    
    // 如果网格已启用，刷新显示
    if (this.visible) {
      this.refresh();
    }
    
    this.log('debug', `GeoHash精度已设置为 ${precision}`);
  }

  /**
   * 设置渲染范围
   * @param extent 渲染范围 [minX, minY, maxX, maxY] 或 null（渲染全部）
   */
  public setExtent(extent: [number, number, number, number] | null): void {
    // 保存范围配置
    this.config.extent = extent || undefined;
    
    // 应用到图层
    if (this.gridLayer) {
      if (extent) {
        this.gridLayer.setExtent(extent);
      } else {
        // 如果extent为null，则移除范围限制
        this.gridLayer.setExtent(undefined);
      }
      
      // 刷新显示
      if (this.visible) {
        this.refresh();
      }
    }
    
    this.log('debug', `渲染范围已${extent ? '设置' : '移除'}`);
  }

  /**
   * 设置图层透明度
   * @param opacity 透明度（0-1）
   */
  public setOpacity(opacity: number): void {
    // 验证透明度在有效范围内
    opacity = Math.max(0, Math.min(1, opacity));
    
    // 更新透明度配置
    this.config.opacity = opacity;
    
    // 应用到图层
    if (this.gridLayer) {
      this.gridLayer.setOpacity(opacity);
    }
    
    this.log('debug', `透明度已设置为 ${opacity}`);
  }

  /**
   * 设置图层Z索引
   * @param zIndex Z索引
   */
  public setZIndex(zIndex: number): void {
    // 更新Z索引配置
    this.config.zIndex = zIndex;
    
    // 应用到图层
    if (this.gridLayer) {
      this.gridLayer.setZIndex(zIndex);
    }
    
    this.log('debug', `Z索引已设置为 ${zIndex}`);
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    this.log('info', '销毁GeoHash网格对象...');
    
    // 移除事件监听器
    this.removeMoveEndListener();
    
    // 从地图上移除图层
    if (this.mapInstance && this.gridLayer) {
      this.mapInstance.removeLayer(this.gridLayer);
    }
    
    // 清除引用
    this.gridLayer = null;
    this.mapInstance = null;
    this.moveEndListener = null;
    this.lastZoom = null;
    
    this.log('info', 'GeoHash网格对象已销毁');
  }

  /**
   * 记录日志
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logMessage = `[${LOG_MODULE}] ${message}`;
    
    switch (level) {
      case 'debug':
        logger.debug(logMessage, data);
        break;
      case 'info':
        logger.info(logMessage, data);
        break;
      case 'warn':
        logger.warn(logMessage, data);
        break;
      case 'error':
        logger.error(logMessage, data);
        break;
    }
  }

  /**
   * 根据GeoHash字符串生成稳定的颜色
   * @param geohash GeoHash字符串
   * @returns 颜色字符串
   */
  private getHashColor(geohash: string): string {
    // 计算字符串的哈希值
    let hash = 0;
    for (let i = 0; i < geohash.length; i++) {
      hash = geohash.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 生成RGB颜色
    let r = (hash & 0xFF);
    let g = ((hash >> 8) & 0xFF);
    let b = ((hash >> 16) & 0xFF);
    
    // 调整亮度，避免颜色过暗
    const minBrightness = 30; // 最小亮度
    r = Math.max(r, minBrightness);
    g = Math.max(g, minBrightness);
    b = Math.max(b, minBrightness);
    
    // 添加透明度
    const opacity = 0.6; // 默认透明度
    
    // 返回RGBA颜色字符串
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * 设置颜色模式
   * @param mode 颜色模式
   * @param options 附加选项（如渐变色数组或哈希颜色映射）
   */
  public setColorMode(mode: 'default' | 'random' | 'gradient' | 'hash', options?: {
    gradientColors?: string[],
    hashColors?: {[key: string]: string}
  }): void {
    // 更新颜色模式
    this.config.colorMode = mode;
    
    // 更新附加选项
    if (options) {
      if (options.gradientColors) {
        this.config.gradientColors = options.gradientColors;
      }
      
      if (options.hashColors) {
        this.config.hashColors = options.hashColors;
      }
    }
    
    // 如果网格已启用，刷新显示
    if (this.visible) {
      this.refresh();
    }
    
    this.log('debug', `颜色模式已设置为 ${mode}`);
  }

  /**
   * 调整颜色的透明度
   * @param color 颜色字符串
   * @param opacity 透明度
   * @returns 调整透明度后的颜色
   */
  private adjustOpacity(color: string, opacity: number): string {
    // 处理rgba格式
    if (color.startsWith('rgba(')) {
      return color.replace(/rgba\((.+?),\s*[\d\.]+\)/, `rgba($1, ${opacity})`);
    }
    
    // 处理rgb格式
    if (color.startsWith('rgb(')) {
      return color.replace(/rgb\((.+?)\)/, `rgba($1, ${opacity})`);
    }
    
    // 处理十六进制格式
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // 其他情况直接返回
    return color;
  }

  /**
   * 绘制棋盘格背景，确保完全填满瓦片
   * @param ctx Canvas上下文
   * @param size 瓦片大小
   * @param color1 第一种颜色
   * @param color2 第二种颜色
   */
  private drawBackgroundCheckerboard(
    ctx: CanvasRenderingContext2D, 
    size: number, 
    color1: string, 
  ): void {
    // 先填充整个背景为第一种颜色
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size, size);
    
  }
} 