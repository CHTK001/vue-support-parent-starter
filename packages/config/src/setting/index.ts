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
  /** 管理员角色列表 */
  AdminRoles: ["ADMIN", "SUPER_ADMIN"],
  /** 运维角色列表 */
  OpsRoles: ["ADMIN", "SUPER_ADMIN", "OPS"],

  // ===========================================
  // 鉴权与登录配置
  // ===========================================
  /** 是否开启远程权限控制 */ 
  OpenAuth: true,
  /** 是否开启动态配置面板 */
  OpenSetting: true,
  /** 是否开启租户登录 */
  OpenTenantLogin: false,
  /** 是否开启基础登录 */
  OpenBaseLogin: true,
  /** 配置加载失败时是否保持加载页面（默认false，失败后继续进入应用） */
  BlockOnConfigLoadFail: false,
  /** 是否显示错误页面风格切换按钮（默认false） */
  ShowErrorPageStyleSwitcher: false,
  /** 系统加载页面风格（默认minimal） */
  LoadingPageStyle: "minimal",
  /** 错误页面风格（默认minimal） */
  ErrorPageStyle: "minimal",

  // ===========================================
  // 布局与菜单配置
  // ===========================================
  /** 是否开启远程菜单 */
  RemoteMenu: false,
  /** 是否开启远程布局 */
  RemoteLayout: false,
  /** 是否开启远程布局保存 */
  RemoteLayoutSave: false,
  /** 是否使用本地布局组件 */
  LocationLayout: false,
  /** 是否开启远程动画 */
  RemoteAnimation: true,
  /** 是否开启菜单动画 */
  MenuAnimation: true,
  /** 是否开启菜单过渡动画 */
  MenuTransition: false,
  /** vue3-sfc-loader加载地址 */
  SfcScriptUrl:
    "https://unpkg.com/vue3-sfc-loader@0.9.5/dist/vue3-sfc-loader.js",

  // ===========================================
  // 界面显示配置
  // ===========================================
  /** 是否固定页头和标签页 */
  FixedHeader: true,
  /** 是否隐藏菜单和页头 */
  HiddenSideBar: false,
  /** 是否隐藏标签页 */
  HideTabs: false,
  /** 是否隐藏页脚 */
  HideFooter: true,
  /** 是否显示Logo */
  ShowLogo: true,
  /** 侧边栏状态 */
  SidebarStatus: true,
  /** 是否显示卡片边框 */
  CardBody: false,
  /** 内容区边距 */
  contentMargin: 16,
  /** 是否显示FPS监控 */
  ShowFpsMonitor: false,

  // ===========================================
  // 顶部工具栏配置
  // ===========================================
  /** 是否显示设置按钮 */
  ShowBarSetting: false,
  /** 是否显示通知按钮 */
  ShowBarNotice: false,
  /** 是否显示消息按钮 */
  ShowBarMessage: false,
  /** 是否显示语言切换 */
  ShowLanguage: true,
  /** 是否显示搜索按钮 */
  ShowBarSearch: true,
  /** 是否显示AI助手 */
  ShowAiChat: false,
  /** AI助手皮肤主题 */
  AiChatTheme: "default",

  // ===========================================
  // 主题与样式配置
  // ===========================================
  /** 主题模式 */ 
  Theme: "light",
  /** 是否开启暗黑模式 */
  DarkMode: false,
  /** 整体风格 */
  OverallStyle: "light",
  /** 主题色 */
  EpThemeColor: "#409EFF",
  /** 灰色模式 */
  Grey: false,
  /** 色弱模式 */
  Weak: false,
  /** 反色模式 */
  Invert: false,
  /** 黑白模式 */
  Monochrome: false,
  /** 布局圆角 */
  LayoutRadius: 10,
  /** 布局模糊程度 */
  LayoutBlur: 10,

  // ===========================================
  // 标签页配置
  // ===========================================
  /** 标签页风格 */
  ShowModel: "chrome",
  /** 是否开启持久化标签 */
  MultiTagsCache: true,

  // ===========================================
  // 导航菜单配置
  // ===========================================
  /** 布局模式 */
  Layout: "vertical", 
  /** 菜单箭头图标是否开启动画 */
  MenuArrowIconNoTransition: false,
  /** 菜单搜索历史的最大条目 */
  MenuSearchHistory: 6,

  // ===========================================
  // 缓存与存储配置
  // ===========================================
  /** 是否开启缓存加密 */
  StorageEncode: true,
  /** 缓存加密密钥 */
  StorageKey: "2XNN4K8LC0ELVWN4",
  /** 本地响应式存储的命名空间 */
  ResponsiveStorageNameSpace: "responsive-",
  /** 是否开启组件缓存 */
  KeepAlive: true,
  /** 是否开启动态路由缓存 */
  CachingAsyncRoutes: true,

  // ===========================================
  // 基础配置
  // ===========================================
  /** 系统标识码 */
  SystemCode: "system",
  /** 平台版本号 */
  Version: "0.7.0",
  /** 系统名称 */
  Title: "代理管理",
  /** 远程API地址 */
  BaseUrl: "",
  /** API版本号 */
  apiVersion: "1.0.0",
  /** 签名密钥 */
  secretKey: "1234567890",

  // ===========================================
  // 国际化配置
  // ===========================================
  /** 默认语言 */
  Locale: "zh-CN",
  /** Tooltip效果 */
  TooltipEffect: "light",

  // ===========================================
  // 会话配置（默认启用）
  // ===========================================
  Session: {
    /** 是否启用 */
    enable: true,
    /** 会话超时时间（秒），0表示不超时 */
    timeout: 0,
    /** 超时前提醒时间（秒） */
    warningTime: 60,
    /** 超时自动登出 */
    autoLogout: false,
  },

  // ===========================================
  // 请求配置（默认启用）
  // ===========================================
  Request: {
    /** 是否启用 */
    enable: true,
    /** 请求超时时间（毫秒） */
    timeout: 30000,
    /** 重试次数 */
    retryCount: 3,
    /** 重试间隔（毫秒） */
    retryDelay: 1000,
    /** 显示加载状态 */
    showLoading: true,
  },

  // ===========================================
  // 错误处理配置（默认不启用）
  // ===========================================
  ErrorHandler: {
    /** 是否启用 */
    enable: false,
    /** 显示错误通知 */
    showNotification: true,
    /** 输出到控制台 */
    logToConsole: true,
    /** 上报到服务器 */
    reportToServer: false,
    /** 上报接口地址 */
    reportUrl: "/v1/error/report",
  },

  // ===========================================
  // 页面行为配置（默认不启用）
  // ===========================================
  PageBehavior: {
    /** 是否启用 */
    enable: false,
    /** 是否记住滚动位置 */
    rememberScroll: false,
    /** 自动刷新间隔（秒），0表示不刷新 */
    autoRefreshInterval: 0,
    confirmOnLeave: false,
    /** 顶部是否显示时间 */
    showHeaderClock: false,
    /** 页面缩放比例（0.8 - 1.5） */
    uiScale: 1,
    /** 读屏优化模式 */
    screenReaderMode: false,
    /** 高对比度模式（独立于深色模式） */
    highContrastMode: false,
    /** DevTools 精简版开关 */
    devLiteTools: false,
    /** DevTools 标尺开关 */
    devRuler: false,
    /** DevTools 网格开关 */
    devGrid: false,
    /** DevTools 悬停检查开关 */
    devHoverInspector: false,
  },

  // ===========================================
  // 性能配置（默认启用）
  // ===========================================
  Performance: {
    /** 是否启用 */
    enable: true,
    /** 图片懒加载 */
    lazyLoadImages: true,
    /** 虚拟滚动 */
    virtualScroll: false,
    /** 预加载路由 */
    prefetchRoutes: true,
  },
};

const settingStorage = {
  token: null,
};
