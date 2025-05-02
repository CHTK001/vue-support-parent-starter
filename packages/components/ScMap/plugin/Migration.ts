import type { Map as LeafletMap, PathOptions, LatLng, Layer, Polyline } from 'leaflet';
import L from 'leaflet';
import { info, warn, error } from "@repo/utils";
import 'leaflet-ant-path';
import type { MigrationBase } from './MigrationBase';

/**
 * 迁徙图数据点接口
 */
export interface MigrationPoint {
  from: [number, number]; // 起点坐标 [经度, 纬度]
  to: [number, number];   // 终点坐标 [经度, 纬度]
  labels?: {
    from?: string;        // 起点标签
    to?: string;          // 终点标签
  };
  color?: string;         // 线条颜色
  weight?: number;        // 权重，影响线条粗细
  time?: number;          // 从起点到终点的时间(毫秒)
}

/**
 * 迁徙图选项接口
 */
export interface MigrationOptions {
  // 线样式配置
  lineStyle?: {
    color?: string;         // 线条颜色
    weight?: number;        // 线宽
    opacity?: number;       // 不透明度
  };
  // Ant-Path 特定配置
  antPath?: {
    paused?: boolean;              // 是否暂停动画，默认false
    reverse?: boolean;             // 是否反转动画方向，默认false
    hardwareAccelerated?: boolean; // 是否启用硬件加速，默认false
    pulseColor?: string;           // 脉冲颜色，默认'white'
    delay?: number;                // 动画延迟时间(ms)，默认400
    dashArray?: [number, number] | string; // 虚线样式，默认"10, 20"
  };
  // 其他配置
  autoStart?: boolean;       // 是否自动开始动画
  loop?: boolean;            // 是否循环播放
  hideAfterCompletion?: boolean; // 动画结束后是否隐藏线条
}

/**
 * 迁徙图事件类型
 */
export type MigrationEventType = 'migration-completed' | 'migration-started' | 'migration-data-updated';

/**
 * 迁徙图事件监听器类型
 */
export type MigrationEventListener = (event?: any) => void;

/**
 * 迁徙图插件类
 */
export class Migration implements MigrationBase {
  private map: LeafletMap;
  private antPathLayers: Map<string, any> = new Map();
  private enabled: boolean = false;
  private options: MigrationOptions;
  private data: MigrationPoint[] = [];
  private eventListeners: Map<MigrationEventType, Set<MigrationEventListener>> = new Map();
  private isAnimating: boolean = false;
  private layerGroup: L.LayerGroup;

  /**
   * 构造函数
   * @param map Leaflet地图对象
   * @param options 迁徙图配置选项
   */
  constructor(map: LeafletMap, options: MigrationOptions = {}) {
    this.map = map;
    
    // 默认选项
    const defaultOptions: MigrationOptions = {
      lineStyle: {
        color: 'rgba(41, 128, 185, 0.8)',
        weight: 2,
        opacity: 0.8
      },
      antPath: {
        paused: false,
        reverse: false,
        hardwareAccelerated: false,
        pulseColor: 'white',
        delay: 400,
        dashArray: [10, 20]
      },
      autoStart: false,
      loop: true,
      hideAfterCompletion: false
    };
    
    // 合并选项
    this.options = this.mergeOptions(defaultOptions, options);
    
    // 初始化事件监听器Map
    ['migration-completed', 'migration-started', 'migration-data-updated'].forEach(eventType => {
      this.eventListeners.set(eventType as MigrationEventType, new Set());
    });
    
    // 创建图层组来管理所有迁徙路径
    this.layerGroup = L.layerGroup();
  }

  /**
   * 合并选项
   * @param defaultOptions 默认选项
   * @param userOptions 用户自定义选项
   * @returns 合并后的选项
   */
  private mergeOptions(defaultOptions: MigrationOptions, userOptions: MigrationOptions): MigrationOptions {
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
   * 启用迁徙图
   */
  public enable(): boolean {
    if (this.enabled) return true;
    
    try {
      // 检查地图对象是否有效
      if (!this.map) {
        error('地图对象无效，无法启用迁徙图');
        return false;
      }
      
      // 检查地图是否正在执行缩放动画，如果是则延迟启用
      if (this.map._animatingZoom) {
        info('地图正在缩放动画中，延迟启用迁徙图');
        setTimeout(() => this.enable(), 400);
        return false;
      }
      
      // 关闭地图上所有弹窗，避免可能的错误
      if (typeof this.map.closePopup === 'function') {
        this.map.closePopup();
      }
      
      // 添加图层组到地图
      this.layerGroup.addTo(this.map);
      this.enabled = true;
      
      // 如果有数据，设置数据
      if (this.data.length > 0) {
        this.setData(this.data, false); // 不自动开始动画
      }
      
      // 如果配置了自动开始，则开始动画
      if (this.options.autoStart) {
        setTimeout(() => this.start(), 100);
      }
      
      info('迁徙图已启用');
      return true;
    } catch (e) {
      error('启用迁徙图失败:', e);
      return false;
    }
  }

  /**
   * 禁用迁徙图
   */
  public disable(): boolean {
    if (!this.enabled) return true;
    
    try {
      // 停止动画
      this.stop();
      
      // 从地图移除图层组
      if (this.layerGroup) {
        this.map.removeLayer(this.layerGroup);
      }
      
      this.enabled = false;
      info('迁徙图已禁用');
      return true;
    } catch (e) {
      error('禁用迁徙图失败:', e);
      return false;
    }
  }

  /**
   * 切换迁徙图启用状态
   */
  public toggle(): boolean {
    return this.enabled ? this.disable() : this.enable();
  }

  /**
   * 判断迁徙图是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置迁徙图数据
   * @param data 迁徙图数据点数组
   * @param startAnimation 是否自动开始动画
   */
  public setData(data: MigrationPoint[], startAnimation: boolean = true): boolean {
    try {
      // 保存数据
      this.data = data || [];
      
      // 如果没有启用，仅保存数据
      if (!this.enabled) {
        info(`迁徙图数据已更新（${data.length}条路径），但迁徙图尚未启用`);
        return true;
      }
      
      // 清除现有路径
      this.clearLayers();
      
      // 创建新的Ant路径
      data.forEach((point, index) => {
        try {
          const { from, to, color, weight } = point;
          
          // 创建路径点
          const pathPoints = [
            L.latLng(from[1], from[0]), // 注意这里经纬度顺序
            L.latLng(to[1], to[0])
          ];
          
          // 设置AntPath选项
          const pathOptions: any = {
            color: color || this.options.lineStyle.color,
            weight: weight || this.options.lineStyle.weight,
            opacity: this.options.lineStyle.opacity,
            // AntPath特定选项
            paused: this.options.antPath.paused,
            reverse: this.options.antPath.reverse,
            hardwareAccelerated: this.options.antPath.hardwareAccelerated,
            pulseColor: this.options.antPath.pulseColor,
            delay: point.time || this.options.antPath.delay,
            dashArray: this.options.antPath.dashArray
          };
          
          // 使用leaflet-ant-path创建动画路径
          const antPath = L.polyline.antPath(pathPoints, pathOptions);
          
          // 将路径添加到图层组
          this.antPathLayers.set(`path_${index}`, antPath);
          this.layerGroup.addLayer(antPath);
          
          // 如果有标签，添加标签
          if (point.labels) {
            if (point.labels.from) {
              L.marker(pathPoints[0], {
                icon: L.divIcon({
                  className: 'migration-label',
                  html: `<div>${point.labels.from}</div>`
                })
              }).addTo(this.layerGroup);
            }
            
            if (point.labels.to) {
              L.marker(pathPoints[1], {
                icon: L.divIcon({
                  className: 'migration-label',
                  html: `<div>${point.labels.to}</div>`
                })
              }).addTo(this.layerGroup);
            }
          }
        } catch (e) {
          error(`创建迁徙路径#${index}失败:`, e);
        }
      });
      
      // 如果需要自动开始动画且已启用
      if (startAnimation && this.enabled) {
        this.start();
      }
      
      this.emit('migration-data-updated', { count: data.length });
      info(`迁徙图数据已更新，共${data.length}条路径`);
      return true;
    } catch (e) {
      error('设置迁徙图数据失败:', e);
      return false;
    }
  }

  /**
   * 清除所有图层
   */
  private clearLayers(): void {
    if (this.layerGroup) {
      this.layerGroup.clearLayers();
      this.antPathLayers.clear();
    }
  }

  /**
   * 开始动画
   */
  public start(): boolean {
    if (!this.enabled) {
      warn('迁徙图未启用，无法开始动画');
      return false;
    }
    
    try {
      // 遍历所有AntPath图层，取消暂停状态
      this.antPathLayers.forEach(antPath => {
        if (antPath.resume) {
          antPath.resume();
        } else if (antPath.options) {
          antPath.options.paused = false;
          antPath.redraw();
        }
      });
      
      this.isAnimating = true;
      this.emit('migration-started');
      info('迁徙图动画已启动');
      return true;
    } catch (e) {
      error('启动迁徙图动画失败:', e);
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
      // 遍历所有AntPath图层，暂停动画
      this.antPathLayers.forEach(antPath => {
        if (antPath.pause) {
          antPath.pause();
        } else if (antPath.options) {
          antPath.options.paused = true;
          antPath.redraw();
        }
      });
      
      this.isAnimating = false;
      this.emit('migration-completed');
      info('迁徙图动画已停止');
      return true;
    } catch (e) {
      error('停止迁徙图动画失败:', e);
      return false;
    }
  }

  /**
   * 获取当前迁徙图数据
   */
  public getData(): MigrationPoint[] {
    return [...this.data];
  }

  /**
   * 清除迁徙图数据
   */
  public clearData(): boolean {
    this.data = [];
    this.clearLayers();
    info('迁徙图数据已清除');
    return true;
  }

  /**
   * 更新迁徙图选项
   * @param options 迁徙图选项
   */
  public updateOptions(options: Partial<MigrationOptions>): boolean {
    this.options = this.mergeOptions(this.options, options);
    
    const wasEnabled = this.enabled;
    const hadData = this.data.length > 0;
    
    try {
      // 先禁用
      if (wasEnabled) {
        this.disable();
      }
      
      // 再重新启用
      if (wasEnabled) {
        this.enable();
        
        // 重新设置数据
        if (hadData) {
          this.setData(this.data, false);
        }
      }
      
      return true;
    } catch (e) {
      error('更新迁徙图选项失败:', e);
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
   * 销毁迁徙图实例
   */
  public destroy(): void {
    this.disable();
    this.clearData();
    this.eventListeners.clear();
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