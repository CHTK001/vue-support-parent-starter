/**
 * 聚合类型定义
 * @description 定义标记点聚合相关的类型和接口
 */

// 聚合配置选项
export interface AggregationOptions {
  enabled?: boolean;               // 是否启用聚合
  maxClusterRadius?: number;       // 最大聚合半径
  radiusUnit?: 'pixel' | 'meter';  // 半径单位
  color?: string;                  // 聚合点颜色
  borderColor?: string;            // 边框颜色
  borderWidth?: number;            // 边框宽度
  opacity?: number;                // 不透明度
  showCount?: boolean;             // 是否显示数量
  useWeightAsSize?: boolean;       // 是否将数量映射为大小
  minSize?: number;                // 最小大小
  maxSize?: number;                // 最大大小
  textColor?: string;              // 文本颜色
  textSize?: number;               // 文本大小
  textFont?: string;               // 文本字体
  spiderfyOnMaxZoom?: boolean;     // 在最大缩放级别时展开
  zoomToBoundsOnClick?: boolean;   // 点击时缩放到边界
  disableClusteringAtZoom?: number; // 禁用聚合的缩放级别
  enableAnimation?: boolean;       // 是否启用动画
  enablePulse?: boolean;           // 是否启用脉冲效果
  pulseOptions?: {                 // 脉冲效果选项
    color?: string;                // 脉冲颜色
    size?: number;                 // 脉冲大小
    duration?: number;             // 脉冲持续时间
    opacity?: number;              // 脉冲不透明度
  };
  colorRanges?: {                  // 颜色范围（基于聚合点数量）
    value: number;                 // 聚合点数量阈值
    color: string;                 // 颜色
  }[];
  iconCreateFunction?: Function;   // 自定义创建图标的函数
}
