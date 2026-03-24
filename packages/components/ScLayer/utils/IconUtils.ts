/**
 * 图标工具类
 * @description 统一处理地图上的图标创建，支持本地和远程图片地址
 */
import { Style, Icon, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
// 引入ol-ext的样式处理组件
import 'ol-ext/dist/ol-ext.css';
import OLStyleIcon from 'ol-ext/style/FontSymbol';
import OLStyleShadow from 'ol-ext/style/Shadow';
import OLStylePhoto from 'ol-ext/style/Photo'; // 引入Photo样式
import logger from '../composables/LogObject';
import { MarkerOptions } from '../types/marker';
import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';

// 图标工具模块的日志前缀
const LOG_MODULE = 'IconUtils';

/**
 * 图标类型枚举
 */
export enum IconType {
  URL = 'url',       // 直接使用URL
  SVG = 'svg',       // SVG字符串
  BASE64 = 'base64', // Data URL格式
  DEFAULT = 'default', // 默认图标
  PHOTO = 'photo'    // 使用Photo样式的图标
}

/**
 * 图标配置接口
 */
export interface IconOptions {
  // 图标URL或内容
  icon: string;
  // 图标类型
  iconType?: IconType;
  // 缩放比例
  scale?: number;
  // 锚点 [x, y] 范围0-1
  anchor?: [number, number];
  // 偏移 [x, y] 像素
  offset?: [number, number];
  // 旋转角度（弧度）
  rotation?: number;
  // 图标大小 [width, height] 像素
  size?: [number, number];
  // 图标颜色（用于远程图标失败时的回退颜色）
  color?: string;
  // z-index
  zIndex?: number;
  // Photo样式特有选项
  photoOptions?: {
    // Photo边框形状：'circle'(默认), 'square', 'shield', 'anchor', 'folio'
    kind?: 'circle' | 'square' | 'shield' | 'anchor' | 'folio';
    // 边框宽度
    stroke?: number;
    // 边框颜色
    strokeColor?: string;
    // 阴影配置
    shadow?: boolean;
    // 阴影模糊半径
    shadowBlur?: number;
    // 阴影颜色
    shadowColor?: string;
    // 边框样式半径
    crop?: boolean;
    // 图片背景色
    background?: string;
  };
}

/**
 * 图标工具类
 */
export class IconUtils {
  // 默认图标URL
  private static defaultIconUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAqFJREFUWEftljtMFFEUhv8zmrU0DBuMhTQ7M2hQGyGa0BLfdqKtFkb27sZOW5dWrQy7oBa2RK2MIGrsLHw2KlF2BgssDAQuoZTIHLPDghN2HvcOBY1T7j3n/N953LOXsM0fbbM+tgSw+65baCSwfM2eyZqINoBZna4AdBiGcQzMewNhol/w/bcAf5alrooOjDJA+3D9KBM9AOFQogDjCzFfWSw771RAlACCrMm4qRJww4b9IZVqpAI0+rxjJzwt8abx6h9YafORCmCOeONgPp0FAEQTsmidSfJNBFAo/VQzeHesCKEii/ZQ3HkyQM17BnBcBheksB83Aps1dwDAo2gRGpfCOpsRwJ0D0LHZ2QD1LAjrU/j3fM074oM/RgjNS2Hv0QbID884vuFPtzrytBTO/qiAZq3+HaCuFmDf6FooF+pRPrEtyI/O9Pi+/yHCaUoK+2A0gPsVQMs8GIbRuzBYiKpO/Co2q94+EM/GlG6j/+vniXPA1ClL1k+tCqAylTM7cr/jeheeg4T+B+5yfmUXKt0regBr0z0G4GL8PebmjLT2PeTzUgr7hPYQBter6h4H4UWmJdR0YtDVJWHdzwSwdsfr7wHqzQqxCi4sC+dHZoD2av0SEz3MBsB3pHCuJ/mm/hc0q/AKoH4dCAa8HFHfXNGa3zJA26h7jnw81QIgHlwqOvfSfJQqsFYFbwzghBsRlqJJKaxTaeKNc2WAthGvj5jfKAX1jf7FcuG1kq2K0b9t590COHGoALothXVDNa5yBUIrdwJAXHmfS2FrPV60Adqr9QNMNAmgc1OWs8R8crHkfFPNXmsGwkHNqnsehOAxsvExBmTJfqIjnhkguBXhl3LKs2vLeyAugDniBRtSFq3Lupmv22vPQFahOL//AH8B63PcITqKfDEAAAAASUVORK5CYII=';

  /**
   * 记录图标工具模块日志
   * @param level 日志级别
   * @param message 日志消息
   * @param args 附加参数
   */
  private static log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
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
   * 验证图标URL是否有效
   * @param url 图标URL
   * @returns 是否有效
   */
  private static isIconValid(url: string): boolean {
    if (!url) return false;
    
    // 检查是否是有效的URL或Data URL
    if (url.startsWith('http') || url.startsWith('https') || 
        url.startsWith('data:') || url.startsWith('<svg')) {
      return true;
    }
    
    return false;
  }

  /**
   * 创建安全的图标样式
   * 支持远程URL、SVG、Data URL等多种图标格式
   * 对于远程URL，使用ol-ext的Photo样式显示图片，避免跨域问题
   * @param url 图标URL或内容
   * @param scale 缩放比例
   * @param size 图标大小 [width, height]
   * @param fallbackColor 回退颜色（远程图标加载失败时使用）
   * @param photoOptions Photo样式特有选项
   * @param iconType 图标类型
   * @returns 图标样式
   */
  public static createSafeIconStyle(
    url: string, 
    scale: number = 1, 
    size: [number, number] = [32, 32], 
    fallbackColor: string = '#1890ff',
    photoOptions?: IconOptions['photoOptions'],
    iconType?: string
  ): Style {
    // 首先验证图标URL
    if (this.isIconValid(url)) {
      try {
        // 新增：根据iconType判断
        if (iconType === 'icon') {
          // 使用FontSymbol或SVG
          if (url.startsWith('<svg')) {
            // SVG字符串，转base64
            const svgBase64 = 'data:image/svg+xml;base64,' + btoa(url);
            return new Style({
              image: new Icon({
                src: svgBase64,
                scale: scale,
                size: size
              })
            });
          } else {
            // 其他iconfont等，使用FontSymbol
            return new Style({
              image: new OLStyleIcon({
                glyph: url,
                size: Math.max(size[0], size[1]),
                color: fallbackColor
              })
            });
          }
        }
        // 默认photo类型
        if (url.startsWith('http') || url.startsWith('https')) {
          // 对于HTTP(S)链接，使用ol-ext的Photo样式展示图片
          this.log('debug', `使用ol-ext Photo样式处理远程图片: ${url}`, { size, photoOptions });
          
          // 计算图标大小
          const radius = Math.max(size[0], size[1]) / 2 * scale;
          
          // 设置Photo样式配置项
          const photoConfig: any = {
            src: url,
            radius: radius,
            crop: photoOptions?.crop !== false, // 默认为true
            kind: photoOptions?.kind || 'circle', // 默认为圆形
            shadow: photoOptions?.shadow !== false, // 默认启用阴影
            onload: () => {
              this.log('debug', `远程图片加载成功: ${url}`);
            },
            onerror: () => {
              this.log('warn', `远程图片加载失败: ${url}，将使用替代样式`);
            }
          };
          
          // 添加边框相关配置
          if (photoOptions?.stroke !== undefined) {
            photoConfig.stroke = new Stroke({
              color: photoOptions.strokeColor || '#fff',
              width: photoOptions.stroke
            });
          } else {
            photoConfig.stroke = new Stroke({
              color: '#fff',
              width: 1.5
            });
          }
          
          // 添加阴影相关配置
          if (photoOptions?.shadow) {
            photoConfig.shadowBlur = photoOptions.shadowBlur || 7;
            photoConfig.shadowColor = photoOptions.shadowColor || 'rgba(0,0,0,0.5)';
          }
          
          // 添加背景色配置 - 强制透明背景
          photoConfig.background = new Fill({
            color: 'rgba(0,0,0,0)' // 使用完全透明的RGBA颜色
          });
          
          // 创建Photo样式
          const photoStyle = new OLStylePhoto(photoConfig);
          
          // 返回样式
          return new Style({
            image: photoStyle,
            zIndex: 10000 // 保持高z-index确保可见性
          });
        } else if (url.startsWith('data:image') || url.startsWith('<svg')) {
          // 对于data:URL和SVG内容，使用原始OpenLayers Icon处理
          const iconOptions: any = {
            src: url,
            scale: scale,
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction'
          };
          
          // 设置尺寸
          if (size && size.length === 2 && size[0] > 0 && size[1] > 0) {
            iconOptions.size = size;
            iconOptions.imgSize = [...size]; // 创建副本以避免引用问题
          }
          
          // 处理SVG内容
          if (url.startsWith('<svg')) {
            try {
              // 使用更安全的方式处理SVG内容
              const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(url)));
              iconOptions.src = svgDataUrl;
              this.log('debug', `SVG转换为base64成功`);
            } catch (e) {
              this.log('error', `SVG转换失败: ${e.message}`);
              // 如果转换失败，尝试使用URL编码
              try {
                const svgDataUrl = 'data:image/svg+xml,' + encodeURIComponent(url);
                iconOptions.src = svgDataUrl;
                this.log('debug', `SVG转换为URL编码成功`);
              } catch (err) {
                this.log('error', `SVG所有转换方法均失败: ${err.message}`);
                // 如果所有转换都失败，保持原SVG内容
                iconOptions.src = url;
              }
            }
          }
          
          // 创建标准Icon样式
          return new Style({
            image: new Icon(iconOptions),
            zIndex: 10000
          });
        }
      } catch (error) {
        this.log('error', `创建图标样式失败: ${error.message || '未知错误'}, URL: ${url}`);
        // 错误时创建默认样式
      }
    }
    
    // 创建默认圆点样式作为回退
    this.log('warn', `使用默认圆点样式，URL无效或处理失败: ${url}`);
    return new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: fallbackColor
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 1.5
        })
      })
    });
  }

  /**
   * 创建标记点样式
   * @param options 图标配置选项
   * @returns 图标样式
   */
  public static createMarkerStyle(options: IconOptions): Style {
    const {
      icon,
      iconType = IconType.DEFAULT,
      scale = 1,
      size = [32, 32],
      anchor = [0.5, 0.5],
      offset = [0, 0],
      rotation = 0,
      color = '#1890ff',
      zIndex = 10000,
      photoOptions
    } = options;

    // 检查图标有效性
    if (!icon) {
      this.log('warn', `无效的图标配置，使用默认样式`);
      return this.createSafeIconStyle(this.defaultIconUrl, scale, size, color);
    }

    try {
      // 根据图标类型创建不同的样式
      switch (iconType) {
        case IconType.URL:
          // 处理URL类型的图标，使用标准Icon样式
          if (icon.startsWith('http') || icon.startsWith('https')) {
            return new Style({
              image: new Icon({
                src: icon,
                scale: scale,
                size: size,
                anchor: anchor,
                offset: offset,
                rotation: rotation
              }),
              zIndex: zIndex
            });
          } else {
            return this.createSafeIconStyle(icon, scale, size, color);
          }
        case IconType.PHOTO:
          // 处理PHOTO类型的图标，使用Photo样式
          if (icon.startsWith('http') || icon.startsWith('https')) {
            return this.createSafeIconStyle(icon, scale, size, color, photoOptions);
          } else {
            return this.createSafeIconStyle(icon, scale, size, color);
          }
        case IconType.SVG:
          // 处理SVG类型的图标
          return this.createSafeIconStyle(icon, scale, size, color);
        case IconType.BASE64:
          // 处理BASE64类型的图标
          return this.createSafeIconStyle(icon, scale, size, color);
        case IconType.DEFAULT:
        default:
          // 默认处理
          if (icon === 'default' || !icon) {
            return this.createSafeIconStyle(this.defaultIconUrl, scale, size, color);
          } else {
            // 尝试自动识别图标类型
            if (icon.startsWith('http') || icon.startsWith('https')) {
              // 对于远程URL，默认使用标准Icon样式，除非明确指定为PHOTO类型
              return new Style({
                image: new Icon({
                  src: icon,
                  scale: scale,
                  size: size,
                  anchor: anchor,
                  offset: offset,
                  rotation: rotation
                }),
                zIndex: zIndex
              });
            } else if (icon.startsWith('<svg')) {
              return this.createSafeIconStyle(icon, scale, size, color);
            } else if (icon.startsWith('data:')) {
              return this.createSafeIconStyle(icon, scale, size, color);
            } else {
              // 默认回退到内置图标
              return this.createSafeIconStyle(this.defaultIconUrl, scale, size, color);
            }
          }
      }
    } catch (error) {
      this.log('error', `创建标记点样式失败: ${error.message || '未知错误'}`);
      // 错误时回退到默认样式
      return this.createSafeIconStyle(this.defaultIconUrl, scale, size, color);
    }
  }

  /**
   * 创建字体图标样式
   * @param options 图标配置选项
   * @param text 图标文本
   * @param fontColor 文本颜色
   * @returns 图标样式
   */
  public static createFontSymbolStyle(options: IconOptions, text: string = '', fontColor: string = '#ffffff'): Style {
    const {
      scale = 1,
      color = '#1890ff',
      size = [32, 32],
      zIndex = 1
    } = options;
    
    // 计算图标大小
    const radius = Math.max(size[0], size[1]) / 2 * scale;
    
    // 创建一个带阴影的圆形图标作为基础
    const shadowStyle = new OLStyleShadow({
      radius: radius * 1.2,
      blur: 5,
      offsetX: 0,
      offsetY: 0,
      fill: new Fill({
        color: 'rgba(0,0,0,0.2)'
      })
    });
    
    // 创建主图标 - 使用FontSymbol
    const iconStyle = new OLStyleIcon({
      radius: radius,
      // 使用圆形作为基础形状
      form: 'circle',
      // 使用自定义颜色
      color: color,
      // 添加边框
      stroke: new Stroke({
        color: '#ffffff',
        width: 1.5
      }),
      // 添加文本
      text: text,
      // 文本样式
      fontColor: fontColor,
      fontSize: radius * 0.8
    });
    
    // 组合样式 - 阴影 + 图标
    return new Style({
      image: iconStyle,
      // 使用标准的OpenLayers渲染方式
      renderer: function(coords, state) {
        // 首先渲染阴影
        if (shadowStyle && typeof shadowStyle.renderPoint === 'function') {
          shadowStyle.renderPoint(coords, state);
        } else if (shadowStyle && typeof shadowStyle.drawPoint_ === 'function') {
          shadowStyle.drawPoint_(coords, state);
        }
        
        // 然后渲染图标
        if (iconStyle && typeof iconStyle.renderPoint === 'function') {
          iconStyle.renderPoint(coords, state);
        } else if (iconStyle && typeof iconStyle.drawPoint_ === 'function') {
          iconStyle.drawPoint_(coords, state);
        } else if (iconStyle && typeof iconStyle.render === 'function') {
          iconStyle.render(coords, state);
        }
      },
      zIndex: zIndex
    });
  }

  /**
   * 创建Photo样式的图标
   * 专门使用ol-ext的Photo功能创建图片图标样式
   * 
   * @param imageUrl 图片URL
   * @param options 配置选项
   * @returns Photo样式
   */
  public static createPhotoStyle(imageUrl: string, options: {
    radius?: number; // 图标半径
    kind?: 'circle' | 'square' | 'shield' | 'anchor' | 'folio'; // 图标形状
    stroke?: number; // 边框宽度
    strokeColor?: string; // 边框颜色
    shadow?: boolean; // 是否启用阴影
    shadowBlur?: number; // 阴影模糊半径
    shadowColor?: string; // 阴影颜色
    crop?: boolean; // 是否裁剪图片
    background?: string; // 背景颜色
    border?: number; // 内边距
    scale?: number; // 缩放比例
    rotation?: number; // 旋转角度
  } = {}): Style {
    this.log('debug', `创建Photo样式图标: ${imageUrl}`, options);
    
    const {
      radius = 20,
      kind = 'circle',
      stroke = 2,
      strokeColor = '#fff',
      shadow = true,
      shadowBlur = 7,
      shadowColor = 'rgba(0,0,0,0.5)',
      crop = true,
      background,
      border = 0,
      scale = 1,
      rotation = 0
    } = options;
    
    try {
      // 计算实际半径
      const actualRadius = radius * scale;
      
      // 配置Photo样式
      const photoConfig: any = {
        src: imageUrl,
        radius: actualRadius,
        crop,
        kind,
        shadow,
        border,
        rotation,
        stroke: new Stroke({
          color: strokeColor,
          width: stroke
        })
      };
      
      // 添加阴影配置
      if (shadow) {
        photoConfig.shadowBlur = shadowBlur;
        photoConfig.shadowColor = shadowColor;
      }
      
      // 添加背景色 - 默认为透明
      photoConfig.background = new Fill({
        color: 'rgba(0,0,0,0)' // 使用完全透明的RGBA颜色
      });
      
      // 创建Photo样式
      const photoStyle = new OLStylePhoto(photoConfig);
      
      // 返回样式
      return new Style({
        image: photoStyle,
        zIndex: 10000
      });
    } catch (error) {
      this.log('error', `创建Photo样式失败: ${error.message}`, error);
      
      // 失败时返回默认样式
      return this.createSafeIconStyle(this.defaultIconUrl, scale, [radius * 2, radius * 2]);
    }
  }
  
  /**
   * 示例：如何使用PhotoStyle创建不同形状的图片图标
   * @returns 各种形状的Photo图标样式
   */
  public static getPhotoStyleExamples(): Record<string, Style> {
    const imageUrl = 'https://openlayers.org/en/latest/examples/data/icon.png';
    
    return {
      // 圆形图标
      circle: this.createPhotoStyle(imageUrl, {
        kind: 'circle',
        radius: 20,
        stroke: 2,
        strokeColor: '#3388ff'
      }),
      
      // 方形图标
      square: this.createPhotoStyle(imageUrl, {
        kind: 'square',
        radius: 20,
        stroke: 2,
        strokeColor: '#ff3333'
      }),
      
      // 盾牌形图标
      shield: this.createPhotoStyle(imageUrl, {
        kind: 'shield',
        radius: 20,
        stroke: 2,
        strokeColor: '#33ff33'
      }),
      
      // 锚形图标
      anchor: this.createPhotoStyle(imageUrl, {
        kind: 'anchor',
        radius: 20,
        stroke: 2,
        strokeColor: '#ffcc33'
      }),
      
      // 文件形图标
      folio: this.createPhotoStyle(imageUrl, {
        kind: 'folio',
        radius: 20,
        stroke: 2,
        strokeColor: '#9933ff'
      }),
      
      // 带阴影的圆形图标
      circleShadow: this.createPhotoStyle(imageUrl, {
        kind: 'circle',
        radius: 20,
        stroke: 2,
        strokeColor: '#fff',
        shadow: true,
        shadowBlur: 10,
        shadowColor: 'rgba(0,0,0,0.7)'
      }),
      
      // 带背景的圆形图标
      circleBackground: this.createPhotoStyle(imageUrl, {
        kind: 'circle',
        radius: 20,
        stroke: 2,
        strokeColor: '#fff',
        background: 'rgba(255,255,200,0.8)'
      })
    };
  }

  /**
   * 从MarkerOptions创建样式
   * 整合MarkerObject中的createMarkerStyle逻辑
   * @param options 标记点配置选项
   * @param baseZoom 可选的基准缩放级别
   * @param currentZoom 可选的当前缩放级别
   * @returns 图标样式
   */
  public static createMarkerStyleFromOptions(
    options: MarkerOptions, 
    baseZoom?: number, 
    currentZoom?: number
  ): Style | Style[] {
    if (!options) {
      return new Style({});
    }
    
    const {
      iconType = 'default',
      style = {},
      zIndex = 10000
    } = options as any;
      // 默认样式
    const defaultStyle = {
      scale: 1,
      size: [24, 24] as [number, number],
      anchor: [0.5, 1] as [number, number],
      offset: [0, 0] as [number, number],
      rotation: 0,
      textColor: '#333',
      textOutlineColor: '#fff',
      textOutlineWidth: 2,
      textFont: '14px Arial',
      textOffsetY: -20
    };
    let icon = options.icon as any;
    let size = options.size as [number, number];

    if (icon && (typeof icon === 'object')) {
      icon = icon.url || icon.src || icon.default;
      if (icon && (typeof icon === 'object')) {
        icon = icon.url || icon.src || icon.default;
      }
      if(!size && icon.size) {
        size = icon.size;
      }
      if(icon.anchor) {
        defaultStyle.anchor = icon.anchor;
      }

      if(icon.offset) {
        defaultStyle.offset = icon.offset;
      }
      if(icon.rotation) {
        defaultStyle.rotation = icon.rotation;
      }
      
      icon = icon.url || icon.src || icon.default;
    }
    
    // 合并样式
    const styleOptions = { ...defaultStyle, ...style };
    
    // 默认图标URL
    const defaultIconUrl = this.defaultIconUrl;
    
    // 根据不同的图标类型处理图标
    let iconUrl = defaultIconUrl;
    if (icon) {
      iconUrl = icon;
    }
    
    // 如果提供了缩放级别，计算缩放因子
    let scaleFactor = 1;
    if (baseZoom !== undefined && currentZoom !== undefined) {
      // 计算当前zoom与基准zoom的差值
      const zoomChange = currentZoom - baseZoom;
      
      // 缩放参数
      const zoomFactor = 0.05;
      const minScale = 0.8;
      const maxScale = 1.2;
      
      // 直接将zoom变化值乘以缩放系数获得缩放比例
      scaleFactor = 1 + (zoomChange * zoomFactor);
      
      // 限制在最小和最大缩放范围内
      scaleFactor = Math.max(minScale, Math.min(maxScale, scaleFactor));
    }
    
    // 计算最终的缩放比例
    let finalScale = styleOptions.scale * scaleFactor;
    
    // 如果提供了size参数，将其转换为等比例缩放
    if (size) {
      // 使用size参数作为等比例缩放的参考，而不是裁剪
      // 默认假设原始图标大小为24x24，计算缩放比例
      const defaultSize = 24;
      const scaleX = size[0] / defaultSize;
      const scaleY = size[1] / defaultSize;
      
      // 使用较大的缩放比例，确保图标完全覆盖指定的size区域
      const sizeScale = Math.max(scaleX, scaleY);
      
      // 将size缩放因子与其他缩放因子相乘
      finalScale *= sizeScale;
      
      this.log('debug', `使用size参数计算等比例缩放: [${size[0]}, ${size[1]}] => scale=${sizeScale.toFixed(2)}`);
    }
    
    // 获取图标锚点 - 保持锚点始终为底部中心点，确保定位准确
    const anchor = styleOptions.anchor || [0.5, 1]; // 固定锚点为图标底部中心
    
    // 根据图标类型使用不同的渲染方式
    switch (iconType) {
      case 'photo':
        // 使用Photo样式处理远程URL
        if (icon && (icon.startsWith('http') || icon.startsWith('https'))) {
          // 创建Photo样式所需选项
          const photoOptions = {
            kind: options.data?.photoKind || 'circle',
            stroke: options.data?.photoStroke !== undefined ? options.data?.photoStroke : 2,
            strokeColor: options.data?.photoStrokeColor || '#ffffff',
            shadow: options.data?.photoShadow !== false,
            shadowBlur: options.data?.photoShadowBlur || 7,
            shadowColor: options.data?.photoShadowColor || 'rgba(0,0,0,0.5)',
            crop: options.data?.photoCrop !== false,
            background: 'rgba(0,0,0,0)' // 强制透明背景
          };
          
          this.log('debug', `使用Photo样式渲染URL图标: ${icon}`, { photoOptions });
          
          // 计算Photo样式的半径，使用finalScale
          const radius = 12 * finalScale; // 默认半径为12像素，应用缩放
          
          // 创建Photo样式
          const photoStyle = new OLStylePhoto({
            src: icon,
            radius: radius,
            ...photoOptions
          });
          
          return new Style({
            image: photoStyle,
            zIndex: zIndex
          });
        }
        break;
        
      case 'url':
        // 使用标准Icon样式处理URL
        if (icon && (icon.startsWith('http') || icon.startsWith('https'))) {
          this.log('debug', `使用标准Icon样式渲染URL图标: ${icon}, scale=${finalScale}`);
          
          // 创建标准图标样式，使用scale而不是size
          return new Style({
            image: new Icon({
              src: iconUrl,
              scale: finalScale,
              anchor: styleOptions.anchor,
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              offset: styleOptions.offset,
              rotation: styleOptions.rotation || 0
            }),
            zIndex: zIndex
          });
        }
        break;
        
      case 'svg':
        // 处理SVG字符串
        if (icon && icon.startsWith('<svg')) {
          try {
            const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(icon)));
            iconUrl = svgDataUrl;
          } catch (e) {
            this.log('error', `SVG转换失败: ${e.message}`);
          }
        }
        break;
        
      case 'base64':
        // Base64格式图标不需要特殊处理
        break;
        
      case 'default':
      default:
        // 默认图标类型不需要特殊处理
        break;
    }
    
    // 创建标准图标样式，使用scale而不是size
    return new Style({
      image: new Icon({
        src: iconUrl,
        scale: finalScale,
        anchor: styleOptions.anchor,
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        offset: styleOptions.offset,
        rotation: styleOptions.rotation || 0
      }),
      zIndex: zIndex
    });
  }
}

// 导出默认实例
export default IconUtils;