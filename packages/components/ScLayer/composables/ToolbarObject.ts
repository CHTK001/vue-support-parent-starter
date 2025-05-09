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
import { AggregationOptions } from '../types/cluster';
import { DataType } from '../types';
import { LineString, Polygon, Circle } from 'ol/geom';
import { ShapeOption, Shape } from '../types/shape';
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

  /**
   * 构造函数
   * @param config 工具栏配置
   * @param mapObj 地图对象
   */
  constructor(config: ToolbarConfig | undefined, mapObj: MapObject) {
    this.config = config || DEFAULT_TOOLBAR_CONFIG;
    this.mapObj = mapObj;
    this.tools = [...(this.config.items || [])];
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
          const center = (geometry as Circle).getCenter();
          const radius = (geometry as Circle).getRadius();
          // 转换中心点为经纬度坐标
          const centerLonLat = toLonLat(center);
          shapeOption = {
            type: Shape.CIRCLE,
            center: centerLonLat,
            radius: radius,
            dataType: DataType.SHAPE,
            id
          };
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
   * 获取工具栏配置
   * @returns 工具栏配置
   */
  getConfig(): ToolbarConfig {
    return this.config;
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

    // 如果是绘制工具，检查删除工具是否激活
    if (isDrawingTool) {
      const deleteToolActive = this.tools.find(t => t.id === 'clear-shapes')?.active;
      if (deleteToolActive) {
        // 先停用删除工具
        logger.debug(`绘制工具 ${toolId} 激活，需要先停用删除工具`);
        this.deactivateTool('clear-shapes');
      }
    }
    
    // 如果是删除工具，检查所有绘制工具是否有激活的
    if (isDeleteTool) {
      drawingTools.forEach(drawToolId => {
        const drawTool = this.tools.find(t => t.id === drawToolId);
        if (drawTool && drawTool.active) {
          // 先停用绘制工具
          logger.debug(`删除工具激活，需要先停用绘制工具 ${drawToolId}`);
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
   * @param tool 工具
   */
  private handleToolActivation(tool: ToolItem): void {
    if (!tool || !tool.id) return;
    
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
        this.activateDeleteMode();
        break;
      case 'cluster':
        this.handleClusterActivate();
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
   * @param tool 工具
   */
  private handleToolDeactivation(tool: ToolItem): void {
    if (!tool || !tool.id) return;
    
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
      case 'cluster':
        this.disableCluster();
        break;
      case 'clear-shapes':
        // 停用删除模式
        this.deactivateDeleteMode();
        break;
      case 'draw-rectangle':
      case 'draw-circle':
      case 'draw-polygon':
      case 'draw-line':
      case 'draw-square':
        // 停用图形绘制工具
        if (this.shapeObj) {
          this.shapeObj.disable();
          logger.debug(`已停用 ${tool.id} 绘制工具`);
        }
        break;
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
      // 发送工具状态变化通知
      this.toolStateChangeCallback('overview', true, 'toggle');
      this.toolStateChangeCallback('overview-map-expanded', true, 'control', {
        source: 'overview-activate',
        expanded: true,
        forced: true
      });
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
      this.shapeObj.destroy();
      this.shapeObj = null;
    }
    
    // 移除工具状态变化回调
    this.removeToolStateChangeCallback();
    
    // 清空工具列表
    this.tools = [];
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
   * 激活删除模式
   * 允许用户点击图形或标记点来删除特定元素
   */
  private activateDeleteMode(): void {
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) return;
    
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
    
    // 修改鼠标指针样式，指示当前处于删除模式
    if (mapInstance.getTargetElement()) {
      mapInstance.getTargetElement().style.cursor = 'pointer';
    }
    
    // 创建一个点击监听器，用于处理删除操作
    const deleteClickListener = (evt: any) => {
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
            if(data.dataType === DataType.SHAPE){
              logger.debug(`发现图形: ${id}`);
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
    
    // 保存监听器引用，以便后续可以移除
    (mapInstance as any)._deleteClickListener = mapInstance.on('click', deleteClickListener);
    
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
    
    // 恢复鼠标指针样式
    if (mapInstance.getTargetElement()) {
      mapInstance.getTargetElement().style.cursor = '';
    }
    
    // 移除点击监听器
    if ((mapInstance as any)._deleteClickListener) {
      mapInstance.un('click', (mapInstance as any)._deleteClickListener);
      delete (mapInstance as any)._deleteClickListener;
    }
    
    logger.info('已停用删除模式');
    
    // 修改命令提示
    if (this.toolStateChangeCallback) {
      this.toolStateChangeCallback('delete-mode', false, 'mode', {
        message: '已退出删除模式'
      });
    }
  }
}
