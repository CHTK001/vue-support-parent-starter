import type { MapType } from "./map";
import type { CoordSystem } from "./coordinate";

/**
* 搜索结果接口
*/
export interface SearchResult {
  id: string;
  name: string;
  address: string;
  location: {
    lng: number;
    lat: number;
    epsg3857?: {
      lng: number;
      lat: number;
    };
  };
  province?: string;
  city?: string;
  district?: string;
  type: string;
  icon?: string;
  tel?: string;
  distance?: number;
  score?: number;
  photos?: string[];
  provider?: string;
  rawData?: any;
}

/**
 * 搜索选项接口
 */
export interface SearchOptions {
  city?: string;
  type?: string;
  radius?: number;
  page?: number;
  pageSize?: number;
  extensions?: 'base' | 'all';
  key?: string;
  url?: string;
  cityLimit?: boolean;
  pageIndex?: number;
}

/**
 * 搜索API响应接口
 */
export interface SearchApiResponse {
  code: number;
  message: string;
  data: {
    list: SearchResult[];
    total: number;
  };
}

/**
 * 地点详情API响应接口
 */
export interface PlaceDetailApiResponse {
  code: number;
  message: string;
  data: SearchResult;
  [key: string]: any; // 允许其他字段
}

/**
 * 搜索框配置接口
 */
export interface SearchBoxConfig {
  type: 'input' | 'select';
  placeholder: string;
  debounceTime: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  projection: CoordSystem;
  mapType: MapType;
  searchUrl: string;
  detailUrl?: string;
  navigationUrl?: string;
  markerIcon?: any;
}

/**
 * 导航API响应接口
 */
export interface NavigationApiResponse {
  code?: number;
  message?: string;
  status?: string | number;
  info?: string;
  data?: {
    distance: number;
    duration: number;
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
      path: Array<[number, number]>;
    }>;
  };
  route?: any;
  result?: any;
  [key: string]: any; // 允许其他字段
}

// 添加默认导出，使用类型断言
export default {} as {
  SearchResult: typeof SearchResult;
  SearchOptions: typeof SearchOptions;
  SearchApiResponse: typeof SearchApiResponse;
  PlaceDetailApiResponse: typeof PlaceDetailApiResponse;
  SearchBoxConfig: typeof SearchBoxConfig;
  NavigationApiResponse: typeof NavigationApiResponse;
};