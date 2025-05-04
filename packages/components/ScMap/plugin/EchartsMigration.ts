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
  private updateRAF: number | null = null; // 添加requestAnimationFrame标识符
  private pendingUpdate: boolean = false; // 标记是否有待处理的更新
  private resizeRAF: number | null = null; // 添加resize的requestAnimationFrame标识符

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
      pathEffect: 'path',
      pathSymbol: planePath, // 默认使用飞机图标
      pathSymbolColor: '#1E90FF', // 默认蓝色飞机
      symbolSize: 16, // 增大默认点大小
      lineStyle: {
        width: 1,
        opacity: 0.6,
        type: 'solid',
        curveness: 0.2,
        color: undefined
      },
      rippleEffect: {
        show: true, // 默认显示波动效果
        period: 2.5, // 更快的周期使波动更明显
        scale: 3.0, // 更大的波动效果
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
      
      // 绑定缩放结束处理方法
      const boundHandleZoomEnd = this.handleZoomEnd.bind(this);
      (this as any)._boundHandleZoomEnd = boundHandleZoomEnd;
      
      // 地图移动事件，使用绑定的方法
      this.map.on('move', boundUpdatePosition);
      this.map.on('zoom', boundUpdatePosition);
      this.map.on('zoomend', boundHandleZoomEnd);
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
    // 如果已经有一个更新请求在进行中，标记为需要更新但不再请求新的帧
    if (this.updateRAF !== null) {
      this.pendingUpdate = true;
      return;
    }

    // 请求一个动画帧来执行更新
    this.updateRAF = window.requestAnimationFrame(() => {
      if (this.chart) {
        this.chart.setOption({
          lmap: {
            center: [this.map.getCenter().lng, this.map.getCenter().lat],
            zoom: this.map.getZoom()
          }
        });

        // 检查是否在执行此更新时又有新的更新请求
        this.updateRAF = null;
        if (this.pendingUpdate) {
          this.pendingUpdate = false;
          // 如果有待处理的更新，再次请求更新
          this.updateRAF = window.requestAnimationFrame(() => {
            this.updateRAF = null;
            if (this.chart) {
              this.chart.setOption({
                lmap: {
                  center: [this.map.getCenter().lng, this.map.getCenter().lat],
                  zoom: this.map.getZoom()
                }
              });
            }
          });
        }
      } else {
        this.updateRAF = null;
      }
    });
  }

  /**
   * 处理地图缩放结束事件
   * 在缩放完成后使用requestAnimationFrame平滑刷新飞线图
   * @private
   */
  private handleZoomEnd(): void {
    if (!this.enabled || !this.chart) return;
    
    // 取消之前的请求
    if (this.resizeRAF !== null) {
      window.cancelAnimationFrame(this.resizeRAF);
    }
    
    // 延迟执行布局刷新以确保平滑过渡
    this.resizeRAF = window.requestAnimationFrame(() => {
      if (this.chart) {
        // 重新调整大小并刷新
        this.chart.resize();
        
        // 使用新的缩放级别刷新图表
        this.chart.setOption({
          animation: true,
          animationDuration: 300,
          animationEasing: 'cubicOut',
          lmap: {
            center: [this.map.getCenter().lng, this.map.getCenter().lat],
            zoom: this.map.getZoom()
          }
        });
        
        // 如果有数据，确保渲染正确
        if (this.data.length > 0 && this.isAnimating) {
          // 轻量刷新飞线动画，保持流畅性
          window.requestAnimationFrame(() => {
            if (this.chart && this.isAnimating) {
              this.chart.dispatchAction({
                type: 'lines:startEffect'
              });
            }
            this.resizeRAF = null;
          });
        } else {
          this.resizeRAF = null;
        }
      } else {
        this.resizeRAF = null;
      }
    });
  }

  /**
   * 禁用飞线图
   */
  public disable(): boolean {
    if (!this.enabled) return true;
    
    try {
      // 停止动画
      this.stop();
      
      // 取消任何待处理的更新帧
      if (this.updateRAF !== null) {
        window.cancelAnimationFrame(this.updateRAF);
        this.updateRAF = null;
        this.pendingUpdate = false;
      }
      
      // 取消任何待处理的缩放结束帧
      if (this.resizeRAF !== null) {
        window.cancelAnimationFrame(this.resizeRAF);
        this.resizeRAF = null;
      }
      
      // 清除数据
      this.data = [];
      
      // 清除图表
      if (this.chart) {
        // 完全重置图表选项，移除所有系列数据
        this.chart.setOption({
          animation: false, // 禁用动画过渡效果，立即清除
          lmap: {
            center: [this.map.getCenter().lng, this.map.getCenter().lat],
            zoom: this.map.getZoom(),
            roam: true,
            renderOnMoving: true
          },
          series: [] // 清空所有系列
        }, true); // 使用notMerge=true以完全替换选项，而不是合并
        
        // 确保重置任何悬停状态
        this.chart.dispatchAction({
          type: 'downplay'
        });
        
        // 如果当前启用状态，重建echarts实例以完全清除
        if (this.enabled) {
          // 销毁当前实例
          this.chart.dispose();
          
          // 如果容器还存在，重新创建echarts实例
          if (this.echartsLayer) {
            // 初始化echarts实例
            this.chart = echarts.init(this.echartsLayer);
            
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
              series: [] // 开始时不设置任何系列数据
            }, true);
            
            // 禁用ECharts的默认交互
            this.chart.getZr().setCursorStyle('inherit');
            this.chart.getZr().off('mousedown');
            this.chart.getZr().off('mouseup');
            this.chart.getZr().off('mousemove');
            
            info('飞线图实例已重建');
          }
        }
      }
      
      // 移除地图事件监听器
      if ((this as any)._boundUpdatePosition) {
        this.map.off('move', (this as any)._boundUpdatePosition);
        this.map.off('zoom', (this as any)._boundUpdatePosition);
        this.map.off('resize', (this as any)._boundUpdatePosition);
        (this as any)._boundUpdatePosition = null;
      }
      
      // 移除缩放结束事件监听器
      if ((this as any)._boundHandleZoomEnd) {
        this.map.off('zoomend', (this as any)._boundHandleZoomEnd);
        (this as any)._boundHandleZoomEnd = null;
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
      
      // 检查是否为空数据
      if (this.data.length === 0) {
        return this.clearData();
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
   * 获取ECharts配置选项
   * 统一处理配置生成逻辑，确保配置一致性
   * @param customOptions 自定义选项，用于覆盖默认选项
   * @returns ECharts配置对象
   */
  private getOption(customOptions: Partial<any> = {}): any {
    if (!this.chart) {
      warn('图表实例不存在，无法获取配置');
      return {};
    }
    
    try {
      // 获取线条样式，必须保证存在
      const lineStyle = this.options.lineStyle || {
        width: 2,
        opacity: 0.8,
        type: 'solid',
        curveness: 0.2
      };
      
      // 获取曲率设置
      const curveness = lineStyle.curveness || 0.2;
      
      // 获取线条宽度、透明度和类型
      const lineWidth = lineStyle.width || 2;
      const lineOpacity = lineStyle.opacity || 0.8;
      const lineType = lineStyle.type || 'solid';
      const lineColor = lineStyle.color;
      
      // 获取涟漪效果配置
      const rippleEffect = this.options.rippleEffect || {
        period: 3,
        scale: 2.5,
        brushType: 'fill'
      };
      
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
            width: (weight || 1) * lineWidth,
            color: color || lineColor || undefined,
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
            color: point.color || lineColor || undefined
          }
        };
      });
      
      // 确定是否使用3D效果
      const is3D = this.options.enable3D === true;
      
      // 自定义飞机图标路径
      const planePath = 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z';
      
      // 获取用户配置的图标
      const symbol = this.options.pathSymbol || this.options.effect?.symbol || planePath;
      
      // 获取图标颜色
      const symbolColor = this.options.pathSymbolColor || this.options.effect?.color || '#00BFFF';
      
      // 基础配置选项
      const baseOption: any = {
        animation: this.options.animation,
        animationDuration: this.options.animationDuration,
        animationEasing: this.options.animationEasing,
        animationDelay: this.options.animationDelay,
        series: [
          // 飞线图系列
          {
            type: 'lines',
            coordinateSystem: 'lmap',
            zlevel: is3D ? 2 : 2, // 提高飞线的zlevel，确保其显示在散点上方
            z: 2, // 增加z值，控制同zlevel中的显示顺序
            // 使用曲线效果
            polyline: false,
            // 曲率配置
            lineStyle: {
              width: lineWidth,
              opacity: lineOpacity,
              // 动态缓动线效果
              type: lineType,
              curveness: curveness,
              color: lineColor
            },
            // 是否启用动画效果
            effect: this.options.pathEffect === 'none' ? undefined : {
              show: this.options.effect?.show !== false, // 默认显示
              period: this.options.effect?.period || 6,
              trailLength: this.options.effect?.trailLength || 0,
              color: symbolColor,
              symbolSize: this.options.effect?.symbolSize || this.options.symbolSize,
              symbol: symbol,
              loop: this.options.effect?.loop !== false, // 默认循环
            },
            // 数据项
            data: seriesData
          },
          // 目标点散点图效果
          {
            name: '目标点',
            type: 'effectScatter',
            coordinateSystem: 'lmap',
            zlevel: is3D ? 1 : 1, // 降低散点的zlevel，确保其显示在飞线下方
            z: 1, // 设置较低的z值
            // 散点大小 - 直接使用配置的symbolSize
            symbolSize: this.options.symbolSize,
            // 波动效果
            rippleEffect: {
              // 支持show属性控制波动效果显示/隐藏
              show: rippleEffect.show !== false,
              period: rippleEffect.period || 2.5,
              // 使用用户配置的scale值，默认值设置更大
              scale: rippleEffect.show === false ? 0 : (typeof rippleEffect.scale === 'number' ? rippleEffect.scale : 3.5),
              brushType: rippleEffect.brushType || 'fill'
            },
            // 添加特效显示设置，确保波动效果生效
            showEffectOn: 'render',
            // 添加特效渲染器类型
            effectType: 'ripple',
            // 设置散点形状
            symbol: 'circle',
            // 标签设置
            label: {
              // 显示标签
              show: this.options.label?.show === true,
              position: this.options.label?.position || 'right',
              formatter: this.options.label?.formatter || '{b}',
              // 确保标签可见性的样式
              fontSize: this.options.label?.fontSize || 12,
              color: this.options.label?.color || '#fff',
              textBorderColor: this.options.label?.textBorderColor || '#000',
              textBorderWidth: this.options.label?.textBorderWidth || 2,
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: [3, 5]
            },
            // 是否启用鼠标悬停动画
            hoverAnimation: this.options.hoverAnimation,
            // 散点样式
            itemStyle: {
              shadowBlur: 15,
              shadowColor: 'rgba(255, 36, 50, 0.7)',
              opacity: 0.9,
              // 添加边框增强视觉效果
              borderColor: '#fff',
              borderWidth: 2,
              // 添加颜色
              color: function(params) {
                // 使用数据项颜色或默认颜色
                return params.data.itemStyle?.color || lineColor || '#ff5252';
              }
            },
            // 数据项
            data: effectScatterData
          }
        ]
      };
      
      // 合并自定义选项
      const mergedOption = this.mergeOptions(baseOption, customOptions);
      
      return mergedOption;
    } catch (e) {
      error('生成配置选项失败:', e);
      return {};
    }
  }
  
  /**
   * 合并配置选项，支持深度合并
   * @param baseOption 基础配置
   * @param customOption 自定义配置
   * @returns 合并后的配置
   */
  private mergeOptions(baseOption: any, customOption: any): any {
    if (!customOption || typeof customOption !== 'object') {
      return baseOption;
    }
    
    const result = { ...baseOption };
    
    Object.keys(customOption).forEach(key => {
      const value = customOption[key];
      
      // 如果是对象且不是数组，进行递归合并
      if (value && typeof value === 'object' && !Array.isArray(value) && 
          baseOption[key] && typeof baseOption[key] === 'object' && !Array.isArray(baseOption[key])) {
        result[key] = this.mergeOptions(baseOption[key], value);
      } else {
        // 否则直接覆盖
        result[key] = value;
      }
    });
    
    return result;
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
      // 输出关键参数值，帮助调试
      info(`应用飞线配置: symbolSize=${this.options.symbolSize}, rippleEffect.scale=${this.options.rippleEffect?.scale || 0}, label.show=${this.options.label?.show}`);

      // 使用getOption方法获取配置
      const option = this.getOption();
      
      // 应用配置
      this.chart.setOption(option);
      
      info(`已应用${this.data.length}条飞线数据到图表`);
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
      
      // 输出开始动画时的关键参数，用于调试
      info(`开始飞线动画: 散点大小=${this.options.symbolSize}, 波动效果scale=${this.options.rippleEffect?.scale || 0}`);
      
      // 使用getOption方法获取带动画效果的配置
      const animationOption = this.getOption({
        series: [
          {
            // 飞线动画
            type: 'lines',
            zlevel: this.options.enable3D ? 2 : 2, // 保持飞线的zlevel为2
            z: 2, // 保持z值为2
            effect: {
              show: true,
              period: this.options.effect?.period || 6,
              trailLength: this.options.effect?.trailLength || 0,
              loop: this.options.loop !== false
            }
          },
          {
            // 散点动画
            type: 'effectScatter',
            zlevel: this.options.enable3D ? 1 : 1, // 保持散点的zlevel为1
            z: 1, // 保持z值为1
            // 设置波动效果
            rippleEffect: {
              show: this.options.rippleEffect?.show !== false, // 使用配置的show属性，默认为true
              period: this.options.rippleEffect?.period || 2.5,
              scale: this.options.rippleEffect?.show === false ? 0 : (typeof this.options.rippleEffect?.scale === 'number' ? this.options.rippleEffect.scale : 3.5),
              brushType: this.options.rippleEffect?.brushType || 'fill'
            },
            // 添加特效显示设置，确保波动效果生效
            showEffectOn: 'render',
            // 添加特效渲染器类型
            effectType: 'ripple',
            // 设置散点形状
            symbol: 'circle',
            // 调整散点不透明度，减少对飞线的干扰
            itemStyle: {
              opacity: 0.7
            }
          }
        ]
      });
      
      // 应用动画配置
      this.chart.setOption(animationOption);
      
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
              show: false, // 隐藏波动效果
              scale: 0
            },
            // 保持特效渲染器类型一致，但禁用特效渲染
            showEffectOn: 'none',
            effectType: 'none',
            // 减少散点不透明度，进一步减轻视觉干扰
            itemStyle: {
              opacity: 0.5,
              shadowBlur: 0
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
        // 完全重置图表选项，移除所有系列数据
        this.chart.setOption({
          animation: false, // 禁用动画过渡效果，立即清除
          lmap: {
            center: [this.map.getCenter().lng, this.map.getCenter().lat],
            zoom: this.map.getZoom(),
            roam: true,
            renderOnMoving: true
          },
          series: [] // 清空所有系列
        }, true); // 使用notMerge=true以完全替换选项，而不是合并
        
        // 确保重置任何悬停状态
        this.chart.dispatchAction({
          type: 'downplay'
        });
        
        // 如果当前启用状态，重建echarts实例以完全清除
        if (this.enabled) {
          // 销毁当前实例
          this.chart.dispose();
          
          // 如果容器还存在，重新创建echarts实例
          if (this.echartsLayer) {
            // 初始化echarts实例
            this.chart = echarts.init(this.echartsLayer);
            
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
              series: [] // 开始时不设置任何系列数据
            }, true);
            
            // 禁用ECharts的默认交互
            this.chart.getZr().setCursorStyle('inherit');
            this.chart.getZr().off('mousedown');
            this.chart.getZr().off('mouseup');
            this.chart.getZr().off('mousemove');
            
            info('飞线图实例已重建');
          }
        }
      }
      
      info('飞线图数据已清除');
      return true;
    } catch (e) {
      error('清除飞线图数据失败:', e);
      return false;
    }
  }

  /**
   * 更新飞线图配置选项
   * @param options 要更新的选项
   * @returns 是否更新成功
   */
  public updateOptions(options: Partial<MigrationOptions>): boolean {
    try {
      const wasAnimating = this.isAnimating;
      
      // 合并选项
      this.options = { ...this.options, ...options };
      
      // 确保lineStyle存在
      if (!this.options.lineStyle) {
        this.options.lineStyle = {
          width: 2,
          opacity: 0.8,
          type: 'solid',
          curveness: 0.2
        };
      }
      
      // 如果图表已创建并启用，应用更新
      if (this.enabled && this.chart) {
        // 如果在动画中且设置了不动画，先停止动画以避免冲突
        if (wasAnimating && options.animation === false) {
          this.stop();
        }
        
        // 立即重新应用数据，这会使用新配置
        this.applyData();
        
        // 记录已应用的关键配置值，便于调试
        info(`应用飞线配置: symbolSize=${this.options.symbolSize}, label.show=${this.options.label?.show}, rippleEffect.scale=${this.options.rippleEffect?.scale}, lineStyle=${this.options.lineStyle ? JSON.stringify(this.options.lineStyle) : '未设置'}`);
        
        // 如果动画状态需要改变
        if (wasAnimating && !this.isAnimating && this.options.animation !== false) {
          // 短暂延迟后重新启动动画，确保配置已完全应用
          setTimeout(() => {
            this.start();
          }, 50);
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
   * 强制刷新飞线图
   * 该方法用于在更新选项后强制刷新ECharts实例，确保散点大小、波动效果和名称显示等选项立即生效
   */
  public refreshMigration(): boolean {
    try {
      if (!this.enabled || !this.chart) {
        warn('飞线图未启用或图表实例不存在，无法刷新');
        return false;
      }

      // 记录当前动画状态和关键配置值
      const wasAnimating = this.isAnimating;
      const symbolSize = this.options.symbolSize;
      const rippleScale = this.options.rippleEffect?.scale;
      const labelShow = this.options.label?.show;
      
      // 获取线条样式，必须保证存在
      const lineStyle = this.options.lineStyle || {
        width: 2,
        opacity: 0.8,
        type: 'solid',
        curveness: 0.2
      };
      
      // 获取线条样式
      const lineWidth = lineStyle.width || 2;
      const lineOpacity = lineStyle.opacity || 0.8;
      const lineType = lineStyle.type || 'solid';
      const curveness = lineStyle.curveness || 0.2;
      const lineColor = lineStyle.color;
      
      // 输出刷新前的状态，帮助调试
      info(`开始刷新飞线图: 当前symbolSize=${symbolSize}, rippleScale=${rippleScale}, labelShow=${labelShow}, 动画状态=${wasAnimating ? '运行中' : '停止'}`);
      
      // 如果正在动画中，先停止动画
      if (wasAnimating) {
        this.stop();
      }
      
      // 强制重新应用数据和所有配置
      this.applyData();
      
      // 确保图表尺寸正确
      this.chart.resize();
      
      // 使用getOption方法，创建包含明确设置所有关键参数的配置
      const refreshOption = this.getOption({
        series: [
          {
            // 线条
            type: 'lines',
            zlevel: this.options.enable3D ? 2 : 2, // 保持飞线的zlevel为2
            z: 2, // 保持z值为2
            lineStyle: {
              width: lineWidth,
              opacity: lineOpacity,
              type: lineType,
              curveness: curveness,
              color: lineColor
            },
            // 明确设置动画效果
            effect: this.options.pathEffect === 'none' ? undefined : {
              show: this.options.effect?.show !== false,
              period: this.options.effect?.period || 6,
              trailLength: this.options.effect?.trailLength || 0.7,
              color: this.options.pathSymbolColor || lineColor || '#00BFFF',
              symbolSize: symbolSize, // 使用记录的symbolSize确保正确值
              symbol: this.options.pathSymbol || this.options.effect?.symbol || 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z',
              loop: this.options.effect?.loop !== false || this.options.loop !== false
            }
          },
          {
            // 散点
            type: 'effectScatter',
            zlevel: this.options.enable3D ? 1 : 1, // 保持散点的zlevel为1
            z: 1, // 保持z值为1
            // 明确设置散点大小 - 使用记录的symbolSize，确保正确值
            symbolSize: symbolSize,
            // 明确设置波动效果 - 使用记录的rippleScale，确保正确值
            rippleEffect: {
              show: rippleScale !== undefined ? true : false, // 确保始终设置show属性
              period: this.options.rippleEffect?.period || 2.5,
              scale: rippleScale !== undefined ? rippleScale : (this.options.rippleEffect?.scale || 3.5),
              brushType: this.options.rippleEffect?.brushType || 'fill'
            },
            // 添加特效显示设置，确保波动效果生效
            showEffectOn: 'render',
            // 添加特效渲染器类型
            effectType: 'ripple',
            // 设置散点形状
            symbol: 'circle',
            // 添加散点阴影效果
            itemStyle: {
              shadowBlur: 15,
              shadowColor: 'rgba(255, 36, 50, 0.7)',
              opacity: 0.9,
              // 添加边框增强视觉效果
              borderColor: '#fff',
              borderWidth: 2,
              // 添加颜色
              color: function(params) {
                // 使用数据项颜色或默认颜色
                return params.data.itemStyle?.color || lineColor || '#ff5252';
              }
            },
            // 明确设置标签显示 - 使用记录的labelShow，确保正确值
            label: {
              show: labelShow === true, // 确保布尔值处理正确
              position: this.options.label?.position || 'right',
              formatter: this.options.label?.formatter || '{b}',
              fontSize: this.options.label?.fontSize || 12,
              color: this.options.label?.color || '#ffffff',
              textBorderColor: this.options.label?.textBorderColor || '#000000',
              textBorderWidth: this.options.label?.textBorderWidth || 2,
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: [3, 5]
            },
            hoverAnimation: this.options.hoverAnimation === true
          }
        ]
      });
      
      // 应用刷新配置
      this.chart.setOption(refreshOption, true); // 第二个参数设为true表示不合并配置，强制覆盖
      
      // 如果之前在动画中，延迟重新启动动画
      if (wasAnimating) {
        // 短暂延迟后重新启动动画，确保配置已完全应用
        setTimeout(() => {
          this.start();
          info('动画已重新启动');
        }, 100);
      }
      
      info('飞线图已刷新完成');
      return true;
    } catch (e) {
      error('刷新飞线图失败:', e);
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
    
    // 取消所有待处理的动画帧
    if (this.updateRAF !== null) {
      window.cancelAnimationFrame(this.updateRAF);
      this.updateRAF = null;
      this.pendingUpdate = false;
    }
    
    // 取消所有待处理的缩放结束帧
    if (this.resizeRAF !== null) {
      window.cancelAnimationFrame(this.resizeRAF);
      this.resizeRAF = null;
    }
    
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