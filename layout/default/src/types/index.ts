/**
 * 类型定义导出
 * @description 统一导出所有类型定义
 */

// 主题相关类型
export type {
  ThemeKey,
  ThemeType,
  ThemeConfig,
  ThemeComponentMap,
  StorageConfig,
  StorageLayout,
  GlobalStorage,
} from "./theme";

// 事件类型
export type {
  LayoutEmitterEvents,
  EmitterEventName,
  EmitterEventPayload,
} from "./events";

// 菜单类型
export type {
  MenuMeta,
  MenuItem,
  SidebarItemProps,
  NavEmits,
} from "./menu";

// AI 相关类型
export type {
  ModelConfig,
  ModelStatus,
  ChatMessage,
  GenerationOptions,
} from "./ai";