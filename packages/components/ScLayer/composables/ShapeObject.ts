/**
 * 图形对象
 * @description 用于地图上绘制各种形状，包括矩形、圆形、多边形和线段
 */
import { Map as OlMap } from 'ol';
import { Draw, Snap } from 'ol/interaction';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style';
import { LineString, Polygon, Circle, Point } from 'ol/geom';
import { Feature } from 'ol';
import { unByKey } from 'ol/Observable';
import { EventsKey } from 'ol/events';
import { createBox } from 'ol/interaction/Draw';
import logger from './LogObject';

// 图形模块日志前缀
const LOG_MODULE = 'Shape';

// 图形类型
export type ShapeType = 'Point' | 'LineString' | 'Polygon' | 'Circle' | 'Rectangle';

// 图形样式接口
export interface ShapeStyle {
  stroke?: {
    color?: string;
    width?: number;
    lineDash?: number[];
  };
  fill?: {
    color?: string;
  };
  point?: {
    radius?: number;
    stroke?: {
      color?: string;
      width?: number;
    };
    fill?: {
      color?: string;
    };
  };
  text?: {
    font?: string;
    fill?: {
      color?: string;
    };
    stroke?: {
      color?: string;
      width?: number;
    };
    offsetY?: number;
    padding?: number[];
  };
}

// 图形配置接口
export interface ShapeOptions {
  id?: string;
  type: ShapeType;
  style?: ShapeStyle;
  data?: any;
}

// 默认样式配置
const DEFAULT_STYLE: ShapeStyle = {
  stroke: {
    color: 'rgba(24, 144, 255, 1)',
    width: 2,
    lineDash: []
  },
  fill: {
    color: 'rgba(24, 144, 255, 0.2)'
  },
  point: {
    radius: 5,
    stroke: {
      color: 'rgba(24, 144, 255, 0.8)',
      width: 2
    },
    fill: {
      color: 'rgba(255, 255, 255, 0.8)'
    }
  },
  text: {
    font: '14px Calibri,sans-serif',
    fill: {
      color: '#333'
    },
    stroke: {
      color: '#fff',
      width: 3
    },
    offsetY: -12,
    padding: [5, 5, 5, 5]
  }
};

/**
 * 图形对象类
 */
export class ShapeObject {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 图形图层源
  private source: VectorSource = new VectorSource();
  // 图形图层
  private layer: VectorLayer<VectorSource> | null = null;
  // 绘制交互
  private draw: Draw | null = null;
  // 捕捉交互
  private snap: Snap | null = null;
  // 样式配置
  private style: ShapeStyle = DEFAULT_STYLE;
  // 当前绘制类型
  private currentType: ShapeType | null = null;
  // 绘制事件监听器
  private drawListener: EventsKey | null = null;
  // 是否启用
  private enabled: boolean = false;
  // 图形ID计数器
  private idCounter: number = 0;
  // 图形对象映射
  private shapes: Map<string, Feature> = new Map();

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param style 样式配置
   */
  constructor(mapInstance: OlMap | null = null, style?: ShapeStyle) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    
    if (style) {
      this.setStyle(style);
    }

    // 创建矢量图层
    this.layer = new VectorLayer({
      source: this.source,
      zIndex: 100,
      style: (feature) => {
        return this.createFeatureStyle(feature as Feature);
      }
    });

    this.log('debug', '图形对象已创建');
  }

  /**
   * 记录图形模块日志
   * @param level 日志级别
   * @param message 日志消息
   * @param args 附加参数
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
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
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    this.mapInstance = mapInstance;
    
    // 如果图层已经创建，添加到地图
    if (this.layer && !this.isLayerAdded()) {
      this.mapInstance.addLayer(this.layer);
    }

    this.log('debug', '图形对象已设置地图实例');
  }

  /**
   * 检查图层是否已添加到地图
   * @returns 是否已添加
   */
  private isLayerAdded(): boolean {
    if (!this.mapInstance || !this.layer) return false;
    
    const layers = this.mapInstance.getLayers().getArray();
    return layers.includes(this.layer);
  }

  /**
   * 设置样式
   * @param style 样式配置
   */
  public setStyle(style: ShapeStyle): void {
    this.style = { ...DEFAULT_STYLE, ...style };
    
    // 刷新图层样式
    if (this.layer) {
      this.layer.changed();
    }

    this.log('debug', '图形对象样式已更新');
  }

  /**
   * 启用绘图功能
   * @param type 图形类型
   */
  public enable(type: ShapeType): void {
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法启用绘图功能');
      return;
    }

    // 如果已经启用，先禁用
    if (this.enabled) {
      this.disable();
    }

    this.currentType = type;

    // 确保图层已添加到地图
    if (!this.isLayerAdded()) {
      this.mapInstance.addLayer(this.layer as VectorLayer<VectorSource>);
    }

    // 创建绘制交互
    this.addInteraction();

    this.enabled = true;
    this.log('info', `图形绘制功能已启用，类型: ${type}`);
  }

  /**
   * 禁用绘图功能
   */
  public disable(): void {
    if (!this.mapInstance || !this.enabled) {
      return;
    }

    // 移除交互
    this.removeInteraction();
    
    this.currentType = null;
    this.enabled = false;
    this.log('debug', '图形绘制功能已禁用');
  }

  /**
   * 添加交互
   */
  private addInteraction(): void {
    if (!this.mapInstance) return;

    let geometryFunction;
    let type = this.currentType || 'Polygon';

    // 处理矩形特殊情况
    if (type === 'Rectangle') {
      type = 'Circle';
      geometryFunction = createBox();
    }

    // 创建绘制交互
    this.draw = new Draw({
      source: this.source,
      type: type as any,
      geometryFunction: geometryFunction,
      style: (feature) => {
        return this.createFeatureStyle(feature as Feature);
      }
    });

    // 添加绘制交互
    this.mapInstance.addInteraction(this.draw);
    
    // 创建捕捉交互
    this.snap = new Snap({
      source: this.source
    });
    
    // 添加捕捉交互
    this.mapInstance.addInteraction(this.snap);

    // 添加绘制结束事件监听
    this.drawListener = this.draw.on('drawend', this.handleDrawEnd.bind(this));
    
    // 更新鼠标样式
    if (this.mapInstance.getTargetElement()) {
      this.mapInstance.getTargetElement().style.cursor = 'crosshair';
    }
  }

  /**
   * 移除交互
   */
  private removeInteraction(): void {
    if (!this.mapInstance) return;

    // 移除绘制交互
    if (this.draw) {
      this.mapInstance.removeInteraction(this.draw);
      this.draw = null;
    }
    
    // 移除捕捉交互
    if (this.snap) {
      this.mapInstance.removeInteraction(this.snap);
      this.snap = null;
    }
    
    // 移除绘制事件监听器
    if (this.drawListener) {
      unByKey(this.drawListener);
      this.drawListener = null;
    }
    
    // 恢复鼠标样式
    if (this.mapInstance.getTargetElement()) {
      this.mapInstance.getTargetElement().style.cursor = '';
    }
  }

  /**
   * 处理绘制结束事件
   * @param evt 事件对象
   */
  private handleDrawEnd(evt: any): void {
    if (!this.currentType) return;
    
    // 获取绘制的要素
    const feature = evt.feature;
    
    // 设置要素ID
    const id = `shape-${this.currentType}-${Date.now()}-${this.idCounter++}`;
    feature.setId(id);
    feature.set('shapeType', this.currentType);
    
    // 保存要素
    this.shapes.set(id, feature);
    
    this.log('info', `绘制完成，创建图形: ${id}`);
    
    // 触发图层更新
    if (this.layer) {
      this.layer.changed();
    }
  }

  /**
   * 创建要素样式
   * @param feature 要素
   * @returns 样式
   */
  private createFeatureStyle(feature: Feature): Style | Style[] {
    const geometry = feature.getGeometry();
    
    if (!geometry) return new Style();
    
    // 创建基本样式
    const baseStyle = new Style({
      stroke: new Stroke({
        color: this.style.stroke?.color || 'rgba(24, 144, 255, 1)',
        width: this.style.stroke?.width || 2,
        lineDash: this.style.stroke?.lineDash || []
      }),
      fill: new Fill({
        color: this.style.fill?.color || 'rgba(24, 144, 255, 0.2)'
      })
    });
    
    // 创建顶点样式的辅助函数
    const createVertexStyles = (coordinates: number[][]): Style[] => {
      return coordinates.map(coord => new Style({
        geometry: new Point(coord),
      }));
    };
    
    // 根据不同几何类型添加顶点样式
    const styles = [baseStyle];
    
    if (geometry instanceof LineString) {
      // 添加线条顶点
      const coordinates = geometry.getCoordinates();
      styles.push(...createVertexStyles(coordinates));
    } 
    else if (geometry instanceof Polygon) {
      // 添加多边形顶点
      const coordinates = geometry.getCoordinates()[0];
      // 不添加最后一个点，因为它与第一个点重复
      styles.push(...createVertexStyles(coordinates.slice(0, -1)));
    } 
    else if (geometry instanceof Circle) {
      // 添加圆心
      const center = geometry.getCenter();
      styles.push(new Style({
        geometry: new Point(center),
      }));
    }
    
    return styles;
  }

  /**
   * 清除所有图形
   */
  public clear(): void {
    if (!this.source) return;
    
    this.source.clear();
    this.shapes?.clear();
    this.log('info', '已清除所有图形');
  }

  /**
   * 获取所有图形
   * @returns 图形ID数组
   */
  public getAllShapes(): string[] {
    return Array.from(this.shapes.keys());
  }

  /**
   * 获取图形数量
   * @returns 图形数量
   */
  public getShapeCount(): number {
    return this.shapes.size;
  }

  /**
   * 删除指定图形
   * @param id 图形ID
   * @returns 是否删除成功
   */
  public removeShape(id: string): boolean {
    const feature = this.shapes.get(id);
    
    if (!feature) {
      this.log('warn', `图形 ${id} 不存在`);
      return false;
    }
    
    this.source.removeFeature(feature);
    this.shapes.delete(id);
    
    this.log('info', `已删除图形 ${id}`);
    return true;
  }

  /**
   * 是否已启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    this.disable();

    // 移除图层
    if (this.mapInstance && this.layer) {
      this.mapInstance.removeLayer(this.layer);
    }

    // 清空资源
    this.layer = null;
    this.mapInstance = null;
    this.source = new VectorSource();
    this.enabled = false;
    this.shapes?.clear();

    this.log('debug', '图形对象已销毁');
  }
}

/**
 * 创建图形对象工厂函数
 */
export function createShapeObject(mapInstance?: OlMap): ShapeObject {
  logger.debug('[Shape] 通过工厂函数创建图形对象');
  return new ShapeObject(mapInstance || null);
}

export default ShapeObject; 