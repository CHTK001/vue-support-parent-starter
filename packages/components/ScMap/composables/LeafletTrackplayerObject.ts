/**
 * Leaflet轨迹播放器对象
 * @description 提供基于Leaflet的轨迹播放功能
 */
import L from 'leaflet';
import 'leaflet-trackplayer';
import { MapObject } from './MapObject';
import { TrackPoint, TrackOptions, TrackPlayerOptions } from '../types/track';
import type { TrackPlayerEventHandler } from '../types/trackplayer';
import logger from './LogObject';


/**
 * Leaflet轨迹播放器对象类
 */
export class LeafletTrackplayerObject {
  // 地图实例
  private mapInstance: L.Map | null = null;
  // 轨迹播放器控件
  private trackplayerControl: L.Control.TrackPlayer | null = null;
  // 轨迹图层
  private trackLayer: L.LayerGroup | null = null;
  // 事件处理器
  private eventHandler: TrackPlayerEventHandler | null = null;
  // 轨迹数据
  private tracks: any[] = [];
  // 轨迹播放器选项
  private options: TrackPlayerOptions = {
    playbackSpeed: 100,
    tickLen: 1000,
    maxInterpolationTime: 5 * 60 * 1000, // 5分钟
    position: 'bottomleft',
    trackPointOptions: {
      radius: 5,
      color: '#ffffff',
      fillColor: '#1890ff',
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    },
    trackLineOptions: {
      color: '#1890ff',
      weight: 3,
      opacity: 0.8
    },
    customControlCallbacks: {
      onSpeedChange: (speed: number) => this.handleSpeedChange(speed),
      onTrackSelect: (trackId: string) => this.handleTrackSelect(trackId)
    }
  };
  
  /**
   * 构造函数
   * @param mapObj 地图对象
   * @param eventHandler 事件处理器
   * @param options 播放器选项
   */
  constructor(mapObj: MapObject, eventHandler?: TrackPlayerEventHandler, options?: Partial<TrackPlayerOptions>) {
    // 设置地图实例
    this.mapInstance = mapObj.getMapInstance();
    
    // 设置事件处理器
    this.eventHandler = eventHandler || null;
    
    // 合并选项
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    // 创建轨迹图层
    this.trackLayer = L.layerGroup();
    
    // 初始化轨迹播放器
    this.initTrackplayer();
    
    logger.debug('Leaflet轨迹播放器对象已创建');
  }
  
  /**
   * 初始化轨迹播放器
   */
  private initTrackplayer(): void {
    if (!this.mapInstance) {
      logger.error('初始化Leaflet轨迹播放器失败: 地图实例未设置');
      return;
    }
    
    try {
      // 将轨迹图层添加到地图
      this.trackLayer?.addTo(this.mapInstance);
      
      // 创建轨迹播放器控件
      this.trackplayerControl = L.control.trackplayer({
        position: this.options.position,
        playbackOptions: {
          tickLen: this.options.tickLen,
          speed: this.options.playbackSpeed,
          maxInterpolationTime: this.options.maxInterpolationTime,
          trackPointOptions: this.options.trackPointOptions,
          trackLineOptions: this.options.trackLineOptions
        },
        layer: this.trackLayer || undefined
      });
      
      // 添加轨迹播放器控件到地图
      this.trackplayerControl.addTo(this.mapInstance);
      
      // 绑定事件监听
      this.bindEvents();
      
      // 触发初始化完成事件
      this.triggerEvent('trackplayer-init', {
        message: 'Leaflet轨迹播放器初始化完成'
      });
      
      logger.debug('Leaflet轨迹播放器初始化完成');
    } catch (error) {
      logger.error('初始化Leaflet轨迹播放器失败:', error);
    }
  }
  
  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (!this.trackplayerControl) return;
    
    try {
      // 播放开始事件
      this.trackplayerControl.on('play', () => {
        this.triggerEvent('play', { time: this.trackplayerControl?.getTime() });
      });
      
      // 播放暂停事件
      this.trackplayerControl.on('pause', () => {
        this.triggerEvent('pause', { time: this.trackplayerControl?.getTime() });
      });
      
      // 播放停止事件
      this.trackplayerControl.on('stop', () => {
        this.triggerEvent('stop', { time: this.trackplayerControl?.getTime() });
      });
      
      // 播放结束事件
      this.trackplayerControl.on('ended', () => {
        this.triggerEvent('ended', { time: this.trackplayerControl?.getTime() });
      });
      
      // 播放进度更新事件
      this.trackplayerControl.on('tick', (event: any) => {
        this.triggerEvent('tick', { 
          time: event.time,
          tracks: event.tracks
        });
      });
      
      // 轨迹点选中事件
      this.trackplayerControl.setTrackPointCallback((point: any, isSelected: boolean) => {
        if (isSelected) {
          this.triggerEvent('point-select', point);
        }
      });
      
      logger.debug('Leaflet轨迹播放器事件绑定完成');
    } catch (error) {
      logger.error('绑定Leaflet轨迹播放器事件失败:', error);
    }
  }
  
  /**
   * 添加轨迹数据
   * @param track 轨迹数据
   * @param options 轨迹选项
   */
  public addTrack(trackPoints: TrackPoint[], options?: TrackOptions): void {
    if (!this.trackplayerControl || !trackPoints || trackPoints.length === 0) {
      logger.error('添加轨迹数据失败: 轨迹播放器未初始化或轨迹数据无效');
      return;
    }
    
    try {
      // 生成轨迹ID
      const trackId = options?.id || `track_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // 格式化轨迹数据
      const formattedPoints = trackPoints.map(point => ({
        lat: point.latitude,
        lng: point.longitude,
        time: point.timestamp,
        data: point.properties || {}
      }));
      
      // 创建轨迹数据对象
      const trackData = {
        type: 'Feature',
        properties: {
          id: trackId,
          name: options?.name || trackId,
          color: options?.color || this.options.trackLineOptions.color,
          weight: options?.width || this.options.trackLineOptions.weight,
          opacity: options?.opacity || this.options.trackLineOptions.opacity,
          ...options?.properties
        },
        geometry: {
          type: 'LineString',
          coordinates: formattedPoints.map(p => [p.lng, p.lat])
        },
        time: formattedPoints.map(p => p.time)
      };
      
      // 添加到轨迹数据列表
      this.tracks.push(trackData);
      
      // 添加到轨迹播放器
      this.trackplayerControl.addData(trackData);
      
      // 触发轨迹添加事件
      this.triggerEvent('track-add', {
        id: trackId,
        pointCount: trackPoints.length
      });
      
      logger.debug(`已添加轨迹: ${trackId}, 点数: ${trackPoints.length}`);
    } catch (error) {
      logger.error('添加轨迹数据失败:', error);
    }
  }
  
  /**
   * 清空轨迹数据
   */
  public clearTracks(): void {
    if (!this.trackplayerControl) {
      logger.error('清空轨迹数据失败: 轨迹播放器未初始化');
      return;
    }
    
    try {
      // 停止播放
      this.stop();
      
      // 清空数据
      this.trackplayerControl.clearData();
      
      // 清空列表
      this.tracks = [];
      
      // 触发轨迹清空事件
      this.triggerEvent('track-clear', {
        message: '轨迹数据已清空'
      });
      
      logger.debug('轨迹数据已清空');
    } catch (error) {
      logger.error('清空轨迹数据失败:', error);
    }
  }
  
  /**
   * 开始播放
   */
  public start(): void {
    if (!this.trackplayerControl) {
      logger.error('开始播放失败: 轨迹播放器未初始化');
      return;
    }
    
    try {
      this.trackplayerControl.startPlayback();
      logger.debug('轨迹播放已开始');
    } catch (error) {
      logger.error('开始播放失败:', error);
    }
  }
  
  /**
   * 暂停播放
   */
  public pause(): void {
    if (!this.trackplayerControl) {
      logger.error('暂停播放失败: 轨迹播放器未初始化');
      return;
    }
    
    try {
      this.trackplayerControl.pausePlayback();
      logger.debug('轨迹播放已暂停');
    } catch (error) {
      logger.error('暂停播放失败:', error);
    }
  }
  
  /**
   * 停止播放
   */
  public stop(): void {
    if (!this.trackplayerControl) {
      logger.error('停止播放失败: 轨迹播放器未初始化');
      return;
    }
    
    try {
      this.trackplayerControl.stopPlayback();
      logger.debug('轨迹播放已停止');
    } catch (error) {
      logger.error('停止播放失败:', error);
    }
  }
  
  /**
   * 设置播放速度
   * @param speed 播放速度
   */
  public setSpeed(speed: number): void {
    if (!this.trackplayerControl) {
      logger.error('设置播放速度失败: 轨迹播放器未初始化');
      return;
    }
    
    try {
      this.trackplayerControl.setSpeed(speed);
      logger.debug(`轨迹播放速度已设置为: ${speed}`);
    } catch (error) {
      logger.error('设置播放速度失败:', error);
    }
  }
  
  /**
   * 设置播放时间点
   * @param timestamp 时间戳
   */
  public setCursor(timestamp: number): void {
    if (!this.trackplayerControl) {
      logger.error('设置播放时间点失败: 轨迹播放器未初始化');
      return;
    }
    
    try {
      this.trackplayerControl.setCursor(timestamp);
      logger.debug(`轨迹播放时间点已设置为: ${new Date(timestamp).toISOString()}`);
    } catch (error) {
      logger.error('设置播放时间点失败:', error);
    }
  }
  
  /**
   * 获取当前播放时间
   * @returns 当前播放时间戳
   */
  public getCurrentTime(): number {
    if (!this.trackplayerControl) {
      logger.error('获取当前播放时间失败: 轨迹播放器未初始化');
      return 0;
    }
    
    return this.trackplayerControl.getTime();
  }
  
  /**
   * 获取播放开始时间
   * @returns 开始时间戳
   */
  public getStartTime(): number {
    if (!this.trackplayerControl) {
      logger.error('获取播放开始时间失败: 轨迹播放器未初始化');
      return 0;
    }
    
    return this.trackplayerControl.getStartTime();
  }
  
  /**
   * 获取播放结束时间
   * @returns 结束时间戳
   */
  public getEndTime(): number {
    if (!this.trackplayerControl) {
      logger.error('获取播放结束时间失败: 轨迹播放器未初始化');
      return 0;
    }
    
    return this.trackplayerControl.getEndTime();
  }
  
  /**
   * 是否正在播放
   * @returns 是否正在播放
   */
  public isPlaying(): boolean {
    if (!this.trackplayerControl) {
      return false;
    }
    
    return this.trackplayerControl.isPlaying();
  }
  
  /**
   * 是否已暂停
   * @returns 是否已暂停
   */
  public isPaused(): boolean {
    if (!this.trackplayerControl) {
      return false;
    }
    
    return this.trackplayerControl.isPaused();
  }
  
  /**
   * 是否已结束
   * @returns 是否已结束
   */
  public isEnded(): boolean {
    if (!this.trackplayerControl) {
      return false;
    }
    
    return this.trackplayerControl.isEnded();
  }
  
  /**
   * 处理速度变化
   * @param speed 速度值
   */
  private handleSpeedChange(speed: number): void {
    this.triggerEvent('speed-change', { speed });
  }
  
  /**
   * 处理轨迹选择
   * @param trackId 轨迹ID
   */
  private handleTrackSelect(trackId: string): void {
    this.triggerEvent('track-select', { trackId });
  }
  
  /**
   * 触发事件
   * @param eventName 事件名称
   * @param payload 事件数据
   */
  private triggerEvent(eventName: string, payload: any): void {
    if (this.eventHandler) {
      this.eventHandler(eventName, payload);
    }
  }
  
  /**
   * 销毁轨迹播放器
   */
  public destroy(): void {
    // 停止播放
    if (this.trackplayerControl && this.isPlaying()) {
      this.stop();
    }
    
    // 清空轨迹数据
    if (this.trackplayerControl) {
      this.clearTracks();
    }
    
    // 从地图移除轨迹播放器控件
    if (this.mapInstance && this.trackplayerControl) {
      this.mapInstance.removeControl(this.trackplayerControl);
    }
    
    // 从地图移除轨迹图层
    if (this.mapInstance && this.trackLayer) {
      this.mapInstance.removeLayer(this.trackLayer);
    }
    
    // 清空引用
    this.trackplayerControl = null;
    this.trackLayer = null;
    this.mapInstance = null;
    this.eventHandler = null;
    this.tracks = [];
    
    logger.debug('Leaflet轨迹播放器已销毁');
  }
} 