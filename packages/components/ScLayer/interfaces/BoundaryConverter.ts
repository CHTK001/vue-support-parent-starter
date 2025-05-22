import type { BoundaryOptions } from '../types/boundary';

/**
 * 区划转换接口
 * 用于将不同地图服务商的区划数据转换为高德地图格式
 */
export interface BoundaryConverter {
  /**
   * 转换区划数据为高德格式
   * @param data 原始区划数据
   * @param options 区划配置选项
   * @returns 转换后的高德格式区划数据
   */
  convertToGaode(data: any, options: BoundaryOptions): any;
}

/**
 * 区划转换工厂
 * 用于创建不同地图服务商的区划转换器
 */
export class BoundaryConverterFactory {
  private static converters: Map<string, BoundaryConverter> = new Map();

  /**
   * 注册转换器
   * @param provider 地图服务商
   * @param converter 转换器实例
   */
  static register(provider: string, converter: BoundaryConverter) {
    this.converters.set(provider, converter);
  }

  /**
   * 获取转换器
   * @param provider 地图服务商
   * @returns 转换器实例
   */
  static getConverter(provider: string): BoundaryConverter {
    const converter = this.converters.get(provider);
    if (!converter) {
      throw new Error(`未找到 ${provider} 的区划转换器`);
    }
    return converter;
  }
} 