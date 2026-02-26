/**
 * 像素主题检测相关方法
 * 提供统一的像素主题开关能力，给 Sc 系列组件复用
 */

import { computed } from "vue";

/**
 * 判断当前是否启用像素主题
 * 通过 document.documentElement.dataset.skin 标记判断
 */
export const isPixelThemeEnabled = (): boolean => {
  if (typeof document === "undefined") {
    return false;
  }
  return document.documentElement.dataset.skin === "8bit";
};

/**
 * 使用像素主题状态
 * 组件内推荐通过该方法获取响应式的像素主题标记
 */
export function usePixelTheme() {
  const isPixelTheme = computed(() => isPixelThemeEnabled());

  return {
    isPixelTheme
  };
}

export default usePixelTheme;
