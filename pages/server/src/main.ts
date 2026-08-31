import { createContextApp } from "@repo/app";
import { registerStaticMenu } from "@repo/pinia";
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
import { install as installReTable } from "@repo/ui/re-table";
import { install as installReDialog } from "@repo/ui/re-dialog";
import { install as installReForm } from "@repo/ui/re-form";
import { install as installReSelect } from "@repo/ui/re-select";
import { serverRoutes, serverMenus } from "./routes";

/**
 * 服务器资产应用入口（router 模式）
 *
 * 复用 @repo/app 的 createContextApp + koi layout 体系：
 *  - mode=router 时挂载 AppWithRouter，基础路由（login/layout/home/error）由主题 koi 提供
 *  - 业务路由通过 serverRoutes 注册到 layout 之下，侧边栏菜单由 serverMenus 驱动
 *  - 与 vue-support-system-starter 完全一致的布局体系，复用 koi 主题样式
 */

/** 页面安装钩子：注册 Element Plus、图标、通用指令与 Re 组件 */
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
  await Promise.allSettled([
    (installReIcon as { install: (a: VueApp) => unknown }).install(app),
    (installReScrollNav as { install: (a: VueApp) => unknown }).install(app),
    (installReDrawer as { install: (a: VueApp) => unknown }).install(app),
    (installReCard as { install: (a: VueApp) => unknown }).install(app),
    (installReTable as { install: (a: VueApp) => unknown }).install(app),
    (installReDialog as { install: (a: VueApp) => unknown }).install(app),
    (installReForm as { install: (a: VueApp) => unknown }).install(app),
    (installReSelect as { install: (a: VueApp) => unknown }).install(app),
  ]);
}

// 注册静态菜单（驱动 koi 侧边栏）
registerStaticMenu(serverMenus as never);

await createContextApp({
  appName: "pages-server",
  title: "Vue Support Server",
  mode: "router",
  install: installSinglePage,
})
  .routes(serverRoutes as never)
  .mount("#app");
