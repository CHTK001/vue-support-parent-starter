import { MapType } from './map';

/**
 * API URL 接口
 * 统一管理所有组件使用的 API URL
 */
export interface ApiUrls {
  // 搜索相关 API
  search?: string;       // 搜索 API
  detail?: string;       // 详情 API
  navigation?: string;   // 导航 API
  
  // 区划边界相关 API
  boundary?: string;     // 边界数据 API
  district?: string;     // 行政区划树 API
}

export const DEFAULT_API_URLS: Record<MapType, ApiUrls>;

/**
 * 合并自定义 API URL 与默认 URL
 * @param mapType 地图类型
 * @param customUrls 自定义 URL
 * @returns 合并后的 URL 对象
 */
export function mergeApiUrls(mapType: MapType, customUrls?: Partial<ApiUrls>): ApiUrls;

declare const _default: {
  DEFAULT_API_URLS: Record<MapType, ApiUrls>;
  mergeApiUrls: typeof mergeApiUrls;
};

export default _default; 