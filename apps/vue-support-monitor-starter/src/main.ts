
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
import * as directives from "@repo/core";
// 字体加密指令
import { vFontEncryption } from "@layout/default";
// 字体加密：随机注册两个加密字体（对外名称保持固定且普通）
import { registerEncryptedFonts } from "@repo/font-encryption";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";
import { setupDirectives } from "./directives";
import { setupFullscreenSocket } from "./plugins/fullscreenSocket";
import GlobalSocketPlugin from "./plugins/globalSocket";

// 异步加载WASM模块
import { initializeWasmModule } from "@repo/codec-wasm";

/**
 * 启动并初始化监控应用
 */
async function bootstrapApp(): Promise<void> {
  await registerEncryptedFonts();

  const app = createApp(App);

  // 过滤 Element Plus / Vue 内部已知的无害告警，避免高频刷屏导致调试台卡顿
  app.config.warnHandler = (msg, instance, trace) => {
    if (typeof msg === "string") {
      // 插槽调用位置告警（ElSubMenu / ElCollapseTransition 内部触发）
      if (msg.includes('Slot "default" invoked outside of the render function')) {
        return;
      }

      // Element Plus Popper / Tooltip 在非单一元素根节点上使用运行时指令的告警
      if (msg.includes("Runtime directive used on component with non-element root node")) {
        return;
      }
    }

    // 保留其它告警输出，便于排查问题
    // eslint-disable-next-line no-console
    console.warn(msg, trace);
  };

  // 注册通用指令
  Object.keys(directives).forEach((key) => {
    app.directive(key, (directives as { [key: string]: Directive })[key]);
  });

  // 注册字体加密指令
  app.directive("font-encryption", vFontEncryption);

  // 注册全局组件
  app.component("IconifyIconOffline", IconifyIconOffline);
  app.component("IconifyIconOnline", IconifyIconOnline);
  app.component("FontIcon", FontIcon);
  app.component("Auth", Auth);
  app.component("ScTable", ScTable);
  app.component("ScCard", ScCard);
  app.component("ScSwitch", ScSwitch);
  app.component("ScDialog", ScDialog);
  app.component("ScDrawer", ScDrawer);

  // 注册第三方插件与自定义指令
  app.use(VueTippy);
  app.use(ElementPlusX);
  setupDirectives(app);

  // 加载平台配置并挂载应用
  getPlatformConfig(app).then(async (config) => {
    setupStore(app);
    app.use(router);
    await router.isReady();
    injectResponsiveStorage(app, config);
    app.use(MotionPlugin).use(useI18n).use(useElementPlus).use(Table);

    app.use(GlobalSocketPlugin);
    setupFullscreenSocket(router);
    app.mount("#app");
  });
}

// 先加载WASM模块，再启动应用
initializeWasmModule()
  .then(() => bootstrapApp())
  .catch((error) => {
    console.error("Failed to initialize WASM module:", error);
    // 即使WASM加载失败，也启动应用，但可能会缺少某些功能
    return bootstrapApp();
  });
