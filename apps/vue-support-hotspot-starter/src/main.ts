/**
 * vue-support-hotspot-starter 入口 — APM 热点观测台（前后端分离独立应用）
 *
 * 单页模式（mode="single"）：
 *   - 不挂 koi 主题 / 登录守卫，保持独立应用形态；
 *   - ElementPlus、图标、指令等仍由最小主题安装器完成；
 *   - Re* 组件清单交给 @repo/app 的 .ui() 链安装，不再在 main.ts 手写组件装配。
 *
 * 样式策略（方案 C · koi 渐变数据台）：
 *   页面与令牌全部来自 @pages/hotsport 包（tokens.css 以系统 koi 变量为基底，
 *   浅色卡片 + 品牌渐变点缀，html[data-theme="dark"] 时自动切深色）。本文件
 *   只加载 Element Plus 基础样式，不再持有私有 tokens/layout 双份 —— 改主题
 *   只需改包，独立应用与其他集成方同步获得最新视觉。
 *
 * 样式加载顺序有依赖关系，不可调整：
 *   1. element-plus index.css      组件基础样式
 *   2. @pages/hotsport 的 tokens.css / layout.css（经 router 间接引入，
 *      覆盖 Element 的 --el-* 为 koi 观测台色板，必须在 element 基础之后）
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite } from "@repo/assets";
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

/**
 * 独立应用默认浅色（方案 C 数据台视觉）。深色由宿主或调用方在
 * html 上设置 data-theme="dark" 时自动生效（包 tokens.css 内置覆盖）。
 * Element Plus 的暗色变量表不再强制 .dark —— 避免与浅色令牌割裂。
 */

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
