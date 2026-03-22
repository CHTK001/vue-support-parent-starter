import { createStandardApp } from "@repo/core";
import router from "./router";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import "element-plus/dist/index.css";
import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "@repo/assets/styles/layout/default/index.scss";
import "./styles/index.scss";

createStandardApp({
  router,
  setup: (app) => {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }
  },
}).then((bootstrap) => bootstrap.mount("#app"));
