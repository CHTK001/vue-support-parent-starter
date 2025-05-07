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
  // 坐标面板是否显示
  private showCoordinatePanel: boolean = false;
  // 坐标信息回调
  private coordinateCallback: ((coordinate: CoordinateInfo) => void) | null = null;

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
      logger.warn('地图实例不存在，无法初始化鹰眼对象');
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
    
    logger.debug('鹰眼对象初始化成功');
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
   * 激活工具
   * @param toolId 工具ID
   */
  activateTool(toolId: string): void {
    const tool = this.tools.find(tool => tool.id === toolId);
    
    if (!tool || (tool.type !== 'toggle' && tool.type !== 'button')) {
      logger.debug(`无法激活工具 ${toolId}: 工具不存在或类型不支持`);
      return;
    }

    logger.debug(`正在激活工具 ${toolId}, 多选模式: ${tool.multi ? '是' : '否'}`);

    // 多选模式：如果工具不支持多选，先停用之前激活的其他工具
    if (!tool.multi) {
      // 获取当前已激活的工具列表(排除当前工具)
      const activeTools = this.tools.filter(t => 
        t.active && t.id !== toolId && !t.multi
      );
      
      if (activeTools.length > 0) {
        logger.debug(`需要停用其他工具: ${activeTools.map(t => t.id).join(', ')}`);
      }
      
      // 记录是否有测距工具被停用
      const measureToolDeactivated = activeTools.some(t => t.id === 'measure');
      
      // 停用其他不支持多选的工具
      activeTools.forEach(activeTool => {
        this.deactivateTool(activeTool.id);
      });
      
      // 如果激活的不是测距工具，并且之前测距工具被停用，确保测距数据被清除
      if (toolId !== 'measure' && measureToolDeactivated && this.measureObj) {
        // 确保测距数据被彻底清除
        this.measureObj.clear();
        logger.debug('激活其他工具，测距数据已清除');
      }
    } else if (tool.multi && toolId !== 'measure' && this.measureObj) {
      // 如果是多选工具但不是测距工具，检查测距工具状态
      const measureTool = this.tools.find(t => t.id === 'measure');
      if (measureTool && !measureTool.active) {
        // 确保测距数据被清除
        this.measureObj.clear();
      }
    }
    
    // 激活当前工具
    tool.active = true;
    logger.debug(`工具 ${toolId} 已设置为激活状态`);
    
    // 仅当工具不支持多选时，设置为当前激活工具
    if (!tool.multi) {
      this.activeToolId = toolId;
      logger.debug(`设置当前激活工具ID为 ${toolId}`);
    }
    
    // 执行工具激活后的操作
    this.handleToolActivation(tool);
  }

  /**
   * 停用工具
   * @param toolId 工具ID
   */
  deactivateTool(toolId: string): void {
    const tool = this.tools.find(tool => tool.id === toolId);
    
    if (!tool || (tool.type !== 'toggle' && tool.type !== 'button')) {
      logger.debug(`无法停用工具 ${toolId}: 工具不存在或类型不支持`);
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
  }

  /**
   * 处理工具激活
   * @param tool 工具项
   */
  private handleToolActivation(tool: ToolItem): void {
    // 根据工具类型执行不同的操作
    switch (tool.id) {
      case 'zoom-in':
        this.handleZoomIn();
        break;
      case 'zoom-out':
        this.handleZoomOut();
        break;
      case 'full-extent':
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
      case 'draw':
        // 实现绘制功能
        break;
      case 'clear':
        this.handleClearFeatures();
        break;
      default:
        logger.info(`工具 ${tool.id} 已激活`);
    }
  }

  /**
   * 处理工具停用
   * @param tool 工具项
   */
  private handleToolDeactivation(tool: ToolItem): void {
    // 根据工具类型执行不同的操作
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
      case 'draw':
        // 停止绘制
        break;
      default:
        logger.info(`工具 ${tool.id} 已停用`);
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
    
    // 如果是切换类型，始终切换状态
    if (tool.type === 'toggle') {
      // 总是切换状态，不检查当前状态
      const currentActive = !!tool.active;
      if (currentActive) {
        logger.debug(`工具 ${toolId} 将被停用`);
        this.deactivateTool(toolId);
      } else {
        logger.debug(`工具 ${toolId} 将被激活`);
        this.activateTool(toolId);
      }
    } else {
      // 如果是普通工具，直接执行操作
      this.handleToolActivation(tool);
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
    
    // 如果是切换类型，始终切换状态
    if (tool.type === 'toggle') {
      // 总是切换状态，不检查当前状态
      const currentActive = !!tool.active;
      if (currentActive) {
        logger.debug(`子菜单项 ${toolId} 将被停用`);
        this.deactivateTool(toolId);
      } else {
        logger.debug(`子菜单项 ${toolId} 将被激活`);
        this.activateTool(toolId);
      }
    } else {
      // 如果是普通工具，直接执行操作
      this.handleToolActivation(tool);
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
    
    // 显示坐标面板
    this.showCoordinatePanel = true;
    
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
      logger.warn('鹰眼对象不存在，无法启用鹰眼功能');
      return;
    }
    
    // 启用鹰眼功能
    this.overviewMapObj.enable();
    logger.debug('鹰眼功能已启用');
  }
  
  /**
   * 处理鹰眼工具停用
   */
  private handleOverviewMapDeactivate(): void {
    if (!this.overviewMapObj) return;
    
    // 禁用鹰眼功能
    this.overviewMapObj.disable();
    logger.debug('鹰眼功能已禁用');
  }

  /**
   * 销毁工具栏对象
   */
  destroy(): void {
    logger.debug('销毁工具栏对象');
    // 停用所有激活的工具
    if (this.activeToolId) {
      this.deactivateTool(this.activeToolId);
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
    
    // 清空工具列表
    this.tools = [];
    this.activeToolId = null;
  }
}
