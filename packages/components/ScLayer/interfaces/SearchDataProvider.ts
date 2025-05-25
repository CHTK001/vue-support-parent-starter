import { CoordSystem } from '../types/coordinate';
import { SearchResult, SearchOptions, PlaceDetailApiResponse, NavigationApiResponse } from '../types/search';

/**
 * 搜索数据提供者接口
 * 定义获取不同地图服务商搜索数据的标准接口
 */
export interface SearchDataProvider {
  /**
   * 搜索地点
   * @param keyword 关键词
   * @param options 搜索选项
   * @returns 搜索结果
   */
  searchPlaces(keyword: string, options: SearchOptions): Promise<SearchResult[]>;
  
  /**
   * 获取地点详情
   * @param id 地点ID
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @returns 地点详情
   */
  getPlaceDetail(id: string, apiKey: string, url?: string): Promise<PlaceDetailApiResponse>;
  
  /**
   * 获取导航路径
   * @param origin 起点坐标 [lng, lat]
   * @param destination 终点坐标 [lng, lat]
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @returns 导航路径
   */
  getNavigation(origin: [number, number], destination: [number, number], apiKey: string, url?: string): Promise<NavigationApiResponse>;
  
  /**
   * 获取提供者名称
   * @returns 提供者名称
   */
  getProviderName(): string;
  
  /**
   * 获取提供者的坐标系统
   * @returns 坐标系统
   */
  getCoordSystem(): CoordSystem;
}

/**
 * 搜索数据提供者工厂
 * 用于创建和管理不同地图服务商的搜索数据提供者
 */
export class SearchDataProviderFactory {
  private static providers: Map<string, SearchDataProvider> = new Map();
  
  /**
   * 注册搜索数据提供者
   * @param provider 提供者名称
   * @param dataProvider 提供者实例
   */
  static register(provider: string, dataProvider: SearchDataProvider): void {
    this.providers.set(provider.toLowerCase(), dataProvider);
  }
  
  /**
   * 获取搜索数据提供者
   * @param provider 提供者名称
   * @returns 提供者实例
   */
  static getProvider(provider: string): SearchDataProvider {
    const dataProvider = this.providers.get(provider.toLowerCase());
    if (!dataProvider) {
      throw new Error(`未找到 ${provider} 的搜索数据提供者`);
    }
    return dataProvider;
  }
} 