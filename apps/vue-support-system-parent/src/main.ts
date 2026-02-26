import { createStandardApp } from "@repo/core";

// 样式导入
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "element-plus/dist/index.css";
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/fonts/iconfont.css";
import "@repo/assets/style/layout/default/index.scss";
import "@repo/assets/style/modern-page.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

createStandardApp().then((bootstrap) => bootstrap.mount("#app"));
