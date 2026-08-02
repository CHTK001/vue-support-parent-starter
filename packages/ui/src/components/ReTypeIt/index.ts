/**
 * ReTypeIt —— 打字机效果组件
 *
 * 自实现，支持逐字打印、循环、删除、HTML
 *   <ReTypeIt :strings="['Hello', 'World']" />
 */
import type { App, Plugin } from "vue";
import ReTypeIt from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTypeIt", ReTypeIt);
  },
};

export { plugin as install };
export default ReTypeIt;