import type { Map as LeafletMap, LatLng, Marker, Polyline, Layer, LatLngExpression } from 'leaflet';
import L from 'leaflet';
import type { Track, TrackPoint, TrackPlayerOptions, TrackPlayerConfig } from '../types';
import { DEFAULT_TRACK_PLAYER_OPTIONS } from '../types/default';
import { info, warn, error } from '@repo/utils';

// 引入Leaflet.TrackPlayer
// @ts-ignore - 忽略模块导入错误
import 'leaflet-trackplayer';

// 声明Leaflet.TrackPlayer模块
// @ts-ignore - 允许扩展leaflet模块
declare module 'leaflet' {
  interface LeafletTrackPlayerOptions {
    // 播放速度 (km/h)
    speed?: number;
    // 轨迹线宽度
    weight?: number;
    // 标记图标
    markerIcon?: L.Icon;
    // 箭头样式选项
    polylineDecoratorOptions?: any;
    // 已走过轨迹颜色
    passedLineColor?: string;
    // 未走过轨迹颜色
    notPassedLineColor?: string;
    // 是否跟随标记
    panTo?: boolean;
    // 标记是否旋转
    markerRotation?: boolean;
    // 标记旋转原点
    markerRotationOrigin?: string;
    // 标记旋转偏移角度
    markerRotationOffset?: number;
    
    // 以下是我们自定义扩展的选项，不在原始库中
    loop?: boolean;
    autoPlay?: boolean;
    followMarker?: boolean;
    trackLineOptions?: {
      color?: string;
      weight?: number;
      opacity?: number;
    };
    passedTrackOptions?: {
      color?: string;
      weight?: number;
      opacity?: number;
    };
    trackPointOptions?: {
      radius?: number;
      color?: string;
      fillColor?: string;
      opacity?: number;
      showPoints?: boolean;
    };
    markerOptions?: {
      icon?: L.Icon;
      rotateMarker?: boolean;
      rotationOrigin?: string;
      rotationAngle?: number;
    };
    controlOptions?: {
      position?: string;
      showSpeed?: boolean;
      showProgress?: boolean;
      theme?: 'light' | 'dark';
    };
    timeFormatter?: (time: number) => string;
  }

  interface TrackPlayerInstance extends L.Evented {
    // 原始库方法
    start(): this;
    pause(): this;
    setSpeed(speed: number, debounceTimeout?: number): this;
    setProgress(progress: number): this;
    addTo(map: L.Map): this;
    remove(): this;
    on(type: string, fn: Function): this;
    off(type: string, fn?: Function): this;
    
    // 扩展的方法
    addTrack(trackData: {id: string, name?: string, track: LatLngExpression[], timestamps: number[], directions?: number[]}): this;
    removeTrack(trackId: string): this;
    play(trackId?: string): this;
    stop(): this;
    isPlaying(): boolean;
    getCurrentTrack(): string | null;
    getAllTracks(): string[];
    getProgress(): number;
    getSpeed(): number;
    setTrackOptions(options: Partial<LeafletTrackPlayerOptions>): this;
    showTrackPlayer(): this;
    hideTrackPlayer(): this;
    onAdd(map: L.Map): this;
    onRemove(map: L.Map): this;
    
    // 属性
    marker: L.Marker;
    passedLine: L.Polyline;
    notPassedLine: L.Polyline;
    polylineDecorator: any;
    options: LeafletTrackPlayerOptions;
  }

  interface TrackPlayerStatic {
    new(latlngs?: LatLngExpression[], options?: LeafletTrackPlayerOptions): TrackPlayerInstance;
  }

  export let TrackPlayer: TrackPlayerStatic;
}

// 事件类型
export type TrackPlayerEventType = 
  'track-add' | 
  'track-remove' | 
  'play-start' | 
  'play-pause' | 
  'play-finished' | 
  'play-progress' | 
  'speed-change' | 
  'current-track-change';

// 事件监听器类型
export type TrackPlayerEventListener = (event?: any) => void;

/**
 * 轨迹播放控制器类 - 基于Leaflet.TrackPlayer插件实现
 */
export class TrackPlayer {
  private map: LeafletMap;
  public options: TrackPlayerOptions;
  private tracks: Map<string, Track> = new Map<string, Track>();
  private trackPlayerInstances: Map<string, L.TrackPlayerInstance> = new Map<string, L.TrackPlayerInstance>();
  private currentTrackId: string | null = null;
  private eventListeners: Map<TrackPlayerEventType, Set<TrackPlayerEventListener>> = new Map<TrackPlayerEventType, Set<TrackPlayerEventListener>>();

  /**
   * 构造函数
   * @param map Leaflet地图实例
   * @param options 轨迹播放控制器选项
   */
  constructor(map: LeafletMap, options: TrackPlayerConfig = {}) {
    this.map = map;
    
    // 合并配置，确保options具有TrackPlayerOptions的所有必要属性
    this.options = {
      ...DEFAULT_TRACK_PLAYER_OPTIONS,
      // 从TrackPlayerConfig中提取的配置
      position: options.position,
      // 确保loop等属性被正确初始化
      loop: DEFAULT_TRACK_PLAYER_OPTIONS.loop,
      speed: DEFAULT_TRACK_PLAYER_OPTIONS.speed,
      maxSpeed: DEFAULT_TRACK_PLAYER_OPTIONS.maxSpeed,
      autoPlay: DEFAULT_TRACK_PLAYER_OPTIONS.autoPlay,
      followMarker: DEFAULT_TRACK_PLAYER_OPTIONS.followMarker,
      trackLineOptions: DEFAULT_TRACK_PLAYER_OPTIONS.trackLineOptions,
      passedLineOptions: DEFAULT_TRACK_PLAYER_OPTIONS.passedLineOptions,
      notPassedLineOptions: DEFAULT_TRACK_PLAYER_OPTIONS.notPassedLineOptions,
      trackPointOptions: DEFAULT_TRACK_PLAYER_OPTIONS.trackPointOptions,
      markerOptions: DEFAULT_TRACK_PLAYER_OPTIONS.markerOptions
    };
    
    // 如果options.trackList存在，则添加轨迹
    if (options.trackList && options.trackList.length > 0) {
      info(`初始化添加${options.trackList.length}条轨迹`);
      options.trackList.forEach(track => this.addTrack(track));
    }
    
    info('轨迹播放控制器已创建，等待添加轨迹');
  }

  /**
   * 触发事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  private emit(eventType: TrackPlayerEventType, data?: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in TrackPlayer event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param listener 事件监听器
   */
  on(eventType: TrackPlayerEventType, listener: TrackPlayerEventListener): this {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set<TrackPlayerEventListener>());
    }
    
    const listeners = this.eventListeners.get(eventType);
    listeners?.add(listener);
    
    return this;
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listener 事件监听器，不提供则移除该事件类型的所有监听器
   */
  off(eventType: TrackPlayerEventType, listener?: TrackPlayerEventListener): this {
    if (!this.eventListeners.has(eventType)) {
      return this;
    }
    
    const listeners = this.eventListeners.get(eventType);
    
    if (listener) {
      listeners?.delete(listener);
    } else {
      // 如果未提供特定监听器，则移除该事件类型的所有监听器
      this.eventListeners.delete(eventType);
    }
    
    return this;
  }

  /**
   * 添加轨迹
   * @param track 轨迹数据
   * @returns 是否添加成功
   */
  addTrack(track: Track): boolean {
    if (!track.id || !track.points || track.points.length < 2) {
      warn('添加轨迹失败: 轨迹数据不完整或点数量不足');
      return false;
    }

    // 如果轨迹已存在，先移除
    if (this.tracks.has(track.id)) {
      this.removeTrack(track.id);
    }

    // 确保轨迹点有正确的时间戳且按时间排序
    const sortedPoints = [...track.points].sort((a, b) => a.time - b.time);
    
    // 更新轨迹数据
    const updatedTrack: Track = {
      ...track,
      points: sortedPoints,
      visible: track.visible !== false
    };

    // 存储轨迹
    this.tracks.set(track.id, updatedTrack);
    
    // 转换格式 - 只提取latlng数组
    const latlngs = sortedPoints.map(p => [p.lat, p.lng] as LatLngExpression);
    
    // 转换时间戳为毫秒
    const timestamps = sortedPoints.map(p => p.time * 1000);
    
    // 获取方向数组
    const directions = sortedPoints.map(p => p.dir || 0);
    
    try {
      // 为这个轨迹创建一个新的轨迹播放实例
      this.createTrackPlayerInstance(track.id, latlngs, timestamps, directions);
      
      // 如果是第一条轨迹，设置为当前轨迹
      if (!this.currentTrackId) {
        this.currentTrackId = track.id;
      }
      
      this.emit('track-add', { trackId: track.id });
      info(`轨迹添加成功: ${track.id}, 点数: ${latlngs.length}`);
      return true;
    } catch (e) {
      error('添加轨迹失败:', e);
      // 清除已添加的轨迹数据
      this.tracks.delete(track.id);
      return false;
    }
  }

  /**
   * 为轨迹创建轨迹播放器实例
   * @param trackId 轨迹ID
   * @param latlngs 轨迹点坐标数组
   * @param timestamps 轨迹点时间戳数组
   * @param directions 轨迹点方向数组
   */
  private createTrackPlayerInstance(
    trackId: string, 
    latlngs: LatLngExpression[], 
    timestamps: number[], 
    directions: number[]
  ): void {
    try {
      // 检查leaflet-trackplayer是否正确加载
      // @ts-ignore - 忽略L.TrackPlayer未定义错误
      if (typeof L.TrackPlayer !== 'function') {
        error('轨迹播放器初始化失败: Leaflet.TrackPlayer 未正确加载，确保已安装 leaflet-trackplayer 并正确导入');
        return;
      }

      // 获取原始轨迹点数据
      const track = this.tracks.get(trackId);
      if (!track) {
        error(`轨迹 ${trackId} 数据不存在`);
        return;
      }

      // 获取轨迹点的速度信息
      const speeds = this.calculatePointSpeeds(track.points);

      // 转换配置项为leaflet-trackplayer所需格式
      const leafletOptions: L.LeafletTrackPlayerOptions = {
        // 基本配置
        speed: this.options.speed || 600, // 默认速度600 km/h
        weight: this.options.trackLineOptions?.weight || 8,
        passedLineColor: this.options.passedLineOptions?.color || '#0000ff',
        notPassedLineColor: this.options.notPassedLineOptions?.color || '#ff0000',
        panTo: this.options.followMarker !== false, // 默认跟随标记
        markerRotation: this.options.markerOptions?.rotate !== false, // 默认旋转标记
        markerRotationOrigin: 'center center',
        markerRotationOffset: this.options.markerOptions?.rotationOffset || 0,
      };

      // 如果markerOptions中有自定义图标
      if (this.options.markerOptions?.useImg && this.options.markerOptions?.imgUrl) {
        const width = this.options.markerOptions?.width || 32;
        const height = this.options.markerOptions?.height || 32;
        
        leafletOptions.markerIcon = L.icon({
          iconUrl: this.options.markerOptions.imgUrl,
          iconSize: [width, height],
          iconAnchor: [width/2, height/2]
        });
      }

      // 添加扩展属性，支持变速轨迹播放
      // @ts-ignore - 添加自定义属性
      leafletOptions.pointSpeeds = speeds;
      
      // 创建轨迹播放器实例
      // @ts-ignore - 忽略L.TrackPlayer构造函数错误
      const trackPlayerInstance = new L.TrackPlayer(latlngs, {
        ...leafletOptions,
        timestamps: timestamps,
        directions: directions
      }); // 不立即添加到地图中

      // 绑定事件
      trackPlayerInstance.on('start', () => this.emit('play-start', { trackId }));
      trackPlayerInstance.on('pause', () => this.emit('play-pause', { trackId }));
      trackPlayerInstance.on('finished', () => this.emit('play-finished', { trackId }));
      
      // 进度事件
      trackPlayerInstance.on('progress', (progress: number, position: {lng: number, lat: number}, index: number) => {
        // 如果点位有自定义速度，在进度更新时应用
        if (index < speeds.length && speeds[index] > 0) {
          // 只在速度变化时设置速度，避免频繁调用setSpeed
          const currentSpeed = trackPlayerInstance.getSpeed ? trackPlayerInstance.getSpeed() : this.options.speed;
          if (speeds[index] !== currentSpeed) {
            try {
              trackPlayerInstance.setSpeed(speeds[index]);
              // 发出速度变化事件
              this.emit('speed-change', { 
                trackId,
                speed: speeds[index],
                pointIndex: index
              });
            } catch (e) {
              // 忽略速度设置错误
            }
          }
        }
        
        this.emit('play-progress', { 
          trackId,
          progress: progress,
          position: position,
          index: index
        });
      });
      
      // 存储实例
      this.trackPlayerInstances.set(trackId, trackPlayerInstance);
      
      info(`轨迹 ${trackId} 播放器实例创建成功`);
    } catch (err) {
      error(`创建轨迹 ${trackId} 的播放器实例失败:`, err);
      throw err; // 重新抛出异常，让调用方处理
    }
  }

  /**
   * 计算轨迹点的速度
   * @param points 轨迹点数组
   * @returns 每个点位的速度数组
   */
  private calculatePointSpeeds(points: TrackPoint[]): number[] {
    if (!points || points.length < 2) {
      return [];
    }
    
    const speeds: number[] = [];
    
    // 第一个点速度设为0或使用指定速度
    speeds.push(points[0].speed || this.options.speed || 1);
    
    // 计算每个点的速度
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currPoint = points[i];
      
      // 使用点自身指定的速度或计算
      if (currPoint.speed !== undefined) {
        // 如果点有明确指定的速度，使用指定速度
        speeds.push(currPoint.speed);
      } else {
        // 否则基于距离和时间差计算速度
        // 计算两点间距离（米）
        const dist = this.calculateDistance(
          prevPoint.lat, prevPoint.lng,
          currPoint.lat, currPoint.lng
        );
        
        // 计算时间差（秒）
        const timeDiff = currPoint.time - prevPoint.time;
        
        if (timeDiff <= 0) {
          // 如果时间差异不正常，使用默认速度
          speeds.push(this.options.speed || 1);
        } else {
          // 计算速度（km/h）= 距离(m) / 时间(s) * 3.6
          const calculatedSpeed = (dist / timeDiff) * 3.6;
          
          // 确保速度在合理范围内
          const validSpeed = Math.max(0.1, Math.min(calculatedSpeed, this.options.maxSpeed || 1000));
          speeds.push(validSpeed);
        }
      }
    }
    
    return speeds;
  }

  /**
   * 计算两点之间的距离（米）
   * @param lat1 第一点纬度
   * @param lng1 第一点经度
   * @param lat2 第二点纬度
   * @param lng2 第二点经度
   * @returns 距离（米）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // 使用Haversine公式计算两点间距离
    const R = 6371000; // 地球半径（米）
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * 角度转弧度
   * @param deg 角度
   * @returns 弧度
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * 移除轨迹
   * @param trackId 轨迹ID
   * @returns 是否移除成功
   */
  removeTrack(trackId: string): boolean {
    if (!this.tracks.has(trackId)) {
      warn(`移除轨迹失败: 轨迹不存在 ${trackId}`);
      return false;
    }

    // 从存储中移除
    this.tracks.delete(trackId);
    
    // 停止并销毁对应的轨迹播放器实例
    const trackInstance = this.trackPlayerInstances.get(trackId);
    if (trackInstance) {
      try {
        // 如果当前这个轨迹实例已经添加到地图，就移除它
        if (this.map && trackInstance._map) {
          trackInstance.pause();
          trackInstance.remove();
        }
        
        // 解绑事件
        trackInstance.off();
        
        // 从实例映射中移除
        this.trackPlayerInstances.delete(trackId);
        
        info(`轨迹 ${trackId} 的播放器实例已销毁`);
      } catch (e) {
        error(`销毁轨迹 ${trackId} 的播放器实例失败:`, e);
      }
    }
    
    // 如果移除的是当前正在播放的轨迹，需要重置当前轨迹ID
    if (this.currentTrackId === trackId) {
      // 如果还有其他轨迹，选择第一个作为当前轨迹
      const trackIds = Array.from(this.tracks.keys());
      this.currentTrackId = trackIds.length > 0 ? trackIds[0] : null;
      
      // 触发当前轨迹变更事件
      this.emit('current-track-change', { trackId: this.currentTrackId });
    }
    
    this.emit('track-remove', { trackId });
    info(`轨迹移除成功: ${trackId}`);
    
    return true;
  }

  /**
   * 设置当前轨迹
   * @param trackId 轨迹ID
   * @returns 是否成功设置
   */
  setCurrentTrack(trackId: string): boolean {
    if (!this.tracks.has(trackId)) {
      warn(`设置当前轨迹失败: 轨迹不存在 ${trackId}`);
      return false;
    }
    
    // 如果当前有其他轨迹正在播放，先暂停它
    if (this.currentTrackId && this.currentTrackId !== trackId) {
      this.pause();
    }
    
    // 从地图上移除所有轨迹实例
    this.hideAllTracks();
    
    // 设置新的当前轨迹
    this.currentTrackId = trackId;
    
    // 显示当前选中的轨迹（但不立即播放）
    this.showTrack(trackId);
    
    this.emit('current-track-change', { trackId });
    info(`当前轨迹已设置为: ${trackId}`);
    
    return true;
  }

  /**
   * 显示指定轨迹
   * @param trackId 轨迹ID
   * @returns 是否成功显示
   */
  private showTrack(trackId: string): boolean {
    // 检查轨迹是否存在
    if (!this.tracks.has(trackId)) {
      warn(`显示轨迹失败: 轨迹不存在 ${trackId}`);
      return false;
    }
    
    // 获取轨迹实例
    const trackInstance = this.trackPlayerInstances.get(trackId);
    if (!trackInstance) {
      warn(`显示轨迹失败: 轨迹 ${trackId} 没有对应的播放器实例`);
      return false;
    }
    
    // 如果轨迹实例未添加到地图，则添加到地图
    if (!trackInstance._map) {
      try {
        trackInstance.addTo(this.map);
        info(`轨迹 ${trackId} 已显示在地图上`);
        return true;
      } catch (e) {
        error(`显示轨迹 ${trackId} 失败:`, e);
        return false;
      }
    }
    
    return true; // 已经在地图上显示
  }

  /**
   * 隐藏指定轨迹
   * @param trackId 轨迹ID
   * @returns 是否成功隐藏
   */
  private hideTrack(trackId: string): boolean {
    // 检查轨迹是否存在
    if (!this.tracks.has(trackId)) {
      warn(`隐藏轨迹失败: 轨迹不存在 ${trackId}`);
      return false;
    }
    
    // 获取轨迹实例
    const trackInstance = this.trackPlayerInstances.get(trackId);
    if (!trackInstance) {
      warn(`隐藏轨迹失败: 轨迹 ${trackId} 没有对应的播放器实例`);
      return false;
    }
    
    // 如果轨迹实例已添加到地图，则从地图中移除
    if (trackInstance._map) {
      try {
        // 先暂停播放
        trackInstance.pause();
        // 从地图移除
        trackInstance.remove();
        info(`轨迹 ${trackId} 已从地图上隐藏`);
        return true;
      } catch (e) {
        error(`隐藏轨迹 ${trackId} 失败:`, e);
        return false;
      }
    }
    
    return true; // 已经不在地图上显示
  }

  /**
   * 隐藏所有轨迹
   */
  private hideAllTracks(): void {
    // 遍历所有轨迹实例
    this.trackPlayerInstances.forEach((instance, trackId) => {
      // 从地图上移除实例
      if (instance._map) {
        try {
          // 先暂停播放
          instance.pause();
          // 从地图移除
          instance.remove();
        } catch (e) {
          // 忽略错误，继续处理下一个
          error(`隐藏轨迹 ${trackId} 失败:`, e);
        }
      }
    });
    
    info('所有轨迹已从地图上隐藏');
  }

  /**
   * 播放轨迹
   * @param trackId 要播放的轨迹ID，默认为当前轨迹
   * @returns 是否成功开始播放
   */
  play(trackId?: string): boolean {
    const targetTrackId = trackId || this.currentTrackId;
    
    if (!targetTrackId) {
      warn('播放轨迹失败: 未指定轨迹ID');
      return false;
    }
    
    if (!this.tracks.has(targetTrackId)) {
      warn(`播放轨迹失败: 轨迹不存在 ${targetTrackId}`);
      return false;
    }
    
    try {
      // 获取对应的轨迹播放器实例
      const instance = this.trackPlayerInstances.get(targetTrackId);
      if (!instance) {
        warn(`播放轨迹失败: 轨迹 ${targetTrackId} 没有对应的播放器实例`);
        return false;
      }
      
      // 如果当前有其他轨迹正在播放，先暂停它
      if (this.currentTrackId && this.currentTrackId !== targetTrackId) {
        this.pause();
        
        // 显示新轨迹前，隐藏所有轨迹
        this.hideAllTracks();
        
        // 更新当前轨迹ID
        this.currentTrackId = targetTrackId;
        this.emit('current-track-change', { trackId: targetTrackId });
      }

      // 确保当前轨迹显示在地图上
      if (!instance._map) {
        instance.addTo(this.map);
      }
      
      // 开始播放
      instance.start();
      
      info(`开始播放轨迹: ${targetTrackId}`);
      return true;
    } catch (err) {
      error('播放轨迹失败:', err);
      return false;
    }
  }

  /**
   * 暂停播放
   * @returns 是否成功暂停
   */
  pause(): boolean {
    if (!this.currentTrackId) {
      return false;
    }

    const instance = this.trackPlayerInstances.get(this.currentTrackId);
    if (!instance) {
      return false;
    }
    
    try {
      instance.pause();
      info('轨迹播放已暂停');
      return true;
    } catch (err) {
      error('暂停轨迹播放失败:', err);
      return false;
    }
  }

  /**
   * 停止播放
   * @returns 是否成功停止
   */
  stop(): boolean {
    if (!this.currentTrackId) {
      return false;
    }
    
    const instance = this.trackPlayerInstances.get(this.currentTrackId);
    if (!instance) {
      return false;
    }
    
    try {
      // 尝试使用stop方法，如果不存在，使用pause然后重置进度
      if (typeof instance.stop === 'function') {
        instance.stop();
      } else {
        instance.pause();
        instance.setProgress(0);
      }
      
      info('轨迹播放已停止');
    return true;
    } catch (err) {
      error('停止轨迹播放失败:', err);
      return false;
    }
  }

  /**
   * 设置播放速度
   * @param speed 播放速度倍率
   * @returns 是否成功设置
   */
  setSpeed(speed: number): boolean {
    if (speed <= 0) {
      warn('设置播放速度失败: 速度必须大于0');
      return false;
    }

    // 保存到全局选项
    this.options.speed = speed;
    
    // 应用到当前播放实例
    if (this.currentTrackId) {
      const instance = this.trackPlayerInstances.get(this.currentTrackId);
      if (instance) {
        try {
          instance.setSpeed(speed);
          this.emit('speed-change', { speed, trackId: this.currentTrackId });
          info(`播放速度已设置为 ${speed}x`);
          return true;
        } catch (err) {
          error('设置播放速度失败:', err);
        }
      }
    }
    
    // 应用到所有实例
    let success = true;
    this.trackPlayerInstances.forEach((instance, trackId) => {
      try {
        instance.setSpeed(speed);
      } catch (e) {
        error(`为轨迹 ${trackId} 设置速度失败:`, e);
        success = false;
      }
    });
    
    return success;
  }

  /**
   * 设置播放进度
   * @param progress 播放进度(0-1)
   * @returns 是否成功设置
   */
  setProgress(progress: number): boolean {
    if (!this.currentTrackId) {
      return false;
    }

    const instance = this.trackPlayerInstances.get(this.currentTrackId);
    if (!instance) {
      return false;
    }

    if (progress < 0 || progress > 1) {
      warn('设置播放进度失败: 进度必须在0-1之间');
      return false;
    }
    
    try {
      // 如果实例还没有添加到地图上，先添加
      if (!instance._map) {
        instance.addTo(this.map);
      }
      
      instance.setProgress(progress);
      return true;
    } catch (err) {
      error('设置播放进度失败:', err);
      return false;
    }
  }

  /**
   * 获取当前播放的轨迹ID
   */
  getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  /**
   * 获取所有轨迹
   */
  getAllTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  /**
   * 获取当前播放进度
   */
  getProgress(): number {
    if (!this.currentTrackId) return 0;
    
    const instance = this.trackPlayerInstances.get(this.currentTrackId);
    if (!instance) return 0;
    
    try {
      if (typeof instance.getProgress === 'function') {
        return instance.getProgress();
      } else {
        // 如果方法不存在，可能需要通过其他属性获取
        // @ts-ignore - 可能存在的属性
        const progress = instance.progress;
        return typeof progress === 'number' ? progress : 0;
      }
    } catch (e) {
      return 0;
    }
  }

  /**
   * 获取当前播放速度
   */
  getSpeed(): number {
    if (!this.currentTrackId) return this.options.speed || 1;
    
    const instance = this.trackPlayerInstances.get(this.currentTrackId);
    if (!instance) return this.options.speed || 1;
    
    try {
      if (typeof instance.getSpeed === 'function') {
        return instance.getSpeed();
      }
    } catch (e) {
      // 忽略错误
    }
    
    return this.options.speed || 1;
  }

  /**
   * 是否正在播放
   */
  isPlayingTrack(): boolean {
    if (!this.currentTrackId) return false;
    
    const instance = this.trackPlayerInstances.get(this.currentTrackId);
    if (!instance) return false;
    
    try {
      if (typeof instance.isPlaying === 'function') {
        return instance.isPlaying();
      } else {
        // 如果方法不存在，可能需要通过其他属性获取
        // @ts-ignore - 可能存在的属性
        return !!instance.playing;
      }
    } catch (e) {
      return false;
    }
  }

  /**
   * 更新轨迹播放选项
   * @param options 要更新的选项
   */
  updateOptions(options: Partial<TrackPlayerOptions>): void {
    // 更新全局选项
    this.options = { ...this.options, ...options };
    
    // 尝试应用到当前选中的轨迹
    if (this.currentTrackId) {
      const instance = this.trackPlayerInstances.get(this.currentTrackId);
      if (instance) {
        this.updateInstanceOptions(instance, options);
      }
    }
  }
  
  /**
   * 更新轨迹播放器实例的选项
   * @param instance 轨迹播放器实例
   * @param options 选项
   */
  private updateInstanceOptions(instance: L.TrackPlayerInstance, options: Partial<TrackPlayerOptions>): void {
    try {
      // 尝试使用setTrackOptions方法
      if (typeof instance.setTrackOptions === 'function') {
        // @ts-ignore
        instance.setTrackOptions({
          speed: options.speed,
          panTo: options.followMarker,
          weight: options.trackLineOptions?.weight,
          passedLineColor: options.passedLineOptions?.color,
          notPassedLineColor: options.notPassedLineOptions?.color,
          markerRotation: options.markerOptions?.rotate,
          markerRotationOffset: options.markerOptions?.rotationOffset
        });
      } else {
        // 如果方法不存在，直接设置实例属性
        if (options.speed !== undefined) {
          instance.setSpeed(options.speed);
        }
        
        // 其他属性的设置可能需要实现特定方法
      }
    } catch (e) {
      error('更新轨迹播放选项失败:', e);
    }
  }

  /**
   * 销毁轨迹播放控制器
   */
  destroy(): void {
    // 停止播放
      this.pause();
    
    // 清除所有轨迹实例
    this.trackPlayerInstances.forEach((instance, trackId) => {
      try {
        if (instance._map) {
          instance.remove();
        }
        instance.off();
      } catch (e) {
        error(`销毁轨迹 ${trackId} 的播放器实例失败:`, e);
      }
    });
    
    // 清空实例映射
    this.trackPlayerInstances.clear();
    
    // 清空轨迹数据
    this.tracks.clear();
    
    // 清除事件监听
    this.eventListeners.clear();
    
    this.currentTrackId = null;
    
    info('轨迹播放控制器已销毁');
  }
} 