/**
 * ReScrollbar —— 自定义滚动条组件
 *
 * 支持横向/纵向滚动、自定义样式
 *   <ReScrollbar height="400px"><div>...</div></ReScrollbar>
 */
import type { App, Plugin } from "vue";
import ReScrollbar from "./src/index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReScrollbar", ReScrollbar);
  },
};

export { plugin as install };
export default ReScrollbar;