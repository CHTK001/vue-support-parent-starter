/**
 * vue-support-remote-starter 应用入口
 *
 * 单页面模式（mode=single）：
 *   - 仅注册 ElementPlus + 全局图标 + 必要指令
 *   - 业务路由由本地 router.ts 提供（/remote 远控、/agents 被控端、/access 接入码）
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite } from "@repo/assets";
import App from "./App.vue";
import router from "./router";

/** 单页面应用最小化主题安装器 */
async function installSinglePage(app: VueApp): Promise<void> {
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
}

await createContextApp({
  appName: "vue-support-remote-starter",
  title: "远控管理台",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  .use(router)
  .mount("#app");
