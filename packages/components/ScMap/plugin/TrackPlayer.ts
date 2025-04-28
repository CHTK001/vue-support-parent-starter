import type { Map as LeafletMap, LatLng, Marker, Polyline, Layer } from 'leaflet';
import L from 'leaflet';
import type { Track, TrackPoint, TrackPlayerOptions } from '../types';
import { DEFAULT_TRACK_PLAYER_OPTIONS } from '../types/default';
import { info, warn, error } from '@repo/utils';

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
 * 轨迹播放控制器类
 */
export class TrackPlayer {
  private map: LeafletMap;
  public options: TrackPlayerOptions;
  private tracks: Map<string, Track> = new Map();
  private tracksLayer: L.LayerGroup;
  private currentTrackId: string | null = null;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private currentProgress: number = 0;
  private currentSpeed: number = 1;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private totalDuration: number = 0;
  private currentMarker: Marker | null = null;
  private passedLine: Polyline | null = null;
  private notPassedLine: Polyline | null = null;
  private trackPoints: Layer[] = [];
  private eventListeners: Map<TrackPlayerEventType, Set<TrackPlayerEventListener>> = new Map();

  /**
   * 构造函数
   * @param map Leaflet地图实例
   * @param options 轨迹播放控制器选项
   */
  constructor(map: LeafletMap, options: Partial<TrackPlayerOptions> = {}) {
    this.map = map;
    this.options = { ...DEFAULT_TRACK_PLAYER_OPTIONS, ...options };
    this.currentSpeed = this.options.speed || 1;
    
    // 创建轨迹图层
    this.tracksLayer = L.layerGroup().addTo(map);
    
    info('轨迹播放控制器初始化成功');
  }

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  on(event: TrackPlayerEventType, listener: TrackPlayerEventListener): void {
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
  off(event: TrackPlayerEventType, listener?: TrackPlayerEventListener): void {
    if (!this.eventListeners.has(event)) return;
    
    if (listener) {
      this.eventListeners.get(event)?.delete(listener);
    } else {
      this.eventListeners.delete(event);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: TrackPlayerEventType, data?: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.forEach(listener => {
        listener(data);
      });
    }
  }

  /**
   * 添加轨迹
   * @param track 轨迹数据
   * @returns 是否添加成功
   */
  addTrack(track: Track): boolean {
    if (!track.id || !track.points || track.points.length === 0) {
      warn('添加轨迹失败: 轨迹数据不完整');
      return false;
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
    
    // 如果是第一条轨迹，设为当前轨迹
    if (this.tracks.size === 1 && !this.currentTrackId) {
      this.setCurrentTrack(track.id);
    }
    
    this.emit('track-add', { trackId: track.id });
    info(`轨迹添加成功: ${track.id}`);
    
    return true;
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

    // 如果是当前轨迹，先停止播放
    if (this.currentTrackId === trackId && this.isPlaying) {
      this.pause();
    }

    // 从存储中移除
    this.tracks.delete(trackId);
    
    // 如果是当前轨迹，重置当前轨迹
    if (this.currentTrackId === trackId) {
      this.clearCurrentTrack();
      
      // 如果还有其他轨迹，设置第一条为当前轨迹
      if (this.tracks.size > 0) {
        const nextTrackId = this.tracks.keys().next().value;
        this.setCurrentTrack(nextTrackId);
      }
    }
    
    this.emit('track-remove', { trackId });
    info(`轨迹移除成功: ${trackId}`);
    
    return true;
  }

  /**
   * 设置当前轨迹
   * @param trackId 轨迹ID
   * @returns 是否设置成功
   */
  setCurrentTrack(trackId: string): boolean {
    if (!this.tracks.has(trackId)) {
      warn(`设置当前轨迹失败: 轨迹不存在 ${trackId}`);
      return false;
    }

    // 如果正在播放，先暂停
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }

    // 清除当前轨迹
    this.clearCurrentTrack();
    
    // 设置新的当前轨迹
    this.currentTrackId = trackId;
    this.currentProgress = 0;
    
    // 获取轨迹
    const track = this.tracks.get(trackId)!;
    
    // 计算总时长
    const firstPoint = track.points[0];
    const lastPoint = track.points[track.points.length - 1];
    this.totalDuration = lastPoint.time - firstPoint.time;
    
    // 绘制轨迹
    this.drawTrack();
    
    this.emit('current-track-change', { 
      trackId, 
      track: this.tracks.get(trackId) 
    });
    
    info(`当前轨迹已设置: ${trackId}`);
    
    // 如果之前在播放，继续播放
    if (wasPlaying) {
      this.play();
    }
    
    return true;
  }

  /**
   * 清除当前轨迹显示
   */
  private clearCurrentTrack(): void {
    // 停止动画帧
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 移除标记
    if (this.currentMarker) {
      this.tracksLayer.removeLayer(this.currentMarker);
      this.currentMarker = null;
    }
    
    // 移除轨迹线
    if (this.passedLine) {
      this.tracksLayer.removeLayer(this.passedLine);
      this.passedLine = null;
    }
    
    if (this.notPassedLine) {
      this.tracksLayer.removeLayer(this.notPassedLine);
      this.notPassedLine = null;
    }
    
    // 移除轨迹点
    this.trackPoints.forEach(point => this.tracksLayer.removeLayer(point));
    this.trackPoints = [];
    
    // 重置状态
    this.currentTrackId = null;
    this.currentProgress = 0;
    this.startTime = 0;
    this.pauseTime = 0;
  }

  /**
   * 绘制轨迹
   */
  private drawTrack(): void {
    if (!this.currentTrackId) return;
    
    const track = this.tracks.get(this.currentTrackId)!;
    const points = track.points;
    
    // 将轨迹点转换为坐标数组
    const latlngs = points.map(p => L.latLng(p.lat, p.lng));
    
    // 绘制未通过的轨迹线
    if (this.options.trackLineOptions?.isDraw) {
      const notPassedLineOptions = {
        ...this.options.notPassedLineOptions,
        color: track.color || this.options.notPassedLineOptions?.color || '#ff0000'
      };
      
      this.notPassedLine = L.polyline(latlngs, notPassedLineOptions)
        .addTo(this.tracksLayer);
    }
    
    // 绘制已通过的轨迹线（初始为空）
    if (this.options.trackLineOptions?.isDraw) {
      const passedLineOptions = {
        ...this.options.passedLineOptions,
        color: this.options.passedLineOptions?.color || '#00ff00'
      };
      
      this.passedLine = L.polyline([], passedLineOptions)
        .addTo(this.tracksLayer);
    }
    
    // 绘制轨迹点
    if (this.options.trackPointOptions?.isDraw) {
      points.forEach(point => {
        const trackPoint = L.circleMarker(
          [point.lat, point.lng], 
          {
            radius: this.options.trackPointOptions?.radius || 4,
            color: this.options.trackPointOptions?.color || '#3388ff',
            fillColor: this.options.trackPointOptions?.fillColor || '#3388ff',
            fillOpacity: this.options.trackPointOptions?.opacity || 0.6,
            weight: 1
          }
        ).addTo(this.tracksLayer);
        
        this.trackPoints.push(trackPoint);
      });
    }
    
    // 创建标记
    const firstPoint = points[0];
    
    // 创建或配置标记选项
    let markerOptions: any = {
      rotationAngle: firstPoint.dir || 0
    };
    
    // 如果使用自定义图标
    if (this.options.markerOptions?.useImg) {
      const iconUrl = track.iconUrl || '/images/marker-icon.png';  // 默认使用系统图标
      
      markerOptions.icon = L.icon({
        iconUrl,
        iconSize: [
          this.options.markerOptions?.width || 24,
          this.options.markerOptions?.height || 24
        ],
        iconAnchor: [
          (this.options.markerOptions?.width || 24) / 2,
          (this.options.markerOptions?.height || 24) / 2
        ]
      });
    }
    
    // 创建标记
    this.currentMarker = L.marker(
      [firstPoint.lat, firstPoint.lng],
      markerOptions
    ).addTo(this.tracksLayer);
    
    // 将地图定位到轨迹范围
    const bounds = L.latLngBounds(latlngs);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  /**
   * 开始播放轨迹
   * @returns 是否成功开始播放
   */
  play(): boolean {
    if (!this.currentTrackId) {
      warn('播放失败: 没有当前轨迹');
      return false;
    }

    if (this.isPlaying) {
      // 已经在播放中
      return true;
    }

    this.isPlaying = true;
    
    // 如果已经播放完毕，从头开始
    if (this.currentProgress >= 1) {
      this.currentProgress = 0;
    }
    
    const track = this.tracks.get(this.currentTrackId)!;
    const firstPoint = track.points[0];
    
    // 记录开始时间
    const now = Date.now();
    
    if (this.pauseTime > 0) {
      // 继续播放，计算开始时间
      this.startTime = now - (this.pauseTime - this.startTime);
      this.pauseTime = 0;
    } else {
      // 新的播放，从当前进度开始
      const playedTime = this.totalDuration * this.currentProgress;
      this.startTime = now - playedTime * 1000 / this.currentSpeed;
    }
    
    // 开始动画帧
    this.animate();
    
    this.emit('play-start', {
      trackId: this.currentTrackId,
      progress: this.currentProgress,
      speed: this.currentSpeed
    });
    
    info(`轨迹播放开始: ${this.currentTrackId}`);
    
    return true;
  }

  /**
   * 暂停播放
   * @returns 是否成功暂停
   */
  pause(): boolean {
    if (!this.isPlaying) {
      return false;
    }

    this.isPlaying = false;
    this.pauseTime = Date.now();
    
    // 停止动画帧
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.emit('play-pause', {
      trackId: this.currentTrackId,
      progress: this.currentProgress
    });
    
    info(`轨迹播放暂停: ${this.currentTrackId}`);
    
    return true;
  }

  /**
   * 设置播放速度
   * @param speed 速度倍数
   * @returns 是否设置成功
   */
  setSpeed(speed: number): boolean {
    if (speed <= 0) {
      warn('设置速度失败: 速度必须大于0');
      return false;
    }

    const maxSpeed = this.options.maxSpeed || 16;
    
    if (speed > maxSpeed) {
      warn(`设置速度失败: 速度不能大于${maxSpeed}`);
      return false;
    }

    const wasPlaying = this.isPlaying;
    
    // 如果正在播放，先暂停
    if (wasPlaying) {
      this.pause();
    }
    
    // 更新当前速度
    this.currentSpeed = speed;
    
    // 如果之前在播放，继续播放
    if (wasPlaying) {
      this.play();
    }
    
    this.emit('speed-change', { speed: this.currentSpeed });
    info(`播放速度已设置: ${speed}x`);
    
    return true;
  }

  /**
   * 设置播放进度
   * @param progress 进度值（0-1）
   * @returns 是否设置成功
   */
  setProgress(progress: number): boolean {
    if (progress < 0 || progress > 1) {
      warn('设置进度失败: 进度值必须在0-1之间');
      return false;
    }

    if (!this.currentTrackId) {
      warn('设置进度失败: 没有当前轨迹');
      return false;
    }

    const wasPlaying = this.isPlaying;
    
    // 如果正在播放，先暂停
    if (wasPlaying) {
      this.pause();
    }
    
    // 更新进度
    this.currentProgress = progress;
    
    // 更新显示
    this.updateDisplay(this.currentProgress);
    
    // 如果之前在播放，继续播放
    if (wasPlaying) {
      this.play();
    }
    
    return true;
  }

  /**
   * 播放动画帧
   */
  private animate(): void {
    // 取消可能存在的上一个动画帧
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const updateFrame = () => {
      if (!this.isPlaying || !this.currentTrackId) return;

      const track = this.tracks.get(this.currentTrackId)!;
      const points = track.points;
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      
      // 计算当前进度
      const elapsed = (Date.now() - this.startTime) * this.currentSpeed / 1000;
      const progress = Math.min(elapsed / this.totalDuration, 1);
      
      // 更新显示
      this.updateDisplay(progress);
      
      // 检查是否播放完成
      if (progress >= 1) {
        this.currentProgress = 1;
        this.isPlaying = false;
        
        // 检查是否循环播放
        if (this.options.loop) {
          // 延迟500毫秒后重新开始
          setTimeout(() => {
            this.currentProgress = 0;
            this.play();
          }, 500);
        }
        
        this.emit('play-finished', { trackId: this.currentTrackId });
        info(`轨迹播放完成: ${this.currentTrackId}`);
        
        return;
      }
      
      // 保存当前进度
      this.currentProgress = progress;
      
      // 继续下一帧
      this.animationFrameId = requestAnimationFrame(updateFrame);
    };
    
    // 开始动画帧
    this.animationFrameId = requestAnimationFrame(updateFrame);
  }

  /**
   * 根据进度更新显示
   * @param progress 进度值（0-1）
   */
  private updateDisplay(progress: number): void {
    if (!this.currentTrackId) return;
    
    const track = this.tracks.get(this.currentTrackId)!;
    const points = track.points;
    
    if (points.length < 2) return;
    
    // 计算当前时间点
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const currentTime = firstPoint.time + (lastPoint.time - firstPoint.time) * progress;
    
    // 找到当前时间点前后的轨迹点
    let prevIndex = 0;
    let nextIndex = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i].time <= currentTime && points[i + 1].time > currentTime) {
        prevIndex = i;
        nextIndex = i + 1;
        break;
      }
    }
    
    // 如果达到了最后一个点
    if (progress >= 1 || currentTime >= lastPoint.time) {
      prevIndex = points.length - 2;
      nextIndex = points.length - 1;
    }
    
    const prevPoint = points[prevIndex];
    const nextPoint = points[nextIndex];
    
    // 计算两点之间的插值
    let ratio = 0;
    if (nextPoint.time !== prevPoint.time) {
      ratio = (currentTime - prevPoint.time) / (nextPoint.time - prevPoint.time);
    }
    
    // 计算当前位置
    const lat = prevPoint.lat + (nextPoint.lat - prevPoint.lat) * ratio;
    const lng = prevPoint.lng + (nextPoint.lng - prevPoint.lng) * ratio;
    
    // 更新标记位置
    if (this.currentMarker) {
      this.currentMarker.setLatLng([lat, lng]);
      
      // 计算并更新方向
      if (this.options.markerOptions?.rotate && nextPoint.lng !== prevPoint.lng) {
        let angle = Math.atan2(nextPoint.lat - prevPoint.lat, nextPoint.lng - prevPoint.lng) * 180 / Math.PI;
        angle = (angle + 90 + 360) % 360;  // 调整为顺时针方向
        
        // 应用旋转偏移
        if (this.options.markerOptions.rotationOffset) {
          angle += this.options.markerOptions.rotationOffset;
        }
        
        // 设置标记旋转角度
        if ('setRotationAngle' in this.currentMarker) {
          (this.currentMarker as any).setRotationAngle(angle);
        }
      }
      
      // 地图跟随标记
      if (this.options.followMarker) {
        this.map.panTo([lat, lng], { animate: true, duration: 0.5 });
      }
    }
    
    // 更新轨迹线
    if (this.passedLine && this.notPassedLine) {
      // 已通过的轨迹点
      const passedPoints = points.slice(0, prevIndex + 1).map(p => L.latLng(p.lat, p.lng));
      
      // 添加当前位置点
      passedPoints.push(L.latLng(lat, lng));
      
      // 未通过的轨迹点
      const notPassedPoints = [L.latLng(lat, lng)].concat(
        points.slice(nextIndex).map(p => L.latLng(p.lat, p.lng))
      );
      
      // 更新轨迹线
      this.passedLine.setLatLngs(passedPoints);
      this.notPassedLine.setLatLngs(notPassedPoints);
    }
    
    // 发送进度事件
    this.emit('play-progress', {
      trackId: this.currentTrackId,
      progress,
      position: { lat, lng },
      time: currentTime
    });
  }

  /**
   * 获取当前轨迹ID
   * @returns 当前轨迹ID
   */
  getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  /**
   * 获取所有轨迹列表
   * @returns 轨迹列表
   */
  getAllTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  /**
   * 获取当前播放进度
   * @returns 当前进度（0-1）
   */
  getProgress(): number {
    return this.currentProgress;
  }

  /**
   * 获取当前播放速度
   * @returns 当前速度
   */
  getSpeed(): number {
    return this.currentSpeed;
  }

  /**
   * 是否正在播放
   * @returns 是否正在播放
   */
  isPlayingTrack(): boolean {
    return this.isPlaying;
  }

  /**
   * 销毁轨迹播放控制器
   */
  destroy(): void {
    // 停止播放
    if (this.isPlaying) {
      this.pause();
    }
    
    // 清除轨迹显示
    this.clearCurrentTrack();
    
    // 移除图层
    if (this.tracksLayer) {
      this.map.removeLayer(this.tracksLayer);
    }
    
    // 清除所有轨迹
    this.tracks.clear();
    
    // 清除事件监听器
    this.eventListeners.clear();
    
    info('轨迹播放控制器已销毁');
  }
} 