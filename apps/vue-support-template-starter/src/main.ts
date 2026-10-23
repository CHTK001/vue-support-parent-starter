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
  "ReRelationGraph",
  "ReTagFilter",
  "ReAvatar3D",
  "ReThree",
  "ReClineCharacter",
  /* ⚠ 以下 7 项曾漏登记：注册表（src/data/componentRegistry.ts）里有卡片，
     但不在这里 → 卡片可点、预览是空的（Vue 把未注册的组件渲染成同名未知元素），
     页面不报错。`tests/e2e/registry-consistency.mjs` 专门守这条不变量：
     注册表里出现过的 Re* 必须都出现在本列表里。 */
  "ReCron",
  "ReColorize",
  "ReScrollbar",
  "ReUploadChunk",
  "ReIconSelect",
  "ReImageCompare",
  "ReGraph3D",
];

/** 单页面应用最小化主题安装器：只做 ElementPlus / 图标 / 指令 / SVG sprite */
async function installSinglePage(app: VueApp): Promise<void> {
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
}

await createContextApp({
  appName: "vue-support-template-starter",
  title: "Vue Support Template",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  // Re* 组件清单交给 @repo/app 的 .ui() 链安装：installUi 由 createContextApp
  // 内部在主题安装器之后调用，避免在主题安装器里手写 `await installUi`。
  // 模板预览需要全量组件（componentRegistry 逐项对照），所以保留 ALL_RE_COMPONENTS，
  // 不降级成 core preset —— 缺失时卡片可点但预览空白，且注册表一致性测试会守住这条不变量。
  .ui({ components: ALL_RE_COMPONENTS })
  .use(router)
  .mount("#app");