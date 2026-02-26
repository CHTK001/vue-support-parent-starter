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
  | "8bit"
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
  /** 超时自动退出 */
  autoLogout?: boolean;
  /** 页面拉伸 */
  stretch?: boolean | number;
  /** 组件缓存 */
  keepAlive?: boolean;
  /** 调试模式 */
  debugMode?: boolean;
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
  cardColorMode?: "all" | "third" | "white";
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
  /** 是否显示顶部搜索按钮 */
  showSearch?: boolean;
  /** 是否显示顶部全屏按钮 */
  showFullscreen?: boolean;
  /** 是否显示顶部时间 */
  showHeaderClock?: boolean;
  /**
   * 消息中心下拉弹框位置（用于 el-dropdown placement 映射）
   * 值域与 ScSelect layout="position" 一致
   */
  messageDropdownPosition?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "left-center"
    | "right-center"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  /** 消息弹窗启用 */
  messagePopupEnabled?: boolean;
  /** 消息弹窗位置 */
  messagePopupPosition?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  /** 消息弹窗持续时间 */
  messagePopupDuration?: number;
  /** AI 助手主题 */
  aiChatTheme?: string;
  /** AI 助手是否启用（优先于 ShowAiChat 配置） */
  aiChatEnabled?: boolean;
  /** AI 助手位置 */
  aiChatPosition?: "bottom-right" | "bottom-left" | "bottom-center";
  /** AI 助手机器人皮肤 */
  aiChatSkin?: string;
  /** AI 助手 API Key（用于请求头） */
  aiChatApiKey?: string;
  /** AI 助手 API URL */
  aiChatApiUrl?: string;
  /** 显示新菜单标识 */
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
  /** 读屏优化模式 */
  screenReaderMode?: boolean;
  /** 高对比度模式 */
  highContrastMode?: boolean;
  /** 页面缩放比例 */
  uiScale?: number;
  /** DevTools 精简版总开关 */
  devLiteTools?: boolean;
  /** DevTools 标尺开关 */
  devRuler?: boolean;
  /** DevTools 网格开关 */
  devGrid?: boolean;
  /** DevTools 悬停检查开关 */
  devHoverInspector?: boolean;
  /** 开发模式下 AI 设置展示控制 */
  showDevAiSetting?: boolean;
}
