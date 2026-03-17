// 拦截 @mmt817/pixel-ui 的 banner 打印，避免控制台噪音
const _consoleInfo = console.info;
console.info = (...args: any[]) => {
  const first = args[0];
  if (typeof first === "string" && (first.includes("MMT") || first.includes("mmt817") || first.includes("pixel-ui"))) return;
  _consoleInfo(...args);
};

import { createStandardApp } from "@repo/core";
import { setupDirectives } from "./directives";
import { setupFullscreenSocket } from "./plugins/fullscreenSocket";
import GlobalSocketPlugin from "./plugins/globalSocket";
import ScCard from "@repo/components/ScCard/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { ScDialog } from "@repo/components/ScDialog";

// 样式导入
import "@/styles/threshold.scss";
import "@/styles/theme-common.scss";
import "@repo/assets/fonts/iconfont.css";
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/styles/layout/default/index.scss";
import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "@repo/assets/styles/modern-page.scss";
import "element-plus/dist/index.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

createStandardApp({
  enableElementPlusX: true,
  components: { ScCard, ScSwitch, ScDialog },
  socketPlugins: [GlobalSocketPlugin],
  socketSetup: setupFullscreenSocket,
  setup: (app) => setupDirectives(app),
}).then((bootstrap) => bootstrap.mount("#app"));
