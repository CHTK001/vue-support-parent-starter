/**
 * vue-support-video-starter 应用入口
 *
 * 单页面模式（mode=single）：
 *   - 仅注册 ElementPlus + 全局图标 + 必要 Re 组件
 *   - 业务路由由本地 router.ts 提供（/ 资源浏览 + /watch/:id 播放）
 *   - 不挂 koi 主题 layout
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite } from "@repo/assets";
import { installUi } from "@repo/ui";
import App from "./App.vue";
import router from "./router";
import "./styles/video.css";

/** 本应用使用的 Re* 组件 */
const RE_COMPONENTS = [
  "ReIcon",
  "ReButton",
  "ReInput",
  "ReTag",
  "ReCard",
  "ReEmpty",
  "ReSkeleton",
  "ReLoading",
  "ReImage",
  "ReStatusIndicator",
  "ReDialog",
  "RePagination",
  "ReSearch",
  "ReSelect",
];

/** 单页面应用最小化主题安装器 */
async function installSinglePage(app: VueApp): Promise<void> {
  setupSvgSprite();
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  setupCommonDirectives(app);
  await installUi(app, { components: RE_COMPONENTS });
}

await createContextApp({
  appName: "vue-support-video-starter",
  title: "视频资源中心",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  .use(router)
  .mount("#app");
