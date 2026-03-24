/**
 * 行政区搜索处理器
 */
import { SearchHandler } from '../SearchHandler';
import { SearchType } from '../../types/search';
import type { SearchBoxConfig, SearchResult, SearchOptions } from '../../types/search';
import { SearchDataProviderFactory } from '../../interfaces/SearchDataProvider';
import logger from '../../composables/LogObject';

export class DistrictSearchHandler implements SearchHandler {
  type = SearchType.DISTRICT;
  
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
      
      // 优先使用 apiUrls 中的区域搜索 URL
      if (options.apiUrls?.district) {
        searchUrl = options.apiUrls.district;
      } else if (options.apiUrls?.search) {
        // 如果没有专门的区域搜索 URL，使用普通搜索 URL
        searchUrl = options.apiUrls.search;
      } else if (options.searchUrl) {
        // 兼容旧版本
        searchUrl = options.searchUrl;
      } else {
        // 使用默认搜索 URL
        searchUrl = searchProvider.getDefaultSearchUrl();
      }
      
      // 设置搜索选项
      const searchOptions = {
        ...options,
        keywords: keyword,
        extensions: 'all', // 获取完整的行政区划信息
        subdistrict: 1,    // 返回下一级行政区
        type: 'district'   // 指定搜索类型为行政区
      };
      
      // 执行行政区搜索
      logger.debug(`[DistrictSearchHandler] 执行行政区搜索，关键词: ${keyword}`);
      const results = await searchProvider.searchDistrict(searchUrl, keyword, searchOptions as any);
      
      return results;
    } catch (error) {
      logger.error(`[DistrictSearchHandler] 行政区搜索失败: ${error.message}`);
      return [];
    }
  }
  
  validateInput(input: string): boolean {
    // 行政区搜索只要有非空输入即可
    return input.trim().length > 0;
  }
  
  formatInput(input: string): string {
    // 行政区搜索只需要简单去除前后空格
    return input.trim();
  }
  
  getCacheKey(keyword: string, options: SearchOptions): string {
    // 行政区搜索的缓存键
    return `${this.type}:${keyword}`;
  }
} 