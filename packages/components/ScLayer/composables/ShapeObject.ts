/**
 * 图形对象
 * @description 用于地图上绘制各种形状，包括矩形、圆形、多边形和线段
 */
import { Map as OlMap } from 'ol';
import { Draw, Snap, Modify, Select } from 'ol/interaction';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style';
import { LineString, Polygon, Circle, Point, GeometryCollection } from 'ol/geom';
import { Feature } from 'ol';
import { unByKey } from 'ol/Observable';
import { EventsKey } from 'ol/events';
import { createBox, createRegularPolygon } from 'ol/interaction/Draw';
import { fromLonLat, transformExtent, toLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';
import { ShapeStyle, Shape, ShapeOption as ImportedShapeOption, ShapePoint, DEFAULT_SHAPE_STYLE } from '../types/shape';
import logger from './LogObject';
import { DataType } from '../types';
// 导入ol-ext
import 'ol-ext/dist/ol-ext.css';
import FlowLine from 'ol-ext/style/FlowLine';
// 添加额外需要的导入
import Collection from 'ol/Collection';
import { singleClick } from 'ol/events/condition';
import { CoordSystem } from '../types/coordinate';
import { GcoordUtils } from '../utils/GcoordUtils';

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

// 扩展导入的ShapeOption接口
export interface ShapeOption extends ImportedShapeOption {
  coordSystem?: CoordSystem; // 添加坐标系统属性
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
  private editInteraction: Modify | null = null;
  private selectInteraction: Select | null = null;
  private editFeatures: Collection<Feature> = new Collection();
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
    this.log('debug', `尝试启用绘图功能，类型: ${type}...`);
    
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法启用绘图功能');
      return;
    }

    // 防止模式冲突：先完全清理所有模式
    this.cleanupAllModes();

    try {
      this.currentType = type;

      // 确保图层已添加到地图
      if (!this.isLayerAdded()) {
        this.mapInstance.addLayer(this.layer as VectorLayer<VectorSource>);
      }

      // 创建绘制交互
      this.addInteraction();

      // 设置状态标志（最后设置）
      this.enabled = true;
      
      // 改变鼠标光标样式，提示用户处于绘图模式
      if (this.mapInstance.getTargetElement()) {
        this.mapInstance.getTargetElement().style.cursor = 'crosshair';
      }
      
      this.log('info', `图形绘制功能已启用，类型: ${type}`);
    } catch (error) {
      this.log('error', `启用绘图功能失败, 类型: ${type}:`, error);
      // 出错时清理
      this.cleanupAllModes();
    }
  }

  /**
   * 清理所有交互模式
   * 在切换到新模式前确保所有现有模式都被禁用
   */
  private cleanupAllModes(): void {
    try {
      // 直接重置状态标志，避免循环调用
      const wasEnabled = this.enabled;
      const wasEditMode = this.editMode;
      const wasDeleteMode = this.deleteMode;
      
      // 记录需要移除的交互，后面再统一移除，减少对地图的操作
      const interactionsToRemove = [];
      
      // 重置所有状态标志（在清理前）
      this.enabled = false;
      this.editMode = false;
      this.deleteMode = false;
      this.currentType = null;
      this.editFeatureId = null;
      
      // 移除所有交互（直接移除而不是调用禁用方法）
      if (this.mapInstance) {
        // 保存对地图实例的引用
        const map = this.mapInstance;
        
        // 准备移除绘制交互
        if (this.draw) {
          try {
            if (this.drawListener) {
              unByKey(this.drawListener);
              this.drawListener = null;
            }
            interactionsToRemove.push(this.draw);
            this.draw = null;
          } catch (e) {
            this.log('warn', '准备移除绘制交互时出错:', e);
          }
        }
        
        // 准备移除选择交互
        if (this.selectInteraction) {
          try {
            this.selectInteraction.getFeatures().clear();
            interactionsToRemove.push(this.selectInteraction);
            this.selectInteraction = null;
          } catch (e) {
            this.log('warn', '准备移除选择交互时出错:', e);
          }
        }
        
        // 准备移除编辑交互
        if (this.editInteraction) {
          try {
            interactionsToRemove.push(this.editInteraction);
            this.editInteraction = null;
          } catch (e) {
            this.log('warn', '准备移除编辑交互时出错:', e);
          }
        }
        
        // 准备移除捕捉交互
        if (this.snap) {
          try {
            interactionsToRemove.push(this.snap);
            this.snap = null;
          } catch (e) {
            this.log('warn', '准备移除捕捉交互时出错:', e);
          }
        }
        
        // 移除删除点击监听
        if (this.clickListener) {
          try {
            unByKey(this.clickListener);
            this.clickListener = null;
          } catch (e) {
            this.log('warn', '清理删除点击监听时出错:', e);
          }
        }
        
        // 清理可能存在的旧删除监听器
        if ((map as any)._deleteClickListener) {
          try {
            map.un('click', (map as any)._deleteClickListener);
            delete (map as any)._deleteClickListener;
          } catch (e) {
            this.log('warn', '清理旧删除监听器时出错:', e);
          }
        }
        
        // 清空编辑的要素集合
        if (this.editFeatures) {
          this.editFeatures.clear();
        }
        
        // 清除所有图形的编辑状态
        this.shapes.forEach((feature, id) => {
          if (feature.get('editMode') === true) {
            feature.set('editMode', false);
          }
        });
        
        // 确保地图光标恢复正常
        if (map.getTargetElement()) {
          map.getTargetElement().style.cursor = '';
        }
        
        // 现在统一移除所有交互，减少对地图的操作次数
        interactionsToRemove.forEach(interaction => {
          try {
            map.removeInteraction(interaction);
          } catch (e) {
            this.log('warn', '移除交互时出错:', e);
          }
        });
        
        // 仅刷新图层，避免触发地图重新创建
        if (this.layer) {
          this.layer.changed();
        }
        
        // 使用轻量级渲染，避免更新地图尺寸
        try {
          map.render();
        } catch (e) {
          this.log('warn', '渲染地图时出错:', e);
        }
      }
      
      // 记录已清理的模式
      const modes = [];
      if (wasEnabled) modes.push('绘制');
      if (wasEditMode) modes.push('编辑');
      if (wasDeleteMode) modes.push('删除');
      
      this.log('debug', `已清理所有交互模式和状态: ${modes.join(', ') || '无活动模式'}`);
    } catch (error) {
      this.log('error', '清理交互模式时出错:', error);
      // 强制重置所有引用类型状态
      this.draw = null;
      this.snap = null;
      this.selectInteraction = null;
      this.editInteraction = null;
      this.drawListener = null;
      this.clickListener = null;
      
      // 强制重置所有标志状态
      this.enabled = false;
      this.editMode = false;
      this.deleteMode = false;
      this.currentType = null;
      this.editFeatureId = null;
      
      // 确保地图光标恢复
      if (this.mapInstance && this.mapInstance.getTargetElement()) {
        this.mapInstance.getTargetElement().style.cursor = '';
      }
      
      // 使用安全恢复，避免销毁地图
      this.safeRecoverMapState();
    }
  }

  /**
   * 禁用绘图功能
   */
  public disable(): void {
    if (!this.mapInstance) {
      return;
    }

    // 使用cleanupAllModes彻底清理所有状态和交互
    this.cleanupAllModes();
    
    // 确保状态重置
    this.currentType = null;
    this.enabled = false;
    
    // 恢复鼠标样式
    if (this.mapInstance.getTargetElement()) {
      this.mapInstance.getTargetElement().style.cursor = '';
    }

    this.log('info', '图形绘制功能已彻底禁用');
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
      case 'Circle':
        // 使用正多边形绘制圆形，sides参数增加到64以获得更接近圆形的效果
        type = 'Circle';
        // 创建一个具有许多边的正多边形来接近圆形
        geometryFunction = createRegularPolygon(64);
        break;
      default:
        break;
    }

    // 创建绘制交互
    this.draw = new Draw({
      source: this.source,
      type: type as any,
      geometryFunction: geometryFunction,
      // 样式设置
      style: (feature) => {
        // 绘制过程中的样式
        const styles = [];
        
        // 基本样式
        styles.push(new Style({
          stroke: new Stroke({
            color: 'rgba(24, 144, 255, 1)',
            width: 2,
            lineDash: [5, 5]
          }),
          fill: new Fill({
            color: 'rgba(24, 144, 255, 0.2)'
          })
        }));
        
        // 如果是圆形或正多边形，显示中心点
        if (this.currentType === 'Circle' || this.currentType === 'Square') {
          const geometry = feature.getGeometry();
          if (geometry) {
            let center;
            // Polygon类型时从坐标中计算中心点
            if (geometry instanceof Polygon) {
              const extent = geometry.getExtent();
              center = getCenter(extent);
            } else if (geometry instanceof Circle) {
              center = geometry.getCenter();
            }
            
            if (center) {
              // 添加中心点样式
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
            }
          }
        }
        
        return styles;
      }
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
    const feature = evt.feature as Feature<any>;
    const geometry = feature.getGeometry();
    
    // 生成唯一ID
    const id = `shape-${Date.now()}-${this.idCounter++}`;
    feature.setId(id);
    feature.set('dataType', DataType.SHAPE);
    
    let dataCoordinates;
    
    // 特殊处理 Circle 类型（现在是以 Polygon 实现的）
    if (this.currentType === 'Circle' && geometry instanceof Polygon) {
      try {
        const extent = geometry.getExtent();
        const center = getCenter(extent);
        
        // 通过计算外接圆半径来获得半径
        const firstPoint = geometry.getCoordinates()[0][0];
        const dx = firstPoint[0] - center[0];
        const dy = firstPoint[1] - center[1];
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        // 设置数据
        dataCoordinates = {
          center: toLonLat(center),
          radius: radius
        };
      } catch (error) {
        this.log('error', '处理圆形几何体时出错:', error);
        // 提供默认值
        dataCoordinates = {
          center: [0, 0],
          radius: 1000
        };
      }
    } else if (geometry) {
      // 常规几何图形处理
      try {
        if (geometry instanceof Circle) {
          const center = toLonLat(geometry.getCenter());
          const radius = geometry.getRadius();
          dataCoordinates = {
            center: center,
            radius: radius
          };
        } else if (geometry instanceof Polygon) {
          if (this.currentType === 'Circle') {
            // 对于以Polygon实现的Circle，重复上面的逻辑
            const extent = geometry.getExtent();
            const center = getCenter(extent);
            
            // 通过计算外接圆半径来获得半径
            const firstPoint = geometry.getCoordinates()[0][0];
            const dx = firstPoint[0] - center[0];
            const dy = firstPoint[1] - center[1];
            const radius = Math.sqrt(dx * dx + dy * dy);
            
            dataCoordinates = {
              center: toLonLat(center),
              radius: radius
            };
          } else {
            // 普通多边形处理
            const coordinates = geometry.getCoordinates();
            dataCoordinates = { coordinates };
          }
        } else {
          // 尝试调用getCoordinates获取坐标
          // @ts-ignore
          dataCoordinates = geometry.getCoordinates ? geometry.getCoordinates() : null;
        }
      } catch (error) {
        this.log('error', '获取几何图形坐标失败:', error);
        dataCoordinates = null;
      }
    }
    
    // 设置数据对象
    feature.set('data', {
      type: this.currentType,
      ...(dataCoordinates || {}),
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
   * @param feature 特征对象
   * @returns 样式对象或数组
   */
  private createFeatureStyle(feature: Feature): Style | Style[] {
    const styles: Style[] = [];
    
    // 检查是否处于编辑模式
    const isEditMode = feature.get('editMode') === true;
    
    // 获取自定义样式或使用默认样式
    const customStyle = feature.get('style');
    const styleToUse = customStyle || this.style;
    
    // 检查是否使用流线效果
    const useFlowLine = feature.get('flowLine') === true;
    const shapeType = feature.get('shapeType') as ShapeType;
    
    // 如果是线段并且启用了流线效果
    if (useFlowLine && shapeType === Shape.LINE && feature.getGeometry() instanceof LineString) {
      // 创建FlowLine样式
      const flowStyle = new FlowLine({
        color: styleToUse.stroke?.color || 'rgba(24, 144, 255, 1)',
        width: styleToUse.stroke?.width || 2,
        arrow: true, // 显示箭头
        animationDuration: 3000, // 动画持续时间（毫秒）
      });
      
      // 应用FlowLine样式
      return flowStyle;
    }
    
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
      
      // 通用的顶点样式创建函数
      const createVertexStyle = (coord: number[]) => new Style({
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
      });
      
      if (geometry instanceof Polygon) {
        // 为多边形添加顶点样式
        const coordinates = geometry.getCoordinates()[0];
        coordinates.forEach(coord => {
          styles.push(createVertexStyle(coord));
        });
        
        // 获取图形类型
        const shapeType = feature.get('shapeType') as ShapeType;
        
        // 如果是Circle类型（但使用Polygon表示），添加中心点
        if (shapeType === 'Circle') {
          const extent = geometry.getExtent();
          const center = getCenter(extent);
          
          // 添加中心点样式
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
          
          // 可以选择添加编辑点，但这通常由Modify交互自动处理
        }
      } else if (geometry instanceof LineString) {
        // 为线段添加顶点样式
        const coordinates = geometry.getCoordinates();
        coordinates.forEach(coord => {
          styles.push(createVertexStyle(coord));
        });
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
      } else if (geometry instanceof Point) {
        // 为点添加样式
        styles.push(new Style({
          image: new CircleStyle({
            radius: 8,
            stroke: new Stroke({
              color: 'rgba(0, 120, 255, 1)',
              width: 2
            }),
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.8)'
            })
          })
        }));
      } else if (geometry instanceof GeometryCollection) {
        // 处理几何集合（通常用于显示编辑控制点）
        const geometries = geometry.getGeometries();
        geometries.forEach(geom => {
          if (geom instanceof Point) {
            styles.push(createVertexStyle(geom.getCoordinates()));
          }
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
   * 使用OpenLayers原生的Modify交互编辑图形
   * @returns 是否成功启用编辑模式
   */
  public enableEditMode(): boolean {
    this.log('debug', '尝试启用编辑模式...');
    
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法启用编辑模式');
      return false;
    }

    // 如果已经在编辑模式，直接返回成功
    if (this.editMode) {
      this.log('info', '已经处于编辑模式');
      return true;
    }

    // 检查地图DOM元素是否存在
    if (!this.mapInstance.getTargetElement()) {
      this.log('warn', '地图DOM元素不存在，无法启用编辑模式');
      return false;
    }

    // 检查地图是否正常渲染
    try {
      const size = this.mapInstance.getSize();
      if (!size || size[0] === 0 || size[1] === 0) {
        this.log('warn', '地图尺寸无效，可能未正确渲染');
        this.mapInstance.updateSize();
      }
    } catch (sizeError) {
      this.log('warn', '检查地图尺寸时出错:', sizeError);
    }

    // 防止模式冲突：先完全清理所有模式
    this.cleanupAllModes();

    // 获取当前图层的数据源
    const source = this.source;
    if (!source) {
      this.log('warn', '图形数据源不存在，无法启用编辑模式');
      return false;
    }

    // 确保图层已添加到地图
    if (!this.isLayerAdded() && this.layer) {
      try {
        this.mapInstance.addLayer(this.layer);
        this.log('debug', '已重新添加图形图层到地图');
      } catch (layerError) {
        this.log('error', '添加图层到地图时出错:', layerError);
        return false;
      }
    }

    try {
      // 创建选择交互
      this.selectInteraction = new Select({
        layers: [this.layer!],
        style: (feature) => {
          // 类型断言，确保feature是Feature类型
          const f = feature as Feature<any>;
          // 标记选中的图形为编辑模式
          f.set('editMode', true);
          return this.createFeatureStyle(f);
        }
      });

      // 使用选择交互的selectedFeatures作为Modify的features
      this.editFeatures = this.selectInteraction.getFeatures();
      
      // 创建修改交互
      this.editInteraction = new Modify({
        features: this.editFeatures,
        // 设置更大的像素容差，便于捕捉顶点
        pixelTolerance: 15
      });

      // 将选择交互添加到地图 - 保存添加结果以便于错误处理
      let addSuccess = true;
      try {
        this.mapInstance.addInteraction(this.selectInteraction);
      } catch (e) {
        this.log('error', '添加选择交互失败:', e);
        addSuccess = false;
      }
      
      // 如果选择交互添加失败，终止整个过程
      if (!addSuccess) {
        this.log('error', '无法启用编辑模式：添加选择交互失败');
        this.selectInteraction = null;
        this.editInteraction = null;
        return false;
      }
      
      // 将修改交互添加到地图
      try {
        this.mapInstance.addInteraction(this.editInteraction);
      } catch (e) {
        this.log('error', '添加修改交互失败:', e);
        // 移除前面添加的选择交互
        try {
          this.mapInstance.removeInteraction(this.selectInteraction);
        } catch (removeError) {
          this.log('warn', '移除选择交互时出错:', removeError);
        }
        this.selectInteraction = null;
        this.editInteraction = null;
        return false;
      }
      
      // 添加捕捉交互，提高编辑精度
      try {
        this.snap = new Snap({
          source: this.source
        });
        this.mapInstance.addInteraction(this.snap);
      } catch (e) {
        this.log('warn', '添加捕捉交互失败:', e);
        // 继续执行，因为捕捉交互不是必须的
      }
      
      // 设置交互事件处理函数
      this.setupEditInteractionEvents();
      
      // 设置状态标志
      this.editMode = true;

      // 改变鼠标光标样式，提示用户处于编辑模式
      if (this.mapInstance.getTargetElement()) {
        this.mapInstance.getTargetElement().style.cursor = 'crosshair';
      }
      
      // 仅更新图层，避免触发地图重建
      if (this.layer) {
        this.layer.changed();
      }

      this.log('info', '图形编辑模式已启用，点击图形进行编辑');
      return true;
    } catch (error) {
      this.log('error', '启用编辑模式失败:', error);
      // 出错时清理可能部分创建的交互
      this.safeCleanupEditMode();
      return false;
    }
  }
  
  /**
   * 安全清理编辑模式
   * 当启用编辑模式失败时，确保所有相关资源都被正确清理
   */
  private safeCleanupEditMode(): void {
    try {
      // 移除交互前保存地图引用
      const map = this.mapInstance;
      if (!map) return;
      
      // 清理选择交互
      if (this.selectInteraction) {
        try {
          // 先清空要素集合
          if (this.selectInteraction.getFeatures()) {
            this.selectInteraction.getFeatures().clear();
          }
          map.removeInteraction(this.selectInteraction);
        } catch (e) {
          this.log('warn', '清理选择交互时出错:', e);
        } finally {
          this.selectInteraction = null;
        }
      }
      
      // 清理编辑交互
      if (this.editInteraction) {
        try {
          map.removeInteraction(this.editInteraction);
        } catch (e) {
          this.log('warn', '清理编辑交互时出错:', e);
        } finally {
          this.editInteraction = null;
        }
      }
      
      // 清理捕捉交互
      if (this.snap) {
        try {
          map.removeInteraction(this.snap);
        } catch (e) {
          this.log('warn', '清理捕捉交互时出错:', e);
        } finally {
          this.snap = null;
        }
      }
      
      // 清空编辑要素集合
      if (this.editFeatures) {
        this.editFeatures.clear();
      }
      
      // 重置编辑状态
      this.editMode = false;
      this.editFeatureId = null;
      
      // 恢复光标
      if (map.getTargetElement()) {
        map.getTargetElement().style.cursor = '';
      }
      
      // 刷新图层
      if (this.layer) {
        this.layer.changed();
      }
      
      this.log('debug', '已安全清理编辑模式资源');
    } catch (error) {
      this.log('error', '安全清理编辑模式时出错:', error);
      // 强制重置所有状态
      this.selectInteraction = null;
      this.editInteraction = null;
      this.snap = null;
      this.editMode = false;
      this.editFeatureId = null;
    }
  }
  
  /**
   * 设置编辑交互的事件处理
   * 单独提取为方法，避免在启用/禁用时出现事件绑定问题
   */
  private setupEditInteractionEvents(): void {
    if (!this.selectInteraction || !this.editInteraction) return;
    
    try {
      // 监听选择变化
      this.selectInteraction.on('select', (e) => {
        try {  // 添加错误处理
          // 当选择变化时，更新编辑的图形
          if (e.selected.length > 0) {
            const feature = e.selected[0];
            this.editFeatureId = feature.get('id') || feature.getId();
            
            // 触发自定义事件 - shape-edit-start
            this.dispatchShapeEvent('shape-edit-start', this.editFeatureId, feature.get('shapeType'), feature);
            this.log('debug', `开始编辑图形: ${this.editFeatureId}`);
          } else if (e.deselected.length > 0) {
            // 当取消选择时，处理编辑完成
            const feature = e.deselected[0];
            const deselectedId = feature.get('id') || feature.getId();
            
            // 移除编辑模式标记
            feature.set('editMode', false);
            
            if (this.editFeatureId === deselectedId) {
              // 更新图形数据
              this.updateFeatureData(feature);
              
              // 获取图形类型
              const shapeType = feature.get('shapeType') as ShapeType;
              
              // 触发更新回调
              if (this.shapeUpdateCallback) {
                this.shapeUpdateCallback(this.editFeatureId, shapeType, feature);
              }
              
              // 触发自定义事件 - shape-update
              this.dispatchShapeEvent('shape-update', this.editFeatureId, shapeType, feature);
              
              this.log('info', `图形编辑完成: ${this.editFeatureId}`);
              this.editFeatureId = null;
              
              // 安全刷新图层而不修改地图
              this.safeRefreshLayer();
            }
          }
        } catch (error) {
          this.log('error', '处理选择事件时出错:', error);
        }
      });

      // 添加修改开始监听
      this.editInteraction.on('modifystart', (e) => {
        try {  // 添加错误处理
          if (e.features.getLength() > 0) {
            const feature = e.features.item(0);
            // 获取当前编辑的图形ID
            const featureId = feature.get('id') || feature.getId();
            
            // 触发正在编辑事件
            this.dispatchShapeEvent('shape-editing', featureId, feature.get('shapeType'), feature);
            this.log('debug', `正在修改图形: ${featureId}`);
          }
        } catch (error) {
          this.log('error', '处理修改开始事件时出错:', error);
        }
      });

      // 添加修改结束监听
      this.editInteraction.on('modifyend', (e) => {
        try {  // 添加错误处理
          if (e.features.getLength() > 0) {
            const feature = e.features.item(0);
            // 获取当前编辑的图形ID
            const featureId = feature.get('id') || feature.getId();
            
            // 更新图形数据
            this.updateFeatureData(feature);
            
            // 获取图形类型
            const shapeType = feature.get('shapeType') as ShapeType;
            
            // 触发自定义事件 - shape-modified
            this.dispatchShapeEvent('shape-modified', featureId, shapeType, feature);
            
            this.log('debug', `图形修改完成: ${featureId}`);
            
            // 安全刷新图层而不修改地图
            this.safeRefreshLayer();
          }
        } catch (error) {
          this.log('error', '处理修改结束事件时出错:', error);
        }
      });
    } catch (error) {
      this.log('error', '设置编辑交互事件处理失败:', error);
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
          } else if (geometry instanceof Polygon) {
            // 对于以Polygon实现的Circle，计算中心点和半径
            try {
              const extent = geometry.getExtent();
              const center = getCenter(extent);
              
              // 通过计算外接圆半径来获得半径
              const firstPoint = geometry.getCoordinates()[0][0];
              const dx = firstPoint[0] - center[0];
              const dy = firstPoint[1] - center[1];
              const radius = Math.sqrt(dx * dx + dy * dy);
              
              data.center = toLonLat(center);
              data.radius = radius;
              this.log('debug', `更新圆形数据: 中心点=${data.center}, 半径=${radius}m`);
            } catch (error) {
              this.log('error', '更新圆形数据时计算中心点和半径失败:', error);
            }
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
   * 完全重写以确保不会触发地图删除
   */
  public disableEditMode(): void {
    if (!this.mapInstance || !this.editMode) {
      return;
    }

    this.log('debug', '开始禁用编辑模式...');

    try {
      // 首先标记状态变更，避免后续操作检查editMode状态
      this.editMode = false;
      const currentEditingId = this.editFeatureId;
      this.editFeatureId = null;

      // 安全处理：恢复所有图形的编辑状态标记
      this.shapes.forEach((feature) => {
        if (feature.get('editMode') === true) {
          feature.set('editMode', false);
        }
      });

      // 重置光标 - 这是安全操作
      try {
        if (this.mapInstance.getTargetElement()) {
          this.mapInstance.getTargetElement().style.cursor = '';
        }
      } catch (error) {
        this.log('warn', '重置光标时出错:', error);
      }

      // 使用安全方法移除交互
      this.safeRemoveEditInteractions();

      // 刷新图层 - 不调用任何地图方法
      if (this.layer) {
        try {
          this.layer.changed();
        } catch (error) {
          this.log('warn', '刷新图层时出错:', error);
        }
      }

      this.log('info', '图形编辑模式已禁用');
    } catch (error) {
      this.log('error', '禁用编辑模式时出错:', error);
      
      // 最后的安全保障：强制重置所有状态变量
      this.editMode = false;
      this.editFeatureId = null;
      this.selectInteraction = null;
      this.editInteraction = null;
      this.snap = null;
      
      if (this.editFeatures) {
        try {
          this.editFeatures.clear();
        } catch (e) {
          // 忽略错误
        }
      }
    }
  }

  /**
   * 安全移除编辑交互
   * 将移除交互的逻辑分离，确保每个步骤都有错误处理
   */
  private safeRemoveEditInteractions(): void {
    if (!this.mapInstance) return;

    // 1. 首先安全清空选择交互的要素
    if (this.selectInteraction) {
      try {
        const features = this.selectInteraction.getFeatures();
        if (features) {
          features.clear();
        }
      } catch (e) {
        this.log('warn', '清空选择要素时出错:', e);
      }
    }

    // 2. 然后批量准备要移除的交互
    const interactionsToRemove = [];
    
    if (this.selectInteraction) {
      interactionsToRemove.push(this.selectInteraction);
      // 立即设置为null以防止多次移除
      const temp = this.selectInteraction;
      this.selectInteraction = null;
    }
    
    if (this.editInteraction) {
      interactionsToRemove.push(this.editInteraction);
      const temp = this.editInteraction;
      this.editInteraction = null;
    }
    
    if (this.snap) {
      interactionsToRemove.push(this.snap);
      const temp = this.snap;
      this.snap = null;
    }

    // 3. 一次性移除所有交互
    if (interactionsToRemove.length > 0) {
      try {
        // 在一个try块中移除所有交互，避免多次操作地图
        interactionsToRemove.forEach(interaction => {
          try {
            this.mapInstance?.removeInteraction(interaction);
          } catch (e) {
            // 单个交互移除失败，仅记录但继续
            this.log('warn', '移除单个交互时出错:', e);
          }
        });
      } catch (error) {
        this.log('error', '批量移除交互时出错:', error);
        // 不再尝试进一步操作地图
      }
    }

    // 4. 最后清空编辑要素集合
    if (this.editFeatures) {
      try {
        this.editFeatures.clear();
      } catch (e) {
        this.log('warn', '清空编辑要素集合时出错:', e);
      }
    }
  }

  /**
   * 安全刷新图层
   * 用于在编辑完成后确保图层可见但不触发地图重建
   */
  public safeRefreshLayer(): void {
    if (!this.layer) return;
    
    try {
      // 不检查地图状态，只操作图层
      
      // 确保图层可见
      if (!this.layer.getVisible()) {
        this.layer.setVisible(true);
      }
      
      // 只刷新图层，不触发地图操作
      this.layer.changed();
      
      // 不再调用地图的render方法，避免任何地图操作
      
      this.log('debug', '安全刷新图层完成');
    } catch (error) {
      this.log('warn', '安全刷新图层时出错:', error);
    }
  }

  /**
   * 安全恢复地图状态
   * 修改为绝对最小操作，避免任何可能导致地图销毁的操作
   */
  private safeRecoverMapState(): void {
    this.log('warn', '执行极简安全地图恢复...');
    
    try {
      // 重置所有状态变量
      this.enabled = false;
      this.editMode = false;
      this.deleteMode = false;
      this.currentType = null;
      this.editFeatureId = null;
      
      // 重置所有交互引用
      this.selectInteraction = null;
      this.editInteraction = null;
      this.snap = null;
      this.draw = null;
      
      // 尝试恢复光标
      if (this.mapInstance && this.mapInstance.getTargetElement()) {
        this.mapInstance.getTargetElement().style.cursor = '';
      }
      
      // 仅操作图层，不调用地图方法
      if (this.layer) {
        this.layer.changed();
      }
      
      this.log('info', '状态已安全重置');
    } catch (error) {
      this.log('error', '安全恢复状态时出错:', error);
      // 不再进行任何操作
    }
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
            this.log('error', '添加点形状失败: 缺少坐标');
            return '';
          }
          feature = new Feature({
            geometry: new Point(GcoordUtils.convertToOlCoordinate(options.coordinates as [number, number], options.coordSystem))
          });
          break;

        case Shape.LINE:
          if (!options.coordinates || !Array.isArray(options.coordinates)) {
            this.log('error', '添加线形状失败: 缺少坐标');
            return '';
          }
          feature = new Feature({
            geometry: new LineString(GcoordUtils.convertToOlCoordinates(options.coordinates as Array<[number, number]>, options.coordSystem))
          });
          break;

        case Shape.POLYGON:
          if (!options.coordinates || !Array.isArray(options.coordinates)) {
            this.log('error', '添加多边形形状失败: 缺少坐标');
            return '';
          }
          
          let coords: number[][];
          if (options.coordinates.length > 0 && !Array.isArray(options.coordinates[0])) {
            this.log('error', '添加多边形形状失败: 坐标格式错误');
            return '';
          } else {
            coords = GcoordUtils.convertToOlCoordinates(options.coordinates as Array<[number, number]>, options.coordSystem);
          }
          
          // 确保多边形闭合
          if (coords.length > 0 && 
              (coords[0][0] !== coords[coords.length - 1][0] || 
               coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push([...coords[0]]);
          }
          
          feature = new Feature({
            geometry: new Polygon([coords])
          });
          break;

        case Shape.CIRCLE:
          if (!options.center || !options.radius) {
            this.log('error', '添加圆形状失败: 缺少中心点或半径');
            return '';
          }
          feature = new Feature({
            geometry: new Circle(GcoordUtils.convertToOlCoordinate(options.center as [number, number], options.coordSystem), options.radius)
          });
          break;

        case Shape.RECTANGLE:
          let rectangle: number[][];
          if (options.center && options.width && options.height) {
            const center = GcoordUtils.convertToOlCoordinate(options.center as [number, number], options.coordSystem);
            const halfWidth = options.width / 2;
            const halfHeight = options.height / 2;
            
            rectangle = [
              [center[0] - halfWidth, center[1] - halfHeight],
              [center[0] + halfWidth, center[1] - halfHeight],
              [center[0] + halfWidth, center[1] + halfHeight],
              [center[0] - halfWidth, center[1] + halfHeight],
              [center[0] - halfWidth, center[1] - halfHeight] // 闭合多边形
            ];
          } else if (options.coordinates && Array.isArray(options.coordinates) && options.coordinates.length >= 2) {
            const coords = options.coordinates as [number, number][];
            rectangle = [
              GcoordUtils.convertToOlCoordinate(coords[0], options.coordSystem),
              GcoordUtils.convertToOlCoordinate([coords[1][0], coords[0][1]] as [number, number], options.coordSystem),
              GcoordUtils.convertToOlCoordinate(coords[1], options.coordSystem),
              GcoordUtils.convertToOlCoordinate([coords[0][0], coords[1][1]] as [number, number], options.coordSystem),
              GcoordUtils.convertToOlCoordinate(coords[0], options.coordSystem)  // 闭合多边形
            ];
          } else {
            this.log('error', '添加矩形形状失败: 参数无效');
            return '';
          }
          
          feature = new Feature({
            geometry: new Polygon([rectangle])
          });
          break;

        case Shape.SQUARE:
          if (!options.center || !options.width) {
            this.log('error', '添加正方形形状失败: 缺少中心点或宽度');
            return '';
          }
          
          const center = GcoordUtils.convertToOlCoordinate(options.center as [number, number], options.coordSystem);
          const halfSize = (options.width as number) / 2;
          
          const square = [
            [center[0] - halfSize, center[1] - halfSize],
            [center[0] + halfSize, center[1] - halfSize],
            [center[0] + halfSize, center[1] + halfSize],
            [center[0] - halfSize, center[1] + halfSize],
            [center[0] - halfSize, center[1] - halfSize] // 闭合多边形
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
      
      // 设置flowLine属性
      if (options.flowLine) {
        feature.set('flowLine', true);
      }
      
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
    this.log('debug', '尝试启用删除模式...');
    
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法启用删除模式');
      return;
    }

    // 防止模式冲突：先完全清理所有模式
    this.cleanupAllModes();

    try {
      // 添加点击监听
      this.clickListener = this.mapInstance!.on('click', (event) => {
        try {
          if (!this.deleteMode) return;

          // 获取点击位置的图形
          const feature = this.mapInstance!.forEachFeatureAtPixel(event.pixel, (feature) => feature);
          
          if (feature) {
            // 检查是否是我们的图形
            const shapeId = feature.get('id') || feature.getId();
            if (shapeId && this.shapes.has(shapeId)) {
              // 删除图形
              this.removeShape(shapeId);
              this.log('info', `删除模式: 已删除图形 ID=${shapeId}`);
            }
          }
        } catch (err) {
          this.log('error', '删除图形时出错:', err);
        }
      });

      // 设置状态标志（最后设置）
      this.deleteMode = true;
      
      // 改变鼠标光标样式，提示用户处于删除模式
      if (this.mapInstance.getTargetElement()) {
        this.mapInstance.getTargetElement().style.cursor = 'no-drop';
      }
      
      this.log('info', '删除模式已启用');
    } catch (error) {
      this.log('error', '启用删除模式失败:', error);
      // 出错时清理
      this.cleanupAllModes();
    }
  }

  /**
   * 禁用删除模式
   */
  public disableDeleteMode(): void {
    if (!this.deleteMode) {
      return;
    }

    try {
      this.log('debug', '开始禁用删除模式...');
      
      // 恢复鼠标光标样式
      if (this.mapInstance && this.mapInstance.getTargetElement()) {
        this.mapInstance.getTargetElement().style.cursor = '';
      }
      
      // 移除点击监听
      if (this.clickListener) {
        unByKey(this.clickListener);
        this.clickListener = null;
      }
      
      // 清理可能存在的旧监听器（兼容早期版本）
      if (this.mapInstance && (this.mapInstance as any)._deleteClickListener) {
        try {
          this.mapInstance.un('click', (this.mapInstance as any)._deleteClickListener);
          delete (this.mapInstance as any)._deleteClickListener;
        } catch (e) {
          // 忽略清理旧监听器可能产生的错误
        }
      }

      // 最后更改状态标志
      this.deleteMode = false;
      this.log('info', '删除模式已禁用');
    } catch (error) {
      this.log('error', '禁用删除模式时出错:', error);
      // 确保状态重置
      this.deleteMode = false;
      this.clickListener = null;
    }
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