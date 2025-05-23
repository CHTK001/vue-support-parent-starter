import type { BoundaryConverter } from '../BoundaryConverter';
import type { BoundaryOptions } from '../../types/boundary';
import { GcoordUtils } from '../../utils/GcoordUtils';
import { CoordType } from '../../types/coordinate';

/**
 * 百度地图区划转换器
 * 将百度地图的区划数据直接转换为EPSG:3857坐标系格式
 */
export class BaiduConverter implements BoundaryConverter {
  convertToGaode(data: any, options: BoundaryOptions): any {
    // 百度地图的区划数据需要转换坐标系统
    if (!data || !data.geometry || !data.geometry.coordinates) {
      return data;
    }

    // 转换坐标系统
    const convertedData = {
      ...data,
      geometry: {
        ...data.geometry,
        coordinates: this.convertCoordinates(data.geometry.coordinates)
      }
    };

    return convertedData;
  }

  /**
   * 转换坐标系统
   * 从百度坐标系统(BD09)直接转换为EPSG:3857坐标系
   */
  private convertCoordinates(coordinates: number[][]): number[][] {
    return coordinates.map(coord => {
      const [lng, lat] = coord;
      
      // 使用GcoordUtils进行坐标转换 - 从百度坐标系(BD09)直接转换为EPSG:3857
      try {
        const epsg3857Point = GcoordUtils.transform(
          { lng, lat },
          CoordType.BD09,
          CoordType.EPSG3857
        );
        
        // 返回转换后的坐标
        if (Array.isArray(epsg3857Point)) {
          return epsg3857Point;
        } else {
          return [epsg3857Point.lng, epsg3857Point.lat];
        }
      } catch (error) {
        console.error('百度坐标转换失败:', error);
        // 使用两步转换作为备选方法
        // 1. 先从BD09转换为WGS84
        const wgs84Point = GcoordUtils.bd09ToWgs84ByLngLat(lng, lat);
        // 2. 再从WGS84转换为EPSG:3857
        return GcoordUtils.wgs84ToEpsg3857Precise(wgs84Point[1], wgs84Point[0]);
      }
    });
  }
} 