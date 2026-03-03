import { SearchDataProvider } from '../SearchDataProvider';
import { SearchOptions, SearchResult, PlaceDetailApiResponse, NavigationApiResponse } from '../../types/search';
import { CoordSystem, type GeoPoint } from '../../types/coordinate';
import logger from '../../composables/LogObject';
import { fromLonLat, toLonLat } from 'ol/proj';
import { http } from "@repo/utils";

/**
 * 高德地图搜索数据提供者
 * 实现从高德地图API获取搜索数据
 */
export class GaodeSearchProvider implements SearchDataProvider {
  // 高德地图API URL
  private readonly SEARCH_URL = 'https://restapi.amap.com/v3/place/text';
  private readonly DETAIL_URL = 'https://restapi.amap.com/v3/place/detail';
  private readonly NAVIGATION_URL = 'https://restapi.amap.com/v3/direction/driving';
  private readonly AROUND_URL = 'https://restapi.amap.com/v3/place/around';
  private readonly DISTRICT_URL = 'https://restapi.amap.com/v3/config/district';
  
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
      
      const response: any = await http.get(url, params);
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
      
      const response: any = await http.get(requestUrl, params);
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
   * @param transportType 交通方式（可选，默认为 driving）
   * @returns 导航路径
   */
  async getNavigation(origin: GeoPoint, destination: GeoPoint, apiKey: string, url?: string, transportType: string = 'driving', options?: {
    city?: string;
    cityD?: string;
  }): Promise<NavigationApiResponse> {
    try {
      logger.debug(`[GaodeSearchProvider] 开始获取导航路径: ${origin} -> ${destination}, 交通方式: ${transportType}`);
      
      // 确保坐标是GCJ02坐标系
      const originGcj02 = this.ensureGcj02Coordinates(origin);
      const destinationGcj02 = this.ensureGcj02Coordinates(destination);
      
      // 根据交通方式确定API URL
      let apiUrl = url;
      if (!apiUrl) {
        // 如果没有提供自定义URL，则根据交通方式选择API
        switch (transportType) {
          case 'driving':
            apiUrl = 'https://restapi.amap.com/v3/direction/driving';
            break;
          case 'walking':
            apiUrl = 'https://restapi.amap.com/v3/direction/walking';
            break;
          case 'bicycling':
            apiUrl = 'https://restapi.amap.com/v3/direction/bicycling';
            break;
          case 'ebike':
            apiUrl = 'https://restapi.amap.com/v3/direction/ebike';
            break;
          case 'transit':
            apiUrl = 'https://restapi.amap.com/v3/direction/transit/integrated';
            break;
          default:
            apiUrl = 'https://restapi.amap.com/v3/direction/driving';
        }
      }
      
      const params = {
        key: apiKey,
        origin: `${originGcj02[0]},${originGcj02[1]}`,
        destination: `${destinationGcj02[0]},${destinationGcj02[1]}`,
        strategy: 11,
        extensions: 'all',
        output: 'JSON',
        city: options?.city,
        cityD: options?.cityD
      };
      
      logger.debug(`[GaodeSearchProvider] 使用API: ${apiUrl} 获取 ${transportType} 导航路径`);
      
      const response: any = await http.get(apiUrl, params);
      const data = response.data;
      
      if (data.status !== '1') {
        throw new Error(`高德地图导航API错误: ${data.info}`);
      }
      
      logger.debug(`[GaodeSearchProvider] 获取导航路径成功`);
      
      // 如果是公交车导航，需要特殊处理数据格式
      if (transportType === 'transit') {
        return this.convertTransitResponse(data);
      }
      
      // 返回原始响应，由调用者处理
      return data;
    } catch (error) {
      logger.error(`[GaodeSearchProvider] 获取导航路径失败`, error);
      throw error;
    }
  }
  
  /**
   * 转换公交车导航数据为统一格式
   * @param response 高德地图公交车导航API响应
   * @returns 统一格式的导航API响应
   */
  private convertTransitResponse(response: any): NavigationApiResponse {
    try {
      logger.debug(`[GaodeSearchProvider] 开始转换公交车导航数据`);
      
      // 检查响应数据是否有效
      if (!response || !response.route || !response.route.transits || response.route.transits.length === 0) {
        logger.warn(`[GaodeSearchProvider] 公交车导航数据无效或为空`);
        return { route: { paths: [] } };
      }
      
      // 获取公交车方案列表
      const transits = response.route.transits;
      
      // 创建统一格式的路径数组
      const paths = transits.map((transit: any) => {
        // 计算总距离和时间
        const distance = transit.distance || 0;
        const duration = transit.duration || 0;
        
        // 收集所有路段
        const steps: any[] = [];
        
        // 处理每个路段
        if (transit.segments && transit.segments.length > 0) {
          transit.segments.forEach((segment: any) => {
            // 处理步行路段
            if (segment.walking && segment.walking.steps && segment.walking.steps.length > 0) {
              segment.walking.steps.forEach((walkStep: any) => {
                steps.push({
                  instruction: walkStep.instruction || '步行',
                  distance: walkStep.distance || 0,
                  duration: walkStep.duration || 0,
                  polyline: walkStep.polyline || '',
                  type: 'walking'
                });
              });
            }
            
            // 处理公交路段
            if (segment.bus && segment.bus.buslines && segment.bus.buslines.length > 0) {
              segment.bus.buslines.forEach((busLine: any) => {
                steps.push({
                  instruction: `乘坐 ${busLine.name || '公交车'} (${busLine.departure_stop?.name || ''} -> ${busLine.arrival_stop?.name || ''})`,
                  distance: busLine.distance || 0,
                  duration: busLine.duration || 0,
                  polyline: busLine.polyline || '',
                  type: 'bus',
                  busName: busLine.name,
                  departureStop: busLine.departure_stop?.name,
                  arrivalStop: busLine.arrival_stop?.name
                });
              });
            }
            
            // 处理地铁路段
            if (segment.railway && segment.railway.spaces && segment.railway.spaces.length > 0) {
              segment.railway.spaces.forEach((railwaySpace: any) => {
                steps.push({
                  instruction: `乘坐 ${segment.railway.name || '地铁'} (${railwaySpace.departure_stop?.name || ''} -> ${railwaySpace.arrival_stop?.name || ''})`,
                  distance: railwaySpace.distance || 0,
                  duration: railwaySpace.duration || 0,
                  polyline: railwaySpace.polyline || '',
                  type: 'subway',
                  subwayName: segment.railway.name,
                  departureStop: railwaySpace.departure_stop?.name,
                  arrivalStop: railwaySpace.arrival_stop?.name
                });
              });
            }
          });
        }
        
        // 构建统一格式的路径对象
        return {
          distance: distance,
          duration: duration,
          steps: steps,
          cost: transit.cost || 0,
          // 提取所有步骤的折线数据，合并为一条完整的路径
          polyline: steps.map(step => step.polyline).filter(Boolean).join(';')
        };
      });
      
      // 返回统一格式的导航响应
      return {
        status: response.status,
        info: response.info,
        infocode: response.infocode,
        count: transits.length,
        route: {
          origin: response.route.origin,
          destination: response.route.destination,
          paths: paths
        }
      };
    } catch (error) {
      logger.error(`[GaodeSearchProvider] 转换公交车导航数据失败:`, error);
      // 发生错误时返回空路径
      return { route: { paths: [] } };
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
      const params = {
        //@ts-ignore
        key: key || this.apiKey,
        origin: `${origin[0]},${origin[1]}`,
        destination: `${destination[0]},${destination[1]}`,
        show_fields: 'cost,polyline',
        alternative_routes: '3',  // 返回3条可选路线
        extensions: 'all'
      };
      
      // 发送请求
      const response = await fetch(`${url}?${new URLSearchParams(params).toString()}`, {
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
      if (data.status !== '1' && data.status !== 1 && data.infocode !== '10000') {
        throw new Error(`API错误: ${data.info || '未知错误'}`);
      }
      
      // 如果是公交车导航，需要特殊处理数据格式
      if (transport_type === 'transit') {
        return this.convertTransitResponse(data);
      }
      
      return data;
    } catch (error) {
      console.error('创建导航路线失败:', error);
      throw error;
    }
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
        return 'https://restapi.amap.com/v3/direction/driving';
      case 'walking':
        return 'https://restapi.amap.com/v3/direction/walking';
      case 'bicycling':
        return 'https://restapi.amap.com/v3/direction/bicycling';
      case 'ebike':
        return 'https://restapi.amap.com/v3/direction/ebike';
      case 'transit':
        return 'https://restapi.amap.com/v3/direction/transit/integrated';
      default:
        return 'https://restapi.amap.com/v3/direction/driving';
    }
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
      const projCoords = fromLonLat([lng, lat]);
      // 直接使用原始坐标，不进行转换
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
            lng: projCoords[0],
            lat: projCoords[1]
          },
          source: {
            lng: lng,
            lat: lat
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
  private ensureGcj02Coordinates(coordinates:  GeoPoint): [number, number] {
    // 直接使用原始坐标，不进行转换
    return Array.isArray(coordinates) ? coordinates : [coordinates.lng, coordinates.lat];
  }
  
  /**
   * 附近搜索
   * @param url 搜索 API URL
   * @param keyword 关键词
   * @param options 搜索选项，必须包含 location 和 radius
   * @returns 搜索结果
   */
  async searchNearby(url: string, keyword: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      logger.debug(`[GaodeSearchProvider] 开始附近搜索: ${keyword}`);
      
      // 获取位置信息，使用类型断言访问 location 属性
      const location = (options as any).location;
      if (!location || !Array.isArray(location) || location.length < 2) {
        throw new Error('附近搜索缺少有效的位置信息');
      }
      
      // 确保坐标是GCJ02坐标系
      const gcj02Coords = this.ensureGcj02Coordinates([location[0], location[1]]);
      
      const params = {
        key: options.key,
        keywords: keyword,
        location: `${gcj02Coords[0]},${gcj02Coords[1]}`,
        radius: options.radius || 5000,
        extensions: 'all',
        offset: options.pageSize || 20,
        page: options.pageIndex || 1,
        output: 'JSON'
      };
      
      // 如果提供了自定义URL，则使用自定义URL
      const requestUrl = url || this.AROUND_URL;
      
      const response: any = await http.get(requestUrl, params);
      const data = response.data;
      
      if (data.status !== '1') {
        throw new Error(`高德地图附近搜索API错误: ${data.info}`);
      }
      
      logger.debug(`[GaodeSearchProvider] 附近搜索成功，找到 ${data.pois?.length || 0} 条结果`);
      
      // 转换为统一格式
      return this.convertToSearchResults(data.pois || []);
    } catch (error) {
      logger.error(`[GaodeSearchProvider] 附近搜索失败: ${keyword}`, error);
      throw error;
    }
  }
  
  /**
   * 行政区搜索
   * @param url 搜索 API URL
   * @param keyword 行政区名称
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async searchDistrict(url: string, keyword: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      logger.debug(`[GaodeSearchProvider] 开始行政区搜索: ${keyword}`);
      
      const params = {
        key: options.key,
        keywords: keyword,
        subdistrict: (options as any).subdistrict || 1, // 返回下一级行政区信息
        extensions: (options as any).extensions || 'all', // 返回行政区边界坐标点
        output: 'JSON'
      };
      
      // 如果提供了自定义URL，则使用自定义URL
      const requestUrl = url || this.DISTRICT_URL;
      
      const response: any = await http.get(requestUrl, params);
      const data = response.data;
      
      if (data.status !== '1') {
        throw new Error(`高德地图行政区搜索API错误: ${data.info}`);
      }
      
      logger.debug(`[GaodeSearchProvider] 行政区搜索成功，找到 ${data.districts?.length || 0} 条结果`);
      
      // 转换行政区数据为搜索结果格式
      return this.convertDistrictsToSearchResults(data.districts || []);
    } catch (error) {
      logger.error(`[GaodeSearchProvider] 行政区搜索失败: ${keyword}`, error);
      throw error;
    }
  }
  
  /**
   * 将高德地图行政区数据转换为统一的搜索结果格式
   * @param districts 高德地图行政区数据
   * @returns 统一格式的搜索结果
   */
  private convertDistrictsToSearchResults(districts: any[]): SearchResult[] {
    return districts.map(district => {
      // 获取行政区中心点坐标
      let lng = 0, lat = 0;
      
      if (district.center) {
        const center = district.center.split(',');
        lng = parseFloat(center[0]);
        lat = parseFloat(center[1]);
      }
      
      const projCoords = fromLonLat([lng, lat]);
      // 直接使用原始坐标，不进行转换
      return {
        id: district.adcode,
        name: district.name,
        address: `${district.name}, ${district.level}级行政区`,
        province: district.level === 'province' ? district.name : district.province || '',
        city: district.level === 'city' ? district.name : district.city || '',
        district: district.level === 'district' ? district.name : district.district || '',
        location: {
          lng: lng,
          lat: lat,
          epsg3857: {
            lng: projCoords[0],
            lat: projCoords[1]
          },
          source: {
            lng: lng,
            lat: lat
          }
        },
        type: 'district',
        level: district.level,
        provider: 'gaode',
        rawData: district
      };
    });
  }
}