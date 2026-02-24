import type { Emitter } from "mitt";
import mitt from "mitt";

/** 全局公共事件需要在此处添加类型 */
type Events = {
  openPanel: string;
  tagViewsChange: string;
  tagViewsShowModel: string;
  logoChange: boolean;
  hideHeaderChange: boolean;
  messagePopupConfigChange: boolean;
  changLayoutRoute: string;
  settingPanelClosed: void;
  hideFooterChange: boolean;
  breadcrumbChange: boolean;
  breadcrumbModeChange: string;
  keepAliveChange: boolean;
  systemThemeChange: string;
  /** 消息开关变化事件 */
  showMessageChange: boolean;
  /** 菜单过渡动画 */
  menuTransitionChange: boolean;
  /** 过渡动画类型 */
  transitionTypeChange: string;
  /** 显示标签图标 */
  showTagIconChange: boolean;
  /** AI 助手主题 */
  aiChatThemeChange: string;
  /** 调试模式 */
  debugModeChange: boolean;
  debugModeChanged: boolean;
  /** 字体加密 */
  fontEncryptionChange: any;
  /** 离开确认 */
  confirmOnLeaveChange: boolean;
  /** 主题动画模式 */
};

export const emitter: Emitter<Events> = mitt<Events>();
