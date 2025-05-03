/**
 * LeafletCharts5Migration.ts
 * 
 * 基于自定义实现的leaflet-charts5.ts的飞线图实现
 * 专门为Echarts 5设计，解决了原leaflet-echarts中的问题
 */

import { info, warn, error } from "@repo/utils";
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import * as echarts from 'echarts/core';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { ScatterChart, LinesChart, EffectScatterChart } from 'echarts/charts';
import { GridComponent, TitleComponent, LegendComponent, TooltipComponent, GeoComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { MigrationBase, MigrationEventType, MigrationEventListener, MigrationPoint } from './MigrationBase';
import type { MigrationOptions } from "./types";
import { LeafletEChartsLayer } from './leaflet-charts5';
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
 * 基于leaflet-charts5的飞线图插件类
 */
export class LeafletCharts5Migration implements MigrationBase {
  private map: LeafletMap;
  private enabled: boolean = false;
  private options: MigrationOptions;
  private data: MigrationPoint[] = [];
  private eventListeners: Map<MigrationEventType, Set<MigrationEventListener>> = new Map();
  private isAnimating: boolean = false;
  private echartsLayer: LeafletEChartsLayer | null = null;
  private chart: echarts.ECharts | null = null;

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
      info('正在启用基于leaflet-charts5的飞线图...');
      
      // 创建并添加echarts图层
      this.echartsLayer = new LeafletEChartsLayer(this.map);
      this.map.addLayer(this.echartsLayer);
      
      // 获取echarts实例
      this.chart = this.echartsLayer.getECharts();
      
      // 设置初始空配置
      setTimeout(() => {
        if (this.chart && this.enabled) {
          // 设置一个空的初始配置
          this.updateChartOption();
        }
      }, 200);
      
      this.enabled = true;
      info('leaflet-charts5飞线图已启用');
      
      // 如果已经有数据，等待初始化完成后应用
      if (this.data.length > 0) {
        setTimeout(() => {
          if (this.enabled) {
            this.updateChartOption();
            
            // 如果配置了自动开始，延迟启动动画
            if (this.options.autoStart) {
              setTimeout(() => {
                if (this.enabled) {
                  this.start();
                }
              }, 300);
            }
          }
        }, 300);
      }
      
      this.emit('migration-started');
      return true;
    } catch (e) {
      error('启用leaflet-charts5飞线图失败:', e);
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
        this.map.removeLayer(this.echartsLayer);
        this.echartsLayer = null;
      }
      
      // 清理引用
      this.chart = null;
      this.enabled = false;
      
      info('leaflet-charts5飞线图已禁用');
      return true;
    } catch (e) {
      error('禁用leaflet-charts5飞线图失败:', e);
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
      
      // 验证数据
      if (!Array.isArray(data)) {
        warn('飞线图数据必须是数组类型');
        return false;
      }
      
      // 验证并处理数据
      this.data = this.validateData(data);
      
      // 更新图表配置
      if (this.enabled && this.chart) {
        this.updateChartOption();
        
        // 如果需要开始动画
        if (startAnimation) {
          // 延迟启动动画，确保图表已正确更新
          setTimeout(() => {
            return this.start();
          }, 200);
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
   * @param data 原始数据
   * @returns 验证后的数据
   */
  private validateData(data: MigrationPoint[]): MigrationPoint[] {
    const validatedData: MigrationPoint[] = [];
    
    data.forEach((point, index) => {
      try {
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
        
        // 确保坐标格式正确 [经度,纬度]
        const validated: MigrationPoint = {
          ...point,
          from: this.ensureCoordinateFormat(point.from),
          to: this.ensureCoordinateFormat(point.to),
        };
        
        validatedData.push(validated);
      } catch (e) {
        warn(`验证第${index}条路径时出错:`, e);
      }
    });
    
    return validatedData;
  }

  /**
   * 确保坐标格式正确 [经度,纬度]
   */
  private ensureCoordinateFormat(coord: number[]): [number, number] {
    // 创建一个新的坐标数组
    const result: [number, number] = [coord[0], coord[1]];
    
    // 检测并记录坐标范围
    const isFirstLikelyLatitude = Math.abs(coord[0]) <= 90;
    const isSecondLikelyLongitude = Math.abs(coord[1]) <= 180 && Math.abs(coord[1]) > 90;
    
    // 如果看起来是[纬度,经度]格式，需要交换
    if (isFirstLikelyLatitude && isSecondLikelyLongitude) {
      return [coord[1], coord[0]];
    }
    
    // 确保坐标在合理范围内
    if (Math.abs(result[0]) > 180) {
      result[0] = ((result[0] + 180) % 360) - 180;
    }
    
    if (Math.abs(result[1]) > 90) {
      result[1] = Math.max(-90, Math.min(90, result[1]));
    }
    
    return result;
  }

  /**
   * 更新ECharts配置选项
   */
  private updateChartOption(): void {
    if (!this.enabled || !this.chart) {
      return;
    }
    
    try {
      info('更新leaflet-charts5飞线图配置选项...');
      
      // 检查数据是否为空
      if (this.data.length === 0) {
        // 设置空配置
        this.chart.setOption({
          animation: false,
          series: []
        });
        return;
      }
      
      // 准备系列数据
      const scatterData = [];
      const linesData = [];
      
      // 转换迁徙数据为ECharts格式
      this.data.forEach(point => {
        const { from, to, labels, color } = point;
        
        // 添加飞线数据
        linesData.push({
          coords: [
            [from[0], from[1]],  // 起点坐标 [经度, 纬度]
            [to[0], to[1]]       // 终点坐标 [经度, 纬度]
          ],
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
              value: [from[0], from[1], labels.from],
              itemStyle: { color: color || '#1e88e5' }
            });
          }
          
          // 终点
          if (labels?.to) {
            scatterData.push({
              name: labels.to,
              value: [to[0], to[1], labels.to],
              itemStyle: { color: color || '#1e88e5' }
            });
          }
        }
      });
      
      // 完整ECharts配置
      const option = {
        animation: this.options.animation,
        series: [
          // 标记点
          {
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
            itemStyle: {
              color: '#1e88e5'
            },
            data: scatterData
          },
          // 飞线图
          {
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
          }
        ]
      };
      
      // 使用nextTick避免在主进程中调用setOption
      nextTick(() => {
        if (this.enabled && this.chart) {
          try {
            this.chart.setOption(option, true);
            info(`leaflet-charts5飞线图配置已更新: ${linesData.length}条飞线, ${scatterData.length}个标记点`);
          } catch (e) {
            error('更新飞线图配置失败:', e);
          }
        }
      });
    } catch (e) {
      error('更新leaflet-charts5飞线图配置失败:', e);
    }
  }

  /**
   * 开始动画
   */
  public start(): boolean {
    if (!this.enabled || !this.chart) {
      warn('飞线图未启用或图表实例不存在，无法开始动画');
      return false;
    }
    
    try {
      this.isAnimating = true;
      
      // 重新更新图表配置，设置effect.show为true
      this.updateChartOption();
      
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
    if (!this.enabled || !this.isAnimating || !this.chart) {
      return true;
    }
    
    try {
      this.isAnimating = false;
      
      // 重新更新图表选项
      this.updateChartOption();
      
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
      
      if (this.enabled && this.chart) {
        // 创建空配置
        const emptyOption = {
          animation: false,
          series: []
        };
        
        // 使用nextTick避免在主进程中调用setOption
        nextTick(() => {
          if (this.enabled && this.chart) {
            this.chart.setOption(emptyOption, true);
            info('飞线图数据已清除');
          }
        });
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
      // 如果启用了图表且有数据，更新配置
      if (this.enabled && this.data.length > 0 && this.chart) {
        this.updateChartOption();
      }
      
      return true;
    } catch (e) {
      error('更新leaflet-charts5飞线图选项失败:', e);
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
} 