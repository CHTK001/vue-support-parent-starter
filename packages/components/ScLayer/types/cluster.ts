// 聚合功能配置接口
export interface AggregationOptions {
  // 聚合距离半径
  maxClusterRadius?: number;
  // 聚合半径单位: 'pixel' | 'kilometer'
  radiusUnit?: 'pixel' | 'kilometer';
  // 聚合点基本颜色
  color?: string;
  // 聚合点边框颜色
  borderColor?: string;
  // 是否根据数量作为权重
  useWeightAsSize?: boolean;
  // 是否在聚合点中显示数量
  showCount?: boolean;
  // 是否启用扩散效果
  enablePulse?: boolean;
  // 扩散动画持续时间(ms)
  pulseDuration?: number;
  // 扩散动画透明度
  pulseOpacity?: number;
  // 每秒扩散次数
  pulseFrequency?: number;
  // 扩散动画缩放比例
  pulseScale?: number;
  // 扩散起始大小比例(相对于点大小)
  pulseStartSize?: number;
  // 扩散颜色
  pulseColor?: string;
  // 扩散效果层数（1-3）
  pulseLayers?: number;
  // 透明度衰减指数
  pulseDecay?: number;
  // 聚合点样式
  clusterIconStyle?: any;
  // 是否缩放到聚合范围当点击聚合点时
  zoomToBoundsOnClick?: boolean;
  // 颜色范围配置，基于聚合点数量设置不同颜色
  colorRanges?: Array<{
    // 数量阈值，当聚合点数量超过此值时使用这个颜色
    value: number;
    // 对应的颜色
    color: string;
  }>;
}
