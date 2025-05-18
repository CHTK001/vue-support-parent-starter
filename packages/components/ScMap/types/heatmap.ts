/**
 * 热力图类型定义
 */

/**
 * 热力图数据点接口
 */
export interface HeatmapPoint {
  // 纬度
  lat: number;
  // 经度
  lng: number;
  // 权重 (0-1)
  weight?: number;
  // 自定义数据
  data?: any;
}

/**
 * 热力图配置接口
 */
export interface HeatmapConfig {
  // 模糊程度
  blur: number;
  // 半径大小
  radius: number;
  // 透明度
  opacity: number;
  // 最大权重
  max: number;
  // 最小权重
  minWeight: number;
  // 最大权重
  maxWeight: number;
  // 最大缩放级别
  maxZoom: number;
  // 最小透明度
  minOpacity: number;
  // 颜色渐变
  gradient: { [key: string]: string };
  // 堆叠顺序
  zIndex: number;
  // 是否显示数据点
  showPoints: boolean;
  // 数据点半径
  pointRadius: number;
  // 数据点颜色
  pointColor: string;
  // 数据点描边颜色
  pointStrokeColor: string;
  // 数据点描边宽度
  pointStrokeWidth: number;
  // 移动时是否隐藏热力图
  hideOnMoving: boolean;
  // 缩放时是否隐藏热力图
  hideOnZooming: boolean;
}

/**
 * 默认热力图配置
 */
export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  blur: 15,
  radius: 25,
  opacity: 0.7,
  max: 1.0,
  minWeight: 0,
  maxWeight: 1.0,
  maxZoom: 18,
  minOpacity: 0.05,
  gradient: {
    0.4: 'blue',
    0.6: 'cyan',
    0.7: 'lime',
    0.8: 'yellow',
    1.0: 'red'
  },
  zIndex: 10,
  showPoints: false,
  pointRadius: 4,
  pointColor: '#ff0000',
  pointStrokeColor: '#ffffff',
  pointStrokeWidth: 1,
  hideOnMoving: false,
  hideOnZooming: false
}; 