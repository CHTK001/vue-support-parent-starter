/**
 * 主题字体动态加载工具
 * 根据主题动态加载对应的 PixelUI 样式文件
 */
import {
  retainPixelUiThemeCss,
  releasePixelUiThemeCss,
} from "@repo/components/hooks/pixelUiShared";

/**
 * 加载 Pixel UI 字体 CSS
 */
export function loadPixelUIFont(): void {
  retainPixelUiThemeCss({ global: true });
}

/**
 * 移除 Pixel UI 字体 CSS
 */
export function removePixelUIFont(): void {
  releasePixelUiThemeCss({ global: true });
}

/**
 * 根据主题加载对应的字体 CSS
 * @param themeKey 主题 key
 */
export function loadThemeFont(themeKey: string): void {
  if (themeKey === "8bit") {
    loadPixelUIFont();
  } else {
    removePixelUIFont();
  }
}
