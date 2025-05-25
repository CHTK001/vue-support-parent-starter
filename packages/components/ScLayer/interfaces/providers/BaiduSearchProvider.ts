import { SearchDataProvider } from '../SearchDataProvider';
import { SearchOptions, SearchResult, PlaceDetailApiResponse, NavigationApiResponse } from '../../types/search';
import { CoordSystem } from '../../types/coordinate';
import logger from '../../composables/LogObject';
import { GcoordUtils } from '../../utils/GcoordUtils';
import axios from 'axios';

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
      
      const response = await axios.get(url, { params });
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
      
      const response = await axios.get(requestUrl, { params });
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
   * @returns 导航路径
   */
  async getNavigation(origin: [number, number], destination: [number, number], apiKey: string, url?: string): Promise<NavigationApiResponse> {
    try {
      logger.debug(`[BaiduSearchProvider] 开始获取导航路径: ${origin} -> ${destination}`);
      
      // 确保坐标是BD09坐标系
      const originBd09 = this.ensureBd09Coordinates(origin);
      const destinationBd09 = this.ensureBd09Coordinates(destination);
      
      const params = {
        ak: apiKey,
        origin: `${originBd09[1]},${originBd09[0]}`, // 百度API使用 lat,lng 顺序
        destination: `${destinationBd09[1]},${destinationBd09[0]}`, // 百度API使用 lat,lng 顺序
        output: 'json'
      };
      
      // 如果提供了自定义URL，则使用自定义URL
      const requestUrl = url || this.NAVIGATION_URL;
      
      const response = await axios.get(requestUrl, { params });
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