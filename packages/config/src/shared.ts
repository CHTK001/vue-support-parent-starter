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
    // 折叠形态：false=mini 图标菜单条（默认）；true=整个菜单收缩为一个展开按钮（仅垂直布局）
    collapseToButton: false,
    // 分组导航增强：分组标题排版 + 子项图标 + 底部「设置」条目（仅纵向布局），默认开启
    groupNav: true,
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
    showLoading: true,
    sign: false,
    signSecret: "",
    authFailAction: "confirm",
    toast: {
      enable: true,
      successCode: "00000",
      field: "both",
      skipCodeList: [],
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
    captcha: true,
    otp: false,
    slider: false,
    brandName: "应用",
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
    whiteList: ["/login", "/403", "/404", "/500"],
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
    path: "/sse",
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
      typhoon: true,
      ipLookup: true,
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
      announcement: true,
      weather: true,
      typhoon: true,
      collapse: true,
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
