/**
 * 搜索对象类
 * @description 处理地图搜索相关功能
 */
import { MapObject } from './MapObject';
import { MarkerObject } from './MarkerObject';
import { searchLocation, getNavigation } from '../api/search';
import type { SearchResult, SearchOptions, SearchBoxConfig } from '../types/search';
import type { ConfigObject } from './ConfigObject';
import { fromLonLat } from 'ol/proj';
import { DEFAULT_MARKER_ICON } from '../types/default';

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

  // 缓存配置
  private readonly CACHE_SIZE = 10; // 缓存大小
  private readonly CACHE_EXPIRE_TIME = 5 * 60 * 1000; // 缓存过期时间（5分钟）
  private searchCache: CacheItem[] = [];

  constructor(mapInstance: any, markerObject: MarkerObject, searchBoxConfig: SearchBoxConfig, configObject: ConfigObject) {
    this.mapInstance = mapInstance;
    this.markerObject = markerObject;
    this.searchBoxConfig = searchBoxConfig;
    this.configObject = configObject;
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
        console.log('使用缓存的搜索结果');
        this.searchResults = cachedResults;
        return cachedResults;
      }

      // 执行搜索
      const results = await searchLocation(keyword, options, this.searchBoxConfig, this.configObject);
      
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
      console.error('搜索失败:', error);
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
      console.log('使用缓存的搜索结果:', cacheKey);
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

    console.log('更新缓存:', {
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
   * 定位到指定位置
   * @param location 位置坐标
   * @param zoom 缩放级别，默认16
   */
  private flyToLocation(location: { lng: number; lat: number }, zoom: number = 16): void {
    if (!this.mapInstance) return;

    try {
      // 将经纬度转换为地图投影坐标
      const coordinate = fromLonLat([location.lng, location.lat]);
      
      // 获取地图视图
      const view = this.mapInstance.getView();
      
      // 设置中心点和缩放级别
      view.animate({
        center: coordinate,
        zoom: zoom,
        duration: 1000 // 动画持续时间，单位毫秒
      });
    } catch (error) {
      console.error('地图定位失败:', error);
    }
  }

  /**
   * 选择搜索结果
   * @param result 搜索结果
   */
  public selectResult(result: SearchResult): void {
    if (!this.mapInstance || !this.markerObject) return;

    // 清除之前的标记
    this.clearSearchMarker();
    
    // 使用默认图标创建标记
    const markerId = this.markerObject.addMarker({
      position: [result.location.lng, result.location.lat],
      title: result.name,
      id: result.id,
      icon: {
        src: DEFAULT_MARKER_ICON.default.url,
        size: DEFAULT_MARKER_ICON.default.size,
        anchor: DEFAULT_MARKER_ICON.default.anchor,
        offset: DEFAULT_MARKER_ICON.default.offset
      },
      draggable: false,
      zIndex: 3000
    } as any);

    if (markerId) {
      this.searchMarker = markerId;
      
      // 将地图中心移动到标记位置
      this.flyToLocation(result.location);

      // 触发点击事件
      this.markerObject.triggerMarkerClick(markerId, {
        coordinates: [result.location.lng, result.location.lat],
        data: {
          id: markerId,
          title: result.name,
          position: [result.location.lng, result.location.lat]
        }
      });
    }
  }

  /**
   * 添加搜索结果标记
   * @param result 搜索结果
   */
  private addSearchMarker(result: SearchResult): void {
    if (!this.mapInstance || !this.markerObject) return;
    
    // 创建标记
    this.searchMarker = this.markerObject.addMarker({
      id: 'search-result',
      position: [result.location.lng, result.location.lat],
      title: result.name,
      content: result.address,
      icon: result.icon || 'default-marker.png',
      // 添加导航按钮
      buttons: [{
        icon: 'navigation.png',
        title: '导航',
        onClick: () => this.showNavigation(result)
      }]
    });
    
    // 添加点击事件
    this.mapInstance.on('click', (event) => {
      const marker = this.markerObject?.checkMarkerClick(event.pixel);
      if (marker && marker.id === 'search-result') {
        this.selectResult(result);
      }
    });
  }

  /**
   * 显示导航路线
   * @param destination 目的地
   */
  private async showNavigation(destination: SearchResult): Promise<void> {
    if (!this.mapInstance || !this.markerObject) return;

    try {
      // 获取当前位置作为起点
      const center = this.mapInstance.getCenter();
      const start: [number, number] = [center[0], center[1]];

      // 获取导航路线
      const route = await getNavigation(start, [destination.location.lng, destination.location.lat]);

      // 清除之前的导航路线
      this.clearNavigationLine();

      // 绘制导航路线
      this.drawNavigationLine(route.steps);

      // 调整视图以显示完整路线
      this.fitNavigationBounds(route.steps);
    } catch (error) {
      console.error('获取导航路线失败:', error);
    }
  }

  /**
   * 绘制导航路线
   * @param steps 导航步骤
   */
  private drawNavigationLine(steps: any[]): void {
    if (!this.mapInstance) return;

    // 收集所有路径点
    const coordinates = steps.reduce((acc: number[][], step) => {
      return acc.concat(step.path);
    }, []);

    // 创建路线图层
    this.navigationLine = this.mapInstance.addLayer({
      type: 'line',
      coordinates: coordinates,
      style: {
        color: '#1890ff',
        width: 4,
        opacity: 0.8,
        dashArray: [10, 5]
      }
    });
  }

  /**
   * 调整视图以显示完整路线
   * @param steps 导航步骤
   */
  private fitNavigationBounds(steps: any[]): void {
    if (!this.mapInstance) return;

    // 收集所有路径点
    const coordinates = steps.reduce((acc: number[][], step) => {
      return acc.concat(step.path);
    }, []);

    // 计算边界
    const bounds = coordinates.reduce((acc: any, coord) => {
      return [
        [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
        [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])]
      ];
    }, [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]]);

    // 调整视图
    this.mapInstance.fitBounds(bounds, {
      padding: [50, 50, 50, 50],
      duration: 1000
    });
  }

  /**
   * 清除导航路线
   */
  private clearNavigationLine(): void {
    if (this.navigationLine && this.mapInstance) {
      this.mapInstance.removeLayer(this.navigationLine);
      this.navigationLine = null;
    }
  }

  /**
   * 清除搜索结果标记
   */
  private clearSearchMarker(): void {
    if (this.searchMarker && this.markerObject) {
      this.markerObject.removeMarker('search-result');
      this.searchMarker = null;
    }
  }

  /**
   * 设置搜索回调
   * @param callback 回调函数
   */
  public onSearch(callback: (results: SearchResult[]) => void): void {
    this.searchCallback = callback;
  }

  /**
   * 设置选择回调
   * @param callback 回调函数
   */
  public onSelect(callback: (result: SearchResult) => void): void {
    this.selectCallback = callback;
  }

  /**
   * 获取搜索结果
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
  }

  /**
   * 设置配置对象
   * @param configObject 配置对象
   */
  public setConfigObject(configObject: ConfigObject): void {
    this.configObject = configObject;
  }
}

export default SearchObject;