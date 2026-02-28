import { createStandardApp } from "@repo/core";
import { autoRegisterThemePlugins, initThemeSystem } from "@repo/components";

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

createStandardApp({
  setup: async (app) => {
    // 根据主题配置自动注册需要的插件（例如 PixelUI）
    await autoRegisterThemePlugins(app);
    // 预加载当前主题（根据 data-skin / systemTheme）
    await initThemeSystem();
  },
}).then((bootstrap) => bootstrap.mount("#app"));
