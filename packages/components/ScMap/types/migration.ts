import type { MigrationOptions } from '../plugin/Migration';

/**
 * 迁徙图配置接口
 */
export interface MigrationConfig {
  /**
   * 是否启用迁徙图功能
   */
  enabled?: boolean;
  
  /**
   * 迁徙图配置选项
   */
  options?: MigrationOptions;
  
  /**
   * 预设的迁徙图数据点
   */
  dataPoints?: Array<{
    from: [number, number]; // 起点坐标 [经度, 纬度]
    to: [number, number];   // 终点坐标 [经度, 纬度]
    labels?: {
      from?: string;        // 起点标签
      to?: string;          // 终点标签
    };
    color?: string;         // 线条颜色
    weight?: number;        // 权重，影响线条粗细
    time?: number;          // 从起点到终点的时间(毫秒)
  }>;
  
  /**
   * 是否自动开始动画
   */
  autoStart?: boolean;
} 