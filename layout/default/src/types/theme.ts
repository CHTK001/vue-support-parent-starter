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
  | "8-bit"
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
  messagePopupPosition?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-right";
  /** 消息弹窗持续时间 */
  messagePopupDuration?: number;
  /** AI 助手主题 */
  aiChatTheme?: string;
  /** 显示新菜单标识 */
  forceNewMenu?: boolean;
  /** 菜单动画开关 */
  menuAnimation?: boolean;
  /** 菜单动画类型 */
  transitionType?: string;
  /** 主题动画开关 */
  themeAnimation?: boolean;
  /** 主题动画方向 */
  themeAnimationDirection?: string;
  /** 主题动画模式 */
  themeAnimationMode?: string;
  /** 性能监控开关 */
  sysFpsMonitorEnabled?: boolean;
}
