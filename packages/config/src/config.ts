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
 *   - setConfig(partial)  → 合并写入（系统级键受只读保护，被拦截的键会 warn 并拒绝）
 *   - applyConfig(partial)→ 合并写入（框架启动期 / 授权路径使用，不受只读保护）
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
 * 解析「HTTP 请求是否驱动顶部进度条」开关（app.yaml httpConfig.showLoading）。
 *
 * <p>两种写法并存，必须都认：布尔值，以及早期被当成能力开关写的
 * `showLoading: { enable: false }`。</p>
 *
 * <p>对象写法一定要先取 enable：把非空对象直接丢进 `if (showLoading)` 恒为真，
 * 于是 `{ enable: false }` 反而把顶部条打开了 —— 这正是监控端「yaml 里写了
 * false，切页/筛选时顶部条照旧每个请求跑一次」的根因。</p>
 *
 * @param value app.yaml / 默认值里的原始配置（布尔 / 对象 / 缺省）
 * @returns 是否让 HTTP 请求驱动顶部进度条（缺省 false）
 */
export function resolveHttpShowLoading(value?: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (isPlainObject(value)) {
    const enable = (value as { enable?: unknown }).enable;
    if (typeof enable === "boolean") return enable;
  }
  return false;
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

// ==================== 系统配置（部署侧）只读保护 ====================

/**
 * 只能随系统初始化落盘的顶层键（全部子键禁止运行时写回）。
 *
 * 这些键决定了应用的通信地址、鉴权态、存储命名空间、路由表与模块显隐——
 * 让它们出现在运行时等于允许任意页面把请求指到攻击者地址、改写登录态存储 key、
 * 关闭水印/OCR 混淆/反调试。它们只能随 app.yaml、远程配置或代码级默认
 * 配置在初始化阶段落盘，用户配置抽屉里只有 other / menu / message / login 可调。
 */
const DEPLOY_SIDE_BLOCKED_TOP_KEYS: ReadonlySet<string> = new Set([
  "config", // 配置中心（enable / 远端开关）
  "token", // 令牌存储 key 与刷新策略
  "http", // 请求地址 / 加密封装 / 签名密钥
  "storage", // 存储前缀 / 加密 / 用户隔离
  "crypto", // 加密封装
  "url", // 接口地址
  "route", // 路由模式 / 白名单
  "permission", // 角色标识
  "system", // 模块显隐
  "monitor", // 全局异常监控
  "apm", // APM 观测
]);

/**
 * other 下由部署侧锁死的子树（均随 app.yaml 决策）：
 * - capabilities：能力开关一旦被作用于运行时，未授权能力被打开，对应入口显示出来；
 * - loaderConfig：加载动画接管越权，覆盖部署侧锁定（首屏动画与主题抽屉脱靶）。
 * 其余 other.*（toolbar / timer / weather / bigscreen / aiChat …）是用户可调切片，
 * 可写。
 */
const DEPLOY_SIDE_BLOCKED_OTHER_KEYS: ReadonlySet<string> = new Set([
  "capabilities",
  "loaderConfig",
]);

/**
 * `setConfig`（运行时公开写回）的 security 子树放行白名单。
 *
 * 注意它与 safe-path.ts 的远程注入白名单不同：这里是 setConfig 的只读保护拦截器，
 * 只允许用户在运行时改 `security.baiduJs`（反爬脚本下发）；`security.watermark` 与
 * `security.dynamicFont` 虽然不在运行时可写回范围内（必须随 app.yaml），但可作为
 * 授权通道（loadConfig / mergeDefaultSetting）落盘（见 REMOTE_INJECTABLE_PATH_PREFIXES），
 * 所以 `setConfig({security: {watermark: {...}}})` / `setConfig({security: {dynamicFont: {...}}})`
 * 仍然会被拒绝。
 *
 * 反爬脚本下发（security.baiduJs 子树）被设计为「管理员在后台配值、前端按下发值
 * 注入外部脚本」的产品功能，会被 /v2/setting/default 正常下发；若连它一起拒，
 * 后台配置的安全策略在前端永远不生效。其余 security.*（ocrObfuscation 等）
 * 必须随 app.yaml，禁止运行时写回。
 */
const DEPLOY_SIDE_SECURITY_ALLOW_PREFIX = "security.baiduJs";

/**
 * `keyPath` 是否属于只能在系统初始化时写入的系统配置（部署侧键）。
 *
 * <p>按前缀匹配（含整树），例如：</p>
 * <ul>
 *   <li>"http" / "token" / "storage" / "crypto" / "url" / "route" / "permission" /
 *       "system" / "monitor" / "apm" / "config"  → 整树禁止</li>
 *   <li>"security"  → 整树禁止，仅 "security.baiduJs.*" 子树放行</li>
 *   <li>"other"  → 仅 "other.capabilities" 与 "other.loaderConfig" 禁止</li>
 * </ul>
 *
 * @param keyPath 点号路径；顶层 key 调用时 path 为空，此时 keyPath 就是该 key
 */
function isDeploySideKey(keyPath: string): boolean {
  if (DEPLOY_SIDE_BLOCKED_TOP_KEYS.has(keyPath)) return true;
  // security 整树受保护，仅百度 js 反爬脚本下发子树放行
  if (keyPath.startsWith("security.")) return !keyPath.startsWith(DEPLOY_SIDE_SECURITY_ALLOW_PREFIX);
  // other 下仅两子树受保护
  if (keyPath.startsWith("other.")) return DEPLOY_SIDE_BLOCKED_OTHER_KEYS.has(keyPath.slice(6));
  return false;
}

/**
 * 拦截对部署侧键的写回，返回「可写回的部分」。
 *
 * <p>被拒绝的整棵子树 / 整键直接从 patch 中剔除，写入相邻（不截断本次 setConfig
 * 中合法的用户配置）；所有被拒绝的 keyPath 收集到 warned 中，交由 `setConfig`
 * 统一输出警告，方便排查。</p>
 */
function pruneDeploySideKeys(
  partial: unknown,
  keyPath: string,
  warned: string[],
): unknown {
  if (isPlainObject(partial)) {
    // 整个子树禁止写回（security 整树、other.capabilities、other.loaderConfig …）
    if (isDeploySideKey(keyPath)) {
      warned.push(keyPath);
      return undefined;
    }
    const rewritten: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(partial as Record<string, unknown>)) {
      const sub = pruneDeploySideKeys(
        value,
        keyPath ? `${keyPath}.${key}` : key,
        warned,
      );
      if (sub !== undefined) rewritten[key] = sub;
    }
    return rewritten;
  }
  // 基础类型 / null / 数组：按原值写回
  return partial;
}

/** 合并写入统一配置（深合并） */
export function setConfig(partial: Partial<AppConfig>): AppConfig {
  const warned: string[] = [];
  // 系统配置只读保护：拦截 + 警告被禁止的键，允许的部分照常合并
  const writable = pruneDeploySideKeys(
    partial as unknown as Record<string, unknown>,
    "",
    warned,
  );
  if (warned.length > 0) {
    console.warn(
      `[config] 拒绝通过 setConfig 修改系统配置（系统值只能在初始化时生效）：\n` +
        `${warned.map((keyPath) => `  - ${keyPath}`).join("\n")}\n` +
        "  如需修改请编辑 app.yaml 或通过受信任的初始化路径（loadConfig / restoreUserConfig / applyConfig）写入。",
    );
  }
  return applyConfig(writable as Partial<AppConfig>);
}

/**
 * 内部配置写入通道（不受 setConfig 只读保护约束）。
 *
 * 角色：让框架的授权路径承诺「在系统初始化阶段落盘的部署侧值」不被只读保护拦截，
 * 与 `setConfig` 的保护互补。任何写死在 app.yaml / 远程设置 / 用户快照里的值，
 * 都应通过此通道达成；公开给用户的写入方法仍是受保护的 `setConfig`。
 *
 * 授权调用方：
 *   - loadConfig（app.yaml / 远程 / 环境变量合并后的最终配置）
 *   - mergeDefaultSetting（远程设置推齐，经 safe-path 白名单）
 *   - restoreUserConfig（用户可调切片恢复）
 *   - resetConfig / resetConfigSilent
 *   - applyTitle（turbo/app 内部标题覆盖）
 *
 * @internal
 */
export function applyConfig(partial: Partial<AppConfig>): AppConfig {
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

/**
 * 深重置 `currentConfig`：把当前配置里**默认配置没有的键**逐层清掉（运行时通过
 * 内部通道注入的值、承诺写不进 app.yaml 的值），只保留与 `defaultAppConfig` 同构的部分。
 *
 * 只处理普通对象分支：数组 / 标量直接交还给 `applyConfig` / `applyMerge` 按默认值覆盖；
 * 递归根是 `defaultAppConfig`，它的结构就是“该有”的部分，不在它里面的键都是注入态。
 */
function resetToDefaults(config: unknown, defaults: unknown): void {
  const t = config as unknown as Record<string, unknown>;
  const d = defaults as unknown as Record<string, unknown>;
  for (const key of Object.keys(t)) {
    if (!(key in d)) {
      delete t[key];
      continue;
    }
    const child = t[key];
    if (isPlainObject(child) && isPlainObject(d[key])) {
      resetToDefaults(child, d[key]);
    }
  }
}

/** 重置为默认配置（内部写回通道，不经过 `setConfig` 只读保护） */
export function resetConfig(): AppConfig {
  // 文档承诺的是“重置为默认配置”：先清掉运行时注入的注入态，再完整落盘默认值
  resetToDefaults(currentConfig, defaultAppConfig);
  return applyConfig(defaultAppConfig);
}

/**
 * 重置为默认配置但不通知订阅者（供 loadConfig 批量提交内部使用）。
 * 与 resetConfig 的区别仅在「是否触发 onConfigChange」：
 * loadConfig 会在收集全部来源后统一 applyConfig 一次，避免中间态
 * 触发订阅者多次更新 document.title 等 UI。
 */
export function resetConfigSilent(): AppConfig {
  resetToDefaults(currentConfig, defaultAppConfig);
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
 * 该函数现为 tool 函数：主题配置抽屉不再展示业务能力开关（由系统配置 / app.yaml 管），
 * 部署侧关掉的能力在顶栏缘由 `isCapabilityEnabled` 处理隐藏。
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
  /** 首屏动画基准边长（px，已 clamp 到 8~512；宽窄屏两档） */
  size: { narrow: number; wide: number };
  /** 动画主色（非法值已被替换为默认色） */
  color: string;
  /** 速度倍率（0.5~3，1 = 原速） */
  speed: number;
  /** 主色是否跟随主题主色（--el-color-primary） */
  adaptColor: boolean;
}

/** 加载动画的缺省值（与 defaultAppConfig.other.loaderConfig 一致） */
const LOADER_DEFAULTS: LoaderDeployPolicy = {
  locked: false,
  animation: "dots",
  size: { narrow: 96, wide: 96 },
  color: "#406eeb",
  speed: 1,
  adaptColor: false,
};

/** 首屏尺寸的上下限（px） */
const LOADER_SIZE_MIN = 8;
const LOADER_SIZE_MAX = 512;

/** 速度倍率的上下限 */
const LOADER_SPEED_MIN = 0.5;
const LOADER_SPEED_MAX = 3;

/** 归一化单个尺寸值：非法值用兜底，越界 clamp */
function normalizeLoaderSize(value: unknown, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(LOADER_SIZE_MAX, Math.max(LOADER_SIZE_MIN, Math.round(num)));
}

/**
 * 归一化尺寸配置。
 *
 * <p>兼容两种写法：{@code size: 96}（宽窄屏同值，历史写法）与
 * {@code size: { narrow: 72, wide: 96 }}（按断点分档）。</p>
 */
function normalizeLoaderSizeConfig(value: unknown): { narrow: number; wide: number } {
  if (value && typeof value === "object") {
    const obj = value as { narrow?: unknown; wide?: unknown };
    const narrow = normalizeLoaderSize(obj.narrow, LOADER_DEFAULTS.size.narrow);
    const wide = normalizeLoaderSize(obj.wide, narrow);
    return { narrow, wide };
  }
  const size = normalizeLoaderSize(value, LOADER_DEFAULTS.size.narrow);
  return { narrow: size, wide: size };
}

/** 归一化速度倍率：非法值给 1，越界 clamp */
function normalizeLoaderSpeed(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return LOADER_DEFAULTS.speed;
  return Math.min(LOADER_SPEED_MAX, Math.max(LOADER_SPEED_MIN, Math.round(num * 100) / 100));
}

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
    | {
        enable?: unknown;
        animation?: unknown;
        size?: unknown;
        color?: unknown;
        speed?: unknown;
        adaptColor?: unknown;
      }
    | undefined;

  // 缺省必须是「不接管」：老应用没有这段配置时行为和改造前完全一样
  if (!raw || raw.enable !== true) {
    // 深拷贝：size 是对象，浅拷贝会让调用方改到缺省值
    return { ...LOADER_DEFAULTS, size: { ...LOADER_DEFAULTS.size } };
  }

  const animation =
    typeof raw.animation === "string" && raw.animation.trim()
      ? raw.animation.trim()
      : LOADER_DEFAULTS.animation;

  const size = normalizeLoaderSizeConfig(raw.size);

  const rawColor = typeof raw.color === "string" ? raw.color.trim() : "";
  const color = rawColor && isSafeCssColor(rawColor) ? rawColor : LOADER_DEFAULTS.color;

  return {
    locked: true,
    animation,
    size,
    color,
    speed: normalizeLoaderSpeed(raw.speed),
    adaptColor: raw.adaptColor === true,
  };
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
        // restoreUserConfig：用户可调切片的恢复写回（internal channel），
        // 不经过 setConfig 只读保护（被保护的 loaderConfig 已在下方删除）
        applyConfig(filtered);
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
  LoaderDeploySizeConfig,
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
