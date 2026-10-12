/**
 * pages-remote 入口
 *
 * 远程控制页面路由模式，注册 Re* 组件并挂载 remoteRoutes。
 *
 * 关于 ReTabs / ReAlert：原先这里 import 了 `@repo/ui/re-tabs` 与 `@repo/ui/re-alert`，
 * 但 packages/ui 从未提供这两个组件（只有单数的 `@repo/ui/re-tab`），两行 import 会稳定
 * 报 TS2307，且 delete 之后运行时行为不变——本包的视图用的是 `el-tabs` / `el-alert`
 * （Element Plus 标签），从未用到任何 Re 版 tabs/alert。因此按无用引用删除，不要再加回来。
 *
 * 仍未解决的问题（不在本次改动范围，另行处理）：本包从未 `app.use(ElementPlus)`，
 * 且 pages/remote 没有任何宿主应用引用，所以 `el-tabs` / `el-alert` 目前渲染不出来。
 *
 * @author CH
 * @since 4.0.0
 */
import { createContextApp } from "@repo/app";
import { install as ReButtonInstall } from "@repo/ui/re-button";
import { install as ReDialogInstall } from "@repo/ui/re-dialog";
import { install as ReTableInstall } from "@repo/ui/re-table";
import { install as ReFormInstall } from "@repo/ui/re-form";
import { install as ReSelectInstall } from "@repo/ui/re-select";
import { install as ReIconInstall } from "@repo/ui/re-icon";
import { install as ReInputInstall } from "@repo/ui/re-input";
import { install as ReTagInstall } from "@repo/ui/re-tag";
import { install as ReSwitchInstall } from "@repo/ui/re-switch";
import { install as ReCardInstall } from "@repo/ui/re-card";
import { remoteRoutes } from "./routes";
import "./styles/remote.css";

await createContextApp({
  appName: "pages-remote",
  title: "Vue Support Remote",
  mode: "router",
})
  .use([
    ReButtonInstall,
    ReDialogInstall,
    ReTableInstall,
    ReFormInstall,
    ReSelectInstall,
    ReIconInstall,
    ReInputInstall,
    ReTagInstall,
    ReSwitchInstall,
    ReCardInstall,
  ])
  .routes(remoteRoutes as never)
  .mount("#app");
