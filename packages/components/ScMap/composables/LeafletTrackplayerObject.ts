/**
 * Leaflet轨迹播放器对象
 * @description 提供基于Leaflet的轨迹播放功能
 */
import { TrackObject } from './TrackObject';
import { MapObject } from './MapObject';
import type { TrackPlayerEventHandler } from '../types/trackplayer';
import logger from './LogObject';

/**
 * Leaflet轨迹播放器对象类
 */
export class LeafletTrackplayerObject extends TrackObject {
  // 轨迹播放器控件
  public trackplayerControl: any = null;
  // 事件处理器
  private eventHandler: TrackPlayerEventHandler | null = null;
  
  /**
   * 构造函数
   * @param mapObj 地图对象
   * @param eventHandler 事件处理器
   */
  constructor(mapObj: MapObject, eventHandler?: TrackPlayerEventHandler) {
    super(mapObj.getMapInstance());
    this.eventHandler = eventHandler || null;
    this.initTrackplayer();
  }
  
  /**
   * 初始化轨迹播放器
   */
  public initTrackplayer(): void {
    try {
      // 初始化轨迹播放器代码
      logger.debug('Leaflet轨迹播放器初始化');
      
      // 添加轨迹播放器控件到地图
      this.trackplayerControl = {}; // 这里应该是实际的控件实例化代码
      
      // 触发初始化完成事件
      this.triggerEvent('trackplayer-init', {
        message: 'Leaflet轨迹播放器初始化完成'
      });
    } catch (error) {
      logger.error('初始化Leaflet轨迹播放器失败:', error);
    }
  }
  
  /**
   * 触发事件
   * @param eventName 事件名称
   * @param payload 事件数据
   */
  private triggerEvent(eventName: string, payload: any): void {
    if (this.eventHandler) {
      this.eventHandler(eventName, payload);
    }
  }
  
  /**
   * 重写销毁方法
   */
  override destroy(): void {
    // 先调用父类的销毁方法
    super.destroy();
    
    // 销毁轨迹播放器控件
    if (this.trackplayerControl) {
      // 销毁控件的代码
      this.trackplayerControl = null;
    }
    
    // 移除事件处理器
    this.eventHandler = null;
    
    logger.debug('Leaflet轨迹播放器已销毁');
  }
} 