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

// Font Encryption
export {
  useFontEncryption,
  initFontEncryption,
  type FontEncryptionConfig,
} from "./utils/useFontEncryption";
export {
  useFontEncryptionControl,
  type FontEncryptionControlOptions,
  type FontEncryptionControlReturn,
} from "./composables/useFontEncryptionControl";
export { vFontEncryption } from "./directives/fontEncryption";

// Stores
export { useThemeStore, useThemeStoreHook } from "./stores/themeStore";

// Skin (主题皮肤样式，原 @repo/skin)
export * from "./skin/themes/index";

// Utils
export { themeManager } from "./utils/theme-manager";
export {
  appendTaskCenterMessage,
  clearTaskCenter,
  clearTaskCenterHistory,
  closeTaskCenterPanel,
  configureTaskCenter,
  dismissTaskCenterTask,
  failTaskCenterTask,
  finishTaskCenterTask,
  openTaskCenterPanel,
  removeTaskCenterTask,
  selectTaskCenterTask,
  toggleTaskCenterPanel,
  updateTaskCenterTask,
  upsertTaskCenterTask,
  useTaskCenterState,
} from "./components/lay-task-center/service";
export {
  provideTaskCenter,
  taskCenterProvider,
  TaskCenterProviderKey,
  useTaskCenter,
} from "./components/lay-task-center/provider";

// Types
export type {
  ThemeKey,
  ThemeType,
  ThemeConfig,
  ThemeComponentMap,
  StorageConfig,
  StorageLayout,
  GlobalStorage,
} from "./types/theme";
export type { LayoutEmitterEvents } from "./types/events";
export type {
  TaskCenterProvider,
  TaskCenterReference,
  TaskCenterTaskHandle,
} from "./components/lay-task-center/provider";
export type {
  TaskCenterMessage,
  TaskCenterMessageInput,
  TaskCenterMode,
  TaskCenterPosition,
  TaskCenterSource,
  TaskCenterState,
  TaskCenterStatus,
  TaskCenterTask,
  TaskCenterTaskInput,
} from "./components/lay-task-center/types";

// Components
export { Account, LaySidebarTopCollapse };
export default LayoutDefault;
