import type { MapType } from "./map";
import type { CoordSystem } from "./coordinate";
import { ApiUrls } from './api';

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
  
  // 导航相关属性
  isOrigin?: boolean;
  isDestination?: boolean;
  navigationRole?: 'origin' | 'destination';
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
 * 搜索类型枚举
 */
export enum SearchType {
  KEYWORD = 'keyword',    // 关键词搜索
  POI = 'poi',            // 兴趣点搜索
  ADDRESS = 'address',    // 地址搜索
  COORDINATE = 'coordinate', // 坐标搜索
  NEARBY = 'nearby',      // 附近搜索
  DISTRICT = 'district',  // 行政区划搜索
  NAVIGATION = 'navigation', // 导航搜索
  CUSTOM = 'custom'       // 自定义搜索
}

/**
 * 搜索类型配置接口
 */
export interface SearchTypeConfig {
  type: SearchType;     // 搜索类型
  label: string;        // 显示标签
  placeholder?: string; // 占位文本
  icon?: string;        // 图标
  apiUrl?: string;      // 该类型的API URL
  handler?: (keyword: string, options: SearchOptions) => Promise<SearchResult[]>; // 自定义处理函数
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
  key?: string;
  mapType: MapType;
  apiUrls?: ApiUrls;
  /** @deprecated 使用 apiUrls.search 代替 */
  searchUrl?: string;
  /** @deprecated 使用 apiUrls.detail 代替 */
  detailUrl?: string;
  /** @deprecated 使用 apiUrls.navigation 代替 */
  navigationUrl?: string;
  markerIcon?: any;
  
  // 新增字段
  showTypeSelector?: boolean;                // 是否显示类型选择器
  defaultSearchType?: SearchType;            // 默认搜索类型
  searchTypes?: SearchTypeConfig[];          // 支持的搜索类型列表
  customSearchHandler?: (type: SearchType, keyword: string, options: SearchOptions) => Promise<SearchResult[]>; // 自定义搜索处理函数
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
