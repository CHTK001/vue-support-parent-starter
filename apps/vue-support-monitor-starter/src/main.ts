<<<<<<< HEAD
// 拦截 @mmt817/pixel-ui 的 banner 打印，避免控制台噪音
const _consoleInfo = console.info;
console.info = (...args: any[]) => {
  const first = args[0];
  if (typeof first === "string" && (first.includes("MMT") || first.includes("mmt817") || first.includes("pixel-ui"))) return;
  _consoleInfo(...args);
};

=======
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
import { createStandardApp } from "@repo/core";
import { setupDirectives } from "./directives";
import GlobalSocketPlugin from "./plugins/globalSocket";
import { ScCard } from "@repo/components"
import { ScSwitch } from "@repo/components"
// 应用专属样式
import "@/styles/threshold.scss";
import "@/styles/theme-common.scss";
import "@repo/assets/fonts/iconfont.js";
<<<<<<< HEAD
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
=======
import "@repo/assets/style/modern-page.scss";

createStandardApp({
  enableElementPlusX: true,
  enableWasm: false,
  enableFullscreenSocket: true,
  fontEncryption: { enabled: true, applyGlobal: true, ocrNoise: { level: "medium" } },
  components: { ScCard, ScSwitch },
  plugins: [GlobalSocketPlugin],
  setup: async (app) => {
    setupDirectives(app);
  },
}).then(async (bootstrap) => bootstrap.mount("#app"));
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
