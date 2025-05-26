/**
 * API URL 接口定义
 * @description 定义所有组件可能使用的 API URL
 */
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

/**
 * 地图类型对应的默认 API URL
 */
export const DEFAULT_API_URLS: Record<MapType, ApiUrls> = {
  [MapType.GAODE]: {
    search: 'https://restapi.amap.com/v3/place/text',
    detail: 'https://restapi.amap.com/v3/place/detail',
    navigation: 'https://restapi.amap.com/v3/direction/driving',
    boundary: 'https://restapi.amap.com/v3/config/district',
    district: 'https://restapi.amap.com/v3/config/district'
  },
  [MapType.BAIDU]: {
    search: 'https://api.map.baidu.com/place/v2/search',
    detail: 'https://api.map.baidu.com/place/v2/detail',
    navigation: 'https://api.map.baidu.com/directionlite/v1/driving',
    boundary: 'https://api.map.baidu.com/api_region_search/v1/search',
    district: 'https://api.map.baidu.com/api_region_search/v1/search'
  },
  [MapType.TIANDITU]: {
    search: 'https://api.tianditu.gov.cn/search',
    detail: 'https://api.tianditu.gov.cn/search',
    navigation: 'https://api.tianditu.gov.cn/drive',
    boundary: 'https://api.tianditu.gov.cn/administrative',
    district: 'https://api.tianditu.gov.cn/administrative'
  },
  [MapType.GOOGLE]: {
    search: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
    detail: 'https://maps.googleapis.com/maps/api/place/details/json',
    navigation: 'https://maps.googleapis.com/maps/api/directions/json',
    boundary: 'https://maps.googleapis.com/maps/api/geocode/json',
    district: 'https://maps.googleapis.com/maps/api/geocode/json'
  },
  [MapType.OSM]: {
    search: 'https://nominatim.openstreetmap.org/search',
    detail: 'https://nominatim.openstreetmap.org/details',
    navigation: 'https://routing.openstreetmap.de/routed-car/route/v1',
    boundary: 'https://nominatim.openstreetmap.org/search',
    district: 'https://nominatim.openstreetmap.org/search'
  },
  [MapType.BING]: {
    search: 'https://dev.virtualearth.net/REST/v1/LocalSearch',
    detail: 'https://dev.virtualearth.net/REST/v1/Locations',
    navigation: 'https://dev.virtualearth.net/REST/v1/Routes',
    boundary: 'https://dev.virtualearth.net/REST/v1/Geography/AdminDivision',
    district: 'https://dev.virtualearth.net/REST/v1/Geography/AdminDivision'
  }
};

/**
 * 合并自定义 API URL 与默认 URL
 * @param mapType 地图类型
 * @param customUrls 自定义 URL
 * @returns 合并后的 URL 对象
 */
export function mergeApiUrls(mapType: MapType, customUrls?: Partial<ApiUrls>): ApiUrls {
  // 获取指定地图类型的默认 URL
  const defaultUrls = DEFAULT_API_URLS[mapType] || DEFAULT_API_URLS[MapType.GAODE];
  
  // 如果没有自定义 URL，直接返回默认 URL
  if (!customUrls) {
    return { ...defaultUrls };
  }
  
  // 合并自定义 URL 与默认 URL
  return {
    search: customUrls.search || defaultUrls.search,
    detail: customUrls.detail || defaultUrls.detail,
    navigation: customUrls.navigation || defaultUrls.navigation,
    boundary: customUrls.boundary || defaultUrls.boundary,
    district: customUrls.district || defaultUrls.district
  };
}

export default {
  DEFAULT_API_URLS,
  mergeApiUrls
}; 