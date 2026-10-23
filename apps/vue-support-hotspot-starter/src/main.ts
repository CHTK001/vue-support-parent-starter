/**
 * vue-support-hotspot-starter 入口 — APM 热点观测台（前后端分离独立应用）
 *
 * 单页模式（mode="single"）：
 *   - 不挂 koi 主题 / 登录守卫，保持独立应用形态；
 *   - ElementPlus、图标、指令、深色皮肤等仍由最小主题安装器完成；
 *   - Re* 组件清单交给 @repo/app 的 .ui() 链安装，不再在 main.ts 手写组件装配。
 *
 * 样式加载顺序有依赖关系，不可调整：
 *   1. element-plus index.css      组件基础样式
 *   2. dark/css-vars.css           Element 暗色变量表（本应用固定深色皮肤）
 *   3. styles/tokens.css           覆盖 Element 的 --el-* 为观测台色板
 *                                  —— 必须在 dark 之后，否则会被暗色表覆盖回默认蓝
 *   4. styles/layout.css           14 个视图共用的骨架与语义类
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite } from "@repo/assets";
import "./styles/tokens.css";
import "./styles/layout.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";

import App from "./App.vue";
import router from "./router";

/** 本应用使用的 Re* 组件 */
const RE_COMPONENTS = [
  "ReIcon",
  "ReButton",
  "ReInput",
  "ReInputNumber",
  "ReSelect",
  "ReSwitch",
  "ReTable",
  "ReTag",
  "ReStatCard",
  "ReDrawer",
  "ReDialog",
  "ReSkeleton",
  "ReEmpty",
  "ReTab",
  "ReTimeline",
  "ReEcharts",
];

/** 启用 Element Plus 暗色模式（APM 固定深色皮肤，配合上面的 dark/css-vars.css） */
document.documentElement.classList.add("dark");

/** 单页面应用最小化主题安装器：只做 ElementPlus / 图标 / 指令 / SVG sprite */
async function installSinglePage(app: VueApp): Promise<void> {
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
}

await createContextApp({
  appName: "vue-support-hotspot-starter",
  title: "APM 热点观测台",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  // Re* 组件清单交给 @repo/app 的 .ui() 链安装（installUi 在主题安装器之后执行）。
  // .ui() 只做全局注册补充；视图里显式 deep import 的 Re 组件不受影响。
  .ui({ components: RE_COMPONENTS })
  .use(router)
  .mount("#app");
