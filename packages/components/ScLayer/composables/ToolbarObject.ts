/**
 * 工具栏对象
 * @description 处理地图工具栏的显示和交互
 */
import type { ToolbarConfig, ToolItem, ToolbarPosition, ToolbarDirection } from '../types/toolbar';
import { DEFAULT_TOOLBAR_CONFIG } from '../types/toolbar';
import { Map as OlMap } from 'ol';
import type { MapObject } from './MapObject';
import logger from './LogObject';
import { CoordinateObject, CoordinateInfo, CoordinateOptions, CoordinatePosition } from './CoordinateObject';
import { MeasureObject, MeasureType } from './MeasureObject';
import { OverviewMapObject, OverviewMapOptions } from './OverviewMapObject';
import { MarkerObject } from './MarkerObject';
import { ShapeObject, ShapeType } from './ShapeObject';

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
    const mapInstance = this.mapObj.getMapInstance();
    if (!mapInstance) {
      logger.warn('[Overview] 地图实例不存在，无法初始化鹰眼对象');
      return;
    }
    
    // 获取地图配置
    const configObj = this.mapObj.getConfigObject();
    const mapType = configObj.getMapType();
    const mapTile = configObj.getMapTile();
    const mapConfig = configObj.getMapConfig();
    // 获取地图API密钥配置对象
    const mapKeys: Record<string, string> = {};
    mapKeys[mapType] = configObj.getMapKey(mapType);
    
    // 创建鹰眼对象
    this.overviewMapObj = new OverviewMapObject(
      mapInstance,
      {
        collapsed: true,
        rotateWithView: false
      },
      mapType,
      mapTile,
      mapConfig,
      mapKeys
    );
    
    logger.debug('[Overview] 鹰眼对象初始化成功');
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
    
    logger.debug(`正在停用工具 ${toolId}`);
    
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
        this.handleClearFeatures();
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
            this.triggerToolStateChange(tool.id, false, 'button', { count });
            logger.debug(`隐藏了 ${count} 个标记点`);
          } else {
            // 如果全部隐藏，则全部显示
            const count = this.markerObj.showAllMarkers();
            this.triggerToolStateChange(tool.id, true, 'button', { count });
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
            this.triggerToolStateChange(tool.id, false, 'button', { count });
            logger.debug(`隐藏了所有标记点的标签（popover），共 ${count} 个`);
          } else {
            // 如果当前没有显示的popover，显示所有
            const count = this.markerObj.showAllLabels(); // 这个方法现在会显示所有popover
            this.triggerToolStateChange(tool.id, true, 'button', { count });
            logger.debug(`显示了所有标记点的标签（popover），共 ${count} 个`);
          }
        }
        break;
      case 'popover-toggle':
        this.handleButtonActivation(tool);
        // 隐藏所有popover
        if (this.markerObj) {
          const count = this.markerObj.hideAllPopovers();
          this.triggerToolStateChange(tool.id, false, 'button', { count });
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
   * 处理工具停用
   * @param tool 工具
   */
  private handleToolDeactivation(tool: ToolItem): void {
    logger.debug(`处理工具停用: ${tool.id}, 类型: ${tool.type}`);
    
    // 坐标工具的特殊处理
    if (tool.id === 'coordinate' && this.coordinateObj) {
      // 隐藏坐标面板
      this.showCoordinatePanel = false;
      
      // 禁用坐标功能
      this.coordinateObj.disable();
      
      logger.debug('坐标工具已停用，面板已隐藏');
      return;
    }
    
    // 测距工具的特殊处理
    if (tool.id === 'measure' && this.measureObj) {
      // 禁用测距功能
      this.measureObj.disable();
      
      logger.debug('测距工具已停用');
      return;
    }
    
    // 鹰眼工具的特殊处理
    if (tool.id === 'overview' && this.overviewMapObj) {
      // 禁用鹰眼功能
      this.overviewMapObj.disable();
      
      logger.debug('[Overview] 鹰眼工具已停用');
      return;
    }
    
    // 绘制工具停用
    if ((tool.id === 'draw-rectangle' || tool.id === 'draw-circle' || 
         tool.id === 'draw-polygon' || tool.id === 'draw-line') && 
        this.shapeObj && this.shapeObj.isEnabled()) {
      this.shapeObj.disable();
      logger.debug(`[Shape] 绘制工具 ${tool.id} 已停用`);
      return;
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
      
      // 实现清除其他要素的逻辑，具体实现取决于应用需求
      logger.info('清除地图要素');
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
    if (!this.overviewMapObj) {
      logger.warn('[Overview] 鹰眼对象不存在，无法启用鹰眼功能');
      return;
    }
    
    try {
      // 停用现有鹰眼控件，确保重新初始化
      this.overviewMapObj.disable();
      
      // 确保地图实例是最新的
      if (this.mapObj && this.mapObj.getMapInstance()) {
        this.overviewMapObj.setMapInstance(this.mapObj.getMapInstance());
      }
      
      // 强制重新初始化并启用鹰眼功能
      logger.debug('[Overview] 正在强制重新初始化并启用鹰眼功能...');
      this.overviewMapObj.enable(true);
      
      // 延迟200ms再次确保展开状态
      setTimeout(() => {
        try {
          if (this.overviewMapObj) {
            logger.debug('[Overview] 延迟操作：确保鹰眼控件为展开状态');
            this.overviewMapObj.setCollapsed(false);
            
            // 手动触发状态变化通知
            if (this.toolStateChangeCallback) {
              this.toolStateChangeCallback('overview-map-expanded', true, 'control', {
                source: 'overview-activate',
                expanded: true,
                delayed: true
              });
            }
          }
        } catch (error) {
          logger.error('[Overview] 延迟展开鹰眼控件失败:', error);
        }
      }, 200);
      
      // 手动触发状态变化通知
      if (this.toolStateChangeCallback) {
        this.toolStateChangeCallback('overview-map-enabled', true, 'control', {
          source: 'overview-activate',
          expanded: true
        });
      }
      
      logger.info('[Overview] 鹰眼功能已启用并展开');
    } catch (error) {
      logger.error('[Overview] 启用鹰眼功能失败:', error);
    }
  }
  
  /**
   * 处理鹰眼工具停用
   */
  private handleOverviewMapDeactivate(): void {
    if (!this.overviewMapObj) return;
    
    // 禁用鹰眼功能
    this.overviewMapObj.disable();
    logger.debug('[Overview] 鹰眼功能已禁用');
  }

  /**
   * 销毁工具栏对象
   */
  destroy(): void {
    logger.debug('销毁工具栏对象');
    
    // 停用所有激活的工具（包括子菜单项）
    const deactivateTools = (items: ToolItem[]) => {
      items.forEach(tool => {
        if (tool.active) {
          // 停用当前工具
          tool.active = false;
          logger.debug(`销毁过程中停用工具: ${tool.id}`);
          
          // 触发工具状态变化回调 - 停用
          this.triggerToolStateChange(tool.id, false, tool.type, {
            multi: tool.multi,
            hasChildren: Boolean(tool.children && tool.children.length > 0)
          });
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
    
    // 销毁鹰眼对象
    if (this.overviewMapObj) {
      this.overviewMapObj.destroy();
      this.overviewMapObj = null;
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
}
