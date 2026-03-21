import { createStandardApp } from "@repo/core";
import router from "./router";

// sync 使用暗色主题变量
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "@repo/assets/styles/layout/default/index.scss";

createStandardApp({
  router,
  enableTippy: false,
}).then((bootstrap) => bootstrap.mount("#app"));
