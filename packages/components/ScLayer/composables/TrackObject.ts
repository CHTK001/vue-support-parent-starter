/**
 * 轨迹对象
 * @description 管理地图上的轨迹
 */
import { Map as OlMap } from 'ol';
import Feature from 'ol/Feature';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Stroke, Icon, Fill, Circle as CircleStyle, Text } from 'ol/style';
import { LineString, Point } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { TrackPoint, Track, TrackConfig, IconSpeedGroup, TrackPlayer } from '../types/track';
import { DataType } from '../types';
import logger from './LogObject';

// 轨迹模块的日志前缀
const LOG_MODULE = 'Track';

// 默认轨迹配置
const DEFAULT_TRACK_CONFIG: TrackConfig = {
  passedLineOptions: {
    color: 'rgba(24, 144, 255, 1)',
    weight: 4,
    opacity: 0.8
  },
  notPassedLineOptions: {
    color: 'rgba(160, 160, 160, 0.8)',
    weight: 3,
    opacity: 0.5
  }
};

// 默认轨迹播放器配置
const DEFAULT_TRACK_PLAYER: TrackPlayer = {
  loop: false,
  speed: 50, // 50 km/h
  withCamera: true
};

// 轨迹播放状态
enum TrackPlayState {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused'
}

/**
 * 轨迹对象类
 */
export class TrackObject {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 轨迹图层
  private trackLayer: VectorLayer<VectorSource> | null = null;
  // 轨迹点图层（用于显示轨迹点上的图标）
  private trackPointLayer: VectorLayer<VectorSource> | null = null;
  // 轨迹集合
  private tracks = new Map<string, Track>();
  // 轨迹特征集合
  private trackFeatures = new Map<string, Feature>();
  // 轨迹点特征集合
  private trackPointFeatures = new Map<string, Feature[]>();
  // 轨迹配置
  private config: TrackConfig = DEFAULT_TRACK_CONFIG;
  // 点击事件监听器
  private clickListener: EventsKey | null = null;
  // 当前选中的轨迹ID
  private selectedTrackId: string | null = null;
  // 全局轨迹显示状态
  private tracksVisible: boolean = true;
  
  // 轨迹播放状态映射
  private trackPlayStates = new Map<string, TrackPlayState>();
  // 轨迹播放器配置映射
  private trackPlayers = new Map<string, TrackPlayer>();
  // 轨迹播放动画帧请求ID映射
  private trackAnimationFrames = new Map<string, number>();
  // 轨迹播放当前点索引映射
  private trackCurrentPoints = new Map<string, number>();
  // 轨迹播放上一次时间戳映射
  private trackLastTimes = new Map<string, number>();
  // 轨迹播放活动标记点ID映射
  private trackActiveMarkers = new Map<string, string>();
  // 轨迹播放经过线特征映射
  private trackPassedLineFeatures = new Map<string, Feature>();

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 轨迹配置
   */
  constructor(mapInstance: OlMap | null = null, config?: TrackConfig) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    
    if (config) {
      this.setConfig(config);
    }
    
    this.log('debug', '轨迹对象已创建');
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    this.mapInstance = mapInstance;
    
    // 初始化轨迹图层
    this.initLayers();
    
    // 初始化事件监听
    this.initEvents();
    
    this.log('debug', '地图实例已设置');
  }

  /**
   * 设置轨迹配置
   * @param config 轨迹配置
   */
  public setConfig(config: TrackConfig): void {
    this.config = {
      ...DEFAULT_TRACK_CONFIG,
      ...config
    };
    
    this.log('debug', '轨迹配置已设置');
  }

  /**
   * 初始化图层
   */
  private initLayers(): void {
    if (!this.mapInstance) {
      this.log('warn', '初始化图层失败: 地图实例不存在');
      return;
    }
    
    // 创建轨迹图层
    this.trackLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 20
    });
    
    // 创建轨迹点图层
    this.trackPointLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 21
    });
    
    // 添加图层到地图
    this.mapInstance.addLayer(this.trackLayer);
    this.mapInstance.addLayer(this.trackPointLayer);
    
    this.log('debug', '轨迹图层已初始化');
  }

  /**
   * 初始化事件监听
   */
  private initEvents(): void {
    if (!this.mapInstance) {
      this.log('warn', '初始化事件监听失败: 地图实例不存在');
      return;
    }
    
    // 清除之前的监听器
    if (this.clickListener) {
      unByKey(this.clickListener);
      this.clickListener = null;
    }
    
    // 添加点击事件监听器
    this.clickListener = this.mapInstance.on('click', (event) => {
      const features = this.mapInstance!.getFeaturesAtPixel(event.pixel);
      if (features && features.length > 0) {
        for (const feature of features) {
          // 检查是否点击到了轨迹
          const trackId = feature.get('trackId');
          if (trackId && this.tracks.has(trackId)) {
            // 处理轨迹点击事件
            this.selectedTrackId = trackId;
            this.log('debug', `轨迹 "${trackId}" 被点击`);
            // 这里可以触发轨迹点击事件
            break;
          }
        }
      }
    });
    
    this.log('debug', '轨迹事件监听已初始化');
  }

  /**
   * 添加轨迹
   * @param track 轨迹数据
   * @returns 是否添加成功
   */
  public addTrack(track: Track): boolean {
    if (!this.mapInstance || !this.trackLayer) {
      this.log('warn', '添加轨迹失败: 地图或图层未初始化');
      return false;
    }
    
    if (!track.id || !track.points || track.points.length < 2) {
      this.log('warn', '添加轨迹失败: 轨迹数据不完整或点数量不足');
      return false;
    }
    
    // 如果轨迹已存在，先移除
    if (this.tracks.has(track.id)) {
      this.removeTrack(track.id);
    }
    
    // 确保轨迹点按时间排序
    const sortedPoints = [...track.points].sort((a, b) => a.time - b.time);
    
    // 更新轨迹数据
    const updatedTrack: Track = {
      ...track,
      points: sortedPoints,
      visible: track.visible !== false
    };
    
    // 存储轨迹
    this.tracks.set(track.id, updatedTrack);
    
    // 创建轨迹线特征
    const coordinates = sortedPoints.map(p => fromLonLat([p.lng, p.lat]));
    const lineString = new LineString(coordinates);
    const trackFeature = new Feature({
      geometry: lineString,
      trackId: track.id,
      name: track.name
    });
    
    // 设置轨迹样式
    trackFeature.setStyle(new Style({
      stroke: new Stroke({
        color: track.color || this.config.notPassedLineOptions?.color || 'rgba(160, 160, 160, 0.8)',
        width: this.config.notPassedLineOptions?.weight || 3,
        lineCap: 'round',
        lineJoin: 'round'
      })
    }));
    
    // 存储轨迹特征
    this.trackFeatures.set(track.id, trackFeature);
    this.trackLayer.getSource()?.addFeature(trackFeature);
    
    // 创建轨迹点特征
    const pointFeatures: Feature[] = [];
    for (let i = 0; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      const pointFeature = new Feature({
        geometry: new Point(fromLonLat([point.lng, point.lat])),
        trackId: track.id,
        pointIndex: i,
        time: point.time,
        dir: point.dir || 0,
        info: point.info || []
      });
      
      // 设置点样式
      pointFeature.setStyle(new Style({
        image: new CircleStyle({
          radius: 4,
          fill: new Fill({
            color: track.color || 'rgba(24, 144, 255, 1)'
          }),
          stroke: new Stroke({
            color: 'white',
            width: 1
          })
        })
      }));
      
      pointFeatures.push(pointFeature);
    }
    
    // 存储轨迹点特征
    this.trackPointFeatures.set(track.id, pointFeatures);
    
    // 根据轨迹可见状态，决定是否显示轨迹点
    if (track.visible !== false && this.tracksVisible) {
      pointFeatures.forEach(feature => {
        this.trackPointLayer?.getSource()?.addFeature(feature);
      });
    }
    
    this.log('debug', `轨迹 "${track.id}" 添加成功, 点数: ${track.points.length}`);
    return true;
  }

  /**
   * 移除轨迹
   * @param id 轨迹ID
   * @returns 是否移除成功
   */
  public removeTrack(id: string): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法移除`);
      return false;
    }
    
    // 如果正在播放，先停止
    if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING ||
        this.trackPlayStates.get(id) === TrackPlayState.PAUSED) {
      this.stop(id);
    }
    
    // 移除轨迹特征
    if (this.trackFeatures.has(id) && this.trackLayer) {
      const feature = this.trackFeatures.get(id)!;
      this.trackLayer.getSource()?.removeFeature(feature);
      this.trackFeatures.delete(id);
    }
    
    // 移除轨迹点特征
    if (this.trackPointFeatures.has(id) && this.trackPointLayer) {
      const features = this.trackPointFeatures.get(id)!;
      features.forEach(feature => {
        this.trackPointLayer?.getSource()?.removeFeature(feature);
      });
      this.trackPointFeatures.delete(id);
    }
    
    // 移除轨迹数据
    this.tracks.delete(id);
    
    // 清理播放状态
    this.trackPlayStates.delete(id);
    this.trackPlayers.delete(id);
    this.trackCurrentPoints.delete(id);
    this.trackLastTimes.delete(id);
    this.trackActiveMarkers.delete(id);
    this.trackPassedLineFeatures.delete(id);
    
    // 如果移除的是当前选中的轨迹，重置选中状态
    if (this.selectedTrackId === id) {
      this.selectedTrackId = null;
    }
    
    this.log('debug', `轨迹 "${id}" 已移除`);
    return true;
  }

  /**
   * 更新轨迹
   * @param id 轨迹ID
   * @param track 轨迹数据
   * @returns 是否更新成功
   */
  public updateTrack(id: string, track: Partial<Track>): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法更新`);
      return false;
    }
    
    const existingTrack = this.tracks.get(id)!;
    
    // 更新轨迹数据
    const updatedTrack: Track = {
      ...existingTrack,
      ...track,
      id // 确保ID不变
    };
    
    // 如果更新了点数据，重新排序
    if (track.points) {
      updatedTrack.points = [...track.points].sort((a, b) => a.time - b.time);
    }
    
    // 存储更新后的轨迹
    this.tracks.set(id, updatedTrack);
    
    // 如果更新了轨迹点，需要重新创建轨迹
    if (track.points) {
      // 如果正在播放，先停止
      const wasPlaying = this.trackPlayStates.get(id) === TrackPlayState.PLAYING;
      if (wasPlaying) {
        this.pause(id);
      }
      
      // 移除现有轨迹特征
      if (this.trackFeatures.has(id) && this.trackLayer) {
        const feature = this.trackFeatures.get(id)!;
        this.trackLayer.getSource()?.removeFeature(feature);
        this.trackFeatures.delete(id);
      }
      
      // 移除现有轨迹点特征
      if (this.trackPointFeatures.has(id) && this.trackPointLayer) {
        const features = this.trackPointFeatures.get(id)!;
        features.forEach(feature => {
          this.trackPointLayer?.getSource()?.removeFeature(feature);
        });
        this.trackPointFeatures.delete(id);
      }
      
      // 创建轨迹线特征
      const coordinates = updatedTrack.points.map(p => fromLonLat([p.lng, p.lat]));
      const lineString = new LineString(coordinates);
      const trackFeature = new Feature({
        geometry: lineString,
        trackId: id,
        name: updatedTrack.name
      });
      
      // 设置轨迹样式
      trackFeature.setStyle(new Style({
        stroke: new Stroke({
          color: updatedTrack.color || this.config.notPassedLineOptions?.color || 'rgba(160, 160, 160, 0.8)',
          width: this.config.notPassedLineOptions?.weight || 3,
          lineCap: 'round',
          lineJoin: 'round'
        })
      }));
      
      // 存储轨迹特征
      this.trackFeatures.set(id, trackFeature);
      this.trackLayer?.getSource()?.addFeature(trackFeature);
      
      // 创建轨迹点特征
      const pointFeatures: Feature[] = [];
      for (let i = 0; i < updatedTrack.points.length; i++) {
        const point = updatedTrack.points[i];
        const pointFeature = new Feature({
          geometry: new Point(fromLonLat([point.lng, point.lat])),
          trackId: id,
          pointIndex: i,
          time: point.time,
          dir: point.dir || 0,
          info: point.info || []
        });
        
        // 设置点样式
        pointFeature.setStyle(new Style({
          image: new CircleStyle({
            radius: 4,
            fill: new Fill({
              color: updatedTrack.color || 'rgba(24, 144, 255, 1)'
            }),
            stroke: new Stroke({
              color: 'white',
              width: 1
            })
          })
        }));
        
        pointFeatures.push(pointFeature);
      }
      
      // 存储轨迹点特征
      this.trackPointFeatures.set(id, pointFeatures);
      
      // 根据轨迹可见状态，决定是否显示轨迹点
      if (updatedTrack.visible !== false && this.tracksVisible) {
        pointFeatures.forEach(feature => {
          this.trackPointLayer?.getSource()?.addFeature(feature);
        });
      }
      
      // 如果之前在播放，恢复播放
      if (wasPlaying) {
        this.play(id);
      }
    } else {
      // 如果仅更新了其他属性，只需更新样式
      if (track.color && this.trackFeatures.has(id)) {
        const feature = this.trackFeatures.get(id)!;
        feature.setStyle(new Style({
          stroke: new Stroke({
            color: track.color || this.config.notPassedLineOptions?.color || 'rgba(160, 160, 160, 0.8)',
            width: this.config.notPassedLineOptions?.weight || 3,
            lineCap: 'round',
            lineJoin: 'round'
          })
        }));
      }
      
      // 更新轨迹点样式
      if (track.color && this.trackPointFeatures.has(id)) {
        const features = this.trackPointFeatures.get(id)!;
        features.forEach(feature => {
          feature.setStyle(new Style({
            image: new CircleStyle({
              radius: 4,
              fill: new Fill({
                color: track.color || 'rgba(24, 144, 255, 1)'
              }),
              stroke: new Stroke({
                color: 'white',
                width: 1
              })
            })
          }));
        });
      }
      
      // 更新轨迹可见性
      if (track.visible !== undefined) {
        if (track.visible) {
          this.showTrack(id);
        } else {
          this.hideTrack(id);
        }
      }
    }
    
    this.log('debug', `轨迹 "${id}" 已更新`);
    return true;
  }

  /**
   * 显示轨迹
   * @param id 轨迹ID
   * @returns 是否操作成功
   */
  private showTrack(id: string): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法显示`);
      return false;
    }
    
    const track = this.tracks.get(id)!;
    track.visible = true;
    
    // 显示轨迹线
    if (this.trackFeatures.has(id) && this.trackLayer) {
      const feature = this.trackFeatures.get(id)!;
      if (!this.trackLayer.getSource()?.hasFeature(feature)) {
        this.trackLayer.getSource()?.addFeature(feature);
      }
    }
    
    // 显示轨迹点
    if (this.trackPointFeatures.has(id) && this.trackPointLayer && this.tracksVisible) {
      const features = this.trackPointFeatures.get(id)!;
      features.forEach(feature => {
        if (!this.trackPointLayer?.getSource()?.hasFeature(feature)) {
          this.trackPointLayer?.getSource()?.addFeature(feature);
        }
      });
    }
    
    this.log('debug', `轨迹 "${id}" 已显示`);
    return true;
  }

  /**
   * 隐藏轨迹
   * @param id 轨迹ID
   * @returns 是否操作成功
   */
  private hideTrack(id: string): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法隐藏`);
      return false;
    }
    
    const track = this.tracks.get(id)!;
    track.visible = false;
    
    // 隐藏轨迹线
    if (this.trackFeatures.has(id) && this.trackLayer) {
      const feature = this.trackFeatures.get(id)!;
      this.trackLayer.getSource()?.removeFeature(feature);
    }
    
    // 隐藏轨迹点
    if (this.trackPointFeatures.has(id) && this.trackPointLayer) {
      const features = this.trackPointFeatures.get(id)!;
      features.forEach(feature => {
        this.trackPointLayer?.getSource()?.removeFeature(feature);
      });
    }
    
    this.log('debug', `轨迹 "${id}" 已隐藏`);
    return true;
  }

  /**
   * 设置全部轨迹是否可见
   * @param visible 是否可见
   */
  public setAllTracksVisible(visible: boolean): void {
    this.tracksVisible = visible;
    
    // 更新所有轨迹的可见性
    for (const [id, track] of this.tracks.entries()) {
      if (track.visible) {
        if (visible) {
          this.showTrack(id);
        } else {
          this.hideTrack(id);
        }
      }
    }
    
    this.log('debug', `全部轨迹可见性已设置为: ${visible}`);
  }

  /**
   * 获取所有轨迹
   * @returns 轨迹集合
   */
  public getAllTracks(): Map<string, Track> {
    return this.tracks;
  }

  /**
   * 获取轨迹
   * @param id 轨迹ID
   * @returns 轨迹数据
   */
  public getTrack(id: string): Track | null {
    return this.tracks.get(id) || null;
  }

  /**
   * 播放轨迹
   * @param id 轨迹ID
   * @param player 播放器配置（可选）
   * @returns 是否操作成功
   */
  public play(id: string, player?: Partial<TrackPlayer>): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法播放`);
      return false;
    }
    
    const track = this.tracks.get(id)!;
    
    // 如果轨迹不可见，自动显示
    if (!track.visible) {
      this.showTrack(id);
    }
    
    // 获取或设置播放状态
    const currentState = this.trackPlayStates.get(id) || TrackPlayState.STOPPED;
    
    // 如果已经在播放，不做任何操作
    if (currentState === TrackPlayState.PLAYING) {
      this.log('debug', `轨迹 "${id}" 已经在播放中`);
      return true;
    }
    
    // 获取或设置播放器配置
    let currentPlayer = this.trackPlayers.get(id);
    if (!currentPlayer || player) {
      currentPlayer = {
        ...DEFAULT_TRACK_PLAYER,
        ...currentPlayer,
        ...player
      };
      this.trackPlayers.set(id, currentPlayer);
    }
    
    // 如果之前是暂停状态，从暂停点继续播放
    if (currentState === TrackPlayState.PAUSED) {
      this.log('debug', `轨迹 "${id}" 从暂停状态继续播放`);
      this.resumeTrackAnimation(id);
      return true;
    }
    
    // 如果是停止状态，重新开始播放
    if (currentState === TrackPlayState.STOPPED) {
      // 检查轨迹点数量
      if (track.points.length < 2) {
        this.log('warn', `轨迹 "${id}" 点数量不足，无法播放`);
        return false;
      }
      
      // 初始化播放状态
      this.trackCurrentPoints.set(id, 0);
      this.trackLastTimes.set(id, performance.now());
      
      // 创建或获取经过线特征
      this.initPassedLineFeature(id);
      
      // 开始动画
      this.startTrackAnimation(id);
      
      this.log('debug', `轨迹 "${id}" 开始播放`);
      return true;
    }
    
    return false;
  }

  /**
   * 暂停轨迹播放
   * @param id 轨迹ID
   * @returns 是否操作成功
   */
  public pause(id: string): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法暂停`);
      return false;
    }
    
    // 获取播放状态
    const currentState = this.trackPlayStates.get(id);
    
    // 如果不是播放状态，不做任何操作
    if (currentState !== TrackPlayState.PLAYING) {
      this.log('debug', `轨迹 "${id}" 不在播放状态，无法暂停`);
      return false;
    }
    
    // 停止动画帧
    this.stopTrackAnimation(id, false);
    
    // 更新状态为暂停
    this.trackPlayStates.set(id, TrackPlayState.PAUSED);
    
    this.log('debug', `轨迹 "${id}" 已暂停`);
    return true;
  }

  /**
   * 停止轨迹播放
   * @param id 轨迹ID
   * @returns 是否操作成功
   */
  public stop(id: string): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法停止`);
      return false;
    }
    
    // 获取播放状态
    const currentState = this.trackPlayStates.get(id);
    
    // 如果已经是停止状态，不做任何操作
    if (!currentState || currentState === TrackPlayState.STOPPED) {
      this.log('debug', `轨迹 "${id}" 已经是停止状态`);
      return false;
    }
    
    // 停止动画
    this.stopTrackAnimation(id, true);
    
    // 更新状态为停止
    this.trackPlayStates.set(id, TrackPlayState.STOPPED);
    
    // 清除经过线
    this.clearPassedLine(id);
    
    // 移除活动标记点
    this.removeActiveMarker(id);
    
    this.log('debug', `轨迹 "${id}" 已停止`);
    return true;
  }

  /**
   * 初始化经过线特征
   * @param id 轨迹ID
   */
  private initPassedLineFeature(id: string): void {
    if (!this.trackLayer || !this.tracks.has(id)) return;
    
    // 清除现有的经过线特征
    this.clearPassedLine(id);
    
    // 创建新的经过线特征
    const passedLineFeature = new Feature({
      geometry: new LineString([]),
      trackId: id,
      isPassedLine: true
    });
    
    // 设置样式
    passedLineFeature.setStyle(new Style({
      stroke: new Stroke({
        color: this.config.passedLineOptions?.color || 'rgba(24, 144, 255, 1)',
        width: this.config.passedLineOptions?.weight || 4,
        lineCap: 'round',
        lineJoin: 'round'
      })
    }));
    
    // 存储特征
    this.trackPassedLineFeatures.set(id, passedLineFeature);
    
    // 添加到图层
    this.trackLayer.getSource()?.addFeature(passedLineFeature);
  }

  /**
   * 清除经过线
   * @param id 轨迹ID
   */
  private clearPassedLine(id: string): void {
    if (!this.trackLayer) return;
    
    // 移除现有的经过线特征
    if (this.trackPassedLineFeatures.has(id)) {
      const feature = this.trackPassedLineFeatures.get(id)!;
      this.trackLayer.getSource()?.removeFeature(feature);
      this.trackPassedLineFeatures.delete(id);
    }
  }

  /**
   * "创建活动标记点
   * @param id 轨迹ID
   * @param point 轨迹点
   * @param index 点索引
   */
  private createActiveMarker(id: string, point: TrackPoint, index: number): void {
    if (!this.trackPointLayer) return;
    
    // 移除现有的活动标记点
    this.removeActiveMarker(id);
    
    // 创建活动标记点特征
    const markerFeature = new Feature({
      geometry: new Point(fromLonLat([point.lng, point.lat])),
      trackId: id,
      pointIndex: index,
      isActiveMarker: true
    });
    
    // 设置样式
    markerFeature.setStyle(new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: 'rgba(24, 144, 255, 1)'
        }),
        stroke: new Stroke({
          color: 'white',
          width: 2
        })
      })
    }));
    
    // 为标记点生成唯一ID
    const markerId = `track-marker-${id}-${Date.now()}`;
    this.trackActiveMarkers.set(id, markerId);
    
    // 将标记点添加到图层
    this.trackPointLayer.getSource()?.addFeature(markerFeature);
  }

  /**
   * 移除活动标记点
   * @param id 轨迹ID
   */
  private removeActiveMarker(id: string): void {
    if (!this.trackPointLayer) return;
    
    const markerId = this.trackActiveMarkers.get(id);
    if (markerId) {
      // 从图层中查找并移除标记点特征
      const source = this.trackPointLayer.getSource();
      if (source) {
        const features = source.getFeatures();
        for (const feature of features) {
          if (feature.get('trackId') === id && feature.get('isActiveMarker')) {
            source.removeFeature(feature);
            break;
          }
        }
      }
      
      this.trackActiveMarkers.delete(id);
    }
  }

  /**
   * 开始轨迹动画
   * @param id 轨迹ID
   */
  private startTrackAnimation(id: string): void {
    // 设置播放状态
    this.trackPlayStates.set(id, TrackPlayState.PLAYING);
    
    // 开始动画帧循环
    const animate = (timestamp: number) => {
      // 检查轨迹是否还存在
      if (!this.tracks.has(id)) {
        this.stopTrackAnimation(id, true);
        return;
      }
      
      // 获取当前播放状态
      const state = this.trackPlayStates.get(id);
      if (state !== TrackPlayState.PLAYING) {
        return;
      }
      
      // 获取轨迹和播放器配置
      const track = this.tracks.get(id)!;
      const player = this.trackPlayers.get(id)!;
      
      // 计算时间差
      const lastTime = this.trackLastTimes.get(id) || timestamp;
      const deltaTime = timestamp - lastTime;
      this.trackLastTimes.set(id, timestamp);
      
      // 获取当前点索引
      let currentPointIndex = this.trackCurrentPoints.get(id) || 0;
      
      // 如果已经到达最后一个点
      if (currentPointIndex >= track.points.length - 1) {
        // 如果是循环播放，重新开始
        if (player.loop) {
          currentPointIndex = 0;
          this.trackCurrentPoints.set(id, 0);
          
          // 清除经过线并重新初始化
          this.clearPassedLine(id);
          this.initPassedLineFeature(id);
          
          // 继续动画
          this.trackAnimationFrames.set(id, requestAnimationFrame(animate));
          return;
        } else {
          // 否则停止播放
          this.stopTrackAnimation(id, true);
          this.trackPlayStates.set(id, TrackPlayState.STOPPED);
          return;
        }
      }
      
      // 获取当前点和下一个点
      const currentPoint = track.points[currentPointIndex];
      const nextPoint = track.points[currentPointIndex + 1];
      
      // 计算两点间的时间差
      const timeDiff = nextPoint.time - currentPoint.time;
      
      // 计算实时播放速度
      const speed = player.speed; // km/h
      
      // 根据播放速度计算两点间应该经过的时间（毫秒）
      let duration = timeDiff * 1000 / (speed / 3.6); // 将km/h转换为m/s
      
      // 如果计算出的duration太小，确保最小值
      duration = Math.max(duration, 100);
      
      // 更新当前播放进度
      const progress = Math.min(deltaTime / duration, 1);
      
      // 如果进度达到1，移动到下一个点
      if (progress >= 1) {
        currentPointIndex++;
        this.trackCurrentPoints.set(id, currentPointIndex);
        
        // 更新经过线
        this.updatePassedLine(id, currentPointIndex);
        
        // 更新活动标记点
        this.createActiveMarker(id, track.points[currentPointIndex], currentPointIndex);
        
        // 如果设置了相机跟随，移动地图视图
        if (player.withCamera && this.mapInstance) {
          const point = track.points[currentPointIndex];
          const coord = fromLonLat([point.lng, point.lat]);
          this.mapInstance.getView().setCenter(coord);
        }
      } else {
        // 如果在两点之间，计算插值位置
        const currentCoord = fromLonLat([currentPoint.lng, currentPoint.lat]);
        const nextCoord = fromLonLat([nextPoint.lng, nextPoint.lat]);
        
        // 线性插值
        const x = currentCoord[0] + (nextCoord[0] - currentCoord[0]) * progress;
        const y = currentCoord[1] + (nextCoord[1] - currentCoord[1]) * progress;
        
        // 更新经过线到当前位置
        this.updatePassedLine(id, currentPointIndex, [x, y]);
        
        // 将当前位置转换回经纬度
        const [lng, lat] = toLonLat([x, y]);
        
        // 更新活动标记点
        const interpolatedPoint: TrackPoint = {
          ...currentPoint,
          lng,
          lat,
          time: currentPoint.time + (nextPoint.time - currentPoint.time) * progress
        };
        this.createActiveMarker(id, interpolatedPoint, currentPointIndex);
        
        // 如果设置了相机跟随，移动地图视图
        if (player.withCamera && this.mapInstance) {
          this.mapInstance.getView().setCenter([x, y]);
        }
      }
      
      // 继续下一帧动画
      this.trackAnimationFrames.set(id, requestAnimationFrame(animate));
    };
    
    // 启动动画
    this.trackAnimationFrames.set(id, requestAnimationFrame(animate));
  }

  /**
   * 停止轨迹动画
   * @param id 轨迹ID
   * @param resetPosition 是否重置位置
   */
  private stopTrackAnimation(id: string, resetPosition: boolean = false): void {
    // 取消动画帧
    const animationFrame = this.trackAnimationFrames.get(id);
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      this.trackAnimationFrames.delete(id);
    }
    
    // 如果需要重置位置
    if (resetPosition) {
      this.trackCurrentPoints.set(id, 0);
      this.trackLastTimes.delete(id);
    }
  }

  /**
   * 更新经过线
   * @param id 轨迹ID
   * @param currentIndex 当前点索引
   * @param currentPosition 当前插值位置（可选）
   */
  private updatePassedLine(id: string, currentIndex: number, currentPosition?: number[]): void {
    if (!this.trackLayer || !this.tracks.has(id) || !this.trackPassedLineFeatures.has(id)) return;
    
    const track = this.tracks.get(id)!;
    const passedLineFeature = this.trackPassedLineFeatures.get(id)!;
    
    // 计算经过线的坐标
    const coordinates: number[][] = [];
    
    // 添加所有已经过的点
    for (let i = 0; i <= currentIndex; i++) {
      const point = track.points[i];
      coordinates.push(fromLonLat([point.lng, point.lat]));
    }
    
    // 如果有当前插值位置，添加它
    if (currentPosition) {
      coordinates.push(currentPosition);
    }
    
    // 更新几何
    (passedLineFeature.getGeometry() as LineString).setCoordinates(coordinates);
  }

  /**
   * 恢复轨迹动画
   * @param id 轨迹ID
   */
  private resumeTrackAnimation(id: string): void {
    // 设置播放状态
    this.trackPlayStates.set(id, TrackPlayState.PLAYING);
    
    // 重置上次时间戳为当前时间
    this.trackLastTimes.set(id, performance.now());
    
    // 开始动画
    this.startTrackAnimation(id);
  }

  /**
   * 设置轨迹进度
   * @param id 轨迹ID
   * @param progress 进度（0-1）
   * @returns 是否操作成功
   */
  public setTrackProgress(id: string, progress: number): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法设置进度`);
      return false;
    }
    
    if (progress < 0 || progress > 1) {
      this.log('warn', `进度值必须在0-1之间`);
      return false;
    }
    
    const track = this.tracks.get(id)!;
    const pointCount = track.points.length;
    
    if (pointCount < 2) {
      this.log('warn', `轨迹点数量不足，无法设置进度`);
      return false;
    }
    
    // 计算对应的点索引
    const index = Math.floor(progress * (pointCount - 1));
    this.trackCurrentPoints.set(id, index);
    
    // 暂停当前播放（如果正在播放）
    const wasPlaying = this.trackPlayStates.get(id) === TrackPlayState.PLAYING;
    if (wasPlaying) {
      this.pause(id);
    }
    
    // 更新经过线
    this.updatePassedLine(id, index);
    
    // 更新活动标记点
    this.createActiveMarker(id, track.points[index], index);
    
    // 如果之前在播放，恢复播放
    if (wasPlaying) {
      this.resumeTrackAnimation(id);
    }
    
    return true;
  }

  /**
   * 获取轨迹播放状态
   * @param id 轨迹ID
   * @returns 播放状态
   */
  public getTrackPlayState(id: string): TrackPlayState | null {
    if (!this.tracks.has(id)) {
      return null;
    }
    
    return this.trackPlayStates.get(id) || TrackPlayState.STOPPED;
  }

  /**
   * 获取轨迹进度
   * @param id 轨迹ID
   * @returns 进度（0-1）或null
   */
  public getTrackProgress(id: string): number | null {
    if (!this.tracks.has(id) || !this.trackCurrentPoints.has(id)) {
      return null;
    }
    
    const track = this.tracks.get(id)!;
    const currentIndex = this.trackCurrentPoints.get(id)!;
    
    if (track.points.length < 2) {
      return 0;
    }
    
    return currentIndex / (track.points.length - 1);
  }

  /**
   * 输出日志
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    logger[level](`[${LOG_MODULE}] ${message}`, data);
  }
} 