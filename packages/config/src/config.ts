/**
 * 统一应用配置
 *
 * 默认值来源：apps/vue-support-template-starter/app.yaml（模板配置文件）。
 * 所有 starter 的 app.yaml 均从此模板复制，修改模板即可统一更新默认值。
 *
 * createApp 会把 apps/{appName}/app.yaml 解析后写入这里。
 * app.yaml 缺失或加载失败时，使用默认配置（defaultAppConfig）。
 *
 * 配置以 reactive 对象形式持有，调用方可通过：
 *   - getConfig()         → 读取完整配置（响应式）
 *   - useAppConfig()      → 组合式 API（reactive + watch 友好）
 *   - setConfig(partial)  → 合并写入
 *   - onConfigChange(cb)  → 订阅变更
 * 解决「setConfig 后已有 ref(getConfig().xxx) 监听不到」的隐性 bug。
 */
import { reactive, watch } from "vue";
import { load as parseYaml } from "js-yaml";
import type {
  AppConfig,
  ConfigConfig,
  AppSystemConfig,
  HttpConfig,
  StorageConfig,
  SecurityConfig,
  PermissionConfig,
  TokenConfig,
  I18nConfig,
  LayoutConfig,
  UploadConfig,
  EnvConfig,
  SystemConfig,
  AiConfig,
  CryptoConfig,
  LoginConfig,
  RouteConfig,
  OtherConfig,
} from "./types/config";

/** Vite define 注入的全局常量：模板 app.yaml 内容（字符串） */
declare const TEMPLATE_APP_YAML: string;

/** AppConfig 顶层字段名（用于 yaml 键去 Config 后缀的映射白名单） */
const APP_CONFIG_TOP_KEYS = new Set([
  "config",
  "app",
  "permission",
  "token",
  "i18n",
  "layout",
  "upload",
  "url",
  "env",
  "system",
  "http",
  "storage",
  "security",
  "ai",
  "crypto",
  "login",
  "route",
  "socket",
  "message",
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
function normalizeTopKey(key: string): string {
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
 * 模板配置文件内容（由 build 时注入）。
 *
 * 构建时通过 Vite define 将 apps/vue-support-template-starter/app.yaml
 * 注入为字符串，这里直接解析为 defaultAppConfig。
 *
 * 使用方式：
 *   1. 修改 apps/vue-support-template-starter/app.yaml
 *   2. 重新构建 packages/config → defaultAppConfig 自动同步
 *
 * 兜底值（yaml 注入失败时生效）在 defaultAppConfig 中维护。
 */
const TEMPLATE_YAML = typeof TEMPLATE_APP_YAML !== "undefined" ? TEMPLATE_APP_YAML : "";

/** 默认配置（没有 app.yaml 时全部走默认；优先使用模板 YAML，兜底用静态值） */
export const defaultAppConfig: AppConfig = TEMPLATE_YAML
  ? (parseAppYaml(TEMPLATE_YAML) as AppConfig)
  : {
      config: {
        remoteSettingUrl: "",
      },
      app: {
        title: "Vue Support",
        version: "0.7.0",
        systemCode: "system",
        openAuth: false,
      },
      permission: {
        superadmin: "superadmin",
        admin: "admin",
      },
      token: {
        autoRefresh: false,
        accessTokenKey: "accessToken",
        refreshTokenKey: "refreshToken",
        userInfoKey: "userInfo",
        refreshUrl: "",
        refreshInterval: 300000,
        advanceRefresh: 60000,
      },
      i18n: {
        defaultLocale: "zh-CN",
        locales: ["zh-CN", "en-US"],
      },
      layout: {
        source: "local",
        remoteUrl: "",
      },
      upload: {
        url: "",
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
        apiVersion: "",
        enable: true,
        encrypt: false,
        timeout: 10000,
        retryCount: 3,
        retryDelay: 1000,
        showLoading: true,
        sign: false,
        signSecret: "",
      },
      storage: {
        encode: true,
        key: "2XNN4K8LC0ELVWN4",
        prefix: "",
        noPrefixKeys: [],
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
      ai: {
        enable: false,
        url: "",
        model: "",
        apiKey: "",
      },
      crypto: {
        wasmUrl: "/wasm/crypto-wasm.js",
        algorithm: "aes",
      },
      login: {
        captcha: true,
        otp: false,
        slider: false,
        brandName: "ADMIN",
        logoUrl: "/assets/images/logo/logo.webp",
        welcome: "欢迎登录",
        title: "ADMIN 管理平台",
        description: "或许我们只是差点运气",
        imageUrl: "/assets/images/login/science.png",
        featureTags: [
          { icon: "DataAnalysis", text: "高效管理" },
          { icon: "Brush", text: "现代设计" },
          { icon: "Lock", text: "安全可靠" },
        ],
        beiAnHao: "",
      },
      route: {
        mode: "static",
        remoteUrl: "",
        mergeLocalMenu: false,
        modulePaths: [],
        allowPrefixes: [],
        whiteList: ["/login", "/403", "/404", "/500"],
        loginPath: "/login",
        homePath: "/home",
        personagePath: "/system/personage",
        notFoundPath: "/404",
        forbiddenPath: "/403",
        serverErrorPath: "/500",
      },
      socket: {
        enable: false,
        protocol: "socketio",
        urls: "",
        context: "/socket.io",
        path: "/ws",
        query: {},
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        heartbeatInterval: 30000,
        transports: ["websocket"],
      },
      message: {
        position: "toolbar",
        maxUnread: 99,
        socket: true,
        listUrl: "/v2/message/sys-message/page",
        unreadUrl: "/v2/message/sys-message/unread-count",
        readUrl: "/v2/message/sys-message/read",
      },
      other: {
        themeId: "koi",
        themeConfigCloseConfirm: false,
        statusColors: {
          success: "#67C23A",
          warning: "#E6A23C",
          danger: "#F56C6C",
          info: "#909399",
        },
        toolbar: {
          searchMenu: true,
          refresh: true,
          dark: true,
          language: true,
          fullScreen: true,
          themeSetting: true,
          user: true,
          breadcrumb: true,
          breadcrumbDropdown: true,
          breadcrumbIcon: true,
          tabIcon: true,
          logo: true,
          message: true,
          collapse: true,
        },
        timer: {
          enable: false,
          zones: [],
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
          performanceMonitorPosition: "top-right",
          performanceMonitorMode: "simple",
          performanceMonitorLayout: "merged",
          performanceMonitorDirection: "auto",
        },
        aiChat: {
          enable: true,
          aiChatEnabled: false,
          aiChatMode: "webllm",
          aiChatModel: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
          aiChatVendor: "openai",
          aiChatApiKey: "",
          aiChatApiUrl: "",
          aiChatMaxTokens: 512,
          aiChatTemperature: 0.7,
        },
      },
    };

let currentConfig: AppConfig = reactive({
  ...defaultAppConfig,
}) as unknown as AppConfig;

/** 订阅者集合：任意 setConfig 后统一通知 */
const subscribers = new Set<(config: AppConfig) => void>();

/**
 * 获取统一配置（响应式对象；解构/赋值时可能丢失响应式，复杂场景请用 useAppConfig）
 */
export function getConfig(): AppConfig {
  return currentConfig;
}

/**
 * 组合式 API：返回 reactive 配置 + 变更监听
 * 推荐在组件 / composable 内使用，与 vue watch / computed 完美配合
 */
export function useAppConfig() {
  return currentConfig;
}

/** 合并写入统一配置（深合并） */
export function setConfig(partial: Partial<AppConfig>): AppConfig {
  const merged = deepMerge(
    currentConfig as unknown as Record<string, unknown>,
    partial as unknown as Record<string, unknown>,
  ) as unknown as AppConfig;
  // 逐 key 赋值以保持响应式（不能直接替换 reactive 引用）
  applyMerge(currentConfig, merged);
  // 通知订阅者
  subscribers.forEach((cb) => {
    try {
      cb(currentConfig);
    } catch (error) {
      console.warn("[config] subscriber error", error);
    }
  });
  return currentConfig;
}

/** 订阅配置变更（setConfig 后触发） */
export function onConfigChange(cb: (config: AppConfig) => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

/** 重置为默认配置 */
export function resetConfig(): AppConfig {
  applyMerge(currentConfig, defaultAppConfig);
  subscribers.forEach((cb) => cb(currentConfig));
  return currentConfig;
}

/**
 * 浅响应式补充：默认导出整个 reactive 对象后，
 * 当远端 setConfig 传入新顶层字段时，对象整体仍是响应式，但若 partial 中出现
 * 当前没有的 key，需要补建。Vue 3 reactive 对已知 key 是响应的，
 * 未声明的 key 赋值后会变为响应式，无需额外操作。
 */
function applyMerge(target: AppConfig, source: AppConfig): void {
  const t = target as unknown as Record<string, unknown>;
  const s = source as unknown as Record<string, unknown>;
  for (const key of Object.keys(s)) {
    t[key] = s[key];
  }
}

// ==================== 用户配置持久化（设置面板可调项写回 storage，刷新不丢） ====================

/** 用户可调配置在 storage 的 key 后缀（前缀用 storage.prefix / systemCode 区分应用） */
const USER_CONFIG_KEY = "user-config";

/** 用户配置 storage 键（按应用命名空间，避免多应用串数据） */
function userConfigStorageKey(): string {
  const cfg = currentConfig;
  return `${cfg?.storage?.prefix || cfg?.app?.systemCode || "app"}-${USER_CONFIG_KEY}`;
}

/**
 * 保存用户可调配置到 storage。
 * 只持久化设置面板能改的切片：other（工具栏/计时器/状态色）、message、security.watermark，
 * 不保存接口地址 / 登录页 / 路由等系统级配置（仍由 app.yaml / 后端决定）。
 */
export function saveUserConfig(): void {
  if (typeof window === "undefined") return;
  try {
    const snapshot = {
      other: JSON.parse(JSON.stringify(currentConfig.other)),
      message: JSON.parse(JSON.stringify(currentConfig.message)),
      security: currentConfig.security?.watermark
        ? { watermark: JSON.parse(JSON.stringify(currentConfig.security.watermark)) }
        : undefined,
    };
    window.localStorage.setItem(userConfigStorageKey(), JSON.stringify(snapshot));
  } catch {
    /* 持久化失败静默忽略 */
  }
}

/** 启动时恢复用户可调配置（深合并进 getConfig），无保存记录时不做任何事 */
export function restoreUserConfig(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(userConfigStorageKey());
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<AppConfig>;
    if (saved && typeof saved === "object") {
      setConfig(saved);
    }
  } catch {
    /* 恢复失败静默忽略 */
  }
}

// 监听用户可调配置变化并延迟写入 storage（防抖，避免高频改动反复写）
if (typeof window !== "undefined") {
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => [
      currentConfig.other,
      currentConfig.message,
      currentConfig.security?.watermark,
    ],
    () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(saveUserConfig, 300);
    },
    { deep: true },
  );
}

/** 深合并：嵌套对象逐层合并，避免部分配置覆盖整块默认值 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: T): T {
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

/** 从默认值 + yaml 解析结果得到最终配置（不修改 currentConfig） */
export function mergeAppConfig(partial: Partial<AppConfig>): AppConfig {
  return deepMerge(
    defaultAppConfig as unknown as Record<string, unknown>,
    partial as unknown as Record<string, unknown>,
  ) as unknown as AppConfig;
}

/** 重新导出所有类型，方便使用方一处 import */
export type {
  ConfigConfig,
  AppSystemConfig,
  HttpConfig,
  StorageConfig,
  SecurityConfig,
  PermissionConfig,
  TokenConfig,
  I18nConfig,
  LayoutConfig,
  UploadConfig,
  EnvConfig,
  SystemConfig,
  AiConfig,
  CryptoConfig,
  LoginConfig,
  LoginFeatureTag,
  RouteConfig,
  OtherConfig,
  ToolbarConfig,
  TimerConfig,
  MessageConfig,
  StatusColorConfig,
  SocketConfig,
  SocketProtocol,
  AccessibilityConfig,
  DevToolsConfig,
  HeatmapConfig,
  PerformanceConfig,
  AiChatConfig,
  AppConfig,
} from "./types/config";
export type { RouteMode } from "./types/config";

// ==================== 配置版本 / 热重载 ====================

/**
 * 配置版本变更事件名。
 *
 * 后端配置变更时（HTTP 响应头 x-response-version 或 socket 推送），
 * 前端调用 upgrade(version) 对比本地版本，变化时在 window 上派发本事件，
 * 由 @repo/core 的 bindConfigHotReload 监听并重新拉取设置热应用。
 */
export const CONFIG_VERSION_CHANGE_EVENT = "repo-config-version-change";

/** 本地存储的配置版本 key */
const CONFIG_VERSION_KEY = "repo-config-version";

/** 读取当前已应用的后端配置版本（本地存储） */
export function getConfigVersion(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(CONFIG_VERSION_KEY) ?? "";
}

/** 写入后端配置版本到本地存储 */
export function setConfigVersion(version: string): void {
  if (typeof window === "undefined" || !version) {
    return;
  }
  window.localStorage.setItem(CONFIG_VERSION_KEY, version);
}

/**
 * 配置版本升级入口。
 *
 * 版本号变化时：写入本地存储 → 派发 CONFIG_VERSION_CHANGE_EVENT。
 * 版本相同（幂等）时不重复派发，避免热重载循环。
 */
export function upgrade(version: string): void {
  if (!version || getConfigVersion() === version) {
    return;
  }
  setConfigVersion(version);
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function"
  ) {
    window.dispatchEvent(
      new CustomEvent(CONFIG_VERSION_CHANGE_EVENT, { detail: { version } }),
    );
  }
}
