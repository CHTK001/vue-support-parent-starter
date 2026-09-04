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
import { install as installReCard } from "@repo/ui/re-card";
import { install as installReStatCard } from "@repo/ui/re-stat-card";
import { install as installReThree } from "@repo/ui/re-three";
import { install as installReMap3D } from "@repo/ui/re-map3d";
import App from "./App.vue";
import router from "./router";

async function installSinglePage(app: VueApp): Promise<void> {
  if (import.meta.env.DEV) {
    setUserRoles(["admin", "superadmin"]);
  }
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
  const installs: Array<Promise<unknown>> = [
    installReIcon.install(app),
    installReScrollNav.install(app),
    installReDrawer.install(app),
    installReCard.install(app),
    installReStatCard.install(app),
    installReThree.install(app),
  ];
  // ReMap3D 的 install 声明可能为可选成员，防御式调用
  if (installReMap3D.install) {
    installs.push(installReMap3D.install(app));
  }
  await Promise.allSettled(installs);
}

await createContextApp({
  appName: "pages-monitor",
  title: "Vue Support Monitor",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  .use(router)
  .mount("#app");