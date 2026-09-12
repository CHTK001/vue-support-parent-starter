/**
 * pages-remote 入口
 *
 * 远程控制页面路由模式，注册 Re* 组件并挂载 remoteRoutes。
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
import { install as ReTabsInstall } from "@repo/ui/re-tabs";
import { install as ReAlertInstall } from "@repo/ui/re-alert";
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
    ReTabsInstall,
    ReAlertInstall,
    ReCardInstall,
  ])
  .routes(remoteRoutes as never)
  .mount("#app");
