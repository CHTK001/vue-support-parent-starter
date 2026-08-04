/**
 * 应用入口 —— vue-support-ai-starter
 *
 * 使用 createContextApp 单页面模式，加载自定义布局 App.vue，
 * App.vue 内包含 router-view 与框架提供的 router。
 *
 * 单页面模式不挂载 koi 主题的 layout（无菜单/标签页等冗余），仅注册
 * ElementPlus + 全部图标 + ReIcon/ScrollNav/Drawer 三个必要组件。
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import { setupCommonDirectives, setUserRoles } from "@repo/core";
import { setupSvgSprite } from "@repo/assets";
import { install as installReIcon } from "@repo/ui/re-icon";
import { install as installReScrollNav } from "@repo/ui/re-scroll-nav";
import { install as installReDrawer } from "@repo/ui/re-drawer";
import App from "@pages/ai/App.vue";
import router from "@pages/ai/router";

/** 最小化主题安装器：单页面应用只需 ElementPlus + 图标 + 必要 ReXxx */
async function installSinglePage(app: VueApp): Promise<void> {
  // dev 模式未登录，默认注入管理员角色，保证顶部菜单/管理页面可见
  if (import.meta.env.DEV) {
    setUserRoles(["admin", "superadmin"]);
  }
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
  await Promise.allSettled([
    installReIcon.install(app),
    installReScrollNav.install(app),
    installReDrawer.install(app),
  ]);
}

await createContextApp({
  appName: "vue-support-ai-starter",
  title: "Vue Support AI",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  .use(router)
  .mount("#app");
