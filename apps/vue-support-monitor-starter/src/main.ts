import { createStandardApp } from "@repo/core";
import { setupDirectives } from "./directives";
import GlobalSocketPlugin from "./plugins/globalSocket";
import ScCard from "@repo/components";
import ScSwitch from "@repo/components";

// 应用专属样式
import "@/styles/threshold.scss";
import "@/styles/theme-common.scss";
import "@repo/assets/fonts/iconfont.js";
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
