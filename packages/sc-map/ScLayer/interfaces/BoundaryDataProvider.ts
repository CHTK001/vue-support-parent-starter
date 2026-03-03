import { BoundaryLevel } from '../types/boundary';
import { CoordSystem } from '../types/coordinate';

/**
 * 坐标点接口
 * 定义单个坐标点的格式
 */
export interface CoordinatePoint {
  lng: number;
  lat: number;
  original?: {
    lng: number;
    lat: number;
  };
}

/**
 * 区划数据格式接口
 * 定义区划数据的标准格式
 */
export interface BoundaryDataFormat {
  citycode: string;
  adcode: string;
  name: string;
  polyline: CoordinatePoint[][];  // 修改为二维数组，每个子数组表示一个闭合环
  center: string;
  level: string | BoundaryLevel;
  districts?: BoundaryDataFormat[];
  sourceCoordType?: string | CoordSystem;
}

/**
 * 区划数据提供者接口
 * 定义获取不同地图服务商区划数据的标准接口
 */
export interface BoundaryDataProvider {
  /**
   * 获取区划数据
   * @param adcode 行政区划代码
   * @param apiKey API密钥
   * @param url 自定义API地址（可选）
   * @returns 区划数据
   */
  fetchBoundaryData(adcode: string, apiKey: string, url?: string): Promise<BoundaryDataFormat>;
  
  /**
   * 获取提供者名称
   * @returns 提供者名称
   */
  getProviderName(): string;
  
  /**
   * 将区划数据转换为统一格式（高德格式）
   * @param data 原始区划数据
   * @param options 转换选项
   * @returns 转换后的数据
   */
  convertToGaodeFormat(data: any, options?: any): BoundaryDataFormat;
}

/**
 * 区划数据提供者工厂
 * 用于创建和管理不同地图服务商的区划数据提供者
 */
export class BoundaryDataProviderFactory {
  private static providers: Map<string, BoundaryDataProvider> = new Map();
  
  /**
   * 注册区划数据提供者
   * @param provider 提供者名称
   * @param dataProvider 提供者实例
   */
  static register(provider: string, dataProvider: BoundaryDataProvider): void {
    this.providers.set(provider.toLowerCase(), dataProvider);
  }
  
  /**
   * 获取区划数据提供者
   * @param provider 提供者名称
   * @returns 提供者实例
   */
  static getProvider(provider: string): BoundaryDataProvider {
    const dataProvider = this.providers.get(provider.toLowerCase());
    if (!dataProvider) {
      throw new Error(`未找到 ${provider} 的区划数据提供者`);
    }
    return dataProvider;
  }
} 