/**
 * 导航搜索处理器
 */
import { SearchHandler } from '../SearchHandler';
import { SearchType } from '../../types/search';
import type { SearchBoxConfig, SearchResult, SearchOptions } from '../../types/search';
import { SearchDataProviderFactory } from '../../interfaces/SearchDataProvider';
import logger from '../../composables/LogObject';

export class NavigationSearchHandler implements SearchHandler {
  type = SearchType.NAVIGATION;
  
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
      
      // 解析导航关键词（起点-终点格式）
      const [origin, destination] = this.parseNavigationKeyword(keyword);
      
      if (!origin || !destination) {
        logger.warn('[NavigationSearchHandler] 导航搜索格式无效，请使用"起点-终点"格式');
        return [];
      }
      
      // 先搜索起点
      logger.debug(`[NavigationSearchHandler] 搜索起点: ${origin}`);
      const originResults = await searchProvider.search(searchUrl, origin, options);
      
      if (!originResults || originResults.length === 0) {
        logger.warn(`[NavigationSearchHandler] 未找到起点: ${origin}`);
        return [];
      }
      
      // 再搜索终点
      logger.debug(`[NavigationSearchHandler] 搜索终点: ${destination}`);
      const destinationResults = await searchProvider.search(searchUrl, destination, options);
      
      if (!destinationResults || destinationResults.length === 0) {
        logger.warn(`[NavigationSearchHandler] 未找到终点: ${destination}`);
        return [];
      }
      
      // 组合结果
      const combinedResults = [
        ...originResults.map(result => ({
          ...result,
          isOrigin: true,
          isDestination: false,
          navigationRole: 'origin'
        })),
        ...destinationResults.map(result => ({
          ...result,
          isOrigin: false,
          isDestination: true,
          navigationRole: 'destination'
        }))
      ];
      
      return combinedResults;
    } catch (error) {
      logger.error(`[NavigationSearchHandler] 导航搜索失败: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 解析导航关键词
   * @param keyword 导航关键词，格式为"起点-终点"
   * @returns 起点和终点的数组
   */
  private parseNavigationKeyword(keyword: string): [string, string] | [null, null] {
    if (!keyword || typeof keyword !== 'string') {
      return [null, null];
    }
    
    // 支持多种分隔符: - 到 至 -> →
    const separators = ['-', '到', '至', '->', '→'];
    let origin = null;
    let destination = null;
    
    for (const separator of separators) {
      if (keyword.includes(separator)) {
        const parts = keyword.split(separator);
        if (parts.length >= 2) {
          origin = parts[0].trim();
          destination = parts[1].trim();
          break;
        }
      }
    }
    
    if (!origin || !destination) {
      return [null, null];
    }
    
    return [origin, destination];
  }
  
  /**
   * 验证输入
   * @param input 用户输入
   * @returns 是否有效
   */
  validateInput(input: string): boolean {
    const [origin, destination] = this.parseNavigationKeyword(input);
    return !!origin && !!destination;
  }
  
  /**
   * 格式化输入
   * @param input 用户输入
   * @returns 格式化后的输入
   */
  formatInput(input: string): string {
    const [origin, destination] = this.parseNavigationKeyword(input);
    if (origin && destination) {
      return `${origin} → ${destination}`;
    }
    return input;
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