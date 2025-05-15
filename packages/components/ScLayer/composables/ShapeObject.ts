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
import { fromLonLat, transformExtent, toLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';
import { ShapeStyle, Shape, ShapeOption, ShapePoint, DEFAULT_SHAPE_STYLE } from '../types/shape';
import logger from './LogObject';
import { DataType } from '../types';
// 导入ol-ext的ModifyFeature交互
import 'ol-ext/dist/ol-ext.css';
import OLModifyFeature from 'ol-ext/interaction/ModifyFeature';

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
  // 删除模式状态
  private deleteMode: boolean = false;
  // 点击监听器 - 用于删除模式
  private clickListener: EventsKey | null = null;
  // 编辑相关属性
  private editInteraction: OLModifyFeature | null = null;
  private editFeatureId: string | null = null;
  private editMode: boolean = false;
  private shapeUpdateCallback: ((id: string, shapeType: ShapeType, feature: Feature) => void) | null = null;

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
    
    // 检查是否处于编辑模式
    const isEditMode = feature.get('editMode') === true;
    
    // 获取自定义样式或使用默认样式
    const customStyle = feature.get('style');
    const styleToUse = customStyle || this.style;
    
    // 根据特征创建主样式
    const mainStyle = new Style({
      stroke: new Stroke({
        color: isEditMode ? 'rgba(0, 120, 255, 1)' : (styleToUse.stroke?.color || 'rgba(24, 144, 255, 1)'),
        width: isEditMode ? 3 : (styleToUse.stroke?.width || 2),
        lineDash: isEditMode ? [5, 5] : (styleToUse.stroke?.lineDash || [])
      }),
      fill: new Fill({
        color: isEditMode ? 'rgba(0, 120, 255, 0.3)' : (styleToUse.fill?.color || 'rgba(24, 144, 255, 0.2)')
      })
    });
    
    styles.push(mainStyle);
    
    // 为多边形创建顶点样式，编辑模式下才显示顶点
    if (isEditMode) {
      const geometry = feature.getGeometry();
      if (geometry instanceof Polygon) {
        const createVertexStyles = (coordinates: number[][]): Style[] => {
          return coordinates.map(coord => new Style({
            geometry: new Point(coord),
            image: new CircleStyle({
              radius: 6,
              stroke: new Stroke({
                color: 'rgba(0, 120, 255, 1)',
                width: 2
              }),
              fill: new Fill({
                color: 'rgba(255, 255, 255, 0.8)'
              })
            })
          }));
        };
        
        const coordinates = geometry.getCoordinates()[0];
        styles.push(...createVertexStyles(coordinates));
      } else if (geometry instanceof LineString) {
        // 为线段添加顶点样式
        const createVertexStyles = (coordinates: number[][]): Style[] => {
          return coordinates.map(coord => new Style({
            geometry: new Point(coord),
            image: new CircleStyle({
              radius: 6,
              stroke: new Stroke({
                color: 'rgba(0, 120, 255, 1)',
                width: 2
              }),
              fill: new Fill({
                color: 'rgba(255, 255, 255, 0.8)'
              })
            })
          }));
        };
        
        styles.push(...createVertexStyles(geometry.getCoordinates()));
      } else if (geometry instanceof Circle) {
        // 为圆形添加中心点和边缘点样式
        const center = geometry.getCenter();
        const radius = geometry.getRadius();
        
        // 添加中心点
        styles.push(new Style({
          geometry: new Point(center),
          image: new CircleStyle({
            radius: 6,
            stroke: new Stroke({
              color: '#00ff00',
              width: 2
            }),
            fill: new Fill({
              color: 'rgba(0, 255, 0, 0.3)'
            })
          })
        }));
        
        // 添加圆周上的控制点（东南西北四个点）
        const angles = [0, Math.PI/2, Math.PI, Math.PI*3/2];
        angles.forEach(angle => {
          const x = center[0] + radius * Math.cos(angle);
          const y = center[1] + radius * Math.sin(angle);
          
          styles.push(new Style({
            geometry: new Point([x, y]),
            image: new CircleStyle({
              radius: 6,
              stroke: new Stroke({
                color: 'rgba(0, 120, 255, 1)',
                width: 2
              }),
              fill: new Fill({
                color: 'rgba(255, 255, 255, 0.8)'
              })
            })
          }));
        });
      }
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
   * 获取所有图形ID
   * @returns 图形ID数组
   */
  public getAllShapeDatas(): string[] {
    // return Array.from(this.shapes.keys());
    return Array.from(this.shapes.keys()).map(it => {
      return this.shapes.get(it).get('data');
    });
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
   * 启用编辑模式
   * 使用ol-ext的ModifyFeature交互编辑图形
   * @returns 是否成功启用编辑模式
   */
  public enableEditMode(): boolean {
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法启用编辑模式');
      return false;
    }

    // 如果已经处于编辑模式，先禁用
    if (this.editMode) {
      this.disableEditMode();
    }

    // 如果正在删除模式，先彻底禁用删除模式
    if (this.deleteMode) {
      this.disableDeleteMode();
      
      // 确保地图上的删除监听器被完全清理
      if ((this.mapInstance as any)._deleteClickListener) {
        this.mapInstance.un('click', (this.mapInstance as any)._deleteClickListener);
        delete (this.mapInstance as any)._deleteClickListener;
        this.log('debug', '已移除地图上的删除模式点击监听器');
      }
    }

    // 获取当前图层的数据源
    const source = this.source;
    if (!source) {
      this.log('warn', '图形数据源不存在，无法启用编辑模式');
      return false;
    }

    try {
      // 创建ModifyFeature交互，参考https://viglino.github.io/ol-ext/examples/interaction/map.interaction.modifyfeature.html
      this.editInteraction = new OLModifyFeature({
        source: source,
        // 使用更精细的样式，提高编辑交互体验
        style: (feature: Feature, resolution: number) => {
          // 生成基本样式
          const baseStyle = this.createFeatureStyle(feature);
          
          // 如果是数组，返回第一个样式
          if (Array.isArray(baseStyle)) {
            return baseStyle;
          }
          
          return baseStyle;
        },
        // 设置编辑点的样式
        pointStyle: new Style({
          image: new CircleStyle({
            radius: 8,
            stroke: new Stroke({
              color: '#0000ff',
              width: 2
            }),
            fill: new Fill({
              color: 'rgba(0, 0, 255, 0.3)'
            })
          })
        }),
        // 编辑时显示中心点
        centerStyle: new Style({
          image: new CircleStyle({
            radius: 6,
            stroke: new Stroke({
              color: '#00ff00',
              width: 2
            }),
            fill: new Fill({
              color: 'rgba(0, 255, 0, 0.3)'
            })
          })
        }),
        // 设置更大的像素容差，便于捕捉顶点
        pixelTolerance: 15,
        // 显示调整中心点的控制点
        enableCenter: true
      });

      // 添加修改开始监听
      this.editInteraction.on('modifystart', (e: any) => {
        const feature = e.features.item(0);
        if (feature) {
          this.editFeatureId = feature.get('id') || feature.getId();
          
          // 高亮显示正在编辑的图形
          feature.set('editMode', true);
          
          this.log('debug', `开始编辑图形: ${this.editFeatureId}`);
          
          // 触发自定义事件 - shape-edit-start
          this.dispatchShapeEvent('shape-edit-start', this.editFeatureId, feature.get('shapeType'), feature);
        }
      });

      // 添加修改中监听
      this.editInteraction.on('modifying', (e: any) => {
        const feature = e.features.item(0);
        if (feature) {
          const featureId = feature.get('id') || feature.getId();
          this.log('debug', `正在编辑图形: ${featureId}`);
          
          // 触发自定义事件 - shape-editing
          this.dispatchShapeEvent('shape-editing', featureId, feature.get('shapeType'), feature);
        }
      });

      // 添加修改结束监听
      this.editInteraction.on('modifyend', (e: any) => {
        const feature = e.features.item(0);
        if (feature && this.editFeatureId) {
          // 标记不再是编辑模式
          feature.set('editMode', false);
          
          this.log('info', `图形编辑完成: ${this.editFeatureId}`);
          
          // 获取图形类型
          const shapeType = feature.get('shapeType') as ShapeType;
          
          // 更新图形数据
          this.updateFeatureData(feature);
          
          // 触发更新回调
          if (this.shapeUpdateCallback) {
            this.shapeUpdateCallback(this.editFeatureId, shapeType, feature);
          }
          
          // 触发自定义事件 - shape-update
          this.dispatchShapeEvent('shape-update', this.editFeatureId, shapeType, feature);
        }
      });

      // 将交互添加到地图
      this.mapInstance.addInteraction(this.editInteraction);
      this.editMode = true;

      // 改变鼠标光标样式，提示用户处于编辑模式
      if (this.mapInstance.getTargetElement()) {
        this.mapInstance.getTargetElement().style.cursor = 'crosshair';
      }

      this.log('info', '图形编辑模式已启用');
      return true;
    } catch (error) {
      this.log('error', '启用编辑模式失败:', error);
      return false;
    }
  }
  
  /**
   * 更新特征数据
   * 当图形编辑完成时，更新内部数据结构
   * @param feature 编辑后的特征
   */
  private updateFeatureData(feature: Feature): void {
    try {
      const id = feature.get('id') || feature.getId();
      if (!id || !this.shapes.has(id)) {
        this.log('warn', `无法更新图形数据，ID不存在: ${id}`);
        return;
      }
      
      const shapeType = feature.get('shapeType') as ShapeType;
      const geometry = feature.getGeometry();
      
      if (!geometry) {
        this.log('warn', '几何对象为空，无法更新数据');
        return;
      }
      
      // 获取原始数据
      const data = feature.get('data') || {};
      
      // 根据图形类型更新坐标数据
      switch (shapeType) {
        case 'Circle':
          if (geometry instanceof Circle) {
            const center = toLonLat(geometry.getCenter());
            const radius = geometry.getRadius();
            data.center = center;
            data.radius = radius;
          }
          break;
          
        case 'LineString':
          if (geometry instanceof LineString) {
            const coordinates = geometry.getCoordinates().map(coord => toLonLat(coord));
            data.coordinates = coordinates;
          }
          break;
          
        case 'Polygon':
        case 'Rectangle':
        case 'Square':
          if (geometry instanceof Polygon) {
            const coordinates = geometry.getCoordinates()[0].map(coord => toLonLat(coord));
            data.coordinates = coordinates;
            // 对于矩形和正方形，更新边界框
            if (shapeType === 'Rectangle' || shapeType === 'Square') {
              const extent = geometry.getExtent();
              const minCoord = toLonLat([extent[0], extent[1]]);
              const maxCoord = toLonLat([extent[2], extent[3]]);
              data.coordinates = [minCoord, maxCoord];
            }
          }
          break;
          
        case 'Point':
          if (geometry instanceof Point) {
            const coordinates = toLonLat(geometry.getCoordinates());
            data.coordinates = coordinates;
          }
          break;
      }
      
      // 更新特征的数据属性
      feature.set('data', data);
      feature.set('updatedAt', new Date().toISOString());
      
      // 更新shapes Map中的对象
      this.shapes.set(id, feature);
      
      this.log('debug', `图形数据已更新: ${id}, 类型: ${shapeType}`);
    } catch (error) {
      this.log('error', '更新图形数据时出错:', error);
    }
  }
  
  /**
   * 禁用编辑模式
   */
  public disableEditMode(): void {
    if (!this.mapInstance) {
      return;
    }

    // 恢复鼠标光标样式
    if (this.mapInstance.getTargetElement()) {
      this.mapInstance.getTargetElement().style.cursor = '';
    }

    // 移除编辑交互
    if (this.editInteraction) {
      // 移除所有事件监听
      this.editInteraction.un('modifystart');
      this.editInteraction.un('modifying');
      this.editInteraction.un('modifyend');
      
      // 从地图中移除交互
      this.mapInstance.removeInteraction(this.editInteraction);
      this.editInteraction = null;
    }

    // 清除所有图形的编辑状态
    // 不仅仅清除当前编辑的图形，还要检查所有图形，确保没有遗留的编辑状态
    this.shapes.forEach((feature, id) => {
      if (feature.get('editMode') === true) {
        feature.set('editMode', false);
        this.log('debug', `清除图形 ${id} 的编辑状态`);
      }
    });

    // 清除编辑状态
    if (this.editFeatureId) {
      this.log('debug', `编辑模式停用，清除编辑图形ID: ${this.editFeatureId}`);
      this.editFeatureId = null;
    }
    
    this.editMode = false;
    this.log('info', '图形编辑模式已禁用');
  }

  /**
   * 设置图形更新回调
   * @param callback 更新回调函数
   */
  public setShapeUpdateCallback(callback: (id: string, shapeType: ShapeType, feature: Feature) => void): void {
    this.shapeUpdateCallback = callback;
  }

  /**
   * 检查是否处于编辑模式
   * @returns 是否处于编辑模式
   */
  public isEditMode(): boolean {
    return this.editMode;
  }

  /**
   * 触发图形相关事件
   * @param eventName 事件名称
   * @param id 图形ID
   * @param shapeType 图形类型
   * @param feature 图形要素
   */
  private dispatchShapeEvent(eventName: string, id: string, shapeType: ShapeType, feature: Feature): void {
    if (!this.mapInstance) return;
    
    const map = this.mapInstance;
    const target = map.getTargetElement();
    
    if (target) {
      // 创建一个自定义事件
      const event = new CustomEvent(eventName, {
        bubbles: true,
        detail: {
          id,
          type: shapeType,
          feature,
          shapeObj: this
        }
      });
      
      // 在地图元素上分发事件
      target.dispatchEvent(event);
      
      this.log('debug', `触发事件 "${eventName}" 于图形 ${id}`);
    }
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
    
    // 禁用编辑模式
    this.disableEditMode();
    
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

  /**
   * 启用删除模式
   * 允许用户通过点击删除图形
   */
  public enableDeleteMode(): void {
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法启用删除模式');
      return;
    }

    // 如果已经启用删除模式，则不做操作
    if (this.deleteMode) {
      return;
    }

    // 如果当前在绘制模式，先禁用绘制
    if (this.enabled) {
      this.disable();
    }

    // 添加点击监听
    this.clickListener = this.mapInstance.on('click', (event) => {
      if (!this.deleteMode) return;

      // 获取点击位置的图形
      const feature = this.mapInstance!.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      
      if (feature) {
        // 检查是否是我们的图形
        const shapeId = feature.get('shapeId');
        if (shapeId && this.shapes.has(shapeId)) {
          // 删除图形
          this.removeShape(shapeId);
          this.log('info', `删除模式: 已删除图形 ID=${shapeId}`);
        }
      }
    });

    this.deleteMode = true;
    this.log('info', '删除模式已启用');
  }

  /**
   * 禁用删除模式
   */
  public disableDeleteMode(): void {
    if (!this.deleteMode) {
      return;
    }

    // 移除点击监听
    if (this.clickListener) {
      unByKey(this.clickListener);
      this.clickListener = null;
    }

    this.deleteMode = false;
    this.log('info', '删除模式已禁用');
  }

  /**
   * 检查是否处于删除模式
   */
  public isDeleteMode(): boolean {
    return this.deleteMode;
  }

  /**
   * 获取编辑模式信息
   * @returns 编辑模式状态信息
   */
  public getEditModeInfo(): { enabled: boolean; editingFeatureId: string | null } {
    return {
      enabled: this.editMode,
      editingFeatureId: this.editFeatureId
    };
  }

  /**
   * 判断指定的图形是否可编辑
   * @param id 图形ID
   * @returns 是否可编辑
   */
  public isFeatureEditable(id: string): boolean {
    // 检查图形是否存在
    if (!this.shapes.has(id)) {
      return false;
    }
    
    // 如果当前不在编辑模式，所有图形都不可编辑
    if (!this.editMode) {
      return false;
    }
    
    // 如果当前正在编辑其他图形，这个图形不可编辑
    if (this.editFeatureId && this.editFeatureId !== id) {
      return false;
    }
    
    return true;
  }

  /**
   * 根据ID获取图形特征
   * @param id 图形ID
   * @returns 图形特征，不存在时返回null
   */
  public getShapeById(id: string): Feature | null {
    if (!this.shapes.has(id)) {
      this.log('warn', `图形ID不存在: ${id}`);
      return null;
    }
    
    return this.shapes.get(id) || null;
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