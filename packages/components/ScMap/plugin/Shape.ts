import { LatLng, LatLngBounds, LatLngTuple, Layer, LayerGroup, Map as LeafletMap, CircleMarkerOptions, PolylineOptions, PolygonOptions, PathOptions } from 'leaflet';
import L from 'leaflet';
import { info, error, warn } from "@repo/utils";
// 定义形状类型
export enum ShapeType {
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
  POLYGON = 'polygon',
  POLYLINE = 'polyline'
}

// 定义形状选项
/**
 * 形状选项接口
 * @interface ShapeOptions
 * @property {string} [id] - 形状的唯一标识符
 * @property {ShapeType} type - 形状类型
 * @property {string} [fillColor] - 填充颜色
 * @property {number} [fillOpacity] - 填充透明度,范围0-1
 * @property {string} [color] - 边框颜色
 * @property {number} [weight] - 边框宽度,单位像素
 * @property {number} [opacity] - 边框透明度,范围0-1
 * @property {string} [lineCap] - 线段端点样式:'butt'|'round'|'square'
 * @property {string} [lineJoin] - 线段连接处样式:'miter'|'round'|'bevel'
 * @property {string} [dashArray] - 虚线样式,如"5, 10"
 * @property {string} [dashOffset] - 虚线偏移量
 * @property {boolean} [fill] - 是否填充
 * @property {boolean} [stroke] - 是否显示边框
 * @property {number} [smoothFactor] - 平滑系数,值越大曲线越平滑
 * @property {number} [radius] - 圆形半径,单位米
 * @property {any} [data] - 用户自定义数据
 */
export interface ShapeOptions {
  id?: string;
  type: ShapeType;
  fillColor?: string;
  fillOpacity?: number;
  color?: string;
  weight?: number;
  opacity?: number;
  lineCap?: string;
  lineJoin?: string;
  dashArray?: string;
  dashOffset?: string;
  fill?: boolean;
  stroke?: boolean;
  smoothFactor?: number;
  radius?: number;
  data?: any;
}

export interface CircleOptions extends ShapeOptions {
  radius: number;
}

// 定义形状状态
/**
 * 形状状态接口
 * @interface ShapeState
 * @property {string} id - 形状的唯一标识符
 * @property {Layer} layer - Leaflet图层对象
 * @property {ShapeOptions} options - 形状的配置选项
 * @property {boolean} visible - 形状是否可见
 */
interface ShapeState {
  id: string;
  layer: Layer;
  options: ShapeOptions;
  visible: boolean;
}

// 定义事件类型
export type ShapeEventType = 'shape-created' | 'shape-removed' | 'drawing-start' | 'drawing-end' | 'drawing-cancel' | 'shapes-cleared';

// 定义事件监听器类型
export type ShapeEventListener = (shape: any) => void;

export default class Shape {
  private _map: LeafletMap;
  private _drawingType: ShapeType | null = null;
  private _drawingLayer: LayerGroup;
  private _drawingPoints: LatLng[] = [];
  private _tempLayer: Layer | null = null;
  private _isDrawing: boolean = false;
  private _drawingOptions: ShapeOptions = {
    type: ShapeType.POLYLINE,
    fillColor: '#3388ff',
    fillOpacity: 0.2,
    color: '#3388ff',
    weight: 3,
    opacity: 0.5,
    radius: 500
  };
  private shapesLayerGroup: L.LayerGroup;
  private drawingLayerGroup: L.LayerGroup;
  private shapes: Map<string, ShapeState> = new Map();
  private nextShapeId: number = 1;
  
  // 事件监听器存储
  private eventListeners: Record<ShapeEventType, ShapeEventListener[]> = {
    'shape-created': [],
    'shape-removed': [],
    'drawing-start': [],
    'drawing-end': [],
    'drawing-cancel': [],
    'shapes-cleared': []
  };
  
  constructor(map: LeafletMap) {
    try {
      info('ShapeTool构造函数被调用, map类型:', typeof map);
      if (!map) {
        throw new Error('地图实例未传入ShapeTool构造函数');
      }
      
      this._map = map;
      this._drawingLayer = new LayerGroup().addTo(this._map);
      this.shapesLayerGroup = L.layerGroup().addTo(this._map);
      this.drawingLayerGroup = L.layerGroup().addTo(this._map);
      info('ShapeTool初始化成功');
    } catch (e) {
      error('ShapeTool初始化失败:', e);
      throw e;
    }
  }

  /**
   * 获取Leaflet图形选项
   * @param options 绘制选项
   * @returns Leaflet图形选项
   */
  private getLeafletOptions(options?: Partial<ShapeOptions>): ShapeOptions {
    try {
      const mergedOptions = { ...this._drawingOptions, ...options };
      return {
        type: mergedOptions.type || ShapeType.POLYLINE,
        fillColor: mergedOptions.fillColor || mergedOptions.color || '#3388ff',
        fillOpacity: mergedOptions.fillOpacity !== undefined ? mergedOptions.fillOpacity : 0.2,
        color: mergedOptions.color || '#3388ff',
        weight: mergedOptions.weight || 3,
        opacity: mergedOptions.opacity !== undefined ? mergedOptions.opacity : 0.8,
        radius: mergedOptions.radius,
        lineCap: mergedOptions.lineCap,
        lineJoin: mergedOptions.lineJoin,
        dashArray: mergedOptions.dashArray,
        dashOffset: mergedOptions.dashOffset,
        fill: mergedOptions.fill,
        stroke: mergedOptions.stroke,
        smoothFactor: mergedOptions.smoothFactor
      };
    } catch (e) {
      error('获取Leaflet选项时出错:', e);
      // 返回默认选项
      return {
        type: ShapeType.POLYLINE,
        fillColor: '#3388ff',
        fillOpacity: 0.2,
        color: '#3388ff',
        weight: 3,
        opacity: 0.8,
        radius: 500,
        lineCap: 'butt',
        lineJoin: 'miter',
        dashArray: '',
        dashOffset: '',
        fill: true,
        stroke: true,
        smoothFactor: 1
      };
    }
  }

  /**
   * 开始绘制图形
   * @param type 图形类型
   * @param options 绘制选项
   */
  public startDrawing(type: ShapeType, options?: Partial<ShapeOptions>): void {
    info(`开始绘制 ${type}，选项:`, options);
    
    if (this._isDrawing) {
      info('取消之前的绘制');
      this.cancelDrawing();
    }
    
    this._drawingType = type;
    this._drawingPoints = [];
    this._drawingLayer.clearLayers();
    this._isDrawing = true;
    
    if (options) {
      this._drawingOptions = { ...this._drawingOptions, ...options, type };
    }
    
    const mapContainer = this._map.getContainer();
    if (mapContainer) {
      mapContainer.style.cursor = 'crosshair';
    }
    
    // 在开始绘制前禁用双击缩放，避免干扰绘制
    this._map.doubleClickZoom.disable();
    
    // 触发开始绘制事件
    this.fireEvent('drawing-start', { type });
    
    // 添加小延迟，确保地图状态稳定后再绑定事件
    setTimeout(() => {
      // 添加地图点击事件
      this._map.on('click', this.handleMapClick, this);
      
      // 添加鼠标移动事件（用于实时预览）
      this._map.on('mousemove', this.handleMouseMove, this);
      
      // 多边形和线段需要双击结束
      if (type === ShapeType.POLYGON || type === ShapeType.POLYLINE) {
        this._map.on('dblclick', this.handleMapDblClick, this);
      }
    }, 100);
  }

  /**
   * 停止绘制并保存图形
   */
  public stopDrawing(): void {
    if (!this._isDrawing) return;
    
    info('完成绘制');
    
    // 移除事件监听
    this._map.off('click', this.handleMapClick, this);
    this._map.off('mousemove', this.handleMouseMove, this);
    this._map.off('dblclick', this.handleMapDblClick, this);
    
    // 重置绘制状态
    this._isDrawing = false;
    
    // 恢复默认鼠标样式
    const mapContainer = this._map.getContainer();
    if (mapContainer) {
      mapContainer.style.cursor = '';
    }
    
    // 基于当前已收集的点创建最终图形
    if (this._drawingPoints.length > 0) {
      let createdShape: Layer | null = null;
      const type = this._drawingType;
      
      switch (type) {
        case ShapeType.CIRCLE:
          if (this._drawingPoints.length >= 2) {
            const center = this._drawingPoints[0];
            const radiusPoint = this._drawingPoints[1];
            const radius = center.distanceTo(radiusPoint);
            createdShape = this.createCircle(center, radius);
          }
          break;
          
        case ShapeType.RECTANGLE:
          if (this._drawingPoints.length >= 2) {
            const bounds = L.latLngBounds(this._drawingPoints[0], this._drawingPoints[1]);
            createdShape = this.createRectangle(bounds.getSouthWest(), bounds.getNorthEast());
          }
          break;
          
        case ShapeType.POLYGON:
          if (this._drawingPoints.length >= 3) {
            createdShape = this.createPolygon(this._drawingPoints);
          }
          break;
          
        case ShapeType.POLYLINE:
          if (this._drawingPoints.length >= 2) {
            createdShape = this.createPolyline(this._drawingPoints);
          }
          break;
      }
      
      // 如果成功创建了图形，触发图形创建事件
      if (createdShape) {
        this.fireEvent('drawing-end', { 
          type: type,
          shape: createdShape,
          points: this._drawingPoints 
        });
      }
    }
    
    // 清空绘制点和临时图层
    this._drawingPoints = [];
    this._drawingType = null;
    this._drawingLayer.clearLayers();
    this._tempLayer = null;
    
    // 延迟恢复双击缩放，确保不会意外触发
    setTimeout(() => {
      // 只有在地图实例仍然存在的情况下才恢复
      if (this._map) {
        info('恢复地图双击缩放功能');
        this._map.doubleClickZoom.enable();
      }
    }, 1000);
  }

  /**
   * 取消当前绘制，不保存图形
   */
  public cancelDrawing(): void {
    if (!this._isDrawing) return;
    
    info('取消绘制');
    
    // 移除事件监听
    this._map.off('click', this.handleMapClick, this);
    this._map.off('mousemove', this.handleMouseMove, this);
    this._map.off('dblclick', this.handleMapDblClick, this);
    
    // 重置绘制状态
    this._isDrawing = false;
    
    // 恢复默认鼠标样式
    const mapContainer = this._map.getContainer();
    if (mapContainer) {
      mapContainer.style.cursor = '';
    }
    
    // 清空绘制点和临时图层
    this._drawingPoints = [];
    this._drawingType = null;
    this._drawingLayer.clearLayers();
    this._tempLayer = null;
    
    // 延迟恢复双击缩放，确保不会意外触发
    setTimeout(() => {
      // 只有在地图实例仍然存在的情况下才恢复
      if (this._map) {
        info('恢复地图双击缩放功能');
        this._map.doubleClickZoom.enable();
      }
    }, 1000);
    
    // 触发取消绘制事件
    this.fireEvent('drawing-cancel', {});
  }

  /**
   * 处理地图点击事件
   */
  private handleMapClick = (e: any): void => {
    if (!this._isDrawing || !this._drawingType) return;
    
    // 忽略双击触发的点击
    if (e._stopped) {
      info('忽略已停止的点击事件');
      return;
    }
    
    const clickedPoint = e.latlng;
    
    // 多边形和线段的特殊处理
    if (this._drawingType === ShapeType.POLYGON || this._drawingType === ShapeType.POLYLINE) {
      // 检查这个点是否与最后一个点太近
      if (this._drawingPoints.length > 0) {
        const lastPoint = this._drawingPoints[this._drawingPoints.length - 1];
        const distance = lastPoint.distanceTo(clickedPoint);
        if (distance < 5) {  // 5像素内的点被视为重复
          info('点击位置与上一点太近，可能是双击操作的一部分，忽略');
          return;
        }
      }
      
      this._drawingPoints.push(clickedPoint);
      info(`添加${this._drawingType}点: ${this._drawingPoints.length}`);
      this.updatePreview();
      return;
    }
    
    // 其他图形类型的处理
    switch (this._drawingType) {
      case ShapeType.CIRCLE:
        // 圆形需要两次点击
        if (this._drawingPoints.length === 0) {
          // 第一次点击设置圆心
          this._drawingPoints.push(clickedPoint);
          info('设置圆心', clickedPoint);
        } else if (this._drawingPoints.length === 1) {
          // 第二次点击完成圆形
          const center = this._drawingPoints[0];
          const radius = center.distanceTo(clickedPoint);
          info('完成圆形，半径:', radius);
          
          // 添加第二个点
          this._drawingPoints.push(clickedPoint);
          
          // 创建圆形图层
          const circleOptions = this.getLeafletOptions();
          const circleLayer = this.createCircle(center, radius);
          
          // 清除临时图层和绘制点，为下一次绘制做准备
          this._drawingLayer.clearLayers();
          this._drawingPoints = [];
          this._tempLayer = null;
          
          // 触发图形创建事件，但保持绘制状态为激活
          this.fireEvent('drawing-end', { type: ShapeType.CIRCLE, center, radius });
          this.fireEvent('shape-created', { type: ShapeType.CIRCLE, center: [center.lat, center.lng], radius });
          
          // 确保_isDrawing状态保持为true，以便继续接收点击事件
          this._isDrawing = true;
        }
        break;
        
      case ShapeType.RECTANGLE:
        // 矩形需要两次点击
        if (this._drawingPoints.length === 0) {
          // 第一次点击设置第一个角点
          this._drawingPoints.push(clickedPoint);
          info('设置矩形第一个角点', clickedPoint);
        } else if (this._drawingPoints.length === 1) {
          // 第二次点击完成矩形
          const point1 = this._drawingPoints[0];
          this._drawingPoints.push(clickedPoint);
          info('完成矩形');
          
          try {
            // 创建矩形图层
            const rectangleLayer = this.createRectangle(point1, clickedPoint);
            info('矩形已创建并添加到地图');
          } catch (err) {
            error('创建矩形失败:', err);
          }
          
          // 清除临时图层和绘制点，为下一次绘制做准备
          this._drawingLayer.clearLayers();
          this._drawingPoints = [];
          this._tempLayer = null;
          
          // 确保_isDrawing状态保持为true，以便继续接收点击事件
          this._isDrawing = true;
        }
        break;
    }
  }

  /**
   * 处理鼠标移动事件，用于预览图形
   */
  private handleMouseMove = (e: any): void => {
    if (!this._isDrawing || !this._drawingType) return;
    
    const currentPoint = e.latlng;
    
    // 根据不同的绘制类型更新临时图形
    switch (this._drawingType) {
      case ShapeType.CIRCLE:
        if (this._drawingPoints.length === 1) {
          // 更新圆形预览
          const center = this._drawingPoints[0];
          const radius = center.distanceTo(currentPoint);
          this.updateCirclePreview(center, radius);
        }
        break;
        
      case ShapeType.RECTANGLE:
        if (this._drawingPoints.length === 1) {
          // 更新矩形预览
          const bounds = L.latLngBounds(this._drawingPoints[0], currentPoint);
          this.updateRectanglePreview(bounds);
        }
        break;
        
      case ShapeType.POLYGON:
      case ShapeType.POLYLINE:
        if (this._drawingPoints.length > 0) {
          // 更新多边形或线段预览
          this.updatePreview(currentPoint);
        }
        break;
    }
  }

  /**
   * 处理地图双击事件，用于结束多边形或线段的绘制
   */
  private handleMapDblClick = (e: any): boolean => {
    if (!this._isDrawing || !this._drawingType) {
      return false;
    }
    
    // 只处理多边形和线段的双击
    if (this._drawingType !== ShapeType.POLYGON && this._drawingType !== ShapeType.POLYLINE) {
      return false;
    }
    
    // 彻底阻止地图默认的双击缩放行为 - 加强版
    if (e.originalEvent) {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      e.originalEvent.stopImmediatePropagation();
    }
    
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e);
    L.DomEvent.stop(e);
    
    // 暂时禁用地图的双击缩放功能
    const zoomEnabled = this._map.doubleClickZoom.enabled();
    if (zoomEnabled) {
      this._map.doubleClickZoom.disable();
      
      // 200ms后恢复双击缩放功能，这时双击事件已经处理完毕
      setTimeout(() => {
        // 只有在地图实例仍然存在的情况下才恢复
        if (this._map) {
          this._map.doubleClickZoom.enable();
        }
      }, 1000);
    }
    
    e._stopped = true;
    
    // 确保有足够的点
    if (this._drawingPoints.length < 2) {
      info('点不足，忽略双击');
      return false;
    }
    
    // 获取双击点
    const doubleClickPoint = e.latlng;
    
    // 如果双击点与最后一个点距离足够远，添加为新的点
    if (this._drawingPoints.length > 0) {
      const lastPoint = this._drawingPoints[this._drawingPoints.length - 1];
      const distance = lastPoint.distanceTo(doubleClickPoint);
      
      if (distance >= 10) {
        this._drawingPoints.push(doubleClickPoint);
        info('将双击点添加为路径的最后一个点');
      }
    }
    
    // 复制当前的绘制点，用于创建图形
    const pointsCopy = [...this._drawingPoints];
    const drawingType = this._drawingType;
    
    try {
      // 创建图形并添加到地图
      if (drawingType === ShapeType.POLYGON && pointsCopy.length >= 3) {
        // 直接调用createPolygon方法
        const createdShape = this.createPolygon(pointsCopy);
        info(`多边形已创建并添加到地图，点数: ${pointsCopy.length}`);
      } else if (drawingType === ShapeType.POLYLINE && pointsCopy.length >= 2) {
        // 直接调用createPolyline方法
        const createdShape = this.createPolyline(pointsCopy);
        info(`折线已创建并添加到地图，点数: ${pointsCopy.length}`);
      }
    } catch (err) {
      error('创建图形失败:', err);
    }
    
    // 清除临时图层和绘制点，为下一次绘制做准备
    this._drawingLayer.clearLayers();
    this._drawingPoints = [];
    this._tempLayer = null;
    
    // 确保_isDrawing状态保持为true，以便继续接收点击事件
    this._isDrawing = true;
    
    return false;
  }

  /**
   * 更新预览 - 用于多边形和线段
   */
  private updatePreview(currentPoint?: LatLng): void {
    if (!this._drawingLayer || this._drawingPoints.length === 0) return;
    
    // 清除之前的临时图形
    this._drawingLayer.clearLayers();
    
    // 准备点集合
    let points = [...this._drawingPoints];
    if (currentPoint) {
      points.push(currentPoint);
    }
    
    // 根据绘制类型创建临时图形
    if (this._drawingType === ShapeType.POLYLINE) {
      this._tempLayer = L.polyline(points, {
        color: this._drawingOptions.color,
        weight: this._drawingOptions.weight,
        opacity: this._drawingOptions.opacity
      }).addTo(this._drawingLayer);
    } else if (this._drawingType === ShapeType.POLYGON) {
      this._tempLayer = L.polygon(points, {
        color: this._drawingOptions.color,
        weight: this._drawingOptions.weight,
        opacity: this._drawingOptions.opacity,
        fillColor: this._drawingOptions.fillColor,
        fillOpacity: this._drawingOptions.fillOpacity
      }).addTo(this._drawingLayer);
    }
  }

  /**
   * 更新圆形预览
   */
  private updateCirclePreview(center: LatLng, radius: number): void {
    if (!this._drawingLayer) return;
    
    // 清除之前的临时图形
    this._drawingLayer.clearLayers();
    
    // 创建临时圆形
    this._tempLayer = L.circle(center, {
      radius,
      color: this._drawingOptions.color,
      weight: this._drawingOptions.weight,
      opacity: this._drawingOptions.opacity,
      fillColor: this._drawingOptions.fillColor,
      fillOpacity: this._drawingOptions.fillOpacity
    }).addTo(this._drawingLayer);
  }

  /**
   * 更新矩形预览
   */
  private updateRectanglePreview(bounds: any): void {
    if (!this._drawingLayer) return;
    
    // 清除之前的临时图形
    this._drawingLayer.clearLayers();
    
    // 创建临时矩形
    this._tempLayer = L.rectangle(bounds, {
      color: this._drawingOptions.color,
      weight: this._drawingOptions.weight,
      opacity: this._drawingOptions.opacity,
      fillColor: this._drawingOptions.fillColor,
      fillOpacity: this._drawingOptions.fillOpacity
    }).addTo(this._drawingLayer);
  }

  /**
   * 创建圆形
   * @param center 圆心坐标
   * @param radius 半径（米）
   * @returns 创建的图层
   */
  public createCircle(center: LatLng, radius: number): Layer {
    try {
      info(`创建圆形: 中心(${center.lat.toFixed(6)},${center.lng.toFixed(6)}), 半径${radius.toFixed(2)}米`);
      
      // 获取样式选项
      const options = this.getLeafletOptions();
      
      // 创建圆形并添加到地图
      const circle = L.circle(center, {
        radius,
        color: options.color,
        weight: options.weight,
        opacity: options.opacity,
        fillColor: options.fillColor,
        fillOpacity: options.fillOpacity
      });
      
      // 将图形添加到形状集合
      const shapeId = this.addShapeToCollection(ShapeType.CIRCLE, circle, {
        ...options,
        type: ShapeType.CIRCLE,
        radius
      });
      
      // 触发图形创建事件
      this.fireEvent('shape-created', {
        id: shapeId,
        type: ShapeType.CIRCLE,
        center: [center.lat, center.lng],
        radius
      });
      
      return circle;
    } catch (e) {
      error('创建圆形失败:', e);
      throw e;
    }
  }

  private addShapeToCollection(type: ShapeType, layer: Layer, options: ShapeOptions): string {
    const id = `shape_${this.nextShapeId++}`;
    
    try {
      // 添加到地图
      info(`将${type}形状添加到shapesLayerGroup，确保在地图上可见`);
      layer.addTo(this.shapesLayerGroup);
      
      // 保存到集合
      info(`将${type}形状保存到shapes集合，ID: ${id}`);
      this.shapes.set(id, {
        id,
        layer,
        options: { ...options, id, type },
        visible: true
      });
      
      // 检查是否成功添加
      info(`当前shapesLayerGroup中的图层数量: ${this.shapesLayerGroup.getLayers().length}`);
      info(`当前shapes集合中的图形数量: ${this.shapes.size}`);
      
      return id;
    } catch (err) {
      error(`将${type}形状添加到集合时出错:`, err);
      // 出错时仍然返回ID，便于调试
      return id;
    }
  }

  public createRectangle(point1: LatLng, point2: LatLng): Layer {
    info(`创建矩形: 点1(${point1.lat}, ${point1.lng}), 点2(${point2.lat}, ${point2.lng})`);
    try {
      // 获取样式选项
      const options = this.getLeafletOptions();
      
      // 创建矩形边界
      const bounds = new LatLngBounds(point1, point2);
      
      // 创建矩形
      const rectangle = L.rectangle(bounds, {
        color: options.color,
        weight: options.weight,
        opacity: options.opacity,
        fillColor: options.fillColor,
        fillOpacity: options.fillOpacity
      });
      
      // 将图形添加到形状集合
      const shapeId = this.addShapeToCollection(ShapeType.RECTANGLE, rectangle, {
        ...options,
        type: ShapeType.RECTANGLE
      });
      
      // 触发图形创建事件
      this.fireEvent('shape-created', {
        id: shapeId,
        type: ShapeType.RECTANGLE,
        bounds: [
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()]
        ],
        options: options
      });
      
      info(`矩形创建成功，ID: ${shapeId}`);
      return rectangle;
    } catch (err) {
      error('创建矩形时出错:', err);
      throw err;
    }
  }

  public createPolygon(points: LatLng[]): Layer {
    info(`创建多边形: ${points.length}个点`);
    try {
      if (points.length < 3) {
        throw new Error('多边形至少需要3个点');
      }
      
      // 获取样式选项
      const options = this.getLeafletOptions();
      
      // 创建多边形
      const polygon = L.polygon(points, {
        color: options.color,
        weight: options.weight,
        opacity: options.opacity,
        fillColor: options.fillColor,
        fillOpacity: options.fillOpacity
      });
      
      // 将图形添加到形状集合
      const shapeId = this.addShapeToCollection(ShapeType.POLYGON, polygon, {
        ...options,
        type: ShapeType.POLYGON
      });
      
      // 触发图形创建事件
      this.fireEvent('shape-created', {
        id: shapeId,
        type: ShapeType.POLYGON,
        points: points.map(p => [p.lat, p.lng]),
        options: options
      });
      
      info(`多边形创建成功，ID: ${shapeId}`);
      return polygon;
    } catch (err) {
      error('创建多边形时出错:', err);
      throw err;
    }
  }

  public createPolyline(points: LatLng[]): Layer {
    info(`创建折线: ${points.length}个点`);
    try {
      if (points.length < 2) {
        throw new Error('折线至少需要2个点');
      }
      
      // 获取样式选项
      const options = this.getLeafletOptions();
      
      // 创建折线
      const polyline = L.polyline(points, {
        color: options.color,
        weight: options.weight,
        opacity: options.opacity
      });
      
      // 将图形添加到形状集合
      const shapeId = this.addShapeToCollection(ShapeType.POLYLINE, polyline, {
        ...options,
        type: ShapeType.POLYLINE
      });
      
      // 触发图形创建事件
      this.fireEvent('shape-created', {
        id: shapeId,
        type: ShapeType.POLYLINE,
        points: points.map(p => [p.lat, p.lng]),
        options: options
      });
      
      info(`折线创建成功，ID: ${shapeId}`);
      return polyline;
    } catch (err) {
      error('创建折线时出错:', err);
      throw err;
    }
  }

  public addShape(type: ShapeType, coordinates: any, options?: Partial<ShapeOptions>): Layer | null {
    info(`添加形状: ${type}`, coordinates, options);
    try {
      const shapeOptions = this.getLeafletOptions(options);
      
      switch (type) {
        case ShapeType.CIRCLE:
          if (!coordinates.center || !coordinates.radius) {
            throw new Error('圆形需要center和radius参数');
          }
          return this.createCircle(L.latLng(coordinates.center[0], coordinates.center[1]), coordinates.radius);
          
        case ShapeType.RECTANGLE:
          if (!coordinates.bounds || coordinates.bounds.length !== 2) {
            throw new Error('矩形需要bounds参数，包含两个点坐标');
          }
          const sw = L.latLng(coordinates.bounds[0][0], coordinates.bounds[0][1]);
          const ne = L.latLng(coordinates.bounds[1][0], coordinates.bounds[1][1]);
          return this.createRectangle(sw, ne);
          
        case ShapeType.POLYGON:
          if (!coordinates.latlngs || coordinates.latlngs.length < 3) {
            throw new Error('多边形至少需要3个点');
          }
          const polygonPoints = coordinates.latlngs.map((coord: number[]) => L.latLng(coord[0], coord[1]));
          return this.createPolygon(polygonPoints);
          
        case ShapeType.POLYLINE:
          if (!coordinates.latlngs || coordinates.latlngs.length < 2) {
            throw new Error('折线至少需要2个点');
          }
          const polylinePoints = coordinates.latlngs.map((coord: number[]) => L.latLng(coord[0], coord[1]));
          return this.createPolyline(polylinePoints);
          
        default:
          throw new Error(`未支持的形状类型: ${type}`);
      }
    } catch (error) {
      error(`添加形状失败: ${error}`);
      return null;
    }
  }

  public clearShapes(): void {
    this.shapesLayerGroup.clearLayers();
    this.shapes.clear();
    this.fireEvent('shapes-cleared', {});
  }

  private fireEvent(eventName: ShapeEventType, data: any): void {
    info(`触发事件: ${eventName}`, data);
    try {
      this._map.fire(`shapetool:${eventName}`, data);
      
      if (this.eventListeners[eventName]) {
        this.eventListeners[eventName].forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            error(`执行事件监听器出错: ${eventName}`, error);
          }
        });
      }
    } catch (error) {
      error(`触发事件${eventName}时出错:`, error);
    }
  }

  /**
   * 检查是否有绘制工具处于活动状态
   */
  public isDrawing(): boolean {
    return this._isDrawing;
  }

  /**
   * 获取当前正在绘制的图形类型
   */
  public getCurrentDrawingType(): ShapeType | null {
    return this._drawingType;
  }

  public on(event: ShapeEventType, listener: ShapeEventListener): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(listener);
    }
  }

  public off(event: ShapeEventType, listener: ShapeEventListener): void {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(listener);
      if (index !== -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }
}