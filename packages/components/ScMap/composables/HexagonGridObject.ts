/**
 * 六边形网格对象
 * @description 管理六边形网格的显示和隐藏
 */
import L from 'leaflet';
import logger from './LogObject';

// 六边形网格配置
export interface HexagonGridConfig {
  size?: number;         // 网格大小（米）
  color?: string;        // 边框颜色
  weight?: number;       // 边框宽度
  opacity?: number;      // 不透明度
  fillColor?: string;    // 填充颜色
  fillOpacity?: number;  // 填充不透明度
}

export class HexagonGridObject {
  private mapInstance: L.Map;
  private hexagonLayer: L.LayerGroup;
  private hexagons: L.Polygon[] = [];
  private config: HexagonGridConfig = {
    size: 1000,           // 默认1000米
    color: '#3388ff',
    weight: 1,
    opacity: 0.8,
    fillColor: '#3388ff',
    fillOpacity: 0.1
  };
  private visible: boolean = false;

  /**
   * 构造函数
   * @param mapInstance Leaflet地图实例
   * @param config 六边形网格配置
   */
  constructor(mapInstance: L.Map, config?: HexagonGridConfig) {
    this.mapInstance = mapInstance;
    
    // 合并配置
    if (config) {
      this.config = {
        ...this.config,
        ...config
      };
    }
    
    // 创建图层组
    this.hexagonLayer = L.layerGroup();
    
    // 绑定地图移动结束事件，用于更新网格
    this.mapInstance.on('moveend', this.updateGrid.bind(this));
    this.mapInstance.on('zoomend', this.updateGrid.bind(this));
    
    logger.debug('HexagonGridObject已初始化');
  }

  /**
   * 设置配置
   * @param config 六边形网格配置
   */
  public setConfig(config: HexagonGridConfig): void {
    // 合并配置
    this.config = {
      ...this.config,
      ...config
    };
    
    // 如果当前可见，则更新网格
    if (this.visible) {
      this.updateGrid();
    }
    
    logger.debug('六边形网格配置已更新', config);
  }

  /**
   * 显示网格
   * @returns 是否显示成功
   */
  public show(): boolean {
    if (this.visible) {
      return true;
    }
    
    try {
      // 创建网格
      this.createGrid();
      
      // 添加到地图
      this.hexagonLayer.addTo(this.mapInstance);
      
      // 标记为可见
      this.visible = true;
      
      logger.debug('六边形网格已显示');
      return true;
    } catch (error) {
      logger.error('显示六边形网格失败:', error);
      return false;
    }
  }

  /**
   * 隐藏网格
   * @returns 是否隐藏成功
   */
  public hide(): boolean {
    if (!this.visible) {
      return true;
    }
    
    try {
      // 从地图移除
      this.hexagonLayer.removeFrom(this.mapInstance);
      
      // 标记为不可见
      this.visible = false;
      
      logger.debug('六边形网格已隐藏');
      return true;
    } catch (error) {
      logger.error('隐藏六边形网格失败:', error);
      return false;
    }
  }

  /**
   * 更新网格
   */
  private updateGrid(): void {
    if (!this.visible) {
      return;
    }
    
    // 清空网格
    this.hexagonLayer.clearLayers();
    this.hexagons = [];
    
    // 重新创建网格
    this.createGrid();
  }

  /**
   * 创建六边形网格
   */
  private createGrid(): void {
    // 获取地图边界
    const bounds = this.mapInstance.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    
    // 计算网格参数
    const size = this.config.size || 1000;  // 米
    const height = size * Math.sqrt(3);
    
    // 计算网格覆盖范围（扩展一点以覆盖屏幕边缘）
    const sw = L.latLng(southWest.lat - 0.05, southWest.lng - 0.05);
    const ne = L.latLng(northEast.lat + 0.05, northEast.lng + 0.05);
    
    // 计算起始点
    const startLat = sw.lat;
    const startLng = sw.lng;
    
    // 循环创建六边形
    const rows = Math.ceil((ne.lat - sw.lat) * 111000 / (height * 0.75)) + 1;
    const cols = Math.ceil((ne.lng - sw.lng) * 111000 / size) + 1;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 计算中心点
        const centerLat = startLat + row * (height * 0.75) / 111000;
        const centerLng = startLng + col * size / (111000 * Math.cos(centerLat * Math.PI / 180));
        
        // 偶数行偏移
        const offset = row % 2 === 0 ? 0 : size / (2 * 111000 * Math.cos(centerLat * Math.PI / 180));
        const centerLngWithOffset = centerLng + offset;
        
        // 创建六边形
        const hexagon = this.createHexagon(centerLat, centerLngWithOffset, size);
        hexagon.addTo(this.hexagonLayer);
        this.hexagons.push(hexagon);
      }
    }
    
    logger.debug(`创建了 ${this.hexagons.length} 个六边形网格`);
  }

  /**
   * 创建单个六边形
   * @param centerLat 中心点纬度
   * @param centerLng 中心点经度
   * @param size 大小（米）
   * @returns 六边形多边形
   */
  private createHexagon(centerLat: number, centerLng: number, size: number): L.Polygon {
    const center = L.latLng(centerLat, centerLng);
    const vertices: L.LatLng[] = [];
    
    // 计算六边形顶点
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const dx = size * Math.cos(angle) / (111000 * Math.cos(centerLat * Math.PI / 180));
      const dy = size * Math.sin(angle) / 111000;
      vertices.push(L.latLng(centerLat + dy, centerLng + dx));
    }
    
    // 创建六边形
    return L.polygon(vertices, {
      color: this.config.color || '#3388ff',
      weight: this.config.weight || 1,
      opacity: this.config.opacity || 0.8,
      fillColor: this.config.fillColor || '#3388ff',
      fillOpacity: this.config.fillOpacity || 0.1
    });
  }

  /**
   * 销毁对象，清理资源
   */
  public destroy(): void {
    // 解除事件绑定
    this.mapInstance.off('moveend', this.updateGrid);
    this.mapInstance.off('zoomend', this.updateGrid);
    
    // 清空图层
    this.hexagonLayer.clearLayers();
    
    // 从地图移除
    if (this.visible) {
      this.hexagonLayer.removeFrom(this.mapInstance);
    }
    
    this.hexagons = [];
    this.visible = false;
    
    logger.debug('HexagonGridObject已销毁');
  }
} 