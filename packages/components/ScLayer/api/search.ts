/**
 * 搜索API实现 - JSONP版本
 */
import type { SearchResult, SearchOptions, SearchApiResponse, PlaceDetailApiResponse, NavigationApiResponse, SearchBoxConfig } from '../types/search';
import type { ConfigObject } from '../composables/ConfigObject';
import { indexedDBProxy } from '@repo/utils';

/**
 * 过滤无效参数
 * @param params 参数对象
 * @returns 过滤后的参数对象
 */
function filterValidParams(params: Record<string, any>): Record<string, any> {
  return Object.entries(params).reduce((acc, [key, value]) => {
    // 过滤掉 undefined、null、空字符串、空数组
    if (value !== undefined && value !== null && value !== '' && 
        !(Array.isArray(value) && value.length === 0)) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
}

/**
 * JSONP请求工具函数
 * @param url 请求URL
 * @param params 请求参数
 * @returns Promise<any>
 */
function jsonp(url: string, params: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    // 生成回调函数名
    const callbackName = 'jsonp_' + Math.random().toString(36).substr(2, 5);
    
    // 过滤无效参数并构建完整URL
    const validParams = filterValidParams(params);
    const queryString = Object.keys(validParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(validParams[key])}`)
      .join('&');
    
    const fullUrl = `${url}?${queryString}&callback=${callbackName}`;
    
    // 创建script标签
    const script = document.createElement('script');
    script.src = fullUrl;
    
    // 定义全局回调函数
    window[callbackName] = (data: any) => {
      // 清理
      document.body.removeChild(script);
      delete window[callbackName];
      resolve(data);
    };
    
    // 错误处理
    script.onerror = () => {
      document.body.removeChild(script);
      delete window[callbackName];
      reject(new Error('JSONP请求失败'));
    };
    
    // 添加到文档
    document.body.appendChild(script);
  });
}

// 缓存配置
const CACHE_DB_NAME = 'map-search-cache';
const CACHE_STORE_NAME = 'search-results';
const CACHE_EXPIRE_TIME = 5 * 60 * 1000; // 5分钟过期

// 缓存项接口
interface CacheItem {
  key: string;
  value: {
    keyword: string;
    options: any;
    results: any[];
    timestamp: number;
  };
}

// 初始化缓存数据库
const initCacheDB = async () => {
  try {
    const db = await indexedDBProxy();
    await db.setItem(CACHE_DB_NAME, {
      key: CACHE_STORE_NAME,
      value: {
        keyword: '',
        options: {},
        results: [],
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('初始化缓存数据库失败:', error);
  }
};

// 生成缓存键
const generateCacheKey = (keyword: string, options: any): string => {
  const keyOptions = {
    city: options.city,
    type: options.type,
    radius: options.radius,
    page: options.page,
    pageSize: options.pageSize
  };
  return `${keyword}:${JSON.stringify(keyOptions)}`;
};

// 获取缓存
const getFromCache = async (keyword: string, options: any): Promise<any[] | null> => {
  try {
    const db = await indexedDBProxy();
    const cacheKey = generateCacheKey(keyword, options);
    const cacheItem = await db.getItem<CacheItem>(cacheKey);
    
    if (cacheItem) {
      const now = Date.now();
      if (now - cacheItem.value.timestamp < CACHE_EXPIRE_TIME) {
        console.log('使用缓存的搜索结果:', cacheKey);
        return cacheItem.value.results;
      } else {
        // 删除过期缓存
        await db.removeItem(cacheKey);
      }
    }
    return null;
  } catch (error) {
    console.error('获取缓存失败:', error);
    return null;
  }
};

// 更新缓存
const updateCache = async (keyword: string, options: any, results: any[]): Promise<void> => {
  try {
    const db = await indexedDBProxy();
    const cacheKey = generateCacheKey(keyword, options);
    const cacheItem: CacheItem = {
      key: cacheKey,
      value: {
        keyword,
        options,
        results,
        timestamp: Date.now()
      }
    };
    
    await db.setItem(cacheKey, cacheItem);
    console.log('更新缓存:', {
      key: cacheKey,
      timestamp: new Date(cacheItem.value.timestamp).toLocaleTimeString()
    });
  } catch (error) {
    console.error('更新缓存失败:', error);
  }
};

// 初始化缓存数据库
initCacheDB();

/**
 * 搜索地点
 * @param keyword 搜索关键词
 * @param options 搜索选项
 */
export async function searchLocation(keyword: string, options: SearchOptions = {}, searchBoxConfig: SearchBoxConfig, configObject: ConfigObject): Promise<SearchResult[]> {
  try {
    // 检查缓存
    const cachedResults = await getFromCache(keyword, options);
    if (cachedResults) {
      return cachedResults;
    }

    const response = await jsonp(searchBoxConfig.searchUrl, {
      key: configObject.getConfig().mapKey[searchBoxConfig.mapType] || "GAODE",
      keywords: keyword,
      city: options.city,
      types: options.type,
      radius: options.radius,
      page: options.page,
      offset: options.pageSize,
      extensions: options.extensions || 'base'
    });

    if (response.status === '1') {
      const results = response.pois.map(poi => ({
        id: poi.id,
        name: poi.name,
        address: poi.address,
        location: {
          lng: parseFloat(poi.location.split(',')[0]),
          lat: parseFloat(poi.location.split(',')[1])
        },
        type: poi.type,
        distance: poi.distance ? parseInt(poi.distance) : undefined
      }));
      const gcoordObject = this.mapObject.getGcoordObject();
      const coord = gcoordObject.convertFromMapCoord({
        lat: results.location.lat,
        lng: results.location.lng
      }, searchBoxConfig.projection as any)
      results.location.lng = coord.lng;
      results.location.lng = coord.lng;
      // 更新缓存
      await updateCache(keyword, options, results);

      
      return results;
    }
    throw new Error(response.info);
  } catch (error) {
    console.error('搜索失败:', error);
    throw error;
  }
}

/**
 * 获取地点详情
 * @param id 地点ID
 */
export async function getPlaceDetail(id: string): Promise<SearchResult> {
  try {
    const response = await jsonp(`${AMAP_CONFIG.baseUrl}/place/detail`, {
      key: AMAP_CONFIG.key,
      id
    });

    if (response.status === '1') {
      const poi = response.poi;
      return {
        id: poi.id,
        name: poi.name,
        address: poi.address,
        location: {
          lng: parseFloat(poi.location.split(',')[0]),
          lat: parseFloat(poi.location.split(',')[1])
        },
        type: poi.type
      };
    }
    throw new Error(response.info);
  } catch (error) {
    console.error('获取地点详情失败:', error);
    throw error;
  }
}

/**
 * 获取导航路线
 * @param start 起点坐标
 * @param end 终点坐标
 */
export async function getNavigation(start: [number, number], end: [number, number]): Promise<any> {
  try {
    const response = await jsonp(`${AMAP_CONFIG.baseUrl}/direction/driving`, {
      key: AMAP_CONFIG.key,
      origin: start.join(','),
      destination: end.join(',')
    });

    if (response.status === '1') {
      return {
        distance: response.route.distance,
        duration: response.route.duration,
        steps: response.route.steps.map(step => ({
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration,
          path: step.tmcs.map(tmc => [parseFloat(tmc.location.split(',')[0]), parseFloat(tmc.location.split(',')[1])])
        }))
      };
    }
    throw new Error(response.info);
  } catch (error) {
    console.error('获取导航路线失败:', error);
    throw error;
  }
}