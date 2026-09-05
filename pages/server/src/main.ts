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
import { install as ReOptionInstall } from "@repo/ui/re-option";
import { install as ReFormItemInstall } from "@repo/ui/re-form-item";
import { install as ReRowInstall } from "@repo/ui/re-row";
import { install as ReColInstall } from "@repo/ui/re-col";
import { install as ReRadioGroupInstall } from "@repo/ui/re-radio-group";
import { install as ReRadioInstall } from "@repo/ui/re-radio";
import { install as ReRadioButtonInstall } from "@repo/ui/re-radio-button";
import { install as ReTagInstall } from "@repo/ui/re-tag";
import { install as ReSwitchInstall } from "@repo/ui/re-switch";
import { install as ReDatePickerInstall } from "@repo/ui/re-date-picker";
import { install as ReTreeInstall } from "@repo/ui/re-tree";
import { install as ReTreeSelectInstall } from "@repo/ui/re-tree-select";
import { install as ReEmptyInstall } from "@repo/ui/re-empty";
import { install as RePaginationInstall } from "@repo/ui/re-pagination";
import { install as ReProgressInstall } from "@repo/ui/re-progress";
import { install as ReDescriptionsInstall } from "@repo/ui/re-descriptions";
import { install as ReDescriptionsItemInstall } from "@repo/ui/re-descriptions-item";
import { install as ReAlertInstall } from "@repo/ui/re-alert";
import { install as ReDividerInstall } from "@repo/ui/re-divider";
import { install as ReLinkInstall } from "@repo/ui/re-link";
import { install as ReUploadInstall } from "@repo/ui/re-upload";
import { install as ReTimeInstall } from "@repo/ui/re-time";
import { install as ReTextInstall } from "@repo/ui/re-text";
import { install as ReTableColumnInstall } from "@repo/ui/re-table-column";
import { serverRoutes } from "./routes";
import "./styles/page.css";
import "./styles/dialog.css";
import "@repo/ui/components/shared/re-inputs.css";

/**
 * 服务器资产应用入口（router 模式 + koi layout 体系）
 *
 * 与 vue-support-system-starter 一致：
 *  - 不传 install，由 createContextApp 按 getConfig().other.themeId=koi 自动加载 koi framework
 *  - koi framework 注册 layout/login/home 基础路由 + menu resolver
 *  - serverRoutes 挂到 layout 之下，侧边栏由 buildMenuFromRoutes 从路由自动生成
 *  - ElementPlus/图标/组件/指令由 installKoi 统一注册
 *  - Re 组件按需全局注册
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
    ReOptionInstall,
    ReFormItemInstall,
    ReRowInstall,
    ReColInstall,
    ReRadioGroupInstall,
    ReRadioInstall,
    ReRadioButtonInstall,
    ReTagInstall,
    ReSwitchInstall,
    ReDatePickerInstall,
    ReTreeInstall,
    ReTreeSelectInstall,
    ReEmptyInstall,
    RePaginationInstall,
    ReProgressInstall,
    ReDescriptionsInstall,
    ReDescriptionsItemInstall,
    ReAlertInstall,
    ReDividerInstall,
    ReLinkInstall,
    ReUploadInstall,
    ReTimeInstall,
    ReTextInstall,
    ReTableColumnInstall,
  ])
  .routes(serverRoutes as never)
  .mount("#app");
