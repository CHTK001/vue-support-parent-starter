/**
 * 聚合类型定义
 * @description 定义标记点聚合相关的类型和接口
 */

/**
 * 聚合配置接口定义
 */

// 颜色范围配置
export interface ColorRange {
  value: number; // 阈值
  color: string; // 颜色
}

// 半径单位
export type RadiusUnit = 'pixel' | 'meter' | 'kilometer';
// 聚合配置选项
export interface AggregationOptions {
  // 聚合最大半径
  maxClusterRadius: number;
  // 半径单位，默认为pixel
  radiusUnit: RadiusUnit;
  // 聚合点颜色
  color?: string;
  // 聚合点边框颜色
  borderColor?: string;
  // 是否显示聚合点数量
  showCount?: boolean;
  // 点击聚合点是否缩放到边界
  zoomToBoundsOnClick?: boolean;
  // 是否使用权重作为大小
  useWeightAsSize?: boolean;
  // 是否启用脉冲效果
  enablePulse?: boolean;
  // 脉冲持续时间
  pulseDuration?: number;
  // 脉冲透明度
  pulseOpacity?: number;
  // 脉冲频率
  pulseFrequency?: number;
  // 颜色范围数组
  colorRanges?: ColorRange[];
}
