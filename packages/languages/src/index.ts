/**
 * @repo/languages —— 国际化
 *
 * 提供统一 i18n 实例（zh / en），供所有主题 / 应用复用。
 * getMenuLanguage 用于把 "menu.xxx" key 翻译为菜单标题。
 *
 * 语言包懒加载（性能清单 X2）：createI18n 不再静态合并两份语言包，入口只
 * 装载浏览器当前语言；另一语言在首次切换时经动态 import 装载（独立 chunk）。
 * 首屏由 createVueApp 在挂载前对当前 locale 调一次 ensureLocaleMessages；
 * 语言切换（koi ReLanguage）先 await 它再改 locale，避免短暂显示 i18n key。
 */
import { createI18n } from "vue-i18n";

/** 安全获取浏览器语言 */
const getSafeBrowserLang = (): string => {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return "en";
    }
    const browserLang = navigator.language || (navigator as any).browserLanguage;
    if (!browserLang) return "en";
    const lang = browserLang.toLowerCase().split("-")[0];
    return ["zh", "cn"].includes(lang) ? "zh" : "en";
  } catch {
    return "en";
  }
};

/** 语言包动态装载器：各语言包独立成异步 chunk，按需拉取 */
const localeLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  zh: () => import("./modules/zh"),
  en: () => import("./modules/en"),
};

/** 语言键归一：zh-CN / cn → zh，其余取首段 */
const normalizeLocaleKey = (lang: unknown): string => {
  const first = String(lang ?? "")
    .toLowerCase()
    .split("-")[0];
  return first === "cn" ? "zh" : first;
};

const i18n = createI18n({
  allowComposition: true,
  legacy: false,
  locale: getSafeBrowserLang(),
  messages: {},
});

/** 已完成装载的语言；pendingKeys 防并发重复请求 */
const loadedKeys = new Set<string>();
const pendingKeys = new Map<string, Promise<void>>();

/**
 * 确保某语言的语言包已装载（幂等；并发调用共享同一 Promise）。
 * 装载失败不计入已装载，可重试。
 */
export const ensureLocaleMessages = (lang: unknown): Promise<void> => {
  const key = normalizeLocaleKey(lang);
  const loader = localeLoaders[key];
  if (!loader || loadedKeys.has(key)) {
    return Promise.resolve();
  }
  let pending = pendingKeys.get(key);
  if (!pending) {
    pending = loader()
      .then((mod) => {
        i18n.global.setLocaleMessage(key, mod.default as Record<string, unknown>);
        loadedKeys.add(key);
      })
      .finally(() => {
        pendingKeys.delete(key);
      });
    pendingKeys.set(key, pending);
  }
  return pending;
};

export default i18n;

/** i18n 语言切换菜单标题：title 以 "menu." 开头时走翻译，否则原样返回 */
export const getMenuLanguage = (title: string): string => {
  if (!title) return "";
  return title.startsWith("menu.") ? i18n.global.t(title) : title;
};

/**
 * 登录页配置文案翻译：value 以 "menu." 开头视为 i18n key 走翻译，否则原样返回。
 *
 * app.yaml loginConfig 的 title/welcome/description/featureTags.text 既支持
 * 直接写字面量（如 "欢迎登录"），也支持 i18n key（如 "menu.login.welcome"），
 * 便于切换语言时自动翻译。
 */
export const translateConfigText = (value: string | undefined): string => {
  if (!value) return "";
  return value.startsWith("menu.") ? i18n.global.t(value) : value;
};
