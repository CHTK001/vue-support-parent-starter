/**
 * 搜索对象类
 * @description 处理地图搜索相关功能
 */
import { MapObject } from './MapObject';
import { MarkerObject } from './MarkerObject';
import type { SearchResult, SearchOptions, SearchBoxConfig, PlaceDetailApiResponse, NavigationApiResponse, SearchTypeConfig } from '../types/search';
import { SearchType } from '../types/search';
import type { ConfigObject } from './ConfigObject';
import { fromLonLat } from 'ol/proj';
import { DEFAULT_MARKER_ICON } from '../types/default';
import { SearchDataProviderFactory } from '../interfaces/SearchDataProvider';
import { registerAllSearchProviders } from '../interfaces/providers';
import { SearchHandlerFactory } from '../interfaces/SearchHandler';
import { registerAllSearchHandlers } from '../interfaces/handlers';
import { MapType } from '../types/map';
import { CoordSystem } from '../types/coordinate';
import { GcoordUtils } from '../utils/GcoordUtils';
import logger from './LogObject';

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

  constructor(mapInstance: any, markerObject: MarkerObject, searchBoxConfig: SearchBoxConfig, configObject: ConfigObject, mapObj: MapObject, mapKey: Record<string, string>) {
    this.mapInstance = mapInstance;
    this.mapObj = mapObj;
    this.markerObject = markerObject;
    this.searchBoxConfig = searchBoxConfig;
    this.configObject = configObject;
    this.mapKey = mapKey;
    
    // 初始化当前搜索类型
    this.currentSearchType = searchBoxConfig.defaultSearchType || SearchType.KEYWORD;
    
    // 确保所有搜索提供者已注册
    registerAllSearchProviders();
    
    // 确保所有搜索处理器已注册
    registerAllSearchHandlers();
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
        this.clearSearchMarker();
        
        // 如果有结果，添加标记并立即定位到该坐标
        if (results.length > 0) {
          this.addSearchMarker(results[0]);
          this.flyToLocation(results[0].location);
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
        this.clearSearchMarker();
        
        // 如果有结果，添加标记并立即定位到该坐标
        if (results.length > 0) {
          this.addSearchMarker(results[0]);
          this.flyToLocation(results[0].location);
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
        this.clearSearchMarker();
        
        // 如果有结果，添加标记
        if (results.length > 0) {
          this.addSearchMarker(results[0]);
        }
        
        // 触发搜索回调
        if (this.searchCallback) {
          this.searchCallback(results);
        }
        
        return results;
      }
      
      // 如果有全局自定义搜索处理函数，使用全局处理函数
      if (this.searchBoxConfig.customSearchHandler) {
        logger.debug(`[SearchObject] 使用全局自定义搜索处理函数，类型: ${type}`);
        const results = await this.searchBoxConfig.customSearchHandler(type, keyword, options);
        
        // 更新缓存
        this.updateCache(keyword, options, results, type);
        
        this.searchResults = results;
        
        // 清除之前的搜索结果标记
        this.clearSearchMarker();
        
        // 如果有结果，添加标记
        if (results.length > 0) {
          this.addSearchMarker(results[0]);
        }
        
        // 触发搜索回调
        if (this.searchCallback) {
          this.searchCallback(results);
        }
        
        return results;
      }
      
      // 获取地图类型
      const mapType = this.configObject.getMapType();
      
      // 获取搜索提供者
      const searchProvider = SearchDataProviderFactory.getProvider(mapType);
      if (!searchProvider) {
        throw new Error(`不支持的地图类型: ${mapType}`);
      }
      
      // 获取搜索 URL
      let searchUrl = '';
      
      // 优先使用 apiUrls 中的 search URL
      if (this.searchBoxConfig.apiUrls?.search) {
        searchUrl = this.searchBoxConfig.apiUrls.search;
      } else if (this.searchBoxConfig.searchUrl) {
        // 兼容旧版本
        searchUrl = this.searchBoxConfig.searchUrl;
      } else {
        // 使用默认搜索 URL
        searchUrl = searchProvider.getDefaultSearchUrl();
      }
      
      // 执行搜索
      logger.debug(`[SearchObject] 执行搜索，类型: ${type}, 关键词: ${keyword}, URL: ${searchUrl}`);
      const results = await searchProvider.search(searchUrl, keyword, options);
      
      // 更新缓存
      this.updateCache(keyword, options, results, type);
      
      this.searchResults = results;
      
      // 清除之前的搜索结果标记
      this.clearSearchMarker();
      
      // 如果有结果，添加标记
      if (results.length > 0) {
        this.addSearchMarker(results[0]);
      }
      
      // 触发搜索回调
      if (this.searchCallback) {
        this.searchCallback(results);
      }
      
      return results;
    } catch (error) {
      logger.error(`[SearchObject] 搜索失败: ${error.message}`);
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
    // 清除之前的搜索结果标记
    this.clearSearchMarker();
    
    // 添加新标记
    this.addSearchMarker(result);
    
    // 飞行到位置
    this.flyToLocation(result.location);
    
    // 触发选择回调
    if (this.selectCallback) {
      this.selectCallback(result);
    }
  }

  /**
   * 添加搜索结果标记
   * @param result 搜索结果
   * @returns 标记ID
   */
  public addSearchMarker(result: SearchResult): string | null {
    if (!this.markerObject || !result || !result.location) return null;
    
    // 清除之前的搜索结果标记
    this.clearSearchMarker();
    
    // 确保有有效的图标
    const defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzE4OTBmZiIgZD0iTTE2IDJDNi40NzcgMiAwIDguNDc3IDAgMTZjMCA5LjM5MyA4LjIxNyAxNi4xMTYgMTUuOTk5IDI5Ljk5NkMyMy43ODMgMzIuMTE2IDMyIDI1LjM5MyAzMiAxNmMwLTcuNTIzLTYuNDc3LTE0LTE2LTE0em0wIDRjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMHMtNC40NzcgMTAtMTAgMTAtMTAtNC40NzctMTAtMTAgNC40NzctMTAgMTAtMTB6Ii8+PC9zdmc+';
    
    // 获取图标配置，确保有 URL
    let iconConfig = this.searchBoxConfig.markerIcon || DEFAULT_MARKER_ICON;
    
    // 如果 iconConfig 是对象但没有 url，或者 iconConfig 为空，则使用默认图标
    if (!iconConfig || (typeof iconConfig === 'object' && !iconConfig.url && !iconConfig.default?.url)) {
      logger.debug('[SearchObject] 使用默认搜索标记图标');
      iconConfig = {
        url: defaultIcon,
        size: [32, 32],
        anchor: [16, 32]
      };
    }
    
    // 创建标记
    const markerId = this.markerObject.addMarker({
      id: `search_${Date.now()}`,
      position: [result.location.lng, result.location.lat],
      title: result.name,
      icon: iconConfig,
      content: `
        <div class="search-result-popup">
          <h3>${result.name}</h3>
          <p>${result.address || ''}</p>
          ${result.tel ? `<p>电话: ${result.tel}</p>` : ''}
          <div class="search-result-actions">
            <button class="search-result-navigate" data-id="${result.id}">导航</button>
          </div>
        </div>
      `,
      clickable: true,
      draggable: false,
      visible: true
    });
    
    // 保存标记ID
    this.searchMarker = markerId;
    
    // 添加导航按钮点击事件
    setTimeout(() => {
      const navigateBtn = document.querySelector(`.search-result-navigate[data-id="${result.id}"]`);
      if (navigateBtn) {
        navigateBtn.addEventListener('click', () => this.showNavigation(result));
      }
    }, 100);
    
    return markerId;
  }

  /**
   * 显示导航路径
   * @param destination 目的地
   */
  private async showNavigation(destination: SearchResult): Promise<void> {
    try {
      // 获取当前位置（地图中心）
      const center = this.getMapCenter();
      if (!center) return;
      
      // 获取当前地图服务商
      const provider = this.searchBoxConfig.mapType || MapType.GAODE;
      
      // 从工厂获取对应的搜索数据提供者
      const searchProvider = SearchDataProviderFactory.getProvider(provider.toLowerCase());
      
      // 获取API密钥
      const apiKey = this.configObject.getConfig().mapKey[provider];
      
      // 设置自定义URL（如果有）- 优先使用 apiUrls.navigation，然后是旧的 navigationUrl 属性
      const url = this.searchBoxConfig.apiUrls?.navigation || this.searchBoxConfig.navigationUrl;
      
      logger.debug(`[SearchObject] 开始获取导航路径: ${center} -> [${destination.location.lng}, ${destination.location.lat}]`);
      
      // 获取导航路径
      const response = await searchProvider.getNavigation(
        center, 
        [destination.location.lng, destination.location.lat],
        apiKey,
        url
      );
      
      logger.debug(`[SearchObject] 获取导航路径成功`);
      
      // 清除之前的导航线
      this.clearNavigationLine();
      
      // 绘制导航路径
      if (provider.toLowerCase() === 'gaode') {
        // 高德地图导航
        const route = response.route.paths[0];
        const steps = route.steps;
        this.drawNavigationLine(steps);
        this.fitNavigationBounds(steps);
      } else if (provider.toLowerCase() === 'baidu') {
        // 百度地图导航
        const route = response.result.routes[0];
        const steps = route.steps;
        this.drawNavigationLine(steps);
        this.fitNavigationBounds(steps);
      }
    } catch (error) {
      logger.error('获取导航路径失败:', error);
    }
  }

  /**
   * 绘制导航线
   * @param steps 导航步骤
   */
  private drawNavigationLine(steps: any[]): void {
    // 实现导航线绘制逻辑
    // 这里需要根据不同地图提供商的返回格式进行适配
    // 此处代码略
  }

  /**
   * 调整地图视图以适应导航路径
   * @param steps 导航步骤
   */
  private fitNavigationBounds(steps: any[]): void {
    // 实现调整地图视图逻辑
    // 这里需要根据不同地图提供商的返回格式进行适配
    // 此处代码略
  }

  /**
   * 清除导航线
   */
  private clearNavigationLine(): void {
    if (this.navigationLine) {
      // 清除导航线逻辑
      // 此处代码略
      this.navigationLine = null;
    }
  }

  /**
   * 清除搜索结果标记
   */
  private clearSearchMarker(): void {
    if (this.searchMarker && this.markerObject) {
      this.markerObject.removeMarker(this.searchMarker);
      this.searchMarker = null;
    }
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
    this.searchResults = [];
    this.clearSearchMarker();
    this.clearNavigationLine();
    
    // 触发搜索回调，传入空数组
    if (this.searchCallback) {
      this.searchCallback([]);
    }
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
   * @param fromMarkerId 起点标记ID
   * @param toMarkerId 终点标记ID
   */
  public async createNavigation(fromMarkerId: string, toMarkerId: string): Promise<void> {
    try {
      // 获取地图类型
      const mapType = this.configObject.getMapType();
      
      // 获取搜索提供者
      const searchProvider = SearchDataProviderFactory.getProvider(mapType);
      if (!searchProvider) {
        throw new Error(`不支持的地图类型: ${mapType}`);
      }
      
      // 获取导航 URL
      let navigationUrl = '';
      
      // 优先使用 apiUrls 中的 navigation URL
      if (this.searchBoxConfig.apiUrls?.navigation) {
        navigationUrl = this.searchBoxConfig.apiUrls.navigation;
      } else if (this.searchBoxConfig.navigationUrl) {
        // 兼容旧版本
        navigationUrl = this.searchBoxConfig.navigationUrl;
      } else {
        // 使用默认导航 URL
        navigationUrl = searchProvider.getDefaultNavigationUrl();
      }
      
      // 获取起点和终点标记
      const fromMarker = this.markerObject.getMarker(fromMarkerId);
      const toMarker = this.markerObject.getMarker(toMarkerId);
      
      if (!fromMarker || !toMarker) {
        throw new Error('无法获取起点或终点标记');
      }
      
      // 获取起点和终点坐标
      const fromCoord = fromMarker.position;
      const toCoord = toMarker.position;
      
      if (!fromCoord || !toCoord) {
        throw new Error('无法获取标记坐标');
      }
      
      // 创建导航路线
      const response = await searchProvider.createNavigation(
        navigationUrl,
        {
          origin: fromCoord,
          destination: toCoord
        }
      );
      
      // 绘制导航路线
      if (response.route && response.route.paths && response.route.paths.length > 0) {
        const path = response.route.paths[0];
        if (path.steps) {
          this.drawNavigationLine(path.steps);
          this.fitNavigationBounds(path.steps);
        }
      }
    } catch (error) {
      logger.error(`[SearchObject] 创建导航路线失败: ${error.message}`);
      throw error;
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
}

export default SearchObject;