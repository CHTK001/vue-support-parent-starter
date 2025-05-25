/**
 * 搜索对象类
 * @description 处理地图搜索相关功能
 */
import { MapObject } from './MapObject';
import { MarkerObject } from './MarkerObject';
import type { SearchResult, SearchOptions, SearchBoxConfig, PlaceDetailApiResponse, NavigationApiResponse } from '../types/search';
import type { ConfigObject } from './ConfigObject';
import { fromLonLat } from 'ol/proj';
import { DEFAULT_MARKER_ICON } from '../types/default';
import { SearchDataProviderFactory } from '../interfaces/SearchDataProvider';
import { registerAllSearchProviders } from '../interfaces/providers';
import { MapType } from '../types/map';
import { CoordSystem } from '../types/coordinate';
import { GcoordUtils } from '../utils/GcoordUtils';
import logger from './LogObject';

// 缓存项接口
interface CacheItem {
  keyword: string;
  options: SearchOptions;
  results: SearchResult[];
  timestamp: number;
  hash: string; // 用于快速比较的哈希值
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

  constructor(mapInstance: any, markerObject: MarkerObject, searchBoxConfig: SearchBoxConfig, configObject: ConfigObject, mapObj: MapObject) {
    this.mapInstance = mapInstance;
    this.mapObj = mapObj;
    this.markerObject = markerObject;
    this.searchBoxConfig = searchBoxConfig;
    this.configObject = configObject;
    
    // 确保所有搜索提供者已注册
    registerAllSearchProviders();
  }

  /**
   * 生成缓存键
   * @param keyword 搜索关键词
   * @param options 搜索选项
   * @returns 缓存键
   */
  private generateCacheKey(keyword: string, options: SearchOptions): string {
    // 提取关键选项
    const keyOptions = {
      city: options.city,
      type: options.type,
      radius: options.radius,
      page: options.page,
      pageSize: options.pageSize
    };
    
    // 生成缓存键
    return `${keyword}:${JSON.stringify(keyOptions)}`;
  }

  /**
   * 执行搜索
   * @param keyword 搜索关键词
   * @param options 搜索选项
   */
  public async search(keyword: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    try {
      // 检查缓存
      const cachedResults = this.getFromCache(keyword, options);
      if (cachedResults) {
        logger.debug('使用缓存的搜索结果');
        this.searchResults = cachedResults;
        
        // 触发搜索回调
        if (this.searchCallback) {
          this.searchCallback(cachedResults);
        }
        
        return cachedResults;
      }

      // 获取当前地图服务商
      const provider = this.searchBoxConfig.mapType || MapType.GAODE;
      
      // 从工厂获取对应的搜索数据提供者
      const searchProvider = SearchDataProviderFactory.getProvider(provider.toLowerCase());
      
      // 设置API密钥
      options.key = this.configObject.getConfig().mapKey[provider];
      
      // 设置自定义URL（如果有）
      if (this.searchBoxConfig.searchUrl) {
        options.url = this.searchBoxConfig.searchUrl;
      }
      
      logger.debug(`[SearchObject] 开始搜索: ${keyword} (提供者: ${provider})`);
      
      // 执行搜索
      const results = await searchProvider.searchPlaces(keyword, options);
      
      logger.debug(`[SearchObject] 搜索成功，找到 ${results.length} 条结果`);
      
      // 更新缓存
      this.updateCache(keyword, options, results);
      
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
      logger.error('搜索失败:', error);
      return [];
    }
  }

  /**
   * 从缓存中获取搜索结果
   * @param keyword 搜索关键词
   * @param options 搜索选项
   * @returns 缓存的搜索结果或null
   */
  private getFromCache(keyword: string, options: SearchOptions): SearchResult[] | null {
    const now = Date.now();
    const cacheKey = this.generateCacheKey(keyword, options);
    
    // 清理过期缓存
    this.searchCache = this.searchCache.filter(item => 
      now - item.timestamp < this.CACHE_EXPIRE_TIME
    );

    // 查找匹配的缓存项
    const cacheItem = this.searchCache.find(item => item.hash === cacheKey);

    if (cacheItem) {
      logger.debug('使用缓存的搜索结果:', cacheKey);
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
   */
  private updateCache(keyword: string, options: SearchOptions, results: SearchResult[]): void {
    const now = Date.now();
    const cacheKey = this.generateCacheKey(keyword, options);
    
    // 创建新的缓存项
    const newCacheItem: CacheItem = {
      keyword,
      options,
      results,
      timestamp: now,
      hash: cacheKey
    };

    // 移除相同关键词的旧缓存
    this.searchCache = this.searchCache.filter(item => item.hash !== cacheKey);

    // 添加新缓存到开头
    this.searchCache.unshift(newCacheItem);

    // 如果超出缓存大小限制，移除最旧的缓存
    if (this.searchCache.length > this.CACHE_SIZE) {
      this.searchCache = this.searchCache.slice(0, this.CACHE_SIZE);
    }

    logger.debug('更新缓存:', {
      key: cacheKey,
      cacheSize: this.searchCache.length,
      timestamp: new Date(now).toLocaleTimeString()
    });
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
      
      // 设置自定义URL（如果有）
      const url = this.searchBoxConfig.navigationUrl;
      
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
      // 获取当前地图服务商
      const provider = this.searchBoxConfig.mapType || MapType.GAODE;
      
      // 从工厂获取对应的搜索数据提供者
      const searchProvider = SearchDataProviderFactory.getProvider(provider.toLowerCase());
      
      // 获取API密钥
      const apiKey = this.configObject.getConfig().mapKey[provider];
      
      // 设置自定义URL（如果有）
      const url = this.searchBoxConfig.detailUrl;
      
      logger.debug(`[SearchObject] 开始获取地点详情: ${id}`);
      
      // 获取地点详情
      const response = await searchProvider.getPlaceDetail(id, apiKey, url);
      
      logger.debug(`[SearchObject] 获取地点详情成功: ${id}`);
      
      return response;
    } catch (error) {
      logger.error('获取地点详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建两点间导航
   * @param fromMarkerId 起点标记ID
   * @param toMarkerId 终点标记ID
   */
  public async createNavigation(fromMarkerId: string, toMarkerId: string): Promise<void> {
    // 实现两点间导航逻辑
    // 此处代码略
  }

  /**
   * 清除导航
   */
  public clearNavigation(): void {
    this.clearNavigationLine();
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