/**
 * 工具栏对象
 * @description 处理地图工具栏的显示和交互
 */
import type { ToolbarConfig, ToolItem, ToolbarPosition, ToolbarDirection } from '../types/toolbar';
import { DEFAULT_TOOLBAR_CONFIG } from '../types/toolbar';
import { Map as OlMap } from 'ol';
import type { MapObject } from './MapObject';
import logger from './LogObject';

export class ToolbarObject {
  private config: ToolbarConfig;
  private mapObj: MapObject;
  private tools: ToolItem[] = [];
  private activeToolId: string | null = null;

  /**
   * 构造函数
   * @param config 工具栏配置
   * @param mapObj 地图对象
   */
  constructor(config: ToolbarConfig | undefined, mapObj: MapObject) {
    this.config = config || DEFAULT_TOOLBAR_CONFIG;
    this.mapObj = mapObj;
    this.tools = [...(this.config.items || [])];
    logger.debug('工具栏初始化完成，工具数量:', this.tools.length);
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
    
    if (tool && (tool.type === 'toggle' || tool.type === 'button')) {
      // 如果之前有激活的工具，先停用它
      if (this.activeToolId) {
        this.deactivateTool(this.activeToolId);
      }
      
      tool.active = true;
      this.activeToolId = toolId;
      
      // 执行工具激活后的操作
      this.handleToolActivation(tool);
    }
  }

  /**
   * 停用工具
   * @param toolId 工具ID
   */
  deactivateTool(toolId: string): void {
    const tool = this.tools.find(tool => tool.id === toolId);
    
    if (tool && (tool.type === 'toggle' || tool.type === 'button')) {
      tool.active = false;
      
      // 执行工具停用后的操作
      this.handleToolDeactivation(tool);
      
      // 如果停用的是当前激活的工具，清除激活状态
      if (this.activeToolId === toolId) {
        this.activeToolId = null;
      }
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
        // 实现测量功能
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
        // 停止测量
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
    
    // 如果是切换类型，切换激活状态
    if (tool.type === 'toggle') {
      if (tool.active) {
        this.deactivateTool(toolId);
      } else {
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
    const tool = this.tools.find(tool => tool.id === toolId);
    
    if (!tool || tool.disabled) {
      return;
    }
    
    // 如果是切换类型，切换激活状态
    if (tool.type === 'toggle') {
      if (tool.active) {
        this.deactivateTool(toolId);
      } else {
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
   * 处理清除要素
   */
  private handleClearFeatures(): void {
    if (this.mapObj && this.mapObj.getMapInstance()) {
      // 清除所有矢量要素的逻辑
      const map = this.mapObj.getMapInstance();
      // 实现清除要素的逻辑，具体实现取决于应用需求
      logger.info('清除地图要素');
    }
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
    
    // 清空工具列表
    this.tools = [];
    this.activeToolId = null;
  }
}
