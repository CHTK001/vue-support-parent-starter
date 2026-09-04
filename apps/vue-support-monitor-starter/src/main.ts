/**
 * vue-support-monitor-starter 单页沉浸式控制台入口
 *
 * 模式：mode=single（不挂 koi layout 壳，不嵌「鲤」框架）
 * 用途：本地实时预览自研 UI —— 工作台 / 告警 / 资产 / 远控（design.md v2）
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "./styles/tokens.css";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite } from "@repo/assets";
import { installUi } from "@repo/ui";
import App from "./App.vue";
import router from "./router";

/** 本页可能用到的 Re* 组件 */
const MONITOR_RE_COMPONENTS = [
  "ReButton",
  "ReIcon",
  "ReTag",
  "ReBadge",
  "ReInput",
  "ReInputNumber",
  "ReSelect",
  "ReDialog",
  "ReDrawer",
  "ReTable",
  "RePagination",
  "ReForm",
  "ReEmpty",
  "ReSkeleton",
  "ReCard",
  "ReStatusIndicator",
  "ReStatCard",
  "ReSectionHead",
  "ReSwitch",
  "ReText",
  "ReCountup",
  "ReTrend",
  "ReRemoteSelect",
  "ReLoading",
  "ReScrollbar",
  "ReTagFilter",
];

async function installSinglePage(app: VueApp): Promise<void> {
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
  await installUi(app, { components: MONITOR_RE_COMPONENTS });
}

await createContextApp({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  .use(router)
  .mount("#app");
