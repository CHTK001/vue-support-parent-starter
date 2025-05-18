/**
 * GeoHash网格对象
 * @description 管理GeoHash网格的显示和隐藏
 */
import L from 'leaflet';
import logger from './LogObject';

// 定义GeoHash网格配置接口
export interface GeoHashGridConfig {
  precision: number;       // GeoHash精度(1-12)
  color: string;           // 边框颜色
  weight: number;          // 边框宽度
  opacity: number;         // 不透明度
  fillColor: string;       // 填充颜色
  fillOpacity: number;     // 填充不透明度
  showLabel: boolean;      // 是否显示标签
}

// 默认配置
export const DEFAULT_GEOHASH_CONFIG: GeoHashGridConfig = {
  precision: 6,
  color: '#ff3388',
  weight: 1,
  opacity: 0.8,
  fillColor: '#ff3388',
  fillOpacity: 0.1,
  showLabel: true
};

// GeoHash字符集
const BASE32_CHARS = '0123456789bcdefghjkmnpqrstuvwxyz';

export class GeoHashGridObject {
  private mapInstance: L.Map | null = null;
  private gridLayer: L.LayerGroup | null = null;
  private config: GeoHashGridConfig = DEFAULT_GEOHASH_CONFIG;
  private visible: boolean = false;
  private moveEndListener: any = null;

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 网格配置（可选）
   */
  constructor(mapInstance: L.Map | null = null, config?: Partial<GeoHashGridConfig>) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    
    if (config) {
      this.setConfig(config);
    }
    
    logger.debug('GeoHash网格对象已创建');
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: L.Map): void {
    // 检查地图实例是否有效
    if (!mapInstance) {
      logger.error('提供的地图实例无效！');
      return;
    }
    
    this.mapInstance = mapInstance;
    
    // 初始化网格图层
    this.initLayer();
    
    logger.debug('地图实例已设置');
  }

  /**
   * 设置网格配置
   * @param config 网格配置
   */
  public setConfig(config: Partial<GeoHashGridConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    // 如果是可见状态，重新绘制
    if (this.visible) {
      this.refresh();
    }
    
    logger.debug('网格配置已更新');
  }

  /**
   * 初始化网格图层
   * @private
   */
  private initLayer(): void {
    if (!this.mapInstance) {
      logger.error('无法初始化图层：地图实例不可用');
      return;
    }
    
    // 创建图层组
    this.gridLayer = L.layerGroup();
    
    // 设置移动结束监听器
    this.setupMoveEndListener();
    
    logger.debug('网格图层已初始化');
  }

  /**
   * 设置移动结束监听器
   * @private
   */
  private setupMoveEndListener(): void {
    if (!this.mapInstance) return;
    
    // 移除旧的监听器
    this.removeMoveEndListener();
    
    // 添加新的监听器
    this.moveEndListener = () => {
      if (this.visible) {
        this.refresh();
      }
    };
    
    this.mapInstance.on('moveend', this.moveEndListener);
    this.mapInstance.on('zoomend', this.moveEndListener);
    
    logger.debug('移动结束监听器已设置');
  }

  /**
   * 移除移动结束监听器
   * @private
   */
  private removeMoveEndListener(): void {
    if (!this.mapInstance || !this.moveEndListener) return;
    
    this.mapInstance.off('moveend', this.moveEndListener);
    this.mapInstance.off('zoomend', this.moveEndListener);
    this.moveEndListener = null;
    
    logger.debug('移动结束监听器已移除');
  }

  /**
   * 根据缩放级别计算GeoHash精度
   * @param zoom 缩放级别
   * @returns GeoHash精度
   * @private
   */
  private calculatePrecisionForZoom(zoom: number): number {
    // 根据缩放级别动态调整精度
    if (zoom <= 3) return 2;
    if (zoom <= 5) return 3;
    if (zoom <= 7) return 4;
    if (zoom <= 10) return 5;
    if (zoom <= 13) return 6;
    if (zoom <= 16) return 7;
    return 8;
  }

  /**
   * 编码GeoHash
   * @param lat 纬度
   * @param lng 经度
   * @param precision 精度
   * @returns GeoHash编码
   * @private
   */
  private encodeGeoHash(lat: number, lng: number, precision: number): string {
    let geohash = '';
    let even = true;
    let bit = 0;
    let ch = 0;
    
    let latMin = -90;
    let latMax = 90;
    let lngMin = -180;
    let lngMax = 180;
    
    while (geohash.length < precision) {
      if (even) {
        const mid = (lngMin + lngMax) / 2;
        if (lng >= mid) {
          ch |= 1 << (4 - bit);
          lngMin = mid;
        } else {
          lngMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (lat >= mid) {
          ch |= 1 << (4 - bit);
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      
      even = !even;
      
      if (bit < 4) {
        bit++;
      } else {
        geohash += BASE32_CHARS.charAt(ch);
        bit = 0;
        ch = 0;
      }
    }
    
    return geohash;
  }

  /**
   * 解码GeoHash边界
   * @param geohash GeoHash编码
   * @returns 边界坐标
   * @private
   */
  private decodeGeoHashBounds(geohash: string): {minLat: number, maxLat: number, minLng: number, maxLng: number} {
    let latMin = -90;
    let latMax = 90;
    let lngMin = -180;
    let lngMax = 180;
    let even = true;
    
    for (let i = 0; i < geohash.length; i++) {
      const c = geohash.charAt(i);
      const cd = BASE32_CHARS.indexOf(c);
      
      for (let j = 0; j < 5; j++) {
        const mask = 1 << (4 - j);
        if (even) {
          if (cd & mask) {
            lngMin = (lngMin + lngMax) / 2;
          } else {
            lngMax = (lngMin + lngMax) / 2;
          }
        } else {
          if (cd & mask) {
            latMin = (latMin + latMax) / 2;
          } else {
            latMax = (latMin + latMax) / 2;
          }
        }
        even = !even;
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
   * 启用网格
   */
  public enable(): void {
    this.show();
  }

  /**
   * 禁用网格
   */
  public disable(): void {
    this.hide();
  }

  /**
   * 刷新网格
   */
  public refresh(): void {
    if (!this.mapInstance || !this.gridLayer) return;
    
    // 清除旧的网格
    this.gridLayer.clearLayers();
    
    // 获取当前视图范围
    const bounds = this.mapInstance.getBounds();
    const zoom = this.mapInstance.getZoom();
    
    // 根据缩放级别计算精度
    const precision = this.config.precision || this.calculatePrecisionForZoom(zoom);
    
    // 计算当前视图中心的GeoHash
    const center = this.mapInstance.getCenter();
    const centerGeohash = this.encodeGeoHash(center.lat, center.lng, precision);
    
    // 绘制中心GeoHash单元格
    this.drawGeoHashCell(centerGeohash);
    
    // 扩展绘制周围的GeoHash单元格
    this.drawNeighborCells(centerGeohash);
    
    logger.debug('网格已刷新');
  }

  /**
   * 绘制GeoHash单元格
   * @param geohash GeoHash编码
   * @private
   */
  private drawGeoHashCell(geohash: string): void {
    if (!this.gridLayer) return;
    
    // 解码GeoHash边界
    const bounds = this.decodeGeoHashBounds(geohash);
    
    // 创建矩形
    const rectangle = L.rectangle(
      [
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng]
      ],
      {
        color: this.config.color,
        weight: this.config.weight,
        opacity: this.config.opacity,
        fillColor: this.config.fillColor,
        fillOpacity: this.config.fillOpacity
      }
    );
    
    // 添加标签
    if (this.config.showLabel) {
      const center = [
        (bounds.minLat + bounds.maxLat) / 2,
        (bounds.minLng + bounds.maxLng) / 2
      ];
      
      const marker = L.marker([center[0], center[1]], {
        icon: L.divIcon({
          html: `<div class="geohash-label">${geohash}</div>`,
          className: 'geohash-marker',
          iconSize: [80, 20]
        })
      });
      
      this.gridLayer.addLayer(marker);
    }
    
    // 添加矩形到图层
    this.gridLayer.addLayer(rectangle);
  }

  /**
   * 绘制相邻单元格
   * @param centerGeohash 中心GeoHash编码
   * @private
   */
  private drawNeighborCells(centerGeohash: string): void {
    // 简单实现：在这里可以添加绘制相邻单元格的逻辑
    // 由于计算GeoHash邻居比较复杂，这里简化处理
  }

  /**
   * 显示网格
   * @returns 是否成功
   */
  public show(): boolean {
    if (!this.mapInstance || !this.gridLayer) return false;
    
    if (!this.visible) {
      this.gridLayer.addTo(this.mapInstance);
      this.visible = true;
      this.refresh();
    }
    
    return true;
  }

  /**
   * 隐藏网格
   * @returns 是否成功
   */
  public hide(): boolean {
    if (!this.mapInstance || !this.gridLayer) return false;
    
    if (this.visible) {
      this.gridLayer.removeFrom(this.mapInstance);
      this.visible = false;
    }
    
    return true;
  }

  /**
   * 是否已启用
   * @returns 是否已启用
   */
  public isEnabled(): boolean {
    return this.visible;
  }

  /**
   * 获取配置
   * @returns 网格配置
   */
  public getConfig(): GeoHashGridConfig {
    return this.config;
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    this.hide();
    this.removeMoveEndListener();
    
    if (this.gridLayer) {
      this.gridLayer.clearLayers();
      this.gridLayer = null;
    }
    
    this.mapInstance = null;
    
    logger.debug('GeoHash网格对象已销毁');
  }
} 