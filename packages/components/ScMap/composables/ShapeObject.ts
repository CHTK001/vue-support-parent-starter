/**
 * 图形对象
 * @description 管理地图图形的添加、编辑、删除等操作
 * 基于leaflet-editable实现，提供更好的绘图体验
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
  private _currentEditor: any = null;
  
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
    
    // 确保地图有editable功能，更规范地初始化Leaflet.Editable
    if (!this.mapInstance.editTools) {
      logger.info('初始化Leaflet.Editable');
      
      try {
        // 创建Editable实例
        this.mapInstance.editTools = new (L as any).Editable(this.mapInstance, {
          // 编辑选项
          editLayer: this.shapeLayer, // 使用我们的图层作为编辑图层，以便更好地管理
          // 设置默认样式
          editStyle: {
            color: this.defaultStyle.color,
            weight: this.defaultStyle.weight,
            opacity: this.defaultStyle.opacity,
            fillColor: this.defaultStyle.fillColor,
            fillOpacity: this.defaultStyle.fillOpacity
          },
          // 确保禁用自动创建编辑点，由我们控制何时开始编辑
          skipMiddleMarkers: false
        });
        
        // 验证初始化是否成功
        if (!this.mapInstance.editTools.startPolygon) {
          throw new Error('Leaflet.Editable未正确初始化');
        }
        
        logger.debug('Leaflet.Editable初始化成功');
      } catch (error) {
        logger.error('Leaflet.Editable初始化失败:', error);
        
        // 创建一个基本的editTools对象，避免后续代码出错
        this.mapInstance.editTools = {
          featuresLayer: L.layerGroup().addTo(this.mapInstance),
          startPolygon: () => null,
          startPolyline: () => null,
          startRectangle: () => null,
          startCircle: () => null,
          stopDrawing: () => {}
        } as any;
      }
    }
    
    // 立即应用Leaflet.Editable补丁，确保在任何事件绑定之前应用
    this.patchLeafletEditable();
    
    // 绑定事件
    this.bindEvents();
    
    logger.debug('ShapeObject已初始化，支持editable');
  }

  /**
   * 为Leaflet.Editable添加补丁，防止常见错误
   */
  private patchLeafletEditable(): void {
    try {
      // 获取Leaflet.Editable的原型
      const L = (window as any).L;
      if (!L || !L.Editable || !L.Editable.prototype) {
        logger.warn('无法找到Leaflet.Editable，跳过补丁');
        return;
      }
      
      // 补丁1: 修复onDrawingMouseDown方法
      if (typeof L.Editable.prototype.onDrawingMouseDown === 'function') {
        const originalOnDrawingMouseDown = L.Editable.prototype.onDrawingMouseDown;
        
        L.Editable.prototype.onDrawingMouseDown = function(e: any) {
          try {
            // 安全性检查
            if (!this._drawingEditor) {
              logger.debug('提前创建_drawingEditor属性');
              this._drawingEditor = {};
              return;
            }
            
            // 确保feature存在
            if (!this._drawingEditor.feature) {
              logger.debug('创建缺失的feature对象');
              this._drawingEditor.feature = {};
            }
            
            // 确保_draggable存在，这是导致主要错误的部分
            if (!this._drawingEditor.feature._draggable) {
              logger.debug('创建缺失的_draggable对象');
              this._drawingEditor.feature._draggable = {
                _enabled: false,
                _moved: false,
                _moving: false
              };
            }
            
            // 确保其他可能缺失的属性
            ['_leaflet_id', '_leaflet_events', '_map', '_latlng'].forEach(prop => {
              if (!this._drawingEditor.feature[prop]) {
                this._drawingEditor.feature[prop] = prop === '_latlng' ? L.latLng(0, 0) : {};
              }
            });
            
            // 调用原始方法
            return originalOnDrawingMouseDown.call(this, e);
          } catch (error) {
            logger.error('处理onDrawingMouseDown时发生错误:', error);
            // 尝试安全地停止绘制
            try {
              this.stopDrawing();
            } catch (e) {
              // 忽略停止绘制时的错误
            }
          }
        };
        
        logger.debug('已修补onDrawingMouseDown方法');
      }
      
      // 补丁2: 确保commitDrawing中的错误处理
      if (L.Editable.PolylineEditor && L.Editable.PolylineEditor.prototype) {
        ['commitDrawing', 'cancelDrawing'].forEach(methodName => {
          if (typeof L.Editable.PolylineEditor.prototype[methodName] === 'function') {
            const originalMethod = L.Editable.PolylineEditor.prototype[methodName];
            
            L.Editable.PolylineEditor.prototype[methodName] = function() {
              try {
                return originalMethod.apply(this, arguments);
              } catch (error) {
                logger.error(`PolylineEditor.${methodName}方法出错:`, error);
                // 尝试清理状态
                if (this.drawing) this.drawing = false;
                if (this.map && this.map.editTools) {
                  this.map.editTools._currentDrawer = null;
                }
              }
            };
            
            logger.debug(`已修补PolylineEditor.${methodName}方法`);
          }
        });
      }
      
      // 补丁3: 处理编辑器创建过程中可能的错误
      ['startPolyline', 'startPolygon', 'startRectangle', 'startCircle'].forEach(methodName => {
        if (typeof L.Editable.prototype[methodName] === 'function') {
          const originalMethod = L.Editable.prototype[methodName];
          
          L.Editable.prototype[methodName] = function() {
            try {
              const editor = originalMethod.apply(this, arguments);
              
              // 确保返回的编辑器对象有必要的属性
              if (editor) {
                if (!editor.feature) editor.feature = {};
                if (!editor.feature._draggable) {
                  editor.feature._draggable = {
                    _enabled: false,
                    _moved: false
                  };
                }
                
                // 包装commitDrawing方法以增强健壮性
                if (typeof editor.commitDrawing === 'function') {
                  const originalCommit = editor.commitDrawing;
                  editor.commitDrawing = function() {
                    try {
                      return originalCommit.apply(this, arguments);
                    } catch (error) {
                      logger.error(`${methodName}.commitDrawing出错:`, error);
                      // 尝试清理状态
                      if (this.drawing) this.drawing = false;
                      if (this.map && this.map.editTools) {
                        this.map.editTools._currentDrawer = null;
                      }
                    }
                  };
                }
              }
              
              return editor;
            } catch (error) {
              logger.error(`${methodName}方法出错:`, error);
              return null;
            }
          };
          
          logger.debug(`已修补${methodName}方法`);
        }
      });
      
      logger.info('已为Leaflet.Editable添加全面的安全补丁');
    } catch (error) {
      logger.error('为Leaflet.Editable添加补丁失败:', error);
    }
  }

  /**
   * 绑定编辑事件
   */
  private bindEvents(): void {
    if (!this.mapInstance) return;
    
    try {
      // 绑定编辑中事件
    this.mapInstance.on('editable:editing', (e: any) => {
        try {
          logger.debug('图形编辑中', e);
          
          if (!e || !e.layer) return;
          
      const layer = e.layer;
          const id = layer.options?.id;
      
      if (id && this.shapes.has(id)) {
        const shape = this.shapes.get(id)!;
        
        // 更新坐标
            this.updateShapeCoordinates(shape, layer);
          }
        } catch (error) {
          logger.error('处理editable:editing事件时出错:', error);
        }
      });
      
      // 绑定顶点拖拽完成事件
      this.mapInstance.on('editable:vertex:dragend', (e: any) => {
        try {
          logger.debug('顶点拖拽完成', e);
          
          if (!e) return;
          
          const layer = e.layer || e.target;
          if (!layer) return;
          
          // 查找被编辑的图形对应的ID和类型
          for (const [id, shape] of this.shapes.entries()) {
            if (shape.layer === layer) {
              // 更新形状坐标
              this.updateShapeCoordinates(shape, layer);
              
              // 触发更新事件
              this.updateListeners.forEach(listener => {
                listener(id, shape);
              });
              
              break;
            }
          }
        } catch (error) {
          logger.error('处理editable:vertex:dragend事件时出错:', error);
        }
      });
      
      // 绑定绘制完成事件
      this.mapInstance.on('editable:drawing:end', (e: any) => {
        try {
          logger.debug('绘制完成事件', e);
          
          // 由_handleDrawingComplete处理完成逻辑
        } catch (error) {
          logger.error('处理editable:drawing:end事件时出错:', error);
        }
      });
      
      // 绑定绘制提交事件
      this.mapInstance.on('editable:drawing:commit', (e: any) => {
        try {
          logger.debug('绘制提交事件', e);
          
          // 由_handleDrawingComplete处理完成逻辑
        } catch (error) {
          logger.error('处理editable:drawing:commit事件时出错:', error);
        }
      });
      
      // 绑定绘制取消事件
      this.mapInstance.on('editable:drawing:cancel', () => {
        try {
          logger.debug('图形绘制已取消');
          
          // 重置状态
          this.drawingMode = null;
          this._currentEditor = null;
        } catch (error) {
          logger.error('处理editable:drawing:cancel事件时出错:', error);
        }
      });
      
      // 双击完成绘制
      this.mapInstance.on('dblclick', (e: any) => {
        try {
          // 如果正在绘制多边形或折线，则完成绘制
          if (this.drawingMode === ShapeType.POLYGON || this.drawingMode === ShapeType.POLYLINE) {
            if (this._currentEditor && 
                this._currentEditor.getLatLngs && 
                this._currentEditor.getLatLngs().length >= 2) {
              logger.debug('双击完成绘制');
              
              // 阻止双击事件冒泡和默认行为（防止地图放大）
              L.DomEvent.stopPropagation(e);
              L.DomEvent.preventDefault(e);
              
              // 使用安全的方式提交绘制
              try {
                if (this._currentEditor.commitDrawing) {
                  this._currentEditor.commitDrawing();
                } else if (this.mapInstance.editTools) {
                  this.mapInstance.editTools.stopDrawing();
                }
              } catch (error) {
                logger.error('双击提交绘制失败:', error);
                
                // 尝试安全停止
                this.stopDrawing();
              }
            }
          }
        } catch (error) {
          logger.error('处理双击完成绘制时出错:', error);
        }
      });
      
      logger.debug('已绑定所有Leaflet.Editable事件');
    } catch (error) {
      logger.error('绑定地图编辑事件失败:', error);
    }
  }
  
  /**
   * 更新图形坐标
   * @param shape 图形对象
   * @param layer 图层对象
   */
  private updateShapeCoordinates(shape: ShapeItem, layer: L.Layer): void {
    try {
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
    } catch (error) {
      logger.error('更新图形坐标失败:', error);
    }
  }
  
  /**
   * 设置图形坐标
   * @param options 图形选项
   * @param layer 图层对象
   * @param type 图形类型
   */
  private setShapeCoordinates(options: ShapeOption, layer: L.Layer, type: ShapeType): void {
    try {
      if (type === ShapeType.RECTANGLE) {
          const bounds = (layer as L.Rectangle).getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
        options.coordinates = [
            [sw.lat, sw.lng],
            [ne.lat, ne.lng]
          ];
      } else if (type === ShapeType.CIRCLE) {
          const center = (layer as L.Circle).getLatLng();
          const radius = (layer as L.Circle).getRadius();
        options.coordinates = [[center.lat, center.lng]];
        options.radius = radius;
      } else if (type === ShapeType.POLYGON || type === ShapeType.POLYLINE) {
          const latLngs = (layer as L.Polygon | L.Polyline).getLatLngs();
        options.coordinates = this.latLngsToCoordinates(latLngs);
      }
    } catch (error) {
      logger.error('设置图形坐标失败:', error);
    }
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
    
    logger.debug('开始绘制图形', { type, options });
    
    try {
      // 如果已经在绘制，先取消当前绘制
      if (this.drawingMode) {
    this.stopDrawing();
    
        // 确保editTools的状态已重置
        if (this.mapInstance.editTools._currentDrawer) {
          try {
            this.mapInstance.editTools.stopDrawing();
            this.mapInstance.editTools._currentDrawer = null;
          } catch (e) {
            logger.warn('停止现有绘制出错，继续执行:', e);
          }
        }
        
        // 添加短暂延迟，确保前一个绘制操作完全清理
        setTimeout(() => this._doStartDrawing(type, options), 50);
      } else {
        // 立即开始绘制
        this._doStartDrawing(type, options);
      }
    } catch (error) {
      logger.error('开始绘制图形失败:', error);
      this.drawingMode = null;
      this._currentEditor = null;
    }
  }
  
  /**
   * 实际执行图形绘制操作
   * @param type 图形类型
   * @param options 绘制选项
   * @private
   */
  private _doStartDrawing(type: ShapeType, options?: any): void {
    try {
    // 设置绘制模式
    this.drawingMode = type;
    
    // 合并样式选项
    const drawOptions = {
      ...this.defaultStyle,
      ...options
    };
      
      // 确保当前没有进行中的绘制
      if (this.mapInstance.editTools._currentDrawer) {
        try {
          this.mapInstance.editTools.stopDrawing();
          this.mapInstance.editTools._currentDrawer = null;
        } catch (e) {
          logger.warn('强制停止现有绘制时出错，继续执行:', e);
        }
      }
      
      // 获取地图中心点作为初始点
      const mapCenter = this.mapInstance.getCenter();
      logger.debug(`地图中心点: ${mapCenter.lat}, ${mapCenter.lng}`);
    
    // 开始绘制
    try {
      switch (type) {
        case ShapeType.RECTANGLE:
            // 矩形绘制使用地图中心点作为起始点
            this._currentEditor = this.mapInstance.editTools.startRectangle(mapCenter, drawOptions);
            logger.debug(`开始绘制矩形，起始点: ${mapCenter.lat}, ${mapCenter.lng}`);
          break;
            
        case ShapeType.CIRCLE:
            // 圆形绘制使用地图中心点作为起始点
            this._currentEditor = this.mapInstance.editTools.startCircle(mapCenter, drawOptions);
            logger.debug(`开始绘制圆形，中心点: ${mapCenter.lat}, ${mapCenter.lng}`);
          break;
            
        case ShapeType.POLYGON:
            // 多边形绘制不使用预设的起始点，等待用户点击
            this._currentEditor = this.mapInstance.editTools.startPolygon(null, drawOptions);
            logger.debug('开始绘制多边形，等待用户点击设置起始点');
          break;
            
        case ShapeType.POLYLINE:
            // 折线绘制不使用预设的起始点，等待用户点击
            this._currentEditor = this.mapInstance.editTools.startPolyline(null, drawOptions);
            logger.debug('开始绘制折线，等待用户点击设置起始点');
          break;
            
        default:
          logger.warn(`不支持的图形类型: ${type}`);
            this.drawingMode = null;
            return;
        }
      } catch (drawError) {
        logger.error('启动绘制工具时出错:', drawError);
        this.drawingMode = null;
          return;
      }
      
      // 检查编辑器是否成功创建
      if (!this._currentEditor) {
        logger.warn('编辑器创建失败，重置绘制状态');
        this.drawingMode = null;
        return;
      }
      
      // 初始化编辑器的必要属性和方法
      this.initializeEditor(this._currentEditor);
      
      // 添加编辑器事件监听
      this._setupEditorEvents(this._currentEditor);
      
      logger.debug('绘制模式已初始化完成');
    } catch (error) {
      logger.error('执行绘制操作失败:', error);
      this.drawingMode = null;
      this._currentEditor = null;
      
      // 尝试清理绘制状态
      try {
        if (this.mapInstance.editTools) {
          this.mapInstance.editTools.stopDrawing();
          this.mapInstance.editTools._currentDrawer = null;
        }
      } catch (e) {
        // 忽略清理错误
      }
    }
  }
  
  /**
   * 为编辑器设置事件处理
   * @param editor 编辑器对象
   * @private
   */
  private _setupEditorEvents(editor: any): void {
    if (!editor) return;
    
    try {
      // 监听编辑器的点击事件
      if (editor.feature) {
        // 保存对象引用，避免在事件处理器中的this问题
        const self = this;
        
        // 绑定编辑完成事件
        editor.on('editable:drawing:end', function(e: any) {
          logger.debug('捕获到editable:drawing:end事件');
          
          // 使用延迟处理，确保所有状态已更新
          setTimeout(() => {
            try {
              if (self.drawingMode && self._currentEditor) {
                logger.debug(`图形绘制完成，类型: ${self.drawingMode}`);
                
                // 处理绘制完成逻辑
                self._handleDrawingComplete(self.drawingMode, editor);
              }
            } catch (error) {
              logger.error('处理绘制完成事件时出错:', error);
            }
          }, 50);
        });
      }
    } catch (error) {
      logger.error('设置编辑器事件时出错:', error);
    }
  }
  
  /**
   * 处理绘制完成逻辑
   * @param shapeType 图形类型
   * @param editor 编辑器对象
   * @private
   */
  private _handleDrawingComplete(shapeType: ShapeType, editor: any): void {
    try {
      // 生成唯一ID
      const id = uuidv4();
      
      // 创建图形选项
      const shapeOptions: ShapeOption = {
        id,
        type: shapeType,
        style: { ...this.defaultStyle }
      };
      
      logger.debug(`处理绘制完成，类型: ${shapeType}，创建ID: ${id}`);
      
      // 需要从编辑器中正确地获取必要信息并创建对应的图层
      // 而不是直接使用editor.feature
      let layer: L.Layer | null = null;
      
      // 根据图形类型创建对应的图层
      switch (shapeType) {
        case ShapeType.RECTANGLE:
          // 对于矩形，需要从编辑器中获取边界
          try {
            const bounds = editor.getBounds ? editor.getBounds() : 
                          (editor.feature && editor.feature.getBounds ? editor.feature.getBounds() : null);
            
            if (!bounds) {
              throw new Error('无法获取矩形边界');
            }
            
            // 从边界创建矩形
            layer = L.rectangle(bounds, {
              color: shapeOptions.style?.color || this.defaultStyle.color,
              weight: shapeOptions.style?.weight || this.defaultStyle.weight,
              opacity: shapeOptions.style?.opacity || this.defaultStyle.opacity,
              fillColor: shapeOptions.style?.fillColor || this.defaultStyle.fillColor,
              fillOpacity: shapeOptions.style?.fillOpacity || this.defaultStyle.fillOpacity,
              id
            });
            
            // 设置矩形坐标
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            shapeOptions.coordinates = [
              [sw.lat, sw.lng],
              [ne.lat, ne.lng]
            ];
          } catch (e) {
            logger.error('创建矩形图层失败:', e);
          }
          break;
          
        case ShapeType.CIRCLE:
          // 对于圆形，需要从编辑器中获取中心点和半径
          try {
            const center = editor.getLatLng ? editor.getLatLng() : 
                          (editor.feature && editor.feature.getLatLng ? editor.feature.getLatLng() : null);
            
            const radius = editor.getRadius ? editor.getRadius() : 
                          (editor.feature && editor.feature.getRadius ? editor.feature.getRadius() : 0);
            
            if (!center) {
              throw new Error('无法获取圆形中心点');
            }
            
            // 从中心点和半径创建圆形
            layer = L.circle(center, {
              radius,
              color: shapeOptions.style?.color || this.defaultStyle.color,
              weight: shapeOptions.style?.weight || this.defaultStyle.weight,
              opacity: shapeOptions.style?.opacity || this.defaultStyle.opacity,
              fillColor: shapeOptions.style?.fillColor || this.defaultStyle.fillColor,
              fillOpacity: shapeOptions.style?.fillOpacity || this.defaultStyle.fillOpacity,
              id
            });
            
            // 设置圆形坐标和半径
            shapeOptions.coordinates = [[center.lat, center.lng]];
            shapeOptions.radius = radius;
          } catch (e) {
            logger.error('创建圆形图层失败:', e);
          }
          break;
          
        case ShapeType.POLYGON:
        case ShapeType.POLYLINE:
          // 对于多边形和折线，需要从编辑器中获取坐标点
          try {
            const latLngs = editor.getLatLngs ? editor.getLatLngs() : 
                          (editor.feature && editor.feature.getLatLngs ? editor.feature.getLatLngs() : null);
            
            if (!latLngs || !Array.isArray(latLngs)) {
              throw new Error('无法获取坐标点');
            }
            
            // 从坐标点创建多边形或折线
            if (shapeType === ShapeType.POLYGON) {
              layer = L.polygon(latLngs, {
                color: shapeOptions.style?.color || this.defaultStyle.color,
                weight: shapeOptions.style?.weight || this.defaultStyle.weight,
                opacity: shapeOptions.style?.opacity || this.defaultStyle.opacity,
                fillColor: shapeOptions.style?.fillColor || this.defaultStyle.fillColor,
                fillOpacity: shapeOptions.style?.fillOpacity || this.defaultStyle.fillOpacity,
                id
              });
            } else {
              layer = L.polyline(latLngs, {
                color: shapeOptions.style?.color || this.defaultStyle.color,
                weight: shapeOptions.style?.weight || this.defaultStyle.weight,
                opacity: shapeOptions.style?.opacity || this.defaultStyle.opacity,
                id
              });
            }
            
            // 设置坐标
            shapeOptions.coordinates = this.latLngsToCoordinates(latLngs);
          } catch (e) {
            logger.error(`创建${shapeType === ShapeType.POLYGON ? '多边形' : '折线'}图层失败:`, e);
          }
          break;
          
        default:
          logger.warn(`不支持的图形类型: ${shapeType}`);
          return;
      }
      
      // 检查图层是否成功创建
      if (!layer) {
        logger.error('图层创建失败，无法完成绘制');
        return;
      }
      
      // 添加到图层组
      layer.addTo(this.shapeLayer);
      
      // 保存图形
      const shapeItem: ShapeItem = {
        id,
        type: shapeType,
        options: shapeOptions,
        layer
      };
      
      // 设置图层ID
      layer.options = layer.options || {};
      layer.options.id = id;
      
      // 存储数据
      this.shapes.set(id, shapeItem);
      
      // 绑定点击事件
      layer.on('click', (event: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(event);
        this.handleShapeClick(id, event);
      });
      
      // 触发创建事件
      this.createListeners.forEach(listener => {
        listener(id, shapeItem);
      });
      
      logger.debug(`图形绘制完成: ${id}, 类型: ${shapeType}`);
      
      // 保存当前绘制类型，用于重新启动绘制
      const currentType = this.drawingMode;
      const currentOptions = { ...this.defaultStyle };
      
      // 停止当前绘制，但不重置绘制模式
      try {
        // 使用editTools停止当前绘制
        if (this.mapInstance && this.mapInstance.editTools) {
          this.mapInstance.editTools.stopDrawing();
          if (this.mapInstance.editTools._currentDrawer) {
            this.mapInstance.editTools._currentDrawer = null;
          }
        }
        
        // 清理编辑器引用
        this._currentEditor = null;
      } catch (e) {
        logger.warn('停止当前绘制器失败:', e);
      }
      
      // 短暂延迟后重新启动相同类型的绘制
      setTimeout(() => {
        if (currentType) {
          logger.debug(`重新启动图形绘制: ${currentType}`);
          this._doStartDrawing(currentType, currentOptions);
        }
      }, 50);
    } catch (error) {
      logger.error('处理绘制完成逻辑时出错:', error);
    }
  }

  /**
   * 初始化编辑器，确保所有必要的属性和方法都存在
   * @param editor 编辑器对象
   */
  private initializeEditor(editor: any): void {
    try {
      if (!editor) {
        logger.warn('编辑器对象为空，无法初始化');
        return;
      }
      
      // 为editor对象添加必要的属性和方法
      
      // 1. 确保feature存在
      if (!editor.feature) {
        logger.debug('创建缺失的editor.feature对象');
        editor.feature = {};
      }
      
      // 2. 确保_draggable属性存在（这是导致主要错误的地方）
      if (!editor.feature._draggable) {
        logger.debug('创建缺失的_draggable属性');
        editor.feature._draggable = {
          _enabled: false,
          _moved: false,
          _moving: false,
          dragging: false
        };
      }
      
      // 3. 确保基础Leaflet属性存在
      const leafletProps = [
        '_leaflet_id',
        '_leaflet_events',
        '_map',
        '_latlng',
        '_bounds',
        '_radius'
      ];
      
      leafletProps.forEach(prop => {
        if (!editor.feature[prop]) {
          if (prop === '_latlng' && editor.getLatLng) {
            // 如果有getLatLng方法，使用它获取坐标
            try {
              editor.feature._latlng = editor.getLatLng();
            } catch (e) {
              // 如果获取失败，创建默认坐标
              editor.feature._latlng = L.latLng(0, 0);
            }
          } else if (prop === '_bounds' && editor.getBounds) {
            // 如果有getBounds方法，使用它获取边界
            try {
              editor.feature._bounds = editor.getBounds();
            } catch (e) {
              // 如果获取失败，创建默认边界
              editor.feature._bounds = L.latLngBounds([0, 0], [0, 0]);
            }
          } else if (prop === '_radius' && editor.getRadius) {
            // 如果有getRadius方法，使用它获取半径
            try {
              editor.feature._radius = editor.getRadius() || 0;
            } catch (e) {
              // 如果获取失败，设置默认半径
              editor.feature._radius = 0;
            }
          } else {
            // 其他属性设置为空对象
            editor.feature[prop] = {};
          }
        }
      });
      
      // 4. 确保_drawnLatLngs存在（对多边形和折线很重要）
      if (!editor._drawnLatLngs) {
        editor._drawnLatLngs = [];
      }
      
      // 5. 确保editor具有关键方法
      const methods = ['commitDrawing', 'cancelDrawing', 'onDrawingClick', 'onDrawingMouseDown'];
      
      methods.forEach(methodName => {
        if (typeof editor[methodName] !== 'function') {
          logger.debug(`添加缺失的${methodName}方法`);
          editor[methodName] = function() {
            // 空实现，避免调用时出错
            logger.debug(`调用了自动创建的${methodName}方法`);
          };
        }
      });
      
      // 6. 包装现有的方法，添加错误处理
      methods.forEach(methodName => {
        if (typeof editor[methodName] === 'function' && !(editor[methodName] as any).__wrapped) {
          const originalMethod = editor[methodName];
          editor[methodName] = function() {
            try {
              return originalMethod.apply(this, arguments);
            } catch (error) {
              logger.error(`编辑器${methodName}方法出错:`, error);
              // 尝试安全地停止绘制
              if (methodName === 'commitDrawing' || methodName === 'cancelDrawing') {
                try {
                  if (this.map && this.map.editTools) {
                    this.map.editTools.stopDrawing();
                    this.map.editTools._currentDrawer = null;
                  }
                } catch (e) {
                  // 忽略停止绘制时的错误
                }
              }
            }
          };
          // 标记为已包装，避免重复包装
          (editor[methodName] as any).__wrapped = true;
        }
      });
      
      logger.debug('编辑器初始化完成，已添加必要的安全措施');
    } catch (error) {
      logger.error('初始化编辑器对象失败:', error);
    }
  }

  /**
   * 停止绘制
   */
  public stopDrawing(): void {
    try {
      logger.debug('停止绘制图形');
      
      // 如果没有处于绘制模式，直接返回
      if (!this.drawingMode && !this._currentEditor) {
        return;
      }
      
      // 保存当前绘制类型，用于日志
      const currentType = this.drawingMode;
      
      // 如果有当前编辑器，尝试提交绘制
      if (this._currentEditor) {
        try {
          // 尝试使用编辑器提交绘制
          if (this._currentEditor.commitDrawing) {
            this._currentEditor.commitDrawing();
            logger.debug('提交绘制成功');
          }
        } catch (e) {
          logger.warn('提交绘制失败，尝试使用其他方法停止:', e);
          
          // 尝试其他清理方式
          try {
            // 尝试使用cancelDrawing
            if (this._currentEditor.cancelDrawing) {
              this._currentEditor.cancelDrawing();
            }
          } catch (cancelError) {
            logger.warn('取消绘制也失败:', cancelError);
          }
        }
        
        // 清理编辑器引用
        this._currentEditor = null;
      }
      
      // 使用editTools停止绘制
    if (this.mapInstance && this.mapInstance.editTools) {
        try {
          // 停止绘制
      this.mapInstance.editTools.stopDrawing();
          
          // 清理当前绘制器
          if (this.mapInstance.editTools._currentDrawer) {
            try {
              // 如果有commitDrawing方法，尝试使用它
              if (this.mapInstance.editTools._currentDrawer.commitDrawing) {
                this.mapInstance.editTools._currentDrawer.commitDrawing();
              }
            } catch (e) {
              // 忽略错误
            }
            
            // 清理引用
            this.mapInstance.editTools._currentDrawer = null;
          }
          
          // 检查并取消可能存在的进行中编辑
          try {
            if (this.mapInstance.editTools.drawing()) {
              this.mapInstance.editTools.commitDrawing();
            }
          } catch (e) {
            // 忽略错误
          }
        } catch (stopError) {
          logger.warn('使用editTools停止绘制失败:', stopError);
        }
      }
      
      // 重置状态
      this.drawingMode = null;
      
      // 移除可能存在的临时处理器
      this.removeTemporaryHandlers();
      
      // 短暂延迟后检查是否真的停止了绘制
      setTimeout(() => {
        if (this.mapInstance && this.mapInstance.editTools && this.mapInstance.editTools._currentDrawer) {
          try {
            logger.debug('检测到残留的绘制器，强制再次清理');
            this.mapInstance.editTools.stopDrawing();
            this.mapInstance.editTools._currentDrawer = null;
          } catch (e) {
            // 忽略错误
          }
        }
      }, 100);
      
      logger.debug(`停止绘制完成，之前的类型: ${currentType}`);
    } catch (error) {
      logger.error('停止绘制失败:', error);
      
      // 确保状态重置
      this.drawingMode = null;
      this._currentEditor = null;
      
      // 强制清理
      if (this.mapInstance && this.mapInstance.editTools) {
        try {
          this.mapInstance.editTools.stopDrawing();
          this.mapInstance.editTools._currentDrawer = null;
        } catch (e) {
          // 忽略最终清理错误
        }
      }
      
      // 确保移除临时处理器
      this.removeTemporaryHandlers();
    }
  }
  
  /**
   * 彻底禁用绘制功能
   * 与stopDrawing不同，此方法确保绘制功能被完全禁用，
   * 用于当UI上的绘制按钮被取消激活时调用
   */
  public disableDrawing(): void {
    try {
      logger.debug('彻底禁用绘制功能');
      
      // 先停止当前绘制
      this.stopDrawing();
      
      // 额外确保各种状态和引用被清理
      this.drawingMode = null;
      this._currentEditor = null;
      
      // 解除地图上可能绑定的临时事件处理器
      if (this.mapInstance) {
        this.mapInstance.off('click', this.onMapClick, this);
        this.mapInstance.off('mousemove', this.onMapMouseMove, this);
        
        // 增加对editable:drawing:*事件的临时处理器解绑
        this.mapInstance.off('editable:drawing:start');
        this.mapInstance.off('editable:drawing:end');
        this.mapInstance.off('editable:drawing:click');
        this.mapInstance.off('editable:drawing:clicked');
      }
      
      // 确保editTools处于初始状态
      if (this.mapInstance && this.mapInstance.editTools) {
        try {
          this.mapInstance.editTools.stopDrawing();
          this.mapInstance.editTools._currentDrawer = null;
          
          // 检查并取消可能存在的进行中编辑
          if (this.mapInstance.editTools.drawing()) {
            this.mapInstance.editTools.commitDrawing();
          }
          
          // 尝试移除可能存在的临时编辑图层
          if (this.mapInstance.editTools.featuresLayer) {
            this.mapInstance.editTools.featuresLayer.clearLayers();
          }
        } catch (e) {
          logger.warn('清理editTools状态失败:', e);
        }
      }
      
      // 200ms延迟后再次检查是否有绘制器存在
      setTimeout(() => {
        if (this.mapInstance && this.mapInstance.editTools && this.mapInstance.editTools._currentDrawer) {
          try {
            logger.debug('检测到残留的绘制器，强制清理');
            this.mapInstance.editTools.stopDrawing();
            this.mapInstance.editTools._currentDrawer = null;
          } catch (e) {
            // 忽略错误
          }
        }
      }, 200);
      
      logger.debug('绘制功能已完全禁用');
    } catch (error) {
      logger.error('禁用绘制功能时出错:', error);
      
      // 确保状态被重置
      this.drawingMode = null;
      this._currentEditor = null;
      
      // 尝试强制清理
      this.removeTemporaryHandlers();
    }
  }
  
  /**
   * 移除绘制过程中可能添加的临时事件处理器
   * @private
   */
  private removeTemporaryHandlers(): void {
    if (this.mapInstance) {
      try {
        // 解绑可能存在的临时事件处理器
        this.mapInstance.off('click', this.onMapClick, this);
        this.mapInstance.off('mousemove', this.onMapMouseMove, this);
        
        // 解绑其他可能的临时事件处理器
        this.mapInstance.off('editable:drawing:start');
        this.mapInstance.off('editable:drawing:click');
        this.mapInstance.off('editable:drawing:clicked');
        this.mapInstance.off('editable:drawing:move');
        this.mapInstance.off('editable:drawing:mousedown');
        
        // 移除可能存在的临时标记或辅助图层
        if (this.mapInstance.editTools && this.mapInstance.editTools._currentDrawer) {
          // 移除当前绘制器的临时元素
          const drawer = this.mapInstance.editTools._currentDrawer;
          
          // 移除可能存在的标记点
          if (drawer._marker) {
            try {
              this.mapInstance.removeLayer(drawer._marker);
            } catch (e) {
              // 忽略错误
            }
          }
          
          // 移除可能存在的临时折线/多边形
          if (drawer._poly) {
            try {
              this.mapInstance.removeLayer(drawer._poly);
            } catch (e) {
              // 忽略错误
            }
          }
          
          // 移除可能存在的引导线
          if (drawer._guide) {
            try {
              this.mapInstance.removeLayer(drawer._guide);
            } catch (e) {
              // 忽略错误
            }
          }
          
          // 尝试移除其他可能存在的临时图层
          ['_closest', '_vertex', '_vertexLine'].forEach(prop => {
            if (drawer[prop]) {
              try {
                this.mapInstance.removeLayer(drawer[prop]);
              } catch (e) {
                // 忽略错误
              }
            }
          });
        }
        
        // 如果有featuresLayer，清理它
        if (this.mapInstance.editTools && this.mapInstance.editTools.featuresLayer) {
          try {
            this.mapInstance.editTools.featuresLayer.clearLayers();
          } catch (e) {
            // 忽略错误
          }
        }
        
      } catch (e) {
        logger.warn('移除临时事件处理器时出错:', e);
      }
    }
  }
  
  /**
   * 地图点击事件处理器（仅用于绘制模式）
   * @param e 事件对象
   * @private
   */
  private onMapClick(e: L.LeafletMouseEvent): void {
    // 空实现，仅作为可能被解绑的处理器签名
  }
  
  /**
   * 地图鼠标移动事件处理器（仅用于绘制模式）
   * @param e 事件对象
   * @private
   */
  private onMapMouseMove(e: L.LeafletMouseEvent): void {
    // 空实现，仅作为可能被解绑的处理器签名
  }

  /**
   * 取消绘制
   */
  public cancelDrawing(): void {
    try {
      logger.debug('取消当前绘制');
      
      // 如果有当前编辑器，取消绘制
      if (this._currentEditor && this._currentEditor.cancelDrawing) {
        try {
          this._currentEditor.cancelDrawing();
        } catch (e) {
          logger.warn('取消绘制失败:', e);
        }
      }
      
      // 使用editTools停止绘制
      if (this.mapInstance && this.mapInstance.editTools) {
        this.mapInstance.editTools.stopDrawing();
        
        // 清理状态
        if (this.mapInstance.editTools._currentDrawer) {
          this.mapInstance.editTools._currentDrawer = null;
        }
      }
      
      // 重置状态
      this.drawingMode = null;
      this._currentEditor = null;
      
      // 移除临时处理器
      this.removeTemporaryHandlers();
      
      logger.debug('绘制已取消');
    } catch (error) {
      logger.error('取消绘制失败:', error);
      
      // 确保状态重置
      this.drawingMode = null;
      this._currentEditor = null;
      
      // 强制清理
      if (this.mapInstance && this.mapInstance.editTools) {
        this.mapInstance.editTools.stopDrawing();
        this.mapInstance.editTools._currentDrawer = null;
      }
      
      // 确保移除临时处理器
      this.removeTemporaryHandlers();
    }
  }
  
  /**
   * 兼容旧版API的方法，启用绘制模式
   * @param type 图形类型字符串（例如 'Rectangle', 'Circle', 'Polygon', 'LineString'）
   * @param options 绘制选项
   * @returns 是否成功启用
   */
  public enable(type: string, options?: any): boolean {
    try {
      logger.debug(`enable方法被调用，类型: ${type}`);
      
      // 将字符串类型转换为ShapeType枚举
      let shapeType: ShapeType | null = null;
      
      switch (type) {
        case 'Rectangle':
          shapeType = ShapeType.RECTANGLE;
          break;
        case 'Square':
          // 方形实际上也是矩形
          shapeType = ShapeType.RECTANGLE;
          break;
        case 'Circle':
          shapeType = ShapeType.CIRCLE;
          break;
        case 'Polygon':
          shapeType = ShapeType.POLYGON;
          break;
        case 'LineString':
        case 'Line':
          shapeType = ShapeType.POLYLINE;
          break;
        default:
          logger.warn(`未知的图形类型: ${type}`);
          return false;
      }
      
      // 检查绘制模式是否已激活
      if (this.drawingMode !== null) {
        logger.debug('先停止当前绘制模式');
        this.stopDrawing();
      }
      
      // 准备绘图选项
      const drawOptions = {
        ...this.defaultStyle,
        ...options
      };
      
      // 清理可能存在的状态
      if (this.mapInstance && this.mapInstance.editTools && this.mapInstance.editTools._currentDrawer) {
        try {
          this.mapInstance.editTools.stopDrawing();
          this.mapInstance.editTools._currentDrawer = null;
        } catch (e) {
          logger.warn('清理editTools状态出错:', e);
        }
      }
      
      // 简单延迟启动，确保之前的状态清理完成
      setTimeout(() => {
        // 启动绘制
        this.startDrawing(shapeType!, drawOptions);
      }, 50);
      
      return true;
    } catch (error) {
      logger.error(`启用图形绘制失败: ${error}`);
      
      // 清理状态
      this.drawingMode = null;
      this._currentEditor = null;
      
      // 尝试清理绘制状态
      try {
        if (this.mapInstance && this.mapInstance.editTools) {
          this.mapInstance.editTools.stopDrawing();
          this.mapInstance.editTools._currentDrawer = null;
        }
      } catch (e) {
        // 忽略清理错误
      }
      
      // 确保移除临时处理器
      this.removeTemporaryHandlers();
      
      return false;
    }
  }
  
  /**
   * 增强版的启用绘制模式方法，具有更好的错误处理
   * 在ToolbarObject中替代使用
   * @param type 图形类型字符串
   * @param options 绘制选项
   * @returns 是否成功启用
   */
  public enable2(type: string, options?: any): boolean {
    try {
      logger.debug(`增强版enable2方法被调用，类型: ${type}`);
      
      // 先彻底禁用当前绘制，确保状态干净
      this.disableDrawing();
      
      // 添加短暂延迟，确保前一个状态完全清理
      setTimeout(() => {
        try {
          // 调用标准enable方法
          this.enable(type, options);
          
          logger.debug(`enable2成功激活绘制模式: ${type}`);
        } catch (e) {
          logger.error(`enable2延迟启动绘制失败: ${type}`, e);
        }
      }, 100);
      
      return true;
    } catch (error) {
      logger.error(`enable2激活绘制模式失败: ${type}`, error);
      return false;
    }
  }
  
  /**
   * 禁用绘制模式
   * @returns 是否成功禁用
   */
  public disable(): boolean {
    try {
      logger.debug('禁用绘制模式');
      
      // 使用完整的禁用方法
      this.disableDrawing();
      
      // 确保重置状态
      if (this.mapInstance && this.mapInstance.editTools) {
        try {
          this.mapInstance.editTools.stopDrawing();
          
          // 清理当前绘制器
          if (this.mapInstance.editTools._currentDrawer) {
            this.mapInstance.editTools._currentDrawer = null;
          }
        } catch (e) {
          logger.warn('强制停止绘制失败:', e);
        }
      }
      
      // 再次确保状态被重置
      this.drawingMode = null;
      this._currentEditor = null;
      
      // 移除所有可能的临时处理器
      this.removeTemporaryHandlers();
      
      logger.debug('绘制模式已完全禁用');
      return true;
    } catch (error) {
      logger.error('禁用绘制模式失败:', error);
      
      // 尝试强制清理
      this.drawingMode = null;
      this._currentEditor = null;
      this.removeTemporaryHandlers();
      
      return false;
    }
  }

  /**
   * 是否正在绘制
   * @returns 是否正在绘制
   */
  public isDrawing(): boolean {
    return this.drawingMode !== null;
  }
  
  /**
   * 获取当前绘制类型
   * @returns 当前绘制类型
   */
  public getCurrentDrawingType(): ShapeType | null {
    return this.drawingMode;
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
    logger.debug('启用编辑模式');
  }

  /**
   * 禁用编辑模式
   */
  public disableEditMode(): void {
    // 先停止当前编辑
      this.stopEditing();
    
    // 禁用编辑模式
    this.editMode = false;
    logger.debug('禁用编辑模式');
  }

  /**
   * 开始编辑指定图形
   * @param id 图形ID
   * @returns 是否成功启用编辑
   */
  public startEditing(id: string): boolean {
    try {
    // 停止当前编辑
      this.stopEditing();
      
      const shape = this.shapes.get(id);
      if (!shape || !shape.layer) {
        logger.warn(`图形不存在或图层未创建: ${id}`);
        return false;
      }
      
      const layer = shape.layer as any;
      
      // 检查是否有enableEdit方法
      if (!layer.enableEdit) {
        logger.warn(`图形不支持编辑: ${id}, 类型: ${shape.type}`);
        return false;
      }
      
      // 启用编辑
      layer.enableEdit();
      
      // 设置当前编辑图形
      this.currentEditingShape = id;
      
      logger.debug(`开始编辑图形: ${id}, 类型: ${shape.type}`);
      return true;
    } catch (error) {
      logger.error(`启用图形编辑失败: ${id}`, error);
      return false;
    }
  }

  /**
   * 停止编辑当前图形
   * @returns 是否成功停止编辑
   */
  public stopEditing(): boolean {
    if (!this.currentEditingShape) {
      return false;
    }
    
    try {
    const shape = this.shapes.get(this.currentEditingShape);
      if (!shape || !shape.layer) {
        this.currentEditingShape = null;
        return false;
      }
      
      const layer = shape.layer as any;
      
      // 检查是否有disableEdit方法
      if (layer.disableEdit) {
        layer.disableEdit();
        
        // 更新图形坐标
        this.updateShapeCoordinates(shape, layer);
        
        // 触发更新事件
        this.updateListeners.forEach(listener => {
          listener(this.currentEditingShape!, shape);
        });
        
        logger.debug(`停止编辑图形: ${this.currentEditingShape}`);
      }
      
      this.currentEditingShape = null;
      return true;
      } catch (error) {
      logger.error('停止图形编辑失败', error);
      this.currentEditingShape = null;
      return false;
    }
  }
  
  /**
   * 禁用所有图形的编辑功能
   */
  public disableAllEditing(): void {
    try {
      // 先停止当前编辑
      this.stopEditing();
      
      // 遍历所有图形，禁用编辑
      for (const [id, shape] of this.shapes.entries()) {
        if (shape.layer) {
          const layer = shape.layer as any;
          if (layer.disableEdit) {
            layer.disableEdit();
          }
        }
      }
      
      logger.debug('已禁用所有图形的编辑功能');
    } catch (error) {
      logger.error('禁用所有图形编辑功能失败', error);
    }
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
   * 移除图形
   * @param id 图形ID
   * @returns 是否成功移除
   */
  public removeShape(id: string): boolean {
    const shape = this.shapes.get(id);
    if (!shape) {
      logger.warn(`移除图形失败: 图形 ${id} 不存在`);
      return false;
    }
    
    try {
      // 如果是当前正在编辑的图形，先停止编辑
      if (this.currentEditingShape === id) {
        this.stopEditing();
      }
      
      // 从图层中移除
      if (shape.layer) {
        try {
          // 如果图层有编辑功能，先禁用编辑
          const layer = shape.layer as any;
          if (layer.disableEdit) {
            layer.disableEdit();
          }
          
          // 移除点击事件监听
          if (typeof layer.off === 'function') {
            layer.off('click');
          }
          
          // 从图层组中移除
        this.shapeLayer.removeLayer(shape.layer);
        } catch (layerError) {
          logger.warn(`移除图形图层失败: ${id}`, layerError);
        }
      }
      
      // 从集合中移除
      this.shapes.delete(id);
      
      // 触发删除事件
      this.deleteListeners.forEach(listener => {
        listener(id);
      });
      
      logger.debug(`移除图形成功: ${id}`);
      return true;
    } catch (error) {
      logger.error(`移除图形 ${id} 失败:`, error);
      
      // 尝试从集合中强制移除
      try {
        this.shapes.delete(id);
      } catch (e) {
        // 忽略错误
      }
      
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
   * 清除所有图形
   */
  public clearAll(): void {
    try {
      logger.debug('开始清除所有图形');
      
      // 停止当前绘制和编辑
      if (this.drawingMode) {
        this.stopDrawing();
      }
      
    if (this.currentEditingShape) {
      this.stopEditing();
    }
      
      // 获取清除前的图形数量
      const shapeCount = this.shapes.size;
      
      // 先禁用所有图形的编辑功能
      this.disableAllEditing();
    
    // 清空图层
    this.shapeLayer.clearLayers();
    
    // 清空集合
    this.shapes.clear();
    
      // 重置状态
      this.currentEditingShape = null;
      this.drawingMode = null;
      this._currentEditor = null;
      
      logger.debug(`成功清除了 ${shapeCount} 个图形`);
    } catch (error) {
      logger.error('清除图形时出错:', error);
      
      // 尝试强制清理
      try {
        this.shapeLayer.clearLayers();
        this.shapes.clear();
        this.currentEditingShape = null;
        this.drawingMode = null;
        this._currentEditor = null;
        
        logger.debug('通过强制方式清除图形');
      } catch (clearError) {
        logger.error('强制清除图形时出错:', clearError);
      }
    }
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
   * 销毁对象，清理资源
   */
  public destroy(): void {
    try {
      // 停止当前绘制和编辑
      if (this.drawingMode) {
        this.stopDrawing();
      }
      
    if (this.currentEditingShape) {
      this.stopEditing();
    }
    
      // 解绑事件
      if (this.mapInstance) {
        this.mapInstance.off('editable:editing');
        this.mapInstance.off('editable:vertex:dragend');
        this.mapInstance.off('editable:drawing:end');
        this.mapInstance.off('editable:drawing:commit');
        this.mapInstance.off('editable:drawing:cancel');
        this.mapInstance.off('dblclick');
      }
      
      // 清空图层
      this.shapeLayer.clearLayers();
      
      // 从地图中移除图层
      this.shapeLayer.removeFrom(this.mapInstance);
    
    // 清空集合
    this.shapes.clear();
    
    // 清空事件监听器
    this.clickListeners = [];
    this.createListeners = [];
    this.updateListeners = [];
    this.deleteListeners = [];
    
    logger.debug('ShapeObject已销毁');
    } catch (error) {
      logger.error('销毁ShapeObject时出错:', error);
    }
  }

  /**
   * 禁用特定类型的绘制模式
   * @param type 要禁用的图形类型字符串（例如 'Rectangle', 'Circle', 'Polygon', 'LineString'）
   * @param force 是否强制执行完整禁用，无论类型是否匹配
   * @returns 是否成功禁用
   */
  public disable2(type: string, force: boolean = false): boolean {
    try {
      logger.debug(`禁用特定绘制模式: ${type}, 强制: ${force}`);
      
      // 处理null或undefined参数或强制执行
      if (!type || force) {
        logger.debug(force ? '强制执行完整禁用' : '调用disable2时没有指定类型，执行完整禁用');
        return this.disable();
      }
      
      // 检查当前绘制类型是否匹配
      let currentType: string | null = null;
      
      if (this.drawingMode === ShapeType.RECTANGLE) {
        currentType = 'Rectangle';
      } else if (this.drawingMode === ShapeType.CIRCLE) {
        currentType = 'Circle';
      } else if (this.drawingMode === ShapeType.POLYGON) {
        currentType = 'Polygon';
      } else if (this.drawingMode === ShapeType.POLYLINE) {
        currentType = 'LineString';
      }
      
      // 兼容更多类型名称格式
      const normalizedType = type.toLowerCase();
      const normalizedCurrentType = currentType ? currentType.toLowerCase() : null;
      
      // 处理别名匹配
      const isMatch = 
        normalizedCurrentType === normalizedType || // 完全匹配
        (normalizedType === 'line' && normalizedCurrentType === 'linestring') || // 处理Line等同于LineString
        (normalizedType === 'linestring' && normalizedCurrentType === 'line') || // 同上
        (normalizedType === 'square' && normalizedCurrentType === 'rectangle') || // 处理Square等同于Rectangle
        (normalizedType === 'rectangle' && normalizedCurrentType === 'square'); // 同上
      
      // 如果没有正在进行的绘制或类型不匹配，则检查是否有正在编辑的同类型图形
      if (!this.drawingMode || !isMatch) {
        // 检查是否有正在编辑的图形
        if (this.currentEditingShape && this.shapes.has(this.currentEditingShape)) {
          const editingShape = this.shapes.get(this.currentEditingShape)!;
          let editingType: string | null = null;
          
          // 获取正在编辑图形的类型字符串
          switch(editingShape.type) {
            case ShapeType.RECTANGLE:
              editingType = 'Rectangle';
              break;
            case ShapeType.CIRCLE:
              editingType = 'Circle';
              break;
            case ShapeType.POLYGON:
              editingType = 'Polygon';
              break;
            case ShapeType.POLYLINE:
              editingType = 'LineString';
              break;
          }
          
          // 检查编辑图形是否匹配要禁用的类型
          if (editingType) {
            const normalizedEditingType = editingType.toLowerCase();
            const editingIsMatch = 
              normalizedEditingType === normalizedType || 
              (normalizedType === 'line' && normalizedEditingType === 'linestring') || 
              (normalizedType === 'linestring' && normalizedEditingType === 'line') ||
              (normalizedType === 'square' && normalizedEditingType === 'rectangle') ||
              (normalizedType === 'rectangle' && normalizedEditingType === 'square');
              
            if (editingIsMatch) {
              logger.debug(`发现正在编辑的匹配图形类型: ${editingType}，停止编辑`);
              this.stopEditing();
              return true;
            }
          }
        }
        
        logger.debug(`没有正在进行的${type}绘制或编辑，无需禁用`);
        return true;
      }
      
      logger.debug(`正在禁用${type}绘制`);
      
      // 使用完整的禁用方法
      return this.disable();
    } catch (error) {
      logger.error(`禁用${type}绘制模式失败:`, error);
      
      // 尝试强制清理
      this.drawingMode = null;
      this._currentEditor = null;
      this.removeTemporaryHandlers();
      
      return false;
    }
  }
} 