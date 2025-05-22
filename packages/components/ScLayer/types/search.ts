import type { MapType } from ".";
import type { CoordSystem } from "../utils/coordUtils";

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
  };
  type: string;
  icon?: string;
  distance?: number;
  score?: number;
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
}

/**
 * 导航API响应接口
 */
export interface NavigationApiResponse {
  code: number;
  message: string;
  data: {
    distance: number;
    duration: number;
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
      path: Array<[number, number]>;
    }>;
  };
}