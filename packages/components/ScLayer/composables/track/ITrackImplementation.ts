/**
 * 轨迹实现接口定义
 * @description 定义轨迹实现的接口，所有轨迹实现类都需要实现此接口
 */

import { Map as OlMap } from 'ol';
import { Track, TrackConfig, TrackPlayer } from '../../types/track';
import { EventsKey } from 'ol/events';
import { Feature } from 'ol';

/**
 * 轨迹播放状态枚举
 */
export enum TrackPlayState {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused'
}

/**
 * 轨迹实现类型枚举
 */
export enum TrackImplementationType {
  DEFAULT = 'default',      // 默认实现（TrackObject）
  OL_EXT = 'ol-ext',        // 基于ol-ext的实现
  CUSTOM = 'custom'         // 自定义实现
}

/**
 * 轨迹实现接口
 */
export interface ITrackImplementation {
  /**
   * 获取实现类型
   * @returns 实现类型
   */
  getImplementationType(): TrackImplementationType;
  
  /**
   * 获取实现名称
   * @returns 实现名称
   */
  getName(): string;
  
  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  setMapInstance(mapInstance: OlMap): void;
  
  /**
   * 获取地图实例
   * @returns 地图实例
   */
  getMapInstance(): OlMap | null;
  
  /**
   * 设置配置
   * @param config 轨迹配置
   */
  setConfig(config: TrackConfig): void;
  
  /**
   * 添加轨迹
   * @param track 轨迹
   * @returns 是否成功
   */
  addTrack(track: Track): boolean;
  
  /**
   * 删除轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  removeTrack(id: string): boolean;
  
  /**
   * 更新轨迹
   * @param id 轨迹ID
   * @param track 轨迹更新数据
   * @returns 是否成功
   */
  updateTrack(id: string, track: Partial<Track>): boolean;
  
  /**
   * 显示轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  showTrack(id: string): boolean;
  
  /**
   * 隐藏轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  hideTrack(id: string): boolean;
  
  /**
   * 设置所有轨迹可见性
   * @param visible 是否可见
   */
  setAllTracksVisible(visible: boolean): void;
  
  /**
   * 获取所有轨迹
   * @returns 轨迹映射
   */
  getAllTracks(): Map<string, Track>;
  
  /**
   * 获取轨迹
   * @param id 轨迹ID
   * @returns 轨迹
   */
  getTrack(id: string): Track | null;
  
  /**
   * 播放轨迹
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否成功
   */
  play(id: string, player?: Partial<TrackPlayer>): boolean;
  
  /**
   * 暂停轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  pause(id: string): boolean;
  
  /**
   * 停止轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  stop(id: string): boolean;
  
  /**
   * 设置轨迹速度因子
   * @param id 轨迹ID
   * @param speedFactor 速度因子
   * @returns 是否成功
   */
  setTrackSpeedFactor(id: string, speedFactor: number): boolean;
  
  /**
   * 获取轨迹速度因子
   * @param id 轨迹ID
   * @returns 速度因子
   */
  getTrackSpeedFactor(id: string): number | null;
  
  /**
   * 设置轨迹进度
   * @param id 轨迹ID
   * @param progress 进度值(0-1)
   * @returns 是否成功
   */
  setTrackProgress(id: string, progress: number): boolean;
  
  /**
   * 获取轨迹进度
   * @param id 轨迹ID
   * @returns 进度值(0-1)
   */
  getTrackProgress(id: string): number | null;
  
  /**
   * 获取轨迹播放状态
   * @param id 轨迹ID
   * @returns 播放状态
   */
  getTrackPlayState(id: string): TrackPlayState | null;
  
  /**
   * 清除所有轨迹
   * @returns 是否成功
   */
  clearAllTracks(): boolean;
  
  /**
   * 隐藏所有轨迹
   * @returns 是否成功
   */
  hideAllTracks(): boolean;
  
  /**
   * 显示所有轨迹
   * @returns 是否成功
   */
  showAllTracks(): boolean;
  
  /**
   * 设置轨迹节点可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  setTrackNodesVisible(id: string, visible: boolean): boolean;
  
  /**
   * 设置轨迹速度弹窗可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  setTrackSpeedPopoversVisible(id: string, visible: boolean): boolean;
  
  /**
   * 获取当前速度
   * @param id 轨迹ID
   * @returns 当前速度
   */
  getCurrentSpeed(id: string): number | null;
  
  /**
   * 设置轨迹播放器
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否成功
   */
  setTrackPlayer(id: string, player: Partial<TrackPlayer>): boolean;
  
  /**
   * 更新轨迹播放器
   * @param id 轨迹ID 
   * @param player 播放器配置
   * @returns 是否成功
   */
  updateTrackPlayer(id: string, player: Partial<TrackPlayer>): boolean;
  
  /**
   * 更新轨迹速度
   * @param id 轨迹ID
   * @param speedFactor 速度因子
   * @returns 是否成功
   */
  updateTrackSpeed(id: string, speedFactor: number): boolean;
  
  /**
   * 设置轨迹节点速度可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  setTrackNodeSpeedsVisible(id: string, visible: boolean): boolean;
  
  /**
   * 设置移动点位名称可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  setMovingPointNameVisible(id: string, visible: boolean): boolean;
  
  /**
   * 设置轨迹节点锚点可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  setTrackNodeAnchorsVisible(id: string, visible: boolean): boolean;
  
  /**
   * 设置轨迹节点时间可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  setTrackNodeTimeVisible(id: string, visible: boolean): boolean;
  
  /**
   * 设置轨迹节点弹窗可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  setTrackNodePopoversVisible(id: string, visible: boolean): boolean;
  
  /**
   * 自适应轨迹视图
   * @param id 轨迹ID
   * @param options 选项
   * @returns 是否成功
   */
  fitTrackToView(id: string, options?: {
    gotoStart?: boolean;
    padding?: number[];
    duration?: number;
    maxZoom?: number;
  }): boolean;
  
  /**
   * 选择轨迹
   * @param id 轨迹ID
   * @param options 选项
   * @returns 是否成功
   */
  selectTrack(id: string, options?: {
    clearOthers?: boolean;
    autoPlay?: boolean;
  }): boolean;
  
  /**
   * 销毁实现
   */
  destroy(): void;
} 