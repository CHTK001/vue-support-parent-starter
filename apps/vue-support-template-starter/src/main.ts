/**
 * vue-support-template-starter 应用入口
 *
 * 单页面模式（mode=single）：
 *   - 仅注册 ElementPlus + 全局图标 + 必要 Re 组件
 *   - 业务路由由本地 router.ts 提供（/home 组件列表 + /debug/:name 调试）
 *   - 不挂 koi 主题 layout（无菜单/标签页等冗余）
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite } from "@repo/assets";
import { install as installReIcon } from "@repo/ui/re-icon";
import { install as installReSwitch } from "@repo/ui/re-switch";
import { install as installReButton } from "@repo/ui/re-button";
import { install as installReInput } from "@repo/ui/re-input";
import { install as installReTag } from "@repo/ui/re-tag";
import { install as installReBadge } from "@repo/ui/re-badge";
import { install as installReText } from "@repo/ui/re-text";
import { install as installReCard } from "@repo/ui/re-card";
import { install as installReEmpty } from "@repo/ui/re-empty";
import { install as installReSkeleton } from "@repo/ui/re-skeleton";
import { install as installReLoading } from "@repo/ui/re-loading";
import { install as installReImage } from "@repo/ui/re-image";
import { install as installReTime } from "@repo/ui/re-time";
import { install as installReStat } from "@repo/ui/re-stat";
import { install as installReTrend } from "@repo/ui/re-trend";
import { install as installReCountup } from "@repo/ui/re-countup";
import { install as installReTypeIt } from "@repo/ui/re-type-it";
import { install as installReStatusIndicator } from "@repo/ui/re-status-indicator";
import { install as installReDialog } from "@repo/ui/re-dialog";
import { install as installReDrawer } from "@repo/ui/re-drawer";
import { install as installReTab } from "@repo/ui/re-tab";
import { install as installReScrollbar } from "@repo/ui/re-scrollbar";
import { install as installReSelect } from "@repo/ui/re-select";
import { install as installReDatePicker } from "@repo/ui/re-date-picker";
import { install as installReForm } from "@repo/ui/re-form";
import { install as installReTree } from "@repo/ui/re-tree";
import { install as installReTable } from "@repo/ui/re-table";
import { install as installRePagination } from "@repo/ui/re-pagination";
import { install as installReTimeline } from "@repo/ui/re-timeline";
import { install as installReBreadcrumb } from "@repo/ui/re-breadcrumb";
import { install as installReColorize } from "@repo/ui/re-colorize";
import { install as installReAvatarCrop } from "@repo/ui/re-avatar-crop";
import { install as installReCropper } from "@repo/ui/re-cropper";
import { install as installReLazy } from "@repo/ui/re-lazy";
import { install as installReIp } from "@repo/ui/re-ip";
import { install as installReSearch } from "@repo/ui/re-search";
import { install as installReFilePicker } from "@repo/ui/re-file-picker";
import { install as installReUpload } from "@repo/ui/re-upload";
import { install as installReCode } from "@repo/ui/re-code";
import { install as installReStationMessage } from "@repo/ui/re-station-message";
import { install as installReSeamlessScroll } from "@repo/ui/re-seamless-scroll";
import { install as installReScrollNav } from "@repo/ui/re-scroll-nav";
import { install as installReChat } from "@repo/ui/re-chat";
import { install as installReRagChat } from "@repo/ui/re-rag-chat";
import { install as installReAlbum } from "@repo/ui/re-album";
import { install as installReCarousel } from "@repo/ui/re-carousel";
import { install as installReImageCompare } from "@repo/ui/re-image-compare";
import { install as installReImageGen } from "@repo/ui/re-image-gen";
import { install as installReVideoGen } from "@repo/ui/re-video-gen";
import { install as installReRagManager } from "@repo/ui/re-rag-manager";
import { install as installReEcharts } from "@repo/ui/re-echarts";
import { install as installReGraphCenter } from "@repo/ui/re-graph-center";
import { install as installReGraphCircle } from "@repo/ui/re-graph-circle";
import { install as installReGraphFixed } from "@repo/ui/re-graph-fixed";
import { install as installReGraphForce } from "@repo/ui/re-graph-force";
import { install as installReGraphMind } from "@repo/ui/re-graph-mind";
import { install as installReGraphRelation } from "@repo/ui/re-graph-relation";
import { install as installReGraphTree } from "@repo/ui/re-graph-tree";
import { install as installReGraph } from "@repo/ui/re-graph";
import { install as installReTagFilter } from "@repo/ui/re-tag-filter";
import App from "./App.vue";
import router from "./router";

/** 单页面应用最小化主题安装器 */
async function installSinglePage(app: VueApp): Promise<void> {
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
  // 一次性注册全部 Re* 组件，便于模板预览页直接以 PascalCase 使用
  await Promise.allSettled([
    installReIcon.install(app),
    installReSwitch.install(app),
    installReButton.install(app),
    installReInput.install(app),
    installReTag.install(app),
    installReBadge.install(app),
    installReText.install(app),
    installReCard.install(app),
    installReEmpty.install(app),
    installReSkeleton.install(app),
    installReLoading.install(app),
    installReImage.install(app),
    installReTime.install(app),
    installReStat.install(app),
    installReTrend.install(app),
    installReCountup.install(app),
    installReTypeIt.install(app),
    installReStatusIndicator.install(app),
    installReDialog.install(app),
    installReDrawer.install(app),
    installReTab.install(app),
    installReScrollbar.install(app),
    installReSelect.install(app),
    installReDatePicker.install(app),
    installReForm.install(app),
    installReTree.install(app),
    installReTable.install(app),
    installRePagination.install(app),
    installReTimeline.install(app),
    installReBreadcrumb.install(app),
    installReColorize.install(app),
    installReAvatarCrop.install(app),
    installReCropper.install(app),
    installReLazy.install(app),
    installReIp.install(app),
    installReSearch.install(app),
    installReFilePicker.install(app),
    installReUpload.install(app),
    installReCode.install(app),
    installReStationMessage.install(app),
    installReSeamlessScroll.install(app),
    installReScrollNav.install(app),
    installReChat.install(app),
    installReRagChat.install(app),
    installReRagManager.install(app),
    installReAlbum.install(app),
    installReCarousel.install(app),
    installReImageCompare.install(app),
    installReImageGen.install(app),
    installReVideoGen.install(app),
    installReEcharts.install(app),
    installReGraph.install(app),
    installReGraphCenter.install(app),
    installReGraphCircle.install(app),
    installReGraphFixed.install(app),
    installReGraphForce.install(app),
    installReGraphMind.install(app),
    installReGraphRelation.install(app),
    installReGraphTree.install(app),
    installReTagFilter.install(app),
  ]);
}

await createContextApp({
  appName: "vue-support-template-starter",
  title: "Vue Support Template",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  .use(router)
  .mount("#app");