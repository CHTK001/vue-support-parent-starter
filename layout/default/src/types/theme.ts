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
  | "pixel-art"
  | "future-tech"
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
  messagePopupPosition?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "left-center"
    | "right-center"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  /** 消息弹窗持续时间 */
  messagePopupDuration?: number;
  /** AI 助手主题 */
  aiChatTheme?: string;
  /** AI 聊天外观：启用主题化对话窗 */
  enableAiChatTheme?: boolean;
  /** AI 聊天外观：启用场景背景 */
  enableAiChatBackground?: boolean;
  /** AI 聊天功能：启用快捷提问 */
  enableAiQuickAction?: boolean;
  /** AI 聊天功能：启用快捷功能面板 */
  enableAiShortcutPanel?: boolean;
  /** 显示新菜单标识 */
  forceNewMenu?: boolean;
  /** 菜单动画开关 */
  menuAnimation?: boolean;
  /** 菜单动画类型 */
  transitionType?: string;
  /** 离开页面二次确认 */
  confirmOnLeave?: boolean;
  /** 主题动画开关 */
  themeAnimation?: boolean;
  /** 主题动画方向 */
  themeAnimationDirection?: string;
  /** 主题动画模式 */
  themeAnimationMode?: string;

  /** 页签样式：形状 */
  tagsStyle?: string;
  /** 页签样式：效果 */
  tagsEffect?: string;

  /** 移动端导航：样式 */
  mobileNavMode?: string;
  /** 移动端导航：位置 */
  mobileNavPosition?: string;

  /** 双栏导航：展开策略 */
  doubleNavExpandMode?: "auto" | "manual";
  /** 双栏导航：是否自动展开全部 */
  doubleNavAutoExpandAll?: boolean;

  /** 新菜单标识：是否显示 */
  showNewMenu?: boolean;
  /** 新菜单标识：文本 */
  newMenuText?: string;
  /** 新菜单标识：显示时长（小时） */
  newMenuTimeLimit?: number;
  /** 新菜单标识：动画 */
  newMenuAnimation?: string;
  /** 性能监控开关 */
  sysFpsMonitorEnabled?: boolean;

  /** 字体加密开关 */
  fontEncryptionEnabled?: boolean;
  /** 是否加密数字 */
  fontEncryptionNumbers?: boolean;
  /** 是否加密中文 */
  fontEncryptionChinese?: boolean;
  /** 是否全局启用字体加密 */
  fontEncryptionGlobal?: boolean;
  /** OCR 噪点开关 */
  fontEncryptionOcrNoise?: boolean;
}
