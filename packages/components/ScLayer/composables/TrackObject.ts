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
import { getVectorContext } from 'ol/render';
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
  // 轨迹节点显示状态
  private trackNodesVisible = new Map<string, boolean>();
  // 轨迹节点锚点显示状态
  private trackNodeAnchorsVisible = new Map<string, boolean>();
  // 轨迹节点名称(popover)显示状态
  private trackNodePopoversVisible = new Map<string, boolean>();
  // 轨迹速度弹窗显示状态
  private trackSpeedPopoversVisible = new Map<string, boolean>();
  // 轨迹当前速度
  private trackCurrentSpeeds = new Map<string, number>();
  
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
  // 轨迹播放位置特征映射
  private trackPositionFeatures = new Map<string, Feature>();
  // 轨迹动画事件监听器映射
  private trackAnimationListeners = new Map<string, EventsKey>();
  // 轨迹播放进度映射 (0-1)
  private trackProgressValues = new Map<string, number>();
  // 轨迹播放段落速度系数映射
  private trackSpeedFactors = new Map<string, number>();
  // 轨迹节点速度显示状态
  private trackNodeSpeedsVisible = new Map<string, boolean>();
  // 轨迹移动点位名称显示状态
  private trackMovingPointNameVisible = new Map<string, boolean>();

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
    if (!this.mapInstance || !this.trackLayer || !this.trackPointLayer) {
      console.warn('添加轨迹失败: 地图或图层未初始化');
      return false;
    }
    
    if (!track.id || !track.points || track.points.length < 2) {
      console.warn('添加轨迹失败: 轨迹数据不完整或点数量不足');
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
      // 设置为可见，但节点默认不显示
      visible: true,
      name: track.name || `轨迹 ${track.id}`
    };
    
    // 存储轨迹
    this.tracks.set(track.id, updatedTrack);
    
    // 初始化节点显示和popover设置（默认都为false）
    this.trackNodesVisible.set(track.id, false);
    this.trackNodePopoversVisible.set(track.id, false);
    this.trackSpeedPopoversVisible.set(track.id, false);
    this.trackNodeSpeedsVisible.set(track.id, false);
    this.trackMovingPointNameVisible.set(track.id, true);
    this.trackCurrentSpeeds.set(track.id, 0);
    
    // 创建轨迹线特征
    const coordinates = sortedPoints.map(p => fromLonLat([p.lng, p.lat]));
    const lineString = new LineString(coordinates);
    const trackFeature = new Feature({
      geometry: lineString,
      trackId: track.id,
      name: track.name || `轨迹 ${track.id}`
    });
    
    // 设置轨迹样式
    trackFeature.setStyle(new Style({
      stroke: new Stroke({
        color: track.color || '#1890ff',
        width: 4,
        lineDash: [0, 0]
      })
    }));
    
    // 保存特征引用
    this.trackFeatures.set(track.id, trackFeature);
    
    // 添加到图层
    if (this.trackLayer.getSource()) {
      this.trackLayer.getSource()!.addFeature(trackFeature);
    }
    
    // 创建轨迹点特征（默认隐藏）
    const pointFeatures: Feature[] = [];
    
    sortedPoints.forEach((point, index) => {
      const pointGeometry = new Point(fromLonLat([point.lng, point.lat]));
      const pointFeature = new Feature({
        geometry: pointGeometry,
        trackId: track.id,
        pointIndex: index,
        trackPoint: point
      });
      
      // 设置为null样式（默认不显示）
      pointFeature.setStyle(null);
      
      // 保存特征引用
      pointFeatures.push(pointFeature);
    });
    
    // 存储点特征引用
    this.trackPointFeatures.set(track.id, pointFeatures);
    
    // 初始化轨迹播放设置
    this.trackPlayStates.set(track.id, TrackPlayState.STOPPED);
    this.trackCurrentPoints.set(track.id, 0);
    this.trackProgressValues.set(track.id, 0);
    this.trackSpeedFactors.set(track.id, 1.0);
    
    // 设置默认的播放器配置
    this.trackPlayers.set(track.id, { ...DEFAULT_TRACK_PLAYER });
    
    console.info(`轨迹 "${track.id}" 已添加, 共 ${sortedPoints.length} 个点`);
    
    // 为了确保Vue检测到更改，触发一个自定义事件
    if (typeof document !== 'undefined') {
      const event = new CustomEvent('track-added', { 
        detail: { trackId: track.id } 
      });
      document.dispatchEvent(event);
      
      // 如果存在轨迹播放器元素，也向它发送事件
      const trackPlayerElement = document.querySelector('.track-player');
      if (trackPlayerElement) {
        trackPlayerElement.dispatchEvent(new CustomEvent('track-added', { 
          detail: { trackId: track.id } 
        }));
      }
    }
    
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
    this.trackPositionFeatures.delete(id);
    this.trackAnimationListeners.delete(id);
    
    // 清除轨迹节点显示设置
    this.trackNodesVisible.delete(id);
    this.trackNodePopoversVisible.delete(id);
    this.trackSpeedPopoversVisible.delete(id);
    this.trackNodeSpeedsVisible.delete(id);
    this.trackMovingPointNameVisible.delete(id);
    this.trackCurrentSpeeds.delete(id);
    
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
      
      // 根据轨迹可见状态和节点显示设置，决定是否显示轨迹点
      const isTrackVisible = updatedTrack.visible !== false && this.tracksVisible;
      const shouldShowNodes = this.trackNodesVisible.get(id) === true && isTrackVisible;
      
      if (shouldShowNodes && this.trackPointLayer) {
        pointFeatures.forEach(feature => {
          const showNodePopover = this.trackNodePopoversVisible.get(id) || false;
          feature.setStyle(this.createTrackPointStyle(id, feature.get('pointIndex'), showNodePopover));
          this.trackPointLayer!.getSource()?.addFeature(feature);
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
  public showTrack(id: string): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法显示`);
      return false;
    }
    
    // 如果轨迹已经可见，不需要重复操作
    const track = this.tracks.get(id)!;
    if (track.visible) {
      return true;
    }
    
    // 更新轨迹可见状态
    this.tracks.set(id, {
      ...track,
      visible: true
    });
    
    // 如果轨迹总体可见并且有轨迹特征，添加到图层
    if (this.tracksVisible) {
      // 添加轨迹线
      if (this.trackFeatures.has(id) && this.trackLayer) {
        const feature = this.trackFeatures.get(id)!;
        this.trackLayer.getSource()?.addFeature(feature);
      }
    
      // 添加轨迹点 - 只有当节点显示设置为true时才添加
      if (this.trackPointFeatures.has(id) && this.trackPointLayer && this.trackNodesVisible.get(id) === true) {
        const features = this.trackPointFeatures.get(id)!;
        features.forEach(feature => {
          const showNodePopover = this.trackNodePopoversVisible.get(id) || false;
          feature.setStyle(this.createTrackPointStyle(id, feature.get('pointIndex'), showNodePopover));
          this.trackPointLayer?.getSource()?.addFeature(feature);
        });
      }
    }
    
    this.log('debug', `轨迹 "${id}" 已显示`);
    return true;
  }

  /**
   * 隐藏轨迹
   * @param id 轨迹ID
   * @returns 是否操作成功
   */
  public hideTrack(id: string): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法隐藏`);
      return false;
    }
    
    // 如果轨迹已经不可见，不需要重复操作
    const track = this.tracks.get(id)!;
    if (!track.visible) {
      return true;
    }
    
    // 更新轨迹可见状态
    this.tracks.set(id, {
      ...track,
      visible: false
    });
    
    // 移除轨迹线
    if (this.trackFeatures.has(id) && this.trackLayer) {
      const feature = this.trackFeatures.get(id)!;
      this.trackLayer.getSource()?.removeFeature(feature);
    }
    
    // 移除轨迹点
    if (this.trackPointFeatures.has(id) && this.trackPointLayer) {
      const features = this.trackPointFeatures.get(id)!;
      features.forEach(feature => {
        this.trackPointLayer?.getSource()?.removeFeature(feature);
      });
    }
    
    // 如果正在播放，停止播放
    if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING) {
      this.stop(id);
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
    // 创建新的Map实例，而不是返回内部引用
    const tracksCopy = new Map<string, Track>();
    // 复制所有轨迹数据（深拷贝关键字段）
    this.tracks.forEach((track, id) => {
      // 确保每条轨迹都有名称，以便在UI中显示
      const trackName = track.name || `轨迹 ${id.substring(0, 6)}...`;
      
      // 深拷贝轨迹对象，特别是points数组
      tracksCopy.set(id, {
        ...track,
        name: trackName,
        points: [...track.points], // 创建points数组的新副本
        visible: track.visible || false
      });
    });
    
    this.log('debug', `获取所有轨迹: ${tracksCopy.size}个轨迹`);
    return tracksCopy;
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
    if (!this.tracks.has(id) || !this.mapInstance || !this.trackLayer) {
      this.log('warn', `轨迹 "${id}" 不存在或地图未初始化，无法播放`);
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
    
    // 设置默认速度因子
    if (!this.trackSpeedFactors.has(id)) {
      this.trackSpeedFactors.set(id, 1.0);
    }
    
    // 如果之前是暂停状态，从暂停点继续播放
    if (currentState === TrackPlayState.PAUSED) {
      this.log('debug', `轨迹 "${id}" 从暂停状态继续播放`);
      // 恢复OpenLayers动画
      this.trackPlayStates.set(id, TrackPlayState.PLAYING);
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
      this.trackProgressValues.set(id, 0);
      this.trackLastTimes.set(id, Date.now());
      
      // 创建初始位置特征
      this.createPositionFeature(id);
      
      // 创建或获取经过线特征
      this.initPassedLineFeature(id);
      
      // 添加OpenLayers动画事件监听
      this.setupTrackAnimation(id);
      
      // 设置播放状态
      this.trackPlayStates.set(id, TrackPlayState.PLAYING);
      
      // 开始渲染循环
      this.mapInstance.render();
      
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
    if (!this.tracks.has(id) || !this.mapInstance) {
      this.log('warn', `轨迹 "${id}" 不存在或地图未初始化，无法停止`);
      return false;
    }
    
    // 获取播放状态
    const currentState = this.trackPlayStates.get(id);
    
    // 如果已经是停止状态，不做任何操作
    if (!currentState || currentState === TrackPlayState.STOPPED) {
      this.log('debug', `轨迹 "${id}" 已经是停止状态`);
      return false;
    }
    
    // 移除OpenLayers动画事件监听
    this.removeTrackAnimation(id);
    
    // 更新状态为停止
    this.trackPlayStates.set(id, TrackPlayState.STOPPED);
    
    // 清除经过线
    this.clearPassedLine(id);
    
    // 移除位置特征
    this.removePositionFeature(id);
    
    // 重置进度
    this.trackProgressValues.set(id, 0);
    
    // 触发一次渲染以清除残留效果
    this.mapInstance.render();
    
    this.log('debug', `轨迹 "${id}" 已停止`);
    return true;
  }

  /**
   * 创建位置特征
   * @param id 轨迹ID
   */
  private createPositionFeature(id: string): void {
    if (!this.trackLayer || !this.tracks.has(id)) return;
    
    // 移除现有的位置特征
    this.removePositionFeature(id);
    
    const track = this.tracks.get(id)!;
    const firstPoint = track.points[0];
    
    // 创建新的位置特征
    const positionFeature = new Feature({
      geometry: new Point(fromLonLat([firstPoint.lng, firstPoint.lat])),
      trackId: id,
      isPositionMarker: true
    });
    
    // 设置样式
    positionFeature.setStyle(new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: track.color || 'rgba(24, 144, 255, 1)'
        }),
        stroke: new Stroke({
          color: 'white',
          width: 2
        })
      })
    }));
    
    // 存储特征
    this.trackPositionFeatures.set(id, positionFeature);
    
    // 添加到图层
    this.trackLayer.getSource()?.addFeature(positionFeature);
  }

  /**
   * 移除位置特征
   * @param id 轨迹ID
   */
  private removePositionFeature(id: string): void {
    if (!this.trackLayer) return;
    
    // 移除现有的位置特征
    if (this.trackPositionFeatures.has(id)) {
      const feature = this.trackPositionFeatures.get(id)!;
      this.trackLayer.getSource()?.removeFeature(feature);
      this.trackPositionFeatures.delete(id);
    }
  }

  /**
   * 设置轨迹动画
   * @param id 轨迹ID
   */
  private setupTrackAnimation(id: string): void {
    // 移除现有的动画监听器
    this.removeTrackAnimation(id);
    
    if (!this.mapInstance || !this.trackLayer || !this.tracks.has(id)) {
      return;
    }
    
    const track = this.tracks.get(id)!;
    
    // 获取播放配置
    const player = this.trackPlayers.get(id) || DEFAULT_TRACK_PLAYER;
    
    // 获取当前的速度因子
    const speedFactor = this.trackSpeedFactors.get(id) || 1.0;
    
    // 初始化经过的线特征
    this.initPassedLineFeature(id);
    
    // 保存当前进度
    const currentProgress = this.trackProgressValues.get(id) || 0;
    
    // 从当前进度计算位置
    const position = this.calculatePositionAtProgress(track, currentProgress);
    
    // 获取节点和节点名称显示设置
    const showNodes = this.trackNodesVisible.get(id) || false;
    const showNodePopovers = this.trackNodePopoversVisible.get(id) || false;
    const showSpeedPopovers = this.trackSpeedPopoversVisible.get(id) || false;
    const showNodeSpeeds = this.trackNodeSpeedsVisible.get(id) || false;
    
    // 添加postrender事件监听器
    this.trackAnimationListeners.set(id, this.trackLayer.on('postrender', (event) => {
      const vectorContext = getVectorContext(event);
      const frameState = event.frameState;
      
      if (!frameState) {
        return;
      }
      
      // 如果没有上一次的时间戳，记录当前时间
      if (!this.trackLastTimes.has(id)) {
        this.trackLastTimes.set(id, frameState.time);
        return;
      }
      
      // 计算经过的时间（毫秒）
      const lastTime = this.trackLastTimes.get(id)!;
      const elapsedTime = frameState.time - lastTime;
      
      // 如果正在播放，更新进度
      if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING) {
        // 计算新的进度（考虑速度因子）
        const timeRange = track.points[track.points.length - 1].time - track.points[0].time;
        const progressChange = (elapsedTime * speedFactor) / (timeRange * 1000);
        let newProgress = (this.trackProgressValues.get(id) || 0) + progressChange;
        
        // 处理循环播放
        if (newProgress > 1) {
          if (player.loop) {
            newProgress = newProgress % 1;
          } else {
            newProgress = 1;
            this.trackPlayStates.set(id, TrackPlayState.STOPPED);
          }
        }
        
        // 更新进度
        this.trackProgressValues.set(id, newProgress);
        
        // 计算当前位置
        const position = this.calculatePositionAtProgress(track, newProgress);
        
        // 使相机跟随移动
        if (player.withCamera && this.mapInstance) {
          const view = this.mapInstance.getView();
          view.animate({
            center: fromLonLat([position.lng, position.lat]),
            duration: 100
          });
        }
        
        // 绘制经过的线段
        this.drawPassedLine(id, vectorContext, newProgress);
        
        // 绘制位置标记
        this.drawPositionMarker(id, vectorContext, position);
        
        // 绘制轨迹节点
        this.drawTrackNodes(id, vectorContext, track, newProgress);
      }
      
      // 更新上一次的时间戳
      this.trackLastTimes.set(id, frameState.time);
      
      // 请求下一帧
      this.mapInstance!.render();
    }));
    
    // 请求动画帧以开始渲染
    this.trackAnimationFrames.set(id, requestAnimationFrame(() => {
      this.mapInstance!.render();
    }));
    
    console.debug(`轨迹 "${id}" 动画已设置`);
  }

  /**
   * 移除轨迹动画
   * @param id 轨迹ID
   */
  private removeTrackAnimation(id: string): void {
    // 移除postrender事件监听
    if (this.trackAnimationListeners.has(id)) {
      unByKey(this.trackAnimationListeners.get(id)!);
      this.trackAnimationListeners.delete(id);
    }
  }

  /**
   * 绘制轨迹经过线
   * @param id 轨迹ID
   * @param vectorContext 向量上下文
   * @param progress 当前进度 (0-1)
   */
  private drawPassedLine(id: string, vectorContext: any, progress: number): void {
    const track = this.tracks.get(id)!;
    
    // 计算当前已经过的点
    const passedPointCount = Math.max(1, Math.floor(progress * (track.points.length - 1)));
    
    // 创建经过线的坐标
    const coordinates: number[][] = [];
    for (let i = 0; i <= passedPointCount; i++) {
      const point = track.points[i];
      coordinates.push(fromLonLat([point.lng, point.lat]));
    }
    
    // 如果不是正好在一个点上，添加当前插值位置
    if (passedPointCount < track.points.length - 1) {
      const currentPoint = track.points[passedPointCount];
      const nextPoint = track.points[passedPointCount + 1];
      
      // 计算两点之间的插值比例
      const segmentProgress = (progress * (track.points.length - 1)) - passedPointCount;
      
      // 线性插值计算当前位置
      const lng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * segmentProgress;
      const lat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * segmentProgress;
      
      coordinates.push(fromLonLat([lng, lat]));
    }
    
    // 创建线条几何
    const lineString = new LineString(coordinates);
    
    // 设置经过线样式
    const style = new Style({
      stroke: new Stroke({
        color: this.config.passedLineOptions?.color || 'rgba(24, 144, 255, 1)',
        width: this.config.passedLineOptions?.weight || 4,
        lineCap: 'round',
        lineJoin: 'round'
      })
    });
    
    // 在向量上下文中绘制线条
    vectorContext.setStyle(style);
    vectorContext.drawGeometry(lineString);
  }

  /**
   * 绘制位置标记
   * @param id 轨迹ID
   * @param vectorContext 向量上下文
   * @param position 当前位置
   */
  private drawPositionMarker(id: string, vectorContext: any, position: TrackPoint): void {
    const track = this.tracks.get(id)!;
    
    // 保存当前速度
    const speed = position.speed || 0;
    this.trackCurrentSpeeds.set(id, speed);
    
    // 创建点几何
    const point = new Point(fromLonLat([position.lng, position.lat]));
    
    // 设置标记样式
    const style = new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: track.color || 'rgba(24, 144, 255, 1)'
        }),
        stroke: new Stroke({
          color: 'white',
          width: 2
        })
      })
    });
    
    // 在向量上下文中绘制点
    vectorContext.setStyle(style);
    vectorContext.drawGeometry(point);
    
    // 获取显示设置
    // 对于移动点位名称，默认为false，除非明确设置为true
    const movingPointNameVisible = this.trackMovingPointNameVisible.get(id) === true;
    const showSpeed = this.trackSpeedPopoversVisible.get(id) || false;
    
    // 绘制移动点标题（如果需要）
    if (movingPointNameVisible && position.title) {
      // 创建文本样式
      const textStyle = new Style({
        text: new Text({
          text: position.title,
          offsetY: showSpeed ? -25 : -15, // 如果同时显示速度，标题位置上移
          font: '12px sans-serif',
          fill: new Fill({
            color: '#333333'
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 3
          }),
          overflow: true
        })
      });
      
      vectorContext.setStyle(textStyle);
      vectorContext.drawGeometry(point);
    }
    
    // 绘制移动速度弹窗（如果需要）
    if (showSpeed && speed > 0) {
      // 创建速度文本样式
      const speedTextStyle = new Style({
        text: new Text({
          text: `移动: ${speed.toFixed(1)} km/h`, // 明确标识为移动速度
          offsetY: movingPointNameVisible && position.title ? -40 : -15, // 根据是否显示标题调整位置
          font: 'bold 10px sans-serif',
          fill: new Fill({
            color: '#1890ff'
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 3
          }),
          backgroundFill: new Fill({
            color: 'rgba(24, 144, 255, 0.1)'
          }),
          padding: [2, 5, 2, 5],
          overflow: true
        })
      });
      
      vectorContext.setStyle(speedTextStyle);
      vectorContext.drawGeometry(point);
    }
  }

  /**
   * 根据进度计算轨迹上的位置
   * @param track 轨迹数据
   * @param progress 进度 (0-1)
   * @returns 轨迹点
   */
  private calculatePositionAtProgress(track: Track, progress: number): TrackPoint {
    const points = track.points;
    
    // 边界检查
    if (progress <= 0) return points[0];
    if (progress >= 1) return points[points.length - 1];
    
    // 计算当前点索引
    const exactIndex = progress * (points.length - 1);
    const index = Math.floor(exactIndex);
    const fraction = exactIndex - index;
    
    // 获取当前点和下一个点
    const currentPoint = points[index];
    const nextPoint = points[index + 1];
    
    // 计算方向（如果有）
    let dir: number | undefined;
    if (currentPoint.dir !== undefined && nextPoint.dir !== undefined) {
      // 处理方向跨越0/360度边界的情况
      let dirDiff = nextPoint.dir - currentPoint.dir;
      
      // 如果方向差大于180度，采用最短路径
      if (Math.abs(dirDiff) > 180) {
        if (dirDiff > 0) {
          dirDiff = dirDiff - 360;
        } else {
          dirDiff = dirDiff + 360;
        }
      }
      
      dir = (currentPoint.dir + dirDiff * fraction) % 360;
      if (dir < 0) dir += 360;
    } else {
      dir = currentPoint.dir || nextPoint.dir;
    }
    
    // 计算速度（如果有）
    let speed: number | undefined;
    if (currentPoint.speed !== undefined || nextPoint.speed !== undefined) {
      const currentSpeed = currentPoint.speed || 0;
      const nextSpeed = nextPoint.speed || 0;
      speed = currentSpeed + (nextSpeed - currentSpeed) * fraction;
    }
    
    // 提取或构建标题
    let title = currentPoint.title;
    if (!title && nextPoint.title) {
      title = nextPoint.title;
    }
    
    // 线性插值计算当前位置
    return {
      lng: currentPoint.lng + (nextPoint.lng - currentPoint.lng) * fraction,
      lat: currentPoint.lat + (nextPoint.lat - currentPoint.lat) * fraction,
      time: currentPoint.time + (nextPoint.time - currentPoint.time) * fraction,
      dir: dir,
      speed: speed,
      title: title,
      info: currentPoint.info || nextPoint.info
    };
  }

  /**
   * 设置轨迹段落速度
   * @param id 轨迹ID
   * @param speedFactor 速度因子 (相对于基础速度的倍数)
   * @returns 是否操作成功
   */
  public setTrackSpeedFactor(id: string, speedFactor: number): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法设置速度因子`);
      return false;
    }
    
    if (speedFactor <= 0) {
      this.log('warn', `速度因子必须大于0`);
      return false;
    }
    
    // 保存速度因子
    this.trackSpeedFactors.set(id, speedFactor);
    this.log('debug', `轨迹 "${id}" 速度因子已设置为: ${speedFactor}`);
    return true;
  }

  /**
   * 获取轨迹段落速度
   * @param id 轨迹ID
   * @returns 速度因子或null
   */
  public getTrackSpeedFactor(id: string): number | null {
    if (!this.tracks.has(id)) {
      return null;
    }
    
    return this.trackSpeedFactors.get(id) || 1.0;
  }

  /**
   * 设置轨迹进度
   * @param id 轨迹ID
   * @param progress 进度（0-1）
   * @returns 是否操作成功
   */
  public setTrackProgress(id: string, progress: number): boolean {
    if (!this.tracks.has(id) || !this.mapInstance) {
      this.log('warn', `轨迹 "${id}" 不存在或地图未初始化，无法设置进度`);
      return false;
    }
    
    if (progress < 0 || progress > 1) {
      this.log('warn', `进度值必须在0-1之间`);
      return false;
    }
    
    // 保存进度
    this.trackProgressValues.set(id, progress);
    
    // 如果轨迹在播放中，触发重新渲染
    if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING) {
      this.mapInstance.render();
    }
    
    return true;
  }

  /**
   * 获取轨迹进度
   * @param id 轨迹ID
   * @returns 进度（0-1）或null
   */
  public getTrackProgress(id: string): number | null {
    if (!this.tracks.has(id)) {
      return null;
    }
    
    return this.trackProgressValues.get(id) || 0;
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
   * 清除所有轨迹
   * @returns 是否操作成功
   */
  public clearAllTracks(): boolean {
    // 保存当前所有轨迹ID
    const trackIds = [...this.tracks.keys()];
    
    // 停止所有正在播放的轨迹
    for (const id of trackIds) {
      if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING) {
        this.stop(id);
      }
    }
    
    // 移除所有轨迹
    let success = true;
    for (const id of trackIds) {
      if (!this.removeTrack(id)) {
        success = false;
      }
    }
    
    this.log('debug', `所有轨迹已清除, 共${trackIds.length}个轨迹`);
    return success;
  }

  /**
   * 隐藏所有轨迹
   * @returns 是否操作成功
   */
  public hideAllTracks(): boolean {
    // 获取所有轨迹ID
    const trackIds = [...this.tracks.keys()];
    
    // 隐藏所有轨迹
    let success = true;
    for (const id of trackIds) {
      const track = this.tracks.get(id);
      if (track && track.visible) {
        if (!this.hideTrack(id)) {
          success = false;
        }
      }
    }
    
    this.log('debug', `所有轨迹已隐藏`);
    return success;
  }

  /**
   * 显示所有轨迹
   * @returns 是否操作成功
   */
  public showAllTracks(): boolean {
    // 获取所有轨迹ID
    const trackIds = [...this.tracks.keys()];
    
    // 显示所有轨迹
    let success = true;
    for (const id of trackIds) {
      const track = this.tracks.get(id);
      if (track && !track.visible) {
        if (!this.showTrack(id)) {
          success = false;
        }
      }
    }
    
    this.log('debug', `所有轨迹已显示`);
    return success;
  }

  /**
   * 设置轨迹节点是否可见
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否操作成功
   */
  public setTrackNodesVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `设置轨迹节点可见性失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 明确记录旧值和新值，帮助调试
    const oldValue = this.trackNodesVisible.get(id);
    
    // 更新节点可见性设置 - 确保布尔值类型统一
    this.trackNodesVisible.set(id, visible === true);
    
    this.log('debug', `轨迹 "${id}" 节点可见性从 ${oldValue} 更改为 ${visible}`);
    
    // 更新轨迹点特征的可见性
    if (this.trackPointFeatures.has(id)) {
      const features = this.trackPointFeatures.get(id) || [];
      for (const feature of features) {
        // 设置样式以控制可见性
        if (visible) {
          // 如果显示节点，则需要考虑是否也显示节点名称
          const showNodePopover = this.trackNodePopoversVisible.get(id) || false;
          feature.setStyle(this.createTrackPointStyle(id, feature.get('pointIndex'), showNodePopover));
          
          // 确保特征已添加到图层
          if (this.trackPointLayer && this.trackPointLayer.getSource()) {
            // 添加到图层（如果已存在，OpenLayers会忽略这个操作）
            this.trackPointLayer.getSource()!.addFeature(feature);
          }
        } else {
          // 如果不显示节点，则设置为null样式（隐藏）
          feature.setStyle(null);
          
          // 从图层中移除特征
          if (this.trackPointLayer && this.trackPointLayer.getSource()) {
            try {
              this.trackPointLayer.getSource()!.removeFeature(feature);
            } catch (e) {
              // 忽略特征不存在的错误
            }
          }
        }
      }
    }
    
    // 如果轨迹正在播放，也需要更新动画中的节点显示
    if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING) {
      // 仅重置时间戳并触发重新渲染，而不是完全重置动画
      if (this.mapInstance) {
        this.trackLastTimes.set(id, Date.now());
        this.mapInstance.render();
      }
    } else {
      // 即使不在播放状态，也强制渲染一次，确保更新显示
      if (this.mapInstance) {
        this.mapInstance.render();
      }
    }
    
    return true;
  }
  
  /**
   * 创建轨迹点样式
   * @param id 轨迹ID
   * @param pointIndex 点索引
   * @param showText 是否显示文本
   * @returns 样式对象
   */
  private createTrackPointStyle(id: string, pointIndex: number, showText: boolean = false): Style | Style[] {
    const track = this.tracks.get(id);
    if (!track || !track.points || pointIndex >= track.points.length) {
      return new Style(); // 返回空样式
    }
    
    const point = track.points[pointIndex];
    const trackColor = track.color || '#1890ff';
    
    // 创建点样式
    const pointStyle = new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: trackColor
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 2
        })
      })
    });
    
    // 如果需要显示文本，且有标题
    if (showText && point.title) {
      const textStyle = new Style({
        text: new Text({
          text: point.title,
          offsetY: -15,
          font: '12px sans-serif',
          fill: new Fill({
            color: '#333333'
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 3
          }),
          overflow: true
        })
      });
      
      return [pointStyle, textStyle];
    }
    
    return pointStyle;
  }

  /**
   * 设置轨迹速度弹窗是否可见
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否操作成功
   */
  public setTrackSpeedPopoversVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      console.warn(`设置轨迹速度弹窗可见性失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 更新速度弹窗可见性设置
    this.trackSpeedPopoversVisible.set(id, visible);
    
    // 如果轨迹正在播放，需要更新动画中的速度弹窗显示
    if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING) {
      // 重新设置动画，以应用新的可见性设置
      this.setupTrackAnimation(id);
    }
    
    console.debug(`轨迹 "${id}" 速度弹窗可见性已设置为: ${visible}`);
    return true;
  }

  /**
   * 获取轨迹当前速度
   * @param id 轨迹ID
   * @returns 当前速度（km/h）或null
   */
  public getCurrentSpeed(id: string): number | null {
    if (!this.tracks.has(id)) {
      return null;
    }
    
    return this.trackCurrentSpeeds.get(id) || 0;
  }

  /**
   * 设置轨迹播放器配置（在播放前）
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否操作成功
   */
  public setTrackPlayer(id: string, player: Partial<TrackPlayer>): boolean {
    if (!this.tracks.has(id)) {
      console.warn(`设置轨迹播放器配置失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 获取现有的播放器配置或使用默认配置
    const currentPlayer = this.trackPlayers.get(id) || { ...DEFAULT_TRACK_PLAYER };
    
    // 更新配置
    this.trackPlayers.set(id, {
      ...currentPlayer,
      ...player
    });
    
    console.debug(`轨迹 "${id}" 播放器配置已更新`);
    return true;
  }

  /**
   * 更新已播放轨迹的播放器配置（实时生效）
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否操作成功
   */
  public updateTrackPlayer(id: string, player: Partial<TrackPlayer>): boolean {
    if (!this.tracks.has(id)) {
      console.warn(`更新轨迹播放器配置失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 获取播放状态
    const playState = this.trackPlayStates.get(id);
    
    // 如果轨迹未在播放，使用普通的设置方法
    if (playState !== TrackPlayState.PLAYING) {
      return this.setTrackPlayer(id, player);
    }
    
    // 获取现有的播放器配置
    const currentPlayer = this.trackPlayers.get(id) || { ...DEFAULT_TRACK_PLAYER };
    
    // 更新配置
    const updatedPlayer = {
      ...currentPlayer,
      ...player
    };
    this.trackPlayers.set(id, updatedPlayer);
    
    // 特殊处理相机跟随设置，可以立即生效
    if (player.withCamera !== undefined) {
      // 不需要额外处理，setupTrackAnimation中会读取最新的配置
    }
    
    // 重新设置动画配置，使新的设置生效
    this.setupTrackAnimation(id);
    
    console.debug(`轨迹 "${id}" 播放器配置已实时更新`);
    return true;
  }

  /**
   * 更新轨迹播放速度（实时生效）
   * @param id 轨迹ID
   * @param speedFactor 速度因子
   * @returns 是否操作成功
   */
  public updateTrackSpeed(id: string, speedFactor: number): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `更新轨迹速度失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 检查速度因子是否有效
    if (speedFactor <= 0) {
      this.log('warn', `速度因子必须大于0`);
      return false;
    }
    
    // 存储新的速度因子
    this.trackSpeedFactors.set(id, speedFactor);
    
    // 如果轨迹正在播放中，确保立即应用新的速度
    const playState = this.trackPlayStates.get(id);
    if (playState === TrackPlayState.PLAYING) {
      // 重置上一次时间戳，使得下一帧计算时立即反映新速度
      this.trackLastTimes.set(id, Date.now());
      
      // 触发渲染以立即更新动画
      if (this.mapInstance) {
        this.mapInstance.render();
      }
      
      this.log('debug', `轨迹 "${id}" 速度因子已实时更新为: ${speedFactor}，并立即生效`);
    } else {
      this.log('debug', `轨迹 "${id}" 速度因子已更新为: ${speedFactor}，将在播放时生效`);
    }
    
    return true;
  }

  /**
   * 设置轨迹节点速度是否可见
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否操作成功
   */
  public setTrackNodeSpeedsVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      console.warn(`设置轨迹节点速度可见性失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 更新节点速度可见性设置
    this.trackNodeSpeedsVisible.set(id, visible);
    
    // 如果轨迹正在播放，需要更新动画中的节点速度显示
    if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING) {
      // 重新设置动画，以应用新的可见性设置
      this.setupTrackAnimation(id);
    }
    
    console.debug(`轨迹 "${id}" 节点速度可见性已设置为: ${visible}`);
    return true;
  }

  /**
   * 设置轨迹移动点位名称是否可见
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否操作成功
   */
  public setMovingPointNameVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `设置轨迹移动点位名称可见性失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 明确记录旧值和新值，帮助调试
    const oldValue = this.trackMovingPointNameVisible.get(id);
    
    // 更新移动点位名称可见性设置 - 确保布尔值类型统一
    this.trackMovingPointNameVisible.set(id, visible === true);
    
    this.log('debug', `轨迹 "${id}" 移动点位名称可见性从 ${oldValue} 更改为 ${visible}`);
    
    // 如果轨迹正在播放，需要更新动画中的移动点位名称显示
    if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING) {
      // 为避免性能问题，不需要完全重置动画，只需触发渲染即可
      if (this.mapInstance) {
        // 重置上一次时间戳，确保动画继续流畅
        this.trackLastTimes.set(id, Date.now());
        this.mapInstance.render();
      }
    } else {
      // 如果有轨迹位置特征，更新其样式以反映名称显示变化
      if (this.trackPositionFeatures.has(id) && this.mapInstance) {
        this.mapInstance.render();
      }
    }
    
    return true;
  }

  /**
   * 设置轨迹节点锚点是否可见
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否操作成功
   */
  public setTrackNodeAnchorsVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `设置轨迹节点锚点可见性失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 明确记录旧值和新值，帮助调试
    const oldValue = this.trackNodeAnchorsVisible.get(id);
    
    // 更新节点锚点可见性设置 - 确保布尔值类型统一
    this.trackNodeAnchorsVisible.set(id, visible === true);
    
    this.log('debug', `轨迹 "${id}" 节点锚点可见性从 ${oldValue} 更改为 ${visible}`);
    
    // 轨迹节点锚点显示依赖于节点显示，如果节点设置为可见，重新渲染更新锚点显示状态
    if (this.trackNodesVisible.get(id) === true && this.mapInstance) {
      // 仅重置时间戳并触发重新渲染
      this.trackLastTimes.set(id, Date.now());
      this.mapInstance.render();
    }
    
    return true;
  }

  /**
   * 绘制轨迹节点
   * @param id 轨迹ID
   * @param vectorContext 向量上下文
   * @param track 轨迹数据
   * @param progress 当前进度
   */
  private drawTrackNodes(id: string, vectorContext: any, track: Track, progress: number): void {
    // 获取节点显示设置
    const showNodes = this.trackNodesVisible.get(id) || false;
    const showNodePopovers = this.trackNodePopoversVisible.get(id) || false;
    const showNodeSpeeds = this.trackNodeSpeedsVisible.get(id) || false;
    // 获取节点锚点显示设置，默认为true
    const showNodeAnchors = this.trackNodeAnchorsVisible.get(id) !== false;
    
    if (!showNodes) return;
    
    // 确定哪些点需要绘制（全部显示）
    const visiblePoints = track.points;
    
    // 计算当前位置对应的点索引
    const exactIndex = progress * (track.points.length - 1);
    const currentIndex = Math.floor(exactIndex);
    
    // 为每个节点创建样式并绘制
    for (let i = 0; i < visiblePoints.length; i++) {
      const point = visiblePoints[i];
      
      // 创建点的几何
      const pointGeom = new Point(fromLonLat([point.lng, point.lat]));
      
      // 只有当showNodeAnchors为true时才绘制锚点
      if (showNodeAnchors) {
        // 创建点的样式 - 如果是当前经过的点，使用稍大的尺寸
        const isCurrentNode = (i === currentIndex);
        const pointStyle = new Style({
          image: new CircleStyle({
            radius: isCurrentNode ? 5 : 4,
            fill: new Fill({
              color: isCurrentNode ? '#ff6b18' : (track.color || '#1890ff')
            }),
            stroke: new Stroke({
              color: '#ffffff',
              width: isCurrentNode ? 2 : 1.5
            })
          })
        });
        
        // 绘制点
        vectorContext.setStyle(pointStyle);
        vectorContext.drawGeometry(pointGeom);
      }
      
      // 绘制节点名称（如果需要）
      if (showNodePopovers && point.title) {
        const textStyle = new Style({
          text: new Text({
            text: point.title,
            offsetY: -12,
            font: '10px sans-serif',
            fill: new Fill({
              color: '#333333'
            }),
            stroke: new Stroke({
              color: '#ffffff',
              width: 2
            }),
            overflow: true
          })
        });
        
        vectorContext.setStyle(textStyle);
        vectorContext.drawGeometry(pointGeom);
      }
      
      // 绘制节点速度（如果需要且为当前经过的节点）
      if (showNodeSpeeds && i === currentIndex && point.speed && point.speed > 0) {
        const nodeSpeedTextStyle = new Style({
          text: new Text({
            text: `节点: ${point.speed.toFixed(1)} km/h`,
            offsetY: showNodePopovers && point.title ? -30 : -12,
            font: 'bold 10px sans-serif',
            fill: new Fill({
              color: '#ff6b18' // 使用橙色以区分移动速度
            }),
            stroke: new Stroke({
              color: '#ffffff',
              width: 2
            }),
            backgroundFill: new Fill({
              color: 'rgba(255, 107, 24, 0.1)'
            }),
            padding: [2, 5, 2, 5],
            overflow: true
          })
        });
        
        vectorContext.setStyle(nodeSpeedTextStyle);
        vectorContext.drawGeometry(pointGeom);
      }
    }
  }

  /**
   * 设置轨迹节点名称(popover)是否可见
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否操作成功
   */
  public setTrackNodePopoversVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `设置轨迹节点名称可见性失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 明确记录旧值和新值，帮助调试
    const oldValue = this.trackNodePopoversVisible.get(id);
    
    // 更新节点名称可见性设置 - 确保布尔值类型统一
    this.trackNodePopoversVisible.set(id, visible === true);
    
    this.log('debug', `轨迹 "${id}" 节点名称可见性从 ${oldValue} 更改为 ${visible}`);
    
    // 更新轨迹点特征的文本显示
    if (this.trackPointFeatures.has(id) && this.trackNodesVisible.get(id)) {
      const features = this.trackPointFeatures.get(id) || [];
      for (const feature of features) {
        // 更新样式以显示或隐藏节点名称
        feature.setStyle(this.createTrackPointStyle(id, feature.get('pointIndex'), visible));
      }
    }
    
    // 如果轨迹正在播放，也需要更新动画中的节点名称显示
    if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING) {
      // 仅重置时间戳并触发重新渲染，而不是完全重置动画
      if (this.mapInstance) {
        this.trackLastTimes.set(id, Date.now());
        this.mapInstance.render();
      }
    } else {
      // 即使不在播放状态，也强制渲染一次，确保更新显示
      if (this.mapInstance) {
        this.mapInstance.render();
      }
    }
    
    return true;
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