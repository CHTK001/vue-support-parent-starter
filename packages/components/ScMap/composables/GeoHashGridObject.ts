/**
 * Geohash网格对象
 * @description 管理地图Geohash网格显示
 */
import L from 'leaflet';
import logger from './LogObject';
import ngeohash from 'ngeohash';

/**
 * Geohash网格配置选项
 */
export interface GeohashGridOptions {
  // Geohash精度级别(1-12)，默认为6
  level?: number;
  // 网格线颜色
  color?: string;
  // 网格线宽度
  weight?: number;
  // 网格线透明度
  opacity?: number;
  // 网格填充颜色
  fillColor?: string;
  // 网格填充透明度
  fillOpacity?: number;
  // 网格背景透明度，控制整体透明度
  gridOpacity?: number;
  // 是否显示Geohash编码
  showCode?: boolean;
  // 编码文字颜色
  codeColor?: string;
  // 编码文字大小
  codeSize?: number;
  // 是否启用网格交互(点击事件)
  interactive?: boolean;
  // 网格类型: 'rect'矩形、'hex'六边形
  gridType?: 'rect' | 'hex';
  // 是否随地图缩放自动调整网格精度
  autoAdjustLevel?: boolean;
  // 是否实时更新网格
  realtimeUpdate?: boolean;
  // 更新间隔(毫秒)
  updateInterval?: number;
  // 是否使用Canvas渲染(提高性能)
  useCanvas?: boolean;
  // 是否默认显示网格边框(白色)
  showGridBorder?: boolean;
  // 网格边框颜色
  gridBorderColor?: string;
  // 网格边框宽度
  gridBorderWidth?: number;
  // 自定义样式回调函数
  styleCallback?: (geohash: string, level: number) => {
    color?: string;
    weight?: number;
    opacity?: number;
    fillColor?: string;
    fillOpacity?: number;
  };
  // 数据刷新事件回调
  onDataRefresh?: (visibleGeohashes: string[]) => void;
  // 点击事件回调
  onGeohashClick?: (geohash: string, bounds: any, center: any) => void;
  // GridLayer原生选项
  tileSize?: number;
}

/**
 * 默认Geohash网格配置
 */
export const DEFAULT_GEOHASH_GRID_OPTIONS: GeohashGridOptions = {
  level: 8,
  color: '#4a90e2',
  weight: 1.2,
  opacity: 0.7,
  fillColor: '#6aaef7',
  fillOpacity: 0.12,
  gridOpacity: 0.35,
  showCode: true,
  codeColor: '#2c3e50',
  codeSize: 12,
  interactive: true,
  gridType: 'rect',
  autoAdjustLevel: true,
  realtimeUpdate: true,
  updateInterval: 200,
  useCanvas: false,
  showGridBorder: true,
  gridBorderColor: '#f8f9fa',
  gridBorderWidth: 1.2,
  tileSize: 256
};

/**
 * Geohash网格对象类
 */
export class GeohashGridObject {
  // 地图实例
  private mapInstance: L.Map | null = null;
  // 网格图层
  private gridLayer: any = null;
  // 配置
  private options: GeohashGridOptions = DEFAULT_GEOHASH_GRID_OPTIONS;
  // 是否可见
  private visible: boolean = false;
  // 更新计时器
  private updateTimer: number | null = null;
  // Canvas上下文集合
  private canvasContexts: Map<string, CanvasRenderingContext2D> = new Map();
  // 高亮的Geohash
  private highlightedGeohash: string | null = null;
  // 高亮图层
  private highlightLayer: any = null;
  // 高亮标签
  private highlightLabel: any = null;
  // 当前缩放级别
  private currentZoom: number = 0;
  // 初始化尝试次数
  private initAttempts: number = 0;
  // 最大初始化尝试次数
  private maxInitAttempts: number = 3;
  // 动画帧ID
  private _zoomAnimationFrame: number | null = null;
  // 事件监听器
  private eventListeners: Array<{ target: any, type: string, handler: any }> = [];

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param options 配置参数
   */
  constructor(mapInstance: L.Map | null = null, options?: Partial<GeohashGridOptions>) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }

    if (options) {
      this.setOptions(options);
    }

    logger.debug('[GeohashGrid] Geohash网格对象已创建');
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: L.Map): void {
    if (!mapInstance) {
      logger.error('[GeohashGrid] 无效的地图实例');
      return;
    }

    this.mapInstance = mapInstance;
    this.currentZoom = this.mapInstance.getZoom();
    this.initGridLayer();
    this.setupMapListeners();
    logger.debug('[GeohashGrid] 地图实例已设置');
  }

  /**
   * 设置配置选项
   * @param options 配置选项
   */
  public setOptions(options: Partial<GeohashGridOptions>): void {
    this.options = { ...this.options, ...options };
    
    // 如果已经初始化了网格图层，则需要重新初始化
    if (this.gridLayer && this.visible) {
      this.hide();
      this.initGridLayer();
      this.show();
    }
    
    logger.debug('[GeohashGrid] 配置选项已更新');
  }

  /**
   * 初始化网格图层
   * @private
   */
  private initGridLayer(): void {
    if (!this.mapInstance) {
      logger.error('[GeohashGrid] 无法初始化网格图层：地图实例未设置');
      return;
    }

    try {
      // 保存this引用
      const self = this;
      
      // 定义自定义网格图层
      const CustomGridLayer = L.GridLayer.extend({
        // 为每个瓦片创建DOM元素
        createTile: function(coords: any) {
          const tile = L.DomUtil.create('div', 'geohash-tile');
          const size = this.options.tileSize;
          const map = this._map;
          
          // 计算当前瓦片的地理边界
          const nw = map.unproject([coords.x * size, coords.y * size], coords.z);
          const se = map.unproject([(coords.x + 1) * size, (coords.y + 1) * size], coords.z);
          
          // 动态计算精度（根据缩放级别）
          let precision = self.options.level || 8;
          if (self.options.autoAdjustLevel) {
            precision = Math.max(1, Math.min(12, Math.ceil(map.getZoom() / 2)));
          }
          
          // 计算覆盖该区域的GeoHash
          const centerHash = ngeohash.encode(
            (nw.lat + se.lat) / 2, 
            (nw.lng + se.lng) / 2, 
            precision
          );
          
          // 绘制网格
          tile.style.width = tile.style.height = `${size}px`;
          tile.style.border = '1px dashed rgba(0,0,0,0.15)';
          
          // 获取背景颜色
          const backgroundColor = self.getColorFromGeohash(centerHash);
          tile.style.backgroundColor = this.adjustColorOpacity(backgroundColor, self.options.gridOpacity || 0.35);
          
          // 添加过渡效果
          tile.style.transition = 'opacity 0.2s ease-in-out';
          
          // 显示GeoHash值（可选）
          if (self.options.showCode) {
            // 创建标签容器
            const labelContainer = document.createElement('div');
            labelContainer.className = 'geohash-label-container';
            labelContainer.style.position = 'absolute';
            labelContainer.style.top = '0';
            labelContainer.style.left = '0';
            labelContainer.style.width = '100%';
            labelContainer.style.height = '100%';
            labelContainer.style.display = 'flex';
            labelContainer.style.justifyContent = 'center';
            labelContainer.style.alignItems = 'center';
            labelContainer.style.pointerEvents = 'none';
            
            // 创建标签
            const label = document.createElement('div');
            label.className = 'geohash-label';
            label.textContent = centerHash;
            label.style.backgroundColor = 'rgba(255, 255, 255, 0.75)';
            label.style.color = self.options.codeColor || '#2c3e50';
            label.style.padding = '2px 6px';
            label.style.borderRadius = '3px';
            label.style.fontSize = `${self.options.codeSize || 12}px`;
            label.style.fontWeight = 'bold';
            label.style.fontFamily = '"Courier New", monospace';
            label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
            label.style.transition = 'transform 0.2s ease-in-out, opacity 0.2s ease-in-out';
            
            // 添加标签到容器
            labelContainer.appendChild(label);
            
            // 将容器添加到瓦片
            tile.appendChild(labelContainer);
          }
          
          // 在创建后添加一点延迟以实现淡入效果
          setTimeout(() => {
            if (tile.parentNode) {
              tile.style.opacity = '1';
            }
          }, 50);
          
          return tile;
        },
        
        // 调整颜色透明度的辅助方法
        adjustColorOpacity: function(color: string, opacity: number) {
          // 如果颜色已经是rgba格式，则直接调整透明度
          if (color.startsWith('rgba')) {
            return color.replace(/rgba\((.+?),\s*[\d.]+\)/, `rgba($1, ${opacity})`);
          }
          
          // 如果颜色是hex格式，先转换为rgba
          if (color.startsWith('#')) {
            let r = 0, g = 0, b = 0;
            
            if (color.length === 4) {
              r = parseInt(color[1] + color[1], 16);
              g = parseInt(color[2] + color[2], 16);
              b = parseInt(color[3] + color[3], 16);
            } else if (color.length === 7) {
              r = parseInt(color.substring(1, 3), 16);
              g = parseInt(color.substring(3, 5), 16);
              b = parseInt(color.substring(5, 7), 16);
            }
            
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          }
          
          // 默认返回半透明白色
          return `rgba(255, 255, 255, ${opacity})`;
        }
      });
      
      // 配置网格图层选项
      const gridOptions = {
        tileSize: this.options.tileSize || 256,
        opacity: 1,
        zIndex: 300,
        minZoom: 0,
        maxZoom: 22,
        className: 'geohash-grid-layer',
        keepBuffer: 4,
        updateWhenIdle: false,
        updateWhenZooming: false,
        noWrap: false
      };
      
      // 创建网格图层实例
      this.gridLayer = new CustomGridLayer(gridOptions);
      
      // 如果支持交互，添加点击事件
      if (this.options.interactive) {
        this.setupClickHandler();
      }
      
      logger.debug('[GeohashGrid] 网格图层已初始化');
    } catch (e) {
      this.initAttempts++;
      logger.error('[GeohashGrid] 初始化网格图层失败:', e);
      
      // 如果还有尝试次数，延迟重试
      if (this.initAttempts < this.maxInitAttempts) {
        setTimeout(() => {
          logger.info(`[GeohashGrid] 正在重试初始化网格图层 (${this.initAttempts}/${this.maxInitAttempts})...`);
          this.initGridLayer();
        }, 500);
      }
    }
  }

  /**
   * 设置地图事件监听器
   * @private
   */
  private setupMapListeners(): void {
    if (!this.mapInstance) return;
    
    try {
      // 监听缩放结束事件
      const onZoomEnd = () => {
        this.handleZoomChange();
      };
      
      // 监听移动事件
      const onMove = () => {
        this.handleMapMove();
      };
      
      // 添加事件监听
      this.mapInstance.on('zoomend', onZoomEnd);
      
      if (this.options.realtimeUpdate) {
        this.mapInstance.on('move', onMove);
      }
      
      // 保存事件引用，以便后续移除
      this.eventListeners = [
        { target: this.mapInstance, type: 'zoomend', handler: onZoomEnd },
        { target: this.mapInstance, type: 'move', handler: onMove }
      ];
      
      logger.debug('[GeohashGrid] 已设置地图事件监听器');
    } catch (error) {
      logger.error('[GeohashGrid] 设置地图事件监听器失败:', error);
    }
  }

  /**
   * 移除地图事件监听器
   * @private
   */
  private removeMapListeners(): void {
    try {
      // 移除所有事件监听器
      this.eventListeners.forEach(listener => {
        listener.target.off(listener.type, listener.handler);
      });
      
      // 清空监听器列表
      this.eventListeners = [];
      
      logger.debug('[GeohashGrid] 已移除地图事件监听器');
    } catch (error) {
      logger.error('[GeohashGrid] 移除地图事件监听器失败:', error);
    }
  }

  /**
   * 设置点击事件处理器
   * @private
   */
  private setupClickHandler(): void {
    if (!this.mapInstance) return;
    
    try {
      // 点击事件处理
      const handleClick = (e: any) => {
        if (!this.visible || !this.options.interactive) return;
        
        // 获取点击位置的坐标
        const latlng = e.latlng;
        
        // 计算当前缩放级别对应的精度
        let precision = this.options.level || 8;
        if (this.options.autoAdjustLevel) {
          precision = Math.max(1, Math.min(12, Math.ceil(this.mapInstance!.getZoom() / 2)));
        }
        
        // 计算点击位置的geohash
        const geohash = ngeohash.encode(latlng.lat, latlng.lng, precision);
        
        // 解码geohash获取边界
        const bounds = ngeohash.decode_bbox(geohash);
        const southwest = L.latLng(bounds[0], bounds[1]);
        const northeast = L.latLng(bounds[2], bounds[3]);
        const latLngBounds = L.latLngBounds(southwest, northeast);
        
        // 计算中心点
        const center = latLngBounds.getCenter();
        
        // 调用回调函数
        if (this.options.onGeohashClick) {
          this.options.onGeohashClick(geohash, latLngBounds, center);
        }
        
        // 高亮显示点击的网格
        this.highlightGeohash(geohash, latLngBounds);
        
        logger.debug(`[GeohashGrid] 点击了Geohash网格: ${geohash}`);
      };
      
      // 添加点击事件监听
      this.mapInstance.on('click', handleClick);
      
      // 保存事件引用
      this.eventListeners.push({ 
        target: this.mapInstance, 
        type: 'click', 
        handler: handleClick 
      });
      
      logger.debug('[GeohashGrid] 已设置点击事件处理器');
    } catch (error) {
      logger.error('[GeohashGrid] 设置点击事件处理器失败:', error);
    }
  }

  /**
   * 高亮显示指定的Geohash网格
   * @param geohash Geohash编码
   * @param bounds 网格边界
   * @private
   */
  private highlightGeohash(geohash: string, bounds: any): void {
    if (!this.mapInstance) return;
    
    try {
      // 移除现有高亮
      this.clearHighlight();
      
      // 保存当前高亮的geohash
      this.highlightedGeohash = geohash;
      
      // 创建高亮图层
      this.highlightLayer = L.rectangle(bounds, {
        color: '#ff4500',
        weight: 3,
        opacity: 0.7,
        fillColor: '#ff4500',
        fillOpacity: 0.2,
        dashArray: '5, 5',
        interactive: false
      }).addTo(this.mapInstance);
      
      // 创建标签
      this.highlightLabel = L.marker(bounds.getCenter(), {
        icon: L.divIcon({
          className: 'geohash-highlight-label',
          html: `<div style="background-color: #ff4500; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-family: monospace; white-space: nowrap;">${geohash}</div>`,
          iconSize: [100, 20],
          iconAnchor: [50, 10]
        }),
        interactive: false
      }).addTo(this.mapInstance);
      
      // 添加淡入动画
      if (this.highlightLayer._path) {
        this.highlightLayer._path.style.transition = 'stroke-dashoffset 2s linear';
        this.highlightLayer._path.style.strokeDashoffset = '20';
      }
      
      logger.debug(`[GeohashGrid] 高亮显示Geohash网格: ${geohash}`);
    } catch (error) {
      logger.error('[GeohashGrid] 高亮显示Geohash网格失败:', error);
    }
  }

  /**
   * 清除高亮显示
   * @private
   */
  private clearHighlight(): void {
    if (!this.mapInstance) return;
    
    try {
      // 移除高亮图层
      if (this.highlightLayer) {
        this.mapInstance.removeLayer(this.highlightLayer);
        this.highlightLayer = null;
      }
      
      // 移除标签
      if (this.highlightLabel) {
        this.mapInstance.removeLayer(this.highlightLabel);
        this.highlightLabel = null;
      }
      
      // 清空高亮geohash
      this.highlightedGeohash = null;
      
      logger.debug('[GeohashGrid] 已清除高亮显示');
    } catch (error) {
      logger.error('[GeohashGrid] 清除高亮显示失败:', error);
    }
  }

  /**
   * 处理地图移动事件
   * @private
   */
  private handleMapMove(): void {
    if (!this.visible || !this.options.realtimeUpdate) return;
    
    // 防抖动处理
    if (this.updateTimer) {
      window.clearTimeout(this.updateTimer);
    }
    
    // 设置延迟更新
    this.updateTimer = window.setTimeout(() => {
      if (this.gridLayer) {
        this.gridLayer.redraw();
      }
      this.updateTimer = null;
    }, this.options.updateInterval || 200);
  }

  /**
   * 处理缩放级别变化
   * @private
   */
  private handleZoomChange(): void {
    if (!this.visible) return;
    
    const newZoom = this.mapInstance?.getZoom() || 0;
    if (newZoom !== this.currentZoom) {
      this.currentZoom = newZoom;
      
      // 使用requestAnimationFrame来平滑处理缩放变化
      this.animateGridZoom();
    }
  }

  /**
   * 使用requestAnimationFrame实现平滑的网格缩放动画
   * @private
   */
  private animateGridZoom(): void {
    if (!this.visible || !this.gridLayer) return;
    
    // 防止多个动画同时运行
    if (this._zoomAnimationFrame) {
      window.cancelAnimationFrame(this._zoomAnimationFrame);
      this._zoomAnimationFrame = null;
    }
    
    // 开始动画
    this._zoomAnimationFrame = window.requestAnimationFrame(() => {
      try {
        // 重新计算瓦片样式
        if (this.gridLayer._container) {
          // 强制重绘
          this.gridLayer.redraw();
          
          // 应用缩放过渡效果
          this.gridLayer._container.style.transition = 'transform 0.25s ease-out';
          
          // 在下一帧结束过渡
          window.requestAnimationFrame(() => {
            // 清除动画状态
            this._zoomAnimationFrame = null;
            
            // 删除过渡效果，避免影响后续操作
            setTimeout(() => {
              if (this.gridLayer && this.gridLayer._container) {
                this.gridLayer._container.style.transition = '';
              }
            }, 250);
          });
        }
      } catch (e) {
        logger.warn('[GeohashGrid] 网格缩放动画失败:', e);
        this._zoomAnimationFrame = null;
      }
    });
  }

  /**
   * 根据geohash值生成美观的颜色
   * @param geohash Geohash编码
   * @private
   */
  private getColorFromGeohash(geohash: string): string {
    if (!geohash || geohash.length === 0) {
      return '#e9ecef'; // 默认颜色
    }
    
    // 提取geohash前两个字符以获得更好的色彩分布
    const char1 = geohash.charAt(0);
    const char2 = geohash.length > 1 ? geohash.charAt(1) : 'a';
    
    // 专业地图色彩范围
    const hueRanges = [
      [180, 225],  // 蓝绿色系
      [195, 240],  // 蓝色系
      [155, 195],  // 青色系
      [85, 130],   // 绿色系
      [35, 70],    // 黄绿色系
      [215, 265],  // 紫蓝色系
      [40, 80]     // 浅黄色系
    ];
    
    // 根据第一个字符选择色相范围
    const rangeIndex = char1.charCodeAt(0) % hueRanges.length;
    const [minHue, maxHue] = hueRanges[rangeIndex];
    
    // 使用第二个字符在选定范围内微调色相
    const huePercent = (char2.charCodeAt(0) % 36) / 36;
    const hue = minHue + (maxHue - minHue) * huePercent;
    
    // 增加饱和度和亮度以便在低透明度下更明显
    const saturation = Math.min(80 + (geohash.length * 2), 95); // 80-95%
    const lightness = Math.max(60 - (geohash.length * 2), 50);  // 50-60%
    
    // 返回HSL颜色
    return this.hslToHex(hue, saturation, lightness);
  }

  /**
   * 将HSL颜色转换为十六进制颜色
   * @param h 色相
   * @param s 饱和度
   * @param l 亮度
   * @private
   */
  private hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    
    // 转换为RGB
    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    
    return `#${rHex}${gHex}${bHex}`;
  }

  /**
   * 显示网格
   */
  public show(): void {
    // 如果已经可见，直接返回
    if (this.visible) return;
    
    try {
      // 如果网格图层未创建，重新初始化
      if (!this.gridLayer) {
        this.initGridLayer();
      }
      
      // 取消任何正在进行的动画
      if (this._zoomAnimationFrame) {
        window.cancelAnimationFrame(this._zoomAnimationFrame);
        this._zoomAnimationFrame = null;
      }
      
      // 添加到地图并标记为可见
      this.gridLayer.addTo(this.mapInstance);
      this.visible = true;
      
      // 使用requestAnimationFrame来平滑显示
      window.requestAnimationFrame(() => {
        if (this.gridLayer && this.gridLayer._container) {
          // 先设置透明度为0
          this.gridLayer._container.style.opacity = '0';
          
          // 添加过渡效果
          this.gridLayer._container.style.transition = 'opacity 0.3s ease-in-out';
          
          // 在下一帧设置透明度为1，触发淡入效果
          window.requestAnimationFrame(() => {
            if (this.gridLayer && this.gridLayer._container) {
              this.gridLayer._container.style.opacity = '1';
              
              // 淡入完成后移除过渡效果
              setTimeout(() => {
                if (this.gridLayer && this.gridLayer._container) {
                  this.gridLayer._container.style.transition = '';
                }
              }, 300);
            }
          });
        }
      });
      
      logger.debug('[GeohashGrid] 网格已显示');
    } catch (e) {
      logger.error('[GeohashGrid] 显示网格失败:', e);
    }
  }

  /**
   * 隐藏网格
   */
  public hide(): void {
    if (!this.visible) return;
    
    try {
      // 取消任何正在进行的动画
      if (this._zoomAnimationFrame) {
        window.cancelAnimationFrame(this._zoomAnimationFrame);
        this._zoomAnimationFrame = null;
      }
      
      // 清除高亮显示
      this.clearHighlight();
      
      if (this.gridLayer) {
        // 添加淡出动画
        if (this.gridLayer._container) {
          this.gridLayer._container.style.transition = 'opacity 0.3s ease-in-out';
          this.gridLayer._container.style.opacity = '0';
          
          // 等待动画完成后移除图层
          setTimeout(() => {
            if (this.gridLayer) {
              this.gridLayer.removeFrom(this.mapInstance);
            }
            this.visible = false;
          }, 300);
        } else {
          this.gridLayer.removeFrom(this.mapInstance);
          this.visible = false;
        }
      } else {
        this.visible = false;
      }
      
      logger.debug('[GeohashGrid] 网格已隐藏');
    } catch (e) {
      logger.error('[GeohashGrid] 隐藏网格失败:', e);
      // 强制设置为不可见
      this.visible = false;
    }
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
   * 设置网格精度级别
   * @param level 精度级别(1-12)
   */
  public setLevel(level: number): void {
    // 确保level在有效范围内
    level = Math.max(1, Math.min(12, level));
    
    if (this.options.level === level) return;
    
    this.options.level = level;
    logger.debug(`[GeohashGrid] 网格精度级别已设置为 ${level}`);
    
    if (this.visible) {
      // 重新绘制网格以应用新的精度级别
      this.gridLayer.redraw();
    }
  }

  /**
   * 设置网格类型
   * @param type 网格类型 ('rect' | 'hex')
   */
  public setType(type: 'rect' | 'hex'): void {
    if (this.options.gridType === type) return;
    
    this.options.gridType = type;
    logger.debug(`[GeohashGrid] 网格类型已切换为 ${type}`);
    
    if (this.visible) {
      // 重新初始化网格
      this.hide();
      setTimeout(() => this.show(), 50);
    }
  }

  /**
   * 设置是否显示网格编码
   * @param show 是否显示
   */
  public setShowCode(show: boolean): void {
    if (this.options.showCode === show) return;
    
    this.options.showCode = show;
    logger.debug(`[GeohashGrid] 网格编码显示已${show ? '启用' : '禁用'}`);
    
    if (this.visible) {
      // 重新绘制网格
      this.gridLayer.redraw();
    }
  }

  /**
   * 销毁网格对象
   */
  public destroy(): void {
    try {
      // 清除高亮显示
      this.clearHighlight();
      
      // 移除图层
      if (this.gridLayer) {
        this.gridLayer.removeFrom(this.mapInstance);
        this.gridLayer = null;
      }
      
      // 移除事件监听器
      this.removeMapListeners();
      
      // 清除计时器
      if (this.updateTimer) {
        window.clearTimeout(this.updateTimer);
        this.updateTimer = null;
      }
      
      // 取消动画
      if (this._zoomAnimationFrame) {
        window.cancelAnimationFrame(this._zoomAnimationFrame);
        this._zoomAnimationFrame = null;
      }
      
      // 重置状态
      this.visible = false;
      this.mapInstance = null;
      
      logger.debug('[GeohashGrid] 网格对象已销毁');
    } catch (e) {
      logger.error('[GeohashGrid] 销毁网格对象失败:', e);
    }
  }
} 