import { createStandardApp } from "@repo/core";
<<<<<<< HEAD
import router from "./router";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import "element-plus/dist/index.css";
import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "@repo/assets/styles/layout/default/index.scss";

createStandardApp({
  router,
  setup: (app) => {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }
  },
}).then((bootstrap) => bootstrap.mount("#app"));
=======
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/style/modern-page.scss";
import "./styles/index.scss";

/**
 * 支付系统应用入口
 * 使用标准应用初始化
 */
createStandardApp().then(async (bootstrap) => bootstrap.mount("#app"));
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
