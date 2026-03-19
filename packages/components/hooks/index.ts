/**
 * 组件 Hooks 导出
 */

export { useInteractDrag } from "./useInteractDrag";
export type { DragOptions, ResizeOptions, DragState } from "./useInteractDrag";
export { usePixelTheme, isPixelThemeEnabled } from "./usePixelTheme";
export { usePixelUI } from "./usePixelUI";
export { useThemeComponent, preloadTheme, preloadAllThemes, switchTheme, initThemeSystem } from "./useThemeComponent";
export {
  getThemeConfig,
  getThemeComponentName,
  getThemeLocalComponentConfig,
  getEnabledThemes,
  getThemesByGroup,
  hasTheme,
  THEME_CONFIGS,
  ACTIVE_THEME_KEYS,
  autoRegisterThemePlugins,
} from "./themeConfig";
export type {
  ThemeConfig,
  ThemeComponentMap,
  ThemeLocalComponentConfig,
  ThemeLocalComponentMap,
  SupportedThemeKey,
} from "./themeConfig";
