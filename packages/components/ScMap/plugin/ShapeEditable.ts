/**
 * ShapeEditable.ts
 * 
 * 基于leaflet-editable实现的地图绘图工具，提供与原Shape相同的API，但使用leaflet-editable库
 * 实现绘图功能，解决了原有Shape实现中双击结束绘制多边形和线段的问题。
 * 
 * 该实现提供以下增强功能：
 * 1. 使用leaflet-editable实现，更加直观的绘图体验
 * 2. 支持图形编辑功能（enableEditing/disableEditing方法）
 * 3. 更好的双击结束绘制支持
 * 4. 更丰富的事件支持，包括图形编辑事件
 * 5. 更好的错误处理和日志
 * 
 * 与原有Shape实现保持相同的API接口，确保与现有代码兼容。
 */
import { LatLng, LatLngBounds, LatLngTuple, Layer, LayerGroup, Map as LeafletMap, CircleMarkerOptions, PolylineOptions, PolygonOptions, PathOptions } from 'leaflet';
import L from 'leaflet';
import { info, error, warn } from "@repo/utils";
import 'leaflet-editable';

// 定义相同的形状类型，保持API兼容
export enum ShapeType {
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
  POLYGON = 'polygon',
  POLYLINE = 'polyline'
}

// 保持与原有Shape相同的选项接口
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

// 定义形状状态接口
interface ShapeState {
  id: string;
  layer: Layer;
  options: ShapeOptions;
  visible: boolean;
  editable?: boolean;
}

// 定义事件类型
export type ShapeEventType = 'shape-created' | 'shape-removed' | 'drawing-start' | 'drawing-end' | 'drawing-cancel' | 'shapes-cleared' | 'shape-edited' | 'shape-click';

// 定义事件监听器类型
export type ShapeEventListener = (shape: any) => void;

/**
 * 基于leaflet-editable的形状工具类，实现与原Shape类相同的接口
 */
export default class ShapeEditable {
  private map: LeafletMap;
  private _drawingType: ShapeType | null = null;
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
  private shapes: Map<string, ShapeState> = new Map();
  private nextShapeId: number = 1;
  private addLog: Function;
  private mapToolbarRef: any;
  
  // 事件监听器存储
  private eventListeners: Record<ShapeEventType, ShapeEventListener[]> = {
    'shape-created': [],
    'shape-removed': [],
    'drawing-start': [],
    'drawing-end': [],
    'drawing-cancel': [],
    'shapes-cleared': [],
    'shape-edited': [],
    'shape-click': []
  };
  
  // 当前正在编辑的图形
  private _currentEditor: any = null;
  
  // 添加形状详情相关属性
  private detailsVisible: boolean = false;
  private clickedShape: Layer | null = null;
  private clickedShapeId: string | null = null;
  private clickedShapeType: ShapeType | null = null;
  private clickedShapeCenter: [number, number] | null = null;
  
  /**
   * 构造函数
   * @param map Leaflet地图实例
   * @param addLog 日志函数
   */
  constructor(map: LeafletMap, addLog: Function, mapToolbarRef: any) {
    this.addLog = addLog || console.log;
    this.mapToolbarRef = mapToolbarRef;
    try {
      info('ShapeEditable构造函数被调用, map类型:', typeof map);
      if (!map) {
        throw new Error('地图实例未传入ShapeEditable构造函数');
      }
      
      this.map = map;
      
      // 确保地图有editable功能
      if (!this.map.editTools) {
        warn('地图未启用editable功能，现在启用它');
        this.map.editTools = new (L as any).Editable(this.map, {
          // 编辑选项
          editLayer: new L.LayerGroup(),
          featuresLayer: new L.LayerGroup(),
          polylineEditorClass: (L as any).Editable.PolylineEditor,
          polygonEditorClass: (L as any).Editable.PolygonEditor,
          markerEditorClass: (L as any).Editable.MarkerEditor,
          circleEditorClass: (L as any).Editable.CircleEditor,
          rectangleEditorClass: (L as any).Editable.RectangleEditor
        });
      }
      
      // 创建图层组
      this.shapesLayerGroup = L.layerGroup().addTo(this.map);
      
      // 注册编辑事件
      this.registerEditEvents();
      
      info('ShapeEditable初始化成功');
    } catch (e) {
      error('ShapeEditable初始化失败:', e);
      throw e;
    }
  }
  
  /**
   * 注册编辑事件
   */
  private registerEditEvents(): void {
    const _this = this;
    try {
      // 注册编辑完成事件
      this.map.on('editable:editing', (e: any) => {
        this.addLog('形状编辑中', e);
      });
      
      this.map.on('editable:vertex:dragend', (e: any) => {
        this.addLog('顶点拖拽完成', e);
        this.fireEvent('shape-edited', e.layer || e.target);
      });
      
      this.map.on('editable:drawing:end', (e: any) => {
        // 完成当前图形绘制，但保持绘图状态为激活，允许连续绘制
        // 保存当前绘图类型
        const currentDrawingType = this._drawingType;
        
        // 暂时重置绘图状态
        // this._isDrawing = false;
        // this._drawingType = null;
        // this._currentEditor = null;
        
        // 查找编辑的图形对应的状态
        let editedShapeId = '';
        for (const [id, state] of this.shapes.entries()) {
          if (state.layer === e.layer) {
            editedShapeId = id;
            break;
          }
        }
        
        if (editedShapeId) {
          this.addLog(`图形 ${editedShapeId} 绘制完成`);
        }
        
        this.fireEvent('drawing-end', {
          layer: e.layer,
          type: currentDrawingType,
          id: editedShapeId
        });
      });
      
      this.map.on('editable:drawing:cancel', (e: any) => {
        this._isDrawing = false;
        this._drawingType = null;
        this._currentEditor = null;
        
        this.fireEvent('drawing-cancel', {
          layer: e.layer
        });
      });
      
      this.map.on('editable:drawing:commit', (e: any) => {
        // 当绘图提交时，将其保存到形状集合
        if (e.layer && this._drawingType) {
          const options = this.getLeafletOptions();
          const id = this.addShapeToCollection(this._drawingType, e.layer, options);
          
          this.fireEvent('shape-created', {
            id,
            layer: e.layer,
            type: this._drawingType,
            options
          });
        }
      });
      
      // 双击完成绘制
      // this.map.on('dblclick', (e: any) => {
      //     // 多边形或折线需要至少两个点才能完成
      //     if ((this._drawingType === ShapeType.POLYGON || this._drawingType === ShapeType.POLYLINE) &&
      //         this._currentEditor.getLatLngs && 
      //         this._currentEditor.getLatLngs().length >= 2) {
      //       this._currentEditor.commitDrawing();
      //     }
      //     const options = this.getLeafletOptions();
      //     this.fireEvent('shape-created', {
      //       id: "",
      //       layer: e.layer,
      //       type: this._drawingType,
      //       options
      //     });
      // });
      
    } catch (e) {
      error('注册编辑事件失败:', e);
    }
  }
  
  /**
   * 获取Leaflet选项
   */
  private getLeafletOptions(options?: Partial<ShapeOptions>): ShapeOptions {
    try {
      const mergedOptions = { ...this._drawingOptions, ...options };
      
      // 默认选项
      const defaultOptions = {
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
        fill: mergedOptions.fill !== undefined ? mergedOptions.fill : true,
        stroke: mergedOptions.stroke !== undefined ? mergedOptions.stroke : true,
        smoothFactor: mergedOptions.smoothFactor,
        data: mergedOptions.data
      };
      
      // 仅对折线(polyline)，确保没有填充背景色
      // 多边形(polygon)保留背景色
      if ( this._drawingType === ShapeType.POLYLINE) {
        defaultOptions.fill = false;
        defaultOptions.fillOpacity = 0;
      }
      
      return defaultOptions;
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
        fill: true,
        stroke: true
      };
    }
  }
  
  /**
   * 获取编辑选项
   */
  private getEditableOptions(options: ShapeOptions): any {
    const { color, weight, opacity, fillColor, fillOpacity, dashArray, fill, stroke, smoothFactor } = options;
    
    return {
      color,
      weight,
      opacity,
      fillColor,
      fillOpacity,
      dashArray,
      fill,
      stroke,
      smoothFactor
    };
  }
  
  /**
   * 开始绘制图形
   */
  public startDrawing(type: ShapeType, options?: Partial<ShapeOptions>): void {
    this.addLog('绘图工具.startDrawing', {type, options});
    try {
      // 如果已经在绘制，先取消当前绘制
      if (this._isDrawing) {
        this.addLog('检测到已有绘制活动正在进行，将先取消');
        this.cancelDrawing(); // 包含了所有取消和清理操作
        
        // 确保彻底清理绘制状态
        if (this.map.editTools) {
          this.map.editTools.stopDrawing();
          this.map.editTools._currentDrawer = null;
        }
      }
      this._startDrawingImplementation(type, options);
    } catch (e) {
      error(`开始绘制${type}时出错:`, e);
      this._isDrawing = false;
      this._drawingType = null;
      this.addLog(`尝试开始绘制${type}时发生错误`);
    }
  }
  
  /**
   * 实际开始绘制的内部方法
   */
  private _startDrawingImplementation(type: ShapeType, options?: Partial<ShapeOptions>): void {
    try {
      // 更新绘制选项
      if (options) {
        this._drawingOptions = { ...this._drawingOptions, ...options };
      }
      
      // 清除之前的状态
      this._isDrawing = true;
      this._drawingType = type;
      this._currentEditor = null;
      
      // 获取编辑选项
      const editOptions = this.getEditableOptions(this.getLeafletOptions());
      
      // 首先确保地图editTools已初始化
      if (!this.map.editTools) {
        this.map.editTools = new (L as any).Editable(this.map, {
          editLayer: new L.LayerGroup(),
          featuresLayer: new L.LayerGroup(),
          polylineEditorClass: (L as any).Editable.PolylineEditor,
          polygonEditorClass: (L as any).Editable.PolygonEditor,
          markerEditorClass: (L as any).Editable.MarkerEditor,
          circleEditorClass: (L as any).Editable.CircleEditor,
          rectangleEditorClass: (L as any).Editable.RectangleEditor
        });
      }
      
      // 确保当前没有进行中的绘制
      if (this.map.editTools._currentDrawer) {
        this.map.editTools.stopDrawing();
        this.map.editTools._currentDrawer = null;
        this.addLog('强制停止现有绘制，确保状态干净');
      }
      
      // 根据类型开始绘制
      switch (type) {
        case ShapeType.CIRCLE:
          // 为圆形绘制提供初始点，避免undefined错误
          const center = this.map.getCenter();
          this._currentEditor = this.map.editTools.startCircle(center, editOptions);
          this.addLog(`开始绘制圆形，中心点: ${center.lat}, ${center.lng}`);
          break;
          
        case ShapeType.RECTANGLE:
          // 使用地图中心作为起始点
          const rectCenter = this.map.getCenter();
          this._currentEditor = this.map.editTools.startRectangle(rectCenter, editOptions);
          this.addLog(`开始绘制矩形，起始点: ${rectCenter.lat}, ${rectCenter.lng}`);
          break;
          
        case ShapeType.POLYGON:
          this._currentEditor = this.map.editTools.startPolygon(undefined, editOptions);
          this.addLog('开始绘制多边形');
          break;
          
        case ShapeType.POLYLINE:
          this._currentEditor = this.map.editTools.startPolyline(undefined, editOptions);
          this.addLog('开始绘制折线');
          break;
          
        default:
          throw new Error(`未支持的形状类型: ${type}`);
      }
      
      // 触发绘制开始事件
      this.fireEvent('drawing-start', {
        type,
        options: this._drawingOptions
      });
      
    } catch (e) {
      error(`开始绘制${type}时出错:`, e);
      this._isDrawing = false;
      this._drawingType = null;
    }
  }
  
  /**
   * 停止绘制
   */
  public stopDrawing(): void {
    if (this._isDrawing && this._currentEditor) {
      try {
        // 提交绘制
        this._currentEditor.commitDrawing();
        this._isDrawing = false;
        this._drawingType = null;
        this._currentEditor = null;
      } catch (e) {
        error('停止绘制时出错:', e);
        this.cancelDrawing();
      }
    }
  }
  
  /**
   * 取消绘制
   */
  public cancelDrawing(): void {
    try {
      this.addLog('取消当前绘制操作');
      
      // 先尝试取消当前编辑器的绘制
      if (this._currentEditor && this._currentEditor.cancelDrawing) {
        this._currentEditor.cancelDrawing();
        this.addLog('通过当前编辑器取消绘制');
      }
      
      // 不管_currentEditor是否存在，都通过editTools停止绘制
      if (this.map && this.map.editTools) {
        this.map.editTools.stopDrawing();
        // 直接清理_currentDrawer状态
        this.map.editTools._currentDrawer = null;
        this.addLog('通过地图editTools停止绘制');
      }
      
      // 清理绘制状态
      const previousDrawingType = this._drawingType;
      this._isDrawing = false;
      this._drawingType = null;
      this._currentEditor = null;
      
      // 禁用所有图形的编辑功能
      this.disableAllEditing();
      
      // 触发取消事件
      this.fireEvent('drawing-cancel', {
        previousType: previousDrawingType
      });
      
      this.addLog('绘制已完全取消并清理');
    } catch (e) {
      error('取消绘制时出错:', e);
      
      // 即使出错，也确保状态重置
      this._isDrawing = false;
      this._drawingType = null;
      this._currentEditor = null;
      
      // 尝试禁用所有图形的编辑功能
      try {
        this.disableAllEditing();
      } catch (disableError) {
        error('禁用编辑时出错:', disableError);
      }
      
      // 强制清理leaflet-editable的状态
      if (this.map && this.map.editTools) {
        this.map.editTools.stopDrawing();
        this.map.editTools._currentDrawer = null;
      }
      
      this.addLog('绘制取消过程中发生错误，已强制重置状态');
    }
  }
  
  /**
   * 判断是否正在绘制
   */
  public isDrawing(): boolean {
    return this._isDrawing;
  }
  
  /**
   * 获取当前绘制类型
   */
  public getCurrentDrawingType(): ShapeType | null {
    return this._drawingType;
  }
  
  /**
   * 将图形添加到集合
   */
  private addShapeToCollection(type: ShapeType, layer: Layer, options: ShapeOptions): string {
    try {
      // 生成唯一ID
      const shapeId = options.id || `shape-${this.nextShapeId++}`;
      
      // 添加到集合
      this.shapes.set(shapeId, {
        id: shapeId,
        layer,
        options,
        visible: true
      });
      
      // 添加点击事件处理
      this.addClickHandler(layer, shapeId, type, options);
      
      return shapeId;
    } catch (e) {
      error('添加形状到集合失败:', e);
      throw e;
    }
  }
  
  /**
   * 为形状添加点击事件处理
   */
  private addClickHandler(layer: Layer, shapeId: string, type: ShapeType, options: ShapeOptions): void {
    try {
      // 确保图层有事件处理能力
      if (layer && typeof layer.on === 'function') {
        // 设置图层可交互
        if (layer.options) {
          layer.options.interactive = true;
        }
        
        // 添加点击事件
        layer.on('click', (e: any) => {
          try {
            this.addLog('形状点击事件', { shapeId, type });
            
            // 阻止事件冒泡
            L.DomEvent.stopPropagation(e);
            
            // 显示形状详情
            this.showShapeDetails(shapeId, layer, type);
            
            // 触发shape-click事件，传递map对象
            this.fireEvent('shape-click', { 
              id: shapeId, 
              type: type, 
              layer: layer, 
              options: options,
              map: this.map,
              center: this.getShapeCenter(layer, type)
            });
          } catch (err) {
            error('处理形状点击事件失败:', err);
          }
        });
      }
    } catch (e) {
      error('为形状添加点击事件处理失败:', e);
    }
  }
  
  /**
   * 获取形状的中心点
   */
  private getShapeCenter(layer: Layer, type: ShapeType): [number, number] {
    try {
      switch (type) {
        case ShapeType.CIRCLE:
          // 对于圆形，直接获取中心点
          if ('getLatLng' in layer && typeof layer.getLatLng === 'function') {
            const center = layer.getLatLng();
            return [center.lat, center.lng];
          }
          break;
          
        case ShapeType.RECTANGLE:
          // 对于矩形，获取边界并计算中心点
          if ('getBounds' in layer && typeof layer.getBounds === 'function') {
            const bounds = layer.getBounds();
            return [bounds.getCenter().lat, bounds.getCenter().lng];
          }
          break;
          
        case ShapeType.POLYGON:
        case ShapeType.POLYLINE:
          // 对于多边形和线，计算所有点的平均值作为中心点
          if ('getLatLngs' in layer && typeof layer.getLatLngs === 'function') {
            const latlngs = layer.getLatLngs();
            // 处理多层嵌套的情况
            const points = this.flattenLatLngs(latlngs);
            
            if (points.length > 0) {
              let sumLat = 0, sumLng = 0;
              points.forEach(point => {
                sumLat += point.lat;
                sumLng += point.lng;
              });
              return [sumLat / points.length, sumLng / points.length];
            }
          }
          break;
      }
      
      // 如果没有特定方法获取中心点，尝试获取第一个点
      if ('getLatLng' in layer && typeof layer.getLatLng === 'function') {
        const point = layer.getLatLng();
        return [point.lat, point.lng];
      }
      
      // 最后的备选方案：地图中心
      const center = this.map.getCenter();
      return [center.lat, center.lng];
    } catch (e) {
      error('获取形状中心点失败:', e);
      const center = this.map.getCenter();
      return [center.lat, center.lng];
    }
  }
  
  /**
   * 展平嵌套的LatLng数组
   */
  private flattenLatLngs(latlngs: any[]): LatLng[] {
    const result: LatLng[] = [];
    
    const flatten = (arr: any[]) => {
      for (const item of arr) {
        if (item instanceof L.LatLng) {
          result.push(item);
        } else if (Array.isArray(item)) {
          flatten(item);
        }
      }
    };
    
    flatten(latlngs);
    return result;
  }
  
  /**
   * 显示形状详情
   */
  public showShapeDetails(shapeId: string, layer?: Layer, type?: ShapeType): void {
    try {
      // 关闭地图上现有的popup
      this.map.closePopup();
      
      // 获取图形信息
      const shapeState = this.shapes.get(shapeId);
      if (!shapeState) {
        throw new Error(`找不到ID为 ${shapeId} 的形状`);
      }
      
      // 保存当前点击的形状
      this.clickedShape = layer || shapeState.layer;
      this.clickedShapeId = shapeId;
      this.clickedShapeType = type || shapeState.options.type;
      this.clickedShapeCenter = this.getShapeCenter(this.clickedShape, this.clickedShapeType);
      
      // 设置弹框可见
      this.detailsVisible = true;
      
      this.addLog('显示形状详情', { shapeId, type: this.clickedShapeType });
    } catch (e) {
      error('显示形状详情失败:', e);
    }
  }
  
  /**
   * 关闭详情弹框
   */
  public closeDetailsPopup(): void {
    this.detailsVisible = false;
    this.clickedShape = null;
    this.clickedShapeId = null;
    this.clickedShapeType = null;
    this.clickedShapeCenter = null;
    
    this.addLog('关闭形状详情弹框');
  }
  
  /**
   * 获取当前点击的形状
   */
  public getClickedShape(): any {
    try {
      if (!this.clickedShape || !this.clickedShapeId) {
        return null;
      }
      
      const shapeState = this.shapes.get(this.clickedShapeId);
      if (!shapeState) {
        return null;
      }
      
      return {
        id: this.clickedShapeId,
        type: this.clickedShapeType,
        layer: this.clickedShape,
        center: this.clickedShapeCenter,
        options: shapeState.options,
        data: shapeState.options.data || {}
      };
    } catch (e) {
      error('获取当前点击的形状失败:', e);
      return null;
    }
  }
  
  /**
   * 获取弹框可见性
   */
  public getVisible(): boolean {
    return this.detailsVisible;
  }
  
  /**
   * 创建圆形
   */
  public createCircle(center: LatLng, radius: number, options?: Partial<ShapeOptions>): Layer {
    const shapeOptions = this.getLeafletOptions({
      ...options,
      type: ShapeType.CIRCLE,
      radius
    });
    
    const styleOptions = this.getEditableOptions(shapeOptions);
    const circle = L.circle(center, { radius, ...styleOptions });
    
    const id = this.addShapeToCollection(ShapeType.CIRCLE, circle, shapeOptions);
    
    this.fireEvent('shape-created', {
      id,
      layer: circle,
      type: ShapeType.CIRCLE,
      options: shapeOptions
    });
    
    return circle;
  }
  
  /**
   * 创建矩形
   */
  public createRectangle(bounds: LatLngBounds | [LatLng, LatLng], options?: Partial<ShapeOptions>): Layer {
    const shapeOptions = this.getLeafletOptions({
      ...options,
      type: ShapeType.RECTANGLE
    });
    
    const styleOptions = this.getEditableOptions(shapeOptions);
    
    // 如果传入的是两个点，则创建矩形边界
    let rectangleBounds: LatLngBounds;
    if (Array.isArray(bounds)) {
      rectangleBounds = L.latLngBounds(bounds[0], bounds[1]);
    } else {
      rectangleBounds = bounds;
    }
    
    const rectangle = L.rectangle(rectangleBounds, styleOptions);
    
    const id = this.addShapeToCollection(ShapeType.RECTANGLE, rectangle, shapeOptions);
    
    this.fireEvent('shape-created', {
      id,
      layer: rectangle,
      type: ShapeType.RECTANGLE,
      options: shapeOptions
    });
    
    return rectangle;
  }
  
  /**
   * 创建多边形
   */
  public createPolygon(latlngs: LatLng[], options?: Partial<ShapeOptions>): Layer {
    const shapeOptions = this.getLeafletOptions({
      ...options,
      type: ShapeType.POLYGON
    });
    
    const styleOptions = this.getEditableOptions(shapeOptions);
    const polygon = L.polygon(latlngs, styleOptions);
    
    const id = this.addShapeToCollection(ShapeType.POLYGON, polygon, shapeOptions);
    
    this.fireEvent('shape-created', {
      id,
      layer: polygon,
      type: ShapeType.POLYGON,
      options: shapeOptions
    });
    
    return polygon;
  }
  
  /**
   * 创建折线
   */
  public createPolyline(latlngs: LatLng[], options?: Partial<ShapeOptions>): Layer {
    const shapeOptions = this.getLeafletOptions({
      ...options,
      type: ShapeType.POLYLINE,
      // 始终确保线段没有背景填充
      fill: false,
      fillOpacity: 0
    });
    
    const styleOptions = this.getEditableOptions(shapeOptions);
    const polyline = L.polyline(latlngs, styleOptions);
    
    const id = this.addShapeToCollection(ShapeType.POLYLINE, polyline, shapeOptions);
    
    this.fireEvent('shape-created', {
      id,
      layer: polyline,
      type: ShapeType.POLYLINE,
      options: shapeOptions
    });
    
    return polyline;
  }
  
  /**
   * 添加图形
   */
  public addShape(type: ShapeType, coordinates: any, options?: Partial<ShapeOptions>): Layer | null {
    try {
      let layer = null;
      switch (type) {
        case ShapeType.CIRCLE:
          if (!coordinates.center || !coordinates.radius) {
            throw new Error('圆形需要center和radius参数');
          }
          const center = Array.isArray(coordinates.center) 
            ? L.latLng(coordinates.center[0], coordinates.center[1]) 
            : coordinates.center;
          layer = this.createCircle(center, coordinates.radius, options);
          break;
          
        case ShapeType.RECTANGLE:
          if (!coordinates.bounds || coordinates.bounds.length !== 2) {
            throw new Error('矩形需要bounds参数，包含两个点坐标');
          }
          const cornerA = Array.isArray(coordinates.bounds[0])
            ? L.latLng(coordinates.bounds[0][0], coordinates.bounds[0][1])
            : coordinates.bounds[0];
          const cornerB = Array.isArray(coordinates.bounds[1])
            ? L.latLng(coordinates.bounds[1][0], coordinates.bounds[1][1])
            : coordinates.bounds[1];
          layer = this.createRectangle([cornerA, cornerB], options);
          break;
        case ShapeType.POLYGON:
          if (!coordinates.latlngs || coordinates.latlngs.length < 3) {
            throw new Error('多边形至少需要3个点');
          }
          const polygonPoints = coordinates.latlngs.map((coord: number[] | LatLng) =>
            Array.isArray(coord) ? L.latLng(coord[0], coord[1]) : coord
          );
          layer = this.createPolygon(polygonPoints, options);
          break;
        case ShapeType.POLYLINE:
          if (!coordinates.latlngs || coordinates.latlngs.length < 2) {
            throw new Error('折线至少需要2个点');
          }
          const polylinePoints = coordinates.latlngs.map((coord: number[] | LatLng) =>
            Array.isArray(coord) ? L.latLng(coord[0], coord[1]) : coord
          );
          layer = this.createPolyline(polylinePoints, options);
          break;
        default:
          throw new Error(`未支持的形状类型: ${type}`);
      }
      this.shapesLayerGroup.addLayer(layer);
      return layer;
    } catch (e) {
      error(`添加形状失败: ${e}`);
      return null;
    }
  }
  
  /**
   * 启用图形编辑
   */
  public enableEditing(shapeId: string): boolean {
    const shape = this.shapes.get(shapeId);
    if (!shape) {
      return false;
    }
    
    try {
      const layer = shape.layer as any;
      if (layer.enableEdit) {
        layer.enableEdit();
        shape.editable = true;
        return true;
      } else {
        warn(`图形 ${shapeId} 不支持编辑`);
        return false;
      }
    } catch (e) {
      error(`启用图形 ${shapeId} 编辑时出错:`, e);
      return false;
    }
  }
  
  /**
   * 禁用图形编辑
   */
  public disableEditing(shapeId: string): boolean {
    const shape = this.shapes.get(shapeId);
    if (!shape) {
      return false;
    }
    
    try {
      const layer = shape.layer as any;
      if (layer.disableEdit) {
        layer.disableEdit();
        shape.editable = false;
        return true;
      } else {
        return false;
      }
    } catch (e) {
      error(`禁用图形 ${shapeId} 编辑时出错:`, e);
      return false;
    }
  }
  
  /**
   * 禁用所有图形的编辑功能
   */
  public disableAllEditing(): void {
    try {
      // 获取所有图形ID
      const shapeIds = this.getShapeIds();
      
      // 逐个禁用编辑
      for (const shapeId of shapeIds) {
        this.disableEditing(shapeId);
      }
      
      this.addLog('已禁用所有图形的编辑功能');
    } catch (e) {
      error('禁用所有图形编辑功能时出错:', e);
    }
  }
  
  /**
   * 移除图形
   */
  public removeShape(shapeId: string): boolean {
    const shape = this.shapes.get(shapeId);
    if (!shape) {
      return false;
    }
    
    try {
      // 如果正在编辑，先禁用编辑
      if (shape.editable) {
        this.disableEditing(shapeId);
      }
      
      // 从图层中移除
      this.shapesLayerGroup.removeLayer(shape.layer);
      
      // 从集合中移除
      this.shapes.delete(shapeId);
      
      // 触发事件
      this.fireEvent('shape-removed', {
        id: shapeId,
        options: shape.options
      });
      
      return true;
    } catch (e) {
      error(`移除图形 ${shapeId} 时出错:`, e);
      return false;
    }
  }
  
  /**
   * 清除所有图形
   */
  public clearShapes(): void {
    try {
      this.addLog('开始清除所有图形');
      
      // 停止任何进行中的绘制
      if (this._isDrawing) {
        this.cancelDrawing();
        this.addLog('已取消当前进行中的绘制');
      }
      
      // 获取清除前的图形数量
      const shapeCount = this.shapes.size;
      
      // 先禁用所有图形的编辑功能
      this.disableAllEditing();
      
      // 清空图层
      this.shapesLayerGroup.clearLayers();
      this.addLog('已从地图中清除所有图形图层');
      
      // 清空集合
      this.shapes.clear();
      
      // 触发事件
      this.fireEvent('shapes-cleared', {
        count: shapeCount
      });
      
      this.addLog(`成功清除了 ${shapeCount} 个图形`);
    } catch (e) {
      error('清除图形时出错:', e);
      
      // 尝试强制清理
      try {
        this.shapesLayerGroup.clearLayers();
        this.shapes.clear();
        this.addLog('通过强制方式清除了图形');
      } catch (clearError) {
        error('强制清除图形时出错:', clearError);
      }
    }
  }
  
  /**
   * 获取所有图形ID
   */
  public getShapeIds(): string[] {
    return Array.from(this.shapes.keys());
  }
  
  /**
   * 获取图形对象
   */
  public getShape(shapeId: string): ShapeState | undefined {
    return this.shapes.get(shapeId);
  }
  
  /**
   * 注册事件监听器
   */
  public on(event: ShapeEventType, listener: ShapeEventListener): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    
    this.eventListeners[event].push(listener);
  }
  
  /**
   * 移除事件监听器
   */
  public off(event: ShapeEventType, listener: ShapeEventListener): void {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(listener);
      if (index !== -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }
  
  /**
   * 触发事件
   */
  private fireEvent(event: ShapeEventType, data: any): void {
    if (this.eventListeners[event]) {
      for (const listener of this.eventListeners[event]) {
        try {
          listener(data);
        } catch (e) {
          error(`调用事件监听器 ${event} 时出错:`, e);
        }
      }
    }
  }
  
  /**
   * 调试用：输出当前绘图选项
   * 用于测试绘图选项是否正确设置
   */
  public debugDrawingOptions(): any {
    // 获取当前绘图类型对应的选项
    const currentType = this._drawingType || ShapeType.POLYLINE;
    const options = this.getLeafletOptions({
      type: currentType
    });
    
    // 输出调试信息
    console.log(`当前绘图类型: ${currentType}`);
    console.log('绘图选项:', options);
    
    // 特别检查polyline类型
    if (currentType === ShapeType.POLYLINE) {
      console.log('折线填充状态:', options.fill);
      console.log('折线填充透明度:', options.fillOpacity);
    }
    
    return options;
  }
} 