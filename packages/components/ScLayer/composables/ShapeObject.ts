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
import { createBox, createRegularPolygon } from 'ol/interaction/Draw';
import { fromLonLat, transformExtent } from 'ol/proj';
import { getCenter } from 'ol/extent';
import { ShapeStyle, Shape, ShapeOption, ShapePoint, DEFAULT_SHAPE_STYLE } from '../types/shape';
import logger from './LogObject';
import { DataType } from '../types';

// 图形模块日志前缀
const LOG_MODULE = 'Shape';

// 图形类型
export type ShapeType = 'Point' | 'LineString' | 'Polygon' | 'Circle' | 'Rectangle' | 'Square';

// 图形配置接口
export interface ShapeOptions {
  id?: string;
  type: ShapeType;
  style?: ShapeStyle;
  data?: any;
}

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
  private style: ShapeStyle = DEFAULT_SHAPE_STYLE;
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
  // 新增绘制完成回调类型
  private drawEndCallback: ((id: string, shapeType: ShapeType, feature: Feature) => void) | null = null;

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
    this.style = { ...DEFAULT_SHAPE_STYLE, ...style };
    
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

    this.removeInteraction();
    this.currentType = null;
    this.enabled = false;

    this.log('info', '图形绘制功能已禁用');
  }

  /**
   * 添加绘制交互
   */
  private addInteraction(): void {
    if (!this.mapInstance) return;

    let geometryFunction;
    let type = this.currentType as string;

    // 根据不同类型创建不同的绘制交互
    switch (this.currentType) {
      case 'Rectangle':
        type = 'Circle';
        geometryFunction = createBox();
        break;
      case 'Square':
        type = 'Circle';
        geometryFunction = createRegularPolygon(4);
        break;
      default:
        break;
    }

    // 创建绘制交互
    this.draw = new Draw({
      source: this.source,
      type: type as any,
      geometryFunction: geometryFunction
    });

    // 添加绘制完成事件监听
    this.drawListener = this.draw.on('drawend', this.handleDrawEnd.bind(this));

    // 添加交互到地图
    this.mapInstance.addInteraction(this.draw);

    // 创建捕捉交互
    this.snap = new Snap({ source: this.source });
    this.mapInstance.addInteraction(this.snap);
  }

  /**
   * 移除绘制交互
   */
  private removeInteraction(): void {
    if (!this.mapInstance) return;

    // 移除事件监听
    if (this.drawListener) {
      unByKey(this.drawListener);
      this.drawListener = null;
    }

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
  }

  /**
   * 设置绘制完成回调函数
   * @param callback 回调函数，参数为图形ID、图形类型和图形特征
   */
  public setDrawEndCallback(callback: (id: string, shapeType: ShapeType, feature: Feature) => void): void {
    this.drawEndCallback = callback;
    this.log('debug', '已设置绘制完成回调函数');
  }

  /**
   * 处理绘制完成事件
   * @param evt 事件对象
   */
  private handleDrawEnd(evt: any): void {
    const feature = evt.feature as Feature;
    
    // 生成唯一ID
    const id = `shape-${Date.now()}-${this.idCounter++}`;
    feature.setId(id);
    feature.set('dataType', DataType.SHAPE);
    feature.set('data', {
      type: this.currentType,
      //@ts-ignore
      coordinates: feature.getGeometry()?.getCoordinates(),
      style: this.style,
      id: id,
      dataType: DataType.SHAPE
    });
    // 设置属性
    feature.set('shapeType', this.currentType);
    feature.set('createdAt', new Date().toISOString());
    
    // 添加到图形映射
    this.shapes.set(id, feature);
    
    this.log('info', `图形绘制完成，类型: ${this.currentType}, ID: ${id}`);
    
    // 如果设置了回调函数，调用回调函数通知绘制完成
    if (this.drawEndCallback && this.currentType) {
      this.drawEndCallback(id, this.currentType, feature);
    }
  }

  /**
   * 创建特征样式
   * @param feature 特征
   * @returns 样式对象
   */
  private createFeatureStyle(feature: Feature): Style | Style[] {
    const styles: Style[] = [];
    
    // 根据特征创建主样式
    const mainStyle = new Style({
      stroke: new Stroke({
        color: this.style.stroke?.color || 'rgba(24, 144, 255, 1)',
        width: this.style.stroke?.width || 2,
        lineDash: this.style.stroke?.lineDash || []
      }),
      fill: new Fill({
        color: this.style.fill?.color || 'rgba(24, 144, 255, 0.2)'
      })
    });
    
    styles.push(mainStyle);
    
    // 为多边形创建顶点样式
    const geometry = feature.getGeometry();
    if (geometry instanceof Polygon) {
      const createVertexStyles = (coordinates: number[][]): Style[] => {
        return coordinates.map(coord => new Style({
          geometry: new Point(coord),
        }));
      };
      
      const coordinates = geometry.getCoordinates()[0];
      styles.push(...createVertexStyles(coordinates));
    }
    
    return styles;
  }

  /**
   * 清除所有图形
   */
  public clear(): void {
    this.source.clear();
    this.shapes.clear();
    this.log('info', '所有图形已清除');
  }

  /**
   * 清除所有图形（别名，保持兼容性）
   */
  public clearAllShapes(): void {
    this.clear();
  }

  /**
   * 获取所有图形ID
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
   * 移除指定ID的图形
   * @param id 图形ID
   * @returns 是否成功移除
   */
  public removeShape(id: string): boolean {
    const feature = this.shapes.get(id);
    if (!feature) {
      this.log('warn', `图形ID不存在: ${id}`);
      return false;
    }
    
    this.source.removeFeature(feature);
    this.shapes.delete(id);
    
    this.log('info', `图形已移除, ID: ${id}`);
    return true;
  }

  /**
   * 更新指定ID的图形
   * @param id 图形ID
   * @param options 更新选项
   * @returns 是否成功更新
   */
  public updateShape(id: string, options: Partial<ShapeOption>): boolean {
    const feature = this.shapes.get(id);
    if (!feature) {
      this.log('warn', `更新图形失败，ID不存在: ${id}`);
      return false;
    }

    try {
      // 更新样式
      if (options.style) {
        feature.set('style', options.style);
      }

      // 更新附加数据
      if (options.data) {
        feature.set('data', options.data);
      }

      // 更新时间戳
      feature.set('updatedAt', new Date().toISOString());

      // 触发图层刷新
      if (this.layer) {
        this.layer.changed();
      }

      this.log('info', `图形已更新, ID: ${id}`);
      return true;
    } catch (error) {
      this.log('error', `更新图形失败:`, error);
      return false;
    }
  }

  /**
   * 检查是否启用绘图
   * @returns 是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 销毁图形对象
   */
  public destroy(): void {
    // 移除交互
    this.removeInteraction();
    
    // 移除图层
    if (this.mapInstance && this.layer) {
      this.mapInstance.removeLayer(this.layer);
    }
    
    // 清除数据
    this.source.clear();
    this.shapes.clear();
    
    this.layer = null;
    this.mapInstance = null;
    
    this.log('info', '图形对象已销毁');
  }

  /**
   * 添加图形
   * @param options 图形选项
   * @returns 图形ID
   */
  public addShape(options: ShapeOption): string {
    if (!this.mapInstance || !this.layer) {
      this.log('warn', '地图实例未设置，无法添加图形');
      return '';
    }

    // 确保图层已添加到地图
    if (!this.isLayerAdded()) {
      this.mapInstance.addLayer(this.layer);
    }
    options.dataType = DataType.SHAPE;
    // 生成唯一ID
    const id = options.id || `shape-${Date.now()}-${this.idCounter++}`;
    let feature: Feature | null = null;

    try {
      // 根据图形类型创建不同的几何对象
      switch (options.type) {
        case Shape.POINT:
          if (!options.coordinates || !Array.isArray(options.coordinates)) {
            throw new Error('点必须提供coordinates属性');
          }
          feature = new Feature({
            geometry: new Point(fromLonLat(options.coordinates as number[]))
          });
          break;

        case Shape.LINE:
          if (!options.coordinates || !Array.isArray(options.coordinates[0])) {
            throw new Error('线必须提供coordinates属性，格式为二维数组');
          }
          feature = new Feature({
            geometry: new LineString((options.coordinates as number[][]).map(coord => fromLonLat(coord)))
          });
          break;

        case Shape.POLYGON:
          if (!options.coordinates && !options.points) {
            throw new Error('多边形必须提供coordinates或points属性');
          }
          
          let coords: number[][];
          if (options.points) {
            coords = options.points.map(point => fromLonLat([point.x, point.y]));
          } else {
            coords = (options.coordinates as number[][]).map(coord => fromLonLat(coord));
          }
          
          // 确保多边形闭合
          if (coords.length > 2 && (coords[0][0] !== coords[coords.length - 1][0] || 
                                    coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push([coords[0][0], coords[0][1]]);
          }
          
          feature = new Feature({
            geometry: new Polygon([coords])
          });
          break;

        case Shape.CIRCLE:
          if (!options.center || !options.radius) {
            throw new Error('圆形必须提供center和radius属性');
          }
          feature = new Feature({
            geometry: new Circle(fromLonLat(options.center), options.radius)
          });
          break;

        case Shape.RECTANGLE:
          if (!options.coordinates && !(options.center && options.width && options.height)) {
            throw new Error('矩形必须提供coordinates或center/width/height属性');
          }
          
          let rectangle: number[][];
          if (options.center && options.width && options.height) {
            const center = fromLonLat(options.center);
            const halfWidth = options.width / 2;
            const halfHeight = options.height / 2;
            
            rectangle = [
              [center[0] - halfWidth, center[1] - halfHeight],
              [center[0] + halfWidth, center[1] - halfHeight],
              [center[0] + halfWidth, center[1] + halfHeight],
              [center[0] - halfWidth, center[1] + halfHeight],
              [center[0] - halfWidth, center[1] - halfHeight]  // 闭合多边形
            ];
          } else {
            const coords = options.coordinates as number[][];
            rectangle = [
              fromLonLat(coords[0]),
              fromLonLat([coords[1][0], coords[0][1]]),
              fromLonLat(coords[1]),
              fromLonLat([coords[0][0], coords[1][1]]),
              fromLonLat(coords[0])  // 闭合多边形
            ];
          }
          
          feature = new Feature({
            geometry: new Polygon([rectangle])
          });
          break;

        case Shape.SQUARE:
          if (!options.center && !options.width) {
            throw new Error('正方形必须提供center和width属性');
          }
          
          const center = fromLonLat(options.center as number[]);
          const halfSize = (options.width as number) / 2;
          
          const square = [
            [center[0] - halfSize, center[1] - halfSize],
            [center[0] + halfSize, center[1] - halfSize],
            [center[0] + halfSize, center[1] + halfSize],
            [center[0] - halfSize, center[1] + halfSize],
            [center[0] - halfSize, center[1] - halfSize]  // 闭合多边形
          ];
          
          feature = new Feature({
            geometry: new Polygon([square])
          });
          break;

        default:
          throw new Error(`不支持的图形类型: ${options.type}`);
      }

      // 设置特征属性
      feature.setId(id);
      feature.set('shapeType', options.type);
      feature.set('createdAt', new Date().toISOString());
      
      if (options.data) {
        feature.set('data', options);
      }
      
      // 设置自定义样式
      if (options.style) {
        feature.set('style', options.style);
      }
      
      // 添加到图层
      this.source.addFeature(feature);
      this.shapes.set(id, feature);
      
      this.log('info', `图形已添加, 类型: ${options.type}, ID: ${id}`);
      return id;
    } catch (error) {
      this.log('error', `添加图形失败:`, error);
      return '';
    }
  }

  /**
   * 添加点
   * @param center 中心点坐标 [longitude, latitude]
   * @param options 其他选项
   * @returns 图形ID
   */
  public addPoint(center: number[], options?: Partial<ShapeOption>): string {
    const shapeOptions: ShapeOption = {
      type: Shape.POINT,
      coordinates: center,
      ...options
    };
    
    return this.addShape(shapeOptions);
  }

  /**
   * 添加线段
   * @param coordinates 坐标点数组 [[lon1, lat1], [lon2, lat2], ...]
   * @param options 其他选项
   * @returns 图形ID
   */
  public addLine(coordinates: number[][], options?: Partial<ShapeOption>): string {
    const shapeOptions: ShapeOption = {
      type: Shape.LINE,
      coordinates: coordinates,
      ...options
    };
    
    return this.addShape(shapeOptions);
  }

  /**
   * 添加多边形
   * @param coordinates 坐标点数组 [[lon1, lat1], [lon2, lat2], ...]
   * @param options 其他选项
   * @returns 图形ID
   */
  public addPolygon(coordinates: number[][], options?: Partial<ShapeOption>): string {
    const shapeOptions: ShapeOption = {
      type: Shape.POLYGON,
      coordinates: coordinates,
      ...options
    };
    
    return this.addShape(shapeOptions);
  }

  /**
   * 添加圆形
   * @param center 中心点坐标 [longitude, latitude]
   * @param radius 半径（米）
   * @param options 其他选项
   * @returns 图形ID
   */
  public addCircle(center: number[], radius: number, options?: Partial<ShapeOption>): string {
    const shapeOptions: ShapeOption = {
      type: Shape.CIRCLE,
      center: center,
      radius: radius,
      ...options
    };
    
    return this.addShape(shapeOptions);
  }

  /**
   * 添加矩形
   * @param minCoord 左下角坐标 [minLon, minLat]
   * @param maxCoord 右上角坐标 [maxLon, maxLat]
   * @param options 其他选项
   * @returns 图形ID
   */
  public addRectangle(minCoord: number[], maxCoord: number[], options?: Partial<ShapeOption>): string {
    const shapeOptions: ShapeOption = {
      type: Shape.RECTANGLE,
      coordinates: [minCoord, maxCoord],
      ...options
    };
    
    return this.addShape(shapeOptions);
  }

  /**
   * 添加正方形
   * @param center 中心点坐标 [longitude, latitude]
   * @param width 正方形边长（米）
   * @param options 其他选项
   * @returns 图形ID
   */
  public addSquare(center: number[], width: number, options?: Partial<ShapeOption>): string {
    const shapeOptions: ShapeOption = {
      type: Shape.SQUARE,
      center: center,
      width: width,
      ...options
    };
    
    return this.addShape(shapeOptions);
  }
}

/**
 * 创建图形对象工厂函数
 * @param mapInstance 地图实例
 * @returns 图形对象
 */
export function createShapeObject(mapInstance?: OlMap): ShapeObject {
  return new ShapeObject(mapInstance);
} 