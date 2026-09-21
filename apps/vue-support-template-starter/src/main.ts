/**
 * vue-support-template-starter 应用入口
 *
 * 单页面模式（mode=single）：
 *   - 仅注册 ElementPlus + 全局图标 + 必要 Re 组件
 *   - 业务路由由本地 router.ts 提供（/home 组件列表 + /debug/:name 调试）
 *   - 不挂 koi 主题 layout（无菜单/标签页等冗余）
 *
 * 使用 installUi 批量注册全部 Re* 组件，便于模板预览页直接以 PascalCase 使用。
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
import { installUi } from "@repo/ui";
import App from "./App.vue";
import router from "./router";

/** 全部 Re* 组件名（与 packages/ui/src/components 目录对应） */
const ALL_RE_COMPONENTS = [
  "ReIcon",
  "ReSwitch",
  "ReButton",
  "ReInput",
  "ReTag",
  "ReBadge",
  "ReText",
  "ReCard",
  "ReEmpty",
  "ReSkeleton",
  "ReLoading",
  "ReImage",
  "ReImageGroup",
  "ReTime",
  "ReStat",
  "ReTrend",
  "ReCountup",
  "ReTypeIt",
  "ReStatusIndicator",
  "ReDialog",
  "ReDrawer",
  "ReTab",
  "ReBreadcrumb",
  "ReScrollNav",
  "ReSeamlessScroll",
  "ReSelect",
  "ReDatePicker",
  "ReForm",
  "ReTree",
  "ReTable",
  "RePagination",
  "ReTimeline",
  "ReAvatarCrop",
  "ReCropper",
  "ReLazy",
  "ReIp",
  "ReSearch",
  "ReFilePicker",
  "ReUpload",
  "ReCode",
  "ReStationMessage",
  "ReChat",
  "ReRagChat",
  "ReRagManager",
  "ReAlbum",
  "ReCarousel",
  "ReImageGen",
  "ReVideoGen",
  "ReEcharts",
  "ReGraph",
  "ReGraphForce",
  "ReGraphMind",
  "ReGraphTree",
  "ReGraphCircle",
  "ReGraphCenter",
  "ReGraphFixed",
  "ReGraphRelation",
  "ReTagFilter",
  "ReAvatar3D",
  "ReThree",
  "ReClineCharacter",
];

/** 单页面应用最小化主题安装器 */
async function installSinglePage(app: VueApp): Promise<void> {
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
  // 一次性注册全部 Re* 组件（installUi 内部按 componentLoaders 动态 import，
  // 普通 Plugin 走 app.use，主题化组件走 await plugin.install）
  await installUi(app, { components: ALL_RE_COMPONENTS });
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