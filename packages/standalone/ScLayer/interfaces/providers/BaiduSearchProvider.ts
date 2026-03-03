import { SearchDataProvider } from '../SearchDataProvider';
import { SearchOptions, SearchResult, PlaceDetailApiResponse, NavigationApiResponse } from '../../types/search';
import { CoordSystem } from '../../types/coordinate';
import logger from '../../composables/LogObject';
import { GcoordUtils } from '../../utils/GcoordUtils';
import { http } from "@repo/utils";

/**
 * 百度地图搜索数据提供者
 * 实现从百度地图API获取搜索数据
 */
export class BaiduSearchProvider implements SearchDataProvider {
  // 百度地图API URL
  private readonly SEARCH_URL = 'https://api.map.baidu.com/place/v2/search';
  private readonly DETAIL_URL = 'https://api.map.baidu.com/place/v2/detail';
  private readonly NAVIGATION_URL = 'https://api.map.baidu.com/directionlite/v1/driving';
  
  /**
   * 搜索地点
   * @param keyword 关键词
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async searchPlaces(keyword: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      logger.debug(`[BaiduSearchProvider] 开始搜索: ${keyword}`);
      
      const params = {
        ak: options.key,
        query: keyword,
        region: options.city || '',
        city_limit: options.cityLimit ? 'true' : 'false',
        scope: 2, // 返回详细信息
        page_size: options.pageSize || 20,
        page_num: options.pageIndex || 0,
        output: 'json'
      };
      
      // 如果提供了自定义URL，则使用自定义URL
      const url = options.url || this.SEARCH_URL;
      
      const response: any = await http.get(url, params);
      const data = response.data;
      
      if (data.status !== 0) {
        throw new Error(`百度地图搜索API错误: ${data.message}`);
      }
      
      logger.debug(`[BaiduSearchProvider] 搜索成功，找到 ${data.results?.length || 0} 条结果`);
      
      // 转换为统一格式
      return this.convertToSearchResults(data.results || []);
    } catch (error) {
      logger.error(`[BaiduSearchProvider] 搜索失败: ${keyword}`, error);
      throw error;
    }
  }
  
  /**
   * 获取地点详情
   * @param id 地点ID (uid)
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @returns 地点详情
   */
  async getPlaceDetail(id: string, apiKey: string, url?: string): Promise<PlaceDetailApiResponse> {
    try {
      logger.debug(`[BaiduSearchProvider] 开始获取地点详情: ${id}`);
      
      const params = {
        ak: apiKey,
        uid: id,
        scope: 2, // 返回详细信息
        output: 'json'
      };
      
      // 如果提供了自定义URL，则使用自定义URL
      const requestUrl = url || this.DETAIL_URL;
      
      const response: any = await http.get(requestUrl, params);
      const data = response.data;
      
      if (data.status !== 0) {
        throw new Error(`百度地图详情API错误: ${data.message}`);
      }
      
      logger.debug(`[BaiduSearchProvider] 获取地点详情成功: ${id}`);
      
      // 返回原始响应，由调用者处理
      return data;
    } catch (error) {
      logger.error(`[BaiduSearchProvider] 获取地点详情失败: ${id}`, error);
      throw error;
    }
  }
  
  /**
   * 获取导航路径
   * @param origin 起点坐标 [lng, lat]
   * @param destination 终点坐标 [lng, lat]
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @param transportType 交通方式（可选，默认为 driving）
   * @returns 导航路径
   */
  async getNavigation(origin: [number, number], destination: [number, number], apiKey: string, url?: string, transportType: string = 'driving', options?: {
    city?: string;
    cityD?: string;
  }): Promise<NavigationApiResponse> {
    try {
      logger.debug(`[BaiduSearchProvider] 开始获取导航路径: ${origin} -> ${destination}, 交通方式: ${transportType}`);
      
      // 确保坐标是BD09坐标系
      const originBd09 = this.ensureBd09Coordinates(origin);
      const destinationBd09 = this.ensureBd09Coordinates(destination);
      
      // 根据交通方式确定API URL
      let apiUrl = url;
      if (!apiUrl) {
        // 如果没有提供自定义URL，则根据交通方式选择API
        switch (transportType) {
          case 'driving':
            apiUrl = 'https://api.map.baidu.com/directionlite/v1/driving';
            break;
          case 'walking':
            apiUrl = 'https://api.map.baidu.com/directionlite/v1/walking';
            break;
          case 'bicycling':
          case 'ebike':
            apiUrl = 'https://api.map.baidu.com/directionlite/v1/riding';
            break;
          case 'transit':
            apiUrl = 'https://api.map.baidu.com/directionlite/v1/transit';
            break;
          default:
            apiUrl = 'https://api.map.baidu.com/directionlite/v1/driving';
        }
      }
      
      const params = {
        ak: apiKey,
        origin: `${originBd09[1]},${originBd09[0]}`, // 百度API使用 lat,lng 顺序
        destination: `${destinationBd09[1]},${destinationBd09[0]}`, // 百度API使用 lat,lng 顺序
        output: 'json',
        city: options?.city,
        cityD: options?.cityD
      };
      
      logger.debug(`[BaiduSearchProvider] 使用API: ${apiUrl} 获取 ${transportType} 导航路径`);
      
      const response: any = await http.get(apiUrl, params);
      const data = response.data;
      
      if (data.status !== 0) {
        throw new Error(`百度地图导航API错误: ${data.message}`);
      }
      
      logger.debug(`[BaiduSearchProvider] 获取导航路径成功`);
      
      // 返回原始响应，由调用者处理
      return data;
    } catch (error) {
      logger.error(`[BaiduSearchProvider] 获取导航路径失败`, error);
      throw error;
    }
  }
  
  /**
   * 获取提供者名称
   * @returns 提供者名称
   */
  getProviderName(): string {
    return 'baidu';
  }
  
  /**
   * 获取提供者的坐标系统
   * @returns 坐标系统
   */
  getCoordSystem(): CoordSystem {
    return CoordSystem.BD09;
  }
  
  /**
   * 使用指定 URL 搜索地点
   * @param url 搜索 API URL
   * @param keyword 关键词
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async search(url: string, keyword: string, options: SearchOptions): Promise<SearchResult[]> {
    // 复用现有的 searchPlaces 方法，但使用传入的 URL
    return this.searchPlaces(keyword, { ...options, url });
  }
  
  /**
   * 创建导航路线
   * @param url 导航 API URL
   * @param options 导航选项
   * @returns 导航 API 响应
   */
  async createNavigation(url: string, options: { 
    origin: [number, number], 
    destination: [number, number],
    key?: string,
    transport_type?: string
  }): Promise<NavigationApiResponse> {
    try {
      const { origin, destination, key, transport_type = 'driving' } = options;
      
      // 构建请求参数
      const params: Record<string, string> = {
        ak: key || '',
        origin: `${origin[0]},${origin[1]}`,
        destination: `${destination[0]},${destination[1]}`,
        coord_type: 'bd09ll',
        tactics: this.getBaiduTactics(transport_type).toString(),
        alternatives: '1'  // 返回备选路线
      };
      
      // 根据交通工具类型选择不同的 API
      let apiUrl = url;
      if (!apiUrl.includes('direction')) {
        switch(transport_type) {
          case 'walking':
            apiUrl = 'https://api.map.baidu.com/direction/v2/walking';
            break;
          case 'bicycling':
          case 'ebike':
            apiUrl = 'https://api.map.baidu.com/direction/v2/riding';
            break;
          default:
            apiUrl = 'https://api.map.baidu.com/direction/v2/driving';
        }
      }
      
      // 发送请求
      const response = await fetch(`${apiUrl}?${new URLSearchParams(params).toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 检查响应状态
      if (data.status !== 0) {
        throw new Error(`API错误: ${data.message || '未知错误'}`);
      }
      
      // 转换为标准格式
      return this.convertBaiduNavigationResponse(data);
    } catch (error) {
      console.error('创建导航路线失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取百度地图路线规划策略
   * @param transportType 交通工具类型
   * @returns 路线规划策略代码
   */
  private getBaiduTactics(transportType: string): number {
    // 百度地图路线规划策略
    // 驾车：0-最少时间，1-最短距离，2-避开高速，3-避开拥堵
    // 步行：0-推荐路线，1-最短距离
    // 骑行：0-推荐路线，1-最短距离
    switch(transportType) {
      case 'walking':
        return 0; // 推荐路线
      case 'bicycling':
      case 'ebike':
        return 0; // 推荐路线
      default:
        return 0; // 最少时间
    }
  }
  
  /**
   * 转换百度地图导航响应为标准格式
   * @param response 百度地图导航响应
   * @returns 标准格式导航响应
   */
  private convertBaiduNavigationResponse(response: any): NavigationApiResponse {
    if (!response || !response.result || !response.result.routes || response.result.routes.length === 0) {
      return { route: { paths: [] } };
    }
    
    const baiduRoute = response.result.routes[0];
    const paths = [{
      distance: baiduRoute.distance,
      duration: baiduRoute.duration,
      tolls: baiduRoute.toll || 0,
      traffic_lights: baiduRoute.traffic_light_num || 0,
      steps: baiduRoute.steps.map((step: any) => {
        return {
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration,
          polyline: step.path
        };
      }),
      polyline: baiduRoute.steps.map((step: any) => step.path).join(';')
    }];
    
    return {
      route: {
        paths: paths
      }
    };
  }
  
  /**
   * 获取默认搜索 URL
   * @returns 默认搜索 URL
   */
  getDefaultSearchUrl(): string {
    return this.SEARCH_URL;
  }
  
  /**
   * 获取默认详情 URL
   * @returns 默认详情 URL
   */
  getDefaultDetailUrl(): string {
    return this.DETAIL_URL;
  }
  
  /**
   * 获取默认导航 URL
   * @param transportType 交通方式（可选，默认为 driving）
   * @returns 默认导航 URL
   */
  getDefaultNavigationUrl(transportType: string = 'driving'): string {
    switch (transportType) {
      case 'driving':
        return 'https://api.map.baidu.com/directionlite/v1/driving';
      case 'walking':
        return 'https://api.map.baidu.com/directionlite/v1/walking';
      case 'bicycling':
      case 'ebike':
        return 'https://api.map.baidu.com/directionlite/v1/riding';
      case 'transit':
        return 'https://api.map.baidu.com/directionlite/v1/transit';
      default:
        return 'https://api.map.baidu.com/directionlite/v1/driving';
    }
  }
  
  /**
   * 将百度地图POI数据转换为统一的搜索结果格式
   * @param results 百度地图POI数据
   * @returns 统一格式的搜索结果
   */
  private convertToSearchResults(results: any[]): SearchResult[] {
    return results.map(poi => {
      // 获取坐标
      const lng = poi.location?.lng;
      const lat = poi.location?.lat;
      
      // 转换为EPSG:3857坐标系
      const epsg3857Point = GcoordUtils.transform(
        { lng, lat },
        CoordSystem.BD09,
        CoordSystem.EPSG3857
      );
      
      // 从 GeoPoint 提取经纬度
      const epsg3857Coords = GcoordUtils.toObject(epsg3857Point);
      
      return {
        id: poi.uid,
        name: poi.name,
        address: poi.address || '',
        province: poi.province || '',
        city: poi.city || '',
        district: poi.area || '',
        location: {
          lng: lng,
          lat: lat,
          epsg3857: {
            lng: epsg3857Coords.lng,
            lat: epsg3857Coords.lat
          }
        },
        type: poi.detail_info?.tag || '',
        tel: poi.telephone || '',
        distance: poi.detail_info?.distance,
        photos: poi.detail_info?.image?.map((img: string) => img) || [],
        provider: 'baidu',
        rawData: poi
      };
    });
  }
  
  /**
   * 确保坐标是BD09坐标系
   * @param coordinates [lng, lat]坐标
   * @returns BD09坐标系的[lng, lat]
   */
  private ensureBd09Coordinates(coordinates: [number, number]): [number, number] {
    // 这里假设输入的坐标是EPSG:3857，需要转换为BD09
    const epsg3857Point = { lng: coordinates[0], lat: coordinates[1] };
    
    // 转换为BD09
    const bd09Point = GcoordUtils.transform(
      epsg3857Point,
      CoordSystem.EPSG3857,
      CoordSystem.BD09
    );
    
    // 从 GeoPoint 提取经纬度
    const bd09Coords = GcoordUtils.toObject(bd09Point);
    
    return [bd09Coords.lng, bd09Coords.lat];
  }
}