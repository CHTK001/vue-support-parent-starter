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
  /** 配置加载失败时是否保持加载页面（默认false，失败后继续进入应用） */
  BlockOnConfigLoadFail?: boolean;
  /** 是否显示错误页面风格切换按钮（默认false） */
  ShowErrorPageStyleSwitcher?: boolean;
  /** 系统加载页面风格（默认minimal） */
  LoadingPageStyle?: "pixel" | "space" | "minimal" | "servererror";

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
  ErrorPageStyle?: 'pixel' | 'space' | 'minimal' | 'forbidden' | 'notfound' | 'servererror';

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
