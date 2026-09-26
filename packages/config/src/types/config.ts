/**
 * 应用配置类型（app.yaml schema）
 *
 * 所有 AppConfig 子项接口定义，运行时默认值与解析逻辑见 ../config.ts
 */

/** ConfigConfig 配置中心 */
export interface ConfigConfig {
  /** 是否启用远程配置拉取（true=启动时按 http.baseUrl + url.setting 拉取远端配置；false=仅使用本地配置） */
  enable: boolean;
}

/** AppConfig 系统信息 */
export interface AppSystemConfig {
  /** 系统名称 */
  title: string;
  /** 平台版本号 */
  version: string;
  /** 平台标识码（storage 存储前缀，防止多个 app 共用同一 key） */
  systemCode: string;
  /** 是否开启鉴权 */
  openAuth: boolean;
  /** 品牌 Logo 地址（标题栏/侧边栏展示；可空，回退内置默认） */
  logoUrl?: string;
  /** 大尺寸品牌 Logo（欢迎页横幅、关于面板；缺省时依次回退 logoUrl → favicon） */
  logoLargeUrl?: string;
  /** 浏览器 favicon 地址（可空，回退内置默认） */
  favicon?: string;
}

/** HttpConfig 请求配置 */
export interface HttpConfig {
  /** 远程 API 地址（后端接口基础路径） */
  baseUrl: string;
  /** 模块独立后端基础路径（如 device→/api/device，spider→/api/spider；缺省回退 baseUrl） */
  moduleBaseUrl: Record<string, string>;
  /** API 版本号（拼到请求 query，如 ?version=v1） */
  apiVersion: string;
  /** 是否启用请求配置 */
  enable: boolean;
  /** 请求是否加密 */
  encrypt: boolean;
  /** 请求超时时间（毫秒） */
  timeout: number;
  /** 重试次数 */
  retryCount: number;
  /** 重试间隔（毫秒） */
  retryDelay: number;
  /** 请求时显示 loading 状态 */
  showLoading: boolean;
  /** 是否启用 x-sign 防重放签名（默认 false，未配置签名头时后端跳过） */
  sign: boolean;
  /** 签名密钥（与后端 NonceSignProperties secretKey 一致） */
  signSecret: string;
  /** 401/403 时弹出确认框还是直接跳转（confirm=弹出确认框，redirect=直接跳转，默认 confirm） */
  authFailAction: "confirm" | "redirect";
  /** 响应错误提示配置（yaml 可覆盖） */
  toast: HttpToastConfig;
}

/** 响应错误提示配置 */
export interface HttpToastConfig {
  /** 是否启用统一错误提示（默认 true） */
  enable: boolean;
  /** 成功状态码（默认 "00000"，匹配即视为成功） */
  successCode: string;
  /** 校验字段：code=仅查 code，success=仅查 success，both=两者均查（默认 both） */
  field: "code" | "success" | "both";
  /** 不弹提示但依然 reject 的错误码列表（如 "session expired" 由 401 拦截器静默处理） */
  skipCodeList: string[];
}

/** StorageConfig 缓存与存储配置 */
export interface StorageConfig {
  /** 是否开启缓存加密（需同时配置 key 非空才真正加密；仅 encode=true 而 key 为空时退化为明文存储） */
  encode: boolean;
  /** 缓存加密密钥（encode 开启时必填；同时作为 prefix 为空时的命名空间前缀） */
  key: string;
  /** 存储命名空间前缀（为空时依次取 storage.key / app.systemCode，最后兜底 "system"） */
  prefix: string;
  /** 指定不添加前缀的 key（跨应用共享） */
  noPrefixKeys: string[];
  /**
   * 指定按用户隔离的 key（不同登录账号各自独立一份，不互相串数据）。
   *
   * 适用场景：
   *   - tabs / layout / user-config：用户偏好
   *   - double-second-fixed / weather-location / ai-character-messages：用户状态
   *   - map-toolbar-collapsed / re-progress-history：用户工具状态
   *
   * 拼接规则（与 prefix 配合）：
   *   - 命中 userScopeKeys 的 key → ${prefix}:${userId}:${name}
   *   - 未命中则走原规则 → ${prefix}:${name}
   *
   * 未登录时 userId 取 "anonymous"，所有游客共用一份；登录后自动隔离。
   */
  userScopeKeys: string[];
}

/** 水印配置 */
export interface WatermarkConfig {
  /** 是否开启全局水印 */
  enable: boolean;
  /** 水印文案 */
  text?: string;
  /** 水印颜色（hex，如 #409EFF） */
  color?: string;
  /** 透明度 0~1 */
  alpha?: number;
  /** 旋转角度（度） */
  rotate?: number;
}

/** 安全配置 */
export interface SecurityConfig {
  /** 百度 js 反调试（开启调试模式直接跳走） */
  baiduJs: BaiduJsConfig;
  /** 动态字体加密（防止 OCR 识别） */
  dynamicFont: {
    /** 是否启用 */
    enable: boolean;
  };
  /** OCR 混淆（页面文本混淆，防止抓取） */
  ocrObfuscation: {
    /** 是否启用 */
    enable: boolean;
  };
  /** 全局水印（默认关闭；后端 Watermark* 设置变更后由热重载联动） */
  watermark: WatermarkConfig;
}

/** 百度 js 反调试配置 */
export interface BaiduJsConfig {
  /** 是否启用 */
  enable: boolean;
  /** 外部反调试脚本地址（可选；配置后动态注入 <script> 加载，与内置监听互补） */
  url?: string;
  /** 调试模式动作：clear=清空页面 / redirect=跳转 */
  action?: "clear" | "redirect";
  /** 调试模式跳转地址（action=redirect 且为空时跳首页） */
  jumpUrl: string;
}

/** 权限配置 */
export interface PermissionConfig {
  /** 超级管理员角色标识（前端据此判断用户是否 superadmin） */
  superadmin: string;
  /** 管理员角色标识列表（命中其一即视为管理员；默认含 superadmin，保证超管同时具备管理权限） */
  admin: string[];
}

/** 令牌配置 */
export interface TokenConfig {
  /** 是否启用 token 刷新（总开关，false 时手动 refresh() 与定时刷新均不生效） */
  refresh: boolean;
  /** 是否开启 token 定时刷新（需 refresh 开启且 url.refreshToken 非空） */
  autoRefresh: boolean;
  /** accessToken 存储 key */
  accessTokenKey: string;
  /** refreshToken 存储 key */
  refreshTokenKey: string;
  /** userInfo 存储 key */
  userInfoKey?: string;
  /** 刷新间隔（毫秒） */
  refreshInterval: number;
  /** 提前刷新时间（毫秒，在过期前多久刷新） */
  advanceRefresh: number;
}

/** 国际化配置 */
export interface I18nConfig {
  /** 默认语言 */
  defaultLocale: string;
  /** 支持的语言列表 */
  locales: string[];
}

/** 用户布局配置 */
export interface LayoutConfig {
  /** 是否启用布局保存（false=不保存布局，只读模式） */
  enable?: boolean;
  /** 配置来源（local: 本地 / remote: 远程，仅 enable=true 时生效） */
  source: "local" | "remote";
}

/** 菜单配置 */
export interface MenuConfig {
  /** 父菜单只有单个子菜单时是否折叠到父级（默认 true） */
  collapseSingleChild: boolean;
  /**
   * 单根炸开：当顶级只有一个一级分组菜单时，是否把它的子菜单提升为顶级显示（默认 false）。
   * 例如顶级仅有「系统管理」时，开启后其下子菜单直接作为一级菜单，不再包一层分组。
   */
  flattenSingleRoot?: boolean;
  /** 菜单缺省图标：菜单未配置 icon 时兜底显示，避免图标位空白（默认 koi-text-menu） */
  defaultIcon?: string;
  /**
   * 折叠时整个菜单是否收缩为一个按钮（默认 false）。
   *
   * - false：折叠后显示 mini 图标菜单条（Element Plus 默认行为）
   * - true：折叠后不渲染菜单，只保留一个「展开菜单」按钮，点击恢复完整菜单
   *
   * 仅垂直布局（layout=vertical）生效；支持 app.yaml 与顶部设置抽屉（可持久化）。
   */
  collapseToButton?: boolean;
}

/** 上传配置 */
export interface UploadConfig {
  /** 是否启用上传（false=关闭上传能力） */
  enable: boolean;
  /** 单个文件大小上限（字节） */
  maxSize: number;
  /** 允许的文件扩展名 */
  accept: string[];
}

/** UrlConfig 接口地址（集中管理，改接口只改这里，调用方无需感知实现） */
export interface UrlConfig {
  /** 登录接口 */
  login: string;
  /** 登出接口 */
  logout: string;
  /** 当前用户信息接口 */
  me: string;
  /** 刷新 token 接口 */
  refreshToken: string;
  /** 验证码接口 */
  captcha: string;
  /** 默认配置接口（登录页/首页拉取后端配置合并到 getConfig） */
  setting: string;
  /** 远程菜单接口 */
  menu: string;
  /** 用户布局接口（GET/PUT /v2/user/layout，获取/保存用户布局并缓存） */
  layout: string;
  /** 文件上传接口（GET/POST，如 /v2/file/upload） */
  upload: string;
  /** 短信验证码发送接口 */
  smsSend: string;
  /** 短信验证码登录接口 */
  smsLogin: string;
  /** 邮箱验证码发送接口 */
  emailSend: string;
  /** 邮箱验证码登录接口 */
  emailLogin: string;
}

/** 环境配置 */
export interface EnvConfig {
  /** 当前环境（dev / test / prod） */
  env: "dev" | "test" | "prod";
}

/** 系统配置 */
export interface SystemConfig {
  /** 是否显示消息组件 */
  showMessage: boolean;
  /** 是否显示配置组件 */
  showConfig: boolean;
  /** 是否显示日志组件 */
  showLog: boolean;
  /** 是否显示监控组件 */
  showMonitor: boolean;
}

/** 加密配置 */
export interface CryptoConfig {
  /** wasm 加密模块地址 */
  wasmUrl: string;
  /** 默认加密算法（aes / sm2 / sm3 / sm4） */
  algorithm: string;
}

/** 登录页功能特性标签 */
export interface LoginFeatureTag {
  /** icon 名称（element-plus / unocss icon） */
  icon: string;
  /** 显示文案 */
  text: string;
}

/** 登录页配置 */
export interface LoginConfig {
  /** 是否启用图形验证码 */
  captcha: boolean;
  /** 是否启用 OTP 动态口令（TOTP，6 位数字） */
  otp: boolean;
  /** 是否启用滑块验证（前端滑动校验） */
  slider: boolean;
  /** 品牌名（登录页 / 浏览器标题） */
  brandName: string;
  /** 品牌 Logo（登录页左上角/品牌区） */
  logoUrl: string;
  /** 默认用户头像（无头像时使用，GitHub/图床 URL） */
  avatarUrl: string;
  /** 欢迎语 */
  welcome: string;
  /** 主标题 */
  title: string;
  /** 描述（副标题下方） */
  description: string;
  /** 左侧大图（kf 介绍图） */
  imageUrl: string;
  /** 功能特性标签 */
  featureTags: LoginFeatureTag[];
  /** 备案号；为空串则不显示备案区域 */
  beiAnHao: string;
}

/** 路由模式：static=静态路由写死 / module=按 page 模块装配 / remote=后端菜单接口返回 */
export type RouteMode = "static" | "module" | "remote" | "all";

/** 路由配置 */
export interface RouteConfig {
  /** 路由模式（static / module / remote / all） */
  mode: RouteMode;
  /**
   * 远程菜单接口地址（mode=remote 时生效）。
   * 等价于 urlConfig.menu：getMenu() 实际拉取使用 urlConfig.menu（见 core/api）。
   * 此字段冗余保留，两者不一致时以 urlConfig.menu 为准。
   */
  remoteUrl: string;
  /** 远程基础上是否合并本地静态路由（mode=remote 时生效） */
  mergeLocalMenu: boolean;
  /** 本地业务路由模块路径（mode=module 时生效，对应 monorepo pages 模块） */
  modulePaths: string[];
  /** 远程菜单允许的路径前缀白名单（为空不过滤；命中保留，未命中过滤） */
  allowPrefixes: string[];
  /** 无需登录即可访问的路由白名单 */
  whiteList: string[];
  /** 登录页路径 */
  loginPath: string;
  /** 首页路径（layout 重定向目标） */
  homePath: string;
  /** 个人中心路径（layout 子路由，主题提供 mine 组件时生效） */
  personagePath: string;
  /** 404 路径 */
  notFoundPath: string;
  /** 403 路径 */
  forbiddenPath: string;
  /** 500 路径 */
  serverErrorPath: string;
}

/**
 * 业务能力开关表
 *
 * 键为能力 key（见 @repo/core 的 BACKEND_CAPABILITIES 注册表），值为是否启用：
 *   - true / 未配置：启用。前端按注册表探测后台接口，命中走后台，未命中回落三方；
 *   - false：停用。不发探测/不请求后台接口（避免无谓 404），对应入口一并隐藏。
 *
 * 键是开放的：注册表新增能力后 app.yaml 直接写同名键即可，无需改本类型。
 */
export type CapabilityConfig = Record<string, boolean>;

/** 其它配置 */
export interface OtherConfig {
  /** 主题（default / koi） */
  themeId: string;
  /** 日志级别（trace / debug / info / warn / error，默认 info） */
  logLevel: string;
  /** 主题配置抽屉关闭是否二次确认（默认 false 直接关闭） */
  themeConfigCloseConfirm: boolean;
  /** 状态颜色（与主题色一致的基础色，用于按钮/标签等状态组件） */
  statusColors: StatusColorConfig;
  /** 业务能力开关（app.yaml other.capabilities；关闭后不探测不请求，抽屉里不再显示该项） */
  capabilities: CapabilityConfig;
  /** 框架组件显隐开关（Header 工具栏 / 布局组件） */
  toolbar: ToolbarConfig;
  /** 顶部计时器（@repo/work 定时器 Worker，多时区最多 3 个，UTC ±12） */
  timer: TimerConfig;
  /** 天气配置（Open-Meteo 免费 API，enable 显隐，经纬度定位，默认每小时缓存） */
  weather: WeatherConfig;
  /** 大屏配置（顶栏入口 + 独立路由 URL，开启后顶栏显示大屏图标、菜单注入大屏路由） */
  bigscreen: BigscreenConfig;
  /** 无障碍配置（读屏优化 / 高对比度 / 语音朗读） */
  accessibility: AccessibilityConfig;
  /** 开发工具配置（标尺 / 网格 / 悬停检查，仅开发/测试环境） */
  devTools: DevToolsConfig;
  /** 热力图配置（用户点击热点覆盖层，仅开发/测试环境） */
  heatmap: HeatmapConfig;
  /** 性能监控配置（FPS / 内存 / CPU 等，实时指标悬浮） */
  performance: PerformanceConfig;
  /** AI 对话配置（webllm 本地推理 / vendor 厂商 API） */
  aiChat: AiChatConfig;
  /** 首页配置 */
  home: HomeConfig;
  /** 头像框配置 */
  avatarFrame: AvatarFrameConfig;
}

export interface AvatarFrameConfig {
  /** 是否启用头像框功能（默认 false） */
  enable: boolean;
}

/** 首页配置 */
export interface HomeConfig {
  /** 首页右侧自定义布局按钮（默认开启） */
  customLayoutButton: boolean;
}

/** 状态颜色配置 */
export interface StatusColorConfig {
  /** 成功色 */
  success: string;
  /** 警告色 */
  warning: string;
  /** 危险色 */
  danger: string;
  /** 信息色 */
  info: string;
}

/** 框架组件显隐开关（Header 工具栏等） */
export interface ToolbarConfig {
  /** 搜索菜单 */
  searchMenu: boolean;
  /** 路由缓存刷新 */
  refresh: boolean;
  /** 明亮/暗黑模式切换 */
  dark: boolean;
  /** 语言翻译切换 */
  language: boolean;
  /** 全屏切换 */
  fullScreen: boolean;
  /** 主题配置入口 */
  themeSetting: boolean;
  /** 用户信息下拉 */
  user: boolean;
  /** 用户下拉子项显隐（个人中心 / 锁屏 / 设置） */
  userMenu: {
    /** 个人中心 */
    personalCenter: boolean;
    /** 锁屏 */
    lock: boolean;
    /** 设置 */
    settings: boolean;
  };
  /** 面包屑导航 */
  breadcrumb: boolean;
  /** 面包屑子级下拉（有子菜单时显示下拉箭头/菜单） */
  breadcrumbDropdown: boolean;
  /** 面包屑显示图标 */
  breadcrumbIcon: boolean;
  /** 标签页（Tabs）显示图标 */
  tabIcon: boolean;
  /** Logo（图片 + 品牌文字）显示 */
  logo: boolean;
  /** 站内消息（铃铛徽标） */
  message: boolean;
  /** 全局公告条（活跃公告横幅，数据来自平台 /v2/announcement/active） */
  announcement: boolean;
  /** 顶栏天气组件 */
  weather: boolean;
  /** 顶栏台风组件 */
  typhoon: boolean;
  /** 工具栏默认折叠（true=折叠只显示头像，false=展开显示全部图标） */
  collapse: boolean;
}

/** 顶部计时器配置 */
export interface TimerConfig {
  /** 是否启用顶部计时器（Header 工具栏右侧，@repo/work Worker 驱动） */
  enable: boolean;
  /** 展示时区（UTC 偏移小时，-12 ~ +12，最多 3 个；空数组仅显示本地时间） */
  zones: number[];
}

/** 天气配置 */
export interface WeatherConfig {
  /** 是否启用在头部工具栏显示天气 */
  enable: boolean;
  /** 纬度（0 表示未配置，此时优先使用浏览器定位，定位失败则隐藏天气） */
  latitude: number;
  /** 经度（0 表示未配置，此时优先使用浏览器定位，定位失败则隐藏天气） */
  longitude: number;
  /** 城市名称显示（默认 "本地"） */
  city: string;
}

/**
 * 大屏配置（DataV / 业务自建大屏）
 *
 * 开启后：
 *   - 顶栏 Header 显示大屏图标入口
 *   - 路由表注入独立大屏路由（默认 /bigscreen，独立窗口打开）
 *   - 大屏页面鉴权遵循路由白名单（routeConfig.whiteList）
 */
export interface BigscreenConfig {
  /** 是否启用大屏功能（顶栏入口 + 路由注入） */
  enable: boolean;
  /** 大屏路由路径（默认 /bigscreen；可改为子路径如 /datav/main） */
  url: string;
  /** 大屏在新窗口打开时的 windowFeatures（默认 "width=1920,height=1080"） */
  windowFeatures: string;
}

/** 无障碍配置 */
export interface AccessibilityConfig {
  /** 是否在设置面板显示无障碍分区（默认 true） */
  enable: boolean;
  /** 读屏优化模式：为视障用户优化焦点高亮和可读性 */
  screenReaderMode: boolean;
  /** 高对比度模式：提高文字与背景对比度，独立于深色模式 */
  highContrastMode: boolean;
  /** 语音朗读：焦点移入元素时自动朗读内容（依赖 SpeechSynthesis API） */
  voiceReadEnabled: boolean;
}

/** 开发工具配置（仅开发/测试环境） */
export interface DevToolsConfig {
  /** 是否在设置面板显示 DevTools 分区（默认 true，仅 dev/test 生效） */
  enable: boolean;
  /** 轻量调试总开关：显示标尺、网格和悬停信息等调试辅助 */
  devLiteTools: boolean;
  /** 标尺：在顶部和左侧显示像素标尺 */
  devRuler: boolean;
  /** 网格：显示布局网格辅助对齐 */
  devGrid: boolean;
  /** 悬停检查：悬停显示元素标签、类名和尺寸 */
  devHoverInspector: boolean;
  /** 系统调试：集成 eruda（移动端调试控制台） */
  debugEruda: boolean;
}

/** 热力图配置（仅开发/测试环境） */
export interface HeatmapConfig {
  /** 是否在设置面板显示热点工具分区（默认 true，仅 dev/test 生效） */
  enable: boolean;
  /** 热力图覆盖层：记录用户点击热点，以热力图形式覆盖展示 */
  devHeatmap: boolean;
}

/** 性能监控配置 */
export interface PerformanceConfig {
  /** 是否在设置面板显示性能监控分区（默认 true） */
  enable: boolean;
  /** FPS 监控：衡量页面流畅度，60FPS 为最佳 */
  fpsMonitorEnabled: boolean;
  /** 内存监控：当前页面使用的 JS 堆内存（仅 Chrome/Edge 有效） */
  memoryMonitorEnabled: boolean;
  /** CPU 监控：基于主线程帧间隔估算的负载值（非系统真实 CPU） */
  cpuMonitorEnabled: boolean;
  /** 带宽监控：显示当前页面网络请求的传输速率 */
  bandwidthMonitorEnabled: boolean;
  /** 电池监控：显示电池电量和充电状态 */
  batteryMonitorEnabled: boolean;
  /** 蓝牙监控：显示蓝牙功能可用性 */
  bluetoothMonitorEnabled: boolean;
  /** 屏幕监控：显示屏幕分辨率 */
  screenMonitorEnabled: boolean;
  /** 显示位置 */
  performanceMonitorPosition:
    | "top-left"
    | "top-center"
    | "top-right"
    | "left-center"
    | "right-center"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  /** 内容展示模式：detailed=详细 / simple=简洁 / minimal=极简 */
  performanceMonitorMode: "detailed" | "simple" | "minimal";
  /** 布局模式：merged=合并 / split=分离 */
  performanceMonitorLayout: "merged" | "split";
  /** 布局方向：auto=自动 / vertical=垂直 / horizontal=水平 */
  performanceMonitorDirection: "auto" | "vertical" | "horizontal";
}

/** AI 对话配置 */
export interface AiChatConfig {
  /** 是否在设置面板显示 AI 对话分区（默认 true） */
  enable: boolean;
  /** AI 助手显示开关：控制页面悬浮 AI 助手入口是否显示 */
  aiChatEnabled: boolean;
  /** 运行模式：webllm=浏览器本地推理 / vendor=厂商 API */
  aiChatMode: "webllm" | "vendor";
  /** WebLLM 模型 ID（如 Qwen2.5-1.5B-Instruct-q4f16_1-MLC） */
  aiChatModel: string;
  /** WebLLM 可选模型列表（yaml 可配，覆盖内置默认模型） */
  webllmModels: { label: string; value: string; image?: string }[];
  /** 厂商名称（openai / deepseek / custom 等） */
  aiChatVendor: string;
  /** 厂商 API Key */
  aiChatApiKey: string;
  /** 厂商 API URL */
  aiChatApiUrl: string;
  /** 最大生成 token 数 */
  aiChatMaxTokens: number;
  /** 温度参数（0~2） */
  aiChatTemperature: number;
  /** 上下文消息条数上限（10~500） */
  aiChatContextLimit: number;
  /** 自动总结阈值百分比（50~100） */
  aiChatSummaryThreshold: number;
  /** 是否启用第 N 轮压缩：达到阈值后，将历史消息压缩为摘要，并保留最近 N 轮原始对话 */
  aiChatSummaryEnabled: boolean;
  /** 第 N 轮压缩：保留最近 N 轮原始对话（1~50），其余压缩为摘要 */
  aiChatSummaryRetainRounds: number;
  /** AI 助手形象：2d=图标/渐变皮肤，3d=GLB 模型 */
  aiChatCharacter: "2d" | "3d";
  /** 3D 形象 GLB 模型地址 */
  aiChatModelUrl: string;
  /** AI 助手形象尺寸（px） */
  aiChatCharacterSize: number;
  /** AI 助手皮肤：default / http(s) 图片 / 预设渐变名（cat/ocean/forest/sunset/night） */
  aiChatSkin?: string;
}

/** Socket 协议类型（多协议统一管理） */
export type SocketProtocol = "socketio" | "websocket" | "sse";

/** Socket 连接配置 */
export interface SocketConfig {
  /** 是否启用 */
  enable: boolean;
  /** 协议类型（socketio / websocket / sse） */
  protocol: SocketProtocol;
  /** 服务器地址列表（逗号分隔，支持多个；为空时回退到后端 BaseUrl/当前源） */
  urls: string;
  /** Socket.IO 上下文路径（协议=socketio 时生效，默认 /socket.io） */
  context: string;
  /** WebSocket/SSE 路径（协议=websocket/sse 时生效） */
  path: string;
  /** 查询参数（附加到连接 URL） */
  query: Record<string, string>;
  /** 自动连接（默认 true） */
  autoConnect: boolean;
  /** 自动重连（默认 true） */
  reconnection: boolean;
  /** 重连尝试次数（默认 3） */
  reconnectionAttempts: number;
  /** 重连延迟毫秒（默认 1000） */
  reconnectionDelay: number;
  /** 心跳间隔毫秒（WebSocket 专用，默认 30000） */
  heartbeatInterval: number;
  /** 传输方式（socketio 专用，如 ["websocket","polling"]） */
  transports: string[];
}

/** 消息通知配置 */
export interface MessageConfig {
  /** 消息展示位置：right-bottom=右下角浮窗 / toolbar=顶栏铃铛 / hidden=全部隐藏 */
  position: "right-bottom" | "toolbar" | "hidden";
  /** 顶栏消息未读数量上限 */
  maxUnread: number;
  /** 是否依赖 Socket 实时推送（false 时仅 HTTP 拉取） */
  socket: boolean;
  /** 是否开启站内消息 HTTP 查询（拉历史/未读/已读）：
   *  - true：开启查询
   *  - false：关闭查询，仅保留 Socket 实时推送
   *  - 缺省（undefined）：跟随 app.openAuth —— openAuth=true（后端正常）时开启，
   *    否则静默跳过，避免未就绪后端拖慢初始化 */
  query?: boolean;
  /** 站内消息查询接口路径 */
  listUrl: string;
  /** 未读数查询接口路径 */
  unreadUrl: string;
  /** 已读（游标）接口路径 */
  readUrl: string;
}

/** 全局异常监控配置 */
export interface MonitorConfig {
  /** 是否启用全局异常监控（false=不采集不上报，跳过监听注册与 Worker 创建） */
  enable: boolean;
  /** 异常上报服务端接口路径（相对路径基于 http.baseUrl；为空=仅本地统计订阅，不上报服务端） */
  reportUrl: string;
  /** 单批上报条数上限（缓冲达到该数量即触发上报） */
  batchSize: number;
  /** 批量上报节流间隔（毫秒，防止高频错误频繁上报） */
  reportInterval: number;
  /** 去重窗口（毫秒，同一窗口内相同错误只记录一次并累计次数） */
  dedupWindow: number;
  /** 采样率 0~1（1=全量采集，用于高峰期降噪） */
  sampleRate: number;
  /** 缓冲上限（超出丢弃最旧，防止内存无限增长） */
  maxBuffer: number;
  /** 采集 JS 运行时异常（window.error / error 事件） */
  captureJsError: boolean;
  /** 采集未处理的 Promise 拒绝（unhandledrejection） */
  captureRejection: boolean;
  /** 采集资源加载失败（script/img/link 等 onerror） */
  captureResource: boolean;
}

/** 应用配置（app.yaml schema） */
export interface AppConfig {
  /** 配置中心（远程配置开关） */
  config: ConfigConfig;
  /** 系统信息 */
  app: AppSystemConfig;
  /** 权限配置 */
  permission: PermissionConfig;
  /** 令牌配置 */
  token: TokenConfig;
  /** 国际化配置 */
  i18n: I18nConfig;
  /** 用户布局配置 */
  layout: LayoutConfig;
  /** 菜单配置 */
  menu: MenuConfig;
  /** 上传配置 */
  upload: UploadConfig;
  /** 接口地址 */
  url: UrlConfig;
  /** 环境配置 */
  env: EnvConfig;
  /** 系统配置 */
  system: SystemConfig;
  /** 请求配置 */
  http: HttpConfig;
  /** 缓存与存储配置 */
  storage: StorageConfig;
  /** 安全配置 */
  security: SecurityConfig;
  /** 加密配置 */
  crypto: CryptoConfig;
  /** 登录页配置 */
  login: LoginConfig;
  /** 路由配置 */
  route: RouteConfig;
  /** Socket 连接配置（多协议统一管理） */
  socket: SocketConfig;
  /** 消息通知配置 */
  message: MessageConfig;
  /** 全局异常监控配置 */
  monitor: MonitorConfig;
  /** 其它配置 */
  other: OtherConfig;
}