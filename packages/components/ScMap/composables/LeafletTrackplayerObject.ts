/**
 * Leaflet轨迹播放器对象
 * @description 提供基于Leaflet的轨迹播放功能
 * 
 * 性能优化说明：
 * 1. 使用更高效的轨迹数据缓存机制
 * 2. 简化条件判断，减少运行时开销
 * 3. 优化事件处理，提高响应速度
 * 4. 使用正确的Leaflet-trackplayer引入方式
 * 5. 改进轨迹添加和播放逻辑，避免重复操作
 */
import L from 'leaflet';
// 引入Leaflet-trackplayer
import '../plugins/leaflet-trackplayer/TrackPlayer';
import { MapObject } from './MapObject';
import type { TrackPoint, TrackOptions, TrackConfig, TrackPlayerEventType, Track } from '../types/track';
import { DEFAULT_TRACK_PLAYER_CONFIG } from '../types/track';
import type { TrackPlayerEventHandler } from '../types/trackplayer';
import logger from './LogObject';

// 日志模块前缀
const LOG_MODULE = 'LeafletTrackplayer';

/**
 * 轨迹播放状态枚举
 */
enum TrackPlayState {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused'
}

/**
 * 扩展轨迹配置接口，添加一些Leaflet特有的选项
 */
interface LeafletTrackConfig extends TrackConfig {
  playbackSpeed?: number;
  tickLen?: number;
  maxInterpolationTime?: number;
  position?: string;
  trackPointOptions?: any;
  trackLineOptions?: any;
  customControlCallbacks?: any;
  loop?: boolean;
  withCamera?: boolean;
  showNodeNames?: boolean;
  showNodes?: boolean;
  showNodeSpeed?: boolean;
  showNodeTime?: boolean;
  showNodeDistance?: boolean;
  showPointNames?: boolean;
  showSpeed?: boolean;
  speed?: number;
}

/**
 * Leaflet轨迹播放器选项接口
 */
interface LeafletTrackPlayerOptions {
  playbackSpeed: number;
  tickLen: number;
  maxInterpolationTime: number;
  position: string;
  trackPointOptions: any;
  trackLineOptions: {
    weight: number;
    color: string;
    opacity: number;
  };
  customControlCallbacks: any;
  loop: boolean;
  withCamera: boolean;
  showNodeNames: boolean;
  showNodes: boolean;
  showNodeSpeed: boolean;
  showNodeTime: boolean;
  showNodeDistance: boolean;
  showPointNames: boolean;
  showSpeed: boolean;
  speed: number;
  [key: string]: any;
}

// 确保轨迹点有必要的属性
interface LeafletTrackPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  [key: string]: any;
}

/**
 * 轨迹段速度信息
 */
interface TrackSegmentSpeed {
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  distance: number;
  speed: number; // km/h
}

/**
 * Leaflet轨迹播放器对象类
 */
export class LeafletTrackplayerObject {
  // 地图实例
  private mapInstance: L.Map | null = null;
  // 轨迹播放器控件
  private trackplayerControl: any = null;
  // 轨迹图层
  private trackLayer: L.LayerGroup | null = null;
  // 事件处理器
  private eventHandler: TrackPlayerEventHandler | null = null;
  // 轨迹数据
  private tracks = new Map<string, Track>();
  // 轨迹配置
  private config: LeafletTrackConfig = DEFAULT_TRACK_PLAYER_CONFIG as LeafletTrackConfig;
  // 轨迹播放状态映射
  private trackPlayStates = new Map<string, TrackPlayState>();
  // 当前活动的轨迹ID
  private activeTrackId: string | null = null;
  // 当前选中的轨迹ID
  private selectedTrackId: string | null = null;
  // 轨迹播放器选项
  private options: LeafletTrackPlayerOptions;
  // 全局轨迹显示状态
  private tracksVisible: boolean = true;
  // 播放进度映射 (0-1)
  private trackProgressValues = new Map<string, number>();
  // 轨迹速度因子映射
  private trackSpeedFactors = new Map<string, number>();
  // 每个轨迹ID对应的轨迹播放器映射
  private trackPlayers = new Map<string, any>();
  // 每个轨迹段的速度信息映射
  private trackSegmentSpeeds = new Map<string, TrackSegmentSpeed[]>();
  // 地球半径(米)，用于计算距离
  private readonly EARTH_RADIUS = 6371000;
  
  /**
   * 构造函数
   * @param mapObj 地图对象
   * @param eventHandler 事件处理器
   * @param options 播放器选项
   */
  constructor(mapObj: MapObject, eventHandler?: TrackPlayerEventHandler, options?: Partial<LeafletTrackConfig>) {
    try {
      // 安全获取地图实例
      if (mapObj && typeof mapObj.getMapInstance === 'function') {
        this.mapInstance = mapObj.getMapInstance();
        
        if (!this.mapInstance) {
          this.log('warn', '地图实例未初始化或为null');
          return;
        }
      } else {
        this.log('error', '传入的mapObj无效或不包含getMapInstance方法');
        return;
      }
      
      // 设置事件处理器
      this.eventHandler = eventHandler || null;
      
      // 合并选项
      if (options) {
        this.config = { ...DEFAULT_TRACK_PLAYER_CONFIG as LeafletTrackConfig, ...options };
      }
      
      // 初始化基本配置
      this.options = {
        playbackSpeed: this.config.playbackSpeed || 1,
        tickLen: this.config.tickLen || 1000,
        maxInterpolationTime: this.config.maxInterpolationTime || 5 * 60 * 1000,
        position: this.config.position || 'bottomleft',
        trackPointOptions: this.config.trackPointOptions || {},
        trackLineOptions: this.config.trackLineOptions || {
          weight: 8,
          color: '#0000ff',
          opacity: 1
        },
        customControlCallbacks: this.config.customControlCallbacks || {},
        loop: this.config.loop || false,
        withCamera: this.config.withCamera || false,
        showNodeNames: this.config.showNodeNames || false,
        showNodes: this.config.showNodes !== undefined ? this.config.showNodes : true,
        showNodeSpeed: this.config.showNodeSpeed !== undefined ? this.config.showNodeSpeed : true,
        showNodeTime: this.config.showNodeTime !== undefined ? this.config.showNodeTime : false,
        showNodeDistance: this.config.showNodeDistance !== undefined ? this.config.showNodeDistance : true,
        showPointNames: this.config.showPointNames || true,
        showSpeed: this.config.showSpeed || true,
        speed: this.config.speed || 1
      };
      
      // 创建轨迹图层
      this.trackLayer = L.layerGroup();
      
      // 初始化轨迹播放器
      this.initTrackplayer();
      this.log('debug', 'Leaflet轨迹播放器对象已创建');
    } catch (error) {
      this.log('error', '创建Leaflet轨迹播放器对象失败:', error);
    }
  }
  
  /**
   * 记录日志
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    logger[level](`[${LOG_MODULE}] ${message}`, data);
  }
  
  /**
   * 初始化轨迹播放器
   */
  private initTrackplayer(): void {
    if (!this.mapInstance) {
      this.log('error', '初始化Leaflet轨迹播放器失败: 地图实例未设置');
      return;
    }
    
    try {
      // 将轨迹图层添加到地图
      if (this.trackLayer) {
        this.trackLayer.addTo(this.mapInstance);
      }

            // 阻止地图点击关闭popup的默认行为
      this.mapInstance.on('click', (e) => {
        // 检查地图上是否有移动点的popup打开
        let hasMovingPopupOpen = false;
        
        // 遍历所有轨迹播放器，检查是否有移动点位popup打开
        this.trackPlayers.forEach((trackPlayerData) => {
          if (trackPlayerData.player && trackPlayerData.player.marker && 
              trackPlayerData.player.marker.getPopup && 
              trackPlayerData.player.marker.getPopup() && 
              trackPlayerData.player.marker.isPopupOpen()) {
            hasMovingPopupOpen = true;
          }
        });
        
        // 如果有选中的轨迹或有移动点位的popup打开，阻止关闭行为
        if (this.mapInstance && (this.selectedTrackId || hasMovingPopupOpen)) {
          // 防止Leaflet默认的关闭popup行为
          e.originalEvent.stopPropagation();
          e.originalEvent.preventDefault();
          
          // 延迟执行，确保popup不被关闭
          setTimeout(() => {
            // 确保静态点位popup保持打开状态
            if (this.selectedTrackId) {
              const trackPlayerData = this.trackPlayers.get(this.selectedTrackId);
              if (trackPlayerData && trackPlayerData.player && trackPlayerData.player.nodes) {
                trackPlayerData.player.nodes.forEach((node: any) => {
                  if (node.marker && node.marker.getPopup() && !node.marker.isPopupOpen()) {
                    node.marker.openPopup();
                  }
                });
              }
            }
            
            // 确保移动点位popup保持打开状态
            this.trackPlayers.forEach((trackPlayerData) => {
              if (trackPlayerData.player && trackPlayerData.player.marker) {
                const marker = trackPlayerData.player.marker;
                // 如果弹窗存在且应该保持打开（由_showMovingPointName或_speedPopoverVisible控制）
                if (marker.getPopup && marker.getPopup() && 
                   (trackPlayerData.player._showMovingPointName || trackPlayerData.player._speedPopoverVisible) && 
                   !marker.isPopupOpen()) {
                  marker.openPopup();
                }
              }
            });
          }, 10);
        }
      });

      // 保存原始的closePopup方法
      // @ts-ignore
      this.mapInstance._originalClosePopup = this.mapInstance.closePopup;

      // 重写closePopup方法，根据popup类型决定是否关闭
      // @ts-ignore
      this.mapInstance.closePopup = function (popup?: L.Popup) {
        // 如果是轨迹节点的popup或移动点位popup，则不关闭
        if (popup &&
          (popup.options.className === 'track-node-popup-container' ||
            popup.options.className === 'track-marker-popup-container')) {
          return;
        }
        
        // 如果没有传入popup参数，检查当前地图上所有打开的popup
        if (!popup) {
          // 获取当前地图上的所有图层
          const allLayers: any[] = [];
          this.eachLayer((layer: any) => {
            allLayers.push(layer);
          });
          
          // 找出所有打开的popup图层
          const openPopups = allLayers.filter((layer: any) => {
            return layer instanceof L.Popup && layer.isOpen && layer.isOpen();
          });
          
          // 如果有打开的popup，检查它们是否属于要保留的类型
          for (const p of openPopups) {
            if (p.options && 
               (p.options.className === 'track-node-popup-container' || 
                p.options.className === 'track-marker-popup-container')) {
              // 发现保留类型的popup，不执行关闭操作
              return;
            }
          }
        }

        // 对于其他类型的popup，调用原始方法关闭
        // @ts-ignore
        this._originalClosePopup(popup);
      };
      
      this.log('debug', 'Leaflet轨迹播放器初始化完成');
      
      // 触发初始化完成事件
      this.triggerEvent('trackplayer-init', {
        message: 'Leaflet轨迹播放器初始化完成'
      });
    } catch (error) {
      this.log('error', '初始化Leaflet轨迹播放器失败:', error);
    }
  }
  
  /**
   * 选中轨迹
   * @param trackId 轨迹ID
   * @param options 选项 {autoPlay: 是否自动播放}
   * @returns 是否成功选中
   */
  public selectTrack(trackId: string, options?: { autoPlay?: boolean }): boolean {
    try {
      if (!this.tracks.has(trackId)) {
        this.log('warn', `选中轨迹失败: 未找到轨迹 ${trackId}`);
        return false;
      }

      // 如果之前有选中的轨迹，先隐藏其静态点位
      if (this.selectedTrackId && this.selectedTrackId !== trackId) {
        this.hideTrackNodes(this.selectedTrackId);
      }
      
      // 设置选中的轨迹ID
      this.selectedTrackId = trackId;

      // 显示当前选中轨迹的静态点位
      this.showTrackNodes(trackId);
      
      // 触发轨迹选中事件
      this.triggerEvent('track-select', {
        trackId: trackId,
        track: this.tracks.get(trackId)
      });
      
      // 如果需要自动播放
      if (options?.autoPlay) {
        this.play(trackId);
      }
      
      this.log('debug', `轨迹 ${trackId} 已选中${options?.autoPlay ? '并开始播放' : ''}`);
      return true;
    } catch (error) {
      this.log('error', `选中轨迹 ${trackId} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 获取当前选中的轨迹ID
   * @returns 选中的轨迹ID
   */
  public getSelectedTrackId(): string | null {
    return this.selectedTrackId;
  }
  
  /**
   * 获取当前选中的轨迹
   * @returns 选中的轨迹
   */
  public getSelectedTrack(): Track | null {
    if (!this.selectedTrackId) {
      return null;
    }
    
    return this.tracks.get(this.selectedTrackId) || null;
  }
  
  
  /**
   * 添加轨迹数据
   * @param track 轨迹数据
   * @returns 是否成功添加
   */
  public addTrack(track: Track): boolean {
    try {
      if (!track || !track.id || !Array.isArray(track.points) || track.points.length === 0) {
        this.log('warn', '添加轨迹失败: 无效的轨迹数据');
        return false;
      }

      // 格式化轨迹点的时间戳
      const formattedTrack = {
        ...track,
        points: track.points.map(point => ({
          ...point,
          timestamp: typeof point.timestamp === 'string' 
            ? new Date(point.timestamp).getTime() 
            : point.timestamp
        }))
      };
      
      // 根据时间排序轨迹点
      const sortedTrack = this.sortTrackPointsByTime(formattedTrack);
      
      // 计算轨迹段速度
      const segmentSpeeds = this.calculateSegmentSpeeds(sortedTrack);
      
      // 保存轨迹段速度
      this.trackSegmentSpeeds.set(track.id, segmentSpeeds);

      // 初始化轨迹速度因子，优先使用轨迹设置的速度因子
      const speedFactor = (track.options && track.options.speedFactor) || 1.0;
      this.trackSpeedFactors.set(track.id, speedFactor);
      
      // 为该轨迹创建独立的TrackPlayer
      this.createTrackPlayer(track.id, sortedTrack);
      
      // 添加到轨迹数据映射
      this.tracks.set(track.id, sortedTrack);

      // 默认隐藏静态点位，只有在选中轨迹时才显示
      this.hideTrackNodes(track.id);
      
      // 触发轨迹添加事件
      this.triggerEvent('track-add', {
        id: track.id,
        pointCount: track.points.length,
        segmentCount: segmentSpeeds.length,
        averageSpeed: this.calculateAverageSpeed(segmentSpeeds),
        speedFactor: speedFactor // 添加速度因子到事件数据
      });
      
      this.log('debug', `已添加轨迹到缓存: ${track.id}, 点数: ${track.points.length}, 段数: ${segmentSpeeds.length}, 速度因子: ${speedFactor}x`);
      return true;
    } catch (error) {
      this.log('error', '添加轨迹数据失败:', error);
      return false;
    }
  }
  
  /**
   * 计算平均速度
   * @param segmentSpeeds 轨迹段速度数组
   * @returns 平均速度(km/h)
   */
  private calculateAverageSpeed(segmentSpeeds: TrackSegmentSpeed[]): number {
    if (segmentSpeeds.length === 0) {
      return 0;
    }
    
    let totalDistance = 0;
    let totalTime = 0;
    
    segmentSpeeds.forEach(segment => {
      totalDistance += segment.distance;
      totalTime += (segment.endTime - segment.startTime) / 1000; // 转换为秒
    });
    
    return totalTime > 0 ? (totalDistance / totalTime) * 3.6 : 0; // 转换为km/h
  }
  
  /**
   * 为轨迹创建独立的TrackPlayer
   * @param trackId 轨迹ID
   * @param track 轨迹数据
   */
  /**
   * 获取轨迹点的时间戳（支持多种格式）
   * @param point 轨迹点
   * @returns 时间戳（毫秒）
   */
  private getPointTimestamp(point: any): number {
    // 如果直接有timestamp字段且为数字，直接使用
    if (typeof point.timestamp === 'number') {
      return point.timestamp;
    }

    // 如果有time字段且为数字，直接使用
    if (typeof point.time === 'number') {
      return point.time;
    }

    // 如果timestamp是字符串，尝试转换为时间戳
    if (typeof point.timestamp === 'string') {
      try {
        return new Date(point.timestamp).getTime();
      } catch (e) {
        this.log('warn', `无法解析字符串时间戳: ${point.timestamp}`);
      }
    }

    // 如果time是字符串，尝试转换为时间戳
    if (typeof point.time === 'string') {
      try {
        return new Date(point.time).getTime();
      } catch (e) {
        this.log('warn', `无法解析字符串时间戳: ${point.time}`);
      }
    }

    // 如果没有有效的时间戳，返回当前时间加上索引值（确保时间顺序）
    this.log('warn', `轨迹点缺少有效的时间戳，使用当前时间作为替代`);
    return Date.now();
  }

  private createTrackPlayer(trackId: string, track: Track): void {
    try {
      if (!this.mapInstance) {
        this.log('warn', '创建轨迹播放器失败: 地图实例未设置');
        return;
      }
      
      // 确保轨迹有足够的点
      if (!track.points || track.points.length < 2) {
        this.log('warn', `创建轨迹播放器失败: 轨迹 ${trackId} 的点数量不足，至少需要2个点`);
        return;
      }

      // 根据时间戳排序轨迹点
      const sortedPoints = [...track.points].sort((a, b) => {
        const timeA = this.getPointTimestamp(a);
        const timeB = this.getPointTimestamp(b);
        return timeA - timeB;
      });
      
      // 创建轨迹数据，确保每个点都有正确的经纬度和时间戳
      const positions = sortedPoints.map((point: any, index: number) => {
        // 处理不同格式的轨迹点
        const lat = typeof point.lat === 'number' ? point.lat :
          (typeof point.latitude === 'number' ? point.latitude : null);

        const lng = typeof point.lng === 'number' ? point.lng :
          (typeof point.longitude === 'number' ? point.longitude : null);

        // 获取时间戳，支持多种格式
        const time = this.getPointTimestamp(point);

        // 确保必要的属性存在且有效
        if (lat === null || lng === null || time === null) {
          this.log('warn', `轨迹点缺少必要的属性或属性类型错误: ${JSON.stringify(point)}`);
          return null;
        }

        // 返回标准化的点格式
        return {
          lat: lat,
          lng: lng,
          time: time,
          // 保留其他属性以便在弹窗中显示
          properties: {
            ...point.properties,
            speed: point.speed,
            heading: point.heading,
            altitude: point.altitude,
            index: index
          }
        };
      }).filter(pos => pos !== null); // 过滤掉无效的点
      
      // 再次检查有效点数量
      if (positions.length < 2) {
        this.log('warn', `创建轨迹播放器失败: 轨迹 ${trackId} 的有效点数量不足，至少需要2个有效点`);
        return;
      }

      // 获取轨迹名称（支持不同的数据结构）
      let trackName = `轨迹 ${trackId}`;
      if (track.options && typeof track.options === 'object' && track.options.name) {
        trackName = track.options.name;
      } else if (typeof (track as any).name === 'string') {
        trackName = (track as any).name;
      }
      
      const trackData = {
        name: trackName,
        positions: positions
      };
      
      // 创建轨迹播放器
      try {
        // 获取或设置初始速度因子
        const initialSpeedFactor = this.trackSpeedFactors.get(trackId) || 1.0;

        // 初始化时传入轨迹数据
        const trackPlayer = new L.TrackPlayer(positions, {
          speed: this.options.playbackSpeed * initialSpeedFactor * 300, // 应用速度因子后再乘以300倍
            markerRotation: true,
            markerRotationOffset: 0,
            panTo: this.options.withCamera,
            passedLineColor: this.config.passedLineOptions?.color || '#0000ff',
            notPassedLineColor: this.config.notPassedLineOptions?.color || '#ff0000',
          weight: this.options.trackLineOptions?.weight || 8,
          // 添加默认图标设置
          markerIcon: L.icon({
            iconUrl: this.config.trackSpeedGroup?.[0]?.icon || '/images/marker-icon.png',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -5]
          })
        });
        
        // 当轨迹播放器创建好marker后，给它添加事件处理器
        // 确保marker被创建后再添加处理
        setTimeout(() => {
          if (trackPlayer.marker) {
            // 给移动点位添加点击事件处理，防止点击时关闭popup
            trackPlayer.marker.on('click', function(e: L.LeafletMouseEvent) {
              // 阻止事件冒泡，防止触发地图点击
              L.DomEvent.stopPropagation(e);
              // 阻止默认行为
              L.DomEvent.preventDefault(e);
              
              // 确保popup保持打开状态
              if (this.getPopup && !this.isPopupOpen()) {
                this.openPopup();
              }
            });
            
            // 标记已添加点击处理
            trackPlayer.marker._hasClickHandler = true;
          }
        }, 100); // 短暂延时确保marker已创建

        // 保存当前应用的速度因子
        this.trackSpeedFactors.set(trackId, initialSpeedFactor);

        // 创建节点图层 - 用于显示轨迹上的静态点位
        const nodeLayer = L.layerGroup();

        // 创建节点标记数组
        const nodes: any[] = [];

        // 遍历轨迹点，为每个点创建标记
        positions.forEach((position: any, index: number) => {
          // 只为起点、终点和特定间隔的点创建节点标记，避免节点过多
          const isStartOrEnd = index === 0 || index === positions.length - 1;
          const isInterval = index % 5 === 0; // 每5个点创建一个节点标记

          if (isStartOrEnd || isInterval) {
            // 获取点位的名称
            const nodeName = index === 0 ? '起点' : (index === positions.length - 1 ? '终点' : `路径点 ${index}`);

            // 为重要点位（起点和终点）使用不同的样式
            const iconSize = isStartOrEnd ? 14 : 10;
            const iconColor = isStartOrEnd ? '#4CAF50' : '#f44336';

            // 创建节点标记
            const marker = L.marker([position.lat, position.lng], {
              icon: L.divIcon({
                className: `track-node ${isStartOrEnd ? 'track-node-endpoint' : 'track-node-midpoint'}`,
                html: `<div class="track-node-inner" style="background-color:${iconColor};width:${iconSize}px;height:${iconSize}px;"></div>`,
                iconSize: [iconSize, iconSize],
                iconAnchor: [iconSize / 2, iconSize / 2]
              })
            });

            // 格式化时间为可读格式
            const formattedTime = this.formatTime(position.time);

            // 计算与上一个点的距离（除了起点）
            let distance = 0;
            if (index > 0) {
              const prevPosition = positions[index - 1];
              distance = this.calculateDistance(
                { latitude: prevPosition.lat, longitude: prevPosition.lng, timestamp: prevPosition.time },
                { latitude: position.lat, longitude: position.lng, timestamp: position.time }
              );
            }

            // 创建弹窗内容 - 使用高亮样式的标题
            let popupContent = `<div class="track-node-popup">`;
            popupContent += `<div class="track-node-title ">${nodeName}</div>`;
            popupContent += `<div class="track-node-time">${formattedTime}</div>`;

            // 如果有速度，显示速度
            if (position.properties && position.properties.speed) {
              popupContent += `<div class="track-node-speed">速度: ${position.properties.speed.toFixed(1)} km/h</div>`;
            }

            // 显示与上一个点的距离（除了起点）
            if (index > 0) {
              const distanceKm = (distance / 1000).toFixed(2);
              // 默认显示距离，除非明确设置为false
              const showDistance = this.options.showNodeDistance !== false;
              popupContent += `<div class="track-node-distance" ${!showDistance ? 'style="display:none"' : ''}>距离: ${distanceKm} km</div>`;
            }

            popupContent += `</div>`;

            // 绑定弹窗，设置更好的选项
            marker.bindPopup(popupContent, {
              closeButton: false,
              autoClose: false,  // 不会被其他点击自动关闭
              className: 'track-node-popup-container',
              maxWidth: 300
            });

            // 添加到节点图层
            nodeLayer.addLayer(marker);

            // 添加高亮节点标题的样式
            this.addTrackNodeHighlightedStyles();

            // 保存节点信息
            nodes.push({
              marker: marker,
              position: position,
              index: index,
              name: nodeName,
              time: formattedTime,
              distance: index > 0 ? distance : 0
            });
          }
        });

        // 将节点图层和节点数组添加到轨迹播放器对象
        (trackPlayer as any).nodeLayer = nodeLayer;
        (trackPlayer as any).nodes = nodes;

        // 创建节点图层但不立即添加到地图
        // 只有在轨迹被选中时才会显示静态点位

        // 添加自定义方法到轨迹播放器
        (trackPlayer as any).setNodesVisible = (visible: boolean) => {
          if (visible) {
            if (this.mapInstance) nodeLayer.addTo(this.mapInstance);
          } else {
            nodeLayer.remove();
          }
        };

        // 添加控制节点名称可见性的方法
        (trackPlayer as any).setNodePopoversVisible = (visible: boolean) => {
          nodes.forEach(node => {
            if (node.marker) {
              if (visible) {
                // 不再使用tooltip，直接使用popup显示节点名称和详情
                // 创建或更新popup内容，在顶部突出显示节点名称
                const existingPopup = node.marker.getPopup();
                if (existingPopup) {
                  // 获取现有内容
                  const content = existingPopup.getContent();
                  if (typeof content === 'string') {
                    // 更新节点标题部分，使其更加醒目
                    const newContent = content.replace(
                      /<div class="track-node-title">.*?<\/div>/,
                      `<div class="track-node-title ">${node.name}</div>`
                    );
                    existingPopup.setContent(newContent);
                  }

                  // 确保popup选项是正确的
                  existingPopup.options.closeButton = false;
                  existingPopup.options.autoClose = false;
                  existingPopup.options.closeOnClick = false;

                  // 自动打开弹窗，显示详细信息
                  node.marker.openPopup();
                } else {
                  // 如果没有popup，创建一个带高亮标题的新popup
                  const popupContent = `
              <div class="track-node-popup">
                <div class="track-node-title ">${node.name}</div>
                <div class="track-node-time">${node.time || ''}</div>
                ${node.distance > 0 ? `<div class="track-node-distance">距离: ${(node.distance / 1000).toFixed(2)} km</div>` : ''}
              </div>
            `;

                  // 绑定新的popup
                  node.marker.bindPopup(popupContent, {
                    closeButton: false,
                    autoClose: false,
                    closeOnClick: false,
                    className: 'track-node-popup-container',
                    maxWidth: 300
                  });

                  // 打开popup
                  node.marker.openPopup();
                }
              } else {
                // 关闭弹窗
                if (node.marker.getPopup()) {
                  node.marker.closePopup();
                }
              }
            }
          });
        };

        // 添加控制节点时间可见性的方法
        (trackPlayer as any).setNodeTimeVisible = (visible: boolean) => {
          nodes.forEach(node => {
            if (node.marker) {
              const popup = node.marker.getPopup();
              if (popup) {
                const content = popup.getContent();
                if (typeof content === 'string') {
                  // 根据visible参数显示或隐藏时间信息
                  const newContent = visible ?
                    content.replace('<div class="track-node-time" style="display:none">', '<div class="track-node-time">') :
                    content.replace('<div class="track-node-time">', '<div class="track-node-time" style="display:none">');
                  popup.setContent(newContent);
                }
              }
            }
          });
        };

        // 添加控制节点速度可见性的方法
        (trackPlayer as any).setNodeSpeedsVisible = (visible: boolean) => {
          nodes.forEach(node => {
            if (node.marker) {
              const popup = node.marker.getPopup();
              if (popup) {
                const content = popup.getContent();
                if (typeof content === 'string') {
                  // 根据visible参数显示或隐藏速度信息
                  const newContent = visible ?
                    content.replace('<div class="track-node-speed" style="display:none">', '<div class="track-node-speed">') :
                    content.replace('<div class="track-node-speed">', '<div class="track-node-speed" style="display:none">');
                  popup.setContent(newContent);
                }
              }
            }
          });
        };

        // 添加控制节点距离可见性的方法
        (trackPlayer as any).setNodeDistanceVisible = (visible: boolean) => {
          nodes.forEach(node => {
            if (node.marker && node.index > 0) { // 跳过起点（没有距离信息）
              const popup = node.marker.getPopup();
              if (popup) {
                const content = popup.getContent();
                if (typeof content === 'string') {
                  // 根据visible参数显示或隐藏距离信息
                  const newContent = visible ?
                    content.replace('<div class="track-node-distance" style="display:none">', '<div class="track-node-distance">') :
                    content.replace('<div class="track-node-distance">', '<div class="track-node-distance" style="display:none">');
                  popup.setContent(newContent);
                }
              }
            }
          });
        };

        // 添加控制移动点位名称可见性的方法
        (trackPlayer as any).setMovingPointNameVisible = (visible: boolean) => {
          // 确保有移动标记
          if (trackPlayer.marker) {
            // 获取轨迹名称
            const trackName = track.options?.name || trackId;

            if (visible) {
              // 创建基本弹窗内容，只显示名称
              const popupContent = `
          <div class="track-node-popup">
            <div class="track-node-title ">${trackName}</div>
          </div>
        `;

              // 检查是否已有popup
              const existingPopup = trackPlayer.marker.getPopup();
              if (existingPopup) {
                // 如果已有popup，只更新标题部分
                const content = existingPopup.getContent();
                if (typeof content === 'string' && content.includes('track-node-title')) {
                  // 更新标题
                  const newContent = content.replace(
                    /<div class="track-node-title.*?">.*?<\/div>/,
                    `<div class="track-node-title ">${trackName}</div>`
                  );
                  existingPopup.setContent(newContent);
                } else {
                  // 设置新内容
                  existingPopup.setContent(popupContent);
                }

                // 打开popup
                trackPlayer.marker.openPopup();
              } else {
                // 创建新的popup
                trackPlayer.marker.bindPopup(popupContent, {
                  closeButton: false,
                  autoClose: false,
                  className: 'track-marker-popup-container',
                  offset: [0, -15]
                });

                // 打开popup
                trackPlayer.marker.openPopup();
              }

              // 保存显示状态
              trackPlayer._showMovingPointName = true;
            } else {
              // 如果要隐藏，关闭popup并标记状态
              if (trackPlayer.marker.getPopup()) {
                trackPlayer.marker.closePopup();
              }
              trackPlayer._showMovingPointName = false;
            }
          }
        };

        // 添加控制速度弹窗可见性的方法
        (trackPlayer as any).setSpeedPopoversVisible = (visible: boolean) => {
          // 设置速度信息显示标志
          trackPlayer._speedPopoverVisible = visible;

          // 如果不显示速度，且不显示名称，则关闭popup
          if (!visible && !trackPlayer._showMovingPointName) {
            if (trackPlayer.marker && trackPlayer.marker.getPopup()) {
              trackPlayer.marker.closePopup();
            }
          }
        };

        // 添加CSS样式到页面，用于轨迹节点的样式
        this.addTrackNodeStyles();

        // 绑定轨迹播放器事件，监听进度更新
        this.bindTrackPlayerEvents(trackId, trackPlayer, positions);
          
          // 保存轨迹播放器
          this.trackPlayers.set(trackId, {
            player: trackPlayer,
            data: trackData
          });

        // 确保轨迹具有正确的结构
        const trackOptions: TrackOptions = track.options || {};
        const formattedTrack: Track = {
          id: trackId,
          points: sortedPoints,
          options: {
            id: trackId,
            name: trackName,
            ...trackOptions
          }
        };

        // 将轨迹添加到轨迹数据映射中，确保getAllTracks能够返回正确的轨迹数据
        this.tracks.set(trackId, formattedTrack);

        // 触发轨迹添加事件，通知TrackPlayer.vue组件刷新列表
        const trackAddedEvent = new CustomEvent('track-added', {
          detail: { trackId, track: formattedTrack }
        });
        // 在document上触发事件，确保可以被全局捕获
        document.dispatchEvent(trackAddedEvent);

        // 如果地图实例存在，也在地图容器上触发事件
        if (this.mapInstance && this.mapInstance.getContainer()) {
          this.mapInstance.getContainer().dispatchEvent(trackAddedEvent);
        }
          
          this.log('debug', `已为轨迹 ${trackId} 创建独立的播放器`);
        } catch (error) {
          this.log('error', `创建L.TrackPlayer实例失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    } catch (error) {
      this.log('error', `为轨迹 ${trackId} 创建播放器失败:`, error);
    }
  }

  /**
   * 添加轨迹节点样式到页面
   */
  private addTrackNodeStyles(): void {
    // 如果已经添加过样式，不再重复添加
    if (document.getElementById('track-player-styles')) {
      return;
    }

    // 创建样式元素
    const style = document.createElement('style');
    style.id = 'track-player-styles';
    style.innerHTML = `
      .track-node {
        background: transparent;
      }
      .track-node-inner {
        width: 10px;
        height: 10px;
        background-color: #f44336;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
      }
      .track-node-endpoint .track-node-inner {
        width: 14px;
        height: 14px;
        background-color: #4CAF50;
      }
      .track-node-popup {
        padding: 8px;
        min-width: 150px;
      }
      .track-node-title {
        font-weight: bold;
        margin-bottom: 6px;
        color: #333;
        font-size: 14px;
      }
      .track-node-time {
        font-size: 12px;
        color: #666;
        margin: 4px 0;
        padding: 2px 0;
        border-bottom: 1px dashed #eee;
      }
      .track-node-speed {
        font-size: 13px;
        color: #1890ff;
        font-weight: bold;
        margin: 4px 0;
        background: rgba(24, 144, 255, 0.1);
        padding: 3px 6px;
        border-radius: 3px;
      }
      .track-node-distance {
        font-size: 13px;
        color: #ff9800;
        font-weight: bold;
        margin: 4px 0;
        background: rgba(255, 152, 0, 0.1);
        padding: 3px 6px;
        border-radius: 3px;
      }
    `;

    // 添加到文档头部
    document.head.appendChild(style);
  }

  /**
   * 绑定轨迹播放器事件
   * @param trackId 轨迹ID
   * @param trackPlayer 轨迹播放器实例
   * @param positions 轨迹点数据
   */
  private bindTrackPlayerEvents(trackId: string, trackPlayer: any, positions: any[]): void {
    try {
      // 播放开始事件
      trackPlayer.on('start', () => {
        this.trackPlayStates.set(trackId, TrackPlayState.PLAYING);
        this.triggerEvent('track-play', { trackId });
      });

      // 播放暂停事件
      trackPlayer.on('pause', () => {
        this.trackPlayStates.set(trackId, TrackPlayState.PAUSED);
        this.triggerEvent('track-pause', { trackId });
      });

      // 播放结束事件
      trackPlayer.on('finish', () => {
        this.trackPlayStates.set(trackId, TrackPlayState.STOPPED);
        this.triggerEvent('track-end', { trackId });
      });

      // 保存节点的经过速度信息
      const nodePassSpeeds = new Map<number, number>();

      // 进度更新事件 - 核心事件，用于实时计算速度和更新图标
      trackPlayer.on('progress', (progress: number, position: { lng: number, lat: number }, index: number) => {
        try {
          // 获取当前位置索引
          const currentIndex = index;

          // 如果当前位置索引有效，并且有下一个点，则可以计算速度
          if (currentIndex >= 0 && currentIndex < positions.length - 1) {
            // 获取当前点和下一个点
            const currentPoint = positions[currentIndex];
            const nextPoint = positions[currentIndex + 1];

            // 计算两点间的距离(米)
            const distance = this.calculateDistance(
              { latitude: currentPoint.lat, longitude: currentPoint.lng, timestamp: currentPoint.time },
              { latitude: nextPoint.lat, longitude: nextPoint.lng, timestamp: nextPoint.time }
            );

            // 计算时间差(秒)
            const timeDiff = (nextPoint.time - currentPoint.time);

            // 计算实际速度(km/h) = 距离(米) / 时间(秒) * 3.6
            const realSpeed = timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0;

            // 应用速度因子
            const speedFactor = this.trackSpeedFactors.get(trackId) || 1.0;
            const displaySpeed = realSpeed * speedFactor;

            // 保存当前速度
            this.triggerEvent('track-speed', {
              trackId,
              realSpeed,
              displaySpeed,
              position: { lat: position.lat, lng: position.lng }
            });

            // 获取轨迹名称
            const track = this.tracks.get(trackId);
            const trackName = track?.options?.name || trackId;

            // 根据速度更新图标 - 这会设置 trackPlayer._currentSpeedGroupName
            this.updateTrackMarkerIcon(trackId, trackPlayer, realSpeed);

            // 移动点位popup处理
            if (trackPlayer.marker) {
              // 确保样式已添加
              this.addMovingPointStyles();
              this.addTrackNodeHighlightedStyles();

              // 处理popup显示 - 合并速度信息和名称显示
              const showTitle = trackPlayer._showMovingPointName || trackPlayer._speedPopoverVisible;
              const showSpeed = trackPlayer._speedPopoverVisible;

              if (showTitle || showSpeed) {
                let popupContent = `<div class="track-marker-popup">`;

                // 如果需要显示标题
                if (showTitle) {
                  popupContent += `<div class="track-node-title ">${trackName}</div>`;
                }

                // 如果需要显示速度信息
                if (showSpeed) {
                  popupContent += `
                    <div class="track-marker-speed">当前速度: ${displaySpeed.toFixed(1)} km/h</div>
                    ${speedFactor !== 1.0 ? `<div class="track-marker-real-speed">实际速度: ${realSpeed.toFixed(1)} km/h</div>` : ''}
                    <div class="track-marker-time">时间: ${this.formatTime(currentPoint.time)}</div>
                  `;
                }

                popupContent += `</div>`;

                // 检查是否已有popup
                const existingPopup = trackPlayer.marker.getPopup();
                if (existingPopup) {
                  // 更新现有popup的内容
                  existingPopup.setContent(popupContent);
                  // 更新popup位置
                  existingPopup.update();
      } else {
                  // 创建新的popup
                  trackPlayer.marker.bindPopup(popupContent, {
                    className: 'track-marker-popup-container',
                    offset: [0, -2],
                    closeButton: false,
                    autoClose: false,
                    closeOnClick: false,
                    interactive: true
                  });
                  
                  // 给移动点位添加点击事件处理器，防止点击时关闭popup
                  if (!trackPlayer.marker._hasClickHandler) {
                    trackPlayer.marker.on('click', function(e: L.LeafletMouseEvent) {
                      // 阻止事件冒泡，防止触发地图点击
                      L.DomEvent.stopPropagation(e);
                      // 阻止默认行为
                      L.DomEvent.preventDefault(e);
                      
                      // 确保popup保持打开状态
                      if (!this.isPopupOpen() && this.getPopup()) {
                        this.openPopup();
                      }
                    });
                    
                    // 标记已添加点击处理
                    trackPlayer.marker._hasClickHandler = true;
                  }
                }

                // 立即显示popup
                trackPlayer.marker.openPopup();
              } else if (trackPlayer.marker.getPopup()) {
                // 如果不需要显示任何信息但有popup，则关闭
                trackPlayer.marker.closePopup();
              }
            }

            // 检查是否经过了轨迹节点，如果经过则更新节点popup显示经过速度
            if (trackPlayer.nodes) {
              // 遍历所有节点
              trackPlayer.nodes.forEach((node: any, nodeIndex: number) => {
                if (node && node.index === currentIndex) {
                  // 记录该节点的经过速度
                  nodePassSpeeds.set(node.index, realSpeed);

                  // 更新节点的popup内容，添加经过速度信息
                  if (node.marker && node.marker.getPopup()) {
                    // 获取节点基本信息
                    const nodeName = node.index === 0 ? '起点' : (node.index === positions.length - 1 ? '终点' : `路径点 ${node.index}`);

                    // 创建新的popup内容
                    let popupContent = `<div class="track-node-popup">`;
                    popupContent += `<div class="track-node-title">${nodeName}</div>`;
                    popupContent += `<div class="track-node-time">${this.formatTime(node.position.time)}</div>`;

                    // 添加经过速度信息
                    popupContent += `<div class="track-node-speed track-node-pass-speed">经过速度: ${realSpeed.toFixed(1)} km/h</div>`;

                    // 如果有原始速度，也显示
                    if (node.position.properties && node.position.properties.speed) {
                      popupContent += `<div class="track-node-speed">原始速度: ${node.position.properties.speed.toFixed(1)} km/h</div>`;
                    }

                    popupContent += `</div>`;

                    // 更新popup内容
                    node.marker.getPopup().setContent(popupContent);
                  }
                } else if (node && nodePassSpeeds.has(node.index) && node.marker && node.marker.getPopup()) {
                  // 如果节点已经被经过但不是当前节点，保持其经过速度显示
                  const passSpeed = nodePassSpeeds.get(node.index);
                  const nodeName = node.index === 0 ? '起点' : (node.index === positions.length - 1 ? '终点' : `路径点 ${node.index}`);

                  // 创建保持经过速度的popup内容
                  let popupContent = `<div class="track-node-popup">`;
                  popupContent += `<div class="track-node-title">${nodeName}</div>`;
                  popupContent += `<div class="track-node-time">${this.formatTime(node.position.time)}</div>`;

                  // 添加经过速度信息
                  popupContent += `<div class="track-node-speed track-node-pass-speed">经过速度: ${passSpeed!.toFixed(1)} km/h</div>`;

                  // 如果有原始速度，也显示
                  if (node.position.properties && node.position.properties.speed) {
                    popupContent += `<div class="track-node-speed">原始速度: ${node.position.properties.speed.toFixed(1)} km/h</div>`;
                  }

                  popupContent += `</div>`;

                  // 更新popup内容
                  node.marker.getPopup().setContent(popupContent);
                }
              });
            }
      }
    } catch (error) {
          this.log('error', `轨迹progress事件处理失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

    } catch (error) {
      this.log('error', `绑定轨迹播放器事件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 根据速度更新轨迹标记图标
   * @param trackId 轨迹ID
   * @param trackPlayer 轨迹播放器实例
   * @param speed 当前速度(km/h)
   */
  private updateTrackMarkerIcon(trackId: string, trackPlayer: any, speed: number): void {
    try {
      // 确保有速度分组配置
      if (!this.config.trackSpeedGroup || this.config.trackSpeedGroup.length === 0) {
        this.log('warn', `未配置轨迹速度组图标，使用默认图标`);
        // 使用默认图标
        if (trackPlayer && trackPlayer.marker) {
          const defaultIcon = L.icon({
            iconUrl: '/images/marker-icon.png',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
          });
          trackPlayer.marker.setIcon(defaultIcon);
        }
        return;
      }

      // 检查轨迹播放器上是否有marker
      if (!trackPlayer || !trackPlayer.marker) {
        this.log('warn', `轨迹 ${trackId} 没有移动标记，无法更新图标`);
        return;
      }

      // 按速度阈值从高到低排序
      const sortedGroups = [...this.config.trackSpeedGroup].sort((a, b) => b.speed - a.speed);

      // 查找对应的图标和速度组名称
      let iconUrl: string | undefined;
      let speedGroupName: string | undefined;

      // 默认的速度组名称映射
      const speedGroupNames: Record<number, string> = {
        0: '行人',
        6: '自行车',
        20: '汽车',
        100: '高铁',
        300: '飞机'
      };

      // 从高速到低速匹配
      for (const group of sortedGroups) {
        if (speed > group.speed) {
          iconUrl = group.icon;
          speedGroupName = speedGroupNames[group.speed] || `${group.speed}+km/h`;

          break;
        }
      }

      // 如果没有匹配到任何组，使用第一个（最低速）速度组
      if (!iconUrl && sortedGroups.length > 0) {
        const lowestGroup = sortedGroups[sortedGroups.length - 1];
        iconUrl = lowestGroup.icon;
        speedGroupName = speedGroupNames[lowestGroup.speed] || `${lowestGroup.speed}+km/h`;
      }

      // 如果找到合适的图标，则更新轨迹标记
      if (iconUrl) {
        // 创建新的图标
        const newIcon = L.icon({
          iconUrl: iconUrl,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -5]
        });

        // 设置标记的图标
        trackPlayer.marker.setIcon(newIcon);

        // 存储当前速度组名称
        trackPlayer._currentSpeedGroupName = speedGroupName;

        // 更新popup内容
        if (trackPlayer.marker.getPopup()) {
          const popup = trackPlayer.marker.getPopup();
          const content = popup.getContent();
          if (typeof content === 'string') {
            // 更新popup内容，添加速度组信息
            const newContent = content.replace(
              /<div class="track-marker-type">.*?<\/div>/,
              `<div class="track-marker-type">类型: ${speedGroupName}</div>`
            );
            popup.setContent(newContent);
          }
        }
      } else {
        // 如果没有找到合适的图标，使用默认图标
        const defaultIcon = L.icon({
          iconUrl: '/images/marker-icon.png',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -5]
        });
        trackPlayer.marker.setIcon(defaultIcon);
        this.log('warn', `未能为轨迹 ${trackId} 找到匹配的速度组图标，使用默认图标`);
      }
    } catch (error) {
      this.log('error', `更新轨迹标记图标失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 播放轨迹
   * @param trackId 轨迹ID
   * @param config 播放配置
   * @returns 是否成功开始播放
   */
  public play(trackId?: string, config?: any): boolean {
    try {
      // 获取要播放的轨迹ID
      const targetTrackId = trackId || this.activeTrackId;
      if (!targetTrackId) {
        // 如果没有指定轨迹ID，也没有活动轨迹，尝试播放第一个轨迹
        if (this.tracks.size > 0) {
          const firstTrackId = Array.from(this.tracks.keys())[0];
          this.activeTrackId = firstTrackId;
        } else {
          this.log('warn', '没有可播放的轨迹');
          return false;
        }
      } else {
        // 设置活动轨迹ID
        this.activeTrackId = targetTrackId;
      }
      
      // 获取当前活动轨迹的播放器
      const trackPlayerData = this.trackPlayers.get(this.activeTrackId);
      if (!trackPlayerData || !trackPlayerData.player) {
        this.log('warn', `未找到轨迹 ${this.activeTrackId} 的播放器`);
        return false;
      }
      
      // 获取轨迹播放器和数据
      const trackPlayer = trackPlayerData.player;
      
      // 更新播放配置
      if (config) {
        this.updateTrackPlayer(this.activeTrackId, config);
      } else {
        // 如果没有配置，确保应用保存的速度因子
        const speedFactor = this.trackSpeedFactors.get(this.activeTrackId) || 1.0;
        if (typeof trackPlayer.setSpeed === 'function') {
          const baseSpeed = this.options.playbackSpeed || 1.0;
          const adjustedSpeed = baseSpeed * speedFactor * 300; // 应用速度因子后再乘以300倍
          trackPlayer.setSpeed(adjustedSpeed);
        }
      }
      
      // 如果当前有其他轨迹正在播放，先暂停
      this.pauseAllExcept(this.activeTrackId);
      
      // 如果当前播放器不在地图上，则添加到地图
      if (this.mapInstance && !this.mapInstance.hasLayer(trackPlayer)) {
        trackPlayer.addTo(this.mapInstance);
      }
      
      // 设置轨迹数据并开始播放
      // trackPlayer.setData(trackData);
      trackPlayer.start();
      
      // 更新轨迹播放状态
      this.trackPlayStates.set(this.activeTrackId, TrackPlayState.PLAYING);
      
      this.log('debug', `开始播放轨迹: ${this.activeTrackId}`);
      return true;
    } catch (error) {
      this.log('error', '播放轨迹失败:', error);
      return false;
    }
  }
  
  /**
   * 暂停所有轨迹播放，除了指定的轨迹
   * @param exceptTrackId 不暂停的轨迹ID
   */
  private pauseAllExcept(exceptTrackId: string): void {
    for (const [trackId, trackPlayerData] of this.trackPlayers.entries()) {
      // 跳过指定的轨迹
      if (trackId === exceptTrackId) {
        continue;
      }
      
      const trackPlayer = trackPlayerData.player;
      if (trackPlayer && typeof trackPlayer.pause === 'function') {
        trackPlayer.pause();
        this.trackPlayStates.set(trackId, TrackPlayState.PAUSED);
      }
    }
  }
  
  /**
   * 暂停轨迹播放
   * @param trackId 轨迹ID，不指定则暂停当前活动轨迹
   * @returns 是否成功暂停
   */
  public pause(trackId?: string): boolean {
    try {
      const targetTrackId = trackId || this.activeTrackId;
      if (!targetTrackId) {
        this.log('warn', '暂停轨迹失败: 没有指定轨迹ID或活动轨迹');
        return false;
      }
      
      // 获取轨迹播放器
      const trackPlayerData = this.trackPlayers.get(targetTrackId);
      if (!trackPlayerData || !trackPlayerData.player) {
        this.log('warn', `暂停轨迹失败: 未找到轨迹 ${targetTrackId} 的播放器`);
        return false;
      }
      
      const trackPlayer = trackPlayerData.player;
      trackPlayer.pause();
      this.trackPlayStates.set(targetTrackId, TrackPlayState.PAUSED);
      
      this.log('debug', `轨迹 ${targetTrackId} 已暂停`);
      return true;
    } catch (error) {
      this.log('error', '暂停轨迹失败:', error);
      return false;
    }
  }
  
  /**
   * 停止轨迹播放
   * @param trackId 轨迹ID，不指定则停止当前活动轨迹
   * @returns 是否成功停止
   */
  public stop(trackId?: string): boolean {
    try {
      const targetTrackId = trackId || this.activeTrackId;
      if (!targetTrackId) {
        this.log('warn', '停止轨迹失败: 没有指定轨迹ID或活动轨迹');
        return false;
      }
      
      // 获取轨迹播放器
      const trackPlayerData = this.trackPlayers.get(targetTrackId);
      if (!trackPlayerData || !trackPlayerData.player) {
        this.log('warn', `停止轨迹失败: 未找到轨迹 ${targetTrackId} 的播放器`);
        return false;
      }
      
      const trackPlayer = trackPlayerData.player;
      trackPlayer.stop();
      this.trackPlayStates.set(targetTrackId, TrackPlayState.STOPPED);
      
      this.log('debug', `轨迹 ${targetTrackId} 已停止`);
      return true;
    } catch (error) {
      this.log('error', '停止轨迹失败:', error);
      return false;
    }
  }
  
  /**
   * 停止所有轨迹播放
   * @returns 是否成功停止
   */
  public stopAll(): boolean {
    try {
      for (const [trackId, trackPlayerData] of this.trackPlayers.entries()) {
        const trackPlayer = trackPlayerData.player;
        if (trackPlayer && typeof trackPlayer.stop === 'function') {
          trackPlayer.stop();
          this.trackPlayStates.set(trackId, TrackPlayState.STOPPED);
        }
      }
      
      this.log('debug', '所有轨迹已停止');
      return true;
    } catch (error) {
      this.log('error', '停止所有轨迹失败:', error);
      return false;
    }
  }
  
  /**
   * 清空轨迹数据
   */
  public clearTracks(): boolean {
    try {
      // 停止所有轨迹播放
      this.stopAll();
      
      // 移除所有轨迹播放器
      for (const [trackId, trackPlayerData] of this.trackPlayers.entries()) {
        const trackPlayer = trackPlayerData.player;
        if (trackPlayer && this.mapInstance) {
          if (this.mapInstance.hasLayer(trackPlayer)) {
            this.mapInstance.removeLayer(trackPlayer);
          }
          trackPlayer.clearData();
        }
      }
      
      // 清空数据
      this.trackPlayers.clear();
      this.tracks.clear();
      this.trackPlayStates.clear();
      this.trackProgressValues.clear();
      this.trackSpeedFactors.clear();
      this.trackSegmentSpeeds.clear();
      this.activeTrackId = null;
      this.selectedTrackId = null; // 重置选中的轨迹
      
      // 触发轨迹清空事件
      this.triggerEvent('track-clear', {
        message: '轨迹数据已清空'
      });
      
      this.log('debug', '轨迹数据已清空');
      return true;
    } catch (error) {
      this.log('error', '清空轨迹数据失败:', error);
      return false;
    }
  }
  
  /**
   * 设置轨迹进度
   * @param trackId 轨迹ID
   * @param progress 进度值 (0-1)
   */
  public setTrackProgress(trackId: string, progress: number): boolean {
    try {
      if (!this.trackplayerControl) {
        this.log('warn', '设置轨迹进度失败: 轨迹播放器未初始化');
        return false;
      }
      
      if (!this.tracks.has(trackId)) {
        this.log('warn', `设置轨迹进度失败: 未找到轨迹 ${trackId}`);
        return false;
      }
      
      // 确保进度值在有效范围内
      const validProgress = Math.max(0, Math.min(1, progress));
      
      // 设置轨迹播放器进度
      if (typeof this.trackplayerControl.setProgress === 'function') {
        this.trackplayerControl.setProgress(validProgress);
        this.trackProgressValues.set(trackId, validProgress);
        
        this.log('debug', `轨迹 ${trackId} 进度已设置为 ${validProgress}`);
        return true;
      } else {
        this.log('warn', '轨迹播放器不支持设置进度');
        return false;
      }
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 进度失败:`, error);
      return false;
    }
  }
  
  /**
   * 获取轨迹进度
   */
  public getProgress(): number {
    try {
      if (!this.trackplayerControl) {
        this.log('warn', '获取轨迹进度失败: 轨迹播放器未初始化');
        return 0;
      }
      
      if (typeof this.trackplayerControl.getProgress === 'function') {
        return this.trackplayerControl.getProgress();
      }
      
      return 0;
    } catch (error) {
      this.log('error', '获取轨迹进度失败:', error);
      return 0;
    }
  }
  
  /**
   * 获取开始时间
   */
  public getStartTime(): number {
    try {
      if (!this.trackplayerControl) {
        return 0;
      }
      
      if (typeof this.trackplayerControl.getStartTime === 'function') {
        return this.trackplayerControl.getStartTime();
      }
      
      if (this.activeTrackId) {
        const track = this.tracks.get(this.activeTrackId);
        if (track && track.points.length > 0) {
          const point = track.points[0] as unknown as LeafletTrackPoint;
          return point.timestamp;
        }
      }
      
      return 0;
    } catch (error) {
      this.log('error', '获取开始时间失败:', error);
      return 0;
    }
  }
  
  /**
   * 获取结束时间
   */
  public getEndTime(): number {
    try {
      if (!this.trackplayerControl) {
        return 0;
      }
      
      if (typeof this.trackplayerControl.getEndTime === 'function') {
        return this.trackplayerControl.getEndTime();
      }
      
      if (this.activeTrackId) {
        const track = this.tracks.get(this.activeTrackId);
        if (track && track.points.length > 0) {
          const point = track.points[track.points.length - 1] as unknown as LeafletTrackPoint;
          return point.timestamp;
        }
      }
      
      return 0;
    } catch (error) {
      this.log('error', '获取结束时间失败:', error);
      return 0;
    }
  }
  
  /**
   * 获取当前时间
   */
  public getCurrentTime(): number {
    try {
      if (!this.trackplayerControl) {
        return 0;
      }
      
      if (typeof this.trackplayerControl.getCurrentTime === 'function') {
        return this.trackplayerControl.getCurrentTime();
      }
      
      return 0;
    } catch (error) {
      this.log('error', '获取当前时间失败:', error);
      return 0;
    }
  }
  
  /**
   * 触发事件
   * @param eventName 事件名称
   * @param payload 事件数据
   */
  private triggerEvent(eventName: string, payload: any): void {
    if (this.eventHandler && typeof this.eventHandler === 'function') {
      this.eventHandler(eventName, payload);
    }
  }
  
  /**
   * 销毁轨迹播放器
   */
  public destroy(): void {
    try {
      // 停止所有轨迹播放
      this.stopAll();
      
      // 移除所有轨迹播放器
      for (const [trackId, trackPlayerData] of this.trackPlayers.entries()) {
        const trackPlayer = trackPlayerData.player;
        if (trackPlayer && this.mapInstance) {
          if (this.mapInstance.hasLayer(trackPlayer)) {
            this.mapInstance.removeLayer(trackPlayer);
          }
        }
      }
      
      // 移除主轨迹播放器控件
      if (this.trackplayerControl && this.mapInstance) {
        this.mapInstance.removeControl(this.trackplayerControl);
        this.trackplayerControl = null;
      }
      
      // 移除轨迹图层
      if (this.trackLayer && this.mapInstance) {
        this.trackLayer.remove();
        this.trackLayer = null;
      }

      // 还原原始的closePopup方法
      if (this.mapInstance && (this.mapInstance as any)._originalClosePopup) {
        // @ts-ignore
        this.mapInstance.closePopup = this.mapInstance._originalClosePopup;
        // @ts-ignore
        delete this.mapInstance._originalClosePopup;
      }
      
      // 清空数据
      this.trackPlayers.clear();
      this.tracks.clear();
      this.trackPlayStates.clear();
      this.trackProgressValues.clear();
      this.trackSpeedFactors.clear();
      this.trackSegmentSpeeds.clear();
      this.activeTrackId = null;
      this.selectedTrackId = null; // 重置选中的轨迹
      
      this.log('debug', 'Leaflet轨迹播放器已销毁');
    } catch (error) {
      this.log('error', '销毁Leaflet轨迹播放器失败:', error);
    }
  }

  /**
   * 取消激活轨迹播放器
   * @returns 是否成功
   */
  public deactivate(): boolean {
    try {
      // 停止所有轨迹播放
      this.stopAll();

      // 清空选中的轨迹
      if (this.selectedTrackId) {
        const previousSelectedId = this.selectedTrackId;
        this.selectedTrackId = null;

        // 隐藏所有静态点位
        if (previousSelectedId) {
          this.hideTrackNodes(previousSelectedId);
        }

        // 触发轨迹取消选中事件
        this.triggerEvent('track-deselect', { trackId: previousSelectedId });
      }

      // 清空激活的轨迹
      this.activeTrackId = null;

      // 隐藏所有轨迹
      this.tracks.forEach((_, trackId) => {
        this.hideTrack(trackId);
      });

      this.log('debug', '轨迹播放器已取消激活');
      return true;
    } catch (error) {
      this.log('error', '取消激活轨迹播放器失败:', error);
      return false;
    }
  }
  
  /**
   * 更新轨迹播放器配置
   * @param trackId 轨迹ID
   * @param config 播放器配置
   * @returns 是否成功更新
   */
  public updateTrackPlayer(trackId: string, config: any): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `更新轨迹播放器配置失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }
      
      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;
      
      if (!trackPlayer) {
        this.log('warn', `更新轨迹播放器配置失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }
      
      // 更新循环播放设置
      if (config.loop !== undefined && typeof trackPlayer.setLoop === 'function') {
        trackPlayer.setLoop(config.loop);
      }
      
      // 更新相机跟随设置
      if (config.withCamera !== undefined && typeof trackPlayer.setPanTo === 'function') {
        trackPlayer.setPanTo(config.withCamera);
      }
      
      // 更新速度因子
      if (config.speedFactor !== undefined) {
        // 保存新的速度因子
        this.trackSpeedFactors.set(trackId, config.speedFactor);

        // 更新播放速度 - 基础速度 * 速度因子 * 300
        if (typeof trackPlayer.setSpeed === 'function') {
          const baseSpeed = this.options.playbackSpeed || 1.0;
          const adjustedSpeed = baseSpeed * config.speedFactor * 300;
          trackPlayer.setSpeed(adjustedSpeed);
          this.log('debug', `轨迹 ${trackId} 速度已更新为 ${adjustedSpeed} (倍数: ${config.speedFactor}x * 300)`);
        }
      }
      // 直接更新速度（不影响速度因子）
      else if (config.speed !== undefined && typeof trackPlayer.setSpeed === 'function') {
        // 直接应用速度并乘以300
        trackPlayer.setSpeed(config.speed * 300);
      }
      
      this.log('debug', `轨迹 ${trackId} 播放器配置已更新`);
      return true;
    } catch (error) {
      this.log('error', `更新轨迹 ${trackId} 播放器配置失败:`, error);
      return false;
    }
  }
  
  /**
   * 计算两点间的距离(米)
   * @param point1 点1
   * @param point2 点2
   * @returns 距离(米)
   */
  private calculateDistance(point1: LeafletTrackPoint, point2: LeafletTrackPoint): number {
    try {
      const lat1 = point1.latitude * Math.PI / 180;
      const lat2 = point2.latitude * Math.PI / 180;
      const lon1 = point1.longitude * Math.PI / 180;
      const lon2 = point2.longitude * Math.PI / 180;
      
      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;
      
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = this.EARTH_RADIUS * c;
      
      return distance;
    } catch (error) {
      this.log('error', '计算距离失败:', error);
      return 0;
    }
  }
  
  /**
   * 计算轨迹段速度
   * @param track 轨迹数据
   * @returns 轨迹段速度数组
   */
  private calculateSegmentSpeeds(track: Track): TrackSegmentSpeed[] {
    try {
      const segmentSpeeds: TrackSegmentSpeed[] = [];
      const points = track.points;
      
      if (!points || points.length < 2) {
        return segmentSpeeds;
      }
      
      // 遍历相邻的点
      for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i] as unknown as LeafletTrackPoint;
        const endPoint = points[i + 1] as unknown as LeafletTrackPoint;
        
        // 如果时间戳相同，则跳过
        if (startPoint.timestamp === endPoint.timestamp) {
          continue;
        }
        
        // 计算距离(米)
        const distance = this.calculateDistance(startPoint, endPoint);
        
        // 计算时间差(秒)
        const timeDiff = (endPoint.timestamp - startPoint.timestamp) / 1000;
        
        // 计算速度(km/h) = 距离(米) / 时间(秒) * 3.6
        const speed = timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0;
        
        segmentSpeeds.push({
          startIndex: i,
          endIndex: i + 1,
          startTime: startPoint.timestamp,
          endTime: endPoint.timestamp,
          distance: distance,
          speed: speed
        });
      }
      
      return segmentSpeeds;
    } catch (error) {
      this.log('error', '计算轨迹段速度失败:', error);
      return [];
    }
  }
  
  /**
   * 根据时间对轨迹点进行排序
   * @param track 轨迹数据
   * @returns 排序后的轨迹
   */
  private sortTrackPointsByTime(track: Track): Track {
    try {
      if (!track.points || track.points.length < 2) {
        return track;
      }
      
      const sortedPoints = [...track.points].sort((a, b) => {
        const aTime = (a as unknown as LeafletTrackPoint).timestamp;
        const bTime = (b as unknown as LeafletTrackPoint).timestamp;
        return aTime - bTime;
      });
      
      return {
        ...track,
        points: sortedPoints
      };
    } catch (error) {
      this.log('error', '对轨迹点进行排序失败:', error);
      return track;
    }
  }
  
  /**
   * 获取轨迹段速度
   * @param trackId 轨迹ID
   * @returns 轨迹段速度数组
   */
  public getTrackSegmentSpeeds(trackId: string): TrackSegmentSpeed[] | null {
    if (!this.trackSegmentSpeeds.has(trackId)) {
      return null;
    }
    
    return this.trackSegmentSpeeds.get(trackId) || null;
  }
  
  /**
   * 获取轨迹平均速度
   * @param trackId 轨迹ID
   * @returns 平均速度(km/h)
   */
  public getTrackAverageSpeed(trackId: string): number {
    const segmentSpeeds = this.getTrackSegmentSpeeds(trackId);
    if (!segmentSpeeds) {
      return 0;
    }
    
    return this.calculateAverageSpeed(segmentSpeeds);
  }
  
  /**
   * 移除轨迹
   * @param trackId 轨迹ID
   * @returns 是否成功移除
   */
  public removeTrack(trackId: string): boolean {
    try {
      if (!this.tracks.has(trackId)) {
        this.log('warn', `移除轨迹失败: 未找到轨迹 ${trackId}`);
        return false;
      }
      
      // 如果正在播放，先停止
      if (this.trackPlayStates.get(trackId) === TrackPlayState.PLAYING) {
        this.stop(trackId);
      }
      
      // 移除轨迹播放器和相关图层
      const trackPlayerData = this.trackPlayers.get(trackId);
      if (trackPlayerData && trackPlayerData.player) {
        // 先隐藏静态点位
        this.hideTrackNodes(trackId);

        // 从地图上移除轨迹播放器
        if (this.mapInstance && this.mapInstance.hasLayer(trackPlayerData.player)) {
          this.mapInstance.removeLayer(trackPlayerData.player);
        }

        // 如果轨迹播放器有节点图层，确保从地图移除
        if (trackPlayerData.player.nodeLayer && this.mapInstance) {
          trackPlayerData.player.nodeLayer.remove();
        }

        // 如果还有其他轨迹相关图层，也需要清理
        if (trackPlayerData.player.trackPolyline && this.mapInstance) {
          this.mapInstance.removeLayer(trackPlayerData.player.trackPolyline);
        }

        // 如果有任何其他自定义图层，确保清理
        if (trackPlayerData.player.marker && this.mapInstance) {
          this.mapInstance.removeLayer(trackPlayerData.player.marker);
        }
      }
      
      // 移除数据
      this.trackPlayers.delete(trackId);
      this.tracks.delete(trackId);
      this.trackPlayStates.delete(trackId);
      this.trackProgressValues.delete(trackId);
      this.trackSpeedFactors.delete(trackId);
      this.trackSegmentSpeeds.delete(trackId);
      
      // 如果移除的是当前活动的轨迹，重置活动轨迹
      if (this.activeTrackId === trackId) {
        this.activeTrackId = null;
      }
      
      // 如果移除的是当前选中的轨迹，重置选中轨迹
      if (this.selectedTrackId === trackId) {
        this.selectedTrackId = null;
        // 触发轨迹取消选中事件
        this.triggerEvent('track-deselect', { trackId });
      }
      
      // 触发轨迹移除事件
      this.triggerEvent('track-remove', { trackId });
      
      this.log('debug', `轨迹 ${trackId} 及相关图层已彻底从地图移除`);
      return true;
    } catch (error) {
      this.log('error', `移除轨迹 ${trackId} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 绑定轨迹播放器列表事件
   * @param trackPlayersListElement 轨迹播放器列表DOM元素
   */
  public bindTrackPlayersList(trackPlayersListElement: HTMLElement): void {
    if (!trackPlayersListElement) {
      this.log('warn', '绑定轨迹播放器列表事件失败: 无效的DOM元素');
      return;
    }
    
    try {
      // 为列表元素添加点击事件委托
      trackPlayersListElement.addEventListener('click', (event) => {
        // 获取被点击的元素
        const clickedElement = event.target as HTMLElement;
        
        // 查找最近的轨迹项元素（通常是有data-track-id属性的li或div元素）
        const trackItemElement = clickedElement.closest('[data-track-id]');
        
        if (trackItemElement) {
          // 获取轨迹ID
          const trackId = trackItemElement.getAttribute('data-track-id');
          
          if (trackId) {
            // 选中轨迹
            this.selectTrack(trackId);
          }
        }
      });
      
      this.log('debug', '轨迹播放器列表事件已绑定');
    } catch (error) {
      this.log('error', '绑定轨迹播放器列表事件失败:', error);
    }
  }
  
  /**
   * 获取所有轨迹作为数组，用于显示在列表中
   * @returns 轨迹数组
   */
  public getTracksArray(): Array<{ id: string; track: Track; selected: boolean; trackNameWithLength: string }> {
    const tracksArray: Array<{ id: string; track: Track; selected: boolean; trackNameWithLength: string }> = [];
    
    this.tracks.forEach((track, id) => {
      // 计算轨迹总长度（公里）
      let totalDistance = 0;
      const points = track.points;
      if (points && points.length > 1) {
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i] as any;
          const p2 = points[i + 1] as any;
          totalDistance += this.calculateDistance(
            { latitude: p1.lat || p1.latitude, longitude: p1.lng || p1.longitude, timestamp: p1.time || p1.timestamp },
            { latitude: p2.lat || p2.latitude, longitude: p2.lng || p2.longitude, timestamp: p2.time || p2.timestamp }
          );
        }
      }
      const km = (totalDistance / 1000).toFixed(2);
      const name = track.options?.name || id;
      const trackNameWithLength = `${name}（全长${km}公里）`;
      tracksArray.push({
        id,
        track,
        selected: id === this.selectedTrackId,
        trackNameWithLength
      });
    });
    
    return tracksArray;
  }
  
  /**
   * 获取所有轨迹数据
   * @returns 轨迹数据Map
   */
  public getAllTracks(): Map<string, Track> {
    return this.tracks;
  }
  
  /**
   * 切换轨迹选中状态
   * @param trackId 轨迹ID
   * @returns 是否成功切换
   */
  public toggleTrackSelection(trackId: string): boolean {
    // 如果当前已选中该轨迹，则取消选中
    if (this.selectedTrackId === trackId) {
      this.selectedTrackId = null;
      
      // 触发轨迹取消选中事件
      this.triggerEvent('track-deselect', { trackId });
      
      this.log('debug', `轨迹 ${trackId} 已取消选中`);
      return true;
    }
    
    // 否则选中该轨迹
    return this.selectTrack(trackId);
  }

  /**
   * 获取轨迹当前速度
   * @param trackId 轨迹ID
   * @returns 当前速度(km/h)或null
   */
  public getCurrentSpeed(trackId: string): number | null {
    try {
      // 获取轨迹播放器数据
      const trackPlayerData = this.trackPlayers.get(trackId);
      if (!trackPlayerData || !trackPlayerData.player) {
        return null;
      }

      // 获取当前位置索引
      const currentIndex = trackPlayerData.player._currentIndex;
      if (currentIndex === undefined || currentIndex < 0) {
        return 0;
      }

      // 获取轨迹数据
      const trackData = trackPlayerData.data;
      if (!trackData || !trackData.positions || currentIndex >= trackData.positions.length - 1) {
        return 0;
      }

      // 获取当前点和下一个点 - 这里的points已经是标准化格式，有lat/lng/time属性
      const currentPoint = trackData.positions[currentIndex];
      const nextPoint = trackData.positions[currentIndex + 1];

      // 计算两点间的距离(米)
      const distance = this.calculateDistance(
        { latitude: currentPoint.lat, longitude: currentPoint.lng, timestamp: currentPoint.time },
        { latitude: nextPoint.lat, longitude: nextPoint.lng, timestamp: nextPoint.time }
      );

      // 计算时间差(秒)
      const timeDiff = (nextPoint.time - currentPoint.time);

      // 计算实际速度(km/h) = 距离(米) / 时间(秒) * 3.6
      const realSpeed = timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0;

      return realSpeed;
    } catch (error) {
      this.log('error', '获取轨迹当前速度失败:', error);
      return 0;
    }
  }

  /**
   * 获取轨迹播放状态
   * @param trackId 轨迹ID
   * @returns 播放状态
   */
  public getTrackPlayState(trackId: string): 'playing' | 'paused' | 'stopped' | null {
    if (!this.trackPlayStates.has(trackId)) {
      return null;
    }

    const state = this.trackPlayStates.get(trackId);
    if (state === TrackPlayState.PLAYING) return 'playing';
    if (state === TrackPlayState.PAUSED) return 'paused';
    return 'stopped';
  }

  /**
   * 获取轨迹当前进度
   * @param trackId 轨迹ID
   * @returns 当前进度(0-1)或null
   */
  public getTrackProgress(trackId: string): number | null {
    try {
      // 获取轨迹播放器数据
      const trackPlayerData = this.trackPlayers.get(trackId);
      if (!trackPlayerData || !trackPlayerData.player) {
        return null;
      }

      // 获取当前进度
      if (typeof trackPlayerData.player.getProgress === 'function') {
        return trackPlayerData.player.getProgress();
      }

      return null;
    } catch (error) {
      this.log('error', '获取轨迹当前进度失败:', error);
      return null;
    }
  }

  /**
   * 获取地图实例
   * @returns 地图实例
   */
  public getMapInstance(): L.Map | null {
    return this.mapInstance;
  }

  /**
   * 显示轨迹
   * @param trackId 轨迹ID
   * @returns 是否成功显示
   */
  public showTrack(trackId: string): boolean {
    try {
      if (!this.mapInstance) {
        this.log('warn', '显示轨迹失败: 地图实例未设置');
        return false;
      }

      if (!this.tracks.has(trackId)) {
        this.log('warn', `显示轨迹失败: 未找到轨迹 ${trackId}`);
        return false;
      }

      // 获取轨迹播放器
      const trackPlayerData = this.trackPlayers.get(trackId);
      if (!trackPlayerData || !trackPlayerData.player) {
        this.log('warn', `显示轨迹失败: 未找到轨迹 ${trackId} 的播放器`);
        // 尝试重新创建播放器
        const track = this.tracks.get(trackId);
        if (track) {
          this.createTrackPlayer(trackId, track);
          this.log('debug', `已为轨迹 ${trackId} 重新创建播放器`);

          // 再次获取播放器
          const newTrackPlayerData = this.trackPlayers.get(trackId);
          if (!newTrackPlayerData || !newTrackPlayerData.player) {
            this.log('warn', `创建播放器后仍无法显示轨迹 ${trackId}`);
            return false;
          }

          // 使用新创建的播放器继续处理
          const trackPlayer = newTrackPlayerData.player;

          // 添加到地图
          trackPlayer.addTo(this.mapInstance);

          // 设置轨迹数据
          if (newTrackPlayerData.data) {
            trackPlayer.setData(newTrackPlayerData.data);
          }

          // 将选中的轨迹ID保存
          this.selectedTrackId = trackId;

          // 触发选中事件
          this.triggerEvent('track-select', { trackId, track });

          // 如果选中了轨迹，显示静态点位
          this.showTrackNodes(trackId);

          this.log('debug', `轨迹 ${trackId} 已重新创建并显示`);
          return true;
        }

        return false;
      }

      const trackPlayer = trackPlayerData.player;

      // 如果轨迹不在地图上，添加到地图
      if (!this.mapInstance.hasLayer(trackPlayer)) {
        trackPlayer.addTo(this.mapInstance);
        this.log('debug', `轨迹 ${trackId} 已添加到地图`);
      }

      // 确保轨迹可见
      if (trackPlayer._container) {
        trackPlayer._container.style.display = 'block';
      }

      // 如果有绘制轨迹的元素，确保它们可见
      if (trackPlayer.trackPolyline) {
        trackPlayer.trackPolyline.setStyle({ opacity: 1, weight: 3 });
      }

      // 尝试将轨迹添加到地图上
      if (trackPlayer.addTo && typeof trackPlayer.addTo === 'function') {
        trackPlayer.addTo(this.mapInstance);
      }

      // 如果之前有选中的轨迹，先隐藏其静态点位
      if (this.selectedTrackId && this.selectedTrackId !== trackId) {
        this.hideTrackNodes(this.selectedTrackId);
      }

      // 将选中的轨迹ID保存
      this.selectedTrackId = trackId;

      // 如果选中了轨迹，显示静态点位
      this.showTrackNodes(trackId);

      // 触发选中事件
      this.triggerEvent('track-select', { trackId, track: this.tracks.get(trackId) });

      this.log('debug', `轨迹 ${trackId} 已显示`);
      return true;
    } catch (error) {
      this.log('error', `显示轨迹 ${trackId} 失败:`, error);
      return false;
    }
  }

  /**
   * 隐藏轨迹
   * @param trackId 轨迹ID
   * @returns 是否成功隐藏
   */
  public hideTrack(trackId: string): boolean {
    try {
      if (!this.tracks.has(trackId)) {
        this.log('warn', `隐藏轨迹失败: 未找到轨迹 ${trackId}`);
        return false;
      }

      // 获取轨迹播放器
      const trackPlayerData = this.trackPlayers.get(trackId);
      if (!trackPlayerData || !trackPlayerData.player) {
        this.log('warn', `隐藏轨迹失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayer = trackPlayerData.player;

      // 如果轨迹在地图上，从地图移除
      if (this.mapInstance && this.mapInstance.hasLayer(trackPlayer)) {
        this.mapInstance.removeLayer(trackPlayer);
      }

      // 隐藏静态点位
      this.hideTrackNodes(trackId);

      // 如果当前隐藏的是选中的轨迹，清除选中状态
      if (this.selectedTrackId === trackId) {
        this.selectedTrackId = null;
      }

      this.log('debug', `轨迹 ${trackId} 已隐藏`);
      return true;
    } catch (error) {
      this.log('error', `隐藏轨迹 ${trackId} 失败:`, error);
      return false;
    }
  }

  /**
   * 设置轨迹播放器
   * @param trackId 轨迹ID
   * @param config 播放器配置
   * @returns 是否成功设置
   */
  public setTrackPlayer(trackId: string, config: any): boolean {
    return this.updateTrackPlayer(trackId, config);
  }

  /**
   * 设置轨迹速度因子
   * @param trackId 轨迹ID
   * @param factor 速度因子
   * @returns 是否成功设置
   */
  public setTrackSpeedFactor(trackId: string, factor: number): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `设置轨迹速度因子失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      // 保存速度因子
      this.trackSpeedFactors.set(trackId, factor);

      // 立即应用到播放器
      return this.updateTrackSpeed(trackId, factor);
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 速度因子失败:`, error);
      return false;
    }
  }

  /**
   * 更新轨迹速度
   * @param trackId 轨迹ID
   * @param factor 速度因子
   * @returns 是否成功更新
   */
  public updateTrackSpeed(trackId: string, factor: number): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `更新轨迹速度失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `更新轨迹速度失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 保存新的速度因子
      this.trackSpeedFactors.set(trackId, factor);

      // 更新播放速度 - 基础速度 * 速度因子 * 300
      if (typeof trackPlayer.setSpeed === 'function') {
        const baseSpeed = this.options.playbackSpeed || 1.0;
        const adjustedSpeed = baseSpeed * factor * 300;
        trackPlayer.setSpeed(adjustedSpeed);
        this.log('debug', `轨迹 ${trackId} 速度已更新为 ${adjustedSpeed} (倍数: ${factor}x * 300)`);
        return true;
      }

      return false;
    } catch (error) {
      this.log('error', `更新轨迹 ${trackId} 速度失败:`, error);
      return false;
    }
  }

  /**
   * 设置轨迹节点可见性
   * @param trackId 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功设置
   */
  public setTrackNodesVisible(trackId: string, visible: boolean): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `设置轨迹节点可见性失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `设置轨迹节点可见性失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 如果轨迹播放器支持设置节点可见性
      if (typeof trackPlayer.setNodesVisible === 'function') {
        trackPlayer.setNodesVisible(visible);
        this.log('debug', `轨迹 ${trackId} 节点可见性已设置为 ${visible}`);
        return true;
      }

      // 如果不支持直接设置，但有节点图层
      if (trackPlayer.nodeLayer) {
        if (visible) {
          trackPlayer.nodeLayer.addTo(this.mapInstance);
        } else {
          trackPlayer.nodeLayer.remove();
        }
        this.log('debug', `轨迹 ${trackId} 节点可见性已设置为 ${visible} (通过图层控制)`);
        return true;
      }

      return true;
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 节点可见性失败:`, error);
      return false;
    }
  }

  /**
   * 设置轨迹节点锚点可见性
   * @param trackId 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功设置
   */
  public setTrackNodeAnchorsVisible(trackId: string, visible: boolean): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `设置轨迹节点锚点可见性失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `设置轨迹节点锚点可见性失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 如果轨迹播放器支持设置节点锚点可见性
      if (typeof trackPlayer.setNodeAnchorsVisible === 'function') {
        trackPlayer.setNodeAnchorsVisible(visible);
        this.log('debug', `轨迹 ${trackId} 节点锚点可见性已设置为 ${visible}`);
        return true;
      }

      return true;
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 节点锚点可见性失败:`, error);
      return false;
    }
  }

  /**
   * 设置轨迹节点弹窗可见性
   * @param trackId 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功设置
   */
  public setTrackNodePopoversVisible(trackId: string, visible: boolean): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `设置轨迹节点弹窗可见性失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `设置轨迹节点弹窗可见性失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 如果轨迹播放器支持设置节点弹窗可见性
      if (typeof trackPlayer.setNodePopoversVisible === 'function') {
        trackPlayer.setNodePopoversVisible(visible);
        this.log('debug', `轨迹 ${trackId} 节点弹窗可见性已设置为 ${visible}`);
        return true;
      }

      // 如果有节点图层和节点列表
      if (trackPlayer.nodeLayer && trackPlayer.nodes) {
        // 添加高亮节点标题的样式
        this.addTrackNodeHighlightedStyles();

        // 遍历所有节点，设置弹窗
        trackPlayer.nodes.forEach((node: any) => {
          if (node && node.marker) {
            // 获取或创建popup
            if (!node.marker.getPopup()) {
              // 获取节点基本信息
              const nodeName = node.name || node.title || `路径点 ${node.index || ''}`;

              // 创建高亮样式的popup内容
              const popupContent = `
                <div class="track-node-popup">
                  <div class="track-node-title ">${nodeName}</div>
                  <div class="track-node-time">${this.formatTime(node.position.time)}</div>
                  ${node.position.properties && node.position.properties.speed ?
                  `<div class="track-node-speed">速度: ${node.position.properties.speed.toFixed(1)} km/h</div>` : ''}
                </div>
              `;

              // 绑定popup，设置不显示关闭按钮
              node.marker.bindPopup(popupContent, {
                closeButton: false,
                className: 'track-marker-popup-container',
                autoClose: false,
                closeOnClick: false
              });
            }

            if (visible) {
              // 自动打开弹窗显示详细信息
              node.marker.openPopup();
            } else {
              // 关闭弹窗
              node.marker.closePopup();
            }
          }
        });

        this.log('debug', `轨迹 ${trackId} 节点弹窗可见性已设置为 ${visible} (通过节点操作)`);
        return true;
      }

      return true;
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 节点弹窗可见性失败:`, error);
      return false;
    }
  }

  /**
   * 添加高亮节点标题的样式
   */
  private addTrackNodeHighlightedStyles(): void {
    // 如果已经添加过高亮样式，不再重复添加
    if (document.getElementById('track-node-highlighted-styles')) {
      return;
    }

    // 创建样式元素
    const style = document.createElement('style');
    style.id = 'track-node-highlighted-styles';
    style.innerHTML = `
      . {
        background-color: #1890ff;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        margin: -8px -8px 8px -8px;
        text-align: center;
        font-weight: bold;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
    `;

    // 添加到文档头部
    document.head.appendChild(style);
  }

  /**
   * 设置轨迹节点时间可见性
   * @param trackId 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功设置
   */
  public setTrackNodeTimeVisible(trackId: string, visible: boolean): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `设置轨迹节点时间可见性失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `设置轨迹节点时间可见性失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 如果轨迹播放器支持设置节点时间可见性
      if (typeof trackPlayer.setNodeTimeVisible === 'function') {
        trackPlayer.setNodeTimeVisible(visible);
        this.log('debug', `轨迹 ${trackId} 节点时间可见性已设置为 ${visible}`);
        return true;
      }

      return true;
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 节点时间可见性失败:`, error);
      return false;
    }
  }

  /**
   * 设置轨迹速度弹窗可见性
   * @param trackId 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功设置
   */
  public setTrackSpeedPopoversVisible(trackId: string, visible: boolean): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `设置轨迹速度弹窗可见性失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `设置轨迹速度弹窗可见性失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 如果轨迹播放器支持设置速度弹窗可见性
      if (typeof trackPlayer.setSpeedPopoversVisible === 'function') {
        trackPlayer.setSpeedPopoversVisible(visible);
        this.log('debug', `轨迹 ${trackId} 速度弹窗可见性已设置为 ${visible}`);
        return true;
      }

      // 如果有移动标记，设置是否显示速度弹窗
      if (trackPlayer.marker) {
        // 直接设置标志位，progress事件会使用这个标志决定是否显示速度信息
        trackPlayer._speedPopoverVisible = visible;

        // 添加样式
        this.addMovingPointStyles();
        this.addTrackNodeHighlightedStyles();

        // 获取轨迹名称和当前速度
        const track = this.tracks.get(trackId);
        const trackName = track?.options?.name || trackId;
        const currentSpeed = this.getCurrentSpeed(trackId);

        if (visible && currentSpeed !== null) {
          // 获取速度因子
          const speedFactor = this.trackSpeedFactors.get(trackId) || 1.0;
          const displaySpeed = currentSpeed * speedFactor;

          // 创建包含速度信息的popup内容
          let popupContent = `<div class="track-marker-popup">`;

          // 如果同时要显示名称，添加名称部分
          if (trackPlayer._showMovingPointName) {
            popupContent += `<div class="track-node-title ">${trackName}</div>`;
          }

          // 添加速度信息
          popupContent += `
            <div class="track-marker-speed">当前速度: ${displaySpeed.toFixed(1)} km/h</div>
            ${speedFactor !== 1.0 ? `<div class="track-marker-real-speed">实际速度: ${currentSpeed.toFixed(1)} km/h</div>` : ''}
          `;

          popupContent += `</div>`;

          // 检查是否已有popup
          const existingPopup = trackPlayer.marker.getPopup();
          if (existingPopup) {
            // 更新现有popup的内容
            existingPopup.setContent(popupContent);
          } else {
            // 创建新的popup，增加防止点击关闭
            trackPlayer.marker.bindPopup(popupContent, {
              className: 'track-marker-popup-container',
              closeButton: false,
              autoClose: false,
              closeOnClick: false,
              offset: [0, -5],
              interactive: true
            });
            
            // 确保有点击事件处理器
            if (!trackPlayer.marker._hasClickHandler) {
              trackPlayer.marker.on('click', function(e: L.LeafletMouseEvent) {
                // 阻止事件冒泡，防止触发地图点击
                L.DomEvent.stopPropagation(e);
                // 阻止默认行为
                L.DomEvent.preventDefault(e);
                
                // 确保popup保持打开状态
                if (!this.isPopupOpen() && this.getPopup()) {
                  this.openPopup();
                }
              });
              
              // 标记已添加点击处理
              trackPlayer.marker._hasClickHandler = true;
            }
          }

          // 打开popup
          trackPlayer.marker.openPopup();
        } else if (!visible) {
          // 如果禁用，但同时需要显示名称
          if (trackPlayer._showMovingPointName && trackPlayer.marker.getPopup()) {
            // 更新popup内容，只保留名称部分
            const popupContent = `
              <div class="track-marker-popup">
                <div class="track-node-title ">${trackName}</div>
              </div>
            `;
            trackPlayer.marker.getPopup().setContent(popupContent);
          } else if (trackPlayer.marker.getPopup()) {
            // 如果不显示名称，关闭popup
            trackPlayer.marker.closePopup();
          }
        }

        this.log('debug', `轨迹 ${trackId} 速度弹窗可见性已设置为 ${visible} (通过popup显示)`);
        return true;
      }

      return true;
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 速度弹窗可见性失败:`, error);
      return false;
    }
  }

  /**
   * 设置轨迹节点速度可见性
   * @param trackId 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功设置
   */
  public setTrackNodeSpeedsVisible(trackId: string, visible: boolean): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `设置轨迹节点速度可见性失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `设置轨迹节点速度可见性失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 如果轨迹播放器支持设置节点速度可见性
      if (typeof trackPlayer.setNodeSpeedsVisible === 'function') {
        trackPlayer.setNodeSpeedsVisible(visible);
        this.log('debug', `轨迹 ${trackId} 节点速度可见性已设置为 ${visible}`);
        return true;
      }

      return true;
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 节点速度可见性失败:`, error);
      return false;
    }
  }

  /**
   * 设置轨迹节点距离可见性
   * @param trackId 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功设置
   */
  public setTrackNodeDistanceVisible(trackId: string, visible: boolean): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `设置轨迹节点距离可见性失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `设置轨迹节点距离可见性失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 如果轨迹播放器支持设置节点距离可见性
      if (typeof trackPlayer.setNodeDistanceVisible === 'function') {
        trackPlayer.setNodeDistanceVisible(visible);
        this.log('debug', `轨迹 ${trackId} 节点距离可见性已设置为 ${visible}`);
        return true;
      }

      return true;
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 节点距离可见性失败:`, error);
      return false;
    }
  }

  /**
   * 设置移动点位名称可见性
   * @param trackId 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功设置
   */
  public setMovingPointNameVisible(trackId: string, visible: boolean): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `设置移动点位名称可见性失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `设置移动点位名称可见性失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 获取轨迹数据
      const track = this.tracks.get(trackId);
      if (!track) {
        this.log('warn', `设置移动点位名称可见性失败: 未找到轨迹 ${trackId} 的数据`);
        return false;
      }

      // 如果轨迹播放器支持设置移动点位名称可见性
      if (typeof trackPlayer.setMovingPointNameVisible === 'function') {
        trackPlayer.setMovingPointNameVisible(visible);
        this.log('debug', `轨迹 ${trackId} 移动点位名称可见性已设置为 ${visible}`);
        return true;
      }

      // 如果有移动标记，设置是否显示名称
      if (trackPlayer.marker) {
        // 获取轨迹名称
        const trackName = track.options?.name || trackId;

        // 添加高亮节点标题的样式
        this.addTrackNodeHighlightedStyles();
        this.addMovingPointStyles();

        // 为移动标记添加或更新弹窗
        if (visible) {
          // 创建基本弹窗内容，只显示名称
          const popupContent = `
            <div class="track-marker-popup">
              <div class="track-node-title ">${trackName}</div>
            </div>
          `;

          // 检查是否已有popup
          const existingPopup = trackPlayer.marker.getPopup();
          if (existingPopup) {
            // 如果已有popup，只更新标题部分
            const content = existingPopup.getContent();
            if (typeof content === 'string' && content.includes('track-node-title')) {
              // 更新标题
              const newContent = content.replace(
                /<div class="track-node-title.*?">.*?<\/div>/,
                `<div class="track-node-title ">${trackName}</div>`
              );
              existingPopup.setContent(newContent);
            } else {
              // 设置新内容
              existingPopup.setContent(popupContent);
            }

            // 打开popup
            trackPlayer.marker.openPopup();
          } else {
            // 创建新的popup，并设置防止点击关闭
            trackPlayer.marker.bindPopup(popupContent, {
              closeButton: false,
              autoClose: false,
              closeOnClick: false,
              className: 'track-marker-popup-container',
              offset: [0, -15],
              interactive: true
            });
            
            // 确保有点击事件处理器
            if (!trackPlayer.marker._hasClickHandler) {
              trackPlayer.marker.on('click', function(e: L.LeafletMouseEvent) {
                // 阻止事件冒泡，防止触发地图点击
                L.DomEvent.stopPropagation(e);
                // 阻止默认行为
                L.DomEvent.preventDefault(e);
                
                // 确保popup保持打开状态
                if (!this.isPopupOpen() && this.getPopup()) {
                  this.openPopup();
                }
              });
              
              // 标记已添加点击处理
              trackPlayer.marker._hasClickHandler = true;
            }

            // 打开popup
            trackPlayer.marker.openPopup();
          }

          // 保存显示状态
          trackPlayer._showMovingPointName = true;
        } else {
          // 如果要隐藏，但同时要显示速度信息，则不关闭popup而只更新内容
          if (trackPlayer._speedPopoverVisible && trackPlayer.marker.getPopup()) {
            // 获取当前速度信息
            const currentSpeed = this.getCurrentSpeed(trackId);
            if (currentSpeed !== null) {
              const speedFactor = this.trackSpeedFactors.get(trackId) || 1.0;
              const displaySpeed = currentSpeed * speedFactor;

              // 创建只有速度信息的popup内容
              const speedPopupContent = `
                <div class="track-marker-popup">
                  <div class="track-marker-speed">当前速度: ${displaySpeed.toFixed(1)} km/h</div>
                  ${speedFactor !== 1.0 ? `<div class="track-marker-real-speed">实际速度: ${currentSpeed.toFixed(1)} km/h</div>` : ''}
                </div>
              `;

              // 更新popup内容
              trackPlayer.marker.getPopup().setContent(speedPopupContent);
            }
          } else if (!trackPlayer._speedPopoverVisible && trackPlayer.marker.getPopup()) {
            // 如果不显示速度信息，则关闭popup
            trackPlayer.marker.closePopup();
          }

          // 标记状态
          trackPlayer._showMovingPointName = false;
        }

        this.log('debug', `轨迹 ${trackId} 移动点位名称可见性已设置为 ${visible} (通过popup显示)`);
        return true;
      }

      return true;
    } catch (error) {
      this.log('error', `设置轨迹 ${trackId} 移动点位名称可见性失败:`, error);
      return false;
    }
  }

  /**
   * 添加移动点位样式到页面
   */
  private addMovingPointStyles(): void {
    // 如果已经添加过样式，不再重复添加
    if (document.getElementById('track-moving-point-styles')) {
      return;
    }

    // 创建样式元素
    const style = document.createElement('style');
    style.id = 'track-moving-point-styles';
    style.innerHTML = `
      .track-marker-tooltip {
        background-color: rgba(0, 0, 0, 0.7);
        border: none;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        padding: 3px 8px;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      }
      .track-marker-tooltip::before {
        border-bottom-color: rgba(0, 0, 0, 0.7);
      }
      
      .track-speed-tooltip {
        background-color: rgba(33, 150, 243, 0.8);
        border: none;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        padding: 3px 8px;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      }
      .track-speed-tooltip::before {
        border-top-color: rgba(33, 150, 243, 0.8);
      }
      
      /* 轨迹标记popup样式 */
      .track-marker-popup-container {
        max-width: 500px;
      }
      
      .track-marker-popup {
        padding: 8px;
      }
      
      .track-marker-title {
        font-weight: bold;
        margin-bottom: 8px;
        font-size: 14px;
        color: #333;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      
      .track-marker-speed {
        color: #1890ff;
        font-weight: bold;
        margin-bottom: 5px;
        background: rgba(24, 144, 255, 0.1);
        padding: 3px 6px;
        border-radius: 3px;
      }
      
      .track-marker-real-speed {
        color: #666;
        font-size: 12px;
        margin-bottom: 5px;
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 3px;
      }
      
      .track-marker-type {
        background-color: #f0f0f0;
        border-radius: 10px;
        padding: 2px 8px;
        display: inline-block;
        font-size: 12px;
        color: #666;
        margin: 5px 0;
      }
      
      .track-marker-time {
        font-size: 12px;
        color: #999;
        margin-top: 5px;
        border-top: 1px dashed #eee;
        padding-top: 5px;
      }
      
      /* 轨迹节点样式 */
      .track-node {
        background: transparent;
      }
      
      .track-node-inner {
        width: 10px;
        height: 10px;
        background-color: #f44336;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
      }
      
      .track-node-endpoint .track-node-inner {
        width: 14px;
        height: 14px;
        background-color: #4CAF50;
      }
      
      /* 轨迹线样式 */
      .track-line {
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      
      .track-line-passed {
        stroke: #1890ff;
        stroke-opacity: 0.8;
      }
      
      .track-line-not-passed {
        stroke: #d9d9d9;
        stroke-opacity: 0.5;
      }
    `;

    // 添加到文档头部
    document.head.appendChild(style);
  }

  /**
   * 自适应显示轨迹
   * @param trackId 轨迹ID
   * @param options 自适应选项
   * @returns 是否成功自适应
   */
  public fitTrackToView(trackId: string, options: any): boolean {
    try {
      if (!this.mapInstance) {
        this.log('warn', '自适应显示轨迹失败: 地图实例未设置');
        return false;
      }

      if (!this.tracks.has(trackId)) {
        this.log('warn', `自适应显示轨迹失败: 未找到轨迹 ${trackId}`);
        return false;
      }

      const track = this.tracks.get(trackId);
      if (!track || !track.points || track.points.length === 0) {
        this.log('warn', `自适应显示轨迹失败: 轨迹 ${trackId} 没有点位`);
        return false;
      }

      // 计算轨迹点的边界
      const bounds: L.LatLngBounds = L.latLngBounds([]);

      track.points.forEach(point => {
        const lat = (point as any).latitude || (point as any).lat;
        const lng = (point as any).longitude || (point as any).lng;

        if (typeof lat === 'number' && typeof lng === 'number') {
          bounds.extend(L.latLng(lat, lng));
        }
      });

      if (bounds.isValid()) {
        // 设置地图视图到轨迹边界
        const padding: L.PointTuple = options?.padding || [20, 20];
        const duration: number = options?.duration || 500;
        const maxZoom: number = options?.maxZoom || 18;

        this.mapInstance.fitBounds(bounds, {
          padding: padding,
          animate: true,
          duration: duration / 1000, // 秒
          maxZoom: maxZoom
        });

        this.log('debug', `已自适应显示轨迹 ${trackId}`);
        return true;
      } else {
        this.log('warn', `自适应显示轨迹失败: 轨迹 ${trackId} 的边界无效`);
        return false;
      }
    } catch (error) {
      this.log('error', `自适应显示轨迹 ${trackId} 失败:`, error);
      return false;
    }
  }

  /**
   * 设置轨迹播放器配置
   * @param config 配置对象
   * @returns 是否成功设置
   */
  public setConfig(config: Partial<LeafletTrackConfig>): boolean {
    try {
      if (!config) {
        this.log('warn', '设置配置失败: 无效的配置对象');
        return false;
      }

      // 合并配置
      this.config = { ...this.config, ...config };

      // 更新内部选项
      this.options = {
        ...this.options,
        ...(config as LeafletTrackPlayerOptions)
      };

      // 如果有设置轨迹速度组
      if (config.trackSpeedGroup) {
        this.log('debug', `已更新轨迹速度组配置，组数: ${config.trackSpeedGroup.length}`);
      }

      // 遍历所有轨迹播放器，应用新的配置
      for (const [trackId, trackPlayerData] of this.trackPlayers.entries()) {
        const trackPlayer = trackPlayerData.player;

        if (trackPlayer) {
          // 更新轨迹显示相关配置

          // 更新节点可见性
          if (typeof config.showNodes !== 'undefined' && typeof trackPlayer.setNodesVisible === 'function') {
            trackPlayer.setNodesVisible(config.showNodes);
          }

          // 更新节点名称可见性
          if (typeof config.showNodeNames !== 'undefined' && typeof trackPlayer.setNodePopoversVisible === 'function') {
            trackPlayer.setNodePopoversVisible(config.showNodeNames);
          }

          // 更新节点时间可见性
          if (typeof config.showNodeTime !== 'undefined' && typeof trackPlayer.setNodeTimeVisible === 'function') {
            trackPlayer.setNodeTimeVisible(config.showNodeTime);
          }

          // 更新节点速度可见性
          if (typeof config.showNodeSpeed !== 'undefined' && typeof trackPlayer.setNodeSpeedsVisible === 'function') {
            trackPlayer.setNodeSpeedsVisible(config.showNodeSpeed);
          }

          // 更新节点距离可见性
          if (typeof config.showNodeDistance !== 'undefined' && typeof trackPlayer.setNodeDistanceVisible === 'function') {
            trackPlayer.setNodeDistanceVisible(config.showNodeDistance);
          }

          // 更新移动点位名称可见性
          if (typeof config.showPointNames !== 'undefined' && typeof trackPlayer.setMovingPointNameVisible === 'function') {
            trackPlayer.setMovingPointNameVisible(config.showPointNames);
          }

          // 更新速度弹窗可见性
          if (typeof config.showSpeed !== 'undefined' && typeof trackPlayer.setSpeedPopoversVisible === 'function') {
            trackPlayer.setSpeedPopoversVisible(config.showSpeed);
          }

          // 更新播放速度
          if (typeof config.speed !== 'undefined' && typeof trackPlayer.setSpeed === 'function') {
            trackPlayer.setSpeed(config.speed * 300); // 应用300倍速
          }

          // 更新循环播放
          if (typeof config.loop !== 'undefined' && typeof trackPlayer.setLoop === 'function') {
            trackPlayer.setLoop(config.loop);
          }

          // 更新相机跟随
          if (typeof config.withCamera !== 'undefined' && typeof trackPlayer.setPanTo === 'function') {
            trackPlayer.setPanTo(config.withCamera);
          }
        }
      }

      this.log('debug', '轨迹播放器配置已更新', config);
      return true;
    } catch (error) {
      this.log('error', '更新轨迹播放器配置失败:', error);
      return false;
    }
  }

  /**
   * 智能格式化时间
   * @param time 时间戳
   * @returns 格式化后的时间字符串
   */
  private formatTime(time: number): string {
    try {
      const date = new Date(time * 1000);
      const now = new Date();

      // 如果无效日期，返回原始格式
      if (isNaN(date.getTime())) {
        return new Date(time).toLocaleString();
      }

      // 判断是否是今天
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        // 计算时间差（毫秒）
        const diffMs = now.getTime() - date.getTime();

        // 转换为秒
        const diffSec = Math.floor(diffMs / 1000);

        // 如果小于60秒
        if (diffSec < 60) {
          return `${diffSec}秒前`;
        }

        // 转换为分钟
        const diffMin = Math.floor(diffSec / 60);

        // 如果小于60分钟
        if (diffMin < 60) {
          return `${diffMin}分钟前`;
        }

        // 转换为小时
        const diffHour = Math.floor(diffMin / 60);
        return `${diffHour}小时前`;
      } else {
        // 非今天的显示详细时间
        return date.toLocaleString();
      }
    } catch (error) {
      // 出错则返回默认格式
      return new Date(time).toLocaleString();
    }
  }

  /**
   * 显示轨迹的静态点位
   * @param trackId 轨迹ID
   * @returns 是否成功显示
   */
  public showTrackNodes(trackId: string): boolean {
    try {
      if (!this.mapInstance) {
        this.log('warn', '显示轨迹静态点位失败: 地图实例未设置');
        return false;
      }

      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `显示轨迹静态点位失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `显示轨迹静态点位失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 如果轨迹播放器支持设置节点可见性
      if (typeof trackPlayer.setNodesVisible === 'function') {
        trackPlayer.setNodesVisible(true);
        this.log('debug', `轨迹 ${trackId} 静态点位已显示`);
        return true;
      }

      // 如果有节点图层
      if (trackPlayer.nodeLayer && this.mapInstance) {
        trackPlayer.nodeLayer.addTo(this.mapInstance);
        this.log('debug', `轨迹 ${trackId} 节点图层已添加到地图`);
        return true;
      }

      return false;
    } catch (error) {
      this.log('error', `显示轨迹 ${trackId} 静态点位失败:`, error);
      return false;
    }
  }

  /**
   * 隐藏轨迹的静态点位
   * @param trackId 轨迹ID
   * @returns 是否成功隐藏
   */
  public hideTrackNodes(trackId: string): boolean {
    try {
      if (!this.trackPlayers.has(trackId)) {
        this.log('warn', `隐藏轨迹静态点位失败: 未找到轨迹 ${trackId} 的播放器`);
        return false;
      }

      const trackPlayerData = this.trackPlayers.get(trackId);
      const trackPlayer = trackPlayerData?.player;

      if (!trackPlayer) {
        this.log('warn', `隐藏轨迹静态点位失败: 轨迹 ${trackId} 的播放器无效`);
        return false;
      }

      // 如果轨迹播放器支持设置节点可见性
      if (typeof trackPlayer.setNodesVisible === 'function') {
        trackPlayer.setNodesVisible(false);
        this.log('debug', `轨迹 ${trackId} 静态点位已隐藏`);
        return true;
      }

      // 如果有节点图层
      if (trackPlayer.nodeLayer) {
        trackPlayer.nodeLayer.remove();
        this.log('debug', `轨迹 ${trackId} 节点图层已从地图移除`);
        return true;
      }

      return false;
    } catch (error) {
      this.log('error', `隐藏轨迹 ${trackId} 静态点位失败:`, error);
      return false;
    }
  }
}