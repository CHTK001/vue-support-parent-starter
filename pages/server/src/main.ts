import { createContextApp } from "@repo/app";
import { install as ReButtonInstall } from "@repo/ui/re-button";
import { install as ReDialogInstall } from "@repo/ui/re-dialog";
import { install as ReDrawerInstall } from "@repo/ui/re-drawer";
import { install as ReTableInstall } from "@repo/ui/re-table";
import { install as ReFormInstall } from "@repo/ui/re-form";
import { install as ReSelectInstall } from "@repo/ui/re-select";
import { install as ReIconInstall } from "@repo/ui/re-icon";
import { install as ReInputInstall } from "@repo/ui/re-input";
import { install as ReInputNumberInstall } from "@repo/ui/re-input-number";
import { install as ReTagInstall } from "@repo/ui/re-tag";
import { install as ReSwitchInstall } from "@repo/ui/re-switch";
import { install as ReDatePickerInstall } from "@repo/ui/re-date-picker";
import { install as ReTreeInstall } from "@repo/ui/re-tree";
import { install as ReEmptyInstall } from "@repo/ui/re-empty";
import { install as RePaginationInstall } from "@repo/ui/re-pagination";
import { install as ReProgressInstall } from "@repo/ui/re-progress";
import { install as ReUploadInstall } from "@repo/ui/re-upload";
import { install as ReTimeInstall } from "@repo/ui/re-time";
import { install as ReTextInstall } from "@repo/ui/re-text";
import { install as ReKitInstall } from "@repo/ui/re-kit";
import { serverRoutes } from "./routes";
import "./styles/tokens.css";
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
 *  - Re 组件按需全局注册；ReKit 收纳轻量透传/美化组件（Option、FormItem、Row、Col、Radio 系列、TreeSelect、TableColumn、Dropdown 系列、Descriptions、Alert、Divider、Link、Avatar）
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
    ReInputInstall,
    ReInputNumberInstall,
    ReTagInstall,
    ReSwitchInstall,
    ReDatePickerInstall,
    ReTreeInstall,
    ReEmptyInstall,
    RePaginationInstall,
    ReProgressInstall,
    ReUploadInstall,
    ReTimeInstall,
    ReTextInstall,
    ReKitInstall,
  ])
  .routes(serverRoutes as never)
  .mount("#app");
