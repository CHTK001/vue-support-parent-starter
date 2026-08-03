/**
 * @repo/languages —— 国际化
 *
 * 提供统一 i18n 实例（zh / en 内置），供所有主题 / 应用复用。
 * getMenuLanguage 用于把 "menu.xxx" key 翻译为菜单标题。
 */
import { createI18n } from "vue-i18n";

import zh from "./modules/zh";
import en from "./modules/en";

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

const i18n = createI18n({
  allowComposition: true,
  legacy: false,
  locale: getSafeBrowserLang(),
  messages: { zh, en },
});

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
