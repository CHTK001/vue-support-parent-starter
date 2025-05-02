import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import { info, warn, error } from "@repo/utils";
import * as echarts from 'echarts/core';
import { ScatterChart, LinesChart, EffectScatterChart } from 'echarts/charts';
import { GridComponent, TitleComponent, LegendComponent, TooltipComponent, GeoComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { LeafletComponent } from '@joakimono/echarts-extension-leaflet/src/export';
import type { MigrationBase, MigrationEventType, MigrationEventListener, MigrationPoint } from './MigrationBase';

// 注册必要的组件
echarts.use([
  ScatterChart,
  LinesChart,
  EffectScatterChart,
  GridComponent,
  TitleComponent,
  LegendComponent,
  TooltipComponent,
  GeoComponent,
  CanvasRenderer,
  LeafletComponent
]);

/**
 * 迁徙图选项接口
 */
export interface MigrationOptions {
  // 线样式配置
  lineStyle?: {
    color?: string;         // 线条颜色
    width?: number;        // 线宽
    opacity?: number;       // 不透明度
    curveness?: number;     // 曲线度
    type?: string;          // 线条类型
  };
  // 效果配置
  effect?: {
    show?: boolean;         // 是否显示效果
    period?: number;        // 动画周期
    trailLength?: number;   // 拖尾长度
    symbol?: string;        // 符号
    symbolSize?: number;    // 符号大小
    color?: string;         // 效果颜色
    constantSpeed?: number; // 恒定速度
  };
  // 标签配置
  label?: {
    show?: boolean;         // 是否显示标签
    position?: string;      // 标签位置
    color?: string;         // 标签颜色
    fontSize?: number;      // 字体大小
  };
  // 其他配置
  autoStart?: boolean;      // 是否自动开始动画
  loop?: boolean;           // 是否循环播放
  hideAfterCompletion?: boolean; // 动画结束后是否隐藏线条
}

/**
 * 基于ECharts的迁徙图插件类
 */
export class EchartsMigration implements MigrationBase {
  private map: LeafletMap;
  private enabled: boolean = false;
  private options: MigrationOptions;
  private data: MigrationPoint[] = [];
  private eventListeners: Map<MigrationEventType, Set<MigrationEventListener>> = new Map();
  private isAnimating: boolean = false;
  private leafletDiv: HTMLElement | null = null;
  private container: HTMLDivElement;
  private chart: echarts.ECharts | null = null;
  private lmapComponent: any = null;
  private lmap: L.Map | null = null;

  /**
   * 构造函数
   * @param map Leaflet地图对象
   * @param options 迁徙图配置选项
   */
  constructor(map: LeafletMap, options: any = {}) {
    this.map = map;
    
    // 默认选项
    const defaultOptions = {
      lineStyle: {
        color: 'rgba(41, 128, 185, 0.8)',
        width: 2,
        opacity: 0.8,
        curveness: 0.2,
        type: 'solid'
      },
      effect: {
        show: true,
        period: 5,
        trailLength: 0.5,
        symbol: 'circle',
        symbolSize: 5,
        color: '#fff',
        constantSpeed: 50
      },
      label: {
        show: true,
        position: 'right',
        color: '#fff',
        fontSize: 10
      },
      autoStart: false,
      loop: true,
      hideAfterCompletion: false
    };
    
    // 合并选项
    this.options = this.mergeOptions(defaultOptions, options);
    
    // 创建ECharts容器
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '650';
    
    // 获取Leaflet容器
    this.leafletDiv = this.map.getContainer();
    
    // 初始化事件监听器Map
    ['migration-completed', 'migration-started', 'migration-data-updated'].forEach(eventType => {
      this.eventListeners.set(eventType as MigrationEventType, new Set());
    });
  }

  /**
   * 合并选项
   * @param defaultOptions 默认选项
   * @param userOptions 用户自定义选项
   * @returns 合并后的选项
   */
  private mergeOptions(defaultOptions: any, userOptions: any): any {
    const merged = { ...defaultOptions };

    // 递归合并对象
    for (const key in userOptions) {
      if (typeof userOptions[key] === 'object' && userOptions[key] !== null) {
        merged[key] = this.mergeOptions(merged[key] || {}, userOptions[key]);
      } else if (userOptions[key] !== undefined) {
        merged[key] = userOptions[key];
      }
    }

    return merged;
  }

  /**
   * 初始化ECharts图表
   */
  private initECharts() {
    try {
      // 确保容器存在且已添加到地图中
      if (!this.container || !this.leafletDiv) {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '650';
        
        // 获取Leaflet地图容器
        this.leafletDiv = this.map.getContainer();
        
        // 确保Leaflet地图容器存在且有定位属性
        if (this.leafletDiv) {
          if (getComputedStyle(this.leafletDiv).position === 'static') {
            this.leafletDiv.style.position = 'relative';
          }
          
          // 将echarts容器添加到Leaflet容器中
          this.leafletDiv.appendChild(this.container);
        } else {
          error('无法获取Leaflet地图容器');
          return false;
        }
      }
      
      // 创建ECharts实例
      this.chart = echarts.init(this.container);
      
      // 更新图表选项
      this.updateChartOption();
      
      return true;
    } catch (e) {
      error('初始化ECharts实例失败:', e);
      return false;
    }
  }

  /**
   * 更新ECharts配置选项
   */
  private updateChartOption() {
    if (!this.chart) return;

    try {
      const series = [];
      const scatterData = [];
      const linesData = [];
      
      // 转换迁徙数据为ECharts格式
      this.data.forEach(point => {
        const { from, to, labels, color, weight } = point;
        
        // 起点和终点信息
        const fromName = labels?.from || '';
        const toName = labels?.to || '';
        
        // 添加迁徙线
        linesData.push({
          coords: [from, to],
          lineStyle: {
            color: color || this.options.lineStyle.color,
            width: weight || this.options.lineStyle.width,
            opacity: this.options.lineStyle.opacity,
            curveness: this.options.lineStyle.curveness
          }
        });
        
        // 添加起点和终点标记
        scatterData.push({
          name: fromName,
          value: [...from, fromName],
          itemStyle: {
            color: color || this.options.lineStyle.color
          }
        });
        
        scatterData.push({
          name: toName,
          value: [...to, toName],
          itemStyle: {
            color: color || this.options.lineStyle.color
          }
        });
      });
      
      // 添加起点和终点的散点图
      if (this.options.label.show) {
        series.push({
          type: 'scatter',
          coordinateSystem: 'lmap',
          symbol: 'circle',
          symbolSize: 6,
          label: {
            show: this.options.label.show,
            position: this.options.label.position,
            formatter: '{b}',
            fontSize: this.options.label.fontSize,
            color: this.options.label.color
          },
          itemStyle: {
            color: this.options.lineStyle.color,
            opacity: 0.8
          },
          data: scatterData
        });
      }
      
      // 添加迁徙线
      series.push({
        type: 'lines',
        coordinateSystem: 'lmap',
        effect: {
          show: this.options.effect.show,
          period: this.options.effect.period,
          trailLength: this.options.effect.trailLength,
          symbol: this.options.effect.symbol,
          symbolSize: this.options.effect.symbolSize,
          color: this.options.effect.color,
          constantSpeed: this.options.effect.constantSpeed
        },
        lineStyle: {
          color: this.options.lineStyle.color,
          width: this.options.lineStyle.width,
          opacity: this.options.lineStyle.opacity,
          curveness: this.options.lineStyle.curveness,
          type: this.options.lineStyle.type
        },
        data: linesData
      });
      
      // 设置ECharts配置
      const option = {
        lmap: {
          center: this.map.getCenter ? [this.map.getCenter().lng, this.map.getCenter().lat] : [0, 0],
          zoom: this.map.getZoom ? this.map.getZoom() : 1,
          roam: true,
          renderOnMoving: true,
          echartsLayerInteractive: false
        },
        series: series
      };
      
      // 设置ECharts选项
      this.chart.setOption(option, true);
      
      // 获取Leaflet实例以便后续使用
      if (!this.lmap) {
        try {
          // 使用any类型临时转换来访问私有方法
          const chartAny = this.chart as any;
          this.lmapComponent = chartAny.getModel().getComponent('lmap');
          if (this.lmapComponent) {
            this.lmap = this.lmapComponent.getLeaflet();
          }
        } catch (e) {
          error('获取Leaflet实例失败:', e);
        }
      }
      
      this.isAnimating = true;
      
      // 触发数据更新事件
      this.emit('migration-data-updated', { count: this.data.length });
      
      return true;
    } catch (e) {
      error('更新ECharts迁徙图选项失败:', e);
      return false;
    }
  }

  /**
   * 启用飞线图
   */
  public enable(): boolean {
    if (this.enabled) return true;
    
    try {
      info('正在启用ECharts飞线图...');
      
      // 检查地图对象是否有效
      if (!this.map) {
        error('地图对象无效，无法启用飞线图');
        return false;
      }
      
      // 创建并初始化容器
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '650';
      }
      
      // 获取Leaflet地图容器
      if (!this.leafletDiv) {
        this.leafletDiv = this.map.getContainer();
        
        if (!this.leafletDiv) {
          error('无法获取Leaflet地图容器');
          return false;
        }
        
        // 确保Leaflet地图容器有正确的定位
        if (getComputedStyle(this.leafletDiv).position === 'static') {
          this.leafletDiv.style.position = 'relative';
        }
        
        // 将ECharts容器添加到Leaflet容器中
        this.leafletDiv.appendChild(this.container);
      }
      
      // 初始化ECharts图表
      const initResult = this.initECharts();
      if (!initResult) {
        error('初始化ECharts图表失败');
        return false;
      }
      
      this.enabled = true;
      
      // 如果有数据，设置数据并开始动画
      if (this.data.length > 0) {
        this.updateChartOption();
      }
      
      // 如果配置了自动开始，则开始动画
      if (this.options.autoStart) {
        this.start();
      }
      
      this.emit('migration-started');
      info('ECharts飞线图已启用');
      return true;
    } catch (e) {
      error('启用ECharts飞线图失败:', e);
      return false;
    }
  }

  /**
   * 禁用飞线图
   */
  public disable(): boolean {
    if (!this.enabled) return true;
    
    try {
      this.stop();
      
      if (this.chart) {
        this.chart.clear();
        this.chart.dispose();
        this.chart = null;
      }
      
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      
      this.enabled = false;
      this.lmap = null;
      this.lmapComponent = null;
      
      info('ECharts飞线图已禁用');
      return true;
    } catch (e) {
      error('禁用ECharts飞线图失败:', e);
      return false;
    }
  }

  /**
   * 切换飞线图启用状态
   */
  public toggle(): boolean {
    return this.enabled ? this.disable() : this.enable();
  }

  /**
   * 判断飞线图是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置飞线图数据
   * @param data 飞线图数据点数组
   * @param startAnimation 是否自动开始动画
   */
  public setData(data: MigrationPoint[], startAnimation: boolean = true): boolean {
    try {
      this.data = data || [];
      
      // 如果没有启用，仅保存数据
      if (!this.enabled) {
        info(`飞线图数据已更新（${data.length}条路径），但飞线图尚未启用`);
        return true;
      }
      
      // 更新图表选项
      this.updateChartOption();
      
      if (startAnimation && this.enabled) {
        this.start();
      }
      
      info(`飞线图数据已更新，共${data.length}条路径`);
      return true;
    } catch (e) {
      error('设置飞线图数据失败:', e);
      return false;
    }
  }

  /**
   * 开始动画
   */
  public start(): boolean {
    if (!this.enabled) {
      warn('飞线图未启用，无法开始动画');
      return false;
    }
    
    try {
      if (this.chart) {
        const option = this.chart.getOption();
        const series = option.series as any[];
        if (series && series.length > 0) {
          // 找到lines类型的series
          for (let i = 0; i < series.length; i++) {
            if (series[i].type === 'lines') {
              series[i].effect.show = true;
            }
          }
          this.chart.setOption({ series }, false);
        }
      }
      
      this.isAnimating = true;
      this.emit('migration-started');
      info('飞线图动画已开始');
      return true;
    } catch (e) {
      error('开始飞线图动画失败:', e);
      return false;
    }
  }

  /**
   * 停止动画
   */
  public stop(): boolean {
    if (!this.enabled || !this.isAnimating) {
      return true;
    }
    
    try {
      if (this.chart) {
        const option = this.chart.getOption();
        const series = option.series as any[];
        if (series && series.length > 0) {
          // 找到lines类型的series
          for (let i = 0; i < series.length; i++) {
            if (series[i].type === 'lines') {
              series[i].effect.show = false;
            }
          }
          this.chart.setOption({ series }, false);
        }
      }
      
      this.isAnimating = false;
      this.emit('migration-completed');
      info('飞线图动画已停止');
      return true;
    } catch (e) {
      error('停止飞线图动画失败:', e);
      return false;
    }
  }

  /**
   * 获取当前飞线图数据
   */
  public getData(): MigrationPoint[] {
    return [...this.data];
  }

  /**
   * 清除飞线图数据
   */
  public clearData(): boolean {
    this.data = [];
    if (this.chart) {
      this.chart.clear();
      this.updateChartOption();
    }
    info('飞线图数据已清除');
    return true;
  }

  /**
   * 更新飞线图选项
   * @param options 飞线图选项
   */
  public updateOptions(options: any): boolean {
    this.options = this.mergeOptions(this.options, options);
    
    try {
      // 如果启用了图表，更新选项
      if (this.enabled && this.chart) {
        this.updateChartOption();
      }
      
      return true;
    } catch (e) {
      error('更新ECharts飞线图选项失败:', e);
      return false;
    }
  }

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  public on(event: MigrationEventType, listener: MigrationEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(listener);
    }
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  public off(event: MigrationEventType, listener: MigrationEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: MigrationEventType, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (e) {
          error(`执行事件监听器'${event}'失败:`, e);
        }
      });
    }
  }

  /**
   * 销毁飞线图实例
   */
  public destroy(): void {
    this.disable();
    this.clearData();
    
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
    
    this.eventListeners.clear();
    this.lmap = null;
    this.lmapComponent = null;
    this.map = null;
  }

  /**
   * 判断是否正在播放动画
   */
  public getAnimatingState(): boolean {
    return this.isAnimating;
  }

  /**
   * 获取当前选项
   */
  public getOptions(): MigrationOptions {
    return { ...this.options };
  }
} 