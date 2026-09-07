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
import { install as installReButton } from "@repo/ui/re-button";
import { install as installReDialog } from "@repo/ui/re-dialog";
import { install as installReTable } from "@repo/ui/re-table";
import { install as installReForm } from "@repo/ui/re-form";
import { install as installReSelect } from "@repo/ui/re-select";
import { install as installReInput } from "@repo/ui/re-input";
import { install as installReInputNumber } from "@repo/ui/re-input-number";
import { install as installReTag } from "@repo/ui/re-tag";
import { install as installReSwitch } from "@repo/ui/re-switch";
import { install as installReDatePicker } from "@repo/ui/re-date-picker";
import { install as installReEmpty } from "@repo/ui/re-empty";
import { install as installRePagination } from "@repo/ui/re-pagination";
import { install as installReProgress } from "@repo/ui/re-progress";
import { install as installReUpload } from "@repo/ui/re-upload";
import { install as installReTime } from "@repo/ui/re-time";
import { install as installReText } from "@repo/ui/re-text";
import { install as installReTree } from "@repo/ui/re-tree";
import { install as ReKitInstall } from "@repo/ui/re-kit";
import App from "./App.vue";
import router from "./router";
import "@repo/ui/components/shared/re-inputs.css";
import "./styles/tokens.css";

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
  // 业务组件：按钮/表单/表格/输入/选择等
  const pluginInstalls: any[] = [
    installReButton, installReDialog, installReTable, installReForm, installReSelect,
    installReInput, installReInputNumber, installReTag, installReSwitch, installReDatePicker,
    installReEmpty, installRePagination, installReProgress, installReUpload, installReTime,
    installReText, installReTree, ReKitInstall,
  ];
  for (const p of pluginInstalls) {
    app.use(p);
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
