import type { Map as LeafletMap, LayerGroup, LatLng } from 'leaflet';
import L from 'leaflet';
import { info, warn, error } from "@repo/utils";

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
  // 迁徙线样式配置
  lineStyle?: {
    lineWidth?: number;    // 线宽
    lineDash?: number[];   // 虚线样式，如 [6, 3]
    strokeStyle?: string;  // 线条颜色，默认为 'rgba(200, 40, 0, 0.8)'
    shadowColor?: string;  // 阴影颜色，默认为 'rgba(200, 40, 0, 0.3)'
    shadowBlur?: number;   // 阴影模糊度
  };
  // 迁徙点样式配置
  pointStyle?: {
    radius?: number;         // 点半径，默认为 3
    fillStyle?: string;      // 填充颜色，默认为 'rgba(255, 255, 255, 0.8)'
    strokeStyle?: string;    // 描边颜色
    lineWidth?: number;      // 描边宽度
  };
  // 迁徙点动画配置
  animationStyle?: {
    interval?: number;       // 动画帧间隔，默认为 30
    speed?: number;          // 移动速度系数，默认为 1
    trailLength?: number;    // 轨迹长度，默认为 5
    max?: number;            // 同时运动的最大点数
  };
  // 标签配置
  label?: {
    show?: boolean;          // 是否显示标签
    font?: string;           // 字体，如 '14px Arial'
    fillStyle?: string;      // 填充颜色
    strokeStyle?: string;    // 描边颜色
    lineWidth?: number;      // 描边宽度
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
 * 自定义迁徙图Canvas图层类
 * 实现在Leaflet地图上用Canvas绘制迁徙图动画
 */
class MigrationCanvasLayer {
  private _map: LeafletMap;
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _container: HTMLElement;
  private _config: any;
  private _data: any[] = [];
  private _running: boolean = false;
  private _animationFrameId: number | null = null;
  private _lastTime: number = 0;
  private _particles: any[] = [];
  
  /**
   * 构造函数
   * @param config 配置项
   */
  constructor(config: any) {
    this._config = Object.assign({
      // 线样式配置
      lineStyle: {
        lineWidth: 2,
        strokeStyle: 'rgba(41, 128, 185, 0.8)',
        shadowColor: 'rgba(41, 128, 185, 0.3)',
        shadowBlur: 5
      },
      // 点样式配置
      pointStyle: {
        radius: 3,
        fillStyle: 'rgba(255, 255, 255, 0.8)',
        strokeStyle: 'rgba(41, 128, 185, 1)',
        lineWidth: 1
      },
      // 动画配置
      animationStyle: {
        interval: 30,
        speed: 1,
        trailLength: 5,
        max: 100
      },
      // 标签配置
      label: {
        show: false,
        font: '12px Arial',
        fillStyle: '#fff',
        strokeStyle: '#000',
        lineWidth: 2
      },
      // 是否循环播放
      loop: true,
      // 动画完成后是否隐藏线条
      hideAfterCompletion: false
    }, config);
    
    // 创建Canvas元素
    this._canvas = document.createElement('canvas');
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0';
    this._canvas.style.left = '0';
    this._canvas.style.pointerEvents = 'none';
    
    // 获取2D上下文
    const ctx = this._canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context initialization failed');
    }
    this._ctx = ctx;
    
    // 创建事件
    this._events = {
      animationComplete: [],
      animationStart: []
    };
  }
  
  /**
   * 添加到地图
   * @param map 地图对象
   */
  addTo(map: LeafletMap): this {
    if (!map) {
      console.error('无效的地图对象');
      return this;
    }
    
    this._map = map;
    
    // 获取地图容器
    if (!map.getContainer) {
      console.error('地图对象没有getContainer方法');
      return this;
    }
    
    this._container = map.getContainer();
    if (!this._container) {
      console.error('地图容器获取失败');
      return this;
    }
    
    // 添加Canvas到地图容器
    this._container.appendChild(this._canvas);
    
    // 设置Canvas大小
    this._resizeCanvas();
    
    // 监听地图事件
    map.on('resize', this._resizeCanvas, this);
    map.on('moveend', this._redraw, this);
    map.on('zoomend', this._redraw, this);
    
    // 首次绘制
    this._redraw();
    
    return this;
  }
  
  /**
   * 从地图移除
   */
  remove(): this {
    if (!this._map) return this;
    
    // 停止动画
    this.pause();
    
    // 移除事件监听
    this._map.off('resize', this._resizeCanvas, this);
    this._map.off('moveend', this._redraw, this);
    this._map.off('zoomend', this._redraw, this);
    
    // 移除Canvas
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
    
    // 清空数据
    this._data = [];
    this._particles = [];
    this._map = null;
    
    return this;
  }
  
  /**
   * 设置数据
   * @param data 迁徙数据
   */
  setData(data: any[]): this {
    this._data = data || [];
    this._initParticles();
    this._redraw();
    return this;
  }
  
  /**
   * 开始动画
   */
  play(): this {
    if (!this._running) {
      this._running = true;
      this._lastTime = Date.now();
      this._animate();
      this._fireEvent('animationStart');
    }
    return this;
  }
  
  /**
   * 暂停动画
   */
  pause(): this {
    if (this._running) {
      this._running = false;
      if (this._animationFrameId !== null) {
        cancelAnimationFrame(this._animationFrameId);
        this._animationFrameId = null;
      }
    }
    return this;
  }
  
  /**
   * 初始化粒子
   */
  private _initParticles(): void {
    this._particles = [];
    
    const maxParticles = this._config.animationStyle.max || 100;
    const speed = this._config.animationStyle.speed || 1;
    
    // 为每条轨迹创建粒子
    for (let i = 0; i < this._data.length && this._particles.length < maxParticles; i++) {
      const item = this._data[i];
      
      // 获取起点和终点的经纬度
      const from = Array.isArray(item.from) ? item.from : (item.from.coordinates || [0, 0]);
      const to = Array.isArray(item.to) ? item.to : (item.to.coordinates || [0, 0]);
      
      // 确保坐标格式正确 [经度, 纬度]
      if (!from || !to || from.length < 2 || to.length < 2) {
        // 跳过无效数据
        continue;
      }
      
      try {
        if (!this._map) continue;
        
        // 计算每个粒子的基本属性 - latLng需要传入 [纬度, 经度]
        const fromLatLng = this._map.createLatLng ? 
          this._map.createLatLng(from[1], from[0]) : 
          { lat: from[1], lng: from[0] };
        
        const toLatLng = this._map.createLatLng ? 
          this._map.createLatLng(to[1], to[0]) : 
          { lat: to[1], lng: to[0] };
        
        // 创建粒子
        const particle = {
          fromLatLng,
          toLatLng,
          fromPoint: this._map.latLngToContainerPoint(fromLatLng),
          toPoint: this._map.latLngToContainerPoint(toLatLng),
          progress: Math.random(), // 随机初始位置
          speed: (Math.random() * 0.5 + 0.5) * speed / 100, // 随机速度
          style: item.style || {},
          completed: false
        };
        
        this._particles.push(particle);
      } catch (e) {
        console.error('创建迁徙粒子失败:', e, item);
      }
    }
  }
  
  /**
   * 调整Canvas大小
   */
  private _resizeCanvas(): void {
    if (!this._map) return;
    
    const size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;
    
    // 重绘
    this._redraw();
  }
  
  /**
   * 重绘Canvas
   */
  private _redraw(): void {
    if (!this._map || !this._ctx || !this._canvas) return;
    
    // 清空Canvas
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    
    // 如果没有粒子，直接返回
    if (!this._particles || this._particles.length === 0) return;
    
    // 更新粒子位置
    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      if (!p || !p.fromLatLng || !p.toLatLng) continue;
      
      try {
        p.fromPoint = this._map.latLngToContainerPoint(p.fromLatLng);
        p.toPoint = this._map.latLngToContainerPoint(p.toLatLng);
      } catch (e) {
        console.error('更新粒子坐标失败:', e);
      }
    }
    
    // 绘制线条和粒子
    this._drawLines();
    this._drawParticles();
  }
  
  /**
   * 绘制线条
   */
  private _drawLines(): void {
    if (!this._ctx || !this._particles || this._particles.length === 0) return;
    
    this._ctx.save();
    
    // 设置线条样式
    this._ctx.lineWidth = this._config.lineStyle.lineWidth || 1;
    this._ctx.strokeStyle = this._config.lineStyle.strokeStyle || 'rgba(41, 128, 185, 0.3)';
    this._ctx.shadowColor = this._config.lineStyle.shadowColor || 'rgba(41, 128, 185, 0.1)';
    this._ctx.shadowBlur = this._config.lineStyle.shadowBlur || 5;
    
    // 绘制每个粒子的轨迹线
    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      if (!p || !p.fromPoint || !p.toPoint) continue;
      
      // 获取自定义样式
      if (p.style && p.style.strokeStyle) {
        this._ctx.strokeStyle = p.style.strokeStyle;
      }
      if (p.style && p.style.lineWidth) {
        this._ctx.lineWidth = p.style.lineWidth;
      }
      if (p.style && p.style.shadowColor) {
        this._ctx.shadowColor = p.style.shadowColor;
      }
      
      // 绘制路径
      this._ctx.beginPath();
      this._ctx.moveTo(p.fromPoint.x, p.fromPoint.y);
      this._ctx.lineTo(p.toPoint.x, p.toPoint.y);
      this._ctx.stroke();
    }
    
    this._ctx.restore();
  }
  
  /**
   * 绘制粒子
   */
  private _drawParticles(): void {
    if (!this._ctx || !this._particles || this._particles.length === 0) return;
    
    this._ctx.save();
    
    // 设置粒子样式
    this._ctx.fillStyle = this._config.pointStyle.fillStyle || 'rgba(255, 255, 255, 0.8)';
    this._ctx.strokeStyle = this._config.pointStyle.strokeStyle || 'rgba(41, 128, 185, 1)';
    this._ctx.lineWidth = this._config.pointStyle.lineWidth || 1;
    
    // 绘制每个粒子
    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      if (!p || !p.fromPoint || !p.toPoint) continue;
      if (p.completed && !this._config.loop) continue;
      
      // 计算当前位置
      const x = p.fromPoint.x + (p.toPoint.x - p.fromPoint.x) * p.progress;
      const y = p.fromPoint.y + (p.toPoint.y - p.fromPoint.y) * p.progress;
      
      // 绘制粒子
      this._ctx.beginPath();
      this._ctx.arc(x, y, this._config.pointStyle.radius || 3, 0, Math.PI * 2);
      this._ctx.fill();
      this._ctx.stroke();
      
      // 绘制尾迹
      this._drawTrail(p);
    }
    
    this._ctx.restore();
  }
  
  /**
   * 绘制尾迹
   * @param particle 粒子对象 
   */
  private _drawTrail(particle: any): void {
    if (!this._ctx || !particle || !particle.fromPoint || !particle.toPoint) return;
    
    const trailLength = this._config.animationStyle.trailLength || 5;
    if (trailLength <= 0) return;
    
    const fromX = particle.fromPoint.x;
    const fromY = particle.fromPoint.y;
    const toX = particle.toPoint.x;
    const toY = particle.toPoint.y;
    
    // 计算当前位置
    const x = fromX + (toX - fromX) * particle.progress;
    const y = fromY + (toY - fromY) * particle.progress;
    
    // 计算尾迹起点
    const trailProgress = Math.max(0, particle.progress - 0.05 * trailLength);
    const trailX = fromX + (toX - fromX) * trailProgress;
    const trailY = fromY + (toY - fromY) * trailProgress;
    
    try {
      // 创建渐变
      const gradient = this._ctx.createLinearGradient(trailX, trailY, x, y);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, this._config.pointStyle.fillStyle || 'rgba(255, 255, 255, 0.8)');
      
      // 绘制尾迹
      this._ctx.save();
      this._ctx.beginPath();
      this._ctx.strokeStyle = gradient;
      this._ctx.lineWidth = (this._config.pointStyle.radius || 3) * 1.5;
      this._ctx.moveTo(trailX, trailY);
      this._ctx.lineTo(x, y);
      this._ctx.stroke();
      this._ctx.restore();
    } catch (e) {
      console.error('绘制粒子尾迹失败:', e);
    }
  }
  
  /**
   * 动画循环
   */
  private _animate(): void {
    if (!this._running) return;
    
    // 计算时间差
    const now = Date.now();
    const delta = now - this._lastTime;
    this._lastTime = now;
    
    // 如果没有粒子，停止动画
    if (!this._particles || this._particles.length === 0) {
      this._running = false;
      this._fireEvent('animationComplete');
      return;
    }
    
    // 更新粒子
    let completed = 0;
    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      if (!p) continue;
      
      if (p.completed && !this._config.loop) {
        completed++;
        continue;
      }
      
      // 更新进度
      p.progress += p.speed * delta;
      
      // 检查是否完成一次动画
      if (p.progress >= 1) {
        if (this._config.loop) {
          p.progress = 0;
        } else {
          p.completed = true;
          completed++;
        }
      }
    }
    
    // 检查是否所有粒子都完成了动画
    if (completed === this._particles.length && !this._config.loop) {
      this._running = false;
      this._fireEvent('animationComplete');
      return;
    }
    
    // 重绘
    this._redraw();
    
    // 请求下一帧
    this._animationFrameId = requestAnimationFrame(() => this._animate());
  }
  
  /**
   * 添加事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: Function): this {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);
    return this;
  }
  
  /**
   * 触发事件
   * @param event 事件名称
   * @param data 事件数据
   */
  private _fireEvent(event: string, data?: any): void {
    if (this._events[event]) {
      for (let i = 0; i < this._events[event].length; i++) {
        this._events[event][i].call(this, data);
      }
    }
  }
  
  /**
   * 事件存储对象
   */
  private _events: {
    [key: string]: Function[]
  };
}

/**
 * 迁徙图插件类
 */
export class Migration {
  private map: LeafletMap;
  private migrationLayer: MigrationCanvasLayer = null;
  private enabled: boolean = false;
  private options: MigrationOptions;
  private data: MigrationPoint[] = [];
  private eventListeners: Map<MigrationEventType, Set<MigrationEventListener>> = new Map();
  private isAnimating: boolean = false;

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
        lineWidth: 2,
        strokeStyle: 'rgba(41, 128, 185, 0.8)',
        shadowColor: 'rgba(41, 128, 185, 0.3)',
        shadowBlur: 5
      },
      pointStyle: {
        radius: 3,
        fillStyle: 'rgba(255, 255, 255, 0.8)',
        strokeStyle: 'rgba(41, 128, 185, 1)',
        lineWidth: 1
      },
      animationStyle: {
        interval: 30,
        speed: 1,
        trailLength: 5,
        max: 100
      },
      label: {
        show: false,
        font: '12px Arial',
        fillStyle: '#fff',
        strokeStyle: '#000',
        lineWidth: 2
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
    
    // 初始化迁徙图层
    this.initMigrationLayer();
  }

  /**
   * 合并选项
   */
  private mergeOptions(defaultOptions: MigrationOptions, userOptions: MigrationOptions): MigrationOptions {
    const merged = { ...defaultOptions };
    
    Object.keys(userOptions).forEach(key => {
      if (key === 'lineStyle' || key === 'pointStyle' || key === 'animationStyle' || key === 'label') {
        merged[key] = { ...(merged[key] || {}), ...(userOptions[key] || {}) };
      } else {
        merged[key] = userOptions[key];
      }
    });
    
    return merged;
  }

  /**
   * 初始化迁徙图层
   */
  private initMigrationLayer(): void {
    try {
      // 构建迁徙图层配置
      const config = {
        // 线样式配置
        lineStyle: this.options.lineStyle,
        // 点样式配置
        pointStyle: this.options.pointStyle,
        // 动画配置
        animationStyle: this.options.animationStyle,
        // 标签配置
        label: this.options.label,
        // 是否循环播放
        loop: this.options.loop !== false,
        // 动画完成后是否隐藏
        hideAfterCompletion: !!this.options.hideAfterCompletion
      };
      
      // 创建迁徙图层
      this.migrationLayer = new MigrationCanvasLayer(config);
      
      // 添加事件监听器
      if (this.migrationLayer) {
        // 动画结束事件
        this.migrationLayer.on('animationComplete', () => {
          this.isAnimating = false;
          this.emit('migration-completed');
        });
        
        this.migrationLayer.on('animationStart', () => {
          this.isAnimating = true;
          this.emit('migration-started');
        });
      }
      
      info('迁徙图层初始化成功');
    } catch (e) {
      error('初始化迁徙图层失败:', e);
      this.migrationLayer = null;
    }
  }

  /**
   * 启用迁徙图
   */
  public enable(): boolean {
    if (this.enabled) return true;
    
    // 检查迁徙图层是否已初始化
    if (!this.migrationLayer) {
      this.initMigrationLayer();
    }
    
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
      
      // 添加迁徙图层到地图
      this.migrationLayer.addTo(this.map);
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
    if (!this.enabled || !this.migrationLayer) return false;
    
    try {
      // 先停止动画
      this.stop();
      
      // 从地图移除迁徙图层
      if (this.migrationLayer && typeof this.migrationLayer.remove === 'function') {
        this.migrationLayer.remove();
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
   * 切换迁徙图状态
   */
  public toggle(): boolean {
    return this.enabled ? this.disable() : this.enable();
  }

  /**
   * 获取迁徙图启用状态
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
    if (!this.migrationLayer) {
      warn('迁徙图层尚未初始化，无法设置数据');
      return false;
    }
    
    // 存储数据
    this.data = [...data];
    
    try {
      // 检查地图是否正在执行缩放动画，如果是则延迟设置数据
      if (this.map._animatingZoom) {
        info('地图正在缩放动画中，延迟设置迁徙图数据');
        setTimeout(() => {
          // 再次检查地图是否仍在缩放
          if (this.map._animatingZoom) {
            // 如果仍在缩放，再次延迟
            info('地图仍在缩放动画中，二次延迟设置迁徙图数据');
            setTimeout(() => {
              // 第三次检查
              if (this.map._animatingZoom) {
                info('地图持续缩放动画中，三次延迟设置迁徙图数据');
                setTimeout(() => this.setData(data, startAnimation), 400);
              } else {
                this.setData(data, startAnimation);
              }
            }, 400);
          } else {
            this.setData(data, startAnimation);
          }
        }, 400);
        return true;
      }
      
      // 先关闭地图上所有弹窗，防止在设置数据时弹窗引起问题
      if (typeof this.map.closePopup === 'function') {
        this.map.closePopup();
      }
      
      // 先停止动画
      this.stop();
      
      // 如果已启用，设置数据到图层
      if (this.enabled) {
        // 转换数据格式为自定义迁徙图层所需的格式
        const migrationData = this.transformData(data);
        
        // 设置数据
        this.migrationLayer.setData(migrationData);
        
        // 如果需要自动开始动画
        if (startAnimation) {
          setTimeout(() => this.start(), 100);
        }
        
        this.emit('migration-data-updated', { count: data.length });
        info(`迁徙图数据已更新，共${data.length}条路径`);
      }
      
      return true;
    } catch (e) {
      error('设置迁徙图数据失败:', e);
      return false;
    }
  }

  /**
   * 转换数据格式为自定义迁徙图层所需的格式
   */
  private transformData(data: MigrationPoint[]): any[] {
    return data.map(point => {
      return {
        from: point.from,
        to: point.to,
        // 如果有标签则添加
        labels: point.labels,
        // 自定义样式
        style: {
          // 如果有自定义颜色
          ...( point.color ? { 
              strokeStyle: point.color, 
              shadowColor: this.adjustOpacity(point.color, 0.3)
          } : {} ),
          // 如果有权重，影响线宽
          ...( point.weight ? { lineWidth: Math.max(1, Math.min(10, point.weight)) } : {} )
        },
        // 自定义动画时间
        time: point.time
      };
    });
  }

  /**
   * 调整颜色的透明度
   */
  private adjustOpacity(color: string, opacity: number): string {
    // 如果是rgba格式
    if (color.startsWith('rgba')) {
      return color.replace(/rgba\((.*),\s*[\d.]+\)/, `rgba($1, ${opacity})`);
    }
    // 如果是rgb格式
    else if (color.startsWith('rgb')) {
      return color.replace(/rgb\((.*)\)/, `rgba($1, ${opacity})`);
    }
    // 如果是十六进制格式
    else if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // 返回原始颜色
    return color;
  }

  /**
   * 开始迁徙动画
   */
  public start(): boolean {
    if (!this.migrationLayer || !this.enabled) {
      warn('迁徙图层未启用或未初始化，无法开始动画');
      return false;
    }
    
    try {
      // 检查地图是否正在执行缩放动画，如果是则延迟开始
      if (this.map._animatingZoom) {
        info('地图正在缩放动画中，延迟开始迁徙动画');
        setTimeout(() => this.start(), 400);
        return false;
      }
      
      // 开始动画
      this.migrationLayer.play();
      this.isAnimating = true;
      info('迁徙动画已开始');
      return true;
    } catch (e) {
      error('开始迁徙动画失败:', e);
      return false;
    }
  }

  /**
   * 停止迁徙动画
   */
  public stop(): boolean {
    if (!this.migrationLayer || !this.isAnimating) {
      return false;
    }
    
    try {
      // 停止动画
      this.migrationLayer.pause();
      this.isAnimating = false;
      info('迁徙动画已停止');
      return true;
    } catch (e) {
      error('停止迁徙动画失败:', e);
      return false;
    }
  }

  /**
   * 获取迁徙图数据
   */
  public getData(): MigrationPoint[] {
    return [...this.data];
  }

  /**
   * 清空迁徙图数据
   */
  public clearData(): boolean {
    return this.setData([], false);
  }

  /**
   * 更新迁徙图选项
   * @param options 迁徙图选项
   */
  public updateOptions(options: Partial<MigrationOptions>): boolean {
    this.options = this.mergeOptions(this.options, options);
    
    if (!this.migrationLayer) return false;
    
    const wasEnabled = this.enabled;
    
    try {
      // 重新创建迁徙图层以应用新选项
      if (wasEnabled) {
        this.disable();
      }
      
      this.initMigrationLayer();
      
      // 如果之前是启用状态，继续启用
      if (wasEnabled) {
        this.enable();
        
        // 重新设置数据
        if (this.data.length > 0) {
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
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(listener);
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  public off(event: MigrationEventType, listener: MigrationEventListener): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.delete(listener);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: MigrationEventType, data?: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.forEach(listener => {
        listener(data);
      });
    }
  }

  /**
   * 销毁迁徙图
   */
  public destroy(): void {
    if (this.enabled) {
      this.disable();
    }
    
    this.eventListeners.clear();
    this.data = [];
    this.migrationLayer = null;
  }

  /**
   * 获取动画状态
   */
  public isAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * 获取当前选项
   */
  public getOptions(): MigrationOptions {
    return { ...this.options };
  }
} 