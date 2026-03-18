import { createStandardApp } from "@repo/core";

// 应用专属样式
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/style/modern-page.scss";
import "./styles/enhancements.scss";

createStandardApp().then(async (bootstrap) => bootstrap.mount("#app"));
