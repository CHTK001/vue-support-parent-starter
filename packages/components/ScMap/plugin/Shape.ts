import { LatLng, LatLngBounds, LatLngTuple, Layer, LayerGroup, Map as LeafletMap, CircleMarkerOptions, PolylineOptions, PolygonOptions, PathOptions } from 'leaflet';
import L from 'leaflet';
import { info, error } from "@repo/utils";
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
    } catch (error) {
      error('ShapeTool初始化失败:', error);
      throw error;
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
    } catch (error) {
      error('获取Leaflet选项时出错:', error);
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
    
    if (this._drawingType) {
      info('取消之前的绘制');
      this.stopDrawing();
    }
    
    this._drawingType = type;
    this._drawingPoints = [];
    this._drawingLayer.clearLayers();
    
    if (options) {
      this._drawingOptions = { ...this._drawingOptions, ...options, type };
    }
    
    const mapContainer = this._map.getContainer();
    if (mapContainer) {
      mapContainer.style.cursor = 'crosshair';
    }
    
    this._map.doubleClickZoom.disable();
  }

  public stopDrawing(): void {
    info('停止绘制');
    
    const mapContainer = this._map.getContainer();
    if (mapContainer) {
      mapContainer.style.cursor = '';
    }
    
    this._map.doubleClickZoom.enable();
    
    
    if (this._tempLayer) {
      this._drawingLayer.removeLayer(this._tempLayer);
      this._tempLayer = null;
    }
    
    this._drawingType = null;
    this._drawingPoints = [];
  }

  public createCircle(center: LatLng, radius: number): Layer {
    info(`创建圆形: 中心(${center.lat}, ${center.lng}), 半径${radius}米`);
    try {
      const options = this.getLeafletOptions();
      const circle = L.circle(center, { ...options as CircleMarkerOptions, radius });
      
      circle.addTo(this.shapesLayerGroup);
      
      const id = this._drawingOptions.id || `shape_${this.nextShapeId++}`;
      this.shapes.set(id, {
        id,
        layer: circle,
        options: { ...this._drawingOptions, id, radius },
        visible: true
      });
      
      this.fireEvent('shape-created', {
        id,
        type: ShapeType.CIRCLE,
        center: [center.lat, center.lng],
        radius,
        options: this._drawingOptions
      });
      
      info(`圆形创建成功，ID: ${id}`);
      return circle;
    } catch (error) {
      error('创建圆形时出错:', error);
      throw error;
    }
  }

  public createRectangle(point1: LatLng, point2: LatLng): Layer {
    info(`创建矩形: 点1(${point1.lat}, ${point1.lng}), 点2(${point2.lat}, ${point2.lng})`);
    try {
      const options = this.getLeafletOptions();
      const bounds = new LatLngBounds(point1, point2);
      const rectangle = L.rectangle(bounds, options as PathOptions);
      
      rectangle.addTo(this.shapesLayerGroup);
      
      const id = this._drawingOptions.id || `shape_${this.nextShapeId++}`;
      this.shapes.set(id, {
        id,
        layer: rectangle,
        options: { ...this._drawingOptions, id },
        visible: true
      });
      
      this.fireEvent('shape-created', {
        id,
        type: ShapeType.RECTANGLE,
        bounds: [
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()]
        ],
        options: this._drawingOptions
      });
      
      info(`矩形创建成功，ID: ${id}`);
      return rectangle;
    } catch (error) {
      error('创建矩形时出错:', error);
      throw error;
    }
  }

  public createPolygon(points: LatLng[]): Layer {
    info(`创建多边形: ${points.length}个点`);
    try {
      if (points.length < 3) {
        throw new Error('多边形至少需要3个点');
      }
      
      const options = this.getLeafletOptions();
      const polygon = L.polygon(points, options as PolygonOptions);
      
      polygon.addTo(this.shapesLayerGroup);
      
      const id = this._drawingOptions.id || `shape_${this.nextShapeId++}`;
      this.shapes.set(id, {
        id,
        layer: polygon,
        options: { ...this._drawingOptions, id },
        visible: true
      });
      
      this.fireEvent('shape-created', {
        id,
        type: ShapeType.POLYGON,
        points: points.map(p => [p.lat, p.lng]),
        options: this._drawingOptions
      });
      
      return polygon;
    } catch (error) {
      error('创建多边形时出错:', error);
      throw error;
    }
  }

  public createPolyline(points: LatLng[]): Layer {
    info(`创建折线: ${points.length}个点`);
    try {
      if (points.length < 2) {
        throw new Error('折线至少需要2个点');
      }
      
      const options = this.getLeafletOptions();
      const polyline = L.polyline(points, options as PolylineOptions);
      
      polyline.addTo(this.shapesLayerGroup);
      
      const id = this._drawingOptions.id || `shape_${this.nextShapeId++}`;
      this.shapes.set(id, {
        id,
        layer: polyline,
        options: { ...this._drawingOptions, id },
        visible: true
      });
      
      this.fireEvent('shape-created', {
        id,
        type: ShapeType.POLYLINE,
        points: points.map(p => [p.lat, p.lng]),
        options: this._drawingOptions
      });
      
      return polyline;
    } catch (error) {
      error('创建折线时出错:', error);
      throw error;
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

  public isActive(): boolean {
    return this._drawingType !== null;
  }

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