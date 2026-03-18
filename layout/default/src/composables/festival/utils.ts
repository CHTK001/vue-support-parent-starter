/**
 * 节日主题工具函数
 * @description 提供装饰位置计算、性能优化等辅助功能
 */

/**
 * 计算装饰元素的绝对位置
 */
export function calculatePosition(
  container: HTMLElement,
  position: { top?: string; left?: string; right?: string; bottom?: string }
): { x: number; y: number } {
  const rect = container.getBoundingClientRect();
  
  let x = 0;
  let y = 0;
  
  if (position.left) {
    x = parseFloat(position.left);
  } else if (position.right) {
    x = rect.width - parseFloat(position.right);
  }
  
  if (position.top) {
    y = parseFloat(position.top);
  } else if (position.bottom) {
    y = rect.height - parseFloat(position.bottom);
  }
  
  return { x, y };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 随机数生成（范围内）
 */
export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * 随机颜色选择
 */
export function randomColor(colors: string[]): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 检查元素是否在视口内
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 性能监控 - requestAnimationFrame 包装
 */
export function rafThrottle(callback: FrameRequestCallback): () => void {
  let rafId: number | null = null;
  let lastArgs: any[] = [];
  
  const throttled = (...args: any[]) => {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame((time) => {
        rafId = null;
        callback(time);
      });
    }
  };
  
  return throttled as () => void;
}

/**
 * 线性插值
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * 缓动函数 - easeInOutQuad
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * 缓动函数 - easeOutCubic
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * 角度转弧度
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 弧度转角度
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * 限制数值范围
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 生成唯一ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 检查是否支持 Web Animations API
 */
export function supportsWebAnimations(): boolean {
  return typeof Element.prototype.animate === 'function';
}

/**
 * 检查是否支持 Canvas
 */
export function supportsCanvas(): boolean {
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
}

/**
 * 预加载图片
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 预加载音频
 */
export function preloadAudio(src: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => resolve(audio);
    audio.onerror = reject;
    audio.src = src;
  });
}
