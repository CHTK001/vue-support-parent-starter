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
import type { StorageWrapper } from "@repo/utils";
import { getUserInfo, createStorage, browserLocalStorage } from "@repo/utils";
import { log } from "@repo/utils";
import {
  defaultAppConfig,
  deepMerge,
  getStorageKey as sharedGetStorageKey,
  mergeAppConfig as sharedMergeAppConfig,
} from "./shared";
import { DEFAULT_MENU_ICON } from "./constants";

// 重新导出框架无关的纯函数 / 纯数据，保持对外导出不变（向后兼容所有 vue apps）
export { parseAppYaml, normalizeTopKey, getDefaultConfig } from "./shared";
export { defaultAppConfig } from "./shared";
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

/** 默认配置（没有 app.yaml 时全部走默认，定义见 ./shared） */
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
 * 解析菜单缺省图标：app.yaml 的 menuConfig.defaultIcon 优先，未配置时回退框架内置默认常量。
 *
 * 供「菜单数据归一化」（core 远程菜单 / @repo/app 静态路由树）与「菜单渲染层」（koi 布局）共用，
 * 保证菜单项未配置 icon 时仍有兜底图标，不出现空白图标位。
 */
export function resolveMenuDefaultIcon(): string {
  const configured = currentConfig.menu?.defaultIcon;
  return typeof configured === "string" && configured.trim()
    ? configured.trim()
    : DEFAULT_MENU_ICON;
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
  // 包装共享纯函数：注入响应式 currentConfig 与 userId 解析器，保持原有对外签名不变
  return sharedGetStorageKey(name, currentConfig, {
    ...opts,
    resolveUserId: getCurrentUserId,
  });
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
      log.warn(`[config] subscriber error`, error);
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
 * 重置为默认配置但不通知订阅者（供 loadConfig 批量提交内部使用）。
 * 与 resetConfig 的区别仅在「是否触发 onConfigChange」：
 * loadConfig 会在收集全部来源后统一 setConfig 一次，避免中间态
 * 触发订阅者多次更新 document.title 等 UI。
 */
export function resetConfigSilent(): AppConfig {
  applyMerge(currentConfig, defaultAppConfig);
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

/** 深合并实现已移至 ./shared，此处复用（供 setConfig 内部使用） */

/** 从默认值 + yaml 解析结果得到最终配置（不修改 currentConfig） */
export function mergeAppConfig(partial: Partial<AppConfig>): AppConfig {
  // 包装共享纯函数：默认值取自 defaultAppConfig，保持原有对外签名不变
  return sharedMergeAppConfig(defaultAppConfig, partial);
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
