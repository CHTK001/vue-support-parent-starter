/**
 * ReTableColumn —— 表格列组件（el-table-column 封装）
 */
import type { App, Plugin } from "vue";
import ReTableColumn from "./ReTableColumn.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTableColumn", ReTableColumn);
  },
};

export { plugin as install };
export default ReTableColumn;