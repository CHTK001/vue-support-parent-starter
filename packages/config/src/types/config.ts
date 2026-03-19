/**
 * 平台配置接口
 * 定义所有可配置的平台参数
 * @author CH
 * @since 2024-12-05
 */
export interface PlatformConfigs {
  // ===========================================
  // 基础配置
  // ===========================================
  /** 系统名称 */
  Title?: string;
  /** 平台版本号 */
  Version?: string;
  /** 平台标识码 */
  SystemCode?: string;
  /** 远程API地址 */
  BaseUrl?: string;
  /** API版本号 */
  apiVersion?: string;
  /** 签名密钥 */
  secretKey?: string;
  /** API 接口地址（优先级高于 BaseUrl；若配置则 HTTP/SSE 统一使用该地址） */
  ApiAddress?: string;
  /** 是否自动提示错误信息 */
  AutoErrorMessage?: boolean;

  // ===========================================
  // 角色权限配置
  // ===========================================
  /** 管理员角色列表 */
  AdminRoles?: string[];
  /** 运维角色列表 */
  OpsRoles?: string[];

  // ===========================================
  // 鉴权与登录配置
  // ===========================================
  /** 是否开启远程权限控制 */
  OpenAuth?: boolean;
  /** 是否开启动态配置面板 */
  OpenSetting?: boolean;
  /** 是否开启租户登录 */
  OpenTenantLogin?: boolean;
  /** 是否开启基础登录 */
  OpenBaseLogin?: boolean;
  /** 是否开启短信登录 */
  OpenSmsLogin?: boolean;
  /** 是否开启刷新token */
  OpenShowRefreshToken?: boolean;
  /** 是否显示开发态静态登录入口 */
  ShowStaticLoginEntry?: boolean;
  /** 开发态静态登录目标路由 */
  StaticLoginPath?: string;
  /** 开发态静态登录用户名 */
  StaticLoginUsername?: string;
  /** 开发态静态登录昵称 */
  StaticLoginNickname?: string;
  /** 开发态静态登录角色 */
  StaticLoginRoles?: string[] | string;
  /** 开发态静态登录权限 */
  StaticLoginPerms?: string[] | string;
  /** 开发态静态登录 accessToken */
  StaticLoginAccessToken?: string;
  /** 配置加载失败时是否保持加载页面（默认false，失败后继续进入应用） */
  BlockOnConfigLoadFail?: boolean;
  /** 是否显示错误页面风格切换按钮（默认false） */
  ShowErrorPageStyleSwitcher?: boolean;
  /** 是否显示加载动画样式切换按钮（默认false） */
  ShowLoadingPageStyleSwitcher?: boolean;
  /** 系统加载页面风格（默认minimal） */
  LoadingPageStyle?:
    | "spinner"
    | "clock"
    | "pixel"
    | "cube"
    | "dots"
    | "pulse"
    | "minimal"
    | "space"
    | "servererror";

  // ===========================================
  // 布局与菜单配置
  // ===========================================
  /** 是否自动远程菜单 */
  RemoteMenu?: boolean;
  /** 是否自动远程布局 */
  RemoteLayout?: boolean;
  /** 是否开启布局远程保存 */
  RemoteLayoutSave?: boolean;
  /** 使用本地布局组件 */
  LocationLayout?: boolean;
  /** 是否开启远程动画 */
  RemoteAnimation?: boolean;
  /** 是否开启菜单动画 */
  MenuAnimation?: boolean;
  /** 是否开启菜单过渡 */
  MenuTransition?: boolean;
  /** vue3-sfc-loader加载地址 */
  SfcScriptUrl?: string;

  // ===========================================
  // 界面显示配置
  // ===========================================
  /** 是否固定页头和标签页 */
  FixedHeader?: boolean;
  /** 隐藏菜单和页头 */
  HiddenSideBar?: boolean;
  /** 是否隐藏标签页 */
  HideTabs?: boolean;
  /** 是否隐藏页脚 */
  HideFooter?: boolean;
  /** 是否显示Logo */
  ShowLogo?: boolean;
  /** 侧边栏状态 */
  SidebarStatus?: boolean;
  /** 是否显示卡片边框 */
  CardBody?: boolean;
  /** 内容区边距 */
  contentMargin?: Number;
  /** 是否显示FPS监控 */
  ShowFpsMonitor?: boolean;
  /** 消息弹窗默认开关 */
  MessagePopupEnabled?: boolean;

  // ===========================================
  // 顶部工具栏配置
  // ===========================================
  /** 是否显示设置按钮 */
  ShowBarSetting?: boolean;
  /** 是否显示通知按钮 */
  ShowBarNotice?: boolean;
  /** 是否显示消息按钮 */
  ShowBarMessage?: boolean;
  /** 是否显示语言切换 */
  ShowLanguage?: boolean;
  /** 是否显示搜索按钮 */
  ShowBarSearch?: boolean;
  /** 是否显示AI助手 */
  ShowAiChat?: boolean;
  /** AI助手皮肤主题 */
  AiChatTheme?: "default" | "blue" | "green" | "orange" | "pink" | "dark";

  // ===========================================
  // 主题与样式配置
  // ===========================================
  /** 主题模式 */
  Theme?: string;
  /** 是否开启暗黑模式 */
  DarkMode?: boolean;
  /** 整体风格 */
  OverallStyle?: string;
  /** 主题色 */
  EpThemeColor?: string;
  /** 灰色模式 */
  Grey?: boolean;
  /** 色弱模式 */
  Weak?: boolean;
  /** 反色模式 */
  Invert?: boolean;
  /** 黑白模式 */
  Monochrome?: boolean;
  /** 布局圆角 */
  LayoutRadius?: number;
  /** 布局模糊程度 */
  LayoutBlur?: number;
  /** 内容区是否拉伸 */
  Stretch?: boolean | number;

  // ===========================================
  // 标签页配置
  // ===========================================
  /** 标签页风格 */
  ShowModel?: string;
  /** 是否开启持久化标签 */
  MultiTagsCache?: boolean;
  /** 标签页最大层级 */
  MaxTagsLevel?: number;

  // ===========================================
  // 导航菜单配置
  // ===========================================
  /** 导航菜单模式 */
  Layout?: string;
  /** 菜单展开收起图标是否开启动画 */
  MenuArrowIconNoTransition?: boolean;
  /** 菜单搜索历史的最大条目 */
  MenuSearchHistory?: number;

  // ===========================================
  // 缓存与存储配置
  // ===========================================
  /** 是否开启缓存加密 */
  StorageEncode?: boolean;
  /** 缓存加密密钥 */
  StorageKey?: string;
  /** 本地响应式存储的命名空间 */
  ResponsiveStorageNameSpace?: string;
  /** 是否开启组件缓存 */
  KeepAlive?: boolean;
  /** 是否开启动态路由缓存 */
  CachingAsyncRoutes?: boolean;

  // ===========================================
  // 国际化配置
  // ===========================================
  /** 默认语言 */
  Locale?: string;
  /** Tooltip效果 */
  TooltipEffect?: Effect;

  // ===========================================
  // 新菜单提示配置
  // ===========================================
  /** 是否显示新增菜单标识 */
  ShowNewMenu?: boolean;
  /** 新菜单显示文本 */
  NewMenuText?: string;
  /** 新菜单显示时间限制（小时） */
  NewMenuTimeLimit?: number;
  /** 新菜单动画类型 */
  NewMenuAnimation?: "none" | "bounce" | "pulse" | "shake";
  /** 是否开启菜单动画 */
  MenuAnimation?: boolean;
  /** 强制显示新菜单（测试用） */
  ForceNewMenu?: boolean;

  // ===========================================
  // 会话配置
  // ===========================================
  /** 会话配置 */
  Session?: SessionConfig;

  // ===========================================
  // 请求配置
  // ===========================================
  /** 请求配置 */
  Request?: RequestConfig;

  // ===========================================
  // 错误处理配置
  // ===========================================
  /** 错误处理配置 */
  ErrorHandler?: ErrorHandlerConfig;

  // ===========================================
  // 错误页面配置
  // ===========================================
  /** 错误页面风格: pixel(像素恐龙) | space(太空风) | minimal(极简风) | forbidden(禁止) | notfound(迷路) | servererror(故障) */
  ErrorPageStyle?:
    | "pixel"
    | "space"
    | "minimal"
    | "forbidden"
    | "notfound"
    | "servererror";
  /** 账户类型（如 tenant） */
  AccountType?: string;

  // ===========================================
  // 登录页主题配置
  // ===========================================
  /** 默认登录页主题 */
  LoginTheme?: string;
  /** 是否启用节日主题自动切换 */
  EnableFestivalTheme?: boolean;
  /** 是否启用后台主题管理（登录主题管理页面） */
  EnableThemeManagement?: boolean;
  /** 是否启用登录页主题切换器 */
  EnableLoginThemeSwitcher?: boolean;

  // ===========================================
  // 系统设置模块配置
  // ===========================================
  /** 是否开启邮箱设置 */
  OpenSettingEmail?: boolean;
  /** 是否开启短信设置 */
  OpenSettingSms?: boolean;
  /** 是否开启 LLM 设置 */
  OpenSettingLlm?: boolean;

  // ===========================================
  // 页面行为配置
  // ===========================================
  /** 页面行为配置 */
  PageBehavior?: PageBehaviorConfig;

  // ===========================================
  // 性能配置
  // ===========================================
  /** 性能配置 */
  Performance?: PerformanceConfig;

  // ===========================================
  // WASM 加解密配置
  // ===========================================
  /** 是否启用 WASM 加解密（默认: true）
   * - true: 使用 WASM 实现的加解密算法（性能更好）
   * - false: 使用 TypeScript 实现的加解密算法
   * 注意：启用后加解密将完全使用 WASM 实现，不会降级到 TS 实现
   */
  wasmEnable?: boolean;

  // ===========================================
  // 热力图配置
  // ===========================================
  /** 用户行为热力图配置 */
  Heatmap?: HeatmapConfig;

  // ===========================================
  // 兼容旧配置（已废弃/待移除）
  // ===========================================
  /** @deprecated 使用 RouterModule 替代 */
  AutoRouter?: boolean;

  // ===========================================
  // 兼容旧配置（已废弃）
  // ===========================================
  /** @deprecated 使用Request.timeout替代 */
  baseHttpTimeout?: number;
}

/**
 * 会话配置
 */
export interface SessionConfig {
  /** 会话超时时间（秒），0表示不超时 */
  timeout?: number;
  /** 超时前提醒时间（秒） */
  warningTime?: number;
  /** 超时自动登出 */
  autoLogout?: boolean;
  /** 是否启用 */
  enable?: boolean;
}

/**
 * 请求配置
 */
export interface RequestConfig {
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 重试间隔（毫秒） */
  retryDelay?: number;
  /** 显示加载状态 */
  showLoading?: boolean;
  /** 是否启用 */
  enable?: boolean;
  /** 是否开启请求签名（x-sign），默认 true */
  enableSign?: boolean;
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerConfig {
  /** 显示错误通知 */
  showNotification?: boolean;
  /** 输出到控制台 */
  logToConsole?: boolean;
  /** 上报到服务器 */
  reportToServer?: boolean;
  /** 上报接口地址 */
  reportUrl?: string;
  /** 是否启用 */
  enable?: boolean;
}

/**
 * 页面行为配置
 */
export interface PageBehaviorConfig {
  /** 记住滚动位置 */
  rememberScroll?: boolean;
  /** 自动刷新间隔（秒），0表示不刷新 */
  autoRefreshInterval?: number;
  /** 离开页面确认 */
  confirmOnLeave?: boolean;
  /** 顶部是否显示时间 */
  showHeaderClock?: boolean;
  /** 顶部是否显示第二个时间 */
  headerClockSecondEnabled?: boolean;
  /** 顶部第二时间的时区 */
  headerClockSecondTimezone?: string;
  /** 页面缩放比例（0.8 - 1.5） */
  uiScale?: number;
  /** 读屏优化模式 */
  screenReaderMode?: boolean;
  /** 高对比度模式（独立于深色模式） */
  highContrastMode?: boolean;
  /** DevTools 精简版开关 */
  devLiteTools?: boolean;
  /** DevTools 标尺开关 */
  devRuler?: boolean;
  /** DevTools 网格开关 */
  devGrid?: boolean;
  /** DevTools 悬停检查开关 */
  devHoverInspector?: boolean;
  /** 是否启用 */
  enable?: boolean;
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
  /** 图片懒加载 */
  lazyLoadImages?: boolean;
  /** 虚拟滚动 */
  virtualScroll?: boolean;
  /** 预加载路由 */
  prefetchRoutes?: boolean;
  /** 是否启用 */
  enable?: boolean;
}

export type Effect = "light" | "dark";

/**
 * 用户行为热力图配置
 */
export interface HeatmapConfig {
  /** 是否启用热力图追踪（默认: false） */
  enable?: boolean;
  /** 采样率（0-1），1 表示全量采集（默认: 1） */
  sampleRate?: number;
  /** 上报接口地址，为空则仅本地存储 */
  reportUrl?: string;
  /** 本地最大存储条数（默认: 1000） */
  maxLocalEntries?: number;
  /** 批量上报间隔（毫秒，默认: 5000） */
  flushInterval?: number;
  /** 是否追踪点击事件（默认: true） */
  trackClick?: boolean;
  /** 是否追踪鼠标移动（默认: false，数据量大） */
  trackMouseMove?: boolean;
  /** 是否追踪滚动事件（默认: true） */
  trackScroll?: boolean;
  /** 是否显示热力图覆盖层（开发调试用，默认: false，生产环境不建议开启） */
  show?: boolean;
  /** 是否启用 AI 分析（默认: false） */
  aiAnalysis?: boolean;
  /** AI 分析接口地址（aiAnalysis=true 时生效） */
  aiAnalysisUrl?: string;
}
