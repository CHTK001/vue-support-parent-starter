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
import { loadConfig, getConfig, upgrade, type AppConfig } from "@repo/config";
import { browserLocalStorage, createStorage, type StorageWrapper } from "@repo/utils";
import { syncUserPerm, USER_INFO_KEY } from "./permission";
import { createTokenManager, type TokenManager } from "./token";
import { setupHttpCryptoInterceptor } from "./httpCrypto";
import { createHttp, type Http } from "@repo/utils";
import { createAppRouter, setRouter } from "./router";
import { setApiHttp } from "./api";
import { installAntiDebug, uninstallAntiDebug, refreshAntiDebug } from "./security/antiDebug";
import { bindConfigHotReload, onConfigHotReload } from "./setting";
import { applyGlobalWatermark } from "./directives/waterMarker";
import {
  initGlobalSocketService,
  closeGlobalSocketService,
  setSocketTokenProvider,
  getGlobalSocketConfig,
} from "./socket";
import { SystemTopics } from "./socket/socketTopics";
import type { RouteConfigsTable } from "./router/types";

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

  // ① 加载 wasm 加密模块（失败 → 抛系统异常，链路中断）
  const crypto = await loadCrypto({
    url: options.cryptoUrl,
    loader: options.cryptoLoader,
  });

  // ② 加载配置：环境变量 → app.yaml → 远程，由 @repo/config 统一管理
  const config = await loadConfig({
    appName,
    baseUrl,
    configUrl: options.configUrl,
  });

  // ③ storage：命名空间 + AES 变种加密
  const storage = buildStorage(crypto, config);

  // ④ 令牌管理器
  const token = createTokenManager(storage, config.token);
  token.start();

  // ⑤ HTTP 客户端：加密/签名拦截器
  const http = buildHttp(crypto, config);
  // 注入到 API 封装层（登录/验证码/默认配置等接口使用）
  setApiHttp(http);

  // ⑥ 路由：静态路由 + 权限守卫
  const router = createAppRouter({
    routes: options.routes,
    mode: "history",
    getAccessToken: () => token.getAccessToken(),
    setup: options.setupRouter,
  });
  // 注入 router 单例（供 http 401 处理 / 标签页导航等使用）
  setRouter(router);

  // ⑦ 从存储同步用户角色/权限
  syncUserPerm(storage.get(USER_INFO_KEY));

  // ⑧ 安全防护：反调试（由 security.baiduJs.enable 控制，开启调试清空页面/跳转）
  const disposeSecurity = installAntiDebug();

  // ⑨ 配置热重载：监听后端配置版本变更，重新拉取设置并刷新安全防护/水印/socket
  bindConfigHotReload();
  // Socket：注入 token 获取函数；config.socket.enable 时创建全局连接
  setSocketTokenProvider(() => token.getAccessToken());
  const disposeSocket = initGlobalSocket(() => config.socket.enable);
  const disposeHotReload = onConfigHotReload(() => {
    refreshAntiDebug();
    applyGlobalWatermark();
    // 后端 Setting 变更 socket 字段后重建连接（enable/protocol/urls 变化均生效）
    initGlobalSocket(() => config.socket.enable);
  });

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
      disposeHotReload();
      disposeSocket();
    },
    disposeSocket,
  };
}

/** 反调试热更新：配置变更（setConfig）后调用，按需安装/卸载 */
export function refreshSecurity(): void {
  refreshAntiDebug();
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
    console.warn("[createApp] socket.enable=true 但未解析到可用地址，跳过连接");
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

/** ④ storage：storage.key 作为命名空间前缀，encode 开启时用 AES 变种加密值 */
function buildStorage(crypto: CryptoModule, config: AppConfig): StorageWrapper {
  let encodeFn: ((plain: string) => string) | undefined;
  let decodeFn: ((encrypted: string) => string) | undefined;
  if (config.storage.encode && config.storage.key) {
    const secret = new TextEncoder().encode(config.storage.key);
    encodeFn = (plain: string): string =>
      bytesToBase64(crypto.aesVariantEncrypt(new TextEncoder().encode(plain), secret));
    decodeFn = (encrypted: string): string =>
      new TextDecoder().decode(crypto.aesVariantDecrypt(base64ToBytes(encrypted), secret));
  }

  return createStorage(browserLocalStorage, {
    prefix: config.storage.prefix || config.storage.key || config.app.systemCode || "system",
    noPrefixKeys: config.storage.noPrefixKeys,
    encode: config.storage.encode,
    encodeFn,
    decodeFn,
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
  });
  return createHttp({ instance: httpInstance });
}

/** Uint8Array 转 base64 字符串 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** base64 字符串转 Uint8Array */
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
