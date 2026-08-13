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
import type { StorageWrapper } from "@repo/utils";
import { getUserInfo } from "@repo/utils";
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
  MenuConfig,
  UploadConfig,
  EnvConfig,
  SystemConfig,
  CryptoConfig,
  LoginConfig,
  RouteConfig,
  OtherConfig,
  MonitorConfig,
} from "./types/config";

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

/** 默认配置（没有 app.yaml 时全部走默认） */
export const defaultAppConfig: AppConfig = {
      config: {
        enable: true,
      },
      app: {
        title: "Vue Support",
        version: "0.7.0",
        systemCode: "system",
        openAuth: false,
      },
      permission: {
        superadmin: "superadmin",
        admin: ["admin", "superadmin"],
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
        retryCount: 3,
        retryDelay: 1000,
        showLoading: true,
        sign: false,
        signSecret: "",
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
        wasmUrl: "/wasm/crypto-wasm.js",
        algorithm: "aes",
      },
      login: {
        captcha: true,
        otp: false,
        slider: false,
        brandName: "ADMIN",
        logoUrl: "/assets/images/logo/logo.webp",
        avatarUrl: "https://avatars.githubusercontent.com/u/185870639?v=4&size=64",
        welcome: "欢迎登录",
        title: "系统管理平台",
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
        // 远程菜单接口地址：等价于 urlConfig.menu（getMenu() 实际使用 urlConfig.menu），
        // 此字段冗余保留，两者不一致时以 urlConfig.menu 为准
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
            { label: "Qwen2.5-1.5B-Instruct（推荐·轻量）", value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", image: "/assets/models/qwen-color.svg" },
            { label: "Qwen2.5-3B-Instruct（中等）", value: "Qwen2.5-3B-Instruct-q4f16_1-MLC", image: "/assets/models/qwen-color.svg" },
            { label: "Llama-3.2-1B-Instruct（轻量）", value: "Llama-3.2-1B-Instruct-q4f16_1-MLC", image: "/assets/models/meta-color.svg" },
            { label: "Llama-3.2-3B-Instruct（中等）", value: "Llama-3.2-3B-Instruct-q4f16_1-MLC", image: "/assets/models/meta-color.svg" },
            { label: "Phi-3.5-mini-instruct（中等）", value: "Phi-3.5-mini-instruct-q4f16_1-MLC", image: "/assets/models/microsoft-color.svg" },
            { label: "gemma-2-2b-it（中等）", value: "gemma-2-2b-it-q4f16_1-MLC", image: "/assets/models/gemini-color.svg" },
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
          aiChatModelUrl: "/assets/models/ai-character.glb",
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
 * 从 localStorage 中读取当前登录用户 id（用于 userScopeKeys 自动注入）
 *
 * 不反向依赖 @repo/utils / @repo/core，避免循环引用。
 * 直接读 localStorage 原始 key "userInfo"（应用启动后由 pinia user store 写入），
 * 解析失败或未登录时返回 "anonymous"。
 *
 * 注意：此处直接读 localStorage 的原始 "userInfo" key，不走 getStorageKey，
 * 因为 getStorageKey 内部又会调 getCurrentUserId，形成循环。
 */
export function getCurrentUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  try {
    const data = getUserInfo() as { userId?: string | number; sysUserId?: string | number } | null;
    if (!data) return "anonymous";
    const id = data?.userId ?? data?.sysUserId;
    if (id === undefined || id === null || id === "") return "anonymous";
    return String(id);
  } catch {
    return "anonymous";
  }
}

/**
 * 统一 localStorage key 命名空间工具
 *
 * 用法：
 *   localStorage.setItem(getStorageKey("user-config"), JSON.stringify(cfg));
 *   localStorage.getItem(getStorageKey("global"));
 *
 * 规则：
 *   - 始终以 ${prefix}: 开头，避免不同 app 串数据
 *   - 在 storage.noPrefixKeys 列表里的 key 不加前缀（跨应用共享）
 *   - 在 storage.userScopeKeys 列表里的 key 自动拼接当前 userId，按账号隔离
 *   - 传 opts.noPrefix = true 强制不加前缀
 *
 * 拼接结果示例（prefix="system", userId="u123", name="tabs"）：
 *   - 命中 userScopeKeys → "system:u123:tabs"
 *   - 未命中                → "system:tabs"
 *   - 在 noPrefixKeys 列表里 → "tabs"
 */
export function getStorageKey(name: string, opts: { noPrefix?: boolean } = {}): string {
  if (opts.noPrefix) return name;
  const cfg = currentConfig;
  const prefix = (cfg?.storage?.prefix || cfg?.app?.systemCode || "app").trim();
  // 已经在 noPrefixKeys 列表里的视为跨应用共享
  const exempt = cfg?.storage?.noPrefixKeys;
  if (Array.isArray(exempt) && exempt.includes(name)) return name;
  // 空前缀避免 "name" 这种无命名空间 key
  if (!prefix) return name;

  // 按用户隔离的 key：自动注入当前 userId
  const userScope = cfg?.storage?.userScopeKeys;
  if (Array.isArray(userScope) && userScope.includes(name)) {
    return `${prefix}:${getCurrentUserId()}:${name}`;
  }
  return `${prefix}:${name}`;
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

/** 用户可调配置在 storage 的 key 后缀（统一前缀由 getStorageKey 加） */
const USER_CONFIG_KEY = "user-config";

/** 缓存用户配置专用 StorageWrapper，避免重复动态 import */
let userConfigStorageInstance: StorageWrapper | null = null;

/**
 * 返回用户配置专用的加密 StorageWrapper。
 *
 * 动态 import @repo/utils 避免模块加载期循环依赖：
 * @repo/utils/storage.ts 在模块顶会 import getConfig 并创建 localStore 单例（调用 getConfig），
 * 若 config.ts 顶部静态 import @repo/utils，会在 currentConfig 初始化前触发 TDZ 崩溃。
 * 此函数仅在运行时（saveUserConfig / restoreUserConfig 被调用时）执行，故安全。
 */
async function getUserConfigStorage(): Promise<StorageWrapper> {
  if (userConfigStorageInstance) return userConfigStorageInstance;
  const { createStorage, browserLocalStorage } = await import("@repo/utils");
  userConfigStorageInstance = createStorage(browserLocalStorage, {
    prefix: currentConfig.storage?.prefix || currentConfig.app?.systemCode || "app",
    noPrefixKeys: currentConfig.storage?.noPrefixKeys,
    userScopeKeys: currentConfig.storage?.userScopeKeys,
    resolveUserId: getCurrentUserId,
    encode: currentConfig.storage?.encode,
  });
  return userConfigStorageInstance;
}

/**
 * 保存用户可调配置到 storage。
 * 只持久化设置面板能改的切片：other（工具栏/计时器/状态色）、message、security.watermark，
 * 不保存接口地址 / 登录页 / 路由等系统级配置（仍由 app.yaml / 后端决定）。
 */
export async function saveUserConfig(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const snapshot = {
      other: JSON.parse(JSON.stringify(currentConfig.other)),
      message: JSON.parse(JSON.stringify(currentConfig.message)),
      security: currentConfig.security?.watermark
        ? { watermark: JSON.parse(JSON.stringify(currentConfig.security.watermark)) }
        : undefined,
    };
    const storage = await getUserConfigStorage();
    storage.set(USER_CONFIG_KEY, snapshot);
  } catch {
    /* 持久化失败静默忽略 */
  }
}

/** 启动时恢复用户可调配置（深合并进 getConfig），无保存记录时不做任何事 */
export async function restoreUserConfig(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const storage = await getUserConfigStorage();
    const saved = storage.get<Partial<AppConfig>>(USER_CONFIG_KEY);
    if (saved && typeof saved === "object") {
      // 仅恢复用户可调字段（与上方 watch 写入的字段保持一致），
      // 避免历史 user-config 中的 app/route/http 等覆盖 yaml 加载值
      const { other, message, security } = saved;
      const filtered: Partial<AppConfig> = {};
      if (other) filtered.other = other;
      if (message) filtered.message = message;
      if (security) filtered.security = security;
      if (Object.keys(filtered).length > 0) {
        setConfig(filtered);
      }
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
  MenuConfig,
  UploadConfig,
  EnvConfig,
  SystemConfig,
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

/** 本地存储的配置版本 key（无前缀，跨项目共享版本号） */
const CONFIG_VERSION_KEY = "koi-repo-config-version";

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
