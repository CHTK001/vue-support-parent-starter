/**
 * 风场图相关类型定义
 * 参考 ol-wind 库的配置项
 */

// 风场图点数据接口
export interface WindData {
  header: {
    parameterUnit: string;
    parameterNumber: number;
    parameterNumberName: string;
    parameterCategory: number;
    discipline: number;
    refTime: string;
    lo1: number;
    lo2: number;
    la1: number;
    la2: number;
    nx: number;
    ny: number;
    dx: number;
    dy: number;
  };
  data: number[];
}

// 风场图配置接口
export interface WindConfig {
  visible?: boolean;          // 是否可见
  opacity?: number;           // 透明度，0-1
  
  // 风场图样式配置
  velocityScale?: number;     // 速度缩放比例，默认0.05
  paths?: number;             // 粒子数量，默认3200
  colorScale?: string[];      // 颜色比例尺数组
  lineWidth?: number;         // 线宽度，默认1
  
  // 粒子配置
  generateParticleOption?: boolean; // 是否生成粒子选项
  particleMultiplier?: number;      // 粒子乘数
  particleAge?: number;             // 粒子寿命
  particleFadeoutTime?: number;     // 粒子淡出时间
  
  // 字段配置
  fieldOptions?: {
    wrapX?: boolean;          // 是否水平环绕
    globalAlpha?: number;     // 全局透明度
    maxAge?: number;          // 最大年龄
    velocityScale?: number;   // 速度缩放
    width?: number;           // 宽度
    height?: number;          // 高度
  };
  
  // 性能相关
  hideOnMoving?: boolean;      // 移动地图时隐藏风场图提高性能
  hideOnZooming?: boolean;     // 缩放时隐藏风场图提高性能
  enablePerformanceMode?: boolean; // 启用性能模式
  throttle?: number;          // 节流时间（毫秒）
  
  // 动画配置
  animation?: boolean;        // 是否启用动画
  animationOptions?: {
    duration?: number;        // 动画持续时间（毫秒）
    easingFunction?: string;  // 动画缓动函数
  };
  zIndex?: number;            // 层级
}

// 默认风场图配置
export const DEFAULT_WIND_CONFIG: WindConfig = {
  visible: true,
  opacity: 0.8,
  
  // 风场图样式
  velocityScale: 0.05,
  paths: 3200,
  colorScale: [
    "rgb(36,104,180)",
    "rgb(60,157,194)",
    "rgb(128,205,193)",
    "rgb(151,218,168)",
    "rgb(198,231,181)",
    "rgb(238,247,217)",
    "rgb(255,238,159)",
    "rgb(252,217,125)",
    "rgb(255,182,100)",
    "rgb(252,150,75)",
    "rgb(250,112,52)",
    "rgb(245,64,32)",
    "rgb(237,45,28)",
    "rgb(220,24,32)",
    "rgb(180,0,35)"
  ],
  lineWidth: 2,
  
  // 粒子配置
  generateParticleOption: false,
  
  // 字段配置
  fieldOptions: {
    wrapX: false
  },
  
  // 性能相关
  hideOnMoving: false,
  hideOnZooming: false,
  enablePerformanceMode: false,
  throttle: 100,
  
  // 动画配置
  animation: true,
  animationOptions: {
    duration: 500,
    easingFunction: 'linear'
  },
  zIndex: 95
}; 