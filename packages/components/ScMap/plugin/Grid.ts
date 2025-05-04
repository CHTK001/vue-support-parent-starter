/**
 * 地图网格插件
 * 基于地球空间网格编码规则(GB/T 40087-2021)划分网格
 */
import type { Map as LeafletMap, LatLng, LatLngBounds, Layer, LayerGroup, Rectangle, Polygon } from 'leaflet';
import { warn, info } from '@repo/utils';

/**
 * 网格配置选项
 */
export interface GridOptions {
  // 网格级别，默认为3
  level?: number;
  // 网格颜色
  color?: string;
  // 网格线宽
  weight?: number;
  // 网格线透明度
  opacity?: number;
  // 网格填充颜色
  fillColor?: string;
  // 网格填充透明度
  fillOpacity?: number;
  // 是否显示网格编码
  showCode?: boolean;
  // 网格编码文字颜色
  codeColor?: string;
  // 网格编码文字大小
  codeSize?: number;
  // 是否启用网格交互（可点击）
  interactive?: boolean;
  // 网格类型：'rect'矩形网格、'hex'蜂窝网格
  gridType?: 'rect' | 'hex';
}

/**
 * 地球空间网格编码规则(GB/T 40087-2021)的网格实现
 */
export class Grid {
  private map: LeafletMap;
  private options: GridOptions;
  private gridLayer: LayerGroup | null = null;
  private visible: boolean = false;
  private L: any;

  /**
   * 构造函数
   * @param map Leaflet地图实例
   * @param options 网格配置选项
   */
  constructor(map: LeafletMap, options: GridOptions = {}) {
    this.map = map;
    this.options = {
      level: 3,
      color: '#3388ff',
      weight: 1,
      opacity: 0.6,
      fillColor: '#3388ff',
      fillOpacity: 0.1,
      showCode: true,
      codeColor: '#333',
      codeSize: 12,
      interactive: true,
      gridType: 'rect',
      ...options
    };

    // 延迟获取 L
    this.L = (window as any).L || null;
    
    // 创建网格图层
    this.createGridLayer();
  }

  /**
   * 创建网格图层
   */
  private createGridLayer(): void {
    if (!this.L) {
      console.warn('Leaflet not available yet');
      return;
    }

    // 创建图层组
    this.gridLayer = this.L.layerGroup();
    
    // 初始隐藏
    this.hide();
  }

  /**
   * 绘制网格
   */
  private drawGrid(): void {
    if (!this.L || !this.gridLayer) return;
    
    // 清除现有网格
    this.gridLayer.clearLayers();
    
    // 获取当前地图可视区域
    const bounds = this.map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    
    if (this.options.gridType === 'hex') {
      this.drawHexGrid(southWest, northEast);
    } else {
      this.drawRectGrid(southWest, northEast);
    }
  }

  /**
   * 绘制矩形网格
   * @param southWest 西南角坐标
   * @param northEast 东北角坐标
   */
  private drawRectGrid(southWest: LatLng, northEast: LatLng): void {
    if (!this.L || !this.gridLayer) return;
    
    const level = this.options.level || 3;
    
    // 根据级别计算网格大小
    const latStep = 180 / Math.pow(2, level);
    const lngStep = 360 / Math.pow(2, level);
    
    // 确保网格范围稍大于可视区域
    const minLat = Math.floor(southWest.lat / latStep) * latStep;
    const maxLat = Math.ceil(northEast.lat / latStep) * latStep;
    const minLng = Math.floor(southWest.lng / lngStep) * lngStep;
    const maxLng = Math.ceil(northEast.lng / lngStep) * lngStep;
    
    // 绘制网格
    for (let lat = minLat; lat < maxLat; lat += latStep) {
      for (let lng = minLng; lng < maxLng; lng += lngStep) {
        const bounds = this.L.latLngBounds(
          this.L.latLng(lat, lng),
          this.L.latLng(lat + latStep, lng + lngStep)
        );
        
        // 计算网格编码
        const code = this.calculateGridCode(lat, lng, level);
        
        // 创建矩形网格
        const rect = this.L.rectangle(bounds, {
          color: this.options.color,
          weight: this.options.weight,
          opacity: this.options.opacity,
          fillColor: this.options.fillColor,
          fillOpacity: this.options.fillOpacity,
          interactive: this.options.interactive
        });
        
        rect.addTo(this.gridLayer);
        
        // 添加网格编码文本
        if (this.options.showCode) {
          const center = bounds.getCenter();
          
          const tooltip = this.L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'grid-code-tooltip',
            opacity: 0.9
          });
          
          tooltip.setLatLng(center);
          tooltip.setContent(`<div style="color:${this.options.codeColor};font-size:${this.options.codeSize}px;">${code}</div>`);
          tooltip.addTo(this.gridLayer);
        }
      }
    }
  }

  /**
   * 绘制六边形网格
   * @param southWest 西南角坐标
   * @param northEast 东北角坐标
   */
  private drawHexGrid(southWest: LatLng, northEast: LatLng): void {
    if (!this.L || !this.gridLayer) return;
    
    const level = this.options.level || 3;
    
    // 根据级别计算六边形大小
    // 因为六边形覆盖效率比矩形高，可以减小步长
    const latStep = 180 / Math.pow(2, level) * 0.866; // 高度比宽度小，乘以sin(60°)
    const lngStep = 360 / Math.pow(2, level) * 0.75; // 重叠部分
    
    // 确保网格范围稍大于可视区域
    const minLat = Math.floor(southWest.lat / latStep) * latStep;
    const maxLat = Math.ceil(northEast.lat / latStep) * latStep;
    const minLng = Math.floor(southWest.lng / lngStep) * lngStep;
    const maxLng = Math.ceil(northEast.lng / lngStep) * lngStep;
    
    let row = 0;
    // 绘制网格
    for (let lat = minLat; lat < maxLat; lat += latStep) {
      let col = 0;
      const rowOffset = (row % 2) * (lngStep / 2); // 奇数行偏移半个单位
      
      for (let lng = minLng; lng < maxLng; lng += lngStep) {
        const center = this.L.latLng(lat, lng + rowOffset);
        
        // 创建六边形的顶点
        const vertices = this.calculateHexVertices(center, latStep / 2, lngStep / 1.5);
        
        // 创建六边形网格
        const hex = this.L.polygon(vertices, {
          color: this.options.color,
          weight: this.options.weight,
          opacity: this.options.opacity,
          fillColor: this.options.fillColor,
          fillOpacity: this.options.fillOpacity,
          interactive: this.options.interactive
        });
        
        hex.addTo(this.gridLayer);
        
        // 添加网格编码文本
        if (this.options.showCode) {
          // 为六边形网格生成编码
          const code = this.calculateHexGridCode(row, col, level);
          
          const tooltip = this.L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'grid-code-tooltip',
            opacity: 0.9
          });
          
          tooltip.setLatLng(center);
          tooltip.setContent(`<div style="color:${this.options.codeColor};font-size:${this.options.codeSize}px;">${code}</div>`);
          tooltip.addTo(this.gridLayer);
        }
        
        col++;
      }
      row++;
    }
  }

  /**
   * 计算六边形顶点
   * @param center 中心点
   * @param latRadius 纬度半径
   * @param lngRadius 经度半径
   * @returns 六边形顶点数组
   */
  private calculateHexVertices(center: LatLng, latRadius: number, lngRadius: number): LatLng[] {
    const vertices: LatLng[] = [];
    
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const lat = center.lat + latRadius * Math.sin(angle);
      const lng = center.lng + lngRadius * Math.cos(angle);
      vertices.push(this.L.latLng(lat, lng));
    }
    
    return vertices;
  }

  /**
   * 根据地球空间网格编码规则(GB/T 40087-2021)计算矩形网格编码
   * @param lat 纬度
   * @param lng 经度
   * @param level 网格级别
   * @returns 网格编码
   */
  private calculateGridCode(lat: number, lng: number, level: number): string {
    // 将全球坐标归一化到 0~1 范围
    const normalizedLat = (90 - lat) / 180;
    const normalizedLng = (lng + 180) / 360;
    
    // 基于四叉树编码方式生成网格编码
    let code = '';
    
    // 递归划分空间，生成网格编码
    for (let i = 0; i < level; i++) {
      let nLat = normalizedLat;
      let nLng = normalizedLng;
      
      // 根据当前级别计算区域
      for (let j = 0; j < i; j++) {
        nLat = (nLat * 2) % 1;
        nLng = (nLng * 2) % 1;
      }
      
      const latBit = Math.floor(nLat * 2) % 2;
      const lngBit = Math.floor(nLng * 2) % 2;
      
      // 四叉树编码：00=左上，01=右上，10=左下，11=右下
      const quadKey = (latBit << 1) + lngBit;
      code += quadKey;
    }
    
    return code;
  }

  /**
   * 计算六边形网格编码
   * @param row 行索引
   * @param col 列索引
   * @param level 网格级别
   * @returns 网格编码
   */
  private calculateHexGridCode(row: number, col: number, level: number): string {
    // 对于六边形网格，使用行列索引的组合作为编码
    // 为了与GB/T 40087-2021兼容，将行列索引转换为类似的编码
    const base = Math.pow(10, level - 1);
    const encodedRow = Math.abs(row) % base;
    const encodedCol = Math.abs(col) % base;
    
    // 组合成编码，格式为"H-行-列"
    return `H-${encodedRow}-${encodedCol}`;
  }

  /**
   * 显示网格
   */
  public show(): void {
    if (!this.L || !this.gridLayer) {
      this.createGridLayer();
      if (!this.gridLayer) return;
    }
    
    this.visible = true;
    this.drawGrid();
    this.gridLayer.addTo(this.map);
    
    // 添加地图移动事件监听，重新绘制网格
    this.map.on('moveend', this.handleMapMoveEnd);
    this.map.on('zoomend', this.handleMapZoomEnd);
  }

  /**
   * 隐藏网格
   */
  public hide(): void {
    if (!this.L || !this.gridLayer) return;
    
    this.visible = false;
    if (this.map.hasLayer(this.gridLayer)) {
      this.map.removeLayer(this.gridLayer);
    }
    
    // 移除地图事件监听
    this.map.off('moveend', this.handleMapMoveEnd);
    this.map.off('zoomend', this.handleMapZoomEnd);
  }

  /**
   * 切换网格显示/隐藏
   */
  public toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 地图移动结束事件处理
   */
  private handleMapMoveEnd = (): void => {
    if (this.visible) {
      this.drawGrid();
    }
  };

  /**
   * 地图缩放结束事件处理
   */
  private handleMapZoomEnd = (): void => {
    if (this.visible) {
      this.drawGrid();
    }
  };

  /**
   * 更新网格配置
   * @param options 新的网格配置
   */
  public updateOptions(options: Partial<GridOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (this.visible) {
      this.drawGrid();
    }
  }

  /**
   * 设置网格级别
   * @param level 网格级别
   */
  public setLevel(level: number): void {
    this.options.level = level;
    
    if (this.visible) {
      this.drawGrid();
    }
  }

  /**
   * 获取当前网格类型
   * @returns 网格类型
   */
  public getType(): 'rect' | 'hex' {
    return this.options.gridType || 'rect';
  }

  /**
   * 设置网格类型
   * @param type 网格类型
   */
  public setType(type: 'rect' | 'hex'): void {
    this.options.gridType = type;
    
    if (this.visible) {
      this.drawGrid();
    }
  }

  /**
   * 获取网格是否可见
   * @returns 网格是否可见
   */
  public isVisible(): boolean {
    return this.visible;
  }

  /**
   * 销毁网格工具
   */
  public destroy(): void {
    this.hide();
    this.gridLayer = null;
  }
} 