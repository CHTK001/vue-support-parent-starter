/**
 * ReCol —— 栅格列组件（el-col 封装）
 */
import type { App, Plugin } from "vue";
import ReCol from "./ReCol.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReCol", ReCol);
  },
};

export { plugin as install };
export default ReCol;
