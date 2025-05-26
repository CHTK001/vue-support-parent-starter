import { SearchDataProvider } from '../SearchDataProvider';
import { SearchOptions, SearchResult, PlaceDetailApiResponse, NavigationApiResponse } from '../../types/search';
import { CoordSystem } from '../../types/coordinate';
import logger from '../../composables/LogObject';
import { GcoordUtils } from '../../utils/GcoordUtils';
import axios from 'axios';

/**
 * 高德地图搜索数据提供者
 * 实现从高德地图API获取搜索数据
 */
export class GaodeSearchProvider implements SearchDataProvider {
  // 高德地图API URL
  private readonly SEARCH_URL = 'https://restapi.amap.com/v3/place/text';
  private readonly DETAIL_URL = 'https://restapi.amap.com/v3/place/detail';
  private readonly NAVIGATION_URL = 'https://restapi.amap.com/v3/direction/driving';
  
  /**
   * 搜索地点
   * @param keyword 关键词
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async searchPlaces(keyword: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      logger.debug(`[GaodeSearchProvider] 开始搜索: ${keyword}`);
      
      const params = {
        key: options.key,
        keywords: keyword,
        city: options.city || '',
        citylimit: options.cityLimit ? 'true' : 'false',
        extensions: 'all',
        offset: options.pageSize || 20,
        page: options.pageIndex || 1,
        output: 'JSON'
      };
      
      // 如果提供了自定义URL，则使用自定义URL
      const url = options.url || this.SEARCH_URL;
      
      const response = await axios.get(url, { params });
      const data = response.data;
      
      if (data.status !== '1') {
        throw new Error(`高德地图搜索API错误: ${data.info}`);
      }
      
      logger.debug(`[GaodeSearchProvider] 搜索成功，找到 ${data.pois?.length || 0} 条结果`);
      
      // 转换为统一格式
      return this.convertToSearchResults(data.pois || []);
    } catch (error) {
      logger.error(`[GaodeSearchProvider] 搜索失败: ${keyword}`, error);
      throw error;
    }
  }
  
  /**
   * 获取地点详情
   * @param id 地点ID
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @returns 地点详情
   */
  async getPlaceDetail(id: string, apiKey: string, url?: string): Promise<PlaceDetailApiResponse> {
    try {
      logger.debug(`[GaodeSearchProvider] 开始获取地点详情: ${id}`);
      
      const params = {
        key: apiKey,
        id: id,
        output: 'JSON'
      };
      
      // 如果提供了自定义URL，则使用自定义URL
      const requestUrl = url || this.DETAIL_URL;
      
      const response = await axios.get(requestUrl, { params });
      const data = response.data;
      
      if (data.status !== '1') {
        throw new Error(`高德地图详情API错误: ${data.info}`);
      }
      
      logger.debug(`[GaodeSearchProvider] 获取地点详情成功: ${id}`);
      
      // 返回原始响应，由调用者处理
      return data;
    } catch (error) {
      logger.error(`[GaodeSearchProvider] 获取地点详情失败: ${id}`, error);
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
      logger.debug(`[GaodeSearchProvider] 开始获取导航路径: ${origin} -> ${destination}`);
      
      // 确保坐标是GCJ02坐标系
      const originGcj02 = this.ensureGcj02Coordinates(origin);
      const destinationGcj02 = this.ensureGcj02Coordinates(destination);
      
      const params = {
        key: apiKey,
        origin: `${originGcj02[0]},${originGcj02[1]}`,
        destination: `${destinationGcj02[0]},${destinationGcj02[1]}`,
        extensions: 'all',
        output: 'JSON'
      };
      
      // 如果提供了自定义URL，则使用自定义URL
      const requestUrl = url || this.NAVIGATION_URL;
      
      const response = await axios.get(requestUrl, { params });
      const data = response.data;
      
      if (data.status !== '1') {
        throw new Error(`高德地图导航API错误: ${data.info}`);
      }
      
      logger.debug(`[GaodeSearchProvider] 获取导航路径成功`);
      
      // 返回原始响应，由调用者处理
      return data;
    } catch (error) {
      logger.error(`[GaodeSearchProvider] 获取导航路径失败`, error);
      throw error;
    }
  }
  
  /**
   * 获取提供者名称
   * @returns 提供者名称
   */
  getProviderName(): string {
    return 'gaode';
  }
  
  /**
   * 获取提供者的坐标系统
   * @returns 坐标系统
   */
  getCoordSystem(): CoordSystem {
    return CoordSystem.GCJ02;
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
   * @returns 导航路径
   */
  async createNavigation(url: string, options: { origin: [number, number], destination: [number, number] }): Promise<NavigationApiResponse> {
    // 复用现有的 getNavigation 方法，但使用传入的 URL
    return this.getNavigation(options.origin, options.destination, options['key'] || '', url);
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
   * @returns 默认导航 URL
   */
  getDefaultNavigationUrl(): string {
    return this.NAVIGATION_URL;
  }
  
  /**
   * 将高德地图POI数据转换为统一的搜索结果格式
   * @param pois 高德地图POI数据
   * @returns 统一格式的搜索结果
   */
  private convertToSearchResults(pois: any[]): SearchResult[] {
    return pois.map(poi => {
      // 解析坐标
      const location = poi.location.split(',');
      const lng = parseFloat(location[0]);
      const lat = parseFloat(location[1]);
      
      // 转换为EPSG:3857坐标系
      const epsg3857Point = GcoordUtils.transform(
        { lng, lat },
        CoordSystem.GCJ02,
        CoordSystem.EPSG3857
      );
      
      // 从 GeoPoint 提取经纬度
      const epsg3857Coords = GcoordUtils.toObject(epsg3857Point);
      
      return {
        id: poi.id,
        name: poi.name,
        address: poi.address || '',
        province: poi.pname || '',
        city: poi.cityname || '',
        district: poi.adname || '',
        location: {
          lng: lng,
          lat: lat,
          epsg3857: {
            lng: epsg3857Coords.lng,
            lat: epsg3857Coords.lat
          }
        },
        type: poi.type || '',
        tel: poi.tel || '',
        distance: poi.distance ? parseInt(poi.distance) : undefined,
        photos: poi.photos?.map((photo: any) => photo.url) || [],
        provider: 'gaode',
        rawData: poi
      };
    });
  }
  
  /**
   * 确保坐标是GCJ02坐标系
   * @param coordinates [lng, lat]坐标
   * @returns GCJ02坐标系的[lng, lat]
   */
  private ensureGcj02Coordinates(coordinates: [number, number]): [number, number] {
    // 这里假设输入的坐标是EPSG:3857，需要转换为GCJ02
    const epsg3857Point = { lng: coordinates[0], lat: coordinates[1] };
    
    // 转换为GCJ02
    const gcj02Point = GcoordUtils.transform(
      epsg3857Point,
      CoordSystem.EPSG3857,
      CoordSystem.GCJ02
    );
    
    // 从 GeoPoint 提取经纬度
    const gcj02Coords = GcoordUtils.toObject(gcj02Point);
    
    return [gcj02Coords.lng, gcj02Coords.lat];
  }
} 