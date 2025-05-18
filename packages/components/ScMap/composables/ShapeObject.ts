/**
 * 图形对象
 * @description 管理地图图形的添加、编辑、删除等操作
 */
import L from 'leaflet';
import 'leaflet-editable';
import { v4 as uuidv4 } from 'uuid';
import logger from './LogObject';
import { ShapeType, type ShapeItem, type ShapeOption } from '../types/shape';
export class ShapeObject {
  private mapInstance: L.Map;
  private shapes: Map<string, ShapeItem> = new Map();
  private shapeLayer: L.LayerGroup;
  
  // 事件监听器
  private clickListeners: Array<(id: string, event: L.LeafletMouseEvent) => void> = [];
  private createListeners: Array<(id: string, shape: ShapeItem) => void> = [];
  private updateListeners: Array<(id: string, shape: ShapeItem) => void> = [];
  private deleteListeners: Array<(id: string) => void> = [];
  
  // 编辑状态
  private editMode: boolean = false;
  private drawingMode: ShapeType | null = null;
  private currentEditingShape: string | null = null;
  
  // 默认样式
  private defaultStyle = {
    color: '#3388ff',
    weight: 3,
    opacity: 1,
    fillColor: '#3388ff',
    fillOpacity: 0.2
  };

  /**
   * 构造函数
   * @param mapInstance Leaflet地图实例
   */
  constructor(mapInstance: L.Map) {
    this.mapInstance = mapInstance;
    
    // 创建图形图层
    this.shapeLayer = L.layerGroup().addTo(this.mapInstance);
    
    // 绑定事件
    this.bindEvents();
    
    logger.debug('ShapeObject已初始化');
  }

  /**
   * 绑定编辑事件
   */
  private bindEvents(): void {
    if (!this.mapInstance) return;
    
    // 绑定编辑完成事件
    this.mapInstance.on('editable:editing', (e: any) => {
      const layer = e.layer;
      const id = layer.options.id;
      
      if (id && this.shapes.has(id)) {
        const shape = this.shapes.get(id)!;
        
        // 更新坐标
        if (shape.type === ShapeType.RECTANGLE) {
          const bounds = (layer as L.Rectangle).getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          shape.options.coordinates = [
            [sw.lat, sw.lng],
            [ne.lat, ne.lng]
          ];
        } else if (shape.type === ShapeType.CIRCLE) {
          const center = (layer as L.Circle).getLatLng();
          const radius = (layer as L.Circle).getRadius();
          shape.options.coordinates = [[center.lat, center.lng]];
          shape.options.radius = radius;
        } else if (shape.type === ShapeType.POLYGON || shape.type === ShapeType.POLYLINE) {
          const latLngs = (layer as L.Polygon | L.Polyline).getLatLngs();
          shape.options.coordinates = this.latLngsToCoordinates(latLngs);
        }
        
        // 触发更新事件
        this.updateListeners.forEach(listener => {
          listener(id, shape);
        });
      }
    });
    
    // 绑定绘制完成事件
    this.mapInstance.on('editable:drawing:end', (e: any) => {
      const layer = e.layer;
      
      if (layer && this.drawingMode) {
        // 停止绘制
        this.stopDrawing();
        
        // 生成ID
        const id = uuidv4();
        
        // 创建图形对象
        const shapeOptions: ShapeOption = {
          id,
          type: this.drawingMode,
          style: this.defaultStyle
        };
        
        // 获取坐标
        if (this.drawingMode === ShapeType.RECTANGLE) {
          const bounds = (layer as L.Rectangle).getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          shapeOptions.coordinates = [
            [sw.lat, sw.lng],
            [ne.lat, ne.lng]
          ];
        } else if (this.drawingMode === ShapeType.CIRCLE) {
          const center = (layer as L.Circle).getLatLng();
          const radius = (layer as L.Circle).getRadius();
          shapeOptions.coordinates = [[center.lat, center.lng]];
          shapeOptions.radius = radius;
        } else if (this.drawingMode === ShapeType.POLYGON || this.drawingMode === ShapeType.POLYLINE) {
          const latLngs = (layer as L.Polygon | L.Polyline).getLatLngs();
          shapeOptions.coordinates = this.latLngsToCoordinates(latLngs);
        }
        
        // 保存图形
        const shapeItem: ShapeItem = {
          id,
          type: this.drawingMode,
          options: shapeOptions,
          layer
        };
        
        // 存储数据
        layer.options.id = id;
        this.shapes.set(id, shapeItem);
        
        // 从editTools图层移动到shapeLayer
        if (this.mapInstance.editTools && this.mapInstance.editTools.featuresLayer) {
          this.mapInstance.editTools.featuresLayer.removeLayer(layer);
        }
        layer.addTo(this.shapeLayer);
        
        // 绑定点击事件
        layer.on('click', (event) => {
          L.DomEvent.stopPropagation(event);
          this.handleShapeClick(id, event);
        });
        
        // 触发创建事件
        this.createListeners.forEach(listener => {
          listener(id, shapeItem);
        });
        
        logger.debug(`图形绘制完成: ${id}, 类型: ${this.drawingMode}`);
      }
    });
    
    // 绑定绘制取消事件
    this.mapInstance.on('editable:drawing:cancel', () => {
      this.drawingMode = null;
      logger.debug('图形绘制已取消');
    });
  }

  /**
   * LatLngs转换为坐标数组
   * @param latLngs 经纬度数组
   * @returns 坐标数组
   */
  private latLngsToCoordinates(latLngs: any): number[][] {
    if (Array.isArray(latLngs)) {
      if (latLngs.length > 0 && latLngs[0] instanceof L.LatLng) {
        // 单层数组
        return latLngs.map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);
      } else if (latLngs.length > 0 && Array.isArray(latLngs[0])) {
        // 多层数组
        return latLngs[0].map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);
      }
    }
    return [];
  }

  /**
   * 开始绘制图形
   * @param type 图形类型
   * @param options 绘制选项
   */
  public startDrawing(type: ShapeType, options?: any): void {
    if (!this.mapInstance || !this.mapInstance.editTools) {
      logger.error('地图实例或editTools不可用');
      return;
    }
    
    // 停止当前绘制
    this.stopDrawing();
    
    // 设置绘制模式
    this.drawingMode = type;
    
    // 合并样式选项
    const drawOptions = {
      ...this.defaultStyle,
      ...options
    };
    
    // 开始绘制
    try {
      switch (type) {
        case ShapeType.RECTANGLE:
          this.mapInstance.editTools.startRectangle(undefined, drawOptions);
          break;
        case ShapeType.CIRCLE:
          this.mapInstance.editTools.startCircle(undefined, drawOptions);
          break;
        case ShapeType.POLYGON:
          this.mapInstance.editTools.startPolygon(undefined, drawOptions);
          break;
        case ShapeType.POLYLINE:
          this.mapInstance.editTools.startPolyline(undefined, drawOptions);
          break;
        default:
          logger.warn(`不支持的图形类型: ${type}`);
          return;
      }
      
      logger.debug(`开始绘制图形: ${type}`);
    } catch (error) {
      logger.error('开始绘制图形失败:', error);
    }
  }

  /**
   * 停止绘制
   */
  public stopDrawing(): void {
    if (this.mapInstance && this.mapInstance.editTools) {
      this.mapInstance.editTools.stopDrawing();
      this.drawingMode = null;
      logger.debug('停止绘制图形');
    }
  }

  /**
   * 添加图形
   * @param options 图形选项
   * @returns 图形ID
   */
  public addShape(options: ShapeOption): string {
    // 生成唯一ID
    const id = options.id || uuidv4();
    const type = options.type || ShapeType.RECTANGLE;
    
    try {
      let shape: ShapeItem = {
        id,
        type,
        options: { ...options, id },
        layer: null
      };
      
      // 根据类型创建图形
      switch (type) {
        case ShapeType.RECTANGLE:
          shape = this.createRectangle(id, options);
          break;
        case ShapeType.CIRCLE:
          shape = this.createCircle(id, options);
          break;
        case ShapeType.POLYGON:
          shape = this.createPolygon(id, options);
          break;
        case ShapeType.POLYLINE:
          shape = this.createPolyline(id, options);
          break;
        default:
          logger.warn(`不支持的图形类型: ${type}`);
          return '';
      }
      
      // 存储图形
      this.shapes.set(id, shape);
      
      // 添加到图层
      if (shape.layer) {
        shape.layer.addTo(this.shapeLayer);
        
        // 绑定点击事件
        shape.layer.on('click', (event) => {
          L.DomEvent.stopPropagation(event);
          this.handleShapeClick(id, event);
        });
      }
      
      // 触发创建事件
      this.createListeners.forEach(listener => {
        listener(id, shape);
      });
      
      logger.debug(`添加图形: ${id}, 类型: ${type}`);
      return id;
    } catch (error) {
      logger.error(`添加图形失败:`, error);
      return '';
    }
  }

  /**
   * 创建矩形
   * @param id 图形ID
   * @param options 图形选项
   * @returns 图形对象
   */
  private createRectangle(id: string, options: ShapeOption): ShapeItem {
    // 确保有边界
    if (!options.coordinates || !Array.isArray(options.coordinates) || options.coordinates.length !== 2) {
      throw new Error('矩形边界无效');
    }
    
    // 创建边界对象
    const bounds = L.latLngBounds(
      L.latLng(options.coordinates[0][0], options.coordinates[0][1]),
      L.latLng(options.coordinates[1][0], options.coordinates[1][1])
    );
    
    // 创建矩形
    const rectangle = L.rectangle(bounds, {
      color: options.style?.color || this.defaultStyle.color,
      weight: options.style?.weight || this.defaultStyle.weight,
      opacity: options.style?.opacity || this.defaultStyle.opacity,
      fillColor: options.style?.fillColor || this.defaultStyle.fillColor,
      fillOpacity: options.style?.fillOpacity || this.defaultStyle.fillOpacity,
      dashArray: options.style?.dashArray,
      className: options.style?.className,
      id: id
    });
    
    return {
      id,
      type: ShapeType.RECTANGLE,
      options: { ...options, id },
      layer: rectangle
    };
  }

  /**
   * 创建圆形
   * @param id 图形ID
   * @param options 图形选项
   * @returns 图形对象
   */
  private createCircle(id: string, options: ShapeOption): ShapeItem {
    // 确保有中心点和半径
    if (!options.coordinates || !Array.isArray(options.coordinates) || options.coordinates.length !== 1 || !options.radius) {
      throw new Error('圆形中心点或半径无效');
    }
    
    // 创建中心点
    const center = L.latLng(options.coordinates[0][0], options.coordinates[0][1]);
    
    // 创建圆形
    const circle = L.circle(center, {
      radius: options.radius,
      color: options.style?.color || this.defaultStyle.color,
      weight: options.style?.weight || this.defaultStyle.weight,
      opacity: options.style?.opacity || this.defaultStyle.opacity,
      fillColor: options.style?.fillColor || this.defaultStyle.fillColor,
      fillOpacity: options.style?.fillOpacity || this.defaultStyle.fillOpacity,
      dashArray: options.style?.dashArray,
      className: options.style?.className,
      id: id
    });
    
    return {
      id,
      type: ShapeType.CIRCLE,
      options: { ...options, id },
      layer: circle
    };
  }

  /**
   * 创建多边形
   * @param id 图形ID
   * @param options 图形选项
   * @returns 图形对象
   */
  private createPolygon(id: string, options: ShapeOption): ShapeItem {
    // 确保有坐标
    if (!options.coordinates || !Array.isArray(options.coordinates) || options.coordinates.length < 3) {
      throw new Error('多边形坐标无效');
    }
    
    // 创建坐标点数组
    const latLngs = options.coordinates.map(coord => L.latLng(coord[0], coord[1]));
    
    // 创建多边形
    const polygon = L.polygon(latLngs, {
      color: options.style?.color || this.defaultStyle.color,
      weight: options.style?.weight || this.defaultStyle.weight,
      opacity: options.style?.opacity || this.defaultStyle.opacity,
      fillColor: options.style?.fillColor || this.defaultStyle.fillColor,
      fillOpacity: options.style?.fillOpacity || this.defaultStyle.fillOpacity,
      dashArray: options.style?.dashArray,
      className: options.style?.className,
      id: id
    });
    
    return {
      id,
      type: ShapeType.POLYGON,
      options: { ...options, id },
      layer: polygon
    };
  }

  /**
   * 创建折线
   * @param id 图形ID
   * @param options 图形选项
   * @returns 图形对象
   */
  private createPolyline(id: string, options: ShapeOption): ShapeItem {
    // 确保有坐标
    if (!options.coordinates || !Array.isArray(options.coordinates) || options.coordinates.length < 2) {
      throw new Error('折线坐标无效');
    }
    
    // 创建坐标点数组
    const latLngs = options.coordinates.map(coord => L.latLng(coord[0], coord[1]));
    
    // 创建折线
    const polyline = L.polyline(latLngs, {
      color: options.style?.color || this.defaultStyle.color,
      weight: options.style?.weight || this.defaultStyle.weight,
      opacity: options.style?.opacity || this.defaultStyle.opacity,
      dashArray: options.style?.dashArray,
      className: options.style?.className,
      id: id
    });
    
    return {
      id,
      type: ShapeType.POLYLINE,
      options: { ...options, id },
      layer: polyline
    };
  }

  /**
   * 处理图形点击事件
   * @param id 图形ID
   * @param event 事件对象
   */
  private handleShapeClick(id: string, event: L.LeafletMouseEvent): void {
    // 触发所有点击监听器
    this.clickListeners.forEach(listener => {
      listener(id, event);
    });
    
    // 如果在编辑模式下，开始编辑该图形
    if (this.editMode && this.shapes.has(id)) {
      this.startEditing(id);
    }
  }

  /**
   * 添加点击监听器
   * @param listener 监听器函数
   */
  public addClickListener(listener: (id: string, event: L.LeafletMouseEvent) => void): void {
    this.clickListeners.push(listener);
  }

  /**
   * 添加创建监听器
   * @param listener 监听器函数
   */
  public addCreateListener(listener: (id: string, shape: ShapeItem) => void): void {
    this.createListeners.push(listener);
  }

  /**
   * 添加更新监听器
   * @param listener 监听器函数
   */
  public addUpdateListener(listener: (id: string, shape: ShapeItem) => void): void {
    this.updateListeners.push(listener);
  }

  /**
   * 添加删除监听器
   * @param listener 监听器函数
   */
  public addDeleteListener(listener: (id: string) => void): void {
    this.deleteListeners.push(listener);
  }

  /**
   * 启用编辑模式
   */
  public enableEditMode(): void {
    this.editMode = true;
    logger.debug('图形编辑模式已启用');
  }

  /**
   * 禁用编辑模式
   */
  public disableEditMode(): void {
    this.editMode = false;
    
    // 停止当前编辑
    if (this.currentEditingShape) {
      this.stopEditing();
    }
    
    logger.debug('图形编辑模式已禁用');
  }

  /**
   * 开始编辑图形
   * @param id 图形ID
   */
  public startEditing(id: string): void {
    // 检查图形是否存在
    if (!this.shapes.has(id)) {
      logger.warn(`图形不存在: ${id}`);
      return;
    }
    
    // 停止当前编辑
    if (this.currentEditingShape && this.currentEditingShape !== id) {
      this.stopEditing();
    }
    
    // 获取图形
    const shape = this.shapes.get(id)!;
    
    // 检查图层是否存在
    if (!shape.layer) {
      logger.warn(`图形图层不存在: ${id}`);
      return;
    }
    
    // 开始编辑
    try {
      (shape.layer as any).enableEdit();
      this.currentEditingShape = id;
      logger.debug(`开始编辑图形: ${id}`);
    } catch (error) {
      logger.error(`开始编辑图形失败: ${id}`, error);
    }
  }

  /**
   * 停止编辑
   */
  public stopEditing(): void {
    if (!this.currentEditingShape) return;
    
    // 获取当前编辑的图形
    const shape = this.shapes.get(this.currentEditingShape);
    
    if (shape && shape.layer) {
      try {
        (shape.layer as any).disableEdit();
        logger.debug(`停止编辑图形: ${this.currentEditingShape}`);
      } catch (error) {
        logger.error(`停止编辑图形失败: ${this.currentEditingShape}`, error);
      }
    }
    
    this.currentEditingShape = null;
  }

  /**
   * 更新图形
   * @param id 图形ID
   * @param options 更新选项
   * @returns 是否更新成功
   */
  public updateShape(id: string, options: Partial<ShapeOption>): boolean {
    // 检查图形是否存在
    if (!this.shapes.has(id)) {
      logger.warn(`图形不存在: ${id}`);
      return false;
    }
    
    try {
      // 获取当前图形
      const shape = this.shapes.get(id)!;
      
      // 停止编辑
      if (this.currentEditingShape === id) {
        this.stopEditing();
      }
      
      // 如果是完全替换图形，则删除旧图形并创建新的
      if (options.type && options.type !== shape.type) {
        this.removeShape(id);
        this.addShape({
          ...options,
          id
        } as ShapeOption);
        return true;
      }
      
      // 更新图形选项
      const newOptions = {
        ...shape.options,
        ...options
      };
      
      // 存储更新后的选项
      shape.options = newOptions;
      
      // 更新图层样式
      if (shape.layer) {
        const layer = shape.layer;
        
        // 更新样式
        if (options.style) {
          const newStyle = {
            ...shape.options.style,
            ...options.style
          };
          
          if (newStyle.color) layer.setStyle({ color: newStyle.color });
          if (newStyle.weight !== undefined) layer.setStyle({ weight: newStyle.weight });
          if (newStyle.opacity !== undefined) layer.setStyle({ opacity: newStyle.opacity });
          if (newStyle.fillColor) layer.setStyle({ fillColor: newStyle.fillColor });
          if (newStyle.fillOpacity !== undefined) layer.setStyle({ fillOpacity: newStyle.fillOpacity });
          if (newStyle.dashArray) layer.setStyle({ dashArray: newStyle.dashArray });
          
          shape.options.style = newStyle;
        }
        
        // 更新坐标
        if (options.coordinates) {
          if (shape.type === ShapeType.RECTANGLE && options.coordinates.length === 2) {
            const bounds = L.latLngBounds(
              L.latLng(options.coordinates[0][0], options.coordinates[0][1]),
              L.latLng(options.coordinates[1][0], options.coordinates[1][1])
            );
            (layer as L.Rectangle).setBounds(bounds);
          } else if (shape.type === ShapeType.CIRCLE && options.coordinates.length === 1) {
            const center = L.latLng(options.coordinates[0][0], options.coordinates[0][1]);
            (layer as L.Circle).setLatLng(center);
          } else if (shape.type === ShapeType.POLYGON || shape.type === ShapeType.POLYLINE) {
            const latLngs = options.coordinates.map(coord => L.latLng(coord[0], coord[1]));
            (layer as L.Polygon | L.Polyline).setLatLngs(latLngs);
          }
        }
        
        // 更新圆形半径
        if (shape.type === ShapeType.CIRCLE && options.radius) {
          (layer as L.Circle).setRadius(options.radius);
        }
      }
      
      // 触发更新事件
      this.updateListeners.forEach(listener => {
        listener(id, shape);
      });
      
      logger.debug(`更新图形: ${id}`);
      return true;
    } catch (error) {
      logger.error(`更新图形失败: ${id}`, error);
      return false;
    }
  }

  /**
   * 删除图形
   * @param id 图形ID
   * @returns 是否删除成功
   */
  public removeShape(id: string): boolean {
    // 检查图形是否存在
    if (!this.shapes.has(id)) {
      logger.warn(`图形不存在: ${id}`);
      return false;
    }
    
    try {
      // 获取图形
      const shape = this.shapes.get(id)!;
      
      // 如果正在编辑该图形，停止编辑
      if (this.currentEditingShape === id) {
        this.stopEditing();
      }
      
      // 从图层中移除
      if (shape.layer) {
        this.shapeLayer.removeLayer(shape.layer);
      }
      
      // 从集合中移除
      this.shapes.delete(id);
      
      // 触发删除事件
      this.deleteListeners.forEach(listener => {
        listener(id);
      });
      
      logger.debug(`删除图形: ${id}`);
      return true;
    } catch (error) {
      logger.error(`删除图形失败: ${id}`, error);
      return false;
    }
  }

  /**
   * 获取图形
   * @param id 图形ID
   * @returns 图形对象
   */
  public getShape(id: string): ShapeItem | null {
    return this.shapes.get(id) || null;
  }

  /**
   * 获取所有图形
   * @returns 图形集合
   */
  public getAllShapes(): Map<string, ShapeItem> {
    return new Map(this.shapes);
  }

  /**
   * 清空所有图形
   */
  public clearAll(): void {
    // 停止当前编辑
    if (this.currentEditingShape) {
      this.stopEditing();
    }
    
    // 清空图层
    this.shapeLayer.clearLayers();
    
    // 清空集合
    this.shapes.clear();
    
    logger.debug('清空所有图形');
  }

  /**
   * 显示所有图形
   */
  public showAll(): void {
    if (!this.mapInstance) return;
    
    // 如果图层不在地图上，添加到地图
    if (!this.mapInstance.hasLayer(this.shapeLayer)) {
      this.shapeLayer.addTo(this.mapInstance);
    }
    
    logger.debug('显示所有图形');
  }

  /**
   * 隐藏所有图形
   */
  public hideAll(): void {
    if (!this.mapInstance) return;
    
    // 停止当前编辑
    if (this.currentEditingShape) {
      this.stopEditing();
    }
    
    // 从地图移除图层
    if (this.mapInstance.hasLayer(this.shapeLayer)) {
      this.mapInstance.removeLayer(this.shapeLayer);
    }
    
    logger.debug('隐藏所有图形');
  }

  /**
   * 获取图形数量
   * @returns 图形数量
   */
  public getCount(): number {
    return this.shapes.size;
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    // 停止编辑
    if (this.currentEditingShape) {
      this.stopEditing();
    }
    
    // 清空图层
    if (this.mapInstance && this.shapeLayer) {
      this.mapInstance.removeLayer(this.shapeLayer);
    }
    
    // 清空集合
    this.shapes.clear();
    
    // 清空事件监听器
    this.clickListeners = [];
    this.createListeners = [];
    this.updateListeners = [];
    this.deleteListeners = [];
    
    logger.debug('ShapeObject已销毁');
  }
} 