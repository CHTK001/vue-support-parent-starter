// 初始化全局环境变量，避免 ElementPlusX 加载时出现 undefined 错误
if (typeof process === "undefined") {
  (globalThis as any).process = { env: {} };
}
if (!process.env) {
  process.env = {};
}

// 拦截 @mmt817/pixel-ui 的 banner 打印，避免控制台噪音
const _consoleInfo = console.info;
console.info = (...args: any[]) => {
  const first = args[0];
  if (
    typeof first === "string" &&
    (first.includes("MMT") ||
      first.includes("mmt817") ||
      first.includes("pixel-ui"))
  )
    return;
  _consoleInfo(...args);
};

import { createStandardApp } from "@repo/core";
import { setupDirectives } from "./directives";
import GlobalSocketPlugin from "./plugins/globalSocket";
import { ScCard } from "@repo/components";
// 应用专属样式
import "@/styles/threshold.scss";
import "@/styles/theme-common.scss";
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/styles/layout/default/index.scss";
import "@repo/assets/styles/layout/default/reset.scss";
import "@repo/assets/styles/layout/default/tailwind.css";
import "@repo/assets/styles/modern-page.scss";
import "element-plus/dist/index.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

const bootstrap = createStandardApp({
  enableElementPlusX: true,
  components: { ScCard },
  socketPlugins: [GlobalSocketPlugin],
  setup: (app) => setupDirectives(app),
});

bootstrap.mount("#app");

// 清理加载器
const style = document.querySelector("style");
if (style && style.textContent?.includes("sys-loader")) {
  style.remove();
}
