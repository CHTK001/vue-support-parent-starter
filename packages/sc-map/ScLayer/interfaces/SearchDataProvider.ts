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
   * @deprecated 使用 search 方法代替
   */
  searchPlaces(keyword: string, options: SearchOptions): Promise<SearchResult[]>;
  
  /**
   * 使用指定 URL 搜索地点
   * @param url 搜索 API URL
   * @param keyword 关键词
   * @param options 搜索选项
   * @returns 搜索结果
   */
  search(url: string, keyword: string, options: SearchOptions): Promise<SearchResult[]>;
  
  /**
   * 附近搜索
   * @param url 搜索 API URL
   * @param keyword 关键词
   * @param options 搜索选项，必须包含 location 和 radius
   * @returns 搜索结果
   */
  searchNearby?(url: string, keyword: string, options: SearchOptions): Promise<SearchResult[]>;
  
  /**
   * 行政区搜索
   * @param url 搜索 API URL
   * @param keyword 行政区名称
   * @param options 搜索选项
   * @returns 搜索结果
   */
  searchDistrict?(url: string, keyword: string, options: SearchOptions): Promise<SearchResult[]>;
  
  /**
   * 获取地点详情
   * @param id 地点ID
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @returns 地点详情
   * @deprecated 使用新的 getPlaceDetail 方法代替
   */
  getPlaceDetail(id: string, apiKey: string, url?: string): Promise<PlaceDetailApiResponse>;
  
  /**
   * 使用指定 URL 获取地点详情
   * @param url 详情 API URL
   * @param id 地点ID
   * @returns 地点详情
   */
  getPlaceDetail(url: string, id: string): Promise<PlaceDetailApiResponse>;
  
  /**
   * 获取导航路径
   * @param origin 起点坐标 [lng, lat]
   * @param destination 终点坐标 [lng, lat]
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @param transportType 交通方式（可选，默认为 driving）
   * @returns 导航路径
   * @deprecated 使用 createNavigation 方法代替
   */
  getNavigation(origin: [number, number], destination: [number, number], apiKey: string, url?: string, transportType?: string, options?: {
    city?: string;
    cityD?: string;
  }): Promise<NavigationApiResponse>;
  
  /**
   * 创建导航路线
   * @param url 导航 API URL
   * @param options 导航选项
   * @returns 导航 API 响应
   */
  createNavigation(url: string, options: { 
    origin: [number, number], 
    destination: [number, number], 
    key: string,
    transport_type?: string 
  }): Promise<NavigationApiResponse>;
  
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
  
  /**
   * 获取默认搜索 URL
   * @returns 默认搜索 URL
   */
  getDefaultSearchUrl(): string;
  
  /**
   * 获取默认详情 URL
   * @returns 默认详情 URL
   */
  getDefaultDetailUrl(): string;
  
  /**
   * 获取默认导航 URL
   * @param transportType 交通方式（可选，默认为 driving）
   * @returns 默认导航 URL
   */
  getDefaultNavigationUrl(transportType?: string): string;
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