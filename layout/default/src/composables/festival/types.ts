/**
 * 节日主题类型定义
 * @description 装饰、动画、粒子等配置接口
 */

/** 装饰元素类型 */
export type DecorationType = 
  | 'lantern'      // 灯笼
  | 'snowflake'    // 雪花
  | 'firework'     // 烟花
  | 'pumpkin'      // 南瓜
  | 'bell'         // 铃铛
  | 'hat'          // 帽子
  | 'confetti'     // 彩纸
  | 'sparkle';     // 闪光

/** 动画类型 */
export type AnimationType =
  | 'swing'        // 摇摆
  | 'float'        // 漂浮
  | 'rotate'       // 旋转
  | 'pulse'        // 脉冲
  | 'fadeIn'       // 淡入
  | 'fadeOut'      // 淡出
  | 'slideInLeft'  // 左滑入
  | 'slideInRight' // 右滑入
  | 'bounce';      // 弹跳

/** 粒子类型 */
export type ParticleType =
  | 'snow'         // 雪花
  | 'firework'     // 烟花
  | 'confetti'     // 彩纸
  | 'sparkle'      // 闪光
  | 'leaf';        // 树叶

/** 尺寸类型 */
export type SizeType = 'small' | 'medium' | 'large';

/** 缓动函数类型 */
export type EasingType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

/** 动画方向类型 */
export type AnimationDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

/** 动画填充模式 */
export type AnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';

/** 位置配置 */
export interface PositionConfig {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
}

/** 装饰配置 */
export interface DecorationConfig {
  /** 装饰类型 */
  type: DecorationType;
  /** 位置配置 */
  position?: PositionConfig;
  /** 尺寸 */
  size?: SizeType;
  /** 动画配置 */
  animation?: {
    type: AnimationType;
    duration?: number;
    delay?: number;
  };
  /** 是否启用 */
  enabled?: boolean;
  /** 自定义样式 */
  style?: Record<string, string>;
  /** 自定义类名 */
  className?: string;
}

/** 动画配置 */
export interface AnimationConfig {
  /** 动画名称 */
  name: AnimationType;
  /** 目标元素选择器或 ref */
  target: string | HTMLElement;
  /** 动画持续时间（毫秒） */
  duration?: number;
  /** 延迟时间（毫秒） */
  delay?: number;
  /** 缓动函数 */
  easing?: EasingType;
  /** 迭代次数 */
  iterations?: number | 'infinite';
  /** 动画方向 */
  direction?: AnimationDirection;
  /** 填充模式 */
  fillMode?: AnimationFillMode;
  /** 是否自动播放 */
  autoPlay?: boolean;
}

/** 粒子配置 */
export interface ParticleConfig {
  /** 粒子类型 */
  type: ParticleType;
  /** 粒子数量 */
  count?: number;
  /** 粒子颜色 */
  colors?: string[];
  /** 粒子大小范围 */
  sizeRange?: [number, number];
  /** 速度范围 */
  speedRange?: [number, number];
  /** 生命周期（毫秒） */
  lifetime?: number;
  /** 容器元素 */
  container?: HTMLElement | string;
  /** 是否启用 */
  enabled?: boolean;
}

/** 音频配置 */
export interface AudioConfig {
  /** 音频源 URL */
  src: string;
  /** 音量 (0-1) */
  volume?: number;
  /** 是否循环 */
  loop?: boolean;
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 淡入时间（毫秒） */
  fadeIn?: number;
  /** 淡出时间（毫秒） */
  fadeOut?: number;
}

/** 装饰实例 */
export interface DecorationInstance {
  id: string;
  config: DecorationConfig;
  element: HTMLElement | null;
}

/** 动画实例 */
export interface AnimationInstance {
  id: string;
  config: AnimationConfig;
  element: HTMLElement | null;
  animation: Animation | null;
  isPlaying: boolean;
}

/** 粒子对象 */
export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  lifetime: number;
  age: number;
  rotation: number;
  rotationSpeed: number;
}

/** 粒子系统实例 */
export interface ParticleSystemInstance {
  id: string;
  config: ParticleConfig;
  particles: Particle[];
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  animationId: number | null;
  isRunning: boolean;
}

/** 音频实例 */
export interface AudioInstance {
  id: string;
  config: AudioConfig;
  audio: HTMLAudioElement;
  isPlaying: boolean;
  isMuted: boolean;
}

/** 节日主题配置 */
export interface FestivalThemeConfig {
  /** 主题名称 */
  name: string;
  /** 装饰列表 */
  decorations?: DecorationConfig[];
  /** 动画列表 */
  animations?: AnimationConfig[];
  /** 粒子系统配置 */
  particles?: ParticleConfig;
  /** 音频配置 */
  audio?: AudioConfig;
  /** 是否启用 */
  enabled?: boolean;
}
