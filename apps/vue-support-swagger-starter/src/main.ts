import { createStandardApp } from "@repo/core";

// 样式导入
import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "element-plus/dist/index.css";
import "@repo/assets/styles/layout/default/index.scss";

createStandardApp({ enableTippy: false }).then((bootstrap) =>
  bootstrap.mount("#app"),
);
