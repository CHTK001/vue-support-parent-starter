/**
 * 图形对象
 * @description 管理地图图形的添加、更新、删除等操作
 */
import L from 'leaflet';
import { v4 as uuidv4 } from 'uuid';
import logger from './LogObject';
import { ShapeType } from '../types/shape';

// 定义用于Leaflet的ShapeOption接口
interface ShapeOption {
  id: string;
  type: ShapeType;
  coordinates?: number[][];
  radius?: number;
  style?: {
    color?: string;
    weight?: number;
    opacity?: number;
    fillColor?: string;
    fillOpacity?: number;
    dashArray?: string;
    className?: string;
  };
  data?: any;
}

// 定义内部使用的Shape类型
interface ShapeItem {
  id: string;
  type: ShapeType;
  options: ShapeOption;
  layer: L.Layer | null;
}

// 向后兼容性的类型别名
export type Shape = ShapeItem;

export class ShapeObject {
  private mapInstance: L.Map;
  private shapes: Map<string, ShapeItem> = new Map();
  private shapeLayer: L.LayerGroup;
  private clickListener: ((id: string, event: L.LeafletMouseEvent) => void) | null = null;
  
  // 编辑状态
  private editEnabled: boolean = false;
  private currentEditingShape: string | null = null;

  /**
   * 构造函数
   * @param mapInstance Leaflet地图实例
   */
  constructor(mapInstance: L.Map) {
    this.mapInstance = mapInstance;
    
    // 创建图形图层
    this.shapeLayer = L.layerGroup().addTo(this.mapInstance);
    
    logger.debug('ShapeObject已初始化');
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
        options: { ...options },
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
      }
      
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
      color: options.style?.color || '#3388ff',
      weight: options.style?.weight || 2,
      opacity: options.style?.opacity || 1,
      fillColor: options.style?.fillColor || '#3388ff',
      fillOpacity: options.style?.fillOpacity || 0.2,
      dashArray: options.style?.dashArray,
      className: options.style?.className
    });
    
    // 绑定点击事件
    rectangle.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      this.handleShapeClick(id, e);
    });
    
    // 存储数据
    rectangle.options.id = id;
    rectangle.options.data = options.data || {};
    
    return {
      id,
      type: ShapeType.RECTANGLE,
      options,
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
      color: options.style?.color || '#3388ff',
      weight: options.style?.weight || 2,
      opacity: options.style?.opacity || 1,
      fillColor: options.style?.fillColor || '#3388ff',
      fillOpacity: options.style?.fillOpacity || 0.2,
      dashArray: options.style?.dashArray,
      className: options.style?.className
    });
    
    // 绑定点击事件
    circle.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      this.handleShapeClick(id, e);
    });
    
    // 存储数据
    circle.options.id = id;
    circle.options.data = options.data || {};
    
    return {
      id,
      type: ShapeType.CIRCLE,
      options,
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
    // 确保有坐标点
    if (!options.coordinates || !Array.isArray(options.coordinates) || options.coordinates.length < 3) {
      throw new Error('多边形坐标点不足');
    }
    
    // 创建坐标点数组
    const latlngs = options.coordinates.map(point => L.latLng(point[0], point[1]));
    
    // 创建多边形
    const polygon = L.polygon(latlngs, {
      color: options.style?.color || '#3388ff',
      weight: options.style?.weight || 2,
      opacity: options.style?.opacity || 1,
      fillColor: options.style?.fillColor || '#3388ff',
      fillOpacity: options.style?.fillOpacity || 0.2,
      dashArray: options.style?.dashArray,
      className: options.style?.className
    });
    
    // 绑定点击事件
    polygon.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      this.handleShapeClick(id, e);
    });
    
    // 存储数据
    polygon.options.id = id;
    polygon.options.data = options.data || {};
    
    return {
      id,
      type: ShapeType.POLYGON,
      options,
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
    // 确保有坐标点
    if (!options.coordinates || !Array.isArray(options.coordinates) || options.coordinates.length < 2) {
      throw new Error('折线坐标点不足');
    }
    
    // 创建坐标点数组
    const latlngs = options.coordinates.map(point => L.latLng(point[0], point[1]));
    
    // 创建折线
    const polyline = L.polyline(latlngs, {
      color: options.style?.color || '#3388ff',
      weight: options.style?.weight || 3,
      opacity: options.style?.opacity || 1,
      dashArray: options.style?.dashArray,
      className: options.style?.className
    });
    
    // 绑定点击事件
    polyline.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      this.handleShapeClick(id, e);
    });
    
    // 存储数据
    polyline.options.id = id;
    polyline.options.data = options.data || {};
    
    return {
      id,
      type: ShapeType.POLYLINE,
      options,
      layer: polyline
    };
  }

  /**
   * 处理图形点击事件
   * @param id 图形ID
   * @param event 点击事件
   */
  private handleShapeClick(id: string, event: L.LeafletMouseEvent): void {
    const shape = this.shapes.get(id);
    if (!shape) return;
    
    // 触发回调
    if (this.clickListener) {
      this.clickListener(id, event);
    }
    
    logger.debug(`图形点击: ${id}`);
  }

  /**
   * 设置图形点击监听器
   * @param listener 监听函数
   */
  public setClickListener(listener: (id: string, event: L.LeafletMouseEvent) => void): void {
    this.clickListener = listener;
  }

  /**
   * 更新图形
   * @param id 图形ID
   * @param options 图形选项
   * @returns 是否更新成功
   */
  public updateShape(id: string, options: Partial<ShapeOption>): boolean {
    const shape = this.shapes.get(id);
    if (!shape || !shape.layer) {
      logger.warn(`更新图形失败: ${id} 不存在`);
      return false;
    }
    
    try {
      const layer = shape.layer;
      
      // 更新样式选项
      if (options.style?.color !== undefined) layer.setStyle({ color: options.style.color });
      if (options.style?.weight !== undefined) layer.setStyle({ weight: options.style.weight });
      if (options.style?.opacity !== undefined) layer.setStyle({ opacity: options.style.opacity });
      if (options.style?.fillColor !== undefined) layer.setStyle({ fillColor: options.style.fillColor });
      if (options.style?.fillOpacity !== undefined) layer.setStyle({ fillOpacity: options.style.fillOpacity });
      if (options.style?.dashArray !== undefined) layer.setStyle({ dashArray: options.style.dashArray });
      
      // 更新几何属性
      switch (shape.type) {
        case ShapeType.RECTANGLE:
          if (options.coordinates) {
            const bounds = L.latLngBounds(
              L.latLng(options.coordinates[0][0], options.coordinates[0][1]),
              L.latLng(options.coordinates[1][0], options.coordinates[1][1])
            );
            (layer as L.Rectangle).setBounds(bounds);
          }
          break;
        case ShapeType.CIRCLE:
          if (options.coordinates && Array.isArray(options.coordinates) && options.coordinates.length === 1) {
            const center = L.latLng(options.coordinates[0][0], options.coordinates[0][1]);
            (layer as L.Circle).setLatLng(center);
          }
          if (options.radius) {
            (layer as L.Circle).setRadius(options.radius);
          }
          break;
        case ShapeType.POLYGON:
        case ShapeType.POLYLINE:
          if (options.coordinates) {
            const latlngs = options.coordinates.map(point => L.latLng(point[0], point[1]));
            layer.setLatLngs(latlngs);
          }
          break;
      }
      
      // 更新数据
      if (options.data) {
        layer.options.data = {
          ...layer.options.data,
          ...options.data
        };
      }
      
      // 更新存储的选项
      shape.options = {
        ...shape.options,
        ...options
      };
      
      logger.debug(`更新图形: ${id}`);
      return true;
    } catch (error) {
      logger.error(`更新图形失败: ${id}`, error);
      return false;
    }
  }

  /**
   * 移除图形
   * @param id 图形ID
   * @returns 是否移除成功
   */
  public removeShape(id: string): boolean {
    const shape = this.shapes.get(id);
    if (!shape || !shape.layer) {
      logger.warn(`移除图形失败: ${id} 不存在`);
      return false;
    }
    
    try {
      // 从图层移除
      this.shapeLayer.removeLayer(shape.layer);
      // 从集合移除
      this.shapes.delete(id);
      
      logger.debug(`移除图形: ${id}`);
      return true;
    } catch (error) {
      logger.error(`移除图形失败: ${id}`, error);
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
    return this.shapes;
  }

  /**
   * 清除所有图形
   */
  public clearAll(): void {
    // 清空图层
    this.shapeLayer.clearLayers();
    // 清空集合
    this.shapes.clear();
    
    logger.debug('清除所有图形');
  }

  /**
   * 显示所有图形
   */
  public showAll(): void {
    if (!this.mapInstance.hasLayer(this.shapeLayer)) {
      this.shapeLayer.addTo(this.mapInstance);
    }
    
    logger.debug('显示所有图形');
  }

  /**
   * 隐藏所有图形
   */
  public hideAll(): void {
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
   * 销毁对象，清理资源
   */
  public destroy(): void {
    // 清空图形
    this.clearAll();
    
    // 从地图移除图层
    if (this.mapInstance.hasLayer(this.shapeLayer)) {
      this.mapInstance.removeLayer(this.shapeLayer);
    }
    
    // 清空监听器
    this.clickListener = null;
    
    logger.debug('ShapeObject已销毁');
  }
} 