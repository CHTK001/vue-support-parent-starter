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

// 扩展搜索选项接口，添加坐标搜索需要的属性
interface ExtendedSearchOptions extends SearchOptions {
  location?: number[];
  mapType: MapType;
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

  constructor(mapInstance: any, markerObject: MarkerObject, searchBoxConfig: SearchBoxConfig, configObject: ConfigObject, mapObj: MapObject, mapKey: Record<string, string>, shapeObject?: ShapeObject) {
    this.mapInstance = mapInstance;
    this.mapObj = mapObj;
    this.markerObject = markerObject;
    this.searchBoxConfig = searchBoxConfig;
    this.configObject = configObject;
    this.mapKey = mapKey;
    this.shapeObject = shapeObject || null;
    
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
      this.setOptionsBySearchType(type, keyword, options);
      
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
   * 根据搜索类型设置搜索选项
   * @param type 搜索类型
   * @param keyword 搜索关键词
   * @param options 搜索选项
   */
  private setOptionsBySearchType(type: SearchType, keyword: string, options: ExtendedSearchOptions): void {
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
      // 清除之前的导航路线
      this.clearNavigationLine();
      
      const startPoint = this.markerObject.getMarker(startPointId);
      const endPoint = this.markerObject.getMarker(endPointId);
      
      if (!startPoint || !endPoint) {
        throw new Error('起点或终点未找到');
      }
      
      const startPosition = startPoint.position;
      const endPosition = endPoint.position;
      
      if (!startPosition || !endPosition) {
        throw new Error('起点或终点坐标无效');
      }
      
      // 获取地图类型
      const mapType = this.configObject.getMapType();
      
      // 获取搜索提供者
      const searchProvider = SearchDataProviderFactory.getProvider(mapType);
      if (!searchProvider) {
        throw new Error(`不支持的地图类型: ${mapType}`);
      }
      
      // 获取API密钥
      const apiKey = this.mapKey[mapType] || '';
      
      // 获取导航URL
      const navigationUrl = searchProvider.getDefaultNavigationUrl();
      
      // 调用搜索提供者的导航方法
      const response = await searchProvider.getNavigation(
        startPosition as [number, number],
        endPosition as [number, number],
        apiKey,
        navigationUrl
      );
      
      // 保存导航信息以便后续使用
      this.navigationInfo = response;
      
      // 简单绘制导航路线
      if (response && response.route && response.route.paths && response.route.paths.length > 0) {
        const path = response.route.paths[0];
        this.drawSimpleNavigationLine(path, transportType);
        
        // 调整地图视图以适应导航路径
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
   */
  private drawSimpleNavigationLine(path: any, transportType: string): void {
    try {
      // 处理路径中的所有步骤
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
        
        // 如果有有效的坐标点，绘制路线
        if (allPoints.length > 0 && this.mapObj) {
          // 使用ShapeObject绘制路线
          if (this.shapeObject) {
            logger.debug(`[SearchObject] 使用ShapeObject绘制导航路线，坐标点数量: ${allPoints.length}`);
            
            // 清除之前的导航线
            if (this.navigationLine && this.navigationLine.segmentIds) {
              this.navigationLine.segmentIds.forEach((id: string) => {
                this.shapeObject.removeShape(id);
              });
            }
            
            // 确定路线颜色
            let lineColor = '#3388ff'; // 默认蓝色
            let lineWidth = 5;
            
            // 根据交通方式调整路线样式
            switch (transportType) {
              case 'driving':
                lineColor = '#3388ff'; // 蓝色
                lineWidth = 5;
                break;
              case 'walking':
                lineColor = '#33cc33'; // 绿色
                lineWidth = 4;
                break;
              case 'bicycling':
                lineColor = '#ff9900'; // 橙色
                lineWidth = 4;
                break;
              case 'transit':
                lineColor = '#9933cc'; // 紫色
                lineWidth = 5;
                break;
              default:
                lineColor = '#3388ff'; // 默认蓝色
                lineWidth = 5;
            }
            
            // 创建线段
            const segmentIds: string[] = [];
            
            // 使用ShapeObject的addLine方法添加线条
            const lineId = this.shapeObject.addLine(allPoints, {
              flowLine: true,
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
                duration: path.duration || 0
              }
            });
            
            if (lineId) {
              segmentIds.push(lineId);
              logger.debug(`[SearchObject] 导航路线已绘制，ID: ${lineId}, 类型: ${transportType}`);
            }
            
            // 保存导航线信息
            this.navigationLine = {
              type: 'shape',
              segmentIds: segmentIds,
              transportType: transportType
            };
            
            // 添加起点和终点标记
            if (allPoints.length > 1) {
              this.addNavigationMarkers(allPoints[0], allPoints[allPoints.length - 1], transportType);
            }
          } else {
            logger.warn('[SearchObject] ShapeObject未初始化，无法绘制导航路线');
          }
        }
      }
    } catch (error) {
      logger.error(`[SearchObject] 绘制导航路线失败: ${error}`);
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
      // 高德地图API返回的折线格式通常是"lng1,lat1;lng2,lat2;..."
      return polyline.split(';').map(point => {
        const [lng, lat] = point.split(',').map(Number);
        return [lng, lat] as [number, number];
      });
    } catch (error) {
      logger.error(`[SearchObject] 解析折线坐标失败: ${error}`);
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
        if (allPoints.length > 0) {
          // 计算边界
          let minLng = Number.MAX_VALUE;
          let minLat = Number.MAX_VALUE;
          let maxLng = -Number.MAX_VALUE;
          let maxLat = -Number.MAX_VALUE;
          
          allPoints.forEach(point => {
            const [lng, lat] = point;
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
          });
          
          // 调整地图视图 - 使用MapObject中可用的方法
          if (this.mapObj && this.mapInstance) {
            // 计算中心点
            const centerLng = (minLng + maxLng) / 2;
            const centerLat = (minLat + maxLat) / 2;
            
            // 设置地图中心点
            this.mapObj.setCenter(centerLat, centerLng, true);
            
            // 计算合适的缩放级别
            // 这里使用简单的方法：根据边界大小估算缩放级别
            const latDiff = Math.abs(maxLat - minLat);
            const lngDiff = Math.abs(maxLng - minLng);
            const maxDiff = Math.max(latDiff, lngDiff);
            
            // 根据边界大小估算缩放级别（值越小，缩放级别越大）
            // 这是一个简单的估算，可能需要根据实际情况调整
            let zoom = 14; // 默认缩放级别
            
            if (maxDiff > 0.5) zoom = 9;
            else if (maxDiff > 0.2) zoom = 10;
            else if (maxDiff > 0.1) zoom = 11;
            else if (maxDiff > 0.05) zoom = 12;
            else if (maxDiff > 0.01) zoom = 13;
            else if (maxDiff > 0.005) zoom = 14;
            else if (maxDiff > 0.001) zoom = 15;
            else zoom = 16;
            
            // 设置缩放级别
            this.mapObj.setZoom(zoom, true);
            
            logger.debug('[SearchObject] 已调整地图视图以显示导航路线，缩放级别:', zoom);
          }
        }
      }
    } catch (error) {
      logger.error(`[SearchObject] 调整地图视图失败: ${error}`);
    }
  }
}

export default SearchObject;