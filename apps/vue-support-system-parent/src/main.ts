// 在应用启动早期检测并设置深色主题与皮肤，避免FOUC问题
(function () {
  try {
    // 从localStorage中读取布局配置
    const layoutConfig = JSON.parse(localStorage.getItem("layout") || "{}");
    // 深色模式
    if (layoutConfig.darkMode) {
      document.documentElement.classList.add("dark");
    }
    // 主题皮肤（default/flat/enhanced）
    if (layoutConfig.themeSkin) {
      document.documentElement.setAttribute(
        "data-theme-skin",
        layoutConfig.themeSkin
      );
    }
  } catch (e) {
    console.warn("Failed to set theme from localStorage:", e);
  }
})();

import { getPlatformConfig, injectResponsiveStorage, useI18n } from "@repo/config";
import { router, setupStore } from "@repo/core";
import App from "./App.vue";

import { createApp, type Directive } from "vue";
// 引入重置样式
import "@repo/assets/style/layout/default/reset.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "@repo/assets/style/layout/default/tailwind.css";

import "element-plus/dist/index.css";
// 导入字体图标
import "@repo/assets/iconfont/iconfont.css";
import "@repo/assets/iconfont/iconfont.js";
// 导入公共样式
import "@repo/assets/style/layout/default/index.scss";
import "@repo/assets/style/modern-page.scss";
import "@repo/assets/style/stitch-global.scss";
import "@repo/assets/style/stitch-layout-overrides.scss";
// 自定义指令
//@ts-ignore
import * as directives from "@repo/core/directives";
// 字体加密指令
import { vFontEncryption } from "@layout/default";
// 全局注册@iconify/vue图标库
import { FontIcon, IconifyIconOffline, IconifyIconOnline } from "@repo/components/ReIcon";
// 全局注册按钮级别权限组件
import { Auth } from "@repo/components/ReAuth";
import ScTable from "@repo/components/ScTable/index.vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import ScDrawer from "@repo/components/ScDrawer/index.vue";
// 全局注册vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

// 异步加载WASM模块
import { initializeWasmModule } from "@repo/codec-wasm";

// 先加载WASM模块，再启动应用
initializeWasmModule()
  .then(() => {
    const app = createApp(App);
    Object.keys(directives).forEach(key => {
      app.directive(key, (directives as { [key: string]: Directive })[key]);
    });
    // 注册字体加密指令
    app.directive("font-encryption", vFontEncryption);

    app.component("IconifyIconOffline", IconifyIconOffline);
    app.component("IconifyIconOnline", IconifyIconOnline);
    app.component("FontIcon", FontIcon);

    app.component("Auth", Auth);
    app.component("ScTable", ScTable);
    app.component("ScDialog", ScDialog);
    app.component("ScDrawer", ScDrawer);

    // 动态导入大型依赖
    Promise.all([
      import("vue-tippy").then(m => m.default),
      import("click-outside-vue3").then(m => m.default),
      import("@vueuse/motion").then(m => m.MotionPlugin),
      import("vue-grid-layout").then(m => m.default),
      import("@pureadmin/table").then(m => m.default),
      import("@repo/plugins").then(m => m.useElementPlus),
    ]).then(([VueTippy, vClickOutside, MotionPlugin, VueGridLayout, Table, useElementPlus]) => {
      app.use(VueTippy);
      app.use(vClickOutside);

      getPlatformConfig(app).then(async config => {
        setupStore(app);
        app.use(router);
        await router.isReady();
        injectResponsiveStorage(app, config);
        app.use(MotionPlugin).use(VueGridLayout).use(useI18n).use(useElementPlus).use(Table);
        app.mount("#app");
      });
    });
  })
  .catch((error) => {
    console.error("Failed to initialize WASM module:", error);
    // 即使WASM加载失败，也启动应用，但可能会缺少某些功能
    const app = createApp(App);
    Object.keys(directives).forEach(key => {
      app.directive(key, (directives as { [key: string]: Directive })[key]);
    });
    // 注册字体加密指令
    app.directive("font-encryption", vFontEncryption);

    app.component("IconifyIconOffline", IconifyIconOffline);
    app.component("IconifyIconOnline", IconifyIconOnline);
    app.component("FontIcon", FontIcon);

    app.component("Auth", Auth);
    app.component("ScTable", ScTable);
    app.component("ScDialog", ScDialog);
    app.component("ScDrawer", ScDrawer);

    // 动态导入大型依赖
    Promise.all([
      import("vue-tippy").then(m => m.default),
      import("click-outside-vue3").then(m => m.default),
      import("@vueuse/motion").then(m => m.MotionPlugin),
      import("vue-grid-layout").then(m => m.default),
      import("@pureadmin/table").then(m => m.default),
      import("@repo/plugins").then(m => m.useElementPlus),
    ]).then(([VueTippy, vClickOutside, MotionPlugin, VueGridLayout, Table, useElementPlus]) => {
      app.use(VueTippy);
      app.use(vClickOutside);

      getPlatformConfig(app).then(async config => {
        setupStore(app);
        app.use(router);
        await router.isReady();
        injectResponsiveStorage(app, config);
        app.use(MotionPlugin).use(VueGridLayout).use(useI18n).use(useElementPlus).use(Table);
        app.mount("#app");
      });
    });
  });