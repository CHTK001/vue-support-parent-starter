import { default as Account } from "./components/lay-account/index.vue";
import { default as LaySidebarTopCollapse } from "./components/lay-sidebar/components/SidebarTopCollapse.vue";
import { default as LayoutDefault } from "./index.vue";

// Hooks
export { useDataThemeChange } from "./hooks/useDataThemeChange";
export { useLayout } from "./hooks/useLayout";
export { useNav } from "./hooks/useNav";
export { useTranslationLang } from "./hooks/useTranslationLang";
export { useThemeComponent, useTheme } from "./hooks/useThemeComponent";
export { useLoadingPage } from "./hooks/useLoadingPage";
export { useResponsiveLayout } from "./hooks/useResponsiveLayout";
export { useWatermarkSetup } from "./hooks/useWatermarkSetup";
export { useDebugMode } from "./hooks/useDebugMode";

// Stores
export { useThemeStore, useThemeStoreHook } from "./stores/themeStore";

// Types
export type {
  ThemeKey,
  ThemeType,
  ThemeConfig,
  ThemeComponentMap,
  StorageConfig,
  StorageLayout,
  GlobalStorage,
  LayoutEmitterEvents,
} from "./types/theme";

// Components
export { Account, LaySidebarTopCollapse };
export default LayoutDefault;
