/**
 * 轨迹管理器
 * @description 管理不同的轨迹实现，提供统一的接口
 */
import { Map as OlMap } from 'ol';
import { Track, TrackConfig, TrackPlayer } from '../../types/track';
import { ITrackImplementation, TrackImplementationType, TrackPlayState } from './ITrackImplementation';
import { DefaultTrackImpl } from './implementations/DefaultTrackImpl';
import { OlExtTrackImpl } from './implementations/OlExtTrackImpl';
import logger from '../../composables/LogObject';

// 日志前缀
const LOG_MODULE = 'TrackManager';

/**
 * 轨迹管理器类
 */
export class TrackManager {
  // 轨迹实现映射
  private implementations = new Map<TrackImplementationType, ITrackImplementation>();
  
  // 当前激活的实现
  private activeImplementation: ITrackImplementation | null = null;
  
  // 地图实例
  private mapInstance: OlMap | null = null;
  
  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 轨迹配置
   * @param defaultImplType 默认实现类型
   */
  constructor(
    mapInstance: OlMap | null = null,
    config?: TrackConfig,
    defaultImplType: TrackImplementationType = TrackImplementationType.DEFAULT
  ) {
    // 注册默认的实现
    this.registerImplementation(new DefaultTrackImpl(mapInstance, config));
    this.registerImplementation(new OlExtTrackImpl(mapInstance, config));
    
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    
    // 设置默认实现
    this.setActiveImplementation(defaultImplType);
    
    this.log('debug', '轨迹管理器已创建');
  }
  
  /**
   * 注册轨迹实现
   * @param implementation 轨迹实现
   */
  public registerImplementation(implementation: ITrackImplementation): void {
    const type = implementation.getImplementationType();
    
    // 如果已存在同类型实现，先销毁旧的
    if (this.implementations.has(type)) {
      const oldImpl = this.implementations.get(type);
      if (oldImpl) {
        oldImpl.destroy();
      }
    }
    
    // 设置地图实例
    if (this.mapInstance) {
      implementation.setMapInstance(this.mapInstance);
    }
    
    // 注册新实现
    this.implementations.set(type, implementation);
    this.log('info', `已注册轨迹实现: ${implementation.getName()}`);
  }
  
  /**
   * 设置活动的轨迹实现
   * @param type 实现类型
   * @returns 是否设置成功
   */
  public setActiveImplementation(type: TrackImplementationType): boolean {
    if (!this.implementations.has(type)) {
      this.log('error', `轨迹实现类型 "${type}" 不存在`);
      return false;
    }
    
    this.activeImplementation = this.implementations.get(type)!;
    this.log('info', `活动轨迹实现已设置为: ${this.activeImplementation.getName()}`);
    return true;
  }
  
  /**
   * 获取活动的轨迹实现
   * @returns 活动轨迹实现
   */
  public getActiveImplementation(): ITrackImplementation | null {
    return this.activeImplementation;
  }
  
  /**
   * 获取指定类型的轨迹实现
   * @param type 实现类型
   * @returns 轨迹实现
   */
  public getImplementation(type: TrackImplementationType): ITrackImplementation | null {
    return this.implementations.get(type) || null;
  }
  
  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    this.mapInstance = mapInstance;
    
    // 更新所有实现的地图实例
    this.implementations.forEach(impl => {
      impl.setMapInstance(mapInstance);
    });
    
    this.log('debug', '地图实例已设置');
  }
  
  /**
   * 设置配置
   * @param config 轨迹配置
   */
  public setConfig(config: TrackConfig): void {
    // 更新所有实现的配置
    this.implementations.forEach(impl => {
      impl.setConfig(config);
    });
    
    this.log('debug', '配置已设置');
  }
  
  /**
   * 添加轨迹
   * @param track 轨迹
   * @returns 是否成功
   */
  public addTrack(track: Track): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现添加轨迹
    this.implementations.forEach(impl => {
      const result = impl.addTrack(track);
      // 如果任一实现添加失败，整体结果为失败
      if (!result) {
        this.log('warn', `添加轨迹 "${track.id}" 在实现 ${impl.getName()} 中失败`);
        overallResult = false;
      }
    });
    
    // 返回整体结果
    return overallResult;
  }
  
  /**
   * 删除轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public removeTrack(id: string): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现删除轨迹
    this.implementations.forEach(impl => {
      const result = impl.removeTrack(id);
      // 如果任一实现删除失败，整体结果为失败
      if (!result) {
        this.log('warn', `删除轨迹 "${id}" 在实现 ${impl.getName()} 中失败`);
        overallResult = false;
      }
    });
    
    // 返回整体结果
    return overallResult;
  }
  
  /**
   * 更新轨迹
   * @param id 轨迹ID
   * @param track 轨迹更新数据
   * @returns 是否成功
   */
  public updateTrack(id: string, track: Partial<Track>): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现更新轨迹
    this.implementations.forEach(impl => {
      const result = impl.updateTrack(id, track);
      // 如果任一实现更新失败，整体结果为失败
      if (!result) {
        this.log('warn', `更新轨迹 "${id}" 在实现 ${impl.getName()} 中失败`);
        overallResult = false;
      }
    });
    
    // 返回整体结果
    return overallResult;
  }
  
  /**
   * 显示轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public showTrack(id: string): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现显示轨迹
    this.implementations.forEach(impl => {
      const result = impl.showTrack(id);
      // 如果任一实现显示失败，整体结果为失败
      if (!result) {
        this.log('warn', `显示轨迹 "${id}" 在实现 ${impl.getName()} 中失败`);
        overallResult = false;
      }
    });
    
    // 返回整体结果
    return overallResult;
  }
  
  /**
   * 隐藏轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public hideTrack(id: string): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现隐藏轨迹
    this.implementations.forEach(impl => {
      const result = impl.hideTrack(id);
      // 如果任一实现隐藏失败，整体结果为失败
      if (!result) {
        this.log('warn', `隐藏轨迹 "${id}" 在实现 ${impl.getName()} 中失败`);
        overallResult = false;
      }
    });
    
    // 返回整体结果
    return overallResult;
  }
  
  /**
   * 设置所有轨迹可见性
   * @param visible 是否可见
   */
  public setAllTracksVisible(visible: boolean): void {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return;
    }
    
    // 对所有已注册的实现设置所有轨迹可见性
    this.implementations.forEach(impl => {
      try {
        impl.setAllTracksVisible(visible);
      } catch (error) {
        this.log('warn', `设置所有轨迹可见性失败，在实现 ${impl.getName()} 中失败`, error);
      }
    });
  }
  
  /**
   * 获取所有轨迹
   * @returns 轨迹映射
   */
  public getAllTracks(): Map<string, Track> {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return new Map();
    }
    
    return this.activeImplementation.getAllTracks();
  }
  
  /**
   * 获取轨迹
   * @param id 轨迹ID
   * @returns 轨迹
   */
  public getTrack(id: string): Track | null {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return null;
    }
    
    return this.activeImplementation.getTrack(id);
  }
  
  /**
   * 播放轨迹
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否成功
   */
  public play(id: string, player?: Partial<TrackPlayer>): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    const activeResult = this.activeImplementation.play(id, player);
    
    // 对所有其他实现播放轨迹
    this.implementations.forEach(impl => {
      if (impl === this.activeImplementation) {
        return;
      }
      
      try {
        impl.play(id, player);
      } catch (error) {
        this.log('warn', `播放轨迹 "${id}" 在实现 ${impl.getName()} 中失败`, error);
      }
    });
    
    return activeResult;
  }
  
  /**
   * 暂停轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public pause(id: string): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    const activeResult = this.activeImplementation.pause(id);
    
    // 对所有其他实现暂停轨迹
    this.implementations.forEach(impl => {
      if (impl === this.activeImplementation) {
        return;
      }
      
      try {
        impl.pause(id);
      } catch (error) {
        this.log('warn', `暂停轨迹 "${id}" 在实现 ${impl.getName()} 中失败`, error);
      }
    });
    
    return activeResult;
  }
  
  /**
   * 停止轨迹
   * @param id 轨迹ID
   * @returns 是否成功
   */
  public stop(id: string): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    const activeResult = this.activeImplementation.stop(id);
    
    // 对所有其他实现停止轨迹
    this.implementations.forEach(impl => {
      if (impl === this.activeImplementation) {
        return;
      }
      
      try {
        impl.stop(id);
      } catch (error) {
        this.log('warn', `停止轨迹 "${id}" 在实现 ${impl.getName()} 中失败`, error);
      }
    });
    
    return activeResult;
  }
  
  /**
   * 清除所有轨迹
   * @returns 是否成功
   */
  public clearAllTracks(): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现清除所有轨迹
    this.implementations.forEach(impl => {
      try {
        const result = impl.clearAllTracks();
        if (!result) {
          this.log('warn', `清除所有轨迹失败，在实现 ${impl.getName()} 中失败`);
          overallResult = false;
        }
      } catch (error) {
        this.log('error', `清除所有轨迹失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 销毁轨迹管理器
   */
  public destroy(): void {
    // 销毁所有实现
    this.implementations.forEach(impl => {
      impl.destroy();
    });
    
    this.implementations.clear();
    this.activeImplementation = null;
    this.log('debug', '轨迹管理器已销毁');
  }
  
  /**
   * 在所有实现间迁移轨迹数据
   * @param fromType 源实现类型
   * @param toType 目标实现类型
   * @param preserveState 是否保留状态
   * @returns 是否成功
   */
  public migrateTrackData(
    fromType: TrackImplementationType,
    toType: TrackImplementationType,
    preserveState: boolean = true
  ): boolean {
    try {
      const sourceImpl = this.getImplementation(fromType);
      const targetImpl = this.getImplementation(toType);
      
      if (!sourceImpl || !targetImpl) {
        this.log('error', '迁移源或目标实现不存在');
        return false;
      }
      
      // 获取所有轨迹数据
      const tracks = sourceImpl.getAllTracks();
      
      // 清空目标实现的轨迹
      targetImpl.clearAllTracks();
      
      // 迁移轨迹数据
      tracks.forEach(track => {
        targetImpl.addTrack(track);
        
        if (preserveState) {
          // 迁移轨迹状态
          const progress = sourceImpl.getTrackProgress(track.id);
          const playState = sourceImpl.getTrackPlayState(track.id);
          const speedFactor = sourceImpl.getTrackSpeedFactor(track.id);
          
          if (progress !== null) {
            targetImpl.setTrackProgress(track.id, progress);
          }
          
          if (speedFactor !== null) {
            targetImpl.setTrackSpeedFactor(track.id, speedFactor);
          }
          
          // 根据播放状态设置目标状态
          if (playState === TrackPlayState.PLAYING) {
            targetImpl.play(track.id);
          } else if (playState === TrackPlayState.PAUSED) {
            targetImpl.play(track.id);
            targetImpl.pause(track.id);
          }
        }
      });
      
      this.log('info', `已将轨迹数据从 ${fromType} 迁移到 ${toType}`);
      return true;
    } catch (error) {
      this.log('error', '迁移轨迹数据失败', error);
      return false;
    }
  }
  
  /**
   * 切换轨迹实现
   * @param type 目标实现类型
   * @param preserveState 是否保留状态
   * @returns 是否成功
   */
  public switchImplementation(type: TrackImplementationType, preserveState: boolean = true): boolean {
    if (!this.implementations.has(type)) {
      this.log('error', `轨迹实现类型 "${type}" 不存在`);
      return false;
    }
    
    if (this.activeImplementation?.getImplementationType() === type) {
      this.log('debug', `当前已经是 ${type} 实现`);
      return true;
    }
    
    const currentType = this.activeImplementation?.getImplementationType();
    
    if (currentType && preserveState) {
      // 迁移轨迹数据
      this.migrateTrackData(currentType, type, preserveState);
    }
    
    // 设置活动实现
    this.setActiveImplementation(type);
    
    return true;
  }
  
  /**
   * 获取轨迹进度
   * @param id 轨迹ID
   * @returns 进度值（0-1）或null
   */
  public getTrackProgress(id: string): number | null {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return null;
    }
    
    return this.activeImplementation.getTrackProgress(id);
  }
  
  /**
   * 设置轨迹进度
   * @param id 轨迹ID
   * @param progress 进度值（0-1）
   * @returns 是否成功
   */
  public setTrackProgress(id: string, progress: number): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置轨迹进度
    this.implementations.forEach(impl => {
      try {
        const result = impl.setTrackProgress(id, progress);
        if (!result) {
          this.log('warn', `设置轨迹进度失败，在实现 ${impl.getName()} 中失败`);
          overallResult = false;
        }
      } catch (error) {
        this.log('error', `设置轨迹进度失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 获取当前速度
   * @param id 轨迹ID
   * @returns 当前速度或null
   */
  public getCurrentSpeed(id: string): number | null {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return null;
    }
    
    return this.activeImplementation.getCurrentSpeed(id);
  }
  
  /**
   * 更新轨迹速度
   * @param id 轨迹ID
   * @param speedFactor 速度因子
   * @returns 是否成功
   */
  public updateTrackSpeed(id: string, speedFactor: number): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现更新轨迹速度
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.updateTrackSpeed === 'function') {
          const result = impl.updateTrackSpeed(id, speedFactor);
          if (!result) {
            this.log('warn', `更新轨迹速度失败，在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        } else if (typeof impl.setTrackSpeedFactor === 'function') {
          const result = impl.setTrackSpeedFactor(id, speedFactor);
          if (!result) {
            this.log('warn', `设置轨迹速度失败，在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `更新轨迹速度失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 设置轨迹速度因子
   * @param id 轨迹ID
   * @param speedFactor 速度因子
   * @returns 是否成功
   */
  public setTrackSpeedFactor(id: string, speedFactor: number): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置轨迹速度因子
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.setTrackSpeedFactor === 'function') {
          const result = impl.setTrackSpeedFactor(id, speedFactor);
          if (!result) {
            this.log('warn', `设置轨迹速度因子 "${id}" 在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `设置轨迹速度因子 "${id}" 在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 获取轨迹速度因子
   * @param id 轨迹ID
   * @returns 速度因子或null
   */
  public getTrackSpeedFactor(id: string): number | null {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return null;
    }
    
    return this.activeImplementation.getTrackSpeedFactor(id);
  }
  
  /**
   * 设置轨迹播放器配置
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否成功
   */
  public setTrackPlayer(id: string, player: Partial<TrackPlayer>): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置轨迹播放器配置
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.setTrackPlayer === 'function') {
          const result = impl.setTrackPlayer(id, player);
          if (!result) {
            this.log('warn', `设置轨迹播放器配置 "${id}" 在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `设置轨迹播放器配置 "${id}" 在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 更新轨迹播放器配置
   * @param id 轨迹ID
   * @param player 播放器配置
   * @returns 是否成功
   */
  public updateTrackPlayer(id: string, player: Partial<TrackPlayer>): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现更新轨迹播放器配置
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.updateTrackPlayer === 'function') {
          const result = impl.updateTrackPlayer(id, player);
          if (!result) {
            this.log('warn', `更新轨迹播放器配置 "${id}" 在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `更新轨迹播放器配置 "${id}" 在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 设置轨迹节点可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodesVisible(id: string, visible: boolean): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置轨迹节点可见性
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.setTrackNodesVisible === 'function') {
          const result = impl.setTrackNodesVisible(id, visible);
          if (!result) {
            this.log('warn', `设置轨迹节点可见性失败，在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `设置轨迹节点可见性失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 设置轨迹节点弹出框可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodePopoversVisible(id: string, visible: boolean): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置轨迹节点弹出框可见性
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.setTrackNodePopoversVisible === 'function') {
          const result = impl.setTrackNodePopoversVisible(id, visible);
          if (!result) {
            this.log('warn', `设置轨迹节点弹出框可见性失败，在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `设置轨迹节点弹出框可见性失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 设置轨迹节点时间可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodeTimeVisible(id: string, visible: boolean): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置轨迹节点时间可见性
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.setTrackNodeTimeVisible === 'function') {
          const result = impl.setTrackNodeTimeVisible(id, visible);
          if (!result) {
            this.log('warn', `设置轨迹节点时间可见性失败，在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `设置轨迹节点时间可见性失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 设置移动点名称可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setMovingPointNameVisible(id: string, visible: boolean): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置移动点名称可见性
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.setMovingPointNameVisible === 'function') {
          const result = impl.setMovingPointNameVisible(id, visible);
          if (!result) {
            this.log('warn', `设置移动点名称可见性失败，在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `设置移动点名称可见性失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 设置轨迹速度弹出框可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackSpeedPopoversVisible(id: string, visible: boolean): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置轨迹速度弹出框可见性
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.setTrackSpeedPopoversVisible === 'function') {
          const result = impl.setTrackSpeedPopoversVisible(id, visible);
          if (!result) {
            this.log('warn', `设置轨迹速度弹出框可见性失败，在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `设置轨迹速度弹出框可见性失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 设置轨迹节点速度可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodeSpeedsVisible(id: string, visible: boolean): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置轨迹节点速度可见性
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.setTrackNodeSpeedsVisible === 'function') {
          const result = impl.setTrackNodeSpeedsVisible(id, visible);
          if (!result) {
            this.log('warn', `设置轨迹节点速度可见性失败，在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `设置轨迹节点速度可见性失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 设置轨迹节点锚点可见性
   * @param id 轨迹ID
   * @param visible 是否可见
   * @returns 是否成功
   */
  public setTrackNodeAnchorsVisible(id: string, visible: boolean): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 记录整体操作结果
    let overallResult = true;
    
    // 对所有实现设置轨迹节点锚点可见性
    this.implementations.forEach(impl => {
      try {
        if (typeof impl.setTrackNodeAnchorsVisible === 'function') {
          const result = impl.setTrackNodeAnchorsVisible(id, visible);
          if (!result) {
            this.log('warn', `设置轨迹节点锚点可见性失败，在实现 ${impl.getName()} 中失败`);
            overallResult = false;
          }
        }
      } catch (error) {
        this.log('error', `设置轨迹节点锚点可见性失败，在实现 ${impl.getName()} 中失败`, error);
        overallResult = false;
      }
    });
    
    return overallResult;
  }
  
  /**
   * 适应轨迹到视图
   * @param id 轨迹ID
   * @param options 选项
   * @returns 是否成功
   */
  public fitTrackToView(id: string, options?: any): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 尝试执行轨迹适应到视图的操作
    try {
      if (typeof this.activeImplementation.fitTrackToView === 'function') {
        this.activeImplementation.fitTrackToView(id, options);
        return true;
      }
    } catch (error) {
      this.log('error', `适应轨迹到视图失败，在实现 ${this.activeImplementation.getName()} 中失败`, error);
      return false;
    }
    
    return false;
  }
  
  /**
   * 获取轨迹播放状态
   * @param id 轨迹ID
   * @returns 轨迹播放状态或null
   */
  public getTrackPlayState(id: string): TrackPlayState | null {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return null;
    }
    
    return this.activeImplementation.getTrackPlayState(id);
  }
  
  /**
   * 通过ID选择轨迹
   * @param id 轨迹ID
   * @param options 选项
   * @returns 是否成功
   */
  public selectTrack(id: string, options?: { clearOthers?: boolean; autoPlay?: boolean }): boolean {
    if (!this.activeImplementation) {
      this.log('error', '没有活动的轨迹实现');
      return false;
    }
    
    // 在活动实现中选择轨迹
    return this.activeImplementation.selectTrack(id, options);
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

/**
 * 创建轨迹管理器
 * @param mapInstance 地图实例
 * @param config 轨迹配置
 * @param defaultImplType 默认实现类型
 * @returns 轨迹管理器实例
 */
export function createTrackManager(
  mapInstance?: OlMap,
  config?: TrackConfig,
  defaultImplType: TrackImplementationType = TrackImplementationType.DEFAULT
): TrackManager {
  return new TrackManager(mapInstance || null, config, defaultImplType);
} 