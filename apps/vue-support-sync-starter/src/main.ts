import { createStandardApp } from "@repo/core";
import router from "./router";

<<<<<<< HEAD
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "@repo/assets/styles/layout/default/index.scss";
=======
// sync 使用暗色主题变量
import "element-plus/theme-chalk/dark/css-vars.css";
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126

createStandardApp({
  router,
  enableTippy: false,
<<<<<<< HEAD
}).then((bootstrap) => bootstrap.mount("#app"));
=======
}).then(async (bootstrap) => bootstrap.mount("#app"));
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
