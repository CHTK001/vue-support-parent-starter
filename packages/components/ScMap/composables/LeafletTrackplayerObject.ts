/**
 * Leaflet轨迹播放器对象
 * @description 基于leaflet-trackplayer插件实现的轨迹播放功能
 */
import L from 'leaflet';
import { MapObject } from './MapObject';
import { Track, TrackPoint, TrackPlayerConfigOptions, DEFAULT_TRACK_PLAYER_CONFIG } from '../types/track';
import logger from './LogObject';

// 声明leaflet-trackplayer接口，因为这是第三方插件
declare module 'leaflet' {
  interface TrackplayerOptions {
    trackId?: string;
    tracks?: Track[];
    line?: {
      color?: string;
      weight?: number;
      opacity?: number;
    };
    pointer?: {
      icon?: L.Icon | L.DivIcon;
      iconUrl?: string;
      iconSize?: [number, number];
      iconAnchor?: [number, number];
      popupAnchor?: [number, number];
      showRotation?: boolean;
      rotationAngle?: number;
    };
    waypoints?: {
      icon?: L.Icon | L.DivIcon;
      iconUrl?: string;
      iconSize?: [number, number];
      iconAnchor?: [number, number];
      popupAnchor?: [number, number];
      showName?: boolean;
    };
    speed?: number;
    loop?: boolean;
    autoPlay?: boolean;
    onPointChange?: (point: TrackPoint, timestamp: number) => void;
    onTrackEnd?: (trackId: string) => void;
  }

  function trackplayer(options?: TrackplayerOptions): any;
  
  interface Map {
    trackplayerControl: any;
  }
}

// 轨迹事件回调类型
export type TrackEventCallback = (eventName: string, payload: any) => void;

export class LeafletTrackplayerObject {
  private mapObj: MapObject;
  private tracks: Map<string, Track> = new Map();
  private eventCallback: TrackEventCallback | null = null;
  private activeTrackId: string | null = null;
  private playingTrackId: string | null = null;
  private isPlaying: boolean = false;
  private config: TrackPlayerConfigOptions;
  private trackplayerControl: any = null;
  
  /**
   * 构造函数
   * @param mapObj 地图对象
   * @param callback 事件回调
   * @param config 轨迹播放器配置
   */
  constructor(mapObj: MapObject, callback?: TrackEventCallback, config?: Partial<TrackPlayerConfigOptions>) {
    this.mapObj = mapObj;
    this.eventCallback = callback || null;
    this.config = { ...DEFAULT_TRACK_PLAYER_CONFIG, ...config };
    
    // 初始化trackplayer控件
    this.initTrackplayer();
    
    logger.debug('LeafletTrackplayerObject已初始化');
  }
  
  /**
   * 初始化trackplayer控件
   */
  private initTrackplayer() {
    try {
      // 获取地图实例
      const map = this.mapObj.getMapInstance();
      if (!map) {
        logger.error('地图实例不存在');
        return;
      }
      
      // 创建trackplayer控件
      this.trackplayerControl = L.trackplayer({
        line: {
          color: this.config.trackStyle?.color || '#1890ff',
          weight: this.config.trackStyle?.weight || 3,
          opacity: this.config.trackStyle?.opacity || 0.8
        },
        pointer: {
          iconSize: this.config.moveIconSize || [24, 24],
          showRotation: true
        },
        waypoints: {
          showName: this.config.showNodeNames || false
        },
        speed: this.config.speed || 50,
        loop: this.config.loop || false,
        autoPlay: false,
        onPointChange: (point: TrackPoint, timestamp: number) => {
          this.triggerEvent('track-position-update', {
            trackId: this.playingTrackId,
            point,
            time: timestamp
          });
        },
        onTrackEnd: (trackId: string) => {
          this.isPlaying = false;
          this.playingTrackId = null;
          
          this.triggerEvent('track-play-end', { 
            trackId
          });
        }
      }).addTo(map);
      
      logger.debug('Trackplayer控件已初始化');
    } catch (error) {
      logger.error('初始化Trackplayer控件失败:', error);
    }
  }
  
  /**
   * 设置事件回调
   * @param callback 事件回调函数
   */
  public setEventCallback(callback: TrackEventCallback): void {
    this.eventCallback = callback;
  }
  
  /**
   * 添加轨迹
   * @param track 轨迹数据
   * @returns 是否添加成功
   */
  public addTrack(track: Track): boolean {
    try {
      // 检查轨迹ID是否已存在
      if (this.tracks.has(track.id)) {
        logger.warn(`轨迹ID ${track.id} 已存在，将被覆盖`);
        this.removeTrack(track.id);
      }
      
      // 排序轨迹点按时间顺序
      if (track.points && track.points.length > 0) {
        track.points.sort((a, b) => a.time - b.time);
      }
      
      // 存储轨迹
      this.tracks.set(track.id, track);
      
      // 添加到trackplayer控件
      if (this.trackplayerControl) {
        this.trackplayerControl.addTrack(track);
      }
      
      logger.info(`已添加轨迹: ${track.id}`);
      
      // 触发轨迹添加事件
      this.triggerEvent('track-added', { trackId: track.id, track });
      
      return true;
    } catch (error) {
      logger.error('添加轨迹失败:', error);
      return false;
    }
  }
  
  /**
   * 移除轨迹
   * @param trackId 轨迹ID
   * @returns 是否移除成功
   */
  public removeTrack(trackId: string): boolean {
    try {
      // 检查轨迹ID是否存在
      if (!this.tracks.has(trackId)) {
        logger.warn(`轨迹ID ${trackId} 不存在`);
        return false;
      }
      
      // 如果正在播放该轨迹，先停止播放
      if (this.playingTrackId === trackId && this.isPlaying) {
        this.stop();
      }
      
      // 如果是活动轨迹，清除状态
      if (this.activeTrackId === trackId) {
        this.activeTrackId = null;
      }
      
      // 获取轨迹
      const track = this.tracks.get(trackId);
      
      // 从trackplayer控件移除
      if (this.trackplayerControl) {
        this.trackplayerControl.removeTrack(trackId);
      }
      
      // 从集合中移除
      this.tracks.delete(trackId);
      
      logger.info(`已移除轨迹: ${trackId}`);
      
      // 触发轨迹移除事件
      this.triggerEvent('track-removed', { trackId, track });
      
      return true;
    } catch (error) {
      logger.error('移除轨迹失败:', error);
      return false;
    }
  }
  
  /**
   * 获取所有轨迹
   * @returns 轨迹数组
   */
  public getTracks(): Track[] {
    return Array.from(this.tracks.values());
  }
  
  /**
   * 获取轨迹
   * @param trackId 轨迹ID
   * @returns 轨迹对象，不存在则返回null
   */
  public getTrack(trackId: string): Track | null {
    return this.tracks.get(trackId) || null;
  }
  
  /**
   * 设置活动轨迹
   * @param trackId 轨迹ID
   * @returns 是否成功
   */
  public setActiveTrack(trackId: string): boolean {
    try {
      // 检查轨迹ID是否存在
      if (!this.tracks.has(trackId)) {
        logger.warn(`轨迹ID ${trackId} 不存在`);
        return false;
      }
      
      // 如果已经是活动轨迹，不需要操作
      if (this.activeTrackId === trackId) {
        return true;
      }
      
      // 设置新的活动轨迹
      this.activeTrackId = trackId;
      const track = this.tracks.get(trackId);
      
      // 如果使用trackplayer控件，设置当前轨迹
      if (this.trackplayerControl) {
        this.trackplayerControl.selectTrack(trackId);
      }
      
      // 标记轨迹为选中状态
      if (track) {
        track.selected = true;
        
        // 其他轨迹设为未选中
        this.tracks.forEach((t) => {
          if (t.id !== trackId) {
            t.selected = false;
          }
        });
      }
      
      // 触发轨迹选择事件
      this.triggerEvent('track-selected', { trackId, track });
      
      logger.debug(`已设置活动轨迹: ${trackId}`);
      
      return true;
    } catch (error) {
      logger.error(`设置活动轨迹 ${trackId} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 触发事件
   * @param eventName 事件名称
   * @param payload 事件数据
   */
  private triggerEvent(eventName: string, payload: any): void {
    if (this.eventCallback) {
      this.eventCallback(eventName, payload);
    }
  }
  
  /**
   * 播放轨迹
   * @param trackId 轨迹ID
   * @param startTime 开始时间，默认为轨迹的第一个点的时间
   * @returns 是否成功开始播放
   */
  public play(trackId?: string, startTime?: number): boolean {
    try {
      // 如果没有指定轨迹ID，使用当前活动的轨迹
      const targetTrackId = trackId || this.activeTrackId;
      
      // 如果没有有效的轨迹ID，返回失败
      if (!targetTrackId || !this.tracks.has(targetTrackId)) {
        logger.warn('没有有效的轨迹可播放');
        return false;
      }
      
      // 获取轨迹对象
      const track = this.tracks.get(targetTrackId)!;
      
      // 检查轨迹是否有足够的点
      if (!track.points || track.points.length < 2) {
        logger.warn(`轨迹 ${targetTrackId} 点数不足，无法播放`);
        return false;
      }
      
      // 如果当前已经在播放其他轨迹，先停止
      if (this.isPlaying) {
        this.stop();
      }
      
      // 设置为活动轨迹
      this.setActiveTrack(targetTrackId);
      
      // 设置播放状态
      this.isPlaying = true;
      this.playingTrackId = targetTrackId;
      
      // 使用trackplayer控件播放
      if (this.trackplayerControl) {
        // 如果指定了开始时间，设置开始位置
        if (startTime !== undefined) {
          this.trackplayerControl.setTime(startTime);
        }
        
        // 开始播放
        this.trackplayerControl.play();
      }
      
      // 触发播放开始事件
      this.triggerEvent('track-play-start', { 
        trackId: targetTrackId, 
        track,
        startTime: startTime || track.points[0].time
      });
      
      logger.debug(`开始播放轨迹: ${targetTrackId}`);
      
      return true;
    } catch (error) {
      logger.error('播放轨迹失败:', error);
      return false;
    }
  }
  
  /**
   * 暂停播放
   * @returns 是否成功
   */
  public pause(): boolean {
    try {
      if (!this.isPlaying) {
        logger.warn('当前没有播放中的轨迹');
        return false;
      }
      
      // 使用trackplayer控件暂停
      if (this.trackplayerControl) {
        this.trackplayerControl.pause();
      }
      
      // 更新状态
      this.isPlaying = false;
      
      // 触发暂停事件
      this.triggerEvent('track-play-pause', {
        trackId: this.playingTrackId
      });
      
      logger.debug(`已暂停轨迹播放: ${this.playingTrackId}`);
      
      return true;
    } catch (error) {
      logger.error('暂停轨迹播放失败:', error);
      return false;
    }
  }
  
  /**
   * 停止播放
   * @returns 是否成功
   */
  public stop(): boolean {
    try {
      if (!this.playingTrackId) {
        return false;
      }
      
      // 记录正在播放的轨迹ID
      const trackId = this.playingTrackId;
      
      // 使用trackplayer控件停止
      if (this.trackplayerControl) {
        this.trackplayerControl.stop();
      }
      
      // 更新状态
      this.isPlaying = false;
      this.playingTrackId = null;
      
      // 触发停止事件
      this.triggerEvent('track-play-stop', { trackId });
      
      logger.debug(`已停止轨迹播放: ${trackId}`);
      
      return true;
    } catch (error) {
      logger.error('停止轨迹播放失败:', error);
      return false;
    }
  }
  
  /**
   * 设置播放位置
   * @param time 时间戳
   * @returns 是否成功
   */
  public setPlaybackTime(time: number): boolean {
    try {
      if (!this.playingTrackId) {
        logger.warn('当前没有播放中的轨迹');
        return false;
      }
      
      // 使用trackplayer控件设置时间
      if (this.trackplayerControl) {
        this.trackplayerControl.setTime(time);
      }
      
      // 触发时间更新事件
      this.triggerEvent('track-time-update', {
        trackId: this.playingTrackId,
        currentTime: time
      });
      
      return true;
    } catch (error) {
      logger.error('设置播放位置失败:', error);
      return false;
    }
  }
  
  /**
   * 设置播放速度
   * @param speed 速度(km/h)
   * @returns 是否成功
   */
  public setPlaybackSpeed(speed: number): boolean {
    try {
      if (speed <= 0) {
        logger.warn('播放速度必须大于0');
        return false;
      }
      
      // 更新配置
      this.config.speed = speed;
      
      // 使用trackplayer控件设置速度
      if (this.trackplayerControl) {
        this.trackplayerControl.setSpeed(speed);
      }
      
      // 触发速度更新事件
      this.triggerEvent('track-speed-update', {
        trackId: this.playingTrackId,
        speed
      });
      
      logger.debug(`已设置播放速度: ${speed} km/h`);
      
      return true;
    } catch (error) {
      logger.error('设置播放速度失败:', error);
      return false;
    }
  }
  
  /**
   * 设置轨迹播放器配置
   * @param config 配置选项
   */
  public setConfig(config: Partial<TrackPlayerConfigOptions>): void {
    this.config = { ...this.config, ...config };
    
    // 更新trackplayer控件配置
    if (this.trackplayerControl) {
      if (config.loop !== undefined) {
        this.trackplayerControl.setLoop(config.loop);
      }
      
      if (config.speed !== undefined) {
        this.trackplayerControl.setSpeed(config.speed);
      }
      
      if (config.trackStyle) {
        // 更新线条样式
        this.trackplayerControl.setLineStyle({
          color: config.trackStyle.color,
          weight: config.trackStyle.weight,
          opacity: config.trackStyle.opacity
        });
      }
      
      if (config.showNodeNames !== undefined) {
        // 更新节点名称显示
        this.trackplayerControl.setWaypointOptions({
          showName: config.showNodeNames
        });
      }
    }
    
    logger.debug('已更新轨迹播放器配置', this.config);
  }
  
  /**
   * 获取轨迹播放器配置
   * @returns 配置选项
   */
  public getConfig(): TrackPlayerConfigOptions {
    return { ...this.config };
  }
  
  /**
   * 清除所有轨迹
   * @returns 是否成功
   */
  public clearTracks(): boolean {
    try {
      // 如果正在播放轨迹，先停止播放
      if (this.isPlaying && this.playingTrackId) {
        this.stop();
      }
      
      // 清除活动轨迹状态
      this.activeTrackId = null;
      
      // 获取所有轨迹ID
      const trackIds = Array.from(this.tracks.keys());
      
      // 逐个移除轨迹
      trackIds.forEach(trackId => {
        // 从trackplayer控件移除
        if (this.trackplayerControl) {
          this.trackplayerControl.removeTrack(trackId);
        }
      });
      
      // 清空轨迹集合
      this.tracks.clear();
      
      logger.debug('已清除所有轨迹');
      
      // 触发轨迹清除事件
      this.triggerEvent('tracks-cleared', {});
      
      return true;
    } catch (error) {
      logger.error('清除轨迹失败:', error);
      return false;
    }
  }
  
  /**
   * 销毁对象
   */
  public destroy(): void {
    // 停止播放
    this.stop();
    
    // 移除trackplayer控件
    if (this.trackplayerControl) {
      const map = this.mapObj.getMapInstance();
      if (map) {
        try {
          this.trackplayerControl.remove();
        } catch (error) {
          logger.error('移除trackplayer控件失败:', error);
        }
      }
      this.trackplayerControl = null;
    }
    
    // 清空轨迹集合
    this.tracks.clear();
    
    // 清空事件回调
    this.eventCallback = null;
    
    logger.debug('LeafletTrackplayerObject已销毁');
  }
} 