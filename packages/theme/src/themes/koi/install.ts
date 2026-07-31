/**
 * koi 框架安装器 —— 把 koi 的整体能力注册到应用
 *
 * 用法：
 *   import { installKoi } from "@repo/theme/koi";
 *   const app = createApp(App);
 *   installKoi(app, { router });   // 注册 ElementPlus / 图标 / pinia / i18n / 组件 / 指令 / 样式
 *   app.use(router).mount("#app");
 */
import type { App } from "vue";
import type { Router } from "vue-router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "animate.css";
import pinia from "./stores/index";
import I18n from "./languages/index";
import KoiComponents from "./components/index";
import KoiDirectives from "./directives/index";
import { setupKoiSvgSprite } from "./utils/svgSprite";

export interface InstallKoiOptions {
  /** 应用路由实例（由调用方创建，注入以配合业务路由） */
  router?: Router;
  /** 是否自动注册 ElementPlus（默认 true） */
  elementPlus?: boolean;
  /** 是否注册 ElementPlus 全部图标为全局组件（默认 true） */
  elementIcons?: boolean;
}

export function installKoi(app: App, options: InstallKoiOptions = {}): App {
  const { router, elementPlus = true, elementIcons = true } = options;

  // koi 图标（#icon-koi-*）依赖全局 SVG sprite，先注入
  setupKoiSvgSprite();

  if (elementPlus) {
    app.use(ElementPlus, { locale: zhCn });
  }

  if (elementIcons) {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }
  }

  app.use(pinia);
  app.use(I18n);

  app.use(KoiComponents);
  app.use(KoiDirectives);

  if (router) {
    app.use(router);
  }

  return app;
}

export default installKoi;
