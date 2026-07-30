import { createI18n } from "vue-i18n";
import type { App } from "vue";

import zh from "./modules/zh";
import en from "./modules/en";

// @repo/config 已 export 真正的 I18n 实例（与 @repo/config/useI18n(app) 注册的是同一个）
// 由于 koi install 时机早于 useI18n(app)，app 上还没 $i18n；
// 但 module-level 的 i18n 变量始终可用。
import { i18n as repoConfigI18n } from "@repo/config";

/**
 * @description 安全获取浏览器语言
 */
const getSafeBrowserLang = (): string => {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'en';
    }

    const browserLang = navigator.language || (navigator as any).browserLanguage;

    if (!browserLang) return 'en';

    const lang = browserLang.toLowerCase().split('-')[0];
    return ["zh", "cn"].includes(lang) ? "zh" : "en";
  } catch (error) {
    console.error("Error detecting browser language:", error);
    return "en";
  }
};

const i18n = createI18n({
  allowComposition: true,
  legacy: false,
  locale: getSafeBrowserLang(),
  fallbackLocale: "zh",
  messages: {
    zh,
    en
  }
});

/**
 * 合并 koi messages 到 i18n 实例
 *
 * 适配：
 *   - I18n 实例（@repo/config 的 i18n）：target.global.mergeLocaleMessage(...)
 *   - vue-i18n 9 Composer（app.config.globalProperties.$i18n）：target.global 同样可访问
 *
 * 注意：Composer 是 Proxy，Object.keys(target) 会得到空数组，
 * 所以必须严格用 target.global.mergeLocaleMessage。
 */
export function applyKoiMessages(target: any): boolean {
  if (!target) return false;
  // 1) 优先尝试 target.global.mergeLocaleMessage（I18n / Composer 都满足）
  if (target.global && typeof target.global.mergeLocaleMessage === "function") {
    try {
      const g = target.global;
      // koi 自有 messages 顶层键是 "zh"/"en"；
      // @repo/config i18n 实例使用 "zh-CN"/"en-US"。
      // 同时合并两组 key，保证两种 locale 标识都能命中。
      g.mergeLocaleMessage("zh", zh);
      g.mergeLocaleMessage("en", en);
      g.mergeLocaleMessage("zh-CN", zh);
      g.mergeLocaleMessage("en-US", en);
      return true;
    } catch (e) {
      console.warn("[applyKoiMessages] target.global.mergeLocaleMessage failed", e);
      return false;
    }
  }
  // 2) 退化：target 本身就是 I18n 实例
  if (typeof target.mergeLocaleMessage === "function") {
    try {
      target.mergeLocaleMessage("zh", zh);
      target.mergeLocaleMessage("en", en);
      target.mergeLocaleMessage("zh-CN", zh);
      target.mergeLocaleMessage("en-US", en);
      return true;
    } catch (e) {
      console.warn("[applyKoiMessages] target.mergeLocaleMessage failed", e);
      return false;
    }
  }
  return false;
}

/**
 * Koi i18n install plugin
 *
 * 行为：
 *   1) 如果 app 上已注册 i18n（@repo/config 默认会注册），把 koi messages 合并进去
 *   2) 否则注册一份 koi 自有的 i18n 实例
 */
const KoiI18nPlugin = {
  install(app: App) {
    // 暴露 @repo/config 的真正 i18n 实例（与 useI18n(app) 注册的是同一个）
    if (typeof window !== "undefined") {
      (window as any).__KOI_I18N__ = repoConfigI18n || i18n;
    }
    // 优先使用 @repo/config 导出的 i18n 实例（与 useI18n(app) 注册的是同一个）
    if (
      repoConfigI18n &&
      repoConfigI18n.global &&
      typeof repoConfigI18n.global.mergeLocaleMessage === "function"
    ) {
      try {
        const g = repoConfigI18n.global;
        g.mergeLocaleMessage("zh", zh);
        g.mergeLocaleMessage("en", en);
        g.mergeLocaleMessage("zh-CN", zh);
        g.mergeLocaleMessage("en-US", en);
        return;
      } catch (e) {
        console.warn("[KoiI18nPlugin] @repo/config i18n merge failed", e);
      }
    }
    // 退化：尝试 app.config.globalProperties.$i18n
    const existing = (app as any).config?.globalProperties?.$i18n;
    if (existing && typeof existing.mergeLocaleMessage === "function") {
      try {
        existing.mergeLocaleMessage("zh", zh);
        existing.mergeLocaleMessage("en", en);
        return;
      } catch (e) {
        // ignore
      }
    }
    // 最后兜底：注册 koi 自有 i18n
    try {
      app.use(i18n);
    } catch (e) {
      // vue-i18n 已注册过则忽略
    }
  },
  version: "1.0.0",
};

export { KoiI18nPlugin };
export default KoiI18nPlugin;