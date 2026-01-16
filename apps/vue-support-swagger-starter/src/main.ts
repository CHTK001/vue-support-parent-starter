// 在应用启动早期检测并设置深色主题与皮肤，避免FOUC问题
(function () {
  try {
    const layoutConfig = JSON.parse(localStorage.getItem("layout") || "{}");
    if (layoutConfig.darkMode) {
      document.documentElement.classList.add("dark");
    }
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
import { useElementPlus } from "@repo/plugins";
import { createApp } from "vue";

// 引入重置样式
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "element-plus/dist/index.css";
// 导入公共样式
import "@repo/assets/style/layout/default/index.scss";

const app = createApp(App);

getPlatformConfig(app).then(async config => {
  setupStore(app);
  app.use(router);
  await router.isReady();
  injectResponsiveStorage(app, config);
  app.use(useI18n).use(useElementPlus);
  app.mount("#app");
});

