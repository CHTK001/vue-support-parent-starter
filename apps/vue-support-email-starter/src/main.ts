/**
 * Email 邮箱管理系统入口文件
 * @author CH
 * @version 1.0.0
 * @since 2026-03-18
 */
import { createStandardApp } from "@repo/core";

// 应用专属样式
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/style/modern-page.scss";
import "./styles/index.scss";

createStandardApp().then((bootstrap) => bootstrap.mount("#app"));
