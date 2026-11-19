/**
 * vue-support-video-starter 应用入口
 *
 * 单页面模式（mode=single）：
 *   - ElementPlus 组件 / 样式由 createVite 的 ElementPlusResolver 编译期按需
 *     注入（性能清单 F1/F2：去掉全量 app.use(ElementPlus) 与 dist/index.css）；
 *     locale 由 App.vue 的 el-config-provider 提供
 *   - 仅注册必要 Re 组件 + 全局指令 + SVG sprite
 *   - 业务路由由本地 router.ts 提供（/ 资源浏览 + /watch/:id 播放）
 *   - 不挂 koi 主题 layout
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite } from "@repo/assets";
import { applyPrimaryColorVars, BRAND_COLOR_BLUE } from "@repo/utils";
import App from "./App.vue";
import router from "./router";
import "./styles/video.css";

/** 参照站品牌蓝（BRAND_COLOR_BLUE，tailwind blue-500）：EP 主色与 9 级色阶改由 themeColor.ts 统一派生注入（video.css 不再写死），与全站主题色同一出处；种子色常量与 ai 控制台共享 */
applyPrimaryColorVars(document.documentElement, BRAND_COLOR_BLUE, false);

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

/** 单页面应用最小化主题安装器：只做指令 / SVG sprite（EP 按需注入见文件头） */
async function installSinglePage(app: VueApp): Promise<void> {
  setupSvgSprite();
  setupCommonDirectives(app);
}

await createContextApp({
  appName: "vue-support-video-starter",
  title: "视频资源中心",
  mode: "single",
  install: installSinglePage,
})
  .app(App)
  // Re* 组件清单交给 @repo/app 的 .ui() 链安装（installUi 由 createContextApp
  // 在主题安装器之后执行）。本应用不挂 koi（无 app.yaml themeId），ReIcon 等
  // 不会被 koi 安装器自动注册，所以必须保留原清单中的每一项，不能用 core preset。
  .ui({ components: RE_COMPONENTS })
  .use(router)
  .mount("#app");
