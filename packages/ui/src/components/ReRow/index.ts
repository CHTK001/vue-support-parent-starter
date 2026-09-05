/**
 * ReRow —— 栅格行组件（el-row 封装）
 */
import type { App, Plugin } from "vue";
import ReRow from "./ReRow.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRow", ReRow);
  },
};

export { plugin as install };
export default ReRow;
