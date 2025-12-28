/**
 * 全局类型声明
 * 用于解决 @ts-ignore 和类型推断问题
 */

// Vite SVG 组件导入声明
declare module "*.svg?component" {
  import type { FunctionalComponent, SVGAttributes } from "vue";
  const component: FunctionalComponent<SVGAttributes>;
  export default component;
}

// 图片资源导入声明
declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

/**
 * 全局属性 API 类型
 * 用于 useGlobal<GlobalPropertiesApi>()
 */
interface GlobalPropertiesApi {
  $storage: StorageConfig;
  $config: AppConfig;
}

/**
 * 存储配置类型
 */
interface StorageConfig {
  locale?: {
    locale: string;
  };
  layout?: LayoutConfig;
  configure?: ConfigureOptions;
  tags?: Array<{
    path?: string;
    meta?: Record<string, any>;
  }>;
  user?: {
    roles?: string[];
  };
  userInfo?: {
    roles?: string[];
  };
}

/**
 * 布局配置类型
 */
interface LayoutConfig {
  layout: "vertical" | "horizontal" | "mix" | "hover" | "double" | "mobile";
  theme: string;
  darkMode: boolean;
  sidebarStatus: boolean;
  epThemeColor: string;
  themeColor: string;
  overallStyle: "light" | "dark" | "system";
}

/**
 * 配置选项类型
 */
interface ConfigureOptions {
  grey?: boolean;
  weak?: boolean;
  invert?: boolean;
  monochrome?: boolean;
  hideTabs?: boolean;
  hideFooter?: boolean;
  hideHeader?: boolean;
  showLogo?: boolean;
  showModel?: string;
  multiTagsCache?: boolean;
  stretch?: number | boolean;
  keepAlive?: boolean;
  debugMode?: boolean;
  showBreadcrumb?: boolean;
  breadcrumbIconOnly?: boolean;
  showTagIcon?: boolean;
  showNewMenu?: boolean;
  newMenuText?: string;
  newMenuTimeLimit?: number;
  newMenuAnimation?: string;
  doubleNavExpandMode?: string;
  doubleNavAutoExpandAll?: boolean;
  aiChatTheme?: string;
  enableFestivalTheme?: boolean;
  messagePopupEnabled?: boolean;
  messagePopupPosition?: string;
  messagePopupDuration?: number;
  systemTheme?: string;
  cardColorMode?: string;
  contentMargin?: number;
  layoutRadius?: number;
  layoutBlur?: number;
  menuTransition?: boolean;
}

/**
 * 应用配置类型
 */
interface AppConfig {
  Title?: string;
  Locale?: string;
  Layout?: string;
  Theme?: string;
  DarkMode?: boolean;
  SidebarStatus?: boolean;
  EpThemeColor?: string;
  Grey?: boolean;
  Weak?: boolean;
  Invert?: boolean;
  Monochrome?: boolean;
  HideTabs?: boolean;
  HideFooter?: boolean;
  ShowLogo?: boolean;
  ShowModel?: string;
  MultiTagsCache?: boolean;
  Stretch?: boolean;
  layoutRadius?: number;
  layoutBlur?: number;
}

// 扩展 Window 接口
declare global {
  interface Window {
    __THEME_INITIALIZED__?: boolean;
  }
}

export {};
