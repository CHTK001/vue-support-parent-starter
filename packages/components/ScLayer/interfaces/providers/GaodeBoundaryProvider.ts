import { BoundaryDataProvider, BoundaryDataFormat, CoordinatePoint } from '../BoundaryDataProvider';
import { fetchGaodeBoundary } from '../../api/district';
import logger from '../../composables/LogObject';
import { CoordSystem, type GeoPoint } from '../../types/coordinate';
import { GcoordUtils } from '../../utils/GcoordUtils';

/**
 * 高德地图区划数据提供者
 * 实现从高德地图API获取区划数据
 */
export class GaodeBoundaryProvider implements BoundaryDataProvider {
  /**
   * 获取区划数据
   * @param adcode 行政区划代码
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @returns 区划数据
   */
  async fetchBoundaryData(adcode: string, apiKey: string, url?: string): Promise<BoundaryDataFormat> {
    try {
      logger.debug(`[GaodeBoundaryProvider] 开始获取区划数据: ${adcode}`);
      
      // 调用高德地图API获取区划数据
      const data = await fetchGaodeBoundary({
        key: apiKey,
        url: url,
        adcode: adcode
      });
      
      logger.debug(`[GaodeBoundaryProvider] 成功获取区划数据: ${adcode}`);
      
      // 确保返回的数据符合 BoundaryDataFormat 接口
      if (!this.isValidBoundaryData(data)) {
        logger.warn(`[GaodeBoundaryProvider] 获取的区划数据格式不符合要求: ${adcode}`);
        // 尝试转换为标准格式
        return this.convertToStandardFormat(data, adcode);
      }
      
      // 如果数据中的 polyline 是字符串，需要转换为数组格式
      if (typeof data.polyline === 'string') {
        const convertedData = { ...data };
        convertedData.polyline = this.parsePolylineString(data.polyline, CoordSystem.GCJ02);
        return {
          ...convertedData,
          sourceCoordType: CoordSystem.GCJ02
        };
      }
      
      return {
        ...data,
        sourceCoordType: CoordSystem.GCJ02
      };
    } catch (error) {
      logger.error(`[GaodeBoundaryProvider] 获取区划数据失败: ${adcode}`, error);
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
   * 将区划数据转换为统一格式（高德格式）
   * 对于高德地图数据，只需添加坐标系统标记
   * @param data 原始区划数据
   * @param options 转换选项
   * @returns 转换后的数据
   */
  convertToGaodeFormat(data: any, options?: any): BoundaryDataFormat {
    // 对于高德地图数据，我们需要将其GCJ02坐标转换为EPSG:3857
    if (!data) {
      return this.createEmptyBoundaryData();
    }
    
    // 如果数据已经符合标准格式，只需添加坐标系统标记
    if (this.isValidBoundaryData(data)) {
      // 如果 polyline 是字符串，需要转换为数组格式
      if (typeof data.polyline === 'string') {
        const convertedData = { ...data };
        convertedData.polyline = this.parsePolylineString(data.polyline, CoordSystem.GCJ02);
        return {
          ...convertedData,
          sourceCoordType: CoordSystem.GCJ02
        };
      }
      
      return {
        ...data,
        sourceCoordType: CoordSystem.GCJ02
      };
    }
    
    // 否则尝试转换为标准格式
    const adcode = data.adcode || '';
    return this.convertToStandardFormat(data, adcode);
  }
  
  /**
   * 解析 polyline 字符串为坐标点数组
   * @param polyline polyline 字符串
   * @param sourceCoordType 源坐标系统
   * @returns 坐标点数组
   */
  private parsePolylineString(polyline: string, sourceCoordType: CoordSystem): CoordinatePoint[][] {
    if (!polyline) {
      return [];
    }
    
    const result: CoordinatePoint[][] = [];
    
    // 按 '|' 分隔不同的多边形部分
    const parts = polyline.split('|');
    parts.forEach(part => {
      if (!part.trim()) return;
      
      const points: CoordinatePoint[] = [];
      
      // 按 ';' 分隔多边形的环
      const ringStrs = part.split(';');
      ringStrs.forEach(ringStr => {
        if (!ringStr.trim()) return;
        
        // 每个ringStr是"lng1,lat1,lng2,lat2,..."
        const pointPairs = ringStr.split(',');
        if (pointPairs.length % 2 !== 0) {
          logger.warn('坐标点格式不正确:', ringStr);
          return;
        }
        
        for (let i = 0; i < pointPairs.length; i += 2) {
          const lng = parseFloat(pointPairs[i]);
          const lat = parseFloat(pointPairs[i + 1]);
          
          if (!isNaN(lng) && !isNaN(lat)) {
            // 将坐标转换为 EPSG:3857
            try {
              const geoPoint = GcoordUtils.transform(
                { lng, lat },
                sourceCoordType,
                CoordSystem.EPSG3857
              );
              
              // 从 GeoPoint 提取经纬度
              const epsg3857Point = GcoordUtils.toObject(geoPoint);
              
              // 保存原始坐标和转换后的坐标
              points.push({
                lng: epsg3857Point.lng,
                lat: epsg3857Point.lat,
                original: { lng, lat }
              });
            } catch (error) {
              logger.error(`坐标转换失败: ${lng},${lat}`, error);
              // 如果转换失败，仍然添加原始坐标
              points.push({
                lng,
                lat,
                original: { lng, lat }
              });
            }
          }
        }
      });
      
      if (points.length > 0) {
        result.push(points);
      }
    });
    
    return result;
  }
  
  /**
   * 检查数据是否符合 BoundaryDataFormat 接口
   * @param data 要检查的数据
   * @returns 是否符合
   */
  private isValidBoundaryData(data: any): data is BoundaryDataFormat {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.adcode === 'string' &&
      typeof data.name === 'string' &&
      (typeof data.polyline === 'string' || Array.isArray(data.polyline))
    );
  }
  
  /**
   * 创建空的区划数据
   * @returns 空的区划数据
   */
  private createEmptyBoundaryData(): BoundaryDataFormat {
    return {
      citycode: '',
      adcode: '',
      name: '',
      polyline: [],
      center: '',
      level: '',
      districts: []
    };
  }
  
  /**
   * 将数据转换为标准格式
   * @param data 原始数据
   * @param adcode 行政区划代码
   * @returns 标准格式的数据
   */
  private convertToStandardFormat(data: any, adcode: string): BoundaryDataFormat {
    // 尝试从原始数据中提取必要的字段
    let polylineData: CoordinatePoint[][] = [];
    
    // 处理 polyline 字段
    if (typeof data.polyline === 'string') {
      polylineData = this.parsePolylineString(data.polyline, CoordSystem.GCJ02);
    } else if (data.bounds && typeof data.bounds === 'string') {
      polylineData = this.parsePolylineString(data.bounds, CoordSystem.GCJ02);
    } else if (Array.isArray(data.polyline)) {
      polylineData = data.polyline;
    }
    
    const result: BoundaryDataFormat = {
      citycode: data.citycode || '',
      adcode: data.adcode || adcode,
      name: data.name || '',
      polyline: polylineData,
      center: data.center || '',
      level: data.level || 'district',
      sourceCoordType: CoordSystem.GCJ02
    };
    
    // 处理下级区划
    if (data.districts && Array.isArray(data.districts)) {
      result.districts = data.districts.map((district: any) => 
        this.convertToStandardFormat(district, district.adcode || '')
      );
    }
    
    return result;
  }
} 