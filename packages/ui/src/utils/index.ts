/**
 * 通用工具函数
 */

/**
 * 防抖：在最后一次触发的 wait 毫秒后调用 fn；如果在 wait 内再次触发，重新计时。
 * 支持 cancel 取消防抖。
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number = 300,
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  }) as T & { cancel: () => void };
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return debounced;
}

/**
 * 节流：在 wait 毫秒内最多调用一次 fn（leading + trailing）。
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number = 300,
): T & { cancel: () => void } {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const throttled = ((...args: unknown[]) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  }) as T & { cancel: () => void };
  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    last = 0;
  };
  return throttled;
}