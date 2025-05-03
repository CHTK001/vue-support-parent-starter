/**
 * EchartsMigration.ts
 * 
 * 基于@joakimono/echarts-extension-leaflet的飞线图实现
 * 用于替代原有的leaflet-charts5.ts实现
 */

import { info, warn, error } from "@repo/utils";
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
// 导入echarts核心模块
import * as echarts from "echarts";
// 导入必要的组件
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LinesChart, EffectScatterChart } from 'echarts/charts';
// 全局导入echarts-extension-leaflet以自动注册组件
import '@joakimono/echarts-extension-leaflet';

// 注册必须的组件
use([CanvasRenderer, LinesChart, EffectScatterChart]);

import type { ECharts, EChartsCoreOption } from 'echarts';
import type { MigrationBase, MigrationEventType, MigrationEventListener, MigrationPoint } from './MigrationBase';
import type { MigrationOptions } from "./types";
import { nextTick } from "vue";

/**
 * 基于echarts-extension-leaflet的飞线图插件类
 */
export class EchartsMigration implements MigrationBase {
  private map: LeafletMap;
  private enabled: boolean = false;
  private options: MigrationOptions;
  private data: MigrationPoint[] = [];
  private eventListeners: Map<MigrationEventType, Set<MigrationEventListener>> = new Map();
  private isAnimating: boolean = false;
  private echartsLayer: any = null; // 使用any类型避免类型检查问题
  private chart: echarts.ECharts | null = null;
  private initRetries: number = 0;
  private maxInitRetries: number = 5;
  private animationTimer: number | null = null;

  /**
   * 构造函数
   * @param map Leaflet地图对象
   * @param options 迁徙图配置选项
   */
  constructor(map: LeafletMap, options: Partial<MigrationOptions> = {}) {
    this.map = map;
    
    // 默认飞机图标路径
    const planePath = 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z';

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
      pathSymbol: planePath, // 默认使用飞机图标
      pathSymbolColor: '#1E90FF', // 默认蓝色飞机
      lineWidth: 1,
      lineOpacity: 0.6,
      symbolSize: 12, // 飞机图标尺寸
      curvature: 0.2,
      rippleEffect: {
        period: 2, // 更快的周期
        scale: 2,  // 更小的涟漪效果
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

      // 为地图创建一个容器元素
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '0px';
      container.style.left = '0px';
      container.style.right = '0px';
      container.style.bottom = '0px';
      container.style.pointerEvents = 'none'; // 确保不阻挡鼠标事件
      
      // 添加到地图容器
      this.map.getContainer().appendChild(container);
      
      // 初始化echarts实例
      this.chart = echarts.init(container);
      
      // 将地图实例关联到容器
      (container as any)._leaflet_map_ = this.map;
      
      // 设置基础配置
      this.chart.setOption({
        animation: true,
        lmap: {
          center: [this.map.getCenter().lng, this.map.getCenter().lat],
          zoom: this.map.getZoom(),
          roam: true,
          renderOnMoving: true, // 地图移动时保持渲染
          echartsLayerInteractive: false // 设为false，确保ECharts图层不拦截交互事件
        },
        series: [{
          type: 'lines',
          coordinateSystem: 'lmap', // 使用lmap作为坐标系统
          // 即使没有数据也设置一个空数组，确保系列被创建
          data: []
        }]
      }, true); // 使用notMerge=true避免配置混合
      
      // 禁用ECharts的默认交互
      this.chart.getZr().setCursorStyle('inherit');
      this.chart.getZr().off('mousedown');
      this.chart.getZr().off('mouseup');
      this.chart.getZr().off('mousemove');
      
      this.echartsLayer = container;
      
      // 如果有数据，则应用数据
      if (this.data.length > 0) {
        setTimeout(() => {
          if (this.chart) {
            this.applyData();
            if (this.options.autoStart) {
              this.start();
            }
          }
        }, 300);
      }
      
      // 使用bind绑定this到updatePosition方法
      const boundUpdatePosition = this.updatePosition.bind(this);
      (this as any)._boundUpdatePosition = boundUpdatePosition;
      
      // 地图移动事件，使用绑定的方法
      this.map.on('move', boundUpdatePosition);
      this.map.on('zoom', boundUpdatePosition);
      this.map.on('resize', boundUpdatePosition);
      
      this.enabled = true;
      
      info('飞线图初始化完成');
      this.emit('migration-started');
      return true;
    } catch (e) {
      error('启用飞线图失败:', e);
      return false;
    }
  }

  /**
   * 更新容器位置
   */
  private updatePosition(): void {
    if (this.chart) {
      this.chart.setOption({
        lmap: {
          center: [this.map.getCenter().lng, this.map.getCenter().lat],
          zoom: this.map.getZoom()
        }
      });
    }
  }

  /**
   * 禁用飞线图
   */
  public disable(): boolean {
    if (!this.enabled) return true;
    
    try {
      // 停止动画
      this.stop();
      
      // 清除图表
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
      
      // 移除地图事件监听器
      if ((this as any)._boundUpdatePosition) {
        this.map.off('move', (this as any)._boundUpdatePosition);
        this.map.off('zoom', (this as any)._boundUpdatePosition);
        this.map.off('resize', (this as any)._boundUpdatePosition);
        (this as any)._boundUpdatePosition = null;
      }
      
      // 移除容器元素
      if (this.echartsLayer && this.echartsLayer.parentNode) {
        this.echartsLayer.parentNode.removeChild(this.echartsLayer);
      }
      
      this.echartsLayer = null;
      this.enabled = false;
      
      info('飞线图已禁用');
      return true;
    } catch (e) {
      error('禁用飞线图失败:', e);
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
      // 保存并验证数据
      this.data = this.validateData(data || []);
      
      // 如果没有启用，仅保存数据
      if (!this.enabled) {
        info(`飞线图数据已更新（${data.length}条路径），但飞线图尚未启用`);
        return true;
      }
      
      // 应用数据到图表
      this.applyData();
      
      // 如果需要启动动画
      if (startAnimation && this.enabled) {
        this.start();
      }
      
      this.emit('migration-data-updated', { count: this.data.length });
      return true;
    } catch (e) {
      error('设置飞线图数据失败:', e);
      return false;
    }
  }

  /**
   * 验证并处理数据
   */
  private validateData(data: MigrationPoint[]): MigrationPoint[] {
    return data.filter(point => {
      // 确保起点和终点都有效
      if (!point.from || !point.to) {
        warn('飞线图数据点缺少起点或终点坐标，已忽略');
        return false;
      }
      
      // 确保坐标是有效数字
      if (
        isNaN(point.from[0]) || isNaN(point.from[1]) ||
        isNaN(point.to[0]) || isNaN(point.to[1])
      ) {
        warn('飞线图数据点包含无效坐标，已忽略');
        return false;
      }
      
      // 检查起点和终点是否在经纬度有效范围内
      if (
        point.from[0] < -180 || point.from[0] > 180 ||
        point.from[1] < -90 || point.from[1] > 90 ||
        point.to[0] < -180 || point.to[0] > 180 ||
        point.to[1] < -90 || point.to[1] > 90
      ) {
        warn('飞线图数据点坐标超出有效范围，已忽略');
        return false;
      }
      
      return true;
    });
  }

  /**
   * 应用数据到图表
   */
  private applyData(): void {
    if (!this.chart) {
      warn('图表实例不存在，无法应用数据');
      return;
    }
    
    try {
      // 获取曲率设置
      const curveness = this.options.curvature || 0.2;
      
      // 转换数据为ECharts所需格式
      const seriesData = this.data.map(point => {
        const { from, to, labels, color, weight } = point;
        
        // 基础数据项
        const item: any = {
          coords: [from, to], // ECharts期望的格式: [[lng, lat], [lng, lat]]
          // 如果有标签，设置起点和终点名称
          fromName: labels?.from || '',
          toName: labels?.to || '',
          // 使用权重作为线宽的系数
          lineStyle: {
            width: (weight || 1) * this.options.lineWidth,
            color: color || undefined,
            curveness: curveness // 应用曲率
          }
        };
        
        return item;
      });
      
      // 获取所有目标点，用于创建散点效果
      const effectScatterData = this.data.map(point => {
        return {
          name: point.labels?.to || '',
          value: [...point.to, point.weight || 1], // [lng, lat, weight]
          itemStyle: {
            color: point.color || undefined
          }
        };
      });
      
      // 确定是否使用3D效果
      const is3D = this.options.enable3D === true;
      
      // 自定义飞机图标路径
      const planePath = 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z';
      
      // 获取用户配置的图标
      const symbol = this.options.pathSymbol || planePath;
      // 获取图标颜色
      const symbolColor = this.options.pathSymbolColor || '#00BFFF';

      // 设置echarts配置
      const option: any = {
        animation: this.options.animation,
        animationDuration: this.options.animationDuration,
        animationEasing: this.options.animationEasing,
        animationDelay: this.options.animationDelay,
        series: [
          // 飞线图系列
          {
            type: 'lines',
            coordinateSystem: 'lmap',
            zlevel: is3D ? 1 : 1,
            // 使用曲线效果
            polyline: false,
            // 曲率配置
            lineStyle: {
              width: this.options.lineWidth,
              opacity: this.options.lineOpacity,
              // 动态缓动线效果
              type: this.options.lineType,
              curveness: curveness
            },
            // 是否启用动画效果
            effect: this.options.pathEffect === 'none' ? undefined : {
              show: true,
              period: 6,
              trailLength: 0.7,
              color: symbolColor,
              symbolSize: this.options.symbolSize,
              symbol: symbol
            },
            // 数据项
            data: seriesData
          },
          // 目标点散点图效果
          {
            name: '目标点',
            type: 'effectScatter',
            coordinateSystem: 'lmap',
            zlevel: is3D ? 2 : 2,
            // 散点大小，改为更小的值
            symbolSize: (val) => {
              // 默认较小的尺寸，根据权重稍微调整
              return this.options.symbolSize * 1.2 * (Array.isArray(val) ? Math.min((val[2] || 1), 2) : 1);
            },
            // 波动效果
            rippleEffect: {
              period: this.options.rippleEffect?.period || 2,
              scale: this.options.rippleEffect?.scale || 2,
              brushType: this.options.rippleEffect?.brushType || 'fill'
            },
            // 标签设置
            label: {
              show: this.options.label?.show || false,
              position: this.options.label?.position || 'right',
              formatter: this.options.label?.formatter || '{b}'
            },
            // 是否启用鼠标悬停动画
            hoverAnimation: this.options.hoverAnimation,
            // 散点样式，降低亮度和透明度
            itemStyle: {
              shadowBlur: 5,
              shadowColor: 'rgba(120, 36, 50, 0.3)',
              opacity: 0.7
            },
            // 数据项
            data: effectScatterData
          }
        ]
      };
      
      // 应用配置
      this.chart.setOption(option);
      
      info(`已应用${seriesData.length}条飞线数据到图表`);
    } catch (e) {
      error('应用数据到图表失败:', e);
    }
  }

  /**
   * 开始飞线动画
   */
  public start(): boolean {
    if (!this.enabled || !this.chart) {
      warn('飞线图未启用或图表实例不存在，无法启动动画');
      return false;
    }
    
    try {
      // 确保数据已加载
      if (this.data.length === 0) {
        warn('飞线图数据为空，无法启动动画');
        return false;
      }
      
      // 设置动画状态
      this.isAnimating = true;
      
      // 如果前面有定时器，清除它
      if (this.animationTimer !== null) {
        window.clearTimeout(this.animationTimer);
        this.animationTimer = null;
      }
      
      // 自定义飞机图标路径
      const planePath = 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z';
      
      // 获取用户配置的图标
      const symbol = this.options.pathSymbol || planePath;
      // 获取图标颜色
      const symbolColor = this.options.pathSymbolColor || '#00BFFF';
      
      // 应用动画配置
      this.chart.setOption({
        series: [
          {
            // 飞线动画
            type: 'lines',
            effect: {
              show: true,
              period: 6,
              trailLength: 0.7,
              color: symbolColor,
              symbolSize: this.options.symbolSize,
              symbol: symbol
            }
          },
          {
            // 散点动画
            type: 'effectScatter',
            rippleEffect: {
              period: this.options.rippleEffect?.period || 2,
              scale: this.options.rippleEffect?.scale || 2,
              brushType: this.options.rippleEffect?.brushType || 'fill'
            }
          }
        ]
      });
      
      info('飞线动画已启动');
      return true;
    } catch (e) {
      error('启动飞线动画失败:', e);
      return false;
    }
  }

  /**
   * 停止飞线动画
   */
  public stop(): boolean {
    if (!this.enabled || !this.chart) {
      return false;
    }
    
    try {
      // 清除定时器
      if (this.animationTimer !== null) {
        window.clearTimeout(this.animationTimer);
        this.animationTimer = null;
      }
      
      // 设置动画状态
      this.isAnimating = false;
      
      // 隐藏动画效果
      this.chart.setOption({
        series: [
          {
            // 飞线动画
            type: 'lines',
            effect: {
              show: false
            }
          },
          {
            // 散点动画 - 停止波动效果
            type: 'effectScatter',
            rippleEffect: {
              scale: 0
            }
          }
        ]
      });
      
      info('飞线动画已停止');
      return true;
    } catch (e) {
      error('停止飞线动画失败:', e);
      return false;
    }
  }

  /**
   * 获取飞线图数据
   */
  public getData(): MigrationPoint[] {
    return this.data;
  }

  /**
   * 清除飞线图数据
   */
  public clearData(): boolean {
    try {
      // 停止动画
      this.stop();
      
      // 清空数据
      this.data = [];
      
      // 如果图表已创建，清除数据
      if (this.chart) {
        this.chart.setOption({
          series: [{
            type: 'lines',
            data: []
          }]
        });
      }
      
      info('飞线图数据已清除');
      return true;
    } catch (e) {
      error('清除飞线图数据失败:', e);
      return false;
    }
  }

  /**
   * 更新飞线图选项
   * @param options 飞线图配置选项
   */
  public updateOptions(options: Partial<MigrationOptions>): boolean {
    try {
      // 合并选项
      this.options = { ...this.options, ...options };
      
      // 如果图表已创建并启用，应用更新
      if (this.enabled && this.chart) {
        // 重新应用数据会使用新配置
        this.applyData();
        
        // 如果正在动画中，重启动画
        if (this.isAnimating) {
          this.start();
        }
      }
      
      info('飞线图选项已更新');
      return true;
    } catch (e) {
      error('更新飞线图选项失败:', e);
      return false;
    }
  }

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 事件监听器
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
   * @param listener 事件监听器
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
          error(`执行飞线图事件监听器失败: ${event}`, e);
        }
      });
    }
  }

  /**
   * 销毁飞线图实例
   */
  public destroy(): void {
    // 停止动画
    this.stop();
    
    // 禁用图层
    this.disable();
    
    // 清空事件监听器
    this.eventListeners.forEach(listeners => listeners.clear());
    
    info('飞线图实例已销毁');
  }

  /**
   * 判断是否正在播放动画
   */
  public getAnimatingState(): boolean {
    return this.isAnimating;
  }

  /**
   * 获取当前配置选项
   */
  public getOptions(): MigrationOptions {
    return this.options;
  }
} 