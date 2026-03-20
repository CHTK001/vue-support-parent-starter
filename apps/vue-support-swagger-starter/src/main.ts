import { createStandardApp } from "@repo/core";

<<<<<<< HEAD
// 样式导入
import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "element-plus/dist/index.css";
import "@repo/assets/styles/layout/default/index.scss";

createStandardApp({ enableTippy: false }).then((bootstrap) =>
=======
createStandardApp({ enableTippy: false }).then(async (bootstrap) =>
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  bootstrap.mount("#app"),
);
