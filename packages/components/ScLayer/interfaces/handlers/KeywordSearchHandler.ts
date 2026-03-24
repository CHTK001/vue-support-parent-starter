/**
 * 关键词搜索处理器
 */
import { SearchHandler } from '../SearchHandler';
import { SearchType } from '../../types/search';
import type { SearchBoxConfig, SearchResult, SearchOptions } from '../../types/search';
import { SearchDataProviderFactory } from '../../interfaces/SearchDataProvider';
import logger from '../../composables/LogObject';

export class KeywordSearchHandler implements SearchHandler {
  type = SearchType.KEYWORD;
  
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
      
      // 执行关键词搜索
      logger.debug(`[KeywordSearchHandler] 执行关键词搜索，关键词: ${keyword}`);
      const results = await searchProvider.search(searchUrl, keyword, options);
      
      return results;
    } catch (error) {
      logger.error(`[KeywordSearchHandler] 关键词搜索失败: ${error.message}`);
      return [];
    }
  }
  
  validateInput(input: string): boolean {
    // 关键词搜索基本上任何非空输入都是有效的
    return input.trim().length > 0;
  }
  
  formatInput(input: string): string {
    // 关键词搜索只需要简单去除前后空格
    return input.trim();
  }
  
  getCacheKey(keyword: string, options: SearchOptions): string {
    // 提取关键选项
    const keyOptions = {
      city: options.city,
      type: options.type,
      radius: options.radius,
      page: options.page,
      pageSize: options.pageSize
    };
    
    // 生成缓存键，包含类型和关键词
    return `${this.type}:${keyword}:${JSON.stringify(keyOptions)}`;
  }
} 