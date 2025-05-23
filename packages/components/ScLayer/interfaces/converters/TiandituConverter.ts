import type { BoundaryConverter } from '../BoundaryConverter';
import type { BoundaryOptions } from '../../types/boundary';
import { GcoordUtils } from '../../utils/GcoordUtils';
import { CoordType } from '../../types/coordinate';

/**
 * 天地图区划转换器
 * 将天地图的区划数据直接转换为EPSG:3857坐标系格式
 */
export class TiandituConverter implements BoundaryConverter {
  convertToGaode(data: any, options: BoundaryOptions): any {
    // 天地图的区划数据需要转换坐标系统
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
   * 从天地图坐标系统(EPSG:4490)直接转换为EPSG:3857坐标系
   */
  private convertCoordinates(coordinates: number[][]): number[][] {
    return coordinates.map(coord => {
      const [lng, lat] = coord;
      
      // 使用GcoordUtils进行坐标转换 - 从EPSG:4490直接转换为EPSG:3857
      try {
        // 天地图使用的是国家2000大地坐标系(EPSG:4490)
        const epsg3857Point = GcoordUtils.transform(
          { lng, lat },
          CoordType.EPSG4490,
          CoordType.EPSG3857
        );
        
        // 返回转换后的坐标
        if (Array.isArray(epsg3857Point)) {
          return epsg3857Point;
        } else {
          return [epsg3857Point.lng, epsg3857Point.lat];
        }
      } catch (error) {
        console.error('天地图坐标转换失败:', error);
        // 使用备选方法：EPSG:4490与WGS84非常接近，可以直接使用wgs84ToEpsg3857Precise
        return GcoordUtils.wgs84ToEpsg3857Precise(lat, lng);
      }
    });
  }
} 