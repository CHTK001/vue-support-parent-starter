import { createStandardApp } from "@repo/core";
import { WebSocketPlugin } from "./utils/websocket";

// 应用专属样式
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/style/modern-page.scss";

createStandardApp({
  plugins: [WebSocketPlugin]
}).then(async bootstrap => bootstrap.mount("#app"));
