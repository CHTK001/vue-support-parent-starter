/**
 * 主题应用工具：将设计令牌写入 CSS 变量，并切换 html 的 data-theme 属性。
 *
 * 各框架适配器在切换框架时调用 applyTheme()，保证视觉统一。
 */
import type { ThemeTokens, ThemeMode } from "./tokens";

/** CSS 变量前缀 */
export const CSS_VAR_PREFIX = "--theme-";

/** 主题模式属性名（挂在 <html> 上） */
export const THEME_MODE_ATTR = "data-theme";

const kebabCase = (key: string): string =>
  key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * 将令牌应用到根元素上。
 * @param tokens 设计令牌
 * @param root   目标根元素，默认 document.documentElement
 */
export function applyTheme(tokens: ThemeTokens, root: HTMLElement = document.documentElement): void {
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`${CSS_VAR_PREFIX}${kebabCase(key)}`, value);
  });
  root.setAttribute(THEME_MODE_ATTR, tokens.mode);
}

/**
 * 读取当前主题模式。
 */
export function getThemeMode(root: HTMLElement = document.documentElement): ThemeMode {
  return root.getAttribute(THEME_MODE_ATTR) === "dark" ? "dark" : "light";
}
