/**
 * ReTreeSelect —— 树形下拉组件（el-tree-select 封装）
 */
import type { App, Plugin } from "vue";
import ReTreeSelect from "./ReTreeSelect.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTreeSelect", ReTreeSelect);
  },
};

export { plugin as install };
export default ReTreeSelect;