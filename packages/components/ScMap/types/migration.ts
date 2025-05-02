import type { MigrationOptions } from '../plugin/Migration';
import type { MigrationPoint } from '../plugin/MigrationBase';

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
  dataPoints?: MigrationPoint[];
  
  /**
   * 是否自动开始动画
   */
  autoStart?: boolean;
} 