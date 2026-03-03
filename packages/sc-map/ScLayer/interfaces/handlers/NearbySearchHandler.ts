/**
 * 附近搜索处理器
 */
import { SearchHandler } from '../SearchHandler';
import { SearchType } from '../../types/search';
import type { SearchBoxConfig, SearchResult, SearchOptions } from '../../types/search';
import { SearchDataProviderFactory } from '../../interfaces/SearchDataProvider';
import logger from '../../composables/LogObject';

// 扩展搜索选项接口，添加位置信息
interface NearbySearchOptions extends SearchOptions {
  location?: number[];
}

export class NearbySearchHandler implements SearchHandler {
  type = SearchType.NEARBY;
  
  async handleSearch(keyword: string, options: SearchBoxConfig): Promise<SearchResult[]> {
    try {
      // 获取地图类型
      const mapType = options.mapType;
      
      // 获取搜索提供者
      const searchProvider = SearchDataProviderFactory.getProvider(mapType);
      if (!searchProvider) {
        throw new Error(`不支持的地图类型: ${mapType}`);
      }
      
      // 获取搜索 URL
      let searchUrl = '';
      
      // 优先使用 apiUrls 中的 search URL
      if (options.apiUrls?.search) {
        searchUrl = options.apiUrls.search;
      } else if (options.searchUrl) {
        // 兼容旧版本
        searchUrl = options.searchUrl;
      } else {
        // 使用默认搜索 URL
        searchUrl = searchProvider.getDefaultSearchUrl();
      }
      
      // 确保有位置信息
      if (!(options as any).location) {
        logger.warn('[NearbySearchHandler] 附近搜索缺少位置信息');
        return [];
      }
      
      // 设置搜索选项
      const searchOptions = {
        ...options,
        keyword: keyword,
        // 确保有搜索半径
        radius: options.radius || 5000
      } as any;
      
      // 执行附近搜索
      logger.debug(`[NearbySearchHandler] 执行附近搜索，关键词: ${keyword}, 位置: ${(options as any).location}`);
      const results = await searchProvider.searchNearby(searchUrl, keyword, searchOptions);
      
      return results;
    } catch (error) {
      logger.error(`[NearbySearchHandler] 附近搜索失败: ${error.message}`);
      return [];
    }
  }
  
  validateInput(input: string): boolean {
    // 附近搜索只要有非空输入即可
    return input.trim().length > 0;
  }
  
  formatInput(input: string): string {
    // 附近搜索只需要简单去除前后空格
    return input.trim();
  }
  
  getCacheKey(keyword: string, options: SearchOptions): string {
    // 附近搜索的缓存键需要包含位置信息
    const location = (options as any).location ? `${(options as any).location[0]},${(options as any).location[1]}` : 'unknown';
    const radius = options.radius || 5000;
    
    // 生成缓存键
    return `${this.type}:${keyword}:${location}:${radius}`;
  }
} 