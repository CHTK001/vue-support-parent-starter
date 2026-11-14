/**
 * 框架无关的配置纯函数共享模块
 *
 * 本模块只包含**不依赖 vue reactive** 的纯函数 / 纯数据，
 * 供 Vue 与 React 两侧共享（React 可安全 import，不会触发 vue 依赖）。
 *
 * 允许依赖：node / js-yaml / @repo/assets 等原生库。
 * 禁止依赖：vue（不得 import from 'vue'）。
 *
 * 含 vue 依赖的状态逻辑（currentConfig、setConfig、useAppConfig、watch 等）
 * 仍保留在 ./config.ts，不会进入本模块。
 */
import { load as parseYaml } from "js-yaml";
import type { AppConfig } from "./types/config";
import { DEFAULT_MENU_ICON } from "./constants";

/** AppConfig 顶层字段名（用于 yaml 键去 Config 后缀的映射白名单） */
export const APP_CONFIG_TOP_KEYS = new Set([
  "config",
  "app",
  "permission",
  "token",
  "i18n",
  "layout",
  "menu",
  "upload",
  "url",
  "env",
  "system",
  "http",
  "storage",
  "security",
  "crypto",
  "login",
  "route",
  "socket",
  "message",
  "apm",
  "monitor",
  "other",
]);

function lowerFirst(key: string): string {
  return key ? key.charAt(0).toLowerCase() + key.slice(1) : key;
}

/**
 * 归一化 app.yaml 顶层键：
 *  1. 首字母转小写（AppConfig / appConfig → appConfig）
 *  2. 去掉 Config 后缀（appConfig → app，与 AppConfig 接口字段对齐）
 *  仅对顶层键生效，嵌套对象键保持原样。
 */
export function normalizeTopKey(key: string): string {
  const lowered = lowerFirst(key);
  const withoutSuffix = lowered.replace(/Config$/i, "");
  if (APP_CONFIG_TOP_KEYS.has(withoutSuffix.toLowerCase())) {
    return withoutSuffix;
  }
  return lowered;
}

/** 把 yaml 解析出的对象键首字母转小写（只处理一层，嵌套对象键本就小写） */
function normalizeKeys(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    result[normalizeTopKey(key)] = data[key];
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

/**
 * 取应用 base（vite `import.meta.env.BASE_URL`，末位不带斜杠）。
 *
 * 共享静态目录是根 public（createVite 的 `SHARED_PUBLIC_DIR`），**挂在 base 之下**，
 * 所以默认配置里指向静态资源的路径（/wasm/...、/assets/...）必须拼上 base：
 * base="/system/" 的应用（vue-support-system-starter）用绝对路径会 404。
 *
 * 本模块是 Vue / React 共享的纯数据模块，非 vite 环境下 import.meta.env 不存在，
 * 此时回退 "/"（与原先写死绝对路径的行为一致）。
 * 注意：只用于**静态资源**路径，后端接口路径（/v2/...）不要走这里。
 */
function assetBase(): string {
  // 必须是字面量 import.meta.env：vite 按该文本做常量替换，写成可选链会替换不到
  const env = (import.meta as unknown as { env: { BASE_URL?: string } }).env;
  return (env?.BASE_URL ?? "/").replace(/\/+$/, "");
}

/** 拼接静态资源默认路径（带 base） */
function asset(path: string): string {
  return `${assetBase()}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** 默认配置（没有 app.yaml 时全部走默认） */
export const defaultAppConfig: AppConfig = {
  config: {
    enable: true,
  },
  app: {
    title: "应用",
    version: "0.7.0",
    systemCode: "system",
    openAuth: true,
  },
  permission: {
    superadmin: "SUPER_ADMIN",
    admin: ["ADMIN", "SUPER_ADMIN"],
  },
  token: {
    refresh: false,
    autoRefresh: false,
    accessTokenKey: "accessToken",
    refreshTokenKey: "refreshToken",
    userInfoKey: "userInfo",
    refreshInterval: 300000,
    advanceRefresh: 60000,
  },
  i18n: {
    defaultLocale: "zh-CN",
    locales: ["zh-CN", "en-US"],
  },
  layout: {
    source: "local",
  },
  menu: {
    collapseSingleChild: true,
    // 单根炸开默认关闭：保持「系统管理」二级分组，不自动提升子菜单
    flattenSingleRoot: false,
    // 菜单缺省图标：菜单未配置 icon 时兜底，避免图标位空白
    defaultIcon: DEFAULT_MENU_ICON,
    // 折叠形态：menuConfig.collapse（迭代自 collapseToButton，废弃 warning 见 resolveMenuCollapse）
    // showButton=false + showBar=yes（默认）：折叠后只显示 mini 图标菜单条
    // showButton=true + showBar=no             ：折叠后菜单区只保留一个「展开菜单」按钮
    // showButton=true + showBar=yes           ：mini 菜单条 + 展开按钮（两者都留）
    // showButton=false + showBar=no           ：折叠后侧边栏整体隐藏（主内容区铺满）
    collapse: {
      showButton: false,
      showBar: "yes",
    },
    // 旧折叠开关（已迁移到 collapse，由 resolveMenuCollapse 做向下兼容映射）
    // 保持 false 默认是为了不改变存量应用的渲染行为
    collapseToButton: false,
    // 分组导航增强：分组标题排版 + 子项图标 + 底部「设置」条目（仅纵向布局），默认开启
    groupNav: true,
    // 侧边栏底部入口：默认与历史行为完全一致 —— 单个「设置」条目、跳 /system/config、仅管理员。
    // 但要显式写出来，否则新增的 footer 配置项缺省会变成"没有条目"→ 存量应用丢掉这个入口。
    footer: {
      enable: true,
      label: "设置",
      icon: "Setting",
      entries: [
        {
          key: "systemConfig",
          label: "设置",
          icon: "Setting",
          mode: "route",
          path: "/system/config",
          admin: true,
        },
      ],
    },
  },
  upload: {
    enable: true,
    maxSize: 10485760,
    accept: [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".zip"],
  },
  url: {
    login: "/v2/user/login",
    logout: "/v2/user/logout",
    me: "/v2/user/me",
    refreshToken: "/v2/user/refresh-token",
    captcha: "/v1/captcha",
    setting: "/v2/setting/default",
    menu: "/v2/user/menu",
    layout: "/v2/user/layout",
    upload: "/v2/file/upload",
    smsSend: "/v2/sms/send",
    smsLogin: "/v2/sms/login",
    emailSend: "/v2/email/send",
    emailLogin: "/v2/email/login",
    // 调度治理出口：默认给采集控制台（@Ignore 控制台出口）。
    // 接了平台统一认证的宿主（如系统管理应用）要在自己的 app 配置里覆盖成 /v2/job，
    // 否则 pages/job 的列表/保存/触发会全部 404。
    jobApi: "/v2/scheduler",
  },
  env: {
    env: "dev",
  },
  system: {
    showMessage: true,
    showConfig: true,
    showLog: true,
    showMonitor: true,
  },
  http: {
    baseUrl: "",
    moduleBaseUrl: {},
    apiVersion: "",
    enable: true,
    encrypt: false,
    timeout: 10000,
    retryCount: 0,
    retryDelay: 1000,
    // 缺省不驱动顶部进度条：绝大多数请求（筛选、刷新、轮询、后台拉取）应当是静默的，
    // 由页面自己的加载动画表达；顶栏只留给「切换菜单 / 打开页面」的路由跳转。
    // 个别确实需要遮罩/顶栏的请求，链式调用 `.loading(true)` 单独打开即可。
    showLoading: false,
    sign: false,
    signSecret: "",
    authFailAction: "confirm",
    toast: {
      enable: true,
      successCode: "00000",
      field: "both",
      skipCodeList: [],
    },
    requestCodec: {
      enable: false,
      key: "",
      type: "aes",
    },
  },
  storage: {
    encode: true,
    key: "2XNN4K8LC0ELVWN4",
    prefix: "",
    noPrefixKeys: [],
    userScopeKeys: [
      // 用户偏好与状态（不同账号各自独立一份，不互相串数据）
      "tabs",
      "layout",
      "user-config",
      // 改名后的用户可调配置快照（user-config 只用于丢弃旧数据），同样按账号隔离
      "user-config.v2",
      "global",
      "double-second-fixed",
      "weather-location",
      "weather-cache",
      "map-toolbar-collapsed",
      "ai-character-messages",
      "ai-character-pos",
      "re-progress-history",
      "re-progress-settings",
    ],
  },
  security: {
    baiduJs: {
      enable: false,
      url: "",
      action: "clear",
      jumpUrl: "",
    },
    dynamicFont: {
      enable: false,
    },
    ocrObfuscation: {
      enable: false,
    },
    watermark: {
      enable: false,
    },
  },
  crypto: {
    wasmUrl: asset("/wasm/crypto-wasm.js"),
    algorithm: "aes",
  },
  login: {
    // 登录类型：默认只有普通登录一种。配了多项时登录页会渲染选择卡片，
    // 选中项决定登录请求发往哪个 baseUrl（见 LoginTypeConfig）。
    types: [
      {
        type: "web",
        title: "普通登录",
        description: "使用平台账号登录",
        icon: "User",
        baseUrl: "",
      },
    ],
    captcha: true,
    otp: false,
    slider: false,
    // 滑块验证形态：simple=原有向右拖动滑块；puzzle=图片拼图滑块
    sliderType: "simple",
    // 拼图滑块参数（sliderType=puzzle 时生效；不配则自动生成占位图）
    sliderPuzzle: {
      slots: 4,
      tolerance: 20,
    },
    brandName: "应用",
    // 登录认证形态：redirect=401/403 直接跳登录页（默认） / dialog=不跳转，在当前应用内弹出强制登录弹窗
    accessMode: "redirect",
    // 留空：Logo 组件改用 `import` 内置 logo（经 Vite 处理，内联/带 hash，保证可加载），
    // 避免运行时字符串路径 /assets/images/logo/logo.svg 未被构建到 dist 而 404。
    // 业务仍可在 app.yaml 配置 logoUrl 自定义覆盖。
    logoUrl: "",
    avatarUrl: "",
    welcome: "欢迎登录",
    title: "应用",
    description: "",
    imageUrl: asset("/assets/images/login/science.png"),
    featureTags: [
      { icon: "DataAnalysis", text: "高效管理" },
      { icon: "Brush", text: "现代设计" },
      { icon: "Lock", text: "安全可靠" },
    ],
    beiAnHao: "",
  },
  route: {
    mode: "static",
    // 远程菜单接口地址：等价于 urlConfig.menu（getMenu() 实际使用 urlConfig.menu），
    // 此字段冗余保留，两者不一致时以 urlConfig.menu 为准
    remoteUrl: "",
    mergeLocalMenu: false,
    modulePaths: [],
    allowPrefixes: [],
    // /prometheus/embed/**：Prometheus 自定义看板的免登录嵌入页（其他系统 iframe 使用）
    // /nginx/embed/**：Nginx 自定义看板的免登录嵌入页（其他系统 iframe 使用）
    // /edu/student-login：学生登录页，学生没有后台账号，未登录直开必须能停留
    whiteList: ["/login", "/403", "/404", "/500", "/prometheus/embed/**", "/nginx/embed/**", "/edu/student-login"],
    loginPath: "/login",
    homePath: "/home",
    // 与其它 route 路径一致：这是 router 路径，不含 vite base（base=/system 时浏览器地址是 /system/personage）。
    // 写成 "/system/personage" 会注册出 /system/system/personage，直接访问或 F5 个人中心即命中 404 兜底。
    personagePath: "/personage",
    notFoundPath: "/404",
    forbiddenPath: "/403",
    serverErrorPath: "/500",
  },
  socket: {
    enable: false,
    protocol: "sse",
    urls: "",
    // socketio 上下文路径。SocketConfig.context 为必填字段，
    // 缺省值必须与 socket.io 客户端默认值一致，否则协议切到 socketio 时会拼出错误路径。
    context: "/socket.io",
    // SSE 连接路径（协议=sse 时生效）。后端 SseSocketController 的端点是
    // POST /sse/connect；写成 /sse 会稳定 404。只认旧 GET /sse 的部署可在 app.yaml 覆盖。
    path: "/sse/connect",
    query: {},
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    heartbeatInterval: 0,
    transports: [],
  },
  message: {
    position: "toolbar",
    maxUnread: 99,
    socket: true,
    listUrl: "/v2/message/sys-message/page",
    unreadUrl: "/v2/message/sys-message/unread-count",
    readUrl: "/v2/message/sys-message/read",
  },
  apm: {
    // 默认开启：装了 APM 后端就该看得见；没装时 ApmGate 会渲染降级视图，
    // 因此 enable 控制的是「菜单是否出现」，不是「后端有没有」。
    enable: true,
    engine: "",
    baseUrl: "/api/apm/v1",
    statusTtl: 15000,
  },
  monitor: {
    enable: false,
    reportUrl: "/v2/log/report",
    batchSize: 20,
    reportInterval: 5000,
    dedupWindow: 60000,
    sampleRate: 1,
    maxBuffer: 200,
    captureJsError: true,
    captureRejection: true,
    captureResource: true,
  },
  other: {
    themeId: "koi",
    logLevel: "info",
    themeConfigCloseConfirm: false,
    statusColors: {
      success: "#67C23A",
      warning: "#E6A23C",
      danger: "#F56C6C",
      info: "#909399",
    },
    // 业务能力开关：默认全部启用（保持"探测后台 → 未命中回落三方"的既有行为）。
    // 后端确实没有该接口的应用，在 app.yaml 里写 false 即可彻底不发探测请求。
    capabilities: {
      weather: true,
      location: true,
      // 台风默认关闭：没显式开放时既不探测接口，也不显示顶栏入口
      typhoon: false,
      exchangeRate: true,
      ipLookup: true,
      holiday: true,
    },
    toolbar: {
      searchMenu: true,
      refresh: true,
      dark: true,
      language: true,
      fullScreen: true,
      themeSetting: true,
      user: true,
      userMenu: {
        personalCenter: true,
        lock: true,
        settings: false,
      },
      breadcrumb: true,
      breadcrumbDropdown: true,
      breadcrumbIcon: true,
      tabIcon: true,
      logo: true,
      message: true,
      // 顶部便签默认不固定显示：需要时在 app.yaml 里显式打开
      quickNote: false,
      quickNoteConfirm: true,
      announcement: true,
      weather: true,
      // 汇率默认不开启：需要时在 app.yaml 里显式打开
      exchangeRate: false,
      // 台风默认不开启：需要时在 app.yaml 里显式打开
      typhoon: false,
      collapse: true,
      // 空数组 = 沿用框架固有顺序（各 app.yaml 不配该项时行为完全不变）
      items: [],
    },
    timer: {
      enable: false,
      zones: [],
    },
    weather: {
      enable: true,
      latitude: 0,
      longitude: 0,
      city: "",
    },
    exchangeRate: {
      // 一篮子主流货币对（USD 为本位，frankfurter 按 from=USD&to=... 一次拉满）
      symbols: ["USD/EUR", "USD/GBP", "USD/JPY", "USD/CNY", "USD/HKD", "USD/SGD"],
    },
    // 贵金属行情：默认关闭。数据源是三方 api.gold-api.com，没开放就不该去请求
    metals: {
      enable: false,
    },
    bigscreen: {
      enable: false,
      url: "/bigscreen",
      windowFeatures: "width=1920,height=1080",
    },
    accessibility: {
      enable: true,
      screenReaderMode: false,
      highContrastMode: false,
      voiceReadEnabled: false,
    },
    devTools: {
      enable: true,
      devLiteTools: false,
      devRuler: false,
      devGrid: false,
      devHoverInspector: false,
      debugEruda: false,
    },
    heatmap: {
      enable: true,
      devHeatmap: false,
    },
    performance: {
      enable: true,
      fpsMonitorEnabled: false,
      memoryMonitorEnabled: false,
      cpuMonitorEnabled: false,
      bandwidthMonitorEnabled: false,
      batteryMonitorEnabled: false,
      bluetoothMonitorEnabled: false,
      screenMonitorEnabled: false,
      performanceMonitorPosition: "top-left",
      performanceMonitorMode: "detailed",
      performanceMonitorLayout: "split",
      performanceMonitorDirection: "auto",
    },
    aiChat: {
      enable: true,
      aiChatEnabled: false,
      aiChatMode: "webllm",
      aiChatModel: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
      webllmModels: [
        { label: "Qwen2.5-1.5B-Instruct（推荐·轻量）", value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", image: asset("/assets/models/qwen-color.svg") },
        { label: "Qwen2.5-3B-Instruct（中等）", value: "Qwen2.5-3B-Instruct-q4f16_1-MLC", image: asset("/assets/models/qwen-color.svg") },
        { label: "Llama-3.2-1B-Instruct（轻量）", value: "Llama-3.2-1B-Instruct-q4f16_1-MLC", image: asset("/assets/models/meta-color.svg") },
        { label: "Llama-3.2-3B-Instruct（中等）", value: "Llama-3.2-3B-Instruct-q4f16_1-MLC", image: asset("/assets/models/meta-color.svg") },
        { label: "Phi-3.5-mini-instruct（中等）", value: "Phi-3.5-mini-instruct-q4f16_1-MLC", image: asset("/assets/models/microsoft-color.svg") },
        { label: "gemma-2-2b-it（中等）", value: "gemma-2-2b-it-q4f16_1-MLC", image: asset("/assets/models/gemini-color.svg") },
      ],
      aiChatVendor: "openai",
      aiChatApiKey: "",
      aiChatApiUrl: "",
      aiChatMaxTokens: 512,
      aiChatTemperature: 0.7,
      aiChatContextLimit: 100,
      aiChatSummaryThreshold: 80,
      aiChatSummaryEnabled: true,
      aiChatSummaryRetainRounds: 6,
      aiChatCharacter: "3d",
      aiChatModelUrl: asset("/assets/models/ai-character.glb"),
      aiChatCharacterSize: 72,
    },
    home: {
      customLayoutButton: true,
    },
    avatarFrame: {
      enable: false,
    },
    // 壁纸：默认关闭。关闭时不渲染壁纸层、个人中心不出现「壁纸」页签，
    // 与没有这段配置时逐字一致；写 enable: true 即开放给用户自选。
    wallpaper: {
      enable: false,
    },
    // 饰品：默认关闭。关闭时不请求目录、不渲染挂件，个人中心无「饰品」页签。
    // 写 enable: true 即开放给用户佩戴（素材来自服务端目录，无需上传）。
    ornament: {
      enable: false,
    },
    // 加载动画部署侧接管：默认关闭 —— 不接管时行为与没有这段配置完全一致，
    // 用户在主题配置抽屉里自选，选择保存在 localStorage。
    // 写 enable: true 即锁定（选择器置灰），动画 / 尺寸 / 速度 / 主色由这里决定。
    loaderConfig: {
      enable: false,
      animation: "dots",
      size: { narrow: 96, wide: 96 },
      color: "#406eeb",
      speed: 1,
      adaptColor: false,
    },
    // 空状态默认样式：默认 true + "el" —— 与没有这段配置时完全一致（el-empty）。
    // 主题配置抽屉里 admin 可改成 modern / plot，作用于所有未显式传 layout 的 ReEmpty。
    emptyState: {
      enable: true,
      layout: "el",
      hairline: "plot",
    },
  },
};

/** 深合并：嵌套对象逐层合并，避免部分配置覆盖整块默认值 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: T,
): T {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = result[key];
    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMerge(
        tv as Record<string, unknown>,
        sv as Record<string, unknown>,
      );
    } else {
      result[key] = sv;
    }
  }
  return result as T;
}

/**
 * 部署侧能力位注册表
 *
 * <p>记录「应用自己的 app.yaml 显式写 false 的能力路径」。远程配置合并优先级
 * 最高，但这类能力位只有部署侧知道本应用后端是否实现，因此远程设置不得再打开。
 * 由 {@code loadConfig} 在合并后写入，供 {@code core/setting.ts} 的远程设置刷新
 * 再次应用时跳过同一批路径。</p>
 */
const deploymentCapabilityOff = new Set<string>();

/**
 * 重写「被部署侧否决」的能力路径集合
 *
 * @param paths 应用 yaml 显式写 false 的能力路径
 */
export function setDeploymentCapabilityOff(paths: Iterable<string>): void {
  deploymentCapabilityOff.clear();
  for (const path of paths) deploymentCapabilityOff.add(path);
}

/**
 * 某个能力路径是否被部署侧显式关闭
 *
 * @param path 点号路径（如 other.avatarFrame.enable）
 * @returns 部署侧写死 false 时为 true
 */
export function isDeploymentCapabilityOff(path: string): boolean {
  return deploymentCapabilityOff.has(path);
}

/** 从默认值 + yaml 解析结果得到最终配置（纯函数，不依赖任何响应式状态） */
export function mergeAppConfig(
  defaults: AppConfig,
  partial: Partial<AppConfig>,
): AppConfig {
  return deepMerge(
    defaults as unknown as Record<string, unknown>,
    partial as unknown as Record<string, unknown>,
  ) as unknown as AppConfig;
}

/** 返回默认配置对象（纯数据，可直接使用） */
export function getDefaultConfig(): AppConfig {
  return defaultAppConfig;
}

/**
 * 统一 localStorage key 命名空间工具（纯函数）
 *
 * 与 config.ts 中的 getStorageKey 行为一致，但**不读取响应式状态**，
 * 配置由调用方以 scope 参数传入，userId 解析通过 resolveUserId 注入，
 * 因此 React 侧可直接复用本函数。
 *
 * 用法：
 *   localStorage.setItem(getStorageKey("user-config", cfg), JSON.stringify(cfg));
 *   localStorage.getItem(getStorageKey("global", cfg));
 *
 * 规则：
 *   - 始终以 ${prefix}: 开头，避免不同 app 串数据
 *   - 在 storage.noPrefixKeys 列表里的 key 不加前缀（跨应用共享）
 *   - 在 storage.userScopeKeys 列表里的 key 自动拼接 userId，按账号隔离
 *   - 传 opts.noPrefix = true 强制不加前缀
 *
 * 拼接结果示例（prefix="system", userId="u123", name="tabs"）：
 *   - 命中 userScopeKeys → "system:u123:tabs"
 *   - 未命中                → "system:tabs"
 *   - 在 noPrefixKeys 列表里 → "tabs"
 */
export function getStorageKey(
  name: string,
  scope?: Partial<AppConfig>,
  opts: { noPrefix?: boolean; resolveUserId?: () => string } = {},
): string {
  const cfg = scope as AppConfig | undefined;
  if (opts.noPrefix) return name;
  const prefix = (cfg?.storage?.prefix || cfg?.app?.systemCode || "app").trim();
  // 已经在 noPrefixKeys 列表里的视为跨应用共享
  const exempt = cfg?.storage?.noPrefixKeys;
  if (Array.isArray(exempt) && exempt.includes(name)) return name;
  // 空前缀避免 "name" 这种无命名空间 key
  if (!prefix) return name;

  // 按用户隔离的 key：自动注入当前 userId
  const userScope = cfg?.storage?.userScopeKeys;
  if (Array.isArray(userScope) && userScope.includes(name)) {
    const userId = opts.resolveUserId ? opts.resolveUserId() : "anonymous";
    return `${prefix}:${userId}:${name}`;
  }
  return `${prefix}:${name}`;
}
