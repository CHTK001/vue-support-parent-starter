/**
 * 浏览器工具（迁移自 koi/utils/index.ts）
 */

/** 获取 CSS 变量值[别名函数] */
export function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}
