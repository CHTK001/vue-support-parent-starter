/**
 * 事件类型定义
 * @description 统一管理 emitter 事件类型，增强类型安全
 */
import type { ThemeKey } from "./theme";

/**
 * Layout Emitter 事件类型映射
 */
export interface LayoutEmitterEvents {
  // ===== 主题相关 =====
  /** 系统主题变更 */
  systemThemeChange: ThemeKey;
  /** AI 助手主题变更 */
  aiChatThemeChange: string;
  /** AI 助手皮肤变更 */
  aiChatSkinChange: string;

  // ===== 标签页相关 =====
  /** 标签页显示/隐藏 */
  tagViewsChange: boolean;
  /** 标签页显示模式变更 */
  tagViewsShowModel: "smart" | "card" | "chrome" | "modern";
  /** 显示标签图标变更 */
  showTagIconChange: boolean;

  // ===== 布局相关 =====
  /** 布局路由变更 */
  changLayoutRoute: string;
  /** 打开设置面板 */
  openPanel: undefined;
  /** Logo 显示变更 */
  logoChange: boolean;
  /** 页脚显示变更 */
  hideFooterChange: boolean;
  /** 头部显示变更 */
  hideHeaderChange: boolean;

  // ===== 面包屑相关 =====
  /** 面包屑显示变更 */
  breadcrumbChange: boolean;
  /** 面包屑模式变更 */
  breadcrumbModeChange: "icon" | "icon-text";
  /** 面包屑动画开关 */
  breadcrumbAnimationChange: boolean;

  // ===== 功能开关 =====
  /** 组件缓存变更 */
  keepAliveChange: boolean;
  /** 调试模式变更 */
  debugModeChange: boolean;
  /** 调试模式已变更（通知） */
  debugModeChanged: boolean;
  /** 菜单过渡动画变更 */
  menuTransitionChange: boolean;
  /** 离开确认变更 */
  confirmOnLeaveChange: boolean;
  /** 消息弹窗配置变更 */
  messagePopupConfigChange: undefined;
  /** 打开消息中心抽屉 */
  messageCenterOpen: undefined;
  /** 强制启用新菜单变更 */
  forceNewMenuChange: boolean;
  /** 顶部任务中心按钮显示变更 */
  showTaskCenterChange: boolean;
  /** 任务中心新增或更新任务 */
  taskCenterPush: unknown;
  /** 任务中心追加消息 */
  taskCenterMessage: unknown;
  /** 打开任务中心 */
  taskCenterOpen: undefined;
  /** 关闭任务中心 */
  taskCenterClose: undefined;
  /** 删除任务中心任务 */
  taskCenterRemove: string;

  // ===== 设置面板 =====
  /** 设置面板关闭 */
  settingPanelClosed: undefined;
}

/**
 * 创建类型安全的事件发射器类型
 */
export type EmitterEventName = keyof LayoutEmitterEvents;
export type EmitterEventPayload<T extends EmitterEventName> =
  LayoutEmitterEvents[T];
