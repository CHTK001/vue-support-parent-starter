/**
 * H3蜂窝网格图层实现 (简化版)
 * 用于在Leaflet地图上显示H3蜂窝网格
 */
import type { Map as LeafletMap } from 'leaflet';
import { warn, info, error } from '@repo/utils';
// 移除h3-js依赖
// import * as h3 from 'h3-js';

// 类型安全的方式获取Leaflet实例
declare const L: any;

/**
 * H3蜂窝网格配置选项
 */
export interface H3GridOptions {
  // H3精度级别(0-15)，默认为7
  resolution?: number;
  // 网格线颜色
  color?: string;
  // 网格线宽度
  weight?: number;
  // 网格填充颜色
  fillColor?: string;
  // 网格填充透明度
  fillOpacity?: number;
  // 是否显示H3编码
  showCode?: boolean;
  // 编码文字颜色
  codeColor?: string;
  // 编码文字大小
  codeSize?: number;
  // 是否启用网格交互(点击事件)
  interactive?: boolean;
  // 点击事件回调
  onH3Click?: (h3Index: string) => void;
  // 自定义样式回调函数
  styleCallback?: (h3Index: string) => {
    color?: string;
    weight?: number;
    fillColor?: string;
    fillOpacity?: number;
  };
  // 是否使用随机颜色
  useRandomColors?: boolean;
}

/**
 * H3蜂窝网格图层 (简化版)
 */
export class GridLayerH3 {
  private map: LeafletMap;
  private options: H3GridOptions;
  private h3Layer: any; // Leaflet FeatureGroup
  private visible: boolean = false;
  private hexagons: Map<string, any> = new Map(); // 存储已创建的六边形
  private labels: Map<string, any> = new Map(); // 存储已创建的标签
  private highlightedH3Index: string | null = null;
  private highlightLayer: any = null;
  private gridSize: number = 0.02; // 默认网格大小
  
  /**
   * 构造函数
   * @param map Leaflet地图实例
   * @param options 配置选项
   */
  constructor(map: LeafletMap, options?: H3GridOptions) {
    this.map = map;
    this.options = {
      resolution: 7, // 默认精度级别7
      color: '#4a90e2',
      weight: 1.2,
      fillColor: '#6aaef7',
      fillOpacity: 0.12,
      showCode: true,
      codeColor: '#2c3e50',
      codeSize: 11,
      interactive: true,
      useRandomColors: false,
      ...options
    };
    
    // 根据分辨率调整网格大小
    this.adjustGridSizeByResolution(this.options.resolution || 7);
    
    // 创建图层组
    this.h3Layer = L.featureGroup();
    
    // 注册地图事件
    this.map.on('moveend', this.updateGrid, this);
    this.map.on('zoomend', this.updateGrid, this);
    
    info("H3蜂窝网格已初始化，默认精度为7级");
  }
  
  /**
   * 根据分辨率调整网格大小
   * @param resolution 分辨率级别
   */
  private adjustGridSizeByResolution(resolution: number): void {
    // 分辨率越高，网格越小
    // 这是一个简化的计算，实际H3的分辨率计算更复杂
    this.gridSize = 0.1 / Math.pow(2, resolution - 4);
  }
  
  /**
   * 更新网格
   */
  private updateGrid(): void {
    if (!this.visible) return;
    
    // 清空现有网格
    this.clearGrid();
    
    // 获取当前地图范围
    const bounds = this.map.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();
    
    try {
      // 生成覆盖区域的六边形网格
      const h3Indexes = this.generateHexGrid(north, south, east, west);
      
      // 为每个H3索引创建六边形
      h3Indexes.forEach(h3Index => {
        this.createHexagon(h3Index);
      });
      
      // 如果有被高亮的H3索引，重新高亮
      if (this.highlightedH3Index && this.hexagons.has(this.highlightedH3Index)) {
        this.highlightH3Cell(this.highlightedH3Index);
      }
    } catch (e) {
      error('创建H3网格失败:', e);
    }
  }
  
  /**
   * 生成六边形网格
   * @param north 北边界
   * @param south 南边界
   * @param east 东边界
   * @param west 西边界
   * @returns 六边形索引数组
   */
  private generateHexGrid(north: number, south: number, east: number, west: number): string[] {
    const h3Indexes: string[] = [];
    const gridSize = this.gridSize;
    const sqrt3 = Math.sqrt(3);
    
    // 六边形高度
    const hexHeight = gridSize * 2;
    // 六边形宽度
    const hexWidth = sqrt3 * gridSize;
    
    // 计算区域内需要的六边形行列数
    const rows = Math.ceil((north - south) / (hexHeight * 0.75));
    const cols = Math.ceil((east - west) / hexWidth);
    
    // 生成六边形网格
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 计算六边形中心点
        let centerLat = north - row * (hexHeight * 0.75);
        let centerLng = west + col * hexWidth + (row % 2 === 0 ? 0 : hexWidth / 2);
        
        // 检查中心点是否在范围内
        if (centerLat <= north && centerLat >= south && centerLng >= west && centerLng <= east) {
          // 生成唯一的ID
          const h3Index = `h3_${this.options.resolution}_${row}_${col}`;
          
          // 保存中心点和边界点
          this.hexCoords.set(h3Index, {
            center: [centerLat, centerLng],
            boundary: this.generateHexBoundary(centerLat, centerLng, gridSize)
          });
          
          h3Indexes.push(h3Index);
        }
      }
    }
    
    return h3Indexes;
  }
  
  // 存储六边形的坐标信息
  private hexCoords: Map<string, {
    center: [number, number],
    boundary: [number, number][]
  }> = new Map();
  
  /**
   * 生成六边形边界坐标
   * @param centerLat 中心纬度
   * @param centerLng 中心经度
   * @param size 网格大小
   * @returns 六边形边界坐标数组
   */
  private generateHexBoundary(centerLat: number, centerLng: number, size: number): [number, number][] {
    const sqrt3 = Math.sqrt(3);
    const boundary: [number, number][] = [];
    
    // 六边形六个顶点的角度
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerLng + size * Math.sin(angle);
      const y = centerLat + size * Math.cos(angle);
      boundary.push([y, x]);
    }
    
    // 闭合六边形
    boundary.push(boundary[0]);
    
    return boundary;
  }
  
  /**
   * 创建单个六边形
   * @param h3Index H3索引
   */
  private createHexagon(h3Index: string): void {
    try {
      // 获取六边形坐标信息
      const hexCoord = this.hexCoords.get(h3Index);
      if (!hexCoord) return;
      
      // 获取六边形边界坐标
      const boundary = hexCoord.boundary;
      
      // 确定样式
      let style: any = {
        color: this.options.color,
        weight: this.options.weight,
        fillColor: this.options.useRandomColors ? this.getColorFromH3Index(h3Index) : this.options.fillColor,
        fillOpacity: this.options.fillOpacity,
        className: 'h3-hexagon'
      };
      
      // 如果有自定义样式回调，合并样式
      if (this.options.styleCallback) {
        const customStyle = this.options.styleCallback(h3Index);
        if (customStyle) {
          style = { ...style, ...customStyle };
        }
      }
      
      // 创建多边形
      const polygon = L.polygon(boundary, style);
      
      // 存储索引
      polygon.h3Index = h3Index;
      
      // 如果启用了交互，添加点击事件
      if (this.options.interactive) {
        polygon.on('click', (e: any) => {
          // 阻止事件冒泡
          L.DomEvent.stopPropagation(e);
          
          // 高亮显示
          this.highlightH3Cell(h3Index);
          
          // 调用回调
          if (this.options.onH3Click) {
            this.options.onH3Click(h3Index);
          }
        });
      }
      
      // 添加到图层
      polygon.addTo(this.h3Layer);
      
      // 存储多边形引用
      this.hexagons.set(h3Index, polygon);
      
      // 如果显示编码，创建标签
      if (this.options.showCode) {
        this.createLabel(h3Index);
      }
    } catch (e) {
      warn(`创建六边形失败: ${h3Index}`, e);
    }
  }
  
  /**
   * 创建标签
   * @param h3Index H3索引
   */
  private createLabel(h3Index: string): void {
    try {
      // 获取六边形中心点
      const hexCoord = this.hexCoords.get(h3Index);
      if (!hexCoord) return;
      
      const center = hexCoord.center;
      
      // 截断过长的H3索引显示
      const displayText = h3Index.length > 8 ? h3Index.substring(0, 8) + '...' : h3Index;
      
      // 创建标记
      const label = L.marker([center[0], center[1]], {
        icon: L.divIcon({
          className: 'h3-label',
          html: `<div style="background-color: rgba(255,255,255,0.75); 
                            color: ${this.options.codeColor}; 
                            padding: 2px 5px; 
                            border-radius: 3px; 
                            font-size: ${this.options.codeSize}px; 
                            font-weight: bold; 
                            font-family: 'Courier New', monospace;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            max-width: 100px;"
                  title="${h3Index}">
                  ${displayText}
                </div>`,
          iconSize: [null, null]
        })
      });
      
      // 添加到图层
      label.addTo(this.h3Layer);
      
      // 存储标签引用
      this.labels.set(h3Index, label);
    } catch (e) {
      warn(`创建标签失败: ${h3Index}`, e);
    }
  }
  
  /**
   * 清空网格
   */
  private clearGrid(): void {
    this.h3Layer.clearLayers();
    this.hexagons.clear();
    this.labels.clear();
    this.hexCoords.clear();
    this.highlightedH3Index = null;
    this.highlightLayer = null;
  }
  
  /**
   * 从H3索引生成颜色
   * @param h3Index H3索引
   * @returns 颜色十六进制字符串
   */
  private getColorFromH3Index(h3Index: string): string {
    // 使用h3Index的哈希值生成颜色
    let hash = 0;
    for (let i = 0; i < h3Index.length; i++) {
      hash = h3Index.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 转换为HSL颜色（保持亮度和饱和度一致，只改变色相）
    const h = ((hash % 360) + 360) % 360; // 0-359的色相值
    const s = 70; // 固定饱和度
    const l = 60; // 固定亮度
    
    return this.hslToHex(h, s, l);
  }
  
  /**
   * 将HSL颜色转换为HEX颜色
   * @param h 色相 (0-360)
   * @param s 饱和度 (0-100)
   * @param l 亮度 (0-100)
   * @returns 十六进制颜色字符串
   */
  private hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // 灰度
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  /**
   * 高亮显示H3单元格
   * @param h3Index H3索引
   */
  public highlightH3Cell(h3Index: string): void {
    try {
      // 清除之前的高亮
      this.clearHighlight();
      
      // 保存当前高亮的H3索引
      this.highlightedH3Index = h3Index;
      
      // 获取对应的六边形
      const hexagon = this.hexagons.get(h3Index);
      
      if (hexagon) {
        // 修改现有六边形的样式
        hexagon.setStyle({
          color: '#ff4757',
          weight: 3,
          fillColor: '#ff6b81',
          fillOpacity: 0.3
        });
        
        // 将高亮的六边形显示在最前
        if (hexagon.bringToFront) {
          hexagon.bringToFront();
        }
        
        // 获取标签并修改
        const label = this.labels.get(h3Index);
        if (label) {
          // 移除旧标签
          this.h3Layer.removeLayer(label);
          
          // 获取中心点
          const hexCoord = this.hexCoords.get(h3Index);
          if (!hexCoord) return;
          
          const center = hexCoord.center;
          
          // 创建高亮标签
          const highlightLabel = L.marker([center[0], center[1]], {
            icon: L.divIcon({
              className: 'h3-highlight-label',
              html: `<div style="background-color: rgba(255,255,255,0.9); 
                                color: #ff4757; 
                                padding: 5px 8px; 
                                border-radius: 4px; 
                                font-weight: bold; 
                                box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                        ${h3Index}
                      </div>`,
              iconSize: [null, null]
            }),
            zIndexOffset: 1000 // 确保显示在最上层
          });
          
          // 添加到图层
          highlightLabel.addTo(this.h3Layer);
          
          // 保存为高亮图层
          this.highlightLayer = highlightLabel;
        }
      } else {
        // 如果没有找到现有的六边形，创建新的高亮六边形
        // 获取六边形边界坐标
        const hexCoord = this.hexCoords.get(h3Index);
        if (!hexCoord) return;
        
        const boundary = hexCoord.boundary;
        
        // 创建多边形
        const polygon = L.polygon(boundary, {
          color: '#ff4757',
          weight: 3,
          opacity: 0.8,
          fillColor: '#ff6b81',
          fillOpacity: 0.3,
          className: 'h3-highlight'
        }).addTo(this.h3Layer);
        
        // 保存高亮图层
        this.highlightLayer = polygon;
        
        // 如果显示编码，添加标签
        if (this.options.showCode) {
          // 获取中心点
          const center = hexCoord.center;
          
          // 创建标记
          const label = L.marker([center[0], center[1]], {
            icon: L.divIcon({
              className: 'h3-highlight-label',
              html: `<div style="background-color: rgba(255,255,255,0.9); 
                               color: #ff4757; 
                               padding: 5px 8px; 
                               border-radius: 4px; 
                               font-weight: bold; 
                               box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                     ${h3Index}
                   </div>`,
              iconSize: [null, null]
            }),
            zIndexOffset: 1000
          }).addTo(this.h3Layer);
        }
      }
    } catch (e) {
      error(`高亮H3单元格失败: ${h3Index}`, e);
    }
  }
  
  /**
   * 清除高亮显示
   */
  public clearHighlight(): void {
    if (this.highlightedH3Index) {
      // 恢复原来的样式
      const hexagon = this.hexagons.get(this.highlightedH3Index);
      if (hexagon) {
        let style: any = {
          color: this.options.color,
          weight: this.options.weight,
          fillColor: this.options.useRandomColors ? 
            this.getColorFromH3Index(this.highlightedH3Index) : this.options.fillColor,
          fillOpacity: this.options.fillOpacity
        };
        
        // 如果有自定义样式回调，合并样式
        if (this.options.styleCallback) {
          const customStyle = this.options.styleCallback(this.highlightedH3Index);
          if (customStyle) {
            style = { ...style, ...customStyle };
          }
        }
        
        hexagon.setStyle(style);
      }
    }
    
    // 移除高亮图层
    if (this.highlightLayer) {
      this.h3Layer.removeLayer(this.highlightLayer);
      this.highlightLayer = null;
    }
    
    this.highlightedH3Index = null;
  }
  
  /**
   * 显示网格
   */
  public show(): void {
    if (this.visible) return;
    
    // 添加图层到地图
    this.h3Layer.addTo(this.map);
    this.visible = true;
    
    // 更新网格
    this.updateGrid();
    
    info('H3蜂窝网格已显示');
  }
  
  /**
   * 隐藏网格
   */
  public hide(): void {
    if (!this.visible) return;
    
    // 从地图移除图层
    this.map.removeLayer(this.h3Layer);
    this.visible = false;
    
    // 清空网格
    this.clearGrid();
    
    info('H3蜂窝网格已隐藏');
  }
  
  /**
   * 切换网格显示状态
   */
  public toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * 获取网格显示状态
   */
  public isVisible(): boolean {
    return this.visible;
  }
  
  /**
   * 设置分辨率
   * @param resolution 新的分辨率值
   */
  public setResolution(resolution: number): void {
    if (resolution < 0 || resolution > 15) {
      warn(`无效的H3分辨率: ${resolution}，应该在0-15之间`);
      return;
    }
    
    this.options.resolution = resolution;
    this.adjustGridSizeByResolution(resolution);
    
    if (this.visible) {
      this.updateGrid();
    }
    
    info(`H3分辨率已更新为: ${resolution}`);
  }
} 