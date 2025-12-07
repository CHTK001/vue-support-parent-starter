import type { PlatformConfigs } from "../types/config";

/**
 * 全局默认配置
 * @author CH
 * @since 2024-12-05
 */
export const globalSetting: PlatformConfigs = {
  // ===========================================
  // 角色权限配置
  // ===========================================
  AdminRoles: ["ADMIN", "SUPER_ADMIN"],
  OpsRoles: ["ADMIN", "SUPER_ADMIN", "OPS"],

  // ===========================================
  // 鉴权与登录配置
  // ===========================================
  OpenAuth: true,
  OpenSetting: true,
  OpenTenantLogin: false,
  OpenBaseLogin: true,
  BlockOnConfigLoadFail: false,
  ShowErrorPageStyleSwitcher: false,
  ErrorPageStyle: "minimal",
  LoadingPageStyle: "spinner",

  // ===========================================
  // 布局与菜单配置
  // ===========================================
  RemoteMenu: false,
  RemoteLayout: false,
  RemoteLayoutSave: false,
  LocationLayout: false,
  RemoteAnimation: true,
  MenuTransition: false,
  SfcScriptUrl:
    "https://cdn.jsdelivr.net/npm/vue3-sfc-loader@0.9.5/dist/vue3-sfc-loader.js",

  // ===========================================
  // 界面显示配置
  // ===========================================
  FixedHeader: true,
  HiddenSideBar: false,
  HideTabs: false,
  HideFooter: true,
  ShowLogo: true,
  SidebarStatus: true,
  CardBody: false,

  // ===========================================
  // 顶部工具栏配置
  // ===========================================
  ShowBarSetting: false,
  ShowBarNotice: false,
  ShowBarMessage: false,
  ShowLanguage: true,
  ShowBarSearch: true,

  // ===========================================
  // 主题与样式配置
  // ===========================================
  Theme: "light",
  DarkMode: false,
  OverallStyle: "light",
  EpThemeColor: "#409EFF",
  Grey: false,
  Weak: false,
  Invert: false,
  Monochrome: false,
  LayoutRadius: 10,
  LayoutBlur: 10,

  // ===========================================
  // 标签页配置
  // ===========================================
  ShowModel: "chrome",
  MultiTagsCache: true,

  // ===========================================
  // 导航菜单配置
  // ===========================================
  Layout: "vertical",
  MenuArrowIconNoTransition: false,
  MenuSearchHistory: 6,

  // ===========================================
  // 缓存与存储配置
  // ===========================================
  StorageEncode: true,
  StorageKey: "2XNN4K8LC0ELVWN4",
  ResponsiveStorageNameSpace: "responsive-",
  KeepAlive: true,
  CachingAsyncRoutes: true,

  // ===========================================
  // 基础配置
  // ===========================================
  SystemCode: "system",
  BaseUrl: "",
  Version: "0.7.0",
  Title: "代理管理",

  // ===========================================
  // 国际化配置
  // ===========================================
  Locale: "zh-CN",
  TooltipEffect: "light",

  // ===========================================
  // 会话配置（默认不启用）
  // ===========================================
  Session: {
    enable: false,
    timeout: 0,
    warningTime: 60,
    autoLogout: false,
  },

  // ===========================================
  // 请求配置（默认启用）
  // ===========================================
  Request: {
    enable: true,
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    showLoading: true,
  },

  // ===========================================
  // 错误处理配置（默认不启用）
  // ===========================================
  ErrorHandler: {
    enable: false,
    showNotification: true,
    logToConsole: true,
    reportToServer: false,
    reportUrl: "/v1/error/report",
  },

  // ===========================================
  // 页面行为配置（默认不启用）
  // ===========================================
  PageBehavior: {
    enable: false,
    rememberScroll: false,
    autoRefreshInterval: 0,
    confirmOnLeave: false,
  },

  // ===========================================
  // 性能配置（默认启用）
  // ===========================================
  Performance: {
    enable: true,
    lazyLoadImages: true,
    virtualScroll: false,
    prefetchRoutes: true,
  },
};

const settingStorage = {
  token: null,
};
