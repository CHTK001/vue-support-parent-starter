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
import { TrackPoint, Track, TrackConfig, IconSpeedGroup, DEFAULT_TRACK_CONFIG } from '../types/track';
import { DataType } from '../types';
import logger from './LogObject';
import Overlay from 'ol/Overlay';
import { IconUtils } from '../utils/IconUtils';
import { DEFAULT_TRACK_PLAYER_CONFIG, DEFAULT_TRACK_SPEED_GROUPS } from '../types/default';
import * as easing from 'ol/easing';

// 轨迹模块的日志前缀
const LOG_MODULE = 'Track';


// 扩展TrackPlayer接口以添加cameraSmoothness属性
interface ExtendedTrackPlayer {
  loop: boolean;
  speed: number;
  withCamera: boolean;
  speedFactor?: number;
  cameraSmoothness?: number; // 相机平滑度参数(0-1)，越小越平滑
  stabilizeViewport?: boolean; // 是否启用视口稳定功能
  viewportUpdateThreshold?: number; // 视图更新阈值
}

// 使用扩展后的接口
// 默认轨迹播放器配置
const DEFAULT_TRACK_PLAYER: ExtendedTrackPlayer = {
  loop: false,
  speed: 20, // 20 km/h 默认速度
  withCamera: true,
  cameraSmoothness: 0.15, // 降低默认平滑度，使动画更平滑
  stabilizeViewport: true, // 默认启用视口稳定功能
  viewportUpdateThreshold: 1.5 // 视图更新阈值
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
    hasMovedOnce?: boolean; // 是否已经执行过首次大距离移动
  }>();

  // 在类属性中添加性能优化相关的属性
  private readonly TARGET_FPS = 45; // 降低目标帧率，提高性能
  private readonly FRAME_TIME = 1000 / 45; // 理想帧时间(ms)
  private pendingRenderRequest: number | null = null; // 挂起的渲染请求ID

  // 在类属性中添加默认播放器配置的平滑度参数
  private readonly DEFAULT_CAMERA_SMOOTHNESS = 0.15; // 降低默认相机平滑度

  // 在类属性部分添加新的Overlay相关属性
  private trackNodeOverlays = new Map<string, Map<number, Overlay>>(); // 轨迹节点Overlay映射
  private trackCurrentNodeOverlay: Overlay | null = null; // 当前活动节点Overlay
  private trackMovingOverlay: Overlay | null = null; // 移动点位Overlay

  // 添加视口稳定相关属性
  private originalViewResolution: number | null = null;
  private originalViewExtent: number[] | null = null;
  private trackViewportStabilized = new Map<string, boolean>();

  // 轨迹节点距离信息可见性
  private trackNodeDistanceVisible = new Map<string, boolean>();
  
  // 轨迹总距离缓存
  private trackTotalDistances = new Map<string, number>();

  /** * 构造函数 * @param mapObjectOrInstance 地图对象或实例 * @param config 轨迹配置 */
  constructor(mapObjectOrInstance: any | null = null, config?: TrackConfig) {
    if (mapObjectOrInstance) {
  // 检查是否是MapObject还是OlMap实例    
      if (mapObjectOrInstance.getMapInstance && typeof mapObjectOrInstance.getMapInstance === 'function') {
  // 如果是MapObject      
        this.mapInstance = mapObjectOrInstance.getMapInstance();
      } else {
  // 如果是OlMap实例     
        this.mapInstance = mapObjectOrInstance;
      }
  // 设置地图实例    
      if (this.mapInstance) {
        this.setMapInstance(this.mapInstance);
      }
    } if (config) {
      this.setConfig(config);
    } this.log('debug', '轨迹对象已创建');
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
    
    // 自动计算每个点的dir方向和forward
    const base = sortedPoints[0];
    for (let i = 0; i < sortedPoints.length; i++) {
      if (i < sortedPoints.length - 1) {
        const p1 = sortedPoints[i];
        const p2 = sortedPoints[i + 1];
        const dLng = p2.lng - p1.lng;
        const dLat = p2.lat - p1.lat;
        const angle = Math.atan2(dLng, dLat) * 180 / Math.PI;
        sortedPoints[i].dir = (angle + 360) % 360;
        // forward判断：以第一个点为基准，右侧为正向
        const cross = (p2.lng - base.lng) * (p1.lat - base.lat) - (p2.lat - base.lat) * (p1.lng - base.lng);
        sortedPoints[i].forward = cross <= 0; // 右侧true，左侧false
      } else if (i > 0) {
        sortedPoints[i].dir = sortedPoints[i - 1].dir;
        sortedPoints[i].forward = sortedPoints[i - 1].forward;
      } else {
        sortedPoints[i].dir = 0;
        sortedPoints[i].forward = true;
      }
    }
    
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
    
    // 自动计算每个点的dir方向和forward
    const base = updatedTrack.points[0];
    for (let i = 0; i < updatedTrack.points.length; i++) {
      if (i < updatedTrack.points.length - 1) {
        const p1 = updatedTrack.points[i];
        const p2 = updatedTrack.points[i + 1];
        const dLng = p2.lng - p1.lng;
        const dLat = p2.lat - p1.lat;
        const angle = Math.atan2(dLng, dLat) * 180 / Math.PI;
        updatedTrack.points[i].dir = (angle + 360) % 360;
        // forward判断：以第一个点为基准，右侧为正向
        const cross = (p2.lng - base.lng) * (p1.lat - base.lat) - (p2.lat - base.lat) * (p1.lng - base.lng);
        updatedTrack.points[i].forward = cross <= 0;
      } else if (i > 0) {
        updatedTrack.points[i].dir = updatedTrack.points[i - 1].dir;
        updatedTrack.points[i].forward = updatedTrack.points[i - 1].forward;
      } else {
        updatedTrack.points[i].dir = 0;
        updatedTrack.points[i].forward = true;
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
      
      // 设置轨迹样式 - 使用notPassedLineOptions配置
      const notPassedLineOptions = this.config.notPassedLineOptions || { color: 'rgba(160, 160, 160, 0.8)', weight: 3, opacity: 0.5 };
      trackFeature.setStyle(new Style({
        stroke: new Stroke({
          color: updatedTrack.color ? this.applyOpacity(updatedTrack.color, notPassedLineOptions.opacity) : this.applyOpacity(notPassedLineOptions.color, notPassedLineOptions.opacity),
          width: notPassedLineOptions.weight,
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
          forward: point.forward,
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
        const notPassedLineOptions = this.config.notPassedLineOptions || { color: 'rgba(160, 160, 160, 0.8)', weight: 3, opacity: 0.5 };
        feature.setStyle(new Style({
          stroke: new Stroke({
            color: track.color ? this.applyOpacity(track.color, notPassedLineOptions.opacity) : this.applyOpacity(notPassedLineOptions.color, notPassedLineOptions.opacity),
            width: notPassedLineOptions.weight,
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
        const source = this.trackPointLayer.getSource()!;
        
        features.forEach(feature => {
          const showNodePopover = this.trackNodePopoversVisible.get(id) || false;
          feature.setStyle(this.createTrackPointStyle(id, feature.get('pointIndex'), showNodePopover));
          
          // 检查特征是否已经在图层中
          try {
            const featureId = feature.getId();
            let featureExists = false;
            
            if (featureId) {
              // 如果特征有ID，通过ID检查
              featureExists = !!source.getFeatureById(featureId);
            } else {
              // 如果特征没有ID，通过引用检查
              featureExists = source.getFeatures().indexOf(feature) !== -1;
            }
            
            // 只有当特征不存在时才添加
            if (!featureExists) {
              source.addFeature(feature);
            }
          } catch (e) {
            console.warn(`添加轨迹点特征时出错: ${e.message || '未知错误'}`);
          }
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
    
    // 清除轨迹相关的所有Overlay
    this.clearNodeOverlays(id);
    
    // 清除移动点位Overlay（如果属于当前轨迹）
    if (this.trackMovingOverlay && this.selectedTrackId === id) {
      this.mapInstance!.removeOverlay(this.trackMovingOverlay);
      this.trackMovingOverlay = null;
    }
    
    // 清除当前节点Overlay（如果属于当前轨迹）
    if (this.trackCurrentNodeOverlay && this.selectedTrackId === id) {
      this.mapInstance!.removeOverlay(this.trackCurrentNodeOverlay);
      this.trackCurrentNodeOverlay = null;
    }
    
    // 清除轨迹线（过去走过的部分）
    this.clearPassedLine(id);
    
    // 移除位置标记特征
    this.removePositionFeature(id);
    
    // 移除活动标记
    this.removeActiveMarker(id);
    
    this.log('debug', `轨迹 "${id}" 已隐藏并清除所有相关Overlay`);
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
   * @param player 播放器配置
   * @param pauseIfPlaying 如果轨迹已在播放，是否暂停而不是继续播放，默认false
   * @returns 是否操作成功
   */
  public play(id: string, player?: Partial<ExtendedTrackPlayer>, pauseIfPlaying: boolean = false): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `播放轨迹失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 获取轨迹数据
    const track = this.tracks.get(id)!;
    
    // 如果轨迹点数少于2，无法播放
    if (!track.points || track.points.length < 2) {
      this.log('warn', `播放轨迹失败: 轨迹 "${id}" 点数量不足`);
      return false;
    }
    
    // 获取当前播放状态
    const currentState = this.trackPlayStates.get(id);
    
    // 如果正在播放，且pauseIfPlaying为true，则暂停轨迹
    if (currentState === TrackPlayState.PLAYING && pauseIfPlaying) {
      this.log('debug', `轨迹 "${id}" 正在播放中，根据设置执行暂停操作`);
      return this.pause(id);
    }
    
    // 如果正在播放，不需要重新开始
    if (currentState === TrackPlayState.PLAYING) {
      this.log('debug', `轨迹 "${id}" 已经在播放中`);
      return true;
    }
    
    // 如果已经有播放器配置，合并新的配置
    if (this.trackPlayers.has(id)) {
      const existingPlayer = this.trackPlayers.get(id)!;
      this.trackPlayers.set(id, {
        ...existingPlayer,
        ...player
      });
    } else {
      // 否则，创建新的播放器配置
      this.trackPlayers.set(id, {
        ...DEFAULT_TRACK_PLAYER,
        ...player
      });
    }
    
    // 获取当前的播放器配置
    const currentPlayer = this.trackPlayers.get(id)!;
    
    // 如果是从暂停状态恢复，更新播放状态并重新设置动画
    if (currentState === TrackPlayState.PAUSED) {
      // 设置为播放状态
      this.trackPlayStates.set(id, TrackPlayState.PLAYING);
      
      // 重置上次时间戳，确保立即开始移动
      this.trackLastTimes.delete(id);
      
      // 重新设置动画
      this.setupTrackAnimation(id);
      
      // 如果启用了相机跟踪，立即初始化相机位置
      if (currentPlayer.withCamera) {
        const progress = this.trackProgressValues.get(id) || 0;
        const position = this.calculatePositionAtProgress(track, progress); const newCenter = fromLonLat([position.lng, position.lat]);
        // 立即初始化相机动画        
        this.updateCameraAnimation(id, newCenter);
        // 主动触发一次相机动画，确保立即更新相机位置
        this.animateCamera(id);
        this.log('debug', `轨迹 "${id}" 从暂停状态恢复播放，相机位置已立即更新`);
      }
      
      this.log('debug', `轨迹 "${id}" 从暂停状态恢复播放，动画已重新设置`);
      return true;
    }
    
    // 从初始状态或停止状态开始播放
    
    // 确保轨迹可见
    if (!this.showTrack(id)) {
      this.log('warn', `播放轨迹失败: 无法显示轨迹 "${id}"`);
      return false;
    }
    
    // 重置进度
    this.trackProgressValues.set(id, 0);
    
    // 设置为播放状态
    this.trackPlayStates.set(id, TrackPlayState.PLAYING);
    
    // 创建位置标记特征
    this.createPositionFeature(id);
    
    // 设置轨迹动画
    this.setupTrackAnimation(id);
    
    // 如果需要跟随相机且启用了视口稳定，预先保存视图状态
    if (currentPlayer.withCamera && currentPlayer.stabilizeViewport) {
      // 在开始播放前保存初始视图状态
      this.saveOriginalViewState(id);
    }
    
    // 如果开启了相机跟踪，立即初始化第一个位置
    if (currentPlayer.withCamera) {
            const position = track.points[0];      const center = fromLonLat([position.lng, position.lat]);      this.updateCameraAnimation(id, center);            // 主动触发一次相机动画，确保立即更新相机位置      this.animateCamera(id);            // 为确保相机立即移动到起点，先确保视图已设置      if (this.mapInstance) {        this.mapInstance.render();        this.log('debug', `轨迹 "${id}" 播放开始，相机位置已立即设置到起点`);      }
    }
    
    this.log('debug', `轨迹 "${id}" 开始播放，配置:`, currentPlayer);
    
    return true;
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
    
    // 停止动画循环，但保留进度和位置
    // 取消动画帧请求
    if (this.trackAnimationFrames.has(id)) {
      cancelAnimationFrame(this.trackAnimationFrames.get(id)!);
      this.trackAnimationFrames.delete(id);
    }
    
    // 暂停相机动画，但不删除状态 - 这样才能在恢复播放时继续跟随
    if (this.trackCameraAnimations.has(id)) {
      const cameraAnimation = this.trackCameraAnimations.get(id);
      if (cameraAnimation) {
        cameraAnimation.active = false;
      }
    }
    
    // 保存当前进度状态 - 由于我们不调用removeTrackAnimation，这使得恢复播放更容易
    
    this.log('debug', `轨迹 "${id}" 已暂停，动画停止但状态已保留`);
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
    
    // 如果轨迹不在播放状态，直接返回
    if (this.trackPlayStates.get(id) !== TrackPlayState.PLAYING &&
        this.trackPlayStates.get(id) !== TrackPlayState.PAUSED) {
      return true;
    }
    
    // 移除动画
    this.removeTrackAnimation(id);
    
    // 更新状态
    this.trackPlayStates.set(id, TrackPlayState.STOPPED);
    
    // 重置进度
    this.trackProgressValues.set(id, 0);
    
    // 清除经过的线段
    this.clearPassedLine(id);
    
    // 移除位置标记
    this.removeActiveMarker(id);
    
    // 移除位置特征
    this.removePositionFeature(id);
    
    // 清除上一次的时间戳
    this.trackLastTimes.delete(id);
    
    // 重置视图稳定状态
    this.trackViewportStabilized.delete(id);
    this.originalViewResolution = null;
    this.originalViewExtent = null;
    
    // 注意: 不要清除节点覆盖物，保留已经过的点的Overlay
    
    // 通知进度更新
    this.dispatchTrackProgressEvent(id, 0, this.tracks.get(id).points[0]);
    
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
    
    // 如果启用了视口稳定，保存初始视图状态
    if (player.stabilizeViewport) {
      this.saveOriginalViewState(id);
    }
    
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
      
            // 使相机跟随移动 - 仅在播放状态下      if (currentState === TrackPlayState.PLAYING && player.withCamera) {        const newCenter = fromLonLat([position.lng, position.lat]);        // 启动或更新相机动画        this.updateCameraAnimation(id, newCenter);                // 主动触发相机动画，确保立即更新位置        this.animateCamera(id);      }
      
      // 绘制经过的线段和位置标记
      this.drawPassedLine(id, vectorContext, progress);
      this.drawPositionMarker(id, vectorContext, position, progress);
      
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
    
    // 完全清除相机动画状态
    if (this.trackCameraAnimations.has(id)) {
      const cameraAnimation = this.trackCameraAnimations.get(id);
      if (cameraAnimation) {
        cameraAnimation.active = false;
      }
      // 从映射中删除相机动画对象，确保完全释放相机控制
      this.trackCameraAnimations.delete(id);
      this.log('debug', `轨迹 "${id}" 相机动画已完全清除`);
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
      
      // 计算精确位置的插值
      const exactIndex = progress * (track.points.length - 1);
      const fraction = exactIndex - passedPointCount;
      
      // 插值计算当前位置
      const lng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * fraction;
      const lat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * fraction;
      
      // 添加插值位置
      coordinates.push(fromLonLat([lng, lat]));
    }
    
    // 创建线几何
    const passedLineGeom = new LineString(coordinates);
    
    // 创建样式 - 确保使用配置中的所有属性，包括透明度
    const passedLineOptions = this.config?.passedLineOptions || { color: 'rgba(24, 144, 255, 1)', weight: 4, opacity: 0.8 };
    const passedLineStyle = new Style({
      stroke: new Stroke({
        color: track.color ? this.applyOpacity(track.color, passedLineOptions.opacity) : this.applyOpacity(passedLineOptions.color, passedLineOptions.opacity),
        width: passedLineOptions.weight,
        lineCap: 'round',
        lineJoin: 'round'
      })
    });
    
    // 绘制线
    vectorContext.setStyle(passedLineStyle);
    vectorContext.drawGeometry(passedLineGeom);
  }

  /**
   * 绘制位置标记
   * @param id 轨迹ID
   * @param vectorContext 向量上下文
   * @param position 当前位置
   */
  private drawPositionMarker(id: string, vectorContext: any, position: TrackPoint, progress: number): void {
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
    let iconUrl: string | undefined = undefined;
    let iconSize: number[] = [24, 24]; // 默认图标大小为24x24
    let iconType: string | undefined = undefined;
    // 处理图标选择逻辑
    // 1. 首先检查TrackSpeedGroup配置 - 根据速度选择图标
    if (this.config.trackSpeedGroup && this.config.trackSpeedGroup.length > 0) {
      const sortedGroups = [...this.config.trackSpeedGroup].sort((a, b) => b.speed - a.speed);
      for (const group of sortedGroups) {
        if (realSpeed > group.speed) {
          iconUrl = group.icon;
          iconType = group.iconType;
          this.log('debug', `根据速度 ${realSpeed} km/h 选择图标: ${iconUrl} (速度阈值: ${group.speed})`);
          break;
        }
      }
    }
    // 2. 如果通过速度配置没找到图标，检查轨迹点自身是否有图标URL
    if (!iconUrl && position.iconUrl) {
      iconUrl = position.iconUrl;
      if (position.iconSize) {
        iconSize = position.iconSize;
      }
      iconType = (position as any).iconType;
      this.log('debug', `使用轨迹点自定义图标: ${iconUrl}`);
    }
    // 3. 如果轨迹点没有图标，则检查轨迹自身的iconGroup配置
    if (!iconUrl && track.iconGroup && track.iconGroup.length > 0) {
      for (const group of track.iconGroup) {
        if (realSpeed >= group.speed) {
          iconUrl = group.icon;
          iconType = group.iconType;
          this.log('debug', `使用轨迹iconGroup图标: ${iconUrl} (速度范围: ${group.speed})`);
          break;
        }
      }
    }
    // 4. 如果仍然没有找到图标，使用轨迹的默认图标
    if (!iconUrl && track.iconUrl) {
      iconUrl = track.iconUrl;
      iconType = (track as any).iconType;
      this.log('debug', `使用轨迹默认图标: ${iconUrl}`);
    }
    
    // 检查图标URL是否为HTTP/HTTPS，记录详细信息
    if (iconUrl && (iconUrl.startsWith('http://') || iconUrl.startsWith('https://'))) {
      this.log('debug', `HTTP(S)图标URL: ${iconUrl}`, { 
        id, 
        position: `${position.lng},${position.lat}`, 
        iconSize
      });
    }
    
    // 设置样式
    if (iconUrl) {
      try {
        let rotation = 0;
        let scaleY = 1;
        const autoRotate = this.config.autoRotate === true;
        if (autoRotate && position.dir !== undefined) {
          if (position.dir > 180) {
            scaleY = -1;
            rotation = ((position.dir - 180) * Math.PI) / 180;
          } else {
            scaleY = 1;
            rotation = (position.dir * Math.PI) / 180;
          }
        }
        // 统一用IconUtils.createSafeIconStyle
        const safeIconSize: [number, number] = [iconSize[0] || 24, iconSize[1] || 24];
        style = IconUtils.createSafeIconStyle(iconUrl, 1, safeIconSize, track.color || 'rgba(24, 144, 255, 1)', undefined, iconType);
        if (style && style.getImage && style.getImage()) {
          style.getImage().setRotation(rotation);
          style.getImage().setScale([1, scaleY]);
        }
        this.log('debug', `创建图标样式成功: ${iconUrl}`, { size: iconSize });
      } catch (error) {
        // 如果创建样式失败，使用默认样式
        this.log('error', `创建移动点图标样式失败: ${error.message || '未知错误'}, URL: ${iconUrl}`);
        style = this.createDefaultMarkerStyle(track.color || 'rgba(24, 144, 255, 1)');
      }
    } else {
      // 使用默认圆点样式
      this.log('debug', `未找到适用的图标，使用默认圆点样式`);
      style = this.createDefaultMarkerStyle(track.color || 'rgba(24, 144, 255, 1)');
    }
    
    // 在向量上下文中绘制点
    try {
      vectorContext.setStyle(style);
      vectorContext.drawGeometry(point);
      this.log('debug', `绘制位置标记成功: ${position.lng},${position.lat}`);
    } catch (error) {
      // 如果绘制失败，尝试使用基本样式
      this.log('error', `绘制位置标记失败: ${error.message || '未知错误'}`);
      
      // 使用完全默认的Style，避免任何可能的错误
      const fallbackStyle = this.createDefaultMarkerStyle(track.color || 'rgba(24, 144, 255, 1)');
      
      try {
        vectorContext.setStyle(fallbackStyle);
        vectorContext.drawGeometry(point);
        this.log('debug', `使用备用样式绘制位置标记成功`);
      } catch (e) {
        this.log('error', `使用备用样式也失败了: ${e.message || '未知错误'}`);
      }
    }
    
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
        overlayContent += `<div style="font-weight:bold;font-size:13px;color:#333;margin-bottom:4px;">${position.title}</div>`;
        // 获取格式化的时间信息
        const timeInfo = this.formatTimeDisplay(position.time);
      
        // 准备时间显示HTML
        if (timeInfo.isToday && timeInfo.timeAgoText) {
          // 今天的轨迹点显示时分秒和"多久之前"
          overlayContent += `<div style="color:#666;font-size:11px;margin-bottom:3px;">⏱ ${timeInfo.timeText} (${timeInfo.timeAgoText})</div>`;
        } else {
          // 过去的轨迹点显示完整日期时间
          overlayContent += `<div style="color:#666;font-size:11px;margin-bottom:3px;">⏱ ${timeInfo.timeText}</div>`;
        }
        
        // 如果经过了有名称的静态点位，显示提示信息
        if (position.staticTitle && position.staticTitle !== position.title) {
          overlayContent += `<div style="color:#666;font-style:italic;font-size:11px;margin-bottom:3px;">📍 经过: ${position.staticTitle}</div>`;
        }
      }
      
      // 添加速度信息
      if (showSpeed && displaySpeed > 0) {
        // 创建速度文本内容，区分真实速度和调整速度的显示
        const trackColor = track.color || '#1890ff';
        
        if (speedFactor === 1.0) {
          // 正常速度 - 只显示真实速度
          overlayContent += `<div style="color:${trackColor};font-weight:bold;font-size:12px;margin-top:${movingPointNameVisible ? 5 : 0}px;">
            🚄 速度: <span style="font-size:13px;">${realSpeed.toFixed(1)} km/h</span>
          </div>`;
        } else {
          // 调整的速度 - 显示调整后速度和真实速度
          overlayContent += `<div style="color:${trackColor};font-weight:bold;font-size:12px;margin-top:${movingPointNameVisible ? 5 : 0}px;">
            🚄 速度: <span style="font-size:13px;">${displaySpeed.toFixed(1)} km/h</span>
          </div>
          <div style="color:#666;font-size:10px;margin-top:2px;">
            实际速度: ${realSpeed.toFixed(1)} km/h
          </div>`;
        }
        // 新增：已行驶路程和距离下一个点
            // 计算当前位置对应的点索引
        const exactIndex = progress * (track.points.length - 1);
        const pointIndex = Math.floor(exactIndex);
        if (pointIndex >= 0) {
          const distanceFromStart = this.getDistanceFromStart(id, pointIndex, position) / 1000; // 公里
          let distanceToNext = 0;
          if (pointIndex < track.points.length - 1) {
            distanceToNext = this.getDistanceBetweenPoints(id, pointIndex, pointIndex + 1, position) / 1000;
          }
          overlayContent += `<div style='color:#1890ff;font-size:11px;margin-top:2px;'>
            已行驶: ${distanceFromStart.toFixed(2)} 公里`;
          if (distanceToNext > 0) {
            overlayContent += `，距下个点: ${distanceToNext.toFixed(2)} 公里`;
          }
          overlayContent += `</div>`;
        }
      }
      
      // 只有在有内容时才创建Overlay
      if (overlayContent) {
        try {
          // 创建或更新移动点位Overlay
          this.createMovingOverlay(id, overlayContent, fromLonLat([position.lng, position.lat]));
        } catch (error) {
          this.log('error', `创建移动点位Overlay失败: ${error.message || '未知错误'}`);
        }
      }
    } else if (this.trackMovingOverlay) {
      // 如果不需要显示内容，且存在Overlay，则移除
      this.mapInstance!.removeOverlay(this.trackMovingOverlay);
      this.trackMovingOverlay = null;
    }
  }
  
  /**
   * 创建默认的标记样式
   * @param color 颜色
   * @returns 样式对象
   */
  private createDefaultMarkerStyle(color: string): Style {
    return new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: color
        }),
        stroke: new Stroke({
          color: 'white',
          width: 2
        })
      })
    });
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
    const track = this.tracks.get(id);
    const passedLineOptions = this.config.passedLineOptions || { color: 'rgba(24, 144, 255, 1)', weight: 4, opacity: 0.8 };
    passedLineFeature.setStyle(new Style({
      stroke: new Stroke({
        color: track && track.color ? this.applyOpacity(track.color, passedLineOptions.opacity) : this.applyOpacity(passedLineOptions.color, passedLineOptions.opacity),
        width: passedLineOptions.weight,
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
            // 添加到图层（如果已存在，OpenLayers会抛出错误）
            // 先检查特征是否已经在图层中
            const source = this.trackPointLayer.getSource()!;
            
            try {
              // 检查特征是否已存在于图层源中
              const featureId = feature.getId();
              let featureExists = false;
              
              if (featureId) {
                // 如果特征有ID，通过ID检查
                featureExists = !!source.getFeatureById(featureId);
              } else {
                // 如果特征没有ID，通过引用检查
                featureExists = source.getFeatures().indexOf(feature) !== -1;
              }
              
              // 只有当特征不存在时才添加
              if (!featureExists) {
                source.addFeature(feature);
              }
            } catch (e) {
              console.warn(`添加轨迹点特征时出错: ${e.message || '未知错误'}`);
            }
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
      
      try {
        // 使用安全图标创建方法
        pointStyle = this.createSafeIconStyle(point.iconUrl, 1, iconSize, trackColor);
        this.log('debug', `创建节点图标样式成功: ${point.iconUrl}`, { index: pointIndex });
      } catch (error) {
        // 如果创建失败，使用默认样式
        this.log('error', `创建节点图标样式失败: ${error.message}, URL: ${point.iconUrl}`);
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
        text: new Text({
          text: point.title + timeStr,
          offsetY: -15,
          font: '12px Arial',
          fill: new Fill({
            color: '#333'
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 2
          })
        })
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
      this.log('warn', `更新轨迹播放器配置失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 获取播放状态
    const playState = this.trackPlayStates.get(id);
    
    // 获取现有的播放器配置
    const currentPlayer = this.trackPlayers.get(id) || { ...DEFAULT_TRACK_PLAYER };
    
    // 记录初始相机跟踪状态用于对比
    const previousWithCamera = currentPlayer.withCamera;
    
    // 更新配置
    const updatedPlayer = {
      ...currentPlayer,
      ...player
    };
    this.trackPlayers.set(id, updatedPlayer);
    
    // 特殊处理相机跟随设置，必须立即生效
    if (player.withCamera !== undefined && player.withCamera !== previousWithCamera) {
      this.log('info', `轨迹 "${id}" 相机跟随状态从 ${previousWithCamera} 更改为 ${player.withCamera}`);
      
      // 无论当前是否正在播放，都需要处理相机跟踪状态
      if (player.withCamera) {
        // 如果开启了相机跟随，尝试立即更新相机位置
        const track = this.tracks.get(id);
        if (track && track.points && track.points.length > 0) {
          const progress = this.trackProgressValues.get(id) || 0;
          const position = this.calculatePositionAtProgress(track, progress);
          const newCenter = fromLonLat([position.lng, position.lat]);
          
          // 立即启动或更新相机动画
          this.updateCameraAnimation(id, newCenter);
          
          // 如果当前不是播放状态，需要特殊处理确保动画立即启动
          if (playState !== TrackPlayState.PLAYING) {
            // 手动触发第一帧动画以立即移动相机
            this.animateCamera(id);
          }
          
          this.log('debug', `轨迹 "${id}" 相机位置已立即更新`);
        }
      } else {
        // 如果关闭了相机跟随，完全释放相机控制
        // 1. 停止相机动画
        const cameraAnimation = this.trackCameraAnimations.get(id);
        if (cameraAnimation) {
          cameraAnimation.active = false;
          // 2. 从映射中移除相机动画对象，确保完全释放
          this.trackCameraAnimations.delete(id);
          this.log('debug', `轨迹 "${id}" 相机跟随已停止并完全释放控制`);
        }
      }
      
      // 触发地图重绘
      if (this.mapInstance) {
        this.mapInstance.render();
      }
    }
    
    // 如果是播放状态，重新设置动画配置，使新的设置生效
    if (playState === TrackPlayState.PLAYING) {
      this.setupTrackAnimation(id);
    }
    
    this.log('debug', `轨迹 "${id}" 播放器配置已实时更新`);
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
        } else if (element && element.className.includes('passed-node')) {
          // 确保已经过的节点样式正确 - 检查是否基于时间正确设置了样式
          // 即使节点已经标记为passed-node，也要确保其样式正确
          const point = track.points[i];
          if (point && point.time) {
            const date = new Date(point.time * 1000);
            const now = new Date();
            const sameDay = date.getDate() === now.getDate() && 
                          date.getMonth() === now.getMonth() && 
                          date.getFullYear() === now.getFullYear();
            
            // 检查当前样式是否与时间匹配
            const hasBlueBackground = element.style.backgroundColor === '#e6f7ff';
            const hasGrayBackground = element.style.backgroundColor === '#f0f0f0';
            
            // 如果样式不匹配时间，重新更新节点
            if ((sameDay && !hasBlueBackground) || (!sameDay && !hasGrayBackground)) {
              this.updateNodeOverlayToPassed(id, i);
            }
          }
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
          // 使用带安全检查的方法创建图标样式
          const nodeColor = isCurrentNode ? '#ff6b18' : (isPastNode ? '#52c41a' : (track.color || '#1890ff'));
          const iconSize = point.iconSize || [24, 24];
          const iconScale = isCurrentNode ? 1.2 : (isPastNode ? 1.1 : 1);
          
          pointStyle = this.createSafeIconStyle(point.iconUrl, iconScale, iconSize, nodeColor);
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
        
        // 安全绘制点
        try {
          vectorContext.setStyle(pointStyle);
          vectorContext.drawGeometry(pointGeom);
        } catch (error) {
          console.error(`绘制轨迹点失败: ${error.message || '未知错误'}`);
          
          // 绘制失败时使用最简单的样式再试一次
          try {
            const fallbackStyle = new Style({
              image: new CircleStyle({
                radius: 4,
                fill: new Fill({ color: '#1890ff' })
              })
            });
            
            vectorContext.setStyle(fallbackStyle);
            vectorContext.drawGeometry(pointGeom);
          } catch (e) {
            // 如果连简单样式也失败，忽略该点
            console.error('备用绘制也失败，跳过该点');
          }
        }
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
            // 获取格式化的时间信息
            const timeInfo = this.formatTimeDisplay(point.time);
            
            // 准备时间显示HTML
            if (timeInfo.isToday && timeInfo.timeAgoText) {
              // 今天的轨迹点显示时分秒和"多久之前"
              nodeContent += `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeInfo.timeText} (${timeInfo.timeAgoText})</div>`;
            } else {
              // 过去的轨迹点显示完整日期时间
              nodeContent += `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeInfo.timeText}</div>`;
            }
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
        active: false,
        hasMovedOnce: false // 初始化hasMovedOnce属性
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

    /**   * 执行相机平滑动画   * @param id 轨迹ID   */  private animateCamera(id: string): void {
    const cameraAnimation = this.trackCameraAnimations.get(id); if (!cameraAnimation || !cameraAnimation.active) { return; } const player = this.trackPlayers.get(id) || DEFAULT_TRACK_PLAYER; const view = this.mapInstance.getView(); const currentCenter = view.getCenter(); if (!currentCenter) {
  // 如果当前没有中心点，直接设置并立即更新      
      view.setCenter(cameraAnimation.targetCenter);
      this.log('debug', `相机位置初始化: 轨迹 "${id}" 设置到 [${cameraAnimation.targetCenter}]`);
      // 确保视图立即更新      
        this.mapInstance.render();
      this.requestNextCameraFrame(id);
      return;
      }
      // 如果启用了视口稳定，确保不改变分辨率（缩放级别）    
      if (player.stabilizeViewport && this.trackViewportStabilized.get(id)) {
        if (this.originalViewResolution !== null) {
          const currentResolution = view.getResolution();
      // 如果当前分辨率与原始分辨率不匹配，恢复到原始分辨率        
          if (Math.abs(currentResolution - this.originalViewResolution) > 0.0001) { view.setResolution(this.originalViewResolution); }
        }
      }
      // 获取播放器配置中的平滑度参数，范围0-1，值越小越平滑    
      // // 使用配置的平滑度参数，默认为DEFAULT_CAMERA_SMOOTHNESS    
      const configuredSmoothness = player.cameraSmoothness !== undefined ? Math.max(0.03, Math.min(0.5, player.cameraSmoothness)) :
      // 限制平滑度范围，提高下限和降低上限      
        this.DEFAULT_CAMERA_SMOOTHNESS;
      // 计算当前时间和帧间隔    
      const now = performance.now(); const deltaTime = Math.min(now - cameraAnimation.lastFrameTime, 100);
      // 防止大间隔   
      cameraAnimation.lastFrameTime = now;
      // 使用动态平滑系数，基于距离和速度自适应调整    
      const distance = Math.sqrt(Math.pow(cameraAnimation.targetCenter[0] - currentCenter[0], 2) + Math.pow(cameraAnimation.targetCenter[1] - currentCenter[1], 2));
      // 对于非常远的距离，使用更快的移动速度（减少平滑度）  
      let baseSmooth; if (distance > 1000) {
      // 对于远距离，使用较高的平滑度值以更快移动     
        baseSmooth = Math.min(0.3, configuredSmoothness * 3);
      } else { baseSmooth = configuredSmoothness; } const distanceFactor = Math.min(distance / 1000, 0.6);
      // 降低距离参考值，减少突变   
      const adaptiveSmooth = baseSmooth + distanceFactor * 0.2;
      // 降低距离对平滑系数的影响        
      // // 应用基于帧率的动态调整，并降低最大值，避免大幅度变化    
      const smoothFactor = Math.min(adaptiveSmooth * (deltaTime / this.FRAME_TIME), 0.5);
      // 计算新的中心点坐标 (平滑插值)    
      const dx = cameraAnimation.targetCenter[0] - currentCenter[0]; const dy = cameraAnimation.targetCenter[1] - currentCenter[1];
      // 优化：只在移动距离超过阈值时才更新视图，避免微小抖动    
      const moveDistance = Math.sqrt(dx * dx + dy * dy); const minMoveThreshold = player.viewportUpdateThreshold || 1.5;
      // 提高最小移动阈值        
      // // 特殊处理首次移动：如果是初始大距离移动，使用更直接的方式    
      const isFirstMove = !cameraAnimation.hasMovedOnce && moveDistance > 100; if (isFirstMove) {
      // 对于首次大距离移动，使用更直接的方式，立即移动到目标点附近     
       const directFactor = 0.8; // 移动到目标点80%的位置      
        const newX = currentCenter[0] + dx * directFactor; const newY = currentCenter[1] + dy * directFactor; view.animate({
          center: [newX, newY], duration: 200,
        // 使用较短的动画时间        
          easing: easing.easeOut
          // 使用easeOut缓动函数     
        });
        // 标记已执行首次移动      
        cameraAnimation.hasMovedOnce = true; this.log('debug', `相机首次大距离移动: 轨迹 "${id}" 移动距离=${moveDistance.toFixed(2)}`);
      } else if (moveDistance > minMoveThreshold) {
        // 使用Cubic Easing函数使平滑过渡更自然      
        // t' = t * t * (3 - 2 * t) 三次方过渡     
        const t = Math.min(1, smoothFactor * 2);
        // 调整范围     
        const easeValue = t * t * (3 - 2 * t);
        // 使用平滑插值计算新的中心点      
        const newX = currentCenter[0] + dx * easeValue;
        const newY = currentCenter[1] + dy * easeValue;
      // 更新视图中心点，使用防抖动渲染请求，而不是直接更新     
        this.mapInstance.getView().animate({
          center: [newX, newY], duration: 50,
        // 使用短动画持续时间，减少抖动        
          easing: (t) => t
          // 线性缓动，因为我们已经应用了自定义easing      
          });    }
    
    // 请求下一帧动画
    this.requestNextCameraFrame(id);
  }

  /**
   * 请求下一帧相机动画
   * @param id 轨迹ID
   */
  private requestNextCameraFrame(id: string): void {
    // 首先检查轨迹ID对应的相机动画对象是否存在
    if (!this.trackCameraAnimations.has(id)) {
      this.log('debug', `轨迹 "${id}" 的相机动画已被清除，不再请求新帧`);
      return;
    }
    
    // 检查动画是否仍在激活状态
    const cameraAnimation = this.trackCameraAnimations.get(id);
    if (!cameraAnimation?.active) {
      this.log('debug', `轨迹 "${id}" 的相机动画已停用，不再请求新帧`);
      return;
    }
    
    // 使用requestAnimationFrame请求下一帧动画，确保与浏览器渲染循环同步
    window.requestAnimationFrame(() => {
      // 再次检查确保相机动画对象仍然存在且处于激活状态
      if (this.trackCameraAnimations.has(id) && this.trackCameraAnimations.get(id)?.active) {
        this.animateCamera(id);
      } else {
        this.log('debug', `轨迹 "${id}" 的相机动画状态已变更，中止动画循环`);
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
    
    // 使用requestAnimationFrame请求在下一帧进行渲染，并增加一些延迟以稳定
    this.pendingRenderRequest = window.requestAnimationFrame(() => {
      // 清除请求标记
      this.pendingRenderRequest = null;
      
      // 检查地图元素是否可见
      const mapElement = this.mapInstance.getTargetElement();
      if (mapElement && 
          mapElement.offsetWidth > 0 && 
          mapElement.offsetHeight > 0 &&
          window.getComputedStyle(mapElement).display !== 'none') {
        
        // 使用GPU加速进行渲染
        const canvas = mapElement.querySelector('canvas');
        if (canvas) {
          canvas.style.transform = 'translateZ(0)';
          canvas.style.willChange = 'transform';
        }
        
        // 使用较低频率的渲染请求
        setTimeout(() => {
        // 执行渲染
        this.mapInstance.render();
        }, 0); // 延迟为0可以将其排到当前JS执行队列结束时执行
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
    
    // 检查并优化地图渲染选项
    try {
    // 设置OpenLayers选项，减少不必要的渲染
      // 尝试设置更高效的渲染选项
      const mapOptions = this.mapInstance.getProperties();
      // 限制渲染帧率
      if (!mapOptions.pixelRatio) {
        // 使用较低的设备像素比以提高性能
    this.mapInstance.updateSize();
      }
      
      // 添加 CSS 类提示浏览器优化渲染
      mapElement.classList.add('gpu-accelerated');
      
      // 设置 CSS，优化渲染性能
      const style = document.createElement('style');
      style.textContent = `
        .gpu-accelerated {
          -webkit-transform: translateZ(0);
          -moz-transform: translateZ(0);
          -ms-transform: translateZ(0);
          -o-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          -moz-backface-visibility: hidden;
          -ms-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-perspective: 1000;
          -moz-perspective: 1000;
          -ms-perspective: 1000;
          perspective: 1000;
        }
      `;
      document.head.appendChild(style);
    } catch (error) {
      this.log('warn', '尝试优化地图渲染时出错', error);
    }
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
      let imgHtml = '';
      
      try {
        // 根据图标URL类型设置不同的处理
        if (point.iconUrl.startsWith('data:image')) {
          // Base64 格式
          imgHtml = `<img src="${point.iconUrl}" style="width:${iconSize[0]}px;height:${iconSize[1]}px;vertical-align:middle;" />`;
        } else if (point.iconUrl.startsWith('<svg') && point.iconUrl.includes('</svg>')) {
          // SVG 字符串格式，转换为 base64
          const svgBase64 = 'data:image/svg+xml;base64,' + btoa(point.iconUrl);
          imgHtml = `<img src="${svgBase64}" style="width:${iconSize[0]}px;height:${iconSize[1]}px;vertical-align:middle;" />`;
        } else {
          // 普通URL格式
          imgHtml = `<img src="${point.iconUrl}" style="width:${iconSize[0]}px;height:${iconSize[1]}px;vertical-align:middle;" onerror="this.style.display='none';" />`;
        }
      } catch (e) {
        this.log('warn', `创建节点图标失败: ${e.message || '未知错误'}，URL: ${point.iconUrl}`);
        // 错误处理：使用默认标记
        imgHtml = `<div style="width:${iconSize[0]}px;height:${iconSize[1]}px;background-color:#1890ff;border-radius:50%;display:inline-block;vertical-align:middle;"></div>`;
      }
      
      const iconHtml = `<div style="text-align:center;margin-bottom:4px;">${imgHtml}</div>`;
      content = iconHtml + content;
    }
    
    // 如果点位有时间信息，可以更新内容中的时间显示格式
    if (point && point.time && this.trackNodeTimeVisible.get(id) === true && !content.includes("⏱")) {
      // 获取格式化的时间信息
      const timeInfo = this.formatTimeDisplay(point.time);
      
      // 查找内容中最后一个 </div> 前的位置来插入时间信息
      const lastDivPos = content.lastIndexOf('</div>');
      
      // 准备时间显示HTML
      let timeHtml = '';
      if (timeInfo.isToday && timeInfo.timeAgoText) {
        // 今天的轨迹点显示时分秒和"多久之前"
        timeHtml = `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeInfo.timeText} (${timeInfo.timeAgoText})</div>`;
      } else {
        // 过去的轨迹点显示完整日期时间
        timeHtml = `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeInfo.timeText}</div>`;
      }
      
      // 插入时间信息
      if (lastDivPos !== -1) {
        content = content.substring(0, lastDivPos) + timeHtml + content.substring(lastDivPos);
      } else {
        content += timeHtml;
      }
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
    element.style.minWidth = '80px'; // 设置最小宽度
    element.style.maxWidth = '480px'; // 设置最大宽度，防止过宽
    element.style.wordWrap = 'break-word'; // 允许长单词换行
    element.style.textAlign = 'center'; // 文本居中
    
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
    
    // 如果是过去时间（非今天）且不是当前节点或已经过节点，修改背景颜色为灰色
    if (point && point.time) {
      // 直接基于时间戳判断是否为今天，而不依赖formatTimeDisplay返回的isToday
      const date = new Date(point.time * 1000);
      const now = new Date();
      const sameDay = date.getDate() === now.getDate() && 
                     date.getMonth() === now.getMonth() && 
                     date.getFullYear() === now.getFullYear();
      
      if (!sameDay && !className.includes('current-node') && !className.includes('passed-node')) {
        element.style.backgroundColor = '#f0f0f0'; // 灰色背景
        element.style.borderColor = '#d9d9d9';  // 灰色边框
        element.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
      }
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
    
    // 如果是过去时间（非今天）且不是当前节点或已经过节点，修改箭头颜色
    if (point && point.time) {
      // 直接基于时间戳判断是否为今天，而不依赖formatTimeDisplay返回的isToday
      const date = new Date(point.time * 1000);
      const now = new Date();
      const sameDay = date.getDate() === now.getDate() && 
                     date.getMonth() === now.getMonth() && 
                     date.getFullYear() === now.getFullYear();
      
      if (!sameDay && !className.includes('current-node') && !className.includes('passed-node')) {
        arrow.style.borderTop = '8px solid #f0f0f0'; // 灰色箭头
      }
    }
    
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
    
    // 如果是过去时间（非今天）且不是当前节点或已经过节点，修改箭头边框颜色
    if (point && point.time) {
      // 直接基于时间戳判断是否为今天，而不依赖formatTimeDisplay返回的isToday
      const date = new Date(point.time * 1000);
      const now = new Date();
      const sameDay = date.getDate() === now.getDate() && 
                     date.getMonth() === now.getMonth() && 
                     date.getFullYear() === now.getFullYear();
      
      if (!sameDay && !className.includes('current-node') && !className.includes('passed-node')) {
        arrowBorder.style.borderTop = '9px solid #d9d9d9'; // 灰色箭头边框
      }
    }
    
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
    // 先删除现有的移动点位弹窗
    if (this.trackMovingOverlay) {
      this.mapInstance!.removeOverlay(this.trackMovingOverlay);
      this.trackMovingOverlay = null;
    }

    const track = this.tracks.get(id);
    const trackColor = track?.color || '#1890ff';
    
    // 创建overlay元素
    const element = document.createElement('div');
    element.className = 'track-moving-overlay';
    
    // 添加自定义图标（如果有）
    let iconContent = '';
    if (track?.iconUrl) {
      try {
        const iconSize = [32, 32]; // 增大图标尺寸以更明显
        let imgHtml = '';
        
        // 根据图标URL类型设置不同的处理
        if (track.iconUrl.startsWith('data:image')) {
          // Base64 格式
          imgHtml = `<img src="${track.iconUrl}" style="width:${iconSize[0]}px;height:${iconSize[1]}px;vertical-align:middle;display:block;margin:0 auto 6px;" />`;
        } else if (track.iconUrl.startsWith('<svg') && track.iconUrl.includes('</svg>')) {
          // SVG 字符串格式，转换为 base64
          const svgBase64 = 'data:image/svg+xml;base64,' + btoa(track.iconUrl);
          imgHtml = `<img src="${svgBase64}" style="width:${iconSize[0]}px;height:${iconSize[1]}px;vertical-align:middle;display:block;margin:0 auto 6px;" />`;
        } else {
          // 普通URL格式
          imgHtml = `<img src="${track.iconUrl}" style="width:${iconSize[0]}px;height:${iconSize[1]}px;vertical-align:middle;display:block;margin:0 auto 6px;" onerror="this.style.display='none';" />`;
        }
        
        iconContent = `<div style="text-align:center;margin-bottom:8px;">${imgHtml}</div>`;
      } catch (e) {
        this.log('warn', `创建移动点位图标失败: ${e.message || '未知错误'}，URL: ${track.iconUrl}`);
      }
    }
    
    element.innerHTML = iconContent + content;
    element.style.position = 'absolute';
    element.style.backgroundColor = 'white';
    element.style.padding = '8px 12px'; // 增加内边距
    element.style.borderRadius = '6px'; // 增加圆角
    element.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.4)'; // 增强阴影
    element.style.transform = 'translate(-50%, -100%)';
    element.style.marginTop = '-15px'; // 向上偏移更多，为箭头留出空间
    element.style.color = '#333';
    element.style.fontSize = '13px'; // 增大字体
    element.style.zIndex = '1000';
    element.style.border = `2px solid ${trackColor}`; // 增加边框宽度
    element.style.minWidth = '180px'; // 增加最小宽度
    element.style.maxWidth = '500px'; // 增加最大宽度
    element.style.minHeight = '60px'; // 设置最小高度
    element.style.whiteSpace = 'normal'; // 允许文本换行
    element.style.wordWrap = 'break-word'; // 允许长单词换行
    element.style.textAlign = 'center'; // 文本居中
    element.style.lineHeight = '1.4'; // 增加行高
    
    // 添加箭头边框
    const arrowBorder = document.createElement('div');
    arrowBorder.style.position = 'absolute';
    arrowBorder.style.bottom = '-12px'; // 增大箭头
    arrowBorder.style.left = '50%';
    arrowBorder.style.transform = 'translateX(-50%)';
    arrowBorder.style.width = '0';
    arrowBorder.style.height = '0';
    arrowBorder.style.borderLeft = '12px solid transparent';
    arrowBorder.style.borderRight = '12px solid transparent';
    arrowBorder.style.borderTop = `12px solid ${trackColor}`;
    arrowBorder.style.zIndex = '-1';
    
    // 添加箭头内部
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.bottom = '-9px'; // 调整内部箭头位置
    arrow.style.left = '50%';
    arrow.style.transform = 'translateX(-50%)';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '10px solid transparent';
    arrow.style.borderRight = '10px solid transparent';
    arrow.style.borderTop = '10px solid white';
    arrow.style.zIndex = '0';
    
    element.appendChild(arrowBorder);
    element.appendChild(arrow);
    
    // 创建overlay
    const overlay = new Overlay({
      element: element,
      position: position,
      positioning: 'center-center',
      stopEvent: false,
      offset: [0, -5] // 添加偏移，确保不会被其他元素遮挡
    });
    
    // 添加到地图
    this.mapInstance!.addOverlay(overlay);
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

    // 获取时间信息和格式化
    let timeDisplay = { timeText: '', timeAgoText: '', isToday: true };
    if (point.time && this.trackNodeTimeVisible.get(id) === true) {
      timeDisplay = this.formatTimeDisplay(point.time);
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
    if (timeDisplay.timeText) {
      // 如果是今天，显示时分秒和"多久之前"
      if (timeDisplay.isToday && timeDisplay.timeAgoText) {
        nodeContent += `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeDisplay.timeText} (${timeDisplay.timeAgoText})</div>`;
      } else {
        // 不是今天，显示完整日期时间
        nodeContent += `<div style="margin-top:3px;color:#666;font-size:10px;">⏱ ${timeDisplay.timeText}</div>`;
      }
    }
    
    // 添加速度信息
    nodeContent += `<div style="margin-top:3px;color:#1890ff;font-size:11px;font-weight:bold;">🚄 速度: ${nodeSpeed.toFixed(1)} km/h</div>`;
    
    // 更新内容
    element.innerHTML = nodeContent;
    
    // 更新样式为经过状态
    element.className = 'track-node-overlay passed-node';
    
    // 根据是否为今天的时间设置不同背景颜色
    if (timeDisplay.isToday) {
      // 今天的时间 - 使用默认经过样式（蓝色）
      element.style.backgroundColor = '#e6f7ff';
      element.style.borderColor = '#91d5ff';
      element.style.boxShadow = '0 3px 10px rgba(24, 144, 255, 0.2)';
    } else {
      // 过去的时间 - 使用灰色系
      element.style.backgroundColor = '#f0f0f0'; // 灰色背景
      element.style.borderColor = '#d9d9d9';  // 灰色边框
      element.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
    }
    
    // 更新箭头样式
    const arrows = element.querySelectorAll('div');
    if (arrows && arrows.length >= 2) {
      // 更新箭头边框颜色（根据是否为今天）
      const arrowBorder = arrows[arrows.length - 2] as HTMLElement;
      arrowBorder.style.borderTop = timeDisplay.isToday ? 
        '9px solid #91d5ff' : '9px solid #d9d9d9';
      
      // 更新箭头颜色（根据是否为今天）
      const arrow = arrows[arrows.length - 1] as HTMLElement;
      arrow.style.borderTop = timeDisplay.isToday ? 
        '8px solid #e6f7ff' : '8px solid #f0f0f0';
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
    // 检查是否有轨迹处于播放状态，如果有则禁用双击选中
    const allTrackIds = [...this.tracks.keys()];
    for (const trackId of allTrackIds) {
      if (this.trackPlayStates.get(trackId) === TrackPlayState.PLAYING) {
        this.log('debug', `当前有轨迹正在播放中，禁用双击选中功能`);
        return false;
      }
    }

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
      // 检查轨迹当前状态，并传递pauseIfPlaying=true，使双击轨迹时自动暂停而不是继续播放
      const currentState = this.trackPlayStates.get(id);
      this.play(id, undefined, true);
    }
    
    this.log('debug', `轨迹 "${id}" 已选中，clearOthers=${mergedOptions.clearOthers}, autoPlay=${mergedOptions.autoPlay}`);
    return true;
  }

  /**
   * 预先验证图标资源是否可用
   * @param url 图标URL
   * @returns 是否可用
   * @deprecated 建议使用IconUtils.isIconValid替代
   */
  private isIconValid(url: string): boolean {
    if (!url) return false;
    
    // 检查是否是base64格式
    if (url.startsWith('data:image')) {
      return true;
    }
    
    // 检查是否是SVG字符串
    if (url.startsWith('<svg') && url.includes('</svg>')) {
      return true;
    }
    
    // 检查是否是HTTP/HTTPS URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        // 验证URL格式
        new URL(url);
        return true;
      } catch (e) {
        this.log('warn', `HTTP/HTTPS URL格式无效: ${url}`, e);
        return false;
      }
    }
    
    // 检查是否是相对路径
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || !url.includes(':')) {
      // 相对路径通常有效，返回true
      return true;
    }
    
    // 尝试验证其他可能的URL格式
    try {
      // 检查URL是否合法
      new URL(url);
      return true;
    } catch (e) {
      // 如果不是有效的URL，但不包含特殊字符，也认为可能是有效的路径
      if (!/[?&#%"]/.test(url)) {
        this.log('debug', `未能验证但可能是有效的资源路径: ${url}`);
        return true;
      }
      
      this.log('warn', `图标URL无效: ${url}`);
      return false;
    }
  }

  /**   * 创建带安全检查的图标样式   * @param url 图标URL   * @param scale 缩放比例   * @param size 尺寸   * @param fallbackColor 备用颜色   * @returns 样式对象   */
  private createSafeIconStyle(url: string, scale: number, size: number[], fallbackColor: string): Style {
    try {      // 使用IconUtils工具类创建安全的图标样式      
      return IconUtils.createSafeIconStyle(url, scale, size as [number, number], fallbackColor);
    } catch (error) {
      this.log('error', `创建图标样式失败: ${error.message || '未知错误'}, URL: ${url}`);
    // 使用默认圆点样式作为回退      
      return this.createDefaultMarkerStyle(fallbackColor);
    }
  }

  /**
   * 应用透明度到颜色
   * @param color 颜色字符串 (支持rgba和十六进制)
   * @param opacity 透明度 (0-1)
   * @returns 应用透明度后的颜色
   */
  private applyOpacity(color: string, opacity: number = 1): string {
    // 如果没有颜色或透明度已经是1，直接返回
    if (!color || opacity >= 1) return color;
    
    // 限制opacity在0-1之间
    opacity = Math.max(0, Math.min(1, opacity));
    
    // 判断颜色格式
    if (color.startsWith('rgba')) {
      // 已经是rgba格式，替换最后一个参数
      return color.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d\.]+\s*\)/, 
        `rgba($1, $2, $3, ${opacity})`);
    } else if (color.startsWith('rgb')) {
      // rgb格式，转为rgba
      return color.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/, 
        `rgba($1, $2, $3, ${opacity})`);
    } else if (color.startsWith('#')) {
      // 十六进制格式
      let r = 0, g = 0, b = 0;
      
      // 处理缩写形式 #RGB
      if (color.length === 4) {
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      } 
      // 处理标准形式 #RRGGBB
      else if (color.length === 7) {
        r = parseInt(color.substring(1, 3), 16);
        g = parseInt(color.substring(3, 5), 16);
        b = parseInt(color.substring(5, 7), 16);
      }
      
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // 其他格式直接返回
    return color;
  } 

  /**
   * 格式化时间显示
   * @param timestamp Unix时间戳（秒）
   * @returns 格式化后的时间信息对象
   */
  private formatTimeDisplay(timestamp: number): {
    timeText: string;      // 格式化的时间文本
    timeAgoText: string;   // "多久之前"的文本
    isToday: boolean;      // 是否为今天
  } {
    // 创建日期对象
    const date = new Date(timestamp * 1000);
    const now = new Date();
    
    // 检查是否为今天
    const isToday = date.getDate() === now.getDate() && 
                   date.getMonth() === now.getMonth() && 
                   date.getFullYear() === now.getFullYear();
    
    // 格式化时间文本
    let timeText = '';
    if (isToday) {
      // 今天 - 只显示时分秒
      timeText = date.toLocaleTimeString();
    } else {
      // 不是今天 - 显示完整的年月日时分秒
      timeText = date.toLocaleString();
    }
    
    // 计算时间差 - 使用（now - date）获取正确的时间差，不使用绝对值
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    // 生成"多久之前"的文本 - 只有在时间差为正数时才显示（即过去的时间）
    let timeAgoText = '';
    if (diffMs > 0) {
      if (diffSec < 60) {
        timeAgoText = `${diffSec}秒前`;
      } else if (diffMin < 60) {
        timeAgoText = `${diffMin}分钟前`;
      } else if (diffHour < 24) {
        timeAgoText = `${diffHour}小时前`;
      } else if (diffDay <= 30) {
        timeAgoText = `${diffDay}天前`;
      } else {
        // 超过30天，不显示"多久之前"
        timeAgoText = '';
      }
    } else {
      const _diffMs = Math.abs(diffMs);
      const _diffSec = Math.floor(_diffMs / 1000);
      const _diffMin = Math.floor(_diffSec / 60);
      const _diffHour = Math.floor(_diffMin / 60);
      const _diffDay = Math.floor(_diffHour / 24);
       if (_diffSec < 60) {
        timeAgoText = `${_diffSec}秒后`;
      } else if (_diffMin < 60) {
        timeAgoText = `${_diffMin}分钟后`;
      } else if (_diffHour < 24) {
        timeAgoText = `${_diffHour}小时后`;
      } else if (_diffDay <= 30) {
        timeAgoText = `${_diffDay}天后`;
      } else {
        // 超过30天，不显示"多久之前"
        timeAgoText = '';
      }
    }
    
    return {
      timeText,
      timeAgoText,
      isToday
    };
  }

  /**
   * 保存原始视图状态
   * @param id 轨迹ID
   */
  private saveOriginalViewState(id: string): void {
    // 如果跟踪已经在播放，不需要再次保存视图状态
    if (this.trackViewportStabilized.get(id)) {
      return;
    }
    
    // 获取当前视图状态
    const view = this.mapInstance.getView();
    this.originalViewResolution = view.getResolution();
    this.originalViewExtent = view.calculateExtent();
    
    // 标记视口已稳定化
    this.trackViewportStabilized.set(id, true);
    
    this.log('debug', `已保存轨迹 "${id}" 的原始视图状态，分辨率: ${this.originalViewResolution}`);
  }

  /**
   * 销毁轨迹对象，清理所有资源
   */
  public destroy(): void {
    // 清理所有轨迹数据
    this.clearAllTracks();
    
    // 移除所有事件监听器
    if (this.clickListener) {
      unByKey(this.clickListener);
      this.clickListener = null;
    }
    
    // 清理所有动画
    this.trackAnimationFrames.forEach((frameId, trackId) => {
      cancelAnimationFrame(frameId);
      this.removeTrackAnimation(trackId);
    });
    
    // 清理所有覆盖物
    this.clearAllOverlays();
    
    // 从地图移除图层
    if (this.mapInstance) {
      if (this.trackLayer) {
        this.mapInstance.removeLayer(this.trackLayer);
      }
      if (this.trackPointLayer) {
        this.mapInstance.removeLayer(this.trackPointLayer);
      }
    }
    
    // 重置所有数据
    this.tracks.clear();
    this.trackFeatures.clear();
    this.trackPointFeatures.clear();
    this.trackPlayStates.clear();
    this.trackPlayers.clear();
    this.trackAnimationFrames.clear();
    this.trackCurrentPoints.clear();
    this.trackLastTimes.clear();
    this.trackActiveMarkers.clear();
    this.trackPassedLineFeatures.clear();
    this.trackPositionFeatures.clear();
    this.trackProgressValues.clear();
    this.trackSpeedFactors.clear();
    this.trackNodeOverlays.clear();
    
    // 清空引用
    this.trackLayer = null;
    this.trackPointLayer = null;
    this.mapInstance = null;
    
    this.log('debug', '轨迹对象已销毁');
  }

  /**
   * 获取所有轨迹及其长度信息
   * @returns 包含轨迹ID、对象和长度信息的数组
   */
  public getTracksArray(): Array<{id: string, track: Track, trackNameWithLength: string}> {
    const tracksArray: Array<{id: string, track: Track, trackNameWithLength: string}> = [];
    
    this.tracks.forEach((track, id) => {
      // 获取轨迹总距离
      const totalDistance = this.getTrackTotalDistance(id);
      
      // 格式化距离显示
      const distanceText = totalDistance >= 1000 ? 
        `${(totalDistance / 1000).toFixed(2)}公里` : 
        `${totalDistance.toFixed(0)}米`;
      
      // 组合轨迹名称与长度
      const trackNameWithLength = track.name ? `${track.name} (${distanceText})` : `轨迹 #${id.substr(0, 6)} (${distanceText})`;
      
      tracksArray.push({
        id,
        track,
        trackNameWithLength
      });
    });
    
    return tracksArray;
  }

  /**
   * 计算轨迹总距离
   * @param id 轨迹ID
   * @returns 轨迹总距离(米)
   */
  public getTrackTotalDistance(id: string): number {
    // 检查缓存中是否已有计算结果
    if (this.trackTotalDistances.has(id)) {
      return this.trackTotalDistances.get(id)!;
    }
    
    const track = this.tracks.get(id);
    if (!track || track.points.length < 2) {
      return 0;
    }
    
    // 计算总距离
    let totalDistance = 0;
    for (let i = 1; i < track.points.length; i++) {
      const prevPoint = track.points[i - 1];
      const currentPoint = track.points[i];
      totalDistance += this.calculateDistance(prevPoint, currentPoint);
    }
    
    // 缓存结果
    this.trackTotalDistances.set(id, totalDistance);
    
    return totalDistance;
  }
  
  /**
   * 获取轨迹点位到起点的距离
   * @param id 轨迹ID
   * @param pointIndex 点位索引
   * @returns 距起点的距离(米)
   */
  public getDistanceFromStart(id: string, pointIndex: number, position?: {lat: number, lng: number}): number {
    const track = this.tracks.get(id);
    if (!track || track.points.length < 2 || pointIndex < 0) {
      return 0;
    }
    let distance = 0;
    for (let i = 1; i <= Math.min(pointIndex, track.points.length - 1); i++) {
      const prevPoint = track.points[i - 1];
      const currentPoint = track.points[i];
      distance += this.calculateDistance(prevPoint, currentPoint);
    }
    if (position && pointIndex < track.points.length - 1) {
      const basePoint = track.points[pointIndex];
      // 构造 TrackPoint 类型，time 用 basePoint 的 time
      const posPoint = { lat: position.lat, lng: position.lng, time: basePoint.time };
      distance += this.calculateDistance(basePoint, posPoint);
    }
    return distance;
  }
  
  /**
   * 获取两个点位之间的距离，支持插值点
   * @param id 轨迹ID
   * @param fromIndex 起始点索引
   * @param toIndex 终点索引
   * @param fromPosition 可选，起始插值点（{lat, lng}）
   * @param toPosition 可选，终点插值点（{lat, lng}）
   * @returns 两点间距离(米)
   */
  public getDistanceBetweenPoints(
    id: string,
    fromIndex: number,
    toIndex: number,
    fromPosition?: {lat: number, lng: number},
    toPosition?: {lat: number, lng: number}
  ): number {
    const track = this.tracks.get(id);
    if (!track || fromIndex < 0 || toIndex < 0 ||
        fromIndex >= track.points.length || toIndex >= track.points.length) {
      return 0;
    }
    if (fromIndex === toIndex && !fromPosition && !toPosition) {
      return 0;
    }
    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);
    let distance = 0;
    if (fromPosition && startIndex < track.points.length - 1) {
      const posPoint = { lat: fromPosition.lat, lng: fromPosition.lng, time: track.points[startIndex].time };
      distance += this.calculateDistance(posPoint, track.points[startIndex + 1]);
    }
    for (let i = startIndex + 1; i < endIndex; i++) {
      const prevPoint = track.points[i - 1];
      const currentPoint = track.points[i];
      distance += this.calculateDistance(prevPoint, currentPoint);
    }
    if (toPosition && endIndex < track.points.length) {
      const posPoint = { lat: toPosition.lat, lng: toPosition.lng, time: track.points[endIndex].time };
      distance += this.calculateDistance(track.points[endIndex], posPoint);
    } else if (!toPosition && endIndex > startIndex) {
      const prevPoint = track.points[endIndex - 1];
      const currentPoint = track.points[endIndex];
      distance += this.calculateDistance(prevPoint, currentPoint);
    }
    if (fromIndex > toIndex) {
      return distance;
    }
    return distance;
  }
  
  /**
   * 设置轨迹节点距离信息是否可见
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否操作成功
   */
  public setTrackNodeDistanceVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      this.log('warn', `设置轨迹节点距离信息可见性失败: 轨迹 "${id}" 不存在`);
      return false;
    }
    
    // 明确记录旧值和新值，帮助调试
    const oldValue = this.trackNodeDistanceVisible.get(id);
    
    // 更新节点距离可见性设置
    this.trackNodeDistanceVisible.set(id, visible === true);
    
    this.log('debug', `轨迹 "${id}" 节点距离信息可见性从 ${oldValue} 更改为 ${visible}`);
    
    // 如果轨迹播放状态是停止或暂停，需要重新创建节点Overlay
    if (this.trackNodesVisible.get(id) && this.trackNodePopoversVisible.get(id) &&
        this.trackPlayStates.get(id) !== TrackPlayState.PLAYING) {
      // 获取轨迹
      const track = this.tracks.get(id);
      if (!track || !track.visible) return true;
      
      // 清除现有节点Overlay
      this.clearNodeOverlays(id);
      
      // 重新创建所有节点的Overlay
      const showNodeTime = this.trackNodeTimeVisible.get(id) || false;
      const showNodeDistance = visible;
      
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
          
          // 添加距离信息（如果启用且不是第一个点）
          if (showNodeDistance && i > 0) {
            const distanceFromPrev = this.calculateDistance(track.points[i-1], point);
            const distanceText = distanceFromPrev >= 1000 ? 
              `${(distanceFromPrev / 1000).toFixed(2)}公里` : 
              `${Math.round(distanceFromPrev)}米`;
            nodeContent += `<div style="margin-top:2px;color:#1890ff;font-size:9px;">↔️ 距上一点: ${distanceText}</div>`;
          }
          
          // 创建节点Overlay
          const coordinate = fromLonLat([point.lng, point.lat]);
          this.createNodeOverlay(id, i, nodeContent, coordinate);
        }
      }
    }
    
    return true;
  }
}