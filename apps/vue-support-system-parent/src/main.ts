import { createStandardApp } from "@repo/core";

<<<<<<< HEAD
// 样式导入
import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "element-plus/dist/index.css";
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/fonts/iconfont.css";
import "@repo/assets/styles/layout/default/index.scss";
import "@repo/assets/styles/modern-page.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
=======
// 应用专属样式
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/style/modern-page.scss";
import "./styles/enhancements.scss";
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126

createStandardApp().then(async (bootstrap) => bootstrap.mount("#app"));
