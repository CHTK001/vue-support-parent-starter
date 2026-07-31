/**
 * 统一应用配置
 *
 * createApp 会把 apps/{appName}/app.yaml 解析后写入这里。
 * app.yaml 缺失或加载失败时，使用默认配置（defaultAppConfig）。
 */
import { load as parseYaml } from "js-yaml";

/** 会话配置 */
export interface SessionConfig {
  enable: boolean;
  timeout: number;
  warningTime: number;
  autoLogout: boolean;
}

/** 请求配置 */
export interface RequestConfig {
  enable: boolean;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  showLoading: boolean;
}

/** 错误处理配置 */
export interface ErrorHandlerConfig {
  enable: boolean;
  showNotification: boolean;
  logToConsole: boolean;
  reportToServer: boolean;
  reportUrl: string;
}

/** 页面行为配置 */
export interface PageBehaviorConfig {
  enable: boolean;
  rememberScroll: boolean;
  autoRefreshInterval: number;
  confirmOnLeave: boolean;
}

/** 性能配置 */
export interface PerformanceConfig {
  enable: boolean;
  lazyLoadImages: boolean;
  virtualScroll: boolean;
  prefetchRoutes: boolean;
}

/** 热力图配置 */
export interface HeatmapConfig {
  enable: boolean;
  show: boolean;
  sampleRate: number;
  reportUrl: string;
  flushInterval: number;
  maxLocalEntries: number;
  trackClick: boolean;
  trackMouseMove: boolean;
  trackScroll: boolean;
  aiAnalysis: boolean;
  aiAnalysisUrl: string;
}

/** 应用配置（app.yaml schema，键名统一首字母小写） */
export interface AppConfig {
  /** 系统名称 */
  title: string;
  /** 平台版本号 */
  version: string;
  /** 平台标识码（storage 存储前缀，防止多个 app 共用同一 key） */
  systemCode: string;
  /** 远程 API 地址（后端接口基础路径） */
  baseUrl: string;
  /** API 版本号（拼到请求 query，如 ?version=v1） */
  apiVersion: string;
  /** 远程配置地址（远程为主，本地 app.yaml 兜底） */
  remoteSettingUrl: string;

  /** 管理员角色列表 */
  adminRoles: string[];
  /** 运维角色列表 */
  opsRoles: string[];

  /** 是否开启鉴权 */
  openAuth: boolean;
  /** 是否开启动态配置面板 */
  openSetting: boolean;
  /** 是否开启租户登录 */
  openTenantLogin: boolean;
  /** 是否开启基础登录 */
  openBaseLogin: boolean;
  /** 是否显示刷新 token 入口 */
  openShowRefreshToken: boolean;
  /** 配置加载失败时是否保持加载页面 */
  blockOnConfigLoadFail: boolean;
  /** 是否显示错误页面风格切换按钮 */
  showErrorPageStyleSwitcher: boolean;
  /** 是否显示加载动画样式切换按钮 */
  showLoadingPageStyleSwitcher: boolean;
  /** 默认错误页面风格 */
  errorPageStyle: string;
  /** 系统加载页面风格 */
  loadingPageStyle: string;

  /** 是否自动远程菜单 */
  remoteMenu: boolean;
  /** 是否自动远程布局 */
  remoteLayout: boolean;
  /** 是否开启布局远程保存 */
  remoteLayoutSave: boolean;
  /** 使用本地布局组件 */
  locationLayout: boolean;
  /** 是否开启远程动画 */
  remoteAnimation: boolean;
  /** 是否开启菜单动画 */
  menuTransition: boolean;

  /** 是否固定页头和标签页 */
  fixedHeader: boolean;
  /** 隐藏菜单和页头 */
  hiddenSideBar: boolean;
  /** 是否隐藏标签页 */
  hideTabs: boolean;
  /** 是否隐藏页脚 */
  hideFooter: boolean;
  /** 是否显示 Logo */
  showLogo: boolean;
  /** 侧边栏状态（true 展开 false 收起） */
  sidebarStatus: boolean;
  /** 是否显示卡片边框 */
  cardBody: boolean;
  /** 内容区边距 */
  contentMargin: number;

  /** 是否显示设置按钮 */
  showBarSetting: boolean;
  /** 是否显示通知按钮 */
  showBarNotice: boolean;
  /** 是否显示消息按钮 */
  showBarMessage: boolean;
  /** 是否显示语言切换 */
  showLanguage: boolean;
  /** 是否显示搜索按钮 */
  showBarSearch: boolean;
  /** 是否显示 AI 助手 */
  showAiChat: boolean;
  /** AI 助手皮肤主题 */
  aiChatTheme: string;

  /** 主题模式（light/dark） */
  theme: string;
  /** 是否开启暗黑模式 */
  darkMode: boolean;
  /** 整体风格（light/dark/system） */
  overallStyle: string;
  /** 主题色 */
  epThemeColor: string;
  /** 灰色模式 */
  grey: boolean;
  /** 色弱模式 */
  weak: boolean;
  /** 反色模式 */
  invert: boolean;
  /** 黑白模式 */
  monochrome: boolean;
  /** 布局圆角（像素） */
  layoutRadius: number;
  /** 布局模糊程度 */
  layoutBlur: number;
  /** 内容区是否拉伸 */
  stretch: boolean;

  /** 标签页风格 */
  showModel: string;
  /** 是否开启持久化标签 */
  multiTagsCache: boolean;
  /** 标签页最大层级 */
  maxTagsLevel: number;

  /** 导航菜单模式 */
  layout: string;
  /** 菜单展开收起图标是否开启动画 */
  menuArrowIconNoTransition: boolean;
  /** 菜单搜索历史的最大条目 */
  menuSearchHistory: number;

  /** 是否开启缓存加密 */
  storageEncode: boolean;
  /** 缓存加密密钥 */
  storageKey: string;
  /** 本地响应式存储的命名空间 */
  responsiveStorageNameSpace: string;
  /** 是否开启组件缓存 */
  keepAlive: boolean;
  /** 是否开启动态路由缓存 */
  cachingAsyncRoutes: boolean;

  /** 是否启用 WASM 加解密 */
  wasmEnable: boolean;

  /** 默认语言 */
  locale: string;
  /** Tooltip 效果 */
  tooltipEffect: string;

  /** 是否显示新增菜单标识 */
  showNewMenu: boolean;
  /** 新菜单显示文本 */
  newMenuText: string;
  /** 新菜单显示时间限制（小时） */
  newMenuTimeLimit: number;

  /** vue3-sfc-loader 加载地址 */
  sfcScriptUrl: string;

  /** 会话配置 */
  session: SessionConfig;
  /** 请求配置 */
  request: RequestConfig;
  /** 错误处理配置 */
  errorHandler: ErrorHandlerConfig;
  /** 页面行为配置 */
  pageBehavior: PageBehaviorConfig;
  /** 性能配置 */
  performance: PerformanceConfig;

  /** 登录页面主题 */
  loginTheme: string;
  /** 节日主题自动切换 */
  enableFestivalTheme: boolean;
  /** 后台主题管理 */
  enableThemeManagement: boolean;
  /** 登录页主题切换器 */
  enableLoginThemeSwitcher: boolean;

  /** 热力图配置 */
  heatmap: HeatmapConfig;
}

/** 默认配置（没有 app.yaml 时全部走默认） */
export const defaultAppConfig: AppConfig = {
  title: "Vue Support",
  version: "0.7.0",
  systemCode: "system",
  baseUrl: "/",
  apiVersion: "",
  remoteSettingUrl: "",

  adminRoles: ["ADMIN", "SUPER_ADMIN"],
  opsRoles: ["ADMIN", "SUPER_ADMIN", "OPS"],

  openAuth: true,
  openSetting: true,
  openTenantLogin: false,
  openBaseLogin: true,
  openShowRefreshToken: false,
  blockOnConfigLoadFail: false,
  showErrorPageStyleSwitcher: false,
  showLoadingPageStyleSwitcher: false,
  errorPageStyle: "minimal",
  loadingPageStyle: "spinner",

  remoteMenu: false,
  remoteLayout: false,
  remoteLayoutSave: false,
  locationLayout: false,
  remoteAnimation: true,
  menuTransition: false,

  fixedHeader: true,
  hiddenSideBar: false,
  hideTabs: false,
  hideFooter: true,
  showLogo: true,
  sidebarStatus: true,
  cardBody: false,
  contentMargin: 0,

  showBarSetting: false,
  showBarNotice: false,
  showBarMessage: false,
  showLanguage: true,
  showBarSearch: true,
  showAiChat: false,
  aiChatTheme: "default",

  theme: "light",
  darkMode: false,
  overallStyle: "light",
  epThemeColor: "#409EFF",
  grey: false,
  weak: false,
  invert: false,
  monochrome: false,
  layoutRadius: 10,
  layoutBlur: 10,
  stretch: false,

  showModel: "chrome",
  multiTagsCache: true,
  maxTagsLevel: 0,

  layout: "vertical",
  menuArrowIconNoTransition: false,
  menuSearchHistory: 6,

  storageEncode: true,
  storageKey: "2XNN4K8LC0ELVWN4",
  responsiveStorageNameSpace: "responsive-",
  keepAlive: true,
  cachingAsyncRoutes: true,

  wasmEnable: true,

  locale: "zh-CN",
  tooltipEffect: "light",

  showNewMenu: false,
  newMenuText: "NEW",
  newMenuTimeLimit: 72,

  sfcScriptUrl: "https://unpkg.com/vue3-sfc-loader@0.9.5/dist/vue3-sfc-loader.js",

  session: {
    enable: false,
    timeout: 0,
    warningTime: 60,
    autoLogout: false,
  },
  request: {
    enable: true,
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    showLoading: true,
  },
  errorHandler: {
    enable: false,
    showNotification: true,
    logToConsole: true,
    reportToServer: false,
    reportUrl: "/v1/error/report",
  },
  pageBehavior: {
    enable: false,
    rememberScroll: false,
    autoRefreshInterval: 0,
    confirmOnLeave: false,
  },
  performance: {
    enable: true,
    lazyLoadImages: true,
    virtualScroll: false,
    prefetchRoutes: true,
  },

  loginTheme: "modern",
  enableFestivalTheme: true,
  enableThemeManagement: false,
  enableLoginThemeSwitcher: false,

  heatmap: {
    enable: false,
    show: false,
    sampleRate: 1,
    reportUrl: "",
    flushInterval: 5000,
    maxLocalEntries: 1000,
    trackClick: true,
    trackMouseMove: false,
    trackScroll: true,
    aiAnalysis: false,
    aiAnalysisUrl: "",
  },
};

let currentConfig: AppConfig = { ...defaultAppConfig };

/** 获取统一配置 */
export function getConfig(): AppConfig {
  return currentConfig;
}

/** 合并写入统一配置 */
export function setConfig(partial: Partial<AppConfig>): AppConfig {
  currentConfig = { ...currentConfig, ...partial };
  return currentConfig;
}

/** 重置为默认配置 */
export function resetConfig(): AppConfig {
  currentConfig = { ...defaultAppConfig };
  return currentConfig;
}

/** 首字母小写 */
function lowerFirst(key: string): string {
  return key ? key.charAt(0).toLowerCase() + key.slice(1) : key;
}

/** 把 yaml 解析出的对象键首字母转小写（只处理一层，嵌套对象键本就小写） */
function normalizeKeys(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    result[lowerFirst(key)] = data[key];
  }
  return result;
}

/** 解析 app.yaml 文本（失败时返回空对象） */
export function parseAppYaml(yaml: string): Partial<AppConfig> {
  try {
    const data = parseYaml(yaml) as Record<string, unknown> | undefined;
    return (data ? normalizeKeys(data) : {}) as Partial<AppConfig>;
  } catch {
    return {};
  }
}

/** 从默认值 + yaml 解析结果得到最终配置（不修改 currentConfig） */
export function mergeAppConfig(partial: Partial<AppConfig>): AppConfig {
  return { ...defaultAppConfig, ...partial };
}
