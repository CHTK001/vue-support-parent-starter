import { info, warn, error } from "@repo/utils";
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import * as echarts from 'echarts/core';
import { ScatterChart, LinesChart, EffectScatterChart } from 'echarts/charts';
import { GridComponent, TitleComponent, LegendComponent, TooltipComponent, GeoComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { MigrationBase, MigrationEventType, MigrationEventListener, MigrationPoint } from './MigrationBase';
import type { MigrationOptions } from "./types";

// 导入echarts-extension-leaflet
import 'echarts';
import '@joakimono/echarts-extension-leaflet';
import { nextTick } from "vue";

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
  CanvasRenderer
]);

/**
 * ECharts Leaflet图层类
 * 将ECharts作为Leaflet的自定义图层
 */
class EChartsLayer extends L.Layer {
  private _container: HTMLDivElement;
  private _map: LeafletMap | null = null;
  private _chart: echarts.ECharts | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _isVisible: boolean = true;
  private _chartOption: any = { series: [] }; // 保存完整的图表选项
  private _leafletCoordSys: any = null; // Leaflet坐标系统实例

  constructor(options?: L.LayerOptions) {
    super(options);
    // 创建容器
    this._container = L.DomUtil.create('div', 'leaflet-echarts-layer');
    this._container.style.position = 'absolute';
    this._container.style.top = '0';
    this._container.style.left = '0';
    this._container.style.width = '100%';
    this._container.style.height = '100%';
    this._container.style.pointerEvents = 'none';
    this._container.style.zIndex = '450'; // 低于控件和弹出框
  }

  // 自定义方法，添加图层到地图
  addTo(map: LeafletMap): this {
    map.addLayer(this);
    return this;
  }

  // 自定义方法，从地图移除图层
  remove(): this {
    if (this._map) {
      this._map.removeLayer(this);
    }
    return this;
  }

  onAdd(map: LeafletMap): this {
    this._map = map;
    
    // 将容器添加到地图的覆盖物Pane
    map.getPanes().overlayPane.appendChild(this._container);
    
    // 初始化chart
    this._initChart();
    
    // 绑定地图事件
    map.on('resize', this._handleResize, this);
    map.on('moveend', this._handleMoveEnd, this);
    map.on('zoomend', this._handleZoomEnd, this);
    
    // 更新容器大小
    this._updateContainerSize();
    
    // 监听容器大小变化
    if (window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(() => {
        if (this._chart) {
          // 使用nextTick避免在主进程中调用resize
          nextTick(() => {
            if (this._chart) {
              this._chart.resize();
            }
          });
        }
      });
      this._resizeObserver.observe(this._container);
    }
    
    return this;
  }

  onRemove(map: LeafletMap): this {
    // 解绑事件
    map.off('resize', this._handleResize, this);
    map.off('moveend', this._handleMoveEnd, this);
    map.off('zoomend', this._handleZoomEnd, this);
    
    // 移除容器
    if (this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    
    // 销毁图表
    if (this._chart) {
      this._chart.dispose();
      this._chart = null;
    }
    
    // 停止监听大小变化
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    
    this._map = null;
    
    return this;
  }

  /**
   * 获取ECharts实例
   */
  getEChartsInstance(): echarts.ECharts | null {
    return this._chart;
  }

  /**
   * 设置图表选项
   */
  setOption(option: any, notMerge?: boolean): void {
    if (!option) return;
    
    try {
      // 更新存储的选项
      if (notMerge) {
        // 完全替换
        this._chartOption = { ...option };
      } else {
        // 合并选项
        this._mergeChartOption(option);
      }
      
      // 应用到ECharts实例 - 使用setTimeout确保不在主进程调用
      if (this._chart) {
        nextTick(() => {
          if (this._chart) {
            this._chart.setOption(option, notMerge);
            info('已设置ECharts选项，series长度:', (option.series || []).length);
          }
        });
      }
    } catch (err) {
      error('设置ECharts选项失败:', err);
    }
  }

  /**
   * 获取存储的图表选项
   */
  getStoredOption(): any {
    return this._chartOption;
  }
  
  /**
   * 获取图表实例的选项
   */
  getInstanceOption(): any {
    if (this._chart) {
      try {
        return this._chart.getOption();
      } catch (err) {
        warn('从ECharts实例获取选项失败:', err);
        return null;
      }
    }
    return null;
  }
  
  /**
   * 获取当前有效的图表选项（优先使用实例选项，否则使用存储选项）
   */
  getOption(): any {
    const instanceOption = this.getInstanceOption();
    if (instanceOption && instanceOption.series && instanceOption.series.length > 0) {
      return instanceOption;
    }
    return this._chartOption;
  }
  
  /**
   * 合并图表选项
   */
  private _mergeChartOption(newOption: any): void {
    // 避免循环引用，使用简单的克隆方法
    const cloneData = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      // 处理数组
      if (Array.isArray(obj)) {
        return obj.map(item => cloneData(item));
      }
      
      // 处理对象
      const cloned: any = {};
      for (const key in obj) {
        // 跳过可能导致循环引用的属性
        if (key === 'map' || key === '_map' || key === '_chart') {
          continue;
        }
        cloned[key] = cloneData(obj[key]);
      }
      return cloned;
    };
    
    // 合并顶层属性
    for (const key in newOption) {
      if (key === 'series') {
        // 对于series，使用深拷贝复制
        this._chartOption.series = cloneData(newOption.series || []);
      } else if (key === 'leaflet' && newOption[key] && newOption[key].map) {
        // 特殊处理leaflet属性，避免复制map实例
        if (!this._chartOption.leaflet) {
          this._chartOption.leaflet = {};
        }
        // 复制除map之外的属性
        for (const leafletKey in newOption.leaflet) {
          if (leafletKey !== 'map') {
            this._chartOption.leaflet[leafletKey] = cloneData(newOption.leaflet[leafletKey]);
          }
        }
        // 保留原始map引用
        this._chartOption.leaflet.map = newOption.leaflet.map;
      } else {
        // 其他属性使用深拷贝
        this._chartOption[key] = cloneData(newOption[key]);
      }
    }
  }

  /**
   * 显示图层
   */
  show(): void {
    if (!this._isVisible) {
      this._container.style.display = '';
      this._isVisible = true;
      this._handleResize();
    }
  }

  /**
   * 隐藏图层
   */
  hide(): void {
    if (this._isVisible) {
      this._container.style.display = 'none';
      this._isVisible = false;
    }
  }

  /**
   * 清空图表内容
   */
  clear(): void {
    if (this._chart) {
      this._chart.clear();
    }
  }

  /**
   * 初始化ECharts图表
   */
  private _initChart(): void {
    if (!this._container || !this._map) return;
    
    try {
      // 创建ECharts实例
      this._chart = echarts.init(this._container);
      
      // 设置初始配置 - 使用专门针对leaflet的配置
      const initialOption = {
        animation: true,
        // 设置leaflet坐标系
        leaflet: {
          // 使用已存在的Leaflet实例
          map: this._map
        },
        series: []
      };
      
      // 更新存储的选项
      this._chartOption = { ...initialOption };
      
      // 使用setTimeout确保setOption不在主进程调用
      nextTick(() => {
        if (this._chart) {
          // 应用初始选项
          this._chart.setOption(initialOption);
          info('已应用ECharts初始配置');
        }
      });
      
      // 确认图表是否正确初始化
      if (this._chart) {
        info('ECharts图层已成功创建，容器大小:', 
             `${this._container.clientWidth}x${this._container.clientHeight}`);
      } else {
        warn('ECharts图层创建过程出现异常');
      }
    } catch (err) {
      error('创建ECharts图层失败:', err);
    }
  }

  /**
   * 重置ECharts实例
   */
  resetChart(): void {
    try {
      if (this._chart) {
        // 先处理之前的实例
        this._chart.dispose();
        this._chart = null;
      }
      
      // 重新初始化
      this._initChart();
      
      // 恢复选项
      if (this._chart && this._chartOption.series && this._chartOption.series.length > 0) {
        // 使用nextTick避免在主进程中调用setOption
        nextTick(() => {
          if (this._chart) {
            this._chart.setOption(this._chartOption);
            info('已恢复ECharts配置');
          }
        });
      }
    } catch (err) {
      error('重置ECharts实例失败:', err);
    }
  }

  /**
   * 更新容器尺寸
   */
  private _updateContainerSize(): void {
    if (!this._map || !this._container) return;
    
    const size = this._map.getSize();
    this._container.style.width = size.x + 'px';
    this._container.style.height = size.y + 'px';
    
    // 重置图表大小 - 使用nextTick避免在主进程中调用resize
    if (this._chart) {
      nextTick(() => {
        if (this._chart) {
          this._chart.resize();
        }
      });
    }
  }

  /**
   * 处理地图大小变化
   */
  private _handleResize(): void {
    this._updateContainerSize();
  }

  /**
   * 处理地图移动结束
   */
  private _handleMoveEnd(): void {
    if (this._chart) {
      nextTick(() => {
        if (this._chart) {
          this._chart.resize();
        }
      });
    }
  }

  /**
   * 处理地图缩放结束
   */
  private _handleZoomEnd(): void {
    if (this._chart) {
      nextTick(() => {
        if (this._chart) {
          this._chart.resize();
        }
      });
    }
  }
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
  private echartsLayer: EChartsLayer | null = null;

  /**
   * 构造函数
   * @param map Leaflet地图对象
   * @param options 迁徙图配置选项
   */
  constructor(map: LeafletMap, options: Partial<MigrationOptions> = {}) {
    this.map = map;
    
    // 默认选项
    const defaultOptions: MigrationOptions = {
      enable3D: false,
      autoStart: true,
      animation: true,
      animationDelay: 10,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      lineType: 'line',
      pathEffect: 'path',
      lineWidth: 1,
      lineOpacity: 0.6,
      symbolSize: 5,
      curvature: 0.2,
      rippleEffect: {
        period: 4,
        scale: 4,
        brushType: 'fill'
      },
      hoverAnimation: true,
      label: {
        show: false,
        position: 'right',
        formatter: '{b}'
      }
    };
    
    // 合并选项
    this.options = { ...defaultOptions, ...options };
    
    // 初始化事件监听器Map
    this.eventListeners.set('migration-completed', new Set());
    this.eventListeners.set('migration-started', new Set());
    this.eventListeners.set('migration-data-updated', new Set());
  }

  /**
   * 启用飞线图
   */
  public enable(): boolean {
    if (this.enabled) return true;
    
    try {
      info('正在启用ECharts飞线图...');
      
      // 创建ECharts图层
      this.echartsLayer = new EChartsLayer();
      this.echartsLayer.addTo(this.map);
      
      // 确保初始化成功
      if (!this.echartsLayer) {
        error('创建ECharts图层失败');
        return false;
      }
      
      this.enabled = true;
      
      // 记录一个明确的标记，表示已经启用
      info('ECharts飞线图已启用，图层已创建');
      
      // 如果已经有数据，直接应用
      if (this.data.length > 0) {
        info(`存在${this.data.length}条飞线数据，正在应用...`);
        this.updateChartOption();
        
        // 如果配置了自动开始，延迟启动动画
        if (this.options.autoStart) {
          setTimeout(() => {
            if (this.enabled) {
              info('自动开始飞线动画...');
              this.start();
            }
          }, 500);
        }
      } else {
        info('当前没有飞线数据');
      }
      
      this.emit('migration-started');
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
      // 先停止动画
      if (this.isAnimating) {
        this.stop();
      }
      
      // 移除图层
      if (this.echartsLayer) {
        this.echartsLayer.remove();
        this.echartsLayer = null;
      }
      
      this.enabled = false;
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
      info(`设置飞线图数据，共${data?.length || 0}条路径`);
      
      // 数据验证
      if (!Array.isArray(data)) {
        warn('飞线图数据必须是数组类型');
        return false;
      }
      
      // 验证并处理数据
      this.data = this.validateData(data);
      
      info(`数据验证结果: 总共${data.length}条路径，有效${this.data.length}条路径`);
      
      if (this.data.length === 0) {
        warn('没有有效的飞线图数据，操作取消');
        return false;
      }
      
      // 更新图表配置
      if (this.enabled && this.echartsLayer) {
        this.updateChartOption();
        
        // 如果需要开始动画
        if (startAnimation) {
          return this.start();
        }
      }
      
      // 触发数据更新事件
      this.emit('migration-data-updated', { count: this.data.length });
      
      return true;
    } catch (e) {
      error('设置飞线图数据失败:', e);
      return false;
    }
  }

  /**
   * 验证并处理飞线数据
   */
  private validateData(data: MigrationPoint[]): MigrationPoint[] {
    const validatedData: MigrationPoint[] = [];
    
    data.forEach((point, index) => {
      // 检查必要属性
      if (!point.from || !point.to) {
        warn(`第${index}条路径缺少必要的from或to属性，将被跳过`);
        return;
      }
      
      // 确保坐标是数组类型
      if (!Array.isArray(point.from) || !Array.isArray(point.to)) {
        warn(`第${index}条路径的坐标格式错误，应为数组，将被跳过`);
        return;
      }
      
      // 检查坐标长度
      if (point.from.length < 2 || point.to.length < 2) {
        warn(`第${index}条路径的坐标格式错误，数组长度不足，将被跳过`);
        return;
      }
      
      // 检查坐标值是否为数字
      if (typeof point.from[0] !== 'number' || typeof point.from[1] !== 'number' ||
          typeof point.to[0] !== 'number' || typeof point.to[1] !== 'number') {
        warn(`第${index}条路径的坐标值必须为数字类型，将被跳过`);
        return;
      }
      
      // 确保坐标格式正确（ECharts需要[经度,纬度]格式）
      const fromCoord = this.ensureCorrectCoordinateFormat(point.from);
      const toCoord = this.ensureCorrectCoordinateFormat(point.to);
      
      // 创建修正后的数据点
      const validPoint: MigrationPoint = {
        ...point,
        from: [fromCoord[0], fromCoord[1]] as [number, number],
        to: [toCoord[0], toCoord[1]] as [number, number]
      };
      
      // 添加到有效数据数组
      validatedData.push(validPoint);
    });
    
    return validatedData;
  }

  /**
   * 确保坐标格式正确 [经度,纬度]
   */
  private ensureCorrectCoordinateFormat(coord: number[]): [number, number] {
    // 尝试检测坐标格式并校正
    // Leaflet使用[纬度,经度]，而ECharts使用[经度,纬度]格式
    if (Math.abs(coord[0]) <= 90 && Math.abs(coord[1]) > 90) {
      // 可能是[纬度,经度]格式，需要交换
      return [coord[1], coord[0]];
    }
    return [coord[0], coord[1]];
  }

  /**
   * 更新ECharts配置选项
   */
  private updateChartOption(): void {
    if (!this.enabled || !this.echartsLayer) {
      return;
    }
    
    try {
      info('更新ECharts飞线图配置选项...');
      
      // 如果存在问题，尝试重置ECharts实例
      const echarts = this.echartsLayer.getEChartsInstance();
      if (!echarts) {
        warn('ECharts实例不存在，尝试重置图表');
        this.echartsLayer.resetChart();
      }
      
      // 获取地图实例
      const map = this.map;
      if (!map) {
        error('Leaflet地图实例不存在，无法更新配置');
        return;
      }
      
      // 准备系列数据
      const series = [];
      const scatterData = [];
      const linesData = [];
      
      // 转换迁徙数据为ECharts格式
      this.data.forEach((point) => {
        const { from, to, labels, color } = point;
        
        // 添加飞线数据
        linesData.push({
          coords: [from, to],
          lineStyle: {
            color: color || '#1e88e5',
            width: this.options.lineWidth,
            opacity: this.options.lineOpacity,
            curveness: this.options.curvature
          }
        });
        
        // 如果需要显示标签，添加起点和终点标记
        if (this.options.label?.show) {
          // 起点
          if (labels?.from) {
            scatterData.push({
              name: labels.from,
              value: [...from, labels.from],
              itemStyle: { color: color || '#1e88e5' }
            });
          }
          
          // 终点
          if (labels?.to) {
            scatterData.push({
              name: labels.to,
              value: [...to, labels.to],
              itemStyle: { color: color || '#1e88e5' }
            });
          }
        }
      });
      
      // 如果有标记点数据，添加散点图系列
      if (scatterData.length > 0) {
        series.push({
          type: 'scatter',
          coordinateSystem: 'leaflet',
          symbolSize: this.options.symbolSize,
          zlevel: 2,
          label: {
            show: this.options.label?.show,
            position: this.options.label?.position || 'right',
            formatter: this.options.label?.formatter || '{b}',
            fontSize: 10,
            color: '#fff'
          },
          data: scatterData
        });
      }
      
      // 添加飞线图系列
      series.push({
        type: 'lines',
        coordinateSystem: 'leaflet',
        zlevel: 1,
        effect: {
          show: this.isAnimating,
          period: this.options.rippleEffect?.period || 4,
          trailLength: 0.5,
          symbolSize: this.options.symbolSize || 5,
          symbol: 'circle',
          loop: true
        },
        lineStyle: {
          color: '#1e88e5',
          width: this.options.lineWidth || 1,
          opacity: this.options.lineOpacity || 0.6,
          curveness: this.options.curvature || 0.2
        },
        data: linesData
      });
      
      // 完整的ECharts配置 - 避免直接引用map对象
      const fullOption = {
        animation: this.options.animation,
        leaflet: {
          // 只提供必要的引用，避免循环引用
          map: this.map,
          // 复制当前的中心点和缩放级别
          center: [this.map.getCenter().lng, this.map.getCenter().lat],
          zoom: this.map.getZoom(),
          roam: true
        },
        series: series
      };
      
      // 打印调试信息
      info(`准备更新飞线图: ${linesData.length}条线, ${scatterData.length}个点`);
      
      // 使用nextTick避免在主进程中调用setOption
      nextTick(() => {
        if (this.enabled && this.echartsLayer) {
          // 保存配置并应用 - 使用notMerge=true确保完全替换配置
          this.echartsLayer.setOption(fullOption, true);
          info(`ECharts飞线图配置已更新: ${linesData.length}条飞线, ${scatterData.length}个标记点`);
        }
      });
      
    } catch (e) {
      error('更新ECharts飞线图配置失败:', e);
    }
  }

  /**
   * 开始动画
   */
  public start(): boolean {
    if (!this.enabled || !this.echartsLayer) {
      warn('飞线图未启用，无法开始动画');
      return false;
    }
    
    try {
      this.isAnimating = true;
      
      // 直接从内部存储获取选项，但避免引用相同对象
      const option = this.echartsLayer.getStoredOption();
      
      // 打印调试信息
      info(`开始动画，存储的选项包含${option?.series?.length || 0}个系列`);
      
      // 确保option中有series
      if (!option.series || !Array.isArray(option.series) || option.series.length === 0) {
        info('未找到飞线配置，重新更新配置');
        this.updateChartOption();
        return true;
      }
      
      // 找到lines类型的series并更新effect.show为true
      let hasUpdated = false;
      const newSeries = option.series.map(series => {
        // 创建新对象，避免修改原始对象
        if (series.type === 'lines') {
          hasUpdated = true;
          return {
            ...series,
            effect: {
              ...(series.effect || {}),
              show: true
            }
          };
        }
        return { ...series };
      });
      
      // 准备更新选项 - 仅传递需要更新的部分
      const updateOption = { series: newSeries };
      
      if (hasUpdated) {
        // 使用nextTick避免在主进程中调用setOption
        nextTick(() => {
          if (this.enabled && this.echartsLayer) {
            // 应用更新
            this.echartsLayer.setOption(updateOption);
            info('飞线图动画效果已启用');
          }
        });
      } else if (this.data.length > 0) {
        // 如果没有找到lines类型的series但有数据，重新更新配置
        info('未找到lines系列，重新更新配置');
        this.updateChartOption();
      }
      
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
    if (!this.enabled || !this.isAnimating || !this.echartsLayer) {
      return true;
    }
    
    try {
      this.isAnimating = false;
      
      // 直接从内部存储获取选项，而不是从实例获取
      const option = this.echartsLayer.getStoredOption();
      
      // 确保option中有series
      if (!option.series || !Array.isArray(option.series) || option.series.length === 0) {
        warn('未找到飞线配置，无法停止动画');
        return false;
      }
      
      // 找到lines类型的series并更新effect.show为false
      const newSeries = option.series.map(series => {
        if (series.type === 'lines') {
          return {
            ...series,
            effect: {
              ...(series.effect || {}),
              show: false
            }
          };
        }
        return series;
      });
      
      // 准备更新选项
      const updateOption = { series: newSeries };
      
      // 使用nextTick避免在主进程中调用setOption
      nextTick(() => {
        if (this.enabled && this.echartsLayer) {
          // 应用更新
          this.echartsLayer.setOption(updateOption);
          info('飞线图动画已停止');
        }
      });
      
      this.emit('migration-completed');
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
    try {
      info('清除飞线图数据');
      this.data = [];
      
      if (this.enabled && this.echartsLayer) {
        // 清空图表数据但保留配置
        this.echartsLayer.setOption({
          series: [
            {
              type: 'scatter',
              coordinateSystem: 'leaflet',
              data: []
            }, 
            {
              type: 'lines',
              coordinateSystem: 'leaflet',
              data: []
            }
          ]
        }, true);
      }
      
      return true;
    } catch (e) {
      error('清除飞线图数据失败:', e);
      return false;
    }
  }

  /**
   * 更新飞线图选项
   * @param options 飞线图选项
   */
  public updateOptions(options: Partial<MigrationOptions>): boolean {
    this.options = { ...this.options, ...options };
    
    try {
      // 如果启用了图表，更新选项
      if (this.enabled && this.data.length > 0) {
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
    this.eventListeners.clear();
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

  /**
   * 打印调试信息
   */
  public debug(): void {
    info('===== 飞线图调试信息 =====');
    info(`启用状态: ${this.enabled ? '已启用' : '未启用'}`);
    info(`动画状态: ${this.isAnimating ? '播放中' : '已停止'}`);
    info(`数据数量: ${this.data.length}条`);
    
    if (this.echartsLayer) {
      const storedOption = this.echartsLayer.getStoredOption();
      info(`存储的选项: ${JSON.stringify(storedOption).slice(0, 100)}...`);
      
      if (storedOption.series) {
        info(`存储的series数量: ${storedOption.series.length}`);
        storedOption.series.forEach((s, i) => {
          info(`  系列${i+1}: 类型=${s.type}, 数据数量=${s.data?.length || 0}`);
        });
      }
      
      const instanceOption = this.echartsLayer.getInstanceOption();
      info(`实例选项: ${instanceOption ? '存在' : '不存在'}`);
      if (instanceOption && instanceOption.series) {
        info(`实例series数量: ${instanceOption.series.length}`);
      }
    } else {
      info('ECharts图层未创建');
    }
    
    info('=========================');
  }
} 