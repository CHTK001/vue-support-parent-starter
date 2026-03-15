import { createStandardApp } from "@repo/core/src/standard-app";
import { setupDirectives } from "./directives";
import { setupFullscreenSocket } from "./plugins/fullscreenSocket";
import GlobalSocketPlugin from "./plugins/globalSocket";
import ScCard from "@repo/components/ScCard/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScDialog from "@repo/components/ScDialog";
import { useFontEncryption } from "@layout/default";

// 样式导入
import "@/styles/threshold.scss";
import "@/styles/theme-common.scss";
import "@repo/assets/fonts/iconfont.css";
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/style/layout/default/index.scss";
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "@repo/assets/style/modern-page.scss";
import "@repo/assets/scss/font-encryption.scss";
import "element-plus/dist/index.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

createStandardApp({
  enableElementPlusX: true,
  enableWasm: false,
  components: { ScCard, ScSwitch, ScDialog },
  setup: async (app, config) => {
    setupDirectives(app);
    app.use(GlobalSocketPlugin);

    const { router } = await import("@repo/core");
    setupFullscreenSocket(router);

    // 全局启用字体加密
    useFontEncryption({
      enabled: true,
      applyGlobal: true,
      ocrNoise: { level: "medium" },
    });
  },
}).then((bootstrap) => bootstrap.mount("#app"));
