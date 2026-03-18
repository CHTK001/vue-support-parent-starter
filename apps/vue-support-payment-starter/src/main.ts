import { createStandardApp } from "@repo/core";
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/style/modern-page.scss";
import "./styles/index.scss";

/**
 * 支付系统应用入口
 * 使用标准应用初始化
 */
createStandardApp().then(async (bootstrap) => bootstrap.mount("#app"));
