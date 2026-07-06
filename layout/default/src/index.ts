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
export * from "./themes/index";

// Utils
export { themeManager } from "./utils/theme-manager";
export {
  appendTaskCenterMessage,
  clearTaskCenter,
  clearTaskCenterHistory,
  clearTaskCenterTriggerHandlers,
  closeTaskCenterPanel,
  configureTaskCenter,
  dismissTaskCenterTask,
  failTaskCenterTask,
  finishTaskCenterTask,
  openTaskCenterPanel,
  registerTaskCenterTriggerHandler,
  removeTaskCenterTask,
  selectTaskCenterTask,
  toggleTaskCenterPanel,
  unregisterTaskCenterTriggerHandler,
  updateTaskCenterTask,
  upsertTaskCenterTask,
  useTaskCenterState,
} from "./components/lay-task-center/service";
export {
  appendTaskCenterPersistRecord,
  clearTaskCenterPersistRecords,
  persistTaskCenterTrigger,
  useTaskCenterPersistState,
} from "./components/lay-task-center/persistence";
export {
  clearOverlayStack,
  configureOverlayStack,
  getOverlayStackItem,
  removeOverlayStackItem,
  removeOverlayStackItemsBySource,
  resetOverlayStack,
  upsertOverlayStackItem,
  useOverlayStackState,
} from "./components/lay-overlay-stack/service";
export {
  provideTaskCenter,
  taskCenterProvider,
  TaskCenterProviderKey,
  tryUseTaskCenter,
  useTaskCenter,
} from "./components/lay-task-center/provider";
export {
  overlayStackProvider,
  OverlayStackProviderKey,
  provideOverlayStack,
  tryUseOverlayStack,
  useOverlayStack,
} from "./components/lay-overlay-stack/provider";
export {
  AiSupportProviderKey,
  provideAiSupport,
  useAiSupport,
} from "./components/lay-ai/provider";
export {
  provideMessageCenter,
  messageCenterProvider,
  MessageCenterProviderKey,
  tryUseMessageCenter,
  useMessageCenter,
} from "./components/lay-message/provider";
export { resolveRuntimeProviders } from "./runtime/resolveRuntimeProviders";

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
  AiSupportProvider,
  AiSupportResult,
  AiSupportSource,
} from "./components/lay-ai/provider";
export type {
  MessageCenterInput,
  MessageCenterLevel,
  MessageCenterProvider,
} from "./components/lay-message/provider";
export type {
  OverlayStackClosePayload,
  OverlayStackCloseReason,
  OverlayStackConfig,
  OverlayStackItem,
  OverlayStackMessage,
  OverlayStackMessageLevel,
  OverlayStackPosition,
  OverlayStackState,
  OverlayStackTone,
  ResolvedOverlayStackItem,
} from "./components/lay-overlay-stack/types";
export type {
  TaskCenterProvider,
  TaskCenterReference,
  TaskCenterTaskHandle,
} from "./components/lay-task-center/provider";
export type {
  TaskCenterMessage,
  TaskCenterMessageInput,
  TaskCenterMode,
  TaskCenterPersistContext,
  TaskCenterPosition,
  TaskCenterSource,
  TaskCenterState,
  TaskCenterStatus,
  TaskCenterTriggerHandler,
  TaskCenterTriggerPayload,
  TaskCenterTriggerType,
  TaskCenterTask,
  TaskCenterTaskInput,
} from "./components/lay-task-center/types";

// Components
export { default as LayOverlayStack } from "./components/lay-overlay-stack/index.vue";
export { default as LayTool } from "./components/lay-tool/index.vue";
export { default as LayNavbar } from "./components/lay-navbar/index.vue";
export { Account, LaySidebarTopCollapse };
export default LayoutDefault;
