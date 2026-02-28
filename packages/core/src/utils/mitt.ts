import type { Emitter } from "mitt";
import mitt from "mitt";

/** 全局公共事件需要在此处添加类型 */
type Events = {
  /** 打开面板事件 */
  openPanel: string;
  /** 标签视图变化事件 */
  tagViewsChange: string;
  /** 标签视图显示模式事件 */
  tagViewsShowModel: string;
  /**  logo变化事件 */
  logoChange: boolean;
  /** 隐藏头部变化事件 */
  hideHeaderChange: boolean;
  /** 消息弹窗配置变化事件 */
  messagePopupConfigChange: boolean;
  /** 切换布局路由事件 */
  changLayoutRoute: string;
  /** 设置面板关闭事件 */
  settingPanelClosed: void;
  /** 隐藏底部变化事件 */
  hideFooterChange: boolean;
  /** 面包屑变化事件 */
  breadcrumbChange: boolean;
  /** 面包屑模式变化事件 */
  breadcrumbModeChange: string;
  /** 保持活跃变化事件 */
  keepAliveChange: boolean;
  /** 菜单动画变化事件 */
  menuAnimationChange: boolean;
  /** 系统主题变化事件 */
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
  /** AI 助手皮肤 */
  aiChatSkinChange: string;
  /** 顶部时间显示开关变化事件 */
  showHeaderClockChange: boolean;
  /** 顶部搜索按钮开关变化事件 */
  showSearchChange: boolean;
  /** 顶部全屏按钮开关变化事件 */
  showFullscreenChange: boolean;
  /** 消息中心下拉位置变化事件 */
  messageDropdownPositionChange: string;
  /** 开发环境测试消息推送事件 */
  devMessagePush: any;
  /** 新菜单动画配置变化事件 */
  newMenuAnimationChange: string;
  /** 新菜单显示开关变化事件 */
  showNewMenuChange: boolean;
  /** 调试模式 */
  debugModeChange: boolean;
  /** 调试模式变化事件 */
  debugModeChanged: boolean;
  /** 字体加密变化事件 */
  fontEncryptionChange: any;
  /** 离开确认变化事件 */
  confirmOnLeaveChange: boolean;
  /** 主题动画模式变化事件 */
  themeAnimationModeChange: string;
};

export const emitter: Emitter<Events> = mitt<Events>();
