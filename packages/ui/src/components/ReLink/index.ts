/**
 * ReLink —— 链接组件（el-link 封装）
 */
import type { App, Plugin } from "vue";
import ReLink from "./ReLink.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReLink", ReLink);
  },
};

export { plugin as install };
export default ReLink;