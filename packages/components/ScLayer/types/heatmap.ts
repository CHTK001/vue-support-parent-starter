/**
 * 热力图类型定义
 */

// 热力图数据点接口
export interface HeatmapPoint {
  id?: string;
  longitude: number;
  latitude: number;
  weight?: number; // 权重 0-1
  name?: string;
  properties?: Record<string, any>;
}

// 热力图配置接口
export interface HeatmapConfig {
  radius: number;           // 热力点半径(像素)
  blur: number;             // 模糊大小(像素)
  opacity: number;          // 不透明度 0-1
  gradient: string[];       // 颜色渐变数组
  minWeight: number;        // 最小权重阈值 0-1
  maxWeight: number;        // 最大权重阈值 0-1
  showPoints: boolean;      // 是否显示数据点
  pointColor: string;       // 点颜色
  pointRadius: number;      // 点半径(像素)
  pointStrokeColor: string; // 点边框颜色
  pointStrokeWidth: number; // 点边框宽度
  zIndex: number;           // 层级
  hideOnMoving: boolean;    // 移动时隐藏热力图提高性能
  hideOnZooming: boolean;   // 缩放时隐藏热力图提高性能
}

// 默认热力图配置
export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  radius: 15,
  blur: 15,
  opacity: 0.8,
  gradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
  minWeight: 0,
  maxWeight: 1,
  showPoints: false,
  pointColor: 'rgba(0, 0, 255, 0.7)',
  pointRadius: 4,
  pointStrokeColor: '#fff',
  pointStrokeWidth: 1,
  zIndex: 90,
  hideOnMoving: false,
  hideOnZooming: false
}; 