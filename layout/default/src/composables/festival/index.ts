/**
 * 节日主题组合函数库
 * @description 统一导出所有节日主题相关的组合函数和类型
 */

// 组合函数
export { useFestivalDecoration } from './useFestivalDecoration';
export { useFestivalAnimation } from './useFestivalAnimation';
export { useFestivalAudio } from './useFestivalAudio';
export { useFestivalParticles } from './useFestivalParticles';

// 类型定义
export type {
  DecorationType,
  AnimationType,
  ParticleType,
  SizeType,
  EasingType,
  AnimationDirection,
  AnimationFillMode,
  PositionConfig,
  DecorationConfig,
  AnimationConfig,
  ParticleConfig,
  AudioConfig,
  DecorationInstance,
  AnimationInstance,
  Particle,
  ParticleSystemInstance,
  AudioInstance,
  FestivalThemeConfig,
} from './types';

// 工具函数
export {
  calculatePosition,
  throttle,
  debounce,
  randomInRange,
  randomColor,
  isInViewport,
  rafThrottle,
  lerp,
  easeInOutQuad,
  easeOutCubic,
  degToRad,
  radToDeg,
  clamp,
  generateId,
  supportsWebAnimations,
  supportsCanvas,
  preloadImage,
  preloadAudio,
} from './utils';
