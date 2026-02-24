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

import { createApp, type Directive } from "vue";
import Table from "@pureadmin/table";
import {
  getPlatformConfig,
  injectResponsiveStorage,
  useI18n,
} from "@repo/config";
import { router, setupStore } from "@repo/core";
import { useElementPlus } from "@repo/plugins";
import { MotionPlugin } from "@vueuse/motion";
import App from "./App.vue";
import ElementPlusX from "vue-element-plus-x";
// 引入重置样式
import "@/styles/threshold.scss";
import "@/styles/theme-common.scss";
import "@repo/assets/iconfont/iconfont.css";
import "@repo/assets/iconfont/iconfont.js";
import "@repo/assets/style/layout/default/index.scss";
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "@repo/assets/style/modern-page.scss";
import "element-plus/dist/index.css";
//@ts-ignore
import { Auth } from "@repo/components/ReAuth";
import {
  FontIcon,
  IconifyIconOffline,
  IconifyIconOnline,
} from "@repo/components/ReIcon";
import ScTable from "@repo/components/ScTable/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScCard from "@repo/components/ScCard/index.vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import ScDrawer from "@repo/components/ScDrawer/index.vue";
import * as directives from "@repo/core/directives";
// 字体加密指令
import { vFontEncryption } from "@layout/default";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";
import { setupDirectives } from "./directives";
import { setupFullscreenSocket } from "./plugins/fullscreenSocket";
import GlobalSocketPlugin from "./plugins/globalSocket";

// 异步加载WASM模块
import { initializeWasmModule } from "@repo/codec-wasm";

// 导入 TechUI 初始化函数
import techuiScifiInit from "@techui/scifi";
// 显式导入 TechUI 样式 (确保样式正确加载)
import "@techui/scifi/dist/index.css";

// 先加载WASM模块，再启动应用
initializeWasmModule()
  .then(async () => {
    const app = createApp(App);
    Object.keys(directives).forEach((key) => {
      app.directive(key, (directives as { [key: string]: Directive })[key]);
    });
    // 注册字体加密指令
    app.directive("font-encryption", vFontEncryption);
    app.component("IconifyIconOffline", IconifyIconOffline);
    app.component("IconifyIconOnline", IconifyIconOnline);
    app.component("FontIcon", FontIcon);

    app.component("Auth", Auth);
    app.component("ScTable", ScTable);
    app.component("ScCard", ScCard);
    app.component("ScSwitch", ScSwitch);
    app.component("ScDialog", ScDialog);
    app.component("ScDrawer", ScDrawer);

    app.use(VueTippy);
    // 使用 ElementPlusX
    app.use(ElementPlusX);

    // 初始化 TechUI 科幻组件库 (WASM 核心)
    try {
      console.log("[TechUI] 开始初始化...");
      await techuiScifiInit({
        app,
        license: null,
        features: { echarts: false, advanced: false },
        debug: true,
      });
      console.log("[TechUI] 初始化完成");
    } catch (err) {
      console.error("[TechUI] 初始化失败:", err);
    }

    app.config.warnHandler = (msg, instance, trace) => {
      if (msg.includes("__proxyIdCheat__")) return;
      console.warn(msg, trace);
    };
    // 注册指令
    setupDirectives(app);

    getPlatformConfig(app).then(async (config) => {
      setupStore(app);
      app.use(router);
      await router.isReady();
      injectResponsiveStorage(app, config);
      app.use(MotionPlugin).use(useI18n).use(useElementPlus).use(Table);
      // .use(PureDescriptions)
      // .use(useEcharts);

      app.use(GlobalSocketPlugin);
      setupFullscreenSocket(router);
      app.mount("#app");
    });
  })
  .catch((error) => {
    console.error("Failed to initialize WASM module:", error);
    // 即使WASM加载失败，也启动应用，但可能会缺少某些功能
    const app = createApp(App);
    Object.keys(directives).forEach((key) => {
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

    app.use(VueTippy);
    // 使用 ElementPlusX
    app.use(ElementPlusX);

    app.config.warnHandler = (msg, instance, trace) => {
      if (msg.includes("__proxyIdCheat__")) return;
      console.warn(msg, trace);
    };
    // 注册指令
    setupDirectives(app);

    getPlatformConfig(app).then(async (config) => {
      setupStore(app);
      app.use(router);
      await router.isReady();
      injectResponsiveStorage(app, config);
      app.use(MotionPlugin).use(useI18n).use(useElementPlus).use(Table);
      // .use(PureDescriptions)
      // .use(useEcharts);

      app.use(GlobalSocketPlugin);
      setupFullscreenSocket(router);
      app.mount("#app");
    });
  });
