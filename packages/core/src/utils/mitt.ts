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
  /** logo 配置变化事件 */
  logoConfigChange: {
    logoSize: number;
    logoAnimation: string;
  };
  /** 隐藏头部变化事件 */
  hideHeaderChange: boolean;
  /** 消息弹窗配置变化事件 */
  messagePopupConfigChange: boolean;
  /** 消息弹窗推送事件 */
  messageToastPush: any;
  /** 消息弹窗点击事件 */
  messageToastClick: any;
  /** 切换布局路由事件 */
  changLayoutRoute: string;
  /** 设置面板关闭事件 */
  settingPanelClosed: undefined;
  /** 隐藏底部变化事件 */
  hideFooterChange: boolean;
  /** 面包屑变化事件 */
  breadcrumbChange: boolean;
  /** 面包屑模式变化事件 */
  breadcrumbModeChange: string;
  /** 面包屑动画开关 */
  breadcrumbAnimationChange: boolean;
  /** 保持活跃变化事件 */
  keepAliveChange: boolean;
  /** 菜单动画变化事件 */
  menuAnimationChange: boolean;
  /** 系统主题变化事件 */
  systemThemeChange: string;
  /** 语音朗读开关变化事件 */
  voiceReadEnabledChange: boolean;
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
  /** 顶部第二时间显示开关变化事件 */
  headerClockSecondEnabledChange: boolean;
  /** 顶部第二时间时区变化事件 */
  headerClockSecondTimezoneChange: string;
  /** 顶部搜索按钮开关变化事件 */
  showSearchChange: boolean;
  /** 顶部全屏按钮开关变化事件 */
  showFullscreenChange: boolean;
  /** 顶部任务中心开关变化事件 */
  showTaskCenterChange: boolean;
  /** 消息中心下拉位置变化事件 */
  messageDropdownPositionChange: string;
  /** 打开消息中心抽屉 */
  messageCenterOpen: undefined;
  /** 任务中心新增或更新任务 */
  taskCenterPush: any;
  /** 任务中心追加消息 */
  taskCenterMessage: any;
  /** 打开任务中心 */
  taskCenterOpen: undefined;
  /** 关闭任务中心 */
  taskCenterClose: undefined;
  /** 删除任务中心任务 */
  taskCenterRemove: string;
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
  /** 强制启用新菜单变化事件 */
  forceNewMenuChange: boolean;
  /** drawer 布局汉堡按钮切换事件（true=打开，false=关闭） */
  drawerHamburgerToggle: boolean;
  /** drawer 菜单关闭事件（点击外部或菜单项后触发） */
  drawerMenuClosed: undefined;
  /** drawer 汉堡按钮位置变更事件 */
  drawerHamburgerPositionChange: string;
  /** 设置重置为默认值事件 */
  settingResetToDefault: undefined;
  /** 设置导出配置事件 */
  settingExportConfig: undefined;
  /** 设置导入配置事件 */
  settingImportConfig: undefined;
};

export const emitter: Emitter<Events> = mitt<Events>();
