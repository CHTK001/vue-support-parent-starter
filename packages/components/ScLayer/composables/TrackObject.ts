/**
 * 轨迹对象
 * @description 管理地图上的轨迹
 * 
 * 性能优化说明：
 * 1. 使用Overlay替代Text显示节点信息，减少每帧渲染的开销
 * 2. 使用requestAnimationFrame优化动画循环，确保平滑渲染
 * 3. 实现帧率控制，避免过度渲染
 * 4. 移除冗余条件判断，简化代码执行路径
 * 5. 使用GPU加速提升地图渲染性能
 * 6. 优化相机动画，实现平滑跟随效果
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
import { TrackPoint, Track, TrackConfig, IconSpeedGroup } from '../types/track';
import { DataType } from '../types';
import logger from './LogObject';
import Overlay from 'ol/Overlay';

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

// 扩展TrackPlayer接口以添加cameraSmoothness属性
interface ExtendedTrackPlayer {
  loop: boolean;
  speed: number;
  withCamera: boolean;
  speedFactor?: number;
  cameraSmoothness?: number; // 新增的相机平滑度参数
}

// 使用扩展后的接口
// 默认轨迹播放器配置
const DEFAULT_TRACK_PLAYER: ExtendedTrackPlayer = {
  loop: false,
  speed: 20, // 20 km/h 默认速度
  withCamera: true,
  cameraSmoothness: 0.25 // 添加相机平滑度参数
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
  // 轨迹节点时间显示状态
  private trackNodeTimeVisible = new Map<string, boolean>();
  // 轨迹速度弹窗显示状态
  private trackSpeedPopoversVisible = new Map<string, boolean>();
  // 轨迹当前速度
  private trackCurrentSpeeds = new Map<string, number>();
  
  // 轨迹播放状态映射
  private trackPlayStates = new Map<string, TrackPlayState>();
  // 轨迹播放器配置映射 - 使用扩展接口
  private trackPlayers = new Map<string, ExtendedTrackPlayer>();
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
  // 类属性中添加相机动画相关属性
  private trackCameraAnimations = new Map<string, {
    targetCenter: number[];
    lastFrameTime: number;
    active: boolean;
  }>();

  // 在类属性中添加性能优化相关的属性
  private readonly TARGET_FPS = 60; // 目标帧率
  private readonly FRAME_TIME = 1000 / 60; // 理想帧时间(ms)
  private pendingRenderRequest: number | null = null; // 挂起的渲染请求ID

  // 在类属性中添加默认播放器配置的平滑度参数
  private readonly DEFAULT_CAMERA_SMOOTHNESS = 0.25; // 默认相机平滑度(0-1)，越小越平滑

  // 在类属性部分添加新的Overlay相关属性
  private trackNodeOverlays = new Map<string, Map<number, Overlay>>(); // 轨迹节点Overlay映射
  private trackCurrentNodeOverlay: Overlay | null = null; // 当前活动节点Overlay
  private trackMovingOverlay: Overlay | null = null; // 移动点位Overlay

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
    
    // 优化地图渲染性能
    this.optimizeMapRendering();
    
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
    // 清除之前的监听器
    if (this.clickListener) {
      unByKey(this.clickListener);
      this.clickListener = null;
    }
    
    // 添加点击事件监听器
    this.clickListener = this.mapInstance.on('click', (event) => {
      const features = this.mapInstance.getFeaturesAtPixel(event.pixel);
      if (features?.length > 0) {
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
    
    // 确保所有轨迹点都有时间戳
    const pointsWithoutTime = track.points.filter(p => p.time === undefined);
    if (pointsWithoutTime.length > 0) {
      this.log('warn', `轨迹 "${track.id}" 包含 ${pointsWithoutTime.length} 个点没有时间戳，将自动设置为当前时间`);
      
      // 为没有时间戳的点设置当前时间
      const now = Math.floor(Date.now() / 1000);
      pointsWithoutTime.forEach(p => {
        p.time = now;
      });
    }
    
    // 确保轨迹点按时间排序
    const sortedPoints = [...track.points].sort((a, b) => a.time - b.time);
    
    // 更新轨迹数据
    const updatedTrack: Track = {
      ...track,
      points: sortedPoints,
      // 设置为不可见，直到被选中
      visible: false,
      name: track.name || `轨迹 ${track.id}`
    };
    
    // 存储轨迹
    this.tracks.set(track.id, updatedTrack);
    
    // 尝试获取轨迹播放器元素，以获取当前配置
    let showNodes = true;
    let showNodePopovers = true;
    let showNodeTime = true;
    let showSpeedPopovers = false;
    let showNodeSpeeds = false;
    let showMovingPointName = true;
    
    try {
      // 如果存在轨迹播放器元素，尝试获取其配置
      const trackPlayerElement = document.querySelector('.track-player');
      if (trackPlayerElement && trackPlayerElement['__vue__']) {
        // 获取Vue实例
        const playerInstance = trackPlayerElement['__vue__'];
        
        // 尝试获取配置
        if (typeof playerInstance.getConfig === 'function') {
          // 使用getConfig方法获取当前配置
          const config = playerInstance.getConfig();
          if (config) {
            if (config.showNodes !== undefined) showNodes = config.showNodes;
            if (config.showNodePopover !== undefined) showNodePopovers = config.showNodePopover;
            if (config.showNodeTime !== undefined) showNodeTime = config.showNodeTime;
            if (config.showSpeedPopover !== undefined) showSpeedPopovers = config.showSpeedPopover;
            if (config.showNodeSpeed !== undefined) showNodeSpeeds = config.showNodeSpeed;
            if (config.showMovingPointName !== undefined) showMovingPointName = config.showMovingPointName;
            
            this.log('debug', `从轨迹播放器获取节点显示配置: 节点显示=${showNodes}, 节点名称=${showNodePopovers}, 节点时间=${showNodeTime}`);
          }
        } else {
          // 尝试直接从实例属性获取配置
          if (playerInstance.showNodes !== undefined) showNodes = playerInstance.showNodes;
          if (playerInstance.showNodePopover !== undefined) showNodePopovers = playerInstance.showNodePopover;
          if (playerInstance.showNodeTime !== undefined) showNodeTime = playerInstance.showNodeTime;
          if (playerInstance.showSpeedPopover !== undefined) showSpeedPopovers = playerInstance.showSpeedPopover;
          if (playerInstance.showNodeSpeed !== undefined) showNodeSpeeds = playerInstance.showNodeSpeed;
          if (playerInstance.showMovingPointName !== undefined) showMovingPointName = playerInstance.showMovingPointName;
          
          this.log('debug', `直接从轨迹播放器实例获取节点显示配置: 节点显示=${showNodes}, 节点名称=${showNodePopovers}, 节点时间=${showNodeTime}`);
        }
      }
    } catch (error) {
      this.log('warn', '尝试获取轨迹播放器配置时出错:', error);
    }
    
    // 初始化节点显示设置，使用轨迹播放器的当前配置
    this.trackNodesVisible.set(track.id, showNodes);
    this.trackNodePopoversVisible.set(track.id, showNodePopovers);
    this.trackNodeTimeVisible.set(track.id, showNodeTime);
    this.trackSpeedPopoversVisible.set(track.id, showSpeedPopovers);
    this.trackNodeSpeedsVisible.set(track.id, showNodeSpeeds);
    this.trackMovingPointNameVisible.set(track.id, showMovingPointName);
    this.trackCurrentSpeeds.set(track.id, 0);
    // 确保节点锚点默认显示
    this.trackNodeAnchorsVisible.set(track.id, true);
    
    // 创建轨迹线几何和特征，但不添加到图层
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
    
    // 保存特征引用，但不添加到图层
    this.trackFeatures.set(track.id, trackFeature);
    
    // 创建轨迹点特征，但不添加到图层
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
    
    // 存储点特征引用，但不添加到图层
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
    
    // 如果正在播放，先移除动画监听
    if (this.trackPlayStates.get(id) === TrackPlayState.PLAYING ||
        this.trackPlayStates.get(id) === TrackPlayState.PAUSED) {
      this.removeTrackAnimation(id);
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
    
    // 移除轨迹位置特征
    this.removePositionFeature(id);
    
    // 清除经过线
    this.clearPassedLine(id);
    
    // 清除节点Overlay
    this.clearNodeOverlays(id);
    
    // 如果移动Overlay是这个轨迹的，也清除
    if (this.trackMovingOverlay) {
      this.mapInstance!.removeOverlay(this.trackMovingOverlay);
      this.trackMovingOverlay = null;
    }
    
    // 如果当前活动节点Overlay属于这个轨迹，也清除
    if (this.trackCurrentNodeOverlay && this.trackCurrentNodeOverlay.get('trackId') === id) {
      this.mapInstance!.removeOverlay(this.trackCurrentNodeOverlay);
      this.trackCurrentNodeOverlay = null;
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
    this.trackProgressValues.delete(id);
    this.trackSpeedFactors.delete(id);
    
    // 清除轨迹节点显示设置
    this.trackNodesVisible.delete(id);
    this.trackNodePopoversVisible.delete(id);
    this.trackNodeTimeVisible.delete(id);
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
      // 确保轨迹点按时间排序
      updatedTrack.points = [...track.points].sort((a, b) => a.time - b.time);
      
      // 验证每个点都有时间戳
      const invalidPoints = updatedTrack.points.filter(p => p.time === undefined);
      if (invalidPoints.length > 0) {
        this.log('warn', `轨迹 "${id}" 包含 ${invalidPoints.length} 个没有时间戳的点，将被设置为当前时间`);
        
        // 为无时间戳的点添加时间戳（使用当前时间）
        const now = Math.floor(Date.now() / 1000);
        invalidPoints.forEach(p => {
          p.time = now;
        });
        
        // 重新排序
        updatedTrack.points = updatedTrack.points.sort((a, b) => a.time - b.time);
      }
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
      
      // 只有当轨迹可见时才添加到图层
      if (updatedTrack.visible && this.tracksVisible) {
        this.trackLayer?.getSource()?.addFeature(trackFeature);
      }
      
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
        
        // 如果节点和节点名称都设置为显示，则创建Overlay
        if (this.trackNodePopoversVisible.get(id)) {
          // 先清除现有节点Overlay
          this.clearNodeOverlays(id);
          
          // 如果不是播放状态，为所有节点创建Overlay
          if (this.trackPlayStates.get(id) !== TrackPlayState.PLAYING) {
            const showNodeTime = this.trackNodeTimeVisible.get(id) || false;
            
            // 为每个有标题的节点创建Overlay
            for (let i = 0; i < track.points.length; i++) {
              const point = track.points[i];
              
              if (point.title) {
                // 格式化时间
                let timeStr = '';
                if (point.time && showNodeTime) {
                  const date = new Date(point.time * 1000);
                  timeStr = date.toLocaleTimeString();
                }
                
                // 准备节点HTML内容
                let nodeContent = `<div style="color:#333;font-size:11px;font-weight:bold;">${point.title}</div>`;
                
                // 添加时间信息（如果启用）
                if (showNodeTime && timeStr) {
                  nodeContent += `<div style="margin-top:2px;color:#666;font-size:9px;">⏱ ${timeStr}</div>`;
                }
                
                // 创建节点Overlay
                const coordinate = fromLonLat([point.lng, point.lat]);
                this.createNodeOverlay(id, i, nodeContent, coordinate);
              }
            }
          }
        }
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
  public play(id: string, player?: Partial<ExtendedTrackPlayer>): boolean {
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
    
    // 更新播放器配置
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
    
    // 如果是暂停状态，从暂停点继续播放
    if (currentState === TrackPlayState.PAUSED) {
      this.log('debug', `轨迹 "${id}" 从暂停状态继续播放`);
      // 恢复OpenLayers动画
      this.trackPlayStates.set(id, TrackPlayState.PLAYING);
      
      // 更新轨迹速度因子
      if (player?.speedFactor !== undefined) {
        this.trackSpeedFactors.set(id, player.speedFactor);
      }
      
      // 重新设置动画，确保新的速度和配置立即生效
      this.setupTrackAnimation(id);
      
      // 确保地图重绘以触发动画继续
      this.mapInstance.render();
      
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
      
      // 设置播放状态 - 在添加动画监听器前设置，确保动画开始时状态正确
      this.trackPlayStates.set(id, TrackPlayState.PLAYING);
      
      // 添加OpenLayers动画事件监听
      this.setupTrackAnimation(id);
      
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
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法停止播放`);
      return false;
    }
    
    // 获取播放状态
    const currentState = this.trackPlayStates.get(id) || TrackPlayState.STOPPED;
    
    // 如果已经停止，不做任何操作
    if (currentState === TrackPlayState.STOPPED) {
      this.log('debug', `轨迹 "${id}" 已经是停止状态`);
      return true;
    }
    
    // 注意：我们不再移除轨迹动画监听器
    // 我们只是改变播放状态，让动画暂停但保持视觉效果
    // this.removeTrackAnimation(id);
    
    // 设置为停止状态
    this.trackPlayStates.set(id, TrackPlayState.STOPPED);
    
    // 保持进度为当前值，而不是重置为0
    // this.trackProgressValues.set(id, 0);
    
    // 不再重置当前点索引
    // this.trackCurrentPoints.delete(id);
    
    // 不再重置上一次时间戳
    // this.trackLastTimes.delete(id);
    
    // 不再移除位置标记特征和经过线
    // this.removePositionFeature(id);
    // this.clearPassedLine(id);
    
    // 不再清除节点Overlay，保留经过的点的覆盖物
    // 这样用户可以看到轨迹播放经过的所有点
    
    // 移除活动标记
    this.removeActiveMarker(id);
    
    // 触发进度重置事件，但使用当前进度而不是0
    const currentProgress = this.trackProgressValues.get(id) || 0;
    const position = this.calculatePositionAtProgress(this.tracks.get(id)!, currentProgress);
    this.dispatchTrackProgressEvent(id, currentProgress, position);
    
    // 确保地图重绘以更新状态
    if (this.mapInstance) {
      this.mapInstance.render();
    }
    
    this.log('debug', `轨迹 "${id}" 已停止播放`);
    return true;
  }

  /**
   * 创建位置特征
   * @param id 轨迹ID
   */
  private createPositionFeature(id: string): void {
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
    this.trackLayer.getSource().addFeature(positionFeature);
  }

  /**
   * 移除位置特征
   * @param id 轨迹ID
   */
  private removePositionFeature(id: string): void {
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
    
    // 添加安全检查，确保轨迹存在
    const track = this.tracks.get(id);
    if (!track || !track.points || track.points.length < 2) {
      this.log('warn', `设置轨迹动画失败: 轨迹 "${id}" 不存在或点数量不足`);
      return;
    }
    
    // 获取播放配置
    const player = this.trackPlayers.get(id) || DEFAULT_TRACK_PLAYER;
    
    // 获取当前的速度因子（倍速）
    const speedFactor = this.trackSpeedFactors.get(id) || 1.0;
    
    // 初始化经过的线特征
    this.initPassedLineFeature(id);
    
    // 保存当前进度
    const currentProgress = this.trackProgressValues.get(id) || 0;
    
    // 添加帧率控制，降低高频渲染
    let lastRenderTime = performance.now();
    const minRenderInterval = 1000 / this.TARGET_FPS; // 约60FPS的刷新率
    
    // 创建动画循环函数 - 优化版本
    const animateTrack = () => {
      if (this.trackPlayStates.get(id) !== TrackPlayState.PLAYING) {
        return; // 如果不再播放，退出动画循环
      }
      
      // 请求下一帧动画
      this.trackAnimationFrames.set(id, requestAnimationFrame(animateTrack));
      
      // 控制帧率，基于真实经过时间计算
      const now = performance.now();
      const elapsed = now - lastRenderTime;
      
      // 只有经过了足够的时间才触发重绘，保证平稳的帧率
      if (elapsed >= minRenderInterval) {
        // 触发地图重绘，使用防抖模式减少过多的渲染请求
        this.requestDebouncedRender();
        
        // 更新时间戳，避免帧率累积偏差
        lastRenderTime = now;
      }
    };

    // 添加postrender事件监听器
    this.trackAnimationListeners.set(id, this.trackLayer.on('postrender', (event) => {
      const vectorContext = getVectorContext(event);
      const frameState = event.frameState;
      
      if (!frameState) {
        return;
      }
      
      // 获取当前播放状态
      const currentState = this.trackPlayStates.get(id);
      
      // 如果没有上一次的时间戳，记录当前时间
      if (!this.trackLastTimes.has(id)) {
        this.trackLastTimes.set(id, frameState.time);
        return;
      }
      
      // 计算经过的时间（毫秒）
      const lastTime = this.trackLastTimes.get(id)!;
      const elapsedTime = frameState.time - lastTime;
      
      // 计算当前进度值
      let progress = this.trackProgressValues.get(id) || 0;
      
      // 如果正在播放，更新进度
      if (currentState === TrackPlayState.PLAYING) {
        // 计算新的进度
        // 1. 获取轨迹的实际时间范围（秒）
        const timeRange = track.points[track.points.length - 1].time - track.points[0].time;
        
        // 2. 应用倍速因子，计算进度增量
        // 进度变化 = 经过时间(ms) / (轨迹时间范围(s) * 1000) * 速度因子
        const progressChange = (elapsedTime * speedFactor) / (timeRange * 1000);
        
        let newProgress = progress + progressChange;
        
        // 处理循环播放
        if (newProgress > 1) {
          if (player.loop) {
            // 循环播放 - 先记录当前点的状态
            const passedPoints = new Set<number>();
            
            // 保存当前已经过的点索引
            for (let i = 0; i <= Math.floor(progress * (track.points.length - 1)); i++) {
              passedPoints.add(i);
            }
            
            // 重置进度
            newProgress = newProgress % 1;
            
            // 在进度重置前清除当前节点的特殊Overlay
            if (this.trackCurrentNodeOverlay) {
              this.mapInstance!.removeOverlay(this.trackCurrentNodeOverlay);
              this.trackCurrentNodeOverlay = null;
            }
            
            // 重新绘制，但保留已经过的点的Overlay
            // 在下一帧会通过drawTrackNodes处理
          } else {
            // 非循环模式，播放结束
            newProgress = 1;
            this.trackPlayStates.set(id, TrackPlayState.STOPPED);
            
            // 播放结束时不清除节点Overlay，保留已经过的点的覆盖物
            // 但需确保不会在每次播放结束时重复创建Overlay
            // (由于drawTrackNodes会处理这个逻辑，这里无需额外处理)
          }
        }
        
        // 更新进度
        this.trackProgressValues.set(id, newProgress);
        progress = newProgress;
      }
      
      // 计算当前位置
      const position = this.calculatePositionAtProgress(track, progress);
      
      // 使相机跟随移动 - 仅在播放状态下
      if (currentState === TrackPlayState.PLAYING && player.withCamera) {
        const newCenter = fromLonLat([position.lng, position.lat]);
        // 启动或更新相机动画
        this.updateCameraAnimation(id, newCenter);
      }
      
      // 绘制经过的线段和位置标记
      this.drawPassedLine(id, vectorContext, progress);
      this.drawPositionMarker(id, vectorContext, position);
      
      // 绘制轨迹节点
      this.drawTrackNodes(id, vectorContext, track, progress);
      
      // 触发进度事件
      if (currentState === TrackPlayState.PLAYING) {
        this.dispatchTrackProgressEvent(id, progress, position);
        // 更新上一次的时间戳
        this.trackLastTimes.set(id, frameState.time);
      }
    }));
    
    // 启动动画循环
    animateTrack();
    
    this.log('debug', `轨迹 "${id}" 动画已设置`);
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
    
    // 取消动画帧请求
    if (this.trackAnimationFrames.has(id)) {
      cancelAnimationFrame(this.trackAnimationFrames.get(id)!);
      this.trackAnimationFrames.delete(id);
    }
    
    // 停止相机动画
    const cameraAnimation = this.trackCameraAnimations.get(id);
    if (cameraAnimation) {
      cameraAnimation.active = false;
    }
  }

  /**
   * 绘制轨迹经过线
   * @param id 轨迹ID
   * @param vectorContext 向量上下文
   * @param progress 当前进度 (0-1)
   */
  private drawPassedLine(id: string, vectorContext: any, progress: number): void {
    const track = this.tracks.get(id);
    
    // 添加安全检查 - 确保track和track.points存在
    if (!track || !track.points || track.points.length === 0) {
      return; // 如果轨迹不存在或者没有点，直接返回
    }
    
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
    const speedFactor = this.trackSpeedFactors.get(id) || 1.0;
    
    // 获取实际速度和显示速度
    // 当速度因子为1时显示真实速度，否则显示调整后的速度
    const realSpeed = position.speed ? position.speed / speedFactor : 0;
    const displaySpeed = position.speed || 0; // 调整后的速度
    
    // 保存当前速度 (始终保存真实速度)
    this.trackCurrentSpeeds.set(id, realSpeed);
    
    // 创建点几何
    const point = new Point(fromLonLat([position.lng, position.lat]));
    
    // 根据是否有自定义图标设置标记样式
    let style: Style;
    if (position.iconUrl) {
      // 使用自定义图标
      const iconSize = position.iconSize || [24, 24]; // 默认图标大小为24x24
      style = new Style({
        image: new Icon({
          src: position.iconUrl,
          scale: 1,
          size: iconSize,
          anchor: [0.5, 0.5],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction'
        })
      });
    } else {
      // 使用默认圆点样式
      style = new Style({
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
    }
    
    // 在向量上下文中绘制点
    vectorContext.setStyle(style);
    vectorContext.drawGeometry(point);
    
    // 获取显示设置
    // 对于移动点位名称，默认为false，除非明确设置为true
    const movingPointNameVisible = this.trackMovingPointNameVisible.get(id) === true;
    const showSpeed = this.trackSpeedPopoversVisible.get(id) || false;
    
    // 如果需要显示移动点位名称或速度，使用Overlay代替Text
    if ((movingPointNameVisible && position.title) || (showSpeed && displaySpeed > 0)) {
      // 准备HTML内容
      let overlayContent = '';
      
      // 添加标题内容
      if (movingPointNameVisible && position.title) {
        overlayContent += `<div style="font-weight:bold;font-size:12px;color:#333;">${position.title}</div>`;
        
        // 如果经过了有名称的静态点位，显示提示信息
        if (position.staticTitle && position.staticTitle !== position.title) {
          overlayContent += `<div style="color:#666;font-style:italic;font-size:10px;margin-top:2px;">📍 经过: ${position.staticTitle}</div>`;
        }
      }
      
      // 添加速度信息
      if (showSpeed && displaySpeed > 0) {
        // 创建速度文本内容，区分真实速度和调整速度的显示
        const trackColor = track.color || '#1890ff';
        
        if (speedFactor === 1.0) {
          // 正常速度 - 只显示真实速度
          overlayContent += `<div style="color:${trackColor};font-weight:bold;font-size:11px;margin-top:${movingPointNameVisible ? 5 : 0}px;">
            🚄 移动: ${realSpeed.toFixed(1)} km/h
          </div>`;
        } else {
          // 调整的速度 - 显示调整后速度和真实速度
          overlayContent += `<div style="color:${trackColor};font-weight:bold;font-size:11px;margin-top:${movingPointNameVisible ? 5 : 0}px;">
            🚄 移动: ${displaySpeed.toFixed(1)} km/h
          </div>
          <div style="color:#666;font-size:9px;margin-top:2px;">
            实际速度: ${realSpeed.toFixed(1)} km/h
          </div>`;
        }
      }
      
      // 只有在有内容时才创建Overlay
      if (overlayContent) {
        // 创建或更新移动点位Overlay
        this.createMovingOverlay(id, overlayContent, fromLonLat([position.lng, position.lat]));
      }
    } else if (this.trackMovingOverlay) {
      // 如果不需要显示信息，但存在Overlay，则移除
      this.mapInstance!.removeOverlay(this.trackMovingOverlay);
      this.trackMovingOverlay = null;
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
    if (progress <= 0) {
      // 第一个点速度始终为0
      const firstPoint = { ...points[0] };
      firstPoint.speed = 0;
      return firstPoint;
    }
    if (progress >= 1) return points[points.length - 1];
    
    // 获取当前轨迹ID和倍速因子
    const trackId = track.id;
    const speedFactor = this.trackSpeedFactors.get(trackId) || 1.0;
    const player = this.trackPlayers.get(trackId) || DEFAULT_TRACK_PLAYER;
    const defaultSpeed = player.speed; // 默认速度（km/h）
    
    // 计算当前点索引 - 根据速度因子调整索引计算
    // 如果speedFactor>1，则相同进度下索引更大，表示移动更快
    // 如果speedFactor<1，则相同进度下索引更小，表示移动更慢
    const pointsCount = points.length - 1;
    const exactIndex = progress * pointsCount;
    const index = Math.floor(exactIndex);
    const fraction = exactIndex - index;
    
    // 获取当前点和下一个点
    const currentPoint = points[index];
    const nextPoint = index + 1 < points.length ? points[index + 1] : points[index];
    
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
    
    // 计算时间
    const timeDiff = nextPoint.time - currentPoint.time;
    const currentTime = currentPoint.time + timeDiff * fraction;
    
    // 计算实际速度
    let speed: number;
    
    // 特殊处理：如果是第一个点，速度始终为0
    if (index === 0 && fraction < 0.001) {
      speed = 0;
    } else {
      // 计算基于前一个点的速度（与需求一致：当前点速度等于当前点与上一个点的距离除以时间差）
      const prevIndex = Math.max(0, index - 1);
      const prevPoint = points[prevIndex];
      const currPoint = currentPoint;
      
      // 计算前一个点到当前点的距离
      const distance = this.calculateDistance(prevPoint, currPoint);
      const pointTimeDiff = currPoint.time - prevPoint.time;
      
      if (pointTimeDiff <= 0 || index === 0) {
        // 如果是第一个点或时间差无效，使用默认速度并应用倍速因子
        speed = defaultSpeed * speedFactor;
      } else {
        // 计算基础速度（km/h） = 距离(m) / 时间(s) * 3.6
        const baseSpeed = (distance / pointTimeDiff) * 3.6;
        // 应用倍速因子
        speed = baseSpeed * speedFactor;
      }
      
      // 如果当前点已经指定了速度，使用指定的速度
      if (currentPoint.speed !== undefined) {
        speed = currentPoint.speed * speedFactor;
      }
    }
    
    // 提取或构建标题
    // 1. 使用轨迹的整体名称作为移动点位的默认标题
    let dynamicTitle = track.name;
    
    // 2. 如果轨迹有指定的移动点位标题，优先使用
    if (track.movingPointTitle) {
      dynamicTitle = track.movingPointTitle;
    }
    
    // 3. 保存静态点位的名称，用于在经过静态点位时在UI中显示其他信息
    const staticTitle = currentPoint.title || nextPoint.title;
    
    // 线性插值计算当前位置
    return {
      lng: currentPoint.lng + (nextPoint.lng - currentPoint.lng) * fraction,
      lat: currentPoint.lat + (nextPoint.lat - currentPoint.lat) * fraction,
      time: currentTime,
      dir: dir,
      speed: speed,
      // 使用dynamicTitle作为主标题，保持移动点位名称不变
      title: dynamicTitle,
      // 使用新属性staticTitle存储当前经过的静态点位名称
      staticTitle: staticTitle,
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
    this.trackLayer.getSource().addFeature(passedLineFeature);
  }

  /**
   * 清除经过线
   * @param id 轨迹ID
   */
  private clearPassedLine(id: string): void {
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
    
    // 移除所有轨迹动画监听器
    for (const id of trackIds) {
      this.removeTrackAnimation(id);
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
    
    // 同时确保节点锚点也是可见的
    if (visible) {
      this.trackNodeAnchorsVisible.set(id, true);
    }
    
    this.log('debug', `轨迹 "${id}" 节点可见性从 ${oldValue} 更改为 ${visible}, 节点锚点已自动设置为可见`);
    
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
    
    // 处理节点Overlay
    const track = this.tracks.get(id);
    if (track && track.visible) {
      if (visible) {
        // 如果要显示节点，并且节点名称也设置为显示，则创建Overlay
        const showNodePopovers = this.trackNodePopoversVisible.get(id) || false;
        if (showNodePopovers) {
          // 先清除现有节点Overlay
          this.clearNodeOverlays(id);
          
          // 如果不是播放状态，为所有节点创建Overlay
          if (this.trackPlayStates.get(id) !== TrackPlayState.PLAYING) {
            const showNodeTime = this.trackNodeTimeVisible.get(id) || false;
            
            // 为每个节点创建Overlay
            for (let i = 0; i < track.points.length; i++) {
              const point = track.points[i];
              
              // 只为有标题的点创建Overlay
              if (point.title) {
                // 格式化时间
                let timeStr = '';
                if (point.time && showNodeTime) {
                  const date = new Date(point.time * 1000);
                  timeStr = date.toLocaleTimeString();
                }
                
                // 准备节点HTML内容
                let nodeContent = `<div style="color:#333;font-size:11px;font-weight:bold;">${point.title}</div>`;
                
                // 添加时间信息（如果启用）
                if (showNodeTime && timeStr) {
                  nodeContent += `<div style="margin-top:2px;color:#666;font-size:9px;">⏱ ${timeStr}</div>`;
                }
                
                // 创建节点Overlay
                const coordinate = fromLonLat([point.lng, point.lat]);
                this.createNodeOverlay(id, i, nodeContent, coordinate);
              }
            }
          }
        }
      } else {
        // 如果不显示节点，则清除所有节点Overlay
        this.clearNodeOverlays(id);
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
    
    // 创建基础样式数组
    const styles: Style[] = [];
    
    // 1. 判断是否有自定义图标
    let pointStyle: Style;
    if (point.iconUrl) {
      // 使用自定义图标
      const iconSize = point.iconSize || [24, 24]; // 默认图标大小为24x24
      
      pointStyle = new Style({
        image: new Icon({
          src: point.iconUrl,
          scale: 1,
          size: iconSize,
          anchor: [0.5, 0.5], // 锚点设在图标中心
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction'
        })
      });
    } else {
      // 使用默认圆点样式
      pointStyle = new Style({
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
    }
    
    styles.push(pointStyle);
    
    // 如果需要显示文本，且有标题
    if (showText && point.title) {
      // 格式化时间
      let timeStr = '';
      if (point.time && this.trackNodeTimeVisible.get(id) === true) {
        const date = new Date(point.time * 1000);
        timeStr = ` (${date.toLocaleTimeString()})`;
      }
      
      const textStyle = new Style({
        // 文本样式配置（如果需要）
      });
      
      styles.push(textStyle);
    }
    
    return styles.length === 1 ? styles[0] : styles;
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
  public setTrackPlayer(id: string, player: Partial<ExtendedTrackPlayer>): boolean {
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
  public updateTrackPlayer(id: string, player: Partial<ExtendedTrackPlayer>): boolean {
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
   * 设置轨迹节点时间是否可见
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否操作成功
   */
  public setTrackNodeTimeVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `设置轨迹节点时间可见性失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 明确记录旧值和新值，帮助调试
    const oldValue = this.trackNodeTimeVisible.get(id);
    
    // 更新节点时间可见性设置 - 确保布尔值类型统一
    this.trackNodeTimeVisible.set(id, visible === true);
    
    this.log('debug', `轨迹 "${id}" 节点时间可见性从 ${oldValue} 更改为 ${visible}`);
    
    // 如果轨迹正在播放，也需要更新动画中的节点时间显示
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
    const showNodeTime = this.trackNodeTimeVisible.get(id) || false;
    const showNodeSpeeds = this.trackNodeSpeedsVisible.get(id) || false;
    // 获取节点锚点显示设置，默认为true，但必须节点也是可见的
    const showNodeAnchors = showNodes && (this.trackNodeAnchorsVisible.get(id) !== false);
    // 获取倍速因子
    const speedFactor = this.trackSpeedFactors.get(id) || 1.0;
    // 获取当前播放状态
    const playState = this.trackPlayStates.get(id);
    
    if (!showNodes) {
      // 如果不显示节点，清除所有节点Overlay
      this.clearNodeOverlays(id);
      return;
    }
    
    // 确定哪些点需要绘制（全部显示）
    const visiblePoints = track.points;
    
    // 计算当前位置对应的点索引
    const exactIndex = progress * (track.points.length - 1);
    const currentIndex = Math.floor(exactIndex);
    
    // 保存当前经过的点索引 - 用于显示实时速度
    this.trackCurrentPoints.set(id, currentIndex);
    
    // 更新已经过的普通点位为"经过状态"
    for (let i = 0; i <= currentIndex; i++) {
      // 获取已存在的Overlay
      const existingOverlays = this.trackNodeOverlays.get(id);
      if (existingOverlays && existingOverlays.has(i)) {
        const overlay = existingOverlays.get(i)!;
        // 检查是否是普通Overlay（非经过状态和非当前状态）
        const element = overlay.getElement();
        if (element && 
            !element.className.includes('passed-node') && 
            !element.className.includes('current-node')) {
          // 更新为经过状态
          this.updateNodeOverlayToPassed(id, i);
        }
      }
    }
    
    // 为每个节点创建样式并绘制
    for (let i = 0; i < visiblePoints.length; i++) {
      const point = visiblePoints[i];
      const isCurrentNode = (i === currentIndex);
      const isPastNode = (i < currentIndex); // 判断是否是已经过的点
      const coordinate = fromLonLat([point.lng, point.lat]);
      
      // 创建点的几何
      const pointGeom = new Point(coordinate);
      
      // 只有当showNodeAnchors为true时才绘制锚点
      if (showNodeAnchors) {
        // 为点创建样式 - 根据是否有自定义图标
        let pointStyle: Style;
        
        if (point.iconUrl) {
          // 使用自定义图标
          const iconSize = point.iconSize || [24, 24]; // 默认图标大小为24x24
          pointStyle = new Style({
            image: new Icon({
              src: point.iconUrl,
              scale: isCurrentNode ? 1.2 : (isPastNode ? 1.1 : 1),
              size: iconSize,
              anchor: [0.5, 0.5],
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction'
            })
          });
        } else {
          // 使用默认圆点样式
          pointStyle = new Style({
            image: new CircleStyle({
              radius: isCurrentNode ? 6 : (isPastNode ? 5 : 4),
              fill: new Fill({
                color: isCurrentNode ? '#ff6b18' : (isPastNode ? '#52c41a' : (track.color || '#1890ff'))
              }),
              stroke: new Stroke({
                color: '#ffffff',
                width: isCurrentNode ? 2 : (isPastNode ? 1.8 : 1.5)
              })
            })
          });
        }
        
        // 绘制点
        vectorContext.setStyle(pointStyle);
        vectorContext.drawGeometry(pointGeom);
      }
      
      // 绘制节点标注（如果需要）- 使用Overlay替代Text
      if (showNodePopovers && point.title) {
        // 格式化时间
        let timeStr = '';
        if (point.time && showNodeTime) {
          const date = new Date(point.time * 1000);
          timeStr = date.toLocaleTimeString();
        }
        
        // 已存在的Overlay
        const existingOverlays = this.trackNodeOverlays.get(id);
        const overlayExists = existingOverlays && existingOverlays.has(i);
        
        // 如果是当前节点，添加高亮效果并显示
        // if (isCurrentNode) {
        //   // 准备节点HTML内容
        //   let nodeContent = `<div style="font-weight:bold;font-size:12px;color:#ff6b18;">${point.title}</div>`;
          
        //   // 添加时间信息（如果启用）
        //   if (showNodeTime && timeStr) {
        //     nodeContent += `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeStr}</div>`;
        //   }
          
        //   // 计算和添加速度信息
        //   if (showNodeSpeeds) {
        //     let nodeSpeed: number;
        //     let speedText: string;
            
        //     // 确定节点速度
        //     if (i === 0) {
        //       // 第一个点速度始终为0
        //       nodeSpeed = 0;
        //     } else if (point.speed && point.speed > 0) {
        //       // 使用节点自身的速度
        //       nodeSpeed = point.speed;
        //     } else {
        //       // 计算当前点与上一个点的速度
        //       const prevPoint = track.points[i - 1];
        //       const distance = this.calculateDistance(prevPoint, point);
        //       const timeDiff = point.time - prevPoint.time;
              
        //       if (timeDiff > 0) {
        //         // 速度 = 距离(m) / 时间(s) * 3.6 (转换为km/h)
        //         nodeSpeed = (distance / timeDiff) * 3.6;
        //       } else {
        //         // 如果时间差为0，使用默认速度
        //         const player = this.trackPlayers.get(id) || DEFAULT_TRACK_PLAYER;
        //         nodeSpeed = player.speed;
        //       }
        //     }
            
        //     // 根据播放状态决定是否显示实时速度
        //     if (playState === TrackPlayState.PLAYING) {
        //       // 播放中 - 显示当前速度（考虑速度因子）
        //       if (speedFactor === 1.0) {
        //         speedText = `${nodeSpeed.toFixed(1)} km/h`;
        //       } else {
        //         // 显示调整后的速度和真实速度
        //         const adjustedSpeed = nodeSpeed * speedFactor;
        //         speedText = `${adjustedSpeed.toFixed(1)} km/h (实际: ${nodeSpeed.toFixed(1)})`;
        //       }
        //     } else {
        //       // 未播放 - 只显示节点原始速度
        //       speedText = `${nodeSpeed.toFixed(1)} km/h`;
        //     }
            
        //     // 添加速度信息到节点内容
        //     nodeContent += `<div style="margin-top:5px;color:#ff6b18;font-size:11px;font-weight:bold;">🚄 速度: ${speedText}</div>`;
        //   }
          
        //   // 创建或更新当前节点Overlay
        //   if (this.trackCurrentNodeOverlay) {
        //     // 检查是否为同一节点的Overlay，如果是不同的节点则移除当前的
        //     const existingOverlayPointIndex = this.trackCurrentNodeOverlay.get('pointIndex');
        //     if (existingOverlayPointIndex !== i) {
        //       this.mapInstance!.removeOverlay(this.trackCurrentNodeOverlay);
        //       this.trackCurrentNodeOverlay = null;
        //     } else {
        //       // 如果是相同的节点，只更新内容而不重新创建
        //       const element = this.trackCurrentNodeOverlay.getElement();
        //       if (element) {
        //         element.innerHTML = nodeContent;
                
        //         // 添加箭头和边框样式 (确保样式不丢失)
        //         const arrowBorder = document.createElement('div');
        //         arrowBorder.style.position = 'absolute';
        //         arrowBorder.style.bottom = '-10px';
        //         arrowBorder.style.left = '50%';
        //         arrowBorder.style.marginLeft = '-9px';
        //         arrowBorder.style.width = '0';
        //         arrowBorder.style.height = '0';
        //         arrowBorder.style.borderLeft = '9px solid transparent';
        //         arrowBorder.style.borderRight = '9px solid transparent';
        //         arrowBorder.style.borderTop = '9px solid rgba(0,0,0,0.1)';
        //         arrowBorder.style.zIndex = '-1';
                
        //         const arrow = document.createElement('div');
        //         arrow.style.position = 'absolute';
        //         arrow.style.bottom = '-9px';
        //         arrow.style.left = '50%';
        //         arrow.style.marginLeft = '-8px';
        //         arrow.style.width = '0';
        //         arrow.style.height = '0';
        //         arrow.style.borderLeft = '8px solid transparent';
        //         arrow.style.borderRight = '8px solid transparent';
        //         arrow.style.borderTop = '8px solid white';
                
        //         element.appendChild(arrowBorder);
        //         element.appendChild(arrow);
                
        //         // 更新位置
        //         this.trackCurrentNodeOverlay.setPosition(coordinate);
        //         return; // 已更新，无需创建新的
        //       }
        //     }
        //   }
          
        //   // 创建当前节点的Overlay
        //   this.trackCurrentNodeOverlay = this.createNodeOverlay(id, i, nodeContent, coordinate, 'track-node-overlay current-node');
        //   // 为当前节点Overlay添加点索引属性，方便后续判断
        //   this.trackCurrentNodeOverlay.set('pointIndex', i);
        // } 
        // 已经过的点，使用"经过"样式
        //else
          if (isPastNode && (!overlayExists || (overlayExists && existingOverlays.get(i)))) {
          // 已经过的点使用高亮效果标注，类似当前点但颜色不同
          let nodeContent = `<div style="font-weight:bold;font-size:12px;color:#1890ff;">${point.title}</div>`;
          
          // 添加时间信息（如果启用）
          if (showNodeTime && timeStr) {
            nodeContent += `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeStr}</div>`;
          }
          
          // 添加经过时的速度信息 - 经过的点都要显示速度信息，不受showNodeSpeeds设置影响
          let nodeSpeed: number;
          
          // 确定节点速度
          if (i === 0) {
            // 第一个点速度始终为0
            nodeSpeed = 0;
          } else if (point.speed && point.speed > 0) {
            // 使用节点自身的速度
            nodeSpeed = point.speed;
          } else {
            // 计算当前点与上一个点的速度
            const prevPoint = track.points[i - 1];
            const distance = this.calculateDistance(prevPoint, point);
            const timeDiff = point.time - prevPoint.time;
            
            if (timeDiff > 0) {
              // 速度 = 距离(m) / 时间(s) * 3.6 (转换为km/h)
              nodeSpeed = (distance / timeDiff) * 3.6;
            } else {
              // 如果时间差为0，使用默认速度
              const player = this.trackPlayers.get(id) || DEFAULT_TRACK_PLAYER;
              nodeSpeed = player.speed;
            }
          }
          
          // 显示经过速度（即使showNodeSpeeds为false，经过的点也要显示速度）
          nodeContent += `<div style="margin-top:3px;color:#1890ff;font-size:11px;font-weight:bold;">🚄 速度: ${nodeSpeed.toFixed(1)} km/h</div>`;

          // 如果已经有Overlay，更新它
          if (overlayExists) {
            const existingOverlay = existingOverlays.get(i)!;
            const element = existingOverlay.getElement();
            
            if (element) {
              // 更新内容
              element.innerHTML = nodeContent;
              
              // 更新样式 - 将Element类型强制转换为HTMLElement类型
              (element as HTMLElement).style.backgroundColor = '#e6f7ff';
              (element as HTMLElement).style.borderColor = '#91d5ff';
              
              // 更新箭头样式
              const arrows = element.querySelectorAll('div[style*="border-top"]');
              if (arrows && arrows.length > 0) {
                // 更新箭头边框
                if (arrows[0]) {
                  (arrows[0] as HTMLElement).style.borderTop = '9px solid #91d5ff';
                }
                // 更新箭头
                if (arrows[1]) {
                  (arrows[1] as HTMLElement).style.borderTop = '8px solid #e6f7ff';
                }
              }
            }
          } else {
            // 创建新的Overlay并应用"经过"样式
            const overlay = this.createNodeOverlay(id, i, nodeContent, coordinate, 'track-node-overlay passed-node');
            
            // 手动更新样式
            const element = overlay.getElement();
            if (element) {
              (element as HTMLElement).style.backgroundColor = '#e6f7ff';
              (element as HTMLElement).style.borderColor = '#91d5ff';
              
              // 更新箭头样式
              const arrows = element.querySelectorAll('div[style*="border-top"]');
              if (arrows && arrows.length > 0) {
                // 更新箭头边框
                if (arrows[0]) {
                  (arrows[0] as HTMLElement).style.borderTop = '9px solid #91d5ff';
                }
                // 更新箭头
                if (arrows[1]) {
                  (arrows[1] as HTMLElement).style.borderTop = '8px solid #e6f7ff';
                }
              }
            }
          }
        }
        // 未经过的点，普通显示
        else if (!isPastNode && !overlayExists && showNodePopovers) {
          // 准备普通节点的HTML内容
          let nodeContent = `<div style="color:#333;font-size:11px;font-weight:bold;">${point.title}</div>`;
          
          // 添加时间信息（如果启用）
          if (showNodeTime && timeStr) {
            nodeContent += `<div style="margin-top:2px;color:#666;font-size:9px;">⏱ ${timeStr}</div>`;
          }
          
          // 创建普通节点Overlay
          this.createNodeOverlay(id, i, nodeContent, coordinate);
        }
        
        // 额外处理第一个点，确保其标注始终显示
        // if (i === 0 && !overlayExists && showNodePopovers) {
        //   // 根据是否已经过决定样式
        //   if (isPastNode) {
        //     // 使用高亮样式
        //     let nodeContent = `<div style="font-weight:bold;font-size:12px;color:#1890ff;">${point.title}</div>`;
            
        //     // 添加时间信息（如果启用）
        //     if (showNodeTime && timeStr) {
        //       nodeContent += `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeStr}</div>`;
        //     }
            
        //     // 添加经过时的速度信息 - 不受showNodeSpeeds设置影响
        //     const nodeSpeed = 0; // 第一个点速度固定为0
            
        //     // 显示经过速度
        //     nodeContent += `<div style="margin-top:3px;color:#1890ff;font-size:11px;font-weight:bold;">🚄 速度: ${nodeSpeed.toFixed(1)} km/h</div>`;
            
        //     // 创建高亮风格的Overlay
        //     const overlay = this.createNodeOverlay(id, i, nodeContent, coordinate, 'track-node-overlay passed-node');
            
        //     // 手动更新样式
        //     const element = overlay.getElement();
        //     if (element) {
        //       (element as HTMLElement).style.backgroundColor = '#e6f7ff';
        //       (element as HTMLElement).style.borderColor = '#91d5ff';
              
        //       // 更新箭头样式
        //       const arrows = element.querySelectorAll('div[style*="border-top"]');
        //       if (arrows && arrows.length > 0) {
        //         // 更新箭头边框
        //         if (arrows[0]) {
        //           (arrows[0] as HTMLElement).style.borderTop = '9px solid #91d5ff';
        //         }
        //         // 更新箭头
        //         if (arrows[1]) {
        //           (arrows[1] as HTMLElement).style.borderTop = '8px solid #e6f7ff';
        //         }
        //       }
        //     }
        //   } else {
        //     // 使用普通样式
        //     let nodeContent = `<div style="color:#333;font-size:11px;font-weight:bold;">${point.title}</div>`;
            
        //     // 添加时间信息（如果启用）
        //     if (showNodeTime && timeStr) {
        //       nodeContent += `<div style="margin-top:2px;color:#666;font-size:9px;">⏱ ${timeStr}</div>`;
        //     }
            
        //     // 创建普通节点Overlay
        //     this.createNodeOverlay(id, i, nodeContent, coordinate);
        //   }
        // }
      }
    }
  }

  /**
   * 计算两点之间的距离（米）
   * @param point1 第一个点
   * @param point2 第二个点
   * @returns 距离（米）
   */
  private calculateDistance(point1: TrackPoint, point2: TrackPoint): number {
    // 地球半径（米）
    const R = 6371000;
    
    // 转换为弧度
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const lon1 = point1.lng * Math.PI / 180;
    const lon2 = point2.lng * Math.PI / 180;
    
    // 计算差值
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    // 使用Haversine公式计算距离
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
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
    
    // 获取轨迹
    const track = this.tracks.get(id);
    if (!track) return true;
    
    // 如果设置为可见，并且节点也是可见的，则立即创建节点Overlay
    if (visible && this.trackNodesVisible.get(id) && track.visible) {
      // 先清除现有节点Overlay
      this.clearNodeOverlays(id);
      
      // 如果不是播放状态，创建所有节点的Overlay
      if (this.trackPlayStates.get(id) !== TrackPlayState.PLAYING) {
        const showNodeTime = this.trackNodeTimeVisible.get(id) || false;
        
        // 为每个节点创建Overlay
        for (let i = 0; i < track.points.length; i++) {
          const point = track.points[i];
          
          // 只为有标题的点创建Overlay
          if (point.title) {
            // 格式化时间
            let timeStr = '';
            if (point.time && showNodeTime) {
              const date = new Date(point.time * 1000);
              timeStr = date.toLocaleTimeString();
            }
            
            // 准备节点HTML内容
            let nodeContent = `<div style="color:#333;font-size:11px;font-weight:bold;">${point.title}</div>`;
            
            // 添加时间信息（如果启用）
            if (showNodeTime && timeStr) {
              nodeContent += `<div style="margin-top:2px;color:#666;font-size:9px;">⏱ ${timeStr}</div>`;
            }
            
            // 创建节点Overlay
            const coordinate = fromLonLat([point.lng, point.lat]);
            this.createNodeOverlay(id, i, nodeContent, coordinate);
          }
        }
      }
    } else if (!visible) {
      // 如果设置为不可见，则清除所有节点Overlay
      this.clearNodeOverlays(id);
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

  /**
   * 自适应显示轨迹
   * @param id 轨迹ID
   * @param options 配置选项
   * @returns 是否成功
   */
  public fitTrackToView(id: string, options?: {
    gotoStart?: boolean;  // 是否定位到起点，默认为true
    padding?: number[];   // 边距，默认[50, 50, 50, 50]
    duration?: number;    // 动画持续时间，默认400ms
    maxZoom?: number;     // 最大缩放级别，防止过度缩放
  }): boolean {
    if (!this.tracks.has(id) || !this.mapInstance) {
      this.log('warn', `无法自适应显示轨迹: 轨迹 "${id}" 不存在或地图未初始化`);
      return false;
    }
    
    try {
      const track = this.tracks.get(id)!;
      
      // 确保轨迹可见
      if (!track.visible) {
        this.showTrack(id);
      }
      
      // 获取轨迹线要素
      const trackFeature = this.trackFeatures.get(id);
      if (!trackFeature) {
        this.log('warn', `无法自适应显示轨迹: 轨迹 "${id}" 的线要素不存在`);
        return false;
      }
      
      // 获取轨迹几何范围
      const geometry = trackFeature.getGeometry();
      if (!geometry) {
        this.log('warn', `无法自适应显示轨迹: 轨迹 "${id}" 的几何对象不存在`);
        return false;
      }
      
      // 获取轨迹范围
      const extent = geometry.getExtent();
      
      // 使用默认或自定义选项
      const defaultOptions = {
        gotoStart: true,
        padding: [50, 50, 50, 50],
        duration: 400,
        maxZoom: 19
      };
      
      const fitOptions = {
        ...defaultOptions,
        ...options
      };
      
      // 如果需要定位到起点，先移动到起点位置
      if (fitOptions.gotoStart && track.points.length > 0) {
        const startPoint = track.points[0];
        const startCoord = fromLonLat([startPoint.lng, startPoint.lat]);
        
        // 先定位到起点
        this.mapInstance.getView().animate({
          center: startCoord,
          duration: fitOptions.duration / 2
        });
        
        // 延迟执行自适应显示，确保先完成定位到起点的动画
        setTimeout(() => {
          // 自适应显示整条轨迹
          this.mapInstance!.getView().fit(extent, {
            duration: fitOptions.duration / 2,
            padding: fitOptions.padding,
            maxZoom: fitOptions.maxZoom
          });
        }, fitOptions.duration / 2 + 50);
      } else {
        // 直接自适应显示整条轨迹
        this.mapInstance.getView().fit(extent, {
          duration: fitOptions.duration,
          padding: fitOptions.padding,
          maxZoom: fitOptions.maxZoom
        });
      }
      
      // 重置轨迹播放进度
      this.trackProgressValues.set(id, 0);
      
      // 更新地图渲染
      this.mapInstance.render();
      
      this.log('info', `已自适应显示轨迹 "${id}"`);
      return true;
    } catch (error) {
      this.log('error', `自适应显示轨迹 "${id}" 失败:`, error);
      return false;
    }
  }

  /**
   * 触发轨迹进度事件
   * @param id 轨迹ID
   * @param progress 当前进度 (0-1)
   * @param position 当前位置
   */
  private dispatchTrackProgressEvent(id: string, progress: number, position: TrackPoint): void {
    // 更新内部进度状态
    this.trackProgressValues.set(id, progress);
    
    // 获取图层实例
    if (!this.trackLayer) return;
    
    // 创建并分发自定义事件
    const event = new CustomEvent('track-progress', {
      detail: {
        id,
        progress,
        position,
        speed: this.trackCurrentSpeeds.get(id) || 0
      }
    });
    
    // 使用DOM事件API分发事件
    const element = this.mapInstance?.getTargetElement();
    if (element) {
      element.dispatchEvent(event);
    }
    
    // 记录日志
    this.log('debug', `轨迹进度更新: ${id}, 进度: ${Math.round(progress * 100)}%, 位置: [${position.lng.toFixed(6)}, ${position.lat.toFixed(6)}]`);
  }

  /**
   * 更新相机动画
   * @param id 轨迹ID
   * @param targetCenter 目标中心点
   */
  private updateCameraAnimation(id: string, targetCenter: number[]): void {
    // 获取或创建相机动画状态
    let cameraAnimation = this.trackCameraAnimations.get(id);
    if (!cameraAnimation) {
      cameraAnimation = {
        targetCenter,
        lastFrameTime: performance.now(),
        active: false
      };
      this.trackCameraAnimations.set(id, cameraAnimation);
    }
    
    // 更新目标位置
    cameraAnimation.targetCenter = targetCenter;
    
    // 如果动画未激活，启动动画
    if (!cameraAnimation.active) {
      cameraAnimation.active = true;
      // 使用requestAnimationFrame启动动画，确保平滑过渡
      this.animateCamera(id);
    }
  }

  /**
   * 执行相机平滑动画
   * @param id 轨迹ID
   */
  private animateCamera(id: string): void {
    const cameraAnimation = this.trackCameraAnimations.get(id);
    if (!cameraAnimation || !cameraAnimation.active) {
      return;
    }
    
    const view = this.mapInstance.getView();
    const currentCenter = view.getCenter();
    
    if (!currentCenter) {
      // 如果当前没有中心点，直接设置
      view.setCenter(cameraAnimation.targetCenter);
      this.requestNextCameraFrame(id);
      return;
    }
    
    // 获取播放器配置中的平滑度参数，范围0-1，值越小越平滑
    const player = this.trackPlayers.get(id) || DEFAULT_TRACK_PLAYER;
    // 使用配置的平滑度参数，默认为DEFAULT_CAMERA_SMOOTHNESS
    const configuredSmoothness = player.cameraSmoothness !== undefined ? 
      Math.max(0.05, Math.min(1, player.cameraSmoothness)) : 
      this.DEFAULT_CAMERA_SMOOTHNESS;
    
    // 计算当前时间和帧间隔
    const now = performance.now();
    const deltaTime = Math.min(now - cameraAnimation.lastFrameTime, 100); // 防止大间隔
    cameraAnimation.lastFrameTime = now;
    
    // 使用动态平滑系数，基于距离和速度自适应调整
    const distance = Math.sqrt(
      Math.pow(cameraAnimation.targetCenter[0] - currentCenter[0], 2) +
      Math.pow(cameraAnimation.targetCenter[1] - currentCenter[1], 2)
    );
    
    // 基于距离和配置的平滑度动态调整平滑系数
    const baseSmooth = configuredSmoothness;
    const distanceFactor = Math.min(distance / 500, 1); // 500是参考距离
    const adaptiveSmooth = baseSmooth + distanceFactor * 0.35;
    
    // 应用基于帧率的动态调整
    const smoothFactor = Math.min(adaptiveSmooth * (deltaTime / this.FRAME_TIME), 0.8);
    
    // 计算新的中心点坐标 (平滑插值)
    const dx = cameraAnimation.targetCenter[0] - currentCenter[0];
    const dy = cameraAnimation.targetCenter[1] - currentCenter[1];
    
    // 优化：只在移动距离超过阈值时才更新视图，避免微小抖动
    const moveDistance = Math.sqrt(dx * dx + dy * dy);
    const minMoveThreshold = 0.5; // 最小移动阈值，单位为像素
    
    if (moveDistance > minMoveThreshold) {
      // 使用平滑插值计算新的中心点
      const newX = currentCenter[0] + dx * smoothFactor;
      const newY = currentCenter[1] + dy * smoothFactor;
      
      // 更新视图中心点
      view.setCenter([newX, newY]);
      
      // 使用GPU加速的方式渲染
      this.requestDebouncedRender();
    }
    
    // 请求下一帧动画
    this.requestNextCameraFrame(id);
  }

  /**
   * 请求下一帧相机动画
   * @param id 轨迹ID
   */
  private requestNextCameraFrame(id: string): void {
    // 检查动画是否仍在激活状态
    const cameraAnimation = this.trackCameraAnimations.get(id);
    if (!cameraAnimation?.active) {
      return;
    }
    
    // 使用requestAnimationFrame请求下一帧动画，确保与浏览器渲染循环同步
    window.requestAnimationFrame(() => {
      if (this.trackCameraAnimations.get(id)?.active) {
        this.animateCamera(id);
      }
    });
  }

  /**
   * 请求防抖动的地图渲染
   * 避免同一帧中有多个渲染请求
   */
  private requestDebouncedRender(): void {
    if (this.pendingRenderRequest !== null) {
      return; // 已经有一个挂起的渲染请求
    }
    
    // 使用requestAnimationFrame请求在下一帧进行渲染
    this.pendingRenderRequest = window.requestAnimationFrame(() => {
      // 清除请求标记
      this.pendingRenderRequest = null;
      
      // 执行地图渲染
      const mapElement = this.mapInstance.getTargetElement();
      if (mapElement && 
          mapElement.offsetWidth > 0 && 
          mapElement.offsetHeight > 0 &&
          window.getComputedStyle(mapElement).display !== 'none') {
        
        // 更新渲染时添加GPU加速hint
        const canvas = mapElement.querySelector('canvas');
        if (canvas) {
          canvas.style.transform = 'translateZ(0)';
        }
        
        // 执行渲染
        this.mapInstance.render();
      }
    });
  }

  /**
   * 优化地图渲染性能
   */
  private optimizeMapRendering(): void {
    // 获取地图容器
    const mapElement = this.mapInstance.getTargetElement();
    if (!mapElement) return;
    
    // 启用硬件加速
    mapElement.style.transform = 'translateZ(0)';
    mapElement.style.backfaceVisibility = 'hidden';
    
    // 添加will-change提示，告诉浏览器将有变换发生
    mapElement.style.willChange = 'transform';
    
    // 设置OpenLayers选项，减少不必要的渲染
    this.mapInstance.updateSize();
  }

  /**
   * 创建节点Overlay
   * @param id 轨迹ID
   * @param pointIndex 点索引
   * @param content 内容HTML
   * @param position 位置坐标
   * @param className 自定义类名
   */
  private createNodeOverlay(id: string, pointIndex: number, content: string, position: number[], className = 'track-node-overlay'): Overlay {
    const track = this.tracks.get(id);
    const point = track?.points[pointIndex];
    
    // 创建overlay元素
    const element = document.createElement('div');
    element.className = className;
    
    // 检查点位是否有自定义图标
    if (point && point.iconUrl && !content.includes(`<img src="${point.iconUrl}"`)) {
      // 如果有自定义图标且内容中未包含该图标，添加图标到内容顶部
      const iconSize = point.iconSize || [24, 24];
      const iconHtml = `<div style="text-align:center;margin-bottom:4px;">
        <img src="${point.iconUrl}" style="width:${iconSize[0]}px;height:${iconSize[1]}px;vertical-align:middle;" />
      </div>`;
      content = iconHtml + content;
    }
    
    element.innerHTML = content;
    element.style.position = 'absolute';
    element.style.backgroundColor = 'white';
    element.style.padding = '4px 8px';
    element.style.borderRadius = '4px';
    element.style.boxShadow = '0 3px 10px rgba(0,0,0,0.15)';
    element.style.whiteSpace = 'nowrap';
    element.style.pointerEvents = 'none';
    element.style.transform = 'translate(-50%, -100%)';
    element.style.marginBottom = '15px'; // 增加底部空间用于添加箭头
    element.style.border = '1px solid rgba(0,0,0,0.1)';
    
    // 设置特殊样式（如果是当前节点或经过节点）
    if (className.includes('current-node')) {
      element.style.backgroundColor = '#fff8f0';
      element.style.borderColor = '#ffb980';
      element.style.boxShadow = '0 3px 10px rgba(255, 107, 24, 0.2)';
    } else if (className.includes('passed-node')) {
      element.style.backgroundColor = '#e6f7ff';
      element.style.borderColor = '#91d5ff';
      element.style.boxShadow = '0 3px 10px rgba(24, 144, 255, 0.2)';
    }
    
    // 添加箭头样式
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.bottom = '-9px';
    arrow.style.left = '50%';
    arrow.style.marginLeft = '-8px';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '8px solid transparent';
    arrow.style.borderRight = '8px solid transparent';
    arrow.style.borderTop = className.includes('current-node') ? 
      '8px solid #fff8f0' : (className.includes('passed-node') ? '8px solid #e6f7ff' : '8px solid white');
    
    // 添加箭头边框
    const arrowBorder = document.createElement('div');
    arrowBorder.style.position = 'absolute';
    arrowBorder.style.bottom = '-10px';
    arrowBorder.style.left = '50%';
    arrowBorder.style.marginLeft = '-9px';
    arrowBorder.style.width = '0';
    arrowBorder.style.height = '0';
    arrowBorder.style.borderLeft = '9px solid transparent';
    arrowBorder.style.borderRight = '9px solid transparent';
    arrowBorder.style.borderTop = className.includes('current-node') ? 
      '9px solid #ffb980' : (className.includes('passed-node') ? '9px solid #91d5ff' : '9px solid rgba(0,0,0,0.1)');
    arrowBorder.style.zIndex = '-1';
    
    // 添加箭头和边框到overlay元素
    element.appendChild(arrowBorder);
    element.appendChild(arrow);
    
    // 创建overlay
    const overlay = new Overlay({
      element: element,
      position: position,
      positioning: 'bottom-center',
      offset: [0, -13], // 向上偏移13像素
      stopEvent: false
    });
    
    // 存储点索引，用于后续比较
    overlay.set('pointIndex', pointIndex);
    overlay.set('trackId', id);
    
    // 添加到地图
    this.mapInstance!.addOverlay(overlay);
    
    // 存储overlay引用
    if (!this.trackNodeOverlays.has(id)) {
      this.trackNodeOverlays.set(id, new Map<number, Overlay>());
    }
    this.trackNodeOverlays.get(id)!.set(pointIndex, overlay);
    
    return overlay;
  }
  
  /**
   * 创建移动点位Overlay
   * @param id 轨迹ID
   * @param content 内容HTML
   * @param position 位置坐标
   */
  private createMovingOverlay(id: string, content: string, position: number[]): Overlay {
    if (this.trackMovingOverlay) {
      this.mapInstance!.removeOverlay(this.trackMovingOverlay);
    }
    
    // 获取轨迹颜色
    const track = this.tracks.get(id);
    const trackColor = track?.color || '#1890ff';
    
    // 创建overlay元素
    const element = document.createElement('div');
    element.className = 'track-moving-overlay';
    element.innerHTML = content;
    element.style.position = 'absolute';
    element.style.backgroundColor = 'white';
    element.style.padding = '5px 10px';
    element.style.borderRadius = '4px';
    element.style.boxShadow = '0 3px 12px rgba(0,0,0,0.2)';
    element.style.whiteSpace = 'nowrap';
    element.style.pointerEvents = 'none';
    element.style.transform = 'translate(-50%, -100%)';
    element.style.marginBottom = '15px'; // 增加底部空间用于添加箭头
    element.style.fontSize = '12px';
    element.style.zIndex = '1000';
    element.style.border = `1px solid ${trackColor}`;
    
    // 添加箭头边框
    const arrowBorder = document.createElement('div');
    arrowBorder.style.position = 'absolute';
    arrowBorder.style.bottom = '-10px';
    arrowBorder.style.left = '50%';
    arrowBorder.style.marginLeft = '-9px';
    arrowBorder.style.width = '0';
    arrowBorder.style.height = '0';
    arrowBorder.style.borderLeft = '9px solid transparent';
    arrowBorder.style.borderRight = '9px solid transparent';
    arrowBorder.style.borderTop = `9px solid ${trackColor}`;
    arrowBorder.style.zIndex = '-1';
    
    // 添加箭头样式
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.bottom = '-8px';
    arrow.style.left = '50%';
    arrow.style.marginLeft = '-8px';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '8px solid transparent';
    arrow.style.borderRight = '8px solid transparent';
    arrow.style.borderTop = '8px solid white';
    arrow.style.pointerEvents = 'none';
    
    // 添加箭头和边框到overlay元素
    element.appendChild(arrowBorder);
    element.appendChild(arrow);
    
    // 创建overlay
    const overlay = new Overlay({
      element: element,
      position: position,
      positioning: 'bottom-center',
      offset: [0, -8], // 向上偏移8像素
      stopEvent: false
    });
    
    // 添加到地图
    this.mapInstance!.addOverlay(overlay);
    
    // 保存引用
    this.trackMovingOverlay = overlay;
    
    return overlay;
  }
  
  /**
   * 清除轨迹的所有节点Overlay
   * @param id 轨迹ID
   */
  private clearNodeOverlays(id: string): void {
    const overlays = this.trackNodeOverlays.get(id);
    if (overlays) {
      overlays.forEach(overlay => {
        this.mapInstance!.removeOverlay(overlay);
      });
      overlays.clear();
    }
  }
  
  /**
   * 清除所有轨迹Overlay
   */
  private clearAllOverlays(): void {
    // 清除所有节点Overlay
    this.trackNodeOverlays.forEach((overlays, id) => {
      this.clearNodeOverlays(id);
    });
    this.trackNodeOverlays.clear();
    
    // 清除移动点位Overlay
    if (this.trackMovingOverlay) {
      this.mapInstance!.removeOverlay(this.trackMovingOverlay);
      this.trackMovingOverlay = null;
    }
    
    // 清除当前节点Overlay
    if (this.trackCurrentNodeOverlay) {
      this.mapInstance!.removeOverlay(this.trackCurrentNodeOverlay);
      this.trackCurrentNodeOverlay = null;
    }
  }

  /**
   * 更新普通节点为经过状态
   * @param id 轨迹ID
   * @param pointIndex 点索引
   */
  private updateNodeOverlayToPassed(id: string, pointIndex: number): void {
    // 获取已存在的Overlay
    const existingOverlays = this.trackNodeOverlays.get(id);
    if (!existingOverlays || !existingOverlays.has(pointIndex)) {
      return; // 没有找到对应的Overlay
    }

    const overlay = existingOverlays.get(pointIndex)!;
    const element = overlay.getElement();
    if (!element) return;

    // 获取点位
    const track = this.tracks.get(id);
    if (!track || !track.points || pointIndex >= track.points.length) return;
    
    const point = track.points[pointIndex];
    
    // 计算速度
    let nodeSpeed: number;
    if (pointIndex === 0) {
      // 第一个点速度为0
      nodeSpeed = 0;
    } else if (point.speed && point.speed > 0) {
      // 使用点自身的速度
      nodeSpeed = point.speed;
    } else {
      // 计算与前一个点的速度
      const prevPoint = track.points[pointIndex - 1];
      const distance = this.calculateDistance(prevPoint, point);
      const timeDiff = point.time - prevPoint.time;
      
      if (timeDiff > 0) {
        nodeSpeed = (distance / timeDiff) * 3.6;
      } else {
        const player = this.trackPlayers.get(id) || DEFAULT_TRACK_PLAYER;
        nodeSpeed = player.speed;
      }
    }

    // 获取时间信息
    let timeStr = '';
    if (point.time && this.trackNodeTimeVisible.get(id) === true) {
      const date = new Date(point.time * 1000);
      timeStr = date.toLocaleTimeString();
    }
    
    // 创建节点内容，考虑是否有自定义图标
    let nodeContent = '';
    
    // 如果有自定义图标，添加图标到内容
    if (point.iconUrl) {
      const iconSize = point.iconSize || [24, 24];
      nodeContent += `<div style="text-align:center;margin-bottom:4px;">
        <img src="${point.iconUrl}" style="width:${iconSize[0]}px;height:${iconSize[1]}px;vertical-align:middle;" />
      </div>`;
    }
    
    // 添加标题
    nodeContent += `<div style="font-weight:bold;font-size:12px;color:#1890ff;">${point.title || ''}</div>`;
    
    // 添加时间信息
    if (timeStr) {
      nodeContent += `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeStr}</div>`;
    }
    
    // 添加速度信息
    nodeContent += `<div style="margin-top:3px;color:#1890ff;font-size:11px;font-weight:bold;">🚄 速度: ${nodeSpeed.toFixed(1)} km/h</div>`;
    
    // 更新内容
    element.innerHTML = nodeContent;
    
    // 更新样式为经过状态
    element.className = 'track-node-overlay passed-node';
    element.style.backgroundColor = '#e6f7ff';
    element.style.borderColor = '#91d5ff';
    element.style.boxShadow = '0 3px 10px rgba(24, 144, 255, 0.2)';
    
    // 更新箭头样式
    const arrows = element.querySelectorAll('div');
    if (arrows && arrows.length >= 2) {
      // 更新箭头边框
      const arrowBorder = arrows[arrows.length - 2] as HTMLElement;
      arrowBorder.style.borderTop = '9px solid #91d5ff';
      
      // 更新箭头
      const arrow = arrows[arrows.length - 1] as HTMLElement;
      arrow.style.borderTop = '8px solid #e6f7ff';
    }
  }

  /**
   * 选中轨迹
   * @param id 轨迹ID
   * @param options 选项
   * @returns 是否操作成功
   */
  public selectTrack(id: string, options?: {
    clearOthers?: boolean; // 是否清除其他轨迹，默认为true
    autoPlay?: boolean;    // 是否自动播放，默认为false
  }): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `轨迹 "${id}" 不存在，无法选中`);
      return false;
    }
    
    // 设置默认选项
    const defaultOptions = {
      clearOthers: true,
      autoPlay: false
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options
    };
    
    // 如果需要清除其他轨迹，先隐藏所有轨迹
    if (mergedOptions.clearOthers) {
      // 获取所有轨迹ID
      const allTrackIds = [...this.tracks.keys()];
      
      // 停止所有正在播放的轨迹
      for (const trackId of allTrackIds) {
        if (trackId !== id) {
          // 如果轨迹正在播放，先停止播放
          if (this.trackPlayStates.get(trackId) === TrackPlayState.PLAYING ||
              this.trackPlayStates.get(trackId) === TrackPlayState.PAUSED) {
            this.stop(trackId);
          }
          
          // 隐藏轨迹
          this.hideTrack(trackId);
        }
      }
    }
    
    // 显示当前轨迹
    this.showTrack(id);
    
    // 更新选中的轨迹ID
    this.selectedTrackId = id;
    
    // 如果需要自动播放
    if (mergedOptions.autoPlay) {
      // 确保轨迹不在播放状态
      if (this.trackPlayStates.get(id) !== TrackPlayState.PLAYING) {
        this.play(id);
      }
    }
    
    this.log('debug', `轨迹 "${id}" 已选中，clearOthers=${mergedOptions.clearOthers}, autoPlay=${mergedOptions.autoPlay}`);
    return true;
  }
} 