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
import { KoiConfigHelperPlugin } from "./utils/useKoiConfig.ts";

/**
 * Koi 主题 install plugin
 *
 * 负责：
 *   - 注册 Koi 全局组件（如 KoiCard、KoiSvgIcon、KoiScrollNav 等）
 *   - 注册 Koi 全局指令（如 v-auth、v-debounce 等）
 *   - 通过 provide/inject 暴露主题切换能力
 *   - 注入 $koiConfig 全局属性，让组件可通过 inject/useKoiConfig 访问
 *
 * 由 @repo/core 的 AppBootstrap 在 createStandardApp({ layout: "koi" }) 时调用。
 */
export const KoiLayoutPlugin = {
  install(app: App) {
    KoiComponentsPlugin.install?.(app);
    KoiDirectivesPlugin.install?.(app);
    KoiConfigHelperPlugin.install?.(app);
    if (typeof window !== "undefined") {
      (window as any).__KOI_LAYOUT_INSTALLED__ = true;
    }
  },
  version: "2.0.0",
};

/** 默认导出 = Koi 主题主框架组件，供 @repo/core 路由系统作为根布局使用 */
export default KoiLayoutComponent;
