/**
 * 工具方法
 *
 * 来源：原 pureadmin ReSeamlessScroll 的 utils.ts。
 * 已移除对老旧环境的 `Array.isArray` polyfill（现代环境原生支持），
 * 其余逻辑保持一致。
 */

/**
 * 兼容老旧浏览器的 requestAnimationFrame / cancelAnimationFrame。
 */
export const animationFrame = (): void => {
  window.cancelAnimationFrame =
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.msCancelAnimationFrame ||
    ((id: number) => window.clearTimeout(id));

  window.requestAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    ((callback: FrameRequestCallback) => window.setTimeout(callback, 1000 / 60));
};

/**
 * 判断数组是否浅相等（按 === 比较元素）。
 */
export const arrayEqual = <T>(arr1: T[], arr2: T[]): boolean => {
  if (arr1 === arr2) return true;
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};

/**
 * 浅合并/深合并拷贝对象。
 *
 * 用法：
 *   copyObj(target, src1, src2, ...)            // 浅拷贝
 *   copyObj(true, target, src1, src2, ...)      // 深拷贝
 *
 * 与原版差异：移除 `Array.isArray` polyfill 兼容代码。
 */
export function copyObj(...args: unknown[]): unknown {
  let name: string;
  let options: Record<string, unknown> | null;
  let src: unknown;
  let copy: unknown;
  let copyIsArray: boolean;
  let clone: unknown;
  let i = 1;
  let target: unknown = args[0] ?? {};
  let deep = false;
  const len = args.length;

  if (typeof target === "boolean") {
    deep = target;
    target = args[1] ?? {};
    i = 2;
  }
  if (typeof target !== "object" || target === null) {
    target = {};
  }
  if (i === len) {
    return target;
  }

  for (; i < len; i++) {
    const optionsArg = args[i];
    if ((options = optionsArg as Record<string, unknown> | null) != null) {
      for (name in options) {
        if (!Object.prototype.hasOwnProperty.call(options, name)) continue;
        src = (target as Record<string, unknown>)[name];
        copy = options[name];
        copyIsArray = Array.isArray(copy);
        if (deep && copy && (typeof copy === "object" || copyIsArray)) {
          if (copyIsArray) {
            copyIsArray = false;
            clone = src && Array.isArray(src) ? src : [];
          } else {
            clone = src && typeof src === "object" ? src : {};
          }
          (target as Record<string, unknown>)[name] = copyObj(deep, clone, copy);
        } else if (copy !== undefined) {
          (target as Record<string, unknown>)[name] = copy;
        }
      }
    }
  }
  return target;
}