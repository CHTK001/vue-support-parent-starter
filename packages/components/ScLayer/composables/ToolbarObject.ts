/**
 * 工具栏对象
 * @description 处理地图工具栏的显示和交互
 */
import type { ToolbarConfig, ToolItem, ToolbarPosition, ToolbarDirection } from '../types/toolbar';
import { DEFAULT_TOOLBAR_CONFIG } from '../types/toolbar';
import { Map as OlMap } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import type { MapObject } from './MapObject';
import logger from './LogObject';
import { CoordinateObject, CoordinateInfo, CoordinateOptions, CoordinatePosition } from './CoordinateObject';
import { MeasureObject, MeasureType } from './MeasureObject';
import { OverviewMapObject, OverviewMapOptions } from './OverviewMapObject';
import { MarkerObject } from './MarkerObject';
import { ShapeObject, ShapeType } from './ShapeObject';
import { TrackObject } from './TrackObject';
import { AggregationOptions } from '../types/cluster';
import { DataType } from '../types';
import { LineString, Polygon, Circle } from 'ol/geom';
import { ShapeOption, Shape } from '../types/shape';
import { GridManager, GridType } from './GridManager';
// 引入热力图对象
import { HeatmapObject } from './HeatmapObject';
// 引入飞线图对象
import { FlightLineObject } from './FlightLineObject';
// 引入风场图对象
import { WindObject } from './WindObject';
// 引入区划边界对象
import { BoundaryObject } from './BoundaryObject';
import { BoundaryOptions } from '../types/boundary';

// 定义按钮状态回调接口
export interface ToolStateChangeCallback {
  (toolId: string, active: boolean, toolType: string, data?: any): void;
}

export class ToolbarObject {
  private config: ToolbarConfig;
  private mapObj: MapObject;
  private tools: ToolItem[] = [];
  private activeToolId: string | null = null;
  
  // 坐标对象
  private coordinateObj: CoordinateObject | null = null;
  // 测距对象
  private measureObj: MeasureObject | null = null;
  // 鹰眼对象
  private overviewMapObj: OverviewMapObject | null = null;
  // 标记点对象
  private markerObj: MarkerObject | null = null;
  // 图形绘制对象
  private shapeObj: ShapeObject | null = null;
  // 轨迹对象
  private trackObj: TrackObject | null = null;
  // 坐标面板是否显示
  private showCoordinatePanel: boolean = false;
  // 坐标信息回调
  private coordinateCallback: ((coordinate: CoordinateInfo) => void) | null = null;
  // 按钮状态变化回调
  private toolStateChangeCallback: ToolStateChangeCallback | null = null;
  // 聚合配置
  private clusterConfig: AggregationOptions = {
    maxClusterRadius: 40,    // 聚合半径（像素）
    radiusUnit: 'pixel',     // 半径单位
    color: '#1677ff',        // 聚合点颜色
    borderColor: '#fff',     // 边框颜色
    showCount: true,         // 显示数量
    zoomToBoundsOnClick: true, // 点击时缩放到范围
    useWeightAsSize: true,   // 根据数量显示大小
    // 脉冲/涟漪动画效果
    enablePulse: true,       // 启用脉冲效果
    pulseDuration: 1500,     // 动画持续时间(ms) 
    pulseOpacity: 0.6,       // 脉冲透明度
    pulseFrequency: 1,       // 每秒脉冲次数
    colorRanges: [           // 颜色范围
      { value: 10, color: '#5470c6' },  // 聚合点数量≥10时使用蓝色
      { value: 50, color: '#91cc75' },  // 聚合点数量≥50时使用绿色
      { value: 100, color: '#fac858' }, // 聚合点数量≥100时使用黄色
      { value: 200, color: '#ee6666' }  // 聚合点数量≥200时使用红色
    ]
  };

  // 网格对象
  private gridObj: GridManager | null = null;
  
  // 热力图对象
  private heatmapObj: HeatmapObject | null = null;

  // 飞线图对象
  private flightLineObj: FlightLineObject | null = null;
  
  // 风场图对象
  private windObj: WindObject | null = null;

  // 区划边界对象
  private boundaryObj: BoundaryObject | null = null;

  private boundaryLoaded: boolean = false; // 标记区划是否已加载

  /**
   * 构造函数
   * @param config 工具栏配置
   * @param mapObj 地图对象
   */
  constructor(config: ToolbarConfig | undefined, mapObj: MapObject) {
    this.config = config || DEFAULT_TOOLBAR_CONFIG;
    this.mapObj = mapObj;
    this.tools = [...(this.config.items || [])];
    
    // 将toolbarObj对象保存到地图元素中，使其可以被其他组件访问
    const mapInstance = this.mapObj.getMapInstance();
    if (mapInstance) {
      const targetElement = mapInstance.getTargetElement();
      if (targetElement) {
        targetElement['toolbarObj'] = this;
        logger.debug('toolbarObj对象已保存到地图元素中');
      }
    }
    
    // 设置默认的坐标回调函数，避免每次激活时判断
    this.coordinateCallback = (coordinate) => {
      logger.debug('坐标更新:', 
        `经度=${coordinate.longitude.toFixed(6)}, ` +
        `纬度=${coordinate.latitude.toFixed(6)}`
      );
    };
    
    // 初始化坐标对象
    this.initCoordinateObject();
    
    // 初始化测距对象
    this.initMeasureObject();
    
    // 初始化鹰眼对象
    this.initOverviewMapObject();

    // 初始化标记点对象
    this.initMarkerObject();
    
    // 初始化图形绘制对象
    this.initShapeObject();
    
    // 初始化轨迹对象
    this.initTrackObject();
    
    // 初始化网格对象
    this.initGridObject();
    
    // 初始化热力图对象
    this.initHeatmapObject();
    
    // 初始化飞线图对象
    this.initFlightLineObject();
    
    // 初始化风场图对象
    this.initWindObject();
    
    // 初始化区划边界对象
    this.initBoundaryObject();
    
    logger.debug('工具栏初始化完成，工具数量:', this.tools.length);
  }
  
  /**
   * 初始化坐标对象
   */
  private initCoordinateObject(): void {
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例不存在，无法初始化坐标对象');
      return;
    }
    
    // 创建坐标对象
    this.coordinateObj = new CoordinateObject(mapInstance);
    
    // 设置默认的坐标选项
    if (this.config.coordinateConfig) {
      const options: CoordinateOptions = {
        decimals: this.config.coordinateConfig.decimals,
        position: this.config.coordinateConfig.position as CoordinatePosition,
        showProjected: this.config.coordinateConfig.showProjected
      };
      this.coordinateObj.setOptions(options);
    }
    
    logger.debug('坐标对象初始化成功');
  }
  
  /**
   * 初始化测距对象
   */
  private initMeasureObject(): void {
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例不存在，无法初始化测距对象');
      return;
    }
    
    // 创建测距对象
    this.measureObj = new MeasureObject(mapInstance);
    
    logger.debug('测距对象初始化成功');
  }

  /**
   * 初始化鹰眼对象
   */
  private initOverviewMapObject(): void {
    // 不再创建内置鹰眼地图对象，使用自定义OverviewMap组件替代
    // 仅保留空实现，确保API兼容性
    logger.debug('[Overview] 跳过内置鹰眼对象初始化，使用自定义OverviewMap组件');
    
    // 创建一个空对象，先转为unknown然后转为OverviewMapObject类型
    this.overviewMapObj = {
      enable: () => {
        logger.debug('[Overview] 使用自定义OverviewMap组件，内置鹰眼被禁用');
        return false;
      },
      disable: () => {
        logger.debug('[Overview] 使用自定义OverviewMap组件，内置鹰眼被禁用');
        return false;
      },
      toggle: () => {
        logger.debug('[Overview] 使用自定义OverviewMap组件，内置鹰眼被禁用');
        return false;
      },
      setCollapsed: () => {
        logger.debug('[Overview] 使用自定义OverviewMap组件，内置鹰眼被禁用');
        return false;
      },
      isCollapsed: () => false,
      setMapInstance: () => {
        logger.debug('[Overview] 使用自定义OverviewMap组件，内置鹰眼被禁用');
        return false;
      },
      destroy: () => {
        logger.debug('[Overview] 销毁空的内置鹰眼对象');
        return true;
      },
      // 添加必要的属性以符合OverviewMapObject接口
      mapInstance: null,
      overviewMapControl: null,
      options: {},
      enabled: false
    } as unknown as OverviewMapObject;
  }

  /**
   * 初始化标记点对象
   */
  private initMarkerObject(): void {
    // 获取地图实例
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例未创建，无法初始化标记点对象');
      return;
    }
    
    // 创建标记点对象
    this.markerObj = new MarkerObject(mapInstance);
    logger.debug('标记点对象已初始化');
  }

  /**
   * 初始化图形绘制对象
   */
  private initShapeObject(): void {
    // 获取地图实例
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例未创建，无法初始化图形绘制对象');
      return;
    }
    
    // 创建图形绘制对象
    this.shapeObj = new ShapeObject(mapInstance);
    
    // 设置绘制完成回调函数，在绘制完成后自动调用addShape方法
    this.shapeObj.setDrawEndCallback((id, shapeType, feature) => {
      // 获取特征的几何体
      const geometry = feature.getGeometry();
      if (!geometry) return;
      
      // 根据不同形状类型处理几何数据
      let shapeOption: ShapeOption | null = null;
      
      switch (shapeType) {
        case 'Point':
          // 处理Point类型，需要类型转换
          // 由于Geometry基类没有getCoordinates方法，需要先断言为Point类型
          const pointGeom = geometry as any; // 先使用any类型绕过类型检查
          const point = pointGeom.getCoordinates ? pointGeom.getCoordinates() : [0, 0];
          // 转换为经纬度坐标
          const lonlat = toLonLat(point);
          shapeOption = {
            type: Shape.POINT,
            coordinates: lonlat,
            dataType: DataType.SHAPE,
            id
          };
          break;
          
        case 'LineString':
          const line = (geometry as LineString).getCoordinates();
          // 转换所有点为经纬度坐标
          const lineCoords = line.map(coord => toLonLat(coord));
          shapeOption = {
            type: Shape.LINE,
            coordinates: lineCoords,
            dataType: DataType.SHAPE,
            id
          };
          break;
          
        case 'Polygon':
          const polygon = (geometry as Polygon).getCoordinates()[0];
          // 转换所有点为经纬度坐标
          const polygonCoords = polygon.map(coord => toLonLat(coord));
          shapeOption = {
            type: Shape.POLYGON,
            coordinates: polygonCoords,
            dataType: DataType.SHAPE,
            id
          };
          break;
          
        case 'Circle':
          // 修改这部分代码处理圆形
          // 检查几何图形类型，因为现在圆形可能是用Polygon表示的
          if (geometry instanceof Circle) {
            // 原始Circle类型情况处理
            const center = geometry.getCenter();
            const radius = geometry.getRadius();
            // 转换中心点为经纬度坐标
            const centerLonLat = toLonLat(center);
            shapeOption = {
              type: Shape.CIRCLE,
              center: centerLonLat,
              radius: radius,
              dataType: DataType.SHAPE,
              id
            };
          } else if (geometry instanceof Polygon) {
            // 使用Polygon表示的Circle类型情况处理
            // 计算多边形的外接圆
            const extent = geometry.getExtent();
            // 计算中心点
            const centerX = (extent[0] + extent[2]) / 2;
            const centerY = (extent[1] + extent[3]) / 2;
            const center = [centerX, centerY];
            
            // 计算半径 - 使用第一个点到中心点的距离
            const firstPoint = geometry.getCoordinates()[0][0];
            const dx = firstPoint[0] - centerX;
            const dy = firstPoint[1] - centerY;
            const radius = Math.sqrt(dx * dx + dy * dy);
            
            // 转换中心点为经纬度坐标
            const centerLonLat = toLonLat(center);
            
            shapeOption = {
              type: Shape.CIRCLE,
              center: centerLonLat,
              radius: radius,
              dataType: DataType.SHAPE,
              id
            };
          } else {
            // 处理其他未预期的几何图形类型情况
            logger.warn(`绘制圆形时遇到未预期的几何图形类型: ${geometry.getType ? geometry.getType() : 'unknown'}`);
            return; // 不处理不支持的几何图形类型
          }
          break;
          
        case 'Rectangle':
        case 'Square':
          const extent = (geometry as Polygon).getExtent();
          // 转换为左下角和右上角坐标
          const minCoord = toLonLat([extent[0], extent[1]]);
          const maxCoord = toLonLat([extent[2], extent[3]]);
          if (shapeType === 'Rectangle') {
            shapeOption = {
              type: Shape.RECTANGLE,
              coordinates: [minCoord, maxCoord],
              dataType: DataType.SHAPE,
              id
            };
          } else {
            // 为正方形计算中心点和宽度
            const centerX = (extent[0] + extent[2]) / 2;
            const centerY = (extent[1] + extent[3]) / 2;
            const width = Math.abs(extent[2] - extent[0]);
            const squareCenter = toLonLat([centerX, centerY]);
            shapeOption = {
              type: Shape.SQUARE,
              center: squareCenter,
              width: width,
              dataType: DataType.SHAPE,
              id
            };
          }
          break;
      }
      
      // 如果成功创建了ShapeOption，通知状态变化
      if (shapeOption && this.toolStateChangeCallback) {
        logger.debug(`图形绘制完成，自动调用addShape，类型: ${shapeType}, ID: ${id}`);
        // 通知状态变化，用于ScLayer组件监听并调用emit('shape-create')
        this.toolStateChangeCallback('shape-created', true, 'shape', {
          id,
          options: shapeOption
        });
      }
    });
    
    logger.debug('图形绘制对象已初始化');
  }

  /**
   * 初始化轨迹对象
   */
  private initTrackObject(): void {
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例不存在，无法初始化轨迹对象');
      return;
    }
    
    // 创建轨迹对象
    this.trackObj = new TrackObject(mapInstance);
    
    logger.debug('轨迹对象初始化成功');
  }

  /**
   * 初始化网格对象
   */
  private initGridObject(): void {
    // 获取地图实例
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例未创建，无法初始化网格对象');
      return;
    }
    
    // 创建网格对象
    this.gridObj = new GridManager(mapInstance);
    logger.debug('网格对象已初始化');
  }

  /**
   * 初始化热力图对象
   */
  private initHeatmapObject(): void {
    // 获取地图实例
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例未创建，无法初始化热力图对象');
      return;
    }
    
    // 创建热力图对象
    this.heatmapObj = new HeatmapObject(mapInstance);
    logger.debug('热力图对象已初始化');
  }

  /**
   * 初始化飞线图对象
   */
  private initFlightLineObject(): void {
    // 获取地图实例
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例未创建，无法初始化飞线图对象');
      return;
    }
    
    // 创建飞线图对象
    this.flightLineObj = new FlightLineObject(mapInstance);
    logger.debug('飞线图对象已初始化');
  }

  /**
   * 初始化风场图对象
   */
  private initWindObject(): void {
    // 获取地图实例
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例未创建，无法初始化风场图对象');
      return;
    }
    
    // 创建风场图对象
    this.windObj = new WindObject(mapInstance);
    logger.debug('风场图对象已初始化');
  }

  /**
   * 初始化区划边界对象
   */
  private initBoundaryObject(): void {
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例不存在，无法初始化区划边界对象');
      return;
    }
    
    // 创建区划边界对象
    this.boundaryObj = new BoundaryObject(mapInstance);
    
    logger.debug('区划边界对象初始化成功');
  }

  /**
   * 获取工具栏配置
   * @returns 工具栏配置
   */
  getConfig(): ToolbarConfig {
    return this.config;
  }

  /**
   * 设置工具栏配置
   * @param config 新的工具栏配置或部分配置
   */
  setConfig(config: Partial<ToolbarConfig>): void {
    // 合并配置
    this.config = {
      ...this.config,
      ...config
    };
    
    // 触发配置更新事件
    this.triggerToolStateChange('toolbar-config-update', true, 'config', {
      config: this.config
    });
    
    logger.debug('工具栏配置已更新', config);
  }

  /**
   * 获取所有工具
   * @returns 所有工具
   */
  getTools(): ToolItem[] {
    return this.tools;
  }

  /**
   * 获取可见的工具
   * @returns 可见的工具
   */
  getVisibleTools(): ToolItem[] {
    return this.tools.filter(tool => tool.show !== false);
  }

  /**
   * 获取当前激活的工具ID
   * @returns 当前激活的工具ID
   */
  getActiveToolId(): string | null {
    return this.activeToolId;
  }

  /**
   * 添加工具
   * @param tool 工具项
   * @param position 添加位置
   */
  addTool(tool: ToolItem, position: 'start' | 'end' = 'end'): void {
    const existingIndex = this.tools.findIndex(t => t.id === tool.id);
    
    if (existingIndex !== -1) {
      // 如果工具已存在，更新工具
      this.tools[existingIndex] = { ...tool };
    } else {
      // 如果工具不存在，添加新工具
      if (position === 'start') {
        this.tools.unshift(tool);
      } else {
        this.tools.push(tool);
      }
    }
  }

  /**
   * 移除工具
   * @param toolId 工具ID
   */
  removeTool(toolId: string): void {
    const index = this.tools.findIndex(tool => tool.id === toolId);
    
    if (index !== -1) {
      this.tools.splice(index, 1);
      
      // 如果移除的是当前激活的工具，清除激活状态
      if (this.activeToolId === toolId) {
        this.activeToolId = null;
      }
    }
  }

  /**
   * 隐藏工具
   * @param toolId 工具ID
   */
  hideTool(toolId: string): void {
    const tool = this.tools.find(tool => tool.id === toolId);
    
    if (tool) {
      tool.show = false;
      
      // 如果隐藏的是当前激活的工具，清除激活状态
      if (this.activeToolId === toolId) {
        this.activeToolId = null;
      }
    }
  }

  /**
   * 显示工具
   * @param toolId 工具ID
   */
  showTool(toolId: string): void {
    const tool = this.tools.find(tool => tool.id === toolId);
    
    if (tool) {
      tool.show = true;
    }
  }

  /**
   * 处理工具点击
   * @param toolId 工具ID
   */
  handleToolClick(toolId: string): void {
    const tool = this.tools.find(tool => tool.id === toolId);
    
    if (!tool || tool.disabled) {
      return;
    }
    
    logger.debug(`处理工具点击: ${toolId}, 当前状态: ${tool.active ? '激活' : '未激活'}`);
    
    // 坐标工具的特殊处理
    if (toolId === 'coordinate') {
      // 坐标工具特殊处理 - 直接控制坐标面板的显示/隐藏
      const currentActive = !!tool.active;
      
      if (currentActive) {
        // 如果当前已激活，则停用
        this.deactivateTool(toolId);
        logger.debug('坐标工具停用，面板将隐藏');
      } else {
        // 如果当前未激活，则激活
        this.activateTool(toolId);
        
        // 确保坐标面板状态同步
        if (!this.showCoordinatePanel) {
          logger.debug('手动设置坐标面板显示状态');
          this.showCoordinatePanel = true;
          
          // 触发特殊状态变化回调
          if (this.toolStateChangeCallback) {
            this.toolStateChangeCallback('coordinate-panel-visible', true, 'panel', {
              source: 'coordinate-click',
              forced: true
            });
          }
        }
        
        logger.debug('坐标工具激活，面板将显示');
      }
      
      return;
    }

    // 鹰眼工具的特殊处理
    if (toolId === 'overview') {
      // 直接切换鹰眼工具状态
      const currentActive = !!tool.active;
      
      if (currentActive) {
        // 如果当前已激活，则停用
        this.deactivateTool(toolId);
        logger.debug('鹰眼工具停用');
      } else {
        // 如果当前未激活，则激活
        this.activateTool(toolId);
        logger.debug('鹰眼工具激活');
        
        // 手动触发鹰眼状态变化通知
        if (this.toolStateChangeCallback) {
          this.toolStateChangeCallback('overview-map', true, 'control', {
            source: 'overview-click',
            forced: true
          });
        }
      }
      
      return;
    }
    
    // 图层切换按钮的特殊处理
    if (toolId === 'layer-switch') {
      // 直接切换图层工具状态
      const currentActive = !!tool.active;
      
      if (currentActive) {
        // 如果当前已激活，则停用
        this.deactivateTool(toolId);
        logger.debug('图层切换工具停用');
      } else {
        // 如果当前未激活，则激活
        this.activateTool(toolId);
        logger.debug('图层切换工具激活');
        
        // 手动触发图层面板显示事件
        if (this.toolStateChangeCallback) {
          this.toolStateChangeCallback('layer-panel-visible', true, 'panel', {
            source: 'layer-switch-click',
            forced: true
          });
        }
      }
      
      return;
    }
    
    // 区划边界工具的特殊处理 - 移到这里集中处理
    if (toolId === 'boundary') {
      // 切换激活状态
      const currentActive = !!tool.active;
      
      if (currentActive) {
        // 如果当前已激活，则停用
        this.deactivateTool(toolId);
        this.handleBoundaryDeactivate();
        logger.debug('区划边界工具停用');
      } else {
        // 如果当前未激活，则激活
        this.activateTool(toolId);
        this.handleBoundaryActivate();
        logger.debug('区划边界工具激活');
      }
      return;
    }
    
    // 针对不同类型工具进行处理
    if (tool.type === 'button') {
      // 对于按钮类型，如果有子菜单，则像菜单一样处理
      if (tool.children && tool.children.length > 0) {
        // 切换激活状态 - 子菜单将由UI层处理
        const newActive = !tool.active;
        tool.active = newActive;
        
        // 触发工具状态变化回调 
        this.triggerToolStateChange(toolId, newActive, tool.type, {
          multi: tool.multi,
          hasChildren: true
        });
        
        if (newActive) {
          // 保存当前激活工具
          this.activeToolId = toolId;
          // 如果激活则执行工具功能
          this.handleToolActivation(tool);
        } else {
          // 如果停用则执行停用逻辑
          this.handleToolDeactivation(tool);
          // 如果停用的是当前激活的工具，清除激活状态
          if (this.activeToolId === toolId) {
            this.activeToolId = null;
          }
        }
      } else {
        // 普通按钮类型工具，执行后自动停用
        logger.debug(`执行按钮功能: ${toolId}`);
        
        // 临时激活按钮
        tool.active = true;
        this.activeToolId = toolId;
        
        // 触发工具状态变化回调 - 激活
        this.triggerToolStateChange(toolId, true, tool.type, {
          multi: tool.multi,
          hasChildren: false,
          temporary: true
        });
        
        // 执行工具功能
        this.handleToolActivation(tool);
        
        // 300ms后自动停用
        setTimeout(() => {
          tool.active = false;
          
          // 如果停用的是当前激活的工具，清除激活状态
          if (this.activeToolId === toolId) {
            this.activeToolId = null;
          }
          
          // 触发工具状态变化回调 - 停用
          this.triggerToolStateChange(toolId, false, tool.type, {
            multi: tool.multi,
            hasChildren: false,
            temporary: true
          });
        }, 300);
      }
    } else if (tool.type === 'toggle') {
      // 切换类型工具，直接反转激活状态
      const newActive = !tool.active;
      
      if (newActive) {
        // 激活当前工具
        this.activateTool(toolId);
      } else {
        // 停用当前工具
        this.deactivateTool(toolId);
      }
    } else {
      // 其他类型工具（如menu等）
      const currentActive = !!tool.active;
      
      if (currentActive) {
        // 如果当前是激活状态，则停用
        logger.debug(`工具 ${toolId} 将被停用`);
        this.deactivateTool(toolId);
      } else {
        // 如果当前是非激活状态，则激活
        logger.debug(`工具 ${toolId} 将被激活`);
        this.activateTool(toolId);
      }
    }
  }

  /**
   * 处理子菜单项点击
   * @param parentToolId 父工具ID
   * @param toolId 工具ID
   */
  handleSubMenuClick(parentToolId: string, toolId: string): void {
    const parentTool = this.tools.find(tool => tool.id === parentToolId);
    const tool = parentTool?.children?.find(child => child.id === toolId);
    
    if (!tool || tool.disabled) {
      return;
    }
    
    logger.debug(`处理子菜单项点击: ${parentToolId} > ${toolId}, 当前状态: ${tool.active ? '激活' : '未激活'}`);
    
    // 简化处理逻辑：统一处理激活/取消激活，不区分工具类型
    const currentActive = !!tool.active;
    const oldState = currentActive;
    
    if (currentActive) {
      // 如果当前是激活状态，则停用
      logger.debug(`子菜单项 ${toolId} 将被停用`);
      tool.active = false;
      
      // 执行停用操作
      this.handleToolDeactivation(tool);
      
      // 触发子菜单项状态变化回调 - 停用
      this.triggerToolStateChange(toolId, false, tool.type, {
        parentToolId,
        isSubmenuItem: true,
        multi: tool.multi,
        hasChildren: Boolean(tool.children && tool.children.length > 0)
      });
    } else {
      // 如果当前是非激活状态，则激活
      logger.debug(`子菜单项 ${toolId} 将被激活`);
      
      // 如果是非多选菜单项，需要停用其他已激活的同级菜单项
      if (!tool.multi && parentTool && parentTool.children) {
        parentTool.children.forEach(sibling => {
          if (sibling.id !== toolId && sibling.active && !sibling.multi) {
            sibling.active = false;
            logger.debug(`停用同级子菜单项: ${sibling.id}`);
            
            // 触发同级菜单项状态变化回调 - 停用
            this.triggerToolStateChange(sibling.id, false, sibling.type, {
              parentToolId,
              isSubmenuItem: true,
              multi: sibling.multi,
              hasChildren: Boolean(sibling.children && sibling.children.length > 0)
            });
          }
        });
      }
      
      // 激活当前子菜单项
      tool.active = true;
      
      // 执行激活操作
      this.handleToolActivation(tool);
      
      // 触发子菜单项状态变化回调 - 激活
      this.triggerToolStateChange(toolId, true, tool.type, {
        parentToolId,
        isSubmenuItem: true,
        multi: tool.multi,
        hasChildren: Boolean(tool.children && tool.children.length > 0)
      });
    }
  }

  /**
   * 激活工具
   * @param toolId 工具ID
   */
  activateTool(toolId: string): void {
    const tool = this.tools.find(tool => tool.id === toolId);
    
    if (!tool) {
      logger.debug(`无法激活工具 ${toolId}: 工具不存在`);
      return;
    }

    logger.debug(`正在激活工具 ${toolId}, 多选模式: ${tool.multi ? '是' : '否'}`);

    // 绘制工具和删除工具的互斥处理
    const drawingTools = ['draw-rectangle', 'draw-circle', 'draw-polygon', 'draw-line', 'draw-square'];
    const isDrawingTool = drawingTools.includes(toolId);
    const isDeleteTool = toolId === 'clear-shapes';
    const isEditTool = toolId === 'edit-shape';

    // 如果是绘制工具，检查删除工具是否激活
    if (isDrawingTool) {
      const deleteToolActive = this.tools.find(t => t.id === 'clear-shapes')?.active;
      if (deleteToolActive) {
        // 先停用删除工具
        logger.debug(`绘制工具 ${toolId} 激活，需要先停用删除工具`);
        this.deactivateTool('clear-shapes');
        
        // 确保删除模式完全被停用
        this.deactivateDeleteMode();
      }
      
      // 检查编辑工具是否激活
      const editToolActive = this.tools.find(t => t.id === 'edit-shape')?.active;
      if (editToolActive) {
        // 先停用编辑工具
        logger.debug(`绘制工具 ${toolId} 激活，需要先停用编辑工具`);
        this.deactivateTool('edit-shape');
      }
    }
    
    // 如果是删除工具，检查所有绘制工具是否有激活的
    if (isDeleteTool) {
      // 确保其他工具停用
      drawingTools.forEach(drawToolId => {
        const drawTool = this.tools.find(t => t.id === drawToolId);
        if (drawTool && drawTool.active) {
          // 先停用绘制工具
          logger.debug(`删除工具激活，需要先停用绘制工具 ${drawToolId}`);
          this.deactivateTool(drawToolId);
        }
      });
      
      // 检查编辑工具是否激活
      const editToolActive = this.tools.find(t => t.id === 'edit-shape')?.active;
      if (editToolActive) {
        // 先停用编辑工具
        logger.debug(`删除工具激活，需要先停用编辑工具`);
        this.deactivateTool('edit-shape');
      }
    }
    
    // 如果是编辑工具，检查删除工具和绘制工具是否有激活的
    if (isEditTool) {
      // 检查删除工具是否激活
      const deleteToolActive = this.tools.find(t => t.id === 'clear-shapes')?.active;
      if (deleteToolActive) {
        // 先停用删除工具
        logger.debug(`编辑工具激活，需要先停用删除工具`);
        this.deactivateTool('clear-shapes');
        
        // 确保删除模式完全被停用
        this.deactivateDeleteMode();
      }
      
      // 检查绘制工具是否激活
      drawingTools.forEach(drawToolId => {
        const drawTool = this.tools.find(t => t.id === drawToolId);
        if (drawTool && drawTool.active) {
          // 先停用绘制工具
          logger.debug(`编辑工具激活，需要先停用绘制工具 ${drawToolId}`);
          this.deactivateTool(drawToolId);
        }
      });
    }

    // 多选模式判断
    if (!tool.multi) {
      // 如果当前工具不支持多选，则关闭所有其他非多选工具
      this.tools.forEach(otherTool => {
        // 只处理非多选且当前激活的工具（排除当前工具）
        if (!otherTool.multi && otherTool.active && otherTool.id !== toolId) {
          logger.debug(`需要停用其他工具: ${otherTool.id}`);
          // 停用其他工具
          this.deactivateTool(otherTool.id);
        }
      });
    }
    
    // 如果工具已经是激活状态，不重复处理
    if (tool.active) {
      logger.debug(`工具 ${toolId} 已经是激活状态，不重复处理`);
      return;
    }
    
    // 激活当前工具
      tool.active = true;
    logger.debug(`工具 ${toolId} 已设置为激活状态`);
    
    // 设置当前激活工具ID（主要用于UI展示）
      this.activeToolId = toolId;
    logger.debug(`设置当前激活工具ID为 ${toolId}`);
      
      // 执行工具激活后的操作
      this.handleToolActivation(tool);
    
    // 如果是button类型工具，改为menu类型处理
    if (tool.type === 'button') {
      // 将按钮类型视为菜单类型，用于打开子菜单
      // 不进行自动停用，由用户手动关闭
      logger.debug(`按钮 ${toolId} 被视为菜单类型处理`);
    }
    
    // 触发工具状态变化回调 - 激活
    this.triggerToolStateChange(toolId, true, tool.type, {
      multi: tool.multi,
      hasChildren: Boolean(tool.children && tool.children.length > 0)
    });
  }

  /**
   * 停用工具
   * @param toolId 工具ID
   */
  deactivateTool(toolId: string): void {
    const tool = this.tools.find(tool => tool.id === toolId);
    
    if (!tool) {
      logger.debug(`无法停用工具 ${toolId}: 工具不存在`);
      return;
    }
    
    // 如果工具已经是非激活状态，不重复处理
    if (!tool.active) {
      logger.debug(`工具 ${toolId} 已经是非激活状态，不重复处理`);
      return;
    }
    
    logger.debug(`正在停用工具 ${toolId}，当前活动工具ID: ${this.activeToolId}`);
    
    // 设置工具为非激活状态
      tool.active = false;
    logger.debug(`工具 ${toolId} 已设置为非激活状态`);
      
      // 执行工具停用后的操作
      this.handleToolDeactivation(tool);
      
      // 如果停用的是当前激活的工具，清除激活状态
      if (this.activeToolId === toolId) {
        this.activeToolId = null;
      logger.debug(`清除当前激活工具ID`);
    }
    
    // 特殊处理layer-switch工具停用
    if (toolId === 'layer-switch') {
      // 确保UI更新反映工具停用状态
      logger.debug('图层切换工具停用，确保其状态为非激活');
      // 强制刷新工具状态
      tool.active = false;
      
      // 确保激活工具ID不是layer-switch
      if (this.activeToolId === 'layer-switch') {
        this.activeToolId = null;
        logger.debug('强制清除图层切换工具激活状态');
      }
    }
    
    // 如果是button类型工具，改为menu类型处理
    if (tool.type === 'button') {
      // 按钮类型被视为菜单类型，关闭子菜单
      logger.debug(`按钮 ${toolId} 被停用，将关闭菜单`);
    }
    
    // 触发工具状态变化回调 - 停用
    this.triggerToolStateChange(toolId, false, tool.type, {
      multi: tool.multi,
      hasChildren: Boolean(tool.children && tool.children.length > 0)
    });
    
    logger.debug(`工具 ${toolId} 停用完成`);
  }

  /**
   * 处理工具激活
   * @param tool 工具项
   */
  private handleToolActivation(tool: ToolItem): void {
    if (!tool || !tool.id) return;
    
    logger.debug(`处理工具激活: ${tool.id}`);
    
    switch (tool.id) {
      case 'zoom-in':
        this.handleZoomIn();
        break;
      case 'zoom-out':
        this.handleZoomOut();
        break;
      case 'fit-extent':
        this.handleFitToExtent();
        break;
      case 'measure':
        this.handleMeasureActivate();
        break;
      case 'coordinate':
        this.handleCoordinateActivate();
        break;
      case 'overview':
        this.handleOverviewMapActivate();
        break;
      case 'clear-shapes':
        // 检查是否处于编辑模式
        if (this.shapeObj && this.shapeObj.isEditMode()) {
          logger.warn('当前处于编辑模式，无法激活删除模式');
          
          // 取消删除工具的激活状态
          const clearShapesTool = this.tools.find(t => t.id === 'clear-shapes');
          if (clearShapesTool) {
            clearShapesTool.active = false;
            // 确保activeToolId不是clear-shapes
            if (this.activeToolId === 'clear-shapes') {
              this.activeToolId = null;
            }
          }
          
          // 通知用户
          if (this.toolStateChangeCallback) {
            this.toolStateChangeCallback('clear-shapes', false, 'toggle', {
              error: '编辑模式和删除模式不能同时激活',
              message: '请先停用编辑模式再激活删除模式'
            });
          }
          
          return;
        }
        this.activateDeleteMode();
        break;
      case 'cluster':
        this.handleClusterActivate();
        break;
      case 'track-player':
        this.handleTrackPlayerActivate();
        break;
      case 'flight-line':
        this.handleFlightLineActivate();
        break;
      case 'wind-layer':
        this.handleWindLayerActivate();
        break;
      case 'marker-toggle':
        this.handleButtonActivation(tool);
        // 切换标记点显示/隐藏
        if (this.markerObj) {
          if (this.markerObj.getMarkerCount() === 0) {
            logger.debug('没有标记点可以显示');
            return;
          }
          
          const markers = this.markerObj.getAllMarkers();
          const visibleCount = markers.filter(m => m.visible).length;
          
          if (visibleCount > 0) {
            // 如果有可见的标记点，则全部隐藏
            const count = this.markerObj.hideAllMarkers();
            if (this.toolStateChangeCallback) {
              this.toolStateChangeCallback(tool.id, false, 'button', { count });
            }
            logger.debug(`隐藏了 ${count} 个标记点`);
          } else {
            // 如果全部隐藏，则全部显示
            const count = this.markerObj.showAllMarkers();
            if (this.toolStateChangeCallback) {
              this.toolStateChangeCallback(tool.id, true, 'button', { count });
            }
            logger.debug(`显示了 ${count} 个标记点`);
          }
        }
        break;
      case 'label-toggle':
        this.handleButtonActivation(tool);
        // 切换标签显示/隐藏（现在使用popover代替标签）
        if (this.markerObj) {
          if (this.markerObj.getMarkerCount() === 0) {
            logger.debug('没有标记点可以显示/隐藏标签');
            return;
          }
          
          const markers = this.markerObj.getAllMarkers();
          const visibleMarkers = markers.filter(m => m.visible);
          if (visibleMarkers.length === 0) {
            logger.debug('没有可见的标记点，无法显示/隐藏标签');
            return;
          }
          
          // 检查是否有可以显示标签的标记点
          const hasLabels = visibleMarkers.some(m => m.title);
          if (!hasLabels) {
            logger.debug('可见的标记点没有标签');
      return;
    }
    
          // 检查当前是否有显示的popover
          const currentPopover = this.markerObj.getCurrentPopover();
          
          if (currentPopover) {
            // 如果当前有显示的popover，隐藏所有
            const count = this.markerObj.hideAllLabels(); // 这个方法现在会调用hideAllPopovers
            if (this.toolStateChangeCallback) {
              this.toolStateChangeCallback(tool.id, false, 'button', { count });
            }
            logger.debug(`隐藏了所有标记点的标签（popover），共 ${count} 个`);
    } else {
            // 如果当前没有显示的popover，显示所有
            const count = this.markerObj.showAllLabels(); // 这个方法现在会显示所有popover
            if (this.toolStateChangeCallback) {
              this.toolStateChangeCallback(tool.id, true, 'button', { count });
            }
            logger.debug(`显示了所有标记点的标签（popover），共 ${count} 个`);
          }
        }
        break;
      case 'popover-toggle':
        this.handleButtonActivation(tool);
        // 隐藏所有popover
        if (this.markerObj) {
          const count = this.markerObj.hideAllPopovers();
          if (this.toolStateChangeCallback) {
            this.toolStateChangeCallback(tool.id, false, 'button', { count });
          }
          logger.debug(`隐藏了所有标记点气泡，共 ${count} 个`);
        }
        break;
      case 'draw-rectangle':
        // 激活矩形绘制工具
        if (this.shapeObj) {
          this.shapeObj.enable('Rectangle');
          logger.debug('已激活矩形绘制工具');
        }
        break;
      case 'draw-square':
        // 激活正方形绘制工具
        if (this.shapeObj) {
          this.shapeObj.enable('Square');
          logger.debug('已激活正方形绘制工具');
        }
        break;
      case 'draw-circle':
        if (this.shapeObj) {
          this.shapeObj.enable('Circle');
          logger.debug('已激活圆形绘制工具');
        }
        break;
      case 'draw-polygon':
        if (this.shapeObj) {
          this.shapeObj.enable('Polygon');
          logger.debug('已激活多边形绘制工具');
        }
        break;
      case 'draw-line':
        if (this.shapeObj) {
          this.shapeObj.enable('LineString');
          logger.debug('已激活线段绘制工具');
        }
        break;
      case 'edit-shape':
        // 激活图形编辑工具
        this.handleShapeEditActivate();
        break;
      case 'grid-geohash':
        this.handleGridActivate(GridType.GEOHASH);
        break;
      case 'grid-hexagon':
        this.handleGridActivate(GridType.HEXAGON);
        break;
      case 'heatmap':
        this.handleHeatmapActivate();
        break;
      case 'boundary':
        this.handleBoundaryActivate();
        break;
    }
  }

  /**
   * 处理按钮类型工具的临时激活
   * @param tool 工具项
   * @param duration 激活持续时间（毫秒）
   * @deprecated 使用统一的activateTool和deactivateTool方法代替
   */
  private handleButtonActivation(tool: ToolItem, duration: number = 300): void {
    // 直接调用统一的激活方法，逻辑已经移到activateTool中
    this.activateTool(tool.id);
  }

  /**
   * 处理工具停用
   * @param tool 工具项
   */
  private handleToolDeactivation(tool: ToolItem): void {
    if (!tool || !tool.id) return;
    
    logger.debug(`处理工具停用: ${tool.id}`);
    
    switch (tool.id) {
      case 'measure':
        this.handleMeasureDeactivate();
        break;
      case 'coordinate':
        this.handleCoordinateDeactivate();
        break;
      case 'overview':
        this.handleOverviewMapDeactivate();
        break;
      case 'clear-shapes':
        // 确保完全停用删除模式
        logger.debug('删除工具停用，确保删除功能被完全停用');
        // 强制清理点击监听器和其他删除模式相关状态
        this.deactivateDeleteMode();
        
        // 更新UI状态
        const clearShapesTool = this.tools.find(t => t.id === 'clear-shapes');
        if (clearShapesTool) {
          clearShapesTool.active = false;
        }
        // 确保activeToolId不是clear-shapes
        if (this.activeToolId === 'clear-shapes') {
          this.activeToolId = null;
        }
        
        // 触发工具栏更新
        if (this.toolStateChangeCallback) {
          this.toolStateChangeCallback('clear-shapes', false, 'toggle', {
            message: '已退出删除模式'
          });
        }
        break;
      case 'grid-geohash':
        this.handleGridDeactivate(GridType.GEOHASH);
        break;
      case 'grid-hexagon':
        this.handleGridDeactivate(GridType.HEXAGON);
        break;
      case 'track-player':
        this.handleTrackPlayerDeactivate();
        break;
      case 'flight-line':
        this.handleFlightLineDeactivate();
        break;
      case 'wind-layer':
        this.handleWindLayerDeactivate();
        break;
      case 'heatmap':
        this.handleHeatmapDeactivate();
        break;
      case 'edit-shape':
        this.handleShapeEditDeactivate();
        break;
      case 'boundary':
        this.handleBoundaryDeactivate();
        break;
      default:
        logger.debug(`工具 ${tool.id} 无特殊停用处理`);
    }
  }

  /**
   * 处理缩放放大
   */
  private handleZoomIn(): void {
    if (this.mapObj && this.mapObj.getMapInstance()) {
      const view = this.mapObj.getMapInstance()?.getView();
      if (view) {
        const currentZoom = view.getZoom() || 0;
        view.animate({
          zoom: currentZoom + 1,
          duration: 250
        });
      }
    }
  }

  /**
   * 处理缩放缩小
   */
  private handleZoomOut(): void {
    if (this.mapObj && this.mapObj.getMapInstance()) {
      const view = this.mapObj.getMapInstance()?.getView();
      if (view) {
        const currentZoom = view.getZoom() || 0;
        view.animate({
          zoom: Math.max(0, currentZoom - 1),
          duration: 250
        });
      }
    }
  }

  /**
   * 处理适应范围
   */
  private handleFitToExtent(): void {
    if (this.mapObj && this.mapObj.getMapInstance()) {
      // 使用初始配置的中心点和缩放级别
      const config = this.mapObj.getConfigObject();
      if (config) {
        const center = config.getCenter();
        const zoom = config.getZoom();
        if (center && zoom) {
          this.mapObj.setCenter(center[0], center[1]);
          this.mapObj.setZoom(zoom);
        }
      }
    }
  }
  
  /**
   * 处理测距工具激活
   */
  private handleMeasureActivate(): void {
    if (!this.measureObj) {
      logger.warn('测距对象不存在，无法启用测距功能');
      return;
    }
    
    // 启用测距功能
    this.measureObj.enable('distance');
    logger.debug('测距功能已启用');
  }
  
  /**
   * 处理测距工具停用
   */
  private handleMeasureDeactivate(): void {
    if (!this.measureObj) return;
    
    // 禁用测距功能
    this.measureObj.disable();
    logger.debug('测距功能已禁用');
  }
  
  /**
   * 处理坐标工具激活
   */
  private handleCoordinateActivate(): void {
    if (!this.coordinateObj) {
      logger.warn('坐标对象不存在，无法启用坐标功能');
      return;
    }
    
    // 显示坐标面板 - 设置状态变量
    this.showCoordinatePanel = true;
    logger.info('坐标面板状态已设置为显示');
    
    // 确保我们有地图实例
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('地图实例不存在，无法启用坐标跟踪功能');
      return;
    }
    
    // 确保坐标对象绑定到最新的地图实例
    this.coordinateObj.setMapInstance(mapInstance);
    
    // 先禁用再启用，确保监听器正确绑定
    this.coordinateObj.disable();
    
    // 启用坐标跟踪
    this.coordinateObj.enable(this.coordinateCallback);
    
    // 手动触发面板状态变化通知
    if (this.toolStateChangeCallback) {
      this.toolStateChangeCallback('coordinate-panel', true, 'panel', {
        source: 'coordinate',
        panel: 'coordinate-panel'
      });
    }
    
    logger.info('坐标面板已显示，坐标跟踪已启用');
  }
  
  /**
   * 处理坐标工具停用
   */
  private handleCoordinateDeactivate(): void {
    // 隐藏坐标面板
    this.showCoordinatePanel = false;
    
    // 禁用坐标跟踪
    if (this.coordinateObj && this.coordinateObj.isEnabled()) {
      this.coordinateObj.disable();
    }
    
    logger.debug('坐标面板已隐藏，坐标跟踪已禁用');
  }

  /**
   * 处理清除要素
   */
  private handleClearFeatures(): void {
    if (this.mapObj && this.mapObj.getMapInstance()) {
      // 清除测距结果
      if (this.measureObj) {
        this.measureObj.clear();
      }
      
      // 清除所有图形
      if (this.shapeObj) {
        this.shapeObj.clear();
      }
      
      logger.info('已清除所有地图要素');
    }
  }

  /**
   * 获取坐标面板显示状态
   * @returns 坐标面板是否显示
   */
  isCoordinatePanelVisible(): boolean {
    return this.showCoordinatePanel;
  }
  
  
  /**
   * 切换测距类型
   * @param type 测距类型
   */
  switchMeasureType(type: MeasureType): void {
    if (!this.measureObj) return;
    
    this.measureObj.switchType(type);
  }

  /**
   * 处理鹰眼工具激活
   */
  private handleOverviewMapActivate(): void {
    // 不使用内置的鹰眼对象，完全靠ToolbarStateChange回调通知ScLayer显示自定义OverviewMap组件
    logger.debug('[Overview] 鹰眼工具激活，使用自定义OverviewMap组件');
    
    // 确保内置鹰眼对象不会被激活
    if (this.overviewMapObj) {
      // 明确禁用内置鹰眼，避免重复显示
      this.overviewMapObj.disable();
      }
      
    // 通知状态变化，由ScLayer组件处理显示自定义OverviewMap
            if (this.toolStateChangeCallback) {
      // 发送工具状态变化通知，只发送工具状态变化，而不发送expanded相关的通知
      this.toolStateChangeCallback('overview', true, 'toggle');
    }
  }
  
  /**
   * 处理鹰眼工具停用
   */
  private handleOverviewMapDeactivate(): void {
    if (this.overviewMapObj) {
      // 即使是空实现，也明确调用disable以确保内置鹰眼被禁用
    this.overviewMapObj.disable();
    }
    
    // 通知停用状态变化
    if (this.toolStateChangeCallback) {
      this.toolStateChangeCallback('overview', false, 'toggle');
    }
    
    logger.debug('[Overview] 鹰眼功能已禁用');
  }

  /**
   * 处理聚合工具激活
   */
  private handleClusterActivate(): void {
    if (!this.markerObj) {
      logger.warn('标记点对象不存在，无法启用聚合功能');
      return;
    }
    
    // 启用聚合模式
    this.enableCluster();
    
    // 触发工具状态变化回调
    if (this.toolStateChangeCallback) {
      this.toolStateChangeCallback('cluster-enabled', true, 'feature', {
        source: 'cluster-activate',
        config: this.clusterConfig
      });
    }
    
    logger.info('聚合功能已启用');
  }

  /**
   * 设置聚合配置
   * @param config 聚合配置
   */
  public setClusterConfig(config: Partial<AggregationOptions>): void {
    if (!this.markerObj) {
      logger.warn('标记点对象不存在，无法设置聚合配置');
      return;
    }
    
    // 合并配置
    this.clusterConfig = { ...this.clusterConfig, ...config };
    
    // 更新地图元素上的配置，使得MarkerObject可以访问最新配置
    const mapInstance = this.mapObj.getMapInstance();
    if (mapInstance) {
      const targetElement = mapInstance.getTargetElement();
      if (targetElement) {
        targetElement['clusterConfig'] = this.clusterConfig;
        logger.debug('更新了地图元素上的聚合配置');
      }
    }
    
    // 如果指定了聚合半径并且是数字类型，将其应用到标记点对象
    if (typeof this.clusterConfig.maxClusterRadius === 'number' && this.clusterConfig.maxClusterRadius > 0) {
      // 确保半径是有效的像素值
      let distanceInPixels = this.clusterConfig.maxClusterRadius;
      
      // 如果单位是千米，转换为像素（大约的转换，不同缩放级别可能需要调整）
      if (this.clusterConfig.radiusUnit === 'kilometer') {
        // 假设1千米约等于屏幕上的40像素
        distanceInPixels = Math.round(this.clusterConfig.maxClusterRadius * 40);
      }
      
      // 设置聚合距离
      this.markerObj.setClusterDistance(distanceInPixels);
      
      logger.debug(`已将聚合半径设置为 ${this.clusterConfig.maxClusterRadius} ${this.clusterConfig.radiusUnit} (约 ${distanceInPixels} 像素)`);
    }
    
    // 如果正在使用聚合模式，需要重新应用设置
    if (this.isClusterEnabled()) {
      // 先禁用再启用聚合，以应用新的设置
      this.markerObj.setClusterMode(false);
      this.markerObj.setClusterMode(true);
      
      logger.debug('已应用新的聚合配置');
    }
  }

  /**
   * 获取当前聚合配置
   * @returns 聚合配置
   */
  public getClusterConfig(): AggregationOptions {
    return { ...this.clusterConfig };
  }

  /**
   * 启用聚合功能
   */
  private enableCluster(): void {
    if (!this.markerObj) {
      logger.warn('标记点对象不存在，无法启用聚合功能');
      return;
    }
    
    // 如果指定了聚合半径并且是数字类型，先设置距离
    if (typeof this.clusterConfig.maxClusterRadius === 'number' && this.clusterConfig.maxClusterRadius > 0) {
      // 确保半径是有效的像素值
      let distanceInPixels = this.clusterConfig.maxClusterRadius;
      
      // 如果单位是千米，转换为像素
      if (this.clusterConfig.radiusUnit === 'kilometer') {
        distanceInPixels = Math.round(this.clusterConfig.maxClusterRadius * 40);
      }
      
      this.markerObj.setClusterDistance(distanceInPixels);
      logger.debug(`聚合半径设置为 ${this.clusterConfig.maxClusterRadius} ${this.clusterConfig.radiusUnit} (约 ${distanceInPixels} 像素)`);
    }
    
    // 将聚合配置传递给地图元素，使得MarkerObject可以访问
    const mapInstance = this.mapObj.getMapInstance();
    if (mapInstance) {
      const targetElement = mapInstance.getTargetElement();
      if (targetElement) {
        // 在DOM元素上设置配置属性，让其他组件可以获取
        targetElement['clusterConfig'] = this.clusterConfig;
        logger.debug('聚合配置已传递给地图元素，其他组件可以访问');
      }
    }
    
    // 启用标记点的聚合模式
    this.markerObj.setClusterMode(true);
    
    // 添加聚合点击事件处理
    this.setupClusterClickHandler();
    
    logger.debug('聚合功能已启用');
  }

  /**
   * 禁用聚合功能
   */
  private disableCluster(): void {
    if (!this.markerObj) {
      return;
    }
    
    // 禁用标记点的聚合模式
    this.markerObj.setClusterMode(false);
    
    logger.debug('聚合功能已禁用');
  }

  /**
   * 设置聚合点击事件处理
   * 当点击聚合点时，根据配置决定是否自动缩放到聚合点的范围
   */
  private setupClusterClickHandler(): void {
    if (!this.markerObj) {
      logger.warn('标记点对象不存在，无法设置聚合点击事件处理');
      return;
    }

    // 设置聚合点击处理函数
    if (this.clusterConfig.zoomToBoundsOnClick) {
      // 使用标记点对象提供的聚合点击处理功能，会自动缩放到聚合点的范围
      this.markerObj.setClusterClickHandler();
      logger.info('已设置聚合点击时缩放到范围');
    } else {
      // 如果不需要缩放到范围，可以设置一个自定义的点击处理函数
      this.markerObj.setClusterClickHandler((features, coordinate) => {
        // 仅记录信息，不执行缩放操作
        logger.info(`点击了聚合点，包含 ${features.length} 个标记点，坐标: [${coordinate[0].toFixed(2)}, ${coordinate[1].toFixed(2)}]`);
      });
      logger.info('已设置聚合点击时不缩放到范围');
    }
  }

  /**
   * 获取聚合状态
   * @returns 是否启用聚合
   */
  public isClusterEnabled(): boolean {
    return this.markerObj ? this.markerObj.getClusterMode() : false;
  }

  /**
   * 处理轨迹播放器激活
   */
  private handleTrackPlayerActivate(): void {
    // 确保工具真正被标记为激活
    const trackPlayerTool = this.tools.find(tool => tool.id === 'track-player');
    if (trackPlayerTool) {
      trackPlayerTool.active = true;
      this.activeToolId = 'track-player';
      logger.debug('轨迹播放器工具已设置为激活状态');
    } else {
      logger.warn('找不到轨迹播放器工具，无法设置激活状态');
    }
    
    // 触发工具状态变化事件，传递轨迹对象
    this.triggerToolStateChange('track-player', true, 'track-player', { trackObj: this.trackObj });
    
    logger.debug('轨迹播放器已激活');
  }

  /**
   * 处理轨迹播放器停用
   */
  private handleTrackPlayerDeactivate(): void {
    // 确保工具真正被标记为非激活
    const trackPlayerTool = this.tools.find(tool => tool.id === 'track-player');
    if (trackPlayerTool) {
      trackPlayerTool.active = false;
      if (this.activeToolId === 'track-player') {
        this.activeToolId = null;
      }
      logger.debug('轨迹播放器工具已设置为非激活状态');
    }
    
    // 触发工具状态变化事件
    this.triggerToolStateChange('track-player', false, 'track-player');
    
    logger.debug('轨迹播放器已停用');
  }

  /**
   * 获取轨迹对象
   * @returns 轨迹对象
   */
  public getTrackObject(): TrackObject | null {
    return this.trackObj;
  }

  /**
   * 处理网格工具激活
   * @param gridType 网格类型
   */
  private handleGridActivate(gridType: GridType): void {
    if (!this.gridObj) {
      logger.warn('网格对象不存在，无法启用网格功能');
      return;
    }
    
    // 启用对应类型的网格
    this.gridObj.enable(gridType);
    logger.debug(`${gridType === GridType.GEOHASH ? 'GeoHash' : '蜂窝'}网格已启用`);
    
    // 触发工具状态变化回调
    if (this.toolStateChangeCallback) {
      this.toolStateChangeCallback('grid-active', true, 'feature', {
        gridType,
        source: 'grid-activate'
      });
    }
  }
  
  /**
   * 处理网格工具停用
   * @param gridType 网格类型
   */
  private handleGridDeactivate(gridType: GridType): void {
    if (!this.gridObj) {
      return;
    }
    
    // 禁用对应类型的网格
    this.gridObj.disable(gridType);
    logger.debug(`${gridType === GridType.GEOHASH ? 'GeoHash' : '蜂窝'}网格已禁用`);
    
    // 触发工具状态变化回调
    if (this.toolStateChangeCallback) {
      this.toolStateChangeCallback('grid-active', false, 'feature', {
        gridType,
        source: 'grid-deactivate'
      });
    }
  }
  
  /**
   * 获取网格对象
   * @returns 网格对象
   */
  public getGridObject(): GridManager | null {
    return this.gridObj;
  }

  /**
   * 处理热力图激活
   * @private
   */
  private handleHeatmapActivate(): void {
    if (!this.heatmapObj) {
      logger.warn('热力图对象不存在，无法激活');
      return;
    }
    
    // 启用热力图
    this.heatmapObj.enable();
    
    logger.debug('热力图已激活');
    
    // 触发状态变化回调
    this.triggerToolStateChange('heatmap', true, 'toggle');
  }
  
  /**
   * 处理热力图禁用
   * @private
   */
  private handleHeatmapDeactivate(): void {
    if (!this.heatmapObj) {
      logger.warn('热力图对象不存在，无法停用热力图');
      return;
    }
    
    // 停用热力图
    this.heatmapObj.disable();
    
    // 触发事件
    this.triggerToolStateChange('heatmap', false, 'layer');
  }

  /**
   * 处理飞线图激活
   */
  private handleFlightLineActivate(): void {
    if (!this.flightLineObj) {
      logger.warn('飞线图对象不存在，无法激活飞线图');
      return;
    }
    
    // 激活飞线图
    this.flightLineObj.enable();
    logger.debug('[FlightLine] 飞线图已启用');
    
    // 触发事件
    this.triggerToolStateChange('flightLine', true, 'layer', {
      showFlightLineList: true // 添加显示飞线列表的信号
    });
    
    // 额外日志信息，帮助诊断
    logger.info('[FlightLine] 飞线图工具已激活，发送显示飞线列表面板信号');
  }

  /**
   * 处理飞线图停用
   */
  private handleFlightLineDeactivate(): void {
    if (!this.flightLineObj) {
      logger.warn('飞线图对象不存在，无法停用飞线图');
      return;
    }
    
    // 停用飞线图
    this.flightLineObj.disable();
    logger.debug('[FlightLine] 飞线图已停用');
    
    // 触发事件
    this.triggerToolStateChange('flightLine', false, 'layer');
    
    // 额外日志信息
    logger.info('[FlightLine] 飞线图工具已停用');
  }

  /**
   * 销毁对象
   */
  destroy(): void {
    logger.debug('开始销毁工具栏对象');
    
    // 递归函数，用于停用所有工具
    const deactivateTools = (items: ToolItem[]) => {
      items.forEach(tool => {
        if (tool.active) {
          logger.debug(`销毁过程中停用工具: ${tool.id}`);
          
          // 根据工具类型执行不同的停用逻辑
          switch (tool.id) {
            case 'measure':
              this.handleMeasureDeactivate();
              break;
              
            case 'coordinate':
              this.handleCoordinateDeactivate();
              break;
              
            case 'overview':
              this.handleOverviewMapDeactivate();
              break;
              
            case 'clear-shapes':
              this.deactivateDeleteMode();
              break;
              
            case 'cluster':
              this.disableCluster();
              break;
              
            case 'grid-geohash':
              this.handleGridDeactivate(GridType.GEOHASH);
              break;
              
            case 'grid-hexagon':
              this.handleGridDeactivate(GridType.HEXAGON);
              break;
              
            case 'edit-shape':
              this.handleShapeEditDeactivate();
              break;
              
            default:
              // 对于其他工具，简单地设置激活状态为false
              tool.active = false;
          }
        }
        
        // 递归处理子菜单项
        if (tool.children && tool.children.length > 0) {
          deactivateTools(tool.children);
        }
      });
    };
    
    // 停用所有工具
    deactivateTools(this.tools);
    
    // 主动清除当前激活工具ID
    if (this.activeToolId) {
      this.activeToolId = null;
      logger.debug('销毁过程中清除当前激活工具ID');
    }
    
    // 禁用聚合功能
    this.disableCluster();
    
    // 清理图形事件监听器
    this.cleanupShapeEventListeners();
    
    // 销毁坐标对象
    if (this.coordinateObj) {
      this.coordinateObj.destroy();
      this.coordinateObj = null;
    }
    
    // 销毁测距对象
    if (this.measureObj) {
      this.measureObj.destroy();
      this.measureObj = null;
    }
    
    // 销毁鹰眼对象 - 确保内置鹰眼对象被完全销毁
    if (this.overviewMapObj) {
      // 先禁用再销毁，确保清理干净
      this.overviewMapObj.disable();
      this.overviewMapObj.destroy();
      this.overviewMapObj = null;
      
      // 通知ScLayer隐藏自定义鹰眼地图
      if (this.toolStateChangeCallback) {
        this.toolStateChangeCallback('overview', false, 'toggle');
      }
    }
    
    // 销毁标记点对象
    if (this.markerObj) {
      this.markerObj.destroy();
      this.markerObj = null;
    }
    
    // 销毁图形绘制对象
    if (this.shapeObj) {
      // 确保编辑模式被禁用
      if (this.shapeObj.isEditMode()) {
        this.shapeObj.disableEditMode();
        logger.debug('销毁过程中禁用图形编辑模式');
      }
      this.shapeObj.destroy();
      this.shapeObj = null;
    }
    
    // 销毁轨迹对象
    if (this.trackObj) {
      this.trackObj.destroy();
      this.trackObj = null;
    }
    
    // 销毁网格对象
    if (this.gridObj) {
      this.gridObj.destroy();
      this.gridObj = null;
    }
    
    // 销毁热力图对象
    if (this.heatmapObj) {
      this.heatmapObj.destroy();
      this.heatmapObj = null;
    }
    
    // 移除对toolbarObj的引用
    const mapInstance = this.mapObj.getMapInstance();
    if (mapInstance) {
      const targetElement = mapInstance.getTargetElement();
      if (targetElement && targetElement['toolbarObj']) {
        delete targetElement['toolbarObj'];
        logger.debug('已从地图元素中移除toolbarObj引用');
      }
    }
    
    // 移除工具状态变化回调
    this.removeToolStateChangeCallback();
    
    // 清空工具列表
    this.tools = [];
    
    // 销毁区划边界对象
    if (this.boundaryObj) {
      this.boundaryObj.destroy();
      this.boundaryObj = null;
    }
    
    logger.debug('工具栏对象销毁完成');
  }

  /**
   * 设置工具状态变化回调
   * @param callback 回调函数
   */
  public setToolStateChangeCallback(callback: ToolStateChangeCallback): void {
    this.toolStateChangeCallback = callback;
    logger.debug('已设置工具状态变化回调函数');
  }

  /**
   * 移除工具状态变化回调
   */
  public removeToolStateChangeCallback(): void {
    this.toolStateChangeCallback = null;
    logger.debug('已移除工具状态变化回调函数');
  }

  /**
   * 触发工具状态变化回调
   * @param toolId 工具ID
   * @param active 激活状态
   * @param toolType 工具类型
   * @param data 附加数据
   */
  private triggerToolStateChange(toolId: string, active: boolean, toolType: string, data?: any): void {
    if (this.toolStateChangeCallback) {
      try {
        this.toolStateChangeCallback(toolId, active, toolType, data);
        logger.debug(`已触发工具状态变化回调: ${toolId}, 激活状态: ${active}, 类型: ${toolType}`);
      } catch (error) {
        logger.error('工具状态变化回调执行出错:', error);
      }
    }
  }

  /**
   * 激活删除模式
   * 允许用户点击图形或标记点来删除特定元素
   */
  private activateDeleteMode(): void {
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) return;

    // 先检查编辑模式是否已经激活，如果是，则不应该激活删除模式
    if (this.shapeObj && this.shapeObj.isEditMode()) {
      logger.warn('编辑模式已激活，无法同时激活删除模式');
      
      // 取消删除工具的激活状态
      const clearShapesTool = this.tools.find(t => t.id === 'clear-shapes');
      if (clearShapesTool) {
        clearShapesTool.active = false;
        // 确保激活工具ID不是clear-shapes
        if (this.activeToolId === 'clear-shapes') {
          this.activeToolId = null;
        }
      }
      
      // 通知用户
      if (this.toolStateChangeCallback) {
        this.toolStateChangeCallback('clear-shapes', false, 'toggle', {
          error: '编辑模式和删除模式不能同时激活',
          message: '请先停用编辑模式再激活删除模式'
        });
      }
      
      return;
    }
    
    // 检查是否已有绘制工具激活
    const drawingTools = ['draw-rectangle', 'draw-circle', 'draw-polygon', 'draw-line', 'draw-square'];
    for (const toolId of drawingTools) {
      const tool = this.tools.find(t => t.id === toolId);
      if (tool && tool.active) {
        // 如果有绘制工具已激活，先停用它
        logger.debug(`删除模式激活，需要先停用绘制工具 ${toolId}`);
        this.deactivateTool(toolId);
      }
    }
    
    // 确保删除模式没有被其他对象激活
    if (this.shapeObj && this.shapeObj.isDeleteMode()) {
      // 如果ShapeObject已经在删除模式，先禁用它
      logger.debug('发现ShapeObject正处于删除模式，先禁用它');
      this.shapeObj.disableDeleteMode();
    }
    
    // 修改鼠标指针样式，指示当前处于删除模式
    if (mapInstance.getTargetElement()) {
      mapInstance.getTargetElement().style.cursor = 'pointer';
    }
    
    // 创建一个点击监听器，用于处理删除操作
    const deleteClickListener = (evt: any) => {
      // 在开始处理删除前，再次检查是否已经进入编辑模式
      // 防止用户激活删除模式后又立即切换到编辑模式
      if (this.shapeObj && this.shapeObj.isEditMode()) {
        logger.warn('当前处于编辑模式，删除操作被取消');
        return;
      }
      
      // 检查删除工具是否仍处于激活状态
      const clearShapesTool = this.tools.find(t => t.id === 'clear-shapes');
      if (!clearShapesTool || !clearShapesTool.active) {
        logger.warn('删除工具已被停用，但收到了点击事件，将忽略');
        // 主动停止监听
        this.deactivateDeleteMode();
        return;
      }
      
      // 检查是否已激活编辑工具
      const editTool = this.tools.find(t => t.id === 'edit-shape');
      if (editTool && editTool.active) {
        logger.warn('当前已激活编辑工具，删除操作被取消');
        return;
      }
      
      let hasDeleted = false; // 标记是否已删除了某个要素
      
      logger.debug(`删除模式：处理点击事件，坐标: ${evt.pixel.join(',')}`);
      
      // 首先尝试检测并删除图形
      if (this.shapeObj && !hasDeleted) {
        mapInstance.forEachFeatureAtPixel(
          evt.pixel,
          (feature) => {
            if (hasDeleted) return true;
            
            const id = feature.getId() || feature.get('id') || feature.get('id') || feature.get('id');
            const data = feature.get('data');
            if(data && data.dataType === DataType.SHAPE){
              logger.debug(`发现图形: ${id}`);
              
              // 检查是否处于编辑模式
              if (this.shapeObj!.isEditMode() || (editTool && editTool.active)) {
                logger.warn(`图形 ${id} 处于编辑模式，不能删除`);
                return true; // 停止遍历
              }
              
              // 删除图形
              const success = this.shapeObj!.removeShape(id);
              if (success) {
                logger.info(`成功删除图形: ${id}`);
                hasDeleted = true;
                return true; // 停止遍历
              }
            }
            return false;
          },
          { hitTolerance: 30 }
        );
      }
      
      // 如果没有删除图形，尝试删除标记点
      if (!hasDeleted && this.markerObj) {
        // 再次检查是否处于编辑模式或编辑工具已激活
        if (this.shapeObj && (this.shapeObj.isEditMode() || (editTool && editTool.active))) {
          logger.warn('当前处于编辑模式，标记点删除操作被取消');
          return;
        }
        
        // 尝试方法1: 直接使用forEachFeatureAtPixel遍历所有要素
        mapInstance.forEachFeatureAtPixel(
          evt.pixel,
          (feature) => {
            if (hasDeleted) return true;
            
            // 检查是否为聚合点
            const features = feature.get('features');
            if (features && Array.isArray(features) && features.length > 0) {
              // 是聚合点，检查聚合的第一个要素
              logger.debug(`发现聚合点，包含 ${features.length} 个标记点`);
              
              // 尝试删除聚合中的第一个标记点
              const firstFeature = features[0];
              const clusterId = firstFeature.get('id');
              
              if(firstFeature.get('dataType') === DataType.MARKER){
                logger.debug(`尝试删除聚合中的标记点: ${clusterId}`);
                
                if (this.markerObj!.getMarker(clusterId)) {
                  const success = this.markerObj!.removeMarker(clusterId);
                  if (success) {
                    logger.info(`成功删除聚合中的标记点: ${clusterId}`);
                    hasDeleted = true;
                    return true;
                  }
                }
              }
              
              return false;
            }
            
            // 常规标记点处理
            const markerId = feature.get('id');
            if(feature.get('dataType') === DataType.MARKER){
              logger.debug(`发现标记点 (方法1): ${markerId}`);
              
              // 检查标记点是否存在
              if (this.markerObj!.getMarker(markerId)) {
                const success = this.markerObj!.removeMarker(markerId);
                if (success) {
                  logger.info(`成功删除标记点 (方法1): ${markerId}`);
                  hasDeleted = true;
                  return true; // 停止遍历
                }
              }
            }
            
            return false;
          },
          { hitTolerance: 30 }
        );
        
        // 尝试方法2: 使用标记点对象提供的检测方法
        if (!hasDeleted) {
          const markerHit = this.markerObj.checkMarkerClick(evt.pixel);
          if (markerHit && markerHit.id) {
            logger.debug(`发现标记点 (方法2): ${markerHit.id}`);
            const success = this.markerObj.removeMarker(markerHit.id);
            if (success) {
              logger.info(`成功删除标记点 (方法2): ${markerHit.id}`);
              hasDeleted = true;
            }
          }
        }
        
        // 尝试方法3: 使用点击位置在地图坐标上查找最接近的标记点
        if (!hasDeleted) {
          // 将屏幕坐标转换为地图坐标
          const clickCoordinate = mapInstance.getCoordinateFromPixel(evt.pixel);
          logger.debug(`点击地图坐标: [${clickCoordinate.join(', ')}]`);
          
          // 获取所有标记点
          const allMarkers = this.markerObj.getAllMarkers();
          logger.debug(`尝试方法3: 检查 ${allMarkers.length} 个标记点的位置`);
          
          // 用于存储最近的标记点
          let closestMarkerId: string | null = null;
          let minDistance = Infinity;
          const hitTolerance = 30 * mapInstance.getView().getResolution()!; // 将屏幕像素转换为地图单位
          
          // 查找最近的标记点
          for (const marker of allMarkers) {
            if (marker.id && marker.visible !== false && marker.position) {
              // 获取标记点位置并计算距离
              const markerCoord = marker.position;
              // 确保坐标是地图使用的投影
              const markerMapCoord = mapInstance.getView().getProjection().getCode() === 'EPSG:4326' 
                ? markerCoord 
                : fromLonLat(markerCoord);
                
              // 计算距离
              const dx = clickCoordinate[0] - markerMapCoord[0];
              const dy = clickCoordinate[1] - markerMapCoord[1];
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < minDistance && distance < hitTolerance) {
                minDistance = distance;
                closestMarkerId = marker.id;
              }
            }
          }
          
          // 如果找到了足够近的标记点，删除它
          if (closestMarkerId) {
            logger.debug(`找到距离点击位置最近的标记点: ${closestMarkerId}, 距离: ${minDistance}`);
            const success = this.markerObj.removeMarker(closestMarkerId);
            if (success) {
              logger.info(`成功删除最近的标记点 (方法3): ${closestMarkerId}`);
              hasDeleted = true;
            }
          } else {
            logger.debug('找不到距离点击位置足够近的标记点');
          }
        }
      }
      
      if (!hasDeleted) {
        logger.debug('没有找到要删除的元素');
      }
    };
    
    // 修正监听器绑定方式，确保正确添加和后续可以移除
    try {
      // 首先检查并移除可能已存在的监听器
      if ((mapInstance as any)._deleteClickListener) {
        logger.debug('发现已存在的删除模式监听器，先移除它');
        mapInstance.un('click', (mapInstance as any)._deleteClickListener);
        delete (mapInstance as any)._deleteClickListener;
      }
      
      // 添加新的监听器
      (mapInstance as any)._deleteClickListener = deleteClickListener;
      const key = mapInstance.on('click', deleteClickListener);
      logger.debug('成功添加删除模式的点击监听器');
      
      // 更新工具状态
      const clearShapesTool = this.tools.find(t => t.id === 'clear-shapes');
      if (clearShapesTool) {
        clearShapesTool.active = true;
      }
      // 更新当前激活工具ID
      this.activeToolId = 'clear-shapes';
    } catch (error) {
      logger.error('添加删除模式点击监听器时发生错误:', error);
    }
    
    logger.info('已激活删除模式，点击图形或标记点可以删除它们');
    
    // 修改命令提示
    if (this.toolStateChangeCallback) {
      this.toolStateChangeCallback('delete-mode', true, 'mode', {
        message: '点击要素可以删除它们'
      });
    }
  }
  
  /**
   * 停用删除模式
   */
  private deactivateDeleteMode(): void {
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) return;
    
    // 确保ShapeObject中的删除模式也被停用
    if (this.shapeObj && this.shapeObj.isDeleteMode()) {
      this.shapeObj.disableDeleteMode();
      logger.debug('已停用ShapeObject的删除模式');
    }
    
    // 恢复鼠标指针样式
    if (mapInstance.getTargetElement()) {
      mapInstance.getTargetElement().style.cursor = '';
    }
    
    // 移除所有可能的监听器
    try {
      // 1. 移除ToolbarObject添加的删除监听器
      if ((mapInstance as any)._deleteClickListener) {
        logger.debug('正在移除ToolbarObject的删除监听器');
        mapInstance.un('click', (mapInstance as any)._deleteClickListener);
        delete (mapInstance as any)._deleteClickListener;
      }
      
      // 2. 检查是否存在其他可能的点击监听器（通过其他方式添加）
      const events = (mapInstance as any).hasOwnProperty('ol_lm') ? 
                    (mapInstance as any).ol_lm.click : null;
      
      if (events && Array.isArray(events) && events.length > 0) {
        logger.debug(`地图上存在 ${events.length} 个点击监听器，检查是否需要清理`);
        // 暂不删除其他监听器，避免影响其他功能
      }
    } catch (error) {
      logger.error('移除删除模式点击监听器时发生错误:', error);
    }
    
    // 更新UI状态
    const clearShapesTool = this.tools.find(t => t.id === 'clear-shapes');
    if (clearShapesTool) {
      clearShapesTool.active = false;
    }
    
    // 确保activeToolId不是clear-shapes
    if (this.activeToolId === 'clear-shapes') {
      this.activeToolId = null;
    }
    
    logger.info('已停用删除模式');
    
    // 修改命令提示
    if (this.toolStateChangeCallback) {
      this.toolStateChangeCallback('delete-mode', false, 'mode', {
        message: '已退出删除模式'
      });
    }
  }
  /**
   * 获取鹰眼地图对象
   * @returns 鹰眼地图对象
   */
  getOverviewMapObject(): OverviewMapObject | null {
    return this.overviewMapObj;
  }

  /**
   * 获取标记点对象
   * @returns 标记点对象
   */
  getMarkerObject(): MarkerObject | null {
    return this.markerObj;
  }

  /**
   * 获取图形绘制对象
   * @returns 图形绘制对象
   */
  getShapeObject(): ShapeObject | null {
    return this.shapeObj;
  }

  /**
   * 获取热力图对象
   * @returns 热力图对象
   */
  public getHeatmapObject(): HeatmapObject | null {
    return this.heatmapObj;
  }

  /**
   * 获取飞线图对象
   * @returns 飞线图对象
   */
  public getFlightLineObject(): FlightLineObject | null {
    return this.flightLineObj;
  }

  /**
   * 获取风场图对象
   * @returns 风场图对象
   */
  public getWindObject(): WindObject | null {
    return this.windObj;
  }

  /**
   * 激活图形编辑功能
   * 启用编辑模式，允许用户修改已有的图形
   */
  private handleShapeEditActivate(): void {
    logger.warn('图形编辑功能已被禁用');
    
    // 立即取消激活状态
    this.deactivateTool('edit-shape');
    
    // 通知用户该功能已被禁用
    this.triggerToolStateChange('edit-shape', false, 'edit', { 
      action: 'disabled',
      message: '图形编辑功能已被禁用' 
    });
  }

  /**
   * 设置图形事件监听器
   * 监听图形编辑过程中的事件
   */
  private setupShapeEventListeners(): void {
    if (!this.shapeObj || !this.mapObj.getMapInstance()) return;
    
    const mapElement = this.mapObj.getMapInstance()!.getTargetElement();
    if (!mapElement) return;
    
    // 监听图形编辑开始事件
    mapElement.addEventListener('shape-edit-start', (event: any) => {
      const { id, type, feature } = event.detail;
      logger.debug(`捕获到图形编辑开始事件: 图形ID=${id}, 类型=${type}`);
      
      // 通知状态变化
      this.triggerToolStateChange('shape-edit-start', true, 'edit', {
        shapeId: id,
        shapeType: type,
        geometry: feature.getGeometry() ? feature.getGeometry().getType() : 'unknown'
      });
    });
    
    // 监听图形编辑中事件
    mapElement.addEventListener('shape-editing', (event: any) => {
      const { id, type } = event.detail;
      logger.debug(`捕获到图形编辑中事件: 图形ID=${id}, 类型=${type}`);
      
      // 通知状态变化 (可选，频率较高可能不需要每次都通知)
      // this.triggerToolStateChange('shape-editing', true, 'edit', { shapeId: id, shapeType: type });
    });
    
    // 监听图形编辑完成事件
    mapElement.addEventListener('shape-update', (event: any) => {
      const { id, type, feature } = event.detail;
      logger.debug(`捕获到图形更新事件: 图形ID=${id}, 类型=${type}`);
      
      // 通知状态变化
      this.triggerToolStateChange('shape-update', true, 'edit', {
        shapeId: id,
        shapeType: type,
        action: 'update',
        feature: {
          id,
          type,
          geometry: feature.getGeometry() ? feature.getGeometry().getType() : 'unknown',
          data: feature.get('data')
        }
      });
    });
    
    // 监听图形修改完成事件 (新事件)
    mapElement.addEventListener('shape-modified', (event: any) => {
      const { id, type, feature } = event.detail;
      logger.debug(`捕获到图形修改完成事件: 图形ID=${id}, 类型=${type}`);
      
      // 通知状态变化
      this.triggerToolStateChange('shape-modified', true, 'edit', {
        shapeId: id,
        shapeType: type,
        action: 'modify'
      });
    });
  }

  /**
   * 清理图形事件监听器
   */
  private cleanupShapeEventListeners(): void {
    if (!this.mapObj.getMapInstance()) return;
    
    const mapElement = this.mapObj.getMapInstance()!.getTargetElement();
    if (!mapElement) return;
    
    // 移除所有事件监听器
    const events = ['shape-edit-start', 'shape-editing', 'shape-update', 'shape-modified'];
    events.forEach(eventName => {
      // 因为我们无法直接引用监听器函数，我们借助克隆节点移除所有监听器
      const clone = mapElement.cloneNode(false);
      mapElement.parentNode?.replaceChild(clone, mapElement);
      
      logger.debug(`已清理 ${eventName} 事件监听器`);
    });
  }

  /**
   * 停用图形编辑功能
   */
  private handleShapeEditDeactivate(): void {
    if (!this.shapeObj) {
      return;
    }
    
    // 检查是否在编辑模式，记录编辑的图形ID
    const editInfo = this.shapeObj.isEditMode() ? this.shapeObj.getEditModeInfo() : null;
    const editingFeatureId = editInfo?.editingFeatureId;
    
    // 禁用编辑模式
    this.shapeObj.disableEditMode();
    
    // 如果有正在编辑的图形，触发更新完成事件
    if (editingFeatureId) {
      logger.debug(`编辑模式停用，图形 ${editingFeatureId} 的编辑已完成`);
      
      // 通知其他组件编辑已结束
      this.triggerToolStateChange('edit-complete', false, 'edit', {
        shapeId: editingFeatureId
      });
    }
    
    // 更新工具状态
    this.triggerToolStateChange('edit-shape', false, 'edit', { 
      action: 'disable',
      message: '图形编辑模式已停用' 
    });
    
    // 清理事件监听器
    this.cleanupShapeEventListeners();
    
    // 移除地图鼠标提示
    const mapInstance = this.mapObj.getMapInstance();
    if (mapInstance && mapInstance.getTargetElement()) {
      mapInstance.getTargetElement().removeAttribute('data-edit-mode');
      mapInstance.getTargetElement().title = '';
    }
    
    logger.info('图形编辑模式已停用');
  }

  /**
   * 处理风场图激活
   */
  private handleWindLayerActivate(): void {
    if (!this.windObj) {
      logger.warn('风场图对象未初始化，无法启用风场图');
      return;
    }
    
    // 加载默认风场数据
    this.loadDefaultWindData().then(data => {
      if (data) {
        // 设置风场数据
        this.windObj!.setData(data);
        // 启用风场图
        this.windObj!.enable().then(success => {
          if (success) {
            logger.debug('风场图已成功启用');
            // 触发状态变化回调
            this.triggerToolStateChange('wind-layer', true, 'layer');
          } else {
            logger.warn('风场图启用失败');
            // 通知失败
            this.triggerToolStateChange('wind-layer', false, 'layer', {
              error: '风场图启用失败'
            });
          }
        });
      } else {
        logger.warn('加载风场数据失败');
        // 通知失败
        this.triggerToolStateChange('wind-layer', false, 'layer', {
          error: '加载风场数据失败'
        });
      }
    });
  }

  /**
   * 处理风场图停用
   */
  private handleWindLayerDeactivate(): void {
    if (!this.windObj) {
      logger.warn('风场图对象不存在，无法停用风场图');
      return;
    }
    
    // 停用风场图
    this.windObj.disable();
    logger.debug('风场图已停用');
    
    // 触发事件
    this.triggerToolStateChange('wind-layer', false, 'layer');
  }

  /**
   * 加载默认风场数据
   * @returns 返回风场数据Promise
   */
  //@ts-ignore
  private async loadDefaultWindData(): Promise<WindData | null> {
    try {
      const response = await fetch('https://blog.sakitam.com/wind-layer/data/wind.json');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      logger.debug('默认风场数据加载成功');
      return data;
    } catch (error) {
      logger.error('加载默认风场数据失败:', error);
      return null;
    }
  }

  /**
   * 设置指定工具的激活状态
   */
  public setToolActive(toolId: string, active: boolean): void {
    const tool = this.tools.find(t => t.id === toolId);
    if (tool) {
      tool.active = active;
      if (active) {
        this.activeToolId = toolId;
      } else if (this.activeToolId === toolId) {
        this.activeToolId = null;
      }
      // 触发工具状态变化回调
      if (this.toolStateChangeCallback) {
        this.toolStateChangeCallback(toolId, active, tool.type, {});
      }
    }
  }

  /**
   * 处理区划边界工具激活
   */
  private handleBoundaryActivate(): void {
    if (!this.boundaryObj) {
      logger.warn('区划边界对象未初始化');
      return;
    }
    // 只负责显示区划图层，不再加载本地数据
    this.boundaryObj.setVisible(true);
    // 触发工具状态变更事件
    this.triggerToolStateChange('boundary', true, 'toggle');
    // 额外发送显示区划面板信号
    this.triggerToolStateChange('boundary-panel-visible', true, 'panel', {
      source: 'boundary-click',
      forced: true
    });
    logger.debug('区划边界工具已激活');
  }
  
  /**
   * 处理区划边界工具停用
   */
  private handleBoundaryDeactivate(): void {
    if (!this.boundaryObj) {
      logger.warn('区划边界对象未初始化');
      return;
    }
    
    // 设置图层不可见
    this.boundaryObj.setVisible(false);
    
    // 触发工具状态变更事件
    this.triggerToolStateChange('boundary', false, 'toggle');
    
    logger.debug('区划边界工具已停用');
  }
  
  /**
   * 获取区划边界对象
   */
  public getBoundaryObject(): BoundaryObject | null {
    return this.boundaryObj;
  }
}