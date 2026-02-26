import { createStandardApp } from "@repo/core";

// 样式导入
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "element-plus/dist/index.css";
import "@repo/assets/style/layout/default/index.scss";

createStandardApp({ enableTippy: false }).then((bootstrap) =>
  bootstrap.mount("#app"),
);
