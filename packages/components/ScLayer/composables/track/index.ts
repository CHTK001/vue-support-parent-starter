/**
 * 轨迹模块入口
 * @description 导出轨迹相关的类和函数
 */

// 导出接口和枚举
export { TrackPlayState, TrackImplementationType } from './ITrackImplementation';
export type { ITrackImplementation } from './ITrackImplementation';

// 导出轨迹实现类
export { DefaultTrackImpl } from './implementations/DefaultTrackImpl';
export { OlExtTrackImpl } from './implementations/OlExtTrackImpl';

// 导出轨迹管理器
export { 
  TrackManager,
  createTrackManager
} from './TrackManager';

// 导出工厂函数
import { Map as OlMap } from 'ol';
import { TrackConfig } from '../../types/track';
import { TrackManager, createTrackManager } from './TrackManager';
import { TrackImplementationType } from './ITrackImplementation';

/**
 * 创建默认轨迹管理器
 * @param mapInstance 地图实例
 * @param config 轨迹配置
 * @returns 轨迹管理器实例
 */
export function createDefaultTrackManager(
  mapInstance?: OlMap,
  config?: TrackConfig
): TrackManager {
  return createTrackManager(mapInstance, config, TrackImplementationType.DEFAULT);
}

/**
 * 创建基于ol-ext的轨迹管理器
 * @param mapInstance 地图实例
 * @param config 轨迹配置
 * @returns 轨迹管理器实例
 */
export function createOlExtTrackManager(
  mapInstance?: OlMap,
  config?: TrackConfig
): TrackManager {
  return createTrackManager(mapInstance, config, TrackImplementationType.OL_EXT);
} 