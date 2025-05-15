/**
 * 图标工具类
 * @description 统一处理地图上的图标创建，支持本地和远程图片地址
 */
import { Style, Icon, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
// 引入ol-ext的样式处理组件
import 'ol-ext/dist/ol-ext.css';
import OLStyleIcon from 'ol-ext/style/FontSymbol';
import OLStyleShadow from 'ol-ext/style/Shadow';
import logger from '../composables/LogObject';

// 图标工具模块的日志前缀
const LOG_MODULE = 'IconUtils';

/**
 * 图标类型枚举
 */
export enum IconType {
  URL = 'url',       // 直接使用URL
  SVG = 'svg',       // SVG字符串
  BASE64 = 'base64', // Data URL格式
  DEFAULT = 'default' // 默认图标
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
   * 对于远程URL，使用ol-ext的FontSymbol作为替代方案，避免跨域问题
   * @param url 图标URL或内容
   * @param scale 缩放比例
   * @param size 图标大小 [width, height]
   * @param fallbackColor 回退颜色（远程图标加载失败时使用）
   * @returns 图标样式
   */
  public static createSafeIconStyle(url: string, scale: number = 1, size: [number, number] = [32, 32], fallbackColor: string = '#1890ff'): Style {
    // 首先验证图标URL
    if (this.isIconValid(url)) {
      try {
        // 使用ol-ext处理图标显示
        if (url.startsWith('http') || url.startsWith('https')) {
          // 对于HTTP(S)链接，使用ol-ext的FontSymbol作为替代方案
          // 这避免了直接使用远程图片URL可能导致的跨域问题
          this.log('debug', `使用ol-ext处理远程图片: ${url}`, { size, isHttps: url.startsWith('https:') });
          
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
          
          // 创建主图标 - 使用FontSymbol替代远程图片
          // FontSymbol可以使用内置图标或自定义形状
          const iconStyle = new OLStyleIcon({
            radius: radius,
            // 使用圆形作为基础形状
            form: 'circle',
            // 使用自定义颜色
            color: fallbackColor,
            // 添加边框
            stroke: new Stroke({
              color: '#ffffff',
              width: 1.5
            }),
            // 可以添加文本标识（可选）
            text: url.startsWith('https:') ? 'S' : 'H',
            // 文本样式
            fontColor: '#ffffff',
            fontSize: radius * 0.8
          });
          
          // 组合样式 - 阴影 + 图标
          return new Style({
            image: iconStyle,
            // 使用标准的OpenLayers渲染方式
            renderer: function(coords, state) {
              // 首先渲染阴影
              if (shadowStyle && typeof shadowStyle.renderPoint === 'function') {
                // 如果存在renderPoint方法，使用它
                shadowStyle.renderPoint(coords, state);
              } else if (shadowStyle && typeof shadowStyle.drawPoint_ === 'function') {
                // 备选方法
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
      anchor = [0.5, 1], // 默认锚点为底部中心
      offset = [0, 0],
      rotation = 0,
      size = [32, 32],
      color = '#1890ff',
      zIndex = 1
    } = options;
    
    let iconUrl = this.defaultIconUrl;
    
    // 根据不同的图标类型处理图标
    switch (iconType) {
      case IconType.URL:
        // 如果是远程URL，使用createSafeIconStyle处理
        if (icon.startsWith('http') || icon.startsWith('https')) {
          return this.createSafeIconStyle(icon, scale, size, color);
        }
        // 直接使用URL
        iconUrl = icon;
        break;
      case IconType.SVG:
        // 将SVG字符串转换为Data URL
        try {
          iconUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(icon)));
        } catch (e) {
          this.log('error', `SVG转换失败: ${e.message}`);
          try {
            iconUrl = 'data:image/svg+xml,' + encodeURIComponent(icon);
          } catch (err) {
            this.log('error', `SVG所有转换方法均失败: ${err.message}`);
            iconUrl = icon;
          }
        }
        break;
      case IconType.BASE64:
        // 已经是Data URL格式，直接使用
        iconUrl = icon;
        break;
      case IconType.DEFAULT:
      default:
        // 如果提供了icon但类型是default，优先使用提供的icon
        iconUrl = icon || this.defaultIconUrl;
        break;
    }
    
    // 创建标准图标样式
    const iconImage = new Icon({
      src: iconUrl,
      scale: scale,
      anchor: anchor,
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      offset: offset,
      rotation: rotation,
      size: size
    });
    
    // 创建图标样式
    return new Style({
      image: iconImage,
      zIndex: zIndex
    });
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
}

// 导出默认实例
export default IconUtils;