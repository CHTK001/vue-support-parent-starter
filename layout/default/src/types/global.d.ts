/// <reference types="vite/client" />

/**
 * 全局类型声明
 * 用于解决 @ts-ignore 和类型推断问题
 * @version 2.0.0 - 重构版本，统一类型定义
 */

// 导入统一类型
import type { ThemeKey as ImportedThemeKey, StorageConfig as ImportedStorageConfig, StorageLayout } from "./theme";

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

declare global {
  interface Window {
    __THEME_INITIALIZED__?: boolean;
  }

  /** 主题键值类型（全局可用） */
  type ThemeKey = ImportedThemeKey;

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
   * @description 使用统一的 StorageConfig 类型
   */
  type ConfigureOptions = ImportedStorageConfig;

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
}

export {};
