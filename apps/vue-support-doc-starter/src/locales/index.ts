import { createI18n } from "vue-i18n";
import zhCN from "./zh-CN";
import en from "./en";

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("locale") || "zh-CN",
  fallbackLocale: "en",
  messages: {
    "zh-CN": zhCN,
    en: en
  }
});

export function setLocale(locale: string) {
  i18n.global.locale.value = locale;
  localStorage.setItem("locale", locale);
}

export function getLocale() {
  return i18n.global.locale.value;
}

export default i18n;
