import type { Map as LeafletMap } from 'leaflet';

/**
 * 迁徙图数据点接口
 */
export interface MigrationPoint {
  from: [number, number]; // 起点坐标 [经度, 纬度]
  to: [number, number];   // 终点坐标 [经度, 纬度]
  labels?: {
    from?: string;        // 起点标签
    to?: string;          // 终点标签
  };
  color?: string;         // 线条颜色
  weight?: number;        // 权重，影响线条粗细
  time?: number;          // 从起点到终点的时间(毫秒)
}

/**
 * 迁徙图基础选项接口
 */
export interface MigrationBaseOptions {
  autoStart?: boolean;      // 是否自动开始动画
  loop?: boolean;           // 是否循环播放
  hideAfterCompletion?: boolean; // 动画结束后是否隐藏线条
}

/**
 * 迁徙图事件类型
 */
export type MigrationEventType = 'migration-completed' | 'migration-started' | 'migration-data-updated';

/**
 * 迁徙图事件监听器类型
 */
export type MigrationEventListener = (event?: any) => void;

/**
 * 迁徙图插件基础接口
 * 作为Migration和EchartsMigration的共同抽象接口
 */
export interface MigrationBase {
  /**
   * 启用迁徙图
   */
  enable(): boolean;

  /**
   * 禁用迁徙图
   */
  disable(): boolean;

  /**
   * 切换迁徙图启用状态
   */
  toggle(): boolean;

  /**
   * 判断迁徙图是否启用
   */
  isEnabled(): boolean;

  /**
   * 设置迁徙图数据
   * @param data 迁徙图数据点数组
   * @param startAnimation 是否自动开始动画
   */
  setData(data: MigrationPoint[], startAnimation?: boolean): boolean;

  /**
   * 开始迁徙动画
   */
  start(): boolean;

  /**
   * 停止迁徙动画
   */
  stop(): boolean;

  /**
   * 获取迁徙图数据
   */
  getData(): MigrationPoint[];

  /**
   * 清除迁徙图数据
   */
  clearData(): boolean;

  /**
   * 更新迁徙图选项
   * @param options 迁徙图配置选项
   */
  updateOptions(options: any): boolean;

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 事件监听器
   */
  on(event: MigrationEventType, listener: MigrationEventListener): void;

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 事件监听器
   */
  off(event: MigrationEventType, listener: MigrationEventListener): void;

  /**
   * 销毁迁徙图实例
   */
  destroy(): void;

  /**
   * 判断是否正在播放动画
   */
  getAnimatingState(): boolean;

  /**
   * 获取当前配置选项
   */
  getOptions(): any;
} 