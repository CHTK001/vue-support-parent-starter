/**
 * createApp —— 链式装配应用基础上下文
 *
 * 每一层都是独立异步阶段，按依赖顺序嵌套组合，任一层失败有独立降级策略：
 *   ① loadCrypto        → wasm 加密模块（失败：抛 SystemException，链路中断）
 *   ② loadAppConfig     → app.yaml 加载并合并（失败：默认值，链路继续）
 *   ③ buildStorage      → 带命名空间/加密的 storage（复用 ① 的 crypto）
 *   ④ buildToken        → 令牌管理器（复用 ② 的 token 配置）
 *   ⑤ buildHttp         → 加密/签名拦截器 http（复用 ① crypto + ② http 配置）
 *   ⑥ buildRouter       → 路由 + 权限守卫（复用 ② app.openAuth + ④ token）
 *   ⑦ syncPermissions   → 从 storage 同步用户角色/权限（复用 ③）
 *
 * 职责边界：
 *   - 本函数只做「纯逻辑装配」，不涉及 Vue 实例 / 主题应用
 *   - 主题选择与令牌应用由 @repo/app 的主题安装器（resolveThemeInstaller）负责
 *   - Vue 层（实例创建 / 插件注册 / 挂载）由 @repo/app 的 createApp 负责
 *
 * 用法：
 *   const app = await createApp({ appName: "demo" });
 *   app.crypto.sm3(...);  app.config.app.title;  app.storage.set(...);
 */
import { loadCrypto, SystemException, type CryptoModule } from "./crypto";
import { loadConfig, getConfig, upgrade, setConfig, restoreUserConfig, type AppConfig, type DeepPartial } from "@repo/config";
import {
  browserLocalStorage,
  createStorage,
  type StorageWrapper,
} from "@repo/utils";
import { syncUserPerm, USER_INFO_KEY } from "./permission";
import { createTokenManager, type TokenManager } from "./token";
import { setupHttpCryptoInterceptor } from "./httpCrypto";
import {
  createHttp,
  setDefaultHttpInstance,
  log,
  getUserInfo,
  setMenuCache,
  setLayoutCache,
  type Http,
} from "@repo/utils";
import { createAppRouter, setRouter, type RemoteRoutesLoader } from "./router";
import {
  setApiHttp,
  probeBackend,
  WEATHER_OVERVIEW_PATH,
  LOCATION_RESOLVE_PATH,
  TYPHOON_ACTIVE_PATH,
} from "./api";
import { setAppStorage } from "./storage";
import { initGlobalTimer, destroyGlobalTimer } from "@repo/work";
import { installAntiDebug, uninstallAntiDebug, refreshAntiDebug } from "./security/antiDebug";
import { bindConfigHotReload, onConfigHotReload, loadDefaultSetting } from "./setting";
import { applyGlobalWatermark } from "./directives/waterMarker";
import {
  initGlobalSocketService,
  closeGlobalSocketService,
  setSocketTokenProvider,
  getGlobalSocketConfig,
} from "./socket";
import { SystemTopics } from "./socket/socketTopics";
import type { RouteConfigsTable } from "./router/types";
import { installErrorMonitor, flushErrorMonitor } from "./monitor";

export interface CreateAppOptions {
  /** 应用名，对应 apps/{appName}/app.yaml；缺省 "default" */
  appName?: string;
  /** app.yaml 的完整 URL；缺省自动拼接 apps/{appName}/app.yaml */
  configUrl?: string;
  /** wasm 加密模块 URL；缺省走默认路径 */
  cryptoUrl?: string;
  /** 自定义加密模块加载器（测试或自定义集成时传入） */
  cryptoLoader?: () => Promise<CryptoModule>;
  /** 资源基础路径（部署到子路径时用），缺省 "" */
  baseUrl?: string;
  /** 静态路由表（业务模块传入，如 spider 路由） */
  routes?: RouteConfigsTable[];
  /** 路由创建后的扩展钩子 */
  setupRouter?: (router: ReturnType<typeof createAppRouter>) => void | Promise<void>;
  /** 远程路由加载器（覆盖默认 initAuthRouter） */
  loadRemoteRoutes?: RemoteRoutesLoader;
  /** 路由模式（history / hash），默认 hash */
  routerMode?: "history" | "hash";
  /**
   * 代码级默认配置（优先级最低的一层），透传给 loadConfig。
   *
   * <p>用于让应用在 {@code main.ts} 里声明自身默认，例如分组导航：</p>
   *
   * <pre>{@code
   * await createContextApp({ appName: "xxx", defaults: { menu: { collapseSingleChild: true } } })
   * }</pre>
   *
   * <p>app.example.yaml / app.yaml / app.{env}.yaml / 远程配置 / 环境变量仍会覆盖它。</p>
   */
  defaults?: DeepPartial<AppConfig>;
}

/** createApp 完成后的应用上下文 */
export interface AppContext {
  appName: string;
  /** 加密模块（wasm） */
  crypto: CryptoModule;
  /** 统一配置（app.yaml 合并默认值后的结果） */
  config: AppConfig;
  /** 带命名空间（storageKey）的 storage 实例，用于持久化 */
  storage: StorageWrapper;
  /** 令牌管理器（token 存储 + 定时刷新） */
  token: TokenManager;
  /** 已接入加密/签名拦截器的 http 客户端 */
  http: Http;
  /** 应用路由（含权限守卫） */
  router: ReturnType<typeof createAppRouter>;
  /** 卸载安全防护（反调试等）的函数，应用销毁时调用 */
  disposeSecurity: () => void;
  /** 卸载 Socket 连接（全局实例），应用销毁时调用 */
  disposeSocket: () => void;
}

/**
 * 链式装配应用基础上下文
 * @throws SystemException 第①步失败时
 */
export async function createApp(options: CreateAppOptions = {}): Promise<AppContext> {
  const baseUrl = options.baseUrl ?? "";
  const appName = options.appName ?? "default";

  log.info("createApp", "① loadCrypto...");
  const crypto = await loadCrypto({
    url: options.cryptoUrl,
    loader: options.cryptoLoader,
  });
  log.info("createApp", "② loadConfig...");
  const config = await loadConfig({
    appName,
    baseUrl,
    configUrl: options.configUrl,
    defaults: options.defaults,
  });
  await restoreUserConfig();

  log.info("createApp", "③ buildStorage...");
  const storage = buildStorage(crypto, config);
  setAppStorage(storage);

  log.info("createApp", "④ createTokenManager...");
  const token = createTokenManager(storage, config.token);
  token.start();

  log.info("createApp", "⑤ buildHttp...");
  const http = buildHttp(crypto, config);
  setApiHttp(http);
  setDefaultHttpInstance(http.getInstance());

  log.info("createApp", "⑥ createAppRouter...");
  const remoteLoader = options.loadRemoteRoutes ?? (await getRemoteRouteLoader());
  const router = createAppRouter({
    routes: options.routes,
    mode: options.routerMode ?? "hash",
    getAccessToken: () => token.getAccessToken(),
    loadRemoteRoutes: remoteLoader,
    setup: options.setupRouter,
  });
  setRouter(router);

  log.info("createApp", "⑦ syncUserPerm...");
  syncUserPerm(storage.get(USER_INFO_KEY));

  log.info("createApp", "⑧ installAntiDebug...");
  const disposeSecurity = installAntiDebug();

  // ⑧.1 全局异常监控（由 config.monitor.enable 控制，Worker 去重/批量缓冲，reportUrl 上报服务端）
  const disposeMonitor = installErrorMonitor();

  log.info("createApp", "⑨ bindConfigHotReload...");
  bindConfigHotReload();
  if (config.config?.enable !== false && config.url?.setting) {
    log.info("createApp", "⑩ loadDefaultSetting...");
    await loadDefaultSetting();
  }
  setSocketTokenProvider(() => token.getAccessToken());
  /** 当前生效的 socket 连接配置签名：仅配置真正变化时才重建连接 */
  const socketConfigSignature = (): string => {
    try {
      const resolved = getGlobalSocketConfig();
      const s = getConfig().socket || {};
      return JSON.stringify({
        enable: s.enable,
        protocol: resolved.protocol,
        urls: resolved.urls,
        context: resolved.context,
        path: s.path,
        transports: s.transports,
      });
    } catch {
      return "";
    }
  };
  let lastSocketSignature = socketConfigSignature();
  const disposeSocket = initGlobalSocket(() => config.socket.enable);
  const disposeHotReload = onConfigHotReload(() => {
    refreshAntiDebug();
    applyGlobalWatermark();
    // 后端 Setting 变更 socket 字段后重建连接（enable/protocol/urls 变化均生效）。
    // 登录等配置热重载会连续触发多次而 socket 字段并未变化——若无条件重建，
    // 旧实例被 close 后视图侧的订阅全部失效，新实例还要重连，期间实时数据断流。
    const signature = socketConfigSignature();
    if (signature === lastSocketSignature) {
      return;
    }
    lastSocketSignature = signature;
    initGlobalSocket(() => config.socket.enable);
  });

  // ⑩ 全局定时器：系统启动注册一个，后续组件统一通过 getGlobalTimer() 复用
  // （Worker 独立线程每秒推送，不受主线程 setInterval 节流影响）
  initGlobalTimer(config.other?.timer?.zones ?? []);

  // ⑪ 顶栏天气/台风：启动期预热后台能力探测（HEAD），组件挂载时直接复用探测结果，
  // 不必串行等待「探测 → 取数」两次往返
  warmHeaderCapabilityProbes(config);

  return {
    appName,
    crypto,
    config,
    storage,
    token,
    http,
    router,
    disposeSecurity: () => {
      disposeSecurity();
      disposeMonitor();
      disposeHotReload();
      disposeSocket();
      destroyGlobalTimer();
    },
    disposeSocket,
  };
}

/** 反调试热更新：配置变更（setConfig）后调用，按需安装/卸载 */
export function refreshSecurity(): void {
  refreshAntiDebug();
}

/**
 * 预热顶栏天气/台风的后台能力探测（HEAD）。
 *
 * 探测结果由 probeBackend 按路径缓存 10 分钟，组件挂载时直接命中；
 * 这里只提前发起，失败不影响启动（探测内部已吞掉异常并回落三方）。
 */
function warmHeaderCapabilityProbes(config: AppConfig): void {
  const other = config.other;
  if (other?.toolbar?.weather && other?.weather?.enable !== false) {
    void probeBackend(WEATHER_OVERVIEW_PATH);
    void probeBackend(LOCATION_RESOLVE_PATH);
  }
  if (other?.toolbar?.typhoon) {
    // 详情接口与列表同属一个后台控制器，探测列表即可
    void probeBackend(TYPHOON_ACTIVE_PATH);
  }
}

/**
 * 初始化全局 Socket 连接（读取 config.socket）。
 *
 * enable=false 时关闭已有连接并返回空操作；enable=true 时按配置协议
 * 创建连接，并订阅配置热重载主题（system:config:update/version），
 * 收到版本号后调用 upgrade() 触发配置重新拉取。
 *
 * @param shouldEnable 是否启用（每次调用重新评估，默认读 config.socket.enable）
 * @returns 卸载函数
 */
function initGlobalSocket(shouldEnable?: () => boolean): () => void {
  const enabled = shouldEnable?.() ?? getConfig().socket.enable;

  if (!enabled) {
    closeGlobalSocketService();
    return () => closeGlobalSocketService();
  }

  const globalConfig = getGlobalSocketConfig();
  if (!globalConfig.urls.length) {
    log.warn("[createApp] socket.enable=true 但未解析到可用地址，跳过连接");
    return () => closeGlobalSocketService();
  }

  const service = initGlobalSocketService({
    protocol: globalConfig.protocol,
    urls: globalConfig.urls,
    context: globalConfig.context,
    path: getConfig().socket.path,
    query: getConfig().socket.query,
    autoConnect: getConfig().socket.autoConnect,
    reconnection: getConfig().socket.reconnection,
    reconnectionAttempts: getConfig().socket.reconnectionAttempts,
    reconnectionDelay: getConfig().socket.reconnectionDelay,
    heartbeatInterval: getConfig().socket.heartbeatInterval,
    transports: getConfig().socket.transports,
  });

  // 配置热重载联动：收到后端 socket 推送的版本号 → upgrade() 触发重新拉取
  const applyVersion = (data: unknown): void => {
    const record = (data ?? {}) as { version?: unknown; data?: unknown };
    const nested = (record.data ?? {}) as { version?: unknown };
    const version =
      typeof record.version === "string"
        ? record.version
        : typeof nested.version === "string"
          ? nested.version
          : undefined;
    if (version) {
      upgrade(version);
    }
  };
  service.on(SystemTopics.CONFIG.UPDATE, applyVersion);
  service.on(SystemTopics.CONFIG.VERSION, applyVersion);

  return () => closeGlobalSocketService();
}

export { installAntiDebug, uninstallAntiDebug, refreshAntiDebug } from "./security/antiDebug";

/**
 * 解析当前登录 userId（未登录 / 解析失败 → "anonymous"）
 *
 * 直接读 localStorage 原始 key "userInfo"（与 @repo/config.getStorageKey 内部实现一致），
 * 不反向依赖 @repo/utils 避免循环。
 */
function resolveUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  try {
    const data = getUserInfo() as { userId?: string | number } | null;
    if (!data) return "anonymous";
    const id = data?.userId;
    if (id === undefined || id === null || id === "") return "anonymous";
    return String(id);
  } catch {
    return "anonymous";
  }
}

/** ④ storage：命名空间前缀；加解密由 StorageWrapper 内部实时从 config.storage 读取（见 @repo/utils storage.ts） */
function buildStorage(_crypto: CryptoModule, config: AppConfig): StorageWrapper {
  return createStorage(browserLocalStorage, {
    prefix: config.storage.prefix || config.app.systemCode || "system",
    noPrefixKeys: config.storage.noPrefixKeys,
    userScopeKeys: config.storage.userScopeKeys,
    resolveUserId,
  });
}

/** ⑥ HTTP 客户端：加密/签名拦截器，用户始终操作标准 axios 请求对象 */
function buildHttp(crypto: CryptoModule, config: AppConfig): Http {
  const httpInstance = setupHttpCryptoInterceptor({
    crypto,
    encrypt: config.http.encrypt,
    sign: config.http.sign,
    signSecret: config.http.signSecret,
    showLoading: config.http.showLoading,
    retryCount: config.http.retryCount,
    retryDelay: config.http.retryDelay,
    requestCodec: config.http.requestCodec,
  });
  return createHttp({ instance: httpInstance });
}

/**
 * 默认远程路由加载器：动态导入 @repo/pinia 的 initAuthRouter
 * 使用运行时 import 避免 @repo/core 静态依赖 @repo/pinia 导致的循环导入。
 */
async function getRemoteRouteLoader() {
  try {
    // @ts-ignore 运行时动态加载，避免 @repo/core 静态依赖 @repo/pinia 导致循环导入
    const mod = await import("@repo/pinia");
    return (mod as any).initAuthRouter as ((router: any) => Promise<void>) | undefined;
  } catch {
    return undefined;
  }
}
