/**
 * 基于ol-ext的轨迹实现
 * @description 使用ol-ext库实现的轨迹管理
 */
import { Map as OlMap } from 'ol';
import { EventsKey } from 'ol/events';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import { unByKey } from 'ol/Observable';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Track, TrackConfig, TrackPlayer, TrackPoint } from '../../../types/track';
import logger from '../../../composables/LogObject';
import { ITrackImplementation, TrackImplementationType, TrackPlayState } from '../ITrackImplementation';

// 导入ol-ext库
import 'ol-ext/dist/ol-ext.css';
import OLFeatureAnimation from 'ol-ext/featureanimation/FeatureAnimation';

// 日志前缀
const LOG_MODULE = 'OlExtTrackImpl';

// 扩展轨迹类型
interface ExtendedTrack extends Track {
  width?: number;   // 轨迹宽度
  opacity?: number; // 轨迹透明度
}

// 扩展轨迹配置类型
interface ExtendedTrackConfig extends TrackConfig {
  showNodes?: boolean;           // 显示轨迹节点
  showNodeAnchors?: boolean;     // 显示节点锚点
  showNodePopovers?: boolean;    // 显示节点弹窗
  showNodeTime?: boolean;        // 显示节点时间
  showSpeed?: boolean;           // 显示速度
  trackColor?: string;           // 轨迹颜色
  trackWidth?: number;           // 轨迹宽度
  trackOpacity?: number;         // 轨迹透明度
  trackZIndex?: number;          // 轨迹Z轴位置
  nodeColor?: string;            // 节点颜色
  nodeRadius?: number;           // 节点半径
  selectedTrackColor?: string;   // 选中轨迹颜色
  passedLineColor?: string;      // 已通过轨迹线颜色
}

// 默认轨迹配置
const DEFAULT_TRACK_CONFIG: ExtendedTrackConfig = {
  showNodes: true,           // 显示轨迹节点
  showNodeAnchors: true,     // 显示节点锚点
  showNodePopovers: false,   // 显示节点弹窗
  showNodeTime: true,        // 显示节点时间
  showSpeed: true,           // 显示速度
  trackColor: '#3388ff',     // 轨迹颜色
  trackWidth: 4,             // 轨迹宽度
  trackOpacity: 0.8,         // 轨迹透明度
  trackZIndex: 100,          // 轨迹z-index
  nodeColor: '#3388ff',      // 节点颜色 
  nodeRadius: 6,             // 节点半径
  selectedTrackColor: '#ff4500', // 选中轨迹颜色
  passedLineColor: '#32cd32', // 已通过轨迹线颜色
};

/**
 * 基于ol-ext的轨迹实现类
 */
export class OlExtTrackImpl implements ITrackImplementation {
  // 地图实例
  private mapInstance: OlMap | null = null;
  
  // 轨迹图层
  private trackLayer: VectorLayer<VectorSource> | null = null;
  
  // 轨迹节点图层
  private trackPointLayer: VectorLayer<VectorSource> | null = null;
  
  // 轨迹映射
  private tracks = new Map<string, ExtendedTrack>();
  
  // 轨迹要素映射
  private trackFeatures = new Map<string, Feature>();
  
  // 轨迹节点要素映射
  private trackPointFeatures = new Map<string, Feature[]>();
  
  // 轨迹配置
  private config: ExtendedTrackConfig = DEFAULT_TRACK_CONFIG;
  
  // 点击事件监听器
  private clickListener: EventsKey | null = null;
  
  // 选中的轨迹ID
  private selectedTrackId: string | null = null;
  
  // 轨迹可见性状态
  private tracksVisible: boolean = true;
  
  // 轨迹节点可见性映射
  private trackNodesVisible = new Map<string, boolean>();
  
  // 轨迹节点锚点可见性映射
  private trackNodeAnchorsVisible = new Map<string, boolean>();
  
  // 轨迹节点弹窗可见性映射
  private trackNodePopoversVisible = new Map<string, boolean>();
  
  // 轨迹节点时间可见性映射
  private trackNodeTimeVisible = new Map<string, boolean>();
  
  // 轨迹速度弹窗可见性映射
  private trackSpeedPopoversVisible = new Map<string, boolean>();
  
  // 轨迹当前速度映射
  private trackCurrentSpeeds = new Map<string, number>();
  
  // 轨迹播放状态映射
  private trackPlayStates = new Map<string, TrackPlayState>();
  
  // 轨迹播放器配置映射
  private trackPlayers = new Map<string, Partial<TrackPlayer>>();
  
  // 轨迹动画要素映射
  private trackAnimationFeatures = new Map<string, Feature>();
  
  // 轨迹动画映射
  private trackAnimations = new Map<string, OLFeatureAnimation>();
  
  // 轨迹动画监听器映射
  private trackAnimationListeners = new Map<string, EventsKey>();
  
  // 轨迹进度值映射
  private trackProgressValues = new Map<string, number>();
  
  // 轨迹速度因子映射
  private trackSpeedFactors = new Map<string, number>();
  
  // 轨迹节点速度可见性映射
  private trackNodeSpeedsVisible = new Map<string, boolean>();
  
  // 轨迹移动点位名称可见性映射
  private trackMovingPointNameVisible = new Map<string, boolean>();
  
  // 轨迹节点弹出层映射
  private trackNodeOverlays = new Map<string, Map<number, Overlay>>();
  
  // 轨迹移动弹出层映射
  private trackMovingOverlays = new Map<string, Overlay>();
  
  // 轨迹已通过线条要素映射
  private trackPassedLineFeatures = new Map<string, Feature>();
  
  // 名称
  private readonly name: string = '基于ol-ext的轨迹实现(兼容模式)';
  
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
    
    this.log('debug', 'ol-ext轨迹实现已创建');
  }
  
  /**
   * 获取实现类型
   * @returns 实现类型
   */
  public getImplementationType(): TrackImplementationType {
    return TrackImplementationType.OL_EXT;
  }
  
  /**
   * 获取名称
   * @returns 实现名称
   */
  public getName(): string {
    return this.name;
  }
  
  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    this.mapInstance = mapInstance;
    this.initLayers();
    this.initEvents();
    this.log('debug', '地图实例已设置');
  }
  
  /**
   * 获取地图实例
   * @returns 地图实例
   */
  public getMapInstance(): OlMap | null {
    return this.mapInstance;
  }
  
  /**
   * 设置配置
   * @param config 轨迹配置
   */
  public setConfig(config: TrackConfig): void {
    this.config = { ...this.config, ...config };
    this.log('debug', '配置已设置');
  }
  
  /**
   * 初始化图层
   */
  private initLayers(): void {
    if (!this.mapInstance) {
      return;
    }
    
    // 创建轨迹图层
    const trackSource = new VectorSource();
    this.trackLayer = new VectorLayer({
      source: trackSource,
      zIndex: this.config.trackZIndex || 100,
      properties: {
        name: 'track-layer'
      }
    });
    
    // 创建轨迹节点图层
    const trackPointSource = new VectorSource();
    this.trackPointLayer = new VectorLayer({
      source: trackPointSource,
      zIndex: (this.config.trackZIndex || 100) + 1,
      properties: {
        name: 'track-point-layer'
      }
    });
    
    // 添加图层到地图
    this.mapInstance.addLayer(this.trackLayer);
    this.mapInstance.addLayer(this.trackPointLayer);
    
    this.log('debug', '轨迹图层已初始化');
  }
  
  /**
   * 初始化事件
   */
  private initEvents(): void {
    if (!this.mapInstance) {
      return;
    }
    
    // 清除现有的点击监听器
    if (this.clickListener) {
      unByKey(this.clickListener);
      this.clickListener = null;
    }
    
    // 添加点击事件监听
    this.clickListener = this.mapInstance.on('click', (event) => {
      // 获取点击位置的要素
      const feature = this.mapInstance!.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      
      if (feature) {
        // 获取要素的轨迹ID
        const trackId = feature.get('trackId');
        const nodeIndex = feature.get('nodeIndex');
        
        if (trackId) {
          // 如果点击了轨迹节点
          if (nodeIndex !== undefined) {
            this.log('debug', `点击了轨迹 "${trackId}" 的节点 ${nodeIndex}`);
            // 可以在这里实现点击节点的功能
          } else {
            // 点击了轨迹线
            this.log('debug', `点击了轨迹 "${trackId}"`);
            this.selectTrack(trackId);
          }
        }
      }
    });
  }
  
  /**
   * 添加轨迹
   * @param track 轨迹
   * @returns 是否成功
   */
  public addTrack(track: Track): boolean {
    try {
      // 添加到轨迹映射
      this.tracks.set(track.id, { ...track } as ExtendedTrack);
      
      // 设置初始状态
      this.trackPlayStates.set(track.id, TrackPlayState.STOPPED);
      this.trackProgressValues.set(track.id, 0);
      this.trackSpeedFactors.set(track.id, 1);
      
      // 设置可见性
      this.trackNodesVisible.set(track.id, this.config.showNodes !== false);
      this.trackNodeAnchorsVisible.set(track.id, this.config.showNodeAnchors !== false);
      this.trackNodePopoversVisible.set(track.id, this.config.showNodePopovers === true);
      this.trackNodeTimeVisible.set(track.id, this.config.showNodeTime !== false);
      this.trackSpeedPopoversVisible.set(track.id, this.config.showSpeed !== false);
      
      // 创建轨迹要素
      if (track.points && track.points.length > 0) {
        // 创建轨迹线要素
        const coordinates = track.points.map(point => fromLonLat([point.lng, point.lat]));
        const lineString = new LineString(coordinates);
        const trackFeature = new Feature({
          geometry: lineString,
          name: track.name,
          trackId: track.id
        });
        
        // 设置轨迹样式
        const color = track.color || this.config.trackColor || '#3388ff';
        const width = (track as ExtendedTrack).width || this.config.trackWidth || 4;
        const opacity = (track as ExtendedTrack).opacity !== undefined ? (track as ExtendedTrack).opacity : (this.config.trackOpacity || 0.8);
        
        trackFeature.setStyle(new Style({
          stroke: new Stroke({
            color: this.colorWithOpacity(color, opacity),
            width: width
          })
        }));
        
        // 添加到图层
        this.trackFeatures.set(track.id, trackFeature);
        this.trackLayer!.getSource()!.addFeature(trackFeature);
        
        // 创建轨迹节点要素
        const pointFeatures: Feature[] = [];
        track.points.forEach((point, index) => {
          const coordinate = fromLonLat([point.lng, point.lat]);
          const pointFeature = new Feature({
            geometry: new Point(coordinate),
            name: `${track.name}_point_${index}`,
            trackId: track.id,
            nodeIndex: index,
            point: point
          });
          
          // 设置节点样式
          pointFeature.setStyle(this.createTrackPointStyle(point, index === 0, index === track.points.length - 1));
          
          // 添加到数组
          pointFeatures.push(pointFeature);
          
          // 添加到图层
          this.trackPointLayer!.getSource()!.addFeature(pointFeature);
        });
        
        this.trackPointFeatures.set(track.id, pointFeatures);
        
        // 初始化已通过线条
        this.initPassedLineFeature(track.id);
      }
      
      this.log('info', `轨迹 "${track.id}" 已添加`);
      return true;
    } catch (error) {
      this.log('error', `添加轨迹失败: ${track.id}`, error);
      return false;
    }
  }
  
  /**
   * 删除轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public removeTrack(id: string): boolean {
    try {
      if (!this.tracks.has(id)) {
        return false;
      }
      
      // 移除轨迹要素
      if (this.trackFeatures.has(id)) {
        const feature = this.trackFeatures.get(id)!;
        this.trackLayer?.getSource()?.removeFeature(feature);
        this.trackFeatures.delete(id);
      }
      
      // 移除节点要素
      if (this.trackPointFeatures.has(id)) {
        const features = this.trackPointFeatures.get(id)!;
        features.forEach(feature => {
          this.trackPointLayer?.getSource()?.removeFeature(feature);
        });
        this.trackPointFeatures.delete(id);
      }
      
      // 移除轨迹数据
      this.tracks.delete(id);
      this.trackPlayStates.delete(id);
      this.trackProgressValues.delete(id);
      this.trackSpeedFactors.delete(id);
      
      this.log('info', `轨迹 "${id}" 已删除`);
      return true;
    } catch (error) {
      this.log('error', `删除轨迹失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 更新轨迹
   * @param id 轨迹ID
   * @param track 轨迹更新数据
   * @returns 是否成功
   */
  public updateTrack(id: string, track: Partial<Track>): boolean {
    try {
      if (!this.tracks.has(id)) {
        return false;
      }
      
      const updatedTrack = { ...this.tracks.get(id)!, ...track };
      this.tracks.set(id, updatedTrack);
      
      // 实际更新逻辑需要实现
      this.log('info', `轨迹 "${id}" 已更新`);
      return true;
    } catch (error) {
      this.log('error', `更新轨迹失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 显示轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public showTrack(id: string): boolean {
    try {
      if (!this.tracks.has(id)) {
        return false;
      }
      
      // 显示轨迹要素
      if (this.trackFeatures.has(id)) {
        const feature = this.trackFeatures.get(id)!;
        feature.setStyle(feature.getStyle());
      }
      
      // 显示节点要素
      if (this.trackPointFeatures.has(id)) {
        const features = this.trackPointFeatures.get(id)!;
        features.forEach(feature => {
          feature.setStyle(feature.getStyle());
        });
      }
      
      this.log('debug', `轨迹 "${id}" 已显示`);
      return true;
    } catch (error) {
      this.log('error', `显示轨迹失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 隐藏轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public hideTrack(id: string): boolean {
    try {
      if (!this.tracks.has(id)) {
        return false;
      }
      
      // 隐藏轨迹要素
      if (this.trackFeatures.has(id)) {
        const feature = this.trackFeatures.get(id)!;
        feature.setStyle(null);
      }
      
      // 隐藏节点要素
      if (this.trackPointFeatures.has(id)) {
        const features = this.trackPointFeatures.get(id)!;
        features.forEach(feature => {
          feature.setStyle(null);
        });
      }
      
      this.log('debug', `轨迹 "${id}" 已隐藏`);
      return true;
    } catch (error) {
      this.log('error', `隐藏轨迹失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 设置所有轨迹可见性
   * @param visible 是否可见
   */
  public setAllTracksVisible(visible: boolean): void {
    try {
      this.tracksVisible = visible;
      
      // 设置所有轨迹的可见性
      this.tracks.forEach((_, id) => {
        if (visible) {
          this.showTrack(id);
        } else {
          this.hideTrack(id);
        }
      });
      
      this.log('debug', `所有轨迹可见性已设置为 ${visible}`);
    } catch (error) {
      this.log('error', '设置所有轨迹可见性失败', error);
    }
  }
  
  /**
   * 获取所有轨迹
   * @returns 轨迹映射
   */
  public getAllTracks(): Map<string, Track> {
    return this.tracks;
  }
  
  /**
   * 获取轨迹
   * @param id 轨迹ID
   * @returns 轨迹
   */
  public getTrack(id: string): Track | null {
    return this.tracks.get(id) || null;
  }
  
  /**
   * 播放轨迹
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否成功
   */
  public play(id: string, player?: Partial<TrackPlayer>): boolean {
    try {
      if (!this.tracks.has(id)) {
        return false;
      }
      
      // 设置轨迹播放状态
      this.trackPlayStates.set(id, TrackPlayState.PLAYING);
      
      // 更新播放器配置
      if (player) {
        this.trackPlayers.set(id, { ...this.trackPlayers.get(id), ...player });
      }
      
      // 设置轨迹动画以确保正确应用速度因子
      this.setupTrackAnimation(id);
      
      this.log('info', `轨迹 "${id}" 已开始播放`);
      return true;
    } catch (error) {
      this.log('error', `播放轨迹失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 暂停轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public pause(id: string): boolean {
    try {
      if (!this.tracks.has(id)) {
        return false;
      }
      
      // 设置轨迹播放状态
      this.trackPlayStates.set(id, TrackPlayState.PAUSED);
      
      // 不需要移除动画监听器，只需改变状态
      // 下一次渲染循环中，由于状态不是PLAYING，动画将不会更新
      
      this.log('info', `轨迹 "${id}" 已暂停播放`);
      return true;
    } catch (error) {
      this.log('error', `暂停轨迹失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 停止轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public stop(id: string): boolean {
    try {
      if (!this.tracks.has(id)) {
        return false;
      }
      
      // 设置轨迹播放状态
      this.trackPlayStates.set(id, TrackPlayState.STOPPED);
      
      // 重置进度
      this.trackProgressValues.set(id, 0);
      
      // 移除动画监听器
      this.removeTrackAnimation(id);
      
      // 清除已通过线条
      if (this.trackPassedLineFeatures.has(id)) {
        const feature = this.trackPassedLineFeatures.get(id)!;
        feature.setGeometry(new LineString([]));
      }
      
      this.log('info', `轨迹 "${id}" 已停止播放`);
      return true;
    } catch (error) {
      this.log('error', `停止轨迹失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 设置轨迹速度因子
   * @param id 轨迹ID
   * @param speedFactor 速度因子
   * @returns 是否成功
   */
  public setTrackSpeedFactor(id: string, speedFactor: number): boolean {
    if (!this.tracks.has(id) || speedFactor <= 0) {
      return false;
    }
    
    this.trackSpeedFactors.set(id, speedFactor);
    this.log('debug', `轨迹 "${id}" 速度因子已设置为 ${speedFactor}`);
    return true;
  }
  
  /**
   * 获取轨迹速度因子
   * @param id 轨迹ID
   * @returns 速度因子
   */
  public getTrackSpeedFactor(id: string): number | null {
    return this.trackSpeedFactors.get(id) || null;
  }
  
  /**
   * 设置轨迹进度
   * @param id 轨迹ID
   * @param progress 进度值(0-1)
   * @returns 是否成功
   */
  public setTrackProgress(id: string, progress: number): boolean {
    if (!this.tracks.has(id) || progress < 0 || progress > 1) {
      return false;
    }
    
    this.trackProgressValues.set(id, progress);
    this.log('debug', `轨迹 "${id}" 进度已设置为 ${progress}`);
    return true;
  }
  
  /**
   * 获取轨迹进度
   * @param id 轨迹ID
   * @returns 进度值(0-1)
   */
  public getTrackProgress(id: string): number | null {
    return this.trackProgressValues.get(id) || null;
  }
  
  /**
   * 获取轨迹播放状态
   * @param id 轨迹ID
   * @returns 播放状态
   */
  public getTrackPlayState(id: string): TrackPlayState | null {
    return this.trackPlayStates.get(id) || null;
  }
  
  /**
   * 清除所有轨迹
   * @returns 是否成功
   */
  public clearAllTracks(): boolean {
    try {
      // 清除所有轨迹要素
      this.trackFeatures.forEach((feature) => {
        this.trackLayer?.getSource()?.removeFeature(feature);
      });
      
      // 清除所有节点要素
      this.trackPointFeatures.forEach((features) => {
        features.forEach((feature) => {
          this.trackPointLayer?.getSource()?.removeFeature(feature);
        });
      });
      
      // 清除所有映射
      this.tracks.clear();
      this.trackFeatures.clear();
      this.trackPointFeatures.clear();
      this.trackPlayStates.clear();
      this.trackProgressValues.clear();
      this.trackSpeedFactors.clear();
      
      this.log('info', '所有轨迹已清除');
      return true;
    } catch (error) {
      this.log('error', '清除所有轨迹失败', error);
      return false;
    }
  }
  
  /**
   * 隐藏所有轨迹
   * @returns 是否成功
   */
  public hideAllTracks(): boolean {
    try {
      this.tracks.forEach((_, id) => {
        this.hideTrack(id);
      });
      
      this.tracksVisible = false;
      this.log('debug', '所有轨迹已隐藏');
      return true;
    } catch (error) {
      this.log('error', '隐藏所有轨迹失败', error);
      return false;
    }
  }
  
  /**
   * 显示所有轨迹
   * @returns 是否成功
   */
  public showAllTracks(): boolean {
    try {
      this.tracks.forEach((_, id) => {
        this.showTrack(id);
      });
      
      this.tracksVisible = true;
      this.log('debug', '所有轨迹已显示');
      return true;
    } catch (error) {
      this.log('error', '显示所有轨迹失败', error);
      return false;
    }
  }
  
  /**
   * 设置轨迹节点可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodesVisible(id: string, visible: boolean): boolean {
    try {
      if (!this.tracks.has(id)) {
        return false;
      }
      
      this.trackNodesVisible.set(id, visible);
      
      // 设置节点要素的可见性
      if (this.trackPointFeatures.has(id)) {
        const features = this.trackPointFeatures.get(id)!;
        features.forEach(feature => {
          if (visible) {
            feature.setStyle(feature.getStyle());
          } else {
            feature.setStyle(null);
          }
        });
      }
      
      this.log('debug', `轨迹 "${id}" 节点可见性已设置为 ${visible}`);
      return true;
    } catch (error) {
      this.log('error', `设置轨迹节点可见性失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 设置轨迹速度弹窗可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackSpeedPopoversVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      return false;
    }
    
    this.trackSpeedPopoversVisible.set(id, visible);
    this.log('debug', `轨迹 "${id}" 速度弹窗可见性已设置为 ${visible}`);
    return true;
  }
  
  /**
   * 获取当前速度
   * @param id 轨迹ID
   * @returns 当前速度
   */
  public getCurrentSpeed(id: string): number | null {
    return this.trackCurrentSpeeds.get(id) || null;
  }
  
  /**
   * 设置轨迹播放器
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否成功
   */
  public setTrackPlayer(id: string, player: Partial<TrackPlayer>): boolean {
    if (!this.tracks.has(id)) {
      return false;
    }
    
    this.trackPlayers.set(id, player);
    this.log('debug', `轨迹 "${id}" 播放器已设置`);
    return true;
  }
  
  /**
   * 更新轨迹播放器
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否成功
   */
  public updateTrackPlayer(id: string, player: Partial<TrackPlayer>): boolean {
    if (!this.tracks.has(id)) {
      return false;
    }
    
    this.trackPlayers.set(id, { ...this.trackPlayers.get(id), ...player });
    this.log('debug', `轨迹 "${id}" 播放器已更新`);
    return true;
  }
  
  /**
   * 更新轨迹速度
   * @param id 轨迹ID
   * @param speedFactor 速度因子
   * @returns 是否成功
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
      // 重新设置轨迹动画，使新的速度因子立即生效
      this.setupTrackAnimation(id);
      
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
   * 设置轨迹动画
   * @param id 轨迹ID
   */
  private setupTrackAnimation(id: string): void {
    // 移除现有的动画
    this.removeTrackAnimation(id);
    
    const track = this.tracks.get(id);
    if (!track || !track.points || track.points.length < 2) {
      this.log('warn', `设置轨迹动画失败: 轨迹 "${id}" 不存在或点数量不足`);
      return;
    }
    
    // 获取当前的速度因子（倍速）
    const speedFactor = this.trackSpeedFactors.get(id) || 1.0;
    
    // 获取播放器配置
    const player = this.trackPlayers.get(id) || {};
    
    // 初始化已通过线条
    this.initPassedLineFeature(id);
    
    // 获取当前进度
    let lastProgress = this.trackProgressValues.get(id) || 0;
    let lastTime = Date.now();
    
    // 创建动画和事件监听，以处理轨迹进度更新
    this.trackAnimationListeners.set(id, this.trackLayer!.on('postrender', (event) => {
      // 验证当前播放状态
      const currentState = this.trackPlayStates.get(id);
      if (currentState !== TrackPlayState.PLAYING) return;
      
      // 计算经过的时间（毫秒）
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // 在非常短的间隔内不更新，以避免过度渲染
      if (elapsedTime < 16) return; // 约60fps
      
      // 计算时间范围（秒）
      const timeRange = track.points[track.points.length - 1].time - track.points[0].time;
      
      // 每次都重新获取当前速度因子，确保实时生效
      const currentSpeedFactor = this.trackSpeedFactors.get(id) || 1.0;
      
      // 基于时间和速度因子计算进度变化
      const progressChange = (elapsedTime / 1000) / timeRange * currentSpeedFactor;
      
      // 更新进度
      let newProgress = lastProgress + progressChange;
      
      // 处理循环播放和播放结束
      if (newProgress > 1) {
        const loopEnabled = player.loop === true;
        if (loopEnabled) {
          // 循环播放，重置进度
          newProgress = newProgress % 1;
        } else {
          // 播放结束
          newProgress = 1;
          this.trackPlayStates.set(id, TrackPlayState.STOPPED);
        }
      }
      
      // 保存新进度
      this.trackProgressValues.set(id, newProgress);
      lastProgress = newProgress;
      
      // 更新显示
      this.updatePassedLine(id, newProgress);
      
      // 触发渲染以更新视图
      if (this.mapInstance) {
        this.mapInstance.render();
      }
    }));
    
    this.log('debug', `轨迹 "${id}" 动画已设置，速度因子: ${speedFactor}`);
  }
  
  /**
   * 更新已通过线条
   * @param id 轨迹ID
   * @param progress 进度(0-1)
   */
  private updatePassedLine(id: string, progress: number): void {
    if (!this.tracks.has(id) || !this.trackPassedLineFeatures.has(id)) {
      return;
    }
    
    const track = this.tracks.get(id)!;
    if (!track.points || track.points.length < 2) {
      return;
    }
    
    try {
      // 计算截止到当前进度的点
      const totalPoints = track.points.length;
      const progressIndex = Math.floor(progress * (totalPoints - 1));
      
      // 获取这些点的坐标
      const coordinates = track.points
        .slice(0, progressIndex + 1)
        .map(point => fromLonLat([point.lng, point.lat]));
      
      // 更新已通过线条几何
      const feature = this.trackPassedLineFeatures.get(id)!;
      const lineString = new LineString(coordinates);
      feature.setGeometry(lineString);
    } catch (error) {
      this.log('error', `更新已通过线条失败: ${id}`, error);
    }
  }
  
  /**
   * 移除轨迹动画
   * @param id 轨迹ID
   */
  private removeTrackAnimation(id: string): void {
    // 移除现有的监听器
    if (this.trackAnimationListeners.has(id)) {
      unByKey(this.trackAnimationListeners.get(id)!);
      this.trackAnimationListeners.delete(id);
      this.log('debug', `轨迹 "${id}" 动画监听器已移除`);
    }
    
    // 移除动画要素
    if (this.trackAnimationFeatures.has(id)) {
      const feature = this.trackAnimationFeatures.get(id)!;
      this.trackLayer?.getSource()?.removeFeature(feature);
      this.trackAnimationFeatures.delete(id);
    }
  }
  
  /**
   * 设置轨迹节点速度可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodeSpeedsVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      return false;
    }
    
    this.trackNodeSpeedsVisible.set(id, visible);
    this.log('debug', `轨迹 "${id}" 节点速度可见性已设置为 ${visible}`);
    return true;
  }
  
  /**
   * 设置移动点位名称可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setMovingPointNameVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      return false;
    }
    
    this.trackMovingPointNameVisible.set(id, visible);
    this.log('debug', `轨迹 "${id}" 移动点位名称可见性已设置为 ${visible}`);
    return true;
  }
  
  /**
   * 设置轨迹节点锚点可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodeAnchorsVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      return false;
    }
    
    this.trackNodeAnchorsVisible.set(id, visible);
    this.log('debug', `轨迹 "${id}" 节点锚点可见性已设置为 ${visible}`);
    return true;
  }
  
  /**
   * 设置轨迹节点时间可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodeTimeVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      return false;
    }
    
    this.trackNodeTimeVisible.set(id, visible);
    this.log('debug', `轨迹 "${id}" 节点时间可见性已设置为 ${visible}`);
    return true;
  }
  
  /**
   * 设置轨迹节点弹窗可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodePopoversVisible(id: string, visible: boolean): boolean {
    if (!this.tracks.has(id)) {
      return false;
    }
    
    this.trackNodePopoversVisible.set(id, visible);
    this.log('debug', `轨迹 "${id}" 节点弹窗可见性已设置为 ${visible}`);
    return true;
  }
  
  /**
   * 自适应轨迹视图
   * @param id 轨迹ID
   * @param options 选项
   * @returns 是否成功
   */
  public fitTrackToView(id: string, options?: {
    gotoStart?: boolean;
    padding?: number[];
    duration?: number;
    maxZoom?: number;
  }): boolean {
    try {
      if (!this.tracks.has(id) || !this.mapInstance) {
        return false;
      }
      
      const feature = this.trackFeatures.get(id);
      if (!feature) {
        return false;
      }
      
      const geometry = feature.getGeometry();
      if (!geometry) {
        return false;
      }
      
      // 获取几何体的范围
      const extent = geometry.getExtent();
      
      // 设置视图
      this.mapInstance.getView().fit(extent, {
        padding: options?.padding || [50, 50, 50, 50],
        duration: options?.duration || 500,
        maxZoom: options?.maxZoom
      });
      
      this.log('debug', `轨迹 "${id}" 已自适应视图`);
      return true;
    } catch (error) {
      this.log('error', `自适应轨迹视图失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 选择轨迹
   * @param id 轨迹ID
   * @param options 选项
   * @returns 是否成功
   */
  public selectTrack(id: string, options?: {
    clearOthers?: boolean;
    autoPlay?: boolean;
  }): boolean {
    try {
      if (!this.tracks.has(id)) {
        return false;
      }
      
      // 清除其他选中
      if (options?.clearOthers && this.selectedTrackId && this.selectedTrackId !== id) {
        const oldFeature = this.trackFeatures.get(this.selectedTrackId);
        if (oldFeature) {
          const track = this.tracks.get(this.selectedTrackId)!;
          const color = track.color || this.config.trackColor || '#3388ff';
          const width = (track as ExtendedTrack).width || this.config.trackWidth || 4;
          const opacity = (track as ExtendedTrack).opacity !== undefined ? (track as ExtendedTrack).opacity : (this.config.trackOpacity || 0.8);
          
          oldFeature.setStyle(new Style({
            stroke: new Stroke({
              color: this.colorWithOpacity(color, opacity),
              width: width
            })
          }));
        }
      }
      
      // 设置选中轨迹
      this.selectedTrackId = id;
      
      // 更新轨迹样式
      const feature = this.trackFeatures.get(id);
      if (feature) {
        const selectedColor = this.config.selectedTrackColor || '#ff4500';
        const width = (this.tracks.get(id) as ExtendedTrack).width || this.config.trackWidth || 4;
        
        feature.setStyle(new Style({
          stroke: new Stroke({
            color: selectedColor,
            width: width + 1
          })
        }));
      }
      
      // 自动播放
      if (options?.autoPlay) {
        this.play(id);
      }
      
      this.log('info', `轨迹 "${id}" 已选中`);
      return true;
    } catch (error) {
      this.log('error', `选择轨迹失败: ${id}`, error);
      return false;
    }
  }
  
  /**
   * 销毁实现
   */
  public destroy(): void {
    try {
      // 清除点击监听器
      if (this.clickListener) {
        unByKey(this.clickListener);
        this.clickListener = null;
      }
      
      // 清除轨迹
      this.clearAllTracks();
      
      // 移除图层
      if (this.mapInstance) {
        if (this.trackLayer) {
          this.mapInstance.removeLayer(this.trackLayer);
        }
        if (this.trackPointLayer) {
          this.mapInstance.removeLayer(this.trackPointLayer);
        }
      }
      
      this.trackLayer = null;
      this.trackPointLayer = null;
      this.mapInstance = null;
      
      this.log('debug', 'ol-ext轨迹实现已销毁');
    } catch (error) {
      this.log('error', '销毁ol-ext轨迹实现失败', error);
    }
  }
  
  /**
   * 转换颜色透明度
   * @param color 颜色
   * @param opacity 透明度
   * @returns 带透明度的颜色
   */
  private colorWithOpacity(color: string, opacity: number): string {
    // 处理rgba格式
    if (color.startsWith('rgba(')) {
      const parts = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
      if (parts) {
        return `rgba(${parts[1]}, ${parts[2]}, ${parts[3]}, ${opacity})`;
      }
    }
    
    // 处理rgb格式
    if (color.startsWith('rgb(')) {
      const parts = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (parts) {
        return `rgba(${parts[1]}, ${parts[2]}, ${parts[3]}, ${opacity})`;
      }
    }
    
    // 处理十六进制格式
    if (color.startsWith('#')) {
      let r, g, b;
      if (color.length === 4) {
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      } else {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // 默认返回
    return color;
  }
  
  /**
   * 创建轨迹点样式
   * @param point 轨迹点
   * @param isStart 是否起点
   * @param isEnd 是否终点
   * @returns 样式
   */
  private createTrackPointStyle(point: any, isStart: boolean, isEnd: boolean): Style {
    // 根据节点类型设置样式
    let radius = this.config.nodeRadius || 6;
    let color = this.config.nodeColor || '#3388ff';
    
    if (isStart) {
      radius = radius * 1.5;
      color = '#22cc22'; // 起点绿色
    } else if (isEnd) {
      radius = radius * 1.5;
      color = '#cc2222'; // 终点红色
    }
    
    return new Style({
      image: new CircleStyle({
        radius: radius,
        fill: new Fill({
          color: color
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 2
        })
      })
    });
  }
  
  /**
   * 初始化已通过线条
   * @param id 轨迹ID
   */
  private initPassedLineFeature(id: string): void {
    if (!this.tracks.has(id) || !this.trackLayer) {
      return;
    }
    
    try {
      // 创建已通过线条要素
      const lineFeature = new Feature({
        geometry: new LineString([]),
        name: `${this.tracks.get(id)!.name}_passed_line`,
        trackId: id
      });
      
      // 设置已通过线条样式
      const color = this.config.passedLineColor || '#32cd32';
      const width = (this.tracks.get(id) as ExtendedTrack).width || this.config.trackWidth || 4;
      
      lineFeature.setStyle(new Style({
        stroke: new Stroke({
          color: color,
          width: width
        })
      }));
      
      // 添加到图层和映射
      this.trackPassedLineFeatures.set(id, lineFeature);
      this.trackLayer.getSource()!.addFeature(lineFeature);
    } catch (error) {
      this.log('error', `初始化已通过线条失败: ${id}`, error);
    }
  }
  
  /**
   * 日志记录
   * @param level 日志级别
   * @param message 日志消息
   * @param data 日志数据
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    logger.log(level, LOG_MODULE, message, data);
  }
} 