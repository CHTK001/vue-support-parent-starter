import { createStandardApp } from "@repo/core";
import router from "./router";

// sync 使用暗色主题变量
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "@layout/default/styles/layout/reset.scss";
import "@layout/default/styles/layout/tailwind.css";
import "@layout/default/styles/layout/index.scss";
import "@layout/default/styles/font-encryption.scss";

createStandardApp({
  router,
  enableTippy: false,
}).then((bootstrap) => bootstrap.mount("#app"));
