import type { Map as LeafletMap, Control, ControlOptions, LayerGroup, TileLayer } from 'leaflet';
import L from 'leaflet';
import { info, warn, error } from '@repo/utils';
import { getIcon } from '../types/icon';
import 'leaflet-minimap';
import "leaflet-minimap/dist/Control.MiniMap.min.css";

/**
 * 鹰眼控件选项接口
 */
export interface OverviewOptions {
  position: string;
  height: number;
  width: number;
  collapsedWidth: number;
  collapsedHeight: number;
  zoomLevelOffset: number;
  zoomLevelFixed: number | null;
  centerFixed: L.LatLng | null;
  zoomAnimation: boolean;
  toggleDisplay: boolean;
  autoToggleDisplay: boolean;
  minimized: boolean;
  aimingRectOptions: L.PathOptions;
  shadowRectOptions: L.PathOptions;
  strings: { hideText: string; showText: string };
  layerUrl?: string;
  attribution?: string;
  opacity?: number;
  autoActivate?: boolean;
}

/**
 * 鹰眼控件，在地图上显示一个小型概览图
 */
export class Overview {
  private map: LeafletMap;
  private active: boolean = false;
  private overviewControl: any = null;
  private options: OverviewOptions;
  private overviewLayer: TileLayer | null = null;
  private container?: Control | null = null;
  private _container: HTMLElement | null = null;
  private _toggleButton: HTMLElement | null = null;
  private _minimized: boolean = false;

  /**
   * 构造函数
   * @param map Leaflet地图实例
   * @param options 鹰眼配置选项
   */
  constructor(map: LeafletMap, options: Partial<OverviewOptions> = {}) {
    this.map = map;
    this.options = this.mergeOptions(options);
    
    // 记录日志
    info('初始化鹰眼控件');
  }

  /**
   * 合并默认选项和用户提供的选项
   * @param options 用户提供的选项
   * @returns 合并后的选项
   */
  private mergeOptions(options: Partial<OverviewOptions>): OverviewOptions {
    // 默认选项
    const defaultOptions: OverviewOptions = {
      position: 'bottomright',
      height: 150,
      width: 150,
      collapsedWidth: 30,
      collapsedHeight: 30,
      zoomLevelOffset: -5,
      zoomLevelFixed: null,
      centerFixed: null,
      zoomAnimation: false,
      toggleDisplay: true,
      autoToggleDisplay: false,
      minimized: false,
      aimingRectOptions: { 
        color: '#ff7800',
        weight: 2,
        interactive: false,
        fillOpacity: 0.2,
        opacity: 0.7,
        clickable: false,
        fill: true,
        fillColor: '#ff7800'
      },
      shadowRectOptions: {
        color: '#000000',
        weight: 1,
        opacity: 0.3,
        fillOpacity: 0.1,
        interactive: false,
        clickable: false,
        fill: true,
        fillColor: '#000000'
      },
      strings: { hideText: '收起鹰眼', showText: '展开鹰眼' },
      layerUrl: '',
      attribution: '',
      opacity: 0.8,
      autoActivate: false
    };

    // 合并选项
    return { ...defaultOptions, ...options };
  }

  /**
   * 启用鹰眼控件
   */
  public enable(): void {
    if (this.active) {
      warn('鹰眼控件已经处于启用状态');
      return;
    }

    try {
      // 确保地图已完全初始化且不在缩放动画中
      if (!this.map || !this.map._loaded || this.map._animatingZoom) {
        warn('地图尚未完全加载或正在缩放动画中，无法启用鹰眼控件');
        // 等待地图加载完成后再尝试启用
        const tryEnable = () => {
          if (this.map && this.map._loaded && !this.map._animatingZoom) {
          this.enable();
          } else {
            setTimeout(tryEnable, 200);
          }
        };
        
        setTimeout(tryEnable, 200);
        return;
      }

      // 创建鹰眼图层
      this.createOverviewLayer();

      // 创建并添加鹰眼控件
      if (this.overviewLayer) {
        // 检查L.Control.MiniMap是否存在
        if (!(L.Control as any).MiniMap) {
          error('L.Control.MiniMap未定义，请确保leaflet-minimap已正确加载');
          return;
        }

        const miniMapOptions = {
          position: this.options.position,
          width: this.options.width,
          height: this.options.height,
          zoomLevelOffset: this.options.zoomLevelOffset,
          zoomLevelFixed: this.options.zoomLevelFixed,
          zoomAnimation: this.options.zoomAnimation,
          toggleDisplay: this.options.toggleDisplay,
          autoToggleDisplay: this.options.autoToggleDisplay,
          minimized: this.options.minimized,
          aimingRectOptions: this.options.aimingRectOptions,
          shadowRectOptions: this.options.shadowRectOptions,
          strings: this.options.strings,
          collapsedWidth: this.options.collapsedWidth,
          collapsedHeight: this.options.collapsedHeight,
        } as any;

        try {
          // 使用L.Control.MiniMap创建鹰眼控件
          this.overviewControl = new (L.Control as any).MiniMap(this.overviewLayer, miniMapOptions);
          
          // 添加控件到地图
          this.overviewControl.addTo(this.map);
          this.active = true;
          info('鹰眼控件已启用');
          
          // 添加自定义样式和更新图标
        //  this.updateControlIcon();
          
          // 确保首次加载时矩形显示正确
          if (this.overviewControl && this.overviewControl._miniMap) {
            // 给一点延时让miniMap完全初始化
            setTimeout(() => {
              try {
                if (this.overviewControl && !this.overviewControl._minimized) {
                  if (typeof this.overviewControl._updateRects === 'function') {
                    this.overviewControl._updateRects();
                  }
                }
              } catch (e) {
                error('更新鹰眼矩形失败:', e);
              }
            }, 500);
          }
        } catch (e) {
          error('添加鹰眼控件到地图失败:', e);
        }
      } else {
        error('创建鹰眼图层失败');
      }
    } catch (e) {
      error('启用鹰眼控件失败:', e);
    }
  }

  /**
   * 更新控件按钮的图标
   */
  private updateControlIcon(): void {
    try {
      if (this.overviewControl && this.overviewControl._toggleDisplayButton) {
        const button = this.overviewControl._toggleDisplayButton;
        
        // 清空现有内容
        button.innerHTML = '';
        
        // 获取控件位置
        const position = this.options.position || 'bottomright';
        
        // 根据位置和状态选择合适的图标
        if (this.overviewControl._minimized) {
          // 最大化图标 - 根据位置选择不同方向的箭头
          if (position.includes('bottomleft')) {
            // 左下角位置，使用右上箭头
            button.innerHTML = getIcon('arrowTopRight');
            button.title = this.options.strings.showText;
          } else if (position.includes('bottomright')) {
            // 右下角位置，使用左上箭头
            button.innerHTML = getIcon('arrowTopLeft');
            button.title = this.options.strings.showText;
          } else if (position.includes('topleft')) {
            // 左上角位置，使用右下箭头
            button.innerHTML = getIcon('arrowBottomRight');
            button.title = this.options.strings.showText;
          } else if (position.includes('topright')) {
            // 左上角位置，使用左下箭头
            button.innerHTML = getIcon('arrowBottomLeft');
            button.title = this.options.strings.showText;
          } else {
            // 默认使用右上箭头
            button.innerHTML = getIcon('arrowTopRight');
            button.title = this.options.strings.showText;
          }
        } else {
          // 最小化图标 - 根据位置选择不同方向的箭头
          if (position.includes('bottomleft')) {
            // 左下角位置，使用左下箭头
            button.innerHTML = getIcon('arrowBottomLeft');
            button.title = this.options.strings.hideText;
          } else if (position.includes('bottomright')) {
            // 右下角位置，使用右下箭头
            button.innerHTML = getIcon('arrowBottomRight');
            button.title = this.options.strings.hideText;
          } else if (position.includes('topleft')) {
            // 左上角位置，使用左上箭头
            button.innerHTML = getIcon('arrowTopLeft');
            button.title = this.options.strings.hideText;
          } else if (position.includes('topright')) {
            // 右上角位置，使用右上箭头
            button.innerHTML = getIcon('arrowTopRight');
            button.title = this.options.strings.hideText;
          } else {
            // 默认使用左下箭头
            button.innerHTML = getIcon('arrowBottomLeft');
            button.title = this.options.strings.hideText;
          }
        }
        
        // 修改样式：保留背景色和阴影，但移除边框
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.border = 'none'; // 移除边框
        button.style.backgroundColor = '#ffffff'; // 白色背景
        button.style.width = '26px'; // 还原按钮尺寸
        button.style.height = '26px';
        button.style.overflow = 'visible'; // 允许内容溢出
        button.style.position = 'relative'; // 确保定位正确
        button.style.zIndex = '10';
        
        // 找到按钮内的SVG元素并修改其样式
        const svgElement = button.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '52px'; // 更大的图标尺寸
          svgElement.style.height = '52px';
          svgElement.style.position = 'absolute';
          svgElement.style.left = '50%';
          svgElement.style.top = '50%';
          svgElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
          svgElement.style.pointerEvents = 'none'; // 确保鼠标事件透过图标传递到按钮
          
          // 增加SVG路径的粗细
          const pathElements = svgElement.querySelectorAll('path');
          pathElements.forEach(path => {
            // 移除圆形背景路径，只保留箭头
            if (path.getAttribute('d') && path.getAttribute('d').includes('M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448')) {
              path.setAttribute('fill', 'transparent');
              path.setAttribute('stroke', 'transparent');
            }
            
            // 增加所有路径的粗细
            if (path.getAttribute('fill') === '#666666') {
              path.setAttribute('fill', '#222222'); // 加深颜色
            }
            path.setAttribute('stroke-width', '3');
          });
        }
      }
    } catch (e) {
      error('更新鹰眼控件图标失败:', e);
    }
  }

  /**
   * 禁用鹰眼控件
   */
  public disable(): void {
    if (!this.active || !this.overviewControl) {
      warn('鹰眼控件未启用或不存在');
      return;
    }

    try {
      // 从地图中移除鹰眼控件
      this.map.removeControl(this.overviewControl);
      this.overviewControl = null;
      this.active = false;
      info('鹰眼控件已禁用');
    } catch (e) {
      error('禁用鹰眼控件失败:', e);
    }
  }

  /**
   * 切换鹰眼控件的显示/隐藏状态
   */
  public toggle(): void {
    if (this.active) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * 更新鹰眼控件的选项
   * @param options 新的选项配置
   */
  public updateOptions(options: Partial<OverviewOptions>): void {
    // 保存当前激活状态
    const wasActive = this.active;
    
    // 如果控件已激活，先禁用它
    if (wasActive) {
      this.disable();
    }
    
    // 更新选项
    this.options = this.mergeOptions(options);
    
    // 如果之前是激活状态，重新启用控件
    if (wasActive) {
      this.enable();
    }
  }

  /**
   * 创建鹰眼图层
   */
  private createOverviewLayer(): void {
    try {
      // 获取当前地图使用的瓦片图层
      let tileLayerUrl = '';
      let attribution = '';
      
      // 如果提供了自定义URL，使用自定义URL
      if (this.options.layerUrl) {
        tileLayerUrl = this.options.layerUrl;
        attribution = this.options.attribution || '';
      } else {
        // 否则尝试使用与主地图相同的瓦片图层
        this.map.eachLayer((layer: any) => {
          if (layer instanceof L.TileLayer) {
            const tileLayer = layer as L.TileLayer;
            if (!tileLayerUrl) {
              // 尝试多种方式获取URL
              if (tileLayer._url) {
                tileLayerUrl = tileLayer._url;
              } else if (tileLayer.options && tileLayer.options.url) {
                tileLayerUrl = tileLayer.options.url;
              } else if (typeof tileLayer.getUrl === 'function') {
                tileLayerUrl = tileLayer.getUrl();
              }
              
              attribution = tileLayer.options?.attribution || '';
            }
          }
        });
      }

      // 如果无法获取URL，使用默认的OpenStreetMap
      if (!tileLayerUrl) {
        warn('无法获取主地图的瓦片图层URL，使用默认的OpenStreetMap');
        tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      }

      info('鹰眼图层使用URL: ' + tileLayerUrl);

      // 创建瓦片图层
      this.overviewLayer = L.tileLayer(tileLayerUrl, {
        minZoom: 0,
        maxZoom: 18,
        attribution: attribution,
        opacity: this.options.opacity !== undefined ? this.options.opacity : 0.8
      });
    } catch (e) {
      error('创建鹰眼图层失败:', e);
      this.overviewLayer = null;
    }
  }

  /**
   * 检查鹰眼控件是否处于启用状态
   * @returns 控件是否启用
   */
  public isActive(): boolean {
    return this.active;
  }
  
  /**
   * 获取当前鹰眼控件的状态
   * @returns 是否最小化
   */
  public isMinimized(): boolean {
    if (!this.overviewControl) return false;
    return !!this.overviewControl._minimized;
  }
  
  /**
   * 最小化鹰眼控件
   */
  public minimize(): void {
    if (this.overviewControl && !this.overviewControl._minimized) {
      try {
        this.overviewControl._toggleDisplayButtonClicked();
        info('鹰眼控件已最小化');
      } catch (e) {
        error('最小化鹰眼控件失败:', e);
      }
    }
  }
  
  /**
   * 最大化鹰眼控件
   */
  public maximize(): void {
    if (this.overviewControl && this.overviewControl._minimized) {
      try {
        this.overviewControl._toggleDisplayButtonClicked();
        info('鹰眼控件已最大化');
      } catch (e) {
        error('最大化鹰眼控件失败:', e);
      }
    }
  }
} 