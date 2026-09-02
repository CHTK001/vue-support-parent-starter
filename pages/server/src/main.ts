import { createContextApp } from "@repo/app";
import { install as ReButtonInstall } from "@repo/ui/re-button";
import { install as ReDialogInstall } from "@repo/ui/re-dialog";
import { install as ReDrawerInstall } from "@repo/ui/re-drawer";
import { install as ReTableInstall } from "@repo/ui/re-table";
import { install as ReFormInstall } from "@repo/ui/re-form";
import { install as ReSelectInstall } from "@repo/ui/re-select";
import { install as ReIconInstall } from "@repo/ui/re-icon";
import { serverRoutes } from "./routes";
import "./styles/page.css";
import "./styles/dialog.css";

/**
 * 服务器资产应用入口（router 模式 + koi layout 体系）
 *
 * 与 vue-support-system-starter 一致：
 *  - 不传 install，由 createContextApp 按 getConfig().other.themeId=koi 自动加载 koi framework
 *  - koi framework 注册 layout/login/home 基础路由 + menu resolver
 *  - serverRoutes 挂到 layout 之下，侧边栏由 buildMenuFromRoutes 从路由自动生成
 *  - ElementPlus/图标/组件/指令由 installKoi 统一注册
 *  - Re 组件（ReButton/ReDialog/ReTable/ReForm/ReSelect/ReIcon）按需全局注册
 */

await createContextApp({
  appName: "pages-server",
  title: "Vue Support Server",
  mode: "router",
})
  .use([
    ReButtonInstall,
    ReDialogInstall,
    ReDrawerInstall,
    ReTableInstall,
    ReFormInstall,
    ReSelectInstall,
    ReIconInstall,
  ])
  .routes(serverRoutes as never)
  .mount("#app");
