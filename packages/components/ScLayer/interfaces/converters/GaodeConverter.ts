import { BoundaryConverter } from '../BoundaryConverter';
import type { BoundaryOptions } from '../../types/boundary';
import { CoordSystem } from '../../types/coordinate';

/**
 * 高德地图区划转换器
 * 将高德地图的GCJ02坐标系数据转换为EPSG:3857坐标系
 */
export class GaodeConverter implements BoundaryConverter {
  convertToGaode(data: any, options: BoundaryOptions): any {
    // 对于高德地图数据，我们需要将其GCJ02坐标转换为EPSG:3857
    if (!data) {
      return data;
    }
    
    // 高德地图数据的处理与其他地图提供商不同
    // polyline字段不需要转换，因为它会在parseGaodePolylineToFeatures中处理
    // 只需要添加一个sourceCoordType标记，表示这是GCJ02坐标系
    return {
      ...data,
      sourceCoordType: CoordSystem.GCJ02
    };
  }
} 