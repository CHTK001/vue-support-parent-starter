/**
 * 搜索对象类
 * @description 处理地图搜索相关功能
 */
import { ConfigObject } from './ConfigObject';
import { MapObject } from './MapObject';
import { MarkerObject } from './MarkerObject';
import { ShapeObject } from './ShapeObject';
import { SearchBoxConfig } from '../types/search';
import { SearchDataProviderFactory } from '../interfaces/SearchDataProvider';
import logger from './LogObject';
import { registerAllSearchProviders } from '../interfaces/providers';
import { SearchHandlerFactory } from '../interfaces/SearchHandler';
import { registerAllSearchHandlers } from '../interfaces/handlers';
import type { SearchResult, SearchOptions, SearchTypeConfig, PlaceDetailApiResponse, NavigationApiResponse } from '../types/search';
import { SearchType } from '../types/search';
import { fromLonLat } from 'ol/proj';
import { DEFAULT_END_ICON, DEFAULT_MARKER_ICON, DEFAULT_START_ICON } from '../types/default';
import { MapType } from '../types/map';
import { CoordSystem, type GeoPoint } from '../types/coordinate';
import { GcoordUtils } from '../utils/GcoordUtils';
import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';

// 在接口定义部分添加位置信息接口
interface ExtendedSearchOptions extends SearchOptions {
  location?: number[];
  mapType: MapType;
  city?: string; // 添加城市参数
  adcode?: string; // 添加区划编码参数
}

// 缓存项接口
interface CacheItem {
  keyword: string;
  options: SearchOptions;
  results: SearchResult[];
  timestamp: number;
  hash: string; // 用于快速比较的哈希值
  searchType: SearchType; // 添加搜索类型
}

export class SearchObject {
  // 地图实例
  private mapInstance: any = null;
  // 标记点对象
  private markerObject: MarkerObject | null = null;
  // 搜索结果标记
  private searchMarker: any = null;
  // 搜索结果标记列表 - 添加此属性来跟踪多个搜索结果标记
  private searchMarkers: Map<string, string> = new Map(); // 键是搜索结果ID，值是标记ID
  // 搜索结果列表
  private searchResults: SearchResult[] = [];
  // 搜索回调
  private searchCallback: ((results: SearchResult[]) => void) | null = null;
  // 选择回调
  private selectCallback: ((result: SearchResult) => void) | null = null;

  // 搜索框配置
  private searchBoxConfig: SearchBoxConfig;
  // 配置对象
  private configObject: ConfigObject;

  // 导航路线对象
  private navigationLine: any = null;
  // 地图
  private mapObj: MapObject = null;
  // 缓存配置
  private readonly CACHE_SIZE = 10; // 缓存大小
  private readonly CACHE_EXPIRE_TIME = 5 * 60 * 1000; // 缓存过期时间（5分钟）
  private searchCache: CacheItem[] = [];

  // 当前搜索类型
  private currentSearchType: SearchType;
  // 地图密钥
  private mapKey: Record<string, string>;

  // 在 SearchObject 类的属性部分添加 ShapeObject
  private shapeObject: ShapeObject | null = null;
  
  // 最后一次导航响应
  private _lastNavigationResponse: NavigationApiResponse | null = null;

  private navigationInfo: any = null;

  private searchDataProvider: any; // 添加搜索数据提供者属性

  // 类属性定义部分
  private navigationLineIds: string[] = [];
  private navigationMarkerIds: string[] = [];
  private navigationLayers: any[] = [];

  // 添加位置信息属性
  private locationInfo: {
    cityCode: string;
    adcode: string;
    province: string;
    city: string;
    district: string;
  } | null = null;

  constructor(
    mapInstance: any, 
    markerObject: MarkerObject, 
    searchBoxConfig: SearchBoxConfig, 
    configObject: ConfigObject, 
    mapObj: MapObject, 
    mapKey: Record<string, string>, 
    shapeObject?: ShapeObject,
    locationInfo?: {
      cityCode: string;
      adcode: string;
      province: string;
      city: string;
      district: string;
    } | null
  ) {
    this.mapInstance = mapInstance;
    this.mapObj = mapObj;
    this.markerObject = markerObject;
    this.searchBoxConfig = searchBoxConfig;
    this.configObject = configObject;
    this.mapKey = mapKey;
    this.shapeObject = shapeObject || null;
    this.locationInfo = locationInfo || null;
    
    // 设置当前搜索类型
    this.currentSearchType = searchBoxConfig.defaultSearchType || SearchType.KEYWORD;
    
    // 确保所有搜索提供者已注册
    registerAllSearchProviders();
    
    // 确保所有搜索处理器已注册
    registerAllSearchHandlers();

    // 初始化搜索数据提供者
    const mapType = this.configObject.getMapType();
    this.searchDataProvider = SearchDataProviderFactory.getProvider(mapType);
    if (!this.searchDataProvider) {
      console.error(`不支持的地图类型: ${mapType}`);
    }

    logger.debug('[SearchObject] 搜索对象已创建');
  }

  /**
   * 设置当前搜索类型
   * @param type 搜索类型
   */
  public setSearchType(type: SearchType): void {
    this.currentSearchType = type;
    logger.debug(`[SearchObject] 搜索类型已切换为: ${type}`);
  }

  /**
   * 获取当前搜索类型
   * @returns 当前搜索类型
   */
  public getCurrentSearchType(): SearchType {
    return this.currentSearchType;
  }

  /**
   * 获取搜索类型配置
   * @param type 搜索类型
   * @returns 搜索类型配置
   */
  public getSearchTypeConfig(type: SearchType): SearchTypeConfig | undefined {
    return this.searchBoxConfig.searchTypes?.find(config => config.type === type);
  }

  /**
   * 生成缓存键
   * @param keyword 搜索关键词
   * @param options 搜索选项
   * @param searchType 搜索类型
   * @returns 缓存键
   */
  private generateCacheKey(keyword: string, options: SearchOptions, searchType: SearchType): string {
    // 使用搜索处理器生成缓存键
    const handler = SearchHandlerFactory.getHandler(searchType);
    if (handler) {
      return handler.getCacheKey(keyword, options);
    }
    
    // 如果没有对应的处理器，使用默认方式生成缓存键
    // 提取关键选项
    const keyOptions = {
      city: options.city,
      type: options.type,
      radius: options.radius,
      page: options.page,
      pageSize: options.pageSize
    };
    
    // 生成缓存键，包含类型和关键词
    return `${searchType}:${keyword}:${JSON.stringify(keyOptions)}`;
  }

  /**
   * 执行搜索
   * @param keyword 搜索关键词
   * @param options 搜索选项
   * @param searchType 搜索类型（可选，默认使用当前搜索类型）
   */
  public async search(keyword: string, options: SearchBoxConfig, searchType?: SearchType): Promise<SearchResult[]> {
    // 使用指定的搜索类型，或当前搜索类型
    const type = searchType || this.currentSearchType;
    if(!options.key){
      options.key = this.mapKey[options?.mapType];
    }
    
    // 将 options 转换为 ExtendedSearchOptions 类型
    const extendedOptions = options as unknown as ExtendedSearchOptions;
    
    // 如果有位置信息，添加到搜索选项中
    if (this.locationInfo && !extendedOptions.city) {
      extendedOptions.city = this.locationInfo.cityCode || this.locationInfo.adcode;
      logger.debug(`[SearchObject] 添加城市参数到搜索选项: ${extendedOptions.city}`);
    }
    
    this.updateOptions(options);
    try {
      // 获取搜索类型配置
      const typeConfig = this.getSearchTypeConfig(type);
      
      // 获取搜索处理器
      const handler = SearchHandlerFactory.getHandler(type);
      
      // 如果有处理器，尝试格式化输入
      if (handler && handler.formatInput) {
        keyword = handler.formatInput(keyword);
      }
      
      // 检查缓存
      const cachedResults = this.getFromCache(keyword, options, type);
      if (cachedResults) {
        logger.debug(`[SearchObject] 使用缓存的搜索结果，类型: ${type}`);
        this.searchResults = cachedResults;
        
        // 触发搜索回调
        if (this.searchCallback) {
          this.searchCallback(cachedResults);
        }
        
        // 清除之前的搜索结果标记并添加新的标记
        this.clearSearchMarkers();
        this.addSearchMarkers(cachedResults);
        
        return cachedResults;
      }

      // 根据搜索类型设置选项
      this.setOptionsBySearchType(type, keyword, extendedOptions);
      
      // 如果有搜索处理器，使用处理器处理搜索
      if (handler) {
        logger.debug(`[SearchObject] 使用搜索处理器进行搜索，类型: ${type}`);
        const results = await handler.handleSearch(keyword, options);
        
        // 更新缓存
        this.updateCache(keyword, options, results, type);
        
        this.searchResults = results;
        
        // 清除之前的搜索结果标记
        this.clearSearchMarkers();
        
        // 添加所有搜索结果的标记
        if (results.length > 0) {
          this.addSearchMarkers(results);
          // 可以选择是否立即定位到第一个结果
          // this.flyToLocation(results[0].location);
        }
        
        // 触发搜索回调
        if (this.searchCallback) {
          this.searchCallback(results);
        }
        
        return results;
      }
      
      // 特殊处理坐标搜索类型
      if (type === SearchType.COORDINATE && (options as any).coordinateResult) {
        const results = (options as any).coordinateResult;
      
      // 更新缓存
        this.updateCache(keyword, options, results, type);
      
      this.searchResults = results;
      
      // 清除之前的搜索结果标记
        this.clearSearchMarkers();
      
        // 添加所有搜索结果的标记
      if (results.length > 0) {
          this.addSearchMarkers(results);
          // 可以选择是否立即定位到第一个结果
          // this.flyToLocation(results[0].location);
      }
      
      // 触发搜索回调
      if (this.searchCallback) {
        this.searchCallback(results);
      }
      
      return results;
      }
      
      // 如果有自定义处理函数，使用自定义处理函数
      if (typeConfig?.handler) {
        logger.debug(`[SearchObject] 使用自定义处理函数进行搜索，类型: ${type}`);
        const results = await typeConfig.handler(keyword, options);
        
        // 更新缓存
        this.updateCache(keyword, options, results, type);
        
        this.searchResults = results;
        
        // 清除之前的搜索结果标记
        this.clearSearchMarkers();
        
        // 添加所有搜索结果的标记
        if (results.length > 0) {
          this.addSearchMarkers(results);
          // 可以选择是否立即定位到第一个结果
          // this.flyToLocation(results[0].location);
        }
        
        // 触发搜索回调
        if (this.searchCallback) {
          this.searchCallback(results);
        }
        
        return results;
      }
      
      // 使用对应的搜索数据提供者
      const provider = SearchDataProviderFactory.getProvider(options?.mapType?.toLowerCase() || 'gaode');
      if (!provider) {
        logger.error(`[SearchObject] 无法找到适用的搜索数据提供者: ${options?.mapType}`);
      return [];
      }
      
      // 根据SearchDataProvider接口定义的方式调用search方法
      const searchUrl = options.apiUrls?.search || options.searchUrl || this.searchBoxConfig.apiUrls?.search || this.searchBoxConfig.searchUrl || '';
      logger.debug(`[SearchObject] 使用搜索 URL: ${searchUrl}`);
      
      const results = await provider.search(searchUrl, keyword, options as SearchOptions);
      
      // 设置搜索结果
      this.searchResults = results;
      
      // 更新缓存
      this.updateCache(keyword, options as SearchOptions, results, type);
      
      // 清除之前的搜索结果标记
      this.clearSearchMarkers();
      
      // 添加所有搜索结果的标记
      if (results.length > 0) {
        this.addSearchMarkers(results);
        // 可以选择是否立即定位到第一个结果
        // this.flyToLocation(results[0].location);
      }
      
      // 触发搜索回调
      if (this.searchCallback) {
        this.searchCallback(results);
      }
      
      logger.debug(`[SearchObject] 搜索完成, 返回 ${results.length} 条结果`);
      return results;
    } catch (error) {
      logger.error('[SearchObject] 搜索过程出错', error);
      throw error;
    }
  }

  /**
   * 更新搜索选项
   * @param options 搜索选项
   */
  private updateOptions(options: SearchOptions): void {
    if (this.locationInfo) {
      options.city =  this.locationInfo.city || this.locationInfo.adcode;
    }
  }
  /**
   * 根据搜索类型设置搜索选项
   * @param type 搜索类型
   * @param keyword 搜索关键词
   * @param options 搜索选项
   */
  private setOptionsBySearchType(type: SearchType, keyword: string, options: ExtendedSearchOptions): void {
    // 如果有位置信息，添加到搜索选项中
    if (this.locationInfo) {
      options.city = options.city || this.locationInfo.cityCode || this.locationInfo.adcode;
      options.adcode = options.adcode || this.locationInfo.adcode;
    }

    // 根据搜索类型设置不同的选项
    switch (type) {
      case SearchType.KEYWORD:
        // 关键词搜索不需要特殊处理
        break;
      case SearchType.COORDINATE:
        // 坐标搜索处理
        try {
          // 尝试解析坐标字符串，支持多种格式：
          // "116.404,39.915" 或 "116.404 39.915" 或 "116.404，39.915"
          const coordStr = keyword.trim().replace(/，/g, ',').replace(/\s+/g, ',');
          const coords = coordStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
          
          if (coords.length >= 2) {
            const lng = coords[0];
            const lat = coords[1];
            
            // 验证坐标是否有效
            if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
              // 创建一个包含单个结果的搜索结果数组
              const result: SearchResult = {
                id: `coord-${Date.now()}`,
                name: `坐标 (${lng.toFixed(6)}, ${lat.toFixed(6)})`,
                address: `经度: ${lng.toFixed(6)}, 纬度: ${lat.toFixed(6)}`,
                location: {
                  lng,
                  lat
                },
                type: 'coordinate',
                provider: 'coordinate'
              };
              
              // 将结果存储在选项中，以便在search方法中使用
              (options as any).coordinateResult = [result];
            }
          }
        } catch (error) {
          logger.error(`[SearchObject] 解析坐标失败: ${error.message}`);
        }
        break;
      case SearchType.NEARBY:
        // 附近搜索需要设置位置信息
        if (!options.location) {
          // 如果没有提供位置，使用地图中心点
          const center = this.getMapCenter();
          if (center) {
            options.location = center;
          }
        }
        // 设置默认搜索半径（如果没有提供）
        if (!options.radius) {
          options.radius = 5000; // 默认 5 公里
        }
        break;
      case SearchType.DISTRICT:
        // 行政区划搜索，可能需要特殊处理
        break;
      case SearchType.CUSTOM:
        // 自定义搜索类型，由外部处理
        break;
      default:
        // 默认行为
        break;
    }
  }

  /**
   * 从缓存中获取搜索结果
   * @param keyword 搜索关键词
   * @param options 搜索选项
   * @param searchType 搜索类型
   * @returns 缓存的搜索结果或null
   */
  private getFromCache(keyword: string, options: SearchOptions, searchType: SearchType): SearchResult[] | null {
    const now = Date.now();
    const cacheKey = this.generateCacheKey(keyword, options, searchType);
    
    // 清理过期缓存
    this.searchCache = this.searchCache.filter(item => 
      now - item.timestamp < this.CACHE_EXPIRE_TIME
    );

    // 查找匹配的缓存项
    const cacheItem = this.searchCache.find(item => 
      item.hash === cacheKey && item.searchType === searchType
    );

    if (cacheItem) {
      logger.debug(`[SearchObject] 使用缓存的搜索结果: ${cacheKey}, 类型: ${searchType}`);
      // 更新缓存项的时间戳
      cacheItem.timestamp = now;
      // 将命中的缓存项移到最前面
      this.searchCache = [
        cacheItem,
        ...this.searchCache.filter(item => item.hash !== cacheKey)
      ];
    }

    return cacheItem ? cacheItem.results : null;
  }

  /**
   * 更新缓存
   * @param keyword 搜索关键词
   * @param options 搜索选项
   * @param results 搜索结果
   * @param searchType 搜索类型
   */
  private updateCache(keyword: string, options: SearchOptions, results: SearchResult[], searchType: SearchType): void {
    const now = Date.now();
    const cacheKey = this.generateCacheKey(keyword, options, searchType);
    
    // 创建新的缓存项
    const newCacheItem: CacheItem = {
      keyword,
      options,
      results,
      timestamp: now,
      hash: cacheKey,
      searchType
    };

    // 移除旧的相同缓存项
    this.searchCache = this.searchCache.filter(item => item.hash !== cacheKey);

    // 添加新缓存项到开头
    this.searchCache.unshift(newCacheItem);

    // 限制缓存大小
    if (this.searchCache.length > this.CACHE_SIZE) {
      this.searchCache.pop(); // 移除最旧的缓存项
    }
    
    logger.debug(`[SearchObject] 缓存已更新，当前缓存项数量: ${this.searchCache.length}`);
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.searchCache = [];
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): { 
    size: number; 
    items: Array<{
      keyword: string;
      timestamp: string;
      hash: string;
    }> 
  } {
    return {
      size: this.searchCache.length,
      items: this.searchCache.map(item => ({
        keyword: item.keyword,
        timestamp: new Date(item.timestamp).toLocaleString(),
        hash: item.hash
      }))
    };
  }

  /**
   * 飞行到指定位置
   * @param location 位置坐标
   * @param zoom 缩放级别
   */
  private flyToLocation(location: SearchResult['location'], zoom: number = 16): void {
    if (!this.mapInstance || !location) return;
    
    // 使用 EPSG:3857 坐标
    const coordinates = location.epsg3857 ? 
      [location.epsg3857.lng, location.epsg3857.lat] : 
      fromLonLat([location.lng, location.lat]);
    
    // 平滑移动到目标位置
    this.mapInstance.getView().animate({
      center: coordinates,
      zoom: zoom,
      duration: 1000
    });
  }

  /**
   * 选择搜索结果
   * @param result 搜索结果
   */
  public selectResult(result: SearchResult): void {
    if (!result) {
      return;
    }
    
    logger.debug(`[SearchObject] 选择搜索结果: ${result.name}`);
    
    // 查找对应的标记ID
    const markerId = this.searchMarkers.get(result.id);
    
    // 如果没有对应的标记，尝试添加一个
    if (!markerId) {
      logger.debug(`[SearchObject] 未找到结果标记，添加新标记`);
    this.addSearchMarker(result);
    } else if (this.markerObject) {
      // 获取当前标记
      const marker = this.markerObject.getMarker(markerId);
    
      if (marker) {
        // 定位到结果位置
    this.flyToLocation(result.location);
      }
    }
    
    // 触发选择回调
    if (this.selectCallback) {
      this.selectCallback(result);
    }
  }

  /**
   * 添加搜索结果标记点
   * @param result 搜索结果
   * @returns 标记点ID
   */
  public addSearchMarker(result: SearchResult): string | null {
    if (!this.markerObject || !this.mapInstance) {
      logger.warn('[SearchObject] 标记点对象或地图实例未初始化');
      return null;
    }
    
    // 确保结果有有效的位置
    if (!result.location || (typeof result.location.lng !== 'number' || typeof result.location.lat !== 'number')) {
      logger.warn('[SearchObject] 搜索结果缺少有效位置', result);
      return null;
    }
    
    try {
      // 创建默认图标，如果没有提供
      const defaultIcon = {
        url: result.icon || this.searchBoxConfig.markerIcon?.url || DEFAULT_MARKER_ICON,
        size: [32, 32],
        anchor: [16, 32],
        className: 'search-result-marker', // 添加自定义CSS类名
        label: {
          text: result.name,
          className: 'search-result-label', // 添加标签CSS类名
          offset: [0, -40], // 将标签放在图标上方
          minZoom: 10 // 在缩放级别10以上显示标签
        }
      };
      
      // 创建标记点选项
      const markerOptions: any = {
        position: {
          lng: result.location.lng,
          lat: result.location.lat,
          projection: this.searchBoxConfig.projection || CoordSystem.EPSG4326
        },
        icon: defaultIcon,
      title: result.name,
      content: `
        <div class="search-result-popup">
          <h3>${result.name}</h3>
          <p>${result.address || ''}</p>
          ${result.tel ? `<p>电话: ${result.tel}</p>` : ''}
            <div class="search-result-distance">
              ${result.distance ? `距离: ${(result.distance / 1000).toFixed(2)} 公里` : ''}
          </div>
        </div>
      `,
      clickable: true,
      draggable: false,
        data: result,
        group: 'search-results',
        zIndexOffset: 1000 // 使搜索结果标记位于其他标记之上
      };
      
      // 添加标记点
      const markerId = this.markerObject.addMarker(markerOptions);
      logger.debug(`[SearchObject] 添加搜索结果标记点: ${result.name}, ID: ${markerId}`);
      
      // 保存为当前搜索标记
    this.searchMarker = markerId;
    
      // 也在 searchMarkers 中保存对应关系
      this.searchMarkers.set(result.id, markerId);
    
    return markerId;
    } catch (error) {
      logger.error('[SearchObject] 添加搜索结果标记点失败', error);
      return null;
    }
  }

  /**
   * 添加所有搜索结果的标记点
   * @param results 搜索结果数组
   */
  public addSearchMarkers(results: SearchResult[]): void {
    if (!results || results.length === 0) {
      logger.debug('[SearchObject] 没有搜索结果需要添加标记');
      return;
    }
    
    logger.debug(`[SearchObject] 开始添加 ${results.length} 个搜索结果标记`);
    
    results.forEach((result, index) => {
      this.addSearchMarker(result);
    });
    
    // 如果有标记被添加，可以根据所有标记的范围调整地图视图
    if (this.searchMarkers.size > 0) {
      this.fitToSearchMarkersBounds();
    }
  }

  /**
   * 清除所有搜索结果标记
   */
  private clearSearchMarkers(): void {
    if (!this.markerObject) {
      return;
    }
    
    // 清除单个搜索标记
    if (this.searchMarker) {
      this.markerObject.removeMarker(this.searchMarker);
      this.searchMarker = null;
    }
    
    // 清除所有搜索结果标记
    this.searchMarkers.forEach((markerId, resultId) => {
      this.markerObject.removeMarker(markerId);
    });
    
    // 清空搜索标记映射
    this.searchMarkers.clear();
    
    logger.debug('[SearchObject] 已清除所有搜索结果标记');
  }

  /**
   * 调整地图视图以显示所有搜索结果标记
   */
  private fitToSearchMarkersBounds(): void {
    if (!this.markerObject || !this.mapInstance || this.searchMarkers.size === 0) {
      return;
    }
    
    // 获取所有搜索结果标记的位置
    interface GeoPointLike {
      lng: number;
      lat: number;
    }

    const positions: GeoPointLike[] = Array.from(this.searchMarkers.values())
      .map(markerId => {
        const marker = this.markerObject.getMarker(markerId);
        if (!marker || !marker.position) return null;
        
        // 确保返回的是经纬度对象格式
        let lng = 0;
        let lat = 0;
        
        if (typeof marker.position === 'object') {
          if ('lng' in marker.position && 'lat' in marker.position) {
            lng = Number(marker.position.lng);
            lat = Number(marker.position.lat);
          } else if (Array.isArray(marker.position) && marker.position.length >= 2) {
            lng = Number(marker.position[0]);
            lat = Number(marker.position[1]);
          }
        }
        
        return { lng, lat };
      })
      .filter((position): position is GeoPointLike => position !== null);
    
    if (positions.length === 0) {
      return;
    }
    
    // 如果只有一个标记，直接飞行到该位置
    if (positions.length === 1 && positions[0]) {
      this.flyToLocation({
        lng: positions[0].lng,
        lat: positions[0].lat
      });
      return;
    }
    
    // 计算包含所有标记的视图范围
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    positions.forEach(position => {
      if (position) {
        minLng = Math.min(minLng, position.lng);
        maxLng = Math.max(maxLng, position.lng);
        minLat = Math.min(minLat, position.lat);
        maxLat = Math.max(maxLat, position.lat);
      }
    });
    
    // 转换为EPSG:3857坐标
    const southWest = fromLonLat([Number(minLng), Number(minLat)]);
    const northEast = fromLonLat([Number(maxLng), Number(maxLat)]);
    
    // 计算边界范围
    const extent = [southWest[0], southWest[1], northEast[0], northEast[1]];
    
    // 添加一些边距
    const padding = 50; // 像素
    
    // 使用fit方法调整视图，带有动画效果
    this.mapInstance.getView().fit(extent, {
      padding: [padding, padding, padding, padding],
      duration: 1000
    });
    
    logger.debug('[SearchObject] 已调整地图视图以显示所有搜索结果标记');
  }

  /**
   * 设置搜索回调
   * @param callback 搜索回调函数
   */
  public onSearch(callback: (results: SearchResult[]) => void): void {
    this.searchCallback = callback;
  }

  /**
   * 设置选择回调
   * @param callback 选择回调函数
   */
  public onSelect(callback: (result: SearchResult) => void): void {
    this.selectCallback = callback;
  }

  /**
   * 获取搜索结果
   * @returns 搜索结果列表
   */
  public getSearchResults(): SearchResult[] {
    return this.searchResults;
  }

  /**
   * 清除搜索结果
   */
  public clearResults(): void {
    // 清除搜索结果
    this.searchResults = [];
    
    // 清除搜索结果标记
    this.clearSearchMarkers();
    
    // 清除导航线路
    this.clearNavigationLine();
    
    logger.debug('[SearchObject] 已清除搜索结果和标记');
  }

  /**
   * 设置配置对象
   * @param configObject 配置对象
   */
  public setConfigObject(configObject: ConfigObject): void {
    this.configObject = configObject;
  }

  /**
   * 处理搜索结果点击
   * @param result 搜索结果
   */
  private handleSearchResultClick(result: any): void {
    // 实现搜索结果点击逻辑
    // 此处代码略
  }

  /**
   * 获取地点详情
   * @param id 地点ID
   * @returns 地点详情
   */
  public async getPlaceDetail(id: string): Promise<PlaceDetailApiResponse> {
    try {
      // 获取地图类型
      const mapType = this.configObject.getMapType();
      
      // 获取搜索提供者
      const searchProvider = SearchDataProviderFactory.getProvider(mapType);
      if (!searchProvider) {
        throw new Error(`不支持的地图类型: ${mapType}`);
      }
      
      // 获取详情 URL
      let detailUrl = '';
      
      // 优先使用 apiUrls 中的 detail URL
      if (this.searchBoxConfig.apiUrls?.detail) {
        detailUrl = this.searchBoxConfig.apiUrls.detail;
      } else if (this.searchBoxConfig.detailUrl) {
        // 兼容旧版本
        detailUrl = this.searchBoxConfig.detailUrl;
      } else {
        // 使用默认详情 URL
        detailUrl = searchProvider.getDefaultDetailUrl();
      }
      
      // 获取详情
      return await searchProvider.getPlaceDetail(detailUrl, id);
    } catch (error) {
      logger.error(`[SearchObject] 获取地点详情失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 创建导航路线
   * @param startPointId 起点ID
   * @param endPointId 终点ID
   * @param transportType 交通方式
   */
  async createNavigation(startPointId: string, endPointId: string, transportType: string = 'driving'): Promise<any> {
    try {
      console.log('[SearchObject] 开始创建导航路线，参数:', { startPointId, endPointId, transportType });
      
      // 清除之前的导航路线
      this.clearNavigationLine();
      
      const startPoint = this.markerObject.getMarker(startPointId) ;
      const endPoint = this.markerObject.getMarker(endPointId);
      if (!startPoint || !endPoint) {
        const errorMsg = `起点或终点未找到: startPoint=${!!startPoint}, endPoint=${!!endPoint}`;
        console.error('[SearchObject]', errorMsg);
        throw new Error(errorMsg);
      }
      
      const startPosition = startPoint.position;
      const endPosition = endPoint.position;
      
      if (!startPosition || !endPosition) {
        const errorMsg = `起点或终点坐标无效: startPosition=${!!startPosition}, endPosition=${!!endPosition}`;
        console.error('[SearchObject]', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('[SearchObject] 起点坐标:', startPosition, '终点坐标:', endPosition);
      
      // 获取地图类型
      const mapType = this.configObject.getMapType();
      
      // 获取搜索提供者
      const searchProvider = SearchDataProviderFactory.getProvider(mapType);
      if (!searchProvider) {
        throw new Error(`不支持的地图类型: ${mapType}`);
      }
      
      // 获取API密钥
      const apiKey = this.mapKey[mapType] || '';
      
      // 获取导航URL，根据交通方式选择不同的URL
      let navigationUrl = '';
      
      // 首先检查配置中是否有特定交通方式的路由URL
      if (this.searchBoxConfig && this.searchBoxConfig.apiUrls && this.searchBoxConfig.apiUrls.router) {
        const routerUrls = this.searchBoxConfig.apiUrls.router;
        // 根据交通方式获取对应的URL
        if (transportType === 'driving' && routerUrls.driving) {
          navigationUrl = routerUrls.driving;
        } else if (transportType === 'walking' && routerUrls.walking) {
          navigationUrl = routerUrls.walking;
        } else if (transportType === 'bicycling' && routerUrls.bicycling) {
          navigationUrl = routerUrls.bicycling;
        } else if (transportType === 'ebike' && routerUrls.ebike) {
          navigationUrl = routerUrls.ebike;
        } else if (transportType === 'transit' && routerUrls.transit) {
          navigationUrl = routerUrls.transit;
        }
      }
      
      // 如果没有找到特定交通方式的URL，则使用默认导航URL
      if (!navigationUrl) {
        navigationUrl = searchProvider.getDefaultNavigationUrl(transportType);
        console.log(`[SearchObject] 使用默认导航URL: ${navigationUrl} 进行 ${transportType} 导航`);
      } else {
        console.log(`[SearchObject] 使用 ${transportType} 专用导航URL: ${navigationUrl}`);
      }
      // 调用搜索提供者的导航方法
      console.log('[SearchObject] 开始调用导航API');
      const response = await searchProvider.getNavigation(
        startPosition as [number, number],
        endPosition as [number, number],
        apiKey,
        navigationUrl,
        transportType,
        {
          //@ts-ignore
          city: startPoint?.rawData?.adcode,
          //@ts-ignore
          cityD: endPoint?.rawData?.adcode,
        }
      );
      
      console.log('[SearchObject] 导航API返回数据:', response);
      
      // 保存导航信息以便后续使用
      this.navigationInfo = response;
      this._lastNavigationResponse = response;
      
      // 检查返回的数据是否有效
      if (!response || !response.route || !response.route.paths || response.route.paths.length === 0) {
        console.error('[SearchObject] 导航API返回的数据无效，无法绘制路线');
        return response;
      }
      
      // 重置导航线路ID数组
      this.navigationLineIds = [];
      
      // 绘制所有导航路线
      if (response && response.route && response.route.paths && response.route.paths.length > 0) {
        console.log('[SearchObject] 开始绘制导航路线，共有', response.route.paths.length, '条路径');
        
        // 绘制主路线（选中状态）
        const mainPath = response.route.paths[0];
        console.log('[SearchObject] 绘制主路线，步骤数:', mainPath.steps?.length || 0);
        this.drawSimpleNavigationLine(mainPath, transportType, true);
        
        // 绘制备选路线（非选中状态）
        for (let i = 1; i < response.route.paths.length; i++) {
          const alterPath = response.route.paths[i];
          console.log('[SearchObject] 绘制备选路线', i, '，步骤数:', alterPath.steps?.length || 0);
          this.drawSimpleNavigationLine(alterPath, transportType, false);
        }
        
        // 调整地图视图以适应导航路径
        console.log('[SearchObject] 调整地图视图以适应导航路径');
        this.fitNavigationBounds(response);
      }
      
      return response;
    } catch (error) {
      console.error('创建导航路线失败:', error);
      throw error;
    }
  }

  /**
   * 获取导航信息
   * @returns 导航路线的详细信息
   */
  getNavigationInfo(): any {
    return this.navigationInfo;
  }

  /**
   * 绘制简单的导航线路
   * @param path 导航路径
   * @param transportType 交通方式
   * @param isSelected 是否为选中的路线
   */
  private drawSimpleNavigationLine(path: any, transportType: string, isSelected: boolean = true): void {
    try {
      console.log('[SearchObject] 开始绘制导航线路，交通方式:', transportType, '是否选中:', isSelected);
      console.log('[SearchObject] 路径数据:', path);
      
      // 收集所有坐标点
      const allPoints: Array<[number, number]> = [];
      
      // 处理路径中的所有步骤
      if (path.steps && path.steps.length > 0) {
        console.log('[SearchObject] 处理路径步骤，步骤数量:', path.steps.length);
        
        // 处理每个步骤
        path.steps.forEach((step: any, index: number) => {
          // 检查步骤中是否有 polyline 数据
          if (step.polyline) {
            // 解析折线坐标
            const points = this.parsePolyline(step.polyline);
            if (points && points.length > 0) {
              allPoints.push(...points);
            }
          } else if (step.path && typeof step.path === 'string') {
            // 某些 API 可能使用 path 而不是 polyline
            const points = this.parsePolyline(step.path);
            if (points && points.length > 0) {
              allPoints.push(...points);
            }
          } else if (step.coords && Array.isArray(step.coords)) {
            // 某些 API 可能直接提供坐标数组
            step.coords.forEach((coord: any) => {
              if (Array.isArray(coord) && coord.length >= 2) {
                allPoints.push([coord[0], coord[1]]);
              } else if (coord.lng !== undefined && coord.lat !== undefined) {
                allPoints.push([coord.lng, coord.lat]);
              }
            });
          } else if (step.tmcs && Array.isArray(step.tmcs)) {
            // 高德地图 API 可能使用 tmcs 数组
            step.tmcs.forEach((tmc: any) => {
              if (tmc.polyline) {
                const points = this.parsePolyline(tmc.polyline);
                if (points && points.length > 0) {
                  allPoints.push(...points);
                }
              }
            });
          }
        });
      } else if (path.polyline) {
        // 整个路径可能直接包含 polyline
        const points = this.parsePolyline(path.polyline);
        if (points && points.length > 0) {
          allPoints.push(...points);
        }
      } else if (path.path && typeof path.path === 'string') {
        // 整个路径可能直接包含 path
        const points = this.parsePolyline(path.path);
        if (points && points.length > 0) {
          allPoints.push(...points);
        }
      }
      
      console.log('[SearchObject] 收集到的总坐标点数量:', allPoints.length);
      
      // 如果有有效的坐标点，绘制路线
      if (allPoints.length > 0 && this.mapObj) {
        // 使用ShapeObject绘制路线
        if (this.shapeObject) {
          logger.debug(`[SearchObject] 使用ShapeObject绘制导航路线，坐标点数量: ${allPoints.length}`);
          
          // 确定路线颜色
          let lineColor = isSelected ? '#3370ff' : '#33a9ff'; // 选中深蓝色，未选中浅蓝色
          let lineWidth = isSelected ? 5 : 3; // 选中线宽5，未选中线宽3
          
          // 根据交通方式调整路线样式
          switch (transportType) {
            case 'driving':
              lineColor = isSelected ? '#3370ff' : '#a8c4ff'; // 蓝色
              lineWidth = isSelected ? 5 : 3;
              break;
            case 'walking':
              lineColor = isSelected ? '#33cc33' : '#a8e6a8'; // 绿色
              lineWidth = isSelected ? 4 : 3;
              break;
            case 'bicycling':
              lineColor = isSelected ? '#ff9900' : '#ffcc80'; // 橙色
              lineWidth = isSelected ? 4 : 3;
              break;
            case 'transit':
              lineColor = isSelected ? '#9933cc' : '#cc99e6'; // 紫色
              lineWidth = isSelected ? 5 : 3;
              break;
            default:
              lineColor = isSelected ? '#3370ff' : '#a8c4ff'; // 默认蓝色
              lineWidth = isSelected ? 5 : 3;
          }
          
          // 创建线段
          const segmentIds: string[] = [];
          
          try {
            // 使用ShapeObject的addLine方法添加线条
            console.log('[SearchObject] 调用 shapeObject.addLine 方法绘制路线');
            
            const lineOptions = {
              flowLine: isSelected, // 只有选中的路线才显示流动效果
              style: {
                stroke: {
                  color: lineColor,
                  width: lineWidth
                },
                fill: {
                  color: 'transparent'
                }
              },
              data: {
                type: 'navigation',
                transportType: transportType,
                distance: path.distance || 0,
                duration: path.duration || 0,
                isSelected: isSelected
              }
            };
            
            console.log('[SearchObject] 线路绘制选项:', lineOptions);
            
            const lineId = this.shapeObject.addLine(allPoints, lineOptions);
            
            if (lineId) {
              segmentIds.push(lineId);
              logger.debug(`[SearchObject] 导航路线已绘制，ID: ${lineId}, 类型: ${transportType}, 选中: ${isSelected}`);
              console.log(`[SearchObject] 导航路线已绘制，ID: ${lineId}, 类型: ${transportType}, 选中: ${isSelected}`);
            } else {
              logger.error('[SearchObject] 添加线路失败，返回的 lineId 无效');
              console.error('[SearchObject] 添加线路失败，返回的 lineId 无效');
            }
          } catch (err) {
            logger.error('[SearchObject] 调用 shapeObject.addLine 方法出错:', err);
            console.error('[SearchObject] 调用 shapeObject.addLine 方法出错:', err);
          }
          
          // 保存导航线信息
          if (isSelected) {
            this.navigationLine = {
              type: 'shape',
              segmentIds: segmentIds,
              transportType: transportType
            };
            
            console.log('[SearchObject] 已保存选中的导航线信息:', this.navigationLine);
            
            // 只为选中的路线添加起点和终点标记
            if (allPoints.length > 1) {
              this.addNavigationMarkers(allPoints[0], allPoints[allPoints.length - 1], transportType);
            }
          } else {
            // 将非选中路线的ID也添加到navigationLineIds中，以便后续清除
            this.navigationLineIds.push(...segmentIds);
            console.log('[SearchObject] 已保存非选中的导航线ID:', this.navigationLineIds);
          }
        } else {
          // ShapeObject未初始化，使用OpenLayers直接绘制
          console.warn('[SearchObject] ShapeObject未初始化，尝试使用OpenLayers直接绘制导航路线');
          
          try {
            // 确定路线颜色
            let lineColor = isSelected ? '#3370ff' : '#a8c4ff'; // 选中深蓝色，未选中浅蓝色
            let lineWidth = isSelected ? 5 : 3; // 选中线宽5，未选中线宽3
            
            // 根据交通方式调整路线样式
            switch (transportType) {
              case 'driving':
                lineColor = isSelected ? '#3370ff' : '#a8c4ff'; // 蓝色
                lineWidth = isSelected ? 5 : 3;
                break;
              case 'walking':
                lineColor = isSelected ? '#33cc33' : '#a8e6a8'; // 绿色
                lineWidth = isSelected ? 4 : 3;
                break;
              case 'bicycling':
                lineColor = isSelected ? '#ff9900' : '#ffcc80'; // 橙色
                lineWidth = isSelected ? 4 : 3;
                break;
              case 'transit':
                lineColor = isSelected ? '#9933cc' : '#cc99e6'; // 紫色
                lineWidth = isSelected ? 5 : 3;
                break;
              default:
                lineColor = isSelected ? '#3370ff' : '#a8c4ff'; // 默认蓝色
                lineWidth = isSelected ? 5 : 3;
            }
            
            // 转换坐标为EPSG:3857
            const transformedPoints = allPoints.map(point => {
              return fromLonLat([point[0], point[1]]);
            });
            
            // 创建线几何
            const lineGeometry = new LineString(transformedPoints);
            
            // 创建要素
            const lineFeature = new Feature({
              geometry: lineGeometry,
              properties: {
                type: 'navigation',
                transportType: transportType,
                distance: path.distance || 0,
                duration: path.duration || 0,
                isSelected: isSelected
              }
            });
            
            // 创建样式
            const lineStyle = new Style({
              stroke: new Stroke({
                color: lineColor,
                width: lineWidth
              })
            });
            
            // 应用样式
            lineFeature.setStyle(lineStyle);
            
            // 创建矢量源
            const vectorSource = new VectorSource({
              features: [lineFeature]
            });
            
            // 创建矢量图层
            const vectorLayer = new VectorLayer({
              source: vectorSource,
              zIndex: 100
            });
            
            // 添加到地图
            this.mapInstance.addLayer(vectorLayer);
            
            // 保存图层以便后续清除
            if (!this.navigationLayers) {
              this.navigationLayers = [];
            }
            this.navigationLayers.push(vectorLayer);
            
            console.log('[SearchObject] 使用OpenLayers直接绘制导航路线成功');
            
            // 如果是选中的路线，添加起点和终点标记
            if (isSelected && allPoints.length > 1) {
              this.addNavigationMarkers(allPoints[0], allPoints[allPoints.length - 1], transportType);
            }
          } catch (error) {
            console.error('[SearchObject] 使用OpenLayers直接绘制导航路线失败:', error);
          }
        }
      } else {
        console.warn('[SearchObject] 没有有效的坐标点或 mapObj 未初始化，无法绘制导航路线');
      }
    } catch (error) {
      logger.error(`[SearchObject] 绘制导航路线失败: ${error}`);
      console.error('[SearchObject] 绘制导航路线失败:', error);
    }
  }
  
  /**
   * 添加导航起点和终点标记
   * @param startPoint 起点坐标 [lng, lat]
   * @param endPoint 终点坐标 [lng, lat]
   * @param transportType 交通方式
   */
  private addNavigationMarkers(startPoint: [number, number], endPoint: [number, number], transportType: string): void {
    try {
      if (!this.markerObject) {
        logger.warn('[SearchObject] MarkerObject未初始化，无法添加导航标记');
        return;
      }
      
      // 清除之前的导航标记
      this.navigationMarkerIds.forEach(id => {
        this.markerObject.removeMarker(id);
      });
      this.navigationMarkerIds = [];
      
      // 起点标记
      const startMarkerId = this.markerObject.addMarker({
        position: [
          startPoint[0],
          startPoint[1]
        ] as [number, number],
        coordSystem: CoordSystem.WGS84,
        icon: DEFAULT_START_ICON,
        title: '起点',
        size: [16, 16],
        style: {
          anchor: [0.5, 1]
        },
        data: {
          type: 'navigation-marker',
          markerType: 'start',
          transportType: transportType
        }
      });
      
      if (startMarkerId) {
        this.navigationMarkerIds.push(startMarkerId);
      }
      
      // 终点标记
      const endMarkerId = this.markerObject.addMarker({
        position: [
          endPoint[0],
          endPoint[1]
        ] as [number, number],
        coordSystem: CoordSystem.WGS84,
        icon: DEFAULT_END_ICON,
        title: '终点',
        style: {
          anchor: [0.5, 1]
        },
        data: {
          type: 'navigation-marker',
          markerType: 'end',
          transportType: transportType
        }
      });
      
      if (endMarkerId) {
        this.navigationMarkerIds.push(endMarkerId);
      }
      
      logger.debug(`[SearchObject] 已添加导航起点和终点标记`);
    } catch (error) {
      logger.error(`[SearchObject] 添加导航标记失败: ${error}`);
    }
  }

  /**
   * 解析折线坐标字符串
   * @param polyline 折线坐标字符串
   * @returns 坐标点数组
   */
  private parsePolyline(polyline: string): Array<[number, number]> {
    try {
      // 检查输入是否有效
      if (!polyline || typeof polyline !== 'string') {
        console.error('[SearchObject] 无效的折线坐标字符串:', polyline);
        return [];
      }
      
      console.log('[SearchObject] 解析折线坐标字符串:', polyline.substring(0, 50) + (polyline.length > 50 ? '...' : ''));
      
      // 高德地图API返回的折线格式通常是"lng1,lat1;lng2,lat2;..."
      const points = polyline.split(';').map(point => {
        const [lng, lat] = point.split(',').map(Number);
        
        // 检查坐标是否有效
        if (isNaN(lng) || isNaN(lat)) {
          console.warn('[SearchObject] 无效的坐标点:', point);
          return null;
        }
        
        return [lng, lat] as [number, number];
      }).filter(point => point !== null);
      
      console.log('[SearchObject] 解析出的坐标点数量:', points.length);
      
      return points;
    } catch (error) {
      logger.error(`[SearchObject] 解析折线坐标失败: ${error}`);
      console.error('[SearchObject] 解析折线坐标失败:', error);
      return [];
    }
  }

  /**
   * 获取地图中心点坐标
   * @returns 中心点坐标 [lng, lat]
   */
  public getMapCenter(): [number, number] | null {
    if (!this.mapInstance) return null;
    
    // 获取当前视图中心
    const center = this.mapInstance.getView().getCenter();
    if (!center) return null;
    
    // 转换为WGS84坐标
    const wgs84 = GcoordUtils.transform(
      { lng: center[0], lat: center[1] },
      CoordSystem.EPSG3857,
      CoordSystem.WGS84
    );
    
    // 从 GeoPoint 提取经纬度
    const wgs84Coords = GcoordUtils.toObject(wgs84);
    
    return [wgs84Coords.lng, wgs84Coords.lat];
  }

  /**
   * 清除导航线
   */
  private clearNavigationLine(): void {
    if (this.navigationLine) {
      if (this.navigationLine.type === 'shape' && this.shapeObject) {
        // 清除使用ShapeObject创建的所有路段
        for (const segmentId of this.navigationLine.segmentIds) {
          this.shapeObject.removeShape(segmentId);
        }
      } else {
        // 清除原始导航线
        try {
          const mapInstance = this.mapObj as any;
          if (mapInstance && typeof mapInstance.removeOverlay === 'function' && this.navigationLine) {
            mapInstance.removeOverlay(this.navigationLine);
          }
        } catch (error) {
          logger.warn(`[SearchObject] 清除导航线失败: ${error.message}`);
        }
      }
      this.navigationLine = null;
    }
    
    // 清除所有备选路线
    if (this.navigationLineIds.length > 0 && this.shapeObject) {
      for (const lineId of this.navigationLineIds) {
        this.shapeObject.removeShape(lineId);
      }
      this.navigationLineIds = [];
    }
    
    // 清除使用 OpenLayers 直接绘制的图层
    if (this.navigationLayers && this.navigationLayers.length > 0 && this.mapInstance) {
      for (const layer of this.navigationLayers) {
        try {
          this.mapInstance.removeLayer(layer);
        } catch (error) {
          console.error('[SearchObject] 清除导航图层失败:', error);
        }
      }
      this.navigationLayers = [];
    }
    
    // 清除导航标记
    if (this.navigationMarkerIds.length > 0 && this.markerObject) {
      for (const markerId of this.navigationMarkerIds) {
        this.markerObject.removeMarker(markerId);
      }
      this.navigationMarkerIds = [];
    }
  }

  /**
   * 添加标记
   * @param markerOptions 标记选项
   * @returns 标记ID
   */
  public addMarker(markerOptions: any): string | null {
    if (!this.markerObject) {
      logger.warn('[SearchObject] 标记对象未初始化');
      return null;
    }
    
    try {
      // 添加标记
      const markerId = this.markerObject.addMarker(markerOptions);
      logger.debug(`[SearchObject] 添加标记: ${markerId}`);
      return markerId;
    } catch (error) {
      logger.error('[SearchObject] 添加标记失败', error);
      return null;
    }
  }

  /**
   * 移除标记
   * @param markerId 标记ID
   * @returns 是否成功移除
   */
  public removeMarker(markerId: string): boolean {
    if (!this.markerObject) {
      logger.warn('[SearchObject] 标记对象未初始化');
      return false;
    }
    
    try {
      // 移除标记
      const result = this.markerObject.removeMarker(markerId);
      if (result) {
        logger.debug(`[SearchObject] 成功移除标记: ${markerId}`);
      } else {
        logger.warn(`[SearchObject] 移除标记失败: ${markerId}`);
      }
      return result;
    } catch (error) {
      logger.error('[SearchObject] 移除标记失败', error);
      return false;
    }
  }

  /**
   * 清除导航路线
   */
  public clearNavigation(): void {
    // 清除导航线路
    this.clearNavigationLine();
    
    logger.debug('[SearchObject] 已清除导航路线');
  }

  /**
   * 调整地图视图以适应导航路径
   * @param navigationResponse 导航响应
   */
  private fitNavigationBounds(navigationResponse: any): void {
    try {
      if (!navigationResponse || !navigationResponse.route || !navigationResponse.route.paths || navigationResponse.route.paths.length === 0) {
        logger.warn('[SearchObject] 无法调整地图视图：导航路径数据无效');
        return;
      }
      
      const path = navigationResponse.route.paths[0]; // 使用第一条路线
      
      // 如果有steps，使用所有step的坐标来计算边界
      if (path.steps && path.steps.length > 0) {
        // 收集所有坐标点
        const allPoints: Array<[number, number]> = [];
        
        // 处理每个步骤
        path.steps.forEach((step: any) => {
          if (step.polyline) {
            // 解析折线坐标
            const points = this.parsePolyline(step.polyline);
            if (points && points.length > 0) {
              allPoints.push(...points);
            }
          }
        });
        
        // 如果有有效的坐标点，计算边界并调整地图视图
        if (allPoints.length > 0 && this.mapInstance) {
          console.log('[SearchObject] 调整地图视图，路线点数量:', allPoints.length);
          
          // 转换坐标为EPSG:3857
          const transformedPoints = allPoints.map(point => {
            return fromLonLat([point[0], point[1]]);
          });
          
          // 创建边界框
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          
          transformedPoints.forEach(point => {
            minX = Math.min(minX, point[0]);
            minY = Math.min(minY, point[1]);
            maxX = Math.max(maxX, point[0]);
            maxY = Math.max(maxY, point[1]);
          });
          
          // 创建边界范围
          const extent = [minX, minY, maxX, maxY];
          
          // 使用 OpenLayers 的 fit 方法调整视图
          this.mapInstance.getView().fit(extent, {
            padding: [50, 50, 50, 50], // 添加一些边距
            duration: 1000, // 动画持续时间
            maxZoom: 17 // 限制最大缩放级别
          });
          
          console.log('[SearchObject] 已调整地图视图以显示导航路线');
        } else {
          console.warn('[SearchObject] 无法调整地图视图：没有有效的坐标点');
        }
      }
    } catch (error) {
      logger.error(`[SearchObject] 调整地图视图失败: ${error}`);
      console.error('[SearchObject] 调整地图视图失败:', error);
    }
  }

  /**
   * 切换选中的路线
   * @param routeIndex 路线索引
   * @param transportType 交通方式
   * @returns 是否切换成功
   */
  public switchRoute(routeIndex: number, transportType: string = 'driving'): boolean {
    try {
      console.log('[SearchObject] 开始切换路线，索引:', routeIndex, '交通方式:', transportType);
      
      // 检查是否有导航响应数据
      if (!this._lastNavigationResponse || !this._lastNavigationResponse.route || 
          !this._lastNavigationResponse.route.paths || 
          this._lastNavigationResponse.route.paths.length <= routeIndex) {
        logger.warn(`[SearchObject] 无法切换到路线 ${routeIndex}：无效的路线索引`);
        return false;
      }
      
      // 清除当前所有路线
      this.clearNavigationLine();
      
      // 重置导航线路ID数组
      this.navigationLineIds = [];
      
      // 获取所有路径
      const paths = this._lastNavigationResponse.route.paths;
      
      // 绘制所有路线，将指定索引的路线设为选中状态
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const isSelected = i === routeIndex;
        console.log(`[SearchObject] 绘制路线 ${i}，是否选中:`, isSelected);
        this.drawSimpleNavigationLine(path, transportType, isSelected);
      }
      
      // 更新导航信息中的当前选中路线
      if (this.navigationInfo && this.navigationInfo.route && this.navigationInfo.route.paths) {
        // 如果有多条路线，将选中的路线移到第一位
        if (routeIndex > 0 && this.navigationInfo.route.paths.length > routeIndex) {
          const selectedPath = this.navigationInfo.route.paths[routeIndex];
          this.navigationInfo.route.paths[routeIndex] = this.navigationInfo.route.paths[0];
          this.navigationInfo.route.paths[0] = selectedPath;
        }
      }
      
      logger.debug(`[SearchObject] 已切换到路线 ${routeIndex}`);
      return true;
    } catch (error) {
      logger.error(`[SearchObject] 切换路线失败: ${error}`);
      console.error('[SearchObject] 切换路线失败:', error);
      return false;
    }
  }

  /**
   * 检查 ShapeObject 是否已初始化
   * @returns 是否已初始化
   */
  public checkShapeObject(): boolean {
    const isInitialized = !!this.shapeObject;
    console.log('[SearchObject] ShapeObject 是否已初始化:', isInitialized);
    return isInitialized;
  }

  /**
   * 设置位置信息
   * @param locationInfo 位置信息，包含城市编码和区划编码
   */
  public setLocationInfo(locationInfo: {
    cityCode: string;
    adcode: string;
    province: string;
    city: string;
    district: string;
  } | null): void {
    this.locationInfo = locationInfo;
    logger.debug(`[SearchObject] 已设置位置信息: ${JSON.stringify(locationInfo)}`);
  }

  /**
   * 获取位置信息
   * @returns 位置信息
   */
  public getLocationInfo(): {
    cityCode: string;
    adcode: string;
    province: string;
    city: string;
    district: string;
  } | null {
    return this.locationInfo;
  }
}

export default SearchObject;