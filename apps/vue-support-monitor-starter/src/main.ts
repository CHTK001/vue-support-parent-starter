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
import "@repo/assets/style/layout/default/index.scss";
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "@repo/assets/style/modern-page.scss";
import "element-plus/dist/index.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

createStandardApp({
  enableElementPlusX: true,
  components: { ScCard, ScSwitch, ScDialog },
  setup: async (app, config) => {
    setupDirectives(app);
    app.use(GlobalSocketPlugin);

    const { router } = await import("@repo/core");
    setupFullscreenSocket(router);
  },
}).then((bootstrap) => bootstrap.mount("#app"));
