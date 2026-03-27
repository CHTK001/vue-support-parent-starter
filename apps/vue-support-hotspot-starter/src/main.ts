import { createStandardApp } from "@repo/core";
import { WebSocketPlugin } from "./utils/websocket";

import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "element-plus/dist/index.css";
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/fonts/iconfont.css";
import "@repo/assets/styles/layout/default/index.scss";
import "@repo/assets/styles/modern-page.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

createStandardApp({
  socketPlugins: [WebSocketPlugin]
}).then(bootstrap => bootstrap.mount("#app"));
