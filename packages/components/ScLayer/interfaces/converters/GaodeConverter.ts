import type { BoundaryConverter } from '../BoundaryConverter';
import type { BoundaryOptions } from '../../types/boundary';

/**
 * 高德地图区划转换器
 * 由于高德地图本身就是目标格式，所以直接返回原始数据
 */
export class GaodeConverter implements BoundaryConverter {
  convertToGaode(data: any, options: BoundaryOptions): any {
    // 高德地图数据已经是目标格式，直接返回
    return data;
  }
} 