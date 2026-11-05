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
  MenuFooterConfig,
  MonitorConfig,
  MenuCollapseConfig,
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
 * 解析分组导航增强开关：app.yaml 的 menuConfig.groupNav 优先，未配置时默认开启。
 *
 * 供 koi 纵向布局（vertical / classic / columns / double / optimum / group）共用：
 * 返回 true 时分组标题按分区标题排版、子项带图标、底部显示带文字的「设置」条目。
 * 刻意写成 `!== false` 而不是 `=== true`：app.yaml 与 main.ts 两处都可能不写该键，
 * 缺省必须是「开启」，否则老应用升级后样式会静默失效。
 *
 * @returns 分组导航增强是否开启（默认 true）
 */
export function resolveGroupNav(): boolean {
  return currentConfig.menu?.groupNav !== false;
}

/**
 * 菜单折叠形态（app.yaml menuConfig.collapse，仅垂直布局生效；迭代自 collapseToButton）。
 *
 * <p>按此组合出折叠后的可见形态：</p>
 * <ul>
 *   <li>showButton=false + showBar=yes  → 折叠后只显示 mini 图标菜单条（当前默认）</li>
 *   <li>showButton=true  + showBar=no   → 折叠后菜单区只保留一个「展开菜单」按钮</li>
 *   <li>showButton=true  + showBar=yes  → mini 菜单条 + 展开按钮（两者都留）</li>
 *   <li>showButton=false + showBar=no   → 折叠后侧边栏整体隐藏（主内容区铺满）</li>
 * </ul>
 *
 * <p>与 `collapseToButton` 的向下兼容映射（旧 app.yaml / 本地快照中可能仍只有 collapseToButton）：
 *   collapseToButton=true  → collapse.showButton=true, collapse.showBar=no
 *   collapseToButton=false → collapse.showButton=false, collapse.showBar=yes</p>
 *
 * @returns 菜单折叠形态配置（缺省 showButton=false, showBar=yes，即当前 mini 条默认）
 */
export function resolveMenuCollapse(): MenuCollapseConfig {
  const menu = currentConfig.menu ?? ({} as MenuConfig);
  if (menu.collapse) {
    return { showButton: false, showBar: "yes", ...menu.collapse } as MenuCollapseConfig;
  }
  // 旧 key 向下兼容：从未配置过 collapse 时，按 legacy collapseToButton 映射
  return {
    showButton: menu.collapseToButton === true,
    showBar: menu.collapseToButton === true ? "no" : "yes",
  } as MenuCollapseConfig;
}

/**
 * 侧边栏底部入口配置（menuConfig.footer）。
 *
 * <p>缺省值见 shared.ts：单个「设置」条目 → /system/config → 仅管理员，
 * 与历史行为一致。app.yaml 可整体替换成多条目；多条目时主按钮弹出菜单，
 * 单条目时直接就是按钮。</p>
 *
 * <p>这里只做结构兜底，不做条目过滤——「路由是否注册 / 是否管理员」依赖运行时
 * 路由表与登录态，属于渲染层的事。</p>
 *
 * @returns 底部入口配置；配置缺失时返回「不显示」
 */
export function resolveMenuFooter(): MenuFooterConfig {
  const footer = currentConfig.menu?.footer;
  if (!footer || !Array.isArray(footer.entries)) {
    return { enable: false, label: "", icon: "Setting", entries: [] };
  }
  return footer;
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
    const prefix = currentConfig.storage?.prefix || currentConfig.app?.systemCode || "system";
    const key = currentConfig.storage?.noPrefixKeys?.includes("userInfo")
      ? "userInfo"
      : `${prefix}:userInfo`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return "anonymous";
    const data = JSON.parse(raw) as { userId?: string | number; sysUserId?: string | number };
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
      console.warn(`[config] subscriber error`, error);
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
const USER_CONFIG_KEY = "user-config.v2";

/**
 * 旧版 key：整片持久化，分不清"用户改过"和"首访时的默认值"，
 * 会把 app.yaml 的开关永久压住。读到就直接丢弃（用户改动重新积累即可）。
 */
const LEGACY_USER_CONFIG_KEY = "user-config";

/** 缓存用户配置专用 storage，避免重复动态 import */
type UserConfigValue = string | number | boolean | null | object;
type UserConfigStorage = {
  set: <T extends UserConfigValue>(key: string, value: T, expires?: number) => boolean;
  get: <T>(key: string, defaultValue?: T | null) => T | null;
  remove: (key: string) => void;
};
let userConfigStorageInstance: UserConfigStorage | null = null;

/**
 * 返回用户配置专用的加密 StorageWrapper。
 *
 * 动态 import @repo/utils 避免模块加载期循环依赖：
 * @repo/utils/storage.ts 在模块顶会 import getConfig 并创建 localStore 单例（调用 getConfig），
 * 若 config.ts 顶部静态 import @repo/utils，会在 currentConfig 初始化前触发 TDZ 崩溃。
 * 此函数仅在运行时（saveUserConfig / restoreUserConfig 被调用时）执行，故安全。
 */
async function getUserConfigStorage(): Promise<UserConfigStorage> {
  if (userConfigStorageInstance) return userConfigStorageInstance;
  // @ts-ignore @repo/utils 是运行时可选依赖，config 不在构建图上静态依赖它
  const { createStorage, browserLocalStorage } = await import("@repo/utils");
  const storage = createStorage(browserLocalStorage, {
    prefix: currentConfig.storage?.prefix || currentConfig.app?.systemCode || "app",
    noPrefixKeys: currentConfig.storage?.noPrefixKeys,
    userScopeKeys: currentConfig.storage?.userScopeKeys,
    resolveUserId: getCurrentUserId,
    encode: currentConfig.storage?.encode,
  });
  userConfigStorageInstance = storage;
  return storage;
}

/** 用户可调配置的持久化范围（与 restoreUserConfig 读取的字段一致） */
type UserConfigSlice = "other" | "message" | "menu" | "login";

/**
 * 部署侧（app.yaml / 远程配置）决定的用户可调切片基线。
 * 在 restoreUserConfig 合并本地快照之前捕获，持久化时只写偏离基线的叶子。
 * 不这么做的话，首次访问就会把整份 other 快照下来，此后 app.yaml 里改掉的开关
 * （如 other.toolbar.announcement）永远被旧快照压住，关不掉。
 */
let userConfigBaseline: Partial<Record<UserConfigSlice, unknown>> | undefined;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 递归剔除与基线取值相同的叶子；整块相同返回 undefined */
function diffFromBaseline(base: unknown, cur: unknown): unknown {
  if (isPlainObject(base) && isPlainObject(cur)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(cur)) {
      const kept = diffFromBaseline(base[k], v);
      if (kept !== undefined) out[k] = kept;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return JSON.stringify(base) === JSON.stringify(cur) ? undefined : cur;
}

/** 取用户可调切片的纯数据副本（脱离 reactive 引用） */
function sliceSnapshot(): Partial<Record<UserConfigSlice, unknown>> {
  return {
    other: JSON.parse(JSON.stringify(currentConfig.other ?? null)),
    message: JSON.parse(JSON.stringify(currentConfig.message ?? null)),
    // 菜单展示项（如 collapseToButton）：设置抽屉可调，随用户配置持久化
    menu: JSON.parse(JSON.stringify(currentConfig.menu ?? null)),
    // 登录页可调项（验证码 / 滑块 / OTP）：设置抽屉可调，随用户配置持久化
    login: JSON.parse(JSON.stringify(currentConfig.login ?? null)),
  };
}

// ==================== 业务能力开关（app.yaml other.capabilities） ====================

/**
 * 读取业务能力开关。
 *
 * 未配置（或配置为 true）视为启用，保持"探测后台 → 未命中回落三方"的既有行为；
 * 显式写 false 即停用该能力：调用方据此跳过探测与请求，对应入口一并隐藏。
 *
 * @param key 能力 key（@repo/core BACKEND_CAPABILITIES 注册表中的键）
 * @returns 该能力当前是否启用
 */
export function isCapabilityEnabled(key: string): boolean {
  const capabilities = currentConfig.other?.capabilities;
  if (!capabilities || typeof capabilities !== "object") {
    return true;
  }
  return capabilities[key] !== false;
}

/**
 * 判断某能力是否被部署侧（app.yaml / 远程配置）显式关闭。
 *
 * 主题配置抽屉据此隐藏该项：部署侧关掉的能力不再提供 UI 开关（避免用户在界面上
 * 打开一个部署侧已声明不存在的能力）。用户在抽屉里自己关掉的不算部署侧关闭，
 * 项仍然显示、可以再打开。
 *
 * @param key 能力 key
 * @returns 部署侧是否显式关闭了该能力
 */
export function isCapabilityDeployOff(key: string): boolean {
  const baseline = userConfigBaseline?.other as { capabilities?: Record<string, boolean> } | undefined;
  return baseline?.capabilities?.[key] === false;
}

// ==================== 加载动画的部署侧接管（app.yaml other.loaderConfig） ====================

/** 加载动画部署侧策略（已归一化，调用方不必再判空/兜底） */
export interface LoaderDeployPolicy {
  /** 是否由部署侧接管（false = 完全不接管，用户自选，行为与未加本段配置一致） */
  locked: boolean;
  /** 动画键（原始值，历史键由调用方用别名表折叠） */
  animation: string;
  /** 首屏动画基准边长（px，已 clamp 到 8~512） */
  size: number;
  /** 动画主色（非法值已被替换为默认色） */
  color: string;
}

/** 加载动画的缺省值（与 defaultAppConfig.other.loaderConfig 一致） */
const LOADER_DEFAULTS: LoaderDeployPolicy = {
  locked: false,
  animation: "wave",
  size: 96,
  color: "#406eeb",
};

/**
 * 颜色是否是可安全写进 CSS 变量的取值。
 *
 * <p>只放行 {@code #rgb/#rrggbb/#rrggbbaa} 与 {@code rgb()/rgba()/hsl()/hsla()}：
 * 这个值最终会拼进 {@code style} 或 CSS 文本，放任任意字符串等于允许注入
 * （例如 {@code red;background:url(...)}），没必要留这个口子。</p>
 */
function isSafeCssColor(value: string): boolean {
  return (
    /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ||
    /^(?:rgb|hsl)a?\(\s*[\d.%\s,/+-]+\)$/i.test(value)
  );
}

/**
 * 解析加载动画的部署侧策略。
 *
 * <p>返回的是「最终生效值」，三处（首屏、ReLoader、主题配置预览）都读它，
 * 避免各自判 {@code enable} 与兜底导致一处锁定、一处没锁。</p>
 *
 * @returns 归一化后的策略；未接管时 {@code locked === false}
 */
export function resolveLoaderDeployPolicy(): LoaderDeployPolicy {
  const raw = currentConfig.other?.loaderConfig as
    | { enable?: unknown; animation?: unknown; size?: unknown; color?: unknown }
    | undefined;

  // 缺省必须是「不接管」：老应用没有这段配置时行为和改造前完全一样
  if (!raw || raw.enable !== true) {
    return { ...LOADER_DEFAULTS };
  }

  const animation =
    typeof raw.animation === "string" && raw.animation.trim()
      ? raw.animation.trim()
      : LOADER_DEFAULTS.animation;

  const rawSize = typeof raw.size === "number" ? raw.size : Number(raw.size);
  const size = Number.isFinite(rawSize)
    ? Math.min(512, Math.max(8, Math.round(rawSize)))
    : LOADER_DEFAULTS.size;

  const rawColor = typeof raw.color === "string" ? raw.color.trim() : "";
  const color = rawColor && isSafeCssColor(rawColor) ? rawColor : LOADER_DEFAULTS.color;

  return { locked: true, animation, size, color };
}

/**
 * 保存用户可调配置到 storage。
 * 只持久化设置面板能改的切片：other（工具栏/计时器/状态色）、message、menu、login，
 * 不保存接口地址 / 路由等系统级配置（仍由 app.yaml / 后端决定）。
 */
export async function saveUserConfig(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const current = sliceSnapshot();
    const snapshot: Record<string, unknown> = {};
    for (const key of Object.keys(current) as UserConfigSlice[]) {
      const value = current[key];
      if (value == null) continue;
      const base = userConfigBaseline?.[key];
      // 未捕获基线（不走 createApp 的宿主）时沿用整片持久化
      const kept = userConfigBaseline ? diffFromBaseline(base, value) : value;
      if (kept !== undefined) snapshot[key] = kept;
    }
    if (!Object.keys(snapshot).length && userConfigBaseline) {
      // 用户没有任何偏离部署配置的改动：不保留历史快照，让 app.yaml 完全生效
      const emptyStorage = await getUserConfigStorage();
      emptyStorage.remove(USER_CONFIG_KEY);
      return;
    }
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
    // 先记录部署侧的值：此刻本地快照尚未合并，即 app.yaml / 远程配置的最终结果
    userConfigBaseline = sliceSnapshot();
    const storage = await getUserConfigStorage();
    storage.remove(LEGACY_USER_CONFIG_KEY);
    const saved = storage.get<Partial<AppConfig>>(USER_CONFIG_KEY);
    if (saved && typeof saved === "object") {
      // 仅恢复用户可调字段（与上方 watch 写入的字段保持一致），
      // 避免历史 user-config 中的 app/route/http 等覆盖 yaml 加载值
      const { other, message, menu, login } = saved;
      const filtered: Partial<AppConfig> = {};
      if (other) {
        // 加载动画接管是**部署侧**决定（app.yaml），用户快照不得覆盖：
        // 历史快照里若带过这一片（或旧版本整片持久化过 other），恢复时直接丢弃。
        const restoredOther = {
          ...(other as unknown as Record<string, unknown>),
        };
        delete restoredOther.loaderConfig;
        filtered.other = restoredOther as unknown as AppConfig["other"];
      }
      if (menu) filtered.menu = menu as AppConfig["menu"];
      if (login) filtered.login = login as AppConfig["login"];
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
      currentConfig.menu,
      currentConfig.login,
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
  LoaderDeployConfig,
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
  DeepPartial,
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
