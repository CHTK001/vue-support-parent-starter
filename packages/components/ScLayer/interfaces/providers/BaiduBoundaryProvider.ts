import { BoundaryDataProvider, BoundaryDataFormat, CoordinatePoint } from '../BoundaryDataProvider';
import { fetchBaiduBoundary } from '../../api/district';
import logger from '../../composables/LogObject';
import { GcoordUtils } from '../../utils/GcoordUtils';
import { CoordSystem, type GeoPoint } from '../../types/coordinate';

/**
 * 百度地图区划数据提供者
 * 实现从百度地图API获取区划数据
 */
export class BaiduBoundaryProvider implements BoundaryDataProvider {
  /**
   * 获取区划数据
   * @param adcode 行政区划代码
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @returns 区划数据
   */
  async fetchBoundaryData(adcode: string, apiKey: string, url?: string): Promise<BoundaryDataFormat> {
    try {
      logger.debug(`[BaiduBoundaryProvider] 开始获取区划数据: ${adcode}`);
      
      // 调用百度地图API获取区划数据
      const data = await fetchBaiduBoundary({
        key: apiKey,
        url: url,
        adcode: adcode
      });
      
      logger.debug(`[BaiduBoundaryProvider] 成功获取区划数据: ${adcode}`);
      
      // 将百度地图数据转换为标准格式
      return this.convertToGaodeFormat(data, { adcode });
    } catch (error) {
      logger.error(`[BaiduBoundaryProvider] 获取区划数据失败: ${adcode}`, error);
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
   * 将区划数据转换为统一格式（高德格式）
   * 将百度地图的区划数据直接转换为EPSG:3857坐标系格式
   * @param data 原始区划数据
   * @param options 转换选项
   * @returns 转换后的数据
   */
  convertToGaodeFormat(data: any, options?: any): BoundaryDataFormat {
    // 百度地图的区划数据需要转换坐标系统
    if (!data) {
      return this.createEmptyBoundaryData();
    }
    
    // 获取adcode
    const adcode = options?.adcode || data?.adcode || '';
    const name = data?.name || '';
    
    // 处理百度地图的边界数据
    let polyline: CoordinatePoint[][] = [];
    if (data && data.geometry && data.geometry.coordinates) {
      // 将百度坐标系的多边形坐标转换为坐标点数组
      polyline = this.convertCoordinatesToPolylineArray(data.geometry.coordinates);
    } else if (data && data.bounds) {
      // 如果有bounds字段，解析为坐标点数组
      polyline = this.parsePolylineString(data.bounds, CoordSystem.BD09);
    }
    
    // 处理中心点
    let center = '';
    if (data && data.center) {
      if (Array.isArray(data.center)) {
        center = `${data.center[0]},${data.center[1]}`;
      } else if (typeof data.center === 'string') {
        center = data.center;
      } else if (data.center.lng && data.center.lat) {
        center = `${data.center.lng},${data.center.lat}`;
      }
    }
    
    // 创建标准格式的数据
    const result: BoundaryDataFormat = {
      citycode: data.citycode || '',
      adcode: adcode,
      name: name,
      polyline: polyline,
      center: center,
      level: data.level || 'district',
      sourceCoordType: CoordSystem.BD09
    };
    
    // 处理下级区划
    if (data.districts && Array.isArray(data.districts)) {
      result.districts = data.districts.map((district: any) => 
        this.convertToGaodeFormat(district, { adcode: district.adcode || '' })
      );
    }
    
    return result;
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
      sourceCoordType: CoordSystem.BD09
    };
  }
  
  /**
   * 将坐标数组转换为坐标点数组
   * @param coordinates 坐标数组
   * @returns 坐标点数组
   */
  private convertCoordinatesToPolylineArray(coordinates: number[][]): CoordinatePoint[][] {
    if (!coordinates || coordinates.length === 0) {
      return [];
    }
    
    // 将坐标数组转换为坐标点数组
    const points: CoordinatePoint[] = coordinates.map(coord => {
      const lng = coord[0];
      const lat = coord[1];
      
      // 使用GcoordUtils进行坐标转换 - 从百度坐标系(BD09)直接转换为EPSG:3857
      try {
        const geoPoint = GcoordUtils.transform(
          { lng, lat },
          CoordSystem.BD09,
          CoordSystem.EPSG3857
        );
        
        // 从 GeoPoint 提取经纬度
        const epsg3857Point = GcoordUtils.toObject(geoPoint);
        
        // 返回转换后的坐标点
        return {
          lng: epsg3857Point.lng,
          lat: epsg3857Point.lat,
          original: { lng, lat }
        };
      } catch (error) {
        logger.error(`百度坐标转换失败: ${lng},${lat}`, error);
        // 使用两步转换作为备选方法
        // 1. 先从BD09转换为WGS84
        const wgs84Point = GcoordUtils.bd09ToWgs84ByLngLat(lng, lat);
        // 2. 再从WGS84转换为EPSG:3857
        const epsg3857Coords = GcoordUtils.wgs84ToEpsg3857Precise(wgs84Point[1], wgs84Point[0]);
        
        return {
          lng: epsg3857Coords[0],
          lat: epsg3857Coords[1],
          original: { lng, lat }
        };
      }
    });
    
    // 返回二维数组，每个子数组表示一个闭合环
    return [points];
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
} 