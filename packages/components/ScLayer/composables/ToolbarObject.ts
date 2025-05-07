/**
 * 工具栏对象
 * @description 处理地图工具栏的显示和交互
 */
import type { ToolbarConfig, ToolItem, ToolbarPosition, ToolbarDirection } from '../types/toolbar';
import { Map as OlMap } from 'ol';

export class ToolbarObject {
  private toolbarConfig: ToolbarConfig;
  private mapInstance: OlMap | null = null;
  private activeTool: string | null = null;
  private toolHandlers: Map<string, Function> = new Map();

  /**
   * 构造函数
   * @param config 工具栏配置
   */
  constructor(config: ToolbarConfig = {}) {
    // 默认工具栏配置
    const defaultConfig: ToolbarConfig = {
      position: 'top-right',
      direction: 'vertical',
      itemsPerLine: 5,
      size: 36,
      items: [],
      buttons: {
        measure: true,
        drawPoint: true,
        coordinate: true,
        zoomIn: true,
        zoomOut: true,
        fullView: true,
        layerSwitch: true,
        toggleMarkers: true
      }
    };

    // 合并配置
    this.toolbarConfig = {
      ...defaultConfig,
      ...config
    };

    // 确保items数组存在
    if (!this.toolbarConfig.items) {
      this.toolbarConfig.items = [];
    }

    // 初始化默认工具项
    this.initDefaultTools();
  }

  /**
   * 初始化地图工具栏
   * @param map 地图实例
   */
  public init(map: OlMap): void {
    this.mapInstance = map;
    
    // 注册工具处理函数
    this.registerToolHandlers();
  }

  /**
   * 初始化默认工具项
   */
  private initDefaultTools(): void {
    // 只有在buttons配置中启用的工具才会被添加
    if (!this.toolbarConfig.buttons) return;
    
    const buttons = this.toolbarConfig.buttons;
    const defaultTools: ToolItem[] = [];
    
    // 添加缩放工具
    if (buttons.zoomIn) {
      defaultTools.push({
        id: 'zoom-in',
        name: '放大',
        icon: 'icon-zoom-in',
        tooltip: '放大地图',
        active: false
      });
    }
    
    if (buttons.zoomOut) {
      defaultTools.push({
        id: 'zoom-out',
        name: '缩小',
        icon: 'icon-zoom-out',
        tooltip: '缩小地图',
        active: false
      });
    }
    
    // 添加测量工具
    if (buttons.measure) {
      defaultTools.push({
        id: 'measure',
        name: '测量',
        icon: 'icon-ruler',
        tooltip: '测量距离',
        active: false
      });
    }
    
    // 添加绘制点工具
    if (buttons.drawPoint) {
      defaultTools.push({
        id: 'draw-point',
        name: '绘制点',
        icon: 'icon-marker',
        tooltip: '在地图上添加标记点',
        active: false
      });
    }
    
    // 添加坐标查看工具
    if (buttons.coordinate) {
      defaultTools.push({
        id: 'coordinate',
        name: '坐标',
        icon: 'icon-coordinate',
        tooltip: '查看地图坐标',
        active: false,
        multi: true
      });
    }
    
    // 添加全图查看工具
    if (buttons.fullView) {
      defaultTools.push({
        id: 'full-view',
        name: '全图',
        icon: 'icon-full-view',
        tooltip: '查看全图',
        active: false
      });
    }
    
    // 添加图层切换工具
    if (buttons.layerSwitch) {
      defaultTools.push({
        id: 'layer-switch',
        name: '图层切换',
        icon: 'icon-layers',
        tooltip: '切换地图图层',
        active: false,
        type: 'menu',
        children: [
          {
            id: 'normal-layer',
            name: '标准图层',
            icon: 'icon-normal-layer',
            tooltip: '切换到标准图层',
            active: false
          },
          {
            id: 'satellite-layer',
            name: '卫星图层',
            icon: 'icon-satellite-layer',
            tooltip: '切换到卫星图层',
            active: false
          }
        ]
      });
    }
    
    // 添加标记显示/隐藏工具
    if (buttons.toggleMarkers) {
      defaultTools.push({
        id: 'toggle-markers',
        name: '标记显示',
        icon: 'icon-eye',
        alternateIcon: 'icon-eye-off',
        tooltip: '显示/隐藏标记点',
        active: false,
        toggleState: false
      });
    }
    
    // 将默认工具添加到配置中
    this.toolbarConfig.items = [
      ...defaultTools,
      ...(this.toolbarConfig.items || [])
    ];
  }

  /**
   * 注册工具处理函数
   */
  private registerToolHandlers(): void {
    if (!this.mapInstance) return;
    
    // 注册放大工具
    this.toolHandlers.set('zoom-in', () => {
      if (!this.mapInstance) return;
      
      const view = this.mapInstance.getView();
      const currentZoom = view.getZoom() || 0;
      view.animate({
        zoom: currentZoom + 1,
        duration: 250
      });
    });
    
    // 注册缩小工具
    this.toolHandlers.set('zoom-out', () => {
      if (!this.mapInstance) return;
      
      const view = this.mapInstance.getView();
      const currentZoom = view.getZoom() || 0;
      view.animate({
        zoom: Math.max(currentZoom - 1, 0),
        duration: 250
      });
    });
    
    // 注册全图查看工具
    this.toolHandlers.set('full-view', () => {
      if (!this.mapInstance) return;
      
      // 此处需要根据地图的初始配置设置适当的视图范围
      // 这里假设地图有一个初始视图
      const view = this.mapInstance.getView();
      view.setZoom(5);
      // 还可以设置初始中心点等
    });
    
    // 其他工具的处理函数可以按需添加
  }

  /**
   * 获取工具栏配置
   * @returns 工具栏配置
   */
  public getToolbarConfig(): ToolbarConfig {
    return this.toolbarConfig;
  }

  /**
   * 获取工具栏位置类名
   * @returns 工具栏位置类名
   */
  public getPositionClass(): string {
    return `toolbar-${this.toolbarConfig.position || 'top-right'}`;
  }

  /**
   * 设置活动工具
   * @param toolId 工具ID
   */
  public setActiveTool(toolId: string): void {
    if (this.activeTool === toolId) {
      this.activeTool = null;
    } else {
      this.activeTool = toolId;
    }
    
    // 执行工具处理函数
    const handler = this.toolHandlers.get(toolId);
    if (handler) {
      handler();
    }
  }

  /**
   * 获取活动工具ID
   * @returns 活动工具ID
   */
  public getActiveTool(): string | null {
    return this.activeTool;
  }

  /**
   * 获取工具栏项目
   * @returns 工具栏项目
   */
  public getToolbarItems(): ToolItem[] {
    return this.toolbarConfig.items || [];
  }

  /**
   * 添加自定义工具
   * @param tool 工具项
   */
  public addTool(tool: ToolItem): void {
    if (!this.toolbarConfig.items) {
      this.toolbarConfig.items = [];
    }
    this.toolbarConfig.items.push(tool);
  }

  /**
   * 移除工具
   * @param toolId 工具ID
   * @returns 是否成功移除
   */
  public removeTool(toolId: string): boolean {
    if (!this.toolbarConfig.items) return false;
    
    const index = this.toolbarConfig.items.findIndex(item => item.id === toolId);
    if (index === -1) return false;
    
    this.toolbarConfig.items.splice(index, 1);
    return true;
  }
  
  /**
   * 处理工具点击事件
   * @param tool 被点击的工具
   */
  public handleToolClick(tool: ToolItem): void {
    // 如果工具有自定义处理函数，则调用
    if (tool.handler) {
      tool.handler();
      return;
    }
    
    // 否则使用默认处理
    this.setActiveTool(tool.id);
  }

  /**
   * 销毁资源
   */
  public destroy(): void {
    this.mapInstance = null;
    this.toolHandlers.clear();
  }
}
