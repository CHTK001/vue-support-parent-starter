export interface StorageConfigs {
  version?: string;
  title?: string;
  fixedHeader?: boolean;
  hiddenSideBar?: boolean;
  /** 系统主题（皮肤） */
  systemTheme?: string;
  multiTagsCache?: boolean;
  keepAlive?: boolean;
  locale?: string;
  layout?: string;
  theme?: string;
  darkMode?: boolean;
  grey?: boolean;
  weak?: boolean;
  /** 反色模式 */
  invert?: boolean;
  /** 黑白模式 */
  monochrome?: boolean;
  hideTabs?: boolean;
  hideFooter?: boolean;
  hideHeader?: boolean;
  sidebarStatus?: boolean;
  epThemeColor?: string;
  themeColor?: string;
  overallStyle?: string;
  showLogo?: boolean;
  showModel?: string;
  /** 菜单过渡动画 */
  menuTransition?: boolean;
  /** 菜单过渡动画类型 */
  transitionType?: string;
  /** 内容边距 */
  contentMargin?: number;
  /** 布局圆角 */
  layoutRadius?: number;
  /** 布局模糊 */
  layoutBlur?: number;
  /** 显示面包屑 */
  showBreadcrumb?: boolean;
  /** 面包屑仅显示图标 */
  breadcrumbIconOnly?: boolean;
  /** 显示标签图标 */
  showTagIcon?: boolean;
  /** 卡片内容模式 */
  cardBody?: boolean;
  /** 卡片颜色模式 */
  cardColorMode?: string;
  /** 是否显示新菜单标识 */
  showNewMenu?: boolean;
  /** 新菜单文本 */
  newMenuText?: string;
  /** 新菜单高亮时长（单位：小时） */
  newMenuTimeLimit?: number;
  /** 新菜单动画类型 */
  newMenuAnimation?: string;
  /** 双栏导航展开模式 */
  doubleNavExpandMode?: string;
  /** 双栏导航是否默认展开全部 */
  doubleNavAutoExpandAll?: boolean;
  /** 节日主题自动切换 */
  enableFestivalTheme?: boolean;
  /** 是否显示头部消息中心按钮 */
  showMessage?: boolean;
  /** 消息中心下拉弹框位置 */
  messageDropdownPosition?: string;
  /** 消息弹窗启用 */
  messagePopupEnabled?: boolean;
  /** 消息弹窗位置 */
  messagePopupPosition?: string;
  /** 消息弹窗持续时间 */
  messagePopupDuration?: number;
  /** AI 助手主题 */
  aiChatTheme?: string;
  /** AI 助手是否启用 */
  aiChatEnabled?: boolean;
  /** AI 助手位置 */
  aiChatPosition?: string;
  /** AI 助手 API Key */
  aiChatApiKey?: string;
  /** 强制显示新菜单标识 */
  forceNewMenu?: boolean;
  /** 菜单动画开关 */
  menuAnimation?: boolean;
  /** 主题动画开关 */
  themeAnimation?: boolean;
  /** 主题动画方向 */
  themeAnimationDirection?: string;
  /** 主题动画模式 */
  themeAnimationMode?: string;
  /** 字体加密是否启用 */
  fontEncryptionEnabled?: boolean;
  /** 是否加密数字 */
  fontEncryptionNumbers?: boolean;
  /** 是否加密中文 */
  fontEncryptionChinese?: boolean;
  /** 是否全局应用字体加密 */
  fontEncryptionGlobal?: boolean;
  /** 是否启用 OCR 干扰噪点 */
  fontEncryptionOcrNoise?: boolean;
  /** 性能监控开关 */
  sysFpsMonitorEnabled?: boolean;
  menuSearchHistory?: number;
  username?: string;
}
