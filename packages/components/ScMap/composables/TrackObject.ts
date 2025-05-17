/**
 * 轨迹对象
 * @description 使用Leaflet实现的轨迹管理功能
 */
import L from 'leaflet';
import { Track, TrackPoint, TrackPlayerConfigOptions, DEFAULT_TRACK_PLAYER_CONFIG } from '../types/track';
import logger from './LogObject';
import { MapObject } from './MapObject';

// 轨迹事件回调类型
export type TrackEventCallback = (eventName: string, payload: any) => void;

export class TrackObject {
  private mapObj: MapObject;
  private tracks: Map<string, Track> = new Map();
  private eventCallback: TrackEventCallback | null = null;
  private activeTrackId: string | null = null;
  private playingTrackId: string | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private currentPoint: TrackPoint | null = null;
  private currentMarker: L.Marker | null = null;
  private animationFrameId: number | null = null;
  private config: TrackPlayerConfigOptions;
  private _lastFrameTime: number = 0;
  
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
    
    logger.debug('TrackObject已初始化');
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
      }
      
      // 排序轨迹点按时间顺序
      if (track.points && track.points.length > 0) {
        track.points.sort((a, b) => a.time - b.time);
      }
      
      // 存储轨迹
      this.tracks.set(track.id, track);
      
      // 自动显示轨迹
      if (track.visible !== false) {
        this.showTrack(track.id);
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
      
      // 隐藏轨迹
      this.hideTrack(trackId);
      
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
   * 显示轨迹
   * @param trackId 轨迹ID
   * @returns 是否成功
   */
  public showTrack(trackId: string): boolean {
    try {
      const track = this.tracks.get(trackId);
      if (!track) {
        logger.warn(`轨迹ID ${trackId} 不存在`);
        return false;
      }
      
      // 获取地图实例
      const map = this.mapObj.getMapInstance();
      if (!map) {
        logger.error('地图实例不存在');
        return false;
      }
      
      // 如果已经有路径对象，则直接添加到地图
      if (track._path) {
        track._path.addTo(map);
        track.visible = true;
        return true;
      }
      
      // 创建路径点
      const latlngs = track.points.map(point => L.latLng(point.lat, point.lng));
      if (latlngs.length === 0) {
        logger.warn(`轨迹 ${trackId} 没有有效点`);
        return false;
      }
      
      // 创建路径
      const polyline = L.polyline(latlngs, {
        color: track.color || this.config.trackStyle?.color || '#1890ff',
        weight: track.weight || this.config.trackStyle?.weight || 3,
        opacity: this.config.trackStyle?.opacity || 0.8,
        dashArray: track.style === 'dashed' ? '5, 5' : 
                 track.style === 'dotted' ? '1, 5' : undefined
      });
      
      // 保存路径对象
      track._path = polyline;
      
      // 将轨迹ID添加到路径对象，方便事件处理
      (polyline as any).trackId = trackId;
      
      // 添加到地图
      polyline.addTo(map);
      
      // 注册事件
      polyline.on('click', (e) => {
        // 阻止事件继续传播到地图
        L.DomEvent.stopPropagation(e);
        
        // 设置为活动轨迹
        this.setActiveTrack(trackId);
        
        // 触发轨迹点击事件
        this.triggerEvent('track-click', { 
          trackId, 
          track,
          latlng: e.latlng,
          originalEvent: e.originalEvent
        });
      });
      
      // 设置可见状态
      track.visible = true;
      
      // 如果需要显示节点，则添加节点标记
      if (this.config.showNodes && track.nodes && track.nodes.length > 0) {
        this.showTrackNodes(track);
      }
      
      logger.debug(`已显示轨迹: ${trackId}`);
      
      return true;
    } catch (error) {
      logger.error(`显示轨迹 ${trackId} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 隐藏轨迹
   * @param trackId 轨迹ID
   * @returns 是否成功
   */
  public hideTrack(trackId: string): boolean {
    try {
      const track = this.tracks.get(trackId);
      if (!track) {
        logger.warn(`轨迹ID ${trackId} 不存在`);
        return false;
      }
      
      // 如果有路径对象，从地图移除
      if (track._path) {
        track._path.remove();
      }
      
      // 如果有标记点对象，从地图移除
      if (track._markers && track._markers.length > 0) {
        track._markers.forEach(marker => marker.remove());
        track._markers = [];
      }
      
      // 设置可见状态
      track.visible = false;
      
      logger.debug(`已隐藏轨迹: ${trackId}`);
      
      return true;
    } catch (error) {
      logger.error(`隐藏轨迹 ${trackId} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 显示轨迹节点
   * @param track 轨迹对象
   */
  private showTrackNodes(track: Track): void {
    // 获取地图实例
    const map = this.mapObj.getMapInstance();
    if (!map) {
      logger.error('地图实例不存在');
      return;
    }
    
    // 如果没有节点或节点为空数组，则使用轨迹点
    const nodes = (track.nodes && track.nodes.length > 0) 
      ? track.nodes 
      : track.points;
    
    // 如果没有有效节点，返回
    if (!nodes || nodes.length === 0) {
      return;
    }
    
    // 创建标记点数组
    const markers: L.Marker[] = [];
    
    // 循环创建节点标记
    nodes.forEach((node, index) => {
      // 创建自定义图标
      const nodeStyle = this.config.trackStyle?.nodeStyle || 'circle';
      let icon;
      
      if (nodeStyle === 'circle') {
        // 创建圆形图标
        const nodeSize = this.config.trackStyle?.nodeSize || 6;
        const nodeColor = this.config.trackStyle?.nodeColor || track.color || '#1890ff';
        
        // 使用自定义HTML创建圆形图标
        icon = L.divIcon({
          html: `<div style="
            width: ${nodeSize * 2}px;
            height: ${nodeSize * 2}px;
            border-radius: 50%;
            background-color: ${nodeColor};
            border: 2px solid white;
            box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
          "></div>`,
          className: 'track-node-icon',
          iconSize: [nodeSize * 2, nodeSize * 2],
          iconAnchor: [nodeSize, nodeSize]
        });
      } else if (nodeStyle === 'marker') {
        // 使用默认标记图标
        icon = new L.Icon.Default();
      } else {
        // 不显示节点
        return;
      }
      
      // 创建标记
      const marker = L.marker([node.lat, node.lng], { icon });
      
      // 如果需要显示节点名称，添加工具提示
      if (this.config.showNodeNames && node.name) {
        marker.bindTooltip(node.name, {
          permanent: true,
          direction: 'top',
          offset: L.point(0, -10)
        });
      }
      
      // 如果需要显示节点锚点，添加圆形
      if (this.config.showNodeAnchors) {
        const circle = L.circle([node.lat, node.lng], {
          radius: 50, // 默认半径50米
          color: track.color || '#1890ff',
          fillColor: track.color || '#1890ff',
          fillOpacity: 0.2,
          weight: 1
        }).addTo(map);
        
        // 将圆形存储在标记的自定义属性中
        (marker as any)._circle = circle;
      }
      
      // 添加到地图
      marker.addTo(map);
      
      // 添加到标记数组
      markers.push(marker);
    });
    
    // 保存标记数组
    track._markers = markers;
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
      
      // 如果有之前的活动轨迹，重置其样式
      if (this.activeTrackId) {
        const prevTrack = this.tracks.get(this.activeTrackId);
        if (prevTrack && prevTrack._path) {
          prevTrack._path.setStyle({
            color: prevTrack.color || this.config.trackStyle?.color || '#1890ff',
            weight: prevTrack.weight || this.config.trackStyle?.weight || 3
          });
          prevTrack.selected = false;
        }
      }
      
      // 设置新的活动轨迹
      this.activeTrackId = trackId;
      const track = this.tracks.get(trackId);
      
      // 确保轨迹可见
      if (!track?.visible) {
        this.showTrack(trackId);
      }
      
      // 设置活动轨迹样式
      if (track && track._path) {
        track._path.setStyle({
          color: track.color || this.config.trackStyle?.color || '#1890ff',
          weight: (track.weight || this.config.trackStyle?.weight || 3) + 2, // 加粗线条
          opacity: 1 // 增加不透明度
        });
        track.selected = true;
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
    
    // 确定开始时间
    this.currentTime = startTime !== undefined ? startTime : track.points[0].time;
    
    // 创建当前位置标记
    this.createCurrentMarker(track);
    
    // 开始动画循环
    this.startAnimation();
    
    // 触发播放开始事件
    this.triggerEvent('track-play-start', { 
      trackId: targetTrackId, 
      track,
      startTime: this.currentTime
    });
    
    logger.debug(`开始播放轨迹: ${targetTrackId}`);
    
    return true;
  } catch (error) {
    logger.error('播放轨迹失败:', error);
    return false;
  }
}

/**
 * 创建当前位置标记
 * @param track 轨迹对象
 */
private createCurrentMarker(track: Track): void {
  // 获取地图实例
  const map = this.mapObj.getMapInstance();
  if (!map) {
    logger.error('地图实例不存在');
    return;
  }
  
  // 查找当前时间对应的点
  const point = this.findPointAtTime(track, this.currentTime);
  if (!point) {
    logger.warn('无法找到当前时间对应的点');
    return;
  }
  
  // 保存当前点
  this.currentPoint = point;
  
  // 如果已经有标记，移除它
  if (this.currentMarker) {
    this.currentMarker.remove();
    this.currentMarker = null;
  }
  
  // 创建图标
  let icon;
  
  // 检查是否指定了移动图标
  if (this.config.moveIcon) {
    // 获取图标大小
    const iconSize = this.config.moveIconSize || [24, 24];
    
    // 内置图标类型
    if (this.config.moveIcon === 'car') {
      // 使用汽车图标
      icon = L.divIcon({
        html: `<div style="
          width: ${iconSize[0]}px;
          height: ${iconSize[1]}px;
          background-color: ${this.config.moveIconColor || track.color || '#1890ff'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        ">
          <svg viewBox="0 0 1024 1024" width="${iconSize[0] * 0.6}" height="${iconSize[1] * 0.6}" fill="#ffffff">
            <path d="M761.6 396.8c-16-19.2-38.4-28.8-64-28.8h-371.2c-25.6 0-48 9.6-64 28.8-16 19.2-22.4 41.6-19.2 67.2l19.2 188.8v233.6c0 16 12.8 28.8 28.8 28.8h48c16 0 28.8-12.8 28.8-28.8v-48h288v48c0 16 12.8 28.8 28.8 28.8h48c16 0 28.8-12.8 28.8-28.8v-233.6l19.2-188.8c3.2-25.6-3.2-48-19.2-67.2zM368 608c-9.6 0-16-3.2-22.4-9.6-6.4-6.4-9.6-12.8-9.6-22.4 0-9.6 3.2-16 9.6-22.4 6.4-6.4 12.8-9.6 22.4-9.6 9.6 0 16 3.2 22.4 9.6 6.4 6.4 9.6 12.8 9.6 22.4 0 9.6-3.2 16-9.6 22.4-6.4 6.4-12.8 9.6-22.4 9.6z m288 0c-9.6 0-16-3.2-22.4-9.6-6.4-6.4-9.6-12.8-9.6-22.4 0-9.6 3.2-16 9.6-22.4 6.4-6.4 12.8-9.6 22.4-9.6 9.6 0 16 3.2 22.4 9.6 6.4 6.4 9.6 12.8 9.6 22.4 0 9.6-3.2 16-9.6 22.4-6.4 6.4-12.8 9.6-22.4 9.6z m-307.2-144l19.2-96h275.2l19.2 96h-313.6z"/>
          </svg>
        </div>`,
        className: 'track-current-marker',
        iconSize: iconSize,
        iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
      });
    } else if (this.config.moveIcon === 'plane') {
      // 使用飞机图标
      icon = L.divIcon({
        html: `<div style="
          width: ${iconSize[0]}px;
          height: ${iconSize[1]}px;
          background-color: ${this.config.moveIconColor || track.color || '#1890ff'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        ">
          <svg viewBox="0 0 1024 1024" width="${iconSize[0] * 0.6}" height="${iconSize[1] * 0.6}" fill="#ffffff">
            <path d="M839.6 460.4L540.4 299.2V188c0-68-56-124-124-124s-124 56-124 124v111.2L24.4 460.4c-13.6 8-20 24-15.6 39.2 4.4 15.2 18.4 25.6 34.4 25.6h222.4v222.4l-81.6 78.4c-8.8 8.4-12 20.8-8.4 32.4 3.6 11.6 13.2 20 24.8 22l193.6 31.2c7.2 0.8 14-0.8 20-4.8 6-4 10.4-10 12-16.8l27.6-97.6 27.6 97.6c1.6 6.8 6 12.8 12 16.8 6 4 12.8 5.6 20 4.8l193.6-31.2c11.6-2 21.2-10.4 24.8-22 3.6-11.6 0.4-24-8.4-32.4l-81.6-78.4v-222.4h222.4c16 0 30-10.4 34.4-25.6 4.4-15.2-2-31.2-15.6-39.2z"/>
          </svg>
        </div>`,
        className: 'track-current-marker',
        iconSize: iconSize,
        iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
      });
    } else if (this.config.moveIcon === 'ship') {
      // 使用船舶图标
      icon = L.divIcon({
        html: `<div style="
          width: ${iconSize[0]}px;
          height: ${iconSize[1]}px;
          background-color: ${this.config.moveIconColor || track.color || '#1890ff'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        ">
          <svg viewBox="0 0 1024 1024" width="${iconSize[0] * 0.6}" height="${iconSize[1] * 0.6}" fill="#ffffff">
            <path d="M902.4 748.8c-20.8-16-44.8-28.8-71.2-37.6v-320c0-17.6-14.4-32-32-32h-96V288c0-17.6-14.4-32-32-32H352c-17.6 0-32 14.4-32 32v71.2h-96c-17.6 0-32 14.4-32 32v320c-26.4 8.8-50.4 21.6-71.2 37.6-30.4 22.4-32 30.4-32 41.6 0 59.2 64 97.6 169.6 102.4 14.4 0.8 27.2-9.6 30.4-24 3.2-14.4-6.4-28.8-20.8-33.6-35.2-9.6-56-23.2-63.2-30.4 8-4 19.2-8.8 32-12 28.8-8 62.4-12 97.6-12 71.2 0 132.8 17.6 160 42.4 27.2-24.8 88.8-42.4 160-42.4 35.2 0 68.8 4 97.6 12 12.8 3.2 24 8 32 12-7.2 7.2-28 20.8-63.2 30.4-14.4 4.8-24 19.2-20.8 33.6 3.2 12.8 14.4 22.4 27.2 22.4h3.2c105.6-4.8 169.6-43.2 169.6-102.4 0-11.2-1.6-19.2-32-41.6zM384 352h256v32H384v-32z m256 96v160H384v-160h256z"/>
          </svg>
        </div>`,
        className: 'track-current-marker',
        iconSize: iconSize,
        iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
      });
    } else if (this.config.moveIcon.startsWith('http')) {
      // 使用URL图片
      icon = L.icon({
        iconUrl: this.config.moveIcon,
        iconSize: iconSize,
        iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
      });
    } else {
      // 使用默认图标
      icon = new L.Icon.Default();
    }
  } else {
    // 使用默认图标
    icon = new L.Icon.Default();
  }
  
  // 创建标记
  this.currentMarker = L.marker([point.lat, point.lng], { icon });
  
  // 如果需要显示点位名称，添加工具提示
  const pointName = point.name || track.name;
  if (this.config.showPointNames && pointName) {
    this.currentMarker.bindTooltip(pointName, {
      permanent: true,
      direction: 'top',
      offset: L.point(0, -10)
    });
  }
  
  // 添加到地图
  this.currentMarker.addTo(map);
  
  // 如果需要跟随相机，设置地图中心
  if (this.config.withCamera) {
    map.setView([point.lat, point.lng], map.getZoom());
  }
}

/**
 * 查找指定时间的轨迹点
 * @param track 轨迹对象
 * @param time 时间戳
 * @returns 轨迹点或null
 */
private findPointAtTime(track: Track, time: number): TrackPoint | null {
  try {
    const points = track.points;
    
    // 如果轨迹为空，返回null
    if (!points || points.length === 0) {
      return null;
    }
    
    // 如果时间早于第一个点，返回第一个点
    if (time <= points[0].time) {
      return points[0];
    }
    
    // 如果时间晚于最后一个点，返回最后一个点
    if (time >= points[points.length - 1].time) {
      return points[points.length - 1];
    }
    
    // 找到时间在两个点之间的位置
    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time < points[i + 1].time) {
        // 计算两点之间的插值
        const p1 = points[i];
        const p2 = points[i + 1];
        const ratio = (time - p1.time) / (p2.time - p1.time);
        
        // 插值计算位置
        const lat = p1.lat + (p2.lat - p1.lat) * ratio;
        const lng = p1.lng + (p2.lng - p1.lng) * ratio;
        
        // 插值计算速度
        const speed = p1.speed !== undefined && p2.speed !== undefined
          ? p1.speed + (p2.speed - p1.speed) * ratio
          : this.config.speed;
        
        // 插值计算方向
        const direction = p1.direction !== undefined && p2.direction !== undefined
          ? p1.direction + (p2.direction - p1.direction) * ratio
          : undefined;
        
        // 创建插值点
        return {
          lat,
          lng,
          time,
          speed,
          direction,
          name: p1.name,
          data: p1.data
        };
      }
    }
    
    // 默认返回最接近的点
    return points[points.length - 1];
  } catch (error) {
    logger.error('查找轨迹点失败:', error);
    return null;
  }
}

/**
 * 开始动画循环
 */
private startAnimation(): void {
  if (!this.isPlaying || !this.playingTrackId) {
    return;
  }
  
  // 获取轨迹
  const track = this.tracks.get(this.playingTrackId);
  if (!track) {
    this.stop();
    return;
  }
  
  // 使用requestAnimationFrame实现动画
  const animate = () => {
    if (!this.isPlaying || !this.playingTrackId) {
      return;
    }
    
    // 更新当前时间
    const now = performance.now();
    const elapsed = now - (this._lastFrameTime || now);
    this._lastFrameTime = now;
    
    // 计算时间增量
    const realSpeed = this.config.speed * (this.config.speedFactor || 1); // km/h
    const metersPerSecond = realSpeed * 1000 / 3600; // 转换为米/秒
    const timeIncrement = metersPerSecond * elapsed / 1000; // 根据实际时间计算时间增量
    
    // 更新当前时间
    this.currentTime += timeIncrement;
    
    // 检查是否超出轨迹范围
    const lastPoint = track.points[track.points.length - 1];
    if (this.currentTime > lastPoint.time) {
      if (this.config.loop) {
        // 循环播放，回到起点
        this.currentTime = track.points[0].time;
        this.triggerEvent('track-play-loop', { 
          trackId: this.playingTrackId, 
          track
        });
      } else {
        // 播放完成，停止
        this.stop();
        this.triggerEvent('track-play-end', { 
          trackId: this.playingTrackId, 
          track
        });
        return;
      }
    }
    
    // 更新当前位置
    this.updateCurrentPosition(track);
    
    // 继续循环
    this.animationFrameId = window.requestAnimationFrame(animate);
  };
  
  // 记录最后一次更新时间
  this._lastFrameTime = performance.now();
  
  // 开始动画循环
  this.animationFrameId = window.requestAnimationFrame(animate);
}

/**
 * 更新当前位置
 * @param track 轨迹对象
 */
private updateCurrentPosition(track: Track): void {
  try {
    // 获取地图实例
    const map = this.mapObj.getMapInstance();
    if (!map) {
      logger.error('地图实例不存在');
      return;
    }
    
    // 查找当前时间对应的点
    const point = this.findPointAtTime(track, this.currentTime);
    if (!point) {
      logger.warn('无法找到当前时间对应的点');
      return;
    }
    
    // 保存当前点
    this.currentPoint = point;
    
    // 如果没有标记，创建标记
    if (!this.currentMarker) {
      this.createCurrentMarker(track);
      return;
    }
    
    // 更新标记位置
    this.currentMarker.setLatLng([point.lat, point.lng]);
    
    // 如果需要显示速度，更新工具提示
    if (this.config.showSpeed && point.speed !== undefined) {
      const pointName = point.name || track.name || '';
      const speedText = `${pointName ? pointName + ' - ' : ''}${point.speed.toFixed(1)} km/h`;
      this.currentMarker.setTooltipContent(speedText);
    }
    
    // 如果需要跟随相机，设置地图中心
    if (this.config.withCamera) {
      map.setView([point.lat, point.lng], map.getZoom());
    }
    
    // 触发位置更新事件
    this.triggerEvent('track-position-update', {
      trackId: this.playingTrackId,
      point,
      time: this.currentTime
    });
  } catch (error) {
    logger.error('更新当前位置失败:', error);
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
    
    // 停止动画循环
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 更新状态
    this.isPlaying = false;
    
    // 触发暂停事件
    this.triggerEvent('track-play-pause', {
      trackId: this.playingTrackId,
      currentTime: this.currentTime
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
    
    // 停止动画循环
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 记录正在播放的轨迹ID
    const trackId = this.playingTrackId;
    
    // 更新状态
    this.isPlaying = false;
    this.playingTrackId = null;
    this.currentTime = 0;
    this._lastFrameTime = 0;
    
    // 移除当前位置标记
    if (this.currentMarker) {
      this.currentMarker.remove();
      this.currentMarker = null;
    }
    
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
    
    // 获取轨迹
    const track = this.tracks.get(this.playingTrackId)!;
    
    // 检查时间范围
    const firstPoint = track.points[0];
    const lastPoint = track.points[track.points.length - 1];
    
    if (time < firstPoint.time) {
      time = firstPoint.time;
    } else if (time > lastPoint.time) {
      time = lastPoint.time;
    }
    
    // 更新当前时间
    this.currentTime = time;
    
    // 更新当前位置
    this.updateCurrentPosition(track);
    
    // 触发时间更新事件
    this.triggerEvent('track-time-update', {
      trackId: this.playingTrackId,
      currentTime: this.currentTime
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
  
  // 如果当前有播放中的轨迹，更新显示
  if (this.playingTrackId && this.currentMarker) {
    const track = this.tracks.get(this.playingTrackId);
    if (track) {
      // 更新标记
      this.currentMarker.remove();
      this.currentMarker = null;
      this.createCurrentMarker(track);
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
    
    // 隐藏所有轨迹
    this.tracks.forEach((_, trackId) => {
      this.hideTrack(trackId);
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
  
  // 隐藏所有轨迹
  this.tracks.forEach((_, trackId) => {
    this.hideTrack(trackId);
  });
  
  // 清空轨迹集合
  this.tracks.clear();
  
  // 清空事件回调
  this.eventCallback = null;
  
  logger.debug('TrackObject已销毁');
}
} 