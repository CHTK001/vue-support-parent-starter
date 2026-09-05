/**
 * ReDescriptions —— 描述列表组件（el-descriptions 封装）
 */
import type { App, Plugin } from "vue";
import ReDescriptions from "./ReDescriptions.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReDescriptions", ReDescriptions);
  },
};

export { plugin as install };
export default ReDescriptions;