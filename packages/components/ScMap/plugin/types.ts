/**
 * 迁徙图选项接口
 */
export interface MigrationOptions {
  // 基本配置
  enable3D?: boolean;           // 是否启用3D效果
  autoStart?: boolean;          // 是否自动开始动画
  animation?: boolean;          // 是否启用动画
  animationDelay?: number;      // 动画延迟
  animationDuration?: number;   // 动画持续时间
  animationEasing?: string;     // 动画缓动函数
  
  // 线样式
  lineType?: string;            // 线条类型
  lineWidth?: number;           // 线宽
  lineOpacity?: number;         // 不透明度
  curvature?: number;           // 曲线度
  
  // 路径效果
  pathEffect?: string;          // 路径效果
  symbolSize?: number;          // 符号大小
  
  // 涟漪效果
  rippleEffect?: {
    period?: number;            // 动画周期
    scale?: number;             // 缩放比例
    brushType?: string;         // 画笔类型
  };
  
  // 交互效果
  hoverAnimation?: boolean;     // 鼠标悬停动画
  
  // 标签配置
  label?: {
    show?: boolean;             // 是否显示标签
    position?: string;          // 标签位置
    formatter?: string;         // 标签格式
  };
} 