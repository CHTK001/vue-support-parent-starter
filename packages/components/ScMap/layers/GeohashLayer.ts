/**
 * Geohash网格图层实现
 * 用于在Leaflet地图上显示Geohash网格
 * 支持动态缩放、实时更新和交互功能
 */
import type { Map as LeafletMap, GridLayerOptions, LatLngBounds, LatLng } from 'leaflet';
import { warn, info, error } from '@repo/utils';
import ngeohash from 'ngeohash';

// 类型安全的方式获取Leaflet实例
declare const L: any;

/**
 * Geohash网格配置选项
 */
export interface GeohashGridOptions extends Omit<GridLayerOptions, 'tileSize'> {
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
  onGeohashClick?: (geohash: string, bounds: LatLngBounds, center: LatLng) => void;
  // GridLayer原生选项
  tileSize?: number;
}

// Geohash单元格数据接口
interface GeohashCell {
  geohash: string;
  bounds: any; // LatLngBounds
  center: any; // LatLng
}

/**
 * Geohash网格图层
 * 使用Leaflet的GridLayer实现高性能Geohash网格渲染
 */
export class GridLayerGeohash {
  private map: LeafletMap;
  private options: GeohashGridOptions;
  private gridLayer: any; // Leaflet GridLayer实例
  private visible: boolean = false;
  private updateTimer: number | null = null;
  private canvasContexts: Map<string, CanvasRenderingContext2D> = new Map();
  private highlightedGeohash: string | null = null;
  private highlightLayer: any = null;
  private highlightLabel: any = null;
  private currentZoom: number = 0;
  private initAttempts: number = 0;
  private maxInitAttempts: number = 3;
  
  // 添加动画状态属性
  private _zoomAnimationFrame: number | null = null;
  
  /**
   * 构造函数
   * @param map Leaflet地图实例
   * @param options 配置选项
   */
  constructor(map: LeafletMap, options?: GeohashGridOptions) {
    this.map = map;
    this.options = {
      level: 8, // 默认精度级别6，约1.2km网格大小
      color: '#4a90e2',  // 更好看的蓝色
      weight: 1.2, 
      opacity: 0.7,
      fillColor: '#6aaef7',
      fillOpacity: 0.12,
      gridOpacity: 0.35, // 默认网格背景透明度
      showCode: true, // 默认显示编码
      codeColor: '#2c3e50', // 更暗的蓝黑色文字
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
      tileSize: 256,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 2,
      ...options
    };
    
    this.currentZoom = this.map.getZoom();
    this.initGridLayer();
    
    // 注册事件监听
    this.map.on('zoomend', this.handleZoomChange, this);
    
    if (this.options.realtimeUpdate) {
      this.map.on('move', this.handleMapMove, this);
    }
    
    info("Geohash网格已初始化，默认精度为6级，默认显示编码");
  }
  
  /**
   * 初始化GridLayer
   * @private
   */
  private initGridLayer(): void {
    // 保存this引用以便在事件处理中使用
    const self = this;
    
    try {
      // 定义自定义的网格图层
    const CustomGridLayer = L.GridLayer.extend({
        // 为每个瓦片创建DOM元素
        createTile(coords) {
          const tile = L.DomUtil.create('div', 'geohash-tile');
          const size = this.options.tileSize;
          const map = this._map;
          
          // 计算当前瓦片的地理边界
          const nw = map.unproject([coords.x * size, coords.y * size], coords.z);
          const se = map.unproject([(coords.x + 1) * size, (coords.y + 1) * size], coords.z);
          
          // 动态计算精度（根据缩放级别）
          const precision = Math.max(self.options.level || 8, Math.min(7, 10 - map.getZoom()));
          
          // 计算覆盖该区域的GeoHash
          const centerHash = ngeohash.encode(
            (nw.lat + se.lat)/2, 
            (nw.lng + se.lng)/2, 
            precision
          );
          
          // 绘制网格
          tile.style.width = tile.style.height = `${size}px`;
          tile.style.border = '1px dashed rgba(0,0,0,0.15)';
          // 降低背景颜色透明度，使底图更加可见
          const backgroundColor = this._getColorFromHash(centerHash);
          // 使用用户定义的透明度设置
          tile.style.backgroundColor = this.adjustColorOpacity(backgroundColor, self.options.gridOpacity);
          
          // 添加过渡效果，使缩放更平滑
          tile.style.transition = 'opacity 0.2s ease-in-out';
          
          // 显示GeoHash值（可选）
          if (self.options.showCode) {
            // 创建标签容器并设置样式使其居中
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
        
        _getColorFromHash(hash) {
          // 使用相同的颜色生成方法保持一致性
          return self.getColorFromGeohash(hash);
        },
        
        // 调整颜色透明度的辅助方法
        adjustColorOpacity(color, opacity) {
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
        },
        
        // 瓦片移除时的清理
        _removeTile: function(key: string) {
          if (self.canvasContexts && self.canvasContexts instanceof Map) {
            self.canvasContexts.delete(key);
          }
          
          // 调用原始的瓦片移除方法
          if (L.GridLayer.prototype._removeTile) {
            L.GridLayer.prototype._removeTile.call(this, key);
          }
        },
        
        // 重写_onZoom方法以实现平滑过渡
        _onZoom: function() {
          // 调用原始方法
          if (L.GridLayer.prototype._onZoom) {
            L.GridLayer.prototype._onZoom.apply(this, arguments);
          }
          
          // 使用requestAnimationFrame触发平滑过渡
          if (this._container) {
            window.requestAnimationFrame(() => {
              if (this._container) {
                this._container.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1.0)';
                
                // 清除过渡样式
                setTimeout(() => {
                  if (this._container) {
                    this._container.style.transition = '';
                  }
                }, 250);
              }
            });
          }
        }
      });
      
      // 配置网格图层选项
      const options = {
        tileSize: this.options.tileSize || 256,
        opacity: 1,
        zIndex: 300,
        minZoom: 0,
        maxZoom: 22,
        className: 'geohash-grid-layer',
        keepBuffer: 4,
        updateWhenIdle: false,
        updateWhenZooming: false,
        noWrap: false, // 允许地图环绕
        bounds: null  // 不限制边界
      };
      
      // 创建网格图层实例
      this.gridLayer = new CustomGridLayer(options);
      
      // 如果支持交互，添加点击事件
    if (this.options.interactive) {
      this.map.on('click', this.handleMapClick, this);
    }
      
      // 为GridLayer添加安全保护，防止_updateLevels错误
      this.patchGridLayer();
    } catch (e) {
      this.initAttempts++;
      error('初始化网格图层失败:', e);
      
      // 如果还有尝试次数，延迟重试
      if (this.initAttempts < this.maxInitAttempts) {
        setTimeout(() => {
          info(`正在重试初始化网格图层 (${this.initAttempts}/${this.maxInitAttempts})...`);
          this.initGridLayer();
        }, 500);
      }
    }
  }
  
  /**
   * 修补GridLayer的方法，防止运行时错误
   * @private
   */
  private patchGridLayer(): void {
    if (!this.gridLayer) return;
    
    try {
      // 确保_levels属性存在
      if (!this.gridLayer._levels) {
        this.gridLayer._levels = {};
      }
      
      // 保存原始的_updateLevels方法引用
      const originalUpdateLevels = this.gridLayer._updateLevels;
      
      // 替换_updateLevels方法
      this.gridLayer._updateLevels = function() {
        // 安全检查
        if (!this._tileZoom) {
          // 如果_tileZoom未定义，尝试使用地图缩放级别
          this._tileZoom = Math.round(this._map ? this._map.getZoom() : 0);
        }
        
        if (!this._levels) this._levels = {};
        
        try {
          // 尝试调用原始方法
          if (typeof originalUpdateLevels === 'function') {
            originalUpdateLevels.call(this);
          } else {
            // 手动创建当前级别
            const zoom = this._tileZoom;
            if (!this._levels[zoom]) {
              this._levels[zoom] = {
                level: zoom,
                origin: L.point(0, 0),
                zoom: zoom,
                tiles: {},
                loaded: 0
              };
            }
          }
        } catch (e) {
          // 如果出错，手动处理
          warn('GridLayer._updateLevels调用失败，使用备用方法', e);
          
          const zoom = this._tileZoom;
          
          // 创建当前缩放级别的图层对象
          if (!this._levels[zoom]) {
            this._levels[zoom] = {
              level: zoom,
              origin: L.point(0, 0),
              zoom: zoom,
              tiles: {},
              loaded: 0
            };
          }
        }
      };
      
      // 安全补丁：确保其他关键方法也有保护
      ['_resetView', '_resetGrid', '_update'].forEach(methodName => {
        const originalMethod = this.gridLayer[methodName];
        
        this.gridLayer[methodName] = function(...args: any[]) {
          try {
            // 确保必要的属性存在
            if (!this._levels) this._levels = {};
            if (!this._tileZoom && this._map) {
              this._tileZoom = Math.round(this._map.getZoom());
            }
            
            // 调用原始方法
            if (typeof originalMethod === 'function') {
              return originalMethod.apply(this, args);
            }
          } catch (e) {
            warn(`GridLayer.${methodName} 调用失败`, e);
            // 尝试刷新网格
            setTimeout(() => {
              try {
                if (this._container && this._map) {
                  this.onAdd(this._map);
                }
              } catch (innerError) {
                // 忽略刷新错误
              }
            }, 100);
          }
        };
      });
    } catch (e) {
      error('修补GridLayer方法失败:', e);
    }
  }
  
  /**
   * 处理地图移动事件
   */
  private handleMapMove(): void {
    if (!this.visible || !this.options.realtimeUpdate) return;
    
    // 防抖动处理
    if (this.updateTimer) {
      window.clearTimeout(this.updateTimer);
    }
  }
  
  /**
   * 处理缩放级别变化
   */
  private handleZoomChange(): void {
    if (!this.visible) return;
    
    const newZoom = this.map.getZoom();
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
        warn('网格缩放动画失败:', e);
        this._zoomAnimationFrame = null;
      }
    });
  }
  
  /**
   * 处理地图点击事件
   */
  private handleMapClick(e: any): void {
    // 保留事件处理器空实现，用于保持事件监听
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
    this.gridLayer.addTo(this.map);
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
      
      info('Geohash网格已显示');
    } catch (e) {
      error('显示网格失败:', e);
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
      
      if (this.gridLayer) {
        // 添加淡出动画
        if (this.gridLayer._container) {
          this.gridLayer._container.style.transition = 'opacity 0.3s ease-in-out';
          this.gridLayer._container.style.opacity = '0';
          
          // 等待动画完成后移除图层
          setTimeout(() => {
            if (this.gridLayer) {
              this.gridLayer.removeFrom(this.map);
            }
            this.visible = false;
          }, 300);
        } else {
    this.gridLayer.removeFrom(this.map);
    this.visible = false;
        }
      } else {
        this.visible = false;
      }
      
      info('Geohash网格已隐藏');
    } catch (e) {
      error('隐藏网格失败:', e);
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
   * 根据geohash值生成美观的颜色
   * 使用柔和的配色方案，便于区分不同区域
   */
  private getColorFromGeohash(geohash: string): string {
    if (!geohash || geohash.length === 0) {
      return '#e9ecef'; // 默认颜色
    }
    
    // 提取geohash前两个字符以获得更好的色彩分布
    const char1 = geohash.charAt(0);
    const char2 = geohash.length > 1 ? geohash.charAt(1) : 'a';
    
    // 专业地图色彩范围 - 增强饱和度和亮度，以便在低透明度下依然可见
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
   * 销毁网格图层
   */
  destroy() {
    this.gridLayer?.removeFrom(this.map);
    this.gridLayer = null;
  }
  
  /**
   * 切换网格类型 (rect/hex)
   */
  public toggleType(): void {
    const newType = this.options.gridType === 'rect' ? 'hex' : 'rect';
    this.setType(newType);
  }
  
  /**
   * 获取当前网格类型
   * @returns 当前网格类型 ('rect' | 'hex')
   */
  public getType(): 'rect' | 'hex' {
    return this.options.gridType || 'rect';
  }
  
  /**
   * 设置网格类型
   * @param type 网格类型 ('rect' | 'hex')
   */
  public setType(type: 'rect' | 'hex'): void {
    if (this.options.gridType === type) return;
    
    this.options.gridType = type;
    info(`网格类型已切换为 ${type}`);
    
    if (this.visible) {
      // 重新初始化网格
      this.hide();
      setTimeout(() => this.show(), 50);
    }
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
    info(`网格精度级别已设置为 ${level}`);
    
    if (this.visible) {
      // 重新初始化网格以应用新的精度级别
      this.hide();
      setTimeout(() => this.show(), 50);
    }
  }
} 