import type { App } from "vue";

export { default as KoiLayout } from "./layouts/index.vue";
export { default as KoiComponents } from "./components/index.ts";
export { default as KoiDirectives } from "./directives/index";
export { default as pinia } from "./stores/index.ts";
export { default as I18n } from "./languages/index.ts";
export { default as router } from "./routers/index.ts";
export { useTheme } from "./utils/theme.ts";
export { useKoiConfig, useKoiConfigReactive, KoiConfigHelperPlugin } from "./utils/useKoiConfig.ts";
export { koiMsgSuccess, koiMsgWarning, koiMsgError, koiNoticeSuccess, koiNoticeWarning, koiNoticeError, koiMsgBox, koiMsgInfo } from "./utils/koi.ts";

import KoiLayoutComponent from "./layouts/index.vue";
import KoiComponentsPlugin from "./components/index.ts";
import KoiDirectivesPlugin from "./directives/index";
import KoiI18nPlugin, { applyKoiMessages } from "./languages/index.ts";
import { KoiConfigHelperPlugin } from "./utils/useKoiConfig.ts";

export const KoiLayoutPlugin = {
  install(app: App) {
    KoiI18nPlugin.install?.(app);
    KoiComponentsPlugin.install?.(app);
    KoiDirectivesPlugin.install?.(app);
    KoiConfigHelperPlugin.install?.(app);
    // 由于 KoiLayoutPlugin.install 在 @repo/core 的 corePlugins 注册之前调用，
    // 此时 app 上可能还没有 vue-i18n 实例。在 microtask 中重试一次合并，
    // 让 @repo/config 的 useI18n(app) 先完成 vue-i18n 注册。
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => {
        try {
          KoiI18nPlugin.install?.(app);
        } catch (e) {
          console.warn("[KoiLayoutPlugin] microtask i18n merge failed", e);
        }
      });
    }
    if (typeof window !== "undefined") {
      (window as any).__KOI_LAYOUT_INSTALLED__ = true;
    }
  },
  version: "2.0.0",
};

/** 默认导出 = Koi 主题主框架组件，供 @repo/core 路由系统作为根布局使用 */
export default KoiLayoutComponent;
