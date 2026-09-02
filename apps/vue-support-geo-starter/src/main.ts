/**
 * vue-support-geo-starter 应用入口
 *
 * 单页模式（mode="single"）：
 *   - 注册 ElementPlus + 全局图标 + 常用 Re* 组件
 *   - 业务路由由本地 router.ts 提供（Hash 路由）
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "leaflet/dist/leaflet.css";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite } from "@repo/assets";
import { installUi } from "@repo/ui";
import App from "./App.vue";
import router from "./router";

/** 全局 Re* 组件（对应 packages/ui/src/components 目录） */
const GEO_RE_COMPONENTS = [
  "ReIcon",
  "ReButton",
  "ReInput",
  "ReInputNumber",
  "ReSelect",
  "ReTag",
  "ReBadge",
  "ReText",
  "ReCard",
  "ReEmpty",
  "ReSkeleton",
  "ReLoading",
  "ReDialog",
  "ReDrawer",
  "ReTabs",
  "ReStat",
  "ReStatCard",
  "ReProgress",
  "ReSwitch",
  "ReForm",
  "ReTable",
  "RePagination",
  "ReDatePicker",
  "ReUpload",
  "ReEcharts",
  "ReSectionHead",
];

async function installSinglePage(app: VueApp): Promise<void> {
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
  await installUi(app, { components: GEO_RE_COMPONENTS });
}

await createContextApp({
  appName: "vue-support-geo-starter",
  title: "GeoDownloader",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  .use(router)
  .mount("#app");