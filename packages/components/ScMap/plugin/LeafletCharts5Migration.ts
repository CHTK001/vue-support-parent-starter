/**
 * LeafletCharts5Migration.ts
 * 
 * 基于自定义实现的leaflet-charts5.ts的飞线图实现
 * 专门为Echarts 5设计，解决了原leaflet-echarts中的问题
 */

import { info, warn, error } from "@repo/utils";
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
// 导入完整版本的echarts，确保有所有注册方法
import * as echarts from "echarts";
import type { ECharts, EChartsCoreOption } from 'echarts';
import type { MigrationBase, MigrationEventType, MigrationEventListener, MigrationPoint } from './MigrationBase';
import type { MigrationOptions } from "./types";
import { LeafletEChartsLayer } from './leaflet-charts5';
import { nextTick } from "vue";

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
  private initRetries: number = 0;
  private maxInitRetries: number = 5;

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
      console.info('正在启用飞线图...');
      
      // 首先确保全局地图实例引用存在
      if (this.map && typeof window !== 'undefined') {
        (window as any).__leafletMap = this.map;
        (window as any).__leafletMapLastUpdated = Date.now();
      }
      
      // 创建并添加echarts图层
      this.echartsLayer = new LeafletEChartsLayer(this.map);
      this.map.addLayer(this.echartsLayer);
      
      // 延迟初始化
      setTimeout(() => {
        // 获取echarts实例
        this.chart = this.echartsLayer?.getECharts();
        
        if (this.chart) {
          // 再次确保地图实例引用存在
          if (this.map && typeof window !== 'undefined') {
            (window as any).__leafletMap = this.map;
            (window as any).__leafletMapLastUpdated = Date.now();
          }
          
          try {
            // 设置基础配置 - 使用leaflet坐标系
            this.chart.setOption({
              animation: true,
              // 明确设置leaflet组件
              leaflet: {
                roam: true,
                // 添加唯一ID，确保leaflet组件能被找到
                id: 'leaflet-migration-' + Date.now()
              },
              // 移除其他可能的坐标系
              xAxis: undefined,
              yAxis: undefined,
              geo: undefined,
              grid: undefined,
              series: [{
                type: 'lines',
                coordinateSystem: 'leaflet',
                // 即使没有数据也设置一个空数组，确保系列被创建
                data: []
              }]
            }, true); // 使用notMerge=true避免配置混合
            
            // 强制更新图表，确保坐标系初始化
            if (this.echartsLayer) {
              // 第一次更新可能失败，延迟执行确保成功
              setTimeout(() => {
                if (this.echartsLayer) {
                  try {
                    this.echartsLayer.update();
                    console.info('飞线图图层已初始化并更新');
                    
                    // 如果有数据则应用，延迟500ms确保坐标系已初始化
                    if (this.data.length > 0) {
                      setTimeout(() => {
                        if (this.chart) {
                          this.applyDirectOption();
                        }
                      }, 500);
                    }
                  } catch (e) {
                    console.warn('初始更新图表失败:', e);
                  }
                }
              }, 200);
            }
          } catch (e) {
            console.error('设置初始配置失败:', e);
          }
        } else {
          console.error('echarts实例获取失败');
          // 重试逻辑
          if (this.initRetries < this.maxInitRetries) {
            this.initRetries++;
            console.warn(`初始化失败，正在尝试重新初始化 (${this.initRetries}/${this.maxInitRetries})...`);
            setTimeout(() => {
              this.disable();
              this.enable();
            }, 300);
          }
        }
      }, 800); // 增加延迟以确保地图完全加载
      
      this.enabled = true;
      
      this.emit('migration-started');
      return true;
    } catch (e) {
      console.error('启用飞线图失败:', e);
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
        this.isAnimating = false; // 直接设置状态，避免调用stop方法
      }
      
      // 移除图层前先清理ECharts实例
      if (this.chart) {
        try {
          // 清空图表内容
          this.chart.clear();
          // 设置为空选项
          this.chart.setOption({}, true);
          this.chart = null;
        } catch (e) {
          console.warn('清理ECharts实例失败:', e);
        }
      }
      
      // 移除图层
      if (this.echartsLayer) {
        try {
          this.map.removeLayer(this.echartsLayer);
        } catch (e) {
          console.warn('移除ECharts图层失败:', e);
        }
        this.echartsLayer = null;
      }
      
      this.enabled = false;
      
      info('leaflet-charts5飞线图已禁用');
      return true;
    } catch (e) {
      error('禁用leaflet-charts5飞线图失败:', e);
      return false;
    }
  }

  /**
   * 切换飞线图状态
   */
  public toggle(): boolean {
    if (this.enabled) {
      return this.disable();
    } else {
      return this.enable();
    }
  }

  /**
   * 判断飞线图是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置飞线图数据
   */
  public setData(data: MigrationPoint[], startAnimation: boolean = true): boolean {
    try {
      console.info(`设置飞线图数据，${data?.length || 0}条路径`);
      
      // 保存有效数据
      this.data = this.validateData(data);
      
      if (this.enabled && this.chart) {
        // 尝试在设置数据前确保坐标系已注册
        const ensureCoordinateSystem = () => {
          try {
            // 设置极简配置避免坐标系统问题
            this.applyDirectOption();
            
            if (startAnimation) {
              setTimeout(() => this.start(), 300);
            }
          } catch (e) {
            console.error('应用飞线图配置失败:', e);
          }
        };
        
        // 先确保leaflet组件存在，强制重新创建坐标系
        this.chart.setOption({
          leaflet: {
            roam: true,
            id: 'leaflet-migration-' + Date.now()
          }
        }, false);
        
        // 延迟执行以确保坐标系已注册
        setTimeout(ensureCoordinateSystem, 100);
      } else if (!this.enabled) {
        // 如果飞线图尚未启用，先启用它
        this.enable();
        // 延迟设置数据
        setTimeout(() => {
          if (this.chart) {
            this.applyDirectOption();
            if (startAnimation) this.start();
          }
        }, 800);
      }
      
      return true;
    } catch (e) {
      console.error('设置飞线图数据失败:', e);
      return false;
    }
  }

  /**
   * 验证并处理数据，确保格式正确
   * @param data 原始数据
   * @returns 处理后的数据
   */
  private validateData(data: MigrationPoint[]): MigrationPoint[] {
    try {
      return data.filter((point, index) => {
        // 检查必要字段
        if (!point.from || !point.to || !Array.isArray(point.from) || !Array.isArray(point.to)) {
          warn(`飞线图数据点 #${index} 格式错误，必须包含from和to坐标`);
          return false;
        }
        
        // 检查坐标格式
        if (point.from.length < 2 || point.to.length < 2) {
          warn(`飞线图数据点 #${index} 坐标格式错误，必须是[lng, lat]格式`);
          return false;
        }
        
        // 检查坐标值范围 
        const fromLng = point.from[0];
        const fromLat = point.from[1];
        const toLng = point.to[0];
        const toLat = point.to[1];
        
        // 经度范围检查
        if (fromLng < -180 || fromLng > 180 || toLng < -180 || toLng > 180) {
          warn(`飞线图数据点 #${index} 经度值超出范围 (-180 到 180): [${fromLng}, ${toLng}]`);
          return false;
        }
        
        // 纬度范围检查
        if (fromLat < -90 || fromLat > 90 || toLat < -90 || toLat > 90) {
          warn(`飞线图数据点 #${index} 纬度值超出范围 (-90 到 90): [${fromLat}, ${toLat}]`);
          return false;
        }
        
        // 检查起点和终点是否相同
        if (fromLng === toLng && fromLat === toLat) {
          warn(`飞线图数据点 #${index} 起点和终点相同，将被忽略`);
          return false;
        }
        
        // 记录有效数据点
        info(`有效飞线数据点 #${index}: [${fromLng},${fromLat}] → [${toLng},${toLat}]`);
        return true;
      });
    } catch (e) {
      error('验证飞线图数据失败:', e);
      return [];
    }
  }

  /**
   * 直接应用简单的配置，避免坐标系统问题
   */
  private applyDirectOption(): void {
    if (!this.chart) return;
    
    try {
      // 转换数据为echarts格式
      const linesData = this.data.map(item => {
        // 确保坐标顺序正确：[经度, 纬度]
        return [
          // 起点 [经度, 纬度]
          [item.from[0], item.from[1]],
          // 终点 [经度, 纬度]
          [item.to[0], item.to[1]]
        ];
      });
      
      // 获取颜色
      const colors = this.data.map(item => item.color || '#1e88e5');
      
      // 确保全局地图实例引用存在
      if (this.map && typeof window !== 'undefined') {
        (window as any).__leafletMap = this.map;
        (window as any).__leafletMapLastUpdated = Date.now();
      }
      
      // 先尝试设置一个基础的leaflet配置，确保坐标系存在
      this.chart.setOption({
        leaflet: {
          roam: true,
          id: 'leaflet-migration-pre-' + Date.now()
        }
      }, false);
      
      // 创建使用leaflet坐标系的配置
      const option = {
        animation: true,
        // 确保有leaflet组件，系列才能找到坐标系
        leaflet: {
          roam: true,
          id: 'leaflet-migration-' + Date.now()
        },
        // 移除可能存在的其他坐标系
        xAxis: undefined,
        yAxis: undefined,
        geo: undefined,
        grid: undefined,
        series: [
          {
            name: '飞线',
            type: 'lines',
            // 明确设置坐标系类型
            coordinateSystem: 'leaflet',
            zlevel: 2,
            // 飞线特效
            effect: {
              show: this.isAnimating,
              period: 5,
              trailLength: 0.7,
              color: '#fff',
              symbolSize: 3
            },
            lineStyle: {
              color: colors,
              width: 1,
              opacity: 0.5,
              curveness: this.options.curvature || 0.2
            },
            // 基本数据
            data: linesData.map((coords, index) => {
              return {
                coords: coords,
                lineStyle: {
                  color: colors[index]
                }
              };
            })
          }
        ]
      };
      
      // 应用配置 - 使用notMerge避免配置混合导致坐标系错误
      this.chart.setOption(option, true);
      
      // 强制更新图表
      if (this.echartsLayer) {
        this.echartsLayer.update();
      }
      
      console.info('已应用飞线图配置');
    } catch (e) {
      console.error('应用飞线图配置失败', e);
    }
  }

  /**
   * 开始动画
   */
  public start(): boolean {
    if (!this.enabled || !this.chart) return false;
    
    try {
      this.isAnimating = true;
      
      // 设置动画属性，避免修改坐标系配置
      this.chart.setOption({
        series: [{
          type: 'lines',
          effect: {
            show: true
          }
        }]
      }, { 
        notMerge: false, // 使用merge确保只更新指定配置
        replaceMerge: ['series'] // 确保series被完整替换
      } as any);
      
      return true;
    } catch (e) {
      console.error('开始飞线图动画失败:', e);
      return false;
    }
  }

  /**
   * 停止动画
   */
  public stop(): boolean {
    if (!this.enabled || !this.chart) return true;
    
    try {
      this.isAnimating = false;
      
      // 关闭动画效果，避免修改坐标系配置
      this.chart.setOption({
        series: [{
          type: 'lines',
          effect: {
            show: false
          }
        }]
      }, {
        notMerge: false, // 使用merge确保只更新指定配置 
        replaceMerge: ['series'] // 确保series被完整替换
      } as any);
      
      return true;
    } catch (e) {
      console.error('停止飞线图动画失败:', e);
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
        this.applyDirectOption();
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