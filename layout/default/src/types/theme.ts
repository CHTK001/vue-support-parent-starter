/**
 * 主题相关类型定义
 * @description 统一管理主题相关的类型，增强类型安全
 */

/** 主题键值类型 */
export type ThemeKey =
  | "default"
  | "spring-festival"
  | "christmas"
  | "mid-autumn"
  | "national-day"
  | "new-year"
  | "cyberpunk"
  | "modern-tech"
  | "halloween";

/** 主题类型分类 */
export type ThemeType = "regular" | "beta" | "festival";

/** 主题配置接口 */
export interface ThemeConfig {
  /** 主题名称 */
  name: string;
  /** 主题键值 */
  key: ThemeKey;
  /** 主题描述 */
  description: string;
  /** 样式表文件名 */
  stylesheet?: string;
  /** 图标 */
  icon?: string;
  /** 主题类型 */
  type: ThemeType;
  /** 主题颜色 */
  color?: string;
}

/** 主题组件映射类型 */
export type ThemeComponentMap<T = any> = Partial<Record<ThemeKey, T>>;

/** Storage 配置接口 */
export interface StorageConfig {
  /** 系统主题 */
  systemTheme?: ThemeKey;
  /** 灰色模式 */
  grey?: boolean;
  /** 色弱模式 */
  weak?: boolean;
  /** 反色模式 */
  invert?: boolean;
  /** 黑白模式 */
  monochrome?: boolean;
  /** 隐藏标签页 */
  hideTabs?: boolean;
  /** 隐藏页脚 */
  hideFooter?: boolean;
  /** 隐藏顶部 */
  hideHeader?: boolean;
  /** 显示Logo */
  showLogo?: boolean;
  /** 显示模式 */
  showModel?: "smart" | "card" | "chrome" | "modern";
  /** 多标签缓存 */
  multiTagsCache?: boolean;
  /** 页面拉伸 */
  stretch?: boolean | number;
  /** 组件缓存 */
  keepAlive?: boolean;
  /** 调试模式 */
  debugMode?: boolean;
  /** 菜单过渡动画 */
  menuTransition?: boolean;
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
  cardColorMode?: "all" | "third" | "white";
  /** 节日主题自动切换 */
  enableFestivalTheme?: boolean;
  /** 消息弹窗启用 */
  messagePopupEnabled?: boolean;
  /** 消息弹窗位置 */
  messagePopupPosition?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-right";
  /** 消息弹窗持续时间 */
  messagePopupDuration?: number;
  /** AI 助手主题 */
  aiChatTheme?: string;
  /** 显示新菜单标识 */
  showNewMenu?: boolean;
  /** 新菜单文本 */
  newMenuText?: string;
  /** 新菜单时间限制 */
  newMenuTimeLimit?: number;
  /** 新菜单动画 */
  newMenuAnimation?: "none" | "bounce" | "pulse" | "shake";
  /** 双栏导航展开模式 */
  doubleNavExpandMode?: "auto" | "manual";
  /** 双栏导航自动展开所有 */
  doubleNavAutoExpandAll?: boolean;
  /** 离开确认 */
  confirmOnLeave?: boolean;
  /** 过渡动画类型 */
  transitionType?: string;
  /** 字体加密启用 */
  fontEncryptionEnabled?: boolean;
  /** 字体加密-数字 */
  fontEncryptionNumbers?: boolean;
  /** 字体加密-中文 */
  fontEncryptionChinese?: boolean;
  /** 字体加密-全局 */
  fontEncryptionGlobal?: boolean;
  /** 字体加密-OCR干扰 */
  fontEncryptionOcrNoise?: boolean;
}

/** Storage 布局配置接口 */
export interface StorageLayout {
  /** 布局类型 */
  layout?: "vertical" | "horizontal" | "mix" | "hover" | "double" | "mobile";
  /** 主题 */
  theme?: "light" | "dark";
  /** 暗色模式 */
  darkMode?: boolean;
  /** 侧边栏状态 */
  sidebarStatus?: boolean;
  /** EP 主题色 */
  epThemeColor?: string;
  /** 主题色 */
  themeColor?: string;
  /** 整体风格 */
  overallStyle?: "light" | "dark" | "system";
}

/** 全局 Storage 接口 */
export interface GlobalStorage {
  configure?: StorageConfig;
  layout?: StorageLayout;
  locale?: { locale: string };
  tags?: any[];
  user?: any;
  userInfo?: any;
}

/** Emitter 事件类型定义 */
export interface LayoutEmitterEvents {
  // 主题相关
  systemThemeChange: ThemeKey;
  aiChatThemeChange: string;

  // 标签页相关
  tagViewsChange: string;
  tagViewsShowModel: string;
  showTagIconChange: boolean;

  // 布局相关
  changLayoutRoute: string;
  openPanel: void;
  logoChange: boolean;
  hideFooterChange: boolean;
  hideHeaderChange: boolean;

  // 面包屑相关
  breadcrumbChange: boolean;
  breadcrumbModeChange: "icon" | "icon-text";

  // 功能开关
  keepAliveChange: boolean;
  debugModeChange: boolean;
  debugModeChanged: boolean;
  menuTransitionChange: boolean;
  confirmOnLeaveChange: boolean;
  messagePopupConfigChange: void;

  // 设置面板
  settingPanelClosed: void;
}
