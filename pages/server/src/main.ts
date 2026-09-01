import { createContextApp } from "@repo/app";
import { registerStaticMenu } from "@repo/pinia";
import { serverRoutes, serverMenus } from "./routes";

/**
 * 服务器资产应用入口（router 模式 + koi layout 体系）
 *
 * 与 vue-support-system-starter 一致：
 *  - 不传 install，由 createContextApp 按 getConfig().other.themeId=koi 自动加载 koi framework
 *  - koi framework 注册 layout/login/home 基础路由 + menu resolver
 *  - serverRoutes 挂到 layout 之下，serverMenus 驱动侧边栏
 *  - ElementPlus/图标/组件/指令由 installKoi 统一注册
 */

// 注册静态菜单（驱动 koi 侧边栏）
registerStaticMenu(serverMenus as never);

await createContextApp({
  appName: "pages-server",
  title: "Vue Support Server",
  mode: "router",
})
  .routes(serverRoutes as never)
  .mount("#app");
