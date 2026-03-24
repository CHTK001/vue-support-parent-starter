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
  
  // 导航相关 API
  navigation?: string;   // 导航 API（默认驾车）
  
  // 路径规划相关 API
  router?: {
    driving?: string;    // 驾车路径规划
    walking?: string;    // 步行路径规划
    bicycling?: string;  // 骑行路径规划
    ebike?: string;      // 电动车路径规划
    transit?: string;    // 公交路径规划
  };
  
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
    router: {
      driving: 'https://restapi.amap.com/v3/direction/driving',
      walking: 'https://restapi.amap.com/v3/direction/walking',
      bicycling: 'https://restapi.amap.com/v3/direction/bicycling',
      ebike: 'https://restapi.amap.com/v3/direction/ebike',
      transit: 'https://restapi.amap.com/v3/direction/transit/integrated'
    },
    boundary: 'https://restapi.amap.com/v3/config/district',
    district: undefined
  },
  [MapType.BAIDU]: {
    search: 'https://api.map.baidu.com/place/v2/search',
    detail: 'https://api.map.baidu.com/place/v2/detail',
    navigation: 'https://api.map.baidu.com/directionlite/v1/driving',
    router: {
      driving: 'https://api.map.baidu.com/direction/v2/driving',
      walking: 'https://api.map.baidu.com/direction/v2/walking',
      bicycling: 'https://api.map.baidu.com/direction/v2/riding',
      ebike: 'https://api.map.baidu.com/direction/v2/riding',
      transit: 'https://api.map.baidu.com/direction/v2/transit'
    },
    boundary: 'https://api.map.baidu.com/api_region_search/v1/search',
    district: 'https://api.map.baidu.com/api_region_search/v1/search'
  },
  [MapType.TIANDITU]: {
    search: 'https://api.tianditu.gov.cn/search',
    detail: 'https://api.tianditu.gov.cn/search',
    navigation: 'https://api.tianditu.gov.cn/drive',
    router: {
      driving: 'https://api.tianditu.gov.cn/drive',
      walking: 'https://api.tianditu.gov.cn/walk',
      bicycling: 'https://api.tianditu.gov.cn/ride',
      ebike: 'https://api.tianditu.gov.cn/ride',
      transit: 'https://api.tianditu.gov.cn/transit'
    },
    boundary: 'https://api.tianditu.gov.cn/administrative',
    district: 'https://api.tianditu.gov.cn/administrative'
  },
  [MapType.GOOGLE]: {
    search: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
    detail: 'https://maps.googleapis.com/maps/api/place/details/json',
    navigation: 'https://maps.googleapis.com/maps/api/directions/json',
    router: {
      driving: 'https://maps.googleapis.com/maps/api/directions/json?mode=driving',
      walking: 'https://maps.googleapis.com/maps/api/directions/json?mode=walking',
      bicycling: 'https://maps.googleapis.com/maps/api/directions/json?mode=bicycling',
      ebike: 'https://maps.googleapis.com/maps/api/directions/json?mode=bicycling',
      transit: 'https://maps.googleapis.com/maps/api/directions/json?mode=transit'
    },
    boundary: 'https://maps.googleapis.com/maps/api/geocode/json',
    district: 'https://maps.googleapis.com/maps/api/geocode/json'
  },
  [MapType.OSM]: {
    search: 'https://nominatim.openstreetmap.org/search',
    detail: 'https://nominatim.openstreetmap.org/details',
    navigation: 'https://routing.openstreetmap.de/routed-car/route/v1',
    router: {
      driving: 'https://routing.openstreetmap.de/routed-car/route/v1',
      walking: 'https://routing.openstreetmap.de/routed-foot/route/v1',
      bicycling: 'https://routing.openstreetmap.de/routed-bike/route/v1',
      ebike: 'https://routing.openstreetmap.de/routed-bike/route/v1',
      transit: 'https://routing.openstreetmap.de/routed-public/route/v1'
    },
    boundary: 'https://nominatim.openstreetmap.org/search',
    district: 'https://nominatim.openstreetmap.org/search'
  },
  [MapType.BING]: {
    search: 'https://dev.virtualearth.net/REST/v1/LocalSearch',
    detail: 'https://dev.virtualearth.net/REST/v1/Locations',
    navigation: 'https://dev.virtualearth.net/REST/v1/Routes',
    router: {
      driving: 'https://dev.virtualearth.net/REST/v1/Routes/Driving',
      walking: 'https://dev.virtualearth.net/REST/v1/Routes/Walking',
      bicycling: 'https://dev.virtualearth.net/REST/v1/Routes/Cycling',
      ebike: 'https://dev.virtualearth.net/REST/v1/Routes/Cycling',
      transit: 'https://dev.virtualearth.net/REST/v1/Routes/Transit'
    },
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
    router: {
      ...defaultUrls.router,
      ...(customUrls.router || {})
    },
    boundary: customUrls.boundary || defaultUrls.boundary,
    district: customUrls.district || defaultUrls.district
  };
}

export default {
  DEFAULT_API_URLS,
  mergeApiUrls
}; 